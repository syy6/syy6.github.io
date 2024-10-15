sap.ui.define([
	"jquery.sap.global", "./ListMap", "./CameraHandler", "./TotaraUtils", "./TreeBuilder"
], function(jQuery, ListMap, CameraHandler, TotaraUtils, TreeBuilder) {
    "use strict";

    var TreeHandler = function() {};

    TreeHandler.setTree = function(state, command) {
        if (TotaraUtils.checkError(command)) {
            if (command.events && command.events.length) { // check if setTree has infomation about the id
                var event = command.events[ 0 ];
                if (event.values && event.values.id) {
                    // setTree context carries scene veid. remove it since failed
                    var relatedContext = state.getContext(event.values.id);
                    command.context = relatedContext;
                }
            }
            return command;
        }

        var result = {};
        var context = state.getContext(command.sceneId);

        // setTree gives root node directly.
        if (command.sid) {
            var root = state.sceneBuilder.getNode(command.sid, context.sceneId);
            if (!root) {
                var rootGroup = context.root;
                // make dummy tree node for root as server only gives sid
                rootGroup.userData.treeNode = {
                    sid: command.sid,
                    name: "root"
                };

                if (context) {
                    state.sceneBuilder.setRootNode(rootGroup, command.sid, command.sceneId);
                    context.rootNodeId = command.sid;
                } else {
                    result.error = "faital error: no context. model not loaded";
                }
            }
        }

        if (command.camera) {
            var camera = CameraHandler.setCameraSingle(state, command.camera);
            if (camera) {
                context.onActiveCameraCallbacks.execute(camera);
            }
        }

        return result;
    };

    TreeHandler.setTreeNode = function(state, command) {
        if (command.error) {
            return command;
        }

        var result = {};

        if (!command.sceneId) {
            result.error = "setTreeNode error: no sceneId";
        }

        var context = state.getContext(command.sceneId);
        if (!context) {
            result.error = "setTreeNode: no loading context";
            return result;
        }

        context.treeNodes = context.treeNodes.concat(command.nodes);

        return result;
    };

    TreeHandler.notifyFinishedTree = function(state, command) {
        var result = {};

        if (command.error) {
            return command;
        }

        if (command.sceneId) {
            result.context = state.getContext(command.sceneId);
            TreeBuilder.buildTree(state, result.context);
        } else {
            result.error = "notifyFinishedTree error: no sceneId";
        }

        return result;
    };

    return TreeHandler;
});

