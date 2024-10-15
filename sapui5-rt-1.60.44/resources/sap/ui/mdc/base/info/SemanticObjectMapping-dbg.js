/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/core/Element'
], function(Element) {
	"use strict";

	/**
	 * Constructor for a new SemanticObjectMapping.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Type for...
	 * @extends sap.ui.core.Element
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.58.0
	 * @alias sap.ui.mdc.base.info.SemanticObjectMapping
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SemanticObjectMapping = Element.extend("sap.ui.mdc.base.info.SemanticObjectMapping", /** @lends sap.ui.mdc.base.info.SemanticObjectMapping.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				semanticObject: {
					type: "string"
				}
			},
			defaultAggregation: "items",
			aggregations: {
				items: {
					type: "sap.ui.mdc.base.info.SemanticObjectMappingItem",
					multiple: true,
					singularName: "item"
				}
			}
		}
	});

	return SemanticObjectMapping;

}, /* bExport= */true);
