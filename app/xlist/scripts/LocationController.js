angular
  .module('xlist')
  .controller('LocationController',
      ['$scope', 'supersonic', 'deviceReady', 'uiGmapGoogleMapApi',
  function($scope, supersonic, deviceReady, uiGmapGoogleMapApi) {
    $scope.map = null;
    $scope.markers = [];
    $scope.options = {
      autocomplete: true
    };
    var placesChanged = function(searchBox) {
      var place = searchBox.getPlaces()[0];
      var marker = {
        id: 'id',
        coords: {
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        }
      };
      $scope.map.center = marker.coords;
      $scope.map.zoom = 16;
      $scope.markers = [marker];
    };
    $scope.searchbox = {
      template: 'searchbox.tpl.html',
      events: {
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        places_changed: placesChanged
        // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
      }
    };
    supersonic.ui.views.current.whenVisible(function() {
      deviceReady().then(function() {
        supersonic.device.geolocation.getPosition().then(function(position) {
          $scope.map = {
            center: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            },
            zoom: 12
          };
        });
      });
    });
  }]);
