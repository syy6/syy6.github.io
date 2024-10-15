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
	"sap/base/Log"
], function(CompLibrary, MicroChartLibrary, Control, CountMode, SmartMicroChartCommons, DateFormat, mobileLibrary, Log) {
	"use strict";

	// shortcut for sap.m.Size
	var Size = mobileLibrary.Size;

	/**
	 * Constructor for a new sap.ui.comp.smartmicrochart.SmartStackedBarMicroChart.
	 *
	 * @param {string}
	 *          [sId] id for the new control, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new control
	 * @class The SmartStackedBarMicroChart control creates a StackedBarMicroChart based on OData metadata and the configuration
	 *        specified. The <code>entitySet</code> property is required. The entity set you specify in this property is used
	 *        to fetch OData metadata and to generate the micro chart's UI. This property can also be used to fetch actual chart data.<br>
	 *        <b><i>Note:</i></b><br>
	 *        Most properties are not dynamic and cannot be changed, once the control has been
	 *        initialised.
	 * @extends sap.ui.core.Control
	 * @version 1.60.42
	 * @since 1.58
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartStackedBarMicroChart
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartStackedBarMicroChart = Control.extend("sap.ui.comp.smartmicrochart.SmartStackedBarMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartStackedBarMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartStackedBarMicroChart.designtime",
			properties: {

				/**
				 * The OData entity set bound to the smart stacked bar micro chart.<br>
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
					defaultValue: "BarStacked"
				},

				/**
				 * This property can be used to specify a relative path (without '/') to an entity set (not a single entity)
				 * that is used during the binding of the chart.<br>
				 * For example, it can be a navigation property which will be added to the context path.<br>
				 * If not specified, the <code>entitySet</code> property is used instead.
				 */
				chartBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If this property is set to <code>true</code>, the width and height of the control are determined by the width and height of the container where the smart stacked bar micro chart is included.
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
				 * This private aggregation is used for the internal binding of the sap.suite.ui.microchart.StackedBarMicroChart
				 */
				_chart: {
					type: "sap.suite.ui.microchart.StackedBarMicroChart",
					multiple: false,
					visibility: "hidden"
				},
				/**
				 * This private aggregation is used for the internal binding of the chart text, description and unit of measure values in case the value is provided via ODataModel
				 */
				_chartTexts: {
					type: "sap.m.ListBase",
					multiple: false,
					visibility: "hidden"
				}
			},
			associations: {
				/**
				 * If the associated control is provided, its Text property is set to the Title property of the Chart annotation.
				 * Title property of the DataPoint annotation is ignored.
				 */
				chartTitle: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its Text property is set to the Description property of the Chart annotation.
				 * Description property of the DataPoint annotation is ignored.
				 */
				chartDescription: {
					type: "sap.m.Label",
					group: "Misc",
					multiple: false
				},
				/**
				 * If the associated control is provided, its Text property is set to the Unit of Measure. The Value property of the DataPoint annotation should be annotated with this Unit of Measure. It can be either ISOCurrency or Unit from the OData Measures annotations.
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

	SmartStackedBarMicroChart._CHART_TYPE = ["BarStacked"];

	SmartStackedBarMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "BarStacked", true);
		this.setAggregation("_chart", new MicroChartLibrary.StackedBarMicroChart(), true);
	};

	SmartStackedBarMicroChart.prototype.onBeforeRendering = function() {
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

	SmartStackedBarMicroChart.prototype.exit = function() {
		SmartMicroChartCommons._cleanup.call(this); // Clean up the instances which were created in SmartMicroChartCommons
	};

	SmartStackedBarMicroChart.prototype.setEntitySet = function(sEntitySetName) {
		if (this.getProperty("entitySet") !== sEntitySetName) {
			this.setProperty("entitySet", sEntitySetName, true);
			SmartMicroChartCommons._initializeMetadata.call(this);
		}
		return this;
	};

	SmartStackedBarMicroChart.prototype.addAriaLabelledBy = function (vAriaLabelledBy) {
		this.addAssociation("ariaLabelledBy", vAriaLabelledBy, true);
		this.getAggregation("_chart").addAriaLabelledBy(vAriaLabelledBy);
		return this;
	};

	SmartStackedBarMicroChart.prototype.removeAriaLabelledBy = function (vAriaLabelledBy) {
		this.removeAssociation("ariaLabelledBy", vAriaLabelledBy, true);
		this.getAggregation("_chart").removeAriaLabelledBy(vAriaLabelledBy);
		return this;
	};

	SmartStackedBarMicroChart.prototype.removeAllAriaLabelledBy = function () {
		this.removeAllAssociation("ariaLabelledBy", true);
		this.getAggregation("_chart").removeAllAriaLabelledBy();
		return this;
	};

	/**
	 * @returns {sap.ui.comp.smartmicrochart.SmartStackedBarMicroChart} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartStackedBarMicroChart.prototype.setChartType = function() {
		return this;
	};

	/**
	 * Calls propagateProperties of Control and initializes the metadata afterwards.
	 * @private
	 */
	SmartStackedBarMicroChart.prototype.propagateProperties = function() {
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
	SmartStackedBarMicroChart.prototype._getBindingPath = function() {
		if (this.getChartBindingPath()) {
			return this.getChartBindingPath();
		} else if (this.getEntitySet()) {
			return "/" + this.getEntitySet();
		} else {
			return "";
		}
	};


	/**
	 * Checks if the medatada is correct and fills the aggregations of the contained StackedBarMicroChart.
	 * @private
	 */
	SmartStackedBarMicroChart.prototype._createAndBindInnerChart = function() {
		if (!(this._oDataPointAnnotations.Value && this._oDataPointAnnotations.Value.Path)) {
			Log.error("Value DataPoint annotation missing! Cannot create the SmartStackedBarMicroChart");
			return;
		}

		var oChart = this.getAggregation("_chart"),
			oBarTemplate = new MicroChartLibrary.StackedBarMicroChartBar({
				value: {
					path: this._oDataPointAnnotations.Value.Path,
					type: "sap.ui.model.odata.type.Decimal"
				}
			});

		if (this._oDataPointAnnotations.Criticality && this._oDataPointAnnotations.Criticality.Path) {
			oBarTemplate.bindProperty("valueColor", this._oDataPointAnnotations.Criticality.Path);
		}

		var oAnnotation = SmartMicroChartCommons._getPropertyAnnotation.call(this, this._oDataPointAnnotations.Value.Path);
		var oDisplayValue = oAnnotation["com.sap.vocabularies.Common.v1.Text"];
		if (oDisplayValue && oDisplayValue.Path) {
			oBarTemplate.bindProperty("displayValue", oDisplayValue.Path);
		}

		oChart.bindAggregation("bars", {
			path: this._getBindingPath(),
			template: oBarTemplate,
			events: {
				change: this._onBindingDataChange.bind(this)
			}
		});
	};


	/**
	 * Updates the associations and chart labels when binding data changed.
	 * @private
	 */
	SmartStackedBarMicroChart.prototype._onBindingDataChange = function() {
		var oBarsBinding = this.getAggregation("_chart").getBinding("bars");
		this._updateAssociations(oBarsBinding);
	};

	/**
	 * Updates all associations based on the data of the first bound entity.
	 * @param {object} oBarsBinding The binding info of the bars
	 * @private
	 */
	SmartStackedBarMicroChart.prototype._updateAssociations = function(oBarsBinding) {
		var oContext = oBarsBinding.getContexts(0, 1)[0],
			oData = oContext && oContext.getObject();

		SmartMicroChartCommons._updateAssociations.call(this, oData);
	};

	/**
	 * Gets the supported types of ChartType in Chart annotation.
	 * @returns {array} Chart types
	 * @private
	 */
	SmartStackedBarMicroChart.prototype._getSupportedChartTypes = function() {
		return SmartStackedBarMicroChart._CHART_TYPE;
	};


	SmartStackedBarMicroChart.prototype.getAccessibilityInfo = function() {
		return SmartMicroChartCommons._getAccessibilityInfo.apply(this);
	};

	return SmartStackedBarMicroChart;
});
