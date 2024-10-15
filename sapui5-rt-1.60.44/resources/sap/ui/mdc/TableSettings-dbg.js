/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

// TODO: this is just a draft version and is not yet finalized --> just for verifying flex/p13n concepts. We could move some code here to a base
// implementaton for re-use elsewhere
// ---------------------------------------------------------------------------------------
// Helper class used to help handle p13n related tasks in the table and provide change
// ---------------------------------------------------------------------------------------
// ---------------------------------------------------------------------------------------
sap.ui.define([
	"sap/m/Dialog", "sap/m/List", "sap/m/StandardListItem"
], function(Dialog, List, StandardListItem) {
	"use strict";

	// TODO: this is just a draft version and is not final --> just for verifying flex/p13n concepts

	/**
	 * P13n/Settings helper class for sap.ui.mdc.Table.
	 * <h3><b>Note:</b></h3>
	 * The class is experimental and the API/behaviour is not finalised and hence this should not be used for productive usage.
	 *
	 * @author SAP SE
	 * @private
	 * @experimental
	 * @since 1.60
	 * @alias sap.ui.mdc.TableSettings
	 */
	var TableSettings = {

		/**
		 * Test only --> this should most likely be done separately like p13nDialog but hopefully much more lightweight/simpler!
		 */
		_createAndOpenSettings: function(aProperties, fSettingsChange, oSelectorControl) {
			var oSettingsDialog;

			var oSettingsList = new List({
				mode: "MultiSelect",
				noDataText: "Nothing to configure",
				selectionChange: [
					function(oEvt) {
						if (fSettingsChange) {
							fSettingsChange(oEvt);
						}
						oSettingsDialog.close();
					}, oSelectorControl
				]
			});
			aProperties.forEach(function(oProperty) {
				oSettingsList.addItem(new StandardListItem({
					title: oProperty.name
				}).data("_prop", oProperty));
			});
			oSettingsDialog = new Dialog({
				title: "Properties",
				content: oSettingsList,
				afterClose: function() {
					oSettingsDialog.destroy();
				}
			}).open();
		},
		/**
		 * Show Columns panel in a dialog
		 */
		showColumnsPanel: function(oControl) {
			return new Promise(function(resolve, reject) {
				sap.ui.require([
					oControl.getProviderModulePath()
				], function(Provider) {
					if (!Provider || !Provider.fetchProperties || !Provider.createColumn) {
						return;
					}
					var aProperties = Provider.fetchProperties(oControl);
					TableSettings._createAndOpenSettings(aProperties, function(oEvt) {
						var oItem = oEvt.getParameter("listItem");
						var oProp = oItem.data("_prop");
						resolve([
							{
								selectorControl: oControl,
								changeSpecificData: {
									changeType: "addMDCColumn",
									content: oProp
								}
							}
						]);
					}, oControl);
				});
			});
		},
		/**
		 * Create and save end user changes from dialog
		 */
		handleUserChanges: function(aChanges, oControl) {
			return new Promise(function(resolve, reject) {
				sap.ui.require([
					"sap/ui/fl/ControlPersonalizationAPI"
				], function(ControlPersonalizationAPI) {
					ControlPersonalizationAPI.addPersonalizationChanges({
						controlChanges: aChanges
					}).then(function(aDirtyChanges) {
						ControlPersonalizationAPI.saveChanges(aDirtyChanges, oControl).then(function() {
							resolve(arguments);
						});
					});
				});
			});
		}
	};
	return TableSettings;
}, /* bExport= */false);
