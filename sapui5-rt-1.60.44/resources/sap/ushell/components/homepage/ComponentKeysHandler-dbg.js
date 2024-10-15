// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

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