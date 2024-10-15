// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The <code>sap.ushell.System</code> object with related functions.
 */

sap.ui.define([], function() {
	"use strict";

    /**
     * Constructs a new system object representing a system used in the Unified Shell.
     *
     * @param {object} oData
     *     An object containing the system data
     * @param {string} oData.alias
     *     The unique system alias such as <code>'ENTERPRISE_SEARCH'</code>.
     * @param {string} oData.baseUrl
     *     The server relative base URL of this system such as <code>'/ENTERPRISE_SEARCH'</code>.
     *     <b>Note:</b> This has to correspond to an SAP Web Dispatcher routing rule.
     * @param {string} oData.platform
     *         The system platform such as <code>'abap'</code> or <code>'hana'</code>.
     *
     * @class A representation of a system
     * @constructor
     * @since 1.15.0
     * @public
     */
    var System = function (oData) {
        this._oData = oData;
    };

    /**
     * Returns this system's alias.
     *
     * @returns {string}
     *   this system's alias
     * @since 1.15.0
     */
    System.prototype.getAlias = function () {
        return this._oData.alias;
    };

    /**
     * Returns this system's base URL.
     *
     * @returns {string}
     *   this system's base URL
     * @since 1.15.0
     */
    System.prototype.getBaseUrl = function () {
        return this._oData.baseUrl;
    };

    /**
     * Returns this system's client.
     *
     * @returns {string}
     *   this system's client
     * @since 1.15.0
     */
    System.prototype.getClient = function () {
        return this._oData.client;
    };

    /**
     * Returns this system's name.
     *
     * @returns {string}
     *   this system's name
     * @since 1.15.0
     */
    System.prototype.getName = function () {
        return this._oData.system;
    };

    /**
     * Returns this system's platform.
     *
     * @returns {string}
     *   this system's platform ("abap", "hana" etc.)
     * @since 1.15.0
     */
    System.prototype.getPlatform = function () {
        return this._oData.platform;
    };

    /**
     * Adjusts the given URL so that it will be passed to this system.
     *
     * @param {string} sUrl
     *      the URL (which must be server-absolute)
     * @returns {string}
     *      the adjusted URL
     * @since 1.15.0
     */
    System.prototype.adjustUrl = function (sUrl) {
        /*jslint regexp:true */
        if (sUrl.indexOf('/') !== 0 || sUrl === '/') {
            throw new Error("Invalid URL: " + sUrl);
        }
        if (this._oData.baseUrl === ";o=") {
            if (this._oData.alias) {
                sUrl = sUrl + ";o=" + this._oData.alias;
            }
        } else if (this._oData.baseUrl) {
            sUrl = this._oData.baseUrl.replace(/\/$/, "") + sUrl;
        }
        if (this._oData.client) {
            sUrl += (sUrl.indexOf("?") >= 0 ? "&" : "?") + "sap-client=" + this._oData.client;
        }
        return sUrl;
    };

    System.prototype.toString = function () {
        return JSON.stringify(this._oData);
    };

	return System;
}, /* bExport= */ true);
