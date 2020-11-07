var express = require('express');
var router = express.Router();
var async = require('async');
var User = require('../models/user');
var Message = require('../models/message');
const { body, validationResult } = require('express-validator');
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './main.env' });

/* GET home page. */
router.get('/', function (req, res, next) {
  async.parallel({
    countUsers: function (callback) {
      User.find({}, 'status admin')
        .exec(callback)
    },
    countMessages: function (callback) {
      Message.find({})
        .exec(callback)
    },
  }, function (err, results) {
    let users = results.countUsers.length;
    let elite = 0;
    let admin = 0;
    let messages = results.countMessages.length;
    for (let i = 0; i < results.countUsers.length; i++) {
      if (results.countUsers[i].status === 'Elite') {
        elite += 1;
      }
      if (results.countUsers[i].admin === true) {
        admin += 1;
      }
    }
    res.render('index', { users: users, elite: elite, admin: admin, messages: messages })
  })
});

//GET sign up form
router.get('/sign-up', function (req, res, next) {

  res.render('sign-up');
});
//POST sign up form
router.post('/sign-up', [

  (req, res, next) => {
    // Validate and sanitise fields.
    body('firstName', 'First Name must not be empty.').trim().isLength({ min: 1 }).escape(),
      body('lastName', 'Last Name must not be empty.').trim().isLength({ min: 1 }).escape(),
      body('email', 'Email must not be empty.').isEmail().normalizeEmail(),
      body('username').optional({ checkFalsy: true }).trim().escape(),
      body('password', 'Password must not be empty').isLength({ min: 1 }).escape(),
      body('passwordConfirm', 'Passwords must match').isLength({ min: 1 }).equals(req.body.password).escape(),
      body('memberPassword').optional({ checkFalsy: true }).trim().escape(),
      body('admin').optional({ checkFalsy: true }).trim().escape(),
      next();

  },
  //Process request after validation and sanitization
  (req, res, next) => {

    //Check for errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //errors, re-render form
      res.render('sign-up', { user: req.body, errors: errors.array() });
      return;
    } else {
      bcrypt.hash(req.body.password, 10, (err, hashedPassword) => {
        if (err) { return next(err); }
        else {
          //No errors, create new user
          let username;
          //Set username as email or entered username
          if (req.body.username == '') {
            let name = req.body.email;
            let end = name.indexOf('@');
            username = name.slice(0, end);
          } else {
            username = req.body.username;
          };
          //Set member status if password is correct
          let status;
          if (req.body.memberPassword === process.env.Member_PW) {
            status = 'Elite';
          } else { status = 'Member' };
          //set Admin status if password is correct
          let admin = false;
          if (req.body.admin === process.env.Admin_PW) {
            admin = true;
          };

          let user = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            username: username,
            password: hashedPassword,
            joined: new Date,
            status: status,
            admin: admin
          });

          user.save(function (err) {
            if (err) { return next(err); }
            //Success, redirect to login
            res.redirect('/log-in');
          })
        }
      });
    }
  }
]);

//GET login form
router.get('/log-in', function (req, res, next) {
  res.render('log-in', { msg: req.flash('error') });
});

//POST login form
router.post('/log-in',
  passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/log-in",
    failureFlash: 'Invalid username or password'
  })
);

router.get('/log-out', (req, res) => {
  req.logOut();
  res.redirect('/');
})

//GET message board
router.get('/message-board', function (req, res, next) {
  Message.find({})
  .populate('author')
  .exec(function(err, messages) {
    if (err) { return next(err); }
    res.render('message-board', { messages: messages });
  })
});

//POST for message board.  Trying to use modal.
router.post('/message-board', [
  (req, res, next) => {
    console.log(req.currentUser)
    body('title', 'Title must not be empty, or longer than 50 characters.').trim().isLength({ min: 1, max: 50 }).escape(),
      body('comment', 'Comment must not be empty, or longer than 250 characters.').trim().isLength({ min: 1, max: 250 }).escape(),
      next();
  },
  //Validated, continue
  (req, res, next) => {
    //Get errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      //Errors, re-render with error messages
      res.render('message-board', { errors: errors.array() });
    } else {
      //No errors, create message
      let message = new Message({
        title: req.body.title,
        comment: req.body.comment,
        author: req.body.author,
        date_posted: new Date
      }).save(function (err, result) {
        if (err) { return next(err); }
        //No errors, get all messages and authors by id
        async.parallel({
          messageList: function(callback) {
            Message.find({})
            .populate('author')
            .exec(callback)
          },
          authorList: function(callback) {
            User.find({})
            .exec(callback)
          }
        }, function(err, results) {
          res.redirect('/message-board');
        })
      })
    }
  }
]);

//GET for secret password if user isn't an elite member yet
router.get('/secret-password', function(req, res, next) {
  res.render('secret-password');
});

//POST for secret password
router.post('/secret-password', [
  //validate and sanitize form
  body('password', 'Sorry, try again!').trim().equals(process.env.Member_PW).escape(),
  body('username').escape(),

  (req, res, next) => {
    const errors = validationResult(req);
    //create a new user with the same id
    var user = new User({
      status: 'Elite',
      _id: req.body.username
    });

    if (!errors.isEmpty()) {
      //Errors, re-render form
      res.render('secret-password', {errors: errors});
    } else {
      //No errors, update user
      User.findByIdAndUpdate(req.body.username, user, function(err, result) {
        if (err) { return next(err); }
        res.redirect('/message-board');
      })
    }
  }
]);

module.exports = router;