
sap.ui.define([
	"jquery.sap.global", "./Commands"
], function(jQuery, Commands) {
    "use strict";

    var Generator = function() { };

    Generator.createSetStreamingTokenCommand = function(options) {
        var requestCommandContent = JSON.stringify(options);
        var command = Commands.setStreamingToken + ("[" + requestCommandContent.length + "]") + requestCommandContent;
        return command;
    };

    Generator.createGetTreeCommand = function(options) {
        var requestCommandContent = JSON.stringify(options);
        var command = Commands.getTree + ("[" + requestCommandContent.length + "]") + requestCommandContent;
        return command;
    };

    Generator.createGetViewCommand = function(options) {
        var requestCommandContent = JSON.stringify(options);
        var command = Commands.getView + ("[" + requestCommandContent.length + "]") + requestCommandContent;
        return command;
    };

    Generator.createGetDynamicViewCommand = function(options) {
        var requestCommandContent = JSON.stringify(options);
        var command = Commands.getDynamicView + ("[" + requestCommandContent.length + "]") + requestCommandContent;
        return command;
    };

    function createRequestContent(ids, token) {
        var command = {
            ids: ids
        };

        if (token) {
            command.token = token;
        }

        return JSON.stringify(command);
    }

    Generator.createGetMeshCommand = function(ids, token) {
        var command = createRequestContent(ids, token);
        command = Commands.getMesh + ("[" + command.length + "]")  + command;
        return command;
    };

    Generator.createGetMaterialCommand = function(ids, token) {
        var command = createRequestContent(ids, token);
        command = Commands.getMaterial + ("[" + command.length + "]")  + command;
        return command;
    };

    Generator.createGetGeometryCommand = function(ids, token) {
        var command = createRequestContent(ids, token);
        command = Commands.getGeometry + ("[" + command.length + "]")  + command;
        return command;
    };

    Generator.createGetImageCommand = function(ids, token) {
        var command = createRequestContent(ids, token);
        command = Commands.getImage + ("[" + command.length + "]")  + command;
        return command;
    };

    Generator.createAddClientLogCommand = function(log) {

        var command = {
            duration: log.duration
        };

        if (log.name) {
            command.name = log.name;
        }

        if (log.message) {
            command.message = log.message;
        }

        if (log.token) {
            command.token = log.token;
        }

        if (log.error) {
            command.error = log.error;
        }

        if (log.timestamp) {
            command.timestamp = log.timestamp;
        }

        command = JSON.stringify(command);
        command = Commands.addClientLog + ("[" + command.length + "]") + command;

        return command;
    };

    return Generator;
});
