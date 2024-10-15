sap.ui.define([
    "jquery.sap.global",
    "./abap.constants",
    "sap/ushell/bootstrap/common/common.configure.ushell"
], function (jQuery, oAbapConstants, fnConfigureUshellCommon) {
    'use strict';
    var S_COMPONENT = "sap/ushell_abap/bootstrap/v2/abap.configure.ushell";

    return configureUshell;

    function configureUshell () {
        var oConfig = fnConfigureUshellCommon(oAbapConstants),
            aMessages,
            oContainerAdapter,
            i;

        // Write any warnings and errors related to server-side config to console.
        aMessages = oConfig.messages;
        if (aMessages && aMessages.length > 0) {
            for (i = 0; i < aMessages.length; i += 1) {
                if (aMessages[i].severity === "error") {
                    jQuery.sap.log.error(aMessages[i].text, null, S_COMPONENT);
                } else if (aMessages[i].severity === "warning") {
                    jQuery.sap.log.warning(aMessages[i].text, null, S_COMPONENT);
                }
            }
        }

        // add start_up configuration if provided by server (formerly retrieved by separate round trip to start_up service)
        if (oConfig.startupConfig) {
            oContainerAdapter = jQuery.sap.getObject("services.Container.adapter", 0, oConfig);
            oContainerAdapter["config"] = oConfig.startupConfig;
        }

        return oConfig;
    }
});