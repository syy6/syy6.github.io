sap.ui.define([
    "jquery.sap.global",
    "./common.constants",
    "./common.debug.mode",
    "./common.read.metatags"
], function (jQuery, oConstants, bDebugSources, oMetaTagReader) {
    "use strict";

    var S_COMPONENT = "sap/ushell/bootstrap/common/common.boot.script";

    return configureUshell;

    /**
     * Sets the sap-ushell-config based on all available sources for it (e.g. meta tags)
     *
     * @param {object} oSettings Optional default configuration.
     *
     * @returns {object} The ushell configuration.
     *
     * @private
     */
    function configureUshell(oSettings) {
        var oUShellConfig;

        var oDefaultConfigration = oSettings && oSettings.defaultUshellConfig;
        var aMetaConfigItems = oMetaTagReader.readMetaTags(oConstants.configMetaPrefix);

        createGlobalConfigs(aMetaConfigItems, oDefaultConfigration, bDebugSources, null);

        oUShellConfig = window[oConstants.ushellConfigNamespace];

        fixUpPersonalisedSettings(
            oUShellConfig,
            "services.Container.adapter.config.userProfilePersonalization"
        );

        return oUShellConfig;
    }

    // Some settings of the ushell which are dependent on user personalisation
    // are included in the config by direct reference to their respective
    // container in the personalisation storage.
    //
    // This function transforms the stored key-value pairs into a structure the
    // ushell configuration processor understands.
    function fixUpPersonalisedSettings(oUShellConfig, sSettingPath) {
        var oPersonalizedSetting;

        if (!oUShellConfig || !sSettingPath) {
            return;
        }

        oPersonalizedSetting = jQuery.sap.getObject(sSettingPath, undefined, oUShellConfig);

        if (oPersonalizedSetting && oPersonalizedSetting.items) {
            jQuery.extend(oPersonalizedSetting, oPersonalizedSetting.items);

            delete oPersonalizedSetting.items;
            delete oPersonalizedSetting.__metadata;
        }
    }

    function createGlobalConfigs(aMetaConfigItems, oDefaultConfigration, bDebugSources, aServerConfigItems) {
        var sConfigPropertyName = oConstants.ushellConfigNamespace,
            aConfigs = aMetaConfigItems,
            oUShellConfig;

        if (!window[sConfigPropertyName]) {
            window[sConfigPropertyName] = {};
        }
        oUShellConfig = window[sConfigPropertyName];

        if (oDefaultConfigration) {
            // uses the default configuration as very first configuration, so it has the lowest priority
            aConfigs = [oDefaultConfigration].concat(aMetaConfigItems);
        }

        aConfigs.forEach(function (oConfigItem) {
            mergeConfig(oUShellConfig, oConfigItem, true);
        });

        aServerConfigItems && aServerConfigItems.forEach(function (oServerConfig) {
            mergeConfig(oUShellConfig, oServerConfig, true);
        });

        oUShellConfig["sap-ui-debug"] = bDebugSources;

        // log the config for better debugging
        jQuery.sap.log.info(
            "finally applied sap-ushell-config",
            JSON.stringify(oUShellConfig),
            S_COMPONENT
        );
    }

    function mergeConfig(oMutatedBaseConfig, oConfigToMerge, bCloneConfigToMerge) {
        var oActualConfigToMerge;

        if (!oConfigToMerge) {
            return;
        }

        oActualConfigToMerge = bCloneConfigToMerge
            ? JSON.parse(JSON.stringify(oConfigToMerge))
            : oConfigToMerge;

        Object.keys(oActualConfigToMerge).forEach(function (sKey) {
            if (typeof oMutatedBaseConfig[sKey] === "object" &&
                typeof oActualConfigToMerge[sKey] === "object") {
                mergeConfig(oMutatedBaseConfig[sKey], oActualConfigToMerge[sKey], false);
                return;
            }

            oMutatedBaseConfig[sKey] = oActualConfigToMerge[sKey];
        });
    }

});