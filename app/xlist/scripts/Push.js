angular
  .module('xlist')
  .factory('push',
      ['$http', '$q', 'deviceReady', function($http, $q, deviceReady) {
    var registrationID = null;
    var afterRegistration = function() {
      var deferred = $q.defer();
      if (registrationID) {
        deferred.resolve(registrationID);
      } else {
        deviceReady().then(function() {
          supersonic.device.push.register({
            senderID: '1042561844220'
          }).then(function(newRegistrationID) {
            registrationID = newRegistrationID;
            deferred.resolve(registrationID);
          }, deferred.reject);
        }, deferred.reject);
      }
      return deferred.promise;
    };
    return {
      send: function(data) {
        afterRegistration().then(function(registrationID) {
          Parse.Cloud.run('sendPN', {data: data, to: registrationID}).then(
              supersonic.logger.info, supersonic.logger.err);
        });
      }
    };
  }]);
