/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/fl/changeHandler/Base'
], function(Base) {
	"use strict";

	/**
	 * Change handlers for adding and remove of a link in sap.ui.mdc.base.info.Panel.
	 *
	 * @constructor
	 * @private
	 * @since 1.62.0
	 * @alias sap.ui.mdc.base.info.flexibility.Panel
	 */

	return {
		createChanges: function(oPanel, aDeltaMItems) {
			// Create a 'create' change only for item which does not exist
			return aDeltaMItems.filter(function(oDeltaMItem) {
				return !sap.ui.getCore().byId(oDeltaMItem.id);
			}).map(function(oDeltaMItem) {
				return {
					selectorControl: oPanel,
					changeSpecificData: {
						changeType: "createItem",
						content: {
							id: oDeltaMItem.id
						}
					}
				};
			});
		},
		createItem: {
			layers: {
				USER: true
			},
			changeHandler: {
				applyChange: function(oChange, oPanel, mPropertyBag) {
					return new Promise(function(resolve) {

						// Let's break in XML use-case which is caught by flex. This leads that the change will be triggered again via JS.
						oPanel.getModel();

						sap.ui.require([
							'sap/ui/mdc/base/info/PanelItem', mPropertyBag.modifier.getProperty(oPanel, "metadataHelperPath")
						], function(PanelItem, MetadataHelper) {
							if (mPropertyBag.modifier.bySelector(oChange.getContent().id, mPropertyBag.appComponent, mPropertyBag.view)) {
								return Base.markAsNotApplicable("applyChange of createItem: the item with id " + oChange.getContent().id + " is already existing and therefore can not be created.", true);
							}

							var aMetadataItems = MetadataHelper.retrieveAllMetadata(oPanel).filter(function(oMetadataItem) {
								return oMetadataItem.isMain !== true;
							});

							var fnIndexOfItemId = function(sId, aItems) {
								var iFoundIndex = -1;
								aItems.some(function(oItem, iIndex) {
									if (oItem.getId() === sId) {
										iFoundIndex = iIndex;
										return true;
									}
								});
								return iFoundIndex;
							};
							var aItems = mPropertyBag.modifier.getAggregation(oPanel, "items");
							var iItemsIndex = -1;
							var oMetadataItem = null;
							aMetadataItems.some(function(oMItem) {
								var iItemsIndex_ = fnIndexOfItemId(oMItem.id, aItems);
								if (iItemsIndex_ > -1) {
									iItemsIndex = iItemsIndex_;
								}
								if (oMItem.id === oChange.getContent().id) {
									oMetadataItem = oMItem;
									return true;
								}
							});

							if (oMetadataItem) {
								var oItem = mPropertyBag.modifier.createControl("sap.ui.mdc.base.info.PanelItem", mPropertyBag.appComponent, mPropertyBag.view, oMetadataItem.id, {
									text: oMetadataItem.text,
									description: oMetadataItem.description,
									href: oMetadataItem.href,
									target: oMetadataItem.target,
									icon: oMetadataItem.icon,
									isMain: oMetadataItem.isMain,
									visible: oMetadataItem.visible
								});
								mPropertyBag.modifier.insertAggregation(oPanel, "items", oItem, iItemsIndex + 1);
							}
							return resolve();
						});
					});
				},
				revertChange: function(oChange, oPanel, mPropertyBag) {
					var oItem = mPropertyBag.modifier.bySelector(oChange.getContent().id, mPropertyBag.appComponent, mPropertyBag.view);
					if (!oItem) {
						return Base.markAsNotApplicable("revertChange of createItem: the item with id " + oChange.getContent().id + " is not existing and therefore can not be removed.", true);
					}
					mPropertyBag.modifier.removeAggregation(oPanel, "items", oItem);
				},
				completeChangeContent: function(oChange, mSpecificChangeInfo) {
				}
			}
		}
	};
}, /* bExport= */true);
