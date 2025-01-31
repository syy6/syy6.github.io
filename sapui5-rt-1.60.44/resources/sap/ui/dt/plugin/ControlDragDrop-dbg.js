/*
 * ! UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

// Provides class sap.ui.dt.plugin.ControlDragDrop.
sap.ui.define([
	'sap/ui/dt/plugin/DragDrop',
	'sap/ui/dt/plugin/ElementMover',
	'sap/ui/dt/ElementUtil',
	'sap/ui/dt/OverlayUtil'
], function(
	DragDrop,
	ElementMover,
	ElementUtil,
	OverlayUtil
) {
	"use strict";

	/**
	 * Constructor for a new ControlDragDrop.
	 *
	 * @param {string}
	 *          [sId] id for the new object, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new object
	 * @class The ControlDragDrop enables D&D functionality for the overlays based on aggregation types
	 * @extends sap.ui.dt.plugin.DragDrop
	 * @author SAP SE
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.30
	 * @alias sap.ui.dt.plugin.ControlDragDrop
	 * @experimental Since 1.30. This class is experimental and provides only limited functionality. Also the API might be
	 *               changed in future.
	 */
	var ControlDragDrop = DragDrop.extend("sap.ui.dt.plugin.ControlDragDrop", /** @lends sap.ui.dt.plugin.ControlDragDrop.prototype */
	{
		metadata : {
			// ---- object ----

			// ---- control specific ----
			library : "sap.ui.dt",
			properties : {
				draggableTypes : {
					type : "string[]",
					defaultValue : ["sap.ui.core.Element"]
				},
				elementMover : {
					type : "any" // "sap.ui.dt.plugin.ElementMover"
				}
			},
			associations : {}
		}
	});

	var sDROP_ZONE_STYLE = "sapUiDtOverlayDropZone";

	ControlDragDrop.prototype.init = function() {
		DragDrop.prototype.init.apply(this, arguments);
		this.setElementMover(new ElementMover());
	};

	/**
	 * @override
	 */
	ControlDragDrop.prototype.setElementMover = function(oNewElementMover) {
		var oOldMover = this.getElementMover();
		if (oOldMover !== oNewElementMover) {
			if (oOldMover) {
				oOldMover.destroy();
			}
			this.setProperty("elementMover", oNewElementMover);
		}
	};

	/**
	 * @override
	 */
	ControlDragDrop.prototype.setDraggableTypes = function(aDraggableTypes) {
		this.getElementMover().setMovableTypes(aDraggableTypes);
		return this.setProperty("draggableTypes", aDraggableTypes);
	};

	/**
	 * @override
	 */
	ControlDragDrop.prototype.registerElementOverlay = function(oOverlay) {
		var oElement = oOverlay.getElement();
		if (
			this.getElementMover().isMovableType(oElement)
			&& this.getElementMover().checkMovable(oOverlay)
			&& !OverlayUtil.isInAggregationBinding(oOverlay, oElement.sParentAggregationName)
		) {
			oOverlay.setMovable(true);
		}

		if (this.oDraggedElement) {
			this.getElementMover().activateTargetZonesFor(oOverlay, sDROP_ZONE_STYLE);
		}

		DragDrop.prototype.registerElementOverlay.apply(this, arguments);
	};

	/**
	 * @override
	 */
	ControlDragDrop.prototype.deregisterElementOverlay = function(oOverlay) {
		DragDrop.prototype.deregisterElementOverlay.apply(this, arguments);
		oOverlay.setMovable(false);

		if (this.oDraggedElement) {
			this.getElementMover().deactivateTargetZonesFor(oOverlay, sDROP_ZONE_STYLE);
		}
	};

	/**
	 * returns the dragged overlay (only during drag&drop)
	 *
	 * @public
	 * @return {sap.ui.dt.Overlay} overlays which is dragged
	 */
	ControlDragDrop.prototype.getDraggedOverlay = function() {
		return this._oDraggedOverlay;
	};

	/**
	 * @override
	 */
	ControlDragDrop.prototype.onDragStart = function(oOverlay) {
		this._oDraggedOverlay = oOverlay;
		this.getElementMover().setMovedOverlay(oOverlay);

		this.getElementMover().activateAllValidTargetZones(this.getDesignTime(), sDROP_ZONE_STYLE);
	};

	/**
	 * @override
	 */
	ControlDragDrop.prototype.onDragEnd = function(oOverlay) {
		delete this._oPreviousTarget;
		this.getElementMover().deactivateAllTargetZones(this.getDesignTime(), sDROP_ZONE_STYLE);
		delete this._oDraggedOverlay;
		this.getElementMover().setMovedOverlay(null);
	};

	/**
	 * @override
	 */
	ControlDragDrop.prototype.onDragEnter = function(oTargetOverlay) {
		var oDraggedOverlay = this.getDraggedOverlay();
		if (oTargetOverlay.getElement() !== oDraggedOverlay.getElement()
				&& oTargetOverlay !== this._oPreviousTarget) {
			this.getElementMover().repositionOn(oDraggedOverlay, oTargetOverlay);
		}
		this._oPreviousTarget = oTargetOverlay;
	};

	/**
	 * @override
	 */
	ControlDragDrop.prototype.onAggregationDragEnter = function(oAggregationOverlay) {
		delete this._oPreviousTarget;

		var oDraggedOverlay = this.getDraggedOverlay();
		this.getElementMover().insertInto(oDraggedOverlay, oAggregationOverlay);
	};

	return ControlDragDrop;
}, /* bExport= */true);
