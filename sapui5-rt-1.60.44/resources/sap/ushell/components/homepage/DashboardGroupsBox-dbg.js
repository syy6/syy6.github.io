// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview A module that is responsible for creating the groups part (i.e. box) of the dashboard.<br>
 * Extends <code>sap.ui.base.Object</code><br>
 * Exposes the public function <code>createGroupsBox</code>
 * @see sap.ushell.components.homepage.DashboardContent.view
 *
 * @version 1.60.40
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
