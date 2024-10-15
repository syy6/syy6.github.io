/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the Camera class.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/ManagedObject"
], function(jQuery, ManagedObject) {
	"use strict";

	/**
	 * Constructor for a new Camera.
	 *
	 *
	 * @class Provides the interface for the camera.
	 *
	 * The objects of this class should not be created directly.
	 *
	 * @public
	 * @author SAP SE
	 * @version 1.60.14
	 * @extends sap.ui.base.ManagedObject
	 * @alias sap.ui.vk.Camera
	 * @since 1.52.0
	 */
	var Camera = ManagedObject.extend("sap.ui.vk.Camera", /** @lends sap.ui.vk.Camera.prototype */ {
		metadata: {
			properties: {
				/**
				 * Position in global space
				 */
				"position": {
					type: "float[]"
				},
				/**
				 * look vector in global space
				 */
				"targetDirection": {
					type: "float[]"
				},
				/**
				 * up vector in global space
				 */
				"upDirection": {
					type: "float[]"
				},
				/**
				 * near plane distance
				 */
				"nearClipPlane": {
					type: "float"
				},
				/**
				 * far plane distance
				 */
				"farClipPlane": {
					type: "float"
				}
			}
		}
	});


	/**
	 *
	 * @returns {any} Camera reference that this camera class wraps
	 * @public
	 */
	Camera.prototype.getCameraRef = function() {
		return null;
	};

	return Camera;
});
