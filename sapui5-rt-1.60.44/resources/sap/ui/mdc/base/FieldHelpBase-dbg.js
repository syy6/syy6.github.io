/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define(['sap/ui/core/Element', "sap/base/Log"], function(Element, Log) {
	"use strict";

	var Popover;
	var mLibrary;

	/**
	 * Constructor for a new FieldHelpBase.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Base type for <code>fieldFelp</code> aggregation in <code>Field</code> controls.
	 * @extends sap.ui.core.Element
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.54.0
	 * @alias sap.ui.mdc.base.FieldHelpBase
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var FieldHelpBase = Element.extend("sap.ui.mdc.base.FieldHelpBase", /** @lends sap.ui.mdc.base.FieldHelpBase.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * The conditions of the selected items. Using conditions multiple items can be selected
				 *
				 * <b>Note:</b> This property must only be set by the control the <code>FieldHelp</code>
				 * belongs to, not by the application.
				 */
				conditions: {
					type: "object[]",
					defaultValue: []
				},
				/**
				 * The value for what the help should filter
				 *
				 * <b>Note:</b> This has only effect if the <code>FieldHelp</code> support filtering.
				 *
				 * <b>Note:</b> This property must only be set by the control the <code>FieldHelp</code>
				 * belongs to, not by the application.
				 */
				filterValue: {
					type: "string",
					defaultValue: ""
				}
			},
			aggregations: {
				/**
				 * internal popover
				 */
				_popover: {
					type: "sap.m.Popover",
					multiple: false,
					visibility: "hidden"
				}
			},
			events: {
				/**
				 * This event is fired when a value is selected in the <code>FieldHelp</code>
				 *
				 * <b>Note:</b> This event must only be handled by the control the <code>FieldHelp</code>
				 * belongs to, not by the application.
				 */
				select: {
					parameters: {

						/**
						 * The selected <code>value</code>.
						 */
						value: { type: "any" },

						/**
						 * The selected <code>additionalValue</code>.
						 */
						additionalValue: { type: "any" },

						/**
						 * The selected <code>key</code>.
						 */
						key: { type: "string" },

						/**
						 * The selected <code>conditions</code>.
						 */
						conditions: { type: "object[]" },

						/**
						 * If set. the selected <code>conditions</code> should be added, otherwise they should replace the existing ones.
						 * @since 1.60.0
						 */
						add: { type: "boolean" }
					}
				},
				/**
				 * This event is fired when a value is navigated in the valueHelp
				 *
				 * <b>Note:</b> This event must only be handled by the control the <code>FieldHelp</code>
				 * belongs to, not by the application.
				 */
				navigate: {
					parameters: {

						/**
						 * The navigated <code>value</code>.
						 */
						value: { type: "any" },

						/**
						 * The navigated <code>additionalValue</code>.
						 */
						additionalValue: { type: "any" },

						/**
						 * The navigated <code>key</code>.
						 */
						key: { type: "any" }
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
				},
				/**
				 * This event is fired when the <code>FieldHelp</code> is disconnected from a control
				 *
				 * <b>Note:</b> This event must only be handled by the control the <code>FieldHelp</code>
				 * belongs to, not by the application.
				 */
				disconnect: {
				},

				/**
				 * This event is fired when the <code>FieldHelp</code> is opened
				 * @since 1.60.0
				 */
				open: {
					/**
					 * If set, the FieldHelp is opened for suggestion.
					 */
					suggestion: { type: "boolean" }
				}
			}
		}
	});

	// define empty to add it to inherited FieldHelps, maybe later it might be filled and other FielfHelps must not changed.
	FieldHelpBase.prototype.init = function() {

	};

	// define empty to add it to inherited FieldHelps, maybe later it might be filled and other FielfHelps must not changed.
	FieldHelpBase.prototype.exit = function() {

	};

	FieldHelpBase.prototype.invalidate = function(oOrigin) {
		// do not invalidate parent as this must not be the one who is the active parent.
		// invalidation must be done by Dialog.
		if (oOrigin) {
			var oPopover = this.getAggregation("_popover");
			if (oPopover && oOrigin === oPopover) {
				if (oOrigin.bOutput) {
					var oStatic = sap.ui.getCore().getStaticAreaRef();
					oStatic = sap.ui.getCore().getUIArea(oStatic);
					oStatic.addInvalidatedControl(oOrigin);
				}
				return;
			}
		}

	};

	FieldHelpBase.prototype.setFilterValue = function(sFilterValue) {

		this.setProperty("filterValue", sFilterValue, true); // do not invalidate whole FieldHelp

		return this;

	};

	/**
	 * Connects the <code>FieldHelp</code> to a control
	 *
	 * If the <code>FieldHelp</code> is used as association to multiple controls it has to know
	 * the current active control to open and interact. If the <code>FieldHelp</code> is set as aggregation
	 * to one single control the connection is not necessary.
	 *
	 * If the <code>FieldHelp</code> is connected to a control, the <code>disconnected</code> event is fired
	 * to inform the old control.
	 *
	 * <b>Note:</b> This function must only be called by the control the <code>FieldHelp</code>
	 * belongs to, not by the application.
	 *
	 * @param {sap.ui.core.Control} oField field where the <code>FieldHelp</code> is connected to.
	 * @return {sap.ui.mdc.base.FieldHelpBase} Reference to <code>this</code> in order to allow method chaining
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.connect = function(oField) {

		if (this._oField && this._oField !== oField) {
			var oPopover = this.getAggregation("_popover");
			if (oPopover) {
				oPopover._oPreviousFocus = null; // TODO - find real solution
			}
			this.close();
			this.setFilterValue("");
			this.setConditions([]);
			this.fireDisconnect();
		}

		this._oField = oField;

		return this;

	};

	/**
	 * Returns the currently active control the <code>FieldHelp</code> is assigned to.
	 *
	 * This is the control set by the <code>connect</code> function or the parent.
	 *
	 * @return {sap.ui.core.Control} control where the <code>FieldHelp</code> is connected to.
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype._getField = function() {

		if (this._oField) {
			return this._oField;
		} else {
			return this.getParent();
		}

	};

	/**
	 * Returns the currently used FieldPath.
	 *
	 * This is taken from the connected field.
	 *
	 * @return {string} FieldPath.
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.getFieldPath = function() {

		var sFieldPath = "";

		if (this._oField && this._oField.getFieldPath) {
			// if Field or FilterField -> use it's fieldPath
			sFieldPath =  this._oField.getFieldPath();
		}

		return sFieldPath;

	};

	FieldHelpBase.prototype.getDomRef = function() {

		var oPopover = this.getAggregation("_popover");
		if (oPopover) {
			return oPopover.getDomRef();
		} else {
			return Element.prototype.getDomRef.apply(this, arguments);
		}

	};

	/**
	 * Opens the FieldHelp on the parent <code>Field</code> control
	 *
	 * <b>Note:</b> This function must only be called by the control the <code>FieldHelp</code>
	 * belongs to, not by the application.
	 *
	 * @param {boolean} bSuggestion flag if field help should be opened for suggestion or for ValueHelp
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.open = function(bSuggestion) {

		var oField = this._getField();

		if (oField) {
			var oPopover = this._getPopover();

			if (oPopover) {
				if (!oPopover.isOpen()) {
//					var iWidth = oField.$().outerWidth();
//					oPopover.setContentMinWidth(iWidth + "px");
					this.fireOpen({suggestion: bSuggestion});
					if (oPopover._getAllContent().length > 0) { // TODO: better check if no content?
						oPopover.openBy(oField);
					} else {
						this._bOpenIfContent = true;
					}
				}
			} else {
				this._bOpen = true;
				this._bSuggestion = bSuggestion;
			}
		} else {
			Log.warning("FieldHelp not assigned to field -> can not be opened.", this);
		}

	};

	/**
	 * closes the FieldHelp
	 *
	 * <b>Note:</b> This function must only be called by the control the <code>FieldHelp</code>
	 * belongs to, not by the application.
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.close = function() {

		var oPopover = this.getAggregation("_popover");

		if (oPopover && oPopover.isOpen()) {
			var eOpenState = oPopover.oPopup.getOpenState();
			if (eOpenState !== "CLOSED" && eOpenState !== "CLOSING") { // TODO: better logic
				this._bClosing = true;
				oPopover.close();
			}
		} else {
			delete this._bOpen;
			delete this._bSuggestion;
			delete this._bOpenIfContent;
		}

		this._bReopen = false;

	};

	/**
	 * toggles the open state of the FieldHelp on the parent <code>Field</code> control
	 *
	 * <b>Note:</b> This function must only be called by the control the <code>FieldHelp</code>
	 * belongs to, not by the application.
	 *
	 * @param {boolean} bSuggestion flag if field help should be opened for suggestion or for ValueHelp
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.toggleOpen = function(bSuggestion) {

		var oPopover = this._getPopover();

		if (oPopover) {
			if (oPopover.isOpen()) {
				var eOpenState = oPopover.oPopup.getOpenState();
				if (eOpenState !== "CLOSED" && eOpenState !== "CLOSING") { // TODO: better logic
					this.close();
				} else {
					this._bReopen = true;
				}
			} else {
				this.open(bSuggestion);
			}
		} else {
			this._bOpen = !this._bOpen;
			this._bSuggestion = bSuggestion;
			this._bOpenIfContent = this._bOpen ? this._bOpenIfContent : false;
		}

	};

	/**
	 * creates the internal Popover
	 *
	 * To be used by an inherited FieldHelp, not from outside.
	 *
	 * @return {sap.m.Popover} Popover
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype._createPopover = function() {

		var oPopover;

		if ((!Popover || !mLibrary) && !this._bPopoverRequested) {
			Popover = sap.ui.require("sap/m/Popover");
			mLibrary = sap.ui.require("sap/m/library");
			if (!Popover || !mLibrary) {
				sap.ui.require(["sap/m/Popover", "sap/m/library"], _PopoverLoaded.bind(this));
				this._bPopoverRequested = true;
			}
		}
		if (Popover && mLibrary && !this._bPopoverRequested) {
			oPopover = new Popover(this.getId() + "-pop", {
				placement: mLibrary.PlacementType.Bottom,
				showHeader: false,
				showArrow: false,
				afterOpen: this._handleAfterOpen.bind(this),
				afterClose: this._handleAfterClose.bind(this)
			});

			this.setAggregation("_popover", oPopover, true);

			if (this._oContent) {
				this._setContent(this._oContent);
			}
		}


		return oPopover;

	};

	function _PopoverLoaded(fnPopover, fnLibrary) {

		Popover = fnPopover;
		mLibrary = fnLibrary;
		this._bPopoverRequested = false;

		if (!this._bIsBeingDestroyed) {
			this._createPopover();
			if (this._bOpen) {
				this.open(this._bSuggestion);
				delete this._bOpen;
				delete this._bSuggestion;
			}
		}

	}

	/**
	 * returns the internal Popover. If the Popover not exist it will be created
	 *
	 * To be used by an inherited FieldHelp, not from outside.
	 *
	 * @return {sap.m.Popover} Popover
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype._getPopover = function() {

		var oPopover = this.getAggregation("_popover");

		if (!oPopover) {
			oPopover = this._createPopover();
		}

		return oPopover;

	};

	/**
	 * Executed after the Popup has opened
	 *
	 * To be used by an inherited FieldHelp, not from outside.
	 *
	 * @param {object} oEvent event object
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype._handleAfterOpen = function(oEvent) {
	};

	/**
	 * Executed after the Popup has been closed
	 *
	 * To be used by an inherited FieldHelp, not from outside.
	 *
	 * @param {object} oEvent event object
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype._handleAfterClose = function(oEvent) {

		this._bClosing = false;

		if (this._bReopen) {
			this._bReopen = false;
			this.open();
		}

	};

	/**
	 * Determines if the field help should be opened if something is typed into the field
	 *
	 * <b>Note:</b> This function must only be called by the control the <code>FieldHelp</code>
	 * belongs to, not by the application.
	 *
	 * @return {boolean} if true the field help should open by typing
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.openByTyping = function() {

		return false;

	};

	/**
	 * triggers navigation in the fieldHelp
	 *
	 * <b>Note:</b> This function must only be called by the control the <code>FieldHelp</code>
	 * belongs to, not by the application.
	 *
	 * @param {int} iStep number of steps for navigation (e.g. 1 means next item, -1 means previous item)
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.navigate = function(iStep) {
		// to be implements by the concrete FieldHelp
	};

	/**
	 * Determines the text for an given key
	 *
	 * <b>Note:</b> This function must only be called by the control the <code>FieldHelp</code>
	 * belongs to, not by the application.
	 *
	 * @param {any} vKey key
	 * @return {string} text for key
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.getTextForKey = function(vKey) {
		// to be implements by the concrete FieldHelp
		return "";
	};

	/**
	 * Determines the key for an given text
	 *
	 * <b>Note:</b> This function must only be called by the control the <code>FieldHelp</code>
	 * belongs to, not by the application.
	 *
	 * <b>Note:</b> As this must not unique the result key may be just one for one of the matching texts
	 *
	 * @param {string} sText text
	 * @return {any} key for text
	 *
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.getKeyForText = function(sText) {
		// to be implements by the concrete FieldHelp
		return undefined;
	};

	/**
	 * Sets the content of the FieldHelp
	 *
	 * To be used by an inherited FieldHelp, not from outside.
	 *
	 * @param {string} oContent content control to be placed at the Popover
	 * @return {sap.ui.mdc.base.FieldHelpBase} Reference to <code>this</code> to allow method chaining
	 * @protected
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype._setContent = function(oContent) {

		var oPopover = this.getAggregation("_popover");

		if (oPopover) {
			oPopover.removeAllContent();
			oPopover.addContent(oContent);
			this._oContent = undefined;
			if (this._bOpenIfContent) {
				var oField = this._getField();
				if (oField) {
					oPopover.openBy(oField);
				}
				this._bOpenIfContent = false;
			}
		} else {
			this._oContent = oContent;
		}
		return this;

	};

	/**
	 * Determines the icon for the value help.
	 *
	 * @return {string} name of the icon
	 *
	 * @since 1.60.0
	 * @public
	 * @ui5-metamodel This method also will be described in the UI5 (legacy) designtime metamodel
	 */
	FieldHelpBase.prototype.getIcon = function() {
		return "sap-icon://slim-arrow-down";
	};

	return FieldHelpBase;

}, /* bExport= */true);
