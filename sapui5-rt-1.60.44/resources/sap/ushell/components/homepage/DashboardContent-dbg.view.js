// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The Fiori launchpad main view.<br>
 * The view is of type <code>sap.ui.jsview</code> that includes a <code>sap.m.page</code>
 * with a header of type <code>sap.ushell.ui.launchpad.AnchorNavigationBar</code>
 * and content of type <code>sap.ushell.ui.launchpad.DashboardGroupsContainer</code>.
 *
 * @version 1.60.40
 * @name sap.ushell.components.homepage.DashboardContent.view
 * @private
 */
sap.ui.define([
    './DashboardGroupsBox',
    'sap/ushell/resources',
    'sap/ushell/ui/launchpad/AnchorItem',
    'sap/ushell/ui/launchpad/AnchorNavigationBar',
    'sap/ushell/EventHub',
    'sap/ushell/utils',
    'sap/ushell/Config',
    'sap/ui/core/InvisibleText',
    "sap/m/library",
    "sap/m/Bar",
    "sap/m/ToolbarSpacer",
    "sap/m/Page",
    "sap/m/FlexBox",
    "sap/m/Button",
    "sap/ui/Device",
    "jquery.sap.global",
    "sap/ui/core/mvc/View"
], function (
    DashboardGroupsBox,
    resources,
    AnchorItem,
    AnchorNavigationBar,
    EventHub,
    oUtils,
    Config,
    InvisibleText,
    oMLib,
    Bar,
    ToolbarSpacer,
    Page,
    FlexBox,
    Button,
    Device,
    jQuery,
    View
) {
	"use strict";

    /*global sap, document*/
    /*jslint plusplus: true, nomen: true, vars: true */

    sap.ui.jsview("sap.ushell.components.homepage.DashboardContent", {

        /**
         * Creating the content of the main dashboard view.
         * The view is basically a sap.m.Page control that contains:
         *  - AnchorNavigationBar as header.
         *  - DashboardGroupsBox that contains the groups and tiles as content.
         */
        createContent: function (oController) {
            var oDashboardGroupsBoxModule,
                oViewPortContainer = sap.ui.getCore().byId("viewPortContainer"),
                bConfigEnableNotificationsPreview,
                oHomepageManager = sap.ushell.components.getHomepageManager ? sap.ushell.components.getHomepageManager() : undefined;

            this.isTouch = Device.system.combi ? false : (Device.system.phone || Device.system.tablet);
            this.isCombi = Device.system.combi;
            this.parentComponent = sap.ui.core.Component.getOwnerComponentFor(this);
            this.oModel = this.getModel();
            this.addStyleClass("sapUshellDashboardView");
            this.ieHtml5DnD = this.oModel.getProperty("/personalization") && oHomepageManager && oHomepageManager.isIeHtml5DnD();
            this.isContentWasRendered = false;

            sap.ui.getCore().getEventBus().subscribe("launchpad", "initialConfigurationSet", this._onAfterDashboardShow, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", 'actionModeInactive', this._handleEditModeChange, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", 'actionModeActive', this._handleEditModeChange, this);
            sap.ui.getCore().getEventBus().subscribe("shell", "changeNotificationPreview", this._enablePreviewNotificationChanged, this);
            sap.ui.getCore().getEventBus().subscribe("shell", "notificationsPreviewContainerCreated", this._notificationsPreviewContainerCreated, this);

            this.aDoableObjects = [
                EventHub.on("CenterViewPointContentRendered").do(this._handleContentRendered.bind(this)),
                EventHub.once("CoreResourcesComplementLoaded").do(this._enableAnchorBarOverflowAndCreateFooter.bind(this))
            ];

            sap.ushell.Container.getRenderer('fiori2').getRouter().getRoute("home").attachMatched(this.onAfterNavigate, this);

            this.addEventDelegate({
                onAfterRendering: function () {
                    function _loadGroups () {
                        var oHomepageManager = sap.ushell.components.getHomepageManager();
                        if (!oHomepageManager.getPreparedGroupModel()) {
                            oHomepageManager.loadPersonalizedGroups();
                        } else {
                            EventHub.once("firstSegmentCompleteLoaded").do(oHomepageManager.handleFirstSegmentLoaded.bind(oHomepageManager));
                        }
                    }
                    window.setTimeout(_loadGroups);
                    this.onAfterNavigate();
                }.bind(this),
                onAfterShow: function () {
                    //in case we came back from the catalog, and groups were added to home page
                    this.getController()._addBottomSpace();
                    //Removed untill the shellModel will know how to handle the viewport, This is causeing the notifications not to appear when in the meArea.
//                    sap.ushell.Container.getRenderer('fiori2').showRightFloatingContainer(false);
                    // call to update shell header title
                    this.getController()._updateShellHeader();
                    this._onAfterDashboardShow();
                }.bind(this),
                onAfterHide: function (evt) {
                }
            });

            this.oAnchorNavigationBar = this._getAnchorNavigationBar(oController);

            oDashboardGroupsBoxModule = new DashboardGroupsBox();
            // Create the DashboardGroupsBox object that contains groups and tiles
            this.oDashboardGroupsBox = oDashboardGroupsBoxModule.createGroupsBox(oController, this.oModel);

            // If NotificationsPreview is enabled by configuration and by the user - then shifting the scaled center viewPort (when moving ot he right viewport) is also enabled.
            // When notification preview in rendered  the dashboard is smaller in width,
            // hence, when it is being scaled it also needs to be shifted in order to "compensate" for the area of the notifications preview
            bConfigEnableNotificationsPreview = this._previewNotificationEnabled();
            if (oViewPortContainer) {
                oViewPortContainer.shiftCenterTransitionEnabled(bConfigEnableNotificationsPreview);
            }

            this.oFilterSelectedGroup = new sap.ui.model.Filter("isGroupSelected", sap.ui.model.FilterOperator.EQ, true);

            this.oFooter =  new Bar('sapUshellDashboardFooter', {
                    visible: {
                        parts: ['/tileActionModeActive', '/viewPortState'],
                        formatter: function (bActionModeActive, sCurrentViewPortState) {
                            // sCurrentViewPortState may be undefined initially
                            return bActionModeActive && (sCurrentViewPortState === 'Center' || sCurrentViewPortState === undefined);
                        }
                    },
                    contentRight:[new ToolbarSpacer()]

            });

            this.oPage = new Page('sapUshellDashboardPage', {
                customHeader: this.oAnchorNavigationBar,
                landmarkInfo: { headerRole: sap.ui.core.AccessibleLandmarkRole.Navigation },
                floatingFooter: true,
                footer: this.oFooter,
                content: [
                    this.oDashboardGroupsBox
                ]
            });

            var fOrigAfterRendering = this.oPage.onAfterRendering;
            this.oPage.onAfterRendering = function () {
                if (fOrigAfterRendering) {
                    fOrigAfterRendering.apply(this, arguments);
                }
                var oDomRef = this.getDomRef(),
                    oScrollableElement = oDomRef.getElementsByTagName('section');

                jQuery(oScrollableElement[0]).off("scrollstop", oController.handleDashboardScroll);
                jQuery(oScrollableElement[0]).on("scrollstop", oController.handleDashboardScroll);
            };

            this.oNotificationsContainer = new FlexBox({
                displayInline: true,
                fitContainer: true,
                items: []
            });

            this.oViewContainer = new FlexBox({
                fitContainer: true,
                alignItems: oMLib.FlexAlignItems.Stretch,
                renderType: oMLib.FlexRendertype.Bare,
                height: '100%',
                items: [this.oPage, this.oNotificationsContainer]
            });

            sap.ui.getCore().getEventBus().publish("sap.ushell.services.Notifications", "enablePreviewNotificationChanged");

            return this.oViewContainer;
        },

        _notificationsPreviewContainerCreated: function (sChannelId, sEventId, oData) {
            this.oNotificationsContainer.addItem(oData.previewNotificationsContainerPlaceholder);
            this.oNotificationsContainer.addItem(oData.previewNotificationsContainer);
        },

        _getAnchorItemTemplate: function () {
            var that = this,
                bHelpEnabled = Config.last("/core/extension/enableHelp");
            var oAnchorItemTemplate = new AnchorItem({
                index : "{index}",
                title: "{title}",
                groupId: "{groupId}",
                defaultGroup: "{isDefaultGroup}",
                writeHelpId: bHelpEnabled,
                selected: false,
                isGroupRendered: "{isRendered}",
                visible: {
                    parts: ["/tileActionModeActive", "isGroupVisible", "visibilityModes"],
                    formatter: function (tileActionModeActive, isGroupVisible, visibilityModes) {
                        //Empty groups should not be displayed when personalization is off or if they are locked or default group not in action mode
                        if (!visibilityModes[tileActionModeActive ? 1 : 0]) {
                            return false;
                        }
                        return isGroupVisible || tileActionModeActive;
                    }
                },
                locked: "{isGroupLocked}",
                isGroupDisabled: {
                    parts: ['isGroupLocked', '/isInDrag', '/homePageGroupDisplay'],
                    formatter: function (bIsGroupLocked, bIsInDrag, sAnchorbarMode) {
                        return bIsGroupLocked && bIsInDrag && sAnchorbarMode === 'tabs';
                    }
                },
                press: function (oEvent) {
                    that.oAnchorNavigationBar.handleAnchorItemPress(oEvent);
                }
            });

            oAnchorItemTemplate.attachBrowserEvent("focus", function () {
                this.setNavigationBarItemsVisibility();
            }.bind(this.oAnchorNavigationBar));

            return oAnchorItemTemplate;
        },

        _getAnchorNavigationBar: function (oController) {
            var oAnchorNavigationBar = new AnchorNavigationBar("anchorNavigationBar", {
                    selectedItemIndex: "{/topGroupInViewPortIndex}",
                    itemPress: [function (oEvent) {
                        this._handleAnchorItemPress(oEvent);
                    }, oController],
                    overflowEnabled: false //we will enable the overflow once coreExt will be loaded!!!
                });
            oAnchorNavigationBar = this._extendAnchorNavigationBar(oAnchorNavigationBar);
            oAnchorNavigationBar.addStyleClass("sapContrastPlus");

            return oAnchorNavigationBar;
        },

        _extendAnchorNavigationBar: function (oAnchorNavigationBar) {
            var oExtendedAnchorNavigationBar = jQuery.extend(oAnchorNavigationBar, {
                onsapskipforward: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.components.homepage.ComponentKeysHandler.goToTileContainer(oEvent, this.bGroupWasPressed);
                    this.bGroupWasPressed = false;
                },
                onsaptabnext: function (oEvent) {
                    oEvent.preventDefault();
                    var jqFocused = jQuery(":focus");
                    if (!jqFocused.parent().parent().siblings().hasClass("sapUshellAnchorItemOverFlow") ||
                        (jqFocused.parent().parent().siblings().hasClass("sapUshellAnchorItemOverFlow") &&
                        jqFocused.parent().parent().siblings().hasClass("sapUshellShellHidden"))) {
                        sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        sap.ushell.components.homepage.ComponentKeysHandler.goToTileContainer(oEvent);
                        this.bGroupWasPressed = false;
                    } else {
                        var jqElement = jQuery(".sapUshellAnchorItemOverFlow button");
                        jqElement.focus();
                    }
                },
                onsapskipback: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                },
                onsaptabprevious: function (oEvent) {
                    oEvent.preventDefault();
                    var jqFocused = jQuery(":focus");
                    if (!jqFocused.parent().hasClass("sapUshellAnchorItemOverFlow")) {
                        sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                    } else {
                        var jqElement = jQuery(".sapUshellAnchorItem:visible:first");
                        if (!jqElement.length) {
                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                        } else {
                            sap.ushell.components.homepage.ComponentKeysHandler.goToSelectedAnchorNavigationItem();
                        }
                    }
                },
                onsapenter: function (oEvent) {
                    oEvent.srcControl.getDomRef().click();
                },
                onsapspace: function (oEvent) {
                    oEvent.srcControl.getDomRef().click();
                }
            });
            return oExtendedAnchorNavigationBar;
        },

        _addActionModeButtonsToDashboard: function () {
            if (sap.ushell.components.homepage.ActionMode) {
                sap.ushell.components.homepage.ActionMode.init(this.getModel());
            }
        },

        _createActionModeMenuButton : function () {
            var that = this,
                oAddActionButtonParameters = {},
                oActionButtonObjectData = {
                    id: "ActionModeBtn",
                    text: resources.i18n.getText("activateEditMode"),
                    icon: 'sap-icon://edit',
                    press: function () {
                        this.oDashboardGroupsBox.getBinding("groups").filter([]);
                        var dashboardGroups = this.oDashboardGroupsBox.getGroups();
                        sap.ushell.components.homepage.ActionMode.toggleActionMode(this.oModel, "Menu Item", dashboardGroups);
                        this._updateAnchorNavigationBarVisibility();
                        var view = sap.ui.getCore().byId('viewPortContainer');
                        if (view.getCurrentState() !=  "Center"){
                            sap.ui.getCore().byId("viewPortContainer").switchState("Center");
                        }
                        if (this.oModel.getProperty("/homePageGroupDisplay") !== "scroll") {
                            if (this.oModel.getProperty("/tileActionModeActive")) { // To edit mode
                                if (this.oModel.getProperty("/homePageGroupDisplay") === "tabs") {
//                                    this.oDashboardGroupsBox.removeLinksFromUnselectedGroups();
                                    this.oDashboardGroupsBox.getBinding("groups").filter([]);
                                    // find the selected group
                                    var aGroups = this.oModel.getProperty("/groups"),
                                        selectedGroup;
                                    for (var i = 0; i < aGroups.length; i++) {
                                        if (aGroups[i].isGroupSelected) {
                                            selectedGroup = i;
                                            break;
                                        }
                                    }
                                    // scroll to selected group
                                    this.getController()._scrollToGroup("launchpad", "scrollToGroup", {
                                        group: {
                                            getGroupId: function () {
                                                return aGroups[selectedGroup].groupId;
                                            }
                                        },
                                        groupChanged: false,
                                        focus: true
                                    });
                                } else {
                                    this.oDashboardGroupsBox.getBinding("groups").filter([]);
                                }
                            } else { // To non-edit mode
                                this.getController()._deactivateActionModeInTabsState();
                            }
                        }
                    }.bind(this)
                };
            //in case the edit home page button was moved to the shell header, it was already created as an icon only in shell.model.js so it will be shown immidiatly in the header.
            //only here we have access to the text and press method
            this.oTileActionsButton = sap.ui.getCore().byId(oActionButtonObjectData.id);
            if (this.oTileActionsButton && this.oTileActionsButton.data("isShellHeader")){
                jQuery.sap.measure.start("FLP:DashboardContent,view._createActionModeMenuButton", "attach press and text to edit home page button","FLP");
                this.oTileActionsButton.setTooltip(oActionButtonObjectData.text);
                this.oTileActionsButton.setText(oActionButtonObjectData.text);
                if (!this.bTileActionsButtonPressAttached) {
                    //Don't need to attached the press handler second time when dashboardExtendedShellState is recreated
                    this.oTileActionsButton.attachPress(oActionButtonObjectData.press);
                    this.bTileActionsButtonPressAttached = true;
                }
                jQuery.sap.measure.end("FLP:DashboardContent,view._createActionModeMenuButton");
            } else {
                oAddActionButtonParameters.controlType = "sap.ushell.ui.launchpad.ActionItem";
                oAddActionButtonParameters.oControlProperties = oActionButtonObjectData;
                oAddActionButtonParameters.bIsVisible = true;
                oAddActionButtonParameters.bCurrentState = true;

                sap.ushell.Container.getRenderer("fiori2").addUserAction(oAddActionButtonParameters).done(function (oActionButton) {
                    that.oTileActionsButton = oActionButton;
                    // if xRay is enabled
                    if (Config.last("/core/extension/enableHelp")) {
                        that.oTileActionsButton.addStyleClass('help-id-ActionModeBtn');// xRay help ID
                    }
                });
            }
        },

        _handleEditModeChange: function () {
            if (this.oTileActionsButton) {
                this.oTileActionsButton.toggleStyleClass('sapUshellAcionItemActive');
            }
        },

        _enablePreviewNotificationChanged: function (sChannelId, sEventId, oData) {
            this.oModel.setProperty("/userEnableNotificationsPreview", oData.bUserEnableNotificationsPreview);
            this.oDashboardGroupsBox.toggleStyleClass("sapUshellDashboardGroupsContainerSqueezed", oData.bUserEnableNotificationsPreview);
            this.oAnchorNavigationBar.toggleStyleClass("sapUshellAnchorNavigationBarSqueezed", oData.bUserEnableNotificationsPreview);
            this.oNotificationsContainer.setVisible(oData.bUserEnableNotificationsPreview);
        },

        /**
         * In order to minimize core-min we delay the footer creation and enabling anchorBar overflow
         * till core-ext file will be loaded.
         * This is done so Popover, OverflowToolbal, List and other controls will bondled with core-ext
         * and not core-min
         */
        _enableAnchorBarOverflowAndCreateFooter: function (sChannelId, sEventId, oData) {
            if (this.oDoneBtn){
                return;
            }

            this.oAnchorNavigationBar.setOverflowEnabled(true);
            if (!this.oButtonLabelledBy){
                this.oButtonLabelledBy = new InvisibleText({
                    text : resources.i18n.getText("closeEditMode")
                });
                this.oButtonLabelledBy.toStatic();
            }
            this.oDoneBtn = new Button('sapUshellDashboardFooterDoneBtn', {
                type: oMLib.ButtonType.Emphasized,
                text : resources.i18n.getText("closeEditMode"),
                ariaLabelledBy: this.oButtonLabelledBy.getId(),
                press: function () {
                    jQuery("#sapUshellDashboardPage .sapUshellAnchorNavigationBarSqueezed").toggleClass("sapUshellAnchorBarEditMode");
                    var dashboardGroups = this.oDashboardGroupsBox.getGroups();
                    sap.ushell.components.homepage.ActionMode.toggleActionMode(this.oModel, "Menu Item", dashboardGroups);
                    this._updateAnchorNavigationBarVisibility();
                    if (this.oModel.getProperty("/homePageGroupDisplay") && this.oModel.getProperty("/homePageGroupDisplay") === "tabs") {
                        this.getController()._deactivateActionModeInTabsState();
                    }
                }.bind(this)
            });
            this.oDoneBtn.addEventDelegate({
                onsapskipforward: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                },
                onsapskipback: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.components.homepage.ComponentKeysHandler.goToFirstVisibleTileContainer();
                },
                onsaptabprevious: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.components.homepage.ComponentKeysHandler.goToFirstVisibleTileContainer();
                },
                onsaptabnext: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                }
            });

            this.oFooter.addContentRight(this.oDoneBtn);
        },

        /**
         * Returns a boolean value indicating whether notifications preview is enabled by the configuration and by the user
         */
        _previewNotificationEnabled: function () {
            var bConfigEnableNotificationsPreview = this.oModel.getProperty("/configEnableNotificationsPreview"),
                bUserEnableNotificationsPreview = this.oModel.getProperty("/userEnableNotificationsPreview");

            return (bConfigEnableNotificationsPreview && bUserEnableNotificationsPreview);
        },

        _createActionButtons : function () {
            var bEnablePersonalization = this.oModel.getProperty("/personalization");
            // Create action mode button in the user actions menu
            if (bEnablePersonalization) {
                if (this.oModel.getProperty("/enableActionModeMenuButton")) {
                    this._createActionModeMenuButton();
                }
            }
        },

        onAfterNavigate: function (oEvent) {
            var oRenderer = sap.ushell.Container.getRenderer && sap.ushell.Container.getRenderer("fiori2"),
                bInDashboard = oRenderer && oRenderer.getCurrentCoreView() === "home",
                editHomePageBtn = sap.ui.getCore().byId("ActionModeBtn");
            //need to show the edit home page button if it is in the shellheader
            if (editHomePageBtn){
                if (editHomePageBtn.data){
                    if (editHomePageBtn.data("isShellHeader")){
                        editHomePageBtn.setVisible(true);
                    }
                }
            }
            //toggle the overflow container in the me area
            if (oRenderer && oRenderer.toggleOverFlowActions){
                oRenderer.toggleOverFlowActions();
            }
            if (bInDashboard && oRenderer) {
                oUtils.refreshTiles();
                //The dashboardExtendedShellState created every time when go back to home page
                oRenderer.createExtendedShellState("dashboardExtendedShellState", function () {
                    this._createActionButtons();

                    if (!Device.system.phone) {
                        oRenderer.showRightFloatingContainer(false);
                    }
                }.bind(this));

                this.getController()._setCenterViewPortShift();

                //Add action menu items
                this._addActionModeButtonsToDashboard();
                this._updateAnchorNavigationBarVisibility();

                setTimeout(function () {
                    if (sap.ushell.Container && oRenderer) {
                        oRenderer.applyExtendedShellState("dashboardExtendedShellState");
                    }
                }, 0);

                // in rare timing cases the activeElement is undefined thus causing an exception
                if (document.activeElement && document.activeElement.tagName === "BODY") {
                    //set focus back to the shell header
                    sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell();
                }

            }
        },

        _handleContentRendered: function (oEvent) {
            if (!this.isContentWasRendered && oEvent.groups > -1) {
                this.isContentWasRendered = true;
                this._onAfterDashboardShow(oEvent);
                var oConfigMarks = {bUseUniqueMark: true};
                oUtils.setPerformanceMark("FLP-TTI-Homepage", oConfigMarks);
                oUtils.setPerformanceMeasure("FLP-TTI-Hompage");
            } else {
                this._onAfterDashboardShow(oEvent);
            }
        },

        _focusOnDomElement: function (oDomElemet) {
            if (oDomElemet) {
                setTimeout(function () {
                    oDomElemet.focus();
                }, 0);
            }
        },

        _onAfterDashboardShow : function (oEvent) {

            if (!this.isContentWasRendered) {
                //Can happend when we go to home page from application (application was oppened before home page)
                this._focusOnDomElement(jQuery("#configBtn"));
                return;
            }
            var aJqTileContainers = jQuery('.sapUshellTileContainer:visible'),
                oViewPortContainer = sap.ui.getCore().byId('viewPortContainer'),
                bIsInDashboard = sap.ushell.Container.getRenderer("fiori2").getCurrentCoreView() === "home",
                bTileActionsModeActive = this.oModel.getProperty('/tileActionModeActive'),
                bPreviewNotificationsActive;

            if (bIsInDashboard) {
                if (!bTileActionsModeActive) {
                    oUtils.handleTilesVisibility();
                    var iTopGroupInViewPortIndex = this.oModel.getProperty('/topGroupInViewPortIndex'),
                        jqTopGroupInViewPort = jQuery(aJqTileContainers[iTopGroupInViewPortIndex]),
                        jqLastFocusedTile = aJqTileContainers.find("li[class*='sapUshellTile']li[tabindex=0]"),
                        jqFirstTile = jqTopGroupInViewPort.find('.sapUshellTile:first'),
                        jqElementToFocus;

                    // if we have a last focused element - this is the element to focus
                    if (jqLastFocusedTile.length) {
                        jqElementToFocus = jqLastFocusedTile;
                    // if we do not have a last focused element - see if we have a tile (first of a group) to focus on
                    } else if (jqFirstTile.length) {
                        jqElementToFocus = jqFirstTile;
                    // no tiles exist - focus on config button
                    } else {
                        jqElementToFocus = jQuery("#configBtn");
                    }

                    // The ViewPortContainer needs to be notified whether Preview of NotificationsPreview is enabled or not,
                    //  since it has effect on the transition of the scaled center viewPort when switching to the right viewport
                    bPreviewNotificationsActive = this.oModel.getProperty('/enableNotificationsPreview');
                    if (oViewPortContainer) {
                        oViewPortContainer.shiftCenterTransition(bPreviewNotificationsActive);
                    }

                    this._focusOnDomElement(jqElementToFocus);
                }
                this.onAfterNavigate();
            }
        },

        _updateAnchorNavigationBarVisibility: function () {
            var bOldVisible = this.oPage.getShowHeader(),
                aVisibleGroups = this.oAnchorNavigationBar.getVisibleGroups(),
                bVisible = aVisibleGroups.length > 1;

            this.oPage.setShowHeader(bVisible);

            if (bVisible && !bOldVisible) {
                var aGroups = this.getModel().getProperty("/groups"),
                    iSelectedGroup = this.getModel().getProperty("/iSelectedGroup");

                for (var i = 0; i < aVisibleGroups.length; i++) {
                    if (aVisibleGroups[i].getGroupId() === aGroups[iSelectedGroup].groupId) {
                        this.oAnchorNavigationBar.setSelectedItemIndex(i);
                        break;
                    }
                }
            }
        },

        getControllerName: function () {
            return "sap.ushell.components.homepage.DashboardContent";
        },

        _isInDeashboard: function () {
            var oNavContainer = sap.ui.getCore().byId("viewPortContainer"),
                oControl = sap.ui.getCore().byId("dashboardGroups");

            return ((oNavContainer.getCurrentCenterPage() === "application-Shell-home") && (oControl.getModel().getProperty("/currentViewName") === "home"));
        },

        exit: function () {
            if (this.oAnchorNavigationBar) {
                this.oAnchorNavigationBar.handleExit();
                this.oAnchorNavigationBar.destroy();
            }
            if (this.oTileActionsButton) {
                this.oTileActionsButton.destroy();
            }
            View.prototype.exit.apply(this, arguments);

            if (this.aDoableObjects) {
                this.aDoableObjects.forEach(function (oDoable){oDoable.off();});
            }

            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "initialConfigurationSet", this._onAfterDashboardShow, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", 'actionModeInactive', this._handleEditModeChange, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", 'actionModeActive', this._handleEditModeChange, this);
            sap.ui.getCore().getEventBus().unsubscribe("shell", "changeNotificationPreview", this._enablePreviewNotificationChanged, this);
            sap.ui.getCore().getEventBus().unsubscribe("shell", "notificationsPreviewContainerCreated", this._notificationsPreviewContainerCreated, this);
        }
    });
}, /* bExport= */ false);
