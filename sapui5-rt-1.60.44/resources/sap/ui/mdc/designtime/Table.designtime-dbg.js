/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

// Provides the Design Time Metadata for the sap.m.Table control
sap.ui.define([
	"sap/ui/mdc/TableSettings"
], function(TableSettings) {
	"use strict";

	return {
		name: "{name}",
		description: "{description}",
		aggregations: {
			_content: {
				domRef: ":sap-domref",
				ignore: false,
				propagateRelevantContainer: true,
				propagateMetadata: function(oElement) {
					var sType = oElement.getMetadata().getName();
					// Disable RTA for all other UI5 table related code
					if (sType === "sap.m.Column" || sType === "sap.ui.table.Column") {
						return {
							actions: {
								remove: {
									changeType: "removeMDCColumn",
									changeOnRelevantContainer: true
								}
							}
						};
					} else if (sType === "sap.ui.mdc.Table" || sType === "sap.ui.table.Table" || sType === "sap.m.Table" || sType === "sap.m.Toolbar") {
						return {
							actions: {
								settings: {
									handler: function(oControl, mPropertyBag) {
										// TODO: only show settings on the table
										var oMDCTable = mPropertyBag.contextElement.getParent();
										return TableSettings.showColumnsPanel(oMDCTable);
									},
									changeOnRelevantContainer: true
								}
							}
						};
					}
					return {
						actions: null
					};
				}

			}
		}
	};

}, /* bExport= */false);
