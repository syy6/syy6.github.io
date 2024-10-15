/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */
sap.ui.define(["sap/ui/mdc/odata/v4/CommonHelper", "sap/ui/mdc/ResourceModel", "sap/ui/model/odata/v4/AnnotationHelper"], function(commonHelper, ResourceModel, oDataAnnotationHelper) {
	"use strict";

	/**
	 * Helper class used by MDC controls for OData(V4) specific handling
	 *
	 * @private
	 * @experimental This module is only for internal/experimental use!
	 */
	var FieldHelper = {
		buildExpressionForCriticalityIcon: function (sCriticalityProperty) {
			if (sCriticalityProperty) {
				var sExpression = "{= (${" + sCriticalityProperty + "} === 'com.sap.vocabularies.UI.v1.CriticalityType/Negative') || (${" + sCriticalityProperty + "} === '1') || (${" + sCriticalityProperty + "} === 1) ? 'sap-icon://status-negative' : " +
					"(${" + sCriticalityProperty + "} === 'com.sap.vocabularies.UI.v1.CriticalityType/Critical') || (${" + sCriticalityProperty + "} === '2') || (${" + sCriticalityProperty + "} === 2) ? 'sap-icon://status-critical' : " +
					"(${" + sCriticalityProperty + "} === 'com.sap.vocabularies.UI.v1.CriticalityType/Positive') || (${" + sCriticalityProperty + "} === '3') || (${" + sCriticalityProperty + "} === 3) ? 'sap-icon://status-positive' : " +
					"'sap-icon://status-inactive' }";

				return sExpression;
			}
		},

		buildExpressionForCriticalityColor: function (sCriticalityProperty) {
			if (sCriticalityProperty) {
				var sExpression = "{= (${" + sCriticalityProperty + "} === 'com.sap.vocabularies.UI.v1.CriticalityType/Negative') || (${" + sCriticalityProperty + "} === '1') || (${" + sCriticalityProperty + "} === 1) ? 'Error' : " +
					"(${" + sCriticalityProperty + "} === 'com.sap.vocabularies.UI.v1.CriticalityType/Critical') || (${" + sCriticalityProperty + "} === '2') || (${" + sCriticalityProperty + "} === 2) ? 'Warning' : " +
					"(${" + sCriticalityProperty + "} === 'com.sap.vocabularies.UI.v1.CriticalityType/Positive') || (${" + sCriticalityProperty + "} === '3') || (${" + sCriticalityProperty + "} === 3) ? 'Success' : " +
					"'None' }";

				return sExpression;
			}
		},

		buildExpressionForTextValue: function (sPropertyPath, oDataField) {
			var oMetaModel = oDataField.context.getModel(),
				sPath = oDataField.context.getPath(),
				oTextAnnotation = oMetaModel.getObject(sPath + "@com.sap.vocabularies.Common.v1.Text"),
				sTextExpression = oTextAnnotation ? oDataAnnotationHelper.value(oTextAnnotation, oDataField) : "",
				sExpression = "";

			sPropertyPath = oDataAnnotationHelper.getNavigationPath(sPropertyPath);
			if (sPropertyPath.indexOf('/') > -1 && sTextExpression) {
				sExpression = "{" + sPropertyPath.substr(0, sPropertyPath.indexOf('/') + 1) + sTextExpression.substr(1, sTextExpression.length - 2) + "}";
			} else {
				sExpression = sTextExpression;
			}
			if (sExpression){
				// TODO: this is just a workaround for now as the mdc field updates the additionalValue as well
				// as we want to avoid this we define it as a one-way-binding
				sExpression =  "{ path : '" +  sExpression.substr(1, sExpression.length - 2) + "', mode : 'OneWay'}";
			}

			return sExpression;
		},

		getStableIdPartFromDataField: function (oDataField, mParameter) {
			var sPathConcat = "", sIdPart = "";
			if (oDataField.$Type && oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
				return commonHelper.replaceSpecialCharsInId(oDataField.Action);
			} else if (oDataField.$Type && (oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" || oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation")) {
				if (typeof oDataField.SemanticObject == "string") {
					sIdPart = commonHelper.replaceSpecialCharsInId(oDataField.SemanticObject);
				} else if (oDataField.SemanticObject.$Path) {
					sIdPart = commonHelper.replaceSpecialCharsInId(oDataField.SemanticObject.$Path);
				}
				if (typeof oDataField.Action == "string") {
					sIdPart = sIdPart + "::" + commonHelper.replaceSpecialCharsInId(oDataField.Action);
				} else if (oDataField.Action && oDataField.Action.$Path) {
					sIdPart = sIdPart + "::" + commonHelper.replaceSpecialCharsInId(oDataField.Action.$Path);
				}
				return sIdPart;
			} else if (oDataField.$Type && oDataField.$Type === "com.sap.vocabularies.UI.v1.DataFieldForAnnotation") {
				return commonHelper.replaceSpecialCharsInId(oDataField.Target.$AnnotationPath);
			} else if (oDataField.Value && oDataField.Value.$Path) {
				return commonHelper.replaceSpecialCharsInId(oDataField.Value.$Path);
			} else if (oDataField.Value && oDataField.Value.$Apply && oDataField.Value.$Function === "odata.concat") {
				for (var i = 0; i < oDataField.Value.$Apply.length; i++) {
					if (oDataField.Value.$Apply[i].$Path) {
						if (sPathConcat) {
							sPathConcat = sPathConcat + "::";
						}
						sPathConcat = sPathConcat + commonHelper.replaceSpecialCharsInId(oDataField.Value.$Apply[i].$Path);
					}
				}
				return sPathConcat;
			} else if (mParameter && mParameter.context && mParameter.context.getObject("@sapui.name")) {
				// the context is not refering to da data field but directly to a property, return the property name
				return commonHelper.replaceSpecialCharsInId(mParameter.context.getObject("@sapui.name"));
			} else {
				// In case of a string or unknown property
				jQuery.sap.log.error("Annotation Helper: Unable to create a stable ID. Please check the annotations.");
			}
		},

		isNotAlwaysHidden : function (oDataField, oDetails) {
			var oContext = oDetails.context,
				isAlwaysHidden = false;
			if (oDataField.Value && oDataField.Value.$Path) {
				isAlwaysHidden = oContext.getObject("Value/$Path@com.sap.vocabularies.UI.v1.Hidden");
			}
			if (!isAlwaysHidden || isAlwaysHidden.$Path) {
				isAlwaysHidden = oContext.getObject("@com.sap.vocabularies.UI.v1.Hidden");
				if (!isAlwaysHidden || isAlwaysHidden.$Path) {
					isAlwaysHidden = false;
				}
			}
			return !isAlwaysHidden;
		},

		isSemanticKey: function (oContext, oValue) {
				var sEntity = oContext.getPath().split('/')[1];
				var aSemanticKeys = oContext.getModel().getObject("/" + sEntity + "/@com.sap.vocabularies.Common.v1.SemanticKey");
				if (aSemanticKeys) {
					for (var i = 0; i < aSemanticKeys.length; i++) {
						if (aSemanticKeys[i].$PropertyPath === oValue.$Path) {
							return true;
						}
					}
				}
			return false;
		},
		getEditMode: function (oContext, oProperty, sDataFieldType,oDraftRoot) {
			var sPath = oContext.getPath(0);
			var oModel = oContext.getModel(0);
			var bComputed , bImmutable , sFieldControl, bReadOnly, sIsEditableExpression, sExpression, sCheckUiEditMode, bCanCreateProperty, sIsFieldControlPathReadOnly;
			if (sDataFieldType === "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation" || sDataFieldType === "com.sap.vocabularies.UI.v1.DataFieldWithUrl") {
				return 'Display';
			}
			if (oModel.getObject(sPath + "@Org.OData.Core.V1.Computed")){
				bComputed = oModel.getObject(sPath + "@Org.OData.Core.V1.Computed/Bool") ?  oModel.getObject(sPath + "@Org.OData.Core.V1.Computed/Bool") : true ;
			}
			if (oModel.getObject(sPath + "@Org.OData.Core.V1.Immutable")) {
				bImmutable = oModel.getObject(sPath + "@Org.OData.Core.V1.Immutable/Bool") ?  oModel.getObject(sPath + "@Org.OData.Core.V1.Immutable/Bool") : true ;
			}
			bReadOnly = (bComputed == true || bImmutable == true);
			var canCreateProperty = function(bComputed,bImmutable){
				if (bComputed) {//computed is stronger then immutable and implies immutable
					return bComputed == "false";
				}
				if (bImmutable) {
					return  bImmutable == "true";
				}
				return true;
			};
			bCanCreateProperty = canCreateProperty(bComputed,bImmutable);
			if (oModel.getObject(sPath + "@com.sap.vocabularies.Common.v1.FieldControl")) {
				if (oModel.getObject(sPath + "@com.sap.vocabularies.Common.v1.FieldControl/$Path")) {
					var oFieldControl = oModel.getObject(sPath + "@com.sap.vocabularies.Common.v1.FieldControl");
					var oFieldControlContext = oModel.createBindingContext(sPath + "@com.sap.vocabularies.Common.v1.FieldControl");
				    sIsFieldControlPathReadOnly = "($" + oDataAnnotationHelper.value(oFieldControl, {context: oFieldControlContext}) +
					" === 1 ? false : true)";	
				}  else if (oModel.getObject(sPath + "@com.sap.vocabularies.Common.v1.FieldControl/$EnumMember")) {
					sFieldControl = oModel.getObject(sPath + "@com.sap.vocabularies.Common.v1.FieldControl/$EnumMember");
					bReadOnly = (bReadOnly || sFieldControl == "com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly");
				}
			}
			if (bReadOnly) {
				if (!bCanCreateProperty || !oDraftRoot) {
					return 'Display';
				}else {
					return "{= !${IsActiveEntity} && !${HasActiveEntity} ? 'Editable' : 'Display'}";
				}
			}
			sCheckUiEditMode = "${ui>/editable} ? 'Editable' : 'Display'";
			sIsEditableExpression = sIsFieldControlPathReadOnly ? "(" + sIsFieldControlPathReadOnly + "&&" + sCheckUiEditMode + ")" : "(" + sCheckUiEditMode + ")";
			sExpression = bCanCreateProperty || !oDraftRoot ? "{= " + sIsEditableExpression + "}" : "{= !${IsActiveEntity} && !${HasActiveEntity} ? 'Display' : " + sIsEditableExpression + "}";
			return  sExpression;
		},
		isLineItem:function(oProperty,oInterface){
			if (oInterface.context.getPath().indexOf("@com.sap.vocabularies.UI.v1.LineItem") > -1) {
				return true;
		}
		return false;
	},
	getRequiredForDataField: function (oFieldControl, oInterface) {
		if (oFieldControl !== undefined) {
			if (oFieldControl.$EnumMember && oFieldControl.$EnumMember === "com.sap.vocabularies.Common.v1.FieldControlType/Mandatory") {
				return true;
			} else if (oFieldControl.$Path) {
					var sExpression = "{= $" +  oDataAnnotationHelper.value(oFieldControl,{context:oInterface.context}) + " === 7 ? true : false}";
				 return sExpression;
			}
		} else {
			return false;
		}
	}
	};

	FieldHelper.isSemanticKey.requiresIContext = true;
	FieldHelper.buildExpressionForTextValue.requiresIContext = true;
	FieldHelper.getEditMode.requiresIContext = true;
	FieldHelper.getRequiredForDataField.requiresIContext = true;

	return FieldHelper;

}, /* bExport= */ true);
