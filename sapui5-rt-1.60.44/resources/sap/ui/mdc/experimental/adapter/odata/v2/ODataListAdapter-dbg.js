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
	 * @alias sap.ui.mdc.experimental.adapter.odata.v2.ODataListAdapter
	 * @experimental since 1.62
	 * @private
	 * @abstract
	 */
	var ODataListAdapter = ODataBaseAdapter.extend("sap.ui.mdc.experimental.adapter.odata.v2.ODataListAdapter", {
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
						return this.entitySet.name;
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
							if (this.schema.property) {
								for (i = 0; i < this.schema.property.length; i++) {
									mPropertyMetadataContext.path = this.path + "/" + this.schema.property[i].name;
									aFields.push(new ODataPropertyAdapter(mPropertyMetadataContext));
								}
							}
							if (this.schema.navigationProperty) {
								var oAssocationEnd;
								for (i = 0; i < this.schema.navigationProperty.length; i++) {
									oAssocationEnd = this.oMetaModel.getODataAssociationEnd(this.schema, this.schema.navigationProperty[i].name);
									if (oAssocationEnd.multiplicity == "1" || oAssocationEnd.multiplicity == "0..1") {
										mPropertyMetadataContext.path = this.path + "/" + this.schema.navigationProperty[i].name;
										aFields.push(new ODataListAdapter(mPropertyMetadataContext));
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
			this.entitySet = this.calculateEntitySet();
		}
	});

	return ODataListAdapter;
});
