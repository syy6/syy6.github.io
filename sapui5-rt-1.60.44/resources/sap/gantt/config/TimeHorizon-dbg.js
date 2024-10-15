/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'sap/ui/core/Element', "sap/gantt/misc/Format"
], function (Element, Format) {
	"use strict";
	/**
	 * Creates and initializes a new Time horizon
	 *
	 * @param {string} [sId] ID of the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] =Initial settings for the new control
	 *
	 * @class
	 * Defines the Time horizon
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.60.19
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.config.TimeHorizon
	 */
	var TimeHorizon = Element.extend("sap.gantt.config.TimeHorizon", /** @lends sap.gantt.config.TimeHorizon.prototype */ {
		metadata: {
			library: "sap.gantt",
			properties: {
				/**
				 * Start time of the time horizon in this format: YYYYMMDDHHMMSS. If the type of startTime is object, the value is converted to string.
				 */
				startTime: {type: "string", group: "Misc", defaultValue: undefined},
				/**
				 * End time of the time horizon in this format: YYYYMMDDHHMMSS. If the type of endTime is object, the value is converted to string.
				 */
				endTime: {type: "string", group: "Misc", defaultValue: undefined}
			}
		}
	});

	TimeHorizon.prototype.setStartTime = function (vStartTime, bSurpressInvalidate) {
		this.setProperty("startTime", this._convertTimestamp(vStartTime), bSurpressInvalidate);
	};

	TimeHorizon.prototype.setEndTime = function (vEndTime, bSurpressInvalidate) {
		this.setProperty("endTime", this._convertTimestamp(vEndTime), bSurpressInvalidate);
	};

	/**
	 * Compares two time horizons.
	 * @param oTimeHorizon Time horizon to compare.
	 * @returns {boolean} True if both horizons are equal.
	 * @public
	 */
	TimeHorizon.prototype.equals = function (oTimeHorizon) {
		return this.getStartTime() === oTimeHorizon.getStartTime() && this.getEndTime() === oTimeHorizon.getEndTime();
	};

	TimeHorizon.prototype._convertTimestamp = function (vTime) {
		var sRetVal = vTime;
		if (sRetVal && typeof sRetVal === "object") {
			sRetVal = Format.dateToAbapTimestamp(sRetVal);
		}
		return sRetVal;
	};

	return TimeHorizon;
}, true);