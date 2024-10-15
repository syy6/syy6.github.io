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
	 * Constructor for a new SmartComparisonMicroChart.
	 *
	 * @param {string}
	 *          [sId] id for the new control, generated automatically if no id is given
	 * @param {object}
	 *          [mSettings] initial settings for the new control
	 * @class The SmartComparisonMicroChart control creates a ComparisonMicroChart based on OData metadata and the configuration
	 *        specified. The <code>entitySet</code> property is required to use the control.
	 *        The entity set you specify in this property is used to feetch OData metadata and to generate the micro chart's UI.
	 *        This property can also be used to fetch actual data.<br>
	 *        <b><i>Notes:</i></b><br>
	 *        <ol><li>Most properties are not dynamic and cannot be changed, once the control has been
	 *        initialized.</li><li>
	 *        SmartComparisonMicroChart does not have its own ChartType/Enum annotation.
	 *        This means that ChartType annotation is not specified and SmartComparisonMicroChart cannot be created with a <code>SmartMicroChart</code>.</li></ol>
	 * @extends sap.ui.core.Control
	 * @version 1.60.42
	 * @since 1.58
	 * @constructor
	 * @public
	 * @alias sap.ui.comp.smartmicrochart.SmartComparisonMicroChart
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SmartComparisonMicroChart = Control.extend("sap.ui.comp.smartmicrochart.SmartComparisonMicroChart", /** @lends sap.ui.comp.smartmicrochart.SmartComparisonMicroChart.prototype */ {
		metadata: {

			library: "sap.ui.comp",
			designtime: "sap/ui/comp/designtime/smartmicrochart/SmartComparisonMicroChart.designtime",
			properties: {

				/**
				 * The OData entity set bound to the smart comparison micro chart. <br>
				 * This entity set is used to pull data into the micro chart and create its internal representation. <br>
				 * Please note that that this property cannot be updated dynamically.
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
					defaultValue: "Comparison"
				},

				/**
				 * This property can be used to specify a relative path (without '/') to an entity set (not a single entity)
				 * that is used during the binding of the chart. For example, it can be a navigation property which will be added to the context path.<br>
				 * If not specified, the <code>entitySet</code> property is used instead.
				 */
				chartBindingPath: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},

				/**
				 * If this property is set to <code>true</code>, the width and height of the control are determined
				 * by the width and height of the container where the smart commparison micro chart is included.
				 * The <code>width</code> and <code>height</code> properties are ignored in such case.
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
				 * This private aggregation is used for the internal binding of the {@link sap.suite.ui.microchart.ComparisonMicroChart}
				 */
				_chart: {
					type: "sap.suite.ui.microchart.ComparisonMicroChart",
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

	SmartComparisonMicroChart._CHART_TYPE = ["Comparison"]; // this type does not have equvalent in annotation ChartType/Enum

	SmartComparisonMicroChart.prototype.init = function() {
		this._bIsInitialized = false;
		this._bMetaModelLoadAttached = false;
		this.setProperty("chartType", "Comparison", true);
		this.setAggregation("_chart", new MicroChartLibrary.ComparisonMicroChart(), true);
	};

	SmartComparisonMicroChart.prototype.onBeforeRendering = function() {
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

	SmartComparisonMicroChart.prototype.exit = function() {
		SmartMicroChartCommons._cleanup.call(this); // Clean up the instances which were created in SmartMicroChartCommons
	};

	SmartComparisonMicroChart.prototype.setEntitySet = function(sEntitySetName) {
		if (this.getProperty("entitySet") !== sEntitySetName) {
			this.setProperty("entitySet", sEntitySetName, true);
			SmartMicroChartCommons._initializeMetadata.call(this);
		}
		return this;
	};

	SmartComparisonMicroChart.prototype.addAriaLabelledBy = function (vAriaLabelledBy) {
		this.addAssociation("ariaLabelledBy", vAriaLabelledBy, true);
		this.getAggregation("_chart").addAriaLabelledBy(vAriaLabelledBy);
		return this;
	};

	SmartComparisonMicroChart.prototype.removeAriaLabelledBy = function (vAriaLabelledBy) {
		this.removeAssociation("ariaLabelledBy", vAriaLabelledBy, true);
		this.getAggregation("_chart").removeAriaLabelledBy(vAriaLabelledBy);
		return this;
	};

	SmartComparisonMicroChart.prototype.removeAllAriaLabelledBy = function () {
		this.removeAllAssociation("ariaLabelledBy", true);
		this.getAggregation("_chart").removeAllAriaLabelledBy();
		return this;
	};

	/**
	 * @returns {sap.ui.comp.smartmicrochart.SmartComparisonMicroChart} Reference to 'this' in order to allow method chaining.
	 * @private
	 */
	SmartComparisonMicroChart.prototype.setChartType = function() {
		return this;
	};

	/**
	 * Calls propagateProperties of Control and initializes the metadata afterwards.
	 * @private
	 */
	SmartComparisonMicroChart.prototype.propagateProperties = function() {
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
	SmartComparisonMicroChart.prototype._getBindingPath = function() {
		if (this.getChartBindingPath()) {
			return this.getChartBindingPath();
		} else if (this.getEntitySet()) {
			return "/" + this.getEntitySet();
		} else {
			return "";
		}
	};


	/**
	 * Checks if the medatada is correct and fills the aggregations of the contained ComparisonMicroChart.
	 * @private
	 */
	SmartComparisonMicroChart.prototype._createAndBindInnerChart = function() {
		if (!(this._oDataPointAnnotations.Value && this._oDataPointAnnotations.Value.Path)) {
			Log.error("Value DataPoint annotation missing! Cannot create the SmartComparisonMicroChart");
			return;
		}

		var oChart = this.getAggregation("_chart"),
			oBarTemplate = new MicroChartLibrary.ComparisonMicroChartData({
				value: {
					path: this._oDataPointAnnotations.Value.Path,
					type: "sap.ui.model.odata.type.Decimal"
				}
			});

		if (this._oDataPointAnnotations.Criticality && this._oDataPointAnnotations.Criticality.Path) {
			oBarTemplate.bindProperty("color", this._oDataPointAnnotations.Criticality.Path);
		}

		if (this._oDataPointAnnotations.Title && this._oDataPointAnnotations.Title.Path) {
			oBarTemplate.bindProperty("title", this._oDataPointAnnotations.Title.Path);
		}

		var oAnnotation = SmartMicroChartCommons._getPropertyAnnotation.call(this, this._oDataPointAnnotations.Value.Path);
		var oDisplayValue = oAnnotation["com.sap.vocabularies.Common.v1.Text"];
		if (oDisplayValue && oDisplayValue.Path) {
			oBarTemplate.bindProperty("displayValue", oDisplayValue.Path);
		}

		oChart.bindAggregation("data", {
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
	SmartComparisonMicroChart.prototype._onBindingDataChange = function() {
		var oDataBinding = this.getAggregation("_chart").getBinding("data");
		this._updateAssociations(oDataBinding);
	};

	/**
	 * Updates all associations based on the data of the first bound entity.
	 * @param {object} oDataBinding The binding info of the bars
	 * @private
	 */
	SmartComparisonMicroChart.prototype._updateAssociations = function(oDataBinding) {
		var oContext = oDataBinding.getContexts(0, 1)[0],
			oData = oContext && oContext.getObject();

		SmartMicroChartCommons._updateAssociations.call(this, oData);
	};

	/**
	 * Gets the supported types of ChartType in Chart annotation.
	 * @returns {array} Chart types
	 * @private
	 */
	SmartComparisonMicroChart.prototype._getSupportedChartTypes = function() {
		return SmartComparisonMicroChart._CHART_TYPE;
	};


	SmartComparisonMicroChart.prototype.getAccessibilityInfo = function() {
		return SmartMicroChartCommons._getAccessibilityInfo.apply(this);
	};

	return SmartComparisonMicroChart;
});
