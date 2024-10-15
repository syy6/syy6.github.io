/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define(
	["sap/base/Log"],
	function(Log) {
		"use strict";

		var AnnotationHelper = {
			/* this helper can be activated to debug template processing
			 debug: function (oContext) {
			 //debugger;
			 },
			 */

			/*
			 getUI5Type : function(oInterface, sEntitySet, sFilterItemPath){
			 var oMetaModel = oInterface.getInterface(0).getModel();
			 if (typeof sFilterItemPath === 'object'){
			 // we need to get the filterItem name via @sapui.name
			 sFilterItemPath = oMetaModel.getObject(oInterface.getInterface(1).getPath() + '@sapui.name');
			 }

			 return oMetaModel.getUI5Type("/" + sEntitySet + "/" + sFilterItemPath).getName();
			 },
			 */
			getNavigationCollection : function(oContext){
				var sEntitySet = oContext.getPath().split("/")[1];
				var sAnnotationPath = oContext.getObject();
				var sNavigationPath = sap.ui.model.odata.v4.AnnotationHelper.getNavigationPath(sAnnotationPath);
				return oContext.getModel().createBindingContext("/" + sEntitySet + "/" + sNavigationPath);
			},

			getLineItemPresentation: function (oParamModel) {
				// TODO: to be discussed with Bernhard - this is only called by the pretemplater
				var mParameter = oParamModel.getObject();
				var oMetaModel = mParameter.metaModel;
				var oModel = oParamModel.getModel();
				var oWorkingContext;
				if (oModel.getProperty("/workingContext")) {
					oWorkingContext = oModel.getProperty("/workingContext");
				} else {
					oWorkingContext = AnnotationHelper._getWorkingContext(oMetaModel, mParameter.entitySet, undefined);
					oModel.setProperty("/workingContext", oWorkingContext);
				}
				return oMetaModel.getMetaContext(oWorkingContext.lineItemPath);
			},

			getChartPresentation: function (oParamModel) {
				var mParameter = oParamModel.getObject();
				var oMetaModel = mParameter.metaModel;
				var oModel = oParamModel.getModel();
				var oWorkingContext;
				if (oModel.getProperty("/workingContext")) {
					oWorkingContext = oModel.getProperty("/workingContext");
				} else {
					oWorkingContext = AnnotationHelper._getWorkingContext(oMetaModel, mParameter.entitySet, undefined);
					oModel.setProperty("/workingContext", oWorkingContext);
				}
				return oMetaModel.getMetaContext(oWorkingContext.chartPath);
			},

			_getWorkingContext: function (oMetaModel, sEntitySet, sQualifier) {
				var sAnnotationPath,
					oWorkingContext = {},
					selectionPresentationVariant,
					presentationVariant,
					sEntitySetPath = '/' + sEntitySet;

				/* Find SelectionPresentationVariant */
				sAnnotationPath = sEntitySetPath + "/@com.sap.vocabularies.UI.v1.SelectionPresentationVariant" + (sQualifier ? "#" + sQualifier : "");
				oWorkingContext.selectionPresentationVariant = oMetaModel.getObject(sAnnotationPath);
				oWorkingContext.selectionPresentationVariantQualifier = sAnnotationPath.split("#")[1] || "";
				oWorkingContext.selectionPresentationVariantPath = sAnnotationPath;
				selectionPresentationVariant = oWorkingContext.selectionPresentationVariant;
				/* Find PresentationVariant */
				if (selectionPresentationVariant && selectionPresentationVariant.PresentationVariant) {
					if (selectionPresentationVariant.PresentationVariant.$Path) {
						//Path for PV is specified
						sAnnotationPath = sEntitySetPath + "/" + selectionPresentationVariant.PresentationVariant.$Path;
					} else {
						//PV is defined inline and NOT via path
						sAnnotationPath = sAnnotationPath + "/PresentationVariant";
					}
				} else {
					sAnnotationPath = sEntitySetPath + "/@com.sap.vocabularies.UI.v1.PresentationVariant" + (sQualifier ? "#" + sQualifier : "");
				}
				if (typeof sAnnotationPath === "string") {
					oWorkingContext.presentationVariant = oMetaModel.getObject(sAnnotationPath);
					oWorkingContext.presentationVariantPath = sAnnotationPath;
					oWorkingContext.presentationVariantQualifier = sAnnotationPath.split("#")[1] || "";
					presentationVariant = oWorkingContext.presentationVariant;
				}
				/* Determine LineItem and Chart via PV */
				if (presentationVariant && presentationVariant.Visualizations) {
					presentationVariant.Visualizations.forEach(function (visualization) {
						sAnnotationPath = sEntitySetPath + '/' + visualization.$AnnotationPath;
						if (visualization.$AnnotationPath.indexOf("com.sap.vocabularies.UI.v1.LineItem") > -1) {
							oWorkingContext.lineItem = oMetaModel.getObject(sAnnotationPath);
							oWorkingContext.lineItemPath = sAnnotationPath;
							oWorkingContext.lineItemQualifier = sAnnotationPath.split("#")[1] || "";
						}
						if (visualization.$AnnotationPath.indexOf("com.sap.vocabularies.UI.v1.Chart") > -1) {
							oWorkingContext.chart = oMetaModel.getObject(sAnnotationPath);
							oWorkingContext.chartPath = sAnnotationPath;
							oWorkingContext.chartQualifier = sAnnotationPath.split("#")[1] || "";
						}
					});
				}

				/* Fall back to defaults without qualifier */
				if (!oWorkingContext.lineItem) {
					sAnnotationPath = sEntitySetPath + "/@com.sap.vocabularies.UI.v1.LineItem";
					oWorkingContext.lineItem = oMetaModel.getObject(sAnnotationPath);
					oWorkingContext.lineItemPath = sAnnotationPath;
					oWorkingContext.lineItemQualifier = "";
				}
				if (!oWorkingContext.chart) {
					sAnnotationPath = sEntitySetPath + "/@com.sap.vocabularies.UI.v1.Chart";
					oWorkingContext.chart = oMetaModel.getObject(sAnnotationPath);
					oWorkingContext.chartPath = sAnnotationPath;
					oWorkingContext.chartQualifier = "";
				}
				return oWorkingContext;
			},

			replaceSpecialCharsInId: function (sId) {
				if (sId.indexOf(" ") >= 0) {
					Log.error("Annotation Helper: Spaces are not allowed in ID parts. Please check the annotations, probably something is wrong there.");
				}
				return sId.replace(/@/g, "").replace(/\//g, "::").replace(/#/g, "::");
			},
			createBindingForDraftAdminBlock: function(oMetaModel, sEntityType, sFormatter) {
				var sPath = "/" + sEntityType + "/DraftAdministrativeData/";
				return oMetaModel.requestObject(sPath).then(function(oDADEntityType) {
					var sBinding = "{parts: [{path: 'HasDraftEntity', targetType: 'any'}, " +
								//"{path: 'DraftAdministrativeData/LastChangeDateTime'}, " +
								"{path: 'DraftAdministrativeData/InProcessByUser'}, " +
								"{path: 'DraftAdministrativeData/LastChangedByUser'} ";
					if (oDADEntityType.InProcessByUserDescription) {
						sBinding += " ,{path: 'DraftAdministrativeData/InProcessByUserDescription'}";
					}

					if (oDADEntityType.LastChangedByUserDescription) {
						sBinding += ", {path: 'DraftAdministrativeData/LastChangedByUserDescription'}";
					}
					sBinding += "], formatter: '.editFlow." + sFormatter + "'}";
					return sBinding;
				});
			},
			getBindingForDraftAdminBlockInline: function(iContext, sEntityType) {
				return AnnotationHelper.createBindingForDraftAdminBlock(iContext.getModel(), sEntityType, 'formatDraftOwnerTextInline');
			},
			getBindingForDraftAdminBlockInPopover: function(iContext, sEntityType) {
				return AnnotationHelper.createBindingForDraftAdminBlock(iContext.getModel(), sEntityType, 'formatDraftOwnerTextInPopover');
			}

		};

		AnnotationHelper.getLineItemPresentation.requiresIContext = true;
		AnnotationHelper.getChartPresentation.requiresIContext = true;
		AnnotationHelper.getNavigationCollection.requiresIContext = true;
		AnnotationHelper.getBindingForDraftAdminBlockInline.requiresIContext = true;
		AnnotationHelper.getBindingForDraftAdminBlockInPopover.requiresIContext = true;
		// AnnotationHelper.isRequiredInFilter.requiresIContext = true;

		return AnnotationHelper;
	}
, true);
