// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    "jquery.sap.global",
    "sap/ui/base/Object",
    "sap/ui/Device",
    "sap/ui/model/Filter",
    "sap/ushell/ui/launchpad/TileState",
    "sap/ushell/components/_HomepageManager/PagingManager",
    "sap/ushell/components/_HomepageManager/DashboardLoadingManager",
    "sap/ushell/EventHub",
    "sap/ushell/Config",
    "sap/ushell/utils",
    "sap/ushell/resources",
    "sap/ushell/components/DestroyHelper",
    "sap/ushell/components/GroupsHelper",
    "sap/ushell/components/MessagingHelper",
    "sap/m/GenericTile",
    "sap/m/SelectDialog",
    "sap/m/StandardListItem",
    "sap/ushell/components/homepage/ComponentKeysHandler"
], function (
    jQuery,
    BaseObject,
    Device,
    Filter,
    TileState,
    PagingManager,
    DashboardLoadingManager,
    oEventHub,
    oShellConfig,
    oUtils,
    oResources,
    oDestroyHelper,
    oGroupsHelper,
    oMessagingHelper,
    GenericTile,
    SelectDialog,
    StandardListItem,
    ComponentKeysHandler
) {
    "use strict";

    /*global sap, window */
    /*jslint plusplus: true, nomen: true, bitwise: true */
    var analyticsConstants = {
        PERSONALIZATION: "FLP: Personalization",
        RENAME_GROUP: "FLP: Rename Group",
        MOVE_GROUP: "FLP: Move Group",
        DELETE_GROUP: "FLP: Delete Group",
        RESET_GROUP: "FLP: Reset Group",
        DELETE_TILE: "FLP: Delete Tile",
        ADD_TILE: "FLP: Add Tile",
        MOVE_TILE: "FLP: Move Tile"
    };

    var _aRequestQueue = [];
    var _bRequestRunning = false;

    function _addRequest (fRequest) {
        _aRequestQueue.push(fRequest);
        if (!_bRequestRunning) {
            _bRequestRunning = true;
            _aRequestQueue.shift()();
        }
    }

    function _checkRequestQueue () {
        if (_aRequestQueue.length === 0) {
            _bRequestRunning = false;
        } else {
            _aRequestQueue.shift()();
        }
    }

    function _requestFailed () {
        _aRequestQueue = [];
        _bRequestRunning = false;
    }



    function _logUsageAnalytics (sEvent, aParams) {
        sap.ushell.Container.getServiceAsync("UsageAnalytics").then(function (oUsageAnalyticsService) {
            oUsageAnalyticsService.logCustomEvent(analyticsConstants.PERSONALIZATION, sEvent, aParams);
        });
    }

    var HomepageManager = BaseObject.extend("sap.ushell.components.HomepageManager", {
        metadata: {
            publicMethods: ["getModel", "getDashboardView", "loadPersonalizedGroups", "resetGroupsOnFailure", "addGroupToModel", "addTileToGroup", "deleteTilesFromGroup"]
        },
        analyticsConstants: analyticsConstants, // for usage in qUnits

        constructor: function (sId, mSettings) {
            //make this class only available once
            if (sap.ushell.components.getHomepageManager) {
                var oHomepageManager = sap.ushell.components.getHomepageManager();
                if (!oHomepageManager.view) {
                    oHomepageManager.setDashboardView(mSettings.view);
                }
                return oHomepageManager;
            }

            // when the core theme changes, it's required to calculate again, which tiles are visible. In case of
            // dynamic tiles, a request should be triggered. In some cases it can happen, that the tile visibility
            // is calculated before the initial theme is applied. Also these cases are covered, when we react to
            // the theme changed event.
            sap.ui.getCore().attachThemeChanged(oUtils.handleTilesVisibility);

            sap.ushell.components.getHomepageManager = jQuery.sap.getter(this.getInterface());

            this.oPageBuilderService = sap.ushell.Container.getService("LaunchPage");
            this.oModel = mSettings.model;
            this.oRouter = mSettings.router;
            this.oDashboardView = mSettings.view;
            this.oSortableDeferred = jQuery.Deferred();
            this.oSortableDeferred.resolve();
            this.registerEvents();
            this.tileViewUpdateQueue = [];
            this.tileViewUpdateTimeoutID = 0;
            this.tileUuid = null;
            this.bIsGroupsModelLoading = false;
            this.segmentsStore = [];
            this.bIsFirstSegment = true;
            this.bIsFirstSegmentViewLoaded = false;
            this.aGroupsFrame = null;
            this.iMinNumOfTilesForBlindLoading = this.oModel.getProperty("/optimizeTileLoadingThreshold") || 100;
            this.bIsScrollModeAccordingKPI = false;
            this.oGroupNotLockedFilter = new Filter("isGroupLocked", sap.ui.model.FilterOperator.EQ, false);
            this.bLinkPersonalizationSupported = this.oPageBuilderService.isLinkPersonalizationSupported();
            this.oDashboardLoadingManager = new DashboardLoadingManager("loadingManager", {
                oDashboardManager: this
            });
            //get 'home' view from the router
            if (this.oRouter) {
                var oTarget = this.oRouter.getTarget('home');
                oTarget.attachDisplay(function (oEvent) {
                    this.oDashboardView = oEvent.getParameter('view');
                }.bind(this));
            }

            this.oModel.bindProperty("/tileActionModeActive").attachChange(this._changeLinksScope.bind(this));
        },

        isBlindLoading : function () {
            var homePageGroupDisplay = oShellConfig.last("/core/home/homePageGroupDisplay");
            if ((homePageGroupDisplay === undefined || homePageGroupDisplay === "scroll") && this.bIsScrollModeAccordingKPI) {
                jQuery.sap.log.info("isBlindLoading reason IsScrollModeAccordingKPI and IsScrollMode: true");
                return true;
            }
            if (this.oModel.getProperty("/tileActionModeActive")) {
                jQuery.sap.log.info("isBlindLoading reason TileActionModeActive : true");
                return true;
            }
            return false;
        },

        createMoveActionDialog: function (sId) {
            var oGroupFilter = this.oGroupNotLockedFilter,
                oMoveDialog = new SelectDialog(sId, {
                    title: oResources.i18n.getText('moveTileDialog_title'),
                    rememberSelections: false,
                    search: function (oEvent) {
                        var sValue = oEvent.getParameter("value"),
                            oFilter = new Filter("title", sap.ui.model.FilterOperator.Contains, sValue),
                            oBinding = oEvent.getSource().getBinding("items");
                        oBinding.filter([oFilter, oGroupFilter]);
                    },
                    contentWidth: '400px',
                    contentHeight:"auto",
                    confirm: function (oEvent) {
                        var aContexts = oEvent.getParameter("selectedContexts");
                        this.publishMoveActionEvents(oEvent, aContexts, "movetile");
                    }.bind(this),
                    cancel: function () {
                        var oCurrentlyFocusedTile = jQuery('.sapUshellTile[tabindex="0"]')[0];
                        if (oCurrentlyFocusedTile) {
                            oCurrentlyFocusedTile.focus();
                        }
                    },
                    items: {
                        path: "/groups",
                        filters: [oGroupFilter],
                        template: new StandardListItem({
                            title: "{title}"
                        })
                    }
                });
            return oMoveDialog;
        },

        publishMoveActionEvents: function (oEvent, aContexts, sMoveAction) {
            var oEventBus = sap.ui.getCore().getEventBus();
            if (aContexts.length) {
              var stileType = this.tileType === "link" ? "links" : "tiles";
                oEventBus.publish("launchpad", sMoveAction, {
                    sTileId: this.tileUuid,
                    sToItems: stileType,
                    sFromItems: stileType,
                    sTileType: stileType,
                    toGroupId: aContexts[0].getObject().groupId,
                    toIndex: aContexts[0].getObject()[this.tileType === "link" ? "links" : "tiles"].length,
                    source: oEvent.getSource().getId(),
                    callBack: ComponentKeysHandler.callbackSetFocus.bind(ComponentKeysHandler)
                });


                oEventBus.publish("launchpad", "scrollToGroup", {
                    groupId: aContexts[0].getObject().groupId,
                    groupChanged: false,
                    focus: false
                });

            }
        },

        _changeLinksScope: function (oEvent) {
            var that = this;
            if (this.bLinkPersonalizationSupported) {
                var bIsTileActionModeActive = oEvent.getSource().getValue();
                this.oModel.getProperty("/groups").forEach(function (oGroup, index) {
                    if (!oGroup.isGroupLocked) {
                        that._changeGroupLinksScope(oGroup, bIsTileActionModeActive ? 'Actions' : 'Display');
                    }
                });
            }
        },

        _changeGroupLinksScope: function (oGroup, scope) {
            var that = this;

            oGroup.links.forEach(function (oLink, index) {
                that._changeLinkScope(oLink.content[0], scope);
            });
        },

        _changeLinkScope: function (oLink, scope) {
            var oLinkView = oLink.getScope ? oLink : oLink.getContent()[0];//hack for demo content

            //if LinkPersonalization is supported by platform, then the link must support personalization
            if (this.bLinkPersonalizationSupported && oLinkView.setScope) {
                oLinkView.setScope(scope);
            }
        },

        registerEvents: function () {
            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.subscribe("launchpad", "addBookmarkTile", this._createBookmark, this);
            oEventBus.subscribe("launchpad", "tabSelected", this.getSegmentTabContentViews, this);
            oEventBus.subscribe("sap.ushell.services.Bookmark", "bookmarkTileAdded", this._addBookmarkToModel, this);
            oEventBus.subscribe("sap.ushell.services.Bookmark", "catalogTileAdded", this._refreshGroupInModel, this);
            oEventBus.subscribe("sap.ushell.services.Bookmark", "bookmarkTileDeleted", this.loadPersonalizedGroups, this);
            oEventBus.subscribe("launchpad", "loadDashboardGroups", this.loadPersonalizedGroups, this);
            oEventBus.subscribe("launchpad", "createGroupAt", this._createGroupAt, this);
            oEventBus.subscribe("launchpad", "createGroup", this._createGroup, this);
            oEventBus.subscribe("launchpad", "deleteGroup", this._deleteGroup, this);
            oEventBus.subscribe("launchpad", "resetGroup", this._resetGroup, this);
            oEventBus.subscribe("launchpad", "changeGroupTitle", this._changeGroupTitle, this);
            oEventBus.subscribe("launchpad", "moveGroup", this._moveGroup, this);
            oEventBus.subscribe("launchpad", "deleteTile", this._deleteTile, this);
            oEventBus.subscribe("launchpad", "movetile", this._moveTile, this);
            oEventBus.subscribe("launchpad", "sortableStart", this._sortableStart, this);
            oEventBus.subscribe("launchpad", "sortableStop", this._sortableStop, this);
            oEventBus.subscribe("launchpad", "dashboardModelContentLoaded", this._modelLoaded, this);
            oEventBus.subscribe("launchpad", "convertTile", this._convertTile, this);

            //add Remove action for all tiles
            this.oPageBuilderService.registerTileActionsProvider(this._addFLPActionsToTile.bind(this));
        },

        _addFLPActionsToTile: function (oTile) {
            var bLinkPersonalizationSupportedForTile = this.bLinkPersonalizationSupported && this.oPageBuilderService.isLinkPersonalizationSupported(oTile),
                aActions = [];

            aActions.push(this._getMoveTileAction(oTile));

            if (bLinkPersonalizationSupportedForTile) {
                aActions.push(this._getConvertTileAction(oTile));
            }

            return aActions;
        },

        _getConvertTileAction: function (oTile) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                that = this,
                sTileType = that.oPageBuilderService.getTileType(oTile);
            return {
                //Convert Tile action
                text: sTileType === 'link' ? oResources.i18n.getText('ConvertToTile') : oResources.i18n.getText('ConvertToLink'),
                press: function (oSourceTile) {
                    var oConvertInfo = {
                        tile: oSourceTile,
                        callBack: ComponentKeysHandler.callbackSetFocus.bind(ComponentKeysHandler)
                    };
                    oEventBus.publish("launchpad", "convertTile", oConvertInfo);
                }
            };
        },

        _getMoveTileAction: function (oTile) {
            var that = this;
            return {
                //Move Tile action
                text: oResources.i18n.getText('moveTileDialog_action'),
                press: function () {
                    that.tileType = that.oPageBuilderService.getTileType(oTile);
                    that.tileUuid = that.getModelTileById(that.oPageBuilderService.getTileId(oTile), that.tileType === "link" ? "links" : "tiles").uuid;
                    var oMoveDialog = that.tileType === "tile" ? that.moveTileDialog : that.moveLinkDialog;
                    if (that.tileType === "tile" || that.tileType === "link") {
                        if (!oMoveDialog) {
                            oMoveDialog = that.createMoveActionDialog("move" + that.tileType + "Dialog");
                            oMoveDialog.setModel(that.oModel);
                            if (that.tileType === "tile") {
                                that.moveTileDialog = oMoveDialog;
                            } else {
                                that.moveLinkDialog = oMoveDialog;
                            }
                        } else {
                            oMoveDialog.getBinding("items").filter([that.oGroupNotLockedFilter]);
                        }
                        oMoveDialog.open();
                     }
                }
            };
        },

        _handleTileAppearanceAnimation: function (oSourceTile) {
            if (!oSourceTile) {
               return;
            }
            var pfx = ["webkit", ""];
            function PrefixedEvent (element, type) {
                for (var i = 0; i < pfx.length; i++) {
                    type = type.toLowerCase();
                    oSourceTile.attachBrowserEvent(pfx[i]+type, function (oEvent) {
                        if (oEvent.originalEvent && oEvent.originalEvent.animationName === "sapUshellTileEntranceAnimation") {
                            oSourceTile.removeStyleClass("sapUshellTileEntrance");
                        }
                    }, false);
                }
            }
            PrefixedEvent(oSourceTile, "AnimationEnd");
            oSourceTile.addStyleClass("sapUshellTileEntrance");
        },

        destroy: function () {

            var oEventBus = sap.ui.getCore().getEventBus();
            oEventBus.unsubscribe("launchpad", "addBookmarkTile", this._createBookmark, this);
            oEventBus.unsubscribe("launchpad", "loadDashboardGroups", this.loadPersonalizedGroups, this);
            oEventBus.unsubscribe("launchpad", "createGroupAt", this._createGroupAt, this);
            oEventBus.unsubscribe("launchpad", "createGroup", this._createGroup, this);
            oEventBus.unsubscribe("launchpad", "deleteGroup", this._deleteGroup, this);
            oEventBus.unsubscribe("launchpad", "resetGroup", this._resetGroup, this);
            oEventBus.unsubscribe("launchpad", "changeGroupTitle", this._changeGroupTitle, this);
            oEventBus.unsubscribe("launchpad", "moveGroup", this._moveGroup, this);
            oEventBus.unsubscribe("launchpad", "deleteTile", this._deleteTile, this);
            oEventBus.unsubscribe("launchpad", "movetile", this._moveTile, this);
            oEventBus.unsubscribe("launchpad", "sortableStart", this._sortableStart, this);
            oEventBus.unsubscribe("launchpad", "sortableStop", this._sortableStop, this);
            oEventBus.unsubscribe("launchpad", "dashboardModelContentLoaded", this._modelLoaded, this);
            sap.ui.getCore().detachThemeChanged(oUtils.handleTilesVisibility);

            sap.ushell.components.getHomepageManager = undefined;

            BaseObject.prototype.destroy.apply(this, arguments);
        },

        _sortableStart: function () {
            this.oSortableDeferred = jQuery.Deferred();
        },

        _createBookmark: function (sChannelId, sEventId, oData) {
            var tileGroup = oData.group ? oData.group.object : "";

            delete oData.group;

            function addBookmark () {
                sap.ushell.Container.getServiceAsync("Bookmark").then(function (oBookmarkService) {
                    oBookmarkService.addBookmark(oData, tileGroup)
                        .always(_checkRequestQueue)
                        .done(function () {
                            //the tile is added to our model in "_addBookmarkToModel" here we just show the
                            //success toast.
                            oMessagingHelper.showLocalizedMessage("tile_created_msg");
                        })
                        .fail(function (sMsg) {
                            jQuery.sap.log.error(
                                "Failed to add bookmark",
                                sMsg,
                                "sap.ushell.ui.footerbar.AddBookmarkButton"
                            );
                            oMessagingHelper.showLocalizedError("fail_to_add_tile_msg");
                        });
                });
            }

            _addRequest(addBookmark);
        },

        /*
         * Add a bookmark to a dashboard group.
         * If no group is specified then the bookmark is added to the default group.
         * This function will be called also if an application used the bookmark service directly to add a bookmark.
         * the bookmark service publishes an event so that we will be able to update the model.
         * This method doesn't display a success toast since the application should show success or failure messages
         */
        _addBookmarkToModel: function (sChannelId, sEventId, oData) {
            var oTile = oData.tile,
                aGroups,
                oGroup = oData.group,
                srvc,
                sTileType,
                newTile,
                indexOfGroup,
                targetGroup,
                iNumTiles,
                iIndex;

            if (!oData || !oTile) {
                this.bIsGroupsModelDirty = true;
                if (!this.bGroupsModelLoadingInProcess) {
                    this._handleBookmarkModelUpdate();
                }
                return;
            }

            // If no group was specified then the target group is the default one.
            if (!oGroup) {
                aGroups = this.getModel().getProperty("/groups");
                for (iIndex = 0; iIndex < aGroups.length; iIndex++) {
                    if (aGroups[iIndex].isDefaultGroup === true) {
                        oGroup = aGroups[iIndex].object;
                        break;
                    }
                }
            }

            //The create bookmark popup should not contain the locked groups anyway,
            //so this call not suppose to happen for a target locked group (we may as well always send false)
            srvc = this.oPageBuilderService;
            sTileType = srvc.getTileType(oTile);
            newTile = this._getTileModel(oTile, srvc.isGroupLocked(oGroup), sTileType);
            this.getTileView(newTile);
            indexOfGroup = this._getIndexOfGroupByObject(oGroup);
            targetGroup = this.oModel.getProperty("/groups/" + indexOfGroup);

            // The function calcVisibilityModes requires the group from the model
            targetGroup.tiles.push(newTile);
            targetGroup.visibilityModes = oUtils.calcVisibilityModes(targetGroup, true);
            iNumTiles = targetGroup.tiles.length;
            this._updateModelWithTileView(indexOfGroup, iNumTiles);

            this.oModel.setProperty("/groups/" + indexOfGroup, targetGroup);
        },

        _refreshGroupInModel: function (sChannelId, sEventId, sGroupId) {
            var oLaunchPageService = this.oPageBuilderService,
                sErrorMsg = 'Failed to refresh group with id:' + sGroupId + ' in the model',
                that = this;

            oLaunchPageService.getGroups()
                .fail(jQuery.sap.log.error(sErrorMsg, null, "sap.ushell.components.HomepageManager"))
                .done(function (aGroups) {
                    aGroups.some(function (oGroup) {
                        if (oLaunchPageService.getGroupId(oGroup) === sGroupId) {
                            oLaunchPageService.getDefaultGroup().done(function (oDefaultGroup) {
                                var bIsDefaultGroup = sGroupId === oDefaultGroup.getId() ? true : false,
                                    oGroupModel = that._getGroupModel(oGroup, bIsDefaultGroup, false, {isRendered: true}),
                                    indexOfGroup = that._getIndexOfGroupByObject(oGroupModel.object);

                                oGroupModel.visibilityModes = sap.ushell.utils.calcVisibilityModes(oGroup, true);
                                that.oModel.setProperty("/groups/" + indexOfGroup, oGroupModel);

                                // The old group tiles are lost, get the tile views
                                if (oGroupModel && oGroupModel.tiles) {
                                    oGroupModel.tiles.forEach(function (tile) {
                                        that.getTileView(tile);
                                    });
                                }
                            });
                            return true;
                        }
                    });
                });
        },

        _sortableStop: function () {
            this.oSortableDeferred.resolve();
        },

        _handleAfterSortable: function (fFunc) {
            return function () {
                var outerArgs = Array.prototype.slice.call(arguments);
                this.oSortableDeferred.done(function () {
                    fFunc.apply(null, outerArgs);
                });
            }.bind(this);
        },

        _createGroup: function () {
            var oGroup = this._getGroupModel(null),
                oModel = this.oModel,
                aGroups = oModel.getProperty("/groups");
            oModel.setProperty("/groups/" + aGroups.length, oGroup);

            // We don't call the backend here as the user hasn't had the opportunity to give the group a name yet.
            // The group will be persisted after it got a name, in the changeGroupTitle handler.
            // TODO: This depends on the behaviour of the GroupList, which enters edit-mode immediately after creating a group.
            //       It would be better if this event would be fired after the group has a name.
        },

        /*
         * oData should have the following parameters:
         * title
         * location
         */
        _createGroupAt: function (sChannelId, sEventId, oData) {
            var newGroupIndex = parseInt(oData.location, 10),
                aGroups = this.oModel.getProperty("/groups"),
                oGroup = this._getGroupModel(null, false, newGroupIndex === aGroups.length, oData),
                oModel = this.oModel,
                i;

            oGroup.index = newGroupIndex;

            aGroups.splice(newGroupIndex, 0, oGroup);
            for (i = 0; i < aGroups.length - 1; i++) {
                aGroups[i].isLastGroup = false;
            }

            //set new groups index
            for (i = newGroupIndex + 1; i < aGroups.length; i++) {
                aGroups[i].index++;
            }
            oModel.setProperty("/groups", aGroups);
        },

        _getIndexOfGroupByObject: function (oGroup) {
            var nGroupIndex = null,
                aGroups = this.oModel.getProperty("/groups"),
                sGroupId = this.oPageBuilderService.getGroupId(oGroup);
            aGroups.every(function (oModelGroup, nIndex) {
                var sCurrentGroupId = this.oPageBuilderService.getGroupId(oModelGroup.object);
                if (sCurrentGroupId === sGroupId) {
                    nGroupIndex = nIndex;
                    return false;
                }
                return true;
            }.bind(this));
            return nGroupIndex;
        },

        addTileToGroup: function (sGroupPath, oTile) {
            var sTilePath = sGroupPath + "/tiles",
                oGroup = this.oModel.getProperty(sGroupPath),
                iNumTiles = this.oModel.getProperty(sTilePath).length,
                sTileType = this.oPageBuilderService.getTileType(oTile);

            //Locked groups cannot be added with tiles, so the target group will not be locked, however just for safety we will check the target group locking state
            var isGroupLocked = this.oModel.getProperty(sGroupPath + "/isGroupLocked"),
                personalization = this.oModel.getProperty("/personalization");
            oGroup.tiles[iNumTiles] = this._getTileModel(oTile, isGroupLocked, sTileType);

            this.getTileView(oGroup.tiles[iNumTiles]);
            oGroup.visibilityModes = oUtils.calcVisibilityModes(oGroup, personalization);
            this._updateModelWithTileView(oGroup.index, iNumTiles);
            this.oModel.setProperty(sGroupPath, oGroup);
        },

        _getPathOfTile: function (sTileId) {
            var aGroups = this.oModel.getProperty("/groups"),
                nResGroupIndex = null,
                nResTileIndex = null,
                sType,
                fnEqual = function (nTileIndex, oTile) {
                    if (oTile.uuid === sTileId) {
                        nResTileIndex = nTileIndex;
                        return false;
                    }
                };

            jQuery.each(aGroups, function (nGroupIndex, oGroup) {
                jQuery.each(oGroup.tiles, fnEqual);
                if (nResTileIndex !== null) {
                    nResGroupIndex = nGroupIndex;
                    sType = "tiles";
                    return false;
                }
                jQuery.each(oGroup.links, fnEqual);
                if (nResTileIndex !== null) {
                    nResGroupIndex = nGroupIndex;
                    sType = "links";
                    return false;
                }
            });

            return nResGroupIndex !== null ? "/groups/" + nResGroupIndex + "/" + sType + "/" + nResTileIndex : null;
        },

        // see http://stackoverflow.com/questions/5306680/move-an-array-element-from-one-array-position-to-another
        _moveInArray: function (aArray, nFromIndex, nToIndex) {
            if (nToIndex >= aArray.length) {
                var k = nToIndex - aArray.length;
                while ((k--) + 1) {
                    aArray.push(undefined);
                }
            }
            aArray.splice(nToIndex, 0, aArray.splice(nFromIndex, 1)[0]);
        },

        _updateGroupIndices: function (aArray) {
            var k;
            for (k = 0; k < aArray.length; k++) {
                aArray[k].index = k;
            }
        },

        /*
         * oData should have the following parameters
         * groupId
         */
        _deleteGroup: function (sChannelId, sEventId, oData) {
            var that = this,
                sGroupId = oData.groupId,
                sGroupObjectId,
                aGroups = this.oModel.getProperty("/groups"),
                nGroupIndex = oGroupsHelper.getIndexOfGroup(aGroups, sGroupId),
                bIsLast = aGroups.length - 1 === nGroupIndex,
                oGroup = null,
                oModel,
                nextSelectedItemIndex,
                oBus;

            nextSelectedItemIndex = bIsLast ? nGroupIndex - 1 : nGroupIndex;
            oDestroyHelper.destroyFLPAggregationModel(this.oModel.getProperty("/groups/" + nGroupIndex));
            oGroup = aGroups.splice(nGroupIndex, 1)[0].object;
            if (bIsLast) {
                this.oModel.setProperty("/groups/" + nextSelectedItemIndex + "/isLastGroup", bIsLast);
            }
            sGroupObjectId = this.oPageBuilderService.getGroupId(oGroup);
            oModel = this.oModel;
            oModel.setProperty("/groups", aGroups);
            this._updateGroupIndices(aGroups);

            if (nextSelectedItemIndex >= 0) {
                oBus = sap.ui.getCore().getEventBus();
                window.setTimeout(jQuery.proxy(oBus.publish, oBus, "launchpad", "scrollToGroup", {groupId: this.oModel.getProperty("/groups")[nextSelectedItemIndex].groupId}), 200);
            }

            function deleteGroup () {
                var groupName = this.oPageBuilderService.getGroupTitle(oGroup);
                try {
                    this.oPageBuilderService.removeGroup(oGroup)
                        .done(function () {
                            _logUsageAnalytics(analyticsConstants.DELETE_GROUP, [groupName, sGroupObjectId]);
                            oMessagingHelper.showLocalizedMessage("group_deleted_msg", [groupName]);
                        })
                        .fail(this._handleAfterSortable(that._resetGroupsOnFailureHelper("fail_to_delete_group_msg")))
                        .always(_checkRequestQueue);
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_delete_group_msg");
                }
            }
            _addRequest(deleteGroup.bind(this));
        },

        /*
         * oData should have the following parameters
         * groupId
         */
        _resetGroup: function (sChannelId, sEventId, oData) {
            var that = this,
                sGroupId = oData.groupId,
                aGroups = this.oModel.getProperty("/groups"),
                nGroupIndex = oGroupsHelper.getIndexOfGroup(aGroups, sGroupId),
                oGroup = this.oModel.getProperty("/groups/" + nGroupIndex),
                sGroupTitle,
                sGroupObjectId,
                oGroupControl;

            this.oModel.setProperty("/groups/" + nGroupIndex + "/sortable", false);
            sGroupObjectId = this.oPageBuilderService.getGroupId(oGroup.object);
            sGroupTitle = this.oPageBuilderService.getGroupTitle(oGroup.object);
            function resetGroup () {
                try {
                    this.oPageBuilderService.resetGroup(oGroup.object)
                    .done(this._handleAfterSortable(jQuery.proxy(function (sGroupId, oGroup, oResetedGroup) {
                        _logUsageAnalytics(analyticsConstants.RESET_GROUP, [sGroupTitle, sGroupObjectId]);
                        var aGroups = this.oModel.getProperty("/groups"),
                            nGroupIndex = oGroupsHelper.getIndexOfGroup(aGroups, sGroupId);

                        this._loadGroup(nGroupIndex, oResetedGroup || oGroup.object);
                        oMessagingHelper.showLocalizedMessage("group_reset_msg", [oGroup.title]);
                        this.oModel.setProperty("/groups/" + nGroupIndex + "/sortable", true);

                        oGroupControl = sap.ui.getCore().byId('dashboardGroups').getGroupControlByGroupId(sGroupId);

                        if (oGroupControl.getBindingContext().getObject().links && oGroupControl.getBindingContext().getObject().links.length && !oGroupControl.getIsGroupLocked()) {
                            this._changeGroupLinksScope(oGroupControl.getBindingContext().getObject(), this.oModel.getProperty("/tileActionModeActive") ? sap.m.GenericTileScope.Actions : sap.m.GenericTileScope.Display);
                        }

                        if (oGroupControl) {
                            oGroupControl.rerender();
                            oEventHub.emit("updateGroups", Date.now());
                            oUtils.handleTilesVisibility();
                        }

                    }, this, sGroupId, oGroup)))
                    .fail(this._handleAfterSortable(that._resetGroupsOnFailureHelper("fail_to_reset_group_msg")))
                    .always(_checkRequestQueue);
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_reset_group_msg");
                }
            }
            _addRequest(resetGroup.bind(this));
        },

        /*
         * oData should have the following parameters
         * fromIndex
         * toIndex
         */
        _moveGroup: function (sChannelId, sEventId, oData) {
            var iFromIndex = oData.fromIndex,
                iToIndex = oData.toIndex,
                aGroups = this.oModel.getProperty("/groups"),
                oModel = this.oModel,
                bActionMode = this.oModel.getProperty("/tileActionModeActive"),
                oGroup,
                sGroupId,
                that = this,
                i,
                oDestinationObj;

            //Fix the indices to support hidden groups
            if (!bActionMode) {
                iFromIndex = this._adjustFromGroupIndex(iFromIndex, aGroups);
            }

            //Move var definition after fixing the from index.
            oGroup = aGroups[iFromIndex];
            sGroupId = oGroup.groupId;
            //Fix the to index accordingly
            if (!bActionMode) {
                iToIndex = this._adjustToGroupIndex(iToIndex, aGroups, sGroupId);
            }

            oDestinationObj = aGroups[iToIndex].object;
            this._moveInArray(aGroups, iFromIndex, iToIndex);
            this._updateGroupIndices(aGroups);
            for (i = 0; i < aGroups.length - 1; i++) {
                aGroups[i].isLastGroup = false;
            }
            aGroups[aGroups.length - 1].isLastGroup = true;
            oModel.setProperty("/groups", aGroups);

            function moveGroup () {
                aGroups = this.oModel.getProperty("/groups"); //Update aGroups. Can be change before callback
                var oGroup = this.oModel.getProperty(oGroupsHelper.getModelPathOfGroup(aGroups, sGroupId));
                if (!oGroup.object) {
                    return;
                }
                try {
                    this._getOriginalGroupIndex(oDestinationObj).done(function (nGroupOrgIndex) {
                        this.oPageBuilderService.moveGroup(oGroup.object, nGroupOrgIndex)
                            .done(function () {
                                    _logUsageAnalytics(that.analyticsConstants.MOVE_GROUP, [oGroup.title, iFromIndex, iToIndex, sGroupId]);
                            })
                            .fail(this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_move_group_msg")))
                            .always(_checkRequestQueue);
                    }.bind(this));
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_move_group_msg");
                }
            }
            _addRequest(moveGroup.bind(this));
        },

        /*
         * toIndex - The index in the UI of the required group new index. (it is not including the group itself)
         * groups - The list of groups in the model (including hidden and visible groups)
         * The function returns the new index to be used in the model - since there might be hidden groups that should be taken in account
         */
        _adjustToGroupIndex: function (toIndex, groups, groupId) {
            var visibleCounter = 0,
                bIsGroupIncluded = false,
                i = 0;
            // In order to get the new index, count all groups (visible+hidden) up to the new index received from the UI.
            for (i = 0; i < groups.length && visibleCounter < toIndex; i++) {
                if (groups[i].isGroupVisible) {
                    if (groups[i].groupId === groupId) {
                        bIsGroupIncluded = true;
                    } else {
                        visibleCounter++;
                    }
                }
            }
            if (bIsGroupIncluded) {
                return i - 1;
            }
            return i;
        },

        _adjustFromGroupIndex: function (index, groups) {
            var visibleGroupsCounter = 0,
                i;
            for (i = 0; i < groups.length; i++) {
                if (groups[i].isGroupVisible) {
                    visibleGroupsCounter++;
                }
                if (visibleGroupsCounter === index + 1) {
                    return i;
                }
            }
            //Not suppose to happen, but if not found return the input index
            return index;
        },
        /*
         * returns the adapter cosponsoring group index
         */
        _getOriginalGroupIndexByIndex: function (nGroupIndex) {
            var aGroups = this.oModel.getProperty("/groups"),
                oServerGroupObject = aGroups[nGroupIndex].object;

            return this._getOriginalGroupIndex(oServerGroupObject);
        },
        /*
         * returns the adapter cosponsoring group index
         */
        _getOriginalGroupIndex: function (oServerGroupObject) {
            var srvc = this.oPageBuilderService,
                oGroupsPromise = this.oPageBuilderService.getGroups(),
                oDeferred = new jQuery.Deferred();

            oGroupsPromise.done(function (aGroups) {
                var nGroupOrgIndex = null;

                jQuery.each(aGroups, function (nIndex, oGroup) {
                    if (srvc.getGroupId(oGroup) === srvc.getGroupId(oServerGroupObject)) {
                        nGroupOrgIndex = nIndex;
                        return false;
                    }
                });

                oDeferred.resolve(nGroupOrgIndex);
            });

            oGroupsPromise.fail(function () {
                oMessagingHelper.showLocalizedError("fail_to_load_groups_msg");
                oDeferred.reject();
            });

            return oDeferred;

        },        /*
         * oData should have the following parameters
         * groupId
         * newTitle
         */
        _changeGroupTitle: function (sChannelId, sEventId, oData) {
            var sNewTitle = oData.newTitle,
                aGroups = this.oModel.getProperty("/groups"),
                sGroupId = oData.groupId,
                sGroupOriginalId = oData.groupId,
                nGroupIndex = oGroupsHelper.getIndexOfGroup(aGroups, sGroupId),
                oGroup = this.oModel.getProperty("/groups/" + nGroupIndex),
                sOldTitle = oGroup.title;

            this.oModel.setProperty("/groups/" + nGroupIndex + "/title", sNewTitle);

            function addGroup () {
                try {
                    if (nGroupIndex === aGroups.length - 1) {
                        this.oPageBuilderService.addGroup(sNewTitle, nGroupIndex)
                            .done(this._handleAfterSortable(jQuery.proxy(function (sGroupId, oNewGroup) {
                                var aGroups = this.oModel.getProperty("/groups"),
                                    nGroupIndex = oGroupsHelper.getIndexOfGroup(aGroups, sGroupId);
                                this._loadGroup(nGroupIndex, oNewGroup);
                                _logUsageAnalytics(analyticsConstants.RENAME_GROUP, [sOldTitle, sNewTitle, sGroupId]);
                            }, this, sGroupId)))
                            .fail(this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_create_group_msg")))
                            .always(_checkRequestQueue);
                    } else {
                        //handle new group creation.
                        this._getOriginalGroupIndexByIndex(nGroupIndex + 1)
                            .done(function (nGroupOrgIndex) {
                                this.oPageBuilderService.addGroupAt(sNewTitle, nGroupOrgIndex)
                                    .done(this._handleAfterSortable(jQuery.proxy(function (sGroupId, oNewGroup) {
                                        var aGroups = this.oModel.getProperty("/groups"),
                                            nGroupIndex = oGroupsHelper.getIndexOfGroup(aGroups, sGroupId);
                                        this._loadGroup(nGroupIndex, oNewGroup);
                                        _logUsageAnalytics(analyticsConstants.RENAME_GROUP, [sOldTitle, sNewTitle, sGroupId]);
                                    }, this, sGroupId)))
                                    .fail(this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_create_group_msg")))
                                    .always(_checkRequestQueue);
                        }.bind(this));
                    }
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_create_group_msg");
                }
            }

            function renameGroup () {
                try {
                    this.oPageBuilderService.setGroupTitle(oGroup.object, sNewTitle)
                        .done(function () {
                            sGroupOriginalId = this.oPageBuilderService.getGroupId(oGroup.object);
                            _logUsageAnalytics(analyticsConstants.RENAME_GROUP, [sOldTitle, sNewTitle, sGroupOriginalId]);
                        }.bind(this))
                        // Revert to the old title.
                        .fail(this._handleAfterSortable(jQuery.proxy(function (sGroupId, sOldTitle) {
                            var aGroups = this.oModel.getProperty("/groups"),
                                sGroupPath = oGroupsHelper.getModelPathOfGroup(aGroups, sGroupId);
                            oMessagingHelper.showLocalizedError("fail_to__msg");
                            this.oModel.setProperty(sGroupPath + "/title", sOldTitle);
                            _requestFailed();
                        }, this, sGroupId)))
                        .always(_checkRequestQueue);
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_rename_group_msg");
                }
            }

            // Check, if the group has already been persisted.
            if (!oGroup.object) {
                _checkRequestQueue.call(this);
                // Add the group in the backend.
                _addRequest(addGroup.bind(this));
            } else {
                // Rename the group in the backend.
                // model is already changed - it only has to be made persistent in the backend
                _addRequest(renameGroup.bind(this));
            }
        },


        /**
         * Add the group to the end of groups model
         * @param {Object} oGroup The group object
         * @returns {Object} The group context
         */
        addGroupToModel: function (oGroup) {
            var oGroupModel = this._getGroupModel(oGroup, false, true),
                aGroups = this.oModel.getProperty("/groups"),
                nGroupIndex = aGroups.length, //push new group at the end of list
                oContextGroup;

            if (nGroupIndex > 0) {
                aGroups[nGroupIndex - 1].isLastGroup = false;
            }
            oGroupModel.index = nGroupIndex;
            aGroups.push(oGroupModel);
            this.oModel.setProperty("/groups/", aGroups);

            oContextGroup = new sap.ui.model.Context(this.oModel, "/groups/" + nGroupIndex);
            return oContextGroup;

        },

        /*
         * Dashboard
         * oData should have the following parameters
         * tileId
         * groupId
         */
        _deleteTile: function (sChannelId, sEventId, oData) {
            var that = this,
                sTileId = oData.tileId || oData.originalTileId,
                aGroups = this.oModel.getProperty("/groups"),
                sItems = oData.items || 'tiles';

            jQuery.each(aGroups, function (nGroupIndex, oGroup) {
                var bFoundFlag = false;
                jQuery.each(oGroup[sItems], function (nTileIndex, oTmpTile) {
                    if (oTmpTile.uuid !== sTileId && oTmpTile.originalTileId !== sTileId) {
                        return true; // continue
                    }
                    // Remove tile from group.
                    oDestroyHelper.destroyTileModel(that.oModel.getProperty("/groups/" + nGroupIndex + "/" + sItems + "/" + nTileIndex));
                    var oTile = oGroup[sItems].splice(nTileIndex, 1)[0],
                        sTileName = that.oPageBuilderService.getTileTitle(oTile.object),
                        sCatalogTileId = that.oPageBuilderService.getCatalogTileId(oTile.object),
                        sCatalogTileTitle = that.oPageBuilderService.getCatalogTileTitle(oTile.object),
                        sTileRealId = that.oPageBuilderService.getTileId(oTile.object),
                        personalization = that.oModel.getProperty("/personalization");

                    oGroup.visibilityModes = oUtils.calcVisibilityModes(oGroup, personalization);
                    that.oModel.setProperty("/groups/" + nGroupIndex, oGroup);
                    function deleteTile () {
                        try {
                            that.oPageBuilderService.removeTile(oGroup.object, oTile.object)
                                .done(that._handleAfterSortable(function () {
                                    oMessagingHelper.showLocalizedMessage("tile_deleted_msg", [sTileName, oGroup.title]);
                                    _logUsageAnalytics(analyticsConstants.DELETE_TILE, [sTileName || sTileRealId, sCatalogTileId, sCatalogTileTitle, oGroup.title]);
                                }))
                                .fail(that._handleAfterSortable(that._resetGroupsOnFailureHelper("fail_to_remove_tile_msg")))
                                .always(_checkRequestQueue);
                        } catch (err) {
                            that._resetGroupsOnFailure("fail_to_remove_tile_msg");
                        }
                    }
                    _addRequest(deleteTile);
                    oUtils.handleTilesVisibility();
                    bFoundFlag = true;
                    return false;
                });
                return !bFoundFlag;
            });
        },

        /**
         * Remove tiles from the group model
         *
         * @param {String} sGroupId Id of the group, where tiles should be removed
         * @param {Array} aRemovedTilesIds Array of the tile uuids to remove
         *
         */
        deleteTilesFromGroup: function (sGroupId, aRemovedTilesIds) {
            var aGroups = this.oModel.getProperty("/groups"),
                iGroupIndex = oGroupsHelper.getIndexOfGroup(aGroups, sGroupId),
                oGroup = this.oModel.getProperty("/groups/" + iGroupIndex),
                aFilteredTiles = [];

            ["tiles", "links"].forEach(function (sAttribute){
                aFilteredTiles = oGroup[sAttribute].filter(function (oTile){
                    if (aRemovedTilesIds.indexOf(oTile.uuid) < 0) {
                        return true;
                    }
                    return false;
                });
                oGroup[sAttribute] = aFilteredTiles;
            });

            oGroup.visibilityModes = oUtils.calcVisibilityModes(oGroup, true);
            this.oModel.setProperty("/groups/" + iGroupIndex, oGroup);
        },

        _getGroupIndex: function (sId) {
            var aGroups = this.oModel.getProperty("/groups"),
                oGroupInfo = this._getNewGroupInfo(aGroups, sId);
            if (oGroupInfo) {
                return oGroupInfo.newGroupIndex;
            }
        },

        _convertTile: function (sChannelId, sEventId, oData) {
            var oSourceTile = oData.tile ? oData.tile : oData,//temp solution - i should change all calls for convert to support oData obj
                nGroupIndex = oData.srcGroupId ? this._getGroupIndex(oData.srcGroupId) : undefined,
                oGroup = oData.srcGroupId ? this.oModel.getProperty("/groups/" + nGroupIndex) : oSourceTile.getParent().getBindingContext().getObject(),//please humafy this
                aTileBindingContext = oSourceTile.getBindingContext().sPath.split("/"),
                oTile = oSourceTile.getBindingContext().getObject(),
                sType = aTileBindingContext[aTileBindingContext.length - 2],
                sTileId = oTile.uuid,
                curTileIndex = parseInt(aTileBindingContext[aTileBindingContext.length - 1],10),
                newTileIndex = oData.toIndex !== undefined ? oData.toIndex : undefined,
                oResultPromise,
                bActionMode = this.oModel.getProperty("/tileActionModeActive"),
                newGroupIndex = oData.toGroupId ? this._getGroupIndex(oData.toGroupId) : oGroup.index,
                oDstGroup =  oData.toGroupId ? this.oModel.getProperty("/groups/" + newGroupIndex) : oGroup;

            var oIndexInfo =  this._getIndexForConvert(sType, curTileIndex, newTileIndex, oGroup, oDstGroup),
                sourceInfo = {
                  "tileIndex": curTileIndex,
                  "groupIndex": nGroupIndex,
                  "group": oGroup
                };

            function convertTile () {
                try {
                    oResultPromise = this.oPageBuilderService.moveTile(oTile.object, oIndexInfo.tileIndex, oIndexInfo.newTileIndex, oGroup.object, oDstGroup.object, sType === "links" ? "tile" : "link");
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_move_tile_msg");
                    return;
                }

                // Putting a special flag on the Tile's object
                // this enables us to disable opening the tile's action until it has been updated from the backend
                // (see in DashboardContent.view
                oTile.tileIsBeingMoved = true;

                //we call to _handleAfterSortable to handle the case in which convertTile is called by dragAndDrop flow
                oResultPromise.done(this._handleAfterSortable(jQuery.proxy(function (sTileId, oTargetTile) {
                    var sTilePath = this._getPathOfTile(sTileId);

                    // If we cannot find the tile, it might have been deleted -> Check!
                    if (sTilePath) {
                        _checkRequestQueue();
                        // get the target-tile view and align the Model for consistency
                        this.oPageBuilderService.getTileView(oTargetTile).done(function (oView) {
                            if (sType === "tiles") {//it means we convert to link
                              this._attachLinkPressHandlers(oView);
                              this._addDraggableAttribute(oView);
                              this._changeLinkScope(oView, bActionMode && sType !== 'links' ? 'Actions' : 'Display');
                            }
                            var dstGroupInfo = {
                              "tileIndex": newTileIndex,
                              "groupIndex": newGroupIndex,
                              "group": oDstGroup
                            },
                            tileInfo = {
                              "tile": oTile,
                              "view": oView,
                              "type": sType,
                              "tileObj": oTargetTile
                            };

                            this.replaceTileViewAfterConvert(sourceInfo, dstGroupInfo, tileInfo);
                            oEventHub.emit("updateGroups", Date.now());
                            oUtils.handleTilesVisibility();
                            if (oData.callBack) {
                                oData.callBack(oView);
                            }
                        }.bind(this));
                    }
                }, this, sTileId)));

                oResultPromise.fail(this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_move_tile_msg")));
            }
            _addRequest(convertTile.bind(this));
        },

        replaceTileViewAfterConvert: function (oSourceInfo, oDstInfo, oTileInfo) {
            // get the old view from tile's model
            var oTile = oTileInfo.tile,
                oldViewContent = oTile.content;
                // first we set new view, new tile object and new Id. And reset the move-scenario flag
                oTile.tileIsBeingMoved = false;
                oTile.content = [oTileInfo.view];
                oTile.object = oTileInfo.tileObj;
                oTile.originalTileId = this.oPageBuilderService.getTileId(oTileInfo.tileObj);

            //fix the tile position in the model and insert the converted tile\link to the group
            oSourceInfo.group[oTileInfo.type].splice(oSourceInfo.tileIndex, 1);
            if (oDstInfo.tileIndex !== undefined) {
              oDstInfo.group[oTileInfo.type === "tiles" ? "links" : "tiles"].splice(oDstInfo.tileIndex, 0, oTile);
            } else {
              oDstInfo.group[oTileInfo.type === "tiles" ? "links" : "tiles"].push(oTile);
            }

            this.oModel.setProperty("/groups/" + oDstInfo.groupIndex , oDstInfo.group);
            this.oModel.setProperty("/groups/" + oSourceInfo.groupIndex , oSourceInfo.group);

            //handle animation
            if (oTileInfo.type === "links") {
                this._handleTileAppearanceAnimation(oTile.content[0].getParent());
            } else {
                this._handleTileAppearanceAnimation(oTile.content[0]);
            }

            if (oldViewContent && oldViewContent[0]) {
                oldViewContent[0].destroy();
            }
        },
        /*
        * sType: the type of the tile(lineMode/ContentMode) befor the convert action
        */
        _getIndexForConvert: function (sType, curTileIndex, newTileIndexInShellModel, oGroup, oDstGroup) {
            var nNewTileIndex;
            if (sType === "tiles") {
                //If we convert ContentMode-tile to link then we want to enter the new link to the end of the array or to provided newTileIndex
                if (newTileIndexInShellModel !== undefined) {
                  nNewTileIndex = oDstGroup[sType].length + newTileIndexInShellModel;
                } else {
                  nNewTileIndex = oDstGroup[sType].length + oDstGroup["links"].length;
                }
                if (oGroup.groupId === oDstGroup.groupId) {
                    nNewTileIndex--;
                }
            } else {
                //If we convert link to ContentMode-tile then we want to enter the new tile after the the last ContentMode-tile
                nNewTileIndex = newTileIndexInShellModel ? newTileIndexInShellModel : oGroup['tiles'].length;
                curTileIndex += oGroup["tiles"].length;
            }
            return {"tileIndex": curTileIndex, "newTileIndex": nNewTileIndex};
        },
        _getIndexForMove: function (sType, curTileIndex, newTileIndexInShellModel, oDstGroup, oSourceGroup) {
          var nNewTileIndex;
          if (sType === "tiles") {
              //case move tile
              nNewTileIndex = newTileIndexInShellModel !== undefined ? newTileIndexInShellModel : oDstGroup[sType].length;
          } else {
              //case move link
              if (newTileIndexInShellModel !== undefined) {
                nNewTileIndex = oDstGroup["tiles"].length + newTileIndexInShellModel;
              } else {
                nNewTileIndex = oDstGroup["tiles"].length + oDstGroup["links"].length;
              }
              curTileIndex +=  oSourceGroup["tiles"].length;
          }
          return {"tileIndex": curTileIndex, "newTileIndex": nNewTileIndex};
        },

        _getTileInfo: function (aGroups, sTileId, sItems) {
            var oTileInfo;
            jQuery.each(aGroups, function (nTmpGroupIndex, oTmpGroup) {
                var bFoundFlag = false;
                jQuery.each(oTmpGroup[sItems], function (nTmpTileIndex, oTmpTile) {
                    if (oTmpTile.uuid === sTileId) {
                        //the order is oTile, nTileIndex, oOldGroup, nOldGroupIndex
                        oTileInfo = {"oTile": oTmpTile, "tileIndex": nTmpTileIndex, "oGroup": oTmpGroup, "groupIndex": nTmpGroupIndex};
                        bFoundFlag = true;
                        return false;
                    }
                });
                return !bFoundFlag;
            });
            return oTileInfo;
        },

        _getNewGroupInfo: function (aGroups, sNewGroupId) {//should be concidered to improve by inserting the logic into _getTileInfo function
            var oNewGroupInfo;
            jQuery.each(aGroups, function (nTmpGroupIndex, oTmpGroup) {
                if (oTmpGroup.groupId === sNewGroupId) {
                    //order is oNewGroup, nNewGroupIndex
                    oNewGroupInfo = {"oNewGroup" : oTmpGroup, "newGroupIndex": nTmpGroupIndex};
                }
            });
            return oNewGroupInfo;
        },


        /*
        * oData should have the following parameters:
        * fromGroupId
        * toGroupId
        * fromIndex
        * toIndex can be null => append as last tile in group
        */
        _moveTile: function (sChannelId, sEventId, oData) {
            var nNewIndex = oData.toIndex,
                sNewGroupId = oData.toGroupId,
                sTileId = oData.sTileId,
                sSource = oData.source,
                sType = oData.sTileType === "tiles" || oData.sTileType === "tile" ? "tile" : "link",
                sToItems = oData.sToItems,
                sFromItems = oData.sFromItems,
                srvc = this.oPageBuilderService,
                bActionMode = this.oModel.getProperty("/tileActionModeActive"),
                aGroups = this.oModel.getProperty("/groups"),
                oSourceGroup,
                oTargetGroup,
                oResultPromise,
                personalization,
                oTileInfo,
                oGroupInfo,
                oIndexInfo = {};

            oTileInfo = this._getTileInfo(aGroups, sTileId, sFromItems);
            oGroupInfo = this._getNewGroupInfo(aGroups, sNewGroupId);

            //When moving a tile to the group it is already in using the move dialog, there is no change
            if (oTileInfo.oGroup.groupId == oGroupInfo.oNewGroup.groupId && (sSource === "movetileDialog" || nNewIndex === null || sSource === "movelinkDialog")) {
                return;
            }
            if (sType === "link") {
                oTileInfo.oTile.content[0].addStyleClass("sapUshellZeroOpacity");
            }

            // When a tile is dragged into an empty group, the Plus-Tiles in the empty list cause
            // the new index to be off by one, i.e. 1 instead of 0, which causes an error.
            // This is a generic check which sanitizes the values if necessary.
            if (sType === "tile" && sToItems === 'tiles') {
                if (nNewIndex && nNewIndex > oGroupInfo.oNewGroup[sToItems].length) {
                    nNewIndex = oGroupInfo.oNewGroup[sToItems].length;
                }
            }
            if (oTileInfo.oGroup.groupId === sNewGroupId && sToItems === sFromItems) {
                if (nNewIndex === null || nNewIndex === undefined) {
                    // moved over group list to same group
                    oTileInfo.oGroup[sToItems].splice(oTileInfo.tileIndex, 1);
                    // Tile is appended. Set index accordingly.
                    nNewIndex = oTileInfo.oGroup[sToItems].length;
                    // append as last item
                    oTileInfo.oGroup[sToItems].push(oTileInfo.oTile);
                } else {
                    nNewIndex = this._adjustTileIndex(nNewIndex, oTileInfo.oTile, oTileInfo.oGroup, sToItems);
                    this._moveInArray(oTileInfo.oGroup[sToItems], oTileInfo.tileIndex, nNewIndex);
                }

                this.oModel.setProperty("/groups/" + oTileInfo.groupIndex + "/" + sToItems, oTileInfo.oGroup[sToItems]);
            } else {
                // remove from old group
                personalization = this.oModel.getProperty("/personalization");
                oTileInfo.oGroup[sFromItems].splice(oTileInfo.tileIndex, 1);
                oTileInfo.oGroup.visibilityModes = oUtils.calcVisibilityModes(oTileInfo.oGroup, personalization);
                this.oModel.setProperty("/groups/" + oTileInfo.groupIndex + "/" + sFromItems, oTileInfo.oGroup[sFromItems]);

                // add to new group
                if (nNewIndex === null || nNewIndex === undefined) {
                    // Tile is appended. Set index accordingly.
                    nNewIndex = oGroupInfo.oNewGroup[sToItems].length;
                    // append as last item
                    oGroupInfo.oNewGroup[sToItems].push(oTileInfo.oTile);
                } else {
                    nNewIndex = this._adjustTileIndex(nNewIndex, oTileInfo.oTile, oGroupInfo.oNewGroup, sToItems);
                    oGroupInfo.oNewGroup[sToItems].splice(nNewIndex, 0, oTileInfo.oTile);
                }
                oGroupInfo.oNewGroup.visibilityModes = oUtils.calcVisibilityModes(oGroupInfo.oNewGroup, personalization);
                this.oModel.setProperty("/groups/" + oGroupInfo.newGroupIndex + "/" + sToItems, oGroupInfo.oNewGroup[sToItems]);
            }

            //recalculate the associated groups for catalog tiles
            oEventHub.emit("updateGroups", Date.now());
            // Re-calculate the visibility of the Tiles
            oUtils.handleTilesVisibility();


            // change in backend
            oSourceGroup = this.oModel.getProperty("/groups/" + oTileInfo.groupIndex);
            oTargetGroup = this.oModel.getProperty("/groups/" + oGroupInfo.newGroupIndex);
            oIndexInfo =  this._getIndexForMove(sFromItems, oTileInfo.tileIndex, nNewIndex, oGroupInfo.oNewGroup, oSourceGroup);

            function moveTile () {
                try {
                    oResultPromise = this.oPageBuilderService.moveTile(oTileInfo.oTile.object, oIndexInfo.tileIndex, oIndexInfo.newTileIndex, oSourceGroup.object, oTargetGroup.object, sType);
                } catch (err) {
                    this._resetGroupsOnFailure("fail_to_move_tile_msg");
                    return;
                }

                // Putting a special flag on the Tile's object
                // this enables us to disable opening the tile's action until it has been updated from the backend
                // (see in DashboardContent.view
                oTileInfo.oTile.tileIsBeingMoved = true;

                oResultPromise.done(this._handleAfterSortable(jQuery.proxy(function (sTileId, oTargetTile) {
                    var sTilePath,
                        aUsageAnalyticsCustomProps = [
                            srvc.getTileTitle(oTileInfo.oTile.object),
                            srvc.getGroupTitle(oSourceGroup.object),
                            srvc.getGroupTitle(oTargetGroup.object),
                            sTileId];

                    _logUsageAnalytics(analyticsConstants.MOVE_TILE, aUsageAnalyticsCustomProps);
                    sTilePath = this._getPathOfTile(sTileId);

                    // If we cannot find the tile, it might have been deleted -> Check!
                    if (sTilePath) {
                        // Update the model with the new tile object and new Id.
                        this.oModel.setProperty(sTilePath + "/object", oTargetTile);
                        this.oModel.setProperty(sTilePath + "/originalTileId", this.oPageBuilderService.getTileId(oTargetTile));

                        _checkRequestQueue();
                        // get the target-tile view and align the Model for consistency
                        this.oPageBuilderService.getTileView(oTargetTile).done(function (oView) {
                            // get the old view from tile's model
                            var oldViewContent = this.oModel.getProperty(sTilePath + "/content");

                            // first we set new view
                            if (sToItems === 'links') {
                                this._changeLinkScope(oView, bActionMode ? "Actions" : "Display");
                                this._attachLinkPressHandlers(oView);
                                this._addDraggableAttribute(oView);
                                this._handleTileAppearanceAnimation(oView);
                                oTileInfo.oTile.content = [oView];
                                this.oModel.setProperty(sTilePath, jQuery.extend({}, oTileInfo.oTile));
                                this.oModel.setProperty("/groups/" + oGroupInfo.newGroupIndex + "/" + sToItems, this.oModel.getProperty("/groups/" + oGroupInfo.newGroupIndex + "/" + sToItems));
                            } else {
                                this.oModel.setProperty(sTilePath + "/content", [oView]);
                            }

                            //now we destroy the old view
                            if (oldViewContent && oldViewContent[0]) {
                            var origOnAfterRendering = oView.onAfterRendering;
                            oView.onAfterRendering = function () {
                                origOnAfterRendering.apply(this);
                                oldViewContent[0].destroy();
                                oView.onAfterRendering = origOnAfterRendering;
                            };
                            }
                            // reset the move-scenario flag
                            this.oModel.setProperty(sTilePath + "/tileIsBeingMoved", false);
                            if (oData.callBack) {
                                oData.callBack(oView);
                            }
                        }.bind(this));
                    }
                }, this, sTileId)));

                oResultPromise.fail(this._handleAfterSortable(this._resetGroupsOnFailureHelper("fail_to_move_tile_msg")));
            }
            _addRequest(moveTile.bind(this));
        },

        // Adjust the moved-tile new index according to the visible+hidden tiles
        _adjustTileIndex: function (newLocationIndex, oTile, newGroup, sItems) {
            var visibleCounter = 0,
                bIsTileIncluded = false,
                i = 0;
            // In order to get the new index, count all tiles (visible+hidden) up to the new index received from the UI.
            for (i = 0; i < newGroup[sItems].length && visibleCounter < newLocationIndex; i++) {
                if (newGroup[sItems][i].isTileIntentSupported) {
                    if (newGroup[sItems][i] === oTile) {
                        bIsTileIncluded = true;
                    } else {
                        visibleCounter++;
                    }
                }
            }
            if (bIsTileIncluded) {
                return i - 1;
            }
            return i;
        },

        //TODO
        // temporary - should not be exposed
        getModel: function () {
            return this.oModel;
        },

        getDashboardView: function () {
            return this.oDashboardView;
        },
        setDashboardView: function (oDashboardView) {
            this.oDashboardView = oDashboardView;
            return this;
        },

        /**
         * Function to update the settings of the HomepageManager.
         * This allows us to adjust settings we might not know yet after the constructor was called.
         *
         * @param {Object} oSettings
         *      The new settings
         * @private
         */
        updateSettings: function (oSettings) {
            this.oModel = oSettings.model || this.oModel;
            this.oConfig = oSettings.config || this.oConfig;
            this.oRouter = oSettings.router || this.oRouter;
            this.oDashboardView = oSettings.view || this.oDashboardView;
        },

        _getIsAppBox: function (oCatalogTile) {
            if (!sap.ushell.Container){
                return false;
            }
            var srvc = this.oPageBuilderService,
                bIsAppBox = !!(srvc.getCatalogTileTargetURL(oCatalogTile) && (srvc.getCatalogTilePreviewTitle(oCatalogTile) || srvc.getCatalogTilePreviewSubtitle(oCatalogTile)));
            return bIsAppBox;

        },

        /**
         * Helper function to bind an error message to a reset-function, which reloads all groups
         * from a group array when called.
         * @param {string} sMsgId
         *      The id of the localized string.
         * @returns {Function}
         *      The reset function, which returns the dashboard into an consistent state.
         */
        _resetGroupsOnFailureHelper: function (sMsgId) {
            var that = this;
            return function (aGroups) {
                oMessagingHelper.showLocalizedError(sMsgId);
                _requestFailed();

                // Give the Toast a chance to be shown before the reload freezes the screen.
                window.setTimeout(function () {
                    //need to reset flag, because loading group will retrigger
                    that.bStartLoadRemainSegment = false;
                    that.loadGroupsFromArray(aGroups);
                });
            };
        },

        /**
         * Helper function to reset groups after a backend failure
         * @param {string} sMsgId id of the localized string
         * @param {Array} aParameters parameters array
         */
        _resetGroupsOnFailure: function (sMsgId, aParameters) {
            _requestFailed();
            oMessagingHelper.showLocalizedError(sMsgId, aParameters);
            this.loadPersonalizedGroups();
            this.oModel.updateBindings(true);
        },

        resetGroupsOnFailure: function () {
            this._resetGroupsOnFailure.apply(this, arguments);
        },

        _bindSegment: function (aGroups, segment) {
            var segIndex, oGrp, oSegGroup, groupIndex;

            for (segIndex = 0; segIndex < segment.length; segIndex++) {
                oSegGroup = segment[segIndex];
                groupIndex = oSegGroup.index;
                oGrp = aGroups[groupIndex];
                if (oGrp) {
                    oGrp.isRendered = true;
                    oGrp.tiles = oGrp.tiles.concat(oSegGroup.tiles);
                    oGrp.links = oGrp.links.concat(oSegGroup.links);
                }
            }

            return aGroups;
        },

        createGroupsModelFrame: function (aGroups, personalization) {
            var grpsIndex,
                aCloneGroups = [],
                oOrgGroup,
                fnCreateFlatGroupClone;

            fnCreateFlatGroupClone = function (oGroup) {
                var clnGroup = jQuery.extend({}, oGroup);
                clnGroup.tiles = [];
                clnGroup.pendingLinks = [];
                clnGroup.links = [];
                return clnGroup;
            };

            for (grpsIndex = 0; grpsIndex < aGroups.length; grpsIndex++) {
                oOrgGroup = aGroups[grpsIndex];
                aCloneGroups[grpsIndex] = fnCreateFlatGroupClone(oOrgGroup);
                //group variable setup.
                aCloneGroups[grpsIndex].isRendered = false;
                aCloneGroups[grpsIndex].visibilityModes = oUtils.calcVisibilityModes(oOrgGroup, personalization);
            }

            return aCloneGroups;
        },

        _splitGroups: function (aGroups, iFirstVisibleGroupIndex) {
            var grpsIndex,
                tempSegment = [],
                segmentHeight = 0,
                bIsTabsMode = this.oModel.getProperty("/homePageGroupDisplay") === 'tabs',
                iCurrentSegmentSize = 0,
                oGroup;

            var maxSegmentSize = 500;

            for (grpsIndex = 0; grpsIndex < aGroups.length; grpsIndex++) {
                oGroup = aGroups[grpsIndex];
                tempSegment.push(oGroup);

                if (!this.segmentsStore.length) {
                    // Calculate the group height (value in percentage) for the first visible segment only
                    segmentHeight += this.PagingManager.getGroupHeight(oGroup, iFirstVisibleGroupIndex === grpsIndex);
                } else {
                    // Calculate segment size based on the maximal number of tiles
                    iCurrentSegmentSize += oGroup.tiles.length + oGroup.links.length;
                }

                //There is smaller segment for the first visible group in tab mode. Also set flag for loading the views if there is no blind loading
                if (bIsTabsMode && !this.segmentsStore.length && segmentHeight > 0) {
                    tempSegment.loadTilesView = true;
                    this.segmentsStore.push(tempSegment);
                    tempSegment = [];
                    segmentHeight = 0;
                }
                // First segment - check visible height (value in percentage), other segments - check size (number of tiles)
                if (segmentHeight >= 1 || iCurrentSegmentSize >= maxSegmentSize) {
                    this.segmentsStore.push(tempSegment);
                    tempSegment = [];
                    segmentHeight = 0;
                    iCurrentSegmentSize = 0;
                }
            }

            if (tempSegment.length) {
                this.segmentsStore.push(tempSegment);
            }

        },

        /**
         * Bind tiles and links from the first segment of segmentStore into group model.
         *
         * @param {Object} [modelGroups]
         * The group model to process
         *
         * @returns {Object}
         * The group model with binded tiles and links from the first segment.
         * If segmentStore is empty, return the input model without changes.
         */
        _processSegment: function (modelGroups) {
            var groupSegment = this.segmentsStore.shift();

            if (!groupSegment) {
                return modelGroups;
            }

            if (this.isBlindLoading() === false) {
                //set loadTilesView for the first segment for tabs mode
                if (this.oModel.getProperty("/homePageGroupDisplay") !== 'tabs' || groupSegment.loadTilesView) {
                    this.getSegmentContentViews(groupSegment);
                }
            }
            modelGroups = this._bindSegment(modelGroups, groupSegment);
            return modelGroups;
        },

        getSegmentContentViews: function (groupSegment) {
            var nGroupSegmentIndex, nTilesIndex, oSegnmentGrp, oSegmentTile;

            for (nGroupSegmentIndex = 0; nGroupSegmentIndex < groupSegment.length; nGroupSegmentIndex++) {
                oSegnmentGrp = groupSegment[nGroupSegmentIndex];
                for (nTilesIndex = 0; nTilesIndex < oSegnmentGrp.tiles.length; nTilesIndex++) {
                    oSegmentTile = oSegnmentGrp.tiles[nTilesIndex];
                    if (oSegmentTile.isTileIntentSupported) {
                        this.getTileView(oSegmentTile);
                    }
                }

                for (nTilesIndex = 0; nTilesIndex < oSegnmentGrp.links.length; nTilesIndex++) {
                    oSegmentTile = oSegnmentGrp.links[nTilesIndex];
                    if (oSegmentTile.isTileIntentSupported) {
                        this.getTileView(oSegmentTile, oSegnmentGrp.index);
                    }
                }
            }
            this.bIsFirstSegmentViewLoaded = true;
        },

        getSegmentTabContentViews: function (sChannelId, sEventId, iProcessTileViewSegmentsForGroup) {
            var  nTilesIndex,  oSegmentTile,
                iSegmentsGroup = iProcessTileViewSegmentsForGroup.iSelectedGroup,
                oGroup;

                oGroup = this.oModel.getProperty("/groups/" + iSegmentsGroup);

                for (nTilesIndex = 0; nTilesIndex < oGroup.tiles.length; nTilesIndex++) {
                    oSegmentTile = oGroup.tiles[nTilesIndex];

                    if (oSegmentTile.isTileIntentSupported) {
                        this.getTileView(oSegmentTile);
                    }
                }

                for (nTilesIndex = 0; nTilesIndex < oGroup.links.length; nTilesIndex++) {
                    oSegmentTile = oGroup.links[nTilesIndex];
                    if (oSegmentTile.isTileIntentSupported) {
                        this.getTileView(oSegmentTile, iSegmentsGroup);
                    }
                }
        },

        /**
         * Prevent calling loadPersonalizedGroups while model is still loading.
         */
        _handleBookmarkModelUpdate: function () {
            this.bIsGroupsModelDirty = false;
            this.bGroupsModelLoadingInProcess = true;
            this.loadPersonalizedGroups();
        },

        _modelLoaded: function () {
            this.bGroupsModelLoadingInProcess = false;
            if (this.bIsGroupsModelDirty) {
                this._handleBookmarkModelUpdate();
            }
        },

        /**
         * Event handler for first segment is loaded.
         *
         * @private
         */
        handleFirstSegmentLoaded: function () {
            //Only groups from the first segment are completely loaded
            //Frames of the remain groups are copied to the model because:
            //1) To show the AnchorNavigationBar with all groups
            //2) Avoid rerendering of the DashboardContainer if there are > 2 segments (avoid "jumping" of the page)
            var aGroupModel = this.oModel.getProperty("/groups");

            if (this.aGroupsFrame) {
                Array.prototype.push.apply(aGroupModel, this.aGroupsFrame);
                this.aGroupsFrame = null;
            }
            this._initializeAnchorNavigationBar();
            //don't need to execute _processRemainingSegments, because segments was loaded when appfinder started
            if (!this.bStartLoadRemainSegment) {
                this._processRemainingSegments();
            }
        },

        /**
         * Initialize the AnchorNavigationBar so it can be rendered.
         *
         * @private
         */
        _initializeAnchorNavigationBar: function () {
            var oAnchorItemTemplate,
                oDashboardView = sap.ushell.components.getHomepageManager().getDashboardView();

            oAnchorItemTemplate = oDashboardView._getAnchorItemTemplate();
            this.oDashboardView.oAnchorNavigationBar.bindAggregation("groups", {
                path: "/groups",
                template: oAnchorItemTemplate
            });
        },

        /**
         * Manage that all tiles and links from segments will be bound to the group model.
         * The processing for each segment is executed by timeout. The timeout can be configured in sap-ushell-config. The default timeout - 100ms.
         * When all segments are handled, dashboard model finished loading event is published.
         *
         * @private
         */
        _processRemainingSegments: function () {
            var aUpdatedGroupModel;

            if (this.segmentsStore.length > 0) {
                window.setTimeout(function () {
                    aUpdatedGroupModel = this._processSegment(this.oModel.getProperty('/groups'));
                    this.oModel.setProperty('/groups', aUpdatedGroupModel);
                    this.bIsFirstSegment = false;
                    this._processRemainingSegments();
                }.bind(this), 0);
            } else {
                //publish event dashboard model finished loading.
                this.bIsGroupsModelLoading = false;
                this._updateModelWithTileView(0, 0);
                oUtils.handleTilesVisibility();
                sap.ui.getCore().getEventBus().publish("launchpad", "dashboardModelContentLoaded");
                //update pin in the AppFinder
                oEventHub.emit("updateGroups", Date.now());
            }
        },

        /**
         * Load all groups in the given array. The default group will be loaded first.
         * @param {Array} aGroups
         *      The array containing all groups (including the default group).
         */
        loadGroupsFromArray: function (aGroups) {

            if (this.bIsGroupsModelLoading) {
                jQuery.sap.log.info("Skip set the group model, because the group model is still loading");
                return;
            }

            // loadGroupsFromArray may be called more that once,
            // use a copy of aGroups because the array is modified below
            aGroups = (aGroups || []).slice();
            this.bIsGroupsModelLoading = true;

            var that = this;
            jQuery.sap.flpmeasure.end(0, "Service: Get Data for Dashboard");
            jQuery.sap.flpmeasure.start(0, "Process & render the first segment/tiles", 4);
            //For Performance debug only, enabled only when URL parameter sap-flp-perf activated
            jQuery.sap.measure.start("FLP:DashboardManager.loadGroupsFromArray", "loadGroupsFromArray","FLP");
            jQuery.sap.measure.start("FLP:DashboardManager.getDefaultGroup", "getDefaultGroup","FLP");
            this.oPageBuilderService.getDefaultGroup().done(function (oDefaultGroup) {
                jQuery.sap.measure.end("FLP:DashboardManager.getDefaultGroup");
                // In case the user has no groups
                if (aGroups.length == 0 && oDefaultGroup == undefined) {
                    return;
                }
                var i = 0,
                    lockedGroups = [],
                    buildSortedGroups,
                    indexOfDefaultGroup = aGroups.indexOf(oDefaultGroup),
                    numOfLockedGroup,
                    oNewGroupModel,
                    aNewGroups = [],
                    oGroup,
                    isLocked,
                    groupLength,
                    iSelectedGroup,
                    modelGroupsLength,
                    numberOfVisibleTiles = 0,
                    numberOfVisibleGroup = 0,
                    aFirstSegmentFrame,
                    iFirstSegmentSize,
                    iFirstVisibleGroup = null,
                    oDashboardView,
                    oDashboardGroupsBox,
                    aPreparedGroupModel = [];



                // remove default group from array
                aGroups.splice(indexOfDefaultGroup, 1);

                while (i < aGroups.length) {
                    oGroup = aGroups[i];
                    isLocked = that.oPageBuilderService.isGroupLocked(oGroup);

                    if (isLocked) {
                        lockedGroups.push(oGroup);
                        aGroups.splice(i, 1);
                    } else {
                        i++;
                    }
                }

                numOfLockedGroup = lockedGroups.length;
                // sort only locked groups
                if (!that.oModel.getProperty('/disableSortedLockedGroups')) {
                    lockedGroups.sort(function (x, y) {
                        var xTitle = that.oPageBuilderService.getGroupTitle(x).toLowerCase(),
                            yTitle = that.oPageBuilderService.getGroupTitle(y).toLowerCase();
                        return xTitle < yTitle ? -1 : 1;
                    });
                }
                // bring back default group to array
                buildSortedGroups = lockedGroups;
                buildSortedGroups.push(oDefaultGroup);
                buildSortedGroups.push.apply(buildSortedGroups, aGroups);
                aGroups = buildSortedGroups;
                groupLength = aGroups.length;
                modelGroupsLength = that.oModel.getProperty("/groups/length");

                for (i = groupLength; i < modelGroupsLength; ++i) {
                    oDestroyHelper.destroyFLPAggregationModel(that.oModel.getProperty("/groups/" + i));
                }
                that.oModel.setProperty("/iSelectedGroup", iSelectedGroup);//TODO: here iSelectedGroup is undefined. Do we need to set it???

                if (!that.PagingManager) {
                    var iAvailableWidth = jQuery("#dashboardGroups").width();
                    if (!iAvailableWidth) {
                        iAvailableWidth = window.innerWidth;
                        if (iAvailableWidth >= 1024 && that.oModel.getProperty('/enableNotificationsPreview')) {
                            iAvailableWidth -= 27 * 16; // Notifications preview takes 27 rem on wide screens
                        }
                    }

                    var iAvailableHeight = jQuery('#sapUshellDashboardPage-cont').height();
                    if (iAvailableHeight < 100) {
                        iAvailableHeight = window.innerHeight;
                    }
                    that.PagingManager = new PagingManager('dashboardPaging', {
                        supportedElements: {
                            tile : {className: 'sapUshellTile'},
                            link : {className: 'sapUshellLinkTile'}
                        },
                        containerHeight: iAvailableHeight,
                        containerWidth: iAvailableWidth
                    });
                }

                jQuery.sap.measure.start("FLP:DashboardManager._getGroupModel", "_getGroupModel","FLP");
                for (i = 0; i < groupLength; ++i) {
                    oNewGroupModel = that._getGroupModel(aGroups[i], i === numOfLockedGroup, i === groupLength - 1);
                    oNewGroupModel.index = i;
                    if (oNewGroupModel.isGroupVisible) {
                        //Hidden tilesAndLinks not calculate for the bIsScrollModeAccordingKPI
                        numberOfVisibleTiles += oNewGroupModel.tiles.length;
                    }
                    aNewGroups.push(oNewGroupModel);
                }
                // Check if blind loading should be activated
                that.bIsScrollModeAccordingKPI = numberOfVisibleTiles > that.iMinNumOfTilesForBlindLoading;
                jQuery.sap.measure.end("FLP:DashboardManager._getGroupModel");

                that.aGroupsFrame = that.createGroupsModelFrame(aNewGroups, that.oModel.getProperty("/personalization"));
                for (var i = 0; i < that.aGroupsFrame.length; i++) {
                    if (that.aGroupsFrame[i].isGroupVisible && that.aGroupsFrame[i].visibilityModes[0]) {
                        if (iFirstVisibleGroup === null) {
                            iFirstVisibleGroup = i;
                            that.aGroupsFrame[i]["isGroupSelected"] = true;
                            that.oModel.setProperty("/iSelectedGroup", i);
                        }
                        numberOfVisibleGroup++;
                        if (numberOfVisibleGroup > 1) {
                            that.aGroupsFrame[iFirstVisibleGroup]["showGroupHeader"] = false;
                            break;
                        }
                    }
                }

                that._splitGroups(aNewGroups, iFirstVisibleGroup);
                iFirstSegmentSize = that.segmentsStore[0].length;
                aFirstSegmentFrame = that.aGroupsFrame.splice(0, iFirstSegmentSize);

                jQuery.sap.measure.start("FLP:DashboardManager._processSegment", "_processSegment","FLP");
                //remain frames will be added to the model in handleFirstSegmentLoaded,
                //because we want to reduce the time of the loading of the first visible groups
                aPreparedGroupModel = that._processSegment(aFirstSegmentFrame);

                // save default group index
                aPreparedGroupModel["indexOfDefaultGroup"] = numOfLockedGroup;

                if (that.oModel.getProperty("/homePageGroupDisplay") === 'tabs') {
                    oDashboardView = that.getDashboardView();
                    if (oDashboardView) { // oDashboardView may be not yet available if the AppFinder opens at start
                        oDashboardGroupsBox = oDashboardView.oDashboardGroupsBox;
                        oDashboardGroupsBox.getBinding('groups').filter([oDashboardView.oFilterSelectedGroup]);
                    }
                }

                jQuery.sap.measure.end("FLP:DashboardManager._processSegment");

                that.oModel.setProperty('/groups', aPreparedGroupModel);
                that.aGroupModel = aPreparedGroupModel;
                //start to load other segments when first segment was completly loaded (placeholders and static views)
                if (that.oDashboardView) { //Homepage start
                    oEventHub.once("firstSegmentCompleteLoaded").do(that.handleFirstSegmentLoaded.bind(that));
                } else { //AppFinder started
                    /*
                    By default only visible groups loaded in the first segment. It is done in order to
                    improve the performance and show first groups eairlier as possible. But, AppFinder
                    is still bind to the group model and required all groups to correctly show the popover and
                    pin buttons are active.
                    For the cases different from homepage, we don't wait "firstSegmentCompleteLoaded" event and
                    start to load remain segment.
                    */
                    setTimeout(function () {
                        Array.prototype.push.apply(that.aGroupModel, that.aGroupsFrame);
                        that.aGroupsFrame = null;
                        that.bStartLoadRemainSegment = true;
                        that._processRemainingSegments();
                    }, 0);
                }

                //Tiles loaded with views when there is no blindloading
                //In this case the first segment is loaded after setting the model
                if (that.bIsFirstSegmentViewLoaded) {
                    oEventHub.emit("firstSegmentCompleteLoaded", true);
                }

                jQuery.sap.measure.end("FLP:DashboardManager.loadGroupsFromArray");
                jQuery.sap.flpmeasure.end(0, "Process & render the first segment/tiles");
            }).fail(that._resetGroupsOnFailureHelper("fail_to_get_default_group_msg"));
        },

        getPreparedGroupModel : function () {
            return this.aGroupModel;
        },

        /**
         * Load all tiles in a group and add the group to the internal model.
         * @param nIndex
         *      The index at which the group should be added. 0 is reserved for the default group.
         * @param oGroup
         *      The group as it is returned by the UI2 services.
         */
        _loadGroup: function (nIndex, oGroup) {
            var that = this,
                sGroupPath = "/groups/" + nIndex,
                defaultGroupIndex = that.oModel.getProperty("/groups/indexOfDefaultGroup"),
                bIsLast = that.oModel.getProperty(sGroupPath).isLastGroup,
                sOldGroupId,
                oNewGroupModel;

            oDestroyHelper.destroyFLPAggregationModel(that.oModel.getProperty(sGroupPath));
            // Set group on model
            sOldGroupId = this.oModel.getProperty(sGroupPath + "/groupId");
            oNewGroupModel = this._getGroupModel(oGroup, nIndex === defaultGroupIndex, bIsLast, undefined);

            // If the group already exists, keep the id. The backend-handlers relay on the id staying the same.
            if (sOldGroupId) {
                oNewGroupModel.groupId = sOldGroupId;
            }

            oNewGroupModel.index = nIndex;
            oNewGroupModel.isRendered = true;
            this.oModel.setProperty(sGroupPath, oNewGroupModel);
        },

        _getGroupModel: function (oGroup, bDefault, bLast, oData) {
            var srvc = this.oPageBuilderService,
                aGroupTiles = (oGroup && srvc.getGroupTiles(oGroup)) || [],
                aModelTiles = [],
                aModelLinks = [],
                i,
                isSortable,
                oModel = this.getModel();
            isSortable = oModel.getProperty("/personalization");

            // in a new group scenario we create the group as null at first.
            var isGroupLocked = oGroup && srvc.isGroupLocked(oGroup) ? true : false;

            for (i = 0; i < aGroupTiles.length; ++i) {
                var oTile = aGroupTiles[i],
                    sTileType = srvc.getTileType(oTile).toLowerCase(); //lowercase to make comparison easier
                if (sTileType === "tile") {
                    aModelTiles.push(this._getTileModel(aGroupTiles[i], isGroupLocked, sTileType));
                } else if (sTileType === "link") {
                    aModelLinks.push(this._getTileModel(aGroupTiles[i], isGroupLocked, sTileType));
                } else {
                    jQuery.sap.log.error("Unknown tile type: '" + sTileType + "'",
                        undefined,
                        "sap.ushell.components.HomepageManager"
                    );
                }
            }

            return {
                title: (bDefault && oMessagingHelper.getLocalizedText("my_group")) ||
                (oGroup && srvc.getGroupTitle(oGroup)) || (oData && oData.title) ||
                "",
                object: oGroup,
                groupId: jQuery.sap.uid(),
                links: aModelLinks,
                pendingLinks: [],
                tiles: aModelTiles,
                isDefaultGroup: !!bDefault,
                editMode: !oGroup,
                isGroupLocked: isGroupLocked,
                visibilityModes: [true, true],
                removable: !oGroup || srvc.isGroupRemovable(oGroup),
                sortable: isSortable,
                isGroupVisible: !oGroup || srvc.isGroupVisible(oGroup),
                isEnabled: !bDefault, //Currently only default groups is considered as locked
                isLastGroup: bLast || false,
                isRendered: !!(oData && oData.isRendered),
                isGroupSelected: false
            };
        },

        _hasPendingLinks: function (aModelLinks){
            for (var i = 0; i < aModelLinks.length; i++){
                if (aModelLinks[i].content[0] === undefined){
                    return true;
                }
            }
            return false;
        },

        _addModelToTileViewUpdateQueue: function (sTileUUID, oTileView) {
            //add the tile view to the update queue
            this.tileViewUpdateQueue.push({uuid: sTileUUID, view: oTileView});
        },

        _updateModelWithTileView: function (startGroup, startTile) {
            var that = this;

            /*
             in order to avoid many updates to the model we wait to allow
             other tile update to accumulate in the queue.
             therefore we clear the previous call to update the model
             and create a new one
             */
            if (this.tileViewUpdateTimeoutID) {
                clearTimeout(this.tileViewUpdateTimeoutID);
            }
            this.tileViewUpdateTimeoutID = window.setTimeout(function () {
                that.tileViewUpdateTimeoutID = undefined;
                /*
                 we wait with the update till the personalization operation is done
                 to avoid the rendering of the tiles during D&D operation
                 */
                that.oSortableDeferred.done(function () {
                    that._updateModelWithTilesViews(startGroup, startTile);
                });
            }, 50);
        },


        _updateGroupModelWithTilesViews: function (aTiles, startTile, handledUpdatesIndex, isLink){
            var oTileModel,
                oUpdatedTile,
                sSize,
                bLong,
                stTile = startTile || 0;

            for (var j = stTile; j < aTiles.length; j = j + 1) {
                //group tiles loop - get the tile model
                oTileModel = aTiles[j];
                for (var q = 0; q < this.tileViewUpdateQueue.length; q++) {
                    //updated tiles view queue loop - check if the current tile was updated
                    oUpdatedTile = this.tileViewUpdateQueue[q];
                    if (oTileModel.uuid == oUpdatedTile.uuid) {
                        //mark tileViewUpdate index for removal oUpdatedTile from tileViewUpdateQueue.
                        handledUpdatesIndex.push(q);
                        if (oUpdatedTile.view) {
                            /*
                             if view is provided then we destroy the current content
                             (TileState control) and set the tile view
                             In case of link we do not have a loading link therefor we don't destroy it
                             */
                            if (isLink){

                                oTileModel.content = [oUpdatedTile.view];
                            } else {
                                oTileModel.content[0].destroy();
                                oTileModel.content = [oUpdatedTile.view];
                            }
                            this.oDashboardLoadingManager.setTileResolved(oTileModel);

                            /*
                             in some cases tile size can be different then the initial value
                             therefore we read and set the size again
                             */
                            sSize = this.oPageBuilderService.getTileSize(oTileModel.object);
                            bLong = ((sSize !== null) && (sSize === "1x2")) || false;
                            if (oTileModel['long'] !== bLong) {
                                oTileModel['long'] = bLong;
                            }
                        } else {
                            //some error on getTileView, therefore we set the state to 'Failed'
                            oTileModel.content[0].setState("Failed");
                        }
                        break;
                    }
                }
            }
        },

        _updateModelWithTilesViews: function (startGroup, startTile) {
            var aGroups = this.oModel.getProperty("/groups"),
                stGroup = startGroup || 0,
                handledUpdatesIndex = [];

            if (!aGroups || this.tileViewUpdateQueue.length === 0) {
                return;
            }

            /*
             go over the tiles in the model and search for tiles to update.
             tiles are identified using uuid
             */
            for (var i = stGroup; i < aGroups.length; i = i + 1) {
                //group loop - get the groups tiles
                this._updateGroupModelWithTilesViews(aGroups[i].tiles, startTile, handledUpdatesIndex);
                if (aGroups[i].links){
                    this._updateGroupModelWithTilesViews(aGroups[i].links, startTile, handledUpdatesIndex, true);
                    if (aGroups[i].pendingLinks.length > 0){
                        if (!aGroups[i].links) {
                            aGroups[i].links = [];
                        }
                        aGroups[i].links = aGroups[i].links.concat(aGroups[i].pendingLinks);
                        aGroups[i].pendingLinks = [];
                    }
                }
            }

            //clear the handled updates from the tempTileViewUpdateQueue and set the model
            var tempTileViewUpdateQueue = [], tileViewUpdateQueueIndex;
            for (tileViewUpdateQueueIndex = 0; tileViewUpdateQueueIndex < this.tileViewUpdateQueue.length; tileViewUpdateQueueIndex++) {
                if (handledUpdatesIndex.indexOf(tileViewUpdateQueueIndex) === -1) {
                    tempTileViewUpdateQueue.push( this.tileViewUpdateQueue[tileViewUpdateQueueIndex]);
                }
            }
            this.tileViewUpdateQueue = tempTileViewUpdateQueue;

            this.oModel.setProperty("/groups", aGroups);
        },

        getModelTileById: function (sId, sItems) {
            var aGroups = this.oModel.getProperty('/groups'),
                oModelTile,
                bFound = false;
            aGroups.every(function (oGroup) {
                oGroup[sItems].every(function (oTile) {
                    if (oTile.uuid === sId || oTile.originalTileId === sId) {
                        oModelTile = oTile;
                        bFound = true;
                    }
                    return !bFound;
                });
                return !bFound;
            });
            return oModelTile;
        },

        _addDraggableAttribute: function (oView) {
            if (this.isIeHtml5DnD()) { //should be sap.ushell.Container.getService("LaunchPage").isLinkPersonalizationSupported(oTile)
                oView.addEventDelegate({
                   onAfterRendering: function () {
                       this.$().attr("draggable","true");
                   }.bind(oView)
                });
            }
        },

        _attachLinkPressHandlers: function (oView) {
            var oEventBus = sap.ui.getCore().getEventBus(),
                oTileView = oView.attachPress ? oView : oView.getContent()[0]; // a hack to support demoContent
            oTileView.attachPress(function (oEvent) {
                var bTileBeingMoved = oView.getBindingContext().getObject().tileIsBeingMoved;
                if (!bTileBeingMoved && this.getScope && this.getScope() === "Actions") {
                    switch (oEvent.getParameters().action) {
                        case "Press":
                            var sState = oView.getState ? oView.getState() : "";
                            if (sState !== "Failed") {
                                sap.ushell.components.homepage.ActionMode._openActionsMenu(oEvent, oView);
                            }
                            break;
                        case "Remove":
                            var tileUuid = oView.getBindingContext().getObject().uuid;
                            oEventBus.publish("launchpad", "deleteTile", {tileId: tileUuid, items: 'links'});
                            break;
                    }
                } else {
                    oEventBus.publish("launchpad", "dashboardTileLinkClick");
                }
            });
        },

        handleDisplayModeChange: function (sNewDisplayModel) {
            this.oModel.setProperty("/homePageGroupDisplay", sNewDisplayModel);
            switch (sNewDisplayModel) {
                case "scroll":
                    this._handleDisplayModeChangeToScroll();
                    break;
                case "tabs":
                    this._handleDisplayModeChangeToTabs();
                    break;
                //no default
            }
        },

        _handleDisplayModeChangeToTabs: function () {
            var iSelectedGroup = this.oModel.getProperty("/iSelectedGroup"),
                aGroups = this.oModel.getProperty("/groups");
            if (aGroups.length > 0) {
                //update selected group based on selected anchor item
                for (var i = 0; i < aGroups.length; i++) {
                    this.oModel.setProperty("/groups/" + i + "/isGroupSelected", false);
                }

                this.oModel.setProperty("/groups/" + iSelectedGroup + "/isGroupSelected", true);
                sap.ui.getCore().getEventBus().publish("launchpad", "beforeAndAfterContentRemoved");
            }
        },

        _handleDisplayModeChangeToScroll: function () {
            if (this.isBlindLoading()) {
                return;
            }

            var aGroups = this.oModel.getProperty("/groups"),
                oGroup,
                aTiles,
                oTile,
                aLinks = [],
                i,j;

            for (i = 0; i < aGroups.length; i++) {
                oGroup = aGroups[i];
                aTiles = oGroup.tiles || [];
                for (j = 0; j < aTiles.length; j++) {
                    oTile = aTiles[j];
                    if (oTile.content.length === 0) {
                        this.getTileView(oTile, i);
                    }
                }
                aLinks = oGroup.links || [];
                //need to update all link views
                for (j = 0; j < aLinks.length; j++) {
                    this.getTileView(aLinks[j], i);
                }
            }
            this.oModel.refresh(false);

            var iSelectedGroupIndex = this.oModel.getProperty("/iSelectedGroup");

            if (iSelectedGroupIndex) {
                setTimeout(function () {
                    sap.ui.getCore().getEventBus().publish("launchpad", "scrollToGroup", {
                        groupId: aGroups[iSelectedGroupIndex].groupId
                    });
                }, 100);
            }
        },

        getTileViewsFromArray: function (aRequestTileViews) {
            var that = this;

            if (aRequestTileViews.length === 0) {
                return;
            }
            aRequestTileViews.forEach( function (oRequestTileView) {
                that.getTileView(oRequestTileView.oTile, oRequestTileView.iGroup);
            });
            //trigger to refresh binding.
            //It is skipped for standart tiles in getTileView and done once here (performance reason)
            //Refreshing for custom tiles is in getTileView after promise is resolved
            this.oModel.refresh(false);
            if (this.bIsFirstSegmentViewLoaded === false) {
                this.bIsFirstSegmentViewLoaded = true;
                oEventHub.emit("firstSegmentCompleteLoaded", true);
            }

        },

        getTileView: function (oTile, iGroup) {
            var oDfd,
                that = this,
                srvc = this.oPageBuilderService,
                sMode,
                aGroups,
                oGroupLinks,
                fUpdateModelWithView = this._addModelToTileViewUpdateQueue,
                oTileView,
                bNeedRefreshLinks = false,
                sTileUUID = oTile.uuid,
                bSkipModelUpdate = false;

            var fh = jQuery.sap.flpmeasure.startFunc(0, "Service + model binding and rendering for all tile-Views", 5, "getTileView", oTile.object);
            if (that.oDashboardLoadingManager.isTileViewRequestIssued(oTile)) {
                //no need to get tile view, it was alreay issued.
                return;
            }
            this.oDashboardLoadingManager.setTileInProgress(oTile);
            srvc.setTileVisible(oTile.object, false);
            oDfd = srvc.getTileView(oTile.object);

            //Deffered is already resolved for standart tile
            //The goal is to update model for standart tiles at one place in order to triger invalidation once
            //Dynamic tiles will update model when deffered will be resolved
            if (oDfd.state() === "resolved") {
                bSkipModelUpdate = true;
            }

            /*
             register done and fail handlers for the getTileView API.
             */
            oDfd.done(function (oView) {
                //setting the value of the target when the view is valid and make sure it is not custom tile
                if (oView.oController && oView.oController.navigationTargetUrl && !oTile.isCustomTile) {
                    oTile.target = oView.oController.navigationTargetUrl;
                }
                oTileView = oView;
                //in CDM content, the tils view should have this function
                if (oTileView.getComponentInstance){
                    jQuery.sap.measure.average("FLP:getComponentInstance", "get info for navMode", "FLP1");
                    var oCompData = oTileView.getComponentInstance().getComponentData();
                    if (oCompData && oCompData.properties){
                        oTile.navigationMode = oCompData.properties.navigationMode;
                    }
                    jQuery.sap.measure.end("FLP:getComponentInstance");
                }
                that.oDashboardLoadingManager.setTileResolved(oTile);
                sMode = oView.getMode ? oView.getMode() : "ContentMode";
                if (that.bLinkPersonalizationSupported && sMode === "LineMode") { //If the tileType is link and the personalization is supported by the platform, the the link must support personalization
                    that._attachLinkPressHandlers(oTileView);
                    that._addDraggableAttribute(oTileView);

                    if (iGroup != undefined) {
                        aGroups = that.oModel.getProperty("/groups");

                        if (aGroups[iGroup]) {
                            oTile.content = [oTileView];
                            oGroupLinks = that.oModel.getProperty("/groups/" + iGroup + "/links");
                            that.oModel.setProperty("/groups/" + iGroup + "/links", []);
                            that.oModel.setProperty("/groups/" + iGroup + "/links", oGroupLinks);
                        }
                    }
                } else if (that.isBlindLoading()) {
                    if (oTile.content.length > 0) {
                        oTile.content[0].destroy();
                    }
                    oTile.content = [oTileView];
                    if (iGroup != undefined && !bSkipModelUpdate){
                        that.oModel.refresh(false);
                    }
                }

                if (that.isBlindLoading()) {
                    /*
                     in some cases tile size can be different then the initial value
                     therefore we read and set the size again
                     */
                    var sSize = that.oPageBuilderService.getTileSize(oTile.object);
                    var bLong = sSize === "1x2";
                    if (oTile['long'] !== bLong) {
                        oTile['long'] = bLong;
                    }
                } else if (sMode === "LineMode") {
                    oTile.content = [oTileView];

                    if  (bNeedRefreshLinks) {
                        oGroupLinks  =  that.oModel.getProperty("/groups/"  + iGroup +  "/links");
                        that.oModel.setProperty("/groups/"  + iGroup +  "/links", []);
                        that.oModel.setProperty("/groups/"  + iGroup +  "/links",  oGroupLinks);
                    }
                } else if (oTile.content.length === 0) {
                    oTile.content = [oTileView];
                } else {
                    fUpdateModelWithView.apply(that, [sTileUUID, oTileView]);
                    that._updateModelWithTileView(0, 0);
                }

                jQuery.sap.flpmeasure.endFunc(0, "Service + model binding and rendering for all tile-Views", fh);
            });
            oDfd.fail(function () {
                if (that.sTileType === "link" && that.bLinkPersonalizationSupported) {
                    // In case call is synchronise we set the view with 'TileState' control with 'Failed' status
                    var vSubHeader = that.oPageBuilderService.getCatalogTilePreviewSubtitle(oTile.object);
                    var vHeader = that.oPageBuilderService.getCatalogTilePreviewTitle(oTile.object);

                    if (!vHeader && !vSubHeader) {
                        vHeader = oResources.i18n.getText("cannotLoadLinkInformation");
                    }
                    oTileView =  new GenericTile({
                        mode: "LineMode",
                        state: "Failed",
                        header: vHeader,
                        subheader: vSubHeader
                    });
                    that._attachLinkPressHandlers(oTileView);
                } else {
                    oTileView = new TileState({state: "Failed"});
                }
                oTile.content = [oTileView];
            });

            if (!oTileView) {
                if (srvc.getTileType(oTile.object) === "link") {
                    bNeedRefreshLinks = true;
                    oTileView = new GenericTile({
                        mode: "LineMode"
                    });
                } else {
                    oTileView = new TileState();
                }
                oTile.content = [oTileView];
            }
        },

        _getTileModel: function (oTile, isGroupLocked, sTileType) {
            var srvc = this.oPageBuilderService,
                sTileUUID = jQuery.sap.uid(),
                oTileModelData;

            this.sTileType = sTileType;

            var sSize = srvc.getTileSize(oTile);

            var aLinks = [];
            if (sTileType === "link") {
                aLinks = [new GenericTile({
                    mode: "LineMode"
                })];
            }

            oTileModelData = {
                "isCustomTile" : !this._getIsAppBox(oTile),
                "object": oTile,
                "originalTileId": srvc.getTileId(oTile),
                "uuid": sTileUUID,
                "tileCatalogId": encodeURIComponent(srvc.getCatalogTileId(oTile)),
                "content": aLinks,
                "long": sSize === "1x2",
                "target": srvc.getTileTarget(oTile) || "", // 'target' will be defined (and get a value) later on after the tile will be valid
                "debugInfo": srvc.getTileDebugInfo(oTile),
                "isTileIntentSupported": srvc.isTileIntentSupported(oTile),
                "rgba": "",
                "isLocked": isGroupLocked,
                "showActionsIcon": this.oModel.getProperty("/enableTileActionsIcon") || false,
                "navigationMode": this.navigationMode
            };

            return oTileModelData;
        },

        isIeHtml5DnD: function () {
            return (Device.browser.msie || Device.browser.edge) && (Device.system.combi || Device.system.tablet);
        },

        /*
         * Load all user groups from the backend. (Triggered on initial page load.)
         */
        loadPersonalizedGroups: function () {
            jQuery.sap.flpmeasure.start(0, "Service: Get Data for Dashboard", 4);
            jQuery.sap.measure.start("FLP:DashboardManager.loadPersonalizedGroups", "loadPersonalizedGroups", "FLP");

            return this.oPageBuilderService.getGroups()
                        .done(function (aGroups) {
                            jQuery.sap.measure.end("FLP:DashboardManager.loadPersonalizedGroups");
                            this.loadGroupsFromArray(aGroups);
                        }.bind(this))
                        .fail(function () {
                            oMessagingHelper.showLocalizedError("fail_to_load_groups_msg");
                        });
        }
    });


	return HomepageManager;

});
