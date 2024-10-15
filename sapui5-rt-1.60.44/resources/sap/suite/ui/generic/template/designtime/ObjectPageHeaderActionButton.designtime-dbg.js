sap.ui.define(["sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils", "sap/suite/ui/generic/template/designtime/utils/DesigntimeUtils"],
	function(Utils, DesigntimeUtils) {
		"use strict";

		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();

		var addHeaderActionButtonSettingsHandler = function(oTargetButton, mPropertyBag) {
			var aActions = oTargetButton.getParent().getActions();
			var sChangeHandler = "addHeaderActionButton";
			return DesigntimeUtils.addSettingsHandler(oTargetButton, mPropertyBag, aActions, sChangeHandler);
		};

		var oObjectPageHeaderActionButtonDesigntime = {
			getDesigntime: function (oElement) {
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
							return oResourceBundle.getText("FE_OBJECT_PAGE_HEADER_ACTION_BUTTON");
						}
					},
					actions: {
						rename: null,
						reveal: null,
						remove: {
							changeType: "removeHeaderAndFooterActionButton",
							changeOnRelevantContainer: true
						},
						settings: {
							name: "Add Action Button",
							handler: addHeaderActionButtonSettingsHandler,
							icon: "sap-icon://add"
						}
					},
					links: {
						developer: [{
							href: "/topic/5fe439613f9c4e259015951594c423dc",
							text: function() {
								return oResourceBundle.getText("FE_SDK_GUIDE_HEADER_ACTIONS");
							}
						}]
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
							appliesTo: ["ObjectPageHeaderActionButton"],
							links: {
								developer: [{
									href: "/topic/5fe439613f9c4e259015951594c423dc",
									text: function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_HEADER_ACTIONS");
									}
								}]
							}
						},
						importance: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "Importance",
							defaultValue: null,
							target: ["Record"],
							appliesTo: ["ObjectPageHeaderActionButton"],
							links: {
								developer: [{
									href: "/topic/5fe439613f9c4e259015951594c423dc",
									text: function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_HEADER_ACTIONS");
									}
								}]
							}
						}
					}
				};
			}
		};
		return oObjectPageHeaderActionButtonDesigntime;
});
