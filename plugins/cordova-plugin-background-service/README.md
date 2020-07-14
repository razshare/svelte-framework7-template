BackgroundService
==============================

## Installing the plugin ##

```Bash
$ cordova plugin add cordova-plugin-background-service
```

## Using the plugin ##

The plugin creates the object `window.BackgroundService` with the methods `start(success, failure, config)`, and `stop(success, failure)`.

```Javascript
window.BackgroundService.start(
    function(fn) { dosometing(), fn && fn() },
    function() { console.log('err') }
)
```

## Code Refs ##

https://github.com/katzer/cordova-plugin-background-mode

https://github.com/transistorsoft/cordova-plugin-background-fetch
