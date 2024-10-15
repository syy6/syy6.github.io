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
	 * Change handler for adding an element.
	 *
	 * @alias sap.suite.ui.generic.template.changeHandler.AddElement
	 * @author SAP SE
	 * @version 1.60.35
	 * @experimental
	 */
	var AddElement = {};

	AddElement.applyChange = function (oChange, oControl, mPropertyBag) {

	};

	AddElement.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
		var sOwningElementId = oSpecificChangeInfo.parentId || oSpecificChangeInfo.selector.id;
		var oOwningElement =  mPropertyBag.modifier.bySelector(sOwningElementId, mPropertyBag.appComponent);
		var oMetaModel = Utils.getMetaModel(oSpecificChangeInfo, mPropertyBag);
		/**
		 *  get relevant element
		 *  example - smart filter bar: get control configuration element based on the added vertical layout (label/field)
		 */
		var oRelevantOwningElement = oSpecificChangeInfo.custom.fnGetRelevantElement ? oSpecificChangeInfo.custom.fnGetRelevantElement(oOwningElement) : oOwningElement;
		var sEntityType = "";
		var oEntityType = {};
		var aAnnotations = [];
		var aAnnotationsOld = [];
		var sAnnotation = "";
		var oTemplData = Utils.getTemplatingInfo(oRelevantOwningElement);
		if (oTemplData && oTemplData.target && oTemplData.annotation) {
			sEntityType = oTemplData.target;
			oEntityType = oMetaModel.getODataEntityType(sEntityType);
			sAnnotation = oTemplData.annotation;
			aAnnotations = oEntityType[sAnnotation];
		} else {
			// no instance-specific metadata exist => data comes from the calling change handler
			sEntityType = Utils.getEntityType(oRelevantOwningElement);
			oEntityType = oMetaModel.getODataEntityType(sEntityType);
			sAnnotation = oSpecificChangeInfo.custom.annotation;
			aAnnotations = oEntityType[sAnnotation];
		}
		aAnnotationsOld = JSON.parse(JSON.stringify(aAnnotations));

		if (oSpecificChangeInfo.custom.fnPerformSpecificAddAction) {
			// for special scenario like sub-sections
			oSpecificChangeInfo.custom.fnPerformSpecificAddAction(oOwningElement, aAnnotations);
		} else if (oSpecificChangeInfo.custom.fnGetAnnotationIndex) {
			var iAnnotationIndex = oSpecificChangeInfo.custom.fnGetAnnotationIndex(oOwningElement, aAnnotations);
			aAnnotations.splice(iAnnotationIndex, 0, oSpecificChangeInfo.custom.oAnnotationTermToBeAdded );
		} else {
			aAnnotations.splice(oSpecificChangeInfo.index, 0, oSpecificChangeInfo.custom.oAnnotationTermToBeAdded);
		}
		// do whatever the original change does (if concrete change handler is passed)
		if (oSpecificChangeInfo.custom.AddConcreteElement) {
			oSpecificChangeInfo.custom.AddConcreteElement.completeChangeContent(oChange, oSpecificChangeInfo, mPropertyBag);
		}

		var mContent = AnnotationChangeUtils.createCustomAnnotationTermChange(sEntityType, aAnnotations, aAnnotationsOld, sAnnotation);
		mContent.parentId = oOwningElement.getId();
		var mChanges = AnnotationChangeUtils.createCustomChanges(mContent);
		jQuery.extend(true, oChange.getContent(), mChanges);
	};
	return AddElement;
},
/* bExport= */true);