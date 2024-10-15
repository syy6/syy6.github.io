/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/mdc/experimental/adapter/AdapterFactory", "./ODataPropertyAdapter", "./ODataObjectAdapter", "./ODataListAdapter"
], function(AdapterFactory, ODataPropertyAdapter, ODataObjectAdapter, ODataListAdapter) {
	"use strict";

	/**
	 * An adapter factory for an OData V4 Meta model
	 *
	 * @extends sap.ui.mdc.adapter.meta.AdapterFactory
	 * @author SAP SE
	 * @version 1.60.42
	 * @alias sap.ui.mdc.adapter.experimental.odata.v4ODataAdapterFactory
	 * @experimental since 1.62
	 * @private
	 * @abstract
	 */
	var ODataAdapterFactory = function() {
		AdapterFactory.apply(this);
	};

	/**
	 * Internal cache of the adapter constructor classes that are determined from the metaPath key: a unique string containing the id of the meta
	 * model and the meta path value: the corresponding meta context promises
	 *
	 * @private
	 */
	ODataAdapterFactory._mAdapterByMetaPathPromiseCache = {};
	/**
	 * Internal cache of the adapter constructor classes that are determined from the metaPath key: a unique string containing the id of the meta
	 * model and the meta path value: the corresponding adapter constructor class
	 *
	 * @private
	 */
	ODataAdapterFactory._mAdapterByMetaPathCache = {};
	/**
	 * @override
	 * @see sap.ui.mdc.meta.AdapterFactory#requestAdapter
	 */
	ODataAdapterFactory.requestAdapter = function(mMetadataContext) {
		var oMetaModel = ODataAdapterFactory._determineMetaPath(mMetadataContext);

		var sKey = oMetaModel.getId() + ">" + mMetadataContext.contextName + ">" + mMetadataContext.metaPath;

		if (!ODataAdapterFactory._mAdapterByMetaPathPromiseCache[sKey]) {
			ODataAdapterFactory._mAdapterByMetaPathPromiseCache[sKey] = new Promise(function(resolve, reject) {
				oMetaModel.requestObject(mMetadataContext.metaPath).then(function(vSchema) {
					resolve(ODataAdapterFactory.getAdapter(mMetadataContext));
				});
			});
		}

		return ODataAdapterFactory._mAdapterByMetaPathPromiseCache[sKey];

	};

	/**
	 * @override
	 * @see sap.ui.mdc.meta.AdapterFactory#getAdapter
	 */
	ODataAdapterFactory.getAdapter = function(mMetadataContext) {
		var oMetaModel = ODataAdapterFactory._determineMetaPath(mMetadataContext);

		var sKey = oMetaModel.getId() + ">" + mMetadataContext.contextName + ">" + mMetadataContext.metaPath;

		if (!ODataAdapterFactory._mAdapterByMetaPathCache[sKey]) {
			var Adapter = ODataAdapterFactory._getAdapterConstructor(oMetaModel, mMetadataContext.metaPath);

			ODataAdapterFactory._mAdapterByMetaPathCache[sKey] = new Adapter(mMetadataContext);
		}

		return ODataAdapterFactory._mAdapterByMetaPathCache[sKey];
	};

	/**
	 * @private
	 */
	ODataAdapterFactory._getAdapterConstructor = function(oMetaModel, sMetaPath) {
		var vSchema = oMetaModel.getObject(sMetaPath);

		if (Array.isArray(vSchema)) {
			return ODataListAdapter;
		}

		switch (vSchema.$kind) {
			case "Property":
			case "NavigationProperty":
				return ODataPropertyAdapter;
			case "EntityType":
				return ODataObjectAdapter;
			case "EntitySet":
				return ODataListAdapter;
			default:
				return ODataPropertyAdapter;
		}
	};

	/**
	 * @private
	 */
	ODataAdapterFactory._determineMetaPath = function(mMetadataContext) {
		var oMetaModel = mMetadataContext.model.getMetaModel();

		if (!mMetadataContext.metaPath) {
			var oMetaContext = null;
			if (mMetadataContext.path.indexOf("##") > -1) {
				oMetaContext = mMetadataContext.model.createBindingContext(mMetadataContext.path);
			} else {
				oMetaContext = oMetaModel.getMetaContext(mMetadataContext.path);
			}
			mMetadataContext.metaPath = oMetaContext.getPath();
		}

		return oMetaModel;
	};

	return ODataAdapterFactory;

});
