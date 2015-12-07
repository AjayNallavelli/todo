# ToDo - do more today

## Summary

ToDo is a mobile to-do list app that, when near a specified location, reminds
you to complete list items.

## Development Setup

Install Steroids and other development dependencies according to the
[Steroids install wizard](https://academy.appgyver.com/installwizard/).

Install the npm and bower dependencies with

```
$ steroids update
```

You are now ready to run `steroids connect` and start developing.

## Parse Setup

ToDo uses [Parse](https://parse.com) as a backend.

First create an app on <Parse.com> and obtain the application id and javascript
api key. Complete the following code in `app/common/views/layout.html` and
`scripts/push.js`.

```
Parse.intitalize('<application id>', '<javascript api key>');
```

You will need to add two classes, `GeoList` and `Task` to the schema.

### GeoList

```
{
  "address": "30 W Huron St, Chicago, IL 60654",
  "createdAt": "2015-11-25T23:48:36.836Z",
  "location": {
    "__type": "GeoPoint",
    "latitude": 41.8951139,
    "longitude": -87.62924900000002
  },
  "name": "Grocery List",
  "objectId": "N83IUHKhJw",
  "storeName": "Whole Foods Market",
  "updatedAt": "2015-11-25T23:50:15.308Z",
  "uuid": "35808D90-4DE5-4294-A741-6A457EB91EF2"
}
```

### Task

```
{
  "createdAt": "2015-11-18T23:34:47.172Z",
  "done": false,
  "geoList": {
    "__type": "Pointer",
    "className": "GeoList",
    "objectId": "N83IUHKhJw"
  },
  "name": "Milk",
  "objectId": "695mbwIf1G",
  "updatedAt": "2015-11-18T23:34:47.172Z"
}
```

## Push Notification Setup

First, set up Parse Cloud Code.

```
$ cd parse
$ parse new
```

Follow the instructions to connect your Parse app. Make sure to use `cloud` as
the directory name.

Now set up
[Google Cloud Messaging](https://developers.google.com/cloud-messaging/) and
obtain the sender id and api key.

Fill in `gcmSenderId` in `app/xlist/index.js` and `gcmApiKey` in
`parse/cloud/main.js`. Finally, run

```
$ parse deploy
```

The cloud code will be deployed to Parse. By executing this code via the Parse
API, ToDo sends push notifications.

## Google Maps API Key

Obtain a [Google Maps JavaScript API key](https://developers.google.com/maps/documentation/javascript/).
Once you have your key, fill in `googleMapsApiKey` in `app/xlist/index.js`.

## Custom AppGyver Scanner

Geolocation while in the background on Android requires an Apache Cordova plugin
which the Play Store [AppGyver Scanner](https://play.google.com/store/apps/details?id=com.appgyver.freshandroid)
does not include.

To build a custom AppGyver Scanner with the plugin, run

```
steroids deploy
```

You can now find your app on the
[AppGyver Cloud Services](https://cloud.appgyver.com/applications) page.

Configure the Android Scanner Build according to the
[Build Service Documentation](http://docs.appgyver.com/tooling/build-service/).
Enable push notifications. Add

```
{"source":"https://github.com/katzer/cordova-plugin-background-mode.git"}
```

to the plugin configuration JSON array. Enable location permissions.

You are now ready to build your custom AppGyver Scanner. Select Platform Webview
Scanner from the build menu. You will receive an email with a link to an `.apk`
file when the build finishes.

Install the `.apk` file on your Android device. You will need to enable unknown
sources and possibly uninstall any other instances of the AppGyver Scanner.

You can now use the custom AppGyver Scanner to develop ToDo on Android.

## Distribution

When ready to distribute ToDo, run

```
steroids deploy
```

Find your app on the
[AppGyver Cloud Services](https://cloud.appgyver.com/applications) page and
configure the Android Google Play Build (make sure the plugin and permissions
configuration from above is done). Select Platform Webview Google Play from the
build menu. You will receive an email with a link to an `.apk` file when the
build finishes.

## Utilities

```
$ node scripts/push.js <device uuid> <gcm registration id>
```

Running this command sends a push notification to an Android device based on the
data in one arbitrary list associated with the device uuid.

You can get the gcm registration id by running

```
> window.plugins.pushNotification.register({
    senderID: '<gcm sender id>'
  }).then(function(registrationID) { ... });
```

in Android app's WebView.

## Limitations

- While ToDo can be deployed for both Android and iOS, at this time, push
notifications and background geolocation only work on Android.
- For Android versions 5.0+, the icon for push notifications does not appear
correctly. This can be corrected by making the white part transparent.

## License

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.  IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## About

Developed by [Lunrong Chen](https://github.com/lunrongchen),
[Kapil Garg](https://github.com/kapil1garg),
[Pooja Saxena](https://github.com/pooja335), and
[Adrien Tateno](https://github.com/katsuya94).
