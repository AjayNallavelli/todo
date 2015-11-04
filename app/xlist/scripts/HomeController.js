angular
  .module('xlist')
  .controller('HomeController',
      ['$scope', 'supersonic', 'slackbot', function($scope, supersonic, slackbot) {
    $scope.withinDistance = false;
    $scope.wholefoods = {latitude: '', longitude: '', timestamp: ''};
    $scope.wholefoods.latitude = 42.046858;
    $scope.wholefoods.longitude = -87.679596;
    $scope.mylocation = {latitude: '', longitude: '', timestamp: ''};

    var getDistance = function() {
      setInterval(function(){
        supersonic.device.geolocation.getPosition().then(function(position) {
          $scope.mylocation.latitude = position.coords.latitude;
          $scope.mylocation.longitude = position.coords.longitude;
          $scope.mylocation.timestamp = position.timestamp;
        });
        if ((Math.abs($scope.wholefoods.latitude - $scope.mylocation.latitude) < 1) && (Math.abs($scope.wholefoods.longitude - $scope.mylocation.longitude) < 1)) {
          $scope.withinDistance = true;
        }
      }, 60 * 1000);
    };
    getDistance();

  }]);