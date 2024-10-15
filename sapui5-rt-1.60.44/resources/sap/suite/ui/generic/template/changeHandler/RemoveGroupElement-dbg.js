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
	 * Change handler for removing a form group element.
	 *
	 * @author SAP SE
	 * @version 1.60.35
	 * @experimental
	 */
	var FIELDGROUP = "com.sap.vocabularies.UI.v1.FieldGroup";
	var oRemovedElement = {};
	var RemoveGroupElement = {};

	var fnHandleSpecificRemoveAction = function(oChange, oSpecificChangeInfo, mPropertyBag){
		var sRemovedElementId = "";
		var oMetaModel = {};
		var oEntityType = {};
		var oAnnotations = {};
		var oAnnotationsOld = {};
		var sAnnotation = "";
		var aDataFields = [];
		var iAnnotationIndex = -1;
		var mContent = {};
		var mChanges = {};
		var oTemplData = {};

		oMetaModel = Utils.getMetaModel(oSpecificChangeInfo, mPropertyBag);
		sRemovedElementId = oSpecificChangeInfo.removedElement.id;
		oRemovedElement = mPropertyBag.modifier.bySelector(sRemovedElementId, mPropertyBag.appComponent);
		oTemplData = Utils.getTemplatingInfo(oRemovedElement);
		oEntityType = oMetaModel.getODataEntityType(oTemplData.target);
		sAnnotation = oTemplData.annotation;
		oAnnotations = oEntityType[sAnnotation];
		oAnnotationsOld = JSON.parse(JSON.stringify(oAnnotations));
		aDataFields = (sAnnotation.indexOf(FIELDGROUP) >= 0) ? oAnnotations.Data : oAnnotations;
		iAnnotationIndex = oSpecificChangeInfo.custom.fnGetAnnotationIndex(oRemovedElement);
		aDataFields.splice(iAnnotationIndex, 1);
		mContent = AnnotationChangeUtils.createCustomAnnotationTermChange(oTemplData.target, oAnnotations , oAnnotationsOld , sAnnotation);
		mChanges = AnnotationChangeUtils.createCustomChanges(mContent);
		jQuery.extend(true, oChange.getContent(), mChanges);
	};

	RemoveGroupElement.applyChange = function (oChange, oControl, mPropertyBag) {
		var oFormGroup = mPropertyBag.modifier.getParent(oRemovedElement);
		mPropertyBag.modifier.removeAggregation(oFormGroup, "formElements", oRemovedElement);
	};

	RemoveGroupElement.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
		oSpecificChangeInfo.custom = {};
		oSpecificChangeInfo.custom.fnGetAnnotationIndex = Utils.getIndexFromInstanceMetadataPath;
		fnHandleSpecificRemoveAction(oChange, oSpecificChangeInfo, mPropertyBag);
	};

	return RemoveGroupElement;
},
/* bExport= */true);
