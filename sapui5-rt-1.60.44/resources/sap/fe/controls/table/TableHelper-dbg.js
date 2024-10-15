/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */
sap.ui.define([], function() {
	"use strict";

	/**
	 * Helper class used by MDC controls for OData(V4) specific handling
	 *
	 * @private
	 * @experimental This module is only for internal/experimental use!
	 */
	var TableHelper = {
		getLineItemCollection: function(oContext) {
			var oCollectionContext, oMetaModel, sEntitySetPath;// , sAnnotationPath, oEntitySetContext, oColumnsContext, oPresentationVariant,
			// oSelectionPresentationVariant, oWorkingContext;
			if (oContext) {
				// Try to find the metadataContext path assigned to "collection" (this may be the entitySet for OData models)
				oCollectionContext = oContext.getObject("/collection");

				if (oCollectionContext) {
					oMetaModel = oCollectionContext.getModel();
				}

				if (oMetaModel && oMetaModel.isA("sap.ui.model.odata.v4.ODataMetaModel")) {
					sEntitySetPath = oCollectionContext.getPath();
					return oMetaModel.getMetaContext(sEntitySetPath + "/@com.sap.vocabularies.UI.v1.LineItem");
				}
				// TODO: implement other options/fall-backs --> e.g. PresentationVariant parsing!
			}
		},
		/**
		 * Get all fields from collection path
		 */
		getCollectionFields: function(sEntitySetPath, oMetaModel) {
			var aProperties = [], oObj, oEntityType;
			oEntityType = oMetaModel.getObject(sEntitySetPath + "/");
			for ( var sKey in oEntityType) {
				oObj = oEntityType[sKey];
				if (oObj && oObj.$kind === "Property") {
					aProperties.push({
						name: sKey,
						label: oMetaModel.getObject(sEntitySetPath + "/" + sKey + "@com.sap.vocabularies.Common.v1.Label"),
						type: oObj.$Type
					});
				}
			}
			return aProperties;
		}
	};

	return TableHelper;

}, /* bExport= */true);
