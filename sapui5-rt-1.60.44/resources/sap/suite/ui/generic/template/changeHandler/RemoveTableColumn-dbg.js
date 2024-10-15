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
	 * Change handler for removing a table column.
	 *
	 * @alias sap.suite.ui.generic.template.changeHandler.RemoveTableColumn
	 * @author SAP SE
	 * @version 1.60.35
	 */

	var RemoveTableColumn = {};

	var LINEITEM = "com.sap.vocabularies.UI.v1.LineItem";

	RemoveTableColumn.applyChange = function (oChange, oControl, mPropertyBag) {
		RemoveElement.applyChange(oChange, oControl, mPropertyBag);
	};

	RemoveTableColumn.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
		oSpecificChangeInfo.custom = {};
		oSpecificChangeInfo.custom.annotation = LINEITEM;
		oSpecificChangeInfo.custom.fnGetAnnotationIndex = Utils.getLineItemRecordIndex;
		RemoveElement.completeChangeContent(oChange, oSpecificChangeInfo, mPropertyBag);
	};

	return RemoveTableColumn;
},
/* bExport= */true);