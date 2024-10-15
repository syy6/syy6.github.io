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
	 * Change handler for removing a section..
	 *
	 * @alias sap.suite.ui.generic.template.changeHandler.RemoveSection **
	 * @author SAP SE
	 * @version 1.60.35
	 * @experimental
	 */
	var RemoveSection = {};
	var FACETS = "com.sap.vocabularies.UI.v1.Facets";

	RemoveSection.applyChange = function (oChange, oControl, mPropertyBag) {
		RemoveElement.applyChange(oChange, oControl, mPropertyBag);
	};

	RemoveSection.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
		oSpecificChangeInfo.custom = {};
		oSpecificChangeInfo.custom.annotation = FACETS;
		oSpecificChangeInfo.custom.fnGetAnnotationIndex = Utils.getIndexFromInstanceMetadataPath;
		RemoveElement.completeChangeContent(oChange, oSpecificChangeInfo, mPropertyBag);
	};

	return RemoveSection;
},
/* bExport= */true);