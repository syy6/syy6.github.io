/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/mdc/experimental/adapter/odata/ODataBaseAdapter", "./ODataPropertyAdapter"
], function(ODataBaseAdapter, ODataPropertyAdapter) {
	"use strict";

	/**
	 * An object adapter
	 *
	 * @extends sap.ui.mdc.experimental.adapter.odata.ODataBaseAdapter"
	 * @author SAP SE
	 * @version 1.60.42
	 * @alias sap.ui.mdc.experimental.adapter.odata.v4.ODataObjectAdapter
	 * @experimental since 1.62
	 * @private
	 * @abstract
	 */
	var ODataObjectAdapter = ODataBaseAdapter.extend("sap.ui.mdc.experimental.adapter.odata.v4.ODataObjectAdapter", {
		constructor: function(mMetadataContext) {
			ODataBaseAdapter.prototype.constructor.apply(this, [
				mMetadataContext, {
					keys: function() {
						if (this.schema.$Key == 1) {
							return this.schema.$Key[0];
						}

						return this.schema.$Key;
					},
					properties: function() {
						var sKey, sPropertyPath, oProperty, mProperties = {};

						var mPropertyMetadataContext = {
							model: this.oModel
						};

						if (Array.isArray(this.schema)) {
							//array of data fields
							for (var i = 0; i < this.schema.length; i++) {
								mPropertyMetadataContext.path = this.path + i;
								var oPropertyAdapter = new ODataPropertyAdapter(mPropertyMetadataContext);
								mProperties[oPropertyAdapter.name] = oPropertyAdapter;
							}
						} else {
							for (sKey in this.schema) {
								if (sKey[0] !== "$") {// no special annotation
									sPropertyPath = this.metaPath + sKey;
									oProperty = this.oMetaModel.getProperty(sPropertyPath);
									if (oProperty && oProperty.$kind) {
										mPropertyMetadataContext.path = sPropertyPath;
										mProperties[sKey] = new ODataPropertyAdapter(mPropertyMetadataContext);
									}
								}
							}
						}
						return mProperties;
					},
					/**
					 * Promise to the parent
					 */
					parent: function() {
						return this.parentPromise("sap/ui/mdc/experimental/adapter/odata/v4/ODataListAdapter", mMetadataContext);
					}
				}
			]);
		}
	});

	return ODataObjectAdapter;
});
