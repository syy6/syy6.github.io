sap.ui.define([
    "jquery.sap.global"
], function(jQuery) {
    "use strict";

    var SceneHandler = function() {};

    SceneHandler.rotateNodeByUpAxies = function(axisRight, axisUp, targetNode, camera) {
        var x = 0, y = 0, z = 0;
        if (axisUp === "z_positive") {
            if (axisRight === "x_positive") {
                x = -90 * Math.PI / 180; // counter clockwise
            } else if (axisRight === "y_positive") {
                x = -90 * Math.PI / 180;
                z = -90 * Math.PI / 180;
            } else if (axisRight === "x_nagetive") {
                x = -90 * Math.PI / 180;
                z = 180 * Math.PI / 180;
            } else { // y_nagetive
                x = -90 * Math.PI / 180;
                z = 90 * Math.PI / 180;
            }
        } else if (axisUp === "y_positive") {
            if (axisRight === "x_positive") {
                return;
            } else if (axisRight === "x_nagetive") {
                y = 180 * Math.PI / 180;
            } else if (axisRight === "z_positive") {
                y = 90 * Math.PI / 180;
            } else if (axisRight === "z_negative"){
                y = -90 * Math.PI / 180;
            }
        } /* else {
            console.warn('WARNING: Not supported');
        }*/

        targetNode.rotation.x = x;
        targetNode.rotation.y = y;
        targetNode.rotation.z = z;

        if (camera){
            var euler = new THREE.Euler(x, y, z, "XYZ");
            var newRotationMatrix = new THREE.Matrix4().makeRotationFromEuler(euler);
            camera.updateMatrix();
            camera.matrix.multiplyMatrices(newRotationMatrix, camera.matrix);
            camera.matrix.decompose(camera.position, camera.quaternion, camera.scale);
        }
    };

    return SceneHandler;
});

