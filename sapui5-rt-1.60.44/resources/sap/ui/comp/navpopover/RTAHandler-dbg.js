/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/comp/library',
	'sap/ui/comp/personalization/Controller',
	'sap/ui/comp/personalization/Util',
	'./Util',
	'sap/ui/comp/navpopover/flexibility/changes/AddLink',
	'sap/ui/comp/navpopover/flexibility/changes/RemoveLink',
	'sap/ui/fl/changeHandler/JsControlTreeModifier',
	'./Factory'
], function(
	CompLibrary,
	Controller,
	PersonalizationUtil,
	Util,
	AddLink,
	RemoveLink,
	JsControlTreeModifier,
	Factory
) {
	"use strict";

	// shortcut for sap.ui.comp.navpopover.ChangeHandlerType
	var ChangeHandlerType = CompLibrary.navpopover.ChangeHandlerType;

	/**
	 * Runtime adaptation handler.
	 *
	 * @constructor
	 * @private
	 * @since 1.44.0
	 * @alias sap.ui.comp.navpopover.RTAHandler
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var RTAHandler = {};

	RTAHandler.isSettingsAvailable = function() {
		return !!Factory.getService("CrossApplicationNavigation");
	};

	RTAHandler.getStableElements = function(oNavigationPopoverHandler) {
		if (!oNavigationPopoverHandler || !(oNavigationPopoverHandler.isA("sap.ui.comp.navpopover.NavigationPopoverHandler"))) {
			return null;
		}
		var sStableID = oNavigationPopoverHandler.getNavigationPopoverStableId();
		if (!sStableID) {
			return null;
		}
		var oAppComponent = oNavigationPopoverHandler.getAppComponent();
		if (!oAppComponent) {
			return null;
		}
		return [
			{
				id: sStableID,
				appComponent: oAppComponent
			}
		];
	};

	RTAHandler.execute = function(oNavigationPopoverHandler, fGetUnsavedChanges, sRtaStyleClass) {
		return new Promise(function(resolve, reject) {
			if (!oNavigationPopoverHandler || !(oNavigationPopoverHandler.isA("sap.ui.comp.navpopover.NavigationPopoverHandler"))) {
				return reject(new Error("oNavigationPopoverHandler is not of supported type sap.ui.comp.navpopover.NavigationPopoverHandler"));
			}
			if (!oNavigationPopoverHandler.getNavigationPopoverStableId()) {
				return reject(new Error("StableId is not defined. SemanticObject=" + oNavigationPopoverHandler.getSemanticObject()));
			}
			var oAppComponent = oNavigationPopoverHandler.getAppComponent();
			if (!oAppComponent) {
				return reject(new Error("AppComponent is not defined. oControl=" + oNavigationPopoverHandler.getControl()));
			}

			oNavigationPopoverHandler._getNavigationContainer().then(function(oNavigationContainer) {
				var aMAddedLinks = [];
				var aMRemovedLinks = [];

				var fCallbackAfterClose = function(aChanges) {
					var sStableId = oNavigationContainer.getId();
					aMAddedLinks = aChanges.filter(function(oMLink) {
						return oMLink.visible === true;
					}).map(function(oMLink) {
						return {
							selectorControl: {
								id: sStableId,
								controlType: "sap.ui.comp.navpopover.NavigationContainer",
								appComponent: oAppComponent
							},
							changeSpecificData: {
								changeType: ChangeHandlerType.addLink,
								content: oMLink
							}
						};
					});
					aMRemovedLinks = aChanges.filter(function(oMLink) {
						return oMLink.visible === false;
					}).map(function(oMLink) {
						return {
							selectorControl: {
								id: sStableId,
								controlType: "sap.ui.comp.navpopover.NavigationContainer",
								appComponent: oAppComponent
							},
							changeSpecificData: {
								changeType: ChangeHandlerType.removeLink,
								content: oMLink
							}
						};
					});
				};

				oNavigationContainer.openSelectionDialog(true, false, fCallbackAfterClose, false, sRtaStyleClass).then(function() {
					oNavigationContainer.destroy();
					resolve(aMAddedLinks.concat(aMRemovedLinks));
				});
			});
		});
	};

	return RTAHandler;
},
/* bExport= */true);