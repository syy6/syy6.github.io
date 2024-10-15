/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.smartform.SmartForm.
sap.ui.define([
	'sap/ui/comp/library',
	'sap/ui/core/Control',
	'sap/ui/layout/form/Form',
	'sap/ui/base/ManagedObjectObserver',
	'sap/base/Log'
], function(library, Control, Form, ManagedObjectObserver, Log) {
	"use strict";

	/* eslint-disable no-lonely-if */
	var Panel;
	var Title;
	var OverflowToolbar;
	var ToolbarSpacer;
	var ToolbarSeparator;
	var Button;
	var MessageBox;
	var mLibrary;

	var mFormLayouts = {
			ResponsiveGridLayout: {layout: undefined, path: "sap/ui/layout/form/ResponsiveGridLayout", name: "sap.ui.layout.form.ResponsiveGridLayout", requested: false, loaded: _ResponsiveGridLayoutLoaded, promise: undefined},
			ResponsiveLayout: {layout: undefined, path: "sap/ui/layout/form/ResponsiveLayout", name: "sap.ui.layout.form.ResponsiveLayout", requested: false, loaded: _ResponsiveLayoutLoaded, promise: undefined},
			ColumnLayout: {layout: undefined, path: "sap/ui/layout/form/ColumnLayout", name: "sap.ui.layout.form.ColumnLayout", requested: false, loaded: _ColumnLayoutLoaded, promise: undefined}
	};

	/**
	 * Constructor for a new smartform/SmartForm.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 * @class The <code>SmartForm</code> control renders a form (<code>sap.ui.layout.form.Form</code>).
	 *        When used with the <code>SmartField</code> control the label is taken from the
	 *        metadata annotation <code>sap:label</code> if not specified directly.
	 *
	 * <b>Warning:</b> Do not put any layout or other container controls into the <code>GroupElement</code>.
	 * Views are also not supported. This could damage the visual layout, keyboard support and screen-reader support.
	 *
	 * @extends sap.ui.core.Control
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartform.SmartForm
	 * @see {@link topic:99e33bdfde074bb48d2e603fa5ecd2d0 Smart Form}
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartForm = Control.extend("sap.ui.comp.smartform.SmartForm", /**
																		 * @lends sap.ui.comp.smartform.SmartForm.prototype
																		 */
	{
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartform/SmartForm.designtime",
			properties: {

				/**
				 * Title of the form.
				 */
				title: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies whether the groups are rendered in a {@link sap.ui.layout.form.ResponsiveLayout ResponsiveLayout}
				 * with the label above the field. Each group is rendered in a new line.
				 *
				 * <b>Note</b> The value of this property will be passed on to the <code>useHorizontalLayout</code>
				 * property of all <code>Group</code> and <code>GroupElement</code> elements.
				 */
				useHorizontalLayout: {
					type: "boolean",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies the minimal size in pixels of all group elements of the form if the horizontal layout is used.
				 *
				 * @deprecated Since version 1.48.0, please do not use this property as it does not have any effect on the current layout of the <code>SmartForm</code> control.
				 */
				horizontalLayoutGroupElementMinWidth: {
					type: "int",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies whether a check button is added to the toolbar.
				 */
				checkButton: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * CSV of entity types for which the flexibility features are available.<br>
				 * For more information about SAPUI5 flexibility, refer to the Developer Guide.<br>
				 * <b>Note:</b>
				 * No validation is done. Please ensure that you do not add spaces or special characters.
				 */
				entityType: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies whether the control is expandable. Per default the control is not rendered as expanded.
				 */
				expandable: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * If expandable, this property indicates whether the state is expanded or not. If expanded, then the toolbar (if available) and the
				 * content is rendered; if expanded is false, then only the headerText/headerToolbar is rendered.
				 */
				expanded: {
					type: "boolean",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If set to <code>true</code>, a button to toggle the <code>editable</code> property is shown in the toolbar.
				 */
				editTogglable: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * Specifies whether the form is editable.
				 */
				editable: {
					type: "boolean",
					group: "Misc",
					defaultValue: false
				},

				/**
				 * CSV of fields that must be ignored in the OData metadata by the SmartForm control.<br>
				 * <b>Note:</b><br>
				 * No validation is done. Please ensure that you do not add spaces or special characters.
				 */
				ignoredFields: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies whether the form enables flexibility features, such as adding new fields.<br>
				 * For more information about SAPUI5 flexibility, refer to the Developer Guide.
				 */
				flexEnabled: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				}
			},
			defaultAggregation: "groups",
			aggregations: {

				/**
				 * Groups are used to group form elements.
				 */
				groups: {
					type: "sap.ui.comp.smartform.Group",
					multiple: true,
					singularName: "group"
				},

				/**
				 * Content to be rendered.
				 */
				content: {
					type: "sap.ui.core.Control",
					multiple: false,
					visibility: "hidden"
				},

				/**
				 * Layout settings to adjust the used layout.
				 */
				layout: {
					type: "sap.ui.comp.smartform.SmartFormLayout",
					multiple: false
				},

				/**
				 * The Semantic Object Controller allows the user to specify and overwrite functionality for semantic object navigation.
				 */
				semanticObjectController: {
					type: "sap.ui.comp.navpopover.SemanticObjectController",
					multiple: false
				},

				/**
				 * An additional toolbar that can be added by the users, which can contain further custom buttons, controls, etc.
				 */
				customToolbar: {
					type: "sap.m.Toolbar",
					multiple: false
				},

				/**
				 * Toolbar
				 */
				toolbar: {
					type: "sap.m.Toolbar",
					multiple: false,
					visibility: "hidden"
				}
			},
			associations: {

				/**
				 * Association to controls / IDs that label this control (see WAI-ARIA attribute <code>aria-labelledby</code>).
				 * @since 1.56.0
				 */
				ariaLabelledBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" }
			},
			events: {

				/**
				 * This event is fired when the editable property is toggled.
				 */
				editToggled: {
					parameters: {
						/**
						 * If <code>true</code>, the control is in edit mode
						 */
						editable: {
							type: "boolean"
						}
					}
				},

				/**
				 * This event is fired after check was performed.
				 */
				checked: {
					parameters: {
						/**
						 * An array containing all smart fields with errors
						 */
						erroneousFields: {
							type: "sap.ui.comp.smartfield.SmartField[]"
						}
					}
				}
			}
		},
		renderer: function(oRm, oSmartForm) {
			oRm.write("<div");
			oRm.writeControlData(oSmartForm);
			oRm.addClass("sapUiCompSmartForm");
			oRm.writeClasses();
			oRm.write(">");

			var oContent = oSmartForm.getAggregation("content");
			oRm.renderControl(oContent);

			oRm.write("</div>");
		}
	});

	SmartForm.prototype.init = function() {

		this._oForm = new Form(this.getId() + "--Form");
		this._oForm.getToolbar = function(){
			var oSmartForm = this.getParent();
			if (oSmartForm && !oSmartForm.getExpandable()) {
				return oSmartForm._getToolbar();
			}
		};

		this.setAggregation("content", this._oForm);
		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp");

		this._oObserver = new ManagedObjectObserver(_observeChanges.bind(this));

		this._oObserver.observe(this, {
			properties: ["editTogglable",
			             "title",
			             "checkButton",
			             "useHorizontalLayout",
			             "horizontalLayoutGroupElementMinWidth",
			             "expandable",
			             "expanded"],
			aggregations: ["layout",
			               "customData"],
			associations: ["ariaLabelledBy"]
		});

	};

	SmartForm.prototype.onBeforeRendering = function() {

		_determineFormLayout.call(this);

	};

	SmartForm.prototype.addGroup = function(oGroup) {

		if (!oGroup) {
			return this;
		}

		// as "groups" aggregation is not used, at least validate it
		oGroup = this.validateAggregation("groups", oGroup, /* multiple */ true);

		_inheritCustomData.call(this, oGroup);
		this._delegateEditMode(oGroup);

		this._oForm.addFormContainer(oGroup);

		_enhanceGroup.call(this, oGroup);

		return this;

	};

	SmartForm.prototype.getGroups = function() {
		return this._oForm.getFormContainers();

	};

	SmartForm.prototype.indexOfGroup = function(oGroup) {

		return this._oForm.indexOfFormContainer(oGroup);

	};

	SmartForm.prototype.insertGroup = function(oGroup, iIndex) {

		if (!oGroup) {
			return this;
		}

		// as "groups" aggregation is not used, at least validate it
		oGroup = this.validateAggregation("groups", oGroup, /* multiple */ true);

		_inheritCustomData.call(this, oGroup);
		this._delegateEditMode(oGroup);

		this._oForm.insertFormContainer(oGroup, iIndex);

		_enhanceGroup.call(this, oGroup);

		return this;

	};

	SmartForm.prototype.removeGroup = function(vGroup) {

		var oGroup = this._oForm.removeFormContainer(vGroup);

		if (oGroup) {
			oGroup.detachEvent("_visibleChanged", _updateColumnsForLayout, this);
			_removeCustomData.call(this, oGroup);
			_updateColumnsForLayout.call(this);
		}

		return oGroup;

	};

	SmartForm.prototype.removeAllGroups = function() {

		var aGroups = this._oForm.removeAllFormContainers();

		for (var i = 0; i < aGroups.length; i++) {
			aGroups[i].detachEvent("_visibleChanged", _updateColumnsForLayout, this);
			_removeCustomData.call(this, aGroups[i]);
		}
		_updateColumnsForLayout.call(this);

		return aGroups;

	};

	SmartForm.prototype.destroyGroups = function() {

		var aGroups = this.getGroups();
		for (var i = 0; i < aGroups.length; i++) {
			aGroups[i].detachEvent("_visibleChanged", _updateColumnsForLayout, this);
		}

		this._oForm.destroyFormContainers();
		_updateColumnsForLayout.call(this);

		return this;

	};

	function _enhanceGroup(oGroup) {

		var bUseHorizontalLayout = this.getUseHorizontalLayout();
		var iHorizontalLayoutGroupElementMinWidth = this.getHorizontalLayoutGroupElementMinWidth();

		oGroup.attachEvent("_visibleChanged", _updateColumnsForLayout, this);
		if (iHorizontalLayoutGroupElementMinWidth != oGroup.getHorizontalLayoutGroupElementMinWidth) {
			oGroup.setHorizontalLayoutGroupElementMinWidth(iHorizontalLayoutGroupElementMinWidth);
		}
		if (bUseHorizontalLayout != oGroup.getUseHorizontalLayout()) {
			oGroup.setUseHorizontalLayout(bUseHorizontalLayout);
		}
		if (bUseHorizontalLayout) {
			oGroup._updateGridDataSpan();
			oGroup._updateLineBreaks();
		} else {
			_updateColumnsForLayout.call(this);
		}

	}

	/**
	 * @return {object} oToolbar Returns the toolbar.
	 * @private
	 */
	SmartForm.prototype._getToolbar = function() {
		var oCustomToolbar = this.getCustomToolbar();
		return oCustomToolbar || this.getAggregation("toolbar");
	};

	/**
	 * Sets default span for <code>GridData</code> layout of group elements when used with horizontal layout.
	 *
	 * <b>Note:</b> There is no need to call this function
	 * as the update of all <code>GroupElement</code> elements inside the <code>SmartForm</code> control is triggered automatically
	 * if the <code>GridDataSpan</code> property of the <code>Layout</code> aggregation changes or the <code>Layout</code> aggregation is added.
	 * @return {sap.ui.comp.smartform.SmartForm} <code>this</code> to allow method chaining.
	 * @public
	 */
	SmartForm.prototype.propagateGridDataSpan = function() {

		var aGroups = this.getGroups();
		for (var i = 0; i < aGroups.length; i++) {
			var oGroup = aGroups[i];
			oGroup._updateGridDataSpan();
			oGroup._updateLineBreaks();
		}

		return this;

	};

	SmartForm.prototype._getGridDataSpanNumbers = function( ) {

		var oLayout = this.getLayout();
		var oSpan;

		if (oLayout && oLayout._getGridDataSpanNumbers) {
			oSpan = oLayout._getGridDataSpanNumbers();
		}

		return oSpan;

	};

	/**
	 * Change to edit/read only depending on the current state.
	 *
	 * @private
	 */
	SmartForm.prototype._toggleEditMode = function() {

		var bEditable = this.getEditable();
		this.setEditable(!bEditable);

	};

	/**
	 * Checks smart fields for client errors.
	 *
	 * @param {boolean} bConsiderOnlyVisible Determines is only visible fields in visible groups should be considered. default: <code>true</code>
	 * @returns {string[]} An array of fields with errors
	 * @public
	 */
	SmartForm.prototype.check = function(bConsiderOnlyVisible) {

		var aErroneousFields = this._checkClientError(bConsiderOnlyVisible);
		return aErroneousFields;

	};

	/**
	 * Check smart fields for client errors.
	 *
	 * @param {boolean} bConsiderOnlyVisible determines if only visible filters of visible <code>groups</code> and <code>groupElements</code> should be considered. Default. <code>true</code>
	 * @returns {string[]} an array of fields with errors
	 * @private
	 */
	SmartForm.prototype._checkClientError = function(bConsiderOnlyVisible) {

		if (bConsiderOnlyVisible === undefined) {
			bConsiderOnlyVisible = true;
		}

		var aFields = this.getSmartFields(bConsiderOnlyVisible, bConsiderOnlyVisible);
		var aErroneousFields = [];
		var oGroup = null;
		aFields.forEach(function(oField) {
			if (oField.checkClientError()) {

				if (bConsiderOnlyVisible && oField.getVisible) {
					if (!oField.getVisible()) {
						return;
					}
				}

				oGroup = oField.getParent();
				while (oGroup.getParent) {
					oGroup = oGroup.getParent();
					if (oGroup.isA("sap.ui.comp.smartform.Group")) {
						if (!oGroup.getExpanded()) {
							oGroup.setExpanded(true);
						}
						break;
					}
				}
				aErroneousFields.push(oField.getId());
			}
		});
		return aErroneousFields;
	};

	/**
	 * Displays error message.
	 * @param {array} aErroneousFields field with error
	 * @private
	 */
	SmartForm.prototype._displayError = function(aErroneousFields) {

		var sErrorTitle = this._oRb.getText("FORM_CLIENT_CHECK_ERROR_TITLE");
		var sErrorMessage = this._oRb.getText("FORM_CLIENT_CHECK_ERROR");

		if (!MessageBox && !this._bMessageBoxRequested) {
			MessageBox = sap.ui.require("sap/m/MessageBox");
			if (!MessageBox) {
				sap.ui.require(["sap/m/MessageBox"], _MessageBoxLoaded.bind(this));
				this._bMessageBoxRequested = true;
			}
		}

		if (MessageBox) {
			MessageBox.show(sErrorMessage, {
				icon: MessageBox.Icon.ERROR,
				title: sErrorTitle,
				styleClass: (this.$() && this.$().closest(".sapUiSizeCompact").length) ? "sapUiSizeCompact" : ""
			});
		}
	};

	function _MessageBoxLoaded(fnMessageBox) {

		MessageBox = fnMessageBox;
		this._bMessageBoxRequested = false;

		if (!this._bIsBeingDestroyed) {
			_checkForError.call(this);
		}

	}

	function _checkForError() {

		var aErroneousFields = this.check(true);
		if (aErroneousFields && aErroneousFields.length > 0) {
			this._displayError(aErroneousFields);
			return true;
		}

		return false;

	}

	SmartForm.prototype.setEditable = function(bEditable) {

		var bOldEditable = this.getEditable();
		bEditable = this.validateProperty("editable", bEditable);

		if (bOldEditable === bEditable) {
			return this;
		}

		if (!bEditable && this.hasListeners("editToggled")) {
			if (_checkForError.call(this)) {
				return this;
			}
		}

		this.setProperty("editable", bEditable);
		if (this._oForm) {
			this._oForm.setEditable(bEditable);
		}

		this.fireEditToggled({
			editable: bEditable
		});

		if (this._oEditToggleButton) {
			this._oEditToggleButton.setIcon(bEditable ? "sap-icon://display" : "sap-icon://edit");
			var sTooltip = this._oRb.getText(bEditable ? "FORM_TOOLTIP_DISPLAY" : "FORM_TOOLTIP_EDIT");
			this._oEditToggleButton.setTooltip(sTooltip);
		}

		var aGroup = this.getGroups();
		aGroup.forEach(function(oGroup) {
			oGroup.setEditMode(bEditable);
		});

		if (this.getCheckButton() && bEditable) {
			_addCheckButtonToToolbar.call(this);
		} else {
			_removeCheckButtonFromToolbar.call(this);
		}

		return this;

	};

	function _observeChanges(oChanges){

		if (oChanges.object == this) {
			// it's the SmartForm
			if (oChanges.name == "editTogglable") {
				_setEditTogglable.call(this, oChanges.current);
			} else if (oChanges.name == "title") {
				_setTitle.call(this, oChanges.current);
			} else if (oChanges.name == "checkButton") {
				_setCheckButton.call(this, oChanges.current);
			} else if (oChanges.name == "useHorizontalLayout") {
				_setUseHorizontalLayout.call(this, oChanges.current);
			} else if (oChanges.name == "horizontalLayoutGroupElementMinWidth") {
				_setHorizontalLayoutGroupElementMinWidth.call(this, oChanges.current);
			} else if (oChanges.name == "expanded") {
				_setExpanded.call(this, oChanges.current);
			} else if (oChanges.name == "expandable") {
				_setExpandable.call(this, oChanges.current);
			} else if (oChanges.name == "layout") {
				_updateLayout.call(this, oChanges.child, oChanges.mutation);
			} else if (oChanges.name == "customData") {
				_updateCustomData.call(this, oChanges.child, oChanges.mutation);
			} else if (oChanges.name == "ariaLabelledBy") {
				_updateAriaLabelledBy.call(this, oChanges.ids, oChanges.mutation);
			}
		} else if (oChanges.object.isA("sap.ui.comp.smartform.SmartFormLayout")) {
			_layoutChanged.call(this, oChanges.object, oChanges.name, oChanges.current, oChanges.old);
		}

	}


	function _setEditTogglable(bTogglable) {

		if (bTogglable) {
			_addEditableButtonToToolbar.call(this);
		} else {
			_removeEditableButtonFromToolbar.call(this);
		}

		_useTitleOrToolbar.call(this);

	}

	function _setTitle(sTitle) {

		// TODO: do not need to rerender whole Form
		if (this._oPanel) {
			this._oPanel.setHeaderText(sTitle);
		}

		_useTitleOrToolbar.call(this);

	}

	function _setCheckButton(bCheckButton) {

		// TODO: do not need to rerender whole Form
		if (bCheckButton) {
			_addCheckButtonToToolbar.call(this);
		} else {
			_removeCheckButtonFromToolbar.call(this);
		}

		_useTitleOrToolbar.call(this);

	}

	function _setUseHorizontalLayout(bUseHorizontalLayout) {

		if (bUseHorizontalLayout) {
			this.addStyleClass("sapUiCompSmartFormHorizontalLayout");
		} else {
			this.removeStyleClass("sapUiCompSmartFormHorizontalLayout");
		}

		// update groups
		var aGroup = this.getGroups();
		if (aGroup) {
			aGroup.forEach(function(oGroup) {
				if (oGroup.getUseHorizontalLayout() != bUseHorizontalLayout) {
					oGroup.setUseHorizontalLayout(bUseHorizontalLayout);
				}
			});
		}

		var oLayout = this.getLayout();
		if (bUseHorizontalLayout) {
			// if ResponsiveLayout is needed this will be checked before rendering as Layout needs to be updated before
			_updateFormLayout.call(this, oLayout);
		} else {
			// ResponsiveLayout not longer needed (if used) - remove and create new ResponsiveGridLayout or ColumnLayout and use Layouts settings
			_determineFormLayout.call(this);
			_updateFormLayout.call(this, oLayout);
		}

	}

	function _updateLayout(oLayout, sMutation) {

		if (sMutation === "remove") {
			this._oObserver.unobserve(oLayout);
		} else {
			this._oObserver.observe(oLayout, {properties: true});
		}

		if (oLayout.isA("sap.ui.comp.smartform.Layout")) {
			this.propagateGridDataSpan();
		}

		// now we can decide to use ResponsiveLayout or not
		_determineFormLayout.call(this);
		_updateFormLayout.call(this, sMutation === "insert" ? oLayout : null);

	}

	function _setHorizontalLayoutGroupElementMinWidth(nMinWidth) {

		Log.error("HorizontalLayoutGroupElementMinWidth is deprecated", this);

		// update groups
		var aGroup = this.getGroups();
		if (aGroup) {
			aGroup.forEach(function(oGroup) {
				oGroup.setHorizontalLayoutGroupElementMinWidth(nMinWidth);
			});
		}

	}

	/**
	 * Returns the array of properties currently visible on the UI.
	 *
	 * @return {string[]} The properties currently visible
	 * @public
	 */
	SmartForm.prototype.getVisibleProperties = function() {

		var aProperty = [];

		var aGroup = this.getGroups();
		if (aGroup) {
			aGroup.forEach(function(oGroup) {
				var aGroupElements = oGroup.getGroupElements();
				if (aGroupElements.length > 0) {
					aGroupElements.forEach(function(oGroupElement) {
						var aElements = oGroupElement.getElements();
						if (aElements.length > 0) {
							aElements.forEach(function(oElement) {
								if (oElement.getVisible()) {
									var sPath = oElement.getBindingPath("value");
									if (sPath) {
										aProperty.push(sPath);
									}
								}
							});
						}
					});
				}
			});
		}

		return aProperty;

	};

	SmartForm.prototype.setCustomToolbar = function(oCustomToolbar) {

		var oOldCustomToolbar = this.getCustomToolbar();

		if (oOldCustomToolbar == oCustomToolbar) {
			return this;
		}

		// remove content from old toolbar
		_removeTitleFromToolbar.call(this);
		_removeEditableButtonFromToolbar.call(this);
		_removeCheckButtonFromToolbar.call(this);

		this.setAggregation("customToolbar", oCustomToolbar);

		// add content to new toolbar
		if (this.getTitle()) {
			_useTitleOrToolbar.call(this);
		}
		if (this.getEditTogglable()) {
			_addEditableButtonToToolbar.call(this);
		}
		if (this.getCheckButton()) {
			_addCheckButtonToToolbar.call(this);
		}

		return this;

	};

	SmartForm.prototype.destroyCustomToolbar = function() {

		var oCustomToolbar = this.getCustomToolbar();

		if (oCustomToolbar) {
			// remove content from cutomToolbar
			_removeTitleFromToolbar.call(this);
			_removeEditableButtonFromToolbar.call(this);
			_removeCheckButtonFromToolbar.call(this);
		}

		this.destroyAggregation("customToolbar");

		// add content to private toolbar
		if (this.getTitle()) {
			_useTitleOrToolbar.call(this);
		}
		if (this.getEditTogglable()) {
			_addEditableButtonToToolbar.call(this);
		}
		if (this.getCheckButton()) {
			_addCheckButtonToToolbar.call(this);
		}

		return this;

	};

	function _setExpandable(bExpandable) {

		if (bExpandable) {
			if (!Panel && !this._bPanelRequested) {
				Panel = sap.ui.require("sap/m/Panel");
				if (!Panel) {
					sap.ui.require(["sap/m/Panel"], _PanelLoaded.bind(this));
					this._bPanelRequested = true;
				}
			}
			if (Panel) {
				_createPanel.call(this);
			}
		} else if (this._oPanel) {
			// just put Form back to Content
			this.setAggregation("content", this._oForm);
			this._oPanel.destroy();
			this._oPanel = null;
		}

		_useTitleOrToolbar.call(this);

	}

	function _createPanel() {

		this._oPanel = new Panel( this.getId() + "--Panel", {
			expanded: this.getExpanded(),
			expandable: true,
			headerText: this.getTitle(),
			expandAnimation: false
		});

		this._oPanel.getHeaderToolbar = function(){
			var oSmartForm = this.getParent();
			if (oSmartForm) {
				return oSmartForm._getToolbar();
			}
		};

		this._oPanel.attachExpand(_handlePanelExpand, this);
		this.setAggregation("content", this._oPanel);
		this._oPanel.addContent(this._oForm);

	}

	function _PanelLoaded(fnPanel) {

		Panel = fnPanel;
		this._bPanelRequested = false;

		if (this.getExpandable() && !this._bIsBeingDestroyed) {
			_createPanel.call(this);
		}

	}

	function _handlePanelExpand(oEvent) {

		this.setProperty("expanded", oEvent.getParameter("expand"), true); // no invalidation of SmartForm

	}

	function _setExpanded(bExpanded) {

		if (this._oPanel) {
			this._oPanel.setExpanded(bExpanded);
		}

	}

	/**
	 * Adds some customData into the aggregation <code>customData</code>.
	 *
	 * <b>Note:</b> <code>customData</code> that is used by the <code>SmartField</code> control itself
	 * is also added to the <code>Group</code> elements, <code>GroupElement</code> elements
	 * and the <code>SmartField</code> controls in the children hierarchy.
	 * Additional <code>customData</code> that is not used by the <code>SmartField</code> control
	 * internally might not be added.
	 *
	 * @param {sap.ui.core.CustomData} oCustomData the customData to add; if empty, nothing is added
	 * @return {sap.ui.comp.smartform.GroupElement} Reference to <code>this</code> to allow method chaining.
	 * @public
	 * @name sap.ui.comp.smartform.SmartForm#addCustomData
	 * @function
	 */

	/**
	 * Inserts some customData into the aggregation <code>customData</code>.
	 *
	 * <b>Note:</b> <code>customData</code> that is used by the <code>SmartField</code> control itself
	 * is also added to the <code>Group</code> elements, <code>GroupElement</code> elements
	 * and the <code>SmartField</code> controls in the children hierarchy.
	 * Additional <code>customData</code> that is not used by the <code>SmartField</code> control
	 * internally might not be added.
	 *
	 * @param {sap.ui.core.CustomData} oCustomData the customData to insert; if empty, nothing is inserted
	 * @param {int} iIndex the 0-based index the customData should be inserted at; for a negative value of iIndex, the customData is inserted at position 0; for a value greater than the current size of the aggregation, the customData is inserted at the last position
	 * @return {sap.ui.comp.smartform.GroupElement} Reference to <code>this</code> to allow method chaining.
	 * @public
	 * @name sap.ui.comp.smartform.SmartForm#insertCustomData
	 * @function
	 */

	function _updateCustomData(oCustomData, sMutation) {

		var aGroups = this.getGroups();
		for (var i = 0; i < aGroups.length; i++) {
			if (sMutation === "insert") {
				_addCustomDataToGroup.call(this, aGroups[i], oCustomData);
			} else {
				_removeCustomData.call(this, aGroups[i], oCustomData.getId());
			}
		}

	}

	function _inheritCustomData(oGroup) {

		var aCustomData = this.getCustomData();

		for (var i = 0; i < aCustomData.length; i++) {
			_addCustomDataToGroup.call(this, oGroup, aCustomData[i]);
		}

	}

	function _addCustomDataToGroup(oGroup, oCustomData) {

		if (library.smartform.inheritCostomDataToFields(oCustomData)) {
			var oNewCustomData = oCustomData.clone();
			oNewCustomData._bFromSmartForm = true;
			oNewCustomData._sOriginalId = oCustomData.getId();
			oGroup.addCustomData(oNewCustomData);
		}

	}

	function _removeCustomData(oGroup, sOriginalId) {

		var aCustomData = oGroup.getCustomData();

		for (var i = 0; i < aCustomData.length; i++) {
			var oCustomData = aCustomData[i];
			if (oCustomData._bFromSmartForm && (!sOriginalId || sOriginalId == oCustomData._sOriginalId)) {
				oGroup.removeCustomData(oCustomData);
			}
		}

	}

	function _updateAriaLabelledBy(vIds, sMutation) {

		var aIds;

		if (Array.isArray(vIds)) {
			aIds = vIds;
		} else {
			aIds = [vIds];
		}

		for (var i = 0; i < aIds.length; i++) {
			var sId = aIds[i];
			if (sMutation === "insert") {
				this._oForm.addAriaLabelledBy(sId);
			} else {
				this._oForm.removeAriaLabelledBy(sId);
			}
		}

	}

	/**
	 * Delegates the edit mode from the <code>SmartForm</code> to the given group
	 *
	 * @private
	 * @param {object} oGroup on which the editable property should be set
	 */
	SmartForm.prototype._delegateEditMode = function(oGroup) {
		if (oGroup) {
			oGroup.setEditMode(this.getEditable());
		}
	};

	/**
	 * Retrieves all the smart fields of the form.
	 *
	 * <b>Note:</b> Even invisible <code>SmartField</code> controls are returned if the <code>group</code> or <code>groupElement</code> is visible.
	 *
	 * @param {boolean} bConsiderOnlyVisibleGroups Determines if only visible <code>groups</code> are taken into account; default is true
	 * @param {boolean} bConsiderOnlyVisibleGroupElements Determines if only visible <code>groupElement</code> elements are taken into account; default is false (to be compatible)
	 * @return {sap.ui.comp.smartfield.SmartField[]} An array of smart fields (might be empty).
	 * @public
	 */
	SmartForm.prototype.getSmartFields = function(bConsiderOnlyVisibleGroups, bConsiderOnlyVisibleGroupElements) {
		var aGroups = [];
		var aGroupElements = [];
		var aElements = [];
		var aSmartFields = [];

		if (bConsiderOnlyVisibleGroups === undefined) {
			bConsiderOnlyVisibleGroups = true;
		}

		aGroups = this.getGroups();

		for (var i = 0; i < aGroups.length; i++) {
			var oGroup = aGroups[i];
			if (!bConsiderOnlyVisibleGroups || (bConsiderOnlyVisibleGroups && oGroup.isVisible())) {
				aGroupElements = oGroup.getGroupElements();
				for (var j = 0; j < aGroupElements.length; j++) {
					var oGroupElement = aGroupElements[j];
					if (!bConsiderOnlyVisibleGroupElements || (bConsiderOnlyVisibleGroupElements && oGroupElement.isVisible())) {
						aElements = oGroupElement.getElements();
						for (var k = 0; k < aElements.length; k++) {
							var oElement = aElements[k];
							if (oElement.isA("sap.ui.comp.smartfield.SmartField")) {
								aSmartFields.push(oElement);
							}
						}
					}
				}
			}
		}

		return aSmartFields;
	};

	/**
	 * Sets the focus on the first editable control.
	 *
	 * @since 1.36.0
	 * @public
	 */
	SmartForm.prototype.setFocusOnEditableControl = function() {
		var aControls = [];
		this.getGroups().forEach(function(oGroup) {
			if (oGroup.isVisible()) {
				oGroup.getGroupElements().forEach(function(oGroupElement) {
					if (oGroupElement.isVisible()) {
						aControls = aControls.concat(oGroupElement.getElements());
					}
				});
			}
		});

		aControls.some(function(oControl) {
			if (oControl.getEditable && oControl.getEditable() && oControl.focus && oControl.getVisible()) {

				if (oControl.isA("sap.ui.comp.smartfield.SmartField")) {
					oControl.attachEventOnce("innerControlsCreated", function(oEvent) {
						setTimeout(oEvent.oSource._oControl[oEvent.oSource._oControl.current]["focus"].bind(oEvent.oSource._oControl[oEvent.oSource._oControl.current]), 0);
					});
				} else {
					oControl.focus();
				}
				return true;
			}
		});
	};

	/*
	 * As we do not want to clone internal controls like Form, Layout, Panel, Toolbar, ToolbarButtons or CustomData
	 * we need to remove them from the aggregations before cloning and add them afterwards.
	 * As Groups have cloned CustomData, the CustomData must be removed from the groups and added again.
	 */
	SmartForm.prototype.clone = function(sIdSuffix, aLocalIds) {

		this.setAggregation("content", null);
		var oToolbar = this.getAggregation("toolbar");
		var oCustomToolbar = this.getCustomToolbar();
		var aCustomData = this.getCustomData();
		var aGroups = this.getGroups();
		var i = 0;

		if (oCustomToolbar) {
			_removeTitleFromToolbar.call(this);
			_removeEditableButtonFromToolbar.call(this);
			_removeCheckButtonFromToolbar.call(this);
		} else if (oToolbar) {
			this.setAggregation("toolbar", null);
		}

		if (aCustomData.length > 0) {
			for (i = 0; i < aGroups.length; i++) {
				_removeCustomData.call(this, aGroups[i]);
			}
		}

		var oClone = Control.prototype.clone.apply(this, arguments);

		// clone groups manually as assigned to internal Form that is not cloned
		for (i = 0; i < aGroups.length; i++) {
			var oGroupClone = aGroups[i].clone(sIdSuffix, aLocalIds);
			oClone.addGroup(oGroupClone);
		}

		if (this.getExpandable() && this._oPanel) {
			this.setAggregation("content", this._oPanel);
		} else {
			this.setAggregation("content", this._oForm);
		}

		if (oCustomToolbar) {
			if (this.getTitle()) {
				_useTitleOrToolbar.call(this);
			}
			if (this.getEditTogglable()) {
				_addEditableButtonToToolbar.call(this);
			}
			if (this.getCheckButton()) {
				_addCheckButtonToToolbar.call(this);
			}
		} else if (oToolbar) {
			this.setAggregation("toolbar", oToolbar);
		}

		if (aCustomData.length > 0) {
			for (i = 0; i < aGroups.length; i++) {
				_inheritCustomData.call(this, aGroups[i]);
			}
		}

		return oClone;
	};

	SmartForm.prototype.exit = function() {
		if (this._oForm) {
			this._oForm.destroy();
		}
		if (this._oPanel) {
			this._oPanel.destroy();
		}
		if (this._oTitle) {
			this._oTitle.destroy();
		}
		if (this._oEditToggleButton) {
			this._oEditToggleButton.destroy();
		}

		this._oForm = null;
		this._oPanel = null;
		this._oTitle = null;
		this._oRb = null;
		this._oEditToggleButton = null;

		this._oObserver.disconnect();
		this._oObserver = undefined;
	};

	// Toolbar handling
	function _createToolbar() {

		var oToolbar = this.getAggregation("toolbar");

		if (!oToolbar) {
			oToolbar = new OverflowToolbar(this.getId() + "-toolbar-sfmain", {
				"height": "3rem",
				"design": mLibrary.ToolbarDesign.Transparent
			});
			oToolbar._bCreatedBySmartForm = true;
			this.setAggregation("toolbar", oToolbar);
		}

		return oToolbar;

	}

	function _destroyToolbar(bCheck) {

		var oToolbar = this.getAggregation("toolbar");

		if (oToolbar) {
			if (bCheck) {
				var aContent = oToolbar.getContent();
				if (aContent.length > 0) {
					return;
				}
			}
			this.destroyAggregation("toolbar");
		}

	}

	function _useTitleOrToolbar() {

		// if there is only a Title set and no Toolbar Button, no Panel and no custom Toolbat
		// the title can directly used on the Form, no toolbar is needed
		var sTitle = this.getTitle();

		if (sTitle) {
			if (!this.getCustomToolbar() && !this.getCheckButton() && !this.getEditTogglable()) {
				if (this._oTitle) {
					if (this._getToolbar()) {
						_removeTitleFromToolbar.call(this);
					}
					this._oForm.removeAriaLabelledBy(this._oTitle);
					this._oTitle.destroy();
					this._oTitle = null;
				}

				this._oForm.setTitle(sTitle);
			} else {
				this._oForm.setTitle();
				if (!this._oTitle) {
					if ((!Title || !OverflowToolbar || !ToolbarSpacer || !ToolbarSeparator || !mLibrary) && !this._bTitleRequested) {
						Title = sap.ui.require("sap/m/Title");
						OverflowToolbar = sap.ui.require("sap/m/OverflowToolbar");
						ToolbarSpacer = sap.ui.require("sap/m/ToolbarSpacer");
						ToolbarSeparator = sap.ui.require("sap/m/ToolbarSeparator");
						mLibrary = sap.ui.require("sap/m/library");
						if (!Title || !OverflowToolbar || !ToolbarSpacer || !ToolbarSeparator || !mLibrary) {
							sap.ui.require(["sap/m/Title", 'sap/m/OverflowToolbar',
							                'sap/m/ToolbarSpacer', 'sap/m/ToolbarSeparator', "sap/m/library"], _TitleLoaded.bind(this));
							this._bTitleRequested = true;
						}
					}
					if (Title && !this._bTitleRequested) {
						this._oTitle = new Title(this.getId() + "-title-sfmain");
					}
				}
				if (this._oTitle) {
					this._oTitle.setText(sTitle);
					this._oForm.addAriaLabelledBy(this._oTitle);
					_addTitleToToolbar.call(this);
				}
			}
		} else {
			if (this._oTitle) {
				_removeTitleFromToolbar.call(this);
				this._oForm.removeAriaLabelledBy(this._oTitle);
				this._oTitle.destroy();
				this._oTitle = null;
			} else {
				this._oForm.setTitle();
			}
		}

	}

	function _TitleLoaded(fnTitle, fnOverflowToolbar, fnToolbarSpacer, fnToolbarSeparator, fnLibrary) {

		Title = fnTitle;
		OverflowToolbar = fnOverflowToolbar;
		ToolbarSpacer = fnToolbarSpacer;
		ToolbarSeparator = fnToolbarSeparator;
		mLibrary = fnLibrary;
		this._bTitleRequested = false;
		if (!this._bIsBeingDestroyed) {
			_useTitleOrToolbar.call(this);
		}

	}

	function _addTitleToToolbar() {

		if (!this._oTitle) {
			return;
		}

		var oToolbar = this._getToolbar();
		if (!oToolbar) {
			oToolbar = _createToolbar.call(this);
		}

		oToolbar.insertContent(this._oTitle, 0);

	}

	function _removeTitleFromToolbar() {

		if (!this._oTitle) {
			return;
		}

		var oToolbar = this._getToolbar();

		oToolbar.removeContent(this._oTitle);

		_destroyToolbar.call(this, true);

	}

	function _checkButtonLoaded() {

		if ((!Button || !OverflowToolbar || !ToolbarSpacer || !ToolbarSeparator || !mLibrary) && !this._bButtonRequested) {
			Button = sap.ui.require("sap/m/Button");
			OverflowToolbar = sap.ui.require("sap/m/OverflowToolbar");
			ToolbarSpacer = sap.ui.require("sap/m/ToolbarSpacer");
			ToolbarSeparator = sap.ui.require("sap/m/ToolbarSeparator");
			mLibrary = sap.ui.require("sap/m/library");
			if (!Button || !OverflowToolbar || !ToolbarSpacer || !ToolbarSeparator || !mLibrary) {
				sap.ui.require(["sap/m/Button", 'sap/m/OverflowToolbar',
				                'sap/m/ToolbarSpacer', 'sap/m/ToolbarSeparator', "sap/m/library"], _ButtonLoaded.bind(this));
				this._bButtonRequested = true;
			}
		}
		if (Button && !this._bButtonRequested) {
			return true;
		}

		return false;

	}

	function _ButtonLoaded(fnButton, fnOverflowToolbar, fnToolbarSpacer, fnToolbarSeparator, fnLibrary) {

		Button = fnButton;
		OverflowToolbar = fnOverflowToolbar;
		ToolbarSpacer = fnToolbarSpacer;
		ToolbarSeparator = fnToolbarSeparator;
		mLibrary = fnLibrary;
		this._bButtonRequested = false;

		if (!this._bIsBeingDestroyed) {
			if (this._bEditRequested) {
				this._bEditRequested = false;
				_addEditableButtonToToolbar.call(this);
			}
			if (this._bCheckRequested) {
				this._bCheckRequested = false;
				_addCheckButtonToToolbar.call(this);
			}
		}

	}

	function _addEditableButtonToToolbar() {

		if (!this.getEditTogglable()) {
			return;
		}

		if (!_checkButtonLoaded.call(this)) {
			this._bEditRequested = true;
			return;
		}

		var oToolbar = this._getToolbar();
		if (!oToolbar) {
			oToolbar = _createToolbar.call(this);
		}

		if (!this._oCheckButton) {
			// Separator if first button
			_addSeparatorToToolbar.call(this, oToolbar);
		}

		if (!this._oEditToggleButton) {
			var sIconSrc = this.getEditable() ? "sap-icon://display" : "sap-icon://edit";
			var sTooltip = this._oRb.getText(this.getEditable() ? "FORM_TOOLTIP_DISPLAY" : "FORM_TOOLTIP_EDIT");

			this._oEditToggleButton = new Button(oToolbar.getId() + "-button-sfmain-editToggle", {
				icon: sIconSrc,
				tooltip: sTooltip
			});

			this._oEditToggleButton.attachPress(this._toggleEditMode, this);
		}

		var iIndex = oToolbar.getContent().length;
		if (this._oCheckButton) {
			iIndex--;
		}

		oToolbar.insertContent(this._oEditToggleButton, iIndex);

	}

	function _removeEditableButtonFromToolbar() {

		if (!this._oEditToggleButton) {
			return;
		}

		var oToolbar = this._getToolbar();
		oToolbar.removeContent(this._oEditToggleButton);
		this._oEditToggleButton.destroy();
		this._oEditToggleButton = null;

		_removeSeparatorFromToolbar.call(this, oToolbar);
		_destroyToolbar.call(this, true);

	}

	function _addCheckButtonToToolbar() {

		if (!this.getCheckButton() || !this.getEditable()) {
			return;
		}

		if (!_checkButtonLoaded.call(this)) {
			this._bCheckRequested = true;
			return;
		}

		var oToolbar = this._getToolbar();
		if (!oToolbar) {
			oToolbar = _createToolbar.call(this);
		}

		if (!this._oEditToggleButton) {
			// Separator if first button
			_addSeparatorToToolbar.call(this, oToolbar);
		}

		if (!this._oCheckButton) {
			this._oCheckButton = new Button(this.getId() + "-" + oToolbar.getId() + "-button-sfmain-check", {
				text: this._oRb.getText("SMART_FORM_CHECK")
			});

			this._oCheckButton.attachPress(_checkForm, this);
		}


		var iIndex = oToolbar.getContent().length;

		oToolbar.insertContent(this._oCheckButton, iIndex);

	}

	function _removeCheckButtonFromToolbar() {

		if (!this._oCheckButton) {
			return;
		}

		var oToolbar = this._getToolbar();
		oToolbar.removeContent(this._oCheckButton);
		this._oCheckButton.destroy();
		this._oCheckButton = null;

		_removeSeparatorFromToolbar.call(this, oToolbar);
		_destroyToolbar.call(this, true);

	}

	function _checkForm(oEvent) {

		var aErroneousFields = [];
		aErroneousFields = this.check(true);
		this.fireChecked({
			erroneousFields: aErroneousFields
		});

	}

	function _addSeparatorToToolbar(oToolbar) {

		var oToolbarSpacer;

		if (!oToolbar._bCreatedBySmartForm) {
			var aContent = oToolbar.getContent();

			// add spacer to customToolbar
			var bFound = false;
			for (var i = 0; i < aContent.length; i++) {
				if (aContent[i] instanceof ToolbarSpacer) {
					bFound = true;
					break;
				}
			}
			if (!bFound) {
				oToolbarSpacer = new ToolbarSpacer();
				oToolbarSpacer._bCreatedBySmartForm = true;
				oToolbar.addContent(oToolbarSpacer);
			}

			if (!(aContent[aContent.length - 1] instanceof ToolbarSeparator)) {
				var oSeparator = new ToolbarSeparator();
				oSeparator._bCreatedBySmartForm = true;
				oToolbar.addContent(oSeparator);
			}
		} else {
			// in private toolbar no separtaor - just spacer
			oToolbarSpacer = new ToolbarSpacer();
			oToolbarSpacer._bCreatedBySmartForm = true;
			oToolbar.addContent(oToolbarSpacer);
		}

	}

	function _removeSeparatorFromToolbar(oToolbar) {

		var aContent = oToolbar.getContent();
		var oLastControl;
		if (!oToolbar._bCreatedBySmartForm) {
			// remove Separator from customToolbar
			oLastControl = aContent[aContent.length - 1];
			if (oLastControl instanceof ToolbarSeparator && oLastControl._bCreatedBySmartForm) {
				oLastControl.destroy();
			}

			aContent = oToolbar.getContent();
		}

		oLastControl = aContent[aContent.length - 1];
		if (oLastControl instanceof ToolbarSpacer && oLastControl._bCreatedBySmartForm) {
			oLastControl.destroy();
		}

	}

	function _createFormLayout(oFormLayout, oUsedLayout) {

		if (!oFormLayout.layout && !oFormLayout.requested) {
			oFormLayout.layout = sap.ui.require(oFormLayout.path);
			if (!oFormLayout.layout) {
				oFormLayout.promise = new Promise(function(fResolve) {
						sap.ui.require([oFormLayout.path], oFormLayout.loaded.bind(this));
						oFormLayout.resolve = fResolve;
						oFormLayout.requestIds = [this.getId()];
				}.bind(this));
				oFormLayout.requested = true;
			}
		} else if (!oFormLayout.layout && oFormLayout.requested && oFormLayout.promise && oFormLayout.requestIds.indexOf(this.getId()) < 0) {
			// Layout is requested by other SmartForm -> so wait until it's loaded
			oFormLayout.promise.then(function() {
				if (!this._bIsBeingDestroyed) {
					_determineFormLayout.call(this);
				}
			}.bind(this));
			oFormLayout.requestIds.push(this.getId());
		}
		if (oFormLayout.layout && !oFormLayout.requested && !(oUsedLayout instanceof oFormLayout.layout)) {
			if (oUsedLayout) {
				oUsedLayout.destroy();
			}
			oUsedLayout = new oFormLayout.layout();
			this._oForm.setLayout(oUsedLayout);
			return true;
		}

		return false;

	}

	function _determineFormLayout() {

		var oLayout = this.getLayout();
		var oFormLayout = this._oForm.getLayout();
		var bUseHorizontalLayout = this.getUseHorizontalLayout();
		var bLayoutChanged = false;

		if (oLayout && oLayout.isA("sap.ui.comp.smartform.ColumnLayout")) {
			if (bUseHorizontalLayout) {
				throw new Error("ColumnLayout and useHorizontalLayout must not ne used at the same time on " + this);
			}
			bLayoutChanged = _createFormLayout.call(this, mFormLayouts.ColumnLayout, oFormLayout);
			if (bLayoutChanged) {
				_updateColumnLayout.call(this, oLayout);
			}
		} else if (bUseHorizontalLayout && (!oLayout || !oLayout.getGridDataSpan())) {
			bLayoutChanged = _createFormLayout.call(this, mFormLayouts.ResponsiveLayout, oFormLayout);
		} else if (!oFormLayout || !mFormLayouts.ResponsiveGridLayout.layout || !(oFormLayout instanceof mFormLayouts.ResponsiveGridLayout.layout)){
			bLayoutChanged = _createFormLayout.call(this, mFormLayouts.ResponsiveGridLayout, oFormLayout);
			if (bLayoutChanged) {
				this._oFormLayoutNotInitial = true;
				_updateResponsiveGridLayout.call(this, oLayout);
			}
		}

		if (bLayoutChanged) {
			var aGroups = this.getGroups();
			for (var i = 0; i < aGroups.length; i++) {
				var oGroup = aGroups[i];
				oGroup._updateLayoutData();
			}
		}

	}

	function _FormLayoutLoaded(oFormLayout, fnLayout) {

		oFormLayout.layout = fnLayout;
		oFormLayout.requested = false;
		oFormLayout.resolve();
		delete oFormLayout.resolve;
		delete oFormLayout.requestIds;
		oFormLayout.promise = undefined;
		if (!this._bIsBeingDestroyed) {
			_determineFormLayout.call(this);
		}

	}

	function _ResponsiveGridLayoutLoaded(fnResponsiveGridLayout) {

		_FormLayoutLoaded.call(this, mFormLayouts.ResponsiveGridLayout, fnResponsiveGridLayout);

	}

	function _ResponsiveLayoutLoaded(fnResponsiveLayout) {

		_FormLayoutLoaded.call(this, mFormLayouts.ResponsiveLayout, fnResponsiveLayout);

	}

	function _ColumnLayoutLoaded(fnColumnLayout) {

		_FormLayoutLoaded.call(this, mFormLayouts.ColumnLayout, fnColumnLayout);

	}

	function _updateFormLayout(oLayout) {

		if (!oLayout || oLayout.isA("sap.ui.comp.smartform.Layout")) {
			_updateResponsiveGridLayout.call(this, oLayout);
		} else if (oLayout.isA("sap.ui.comp.smartform.ColumnLayout")) {
			_updateColumnLayout.call(this, oLayout);
		}

	}

	function _updateResponsiveGridLayout(oLayout) {

		var oFormLayout = this._oForm.getLayout();
		if (!oFormLayout || !oFormLayout.isA(mFormLayouts.ResponsiveGridLayout.name)) {
			return;
		}

		if (this.getUseHorizontalLayout()) {
			if (oLayout && oLayout.getGridDataSpan()) {
				_initResponsiveGridLayout.call(this, oFormLayout);
				oFormLayout.setColumnsL(1);
				oFormLayout.setColumnsM(1);
				if (oLayout.getBreakpointM() > 0) {
					oFormLayout.setBreakpointM(oLayout.getBreakpointM());
				}
				if (oLayout.getBreakpointL() > 0) {
					oFormLayout.setBreakpointL(oLayout.getBreakpointL());
				}
				if (oLayout.getBreakpointXL() > 0) {
					oFormLayout.setBreakpointXL(oLayout.getBreakpointXL());
				}
				this._oFormLayoutNotInitial = true;
			}
		} else {
			if (oLayout) {
				oFormLayout.setLabelSpanXL(oLayout.getLabelSpanXL() ? oLayout.getLabelSpanXL() : -1);
				oFormLayout.setLabelSpanL(oLayout.getLabelSpanL() ? oLayout.getLabelSpanL() : 4);
				oFormLayout.setLabelSpanM(oLayout.getLabelSpanM() ? oLayout.getLabelSpanM() : 4);
				oFormLayout.setLabelSpanS(oLayout.getLabelSpanS() ? oLayout.getLabelSpanS() : 12);
				oFormLayout.setEmptySpanXL(oLayout.getEmptySpanXL() ? oLayout.getEmptySpanXL() : -1);
				oFormLayout.setEmptySpanL(oLayout.getEmptySpanL() ? oLayout.getEmptySpanL() : 0);
				oFormLayout.setEmptySpanM(oLayout.getEmptySpanM() ? oLayout.getEmptySpanM() : 0);
				oFormLayout.setColumnsXL(oLayout.getColumnsXL() ? oLayout.getColumnsXL() : -1);
				oFormLayout.setColumnsL(oLayout.getColumnsL() ? oLayout.getColumnsL() : 3);
				oFormLayout.setColumnsM(oLayout.getColumnsM() ? oLayout.getColumnsM() : 2);
				oFormLayout.setSingleContainerFullSize(oLayout.getSingleGroupFullSize());
				oFormLayout.setBreakpointXL(oLayout.getBreakpointXL() ? oLayout.getBreakpointXL() : 1440);
				oFormLayout.setBreakpointL(oLayout.getBreakpointL() ? oLayout.getBreakpointL() : 1024);
				oFormLayout.setBreakpointM(oLayout.getBreakpointM() ? oLayout.getBreakpointM() : 600);
				this._oFormLayoutNotInitial = true;
			} else {
				_initResponsiveGridLayout.call(this, oFormLayout);
			}
			_updateColumnsForLayout.call(this, oLayout, oFormLayout);
		}

	}

	function _updateColumnsForLayout(oLayout, oFormLayout) {

		if (this.getUseHorizontalLayout()) {
			return;
		}

		if (!oFormLayout) {
			oFormLayout = this._oForm.getLayout();
			oLayout = this.getLayout();
		}

		if (!oFormLayout || !oFormLayout.isA(mFormLayouts.ResponsiveGridLayout.name)) {
			return;
		}

		var aGroups = this.getGroups();
		var iColumnsXL = -1;
		var iColumnsL = 3;
		var bSingleContainerFullSize = true;
		var iVisibleGroups = 0;

		for (var i = 0; i < aGroups.length; i++) {
			if (aGroups[i].isVisible()) {
				iVisibleGroups++;
			}
		}

		if (oLayout) {
			iColumnsL = oLayout.getColumnsL() ? oLayout.getColumnsL() : 3;
			iColumnsXL = (oLayout.getColumnsXL() > 0) ? oLayout.getColumnsXL() : -1;
			bSingleContainerFullSize = oLayout.getSingleGroupFullSize();
		}

		if (aGroups && iVisibleGroups > 0 && iVisibleGroups < iColumnsXL && bSingleContainerFullSize) {
			oFormLayout.setColumnsXL(iVisibleGroups);
		} else if (oFormLayout.getColumnsXL() != iColumnsXL) {
			oFormLayout.setColumnsXL(iColumnsXL); // to restet to default if group number increased
		}

		if (aGroups && iVisibleGroups > 0 && iVisibleGroups < iColumnsL && bSingleContainerFullSize) {
			oFormLayout.setColumnsL(iVisibleGroups);
		} else if (oFormLayout.getColumnsL() != iColumnsL) {
			oFormLayout.setColumnsL(iColumnsL); // to restet to default if group number increased
		}

	}

	function _initResponsiveGridLayout(oFormLayout) {

		if (this._oFormLayoutNotInitial) {
			oFormLayout.setLabelSpanXL(-1);
			oFormLayout.setLabelSpanL(4);
			oFormLayout.setLabelSpanM(4);
			oFormLayout.setLabelSpanS(12);
			oFormLayout.setEmptySpanXL(-1);
			oFormLayout.setEmptySpanL(0);
			oFormLayout.setEmptySpanM(0);
			oFormLayout.setColumnsXL(-1);
			oFormLayout.setColumnsL(3);
			oFormLayout.setColumnsM(2);
			oFormLayout.setSingleContainerFullSize(true);
			oFormLayout.setBreakpointXL(1440);
			oFormLayout.setBreakpointL(1024);
			oFormLayout.setBreakpointM(600);
			this._oFormLayoutNotInitial = false;
		}

	}

	function _updateColumnLayout(oLayout) {

		var oFormLayout = this._oForm.getLayout();
		if (!oFormLayout || !oFormLayout.isA(mFormLayouts.ColumnLayout.name)) {
			return;
		}

		if (this.getUseHorizontalLayout()) {
			throw new Error("ColumnLayout and useHorizontalLayout must not ne used at the same time on " + this);
		} else {
			oFormLayout.setColumnsXL(oLayout.getColumnsXL());
			oFormLayout.setColumnsL(oLayout.getColumnsL());
			oFormLayout.setColumnsM(oLayout.getColumnsM());
			oFormLayout.setLabelCellsLarge(oLayout.getLabelCellsLarge());
			oFormLayout.setEmptyCellsLarge(oLayout.getEmptyCellsLarge());
		}

	}

	function _layoutChanged(oLayout, sName, vCurrent, vOld) {

		_updateFormLayout.call(this, oLayout);

		if (sName === "gridDataSpan") {
			this.propagateGridDataSpan();
			if (vCurrent === "" || vOld === "") {
				// layout might be changed
				_determineFormLayout.call(this);
			}
		}

	}

	/**
	 * Method used to propagate the <code>Title</code> control ID of a container control
	 * (like a <code>Dialog</code> control) to use it as aria-label in the <code>SmartForm</code>.
	 * So the <code>SmartForm</code> must not have an own title.
	 * @param {string} sTitleID <code>Title</code> control ID
	 * @private
	 * @return {sap.ui.comp.smartform.SmartForm} Reference to <code>this</code> to allow method chaining
	 */
	SmartForm.prototype._suggestTitleId = function (sTitleID) {

		this._oForm._suggestTitleId(sTitleID);

		return this;

	};

	return SmartForm;

}, /* bExport= */true);