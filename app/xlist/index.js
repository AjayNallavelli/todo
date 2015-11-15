angular
  .module('xlist', [
    // Declare here all AngularJS dependencies that are shared by the example module.
    'ParseServices',
    'supersonic',
    'uiGmapgoogle-maps'
  ])
  .config(['uiGmapGoogleMapApiProvider', function(uiGmapGoogleMapApiProvider) {
    uiGmapGoogleMapApiProvider.configure({
      key: 'AIzaSyBIQ2D3GaqQEbNIh3HbzEcf-fdYjR5r6So',
      v: '3.20', //defaults to latest 3.X anyhow
      libraries: 'places'
    });
  }]);
