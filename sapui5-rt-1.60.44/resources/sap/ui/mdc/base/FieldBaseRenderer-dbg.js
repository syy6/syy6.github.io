/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define(['sap/ui/core/Renderer', 'sap/ui/core/IconPool'],
		function(Renderer, IconPool) {
	"use strict";

	//initialize the Icon Pool
	IconPool.insertFontFaceStyle();

	var FieldBaseRenderer = Renderer.extend("sap.ui.mdc.base.FieldBaseRenderer");

	FieldBaseRenderer.render = function(oRm, oField) {
		var oContent = oField._getContent();
		var sWidth = oField.getWidth();

		oRm.write("<div");
		oRm.writeControlData(oField);
		oRm.addClass("sapUiMdcBaseField");

		if (sWidth) {
			oRm.addStyle("width", sWidth);
		}
		oRm.writeStyles();
		oRm.writeClasses();
		oRm.write(">");

		if (oContent) {
			oRm.renderControl(oContent);
		}

		oRm.write("</div>");

	};


	return FieldBaseRenderer;

}, /* bExport= */ true);