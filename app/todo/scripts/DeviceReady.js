angular
  .module('todo')
  .factory('deviceReady', ['$q', function($q) {
    var deviceReady = false;
    document.addEventListener('deviceready', function() {
      deviceReady = true;
    }, false);
    return function() {
      var deferred = $q.defer();
      if (deviceReady) {
        deferred.resolve();
      } else {
        document.addEventListener('deviceready', deferred.resolve, false);
      }
      return deferred.promise;
    };
  }]);
