/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

/**
 * @namespace reserved for Fiori Elements
 * @name sap.fe
 * @private
 * @experimental
 */

/**
 * Initialization Code and shared classes of library sap.fe
 */
sap.ui.define([
	"jquery.sap.global",
	'sap/ui/mdc/XMLComposite',
	'sap/ui/core/util/XMLPreprocessor',
	"sap/ui/base/SyncPromise"
], function (jQuery, XMLComposite, XMLPreprocessor, SyncPromise) {
	"use strict";

	/**
	 * Fiori Elements Library
	 *
	 * @namespace
	 * @name sap.fe
	 * @private
	 * @experimental
	 */

	// library dependencies
	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name: "sap.fe",
		dependencies: [
			"sap.ui.core"
		],
		types: [],
		interfaces: [],
		controls: [],
		elements: [],
		version: "1.60.2"
	});

	/**
	 * Metadata Context will appear as a binding to visitAttributes as it starts with
	 * '{' (curly braces). So we need to hide this for the preprocessor, take metadataContext
	 * out here, before visitAttributes and add it after
	 *
	 * @param {*} oNode
	 * @param {*} oVisitor
	 */
	function visitAttibutesIgnoringMetadataContext(oNode, oVisitor) {
		var vValue = oNode.getAttribute('metadataContexts');
		if (vValue) {
			oNode.removeAttribute('metadataContexts');
		}
		return SyncPromise.resolve(oVisitor.visitAttributes(oNode))
		.then(function () {
			if (vValue) {
				oNode.setAttribute('metadataContexts', vValue);
			}
		});
	}

	/**
	 * Convenience function for registration of the controls to the XMLPreprocessor
	 *
	 * This function is called by the XMLPreprocessor. 'this' is used to remember
	 * the name of the control. So always create a new function via bind("name.of.control")
	 * @param {*} oNode
	 * @param {*} oVisitor
	 */
	function pluginTemplate(oNode, oVisitor) {
		var that = this, oPromise =
			SyncPromise.resolve(visitAttibutesIgnoringMetadataContext(oNode, oVisitor))
		.then(function () {
			return XMLComposite.initialTemplating(oNode, oVisitor, that);
		})
		.then(function () {
			//TODO: metadataContext shouldn't remain after templating. Maybe something for XMLComposite
			oNode.removeAttribute('metadataContexts');
		});
		return oVisitor.find ? oPromise : undefined;
	}

	XMLPreprocessor.plugIn(pluginTemplate.bind("sap.fe.Form"), "sap.fe", "Form");
	XMLPreprocessor.plugIn(pluginTemplate.bind("sap.fe.ViewSwitchContainer"), "sap.fe", "ViewSwitchContainer");

	return sap.fe;

}, /* bExport= */false);
