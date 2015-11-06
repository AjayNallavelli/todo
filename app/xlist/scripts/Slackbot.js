angular
  .module('xlist')
  .factory('slackbot', ['$http', 'deviceReady', function($http, deviceReady) {
    return function(message) {
      deviceReady().then(function() {
        supersonic.logger.info(device.uuid + ' says ' + message);
        $http({
          method: 'POST',
          url: 'https://eecs394-red.slack.com' +
            '/services/hooks/slackbot?' +
            'token=yreGTkXgQas0VgnmG6KZCMUb&' +
            'channel=%23debug',
          data: message,
          headers: {
            'Content-Type': 'text/plain'
          }
        }).catch(supersonic.logger.err);
      });
    };
  }]);
