/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

// ---------------------------------------------------------------------------------------
// Helper class used to help create content in the table/column and fill relevant metadata
// ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------
sap.ui.define([
	"sap/ui/mdc/TableHelper"
], function(TableHelper) {
	"use strict";
	/**
	 * Helper class for sap.ui.mdc.Table.
	 * <h3><b>Note:</b></h3>
	 * The class is experimental and the API/behaviour is not finalised and hence this should not be used for productive usage.
	 *
	 * @author SAP SE
	 * @private
	 * @experimental
	 * @since 1.60
	 * @alias sap.ui.mdc.odata.v4.TableHelper
	 */
	var ODataTableHelper = Object.assign({}, TableHelper);
	/**
	 * Fetches the relevant metadata for the table and returns property info array
	 *
	 * @param {Object} oTable - the instance of MDC table
	 * @returns {Array} array of property info
	 */
	ODataTableHelper.fetchProperties = function(oTable) {
		var aProperties = [], oObj, oEntityType, sEntitySetPath, oModel, oMetaModel;
		sEntitySetPath = oTable._oBindingInfo.path; // TODO: figure out the entitySet via binding/API (metadataContext?)
		oModel = oTable.getModel(oTable._oBindingInfo.model);// TODO: figure out proper model name (metadataContext?)
		oMetaModel = oModel.getMetaModel();
		oEntityType = oMetaModel.getObject(sEntitySetPath + "/");
		for ( var sKey in oEntityType) {
			oObj = oEntityType[sKey];
			if (oObj && oObj.$kind === "Property") {
				// TODO: Enhance with more properties as used in MetadataAnalyser
				aProperties.push({
					name: sKey,
					label: oMetaModel.getObject(sEntitySetPath + "/" + sKey + "@com.sap.vocabularies.Common.v1.Label"),
					type: oObj.$Type
				});
			}
		}
		return aProperties;
	};

	return ODataTableHelper;
}, /* bExport= */false);
