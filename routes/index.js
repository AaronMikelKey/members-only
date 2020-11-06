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
    countUsers: function(callback) {
      User.find({}, 'status admin')
      .exec(callback)
    },
    countMessages: function(callback) {
      Message.find({})
      .exec(callback)
    }, 
  }, function(err, results) {
    let users = results.countUsers.length;
    let elite=0;
    let admin=0;
    let messages= results.countMessages.length;
    for (let i=0;i<results.countUsers.length;i++) {
      if (results.countUsers[i].status === 'Elite') {
        elite +=1;
      }
      if (results.countUsers[i].admin === true) {
        admin +=1;
      }
    }
    console.log(results);
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
  res.send('not yet implemented');
})

module.exports = router;