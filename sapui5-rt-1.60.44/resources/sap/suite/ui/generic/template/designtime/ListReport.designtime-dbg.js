/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */
// Provides the design time metadata for the sap.suite.ui.generic.template.ListReport component

sap.ui.define(["sap/suite/ui/generic/template/designtime/Column.designtime",
		"sap/suite/ui/generic/template/designtime/Table.designtime",
		"sap/suite/ui/generic/template/designtime/library.designtime"],
	function (Column, Table) {
		"use strict";

		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();

		return {
			'default': {
				controllerExtensionTemplate : "sap/suite/ui/generic/template/designtime/ListReportControllerExtensionTemplate", //Template for ListReport Extensibility via UI Adaptation Editor tool
				name: {
					singular: function() {
						return oResourceBundle.getText("FE_LIST_REPORT");
					}
				},
				aggregations: {
					content: {
						ignore: false,
						propagateMetadata: function (oElement) {
							if (oElement.getMetadata().getElementName) {
								switch (oElement.getMetadata().getElementName()) {
									case "sap.ui.comp.smarttable.SmartTable":
										return {
											name: {
												singular: function() {
													return oResourceBundle.getText("FE_SMARTTABLE");
												}
											}
										};
									default:
										break;
								}
							}
						}
					}
				}
			},
			'strict': {      // scope = strict UX compatibility
				name: {
					singular: function() {
						return oResourceBundle.getText("FE_LIST_REPORT");
					}
				},
				aggregations: {
					content: {
						ignore: false,
						// indicates, that this (FlexEnabler) is the control that contains the definition of changetypes
						// used by descendant controls that set changeOnRelevantContainer
						propagateRelevantContainer: true,
						// definition of metadata for descendant controls. Called for all descendants (not only dirct children),
						// therefore no need for deep nesting

						links: {
							guidelines: [{
								href: "/list-report-floorplan-sap-fiori-element/",
								text: function() {
									return oResourceBundle.getText("FE_LRP_GUIDE");
								}
							}]
						},

						propagateMetadata: function (oElement) {
							if (oElement.getMetadata().getElementName) {
								switch (oElement.getMetadata().getElementName()) {
									case "sap.f.DynamicPage":
										return {
											name: {
												singular:  function() {
													return oResourceBundle.getText("FE_DYNAMIC_PAGE");
												}
											},
											aggregations: {
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
									case "sap.m.Table":
										return Table.getDesigntime(oElement);
									case "sap.m.Button":
										return {
											name: {
												singular:  function() {
													return oResourceBundle.getText("FE_BUTTON");
												}
											}
										};
									case "sap.m.OverflowToolbarButton":
										return {
											aggregations: {
												settings: {
													ignore: true
												}
											},
											name: {
												singular:  function() {
													return oResourceBundle.getText("FE_BUTTON");
												}
											},
											links: {
												developer: [{
													href: "/topic/8ba009d7b8434dc1a4948c9211e30c40.html",
													text: function() {
														return oResourceBundle.getText("FE_SDK_LRP_ACTION");
													}
												}],
												guidelines: [{
													href: "/table-bar/",
													text: function() {
														return oResourceBundle.getText("FE_TOOLBAR_GUIDE");
													}
												}]
											},
											annotations: {
												/* disabled as decision of backend (BO)
                                                creatable: {
                                                    namespace: "Org.OData.Capabilities.V1",
                                                    annotation: "InsertRestrictions",
                                                    target: ["EntitySet"],
                                                    whiteList: {
                                                        properties: ["Insertable"]
                                                    },
                                                    defaultValue: "true",
                                                    appliesTo: ["OverflowToolbar/OverflowToolbarButton"]
                                                },
                                                deletable: {
                                                    namespace: "Org.OData.Capabilities.V1",
                                                    annotation: "DeleteRestrictions",
                                                    target: ["EntitySet"],
                                                    whiteList: {
                                                        properties: ["Deletable"]
                                                    },
                                                    defaultValue: "true",
                                                    appliesTo: ["OverflowToolbar/OverflowToolbarButton"]
                                                }, */
												importance: {
													namespace: "com.sap.vocabularies.UI.v1",
													annotation: "Importance",
													target: ["Record"],
													appliesTo: ["OverflowToolbar/Button/OverflowToolbarLayoutData"]
												}
											}
										};
									case "sap.ui.comp.smartfilterbar.SmartFilterBar":
									case "sap.ui.layout.VerticalLayout":
									case "sap.ui.layout.AlignedFlowLayout":
									case "sap.m.OverflowToolbar":
										return;  // designtime is registered separately via instance specific metadata

									case "sap.m.MultiComboBox":
										return {
											aggregations: {
												"items": {
													ignore: true
												}
											}
										};

									case "sap.suite.ui.generic.template.lib.FlexEnabler":
									case "sap.ui.comp.smartvariants.SmartVariantManagement": // for now...
									case "sap.ui.comp.filterbar.FilterGroupItem":
									case "sap.m.MultiInput":
									case "sap.m.ToolbarSeparator":
									case "sap.m.ToolbarSpacer":
									case "sap.m.SearchField":
									case "sap.m.Title":
									case "sap.ui.comp.smartvariants.PersonalizableInfo":
										return {
											actions: null
										};

									case "sap.f.DynamicPageHeader":
										return {
											name: {
												singular: function () {
													return oResourceBundle.getText("FE_DYNAMIC_PAGE_HEADER");
												}
											}
										};
									case "sap.f.DynamicPageTitle":
										return {
											name: {
												singular: function() {
													return oResourceBundle.getText("FE_DYNAMIC_PAGE_TITLE");
												}
											},
											aggregations: {
												actions: {
													ignore: true
												},
												snappedContent: {
													ignore: true
												},
												content: {
													ignore: true
												},
												heading: {
													ignore: true
												}
											}
										};

									case "sap.ui.comp.smarttable.SmartTable":
										return {
											name: {
												singular: function() {
													return oResourceBundle.getText("FE_SMARTTABLE");
												}
											},
											aggregations: {
												"semanticKeyAdditionalControl": {
													ignore: true
												}
											},
											annotations: {
												phoneNumber: { ignore: true },   // defined in Column.designtime
												emailAddress: { ignore: true },   // defined in Column.designtime
												sortable: { ignore: true },			//defined in back-end (BO)
												filterable: { ignore: true },		//defined in back-end (BO)
												columnLabelOnProperty: { ignore: true },	// defined in Column.designtime
												columnVisible: { ignore: true },		// defined in Column.designtime
												columnCurrencyCode: { ignore: true },	// defined in Column.designtime
												columnUnitOfMeasure: { ignore: true },	// defined in Column.designtime
												columnUpperCase: { ignore: true },		// defined in Column.designtime
												columnImportance: { ignore: true },		// defined in Column.designtime
												columnDataField: { ignore: true },		// defined in Column.designtime
												columnText: { ignore: true },			// not used
												textArrangement: { ignore: true },		// defined in Column.designtime
												columnIsImageURL: { ignore: true },		// defined in Column.designtime
												columnDataFieldWithUrl: { ignore: true },	// defined in Column.designtime
												columnCriticality: { ignore: true },	// is property
												columnCriticalityRepresentationType: { ignore: true }, // is property
												columnCalendarDate: { ignore: true },  // defined in Column.designtime
												lineItem: { ignore: true },				//defined on aggregation level
												semanticKey: { ignore: true },			//defined in back-end (BO)
												semanticObject: { ignore: true },		//defined in back-end (BO)
												headerLabel: {
													namespace: "com.sap.vocabularies.UI.v1",
													annotation: "HeaderInfo",
													target: ["EntityType"],
													whiteList: {
														properties: [
															"TypeNamePlural"
														]
													},

													appliesTo: ["SmartTable/header"],
													links: {
														developer: [{
															href: "/topic/f9962074132a43db9e1381291f8f3af8.html",
															text: function() {
																return oResourceBundle.getText("FE_SDK_GUIDE_ST_HEADER");
															}
														}],
														guidelines: []
													},
													group: ["Appearance"]
												},
												presentationVariant: { ignore: true }
												/* presentationVariant: {
													namespace: "com.sap.vocabularies.UI.v1",
													annotation: "PresentationVariant",
													target: ["EntityType"],
													appliesTo: ["SmartTable/customData/TemplateSortOrder"],
													links: {
														developer: [{
															href: "/topic/11d5a0c51e88414ca8d0a87407956f49.html",
															text: function() {
																return oResourceBundle.getText("FE_SDK_GUIDE_SORT_ORDER");
															}
														},{
															href: "/api/sap.ui.comp.smarttable.SmartTable/annotations/PresentationVariant",
															text: function() {
																return oResourceBundle.getText("FE_API_SMART_TABLE_ANNOTATIONS");
															}
														}],
														guidelines: []
													},
													group: ["Appearance"]
												} */
											}
										};
									case "sap.m.Column":
										return Column.getDesigntime(oElement);
									default:
										// don't allow any changes on any other controls
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
				actions: {
				},
				annotations: {}
			}
		};
	}, /* bExport= */  true);
