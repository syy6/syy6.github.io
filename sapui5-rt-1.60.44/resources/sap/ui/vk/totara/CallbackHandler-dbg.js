sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
    "use strict";

    var CallbackHandler = function() {
        var callbacks = [];

        this.attach = function(callback) {
            callbacks.push(callback);
        };

        this.detach = function(callback) {
            var idx = callbacks.indexOf(callback);
            if (idx !== -1) {
                callbacks.splice(idx, 1);
                return true;
            }
            return false;
        };

        this.execute = function(arg) {
            for (var i = 0; i < callbacks.length; i++) {
                callbacks[ i ](arg);
            }
        };
    };

    return CallbackHandler;
});