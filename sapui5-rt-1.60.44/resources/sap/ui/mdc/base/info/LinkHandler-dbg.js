/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/mdc/base/info/ILinkHandler'
], function(ILinkHandler) {
	"use strict";

	/**
	 * Constructor for a new LinkHandler.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The <code>LinkHandler</code> implements the interface <code>ILinkHandler</code>.
	 * @extends sap.ui.mdc.base.info.ILinkHandler
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.58.0
	 * @alias sap.ui.mdc.base.info.LinkHandler
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var LinkHandler = ILinkHandler.extend("sap.ui.mdc.base.info.LinkHandler", /** @lends sap.ui.mdc.base.info.LinkHandler.prototype */
	{
		metadata: {
			library: "sap.ui.mdc"
		}
	});

	// ----------------------- Implementation of 'ILinkHandler' interface --------------------------------------------

	LinkHandler.prototype.hasPotentialLinks = function() {
		return Promise.resolve(!!this.getItems().length);
	};
	LinkHandler.prototype.determineItems = function() {
		return Promise.resolve(this.getItems());
	};
	// ----------------------------------------------------------------------------------------------------------------
	return LinkHandler;

}, /* bExport= */true);
