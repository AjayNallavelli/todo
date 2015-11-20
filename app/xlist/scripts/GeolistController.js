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

    supersonic.ui.views.current.whenVisible(getGeolists);

  }]);