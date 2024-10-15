/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
		"jquery.sap.global",
		"sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils",
		"sap/suite/ui/generic/template/changeHandler/util/AnnotationChangeUtilsV2",
		"sap/ui/fl/changeHandler/MoveControls",
		"sap/suite/ui/generic/template/changeHandler/generic/MoveElements"
	], function(
	jQuery,
	Utils,
	AnnotationChangeUtils,
	MoveControls,
	MoveElements
	) {
		"use strict";

		/**
		 * Change handler for moving a toolbar action.
		 *
		 * @alias sap.suite.ui.generic.template.changeHandler.MoveToolbarActionButtons
		 * @author SAP SE
		 * @version 1.60.35
		 * @experimental
		 */
		var MoveToolbarActionButtons = {};

		var LINEITEM = "com.sap.vocabularies.UI.v1.LineItem";

		MoveToolbarActionButtons.applyChange = function (oChange, oControl, mPropertyBag) {
			// do whatever the original change does
			MoveControls.applyChange(oChange, oControl, mPropertyBag);
		};

		MoveToolbarActionButtons.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
			oSpecificChangeInfo.custom = {};
			oSpecificChangeInfo.custom.annotation = LINEITEM;
			oSpecificChangeInfo.custom.fnGetAnnotationIndex = Utils.getLineItemRecordIndexForButton;
			oSpecificChangeInfo.custom.MoveConcreteElement = MoveControls;
			MoveElements.completeChangeContent(oChange, oSpecificChangeInfo, mPropertyBag);
		};

		return MoveToolbarActionButtons;
	},
	/* bExport= */true);
