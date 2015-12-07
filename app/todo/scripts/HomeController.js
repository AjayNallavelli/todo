angular
  .module('todo')
  .controller('HomeController',
      ['$scope', '$q', 'supersonic', 'GeoList', 'Task', 'locationService',
       'deviceReady', 'reloadTrigger', 'push', 'ParseObject',
  function($scope, $q, supersonic, GeoList, Task, locationService, deviceReady,
           reloadTrigger, push, ParseObject) {
    $scope.pairs = [];

    $scope.showFakeNavbar = false;
    supersonic.ui.navigationBar.hide().then(function() {
      $scope.showFakeNavbar = true;
    });

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

    var alertParseError = function(error) {
      supersonic.ui.dialog.alert('Error: ' + error.code + ' ' + error.message);
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

    $scope.addGeoList = function() {
      supersonic.ui.dialog.prompt('Add a new list', {
        message: 'Enter the name for the new list'
      }).then(function(result) {
        if (result.buttonIndex === 0) {
          var newGeoList = new ParseObject(new GeoList(), GeoList.fields);
          newGeoList.name = result.input;
          newGeoList.uuid = device.uuid;
          newGeoList.save().then(function() {
            $scope.pairs.push({
              geoList: newGeoList,
              tasks: [],
              completeTasks: 0,
              incompleteTasks: 0
            });
            var locationView = new supersonic.ui.View('todo#location');
            supersonic.ui.layers.push(locationView, {
              params: {
                id: newGeoList.data.id
              }
            });
          }).catch(alertParseError);
        }
      });
    };

    $scope.deleteGeoList = function(pair) {
      var taskCount = _.countBy(pair.tasks, function(task) {
        return task.done ? 'complete' : 'incomplete';
      });
      var confirmTitle = 'Are you sure you want to delete this list?';
      var confirmMessage = 'You have ' + (taskCount.incomplete || 0) +
      ' incomplete tasks on this list';

      var options = {
        message: confirmMessage,
        buttonLabels: ['Yes', 'No']
      };
      supersonic.ui.dialog.confirm(confirmTitle, options).then(function(index) {
        if (index === 0) {
          pair.geoList.delete().then(function() {
            var geoListIndex = $scope.pairs.indexOf(pair);
            if (geoListIndex > -1) {
              $scope.pairs.splice(geoListIndex, 1);
            }
          }, alertParseError);
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
              (incomplete > 1 ? 's' : '') + ' from your ' + pair.geoList.name +
              '.';
          push.send({
            title: 'ToDo',
            message: message
          });
        }
      }
    };

    var THRESHOLD = 0.25; // In miles.

    var findNearAndPassLocation = function(location) {
      _.each($scope.pairs, function(pair) {
        if (pair.geoList.location) {
          if (getDistance(location, pair.geoList.location) < THRESHOLD) {
            pushNear(pair);
          }
        }
      });
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
        var newPairs = [];
        var queryGeoLists = new Parse.Query(GeoList)
            .equalTo('uuid', device.uuid);
        queryGeoLists.each(function(geoList) {
          var pair = {
            geoList: new ParseObject(geoList, GeoList.fields),
          };
          newPairs.push(pair);
          getTasks(geoList).then(function(tasks) {
            pair.tasks = tasks;
            var taskCount = _.countBy(pair.tasks, function(task) {
              return task.done ? 'complete' : 'incomplete';
            });
            pair.completeTasks = (taskCount.complete || 0);
            pair.incompleteTasks = (taskCount.incomplete || 0);
          });
        }).then(function() {
          $scope.$apply(function($scope) {
            $scope.pairs = _.sortBy(newPairs, function(pair) {
              return pair.geoList.name.toLowerCase();
            });
          });
        });
      });
    };

    reloadTrigger.bind(initialize);
    angular.element(document).ready(initialize);

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
    });
  }]);
