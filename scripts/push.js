var Parse = require('parse/node').Parse;
var _ = require('underscore');

Parse.initialize('', '');

var GeoList = Parse.Object.extend('GeoList');
var Task = Parse.Object.extend('Task');
var geoListQuery = new Parse.Query(GeoList).equalTo('uuid', process.argv[2]);

geoListQuery.first(function(geoList) {
  var taskQuery = new Parse.Query(Task).equalTo('geoList', geoList.toPointer());
  taskQuery.find(function(tasks) {
    var taskCount = _.countBy(tasks, function(task) {
      return task.get('done') ? 'complete' : 'incomplete';
    });
    var completeTasks = (taskCount.complete || 0);
    var incompleteTasks = (taskCount.incomplete || 0);
    var message = 'Pick up ' + incompleteTasks + ' item' +
                  (incompleteTasks > 1 ? 's' : '') + ' from your ' +
                  geoList.get('name') + '.';
    var options = {
      to: process.argv[3],
      data: {
        title: 'ToDo',
        message: message
      }
    };
    Parse.Cloud.run('sendPN', options).then(function(response) {
      console.log('success', response);
    }, function(response) {
      console.log('failure', response);
    });
  });
});
