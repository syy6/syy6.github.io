/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'sap/ui/thirdparty/jquery',
	'sap/ui/Device',
	'./FieldBaseRenderer',
	'sap/ui/mdc/library',
	'sap/ui/mdc/base/FilterOperatorConfig',
	'sap/ui/core/Control',
	'sap/base/util/ObjectPath',
	'sap/base/util/deepEqual',
	'sap/base/util/merge',
	'sap/ui/dom/containsOrEquals',
	'sap/ui/model/base/ManagedObjectModel',
	'sap/ui/base/ManagedObjectObserver'
], function(
	jQuery,
	Device,
	FieldBaseRenderer,
	library,
	FilterOperatorConfig,
	Control,
	ObjectPath,
	deepEqual,
	merge,
	containsOrEquals,
	ManagedObjectModel,
	ManagedObjectObserver
) {
	"use strict";

	var EditMode = library.EditMode;
	var FieldDisplay = library.FieldDisplay;

	/**
	 * Constructor for a new FieldBase.
	 * A FieldBase is the basic control to be used in Field and FilterField. It must not be used stand alone.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 *
	 * @extends sap.ui.core.Control
	 * @implements sap.ui.core.IFormContent
	 *
	 * @author SAP SE
	 * @version 1.60.42
	 *
	 * @constructor
	 * @alias sap.ui.mdc.base.FieldBase
	 * @author SAP SE
	 * @version 1.60.42
	 * @since 1.58.0
	 *
	 * @private
	 * @experimental
	 */
	var FieldBase = Control.extend("sap.ui.mdc.base.FieldBase", /* @lends sap.ui.mdc.base.FieldBase.prototype */ {
		metadata: {
			interfaces: ["sap.ui.core.IFormContent"],
			library: "sap.ui.mdc",
			properties: {
				/**
				 * The datatype for the field visualization
				 */
				dataType: {
					type: "string",
					group: "Data",
					defaultValue: 'sap.ui.model.type.String'
				},

				dataTypeConstraints: {
					type: "object",
					group: "Data",
					defaultValue: null
				},

				dataTypeFormatOptions: {
					type: "object",
					group: "Data",
					defaultValue: null
				},

				/**
				 * Whether the field is editable.
				 */
				editMode: {
					type: "sap.ui.mdc.EditMode",
					group: "Data",
					defaultValue: EditMode.Editable
				},

				/**
				 * Whether the field is required.
				 * TODO: create a type FieldControl (auto, false, true) false might lead to error
				 */
				required: {
					type: "boolean",
					group: "Data",
					defaultValue: false
				},

//				/**
//				 * Icon to be displayed as graphical element before the field.
//				 * This can be an image or an icon from the icon font.
//				 */
//				icon: {
//					type: "sap.ui.core.URI",
//					group: "Appearance",
//					defaultValue: null
//				},

				/**
				 * Defines whether the value and/or description of the field is shown.
				 */
				display: {
					type: "sap.ui.mdc.FieldDisplay",
					defaultValue: FieldDisplay.Value
				},

				/**
				 * Defines the horizontal alignment of the text that is shown inside the input field.
				 */
				textAlign: {
					type: "sap.ui.core.TextAlign",
					group: "Appearance",
					defaultValue: sap.ui.core.TextAlign.Initial
				},

				/**
				 * Defines the text directionality of the input field, e.g. <code>RTL</code>, <code>LTR</code>
				 */
				textDirection: {
					type: "sap.ui.core.TextDirection",
					group: "Appearance",
					defaultValue: sap.ui.core.TextDirection.Inherit
				},

				/**
				 * Defines a short hint intended to aid the user with data entry when the control has no value.
				 * If the value is null no placeholder is shown.
				 */
				placeholder: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Visualizes the validation state of the control, e.g. <code>Error</code>, <code>Warning</code>, <code>Success</code>.
				 */
				valueState: {
					type: "sap.ui.core.ValueState",
					group: "Appearance",
					defaultValue: sap.ui.core.ValueState.None
				},

				/**
				 * Defines the text that appears in the value state message pop-up. If this is not specified, a default text is shown from the resource bundle.
				 */
				valueStateText: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Defines the width of the control.
				 */
				width: {
					type: "sap.ui.core.CSSSize",
					group: "Dimension",
					defaultValue: null
				},

				/**
				 * If set, the <code>Field</code> is rendered using a multi line control.
				 *
				 * This property has only effect on type supporting multiple lines
				 */
				multipleLines: {
					type: "boolean",
					group: "Appearance",
					defaultValue: false
				},

				/**
				 * Defines the path of the filter field that is used to create and show conditions.
				 * The path normally represents a simple property in the corresponding model that should be used
				 * for filtering. In some cases it could also be required to filter for nested model structures.
				 * In such cases use a path to the property separated by slashes.
				 */
				fieldPath: {
					type: "string",
					group: "Data",
					defaultValue: null
				},

				/**
				 * Sets the maximum amount of conditions that are allowed for this field.
				 *
				 * The default value of -1 indicates that an unlimited amount of conditions can defined.
				 */
				maxConditions: {
					type: "int",
					group: "Behavior",
					defaultValue: -1
				},

				/**
				 * Sets the conditions that represents the values of the field
				 *
				 * This should be bound to a ConditionModel using the fieldPath
				 */
				conditions: {
					type: "object[]",
					group: "Data",
					defaultValue: []
				},

				_value: {
					type: "any",
					group: "Data",
					visibility: "hidden"
				},

				_description: {
					type: "string",
					group: "Data",
					defaultValue: "",
					visibility: "hidden"
				},

				_fieldHelpEnabled: {
					type: "boolean",
					group: "Appearance",
					defaultValue: false,
					visibility: "hidden"
				},

				_onlyEEQ: {	// TODO: better logic
					type: "boolean",
					group: "Appearance",
					defaultValue: false,
					visibility: "hidden"
				}

			},
			aggregations: {
				/**
				 * optional content to be bound to the value of the field
				 */
				content: {
					type: "sap.ui.core.Control",
					multiple: false
				},

				/**
				 * internal content if no control given
				 */
				_content: {
					type: "sap.ui.core.Control",
					multiple: false,
					visibility: "hidden"
				},

				/**
				 * optional FieldInfo, used for detail information. This is only active in display mode
				 */
				fieldInfo: {
					type: "sap.ui.mdc.base.FieldInfoBase",
					multiple: false
				}
			},
			associations: {
				/**
				 * optional FieldHelp.
				 *
				 * This is an association to allow the usage of one <code>FieldHelp</code> instance on multiple fields
				 */
				fieldHelp: {
					type: "sap.ui.mdc.base.FieldHelpBase",
					multiple: false
				},

				/**
				 * Association to controls / IDs that label this control (see WAI-ARIA attribute aria-labelledby).
				 */
				ariaLabelledBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" }
			},
			events: {
//				/**
//				 * This event is fired when the value property of the field is changed
//				 *
//				 * <b>Note</b> This event is only triggered if the used content control has a change event
//				 */
//				change: {
//					parameters: {
//						// TODO return conditions instead of value
//						/**
//						 * The selected <code>conditions</code>.
//						 */
//						conditions: { type: "object[]" },
//
//						/**
//						 * Flag indecates if the entered <code>value</code> is valid.
//						 */
//						valid: { type: "boolean" }
//					}
//				},
				/**
				 * This event is fired when the value of the field is changed - e.g. at each keypress
				 *
				 * <b>Note</b> This event is only triggered if the used content control has a liveChange event
				 */
				liveChange : {
					parameters : {
						/**
						 * The new value of the input.
						 */
						value : {type : "string"},

						/**
						 * Indicate that ESC key triggered the event.
						 */
						escPressed : {type : "boolean"},

						/**
						 * The value of the input before pressing ESC key.
						 */
						previousValue : {type : "string"}
					}
				},
				/**
				 * Fired if the inner control has a press event and this is fired
				 */
				press: {}
			},
			publicMethods: [],
			defaultAggregation: "content",
			defaultProperty: "value"
		},
		_oManagedObjectModel: null
	});

	var mControlTypes = {
			"default": {
				edit: "sap/m/Input",
				editMulti: "sap/m/MultiInput",
				editMultiLine: "sap/m/TextArea",
				display: "sap/m/Text",
				createEdit: _createInputControl,
				createEditMulti: _createMultiInputControl,
				createEditMultiLine: _createTextAreaControl,
				createDisplay: _createTextControl
			},
			"search" : {
				edit: "sap/m/SearchField",
				//editMulti: "sap/m/SearchField", // not used
				display: "sap/m/SearchField",
				createEdit: _createSearchField,
				//createEditMulti: _createSearchField, // not used
				createDisplay: _createSearchField
			},
			date: {
				edit: "sap/m/DatePicker",
				editMulti: "sap/m/MultiInput", // FieldHelp needed to enter date
				display: "sap/m/Text",
				createEdit: _createDatePickerControl,
				createEditMulti: _createMultiInputControl, // FieldHelp needed to enter date
				createDisplay: _createTextControl
			},
			time: {
				edit: "sap/m/TimePicker",
				editMulti: "sap/m/MultiInput", // FieldHelp needed to enter date
				display: "sap/m/Text",
				createEdit: _createDatePickerControl, // as same API as DatePicker
				createEditMulti: _createMultiInputControl, // FieldHelp needed to enter date
				createDisplay: _createTextControl
			},
			dateTime: {
				edit: "sap/m/DateTimePicker",
				editMulti: "sap/m/MultiInput", // FieldHelp needed to enter date
				display: "sap/m/Text",
				createEdit: _createDatePickerControl, // as same API as DatePicker
				createEditMulti: _createMultiInputControl, // FieldHelp needed to enter date
				createDisplay: _createTextControl
			},
			link: {
				edit: undefined, // TODO: what happens in edit mode?
				display: "sap/m/Link",
				createEdit: undefined,
				createDisplay: _createLinkControl
			},
			bool: {
				edit: "sap/m/Input",
				display: "sap/m/Text",
				createEdit: _createBoolInputControl,
				createDisplay: _createTextControl
			}
	};

	var mControls = {};

	var mDefaultHelps = {
			bool: {
				name: "sap/ui/mdc/base/BoolFieldHelp",
				id: "BoolDefaultHelp",
				control: undefined
			}
	};

	FieldBase.prototype.init = function() {

		this._oManagedObjectModel = new ManagedObjectModel(this);

		this._oObserver = new ManagedObjectObserver(this._observeChanges.bind(this));

		this._oObserver.observe(this, {
			properties: ["display", "editMode", "dataType", "multipleLines", "maxConditions", "conditions"],
			aggregations: ["fieldInfo" , "content"],
			associations: ["fieldHelp"]
		});

		this._oDatePickerRequested = {};

		this.attachModelContextChange(_handleModelContextChange.bind(this));

	};

	FieldBase.prototype.exit = function() {

		var oFieldInfo = this.getFieldInfo();
		if (oFieldInfo) {
			// as aggregations are destroyed after exit
			oFieldInfo.detachEvent("dataUpdate", _handleInfoDataUpdate, this);
		}
		// TODO: detach other event handlers too

		this._oManagedObjectModel.destroy();
		delete this._oManagedObjectModel;

		this._oObserver.disconnect();
		this._oObserver = undefined;

		if (this._oFilterOperatorConfig) {
			this._oFilterOperatorConfig.destroy();
			delete this._oFilterOperatorConfig;
		}

		// TODO: How to remove from ConditionModel?

	};

	FieldBase.prototype.applySettings = function(mSettings, oScope) {

		Control.prototype.applySettings.apply(this, arguments);

//		// trigger creation of inner content -> do it async. as some properties might set later
//		_createInternalContentAsync.call(this);

	};

	FieldBase.prototype.onBeforeRendering = function() {

//		if (this._oCreateInnerPromise) {
			// determine internal control now , as it is still pending
			_createInternalContent.call(this);
//		}
	};

	FieldBase.prototype.onAfterRendering = function() {

// TODO: what if only Input re-renders, but not Field
		if (_getFieldHelp.call(this) && this.getEditMode() != EditMode.Display) {
			// disable browsers autocomplete if field help is available
			var oContent = this.getAggregation("_content");
			if (oContent) {
				var oDomRef = oContent.getFocusDomRef();
				jQuery(oDomRef).attr("autocomplete", "off");
			}
		}

	};

	FieldBase.prototype.onfocusin = function(oEvent) {

		_connectFieldhelp.call(this);

	};

	FieldBase.prototype.onsapup = function(oEvent) {

		var oFieldHelp = _getFieldHelp.call(this);

		if (oFieldHelp) {
			oEvent.preventDefault();
			oEvent.stopPropagation();
			oFieldHelp.navigate(-1);
		}

	};

	FieldBase.prototype.onsapdown = function(oEvent) {

		var oFieldHelp = _getFieldHelp.call(this);

		if (oFieldHelp) {
			oEvent.preventDefault();
			oEvent.stopPropagation();
			oFieldHelp.navigate(1);
		}

	};

	FieldBase.prototype.clone = function(sIdSuffix, aLocalIds) {

		// detach event handler before cloning to not have it twice on the clone
		// attach it after clone again
		var oContent = this.getContent();
		if (oContent) {
			_detachContentHandlers.call(this, oContent);
		}

		var oFieldInfo = this.getFieldInfo();
		if (oFieldInfo) {
			oFieldInfo.detachEvent("dataUpdate", _handleInfoDataUpdate, this);
		}

		var oClone = Control.prototype.clone.apply(this, arguments);

		if (oContent) {
			_attachContentHandlers.call(this, oContent);
		}

		if (oFieldInfo) {
			oFieldInfo.attachEvent("dataUpdate", _handleInfoDataUpdate, this);
		}

		return oClone;

	};

	FieldBase.prototype._fireChange = function(aConditions, bValid) {
		// to be implemented by Filed and FilterField
	};

	FieldBase.mapEdmTypes = {
			"Edm.Boolean": "sap.ui.model.odata.type.Boolean",
			"Edm.Byte": "sap.ui.model.odata.type.Byte",
			"Edm.Date": "sap.ui.model.odata.type.Date", // V4 Date
			"Edm.DateTime": "sap.ui.model.odata.type.DateTime", // only for V2  constraints: {displayFormat: 'Date' }
			"Edm.DateTimeOffset": "sap.ui.model.odata.type.DateTimeOffset", //constraints: { V4: true, precision: n }
			"Edm.Decimal": "sap.ui.model.odata.type.Decimal", //constraints: { precision, scale, minimum, maximum, minimumExclusive, maximumExclusive}
			"Edm.Double": "sap.ui.model.odata.type.Double",
			"Edm.Float": "sap.ui.model.odata.type.Single",
			"Edm.Guid": "sap.ui.model.odata.type.Guid",
			"Edm.Int16": "sap.ui.model.odata.type.Int16",
			"Edm.Int32": "sap.ui.model.odata.type.Int32",
			"Edm.Int64": "sap.ui.model.odata.type.Int64",
			//Edm.Raw not supported
			"Edm.SByte": "sap.ui.model.odata.type.SByte",
			"Edm.Single": "sap.ui.model.odata.type.Single",
			"Edm.String": "sap.ui.model.odata.type.String", //constraints: {maxLength, isDigitSequence}
			"Edm.Time": "sap.ui.model.odata.type.Time", // only V2
			"Edm.TimeOfDay": "sap.ui.model.odata.type.TimeOfDay" // V4 constraints: {precision}
	};

	function _createDataType(sType) {
		var OTypeClass = ObjectPath.get(sType || "");
		if (!OTypeClass) {
			var sNewType = FieldBase.mapEdmTypes[sType];
			if (!sNewType) {
//				Log.error("FieldBase", "dataType for " + sType + " can not be created!");
				return null;
			}
			return _createDataType.call(this, sNewType);
		}
		return new OTypeClass(this.getDataTypeFormatOptions(), this.getDataTypeConstraints());
	}

	function _getDataType() {
		if (!this._oDataType) {
			this._oDataType = this.getDataType();
			if (typeof this._oDataType === "string") {
				this._oDataType = _createDataType.call(this, this._oDataType);
			}
		}
		return this._oDataType;
	}

	// TODO: better API to provide data type for field help
	FieldBase.prototype._getDataType = function() {
		return _getDataType.call(this);
	};

	function _getDataTypeName() {

		if (this._oDataType && typeof this._oDataType === "object") {
			return this._oDataType.getMetadata().getName();
		} else {
			return this.getDataType();
		}

	}

	function _getDataTypeConstraints() {

		if (this._oDataType && typeof this._oDataType === "object" && this._oDataType.oConstraints) {
			return this._oDataType.oConstraints;
		} else {
			return this.getDataTypeConstraints();
		}

	}

	function _handleConditionsChange(aConditions, aConditionsOld) {

		var oFieldHelp = _getFieldHelp.call(this);
		var iMaxConditions = this.getMaxConditions();
		var bOnlyEEQ = _getOnlyEEQ.call(this);
		var vValue;
		var sDescription;
		var i = 0;
		var bChanged = false;
		var oType;

		if (aConditions.length > 0) {
			oType = _getDataType.call(this);
		}

		for (i = 0; i < aConditions.length; i++) {
			var oCondition = merge({}, aConditions[i]); // to not change the original condition

			// TODO find right place for the unit logic
			if (oType && (oType.getMetadata().getName() === "sap.ui.model.type.Unit" || oType.getMetadata().getName() === "sap.ui.model.type.Currency")) {
				vValue = merge([], oCondition.values);
			} else if (!bOnlyEEQ || oCondition.operator === "EQ" || oCondition.operator === "EEQ") {
				// maybe the description is missing -> try to determine from FieldHelp
				oCondition.values = _getValueDescription.call(this, oCondition);
				vValue = oCondition.values[0];
				sDescription = oCondition.values[1];
			}
		}

		if (iMaxConditions === 1) {
			if (!sDescription) {
				sDescription = vValue; // to show also values without key
			}
			if (vValue !== _getValue.call(this) || sDescription !== _getDescription.call(this)) {
				bChanged = true;
				_setValue.call(this, vValue, true);
				_setDescription.call(this, sDescription, true);
			}
		}

		if (oFieldHelp && this._bConnected) {
			oFieldHelp.setConditions(aConditions);
		}

		if (bChanged || aConditionsOld) {
			// only if real change -> not if FieldHelp is just updated without changing anything
			// to update token text
			this._oManagedObjectModel.checkUpdate(); //TODO : should work automatically
		}

	}

	FieldBase.prototype._getContent = function() {

		return this.getContent() || this.getAggregation("_content");

	};

	function _getEditable(sEditMode) {

		if (sEditMode && sEditMode === EditMode.Editable) {
			return true;
		} else {
			return false;
		}

	}

	function _getEnabled(sEditMode) {

		if (sEditMode && sEditMode != EditMode.Disabled) {
			return true;
		} else {
			return false;
		}

	}

	function _setValue(vValue, bSuppressInvalidate) {

		return this.setProperty("_value", vValue, bSuppressInvalidate);

	}

	function _getValue() {

		return this.getProperty("_value");

	}

	function _setDescription(sDescription, bSuppressInvalidate) {

		return this.setProperty("_description", sDescription, bSuppressInvalidate);

	}

	function _getDescription() {

		return this.getProperty("_description");

	}

	function _getOnlyEEQ() {

		return this.getProperty("_onlyEEQ");

	}

	// TODO: better logic to tell FieldValueHelp to hide DefineConditions
	FieldBase.prototype._getOnlyEEQ = function() {

		return _getOnlyEEQ.call(this);

	};

	// TODO: find better point in time
//	FieldBase.prototype.updateProperty = function(sName) {
//		Control.prototype.updateProperty.apply(this, arguments);
//
//		if (sName === "conditions" && !this._bFFAdded) {
//			var oConditionModel = _getConditionModel.call(this);
//			if (oConditionModel) {
//				oConditionModel.addFilterField(this);
//				this._bFFAdded = true;
//			}
//		}
//		return this;
//	};

	function _handleModelContextChange(oEvent) {

		if (!this._bFFAdded) {
			var oConditionModel = _getConditionModel.call(this);
			if (oConditionModel) {
				oConditionModel.addFilterField(this);
				this._bFFAdded = true;
			}
		}

	}

	// TODO: at the End we should not need a ConditionModel - all functions should be available outside
	function _getConditionModel() {

		var oBinding = this.getBinding("conditions");
		if (oBinding) {
			var oModel = oBinding.getModel();
			if (oModel.isA("sap.ui.mdc.base.ConditionModel")) {
				return oModel;
			}
		}

		return undefined;

	}

	FieldBase.prototype._getFilterOperatorConfig = function() {

		var oConditionModel = _getConditionModel.call(this);

		if (oConditionModel) {
			return oConditionModel.getFilterOperatorConfig();
		} else if (this._oFilterOperatorConfig) {
			return this._oFilterOperatorConfig;
		} else {
			this._oFilterOperatorConfig = FilterOperatorConfig.getFor(); // TODO: pass somehow model of Field?
			return this._oFilterOperatorConfig;
		}

	};

	// TODO: move to a central factory
	FieldBase.prototype._createItemCondition = function(vValue, sDescription) {
		var oConditionModel = _getConditionModel.call(this);
		var oCondition;

		if (oConditionModel) {
			oCondition = oConditionModel.createItemCondition(this.getFieldPath(), vValue, sDescription);
		} else {
			var aValues = [vValue, sDescription];
			if (sDescription === null || sDescription === undefined) {
				aValues.pop();
			}
			oCondition =  _createCondition.call(this, "EEQ", aValues);
		}
		return oCondition;
	};

	// TODO: move to a central factory
	function _createCondition(sOperator, aValues) {
		var oConditionModel = _getConditionModel.call(this);
		var oCondition;

		if (oConditionModel) {
			oCondition = oConditionModel.createCondition(this.getFieldPath(), sOperator, aValues);
		} else {
			oCondition = { fieldPath: this.getFieldPath(), operator: sOperator, values: aValues };
		}
		return oCondition;
	}

	// TODO: move to a central factory
	function _indexOfCondition(oCondition) {
		var iIndex = -1;
		var aConditions = this.getConditions();
		var sCondition = JSON.stringify(oCondition, ['fieldPath', 'operator', 'values']);
		aConditions.some(function(oCondition, i) {
			if (JSON.stringify(oCondition, ['fieldPath', 'operator', 'values']) === sCondition) {
				iIndex = i;
				return true;
			}
			return false;
		});
		return iIndex;
	}

	function _setUIMessage(sMsg) {
		var oConditionModel = _getConditionModel.call(this);
		if (oConditionModel) {
			oConditionModel.setUIMessage(this.getFieldPath(), sMsg);
		}
	}

	function _removeUIMessage() {
		var oConditionModel = _getConditionModel.call(this);
		if (oConditionModel) {
			oConditionModel.removeUIMessage(this.getFieldPath());
		}
	}

	/**
	 * Observes changes
	 *
	 * to be enhanced by Field, FilterField...
	 *
	 * @param {object} oChanges Changes
	 * @protected
	 */
	FieldBase.prototype._observeChanges = function(oChanges) {

		if (oChanges.name === "editMode") {
//			_createInternalContentAsync.call(this);
			if (this.getAggregation("_content")) {
				_createInternalContent.call(this);
			}
		}

		if (oChanges.name === "multipleLines") {
//			_createInternalContentAsync.call(this);
			if (this.getAggregation("_content")) {
				_createInternalContent.call(this);
			}
		}

		if (oChanges.name === "dataType") {
			if (this._oDataType) {
				this._oDataType.destroy();
				this._oDataType = undefined;
			}
			this.destroyAggregation("_content");
		}

		if (oChanges.name === "maxConditions") {
//			_createInternalContentAsync.call(this);
			if (this.getAggregation("_content")) {
				_createInternalContent.call(this);
			}
		}

		if (oChanges.name === "conditions") {
			_handleConditionsChange.call(this, oChanges.current, oChanges.old);
		}

		if (oChanges.name === "display") {
			this.destroyAggregation("_content"); // as bound property can change
		}

		if (oChanges.name === "fieldHelp" && oChanges.ids) {
			_fieldHelpChanged.call(this, oChanges.ids, oChanges.mutation);
		}

		if (oChanges.name === "fieldInfo" && oChanges.child) {
			_fieldInfoChanged.call(this, oChanges.child, oChanges.mutation);
		}

		if (oChanges.name === "content" && oChanges.child) {
			_contentChanged.call(this, oChanges.child, oChanges.mutation);
		}

	};

	FieldBase.prototype.getFocusDomRef = function() {

		var oContent = this._getContent();

		if (oContent) {
			return oContent.getFocusDomRef();
		} else {
			return this.getDomRef();
		}

	};

	FieldBase.prototype.getIdForLabel = function() {

		var sId;
		var oContent = this._getContent();
		if (oContent) {
			sId = oContent.getIdForLabel();
		} else {
			sId = this.getId();
		}

		return sId;

	};

	/*
	 * If Field is inside of a Form use Forms aria logic for label
	 */
	FieldBase.prototype.enhanceAccessibilityState = function(oElement, mAriaProps) {

		var oParent = this.getParent();

		if (oParent && oParent.enhanceAccessibilityState) {
			// use Field as control, but aria proprties of rendered inner control.
			oParent.enhanceAccessibilityState(this, mAriaProps);
		}

		return mAriaProps;

	};

	function _contentChanged(oContent, sMutation) {

		if (sMutation === "remove") {
			oContent.unbindElement("$field");
			_detachContentHandlers.call(this, oContent);

			// let the internal control be created on rendering
		} else if (sMutation === "insert") {
			_setModelOnContent.call(this, oContent);
			_attachContentHandlers.call(this, oContent);

			if (this.getAggregation("_content")) {
				this.destroyAggregation("_content");
			}
		}

	}

	function _attachContentHandlers(oContent) {

		if (oContent.getMetadata().getEvents().change) {
			// content has change event -> attach handler
			oContent.attachEvent("change", _handleContentChange, this);
		}
		if (oContent.getMetadata().getEvents().liveChange) {
			// content has liveChange event -> attach handler
			oContent.attachEvent("liveChange", _handleContentLiveChange, this);
		}
		if (oContent.getMetadata().getEvents().press) {
			// content has press event -> attach handler
			oContent.attachEvent("press", _handleContentPress, this);
		}

	}

	function _detachContentHandlers(oContent) {

		if (oContent.getMetadata().getEvents().change) {
			// oldContent has change event -> detach handler
			oContent.detachEvent("change", _handleContentChange, this);
		}
		if (oContent.getMetadata().getEvents().liveChange) {
			// oldContent has liveChange event -> detach handler
			oContent.detachEvent("liveChange", _handleContentLiveChange, this);
		}
		if (oContent.getMetadata().getEvents().press) {
			// oldContent has press event -> detach handler
			oContent.detachEvent("press", _handleContentPress, this);
		}

	}

	function _createInternalContent() {

//		if (this._oCreateInnerPromise) {
//			delete this._oCreateInnerPromise;
//		}

		if (this.getContent() || this._bIsBeingDestroyed) {
			return;
		}

		var sEditMode = this.getEditMode();
		var sDataType = _getDataTypeName.call(this);
		var oDataTypeConstraints = _getDataTypeConstraints.call(this);
		var iMaxConditions = this.getMaxConditions();
		var oControlType;
		var sControlName;
		var fnCreate;
		var oContentOld = this.getAggregation("_content");
		var sControlNameOld;

		if (oContentOld) {
			sControlNameOld = oContentOld.getMetadata().getName().replace(/\./g, "/");
		}

		switch (sDataType) {
		case "Edm.Date": // V4
		case "sap.ui.model.type.Date":
		case "sap.ui.model.odata.type.Date":
			oControlType = mControlTypes.date;
			break;

		case "Edm.DateTime": // V2
		case "sap.ui.model.odata.type.DateTime":
			if (oDataTypeConstraints && (oDataTypeConstraints.displayFormat === "Date" || oDataTypeConstraints.isDateOnly)) {
				oControlType = mControlTypes.date;
			} else {
				oControlType = mControlTypes.dateTime;
			}
			break;

		case "Edm.DateTimeOffset":
		case "sap.ui.model.type.DateTime":
		case "sap.ui.model.odata.type.DateTimeOffset":
			oControlType = mControlTypes.dateTime;
			break;

		case "Edm.TimeOfDay":
		case "sap.ui.model.type.Time":
		case "sap.ui.model.odata.type.TimeOfDay":
			oControlType = mControlTypes.time;
			break;

		case "Edm.Boolean":
		case "sap.ui.model.type.Boolean":
		case "sap.ui.model.odata.type.Boolean":
			oControlType = mControlTypes.bool;
			break;

		default:
			if (this.getFieldInfo() && this._bTriggerable) {
				oControlType = mControlTypes.link;
			} else {
				var regexp = new RegExp("^\\*(.*)\\*|\\$search$");
				if (regexp.test(this.getProperty("fieldPath")) && this.getMaxConditions() === 1) {
					oControlType = mControlTypes.search;
				} else {
					oControlType = mControlTypes.default;
				}			}
			break;
		}

		if (sEditMode === EditMode.Display) {
			sControlName = oControlType.display;
			fnCreate = oControlType.createDisplay;
		} else if (iMaxConditions !== 1) {
			sControlName = oControlType.editMulti;
			fnCreate = oControlType.createEditMulti;
		} else if (this.getMultipleLines()) {
			sControlName = oControlType.editMultiLine;
			fnCreate = oControlType.createEditMultiLine;
		} else {
			sControlName = oControlType.edit;
			fnCreate = oControlType.createEdit;
		}

		if (!sControlName) {
			throw new Error("No control defined for type " + sDataType + " in " + this);
		}

		if (sControlName !== sControlNameOld) {
			if (oContentOld) {
				this.destroyAggregation("_content");
			}

			if (!mControls[sControlName]) {
				mControls[sControlName] = {};
			}
			var MyControl = mControls[sControlName].control;
			if (!MyControl) {
				if (mControls[sControlName].promise) {
					mControls[sControlName].promise.then(_createInternalContent.bind(this));
					return;
				} else {
					MyControl = sap.ui.require(sControlName);
					if (MyControl) {
						mControls[sControlName].control = MyControl;
					} else {
						mControls[sControlName].promise = new Promise(function(fResolve) {
							mControls[sControlName].resolve = fResolve;
							sap.ui.require([sControlName], _controlLoaded.bind(this));
						}.bind(this)).then(_createInternalContent.bind(this));
						return;
					}
				}
			}

			var sId = this.getId() + "-inner";
			var oControl = fnCreate.call(this, MyControl, sId);
			_setModelOnContent.call(this, oControl);
			this.setAggregation("_content", oControl);
		}
	}

//	function _createInternalContentAsync() {
//
//		if (!this._oCreateInnerPromise) {
//			this._oCreateInnerPromise = Promise.resolve().then(_createInternalContent.bind(this));
//		}
//
//	}

	function _controlLoaded(fnControl) {
		var sControlName = fnControl.getMetadata().getName();
		sControlName = sControlName.replace(/\./g, "/");
		mControls[sControlName].control = fnControl;
		mControls[sControlName].resolve();
		delete mControls[sControlName].resolve;
	}

	function _setModelOnContent(oContent) {
		oContent.setModel(this._oManagedObjectModel, "$field");
		oContent.bindElement({ path: "/", model: "$field" });
	}

	function _createInputControl(Input, sId) {

		var sDisplay = this.getDisplay();
		var oPath;

		if (sDisplay === FieldDisplay.Description) {
			oPath = {path: "$field>_description"};
		} else if (!_getOnlyEEQ.call(this)) {
			oPath = {
				path: '$field>conditions/0',
				formatter: _formatCondition.bind(this)
				};
		} else {
			var oType = _getDataType.call(this);
			oPath = {path: "$field>_value", type: oType};
		}

		var oInput = new Input(sId, {
			value: oPath,
			placeholder: "{$field>placeholder}",
			textAlign: "{$field>textAlign}",
			textDirection: "{$field>textDirection}",
			required: "{$field>required}",
			editable: { path: "$field>editMode", formatter: _getEditable },
			enabled: { path: "$field>editMode", formatter: _getEnabled },
			valueState: "{$field>valueState}",
			valueStateText: "{$field>valueStateText}",
			showValueHelp: "{$field>_fieldHelpEnabled}",
			width: "100%",
			tooltip: "{$field>tooltip}",
			change: _handleContentChange.bind(this),
			liveChange: _handleContentLiveChange.bind(this),
			valueHelpRequest: _handleValueHelpRequest.bind(this)
		});

		_addFieldHelpIcon.call(this, oInput);

		return oInput;
	}

	function _createSearchField(SearchField, sId) {
		var oControl = new SearchField(sId, {
			value: {
				path: '$field>conditions/0',
				formatter: _formatSearchCondition.bind(this)
				},
			placeholder: "{$field>placeholder}",
			width: "100%",
			tooltip: "{$field>tooltip}",				
			search:  _handleContentChange.bind(this)
			// liveChange: function(oEvent) {
			// 	var oFF = oEvent.oSource.getParent();
			// 	var sValue = oEvent.getParameter("newValue");

			// 	if (this.iChangeTimer) {
			// 		clearTimeout(this.iChangeTimer);
			// 		delete this.iChangeTimer;
			// 	}
			// 	this.iChangeTimer = setTimeout(function() {
			// 		var oOperator = _getFilterOperatorConfig.call(this).getOperator("Contains");
			// 	}.bind(this), 400);
			// }.bind(this)
		});
		return oControl;
	}

	function _createMultiInputControl(MultiInput, sId) {

		var Token = sap.ui.require("sap/m/Token"); // is loaded by MultiInput
		if (!Token) {
			throw new Error("sap.m.Token not loaded " + this);
		}

		var oToken = new Token(sId + "-token", {
			text: {
				path: '$field>',
				formatter: _formatCondition.bind(this) }
		});

		var oMultiInput = new MultiInput(sId, {
			placeholder: "{$field>placeholder}",
			textAlign: "{$field>textAlign}",
			textDirection: "{$field>textDirection}",
			required: "{$field>required}",
			editable: { path: "$field>editMode", formatter: _getEditable },
			enabled: { path: "$field>editMode", formatter: _getEnabled },
			valueState: "{$field>valueState}",
			valueStateText: "{$field>valueStateText}",
			showValueHelp: "{$field>_fieldHelpEnabled}",
			width: "100%",
			tooltip: "{$field>tooltip}",
			tokens: {path: "$field>conditions", template: oToken},
			dependents: [oToken], // to destroy it if MultiInput is destroyed
			change: _handleContentChange.bind(this),
			liveChange: _handleContentLiveChange.bind(this),
			tokenUpdate: _handleTokenUpdate.bind(this),
			valueHelpRequest: _handleValueHelpRequest.bind(this)
		});

		_addFieldHelpIcon.call(this, oMultiInput);

		return oMultiInput;
	}

	function _createTextAreaControl(TextArea, sId) {
		var oTextArea = new TextArea(sId, {
			value: "{$field>_value}",
			placeholder: "{$field>placeholder}",
			textAlign: "{$field>textAlign}",
			textDirection: "{$field>textDirection}",
			required: "{$field>required}",
			editable: { path: "$field>editMode", formatter: _getEditable },
			enabled: { path: "$field>editMode", formatter: _getEnabled },
			valueState: "{$field>valueState}",
			valueStateText: "{$field>valueStateText}",
			width: "100%",
			tooltip: "{$field>tooltip}",
			change: _handleContentChange.bind(this),
			liveChange: _handleContentLiveChange.bind(this)
		});

		return oTextArea;
	}

	function _createTextControl(Text, sId) {

		var iMaxConditions = this.getMaxConditions();
		var sPath;

		if (iMaxConditions === 1) {
			sPath = {
					path: '$field>conditions/0',
					formatter: _formatCondition.bind(this)
					};
		} else {
			sPath = {
					path: '$field>conditions',
					formatter: _formatConditions.bind(this)
					};
		}

		var oText = new Text(sId, {
			text: sPath,
			textAlign: "{$field>textAlign}",
			textDirection: "{$field>textDirection}",
			wrapping: "{$field>multipleLines}",
			width: "100%",
			tooltip: "{$field>tooltip}"
		});

		return oText;
	}

	function _createDatePickerControl(DatePicker, sId) {

		var oType = _getDataType.call(this);

		var oDatePicker = new DatePicker(sId, {
			value: {path: "$field>_value", type: oType},
			placeholder: "{$field>placeholder}",
			textAlign: "{$field>textAlign}",
			textDirection: "{$field>textDirection}",
			required: "{$field>required}",
			editable: { path: "$field>editMode", formatter: _getEditable },
			enabled: { path: "$field>editMode", formatter: _getEnabled },
			valueState: "{$field>valueState}", // TODO: own ValueState handling?
			valueStateText: "{$field>valueStateText}",
			width: "100%",
			tooltip: "{$field>tooltip}",
			change: _handleContentChange.bind(this)
		});

		return oDatePicker;
	}

	function _createLinkControl(Link, sId) {

		var oLink = new Link(sId, {
			text: {
				path: '$field>conditions/0',
				formatter: _formatCondition.bind(this)
			},
			textAlign: "{$field>textAlign}",
			textDirection: "{$field>textDirection}",
//			width: "100%",
			tooltip: "{$field>tooltip}",
			press: _handleContentPress.bind(this)
		});

		return oLink;
	}

	function _createBoolInputControl(Input, sId) {

		// use default field help
		if (!this.getFieldHelp()) {
			_createDefaultFieldHelp.call(this, "bool");
		}

		return _createInputControl.call(this, Input, sId);

	}

	function _createDefaultFieldHelp(sType) {

		this.setProperty("_fieldHelpEnabled", true, true);
		this._sDefaultFieldHelp = mDefaultHelps[sType].id;

		var oFieldHelp = mDefaultHelps[sType].control;
		if (!oFieldHelp) {
			if (mDefaultHelps[sType].promise) {
				mDefaultHelps[sType].promise.then(_defaultFieldHelpUpdate.bind(this));
			}
			var FieldHelp = sap.ui.require(mDefaultHelps[sType].name);
			if (!FieldHelp && !mDefaultHelps[sType].promise) {
				mDefaultHelps[sType].promise = new Promise(function(fResolve) {
					mDefaultHelps[sType].resolve = fResolve;
					sap.ui.require([mDefaultHelps[sType].name], function(fnControl) {
						_createDefaultFieldHelp.call(this, sType);
					}.bind(this));
				}.bind(this)).then(_defaultFieldHelpUpdate.bind(this));
			}
			if (FieldHelp) {
				oFieldHelp = new FieldHelp(mDefaultHelps[sType].id);
				mDefaultHelps[sType].control = oFieldHelp;
				this.addDependent(oFieldHelp); // TODO: where to add to control tree
				oFieldHelp.connect(this); // to forward dataType
				if (mDefaultHelps[sType].resolve) {
					mDefaultHelps[sType].resolve();
					delete mDefaultHelps[sType].resolve;
				}
				if (!mDefaultHelps[sType].promise) {
					_defaultFieldHelpUpdate.call(this);
				}
			}
		}

	}

	function _defaultFieldHelpUpdate() {

		_fieldHelpChanged.call(this, "BoolDefaultHelp", "insert");
		_addFieldHelpIcon.call(this, this.getAggregation("_content"));

	}

	function _formatCondition(oCondition) {

		// TODO: Format depending on "display" property???
		var sResult = "";
		if (oCondition && oCondition.operator && oCondition.values) {
			var oOperator = this._getFilterOperatorConfig().getOperator(oCondition.operator);
			var aValues = _getValueDescription.call(this, oCondition);
			sResult = oOperator.format(aValues, oCondition, _getDataType.call(this), this.getDisplay());
		}

		return sResult;
	}

	function _formatConditions(aConditions) {

		var sResult = "";

		if (aConditions) {
			for (var i = 0; i < aConditions.length; i++) {
				var oCondition = aConditions[i];
				if (sResult) {
					sResult = sResult + "; ";
				}
				sResult = sResult + _formatCondition.call(this, oCondition);
			}
		}

		return sResult;

	}

	function _formatSearchCondition(oCondition) {

		// TODO: returns the value of the Search Field without operator
		var sResult = "";
		if (oCondition && oCondition.values) {
			var aValues = _getValueDescription.call(this, oCondition);
			sResult = aValues[0];
		}

		return sResult;
	}

	function _getValueDescription(oCondition) {

		var aValues = oCondition.values;
		if (oCondition.operator === "EQ" || oCondition.operator === "EEQ") {
			var vValue = aValues[0];
			var sDescription = aValues[1];
			if (!sDescription && this.getDisplay() !== FieldDisplay.Value) {
				var oFieldHelp = _getFieldHelp.call(this);
				if (oFieldHelp) {
					sDescription = oFieldHelp.getTextForKey(vValue);
					aValues = [vValue, sDescription]; // new array to not manipulate existing one in condition
				}
			}
		}

		return aValues;

	}

	function _handleContentChange(oEvent) {

		var iMaxConditions = this.getMaxConditions();
		var sFieldPath = this.getFieldPath();
		var aConditions = this.getConditions();
		var bOnlyEEQ = _getOnlyEEQ.call(this);
		var vValue;
		var vKey;
		var bValid = true;
		var oCondition;

		if ("valid" in oEvent.getParameters()) {
			bValid = oEvent.getParameter("valid");
		}

		// if a type with formatting is used (like Date) we need to set the basic value in the condition
		// so use the internal custom/value for what the content is bound
		// TODO: find better solution with type forwarding...
		var oBI = oEvent.oSource.getBindingInfo("value");
		if (oBI && oBI.binding && oBI.binding.sPath === "_value" && bValid) {
			vValue = _getValue.call(this);
		} else if ("value" in oEvent.getParameters()) {
			vValue = oEvent.getParameter("value");
		} else if ("query" in oEvent.getParameters()) {
			vValue = oEvent.getParameter("query");
		} else {
			vValue = _getValue.call(this);
		}

		var oFieldHelp = _getFieldHelp.call(this);
		if (oFieldHelp) {
			oFieldHelp.close();
			oFieldHelp.setFilterValue("");
			if (vValue && this.getDisplay() !== FieldDisplay.Value) {
				// value is used as key -> get key
				vKey = oFieldHelp.getKeyForText(vValue);
				if (vKey === undefined || vKey === null) { //support boolean
					// maybe key is entered
					var sValue = oFieldHelp.getTextForKey(vValue);
					if (sValue) {
						vKey = vValue;
						vValue = sValue;
					}
				}
			}
		}

		var oType = _getDataType.call(this);

		if (vValue) {
			if (oType && (oType.getMetadata().getName() === "sap.ui.model.type.Unit" || oType.getMetadata().getName() === "sap.ui.model.type.Currency")) {
				// TODO support also other operators
				oCondition = this._createItemCondition(vValue[0], vValue[1]);
			} else if (vKey !== undefined && vKey !== null) { //support boolean
				oCondition = this._createItemCondition(vKey, vValue);
			} else if (bOnlyEEQ) {
				oCondition = this._createItemCondition(vValue);
			} else {
				// find the suitable operators
				var sType = oType.getMetadata().getName();
				var oFilterOperatorConfig = this._getFilterOperatorConfig();
				var aOperators = oFilterOperatorConfig.getMatchingOperators(sType, vValue);
				var oOperator;

				// use default operator if nothing found
				if (aOperators.length === 0) {
					// default operation
					var sDefaultOperator = oFilterOperatorConfig.getDefaultOperator(sType);
					oOperator = oFilterOperatorConfig.getOperator(sDefaultOperator);
					vValue = oOperator ? oOperator.format([vValue], undefined, oType) : vValue;
				} else {
					oOperator = aOperators[0]; // TODO: multiple matches?
				}

				try {
					if (oOperator && oOperator.test(vValue, oType)) {
						_removeUIMessage.call(this);

						oCondition = oOperator.getCondition(vValue, oType);
						if (oCondition) {
							oCondition.fieldPath = sFieldPath;
						}
					}
				} catch (err) {
					_setUIMessage.call(this, err.message);
				}
			}
		}

		if (iMaxConditions !== 1) {
			oEvent.getSource().setValue(""); // remove typed value of MultiInput
		}

		if (oCondition) {
			if (_indexOfCondition.call(this, oCondition) >= 0) {
				return; // condition already exist
			}
			if (iMaxConditions > 0 && iMaxConditions <= aConditions.length) {
				// remove first conditions to meet maxConditions
				aConditions.splice(0, aConditions.length - iMaxConditions + 1);
			}
			aConditions.push(oCondition);
		} else if (iMaxConditions === 1) {
			aConditions = [];
		}

		if (!deepEqual(aConditions, this.getConditions())) {
			this.setProperty("conditions", aConditions, true); // do not invalidate whole field

			if (oFieldHelp && this._bConnected) {
				oFieldHelp.setConditions(aConditions);
			}

			this._fireChange(aConditions, bValid );
		}

	}

	function _handleContentLiveChange(oEvent) {

		var vValue;
		var vPreviousValue;
		var bEscPressed = false;

		if ("value" in oEvent.getParameters()) {
			vValue = oEvent.getParameter("value");
		}

		if ("escPressed" in oEvent.getParameters()) {
			bEscPressed = oEvent.getParameter("escPressed");
		}

		if ("previousValue" in oEvent.getParameters()) {
			vPreviousValue = oEvent.getParameter("previousValue");
		} else {
			vPreviousValue = _getValue.call(this);
		}

		var oFieldHelp = _getFieldHelp.call(this);
		if (oFieldHelp && oFieldHelp.openByTyping()) {
			// TODO: better logic
			var vFilter;
			if (vValue[0] === "=" && vValue[1] === "=") {
				vFilter = vValue.slice(2);
			} else if (vValue[0] === "=" || vValue[0] === ">" || vValue[0] === "<") {
				vFilter = vValue.slice(1);
			} else {
				vFilter = vValue;
			}

			var oType = _getDataType.call(this);
			if (oType && (oType.getMetadata().getName() === "sap.ui.model.type.Unit" || oType.getMetadata().getName() === "sap.ui.model.type.Currency")) {
				// TODO better logic, resuse parts of Type?
				var rx = new RegExp(/^([,.\d]+)\s(\w+)$/i);
				var aValues = vFilter.match(rx);
				if (aValues) {
					vFilter = aValues[2];
				} else {
					rx = new RegExp(/^(\w+)\s([,.\d]+)$/i);
					aValues = vFilter.match(rx);
					if (aValues) {
						vFilter = aValues[1];
					} else if (/\d/.test(vFilter)) {
						vFilter = undefined;
					}
				}
			}

			oFieldHelp.setFilterValue(vFilter);
			// While suggestion no item is selected
			oFieldHelp.setConditions([]);
			oFieldHelp.open(true);
		}

		this.fireLiveChange({ value: vValue, escPressed: bEscPressed, previousValue: vPreviousValue});

	}

	function _handleContentPress(oEvent) {

		var oFieldInfo = this.getFieldInfo();
		if (oFieldInfo) {
			oFieldInfo.getTriggerHref().then(function (sHref) {
				if (sHref){
					window.location.href = sHref;
				} else {
					oFieldInfo.open(this._getContent());
				}
			}.bind(this));
		}

		this.firePress();

	}

	function _handleTokenUpdate(oEvent) {

		if (oEvent.getParameter("type") === "removed") {
			var aRemovedTokens = oEvent.getParameter("removedTokens");
			var aConditions = this.getConditions();
			var i;

			for (i = 0; i < aRemovedTokens.length; i++) {
				var oRemovedToken = aRemovedTokens[i];
				var sPath = oRemovedToken.getBindingContext("$field").sPath;
				var iIndex = parseInt(sPath.slice(sPath.lastIndexOf("/") + 1), 10);
				aConditions[iIndex].delete = true;
			}

			for (i = aConditions.length - 1; i >= 0; i--) {
				if (aConditions[i].delete) {
					aConditions.splice(i, 1);
				}
			}

			this.setProperty("conditions", aConditions, true); // do not invalidate whole field
			this._fireChange(aConditions, true );

		}

	}

	function _fieldHelpChanged(sId, sMutation) {

		var oFieldHelp = sap.ui.getCore().byId(sId);

		if (sMutation === "remove") {
	//TODO: check if works
			oFieldHelp.detachEvent("select", _handleFieldHelpSelect, this);
			oFieldHelp.detachEvent("navigate", _handleFieldHelpNavigate, this);
			oFieldHelp.detachEvent("dataUpdate", _handleHelpDataUpdate, this);
			oFieldHelp.detachEvent("disconnect", _handleDisconnect, this);
			this.setProperty("_fieldHelpEnabled", false, true);
		} else if (sMutation === "insert") {
			if (oFieldHelp) {
				oFieldHelp.attachEvent("dataUpdate", _handleHelpDataUpdate, this);
//				_setAdditionalValueFromKey.call(this, this.getValue());
				this.setProperty("_fieldHelpEnabled", true, true);
			}
		}

		_handleConditionsChange.call(this, this.getConditions()); // to update descriptions

	}

	function _getFieldHelp() {

		var sId = this.getFieldHelp();
		var oFieldHelp;

		if (!sId && this._sDefaultFieldHelp) {
			sId = this._sDefaultFieldHelp;
		}

		if (sId) {
			oFieldHelp = sap.ui.getCore().byId(sId);
		}

		return oFieldHelp;

	}

	function _handleValueHelpRequest(oEvent) {

		var oFieldHelp = _getFieldHelp.call(this);

		if (oFieldHelp) {
			oFieldHelp.setFilterValue("");
			oFieldHelp.toggleOpen(false);
		}

	}

	function _handleFieldHelpSelect(oEvent) {

		var sValue = oEvent.getParameter("value");
		var vKey = oEvent.getParameter("key");
		var aConditions = this.getConditions();
		var aNewConditions = oEvent.getParameter("conditions");
		var bAdd = oEvent.getParameter("add");
		var iMaxConditions = this.getMaxConditions();
		var bOnlyEEQ = _getOnlyEEQ.call(this);
		var oCondition;
		var oType = _getDataType.call(this);
		var oContent;
		var sDOMValue;
		var rx = new RegExp(/^([,.\d]+)\s(\w+)$/i);
		var rx2 = new RegExp(/^(\w+)\s([,.\d]+)$/i);
		var aValues;
		var sNewValue = "";

		if (!bAdd) {
			aConditions = []; // remove all existing conditions
		}

		if (!aNewConditions) {
			if (oType && (oType.getMetadata().getName() === "sap.ui.model.type.Unit" || oType.getMetadata().getName() === "sap.ui.model.type.Currency") &&
					iMaxConditions === 1) {
//				if (aConditions.length > 0) {
//					oCondition = merge({}, aConditions[0]);
//					oCondition.values[1] = vKey;
//				} else {
//					oCondition = this._createItemCondition(0, vKey);
//				}
				oContent = this._getContent();
				sDOMValue = oContent.getDOMValue && oContent.getDOMValue(); 
				aValues = sDOMValue.match(rx);
				if (aValues) {
					sNewValue = aValues[1] + " " + aNewConditions[0].values[1];
				} else {
					aValues = sDOMValue.match(rx2);
					if (aValues) {
						sNewValue = aNewConditions[0].values[1] + " " + aValues[2];
					} else if (sDOMValue && /\d/.test(sDOMValue)){
						sNewValue = sDOMValue.trim() + " " + aNewConditions[0].values[1];
					} else {
						sNewValue = "0 " + aNewConditions[0].values[1];
					}
				}
				aValues = oType.parseValue(sNewValue, "string");
				oCondition = this._createItemCondition(aValues[0], aValues[1]);
				aConditions.push(oCondition);
			} else if (this.getDisplay() !== FieldDisplay.Value) {
				// value is used as key
				oCondition = this._createItemCondition(vKey, sValue);
			} else {
				oCondition = this._createItemCondition(sValue);
			}

			if (_indexOfCondition.call(this, oCondition) === -1) { // check if already exist
				aConditions.push(oCondition);
			}
		} else {
			if (oType && (oType.getMetadata().getName() === "sap.ui.model.type.Unit" || oType.getMetadata().getName() === "sap.ui.model.type.Currency") &&
					iMaxConditions === 1) {
				if (aNewConditions.length > 0) {
//					if (aConditions.length > 0) {
//						oCondition = merge({}, aConditions[0]);
//						oCondition.values[1] = aNewConditions[0].values[0];
//					} else {
//						oCondition = this._createItemCondition(0, aNewConditions[0].values[0]);
//					}
					oContent = this._getContent();
					sDOMValue = oContent.getDOMValue && oContent.getDOMValue(); 
					aValues = sDOMValue.match(rx);
					if (aValues) {
						sNewValue = aValues[1] + " " + aNewConditions[0].values[1];
					} else {
						aValues = sDOMValue.match(rx2);
						if (aValues) {
							sNewValue = aNewConditions[0].values[1] + " " + aValues[2];
						} else if (sDOMValue && /\d/.test(sDOMValue)){
							sNewValue = sDOMValue.trim() + " " + aNewConditions[0].values[1];
						} else {
							sNewValue = "0 " + aNewConditions[0].values[1];
						}
					}
					aValues = oType.parseValue(sNewValue, "string");
					oCondition = this._createItemCondition(aValues[0], aValues[1]);
					aConditions.push(oCondition);
				}
			} else {
				for (var i = 0; i < aNewConditions.length; i++) {
					oCondition = aNewConditions[i];
					if (bOnlyEEQ && oCondition.operator !== "EQ" && oCondition.operator !== "EEQ") {
						continue;
					}

					if (!bAdd || _indexOfCondition.call(this, oCondition) === -1) { // check if already exist
						aConditions.push(oCondition);
					}
				}
			}
		}

		if (iMaxConditions > 0 && iMaxConditions < aConditions.length) {
			// remove first conditions to meet maxConditions
			aConditions.splice(0, aConditions.length - iMaxConditions);
		}

		// remove typed value from MultiInput
		var oContent = this._getContent();
		if (oContent && oContent.setDOMValue && iMaxConditions !== 1) {
			oContent.setDOMValue("");
		}

		this.setProperty("conditions", aConditions, true); // do not invalidate whole field
		this._fireChange(aConditions, true);

	}

	function _handleFieldHelpNavigate(oEvent) {

		var sValue = oEvent.getParameter("value");
//		var sAdditionalValue = oEvent.getParameter("additionalValue");
		var sKey = oEvent.getParameter("key");
		var sNewValue;
//		var sNewAdditionalValue;

		var oType = _getDataType.call(this);
		if (oType && (oType.getMetadata().getName() === "sap.ui.model.type.Unit" || oType.getMetadata().getName() === "sap.ui.model.type.Currency")) {
			// TODO better logic, resuse parts of Type?
			var oContent = this._getContent();
			var sDOMValue = oContent.getDOMValue && oContent.getDOMValue(); 
			var rx = new RegExp(/^([,.\d]+)\s(\w+)$/i);
			var aValues = sDOMValue.match(rx);
			if (aValues) {
				sNewValue = aValues[1] + " " + sValue;
			} else {
				rx = new RegExp(/^(\w+)\s([,.\d]+)$/i);
				aValues = sDOMValue.match(rx);
				if (aValues) {
					sNewValue = sValue + " " + aValues[2];
				} else if (sDOMValue && /\d/.test(sDOMValue)){
					sNewValue = sDOMValue.trim() + " " + sValue;
				} else {
					sNewValue = sValue;
				}
			}
			sValue = sNewValue;
		} else if (this.getDisplay() === FieldDisplay.Description) {
			// value is used as key
			sNewValue = sKey;
//			sNewAdditionalValue = sValue;
		} else {
			sNewValue = sValue;
//			sNewAdditionalValue = sAdditionalValue;
		}

		var oContent = this._getContent();
		if (oContent && oContent.setDOMValue) {
			oContent.setDOMValue(sValue);
			oContent._doSelect();
		}

		this.fireLiveChange({value: sNewValue});

	}

	function _handleHelpDataUpdate(oEvent) {

		// also in display mode to get right text
		_handleConditionsChange.call(this, this.getConditions());
		if (this.getMaxConditions() !== 1 || this.getDisplay() !== FieldDisplay.Value) {
			this._oManagedObjectModel.checkUpdate(true); // to update token text
		}

	}

	function _handleDisconnect(oEvent) {

		var oFieldHelp = _getFieldHelp.call(this);
		oFieldHelp.detachEvent("select", _handleFieldHelpSelect, this);
		oFieldHelp.detachEvent("navigate", _handleFieldHelpNavigate, this);
		oFieldHelp.detachEvent("disconnect", _handleDisconnect, this);
		this._bConnected = false;

	}

	function _connectFieldhelp() {

		var oFieldHelp = _getFieldHelp.call(this);
		if (oFieldHelp && !this._bConnected) {
			oFieldHelp.connect(this);
			this._bConnected = true;
			oFieldHelp.attachEvent("select", _handleFieldHelpSelect, this);
			oFieldHelp.attachEvent("navigate", _handleFieldHelpNavigate, this);
			oFieldHelp.attachEvent("disconnect", _handleDisconnect, this);
			var aConditions = this.getConditions();
			oFieldHelp.setConditions(aConditions);

			var oContent = this._getContent();
			if (oContent && !oContent.orgOnsapfocusleave && oContent.onsapfocusleave) {
				//TODO: find better solution
				oContent.orgOnsapfocusleave = oContent.onsapfocusleave;
				oContent.onsapfocusleave = function(oEvent) {
					var oFieldHelp = _getFieldHelp.call(this.getParent());

					if (oFieldHelp) {
						var oFocusedControl = sap.ui.getCore().byId(oEvent.relatedControlId);
						if (oFocusedControl
							&& containsOrEquals(oFieldHelp.getDomRef(), oFocusedControl.getFocusDomRef())) {
							oEvent.stopPropagation();
							return;
						}
					}
					this.orgOnsapfocusleave(oEvent);
				};
			}
		}

	}

	// TODO: need API on Input
	function _addFieldHelpIcon(oControl) {

		var oFieldHelp = _getFieldHelp.call(this);

		if (oFieldHelp && oControl.addEndIcon) {
			var sIconName = oFieldHelp.getIcon();
			var oIcon = oControl.getAggregation("_endIcon", [])[0];

			if (oIcon) {
				oIcon.setSrc(sIconName);
			} else {
				oControl.addEndIcon({
					id: oControl.getId() + "-vhi",
					src: sIconName,
					useIconTooltip: false,
					noTabStop: true,
					press: function (oEvent) {
						// if the property valueHelpOnly is set to true, the event is triggered in the ontap function
						if (!this.getValueHelpOnly()) {
							var $input;

							if (Device.support.touch) {
								// prevent opening the soft keyboard
								$input = this.$('inner');
								$input.attr('readonly', 'readonly');
								this.focus();
								$input.removeAttr('readonly');
							} else {
								this.focus();
							}

							this.bValueHelpRequested = true;
							this.fireValueHelpRequest({ fromSuggestions: false });
						}
					}.bind(oControl)
				});
			}
		}

	}

	function _fieldInfoChanged(oFieldInfo, sMutation) {

		if (sMutation === "remove") {
			oFieldInfo.detachEvent("dataUpdate", _handleInfoDataUpdate, this);
		} else if (sMutation === "insert") {
			oFieldInfo.attachEvent("dataUpdate", _handleInfoDataUpdate, this);
			_handleInfoDataUpdate.call(this); // to set already existing values
		}

	}

	function _handleInfoDataUpdate() {

		if (this.getEditMode() === EditMode.Display) {
			var oFieldInfo = this.getFieldInfo();
			var that = this;
			oFieldInfo.isTriggerable().then(function (bTriggerable) {
				that._bTriggerable = bTriggerable;
//				_createInternalContentAsync.call(that);
				if (that.getAggregation("_content")) {
					_createInternalContent.call(that);
				}
			});
		}

	}

	return FieldBase;

}, /* bExport= */ true);
