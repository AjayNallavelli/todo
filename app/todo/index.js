angular
  .module('todo', [
    // Declare here all AngularJS dependencies that are shared by the example module.
    'ParseServices',
    'supersonic',
    'uiGmapgoogle-maps'
  ])
  .constant('googleMapsApiKey', '')
  .constant('gcmSenderId', '')
  .config(['uiGmapGoogleMapApiProvider', 'googleMapsApiKey',
      function(uiGmapGoogleMapApiProvider, googleMapsApiKey) {
        uiGmapGoogleMapApiProvider.configure({
          // YOUR API KEY GOES HERE
          key: 'your_api_key',
          v: '3.20', //defaults to latest 3.X anyhow
          libraries: 'places'
        });
      }]);
