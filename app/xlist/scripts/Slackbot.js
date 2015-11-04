angular
  .module('xlist')
  .factory('slackbot', ['$http', function($http) {
    return function(message) {
      $http({
        method: 'POST',
        url: 'http://eecs394-red.slack.com' +
          '/services/hooks/slackbot?' +
          'token=yreGTkXgQas0VgnmG6KZCMUb&' +
          'channel=%23debug',
        data: message,
        headers: {
          'Content-Type': 'text/plain'
        }
      });
    };
  }]);
