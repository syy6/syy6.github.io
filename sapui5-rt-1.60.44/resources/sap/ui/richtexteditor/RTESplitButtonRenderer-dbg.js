/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2018 SAP SE. All rights reserved
 */
// Provides default renderer for control sap.ui.richtexteditor.RTESplitButton
sap.ui.define(['sap/m/SplitButtonRenderer', 'sap/ui/core/Renderer'],
	function(SplitButtonRenderer, Renderer){
		'use strict';

		/**
		 * RTESplitButtonRenderer
		 * @class
		 * @static
		 */
		var RTESplitButtonRenderer = {};

		/**
		 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
		 *
		 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the Render-Output-Buffer.
		 * @param {sap.ui.richtexteditor.RTESplitButton} oRTESplitButton The RTESplitButton control that should be rendered.
		 */

		RTESplitButtonRenderer = Renderer.extend(SplitButtonRenderer);

		RTESplitButtonRenderer.render = function(oRm, oRTESplitButton){
			oRm.addClass('sapRTESB');
			SplitButtonRenderer.render.apply(this, [oRm, oRTESplitButton]);
		};

		return RTESplitButtonRenderer;

	}, /* bExport= */ true);