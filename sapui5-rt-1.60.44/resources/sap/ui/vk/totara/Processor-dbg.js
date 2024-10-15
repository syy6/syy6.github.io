
sap.ui.define([
    "jquery.sap.global", "./Commands",
    "./CameraHandler", "./TreeHandler", "./NotificationHandler", "./MeshHandler", "./MaterialHandler", "./ImageHandler", "./ViewHandler"
], function(jQuery, Commands, CameraHandler, TreeHandler, NotificationHandler, MeshHandler, MaterialHandler, ImageHandler, ViewHandler) {
    "use strict";

    var Processor = function() {

        var callbackMap = new Map();
        var numCommandSkipped = 0;

        this.setCommandCallback = function(commandName, callback) {
            callbackMap.set(commandName, callback);
        };

        this.process = function(state, command) {

            var result;
            var skipped = false;

            if (command.sceneId) {
                state.currentSceneInfo.id = command.sceneId;
            }

            switch (command.name) {

                case Commands.setCamera:
                    result = CameraHandler.setCamera(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.notifyFinishedMaterial:
                    result = NotificationHandler.notifyFinishedMaterial(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.notifyFinishedImage:
                    result = NotificationHandler.notifyFinishedImage(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.notifyFinishedMesh:
                    result = NotificationHandler.notifyFinishedMesh(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.notifyFinishedGeometry:
                    result = NotificationHandler.notifyFinishedGeometry(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.setMesh:
                    result = MeshHandler.setMesh(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.setMaterial:
                    result = MaterialHandler.setMaterial(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.setGeometry:
                    result = MeshHandler.setGeometry(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.setImage:
                    result = ImageHandler.setImage(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.notifyError:
                    result = NotificationHandler.notifyError(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.timestamp:
                    result = NotificationHandler.timestamp(state, command.jsonContent, command.binaryContent);
                    break;

                case Commands.setTree:
                    result = TreeHandler.setTree(state, command.jsonContent);
                    break;

                case Commands.setTreeNode:
                    result = TreeHandler.setTreeNode(state, command.jsonContent);
                    break;

                case Commands.notifyFinishedTree:
                    result = TreeHandler.notifyFinishedTree(state, command.jsonContent);
                    break;

                case Commands.setView:
                    result = ViewHandler.setView(state, command.jsonContent);
                    break;

                case Commands.setViewNode:
                    result = ViewHandler.setViewNode(state, command.jsonContent);
                    break;

                case Commands.notifyFinishedView:
                    result = ViewHandler.notifyFinishedView(state, command.jsonContent);
                    break;

                default:
                    // console.log('"' + command.name + '"- Not Implemented');
                    skipped = true;

                    break;
            }

            var commandNameToHandle = command.name;
            if (result && result.error && commandNameToHandle !== Commands.notifyError) {
                // error can happen within command.
                // we have to notify these errors too
                var errorCallback = callbackMap.get(Commands.notifyError);
                if (errorCallback) {
                    errorCallback(result);
                }
            }

            var callback = callbackMap.get(commandNameToHandle);
            if (callback) {
                callback(result);
            }

            if (skipped) {
                numCommandSkipped++;
            }

            return result;
        };

        this.getNumberOfCommandsSkipped = function() {
            return numCommandSkipped;
        };

    };

    return Processor;

});
