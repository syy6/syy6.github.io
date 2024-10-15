// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

/**
 * @fileOverview This file contains miscellaneous utility functions for the window object.
 */
sap.ui.define([
    "sap/base/Log",
    "sap/ui/Device",
    "sap/ui/util/isCrossOriginURL"
], function (
    Log,
    Device,
    isCrossOriginURL
) {
    "use strict";

    var WindowUtils = {};

    /**
     * Checks a given URL for non-http(s) protocols.
     *
     * @param {string} URL The URL to be checked
     * @returns {boolean} result - true if protocol is http(s), false if not
     *
     * @private
     * @since 1.73.0
     */
    WindowUtils.hasInvalidProtocol = function (URL) {
        // IE 11 does not support URL objects (new URL(URLString)). To achieve a similar result we make use of the browsers built in parser
        var oURL = document.createElement("a");
        oURL.setAttribute("href", URL);
        if (oURL.protocol === "javascript:") { // eslint-disable-line no-script-url
            return true;
        }
        return false;
    };

    /**
     * Checks if the given urls origin is different from our own.
     *
     * Please note that this is just a wrapper function around a UI5 internal util to make it easily testable
     *
     * @param {string} url The URL to be checked
     * @returns {boolean} result - true if cross origin was detected
     *
     * @private
     * @since 1.85.0
     */
    WindowUtils.isCrossOriginUrl = function (url) {
        return isCrossOriginURL(url);
    };

    /**
     * Opens the provided URL. If "safeMode" parameter is true (default) the URL will be validated beforehand to avoid using non-http(s) protocols
     * See https://developer.mozilla.org/en-US/docs/Web/API/Window/open for detailed parameter descriptions
     *
     * To avoid vulnerabilities the opener is removed for cross-origin navigation
     * Please note that window.open does not return a reference to the new window object in case of a cross-origin scenario.
     * Due to this we return a boolean in this case so the caller is aware there was no error.
     *
     * @param {string} URL The URL to be opened
     * @param {string} [windowName] The name of the browsing content of the new window
     * @param {string} [windowFeatures] List of window features. Separated by a comma with NO whitespace. e.g.: "noopener,noreferrer"
     * @param {boolean} [safeMode=true] Determines if only the http(s) protocol is allowed
     * @returns {Window|boolean} The window object of the new tab or a boolean which is set to true if the operation was successful in case of a cross-origin scenario
     *
     * @private
     * @since 1.73.0
     */
    WindowUtils.openURL = function (URL, windowName, windowFeatures, safeMode) {
        var bSafeMode = (safeMode === undefined) ? true : safeMode,
            bIsCrossOriginUrl = this.isCrossOriginUrl(URL);

        windowFeatures = windowFeatures || "";

        if (bSafeMode && this.hasInvalidProtocol(URL)) {
            Log.fatal("Tried to open a URL with an invalid protocol");
            throw new Error("Tried to open a URL with an invalid protocol");
        }

        if (Device.browser.msie) {
            if (windowFeatures !== undefined && windowFeatures !== null) {
                Log.warning("WindowUtils.js - 'windowFeatures' is ignored for new windows in Internet Explorer.");
            }
            var oNewWindow = window.open("about:blank", windowName);

            if (bIsCrossOriginUrl) {
                oNewWindow.opener = null;
            }
            oNewWindow.location.href = URL;

            return bIsCrossOriginUrl ? true : oNewWindow;
        }

        if (bIsCrossOriginUrl) {
            if (windowFeatures.toLowerCase().indexOf("noopener") === -1) {
                if (windowFeatures !== "") {
                    windowFeatures += ",";
                }
                windowFeatures += "noopener";
            }
            if (windowFeatures.toLowerCase().indexOf("noreferrer") === -1) {
                windowFeatures += ",noreferrer";
            }

            window.open(URL, windowName, windowFeatures);
            return true;
        }

        return window.open(URL, windowName, windowFeatures);
    };

    return WindowUtils;
});