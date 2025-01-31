/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
/**
 * Defines Application related support rules.
 */
sap.ui.define(["sap/ui/support/library"], function(SupportLib) {
	"use strict";

	// shortcuts
	var Categories = SupportLib.Categories; // Accessibility, Performance, Memory, ...
	var Severity = SupportLib.Severity; // Hint, Warning, Error
	var Audiences = SupportLib.Audiences; // Control, Internal, Application

	var aObsoleteFunctionNames = ["jQuery.sap.require", "$.sap.require", "sap.ui.requireSync", "jQuery.sap.sjax"];

	// avoid spoiling the globalAPIRule by using Object.getOwnPropertyDescriptor
	if (jQuery && jQuery.sap && !!Object.getOwnPropertyDescriptor(jQuery.sap, "sjax").value) {
		aObsoleteFunctionNames.push("jQuery.sap.syncHead",
			"jQuery.sap.syncGet",
			"jQuery.sap.syncPost",
			"jQuery.sap.syncGetText",
			"jQuery.sap.syncGetJSON");
	}

	//**********************************************************
	// Rule Definitions
	//**********************************************************
	/**
	 * Check controller code for obsolete function calls.
	 *
	 * e.g. <code>{aObsoleteFunctionNames:["jQuery.sap.sjax"]}</code>
	 */
	var oControllerSyncCodeCheckRule = {
		id: "controllerSyncCodeCheck",
		audiences: [Audiences.Internal],
		categories: [Categories.Consistency],
		enabled: true,
		minversion: "1.32",
		title: "Synchronous calls in controller code",
		description: "Synchronous calls are deprecated within the Google Chrome browser and block the UI.",
		resolution: "Use asynchronous XHR calls instead",
		resolutionurls: [{
			text: 'Documentation: Loading a Module',
			href: 'https://sapui5.hana.ondemand.com/#docs/guide/d12024e38385472a89c1ad204e1edb48.html'
		}],
		check: function(oIssueManager, oCoreFacade, oScope) {

			// get the controllers and the associated viewId
			var aElements = oScope.getElementsByClassName(sap.ui.core.mvc.View);
			var aControllersWithViewId = [];
			aElements.forEach(function(oElement) {
				if (oElement.getController) {
					var oController = oElement.getController();
					if (oController) {
						aControllersWithViewId.push({
							controller: oController,
							viewId: oElement.getId()
						});
					}
				}
			});

			// checks the given module's functions code for invalidContent
			// returns an array which contains the functions with invalid content
			var fnGatherInvalidControllerFunctions = function(oController, viewId, aInvalidContent, fnProcessInvalidFunction) {
				var _aInvalidControllerFunctions = [];
				Object.keys(oController).forEach(function(sProtoKey) {
					var sFnContent = oController[sProtoKey].toString().replace(/(\r\n|\n|\r)/gm, "");

					aInvalidContent.forEach(function(sInvalidContent) {
						if (sFnContent.indexOf(sInvalidContent) > 0) {
							fnProcessInvalidFunction(oController.getMetadata().getName(), sProtoKey, sInvalidContent, viewId);
						}
					});


				});
				return _aInvalidControllerFunctions;
			};

			var mViewIdToControllerFunctions = {};

			// check the code for each controller and their prototype
			// and stores it grouped by view id in <code>mViewIdToControllerFunctions</code>
			aControllersWithViewId.forEach(function(oControllerWithViewId) {

				var fnMapUsingViewIds = function(sControllerName, sFnName, sInvalidContent, sViewId) {
					mViewIdToControllerFunctions[sViewId] = mViewIdToControllerFunctions[sViewId] || [];
					mViewIdToControllerFunctions[sViewId].push({
						controllerName: sControllerName,
						functionName: sFnName,
						invalidContent: sInvalidContent
					});
				};

				// check each controller and their prototypes
				var oController = oControllerWithViewId.controller;
				while (oController) {
					fnGatherInvalidControllerFunctions(oController, oControllerWithViewId.viewId, aObsoleteFunctionNames, fnMapUsingViewIds);
					var oControllerPrototype = Object.getPrototypeOf(oController);
					// sanity check to avoid potential endless loops and limit recursion only up to the Controller itself
					if (oController === oControllerPrototype || oControllerPrototype === sap.ui.core.mvc.Controller.prototype) {
						break;
					}
					oController = oControllerPrototype;
				}
			});


			// add issues for each invalid controller function
			Object.keys(mViewIdToControllerFunctions).forEach(function(sViewId) {
				var aControllerFunctions = mViewIdToControllerFunctions[sViewId];
				oIssueManager.addIssue({
					severity: Severity.Medium,
					details: aControllerFunctions.map(function(oController) {
						return "Synchronous call " + oController.invalidContent + " found in " + oController.controllerName + "#" + oController.functionName;
					}).reduce(function(sFullText, sCurrentText) {
						return sFullText + "\n" + sCurrentText;
					}),
					context: {
						id: sViewId
					}
				});

			});

		}

	};

	/**
	 * Check for usage of stubbed global API, which leads to a sync request and should be avoided.
	 *
	 * e.g. <code>jQuery.sap.assert(bValue)</code>
	 */
	var oGlobalAPIRule = {
		id: "globalApiUsage",
		audiences: [Audiences.Internal],
		categories: [Categories.Modularization],
		enabled: true,
		minversion: "1.58",
		title: "Call of deprecated global API",
		description: "Calls of deprecated global API without declaring the according dependency should be avoided.",
		resolution: "Declare the dependency properly or even better: Migrate to the modern module API as documented.",
		resolutionurls: [{
			text: 'Documentation: Modularization',
			// TODO: link to the modularization dev guide
			href: 'https://openui5.hana.ondemand.com/#/api'
		}],
		check: function(oIssueManager, oCoreFacade, oScope) {
			var oLoggedObjects = oScope.getLoggedObjects("jquery.sap.stubs");
			oLoggedObjects.forEach(function(oLoggedObject) {
				oIssueManager.addIssue({
					severity: Severity.High,
					details: oLoggedObject.message,
					context: {
						id: "WEBPAGE"
					}
				});
			});
		}
	};

	/**
	 * Check for usage of jquery.sap modules and provide a hint on the alternatives.
	 */
	var oJquerySapRule = {
		id: "jquerySapUsage",
		audiences: [Audiences.Internal],
		categories: [Categories.Modularization],
		enabled: true,
		minversion: "1.58",
		async: true,
		title: "Usage of deprecated jquery.sap module",
		description: "Usage of deprecated jquery.sap API should be avoided and dependencies to jquery.sap are not needed any longer.",
		resolution: "Migrate to the modern module API as documented.",
		resolutionurls: [{
			text: 'Documentation: Modularization',
			// TODO: link to the modularization dev guide
			href: 'https://openui5.hana.ondemand.com/#/api'
		}],
		check: function(oIssueManager, oCoreFacade, oScope, fnResolve) {
			sap.ui.require(["sap/base/util/LoaderExtensions"], function(LoaderExtensions) {
				var sDetails = "Usage of deprecated jquery.sap modules detected: \n" +
					LoaderExtensions.getAllRequiredModules().filter(function(sModuleName) {
						return sModuleName.startsWith("jquery.sap");
					}).reduce(function(sModuleList, sModuleName) {
						return sModuleList + "\t- " + sModuleName + "\n";
					}, "");

				oIssueManager.addIssue({
					severity: Severity.Medium,
					details: sDetails,
					context: {
						id: "WEBPAGE"
					}
				});

				fnResolve();
			});
		}
	};

	/**
	 * Check if factories are loaded sync
	 */
	var oSyncFactoryLoadingRule = {
		id: "syncFactoryLoading",
		audiences: [Audiences.Internal],
		categories: [Categories.Modularization],
		enabled: true,
		minversion: "1.58",
		title: "Usage of deprecated sync factory loading",
		description: "Usage of deprecated sync factory loading",
		resolution: "Avoid using sync factory loading and use load() function instead. Migrate to the modern module API as documented.",
		resolutionurls: [{
			text: 'Documentation: Modularization',
			href: 'https://openui5.hana.ondemand.com/#/api/sap.ui'
		}],
		check: function(oIssueManager, oCoreFacade, oScope) {
			var aFragmentTypes = [
				"sap.ui.fragment",
				"sap.ui.xmlfragment",
				"sap.ui.jsfragment",
				"sap.ui.htmlfragment",
				"sap.ui.controller",
				"sap.ui.extensionpoint",
				"sap.ui.component"
			];

			aFragmentTypes.forEach(function(sType) {
				var oLoggedObjects = oScope.getLoggedObjects(sType);
				oLoggedObjects.forEach(function(oLoggedObject) {
					oIssueManager.addIssue({
						severity: Severity.High,
						details: oLoggedObject.message,
						context: {
							id: "WEBPAGE"
						}
					});
				});
			});
		}

	};

	/**
	 * Check if deprecated factories are called.
	 */
	var oFragmentLoadRule = {
		id: "fragmentLoad",
		audiences: [Audiences.Application, Audiences.Control, Audiences.Internal],
		categories: [Categories.Usage],
		enabled: true,
		minversion: "1.60",
		title: "Check for improper usage of sap.ui.core.Fragment.load() factory",
		description: "When used improperly the Fragment.load() factory might cause issues in UI5 versions >= 1.84. " +
		"With UI5 versions >= 1.84, the 'sap.ui.core.Fragment.load()' API will change its internal implementation for loading and processing resources from synchronous to asynchronous.",
		resolution: "Please make sure that control and/or application code correctly awaits the resolution of the Promise returned by 'Fragment.load()'. " +
		"The content controls of a fragment can only safely be accessed by their ID once the 'Fragment.load()' result promise has resolved." +
		"This support rule will be removed with UI5 versions >= 1.84.",
		resolutionurls: [{
			text: 'Documentation: Programmatically Instantiating XML Fragments',
			href: 'https://openui5nightly.hana.ondemand.com/topic/d6af195124cf430599530668ddea7425'
		},
		{
			text: 'Documentation: Programmatically Instantiating JS Fragments',
			href: 'https://openui5nightly.hana.ondemand.com/topic/3cff5d0fa6754c0d9fdacd80653b81fb'
		}],
		check: function(oIssueManager, oCoreFacade, oScope) {
			var oLoggedObjects = oScope.getLoggedObjects("FragmentLoad");
			oLoggedObjects.forEach(function(oLoggedObject) {
				oIssueManager.addIssue({
					severity: Severity.High,
					details: "sap.ui.core.Fragment.load() API is used. Behavior changes with UI5 versions >= 1.84.",
					context: {
						id: "WEBPAGE"
					}
				});
			});
		}
	};

	return [oControllerSyncCodeCheckRule, oGlobalAPIRule, oJquerySapRule, oSyncFactoryLoadingRule, oFragmentLoadRule];
}, true);