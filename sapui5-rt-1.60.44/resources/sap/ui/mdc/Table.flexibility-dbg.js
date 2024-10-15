/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([], function() {
	"use strict";
	// TODO: consider to generalize this and possible move some parts to a BaseFlex file
	return {
		"hideControl": "default",
		"unhideControl": "default",
		"removeMDCColumn": {
			"changeHandler": {
				applyChange: function(oChange, oControl, mPropertyBag) {
					var oModifier = mPropertyBag.modifier;
					var oChangeContent = oChange.getContent();
					var oControlSelector = oModifier.getSelector(oChangeContent.id.replace("-innerColumn", ""), mPropertyBag.appComponent);
					var oMDCColumn = oModifier.bySelector(oControlSelector, mPropertyBag.appComponent, mPropertyBag.view);
					var iIndex = oModifier.findIndexInParentAggregation(oMDCColumn);
					oModifier.removeAggregation(oControl, "columns", oMDCColumn);
					// Set revert data on the change
					oChange.setRevertData({
						id: oChangeContent.id,
						controlSelector: oControlSelector,
						index: iIndex
					});
				},
				completeChangeContent: function(oChange, mChangeSpecificInfo, mPropertyBag) {
					oChange.setContent(mChangeSpecificInfo.removedElement);
				},
				revertChange: function(oChange, oControl, mPropertyBag) {
					var oModifier = mPropertyBag.modifier;
					var oRevertData = oChange.getRevertData();
					var oControlSelector = oRevertData.controlSelector;
					var oMDCColumn = oModifier.bySelector(oControlSelector, mPropertyBag.appComponent, mPropertyBag.view);
					oModifier.insertAggregation(oControl, "columns", oMDCColumn, oRevertData.index);
					// Clear the revert data on the change
					oChange.resetRevertData();
				}
			},
			"layers": {
				"USER": true
			}
		},
		"addMDCColumn": { // TODO: consider to generalize this and possible move some parts to a BaseFlex file
			"changeHandler": {
				applyChange: function(oChange, oControl, mPropertyBag) {
					var oModifier = mPropertyBag.modifier;
					var oChangeContent = oChange.getContent();
					var sId = oModifier.getControlIdBySelector(oChange.getSelector()) + "--" + oChangeContent.name;
					var oMDCColumn = oModifier.createControl("sap.ui.mdc.Column", mPropertyBag.appComponent, mPropertyBag.view, sId, {
						header: oChangeContent.label || oChangeContent.name,
						dataProperties: [
							oChangeContent.name
						]
					});
					var aColumns = oModifier.getAggregation(oControl, "columns");
					oModifier.insertAggregation(oControl, "columns", oMDCColumn, aColumns.length);
					// Set revert data on the change
					oChange.setRevertData({
						id: oChangeContent.id,
						column: sId
					});
				},
				completeChangeContent: function(oChange, mChangeSpecificInfo, mPropertyBag) {
					// TODO
				},
				revertChange: function(oChange, oControl, mPropertyBag) {
					var oModifier = mPropertyBag.modifier;
					var oRevertData = oChange.getRevertData();
					var oControlSelector = oModifier.getSelector(oRevertData.column, mPropertyBag.appComponent);
					var oMDCColumn = oModifier.bySelector(oControlSelector, mPropertyBag.appComponent, mPropertyBag.view);
					oModifier.removeAggregation(oControl, "columns", oMDCColumn);
					// Clear the revert data on the change
					oChange.resetRevertData();
				}
			},
			"layers": {
				"USER": true
			}
		}
	};
}, /* bExport= */false);
