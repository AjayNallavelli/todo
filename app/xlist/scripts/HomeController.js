angular
  .module('xlist')
  .controller('HomeController',
      ['$scope', '$q', 'supersonic', 'GeoList', 'Task', 'deviceReady',
       'slackbot', 'push', 'locationService', 'ParseObject',
  function($scope, $q, supersonic, GeoList, Task, deviceReady, slackbot, push,
           locationService, ParseObject) {
    $scope.pairs = [];
    $scope.activePairTasks = [];
    $scope.os = '';

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
        message: 'Enter the name of list whose location you want to simulate'
      }).then(function(result) {
        if (result.buttonIndex === 0) {
          var pair = _.find($scope.pairs, function(pair) {
            return pair.geoList.name.toLowerCase() ===
                result.input.toLowerCase();
          });
          if (pair) {
            locationService.override(pair.geoList.location);
            supersonic.ui.dialog.alert('Set Location', {
              message: 'Location set to location of ' + pair.geoList.name + '.'
            });
          } else {
            supersonic.ui.dialog.alert('Set Location', {
              message: 'No such list found.'
            });
          }
        }
      });
    };

    var pushNear = function(pair) {
      var now = new Date().getTime();
      var nextNotification = pair.geoList.nextNotification;
      if (!nextNotification || now > nextNotification) {
        pair.geoList.nextNotification = now + 1000 * 90;
        pair.geoList.save();
        var incomplete = _.filter(pair.tasks, function(task) {
          return !task.done;
        }).length;
        if (incomplete) {
          var message = 'Pick up ' + incomplete + ' item' +
              (incomplete > 1 ? 's' : '') + ' at ' + pair.geoList.name + '.';
          push.send({
            title: 'ToDo',
            message: message
          });
          slackbot('ToDo: ' + message);
        }
      }
    };

    var THRESHOLD = 0.25;

    var findNearAndPassLocation = function(location) {
      _.each($scope.pairs, function(pair) {
        var distance = getDistance(location, pair.geoList.location);
        if (distance < THRESHOLD) {
          pushNear(pair);
        }
      });
    };

    var alertParseError = function(error) {
      supersonic.ui.dialog.alert('Error: ' + error.code + ' ' + error.message);
    };

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
          }, alertParseError);
      return deferred.promise;
    };

    var initialize = function() {
      deviceReady().then(function() {
        if (cordova.plugins.backgroundMode) {
          cordova.plugins.backgroundMode.configure({
            silent: true
          });
          cordova.plugins.backgroundMode.enable();
          if (!cordova.plugins.backgroundMode.isEnabled()) {
            supersonic.ui.dialog.alert('Failed to enable background mode.');
          }
        }
        window.setInterval(function() {
          locationService.get().then(findNearAndPassLocation);
        }, 10 * 1000);

        var newPairs = [];
        var queryGeoLists = new Parse.Query(GeoList)
          .equalTo('uuid', device.uuid);

        queryGeoLists.each(function(geoList) {
          return getTasks(geoList).then(function(tasks) {
            newPairs.push({
              geoList: new ParseObject(geoList, GeoList.fields),
              tasks: tasks
            });
          });
        }).then(function() {
          $scope.pairs = _.sortBy(newPairs, function(pair) {
            return pair.geoList.name;
          });
        });

        $scope.os = getMobileOperatingSystem();
      });
    };

    $scope.reload = initialize;

    /*
    User presses add item, taps a field other than the new item -> The new todo
        item is deleted (android, iphone)
    User presses add item, taps the delete button of the new item -> The new
        todo item is deleted (android, iphone)
    User presses add item, taps the delete button of an item other than the new
        item -> Both items are deleted (android, iphone)
    User presses add item, taps new item field, taps a field other than the new
        item -> The new todo item is deleted (android, iphone)
    User presses add item, taps new item field, taps the delete button of the
        new item -> The new todo item is deleted (android, iphone)
    User presses add item, taps new item field, taps the delete button of an
        item other than the new item-> Both items are deleted (android, iphone)
    User presses add item, taps new item field, types, taps a field other than
        the new item -> the new todo item is saved (android, iphone)
    User presses add item, taps new item field, types, taps the delete button of
        the new item -> The new todo item is deleted (item not
        deleted in database on iphone and android)
    User presses add item, taps new item field, types, taps the delete button of
        an item other than the new item -> The new todo item is saved, the other
        todo item is deleted (android, iphone)
    User taps existing item field, backspaces entire text, taps a different
        field -> The todo item is deleted (android, iphone)
    User taps existing item field, backspaces entire text, taps the delete
        button of a different item -> Both items are deleted (android, iphone)
    User taps existing item field, types, taps a different field -> the todo
        item is saved (android, iphone)
    User taps existing item field, types, taps the delete button of a different
        field -> the todo item is saved, he deleted the other item (android,
        iphone)
    */

    var taskId = function(pair, task) {
      return 'task-' + pair.geoList.data.id + '-' +
          (task.data.uiid || task.data.id);
    };

    var makeDebounceQueue = function(enqueue, dequeue, terminate) {
      var queue = [];
      var debouncedFlush = _.debounce(function() {
        while (queue.length) {
          var dequeued = queue.shift();
          dequeue(dequeued);
        }
        if (terminate) {
          terminate();
        }
      }, 100);
      return function() {
        queue.push(enqueue.apply(this, arguments));
        debouncedFlush();
      };
    };

    var queueDeleteTask = makeDebounceQueue(
        function(pair, task) {
          return {pair: pair, task: task};
        },
        function(dequeued) {
          var index = dequeued.pair.tasks.indexOf(dequeued.task);
          if (index >= 0) {
            $scope.$apply(function($scope) {
              dequeued.pair.tasks.splice(index, 1);
            });
            if (!dequeued.task.data.isNew()) {
              dequeued.task.delete().then(function() {
                if (!dequeued.pair.tasks.length) {
                  congratsAlert();
                }
              }, alertParseError);
            }
          }
        });

    var hybridFieldValue = function(element) {
      return (element.tagName === 'P' ? element.innerText : element.value)
          .trim();
    };

    var alreadySaved = [];

    var queueSaveTask = makeDebounceQueue(
        function(pair, task) {
          return {pair: pair, task: task};
        },
        function(dequeued, state) {
          var pair = dequeued.pair;
          var task = dequeued.task;
          if (alreadySaved.indexOf(task.data.id) < 0) {
            alreadySaved.push(task.data.id);
          } else {
            console.log('already saved in this flush');
            return;
          }
          var element = document.getElementById(taskId(pair, task));
          var newName = hybridFieldValue(element);
          if (newName.length) {
            $scope.$apply(function($scope) {
              task.name = newName;
              if (element.tagName === 'P') {
                element.innerText = newName;
              }
              task.done = false;
            });
            task.save().then(function() {
              if (document.activeElement.id === element.id) {
                element.blur();
              }
            }, alertParseError);
          } else {
            queueDeleteTask(pair, task);
          }
        }, function() {
          alreadySaved.splice(0, alreadySaved.length);
        });

    var findActivePairTask = function(pair, task) {
      return _.findIndex($scope.activePairTasks, function(pairTask) {
        return pairTask.pair === pair && pairTask.task === task;
      });
    };

    var pushActivePairTask = function(pair, task) {
      if (findActivePairTask(pair, task) < 0) {
        $scope.activePairTasks.push({pair: pair, task: task});
      }
    };

    var removeActivePairTask = function(pair, task) {
      var index = findActivePairTask(pair, task);
      if (index >= 0) {
        $scope.activePairTasks.splice(index, 1);
        queueSaveTask(pair, task);
      }
    };

    var clearActivePairTasks = function() {
      while ($scope.activePairTasks.length) {
        var pairTask = $scope.activePairTasks.shift();
        queueSaveTask(pairTask.pair, pairTask.task);
      }
    };

    var clearActivePairTasksExcluding = function(pair, task) {
      var matched = 0;
      while ($scope.activePairTasks.length - matched) {
        var pairTask = $scope.activePairTasks[0];
        if (pairTask.pair === pair && pairTask.task === task) {
          matched++;
        } else {
          $scope.activePairTasks.shift();
          queueSaveTask(pairTask.pair, pairTask.task);
        }
      }
    };

    $scope.addTask = function(pair) {
      var task = new ParseObject(new Task(), Task.fields);
      task.name = '';
      task.category = '';
      task.done = false;
      task.geoList = pair.geoList.data.toPointer();
      task.data.uiid = Date.now();
      pair.tasks.push(task);
      pushActivePairTask(pair, task);
    };

    $scope.taskKey = function(event, pair, task) {
      if ((event.keyCode || event.which) === 13) {
        event.preventDefault();
        removeActivePairTask(pair, task);
      }
    };

    $scope.taskFocus = function(pair, task) {
      pushActivePairTask(pair, task);
      clearActivePairTasksExcluding(pair, task);
    };

    $scope.taskBlur = function(pair, task) {
      removeActivePairTask(pair, task);
    };

    $scope.deleteTask = function(pair, task) {
      if (document.activeElement) {
        document.activeElement.blur();
      }
      clearActivePairTasks();
      queueDeleteTask(pair, task);
    };

    $scope.toggleTask = function(pair, task) {
      task.done = !task.done;
      task.save().then(function(results) {
        if (allTasksDone(pair)) {
          congratsAlert();
        }
      }, alertParseError);
    };

    var congratsAlert = function() {
      var options = {
        message: 'You\'ve finished all your tasks!',
        buttonLabel: 'Hooray!'
      };
      supersonic.ui.dialog.alert('Congratulations!', options);
    };

    var allTasksDone = function(pair) {
      return _.every(pair.tasks, function(task) {
        return task.done;
      });
    };

    /**
     * Determine the mobile operating system.
     * This function either returns 'iOS', 'Android' or 'unknown'
     *
     * @returns {String}
     */
    var getMobileOperatingSystem = function() {
      var userAgent = navigator.userAgent || navigator.vendor || window.opera;

      if (userAgent.match(/iPad/i) || userAgent.match(/iPhone/i) ||
        userAgent.match(/iPod/i)) {
        return 'iOS';
      } else if (userAgent.match(/Android/i)) {
        return 'Android';
      } else {
        return 'unknown';
      }
    };

    supersonic.ui.views.current.whenVisible(initialize);
  }]);
