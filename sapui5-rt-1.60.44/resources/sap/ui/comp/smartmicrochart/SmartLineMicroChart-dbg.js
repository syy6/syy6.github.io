/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"sap/ui/comp/library",
	"sap/suite/ui/microchart/library",
	"sap/ui/core/Control",
	"sap/ui/model/odata/CountMode",
	"sap/ui/comp/smartmicrochart/SmartMicroChartCommons",
	"sap/ui/core/format/DateFormat",
	"sap/m/library",
	"sap/base/Log",
	"sap/suite/ui/microchart/LineMicroChart",
	"sap/suite/ui/microchart/LineMicroChartLine",
	"sap/suite/ui/microchart/LineMicroChartPoint",
	"sap/suite/ui/microchart/LineMicroChartEmphasizedPoint"
], function(CompLibrary, MicroChartLibrary, Control, CountMode, SmartMicroChartCommons, DateFormat, mobileLibrary,
			Log, LineMicroChart, LineMicroChartLine, LineMicroChartPoint, LineMicroChartEmphasizedPoint) {
	"use strict";

	// shortcut for sap.m.Size
	var Size = mobileLibrary.Size;

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartLineMicroChart.
	 *
	 * @param {string}
	 *          [sId] id for the new control, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new control
	 * @class The SmartLineMicroChart control creates a {@link sap.suite.ui.microchart.LineMicroChart LineMicroChart} based on OData metadata and the configuration
	 *        specified. <br>The <code>entitySet</code> property is required. The entity set you specify in this property is used
	 *        to fetch OData metadata and to generate the micro chart's UI. This property can also be used to fetch actual chart data.<br>
	 *        <b><i>Note:</i></b><br>
	 *        Most properties are not dynamic and cannot be changed, once the control has been
	 *        initialized.
	 * @extends sap.ui.core.Control
	 * @version 1.60.42
	 * @since 1.60
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartLineMicroChart
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartLineMicroChart = Control.extend("sap.ui.comp.smartmicrochart.SmartLineMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartLineMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartLineMicroChart.designtime",
			properties: {

				/**
				 * The OData entity set bound to the smart line micro chart.<br>
				 * This entity set is used to pull data into the micro chart and create its internal representation.<br>
				 * Please note that this property cannot be updated dynamically.
				 */
				entitySet: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Specifies the type of chart. Note that this property is read-only.
				 */
				chartType: {
					type: "string",
					group: "Misc",
					defaultValue: "Line"
				},

				/**
				 * This property can be used to specify a relative path (without '/') to an entity set (not a single entity)
				 * that is used during the binding of the chart.<br>
				 * For example, it can be a navigation property that will be added to the context path.<br>
				 * If not specified, the <code>entitySet</code> property is used instead.
				 */
				chartBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * Determines if any label is shown or not.
				 */
				showLabel: {
					type: "boolean",
					group: "Appearance",
					defaultValue: true
				},

				/**
				 * If this property is set to <code>true</code>, the width and height of the control are determined by the width and height of the container where the smart line micro chart is included.
				 * The size is no longer determined based on the device. The <code>width</code> and <code>height</code> properties are ignored.
				 */
				isResponsive: { type: "boolean", group: "Appearance", defaultValue: false },

				/**
				 * Defines the width.
				 */
				width: { type: "sap.ui.core.CSSSize", group: "Misc"},

				/**
				 * Defines the height.
				 */
				height: { type: "sap.ui.core.CSSSize", group: "Misc"}
			},
			defaultAggregation: "_chart",
			aggregations: {
				/**
				 * This private aggregation is used for the internal binding of the {@link sap.suite.ui.microchart.LineMicroChart}
				 */
				_chart: {
					type: "sap.suite.ui.microchart.LineMicroChart",
					multiple: false,
					visibility: "hidden"
				},
				/**
				 * This private aggregation is used for the internal binding of the chart text, its description, and unit of measurement values in case the value is provided via ODataModel.
				 */
				_chartTexts: {
					type: "sap.m.ListBase",
					multiple: false,
					visibility: "hidden"
				}
			},
			associations: {
				/**
				 * If the associated control is provided, its <code>Text</code> property is set to the <code>Title</code> property of the Chart annotation.
				 * The <code>Title</code> property of the DataPoint annotation is ignored.
				 */
				chartTitle: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its <code>Text</code> property is set to the <code>Description</code> property of the Chart annotation.
				 * The <code>Description</code> property of the DataPoint annotation is ignored.
				 */
				chartDescription: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its <code>Text</code> property is set to the <code>Unit of Measure</code> property of the Chart annotation.
				 * The <code>Value</code> property of the DataPoint annotation should be annotated with this unit of measurement. It can be either ISOCurrency or Unit from the OData Measures annotations.
				 */
				unitOfMeasure: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},

				/**
				 * Controls or IDs that label this control. Can be used by screen reader software.
				 * @since 1.60.0
				 */
				ariaLabelledBy: {
					type: "sap.ui.core.Control",
					multiple: true,
					singularName: "ariaLabelledBy"
				}
			},
			events: {

				/**
				 * This event is fired after the control has been initialized.
				 */
				initialize: {}
			}
		},
		renderer: "sap.ui.comp.smartmicrochart.SmartMicroChartRenderer"
	});

	SmartLineMicroChart._CHART_TYPE = ["Line"];

	SmartLineMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setAggregation("_chart",
			new LineMicroChart({
				showThresholdLine: false
			}
		), true);
	};

	SmartLineMicroChart.prototype.onBeforeRendering = function() {
		var oChart = this.getAggregation("_chart");

		if (this.getIsResponsive()) {
			oChart.setProperty("size", Size.Responsive, true);
			oChart.setProperty("width", null, true);
			oChart.setProperty("height", null, true);
		} else {
			oChart.setProperty("size", Size.Auto, true);
			oChart.setProperty("width", this.getWidth(), true);
			oChart.setProperty("height", this.getHeight(), true);
		}

		MicroChartLibrary._passParentContextToChild(this, oChart);
	};

	SmartLineMicroChart.prototype.exit = function() {
		SmartMicroChartCommons._cleanup.call(this); // Clean up the instances which were created in SmartMicroChartCommons
	};

	SmartLineMicroChart.prototype.setEntitySet = function(sEntitySetName) {
		if (this.getProperty("entitySet") !== sEntitySetName) {
			this.setProperty("entitySet", sEntitySetName, true);
			SmartMicroChartCommons._initializeMetadata.call(this);
		}
		return this;
	};

	SmartLineMicroChart.prototype.setShowLabel = function(bShowLabel) {
		var oChart;

		if (this.getShowLabel() !== bShowLabel) {
			oChart = this.getAggregation("_chart");
			this.setProperty("showLabel", bShowLabel, true);
			oChart.setProperty("showTopLabels", bShowLabel, true);
			oChart.setProperty("showBottomLabels", bShowLabel, true);
			oChart.invalidate();
		}
		return this;
	};

	SmartLineMicroChart.prototype.addAriaLabelledBy = function (vAriaLabelledBy) {
		this.addAssociation("ariaLabelledBy", vAriaLabelledBy, true);
		this.getAggregation("_chart").addAriaLabelledBy(vAriaLabelledBy);
		return this;
	};

	SmartLineMicroChart.prototype.removeAriaLabelledBy = function (vAriaLabelledBy) {
		this.removeAssociation("ariaLabelledBy", vAriaLabelledBy, true);
		this.getAggregation("_chart").removeAriaLabelledBy(vAriaLabelledBy);
		return this;
	};

	SmartLineMicroChart.prototype.removeAllAriaLabelledBy = function () {
		this.removeAllAssociation("ariaLabelledBy", true);
		this.getAggregation("_chart").removeAllAriaLabelledBy();
		return this;
	};

	/**
	 * @returns {sap.ui.comp.smartmicrochart.SmartLineMicroChart} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartLineMicroChart.prototype.setChartType = function() {
		return this;
	};

	/**
	 * Calls propagateProperties of Control and initializes the metadata afterwards.
	 * @private
	 */
	SmartLineMicroChart.prototype.propagateProperties = function() {
		if (Control.prototype.propagateProperties) {
			Control.prototype.propagateProperties.apply(this, arguments);
		}
		SmartMicroChartCommons._initializeMetadata.call(this);
	};

	/**
	 * Determines the chart's binding path used directly in the bindings for data points and thresholds.
	 * @returns {string} If the chartBindingPath property is set, it is returned. If no chartBindingPath is set,
	 *                   the path is constructed absolute from the entitySet property.
	 * @private
	 */
	SmartLineMicroChart.prototype._getBindingPath = function() {
		if (this.getChartBindingPath()) {
			return this.getChartBindingPath();
		} else if (this.getEntitySet()) {
			return "/" + this.getEntitySet();
		} else {
			return "";
		}
	};


	/**
	 * Checks if the medatada is correct and fills the aggregations of the contained LineMicroChart.
	 * @private
	 */
	SmartLineMicroChart.prototype._createAndBindInnerChart = function() {
		if (this._aDataPointAnnotations.length === 0) {
			Log.error("DataPoint annotation missing! Cannot create the SmartLineMicroChart");
			return;
		}

		for (var i = 0; i < this._aDataPointAnnotations.length; i++) {
			if (!(this._aDataPointAnnotations[i].Value && this._aDataPointAnnotations[i].Value.Path)) {
				Log.error("Value DataPoint annotation missing! Cannot create the SmartLineMicroChart");
				return;
			}
		}

		var oChart = this.getAggregation("_chart"),
			oLine;

		this._aDataPointAnnotations.forEach(function(oDataPoint, iIndex) {
			oLine = new LineMicroChartLine(this.getId() + "-line-" + iIndex, {
				points: {
					path: this._getBindingPath(),
					factory: this._pointFactory.bind(this),
					events: {
						change: this._onBindingDataChange.bind(this)
					}
				}
			});
			oChart.addLine(oLine);
		}, this);
	};

	SmartLineMicroChart.prototype._pointFactory = function(sId, oContext) {
		var x, y, oPoint,
			iLine = sId.split("-").slice(-2, -1), // retrieve index of the line from its id
			oLine = this.getAggregation("_chart").getLines()[iLine],
			oDataPointAnnotation = this._aDataPointAnnotations[iLine];

		x = oContext.getProperty(this._oChartViewMetadata.dimensionFields[iLine]);
		x = SmartMicroChartCommons._formatDimension.call(this, x);

		y = oContext.getProperty(oDataPointAnnotation.Value.Path);
		y = Number(y);

		// TODO factory fn for emphasized and color setting
		oPoint = new LineMicroChartPoint({
			x: x,
			y: y
		});

		if (oLine && oDataPointAnnotation.Criticality && oDataPointAnnotation.Criticality.Path) {
			this.getAggregation("_chart").getLines()[iLine].setColor(oContext.getProperty(oDataPointAnnotation.Criticality.Path));
		}

		return oPoint;
	};

	/**
	 * Updates the associations and chart labels when binding data changed.
	 * @private
	 */
	SmartLineMicroChart.prototype._onBindingDataChange = function() {
		var oPointsBinding = this.getAggregation("_chart").getLines()[0].getBinding("points");
		this._updateAssociations(oPointsBinding);
		SmartMicroChartCommons.updateChartLabels.call(this, oPointsBinding);
	};

	/**
	 * Updates all associations based on the data of the first bound entity.
	 * @param {object} oPointsBinding The binding info of the lines
	 * @private
	 */
	SmartLineMicroChart.prototype._updateAssociations = function(oPointsBinding) {
		var oContext = oPointsBinding.getContexts(0, 1)[0],
			oData = oContext && oContext.getObject();

		SmartMicroChartCommons._updateAssociations.call(this, oData);
	};

	/**
	 * Updates the label of the chart.
	 * @param {string} sName The name of the property to be updated.
	 * @param {object} oData A data object to be used for setting label texts directly.
	 * @private
	 */
	SmartLineMicroChart.prototype._updateLabel = function(sName, oData) {
		this.getAggregation("_chart").setProperty(sName, oData.text, true);
	};

	/**
	 * Gets the supported types of ChartType in Chart annotation.
	 * @returns {array} Chart types
	 * @private
	 */
	SmartLineMicroChart.prototype._getSupportedChartTypes = function() {
		return SmartLineMicroChart._CHART_TYPE;
	};

	/**
	 * Gets the mapping of the chart labels.
	 * @returns {object} Mapping of the chart labels
	 * @private
	 */
	SmartLineMicroChart.prototype._getLabelsMap = function() {
		return {
			"leftTop": "leftTopLabel",
			"rightTop": "rightTopLabel",
			"leftBottom": "leftBottomLabel",
			"rightBottom": "rightBottomLabel"
		};
	};

	SmartLineMicroChart.prototype.getAccessibilityInfo = function() {
		return SmartMicroChartCommons._getAccessibilityInfo.apply(this);
	};

	return SmartLineMicroChart;
});
