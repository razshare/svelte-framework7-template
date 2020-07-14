var exec = require('cordova/exec');

var noop = function () { }, timer = null;

var androidMode = {
    actived: false,
    enabled: false,
    //注册后台服务
    start: function (success, failure) {
        success = success || noop;
        failure = failure || noop;
        var callback = function () {
            androidMode.enabled = true;
            timer && clearInterval(timer);
            timer = setInterval(success, 600000);
        };
        cordova.exec(callback, failure, 'BackgroundMode', 'enable', []);
    },
    //注销后台服务
    stop: function (success, failure) {
        success = success || noop;
        failure = failure || noop;
        androidMode.enabled = false;
        timer && clearInterval(timer);
        exec(success, failure, 'BackgroundMode', 'disable', []);
    },
    //原生回调接口
    fire: function (status, params) {
        console.log('BackgroundMode:', status, params);
        androidMode.actived = status == 'activate';
    }
};

var iosMode = {
    actived: false,
    enabled: false,
    //注册后台服务
    start: function (success, failure) {
        iosMode.enabled = true;
        success = success || noop;
        failure = failure || noop;
        var callback = function () {
            iosMode.actived = true;
            success(function () {
                iosMode.actived = false;
                BackgroundFetch.finish();
            });
        };
        BackgroundFetch.configure(callback, failure, { stopOnTerminate: false });
    },
    //注销后台服务
    stop: function (success, failure) {
        iosMode.actived = false;
        iosMode.enabled = false;
        success = success || noop;
        failure = failure || noop;
        BackgroundFetch.stop(success, failure);
    },
    //获取服务状态
    status: function (success, failure) {
        success = success || noop;
        failure = failure || noop;
        BackgroundFetch.status(success, failure);
    }
};

module.exports = cordova.platformId == 'ios' ? iosMode : androidMode;
