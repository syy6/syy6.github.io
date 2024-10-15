/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/m/OverflowToolbar', 'sap/m/ToolbarSpacer', 'sap/m/ToolbarSeparator'
], function(OverflowToolbar, ToolbarSpacer, ToolbarSeparator) {
	"use strict";

	/**
	 * Constructor for a new Action Toolbar.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The column for the metadata driven table, that hold the template to be shown when the rows has data.
	 *        <h3><b>Note:</b></h3>
	 *        The control is experimental and the API/behaviour is not finalised and hence this should not be used for productive usage.
	 * @extends sap.ui.core.Element
	 * @author SAP SE
	 * @constructor The API/behaviour is not finalised and hence this control should not be used for productive usage.
	 * @private
	 * @experimental
	 * @since 1.58
	 * @alias sap.ui.mdc.ActionToolbar
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */

	var ActionToolbar = OverflowToolbar.extend("sap.ui.mdc.ActionToolbar", {
		metadata: {
			defaultAggregation: "actions",
			aggregations: {
				left: {
					type: "sap.ui.core.Control",
					multiple: true
				},
				actions: {
					type: "sap.ui.core.Control",
					multiple: true
				},
				right: {
					type: "sap.ui.core.Control",
					multiple: true
				}
			}
		},
		renderer: {}
	});

	ActionToolbar.prototype.getSpacer = function() {
		if (!this._oSpacer) {
			this._oSpacer = new ToolbarSpacer();
			this.addDependent(this._oSpacer);
		}
		return this._oSpacer;
	};

	ActionToolbar.prototype.getSeparator = function() {
		if (!this._oSeparator) {
			this._oSeparator = new ToolbarSeparator();
			this.addDependent(this._oSeparator);
		}
		return this._oSeparator;
	};

	ActionToolbar.prototype.getContent = function() {
		return [].concat(this.getLeft(), this.getSpacer(), this.getActions(), this.getSeparator(), this.getRight());
	};

	return ActionToolbar;
}, true);
