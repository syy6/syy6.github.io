/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/mdc/experimental/adapter/odata/ODataBaseAdapter", "./ODataObjectAdapter", "./ODataPropertyAdapter"
], function(ODataBaseAdapter, ODataObjectAdapter, ODataPropertyAdapter) {
	"use strict";

	/**
	 * A list adapter
	 *
	 * @extends sap.ui.mdc.experimental.adapter.odata.ODataBaseAdapter"
	 * @author SAP SE
	 * @version 1.60.42
	 * @alias sap.ui.mdc.experimental.adapter.odata.v4.ODataListAdapter
	 * @experimental since 1.62
	 * @private
	 * @abstract
	 */
	var ODataListAdapter = ODataBaseAdapter.extend("sap.ui.mdc.experimental.adapter.odata.v4.ODataListAdapter", {
		constructor: function(mMetadataContext) {
			ODataBaseAdapter.prototype.constructor.apply(this, [
				mMetadataContext, {
					object: function() {
						var mObjectContext = {
							model: this.oModel,
							path: this.path + "/",
							metaPath: this.entitySetPath + "/"
						};
						return new ODataObjectAdapter(mObjectContext);
					},
					name: function() {
						return this.oMetaModel.getObject(this.entitySetPath + "@sapui.name");
					},
					fields: function() {
						var aFields = [];

						var mPropertyMetadataContext = {
							model: this.oModel
						};

						if (Array.isArray(this.schema)) {
							for (var i = 0; i < this.schema.length; i++) {
								mPropertyMetadataContext.path = this.path + "/" + i;
								aFields.push(new ODataPropertyAdapter(mPropertyMetadataContext));
							}
						} else {
							var sKey, sPropertyPath, oProperty;
							var oObject = this.oMetaModel.getObject(this.path + "/");

							for (sKey in oObject) {
								if (sKey[0] !== "$") {// no special annotation
									sPropertyPath = this.path + "/" + sKey;
									oProperty = this.oMetaModel.getProperty(sPropertyPath);
									if (oProperty && oProperty.$kind) {
										mPropertyMetadataContext.path = sPropertyPath;
										if (oProperty.$kind == "Property") {
											aFields.push(new ODataPropertyAdapter(mPropertyMetadataContext));
										} else if (oProperty.$kind == "NavigationProperty" && !oProperty.$isCollection) {
											aFields.push(new ODataListAdapter(mPropertyMetadataContext));
										}
									}
								}
							}
						}

						return aFields;
					},
					collection: function() {
						var sCollectionPath = "/";

						if (this.iSeparator > -1) {
							sCollectionPath = this.path.substring(0, this.iSeparator);
						} else {
							sCollectionPath = this.path;
						}
						return sCollectionPath;
					}
				}
			]);
		},
		init: function() {
			ODataBaseAdapter.prototype.init.apply(this, arguments);
			if (this.iSeparator > -1) {
				this.entitySetPath = this.path.substring(0, this.iSeparator);
				if (this.entitySetPath.endsWith("/")) {
					// remove last character
					this.entitySetPath = this.entitySetPath.slice(0, -1);
				}
				var oEntitySetCtx = this.oMetaModel.getMetaContext(this.entitySetPath);
				this.entitySetPath = oEntitySetCtx.getPath();
				this.entitySet = oEntitySetCtx.getObject("");
			} else {
				this.entitySet = this.schema;
				this.entitySetPath = this.metaPath;
			}

		}
	});

	return ODataListAdapter;
});
