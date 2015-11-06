angular
  .module('xlist')
  .controller('HomeController',
      ['$scope', '$q', 'supersonic', 'deviceReady', 'slackbot',
       function($scope, $q, supersonic, deviceReady, slackbot) {

    var overrideLocation = null;

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
      return d; // Returns the distance in meters.
    };

    var makeCoords = function(latitude, longitude) {
      return {latitude: latitude, longitude: longitude};
    };

    var presetLocations = {
      'wholefoods': makeCoords(42.046858, -87.679596),
      'slivka': makeCoords(42.060487, -87.675712),
      'ford': makeCoords(42.056924, -87.676544),
      'tech': makeCoords(42.057488, -87.675817)
    };

    $scope.setLocation = function() {
      supersonic.ui.dialog.prompt('Set Location', {
        message: 'Comma separated longitude and latitude ' +
            '(e.g. -87.679596,42.046858) or a preset location. Empty to ' +
            'stop overriding.'
      }).then(function(result) {
        if (result.buttonIndex === 0) {
          if (!result.input) {
            overrideLocation = null;
          } else if (presetLocations[result.input] !== undefined) {
            overrideLocation = presetLocations[result.input];
          } else {
            var raw = result.input.split(',');
            overrideLocation =
                makeCoords(parseFloat(raw[0]), parseFloat(raw[1]))
          }
        }
      });
    };

    var getLocation = function() {
      var deferred = $q.defer();
      if (overrideLocation) {
        deferred.resolve(overrideLocation);
      }
      supersonic.device.geolocation.getPosition().then(function(position) {
        var hardwareLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp
        }
        deferred.resolve(hardwareLocation);
      }, deferred.reject);
      return deferred.promise;
    };

    var THRESHOLD = 50;

    var findNear = function(location) {
      supersonic.logger.info(JSON.stringify(location));
      for (preset in presetLocations) {  
        var distance = getDistance(location, presetLocations[preset]);
        console.log(distance);
        if (distance < THRESHOLD) {
          deviceReady().then(_.partial(function(preset) {
            slackbot(device.uuid + ' is near ' + preset);
          }, preset));
        }
      }
    };

    deviceReady().then(function() {
      cordova.plugins.backgroundMode.configure({
        silent: true
      });
      cordova.plugins.backgroundMode.enable();
      if (!cordova.plugins.backgroundMode.isEnabled()) {
        supersonic.ui.dialog.alert('Failed to enable background mode.');
      }
      window.setInterval(function() {
        getLocation().then(findNear);
      }, 30 * 1000);
    });
  }]);
