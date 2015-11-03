angular
  .module('xlist')
  .controller('HomeController', function($scope, supersonic) {

    $scope.mylocation = {latitude: '', longitude: '', timestamp: ''};
    supersonic.device.geolocation.getPosition().then(function(position) {
      mylocation.latitude = position.coords.latitude;
      mylocation.longitude = position.coords.longitude;
      mylocation.timestamp = position.timestamp;
    });

    console.log(mylocation);

  });