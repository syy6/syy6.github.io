/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([], function() {
	"use strict";
	/**
	 * Abstract Adapter Factory The adapter factory is used to determine depending on a binding path an adapter that uses internal knowledge on the
	 * structure of the model. There are currently three kinds of adapters:
	 *
	 * The property adapters are used for bindings that evaluate to a property of a certain object/entity, e.g. /Products/Name
	 * The object adapters are used for bindings that evaluate to a certain object/entity, e.g. /Products{key}
	 * The list adapters are used for bindings that evaluate to a certain list/collection, e.g. /Products
	 *
	 * @experimental Since 1.62
	 * @private
	 * @abstract
	 */

	var AdapterFactory = function() {
	};

	/**
	 * Runs asynchronuosly and delivers a promise to an adapter
	 *
	 * @param {object} mMetadataContext a map containing meta data context
	 * @param {sap.ui.model} mMetadataContext.model the current model
	 * @param {string} mMetadataContext.path the absolute binding path without key information
	 * @param {string} mMetadataContext.metaPath the path inside the meta model pointing to the binding
	 * @param {string} mMetadataContext.modelName the name of the model
	 * @param {string} mMetadataContext.contextName the name of the context
	 * @return {Promise} A promise which is resolved with the requested adapter
	 */
	AdapterFactory.requestAdapter = function(mMetadataContext) {
		return null;
	};

	/**
	 * The synchronuos version of request adapter
	 *
	 * @param {object} mMetadataContext a map containing meta data context
	 * @param {sap.ui.model} mMetadataContext.model the current model
	 * @param {string} mMetadataContext.path the absolute binding path without key information
	 * @param {string} mMetadataContext.metaPath the path inside the meta model pointing to the binding
	 * @param {string} mMetadataContext.modelName the name of the model
	 * @param {string} mMetadataContext.contextName the name of the context
	 * @return {sap.ui.mdc.meta.BaseAdapter} an instance of a context specific adapter
	 *
	 * @see #requestAdapter
	 */
	AdapterFactory.getAdapter = function(mMetadataContext) {
		return null;
	};

	return AdapterFactory;
});
