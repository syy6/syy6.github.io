sap.ui.require.preload({
	"sap/ushell/components/homepage/ActionMode.js":function(){// ${copyright}
/**
 * @fileOverview
 * Tile action mode implementation.
 *
 * In tile action mode the user can launch an action associated with a tile.
 * The mode is launched when clicking on one of the two activation buttons:
 * 1. In the user menu
 * 2. A floating button on the bottom-right corner on the launchpad.
 * Creation of the buttons depends on the following configuration properties:
 *  - enableActionModeMenuButton
 *  - enableActionModeFloatingButton
 *
 * Tile action mode can be activated only from the launchpad. it is not accessible from the catalog or from an application.
 * When the mode is active and the user clicks on a tile - the tile's corresponding actions are presented in an action sheet
 *  and the user can click/launch any of them.
 *
 * Every user action (e.g. menu buttons, drag-and-drop) except for clicking a tile - stops/deactivates the action mode.
 *
 * This module Contains the following:
 *  - Constructor function that creates action mode activation buttons
 *  - Activation handler
 *  - Deactivation handler
 *  - Rendering tile action menu
 *
 * @version ${version}
 */
/**
 * @namespace
 *
 * @name sap.ushell.components.homepage.ActionMode
 *
 * @since 1.26.0
 * @private
 */
sap.ui.define([
    "sap/ushell/utils/WindowUtils"
], function (WindowUtils) {
    "use strict";

    /*global jQuery, sap, window, hasher, $ */
    /*jslint nomen: true */
    /**
     * Constructor function
     * Creates action mode activation buttons:
     *  1. A new button in the user menu
     *  2. A floating button
     */
    var ActionMode = function () {
            this.oEventBus = sap.ui.getCore().getEventBus();
            this.oEventBus.subscribe('launchpad', 'actionModeInactive', this.scrollToViewPoint, this);
            this.oEventBus.subscribe('launchpad', 'actionModeActive', this.scrollToViewPoint, this);

            this.viewPoint = undefined;

            this.init = function (oModel) {
                this.oModel = oModel;
            };
        };

   /**
    * Activation handler of tile actions mode
    *
    * Performs the following actions:
    * - Shows a toast message indicating the activated mode
    * - Sets the feature's model property to indicate that the feature is activated
    * - Registers deactivation click handler, called when the user clicks outside of a tile
    * - Adds the cover DIV to all tiles adding the mode's grey opacity and click handler for opening the actions menu
    * - Disables drag capability on tiles
    * - Changes the appearance of the floating activation button
    */
    ActionMode.prototype.activate = function () {
        var oTileActionsButton;

        this.oModel.setProperty('/tileActionModeActive', true);
        this.aOrigHiddenGroupsIds = sap.ushell.utils.getCurrentHiddenGroupIds(this.oModel);
        var oDashboardGroups = sap.ui.getCore().byId("dashboardGroups");
        oDashboardGroups.addLinksToUnselectedGroups();

        // Change action mode button display in the user actions menu
        oTileActionsButton = sap.ui.getCore().byId("ActionModeBtn");
        if (oTileActionsButton) {
            oTileActionsButton.setTooltip(sap.ushell.resources.i18n.getText("exitEditMode"));
            oTileActionsButton.setText(sap.ushell.resources.i18n.getText("exitEditMode"));
            if (oTileActionsButton.data("isShellHeader")){
                oTileActionsButton.setSelected(true);
            }
        }
        this.oEventBus.publish('launchpad', 'actionModeActive');
    };

    ActionMode.prototype.scrollToViewPoint = function () {
        var oData = this.viewPoint;
        oData.restoreLastFocusedTile = true;

        // if we switch from edit mode to non-edit mode
        if (!this.oModel.getProperty('/tileActionModeActive')) {

            // if before me switch to non-edit mode we were focused on the TileContainer header
            // we need to restore focus such as the tile that will be focused will belong to this group
            var jqLastFocusedHeader = jQuery(".sapUshellTileContainerHeader[tabindex=0]");
            if (jqLastFocusedHeader && jqLastFocusedHeader.length > 0) {
                var jqTileContainer = jqLastFocusedHeader[0].closest('.sapUshellTileContainer');
                if (jqTileContainer) {

                    // adding the focused header tile-container ID
                    oData.restoreLastFocusedTileContainerById = jqTileContainer.id;
                }
            }

        }

        oData.iDuration = 0;
        window.setTimeout(jQuery.proxy(this.oEventBus.publish, this.oEventBus, "launchpad", "scrollToGroup", oData), 0);
    };

    /**
     * Deactivation handler of tile actions mode
     *
     * Performs the following actions:
     * - Unregisters deactivation click handler
     * - Sets the feature's model property to indicate that the feature is deactivated
     * - Enables drag capability on tiles
     * - Destroys the tile actions menu control
     * - Removed the cover DIV from to all the tiles
     * - Adds the cover DIV to all tiles adding the mode's grey opacity and click handler for opening the actions menu
     * - Changes the appearance of the floating activation button
     */
    ActionMode.prototype.deactivate = function () {
        var tileActionsMenu = sap.ui.getCore().byId("TileActions"),
            oTileActionsButton;

        this.oModel.setProperty('/tileActionModeActive', false);
        this.oEventBus.publish("launchpad", 'actionModeInactive', this.aOrigHiddenGroupsIds);
        if (tileActionsMenu !== undefined) {
            tileActionsMenu.destroy();
        }
        sap.ui.require(['sap/m/MessageToast'],
            function (MessageToast) {
                MessageToast.show(sap.ushell.resources.i18n.getText("savedChanges"), {duration: 4000});
            });
        // Change action mode button display in the user actions menu
        oTileActionsButton = sap.ui.getCore().byId("ActionModeBtn");
        if (oTileActionsButton) {
            oTileActionsButton.setTooltip(sap.ushell.resources.i18n.getText("activateEditMode"));
            oTileActionsButton.setText(sap.ushell.resources.i18n.getText("activateEditMode"));
            if (oTileActionsButton.data("isShellHeader")) {
                oTileActionsButton.setSelected(false);
            }
        }
    };

    ActionMode.prototype.toggleActionMode = function (oModel, sSource, dashboardGroups) {
        var bTileActionModeActive = oModel.getProperty('/tileActionModeActive'),
            currentGroupIndex = oModel.getProperty('/topGroupInViewPortIndex'),
            sHomePageGroupDisplay = oModel.getProperty("/homePageGroupDisplay"),
            aGroups = oModel.getProperty("/groups") || [],
            iFirstVisibleGroup = null,
            iNumberVisibleGroup = 0;

        if (!dashboardGroups) {
            dashboardGroups = [];
        }
        var visibleGroups = dashboardGroups.filter(function (group) {
            return group.getVisible();
        });

        //Edit mode can change the group header visibility
        aGroups.forEach(function (oGroup, i) {
            if (oGroup.isGroupVisible && oGroup.visibilityModes[bTileActionModeActive ? 0 : 1]) {
                iNumberVisibleGroup += 1;
                if (iFirstVisibleGroup === null) {
                    iFirstVisibleGroup = i;
                }
                //Don't trigget rendering here
                //Rendering will be trigger later when set /tileActionModeActive
                oGroup.showGroupHeader = true;
            }
        });
        //AnchorNavigationBar is not shown when there is only 1 visible group. If there are more than 1 visible group, header of the first group is hidden
        if (iNumberVisibleGroup > 1) {
            aGroups[iFirstVisibleGroup].showGroupHeader = false;
        }

        var currentGroup = visibleGroups[currentGroupIndex];
        if (currentGroup) {
            var editModelDelta = bTileActionModeActive ? -49 : 49;
            var domRef = (sHomePageGroupDisplay === "tabs") ? dashboardGroups[0].getDomRef() : currentGroup.getDomRef();
            var iSkipScrollTo = 0;
            if (domRef) {
                iSkipScrollTo = domRef.offsetTop;
            }
            var groupScrolled = document.getElementById("sapUshellDashboardPage-cont").scrollTop - iSkipScrollTo;
            this.viewPoint = {
                group: visibleGroups[currentGroupIndex],
                fromTop: groupScrolled + editModelDelta
            };
        } else {
            this.viewPoint = {fromTop: 0};
        }


        if (bTileActionModeActive) {
            this.deactivate();
        } else {
            this.activate();
        }
    };

    /**
     * Apply action/edit mode CSS classes on a group.
     * This function is called when in edit/action mode and tiles were dragged,
     *  since the group is being re-rendered and the dashboard is still in action/edit mode
     */
    ActionMode.prototype.activateGroupEditMode = function (oGroup) {
        var jqGroupElement = jQuery(oGroup.getDomRef()).find('.sapUshellTileContainerContent');

        jqGroupElement.addClass("sapUshellTileContainerEditMode");
    };

   /**
    * Opens the tile menu, presenting the tile's actions
    *
    * Performs the following actions:
    * - Returning the clicked tile to its original appearance
    * - Tries to get an existing action sheet in case actions menu was already opened during this session of action mode
    * - If this is the first time the user opens actions menu during this session of action mode - create a new action sheet
    * - Gets the relevant tile's actions from launch page service and create buttons accordingly
    * - Open the action sheet by the clicked tile
    *
    * @param oEvent Event object of the tile click action
    */
    ActionMode.prototype._openActionsMenu = function (oEvent, oView) {
        var that = this,
            oTileControl = oView ? oView : oEvent.getSource(),
            launchPageServ =  sap.ushell.Container.getService("LaunchPage"),
            aActions = [],
            oActionSheet = sap.ui.getCore().byId("TileActions"),
            index,
            noActionsButton,
            oButton,
            oAction,
            oTile,
            fnHandleActionPress,
            coverDiv,
            actionSheetIconInEditMode;

        if (oTileControl) {
            oTile = oTileControl.getBindingContext().getObject().object;
            aActions = launchPageServ.getTileActions(oTile);
        }
        that.oTileControl = oTileControl;
        jQuery(".sapUshellTileActionLayerDivSelected").removeClass("sapUshellTileActionLayerDivSelected");

        coverDiv = jQuery(oEvent.getSource().getDomRef()).find(".sapUshellTileActionLayerDiv");
        coverDiv.addClass("sapUshellTileActionLayerDivSelected");
        if (oActionSheet === undefined) {
            oActionSheet = new sap.m.ActionSheet("TileActions", {
                placement: sap.m.PlacementType.Bottom,
                afterClose: function () {
                    $(".sapUshellTileActionLayerDivSelected").removeClass("sapUshellTileActionLayerDivSelected");
                    var oEventBus = sap.ui.getCore().getEventBus();
                    oEventBus.publish("dashboard", "actionSheetClose", that.oTileControl);
                }
            });
        } else {
            oActionSheet.destroyButtons();
        }


        // in a locked group we do not show any action (this is here to prevent the tile-settings action added by Dynamic & Static tiles from being opened)
        // NOTE - when removeing this check (according to requirements by PO) - we must disable the tileSettings action in a different way
        if (aActions.length === 0 || oTileControl.oParent.getProperty("isGroupLocked")) {
            // Create a single button for presenting "Tile has no actions" message to the user
            noActionsButton = new sap.m.Button({
                text:  sap.ushell.resources.i18n.getText("tileHasNoActions"),
                enabled: false
            });
            oActionSheet.addButton(noActionsButton);
        } else {
            /*eslint-disable no-loop-func*/
            /*eslint-disable wrap-iife*/
            for (index = 0; index < aActions.length; index++) {
                oAction = aActions[index];
                // The press handler of a button (representing a single action) in a tile's action sheet
                fnHandleActionPress = function (oAction) {
                    return function () {
                        that._handleActionPress(oAction, oTileControl);
                    };
                }(oAction);
                oButton = new sap.m.Button({
                    text:  oAction.text,
                    icon:  oAction.icon,
                    press: fnHandleActionPress
                });
                oActionSheet.addButton(oButton);
            }
            /*eslint-enable no-loop-func*/
            /*eslint-enable wrap-iife*/
        }
        actionSheetIconInEditMode = oEvent.getSource().getActionSheetIcon ? oEvent.getSource().getActionSheetIcon() : undefined;
        //For tiles - actions menu is opened by "more" icon, for links, there is an action button
        //Which cannot be controlled by FLP code.
        //In case of link, we first try to access the "more" button and open an action sheet by it.
        //Otherwise the action sheet will not be located under the "more" button and other weird things will happen.
        if (actionSheetIconInEditMode) {
            oActionSheet.openBy(actionSheetIconInEditMode);
        } else {
            var oMoreAction = sap.ui.getCore().byId(oEvent.getSource().getId() + "-action-more");
            if (oMoreAction) {
                oActionSheet.openBy(oMoreAction);
            } else {
                oActionSheet.openBy(oEvent.getSource());
            }
        }
    };

    /**
     * Press handler of a button (representing a single action) in a tile's action sheet
     *
     * @param oAction The event object initiated by the click action on an element in the tile's action sheet.
     *               In addition to the text and icon properties, oAction contains one of the following:
     *               1. A "press" property that includes a callback function.
     *                  In this case the action (chosen by the user) is launched by calling the callback is called
     *               2. A "targetUrl" property that includes either a hash part of a full URL.
     *                  In this case the action (chosen by the user) is launched by navigating to the URL
     */
    ActionMode.prototype._handleActionPress = function (oAction, oTileControl) {
        if (oAction.press) {
            oAction.press.call(oAction, oTileControl);
        } else if (oAction.targetURL) {
            if (oAction.targetURL.indexOf("#") === 0) {
                hasher.setHash(oAction.targetURL);
            } else {
                WindowUtils.openURL(oAction.targetURL, '_blank');
            }
        } else {
            sap.ui.require(['sap/m/MessageToast'],
                function (MessageToast) {
                    MessageToast.show("No Action");
                });
        }
    };

    return new ActionMode();

}, /* bExport= */ true);
},
	"sap/ushell/components/homepage/Component.js":function(){// ${copyright}
sap.ui.define(
    [
        'sap/ushell/components/HomepageManager',
        'sap/ushell/resources',
        'sap/ui/core/UIComponent',
        'sap/ushell/components/homepage/ComponentKeysHandler',
        'sap/ushell/UserActivityLog',
        'sap/ushell/Config',
        'sap/ushell/bootstrap/common/common.load.model',
        "sap/ushell/components/SharedComponentUtils"
    ], function (
        HomepageManager,
        resources,
        UIComponent,
        ComponentKeysHandler,
        UserActivityLog,
        Config,
        oModelWrapper,
        oSharedComponentUtils
    ) {
    "use strict";

    return UIComponent.extend("sap.ushell.components.homepage.Component", {

        metadata: {
            version: "${version}",

            library: "sap.ushell.components.homepage",

            dependencies: {
                libs: ["sap.m"]
            },
            config: {
                semanticObject: 'Shell',
                action: 'home',
                title: resources.i18n.getText("homeBtn_tooltip"),
                fullWidth: true,
                hideLightBackground: true
            }
        },

        init: function () {

            // Tried to extract almost all of createContent.
            //this.isEmbedded = !sap.ushell.Container.isMock;

            // model instantiated by the model wrapper
            this.oModel = oModelWrapper.getModel();
            this.setModel(this.oModel);

            // This needs to be called _after_ the model is created
            UIComponent.prototype.init.apply(this, arguments);

            //TODO: Please remove all 'NewHomepageManager' references after complete alignment!
            var oDashboardMgrData = {
                model : this.oModel,
                view : this.oDashboardView
            };
            this.oHomepageManager = new HomepageManager("dashboardMgr",oDashboardMgrData);

            this.setModel(resources.i18nModel, "i18n");

            sap.ui.getCore().getEventBus().subscribe("sap.ushell.services.UsageAnalytics", "usageAnalyticsStarted", function () {
                sap.ui.require(["sap/ushell/components/homepage/FLPAnalytics"]);
            });

            oSharedComponentUtils.toggleUserActivityLog();

            //don't use the returned promise but register to the config change
            //for future config changes
            oSharedComponentUtils.getEffectiveHomepageSetting("/core/home/homePageGroupDisplay", "/core/home/enableHomePageSettings");
            Config.on("/core/home/homePageGroupDisplay").do(function (sNewDisplayMode) {
                this.oHomepageManager.handleDisplayModeChange(sNewDisplayMode);
            }.bind(this));

            oSharedComponentUtils.getEffectiveHomepageSetting("/core/home/sizeBehavior", "/core/home/sizeBehaviorConfigurable");
            Config.on("/core/home/sizeBehavior").do(function (sSizeBehavior) {
                var oModel = this.oHomepageManager.getModel();

                oModel.setProperty("/sizeBehavior", sSizeBehavior);
            }.bind(this));

            this.setInitialConfiguration();
        },

        createContent: function () {
            this.oDashboardView = sap.ui.view({
                viewName: "sap.ushell.components.homepage.DashboardContent",
                type: "JS",
                async: true
            });
            return this.oDashboardView;
        },

        setInitialConfiguration: function () {
            sap.ui.getCore().getEventBus().publish("launchpad", "initialConfigurationSet");
        },

        exit : function () {
            oModelWrapper.unsubscribeEventHandlers();
            this.oHomepageManager.destroy();
        }
    });

});
},
	"sap/ushell/components/homepage/ComponentKeysHandler.js":function(){// ${copyright}

sap.ui.define([
    'sap/ushell/ui/launchpad/AccessibilityCustomData',
    'sap/ushell/EventHub'
], function (AccessibilityCustomData, EventHub) {
    "use strict";

    /*global window*/

    var ComponentKeysHandler = function () { };

    ComponentKeysHandler.prototype = {
        keyCodes: jQuery.sap.KeyCodes,

        // this static member represents tab-index 0 for the tile-to-focus on
        // (see setTileFocus method)
        tileFocusCustomData: new AccessibilityCustomData({
            key: "tabindex",
            value: "0",
            writeToDom: true
        }),

        goToTileContainer: function () {
            if (this.oModel.getProperty('/tileActionModeActive')) {
                this.goToFirstVisibleTileContainer();
            } else {
                this.goToLastVisitedTile();
            }
        },

        goToFirstVisibleTileContainer: function () {
            var jqGroups = jQuery('#dashboardGroups').find('.sapUshellTileContainer:visible'),
                topGroupInViewPortIndex = this.oModel.getProperty("/topGroupInViewPortIndex");

            if (jqGroups.length) {
                var jqGroup = jQuery(jqGroups.get(topGroupInViewPortIndex));

                if (jqGroup.length) {
                    this._setTileContainerSelectiveFocus(jqGroup);
                }
            }
        },

        // Go to last visited tile.
        // In general, FLP should remember last focused tile, and refocus it when tabbing into the tiles container.
        // There are cases where there is no-last focused tile, and in those cases a default behavior will be applied,
        // that is, selecting the first tile.
        goToLastVisitedTile: function (jqTileContainerToLookUnder, bLookInGivenGroup) {
            var jqDefaultTile, jqLastVisitedTile, jqLastVisitedLink;
            if (bLookInGivenGroup) {
                var jqTileContainers = jQuery('#dashboardGroups').find('.sapUshellTileContainer:visible'),
                    topGroupInViewPortIndex = this.oModel.getProperty("/topGroupInViewPortIndex");

                // resolving and setting the tile-container under which we will look
                var jqTileContainer = jqTileContainerToLookUnder || jQuery(jqTileContainers.get(topGroupInViewPortIndex));

                jqDefaultTile = jqTileContainer.find(".sapUshellTile:visible:first");
                jqLastVisitedTile = jqTileContainer.find(".sapUshellTile:visible[tabindex=0]");
                jqLastVisitedLink = jqTileContainer.find(".sapMGTLineMode:visible[tabindex=0]");

                if (jqDefaultTile.length === 0) {
                    jqDefaultTile = jQuery(".sapUshellTile:visible:first");
                }
            } else {
                jqDefaultTile = jQuery(".sapUshellTile:visible:first");
                jqLastVisitedTile = jQuery(".sapUshellTile:visible[tabindex=0]");
                jqLastVisitedLink = jQuery(".sapMGTLineMode:visible[tabindex=0]");
            }

            if (jqLastVisitedTile.length) {
                this._moveScrollDashboard(jqLastVisitedTile);
            } else if (jqLastVisitedLink.length) {
                this._moveScrollDashboard(jqLastVisitedLink);
            } else if (jqDefaultTile.length) {
                jqDefaultTile.attr("tabindex", "0");
                this._moveScrollDashboard(jqDefaultTile);
            }
        },

        _goToFirstTileOfNextGroup: function (sDirection, oEvent) {
            this._preventDefault(oEvent);

            var oInfo = this._getGroupAndTilesInfo();

            if (oInfo) {
                var oNextGroup = this._getNextGroup(sDirection, oInfo.oGroup, false, true);
                if (oNextGroup) {
                    this._goToTileOfGroup("first", oNextGroup);
                }
            }
        },

        _goToTileOfGroup: function (vPosition, oGroup) {
            if (oGroup) {
                var aContent = oGroup.getTiles();

                if (this.oModel.getProperty('/tileActionModeActive')) {
                    aContent.push(oGroup.oPlusTile);
                }

                aContent = aContent.concat(oGroup.getLinks());

                vPosition = vPosition === "first" ? 0 : vPosition;
                vPosition = vPosition === "last" ? aContent.length - 1 : vPosition;

                var oTile = aContent[vPosition];

                if (oTile && oTile.getDomRef()) {

                    var jqTile = jQuery(oTile.getDomRef());

                    if (jqTile.length === 1) {
                        this._moveScrollDashboard(jqTile);
                        return true;
                    }
                }
            }
            return false;
        },

        _moveTile: function (sDirection) {
            var oInfo = this._getGroupAndTilesInfo(),
                oDestTile = this._getNextTile(sDirection, true, oInfo);

            if (oDestTile) {
                var oDestGroup = oDestTile.getParent(),
                    sDestTileMode = oDestTile.getMode ? oDestTile.getMode() : 'ContentMode',
                    sCurTileMode = oInfo.oCurTile.getMode ? oInfo.oCurTile.getMode() : 'ContentMode',
                    aDestGroupContent = sDestTileMode === 'LineMode' ? oDestGroup.getLinks() : oDestGroup.getTiles(),
                    nDestTileIndex = 0;

                if (oInfo.oGroup === oDestGroup) {
                    nDestTileIndex = aDestGroupContent.indexOf(oDestTile);

                    if (sCurTileMode === "LineMode" && sDestTileMode === "ContentMode" && sDirection === "left") {
                        nDestTileIndex = aDestGroupContent.length;
                    }
                } else if (sDirection === "left" || sDirection === "up") {
                    nDestTileIndex = aDestGroupContent.length;
                }

                var sEvent,
                    oEventInfo,
                    that = this;

                if (sCurTileMode === sDestTileMode) {
                    var oDashboardView = jQuery(".sapUshellDashboardView").control(0);

                    sEvent = "movetile";
                    oEventInfo = {
                        sTileId: oDashboardView.getController()._getTileUuid(oInfo.oCurTile),
                        toGroupId: oDestGroup.getGroupId ? oDestGroup.getGroupId() : oDestGroup.groupId,
                        toIndex: nDestTileIndex,
                        sToItems: sCurTileMode === 'LineMode' ? 'links' : 'tiles',
                        sFromItems: sCurTileMode === 'LineMode' ? 'links' : 'tiles',
                        sTileType: sCurTileMode === 'LineMode' ? 'link' : 'tile'
                    };

                    if (sDestTileMode === "LineMode") {
                        oEventInfo.callBack = function () {
                            setTimeout(function () {
                                var aDestGroupContent = sDestTileMode === 'LineMode' ? oDestGroup.getLinks() : oDestGroup.getTiles();
                                that._moveScrollDashboard(aDestGroupContent[nDestTileIndex].$());
                            }, 10);
                        };
                    } else {
                        setTimeout(function () {
                            var aDestGroupContent = sDestTileMode === 'LineMode' ? oDestGroup.getLinks() : oDestGroup.getTiles();
                            that._moveScrollDashboard(aDestGroupContent[nDestTileIndex].$());
                        }, 10);
                    }

                } else {
                    sEvent = "convertTile";
                    oEventInfo = {
                        toGroupId: oDestGroup.getGroupId ? oDestGroup.getGroupId() : oDestGroup.groupId,
                        srcGroupId: oInfo.oGroup.getGroupId ? oInfo.oGroup.getGroupId() : oInfo.oGroup.groupId,
                        toIndex: nDestTileIndex,
                        callBack: function () {
                            setTimeout(function () {
                                var aDestGroupContent = sDestTileMode === 'LineMode' ? oDestGroup.getLinks() : oDestGroup.getTiles();
                                that._moveScrollDashboard(aDestGroupContent[nDestTileIndex].$());
                            }, 10);
                        },
                        tile: oInfo.oCurTile,
                        longDrop: false
                    };
                }

                sap.ui.getCore().getEventBus().publish("launchpad", sEvent, oEventInfo);
            }
        },

        callbackSetFocus: function (oTile) {
            var that = this;
            setTimeout(function () {
                if (oTile.oParent && oTile.oParent instanceof sap.ushell.ui.launchpad.Tile) {
                    that._moveScrollDashboard(jQuery(oTile.oParent.getDomRef()));
                } else {
                    that._moveScrollDashboard(oTile.$());
                }
            });
        },

        _getTileCenter: function (sDirection, oTileRect, oTile) {
            if (!(oTile instanceof HTMLElement)) {
                var jqHelpers = oTile.$().find(".sapMGTLineStyleHelper");

                if (oTile.isLink && jqHelpers && jqHelpers.length > 1) {
                    if (sDirection === "down") {
                        return oTileRect.right;
                    }
                    return oTileRect.left;
                }
            }
            return oTileRect.right - ((oTileRect.right - oTileRect.left) / 2);
        },

        _getTileRect: function (sDirection, oTile) {
            if (oTile instanceof HTMLElement) {
                return oTile.getBoundingClientRect();
            }
            // This part of code is responsible for the accessibility of the links.
            // Links can be in a wrapped state. This means that a single Link can be broken down into multiple lines.
            // When this happens, the bouncingRectangle of such links will return us the height of multiple lines,
            // and a width of 100% of the link area. To handle this case, we have to locate special "Helper" - divs,
            // which represent every string of the link and give us the real sizes of the strings belonging to the link.
            var jqHelpers = oTile.$().find(".sapMGTLineStyleHelper");

            if (oTile.isLink && jqHelpers && jqHelpers.length) {
                if (sDirection === "down") {
                    return jqHelpers.get(jqHelpers.length - 1).getBoundingClientRect();
                } else {
                    return jqHelpers.get(0).getBoundingClientRect();
                }
            }

            if (oTile.getDomRef()) {
                return oTile.getDomRef().getBoundingClientRect();
            }
        },

        _findClosestTile: function (sDirection, aTiles, oCurTile) {
            var oCurTileRect = this._getTileRect(sDirection, oCurTile),
                nCurCenter = this._getTileCenter(sDirection, oCurTileRect, oCurTile);

            var oClosestTile,
                nMinDiffernce = Infinity,
                nStep = sDirection === "down" ? 1 : -1,
                nIndex = aTiles.indexOf(oCurTile) + nStep,
                nRowTop;

            for (; ; nIndex += nStep) {
                var oTile = aTiles[nIndex];

                if (!oTile) {
                    return oClosestTile;
                }

                if (!oClosestTile) {
                    if (sDirection === "down" && nIndex === aTiles.length-1) {
                        // last possible Tile
                        return oTile;
                    }

                    if (sDirection === "up" && nIndex === 0) {
                        // last possible Tile
                        return oTile;
                    }
                }

                var oTileRect = this._getTileRect(sDirection, oTile);

                if (!oTileRect) {
                    return oClosestTile;
                }
                // the offsets are needed for certian styles and to avoid the plus tile in the same group
                if (sDirection === "down" && oCurTileRect.bottom + 5 >= oTileRect.bottom) {
                    continue;
                }

                if (sDirection === "up" && oCurTileRect.top - 5 <= oTileRect.top) {
                    continue;
                }
                if (oClosestTile && nRowTop != oTileRect.top) {
                    return oClosestTile;
                }
                nRowTop = oTileRect.top;

                var nTileDifference = Math.min(Math.abs(oTileRect.left - nCurCenter), Math.abs(oTileRect.right - nCurCenter));
                if (nMinDiffernce > nTileDifference) {
                    nMinDiffernce = nTileDifference;
                    oClosestTile = oTile;
                } else {
                    return oClosestTile;
                }
            }
        },

        _getNextTile: function (sDirection, bMoveTile, oGivenInfo) {
            var oInfo = oGivenInfo || this._getGroupAndTilesInfo(),
                bLinksAllowed = true;
            // Tiles of locked groups cannot be reordered
            if (!oInfo || (bMoveTile && oInfo.oGroup.getProperty('isGroupLocked'))) {
                return null;
            }

            if (bMoveTile) {
                var oTile = oInfo.oCurTile.getBindingContext().getObject().object;
                bLinksAllowed = sap.ushell.Container.getService("LaunchPage").isLinkPersonalizationSupported(oTile);
            }

            if (sDirection === "right" || sDirection === "left") {
                var aFocussedTileAgg = oInfo.oCurTile.isLink ? oInfo.aLinks : oInfo.aTiles,
                    nCurTileIndex = aFocussedTileAgg.indexOf(oInfo.oCurTile),
                    nNextTileIndex = sDirection === "right" ? nCurTileIndex + 1 : nCurTileIndex - 1;

                // Next tile exists in this group
                if (aFocussedTileAgg[nNextTileIndex] && aFocussedTileAgg[nNextTileIndex].getDomRef()) {
                    if (bMoveTile && aFocussedTileAgg[nNextTileIndex] === oInfo.oGroup.oPlusTile) {
                        // cannot move tile to plus tile
                    } else {
                        return aFocussedTileAgg[nNextTileIndex];
                    }
                }

                // Maybe this is the last tile and the next tile, is a link
                if (sDirection === "right" && !oInfo.oCurTile.isLink && oInfo.aLinks.length && bLinksAllowed) {
                    return oInfo.aLinks[0];
                }

                // Maybe this is the first link and the next tile, is a tile
                if (sDirection === "left" && oInfo.oCurTile.isLink && oInfo.aTiles.length) {
                    return oInfo.oGroup.getShowPlaceholder() ? oInfo.oGroup.oPlusTile : oInfo.aTiles[oInfo.aTiles.length - 1];
                }
            }

            // Maybe the next tile is in the next group
            var oNextGroup = this._getNextGroup(sDirection, oInfo.oGroup, bMoveTile, bLinksAllowed);

            if (oNextGroup && sDirection === "right") {
                if (oNextGroup.getTiles().length === 0 && (oNextGroup.getLinks().length === 0)) {
                    return oNextGroup.oPlusTile;
                } else if (oNextGroup.getTiles().length === 0) {
                    return oNextGroup.getLinks()[0];
                } else {
                    return oNextGroup.getTiles()[0];
                }
            }

            if (oNextGroup && sDirection === "left") {
                if (oNextGroup.getTiles().length === 0 && (oNextGroup.getLinks().length === 0)) {
                    return oNextGroup.oPlusTile;
                } else if (oNextGroup.getLinks().length === 0) {
                    return oNextGroup.getTiles()[oNextGroup.getTiles().length - 1];
                } else {
                    return oNextGroup.getLinks()[oNextGroup.getLinks().length - 1];
                }
            }

            if (sDirection === "down" || sDirection === "up") {
                var aGroupContent = bLinksAllowed ? oInfo.aTiles.concat(oInfo.aLinks) : oInfo.aTiles,
                    aNextGroupContent = [];

                if (oNextGroup) {
                    aNextGroupContent = bLinksAllowed ? oNextGroup.getTiles().concat(oNextGroup.getLinks()) : oNextGroup.getTiles();
                    if (aNextGroupContent.length === 0) {
                        aNextGroupContent.push(oNextGroup.oPlusTile);
                    }
                }

                var aJoinedContent = (sDirection === "down") ? aGroupContent.concat(aNextGroupContent) : aNextGroupContent.concat(aGroupContent);
                return this._findClosestTile(sDirection, aJoinedContent, oInfo.oCurTile);
            }
        },

        _getNextGroup: function (sDirection, oCurGroup, bMoveTile, bLinksAllowed) {
            var oNextGroup,
                nDirection,
                aGroups = oCurGroup.getParent().getGroups(),
                nCurGroupIndex = aGroups.indexOf(oCurGroup),
                nNextGroupIndex = nCurGroupIndex;

            if (sDirection === "down" || sDirection === "right") {
                nDirection = 1;
            } else if (sDirection === "up" || sDirection === "left") {
                nDirection = -1;
            } else {
                jQuery.sap.log.error("Direction is unkown", sDirection, "sap.ushell.components.homepage.ComponentKeysHandler");
                return null;
            }

            nNextGroupIndex += nDirection;

            while (aGroups[nNextGroupIndex]) {

                oNextGroup = aGroups[nNextGroupIndex];

                var nNextGroupContent = bLinksAllowed ? oNextGroup.getTiles().concat(oNextGroup.getLinks()) : oNextGroup.getTiles();

                var bIsValidGroup = oNextGroup.getVisible()
                    && !(oNextGroup.getIsGroupLocked() && bMoveTile)
                    && !(nNextGroupContent.length === 0 && !(bMoveTile || this.oModel.getProperty('/tileActionModeActive')));

                if (bIsValidGroup) {
                    return oNextGroup;
                }

                nNextGroupIndex += nDirection;
            }
        },

        _getGroupAndTilesInfo: function () {
            var jqTile = this._getFocusOnTile(jQuery(document.activeElement));

            if (!jqTile || !jqTile.length) {
                return null;
            }

            var oCurTile = jqTile.control(0);

            oCurTile.isLink = jqTile.hasClass('sapUshellLinkTile') || jqTile.hasClass('sapMGTLineMode');

            var oGroup = jqTile.closest(".sapUshellTileContainer").control(0);

            if (!oGroup) {
                return null;
            }

            var aTiles = oGroup.getTiles();

            if (oGroup.getShowPlaceholder()) {
                aTiles.push(oGroup.oPlusTile);
            }

            return {
                oCurTile: oCurTile,
                oGroup: oGroup,
                aTiles: aTiles,
                aLinks: oGroup.getLinks()
            };
        },

        _goToSiblingElementInTileContainer: function (sDirection, jqFocused) {
            var jqTileContainer = jqFocused.closest('.sapUshellTileContainer'),
                jqTileContainerElement,
                jqFirstTileInTileContainer,
                jqTileContainerHeader;

            // If current focused item is the Before Content of a Tile Container.
            jqTileContainerElement = jqFocused.closest('.sapUshellTileContainerBeforeContent');
            if (jqTileContainerElement.length) {
                if (sDirection === 'up' || sDirection === "left") {
                    this._goToNextTileContainer(jqTileContainerElement, sDirection);
                } else {
                    jqTileContainerHeader = jqTileContainer.find('.sapUshellTileContainerHeader:first');
                    this._setTabIndexOnTileContainerHeader(jqTileContainerHeader);
                    jqTileContainerHeader.focus();
                }
                return;
            }
            // If current focused item is the Header of a Tile Container.
            jqTileContainerElement = jqFocused.closest('.sapUshellTileContainerHeader');
            if (jqTileContainerElement.length) {
                if (sDirection === 'up') {
                    this._setTabIndexOnTileContainerHeader(jqTileContainerHeader);
                    if (!this._goToTileContainerBeforeContent(jqTileContainer)) {
                        // If the Tile Container doesn't have a Before Content, go to the Tile Container above.
                        this._goToNextTileContainer(jqTileContainerElement, sDirection);
                    }
                } else if (sDirection === "down") {
                    jqFirstTileInTileContainer = jqTileContainer.find('.sapUshellTile:first');
                    // If this Tile Container doesn't have tiles at all (not even a Plus Tile), it means that the group is empty and locked.
                    // Thus the next arrow down navigation should be to the descending Tile Container.
                    if (jqFirstTileInTileContainer.length) {
                        this._moveScrollDashboard(jQuery(jqFirstTileInTileContainer));

                    } else {
                        this._goToNextTileContainer(jqTileContainerElement, sDirection);
                    }
                } else if (sDirection === "left") {
                    if (jqFocused.hasClass("sapUshellTileContainerHeader")) {
                        if (!this._goToTileContainerBeforeContent(jqTileContainer)) {
                            // If the Tile Container doesn't have a Before Content, go to the Tile Container above.
                            this._goToNextTileContainer(jqTileContainerElement, "left");
                        }
                    } else {
                        jqTileContainerHeader = jqFocused.closest(".sapUshellTileContainerHeader");
                        jqTileContainerHeader.focus();
                    }
                } else if (sDirection === "right") {
                    var editInputField = jqFocused.hasClass("sapMInputBaseInner");
                    if (!editInputField) {
                        jqFirstTileInTileContainer = jqTileContainer.find('.sapUshellTile:first');
                        // If this Tile Container doesn't have tiles at all (not even a Plus Tile), it means that the group is empty and locked.
                        // Thus the next arrow down navigation should be to the descending Tile Container.
                        if (jqFirstTileInTileContainer.length) {
                            this._moveScrollDashboard(jqFirstTileInTileContainer);
                        } else {
                            this._goToNextTileContainer(jqTileContainerElement, "down");
                        }
                    }
                }
                return;
            }
            // If current focused item is a Tile.
            jqTileContainerElement = this._getFocusOnTile(jqFocused);
            if (jqTileContainerElement) {
                this._goFromFocusedTile(sDirection, jqTileContainerElement, true);
                return;
            }
            // If current focused item is an After Content of a Tile Container.
            jqTileContainerElement = jqFocused.closest('.sapUshellTileContainerAfterContent');
            if (jqTileContainerElement.length) {
                if (sDirection === 'up' || sDirection === "left") {
                    this._goToTileOfGroup("first", jqTileContainerElement.control(0));
                } else {
                    this._goToNextTileContainer(jqTileContainerElement, sDirection);
                }
            }
        },

        _goToNextTileContainer: function (jqTileContainerElement, sDirection) {
            var jqCurGroup = jqTileContainerElement.closest('.sapUshellTileContainer');

            if (jqCurGroup.length === 1) {
                var aAllTileContainers = jQuery('.sapUshellTileContainer:visible'),
                    nDirection = (sDirection === 'down') ? 1 : -1,
                    jqNextTileContainer = jQuery(aAllTileContainers[aAllTileContainers.index(jqCurGroup) + nDirection]);

                if (jqNextTileContainer.length === 1) {
                    var jqNextTileContainerHeader = jqNextTileContainer.find('.sapUshellTileContainerHeader');
                    if (sDirection === 'down') {
                        if (!this._goToTileContainerBeforeContent(jqNextTileContainer)) {
                            this._setTabIndexOnTileContainerHeader(jqNextTileContainerHeader);
                            this._setTileContainerSelectiveFocus(jqNextTileContainer);
                        }
                    } else if (!this._goToTileContainerAfterContent(jqNextTileContainer)) {
                        if (sDirection === "up" || sDirection === "left") {
                            var sSelector = sDirection === "up" ? "first" : "last";

                            if (!this._goToTileOfGroup(sSelector, jqNextTileContainer.control(0))) {
                                this._setTabIndexOnTileContainerHeader(jqNextTileContainerHeader);
                                jqNextTileContainerHeader.focus();
                            }
                        }
                    }
                }
            }
        },

        _goToTileContainerBeforeContent: function (jqTileContainerElement) {
            var jqTileContainer = jqTileContainerElement.hasClass('sapUshellTileContainer') ? jqTileContainerElement : jqTileContainerElement.closest('.sapUshellTileContainer'),
                jqTileContainerBeforeContent = jqTileContainer.find('.sapUshellTileContainerBeforeContent button:visible');

            if (jqTileContainerBeforeContent.length) {
                jqTileContainerBeforeContent.focus();
                return true;
            } else {
                return false;
            }
        },

        _goToTileContainerAfterContent: function (jqTileContainerElement) {
            var jqTileContainer = jqTileContainerElement.hasClass('sapUshellTileContainer') ? jqTileContainerElement : jqTileContainerElement.closest('.sapUshellTileContainer'),
                jqTileContainerAfterContent = jqTileContainer.find('.sapUshellTileContainerAfterContent button:visible');

            if (jqTileContainerAfterContent.length) {
                jqTileContainerAfterContent.focus();
                return true;
            } else {
                return false;
            }
        },

        _goFromFocusedTile: function (sDirection, jqTile, bIsActionsModeActive) {
            var oNextTile = this._getNextTile(sDirection);

            if (oNextTile) {
                var jqNextTile = oNextTile.$();

                if (bIsActionsModeActive) {
                    var jqCurrentTileContainer = jQuery(jqTile).closest('.sapUshellTileContainer'),
                        jqNextTileContainer = oNextTile.oParent.$();

                    if (jqCurrentTileContainer.get(0).id === jqNextTileContainer.get(0).id) {
                        this._moveScrollDashboard(jqNextTile);
                    } else if (sDirection === 'down' || sDirection === 'right') {
                        if (!this._goToTileContainerAfterContent(jqCurrentTileContainer)) {
                            // If the Tile Container doesn't have a visible AfterContent, go to the next Tile Container.
                            this._setTabIndexOnTileContainerHeader(jqNextTileContainer.find('.sapUshellTileContainerHeader'));
                            this._setTileContainerSelectiveFocus(jqNextTileContainer);
                        }
                    } else if (sDirection === 'up' || sDirection === 'left') {
                        var jqCurrentTileContainerHeader = jqCurrentTileContainer.find('.sapUshellTileContainerHeader');
                        this._setTabIndexOnTileContainerHeader(jqCurrentTileContainerHeader);
                        jqCurrentTileContainerHeader.focus();
                    }
                } else {
                    this._moveScrollDashboard(jqNextTile);
                }
            }
        },

        _setTabIndexOnTileContainerHeader: function (jqTileContainerHeader) {
            jQuery(".sapUshellTileContainerHeader").attr("tabindex", -1);
            jQuery(".sapUshellTileContainerHeader .sapUshellContainerTitle").attr("tabindex", -1);
            jQuery(".sapUshellTileContainerHeader .sapUshellContainerHeaderActions button").attr("tabindex", -1);

            if (jqTileContainerHeader) {
                var jqTileConainerHeaderTitle = jqTileContainerHeader.find('.sapUshellContainerTitle:first'),
                    jqTileContainerHeaderActions = jqTileContainerHeader.find('.sapUshellContainerHeaderActions:first');

                jqTileContainerHeader.attr('tabindex', 0);
                jqTileConainerHeaderTitle.attr('tabindex', 0);
                jqTileContainerHeaderActions.find('button').attr('tabindex', 0);
            }
        },

        _setTileContainerSelectiveFocus: function (jqGroup) {
            var jqGroups = jQuery('#dashboardGroups').find('.sapUshellTileContainer:visible'),
                jqGroupBeforeContent = jqGroup.find('.sapUshellTileContainerBeforeContent button'),
                jqGroupHeader = jqGroup.find('.sapUshellTileContainerHeader:first'),
                bBeforeContentDisplayed = jqGroupBeforeContent.length && jqGroupBeforeContent.is(":visible");

            if (bBeforeContentDisplayed) {
                jqGroupBeforeContent.focus();
            } else if (jqGroup.get(0) === jqGroups.get(0)) {
                this.goToLastVisitedTile();
            } else if (jqGroupHeader.length) {
                // Set tab-index on tileContainerHeader and its' children.
                this._setTabIndexOnTileContainerHeader(jqGroupHeader);
                jqGroupHeader.focus();
            }
        },

        setTileFocus: function (jqTile) {

            if (!jqTile.hasClass('sapUshellPlusTile')) {
                // When AppFinder Component exists, this needs to be tested. The purpose of this change here is that
                // we need to know whether we are in the catalog and only then need to execute additional tabindex operations
                if (jqTile.parents('#catalogView').length > 0) {
                    this.setFocusOnCatalogTile(jqTile.find('[tabindex]').eq(0));
                }
            }

            // remove tablindex from all tiles
            jQuery(".sapUshellTile [tabindex = 0]").get().forEach(function (oHtmlTile) {
                jQuery(oHtmlTile).attr("tabindex", -1);
            });
            jQuery(".sapUshellTile:visible[tabindex=0]").get().forEach(function (oHtmlTile) {
                jQuery(oHtmlTile).attr("tabindex", -1);
            });
            jQuery(".sapMGTLineMode [tabindex = 0]").get().forEach(function (oHtmlTile) {
                jQuery(oHtmlTile).attr("tabindex", -1);
            });
            jQuery(".sapUshellLinkTile [tabindex = 0]").get().forEach(function (oHtmlTile) {
                jQuery(oHtmlTile).attr("tabindex", -1);
            });
            if (jqTile.length > 0) {
                jqTile.attr("tabindex", 0);
                var jqLoadingDialog = jQuery("#Fiori2LoadingDialog")[0];
                if (!jqLoadingDialog || jqLoadingDialog.style.visibility === "hidden") {

                    // on ABAP - link is wrapped by Div - so we take the first child which is span
                    if (jqTile.prop("tagName") === "DIV" && jQuery(jqTile).hasClass("sapUshellLinkTile") && jqTile.getMode == undefined) {
                        jqTile = jqTile.find("a").length ? jqTile.find("a")[0] : jqTile;
                    }
                    jqTile.focus();

                    // setting a custom data on the Tile control object, so it would be kept after re-rendering
                    // (e.g. switching edit mode/non edit mode scenario for example)
                    if (jqTile[0] && jqTile[0].id) {
                        var oTile = sap.ui.getCore().byId(jqTile[0].id);

                        // as we always set the static member created which represents tab-index 0 for the tile-to-focus on
                        // we gain the consistency which ensures us only one tile will have tab-index 0
                        // as setting the same instance of a different tile removes it from its previous parent
                        var customDataParent = this.tileFocusCustomData.getParent && this.tileFocusCustomData.getParent();
                        if (customDataParent) {
                            customDataParent.removeAggregation("customData", this.tileFocusCustomData, true);
                        }

                        if (oTile && sap.ui.getCore().byId(oTile.getId()) && this.tileFocusCustomData && sap.ui.getCore().byId(this.tileFocusCustomData.getId())) {
                            oTile.addAggregation("customData", this.tileFocusCustomData, true);
                        }
                    }
                }
            } else {
                var jqTileContainer = jQuery(jqTile.prevObject.selector.substring(0, jqTile.prevObject.selector.length - 3));
                if (jqTileContainer.length > 0) {
                    var oCurGroup = jqTileContainer.control(0),
                        oInfo = {
                            oCurTile: oCurGroup.oPlusTile,
                            oGroup: oCurGroup,
                            aTiles: oCurGroup.getTiles(),
                            aLinks: oCurGroup.getLinks()
                        },
                        oNextTile = this._getNextTile("left", false, oInfo);

                    if (!oNextTile) {
                        oNextTile = this._getNextTile("right", false, oInfo);
                    }

                    jQuery(oNextTile.getDomRef()).attr("tabindex", 0);
                }
            }
        },

        setFocusOnCatalogTile: function (jqTile) {
            var oPrevFirsTile = jQuery(".sapUshellTile[tabindex=0]"),
                aAllTileFocusableElements,
                aVisibleTiles;

            if (oPrevFirsTile.length) {
                // remove tabindex attribute from all tiles
                jQuery(".sapUshellTileContainerContent [tabindex=0]").get().forEach(function (oHTMLElement) {
                    jQuery(oHTMLElement).attr("tabindex", -1);
                });
                aAllTileFocusableElements = oPrevFirsTile.find('[tabindex], a').andSelf().filter('[tabindex], a');
                aAllTileFocusableElements.attr("tabindex", -1);
            }

            if (!jqTile) {
                aVisibleTiles = jQuery(".sapUshellTile:visible,.sapUshellAppBox:visible");
                if (aVisibleTiles.length) {
                    jqTile = jQuery(aVisibleTiles[0]);
                } else {
                    return;
                }
            }

            // add tabindex attribute to all tile's elements in TAB cycle
            jqTile.attr("tabindex", 0);
            jqTile.find("button").attr("tabindex", 0);
            jqTile.focus();
        },

        _moveScrollDashboard: function (jqTileSelected) {
            var iY = -1 * (document.getElementById('dashboardGroups').getBoundingClientRect().top) + jqTileSelected[0].getBoundingClientRect().top;
            jQuery('#sapUshellDashboardPage section').stop().animate({ scrollTop: iY }, 0, function () {
                this.setTileFocus(jqTileSelected);
            }.bind(this));
        },

        _moveGroupFromDashboard: function (sDirection, jqGroup) {
            var jqCurrentTileContainer,
                aTileContainers = jQuery(".sapUshellDashboardGroupsContainerItem"),
                indexOfTileContainer,
                toIndex;

            jqCurrentTileContainer = jqGroup.closest(".sapUshellDashboardGroupsContainerItem");
            indexOfTileContainer = aTileContainers.index(jqCurrentTileContainer);
            toIndex = sDirection == "up" || sDirection == "left" ? indexOfTileContainer - 1 : indexOfTileContainer + 1;
            this._moveGroup(indexOfTileContainer, toIndex);
        },

        _moveGroup: function (fromIndex, toIndex) {
            if (toIndex < 0 || toIndex >= jQuery(".sapUshellDashboardGroupsContainerItem").length || toIndex < jQuery(".sapUshellDisableDragAndDrop").length) {
                return;
            }

            sap.ui.getCore().getEventBus().publish("launchpad", "moveGroup", { fromIndex: fromIndex, toIndex: toIndex });

            var that = this;
            setTimeout(function () {
                var tileContainerHeader = jQuery(".sapUshellTileContainerHeader")[toIndex];
                that._setTabIndexOnTileContainerHeader(jQuery(tileContainerHeader));
                jQuery(tileContainerHeader).focus();
            }, 100);
        },

        _getFocusOnTile: function (jqFocused) {
            var jqTile;

            ['.sapUshellTile', '.sapUshellLinkTile'].forEach(function (sClassName) {
                var jqTileWrapper = jqFocused.closest(sClassName);
                if (jqTileWrapper.length) {
                    jqTile = jqTileWrapper;
                }
            });

            return jqTile;
        },

        _renameGroup: function (jqFocused) {
            if (jqFocused.closest('.sapUshellTileContainerHeader').length === 1) {
                jqFocused = jqFocused[0].tagName === 'H2' ? jqFocused : jqFocused.find("h2");
                jqFocused.click();
            }
        },

        _arrowsButtonsHandler: function (sDirection, oEvent, jqFocused) {
            var bIsActionsModeActive = this.oModel.getProperty('/tileActionModeActive');

            if ((bIsActionsModeActive && jqFocused.hasClass('sapMInputBaseInner')) || jqFocused.hasClass("sapMITBFilter")) {
                // do note prevent default, inorder to be able to change the title of a group
                return;
            } else {
                this._preventDefault(oEvent);
            }

            // Anchor Navigation Item
            if (jqFocused.hasClass("sapUshellAnchorItem")) {
                this._handleAnchorNavigationItemsArrowKeys(sDirection, jqFocused);
                return;
            }

            // DashboardGroups
            var jqTile = this._getFocusOnTile(jqFocused);

            if (oEvent.ctrlKey === true && this.oModel.getProperty("/personalization")) {
                var jqHeaderElement = jqFocused.closest('.sapUshellTileContainerHeader');

                if (jqTile) {
                    this._moveTile(sDirection, jqTile);
                } else if (jqHeaderElement.length) {
                    // first we check if we should prevent the move of the group - obtain the wrapping container (content div)
                    var jqFocusGroupContentElement = jqHeaderElement.closest('.sapUshellTileContainerContent');
                    // if the group is the Home group OR Locked group - do not initiate move
                    if (!jqFocusGroupContentElement.hasClass('sapUshellTileContainerDefault') || !jqFocusGroupContentElement.hasClass('sapUshellTileContainerLocked')) {
                        this._moveGroupFromDashboard(sDirection, jqHeaderElement);
                    }
                }
            } else if (bIsActionsModeActive) {
                this._goToSiblingElementInTileContainer(sDirection, jqFocused);
            } else if (jqTile) {
                this._goFromFocusedTile(sDirection, jqTile, bIsActionsModeActive);
            } else if (!jqFocused.hasClass("sapUshellActionItem")) {
                this.goToLastVisitedTile();
            }
        },

        _handleAnchorNavigationItemsArrowKeys: function (sDirection, jqFocused) {
            var aAnchorItems = jQuery(".sapUshellAnchorItem:visible"),
                nIndexOfFocusedItem = aAnchorItems.index(jqFocused),
                oNextItem = jqFocused;

            if (sDirection === "left" || sDirection === "up") {
                if (nIndexOfFocusedItem > 0) {
                    oNextItem = aAnchorItems.get(nIndexOfFocusedItem - 1);
                }
            } else if (sDirection === "right" || sDirection === "down") {
                if (nIndexOfFocusedItem < aAnchorItems.length - 1) {
                    oNextItem = aAnchorItems.get(nIndexOfFocusedItem + 1);
                }
            }

            this._setAnchorItemFocus(jQuery(oNextItem));
        },

        _setAnchorItemFocus: function (jqAnchorItem) {
            // remove tabindex from all anchor items
            jQuery(".sapUshellAnchorItem").get().forEach(function (oHTMLElement) {
                jQuery(oHTMLElement).attr("tabindex", -1);
            });
            jqAnchorItem.attr("tabindex", 0);
            jqAnchorItem.focus();
        },

        _appFinderHomeEndButtonsHandler:  function  (sDirection, oEvent, jqFocused) {
            var  aVisibleCatalogEntries  =  jQuery(".sapUshellTile:visible,.sapUshellAppBox:visible"),
                jqFocusElement;
            if  (aVisibleCatalogEntries.length) {
                if  (sDirection ===  "home") {
                    jqFocusElement  =  jQuery(aVisibleCatalogEntries.get(0));
                }
                if  (sDirection ===  "end") {
                    jqFocusElement  =  jQuery(aVisibleCatalogEntries.get(aVisibleCatalogEntries.length  -  1));
                }
            }
            if  (jqFocusElement) {
                this._preventDefault(oEvent);
                this._appFinderFocusAppBox(jqFocused,  jqFocusElement);
            }
        },

        _homeEndButtonsHandler: function (selector, oEvent, jqFocused) {

            if (jqFocused.hasClass("sapUshellAnchorItem")) {
                this._preventDefault(oEvent);
                this._setAnchorItemFocus(jQuery(".sapUshellAnchorItem:visible:" + selector));
            } else if (oEvent.ctrlKey === true) {
                this._preventDefault(oEvent);
                var jqTileToSelect = jQuery(".sapUshellTile:visible")[selector]();
                this._moveScrollDashboard(jqTileToSelect);
            } else {
                var jqGroup = jqFocused.closest('.sapUshellTileContainer');

                if (jqGroup) {
                    var oGroup = jqGroup.control(0);

                    if (oGroup) {
                        this._preventDefault(oEvent);
                        this._goToTileOfGroup(selector, oGroup);
                    }
                }
            }
        },

        _deleteButtonHandler: function (jqFocused) {
            if (this.oModel.getProperty("/personalization") && this.oModel.getProperty("/tileActionModeActive")) {
                var jqElement = this._getFocusOnTile(jqFocused);

                if (jqElement && !jqElement.hasClass('sapUshellLockedTile') && !jqElement.hasClass('sapUshellPlusTile')) {
                    var oInfo = this._getGroupAndTilesInfo();

                    if (oInfo) {
                        var oDashboardView = jQuery(".sapUshellDashboardView").control(0),
                            sTileId = oDashboardView.getController()._getTileUuid(oInfo.oCurTile),
                            that = this;

                        setTimeout(function () {
                            if (oInfo.oCurTile.getDomRef()) {
                                that._moveScrollDashboard(oInfo.oCurTile.$());
                            } else {
                                that._moveScrollDashboard(oInfo.oGroup.oPlusTile.$());
                            }
                        }, 100);

                        sap.ui.getCore().getEventBus().publish("launchpad", "deleteTile", { tileId: sTileId }, this);
                    }
                }
            }
        },

        _ctrlPlusArrowKeyButtonsHandler: function (sDirection) {
            var jqFocused = jQuery(document.activeElement),
                jqHeaderElement = jqFocused.closest('.sapUshellTileContainerHeader');

            if (this._getFocusOnTile(jqFocused)) {
                this._moveTile(sDirection);
            } else if (jqHeaderElement.length) {
                // first we check if we should prevent the move of the group - obtain the wrapping container (content div)
                var jqFocusGroupContentElement = jqHeaderElement.closest('.sapUshellTileContainerContent');
                // if the group is the Home group OR Locked group - do not initiate move
                if (!jqFocusGroupContentElement.hasClass('sapUshellTileContainerDefault') || !jqFocusGroupContentElement.hasClass('sapUshellTileContainerLocked')) {
                    this._moveGroupFromDashboard(sDirection, jqHeaderElement);
                }
            }
        },

        _spaceButtonHandler: function (oEvent, jqFocused) {
            if (this._getFocusOnTile(jqFocused)) {
                oEvent.preventDefault();
                jqFocused.click(jqFocused);
                if (jqFocused.control(0).getUuid) {
                    sap.ui.getCore().getEventBus().publish("launchpad", "dashboardTileClick", {uuid: jqFocused.control(0).getUuid()});
                }
            } else {
                jqFocused.click();
            }
        },

        _enterButtonHandler: function (jqFocused) {
            if (jqFocused.hasClass('sapMInputBaseInner')) {
                var jqHeaderElement = jqFocused.closest('.sapUshellTileContainerHeader'),
                    that = this;
                if (jqHeaderElement.length === 1) {
                    setTimeout(function () {
                        jqHeaderElement = jQuery("#" + jqHeaderElement[0].id);
                        that._setTabIndexOnTileContainerHeader(jqHeaderElement);
                        jqHeaderElement.focus();
                    }, 10);
                }
            }
            if (this._getFocusOnTile(jqFocused)) {
                jqFocused.click(jqFocused);
                if (jqFocused.control(0).getUuid) {
                    sap.ui.getCore().getEventBus().publish("launchpad", "dashboardTileClick", {uuid: jqFocused.control(0).getUuid()});
                }
            }
        },

        goToSelectedAnchorNavigationItem: function () {
            this._setAnchorItemFocus(jQuery(".sapUshellAnchorItemSelected"));
            return jQuery(document.activeElement).hasClass("sapUshellAnchorItemSelected");
        },

        handleFocusOnMe: function (oEvent, bFocusPassedFirstTime) {
            var oRenderer = sap.ushell.Container.getRenderer("fiori2"),
                handler = oComponentKeysHandler;

            if (oRenderer) {
                var sCurrentCoreView = oRenderer.getCurrentCoreView();

                if (sCurrentCoreView === "home") {
                    // we got the focus from the shell
                    if (bFocusPassedFirstTime) {
                        if (oEvent.shiftKey) { // backwards navigation
                            var floatingFooterDoneBtn = jQuery("#sapUshellDashboardFooterDoneBtn:visible");
                            if (floatingFooterDoneBtn.length) {
                                floatingFooterDoneBtn.focus();
                            } else {
                                handler.goToLastVisitedTile();
                            }
                        } else if (!handler.goToSelectedAnchorNavigationItem()) { // forward navigation
                            // when focus on anchor bar failed, we pass it to tile
                            handler.goToLastVisitedTile();
                        }
                    } else {
                        handler._dashboardKeydownHandler(oEvent);
                    }
                }

                if (sCurrentCoreView === "appFinder") {
                    // we got the focus from the shell
                    if (bFocusPassedFirstTime) {
                        if (oEvent.shiftKey) { // backwards navigation
                            handler.setFocusOnCatalogTile();
                        } else { // forward navigation
                            var openCloseSplitAppButton = sap.ui.getCore().byId("openCloseButtonAppFinderSubheader");
                            if (openCloseSplitAppButton && openCloseSplitAppButton.getVisible()) {
                                openCloseSplitAppButton.focus();
                            } else {
                                handler.appFinderFocusMenuButtons(oEvent);
                            }
                        }
                    } else {
                        handler._appFinderKeydownHandler(oEvent);
                    }
                }
            }
        },

        _groupHeaderNavigation: function (jqFocused) {
            var jqElement;

            if (jqFocused.hasClass("sapUshellTileContainerHeader")) {
                jqElement = jqFocused.find(".sapUshellContainerTitle");
                jqElement.focus();
            } else if (jqFocused.closest(".sapUshellTileContainerHeader")) {
                jqElement = jqFocused.closest(".sapUshellTileContainerHeader");
                jqElement.focus();
            }
        },

        _appFinderFocusAppBox: function (jqCurAppBox, jqNextAppBox) {
            if (jqCurAppBox && jqNextAppBox) {
                jqCurAppBox.attr("tabindex", "-1").find(".sapUshellPinButton").attr("tabindex", "-1");
                jqNextAppBox.attr("tabindex", "0").focus();
                jqNextAppBox.find(".sapUshellPinButton").attr("tabindex", "0");
            }
        },

        _preventDefault: function (oEvent) {
            // Prevent the browser event from scrolling the page
            // Instead we clone this event and dispatch it programmatic,
            // so all handlers expecting this event will still work
            oEvent.preventDefault();
            oEvent.stopPropagation();
            oEvent.stopImmediatePropagation();
        },

        _getNextCatalog: function (sDirection, jqCurCatalog) {
            var jqNextCatalog;

            if (sDirection === "down" || sDirection === "right") {
                jqNextCatalog = jqCurCatalog.next();
            } else if (sDirection === "up" || sDirection === "left") {
                jqNextCatalog = jqCurCatalog.prev();
            } else {
                jQuery.sap.log.error("Direction is unkown", sDirection, "sap.ushell.components.homepage.ComponentKeysHandler");
                return null;
            }

            if (jqNextCatalog.length > 0) {
                var nNextCatalogContentLength = jqNextCatalog.find("li.sapUshellAppBox, li.sapUshellTile").get().length;

                if (nNextCatalogContentLength > 0) {
                    return jqNextCatalog;
                } else {
                    return this._getNextCatalog(sDirection, jqNextCatalog);
                }
            }
        },

        _getNextCatalogItem: function (sDirection, jqFocused, bPageUpDown) {
            var jqCatalogContainer = jQuery(jqFocused.parents()[2]),
                aCurCatalogItems = jqCatalogContainer.find("li.sapUshellAppBox, li.sapUshellTile").get();

            if (sDirection === "right" || sDirection === "left") {
                var nCurItemIndex = aCurCatalogItems.indexOf(jqFocused.get(0)),
                    nNextItemIndex = sDirection === "right" ? nCurItemIndex + 1 : nCurItemIndex - 1;

                // Next item in this catalog
                if (aCurCatalogItems[nNextItemIndex]) {
                    return aCurCatalogItems[nNextItemIndex];
                }
            }

            // Maybe the next item is in the next catalog
            var jqNextCatalog = this._getNextCatalog(sDirection, jqCatalogContainer),
                aNextCatalogItems = jqNextCatalog ? jqNextCatalog.find("li.sapUshellAppBox, li.sapUshellTile").get() : [];

            if (aNextCatalogItems.length > 0 && sDirection === "right") {
                return aNextCatalogItems[0];
            }

            if (aNextCatalogItems.length > 0 && sDirection === "left") {
                return aNextCatalogItems[aNextCatalogItems.length - 1];
            }

            if (sDirection === "down" || sDirection === "up") {

                if (aNextCatalogItems.length > 0 && bPageUpDown) {
                    return aNextCatalogItems[0];
                } else {
                    var aJoinedItems = (sDirection === "down") ? aCurCatalogItems.concat(aNextCatalogItems) : aNextCatalogItems.concat(aCurCatalogItems);
                    return this._findClosestTile(sDirection, aJoinedItems, jqFocused.get(0));
                }
            }
        },

        _appFinderKeysHandler: function (sDirection, oEvent, jqFocused, bPageUpDown) {
            if (jqFocused.is(".sapUshellAppBox, .sapUshellTile")) {
                this._preventDefault(oEvent);
                var jqNextFocused = jQuery(this._getNextCatalogItem(sDirection, jqFocused, bPageUpDown));

                if (jqNextFocused) {
                    this._appFinderFocusAppBox(jqFocused, jqNextFocused);
                }
            }
        },

        /**
         * Set focus on AppFinder button
         */
        _handleAppFinderButton: function () {
            var oOpenCatalogBtn = window.document.getElementById("openCatalogBtn"),
                oConfig = sap.ushell.Container.getRenderer("fiori2").getShellConfig(),
                oOverFlowBtn = window.document.getElementById("endItemsOverflowBtn");

            if (oOpenCatalogBtn) {
                oOpenCatalogBtn.focus();
                return;
            }

            if (oConfig.moveAppFinderActionToShellHeader) {
                if (oOverFlowBtn) {
                    oOverFlowBtn.focus();
                }
            } else {
                // Force the EventHub to emit the event with a new value
                EventHub.emit('showMeArea', Date.now());
                window.setTimeout(function () {
                    oOpenCatalogBtn = window.document.getElementById("openCatalogBtn");
                    if (oOpenCatalogBtn) {
                        oOpenCatalogBtn.focus();
                    } else {
                        oOverFlowBtn = window.document.getElementById("overflowActions-overflowButton");
                        if (oOverFlowBtn) {
                            oOverFlowBtn.focus();
                        }
                    }
                }, 300);
            }
        },

        /**
         * Reacts on given keyboard events
         *
         * @param {object} oEvent the event that contains all the information about the keystroke
         */
        handleShortcuts: function (oEvent) {
            var oHandler = oComponentKeysHandler,
                oShellHeader = window.document.getElementById("shell-header");

            if (oEvent.altKey && oShellHeader) {
                switch (oEvent.keyCode) {
                    case oHandler.keyCodes.A:
                        if (oHandler.oModel.getProperty("/personalization")) {
                            // Set HTML accesskey attribute. This is important, inorder to overwrite IE default accesskeys
                            oShellHeader.setAttribute("accesskey", "a");
                            // Timeout required for IE to switch the focus from the ShellHeader back to the button
                            window.setTimeout(function () {
                                oHandler._handleAppFinderButton();
                                // Remove HTML accesskey attribute again after some time.
                                oShellHeader = window.document.getElementById("shell-header");
                                if (oShellHeader) {
                                    oShellHeader.removeAttribute("accesskey");
                                }
                            }, 0);
                            // Prevent default, inorder to overwrite Firefox default accesskeys
                            oEvent.preventDefault();
                        }
                        break;
                    case oHandler.keyCodes.H:
                        oHandler.oRouter.navTo("home");
                        // Close MeArea or notifications view if opened
                        EventHub.emit('showMeArea', false);
                        EventHub.emit('showNotifications', false);

                        // Set HTML accesskey attribute. This is important, inorder to overwrite IE default accesskeys
                        oShellHeader.setAttribute("accesskey", "h");
                        window.setTimeout(function () {
                            var oFirstAnchorItem = jQuery(".sapUshellAnchorItem:visible:first");
                            if (oFirstAnchorItem.length) {
                                oFirstAnchorItem.focus();
                            }
                            // Remove HTML accesskey attribute again after some time.
                            oShellHeader = window.document.getElementById("shell-header");
                            if (oShellHeader) {
                                oShellHeader.removeAttribute("accesskey");
                            }
                        }, 0);
                        // Prevent default, inorder to overwrite Firefox default accesskeys
                        oEvent.preventDefault();
                        break;
                    default:
                }
            }
            // ctrl + Enter
            var bIsActionsModeActive = oHandler.oModel.getProperty('/tileActionModeActive');
            if (oEvent.ctrlKey && oEvent.keyCode === oHandler.keyCodes.ENTER && bIsActionsModeActive) {
                var oDoneButton = sap.ui.getCore().byId("sapUshellDashboardFooterDoneBtn");
                if (oDoneButton) {
                    oDoneButton.firePress();
                }
            }
        },

        appFinderFocusMenuButtons: function (oEvent) {
            var buttons = jQuery("#catalog-button, #userMenu-button, #sapMenu-button").filter("[tabindex=0]");
            if (buttons.length) {
                buttons.eq(0).focus();
                this._preventDefault(oEvent);
                return true;
            } else {
                return false;
            }

        },

        _appFinderKeydownHandler:  function  (oEvent) {
            var jqFocused = jQuery(document.activeElement);
            if (oEvent.srcElement.id != "appFinderSearch-I") {
                var iPressedKeyCode = oEvent.keyCode,
                    bIsRTL = sap.ui.getCore().getConfiguration().getRTL();

                if (bIsRTL && iPressedKeyCode === this.keyCodes.ARROW_RIGHT) {
                    iPressedKeyCode = this.keyCodes.ARROW_LEFT;
                } else if (bIsRTL && iPressedKeyCode === this.keyCodes.ARROW_LEFT) {
                    iPressedKeyCode = this.keyCodes.ARROW_RIGHT;
                }

                switch (iPressedKeyCode) {
                    case this.keyCodes.ARROW_UP:
                        this._appFinderKeysHandler("up", oEvent, jqFocused);
                        break;
                    case this.keyCodes.ARROW_DOWN:
                        this._appFinderKeysHandler("down", oEvent, jqFocused);
                        break;
                    case this.keyCodes.ARROW_RIGHT:
                        this._appFinderKeysHandler("right", oEvent, jqFocused);
                        break;
                    case this.keyCodes.ARROW_LEFT:
                        this._appFinderKeysHandler("left", oEvent, jqFocused);
                        break;
                    case this.keyCodes.PAGE_UP:
                        this._appFinderKeysHandler("up", oEvent, jqFocused, true);
                        break;
                    case this.keyCodes.PAGE_DOWN:
                        this._appFinderKeysHandler("down", oEvent, jqFocused, true);
                        break;
                    case this.keyCodes.HOME:
                        this._appFinderHomeEndButtonsHandler("home", oEvent);
                        break;
                    case this.keyCodes.END:
                        this._appFinderHomeEndButtonsHandler("end", oEvent);
                        break;
                    case this.keyCodes.SPACE:
                        this._spaceButtonHandler(oEvent, jqFocused);
                        break;
                    default:
                        return;
                }
            }
        },

        _dashboardKeydownHandler: function (oEvent) {
            var sTagName = document.activeElement && document.activeElement.tagName;
            if (sTagName === "INPUT" || sTagName === "TEXTAREA") {
                return; // there may be custom tiles with input controls inside
            }

            var iPressedKeyCode = oEvent.keyCode,
                bIsRTL = sap.ui.getCore().getConfiguration().getRTL(),
                jqFocused = jQuery(document.activeElement);

            if (bIsRTL) {
                if (iPressedKeyCode === this.keyCodes.ARROW_RIGHT) {
                    iPressedKeyCode = this.keyCodes.ARROW_LEFT;
                } else if (iPressedKeyCode === this.keyCodes.ARROW_LEFT) {
                    iPressedKeyCode = this.keyCodes.ARROW_RIGHT;
                }
            }

            switch (iPressedKeyCode) {
                case this.keyCodes.F2:
                    this._renameGroup(jqFocused);
                    break;
                case this.keyCodes.F7:
                    this._groupHeaderNavigation(jqFocused);
                    break;
                case this.keyCodes.DELETE:
                    this._deleteButtonHandler(jqFocused);
                    break;
                case this.keyCodes.BACKSPACE:
                    this._deleteButtonHandler(jqFocused);
                    break;
                case this.keyCodes.ARROW_UP:
                    this._arrowsButtonsHandler("up", oEvent, jqFocused);
                    break;
                case this.keyCodes.ARROW_DOWN:
                    this._arrowsButtonsHandler("down", oEvent, jqFocused);
                    break;
                case this.keyCodes.ARROW_RIGHT:
                    this._arrowsButtonsHandler("right", oEvent, jqFocused);
                    break;
                case this.keyCodes.ARROW_LEFT:
                    this._arrowsButtonsHandler("left", oEvent, jqFocused);
                    break;
                case this.keyCodes.PAGE_UP:
                    this._goToFirstTileOfNextGroup("up", oEvent);
                    break;
                case this.keyCodes.PAGE_DOWN:
                    this._goToFirstTileOfNextGroup("down", oEvent);
                    break;
                case this.keyCodes.HOME:
                    this._homeEndButtonsHandler("first", oEvent, jqFocused);
                    break;
                case this.keyCodes.END:
                    this._homeEndButtonsHandler("last", oEvent, jqFocused);
                    break;
                case this.keyCodes.SPACE:
                    this._spaceButtonHandler(oEvent, jqFocused);
                    break;
                case this.keyCodes.ENTER:
                    this._enterButtonHandler(jqFocused);
                    break;
                default:
                    break;
            }

            return true;
        },

        init: function (oModel, oRouter) {
            this.oModel = oModel;
            // check if Router is already available here without passing it as a parameter is not done here
            this.oRouter = oRouter;
        }
    };

    var oComponentKeysHandler = new ComponentKeysHandler();

    return oComponentKeysHandler;

}, /* bExport= */ true);
},
	"sap/ushell/components/homepage/DashboardContent.controller.js":function(){// ${copyright}

sap.ui.define([
    'jquery.sap.global',
    './DashboardUIActions',
    'sap/ushell/utils',
    'sap/ushell/EventHub',
    'sap/ui/Device',
    'sap/ushell/components/homepage/ComponentKeysHandler'
], function (
    jQuery,
    DashboardUIActions,
    utils,
    EventHub,
    Device,
    ComponentKeysHandler
) {
	"use strict";

    sap.ui.controller("sap.ushell.components.homepage.DashboardContent", {

        onInit: function () {
            var oEventBus = sap.ui.getCore().getEventBus();
            this.isActionModeInited = false;

            this.handleDashboardScroll = this._handleDashboardScroll.bind(this);

            oEventBus.subscribe("sap.ushell", "appClosed", this._resizeHandler, this);
            oEventBus.subscribe("sap.ushell", "appOpened", this._appOpenedHandler, this);
            oEventBus.subscribe("launchpad", "dashboardModelContentLoaded", this._modelLoaded, this);
            oEventBus.subscribe('launchpad', 'actionModeInactive', this._handleGroupVisibilityChanges, this);
            oEventBus.subscribe("launchpad", 'animationModeChange', this._handleAnimationModeChange, this);
            oEventBus.subscribe("launchpad", 'switchTabBarItem', this._handleTabBarItemPressEventHandler, this);

            //when the browser tab is hidden we want to stop sending requests from tiles
            window.document.addEventListener("visibilitychange", utils.handleTilesVisibility, false);
            this.sViewId = "#" + this.oView.getId();

            //On Android 4.x, and Safari mobile in Chrome and Safari browsers sometimes we can see bug with screen rendering
            //so _webkitMobileRenderFix function meant to fix it after  `contentRefresh` event.
            if (Device.browser.mobile) {
                oEventBus.subscribe("launchpad", "contentRefresh", this._webkitMobileRenderFix, this);
            }
            this.isDesktop = (Device.system.desktop && (navigator.userAgent.toLowerCase().indexOf('tablet') < 0));
            this._setCenterViewPortShift();
        },

        onExit: function () {
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.unsubscribe("launchpad", "contentRefresh", this._webkitMobileRenderFix, this);
            oEventBus.unsubscribe("sap.ushell", "appClosed", this._resizeHandler, this);
            oEventBus.unsubscribe("sap.ushell", "appOpened", this._appOpenedHandler, this);
            oEventBus.unsubscribe("launchpad", "dashboardModelContentLoaded", this._modelLoaded, this);
            oEventBus.unsubscribe("launchpad", 'switchTabBarItem', this._handleTabBarItemPressEventHandler, this);
            window.document.removeEventListener("visibilitychange", utils.handleTilesVisibility, false);
        },

        onAfterRendering: function () {

            utils.setPerformanceMark("FLP - dashboard after rendering");
            var oEventBus = sap.ui.getCore().getEventBus(),
                oModel,
                topViewPortGroupIndex,
                oGroup,
                bIsInEditTitle,
                timer;

            //Bind launchpad event handlers
            oEventBus.unsubscribe("launchpad", "scrollToGroup", this._scrollToGroup, this);
            oEventBus.unsubscribe("launchpad", "scrollToGroupByName", this._scrollToGroupByName, this);
            oEventBus.subscribe("launchpad", "scrollToGroup", this._scrollToGroup, this);
            oEventBus.subscribe("launchpad", "scrollToGroupByName", this._scrollToGroupByName, this);
            oEventBus.unsubscribe("launchpad", "scrollToFirstVisibleGroup", this._scrollToFirstVisibleGroup, this);
            oEventBus.subscribe("launchpad", "scrollToFirstVisibleGroup", this._scrollToFirstVisibleGroup, this);

            Device.orientation.attachHandler(function () {
                var jqTileContainers = jQuery('#dashboardGroups').find('.sapUshellTileContainer:visible');
                if (jqTileContainers.length) {
                    oModel = this.getView().getModel();
                    topViewPortGroupIndex = oModel.getProperty('/topGroupInViewPortIndex');

                    if (jqTileContainers.get(topViewPortGroupIndex)) {
                        oGroup = sap.ui.getCore().byId(jqTileContainers.get(topViewPortGroupIndex).id);
                        bIsInEditTitle = oModel.getProperty('/editTitle');
                        this._publishAsync("launchpad", "scrollToGroup", {
                            group: oGroup,
                            isInEditTitle: bIsInEditTitle
                        });
                    }
                }
            }, this);

            jQuery(window).bind("resize", function () {
                clearTimeout(timer);
                timer = setTimeout(this._resizeHandler.bind(this), 300);
            }.bind(this));

            if (this.getView().getModel().getProperty("/personalization") && !this.isActionModeInited) {
                sap.ui.require(["sap/ushell/components/homepage/ActionMode"], function (ActionMode) {
                    ActionMode.init(this.getView().getModel());
                }.bind(this));
                this.isActionModeInited = true;
            }
            this._updateTopGroupInModel();
        },

        _setCenterViewPortShift: function () {
            var oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
            if (oViewPortContainer) {
                // The dashboard can contain the notification preview, hence,
                // shifting the scaled center veiwport (when moving to the right viewport) might be needed
                oViewPortContainer.shiftCenterTransition(true);
            }
        },

        _dashboardDeleteTileHandler: function (oEvent) {
            var oTileControl = oEvent.getSource(), oTile = oTileControl.getBindingContext().getObject().object,
                oData = {originalTileId: sap.ushell.Container.getService("LaunchPage").getTileId(oTile)};
            sap.ui.getCore().getEventBus().publish("launchpad", "deleteTile", oData, this);
        },

        dashboardTilePress: function (oEvent) {
            var oTileControl = oEvent.getSource();
            if (!oTileControl) {
                return;
            }

            //Set focus on tile upon clicking on the tile
            //Unless there is an input element inside tile, or tile is slide tile then leave the focus on it
            var bSlideTile = document.activeElement.id.indexOf("feedTile") !== -1;
            if (document.activeElement.tagName !== "INPUT" && bSlideTile !== true) {
                if (sap.ui.getCore().byId(oTileControl.getId())) {
                    ComponentKeysHandler.setTileFocus(oTileControl.$());
                }
            }
            sap.ui.getCore().getEventBus().publish("launchpad", "dashboardTileClick", {uuid: oTileControl.getUuid()});
        },

        _updateTopGroupInModel: function () {
            var oModel = this.getView().getModel(),
                topViewPortGroupIndex = this._getIndexOfTopGroupInViewPort();

            var iSelectedGroupInModel = this._getModelGroupFromVisibleIndex(topViewPortGroupIndex);

            oModel.setProperty('/iSelectedGroup', iSelectedGroupInModel);
            oModel.setProperty('/topGroupInViewPortIndex', topViewPortGroupIndex);
        },

        _getIndexOfTopGroupInViewPort: function () {
            var oView = this.getView(),
                oDomRef = oView.getDomRef(),
                oScrollableElement = oDomRef.getElementsByTagName('section'),
                jqTileContainers = jQuery(oScrollableElement).find('.sapUshellTileContainer'),
                oOffset = jqTileContainers.not('.sapUshellHidden').first().offset(),
                firstContainerOffset = (oOffset && oOffset.top) || 0,
                aTileContainersTopAndBottoms = [],
                nScrollTop = oScrollableElement[0].scrollTop,
                topGroupIndex = 0;

            // In some weird corner cases, those may not be defined -> bail out.
            if (!jqTileContainers || !oOffset) {
                return topGroupIndex;
            }

            jqTileContainers.each(function () {
                if (!jQuery(this).hasClass("sapUshellHidden")) {
                    var nContainerTopPos = jQuery(this).parent().offset().top;
                    aTileContainersTopAndBottoms.push([nContainerTopPos, nContainerTopPos + jQuery(this).parent().height()]);
                }
            });
            var viewPortTop = nScrollTop + firstContainerOffset;

            jQuery.each(aTileContainersTopAndBottoms, function (index, currentTileContainerTopAndBottom) {
                var currentTileContainerTop = currentTileContainerTopAndBottom[0],
                    currentTileContainerBottom = currentTileContainerTopAndBottom[1];

                //'24' refers to the hight decrementation of the previous TileContainer to improve the sync between the  top group in the viewport and the  selected group in the anchor bar.
                if (currentTileContainerTop - 24 <= viewPortTop && viewPortTop <= currentTileContainerBottom) {
                    topGroupIndex = index;
                    return false;
                }
            });
            return topGroupIndex;
        },

        _handleDashboardScroll: function () {
            var oView = this.getView(),
                oModel = oView.getModel(),
                nDelay = 400;

            var sHomePageGroupDisplay = oModel.getProperty("/homePageGroupDisplay"),
                bEnableAnchorBar = sHomePageGroupDisplay !== "tabs",
                bTileActionModeActive = oModel.getProperty("/tileActionModeActive");

            // We want to set tiles visibility only after the user finished the scrolling.
            // In IE this event is thrown also after scroll direction change, so we wait 1 second to
            // determine whether scrolling was ended completely or not
            function fHandleTilesVisibility () {
                utils.handleTilesVisibility();
            }
            clearTimeout(this.timeoutId);
            this.timeoutId = setTimeout(fHandleTilesVisibility, nDelay);

            if (!Device.system.phone) {
                //close anchor popover if it is open
                oView.oAnchorNavigationBar.closeOverflowPopup();
            }

            if (bEnableAnchorBar || bTileActionModeActive) {
                this._updateTopGroupInModel();

                //Handle scrolling for the Notifications Preview.
                //oView._handleHeadsupNotificationsPresentation.apply(oView, [sCurrentViewPortState]);
            }

            //update anchor navigation bar
            oView.oAnchorNavigationBar.reArrangeNavigationBarElements();
        },

        //Delete or Reset a given group according to the removable state.
        _handleGroupDeletion: function (oGroupBindingCtx) {

            var oEventBus = sap.ui.getCore().getEventBus(),
                oGroup = oGroupBindingCtx.getObject(),
                bIsGroupRemovable = oGroup.removable,
                sGroupTitle = oGroup.title,
                sGroupId = oGroup.groupId,
                oResourceBundle = sap.ushell.resources.i18n,
                oMessageSrvc = sap.ushell.Container.getService("Message"),
                mActions,
                mCurrentAction;

            sap.ui.require(['sap/m/MessageBox'], function (MessageBox) {
                mActions = MessageBox.Action;
                mCurrentAction = (bIsGroupRemovable ? mActions.DELETE : oResourceBundle.getText('ResetGroupBtn'));
                oMessageSrvc.confirm(oResourceBundle.getText(bIsGroupRemovable ? 'delete_group_msg' : 'reset_group_msg', sGroupTitle), function (oAction) {
                    if (oAction === mCurrentAction) {
                        oEventBus.publish("launchpad", bIsGroupRemovable ? 'deleteGroup' : 'resetGroup', {
                            groupId: sGroupId
                        });
                    }
                }, oResourceBundle.getText(bIsGroupRemovable ? "delete_group" : "reset_group"), [mCurrentAction, mActions.CANCEL]);
            });
        },

        _modelLoaded: function () {
            this.bModelInitialized = true;
            sap.ushell.Layout.getInitPromise().then(function () {
                this._initializeUIActions();
            }.bind(this));
        },
        _initializeUIActions: function () {
            this.oDashboardUIActionsModule = new DashboardUIActions();
            this.oDashboardUIActionsModule.initializeUIActions(this);
        },
        //force browser to repaint Body, by setting it `display` property to 'none' and to 'block' again
        _forceBrowserRerenderElement: function (element) {
            var animationFrame = window.requestAnimationFrame || window.webkitRequestAnimationFrame;
            if (animationFrame) {
                animationFrame(function () {
                    var display = element.style.display;
                    element.style.display = 'none';
                    element.style.display = display;
                });
            } else {
                jQuery.sap.log.info('unsupported browser for animation frame');
            }
        },

        //function fixes Android 4.x Chrome, and Safari bug with poor rendering
        _webkitMobileRenderFix: function () {
            //force Chrome to repaint Body, by setting it `display` property to 'none' and to 'block' again
            if (Device.browser.chrome || Device.os.android) {
                // this includes almost all browsers and devices
                // if this is the IOS6 (as the previous fix causes double flickering
                // and this one only one flickering)
                this._forceBrowserRerenderElement(document.body);
            }
        },

        _resizeHandler: function () {
            this._addBottomSpace();
            utils.handleTilesVisibility();

            //Layout calculation is relevant only when the dashboard is presented
            var bInDahsboard = jQuery.find("#dashboardGroups:visible").length;

            // "reset" the appRendered event in case the user wants to navigate back to the same app.
            if (EventHub.last("AppRendered") != undefined) {
                EventHub.emit("AppRendered", undefined);
            }

            if (sap.ushell.Layout && bInDahsboard) {
                sap.ushell.Layout.reRenderGroupsLayout(null);
                this._initializeUIActions();
            }
        },

        _handleAnimationModeChange: function (sChannelId, sEventId, oData) {
            var oModel = this.getView().getModel();

            oModel.setProperty('/animationMode', oData.sAnimationMode);
        },

        _appOpenedHandler: function (sChannelId, sEventId, oData) {
            var oViewPortContainer,
                oParentComponent,
                sParentName,
                oModel = this.getView().getModel();

            // checking if application component opened is not the FLP App Component (e.g. navigation to an app, not 'Home')
            // call to set all tiles visibility off (so no tile calls will run in the background)
            oParentComponent = this.getOwnerComponent();
            sParentName = oParentComponent.getMetadata().getComponentName();
            if (oData.additionalInformation.indexOf(sParentName) === -1) {
                utils.setTilesNoVisibility();// setting no visibility on all visible tiles
                // After an application is opened - the notification preview is not shown,
                // hence, shifting the scaled center veiwport (when moving to the right viewport) is not needed
                oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
                if (oViewPortContainer) {
                    oViewPortContainer.shiftCenterTransition(false);
                }
            }

            // in a direct navigation scenario the ActionMode might not exist yet.
            // In this case we would like to skip this check.
            if (sap.ushell.components.homepage.ActionMode && sap.ushell.components.homepage.ActionMode.oModel &&
                    sap.ushell.components.homepage.ActionMode.oModel.getProperty("/tileActionModeActive")) {

                sap.ushell.components.homepage.ActionMode.toggleActionMode(oModel, "Menu Item");
            }

            if (this.oDashboardUIActionsModule) {
                this.oDashboardUIActionsModule.disableAllDashboardUiAction();
            }
        },
        _addBottomSpace: function () {
            utils.addBottomSpace();
        },

        _scrollToFirstVisibleGroup: function (sChannelId, sEventId, oData) {
            var sGroupId,
                oViewGroups = this.oView.oDashboardGroupsBox.getGroups(),
                fromTop = oData.fromTop > 0 ? oData.fromTop : 0;

            if (oData.group) {
                sGroupId = oData.group.getGroupId();
            } else {
                // in case of scroll after deletion, the oData contains only the groupId.
                sGroupId = oData.groupId;
            }

            if (oViewGroups) {
                jQuery.each(oViewGroups, function (nIndex, oGroup) {
                    if (oGroup.getGroupId() === sGroupId) {
                        var iY = document.getElementById(oGroup.sId).offsetTop;
                        jQuery('.sapUshellDashboardView section').stop().animate({scrollTop: iY + fromTop}, 0);

                        // we focus first tile automatically
                        ComponentKeysHandler.setTileFocus(jQuery("#" + oGroup.getId() + " li").first());

                        return false;
                    }
                });
                utils.addBottomSpace();
            }
        },
        /**
         * Scrolling the dashboard according to group name, in order to show a desired group
         */
        _scrollToGroupByName: function (sChannelId, sEventId, oData) {
            var oGroups = this.getView().getModel().getProperty("/groups"),
                sGroupName = oData.groupName,
                oLaunchPageSrv = sap.ushell.Container.getService('LaunchPage');

            jQuery.each(oGroups, function (nIndex, oGroup) {
                if (oLaunchPageSrv.getGroupTitle(oGroup.object)  === sGroupName) {
                    this._scrollToGroup(sChannelId, sEventId, {
                        groupId: oGroup.groupId
                    });
                }
            }.bind(this));
        },
        /**
         * Scrolling the dashboard in order to show a desired group
         */
        _scrollToGroup: function (sChannelId, sEventId, oData, iDuration) {
            var sGroupId,
                iDuration = oData.iDuration == undefined ? 500 : oData.iDuration,
                oView = this.getView(),
                oModel = oView.getModel(),
                bMinimalAnimationMode = oModel.getProperty('/animationMode') === 'minimal',
                that = this;

            if (bMinimalAnimationMode) {
                iDuration = 0;
            }
            if (oData.group) {
                sGroupId = oData.group.getGroupId();
            } else {
                // in case of scroll after deletion, the oData contains only the groupId.
                sGroupId = oData.groupId;
            }
            that.iAnimationDuration = iDuration;
            // The model flag /scrollingToGroup indicates a scroll-to-group action currently occurs,
            if (this.oView.oDashboardGroupsBox.getGroups()) {
                // Calling again getGroups() because of the lazy loading mechanism
                jQuery.each(this.oView.oDashboardGroupsBox.getGroups(), function (nIndex, oGroup) {
                    if (oGroup.getGroupId() === sGroupId) {
                        var iY;
                        setTimeout(function () {
                            iY = -1 * (document.getElementById('dashboardGroups').getBoundingClientRect().top) + document.getElementById(oGroup.sId).getBoundingClientRect().top;
                            var groupHeaderHeight = jQuery(document.getElementById(oGroup.sId)).find(".sapUshellTileContainerHeader").height();
                            var groupBeforeContentHeight = jQuery(document.getElementById(oGroup.sId)).find(".sapUshellTileContainerBeforeContent").height();
                            var bIsActionsModeActive = oGroup.getModel().getProperty('/tileActionModeActive');
                            // don't display group header after scroll in non edit mode. Group header will be visible in the anchor bar
                            // check if group header is visible, and only then scroll additional 3rem to hide it
                            // in edit mode hide the before content + 0.5rem padding
                            iY = groupHeaderHeight > 0 && !bIsActionsModeActive ? iY + 48 : iY + groupBeforeContentHeight + 8;
                            jQuery('.sapUshellDashboardView section').stop().animate({scrollTop: iY}, that.iAnimationDuration,
                                function () {
                                    // set first tile focus on animation end
                                    if (oData.groupChanged) {
                                        if (!oData.restoreLastFocusedTile) {
                                            // set focus on the first tile of the group we scrolled to
                                            var jqTile = jQuery("#" + oGroup.getId() + " .sapUshellTile:visible:first"),
                                                jqLink = jQuery("#" + oGroup.getId() + " .sapMGTLineMode:visible:first");

                                            if (jqTile.length) {
                                                ComponentKeysHandler.setTileFocus(jqTile);
                                            } else if (jqLink.length) {
                                                ComponentKeysHandler.setTileFocus(jqLink);
                                            }
                                        }
                                    }

                                    // regardless to group change - if we need to restore last focused tile we must do so.
                                    if (oData.restoreLastFocusedTile){

                                        var sTileContainerSelector = "#" + oGroup.getId();
                                        var bLookForLastVisitedInSameGroup = false;

                                        // if we need to restore focus on a specific tile-container (rather then current group)
                                        // then we supply the tile container and set true to bLookForLastVisitedInSameGroup (see goToLastVisitedTile method)
                                        if (oData.restoreLastFocusedTileContainerById) {
                                            sTileContainerSelector = "#" + oData.restoreLastFocusedTileContainerById;
                                            bLookForLastVisitedInSameGroup = true;
                                        }

                                        ComponentKeysHandler.goToLastVisitedTile(jQuery(sTileContainerSelector), bLookForLastVisitedInSameGroup);
                                    }

                                });
                            if (oData.isInEditTitle) {
                                oGroup.setEditMode(true);
                            }
                        }, 0);

                        //fix bottom space, if this a deletion scenario the 'oData.groupId' will return true
                        if (oData.groupId || oData.groupChanged) {
                            that._addBottomSpace();
                        }
                        // Recalculate tiles visibility
                        utils.handleTilesVisibility();
                        return false;
                    }
                });
            }
        },

        /**
         * Handler for dropping a tile object at the end of drag and drop action.
         *
         * @param event
         * @param ui : tile DOM Reference
         * @private
         */
        _handleDrop: function (event, ui) {
            var oLayout = sap.ushell.Layout.getLayoutEngine(),
                tileMoveInfo = oLayout.layoutEndCallback(),
                bIsShortDrop = !tileMoveInfo.dstArea,
                oEventBus = sap.ui.getCore().getEventBus(),
                noRefreshSrc,
                noRefreshDst,
                sTileUuid,
                oDeferred = jQuery.Deferred(),
                oView = this.getView(),
                oModel = oView.getModel(),
                bTabMode = oModel.getProperty('/homePageGroupDisplay') && oModel.getProperty('/homePageGroupDisplay') === 'tabs',
                bEditMode = oModel.getProperty('/tileActionModeActive'),
                bIsShortDropToLocked = true,
                ieHtml5DnD = !!(oModel.getProperty("/personalization") && (Device.browser.msie || Device.browser.edge) && Device.browser.version >= 11 &&
                (Device.system.combi || Device.system.tablet)),
                oPageBuilderService = sap.ushell.Container.getService("LaunchPage"),
                oTile = tileMoveInfo.tile.getBindingContext().getObject().object,
                bIsLinkPersonalizationSupported = oPageBuilderService.isLinkPersonalizationSupported(oTile);

            sap.ushell.Layout.getLayoutEngine()._toggleAnchorItemHighlighting(false);
            //Short drop to a locked group
            if (tileMoveInfo.dstGroup) {
                var dstGroupBindingContext = tileMoveInfo.dstGroup.getBindingContext(),
                    isDestGroupLocked = dstGroupBindingContext.getProperty(dstGroupBindingContext.sPath).isGroupLocked;
                bIsShortDropToLocked = bIsShortDrop && isDestGroupLocked;
            }

            if (!tileMoveInfo.tileMovedFlag || (ieHtml5DnD && oLayout.isTabBarCollision()) || bIsShortDropToLocked || (!bIsLinkPersonalizationSupported && tileMoveInfo.dstArea === 'links')) {
                oEventBus.publish("launchpad", "sortableStop");
                return null; //tile was not moved
            }

            //If we are in EditMode and the target group has no links (empty links area) and the anchor bar isn't in tabs mode,
            //then we continue as tile was not moved.
            if (!bEditMode && !bTabMode && tileMoveInfo.dstArea === "links" && !tileMoveInfo.dstGroupData.getLinks().length) {
                oEventBus.publish("launchpad", "sortableStop");
                return null; //tile was not moved
            }

            noRefreshSrc = true;
            noRefreshDst = true; //Default - suppress re-rendering after drop
            //if src and destination groups differ - refresh src and dest groups
            //else if a tile has moved & dropped in a different position in the same group - only dest should refresh (dest == src)
            //if a tile was picked and dropped - but never moved - the previous if would have returned
            if ((tileMoveInfo.srcGroup !== tileMoveInfo.dstGroup)) {
                noRefreshSrc = noRefreshDst = false;
            } else if (tileMoveInfo.tile !== tileMoveInfo.dstGroup.getTiles()[tileMoveInfo.dstTileIndex]) {
                noRefreshDst = false;
            }

            sTileUuid = this._getTileUuid(tileMoveInfo.tile);
            if (tileMoveInfo.srcGroup && tileMoveInfo.srcGroup.removeAggregation && tileMoveInfo.srcArea) {
                tileMoveInfo.srcGroup.removeAggregation('tiles', tileMoveInfo.tile, noRefreshSrc);
            }

            // If this is Tab Bar use-case, and the action is "long" Drag&Drop of a tile on a tab (group):
            // the destination group (whose aggregation needs to be updated) is not in the dashboard, unless the drag is to the same group.
            // Instead - the publish of movetile event will update the group in the model
            var bSameDropArea = tileMoveInfo.dstGroupData && tileMoveInfo.dstGroupData.insertAggregation && tileMoveInfo.dstArea === tileMoveInfo.srcArea;

            //Handles two scenarios - 1. Same group drop - tile to tile/link to link 2. Long drop - tile to tile/link to link
            if (bSameDropArea) {
                tileMoveInfo.tile.sParentAggregationName = tileMoveInfo.dstArea;//"tiles"
                tileMoveInfo.dstGroupData.insertAggregation(tileMoveInfo.dstArea, tileMoveInfo.tile, tileMoveInfo.dstTileIndex, noRefreshDst);

                this._showDropToastMessage(tileMoveInfo);

                oDeferred = this._handleSameTypeDrop(tileMoveInfo, sTileUuid, bSameDropArea);

            //Handles three scenarios - 1. Short drop 2. Same group - tile to link/link to tile 3. Long drop - tile to link/link to tile
            } else {
                this._showDropToastMessage(tileMoveInfo);

                if (bIsShortDrop) {
                    oDeferred = this._handleShortDrop(tileMoveInfo, sTileUuid, bSameDropArea);
                } else {
                    oDeferred = this._handleConvertDrop(tileMoveInfo, bSameDropArea, ui);
                }
            }

            if (this.getView().getModel()) {
                this.getView().getModel().setProperty('/draggedTileLinkPersonalizationSupported', true);
            }
            oEventBus.publish("launchpad", "sortableStop");
            return oDeferred.promise();
        },

        _showDropToastMessage: function (tileMoveInfo) {
            var sTileTitle = this._getTileTitle(tileMoveInfo),
                sDestGroupName = tileMoveInfo.dstGroup.getHeaderText ? tileMoveInfo.dstGroup.getHeaderText() : tileMoveInfo.dstGroup.getTitle(),
                sToastStaticText = sap.ushell.resources.i18n.getText('added_tile_to_group'),
                sToastMessageText = sTileTitle + ' ' + sToastStaticText + ' ' + sDestGroupName,
                toGroupId = tileMoveInfo.dstGroupData.getGroupId ? tileMoveInfo.dstGroupData.getGroupId() : tileMoveInfo.dstGroupData.groupId,
                srcGroupId = tileMoveInfo.srcGroup.getGroupId ? tileMoveInfo.srcGroup.getGroupId() : tileMoveInfo.srcGroup.groupId;

            if (toGroupId !== srcGroupId) {
                sap.m.MessageToast.show(sap.ushell.resources.i18n.getText(sToastMessageText));
            }
        },

        _handleSameTypeDrop: function (tileMoveInfo, sTileUuid, bSameDropArea) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                oDeferred = jQuery.Deferred();
            tileMoveInfo.tile._getBindingContext().oModel.setProperty(tileMoveInfo.tile._getBindingContext().sPath + '/draggedInTabBarToSourceGroup', false);
            oEventBus.publish("launchpad", "movetile", {
                sTileId: sTileUuid,
                sToItems: tileMoveInfo.dstArea ? tileMoveInfo.dstArea : "tiles",
                sFromItems: tileMoveInfo.srcArea ? tileMoveInfo.srcArea : "tiles",
                sTileType: tileMoveInfo.dstArea ? tileMoveInfo.dstArea.substr(0, tileMoveInfo.dstArea.length - 1) : undefined,
                toGroupId: tileMoveInfo.dstGroupData.getGroupId ? tileMoveInfo.dstGroupData.getGroupId() : tileMoveInfo.dstGroupData.groupId,
                toIndex: tileMoveInfo.dstTileIndex,
                longDrop: bSameDropArea,
                callBack: function () {
                    oDeferred.resolve();
                }
            });
            return oDeferred.promise();
        },

        _handleShortDrop: function (tileMoveInfo, sTileUuid, bSameDropArea) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                oDeferred = jQuery.Deferred();
            oEventBus.publish("launchpad", "movetile", {
                sTileId: sTileUuid,
                sToItems: tileMoveInfo.srcArea || "tiles",
                sFromItems: tileMoveInfo.srcArea || "tiles",
                sTileType: tileMoveInfo.srcArea ? tileMoveInfo.srcArea.substr(0, tileMoveInfo.srcArea.length - 1) : undefined,
                toGroupId: tileMoveInfo.dstGroupData.getGroupId ? tileMoveInfo.dstGroupData.getGroupId() : tileMoveInfo.dstGroupData.groupId,
                toIndex: tileMoveInfo.dstTileIndex,
                longDrop: bSameDropArea,
                callBack: function () {
                    oDeferred.resolve();
                }
            });
            return oDeferred.promise();
        },

        _handleConvertDrop: function (tileMoveInfo, bSameDropArea, ui) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                oDeferred = jQuery.Deferred();
            oEventBus.publish("launchpad", "convertTile", {
                toGroupId: tileMoveInfo.dstGroupData.getGroupId ? tileMoveInfo.dstGroupData.getGroupId() : tileMoveInfo.dstGroupData.groupId,
                toIndex: tileMoveInfo.dstTileIndex,
                tile: sap.ui.getCore().byId(ui.id),
                srcGroupId: tileMoveInfo.srcGroup.getGroupId ? tileMoveInfo.srcGroup.getGroupId() : tileMoveInfo.srcGroup.groupId,
                longDrop: bSameDropArea,
                callBack: function () {
                    oDeferred.resolve();
                }
            });
            return oDeferred.promise();
        },

        _getTileTitle: function (oTileMoveInfo) {
            var oModel = this.getView().getModel(),
                sBindingCtxPath = oTileMoveInfo.tile.getBindingContext().getPath(),
                oTileChipObj = oModel.getProperty(sBindingCtxPath).object,
                sTileTitle = sap.ushell.Container.getService('LaunchPage').getTileTitle(oTileChipObj);

            return sTileTitle;
        },

        _getTileUuid: function (oTileObject) {
            var sType = oTileObject.getMode ? oTileObject.getMode() : 'ContentMode',
                sTileUuid;

            if (sType === 'LineMode') {
                sTileUuid = oTileObject.getUuid ? oTileObject.getUuid() : oTileObject.getBindingContext().getObject().uuid;
            } else {
                sTileUuid = oTileObject.getUuid ? oTileObject.getUuid() : oTileObject.getBindingContext().getObject().getParent().getUuid();
            }

            return sTileUuid;
        },

        _handleDrag: function (event, ui) {
          var tileDragInfo = sap.ushell.Layout.getLayoutEngine().layoutEndCallback(),
              oPageBuilderService = sap.ushell.Container.getService("LaunchPage"),
              oTile = tileDragInfo.tile.getBindingContext().getObject().object,
              bIsLinkPersonalizationSupported = oPageBuilderService.isLinkPersonalizationSupported(oTile),
              oView = this.getView(),
              oModel = oView.getModel();

          if (oModel) {
              oModel.setProperty('/draggedTileLinkPersonalizationSupported', bIsLinkPersonalizationSupported);
          }
        },

        _handleTabBarItemPressEventHandler : function (sChannelId, sEventId, oData) {
            var oView = this.getView(),
                oModel = oView.getModel(),
                aGroups = oModel.getProperty("/groups"),
                iGroupIndex = oData.iGroupIndex;

            // first reset the isGroupSelected property for all groups.
            for (var i = 0; i < aGroups.length; i++) {
                oModel.setProperty("/groups/" + i + "/isGroupSelected", false);
            }
            // set the selected group (for the model update we use the original index)
            oModel.setProperty("/groups/" + iGroupIndex + "/isGroupSelected", true);

            this._handleTabBarItemPress(sChannelId, sEventId, iGroupIndex);
        },

        _handleTabBarItemPress: function (sChannelId, sEventId, iGroupIndex, oEvent) {
            var oView = this.getView(),
                // Fix the selected group index not to include the hidden groups.
                selectedGroupIndex,
                fixedIndex;


            if (oEvent) {
                selectedGroupIndex = oEvent.getParameter("group").getIndex();
            } else {
                selectedGroupIndex = iGroupIndex;
            }

            sap.ui.getCore().getEventBus().publish("launchpad", "tabSelected", { iSelectedGroup: selectedGroupIndex });

            fixedIndex = this._getVisibleGroupIndex(selectedGroupIndex);

            // apply the filter
            oView.oDashboardGroupsBox.removeLinksFromUnselectedGroups();
            oView.oDashboardGroupsBox.getBinding("groups").filter([oView.oFilterSelectedGroup]);
            // change the anchor bar selection
            oView.oAnchorNavigationBar.setSelectedItemIndex(fixedIndex);
            oView.oAnchorNavigationBar.reArrangeNavigationBarElements();
            // change tiles visibility of the new selected group
            setTimeout(function () {
                utils.handleTilesVisibility();
            }, 0);
        },

        _getVisibleGroupIndex: function (selectedGroupIndex){
            var aGroups = this.getView().getModel().getProperty("/groups");
            var iHiddenGroupsCount = 0;

            // Go through the groups that are located before the selected group
            for (var i = 0; i < selectedGroupIndex; i++) {
                if (!aGroups[i].isGroupVisible || !aGroups[i].visibilityModes[0]) {
                    // Count all groups that are not visible in non-edit mode
                    iHiddenGroupsCount++;
                }
            }

            return selectedGroupIndex - iHiddenGroupsCount;
        },

        _getModelGroupFromVisibleIndex: function (selectedGroupIndex){
            var aGroups = this.getView().getModel().getProperty("/groups"),
                iVisGroupsCount = 0;

            for (var i = 0; i < aGroups.length; i++) {
                if (aGroups[i].isGroupVisible && aGroups[i].visibilityModes[0]) {
                    // Count all groups that are not visible in non-edit mode
                    iVisGroupsCount++;

                    if (iVisGroupsCount > selectedGroupIndex){
                        return i;
                    }
                }
            }

            return 0;

        },

        _handleAnchorItemPress: function (oEvent) {
            var oView = this.getView(),
                oModel = oView.getModel(),
                aGroups = oModel.getProperty("/groups");

            //press on item could also be fired from overflow popup, but it will not have "manualPress" parameter
            if (Device.system.phone && oEvent.getParameter("manualPress")) {
                oEvent.oSource.openOverflowPopup();
            }

            // reset the isGroupSelected property for all groups before set the selected group
            for (var i = 0; i < aGroups.length; i++) {
                if (oModel.getProperty("/groups/" + i + "/isGroupSelected") === true) {
                    oModel.setProperty("/groups/" + i + "/isGroupSelected", false);
                }
            }
            // set the selected group (for the model update we use the original index)
            oModel.setProperty("/groups/" + oEvent.getParameter("group").getIndex() + "/isGroupSelected", true);
            oModel.setProperty("/iSelectedGroup", oEvent.getParameter("group").getIndex());

            // if tabs
            if (oModel.getProperty("/homePageGroupDisplay") && oModel.getProperty("/homePageGroupDisplay") === "tabs" && !oModel.getProperty("/tileActionModeActive")) {
                this._handleTabBarItemPress(undefined, undefined, undefined, oEvent);

            // else scroll or edit mode
            } else {
                // reset the filter

                if (!oModel.getProperty("/tileActionModeActive")) {
                    oView.oDashboardGroupsBox.getBinding("groups").filter([new sap.ui.model.Filter("isGroupVisible", sap.ui.model.FilterOperator.EQ, true)]);
                } else {
                    oView.oDashboardGroupsBox.getBinding("groups").filter([]);
                }

                // scroll to selected group
                this._scrollToGroup("launchpad", "scrollToGroup", {
                    group: oEvent.getParameter('group'),
                    groupChanged: true,
                    focus: (oEvent.getParameter("action") === "sapenter")
                });
            }
        },
        _addGroupHandler: function (oData) {
            var index,
                path = oData.getSource().getBindingContext().getPath(),
                parsePath = path.split("/");

            index = window.parseInt(parsePath[parsePath.length - 1], 10);

            if (oData.getSource().sParentAggregationName === "afterContent") {
                index = index + 1;
            }

            sap.ui.getCore().getEventBus().publish("launchpad", "createGroupAt", {
                title: "",
                location: index,
                isRendered: true
            });
        },

        _publishAsync: function (sChannelId, sEventId, oData) {
            var oBus = sap.ui.getCore().getEventBus();
            window.setTimeout(jQuery.proxy(oBus.publish, oBus, sChannelId, sEventId, oData), 1);
        },
        _changeGroupVisibility: function (oGroupBindingCtx) {
            var sBindingCtxPath = oGroupBindingCtx.getPath(),
                oModel = oGroupBindingCtx.getModel(),
                bGroupVisibilityState = oModel.getProperty(sBindingCtxPath + "/isGroupVisible");

            if (oModel.getProperty(sBindingCtxPath + '/isDefaultGroup')
                || oModel.getProperty(sBindingCtxPath + '/isGroupLocked')) {
                return;
            }

            oModel.setProperty(sBindingCtxPath + "/isGroupVisible", !bGroupVisibilityState);
        },

        //Persist the group visibility changes (hidden groups) in the back-end upon deactivation of the Actions Mode.
        _handleGroupVisibilityChanges: function (sChannelId, sEventId, aOrigHiddenGroupsIds) {
            var oLaunchPageSrv = sap.ushell.Container.getService('LaunchPage'),
                oModel = this.getView().getModel(),
                aCurrentHiddenGroupsIds = utils.getCurrentHiddenGroupIds(oModel),
                bSameLength = aCurrentHiddenGroupsIds.length === aOrigHiddenGroupsIds.length,
                bIntersect = bSameLength,
                oPromise;

            //Checks whether there's a symmetric difference between the current set of hidden groups and the genuine one
            aCurrentHiddenGroupsIds.some(function (sHiddenGroupId, iIndex) {
                if (!bIntersect) {
                    return true;
                }
                bIntersect = jQuery.inArray(sHiddenGroupId, aOrigHiddenGroupsIds) !== -1;

                return !bIntersect;
            });

            if (!bIntersect) {
                oPromise = oLaunchPageSrv.hideGroups(aCurrentHiddenGroupsIds);
                oPromise.done(function () {
                    oModel.updateBindings('groups');
                }.bind(this));
                oPromise.fail(function () {
                    var msgService = sap.ushell.Container.getService('Message');

                    msgService.error(sap.ushell.resources.i18n.getText('hideGroups_error'));
                });
            }
        },

        _updateShellHeader: function () {
            if (!this.oShellUIService) {
                this._initializeShellUIService();
            } else {
                // As the Dashboard is currently the default page for the Shell, we call set title and set hierarchy with no value
                // so the default value will be set
                this.oShellUIService.setTitle();
                this.oShellUIService.setHierarchy();
            }

        },

        _initializeShellUIService: function () {
            return sap.ui.require(["sap/ushell/ui5service/ShellUIService"], function (ShellUIService) {
                this.oShellUIService = new ShellUIService({
                    scopeObject: this.getOwnerComponent(),
                    scopeType: "component"
                });
                // As the Dashboard is currently the default page for the Shell, we call set title and set hierarchy with no value
                // so the default value will be set
                this.oShellUIService.setTitle();
                this.oShellUIService.setHierarchy();
                return this.oShellUIService;
            }.bind(this));
        },

        _deactivateActionModeInTabsState : function () {
            var oView = this.getView(),
                oModel = oView.getModel();
            // First reset the isGroupSelected property for all groups.
            var aGroups = oModel.getProperty("/groups");
            for (var i = 0; i < aGroups.length; i++) {
                oModel.setProperty("/groups/" + i + "/isGroupSelected", false);
            }

            var selectedIndex = oView.oAnchorNavigationBar.getSelectedItemIndex();

            var iHiddenGroupsCount = 0;
            // If the selected group is a hidden group, go to the first visible group
            if (!this._isGroupVisible(selectedIndex)) {
                for (var i = 0; i < aGroups.length; i++) {
                    if (!this._isGroupVisible(i)) {
                        iHiddenGroupsCount++;
                    } else {
                        selectedIndex = i;
                        break;
                    }
                }
            } else {
                // Count all hidden groups that are located before the selected group
                for (var i = 0; i < selectedIndex; i++) {
                    if (!this._isGroupVisible(i)) {
                        iHiddenGroupsCount++;
                    }
                }
            }

            // Fix the selected index not to include the hidden groups
            var fixedIndex = selectedIndex - iHiddenGroupsCount;
            // Change the anchor bar selection
            oView.oAnchorNavigationBar.setSelectedItemIndex(fixedIndex);
            oView.oAnchorNavigationBar.adjustItemSelection(fixedIndex);

            // Set the selected group and then filter
            oModel.setProperty("/groups/" + selectedIndex + "/isGroupSelected", true);
            oView.oDashboardGroupsBox.removeLinksFromAllGroups();

            var sGroupsMode = oModel.getProperty('/homePageGroupDisplay');
            if (sGroupsMode && sGroupsMode === "tabs") {
                oView.oDashboardGroupsBox.getBinding("groups").filter([oView.oFilterSelectedGroup]);
                sap.ui.getCore().getEventBus().publish("launchpad", "beforeAndAfterContentRemoved");
            }
        },

        _isGroupVisible : function (groupIndex) {
            var aGroups = this.getView().getModel().getProperty("/groups");
            return (aGroups[groupIndex].isGroupVisible && aGroups[groupIndex].visibilityModes[0]);
        }
    });
}, /* bExport= */ false);
},
	"sap/ushell/components/homepage/DashboardContent.view.js":function(){// ${copyright}
/**
 * @fileOverview The Fiori launchpad main view.<br>
 * The view is of type <code>sap.ui.jsview</code> that includes a <code>sap.m.page</code>
 * with a header of type <code>sap.ushell.ui.launchpad.AnchorNavigationBar</code>
 * and content of type <code>sap.ushell.ui.launchpad.DashboardGroupsContainer</code>.
 *
 * @version ${version}
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
},
	"sap/ushell/components/homepage/DashboardGroupsBox.js":function(){// ${copyright}
/**
 * @fileOverview A module that is responsible for creating the groups part (i.e. box) of the dashboard.<br>
 * Extends <code>sap.ui.base.Object</code><br>
 * Exposes the public function <code>createGroupsBox</code>
 * @see sap.ushell.components.homepage.DashboardContent.view
 *
 * @version ${version}
 * @name sap.ushell.components.homepage.DashboardGroupsBox
 * @since 1.35.0
 * @private
 */
sap.ui.define ([
    "sap/ushell/Layout",
    "sap/ui/base/Object",
    "sap/ushell/ui/launchpad/DashboardGroupsContainer",
    "sap/ushell/EventHub",
    "sap/ushell/Config",
    "sap/ui/core/Component"
], function (
    Layout,
    baseObject,
    DashboardGroupsContainer,
    EventHub,
    Config,
    Component
) {
	"use strict";

    /*global jQuery, sap, window */
    /*jslint nomen: true */
    var DashboardGroupsBox = baseObject.extend("sap.ushell.components.homepage.DashboardGroupsBox", {
        metadata: {
            publicMethods: ["createGroupsBox"]
        },
        constructor: function (sId, mSettings) {
            // Make this class only available once
            if (sap.ushell.components.homepage.getDashboardGroupsBox && sap.ushell.components.homepage.getDashboardGroupsBox()) {
                return sap.ushell.components.homepage.getDashboardGroupsBox();
            }
            sap.ushell.components.homepage.getDashboardGroupsBox = jQuery.sap.getter(this.getInterface());

            this.oController = undefined;
            this.oGroupsContainer = undefined;
            this.bTileContainersContentAdded = false;
            this.isLinkPersonalizationSupported = sap.ushell.Container.getService("LaunchPage").isLinkPersonalizationSupported();

            sap.ui.getCore().getEventBus().subscribe("launchpad", "actionModeActive", this._handleActionModeChange, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", "actionModeInactive", this._handleActionModeChange, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", "GroupHeaderVisibility", this._updateGroupHeaderVisibility, this);
            sap.ui.getCore().getEventBus().subscribe("launchpad", "beforeAndAfterContentRemoved", this._removedContent, this);
        },
        destroy: function () {
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "actionModeActive", this._handleActionModeChange, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "actionModeInactive", this._handleActionModeChange, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "GroupHeaderVisibility", this._updateGroupHeaderVisibility, this);
            sap.ui.getCore().getEventBus().unsubscribe("launchpad", "beforeAndAfterContentRemoved", this._removedContent, this);
            sap.ushell.components.homepage.getDashboardGroupsBox = undefined;
        },

        calculateFilter: function () {
            // get the homeGroupDisplayMode and do the filter accordingly
            var filters = [];
            var oFilter;
            var sGroupsMode = this.oModel.getProperty('/homePageGroupDisplay'),
                bEditMode = this.oModel.getProperty("/tileActionModeActive");

            if (!bEditMode) {
                if (sGroupsMode && sGroupsMode === "tabs"){
                    oFilter = new sap.ui.model.Filter("isGroupSelected", sap.ui.model.FilterOperator.EQ, true);
                } else {
                    oFilter = new sap.ui.model.Filter("isGroupVisible", sap.ui.model.FilterOperator.EQ, true);
                }
                filters.push(oFilter);
            }

            return filters;
        },

        /**
         * Creating the groups part (i.e. box) of the dashboard
         */
        createGroupsBox : function (oController, oModel) {
            this.oController = oController;
            var that = this,
                fAfterLayoutInit,
                fGroupsContainerAfterRenderingHandler,
                oTilesContainerTemplate = this._getTileContainerTemplate(oController, oModel),
                fnEnableLockedGroupCompactLayout = function () {
                    return that.oModel.getProperty('/enableLockedGroupsCompactLayout') && !that.oModel.getProperty('/tileActionModeActive');
                },
                getPlusTileFromGroup = function (oGroup) {
                    var groupDomRef,
                        plusTileDomRef;
                    if (oGroup && (groupDomRef = oGroup.getDomRef())) {
                        plusTileDomRef = groupDomRef.querySelector('.sapUshellPlusTile');
                        if (plusTileDomRef) {
                            return plusTileDomRef;
                        }
                    }
                    return null;
                },
                reorderTilesCallback = function (layoutInfo) {
                    var plusTileStartGroup = getPlusTileFromGroup(layoutInfo.currentGroup),
                        plusTileEndGroup = getPlusTileFromGroup(layoutInfo.endGroup),
                        isPlusTileVanishRequired = (layoutInfo.tiles[layoutInfo.tiles.length - 2] === layoutInfo.item) || (layoutInfo.endGroup.getTiles().length === 0);
                    if (isPlusTileVanishRequired) {
                        that._hidePlusTile(plusTileEndGroup);
                    } else {
                        that._showPlusTile(plusTileEndGroup);
                    }

                    if (layoutInfo.currentGroup !== layoutInfo.endGroup) {
                        that._showPlusTile(plusTileStartGroup);
                    }
                };

            //Since the layout initialization is async, we need to execute the below function after initialization is done
            fAfterLayoutInit = function () {
                //Prevent Plus Tile influence on the tiles reordering by exclude it from the layout matrix calculations
                Layout.getLayoutEngine().setExcludedControl(sap.ushell.ui.launchpad.PlusTile);
                //Hide plus tile when collision with it
                Layout.getLayoutEngine().setReorderTilesCallback.call(Layout.layoutEngine, reorderTilesCallback);
            };

            fGroupsContainerAfterRenderingHandler = function () {

                if (!Layout.isInited) {
                    Layout.init({
                        getGroups: this.getGroups.bind(this),
                        getAllGroups: that.getAllGroupsFromModel.bind(that),
                        isTabBarActive: that.isTabBarActive.bind(that),
                        isLockedGroupsCompactLayoutEnabled: fnEnableLockedGroupCompactLayout,
                        animationsEnabled: (that.oModel.getProperty('/animationMode') === 'full')
                    }).done(fAfterLayoutInit);

                    //when media is changed we need to rerender Layout
                    //media could be changed by SAPUI5 without resize, or any other events. look for internal Incident ID: 1580000668
                    sap.ui.Device.media.attachHandler(function () {
                        if (!this.bIsDestroyed) {
                            Layout.reRenderGroupsLayout(null);
                        }
                    }, this, sap.ui.Device.media.RANGESETS.SAP_STANDARD);

                    var oDomRef = this.getDomRef();
                    oController.getView().sDashboardGroupsWrapperId = !jQuery.isEmptyObject(oDomRef) && oDomRef.parentNode ? oDomRef.parentNode.id : '';
                }
                Layout.reRenderGroupsLayout(null);

                if (this.getGroups().length) {
                    if (oController.bModelInitialized) {
                        oController._initializeUIActions();
                    }

                    oController._addBottomSpace();

                    //Tile opacity is enabled by default, therefore we handle tile opacity in all cases except
                    //case where flag is explicitly set to false
                    if (this.getModel().getProperty("/enableTilesOpacity")) {
                        sap.ushell.utils.handleTilesOpacity(this.getModel());
                    }
                    //the calculation of tiles visibility is called in DashboardContent.view.js
                }
                EventHub.emit("CenterViewPointContentRendered", {"groups":this.getGroups().length});
                sap.ui.getCore().getEventBus().publish("launchpad", "contentRendered");
                sap.ui.getCore().getEventBus().publish("launchpad", "contentRefresh");
                this.getBinding("groups").filter(that.calculateFilter());
            };

            this.isTabBarActive = function () {
                return this.oModel.getProperty("/homePageGroupDisplay") === "tabs";
            };

            this.oModel = oModel;
            var filters = this.calculateFilter();

            this.oGroupsContainer = new DashboardGroupsContainer("dashboardGroups", {
                accessibilityLabel : sap.ushell.resources.i18n.getText("DashboardGroups_label"),
                groups : {
                    filters: filters,
                    path: "/groups",
                    template : oTilesContainerTemplate
                },
                displayMode: "{/homePageGroupDisplay}",
                afterRendering : fGroupsContainerAfterRenderingHandler
            });


            this.oGroupsContainer.addEventDelegate({
                onsapskipback: function (oEvent) {
                    oEvent.preventDefault();
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);

                    var jqElement = jQuery(".sapUshellAnchorItem:visible:first");
                    if (!jqElement.length) {
                        sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                    } else {
                        sap.ushell.components.homepage.ComponentKeysHandler.goToSelectedAnchorNavigationItem();
                    }
                },
                onsapskipforward: function (oEvent) {
                    oEvent.preventDefault();
                    var floatingFooterDoneBtn = jQuery("#sapUshellDashboardFooterDoneBtn:visible");
                    if (floatingFooterDoneBtn.length) {
                        floatingFooterDoneBtn.focus();
                    } else {
                        // if co-pilot exists and we came from tile - need to focus on copilot - otherwise - on mearea
                        if (jQuery("#sapUshellFloatingContainerWrapper:visible").length == 1 && (oEvent.originalEvent.srcElement.id) != "") {
                            sap.ui.getCore().getEventBus().publish("launchpad", "shellFloatingContainerIsAccessible" );
                        } else {
                            sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                        }
                    }
                },
                onsaptabnext: function (oEvent) {
                    if (that.oModel.getProperty("/tileActionModeActive")) {
                        var jqClosestHeader = jQuery(document.activeElement).closest(".sapUshellTileContainerHeader");
                        if (!jqClosestHeader || jqClosestHeader.length === 0) {
                            oEvent.preventDefault();
                            var floatingFooterDoneBtn = jQuery("#sapUshellDashboardFooterDoneBtn:visible");
                            if (floatingFooterDoneBtn.length) {
                                floatingFooterDoneBtn.focus();
                            }
                        } else {
                            /*
                                We are inside the header.
                                ONLY focused element is last before the tiles-list we call to set focus on tiles list.
                                otherwise - let the browser handle it.
                              */

                            // if we have tiles in this container
                            var jqCurrentTileContainer = jQuery(document.activeElement).closest(".sapUshellTileContainer");

                            //inside header we can be on 2 section elements - title OR delete/reset button (in case exist)
                            //check if we are on the title itself
                            var isCurrentElementTitle = jQuery(document.activeElement).hasClass("sapUshellContainerTitle");

                            //  search for actions inside the header title element
                            var jqChildActions = jqCurrentTileContainer.find('.sapUshellHeaderActionButton');

                            // check if actions exist on header title element
                            var isActionsExistOnTitleElement = jqChildActions && jqChildActions.length > 0;

                            // check if the current element is the last action in the header-title element
                            var isCurrentElementLastAction = false;
                            if (isActionsExistOnTitleElement) {
                                isCurrentElementLastAction = document.activeElement.id === jqChildActions.last()[0].id;
                            }

                            /*
                             In the cases of:
                             - current element is the title itself, and there are no actions on header title
                             - current element is an action of the header title, and it is the last action

                             We tab into the tiles-container and enforce focusing the last focused tile in this group
                             (fallback will be selecting the first tile on the group)
                             */
                            if ((isCurrentElementTitle && !isActionsExistOnTitleElement) ||
                                (isCurrentElementLastAction)) {

                                oEvent.preventDefault();

                                // check for items (tiles/links) we can focus on
                                var bHasItemsToFocusOn =  jqCurrentTileContainer.find(".sapUshellTile:visible, sapUshellLink:visible").length > 0;

                                // as we inside the header, additional tab requires us to focus last visited tile on the current container
                                // if we have tiles/links to focus on - do it
                                if (bHasItemsToFocusOn) {
                                    sap.ushell.components.homepage.ComponentKeysHandler.goToLastVisitedTile(jqCurrentTileContainer, true);
                                } else {

                                    // else - focus on Done button (same as F6 from tiles)
                                    var floatingFooterDoneBtn = jQuery("#sapUshellDashboardFooterDoneBtn:visible");
                                    if (floatingFooterDoneBtn.length) {
                                        floatingFooterDoneBtn.focus();
                                    } else {
                                        // if co-pilot exists and we came from tile - need to focus on copilot - otherwise - on mearea
                                        if (jQuery("#sapUshellFloatingContainerWrapper:visible").length == 1 && (oEvent.originalEvent.srcElement.id) != "") {
                                            sap.ui.getCore().getEventBus().publish("launchpad", "shellFloatingContainerIsAccessible");
                                        } else {
                                            sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                                        }
                                    }
                                }
                            }
                        }
                    } else {
                        oEvent.preventDefault();
                        if (jQuery("#sapUshellFloatingContainerWrapper:visible").length == 1 && (oEvent.originalEvent.srcElement.id) != "") {
                            sap.ui.getCore().getEventBus().publish("launchpad", "shellFloatingContainerIsAccessible");
                        } else {
                            sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                        }
                    }
                },
                onsaptabprevious: function (oEvent) {
                    sap.ushell.renderers.fiori2.AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    var jqFocused = jQuery(":focus");
                    if (!that.oModel.getProperty("/tileActionModeActive") || jqFocused.hasClass("sapUshellTileContainerHeader")) {
                        oEvent.preventDefault();
                        var jqElement = jQuery(".sapUshellAnchorItem:visible:first"),
                            jqOverflowElement = jQuery(".sapUshellAnchorItemOverFlow");
                        if (!jqElement.length) {
                            sap.ushell.renderers.fiori2.AccessKeysHandler.sendFocusBackToShell(oEvent);
                        }
                        if (jqOverflowElement.hasClass("sapUshellShellHidden")) {
                            sap.ushell.components.homepage.ComponentKeysHandler.goToSelectedAnchorNavigationItem();
                        } else {
                            jqOverflowElement.find("button").focus();
                        }
                        // only in case we in edit mode
                    } else if (that.oModel.getProperty("/tileActionModeActive")) {
                        var jqActiveElement = jQuery(document.activeElement);

                        // only in case focus is on a tile we need custom behavior upon shift-tab
                        // otherwise let the browser handle it
                        if (jqActiveElement.hasClass('sapUshellTile')) {
                            oEvent.preventDefault();

                            // take reference to current tile container
                            var jqCurrentTileContainer = jqActiveElement.closest(".sapUshellTileContainer");

                            //  search for actions inside the header title element
                            var jqLastAction = jqCurrentTileContainer.find('.sapUshellHeaderActionButton:visible').last();

                            // check if actions exist on header title element
                            // if there are actions of tile container header - focus on last one
                            if (jqLastAction.length > 0) {
                                jqLastAction.focus();
                            } else {
                                // else focus on title
                                jqCurrentTileContainer.find('.sapUshellContainerTitle').focus();
                            }
                        }
                    }
                }
            });
            return this.oGroupsContainer;
        },
        getAllGroupsFromModel : function () {
            return this.oModel.getProperty("/groups");
        },

        /**
         * Returns a template of a dashboard group.
         * Contains aggregations of links and tiles
         */
        _getTileContainerTemplate : function (oController, oModel) {
            var that = this,
                oTilesContainerTemplate = new sap.ushell.ui.launchpad.TileContainer({
                    headerText: "{title}",
                    showDragIndicator: {
                        parts: ['/tileActionModeActive', '/enableDragIndicator'],
                        formatter: function (bIsActionModeActive, bDragIndicator) {
                            return bIsActionModeActive && bDragIndicator && !this.getIsGroupLocked() && !this.getDefaultGroup();
                        }
                    },
                    showEmptyLinksArea: {
                        parts: ['/tileActionModeActive', 'links/length',  "isGroupLocked", '/isInDrag', '/homePageGroupDisplay'],
                        formatter: function (tileActionModeActive, numOfLinks, isGroupLocked, bIsInDrag, sAnchorbarMode) {
                            if (numOfLinks) {
                                return true;
                            } else if (isGroupLocked) {
                                return false;
                            } else {
                                return tileActionModeActive || bIsInDrag && sAnchorbarMode === 'tabs';
                            }
                        }
                    },
                    showMobileActions: {
                        parts: ['/tileActionModeActive'],
                        formatter: function (bIsActionModeActive) {
                            return bIsActionModeActive && !this.getDefaultGroup();
                        }
                    },
                    showIcon: {
                        parts: ['/isInDrag', '/tileActionModeActive'],
                        formatter: function (bIsInDrag, bIsActionModeActive) {
                            return (this.getIsGroupLocked() && (bIsInDrag || bIsActionModeActive));
                        }
                    },
                    deluminate: {
                        parts: ['/isInDrag'],
                        formatter: function (bIsInDrag) {
                            //  return oEvent.oSource.getIsGroupLocked() && bIsInDrag;
                            return this.getIsGroupLocked() && bIsInDrag;
                        }
                    },
                    transformationError: {
                        parts: ['/isInDrag', '/draggedTileLinkPersonalizationSupported'],
                        formatter: function (bIsInDrag, bDraggedTileLinkPersonalizationSupported) {
                            return bIsInDrag && !bDraggedTileLinkPersonalizationSupported;
                        }

                    },
                    showBackground: '{/tileActionModeActive}',
                    tooltip: "{title}",
                    tileActionModeActive: '{/tileActionModeActive}',
                    ieHtml5DnD: oController.getView().ieHtml5DnD,
                    enableHelp: '{/enableHelp}',
                    groupId: "{groupId}",
                    defaultGroup: "{isDefaultGroup}",
                    isLastGroup: "{isLastGroup}",
                    isGroupLocked: "{isGroupLocked}",
                    isGroupSelected: "{isGroupSelected}",
                    showHeader: true,
                    showGroupHeader: "{showGroupHeader}",
                    homePageGroupDisplay: "{/homePageGroupDisplay}",
                    editMode: "{editMode}",
                    supportLinkPersonalization: this.isLinkPersonalizationSupported,
                    titleChange: function (oEvent) {
                        sap.ui.getCore().getEventBus().publish("launchpad", "changeGroupTitle", {
                            groupId: oEvent.getSource().getGroupId(),
                            newTitle: oEvent.getParameter("newTitle")
                        });
                    },
                    showEmptyLinksAreaPlaceHolder: {
                        parts: ['links/length', '/isInDrag', '/homePageGroupDisplay'],
                        formatter: function (numOfLinks, bIsInDrag, sAnchorbarMode) {
                            return bIsInDrag && sAnchorbarMode === 'tabs' && !numOfLinks;
                        }
                    },
                    showPlaceholder: {
                        parts: ["/tileActionModeActive", "tiles/length"],
                        formatter: function (tileActionModeActive) {
                            return tileActionModeActive && !this.getIsGroupLocked();
                        }
                    },
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
                    hidden: {
                        parts: ['/tileActionModeActive', 'isGroupVisible'],
                        formatter: function (bIsActionModeActive, bIsGroupVisible) {
                            return bIsActionModeActive && !bIsGroupVisible;
                        }
                    },
                    links: this._getLinkTemplate(),
                    tiles: this._getTileTemplate(),
                    add: /*oController._addTileContainer,*/ function (oEvent) {
                        //Fix internal incident #1780370222 2017
                        if (document.toDetail) {
                            document.toDetail();
                        }
                        Component.getOwnerComponentFor(that.oController.getView().parentComponent).getRouter().navTo("appfinder", {
                            "innerHash*": "catalog/" + JSON.stringify({
                                targetGroup: encodeURIComponent(oEvent.getSource().getBindingContext().sPath)
                            })
                        });
                    }
                });
            return oTilesContainerTemplate;
        },
        _getLinkTemplate : function () {
            var oFilter = new sap.ui.model.Filter("isTileIntentSupported", sap.ui.model.FilterOperator.EQ, true);

            if (!this.isLinkPersonalizationSupported) {
                return {
                    path: "links",
                    templateShareable: true,
                    template: new sap.ushell.ui.launchpad.LinkTileWrapper({
                        uuid: "{uuid}",
                        tileCatalogId: "{tileCatalogId}",
                        target: "{target}",
                        isLocked: "{isLocked}",
                        tileActionModeActive: "{/tileActionModeActive}",
                        animationRendered: false,
                        debugInfo: "{debugInfo}",
                        ieHtml5DnD: this.oController.getView().ieHtml5DnD,
                        tileViews: {
                            path: "content",
                            factory: function (sId, oContext) {
                                return oContext.getObject();
                            }
                        },
                        afterRendering: function (oEvent) {
                            var jqHrefElement = jQuery(this.getDomRef().getElementsByTagName("a"));
                            // Remove tabindex from links
                            //  so that the focus will not be automatically set on the focusable link when returning to the launchpad
                            jqHrefElement.attr("tabindex", -1);
                        }
                    }),
                    filters: [oFilter]
                };
            } else {
                return {
                    path: "links",
                    factory: function (sId, oContext) {
                        var oControl = oContext.getObject().content[0];
                        if (oControl && oControl.bIsDestroyed) {
                            oControl = oControl.clone();
                            oContext.getModel().setProperty(oContext.getPath() + "/content/0", oControl);
                        }
                        return oControl;
                    },
                    filters: [oFilter]
                };
            }
        },
        _getTileTemplate : function () {
            var oFilter = new sap.ui.model.Filter("isTileIntentSupported", sap.ui.model.FilterOperator.EQ, true);
            var oTile = new sap.ushell.ui.launchpad.Tile({
                "long": "{long}",
                // The model flag draggedInTabBarToSourceGroup was set for the tile in when it was dragged on TabBar between groups
                isDraggedInTabBarToSourceGroup: "{draggedInTabBarToSourceGroup}",
                uuid: "{uuid}",
                tileCatalogId: "{tileCatalogId}",
                isCustomTile : "{isCustomTile}",
                target: "{target}",
                isLocked: "{isLocked}",
                navigationMode: "{navigationMode}",
                tileActionModeActive: "{/tileActionModeActive}",
                showActionsIcon: "{showActionsIcon}",
                rgba: "{rgba}",
                animationRendered: false,
                debugInfo: "{debugInfo}",
                ieHtml5DnD: this.oController.getView().ieHtml5DnD,
                tileViews: {
                    path: "content",
                    factory: function (sId, oContext) {
                        return oContext.getObject();
                    }
                },
                coverDivPress: function (oEvent) {
                    // if this tile had just been moved and the move itself did not finish refreshing the tile's view
                    // we do not open the actions menu to avoid inconsistencies
                    if (!oEvent.oSource.getBindingContext().getObject().tileIsBeingMoved) {
                        sap.ushell.components.homepage.ActionMode._openActionsMenu(oEvent);
                    }
                },
                showActions: function (oEvent) {
                    sap.ushell.components.homepage.ActionMode._openActionsMenu(oEvent);
                },
                deletePress: function (oEvent) {
                    var oTileControl =  oEvent.getSource(), oTile = oTileControl.getBindingContext().getObject().object,
                        oData = {originalTileId : sap.ushell.Container.getService("LaunchPage").getTileId(oTile)};

                    sap.ui.getCore().getEventBus().publish("launchpad", "deleteTile", oData, this);
                },
                press : [ this.oController.dashboardTilePress, this.oController ]
            });
            var oViewPortContainer = sap.ui.getCore().byId("viewPortContainer");
            oTile.addEventDelegate({
                onclick: function (oEvent) {
                    jQuery.sap.measure.start("FLP:DashboardGroupsBox.onclick", "Click on tile", "FLP");
                    jQuery.sap.measure.start("FLP:OpenApplicationonClick", "Open Application", "FLP");
                    function endTileMeasurement (){
                        jQuery.sap.measure.end("FLP:DashboardGroupsBox.onclick");
                        oViewPortContainer.detachAfterNavigate(endTileMeasurement);
                    }
                    oViewPortContainer.attachAfterNavigate(endTileMeasurement);
                }
            });
            return {
                path: "tiles",
                templateShareable: true,
                template: oTile,
                filters: [oFilter]
            };
        },
        _updateGroupHeaderVisibility: function () {
            var aGroups = this.oGroupsContainer.getGroups(),
                bEditMode = this.oModel.getProperty("/tileActionModeActive"),
                bAnchorbar = this.oController.getView().oPage.getShowHeader(),
                iFirstVisible,
                iVisibleGroups = 0;

            for (var i = 0; i < aGroups.length; i++) {
                if (aGroups[i].getProperty("visible")) {
                    iVisibleGroups++;

                    if (iFirstVisible === undefined) {
                        iFirstVisible = i;
                    } else {
                        aGroups[i].setShowGroupHeader(true);
                    }
                }
            }

            if (iFirstVisible !== undefined) {
                var bVisible = bEditMode || (iVisibleGroups === 1 && !bAnchorbar);
                aGroups[iFirstVisible].setShowGroupHeader(bVisible);
            }
        },
        _handleActionModeChange: function () {
            var bActiveMode = this.oModel.getProperty('/tileActionModeActive');
            if (bActiveMode) {
                this._addTileContainersContent();
            } else {
                // in order to set groups again to their right position after closing edit mode, we will need to re-render
                // the groups layout. We need it for the Locked Groups Compact Layout feature
                Layout.reRenderGroupsLayout(null);
            }
        },
        _addTileContainersContent : function () {
            if (!this.bTileContainersContentAdded) {
                var aGroups = this.oGroupsContainer.getGroups();

                aGroups.forEach(function (group, groupIndex) {
                    this._addTileContainerContent(groupIndex);
                }.bind(this));
                this.bTileContainersContentAdded = true;
            }
        },
        _addTileContainerContent : function (groupIndex) {
            var oGroup = this.oGroupsContainer.getGroups()[groupIndex],
                sBindingCtxPath;

            if (oGroup) {
                sBindingCtxPath = oGroup.getBindingContext().getPath() + '/';

                oGroup.addBeforeContent(this._getBeforeContent(this.oController, sBindingCtxPath));
                oGroup.addAfterContent(this._getAfterContent(this.oController, sBindingCtxPath));
                sap.ui.require(["sap/ushell/ui/launchpad/GroupHeaderActions"], function (GroupHeaderActions) {
                    var oHeaderAction = new GroupHeaderActions({
                        content : this._getHeaderActions(),
                        tileActionModeActive: {
                            parts: ['/tileActionModeActive', sBindingCtxPath + 'isDefaultGroup'],
                            formatter: function (bIsActionModeActive, bIsDefaultGroup) {
                                return bIsActionModeActive && !bIsDefaultGroup;
                            }
                        },
                        isOverflow: '{/isPhoneWidth}'
                    }).addStyleClass("sapUshellOverlayGroupActionPanel");
                    oGroup.addHeaderAction(oHeaderAction);
                }.bind(this));
            }
        },

        _handleAddGroupButtonPress: function (oData) {
            this.oController._addGroupHandler(oData);
            if (this.bTileContainersContentAdded) {
                var aGroups = this.oGroupsContainer.getGroups(),
                    i;

                for (i = 0; i < aGroups.length; i++) {
                    if (!aGroups[i].getBeforeContent().length) {
                        this._addTileContainerContent(i);
                    }
                }
            }
        },

        _removedContent: function () {
            this.bTileContainersContentAdded = false;
        },

        _getBeforeContent : function (oController) {
            var addGrpBtn = new sap.m.Button({
                icon: "sap-icon://add",
                text : sap.ushell.resources.i18n.getText("add_group_at"),
                visible : {
                    parts: ["/tileActionModeActive"],
                    formatter : function (tileActionModeActive) {
                        return (!this.getParent().getIsGroupLocked() && !this.getParent().getDefaultGroup() && tileActionModeActive);
                    }
                },
                enabled: {
                    parts: ["/editTitle"],
                    formatter : function (isEditTitle) {
                        return !isEditTitle;
                    }
                },
                press : [this._handleAddGroupButtonPress.bind(this)]
            }).addStyleClass("sapUshellAddGroupButton");

            addGrpBtn.addDelegate({
                onAfterRendering: function () {
                    jQuery(".sapUshellAddGroupButton").attr("tabindex", -1);
                }
            });

            return addGrpBtn;
        },
        _getAfterContent : function (oController) {
            var addGrpBtn = new sap.m.Button({
                icon: "sap-icon://add",
                text : sap.ushell.resources.i18n.getText("add_group_at"),
                visible : {
                    parts: ["isLastGroup", "/tileActionModeActive", "/isInDrag"],
                    formatter : function (isLast, tileActionModeActive, isInDrag) {
                        // Calculate the result only if isInDrag is false,
                        // meaning - if there was a drag-and-drop action - is it already ended
                        return (isLast && tileActionModeActive);
                    }
                },
                enabled: {
                    parts: ["/editTitle"],
                    formatter : function (isEditTitle) {
                        return !isEditTitle;
                    }
                },
                press : [this._handleAddGroupButtonPress.bind(this)]
            }).addStyleClass("sapUshellAddGroupButton");

            addGrpBtn.addDelegate({
                onAfterRendering: function () {
                    jQuery(".sapUshellAddGroupButton").attr("tabindex", -1);
                }
            });

            return addGrpBtn;
        },
        _getHeaderActions: function () {
            var oShowHideBtn = new sap.m.Button({
                text: {
                    path: 'isGroupVisible',
                    formatter: function (bIsGroupVisible) {
                        if (sap.ui.Device.system.phone) {
                            this.setIcon(bIsGroupVisible ? "sap-icon://hide" : "sap-icon://show");
                        }
                        return sap.ushell.resources.i18n.getText(bIsGroupVisible ? 'HideGroupBtn' : 'ShowGroupBtn');
                    }
                },
                visible: {
                    parts: ['/tileActionModeActive', '/enableHideGroups', 'isGroupLocked', 'isDefaultGroup'],
                    formatter: function (bIsActionModeActive, bIsHideGroupsEnabled, bIsGroupLocked, bIsDefaultGroup) {
                        return bIsActionModeActive && bIsHideGroupsEnabled && !bIsGroupLocked && !bIsDefaultGroup;
                        //return true;
                    }
                },
                press: function (oEvent) {
                    var oSource = oEvent.getSource(),
                        oGroupBindingCtx = oSource.getBindingContext();
                    this.oController._changeGroupVisibility(oGroupBindingCtx);
                }.bind(this)
            }).addStyleClass("sapUshellHeaderActionButton");
            var oDeleteBtn = new sap.m.Button({
                text: {
                    path: 'removable',
                    formatter: function (bIsRemovable) {
                        if (sap.ui.Device.system.phone) {
                            if (bIsRemovable) {
                                this.setIcon("sap-icon://delete");
                            } else {
                                this.setIcon("sap-icon://refresh");
                            }
                        }
                        return sap.ushell.resources.i18n.getText(bIsRemovable ? 'DeleteGroupBtn' : 'ResetGroupBtn');
                    }
                },
                visible: {
                    parts: ['/tileActionModeActive', 'isDefaultGroup'],
                    formatter: function (bIsActionModeActive, bIsDefaultGroup) {
                        return bIsActionModeActive && !bIsDefaultGroup;
                    }
                },
                enabled: {
                    parts: ["/editTitle"],
                    formatter : function (isEditTitle) {
                        return !isEditTitle;
                    }
                },
                press: function (oEvent) {
                    var oSource = oEvent.getSource(),
                        oGroupBindingCtx = oSource.getBindingContext();
                    this.oController._handleGroupDeletion(oGroupBindingCtx);
                }.bind(this)
            }).addStyleClass("sapUshellHeaderActionButton");
            return [oShowHideBtn, oDeleteBtn];
        },
        _hidePlusTile : function (plusTileDomRef) {
            if (plusTileDomRef) {
                plusTileDomRef.className += " sapUshellHidePlusTile";
            }
        },
        _showPlusTile: function (plusTileDomRef) {
            if (plusTileDomRef) {
                plusTileDomRef.className = plusTileDomRef.className.split(' ' + 'sapUshellHidePlusTile').join('');
            }
        }
    });


	return DashboardGroupsBox;

});
},
	"sap/ushell/components/homepage/DashboardUIActions.js":function(){// ${copyright}
/**
 * @fileOverview A module that is responsible for initializing the dashboard UIActions (i.e. drag and drop) of groups and tiles.<br>
 * Extends <code>sap.ui.base.Object</code><br>
 * Exposes the public function <code>initializeUIActions</code>
 * @version ${version}
 * @name sap.ushell.components.homepage.DashboardUIActions
 *
 * @since 1.35.0
 * @private
 */
sap.ui.define(["sap/ui/base/Object"], function (baseObject) {
	"use strict";

    /*global jQuery, sap, window */
    /*jslint nomen: true */
    var DashboardUIActions = baseObject.extend("sap.ushell.components.homepage.DashboardUIActions", {
        metadata: {
            publicMethods: ["initializeUIActions"]
        },
        constructor: function (sId, mSettings) {
            this.aTabBarItemsLocation = [];

            // Make this class only available once
            if (sap.ushell.components.homepage.getDashboardUIActions && sap.ushell.components.homepage.getDashboardUIActions()) {
                return sap.ushell.components.homepage.getDashboardUIActions();
            }
            sap.ushell.components.homepage.getDashboardUIActions = jQuery.sap.getter(this.getInterface());

            this.oTileUIActions = undefined;
            this.oLinkUIActions = undefined;
            this.oGroupUIActions = undefined;
            this.oController = undefined;
            this.UIActionsInitialized = false;

            // Enabling and disabling drag and drop of groups (groupsUIAction) depends of activation and activation of ActionMode
            sap.ui.getCore().getEventBus().subscribe('launchpad', 'actionModeActive', this._enableGroupUIActions, this);
            sap.ui.getCore().getEventBus().subscribe('launchpad', 'actionModeInactive', this._disableGroupUIActions, this);
        },
        destroy: function () {
            sap.ui.getCore().getEventBus().unsubscribe('launchpad', 'actionModeActive', this._enableGroupUIActions, this);
            sap.ui.getCore().getEventBus().unsubscribe('launchpad', 'actionModeInactive', this._disableGroupUIActions, this);
            sap.ushell.components.homepage.getDashboardUIActions = undefined;
            this.oGroupUIActions = null;
            this.oTileUIActions = null;
            this.oLinkUIActions = null;
        },
        /**
         * Creating UIAction objects for tiles and groups in order to allow dashboard drag and drop actions
         *
         * @param {object} The DashboardContent.controller instance
         *
         * @since 1.35
         *
         * @private
         */
        initializeUIActions : function (oController) {
            this.oController = oController;
            // If TabBar mode active - calculate TabBar items position
            if (oController.getView().getModel().getProperty("/homePageGroupDisplay") === "tabs") {
                this._fillTabBarItemsArray();
            }

            var isLinkPersonalizationSupported = sap.ushell.Container ? sap.ushell.Container.getService("LaunchPage").isLinkPersonalizationSupported() : null;

            var sDashboardGroupsWrapperId = oController.getView().sDashboardGroupsWrapperId,
                bActionModeActive,
                bRightToLeft = sap.ui.getCore().getConfiguration().getRTL(),

                // Object that contains the common attributed required of the creation of oTileUIActions and oGroupUIActions in Win8 use-case
                oCommonUIActionsDataForWin8 = {
                    containerSelector: '#dashboardGroups',
                    wrapperSelector: sDashboardGroupsWrapperId ? "#" + sDashboardGroupsWrapperId : undefined, // The id of the <section> that wraps dashboardGroups div: #__page0-cont
                    rootSelector : "#shell"
                },
                // Object that contains the common attributed required of the creation of oTileUIActions and oGroupUIActions, including Win8 attributes
                oCommonUIActionsData = jQuery.extend(true, {}, oCommonUIActionsDataForWin8, {
                    switchModeDelay: 1000,
                    isTouch: oController.getView().isTouch,
                    isCombi: oController.getView().isCombi,
                    debug: false
                }),
                oLinkUIActionsData = {
                    draggableSelector: ".sapUshellLinkTile",
                    placeHolderClass: "sapUshellLinkTile-placeholder",
                    cloneClass: "sapUshellLinkTile-clone",
                    startCallback: this._handleTileUIStart.bind(this),
                    endCallback: this._handleLinkDrop.bind(this),
                    dragCallback: this._handleStartDragTile.bind(this),
                    onBeforeCreateClone: this._onBeforeCreateLinkClone.bind(this),
                    dragAndScrollCallback: this._handleTileDragMove.bind(this),
                    endDragAndScrollCallback: this._handleTileDragAndScrollContinuation.bind(this),
                    moveTolerance: oController.getView().isTouch || oController.getView().isCombi ? 10 : 3,
                    isLayoutEngine: true,
                    disabledDraggableSelector: 'sapUshellLockedTile',//check licked links
                    onDragStartUIHandler: this._markDisableGroups.bind(this),
                    onDragEndUIHandler: this._endUIHandler.bind(this),
                    offsetLeft: bRightToLeft ? jQuery(".sapUshellViewPortLeft").width() : -jQuery(".sapUshellViewPortLeft").width(),
                    defaultMouseMoveHandler: function(){}
                },
                oTileUIActionsData = {
                    draggableSelector: ".sapUshellTile",
                    draggableSelectorExclude: ".sapUshellPlusTile",
                    placeHolderClass: "sapUshellTile-placeholder",
                    cloneClass: "sapUshellTile-clone",
                    deltaTop: -44,
                    scrollContainerSelector: undefined, // @TODO remove this
                    startCallback: this._handleTileUIStart.bind(this),
                    endCallback: this._handleTileDrop.bind(this),
                    dragCallback: this._handleStartDragTile.bind(this),
                    dragAndScrollCallback: this._handleTileDragMove.bind(this),
                    endDragAndScrollCallback: this._handleTileDragAndScrollContinuation.bind(this),
                    moveTolerance: oController.getView().isTouch || oController.getView().isCombi ? 10 : 3,
                    isLayoutEngine: true,
                    disabledDraggableSelector: 'sapUshellLockedTile',
                    onDragStartUIHandler: this._markDisableGroups.bind(this),
                    onDragEndUIHandler: this._endUIHandler.bind(this),
                    offsetLeft: bRightToLeft ? jQuery(".sapUshellViewPortLeft").width() : -jQuery(".sapUshellViewPortLeft").width(),
                    defaultMouseMoveHandler: function(){}
                },
                oGroupUIActionsData = {
                    draggableSelector: ".sapUshellDashboardGroupsContainerItem:not(.sapUshellDisableDragAndDrop)",
                    draggableSelectorBlocker: ".sapUshellTilesContainer-sortable, .sapUshellTileContainerBeforeContent, .sapUshellTileContainerAfterContent",
                    draggableSelectorExclude: ".sapUshellHeaderActionButton",
                    placeHolderClass: "sapUshellDashboardGroupsContainerItem-placeholder",
                    cloneClass: "sapUshellDashboardGroupsContainerItem-clone",
                    startCallback: this._handleGroupsUIStart.bind(this),
                    endCallback: this._handleGroupDrop.bind(this),
                    dragCallback: this._handleGroupStartDrag.bind(this),
                    moveTolerance: oController.getView().isTouch || oController.getView().isCombi ? 10 : 0.1,
                    isLayoutEngine: false,
                    isVerticalDragOnly: true,
                    draggableElement: ".sapUshellTileContainerHeader"
                },
                oWin8TileUIActionsData = {
                    type: "tiles",
                    draggableSelector: ".sapUshellTile",
                    placeHolderClass : "sapUshellTile-placeholder",
                    cloneClass: "sapUshellTile-clone",
                    startCallback : this._handleTileUIStart.bind(this),
                    endCallback : this._handleTileDrop.bind(this),
                    dragCallback : this._handleStartDragTile.bind(this),
                    dragAndScrollCallback : this._handleTileDragMove.bind(this),
                    onDragStartUIHandler : this._markDisableGroups.bind(this),
                    onDragEndUIHandler : this._endUIHandler.bind(this),
                    offsetLeft: bRightToLeft ? jQuery(".sapUshellViewPortLeft").width() : -jQuery(".sapUshellViewPortLeft").width()
                },
                oWin8LinkUIActionsData = {
                    type: "links",
                    draggableSelector: ".sapUshellLinkTile",
                    placeHolderClass: "sapUshellLinkTile-placeholder",
                    startCallback: this._handleTileUIStart.bind(this),
                    endCallback: this._handleLinkDrop.bind(this),
                    dragCallback: this._handleStartDragTile.bind(this),
                    dragAndScrollCallback: this._handleTileDragMove.bind(this),
                    onBeforeCreateClone: this._onBeforeCreateLinkClone.bind(this),
                    onDragStartUIHandler: this._markDisableGroups.bind(this),
                    onDragEndUIHandler: this._endUIHandler.bind(this),
                    offsetLeft: bRightToLeft ? jQuery(".sapUshellViewPortLeft").width() : -jQuery(".sapUshellViewPortLeft").width()
                },
                oWin8GroupUIActionsData = {
                    type: "groups",
                    draggableSelector: ".sapUshellTileContainerHeader",
                    placeHolderClass : "sapUshellDashboardGroupsContainerItem-placeholder",
                    _publishAsync: oController._publishAsync
                };

            // Creating the sap.ushell.UIActions objects for tiles and groups
            if (oController.getView().oDashboardGroupsBox.getGroups().length) {
                if (oController.getView().getModel().getProperty("/personalization")) {


                    if (!oController.getView().ieHtml5DnD) {
                        sap.ui.require(['sap/ushell/UIActions'], function (UIActions) {
                            // Disable the previous instances of UIActions
                            this._disableTileUIActions();
                            this._disableGroupUIActions();
                            this._disableLinkUIActions();

                            // Create and enable tiles UIActions
                            this.oTileUIActions = new UIActions(jQuery.extend(true, {}, oCommonUIActionsData, oTileUIActionsData)).enable();
                            // Create groups UIActions, enabling happens according to ActionMode
                            this.oGroupUIActions = new UIActions(jQuery.extend(true, {}, oCommonUIActionsData, oGroupUIActionsData));

                            if (isLinkPersonalizationSupported) {
                                this.oLinkUIActions = new UIActions(jQuery.extend(true, {}, oCommonUIActionsData, oLinkUIActionsData)).enable();
                            }

                            bActionModeActive = oController.getView().getModel().getProperty("/tileActionModeActive");
                            if (bActionModeActive) {
                                this.oGroupUIActions.enable();
                            }
                        }.bind(this));

                    } else {
                        sap.ui.require(['sap/ushell/UIActionsWin8'], function (UIActionsWin8) {
                            this._disableTileUIActions();
                            this._disableGroupUIActions();
                            this._disableLinkUIActions();
                            // Create and enable tiles and groups UIActions
                            this.oTileUIActions = UIActionsWin8.getInstance(jQuery.extend(true, {}, oCommonUIActionsDataForWin8, oWin8TileUIActionsData)).enable();
                            this.oLinkUIActions = UIActionsWin8.getInstance(jQuery.extend(true, {}, oCommonUIActionsDataForWin8, oWin8LinkUIActionsData)).enable();
                            this.oGroupUIActions = UIActionsWin8.getInstance(jQuery.extend(true, {}, oCommonUIActionsDataForWin8, oWin8GroupUIActionsData)).enable();
                        }.bind(this));

                    }
                }
            }
        },
        _enableGroupUIActions: function () {
            if (this.oGroupUIActions) {
                this.oGroupUIActions.enable();
            }
        },

        disableAllDashboardUiAction: function () {
            this._disableTileUIActions();
            this._disableLinkUIActions();
            this._disableGroupUIActions();

        },
        _disableTileUIActions : function () {
            if (this.oTileUIActions) {
                this.oTileUIActions.disable();
            }
        },
        _disableLinkUIActions : function () {
          if (this.oLinkUIActions) {
              this.oLinkUIActions.disable();
          }
        },
        _disableGroupUIActions : function () {
            if (this.oGroupUIActions) {
                this.oGroupUIActions.disable();
                //this.oGroupUIActions = null;
            }
        },

       // ****************************************************************************************
       // *************************** Tile UIActions functions - Begin ***************************

        _handleTileDragMove : function (cfg) {
            if (!cfg.isScrolling) {
                sap.ushell.Layout.getLayoutEngine().moveDraggable(cfg.moveX, cfg.moveY, this.aTabBarItemsLocation);
            }
        },

        _handleTileDragAndScrollContinuation : function (moveY) {
            var oAnchorBarOffset = jQuery("#anchorNavigationBar").offset(),
                iAnchorBarOffsetTop = oAnchorBarOffset.top;

            if (moveY < iAnchorBarOffsetTop) {
                sap.ushell.Layout.getLayoutEngine()._cancelLongDropTimmer();
            }
            return sap.ushell.Layout.getLayoutEngine()._isTabBarCollision(moveY);
        },

        _fillTabBarItemsArray: function () {
            var aItems = jQuery(".sapUshellAnchorItem"),
                iLength = aItems.length,
                index,
                iBasicWidthUnit = 10,
                iTempIndex = 0,
                aTabBarItemsBasic = [],
                oItem,
                oItemMeasures,
                oItemWidth,
                iNumOfBasicUnits;

            for (index = 0; index < iLength; index++) {
                oItem = aItems[index];
                oItemMeasures = oItem.getBoundingClientRect();

                aTabBarItemsBasic[index] = oItemMeasures.width;
            }
            for (index = 0; index < iLength; index++) {
                oItemWidth = aTabBarItemsBasic[index];
                if (oItemWidth === 0) {
                    continue;
                }
                iNumOfBasicUnits = Math.round(oItemWidth / iBasicWidthUnit);
                for (var iTempIndex_ = iTempIndex; iTempIndex_ < iTempIndex + iNumOfBasicUnits; iTempIndex_++) {
                    this.aTabBarItemsLocation[iTempIndex_] = index;
                }
                iTempIndex = iTempIndex_;
            }
        },

        _handleTileUIStart : function (evt, ui) {
            if ((sap.ui.Device.browser.msie) &&
                    ((navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints > 0))) {
                //Remove title so tooltip will not be displayed while dragging tile (IE10 and above)
                this.titleElement = ui.querySelector("[title]");
                if (this.titleElement) {
                    //it solves issue with IE and android, when browsers automatically show tooltip
                    this.titleElement.setAttribute("data-title", this.titleElement.getAttribute("title"));
                    this.titleElement.removeAttribute("title");
                }
            }
        },
        _changeTileDragAndDropAnimate : function (evt, ui) {
            var dashboardPageScrollTop = this.dragNDropData.jqDashboard.scrollTop(),
                jqTile,
                tile,
                currentTilePosition,
                currentTileOffset,
                tileLeftOffset,
                iTileTopOffset,
                i,
                oClonedTile;

            for (i = 0; i < this.dragNDropData.jqDraggableElements.length; i++) {
                jqTile = this.dragNDropData.jqDraggableElements.eq(i);
                tile = jqTile[0];
                //Get the original tile and its clone
                currentTilePosition = jqTile.position();
                currentTileOffset = jqTile.offset();
                if ((currentTileOffset.left === tile.offset.left) && (currentTileOffset.top === tile.offset.top)) {
                    continue;
                }
                tile.position = currentTilePosition;
                tile.offset = currentTileOffset;
                oClonedTile = jqTile.data("clone");
                if (!oClonedTile) {
                    continue;
                }

                //Get the invisible tile that has snapped to the new
                //location, get its position, and animate the visible
                //clone to it
                tileLeftOffset = tile.position.left + this.dragNDropData.containerLeftMargin;
                iTileTopOffset = this._getTileTopOffset(jqTile, tile.position, dashboardPageScrollTop);

                //Stop currently running animations
                //Without this, animations would queue up
                oClonedTile.stop(true, false).animate({left: tileLeftOffset, top: iTileTopOffset}, {duration: 250}, {easing: "swing"});
            }
        },

        _preventTextSelection: function () {
            //Prevent selection of text on tiles and groups
            if (window.getSelection) {
                var selection = window.getSelection();
                // fix IE9 issue (CSS 1580181391)
                try {
                    selection.removeAllRanges();
                } catch (e) {
                    // continue regardless of error
                }
            }
        },

       /**
        *
        * @param ui : tile DOM reference
        * @private
        */
        _handleStartDragTile : function (evt, tileElement) {

           this._preventTextSelection();

            sap.ushell.Layout.getLayoutEngine().layoutStartCallback(tileElement);
            if (sap.ushell.Layout.isAnimationsEnabled()) {
                sap.ushell.Layout.initDragMode();
            }
            //Prevent the tile to be launched after drop
            jQuery(tileElement).find("a").removeAttr('href');
            this.oController._handleDrag.call(this.oController, evt, tileElement);
            sap.ui.getCore().getEventBus().publish("launchpad", "sortableStart");
        },
        _onBeforeCreateLinkClone: function (evt, LinkElement) {
            //we need to save the link bounding rects before uiactions.js create a clone because after it oLink.getBoundingRects will return zero offsets
            sap.ushell.Layout.getLayoutEngine().saveLinkBoundingRects(LinkElement);
        },
        _handleLinkDrop : function (evt, tileElement, oAdditionalParams) {
          var deferred = jQuery.Deferred(),
              oPromise;

          if (sap.ushell.Layout.isTabBarActive()) {
              sap.ushell.Layout.tabBarTileDropped();
          }
          if (sap.ushell.Layout.isAnimationsEnabled() && oAdditionalParams && oAdditionalParams.clone) {
              jQuery(oAdditionalParams.clone).animate({
                  opacity: 0
              }, 100, function() {
                // Animation complete.
              });
          }
          if ((sap.ui.Device.browser.msie) &&
              ((navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints > 0)) && this.titleElement) {
              //it solves issue with IE and android, when browsers automatically show tooltip
              this.titleElement.setAttribute("title", this.titleElement.getAttribute("data-title"));//check if we need this
          }
          if (sap.ui.Device.desktop) {
              jQuery('body').removeClass("sapUshellDisableUserSelect");//check if we need this
          }
          if (sap.ushell.Layout.getLayoutEngine().isLinkIntersected() || sap.ushell.Layout.getLayoutEngine().isOriginalAreaChanged()) {
            oPromise = this.oController._handleDrop.call(this.oController, evt, tileElement);
          }

          if (oPromise) {
              oPromise.then(function () {
                  jQuery('#dashboardGroups .sapUshellHidePlusTile').removeClass('sapUshellHidePlusTile');
                  setTimeout(function () {
                      deferred.resolve();
                  }.bind(this), 300);
              });
          } else {
              setTimeout(function () {
                  deferred.resolve();
              }.bind(this), 0);
          }

          return deferred.promise();
        },
        /**
        *
        * @param ui : tile DOM reference
        * @private
        */
        _handleTileDrop : function (evt, tileElement, oAdditionalParams) {
            if (sap.ushell.Layout.getLayoutEngine().isOriginalAreaChanged()) {
              return this._handleTileToLinkDrop(evt, tileElement, oAdditionalParams);
            } else {
              return this._handleTileToTileDrop(evt, tileElement, oAdditionalParams);
            }
        },
        _handleTileToLinkDrop : function (evt, tileElement, oAdditionalParams) {
          return this._handleLinkDrop(evt, tileElement, oAdditionalParams);
        },
        _handleTileToTileDrop : function (evt, tileElement, oAdditionalParams) {
            var jqClone,
                oHoveredTabBarItem,
                oTabBarDraggedTile,
                handleTileDropInternal = function (evt, tileElement) {
                    if (sap.ushell.Layout.isAnimationsEnabled()) {
                        sap.ushell.Layout.endDragMode();
                    }
                    jQuery('#dashboardGroups .sapUshellHidePlusTile').removeClass('sapUshellHidePlusTile');
                    if ((sap.ui.Device.browser.msie) &&
                        ((navigator.msMaxTouchPoints > 0) || (navigator.maxTouchPoints > 0)) && this.titleElement) {
                        //it solves issue with IE and android, when browsers automatically show tooltip
                        this.titleElement.setAttribute("title", this.titleElement.getAttribute("data-title"));
                    }
                    this.oController._handleDrop.call(this.oController, evt, tileElement);
                    if (sap.ui.Device.desktop) {
                        jQuery('body').removeClass("sapUshellDisableUserSelect");
                    }
                },

                oHoveredTabBarItem = jQuery(".sapUshellTabBarHoverOn");
            oHoveredTabBarItem.removeClass("sapUshellTabBarHoverOn");

            oTabBarDraggedTile = jQuery(".sapUshellTileDragOpacity");
            oTabBarDraggedTile.removeClass("sapUshellTileDragOpacity");

            if (sap.ushell.Layout.isTabBarActive()) {
                sap.ushell.Layout.tabBarTileDropped();
            }

            // In tab bar mode, when the tile is dropped on an anchor tab bar item.
            // In this case the tile should not flow back to the source group
            if (sap.ushell.Layout.isTabBarActive() &&  sap.ushell.Layout.isOnTabBarElement()) {

                if (oAdditionalParams && oAdditionalParams.clone) {
                    var oDeferred = jQuery.Deferred();
                    jqClone = jQuery(oAdditionalParams.clone);
                    jqClone.css("display","none");
                    setTimeout(function () {
                        oDeferred.resolve();
                        handleTileDropInternal.call(this, evt, tileElement);
                    }.bind(this), 300);
                    return oDeferred.promise();
                } else {
                    // setTimeout required for IE to reliably remove all transforms after tile drop
                    setTimeout(function () {
                        handleTileDropInternal.call(this, evt, tileElement);
                    }.bind(this), 300);
                }
            }

            if (sap.ushell.Layout.isAnimationsEnabled() && oAdditionalParams && oAdditionalParams.clone) {
                var deferred = jQuery.Deferred();
                jqClone = jQuery(oAdditionalParams.clone);
                var cloneRect = oAdditionalParams.clone.getBoundingClientRect();
                var placeholderRect = tileElement.getBoundingClientRect();
                var splittedTransform = jqClone.css("transform").split(",");
                var diffY = placeholderRect.top - cloneRect.top;
                var diffX = placeholderRect.left - cloneRect.left;
                var translateX = parseInt(splittedTransform[4], 10) + diffX;
                var translateY = parseInt(splittedTransform[5], 10) + diffY;
                jqClone.css({
                    "transform": "translate3d(" + translateX + "px, " + translateY + "px, 0px)",
                    "transition": "transform 0.3s cubic-bezier(0.46, 0, 0.44, 1)"
                });
                setTimeout(function () {
                    deferred.resolve();
                    handleTileDropInternal.call(this, evt, tileElement);
                }.bind(this), 300);
                return deferred.promise();
            } else {
                // setTimeout required for IE to reliably remove all transforms after tile drop
                setTimeout(function () {
                    handleTileDropInternal.call(this, evt, tileElement);
                }.bind(this), 300);
            }
        },
        _getTileTopOffset : function (oTile, position, dashboardScrollTop) {
            var i = 0,
                iTileTopOffset = i + dashboardScrollTop;

            iTileTopOffset += oTile.closest(".sapUshellDashboardGroupsContainerItem").position().top;
            iTileTopOffset += position.top;
            return iTileTopOffset;
        },
        //During drag action, locked groups should be mark with a locked icon and group opacity should be changed to grayish
        _markDisableGroups : function () {
            if (this.oController.getView().getModel()) {
                this.oController.getView().getModel().setProperty('/isInDrag', true);
            }
        },
        //once d&d ends, restore locked groups appearance and remove locked icons and grayscale
        _endUIHandler : function () {
            if (sap.ushell.Layout.isAnimationsEnabled()) {
                sap.ushell.Layout.endDragMode();
            }
            if (this.oController.getView().getModel()) {
                this.oController.getView().getModel().setProperty('/isInDrag', false);
            }
        },
        // **************************** Tile UIActions functions - End ****************************
        // ****************************************************************************************
        // *************************** Group UIActions functions - Begin **************************

        _handleGroupStartDrag : function (evt, ui) {
            this.oTileUIActions.disable();
            if (this.oLinkUIActions) {
              this.oLinkUIActions.disable();
            }
            var groupContainerClone = jQuery(".sapUshellDashboardGroupsContainerItem-clone"),
                groupContainerCloneTitle = groupContainerClone.find(".sapUshellContainerTitle"),
                titleHeight = groupContainerCloneTitle.height(),
                titleWidth = groupContainerCloneTitle.width(),
                groupsTop,
                groupPlaceholder,
                groupClone,
                scrollY,
                bRightToLeft = sap.ui.getCore().getConfiguration().getRTL();

            if (!sap.ui.Device.system.phone) {
                groupContainerClone.find(".sapUshellTileContainerEditMode").offset({
                    top: this.oGroupUIActions.getMove().y - titleHeight,
                    left: bRightToLeft ? jQuery(".sapUshellViewPortCenter").width() + this.oGroupUIActions.getMove().x + titleWidth :
                    this.oGroupUIActions.getMove().x - (titleWidth / 2)
                });
                jQuery(".sapUshellTileContainerBeforeContent").addClass("sapUshellTileContainerHidden");
            } else {
                jQuery(".sapUshellTilesContainer-sortable").addClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellLineModeContainer, .sapUshellLinksContainer").addClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellTileContainerBeforeContent").addClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellContainerHeaderActions").addClass("sapUshellTileContainerHidden");
            }
            jQuery(".sapUshellTileContainerAfterContent").addClass("sapUshellTileContainerRemoveContent");
            jQuery(ui).find(".sapUshellContainerHeaderActions").addClass("sapUshellTileContainerHidden");

            this.oController.getView().getModel().setProperty('/isInDrag', true);
            jQuery(ui).attr('startPos', jQuery(ui).index());

            jQuery.sap.log.info('startPos - ' + jQuery(ui).index());
            setTimeout(function () {
                sap.ui.getCore().getEventBus().publish("launchpad", "sortableStart");
            }, 0);

            //scroll to group
            groupsTop = jQuery("#dashboardGroups").offset().top;
            groupPlaceholder = jQuery(".sapUshellDashboardGroupsContainerItem-placeholder").offset().top;
            groupClone = jQuery(".sapUshellDashboardGroupsContainerItem-clone").offset().top;
            scrollY = groupPlaceholder - groupsTop - groupClone;
            jQuery('.sapUshellDashboardView section').animate({scrollTop : scrollY}, 0);

        },
        _handleGroupsUIStart : function (evt, ui) {
            jQuery(ui).find(".sapUshellTileContainerContent").css("outline-color", "transparent");
        },

        _handleGroupDrop : function (evt, ui) {

            var oBus = sap.ui.getCore().getEventBus(),
                jQueryObj = jQuery(ui),
                firstChildId = jQuery(jQueryObj.children()[0]).attr("id"),
                oGroup = sap.ui.getCore().byId(firstChildId),
                oDashboardGroups = sap.ui.getCore().byId("dashboardGroups"),
                oData = {group : oGroup, groupChanged : false, focus : false},
                nNewIndex = jQueryObj.index();

            jQueryObj.startPos = window.parseInt(jQueryObj.attr('startPos'), 10);
            oDashboardGroups.removeAggregation('groups', oGroup, true);
            oDashboardGroups.insertAggregation('groups', oGroup, nNewIndex, true);

            this._handleGroupMoved(evt, {item : jQueryObj});
            jQueryObj.removeAttr('startPos');
            sap.ui.getCore().getEventBus().publish("launchpad", "sortableStop");

            // avoid tile to be clicked after group was dropped
            setTimeout(function () {
                jQuery(".sapUshellContainerHeaderActions").removeClass("sapUshellTileContainerHidden");
                jQuery(".sapUshellTileContainerBeforeContent").removeClass("sapUshellTileContainerHidden");
                jQuery(".sapUshellTileContainerBeforeContent").removeClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellTileContainerAfterContent").removeClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellTilesContainer-sortable").removeClass("sapUshellTileContainerRemoveContent");
                jQuery(".sapUshellLineModeContainer, .sapUshellLinksContainer").removeClass("sapUshellTileContainerRemoveContent");
            }, 0);

            window.setTimeout(jQuery.proxy(oBus.publish, oBus, "launchpad", "scrollToGroup", oData), 1);
            this.oTileUIActions.enable();
            if (this.oLinkUIActions) {
              this.oLinkUIActions.enable();
            }
        },
        _handleGroupMoved : function (evt, ui) {
            var fromIndex = ui.item.startPos,
                toIndex = ui.item.index(),
                oModel = this.oController.getView().getModel();

            if (toIndex !== -1) {
                this.oController._publishAsync("launchpad", "moveGroup", {
                    fromIndex  : fromIndex,
                    toIndex    : toIndex
                });
                setTimeout(function () {
                    oModel.setProperty('/isInDrag', false);
                }, 100);
            }
        },
        // **************************** Group UIActions functions - End ****************************
        // *****************************************************************************************

        _setController : function (oController) {
            this.oController = oController;
        }
    });


	return DashboardUIActions;

});
},
	"sap/ushell/components/homepage/FLPAnalytics.js":function(){sap.ui.define(function() {
	"use strict";

    /*global jQuery, sap, hasher */
    /**
     * Manage UsageAnalytics event logging as a result of FLP user flows
     */

    // Launchpad action events that trigger logging
    var aObservedLaunchpadActions = ["deleteTile", "createGroup", "actionModeActive", "catalogTileClick", "dashboardTileClick", "dashboardTileLinkClick"],
        oEventBus = sap.ui.getCore().getEventBus(),
        that = this,
        oLaunchedApplications = {};

    /**
     * Updates oLaunchedApplications with the title and opening time of the given application
     */
    function saveOpenAppicationData(applicationId) {
        var oMetadataOfTarget = sap.ushell.services.AppConfiguration.getMetadata();
        oLaunchedApplications[applicationId] = {};
        oLaunchedApplications[applicationId].startTime = new Date();
        oLaunchedApplications[applicationId].title = oMetadataOfTarget.title;
    }

    /**
     * Logs a "Time in App" event according to the given application ID
     *
     * Calculates the time according to the current (closing) time
     *  and the opening time that is kept on oLaunchedApplications[applicationId]
     */
    function logTimeInAppEvent(applicationId) {
        var appDuration = 0;

        try {
            appDuration = (new Date() - oLaunchedApplications[applicationId].startTime) / 1000;
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Time in Application (sec)", appDuration, [oLaunchedApplications[applicationId].title]);
        } catch (e) {
            jQuery.sap.log.warning("Duration in application " + applicationId + " could not be calculated", null, "sap.ushell.components.homepage.FLPAnalytics");
        }
    }

    /**
     * Handler for published usageAnalytics events.
     */
    function handleAction(sChannelId, sEventId, oData) {
        var sApplicationId = hasher.getHash(),
            sApplicationTitle;

        window.swa.custom1 = {ref: sApplicationId};
        switch (sEventId) {
        case 'appOpened':
            // In order to be notified when applications are launched - we rely on navContainer's attachAfterNavigate event.
            // but for the first navigation (e.g. login or direct URL in a new tab) we still need the "appOpened" event.
            saveOpenAppicationData(sApplicationId);
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Application Opened", "Direct Launch", [oLaunchedApplications[sApplicationId].title]);
            oEventBus.unsubscribe("sap.ushell", "appOpened", handleAction);
            break;
        case 'bookmarkTileAdded':
            sApplicationTitle = window.document.title;
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Personalization", "Save as Tile", [
                sApplicationTitle,
                oData && oData.group && oData.group.title ? oData.group.title : "",
                oData && oData.group && oData.group.id ? oData.group.id : "",
                oData && oData.tile && oData.tile.title ? oData.tile.title : sApplicationTitle
            ]);
            break;
        case 'actionModeActive':
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Personalization", "Enter Action Mode", [oData.source]);
            break;
        case 'catalogTileClick':
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Application Launch point", "Catalog", []);
            break;
        case 'dashboardTileClick':
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Application Launch point", "Homepage", []);
            break;
        case 'dashboardTileLinkClick':
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Application Launch point", "Tile Group Link", []);
            break;
        default:
            break;
        }
    }

    /**
     * Handler of navContainer's AfterNavigate event (i.e. navigation between the container's pages)
     *
     * - Logs "TimeInAppEvent" for the source application (i.e. from which the navigation occurred)
     * - Updated data about the opened application
     * - Logs "Application Opened" event
     */
    function handleAfterNavigate(oEvent) {
        var sFromApplicationId,
            sToApplicationId,
            oTargetApplication;

        // For the source application (the one from which the user navigates) -
        // Calculate the time duration and log a "Time in Application" event
        if (oEvent.getParameter("from") && oEvent.getParameter("to")) {
            sFromApplicationId = oEvent.getParameter("from").getId().replace("application-", "").replace("applicationShellPage-", "");
            window.swa.custom1 = {ref: sFromApplicationId};
            logTimeInAppEvent(sFromApplicationId);
            // For the target application (the one to which the user navigates) -
            // Keep the opening time and title, and log an "Application Opened" event
            oTargetApplication = oEvent.getParameter("to");
            sToApplicationId = oTargetApplication.getId().replace("application-", "").replace("applicationShellPage-", "");
            saveOpenAppicationData(sToApplicationId);
            window.swa.custom1 = {ref: sToApplicationId};
            sap.ushell.Container.getService("UsageAnalytics").logCustomEvent("FLP: Application Opened", "Fiori Navigation", [oLaunchedApplications[sToApplicationId].title]);
        }
    }

    /**
     * Handler of browser tab close event
     *
     * Logs a "Time in App" event
     */
    jQuery(window).unload(function (event) {
        var currentApp = window.location.hash.substr(1);
        logTimeInAppEvent(currentApp);
    });

    try {
        sap.ui.getCore().byId('viewPortContainer').attachAfterNavigate(handleAfterNavigate, that);
    } catch (e) {
        jQuery.sap.log.warning("Failure when subscribing to viewPortContainer 'AfterNavigate' event", null, "sap.ushell.components.homepage.FLPAnalytics");
    }
    oEventBus.subscribe("sap.ushell.services.Bookmark", "bookmarkTileAdded", handleAction, that);
    aObservedLaunchpadActions.forEach(function (item, i, arr) {
        oEventBus.subscribe("launchpad", item, handleAction, that);
    });
    oEventBus.subscribe("sap.ushell", "appOpened", handleAction, that);


}, /* bExport= */ false);
}
},"Component-preload"
);
