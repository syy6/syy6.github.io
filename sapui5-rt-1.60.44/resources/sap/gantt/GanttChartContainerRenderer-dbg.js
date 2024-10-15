/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define(["sap/gantt/misc/Utility", "sap/ui/performance/Measurement"], function (Utility, Measurement) {
	"use strict";

	/**
	 * Gantt Chart Container renderer.
	 *
	 * @namespace
	 */
	var GanttChartContainerRenderer = {};

	GanttChartContainerRenderer.render = function (oRm, oGanttChartContainer) {
		Measurement.start("GanttChartContainerRenderer render","GanttPerf:GanttChartContainerRenderer render function");
		oRm.write("<div");
		oRm.writeControlData(oGanttChartContainer);
		oRm.addStyle("width", oGanttChartContainer.getWidth());
		oRm.addStyle("height", oGanttChartContainer.getHeight());
		oRm.writeStyles();
		oRm.addClass("sapGanttChartContainer");
		oRm.writeClasses();
		oRm.write(">");

		Measurement.start("GanttChartContainerRenderer renderPaintServer","GanttPerf:GanttChartContainerRenderer renderPaintServer part");
		this.renderSvgDefs(oRm, oGanttChartContainer);
		Measurement.end("GanttChartContainerRenderer renderPaintServer");

		Measurement.start("GanttChartContainerRenderer renderToolbar","GanttPerf:GanttChartContainerRenderer renderToolbar part");
		this.renderToolbar(oRm, oGanttChartContainer);
		Measurement.end("GanttChartContainerRenderer renderToolbar");

		Measurement.start("GanttChartContainerRenderer renderGanttCharts","GanttPerf:GanttChartContainerRenderer renderGanttCharts part");
		this.renderGanttCharts(oRm, oGanttChartContainer);
		Measurement.end("GanttChartContainerRenderer renderGanttCharts");

		oRm.write("</div>");
		Measurement.end("GanttChartContainerRenderer render");
	};

	GanttChartContainerRenderer.renderSvgDefs = function (oRm, oGanttChartContainer) {
		var oSvgDefs = oGanttChartContainer.getSvgDefs();
		if (oSvgDefs) {
			oRm.write("<svg id='" + oGanttChartContainer.getId() + "-svg-psdef' tabindex='-1' focusable='false'");
			oRm.addClass("sapGanttInvisiblePaintServer");
			oRm.writeClasses();
			oRm.write(">");
			oRm.write(oSvgDefs.getDefString());
			oRm.write("</svg>");
		}
	};

	GanttChartContainerRenderer.renderToolbar = function (oRm, oGanttChartContainer) {
		oRm.renderControl(oGanttChartContainer._oToolbar);
	};

	GanttChartContainerRenderer.renderGanttCharts = function (oRm, oGanttChartContainer) {
		oRm.write("<div");
		oRm.addClass("sapGanttViewContainer");
		oRm.writeClasses();
		oRm.addStyle("width", oGanttChartContainer.getWidth());
		var sGanttViewHeight = oGanttChartContainer.getHeight();
		if (oGanttChartContainer._oToolbar.getAllToolbarItems().length > 0) {
			var sCSSMode = Utility.findSapUiSizeClass();
			var sToolbarHeight = (sCSSMode === "sapUiSizeCompact" || sCSSMode === "sapUiSizeCondensed") ? "32px" : "48px";
			sGanttViewHeight = "calc(" + sGanttViewHeight + " - " + sToolbarHeight + ")";
		}
		oRm.addStyle("height", sGanttViewHeight);
		oRm.writeStyles();
		oRm.write(">");
		oRm.renderControl(oGanttChartContainer._oSplitter);
		oRm.write("</div>");
	};

	return GanttChartContainerRenderer;

}, /* bExport= */ true);
