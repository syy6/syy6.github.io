/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// ------------------------------------------------------------------------------------------------------------
// This class handles inner app navigation for Smart Template based apps.
// The class exposes its services in two ways:
// 1. There is a public API providing the navigation methods navigateToRoot, navigateToContext, navigateToMessagePage, and navigateBack
//    to Template developers and even Breakout developers.
// 2. A richer object oNavigationControllerProxy is created (see constructor) which is used by the core classes of the SmartTemplate framework.
//    This object allows more detailed interaction with navigation.

// Moreover, this class is responsible for handling the route matched events occuring within a Smart Template based App.

// Within this class we differentiate between a number of different scenarios for navigation/url-changes:
// 1. A state change is a change of the url which does not lead to a new route, but just modifies the encoding of the internal state of one view in the
//    url. Whenever a route matched event occurs it is first checked, whether this corresponds to a state change.
//    If this is true, we do not consider it as a navigation and all further handling of the url within this class is stopped.
//    It is assumed that the state change is totally controlled by the component that has initiated the state change.
//    Note that agents might register themselves as possible state changers via sap.suite.ui.generic.template.lib.Application.registerStateChanger.
//    A new url is passed to the registered state changers one after the other (method isStateChange). If any of those returns true the processing
//    of the url is stopped.
// 2. Illegal urls: The user enters a url which belongs to this App but not to a legal route. This is not considered as a navigation.
// 3. Back navigation: Back navigation can be triggered by the user pressing the browser-back button (then we have no control), the user pressing the
//    back button within the App, or programmatically (e.g. after cancelling an action).
// 4. Programmatic (forward) navigation: The program logic often demands the navigation to be triggerd programmatically. Such navigation is always forwarded to
//    function fnNavigate. Note that this function automatically performs a back navigation, when the navigation target is the same as the last history entry.
//    Note that it is also possible to navigate programmatically to the MessagePage. However, this does not change the url and is therefore not considered as navigation.
// 5. Manual navigation: The user can navigate inside the running App by modifying the url manually (more probable: by selecting a bookmark/history entry
//    which leads to some other place within the App). Note that in this case the navigation may be totally uncontrolled within the App.
// 6. Follow-up navigation: In some cases a navigation directly triggers another navigation. For the user only one navigation step is performed although the url changes several times.
//    In principle there are two possible flavours of the follow-up navigation:
//    a) The url-change is performed programmatically. Already at this point in time it is known, that a follow-up navigation needs to be performed.
//       Actually this is only important in case that more than one back-navigation needs to be performed in order to 'clean' the history.
//    b) The need for follow-up navigation is detected when a route-matched event is processed. In this case the url-change may have been performed programmatically
//       or manually. This case, e.g. applies when the url points to a draft which has meanwhile been activated.
// 7. Pseudo navigation: The url is not changed, but the set of views to be displayed changes. This can happen, when the message page is displayed or when the
//    user changes the size of the browser in an FCL-based App.
//
// We also use the notion of 'logical navigation steps'.
// Cases 3, 4, 5, and 7 are considered to be logical navigation steps.
// 2 is no logical navigation step, but will be forwarded to 7 (message page displayed) which is a logical navigation step.
// State changes (1) and follow-up navigation (6) will not create a new logical navigation step.
// ------------------------------------------------------------------------------------------------------------
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/Object", "sap/ui/core/ComponentContainer", "sap/ui/core/routing/HashChanger", "sap/ui/core/routing/History", "sap/ui/core/routing/HistoryDirection",
	"sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/m/MessageBox", "sap/m/MessagePage", "sap/m/Link",
	"sap/suite/ui/generic/template/lib/ProcessObserver", "sap/suite/ui/generic/template/lib/routingHelper",
	"sap/suite/ui/generic/template/lib/TemplateComponent", "sap/suite/ui/generic/template/lib/testableHelper", "sap/ui/fl/ControlPersonalizationAPI"
], function(jQuery, BaseObject, ComponentContainer, HashChanger, History, HistoryDirection, Filter, FilterOperator, MessageBox, MessagePage, Link,
	ProcessObserver, routingHelper, TemplateComponent, testableHelper, ControlPersonalizationAPI) {
	"use strict";

	var oHistory = History.getInstance();

	// Private static methods

	// The part of the url specifying in detail the target within the App is called the hash. Note that this hash sometimes comes with a leading "/", sometimes without. Both
	// representations are equivalent. This function creates a normalized representation (always containing the leading "/"). Below this representation is called "normalized hash".
	function fnNormalizeHash(sHash) {
		if (sHash.indexOf("/") === 0){
			return sHash;
		}
		return "/" + sHash;
	}
	/*
	 * Creates a new ComponentContainer with template from routing configuration
	 * @param {Object}oAppComponentg - the application component
	 * @param {Object} oRouteConfig - the route configuration
	 * @returns {sap.ui.core.ComponentContainer} instance of the component container
	 */
	function fnCreateComponentInstance(oTemplateContract, oRouteConfig, fnComponentCreateResolve) {
		var sTemplate = oRouteConfig.template;
		var sEntitySet = oRouteConfig.entitySet;
		var iViewLevel = oRouteConfig.viewLevel;
		var iObserverIndex = -1;
		if (oTemplateContract.oFlexibleColumnLayoutHandler){
			iObserverIndex = iViewLevel < 3 ? iViewLevel : 0;
		}
		var oNavigationObserver = iObserverIndex < 0 ? oTemplateContract.oNavigationObserver : oTemplateContract.aNavigationObservers[iObserverIndex];
		var oHeaderLoadingObserver = new ProcessObserver();
		var oLoadingObserverParent = iObserverIndex < 0 ? oTemplateContract.oHeaderLoadingObserver : oTemplateContract.aHeaderLoadingObservers[iObserverIndex];
		oLoadingObserverParent.addObserver(oHeaderLoadingObserver);
		var oPreprocessorsData = {};
		var oSettings = {
			appComponent: oTemplateContract.oAppComponent,
			isLeaf: !oRouteConfig.pages || !oRouteConfig.pages.length,
			entitySet: sEntitySet,
			navigationProperty: oRouteConfig.navigationProperty,
			componentData: {
				registryEntry: {
					oAppComponent: oTemplateContract.oAppComponent,
					componentCreateResolve: fnComponentCreateResolve,
					route: oRouteConfig.name,
					routeConfig: oRouteConfig,
					viewLevel: iViewLevel,
					routingSpec: oRouteConfig.routingSpec,
					oNavigationObserver: oNavigationObserver,
					oHeaderLoadingObserver: oHeaderLoadingObserver,
					preprocessorsData: oPreprocessorsData
				}
			}
		};

		if (oRouteConfig.component.settings) {
			// consider component specific settings from app descriptor
			jQuery.extend(oSettings, oRouteConfig.component.settings);
		}

		var oComponentContainer;
		// Note: settings are passed to Component and to ComponentContainer. This has to be revisited.
		oTemplateContract.oAppComponent.runAsOwner(function() {
			try {
				var oComponentPromise = sap.ui.core.Component.create({
					name: sTemplate,
					settings: oSettings,
					handleValidation: true,
					manifest: true
				});

				var oLoadedPromise;

				oComponentContainer = new ComponentContainer({
					propagateModel: true,
					width: "100%",
					height: "100%",
					settings: oSettings
				});

				oLoadedPromise = oComponentPromise.then(function(oComponent) {
					oComponentContainer.setComponent(oComponent);
					return oComponentContainer;
				});


				// add the 'loaded' function to make the component container behave the same as a view
				oComponentContainer.loaded = function() {
					return oLoadedPromise;
				};
			} catch (e) {
				throw new Error("Component " + sTemplate + " could not be loaded");
			}
		});
		return oComponentContainer;
	}

	// Definition of instance methods
	function getMethods(oTemplateContract, oNavigationControllerProxy) {

		/* support templating QUnit tests */
		testableHelper.testable(fnCreateComponentInstance, "fnCreateComponentInstance");

		var mMessagePageParams = {};
		// oCurrentHash contains some information about the current navigation state. A new instance is created for each logical navigation step (when the url is caught).
		// The old instance is pushed onto aPreviousHashes (see below) at this moment.
		var oCurrentHash = { // The initial instance represents the time before the app was started. Note that this entry might be preceeded by null values in aPreviousHashes when pseudo hash changes occur before the first real hash change.
			iHashChangeCount: 0, // the value of this property is increased with each logical navigation step. It is used to identify the logical navigation steps.
			backTarget: 0   // the hashChangeCount of the logical navigation step that will be reached via back navigation. Value of 0 means, that back will leave the app.
		};
		// The following properties are added to the currentHash during runtime
		// - oEvent           A copy of the route-matched event that was used to come here. The initial instance of oCurrentHash can be identified by the fact that this property is faulty. 
		// - hash:            The (normalized) hash of the current url
		// - targetHash:      If the logical step is navigated away via fnNavigate: (normalized) hash that is navigated to
		// - LeaveByBack:     Information whether the logical navigation step was left via back functionality
		// - LeaveByReplace   Information whether the logical navigation step was removed from history
		// - backwardingInfo: This property is truthy in case the logical step was left via a 'complex' back navigation.
		//                    A complex back navigation can navigate more then one step back and it can be followed by a follow-up
		//                    forward navigation (in order to adjust state)
		//                    backwardingInfo contains the following properties
		//					  * backCount: (maximal) number of back navigations that have to be performed
		//				      * targetViewLevel: optional. If the property is set the back navigation stops when this view level
		//                      is reached (even if backCount requires more back steps)
		//				      * targetHash: The (normalized) hash that finally should be reached
		// - forwardingInfo:  This property is only set temporarily. It is added (in fnHandleRouteMatched) in the following cases
		//                    * If oCurrentHash.backwardingInfo is truthy, a new logical navigation step is started. Therefore, a new instance for oCurrentHash
		//                      is created. Properties backCount, targetViewLevel, and targetHash are copied from backwardingInfo of the previous instance into
		//                      forwardingInfo of the new instance.
		//                      Moreover, properties bIsProgrammatic and bIsBack of forwardingInfo are set to true and iHashChangeCount is set to the same value as
		//                      in the enclosing oCurrentHash.
		//                    * The current url points to a context that is not valid anymore. Method ContextBookkeeping.getAlternativeContextPromise has delivered
		//                      (a Promise to) an alternative context which should be navigated to. In this case only properties bIsProgrammatic, bIsBack, and
		//                      iHashChangeCount are set. bIsProgrammatic contains information whether the logical navigation was triggered programmatically.
		//                      bIsBack contains the information whether the logical navigation step was reached by backward navigation.
		//                      iHashChangeCount is set to the same value as in the enclosing oCurrentHash.
		//                    The property is removed again when the final physical navigation step of a logical navigation step has been performed.

		var aPreviousHashes = []; // array of previous instances of oCurrentHash. Length is always be identical to oCurrentHash.iHashChangeCount. iHashChangeCount of each entry is equal to its position.
		                          // Note that this array may also contain null-values. They are added for pseudo hash changes.

		var oActivationPromise = Promise.resolve(); // Enables to wait for the end of the current activation of all components

		// Variables needed to build the navigation menu
		var aBreadCrumbTexts = [];
		var aNavigationMenue = [];

		var aCurrentKeys = [];

		/* get all pages that may be created for functional testing */
		function fnGetAllPages() {
			var oRouter = oNavigationControllerProxy.oRouter,
				oTargets = oRouter.getTargets()._mTargets,
				aAllPages = [];

			Object.keys(oTargets).forEach(function(sTargetKey) {
				var oTarget = oTargets[sTargetKey],
					oOptions = oTarget._oOptions,
					oRoute = oRouter.getRoute(oOptions.viewName),
					oConfig = oRoute && oRoute._oConfig;
				if (oConfig && (!oConfig.navigation || !oConfig.navigation.display)) {
					aAllPages.push({
						oConfig: oConfig
					});
				}
			});
			return aAllPages;
		}

		/* get configurations of all pages defined in the manifest in QUnit tests */
		testableHelper.testable(fnGetAllPages, "fnGetAllPages");

		/* create page(s) of an application for testing result of templating or view creation */
		function fnCreatePages(vPages /* optional array or single object of page configurations as created in fnGetAllPages */) {
			var aPages = vPages || fnGetAllPages();
			if (!Array.isArray(aPages)) {
				aPages = [aPages];
			}
			aPages.forEach(function(oPage) {
				oPage.oComponentContainer = fnCreateComponentInstance(oTemplateContract, oPage.oConfig, function(){} );
			});

			return aPages;
		}

		/* support templating all pages in QUnit tests */
		testableHelper.testable(fnCreatePages, "fnCreatePages");

		function getRootComponentPromise(){
			// Make sure that the loading of the root component starts
			var oViews = oNavigationControllerProxy.oRouter.getViews();
			oViews.getView({
				viewName: "root"
			});
			return oTemplateContract.mRouteToTemplateComponentPromise.root;
		}

		function getAppTitle(){
			return oNavigationControllerProxy.oAppComponent.getManifestEntry("sap.app").title;
		}

		function getCurrenActivationTakt(){
			return oCurrentHash.iHashChangeCount;
		}

		// Begin: Helper methods for creating the navigation menu

		function fnAddUrlParameterInfoForRoute(sRoute, oAppStates, sPath) {
			var fnExtendPars = function(oNewPars){
				for (var sKey in oNewPars){
					if (sKey !== "FCLLayout"){ // the FCLLayout-parameter will be set by the framework
						oAppStates[sKey] = oNewPars[sKey];
					}
				}
			};
			var getUrlParameterInfo, oComponentRegistryEntry;
			for (var sPar in oTemplateContract.componentRegistry){
				oComponentRegistryEntry = oTemplateContract.componentRegistry[sPar];
				if (oComponentRegistryEntry.route === sRoute){
					getUrlParameterInfo = oComponentRegistryEntry.methods.getUrlParameterInfo;
					break;
				}
			}
			return getUrlParameterInfo ? oComponentRegistryEntry.viewRegistered.then(function(){
				return getUrlParameterInfo(sPath).then(fnExtendPars);	
			}) : Promise.resolve();			
		}

		function fnGetParStringPromise(oAppStates, bAddLevel0Info){
			var oAppStatePromise = bAddLevel0Info ? fnAddUrlParameterInfoForRoute("root", oAppStates) : Promise.resolve();
			return oAppStatePromise.then(function(){
				var sDelimiter = "";
				var sRet = "";
				for (var sPar in oAppStates){
					var aValues = oAppStates[sPar];
					for (var i = 0; i < aValues.length; i++){
						var sValue = aValues[i];
						sRet = sRet + sDelimiter + sPar + "=" + sValue;
						sDelimiter = "&";
					}
				}
				return sRet;
			});
		}

		function getIntent(mHierarchySectionsFromCurrentHash, iViewLevel){
			var sCurrentIntent = location.hash.split("&")[0] + "&/";

			for (var k = 0; k < iViewLevel; k++){
				sCurrentIntent = sCurrentIntent + mHierarchySectionsFromCurrentHash[k];
				if (k < (iViewLevel - 1)){
					sCurrentIntent = sCurrentIntent + "/";
				}
			}
			return sCurrentIntent;
		}

		function setHierarchy(aHierarchy){
			for (var i = 0; i < aHierarchy.length; i++){
				if (aHierarchy[i].title !== aBreadCrumbTexts[aHierarchy.length - i - 1] || ""){ // only case tilte != subtitle should be considerd
					aHierarchy[i].subtitle = aBreadCrumbTexts[aHierarchy.length - i - 1] || "";
				}
			}
			aNavigationMenue = aHierarchy;
			oTemplateContract.oShellServicePromise.then(function(oShellService){
				oShellService.setHierarchy(aHierarchy);
			});
		}

		function fnSubTitleForViewLevelChanged(iViewLevel, sBreadCrumbText){
			aBreadCrumbTexts[iViewLevel] = sBreadCrumbText;

			var oNavigationMenueEntry = aNavigationMenue[aNavigationMenue.length - iViewLevel - 1];
			if (oNavigationMenueEntry){
				if (oNavigationMenueEntry.title !== sBreadCrumbText){ // only case tilte != subtitle should be considerd
					oNavigationMenueEntry.subtitle = sBreadCrumbText;
				}
				oTemplateContract.oShellServicePromise.then(function(oShellService) {
					oShellService.setHierarchy(aNavigationMenue);
				});
			}
		}

		function fnHandleNavigationMenuEntryToOwnView(aHierarchy, oCurrentEntity, mHierarchySectionsFromCurrentHash){
			var sTitle = oCurrentEntity.headerTitle;
			var sTitleIconUrl = oCurrentEntity.titleIconUrl;
			var sFullscreenLayout = oTemplateContract.oFlexibleColumnLayoutHandler.getFullscreenLayout(oCurrentEntity.level);
			var intent = getIntent(mHierarchySectionsFromCurrentHash, oCurrentEntity.level) + "?" + "FCLLayout=" + sFullscreenLayout;

			var oHierarchyEntry = {
				title: sTitle,
				icon: sTitleIconUrl,
				intent: intent
			};
			// for views which are shown in fullscreen there should NOT be an entry in navigation menu
			var bIsVisuallyFullscreen = oTemplateContract.oTemplatePrivateGlobalModel.getProperty("/generic/FCL/isVisuallyFullScreen");
			if (oCurrentEntity.level < 3 && !bIsVisuallyFullscreen){
				aHierarchy.push(oHierarchyEntry);
			}
		}

		var oCurrentTitleProvider;

		function fnHandleNavigationMenu(){
			var sTitle, oHierarchyEntry, sTitleIconUrl, oEntity;
			var mHierarchySectionsFromCurrentHash = oTemplateContract.oApplicationProxy.getHierarchySectionsFromCurrentHash();

			if (oCurrentTitleProvider && oCurrentTitleProvider instanceof TemplateComponent){
				var sEntitySet = oCurrentTitleProvider.getProperty("entitySet");
				oEntity = oNavigationControllerProxy.oTemplateContract.mEntityTree[sEntitySet];
			} else {
				return;
			}

			var aHierarchy = [];
			var oCurrentEntity, intent;
			if (oTemplateContract.oFlexibleColumnLayoutHandler){
				oCurrentEntity = oEntity;
			}
			if (mHierarchySectionsFromCurrentHash.length > 0) {
				// If we use FlexibleColumnLayout we need an entry to own view
				if (oTemplateContract.oFlexibleColumnLayoutHandler){
					fnHandleNavigationMenuEntryToOwnView(aHierarchy, oCurrentEntity, mHierarchySectionsFromCurrentHash);
				}
				for (var j = 0; j < mHierarchySectionsFromCurrentHash.length - 1; j++){
					if (oEntity.parent){
						var oParentEntity = oNavigationControllerProxy.oTemplateContract.mEntityTree[oEntity.parent];
						if (oTemplateContract.oFlexibleColumnLayoutHandler){
							intent = getIntent(mHierarchySectionsFromCurrentHash, oParentEntity.level) + "?" + "FCLLayout=" + oTemplateContract.oFlexibleColumnLayoutHandler.getFullscreenLayout(oParentEntity.level);
						} else {
							intent = getIntent(mHierarchySectionsFromCurrentHash, oParentEntity.level);
						}
						sTitle = oParentEntity.headerTitle;
						sTitleIconUrl = oParentEntity.titleIconUrl;
						oEntity = oParentEntity;
					} else {
						if (oTemplateContract.oFlexibleColumnLayoutHandler){
							intent = getIntent(mHierarchySectionsFromCurrentHash, oEntity.level) + "?" + "FCLLayout=" + oTemplateContract.oFlexibleColumnLayoutHandler.getFullscreenLayout(oEntity.level);
						} else {
							intent = getIntent(mHierarchySectionsFromCurrentHash, oEntity.level);
						}
						sTitle = oNavigationControllerProxy.oTemplateContract.mEntityTree[oEntity.entitySet].headerTitle;
						sTitleIconUrl = oNavigationControllerProxy.oTemplateContract.mEntityTree[oEntity.entitySet].titleIconUrl;
					}

					oHierarchyEntry = {
						title: sTitle,
						icon: sTitleIconUrl,
						intent: intent
					};
					aHierarchy.push(oHierarchyEntry);
				}

				// Entry for ListReport
				oHierarchyEntry = {
					title: getAppTitle()
				};
				var sLocationHash = location.hash;
				(sLocationHash.indexOf("?") !== -1 && sLocationHash.indexOf("?") < sLocationHash.indexOf("&")) ?
				oHierarchyEntry.intent = sLocationHash.split("?")[0] : oHierarchyEntry.intent = sLocationHash.split("&")[0];
				
				if (oTemplateContract.oFlexibleColumnLayoutHandler && oTemplateContract.oFlexibleColumnLayoutHandler.isListAndFirstEntryLoadedOnStartup()){
					oHierarchyEntry.intent = oHierarchyEntry.intent + "&/?" + "FCLLayout=" + oTemplateContract.oFlexibleColumnLayoutHandler.getFullscreenLayout(0);
				}

				fnGetParStringPromise({}, true).then(function(sPar){
					if (sPar){
						if (oTemplateContract.oFlexibleColumnLayoutHandler && oTemplateContract.oFlexibleColumnLayoutHandler.isListAndFirstEntryLoadedOnStartup()){	 //then "/?" is already there; see statement above
							oHierarchyEntry.intent = oHierarchyEntry.intent + "&" + sPar;
						} else {
							oHierarchyEntry.intent = oHierarchyEntry.intent + "&/?" + sPar;
						}
					}
					aHierarchy.push(oHierarchyEntry);
					setHierarchy(aHierarchy);
				});
			}
		}

		// End: Helper methods for creating the navigation menu

		function fnSetTitleForComponent(isAppTitlePrefered, oTitleProvider){
			var sTitle;
			if (!isAppTitlePrefered && oTitleProvider instanceof TemplateComponent){
				var oRegistryEntry = oTitleProvider && oTemplateContract.componentRegistry[oTitleProvider.getId()];
				var fnGetTitle = oRegistryEntry && oRegistryEntry.methods.getTitle;
				sTitle = fnGetTitle && fnGetTitle();
			} else if (!isAppTitlePrefered && oTitleProvider && oTitleProvider.title){
				sTitle = oTitleProvider.title;
			}
			sTitle = sTitle || getAppTitle();
			oCurrentTitleProvider = oTitleProvider;

			oTemplateContract.oShellServicePromise.then(function (oShellService) {
				oShellService.setTitle(sTitle);
				fnHandleNavigationMenu();
			});
		}

		// This method is called when all views have been set to their places
		function fnAfterActivationImpl(oTitleProvider){
			var aPageDataLoadedPromises = [oTemplateContract.oPagesDataLoadedObserver.getProcessFinished(true)];
			var oActiveComponent = null;
			var iCurrentHashCount = oCurrentHash.iHashChangeCount;
			var maxActiveViewLevel = -1;
			for (var sComponentId in oTemplateContract.componentRegistry){
				var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
				var oMessageButtonHelper = oRegistryEntry.oControllerUtils && oRegistryEntry.oControllerUtils.oServices.oTemplateCapabilities.oMessageButtonHelper;
				var bIsActive = oRegistryEntry.activationTakt === iCurrentHashCount;
				var oTemplatePrivateModel = oRegistryEntry.utils.getTemplatePrivateModel();
				oTemplatePrivateModel.setProperty("/generic/isActive", bIsActive);
				if (bIsActive){
					aPageDataLoadedPromises.push(oRegistryEntry.oViewRenderedPromise);
					if (oRegistryEntry.viewLevel > maxActiveViewLevel){
						maxActiveViewLevel = oRegistryEntry.viewLevel;
						oActiveComponent = oRegistryEntry.oComponent;
					}
				} else {
					oRegistryEntry.utils.suspendBinding();
				}
				if (oMessageButtonHelper){
					oMessageButtonHelper.setEnabled(bIsActive);
				}
			}

			var isAppTitlePrefered = oTemplateContract.oFlexibleColumnLayoutHandler && oTemplateContract.oFlexibleColumnLayoutHandler.isAppTitlePrefered();
			fnSetTitleForComponent(isAppTitlePrefered, oTitleProvider || oActiveComponent);

			Promise.all(aPageDataLoadedPromises).then(function(){
				if (iCurrentHashCount === oCurrentHash.iHashChangeCount && jQuery.isEmptyObject(mMessagePageParams)){
					oTemplateContract.oAppComponent.firePageDataLoaded();
				}
			});
		}

		// Default call
		var fnAfterActivation = fnAfterActivationImpl.bind(null, null); // do not pass a TitleProvider/forward to fnAfterActivationImpl

		// Start: navigation methods

		function fnNavigateBack(){
			jQuery.sap.log.info("Navigate back");
			if (oCurrentHash.backTarget && fnNormalizeHash(oHistory.getPreviousHash() || "") !== fnNormalizeHash(oCurrentHash.hash)){
				oTemplateContract.oBusyHelper.setBusyReason("HashChange", true);
			}
			// If oCurrentHash contains a forwardingInfo this back navigation is part of a complex back navigation.
			// In this case oCurrentHash already represents the target hash (which was created when the complex navigation started).
			// Otherwise oCurrentHash still represents the source hash. In this case we notify that the hash was left via back navigation.
			oCurrentHash.LeaveByBack = !oCurrentHash.forwardingInfo;
			window.history.back();
		}

		/*
		 * Sets/Replaces the hash via the router/hash changer
		 * @param {string} sHash - the hash string
		 * @param {boolean} bReplace - whether the hash should be replaced
		 * @param {boolean} bKeepVariantId - keep variant id in URL (save/edit/cancel case)
		 */
		function fnNavigate(sHash, bReplace, iTargetLevel, bKeepVariantId) {
			var oConfig = oTemplateContract.oAppComponent.getConfig();
			var bObjectPageDynamicHeaderTitleWithVM = oConfig && oConfig.settings && oConfig.settings.objectPageDynamicHeaderTitleWithVM;
			var bVendorLayer;
			var oUriParameters = jQuery.sap.getUriParameters();
			if (oUriParameters.mParams["sap-ui-layer"]) {
				var aUiLayer = oUriParameters.mParams["sap-ui-layer"];
				for (var i = 0; i < aUiLayer.length; i++) {
					if (aUiLayer[i].toUpperCase() === "VENDOR") {
						bVendorLayer = true;
						break;
					}
				}
			}
			sHash = fnNormalizeHash(sHash || "");
			jQuery.sap.log.info("Navigate to hash: " + sHash);
			if (sHash === oCurrentHash.hash){
				jQuery.sap.log.info("Navigation suppressed since hash is the current hash");
				return; // ignore navigation that does nothing
			}
			oCurrentHash.targetHash = sHash;
			if (oCurrentHash.backTarget && fnNormalizeHash(oHistory.getPreviousHash() || "") === sHash){
				fnNavigateBack();
				return;
			}
			if (oCurrentHash.oEvent) {
				var iCurrentLevel = oCurrentHash.oEvent.getParameter("config").viewLevel;
			}
			if (bObjectPageDynamicHeaderTitleWithVM && bVendorLayer) {
				if (!bKeepVariantId) {
					if (!oTemplateContract.oFlexibleColumnLayoutHandler) {
						ControlPersonalizationAPI.clearVariantParameterInURL();
					} else {
						if (iCurrentLevel >= iTargetLevel) {
							if (iTargetLevel === 1) {
								ControlPersonalizationAPI.clearVariantParameterInURL();
							} else if (iTargetLevel === 2) {
								var oRegistryEntry;
								for ( var sComponentId in oTemplateContract.componentRegistry) {
									if (oTemplateContract.componentRegistry[sComponentId].viewLevel === 2) {
										oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
										break;
									}
								}
								var oSubObjectPageVariantManagementControl = oRegistryEntry.oController.byId("template::ObjectPage::ObjectPageVariant");
								ControlPersonalizationAPI.clearVariantParameterInURL(oSubObjectPageVariantManagementControl);
							}
						}
					}
				}
			}
			oTemplateContract.oBusyHelper.setBusyReason("HashChange", true);
			oCurrentHash.LeaveByReplace = bReplace;
			if (bReplace) {
				oNavigationControllerProxy.oHashChanger.replaceHash(sHash);
			} else {
				oNavigationControllerProxy.oHashChanger.setHash(sHash);
			}
		}

		function fnNavigateToParStringPromise(sPath, oParStringPromise, iTargetLevel, bReplace, oBackwardingInfo, bKeepVariantId){
			var oRet = oParStringPromise.then(function(sPars){
				if (sPars){
					sPath = sPath + "?" + sPars;
				}
				if (oBackwardingInfo){
					oCurrentHash.backwardingInfo = {
						backCount: oBackwardingInfo.backCount,
						targetViewLevel: oBackwardingInfo.targetViewLevel,
						targetHash: fnNormalizeHash(sPath)
					};
					fnNavigateBack();
				} else {
					fnNavigate(sPath, bReplace, iTargetLevel, bKeepVariantId);
				}
				return sPath;
			});
			oTemplateContract.oBusyHelper.setBusy(oRet);
			return oRet;
		}

		// Returns the number of steps back that need to be performed to come to viewLevel = 0 (the root).
		// If the root is not in the history -1 is returned.
		// If bOnlyDirect only a direct back is considered (so return value is either 1, 0, or -1)
		function getBackLengthToRoot(bOnlyDirect){
			var iRet = 0;
			for (var oHash = oCurrentHash; oHash.oEvent; ){
				var iViewLevel = oHash.oEvent.getParameter("config").viewLevel;
				if (iViewLevel === 0){
					return iRet;
				}
				if ((bOnlyDirect && iRet > 0) || oHash.backTarget === 0){ // return -1 when the limit is reached or back leaves the app
					return -1;
				}
				iRet++;
				oHash = aPreviousHashes[oHash.backTarget];
			}
			return -1;
		}

		function fnGetBackwardingInfoForTarget(bReplace, sPath, iTargetLevel){
			if (iTargetLevel === 0){
				var iBackLengthToRoot = getBackLengthToRoot(!bReplace);
				return (iBackLengthToRoot > 0) && {
					backCount: iBackLengthToRoot,
					targetViewLevel: 0
				};				
			}
			var oPreviousHash = aPreviousHashes[oCurrentHash.backTarget];
			return oPreviousHash && oPreviousHash.hash && fnNormalizeHash(oPreviousHash.hash.split("?")[0]) === fnNormalizeHash(sPath) && { backCount: 1 };
		}
		
		// Navigates to the root page. Thereby it restores the iappstate the root page was left (if we have already been there)
		function fnNavigateToRoot(bReplace) {
			if (oTemplateContract.oFlexibleColumnLayoutHandler) { // If we are in FCL mode we will always navigate to root route (ListReport)
				oTemplateContract.oFlexibleColumnLayoutHandler.setStoredTargetLayoutToOneColumn();
			}
			fnNavigateToPath("root", "", 0, bReplace);
		}

		function getTargetComponentPromises(oTarget){
			var sRouteName = oTemplateContract.mEntityTree[oTarget.entitySet].sRouteName;
			var oComponentPromise = oTemplateContract.mRouteToTemplateComponentPromise[sRouteName];
			return [oComponentPromise];
		}

		function fnPresetDisplayMode(aTargetComponentPromises, iDisplayMode){
			var iCurrentTakt = oCurrentHash.iHashChangeCount;
			var fnPreset = function(oComponent){
				var oRegistryEntry = oTemplateContract.componentRegistry[oComponent.getId()];
				(oRegistryEntry.methods.presetDisplayMode || jQuery.noop)(iDisplayMode, iCurrentTakt === oRegistryEntry.activationTakt);
			};
			for (var i = 0; i < aTargetComponentPromises.length; i++){
				var oTargetPromise = aTargetComponentPromises[i];
				oTargetPromise.then(fnPreset);
			}
		}

		function getTargetLevel(oTarget) {
			var oTargetTreeNode = oTarget && oTemplateContract.mEntityTree[oTarget.entitySet];
			var iTargetLevel = oTargetTreeNode ? oTargetTreeNode.level : 1;
			return iTargetLevel;
		}


		function fnAddSuffixToCurrentHash(sSuffix, iViewLevel){
			var aParts = oTemplateContract.oApplicationProxy.getHierarchySectionsFromCurrentHash();
			var sRet = sSuffix;
			for (var i = iViewLevel - 2; i >= 0; i--){
				sRet = aParts[i] + "/" + sRet;
			}
			return "/" + sRet;
		}

		function fnNavigateToPath(sRoute, sPath, iTargetLevel, bReplace, bKeepVariantId){
			var oAppStates = {};
			var oNavigationPromise = new Promise(function(fnResolve){
				fnAddUrlParameterInfoForRoute(sRoute, oAppStates, sPath).then(function(){
					var oParStringPromise = oTemplateContract.oFlexibleColumnLayoutHandler ?
						oTemplateContract.oFlexibleColumnLayoutHandler.getAppStateParStringForNavigation(sRoute, iTargetLevel, oAppStates) :
						fnGetParStringPromise(oAppStates, false);
					var oBackwardingInfo = fnGetBackwardingInfoForTarget(bReplace, sPath, iTargetLevel);
					fnNavigateToParStringPromise(sPath, oParStringPromise, iTargetLevel, bReplace, oBackwardingInfo, bKeepVariantId).then(fnResolve);
				});
			});
			oTemplateContract.oBusyHelper.setBusy(oNavigationPromise);
			return oNavigationPromise;
		}

		function fnNavigateToSuffix(sSuffix, iViewLevel, sRoute, bReplace){
			var sPath = fnAddSuffixToCurrentHash(sSuffix, iViewLevel);
			fnNavigateToPath(sRoute, sPath, iViewLevel, bReplace);
		}

		// vTargetContext is either a string or an object. Only in the second case sNavigationProperty may be used.
		function fnNavigateToContextImpl(vTargetContext, sNavigationProperty, bReplace, iDisplayMode, oQuery, bKeepVariantId) {
			var sPath;
			var iTargetLevel, sRoute;
			var aTargetComponentPromises = [];
			if (typeof vTargetContext === "string"){
				sPath = vTargetContext;
				var aParts = fnNormalizeHash(sPath).split("/");
				iTargetLevel = aParts.length - 1;
				switch (iTargetLevel){
					case 0: sRoute = "root";
						break;
					case 1: sRoute = aParts[1].split("(")[0];
						break;
					default:
						sRoute = "";
						var sSlash = "";
						for (var i = 0; i < iTargetLevel; i++){
							var sPart = aParts[i + 1];
							var iIndex = sPart.indexOf("(");
							if (iIndex > 0){
								sPart = sPart.substring(0, iIndex);
							}
							sRoute = sRoute + sSlash + sPart;
							sSlash = "/";
						}
						sRoute = sRoute.replace("---", "/"); // for embedded components
				}
			} else {
			// get the navigation path from binding context
				var oTarget = routingHelper.determineNavigationPath(vTargetContext, sNavigationProperty);
				iTargetLevel = getTargetLevel(oTarget);
				sPath = oTarget.path;
				aTargetComponentPromises = getTargetComponentPromises(oTarget);
				sRoute = oTemplateContract.mEntityTree[oTarget.entitySet].sRouteName;
			}
			if (sPath) {
				if (sNavigationProperty) {
					sPath = fnAddSuffixToCurrentHash(sPath, iTargetLevel);
				}
				fnPresetDisplayMode(aTargetComponentPromises, iDisplayMode || 0);
				// navigate to context
				if (oQuery){
					var sQuery = "";
					var sDelim = "&";
					for (var sPar in oQuery){
						sQuery = sQuery + sDelim + sPar + "=" + oQuery[sPar];
					}
					if (sQuery){
						sPath = sPath + "?" + sQuery;
					}
					fnNavigate(sPath, bReplace, iTargetLevel ,bKeepVariantId);
					return Promise.resolve(sPath);
				} else {
					return fnNavigateToPath(sRoute, sPath, iTargetLevel, bReplace, bKeepVariantId);
				}
			}
		}

		function fnNavigateToContext(vTargetContext, sNavigationProperty, bReplace, iDisplayMode, bKeepVariantId) {
			return fnNavigateToContextImpl(vTargetContext, sNavigationProperty, bReplace, iDisplayMode, undefined, bKeepVariantId);
		}
		
		function getRouteNameWithoutQuery() {
			var sRouteName = oCurrentHash.oEvent ? oCurrentHash.oEvent.getParameter("name") : "root";
			var checkForQuery = sRouteName.substring(sRouteName.length - 5, sRouteName.length);
			if (checkForQuery === "query") {
				return sRouteName.substring(0, sRouteName.length - 5);
			}
			return sRouteName;
		}
		
		function isInQueryRoute(){
			var sRouteName = oCurrentHash.oEvent ? oCurrentHash.oEvent.getParameter("name") : "";
			return sRouteName.length > 5 && sRouteName.lastIndexOf("query") === sRouteName.length - "query".length;
		}
		
		function fnNavigateByExchangingQueryParam(sQueryParam, sValue, bReplace){
			var oArguments = jQuery.extend(Object.create(null), oCurrentHash.oEvent.getParameter("arguments"));
			var sRouteName = oCurrentHash.oEvent ? oCurrentHash.oEvent.getParameter("name") : "root";
			if (isInQueryRoute()){
				oArguments.query = oArguments["?query"];
				if (sValue){
					oArguments.query[sQueryParam] = sValue;
				} else {
					delete oArguments.query[sQueryParam];
					if (jQuery.isEmptyObject(oArguments.query)){
						delete oArguments.query;
						sRouteName = getRouteNameWithoutQuery();
					}
				}
			} else if (sValue){
				sRouteName = sRouteName + "query";
				oArguments.query = Object.create(null);
				oArguments.query[sQueryParam] = sValue;
			}
			var sHash = oNavigationControllerProxy.oRouter.getURL(sRouteName, oArguments);
			// router put unwanted / to the end of the route
			sHash = sHash.replace("/?", "?");
			fnNavigate(sHash, bReplace);			
		}

		function fnPerformPseudoHashChange(aStaysVisible){
			var iLastHashCount = oCurrentHash.iHashChangeCount;
			oCurrentHash.iHashChangeCount++;
			aPreviousHashes.push(null);
			if (aStaysVisible){
				for (var sPar in oTemplateContract.componentRegistry){
					var oRegistryEntry = oTemplateContract.componentRegistry[sPar];
					if (oRegistryEntry.activationTakt === iLastHashCount && aStaysVisible[oRegistryEntry.viewLevel]){
						oRegistryEntry.activationTakt = oCurrentHash.iHashChangeCount;
					}
				}
			}
			return {
				iHashChangeCount: oCurrentHash.iHashChangeCount
			};
		}

		function fnTransferMessageParametersToGlobalModelAndDisplayMessage(mParameters) {
			var sEntitySet, sText, oEntitySet, oEntityType, oHeaderInfo, sIcon = null,
				oMetaModel, sDescription;
			if (mParameters) {
				sEntitySet = mParameters.entitySet;
				sText = mParameters.text;
				sIcon = mParameters.icon;
				sDescription = mParameters.description;
			}

			if (sEntitySet) {
				oMetaModel = oTemplateContract.oAppComponent.getModel().getMetaModel();
				if (oMetaModel) {
					oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
					oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
					oHeaderInfo = oEntityType["com.sap.vocabularies.UI.v1.HeaderInfo"];
				}
				if (oHeaderInfo && oHeaderInfo.TypeImageUrl && oHeaderInfo.TypeImageUrl.String) {
					sIcon = oHeaderInfo.TypeImageUrl.String;
				}
			}

			oTemplateContract.oShellServicePromise.then(function(oShellService) {
				if (oShellService.setBackNavigation) {
					oShellService.setBackNavigation(undefined);
				}
			});
			oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/messagePage", {
				text: sText,
				icon: sIcon,
				description: sDescription
			});

			var aLevelsBecomingInvisible;
			if (oNavigationControllerProxy.oTemplateContract.oFlexibleColumnLayoutHandler){
				aLevelsBecomingInvisible = oNavigationControllerProxy.oTemplateContract.oFlexibleColumnLayoutHandler.displayMessagePage(mParameters);
			} else {
				var oTargets = oNavigationControllerProxy.oRouter.getTargets();
				oTargets.display("messagePage");
			}
			fnPerformPseudoHashChange(aLevelsBecomingInvisible);
			fnAfterActivationImpl(mParameters);
		}

		function fnShowStoredMessage(){
			if (!jQuery.isEmptyObject(mMessagePageParams)){
				var mParameters = null;
				for (var i = 0; !mParameters; i++){
					mParameters = mMessagePageParams[i];
				}
				mMessagePageParams = {};
				fnTransferMessageParametersToGlobalModelAndDisplayMessage(mParameters);
			}
		}

		function fnNavigateToMessagePage(mParameters) {
			if (oNavigationControllerProxy.oTemplateContract.oFlexibleColumnLayoutHandler){
				mParameters.viewLevel = mParameters.viewLevel || 0;
				mMessagePageParams[mParameters.viewLevel] = mParameters;
				var oLoadedFinishedPromise = Promise.all([oActivationPromise, oNavigationControllerProxy.oTemplateContract.oPagesDataLoadedObserver.getProcessFinished(true)]);
				oLoadedFinishedPromise.then(fnShowStoredMessage);
				oLoadedFinishedPromise.then(oTemplateContract.oBusyHelper.setBusyReason.bind(null, "HashChange", false));
				return;
			}
			fnTransferMessageParametersToGlobalModelAndDisplayMessage(mParameters);
			oTemplateContract.oBusyHelper.setBusyReason("HashChange", false);
		}

		// End: Navigation methods

		function getActiveComponents(){
			var aRet = [];
			var iCurrentHashCount = oCurrentHash.iHashChangeCount;
			for (var sComponentId in oTemplateContract.componentRegistry){
				var oRegistryEntry = oTemplateContract.componentRegistry[sComponentId];
				if (oRegistryEntry.activationTakt === iCurrentHashCount){ // component is currently active
					aRet.push(sComponentId);
				}
			}
			return aRet;
		}

		function getAllComponents() {
			var aRet = [];
			for (var sComponentId in oTemplateContract.componentRegistry){
				aRet.push(sComponentId);
			}
			return aRet;
		}

		function getCurrentKeys(iViewLevel){
			return aCurrentKeys.slice(0, iViewLevel + 1);
		}
		
		function getCurrentHash(iToLevel){
			var sRet = "";
			var sHash = oCurrentHash.hash;
			var aParts = sHash.split("/");
			var sDelim = "";
			for (var i = 0; i <= iToLevel; i++){
				sRet = sRet + sDelim + aParts[i];
				sDelim = "/";
			}
			return sRet;
		}
		
		// For routing event oEvent this function provides information about routes on upper levels.
		// iLevel should be the absolute level the information is requested for.
		function getAncestralRoute(oEvent, iLevel){
			if (iLevel === 0){
				return {
					name: "root",
					pattern: ""
				};
			}
			var oConfig =  oEvent.getParameter("config");
			var iViewLevel = oConfig.viewLevel;
			if (iViewLevel < iLevel){
				return null;
			}
			var mEntityTree = oTemplateContract.mEntityTree;
			var sEntitySet = oConfig.entitySet;
			var oTreeNode;
			for (var j = iViewLevel; j >= iLevel; j--){
				oTreeNode = mEntityTree[sEntitySet];
				sEntitySet = oTreeNode.parent;
			}
			return {
				name: oTreeNode.sRouteName,
				pattern: oTreeNode.pattern
			};
		}

		// Start: Handling url-changes

		/*
		 * calls onActivate on the specified view, if it exists
		 * @param {Object} oView - the view
		 * @param {string} sPath - the path in the model
		 * @param {boolean} bDelayedActivate - optional boolean flag, true if activate is (re-)triggered delayed
		 */
		function fnActivateOneComponent(sPath, oActivationInfo, oComponent) {
			var oRegistryEntry = oTemplateContract.componentRegistry[oComponent.getId()] || {};
			var bIsComponentCurrentlyActive = (oRegistryEntry.activationTakt === oActivationInfo.iHashChangeCount - 1);
			oRegistryEntry.activationTakt = oActivationInfo.iHashChangeCount;
			// trigger onActivate on the component instance
			// if Component is assembled without TemplateAssembler it could be that oComponent.onActivate is undefined
			// e.g. an application has an own implementation of Component
			// however, we do not consider this as a relevant case anymore - just keeping the comment in case any app breaks here
			var oRet = oComponent.onActivate(sPath, bIsComponentCurrentlyActive) || Promise.resolve();
			return Promise.all([oRet, oRegistryEntry.viewRegistered]);
		}

		/*
		 * calls onActivate on the specified view, if it exists. Only used in the Non-FCL case
		 * @param {Object} oView - the view
		 * @param {string} sPath - the path in the model
		 * @param {boolean} bDelayedActivate - optional boolean flag, true if activate is (re-)triggered delayed
		 */
		function fnActivateComponent(sPath, oActivationInfo, oComponent) {
			return fnActivateOneComponent(sPath, oActivationInfo, oComponent).then(fnAfterActivation);
		}

		function fnAdaptPaginatorInfoAfterNavigation(oEvent, bIsProgrammatic, bIsBack){
			var oNewPaginatorInfo = {};
			if (bIsProgrammatic || bIsBack){
				var iViewLevel = oEvent.getParameter("config").viewLevel;
				for (var iLevel = 0; iLevel < iViewLevel; iLevel++){
					oNewPaginatorInfo[iLevel] = oTemplateContract.oPaginatorInfo[iLevel];
				}
			}
			oTemplateContract.oPaginatorInfo = oNewPaginatorInfo;
		}

		function fnGetAlternativeContextPromise(sPath){
			return oTemplateContract.oApplicationProxy.getAlternativeContextPromise(sPath);
		}

		function fnHandleBeforeRouteMatched(oEvent){
			if (oTemplateContract.oFlexibleColumnLayoutHandler){
				oTemplateContract.oFlexibleColumnLayoutHandler.handleBeforeRouteMatched(oEvent);
			}
		}

		function fnExtractKeys(oKeys, iViewLevel){
			aCurrentKeys = [""];
			for (var iLevel = 1; iLevel <= iViewLevel; iLevel++){
				var sKey = "keys" + iLevel;
				aCurrentKeys.push(oKeys[sKey]);
			}
		}

		// This handler is registered at the route matched event of the router. It is thus called whenever the url changes within the App (if the new url is legal)
		function fnHandleRouteMatchedImpl(oEvent) {
			oTemplateContract.oBusyHelper.setBusyReason("HashChange", false);
			var iViewLevel = oEvent.getParameter("config").viewLevel;
			var sHash = fnNormalizeHash(oNavigationControllerProxy.oHashChanger.getHash() || "");
			jQuery.sap.log.info("Route matched with hash " + sHash);
			var oPreviousHash; // will be oCurrentHash soon
			if (oCurrentHash.backwardingInfo){   // then this is the first step of a 'complex back navigation'
				// Store oCurrentHash in aPreviousHashes and create a new instance of oCurrentHash for the newly started logical navigation step
				oPreviousHash = oCurrentHash;
				aPreviousHashes.push(oPreviousHash);
				var iNewHashChangeCount = oPreviousHash.iHashChangeCount + 1;
				oCurrentHash = {
					iHashChangeCount: iNewHashChangeCount,
					forwardingInfo: {
						bIsProgrammatic: true,
						bIsBack: true,
						iHashChangeCount: iNewHashChangeCount,
						backCount: oPreviousHash.backwardingInfo.backCount,
						targetHash: oPreviousHash.backwardingInfo.targetHash,
						targetViewLevel: oPreviousHash.backwardingInfo.targetViewLevel
					},
					backTarget: oPreviousHash.backTarget // temporary. Will be adapted below
				};
			}
			if (oCurrentHash.forwardingInfo){ // This can be either, because we are processing a complex back navigation or we are processing a follow-up navigation to an alternative context
				if (oCurrentHash.forwardingInfo.backCount){ // if we are in the complex back navigation scenario -> we have come here via back and need to update our book-keeping
					oCurrentHash.backTarget = aPreviousHashes[oCurrentHash.backTarget].backTarget; // oCurrentHash.backTarget is, what we have come to. So our new backTarget is the backTarget of that entry.
					oCurrentHash.forwardingInfo.backCount--; // we need to get back one step less
					if (oCurrentHash.forwardingInfo.backCount && iViewLevel !== oCurrentHash.forwardingInfo.targetViewLevel){ // if we still need to get back?
						oCurrentHash.hash = sHash;
						fnNavigateBack(); // so navigate back.
						return; // fnHandleRouteMatched will be called with the new url, so leave further processing to that call
					}
					delete oCurrentHash.forwardingInfo.backCount; // no more back navigation -> remove the property
				}
				if (oCurrentHash.forwardingInfo.targetHash && oCurrentHash.forwardingInfo.targetHash !== sHash){
					// if the targetHash is not reached yet, we need to perform another navigation
					oCurrentHash.hash = sHash;
					var sTargetHash = oCurrentHash.forwardingInfo.targetHash;
					delete oCurrentHash.forwardingInfo.targetHash; // the targetHash will be reached with next physical navigation step -> remove the property
					fnNavigate(sTargetHash, true);
					return; // fnHandleRouteMatched will be called with the new url, so leave further processing to that call
				}
			}
			var oRouteConfig = oEvent.getParameter("config");
			var sPath = routingHelper.determinePath(oRouteConfig, oEvent);
			// State changers may identify the hash change as something which can be handled by them internally. In this case we do not need to run the whole mechanism.
			// Since isStateChange is allowed to have side-effects we call all StateChangers (currently only one exists).
			var bIsStateChange = false;
			for (var i = 0; i < oTemplateContract.aStateChangers.length; i++){
				var oStateChanger = oTemplateContract.aStateChangers[i];
				if (oStateChanger.isStateChange(oEvent)){
					bIsStateChange = true;
				}
			}

			if (bIsStateChange){
				oCurrentHash.hash = sHash;
				// If state was changed rebuild the navigation menu because AppState is needed in the URL
				fnHandleNavigationMenu();
				if (oTemplateContract.oFlexibleColumnLayoutHandler){
					oTemplateContract.oFlexibleColumnLayoutHandler.handleRouteMatched(oEvent, oRouteConfig, sPath);
				}
				return;
			}
			// When we come here, oCurrentHash does not contain any information about need to forward anymore, and the url-change was not triggered by a state changer.
			// At this point in time oCurrentHash may still represent the previous logical navigation step or already represent the current logical navigation step.
			// These two scenarios can be distinguished via property forwardingInfo of oCurrentHash. If this property is truthy the first option applies.
			oTemplateContract.oTemplatePrivateGlobalModel.setProperty("/generic/routeLevel", iViewLevel);
			// oActivationInfo is an object that will be passed to helper functions that deal with follow-up activities.
			// It contains the following properties:
			// - iHashChangeCount the current hashChangeCount
			// - bIsProgrammatic  information whether the logical navigation was triggered programmatically
			// - bIsBack          information whether the logical navigation step was reached by backward navigation
			var oActivationInfo = oCurrentHash.forwardingInfo; // If there is a forwardingInfo it already provides the required properties
			delete oCurrentHash.forwardingInfo;
			if (!oActivationInfo){ // then we have to create oActivationInfo AND a new instance for oCurrentHash
				oActivationInfo = {};
				var iPreviousHashChangeCount = oCurrentHash.iHashChangeCount;
				oActivationInfo.iHashChangeCount = iPreviousHashChangeCount + 1;
				oActivationInfo.bIsProgrammatic = (sHash === oCurrentHash.targetHash);
				var sDirection = oHistory.getDirection();
				oActivationInfo.bIsBack = !!(oCurrentHash.LeaveByBack || (!oActivationInfo.bIsProgrammatic && (sDirection === HistoryDirection.Backwards)));
				oActivationInfo.bIsForward = !oActivationInfo.bIsBack && (sDirection === HistoryDirection.Forwards);
				oCurrentHash.LeaveByBack = oActivationInfo.bIsBack;
				oCurrentHash.LeaveByReplace = oActivationInfo.bIsProgrammatic && oCurrentHash.LeaveByReplace;
				oPreviousHash = oCurrentHash;
				aPreviousHashes.push(oPreviousHash);
				oCurrentHash = {
					iHashChangeCount: oActivationInfo.iHashChangeCount
				};
				// identify the back target
				if (oPreviousHash.LeaveByReplace){
					oCurrentHash.backTarget = oPreviousHash.backTarget; // url is replaced  -> back target remains unchanged
				} else if (oActivationInfo.bIsBack){
					oCurrentHash.backTarget = aPreviousHashes[oPreviousHash.backTarget].backTarget; // -> new back target is the back target of the previous back target
				} else {
					oCurrentHash.backTarget = iPreviousHashChangeCount;	// last url is back target
				}
			}
			oCurrentHash.oEvent = oEvent;
			oCurrentHash.hash = sHash;

			// The link we are navigating to might have been made obsolete during the runtime of the App. This would happen in the following cases:
			// - Link points to a draft, but the draft has been activated or cancelled meanwhile.
			// - Link points to an active entity. Meanwhile, a draft for this active entity has been created within this session.
			// - Link points to an object which has been deleted meanwhile.
			// Whereas we cannot do anything in the third case (thus, a message page will be displayed then), in the first two cases we want to
			// automatically forward the user to the correct instance.
			// In order to achieve this, we use method fnGetAlternativeContextPromise which may provide an alternative context to navigate to.
			// However, there are two limitations for that:
			// - In general the functionality only covers activation/cancellation/draft-creation actions which have been performed within this session.
			//   These actions have been registered within class ContextBookkeeping.
			// - For hashes pointing to item level (viewLevel > 1) it is currently not possible to determine the alternative path. Therefore, the determination
			//   whether an alternative context is required is done on root object level. Thus, the root object is navigated to, if one of the cases above is
			//   discovered.

			// sTestPath is the path for which we check, whether one of the cases described above, occurs. As discussed above, for viewLevel > 1 we
			// cannot use sPath (which points to the item), but must use the corresponding path pointing to the root.
			var sTestPath = iViewLevel < 2 ? sPath : routingHelper.determinePath(oRouteConfig, oEvent, getAncestralRoute(oEvent, 1).pattern);
			oTemplateContract.oBusyHelper.setBusy(fnGetAlternativeContextPromise(sTestPath).then(function(oAlternativeContextInfo){
				var oKeys = oEvent.getParameter("arguments");
				if (oAlternativeContextInfo){ // then one of the cases described above occurs
					var oQuery = oKeys["?query"]; // We want to navigate to another context, but the query parameters should stay the same
					oCurrentHash.forwardingInfo = oActivationInfo; // Note: This is the second scenario for forwardingInfo as described in the comment for oCurrentHash (see above)
					fnNavigateToContextImpl(oAlternativeContextInfo.context, null, true, oAlternativeContextInfo.iDisplayMode, oQuery || {}); // Navigate to the other context
					return; // note that fnHandleRouteMatched will be called again
				}
				// When we reach this point, the logical navigation step has reached its final url.
				// Now we have to adapt the state of the application
				fnExtractKeys(oKeys, iViewLevel);
				setHierarchy([]);
				fnAdaptPaginatorInfoAfterNavigation(oEvent, oActivationInfo.bIsProgrammatic, oActivationInfo.bIsBack);

				if (oTemplateContract.oFlexibleColumnLayoutHandler){
					oActivationPromise = oTemplateContract.oFlexibleColumnLayoutHandler.handleRouteMatched(oEvent, oRouteConfig, sPath, oActivationInfo);
				} else {

					if (oRouteConfig.viewLevel === 0 || !(oActivationInfo.bIsProgrammatic || oActivationInfo.bIsBack)){
						oTemplateContract.oApplicationProxy.setEditableNDC(false);
					}

					var sRoute = oRouteConfig.target;   // Note: Route and targetnames are identical
					var oComponentPromise = oTemplateContract.mRouteToTemplateComponentPromise[sRoute];
					oActivationPromise = new Promise(function(fnResolve, fnReject){
						oComponentPromise.then(function(oComponent){
							fnActivateComponent(sPath, oActivationInfo, oComponent).then(fnResolve, fnReject);
						});
					});
				}
				oTemplateContract.oBusyHelper.setBusy(oActivationPromise);
			}));
		}

		// This handler is registered at the route matched event of the router. It is thus called whenever the url changes within the App (if the new url is legal)
		function fnHandleRouteMatched(oEvent) {
			oEvent = jQuery.extend({}, oEvent); // as this handler works asynchronously and events are pooled by UI5, we create a defensive copy
			oTemplateContract.oStatePreserversAvailablePromise.then(fnHandleRouteMatchedImpl.bind(null, oEvent), oTemplateContract.oBusyHelper.setBusyReason.bind(null, "HashChange", false));
		}
		
		// Event handler fired by router when no matching route is found
		function fnHandleBypassed() {
			fnNavigateToMessagePage({
				title: oTemplateContract.getText("ST_ERROR"),
				text:  oTemplateContract.getText("ST_GENERIC_UNKNOWN_NAVIGATION_TARGET"),
				description: ""
			});
		}

		if (oTemplateContract.sRoutingType === "f"){
			oNavigationControllerProxy.oRouter.attachBeforeRouteMatched(fnHandleBeforeRouteMatched);
		}
		oNavigationControllerProxy.oRouter.attachRouteMatched(fnHandleRouteMatched);

		oNavigationControllerProxy.oRouter.attachBypassed(fnHandleBypassed);
		// End: Handling url-changes

		// Expose methods via NavigationController proxy
		oNavigationControllerProxy.navigate = fnNavigate;
		oNavigationControllerProxy.navigateToParStringPromise = fnNavigateToParStringPromise;
		oNavigationControllerProxy.getAncestralRoute = getAncestralRoute;
		oNavigationControllerProxy.activateOneComponent = fnActivateOneComponent;
		oNavigationControllerProxy.afterActivation = fnAfterActivation;
		oNavigationControllerProxy.addUrlParameterInfoForRoute = fnAddUrlParameterInfoForRoute;
		oNavigationControllerProxy.getParStringPromise = fnGetParStringPromise;
		oNavigationControllerProxy.performPseudoHashChange = fnPerformPseudoHashChange;
		oNavigationControllerProxy.getActiveComponents = getActiveComponents;
		oNavigationControllerProxy.getAllComponents = getAllComponents;
		oNavigationControllerProxy.getRootComponentPromise = getRootComponentPromise;
		oNavigationControllerProxy.getCurrenActivationTakt = getCurrenActivationTakt;
		oNavigationControllerProxy.getCurrentKeys = getCurrentKeys;
		oNavigationControllerProxy.getCurrentHash = getCurrentHash;
		oNavigationControllerProxy.getTargetLevel = getTargetLevel;
		oNavigationControllerProxy.getAppTitle = getAppTitle;
		oNavigationControllerProxy.subTitleForViewLevelChanged = fnSubTitleForViewLevelChanged;
		oNavigationControllerProxy.navigateToSuffix = fnNavigateToSuffix;
		oNavigationControllerProxy.navigateByExchangingQueryParam = fnNavigateByExchangingQueryParam;

		// to allow AppComponent to trigger retemplating - for designtime tools only 
		oNavigationControllerProxy.createComponentInstance = fnCreateComponentInstance;

		return {
			/**
			* Navigates to the root view.
			*
			* @public
			* @param {boolean} bReplace If this is true the navigation/hash will be replaced
			*/
			navigateToRoot: fnNavigateToRoot,

			/**
			 * Navigates to the specified context.
			 *
			 * @public
			 * @param {Object} oTargetContext - The context to navigate to (or null - e.g. when the navigationProperty should be appended to the current path)
			 * @param {string} sNavigationProperty - The navigation property
			 * @param {boolean} bReplace If this is true the navigation/hash will be replaced
			 */
			navigateToContext: fnNavigateToContext,
			/**
			 * Navigates to the message page and shows the specified content.
			 *
			 * @public
			 * @param {Object} mParameters - The parameters for message page
			 */
			navigateToMessagePage: fnNavigateToMessagePage,

			/**
			 * Navigate back
			 *
			 * @public
			 */
			navigateBack: fnNavigateBack
		};
	}

	function constructor(oNavigationController, oTemplateContract){
		var oNavigationControllerProxy = {
			oAppComponent: oTemplateContract.oAppComponent,
			oRouter: oTemplateContract.oAppComponent.getRouter(),
			oTemplateContract: oTemplateContract,
			oHashChanger: HashChanger.getInstance(),
			mRouteToComponentResolve: {}
		};
		oTemplateContract.oNavigationControllerProxy = oNavigationControllerProxy;
		var oFinishedPromise = new Promise(function(fnResolve){
			// remark: In case of inbound navigation with edit-mode and an existing draft, this promise will be resolved
			// before the initialization is actually finished.
			// This is necessary to be able to show the unsavedChanges-Dialog
			oNavigationControllerProxy.fnInitializationResolve = fnResolve;
		});
		oTemplateContract.oBusyHelper.setBusy(oFinishedPromise);
		jQuery.extend(oNavigationController, getMethods(oTemplateContract, oNavigationControllerProxy));
		jQuery.extend(oNavigationControllerProxy, oNavigationController);
		// TODO: this has to be clarified and fixed
		oNavigationControllerProxy.oRouter._oViews._getViewWithGlobalId = function(oView) {
			/* 
			 * check, whether the component for the given viewname has already been created
			 * by searching in componentRegistry - if yes, just return the existing one
			 * (instead of a view, also a component container can be returned)
			 */
			oView.viewName = oView.name || oView.viewName;
			for (var key in oTemplateContract.componentRegistry){
				if (oTemplateContract.componentRegistry[key].route === oView.viewName){
					return oTemplateContract.componentRegistry[key].oComponent.getComponentContainer();
				}
			}
			
			var oRoute = oNavigationControllerProxy.oRouter.getRoute(oView.viewName);
			var oContainer;
			if (oRoute && oRoute._oConfig) {
				oContainer = fnCreateComponentInstance(oTemplateContract, oRoute._oConfig, oNavigationControllerProxy.mRouteToComponentResolve[oView.viewName]);
			} else {
				oContainer = sap.ui.view({
					viewName: oView.viewName,
					type: oView.type,
					height: "100%"
				});
			}
			if (oView.viewName === "root") {
				oTemplateContract.rootContainer = oContainer;
			}

			return oContainer.loaded();
		};
		routingHelper.startupRouter(oNavigationControllerProxy);
	}

	/*
	 * Handles all navigation and routing-related tasks for the application.
	 *
	 * @class The NavigationController class creates and initializes a new navigation controller with the given
	 *        {@link sap.suite.ui.generic.template.lib.AppComponent AppComponent}.
	 * @param {sap.suite.ui.generic.template.lib.AppComponent} oAppComponent The AppComponent instance
	 * @public
	 * @extends sap.ui.base.Object
	 * @version 1.60.35
	 * @since 1.30.0
	 * @alias sap.suite.ui.generic.template.lib.NavigationController
	 */
	var NavigationController = BaseObject.extend("sap.suite.ui.generic.template.lib.NavigationController", {
		metadata: {
			library: "sap.suite.ui.generic.template"
		},
		constructor: function(oTemplateContract) {
			// inherit from base object.
			BaseObject.apply(this, arguments);
			testableHelper.testableStatic(constructor, "NavigationController")(this, oTemplateContract);
		}
	});

	NavigationController._sChanges = "Changes";
	return NavigationController;
});