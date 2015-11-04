angular
  .module('xlist')
  .controller('HomeController',
      ['$scope', 'supersonic', 'slackbot',
      function($scope, supersonic, slackbot) {
    $scope.wholefoods = {latitude: 42.046858, longitude: -87.679596};
    $scope.slivka = {latitude: 42.060487, longitude: -87.675712};
    $scope.ford = {latitude: 42.056924, longitude: -87.676544};
    $scope.tech = {latitude: 42.057488, longitude: -87.675817};
    $scope.mylocation = {latitude: '', longitude: '', timestamp: ''};

    document.addEventListener('deviceready', function() {
      cordova.plugins.backgroundMode.configure({
        silent: true
      });
      // Enable background mode
      cordova.plugins.backgroundMode.enable();

      if (cordova.plugins.backgroundMode.isEnabled()) {
        console.log('background mode enabled');
      }

      var distance = 0;
      setInterval(function() {
        getLocation();
        console.log($scope.mylocation);
        distance = getDistance($scope.mylocation, $scope.tech);
        console.log(distance);
        if (distance < 60) {
          slackbot('near tech');
        }
        distance = getDistance($scope.mylocation, $scope.ford);
        console.log(distance);
        if (distance < 60) {
          slackbot('near ford');
        }
      }, 10000);

    }, false);

    var getLocation = function() {
      supersonic.device.geolocation.getPosition().then(function(position) {
        $scope.mylocation.latitude = position.coords.latitude;
        $scope.mylocation.longitude = position.coords.longitude;
        $scope.mylocation.timestamp = position.timestamp;
      });
    };

    // Haversine formula for getting distance in miles
    var getDistance = function(p1, p2) {
      var R = 6378137; // Earth’s mean radius in meter
      var degToRad = Math.PI / 180; // degree to radian conversion
      var dLat = (p2.latitude - p1.latitude) * degToRad;
      var dLong = (p2.longitude - p1.longitude) * degToRad;

      var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(p1.latitude * degToRad) * Math.cos(p2.latitude * degToRad) *
        Math.sin(dLong / 2) * Math.sin(dLong / 2);
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      var d = R * c; // d = distance in meters
      return d; // returns the distance in meters
      // return d / 1609; // returns the distance in miles
    };
  }]);
