/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/mdc/base/FieldInfoBase'
], function(FieldInfoBase) {
	"use strict";

	/**
	 * Constructor for a new FieldInfo.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The <code>FieldInfo</code> control shows Fiori Launchpad actions and other additional information, for example, contact details. The <code>FieldInfo</code> control is used by <code>Field</code>.
	 * @extends sap.ui.mdc.base.FieldInfoBase
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.58.0
	 * @alias sap.ui.mdc.base.FieldInfo
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var FieldInfo = FieldInfoBase.extend("sap.ui.mdc.base.FieldInfo", /** @lends sap.ui.mdc.base.FieldInfo.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			defaultAggregation: "contentHandler",
			aggregations: {
				contentHandler: {
					type: "sap.ui.mdc.base.info.ContentHandler",
					multiple: false
				}
			}
		}
	});

	FieldInfo.prototype.setContentHandler = function(oContentHandler) {
		if (this.getContentHandler()) {
			this.getContentHandler().detachExistenceOfContentChanged();
		}
		this.setAggregation("contentHandler", oContentHandler);
		if (oContentHandler) {
			oContentHandler.attachExistenceOfContentChanged(function() {
				this.fireDataUpdate();
			}.bind(this));
		}
	};

	// ----------------------- Implementation of 'IFieldInfo' interface --------------------------------------------

	/**
	 * In the first step we have just to decide whether the FieldInfo is clickable i.e. has to be rendered as a link.
	 * @returns {Promise} <code>true</code> if the FieldInfo is clickable
	 */
	FieldInfo.prototype.isTriggerable = function() {
		var oContentHandler = this.getContentHandler();
		if (oContentHandler) {
			return oContentHandler.hasPotentialContent();
		}
		return Promise.resolve(false);
	};
	/**
	 * Returns as promise result href of direct link navigation, else null.
	 * @returns {Promise} <code>href</code> of direct link navigation, else null
	 */
	FieldInfo.prototype.getTriggerHref = function() {
		var oContentHandler = this.getContentHandler();
		if (!oContentHandler) {
			return Promise.resolve(null);
		}
		return oContentHandler.getDirectLink().then(function(oLink) {
			return oLink ? oLink.getHref() : null;
		});
	};

	// ----------------------- Implementation of 'ICreateContent' interface --------------------------------------------

	FieldInfo.prototype.getContentTitle = function() {
		var oContentHandler = this.getContentHandler();
		return oContentHandler ? oContentHandler.getContentTitle() : undefined;
	};
	FieldInfo.prototype.getContent = function(fnGetAutoClosedControl) {
		var oContentHandler = this.getContentHandler();
		return oContentHandler ? oContentHandler.getContent(fnGetAutoClosedControl) : Promise.resolve(null);
	};

	// -------------------------------------------------------------------------------------------------------------

	return FieldInfo;

}, /* bExport= */true);
