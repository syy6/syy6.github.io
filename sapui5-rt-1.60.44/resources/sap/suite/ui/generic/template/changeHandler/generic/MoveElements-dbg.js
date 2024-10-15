/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils",
	"sap/suite/ui/generic/template/changeHandler/util/AnnotationChangeUtilsV2",
	"sap/ui/fl/changeHandler/MoveControls"
], function(
	jQuery,
	Utils,
	AnnotationChangeUtils,
	MoveControls
) {
	"use strict";
	/**
	 * Generic change handler for moving an elements.
	 *
	 * @alias sap.suite.ui.generic.template.changeHandler.MoveElements
	 * @author SAP SE
	 * @version 1.60.35
	 */

	var MoveElements = {};
	var IMPORTANCE = "com.sap.vocabularies.UI.v1.Importance";
	var IMPORTANCEHIGH = "com.sap.vocabularies.UI.v1.ImportanceType/High";
	var IMPORTANCELOW = "com.sap.vocabularies.UI.v1.ImportanceType/Low";

	MoveElements.applyChange = function (oChange, oControl, mPropertyBag) {
		// default change handler for moving controls
		// TODO: if needed, we could allow passing/calling other change handlers here
		MoveControls.applyChange(oChange, oControl, mPropertyBag);
	};

	MoveElements.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
		// called twice:
		// - first for the change
		// - second for the revert (actually oSpecificChangeInfo.movedElements[0].sourceIndex and oSpecificChangeInfo.movedElements[0].targetIndex are exchanged here)
		Utils.isRevert = !Utils.isRevert;
		if (!Utils.isRevert){
			return;
		}

		var oMetaModel = Utils.getMetaModel(oSpecificChangeInfo, mPropertyBag);
		var oOwningElement = mPropertyBag.modifier.bySelector(oSpecificChangeInfo.source.id, mPropertyBag.appComponent);

		var aElements = oOwningElement.getAggregation(oSpecificChangeInfo.source.aggregation) || (oOwningElement.getActions && oOwningElement.getActions());
		if (!Utils.isReveal) {
			aElements.splice(oSpecificChangeInfo.movedElements[0].sourceIndex, 0, aElements.splice(oSpecificChangeInfo.movedElements[0].targetIndex, 1)[0]);
		}
		var oUISourceElement =  aElements[oSpecificChangeInfo.movedElements[0].sourceIndex];
		var oUITargetElement =  aElements[oSpecificChangeInfo.movedElements[0].targetIndex];

		//START - Object Page Header Action Button
		var iTargetIndex = oSpecificChangeInfo.movedElements[0].targetIndex;
		var iEditIndex, iDeleteIndex, iRelatedAppsIndex;
		aElements.some(function(oEntry, i) {
			if (oEntry.getId && oEntry.getId().indexOf("--edit") > 0) {
				iEditIndex = i;
			}
			if (oEntry.getId && oEntry.getId().indexOf("--delete") > 0) {
				iDeleteIndex = i;
			}
			if (oEntry.getId && oEntry.getId().indexOf("--relatedApps") > 0) {
				iRelatedAppsIndex = i;
			}
		});
		// END

		var oRelevantSourceElement = oUISourceElement;
		//var oRelevantTargetElement = oUITargetElement; // not needed so far
		/*
		 * for some cases (e.g. smart filter bar), we need to map the UI element (e.g. VerticalLayout)
		 * to the technically relevant element (e.g. controlConfiguration) holding the annotation-relevant information
		 */
		if (oSpecificChangeInfo.custom.fnGetRelevantElement) {
			oRelevantSourceElement = oSpecificChangeInfo.custom.fnGetRelevantElement(oUISourceElement);
			//oRelevantTargetElement = oSpecificChangeInfo.custom.fnGetRelevantElement(oUITargetElement);
		}

		var mContent = {};
		var sEntityType = "";
		var oEntityType = {};
		var aAnnotations = [];
		var aAnnotationsOld = [];
		var sAnnotation = "";
		var oTemplData = Utils.getTemplatingInfo(oRelevantSourceElement);
		if (oTemplData && oTemplData.target && oTemplData.annotation) {
			sEntityType = oTemplData.target;
			oEntityType = oMetaModel.getODataEntityType(sEntityType);
			sAnnotation = oTemplData.annotation;
			aAnnotations = oEntityType[sAnnotation];
		} else {
			// no instance-specific metadata exist => data comes from the calling change handler
			sEntityType = Utils.getEntityType(oOwningElement);
			oEntityType = oMetaModel.getODataEntityType(sEntityType);
			sAnnotation = oSpecificChangeInfo.custom.annotation;
			aAnnotations = oEntityType[sAnnotation];
		}
		aAnnotationsOld = aAnnotations.slice();

		// setOrder is needed for table column
		// TODO try to find better solution than this if-statement
		if (oUISourceElement.setOrder) {
			oUISourceElement.setOrder(oSpecificChangeInfo.movedElements[0].targetIndex);
		}

		var iAnnotationSourceIndex = oSpecificChangeInfo.custom.fnGetAnnotationIndex(oUISourceElement, aAnnotations);
		var iAnnotationTargetIndex = oSpecificChangeInfo.custom.fnGetAnnotationIndex(oUITargetElement, aAnnotations);

		// START Object Page Header Action Button
		var iIndex = iEditIndex || iDeleteIndex || iRelatedAppsIndex;
		if (iIndex) {
			if (iTargetIndex < iIndex) {
				aAnnotations[iAnnotationSourceIndex][IMPORTANCE] = {
					EnumMember: IMPORTANCEHIGH
				};
			} else {
				aAnnotations[iAnnotationSourceIndex][IMPORTANCE] = {
					EnumMember: IMPORTANCELOW
				};
			}
		}
		// END

		if (Utils.isReveal) {
			Utils.isReveal = false;
		} else {
			aElements.splice(oSpecificChangeInfo.movedElements[0].targetIndex, 0, (aElements.splice(oSpecificChangeInfo.movedElements[0].sourceIndex, 1))[0]);
		}
		aAnnotations.splice(iAnnotationTargetIndex, 0, aAnnotations.splice(iAnnotationSourceIndex, 1)[0]);

		if (oSpecificChangeInfo.custom.MoveConcreteElement) {
			// do whatever the original change does (if concrete change handler is passed)
			oSpecificChangeInfo.custom.MoveConcreteElement.completeChangeContent(oChange, oSpecificChangeInfo, mPropertyBag);
		}
		if (iAnnotationSourceIndex >= 0 && iAnnotationTargetIndex >= 0) {
			var mContent = AnnotationChangeUtils.createCustomAnnotationTermChange(sEntityType, aAnnotations, aAnnotationsOld, sAnnotation);
			var mChanges = AnnotationChangeUtils.createCustomChanges(mContent);
			jQuery.extend(true, oChange.getContent(), mChanges);
		}
	};

	return MoveElements;
},
/* bExport= */true);
