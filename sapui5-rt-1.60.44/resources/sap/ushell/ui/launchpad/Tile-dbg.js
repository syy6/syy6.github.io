/*!
 * Copyright (c) 2009-2017 SAP SE, All Rights Reserved
 */

// Provides control sap.ushell.ui.launchpad.Tile.
sap.ui.define(['jquery.sap.global', 'sap/ui/base/ManagedObject', 'sap/ui/core/Control', 'sap/ushell/library', 'sap/ui/core/Icon', 'sap/ushell/resources', 'sap/ushell/ui/launchpad/AccessibilityCustomData', './TileRenderer'], function (jQuery, ManagedObject, Control, library, Icon, resources, AccessibilityCustomData/*, TileRenderer */) {
    "use strict";

/**
 * Constructor for a new ui/launchpad/Tile.
 *
 * @param {string} [sId] id for the new control, generated automatically if no id is given
 * @param {object} [mSettings] initial settings for the new control
 *
 * @class
 * A tile to be displayed in the tile container. This tile acts as container for specialized tile implementations.
 * @extends sap.ui.core.Control
 *
 * @constructor
 * @public
 * @name sap.ushell.ui.launchpad.Tile
 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
 */
var Tile = Control.extend("sap.ushell.ui.launchpad.Tile", /** @lends sap.ushell.ui.launchpad.Tile.prototype */ { metadata : {

	library : "sap.ushell",
	properties : {

		/**
		 * Whether tile spans more than one column
		 */
		long : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		uuid : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		tileCatalogId : {type : "string", group : "Misc", defaultValue : null},

        /**
        */
        isCustomTile : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 * Hyperlink target
		 */
		target : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		visible : {type : "boolean", group : "Misc", defaultValue : true},

		/**
		 * Technical information about the tile which is logged when the tile is clicked
		 */
		debugInfo : {type : "string", group : "Misc", defaultValue : null},

		/**
		 * the RGBA value of the tile
		 */
		rgba : {type : "string", group : "Misc", defaultValue : null},

		/**
		 */
		animationRendered : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		isLocked : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		showActionsIcon : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		tileActionModeActive : {type : "boolean", group : "Misc", defaultValue : false},

		/**
		 */
		ieHtml5DnD : {type : "boolean", group : "Misc", defaultValue : false},

        /**
         */
        navigationMode : {type : "string", group : "Misc", defaultValue : null},

		/**
		 * In case of drag&drop in TabBar, this flag indicated that the tile is the one that was dragged between groups
		 */
		isDraggedInTabBarToSourceGroup : {type : "boolean", group : "Misc", defaultValue : false}
	},
	aggregations : {

		/**
		 */
		tileViews : {type : "sap.ui.core.Control", multiple : true, singularName : "tileView"},

		/**
		 */
		pinButton : {type : "sap.ui.core.Control", multiple : true, singularName : "pinButton"}
	},
	events : {

		/**
		 */
		press : {},

		/**
		 */
		coverDivPress : {},

		/**
		 */
		afterRendering : {},

		/**
		 */
		showActions : {},

		/**
		 */
		deletePress : {}
	}
}});

/**
 * @name sap.ushell.ui.launchpad.Tile
 *
 * @private
 */
    /*jslint nomen: true*/

    //icon will be created only in action mode otherwise undefined will be returned
    Tile.prototype.getActionSheetIcon = function () {
        if (!this.getTileActionModeActive()) {
            return undefined;
        }
        if (!this.actionSheetIcon) {
            this.actionSheetIcon = new Icon({src: "sap-icon://overflow"});
            this.actionSheetIcon.setTooltip(resources.i18n.getText("configuration.category.tile_actions"));
            this.actionSheetIcon.addStyleClass('sapUshellTileActionIconDivBottomInner');
        }
        return this.actionSheetIcon;
    };

    Tile.prototype.ontap = function (event, ui) {
        // dump debug info when tile is clicked
        jQuery.sap.log.info(
            "Tile clicked:",
            this.getDebugInfo(),
            "sap.ushell.ui.launchpad.Tile"
        );

        this.firePress();
    };

    Tile.prototype.destroy = function (bSuppressInvalidate) {
        this.destroyTileViews();
        Control.prototype.destroy.call(this, bSuppressInvalidate);
    };

    Tile.prototype.addTileView = function (oObject, bSuppressInvalidate) {
        // Workaround for a problem in addAggregation. If a child is added to its current parent again,
        // it is actually removed from the aggregation. Prevent this by removing it from its parent first.
        oObject.setParent(null);
        ManagedObject.prototype.addAggregation.call(this, "tileViews", oObject, bSuppressInvalidate);
    };

    Tile.prototype.destroyTileViews = function () {
        // Don't delete the tileViews when destroying the aggregation. They are stored in the model and must be handled manually.
        if (this.mAggregations["tileViews"]) {
            this.mAggregations["tileViews"].length = 0;
        }
    };

    Tile.prototype.onBeforeRendering = function () {
        var oDomRef = this.getDomRef();
        if (!oDomRef) {
            return;
        }

        var oInnerLink = oDomRef.querySelector("a.sapUshellTileInner");

        if (oInnerLink) {
            oInnerLink.onclick = null;
        }
    };

    /**
     * See Tile.prototype.onBeforeRendering.
     * The tile (which visibility = false) is removed from the group's aggregation
     */
    Tile.prototype.onAfterRendering = function () {
        if (this.getIsDraggedInTabBarToSourceGroup() === true) {
            var oTileContainer = this.getParent();
            oTileContainer.removeAggregation("tiles", this, false);
        }

        this._redrawRGBA();
        this._disableInnerLink();

        this.fireAfterRendering();
    };

    /**
     * Disables the inner link's press event by assigning an event handler to its 'onclick' event.
     *
     * @private
     */
    Tile.prototype._disableInnerLink = function () {
        var oDomRef = this.getDomRef();
        var oInnerLink = oDomRef.querySelector("a.sapUshellTileInner");

        if (oInnerLink) {
            oInnerLink.onclick = function (event) {
                // Prevent default in order to not trigger navigation twice.
                // This could happen on e.g. iPads that triggered both, the anchor's navigation
                // and the programmatic navigation via window.open, resulting in two tabs being opened.
                event.preventDefault();
            };
        }
    };

    Tile.prototype._launchTileViaKeyboard = function (oEvent) {
        if (this.getTileActionModeActive()) {
            // If in ActionMode - invoke the cover DIV press event
            this.fireCoverDivPress({
                id : this.getId()
            });
        } else if (oEvent.target.tagName !== "BUTTON") {
            var oTileUIWrapper = this.getTileViews()[0],
                bPressHandled = false,
                oComponent,
                oTile;

            if (oTileUIWrapper.firePress) {
                oTileUIWrapper.firePress({id: this.getId()});
                //If oTileUIWrapper is a View or a Component.
            } else if (oTileUIWrapper.getComponentInstance){
                oComponent = oTileUIWrapper.getComponentInstance();
                if (oComponent._oController && oComponent._oController.oView.getContent()){
                    oTile = oComponent._oController.oView.getContent()[0];
                    if (oTile && oTile.firePress){
                        oTile.firePress({id: this.getId()});
                    }
                }
            }else {
                while (oTileUIWrapper.getContent && !bPressHandled) {
                    //Limitation: since there's no way to know which of the views is the currently presented one, we assume it's the first one.
                    oTileUIWrapper = oTileUIWrapper.getContent()[0];
                    if (oTileUIWrapper.firePress) {
                        oTileUIWrapper.firePress({id: this.getId()});
                        bPressHandled = true;
                    }
                }
            }
        }
    };

    Tile.prototype.onsapenter = function (oEvent) {
        this._launchTileViaKeyboard(oEvent);
        if (!this.getTileActionModeActive()) {
            this._announceLoadingApplication();
        }
    };

    Tile.prototype.onsapspace = function (oEvent) {
        this._launchTileViaKeyboard(oEvent);
        if (!this.getTileActionModeActive()) {
            this._announceLoadingApplication();
        }
    };

    Tile.prototype.onfocusin = function (oEvent) {
        var sClasses = this.getDomRef().getAttribute("class"),
            bPlusTile;

        bPlusTile = sClasses ? sClasses.indexOf("sapUshellPlusTile") !== -1 : false;
        if (!bPlusTile) {
           var jqPrevSiblingList = jQuery(this.getDomRef()).prevUntil("h3"),
               elCatalogGroup,
               sCatalogGroupId = "",
               sTileInnerId,
               sNavigationModeDivId,
               temp;
           //get the CatalogGroupId of this tile in catalog (in dashboard we will get empty string)
           if (jqPrevSiblingList.length > 0) {
               elCatalogGroup = jqPrevSiblingList[jqPrevSiblingList.length - 1].previousSibling;
           } else {
               elCatalogGroup = this.getDomRef().previousSibling;
           }
           if (elCatalogGroup) {
               sCatalogGroupId = elCatalogGroup.getAttribute('id');
           }
           //get the inner tile id (relevant to catalog and dashboard)
           temp = this.getDomRef().querySelector(".sapUshellTileInner");
           var deleteIcon = this.getDomRef().querySelector(".sapUshellTileDeleteClickArea .sapUiIcon");
           var deleteIconId = deleteIcon ? deleteIcon.id : "";
           if (temp && temp.children && temp.children[0]) {
               var sAccessibilityTileTextId = (sCatalogGroupId && sCatalogGroupId !== "") ? "sapUshellCatalogAccessibilityTileText" : "sapUshellDashboardAccessibilityTileText";
               sTileInnerId = temp.children[0].getAttribute('id');
               var aLabelledbyArray = [sAccessibilityTileTextId, sTileInnerId, deleteIconId, sCatalogGroupId];

               //create and add the navigationMode as a new div element so it will be read by the screen reader for ACC-257
               //create the navigationMode div, if not already created, and add it to the "aria-labelledby" attribute
               sNavigationModeDivId = this.getId() + "_navigationMode";
               var oNavigationModeDiv = document.getElementById(sNavigationModeDivId);
               if (oNavigationModeDiv == null){
                   //check if this tile has the navigationMode property
                   var sNavigationMode = this.getNavigationMode();
                   if (sNavigationMode){
                       //create the div and set id
                       oNavigationModeDiv = document.createElement("div");
                       //set id and aria-label attributes to the new div
                       var id = document.createAttribute("id");
                       id.value = sNavigationModeDivId;
                       oNavigationModeDiv.setAttributeNode(id);
                       //set it as display none so it will not affect the DOM
                       oNavigationModeDiv.style.display = "none";
                       var sNavigationModeTranslatedText = resources.i18n.getText(sNavigationMode + "NavigationMode");
                       if (sNavigationModeTranslatedText){
                           oNavigationModeDiv.innerHTML = sNavigationModeTranslatedText;
                       } else {
                           jQuery.sap.log.warning("could not get the navigation mode text of this tile to be added on the aria-labelledBby attribute");
                       }
                       //add it to the DOM
                       temp.appendChild(oNavigationModeDiv);
                       //the navigation mode is read before the tile content and after the type
                       aLabelledbyArray.splice(1, 0, sNavigationModeDivId);
                   }
               } else {
                   //the navigation mode div was already created
                   aLabelledbyArray.splice(1, 0, sNavigationModeDivId);
               }
               this.getDomRef().setAttribute("aria-labelledby", aLabelledbyArray.join(" "));
           }
        }
    };

    Tile.prototype.onclick = function (oEvent) {
        // if tile is in Edit Mode (Action Mode)
        if (this.getTileActionModeActive()) {
            // in case we clicked on the Delete-Action Click-Area trigger delete
            var srcElement = oEvent.originalEvent.srcElement;
            if (jQuery(srcElement).closest('.sapUshellTileDeleteClickArea').length > 0) {
                this.fireDeletePress();
            } else {
                // otherwise click made on cover-div
                this.fireCoverDivPress({
                    id: this.getId()
                });
            }
        } else {
            this._announceLoadingApplication();
        }
    };

    Tile.prototype._announceLoadingApplication = function () {
        var oAccessibilityHelperAppInfo = document.getElementById("sapUshellLoadingAccessibilityHelper-appInfo"),
            sLoadingString = resources.i18n.getText("screenReaderNavigationLoading");

        if (oAccessibilityHelperAppInfo) {
            oAccessibilityHelperAppInfo.setAttribute("role","alert");
            oAccessibilityHelperAppInfo.innerHTML = sLoadingString;

            setTimeout(function () {
                oAccessibilityHelperAppInfo.removeAttribute("role");//switch because rude will repeat the text "loading application" several times
                oAccessibilityHelperAppInfo.innerHTML = ""; //set the text to "" so it will be announce in the next navigation
            },0);
        }
    };


    Tile.prototype._initDeleteAction = function () {
        var that = this; // the tile control
        if (!this.deleteIcon) {
            this.deleteIcon = new Icon({
                src: "sap-icon://decline",
                tooltip: resources.i18n.getText("removeButtonTItle")
            });
            this.deleteIcon.addEventDelegate({
                onclick : function (oEvent) {
                    that.fireDeletePress();
                    oEvent.stopPropagation();
                }
            });
            this.deleteIcon.addStyleClass("sapUshellTileDeleteIconInnerClass");
            this.deleteIcon.addCustomData(new AccessibilityCustomData({
                key: "aria-label",
                value:  resources.i18n.getText("removeButtonLabel"),
                writeToDom: true
            }));
        }
        return this.deleteIcon;
    };

    Tile.prototype.setShowActionsIcon = function (bShow) {
        var that = this, // the tile control
            icon;

        if (bShow) {
            icon = new Icon({
                size: "1rem",
                src: "sap-icon://overflow",
                press: function (oEvent) {
                    that.fireShowActions();
                    that.addStyleClass('showTileActionsIcon');

                    var oEventBus = sap.ui.getCore().getEventBus(),
                        eventFunction = function (name, name2, tile) {
                            tile.removeStyleClass('showTileActionsIcon');
                            oEventBus.unsubscribe("dashboard", "actionSheetClose", eventFunction);
                        };
                    oEventBus.subscribe("dashboard", "actionSheetClose", eventFunction);
                }
            });
            icon.addStyleClass("sapUshellTileActionsIconClass");
            this.actionIcon = icon;
        } else if (this.actionIcon) {
            this.actionIcon.destroy(true);
        }
        this.setProperty("showActionsIcon", bShow);
    };

    Tile.prototype.setIsDraggedInTabBarToSourceGroup = function (bDraggedInTabBarToSourceGroup) {
        this.setProperty('isDraggedInTabBarToSourceGroup', bDraggedInTabBarToSourceGroup, true); // suppress rerendering
        this.setVisible(!bDraggedInTabBarToSourceGroup);

    };

    Tile.prototype.setVisible = function (bVisible) {
        this.setProperty("visible", bVisible, true); // suppress rerendering
        return this.toggleStyleClass("sapUshellHidden", !bVisible);
    };

    Tile.prototype.setTarget= function (sValue) {
        this.setProperty("target", sValue, true); // suppress rerendering
        //Update tile href property
        this.$().find(".sapUshellTileInner").attr("href", sValue);
    };

    Tile.prototype.setRgba = function (sValue) {
        this.setProperty("rgba", sValue, true); // suppress re-rendering
        this._redrawRGBA(arguments);
    };

    Tile.prototype.setAnimationRendered = function (bVal) {
        this.setProperty('animationRendered', bVal, true); // suppress re-rendering
    };
    Tile.prototype.setNavigationMode = function (sValue) {
        this.setProperty('navigationMode', sValue, true); // suppress re-rendering
    };

    Tile.prototype._handleTileShadow = function (jqTile, args) {
        if (jqTile.length) {
            jqTile.unbind('mouseenter mouseleave');
            var updatedShadowColor,
                tileBorderWidth = jqTile.css("border").split("px")[0],
                oModel = this.getModel();
            //tile has border
            if (tileBorderWidth > 0) {
                updatedShadowColor = jqTile.css("border-color");
            } else {
                updatedShadowColor = this.getRgba();
            }

            jqTile.hover(
                function () {
                    if (!oModel.getProperty('/tileActionModeActive')) {
                        var sOriginalTileShadow = jQuery(jqTile).css('box-shadow'),
                            sTitleShadowDimension = sOriginalTileShadow ? sOriginalTileShadow.split(') ')[1] : null,
                            sUpdatedTileShadow;

                        if (sTitleShadowDimension) {
                            sUpdatedTileShadow = sTitleShadowDimension + " " + updatedShadowColor;
                            jQuery(this).css('box-shadow', sUpdatedTileShadow);
                        }
                    }
                },
                function () {
                    jQuery(this).css('box-shadow', '');
                }
            );
        }
    };

    Tile.prototype._redrawRGBA = function (args) {
        var sRGBAvalue = this.getRgba(),
            jqTile;

        if (sRGBAvalue) {
            jqTile = jQuery.sap.byId(this.getId());

            //In case this method is called before the tile was rendered
            if (!jqTile) {
                return;
            }

            if (!this.getModel().getProperty('/animationRendered')) {
                jqTile.css('transition', 'background-color 2s');
                jqTile.css('background-color', sRGBAvalue);
            } else {
                jqTile.css('background-color', sRGBAvalue);
            }
            this._handleTileShadow(jqTile, args);
        }
    };

    Tile.prototype.setLong = function (bLong) {
        this.setProperty("long", bLong, true); // suppress rerendering
        return this.toggleStyleClass("sapUshellLong", !!bLong);
    };

    Tile.prototype.setUuid = function (sUuid) {
        this.setProperty("uuid", sUuid, true); // suppress rerendering
        return this;
    };


	return Tile;

});
