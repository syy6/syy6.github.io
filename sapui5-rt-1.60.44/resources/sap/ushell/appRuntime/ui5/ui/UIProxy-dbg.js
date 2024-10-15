// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/appRuntime/ui5/renderers/fiori2/Renderer",
    "sap/m/Button"
], function (Renderer, Button) {
    "use strict";

    function UIProxy () {
        sap.ushell = sap.ushell || {};
        sap.ushell.ui = sap.ushell.ui || {};
        sap.ushell.ui.shell = sap.ushell.ui.shell || {};

        sap.ushell.ui.shell.ShellHeadItem = function (params) {
            var that = this;

            Object.keys(params).forEach(function (sProp) {
                that[sProp] = params[sProp];
                that["get" + sProp[0].toUpperCase() + sProp.slice(1)] = function () {
                    return params[sProp];
                };
            });

            Renderer.createShellHeadItem(params);
        };
    }

    return new UIProxy();
});
