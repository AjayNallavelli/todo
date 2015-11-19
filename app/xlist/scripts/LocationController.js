angular
  .module('xlist')
  .controller('LocationController',
      ['$scope', 'supersonic', 'deviceReady', 'GeoList', 'uiGmapGoogleMapApi',
  function($scope, supersonic, deviceReady, GeoList, uiGmapGoogleMapApi) {
    $scope.map = {
      center: {
        latitude: 0,
        longitude: 0
      },
      zoom: 16
    };
    $scope.markers = [];
    $scope.options = {
      autocomplete: true
    };

    var geoList = null;

    var setLocation = function(coords) {
      $scope.markers = [{
        id: 'id',
        coords: coords
      }];
      $scope.$apply(function($scope) {
        $scope.map.center.latitude = coords.latitude;
        $scope.map.center.longitude = coords.longitude;
      });
    };

    var placesChanged = function(searchBox) {
      var place = searchBox.getPlaces()[0];
      setLocation({
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      });
    };
    $scope.searchbox = {
      template: 'searchbox.tpl.html',
      events: {
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        places_changed: placesChanged
        // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
      }
    };

    var back = function() {
      if (geoList && $scope.markers.length) {
        geoList.save({
          location: new Parse.GeoPoint($scope.markers[0].coords)
        }).then(function() {
          supersonic.ui.layers.pop();
        });
      } else {
        supersonic.ui.layers.pop();
      }
    };

    var backButton = new supersonic.ui.NavigationBarButton({
      title: 'Save',
      onTap: back
    });

    supersonic.ui.navigationBar.update({
      title: 'ToDo',
      overrideBackButton: true,
      buttons: {
        left: [backButton]
      }
    });

    supersonic.device.buttons.back.whenPressed(back);

    var getGeoList = function() {
      supersonic.ui.views.current.params.onValue(function(params) {
        var queryGeoLists = new Parse.Query(GeoList);
        queryGeoLists.get(params.id).then(function(result) {
          geoList = result;
          var location = geoList.get('location');
          setLocation({
            latitude: location.latitude,
            longitude: location.longitude
          });
        });
      });
    };

    supersonic.ui.views.current.whenVisible(getGeoList);
  }]);
