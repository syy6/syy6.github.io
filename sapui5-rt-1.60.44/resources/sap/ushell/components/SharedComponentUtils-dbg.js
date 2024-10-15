// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/Config",
    "sap/ushell/UserActivityLog",
    "sap/ushell/resources",
    "sap/ushell/components/homepage/ComponentKeysHandler",
    "sap/ushell/renderers/fiori2/AccessKeysHandler",
    "sap/ushell/bootstrap/common/common.load.model",
    "sap/base/Log"
], function (
    Config, UserActivityLog, resources, ComponentKeysHandler, AccessKeysHandler, oModelWrapper, Log) {
    "use strict";

    var oSharedComponentUtils = {
        PERS_KEY: "flp.settings.FlpSettings",
        bFlpSettingsAdded: false,

        /**
         * Toggles the UserActivityLog.
         */
        toggleUserActivityLog: function () {
            Config
            .on("/core/extension/SupportTicket")
            .do(function (bConfigured) {
                if (bConfigured) {
                    UserActivityLog.activate();
                } else {
                    UserActivityLog.deactivate();
                }
            });
        },

        /**
         * Registers both component keys and access keys.
         *
         * @param {sap.ui.core.UIComponent} oRouter The router used to react on the hotkeys
         */
        initializeAccessKeys: function (oRouter) {
            var oTranslationBundle,
                aShortcutsDescriptions;

            if (sap.ui.Device.system.phone) {
                return;
            }

            ComponentKeysHandler.init(oModelWrapper.getModel(), oRouter);

            AccessKeysHandler.registerAppKeysHandler(ComponentKeysHandler.handleFocusOnMe);
            oTranslationBundle = resources.i18n;
            aShortcutsDescriptions = [];

            aShortcutsDescriptions.push({ text: "Alt+H", description: oTranslationBundle.getText("hotkeyHomePage") });

            if (oModelWrapper.getModel().getProperty("/personalization")) {
                aShortcutsDescriptions.push({ text: "Alt+A", description: oTranslationBundle.getText("hotkeyFocusOnAppFinderButton") });
                aShortcutsDescriptions.push({ text: "Ctrl+Enter", description: oTranslationBundle.getText("hotkeySaveEditing") });
            }

            AccessKeysHandler.registerAppShortcuts(ComponentKeysHandler.handleShortcuts, aShortcutsDescriptions);
        },

        /**
         * Retrieves the value of the given config path from the personalization service.
         * If the enableHomePageSettings configuration is explicitly set to false, the value is taken from
         * the FLP configuration.
         * The personalization item ID is extracted from the given config path.
         *
         * @param {string} sConfigPath The configuration path
         * @param {string} sConfigurablePath The configuration path to the setting enabling/disabling the setting under sConfigPath
         * @returns {jQuery.Deferred} Deferred object that resolves to the wanted setting
         */
        getEffectiveHomepageSetting: function (sConfigPath, sConfigurablePath) {
            var oPersonalizationPromise,
                oDeferred = new jQuery.Deferred(),
                bEnabled = Config.last(sConfigurablePath) !== false,
                sItemID = sConfigPath.split("/").reverse()[0];

            // Unless explicitly turned off, enable home page settings.
            if (bEnabled) {
                oPersonalizationPromise = this._getPersonalization(sItemID);
            } else {
                oPersonalizationPromise = jQuery.Deferred().resolve();
            }

            oPersonalizationPromise.done(function (sValue) {
                sValue = sValue || Config.last(sConfigPath);

                if (sValue !== undefined) {
                    Config.emit(sConfigPath, sValue);
                }

                oDeferred.resolve(sValue);
            });
            oPersonalizationPromise.fail(function () {
                var sValue = Config.last(sConfigPath);

                oDeferred.resolve(sValue);
            });

            return oDeferred;
        },

        /**
         * Retrieves the data of the given personalization item.
         *
         * @param {string} sItem The personalization item ID
         * @returns {jQuery.Deferred} Deferred object that resolves to the requested setting
         * @private
         */
        _getPersonalization: function (sItem) {
            var oPersonalizer = oSharedComponentUtils.getPersonalizer(sItem, sap.ushell.Container.getRenderer("fiori2"));
            var oPersonalizationDataDeferred = oPersonalizer.getPersData();

            oPersonalizationDataDeferred.fail(function (sError) {
                Log.error("Failed to load " + sItem + " from the personalization", sError, "sap.ushell.components.flp.settings.FlpSettings");
            });

            return oPersonalizationDataDeferred;
        },

        /**
         * @param {string} sItem The personalization item ID
         * @param {object} oComponent The component the personalization is to be retrieved for
         * @returns {jQuery.Deferred} Deferred object that resolves to the personalization content of the given item
         * @private
         */
        getPersonalizer: function (sItem, oComponent) {
            var oPersonalizationService = sap.ushell.Container.getService("Personalization");
            var oOwnerComponent = sap.ui.core.Component.getOwnerComponentFor(oComponent);
            var oScope = {
                keyCategory: oPersonalizationService.constants.keyCategory.FIXED_KEY,
                writeFrequency: oPersonalizationService.constants.writeFrequency.LOW,
                clientStorageAllowed: true
            };
            var oPersId = {
                container: this.PERS_KEY,
                item: sItem
            };

            return oPersonalizationService.getPersonalizer(oPersId, oScope, oOwnerComponent);
        }
    };

    return oSharedComponentUtils;
});
