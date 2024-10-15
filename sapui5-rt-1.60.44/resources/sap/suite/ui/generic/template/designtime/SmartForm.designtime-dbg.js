sap.ui.define([],
	function() {
		"use strict";

		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();

		var oSmartFormDesigntime = {
			getDesigntime: function (oElement) {
				return {
					name: {
						singular: function() {
							return oResourceBundle.getText("FE_FORM");
						},
						plural: function() {
							return oResourceBundle.getText("FE_FORMS");
						}
					},
					actions: {
						rename: null
					},
					aggregations: {
						groups: {
							aggregations: {
								semanticObjectController: {
									ignore: true
								}
							},
							propagateRelevantContainer: true,
							propagateMetadata: function (oElement) {
								switch (oElement.getMetadata().getElementName()) {
									case "sap.ui.comp.smartfield.SmartLink":
										return {
											name: {
												singular: function() {
													return oResourceBundle.getText("FE_LINK");
												},
												plural: function() {
													return oResourceBundle.getText("FE_LINKS");
												}
											},
											annotations: {
												semanticObjectMapping: { ignore: true } //property annotations, not supported yet
											}
										};
									case "sap.ui.comp.smartfield.SmartField":
										return {
											name: {
												singular: function() {
													return oResourceBundle.getText("FE_FIELD");
												},
												plural: function() {
													return oResourceBundle.getText("FE_FIELDS");
												}
											},
											annotations: {
												dataType: { ignore: true }, //not an annotation
												fieldCurrencyCode: { ignore: true }, //property annotations, not supported yet
												fieldUnitOfMeasure: { ignore: true }, //property annotations, not supported yet
												fieldScale: { ignore: true }, //property annotations, not supported yet
												fieldQuickInfo: { ignore: true }, //property annotations, not supported yet
												fieldMultiLineText: { ignore: true }, //property annotations, not supported yet
												fieldUpperCase: { ignore: true }, //property annotations, not supported yet
												fieldDigitSequence: { ignore: true }, //property annotations, not supported yet
												fieldCalendarDate: { ignore: true }, //property annotations, not supported yet
												fieldEmailAddress: { ignore: true }, //property annotations, not supported yet
												fieldPhoneNumber: { ignore: true }, //property annotations, not supported yet
												fieldUrl: { ignore: true }, //property annotations, not supported yet
												fieldComputed: { ignore: true }, //property annotations, not supported yet
												fieldControl: { ignore: true }, //property annotations, not supported yet
												fieldVisible: { ignore: true }, //redundant definition
												fieldImmutable: { ignore: true }, //property annotations, not supported yet
												valueListWithFixedValues: { ignore: true }, //property annotations, not supported yet
												valueList: { ignore: true } //complex, rather defined on BO view
											}
										};
								}
							},
							actions: {
								move: "moveGroup",
								createContainer: {
									changeType: "addGroup",
									isEnabled: true,
									changeOnRelevantContainer:true,
									getCreatedContainerId: function(sNewControlID) {
										return sNewControlID;
									}
								}
							}
						}
					},
					annotations: {
						/*facets: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "Facets",
							target: ["EntityType"],
							whiteList: {
								properties: [
									"Label", "ID"
								]
							},
							links: {
								developer: [ {
									href: "/topic/99e33bdfde074bb48d2e603fa5ecd2d0.html",
									text: "FE_SDK_GUIDE_SMARTFORM"
								},
								{
									href:"/topic/facfea09018d4376acaceddb7e3f03b6.html",
									text: "FE_SDK_GUIDE_SECTIONS"
								}]
							},
							appliesTo: ["ObjectPage/Sections"],
							group: ["Appearance"],
							defaultValue: null
						},*/
						/*referenceFacet: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "ReferenceFacet",
							target: ["ComplexType"],
							whiteList: {
								properties: [
									"Label", "ID", "Target"
								]
							},
							links: {
								developer: [ {
									href:"/topic/facfea09018d4376acaceddb7e3f03b6.html",
									text: "Smart Form"
								}]
							},
							appliesTo: ["SmartForm/Groups"]
						}*/
					}
				};
			}
		};
		return oSmartFormDesigntime;
});
