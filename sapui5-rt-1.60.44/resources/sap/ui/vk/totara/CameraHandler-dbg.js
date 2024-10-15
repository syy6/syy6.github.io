
sap.ui.define([
	"jquery.sap.global",  "./TotaraUtils"
], function(jQuery, TotaraUtils) {
    "use strict";

    var CameraHandler = function() {};

    CameraHandler.setCameraSingle = function(state, cameraInfo) {

        if (!cameraInfo.near) {
            cameraInfo.near = 1;
        }

        if (!cameraInfo.far) {
            cameraInfo.far = 200000;
        }

        if (!cameraInfo.zoom) {
            cameraInfo.zoom = 0.02;
        }

        state.sceneBuilder.createCamera(cameraInfo, state.currentSceneInfo.id);

        return state.sceneBuilder.getCamera(cameraInfo.id);
    };

    CameraHandler.setCamera = function(state, command) {
        if (TotaraUtils.checkError(command)) {
            return command;
        }

        var result = {};

        var cameraInfos = command.cameras;

        if (Array.isArray(cameraInfos)) {
            for (var i = 0; i < cameraInfos.length; i++) {
                CameraHandler.setCameraSingle(state, cameraInfos[i]);
            }
        }

        return result;
    };

    return CameraHandler;
});

