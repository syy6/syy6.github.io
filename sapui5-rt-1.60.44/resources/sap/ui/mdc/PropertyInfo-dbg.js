/*
 * !SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'sap/ui/base/ManagedObject'
], function(ManagedObject) {
	"use strict";
	// Provides the PropertyInfo class.
	/**
	 * Constructor for a new PropertyInfo.
	 * 
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The PropertyInfo for the field/property metadata used within MDC controls, an instance can be created to override the default/metadata
	 *        behavior.
	 *        <h3><b>Note:</b></h3>
	 *        The control is experimental and the API/behaviour is not finalised and hence this should not be used for productive usage.
	 * @extends sap.ui.core.ManagedObject
	 * @author SAP SE
	 * @constructor The API/behaviour is not finalised and hence this control should not be used for productive usage.
	 * @private
	 * @experimental
	 * @since 1.58
	 * @alias sap.ui.mdc.PropertyInfo
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var PropertyInfo = ManagedObject.extend("sap.ui.mdc.PropertyInfo", /** @lends sap.ui.mdc.PropertyInfo.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * Defines the name/path of the property, has to be always filled. If there is no path additionally specified, the name is used as the
				 * path to the property.
				 */
				name: {
					type: "string",
					defaultValue: null
				},
				/*
				 * Optionally a path, if the name is not pointing to the property from which data can be retrieved. //TODO
				 */
				path: {
					type: "string",
					defaultValue: null
				},

				label: {
					type: "string",
					defaultValue: null
				},

				type: {
					type: "string",
					defaultValue: "string"
				},
				/**
				 * TODO: Fill this from Adapter once it is available. Not sure how this can be structured (E.g. maxLength and other constraints)
				 */
				constraints: {
					type: "object",
					visibility: 'hidden',
					defaultValue: null
				},

				sortable: {
					type: "boolean",
					defaultValue: true
				},

				filterable: {
					type: "boolean",
					defaultValue: true
				}

			}
		}
	});

	return PropertyInfo;

}, true);
