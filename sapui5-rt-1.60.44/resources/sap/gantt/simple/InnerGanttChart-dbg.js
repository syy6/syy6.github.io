/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/core/Core",
	"sap/ui/core/Control",
	"./GanttExtension"
], function (
		Core,
		Control,
		GanttExtension
) {
	"use strict";

	/**
	 * Inner Gantt Chart, the purpose for this class is to decouple the rendering cycle with Table in GanttChartWithTable.
	 * Use it in application is prohibited and not supported.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSetting] Initial settings for the new control
	 *
	 * @class
	 * Inner Gantt Chart is responsible for rendering the content of gantt chart
	 *
	 * @extend sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.60.19
	 *
	 * @constructor
	 * @private
	 * @alias sap.gantt.simple.InnerGanttChart
	 */
	var InnerGanttChart = Control.extend("sap.gantt.simple.InnerGanttChart");

	InnerGanttChart.prototype.getDomRef = function() {
		var oParent = this.getParent();
		if (oParent) {
			return window.document.getElementById(this.getParent().getId() + "-cnt");
		}
		return null;
	};

	InnerGanttChart.prototype.invalidate = function(){
		// do nothing
		this.getUIArea().addInvalidatedControl(this);
	};

	InnerGanttChart.prototype._updateRowsHoverState = function() {
		var oGantt = this.getParent();

		// update hover on rows that were just rerendered and their event handlers would not catch latest mouseleave event
		// setTimeout is used because otherwise :hover returns zero elements
		setTimeout(function() {
			oGantt.$("svg").find("rect.sapGanttBackgroundSVGRow:hover").each(function() {
				var oExtension = oGantt._getPointerExtension(),
					iIndex = oExtension._getRowIndexFromElement(this);

				oGantt.getSyncedControl().syncRowHover(iIndex, true);
			});
			oGantt.$("svg").find("rect.sapGanttBackgroundSVGRow:not(:hover)").each(function() {
				var oExtension = oGantt._getPointerExtension(),
					iIndex = oExtension._getRowIndexFromElement(this);

				oGantt.getSyncedControl().syncRowHover(iIndex, false);
			});
		}, 0);
	};

	InnerGanttChart.prototype.onBeforeRendering = function (oEvent) {
		if (!this.getParent()._bInitialRenderPassed) {
			// Visible Horizon Change --> Redraw -> Update scroll width -> Render all shapes -> Scroll Gantt
			this.getParent().jumpToVisibleHorizon("initialRender");
		}
	};

	InnerGanttChart.prototype.onAfterRendering = function(oEvent) {
		var oGantt = this.getParent();
		var oGanttParent = oGantt.getParent();

		if (oGanttParent && oGanttParent.isA("sap.gantt.simple.GanttChartContainer") && oGanttParent.getGanttCharts().length > 1) {
			oGantt.fireEvent("_initialRenderGanttChartsSync", {
				reasonCode: "initialRender", visibleHorizon: oGantt.getAxisTimeStrategy().getVisibleHorizon(), visibleWidth: oGantt.getVisibleWidth()
			});
		}

		var oRm = Core.createRenderManager();
		this.getRenderer().renderRelationships(oRm, oGantt);
		oRm.destroy();

		// Update shape selections from SelectionModel
		oGantt._updateShapeSelections(oGantt.getSelectedShapeUid(), []);

		// update shape connect effect when vertical scroll
		oGantt._getConnectExtension().updateShapeConnectEffect(oGantt);

		this._updateRowsHoverState();
		GanttExtension.attachEvents(oGantt);
	};

	return InnerGanttChart;

}, true);
