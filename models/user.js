var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { DateTime } = require('luxon');

var UserSchema = new Schema(
  {
    firstName: {type: String, required: true, maxlength: 100},
    lastName: {type: String, required: true, maxlength: 100},
    email: {type: String, required: true},
    username: {type: String},
    password: {type: String, required: true},
    joined: {type: Date, required: true},
    status: {type: String, enum: ['Member', 'Elite'], required: true},
    admin: {type: Boolean}
  }
);

//Virtual for User's joined date
UserSchema
.virtual('joined_formatted')
.get(function () {
  return DateTime.fromJSDate(this.joined).toLocaleString(DateTime.DATE_SHORT);
});

//Export model

module.exports = mongoose.model('User', UserSchema);