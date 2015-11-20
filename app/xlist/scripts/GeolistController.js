angular
  .module('xlist')
  .controller('GeolistController',
      ['$scope', '$q', 'supersonic', 'GeoList', 'Task', 'deviceReady',
       'slackbot', 'push', 'ParseObject',
  function($scope, $q, supersonic, GeoList, Task, deviceReady, slackbot, push,
           ParseObject) {

    $scope.geolists = [];

    var getGeolists = function() {
      var newGeolists = [];
      new Parse.Query(GeoList).each(function(result) {
        $scope.$apply(function($scope) {
          newGeolists.push(new ParseObject(result, GeoList.fields));
        });
      }).then(function() {
        $scope.$apply(function($scope) {
          $scope.geolists = _.sortBy(newGeolists, function(Geolist) { 
            return Geolist.name.toLowerCase();
          });
        });
      });
    };

    supersonic.ui.views.current.whenVisible(getGeolists);

  }]);