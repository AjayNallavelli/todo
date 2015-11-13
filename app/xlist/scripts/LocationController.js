angular
  .module('xlist')
  .controller('LocationController',
      ['$scope', '$q', 'supersonic', 'Task', 'Store', 'deviceReady', 'slackbot',
       'push', 'ParseQuery', 'ParseObject', 'uiGmapGoogleMapApi',
  function($scope, $q, supersonic, Task, Store, deviceReady, slackbot, push, ParseQuery, ParseObject, uiGmapGoogleMapApi) {
   
    var makeMap = function() {
      $scope.map = { center: { latitude: 42.0464, longitude: -87.6947 }, zoom: 12 };
      $scope.options = {
        autocomplete: true
      };
      var events = {
        places_changed: searchBox
      };
      $scope.searchbox = { template:'searchbox.tpl.html', events:events};

      console.log(uiGmapGoogleMapApi);
      console.log($scope);
    };
    makeMap();

    // var searchBox = function() {
    //   infowindow.close();
    //   marker.setVisible(false);
    //   var place = autocomplete.getPlace();
    //   if (!place.geometry) {
    //     window.alert("Autocomplete's returned place contains no geometry");
    //     return;
    //   }

    //   // If the place has a geometry, then present it on a map.
    //   if (place.geometry.viewport) {
    //     map.fitBounds(place.geometry.viewport);
    //   } else {
    //     map.setCenter(place.geometry.location);
    //     map.setZoom(17);  // Why 17? Because it looks good.
    //   }
    //   marker.setIcon(/** @type {google.maps.Icon} */({
    //     url: place.icon,
    //     size: new google.maps.Size(71, 71),
    //     origin: new google.maps.Point(0, 0),
    //     anchor: new google.maps.Point(17, 34),
    //     scaledSize: new google.maps.Size(35, 35)
    //   }));
    //   marker.setPosition(place.geometry.location);
    //   marker.setVisible(true);
    //   var address = '';
    //   if (place.address_components) {
    //     address = [
    //       (place.address_components[0] && place.address_components[0].short_name || ''),
    //       (place.address_components[1] && place.address_components[1].short_name || ''),
    //       (place.address_components[2] && place.address_components[2].short_name || '')
    //     ].join(' ');
    //   }

    //   infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
    //   infowindow.open(map, marker);
    // });

  }]);
