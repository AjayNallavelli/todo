angular
  .module('xlist')
  .controller('ListController',
      ['$scope', '$q', 'supersonic', 'GeoList', 'Task', 'ParseObject',
  function($scope, $q, supersonic, GeoList, Task, ParseObject) {
    $scope.pairs = [];
    $scope.activePairTasks = [];
    $scope.os = '';

    $scope.showFakeNavbar = false;
    supersonic.ui.navigationBar.hide().then(function() {
      $scope.showFakeNavbar = true;
    });

    $scope.back = function() {
      supersonic.ui.layers.pop();
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
      supersonic.ui.views.current.params.onValue(function(params) {
        var newPairs = [];
        var queryGeoLists = new Parse.Query(GeoList);
        queryGeoLists.get(params.id).then(function(geoList) {
          getTasks(geoList).then(function(tasks) {
            newPairs.push({
              geoList: new ParseObject(geoList, GeoList.fields),
              tasks: tasks
            });
          });
        }).then(function() {
          $scope.$apply(function($scope) {
            $scope.pairs = newPairs;
          });
        });
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

    $scope.os = getMobileOperatingSystem();

    supersonic.ui.views.current.whenVisible(initialize);
  }]);
