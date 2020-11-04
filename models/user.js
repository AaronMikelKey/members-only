var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { DateTime } = require('luxon');

var UserSchema = new Schema(
  {
    first_name: {type: String, required: true, maxlength: 100},
    last_name: {type: String, required: true, maxlength: 100},
    email: {type: String, required: true},
    joined: {type: Date, required: true},
    status: {type: String, enum: ['Member', 'Elite'], required: true},
    admin: {type: Boolean}
  }
);

//Virtual for User's username: user's email minus address
UserSchema
.virtual('username')
.get(function () {
  let name = this.email;
  let start = name.indexOf('@');
  let username = name.slice(start, name.length);
  return username;
});

//Export model

module.exports = mongoose.model('User', UserSchema);