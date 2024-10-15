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
	 * Change handler for moving a form group element.
	 *
	 * @author SAP SE
	 * @version 1.60.35
	 * @experimental
	 */
	var FIELDGROUP = "com.sap.vocabularies.UI.v1.FieldGroup";
	var DATAFIELD = "com.sap.vocabularies.UI.v1.DataField";
	var MoveGroupElement = {};

	var fnHandleSpecificMoveAction = function(oChange, oSpecificChangeInfo, mPropertyBag){

		Utils.isRevert = !Utils.isRevert;
		if (!Utils.isRevert){
			return;
		}
		var oRemovedRecord = [], mChanges = {}, oSourceGroup = {}, oTemplDataSource = {},
			oSourceEntityType = {}, sSourceAnnotation = "", oSourceAnnotations = {},
			oSourceAnnotationsOld = {}, aSourceDataFields = [], mContent = {}, oMetaModel = {};

		oMetaModel = Utils.getMetaModel(oSpecificChangeInfo, mPropertyBag);
		oSourceGroup = mPropertyBag.modifier.bySelector(oSpecificChangeInfo.source.id, mPropertyBag.appComponent);
		oTemplDataSource = Utils.getTemplatingInfo(oSourceGroup);
		oSourceEntityType = oMetaModel.getODataEntityType(oTemplDataSource.target);
		sSourceAnnotation = (oTemplDataSource.value.indexOf("/") > 0) ? oTemplDataSource.value.split("/")[1].substr(1) : oTemplDataSource.value.substr(1);
		oSourceAnnotations = oSourceEntityType[sSourceAnnotation];
		oSourceAnnotationsOld = JSON.parse(JSON.stringify(oSourceAnnotations));
		aSourceDataFields = (sSourceAnnotation.indexOf(FIELDGROUP) >= 0) ? oSourceAnnotations.Data : oSourceAnnotations;

		if (oSpecificChangeInfo.source.id === oSpecificChangeInfo.target.id) {
			var aFields = [], oUISourceField = {}, iSourceAnnotationIndex = -1,
			oUITargetField = {}, iTargetAnnotationIndex = -1;
			aFields = oSourceGroup.getFormElements();
			aFields.splice(oSpecificChangeInfo.movedElements[0].sourceIndex, 0, aFields.splice(oSpecificChangeInfo.movedElements[0].targetIndex, 1)[0]);
			oUISourceField = aFields[oSpecificChangeInfo.movedElements[0].sourceIndex];
			iSourceAnnotationIndex  = oSpecificChangeInfo.custom.fnGetAnnotationIndex(oUISourceField);
			oUITargetField = aFields[oSpecificChangeInfo.movedElements[0].targetIndex];
			iTargetAnnotationIndex = oSpecificChangeInfo.custom.fnGetAnnotationIndex(oUITargetField);

			aFields.splice(oSpecificChangeInfo.movedElements[0].targetIndex, 0, (aFields.splice(oSpecificChangeInfo.movedElements[0].sourceIndex, 1))[0]);
			aSourceDataFields.splice(iTargetAnnotationIndex, 0, aSourceDataFields.splice(iSourceAnnotationIndex, 1)[0]);

			mContent = AnnotationChangeUtils.createCustomAnnotationTermChange(oTemplDataSource.target, oSourceAnnotations , oSourceAnnotationsOld , sSourceAnnotation);
			mChanges = AnnotationChangeUtils.createCustomChanges(mContent);

		} else {
			var oTargetGroup = {}, oTemplDataTarget = {},
			oTargetEntityType = {}, sTargetAnnotation = "",
			oTargetAnnotations = {}, oTargetAnnotationsOld = {},
			aTargetDataFields = [], oUIField = {};

			oTargetGroup = mPropertyBag.modifier.bySelector(oSpecificChangeInfo.target.id, mPropertyBag.appComponent);
			oTemplDataTarget = Utils.getTemplatingInfo(oTargetGroup);
			oTargetEntityType = oMetaModel.getODataEntityType(oTemplDataTarget.target);
			sTargetAnnotation = (oTemplDataTarget.value.indexOf("/") > 0) ? oTemplDataTarget.value.split("/")[1].substr(1) : oTemplDataTarget.value.substr(1);
			oTargetAnnotations = oTargetEntityType[sTargetAnnotation];
			oTargetAnnotationsOld = JSON.parse(JSON.stringify(oTargetAnnotations));
			aTargetDataFields = (sTargetAnnotation.indexOf(FIELDGROUP) >= 0) ? oTargetAnnotations.Data : oTargetAnnotations;

			oUIField = mPropertyBag.modifier.bySelector(oSpecificChangeInfo.movedElements[0].id, mPropertyBag.appComponent);
			iSourceAnnotationIndex = oSpecificChangeInfo.custom.fnGetAnnotationIndex(oUIField);
			if (aSourceDataFields.length === 1) {// If there is only one DataField in the source group, after moving that field, a blank field should be added.
				var oBlankField = 	{
							"RecordType": DATAFIELD
								};
				oRemovedRecord = aSourceDataFields.splice(iSourceAnnotationIndex, 1, oBlankField);
			} else {
				oRemovedRecord = aSourceDataFields.splice(iSourceAnnotationIndex, 1);	// Removed from source index
			}
			if (oTemplDataSource.target !== oTemplDataTarget.target) { // Moved to a group defined under different entity set.
				if (oRemovedRecord[0] && oRemovedRecord[0].Target && oRemovedRecord[0].Target.AnnotationPath && oRemovedRecord[0].Target.AnnotationPath.indexOf("/") > 0 ) {
					oRemovedRecord[0].Target.AnnotationPath =  oRemovedRecord[0].Target.AnnotationPath.substr(oRemovedRecord[0].Target.AnnotationPath.indexOf("/") + 1);
				}
			}
			if (oSpecificChangeInfo.movedElements[0].targetIndex > 0) { //Field moved to an existing FieldGroup. Find preceding element to the target index and add field after it.
				oUITargetField = oTargetGroup.getFormElements()[oSpecificChangeInfo.movedElements[0].targetIndex - 1];
				iTargetAnnotationIndex = oSpecificChangeInfo.custom.fnGetAnnotationIndex(oUITargetField);
				aTargetDataFields.splice(iTargetAnnotationIndex + 1, 0, oRemovedRecord[0]);
			} else {
				aTargetDataFields.splice(0, 0, oRemovedRecord[0]);
			}
			mChanges = {
				customChanges: []
			};
			var oSourceTermChange = AnnotationChangeUtils.createCustomAnnotationTermChange(oTemplDataSource.target, oSourceAnnotations, oSourceAnnotationsOld, sSourceAnnotation);
			var oTargetTermChange = AnnotationChangeUtils.createCustomAnnotationTermChange(oTemplDataTarget.target, oTargetAnnotations, oTargetAnnotationsOld, sTargetAnnotation);
			mChanges.customChanges.push(oSourceTermChange);
			mChanges.customChanges.push(oTargetTermChange);
		}
		jQuery.extend(true, oChange.getContent(), mChanges);
	};

	MoveGroupElement.applyChange = function (oChange, oControl, mPropertyBag) {
	};

	MoveGroupElement.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
		oSpecificChangeInfo.custom = {};
		oSpecificChangeInfo.custom.fnGetAnnotationIndex = Utils.getIndexFromInstanceMetadataPath;
		fnHandleSpecificMoveAction(oChange, oSpecificChangeInfo, mPropertyBag);
	};

	return MoveGroupElement;
},
/* bExport= */true);
