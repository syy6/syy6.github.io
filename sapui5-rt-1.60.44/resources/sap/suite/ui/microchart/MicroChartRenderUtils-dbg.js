/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2018 SAP SE. All rights reserved
 */

sap.ui.define("sap/suite/ui/microchart/MicroChartRenderUtils", [

], function () {
	"use strict";

	var MicroChartRenderUtils = {
		extendMicroChartRenderer: function (MicroChartRenderer) {
			/**
			 * Renders a "No Data" placeholder for the micro chart
			 *
			 * @param {object} oRm render manager
			 * @private
			 */
			MicroChartRenderer._renderNoData = function(oRm) {
				oRm.write("<div");
				oRm.addClass("sapSuiteUiMicroChartNoData");
				oRm.writeClasses();
				oRm.write(">");

				oRm.write("<div");
				oRm.addClass("sapSuiteUiMicroChartNoDataTextWrapper");
				oRm.writeClasses();
				oRm.write(">");

				var oRb = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.microchart");
				var sText = oRb.getText("NO_DATA");
				oRm.write("<span>");
				oRm.writeEscaped(sText);
				oRm.write("</span>");

				oRm.write("</div>");
				oRm.write("</div>");
			};

			MicroChartRenderer._renderActiveProperties = function(oRm, oControl) {
				var bIsActive = oControl.hasListeners("press");

				if (bIsActive) {
					if (oControl._hasData()) {
						oRm.addClass("sapSuiteUiMicroChartPointer");
					}

					oRm.writeAttribute("tabindex", "0");
				}
			};
		}
	};

	return MicroChartRenderUtils;
}, true);
