/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

// ---------------------------------------------------------------------------------------
// Helper class used to help create content in the table/column and fill relevant metadata
// ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------
sap.ui.define([
	"./Column", "sap/m/Text"
], function(Column, Text) {
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
	 * @alias sap.ui.mdc.TableHelper
	 */
	var TableHelper = {
		/**
		 * Fetches the relevant metadata for the table and returns property info array
		 * 
		 * @param {Object} oTable - the instance of MDC table
		 * @returns {Array} array of property info
		 */
		fetchProperties: function(oTable) {
			return [];
		},

		/**
		 * Creates the Column for the specified property info and table
		 * 
		 * @param {Object} oPropertyInfo - the property info object/json containing at least name and label properties
		 * @param {Object} oTable - the instance of MDC table
		 * @returns {sap.ui.mdc.Column} instance of mdc.Column
		 */
		createColumn: function(oPropertyInfo, oTable) {
			return new Column({
				header: oPropertyInfo.label || oPropertyInfo.name,
				dataProperties: [
					oPropertyInfo.name
				],
				template: TableHelper.createColumnTemplate(oPropertyInfo)
			});
		},

		/**
		 * Creates and returns the template of the column for the specified info
		 * 
		 * @param {Object} oPropertyInfo - the property info object/json containing at least name and label properties
		 * @returns {sap.ui.core.Control} template to be used in the column/cell
		 */
		createColumnTemplate: function(oPropertyInfo) {
			return new Text({
				text: {
					path: oPropertyInfo.name
				}
			});
		}
	};
	return TableHelper;
}, /* bExport= */false);
