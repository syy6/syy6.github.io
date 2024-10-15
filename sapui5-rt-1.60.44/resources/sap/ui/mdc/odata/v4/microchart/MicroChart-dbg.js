/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define("sap/ui/mdc/odata/v4/microchart/MicroChart", [
		'sap/base/Log',
		'sap/ui/mdc/XMLComposite',
		'sap/m/library'
	], function(Log, XMLComposite, mobilelibrary) {
		"use strict";

	// shortcut for sap.m.ValueColor
	var ValueColor = mobilelibrary.ValueColor;

		/**
		 * @extends sap.ui.mdc.XMLComposite
		 * @author SAP SE
		 * @experimental
		 * @since 1.60
		 * @alias sap.ui.mdc.odata.v4.microchart.Microchart
		 */
		var MicroChart = XMLComposite.extend("sap.ui.mdc.odata.v4.microchart.MicroChart", {
			metadata: {
				specialSettings: {
					metadataContexts: {
						defaultValue: "{ model: 'chartAnnotationModel', path:'',name: 'chartAnnotation'}"
					}
				},
				properties: {
					title: {
						type: "any",
						invalidate: "template"
					}
				},
				events: {},
				aggregations: {},
				publicMethods: []
			},
			alias: "this",
			fragment: "sap.ui.mdc.odata.v4.microchart.MicroChart"
		});

		MicroChart._helper = {
			/**
			 * Method to determine the criticality of the microchart
			 *
			 * @param {Object} [oDataPoint] Datapoint object read from the annotation
			 * @param {Object} [value] value object passed from fragment
			 * @returns {String} Returns criticality as expression binding
			 */
			getMicroChartColor: function(oDataPoint, value) {
				var sState = ValueColor.Neutral;
				if (oDataPoint) {
					if (oDataPoint.Criticality) {
						sState = MicroChart._helper._criticality(oDataPoint, value);
					} else if (oDataPoint.CriticalityCalculation) {
						sState = MicroChart._helper._criticalityCalculation(oDataPoint, value);
					} else {
						Log.warning("Returning the default value Neutral");
					}
				}
				return sState;
			},

			/**
			 * Method to do the calculation of criticality in case CriticalityCalculation present in the annotation
			 *
			 * The calculation is done by comparing a value to the threshold values relevant for the specified improvement direction.
			 * For improvement direction Target, the criticality is calculated using both low and high threshold values. It will be
			 * 
			 *	- Positive if the value is greater than or equal to AcceptanceRangeLowValue and lower than or equal to AcceptanceRangeHighValue
			 *	- Neutral if the value is greater than or equal to ToleranceRangeLowValue and lower than AcceptanceRangeLowValue OR greater than AcceptanceRangeHighValue and lower than or equal to ToleranceRangeHighValue
			 *	- Critical if the value is greater than or equal to DeviationRangeLowValue and lower than ToleranceRangeLowValue OR greater than ToleranceRangeHighValue and lower than or equal to DeviationRangeHighValue
			 *	- Negative if the value is lower than DeviationRangeLowValue or greater than DeviationRangeHighValue
			 * 
			 * For improvement direction Minimize, the criticality is calculated using the high threshold values. It is
			 * 	- Positive if the value is lower than or equal to AcceptanceRangeHighValue
			 * 	- Neutral if the value is greater than AcceptanceRangeHighValue and lower than or equal to ToleranceRangeHighValue
			 * 	- Critical if the value is greater than ToleranceRangeHighValue and lower than or equal to DeviationRangeHighValue
			 * 	- Negative if the value is greater than DeviationRangeHighValue
			 * 
			 * For improvement direction Maximize, the criticality is calculated using the low threshold values. It is
			 *
			 *	- Positive if the value is greater than or equal to AcceptanceRangeLowValue
			 *	- Neutral if the value is less than AcceptanceRangeLowValue and greater than or equal to ToleranceRangeLowValue
			 *	- Critical if the value is lower than ToleranceRangeLowValue and greater than or equal to DeviationRangeLowValue
			 *	- Negative if the value is lower than DeviationRangeLowValue
			 *
			 * Thresholds are optional. For unassigned values, defaults are determined in this order:
			 *
			 *	- For DeviationRange, an omitted LowValue translates into the smallest possible number (-INF), an omitted HighValue translates into the largest possible number (+INF)
			 *	- For ToleranceRange, an omitted LowValue will be initialized with DeviationRangeLowValue, an omitted HighValue will be initialized with DeviationRangeHighValue
			 *	- For AcceptanceRange, an omitted LowValue will be initialized with ToleranceRangeLowValue, an omitted HighValue will be initialized with ToleranceRangeHighValue
			 *
			 * @param {Object} [oDataPoint] Datapoint object read from the annotation
			 * @param {Object} [value] value object passed from fragment
			 * @returns {String} Returns criticality as expression binding
			 * @private
			 */
			_criticalityCalculation: function (oDataPoint, value) {
				var oCriticality = oDataPoint.CriticalityCalculation,
					sCriticalityDirection = oCriticality.ImprovementDirection && oCriticality.ImprovementDirection.$EnumMember,
					sToleranceHigh = typeof oCriticality.ToleranceRangeHighValue === 'object' ? +oCriticality.ToleranceRangeHighValue.$Decimal : oCriticality.ToleranceRangeHighValue,
					sToleranceLow = typeof oCriticality.ToleranceRangeLowValue === 'object' ? +oCriticality.ToleranceRangeLowValue.$Decimal : oCriticality.ToleranceRangeLowValue,
					sDeviationHigh = typeof oCriticality.DeviationRangeHighValue === 'object' ? +oCriticality.DeviationRangeHighValue.$Decimal : oCriticality.DeviationRangeHighValue,
					sDeviationLow = typeof oCriticality.DeviationRangeLowValue === 'object' ? +oCriticality.DeviationRangeLowValue.$Decimal : oCriticality.DeviationRangeLowValue,
					sAcceptanceHigh = typeof oCriticality.AcceptanceRangeHighValue === 'object' ? +oCriticality.AcceptanceRangeHighValue.$Decimal : oCriticality.AcceptanceRangeHighValue,
					sAcceptanceLow = typeof oCriticality.AcceptanceRangeLowValue === 'object' ? +oCriticality.AcceptanceRangeLowValue.$Decimal : oCriticality.AcceptanceRangeLowValue,
					sCriticalityExpression = ValueColor.Neutral;

				if (sCriticalityDirection === "com.sap.vocabularies.UI.v1.ImprovementDirectionType/Minimize") {
					if (typeof sAcceptanceHigh === 'number' && typeof sDeviationHigh === 'number' && typeof sToleranceHigh === 'number') {
						sCriticalityExpression = "{= %{" + value.$PropertyPath + "} <= " + sAcceptanceHigh + " ? '" + ValueColor.Good + "' : " +
							"(%{" + value.$PropertyPath + "} <= " + sDeviationHigh + " ? " +
							"(%{" + value.$PropertyPath + "} > " + sToleranceHigh + " ? '" + ValueColor.Critical + "' : '" + ValueColor.Neutral + "') : '" + ValueColor.Error + "') }";
					} else {
						if (typeof sAcceptanceHigh === 'number' && typeof sToleranceHigh === 'number') {
							sCriticalityExpression = "{= %{" + value.$PropertyPath + "} <= " + sAcceptanceHigh + " ? '" + ValueColor.Good + "' : " +
								"%{" + value.$PropertyPath + "}  <= " + sToleranceHigh + " ? '" + ValueColor.Neutral + "' : '" + ValueColor.Critical + "' }";
						} else if (typeof sAcceptanceHigh === 'number' && typeof sDeviationHigh === 'number') {
							sCriticalityExpression = "{= %{" + value.$PropertyPath + "} <= " + sAcceptanceHigh + " ? '" + ValueColor.Good + "' : " +
								"%{" + value.$PropertyPath + "}  <= " + sDeviationHigh + " ? '" + ValueColor.Neutral + "' : '" + ValueColor.Error + "' }";
						} else if (typeof sToleranceHigh === 'number' && typeof sDeviationHigh === 'number') {
							sCriticalityExpression = "{= %{" + value.$PropertyPath + "} <= " + sToleranceHigh + " ? '" + ValueColor.Good + "' : " +
								"%{" + value.$PropertyPath + "}  <= " + sDeviationHigh + " ? '" + ValueColor.Critical + "' : '" + ValueColor.Error + "' }";
						}
					}

				} else if (sCriticalityDirection === "com.sap.vocabularies.UI.v1.ImprovementDirectionType/Maximize") {
					if (typeof sDeviationLow === 'number' && typeof sAcceptanceLow === 'number' && typeof sToleranceLow === 'number') {
						sCriticalityExpression = "{= %{" + value.$PropertyPath + "} >= " + sAcceptanceLow + " ? '" + ValueColor.Good + "' : " +
							"(%{" + value.$PropertyPath + "} >= " + sDeviationLow + " ? " +
							"(%{" + value.$PropertyPath + "} >= " + sToleranceLow + " ? '" + ValueColor.Neutral + "' : '" + ValueColor.Critical + "') : '" + ValueColor.Error + "') }";
					} else {
						if (typeof sAcceptanceLow === 'number' && typeof sToleranceLow === 'number') {
							sCriticalityExpression = "{= %{" + value.$PropertyPath + "} >= " + sAcceptanceLow + " ? '" + ValueColor.Good + "' : " +
								"%{" + value.$PropertyPath + "}  >= " + sToleranceLow + " ? '" + ValueColor.Neutral + "' : '" + ValueColor.Critical + "' }";
						} else if (typeof sAcceptanceLow === 'number' && typeof sDeviationLow === 'number') {
							sCriticalityExpression = "{= %{" + value.$PropertyPath + "} >= " + sAcceptanceLow + " ? '" + ValueColor.Good + "' : " +
								"%{" + value.$PropertyPath + "}  >= " + sDeviationLow + " ? '" + ValueColor.Neutral + "' : '" + ValueColor.Error + "' }";
						} else if (typeof sToleranceLow === 'number' && typeof sDeviationLow === 'number') {
							sCriticalityExpression = "{= %{" + value.$PropertyPath + "} >= " + sToleranceLow + " ? '" + ValueColor.Good + "' : " +
								"%{" + value.$PropertyPath + "}  >= " + sDeviationLow + " ? '" + ValueColor.Critical + "' : '" + ValueColor.Error + "' }";
						}
					}

				} else if (sCriticalityDirection === 'com.sap.vocabularies.UI.v1.ImprovementDirectionType/Target') {
					if (typeof sDeviationLow === 'number' && typeof sDeviationHigh === 'number' && typeof sToleranceLow === 'number' && typeof sToleranceHigh === 'number' && typeof sAcceptanceLow === 'number' && typeof sAcceptanceHigh === 'number') {
						sCriticalityExpression = "{= %{" + value.$PropertyPath + "} < " + sDeviationLow + " ? '" + ValueColor.Error + "' : " +
							"(%{" + value.$PropertyPath + "} > " + sDeviationHigh + " ? '" + ValueColor.Error + "' : " +
							"(%{" + value.$PropertyPath + "} >= " + sToleranceLow + " && %{" + value.$PropertyPath + "} <= " + sToleranceHigh + " ? " +
							"(%{" + value.$PropertyPath + "} >= " + sAcceptanceLow + " && %{" + value.$PropertyPath + "} <= " + sAcceptanceHigh + " ? '" + ValueColor.Good + "' : '" + ValueColor.Neutral + "') : '" + ValueColor.Critical + "')) }";
					} else {
						if (typeof sToleranceLow === 'number' && typeof sToleranceHigh === 'number' && typeof sAcceptanceLow === 'number' && typeof sAcceptanceHigh === 'number') {
							sCriticalityExpression = "{= %{" + value.$PropertyPath + "} < " + sToleranceLow + " ? '" + ValueColor.Critical + "' : " +
								"(%{" + value.$PropertyPath + "} > " + sToleranceHigh + " ? '" + ValueColor.Critical + "' : " +
								"(%{" + value.$PropertyPath + "} >= " + sAcceptanceLow + " && %{" + value.$PropertyPath + "} <= " + sAcceptanceHigh + " ? '" + ValueColor.Good + "' : '" + ValueColor.Neutral + "')) }";
						}
						if (typeof sDeviationLow === 'number' && typeof sDeviationHigh === 'number' && typeof sAcceptanceLow === 'number' && typeof sAcceptanceHigh === 'number') {
							sCriticalityExpression = "{= %{" + value.$PropertyPath + "} < " + sDeviationLow + " ? '" + ValueColor.Error + "' : " +
								"(%{" + value.$PropertyPath + "} > " + sDeviationHigh + " ? '" + ValueColor.Error + "' : " +
								"(%{" + value.$PropertyPath + "} >= " + sAcceptanceLow + " && %{" + value.$PropertyPath + "} <= " + sAcceptanceHigh + " ? '" + ValueColor.Good + "' : '" + ValueColor.Neutral + "')) }";
						}
						if (typeof sDeviationLow === 'number' && typeof sDeviationHigh === 'number' && typeof sToleranceLow === 'number' && typeof sToleranceHigh === 'number') {
							sCriticalityExpression = "{= %{" + value.$PropertyPath + "} < " + sDeviationLow + " ? '" + ValueColor.Error + "' : " +
								"(%{" + value.$PropertyPath + "} > " + sDeviationHigh + " ? '" + ValueColor.Error + "' : " +
								"(%{" + value.$PropertyPath + "} >= " + sToleranceLow + " && %{" + value.$PropertyPath + "} <= " + sToleranceHigh + " ? '" + ValueColor.Good + "' : '" + ValueColor.Critical + "')) }";
						}
					}

				} else {
					Log.warning("Case not supported, returning the default Value Neutral");
				}

				return sCriticalityExpression;
			},

			/**
			 * Method to do the calculation of criticality in case criticality is given in terms of constant/path
			 *
			 * @param {Object} [dataPoint] Datapoint object read from the annotation
			 * @param {Object} [value] value object passed from fragment
			 * @returns {String} Returns criticality as expression binding
			 * @private
			 */
			_criticality: function (dataPoint, value) {
				var sCriticalityExpression = ValueColor.Neutral,
					oCriticalityProperty = dataPoint.Criticality,
					sCriticalityPath;
				if (oCriticalityProperty) {
					if (oCriticalityProperty.$Path) {
						sCriticalityPath = oCriticalityProperty.$Path;
						sCriticalityExpression = "{= (${" + sCriticalityPath + "} === 'Negative' || ${" + sCriticalityPath + "} === '1' || ${" + sCriticalityPath + "} === 1 ) ? '" + ValueColor.Error + "' : " +
							"(${" + sCriticalityPath + "} === 'Critical' || ${" + sCriticalityPath + "} === '2' || ${" + sCriticalityPath + "} === 2 ) ? '" + ValueColor.Critical + "' : " +
							"(${" + sCriticalityPath + "} === 'Positive' || ${" + sCriticalityPath + "} === '3' || ${" + sCriticalityPath + "} === 3 ) ? '" + ValueColor.Good + "' : '" + ValueColor.Neutral + "'}";
					} else if (oCriticalityProperty.$EnumMember) {
						sCriticalityExpression = this._getCriticalityFromEnum(oCriticalityProperty.$EnumMember);
					} else {
						Log.warning("Case not supported, returning the default Value Neutral");
					}
				} else {
					Log.warning("Case not supported, returning the default Value Neutral");
				}
				return sCriticalityExpression;
			},

			/**
			 * This function returns the criticality indicator from annotations if criticality is EnumMember
			 *
			 * @param {sCriticality} criticality provided in the annotations
			 * @return {sIndicator} return the indicator for criticality
			 * @private
			 */
			_getCriticalityFromEnum: function (sCriticality) {
				var sIndicator;
				if (sCriticality === 'com.sap.vocabularies.UI.v1.CriticalityType/Negative') {
					sIndicator = ValueColor.Error;
				} else if (sCriticality === 'com.sap.vocabularies.UI.v1.CriticalityType/Positive') {
					sIndicator = ValueColor.Good;
				} else if (sCriticality === 'com.sap.vocabularies.UI.v1.CriticalityType/Critical') {
					sIndicator = ValueColor.Critical;
				} else {
					sIndicator = ValueColor.Neutral;
				}
				return sIndicator;
			}
		};

		return MicroChart;
	}, /* bExport= */true
);