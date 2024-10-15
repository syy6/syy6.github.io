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

	/**
	 * Constructor for a new FilterField2.
	 * A Field can be used to bind its value to data of certain data type. Based on the data type settings, a default
	 * visualization is done by the FilterField2.
	 * The field publishes its properties to the content as a model <code>$field</code> to which the internal content can bind.
	 * This model is local to the content and cannot be used outside the fields context.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 *
	 * @extends sap.ui.mdc.base.FieldBase
	 *
	 * @author SAP SE
	 * @version 1.60.42
	 *
	 * @constructor
	 * @alias sap.ui.mdc.base.FilterField2
	 * @author SAP SE
	 * @version 1.60.42
	 * @since 1.60.0
	 *
	 * @private
	 * @experimental
	 */
	var FilterField2 = FieldBase.extend("sap.ui.mdc.base.FilterField2", /* @lends sap.ui.mdc.base.FilterField2.prototype */ {
		metadata: {
			library: "sap.ui.mdc",
			properties: {
			},
			events: {
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
						 * Flag indicates if the entered <code>value</code> is valid.
						 */
						valid: { type: "boolean" }
					}
				}
			}
		},
		renderer: FieldBaseRenderer
	});

	FilterField2.prototype.init = function() {

		FieldBase.prototype.init.apply(this, arguments);

//		this._oObserver.observe(this, {
////			properties: ["fieldPath"],
////			aggregations: ["fieldInfo" , "content"],
//			associations: ["fieldHelp"]
//		});

	};

	FilterField2.prototype.exit = function() {

		FieldBase.prototype.exit.apply(this, arguments);

	};

	FilterField2.prototype._fireChange = function(aConditions, bValid) {

		var vValue;

		if (aConditions.length == 1) {
			vValue = aConditions[0].values[0];
//			if (aConditions[0].values[1]) {
//				vAdditionalValue = aConditions[0].values[1];
//			}
		}

		this.fireChange({ value: vValue, valid: bValid });

	};

	return FilterField2;

}, /* bExport= */ true);
