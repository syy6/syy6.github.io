sap.ui.define([
    "sap/ui/core/mvc/ControllerExtension",
    "sap/ui/core/mvc/OverrideExecution"
], function (
    ControllerExtension,
    OverrideExecution
) {
    "use strict";
    return ControllerExtension.extend("sap.ovp.app.TemplateBaseExtension", {
        metadata: {
            methods: {
                provideExtensionAppStateData: {
                    "public": true,
                    "final": false,
                    overrideExecution: OverrideExecution.After
                },
                restoreExtensionAppStateData: {
                    "public": true,
                    "final": false,
                    overrideExecution: OverrideExecution.After
                }
            }
        },

        provideExtensionAppStateData: function (fnSetAppStateData) {
        },


        restoreExtensionAppStateData: function (fnGetAppStateData) {
        },
        // allows extension to add filters. They will be combined via AND with all other filters
        // For each filter the extension must call fnAddFilter(oControllerExtension, oFilter)
        // oControllerExtension must be the ControllerExtension instance which adds the filter
        // oFilter must be an instance of sap.ui.model.Filter
        addFilters: function(fnAddFilter){}
    });
});
