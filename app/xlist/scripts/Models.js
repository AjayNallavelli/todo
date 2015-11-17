angular
  .module('xlist')
  .constant('Task', _.extend(
      Parse.Object.extend('Task'),
      {fields: ['name', 'done', 'category', 'deadline']}))
  .constant('GeoList', _.extend(
      Parse.Object.extend('GeoList'),
      {fields: []}));
