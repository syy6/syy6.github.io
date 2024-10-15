/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
// Provides the design time metadata for the sap.suite.ui.generic.template.ObjectPage component

// load flexibility utils and designtime library, including resource bundle
sap.ui.define([
	"sap/suite/ui/generic/template/designtime/library.designtime",
	"sap/suite/ui/generic/template/designtime/SmartForm.designtime",
	"sap/suite/ui/generic/template/designtime/Group.designtime",
	"sap/suite/ui/generic/template/designtime/ObjectPageLayout.designtime",
	"sap/suite/ui/generic/template/designtime/ObjectPageSection.designtime",
	"sap/suite/ui/generic/template/designtime/GroupElement.designtime",
	"sap/suite/ui/generic/template/designtime/ObjectPageHeader.designtime",
	"sap/suite/ui/generic/template/designtime/ObjectPageHeaderActionButton.designtime",
	"sap/suite/ui/generic/template/designtime/ObjectPageDynamicHeaderTitle.designtime",
	"sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils",
	"sap/suite/ui/generic/template/designtime/utils/DesigntimeUtils"],
	function(lib, SmartForm, Group, ObjectPageLayout, ObjectPageSection, GroupElement, ObjectPageHeader, ObjectPageHeaderActionButton, ObjectPageDynamicHeaderTitle, Utils, DesigntimeUtils) {
		"use strict";

		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();

		/**
		 * Checks the parent control of the UI Element.
		 *
		 * @param {object} oElement The UI5 element (in overlay mode)
		 * @param {string} sParent The name of the parent control
		 * @returns {boolean} Whether sParent is the parent (not necessarily immediate) of the UI5 element.
		 * @public
		 */
		var checkParentControl = function (oElement, sParent) {
			while (oElement) {
				if (oElement.getMetadata().getElementName() === sParent) {
					return true;
				} else if (oElement.getMetadata().getElementName() === 'sap.ui.core.mvc.XMLView') {
					break;
				} else if (oElement.getParent()) {
					oElement = oElement.getParent();
				} else {
					break;
				}
			}
			return false;
		};

		var addFooterActionButtonSettingsHandler = function(oTargetButton, mPropertyBag) {
			var aActions = [];
			if (oTargetButton.getId().indexOf("-template::ObjectPage::FooterToolbar") > -1) {
				aActions = oTargetButton.getContent();
			} else {
				aActions = oTargetButton.getParent().getContent();
			}
			var sChangeHandler = "addFooterActionButton";
			return DesigntimeUtils.addSettingsHandler(oTargetButton, mPropertyBag, aActions, sChangeHandler);
		};

		return {
			'default': {
				controllerExtensionTemplate : "sap/suite/ui/generic/template/designtime/ObjectPageControllerExtensionTemplate"//Template for ObjectPage Extensibility via UI Adaptation Editor tool
			},
			'strict': {		// scope = strict UX compatibility for Fiori Elements.
				name: {
					singular: function() {
						return oResourceBundle.getText("FE_OBJECT_PAGE");
					}
				},
				aggregations: {
					content: {
						ignore: false,
						// indicates, that this (FlexEnabler) is the control that contains the definition of changetypes
						// used by descendant controls that set changeOnRelevantContainer
						propagateRelevantContainer: true,
						// definition of metadata for descendant controls. Called for all descendants (not only direct children),
						// therefore no need for deep nesting

						propagateMetadata: function (oElement) {
							if (oElement.getMetadata().getElementName) {
								var oTemplData = Utils.getTemplatingInfo(oElement);
								switch (oElement.getMetadata().getElementName()) {
									case "sap.uxap.ObjectPageLayout":
										return ObjectPageLayout.getDesigntime(oElement);
									case "sap.uxap.ObjectPageSection":
										return ObjectPageSection.getDesigntime(oElement);
									case "sap.uxap.ObjectPageSubSection":
										return {
											aggregations: {
												customAnchorBarButton: {
													ignore: true
												}
											}
										};
									case "sap.ui.comp.smartform.SmartForm":
										if (checkParentControl(oElement, "sap.uxap.ObjectPageSubSection") === true) {
											return SmartForm.getDesigntime(oElement);
										}
										break;
									case "sap.ui.comp.smartform.Group":
										if (checkParentControl(oElement, "sap.uxap.ObjectPageSubSection") === true) {
											return Group.getDesigntime(oElement);
										}
										break;
									case "sap.ui.comp.smartform.GroupElement":
										if (checkParentControl(oElement, "sap.uxap.ObjectPageSubSection") === true) {
											return GroupElement.getDesigntime(oElement);
										}
										break;
									case "sap.m.Table":
										return {
											aggregations: {
												items: {
													ignore: true
												}
											}
										};
									case "sap.ui.comp.smarttable.SmartTable":
										return {
											name: {
												singular:  function() {
													return oResourceBundle.getText("FE_SMARTTABLE");
												}
											},
											aggregations: {
												items: {
													actions: null
												}
											}
										};
									case "sap.uxap.ObjectPageHeader":
										return ObjectPageHeader.getDesigntime(oElement);
									case "sap.uxap.ObjectPageDynamicHeaderTitle":
										return ObjectPageDynamicHeaderTitle.getDesigntime(oElement);
									case "sap.uxap.ObjectPageHeaderActionButton":
										var regEx = /.+(sap.suite.ui.generic.template.ObjectPage.view.Details::).+(?:--edit|--delete|--relatedApps|--template::Share|--template::NavigationUp|--template::NavigationDown|--fullScreen|--exitFullScreen|--closeColumn)$/;
										if (regEx.test(oElement.getId()) || !oTemplData) {
											return {
												actions: null
											};
										}
										return ObjectPageHeaderActionButton.getDesigntime(oElement);
									case "sap.ui.comp.smartfield.SmartField":
									case "sap.ui.comp.navpopover.SmartLink":
										return {
											ignore: true
										};

									case "sap.ui.comp.smartfield.Configuration":
									case "sap.ui.comp.smartfield.ControlProposal":
									case "sap.ui.comp.smartfield.ObjectStatus":
									case "sap.ui.comp.navpopover.SemanticObjectController":
									case "sap.m.DraftIndicator":
										return {
											actions: null
										};

									case "sap.m.Button":
										if (oElement.getId().indexOf("::Determining") >= 0) {
											return {
												getCommonInstanceData: function(oElement) {
													var oTemplData = Utils.getTemplatingInfo(oElement);
													if (oTemplData && oTemplData.path) {
														var sTarget = oTemplData.target + '/' + oTemplData.path.substr(oTemplData.path.indexOf("com.sap.vocabularies.UI.v1.Identification"));
														return {
															target: sTarget,
															annotation: oTemplData.annotation,
															qualifier: null
														};
													}
												},
												name: {
													singular: function() {
														return oResourceBundle.getText("FE_BUTTON");
													}
												},
												links: {
													developer: [{
														href: "/topic/1743323829e5474eb3829d2e9ab022ae",
														text: function() {
															return oResourceBundle.getText("FE_SDK_GUIDE_DETERMINING_ACTIONS");
														}
													}]
												},
												actions: {
													remove: {
														changeType: "removeHeaderAndFooterActionButton",
														changeOnRelevantContainer: true
													},
													rename: null,
													reveal: null,
													settings: {
														name: "Add Action Button",
														handler: addFooterActionButtonSettingsHandler,
														icon: "sap-icon://add"
													}
												},
												annotations: {
													dataFieldForAction: {
														namespace: "com.sap.vocabularies.UI.v1",
														annotation: "DataFieldForAction",
														whiteList: {
															properties: ["Action", "Label", "Criticality", "InvocationGrouping"]
														},
														ignore: function() {
															var oTempInfo = Utils.getTemplatingInfo(oElement);
															var oRecord = oTempInfo && oTempInfo.annotationContext;
															return !oRecord || oRecord.RecordType !== "com.sap.vocabularies.UI.v1.DataFieldForAction";
														},
														appliesTo: ["Button"],
														links: {
															developer: [{
																href: "/topic/1743323829e5474eb3829d2e9ab022ae",
																text: function() {
																	return oResourceBundle.getText("FE_SDK_GUIDE_DETERMINING_ACTIONS");
																}
															}]
														}
													},
													dataFieldForIBN: {
														namespace: "com.sap.vocabularies.UI.v1",
														annotation: "DataFieldForIntentBasedNavigation",
														whiteList: {
															properties: ["Action", "Label", "Criticality", "SemanticObject"]
														},
														ignore: function() {
															var oTempInfo = Utils.getTemplatingInfo(oElement);
															var oRecord = oTempInfo && oTempInfo.annotationContext;
															return !oRecord || oRecord.RecordType !== "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation";
														},
														appliesTo: ["Button"],
														links: {
															developer: [{
																href: "/topic/1743323829e5474eb3829d2e9ab022ae",
																text: function() {
																	return oResourceBundle.getText("FE_SDK_GUIDE_DETERMINING_ACTIONS");
																}
															}]
														}
													},
													importance: {
														namespace: "com.sap.vocabularies.UI.v1",
														annotation: "Importance",
														defaultValue: null,
														target: ["Record"],
														appliesTo: ["Button"],
														links: {
															developer: [{
																href: "/topic/1743323829e5474eb3829d2e9ab022ae",
																text: function() {
																	return oResourceBundle.getText("FE_SDK_GUIDE_DETERMINING_ACTIONS");
																}
															}]
														}
													}
												}
											};
										} else {
											return {
												actions: null
											};
										}
										break;
									case "sap.m.OverflowToolbar":
										if (oElement.getId().indexOf("--template::ObjectPage::FooterToolbar") >= 0) {
											return {
												name: {
													singular: function () {
														return oResourceBundle.getText("FE_FOOTER_TOOLBAR");
													}
												},
												actions: {
													settings: {
														name: "Add Action Button",
														handler: addFooterActionButtonSettingsHandler,
														icon: "sap-icon://add"
													},
													reveal: null
												},
												aggregations: {
													content: {
														propagateRelevantContainer: true,
														actions: {
															move: function (oElement) {
																switch (oElement.getMetadata().getElementName()) {
																	case "sap.m.Button":
																		if (oElement.getId().indexOf("::Determining") >= 0) {
																			return "moveHeaderAndFooterActionButton";
																		}
																}
															}
														}
													}
												}
											};
										} else {
											return {
												actions: null
											};
										}
										break;
									default:
										// don't allow any changes on any other controls
										//console.log(oElement.getMetadata().getElementName());
										return {
											actions: null
										};
								}
							} else {
								return {
									actions: null
								};
							}
						}
					}
				},
				actions: {},
				annotations: {}
			}
		};
	}, /* bExport= */ true);
