angular
  .module('xlist')
  .factory('push',
      ['$http', '$q', 'supersonic', 'deviceReady', 'gcmSenderId'
       function($http, $q, supersonic, deviceReady, gcmSenderId) {
    var registrationID = null;
    var afterRegistration = function() {
      var deferred = $q.defer();
      if (registrationID) {
        deferred.resolve(registrationID);
      } else {
        deviceReady().then(function() {
          window.plugins.pushNotification.register(
              function(newRegistrationID) {
                supersonic.logger.info(newRegistrationID);
                registrationID = newRegistrationID;
                deferred.resolve(registrationID);
              }, deferred.reject, {
                senderID: gcmSenderId
              });
        });
      }
      return deferred.promise;
    };
    var push = {};
    push.send = function(data) {
      afterRegistration().then(function(registrationID) {
        var options = {
          to: registrationID,
          data: data
        };
        Parse.Cloud.run('sendPN', options).then(
            supersonic.logger.info, supersonic.logger.err);
      });
    };
    return push;
  }]);
