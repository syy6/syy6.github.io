sap.ui.define([
		"sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils",
		"sap/suite/ui/generic/template/changeHandler/util/AnnotationChangeUtilsV2",
		"sap/suite/ui/generic/template/designtime/utils/DesigntimeUtils",
		"sap/suite/ui/generic/template/designtime/library.designtime"
	],
	function(Utils, AnnotationChangeUtils, DesigntimeUtils) {
		"use strict";

		var LINEITEM = "com.sap.vocabularies.UI.v1.LineItem",
			CHART = "com.sap.vocabularies.UI.v1.Chart",

			COLUMNTYPE_DATAFIELD = "Datafield",
			COLUMNTYPE_CHART = "Chart",
			COLUMNTYPE_RATING = "RatingIndicator",
			COLUMNTYPE_CONTACT = "Contact",
			COLUMNTYPE_PROGRESS = "ProgressIndicator",
			COLUMNTYPE_DATAFIELDFORACTION = "DataFieldForAction",
			COLUMNTYPE_INTENTBASEDNAV = "DataFieldWithIntentBasedNavigation",
			COLUMNTYPE_DATAFIELDWITHURL = "DatafieldWithUrl",
			COLUMNTYPE_CONNECTEDFIELDS = "ConnectedFields",
			COLUMNTYPE_TOOLBARBUTTON = "ToolbarButton",

			CHARTTYPE_AREA = "com.sap.vocabularies.UI.v1.ChartType/Area",
			CHARTTYPE_DONUT = "com.sap.vocabularies.UI.v1.ChartType/Donut",
			CHARTTYPE_BULLET = "com.sap.vocabularies.UI.v1.ChartType/Bullet";

		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();

		var oColumnDesigntime = {

			/**
			 * Retrieves a list of possible values of the chart type property, e.g. for filling a drop-down in the UI.
			 * The original vocabulary enum member is redefined in order to have the right descriptions
			 *
			 * @returns {object} An object comprising the values (as a technical key) and their labels (displayName)
			 * @private
			 */
			_getChartTypeValues: function() {
				var oValues = {
					Area: {
						displayName: "Smart Area Micro Chart"
					},
					Donut: {
						displayName: "Smart Radial Micro Chart"
					},
					Bullet: {
						displayName: "Smart Bullet Micro Chart"
					}
				};
				return oValues;
			},

			/**
			 * Retrieves the type definition of a record of the virtual collection vMeasures for a given column.
			 * The complex types combines the information from the Measures and MeasureAttributes collections of a
			 * UI.Chart annotation
			 *
			 * @param {sap.m.Column} oColumn The column element (in overlay mode)
			 * @returns {object} An object comprising the definitions, including type and label
			 * @private
			 */
			_getMeasureDefinition: function(oColumn) {
				var oMeasure = {
					Measure: {
						displayName: "Measure",
						type: "Edm.PropertyPath",
						namespace: "com.sap.vocabularies.UI.v1",
						annotation: "Chart"
					},
					Role: {
						displayName: "Role",
						type: "EnumType",
						namespace: "com.sap.vocabularies.UI.v1",
						annotation: "Chart",
						possibleValues: {
							Axis1: {
								displayName: "Axis 1"
							},
							Axis2: {
								displayName: "Axis 2"
							},
							Axis3: {
								displayName: "Axis 3"
							}
						}
					},
					DataPointAnnotationPath: {
						displayName: "Data Point Reference",
						type: "Edm.AnnotationPath",
						namespace: "com.sap.vocabularies.UI.v1",
						annotation: "Chart"
					}
				};
				var oChartFromColumn = DesigntimeUtils.getChartFromColumn(oColumn),
				    oChart = oChartFromColumn && oChartFromColumn.entityType[oChartFromColumn.chartID];
				if (!oChartFromColumn || !oChart || !oChart.ChartType) {
					return oMeasure;
				}

				switch (oChart.ChartType.EnumMember) {
					case CHARTTYPE_AREA:
						oMeasure.DataPoint = {
							displayName: "Data Point Properties",
							type: "ComplexType",
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataPoint",
							whiteList: {
								properties: [
									"Value",
									"TargetValue",
									"CriticalityCalculation"
								],
								CriticalityCalculation: [
									"ImprovementDirection",
									"DeviationRangeLowValue",
									"ToleranceRangeLowValue",
									"ToleranceRangeHighValue",
									"DeviationRangeHighValue"
								],
								expressionTypes: {
									Value: ["Path"],
									TargetValue: ["Path", "String", "Int", "Decimal"]
								}
							}
						};
						break;
					case CHARTTYPE_BULLET:
						oMeasure.DataPoint = {
							displayName: "Data Point Properties",
							type: "ComplexType",
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataPoint",
							whiteList: {
								properties: [
									"Value",
									"TargetValue",
									"ForecastValue",
									"MinimumValue",
									"MaximumValue",
									"Criticality",
									"CriticalityCalculation"
								],
								CriticalityCalculation: [
									"ImprovementDirection",
									"DeviationRangeLowValue",
									"ToleranceRangeLowValue",
									"ToleranceRangeHighValue",
									"DeviationRangeHighValue"
								],
								expressionTypes: {
									Value: [ "Path" ],
									TargetValue: ["Path", "String", "Int", "Decimal"],
									ForecastValue: ["Path", "String", "Int", "Decimal"]
								}
							}
						};
						break;
					case CHARTTYPE_DONUT:
						oMeasure.DataPoint = {
							displayName: "Data Point Properties",
							type: "ComplexType",
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataPoint",
							whiteList: {
								properties: [
									"Value",
									"TargetValue",
									"Criticality",
									"CriticalityCalculation"
								],
								CriticalityCalculation: [
									"ImprovementDirection",
									"DeviationRangeLowValue",
									"ToleranceRangeLowValue",
									"ToleranceRangeHighValue",
									"DeviationRangeHighValue"
								],
								expressionTypes: {
									Value: ["Path"],
									TargetValue: ["Path", "String", "Int", "Decimal"]
								}
							}
						};
						break;
					default:
						break;
				}

				return oMeasure;
			},

			/**
			 * Retrieves the current value of the chart type property for a given column from
			 * various annotations.
			 *
			 * @param {sap.m.Column} oColumn The current column
			 * @returns {string} The technical key of the chart type property, as comprised in the list of possible values
			 * @private
			 */
			_getChartType: function(oColumn) {
				var oChart = DesigntimeUtils.getChartFromColumn(oColumn),
					sChartType;

				if (!oChart || !oChart.entityType[oChart.chartID] || !oChart.entityType[oChart.chartID].ChartType) {
					return sChartType;
				}
				switch (oChart.entityType[oChart.chartID].ChartType.EnumMember) {
					case CHARTTYPE_AREA:
						sChartType = "Area";
						break;
					case CHARTTYPE_BULLET:
						sChartType =  "Bullet";
						break;
					case CHARTTYPE_DONUT:
						sChartType =  "Donut";
						break;
					default:
						break;
				}

				return sChartType;
			},

			/**
			 * Updates the value of the chart type property for a given column
			 *
			 * @param {sap.m.Column} oColumn The column element (in overlay mode)
			 * @param {string} sNewChartType The new value for the chartType
			 * @returns{object} The change content, comprising old an new values of the columnType but also
			 *                  the implicitly changed annotations.
			 * @private
			 */
			_setChartType: function(oColumn, sNewChartType) {
				var aCustomChanges = [],
					sOldValue = oColumnDesigntime._getChartType(oColumn);

				if (sOldValue === sNewChartType) {
					return aCustomChanges;
				}
				var oChartFromColumn = DesigntimeUtils.getChartFromColumn(oColumn),
				    oChartOld = oChartFromColumn && oChartFromColumn.entityType[oChartFromColumn.chartID],
					oChartNew = {},
					sTarget = Utils.getEntityType(Utils.getComponent(oColumn));

				if (oChartOld) {
					oChartNew.Description = oChartOld.Description;
					oChartNew.Measures = oChartOld.Measures;
					oChartNew.MeasureAttributes = oChartOld.MeasureAttributes;
				}

				switch (sNewChartType) {
					case "Area":
						oChartNew.ChartType = {
							EnumMember: CHARTTYPE_AREA
						};
						oChartNew.Dimensions = oChartOld && oChartOld.Dimensions;
						break;
					case "Bullet":
						oChartNew.ChartType = {
							EnumMember: CHARTTYPE_BULLET
						};
						break;
					case "Donut":
						oChartNew.ChartType = {
							EnumMember: CHARTTYPE_DONUT
						};
						break;
					default:
						return aCustomChanges;
				}
				var oCustomChange = AnnotationChangeUtils.createCustomAnnotationTermChange(sTarget, oChartNew, oChartOld, CHART);
				aCustomChanges.push(oCustomChange);

				return aCustomChanges;
			},

			/**
			 * Retrieves the propagated and redefined designtime for a sap.m.column element, as presented in a list report.
			 *
			 * @param {sap.m.Column} oElement The SAPUI5 Column element instance
			 * @returns {object} The designtime metadata containing embedded functions
			 * @public
			 */
			getDesigntime: function(oElement) {
				var sColumnType = DesigntimeUtils.getColumnType(oElement);
				if (sColumnType === COLUMNTYPE_TOOLBARBUTTON) {
					return {
						actions: null
					};
				}
				if (this.sColumnType === COLUMNTYPE_CHART) {
					this.sChartType = oColumnDesigntime._getChartType(oElement);
				} else {
					this.sChartType = undefined;
				}

				return {
					name: {
						singular: function() {
							return oResourceBundle.getText("FE_COLUMN");
						},
						plural: function() {
							return oResourceBundle.getText("FE_COLUMNS");
						}
					},
					getLabel: function(oElement) {
						return oElement.getHeader() && oElement.getHeader().getText();
					},
					getCommonInstanceData: function(oElement) {
						var aLineItems = Utils.getLineItems(oElement);
						var sRecordIndex = Utils.getLineItemRecordIndex(oElement, aLineItems),
							sTarget;
						if (sRecordIndex > -1) {
							var oMetaModel = oElement.getModel().getMetaModel();
							var sEntityType = Utils.getEntityType(oElement);
							var oEntityType = sEntityType && oMetaModel.getODataEntityType(sEntityType);
							if (oEntityType) {
								sTarget = oEntityType.namespace + "." + oEntityType.name + "/" + LINEITEM + "/" + sRecordIndex;
							}
						}
						return {
							target: sTarget,
							annotation: LINEITEM,
							qualifier: null //for LRP, could play a role on OBJ
						};
					},
					aggregations: {
						header: {
							ignore: true
						},
						footer: {
							ignore: true
						}
					},
					properties: {
						columnType: {
							name: "Column type",
							virtual: true,
							ignore: function() {
								var oRecord = Utils.getLineItemRecordForColumn(oElement);
								return oRecord === undefined;
							},
							type: "EnumType",
							group: "header",
							possibleValues: DesigntimeUtils.getColumnTypeValues(),
							get: DesigntimeUtils.getColumnType.bind(oElement),
							set: DesigntimeUtils.setColumnType.bind(oElement)
						},
						chartType: {
							name: "Chart Type",
							virtual: true,
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_CHART;
							},
							type: "EnumType",
							group: "header",
							possibleValues: oColumnDesigntime._getChartTypeValues(),
							get: oColumnDesigntime._getChartType.bind(oElement),
							set: oColumnDesigntime._setChartType.bind(oElement)
						},
						vMeasures: {
							name: "Measures and Attributes",
							virtual: true,
							type: "Collection",
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_CHART;
							},
							visible: false,
							multiple: true,
							possibleValues: oColumnDesigntime._getMeasureDefinition.bind(oElement),
							get: DesigntimeUtils.getMeasures.bind(oElement),
							set: DesigntimeUtils.setMeasures.bind(oElement)
						}
					},
					actions: {
						remove: {
							changeType: "removeTableColumn",
							changeOnRelevantContainer: true
						},
						reveal: {
							changeType: "revealTableColumn",
							changeOnRelevantContainer: true
						}
					},
					annotations: {
						columnDataField: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataField",
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_DATAFIELD;
							},
							whiteList: {
								properties: [
									"Criticality",
									"CriticalityRepresentation",
									"Label",
									"Value"
								],
								expressionTypes: {
									Value: [
										"Path"
									]
								}
							},
							appliesTo: ["Column"],
							links: {
								developer: [
									{
										href: "/topic/f0e1e1743bef4f519c34025ad4351f77.html",
										text: function() {
											return oResourceBundle.getText("FE_SDK_GUIDE_LINEITEMS");
										}
									}, {
										href: "/api/sap.ui.comp.smarttable.SmartTable/annotations/DataField",
										text: function() {
											return oResourceBundle.getText("FE_API_SMART_TABLE_ANNOTATIONS");
										}
									}
								]
							}
						},
						columnDataFieldWithUrl: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldWithUrl",
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_DATAFIELDWITHURL;
							},
							whiteList: {
								expressionTypes: {
									Value: [
										"Path"
									]
								}
							},
							appliesTo: ["Column"],
							links: {
								developer: [
									{
										href: "/topic/f0e1e1743bef4f519c34025ad4351f77.html",
										text: function() {
											return oResourceBundle.getText("FE_SDK_GUIDE_LINEITEMS");
										}
									}, {
										href: "/api/sap.ui.comp.smarttable.SmartTable/annotations/DataFieldWithUrl",
										text: function() {
											return oResourceBundle.getText("FE_API_SMART_TABLE_ANNOTATIONS");
										}
									}
								]
							}
						},
						dataFieldForAction: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldForAction",
							whiteList: {
								properties: ["Action", "Label", "Criticality", "InvocationGrouping"]
							},
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_DATAFIELDFORACTION;
							},
							appliesTo: ["Column"],
							links: {
								developer: [
									{
										href: "/topic/b623e0bbbb2b4147b2d0516c463921a0",
										text: function() {
											return oResourceBundle.getText("FE_SDK_GUIDE_TABLE_ACTION");
										}
									}
								]
							}
						},
						dataFieldForAnnotationChartWithDimensions: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldForAnnotation",
							refersTo: [{
								annotation: "chartWithDimensions",
								nullable: false,
								referredBy: "Target"
							}],
							ignore: function() {
								var sChartType = oColumnDesigntime._getChartType(oElement);
								return sChartType === undefined || sChartType !== "Area";
							},
							appliesTo: ["Column"],
							links: {
								developer: [{
									href: "/topic/a797173b84724ef1bc54d59dc575e52f",
									text:  function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_TABLE_CHART");
									}
								}]
							}
						},
						dataFieldForAnnotationChartNoDimensions: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldForAnnotation",
							refersTo: [{
								annotation: "chartNoDimensions",
								nullable: false,
								referredBy: "Target"
							}],
							ignore: function() {
								var sChartType = oColumnDesigntime._getChartType(oElement);
								return sChartType === undefined || sChartType === "Area";
							},
							appliesTo: ["Column"],
							links: {
								developer: [{
									href: "/topic/a797173b84724ef1bc54d59dc575e52f",
									text:  function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_TABLE_CHART");
									}
								}]
							}
						},
						dataFieldForAnnotationRating: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldForAnnotation",
							whiteList: {
								properties: ["Target", "Label"]
							},
							refersTo: [{
								annotation: "dataPointRating",
								nullable: false,
								referredBy: "Target"
							}],
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_RATING;
							},
							appliesTo: ["Column"],
							links: {
								developer: [{
									href: "/topic/a797173b84724ef1bc54d59dc575e52f",
									text:  function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_TABLE_RATING");
									}
								}]
							}
						},
						dataFieldForAnnotationProgress: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldForAnnotation",
							whiteList: {
								properties: ["Target", "Label"]
							},
							refersTo: [{
								annotation: "dataPointProgress",
								nullable: false,
								referredBy: "Target"
							}],
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_PROGRESS;
							},
							appliesTo: ["Column"],
							links: {
								developer: [{
									href: "/topic/43f6f0faa1b64c5aa92bcde379be9054",
									text:  function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_TABLE_PROGRESS");
									}
								}]
							}
						},
						dataFieldForAnnotationContact: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldForAnnotation",
							whiteList: {
								properties: ["Target", "Label"]
							},
							refersTo: [{
								annotation: "contact",
								nullable: false,
								referredBy: "Target"
							}],
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_CONTACT;
							},
							appliesTo: ["Column"],
							links: {
								developer: [{
									href: "/topic/677fbde43a324f36aa9398b7f04e9896",
									text:  function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_TABLE_CONTACT");
									}
								}]
							}
						},
						dataFieldForAnnotationConnectedFields: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldForAnnotation",
							whiteList: {
								properties: ["Target", "Label"]
							},
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_CONNECTEDFIELDS;
							},
							appliesTo: ["Column"]
						},
						dataFieldWithIBN: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldWithIntentBasedNavigation",
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_INTENTBASEDNAV;
							},
							appliesTo: ["Column"]
						},
						chartWithDimensions: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "Chart",
							ignore: function() {
								var sChartType = oColumnDesigntime._getChartType(oElement);
								return sChartType === undefined || sChartType !== "Area";
							},
							target: ["EntityType"],
							whiteList: {
								properties: [
									"Description",
									"Dimensions",
									"vMeasures"  //virtual property
								]
							},
							appliesTo: ["Column"],
							links: {
								developer: [{
									href: "/topic/b8312a4adde54f33a89480dbe12d8632",
									text: function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_TABLE_CHART");
									}
								}]
							}
						},
						chartNoDimensions: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "Chart",
							ignore: function() {
								var sChartType = oColumnDesigntime._getChartType(oElement);
								return sChartType === undefined || sChartType === "Area";
							},
							target: ["EntityType"],
							whiteList: {
								properties: [
									"Description",
									"vMeasures"  //virtual property
								]
							},
							appliesTo: ["Column"],
							links: {
								developer: [{
									href: "/topic/b8312a4adde54f33a89480dbe12d8632",
									text: function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_TABLE_CHART");
									}
								}]
							}
						},
						dataPointRating: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataPoint",
							target: ["EntityType"],
							links: {
								developer: [{
									href: "/topic/a797173b84724ef1bc54d59dc575e52f",
									text:  function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_TABLE_RATING");
									}
								}]
							},
							whiteList: {
								properties: ["Value", "TargetValue", "Title"],
								expressionTypes: {
									Value: ["Path"],
									TargetValue: ["Path", "String", "Int", "Decimal"]
								}
							},
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_RATING;
							}
						},
						dataPointProgress: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataPoint",
							target: ["EntityType"],
							links: {
								developer: [{
									href: "/topic/43f6f0faa1b64c5aa92bcde379be9054",
									text:  function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_TABLE_PROGRESS");
									}
								}]
							},
							whiteList: {
								properties: ["Value", "TargetValue", "Title"],
								expressionTypes: {
									Value: ["Path"],
									TargetValue: ["Path", "String", "Int", "Decimal"]
								}
							},
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_PROGRESS;
							}
						},
						columnLabelOnProperty: { ignore: true },
						//columnVisible: {
						//	namespace: "com.sap.vocabularies.Common.v1",
						//	annotation: "FieldControl",
						//	target: ["Property"],
						//	whiteList: {
						//		values: ["Hidden"]
						//	},
						//	appliesTo: ["Column"],
						//	group: ["Behavior"],
						//	since: "1.28.1"
						//},
						//columnCurrencyCode: {
						//	namespace: "Org.OData.Measures.V1",
						//	annotation: "ISOCurrency",
						//	target: ["Property"],
						//	appliesTo: ["Column"],
						//	group: ["Behavior"],
						//	since: "1.28.1"
						//},
						//columnUnitOfMeasure: {
						//	namespace: "Org.OData.Measures.V1",
						//	annotation: "Unit",
						//	target: ["Property"],
						//	appliesTo: ["Column"],
						//	group: ["Behavior"],
						//	since: "1.28.1"
						//},
						//columnUpperCase: {
						//	namespace: "com.sap.vocabularies.Common.v1",
						//	annotation: "IsUpperCase",
						//	target: ["Property"],
						//	defaultValue: "true",
						//	appliesTo: ["Column"],
						//	group: ["Behavior"],
						//	since: "1.28.1"
						//},

						contact: {
							namespace: "com.sap.vocabularies.Communication.v1",
							annotation: "Contact",
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType !== COLUMNTYPE_CONTACT;
							},
							target: ["EntityType"],
							whiteList: {
								properties: [
									"fn", "n", "tel", "email", "photo", "title", "org", "role"
								]
							},
							appliesTo: ["Column"],
							links: {
								developer: [{
									href: "/topic/677fbde43a324f36aa9398b7f04e9896",
									text: "FE_SDK_GUIDE_TABLE_CONTACT"
								}]
							}
						},
						textArrangement: { ignore: true },
						columnImportance: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "Importance",
							target: ["Record"],
							appliesTo: ["Column"],
							ignore: function() {
								var sColumnType = DesigntimeUtils.getColumnType(oElement);
								return sColumnType === undefined;   // ==> break-out column
							},
							links: {
								developer: [
									{
										href: "/topic/69efbe747fc44c0fa445b24ed369cb1e",
										text: function() {
											return oResourceBundle.getText("FE_SDK_GUIDE_RESPONSIVENESS");
										}
									}, {
										href: "/api/sap.ui.comp.smarttable.SmartTable/annotations/Importance",
										text: function() {
											return oResourceBundle.getText("FE_API_SMART_TABLE_ANNOTATIONS");
										}
									}
								]
							}
						}
						//columnIsImageURL: {
						//	namespace: "com.sap.vocabularies.UI.v1",
						//	annotation: "IsImageURL",
						//	defaultValue: "false",
						//	target: ["Property"],
						//	appliesTo: ["SmartTable/customData/p13nData"],
						//	links: {
						//		developer: [{
						//			href: "/topic/492bc791a7bd41cd9932fdf5d3aa2656",
						//			text: function() {
						//				return oResourceBundle.getText("FE_SDK_GUIDE_IMAGES");
						//			}
						//		}, {
						//			href: "/api/sap.ui.comp.smarttable.SmartTable/annotations/IsImageURL",
						//			text: function() {
						//				return oResourceBundle.getText("FE_API_SMART_TABLE_ANNOTATIONS");
						//			}
						//		}]
						//	}
						//}
					}
				};
			}
		};

		return oColumnDesigntime;
	});
