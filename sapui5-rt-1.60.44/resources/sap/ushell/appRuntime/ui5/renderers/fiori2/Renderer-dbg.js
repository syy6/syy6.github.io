// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/appRuntime/ui5/AppRuntimeService",
    "sap/base/Log"
], function (AppRuntimeService, Log) {
    "use strict";

    var aButtonsHandlers = [];

    function RendererProxy () {
        var that = this;

        sap.ushell = (sap.ushell || {});
        sap.ushell.renderers = (sap.ushell.renderers || {});
        sap.ushell.renderers.fiori2 = (sap.ushell.renderers.fiori2 || {});
        sap.ushell.renderers.fiori2.Renderer = this;

        [
            "init", "createContent", "createExtendedShellState", "applyExtendedShellState", "showLeftPaneContent", "showHeaderItem",
            "showRightFloatingContainerItem", "showRightFloatingContainer", "showToolAreaItem",
            "showFloatingActionButton", "showHeaderEndItem", "setHeaderVisibility", "showSubHeader", "showSignOutItem", "showSettingsItem",
            "setFooter", "setShellFooter", "setFooterControl", "hideHeaderItem", "removeToolAreaItem", "removeRightFloatingContainerItem",
            "hideLeftPaneContent", "hideFloatingActionButton", "hideSubHeader", "removeFooter",
            "getCurrentViewportState", "addShellSubHeader", "addSubHeader", "addUserAction", "addActionButton", "addFloatingButton",
            "addFloatingActionButton", "addSidePaneContent", "addLeftPaneContent", "addHeaderItem", "addRightFloatingContainerItem",
            "addToolAreaItem", "getModelConfiguration", "addEndUserFeedbackCustomUI", "addUserPreferencesEntry", "setHeaderTitle",
            "setLeftPaneVisibility", "showToolArea", "setHeaderHiding", "setFloatingContainerContent", "setFloatingContainerVisibility",
            "getFloatingContainerVisiblity", "getRightFloatingContainerVisibility", "setFloatingContainerDragSelector",
            "makeEndUserFeedbackAnonymousByDefault", "showEndUserFeedbackLegalAgreement", "createTriggers", "convertButtonsToActions",
            "createItem", "addEntryInShellStates", "removeCustomItems", "addCustomItems", "addRightViewPort", "addLeftViewPort",
            "getShellController", "getViewPortContainerCurrentState", "ViewPortContainerNavTo", "switchViewPortStateByControl",
            "setMeAreaSelected", "getMeAreaSelected", "setNotificationsSelected", "getNotificationsSelected", "addShellDanglingControl",
            "getShellConfig", "getEndUserFeedbackConfiguration", "reorderUserPrefEntries", "addUserProfilingEntry", "logRecentActivity",
            "setCurrentCoreView", "getCurrentCoreView"
        ].forEach(function (sMethod) {
            that[sMethod] = function () {
                Log.error("'Renderer' api '" + sMethod
                    + "' is not supported when UI5 application is running inside an iframe (sap.ushell.appRuntime.ui5.renderers.fiori2.Renderer)");
            };
        });

        this.LaunchpadState = {
            App: "app",
            Home: "home"
        };

        this._addButtonHandler = function (sId, fnHandler) {
            aButtonsHandlers[sId] = fnHandler;
        };

        this.handleHeaderButtonClick = function (sButtonId) {
            if (aButtonsHandlers[sButtonId] !== undefined) {
                aButtonsHandlers[sButtonId]();
            }
        };

        this.addHeaderItem = function (controlType, oControlProperties, bIsVisible, bCurrentState, aStates) {
            // in order to support deprecation of the never used argument: 'controlType' , we'll need to check whether it was passed to
            // the function by checking the types of the first two arguments
            if (typeof (arguments[0]) === "object" && typeof (arguments[1]) === "boolean") {
                oControlProperties = arguments[0];
                bIsVisible = arguments[1];
                bCurrentState = arguments[2];
                aStates = arguments[3];
            }
            this._addHeaderItem(
                "sap.ushell.services.Renderer.addHeaderItem",
                oControlProperties,
                bIsVisible,
                bCurrentState,
                aStates
            );
        };

        this.addHeaderEndItem = function (controlType, oControlProperties, bIsVisible, bCurrentState, aStates) {
            // in order to support deprecation of the never used argument: 'controlType' , we'll need to check whether it was passed to
            // the function by checking the types of the first two arguments
            if (typeof (arguments[0]) === "object" && typeof (arguments[1]) === "boolean") {
                oControlProperties = arguments[0];
                bIsVisible = arguments[1];
                bCurrentState = arguments[2];
                aStates = arguments[3];
            }
            this._addHeaderItem(
                "sap.ushell.services.Renderer.addHeaderEndItem",
                oControlProperties,
                bIsVisible,
                bCurrentState,
                aStates
            );
        };

        this.showHeaderItem = function (aIds/*, bCurrentState, aStates*/) {
            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.Renderer.showHeaderItem", {
                    "aIds": aIds,
                    "bCurrentState": true,
                    "aStates": ""
                }
            );
        };

        this.showHeaderEndItem = function (aIds/*, bCurrentState, aStates*/) {
            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.Renderer.showHeaderEndItem", {
                    "aIds": aIds,
                    "bCurrentState": true,
                    "aStates": ""
                }
            );
        };

        this.hideHeaderItem = function (aIds/*, bCurrentState, aStates*/) {
            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.Renderer.hideHeaderItem", {
                    "aIds": aIds,
                    "bCurrentState": true,
                    "aStates": ""
                }
            );
        };

        this.hideHeaderEndItem = function (aIds/*, bCurrentState, aStates*/) {
            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.Renderer.hideHeaderEndItem", {
                    "aIds": aIds,
                    "bCurrentState": true,
                    "aStates": ""
                }
            );
        };

        this._addHeaderItem = function (sAPI, oControlProperties, bIsVisible/*, bCurrentState, aStates*/) {
            if (oControlProperties.click !== undefined) {
                aButtonsHandlers[oControlProperties.id] = oControlProperties.click;
            }
            if (oControlProperties.press !== undefined) {
                aButtonsHandlers[oControlProperties.id] = oControlProperties.press;
            }
            AppRuntimeService.sendMessageToOuterShell(
                sAPI, {
                    sId: oControlProperties.id,
                    sTooltip: oControlProperties.tooltip,
                    sIcon: oControlProperties.icon,
                    bVisible: bIsVisible,
                    bCurrentState: true
                }
            );
        };

        this.setHeaderTitle = function (sTitle) {
            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.Renderer.setHeaderTitle",
                { "sTitle": sTitle }
            );
        };

        this.setHeaderVisibility = function (bVisible, bCurrentState, aStates) {
            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.Renderer.setHeaderVisibility", {
                    "bVisible": bVisible,
                    "bCurrentState": bCurrentState,
                    "aStates": aStates
                }
            );
        };

        this.createShellHeadItem = function (params) {
            if (params.press !== undefined) {
                aButtonsHandlers[params.id] = params.press;
                delete params.press;
            }
            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.Renderer.createShellHeadItem", {
                    params: params
                }
            );
        };

        this.showActionButton = function (aIds, bCurrentState, aStates) {
            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.Renderer.showActionButton", {
                    "aIds": aIds,
                    "bCurrentState": bCurrentState,
                    "aStates": aStates
                }
            );
        };

        this.hideActionButton = function (aIds, bCurrentState, aStates) {
            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.Renderer.hideActionButton", {
                    "aIds": aIds,
                    "bCurrentState": bCurrentState,
                    "aStates": aStates
                }
            );
        };

        this.addUserAction = function (oParameters) {
            if (oParameters.oControlProperties.press !== undefined) {
                aButtonsHandlers[oParameters.oControlProperties.id] = oParameters.oControlProperties.press;
                delete oParameters.oControlProperties["press"];
            }

            AppRuntimeService.sendMessageToOuterShell(
                "sap.ushell.services.Renderer.addUserAction", {
                    "oParameters": oParameters
                }
            );
        };
    }

    return new RendererProxy();
});
