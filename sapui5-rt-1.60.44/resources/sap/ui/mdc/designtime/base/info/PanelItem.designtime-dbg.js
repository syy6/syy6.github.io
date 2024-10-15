/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

// Provides the Design Time Metadata for the sap.ui.mdc.base.info.ILinkHandler
sap.ui.define([], function() {
	"use strict";

	return {
		// RTA mode
		domRef: function(oPanelItem) {
			// TODO for overlay determination in RTA mode
			// jQuery.find();
		},
		name: {
			singular: "", // key of designtime ResourceBundle
			plural: ""
		},
		// RTA mode
		actions: {
			remove: function(oPanelItem) {
				//if not isMain
				return {
					changeType: "removeLink"
				};
			},
			reveal: {
				changeType: "addLink"
			}
		}
	};

}, /* bExport= */false);
