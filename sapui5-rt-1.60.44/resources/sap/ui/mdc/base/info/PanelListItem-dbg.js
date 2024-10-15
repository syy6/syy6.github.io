/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/core/XMLComposite'
], function(XMLComposite) {
	"use strict";

	/**
	 * Constructor for a new PanelListItem.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class Type for <code>items</code> aggregation in <code>Panel</code> control.
	 * @extends sap.ui.mdc.XMLComposite
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.54.0
	 * @alias sap.ui.mdc.base.info.PanelListItem
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var PanelListItem = XMLComposite.extend("sap.ui.mdc.base.info.PanelListItem", /** @lends sap.ui.mdc.base.info.PanelListItem.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * Defines text of the item.
				 */
				text: {
					type: "string"
				},
				/**
				 * Defines additional text of the item.
				 */
				description: {
					type: "string"
				},
				/**
				 * Defines href of the item.
				 */
				href: {
					type: "string"
				},
				/**
				 * Defines icon of the item.
				 */
				icon: {
					type: "string"
				},
				/**
				 * Defines target of the item.
				 */
				target: {
					type: "string",
					defaultValue: undefined
				},
				/**
				 * Defines visibility of the item.
				 */
				visible: {
					type: "boolean",
					defaultValue: true
				}
			},
			events: {
				/**
				 * Event is fired when the user triggers the link control.
				 */
				pressLink: {
					allowPreventDefault: true,
					parameters: {
						target: {
							type: "string"
						}
					}
				}
			}
		}
	});
	PanelListItem.prototype.onPress = function(oEvent) {
		if (!this.firePressLink({
			href: oEvent.getSource().getHref(),
			target: oEvent.getSource().getTarget()
		})) {
			oEvent.preventDefault();
		}
	};
	return PanelListItem;

}, /* bExport= */true);
