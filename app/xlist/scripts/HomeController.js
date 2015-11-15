angular
  .module('xlist')
  .controller('HomeController',
      ['$scope', '$q', 'supersonic', 'Task', 'deviceReady', 'slackbot',
       'push',
  function($scope, $q, supersonic, Task, deviceReady, slackbot, push) {
    $scope.tasks = [];
    $scope.jsTasks = [];

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
      var queryTasks = new Parse.Query(Task);
      queryTasks.find({
        success: function(results) {
          $scope.$apply(function($scope) {
            $scope.tasks = [];
            $scope.jsTasks = [];
            for (var i = 0; i < results.length; i++) {
              $scope.tasks.push(results[i]);

              var currentTask = {
                name: results[i].get('name'),
                done: results[i].get('done'),
                deadline: results[i].get('deadline'),
                editing: false,
                edited: {
                  name: results[i].get('name'),
                  done: results[i].get('done'),
                  deadline: results[i].get('deadline'),
                }
              };
              $scope.jsTasks.push(currentTask);
            }
          });
        },
        error: function(error) {
          supersonic.ui.dialog.alert(
              'Error: ' + error.code + ' ' + error.message);
        }
      });
    };

    $scope.addTask = function() {
      var newParseTask = new Task();
      newParseTask.set('name', '');
      newParseTask.set('done', false);

      var newJSTask = {
        name: '',
        done: false,
        deadline: undefined,
        editing: true,
        edited: {
          name: '',
          done: false,
          deadline: undefined,
        }
      };

      $scope.tasks.push(newParseTask);
      $scope.jsTasks.push(newJSTask);
    };

    $scope.deleteTask = function(task) {
      var taskToDelete = $scope.tasks[task];
      task = taskToDelete;

      var options = {
        message: 'Are you sure you wish to delete this task?',
        buttonLabels: ['Yes', 'No']
      };

      supersonic.ui.dialog.confirm('Confim', options).then(function(index) {
        if (index === 0) {
          task.destroy({
            success: function(results) {
              getTasks();
              var options = {
                message: 'Task successfully deleted',
                buttonLabel: 'Close'
              };
              supersonic.ui.dialog.alert('Success', options);
            },
            error: function(results, error) {
              supersonic.ui.dialog.alert(
                'Error: ' + error.code + ' ' + error.message);
            }
          });
        }
      });
    };

    $scope.editTask = function(task) {
      task.editing = true;
    };

    $scope.discardEdits = function(index) {
      var options = {
        message: 'Do you wish to discard changes?',
        buttonLabels: ['Yes', 'No']
      };

      supersonic.ui.dialog.confirm('Confim', options).then(function(index) {
        if (index === 0) {
          var oldTask = {
            name: $scope.jsTasks[index].name,
            done: $scope.jsTasks[index].done,
            deadline: $scope.jsTasks[index].deadline,
            editing: false,
            edited: {
              name: $scope.jsTasks[index].name,
              done: $scope.jsTasks[index].done,
              deadline: $scope.jsTasks[index].deadline,
            }
          };

          $scope.jsTasks[index] = oldTask;
          $scope.apply();
        }
      });
    };

    $scope.saveTask = function(index) {
      var currentParseTask = $scope.tasks[index];
      var currentJSTask = $scope.jsTasks[index];

      currentParseTask.save({
        name: currentJSTask.edited.name,
        done: false,
        deadline: currentJSTask.edited.deadline
      }, {
        success: function(result) {
          var currentTask = {
            name: result.get('name'),
            done: result.get('done'),
            deadline: result.get('deadline'),
            editing: false,
            edited: {
              name: result.get('name'),
              done: result.get('done'),
              deadline: result.get('deadline'),
            }
          };

          $scope.jsTasks[index] = currentTask;
        },
        error: function(error) {
          supersonic.ui.dialog.alert(
                'Error: ' + error.code + ' ' + error.message);
        }
      });
    };

    $scope.congratsAlert = function(index) {
      var completedTask = $scope.tasks[index];
      var task = completedTask;

      task.save({
        done: !task.get('done')
      }, {
        success: function(results) {
          if (task.get('done')) {
            var options = {
              message: 'You finished a task!',
              buttonLabel: 'Close'
            };
            supersonic.ui.dialog.alert('Congratulations!', options);
          }
          getTasks();
        },
        error: function(error) {
          supersonic.ui.dialog.alert(
              'Error: ' + error.code + ' ' + error.message);
        }
      });
    };

    supersonic.ui.views.current.whenVisible(getTasks);
  }]);
