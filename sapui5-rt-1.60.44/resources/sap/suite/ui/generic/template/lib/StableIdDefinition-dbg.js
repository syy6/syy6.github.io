sap.ui.define([],function(){
	"use strict";

	return {
		parameters: ["sQuickVariantKey", "sFacet", "sSmartTableId", "sProperty", "sTarget", "sSemanticObject", "sAction"],
		types: {
			ListReportPage: {
				type: "ListReportPage",
				subTypes: {
					DynamicPage: {
						subType: "DynamicPage",
						legacy: true,
						fixed: true,
						value: "page"
					},
					DynamicPageTitle: {
						subType: "DynamicPageTitle",
						legacy: false,
						fixed: true
					},
					DynamicPageHeader: {
						subType: "DynamicPageHeader",
						legacy: false,
						fixed: true
					}
				}
			},
			ListReportTable: {
				type: "ListReportTable",
				subTypes: {
					SmartTable: {
						subType: "SmartTable",
						legacy: true,
						fixed: true,
						value: "listReport"
					},
					ResponsiveTable: {
						legacy: true,
						fixed: true,
						value: "responsiveTable"
					},
					ColumnListItem: {
						subType: "ColumnListItem",
						legacy: false,
						fixed: true
					},
					GridTable: {
						legacy: true,
						fixed: true,
						value: "GridTable"
					},
					AnalyticalTable: {
						legacy: true,
						fixed: true,
						value: "analyticalTable"
					},
					TreeTable: {
						legacy: true,
						fixed: true,
						value: "TreeTable"
					},
					QuickVariantSelectionXSmartTable: {
						subType: "QuickVariantSelectionXSmartTable",
						legacy: true,
						fixed: false,
						parameters: ["sQuickVariantKey"],
						value: function(sQuickVariantKey){return "listReport-" + sQuickVariantKey;}
					},
					QuickVariantSelectionXResponsiveTable: {
						subType: "QuickVariantSelectionXResponsiveTable",
						legacy: true,
						fixed: false,
						parameters: ["sQuickVariantKey"],
						value: function(sQuickVariantKey){return "responsiveTable-" + sQuickVariantKey;}
					},
					QuickVariantSelectionXColumnListItem: {
						subType: "QuickVariantSelectionXColumnListItem",
						legacy: false,
						fixed: false,
						parameters: ["sQuickVariantKey"]
					},
					QuickVariantSelectionXGridTable: {
						subType: "QuickVariantSelectionXGridTable",
						legacy: true,
						fixed: false,
						parameters: ["sQuickVariantKey"],
						value: function(sQuickVariantKey){return "GridTable-" + sQuickVariantKey;}
					},
					QuickVariantSelectionXAnalyticalTable: {
						subType: "QuickVariantSelectionXAnalyticalTable",
						legacy: true,
						fixed: false,
						parameters: ["sQuickVariantKey"],
						value: function(sQuickVariantKey){return "analyticalTable-" + sQuickVariantKey;}
					},
					QuickVariantSelectionXTreeTable: {
						subType: "QuickVariantSelectionXTreeTable",
						legacy: true,
						fixed: false,
						parameters: ["sQuickVariantKey"],
						value: function(sQuickVariantKey){return "TreeTable-" + sQuickVariantKey;}
					}
				}
			},
			ALPTable: {
				type: "ALPTable",
				subTypes: {
					SmartTable: {
						subType: "SmartTable",
						legacy: true,
						fixed: true,
						value: "table"
					}
				}
			},
			ObjectPageTable: {
				type: "ObjectPageTable",
				subTypes: {
					SmartTable: {
						subType: "SmartTable",
						legacy: true,
						fixed: false,
						parameters: ["sFacet"],
						value: function(sFacet){return sFacet + "::Table";}
					},
					
					ColumnListItem: {
						subType: "ColumnListItem",
						legacy: true,
						fixed: false,
						parameters: ["sFacet"],
						value: function(sFacet){return "template:::ObjectPageTable:::ColumnListItem:::sFacet::" + sFacet;}
					}
				}
			},
			TableColumn: {
				type: "TableColumn",
				subTypes: {
					DataField: {
						subType: "DataField",
						legacy: true,
						fixed: false,
						parameters: ["sSmartTableId", "sProperty"],
						value: function(sSmartTableId, sProperty){return sSmartTableId + "-" + sProperty.replace("/", "_");}
					},
					DataFieldWithNavigationPath: {
						subType: "DataFieldWithNavigationPath",
						legacy: false,
						fixed: false,
						parameters: ["sSmartTableId", "sProperty", "sTarget"]
					},
					DataFieldWithIntentBasedNavigation: {
						subType: "DataFieldWithIntentBasedNavigation",
						legacy: false,
						fixed: false,
						parameters: ["sSmartTableId", "sProperty", "sSemanticObject", "sAction"]
					},
					DataFieldForAnnotation: {
						subType: "DataFieldForAnnotation",
						legacy: false,
						fixed: false,
						parameters: ["sSmartTableId", "sTarget"]
					},
					DataFieldForAction: {
						subType: "DataFieldForAction",
						legacy: false,
						fixed: false,
						parameters: ["sSmartTableId", "sAction"]
					},
					DataFieldForIntentBasedNavigation: {
						subType: "DataFieldForIntentBasedNavigation",
						legacy: false,
						fixed: false,
						parameters: ["sSmartTableId", "sSemanticObject", "sAction"]
					}
				}
			}
		}
	};
});
