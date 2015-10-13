CalEvent = new Meteor.Collection("calevent");
if (Meteor.isClient) {
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
        showClose: true
      });
    }
  });
  // main template
  Template.main.helpers({
    editing_event: function(){
      return Session.get('editing_event');
    }
  });
  Template.main.rendered= function () {
      var calendar = $('#calendar').fullCalendar({
        dayClick: function(date, allDay, jsEvent, view){
          var calendarEvent = {};
          calendarEvent.start = date;
          calendarEvent.end = date;
          calendarEvent.title = 'New Event';
          calendarEvent.owner = Meteor.userId();
          Meteor.call('saveCalEvent', calendarEvent);
        },
        eventClick:function(calEvent,jsEvent,view){
          Session.set('editing_event',calEvent._id);
          $('#title').val(calEvent.title);
        },
        eventDrop:function(reqEvent){
          Meteor.call('moveEvent',reqEvent);
        },
        events: function(start,end,callback){
          var calEvents = CalEvent.find({},{reactive:false}).fetch();
          callback(calEvents);
        },
        editable: true,
        selectable: true
      }).data().fullCalendar;
      Deps.autorun(function(){
         CalEvent.find().fetch();
         if (calendar){
           calendar.refetchEvents();
         }
      })
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
