/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'./FieldHelpBase',
	'./FilterOperatorConfig',
//	'sap/ui/model/base/ManagedObjectModel',
	'sap/ui/base/ManagedObjectObserver',
	'sap/base/util/merge',
	'sap/base/util/ObjectPath',
	'sap/base/util/deepEqual'
], function(
		FieldHelpBase,
		FilterOperatorConfig,
//		ManagedObjectModel,
		ManagedObjectObserver,
		merge,
		ObjectPath,
		deepEqual
	) {
	"use strict";

	var Dialog;
	var Button;
	var ValueHelpPanel;
	var DefineConditionPanel;
	var ConditionModel;

	/**
	 * Constructor for a new FieldValueHelp.
	 *
	 * If a more complex value help is needed the application can put a complete table into this field help.
	 * As in this case the behavior depends on the used control a wrapper is used between.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class A field help used in the <code>FieldFelp</code> aggregation in <code>Field</code> controls that shows a value help dialog
	 * @extends sap.ui.mdc.base.FieldHelpBase
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.58.0
	 * @alias sap.ui.mdc.base.FieldValueHelp
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var FieldValueHelp = FieldHelpBase.extend("sap.ui.mdc.base.FieldValueHelp", /** @lends sap.ui.mdc.base.FieldValueHelp.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * function to determine text for key
				 *
				 * the function must have the parameter <code>vKey</code> of type <code>any</code> and
				 * return a text as <code>string</code>.
				 */
				getTextForKey: {
					type: "function",
					group: "Data"
				},

				/**
				 * function to determine key for text
				 *
				 * the function must have the parameter <code>sText</code> of type <code>string</code> and
				 * return a key as <code>string</code>.
				 */
				getKeyForText: {
					type: "function",
					group: "Data"
				},

				/**
				 * function to determine key from an Item
				 *
				 * the function must have the parameter <code>oItem</code> of type <code>sap.m.ListItemBase</code> and
				 * return a key as <code>string</code>.
				 */
				getKeyFromItem: {
					type: "function",
					group: "Data"
				},

				/**
				 * function to determine text from an Item
				 *
				 * the function must have the parameter <code>oItem</code> of type <code>sap.m.ListItemBase</code> and
				 * return a text as <code>string</code>.
				 */
				getTextFromItem: {
					type: "function",
					group: "Data"
				},

				/**
				 * The fields for what the content should filter. If not set the FieldPath of the assigned field will be used.
				 */
				filterFields: {
					type: "string",
					defaultValue: ""
				},

				/**
				 * The path of the key field in the content binding. If not set the FieldPath of the assigned field will be used.
				 */
				keyPath: {
					type: "string",
					defaultValue: ""
				},

				/**
				 * The path of the description field in the content binding.
				 */
				descriptionPath: {
					type: "string",
					defaultValue: ""
				},

				/**
				 * if set, a condition panel is shown
				 *
				 * @since 1.60.0
				 */
				showConditionPanel: {
					type: "boolean",
					defaultValue: false
				},

				/**
				 * Title text appears in the Dialog header.
				 *
				 * @since 1.60.0
				 */
				title: {
					type: "string",
					group: "Appearance",
					defaultValue: ""
				},

				/**
				 * if set, the FieldHelp don't open a value help dialog, just displays the content
				 *
				 * @since 1.60.0
				 */
				noDialog: {
					type: "boolean",
					group: "Appearance",
					defaultValue: false
				}
			},
			aggregations: {
				/**
				 * content of the Field help
				 *
				 * To support different types of content (e.g sap.m.Table) a specific wrapper is used
				 * to map the functionality of the content control to the field help. The content control
				 * is assigned to the wrapper.
				 *
				 * @since 1.60.0
				 */
				content: {
					type: "sap.ui.mdc.base.FieldValueHelpContentWrapperBase",
					multiple: false
				},

				/**
				 * FilterBar of the Field help
				 *
				 * @since 1.60.0
				 */
				filterBar: {
					type: "sap.ui.core.Control", // TODO: use real FilterBar, FilterFields or something like this
					multiple: false
				},

				/**
				 * internal dialog
				 */
				_dialog: {
					type: "sap.m.Dialog",
					multiple: false,
					visibility: "hidden"
				}
			},
			defaultAggregation: "content",
			events: {
				/**
				 * This event is fired when the user wants to navigate via keyboard (arrow keys).
				 *
				 * As the <code>FieldValueHelp</code> not all items might be loaded the and not know the sematic
				 * of the items the application must handle this event. So loading of new items might be necessary.
				 *
				 * The application must set the <code>selected</code> property for the new item and remove it from the old one.
				 *
				 * The <code>navigate</code>event of the <code>FieldValueHelp</code> must be called and it's properties
				 * must be set.
				 *
				 * In addition the <code>conditions</code> property of the <code>FieldValueHelp</code>
				 * must be set.
				 */
				navigateToItem: {
					parameters: {

						/**
						 * The navigation step.
						 */
						step: { type: "int" },

						/**
						 * The currently selected <code>item</code>.
						 */
						selectedItem: { type: "sap.m.ListItemBase" }
					}
				},
				/**
				 * This event is fired when items should be filtered
				 *
				 * As the <code>FieldValueHelp</code> can not know the semantic of the item the calling application
				 * has to perform the filtering or set it on the used model.
				 */
				filterItems: {
					parameters: {

						/**
						 * The text to filter with.
						 */
						filterText: { type: "string" }
					}
				}
			}
		}
	});

	FieldValueHelp.prototype.init = function() {

		FieldHelpBase.prototype.init.apply(this, arguments);

		this._oObserver = new ManagedObjectObserver(_observeChanges.bind(this));

		this._oObserver.observe(this, {
			properties: ["filterValue", "conditions", "showConditionPanel", "title"],
			aggregations: ["content", "filterBar"]
		});

	};

	FieldValueHelp.prototype.exit = function() {

		FieldHelpBase.prototype.exit.apply(this, arguments);

		this._oObserver.disconnect();
		this._oObserver = undefined;

		if (this._oFilterOperatorConfig) {
			this._oFilterOperatorConfig.destroy();
			delete this._oFilterOperatorConfig;
		}

	};

	FieldValueHelp.prototype.invalidate = function(oOrigin) {

		if (oOrigin) {
			var oDialog = this.getAggregation("_dialog");
			var oFilterBar = this.getFilterBar();
			if ((oDialog && oOrigin === oDialog) ||
					(oFilterBar && oOrigin === oFilterBar)) {
				if (oOrigin.bOutput) {
					var oStatic = sap.ui.getCore().getStaticAreaRef();
					oStatic = sap.ui.getCore().getUIArea(oStatic);
					if (oStatic.addInvalidatedControl) {
						oStatic.addInvalidatedControl(oOrigin);
					}
				}
				return;
			}
		}

		FieldHelpBase.prototype.invalidate.apply(this, arguments);

	};

	FieldValueHelp.prototype.connect = function(oField) {

		if (this._oField && this._oField !== oField) {
			// as FieldPath may change
			if (this._oFilterConditionModel) {
				this._oFilterConditionModel.removeFilterField(this);
			}
			if (this._oConditionModel) {
				this._oConditionModel.removeFilterField(this);
			}
		}

		FieldHelpBase.prototype.connect.apply(this, arguments);

		if (this._oFilterConditionModel) {
			this._oFilterConditionModel.addFilterField(this);
		}

		if (this._oConditionModel) {
			this._oConditionModel.addFilterField(this);
		} else {
			_createConditionModel.call(this);
		}

		// new Field might not support define conditions
		_toggleDefineConditions.call(this, this.getShowConditionPanel());

		return this;

	};

	FieldValueHelp.prototype.getIcon = function() {

		if (this.getNoDialog()) {
			return "sap-icon://slim-arrow-down";
		} else {
			return "sap-icon://value-help";
		}

	};

	FieldValueHelp.prototype._createPopover = function() {

		var oPopover = FieldHelpBase.prototype._createPopover.apply(this, arguments);

		if (oPopover) { // empty if loaded async
			var oField = this._getField();
			if (oField) {
				oPopover.setInitialFocus(oField);
			}

			// use Wrapper content in Popover -> overwrite hook
			var oWrapper = this.getContent();
			oWrapper.initialize(true);

			oPopover._getAllContent = function() {
				var oParent = this.getParent();
				var aContent = [];

				if (oParent) {
					var oContent = _getSuggestionContent.call(oParent);
					if (oContent) {
						aContent.push(oContent);
					}
				}
				return aContent;
			};

			if (this._bNavigate) {
				this._bNavigate = false;
				this.navigate(this._iStep);
				this._iStep = null;
			}
		}

		return oPopover;

	};

	FieldValueHelp.prototype._handleAfterOpen = function(oEvent) {

		FieldHelpBase.prototype._handleAfterOpen.apply(this, arguments);

		var oWrapper = this.getContent();
		if (oWrapper) {
			oWrapper.fieldHelpOpen(true);
		}

	};

	FieldValueHelp.prototype.open = function(bSuggestion) {

		if (this.getNoDialog() && !bSuggestion) {
			bSuggestion = true;
		}

		var oWrapper = this.getContent();

		if (oWrapper && oWrapper.getFilterEnabled() && !this._oFilterConditionModel) {
			_createFilterConditionModel.call(this);
		}

		var oPopover = this.getAggregation("_popover");

		if (bSuggestion) {
			// focus should stay on Field
			if (oPopover) {
				var oField = this._getField();
				oPopover.setInitialFocus(oField);
			}

			FieldHelpBase.prototype.open.apply(this, [bSuggestion]);
		} else {
			if (oPopover) {
				if (oPopover.isOpen()) {
					this.close();
				}
				oPopover.$().remove(); // TODO: destroy DOM of Wrapper content to not have it twice
			}

			var oDialog = _getDialog.call(this);

			if (oDialog) {
				var oValueHelpPanel = oDialog.getContent()[0];
				oValueHelpPanel.setShowTokenizer(this.getMaxConditions() !== 1);

				if (oWrapper) {
					oWrapper.fieldHelpOpen(false);
					_updateSelectedItems.call(this);
				}

				this.fireOpen({suggestion: bSuggestion});
				oDialog.open();
			} else {
				this._bOpen = true;
			}
		}

		return;

	};

	FieldValueHelp.prototype.toggleOpen = function(bSuggestion) {

		if (this.getNoDialog() && !bSuggestion) {
			bSuggestion = true;
		}

		if (bSuggestion) {
			FieldHelpBase.prototype.toggleOpen.apply(this, [bSuggestion]);
		} else {
			var oDialog = _getDialog.call(this);

			if (oDialog) {
				if (oDialog.isOpen()) {
					var eOpenState = oDialog.oPopup.getOpenState();
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
			}

		}

	};

	FieldValueHelp.prototype.close = function() {

		if (!this._bDialogOpen) {
			FieldHelpBase.prototype.close.apply(this, arguments);
		} else {
			var oDialog = this.getAggregation("_dialog");

			if (oDialog) {
				this._bClosing = true;
				oDialog.close();
				var oWrapper = this.getContent();
				var oValueHelpPanel = oDialog.getContent()[0];
				if (oWrapper) {
					oWrapper.fieldHelpClose();
					oValueHelpPanel.clearSearch();
//				this.setProperty("filterValue", null, true);
					this._oFilterConditionModel.removeAllConditions();
					_applyFilters.call(this);
				}
			}

			this._bReopen = false;
		}

	};

	FieldValueHelp.prototype._handleAfterClose = function(oEvent) {

		FieldHelpBase.prototype._handleAfterClose.apply(this, arguments);

		if (this._bUpdateFilterAfterClose) {
			this._bUpdateFilterAfterClose = false;
			_filterContent.call(this, this._sFilterValueAfterClose);
			this._sFilterValueAfterClose = null;
		}

		var oWrapper = this.getContent();
		if (oWrapper) {
			oWrapper.fieldHelpClose();
		}

	};

	function _observeChanges(oChanges) {

		if (oChanges.name === "content") {
			_contentChanged.call(this, oChanges.mutation, oChanges.child);
		}

		if (oChanges.name === "filterBar") {
			_updateFilterBar.call(this, oChanges.mutation, oChanges.child);
		}

		if (oChanges.name === "conditions") {
			_updateConditions.call(this, oChanges.current);
		}

		if (oChanges.name === "filterValue") {
			if (this._bClosing) {
				this._bUpdateFilterAfterClose = true;
				this._sFilterValueAfterClose = oChanges.current;
			} else {
				_filterContent.call(this, oChanges.current);
			}
		}

		if (oChanges.name === "showConditionPanel") {
			_toggleDefineConditions.call(this, oChanges.current);
		}

		if (oChanges.name === "title") {
			var oDialog = this.getAggregation("_dialog");
			if (oDialog) {
				oDialog.setTitle(oChanges.current);
			}
		}

	}

	FieldValueHelp.prototype.openByTyping = function() {

		return true;

	};

	FieldValueHelp.prototype.navigate = function(iStep) {

		var oPopover = this._getPopover();

		if (!oPopover) {
			// Popover not loaded right now
			this._bNavigate = true;
			this._iStep = iStep;
			return;
		} else if (!oPopover.isOpen()) {
			this.fireOpen({suggestion: true}); // to let application set content
		}

		var oWrapper = this.getContent();
		if (oWrapper) {
			oWrapper.navigate(iStep);
		} else {
			this._bNavigate = true;
			this._iStep = iStep;
			return;
		}

	};

	function _handleNavigate(oEvent) {

		var oPopover = this._getPopover();
		var vKey = oEvent.getParameter("key");
		var sDescription = oEvent.getParameter("description");
		var sFieldPath = this.getFieldPath();
		var oCondition;

		if (!oPopover.isOpen()) {
			this.open(true); // as navigation opens suggestion
		}

		if (sDescription) {
			oCondition = this._oConditionModel.createItemCondition(sFieldPath, vKey, sDescription);
		} else {
			oCondition = this._oConditionModel.createItemCondition(sFieldPath, vKey);
		}

		this.setProperty("conditions", [oCondition], true); // do not invalidate while FieldHelp
		this.fireNavigate({value: sDescription, key: vKey});

	}

	FieldValueHelp.prototype.getTextForKey = function(vKey) {

		var sText = "";
		var fnTextForKey = this.getGetTextForKey();
		if (fnTextForKey) {
			sText = fnTextForKey(vKey);
			if (typeof sText !== "string") {
				throw new Error("function getTextForKey must return a string");
			}
		} else {
			var oWrapper = this.getContent();
			if (oWrapper) {
				sText = oWrapper.getTextForKey(vKey);
			}
		}

		return sText;

	};

	FieldValueHelp.prototype.getKeyForText = function(sText) {

		var vKey;
		var fnKeyForText = this.getGetKeyForText();
		if (fnKeyForText) {
			vKey = fnKeyForText(sText);
//			if (typeof vKey !== "string") {
//				throw new Error("function getKeyForText must return a string");
//			}
		} else {
			var oWrapper = this.getContent();
			if (oWrapper) {
				vKey = oWrapper.getKeyForText(sText);
			}
		}

		return vKey;

	};

	function _handleSelectionChange(oEvent) {

		var aSelectedItems = oEvent.getParameter("selectedItems");
		var sFieldPath = this.getFieldPath();
		var oItem;
		var aConditions = merge([], this._oConditionModel.getConditions(sFieldPath));
		var oCondition;
		var i = 0;
		var j = 0;
		var bFound = false;

		// remove only EQ and EEQ selections that can be changed from content control
		for (i = 0; i < aConditions.length; i++) {
			oCondition = aConditions[i];
			if (oCondition.operator === "EEQ" || oCondition.operator === "EQ") {
				bFound = false;
				for (j = 0; j < aSelectedItems.length; j++) {
					oItem = aSelectedItems[j];
					if (oCondition.values[0] === oItem.key) {
						bFound = true;
						break;
					}
				}
				if (!bFound) {
					this._oConditionModel.removeCondition(sFieldPath, oCondition);
				}
			}
		}

		aConditions = merge([], this._oConditionModel.getConditions(sFieldPath));

		for (i = 0; i < aSelectedItems.length; i++) {
			oItem = aSelectedItems[i];
			bFound = false;

			for (j = 0; j < aConditions.length; j++) {
				oCondition = aConditions[j];
				if ((oCondition.operator === "EEQ" || oCondition.operator === "EQ") && oCondition.values[0] === oItem.key) {
					bFound = true;
					break;
				}
			}

			if (!bFound) {
				if (oItem.description) {
					oCondition = this._oConditionModel.createItemCondition(sFieldPath, oItem.key, oItem.description);
				} else {
					oCondition = this._oConditionModel.createItemCondition(sFieldPath, oItem.key);
				}

				this._oConditionModel.addCondition(sFieldPath, oCondition);
			}
		}

		if (this._bDialogOpen) {
			_updateSelectedItems.call(this); // as condition could be removed because of maxConditions
		} else {
			// suggestion -> fire select event directly
			this.close();
			var vKey = oItem && oItem.key;
			var sDescription = oItem && oItem.description;
			this._bNoConditionModelUpdate = true;
			this.setProperty("conditions", [oCondition], true); // do not invalidate while FieldHelp
			this.fireSelect({value: sDescription, key: vKey, conditions: [oCondition], add: true});
		}

	}

	function _handleDataUpdate(oEvent) {

		if (oEvent.getParameter("contentChange")) {
			var oPopover = this.getAggregation("_popover");
			var oDialog = this.getAggregation("_dialog");
			var oWrapper = this.getContent();
			if (oWrapper) {
				if (oPopover && this._bOpenIfContent) {
					var oField = this._getField();
					if (oField) {
						oWrapper.fieldHelpOpen(true);
						oPopover.openBy(oField);
					}
					this._bOpenIfContent = false;
				} else if (oDialog) {
					var oValueHelpPanel = oDialog.getContent()[0];
					_setContentOnValueHelpPanel.call(this, oValueHelpPanel, oWrapper.getDialogContent());
				}
				if (this._oFilterConditionModel && oWrapper.getListBinding() !== this._oFilterConditionModel._oListBinding) {
					// ListBinding changed -> destroy filter condition model
					this._oFilterConditionModel.destroy();
					this._oFilterConditionModel = undefined;
				}
				if (oWrapper.getFilterEnabled() && !this._oFilterConditionModel) {
					_createFilterConditionModel.call(this);
				}
			}
		}
		this.fireDataUpdate();

	}

	function _updateConditions(aConditions) {

		if (this._oConditionModel) {
			if (!this._bNoConditionModelUpdate) {
				this._oConditionModel.removeAllConditions();
				for (var i = 0; i < aConditions.length; i++) {
					var oCondition = merge({}, aConditions[i]);
					this._oConditionModel.addCondition(oCondition);
				}
			} else {
				this._bNoConditionModelUpdate = false;
			}
		} else {
			_createConditionModel.call(this);
		}

		_updateSelectedItems.call(this);

	}

	function _updateSelectedItems() {

		if (!this._oField) {
			return; // makes only sense if connected
		}

		var sFieldPath = this.getFieldPath();
		var oWrapper = this.getContent();

		if (oWrapper) {
			var aConditions = this._oConditionModel ? this._oConditionModel.getConditions(sFieldPath) : this.getConditions();
			var aItems = [];
			for (var i = 0; i < aConditions.length; i++) {
				var oCondition = aConditions[i];
				if (oCondition.operator === "EEQ" || oCondition.operator === "EQ") {
					aItems.push({key: oCondition.values[0], description: oCondition.values[1]});
				}
			}
			if (!deepEqual(aItems, oWrapper.getSelectedItems())) {
				oWrapper.setSelectedItems(aItems);
			}
		}

	}

	function _filterContent(sFilterText) {

		if (!this._oFilterConditionModel) {
			return;
		}

		var sFilterFields = _getFilterFields.call(this);

		if (!sFilterFields) {
			return; // we don't know how to filter
		}

		this._oFilterConditionModel.removeAllConditions(sFilterFields);
		if (sFilterText) {
			var oCondition = this._oFilterConditionModel.createCondition(sFilterFields, "StartsWith", [sFilterText]);
			this._oFilterConditionModel.addCondition(oCondition);
		}

	}

	function _applyFilters() {

		if (!this._oFilterConditionModel) {
			return;
		}

		if (this._oFilterConditionModel._oListBinding.isSuspended()) {
			this._oFilterConditionModel._oListBinding.resume(); // TODO: find better solution
		}
		this._oFilterConditionModel.applyFilters(true);

	}

	function _handleFilterModelChange(oEvent) {

		if (this._bOwnFilterChange) {
			return;
		}

		_applyFilters.call(this);

	}

	function _createFilterConditionModel() {

		if (!ConditionModel && !this._bFilterConditionModelRequested) {
			ConditionModel = sap.ui.require("sap/ui/mdc/base/ConditionModel");
			if (!ConditionModel) {
				sap.ui.require(["sap/ui/mdc/base/ConditionModel"], _FilterConditionModelLoaded.bind(this));
				this._bFilterConditionModelRequested = true;
			}
		}

		if (ConditionModel) {
			var oWrapper = this.getContent();
			var oListBinding = oWrapper && oWrapper.getListBinding();
			if (oListBinding) {
				this._oFilterConditionModel = ConditionModel.getFor(oListBinding, this.getId());
				_filterContent.call(this, this.getFilterValue());

				var oConditionChangeBinding = this._oFilterConditionModel.bindProperty("/conditions", this._oFilterConditionModel.getContext("/conditions"));
				oConditionChangeBinding.attachChange(_handleFilterModelChange.bind(this));

				var oFilterBar = this.getFilterBar();
				if (oFilterBar) {
					oFilterBar.setModel(this._oFilterConditionModel, "filter");
				}
			}
		}

	}

	function _FilterConditionModelLoaded(fnConditionModel) {

		ConditionModel = fnConditionModel;
		this._bFilterConditionModelRequested = false;

		if (!this._bIsBeingDestroyed) {
			_createFilterConditionModel.call(this);
		}

	}

	FieldValueHelp.prototype.getMaxConditions = function() {

		if (this._oField.getMaxConditions) {
			// if Field or FilterField -> use it's MaxConditions
			return this._oField.getMaxConditions();
		} else {
			// TODO: how to set if field not provide MaxConditions?
			return 1;
		}

	};

	FieldValueHelp.prototype.getDisplay = function() {

		if (this._oField.getDisplay) {
			// if Field or FilterField -> use it's Display
			return this._oField.getDisplay();
		}

	};

	FieldValueHelp.prototype.getRequired = function() {

		if (this._oField.getRequired) {
			// if Field or FilterField -> use it's Required
			return this._oField.getRequired();
		} else {
			// TODO: default false?
			return false;
		}

	};

	FieldValueHelp.prototype.getFilterOperatorConfig = function() {

		if (this._oField && this._oField._getFilterOperatorConfig) {
			return this._oField._getFilterOperatorConfig();
		} else if (this._oFilterOperatorConfig) {
			return this._oFilterOperatorConfig;
		} else {
			// TODO: just a Dummy for now
			this._oFilterOperatorConfig = FilterOperatorConfig.getFor(); // TODO: pass somehow model of Field?
			return this._oFilterOperatorConfig;
		}

	};

	FieldValueHelp.prototype.getDataType = function() {

		if (this._oField.getDataType) {
			// if Field or FilterField -> use it's DataType
			return this._oField.getDataType();
		} else {
			// TODO: default case?
			return "sap.ui.model.type.String";
		}

	};

	//TODO: better API to get type from field
	FieldValueHelp.prototype._getDataType = function() {

		if (this._oField._getDataType) {
			// if Field or FilterField -> use it's DataType
			return this._oField._getDataType();
		} else {
			// TODO: default case?
			var OTypeClass = ObjectPath.get("sap.ui.model.odata.type.String");
			return new OTypeClass();
		}

	};

	function _getFilterFields() {

		var sFilterFields = this.getFilterFields();

		if (!sFilterFields) {
			sFilterFields = this.getFieldPath();
		}

		return sFilterFields;

	}

	FieldValueHelp.prototype._getKeyPath = function() {

		var sKeyPath = this.getKeyPath();

		if (!sKeyPath && this._oField && this._oField.getFieldPath && this._oField.getFieldPath()) {
			sKeyPath = this._oField.getFieldPath();
		}

		return sKeyPath;

	};

	function _createConditionModel() {

		if (!ConditionModel && !this._bConditionModelRequested) {
			ConditionModel = sap.ui.require("sap/ui/mdc/base/ConditionModel");
			if (!ConditionModel) {
				sap.ui.require(["sap/ui/mdc/base/ConditionModel"], _ConditionModelLoaded.bind(this));
				this._bConditionModelRequested = true;
			}
		}

		if (ConditionModel) {
			this._oConditionModel = new ConditionModel();
			var that = this;
			this._oConditionModel.getFilterOperatorConfig = function() {
				return that.getFilterOperatorConfig(); // to use same as in connected field
			};
			var oConditionChangeBinding = this._oConditionModel.bindProperty("/", this._oConditionModel.getContext("/"));
			oConditionChangeBinding.attachChange(_handleConditionModelChange.bind(this));
			this._oConditionModel.addFilterField(this);
			_updateConditions.call(this, this.getConditions());
			this.setModel(this._oConditionModel, "cm");
		}

	}

	function _ConditionModelLoaded(fnConditionModel) {

		ConditionModel = fnConditionModel;
		this._bConditionModelRequested = false;

		if (!this._bIsBeingDestroyed) {
			_createConditionModel.call(this);
		}

	}

	function _handleConditionModelChange(oEvent) {

		if (this._bChangedByMe) {
			this._bChangedByMe = false;
			return;
		}

		if (this._bDialogOpen) {
			// only needed to be interactive if dialog is open
			_updateSelectedItems.call(this);
		}

	}

	function _createDialog() {

		var oDialog;

		if ((!Dialog || !Button || !ValueHelpPanel || !DefineConditionPanel) && !this._bDialogRequested) {
			Dialog = sap.ui.require("sap/m/Dialog");
			Button = sap.ui.require("sap/m/Button");
			ValueHelpPanel = sap.ui.require("sap/ui/mdc/base/ValueHelpPanel");
			DefineConditionPanel = sap.ui.require("sap/ui/mdc/base/DefineConditionPanel"); // TODO: load only if needed
			if (!Dialog || !Button || !ValueHelpPanel || !DefineConditionPanel || !ConditionModel) {
				sap.ui.require(["sap/m/Dialog", "sap/m/Button", "sap/ui/mdc/base/ValueHelpPanel",
				                "sap/ui/mdc/base/DefineConditionPanel"], _DialogLoaded.bind(this));
				this._bDialogRequested = true;
			}
		}
		if (Dialog && Button && ValueHelpPanel && DefineConditionPanel && !this._bDialogRequested) {
			if (!this._oResourceBundle) {
				this._oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");
			}

			var oButtonOK = new Button(this.getId() + "-ok", {
				text: this._oResourceBundle.getText("valuehelp.OK"),
				press: _dialogOk.bind(this)
			});

			var oButtonCancel = new Button(this.getId() + "-cancel", {
				text: this._oResourceBundle.getText("valuehelp.CANCEL"),
				press: _dialogCancel.bind(this)
			});

			var oValueHelpPanel = _createValueHelpPanel.call(this);

//			//TODO: real API for Go function of real FilterBar
//			var oButton = oFilterBar.getEndContent()[0];
//			oButton.attachEvent("press", _handleGo, this);
//
			oDialog = new Dialog(this.getId() + "-dialog", {
				contentHeight: "600px",
				contentWidth: "1000px",
				horizontalScrolling: false,
				verticalScrolling: false,
				title: this.getTitle(),
				resizable: true,
				draggable: true,
				content: [oValueHelpPanel],
				afterOpen: _handleDialogAfterOpen.bind(this),
				afterClose: _handleDialogAfterClose.bind(this),
				buttons: [oButtonOK, oButtonCancel]
			});

			this.setAggregation("_dialog", oDialog, true);
			// TODO
			oDialog.setModel(new sap.ui.model.resource.ResourceModel({ bundleName: "sap/ui/mdc/messagebundle", async: false }), "$i18n");

			_toggleDefineConditions.call(this, this.getShowConditionPanel());
		}

		return oDialog;

	}

	function _DialogLoaded(fnDialog, fnButton, fnValueHelpPanel, fnDefineConditionPanel, fnLibrary) {

		Dialog = fnDialog;
		Button = fnButton;
		ValueHelpPanel = fnValueHelpPanel;
		DefineConditionPanel = fnDefineConditionPanel;
		this._bDialogRequested = false;

		if (!this._bIsBeingDestroyed) {
			_createDialog.call(this);
			if (this._bOpen) {
				this.open();
				delete this._bOpen;
			}
		}

	}

	function _createValueHelpPanel() {

		var oWrapper = this.getContent();
		var oFilterBar = this.getFilterBar();

//			// TODO: better logic?
//			var oConditionChangeBinding = this._oConditionModel.bindProperty("/", this._oConditionModel.getContext("/"));
//			oConditionChangeBinding.attachChange(_conditionChange.bind(this));

		var oValueHelpPanel = new ValueHelpPanel(this.getId() + "-VHP", {
			height: "100%",
			showFilterbar: !!oFilterBar,
			onBasicSearchChange: _handleBasicSearchChange.bind(this)
		});

		if (oWrapper) {
			oWrapper.initialize(false);
			_setContentOnValueHelpPanel.call(this, oValueHelpPanel, oWrapper.getDialogContent());
		}
		if (oFilterBar) {
			oValueHelpPanel.setFilterbar(oFilterBar);
		}
		oValueHelpPanel.initModel(this._oConditionModel);

		return oValueHelpPanel;

	}

	function _setContentOnValueHelpPanel(oValueHelpPanel, oContent) {

		oValueHelpPanel.setTable(oContent);

	}

	function _contentChanged(sMutation, oWrapper) {

		var oPopover = this.getAggregation("_popover");
		var oDialog = this.getAggregation("_dialog");
		if (sMutation === "remove") {
			oWrapper.detachEvent("navigate", _handleNavigate, this);
			oWrapper.detachEvent("selectionChange", _handleSelectionChange, this);
			oWrapper.detachEvent("dataUpdate", _handleDataUpdate, this);
			oWrapper = undefined;
		} else {
			oWrapper.attachEvent("navigate", _handleNavigate, this);
			oWrapper.attachEvent("selectionChange", _handleSelectionChange, this);
			oWrapper.attachEvent("dataUpdate", _handleDataUpdate, this);
			_updateSelectedItems.call(this);
		}
		this.fireDataUpdate();
		if (this._bNavigate) {
			this._bNavigate = false;
			this.navigate(this._iStep);
			this._iStep = null;
		} else if (oPopover) {
			oPopover.invalidate();
			var sFilterValue = this.getFilterValue();
			if (sFilterValue) {
				_filterContent.call(this, sFilterValue);
			}
			if (oWrapper && oWrapper.getFilterEnabled() && !this._oFilterConditionModel) {
				_createFilterConditionModel.call(this);
			}
			if (oWrapper && this._bOpenIfContent) {
				oWrapper.initialize(true);

				var oField = this._getField();
				if (oField) {
					oWrapper.fieldHelpOpen(true);
					oPopover.openBy(oField);
				}
				this._bOpenIfContent = false;
			}
		}
		if (oDialog) {
			// update ValueHelpPanel
			if (oWrapper) {
				oWrapper.initialize(false);
				if (oWrapper.getFilterEnabled() && !this._oFilterConditionModel) {
					_createFilterConditionModel.call(this);
				}
				var oValueHelpPanel = oDialog.getContent()[0];
				_setContentOnValueHelpPanel.call(this, oValueHelpPanel, oWrapper.getDialogContent());
				if (oDialog.isOpen()) {
					oWrapper.fieldHelpOpen(false);
				}
			}
		}

	}

	function _getDialog() {

		var oDialog = this.getAggregation("_dialog");

		if (!oDialog) {
			oDialog = _createDialog.call(this);
		}

		return oDialog;

	}

	function _dialogOk(oEvent) {

		this.close();
		var aConditions = this._oConditionModel.getConditions(this.getFieldPath());
		aConditions = ConditionModel.removeEmptyConditions(aConditions);
		var vKey;
		var sValue;
		if (aConditions.length > 0) {
			vKey = aConditions[0].values[0];
			sValue = aConditions[0].values[1];
		}

		this._bNoConditionModelUpdate = true;
		this.setProperty("conditions", aConditions, true); // do not invalidate whole FieldHelp
		this.fireSelect({value: sValue, key: vKey, conditions: aConditions, add: false});

	}

	function _dialogCancel(oEvent) {

		this.close();

	}

	function _handleDialogAfterOpen(oEvent) {

		this._bDialogOpen = true;

	}

	function _handleDialogAfterClose(oEvent) {

		this._bDialogOpen = false;
		_updateConditions.call(this, this.getConditions());

		var oWrapper = this.getContent();
		if (oWrapper) {
			oWrapper.fieldHelpClose();
		}

		this._handleAfterClose();

	}

	function _handleBasicSearchChange(oEvent) {

		var sValue = oEvent.getParameter("value");
		_filterContent.call(this, sValue);

	}

	function _toggleDefineConditions(bActive) {
		var oDialog = this.getAggregation("_dialog");
		if (oDialog && this._oField) {
			var oValueHelpPanel = oDialog.getContent()[0];
			if (bActive && this._oField._getOnlyEEQ && !this._oField._getOnlyEEQ()) { // TODO: better way to limit operators
				if (!oValueHelpPanel._oDefineConditionPanel) { //TODO: use API?
					var oDefineConditionPanel = new DefineConditionPanel(this.getId() + "-DCP");
					oValueHelpPanel.setDefineConditions(oDefineConditionPanel);
				}
			} else {
				oValueHelpPanel.setDefineConditions();
			}
		}
	}

	function _updateFilterBar(sMutation, oFilterBar) {

		if (sMutation === "remove") {
			oFilterBar.setModel(null, "filter");
			oFilterBar = undefined;
		} else if (this._oFilterConditionModel) {
			oFilterBar.setModel(this._oFilterConditionModel, "filter");
		}

		var oDialog = this.getAggregation("_dialog");
		if (oDialog) {
			var oValueHelpPanel = oDialog.getContent()[0];
			oValueHelpPanel.setFilterbar(oFilterBar);
			oValueHelpPanel.setShowFilterbar(!!oFilterBar);
		}

	}

	function _getSuggestionContent() {

		var oWrapper = this.getContent();
		if (oWrapper) {
			return oWrapper.getSuggestionContent();
		}

	}

	return FieldValueHelp;

}, /* bExport= */true);
