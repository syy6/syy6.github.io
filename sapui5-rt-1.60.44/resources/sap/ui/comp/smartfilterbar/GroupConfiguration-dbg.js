/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

// Provides control sap.ui.comp.smartfilterbar.GroupConfiguration.
sap.ui.define(['sap/ui/comp/library', 'sap/ui/core/Element'],
	function(library, Element) {
	"use strict";


	/**
	 * Constructor for a new smartfilterbar/GroupConfiguration.
	 *
	 * @param {string} [sID] ID for the new control, generated automatically if no ID is given 
	 * @param {object} [mSettings] initial settings for the new control
	 *
	 * @class
	 * A GroupConfiguration can be used to add additional configurations for groups in the SmartFilterBar. A group in the SmartFilterBar is a group of filter fields in the advanced search.
	 * @extends sap.ui.core.Element
	 *
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartfilterbar.GroupConfiguration
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var GroupConfiguration = Element.extend("sap.ui.comp.smartfilterbar.GroupConfiguration", /** @lends sap.ui.comp.smartfilterbar.GroupConfiguration.prototype */ { metadata : {

		library : "sap.ui.comp",
		properties : {

			/**
			 * The key property shall correspond to the name EntityTypeName from the OData service $metadata document.
			 */
			key : {type : "string", group : "Misc", defaultValue : null},

			/**
			 * Zero based integer index.
			 * The index can be used to specify the order of groups. If no index is specified, the order like in the OData metadata will be used.
			 */
			index : {type : "any", group : "Misc", defaultValue : undefined},

			/**
			 * Using this property it is possible to overwrite the label of a group in the advanced area of the SmartFilterBar.
			 */
			label : {type : "any", group : "Misc", defaultValue : undefined}
		},
		events : {

			/**
			 * Fired when the value of a property, for example label, has changed
			 */
			change : {
				parameters : {

					/**
					 * Name of the changed property
					 */
					propertyName : {type : "string"}
				}
			}
		}
	}});
	
	GroupConfiguration.prototype.setLabel = function(sLabel) {
		this.setProperty("label", sLabel);
		this.fireChange({
			propertyName: "label"
		});
		return this;
	};

	return GroupConfiguration;

}, /* bExport= */ true);