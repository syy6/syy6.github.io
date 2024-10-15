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
	 * Change handler for adding a group element in a SmartForm group.
	 *
	 * @author SAP SE
	 * @version 1.60.35
	 * @experimental
	 */
	var DATAFIELD = "com.sap.vocabularies.UI.v1.DataField";
	var IMPORTANCE = "com.sap.vocabularies.UI.v1.Importance";
	var IMPORTANCEHIGH = "com.sap.vocabularies.UI.v1.ImportanceType/High";
	var FIELDGROUP = "com.sap.vocabularies.UI.v1.FieldGroup";
	var AddGroupElement = {};

	var fnHandleSpecificAddAction = function (oChange, oSpecificChangeInfo, mPropertyBag) {
		var oEntityType = {};
		var oAnnotations = {};
		var oAnnotationsOld = {};
		var sAnnotation = "";
		var aDataFields = [];
		var mContent = {};
		var mChanges = {};
		var oGroup = mPropertyBag.modifier.bySelector(oSpecificChangeInfo.parentId, mPropertyBag.appComponent);
		var oMetaModel = Utils.getMetaModel(oSpecificChangeInfo, mPropertyBag);
		var oTemplData = Utils.getTemplatingInfo(oGroup);

		oEntityType = oMetaModel.getODataEntityType(oTemplData.target);
		sAnnotation = (oTemplData.value.indexOf("/") > 0) ? oTemplData.value.split("/")[1].substr(1) : oTemplData.value.substr(1);
		oAnnotations = oEntityType[sAnnotation];
		oAnnotationsOld = JSON.parse(JSON.stringify(oAnnotations));
		aDataFields = (sAnnotation.indexOf(FIELDGROUP) >= 0) ? oAnnotations.Data : oAnnotations;
		var oNewFieldProperty = oEntityType.property.find(function(obj) {
			return obj.name === oSpecificChangeInfo.bindingPath;
		});
		var oNewField = {
				Value: {
					Path: oSpecificChangeInfo.bindingPath
				},
				RecordType: DATAFIELD,
				EdmType: oNewFieldProperty && oNewFieldProperty.type
			};
		oNewField[IMPORTANCE] = {
				EnumMember: IMPORTANCEHIGH
		};
		aDataFields.splice(oSpecificChangeInfo.index, 0, oNewField);

		mContent = AnnotationChangeUtils.createCustomAnnotationTermChange(oTemplData.target, oAnnotations , oAnnotationsOld , sAnnotation);
		mChanges = AnnotationChangeUtils.createCustomChanges(mContent);
		jQuery.extend(true, oChange.getContent(), mChanges);
	};

	AddGroupElement.applyChange = function (oChange, oControl, mPropertyBag) {
	};

	AddGroupElement.completeChangeContent = function (oChange, oSpecificChangeInfo, mPropertyBag) {
		oSpecificChangeInfo.custom = {};
		oSpecificChangeInfo.custom.fnGetAnnotationIndex = Utils.getIndexFromInstanceMetadataPath;
		fnHandleSpecificAddAction(oChange, oSpecificChangeInfo, mPropertyBag);
	};
	return AddGroupElement;
},
/* bExport= */true);
