sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/generic/template/changeHandler/util/AnnotationChangeUtilsV2",
	"sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils"
], function(jQuery, AnnotationChangeUtils, ChangeHandlerUtils) {
	"use strict";

	var DesigntimeUtils = {},

		DATAPOINT = "com.sap.vocabularies.UI.v1.DataPoint",
		DATAFIELD = "com.sap.vocabularies.UI.v1.DataField",
		CHART = "com.sap.vocabularies.UI.v1.Chart",
		FIELDGROUP = "com.sap.vocabularies.UI.v1.FieldGroup",
		LINEITEM = "com.sap.vocabularies.UI.v1.LineItem",
		CONTACT = "com.sap.vocabularies.Communication.v1.Contact",
		DATAFIELDWITHURL = "com.sap.vocabularies.UI.v1.DataFieldWithUrl",
		DATAFIELDFORANNOTATION = "com.sap.vocabularies.UI.v1.DataFieldForAnnotation",
		DATAFIELDFORACTION = "com.sap.vocabularies.UI.v1.DataFieldForAction",
		INTENTBASEDNAV = "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation",
		MEASURE_ROLE_TYPE = "com.sap.vocabularies.UI.v1.ChartMeasureRoleType",
		COLUMNTYPE_DATAFIELD = "Datafield",
		COLUMNTYPE_CONNECTEDFIELDS = "ConnectedFields",
		COLUMNTYPE_CHART = "Chart",
		COLUMNTYPE_RATING = "RatingIndicator",
		COLUMNTYPE_PROGRESS = "ProgressIndicator",
		COLUMNTYPE_CONTACT = "Contact",
		COLUMNTYPE_INTENTBASEDNAV = "DataFieldWithIntentBasedNavigation",
		COLUMNTYPE_DATAFIELDFORACTION = "DataFieldForAction",
		COLUMNTYPE_DATAFIELDWITHURL = "DatafieldWithUrl",
		COLUMNTYPE_TOOLBARBUTTON = "ToolbarButton";

	/**
	 * Looks for a DataPoint based on the given annotation path.
	 * If found, updates its values.
	 * If not found: creates a new one
	 *
	 * @param {string} sTarget EntityType of the ODataMetaModel as string
	 * @param {object} oEntityType EntityType of the ODataMetaModel as object
	 * @param {string} oNewMeasure The new record of virtual property vMeasures
	 * @param {object} aCustomChanges The array of annotation changes, to be extended by this method
	 * @public
	 */
	DesigntimeUtils.modifyDataPointForChart = function(sTarget, oEntityType, oNewMeasure, aCustomChanges) {

		var oNewDataPoint = {},
			oCustomChange = {},
			oOldDataPoint;

		var sAnnotationPath = oNewMeasure.DataPointAnnotationPath && oNewMeasure.DataPointAnnotationPath.value;
		if (sAnnotationPath) {
			oNewDataPoint = oNewMeasure.DataPoint;
			if (oNewDataPoint) {
				var sQualifier = sAnnotationPath.split("#").reverse()[0];
				var sDataPoint = sQualifier ? DATAPOINT + "#" + sQualifier : DATAPOINT;
				oOldDataPoint = oEntityType[sDataPoint];
				oCustomChange = AnnotationChangeUtils.createCustomAnnotationTermChange(sTarget, oNewDataPoint, oOldDataPoint, sDataPoint);
				aCustomChanges.push(oCustomChange);
			}
		}
	};

	/**
	 * Creates a new DataPoint for a column
	 *
	 * @param {sap.m.Column} oColumn The given table column
	 * @param {string} sQualifier The qualifier of the new datapoint
	 * @param {string} sTargetValue The target value for the DataPoint
	 * @returns {object} The new data point
	 * @public
	 */
	DesigntimeUtils.createNewDataPointForColumn = function(oColumn, sQualifier, sTargetValue) {
		var sVisualization = "com.sap.vocabularies.UI.v1.VisualizationType/" + sQualifier,
			oRecord = ChangeHandlerUtils.getLineItemRecordForColumn(oColumn);

		var oNewDataPoint = {
			TargetValue: { String: sTargetValue },
			Visualization: { EnumMember: sVisualization },
			RecordType: DATAPOINT + "Type",
			Title: { String: sQualifier }
		};

		if (oRecord && oRecord.Value && oRecord.Value.Path && (oRecord.RecordType === DATAFIELD ||
			oRecord.RecordType === INTENTBASEDNAV || oRecord.RecordType === DATAFIELDWITHURL)) {
			oNewDataPoint.Value = {
				Path: oRecord.Value.Path
			};
		}

		return oNewDataPoint;
	};

	/**
	 * Create a new column object.
	 *
	 * @param {string} sRecordType The type of the collection record
	 * @param {object} oOldRecord Old record of the collection with its content
	 * @returns {object} The new collection record
	 * @public
	 */
	DesigntimeUtils.createNewColumn = function(sRecordType, oOldRecord) {

		var sProperty,
			oAbstractRecordTemplate = {
				Label: {},
				Criticality: {},
				CriticalityRepresentation: {},
				IconUrl: {}
			},
			oRecordTemplate = {};
		oRecordTemplate[DATAFIELD] = jQuery.extend({}, oAbstractRecordTemplate,
			{
				Value: { Path: "" }
			});
		oRecordTemplate[DATAFIELDWITHURL] = jQuery.extend({}, oAbstractRecordTemplate,
			{
				Value: { Path: "" },
				Url: { String: "" }
			});
		oRecordTemplate[DATAFIELDFORANNOTATION] = jQuery.extend({}, oAbstractRecordTemplate,
			{
				Target: { Path: "" }
			});
		oRecordTemplate[DATAFIELDFORACTION] = jQuery.extend({}, oAbstractRecordTemplate,
			{
				Inline: { Bool: "true" },
				Determining: { Bool: "false" },
				Action: { String: "" },
				InvocationGrouping: {}
			});
		oRecordTemplate[INTENTBASEDNAV] = jQuery.extend({}, oAbstractRecordTemplate,
			{
				Action: { String: "" },
				Value: { Path: "" },
				SemanticObject: { String: "" }
			});

		var oNewRecord = {
			"com.sap.vocabularies.UI.v1.Importance": {
				"EnumMember": "com.sap.vocabularies.UI.v1.ImportanceType/High"
			},
			"RecordType": sRecordType,
			"EdmType": "Edm.String"
		};
		jQuery.extend(true, oNewRecord, oRecordTemplate[sRecordType]);

		// Take over values from old record. If there is no such content, eliminate the empty property
		for (sProperty in oNewRecord) {
			if (sProperty !== "RecordType" && oOldRecord && oOldRecord[sProperty]) {
				jQuery.extend(oNewRecord[sProperty], oOldRecord[sProperty]);
			}
			if (jQuery.isEmptyObject(oNewRecord[sProperty])) {
				delete oNewRecord[sProperty];
			}
		}

		return oNewRecord;
	};

	/**
	 * Retrieves a list of possible values of the column type property, e.g. for filling a drop-down in the UI.
	 *
	 * @returns {object} An object comprising the values (as a technical key) and their labels (displayName)
	 * @public
	 */
	DesigntimeUtils.getColumnTypeValues = function() {
		// oElement.getParent().getMetadata().loadDesignTime(oElement).then(function(oParentDesignTimeMetadata) {
		// var sTableType = oParentDesignTimeMetadata.properties.tableType.get();   // deactivated as late feature
		var oValues = {
			Datafield: {
				displayName: "Data Field"
			},
			DatafieldWithUrl: {
				displayName: "Data Field with URL"
			},
			Contact: {
                displayName: "Contact"
            },
			DataFieldForAction: {
				displayName: "Inline Action"
			},
			DataFieldWithIntentBasedNavigation: {
				displayName: "Navigation Field"
			},
			ConnectedFields: {
				displayName: "Connected Fields"
			}
		};
		// if (sTableType === "GridTable") {
		oValues.RatingIndicator = {
			displayName: "Rating Indicator"
		};
		oValues.ProgressIndicator = {
			displayName: "Progress Indicator"
		};
		oValues.Chart = {
			displayName: "Chart"
		};
		//}

		return oValues;
		//});
	};

	/**
	 * Retrieves the current value of the column type property for a given column from
	 * various annotations.
	 *
	 * @param {object} oElement The UI5 element (in overlay mode)
	 * @returns {string} The technical key of the column type property, as comprised in the list of possible values
	 * @public
	 */
	DesigntimeUtils.getColumnType = function(oElement) {
		var oRecord = ChangeHandlerUtils.getLineItemRecordForColumn(oElement);
		var sColumnType,
			oDataPoint,
			sQualifier,
			oEntityType;

		if (oRecord) {
			switch (oRecord.RecordType) {
				case DATAFIELDFORACTION:
					if (oRecord.Inline && oRecord.Determining !== true) {
						sColumnType = COLUMNTYPE_DATAFIELDFORACTION;
					} else {
						sColumnType = COLUMNTYPE_TOOLBARBUTTON;
					}
					break;
				case DATAFIELDFORANNOTATION:
					var sAnnotationPath = oRecord.Target.AnnotationPath;
					if (sAnnotationPath) {
						if (sAnnotationPath.indexOf(DATAPOINT) >= 0) {
							oEntityType = ChangeHandlerUtils.getEntityTypeFromAnnotationPath(oElement, sAnnotationPath);
							var iQualifierIndex = sAnnotationPath.search("#");
							sQualifier = sAnnotationPath.substring(iQualifierIndex);
							var sDataPoint = sQualifier ? DATAPOINT + sQualifier : DATAPOINT;
							oDataPoint = oEntityType[sDataPoint];
							if (oDataPoint) {
								if (oDataPoint.Visualization.EnumMember === "com.sap.vocabularies.UI.v1.VisualizationType/Rating") {
									sColumnType = COLUMNTYPE_RATING;
								}
								if (oDataPoint.Visualization.EnumMember === "com.sap.vocabularies.UI.v1.VisualizationType/Progress") {
									sColumnType = COLUMNTYPE_PROGRESS;
								}
							}
						} else if (oRecord.Target.AnnotationPath.indexOf(CONTACT) >= 0) {
							sColumnType = COLUMNTYPE_CONTACT;
						} else if (oRecord.Target.AnnotationPath.indexOf(CHART) >= 0) {
							sColumnType = COLUMNTYPE_CHART;
						} else if (oRecord.Target.AnnotationPath.indexOf(FIELDGROUP) >= 0){
								sColumnType = COLUMNTYPE_CONNECTEDFIELDS;
						}
					}
					break;
				case INTENTBASEDNAV:
					sColumnType = COLUMNTYPE_INTENTBASEDNAV;
					break;

				case DATAFIELD:
					sColumnType = COLUMNTYPE_DATAFIELD;
					break;
				case DATAFIELDWITHURL:
					sColumnType = COLUMNTYPE_DATAFIELDWITHURL;
					break;
				default:
					break;
			}
		}
		return sColumnType;
	};

	/**
	 * Updates the value of the column type property for a given column by updating
	 * different annotations
	 *
	 * @param {sap.m.Column} oColumn The column element (in overlay mode)
	 * @param {string} sNewColumnType The new value for the columnType
	 * @returns{object} The change content, comprising old an new values of the columnType but also
	 *                  the implicitly changed annotations.
	 * @public
	 */
	DesigntimeUtils.setColumnType = function(oColumn, sNewColumnType) {

		var sOldValue = DesigntimeUtils.getColumnType(oColumn);
		if (sOldValue === sNewColumnType) {
			return;
		}

		var aCustomChanges = [],
			oCustomChange = {},
			oEntityType = {},
			sRecordType,
			sTerm,
			oDataPoint = {},
			sTarget = ChangeHandlerUtils.getEntityType(ChangeHandlerUtils.getComponent(oColumn));

		switch (sNewColumnType) {
			case COLUMNTYPE_DATAFIELD:
				sRecordType = DATAFIELD;
				break;
			case COLUMNTYPE_DATAFIELDWITHURL:
				sRecordType = DATAFIELDWITHURL;
				break;
			case COLUMNTYPE_DATAFIELDFORACTION:
				sRecordType = DATAFIELDFORACTION;
				break;
			case COLUMNTYPE_INTENTBASEDNAV:
				sRecordType = INTENTBASEDNAV;
				break;
			case COLUMNTYPE_CONNECTEDFIELDS:
			case COLUMNTYPE_CHART:
			case COLUMNTYPE_CONTACT:
				sRecordType = DATAFIELDFORANNOTATION;
				break;
			case COLUMNTYPE_RATING:
				oEntityType = ChangeHandlerUtils.getODataEntityType(ChangeHandlerUtils.getComponent(oColumn));
				sTerm = oEntityType && DATAPOINT.concat("#Rating");
				oDataPoint = oEntityType[sTerm];
				if (!oDataPoint) {
					oDataPoint = DesigntimeUtils.createNewDataPointForColumn(oColumn, "Rating", "4");
					oCustomChange = AnnotationChangeUtils.createCustomAnnotationTermChange(sTarget, oDataPoint, {}, sTerm);
					aCustomChanges.push(oCustomChange);
				}
				sRecordType = DATAFIELDFORANNOTATION;
				break;
			case COLUMNTYPE_PROGRESS:
				oEntityType = ChangeHandlerUtils.getODataEntityType(ChangeHandlerUtils.getComponent(oColumn));
				sTerm = DATAPOINT.concat("#Progress");
				oDataPoint = oEntityType && oEntityType[sTerm];
				if (!oDataPoint) {
					oDataPoint = DesigntimeUtils.createNewDataPointForColumn(oColumn, "Progress", "100");
					oCustomChange = AnnotationChangeUtils.createCustomAnnotationTermChange(sTarget, oDataPoint, {}, sTerm);
					aCustomChanges.push(oCustomChange);
				}
				sRecordType = DATAFIELDFORANNOTATION;
				break;
			default:
				break;
		}

		if (!sRecordType) {
			return;
		}

		var aOldLineItems = ChangeHandlerUtils.getLineItems(oColumn);
		var iLineItemRecordIndex = ChangeHandlerUtils.getLineItemRecordIndex(oColumn, aOldLineItems);
		if (iLineItemRecordIndex === -1) {
			throw "invalid index for old column";
		}
		var oOldLineItemRecord = aOldLineItems[iLineItemRecordIndex];
		var aNewLineItems = [];
		aNewLineItems.push.apply(aNewLineItems, aOldLineItems);

		var oNewColumn = DesigntimeUtils.createNewColumn(sRecordType, oOldLineItemRecord);
		switch (sNewColumnType) {
			case COLUMNTYPE_RATING:
				oNewColumn.Target = { AnnotationPath: "@" + DATAPOINT + "#Rating" };
				break;
			case COLUMNTYPE_PROGRESS:
				oNewColumn.Target = { AnnotationPath: "@" + DATAPOINT + "#Progress" };
				break;
			default:
				break;
		}
		aNewLineItems.splice(iLineItemRecordIndex, 1, oNewColumn);

		oCustomChange = AnnotationChangeUtils.createCustomAnnotationTermChange(sTarget, aNewLineItems, aOldLineItems, LINEITEM);
		aCustomChanges.push(oCustomChange);

		return aCustomChanges;
	};

	/**
	 * Retrieves the Chart from the ODataMetaModel that corresponds to the given column
	 *
	 * @param {sap.m.Column} oColumn The current column
	 * @returns {object} An object comprising the chart identifier and the right ODataEntityType
	 * @public
	 */
	DesigntimeUtils.getChartFromColumn = function(oColumn) {
		var oRecord = ChangeHandlerUtils.getLineItemRecordForColumn(oColumn),
			oChart;
		if (oRecord && oRecord.RecordType === DATAFIELDFORANNOTATION && oRecord.Target &&
			oRecord.Target.AnnotationPath.indexOf("Chart") >= 0) {

			var sQualifier = oRecord.Target.AnnotationPath.split("#").reverse()[0],
				sChart = sQualifier ? CHART + "#" + sQualifier : CHART,
				oDataEntityType = ChangeHandlerUtils.getEntityTypeFromAnnotationPath(oColumn, oRecord.Target.AnnotationPath);
			if (oDataEntityType) {
				oChart = {
					chartID: sChart,
					entityType: oDataEntityType
				};
			}
		}

		return oChart;
	};

	/**
	 * Retrieves the complex value of the vMeasures property for a given column.
	 * The complex types combines the information from the Measures and MeasureAttributes collections of a
	 * UI.Chart annotation
	 *
	 * @param {sap.m.Column} oColumn The current column
	 * @returns {object} An object comprising the values
	 * @public
	 */
	DesigntimeUtils.getMeasures = function(oColumn) {
		var oMeasure = {},
			aMeasures = [],
			sMeasure,
			sQualifier,
			bAttributesFound,
			oMeasureAttribute,
			sDataPoint,
			oDataPoint = {},
			oDataPointFromModel,
			oChart = {},
			oChartFromColumn = DesigntimeUtils.getChartFromColumn(oColumn),
			oChartFromModel = oChartFromColumn && oChartFromColumn.entityType[oChartFromColumn.chartID];

		if (oChartFromModel && oChartFromModel.Measures) {
			jQuery.extend(true, oChart, oChartFromModel);
			for ( var i = 0; i < oChart.Measures.length; i++ ) {
				sMeasure = oChart.Measures[i].PropertyPath;
				bAttributesFound = false;
				if (oChart.MeasureAttributes) {
					for (var j = 0; j < oChart.MeasureAttributes.length; j++) {
						oMeasureAttribute = oChart.MeasureAttributes[j];
						oDataPoint = {};
						if (oMeasureAttribute.Measure && oMeasureAttribute.Measure.PropertyPath === sMeasure) {
							bAttributesFound = true;
							if (oMeasureAttribute.DataPoint && oMeasureAttribute.DataPoint.AnnotationPath) {
								sQualifier = oMeasureAttribute.DataPoint.AnnotationPath.split("#").reverse()[0];
								sDataPoint = sQualifier ? DATAPOINT + "#" + sQualifier : DATAPOINT;
								oDataPointFromModel = oChartFromColumn.entityType[sDataPoint];
								if (oDataPointFromModel) {
									jQuery.extend(true, oDataPoint, oDataPointFromModel);
								}
							}
							oMeasure = {
								Measure: {
									value: oMeasureAttribute.Measure && oMeasureAttribute.Measure.PropertyPath
								},
								DataPointAnnotationPath: {
									value: oMeasureAttribute.DataPoint && oMeasureAttribute.DataPoint.AnnotationPath
								},
								DataPoint: oDataPoint
							};
							if (oMeasureAttribute.Role && oMeasureAttribute.Role.EnumMember) {
								switch (oMeasureAttribute.Role.EnumMember) {
									case "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis1":
										oMeasure.Role = {
											value: "Axis1"
										};
										break;
									case "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis2":
										oMeasure.Role = {
											value: "Axis2"
										};
										break;
									case "com.sap.vocabularies.UI.v1.ChartMeasureRoleType/Axis3":
										oMeasure.Role = {
											value: "Axis3"
										};
										break;
									default:
										break;
								}
							}
							aMeasures.push(oMeasure);
							break;
						}
					}
				}
				if (!bAttributesFound) {
					oMeasure = {
						Measure: oChart.Measures[i]
					};
					aMeasures.push(oMeasure);
				}
			}
		}
		return aMeasures;
	};

	/**
	 * Updates the value of the Measures and MeasureAttributes for a given column.
	 * Prerequisite: the chart annotation must exist, a new chart must have been created before.
	 *
	 * @param {sap.m.Column} oColumn The column element (in overlay mode)
	 * @param {object}[] aNewMeasures The new values for the virtual property vMeasures
	 * @returns{object} The change content, comprising the implicitly changed annotations.
	 * @public
	 */
	DesigntimeUtils.setMeasures = function(oColumn, aNewMeasures) {
		var i, j,
			sMeasure,
			bExists,
			oNewMeasure,
			sDataPointPath,
			aCustomChanges = [],
			oMeasureFromAttribute,
			oNewMeasureAttribute = {},
			oChartFromColumn = DesigntimeUtils.getChartFromColumn(oColumn),
			oChartOld = oChartFromColumn && oChartFromColumn.entityType && oChartFromColumn.entityType[oChartFromColumn.chartID],
			oChartNew = {};

		if (!oChartOld || jQuery.isEmptyObject(oChartOld) || !oChartFromColumn) {
			return aCustomChanges;
		}

		jQuery.extend(true, oChartNew, oChartOld);
		var sTarget = oChartFromColumn.entityType.namespace + "." + oChartFromColumn.entityType.name;

		// check for deletions
		if (oChartNew.Measures) {
			for (i = oChartNew.Measures.length - 1; i >= 0; i--) {
				bExists = false;
				sMeasure = oChartNew.Measures[i].PropertyPath;
				for (j = 0; j < aNewMeasures.length; j++) {
					if (aNewMeasures[j].Measure && aNewMeasures[j].Measure.value === sMeasure) {
						bExists = true;
						break;
					}
				}
				if (!bExists) {
					oChartNew.Measures.splice(i, 1);
					for (j = oChartNew.MeasureAttributes.length - 1; j >= 0; j--) {
						oMeasureFromAttribute = oChartNew.MeasureAttributes[j].Measure;
						if (oMeasureFromAttribute && oMeasureFromAttribute.PropertyPath ===  sMeasure) {
							oChartNew.MeasureAttributes.splice(j, 1);
							break;
						}
					}
				}
			}
		}
		// check for inserts or updates
		for (i = 0; i < aNewMeasures.length; i++) {
			oNewMeasure = aNewMeasures[i];
			bExists = false;

			if (oChartNew.MeasureAttributes) {
				for (j = 0; j < oChartNew.MeasureAttributes.length; j++) {
					oMeasureFromAttribute = oChartNew.MeasureAttributes[j].Measure;
					if (oNewMeasure.value && oNewMeasure.Measure && oMeasureFromAttribute && oMeasureFromAttribute.PropertyPath === oNewMeasure.Measure.value) {
						bExists = true;
						break;
					}
				}
			}
			if (oNewMeasure.DataPointAnnotationPath && oNewMeasure.DataPointAnnotationPath.value) {
				sDataPointPath = oNewMeasure.DataPointAnnotationPath.value;
			} else if (oNewMeasure.Measure) {   //implicitly derive qualifier from property
				sDataPointPath = "@" + DATAPOINT + "#" + oNewMeasure.Measure.value;
				oNewMeasure.DataPointAnnotationPath = {
					value: sDataPointPath
				};
			}
			oNewMeasureAttribute = {
				Measure: {
					PropertyPath: oNewMeasure.Measure.value
				},
				DataPoint: {
					AnnotationPath: sDataPointPath
				},
				RecordType: "com.sap.vocabularies.UI.v1.ChartMeasureAttributeType"
			};
			if (oNewMeasure.Role) {
				switch (oNewMeasure.Role.value) {
					case "Axis2":
						oNewMeasureAttribute.Role = {
							EnumMember: MEASURE_ROLE_TYPE + "/Axis2"
						};
						break;
					case "Axis3":
						oNewMeasureAttribute.Role = {
							EnumMember: MEASURE_ROLE_TYPE + "/Axis3"
						};
						break;
					default:
						oNewMeasureAttribute.Role = {
							EnumMember: MEASURE_ROLE_TYPE + "/Axis1"
						};
						break;
				}
			}
			if (!bExists) {
				if (!oChartNew.Measures) {
					oChartNew.Measures = [];
				}
				oChartNew.Measures.push({ PropertyPath: oNewMeasure.Measure.value });
				if (!oChartNew.MeasureAttributes) {
					oChartNew.MeasureAttributes = [];
				}
				oChartNew.MeasureAttributes.push(oNewMeasureAttribute);
			} else {
				oChartNew.MeasureAttributes[j] = oNewMeasureAttribute;
			}
			DesigntimeUtils.modifyDataPointForChart(sTarget, oChartFromColumn.entityType, oNewMeasure, aCustomChanges);
		}
		var oCustomChange = AnnotationChangeUtils.createCustomAnnotationTermChange(
			sTarget,
			oChartNew,
			oChartOld,
			oChartFromColumn.chartID
		);
		aCustomChanges.push(oCustomChange);

		return aCustomChanges;
	};

	DesigntimeUtils.addSettingsHandler = function(oTargetButton, mPropertyBag, aActions, sChangeHandler) {
		return new Promise(function(resolve, reject) {
				var oMetaModel = sap.ui.fl.Utils.getAppComponentForControl(oTargetButton).getModel().getMetaModel();
				var oEntityContainer = oMetaModel.getODataEntityContainer();
				var aFunctionImport = oEntityContainer.functionImport;

				var oExcludeFilter = {};

				var oModel = new sap.ui.model.json.JSONModel(aFunctionImport);

				var oDialog = sap.ui.xmlfragment("sap.suite.ui.generic.template.changeHandler.customSelectDialog.SelectDialog", this);
				oDialog.attachConfirm(function(oEvent) {
					var aContexts = oEvent.getParameter("selectedContexts");
					var aFunctionImports = [], sFunctionImport;
					for (var i = 0; i < aContexts.length; i++) {
						sFunctionImport = oEntityContainer.namespace + "." + oEntityContainer.name + "/" + aContexts[i].getObject().name;
						aFunctionImports[i] = {
							selectorControl : oTargetButton,
							changeSpecificData : {
								changeType : sChangeHandler,
								content : {
									newFunctionImport : sFunctionImport
								}
							}
						};
					}
					resolve(aFunctionImports);
				});
				oDialog.attachSearch(function(oEvent) {
					var sValue = oEvent.getParameter("value");
					var oSearchFilter = new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.Contains, sValue);
					var oFilter = new sap.ui.model.Filter({filters: [oSearchFilter, oExcludeFilter], and: true});
					var oBinding = oEvent.getSource().getBinding("items");
					oBinding.filter(oFilter);
				});

				oDialog.setModel(oModel);

				// exclude FunctionImports that are already represented on the UI
				var oBinding = oDialog.getBinding("items");
				var aExcludeFilters = [];
				for (var i in aActions) {
					var oCustomData = ChangeHandlerUtils.getCustomDataObject(aActions[i]);
					if (oCustomData && oCustomData.Action) {
						var sFunctionImportName = oCustomData.Action.substring(oCustomData.Action.lastIndexOf("/") + 1);
						aExcludeFilters.push(new sap.ui.model.Filter("name", sap.ui.model.FilterOperator.NE, sFunctionImportName));
					}
				}
				oExcludeFilter = new sap.ui.model.Filter({filters: aExcludeFilters, and: true});
				oBinding.filter(oExcludeFilter);

				oDialog.addStyleClass(mPropertyBag.styleClass);
				oDialog.open();
			});
	};

	return DesigntimeUtils;
});
