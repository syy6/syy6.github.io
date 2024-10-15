/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils",
	"sap/suite/ui/generic/template/changeHandler/generic/RemoveElement"
], function(
	jQuery,
	Utils,
	RemoveElement
) {
	"use strict";
	/**
	 * Change handler for removing a filter item.
	 *
	 * @alias sap.suite.ui.generic.template.changeHandler.RemoveFilterItem
	 * @author SAP SE
	 * @version 1.60.35
	 */

	var RemoveFilterItem = {};

	RemoveFilterItem.applyChange = function (oChange, oControl, mPropertyBag) {
		RemoveElement.applyChange(oChange, oControl, mPropertyBag);
	};

	RemoveFilterItem.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
		oSpecificChangeInfo.custom = {};
		oSpecificChangeInfo.custom.fnGetRelevantElement = Utils.getSmartFilterBarControlConfiguration;
		oSpecificChangeInfo.custom.fnGetAnnotationIndex = Utils.getRecordIndexForSelectionField;
		RemoveElement.completeChangeContent(oChange, oSpecificChangeInfo, mPropertyBag);
	};

	return RemoveFilterItem;
},
/* bExport= */true);