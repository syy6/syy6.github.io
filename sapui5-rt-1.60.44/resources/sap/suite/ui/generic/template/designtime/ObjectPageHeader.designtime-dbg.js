sap.ui.define(["sap/ui/fl/changeHandler/ChangeHandlerMediator", "sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils", "sap/suite/ui/generic/template/designtime/utils/DesigntimeUtils"],
	function(ChangeHandlerMediator, Utils, DesigntimeUtils) {
		"use strict";

		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();
		var addHeaderActionButtonSettingsHandler = function(oTargetButton, mPropertyBag) {
			var aActions = [];
			if (oTargetButton.getParent().getId().indexOf("--objectPageHeader") > -1) {
				aActions = oTargetButton.getParent().getActions();
			} else {
				aActions = oTargetButton.getActions();
			}
			var sChangeHandler = "addHeaderActionButton";
			return DesigntimeUtils.addSettingsHandler(oTargetButton, mPropertyBag, aActions, sChangeHandler);
		};
		var oObjectPageHeaderDesigntime = {
			getDesigntime: function (oElement) {
				return {
					name: {
						singular: function() {
							return oResourceBundle.getText("FE_OBJECT_PAGE_HEADER");
						}
					},
					actions: {
						settings: {
							name: "Add Action Button",
							handler: addHeaderActionButtonSettingsHandler,
							icon: "sap-icon://add"
						}
					},
					aggregations: {
						actions: {
							actions: {
								move: function (oElement) {
									switch (oElement.getMetadata().getElementName()) {
										case "sap.uxap.ObjectPageHeaderActionButton":
											var oTemplData = Utils.getTemplatingInfo(oElement);
											var regEx = /.+(sap.suite.ui.generic.template.ObjectPage.view.Details::).+(?:--edit|--delete|--relatedApps|--template::Share|--template::NavigationUp|--template::NavigationDown|--fullScreen|--exitFullScreen|--closeColumn)$/;
											if (regEx.test(oElement.getId()) || !oTemplData) {
												return null;
											}
											return "moveHeaderAndFooterActionButton";
									}
								}
							}
						},
						navigationBar: {
							ignore: true
						}
					}
				};
			}
		};
		return oObjectPageHeaderDesigntime;
});
