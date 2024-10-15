// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/*global $, jQuery, sap, document, hasher */
sap.ui.define([
    'sap/ushell/EventHub',
    'sap/ushell/ui/launchpad/ShortcutsHelpContainer',
    'jquery.sap.keycodes',
    'sap/ui/Device'
],
function (EventHub, ShortcutsHelpContainer, keycodes, Device) {
    "use strict";

    /*global window*/

    var AccessKeysHandler = function () {};

    AccessKeysHandler.prototype = {

        keyCodes: jQuery.sap.KeyCodes,
        bFocusOnShell: true,
        bFocusPassedToExternalHandlerFirstTime: true,
        isFocusHandledByAnotherHandler: false,
        fnExternalKeysHandler: null,
        sLastExternalKeysHandlerUrl: null,
        fnExternalShortcuts: null,
        isleftAltPressed: false,
        bForwardNavigation: true,

        appOpenedHandler: function () {
            var sCurrentApplicationIntent = hasher.getHash();

            if (sCurrentApplicationIntent !== this.sLastExternalKeysHandlerUrl) {
                this.fnExternalKeysHandler = null;
            }
            this.sLastExternalKeysHandlerUrl = sCurrentApplicationIntent;
        },

        handleSearchKey: function () {
            var shellSearchBtn = sap.ui.getCore().byId('sf');
            if (shellSearchBtn && $('#sf:visible').length === 0) {
                // searchFieldInShell is open
                //return; //UIX asked us to still have the focus on search button
            }
            jQuery(shellSearchBtn).click();
        },

        setFocusOnSearchButton: function (e) {
            e.preventDefault();
            var shellSearchBtn = sap.ui.getCore().byId('sf');
            if (shellSearchBtn) {
                jQuery(shellSearchBtn).focus();
            }
        },

        handleSearchAppFinderKey: function (oEvent) {
            var appFinderSearchBtn = sap.ui.getCore().byId('appFinderSearch');
            if (!appFinderSearchBtn || jQuery('#appFinderSearch:visible').length === 0) {
                return;
            } else if (jQuery('.sapUshellViewPortCenter').hasClass('centerClass')) {
                // only in case the center view port is indeed centered we allow this hotkey of CTRL&S
                jQuery(appFinderSearchBtn).focus();

                oEvent.preventDefault();
                oEvent.stopPropagation();
                oEvent.stopImmediatePropagation();
            }
        },

        handleNavToMeArea: function () {
            var oMainShell = sap.ui.getCore().byId("mainShell");
            if (oMainShell && oMainShell.getController().getModelConfiguration().appState != "headerless") {
                // Force the EventHub to emit the event with a new value
                EventHub.emit('showMeArea', Date.now());
            }
            setTimeout(function () {
                jQuery(".sapUshellActionItem:first").focus();
            }, 300);
        },

        /**
         * Set the focus on the settings button.
         */
        handleSettingsButton: function () {
            var oSettingsBtn = window.document.getElementById("userSettingsBtn"),
                oConfig = sap.ushell.Container.getRenderer("fiori2").getShellConfig(),
                oOverFlowBtn = window.document.getElementById("endItemsOverflowBtn");

            if (oSettingsBtn) {
                oSettingsBtn.focus();
                return;
            }

            if (oConfig.moveUserSettingsActionToShellHeader) {
                if (oOverFlowBtn) {
                    oOverFlowBtn.focus();
                }
            } else {
                // Force the EventHub to emit the event with a new value
                EventHub.emit('showMeArea', Date.now());
                window.setTimeout(function () {
                    oSettingsBtn = window.document.getElementById("userSettingsBtn");
                    if (oSettingsBtn) {
                        oSettingsBtn.focus();
                    } else {
                        oOverFlowBtn = window.document.getElementById("overflowActions-overflowButton");
                        if (oOverFlowBtn) {
                            oOverFlowBtn.focus();
                        }
                    }
                }, 300);
            }
        },

        handleNavToNotifications: function () {
            var oMainShell = sap.ui.getCore().byId("mainShell"),
                sAppState;
            if (oMainShell) {
                sAppState = oMainShell.getController().getModelConfiguration().appState;
            }
            if (sAppState != "headerless") {
                // Force the EventHub to emit the event with a new value
                EventHub.emit('showNotifications', Date.now());
                setTimeout(function () {
                    jQuery("#notificationsView .sapUshellNotificationsListItem:visible:first").focus();
                }, 2000);
            }
        },

        handleSettings: function () {
            var userSettingsBtn = sap.ui.getCore().byId('userSettingsBtn');
            if (userSettingsBtn) {
                userSettingsBtn.firePress({ "hotkeys": "ctrl_comma" });
            }
        },

        handleAccessOverviewKey: function () {
            var translationBundle = sap.ushell.resources.i18n,
                isSearchAvailable = this.oModel.getProperty("/searchAvailable"),
                oMainShell = sap.ui.getCore().byId("mainShell"),
                contentList = [], //contains the content of the form depends on the launchpad configuration
                oSimpleForm,
                oDialog,
                sAppState,
                okButton;

            if (Device.browser.msie) {
                // the Internet Explorer would display its F1 help also on CTRL + F1 if the help event wasn't cancelled
                document.addEventListener("help", this._cancelHelpEvent);
            }

            if (oMainShell) {
                sAppState = oMainShell.getController().getModelConfiguration().appState;
            }
            this.aShortcutsDescriptions.forEach(function (sViewName) {
                contentList.push(new sap.m.Label({ text: sViewName.description }));
                contentList.push(new sap.m.Text({ text: sViewName.text }));
            });

            if (isSearchAvailable) {
                contentList.push(new sap.m.Label({ text: translationBundle.getText("hotkeyFocusOnSearchButton") }));
                contentList.push(new sap.m.Text({ text: "Alt+F" }));
            }

            if (sAppState != "headerless") {
                contentList.push(new sap.m.Label({ text: translationBundle.getText("hotkeyFocusOnMeArea") }));
                contentList.push(new sap.m.Text({ text: "Alt+M" }));
                contentList.push(new sap.m.Label({ text: translationBundle.getText("hotkeyFocusOnNotifications") }));
                contentList.push(new sap.m.Text({ text: "Alt+N" }));
            }
            contentList.push(new sap.m.Label({ text: translationBundle.getText("hotkeyFocusOnSettingsButton") }));
            contentList.push(new sap.m.Text({ text: "Alt+S" }));
            contentList.push(new sap.m.Label({ text: translationBundle.getText("hotkeyOpenSettings") }));
            contentList.push(new sap.m.Text({ text: "Ctrl+Comma" }));


            if (isSearchAvailable) {
                contentList.push(new sap.m.Label({ text: translationBundle.getText("hotkeyFocusOnSearchField") }));
                contentList.push(new sap.m.Text({ text: "Ctrl+Shift+F" }));
            }

            oSimpleForm = new ShortcutsHelpContainer({
                content: contentList
            });

            okButton = new sap.m.Button({
                text: translationBundle.getText("okBtn"),
                press: function () {
                    oDialog.close();
                }
            });

            oDialog = new sap.m.Dialog({
                id: "hotKeysGlossary",
                title: translationBundle.getText("hotKeysGlossary"),
                contentWidth: "29.6rem",
                leftButton: okButton,
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            oDialog.addContent(oSimpleForm);
            oDialog.open();
        },

        /**
         * Reacts on given keyboard events
         *
         * @param {object} oEvent the event that contains all the information about the keystroke
         */
        handleShortcuts: function (oEvent) {
            var oShellHeader = window.document.getElementById("shell-header"),
                that = this;

            if (oEvent.altKey && !oEvent.shiftKey && !oEvent.ctrlKey && oShellHeader) {
                switch (String.fromCharCode(oEvent.keyCode)) {
                    case 'M':
                        this.handleNavToMeArea();
                        // Prevent default, inorder to overwrite Firefox default accesskeys
                        oEvent.preventDefault();
                        break;
                    case 'N':
                        this.handleNavToNotifications();
                        // Prevent default, inorder to overwrite Firefox default accesskeys
                        oEvent.preventDefault();
                        break;
                    case 'S':
                        // Set HTML accesskey attribute. This is important, inorder to overwrite IE default accesskeys
                        oShellHeader.setAttribute("accesskey", "s");
                        // Timeout required for IE to switch the focus from the ShellHeader back to the button
                        window.setTimeout(function () {
                            that.handleSettingsButton();
                            // Remove HTML accesskey attribute again after some time.
                            oShellHeader = window.document.getElementById("shell-header");
                            if (oShellHeader) {
                                oShellHeader.removeAttribute("accesskey");
                            }
                        }, 0);
                        // Prevent default, inorder to overwrite Firefox default accesskeys
                        oEvent.preventDefault();
                        break;
                    case 'F':
                        this.setFocusOnSearchButton(oEvent);
                        // Prevent default, inorder to overwrite Firefox default accesskeys
                        oEvent.preventDefault();
                        break;
                        // no default
                } // End of switch
            } // End of if altKey



            // CTRL
            if (oEvent.ctrlKey) {
                // SHIFT
                if (oEvent.shiftKey) {
                    if (oEvent.keyCode === 70) { // F
                        // e.g. CTRL + SHIFT + F
                        this.handleSearchKey();
                    }
                } else if (oEvent.keyCode === 188) { //comma
                    this.handleSettings();
                } else if (oEvent.keyCode === 112) { //F1
                    this.handleAccessOverviewKey();
                } else if (oEvent.keyCode === 83) { // S
                    this.handleSearchAppFinderKey(oEvent);
                }
            }
        },

        registerAppKeysHandler: function (fnHandler) {
            this.fnExternalKeysHandler = fnHandler;
            this.sLastExternalKeysHandlerUrl = hasher.getHash();
        },

        resetAppKeysHandler: function () {
            this.fnExternalKeysHandler = null;
        },

        getAppKeysHandler: function () {
            return this.fnExternalKeysHandler;
        },

        registerAppShortcuts: function (fnHandler, aShortcutsDescriptions) {
            this.fnExternalShortcuts = fnHandler;
            this.aShortcutsDescriptions = aShortcutsDescriptions;
        },

        /*
             This method is responsible to restore focus in the shell (according to the event & internal logic)

             New parameter added : sIdForFocus
             This parameter in case supplied overrides the event/internal logic handling and enforces the focus
             on the element with the corresponding id.
         */
        _handleFocusBackToMe: function (oEvent, sIdForFocus) {
            this.bFocusOnShell = true;

            if (sIdForFocus) {
                jQuery("#" + sIdForFocus).focus();
            } else if (!oEvent) {
                jQuery("#meAreaHeaderButton").focus();
            } else if (oEvent.shiftKey) {
                this.bForwardNavigation = false;
                if (oEvent.keyCode === jQuery.sap.KeyCodes.TAB) {
                    jQuery("#sapUshellHeaderAccessibilityHelper").focus();
                } else if (oEvent.keyCode === jQuery.sap.KeyCodes.F6) {
                    oEvent.preventDefault();
                    jQuery("#meAreaHeaderButton").focus();
                }
            } else {
                this.bForwardNavigation = true;
                oEvent.preventDefault();
                // if no me area button (like in headerless state) then move forward
                if (!jQuery("#meAreaHeaderButton").length) {
                    jQuery("#sapUshellHeaderAccessibilityHelper").focus();
                } else {
                    jQuery("#meAreaHeaderButton").focus();
                }
            }
            //reset flag
            this.bFocusPassedToExternalHandlerFirstTime = true;
        },

        setIsFocusHandledByAnotherHandler: function (bHandled) {
            this.isFocusHandledByAnotherHandler = bHandled;
        },


        sendFocusBackToShell: function (oParam) {

            /*
             This method is responsible to restore focus in the shell (according to the event & internal logic)

             Added support to pass either an Event (e.g. KBN) to determine which area to focus on the shell
             OR
             String which is actually ID for a specific control to focus on
             */

            var oEvent = undefined,
                sIdForFocus = undefined;
            var sParamType = typeof oParam;

            if (sParamType === "string") {
                sIdForFocus = oParam;
            } else if (sParamType === "object") {
                oEvent = oParam;
            }

            this._handleFocusBackToMe(oEvent, sIdForFocus);
        },

        _handleEventUsingExteranlKeysHandler: function (oEvent) {
            if (!this.bFocusOnShell && !this.isFocusHandledByAnotherHandler) {
                if (this.fnExternalKeysHandler && jQuery.isFunction(this.fnExternalKeysHandler)) {
                    this.fnExternalKeysHandler(oEvent, this.bFocusPassedToExternalHandlerFirstTime);
                    this.bFocusPassedToExternalHandlerFirstTime = false;
                }
            }
            //reset flag
            this.setIsFocusHandledByAnotherHandler(false);
        },

        _cancelHelpEvent: function (oEvent) {
            oEvent.preventDefault();
            // deregister immediately so that F1 still works
            document.removeEventListener("help", this._cancelHelpEvent);
        },

        init: function (oModel) {
            this.oModel = oModel;
            //prevent browser event ctrl+up/down from scrolling page
            //created by user `keydown` native event needs to be cancelled so browser will not make default action, which is scroll.
            //Instead we clone same event and dispatch it programmatic, so all handlers expecting to this event will still work

            document.addEventListener("keydown", function (oEvent) {
                //if Shift key was pressed alone, don't perform any action
                if (oEvent.keyCode === 16) {
                    return;
                }

                if (oEvent.shiftKey) {
                    this.bForwardNavigation = false;
                } else {
                    this.bForwardNavigation = true;
                }

                //make sure that UI5 events (sapskipforward/saptabnext/etc.) will run before the
                // document.addEventListener("keydown"... code in the AccessKeysHandler as it was before
                // when we used jQuery(document).on('keydown'..
                if (oEvent.keyCode === this.keyCodes.TAB || oEvent.keyCode === this.keyCodes.F6) {
                    setTimeout(function () {
                        this._handleEventUsingExteranlKeysHandler(oEvent);
                    }.bind(this), 0);
                } else {
                    this._handleEventUsingExteranlKeysHandler(oEvent);
                }

                if (oEvent.keyCode === 18) { //Alt key
                    if (oEvent.location === window.KeyboardEvent.DOM_KEY_LOCATION_LEFT) {
                        this.isleftAltPressed = true;
                    } else {
                        this.isleftAltPressed = false;
                    }
                }

                // check for shortcuts only if you pressed a combination of keyboards containing the left ALT key, or
                // without any ALT key at all
                if (this.isleftAltPressed || !oEvent.altKey) {
                    this.handleShortcuts(oEvent);
                    if (this.fnExternalShortcuts) {
                        this.fnExternalShortcuts(oEvent);
                    }
                }
            }.bind(this), true); // End of event handler

            // save the bound function so that it can be deregistered later
            this._cancelHelpEvent = this._cancelHelpEvent.bind(this);
        }
    };

    var accessKeysHandler = new AccessKeysHandler();
    EventHub.on("AppRendered").do(AccessKeysHandler.prototype.appOpenedHandler.bind(accessKeysHandler));

    return accessKeysHandler;

}, /* bExport= */ true);