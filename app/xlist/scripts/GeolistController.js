angular
  .module('xlist')
  .controller('GeolistController',
      ['$scope', '$q', 'supersonic', 'GeoList', 'Task', 'deviceReady',
       'slackbot', 'push', 'ParseObject',
  function($scope, $q, supersonic, GeoList, Task, deviceReady, slackbot, push,
           ParseObject) {

    $scope.geolists = [];

    var getGeolists = function() {
      new Parse.Query(GeoList).find().then(function(results) {
        _.each(results, function(result)){
          $scope.geolists.push(new ParseObject(result, Geolist.fields))
        }
      });
    };

    var deleteTasks = function(geoList) {
      var deferred = $q.defer();
      var queryTasks = new Parse.Query(Task);
      queryTasks.equalTo('geoList', geoList.toPointer()).find()
          .then(function(results) {
            var tasks = [];
            for (var i = 0; i < results.length; i++) {
              tasks[i].geoList = null;
              tasks.push(new ParseObject(results[i], Task.fields));
            }
            deferred.resolve(tasks);
          }, alertParseError);
    };

    supersonic.ui.views.current.whenVisible(getGeolists);
  }]);