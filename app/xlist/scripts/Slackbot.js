angular
  .module('xlist')
  .factory('slackbot', ['$http', 'deviceReady', function($http, deviceReady) {
    return function(message) {
      deviceReady().then(function() {
        var formatted = device.uuid + ' says ' + message;
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
