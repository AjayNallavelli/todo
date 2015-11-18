angular
  .module('xlist')
  .controller('HomeController',
      ['$scope', '$q', 'supersonic', 'GeoList', 'Task', 'deviceReady',
       'slackbot', 'push', 'ParseObject', 'ParseQuery',
  function($scope, $q, supersonic, GeoList, Task, deviceReady, slackbot, push,
           ParseObject, ParseQuery) {
    // $scope.taskLists = [];

    $scope.pairs = [];
    var overrideLocation = null;

    // Haversine formula for getting distance in miles.
    var getDistance = function(p1, p2) {
      var R = 6378137; // Earth’s mean radius in meter
      var degToRad = Math.PI / 180; // Degree to radian conversion.
      var dLat = (p2.latitude - p1.latitude) * degToRad;
      var dLong = (p2.longitude - p1.longitude) * degToRad;
      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.cos(p1.latitude * degToRad) * Math.cos(p2.latitude * degToRad) *
          Math.sin(dLong / 2) * Math.sin(dLong / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c; // d = distance in meters
      return d / 1609; // Returns the distance in miles.
    };

    $scope.setLocation = function() {
      supersonic.ui.dialog.prompt('Set Location', {
        message: 'Which list\'s location should the location be overridden by?',
      }).then(function(result) {
        if (result.buttonIndex === 0) {
          var pair = _.find($scope.pairs, function(pair) {
            return pair.geoList.name.toLowerCase() ===
                result.input.toLowerCase();
          });
          if (pair) {
            overrideLocation = pair.geoList.location;
          }
        }
      });
    };

    var getLocation = function() {
      var deferred = $q.defer();
      if (overrideLocation) {
        deferred.resolve(overrideLocation);
      }
      supersonic.device.geolocation.getPosition().then(function(position) {
        var hardwareLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        };
        deferred.resolve(hardwareLocation);
      }, deferred.reject);
      return deferred.promise;
    };

    var pushNear = function(geoList) {
      var now = new Date().getTime();
      var nextNotification = geoList.nextNotification;
      if (!nextNotification || now > nextNotification) {
        geoList.nextNotification = now + 1000 * 90;
        geoList.save();
        var incomplete = _.filter($scope.tasks, function(task) {
          return !task.done;
        }).length;
        if (incomplete) {
          var message = 'Pick up ' + incomplete + ' items at ' +
              geoList.get('name') + '.';
          push.send({
            title: 'ToDo',
            message: message
          });
          slackbot('ToDo: ' + message);
        }
      }
    };

    var THRESHOLD = 50;

    var findNear = function(location) {
      _.each($scope.pairs, function(pair) {
        var distance = getDistance(location, pair.geoList.location);
        if (distance < THRESHOLD) {
          pushNear(pair.geoList);
        }
      });
    };

    deviceReady().then(function() {
      cordova.plugins.backgroundMode.configure({
        silent: true
      });
      cordova.plugins.backgroundMode.enable();
      if (!cordova.plugins.backgroundMode.isEnabled()) {
        supersonic.ui.dialog.alert('Failed to enable background mode.');
      }
      window.setInterval(function() {
        getLocation().then(findNear);
      }, 10 * 1000);
    });

    var getTasks = function(geoList) {
      var deferred = $q.defer();
      var queryTasks = new Parse.Query(Task);
      queryTasks.equalTo('geoList', geoList.toPointer()).find()
          .then(function(results) {
            var tasks = [];
            for (var i = 0; i < results.length; i++) {
              tasks.push(new ParseObject(results[i], Task.fields));
              tasks[i].editing = false;
            }
            deferred.resolve(tasks);
          }, function(error) {
            supersonic.ui.dialog.alert(
              'Error: ' + error.code + ' ' + error.message);
          });
      return deferred.promise;
    };

    var initialize = function() {
      var newPairs = [];
      var queryGeoLists = new Parse.Query(GeoList);
      queryGeoLists.each(function(geoList) {
        getTasks(geoList).then(function(tasks) {
          newPairs.push({
            geoList: new ParseObject(geoList, GeoList.fields),
            tasks: tasks
          });
        });
      }).then(function() {
        $scope.pairs = newPairs;
      });
    };

    $scope.addTask = function() {
      var newTask = new ParseObject(new Task(), Task.fields);
      newTask.category = '';
      newTask.done = false;
      newTask.editing = true;

      $scope.tasks.push(newTask);
    };

    $scope.deleteTask = function(task) {
      var options = {
        message: 'Are you sure you wish to delete this task?',
        buttonLabels: ['Yes', 'No']
      };

      supersonic.ui.dialog.confirm('Confim', options)
        .then(function(index) {
          if (index === 0) {
            task.delete()
              .then(function(result) {
                getTasks();
              }, function(error) {
                supersonic.ui.dialog.alert(
                  'Error: ' + error.code + ' ' + error.message);
              });
          }
        });
    };

    $scope.editTask = function(task) {
      task.editing = true;
    };

    $scope.discardEdits = function(task) {
      var options = {
        message: 'Do you wish to discard changes?',
        buttonLabels: ['Yes', 'No']
      };

      supersonic.ui.dialog.confirm('Confim', options)
        .then(function(index) {
          if (index === 0) {
            task.fetch()
              .then(function() {
                task.editing = false;
              }, function(error) {
                supersonic.ui.dialog.alert(
                  'Error: ' + error.code + ' ' + error.message);
              });
          }
        });
    };

    $scope.saveTask = function(task) {
      task.done = false;

      task.save()
        .then(function(results) {
          task.editing = false;
        }, function(error) {
          supersonic.ui.dialog.alert(
              'Error: ' + error.code + ' ' + error.message);
        });
    };

    $scope.congratsAlert = function(task) {
      task.done = !task.done;
      task.save()
        .then(function(results) {
          if (task.done) {
            var options = {
              message: 'You finished a task!',
              buttonLabel: 'Close'
            };
            supersonic.ui.dialog.alert('Congratulations!', options);
          }
          getTasks();
        }, function(error) {
          supersonic.ui.dialog.alert(
              'Error: ' + error.code + ' ' + error.message);
        });
    };

    supersonic.ui.views.current.whenVisible(initialize);
  }]);
