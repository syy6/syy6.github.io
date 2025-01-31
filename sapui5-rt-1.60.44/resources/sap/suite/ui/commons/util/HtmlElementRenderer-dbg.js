/*!
 * 
		SAP UI development toolkit for HTML5 (SAPUI5)
		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */

sap.ui.define([ "jquery.sap.global", "sap/ui/base/Object", "sap/ui/core/Control", "sap/base/Log" ],
	function(jQuery, BaseObject, Control, Log) {
	"use strict";

	var HtmlElement;
	/**
	 * Creates a renderer for HtmlElement.
	 *
	 * @class HtmlElementRenderer A renderer for HtmlElement.
	 *
	 * @extends sap.ui.base.Object
	 *
	 * @param {sap.suite.ui.commons.util.HtmlElement} oHtmlElement Html element to render.
	 *
	 * @constructor
	 * @alias sap.suite.ui.commons.util.HtmlElementRenderer
	 * @protected
	 */
	var HtmlElementRenderer = BaseObject.extend("sap.suite.ui.commons.util.HtmlElementRenderer", {
		constructor: function(oHtmlElement) {
			BaseObject.apply(this, arguments);

			this._oHtmlElement = oHtmlElement;
		}
	});
	/**
	 * Renders HtmlElement to given render manager.
	 * @param {sap.ui.core.RenderManager} oRm RenderManager used for outputting content.
	 * @protected
	 */
	HtmlElementRenderer.prototype.render = function(oRm) {
		oRm.write("<");
		oRm.writeEscaped(this._oHtmlElement._sName);
		this._renderAttributes(oRm);
		oRm.write(">");
		if (this._oHtmlElement._aChildren.length > 0) {
			this._renderChildren(oRm);
		}
		oRm.write("</");
		oRm.writeEscaped(this._oHtmlElement._sName);
		oRm.write(">");
	};

	/**
	 * Renders all attributes of parent tag.
	 * @param {sap.ui.core.RenderManager} oRm RenderManager used for outputting content.
	 * @protected
	 */
	HtmlElementRenderer.prototype._renderAttributes = function(oRm) {
		var attributes = this._oHtmlElement._mAttributes;
		for (var attrName in attributes) {
			if (!attributes.hasOwnProperty(attrName)) {
				continue;
			}
			var val = attributes[attrName];
			if (jQuery.isArray(val)) {
				var joiner = "";
				if (attrName === "class") {
					joiner = " ";
				} else if (attrName === "style") {
					joiner = ";";
				}
				val = val.join(joiner);
			}
			oRm.write(" ");
			oRm.write(attrName); //ignore UI5 build warning here
			oRm.write("=\"");
			oRm.write(val); //ignore UI5 build warning here
			oRm.write("\"");
		}
	};

	/**
	 * Renders children of given node.
	 * @param {sap.ui.core.RenderManager} oRm RenderManager used for outputting content.
	 * @protected
	 */
	HtmlElementRenderer.prototype._renderChildren = function(oRm) {
		if (typeof HtmlElement === "undefined") {
			HtmlElement = sap.ui.require("sap/suite/ui/commons/util/HtmlElement");
		}
		this._oHtmlElement._aChildren.forEach(function(child) {
			if (typeof child === "string") {
				oRm.write(child); //cannot be escaped here using jQuery.sap.encodeHTML, ignore UI5 build warning
			} else if (HtmlElement && child instanceof HtmlElement) {
				child.getRenderer().render(oRm);
			} else if (child instanceof Control) {
				oRm.renderControl(child);
			} else {
				Log.error(typeof child + " cannot be a child of a HTML element. Skipping rendering for this child.");
			}
		});
	};

	return HtmlElementRenderer;
});
