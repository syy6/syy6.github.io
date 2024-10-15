// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    'sap/ushell/resources',
    'sap/ushell/components/applicationIntegration/AppLifeCycle',
    'sap/ushell/components/SharedComponentUtils',
    'sap/ushell/Config',
    'sap/ushell/EventHub'
], function (resources, AppLifeCycle, oSharedComponentUtils, Config, EventHub) {
    "use strict";

    // Shortcut to sap.ushell.Container.getRenderer("fiori2")
    function _renderer () {
        return sap.ushell.Container.getRenderer("fiori2");
    }

    // Shortcut to AppLifeCycle.getElementsModel().getModel()
    function _model () {
        return AppLifeCycle.getElementsModel().getModel();
    }

    function GeneralEntry (viewId, viewFullName, viewType, entryHelpID, title, onSaveFunc, onCancelFunc, getContentFunc, getValueFunc, isEditableFunc, oModel, entryIcon, defaultVisibility) {
        this.view = null;
        this.getView = function () {
            if (!this.view || !sap.ui.getCore().byId(viewId)) {
                if (viewType === "xml") {
                    this.view = sap.ui.xmlview(viewId, viewFullName);
                } else {
                    this.view = sap.ui.jsview(viewId, viewFullName);
                }
            }
            if (oModel) {
                this.view.setModel(oModel);
            }
            return this.view;
        };

        return {
            entryHelpID: entryHelpID,
            title: title,
            valueResult: null,
            onSave: onSaveFunc ? onSaveFunc.bind(this) : function () {
                if (this.getView().getController().onSave) {
                    return this.getView().getController().onSave();
                }
            }.bind(this),
            onCancel: onCancelFunc ? onCancelFunc.bind(this) : function () {
                if (this.getView().getController().onCancel) {
                    return this.getView().getController().onCancel();
                }
            }.bind(this),
            contentFunc: getContentFunc ? getContentFunc.bind(this) : function () {
                if (this.getView().getController().getContent) {
                    return this.getView().getController().getContent();
                }
            }.bind(this),
            valueArgument: getValueFunc ? getValueFunc.bind(this) : function () {
                var dfd = new jQuery.Deferred(),
                    that = this;

                setTimeout(function () {
                    if (that.getView().getController().getValue) {
                        that.getView().getController().getValue().done(function (value) {
                            dfd.resolve(value);
                        });
                    }
                }, 0);

                return dfd.promise();
            }.bind(this),
            editable: typeof isEditableFunc === "function" ? isEditableFunc() : isEditableFunc,
            contentResult: null,
            icon: entryIcon,
            defaultVisibility: defaultVisibility
        };
    }

    function createControllerMethodCaller (sMethod) {
        return function () {
            return this.getView().getController()[sMethod]();
        };
    }

    function createSpecificEntry (oParams) {
        var oEntry = {
            entryHelpID: oParams.entryHelpId,
            title: resources.i18n.getText(oParams.i18nTitleKey),
            editable: true,
            valueResult: null,
            contentResult: null,
            icon: oParams.icon,
            getView: function () {
                var fnCreateView = oParams.viewType === "xml"
                    ? sap.ui.xmlview
                    : sap.ui.jsview;

                var oView = sap.ui.getCore().byId(oParams.viewId);
                if (!oView) {
                    oView = fnCreateView(oParams.viewId, oParams.componentNamespace);
                }
                return oView;
            }
        };

        oEntry.valueArgument = createControllerMethodCaller("getValue").bind(oEntry);
        oEntry.onSave = createControllerMethodCaller("onSave").bind(oEntry);
        oEntry.onCancel = createControllerMethodCaller("onCancel").bind(oEntry);
        oEntry.contentFunc = createControllerMethodCaller("getContent").bind(oEntry);

        return oEntry;
    }

    function LanguageRegionEntry () {
        return createSpecificEntry({
            entryHelpId: "language",
            i18nTitleKey: "languageRegionTit",
            icon: "sap-icon://globe",
            viewId: "languageRegionSelector",
            componentNamespace: "sap.ushell.components.shell.MeArea.LanguageRegionSelector"
        });
    }

    function UserActivitiesEntry () {
        return createSpecificEntry({
            entryHelpId: "UserActivitiesEntry",
            i18nTitleKey: "userActivities",
            icon: "sap-icon://laptop",
            viewId: "userActivitiesHandler",
            componentNamespace: "sap.ushell.components.shell.MeArea.userActivitiesHandler"
        });
    }

    function UserAccountEntry () {
        var oShellConfig = _renderer().getShellConfig();

        var bUseSelector = (
            oShellConfig.enableOnlineStatus
            && sap.ushell.ui5service.UserStatus.prototype.isEnabled
        ) || oShellConfig.enableUserImgConsent;

        var sViewId = bUseSelector
            ? "userAccountSelector"
            : "userAccountSetting";

        var sComponentNamespace = bUseSelector
            ? "sap.ushell.components.shell.MeArea.userAccount.UserAccountSelector"
            : "sap.ushell.components.shell.MeArea.userAccount.UserAccountSetting";

        return createSpecificEntry({
            entryHelpId: "userAccountEntry",
            i18nTitleKey: "UserAccountFld",
            icon: "sap-icon://account",
            viewId: sViewId,
            componentNamespace: sComponentNamespace,
            viewType: "xml"
        });
    }

    function _getUserPrefDefaultModel () {
        var oModel = _model(),
            oUser = sap.ushell.Container.getUser();

        // Create user preference entries for:
        // - themeSelector
        // - usageAnalytics
        // - DefaultParameters
        // - userProfiling
        // - CompactCozySelector

        var themeSelectorEntry = new GeneralEntry(
            "userPrefThemeSelector",
            "sap.ushell.components.shell.MeArea.ThemeSelector",
            "xml",
            "themes",
            resources.i18n.getText("Appearance"),
            function () {
                var dfd = this.getView().getController().onSave();
                dfd.done(function () {
                    // re-calculate tiles background color according to the selected theme
                    if (oModel.getProperty("/enableTilesOpacity") === true) {
                        sap.ushell.utils.utils.handleTilesOpacity();
                    }
                });
                return dfd;
            },
            undefined,
            undefined,
            undefined,
            function () {
                if (oModel.getProperty("/setTheme") !== undefined) {
                    return oModel.getProperty("/setTheme") && oUser.isSetThemePermitted();
                } else {
                    return oUser.isSetThemePermitted();
                }
            },
            oModel,
            "sap-icon://palette"
        );

        var usageAnalyticsEntry = new GeneralEntry(
            "userPrefUsageAnalyticsSelector",
            "sap.ushell.components.shell.MeArea.UsageAnalyticsSelector",
            "js",
            "usageAnalytics",
            resources.i18n.getText("usageAnalytics"),
            undefined,
            undefined,
            undefined,
            undefined,
            sap.ushell.Container.getService("UsageAnalytics").isSetUsageAnalyticsPermitted()
        );

        var defaultParametersEntry = new GeneralEntry(
            "defaultParametersSelector",
            "sap.ushell.components.shell.MeArea.DefaultParameters",
            "js",
            undefined,
            resources.i18n.getText("defaultsValuesEntry"),
            undefined,
            undefined,
            undefined,
            undefined,
            true,
            undefined,
            undefined,
            false
        );

        var userProfilingEntry = new GeneralEntry(
            "userProfilingView",
            "sap.ushell.components.shell.MeArea.UserProfiling",
            "js",
            "userProfiling",
            resources.i18n.getText("userProfiling"),
            undefined,
            undefined,
            undefined,
            undefined,
            false,
            oModel,
            "sap-icon://user-settings",
            false
        );

        var entries =
            [
                new UserAccountEntry(),
                themeSelectorEntry,
                new LanguageRegionEntry()
            ],
            profilingEntries = [];
        profilingEntries.push(usageAnalyticsEntry);

        var enableRecentActivity = Config.last("/core/shell/enableRecentActivity");
        if (enableRecentActivity) {
            entries.push(new UserActivitiesEntry());
        }
        entries.push(userProfilingEntry);

        // User setting entry for notification setting UI
        // Added only if both notifications AND notification settings are enabled
        if (oModel.getProperty("/enableNotifications") === true) {

            var oNotificationSettingsAvalabilityPromise = sap.ushell.Container.getService("Notifications")._getNotificationSettingsAvalability(),
                notificationSettingsEntry;

            notificationSettingsEntry = new GeneralEntry(
                "notificationSettings",
                "sap.ushell.components.shell.Notifications.Settings",
                "js",
                undefined,
                resources.i18n.getText("notificationSettingsEntry_title"),
                undefined,
                undefined,
                undefined,
                undefined,
                true,
                undefined,
                "sap-icon://ui-notifications",
                false
            );
            entries.push(notificationSettingsEntry);

            oNotificationSettingsAvalabilityPromise.done(function (oStatuses) {
                if (oStatuses.settingsAvailable) {
                    notificationSettingsEntry.visible = true;// in case the notification entry did not enter already to the model, we should change the
                    oModel.getProperty("/userPreferences/entries").every(function (entry, index) {
                        if (entry.title === resources.i18n.getText("notificationSettingsEntry_title")) {
                            oModel.setProperty("/userPreferences/entries/" + index + "/visible", true);
                            return false;
                        }
                        return true;
                    });
                }
            });
        }

        if (oModel.getProperty("/userDefaultParameters")) {
            entries.push(defaultParametersEntry);
        }

        var bEnableHomePageSettings = Config.last("/core/home/enableHomePageSettings");
        if (bEnableHomePageSettings !== false) {
            entries.push(getHomepageSettingsEntity());
        }

        return {
            dialogTitle: resources.i18n.getText("userSettings"),
            isDetailedEntryMode: false,
            activeEntryPath: null, //the entry that is currently modified
            entries: entries,
            profiling: profilingEntries
        };
    }

    /**
     * Adds the settings for the homepage to the settings view.
     */
    function getHomepageSettingsEntity () {

        var oRenderer = _renderer(),
            oResourceBundle = resources.i18n;

        var flpSettingsView;

        var oEntry = {
            title: oResourceBundle.getText('FlpSettings_entry_title'),
            entryHelpID: "flpSettingsEntry",
            valueArgument: function () {
                return jQuery.Deferred().resolve(" ");
            },
            contentFunc: function () {
                var oDeferred = new jQuery.Deferred();

                oSharedComponentUtils.getEffectiveHomepageSetting("/core/home/homePageGroupDisplay", "/core/home/enableHomePageSettings").then(function (sDisplay) {
                    flpSettingsView = sap.ui.xmlview({
                        viewName: "sap.ushell.components.shell.MeArea.FlpSettings",
                        viewData: {
                            initialDisplayMode: sDisplay || "scroll"
                        }
                    });
                    oDeferred.resolve(flpSettingsView);
                });

                return oDeferred;
            },
            onSave: function () {
                var sDisplay = flpSettingsView.getController().onSave();

                // save anchor bar mode in personalization
                var oDeferred = oSharedComponentUtils.getPersonalizer("homePageGroupDisplay", oRenderer)
                    .setPersData(sDisplay);

                // Log failure if occurs.
                oDeferred.fail(function (error) {
                    jQuery.sap.log.error(
                        "Failed to save the anchor bar mode in personalization", error,
                        "sap.ushell.components.flp.settings.FlpSettings");
                });
                Config.emit("/core/home/homePageGroupDisplay", sDisplay);
                return jQuery.Deferred().resolve();
            },
            onCancel: function () {
                return jQuery.Deferred().resolve();
            },
            icon: "sap-icon://home"
        };

        return oEntry;
    }

    /**
     * Add user preferences to the shell model.
     * @private
     */
    function setModel () {
        var userPreferencesEntryArray = _model().getProperty("/userPreferences/entries");
        var oDefaultUserPrefModel = _getUserPrefDefaultModel();
        oDefaultUserPrefModel.entries = oDefaultUserPrefModel.entries.concat(userPreferencesEntryArray);
        // Re-order the entries array to have the Home Page entry right after the Appearance entry (if both exist)
        oDefaultUserPrefModel.entries = _renderer().reorderUserPrefEntries(oDefaultUserPrefModel.entries);

        _model().setProperty("/userPreferences", oDefaultUserPrefModel);
    }

    return { setModel: setModel };
});
