/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.CrossSectionTool
sap.ui.define([
	"jquery.sap.global", "./library", "./Tool", "./CrossSectionToolHandler", "./CrossSectionToolGizmo"
], function(jQuery, library, Tool, CrossSectionToolHandler, CrossSectionToolGizmo) {
	"use strict";

	/**
	 * Constructor for a new CrossSectionTool.
	 *
	 * @class
	 * The CrossSection tool can be used to cut all 3D objects along one of three spatial axis to expose their internal structures.

	 * @param {string} [sId] ID of the new tool instance. <code>sId</code>is generated automatically if no non-empty ID is given.
	 *                       Note: this can be omitted, regardless of whether <code>mSettings</code> will be provided or not.
	 * @param {object} [mSettings] An optional map/JSON object with initial property values, aggregated objects etc. for the new tool instance.
	 * @public
	 * @author SAP SE
	 * @version 1.60.14
	 * @extends sap.ui.vk.tools.Tool
	 * @alias sap.ui.vk.tools.CrossSectionTool
	 */
	var CrossSectionTool = Tool.extend("sap.ui.vk.tools.CrossSectionTool", /** @lends sap.ui.vk.tools.CrossSectionTool.prototype */ {
		metadata: {
		},

		constructor: function(sId, mSettings) {
			// Treat tool instantiation as singleton
			if (CrossSectionTool._instance) {
				return CrossSectionTool._instance;
			}

			Tool.apply(this, arguments);

			// Configure dependencies
			this._viewport = null;
			this._handler = null;
			this._gizmo = null;

			CrossSectionTool._instance = this;
		}
	});

	CrossSectionTool.prototype.init = function() {
		if (Tool.prototype.init) {
			Tool.prototype.init.call(this);
		}

		// set footprint for tool
		this.setFootprint([ "sap.ui.vk.threejs.Viewport" ]);

		this.setAggregation("gizmo", new CrossSectionToolGizmo());
	};

	// Checks if the current viewport is of a specified type
	CrossSectionTool.prototype.isViewportType = function(typeString) {
		if (this._viewport && this._viewport.getMetadata().getName() === typeString) {
			return true;
		}
		return false;
	};

	// Override the active property setter so that we execute activation / deactivation code at the same time
	CrossSectionTool.prototype.setActive = function(value, activeViewport, gizmoContainer) {
		if (Tool.prototype.setActive) {
			Tool.prototype.setActive.call(this, value, activeViewport, gizmoContainer);
		}

		if (value) {
			this._activateTool(activeViewport);
		} else {
			this._deactivateTool();
		}

		if (activeViewport) {
			activeViewport.setShouldRenderFrame();
		}

		return this;
	};

	CrossSectionTool.prototype._activateTool = function(activeViewport) {
		this._viewport = activeViewport;
		this._handler = new CrossSectionToolHandler(this);
		this._gizmo = this.getGizmo();
		if (this._gizmo) {
			this._gizmo.show(activeViewport, this);
		}

		// Prepare the tool to execute
		this._prepare();
	};

	CrossSectionTool.prototype._deactivateTool = function() {
		// Remove tool handler from loco stack for viewport so that the tool no longer handles input from user
		if (this._handler) {
			if (this._viewport._loco) {
				this._viewport._loco.removeHandler(this._handler);
			}
			this._handler = null;
		}

		if (this._gizmo) {
			this._gizmo.hide();
			this._gizmo = null;
		}
	};

	/*
	* Checks that the execution criteria for this tool are met before execution of tool commands
	*/
	CrossSectionTool.prototype._prepare = function() {
		var okToExec = false;

		if (this._viewport._loco) {
			// Add tool handler to loco stack for viewport so that the tool can handler input from user
			this._viewport._loco.addHandler(this._handler);
			okToExec = true;
		}

		return okToExec;
	};

	/**
	 * Sets the clipping plane axis.
	 *
	 * @param {number} [index] Axis index from 0 to 2: 0 - X, 1 - Y, 2 - Z.
	 * @returns {sap.ui.vk.tools.CrossSectionTool} <code>this</code> to allow method chaining.
	 * @public
	 */
	CrossSectionTool.prototype.setAxis = function(index) {
		if (this._gizmo) {
			this._gizmo.setAxis(index);
		}
		return this;
	};

	/**
	 * Flips the clipping plane.
	 *
	 * @param {boolean} [flip] If set to <code>true</code>, the clipping plane will be flipped.
	 * @returns {sap.ui.vk.tools.CrossSectionTool} <code>this</code> to allow method chaining.
	 * @public
	 */
	CrossSectionTool.prototype.setFlip = function(flip) {
		if (this._gizmo) {
			this._gizmo.setFlip(flip);
		}
		return this;
	};

	/** MOVE TO BASE
	 * Queues a command for execution during the rendering cycle. All gesture operations should be called using this method.
	 *
	 * @param {function} command The command to be executed.
	 * @returns {sap.ui.vk.Viewport} this
	 * @public
	 */
	CrossSectionTool.prototype.queueCommand = function(command) {
		if (this._prepare()) {

			if (this.isViewportType("sap.ui.vk.threejs.Viewport")) {
				command();
			}
		}
		return this;
	};

	CrossSectionTool.prototype.destroy = function() {
		// Destroy tool resources
		Tool.prototype.destroy.call(this);

		this._viewport = null;
		this._handler = null;
	};

	return CrossSectionTool;
});
