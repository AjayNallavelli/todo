angular
  .module('xlist')
  .controller('HomeController',
      ['$scope', 'supersonic', 'slackbot', function($scope, supersonic) {
    $scope.withinDistance = false;
    $scope.wholefoods = {latitude: '', longitude: '', timestamp: ''};
    $scope.wholefoods.latitude = 42.046858;
    $scope.wholefoods.longitude = -87.679596;
    $scope.mylocation = {latitude: '', longitude: '', timestamp: ''};

    document.addEventListener('deviceready', function () {
      cordova.plugins.backgroundMode.configure({
        silent: true
      })
      // Enable background mode
      cordova.plugins.backgroundMode.enable();

      if (cordova.plugins.backgroundMode.isEnabled()) {
        console.log('background mode enabled');
      }

      setInterval(function() {
        getLocation();
        console.log($scope.mylocation);
      }, 3000);

    }, false);

    var getLocation = function() {
      supersonic.device.geolocation.getPosition().then(function(position) {
        $scope.mylocation.latitude = position.coords.latitude;
        $scope.mylocation.longitude = position.coords.longitude;
        $scope.mylocation.timestamp = position.timestamp;
      });
    };


    window.setInterval(function() {
      slackbot('hello');
    }, 10 * 1000);

  }]);

