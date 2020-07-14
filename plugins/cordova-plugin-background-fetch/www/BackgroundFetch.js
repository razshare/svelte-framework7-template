/***
 * Custom Cordova Background Fetch plugin.
 * @author <chris@transistorsoft.com>
 * iOS native-side is largely based upon http://www.mindsizzlers.com/2011/07/ios-background-location/
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
*/
var exec = require("cordova/exec");

var EMPTY_FN = function() {}

var MODULE = "BackgroundFetch";
module.exports = {
    STATUS_RESTRICTED: 0,
    STATUS_DENIED: 1,
    STATUS_AVAILABLE: 2,

    FETCH_RESULT_NEW_DATA: 0,
    FETCH_RESULT_NO_DATA:  1,
    FETCH_RESULT_FAILED:   2,

    NETWORK_TYPE_NONE:        0,
    NETWORK_TYPE_ANY:         1,
    NETWORK_TYPE_UNMETERED:   2,
    NETWORK_TYPE_NOT_ROAMING: 3,
    NETWORK_TYPE_CELLULAR:    4,

    configure: function(callback, failure, config) {
        if (typeof(callback) !== 'function') {
            throw "BackgroundFetch configure error:  You must provide a callback function as 1st argument";
        }
        config = config || {};
        failure = failure || EMPTY_FN;
        exec(callback, failure, MODULE, 'configure', [config]);
    },

    finish: function(taskId, success, failure) {
        if (typeof(taskId) !== 'string') {
            throw "BackgroundGeolocation.finish now requires a String taskId as first argument";
        }
        success = success || EMPTY_FN;
        failure = failure || EMPTY_FN;
        exec(success, failure, MODULE, 'finish',[taskId]);
    },

    start: function(success, failure) {
        success = success || EMPTY_FN;
        failure = failure || EMPTY_FN;
        exec(success, failure, MODULE, 'start',[]);
    },

    stop: function(success, failure) {
        success = success || EMPTY_FN;
        failure = failure || EMPTY_FN;
        exec(success, failure, MODULE, 'stop', []);
    },

    scheduleTask: function(config, success, failure) {
        if (typeof(config) !== 'object') throw "[BackgroundFetch stopTask] ERROR:  The 1st argument to scheduleTask is a config {}";
        success = success || EMPTY_FN;
        failure = failure || EMPTY_FN;
        exec(success, failure, MODULE, 'scheduleTask', [config]);
    },

    stopTask: function(taskId, success, failure) {
        if (typeof(taskId) !== 'string') throw "[BackgroundFetch stopTask] ERROR: The 1st argument must be a taskId:String";
        success = success || EMPTY_FN;
        failure = failure || EMPTY_FN;
        exec(success, failure, MODULE, 'stop', [taskId]);
    },

    status: function(success, failure) {
        success = success || EMPTY_FN;
        failure = failure || EMPTY_FN;
        exec(success, failure, MODULE, 'status',[]);
    }
};
