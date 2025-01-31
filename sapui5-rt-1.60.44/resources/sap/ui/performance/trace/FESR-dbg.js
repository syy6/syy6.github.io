/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define([
	'sap/ui/thirdparty/URI',
	'sap/ui/Device',
	'sap/ui/performance/trace/Passport',
	'sap/ui/performance/trace/Interaction',
	'sap/ui/performance/XHRInterceptor',
	'sap/base/util/Version'
], function (URI, Device, Passport, Interaction, XHRInterceptor, Version) {
	"use strict";

	// activation by meta tag or url parameter as fallback
	var bFesrActive = false,
		ROOT_ID = Passport.getRootId(), // static per session
		CLIENT_ID = Passport.createGUID().substr(-8, 8) + ROOT_ID, // static per session
		HOST = window.location.host, // static per session
		CLIENT_OS = Device.os.name + "_" + Device.os.version,
		CLIENT_MODEL = Device.browser.name + "_" + Device.browser.version,
		CLIENT_DEVICE = setClientDevice(),
		sAppVersion = "", // shortened app version with fesr delimiter e.g. "@1.7.1"
		sAppVersionFull = "", // full app version e.g. 1.7.1-SNAPSHOT
		sFESRTransactionId, // first transaction id of an interaction step, serves as identifier for the fesr-header
		iStepCounter = 0, // counts FESR interaction steps
		sFESR, // current header string
		sFESRopt; // current header string

	function setClientDevice() {
		var iClientId = 0;
		if (Device.system.combi) {
			iClientId = 1;
		} else if (Device.system.desktop) {
			iClientId = 2;
		} else if (Device.system.tablet) {
			iClientId = 4;
		} else if (Device.system.phone) {
			iClientId = 3;
		}
		return iClientId;
	}

	function formatInteractionStartTimestamp(iTimeStamp) {
		var oDate = new Date(iTimeStamp);
		return oDate.toISOString().replace(/[^\d]/g, '');
	}

	function isCORSRequest(sUrl) {
		var sHost = new URI(sUrl).host();
		// url is relative or with same host
		return sHost && sHost !== HOST;
	}

	function registerXHROverride() {

		XHRInterceptor.register("PASSPORT_HEADER", "open", function() {

			// only use Passport for non CORS requests
			if (!isCORSRequest(arguments[1])) {
				var oPendingInteraction = Interaction.getPending();

				if (oPendingInteraction) {
					// check for updated version and update formatted versions
					if (sAppVersionFull != oPendingInteraction.appVersion) {
						sAppVersionFull = oPendingInteraction.appVersion;
						sAppVersion = sAppVersionFull ? formatVersion(sAppVersionFull) : "";
					}
				}

				// set passport with Root Context ID, Transaction ID, Component Info, Action
				this.setRequestHeader("SAP-PASSPORT", Passport.header(
					Passport.traceFlags(),
					ROOT_ID,
					Passport.getTransactionId(),
					oPendingInteraction ? oPendingInteraction.component + sAppVersion : undefined,
					oPendingInteraction ? oPendingInteraction.trigger + "_" + oPendingInteraction.event + "_" + iStepCounter : undefined
				));
			}
		});

		XHRInterceptor.register("FESR", "open" ,function() {

			// only use FESR for non CORS requests
			if (!isCORSRequest(arguments[1])) {

				// remember the TransactionId of the first request when FESR is active
				if (!sFESRTransactionId) {
					sFESRTransactionId = Passport.getTransactionId();
				}

				if (sFESR) {
					this.setRequestHeader("SAP-Perf-FESRec", sFESR);
					this.setRequestHeader("SAP-Perf-FESRec-opt", sFESRopt);
					sFESR = null;
					sFESRopt = null;
					sFESRTransactionId = Passport.getTransactionId();
					iStepCounter++;
				}
			}
		});
	}

	// creates mandatory FESR header string
	function createFESR(oInteraction) {
		return [
			format(ROOT_ID, 32), // root_context_id
			format(sFESRTransactionId, 32), // transaction_id
			format(oInteraction.navigation, 16), // client_navigation_time
			format(oInteraction.roundtrip, 16), // client_round_trip_time
			format(oInteraction.duration, 16), // end_to_end_time
			format(oInteraction.completeRoundtrips, 8), // completed network_round_trips
			format(CLIENT_ID, 40), // client_id
			format(oInteraction.networkTime, 16), // network_time
			format(oInteraction.requestTime, 16), // request_time
			format(CLIENT_OS, 20), // client_os
			"SAP_UI5" // client_type
		].join(",");
	}

	// creates optional FESR header string
	function createFESRopt(oInteraction) {
		var sComponent = oInteraction.stepComponent || oInteraction.component;
		return [
			format(sComponent, 20, true), // application_name
			format(oInteraction.trigger + "_" + oInteraction.event, 20, true), // step_name
			"", // not assigned
			format(CLIENT_MODEL, 20), // client_model
			format(oInteraction.bytesSent, 16), // client_data_sent
			format(oInteraction.bytesReceived, 16), // client_data_received
			"", // network_protocol
			"", // network_provider
			format(oInteraction.processing, 16), // client_processing_time
			oInteraction.requestCompression ? "X" : "", // compressed - empty if not compressed
			"", // not assigned
			"", // persistency_accesses
			"", // persistency_time
			"", // persistency_data_transferred
			format(oInteraction.busyDuration, 16), // extension_1 - busy duration
			"", // extension_2
			format(CLIENT_DEVICE, 1), // extension_3 - client device
			"", // extension_4
			format(formatInteractionStartTimestamp(oInteraction.start), 20), // extension_5 - interaction start time
			format(sComponent, 70, true) // application_name with 70 characters, trimmed from left
		].join(",");
	}

	// format string to fesr compliant string
	function format(vField, iLength, bCutFromFront) {
		if (!vField) {
			vField = vField === 0 ? "0" : "";
		} else if (typeof vField === "number") {
			var iField = vField;
			vField = Math.round(vField).toString();
			// Calculation of figures may be erroneous because incomplete performance entries lead to negative
			// numbers. In that case we set a -1, so the "dirty" record can be identified as such.
			if (vField.length > iLength || iField < 0) {
				vField = "-1";
			}
		} else {
			vField = bCutFromFront ? vField.substr(-iLength, iLength) : vField.substr(0, iLength);
		}
		return vField;
	}

	function formatVersion(sVersion) {
		var oVersion = new Version(sVersion);
		return "@" + oVersion.getMajor() + "." + oVersion.getMinor() + "." + oVersion.getPatch();
	}

	function createHeader(oFinishedInteraction) {
		// create FESR from completed interaction
		sFESR = createFESR(oFinishedInteraction);
		sFESRopt = createFESRopt(oFinishedInteraction);
	}

	/**
	 * FESR API, consumed by E2eTraceLib instead of former EppLib.js.

	 * Provides functionality for creating the headers for the frontend-subrecords which will be sent with each
	 * first request of an interaction. The headers have a specific format, you may have a look at the createFESR
	 * methods.<br>

	 * There is a special order in which things are happening:
	 * <pre>
	 * 1. Interaction starts
	 * 1.1. Request 1.1 sent
	 * 1.2. Request 1.2 sent
	 * 2. Interaction starts
	 * 2.1 Creation of FESR for 1. interaction
	 * 2.2 Request 2.1 sent with FESR header for 1. interaction
	 * ...
	 * </pre>
	 *
	 * @namespace
	 * @since 1.58
	 * @alias module:sap/ui/performance/trace/FESR
	 * @static
	 * @public
	 */
	var FESR = {};

	/**
	 * @param {boolean} bActive State of the FESR header creation
	 * @private
	 * @ui5-restricted sap.ui.core
	 */
	FESR.setActive = function (bActive) {
		if (bActive) {
			bFesrActive = true;
			Passport.setActive(true);
			Interaction.setActive(true);
			registerXHROverride();
			Interaction.onInteractionFinished = function(oFinishedInteraction) {
				// only send FESR when requests have occured
				if (oFinishedInteraction.requests.length > 0) {
					createHeader(oFinishedInteraction);
				}
			};
		} else if (!bActive && bFesrActive) {
			bFesrActive = false;
			Interaction.setActive(false);
			XHRInterceptor.unregister("FESR", "open");
			// passport stays active so far
			if (XHRInterceptor.isRegistered("PASSPORT_HEADER", "open")) {
				XHRInterceptor.register("PASSPORT_HEADER", "open", function() {
					// set passport with Root Context ID, Transaction ID for Trace
					this.setRequestHeader("SAP-PASSPORT", Passport.header(Passport.traceFlags(), ROOT_ID, Passport.getTransactionId()));
				});
			}
			Interaction.onInteractionFinished = null;
		}
	};

	/**
	 * @return {boolean} State of the FESR header creation
	 * @private
	 * @ui5-restricted sap.ui.core
	 */
	FESR.getActive = function () {
		return bFesrActive;
	};

	return FESR;
});
