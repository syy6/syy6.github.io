/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/core/Element'
], function(Element) {
	"use strict";

	/**
	 * Constructor for a new LinkItem.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Type for...
	 * @extends sap.ui.core.Element
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.58.0
	 * @alias sap.ui.mdc.base.info.LinkItem
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var LinkItem = Element.extend("sap.ui.mdc.base.info.LinkItem", /** @lends sap.ui.mdc.base.info.LinkItem.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				key: {
					type: "string"
				},
				text: {
					type: "string"
				},
				description: {
					type: "string"
				},
				href: {
					type: "string"
				},
				target: {
					type: "string",
					defaultValue: "_self"
				},
				icon: {
					type: "string"
				},
				isMain: {
					type: "boolean",
					defaultValue: false
				},
				isSuperior: {
					type: "boolean",
					defaultValue: false
				}
			// ER: LinkItem should not have the visible property.
			// The visibility should be modified either via default logic defined by UX like
			// * show only less 10 links
			// * show always superior links and other do not show
			// * show always the main link
			// or wia personalization. So the application should not be able to manipulate the
			// visibility in breakout.
			// visible: {
			// 	type: "boolean",
			// 	defaultValue: true
			// }
			}
		}
	});

	return LinkItem;

}, /* bExport= */true);
