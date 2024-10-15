/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/core/Element'
	], function(
		Element
	) {
	"use strict";

	/**
	 * Constructor for a new FieldValueHelpContentWrapperBase.
	 *
	 * The <code>FieldValueHelp</code> supports different types of content. To map the content control
	 * API to the <code>FieldValueHelp</code>, a wrapper is needed. This base class just defines the API.
	 *
	 * <b>Note:</b> All events and functions must only be used by the corresponding field help.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Base type for <code>FieldValueHelp</code> content control wrapper.
	 * @extends sap.ui.core.Element
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.60.0
	 * @alias sap.ui.mdc.base.FieldValueHelpContentWrapperBase
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var FieldValueHelpContentWrapperBase = Element.extend("sap.ui.mdc.base.FieldValueHelpContentWrapperBase", /** @lends sap.ui.mdc.base.FieldValueHelpContentWrapperBase.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * The selected items.
				 *
				 * A item is an object with properties key and description. 
				 *
				 * <b>Note:</b> This property must only be set by the <code>FieldHelp</code>, not by the application.
				 */
				selectedItems: {
					type: "object[]",
					defaultValue: []
				}
//				/**
//				 * If set the content should only allow single selection
//				 */
//				singleSelection: {
//					type: "boolean",
//					defaultValue: false
//				}
//			},
//			aggregations: {
//				/**
//				 * internal popover
//				 */
//				_popover: {
//					type: "sap.m.Popover",
//					multiple: false,
//					visibility: "hidden"
//				}
			},
			events: {
				/**
				 * This event is fired when a navigation was performed in the content
				 */
				navigate: {
					parameters: {

						/**
						 * The navigated <code>key</code>.
						 */
						key: { type: "any" },

						/**
						 * The navigated <code>description</code>.
						 */
						description: { type: "string" }
					}
				},
				/**
				 * This event is fired when the selection was changed
				 */
				selectionChange: {
					parameters: {
						/**
						 * array of selected items
						 *
						 * Each item is represented as object with properties key and description
						 */
						selectedItems: {type: "object[]"}
					}
				},
				/**
				 * This event is fired when the data of the FieldHelp has changed
				 *
				 * This is needed to determine the text of a key
				 *
				 * <b>Note:</b> This event must only be handled by the control the <code>FieldHelp</code>
				 * belongs to, not by the application.
				 */
				dataUpdate: {
					parameters: {
						/**
						 * If set the content control has changed. If not set only the data has changed
						 */
						contentChange: {type: "boolean"}
					}
				}
			}
		}
	});

	// define empty to add it to inherited wrappers, maybe later it might be filled and other wrappers must not changed.
	FieldValueHelpContentWrapperBase.prototype.init = function() {

	};

	// define empty to add it to inherited wrappers, maybe later it might be filled and other wrappers must not changed.
	FieldValueHelpContentWrapperBase.prototype.exit = function() {

	};

	/**
	 * Initializes the wrapper. This is called if the <code>FieldValueHelp</code> is opened. Here modules
	 * should be loaded that only needed if the help is open.
	 *
	 * @param {boolean} bSuggestion Flag if field help is opened as suggestion or dialog
	 * @return {sap.ui.mdc.base.FieldValueHelpContentWrapperBase} Reference to <code>this</code> in order to allow method chaining
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldValueHelpContentWrapperBase.prototype.initialize = function(bSuggestion) {

		return this;

	};

	/**
	 * Returns the content shown in the value help dialog
	 *
	 * @return {sap.ui.core.Control} content to be shown in the value help
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldValueHelpContentWrapperBase.prototype.getDialogContent = function() {

	};

	/**
	 * Returns the content shown in the value help suggestion popup
	 *
	 * @return {sap.ui.core.Control} content to be shown in the value help
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldValueHelpContentWrapperBase.prototype.getSuggestionContent = function() {

	};

	/**
	 * This function is called if the field help is opened. Here the wrapper can focus the selected
	 * item or do similar things.
	 *
	 * @param {boolean} bSuggestion Flag if field help is opened as suggestion or dialog
	 * @return {sap.ui.mdc.base.FieldValueHelpContentWrapperBase} Reference to <code>this</code> in order to allow method chaining
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldValueHelpContentWrapperBase.prototype.fieldHelpOpen = function(bSuggestion) {

		this._bSuggestion = bSuggestion;
		return this;

	};

	/**
	 * This function is called if the field help is closed. Here the wrapper can focus the selected
	 * item or do similar things.
	 *
	 * @return {sap.ui.mdc.base.FieldValueHelpContentWrapperBase} Reference to <code>this</code> in order to allow method chaining
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldValueHelpContentWrapperBase.prototype.fieldHelpClose = function() {

		delete this._bSuggestion;
		return this;

	};

//	/**
//	 * This function is called if the field help is opened. Here the wrapper can focus the selected
//	 * item or do similar things.
//	 *
//	 * @param {boolean} bSuggestion Flag if field help is opened as suggestion or dialog
//	 * @return {sap.ui.mdc.base.FieldValueHelpContentWrapperBase} Reference to <code>this</code> in order to allow method chaining
//	 * @public
//	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
//	 */
//	FieldValueHelpContentWrapperBase.prototype.fieldHelpOpened = function(bSuggestion) {
//
//		return this;
//
//	};

	/**
	 * Returns true if filtering on the content is supported
	 *
	 * @return {boolean} true if filtering on the content is supported
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldValueHelpContentWrapperBase.prototype.getFilterEnabled = function() {

		return true;

	};

	/**
	 * triggers navigation in the content
	 *
	 * @param {int} iStep number of steps for navigation (e.g. 1 means next item, -1 means previous item)
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldValueHelpContentWrapperBase.prototype.navigate = function(iStep) {

	};

	/**
	 * Determines the text for an given key
	 *
	 * @param {any} vKey key
	 * @return {string} text for key
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldValueHelpContentWrapperBase.prototype.getTextForKey = function(vKey) {

		return "";

	};

	/**
	 * Determines the key for an given text
	 *
	 * @param {string} sText text
	 * @return {any} key for text
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldValueHelpContentWrapperBase.prototype.getKeyForText = function(sText) {

		return undefined;

	};

	/**
	 * Returns the ListBinding used for the field help
	 *
	 * @return {sap.ui.model.ListBinding} ListBinding
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldValueHelpContentWrapperBase.prototype.getListBinding = function() {

	};

/* get Information from FieldHelp. Do not use properties here as it would be difficult to keep them
 * in sync. Also some information depend on the connected field and the state of the field help.
 */

	FieldValueHelpContentWrapperBase.prototype._getFieldHelp = function() {

		var oFieldHelp = this.getParent();

		if (!oFieldHelp || !oFieldHelp.isA("sap.ui.mdc.base.FieldValueHelp")) {
			throw new Error(this.getId() + " must be assigned to a sap.ui.mdc.base.FieldValueHelp");
		}

		return oFieldHelp;

	};

//	FieldValueHelpContentWrapperBase.prototype._getSingleSelection = function() {
//
//		var oFieldHelp = this._getFieldHelp();
//		return oFieldHelp._getSingleSelection();
//
//	};

	FieldValueHelpContentWrapperBase.prototype._getKeyPath = function() {

		var oFieldHelp = this._getFieldHelp();
		return oFieldHelp._getKeyPath();

	};

	FieldValueHelpContentWrapperBase.prototype._getDescriptionPath = function() {

		var oFieldHelp = this._getFieldHelp();
		return oFieldHelp.getDescriptionPath();

	};

	FieldValueHelpContentWrapperBase.prototype._getMaxConditions = function() {

		var oFieldHelp = this._getFieldHelp();
		return oFieldHelp.getMaxConditions();

	};

	return FieldValueHelpContentWrapperBase;

}, /* bExport= */true);
