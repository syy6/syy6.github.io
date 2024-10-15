// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    'sap/ui/core/IconPool',
    'sap/ui/Device',
    'sap/ui/core/CustomData',
    'sap/ui/core/theming/Parameters',
    'sap/ui/core/HTML',
    'sap/ushell/UserActivityLog',
    // './Navigation',
    'sap/ushell/ui/launchpad/ActionItem',
    'sap/ushell/ui/launchpad/Fiori2LoadingDialog',
    'sap/ushell/ui/shell/ShellHeadItem',
    'sap/ushell/ui/shell/ShellNavigationMenu',
    'sap/ushell/ui/shell/ToolArea',
    'sap/ushell/ui/shell/NavigationMiniTile',
    'sap/ushell/ui/footerbar/ContactSupportButton',
    'sap/ushell/ui/launchpad/AccessibilityCustomData',
    'sap/ushell/renderers/fiori2/AccessKeysHandler',
    'sap/m/StandardListItem',
    'sap/m/Button',
    'sap/m/Dialog',
    'sap/ushell/resources',
    'sap/ushell/utils',
    'sap/ushell/Config',
    'sap/ushell/EventHub'
], function (
    IconPool,
    Device,
    CustomData,
    ThemingParameters,
    HTML,
    UserActivityLog,
    // Navigation,
    ActionItem,
    Fiori2LoadingDialog,
    ShellHeadItem,
    ShellNavigationMenu,
    ToolArea,
    NavigationMiniTile,
    ContactSupportButton,
    AccessibilityCustomData,
    AccessKeysHandler,
    StandardListItem,
    Button,
    Dialog,
    resources,
    utils,
    Config,
    EventHub
) {
    "use strict";

    /*global jQuery, sap, location, window, clearTimeout, setTimeout */
    function fnShellUpdateAggItem (sId, oContext) {
        return sap.ui.getCore().byId(oContext.getObject());
    }


    sap.ui.jsview("sap.ushell.renderers.fiori2.Shell", {
        /**
         * Most of the following code acts just as placeholder for new Unified Shell Control.
         *
         * @param oController
         * @returns {sap.ushell.ui.Shell}
         * @public
         */
        createContent: function (oController) {
            this.oController = oController;
            this.oShellAppTitleStateEnum = {
                SHELL_NAV_MENU_ONLY: 0,
                ALL_MY_APPS_ONLY: 1,
                SHELL_NAV_MENU : 2,
                ALL_MY_APPS: 3
            };
            var oViewData = this.getViewData() || {},
                oConfig = oViewData.config || {},
                bStateEmbedded = (oConfig.appState === "embedded") ? true : false,
                oFiori2LoadingDialog,
                oConfigButton = new ShellHeadItem({
                    id: "configBtn",
                    tooltip: "{i18n>showGrpsBtn_tooltip}",
                    ariaLabel: "{i18n>showGrpsBtn_tooltip}",
                    icon: IconPool.getIconURI("menu2"),
                    selected: {
                        path: "/currentState/showPane"
                    },
                    press: [oController.togglePane, oController]
                }),
                sBackButtonIcon = sap.ui.getCore().getConfiguration().getRTL() ? "feeder-arrow" : "nav-back",
                oHomeButton = new ShellHeadItem({
                    id: "homeBtn",
                    tooltip: "{i18n>homeBtn_tooltip}",
                    ariaLabel: "{i18n>homeBtn_tooltip}",
                    icon: IconPool.getIconURI("home"),
                    target: oConfig.rootIntent ? "#" + oConfig.rootIntent : "#"
                }),
                oBackButton = new ShellHeadItem({
                    id: "backBtn",
                    tooltip: "{i18n>backBtn_tooltip}",
                    ariaLabel: "{i18n>backBtn_tooltip}",
                    icon: IconPool.getIconURI(sBackButtonIcon),
                    press: oController._navBack.bind(oController)
                }),
                oNotificationToggle,
                oMeAreaToggle,
                bHelpEnabled = Config.last("/core/extension/enableHelp");
            this._allowUpToThreeActionInShellHeader(oConfig);
            oBackButton.setShowSeparator(false);
            oHomeButton.setShowSeparator(false);
            oHomeButton.addCustomData(new AccessibilityCustomData({
                key: "aria-disabled",
                value: "false",
                writeToDom: true
            }));

            this.oConfig = oConfig;
            oHomeButton.addEventDelegate({
                onsapskipback: function (oEvent) {
                    if (AccessKeysHandler.getAppKeysHandler()) {
                        oEvent.preventDefault();
                        AccessKeysHandler.bFocusOnShell = false;
                    }
                },
                onsapskipforward: function (oEvent) {
                    if (AccessKeysHandler.getAppKeysHandler()) {
                        oEvent.preventDefault();
                        AccessKeysHandler.bFocusOnShell = false;
                    }
                }
            });
            oConfigButton.addEventDelegate({
                onsapskipforward: function (oEvent) {
                    if (AccessKeysHandler.getAppKeysHandler()) {
                        oEvent.preventDefault();
                        AccessKeysHandler.bFocusOnShell = false;
                    }
                },
                onfocusin: function () {
                    AccessKeysHandler.bFocusOnShell = true;
                    AccessKeysHandler.bFocusPassedToExternalHandlerFirstTime = true;
                }
            });

            this.aDanglingControls = [];
            if (!oConfig.preventLoadingDialogAtStartup) {
                oFiori2LoadingDialog = new Fiori2LoadingDialog({
                    id: "Fiori2LoadingDialog",
                    text: ""
                });
                this.aDanglingControls.push(oFiori2LoadingDialog);
            }

            if (utils.isNotificationsEnabled()){
                oNotificationToggle = new ShellHeadItem({
                    id: "NotificationsCountButton",
                    icon:  sap.ui.core.IconPool.getIconURI("ui-notifications"),
                    accessKey: "n",
                    visible: true,
                    enabled: false
                }).addStyleClass("sapUshellPlaceHolders");
                oNotificationToggle.setShowSeparator(false);
                this.aDanglingControls.push(oNotificationToggle);
            }

            oMeAreaToggle = new ShellHeadItem({
                id: "meAreaHeaderButton",
                icon: '{/userImage/personPlaceHolder}',
                accessKey: "m",
                visible: true,
                enabled: false
            }).addStyleClass("sapUshellPlaceHolders");
            oMeAreaToggle.setShowSeparator(false);
            this.aDanglingControls.push(oMeAreaToggle);


            //handle open catalog
            if (oConfig.enablePersonalization !== false) {
                var oHash;
                var id = "openCatalogBtn";
                var text = resources.i18n.getText("open_appFinderBtn");
                var icon = 'sap-icon://sys-find';
                var sAppFinderHash = "#Shell-home&/appFinder/catalog";
                var sSemanticObject =  "Shell";
                var sAction =  "appfinder";
                var press = function () {
                    jQuery.sap.measure.start("FLP:AppFinderLoadingStartToEnd", "AppFinderLoadingStartToEnd","FLP");
                    sap.ushell.Container.getServiceAsync("URLParsing").then(
                        function (oUrlParser) {
                            if (oUrlParser) {
                                oHash = oUrlParser.parseShellHash(window.hasher.getHash());
                                oHash.action = sAction;
                                oHash.semanticObject = sSemanticObject;
                                sAppFinderHash = "#" + oUrlParser.constructShellHash(oHash);
                            }
                            // perform the navigation only after the viewport animation ends and the center vireport is active
                            setTimeout(function () {
                                sap.ushell.Container.getServiceAsync("CrossApplicationNavigation").then(
                                    function (oCrossAppNavigator) {
                                        oCrossAppNavigator.toExternal({
                                            target: {
                                                shellHash: sAppFinderHash
                                            }
                                        });
                                    }
                                );
                            }, Device.system.desktop ? 0 : 500);
                        }.bind(this));
                };
                var visible = !oConfig.disableAppFinder;
                if (oConfig.moveAppFinderActionToShellHeader) {
                    //in case the app finder button should move to the shell header, we create it as a ShellHeadItem
                    if (!this.oOpenCatalogItem) {
                        this.oOpenCatalogItem = new ShellHeadItem(id,{
                            icon: icon,
                            tooltip: text,
                            text: text,
                            press: press,
                            showSeparator: false,
                            visible: visible
                        });

                        this.oOpenCatalogItem.data("isShellHeader", true);
                    }
                } else if (!this.oOpenCatalogItem) {
                    this.oOpenCatalogItem = new ActionItem(id, {
                        text:       text,
                        icon:       icon,
                        actionType: 'action',
                        press:      press,
                        visible:    visible
                    });

                }
                if (bHelpEnabled) {
                    this.oOpenCatalogItem.addStyleClass('help-id-openCatalogActionItem');// xRay help ID
                }
                this.aDanglingControls.push(this.oOpenCatalogItem);
                if (oConfig.moveEditHomePageActionToShellHeader) {
                    jQuery.sap.measure.start("FLP:Shell.view.createContent", "create the edit home page button as shell head enditem","FLP");
                    //in case the edit home page button should move to the shell header, we create it as a ShellHeadItem
                    //text and press properties will be set in DashboardContent.view.js
                    //by default it is not visible unless the personalization is enabled and the home page is shown.
                    if (!this.oTileActionsButton) {
                        this.oTileActionsButton = new ShellHeadItem("ActionModeBtn", {
                            icon: 'sap-icon://edit',
                            visible: false,
                            showSeparator: false
                        });
                        this.oTileActionsButton.data("isShellHeader", true);
                        // if xRay is enabled
                        if (bHelpEnabled) {
                            this.oTileActionsButton.addStyleClass('help-id-openCatalogActionItem');// xRay help ID
                        }
                    }
                    this.aDanglingControls.push(this.oTileActionsButton);
                    jQuery.sap.measure.end("FLP:Shell.view.createContent");
                }
            }

            /**
             * create EndItem overflow button in case me area is on
             * this will open an action sheet in case we there is not
             * enough space to show all button in the header
             */
            var oEndItemsOverflowBtn = new ShellHeadItem({
                id: "endItemsOverflowBtn",
                tooltip: "{i18n>shellHeaderOverflowBtn_tooltip}",
                ariaLabel: "{i18n>shellHeaderOverflowBtn_tooltip}",
                icon: "sap-icon://overflow",
                press: [oController.pressEndItemsOverflow, oController],
                visible: true,
                showSeparator: false
            });
            this.aDanglingControls.push(oEndItemsOverflowBtn);

            var oShellHeader,
                oUnifiedShell;

            oShellHeader = sap.ui.xmlfragment("sap.ushell.renderers.fiori2.ShellHeader", oController);
            oShellHeader.setAccessKeyHandler(AccessKeysHandler);

            this.oShellHeaderAppTitle = oShellHeader.getAppTitle();
            this.oShellHeaderAppTitle.addEventDelegate({
                onsapskipforward: function (oEvent) {
                    if (AccessKeysHandler.getAppKeysHandler()) {
                        oEvent.preventDefault();
                        AccessKeysHandler.bFocusOnShell = false;
                    }
                }
            });

            // Keep the reference to the shell header because it is not a child of Shell Layout
            // and needs a model to be assigned (in Shell.controller.js) separately
            this.oShellHeader = oShellHeader;

            this.addEventDelegate({
                "onBeforeRendering": function () {
                    // Render the Shell Header
                    this.oShellHeader.createUIArea(this.getUIArea().getId());
                }
            }, this);

            oUnifiedShell = sap.ui.xmlfragment("sap.ushell.renderers.fiori2.ShellLayout", oController);
            oUnifiedShell.setHeader(oShellHeader);
            oUnifiedShell._setStrongBackground(true);
            var oShellToolArea;

            // handling of ToolArea lazy creation
            EventHub.once("ToolAreaItemCreated").do(function (oEvt) {
                oShellToolArea = this._createToolArea();
                oUnifiedShell.setToolArea(oShellToolArea);
                oShellToolArea.updateAggregation = this.updateShellAggregation;
            }.bind(this));

            this.setOUnifiedShell(oUnifiedShell);
            oShellHeader.setShellLayout(oUnifiedShell);

            if (bStateEmbedded) {
                oShellHeader.setLogo(sap.ui.resource('sap.ui.core', 'themes/base/img/1x1.gif'));
            } else {
                this.initShellBarLogo(oShellHeader);
            }
            this.setDisplayBlock(true);
            this.aDanglingControls = this.aDanglingControls.concat([sap.ui.getCore().byId('viewPortContainer'), oHomeButton, oBackButton, oConfigButton]);

            //This property is needed for a special scenario when a remote Authentication is required.
            // IFrame src is set by UI2 Services
            this.logonIFrameReference = null;
            utils.setPerformanceMark("FLP - Shell.view rendering started!");
            return oUnifiedShell;
        },

        /**
         * Begin factory functions for lazy instantiation of Shell Layout controls
         */

        _createToolArea: function () {
            var oShellToolArea = new ToolArea({
                id: 'shell-toolArea',
                toolAreaItems: {
                    path: "/currentState/toolAreaItems",
                    factory: fnShellUpdateAggItem
                }
            });
            return oShellToolArea;
        },

        _allowUpToThreeActionInShellHeader: function (oConfig){
            //in order to save performance time when these properties are not define
            if (Object.keys(oConfig).length != 0) {
                var aConfig = [
                    oConfig.moveAppFinderActionToShellHeader,
                    oConfig.moveUserSettingsActionToShellHeader,
                    oConfig.moveGiveFeedbackActionToShellHeader,
                    oConfig.moveContactSupportActionToShellHeader,
                    oConfig.moveEditHomePageActionToShellHeader
                ];
                var count = 0;
                //count the number of "true" values, once get to three, force the other to be "false"
                for (var index = 0; index < 5; index++) {
                    if (count === 3) {
                        aConfig[index] = false;
                    } else if (aConfig[index]) {
                        count++;
                    }
                }
                //assign the values according to above for loop results so only maximum of 3 FLP actions will be moved from the me area to the shell header
                oConfig.moveAppFinderActionToShellHeader= aConfig[0];
                oConfig.moveUserSettingsActionToShellHeader= aConfig[1];
                oConfig.moveGiveFeedbackActionToShellHeader = aConfig[2];
                oConfig.moveContactSupportActionToShellHeader= aConfig[3];
                oConfig.moveEditHomePageActionToShellHeader= aConfig[4];
            }
        },

        /**
         * In order to minimize core-min we delay the FloatingContainer, ShellFloatingActions creation
         * and enabling MeArea button till core-ext file will be loaded.
         */
        _createPostCoreExtControls: function (FloatingContainer, ShellFloatingActions){

            var oController = this.oController,
                oConfig = this.oConfig,
                oShell = sap.ui.getCore().byId("shell");

            // qUnit specific: the function may be called after the shell is destroyed
            if (!oShell) {
                return;
            }


            var oHierarchyTemplateFunction = function (sId, oContext) {

                // default icon behavior
                var sIcon = oContext.getProperty("icon");
                var sTitle = oContext.getProperty("title");
                var sSubtitle = oContext.getProperty("subtitle");
                var sIntent = oContext.getProperty("intent");
                if (!sIcon) {
                    sIcon = "sap-icon://circle-task-2";
                }

                var oLi =  (new StandardListItem({
                    type: "Active", // Use string literal to avoid dependency from sap.m.library
                    title: sTitle,
                    description: sSubtitle,
                    icon: sIcon,
                    customData: [new CustomData({
                        key: "intent",
                        value: sIntent
                    })],
                    press: function (oEvent) {
                        var oData = oEvent.getSource().getCustomData();
                        if (oData && oData.length > 0) {
                            for (var i=0; i<oData.length; i++) {
                                if (oData[i].getKey() === "intent") {

                                    var sListItemIntent = oData[i].getValue();
                                    if (sListItemIntent && sListItemIntent[0] === "#") {
                                        oController.navigateFromShellApplicationNavigationMenu(sListItemIntent);
                                        return;
                                    }
                                }
                            }
                        }
                    }
                })).addStyleClass("sapUshellNavigationMenuListItems");

                return oLi;
            };

            var oRelatedAppsTemplateFunction = function (sId, oContext) {
                // default icon behavior
                var sIcon = oContext.getProperty("icon");
                var sTitle = oContext.getProperty("title");
                var sSubtitle = oContext.getProperty("subtitle");
                var sIntent = oContext.getProperty("intent");
                return new NavigationMiniTile({
                    title: sTitle,
                    subtitle: sSubtitle,
                    icon: sIcon,
                    intent: sIntent,
                    press: function () {
                        var sTileIntent = this.getIntent();
                        if (sTileIntent && sTileIntent[0] === '#') {
                            oController.navigateFromShellApplicationNavigationMenu(sTileIntent);
                        }
                    }
                });
            };

            var oShellNavigationMenu = new ShellNavigationMenu("shellNavigationMenu", {
                title: "{/currentState/application/title}",
                icon: "{/currentState/application/icon}",
                showTitle: {
                    path: "/currentState/application/showNavMenuTitle"
                },
                showRelatedApps: (oConfig.appState === "lean") ? false : true,
                items: {
                    path: "/currentState/application/hierarchy",
                    factory: oHierarchyTemplateFunction.bind(this)
                },
                miniTiles: {
                    path: "/currentState/application/relatedApps",
                    factory: oRelatedAppsTemplateFunction.bind(this)
                },
                visible: {
                    path: '/ShellAppTitleState',
                    formatter: function (oCurrentState) {
                        return oCurrentState === this.oShellAppTitleStateEnum.SHELL_NAV_MENU;
                    }.bind(this)
                }
            });

            oShellNavigationMenu.setModel(this.getModel());

            this.oShellHeaderAppTitle.setNavigationMenu(oShellNavigationMenu);

            var oShellFloatingContainer = new FloatingContainer({
                id: 'shell-floatingContainer',
                content: {
                    path: "/currentState/floatingContainerContent",
                    factory: fnShellUpdateAggItem
                }
            });
            // add tabindex for the floating container so it can be tab/f6
            oShellFloatingContainer.addCustomData(new AccessibilityCustomData({
                key: "tabindex",
                value: "-1",
                writeToDom: true
            }));
            // from the container , next f6 is to the me area
            oShellFloatingContainer.addEventDelegate({
                onsapskipforward: function (oEvent) {
                    oEvent.preventDefault();
                    AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    AccessKeysHandler.sendFocusBackToShell(oEvent);
                },
                onsapskipback: function (oEvent) {
                    if (AccessKeysHandler.getAppKeysHandler()) {
                        oEvent.preventDefault();
                        AccessKeysHandler.bFocusOnShell = false;
                    }
                }
            });

            oShellFloatingContainer.setModel(oShell.getModel());

            this.aDanglingControls.push(oShellFloatingContainer);
            var oShellFloatingActions = new ShellFloatingActions({
                id: 'shell-floatingActions',
                floatingActions: {
                    path: "/currentState/floatingActions",
                    factory: fnShellUpdateAggItem
                }
            });

            oShellFloatingActions.updateAggregation = this.updateShellAggregation;

            var oShellLayout = this.getOUnifiedShell();
            oShellLayout.setFloatingContainer(oShellFloatingContainer);
            oShellLayout.setFloatingActionsContainer(oShellFloatingActions);

            this._createAllMyAppsView();
        },

        createPostCoreExtControls: function (){
            sap.ui.require(
                ["sap/ushell/ui/shell/FloatingContainer", "sap/ushell/ui/shell/ShellFloatingActions"],
                this._createPostCoreExtControls.bind(this)
            );
        },

        _createAllMyAppsView: function () {

            var onServiceLoaded = function (oAllMyApps) {
                if (oAllMyApps.isEnabled()) {
                    this.oAllMyAppsView = sap.ui.view("allMyAppsView", {
                        type: sap.ui.core.mvc.ViewType.JS,
                        viewName:  "sap.ushell.renderers.fiori2.allMyApps.AllMyApps",
                        viewData: {
                            _fnGetShellModel: this.getModel.bind(this)
                        },
                        async: true,
                        height: "100%",
                        visible: {
                            path: '/ShellAppTitleState',
                            formatter: function (oCurrentState) {
                                return oCurrentState !== this.oShellAppTitleStateEnum.SHELL_NAV_MENU;
                            }.bind(this)
                        }
                    }).addStyleClass("sapUshellAllMyAppsView");

                    this.oAllMyAppsView.addCustomData(new AccessibilityCustomData({
                        key: "aria-label",
                        value: resources.i18n.getText("allMyApps_headerTitle"),
                        writeToDom: true
                    }));

                    this.getOUnifiedShell().getHeader().getAppTitle().setAllMyApps(this.oAllMyAppsView);
                }
            }.bind(this);

            sap.ushell.Container.getServiceAsync("AllMyApps").then(onServiceLoaded);
        },

        getOUnifiedShell: function () {
            return this.oUnifiedShell;
        },
        setOUnifiedShell: function (oUnifiedShell) {
            this.oUnifiedShell = oUnifiedShell;
        },

        initShellBarLogo: function (oShellHeader) {
            function getIconURI (ico) { // the icon may be "none" or "url('xxxxx')", return null or xxxxx
                var match = /url[\s]*\('?"?([^\'")]*)'?"?\)/.exec(ico);
                return match ? match[1] : null;
            }

            function setBarLogo () {
                if (!oShellHeader.bIsDestroyed) {
                    // Set custom icon or standard SAP logo
                    var sIcon = getIconURI(ThemingParameters.get("sapUiGlobalLogo"));
                    oShellHeader.setLogo(sIcon || jQuery.sap.getModulePath("sap.ushell") + '/themes/base/img/sap_55x27.png');
                }
            }
            // Do not set logo image until the main theme is loaded
            if (sap.ui.getCore().isThemeApplied()) {
                setBarLogo();
            }
            sap.ui.getCore().attachThemeChanged(setBarLogo);

            utils.setPerformanceMark("FLP-TimeToFirstMeaningfullPaint_setLogo");
        },

        updateShellAggregation: function (sName) {
            /*jslint nomen: true */
            var oBindingInfo = this.mBindingInfos[sName],
                oAggregationInfo = this.getMetadata().getJSONKeys()[sName],
                oClone;

            jQuery.each(this[oAggregationInfo._sGetter](), jQuery.proxy(function (i, v) {
                this[oAggregationInfo._sRemoveMutator](v);
            }, this));
            jQuery.each(oBindingInfo.binding.getContexts(), jQuery.proxy(function (i, v) {
                oClone = oBindingInfo.factory(this.getId() + "-" + i, v) ? oBindingInfo.factory(this.getId() + "-" + i, v).setBindingContext(v, oBindingInfo.model) : "";
                this[oAggregationInfo._sMutator](oClone);
            }, this));
        },

        getControllerName: function () {
            return "sap.ushell.renderers.fiori2.Shell";
        },

        createIFrameDialog: function () {
            var oDialog = null,
                oLogonIframe = this.logonIFrameReference,
                bContactSupportEnabled;

            var _getIFrame = function () {
                //In order to assure the same iframe for SAML authentication is not reused, we will first remove it from the DOM if exists.
                if (oLogonIframe) {
                    oLogonIframe.remove();
                }
                //The src property is empty by default. the caller will set it as required.
                return jQuery('<iframe id="SAMLDialogFrame" src="" frameborder="0" height="100%" width="100%"></iframe>');
            };

            var _hideDialog = function () {
                oDialog.addStyleClass('sapUshellSamlDialogHidden');
                jQuery('#sap-ui-blocklayer-popup').addClass('sapUshellSamlDialogHidden');
            };

            //A new dialog wrapper with a new inner iframe will be created each time.
            this.destroyIFrameDialog();

            var closeBtn = new Button({
                text: resources.i18n.getText("samlCloseBtn"),
                press: function () {
                    sap.ushell.Container.cancelLogon(); // Note: calls back destroyIFrameDialog()!
                }
            });

            var oHTMLCtrl = new HTML("SAMLDialogFrame");
            //create new iframe and add it to the Dialog HTML control
            this.logonIFrameReference = _getIFrame();
            oHTMLCtrl.setContent(this.logonIFrameReference.prop('outerHTML'));
            oDialog = new Dialog({
                id: "SAMLDialog",
                title: resources.i18n.getText("samlDialogTitle"),
                contentWidth: "50%",
                contentHeight: "50%",
                rightButton: closeBtn
            }).addStyleClass("sapUshellIframeDialog");
            bContactSupportEnabled = Config.last("/core/extension/SupportTicket");
            if (bContactSupportEnabled) {
                var oContactSupportBtn = new ContactSupportButton();
                oContactSupportBtn.setWidth('150px');
                oContactSupportBtn.setIcon('');
                oDialog.setLeftButton(oContactSupportBtn);
            }
            oDialog.addContent(oHTMLCtrl);
            oDialog.open();
            //Make sure to manipulate css properties after the dialog is rendered.
            _hideDialog();
            this.logonIFrameReference = jQuery('#SAMLDialogFrame');
            return this.logonIFrameReference[0];
        },

        destroyIFrameDialog: function () {
            var dialog = sap.ui.getCore().byId('SAMLDialog');
            if (dialog) {
                dialog.destroy();
            }
            this.logonIFrameReference = null;
        },

        showIFrameDialog: function () {
            //remove css class of dialog
            var oDialog = sap.ui.getCore().byId('SAMLDialog');

            if (oDialog) {
                oDialog.removeStyleClass('sapUshellSamlDialogHidden');
                jQuery('#sap-ui-blocklayer-popup').removeClass('sapUshellSamlDialogHidden');
            }
        },

        addDanglingControl: function (oControl){
            this.aDanglingControls.push(oControl);
        }
    });


}, /* bExport= */ false);
