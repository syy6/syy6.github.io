sap.ui.define(["sap/ui/fl/changeHandler/ChangeHandlerMediator",
		"sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils"
	],
	function(ChangeHandlerMediator, Utils) {
		"use strict";
		var FACETS = "com.sap.vocabularies.UI.v1.Facets";
		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();

		var oGroupDesigntime = {

			getDesigntime: function (oElement) {
				return {
					getCommonInstanceData: function(oElement) {
						var oTemplData = Utils.getTemplatingInfo(oElement);

						if (oTemplData && oTemplData.path) {
							var sTarget = oTemplData.target + '/' + oTemplData.path.substr(oTemplData.path.indexOf(FACETS));
							return {
								target: sTarget,
								annotation: oTemplData.annotation,
								qualifier: null
							};
						}
					},
					name: {
						singular: function() {
							return oResourceBundle.getText("FE_GROUP");
						},
						plural: function() {
							return oResourceBundle.getText("FE_GROUPS");
						}
					},
					links: {
						developer: [{
								href: "/topic/facfea09018d4376acaceddb7e3f03b6",
								text: function() {
									return oResourceBundle.getText("FE_SDK_GUIDE_SECTIONS");
								}
							}
						]
					},
					aggregations: {
						formElements: {
							actions: {
								addODataProperty: function() {
									var mChangeHandlerSettings = ChangeHandlerMediator.getAddODataFieldSettings(oElement);
									if (mChangeHandlerSettings) {
										mChangeHandlerSettings.content.requiredLibraries = "";
										return {
											changeType: "addGroupElement",
											changeOnRelevantContainer: true,
											changeHandlerSettings: mChangeHandlerSettings
										};
									} else {
										return {
											changeType: "addGroupElement",
											changeOnRelevantContainer: true
										};
									}
								},
								move: "moveGroupElement"
							}
						}
					},
					actions: {
						remove: {
							changeType: "removeGroup",
							changeOnRelevantContainer: true
						},
						rename: null
					},
					annotations: {
/*						facets: {
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
						referenceFacet: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "ReferenceFacet",
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
						}
/*						fieldGroup: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "FieldGroup",
							target: ["EntityType"],
							group: ["Appearance"],
							ignore: function() {
								var sAnnotationTerm = this.getAnnotationTerm(oElement);
								return sAnnotationTerm.indexOf(FIELDGROUP) === -1;
							}.bind(this),
							whiteList: {
								properties: ["Label"]
							},
							links: {
								developer: [ {
									href: "/topic/facfea09018d4376acaceddb7e3f03b6.html",
									text: "Defining and Adapting Sections"
								}]
							},
							appliesTo: ["SmartForm/Groups"],
							defaultValue: "null"
						},
						identification: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "Identification",
							target: ["EntityType"],
							group: ["Appearance"],
							ignore: function() {
								var sAnnotationTerm = this.getAnnotationTerm(oElement);
								return sAnnotationTerm.indexOf(IDENTIFICATION) === -1;
							}.bind(this),
							links: {
								developer: [ {
									href: "/topic/facfea09018d4376acaceddb7e3f03b6.html",
									text: "Defining and Adapting Sections"
								}]
							},
							appliesTo: ["SmartForm/Groups"],
							defaultValue: "null"
						}*/
					}
				};
			}
		};
		return oGroupDesigntime;
});
