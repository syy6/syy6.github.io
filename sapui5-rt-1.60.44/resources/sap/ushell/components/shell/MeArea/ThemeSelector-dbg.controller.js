// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/EventHub",
    "sap/ushell/Config",
    "sap/ui/core/Component"
], function (EventHub, Config, Component) {
    "use strict";

    /*global jQuery, sap, setTimeout, clearTimeout */
    /*jslint plusplus: true, nomen: true */

    sap.ui.controller("sap.ushell.components.shell.MeArea.ThemeSelector", {
        TILE_SIZE: {
            Small: 0,
            Responsive: 1,

            getName: function (iValue) {
                return Object.keys(this)[iValue];
            }
        },

        onInit: function () {
            try {
                this.userInfoService = sap.ushell.Container.getService("UserInfo");
                this.oUser = this.userInfoService.getUser();
            } catch (e) {
                jQuery.sap.log.error("Getting UserInfo service failed.");
                this.oUser = sap.ushell.Container.getUser();
            }

            this.currentThemeId = this.oUser.getTheme();
            this.origThemeId = this.currentThemeId;
            this.aThemeList = null;
            this.isContentLoaded = false;
            this.aSapThemeMap = {
                base: "sapUshellBaseIconStyle",
                sap_bluecrystal: "sapUshellBlueCrystalIconStyle",
                sap_belize_hcb: "sapUshellHCBIconStyle",
                sap_belize_hcw: "sapUshellHCWIconStyle",
                sap_belize: "sapUshellBelizeIconStyle",
                sap_belize_plus: "sapUshellPlusIconStyle"
            };
            this.oPersonalizers = {};
        },
        getConfigurationModel: function () {
            var oConfModel = new sap.ui.model.json.JSONModel({});
            var animationModeOnModel = this.getView().getModel() ? this.getView().getModel().getProperty("/animationMode") : undefined;
            this.originalAnimationModeKey = animationModeOnModel ? animationModeOnModel : "full";
            this.currentAnimationModeKey = this.originalAnimationModeKey;

            oConfModel.setData({
                isRTL: sap.ui.getCore().getConfiguration().getRTL(),
                sapUiContentIconColor: sap.ui.core.theming.Parameters.get('sapUiContentIconColor'),
                isContentDensitySwitchEnabled: this.isContentDensitySwitchEnabled(),
                flexAlignItems: 'Center',
                textAlign: sap.ui.Device.system.phone ? 'Left' : 'Right',
                textDirection: 'Row',
                labelWidth: 'auto',
                isCozyContentMode: this.isCozyContentMode(),
                sizeBehaviorConfigurable: Config.last("/core/home/sizeBehaviorConfigurable"),
                animationMode: this.currentAnimationModeKey
            });
            return oConfModel;
        },
        _getIsChangeThemePermitted: function () {
            return this.oUser.isSetThemePermitted();
        },
        onAfterRendering: function () {
            var that = this;

            var oDoable = EventHub.on("UserPreferencesDetailNavigated");
            oDoable.do(function (sId) {
                if (sId !== "detailuserPrefThemeSelector") {
                    return;
                }
                oDoable.off("UserPreferencesDetailNavigated");

                var oList = sap.ui.getCore().byId("userPrefThemeSelector--themeList"),
                    items = oList.getItems(),
                    oIcon,
                    sThemeId;

                oList.toggleStyleClass("sapUshellThemeListDisabled", !that.isListActive());
                items.forEach(function (oListItem) {
                    sThemeId = oListItem.getCustomData()[0].getValue();
                    oIcon = oListItem.getContent()[0].getItems()[0].getItems()[0];
                    if (!that.isListActive()) {
                        oListItem.isSelectable = function () {
                            return false;
                        };
                    }
                    if (sThemeId === that.currentThemeId) {
                        oListItem.setSelected(true);
                        if (!that.isListActive()) {
                            oListItem.toggleStyleClass("sapUshellThemeListItemSelected", true);
                        }
                    } else {
                        oListItem.setSelected(false);
                    }

                    oIcon.addStyleClass(that.aSapThemeMap[sThemeId]);
                    oIcon.toggleStyleClass("sapUshellHCBIconStyleOnHCB", sThemeId === that.currentThemeId && sThemeId === "sap_belize_hcb");
                    oIcon.toggleStyleClass("sapUshellHCWIconStyleOnHCW", that.currentThemeId !== "sap_belize_hcb" && sThemeId === "sap_belize_hcw");
                });
                var contentDensitySwitch = sap.ui.getCore().byId("userPrefThemeSelector--contentDensitySwitch");
                if (contentDensitySwitch) {
                    contentDensitySwitch.setState(that.currentContentDensity === "cozy");
                    contentDensitySwitch.setEnabled(that.isContentDensitySwitchEnabled());
                }
                var tileSizeRadioButtonGroup = sap.ui.getCore().byId("userPrefThemeSelector--tileSizeRaidoButtonGroup");
                if (tileSizeRadioButtonGroup) {
                    var sizeBehavior = Config.last("/core/home/sizeBehavior");
                    tileSizeRadioButtonGroup.setSelectedIndex(that.TILE_SIZE[sizeBehavior]);
                }
                // Add role 'list' to avoid screen-readers' 'table' announcement.
                jQuery('.sapUshellAppearanceTable > table').attr('role', 'list');
            });

        },
        getContent: function () {
            var that = this;
            var deferred = jQuery.Deferred();
            var oResourceModel = sap.ushell.resources.getTranslationModel();
            this.getView().setModel(oResourceModel, "i18n");
            this.getView().setModel(this.getConfigurationModel(), "config");

            if (this.isContentDensitySwitchEnabled()) {
                this.origContentDensity = this.currentContentDensity;
                if (this.oUser.getContentDensity()) {
                    this.currentContentDensity = this.oUser.getContentDensity();
                } else {
                    this.currentContentDensity = "cozy";
                }
            }
            if (this.isContentLoaded === true) {
                deferred.resolve(this.getView());
            } else {
                var dfdThemeList = this._getThemeList();
                dfdThemeList.done(function (aThemeList) {
                    if (aThemeList.length > 0) {
                        // Sort the array of themes according to theme name
                        aThemeList.sort(function (theme1, theme2) {
                            var theme1Name = theme1.name,
                                theme2Name = theme2.name;
                            if (theme1Name < theme2Name) { //sort string ascending
                                return -1;
                            }
                            if (theme1Name > theme2Name) {
                                return 1;
                            }
                            return 0; //default return value (no sorting)
                        });
                        //set theme selection
                        for (var i = 0; i < aThemeList.length; i++) {
                            if (aThemeList[i].id == that.currentThemeId) {
                                aThemeList[i].isSelected = true;
                            } else {
                                aThemeList[i].isSelected = false;
                            }
                        }
                        that.getView().getModel().setProperty("/options", aThemeList);
                        deferred.resolve(that.getView());
                    } else {
                        deferred.reject();
                    }
                });

                dfdThemeList.fail(function () {
                    deferred.reject();
                });
            }

            return deferred.promise();
        },

        getValue: function () {
            var deferred = jQuery.Deferred();
            var themeListPromise = this._getThemeList();
            var that = this;
            var themeName;

            themeListPromise.done(function (aThemeList) {
                that.aThemeList = aThemeList;
                themeName = that._getThemeNameById(that.currentThemeId);
                deferred.resolve(themeName);
            });

            themeListPromise.fail(function (sErrorMessage) {
                deferred.reject(sErrorMessage);
            });

            return deferred.promise();
        },

        onCancel: function () {
            this.currentThemeId = this.oUser.getTheme();
            if (this.isContentDensitySwitchEnabled()) {
                this.currentContentDensity = this.oUser.getContentDensity();
            }
            this.currentAnimationModeKey = this.originalAnimationModeKey;
            var animationModeCombo = sap.ui.getCore().byId("userPrefThemeSelector--animationModeCombo");
            if (animationModeCombo) {
                animationModeCombo.setSelectedKey(this.originalAnimationModeKey);
            }
            this.tileSizeChanged = false;
        },

        onSave: function () {
            var oResultDeferred = jQuery.Deferred(),
                oWhenPromise,
                aPromiseArray = [],
                iTotalPromisesCount = 0,
                iSuccessCount = 0,
                iFailureCount = 0,
                aFailureMsgArr = [],
                that = this,
                saveDoneFunc = function () {
                    iSuccessCount++;
                    oResultDeferred.notify();
                },
                saveDoneAnimationFunc = function () {
                    iSuccessCount++;
                    oResultDeferred.notify();
                    that.getView().getModel().setProperty("/animationMode", that.currentAnimationModeKey);
                    that.originalAnimationModeKey = that.currentAnimationModeKey;
                },
                saveFailFunc = function (err) {
                    aFailureMsgArr.push({
                        entry: "currEntryTitle",
                        message: err
                    });
                    iFailureCount++;
                    oResultDeferred.notify();
                };

            var oThmemePromise = this.onSaveThemes();
            oThmemePromise.done(saveDoneFunc);
            oThmemePromise.fail(saveFailFunc);
            aPromiseArray.push(oThmemePromise);

            if (this.currentAnimationModeKey !== this.originalAnimationModeKey) {
                var oAnimationModePromise = this.writeToPersonalization("flp.launchpad.animation.mode", "animationMode", this.currentAnimationModeKey);

                oAnimationModePromise.done(saveDoneAnimationFunc);
                oAnimationModePromise.fail(saveFailFunc);
                aPromiseArray.push(oAnimationModePromise);
            }
            if (this.isContentDensitySwitchEnabled()) {
                var oContentDensityPromise = this.onSaveContentDensity();

                oContentDensityPromise.done(saveDoneFunc);
                oContentDensityPromise.fail(saveFailFunc);
                aPromiseArray.push(oContentDensityPromise);
            }
            if (this.tileSizeChanged && this.currentTileSize) {
                Config.emit("/core/home/sizeBehavior", this.currentTileSize);
                if (this.currentTileSize === "Responsive") {
                    jQuery(".sapUshellTile").removeClass("sapUshellSmall");
                    jQuery(".sapUshellPlusTile").removeClass("sapUshellPlusTileSmall");
                } else {
                    jQuery(".sapUshellTile").addClass("sapUshellSmall");
                    jQuery(".sapUshellPlusTile").addClass("sapUshellPlusTileSmall");
                }
                this.tileSizeChanged = false;

                var oSizeBehaviorPromise = this.writeToPersonalization("flp.settings.FlpSettings", "sizeBehavior", this.currentTileSize);
                oSizeBehaviorPromise.done(saveDoneFunc);
                oSizeBehaviorPromise.fail(saveFailFunc);
                aPromiseArray.push(oSizeBehaviorPromise);
            }
            oWhenPromise = jQuery.when.apply(null, aPromiseArray);

            oWhenPromise.done(function () {
                oResultDeferred.resolve();
            });

            oResultDeferred.progress(function () {
                if (iFailureCount > 0 && (iFailureCount + iSuccessCount === iTotalPromisesCount)) {
                    oResultDeferred.reject("At least one save action failed");
                }
            });

            return oResultDeferred.promise();
        },
        onSaveThemes: function () {
            var deferred = jQuery.Deferred();
            var oUserPreferencesPromise;

            if (this.oUser.getTheme() != this.currentThemeId && this.isListActive()) {//only if there was a change we would like to save it
                // Apply the selected theme
                if (this.currentThemeId) {
                    this.oUser.setTheme(this.currentThemeId);

                    oUserPreferencesPromise = this.userInfoService.updateUserPreferences(this.oUser);

                    oUserPreferencesPromise.done(function () {
                        this.origThemeId = this.currentThemeId;
                        this.oUser.resetChangedProperties();
                        deferred.resolve();
                    }.bind(this));

                    oUserPreferencesPromise.fail(function (sErrorMessage) {
                        // Apply the previous theme to the user
                        this.oUser.setTheme(this.origThemeId);
                        this.oUser.resetChangedProperties();
                        this.currentThemeId = this.origThemeId;

                        jQuery.sap.log.error(sErrorMessage);
                        deferred.reject(sErrorMessage);
                    }.bind(this));
                } else {
                    deferred.reject("Could not find theme: " + this.currentThemeId);
                }
            } else {
                deferred.resolve();//No theme change, do nothing
            }

            return deferred.promise();
        },

        _getThemeList: function () {
            var deferred = jQuery.Deferred(),
                that = this;

            if (!this.aThemeList) {
                var getThemesPromise = this.userInfoService.getThemeList();

                getThemesPromise.done(function (oData) {
                    that.aThemeList = oData.options;
                    if (that._getIsChangeThemePermitted() == false) {
                        that.aThemeList = [
                            {
                                id: that.currentThemeId,
                                name: that._getThemeNameById(that.currentThemeId)
                            }
                        ];
                    }

                    deferred.resolve(that.aThemeList);
                });

                getThemesPromise.fail(function () {
                    deferred.reject("Failed to load theme list.");
                });
            } else {
                deferred.resolve(this.aThemeList);
            }

            return deferred.promise();
        },

        getCurrentThemeId: function () {
            return this.currentThemeId;
        },

        setCurrentThemeId: function (newThemeId) {
            this.currentThemeId = newThemeId;
        },

        _getThemeNameById: function (themeId) {
            if (this.aThemeList) {
                for (var i = 0; i < this.aThemeList.length; i++) {
                    if (this.aThemeList[i].id == themeId) {
                        return this.aThemeList[i].name;
                    }
                }
            }
            //fallback in case relevant theme not found
            return themeId;
        },
        onSaveContentDensity: function () {
            var deferred = jQuery.Deferred();
            var oUserPreferencesPromise;

            if (this.oUser.getContentDensity() != this.currentContentDensity && this.isContentDensitySwitchEnabled()) {//only if there was a change we would like to save it
                // Apply the selected mode
                if (this.currentContentDensity) {
                    this.oUser.setContentDensity(this.currentContentDensity);
                    oUserPreferencesPromise = this.userInfoService.updateUserPreferences(this.oUser);
                    oUserPreferencesPromise.done(function () {
                        this.oUser.resetChangedProperties();
                        this.origContentDensity = this.currentContentDensity;
                        sap.ui.getCore().getEventBus().publish("launchpad", "toggleContentDensity", {
                            contentDensity: this.currentContentDensity
                        });
                        EventHub.emit("toggleContentDensity", {
                            contentDensity: this.currentContentDensity
                        });
                        // resolve the promise _after_ the event has been processed
                        // we need to do this in an event handler, as the EventHub is asynchronous.
                        EventHub.once("toggleContentDensity").do(function () {
                            deferred.resolve();
                        });
                    }.bind(this));

                    oUserPreferencesPromise.fail(function (sErrorMessage) {
                        // Apply the previous display density to the user
                        this.oUser.setContentDensity(this.origContentDensity);
                        this.oUser.resetChangedProperties();
                        this.currentContentDensity = this.origContentDensity;
                        jQuery.sap.log.error(sErrorMessage);

                        deferred.reject(sErrorMessage);
                    }.bind(this));
                } else {
                    deferred.reject("Could not find mode: " + this.currentContentDensity);
                }
            } else {
                deferred.resolve();//No mode change, do nothing
            }

            return deferred.promise();
        },

        getCurrentContentDensity: function () {
            return this.currentContentDensity;
        },

        isCozyContentMode: function () {
            return jQuery("body.sapUiSizeCozy").length ? true : false;

        },

        setCurrentContentDensity: function (e) {
            var newContentDensityId = e.getSource().getState() ? "cozy" : "compact";
            this.currentContentDensity = newContentDensityId;

        },
        setCurrentAnimationMode: function (e) {
            var newAnimationModeKey = e.getSource().getSelectedKey();
            this.currentAnimationModeKey = newAnimationModeKey;

        },
        setCurrentTileSize: function (e) {
            var newTileSizeIndex = e.getSource().getSelectedIndex();
            this.currentTileSize = this.TILE_SIZE.getName(newTileSizeIndex);
            this.tileSizeChanged = true;
        },
        getIconFormatter: function (themeId) {
            if (this.aSapThemeMap[themeId]) {
                return "";
            } else {
                return "sap-icon://palette";
            }
        },
        onSelectHandler: function (oEvent) {
            var oItem = oEvent.getParameters().listItem;
            this.setCurrentThemeId(oItem.getBindingContext().getProperty("id"));
        },
        isContentDensitySwitchEnabled: function () {
            return (sap.ui.Device.system.combi && this.getView().getModel().getProperty("/contentDensity") && this.oUser.isSetContentDensityPermitted()) || false;
        },
        isListActive: function () {
            return this.getView().getModel().getProperty("/setTheme");
        },
        getUserStatusSetting: function () {
            var personalizer = this._getUserSettingsPersonalizer();
            return personalizer.getPersData();
        },

        /**
         * Calls the Personalization service to write the given value to the backend at the given
         * place identified by the container and item name.
         *
         * @param {string} sContainer The name of the container
         * @param {string} sItem The name of the item
         * @param {any} vValue The value to be posted to the personalization service
         * @returns {Promise} A promise that is resolved once the personalization data is written. This promise is rejected if the service fails in doing so.
         */
        writeToPersonalization: function (sContainer, sItem, vValue) {
            var oPromise;

            try {
                oPromise = this.getPersonalizer(sContainer, sItem).setPersData(vValue);
            } catch (oError) {
                jQuery.sap.log.error("Personalization service does not work:");
                jQuery.sap.log.error(oError.name + ": " + oError.message);

                oPromise = jQuery.when(Promise.reject(oError));
            }

            return oPromise;
        },

        /**
         * Retrieves a Personalizer instance from the Personalization service and stores it in an internal map.
         *
         * @param {string} sContainer The container ID
         * @param {string} sItem The item ID
         * @returns {object} A new or cached Personalizer instance
         */
        getPersonalizer: function (sContainer, sItem) {
            var sKey = sContainer + "-" + sItem;

            if (this.oPersonalizers[sKey]) {
                return this.oPersonalizers[sKey];
            }

            var oPersonalizationService = sap.ushell.Container.getService("Personalization");
            var oComponent = Component.getOwnerComponentFor(this);
            var oScope = {
                keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                clientStorageAllowed: true
            };

            if (!this.oPersonalizers[sKey]) {
                this.oPersonalizers[sKey] = oPersonalizationService.getPersonalizer({
                    container: sContainer,
                    item: sItem
                }, oScope, oComponent);
            }

            return this.oPersonalizers[sKey];
        }
    });


}, /* bExport= */ false);
