angular
  .module('xlist')
  .factory('slackbot', ['$http', function($http) {
    var deviceReady = false;
    document.addEventListener('deviceready', function () {
      deviceReady = true;
    });
    var _whenDeviceReady = function(callback) {
      if (deviceReady) {
        callback();
      } else {
        document.addEventListener('deviceready', callback);
      }
    };
    return function(message) {
      _whenDeviceReady(function() {
        formatted = device.uuid + ' says ' + message;
        supersonic.logger.info(formatted);
        $http({
          method: 'POST',
          url: 'https://eecs394-red.slack.com' +
            '/services/hooks/slackbot?' +
            'token=yreGTkXgQas0VgnmG6KZCMUb&' +
            'channel=%23debug',
          data: formatted,
          headers: {
            'Content-Type': 'text/plain'
          }
        }).catch(supersonic.logger.err);
      });
    };
  }]);
