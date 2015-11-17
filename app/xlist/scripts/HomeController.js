angular
  .module('xlist')
  .controller('HomeController',
      ['$scope', '$q', 'supersonic', 'Task', 'deviceReady', 'slackbot',
       'push', 'ParseObject', 'ParseQuery',
  function($scope, $q, supersonic, Task, deviceReady, slackbot, push,
           ParseObject, ParseQuery) {
    $scope.tasks = [];
    $scope.disableAdd = false;
    var fields = ['name', 'done', 'category', 'deadline'];

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
      return 1609 * d; // Returns the distance in miles.
    };

    var makeCoords = function(latitude, longitude) {
      return {latitude: latitude, longitude: longitude};
    };

    var presetLocations = {
      'wholefoods': makeCoords(42.046858, -87.679596),
      'slivka': makeCoords(42.060487, -87.675712),
      'ford': makeCoords(42.056924, -87.676544),
      'tech': makeCoords(42.057488, -87.675817)
    };

    var presetTasks = {
      'wholefoods': 'Buy milk.',
      'slivka': 'Do laundry.',
      'ford': 'Return the hot glue gun.',
      'tech': 'Turn in homework.'
    };

    var waitUntil = {
      'wholefoods': 0,
      'slivka': 0,
      'ford': 0,
      'tech': 0
    };

    $scope.setLocation = function() {
      var presets = [];
      for (var preset in presetLocations) {
        presets.push(preset);
      }
      console.log(presets);
      supersonic.ui.dialog.confirm('Set Location', {
        message: 'Choose one of the following preset locations.',
        buttonLabels: presets
      }).then(function(buttonIndex) {
        overrideLocation = presetLocations[presets[buttonIndex]];
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

    var THRESHOLD = 50;

    var findNear = function(location) {
      var slackbotNear = function(preset) {
        var now = new Date().getTime();
        if (now > waitUntil[preset]) {
          waitUntil[preset] = now + 1000 * 90;
          push.send({
            title: 'You are near ' + preset + '.',
            message: presetTasks[preset]
          });
          slackbot('You are near ' + preset + '. ' + presetTasks[preset]);
        }
      };
      for (var preset in presetLocations) {
        var distance = getDistance(location, presetLocations[preset]);
        if (distance < THRESHOLD) {
          deviceReady().then(_.partial(slackbotNear, preset));
        }
      }
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

    // supersonic.device.push.foregroundNotifications().onValue(
    //     function(notification) {
    //       supersonic.ui.dialog.alert('Push Notification', {
    //         message: JSON.stringify(notification)
    //       });
    //     });

    var getTasks = function() {
      var query = new Parse.Query(Task);
      ParseQuery(query, {functionToCall: 'find'})
        .then(function(results) {
          $scope.tasks = [];
          for (var i = 0; i < results.length; i++) {
            $scope.tasks.push(new ParseObject(results[i], fields));
            $scope.tasks[i].editing = false;
          }
        }, function(error) {
          supersonic.ui.dialog.alert(
            'Error: ' + error.code + ' ' + error.message);
        });
    };

    $scope.addTask = function() {
      var newTask = new ParseObject(new Task(), fields);
      newTask.name = '';
      newTask.category = '';
      newTask.done = false;
      newTask.editing = true;

      $scope.tasks.push(newTask);
      $scope.disableAdd = true;
    };

    var _focusIngredient = function(field, index) {
      var ingredient = index === 'new' ? $scope.newIngredient :
          $scope.ingredients[index];
      field = ingredient.quantity === undefined ? 'ingredient' : field;
      var element = document.getElementById(field + '-' + index.toString());
      element.focus();
    };

    $scope.taskEnter = function(event, index) {
      if (event.which === 13) {
        $scope.saveTask($scope.tasks[index], index);
        document.getElementById('task-' + index.toString()).blur();
      }
    };

    $scope.deleteTask = function(task) {
      task.delete()
      .then(function(result) {
        getTasks();
      }, function(error) {
        supersonic.ui.dialog.alert(
          'Error: ' + error.code + ' ' + error.message);
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

      supersonic.ui.dialog.confirm('Confirm', options)
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

    $scope.saveTask = function(task, index) {
      task.name = task.name.trim();
      if (task.name !== '') {
        task.done = false;

        task.save()
          .then(function(results) {
            task.editing = false;
          }, function(error) {
            supersonic.ui.dialog.alert(
                'Error: ' + error.code + ' ' + error.message);
          });
      } else {
        if (index == $scope.tasks.length - 1) {
          $scope.tasks.splice(index, 1);
        } else {
          $scope.deleteTask(task);
        }
      }

      $scope.disableAdd = false;
    };

    $scope.congratsAlert = function(task) {
      task.done = !task.done;
      task.save()
        .then(function(results) {
          if (_allTasksDone()) {
            var options = {
              message: 'You\'ve finished all your tasks!',
              buttonLabel: 'Hooray!'
            };
            supersonic.ui.dialog.alert('Congratulations!', options);
          }
          getTasks();
        }, function(error) {
          supersonic.ui.dialog.alert(
              'Error: ' + error.code + ' ' + error.message);
        });
    };

    var _allTasksDone = function() {
      for (var task in $scope.tasks) {
        if (!$scope.tasks[task].done) {
          return false;
        }
      }
      return true;
    };

    supersonic.ui.views.current.whenVisible(getTasks);
  }]);
