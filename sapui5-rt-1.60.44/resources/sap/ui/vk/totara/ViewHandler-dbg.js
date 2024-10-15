sap.ui.define([
	"jquery.sap.global", "./ViewBuilder", "./CameraHandler"
], function(jQuery, ViewBuilder, CameraHandler) {
    "use strict";

    var ViewHandler = function() {};

    ViewHandler.setView = function(state, view) {
        if (view.error) {
            return view;
        }

        var result = {};

        if (view.sceneId) {
            var context = state.getContext(view.sceneId);
            context.currentView = view;
            context.treeNodes = []; // we need clean list
            result.context = context;

            if (view.camera) {
                view.camera = CameraHandler.setCameraSingle(state, view.camera);
            }
        } else {
            result.error = "setView: no sceneId";
        }

        return result;
    };

    // View data is actually the same as tree data.
    // however, we process them slightly differently.
    // for existing tree node, we need to update it's properties (e.g) transform, visibility
    // for new tree node, we need to add
    // for missing tree node, we need to hide (or drop). Currently we are only hiding.
    // this is because the actual action is happening async as ActivateView.
    // and it does transition effect. we need them to be alive until activate view is finished.
    ViewHandler.setViewNode = function(state, command) {
        if (command.error) {
            return command;
        }

        var result = {};

        if (command.sceneId) {
            var context = state.getContext(command.sceneId);
            result.context = context;

            if (!context.currentView) {
                result.error = "error: setViewNode - no setView was in the chain";
                return result;
            }

            context.treeNodes = context.treeNodes.concat(command.nodes);

        } else {
            result.error = "setViewNode: no sceneId";
        }

        return result;
    };

    ViewHandler.notifyFinishedView = function(state, command) {
        var result = {};

        if (command.sceneId) {
            var context = state.getContext(command.sceneId);
            result.context = context;

            var currentView = context.currentView;
            if (!currentView) {
                result.error = "error: notifyFinishedView - no currentView";
                return result;
            }

            // add three js camera if camera id is there
            // note cameraId can be zero, which is a generated camera which is not stored in service side
            if (currentView.activeCameraId !== undefined) {
                currentView.camera = state.sceneBuilder.getCamera(currentView.activeCameraId);
            }

            context.updatedNodes.clear();

            var viewResult = ViewBuilder.buildView(state, context);
            currentView.viewNodes = viewResult.nodeInfos;

            result.view = currentView;
            delete context.currentView;
        } else {
            result.error = "notifyFinishedView - no sceneId";
        }

        return result;
    };

    return ViewHandler;
});