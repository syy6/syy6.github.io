/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2018 SAP SE. All rights reserved
 */

sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"./library",
	"sap/ui/core/Control",
	"sap/suite/ui/microchart/RadialMicroChartRenderer",
	"sap/ui/Device",
	"sap/m/ValueColor",
	"sap/base/Log",
	"sap/ui/events/KeyCodes",
	"sap/suite/ui/microchart/MicroChartUtils",
	"sap/m/ValueCSSColor"
], function(jQuery, library, Control, Renderer, Device, ValueColor, Log, KeyCodes, MicroChartUtils, ValueCSSColor) {
	"use strict";

	/**
	 * Describes the configuration of the graphic element on the chart.
	 *
	 * @class
	 * Displays a ring chart highlighting a current status. The status is displayed with a semantically colored radial bar and a percentage value.
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.60.42
	 * @since 1.36.0
	 *
	 * @constructor
	 * @public
	 * @alias sap.suite.ui.microchart.RadialMicroChart
	 * @ui5-metamodel This control will also be described in the UI5 (legacy) designtime metamodel
	 */
	var RadialMicroChart = Control.extend("sap.suite.ui.microchart.RadialMicroChart", /** @lends sap.suite.ui.microchart.RadialMicroChart.prototype */ {
		/**
		 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
		 * @param {object} [mSettings] Initial settings for the new control
		 */
		constructor: function(sId, mSettings) {
			var bPercentageMode;
			if (mSettings && typeof mSettings.percentage === "number") {
				bPercentageMode = true;
			} else if (sId && typeof sId.percentage === "number") {
				bPercentageMode = true;
			} else {
				bPercentageMode = false;
			}
			try {
				Control.apply(this, arguments);
				this._bPercentageMode = bPercentageMode;
			} catch (e) {
				this.destroy();
				throw e;
			}
		},

		metadata: {
			library: "sap.suite.ui.microchart",
			properties: {
				/**
				 * The total value. This is taken as 360 degrees value on the chart.
				 */
				total: { group: "Data", type: "float", defaultValue: null },

				/**
				 * The fraction of the total value that is displayed.
				 */
				fraction: { group: "Data", type: "float", defaultValue: null },

				/**
				 * The percentage that is displayed.
				 * When a percentage is set, properties total and fraction are not considered.
				 */
				percentage: { group: "Data", type: "float", defaultValue: null },

				/**
				 * The color shown in the completed path.
				 */
				valueColor: { group: "Appearance", type: "sap.m.ValueCSSColor", defaultValue: "Neutral" },

				/**
				 *The size of the chart. If it is not set, the Responsive size is used.
				 *Size XS is not supported
				 *@since 1.44.0
				 */
				size: { group: "Misc", type: "sap.m.Size", defaultValue: "Responsive" }
			},
			associations: {

				/**
				 * Controls or IDs that label this control. Can be used by screen reader software.
				 * @since 1.60.0
				 */
				ariaLabelledBy: { type: "sap.ui.core.Control", multiple: true, singularName: "ariaLabelledBy" }
			},
			events: {
				/**
				 * The event is triggered when the chart is pressed.
				 */
				press: {}
			}
		}
	});

	/* --- Lifecycle Handling --- */

	/**
	 * Init function for the control
	 */
	RadialMicroChart.prototype.init = function() {
		this._oRb = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.microchart");

		this._bThemeApplied = true;
		if (!sap.ui.getCore().isInitialized()) {
			this._bThemeApplied = false;
			sap.ui.getCore().attachInit(this._handleCoreInitialized.bind(this));
		} else {
			this._handleCoreInitialized();
		}
	};

	/**
	 * Handler for the core's init event. The control will only be rendered if all themes are loaded
	 * and everything is properly initialized. We attach a theme check here.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._handleCoreInitialized = function() {
		this._bThemeApplied = sap.ui.getCore().isThemeApplied();
		if (!this._bThemeApplied) {
			sap.ui.getCore().attachThemeChanged(this._handleThemeApplied, this);
		}
	};

	/**
	 * The chart will only be rendered if the theme is applied.
	 * If this is the case, the control invalidates itself.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._handleThemeApplied = function() {
		this._bThemeApplied = true;
		this.invalidate();
		sap.ui.getCore().detachThemeChanged(this._handleThemeApplied, this);
	};

	RadialMicroChart.prototype.onBeforeRendering = function() {
		if (library._isInGenericTile(this)) {
			library._removeStandardMargins(this);
		}
		if (!this._getPercentageMode()) {
			if (this.getTotal() === 0) {
				Log.info("Total cannot be 0. Please add a valid total value.");
			} else {
				this.setProperty("percentage", Math.round((this.getFraction() * 100 / this.getTotal()) * 10) / 10, true);
			}
		}
		this._unbindMouseEnterLeaveHandler();
	};

	RadialMicroChart.prototype.onAfterRendering = function() {
		Renderer._handleOnAfterRendering(this);
		this._bindMouseEnterLeaveHandler();
	};

	/* --- Event Handling --- */

	RadialMicroChart.prototype.ontouchstart = function(oEvent) {
		// if the press event is used then event needs to be marked.Otherwise the Parent Control events should trigger.
		if (this.hasListeners("press") === true){
			// mark the event for components that needs to know if the event was handled by the RadialMicroChart
			oEvent.setMarked();
		}
	};

	RadialMicroChart.prototype.ontap = function(oEvent) {
		if (Device.browser.msie) {
			this.$().focus();
		}
		// if the press event is used then event needs to be marked.Otherwise the Parent Control events should trigger.
		if (this.hasListeners("press") === true){
			// mark the event for components that needs to know if the event was handled by the RadialMicroChart
			oEvent.setMarked();
		}
		this.firePress();
	};

	RadialMicroChart.prototype.onkeydown = function(oEvent) {
		if (oEvent.which === KeyCodes.SPACE) {
			// if the press event is used then event needs to be marked.Otherwise the Parent Control events should trigger.
			if (this.hasListeners("press") === true){
				// mark the event for components that needs to know if the event was handled by the RadialMicroChart
				oEvent.setMarked();
			}
			oEvent.preventDefault();
		}
	};

	RadialMicroChart.prototype.onkeyup = function(oEvent) {
		if (oEvent.which === KeyCodes.ENTER || oEvent.which === KeyCodes.SPACE) {
			// if the press event is used then event needs to be marked.Otherwise the Parent Control events should trigger.
			if (this.hasListeners("press") === true){
				// mark the event for components that needs to know if the event was handled by the RadialMicroChart
				oEvent.setMarked();
			}
			this.firePress();
			oEvent.preventDefault();
		}
	};

	RadialMicroChart.prototype.attachEvent = function(eventId, data, functionToCall, listener) {
		Control.prototype.attachEvent.call(this, eventId, data, functionToCall, listener);
		if (eventId === "press") {
			this.rerender();
		}
		return this;
	};

	RadialMicroChart.prototype.detachEvent = function(eventId, functionToCall, listener) {
		Control.prototype.detachEvent.call(this, eventId, functionToCall, listener);
		if (eventId === "press") {
			this.rerender();
		}
		return this;
	};

	/* --- Getters and Setters --- */

	/**
	 * Getter for internal property _bPercentageMode.
	 * Percentage mode is configured by setting a percentage value on definition of the control.
	 * If fraction property and total property is used, this _bPercentageMode property is false since percentage gets calculated automatically by the control.
	 *
	 * @private
	 * @returns {boolean} true if chart is in percentage mode, false if not.
	 */
	RadialMicroChart.prototype._getPercentageMode = function() {
		return this._bPercentageMode;
	};

	RadialMicroChart.prototype.setPercentage = function(percentage) {
		if (jQuery.type(percentage) === "number") {
			this._bPercentageMode = true;
			if (percentage !== this.getPercentage()) {
				this.setProperty("percentage", percentage);
			}
		} else {
			this._bPercentageMode = false;
			this.setProperty("percentage", null);
		}
		return this;
	};

	RadialMicroChart.prototype.getTooltip_AsString = function() { //eslint-disable-line
		return this._getTooltipText();
	};

	/**
	 * Returns the translated accessibility control type. It describes the type of the MicroChart control.
	 *
	 * @returns {string} The translated accessibility control type
	 * @private
	 */
	RadialMicroChart.prototype._getAccessibilityControlType = function() {
		return this._oRb.getText("ACC_CTR_TYPE_RADIALMICROCHART");
	};

	/**
	 * Checks if the valueColor property is a member of sap.m.ValueColor
	 * @returns {boolean} True if the valueColor property is a member of sap.m.ValueColor, false if otherwise.
	 * @private
	 */
	RadialMicroChart.prototype._isValueColorValid = function() {
		return ValueColor.hasOwnProperty(this.getValueColor());
	};

	/**
	 * Returns the tooltip for the given chart.
	 * If tooltip was set to an empty string (using whitespaces) by the application,
	 * the tooltip will be set to an empty string. If tooltip was not set (null/undefined),
	 * a tooltip gets generated by the control.
	 *
	 * @param {bool} bIsActive Whether LineMicroChart is active (with tabindex 0)
	 *
	 * @private
	 * @returns {string} tooltip for the given control
	 */
	RadialMicroChart.prototype._getTooltipText = function(bIsActive) {
		var sTooltip = this.getTooltip_Text();
		if (!sTooltip) { //Tooltip will be set by control
			sTooltip = this._getAriaAndTooltipText(bIsActive);
		} else if (this._isTooltipSuppressed()) {
			sTooltip = null;
		}
		return sTooltip;
	};

	/**
	 * Returns text for ARIA label.
	 * If tooltip was set to an empty string (using whitespaces) by the application or
	 * the tooltip was not set (null/undefined), the ARIA text gets generated by the control.
	 * Otherwise, the given tooltip will also be set as ARIA text.
	 *
	 * @param {bool} bIsActive Whether LineMicroChart is active (with tabindex 0)
	 *
	 * @private
	 * @returns {String} ARIA text for the given control
	 */
	RadialMicroChart.prototype._getAriaText = function(bIsActive) {
		var sAriaText = this.getTooltip_Text();
		if (!sAriaText || this._isTooltipSuppressed()) { //ARIA label will be set by control. Otherwise (else), version generated by control will be used.
			sAriaText = this._getAriaAndTooltipText(bIsActive);
		}
		return sAriaText;
	};

	/**
	 * Returns value that indicates if the tooltip was configured as empty string (e.g. one whitespace).
	 *
	 * @private
	 * @returns {boolean} value that indicates true, if whitespace was set, false in any other case, also null/undefined
	 */
	RadialMicroChart.prototype._isTooltipSuppressed = function() {
		var sTooltip = this.getTooltip_Text();
		if (sTooltip && jQuery.trim(sTooltip).length === 0) {
			return true;
		} else {
			return false;
		}
	};

	/**
	 * Returns the part of the tooltip and ARIA text which is equal.
	 *
	 * @param {bool} bIsActive Whether LineMicroChart is active (with tabindex 0)
	 *
	 * @private
	 * @returns {string} value containing the tooltip and ARIA text
	 */
	RadialMicroChart.prototype._getAriaAndTooltipText = function(bIsActive) {
		var sTextValue = this._oRb.getText("RADIALMICROCHART");

		if (bIsActive) {
			sTextValue += " " + this._oRb.getText("IS_ACTIVE");
		}

		sTextValue += "\n";

		if (!this._hasData()) {
			sTextValue += this._oRb.getText("NO_DATA");
			return sTextValue;
		}

		var fPercentage = this.getPercentage();
		if (fPercentage > 100) {
			fPercentage = 100;
		} else if (fPercentage < 0) {
			fPercentage = 0;
		}
		if (this._isValueColorValid()) {
			sTextValue += this._oRb.getText("RADIALMICROCHART_ARIA_LABEL", [ this.getPercentage(), this._getStatusText() ]);
		} else {
			sTextValue += this._oRb.getText("RADIALMICROCHART_PERCENTAGE_TEXT", fPercentage);
		}
		return sTextValue;
	};

	/**
	 * Returns the status text based on color value (to be available for other languages also)
	 *
	 * @private
	 * @returns {string} value containing the status text
	 */
	RadialMicroChart.prototype._getStatusText = function() {
		var sValueColor = this.getValueColor();
		switch (sValueColor) {
			case ValueColor.Error:
				return this._oRb.getText("SEMANTIC_COLOR_ERROR");
			case ValueColor.Critical:
				return this._oRb.getText("SEMANTIC_COLOR_CRITICAL");
			case ValueColor.Good:
				return this._oRb.getText("SEMANTIC_COLOR_GOOD");
			case ValueColor.Neutral:
				return this._oRb.getText("SEMANTIC_COLOR_NEUTRAL");
			default:
				return "";
		}
	};

	/**
	 * Adds the title attribute to show the tooltip when the mouse enters the chart.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._addTitleAttribute = function() {
		if (!this.$().attr("title") && this._hasData()) {
			this.$().attr("title", this.getTooltip_AsString());
		}
	};

	/**
	 * Removes the title attribute to hide the tooltip when the mouse leaves the chart.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._removeTitleAttribute = function() {
		if (this.$().attr("title")) {
			this.$().removeAttr("title");
		}
	};

	/**
	 * Binds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._bindMouseEnterLeaveHandler = function() {
		this.$().bind("mouseenter.tooltip", this._addTitleAttribute.bind(this));
		this.$().bind("mouseleave.tooltip", this._removeTitleAttribute.bind(this));
	};

	/**
	 * Unbinds the handlers for mouseenter mouseleave events.
	 *
	 * @private
	 */
	RadialMicroChart.prototype._unbindMouseEnterLeaveHandler = function() {
		this.$().unbind("mouseenter.tooltip");
		this.$().unbind("mouseleave.tooltip");
	};

	/**
	 * Tests if there is any data for the control to display.
	 *
	 * @returns {boolean} Whether data are present
	 * @private
	 */
	RadialMicroChart.prototype._hasData = function() {
		return this._getPercentageMode() || (this.getTotal() !== 0);
	};

	// to prevent press event in No Data mode
	RadialMicroChart.prototype.firePress = function() {
		if (this._hasData()) {
			Control.prototype.fireEvent.call(this, "press", arguments);
		}

	};

	MicroChartUtils.extendMicroChart(RadialMicroChart);

	return RadialMicroChart;
});
