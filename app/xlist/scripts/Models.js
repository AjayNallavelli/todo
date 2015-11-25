angular
  .module('xlist')
  .constant('Task', _.extend(
      Parse.Object.extend('Task'),
      {fields: ['name', 'done', 'geoList']}))
  .constant('GeoList', _.extend(
      Parse.Object.extend('GeoList'),
      {fields: ['uuid', 'location', 'name', 'nextNotification', 'storeName',
                'address']}));
