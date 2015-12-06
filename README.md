# ToDo - do more today

## Synopsis

ToDo is a mobile to-do list app that, when near a specified location, reminds
you to complete list items.

## Limitations

While ToDo can be deployed for both Android and iOS. At this time, push
notifications and geolocation while in the background only work on Android.

## Development Setup

Install Steroids and other development dependencies according to the
[Steroids install wizard](https://academy.appgyver.com/installwizard/).

Install the npm and bower dependencies with

```
$ steroids update
```

You are now ready to run `steroids connect` and start developing.

## Parse Setup

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
{"source":"<https://github.com/katzer/cordova-plugin-background-mode.git>"}
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
