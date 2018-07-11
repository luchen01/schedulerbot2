var express = require('express');
var router = express();
var google = require('./googleCal');
var {Task, User, Meeting, InviteRequest} = require('../models/models');
var google = require('./googleCal');

router.post('/messagesAction', (req, res) =>{
  const data = JSON.parse(req.body.payload);
  const fieldsArr = data.original_message.attachments[0].fields;
  let user;
  console.log(data);
  User.findOne({slackId: data.user.id})
  .then(u => {
    user = u;
    console.log(fieldsArr);
    return google.createCalendarEvent(user.googleCalAccount,
      fieldsArr[0].value, fieldsArr[1].value
    )
  })
  .then(event => {
    console.log("IS this event in slack routes",event);
    let temp;
    switch(data.callback_id) {
      case 'reminder':
      temp = new Task({
        subject: data.original_message.attachments[0].fields[0].value,
        day: new Date(data.original_message.attachments[0].fields[1].value),
        requesterId: user.id,
        // googleCalEventId: ,
      });
      break;
      case 'schedule':
      temp = new Meeting({
        subject: data.original_message.attachments[0].fields[0].value,
        day: new Date(data.original_message.attachments[0].fields[1].value),
        requesterId: user.id,
        createdAt: new Date(),
        confirmed: false,
        // googleCalFields: ,
      });
      break;
      default:
      console.log('WTF YOU SHOULDNT BE HERE');
    }
    return temp.save()
  })
  .then(meeting => {
    if (data.callback_id === 'schedule') {
      var inviteeName = []
      var invitee = data.original_message.attachments[0].fields[0].value;
      inviteeName.push(invitee);
      console.log('inviteeName', inviteeName);
      console.log('data', data.original_message.attachments[0] );
      createInvite(inviteeName, meeting)
    }
  })
  .catch(err => console.log(err));
});

function createInvite(inviteeName, meeting){
      return inviteeName.forEach((invitee)=>{
        User.findOne({slackUsername: invitee})
        .then(user=>{
          var newRequest = new InviteRequest({
            eventId: meeting._id,
            inviteeId: user._id,
            requesterId: meeting.requesterId,
            confirmed: false,
          });
          newRequest.save()
      })
})
};

module.exports = router;
