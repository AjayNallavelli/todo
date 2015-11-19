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

    var geoList = null;

    var setLocation = function(coords, locationDetails) {
      $scope.markers = [{
        id: 'id',
        coords: coords,
        locationDetails: locationDetails
      }];
      $scope.$apply(function($scope) {
        $scope.map.center.latitude = coords.latitude;
        $scope.map.center.longitude = coords.longitude;
      });
    };

    var placesChanged = function(searchBox) {
      var place = searchBox.getPlaces()[0];

      // get address minus country
      // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
      var address = place.formatted_address;
      // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

      address = address.substring(0, address.lastIndexOf(','));

      setLocation({
        latitude: place.geometry.location.lat(),
        longitude: place.geometry.location.lng()
      }, {
        address: address,
        storeName: place.name
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
        console.log($scope.markers[0]);

        geoList.save({
          location: new Parse.GeoPoint($scope.markers[0].coords),
          address: $scope.markers[0].locationDetails.address,
          storeName: $scope.markers[0].locationDetails.storeName
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
          var address = geoList.get('address');
          var storeName = geoList.get('storeName');
          setLocation({
            latitude: location.latitude,
            longitude: location.longitude
          }, {
            address: address,
            storeName: storeName
          });
        });
      });
    };

    // Exact distance depends where on globe you are, since latlng aren't linear
    // Around Chicago, this is ~8 miles N/S and ~7 miles E/W
    supersonic.data.channel('location').subscribe(function(location) {
      uiGmapGoogleMapApi.then(function(maps) {
        var lat = parseFloat(location.latitude);
        var lng = parseFloat(location.longitude);
        $scope.searchbox.options.bounds = new maps.LatLngBounds(
          new maps.LatLng(lat - 0.1, lng - 0.1),
          new maps.LatLng(lat + 0.1, lng + 0.1)
        );
      });
    });

    supersonic.ui.views.current.whenVisible(getGeoList);
  }]);
