/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'sap/ui/mdc/library',
	'sap/ui/base/ManagedObjectObserver',
	'./FieldBase',
	'./FieldBaseRenderer'
], function(
		library,
		ManagedObjectObserver,
		FieldBase,
		FieldBaseRenderer
	) {
	"use strict";

//	var EditMode = library.EditMode;
//	var FieldDisplay = library.FieldDisplay;

	/**
	 * Constructor for a new Field.
	 * A Field can be used to bind its value to data of certain data type. Based on the data type settings, a default
	 * visualization is done by the Field.
	 * The field publishes its properties to the content as a model <code>$field</code> to which the internal content can bind.
	 * This model is local to the content and cannot be used outside the fields context.
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
	 * @alias sap.ui.mdc.base.Field
	 * @author SAP SE
	 * @version 1.60.42
	 * @since 1.54.0
	 *
	 * @private
	 * @experimental
	 */
	var Field = FieldBase.extend("sap.ui.mdc.base.Field", /* @lends sap.ui.mdc.base.Field.prototype */ {
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * The value of the field
				 *
				 */
				value: {
					type: "any",
					defaultValue: null
				},
				/**
				 * the additional value of the field.
				 *
				 * Depending on the dataType this could be an description, a unit, a key....
				 */
				additionalValue: {
					type: "any",
					defaultValue: null
				}
			},
			events: {
//				/**
//				 * To be used to validate the value CTRL+K checks the values against the constraints.
//				 * This is also fired before a value is put to the data model
//				 */
//				validate: {
//
//				},
				/**
				 * This event is fired when the value property of the field is changed
				 *
				 * <b>Note</b> This event is only triggered if the used content control has a change event
				 */
				change: {
					parameters: {

						/**
						 * The new <code>value</code> of the <code>control</code>.
						 */
						value: { type: "string" },

						/**
						 * Flag indecates if the entered <code>value</code> is valid.
						 */
						valid: { type: "boolean" }
					}
				}//,
//				/**
//				 * This event is fired when the value of the field is changed - e.g. at each keypress
//				 *
//				 * <b>Note</b> This event is only triggered if the used content control has a liveChange event
//				 */
//				liveChange : {
//					parameters : {
//						/**
//						 * The new value of the input.
//						 */
//						value : {type : "string"},
//
//						/**
//						 * Indicate that ESC key triggered the event.
//						 */
//						escPressed : {type : "boolean"},
//
//						/**
//						 * The value of the input before pressing ESC key.
//						 */
//						previousValue : {type : "string"}
//					}
//				},
//				/**
//				 * Fired if the inner control has a press event and this is fired
//				 */
//				press: {}
			},
			defaultProperty: "value"
		},
		renderer: FieldBaseRenderer
	});

	Field.prototype.init = function() {

		FieldBase.prototype.init.apply(this, arguments);

		this.setMaxConditions(1);
		this.setProperty("_onlyEEQ", true, true);

		this._oObserver.observe(this, {
			properties: ["value", "additionalValue", "fieldPath"]//,
//			aggregations: ["fieldInfo" , "content"],
//			associations: ["fieldHelp"]
		});

	};

	Field.prototype.exit = function() {

		FieldBase.prototype.exit.apply(this, arguments);

	};

	Field.prototype.bindProperty = function(sName, oBindingInfo) {

		FieldBase.prototype.bindProperty.apply(this, arguments);

		if (sName === "value" && oBindingInfo.type) {
			// use type of binding
			this._oDataType = oBindingInfo.type;
		}

	};

	/**
	 * This property must not be set for the <code>Field</code>
	 *
	 * @param {int} iMaxConditons only 1 condition allows in <code>Field</code>
	 * @returns {sap.ui.mdc.base.Field} <code>this</code> to allow method chaining.
	 * @private
	 */
	Field.prototype.setMaxConditions = function(iMaxConditons) {

		if (iMaxConditons !== 1) {
			throw new Error("Only one condition allowed for Field " + this);
		}

		return this.setProperty("maxConditions", iMaxConditons, true);

	};

	Field.prototype._observeChanges = function(oChanges) {

		FieldBase.prototype._observeChanges.apply(this, arguments);

		var aConditions;
		var oCondition;
		var vValue;

		if (oChanges.name === "value") {
			var oBinding = this.getBinding("value");
			var sAdditionalValue = this.getAdditionalValue();
			if (oBinding && !oBinding.isA("sap.ui.model.CompositeBinding") && oBinding.getValue) {
				vValue = oBinding.getValue(); // to get the internal value in the property
			} else {
				vValue = oChanges.current;
			}
			if (sAdditionalValue) {
				oCondition = this._createItemCondition(vValue, sAdditionalValue);
			} else {
				oCondition = this._createItemCondition(vValue);
			}
			this.setConditions([oCondition]);
		}

		if (oChanges.name === "additionalValue") {
			vValue = this.getValue();
			if (vValue || vValue === 0) {
				// without Value it makes no sense
				if (oChanges.current) {
					oCondition = this._createItemCondition(vValue, oChanges.current);
				} else {
					oCondition = this._createItemCondition(vValue);
				}
				this.setConditions([oCondition]);
			}
		}

		if (oChanges.name === "fieldPath") { // TODO: do we really need FieldPath on Field or should we hide it?
			aConditions = this.getConditions().slice();
			if (aConditions.length > 0) {
				for (var i = 0; i < aConditions.length; i++) {
					oCondition = aConditions[i];
					oCondition.fieldPath = oChanges.current;
				}
			}
			this.setConditions(aConditions);
		}

	};

	Field.prototype._fireChange = function(aConditions, bValid) {

		var vValue;
		var vAdditionalValue;

		if (aConditions.length === 1) {
			vValue = aConditions[0].values[0];
			if (aConditions[0].values[1]) {
				vAdditionalValue = aConditions[0].values[1];
			}
		}

		if (bValid) {
			var oBinding = this.getBinding("value");
			if (oBinding && !oBinding.isA("sap.ui.model.CompositeBinding") && oBinding._toExternalValue) {
				vValue = oBinding._toExternalValue(vValue); // to get the external value in the property
			}
			this.setProperty("value", vValue, true);
			this.setProperty("additionalValue", vAdditionalValue, true);
		}

		this.fireChange({ value: vValue, valid: bValid });

	};

	/**
	 * Sets conditions to the property <code>conditions</code>.
	 *
	 * Do not use the <code>conditions</code> property, use the <code>value</code> property instead.
	 *
	 * @param {object[]} aConditions conditions to be set
	 * @return {sap.ui.mdc.base.Field} Reference to <code>this</code> to allow method chaining
	 * @private
	 * @name sap.ui.mdc.base.Field#setConditions
	 * @function
	 */

	/**
	 * Gets conditions of the property <code>conditions</code>.
	 *
	 * Do not use the <code>conditions</code> property, use the <code>value</code> property instead.
	 *
	 * @return {object[]} conditions of the field
	 * @private
	 * @name sap.ui.mdc.base.Field#getConditions
	 * @function
	 */

	/**
	 * Sets the fieldPath to the property <code>fieldPath</code>.
	 *
	 * Do not use the <code>fieldPath</code> property. If a FieldValueHelp is used set the <code>keyPath</code> property there.
	 *
	 * @param {string} sFieldPath fieldPath to be set
	 * @return {sap.ui.mdc.base.Field} Reference to <code>this</code> to allow method chaining
	 * @private
	 * @name sap.ui.mdc.base.Field#setFieldPath
	 * @function
	 */

	/**
	 * Gets value of the property <code>fieldPath</code>.
	 *
	 * Do not use the <code>fieldPath</code> property. If a FieldValueHelp is used set the <code>keyPath</code> property there.
	 *
	 * @return {string} fieldPath of the field
	 * @private
	 * @name sap.ui.mdc.base.Field#getFieldPath
	 * @function
	 */

	return Field;

}, /* bExport= */ true);
