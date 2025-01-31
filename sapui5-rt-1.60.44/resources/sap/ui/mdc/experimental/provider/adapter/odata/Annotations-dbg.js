/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([], function() {
	"use strict";

	return {
		CHART: "com.sap.vocabularies.UI.v1.Chart",
		TABLE: "com.sap.vocabularies.UI.v1.LineItem",
		LABEL: "com.sap.vocabularies.Common.v1.Label",
		QUICKINFO: "com.sap.vocabularies.Common.v1.QuickInfo",
		FIELD_CONTROL: "com.sap.vocabularies.Common.v1.FieldControl",
		FIELD_CONTROL_TYPE: {
			HIDDEN: "com.sap.vocabularies.Common.v1.FieldControlType/Hidden",
			MANDATORY: "com.sap.vocabularies.Common.v1.FieldControlType/Mandatory",
			READONLY: "com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly",
			OPTIONAL: ""
		},
		IMMUTABLE: "Org.OData.Core.V1.Immutable/Bool",
		COMPUTED: "Org.OData.Core.V1.Computed/Bool",
		HIDDEN: "com.sap.vocabularies.UI.v1.Hidden",
		SEMANTICS: {
			PASSWORD: "com.sap.vocabularies.Common.v1.Masked",
			EMAIL: "com.sap.vocabularies.Communication.v1.IsEmailAddress",
			PHONE: "com.sap.vocabularies.Communication.v1.IsPhoneNumber",
			URL: "com.sap.vocabularies.Communication.v1.IsUrl",
			UNIT: "Org.OData.Measures.V1.Unit",
			CURRENCY: "Org.OData.Measures.V1.ISOCurrency"
		},
		VALUE_LIST: "com.sap.vocabularies.Common.v1.ValueList",
		TEXT: "com.sap.vocabularies.Common.v1.Text",
		FILTER_RESTRICTIONS: "Org.OData.Capabilities.V1.FilterRestrictions",
		SORT_RESTRICTIONS: "Org.OData.Capabilities.V1.SortRestrictions",
		NAVIGATION_RESTRICTIONS: "Org.OData.Capabilities.V1.NavigationRestrictions",
		PRESENTATION_VARIANT: "com.sap.vocabularies.UI.v1.PresentationVariant",
		MEASURE_ROLES: {
			"": "axis1",
			"com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1": "axis1",
			"com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis2": "axis2",
			"com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis3": "axis3"
		},
		DIMENSION_ROLES: {
			"": "category",
			"com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Category": "category",
			"com.sap.vocabularies.UI.v1.ChartDimensionRoleType/Series": "series"
		},
		DATA_FIELD: {
			FIELD: "com.sap.vocabularies.UI.v1.DataField",
			ACTION: "com.sap.vocabularies.UI.v1.DataFieldForAction",
			INTENT: "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation",
			DEFAULT: "com.sap.vocabularies.UI.v1.DataFieldDefault"
		},
		SEMANTIC_OBJECT: "com.sap.vocabularies.Common.v1.SemanticObject",
		SEMANTIC_OBJECT_MAPPING: "com.sap.vocabularies.Common.v1.SemanticObjectMapping",
		CONTACT: "com.sap.vocabularies.Communication.v1.Contact",
		VALUE_LIST_PARAMETER: {
			OUT: "com.sap.vocabularies.Common.v1.ValueListParameterOut",
			IN: "com.sap.vocabularies.Common.v1.ValueListParameterIn",
			IN_OUT: "com.sap.vocabularies.Common.v1.ValueListParameterInOut",
			DISPLAY_ONLY: "com.sap.vocabularies.Common.v1.ValueListParameterDisplayOnly",
			FILTER_ONLY: "com.sap.vocabularies.Common.v1.ValueListParameterFilterOnly"
		}
	};

});
