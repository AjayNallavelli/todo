angular
  .module('xlist')
  .factory('locationService',
      ['$q', 'supersonic', 'deviceReady',
  function($q, supersonic, deviceReady) {
    var location = {};
    var overrideLocation = null;
    var positionToLocation = function(position) {
      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        timestamp: position.timestamp
      };
    }
    location.override = function(location) {
      overrideLocation = location ? {
        latitude: location.latitude,
        longitude: location.longitude
      } : null;
    };
    location.get = function() {
      var deferred = $q.defer();
      if (overrideLocation) {
        deferred.resolve(overrideLocation);
      } else {
        deviceReady().then(function() {
          supersonic.device.geolocation.getPosition().then(function(position) {
            deferred.resolve(positionToLocation(position));
          }, deferred.reject);
        });
      }
      return deferred.promise;
    };
    location.watch = function(callback) {
      deviceReady().then(function() {
        supersonic.device.geolocation.watchPosition().onValue(
            function(position) {
              callback(positionToLocation(position));
            });
      });
    };
    return location;
  }]);
