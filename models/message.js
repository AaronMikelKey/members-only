var mongoose = require('mongoose');
var Schema = mongoose.Schema;
const { DateTime } = require('luxon');

var MessageSchema = new Schema(
  {
    title: {type: String, required: true, maxlength: 50},
    comment: {type: String, required: true, maxlength: 250},
    author: {type: Schema.Types.ObjectId, ref: 'User', required: true},
    date_posted: {type: Schema.Types.Date, required: true}
  }
)

//Virtual for date posted
MessageSchema
.virtual('date')
.get(function () {
  return DateTime.fromJSDate(this.date_posted).toLocaleString(DateTime.DATE_MED_WITH_WEEKDAY);
});

//Export model
module.exports = mongoose.model('Message', MessageSchema);