angular
  .module('xlist')
  .controller('LocationController',
      ['$scope', 'supersonic', 'locationService', 'GeoList',
       'uiGmapGoogleMapApi',
  function($scope, supersonic, locationService, GeoList,
           uiGmapGoogleMapApi) {
    $scope.map = {
      center: {
        latitude: 0,
        longitude: 0
      },
      zoom: 16,
      options: {
        streetViewControl: false
      }
    };
    $scope.markers = [];

    var geoList = null;

    var alertParseError = function(error) {
      supersonic.ui.dialog.alert('Error: ' + error.code + ' ' + error.message);
    };

    var setView = function(coords) {
      $scope.map.center.latitude = coords.latitude;
      $scope.map.center.longitude = coords.longitude;
    };

    var setLocation = function(coords, locationDetails) {
      $scope.markers = [{
        id: 'id',
        coords: coords,
        locationDetails: locationDetails
      }];
      setView(coords);
    };

    var placesChanged = function(searchBox) {
      var place = searchBox.getPlaces()[0];

      // retrieve address from Google Maps API and remove country from string
      // input:  2145 Sheridan Rd., Evanston, IL 60201, United States
      // output: 2145 Sheridan Rd., Evanston, IL 60201
      // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
      var address = place.formatted_address;
      address = address.substring(0, address.lastIndexOf(','));
      // jscs:enable requireCamelCaseOrUpperCaseIdentifiers

      $scope.$apply(function($scope) {
        setLocation({
          latitude: place.geometry.location.lat(),
          longitude: place.geometry.location.lng()
        }, {
          address: address,
          storeName: place.name
        });
      });
    };

    $scope.searchbox = {
      template: 'searchbox.tpl.html',
      events: {
        // jscs:disable requireCamelCaseOrUpperCaseIdentifiers
        places_changed: placesChanged
        // jscs:enable requireCamelCaseOrUpperCaseIdentifiers
      },
      options: {}
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
      title: 'ToDo', //this is only while logo is blurry
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
          if (location) {
            setLocation({
              latitude: location.latitude,
              longitude: location.longitude
            }, {
              address: geoList.get('address'),
              storeName: geoList.get('storeName')
            });
          } else {
            locationService.get().then(setView);
          }
          locationService.get().then(setBounds).then(function() {
            locationService.watch(setBounds);
          });
        });
      });
    };

    // Exact distance depends where on globe you are, since latlng aren't linear
    // Around Chicago, this is ~8 miles N/S and ~7 miles E/W
    var setBounds = function(location) {
      console.log(JSON.stringify(location));
      uiGmapGoogleMapApi.then(function(maps) {
        $scope.searchbox.options.bounds = new maps.LatLngBounds(
          new maps.LatLng(location.latitude - 0.1, location.longitude - 0.1),
          new maps.LatLng(location.latitude + 0.1, location.longitude + 0.1)
        );
      });
    };

    supersonic.ui.views.current.whenVisible(getGeoList);
  }]);
