// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/User",
    "sap/ui/thirdparty/jquery"
], function (User, jQuery) {
    "use strict";
    var ContainerAdapter = function (oSystem, sParameter, oAdapterConfiguration) {

        var oUser;

        this.load = function () {
            var userInfo = jQuery.extend(true, {id: ""},
                oAdapterConfiguration &&
                oAdapterConfiguration.config &&
                oAdapterConfiguration.config.userProfile &&
                oAdapterConfiguration.config.userProfile.defaults
            );
            oUser = new User(userInfo);
            return new jQuery.Deferred().resolve().promise();
        };

        this.getSystem = function () {
            return oSystem;
        };

        this.getUser = function () {
            return oUser;
        };

        this.logout = function () {
            return new jQuery.Deferred().resolve().promise();
        };
    };

    return ContainerAdapter;
}, /* bExport= */ true);
