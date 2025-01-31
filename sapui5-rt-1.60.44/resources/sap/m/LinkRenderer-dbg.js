/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

 sap.ui.define(['sap/ui/core/Renderer', 'sap/ui/core/LabelEnablement', 'sap/ui/core/library', "sap/ui/util/defaultLinkTypes"],
	function(Renderer, LabelEnablement, coreLibrary, defaultLinkTypes) {
	"use strict";


	// shortcut for sap.ui.core.TextDirection
	var TextDirection = coreLibrary.TextDirection;


	/**
	 * Link renderer
	 * @namespace
	 */
	var LinkRenderer = {
	};


	/**
	 * Renders the HTML for the given control, using the provided {@link sap.ui.core.RenderManager}.
	 *
	 * @param {sap.ui.core.RenderManager} oRm the RenderManager that can be used for writing to the render output buffer
	 * @param {sap.ui.core.Control} oControl an object representation of the control that should be rendered
	 */
	LinkRenderer.render = function(oRm, oControl) {
		var sTextDir = oControl.getTextDirection(),
			sTextAlign = Renderer.getTextAlign(oControl.getTextAlign(), sTextDir),
			bShouldHaveOwnLabelledBy = oControl.getAriaLabelledBy().indexOf(oControl.getId()) === -1 &&
							(oControl.getAriaLabelledBy().length > 0 ||
							LabelEnablement.getReferencingLabels(oControl).length > 0 ||
							(oControl.getParent() && oControl.getParent().enhanceAccessibilityState)),
			oAccAttributes =  {
				role: 'link',
				labelledby: bShouldHaveOwnLabelledBy ? {value: oControl.getId(), append: true } : undefined
			},
			sHref = oControl.getHref(),
			sRel = defaultLinkTypes(oControl.getRel(), oControl.getTarget()),
			bIsValid = sHref && oControl._isHrefValid(sHref),
			bEnabled = oControl.getEnabled();

		// Link is rendered as a "<a>" element
		oRm.write("<a");
		oRm.writeControlData(oControl);

		oRm.addClass("sapMLnk");
		if (oControl.getSubtle()) {
			oRm.addClass("sapMLnkSubtle");

			//Add aria-describedby for the SUBTLE announcement
			if (oAccAttributes.describedby) {
				oAccAttributes.describedby += " " + oControl._sAriaLinkSubtleId;
			} else {
				oAccAttributes.describedby = oControl._sAriaLinkSubtleId;
			}
		}

		if (oControl.getEmphasized()) {
			oRm.addClass("sapMLnkEmphasized");

			//Add aria-describedby for the EMPHASIZED announcement
			if (oAccAttributes.describedby) {
				oAccAttributes.describedby += " " + oControl._sAriaLinkEmphasizedId;
			} else {
				oAccAttributes.describedby = oControl._sAriaLinkEmphasizedId;
			}
		}

		if (!bEnabled) {
			oRm.addClass("sapMLnkDsbl");
			oRm.writeAttribute("disabled", "true");
		} else {
			oRm.writeAttribute("tabIndex", oControl._getTabindex());
		}

		if (oControl.getWrapping()) {
			oRm.addClass("sapMLnkWrapping");
		}

		if (oControl.getTooltip_AsString()) {
			oRm.writeAttributeEscaped("title", oControl.getTooltip_AsString());
		}

		/* set href only if link is enabled - BCP incident 1570020625 */
		if (bIsValid && bEnabled) {
			oRm.writeAttributeEscaped("href", sHref);
		}

		if (oControl.getTarget()) {
			oRm.writeAttributeEscaped("target", oControl.getTarget());
		}

		if (sRel) {
			oRm.writeAttributeEscaped("rel", sRel);
		}

		if (oControl.getWidth()) {
			oRm.addStyle("width", oControl.getWidth());
		} else {
			oRm.addClass("sapMLnkMaxWidth");
		}

		if (sTextAlign) {
			oRm.addStyle("text-align", sTextAlign);
		}

		// check if textDirection property is not set to default "Inherit" and add "dir" attribute
		if (sTextDir !== TextDirection.Inherit) {
			oRm.writeAttribute("dir", sTextDir.toLowerCase());
		}

		oRm.writeAccessibilityState(oControl, oAccAttributes);
		oRm.writeClasses();
		oRm.writeStyles();
		oRm.write(">"); // opening <a> tag

		if (this.writeText) {
			this.writeText(oRm, oControl);
		} else {
			this.renderText(oRm, oControl);
		}

		oRm.write("</a>");
	};

	/**
	 * Renders the normalized text property.
	 *
	 * @param {sap.ui.core.RenderManager} oRm The RenderManager that can be used for writing to the render output buffer.
	 * @param {sap.m.Link} oControl An object representation of the control that should be rendered.
	 */
	LinkRenderer.renderText = function(oRm, oControl) {
		oRm.writeEscaped(oControl.getText());
	};

	return LinkRenderer;

 }, /* bExport= */ true);
