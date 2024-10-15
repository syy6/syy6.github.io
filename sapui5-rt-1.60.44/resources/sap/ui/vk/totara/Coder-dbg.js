sap.ui.define([
	"jquery.sap.global"
], function(jQuery) {
    "use strict";

    var Coder = function() { };

    // cannot use TextEncoder as not supported in all browsers and polly fill seems to be not approved in 3rd party request
    Coder.encode = function(commandStr) {
        var utf8 = unescape(encodeURIComponent(commandStr));
        var arr = new Uint8Array(utf8.length);
        for (var i = 0; i < utf8.length; i++) {
            arr[ i ] = utf8.charCodeAt(i);
        }
        return arr.buffer;
    };

    Coder.uint8ArrayToString = function(uint8Array) {

        var finalString = "";
        try {
            // if uint8Array is too long, stack runsout in String.fromCharCode.apply
            // so batch it in certain size
            var CHUNK_SIZE = 0x8000; // arbitrary number here, not too small, not too big
            var index = 0;
            var length = uint8Array.length;
            var slice;
            while (index < length) {
                slice = uint8Array.slice(index, Math.min(index + CHUNK_SIZE, length)); // `Math.min` is not really necessary here I think
                finalString += String.fromCharCode.apply(null, slice);
                index += CHUNK_SIZE;
            }
        } catch (e) {
            finalString = "";
            // console.log(e);
        }
        return finalString;
    };

    Coder.decode = function(uint8Array) {
        var encodedString = Coder.uint8ArrayToString(uint8Array);

        return decodeURIComponent(escape(encodedString));
    };
});
