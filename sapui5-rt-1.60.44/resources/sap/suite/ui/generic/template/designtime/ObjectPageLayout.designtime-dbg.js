sap.ui.define(["sap/suite/ui/generic/template/designtime/library.designtime"],
	function() {
		"use strict";

		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();

		var oPageLayout = {
			getDesigntime: function (oElement) {
				return {
					name: {
						singular: function() {
							return oResourceBundle.getText("FE_OBJECT_PAGE_LAYOUT");
						}
					},
					aggregations: {
						headerContent: {
							ignore: true
						},
						sections: {
							actions: {
								move: "moveSection",
								createContainer: {
									changeType: "addSection",
									changeOnRelevantContainer:true,
									getCreatedContainerId: function(sNewControlID) {
										return sNewControlID;
									}
								}
							}
						},
						footer: {
							propagateRelevantContainer: true,
							propagateMetadata: function (oElement) {
								if (oElement.getMetadata().getElementName() === "sap.m.OverflowToolbar") {
									return {
										name: {
											singular: function () {
												return oResourceBundle.getText("FE_FOOTER_TOOLBAR");
											}
										},
										aggregations: {
											content: {
												propagateRelevantContainer: true,
												propagateMetadata: function (oElement) {
													switch (oElement.getMetadata().getElementName()) {
														case "sap.m.ToolbarSpacer":
															return {
																actions: null
															};
													}
												}
											}
										}
									};
								}
							}
						}
					}
				};
			}
		};
		return oPageLayout;
	}
);
