sap.ui.define([
    "jquery.sap.global"
], function(jQuery) {
    "use strict";

    var NotificationHandler = function() {};

    NotificationHandler.notifyError = function(state, error) {
        return error ? error : { error: "unknown error" };
    };

    NotificationHandler.notifyFinishedMaterial = function(state, command) {
        var result = {};
        return result;
    };

    NotificationHandler.notifyFinishedImage = function(state, command) {
        var result = {};
        return result;
    };

    NotificationHandler.notifyFinishedMesh = function(state, command) {
        var result = {};
        return result;
    };

    NotificationHandler.notifyFinishedGeometry = function(state, command) {
        var result = {};
        return result;
    };

    NotificationHandler.timestamp = function(state, command) {
        var result = {};

        // if (command.value)
        //    console.log('timestamp: ' + command.value.toString());

        return result;
    };

    return NotificationHandler;
});

