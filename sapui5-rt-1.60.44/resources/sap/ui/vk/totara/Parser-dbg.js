sap.ui.define([
	"jquery.sap.global", "./Coder"
], function(jQuery, Coder) {
    "use strict";

    var Parser = function() { };

    Parser.createCommandList = function(arrayBuffer, onCommandCreatedCallback) {

        var buffer = new Uint8Array(arrayBuffer);

        var commandList = [];

        var st = 0;
        var ed = 0;

        var commandLength;
        var jsonContent;
        var binaryContent;

        while (ed < buffer.length) {
            ed = findChar("[".charCodeAt(0), st, buffer);

            if (ed === -1) {
                // failed to locate starting [. So no more command name.
                break;
            }

            var commandName = Coder.decode(buffer.slice(st, ed)).replace(/\n|\r|\s/g, ""); // get string and remove line break stuff.
            st = ed + 1;

            ed = findChar("]".charCodeAt(0), st, buffer);

            if (ed === -1) {
                throw "No matching [] for command length. abort";
            }

            commandLength = getContentLength(Coder.decode(buffer.slice(st, ed)));

            st = ed + 1;
            ed = st + commandLength.jsonContentLength;

            jsonContent = Coder.decode(buffer.slice(st, ed));
            try {
                jsonContent = JSON.parse(jsonContent);
            } catch (e) {
                var errMsg = commandName + ": " + e;
                throw errMsg;
            }

            // binary content is optional atm
            if (commandLength.binaryContentLength) {
                st = ed;
                ed = st + commandLength.binaryContentLength;

                binaryContent = buffer.slice(st, ed);
            } else {
                binaryContent = undefined;
            }

            st = ed;

            var command = {
                name: commandName,
                jsonContent: jsonContent,
                binaryContent: binaryContent
            };

            if (onCommandCreatedCallback) {
                onCommandCreatedCallback(command);
            }
            commandList.push(command);
        }

        return commandList;
    };

    function findChar(charCode, st, uint8Array) {
        for (var i = st; i < uint8Array.length; i++) {
            if (uint8Array[ i ] === charCode) {
                return i;
            }
        }
        return -1;
    }

    function getContentLength(contentLengthString) {
        var list = contentLengthString.split(",");

        if (list.length < 0 || list.length > 2) {
            throw "invalid content length";
        }

        var jsonContentLength = 0;
        var binaryContentLength = 0;

        try {
            jsonContentLength = parseInt(list[ 0 ], 10);

            if (list.length === 2) {
                binaryContentLength = parseInt(list[ 1 ], 10);
            }

        } catch (e) {
            throw "invalid content length";
        }

        return {
            jsonContentLength: jsonContentLength,
            binaryContentLength: binaryContentLength
        };
    }
});
