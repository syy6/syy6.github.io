/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/mdc/experimental/adapter/AdapterFactory", "./ODataPropertyAdapter", "./ODataObjectAdapter", "./ODataListAdapter"
], function(AdapterFactory, ODataPropertyAdapter, ODataObjectAdapter, ODataListAdapter) {
	"use strict";

	/**
	 * An adapter factory for an OData V2 Meta model
	 *
	 * @extends sap.ui.mdc.meta.AdapterFactory
	 * @author SAP SE
	 * @version 1.60.42
	 * @alias sap.ui.mdc.experimental.adapter.odata.v2.ODataAdapterFactory
	 * @experimental since 1.62
	 * @private
	 * @abstract
	 */
	var ODataAdapterFactory = function() {
		AdapterFactory.apply(this);
	};

	/**
	 * Internal cache of the adapter constructor classes that are determined from the metaPath
	 * key: a unique string containing the id of the meta model and the meta path
	 * value: the corresponding adapter constructor class
	 *
	 * @private
	 */
	ODataAdapterFactory._mAdapterByMetaPathCache = {};

	/**
	 * Internal cache of promisies indicating that the meta model is ready to provide adapter information
	 * key: the unique id of the meta model
	 * value: the 'ready' promise
	 *
	 * @private
	 */
	ODataAdapterFactory._mMetaModelReadyPromise = {};
	/**
	 * @override
	 * @see sap.ui.mdc.meta.AdapterFactory#requestAdapter
	 */
	ODataAdapterFactory.requestAdapter = function(mMetadataContext) {
		var oMetaModel = mMetadataContext.model.getMetaModel();

		var sKey = oMetaModel.getId() + ">" + mMetadataContext.contextName + ">" + mMetadataContext.path;

		if (!ODataAdapterFactory._mMetaModelReadyPromise[sKey]) {
			ODataAdapterFactory._mMetaModelReadyPromise[sKey] = new Promise(function(resolve, reject) {
				oMetaModel.loaded().then(function() {
					resolve(ODataAdapterFactory.getAdapter(mMetadataContext));
				});
			});
		}

		return ODataAdapterFactory._mMetaModelReadyPromise[sKey];

	};

	/**
	 * @override
	 * @see sap.ui.mdc.meta.AdapterFactory#getAdapter
	 */
	ODataAdapterFactory.getAdapter = function(mMetadataContext) {
		var oMetaModel = mMetadataContext.model.getMetaModel();

		var sKey = oMetaModel.getId() + ">" + mMetadataContext.contextName + ">" + mMetadataContext.path;

		if (!ODataAdapterFactory._mAdapterByMetaPathCache[sKey]) {
			var Adapter = ODataAdapterFactory._getAdapterConstructor(oMetaModel, mMetadataContext.path);

			ODataAdapterFactory._mAdapterByMetaPathCache[sKey] = new Adapter(mMetadataContext);
		}

		return ODataAdapterFactory._mAdapterByMetaPathCache[sKey];
	};

	/**
	 * @private
	 */
	ODataAdapterFactory._getAdapterConstructor = function(oMetaModel, sPath) {
		var oMetaContext, iSeparator = sPath ? sPath.indexOf("/##") : -1;


		if (sPath.endsWith("/")) {
			return ODataObjectAdapter;
		}

		if (iSeparator > -1) {
			var sDataPath = sPath.substring(0, iSeparator);
			var oDataMetaContext = oMetaModel.getMetaContext(sDataPath);
			oMetaContext = oMetaModel.createBindingContext(sPath.substring(iSeparator + 3), oDataMetaContext);
		} else {
			oMetaContext = oMetaModel.getMetaContext(sPath);
		}

		var vSchema = oMetaContext.getObject();

		if (Array.isArray(vSchema)) {
			return ODataListAdapter;
		}

		if (sPath.startsWith("/")) {
			sPath = sPath.substring(1);
		}
		var aParts = sPath.split("/");

		if (aParts.length > 1) {
			return ODataPropertyAdapter;
		}

		return ODataListAdapter;
	};

	return ODataAdapterFactory;

});
