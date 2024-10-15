/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2018 SAP SE. All rights reserved
 */
// Provides control sap.ui.richtexteditor.RTESplitButton.
sap.ui.define([
	"sap/m/SplitButton"
], function(SplitButton){
		"use strict";

		/**
		 * Constructor for a new <code>RTSplitButton</code>.
		 *
		 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
		 * @param {object} [mSettings] Initial settings for the new control
		 *
		 * @class
		 * The RTESplitButton control replaces the SplitButton used as a font color button of the Custom Toolbar in RichTextEditor
		 * @extends sap.ui.core.Control
		 *
		 * @constructor
		 * @private
		 * @alias sap.ui.richtexteditor.RTESplitButton
		 *
		 * @author SAP SE
		 * @version 1.60.42
		 */

		var _RTESvgIcon1 = '<svg class="rteFontColorIcon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"> \
							<path d="M662.477,379.355h3.038l.806,2.7h1.163l-2.729-9h-1.518l-2.753,9h1.21Zm1.519-5.4,1.281,4.5h-2.586Z" transform="translate(-656.047 -373.055)"/> \
							<rect class="outline" x="1" y="12" width="14" height="3" rx="0.2" ry="0.2"/> \
							<rect class="fill" x="1" y="12" width="14" height="3" rx="0.2" ry="0.2"',
			_RTESvgIcon2 = '/></svg>',

		coloredRect,
		RTESplitButton = SplitButton.extend("sap.ui.richtexteditor.RTESplitButton", {
			metadata: {
				properties : {
					/**
					 * The currently selected color
					 */
					currentColor : { type: "sap.ui.core.CSSColor", group: "Appearance", defaultValue: 'rgb(0, 0, 0)' }
				},
				interfaces : [
					"sap.m.IOverflowToolbarContent"
				],
				library: "sap.ui.richtexteditor"
			}
		});

		RTESplitButton.prototype.onAfterRendering = function(){
			SplitButton.prototype.onAfterRendering.apply(this, arguments);

			//RTESplitButton extend the SplitButton, which renders sam.m.Button controls.
			//As we need to inject an svg icon in the inner buttons, this would increase
			//immensely the code complexity if we are to overwrite the rendering methods
			//ot those controls. That is why we have chosen to inject it with jQuery.

			// Аdd the svg icon  used for the font color button to the RTESplitButton
			this._cachedElem = this.$().find(".sapMSBText .sapMBtnInner").append(_RTESvgIcon1 + ' style="fill:' + this.getCurrentColor() + '"' + _RTESvgIcon2);
			this._cachedElem = this._cachedElem.find(".fill");
		};

		RTESplitButton.prototype.exit = function(){
			SplitButton.prototype.exit.apply(this, arguments);
			this._cachedElem = null;
		};

		/**
		 * Helper function for selecting the svg fill rectangle
		 *
		 * @returns {object} The svg fill rectangle
		 * @private
		 */
		RTESplitButton.prototype._getIconSvgFill = function(){
			return this._cachedElem;
		};

		/**
		 * Helper function used to get the font color
		 *
		 * @returns {string} Selected font color from the color palette
		 * @public
		 */
		RTESplitButton.prototype.getIconColor = function(){
			return this.getCurrentColor();
		};

		/**
		 * Helper function for updating the color of the fill with the selected font color
		 *
		 * @param {string} [sColor] Font color
		 * @returns {object} The RTESplitButton instance
		 * @public
		 */
		RTESplitButton.prototype.setIconColor = function(sColor){
			coloredRect = this._cachedElem;
			if (coloredRect) {
				this.setProperty("currentColor", sColor, false);
				coloredRect.css("fill", sColor);
			}
			return this;
		};
	return RTESplitButton;
}, /* bExport= */ true);
