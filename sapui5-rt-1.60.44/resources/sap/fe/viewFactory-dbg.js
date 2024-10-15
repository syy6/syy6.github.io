/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.core.mvc.View.
sap.ui.define([
	'sap/ui/thirdparty/jquery',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/base/ManagedObjectModel',
	'sap/ui/core/cache/CacheManager',
	'sap/ui/core/mvc/View'
],
function (jQuery, JSONModel, ManagedObjectModel, Cache) {
	"use strict";

	function create(mParameters) {
		var sViewName = mParameters.viewName,
			oAppComponent = mParameters.appComponent,
			sEntitySet = mParameters.entitySet,
			mViewData = mParameters.viewData,
			oMetaModel = mParameters.model.getMetaModel(),
			sStableId = mParameters.viewId,
			mCache = null,
			sCacheKeys;

		// 	Pre-Load libraries
		//  Library loading should be handled by manifest dependencies; waiting for UI5 routing working with components
		var	aPreLoadPromises = loadLibraries(sViewName);

		// Generate the FE cache key
		var sKey = oAppComponent.getMetadata().getName() + "_" + sStableId + "_" + sap.ui.getCore().getConfiguration().getLanguageTag(),
			aPreRequisites = [];

		aPreRequisites.push(
			Promise.all([Cache.get(sKey),oMetaModel.requestObject("/")])
			// Read FE Cache and wait until MetaModel has loaded all sources defined in the manifest
			.then(function(aResults) {
				var mCacheOutput = aResults[0];

				function checkMetadata(sUrl, sETag) {
					var mETags = oMetaModel.getETags();
					return new Promise(function(resolve, reject){
						if (!mETags[sUrl]) {
							// There is an Url in the FE cache, that's not in the MetaModel yet -> we need to check the ETag
							jQuery.ajax(sUrl, {
								method : 'GET'
							}).then(function (oResponse, sTextStatus, jqXHR) {
								if (sETag !== jqXHR.getResponseHeader('ETag') &&
									sETag !== jqXHR.getResponseHeader('Last-Modified')) {
									// ETag is not the same -> invalid
									resolve(false);
								} else {
									// ETag is the same -> valid
									resolve(true);
								}
							}, function (jqXHR, sTextStatus, sErrorMessage) {
								// Request failed -> assuming it's invalid
								resolve(false);
							});
						} else if (sETag !== mETags[sUrl]) {
							// ETag is not the same -> invalid
							resolve(false);
						} else {
							// ETag is the same -> valid
							resolve(true);
						}
					});
				}

				function checkAllMetadata(mCacheKeys) {
					var aMetadataPromises = [];
					Object.keys(mCacheKeys).forEach(function(sUrl) {
						// Check validity of every single Url that's in the FE Cache object
						aMetadataPromises.push(checkMetadata(sUrl, mCacheKeys[sUrl]));
					});
					return Promise.all(aMetadataPromises);
				}

				if (mCacheOutput) {
					// Cache entry found, check if it's still valid
					return checkAllMetadata(JSON.parse(mCacheOutput.newCacheKey)).then(function(aValid) {
						sCacheKeys = mCacheOutput.newCacheKey;
						if (aValid.every(function(valid) {return valid;})) {
							// Every ETag is still valid -> take the old cache key
							mCache = {keys: [mCacheOutput.oldCacheKey]};
						} else {
							// At least one ETag is invalid -> take the new cache key
							mCache = {keys: [sCacheKeys]};
						}
					});
				} else {
					// No cache entry, set a key... so an xml view cache entry is written
					sCacheKeys = 'initial';
					// Check if cache can be used (all the metadata and annotations have to provide at least a ETag or a Last-Modified header)
					var mETags = oMetaModel.getETags();
					Object.keys(mETags).forEach(function(sUrl) {
						if (!mETags[sUrl]) {
							sCacheKeys = null;
						}
					});
					mCache = {keys: [sCacheKeys]};
				}
			})
		);

		// Templating requires the mdc library.js which has to be loaded before view is created
		// Library loading should be handled by manifest dependencies; waiting for UI5 routing working with components
		aPreRequisites = aPreRequisites.concat(loadLibraries("loadFirst"));

		return Promise.all(aPreRequisites).then(function(){

			var	oDeviceModel = new JSONModel(sap.ui.Device),
				oManifestModel = new JSONModel(oAppComponent.getMetadata().getManifest()),
				oViewDataModel = new JSONModel(mViewData),

				oViewSettings = {
					type : "XML",
					async: true,
					preprocessors: {
						xml: {
							bindingContexts: {
								entitySet: sEntitySet ? oMetaModel.createBindingContext("/" + sEntitySet) : null,
								viewData: mViewData ? oViewDataModel.createBindingContext("/") : null
							},
							models: {
								entitySet: oMetaModel,
								'sap.ui.mdc.metaModel': oMetaModel,
								'sap.fe.deviceModel': oDeviceModel, // TODO: discuss names here
								'manifest' : oManifestModel,
								'viewData' : oViewDataModel
							}
						}
					},
					id: sStableId,
					viewName: sViewName,
					viewData : mViewData,
					cache: mCache,
					height: "100%"
				};

			oDeviceModel.setDefaultBindingMode("OneWay");

			return oAppComponent.runAsOwner(function () {
				var oView = sap.ui.view(oViewSettings);

				oView.setModel(new ManagedObjectModel(oView), "$view");

				return Promise.all(aPreLoadPromises).then(function () {
					// Render view if all preloads are done
					return oView.loaded();
				}).then(function(oView) {
					// Check FE cache after XML view is processed completely
					var sDataSourceETags = JSON.stringify(oMetaModel.getETags());
					if (sCacheKeys && sCacheKeys !== sDataSourceETags) {
						// Something in the sources and/or its ETags changed -> update the FE cache
						var mCacheKeys = {};
						// New ETags that need to be verified
						mCacheKeys.newCacheKey = sDataSourceETags;
						// Old ETags that are used for the xml view cache as key
						mCacheKeys.oldCacheKey = sCacheKeys;
						Cache.set(sKey, mCacheKeys);
					}
					return oView;
				});
			});
		});
	}

	var libraryPreloads = {
		"loadFirst": ["sap.ui.mdc"], //All libraries that have XMLComposites using pre-processor plugins must be loaded first
		"sap.fe.templates.ListReport" : ["sap.m", "sap.f", "sap.ui.fl"],
		"sap.fe.templates.ObjectPage" : ["sap.m", "sap.f", "sap.uxap", "sap.ui.layout"]
	};

	function loadLibraries(sViewName){
		var aLoadPromises = [];
		var aLibraries = libraryPreloads[sViewName] || [];
		for (var i = 0; i < aLibraries.length; i++){
			aLoadPromises.push(sap.ui.getCore().loadLibrary(aLibraries[i], {async: true }));
		}
		return aLoadPromises;
	}

	var viewFactory = {
		create: create
	};

	return viewFactory;
});