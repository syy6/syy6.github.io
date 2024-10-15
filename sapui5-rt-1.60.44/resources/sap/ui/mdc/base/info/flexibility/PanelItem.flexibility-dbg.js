/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([], function() {
	"use strict";

	/**
	 * Change handlers for adding and remove of a link in sap.ui.mdc.base.info.PanelItem.
	 *
	 * @constructor
	 * @private
	 * @since 1.60.0
	 * @alias sap.ui.mdc.base.info.flexibility.PanelItem
	 */

	var fnApplyChange = function(bVisible, oChange, oPanelItem, mPropertyBag) {
		// mPropertyBag.modifier.setProperty(oPanelItem, "visibleChangedByUser", oChange.getLayer() === "USER");
		// First store the old value for revert
		oChange.setRevertData(mPropertyBag.modifier.getProperty(oPanelItem, "visible"));
		// Then set the new value
		mPropertyBag.modifier.setProperty(oPanelItem, "visible", bVisible);
	};
	var fnRevertChange = function(bVisible, oChange, oPanelItem, mPropertyBag) {
		mPropertyBag.modifier.setProperty(oPanelItem, "visible", oChange.getRevertData());
		oChange.resetRevertData();
	};
	return {
		createChanges: function(aDeltaMItems) {
			return aDeltaMItems.map(function(oDeltaMItem) {
				return {
					selectorControl: sap.ui.getCore().byId(oDeltaMItem.id),
					changeSpecificData: {
						changeType: oDeltaMItem.visible ? "revealItem" : "hideItem"
					}
				};
			});
		},
		revealItem: {
			layers: {
				USER: true
			},
			changeHandler: {
				applyChange: function(oChange, oPanelItem, mPropertyBag) {
					fnApplyChange(true, oChange, oPanelItem, mPropertyBag);
				},
				revertChange: function(oChange, oPanelItem, mPropertyBag) {
					fnRevertChange(true, oChange, oPanelItem, mPropertyBag);
				},
				completeChangeContent: function(oChange, mSpecificChangeInfo) {
				}
			}
		},
		hideItem: {
			layers: {
				USER: true
			},
			changeHandler: {
				applyChange: function(oChange, oPanelItem, mPropertyBag) {
					fnApplyChange(false, oChange, oPanelItem, mPropertyBag);
				},
				revertChange: function(oChange, oPanelItem, mPropertyBag) {
					fnRevertChange(false, oChange, oPanelItem, mPropertyBag);
				},
				completeChangeContent: function(oChange, mSpecificChangeInfo) {
				}
			}
		}
	};
}, /* bExport= */true);
