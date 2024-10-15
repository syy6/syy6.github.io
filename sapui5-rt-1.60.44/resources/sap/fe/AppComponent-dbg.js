/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

// ----------------------------------------------------------------------------------
// Provides base class sap.fe.AppComponent for all generic app components
// ----------------------------------------------------------------------------------
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/UIComponent",
	"sap/m/NavContainer",
	"sap/fe/core/BusyHelper",
	"sap/ui/core/ComponentContainer",
	"sap/fe/core/internal/testableHelper",
	"sap/fe/model/DraftModel",
	"sap/fe/model/NamedBindingModel",
	"sap/fe/controllerextensions/Routing",
	//"sap/fe/controllerextensions/AppState", The AppState is currently deactivated
	"sap/ui/model/resource/ResourceModel",
	//We need to pre-load this for templating until a xml:require is possible
	"sap/ui/mdc/odata/v4/ValueListHelper"
], function (jQuery,
			 UIComponent,
			 NavContainer,
			 BusyHelper,
			 ComponentContainer,
			 testableHelper,
			 DraftModel,
			 NamedBindingModel,
			 Routing,
			 // AppState, The AppState is currently deactivated
			 ResourceModel) {
	"use strict";

	testableHelper.testableStatic(function() {
	}, "suppressPageCreation");

	function getMethods(oAppComponent) {
		var oRouting = new Routing();
		//var oAppState = new AppState(); The AppState is currently deactivated

		// template contract which is used for data interchange between framework classes
		var oTemplateContract = {
			oAppComponent: oAppComponent, // reference to this application component
			oBusyHelper: null // instantiated in createContent
		};

		function getText(sId) {
			var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.fe");
			return oResourceBundle.getText(sId);
		}

		return {
			init: function () {
				var oShellServiceFactory = sap.ui.core.service.ServiceFactoryRegistry.get("sap.ushell.ui5service.ShellUIService");
				oTemplateContract.oShellServicePromise = (oShellServiceFactory && oShellServiceFactory.createInstance()) || Promise.reject();
				oTemplateContract.oShellServicePromise.catch(function () {
					jQuery.sap.log.warning("No ShellService available");
				});

				var oModel = oAppComponent.getModel();
				if (oModel) {
					// upgrade the model to a named binding model
					NamedBindingModel.upgrade(oModel).then(function() {

						// we call the UIComponent init once we upgraded our model to a named binding model
						(UIComponent.prototype.init || jQuery.noop).apply(oAppComponent, arguments);

						oTemplateContract.oBusyHelper.setBusy(oTemplateContract.oShellServicePromise);
						oTemplateContract.oBusyHelper.setBusyReason("initAppComponent", false);

						// Test if draft Model
						DraftModel.isDraftModel(oModel).then(function (bIsDraft) {
							if (bIsDraft) {
								// service contains a draft entity therefore upgrade the model to a draft model
								DraftModel.upgrade(oModel).then(function () {
									oAppComponent.setModel(oModel.getDraftAccessModel(), "$draft");
								});
							} else {
								//This line is to set the updateGroupId so that http patch will not be fired when when value changed in inputs.
								//This is just a hack will be removed once the model gives a way to set this value properly.
								oModel.sUpdateGroupId = "nondraft";
							}
						});
					});

					// Error handling for erroneous metadata request
					oModel.getMetaModel().requestObject("/$EntityContainer/").catch(function (oError) {
						oRouting.navigateToMessagePage(getText("SAPFE_APPSTART_TECHNICAL_ISSUES"), {
							title: getText('SAPFE_ERROR'),
							description: oError.message,
							navContainer : oTemplateContract.oNavContainer
						});
					});
				}

				var oI18nModel = new ResourceModel({
					bundleName: "sap/fe/messagebundle",
					async: true
				});

				oI18nModel.getResourceBundle().then(function(oResourceBundle){
					// once the library is loaded provide sync access
					oI18nModel.getResourceBundle = function(){
						return oResourceBundle;
					};
				});

				oAppComponent.setModel(oI18nModel, "sap.fe.i18n");
			},
			exit: function () {
				if (oTemplateContract.oNavContainer) {
					oTemplateContract.oNavContainer.destroy();
				}
				//oAppState.cleanupAppState(oAppComponent); The AppState is currently deactivated
			},
			createContent: function () {
				// Method must only be called once
				if (oTemplateContract.oNavContainer) {
					return "";
				}

				oTemplateContract.oNavContainer = new NavContainer({
					//id: oAppComponent.getId() + "-appContent"
					// TODO: to be checked if and why we need to add the app component ID
					id: "appContent"
				});

				oTemplateContract.oBusyHelper = new BusyHelper(oTemplateContract);
				oTemplateContract.oBusyHelper.setBusyReason("initAppComponent", true, true);

				//oAppState.initializeAppState(oAppComponent); The AppState is currently deactivated
				oRouting.initializeRouting(oAppComponent);

				return oTemplateContract.oNavContainer;
			}
		};
	}

	return UIComponent.extend("sap.fe.AppComponent", {
		metadata: {
			config: {
				fullWidth: true
			},
			routing: {
				"config": {
					"routerClass": "sap.m.routing.Router",
					"viewType": "XML",
					"controlId": "appContent",
					"controlAggregation": "pages",
					"async": true
				}
			},
			library: "sap.fe"
		},

		constructor: function () {
			var oAppId = testableHelper.startApp(); // suppress access to private methods in productive coding
			jQuery.extend(this, getMethods(this, oAppId));

			(UIComponent.prototype.constructor || jQuery.noop).apply(this, arguments);
		}
	});
});
