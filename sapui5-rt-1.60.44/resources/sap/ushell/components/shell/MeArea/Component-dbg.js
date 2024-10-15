// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    'sap/ushell/resources',
    'sap/ui/core/UIComponent',
    'sap/ushell/components/applicationIntegration/AppLifeCycle',
    'sap/ushell/components/homepage/ComponentKeysHandler',
    'sap/ushell/ui/footerbar/ContactSupportButton',
    'sap/ushell/ui/footerbar/EndUserFeedback',
    'sap/ushell/EventHub',
    'sap/ushell/Config',
    './UserPreferences'
], function (
    resources,
    UIComponent,
    AppLifeCycle,
    ComponentKeysHandler,
    ContactSupportButton,
    EndUserFeedback,
    EventHub,
    Config,
    UserPreferences
){
    "use strict";

    var _oRenderer;
    // Shortcut to sap.ushell.Container.getRenderer("fiori2")
    function _renderer () {
        if (!_oRenderer) {
            _oRenderer = sap.ushell.Container.getRenderer("fiori2");
        }
        return _oRenderer;
    }

    // Shortcut to sap.ushell.Container.getRenderer("fiori2").getShellConfig()
    function _shellConfig () {
        return _renderer().getShellConfig();
    }

    // Shortcut to AppLifeCycle.getElementsModel().getModel()
    function _model () {
        return AppLifeCycle.getElementsModel().getModel();
    }

    var bEnableHelp;

    /* MeArea Component */
    return UIComponent.extend("sap.ushell.components.shell.MeArea.Component", {

        metadata: {
            version: "1.60.40",
            library: "sap.ushell.components.shell.MeArea",
            dependencies: {
                libs: ["sap.m", "sap.ui.layout"]
            }
        },

        createContent: function () {
            this._bSearchPrefsLoaded = false;
            this._bIsMeAreaCreated = false;
            //xray enabledment
            bEnableHelp  = Config.last("/core/extension/enableHelp");

            var oMeAreaToggle;

            // Show/Hide MeArea
            var toggleMeArea = function (bShow) {
                this.toggleMeAreaView(oMeAreaToggle, bShow);
            }.bind(this);

            oMeAreaToggle = sap.ui.getCore().byId("meAreaHeaderButton");
            oMeAreaToggle.applySettings({
                tooltip: sap.ushell.Container.getUser().getFullName(),
                //Header Icon - icon on meArea toggle button
                icon: '{/userImage/personPlaceHolder}',
                selected: {
                    path: "/currentViewPortState",
                    formatter: function (viewPortState) {
                        if (viewPortState === 'LeftCenter') {
                            return true;
                        }
                        return false;
                    }
                },
                press: function () {
                    toggleMeArea(!this.getSelected());
                },
                visible: true,
                enabled: true,
                showSeparator: false,
                ariaLabel: "{i18n>MeAreaToggleButtonAria}"
            }).removeStyleClass("sapUshellPlaceHolders");

            oMeAreaToggle.addEventDelegate({
                onAfterRendering: function () {
                    oMeAreaToggle.$().attr("aria-pressed", oMeAreaToggle.getSelected());
                },
                onsapskipforward: function (oEvent) {
                    sap.ushell.renderers.fiori2.AccessKeysHandler.bForwardNavigation = true;
                    oEvent.preventDefault();
                    jQuery("#sapUshellHeaderAccessibilityHelper").focus();
                },
                onsaptabprevious: function (oEvent) {
                    var viewPort = sap.ui.getCore().byId('viewPortContainer'),
                        sCurrentState = viewPort.getCurrentState(),
                        oRecentItemsList;

                    switch (sCurrentState) {
                        case "LeftCenter":
                            oRecentItemsList = jQuery("#meAreaIconTabBar-content li:first");
                            if (oRecentItemsList.length > 0) {
                                oRecentItemsList[0].focus();
                            } else {
                                var enableRecentActivity = Config.last("/core/shell/enableRecentActivity");
                                if (enableRecentActivity && _model().getProperty("/enableTrackingActivity")) {
                                    jQuery("#meAreaIconTabBar .sapMITBText")[0].focus();
                                } else {
                                    oEvent.preventDefault();
                                    jQuery('.sapUshellActionItem:last')[0].focus();
                                }
                            }
                            break;
                        case "Center":
                            if (sap.ushell.renderers.fiori2.AccessKeysHandler.getAppKeysHandler()) {
                                oEvent.preventDefault();
                                sap.ushell.renderers.fiori2.AccessKeysHandler.bFocusOnShell = false;
                            }
                            break;
                        default:
                            //do nothing
                    }
                },
                onsapskipback: function (oEvent) {

                    // When the focus is on the MeArea icon and MeArea is opened (i.e. case "LeftCenter") -
                    // SHIFT+F6 should move the focus to the Recently Used list

                    var viewPort = sap.ui.getCore().byId('viewPortContainer'),
                        sCurrentState = viewPort.getCurrentState(),
                        oNextElement;

                    switch (sCurrentState) {
                        case "LeftCenter":
                            oEvent.preventDefault();
                            oNextElement = jQuery("#meAreaIconTabBar .sapMITBSelected");
                            if (oNextElement.length === 0) {
                                oNextElement = jQuery(".sapUshellActionItem");
                            }
                            oNextElement[0].focus();
                            break;
                        case "Center":
                            oEvent.preventDefault();
                            // if co-pilot exists and we came from tile - need to focus on copilot - otherwise - on mearea
                            if (jQuery("#sapUshellFloatingContainerWrapper:visible").length == 1 &&  (oEvent.originalEvent.srcElement.id) != "") {
                                sap.ui.getCore().getEventBus().publish("launchpad", "shellFloatingContainerIsAccessible");
                            } else if (sap.ushell.renderers.fiori2.AccessKeysHandler.getAppKeysHandler()) {
                                sap.ushell.renderers.fiori2.AccessKeysHandler.bFocusOnShell = false;
                            }
                            break;
                        default :
                            //do nothing
                    }
                }
            });

            //In state blank when no Action Items do not display MeArea.
            AppLifeCycle.getElementsModel().createInspection("actions", [{
                fnCondition: function (aItems, aIds, oThat) {
                    return true;
                }, fnAction: function (aItems, aIds, oThat) {
                    if ((aItems && aItems.length > 0) || (aIds && aIds.length > 0)) {
                        if (aIds.indexOf("meAreaHeaderButton") === -1) {
                            oThat.addHeaderItem(["meAreaHeaderButton"], true);
                        }
                    } else {
                        oThat.removeHeaderItem(["meAreaHeaderButton"], true);
                    }
                }
            }], false, ["blank-home", "blank"]);

            this._createMeArea();

            // Show/Hide MeArea API. Usage: EventHub.emit('showMeArea', [true|false]);
            EventHub.on('showMeArea').do(toggleMeArea);

            sap.ui.getCore().getEventBus().publish("shell", "meAreaCompLoaded", {delay: 0});
        },

        _createMeArea: function () {
            if (this._bIsMeAreaCreated === true) {
                return;
            }
            this._bIsMeAreaCreated = true;

            //add MeArea view
            var oMeAreaView = sap.ui.view("meArea", {
                viewName: "sap.ushell.components.shell.MeArea.MeArea",
                type: 'JS',
                viewData: _renderer().getComponentData(),
                async: true
            });

            oMeAreaView.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: "role",
                value: "region",
                writeToDom: true
            }));
            oMeAreaView.addCustomData(new sap.ushell.ui.launchpad.AccessibilityCustomData({
                key: "aria-label",
                value: resources.i18n.getText("MeAreaToggleButtonAria"),
                writeToDom: true
            }));

            // create buttons & adjust model BEFORE the me area is added to the view-port
            // otherwise the first buttons of open-catalog and user-settings render
            // before rest of the actions are instantiated thus causing a glitch in the UI
            this._createActionButtons();
            this._setUserPrefModel();

            sap.ui.getCore().getEventBus().publish("launchpad", "Settings");

            oMeAreaView.loaded().then(function (oView) {
                _renderer().addLeftViewPort(oMeAreaView);
            });

            // load search data only after the meArea view is opened for the first time
            // so their request will not be fired every time an application will be
            // opened in a new tab (data is necessary for the settings dialog)
            _renderer().ViewPortContainerAttachAfterSwitchStateAnimationFinished(function (oData) {
                // Me Area opened
                if (oData.getParameter("to") === "LeftCenter" && !this._bSearchPrefsLoaded) {
                    this._getSearchPrefs(); // Search Preferences are loaded asynchronously
                }
            }.bind(this));

        },

        /*
         * OnClick handler of the me area header button
         *
         */
        toggleMeAreaView: function (oMeAreaToggle, bShow) {

            if (!oMeAreaToggle || !oMeAreaToggle.getDomRef()) {
                return; // do nothing if the MeArea toggle button is not rendered
            }
            if (oMeAreaToggle.getSelected() === !!bShow) {
                return; // no change
            }

            var sCurrentShellState = _model().getProperty('/currentState/stateName');
            var oPopoverStates = {
                'embedded' : true,
                'embedded-home' : true,
                'standalone' : true,
                'blank-home' : true,
                'blank' : true
            };

            this._createMeArea();

            if (oPopoverStates[sCurrentShellState] === true) {
                // Open a Popover with Actions.
                this._showActionsInPopOver(oMeAreaToggle);
            } else {
                //Show MeArea
                this._switchToMeAreaView(oMeAreaToggle, bShow);
            }
        },

        _createActionButtons: function () {

            //
            // About button
            //
            if (!sap.ui.getCore().byId("aboutBtn")) {
                var oAboutButton = new sap.ushell.ui.footerbar.AboutButton("aboutBtn");
                if (bEnableHelp) {
                    oAboutButton.addStyleClass('help-id-aboutBtn');// xRay help ID
                }
                _renderer().addShellDanglingControl(oAboutButton);
            }

            //
            // User Settings button
            //
            //in case the user setting button should move to the shell header, it was already created in shell.model.js
            //otherwise, create it as an actionItem in the me area
            if (!sap.ui.getCore().byId("userSettingsBtn") && !_shellConfig().moveUserSettingsActionToShellHeader) {
                var oUserPrefButton = new sap.ushell.ui.launchpad.ActionItem("userSettingsBtn", {
                    id: "userSettingsBtn",
                    text: resources.i18n.getText("userSettings"),
                    icon: 'sap-icon://action-settings'
                });
                if (bEnableHelp) {
                    oUserPrefButton.addStyleClass('help-id-loginDetails');// xRay help ID
                }
                _renderer().addShellDanglingControl(oUserPrefButton);
            }

            //
            // Support Ticket button
            //
            // Only when the contact support button has to be shown in the MeArea
            if (!_shellConfig().moveContactSupportActionToShellHeader) {
                Config.on("/core/extension/SupportTicket").do(
                    function (bConfigured) {
                        // 1) false and no button : do nothing
                        // 2) false and the button exists: probably visible, set visibility to false
                        // 3) true: create the button and set visibility to true
                        var oContactSupport = sap.ui.getCore().byId("ContactSupportBtn");
                        if (bConfigured && !oContactSupport){
                            oContactSupport = new ContactSupportButton("ContactSupportBtn");
                            _renderer().addShellDanglingControl(oContactSupport);
                            if (bEnableHelp) {
                                oContactSupport.addStyleClass('help-id-contactSupportBtn'); // xRay help ID
                            }
                        }
                        oContactSupport && oContactSupport.setVisible(bConfigured);
                    }
                );
            }

            //
            // End User Feedback button
            //
            _model().setProperty('/showEndUserFeedback', false);

            function setEndUserFeedbackButton (oEndUserFeedbackService, oEndUserFeedbackBtn) {
                try {
                    oEndUserFeedbackService.isEnabled()
                        .done(function () {  // The service is enabled
                            _model().setProperty('/showEndUserFeedback', true);
                            var endUserFeedbackConfiguration = _renderer().getEndUserFeedbackConfiguration();

                            if (_shellConfig().moveGiveFeedbackActionToShellHeader) {
                                jQuery.sap.measure.start("FLP:Shell.controller._createActionButtons", "create give feedback as shell head end item", "FLP");
                                //since the EndUserFeedback is not compatible type with shell header end item, creating here the button which will not be shown on the view and trigger its
                                //press method by a shell header end item button that was created in shell.model.js - this is done below the creation of this button
                                var tempBtn = sap.ui.getCore().byId("EndUserFeedbackHandlerBtn");

                                tempBtn.setModel(_model());
                                tempBtn.setShowAnonymous(endUserFeedbackConfiguration.showAnonymous);
                                tempBtn.setAnonymousByDefault(endUserFeedbackConfiguration.anonymousByDefault);
                                tempBtn.setShowLegalAgreement(endUserFeedbackConfiguration.showLegalAgreement);
                                tempBtn.setShowCustomUIContent(endUserFeedbackConfiguration.showCustomUIContent);
                                tempBtn.setFeedbackDialogTitle(endUserFeedbackConfiguration.feedbackDialogTitle);
                                tempBtn.setTextAreaPlaceholder(endUserFeedbackConfiguration.textAreaPlaceholder);
                                tempBtn.setAggregation("customUIContent", endUserFeedbackConfiguration.customUIContent, false);

                                oEndUserFeedbackBtn.attachPress(function () {
                                    tempBtn.firePress();
                                }); // Exception if the button does not exist

                                jQuery.sap.measure.end("FLP:Shell.controller._createActionButtons");

                            } else if (!oEndUserFeedbackBtn) {
                                oEndUserFeedbackBtn = new EndUserFeedback("EndUserFeedbackBtn", {
                                    showAnonymous: endUserFeedbackConfiguration.showAnonymous,
                                    anonymousByDefault: endUserFeedbackConfiguration.anonymousByDefault,
                                    showLegalAgreement: endUserFeedbackConfiguration.showLegalAgreement,
                                    showCustomUIContent: endUserFeedbackConfiguration.showCustomUIContent,
                                    feedbackDialogTitle: endUserFeedbackConfiguration.feedbackDialogTitle,
                                    textAreaPlaceholder: endUserFeedbackConfiguration.textAreaPlaceholder,
                                    customUIContent: endUserFeedbackConfiguration.customUIContent
                                });
                                if (bEnableHelp) {
                                    oEndUserFeedbackBtn.addStyleClass('help-id-EndUserFeedbackBtn'); // xRay help ID
                                }
                                _renderer().addShellDanglingControl(oEndUserFeedbackBtn);
                            }
                            oEndUserFeedbackBtn.setVisible(true);
                        })
                        .fail(function () { // The service is disabled
                            if (oEndUserFeedbackBtn) {
                                oEndUserFeedbackBtn.setVisible(false);
                            }
                        });
                } catch (e) {
                    jQuery.sap.log.error("EndUserFeedback adapter is not found", e.message || e);
                }
            }

            Config.on("/core/extension/EndUserFeedback").do(function (bConfigured) {
                var oEndUserFeedbackBtn = sap.ui.getCore().byId("EndUserFeedbackBtn");
                if (bConfigured) { // Create and set the End User Feedback button
                    sap.ushell.Container.getServiceAsync("EndUserFeedback").then(function (oEndUserFeedbackService) {
                        setEndUserFeedbackButton(oEndUserFeedbackService, oEndUserFeedbackBtn);
                    });
                } else if (oEndUserFeedbackBtn) { // Hide the button, if it was prevoiusly enabled
                    _model().setProperty('/showEndUserFeedback', false);
                    oEndUserFeedbackBtn.setVisible(false);
                }
            });
        },

        /**
         *
         *
         */
        _setUserPrefModel: function () {
            UserPreferences.setModel();
        },

        /**
         *
         *
         */
        _showActionsInPopOver: function (oOpenByControl) {
            var aCurrentStateActions = _model().getProperty('/currentState/actions');
            if (!this.oActionsPopover) {
                this.oActionsLayout = new sap.ui.layout.VerticalLayout();
                this.oActionsPopover = new sap.m.Popover("sapUshellActionsPopover", {//here
                    showHeader: false,
                    placement: sap.m.PlacementType.Bottom,
                    content: this.oActionsLayout
                }).addStyleClass("sapUshellPopupContainer");

            }
            this.oActionsLayout.removeAllContent();
            this._createActionButtons();
            aCurrentStateActions.forEach(function (sActionId, iIndex) {
                var oAction = sap.ui.getCore().byId(sActionId);

                if (oAction && oAction.setActionType) {
                    /*since the factory can be called many times,
                     we need to add the press handler only once.
                     the method below makes sure it is added only once per control
                     the press handler is attached to all actions, and switches the
                     viewport state to "Center" as requested by UX*/
                    //TODO: COMPLETE THIS LOGIC!!
                    //oController._addPressHandlerToActions(oCtrl);
                    this.oActionsLayout.addContent(oAction);
                    oAction.setActionType('standard');
                    oAction.addStyleClass('sapUshellStandardActionItem');
                }
            }.bind(this));
            this.oActionsPopover.setModel(_model());
            this.oActionsPopover.openBy(oOpenByControl);
        },

        _switchToMeAreaView: function (oOpenByControl, bShow) {
            // Toggle viewport
            _renderer().switchViewPortStateByControl(oOpenByControl, bShow ? "LeftCenter" : "Center");
            // recalculate items on MeArea
            _renderer().toggleOverFlowActions();
        },

        _getSearchPrefs: function () {
            function isSearchButtonEnabled () {
                var oModel = _model();
                try {
                    var currentState = oModel.getProperty("/currentState/stateName");
                    return AppLifeCycle.getElementsModel().getBaseStateMember(currentState, "headEndItems").indexOf("sf") != -1;
                } catch (err) {
                    jQuery.sap.log.debug("Shell controller._createWaitForRendererCreatedPromise: search button is not visible.");
                    return false;
                }
            }

            if (isSearchButtonEnabled()){
                // search preferences (user profiling, concept of me)
                // entry is added async only if search is active
                sap.ui.require([
                    'sap/ushell/renderers/fiori2/search/userpref/SearchPrefs',
                    'sap/ushell/renderers/fiori2/search/SearchShellHelperAndModuleLoader'
                ], function (SearchPrefs) {
                    this._bSearchPrefsLoaded = true;
                    var searchPreferencesEntry = SearchPrefs.getEntry();
                    searchPreferencesEntry.isSearchPrefsActive().done(function (isSearchPrefsActive) {
                        if (isSearchPrefsActive) {
                            // Add search as a profile entry
                            _renderer().addUserProfilingEntry(searchPreferencesEntry);
                        }
                    }.bind(this));
                }.bind(this));
            }
        },

        exit : function () {
        }
    });

});
