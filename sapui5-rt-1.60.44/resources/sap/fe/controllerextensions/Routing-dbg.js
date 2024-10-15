/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
		"jquery.sap.global",
		'sap/ui/core/mvc/ControllerExtension',
		"sap/m/MessagePage",
		"sap/m/Link",
		"sap/m/MessageBox",
		"sap/ui/core/routing/HashChanger",
		"sap/fe/viewFactory",
		"sap/ui/model/json/JSONModel"],
	function (jQuery, ControllerExtension, MessagePage, Link, MessageBox, HashChanger, viewFactory, JSONModel) {
		'use strict';

		// this singleton are used to transfer contexts between pages
		var oUseContext;
		var oParentListBinding;

		/**
		 * {@link sap.ui.core.mvc.ControllerExtension Controller extension} for routing and navigation
		 *
		 * @namespace
		 * @alias sap.fe.controllerextensions.Routing
		 *
		 * @sap-restricted
		 * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
		 * @since 1.54.0
		 */
		var Extension = ControllerExtension.extend('sap.fe.controllerextensions.Routing', {
			/**
			 * Navigates to a context
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Routing#navigateToContext
			 * @memberof sap.fe.controllerextensions.Routing
			 * @static
			 * @param {sap.ui.model.odata.v4.Context} context to be navigated to
			 * @param {map} [mParameters] Optional, can contain the following attributes:
			 * @param {boolean} [mParameters.noHistoryEntry] Navigate without creating a history entry
			 * @param {boolean} [mParameters.useCanonicalPath] Use canonical path
			 * @returns {Promise} Promise which is resolved once the navigation is triggered
			 *
			 * @sap-restricted
			 * @final
			 */

			navigateToContext: function (oContext, mParameters) {
				mParameters = mParameters || {};
				var oRootControl = this._getOwnerComponent().getRootControl(),
					// set oParentListBinding for the Paginator and the root control to busy only if we are navigating from a list binding
					bIsListBinding = oContext && oContext.getBinding().getMetadata().getName() === "sap.ui.model.odata.v4.ODataListBinding" ,
					sPath;

				if (oContext.getIndex() === undefined || oContext.isTransient()){
					// it's not a list binding context or it is a transient one so store it in the singleton
					// TODO: check with model colleagues if there is a better way to check it
					oUseContext = oContext;
				}

				// store parent binding to pass to children pages, only if its a list binding
				// make sure it is a list binding as it could also be context binding via EDIT or CANCEL
				if (bIsListBinding) {
					oParentListBinding = oContext.getBinding();
				}

				// set navigation container to busy before initiating hash change
				// we only do this if the root control is a NavContainer
				// As a first version we also only do it if a history entry is created as otherwise usually no
				// navigation is triggered -> TODO: shall we introduce a new parameter for this?
				// using NavContainer afterNavigate event to reset this busy state
				if (!mParameters.noHistoryEntry && oRootControl && oRootControl.getMetadata().getName() === "sap.m.NavContainer") {
					oRootControl.setBusy(true);
				}

				if (mParameters.useCanonicalPath) {
					sPath = oContext.getCanonicalPath();
				} else {
					// TODO: this is only a work around until the context provides the right path.
					sPath = oContext.getPath();
					var sCanonicalPath = oContext.getCanonicalPath();
					if (sPath.indexOf('/-1') !== -1) {
						var sUID =  sCanonicalPath.split('(')[1]; // get string after '(' . Example : "PublicationUUID=005056ab-6fd8-1ee8-a9ec-5d7bc10f6196,IsActiveEntity=false)"
						sPath = sPath.substring(0, sPath.indexOf('/-1')) + '(' + sUID;
					} else {
						sPath = oContext.getPath();
					}
				}

				// remove extra '/' at the beginning of path
				while (sPath.indexOf('/') === 0) {
					sPath = sPath.substr(1);
				}

				// TODO: what about the appState? Currently this one is just overwritten
				if (mParameters.noHistoryEntry) {
					this._getHashChanger().replaceHash(sPath);
				} else {
					this._getHashChanger().setHash(sPath);
				}

				// we resolve the promise once the navigation is triggered
				return Promise.resolve();
			},

			/*
			 * Reset Breadcrumb links
			 *
			 * @function
			 * @param {sap.ui.model.odata.v4.Context} [oContext] context of parent control
			 * @param {array} [aLinks] array of breadcrumb links {sap.m.Link}
			 * @description Used when context of the objectpage changes.
			 *              This event callback is attached to modelContextChange
			 *              event of the Breadcrumb control to catch context change.
			 *              Then element binding and hrefs are updated for each Link.
			 *
			 * @sap-restricted
			 * @experimental
			 */
			setBreadcrumbLinks: function (oContext, aLinks) {

				if (aLinks.length && oContext !== null) {
					if ((oContext === undefined) && (aLinks[0].getBindingContext() !== null)) {
						// To stop the bindingcontext from parent to propagate to the links on change of parent's context
						aLinks.forEach(function (oLink) {
							oLink.setBindingContext(null);
						});
						return;
					} else if (oContext && oContext.getPath()) {
						var sNewPath = oContext.getPath();
						// Checking if links are already created
						var sLinkPath = aLinks[aLinks.length - 1].getElementBinding() && aLinks[aLinks.length - 1].getElementBinding().getPath();
						if (sLinkPath && sNewPath.indexOf(sLinkPath) > -1) {
							return;
						}

						var sAppSpecificHash = this._getHashChanger().hrefForAppSpecificHash("");
						var sPath = "", aPathParts = sNewPath.split("/");

						sAppSpecificHash = sAppSpecificHash.split("/")[0];
						aPathParts.shift();
						aPathParts.splice(-1, 1);
						for (var i = 0 ; i < aLinks.length ; i++) {
							var oLink = aLinks[i];
							sPath = sPath + "/" + aPathParts[i];
							oLink.setHref(sAppSpecificHash + sPath);
							oLink.bindElement({
								path : sPath,
								parameters : {
									$$groupId : '$auto.associations' // GroupId might be changed in future
								}
							});
						}
					}
				}
			},

			/*
			 * Creation of links for Breadcrumbs
			 *
			 * @function
			 * @param {string} [sPath] complete path for creation of Breadcrumb links
			 * @param {sap.ui.model.odata.v4.ODataModel} [oModel] default oData V4 data service model
			 * @description Used to create Breadcrumb links for the target.
			 *              This can be called to get links when a new view gets created (List Report and Object Page).
			 *
			 * @sap-restricted
			 * @experimental
			 */
			createBreadcrumbLinks : function(sPath, oModel) {
				if (oModel && sPath) {
					var aLinks = [], sLinkPath = "", aLinkParts = sPath.split("/");

					// Skip the target page which will be open when breadcrumbs are loaded
					aLinkParts.splice(-1, 1);
					for (var i = 0; i < aLinkParts.length ; i++) {
						sLinkPath = sLinkPath + "/" + aLinkParts[i];
						// sHash for Link Href
						// oLinkContext for annotation excess during templating
						aLinks.push({
							'oLinkContext': oModel.getMetaModel().getMetaContext(sLinkPath.replace(/ *\([^)]*\) */g, "") + "/$Type")
						});
					}
					return aLinks;
				} else {
					return [];
				}
			},

			/**
			 * Triggers an outbound navigation
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Routing#navigateOutbound
			 * @memberof sap.fe.controllerextensions.Routing
			 * @static
			 * @param {string} outboundTarget name of the outbound target (needs to be defined in the manifest)
			 * @param {sap.ui.model.odata.v4.Context} Context that contain the data for the target app
			 * @returns {Promise} Promise which is resolved once the navigation is triggered (??? maybe only once finished?)
			 *
			 * @sap-restricted
			 * @final
			 */
			navigateOutbound: function (sOutboundTarget, oContext) {
				var oOutbounds = this._getOutbounds(),
					oDisplayOutbound = oOutbounds[sOutboundTarget];

				if (oDisplayOutbound) {
					var oParameters = {};
					if (oDisplayOutbound.parameters) {

						for (var sParameter in oDisplayOutbound.parameters) {
							if (oDisplayOutbound.parameters[sParameter].value.format === "binding") {
								oParameters[sParameter] = oContext.getProperty(oDisplayOutbound.parameters[sParameter].value.value);
							}
						}
					}
					var oCrossAppNavigator = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService("CrossApplicationNavigation");
					oCrossAppNavigator && oCrossAppNavigator.toExternal({
						target: {
							semanticObject: oDisplayOutbound.semanticObject,
							action: oDisplayOutbound.action
						},
						params: oParameters
					});

					return Promise.resolve();
				} else {
					throw new Error("outbound target " + sOutboundTarget + " not found in cross navigation definition of manifest");
				}
			},

			/**
			 * Creates and navigates a message page to show an error
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Routing#navigateToContext
			 * @memberof sap.fe.controllerextensions.Routing
			 * @static
			 * @param {string} errorMessage A human readable error message
			 * @param {map} [mParameters] Optional, can contain the following attributes:
			 * @param {sap.m.NavContainer} [mParameters.navContainer] Instance of a sap.m.NavContainer if not specified the method expects tha owner component of the view to be the navigation container
			 * @param {string} [mParameters.description] A human readable description of the error
			 * @param {string} [mParameters.technicalMessage] Technical Message
			 * @param {string} [mParameters.technicalDetails] Further technical details
			 * @returns {Promise} Promise which is resolved once the navigation is triggered (??? maybe only once finished?)
			 *
			 * @sap-restricted
			 * @final
			 */
			navigateToMessagePage: function (sErrorMessage, mParameters) {
				var oNavContainer = mParameters.navContainer || this._getOwnerComponent().getRootControl();

				if (!this.oMessagePage) {
					this.oMessagePage = new MessagePage({
						showHeader: false,
						icon: "sap-icon://message-error"
					});

					oNavContainer.addPage(this.oMessagePage);
				}

				this.oMessagePage.setText(sErrorMessage);

				if (mParameters.technicalMessage) {
					this.oMessagePage.setCustomDescription(
						new Link({
							text: mParameters.description || mParameters.technicalMessage,
							press: function () {
								MessageBox.show(mParameters.technicalMessage, {
									icon: MessageBox.Icon.ERROR,
									title: mParameters.title,
									actions: [MessageBox.Action.OK],
									defaultAction: MessageBox.Action.OK,
									details: mParameters.technicalDetails || "",
									contentWidth: "60%"
								});
							}
						})
					);
				} else {
					this.oMessagePage.setDescription(mParameters.description || '');
				}

				oNavContainer.to(this.oMessagePage);
			},

			/**
			 * This sets the dirty state of an entity set in the app which can later be fetched via
			 * via getDirtyState, for example, to be used in order to decide if a binding refresh is required or not
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Routing#setDirtyState
			 * @memberof sap.fe.controllerextensions.Routing
			 * @static
			 * @param {sap.ui.model.odata.v4.Context} context for which state has to be set dirty
			 * @param {boolean} whether entity set is dirty or not
			 *
			 * @sap-restricted
			 * @final
			 */
			setDirtyState: function (oContext, bDirty) {
				if (typeof oContext === "string") {
					// if path is passed as string
					sap.fe.controllerextensions.Routing.mAppDirtyState[oContext] = bDirty;
				} else {
					var sPath = oContext.getPath();
					if (sPath) {
						// for new context currently getPath returns '/<entitySet>/-1' . Example, '/Artists/-1' hence this is check is reuired for the time being
						// Once getPath returns the proper path this check can be removed
						if (sPath.indexOf('/-1') !== -1) {
							sPath =	sPath.substring(0, sPath.indexOf('/-1'));
						} else {
							sPath = sPath.substring(0, sPath.lastIndexOf('('));
						}
						// TODO: Discuss this later to come up with a better solution
						if (sPath.lastIndexOf('/') !== -1) {
							// remove the Navigation property path to get the parent page context to set dirty
							sPath = sPath.substring(0, sPath.lastIndexOf('/'));
						}
						sap.fe.controllerextensions.Routing.mAppDirtyState[sPath] = bDirty;
					} else {
						jQuery.sap.log.error(sPath + " could not be marked dirty");
					}
				}
			},
			/**
			 * Resets the dirty state to the initial state
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Routing#getDirtyState
			 * @memberof sap.fe.controllerextensions.Routing
			 * @static
			 *
			 * @sap-restricted
			 * @final
			 */
			resetDirtyState: function () {
				sap.fe.controllerextensions.Routing.mAppDirtyState = [];
			},			/**
			 * Returns the dirty state of the given entity set
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Routing#getDirtyState
			 * @memberof sap.fe.controllerextensions.Routing
			 * @static
			 * @param {string} path of entity set which should be marked dirty
			 * @returns {object} Object containing the dirty bindings
			 * @sap-restricted
			 * @final
			 */
			getDirtyState: function (sPath) {
				return sPath ? sap.fe.controllerextensions.Routing.mAppDirtyState[sPath] : sap.fe.controllerextensions.Routing.mAppDirtyState;
			},
			/**
			 * This initializes and extends the routing as well as the attaching to hash changes
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Routing#initializeRouting
			 * @memberof sap.fe.controllerextensions.Routing
			 * @static
			 * @param {sap.ui.core.Component} application component owning the routing
			 *
			 * @sap-restricted
			 * @final
			 */
			initializeRouting: function (oAppComponent) {
				var oRouter = oAppComponent.getRouter(),
					oMeta = oAppComponent.getMetadata(),
					oUI5Config = oMeta.getManifestEntry("sap.ui5"),
					oTargets = oUI5Config && oUI5Config.routing && oUI5Config.routing.targets,
					mViews = {},
					bNavigationEventsAttached = false,
					fnRouteMatched,
					that = this;

				// this hack is only a workaround
				oRouter._oViews._getViewWithGlobalId = function (mParameters) {
					if (mParameters.id.indexOf("---")) {
						// currently the routing adds the ID of the component - as this is not what we want we remove thi-*s
						// one again - to be discussed with UI5 core / routing
						mParameters.id = mParameters.id.split("---")[1];
					}
					var mTarget;
					var fnCreateView = function () {
						if (!mViews[mParameters.id]) {
							// Creating breadcrumb Links for the page
							var aLinks = that.createBreadcrumbLinks(that._getHashChanger().getHash(), oAppComponent.getModel());
							if (mParameters.name) {
								mParameters.viewName = mParameters.name;
							}
							mViews[mParameters.id] = viewFactory.create({
								viewId: mParameters.id,
								viewName: mParameters.viewName,
								appComponent: oAppComponent,
								entitySet: mTarget.entitySet,
								viewData: jQuery.extend(mTarget.viewData, {links: aLinks ? aLinks : []}),
								model: oAppComponent.getModel()
							});
						}
						return mViews[mParameters.id];

					};

					for (var p in oTargets) {
						mTarget = oTargets[p];
						if (mTarget.viewId === mParameters.id) {
							return {
								loaded: fnCreateView,
								isA: function() {return true;}
							};
						}
					}
				};

				fnRouteMatched = function (oEvent) {
					var oBindingContext,
						sBindingContextPath,
						fnOnBeforeBinding = jQuery.noop,
						fnOnAfterBinding = jQuery.noop,
						oController,
						mArguments = oEvent.getParameters().arguments,
						sViewId = oTargets[oEvent.getParameter("config").target].viewId,
						oViewPromise = mViews[sViewId],
						oRootControl = oAppComponent.getRootControl(),
						sTarget = "";

					// if the root control is a NavContainer, it is set to busy when navigateToContext
					// handler to reset the busy state is attached once here
					if (!bNavigationEventsAttached && oRootControl && oRootControl.getMetadata().getName() === "sap.m.NavContainer") {
						oRootControl.attachAfterNavigate(function() {
							oRootControl.setBusy(false);
						});
						bNavigationEventsAttached = true;
					}

					if (Object.keys(mArguments).length > 0) {
						// get route pattern and remove query part
						sTarget = oEvent.getParameters().config.pattern;

						// the query name is static now but can be also a parameter in the future
						sTarget = sTarget.replace(":?query:", "");

						for (var p in mArguments) {
							sTarget = sTarget.replace('{' + p + '}', mArguments[p]);
						}

						// the binding target is always absolute
						sTarget = sTarget && '/' + sTarget;
					}

					if (oViewPromise) {
						oViewPromise.then(function (oView) {
							oBindingContext = oView.getBindingContext();
							sBindingContextPath = oBindingContext && oBindingContext.getPath();
							if (sBindingContextPath !== sTarget) {
								oController = oView.getController();
								if (oController){
									fnOnBeforeBinding = oController.onBeforeBinding && oController.onBeforeBinding.bind(oController);
									fnOnAfterBinding = oController.onAfterBinding && oController.onAfterBinding.bind(oController);
								}

								if (sTarget) {
									Promise.resolve(fnOnBeforeBinding()).then(function () {
										if (oUseContext){
											// there's a context stored so use this one
											oView.setBindingContext(oUseContext);
											fnOnAfterBinding(oUseContext, {parentBinding : oParentListBinding});
											oUseContext = null;
											oParentListBinding = null;
										} else {
											// we need to create a new binding context
											var oBindingContext = oView.getModel().bindContext(sTarget, null, {$$patchWithoutSideEffects : true}).getBoundContext(),
												fnDataReceived = function (oEvent) {
													if (oEvent.getParameter("error")){
														// TODO: add i18n texts
														// TODO: in case of 404 the text shall be different
														sap.ui.getCore().getLibraryResourceBundle("sap.fe", true).then(function (oResourceBundle) {
															that.navigateToMessagePage(oResourceBundle.getText('SAPFE_DATA_RECEIVED_ERROR'), {
																title: oResourceBundle.getText('SAPFE_ERROR'),
																description: oEvent.getParameter("error"),
																navContainer : oAppComponent.getRootControl()
															});
														});
													} else {
														fnOnAfterBinding(oBindingContext, {parentBinding : oParentListBinding});
														oParentListBinding = null;
													}
												};
											oBindingContext.getBinding().attachEventOnce("dataReceived", fnDataReceived);
											oView.setBindingContext(oBindingContext);
										}
									});
								} else if (sTarget === "") {
									// in case of LR no need to wait for binding to be available
									// instead this is more to perform tasks required on each load of LR
									fnOnAfterBinding();
								}
							} else if (Object.keys(sap.fe.controllerextensions.Routing.mAppDirtyState).length > 0) {
								// once and action is performed, the binding of the binding context is changed and it is no longer refreshable
								// so the target has to be bound again
								// Example:
								// if we perform the editAction on a bindingContext
								// oBindingContext.getBinding() returns -> com.sap.gateway.srvd.sadl_gw_appmusicdr_definition.v0001.EditActionAction(...)
								// and this binding is not refreshable and hence  oBindingContext.getBinding().refresh() throws an error
								// Similarly for activation action the binding returned is com.sap.gateway.srvd.sadl_gw_appmusicdr_definition.v0001.EditAction(...)
								// which is again not refreshable and hence the binding context for the target has to be created again and bound to the OP.
								// TODO : This is a work around because of the aboce explaination we should disuss this
								oBindingContext = oView.getModel().bindContext(sTarget, null, {$$patchWithoutSideEffects : true}).getBoundContext();
								oBindingContext.getBinding().refresh();
								oView.setBindingContext(oBindingContext);
							}
						});
					}
				};

				oRouter.attachRouteMatched(fnRouteMatched);

				oRouter.initialize();
			},

			/* Private Methods */
			_getHashChanger: function () {
				if (!this.oHashChanger) {
					this.oHashChanger = HashChanger.getInstance();
				}
				return this.oHashChanger;
			},

			_getOutbounds: function () {
				if (!this.outbounds) { // in the future we might allow setting the outbounds from outside
					if (!this.manifest) { // in the future we might allow setting the manifest from outside
						// as a fallback we try to get the manifest from the view's owner component

						this.manifest = this._getOwnerComponent().getMetadata().getManifest();
					}
					this.outbounds = this.manifest["sap.app"] && this.manifest["sap.app"].crossNavigation && this.manifest["sap.app"].crossNavigation.outbounds;
				}

				return this.outbounds;
			},

			_getOwnerComponent: function () {
				// this.base does not have the getOwnerComponent - as a workaround we get the view and again
				// the controller to access the owner component
				return this.base.getView().getController().getOwnerComponent();
			}

		});

		// a Singleton map that contains the dirty state of each entity within the app
		sap.fe.controllerextensions.Routing.mAppDirtyState = {};

		return Extension;
	}
);
