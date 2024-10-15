/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils",
	"sap/suite/ui/generic/template/changeHandler/util/AnnotationChangeUtilsV2"
], function(
	jQuery,
	Utils,
	AnnotationChangeUtils
) {
	"use strict";

	/**
	 * Change handler for moving a field group.
	 *
	 * @alias sap.suite.ui.generic.template.changeHandler.MoveGroup
	 * @author SAP SE
	 * @version 1.60.35
	 * @experimental
	 */
	var MoveGroup = {};
	var FACETS = "com.sap.vocabularies.UI.v1.Facets";
	var FIELDGROUP = "com.sap.vocabularies.UI.v1.FieldGroup";
	var IDENTIFICATION = "com.sap.vocabularies.UI.v1.Identification";

	MoveGroup.applyChange = function (oChange, oControl, mPropertyBag) {
	};

	MoveGroup.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
		Utils.isRevert = !Utils.isRevert;
		if (!Utils.isRevert){
			return;
		}
		var sMovedElementId = oSpecificChangeInfo.movedElements[0].id;
		var oGroup = mPropertyBag.modifier.bySelector(sMovedElementId, mPropertyBag.appComponent);

		var sEntityType = Utils.getODataEntitySet(Utils.getComponent(oGroup)).entityType;
		var aFacets = AnnotationChangeUtils.getExistingAnnotationsOfEntityType(oGroup, FACETS);
		var aOldFacets = JSON.parse(JSON.stringify(aFacets));

		// sGroupId corresponds to the ID/ AnnotationPath of the ReferenceFacet of the corresponding Group in SmartForm.
		var sGroupId = (sMovedElementId.split("--")[1]);
		sGroupId = sGroupId.substring(0, sGroupId.lastIndexOf("::"));
		if (sGroupId.indexOf(FIELDGROUP) === 0 || sGroupId.indexOf(IDENTIFICATION) === 0) {
			sGroupId = "@" + sGroupId.replace("::", "#");
		} else {
			sGroupId = sGroupId.replace("::", "/@").replace("::", "#");
		}

		var nGroupSourceIndex = oSpecificChangeInfo.movedElements[0].sourceIndex;
		var nGroupTargetIndex = oSpecificChangeInfo.movedElements[0].targetIndex;

		var oGroupInfo = Utils.getSmartFormGroupInfo(sGroupId, aFacets);
		if (oGroupInfo && oGroupInfo.aForm) {
			oGroupInfo.aForm.splice(nGroupTargetIndex, 0, oGroupInfo.aForm.splice(nGroupSourceIndex, 1)[0]);
			var oTermChange = AnnotationChangeUtils.createCustomAnnotationTermChange(sEntityType, aFacets, aOldFacets, FACETS);
			var mContent = AnnotationChangeUtils.createCustomChanges(oTermChange);
			jQuery.extend(true, oChange.getContent(), mContent);
		}
	};

	return MoveGroup;
},
/* bExport= */true);
