angular
  .module('todo')
  .factory('reloadTrigger', ['supersonic', function(supersonic) {
    var reloadTrigger = {};
    var channel = supersonic.data.channel('reload');
    reloadTrigger.bind = function(reload) {
      channel.subscribe(reload);
    };
    reloadTrigger.trigger = function() {
      channel.publish(Date.now().toString());
    };
    return reloadTrigger;
  }]);
