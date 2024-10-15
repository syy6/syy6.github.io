// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/* eslint-disable no-warning-comments */
sap.ui.define([
    "sap/ushell/ui5service/ShellUIService",
    "sap/ui/Device",
    "sap/ushell/CanvasShapesManager",
    "./AccessKeysHandler",
    "./History",
    "sap/ushell/components/applicationIntegration/AppLifeCycle",
    "sap/ushell/services/AppConfiguration",
    "sap/ushell/services/AppType",
    "sap/ushell/services/Message",
    "sap/ushell/ui/launchpad/Fiori2LoadingDialog",
    "sap/ushell/utils",
    "sap/ushell/resources",
    "sap/ushell/UserActivityLog",
    "sap/ushell/EventHub",
    "sap/ushell/Config",
    "sap/ui/core/Component",
    "jquery.sap.storage",
    "sap/ushell/utils/WindowUtils"
], function (
    ShellUIService,
    Device,
    CanvasShapesManager,
    AccessKeysHandler,
    History,
    AppLifeCycle,
    AppConfiguration,
    appType,
    Message,
    Fiori2LoadingDialog,
    utils,
    resources,
    UserActivityLog,
    EventHub,
    Config,
    Component,
    Storage,
    WindowUtils
) {
    "use strict";
    /* global Promise */
    /* eslint no-warning-comments: 0 */

    /* dont delay these cause they are needed for direct bookmarks */

    // create global model and add some demo data
    var closeAllDialogs = true,
        bPreviousPageDirty = false,
        bBackGroundPainted = false,
        oShellModel,
        ShellModel = AppLifeCycle.getElementsModel(),
        oModel,
        oEpcmNavigationMode = {
            embedded: 0,
            newWindowThenEmbedded: 1,
            newWindow: 1,
            replace: 0
        },
        oNavigationMode = {
            embedded: "embedded",
            newWindowThenEmbedded: "newWindowThenEmbedded",
            newWindow: "newWindow",
            replace: "replace"
        },
        oConfig = {};
    //noinspection JSClosureCompilerSyntax
    /**
     * @name sap.ushell.renderers.fiori2.Shell
     * @extends sap.ui.core.mvc.Controller
     * @public
     */
    sap.ui.controller("sap.ushell.renderers.fiori2.Shell", {

        /**
         * SAPUI5 lifecycle hook
         * @public
         */
        _aDoableObjects : [],

        onComponentTargetDisplay: function (oEvent) {
            var oParameters = oEvent.getParameters(),
                oContainer = oParameters.control,
                oComponentContainer = oParameters.object;

            oContainer.navTo("centerViewPort", oComponentContainer.getId(), "show");
        },

        onInit: function () {
            var fnUpdate = this.getView().updateShellAggregation;
            sap.ui.getCore().byId("shell-header").updateAggregation = fnUpdate;
            sap.ui.getCore().byId("shell").updateAggregation = fnUpdate;
            sap.ui.getCore().byId("right-floating-container").updateAggregation = fnUpdate;
            sap.ui.getCore().byId("shell-split").updateAggregation = fnUpdate;

            var oRouter = Component.getOwnerComponentFor(this.getView()).getRouter();
            oRouter.getTarget("home").attachDisplay(this.onComponentTargetDisplay);
            oRouter.getTarget("appfinder").attachDisplay(this.onComponentTargetDisplay);

            // TODO We still need to think about implementing a custom router to move the display handler from
            // this file to the custom router. Maybe use oRouter.attachBypassed?
            oRouter.initialize(true /*tell the router not to parse the current browser hash, and wait for ShellNavigation.init*/);

            this.bEnableHashChange = true;
            bBackGroundPainted = false;
            closeAllDialogs = true;
            var oView = this.getView();
            var mediaQ = window.matchMedia("(min-width: 600px)"),
                handleMedia;
            var oConfig = (oView.getViewData() ? oView.getViewData().config : {}) || {};

            // The configuration is set by modifying the target `Shell-bootConfig`
            // in the respective system, such that if GUI applications (of type 'TR')
            // should reuse an existing container if any, then the parameter
            // `renderers/fiori2/componentData/config/statefulApplicationContainer/GUI`
            // must be set to `true`.
            AppLifeCycle.parseStatefulContainerConfiguration(oConfig.statefulApplicationContainer);

            this.oEndUserFeedbackConfiguration = {
                showAnonymous: true,
                anonymousByDefault: true,
                showLegalAgreement: true,
                showCustomUIContent: true,
                feedbackDialogTitle: true,
                textAreaPlaceholder: true,
                customUIContent: undefined
            };
            oConfig["enableBackGroundShapes"] = oConfig.enableBackGroundShapes === undefined ? true : oConfig.enableBackGroundShapes;
            // Add global model to view
            this.initShellModel(oConfig);
            handleMedia = function (mq) {
                Config.emit("/core/shell/model/isPhoneWidth", !mq.matches);
            };
            if (mediaQ.addListener) {// Assure that mediaMatch is supported(Not supported on IE9).
                mediaQ.addListener(handleMedia);
                handleMedia(mediaQ);
            }

            // Bind the translation model to this view
            oView.setModel(resources.i18nModel, "i18n");

            // Assign models to the Shell Header
            oView.oShellHeader.setModel(oModel);
            oView.oShellHeader.setModel(resources.i18nModel, "i18n");

            sap.ui.getCore().getEventBus().subscribe("externalSearch", this.externalSearchTriggered, this);
            // handling of configuration should be done before the code block below otherwise the doHashChange is
            // triggered before the personalization flag is disabled (URL may contain hash value which invokes navigation)
            this._setConfigurationToModel();

            // Doable objects are kept in a global array to enable their off-ing later on.
            this._aDoableObjects = this._registerAndCreateEventHubDoables(oConfig);

            // make sure service instance is alive early, no further action needed for now
            sap.ushell.Container.getService("AppLifeCycle");

            oShellModel.addHeaderEndItem(["NotificationsCountButton"], false, ["home", "app", "minimal"], true);


            this.history = new History();
            this.oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
            AppLifeCycle.init(oConfig.appState, this.oViewPortContainer,  oConfig.rootIntent, oConfig.disableHomeAppCache, {
                ownerComponent: this.getOwnerComponent()
            }, oConfig.storageSize? oConfig.storageSize: 10);

            this.oNotificationsCountButton = sap.ui.getCore().byId("NotificationsCountButton");

            this.oFiori2LoadingDialog = sap.ui.getCore().byId("Fiori2LoadingDialog");

            // init Shell Navigation
            var initShellNavigation = function (oShellNavigation) {
                this.oShellNavigation = oShellNavigation;
                // register the router in the ShellNavigation to let it skip the split of hash
                // before firing the hashChange event
                this.oShellNavigation.registerExtraRouter(oRouter);
                this.oShellNavigation.registerNavigationFilter(this._handleEmptyHash.bind(this));
                // must be after event registration (for synchronous navtarget resolver calls)
                this.oShellNavigation.init(this.doHashChange.bind(this));

                this.oShellNavigation.registerNavigationFilter(this._disableSourceAppRouter.bind(this));

                this.oShellNavigation.registerNavigationFilter(this.handleDataLoss.bind(this));
                this.oShellNavigation.registerNavigationFilter(this._savePreviousHash.bind(this));
                this._previousHash = null;

                // enable the direct app start and tests to wait for the initialization
                EventHub.emit("ShellNavigationInitialized");
            }.bind(this);
            Promise.all([
                sap.ushell.Container.getServiceAsync("URLParsing"),
                sap.ushell.Container.getServiceAsync("URLShortening")
            ]).then(function () {
                return sap.ushell.Container.getServiceAsync("ShellNavigation");
            }).then(initShellNavigation);

            sap.ushell.Container.setLogonFrameProvider(this._getLogonFrameProvider());

            AccessKeysHandler.init(oModel);

            window.onbeforeunload = function () {
                if (sap.ushell.Container && sap.ushell.Container.getDirtyFlag()) {
                    if (!resources.browserI18n) {
                        resources.browserI18n = resources.getTranslationModel(window.navigator.language).getResourceBundle();
                    }
                    return resources.browserI18n.getText("dataLossExternalMessage");
                }
            };

            if (Config.last("/core/shell/model/contentDensity")) {
                // do not call _applyContentDensity,
                // no promiss that the component-preload is fully loaded and _applyContentDensity loades the root application.
                // we only want to display the shell in its default state, once the root application will be loaded then the _applyContentDensity will be called with promiss that component-preload loaded.
                AppLifeCycle.getAppMeta()._applyContentDensityClass();
            }

            //in case meArea is on we need to listen to size changes to support
            //overflow behavior for end items in case there is not enough space
            //to show all in the header, and making sure that logo is displayed currectly
            Device.media.attachHandler(this.onScreenSizeChange, this, Device.media.RANGESETS.SAP_STANDARD);
            this.onScreenSizeChange(Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD));

            // close MeArea and Notifications by orientation change, otherwise the layout is broken
            Device.orientation.attachHandler(function () {
                var view = sap.ui.getCore().byId('viewPortContainer');
                if (view && view.getCurrentState() !== "Center") {
                    view.switchState("Center");
                }
            });

            this.initShellUIService();

            sap.ui.getCore().attachThemeChanged(this.redrawBackGroundShapes);

            if (oConfig.sessionTimeoutIntervalInMinutes) {
                var iLazyCreationTime = 20000,
                    that = this;

                setTimeout(function () {
                    that._createSessionHandler(oConfig);
                }, iLazyCreationTime);
            }

            this.oViewPortContainer.onfocusin = function () {
                //focus not in the shell
                AccessKeysHandler.bFocusOnShell = false;
                AccessKeysHandler.bFocusPassedToExternalHandlerFirstTime = false;
            };

            this.oViewPortContainer.onfocusout = function () {
                //focus in the shell
                AccessKeysHandler.bFocusOnShell = true;
                AccessKeysHandler.bFocusPassedToExternalHandlerFirstTime = true;
            };

        },

        shellUpdateAggItem: function (sId, oContext) {
            return sap.ui.getCore().byId(oContext.getObject());
        },

        /**
         * Creates the EventHub event bindings and returns them in a Array of doables.
         *
         * @param {object} oConfig An object containing configuration options
         * @returns {object[]} A list of "Doable" objects
         */
        _registerAndCreateEventHubDoables: function (oConfig) {
            var aDoables = [
                EventHub.once("CenterViewPointContentRendered").do(this._loadCoreExt.bind(this)),
                EventHub.on("AppRendered").do(this.setBackGroundShapes.bind(this)),
                EventHub.on("AppRendered").do(this.delayedCloseLoadingScreen.bind(this)),
                EventHub.once("AppRendered").do(this._loadCoreExtNonUI5.bind(this)),
                EventHub.on("toggleContentDensity").do(this.toggleContentDensity.bind(this)),
                EventHub.on("ShellFloatingContainerDockedIsResized").do(this._onResizeWithDocking.bind(this)),
                EventHub.on("LaunchpadCustomRouterRouteMatched").do(this._centerViewPort.bind(this)),

                EventHub.once("CoreResourcesComplementLoaded").do(this._onCoreResourcesComplementLoaded.bind(this)),
                EventHub.once("RendererExtensionPluginsLoaded").do(this._onRendererExtensionPluginsLoaded.bind(this)),
                // ensure warmup plugins are loaded after renderer extension plugins and homepage processing finished
                EventHub.join(
                    EventHub.once("RendererExtensionPluginsLoaded"),
                    EventHub.once("firstSegmentCompleteLoaded"),
                    EventHub.once("ShellComplete")
                ).do(this._loadWarmupPlugins.bind(this))
            ];
            if (oConfig && oConfig.moveEditHomePageActionToShellHeader) {
                aDoables.push(EventHub.on("showCatalog").do(this._hideEditButton.bind(this)));
            }
            return aDoables;
        },

        initShellModel: function (oConfig) {
            oShellModel = ShellModel;
            oShellModel.init(oConfig, AppLifeCycle.shellElements().model());
            oModel = this.getView().getViewData().shellModel;
            Config.emit("/core/shell/model/personalization", Config.last("/core/shell/enablePersonalization"));
        },

        redrawBackGroundShapes: function () {
            if (oConfig.enableBackGroundShapes) {
                CanvasShapesManager.drawShapes();
            }
        },

        setBackGroundShapes: function () {
            var bEnableAnimationDrawing = Config.last("/core/shell/model/animationMode") !== 'minimal';

            if (!bBackGroundPainted && oConfig.enableBackGroundShapes) {
                bBackGroundPainted = true;
                CanvasShapesManager.drawShapes();
                CanvasShapesManager.enableAnimationDrawing(bEnableAnimationDrawing);
            }
        },

        initShellUIService: function () {
            AppLifeCycle.initShellUIService({
                fnOnBackNavigationChange: this.onBackNavigationChange.bind(this)
            });

            if (oConfig.enableOnlineStatus) {
                sap.ui.require(["sap/ushell/ui5service/UserStatus"], function (UserStatus) {
                    this.oUserStatus = new UserStatus({
                        scopeObject: this.getOwnerComponent(),
                        scopeType: "component"
                    });


                    this.oUserStatus.attachEnabledStatusChanged(function (oEvent) {
                        Config.emit("/core/shell/model/userStatusEnabled", oEvent.mParameters.data);
                    }.bind(this));

                    this.oUserStatus.attachStatusChanged(function (oEvent) {
                        var oUserStatusData = oEvent.mParameters.data;
                        Config.emit("/core/shell/model/userStatus", oUserStatusData);
                        if (oUserStatusData === null) {
                            Config.emit("/core/shell/model/userStatusUserEnabled", false);
                        } else {
                            Config.emit("/core/shell/model/userStatusUserEnabled", true);
                        }
                    }.bind(this));
                }.bind(this));
            }
        },

        /*
         * This method change the back navigation handler with custom logic in
         * the shell header when the ShellUIService#setBackNavigation method is
         * called.
         * - this method currently assumes that the
         * application is displayed in the "minimal" state (no home button
         * present).
         */
        onBackNavigationChange: function (oEvent) {
            this.isBackNavigationChanged = true;
            var fnCallback = oEvent.getParameters().data,
                oCurrentStateModel = Config.last("/core/shell/model/currentState");

            if (fnCallback){
                AppLifeCycle.service().setNavigateBack(fnCallback);

                if (oCurrentStateModel.stateName === 'minimal' || oCurrentStateModel.stateName === 'standalone' || oCurrentStateModel.stateName === 'embedded') {
                    sap.ushell.Container.getRenderer('fiori2').showHeaderItem('backBtn', true);
                }


            } else {
                //if no callback is provided we set the default handler: history back
                AppLifeCycle.service().resetNavigateBack();
            }

        },

        toggleContentDensity: function (oData) {
            var isCompact = oData.contentDensity === "compact";
            AppLifeCycle.getAppMeta()._applyContentDensityByPriority(isCompact);
        },

        _handleEmptyHash: function (sHash) {
            sHash = (typeof sHash === "string") ? sHash : "";
            sHash = sHash.split("?")[0];
            if (sHash.length === 0) {
                var oViewData = this.getView() ? this.getView().getViewData() : {};
                oConfig = oViewData.config || {};
                //Migration support:  we have to set rootIntent empty
                //And continue navigation in order to check if  empty hash is resolved locally
                if (oConfig.migrationConfig) {
                    return this.oShellNavigation.NavigationFilterStatus.Continue;
                }
                if (oConfig.rootIntent) {
                    setTimeout(function () {
                        window.hasher.setHash(oConfig.rootIntent);
                    }, 0);
                    return this.oShellNavigation.NavigationFilterStatus.Abandon;
                }
            }
            return this.oShellNavigation.NavigationFilterStatus.Continue;
        },

        _setConfigurationToModel: function () {
            var oViewData = this.getView().getViewData();

            if (oViewData) {
                oConfig = oViewData.config || {};
            }
            if (oConfig) {
                if (oConfig.states) {
                    ShellModel.extendStates(oConfig.states);
                }

                //EU Feedback flexable configuration
                if (oConfig.changeEndUserFeedbackTitle !== undefined) {
                    this.oEndUserFeedbackConfiguration.feedbackDialogTitle = oConfig.changeEndUserFeedbackTitle;
                }

                if (oConfig.changeEndUserFeedbackPlaceholder !== undefined) {
                    this.oEndUserFeedbackConfiguration.textAreaPlaceholder = oConfig.changeEndUserFeedbackPlaceholder;
                }

                if (oConfig.showEndUserFeedbackAnonymousCheckbox !== undefined) {
                    this.oEndUserFeedbackConfiguration.showAnonymous = oConfig.showEndUserFeedbackAnonymousCheckbox;
                }

                if (oConfig.makeEndUserFeedbackAnonymousByDefault !== undefined) {
                    this.oEndUserFeedbackConfiguration.anonymousByDefault = oConfig.makeEndUserFeedbackAnonymousByDefault;
                }

                if (oConfig.showEndUserFeedbackLegalAgreement !== undefined) {
                    this.oEndUserFeedbackConfiguration.showLegalAgreement = oConfig.showEndUserFeedbackLegalAgreement;
                }
                //EU Feedback configuration end.
                if (oConfig.enableSetTheme !== undefined) {
                    oModel.setProperty("/setTheme", oConfig.enableSetTheme);
                }

                // Compact Cozy mode
                oModel.setProperty("/contentDensity", oConfig.enableContentDensity === undefined ? true : oConfig.enableContentDensity);

                // check for title
                if (oConfig.title) {
                    oModel.setProperty("/title", oConfig.title);
                }
                //Check if the configuration is passed by html of older version(1.28 and lower)
                if (oConfig.migrationConfig !== undefined) {
                    oModel.setProperty("/migrationConfig", oConfig.migrationConfig);
                }
                //User default parameters settings
                if (oConfig.enableUserDefaultParameters !== undefined) {
                    oModel.setProperty("/userDefaultParameters", oConfig.enableUserDefaultParameters);
                }

                if (oConfig.disableHomeAppCache !== undefined) {
                    oModel.setProperty("/disableHomeAppCache", oConfig.disableHomeAppCache);
                }
                // xRay enablement configuration
                oModel.setProperty("/enableHelp", Config.last("/core/extension/enableHelp"));
                oModel.setProperty("/searchAvailable", (oConfig.enableSearch !== false));

                // enable/disable animations
                oModel.bindProperty('/animationMode').attachChange(this.handleAnimationModeChange.bind(this));
                oModel.setProperty("/animationMode", oConfig.animationMode);
                this._getPersData({container:"flp.launchpad.animation.mode", item :"animationMode"})
                    .then(function (oUserAnimationMode) {
                        oModel.setProperty("/animationMode", oUserAnimationMode ? oUserAnimationMode : oConfig.animationMode);
                        oConfig.animationMode = oUserAnimationMode ? oUserAnimationMode : oConfig.animationMode;
                    });
                // tracking activities
                this._getPersData({container:"flp.settings.FlpSettings", item :"userActivitesTracking"})
                    .then(function (enableTrackingActivity) {
                        if (enableTrackingActivity === undefined) {
                            enableTrackingActivity = true;
                        }
                        oModel.setProperty("/enableTrackingActivity", enableTrackingActivity);
                    })
                    .catch(function (error) {
                        jQuery.sap.log.error(
                            "Failed to ltracking activities state state from the personalization", error,
                            "sap.ushell.components.flp.settings.FlpSettings");
                    });
            }
        },

        _hideEditButton: function (){
            var editButton = sap.ui.getCore().byId("ActionModeBtn");
            if (editButton) {
                editButton.setVisible(false);
            }
        },
        _getPreviousPageDirty: function () {
            return bPreviousPageDirty;
        },
        _setPreviousPageDirty: function ( bState) {
            bPreviousPageDirty = bState;
        },
        getModelConfiguration: function () {
            var oViewData = this.getView().getViewData(),
                oConfiguration,
                oShellConfig;

            if (oViewData) {
                oConfiguration = oViewData.config || {};
                oShellConfig = jQuery.extend({}, oConfiguration);
            }
            delete oShellConfig.applications;
            return oShellConfig;
        },
        /**
         * This method will be used by the Container service in order to create, show and destroy a Dialog control with an
         * inner iframe. The iframe will be used for rare scenarios in which additional authentication is required. This is
         * mainly related to SAML 2.0 flows.
         * The api sequence will be managed by UI2 services.
         * @returns {{create: Function, show: Function, destroy: Function}} Logon Frame Provider interface
         * @private
         */
        _getLogonFrameProvider: function () {
            var oView = this.getView();

            return {
                /* @returns a DOM reference to a newly created iFrame. */
                create: function () {
                    return oView.createIFrameDialog();
                },

                /* make the current iFrame visible to user */
                show: function () {
                    oView.showIFrameDialog();
                },

                /* hide, close, and destroy the current iFrame */
                destroy: function () {
                    oView.destroyIFrameDialog();
                }
            };
        },

        onExit: function () {

            this._aDoableObjects.forEach(function (oDoable) {
                oDoable.off();
            });

            sap.ui.getCore().getEventBus().unsubscribe("externalSearch", this.externalSearchTriggered, this);
            Device.media.detachHandler(this.onScreenSizeChange, this, Device.media.RANGESETS.SAP_STANDARD);

            // Some qUnits destroy the shell very early, check if oShellNavigation exists
            if (this.oShellNavigation) {
                this.oShellNavigation.hashChanger.destroy();
            }
            var aDanglingControls = this.getView().aDanglingControls;
            if (aDanglingControls) {
                aDanglingControls.forEach(function (oControl) {
                    if (oControl.destroyContent) {
                        oControl.destroyContent();
                    }
                    oControl.destroy();
                });
            }

            var oShellHeader = this.getView().oShellHeader;
            if (oShellHeader && oShellHeader.destroy) {
                oShellHeader.destroy();
            }

            UserActivityLog.deactivate();
            oShellModel.destroy();
            AppLifeCycle.shellElements().clean();
            AppLifeCycle.destroy();
            oShellModel = undefined;
            this.bEnableHashChange = true;
        },

        handleAnimationModeChange: function () {
            var sAnimationMode = Config.last("/core/shell/model/animationMode"),
                bEnableAnimationDrawing = sAnimationMode !== 'minimal';

            CanvasShapesManager.enableAnimationDrawing(bEnableAnimationDrawing);
            sap.ui.getCore().getEventBus().publish("launchpad", "animationModeChange", {sActionMode: sAnimationMode});
        },

        getAnimationType: function () {
            return "show";
        },

        /**
         * @returns the current router of the current application component
         */
        _getCurrentAppRouter: function () {
            var oAppLifeCycle = sap.ushell.Container.getService("AppLifeCycle"),
                oCurrentApplication = oAppLifeCycle && oAppLifeCycle.getCurrentApplication && oAppLifeCycle.getCurrentApplication(),
                oComponentInstance = oCurrentApplication && oCurrentApplication.componentInstance;

            if (oComponentInstance) {
                return oComponentInstance.getRouter();
            }
            return null;
        },

        /**
         * If the navigation is not an inner app navigation, this function stops the router of the old application.
         *
         * @param {string} newHash new url hash
         * @param {string} oldHash old url hash
         */
        _disableSourceAppRouter: function (newHash, oldHash) {
            if (!this.bEnableHashChange) {
                return this.oShellNavigation.NavigationFilterStatus.Continue;
            }

            var bAppSpecificChange = this.oShellNavigation.hashChanger.isInnerAppNavigation(newHash, oldHash);
            if (!bAppSpecificChange) {
                var oCurrentAppRouter = this._getCurrentAppRouter();

                if (oCurrentAppRouter) {
                    oCurrentAppRouter.stop();
                }
            }

            return this.oShellNavigation.NavigationFilterStatus.Continue;
        },

        /**
         * Makes sure that the router is not stopped after a failed / aborted
         * navigation. We ignore the current hash when re-initializing the
         * router because we are handling cases that restore the old state
         * (nothing should change application side when the router is resumed).
         */
        _resumeAppRouterIgnoringCurrentHash: function () {
            var oAppRouter = this._getCurrentAppRouter();

            if (oAppRouter) {
                oAppRouter.initialize(true /* bIgnoreInitialHash */);
            }
        },

        /**
         * Navigation Filter function registered with ShellNavigation service.
         * Triggered on each navigation.
         * Aborts navigation if there are unsaved data inside app(getDirtyFlag returns true).
         * @param {string} newHash new hash
         * @param {string} oldHash old hash
         * @returns {string} Navigation filter status
         * @private
         */
        handleDataLoss: function (newHash, oldHash) {
            if (!this.bEnableHashChange) {
                this.bEnableHashChange = true;
                this.closeLoadingScreen();
                return this.oShellNavigation.NavigationFilterStatus.Custom;
            }

            if (sap.ushell.Container.getDirtyFlag()) {
                if (!resources.browserI18n) {
                    resources.browserI18n = resources.getTranslationModel(window.navigator.language).getResourceBundle();
                }
                /*eslint-disable no-alert*/
                if (confirm(resources.browserI18n.getText("dataLossInternalMessage"))) {
                    /*eslint-enable no-alert*/
                    sap.ushell.Container.setDirtyFlag(false);
                    bPreviousPageDirty = true;
                    return this.oShellNavigation.NavigationFilterStatus.Continue;
                }

                this._resumeAppRouterIgnoringCurrentHash();
                if (this._previousHash === newHash) {
                    this.bEnableHashChange = false;
                    //Asume that back navigation. Need to add new antry because it was removed
                    window.hasher.setHash(oldHash);
                    return this.oShellNavigation.NavigationFilterStatus.Custom;
                }


                var bAppSpecificChange = this.oShellNavigation.hashChanger.isInnerAppNavigation(newHash, oldHash);
                var bWasHistoryEntryReplaced = this.oShellNavigation.wasHistoryEntryReplaced();
                //navigation forward but hash was replaced. Need to replace back
                if (bAppSpecificChange && bWasHistoryEntryReplaced) {
                    return {
                        status: this.oShellNavigation.NavigationFilterStatus.Custom,
                        hash: oldHash
                    };
                }

                //navigation forward and new entry was added
                this.bEnableHashChange = false;
                window.history.back(1);
                return this.oShellNavigation.NavigationFilterStatus.Custom;



            }

            return this.oShellNavigation.NavigationFilterStatus.Continue;
        },

        _savePreviousHash: function (newHash, oldHash) {
            var bAppSpecificChange = this.oShellNavigation.hashChanger.isInnerAppNavigation(newHash, oldHash);
            var bWasHistoryEntryReplaced = this.oShellNavigation.wasHistoryEntryReplaced();

            if (bAppSpecificChange && bWasHistoryEntryReplaced) {
                //don't save the hash when app rewrite the history by replace hash
                return this.oShellNavigation.NavigationFilterStatus.Continue;
            }
            this._previousHash = oldHash;
            return this.oShellNavigation.NavigationFilterStatus.Continue;
        },

        /**
         * Checks whether an application is cold started. This method is
         * scoped to checking the cold start conditions of applications only.
         *
         * A cold start state occurs whenever the user has previously opened
         * the window.
         *
         * - page is refreshed
         * - URL is pasted in a new window
         * - user opens the page and pastes a URL
         *
         * @return {boolean} whether the application is in a cold start state
         */
        _isColdStart: function () {
            var oRenderer = sap.ushell.Container.getRenderer('fiori2');
            var bNoCoreViewNavigated = !oRenderer || !oRenderer.getCurrentCoreView();
            if (this.history.getHistoryLength() <= 1 && bNoCoreViewNavigated) {
                return true;
            }
            this._isColdStart = function () {
                return false;
            };
            return false;
        },

        _setEnableHashChange : function (bValue) {
            this.bEnableHashChange  = bValue;
        },

        /**
         * Triggers the app-usage mechanism to log an openApp action.
         *
         * @param {object} oRecentActivity An object containing details of a recently opened app
         * @returns {Promise} A promise that is resolved once the action is logged
         * @private
         */
        _logRecentActivity: function (oRecentActivity) {
            return AppConfiguration.addActivity(oRecentActivity);
        },

        _logApplicationUsage: function (sFixedShellHash) {
            if (sap.ushell.Container) {
                sap.ushell.Container.getServiceAsync("UserRecents").then(function (oUserRecentsService) {
                    oUserRecentsService.addAppUsage(sFixedShellHash);
                });
            }
        },

        /**
         * Sets application container based on information in URL hash.
         *
         * This is a callback registered with NavService. It's triggered
         * whenever the url (or the hash fragment in the url) changes.
         *
         * NOTE: when this method is called, the new URL is already in the
         *       address bar of the browser. Therefore back navigation is used
         *       to restore the URL in case of wrong navigation or errors.
         * @param {string} sShellHash shell hash
         * @param {string} sAppPart application part
         * @param {string} sOldShellHash previous shell hash
         * @param {string} sOldAppPart previous application part
         * @param {object} oParseError parse error
         * @returns {Promise} promise
         * @public
         */
        doHashChange: function (sShellHash, sAppPart, sOldShellHash, sOldAppPart, oParseError) {

            //Performance Debug
            jQuery.sap.measure.start("FLP:ShellController.doHashChange", "doHashChange", "FLP");
            utils.addTime("ShellControllerHashChange");

            return this
                ._doHashChange(this, sShellHash, sAppPart, sOldShellHash, sOldAppPart, oParseError)
                .then(function () {
                    jQuery.sap.measure.end("FLP:ShellController.doHashChange");
                }, function (vError) {
                    jQuery.sap.measure.end("FLP:ShellController.doHashChange");
                    // throw new Error(vError);
                });
        },

        _doHashChange: function (oShellController, sShellHash, sAppPart, sOldShellHash, sOldAppPart, oParseError) {
            var oInMemoryApplicationInstance, iOriginalHistoryLength, sFixedShellHash;

            if (!this.bEnableHashChange) {
                this.bEnableHashChange = true;
                oShellController.closeLoadingScreen();
                return jQuery.when();
            }

            if (oParseError) {
                oShellController.hashChangeFailure(oShellController.history.getHistoryLength(), oParseError.message, null, "sap.ushell.renderers.fiori2.Shell.controller", false);
                return jQuery.when();
            }

            if (sap.m.InstanceManager && closeAllDialogs) {
                sap.m.InstanceManager.closeAllDialogs();
                sap.m.InstanceManager.closeAllPopovers();
            }
            closeAllDialogs = true;

            // navigation begins
            oShellController.openLoadingScreen();

            if (utils.getParameterValueBoolean("sap-ushell-no-ls")) {
                oShellController.closeLoadingScreen();
            }

            // save current history length to handle errors (in case)
            iOriginalHistoryLength = oShellController.history.getHistoryLength();

            sFixedShellHash = oShellController.fixShellHash(sShellHash);

            // track hash change
            oShellController.history.hashChange(sFixedShellHash, sOldShellHash);

            // we save the current-application before resolving the next
            // navigation's fragment, as in cases of navigation in a new window
            // we need to set it back for the app-configuration to be consistent
            oShellController.currentAppBeforeNav = AppConfiguration.getCurrentApplication();

            jQuery.sap.flpmeasure.end(0, "Creating Shell");
            jQuery.sap.flpmeasure.start(0, "targetResolution", 1);

            return oShellController._resolveHashFragment(sFixedShellHash)
                .then(function (oResolvedHashFragment, oParsedShellHash) {
                    /*
                     * NOTE: AppConfiguration.setCurrentApplication was called
                     * with the currently resolved target.
                     */
                    jQuery.sap.flpmeasure.end(0, "targetResolution");
                    jQuery.sap.flpmeasure.start(0, "CreateComponent", 3);

                    var sIntent = oParsedShellHash ? oParsedShellHash.semanticObject + "-" + oParsedShellHash.action : "",
                        oConfig = oShellController._getConfig(),
                        bComponentLoaded = !!(oResolvedHashFragment && oResolvedHashFragment.componentHandle),
                        // for SAPUI5 apps, the application type is still "URL"
                        // due to backwards compatibility, but the
                        // NavTargetResolution service already extracts the
                        // component name, so this can directly be
                        // used as indicator
                        sTargetUi5ComponentName = oResolvedHashFragment && oResolvedHashFragment.ui5ComponentName;

                    // calculate effective Navigation Mode with resolution
                    // result and current Application, we will determine the
                    // next navigation mode.
                    oResolvedHashFragment = oShellController._calculateNavigationMode(oParsedShellHash, oResolvedHashFragment);
                    // if new window, open the window immediately
                    if (oResolvedHashFragment &&
                        (oResolvedHashFragment.navigationMode === oNavigationMode.newWindow ||
                            utils.isNativeWebGuiNavigation(oResolvedHashFragment))
                    ) {
                        // add the app to application usage log
                        oShellController.logOpenAppAction(sFixedShellHash, oResolvedHashFragment, sAppPart);
                        oShellController._openAppInNewWindowAndRestore(oResolvedHashFragment);
                        return;
                    }

                    // In case of empty hash, if there is a resolved target, set
                    // the flag to false, from now on the rootIntent will be an
                    // empty hash. Otherwise, change hash to rootIntent to
                    // trigger normal resolution.
                    if (Config.last("/core/shell/model/migrationConfig")) {
                        oConfig.migrationConfig = false;
                        oShellController.getModel().setProperty("/migrationConfig", false);

                        if (oResolvedHashFragment && sFixedShellHash === '#') {
                            oConfig.rootIntent = "";
                        } else if (sFixedShellHash === '#') {
                            setTimeout(function () {
                                window.hasher.setHash(oConfig.rootIntent);
                            }, 0);
                            return;
                        }
                    }

                    // add application config to the application properties
                    if (oConfig && oConfig.applications && oConfig.applications[sIntent]) {
                        oResolvedHashFragment.applicationConfiguration = oConfig.applications[sIntent];
                    }

                    oInMemoryApplicationInstance = AppLifeCycle.getInMemoryInstance(sIntent, sFixedShellHash);

                    if (oInMemoryApplicationInstance.isInstanceSupported) {
                        oShellController._initiateApplication(oResolvedHashFragment, sFixedShellHash, oParsedShellHash, iOriginalHistoryLength, sAppPart);
                        return;
                    } else {
                        if (bComponentLoaded || !sTargetUi5ComponentName) {
                            oShellController._initiateApplication(oResolvedHashFragment, sFixedShellHash, oParsedShellHash, iOriginalHistoryLength, sAppPart);
                            return;
                        }
                        AppLifeCycle.destroy(oInMemoryApplicationInstance.appId, oInMemoryApplicationInstance.container);
                    }

                    AppLifeCycle.removeApplication(sIntent);
                    AppConfiguration.setApplicationInInitMode();

                    // normal application:
                    // fire the _prior.newUI5ComponentInstantion event before creating the new component instance, so that
                    // the ApplicationContainer can stop the router of the current app (avoid inner-app hash change notifications)
                    // NOTE: this dependency to the ApplicationContainer is not nice, but we need a fast fix now; we should refactor
                    // the ApplicationContainer code, because most of the logic has to be done by the shell controller; maybe rather introduce
                    // a utility module
                    sap.ui.getCore().getEventBus().publish("ApplicationContainer", "_prior.newUI5ComponentInstantion",
                        {
                            name: sTargetUi5ComponentName
                        }
                    );

                    //Performance Debug
                    jQuery.sap.measure.start("FLP:ShellController.UI5createComponent", "UI5 createComponent", "FLP");
                    // load ui5 component via shell service; core-ext-light will be loaded as part of the asyncHints

                    // Application.js calls getService("Ui5ComponentLoader") syncronously.
                    // This is the first occurence of getService("Ui5ComponentLoader"), force asyncronous loading.
                    sap.ushell.Container.getServiceAsync("Ui5ComponentLoader").then(function () {
                        AppLifeCycle.createComponent(oResolvedHashFragment, oParsedShellHash).done(function (oResolutionResultWithComponentHandle) {
                            // `oResolutionResultWithComponentHandle` is unused.
                            // This is because oResolvedHashFragment contains the
                            // component handle already.
                            // See the preceeding note in AppLifeCycle.createComponent.
                            jQuery.sap.measure.end("FLP:ShellController.UI5createComponent");
                            jQuery.sap.flpmeasure.end(0, "CreateComponent");
                            oShellController._initiateApplication(oResolvedHashFragment, sFixedShellHash, oParsedShellHash, iOriginalHistoryLength, sAppPart);
                        }).fail(function (vError) {
                            var sErrorReason = resources.i18n.getText("cannot_load_ui5_component_details", [sFixedShellHash]),
                                sErrorReasonEnglish = "Failed to load UI5 component for navigation intent " + sFixedShellHash;

                            AppConfiguration.setCurrentApplication(oShellController.currentAppBeforeNav);
                            oShellController.hashChangeFailure(
                                iOriginalHistoryLength,
                                {
                                    title: resources.i18n.getText("error"),
                                    message: resources.i18n.getText("failed_to_open_ui5_component"),
                                    technicalMessage: sErrorReasonEnglish
                                },
                                {
                                    info: sErrorReason,
                                    technicalMessage: vError.message + "\n" + vError.stack
                                },
                                "sap.ushell.renderers.fiori2.Shell.controller",
                                false);
                        });
                    });
                }, function (sMsg) {
                    var sErrorReason = resources.i18n.getText("cannot_resolve_navigation_target_details", [sFixedShellHash]),
                        sErrorReasonEnglish = "Failed to resolve navigation target: " + sFixedShellHash
                             + ". This is most likely caused by an incorrect SAP Fiori launchpad content configuration or by missing role assignment.";

                    oShellController.hashChangeFailure(
                        iOriginalHistoryLength,
                        {
                            title: resources.i18n.getText("error"),
                            message: resources.i18n.getText("failed_to_open_app_missing_configuration_or_role_assignment"),
                            technicalMessage: sErrorReasonEnglish
                        },
                        {
                            info: sErrorReason,
                            fixedShellHash: sFixedShellHash,
                            technicalMessage: sMsg
                        },
                        "sap.ushell.renderers.fiori2.Shell.controller",
                        false);
                });
        },

        _initiateApplication: function (oResolvedHashFragment, sFixedShellHash, oParsedShellHash, iOriginalHistoryLength, sAppPart) {
            //Performance Debug
            jQuery.sap.measure.start("FLP:ShellController._initiateApplication", "_initiateApplication","FLP");
            var oMetadata = AppConfiguration.getMetadata(oResolvedHashFragment),
                bContactSupportEnabled = Config.last("/core/extension/SupportTicket");

            //the "if" should protect against undefined, empty string and null
            if (oMetadata.title) {
                window.document.title = oMetadata.title;
            } else {
                // FIXME: Remove title so that users don't think it's a bug
                jQuery.sap.log.debug("Shell controller._initiateApplication: the title of the window is not changed because most probably the application was resolved with undefined");
            }
            // the activation of user activity logging must be done after the app component is fully loaded
            // otherwise the module loading sequence causes race conditions on firefox
            if (bContactSupportEnabled) {
                setTimeout(function () {
                    sap.ushell.UserActivityLog.activate();
                }, 0);
            }

            var bNavigationSucceeded = false;
            try {
                this.navigate(oParsedShellHash, sFixedShellHash, oMetadata, oResolvedHashFragment);
                bNavigationSucceeded = true;
            } catch (oExc) {
                if (oExc.stack) {
                    jQuery.sap.log.error("Application initialization (Intent: \n" + sFixedShellHash + "\n failed due to an Exception:\n" + oExc.stack);
                }
                this.hashChangeFailure(iOriginalHistoryLength, oExc.name, oExc.message, oMetadata ? oMetadata.title : "", false);
            }

            if (bNavigationSucceeded) {
                this.logOpenAppAction(sFixedShellHash, oResolvedHashFragment, sAppPart);
            }

            jQuery.sap.measure.end("FLP:ShellController._initiateApplication");
        },

        /**
         * Callback registered with NavService. Triggered on navigation requests
         *
         * @param {string} sShellHash
         *     the hash fragment to parse (must start with "#")
         *
         * @returns {jQuery.Deferred.promise}
         *     a promise resolved with an object containing the resolved hash
         *     fragment (i.e., the result of
         *     {@link sap.ushell.services.NavTargetResolution#resolveHashFragment}),
         *     the parsed shell hash obtained via
         *     {@link sap.ushell.services.URLParsing#parseShellHash},
         *     and a boolean value indicating whether application dependencies <b>and</b> core-ext-light were loaded earlier.
         *     The promise is rejected with an error message in case errors occur.
         */
        _resolveHashFragment: function (sShellHash) {
            //Performance Debug
            jQuery.sap.measure.start("FLP:ShellController._resolveHashFragment", "_resolveHashFragment","FLP");
            var oResolvedHashFragment,
                oParsedShellHashParams,
                oParsedShellHash = sap.ushell.Container.getService("URLParsing").parseShellHash(sShellHash),
                oDeferred = new jQuery.Deferred(),
                oConfig = this._getConfig(); // for testing

            /*
             * Optimization: reconstruct the result of resolveHashFragment if
             * navResCtx is found in the hash fragment.
             */
            oParsedShellHashParams = oParsedShellHash && oParsedShellHash.params || {};
            if (oParsedShellHash && oParsedShellHash.contextRaw && oParsedShellHash.contextRaw === "navResCtx"
                // be robust
                && oParsedShellHashParams
                && oParsedShellHashParams.additionalInformation && (oParsedShellHashParams.additionalInformation[0] || oParsedShellHashParams.additionalInformation[0] === "")
                && oParsedShellHashParams.applicationType && oParsedShellHashParams.applicationType[0]
                && oParsedShellHashParams.url && oParsedShellHashParams.url[0]
                && oParsedShellHashParams.navigationMode && (oParsedShellHashParams.navigationMode[0] || oParsedShellHashParams.additionalInformation[0] === "")
            //&& oParsedShellHashParams.title            && oParsedShellHashParams.title[0]
            ) {
                oParsedShellHashParams = oParsedShellHash.params || {};

                oResolvedHashFragment = {
                    additionalInformation: oParsedShellHashParams.additionalInformation[0],
                    applicationType: oParsedShellHashParams.applicationType[0],
                    url: oParsedShellHashParams.url[0],
                    navigationMode: oParsedShellHashParams.navigationMode[0]
                };

                if (oParsedShellHashParams.title) {
                    oResolvedHashFragment.text = oParsedShellHashParams.title[0];
                }

                oDeferred.resolve(oResolvedHashFragment, oParsedShellHash);
            } else {
                // Check and use resolved hash fragment from direct start promise if it's there
                if (window["sap-ushell-async-libs-promise-directstart"]) {
                    window["sap-ushell-async-libs-promise-directstart"]
                        .then(function (oDirectstartPromiseResult) {
                                oDeferred.resolve(
                                    oDirectstartPromiseResult.resolvedHashFragment,
                                    oParsedShellHash
                                );
                                delete window["sap-ushell-async-libs-promise-directstart"];
                            },
                            function (sMsg) {
                                oDeferred.reject(sMsg);
                                delete window["sap-ushell-async-libs-promise-directstart"];
                            });
                    return oDeferred.promise();
                }

                // Perform target resolution as normal...
                sap.ushell.Container.getService("NavTargetResolution").resolveHashFragment(sShellHash)
                    .done(function (oResolvedHashFragment) {
                        /*
                         * Override navigation mode for root intent.  Shell
                         * home should be opened in embedded mode to allow a
                         * new window to be opened from GUI applications.
                         */
                        if (oParsedShellHash && (oParsedShellHash.semanticObject + "-" + oParsedShellHash.action) === oConfig.rootIntent) {
                            oResolvedHashFragment.navigationMode = "embedded";
                        }
                        jQuery.sap.measure.end("FLP:ShellController._resolveHashFragment");

                        oDeferred.resolve(oResolvedHashFragment, oParsedShellHash);
                    })
                    .fail(function (sMsg) {
                        oDeferred.reject(sMsg);
                    });
            }
            return oDeferred.promise();
        },

        /**
         * Adjust Navigation mode
         * based on current state of the Shell and application and
         * the ResolveHashFragment bo be started
         *
         * This operation mutates oResolvedHashFragment
         *
         *
         * {@link #navigate}.
         *
         * @param {object} oParsedShellHash
         *     the parsed shell hash obtained via
         *     {@link sap.ushell.services.URLParsing} service
         * @param {object} oResolvedHashFragment
         *     the hash fragment resolved via
         *     {@link sap.ushell.services.NavTargetResolution#resolveHashFragment}
         *
         * @returns {object} a new, potentially altered resolution result
         * Note that url and navigation mode may have been changed!
         * For navigation in new window, the URL is replaced with the current location hash
         * NOTE: refactor this; we should not have these implicit changes of the navigation target
         * @private
         */
        _calculateNavigationMode : function (oParsedShellHash, oResolvedHashFragment) {
            if (!oResolvedHashFragment) {
                return undefined; // happens in tests
            }
            var sNavigationMode = oResolvedHashFragment.navigationMode;

            if (sNavigationMode === oNavigationMode.newWindowThenEmbedded) {
                /*
                 * Implement newWindowThenEmbedded based on current state.
                 */
                if (this._isColdStart()
                    || (oParsedShellHash.contextRaw && oParsedShellHash.contextRaw === "navResCtx")
                    || this.history.backwards) {
                    /*
                     * coldstart -> always open in place because the new window
                     *              was opened by the user
                     *
                     * navResCtx -> url was generated by us and opened in a new
                     *              window or pasted in an existing window
                     *
                     * history.backwards -> url was was previously opened in
                     *              embedded mode (at any point in the
                     *              history), and we need to navigate back to
                     *              it in the same mode.
                     */
                    oResolvedHashFragment.navigationMode = oNavigationMode.embedded;
                } else {
                    oResolvedHashFragment.navigationMode = oNavigationMode.newWindow;
                    // if its a non-native navigation, we resolve the hash again in the new window
                    // we set the full current location hash as URL for the new window as it is
                    // for avoiding encoding issues and stripping off parameters or inner-app route
                    // see internal BCP 1770274241
                    if (!utils.isNativeWebGuiNavigation(oResolvedHashFragment)) {
                        oResolvedHashFragment.url = this._getCurrentLocationHash();
                    }
                }
                return oResolvedHashFragment;
            }

            if (sNavigationMode === oNavigationMode.newWindow && this._isColdStart()) {
                /*
                 * Replace the content of the current window if the user has
                 * already opened one.
                 */
                oResolvedHashFragment.navigationMode = oNavigationMode.replace;
                return oResolvedHashFragment;
            }
            return oResolvedHashFragment;
        },

        _usesNavigationRedirect : function (oComponentHandle) {
            if (!oComponentHandle) {
                return new jQuery.Deferred().reject().promise();
            }
            var that = this,
                oComponent = oComponentHandle.getInstance({});
            if (oComponent && typeof oComponent.navigationRedirect === "function") {
                // oComponent refers to a trampolin application
                var oDeferred = new jQuery.Deferred();
                var oNavRedirPromise = oComponent.navigationRedirect();
                if (oNavRedirPromise
                    && typeof oNavRedirPromise.then === "function" ) {
                    oNavRedirPromise.then(function (sNextHash) {
                        jQuery.sap.log.warning("Performing navigation redirect to hash " + sNextHash);
                        oComponent.destroy();
                        that.history.pop();
                        sap.ushell.Container.getService("ShellNavigation").toExternal( { target : { shellHash : sNextHash } }, undefined, false);
                        oDeferred.resolve(true);
                    }, function () {
                        oDeferred.reject();
                    });
                    return oDeferred.promise();
                }
            }
            return new jQuery.Deferred().reject().promise();
        },
        /**
         * Performs navigation based on the given resolved hash fragment.
         *
         * @param {object} oParsedShellHash
         *     the parsed shell hash obtained via
         *     {@link sap.ushell.services.URLParsing} service
         * @param {string} sFixedShellHash
         *     the hash fragment to navigate to. It must start with "#" (i.e., fixed).<br />
         * @param {object} oMetadata
         *     the metadata object obtained via
         *     {@link sap.ushell.services.AppConfiguration#parseShellHash}
         * @param {object} oResolvedHashFragment
         *     the hash fragment resolved via
         *     {@link sap.ushell.services.NavTargetResolution#resolveHashFragment}
         */
        navigate: function (oParsedShellHash, sFixedShellHash, oMetadata, oResolvedHashFragment) {
            //Performance Debug
            jQuery.sap.measure.start("FLP:ShellController.navigate", "navigate","FLP");
            var sNavigationMode = (jQuery.isPlainObject(oResolvedHashFragment) ? oResolvedHashFragment.navigationMode : null),
                that = this;

            /*
             * A null navigationMode is a no-op, it indicates no navigation
             * should occur. However, we need to restore the current hash to
             * the previous one. If coldstart happened (history has only one
             * entry), we go to the shell home.
             */
            if (sNavigationMode === null) {
                if (this._isColdStart()) {
                    window.hasher.setHash("");
                    return;
                }

                this.bEnableHashChange = false;
                this.history.pop();
                this._windowHistoryBack(1);
                return;
            }

            oResolvedHashFragment = this._calculateNavigationMode(oParsedShellHash, oResolvedHashFragment);
            sNavigationMode = (jQuery.isPlainObject(oResolvedHashFragment) ? oResolvedHashFragment.navigationMode : null);

            if (sNavigationMode === oNavigationMode.embedded) {
                var oDeferred = this._usesNavigationRedirect(oResolvedHashFragment.componentHandle);
                // When `oDeferred` succeeds, it implies the component references
                // a trampolin application. The trampolin application subsequently
                // gets destroyed after it's used to enable the redirection.
                // The failure is being used here as a means for branching in
                // the execution flow.
                oDeferred.then(null, function () {
                    that._handleEmbeddedNavMode(sFixedShellHash, oParsedShellHash, oMetadata, oResolvedHashFragment);
                    // maybe restore hash...
                    if (oParsedShellHash && oParsedShellHash.contextRaw === "navResCtx") {
                        jQuery.sap.log.error(" This path will no longer be supported in 1.40");
                        // historical invocation pattern no longer used which allowed
                        // injectiong foreign urls via url parameter
                        // -> prone to url injection
                        //
                        // invication via this mechanism is flawed as it does not resolve
                        // the target in the new window, thus leading to
                        // states which are not consistent (e.g. NavTargetResolution.getCurrentResolutionResult) is wrong.
                        //
                        // should be removed from product for security and complexity considerations
                        //
                        that.bEnableHashChange = false;
                        //replace tiny hash in window
                        // PLEASE don't only treat the sunny side of the beach:
                        // just use the intent X-Y~navResCtx without the fancy stuff and see how it crashes.
                        if (oParsedShellHash
                            && oParsedShellHash.params
                            && oParsedShellHash.params.original_intent
                            && oParsedShellHash.params.original_intent[0]) {
                            window. hasher.replaceHash(oParsedShellHash.params.original_intent[0]);
                            // replace tiny hash in our history model
                            that.history._history[0] = oParsedShellHash.params.original_intent[0];
                        }
                    }
                });
                jQuery.sap.measure.end("FLP:ShellController.navigate");
                return;
            }

            if (sNavigationMode === oNavigationMode.replace) {
                // restore hash
                this.bEnableHashChange = false;
                this._changeWindowLocation(oResolvedHashFragment.url);
                return;
            }

            if (sNavigationMode === oNavigationMode.newWindow) {
                this._openAppInNewWindowAndRestore(oResolvedHashFragment);
                return;
            }

            // the navigation mode doesn't match any valid one.
            // In this case an error message is logged and previous hash is fetched
            this.hashChangeFailure(this.history.getHistoryLength(), "Navigation mode is not recognized", null, "sap.ushell.renderers.fiori2.Shell.controller", false);
        },

        _openAppInNewWindowAndRestore : function (oResolvedHashFragment) {
            // restore hash
            this.bEnableHashChange = false;
            // if NWBC native application, start immediately
            if (utils.isNativeWebGuiNavigation(oResolvedHashFragment)) {
                try {
                    var sUrlWithSapUser = utils.appendUserIdToUrl("sap-user", oResolvedHashFragment.url);
                    var oEpcm =  utils.getPrivateEpcm();
                    var iEpcmNavigationMode = oEpcmNavigationMode[oResolvedHashFragment.navigationMode];
                    if (utils.hasNavigationModeCapability()) {
                        oEpcm.doNavigate(sUrlWithSapUser, iEpcmNavigationMode || oEpcmNavigationMode[oNavigationMode.embedded]);
                    } else {
                        oEpcm.doNavigate(sUrlWithSapUser);
                    }
                } catch (e) {
                    if (e.stack) {
                        jQuery.sap.log.error("Application initialization failed due to an Exception:\n" + e.stack);
                    }
                    this.hashChangeFailure(this.history.getHistoryLength(), e.name, e.message, oResolvedHashFragment.text, false);
                }
            } else {
                this._openAppNewWindow(oResolvedHashFragment.url);
            }
            this.history.pop();
            var oVarInstance = oResolvedHashFragment.componentHandle && oResolvedHashFragment.componentHandle.getInstance &&
                oResolvedHashFragment.componentHandle.getInstance({});
            if (oVarInstance) {
                oVarInstance.destroy();
            }
            this._resumeAppRouterIgnoringCurrentHash();
            this._windowHistoryBack(1);
            // set back the current application to be the one before this navigation occured as current application
            // is opened in a new window
            AppConfiguration.setCurrentApplication(this.currentAppBeforeNav);
            return;
        },

        _handleEmbeddedNavMode: function (sFixedShellHash, oParsedShellHash, oMetadata, oResolvedHashFragment) {
            //Performance Debug
            jQuery.sap.measure.start("FLP:ShellController._handleEmbeddedNavMode", "_handleEmbeddedNavMode", "FLP");
            var sAppId,
                bIsNavToHome,
                sIntent;

            this.resetShellUIServiceHandlers();

            AppLifeCycle.getAppMeta().setAppIcons(oMetadata);

            // obtain a unique id for the app (or the component)
            sAppId = '-' + oParsedShellHash.semanticObject + '-' + oParsedShellHash.action;

            bIsNavToHome = sFixedShellHash === "#" ||
                (oConfig.rootIntent && oConfig.rootIntent === oParsedShellHash.semanticObject + "-" + oParsedShellHash.action);

            //Support migration from version 1.28 or lower in case local resolution for empty hash was used
            sIntent = oParsedShellHash ? oParsedShellHash.semanticObject + "-" + oParsedShellHash.action : "";

            AppLifeCycle.switchViewState(
                AppLifeCycle.shellElements().calculateElementsState(
                    bIsNavToHome? "home": "app",
                    oResolvedHashFragment.applicationType,
                    oConfig.appState,
                    oResolvedHashFragment.explicitNavMode
                ),
                undefined,
                sAppId
            );

            if (bIsNavToHome) {
                AppLifeCycle.getShellUIService().setBackNavigation();
            }

            this._handleHomeAndBackButtonsVisibility();

            AppLifeCycle.handleControl(sIntent,
                sAppId,
                oParsedShellHash,
                oResolvedHashFragment,
                this.getWrappedApplicationWithMoreStrictnessInIntention.bind(this),
                this.closeLoadingScreen.bind(this),
                sFixedShellHash
            );

            this.closeLoadingScreen();

            if (this.currentAppBeforeNav) {
                var oPreviousStatefulContainer = AppLifeCycle.getStatefulContainer(this.currentAppBeforeNav.applicationType);
                if (oPreviousStatefulContainer) {
                    oPreviousStatefulContainer.onApplicationOpened(oResolvedHashFragment.applicationType);
                }
            }

            jQuery.sap.measure.end("FLP:ShellController._handleEmbeddedNavMode");

            // load Ui5ComponentLoader service because listeners are registered to that task which will in turn load
            // the plugins. MeArea, Search and others are implemented as plugin.
            sap.ushell.Container.getServiceAsync("Ui5ComponentLoader").then(function () {
                EventHub.emit("loadCoreResourcesComplement");
            });
        },

        _centerViewPort: function () {
            this.oViewPortContainer.switchState("Center");
        },

        _isShellHomeIntent: function (sIntent) {
            return sIntent === "#" || sIntent === oConfig.rootIntent;
        },


        // Please help improve the strictness of this method.
        getWrappedApplicationWithMoreStrictnessInIntention: function (sIntent, oMetadata, oShellHash, oResolvedNavigationTarget, sAppId, bFullWidth, sFixedShellHash) {
            var oAppContainer, that = this;

            setTimeout(function () {

                setTimeout(function () {
                    //set the focus to shell

                    //If we navigate for a page with state == app set focus on shell app title, otherwise continue
                    // as default behavior
                    var arg;
                    if (Config.last("/core/shell/model/currentState/stateName") === "app") {
                        arg = "shellAppTitle";
                    }

                    AccessKeysHandler.sendFocusBackToShell(arg);

                    setTimeout(function () {
                        //Screen reader: "Loading Complete"
                        that.readNavigationEnd();
                    }, 500);
                }, 100);

                sap.ui.getCore().getEventBus().publish("launchpad", "appOpening", oResolvedNavigationTarget);
                jQuery.sap.log.info('app is being opened');
            }, 0);
            if (oConfig.applications) {
                oResolvedNavigationTarget.applicationConfiguration = oConfig.applications[sIntent];
            }

            oAppContainer = AppLifeCycle.getAppContainer(sAppId, oResolvedNavigationTarget, this._isColdStart(), oShellHash, sFixedShellHash);

            // adding intent as this published application info is required for the contact-support scenario
            oResolvedNavigationTarget.sShellHash = sIntent;
            AppLifeCycle.publishNavigationStateEvents(oAppContainer, oResolvedNavigationTarget, this.onAppAfterRendering.bind(this, oResolvedNavigationTarget));


            oAppContainer.addStyleClass('sapUshellApplicationPage');

            if (!bFullWidth) {
                oAppContainer.addStyleClass("sapUShellApplicationContainerLimitedWidth");
            }

            if (this._isDock() && window.matchMedia('(min-width: 106.4rem)').matches) {
                oAppContainer.addStyleClass("sapUShellDockingContainer");
                oAppContainer.removeStyleClass("sapUShellApplicationContainerLimitedWidth");
            } else if (this._isDock()) {
                oAppContainer.removeStyleClass("sapUShellApplicationContainerLimitedWidth");
            }

            oAppContainer.toggleStyleClass('sapUshellDefaultBackground', !oMetadata.hideLightBackground);

            AppLifeCycle.getAppMeta()._applyContentDensityByPriority();

            // Add inner control for next request
            AppLifeCycle.addControl(oAppContainer);

            setTimeout(function () {
                that.closeLoadingScreen();//In order to prevent unnecessary opening of the loading screen, we close it after the app rendered
            }, 0);

            jQuery.sap.measure.end("FLP:ShellController.getWrappedApplication");
            return oAppContainer;
        },

        //Set booleans to false which indicate whether shellUIService was called or not
        resetShellUIServiceHandlers: function () {
            AppLifeCycle.getAppMeta().resetShellUIServiceHandlers();
            this.isBackNavigationChanged = false;
        },


        onAppAfterRendering: function (oApplication) {
            var oShellUIService = AppLifeCycle.getShellUIService();
            //wrapped in setTimeout since "pubilsh" is not async
            setTimeout(function () {
                sap.ui.getCore().getEventBus().publish("sap.ushell", "appOpened", oApplication);
                jQuery.sap.log.info('app was opened');
            }, 0);

            //publish the event externally
            // TODO: cloned, frozen object!
            var oAppOpenedEventData = AppLifeCycle._publicEventDataFromResolutionResult(oApplication);

            // Event is emitted internally (EventHub) _and_ externally (for compatibility reasons)
            EventHub.emit("AppRendered", oAppOpenedEventData);
            sap.ushell.renderers.fiori2.utils.publishExternalEvent("appOpened", oAppOpenedEventData);

            //Call setHierarchy, setTitle, setRelatedApps with default values in case handlers were not called yet
            if (oShellUIService) {
                if (!AppLifeCycle.getAppMeta().getIsHierarchyChanged()) {
                    oShellUIService.setHierarchy();
                }
                if (!AppLifeCycle.getAppMeta().getIsTitleChanged()) {
                    oShellUIService.setTitle();
                }
                if (!AppLifeCycle.getAppMeta().getIsRelatedAppsChanged()) {
                    oShellUIService.setRelatedApps();
                }
                if (!this.isBackNavigationChanged) {
                    oShellUIService.setBackNavigation();
                }
            }
            oShellModel.updateStateProperty("application/icon", AppLifeCycle.getAppMeta().getAppIcon(), true);
            oShellModel.updateStateProperty("application/showNavMenuTitle", this.bNavMenuTitleVisible, true);
        },

        /**
         * adds a listener to the "appComponentLoaded" Event that is published by the "sap.ushell".
         * once the "home app" Component is saved, the listener is removed, and this function
         * will not do anything.
         */
        _saveHomePageComponent: function () {
            if (this.oHomeApp) {
                return;
            }
            var that = this,
                sContainerNS = "sap.ushell",
                fListener = function (oEvent, sChannel, oData) {
                    that.oHomeApp = oData.component;
                    sap.ui.getCore().getEventBus().unsubscribe(sContainerNS, "appComponentLoaded", fListener);
                };
            sap.ui.getCore().getEventBus().subscribe(sContainerNS, "appComponentLoaded", fListener);
        },

        /**
         * Shows an error message and navigates to the previous page.
         *
         * @param {number} iHistoryLength the length of the history
         *    <b>before</b> the navigation occurred.
         * @param {string|object} vMessage the error message
         * @param {string|object} vDetails the detailed error message
         * @param {string} sComponent the component that generated the error message
         * @param {boolean} bEnableHashChange enable hash change
         */
        hashChangeFailure: function (iHistoryLength, vMessage, vDetails, sComponent, bEnableHashChange) {
            if (utils.isPlainObject(vMessage)) {
                this.reportError(vMessage.technicalMessage, vDetails.technicalMessage, sComponent);
                this.closeLoadingScreen();

                sap.ushell.Container.getService("Message").show(
                    sap.ushell.services.Message.Type.ERROR,
                    vMessage.message,
                    {
                        title: vMessage.title,
                        details: vDetails
                    }
                );
            } else {
                this.reportError(vMessage, vDetails, sComponent);
                this.closeLoadingScreen();
                //use timeout to avoid "MessageService not initialized.: error
                this.delayedMessageError(resources.i18n.getText("fail_to_start_app_try_later"));
            }
            closeAllDialogs = false;

            this._resumeAppRouterIgnoringCurrentHash();
            if (iHistoryLength === 0) {
                // if started with an illegal shell hash (deep link), we just remove the hash
                window.hasher.setHash("");
            } else if (jQuery.sap.getUriParameters().get("bFallbackToShellHome")) {
                // The previous url is not valid navigation
                window.hasher.setHash("");
            } else {
                // navigate to the previous URL since in this state the hash that has failed to load is in the URL.
                this.bEnableHashChange = bEnableHashChange;
                sap.ushell.Container.setDirtyFlag(bPreviousPageDirty);
                this._windowHistoryBack(1);
            }
        },

        reportError: function (sMessage, sDetails, sComponent) {
            jQuery.sap.log.error(sMessage, sDetails, sComponent);
        },

        delayedMessageError: function (sMsg) {
            setTimeout(function () {
                if (sap.ushell.Container !== undefined) {
                    sap.ushell.Container.getService("Message").error(sMsg);
                }
            }, 0);
        },

        fixShellHash: function (sShellHash) {
            if (!sShellHash) {
                sShellHash = '#';
            } else if (sShellHash.charAt(0) !== '#') {
                sShellHash = '#' + sShellHash;
            }
            return sShellHash;
        },

        _openAppNewWindow: function (sUrl) {
            // We first deal with the custom protocol sap-nwbc://
            // IE11 and Edge return null on window.open for custom protocols
            // so we need to account for this case
            // (BCP: 0020751295 0000321778 2018)
            if (sUrl.trim().indexOf("sap-nwbc://") === 0 && (Device.browser.edge || Device.browser.msie)) {
                // We check if IE11 or Edge and the custom sap-nbwc protocol are
                // being used.
                // We check for position 0 to be sure that the string "sap-nwbc" is
                // a protocol and not a parameter later in the URL.
                // We trim the URL, because windows handles "           sap-nwbc://"
                // the same as "sap-nwbc://"
                window.location.href = sUrl;
            } else {
                var newWin = WindowUtils.openURL(sUrl);

                // window.open returns null in IE with protected mode. Disable the blocker check for IE & EDGE (BCP:0020751295 0000019410 2020)
                if (!newWin && !(Device.browser.msie || Device.browser.edge)) {
                    var msg = resources.i18n.getText("fail_to_start_app_popup_blocker", [window.location.hostname]);
                    this.delayedMessageError(msg);
                }
            }
        },

        _windowHistoryBack: function (iStepsBack) {
            window.history.back(iStepsBack);
        },

        _changeWindowLocation: function (sUrl) {
            window.location.href = sUrl;
        },

        /**
         * sizeChange handler, trigger by the sap.ui.Device.media.attachHandler
         * to handle header end ites overflow scenario
         * @param {object} oParams parameters
         */
        handleEndItemsOverflow: function (oParams){
            var aEndItems = Config.last("/core/shell/model/currentState/headEndItems");
            //if there are 2 items and one of them is Notifications or if there is only 1 item, we won't show overflow button
            if (aEndItems.length === 1 || (aEndItems.length === 2 && aEndItems.indexOf("NotificationsCountButton") != -1) ){
                return;
            }
            function removeOverFlowBtn () {
                oShellModel.removeHeaderEndItem(["endItemsOverflowBtn"], false, ["home", "app"]);
                var oPopover = sap.ui.getCore().byId('headEndItemsOverflow');
                if (oPopover) {
                    //we have to destroy the popover in order to make sure the enditems will
                    //be rendered currectly in the header and to avoid duplicate elements
                    //ids in the dom
                    oPopover.destroy();
                }
            }

            if (oParams.name === 'Phone' || oParams.name === 'Tablet') {
                if ( aEndItems.indexOf("endItemsOverflowBtn") === -1) {
                    //we need to add the endItemsOverflowBtn to the model in case we are
                    //not in desktop mode and in case it does not exists
                    oShellModel.addHeaderEndItem(["endItemsOverflowBtn"], false, ["home", "app"]);
                } else {
                    //this case is when the overflow button exists and we have switched between Tablet and Phone media causing header items
                    //to get in or out of the popover, hence we need to re-render the shell header.
                    removeOverFlowBtn();
                    oShellModel.addHeaderEndItem(["endItemsOverflowBtn"], false, ["home", "app"]);
                }
            } else if (oParams.name === "Desktop") {
                if (oParams.showOverFlowBtn) {
                    if (aEndItems.indexOf("endItemsOverflowBtn") === -1) {
                        oShellModel.addHeaderEndItem(["endItemsOverflowBtn"], false, ["home", "app"]);
                    }
                } else {
                    //we need to remove the endItemsOverflowBtn from the model in case we are
                    removeOverFlowBtn();
                }
            }
        },

        /**
         * returns true if we are in overflow mode
         * we enter the overflow mode in case:
         *  - meArea is on
         *  - current width of the screen is not desktop (as recived from the sap.ui.Device.media
         *  - we have 3 buttons in the header (exluding the endItemsOverflowBtn)
         * @returns {boolean} result
         */
        isHeadEndItemOverflow: function () {
            var nNumberOfVisibleElements = 0,
                oElement,
                aEndItems = Config.last("/core/shell/model/currentState/headEndItems");

            if (aEndItems.indexOf("endItemsOverflowBtn") === -1) {
                return false;
            } else {
                var currentMediaType = Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD).name;
                var numAllowedBtn = 3;
                if (currentMediaType === "Phone") {
                    numAllowedBtn = 1;
                }

                //calculate number nNumberOfVisibleElements
                for (var i = 0; i < aEndItems.length; i++) {
                    oElement = sap.ui.getCore().byId(aEndItems[i]);
                    if (oElement && oElement.getVisible()) {
                        nNumberOfVisibleElements++;
                    }
                }

                if (sap.ui.getCore().byId("endItemsOverflowBtn").getVisible()) {
                    return nNumberOfVisibleElements > numAllowedBtn + 1;
                } else {
                    return nNumberOfVisibleElements > numAllowedBtn;
                }
            }
        },

        /**
         * return true for buttons that should go in the overflow and not in the header
         * @param {string} sButtonNameInUpperCase button name
         * @returns {boolean} isHeadEndItemInOverflow
         */
        isHeadEndItemInOverflow: function (sButtonNameInUpperCase) {
            return sButtonNameInUpperCase !== "ENDITEMSOVERFLOWBTN" && !this.isHeadEndItemNotInOverflow(sButtonNameInUpperCase);
        },

        /**
         * return true for buttons that should be in the header and not in oveflow
         * In case overflow mode is on @see isHeadEndItemOverflow only the
         * NotificationsCountButton and the endItemsOverflowButtons should be in the header
         * in case overflow mode is off all buttons except endItemsOverflowButtons
         * should be in the header
         *
         * @param {string} sButtonNameInUpperCase button name
         * @returns {boolean} isHeadEndItemNotInOverflow
         */
        isHeadEndItemNotInOverflow: function (sButtonNameInUpperCase) {
            if (this.isHeadEndItemOverflow()) {
                if (sButtonNameInUpperCase === "NOTIFICATIONSCOUNTBUTTON" || sButtonNameInUpperCase === "ENDITEMSOVERFLOWBTN") {
                    return true;
                } else {
                    var sSizeType = Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD).name;
                    if (sSizeType === "Tablet") {
                        return sButtonNameInUpperCase === "SF" || sButtonNameInUpperCase === "FLOATINGCONTAINERBUTTON";
                    } else if (sSizeType === "Desktop") {
                        return sButtonNameInUpperCase === "SF" || sButtonNameInUpperCase === "FLOATINGCONTAINERBUTTON" || sButtonNameInUpperCase === "COPILOTBTN";
                    } else {
                        return sSizeType !== "Phone";
                    }
                }
            } else if (sButtonNameInUpperCase === "ENDITEMSOVERFLOWBTN") {
                return false;
            } else {
                return true;
            }
        },

        /**
         * in case the endItemsOverflowButtons was pressed we need to show
         * all overflow items in the action sheet
         * @param {object} oEvent event object
         */
        pressEndItemsOverflow: function (oEvent) {
            var oPopover = sap.ui.getCore().byId('headEndItemsOverflow');

            function closePopover () {
                if (oPopover.isOpen()) {
                    oPopover.close();
                }
            }

            if (!oPopover) {
                var oFilter = new sap.ui.model.Filter('', 'EQ', 'a');
                oFilter.fnTest = this.isHeadEndItemInOverflow.bind(this);

                oPopover = new sap.m.Popover("headEndItemsOverflow", {
                    placement: sap.m.PlacementType.Bottom,
                    showHeader: false,
                    showArrow: false,
                    content: {
                        path: "/currentState/headEndItems",
                        filters: [oFilter],
                        factory: function (sId, oContext) {
                            var oCtrl = sap.ui.getCore().byId(oContext.getObject()).clone(); // keep original items in the header
                            //we don't want to add the evnet listener more then once
                            oCtrl.detachPress(closePopover);
                            oCtrl.attachPress(closePopover);
                            return oCtrl;
                        }
                    }
                });
                oPopover.addStyleClass("sapUshellPopupContainer sapMPopoverheadEndItemsOverflow");
                oPopover.updateAggregation = this.getView().updateShellAggregation;
                oPopover.setModel(oModel);
                this.getView().aDanglingControls.push(oPopover);
            }
            if (oPopover.isOpen()) {
                oPopover.close();
            } else {
                oPopover.updateAggregation("content");
                oPopover.openBy(oEvent.getSource());
            }
        },

        externalSearchTriggered: function (sChannelId, sEventId, oData) {
            Config.emit("/core/shell/model/searchTerm", oData.searchTerm);
            oData.query = oData.searchTerm;
        },

        onAfterNavigate: function (oEvent) {
            var sToId = oEvent.mParameters? oEvent.mParameters.toId: undefined;
            this.closeLoadingScreen();

            utils.addTime("ShellController.onAfterNavigate");
            if (sToId === "application-" + oConfig.rootIntent) {
                var btnConfig = sap.ui.getCore().byId("configBtn");
                if (btnConfig) {
                    btnConfig.focus();
                }
            }
            AppLifeCycle.onAfterNavigate(oEvent.getParameter("fromId"), oEvent.getParameter("from"), sToId);
        },

        // 1 - remove appclosed hooks
        // 2 - logApplicationUsage to take resolved hash fragment

        logOpenAppAction: function (sFixedShellHash, oResolvedHashFragment, sAppPart) {
            var bEnableRecentActivity = Config.last("/core/shell/enableRecentActivity") && Config.last("/core/shell/enableRecentActivityLogging");
            if (!bEnableRecentActivity) {
                return;
            }

            var oRecentEntry = {};
            var oMetadata = AppConfiguration.getMetadata(oResolvedHashFragment);
            var sUrl = sFixedShellHash;
            if (sAppPart) {
                sUrl += sAppPart; //some application use inner routes, for example search.
            }

            oRecentEntry.title = oMetadata.title;
            oRecentEntry.appType = appType.APP; // default app type the shell adds is 'Application'
            oRecentEntry.url = sUrl;

            sap.ushell.Container.getServiceAsync("URLParsing").then(function (oURLParsing) {
                var oParsed = oURLParsing.parseShellHash(sFixedShellHash);

                if (oParsed) {
                    /*
                     * This is the key that determines whether an existing activity
                     * should be updated or added.
                     *
                     * In theory we could use the full hash without parameters
                     * here, however this causes the same application to be logged
                     * multiple times with the same title, confusing the user.
                     *
                     * Therefore we choose to update a previous entry in case just
                     * the parameters change. This might cause a bit of confusion
                     * in case another target mapping is opened, as the title of a
                     * previously logged entry would be updated instead of having
                     * a new title added to the recent activities (same target
                     * mapping but different title).
                     *
                     * Perhaps this could be further fixed by hashing a target
                     * mapping on the client before returning the resolution
                     * result, and using the hash as the id.
                     */
                    oRecentEntry.appId = "#" + oURLParsing.constructShellHash({
                        semanticObject: oParsed.semanticObject,
                        action: oParsed.action
                    });
                } else {
                    oRecentEntry.appId = sFixedShellHash;
                }

                // this is a special case for search - in case the intent opened was 'Action-search'
                // we know this is the search app and would set the appType accordingly
                if (sFixedShellHash.indexOf("#Action-search") >= 0) {
                    oRecentEntry.appType = appType.SEARCH;
                }

                if (Config.last("/core/shell/model/enableTrackingActivity")) {
                    setTimeout(function () {
                        this._logRecentActivity(oRecentEntry);
                    }.bind(this), 1500);
                }

                if (oConfig.enableTilesOpacity && Config.last("/core/shell/enableRecentActivity")) {
                    setTimeout(function () {
                        this._logApplicationUsage(sFixedShellHash);
                    }.bind(this), 1500);
                }

            }.bind(this));
        },

        openLoadingScreen: function () {
            //Performance Debug
            jQuery.sap.measure.start("FLP:ShellController.openLoadingScreen", "openLoadingScreen","FLP");
            if (this.oFiori2LoadingDialog){
                var sAnimationMode = Config.last("/core/shell/model/animationMode") || "full";
                this.oFiori2LoadingDialog.openLoadingScreen(sAnimationMode);
            }
            jQuery.sap.measure.end("FLP:ShellController.openLoadingScreen");
        },

        closeLoadingScreen: function () {
            if (this.oFiori2LoadingDialog) {
                this.oFiori2LoadingDialog.closeLoadingScreen();
            }
        },

        readNavigationEnd: function () {
            var oAccessibilityHelperLoadingComplete = document.getElementById("sapUshellLoadingAccessibilityHelper-loadingComplete");

            if (oAccessibilityHelperLoadingComplete) {
                oAccessibilityHelperLoadingComplete.setAttribute("aria-live","polite");
                oAccessibilityHelperLoadingComplete.innerHTML =  resources.i18n.getText("loadingComplete");
                setTimeout(function (){
                    oAccessibilityHelperLoadingComplete.setAttribute("aria-live","off");
                    oAccessibilityHelperLoadingComplete.innerHTML = "";
                },0);
            }
        },

        delayedCloseLoadingScreen: function () {
            setTimeout(function () {
                this.closeLoadingScreen();
            }.bind(this), 600);
        },

        togglePane: function (oEvent) {
            var oSource = oEvent.getSource(),
                bState = oSource.getSelected();

            sap.ui.getCore().getEventBus().publish("launchpad", "togglePane", { currentContent: Config.last("/core/shell/model/currentState/paneContent") });

            if (oEvent.getParameter("id") === "categoriesBtn") {
                oSource.getModel().setProperty("/currentState/showCurtainPane", !bState);
            } else {
                oSource.getModel().setProperty("/currentState/showPane", !bState);
            }
        },

        /*
         * Switch the view port state.
         * To be used in a scenario where clicking on some control invokes the view-port switch state.
         * Currently in the toggle-Me-Area and toggle-Notifications-view scenario.
         *
         * This method disabled the control during the view-port state switch animtaion, and only when animation
         * is finished enabled it back
         */
        _switchViewPortStateByControl: function (oOpenByControl, sState) {

            var bControlValid = false, oViewPortContainer = this.oViewPortContainer;

            if (oOpenByControl && oOpenByControl.setEnabled && typeof oOpenByControl.setEnabled === "function") {
                bControlValid = true;
            }

            // in case we can - set the control as disabled
            if (bControlValid) {
                oOpenByControl.addStyleClass("sapUshellShellHeadItemOverrideDisableStyle");
                oOpenByControl.setEnabled(false);
            }

            // CB function which enabled back the control
            function fAfterAnimationFinishedCB () {
                oOpenByControl.setEnabled(true);
                oOpenByControl.removeStyleClass("sapUshellShellHeadItemOverrideDisableStyle");
                // detach the callback
                oViewPortContainer.detachAfterSwitchStateAnimationFinished(fAfterAnimationFinishedCB);
            }

            // attach the CB for after animations finished
            if (bControlValid) {
                oViewPortContainer.attachAfterSwitchStateAnimationFinished(fAfterAnimationFinishedCB);
            }
            // call to switch state
            oViewPortContainer.switchState(sState);
        },

        onScreenSizeChange: function (oParams) {
            this.validateShowLogo(oParams);
            this.handleNavMenuTitleVisibility(oParams);
            this._handleHomeAndBackButtonsVisibility();
            this.handleEndItemsOverflow(oParams);
        },

        /*
         * Home button should be invisible (in the shell header) in case of navigating to the MeArea on smart phone,
         * or in MeArea on other media, when opening the MeArea from the dashboard
         */
        _handleHomeAndBackButtonsVisibility: function () {
            var isLsizeWidthDocking = jQuery("#mainShell").width() <1024 && jQuery(".sapUshellContainerDocked").length>0,
                bIsInCenterViewPort = Config.last("/core/shell/model/currentViewPortState") === "Center",
                deviceType = Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD).name,
                oHomeBtn = sap.ui.getCore().byId("homeBtn"),
                oBackBtn = sap.ui.getCore().byId("backBtn"),
                bHomeBtnVisible = deviceType === "Desktop",
                bBackBtnVisible = deviceType !== "Phone" || bIsInCenterViewPort;

            if (isLsizeWidthDocking) {
                if (oHomeBtn) {
                    bHomeBtnVisible = false;
                }
            }

            if (oHomeBtn) {
                oHomeBtn.setVisible(bHomeBtnVisible);
            }
            if (oBackBtn) {
                oBackBtn.setVisible(bBackBtnVisible);
            }
        },

        validateShowLogo: function (oParams) {
            var deviceType;
            var sCurrentState = Config.last("/core/shell/model/currentState/stateName");
            var bIsHeaderLessState = sCurrentState === 'merged' || sCurrentState === 'headerless';
            if (oParams) {
                deviceType = oParams.name;
            } else {
                deviceType = Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD).name;
            }
            var bShellLogoVisible = true;
            if (deviceType === "Phone" && !this.getMeAreaSelected() || bIsHeaderLessState) {
                bShellLogoVisible = false;
            }
            ///Last arg - bDoNotPropagate is truethy otherwise changes will redundantly apply also to other states (e.g. - headerless should always be presented without logo)
            oShellModel.updateStateProperty("showLogo", bShellLogoVisible, false, ["home", "app", "blank", "blank-home", "minimal", "lean"], true);
        },

        handleNavMenuTitleVisibility: function (oParams) {
            this.bNavMenuTitleVisible = false;

            if (oParams.name !== "Desktop") {
                this.bNavMenuTitleVisible = true;
            }
            oShellModel.updateStateProperty("application/showNavMenuTitle", this.bNavMenuTitleVisible, true);
        },

        /*
         * method used for navigation from items of the Shell-Application-Navigation-Menu.
         * this method makes sure the view-port is centered before triggering navigation
         * (as the notifications or me-area might be open, and in addition
         * fire an event to closes the popover which opens the navigation menu
         */
        navigateFromShellApplicationNavigationMenu: function (sIntent) {

            //if the target was not change, do nothing
            if (window.hasher.getHash() !== sIntent.substr(1)) {
                // we must make sure the view-port is centered before triggering navigation from shell-app-nav-menu
                this.oViewPortContainer.switchState("Center");

                // trigger the navigation
                window.hasher.setHash(sIntent);
            }

            // close the popover which holds the navigation menu
            var oShellAppTitle = sap.ui.getCore().byId("shellAppTitle");
            if (oShellAppTitle) {
                oShellAppTitle.close();
            }

        },

        //loadUserImage

        _loadCoreExtNonUI5: function (sSender, sEventName, oAppTarget) {
            if (oAppTarget && (oAppTarget.applicationType == "NWBC" || oAppTarget.applicationType == "TR")) {
                setTimeout(this._loadCoreExt.bind(this), 2000);
            }
        },
        _onRendererExtensionPluginsLoaded: function () {
            sap.ushell.Container.getServiceAsync("UsageAnalytics").then(function (oUsageAnalytics) {
                oUsageAnalytics.init(
                    resources.i18n.getText("usageAnalytics"),
                    resources.i18n.getText("i_agree"),
                    resources.i18n.getText("i_disagree"),
                    resources.i18n.getText("remind_me_later")
                );
            });
        },

        /**
         * RendererExtensions plugins are loaded after the core-ext modules.
         * core-ext is loaded, either in first application load flow in case app is not FLP
         * or explicitly by the Renderer (in this file) after FLP is loaded.
         * In any case, after we load the plugins, we also publish the event that all
         * Core resourses are loaded
         */
        _onCoreResourcesComplementLoaded: function () {

            // Create delayed controls in the view
            var oView = this.getView();
            if (oView) { // some qUnits do not create the view
                oView.createPostCoreExtControls();
            }

            // Load renderer extension plugins
            function createPlugins (oPluginManager) {
                var oViewData = this.getView() ? this.getView().getViewData() : {},
                    oConfig = oViewData.config || {},
                    bDelayPlugin = jQuery.sap.getUriParameters().get("sap-ushell-xx-pluginmode") === "delayed",
                    that = this;
                // ensure old Core Ext loaded Event is still EMITTED
                // in addition we have to ensure the new EventHub Event is thrown
                function fnPublishPostLoadingEvents () {
                    that._publishCoreExtLoadedEvent();
                    EventHub.emit("RendererExtensionPluginsLoaded");
                }
                // load the plugins and always publish post events
                function fnLoadPlugins () {
                    oPluginManager
                        .loadPlugins("RendererExtensions")
                        .always(fnPublishPostLoadingEvents);
                }

                // no initial shell setup configured, create invoke the default one.
                if (!oPluginManager.getRegisteredPlugins().RendererExtensions.init) {
                    oPluginManager.registerPlugins({
                        init: {
                            component: "sap.ushell.components.shell.defaults",
                            url: jQuery.sap.getResourcePath("sap/ushell/components/shell/defaults")
                        }
                    });
                }

                jQuery.sap.log.info("Triggering load of 'RendererExtension' plug-ins after loading core-ext module",
                    null, "sap.ushell.renderers.fiori2.Shell");

                if (!oConfig.inHeaderLessOpt) {
                    if (bDelayPlugin) {
                        // delay loading by 5 sec.
                        setTimeout(fnLoadPlugins, 5000);
                    } else {
                        fnLoadPlugins();
                    }
                } else {
                    fnPublishPostLoadingEvents();
                }
            }
            sap.ushell.Container.getServiceAsync("PluginManager").then(createPlugins.bind(this));
        },

        /**
         * Triggers loading of the warmup plugins via Plugin Manager
         */
        _loadWarmupPlugins: function () {
            sap.ushell.Container.getService("PluginManager").loadPlugins("AppWarmup")
            .always( function () {
                jQuery.sap.log.debug("WARMUP plugins loaded", null, "sap.ushell.renderers.fiori2.Shell");
            });
        },
        /**
         * Triggers loading of CoreExt via EventHub
         */

        _loadCoreExt: function () {
            jQuery.sap.measure.end("FLP:Container.InitLoading");
            //
            // Trigger oEventHub.once("loadCoreResourcesComplement") in case
            // homepage is first rendered. Usually this is done with
            // resolveHashFragment, but without passing from that path we
            // should trigger it actively.
            //
            sap.ushell.Container.getServiceAsync("Ui5ComponentLoader").then(function () {
                EventHub.emit("loadCoreResourcesComplement");
            });
        },
        /**
         * Legacy - has to be replaced going forward
         * Still a dependency to Lifecycle.js that is renaming the events for
         * even more legacy....
         */
        _publishCoreExtLoadedEvent: function () {
            setTimeout(function () {
                sap.ui.getCore().getEventBus().publish("shell", "FLP-FMP");
            },3000);
        },

        getCurrentViewportState: function () {
            return Config.last("/core/shell/model/currentViewPortState");
        },

        makeEndUserFeedbackAnonymousByDefault: function (bEndUserFeedbackAnonymousByDefault) {
            this.oEndUserFeedbackConfiguration.anonymousByDefault = bEndUserFeedbackAnonymousByDefault;
        },

        showEndUserFeedbackLegalAgreement: function (bShowEndUserFeedbackLegalAgreement) {
            this.oEndUserFeedbackConfiguration.showLegalAgreement = bShowEndUserFeedbackLegalAgreement;
        },

        _activateFloatingUIActions: function (iWindowWidth) {
            if (iWindowWidth < 417) {
                this.oFloatingUIActions.disable();
            } else {
                this.oFloatingUIActions.enable();
            }
        },

        setFloatingContainerDragSelector: function (sElementToCaptureSelector) {

            jQuery(sElementToCaptureSelector).addClass("sapUshellShellFloatingContainerSelector");

            //Fix for internal incident #1770519876 2017 - Avoiding crash of CoPilot after deleting an instance and using a property (in UIAction) of the deleted one
            sap.ui.require(["sap/ushell/UIActions"], function (UIActions) {
                if (!this.oFloatingUIActions) {
                    this.oFloatingUIActions = new sap.ushell.UIActions({
                        containerSelector: ".sapUiBody",
                        wrapperSelector: '.sapUshellShellFloatingContainerWrapper',
                        draggableSelector: '.sapUshellShellFloatingContainerWrapper',//the element that we drag
                        rootSelector: ".sapUiBody",
                        cloneClass: "sapUshellFloatingContainer-clone",
                        dragCallback: this._handleFloatingContainerUIStart.bind(this), //for hide the original item while dragging
                        endCallback: this._handleFloatingContainerDrop.bind(this),
                        moveTolerance: 3,
                        onDragStartUIHandler:this._onDragStartUI.bind(this),
                        onDragEndUIHandler: this._setFloatingContainerHeight.bind(this),
                        dragAndScrollCallback: this._doDock.bind(this),
                        switchModeDelay: 1000,
                        isLayoutEngine: false,
                        isTouch: false,//that.isTouch,
                        elementToCapture: sElementToCaptureSelector,
                        defaultMouseMoveHandler: function () {},
                        debug: jQuery.sap.debug()
                    });
                } else {
                    this.oFloatingUIActions.elementsToCapture = jQuery(sElementToCaptureSelector);
                }

                this._activateFloatingUIActions(jQuery(window).width());
                var timer;
                jQuery(window).bind("resize", function () {
                    clearTimeout(timer);
                    timer = setTimeout(this._activateFloatingUIActions(jQuery(window).width()), 300);
                }.bind(this));
            }.bind(this));
        },


        /**
         * This function called once start to drag the co-pilot element
         * It checks whether it reach 64px(4rem) to the right/left in order to open the docking area
         * Also it checks whether to close the docking area
         * @param {object} oCfg configuration parameters
         * @private
         */
        _doDock: function (oCfg) {
            jQuery.sap.measure.start("FLP:Shell.controller._doDock", "dragging co-pilot element","FLP");
            // open dock option only if config is enable and screen size is L(desktop + tablet landsacpe)
            var oDevice = Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD);
            if (oDevice.name === "Desktop") {
                var iWinWidth = jQuery(window).width();
                if (oCfg) {
                    oCfg.docked = {};
                    var oDockedProp = oCfg.docked;
                    //cfg.moveX get FloatingContainer courser x position.
                    // handle for opening the docking area for right and left
                    // in case that docking area open - close it
                    // in case canvas moved (because the docking ) close it
                    if (oCfg.moveX >= iWinWidth - 64) {
                        oDockedProp.dockPos = "right";
                        oDockedProp.setIsDockingAreaOpen = true;
                        this._openDockingArea(oCfg);
                    } else if (oCfg.moveX < 64) {
                        oDockedProp.dockPos = "left";
                        oDockedProp.setIsDockingAreaOpen = true;
                        this._openDockingArea(oCfg);
                    } else {
                        if (this._isDockingAreaOpen()) {
                            this._closeDockingArea(oCfg);
                        }
                        if (jQuery("#canvas").hasClass('sapUshellContainerDocked')) {
                            this._handleCloseCanvas(oCfg);
                        }
                    }
                }
            }
            jQuery.sap.measure.end("FLP:Shell.controller._doDock");
        },

        /**
         * This method handle the finish (after drop) for the docking
         * @param {object} oDockedProp properties object
         * @private
         */
        _finishDoDock:function (oDockedProp) {
            this._openDockingArea(false);
            // save the last state of the copilot
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local, "com.sap.ushell.adapters.local.CopilotLastState");
            oStorage.put("lastState" , "docked:"+oDockedProp.dockPos);
            this._handleOpenCanvas(oDockedProp);
            var oWrapperElement = jQuery('#sapUshellFloatingContainerWrapper');
            oWrapperElement.css("height","100%");
            jQuery("#shell-floatingContainer").addClass("sapUshellShellFloatingContainerFullHeight");
            //New event for co-pilot is docked.
            sap.ui.getCore().getEventBus().publish("launchpad", "shellFloatingContainerIsDocked", oDockedProp.dockPos);
            //handle ApplicationContainerLimitedWidth with docking
            if (jQuery(".sapUShellApplicationContainerLimitedWidth").length > 0) {
                jQuery('#application-Action-toappnavsample').removeClass("sapUShellApplicationContainerLimitedWidth");
                jQuery('#application-Action-toappnavsample').addClass("sapUShellDockingContainer");
            }

        },


        _onResizeWithDocking: function () {
            //Docking is similar to screen change
            this.onScreenSizeChange(Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD));
            //handle appFinder size changed
            //timeOut waiting for resize event is finish
            setTimeout(function () {
                sap.ui.getCore().getEventBus().publish("launchpad", "appFinderWithDocking");
            }, 300);
        },

        /**
         * This function happens when start to drag
         * In this case if we docked we need to remove animations and close canvas
         * @param {object} oCfg configuration object
         * @private
         */
        _onDragStartUI:function (oCfg) {
            jQuery.sap.measure.start("FLP:Shell.controller._onDragStartUI", "start drag","FLP");
            if (this._isDock()) {
                // save the last state of the copilot
                var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local, "com.sap.ushell.adapters.local.CopilotLastState");
                oStorage.put("lastState", "floating");
                jQuery("#sapUshellFloatingContainerWrapper").removeClass('sapUshellContainerDocked');
                jQuery(".sapUshellShellFloatingContainerFullHeight").removeClass("sapUshellShellFloatingContainerFullHeight");
                //New event for co-pilot is unDock
                sap.ui.getCore().getEventBus().publish("launchpad", "shellFloatingContainerIsUnDocked" );
                jQuery("#sapUshellFloatingContainerWrapper").removeClass("sapUshellContainerDockedMinimizeCoPilot sapUshellContainerDockedExtendCoPilot");
                jQuery("#sapUshellFloatingContainerWrapper").addClass('sapUshellContainerDockedMinimizeCoPilot');
                jQuery(jQuery(".sapUshellContainerDockedMinimizeCoPilot")).on('webkitAnimationEnd oanimationend msAnimationEnd animationend',this._handleAnimations(false));
                this._handleCloseCanvas(oCfg);
            }
            jQuery.sap.measure.end("FLP:Shell.controller._onDragStartUI");
        },

        /**
         * This function handle the adding animations whnen dock/undock
         * @param {boolean} bIsDock set docked
         * @param {string} sDockingPosition docking position
         * @private
         */
        _handleAnimations: function (bIsDock, sDockingPosition) {
            var sClassName = "sapUshellContainerDockedLaunchpad";
            var oCanvasElement = jQuery('#canvas');
            var oWrapperElement = jQuery('#sapUshellFloatingContainerWrapper');
            function setClass (className, bToggle) {
                jQuery(sClassName).toggleClass(className, bToggle);
            }
            if (bIsDock) {
                jQuery('#canvas,#shell-header').addClass(sClassName); // The header is outside of the canvas
                if (oCanvasElement.hasClass('sapUshellContainer-Narrow-Right') || sDockingPosition == "right") {
                    setClass("closeRight", true);
                } else {
                    setClass("closeLeft", true);
                }

                oWrapperElement.addClass("sapUshellContainerDockedExtendCoPilot");
                setTimeout(function () {
                    if (oCanvasElement.hasClass('sapUshellContainer-Narrow-Right') || sDockingPosition == "right") {
                        setClass("closeRight", false);
                        setClass("openRight", true);
                    } else if (oCanvasElement.hasClass('sapUshellContainer-Narrow-Left') || sDockingPosition == "left") {
                        setClass("closeLeft", false);
                        setClass("openLeft", true);
                    }
                },300);
                this._onResizeWithDocking();
            } else {
                jQuery("#sapUshellFloatingContainerWrapper").addClass("sapUshellContainerDockedExtendCoPilot");
                if (oCanvasElement.hasClass('sapUshellContainer-Narrow-Right') || sDockingPosition == "right") {
                    setClass("openRight", false);
                } else {
                    setClass("openLeft", false);
                }
                setTimeout(function () {
                    jQuery(sClassName).removeClass(sClassName + " closeLeft openLeft closeRight openRight");
                }, 550);
            }
            var oShellHeader = sap.ui.getCore().byId('shell-header');
            oShellHeader._handleResizeChange();
        },

        /**
         * This function opens docking area for copilot
         * @param {object} oCfg configuration object
         * @private
         */
        _openDockingArea:function (oCfg) {
            var oDockProperties = oCfg?oCfg.docked:false;
            var bIsDock = oDockProperties?oDockProperties.setIsDockingAreaOpen:false;
            // check if need to open docking area and it doesn't exist already
            if (bIsDock && jQuery("#DockinaAreaDiv").length  == 0) {
                var bIsRTL = sap.ui.getCore().getConfiguration().getRTL();
                if ((oDockProperties.dockPos ==="right" && oCfg.clone && !bIsRTL) || (oDockProperties.dockPos === "left" && oCfg.clone && bIsRTL)) {
                    jQuery('<div id="DockinaAreaDiv"  class="sapUshellShellDisplayDockingAreaRight">').appendTo(oCfg.clone.parentElement);
                } else if ((oDockProperties.dockPos === "left" && oCfg.clone && !bIsRTL) || (oDockProperties.dockPos ==="right" && oCfg.clone && bIsRTL)) {
                    jQuery('<div id="DockinaAreaDiv"  class="sapUshellShellDisplayDockingAreaLeft">').appendTo(oCfg.clone.parentElement);
                }
                oCfg.clone.oDockedProp = {};
                oCfg.clone.oDockedProp.dockPos = oDockProperties.dockPos;
                // After drop the copilot - docking area should disappear
            } else if (!bIsDock) {
                this._closeDockingArea();
            }
        },

        /**
         * This function close docking area for copilot
         * @param {object} oCfg configuration object
         * @private
         */
        _closeDockingArea:function (oCfg) {
            setTimeout(
                function (){
                    jQuery('.sapUshellShellDisplayDockingAreaRight').remove();
                    jQuery('.sapUshellShellDisplayDockingAreaLeft').remove();
                }, 150);
            var oShellHeader = sap.ui.getCore().byId('shell-header');
            if (oShellHeader) {
                oShellHeader._handleResizeChange();
            }
        },

        /**
         * @returns {boolean} True if co-pilot is docked. Otherwise false.
         * @private
         */
        _isDock : function (){
            return jQuery('.sapUshellContainerDocked').size() !== 0;
        },

        /**
         * * This function return whethere the docking area open or not
         * @returns {boolean} if the docker area is opened
         * @private
         */
        _isDockingAreaOpen : function (){
            return jQuery('.sapUshellShellDisplayDockingAreaRight').size() !== 0 || jQuery('.sapUshellShellDisplayDockingAreaLeft').size() !== 0;
        },

        /**
         * This function open the canvas so there will be place for the docking area
         * @param {object} oDockedProp dock properties object
         * @private
         */
        _handleOpenCanvas:function (oDockedProp) {
            var oCanvasElement = jQuery('#canvas');
            var oHeaderElement = jQuery('.sapUshellShellHead');
            var bIsRTL = sap.ui.getCore().getConfiguration().getRTL();
            if ((oDockedProp.dockPos==="right" && !bIsRTL)|| (oDockedProp.dockPos==="left" && bIsRTL)) {
                oCanvasElement.addClass('sapUshellContainer-Narrow-Right sapUshellContainerDocked ');
                oHeaderElement.addClass('sapUshellContainerDocked');
            }
            if ((oDockedProp.dockPos==="left" && !bIsRTL)|| (oDockedProp.dockPos==="right" && bIsRTL)) {
                oCanvasElement.addClass('sapUshellContainer-Narrow-Left sapUshellContainerDocked ');
                oHeaderElement.addClass('sapUshellContainerDocked');
            }
            var oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
            if (oViewPortContainer) {
                oViewPortContainer._handleSizeChange();
            }
        },

        /**
         * Close the canvas after docking area disappear
         * @param {object} oCfg configuration object
         * @private
         */
        _handleCloseCanvas:function (oCfg) {
            var oCanvasElement = jQuery('#canvas');
            var oHeaderElement = jQuery('.sapUshellShellHead');
            if (oCfg) {
                oCfg.docked.setIsDockingAreaOpen  = false;
            }
            if (oCanvasElement.hasClass('sapUshellContainer-Narrow-Right')) {
                oCanvasElement.removeClass('sapUshellContainer-Narrow-Right sapUshellContainerDocked sapUshellMoveCanvasRight');
                oHeaderElement.removeClass('sapUshellContainerDocked');
                this._openDockingArea(oCfg);
                this._setFloatingContainerHeight();
            }
            if (oCanvasElement.hasClass('sapUshellContainer-Narrow-Left')) {
                oCanvasElement.removeClass('sapUshellContainer-Narrow-Left sapUshellContainerDocked sapUshellMoveCanvasLeft');
                oHeaderElement.removeClass('sapUshellContainerDocked');
                this._openDockingArea(oCfg);
                this._setFloatingContainerHeight();
            }
            //handle ApplicationContainerLimitedWidth with docking
            if (jQuery(".sapUShellDockingContainer").length > 0 ) {
                jQuery('#application-Action-toappnavsample').removeClass("sapUShellDockingContainer");
                jQuery('#application-Action-toappnavsample').addClass("sapUShellApplicationContainerLimitedWidth");
            }
            this._onResizeWithDocking();
            var oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
            if (oViewPortContainer) {
                oViewPortContainer._handleSizeChange();
            }
        },

        /**
         * Handle the height of the copilot + add animations for ir
         * @param {object} oEvent event object
         * @private
         */
        _setFloatingContainerHeight:function (oEvent) {
            // if movement X && Y is 0 its means there is no dragw was made only click
            var iWinWidth = jQuery(window).width();

            var oWrapperElement = jQuery('#sapUshellFloatingContainerWrapper');
            if (this._isDock() ){
                if (oEvent &&(oEvent.clientX >= iWinWidth-64 || oEvent.clientX < 64)) { // if less then 64 its just a click - no need to animate
                    oWrapperElement.addClass(' sapUshellContainerDocked');
                    oWrapperElement.addClass("sapUshellContainerDockedMinimizeCoPilot");
                    jQuery(oWrapperElement).on('webkitAnimationEnd oanimationend msAnimationEnd animationend',this._handleAnimations(true));
                }
            } else if (!this._isDock()) {
                jQuery("#sapUshellFloatingContainerWrapper").removeClass("sapUshellContainerDockedMinimizeCoPilot sapUshellContainerDockedExtendCoPilot");
            }

        },


        _handleFloatingContainerDrop: function (oEvent, floatingContainerWrapper, oDelta) {
            jQuery.sap.measure.start("FLP:Shell.controller._handleFloatingContainerDrop", "drop floating container","FLP");
            var oFloatingContainer = floatingContainerWrapper.firstChild ? sap.ui.getCore().byId(floatingContainerWrapper.firstChild.id) : undefined,
                storage = jQuery.sap.storage(jQuery.sap.storage.Type.local, "com.sap.ushell.adapters.local.FloatingContainer"),
                iWindowWidth = jQuery(window).width(),
                iWindowHeight = jQuery(window).height(),
                iPosLeft = oDelta.deltaX / iWindowWidth,
                iPosTop = oDelta.deltaY / iWindowHeight,
                sOrigContainerVisibility = floatingContainerWrapper.style.visibility,
                sOrigContainerDisplay = floatingContainerWrapper.style.display,
                iContainerLeft = parseFloat(floatingContainerWrapper.style.left.replace("%", "")),
                iContainerTop = parseFloat(floatingContainerWrapper.style.top.replace("%", ""));

            floatingContainerWrapper.style.visibility = 'hidden';
            floatingContainerWrapper.style.display = 'block';

            if (typeof (iContainerLeft) === 'number') {
                iPosLeft = iContainerLeft + 100 * oDelta.deltaX / iWindowWidth;
            }

            if (typeof (iContainerTop) === 'number') {
                iPosTop = iContainerTop + 100 * oDelta.deltaY / iWindowHeight;
            }

            // when docking area  is open - means the copilot should be on top of the screen
            if (this._isDockingAreaOpen()) {
                iPosTop = 0;
            }

            floatingContainerWrapper.setAttribute("style", "left:" + iPosLeft + "%;top:" + iPosTop + "%;position:absolute;");
            floatingContainerWrapper.visibility = sOrigContainerVisibility;
            floatingContainerWrapper.display = sOrigContainerDisplay;
            storage.put("floatingContainerStyle", floatingContainerWrapper.getAttribute("style"));
            //Call resizeHandler to adjust the size and position of the floating container in case it was droped out of the window size boundries.
            if (oFloatingContainer) {
                oFloatingContainer.handleDrop();
                // when docking area is open and the copilot drop inside - should handle it
                if (!!oDelta.clone.oDockedProp && this._isDockingAreaOpen()) {
                    this._finishDoDock(oDelta.clone.oDockedProp);
                }
            }
            jQuery.sap.measure.end("FLP:Shell.controller.handleFloatingContainerDrop");
        },

        /*
         * This function called after co-pilot start to be dragged
         */
        _handleFloatingContainerUIStart: function (evt, ui) {
            jQuery.sap.measure.start("FLP:Shell.controller._handleFloatingContainerUIStart", "starts dragging floating container","FLP");
            var floatingContainer = ui;
            floatingContainer.style.display = "none";
            if (window.getSelection) {
                var selection = window.getSelection();
                // for IE
                try {
                    selection.removeAllRanges();
                } catch (e) {
                    // continue regardless of error
                }
            }
            jQuery.sap.measure.end("FLP:Shell.controller._handleFloatingContainerUIStart");
        },

        /*
         * This function open local storage and return the docked state:  docked or floating
         */
        getFloatingContainerState : function (){
            var oStorage = jQuery.sap.storage(jQuery.sap.storage.Type.local, "com.sap.ushell.adapters.local.CopilotLastState");
            var sLastState = "floating";
            if (oStorage != null) {
                sLastState = oStorage.get("lastState");
                if (sLastState == null) {
                    sLastState = "floating";
                }
            }
            return sLastState;
        },

        setFloatingContainerVisibility: function (bVisible) {
            var sLastState = this.getFloatingContainerState();
            if (sLastState) {
                if (sLastState == "floating") {
                    this.getView().getOUnifiedShell().setFloatingContainerVisible(bVisible);
                } else if (sLastState.indexOf("docked") != -1) {
                    var oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
                    if (bVisible == true) {
                        var sDevice = Device.media.getCurrentRange(Device.media.RANGESETS.SAP_STANDARD);
                        if (sDevice.name =="Desktop") {
                            var oWrapperElement = jQuery('#sapUshellFloatingContainerWrapper');
                            oWrapperElement.addClass("sapUshellContainerDocked");
                            jQuery("#canvas, .sapUshellShellHead").addClass("sapUshellContainerDocked");
                            oWrapperElement.css("height","100%");
                            sap.ui.getCore().byId("shell-floatingContainer").addStyleClass("sapUshellShellFloatingContainerFullHeight");
                            if (oViewPortContainer) {
                                oViewPortContainer._handleSizeChange();
                            }

                            // case : dock from button
                            if (sap.ui.getCore().getConfiguration().getRTL()) {
                                if (sLastState.indexOf("right") != -1) {
                                    jQuery("#canvas").addClass('sapUshellContainer-Narrow-Left');
                                    this._handleAnimations(true,"left");
                                } else {
                                    jQuery("#canvas").addClass('sapUshellContainer-Narrow-Right');
                                    this._handleAnimations(true,"right");
                                }
                            } else if (sLastState.indexOf("right") != -1) {
                                jQuery("#canvas").addClass('sapUshellContainer-Narrow-Right');
                                this._handleAnimations(true,"right");
                            } else {
                                jQuery("#canvas").addClass('sapUshellContainer-Narrow-Left');
                                this._handleAnimations(true,"left");
                            }
                            setTimeout(function () {
                                this.getView().getOUnifiedShell().setFloatingContainerVisible(bVisible);
                            }.bind(this),400);
                        } else {
                            jQuery.sap.storage(jQuery.sap.storage.Type.local, "com.sap.ushell.adapters.local.CopilotLastState").put("lastState", "floating");
                            this.getView().getOUnifiedShell().setFloatingContainerVisible(bVisible);
                        }

                        //handle ApplicationContainerLimitedWidth with docking
                        if (jQuery(".sapUShellApplicationContainerLimitedWidth").length > 0 ) {
                            jQuery('#application-Action-toappnavsample').removeClass("sapUShellApplicationContainerLimitedWidth");
                            jQuery('#application-Action-toappnavsample').addClass("sapUShellDockingContainer");
                        }

                    } else {
                        // case : undock from button
                        if (sap.ui.getCore().getConfiguration().getRTL()) {
                            if (sLastState.indexOf("right") != -1) {
                                this._handleAnimations(false,"left");
                            } else {
                                this._handleAnimations(false,"right");
                            }
                        } else if (sLastState.indexOf("right") != -1) {
                            this._handleAnimations(false,"right");
                        } else {
                            this._handleAnimations(false,"left");
                        }
                        if (oViewPortContainer) {
                            oViewPortContainer._handleSizeChange();
                        }
                        setTimeout(function () {
                            this.getView().getOUnifiedShell().setFloatingContainerVisible(bVisible);
                        }.bind(this),400);
                        //handle ApplicationContainerLimitedWidth with docking
                        if (jQuery(".sapUShellDockingContainer").length > 0 ) {
                            jQuery('#application-Action-toappnavsample').removeClass("sapUShellDockingContainer");
                            jQuery('#application-Action-toappnavsample').addClass("sapUShellApplicationContainerLimitedWidth");
                        }
                    }
                    jQuery("#sapUshellFloatingContainerWrapper").removeClass("sapUshellContainerDockedMinimizeCoPilot sapUshellContainerDockedExtendCoPilot");
                    this._onResizeWithDocking();
                    if (oViewPortContainer) {
                        oViewPortContainer._handleSizeChange();
                    }
                }
            }
        },

        getFloatingContainerVisibility: function () {
            return this.getView().getOUnifiedShell().getFloatingContainerVisible();
        },

        setFloatingContainerContent: function (sPropertyString, aIds, bCurrentState, aStates) {
            oShellModel.setFloatingContainerContent(sPropertyString, aIds, bCurrentState, aStates);
        },

        getRightFloatingContainerVisibility: function () {
            var oRightFloatingContainer = this.getView().getOUnifiedShell().getRightFloatingContainer(),
                bRightFloatingContainerVisible = oRightFloatingContainer && oRightFloatingContainer.getVisible();

            return bRightFloatingContainerVisible;
        },

        setHeaderTitle: function (sTitle, oInnerControl) {
            if (typeof sTitle !== "string") {
                throw new Error("sTitle type is invalid");
            }

            this.getView().getOUnifiedShell().getHeader().setTitleControl(sTitle, oInnerControl);
        },

        addEndUserFeedbackCustomUI: function (oCustomUIContent, bShowCustomUIContent) {
            if (oCustomUIContent) {
                this.oEndUserFeedbackConfiguration.customUIContent = oCustomUIContent;
            }
            if (bShowCustomUIContent === false) {
                this.oEndUserFeedbackConfiguration.showCustomUIContent = bShowCustomUIContent;
            }
        },

        setFooter: function (oFooter) {
            var oShellLayout = this.getView().getOUnifiedShell();
            if (typeof oFooter !== "object" || !oFooter.getId) {
                throw new Error("oFooter value is invalid");
            }
            if (oShellLayout.getFooter() !== null) { //there can be only 1 footer
                jQuery.sap.log.warning("You can only set one footer. Replacing existing footer: " + oShellLayout.getFooter().getId() + ", with the new footer: " + oFooter.getId() + ".");
            }
            oShellLayout.setFooter(oFooter);
        },

        removeFooter: function () {
            this.getView().getOUnifiedShell().setFooter(null);
        },

        addUserPreferencesEntry: function (entryObject) {
            this._validateUserPrefEntryConfiguration(entryObject);
            this._updateUserPrefModel(entryObject);
        },

        addUserProfilingEntry: function (entryObject) {
            this._validateUserPrefEntryConfiguration(entryObject);
            this._updateProfilingModel(entryObject);
        },

        _validateUserPrefEntryConfiguration: function (entryObject) {
            if ((!entryObject) || (typeof entryObject !== "object")) {
                throw new Error("object oConfig was not provided");
            }
            if (!entryObject.title) {
                throw new Error("title was not provided");
            }

            if (!entryObject.value) {
                throw new Error("value was not provided");
            }

            if (typeof entryObject.entryHelpID !== "undefined") {
                if (typeof entryObject.entryHelpID !== "string") {
                    throw new Error("entryHelpID type is invalid");
                } else if (entryObject.entryHelpID === "") {
                    throw new Error("entryHelpID type is invalid");
                }
                var oShellHeader = sap.ui.getCore().byId('shell-header');
                oShellHeader._handleResizeChange();
            }

            if (entryObject.title && typeof entryObject.title !== "string") {
                throw new Error("title type is invalid");
            }

            if (typeof entryObject.value !== "function" && typeof entryObject.value !== "string" && typeof entryObject.value !== "number") {
                throw new Error("value type is invalid");
            }

            if (entryObject.onSave && typeof entryObject.onSave !== "function") {
                throw new Error("onSave type is invalid");
            }

            if (entryObject.content && typeof entryObject.content !== "function") {
                throw new Error("content type is invalid");
            }

            if (entryObject.onCancel && typeof entryObject.onCancel !== "function") {
                throw new Error("onCancel type is invalid");
            }
        },

        _createSessionHandler: function (oConfig) {
            var that = this;

            sap.ui.require(["sap/ushell/SessionHandler"], function (SessionHandler) {
                that.oSessionHandler = new SessionHandler();
                that.oSessionHandler.init({
                    oModel: that.getModel(),
                    keepSessionAlivePopupText: oConfig.keepSessionAlivePopupText,
                    pageReloadPopupText: oConfig.pageReloadPopupText,
                    preloadLibrariesForRootIntent: oConfig.preloadLibrariesForRootIntent,
                    sessionTimeoutReminderInMinutes : oConfig.sessionTimeoutReminderInMinutes ,
                    sessionTimeoutIntervalInMinutes: oConfig.sessionTimeoutIntervalInMinutes,
                    enableAutomaticSignout : oConfig.enableAutomaticSignout
                });
            });
        },

        _getSessionHandler: function () {
            return this.oSessionHandler;
        },

        _navBack: function () {
            // set meAria as closed when navigating back
            this.setMeAreaSelected(false);
            AppLifeCycle.service().navigateBack();
        },

        _updateUserPrefModel: function (entryObject) {
            var newEntry = this._getModelEntryFromEntryObject(entryObject),
                userPreferencesEntryArray = Config.last("/core/shell/model/userPreferences/entries");

            userPreferencesEntryArray.push(newEntry);
            // Re-order the entries array to have the Home Page entry right after the Appearance entry (if both exist)
            userPreferencesEntryArray = this._reorderUserPrefEntries(userPreferencesEntryArray);
            oModel.setProperty("/userPreferences/entries", userPreferencesEntryArray);
        },

        _updateProfilingModel: function (entryObject) {
            var newEntry = this._getModelEntryFromEntryObject(entryObject),
                userProfilingArray = Config.last("/core/shell/model/userPreferences/profiling") || [];

            userProfilingArray.push(newEntry);
            oModel.setProperty("/userPreferences/profiling", userProfilingArray);
        },

        _getModelEntryFromEntryObject: function (entryObject) {
            return {
                "entryHelpID": entryObject.entryHelpID,
                "title": entryObject.title,
                "editable": entryObject.content ? true : false,
                "valueArgument": entryObject.value,
                "valueResult": null,
                "onSave": entryObject.onSave,
                "onCancel": entryObject.onCancel,
                "contentFunc": entryObject.content,
                "contentResult": null,
                "icon": entryObject.icon
            };
        },

        _reorderUserPrefEntries: function (aEntries) {
            var flpSettingsEntryIndex,
                themesEntryIndex;
            // Go through all entries to find the Home Page and the Appearance entries
            for (var i = 0; i < aEntries.length; i++) {
                if (aEntries[i].entryHelpID === "flpSettingsEntry") {
                    flpSettingsEntryIndex = i;
                } else if (aEntries[i].entryHelpID === "themes") {
                    themesEntryIndex = i;
                }
                // Only if both were found perform the change
                if (flpSettingsEntryIndex != undefined && themesEntryIndex != undefined) {
                    // Remove the flp setting (Home Page) entry from the array
                    // The flp settings entry is always located after the themes entry in the array
                    // so even after removing it, the themes entry index is still correct
                    var flpSettingsEntry = aEntries.splice(flpSettingsEntryIndex, 1);
                    // Add it back right after the themes (Appearance) entry
                    aEntries.splice(themesEntryIndex + 1, 0, flpSettingsEntry[0]);
                    break;
                }
            }
            return aEntries;
        },

        onAfterViewPortSwitchState: function (oEvent) {
            var toState = oEvent.getParameter("to");
            var oShellAppTitle = sap.ui.getCore().byId("shellAppTitle");
            oModel.setProperty("/currentViewPortState", toState);
            if (this.applicationKeyHandler) {
                AccessKeysHandler.registerAppKeysHandler(this.applicationKeyHandler);
                this.applicationKeyHandler = undefined;
            }
            //Propagate the event 'afterSwitchState' for launchpad consumers.
            sap.ui.getCore().getEventBus().publish("launchpad", "afterSwitchState", oEvent);
            if (toState === "Center") {
                oShellAppTitle.setVisible(true);
            } else {
                oShellAppTitle.setVisible(false);
                if (toState == "RightCenter") {
                    this.applicationKeyHandler = AccessKeysHandler.getAppKeysHandler();
                    AccessKeysHandler.bFocusOnShell = false;
                    if (sap.ui.getCore().byId("notificationsView")){
                        AccessKeysHandler.registerAppKeysHandler(sap.ui.getCore().byId("notificationsView").getController().keydownHandler.bind(sap.ui.getCore().byId("notificationsView")));
                    }
                }
            }
            this.validateShowLogo();
            this._handleHomeAndBackButtonsVisibility();
        },
        getModel: function () {
            return oModel;
        },

        _getConfig: function () {
            return oConfig ? oConfig : {};
        },

        _getPersData: function (oPersId) {
            var oComponent = sap.ui.core.Component.getOwnerComponentFor(this.getView());
            return new Promise(function (resolve, reject) {
                sap.ushell.Container.getServiceAsync("Personalization").then(function (oPersonalizationService) {
                    var oScope = {
                        keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                        writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                        clientStorageAllowed: true
                    };
                    var oPersonalizer = oPersonalizationService.getPersonalizer(oPersId, oScope, oComponent);
                    oPersonalizer.getPersData()
                        .then(resolve)
                        .fail(reject);
                });
            });
        },

        // encapsulate access to location so that we can stub it easly in tests
        _getCurrentLocationHash: function () {
            return window.location.hash;
        },

        setMeAreaSelected: function (bSelected){
            EventHub.emit('showMeArea', bSelected);
        },

        getMeAreaSelected: function (){
            return Config.last("/core/shell/model/currentViewPortState") === "LeftCenter";
        },

        setNotificationsSelected: function (bSelected){
            EventHub.emit('showNotifications', bSelected);
        },

        getNotificationsSelected: function (){
            return Config.last("/core/shell/model/currentViewPortState") === 'RightCenter';
        },

        isAnimationModeNotMinimal: function (sAnimationMode) {
            return sAnimationMode !== 'minimal';
        }
    });


}, /* bExport= */ false);
