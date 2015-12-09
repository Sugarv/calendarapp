// for future use:
// http://stackoverflow.com/questions/15161654/recurring-events-in-fullcalendar

CalEvent = new Meteor.Collection("calevent");
if (Meteor.isClient) {
  var fetchFromSchedule = function() {
    var fetch = Schedule.find({}).fetch();
    var days = fetch[0].schedule.day;
    var events = [];
    //console.log(days);
    var dayCnt = 0;
    _.each(days, function(day){
      _.each(day, function(slot){
        var newEvent = {};
        newEvent.title = 'slot';
        newEvent.start = slot;
        var tmpDate = moment(slot,"HH:mm").add(30,'minutes').format("HH:mm");
        newEvent.end = tmpDate;
        newEvent.color = 'green';
        newEvent.rendering = 'background';
        newEvent.allDay = 'false';
        newEvent.id = 'available';
        var tmp = [];
        tmp.push(dayCnt);
        newEvent.dow = tmp;
        events.push(newEvent);
      });
      dayCnt += 1;
    });
    //console.log(events.length);
    return events;
  }
  // dialog template
  Template.dialog.events({
    "click .closeDialog": function(event, template){
       Session.set('editing_event',null);
    },
    'click .updateEvent':function(evt,tmpl){
      var title = tmpl.find('#title').value;
      var start = tmpl.find('#start').value;
      var end = tmpl.find('#end').value;
      var data = {
        title: title,
        start: new Date(start),
        end: new Date(end)
      };
      Meteor.call('updateEvent',Session.get('editing_event'),data);
      Session.set('editing_event',null);
    },
    'click .deleteEvent': function (evt,tmpl){
      Meteor.call('deleteEvent',Session.get('editing_event'));
      Session.set('editing_event',null);
    }
  });
    Template.dialog.helpers({
    title: function(){
      var ce = CalEvent.findOne({_id:Session.get('editing_event')});
      return ce.title;
    },
    start: function(){
      var ce = CalEvent.findOne({_id:Session.get('editing_event')});
      console.log(ce.start);
      return ce.start;
    },
    end: function(){
      var ce = CalEvent.findOne({_id:Session.get('editing_event')});
      return ce.end;
    }
  });
  Template.dialog.onRendered(function(){
    if(Session.get('editing_event')){
      var calevent = CalEvent.findOne({_id:Session.get('editing_event')});
      if (calevent){
        $('#title').val(calevent.title);
      }
      this.$('.datetimepicker_s').datetimepicker({
        defaultDate: calevent.start,
        format: 'MM/DD/YYYY, hh:mm',
        stepping: 30,
        sideBySide: true,
        showClose: true
      });
      this.$('.datetimepicker_f').datetimepicker({
        defaultDate: calevent.end,
        format: 'MM/DD/YYYY, hh:mm',
        stepping: 30,
        sideBySide: true,
        showClose: true,
      });
    }
  });
  // main template
  Template.main.helpers({
    editing_event: function(){
      return Session.get('editing_event');
    },
    fetchSchedule: function() {
      return function(start, end, tz, callback) {
        var events = fetchFromSchedule();
        callback(events);
      }
    },
    calOptions: function() {
      return {
            defaultView: 'basicWeek',
            events: fetchSchedule
        };
    },
    onEventClicked: function() {
      return function(calEvent, jsEvent, view) {
        alert("Event clicked: "+calEvent.title);
      }
    },
    onDayClicked: function() {
      return function(date, jsEvent, view){
        if (jsEvent.target.classList.contains('fc-bgevent')) {
          console.log(date.format());
          console.log('bg clicked');
        }
      }
    }
  });
  Template.main.rendered= function () {
      var fc = this.$('.fc');
      this.autorun(function(){
         //CalEvent.find().fetch();
         fetchFromSchedule();
         fc.fullCalendar('refetchEvents');
      });
  }
}

if (Meteor.isServer) {
  Meteor.startup(function () {
    Meteor.methods({
      'saveCalEvent':function(ce){
         CalEvent.insert(ce);
      },
      'updateEvent': function(id,data){
        console.log(data);
        return CalEvent.update({_id:id}, {$set: {
          title: data.title,
          start:data.start,
          end: data.end
        }});
      },
      'moveEvent': function(reqEvent){
        return CalEvent.update({_id:reqEvent._id},{
          $set:{
            start: reqEvent.start,
            end: reqEvent.end
          }
        })
      },
      'deleteEvent': function(id){
        return CalEvent.remove({_id:id});
      }
    });
    });
}
