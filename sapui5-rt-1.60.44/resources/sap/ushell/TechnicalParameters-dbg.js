// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileoverview
 *
 * The technical parameters defined in this file, get filtered from the intent
 * and the inbound during clientside target resolution and get forwarded in the
 * resolution result.
 *
 * @private
 */
sap.ui.define([
    "sap/ushell/utils/type"
], function (oTypeUtils) {
    "use strict";

    var oTechnicalParameters = {
        //
        // Used by the about button to inform the user about the id of the
        // current application.
        //
        "sap-fiori-id": {
            getValue: function (sParameterName, oApplicationComponent, oApplicationContainer, sApplicationType) {
                return new Promise(function (fnSuccess, fnFail) {
                    if (sApplicationType === "UI5") {
                        fnSuccess(getValueFromComponent(sParameterName, oApplicationComponent) || getValueFromManifest('/sap.fiori/registrationIds', oApplicationComponent));
                    } else {
                        fnSuccess(getValueFromContainer(sParameterName, oApplicationContainer));
                    }
                });
            }
        },
        //
        // Used by the RT plugin to determine whether the RT change was made
        // by a key user or by a end-user.
        //
        "sap-ui-fl-max-layer": {
            getValue: function (sParameterName, oApplicationComponent) {
                return Promise.resolve().then(getValueFromComponent.bind(null, sParameterName, oApplicationComponent));
            }
        },
        //
        // Used by RTA to determine which control variant id(s) should be
        // selected when the application is loaded.
        //
        "sap-ui-fl-control-variant-id": {
            getValue: function (sParameterName, oApplicationComponent) {
                return Promise.resolve().then(getValueFromComponent.bind(null, sParameterName, oApplicationComponent));
            }
        },
        //
        // Used in CDM 3.0 based FLPs to navigate to specific applications.
        // The parameter should never be passed to the target application, or
        // exposed via public APIs.
        //
        "sap-ui-app-id-hint": {
            getValue: denyParameterValue
        },
        //
        // The application component hierarchy (ACH) will for WDA and SAPGui
        // apps be provided as part of the configuration string of the target
        // mapping.
        // For UI5 apps it is contained in the app descriptor / manifest.
        //
        "sap-ach": {
            getValue: function (sParameterName, oApplicationComponent, oApplicationContainer, sApplicationType) {
                return new Promise(function (fnSuccess, fnFail) {
                    if (sApplicationType === "UI5") {
                        fnSuccess(getValueFromComponent(sParameterName, oApplicationComponent) || getValueFromManifest('/sap.app/ach', oApplicationComponent));
                    } else {
                        fnSuccess(getValueFromContainer(sParameterName, oApplicationContainer));
                    }
                });
            }
        }
    };

    /**
     * Helper method to deny access to a technical value
     *
     * @param {string} sParameterName
     *
     * @private
     */
    function denyParameterValue (sParameterName) {
        return Promise.reject(sParameterName + " is reserved for shell internal usage only");
    }

    /**
     * Helper method to obtain a technical value directly from the application component.
     * This is the case if the current applicationtype is not "UI5".
     *
     * @param {string} sParameterName
     * the name of the parameter
     * @param {object} oApplicationComponent
     * the component of the given application
     *
     * @returns {array}
     * returns an array of results for the given parameter name from the application component
     */
    function getValueFromComponent (sParameterName, oApplicationComponent) {
        return oApplicationComponent.getComponentData().technicalParameters[sParameterName];
    }

    /**
     * Helper method to obtain a technical value from the application component manifest.
     * This is the case if the current applicationtype is "UI5".
     *
     * @param {string} sPath
     * the path where to find the parameter
     * @param {object} oApplicationComponent
     * the component of the given application
     *
     * @returns {array}
     * returns an array of results for the given path from the application component manifest
     */
    function getValueFromManifest (sPath, oApplicationComponent) {
        var oMetaData = oApplicationComponent.getMetadata() ? oApplicationComponent.getMetadata() : undefined;
        var vValue = oMetaData.getManifestEntry(sPath);
        if (!oTypeUtils.isArray(vValue)) {
            vValue = [vValue];
        }
        return vValue;
    }

    /**
     * Helper method to obtain a technical value from the application container.
     * This is the case if the current applicationtype is not "UI5".
     *
     * @param {string} sParameterName
     * the name of the parameter
     * @param {object} oApplicationContainer
     * the container of the given application
     *
     * @returns {array}
     * returns an array of results for the given parameter name from the application container
     */
    function getValueFromContainer (sParameterName, oApplicationContainer) {
        return oApplicationContainer.getReservedParameters()[sParameterName];
    }

    /**
     * Method to obtain the value of a technical parameter
     *
     * @param {string} sParameterName
     * the name of the parameter
     * @param {object} oApplicationComponent
     * the component of the given application (only needed for UI5 applications)
     * @param {object} oApplicationContainer
     * the container of the given application (only needed for non UI5 applications)
     * @param {string} sApplicationType
     * the applicationtype, inorder to deceide on how to get the value
     *
     * @returns {Promise}
     * returns a promise that resolve with array of all values, belonging to the
     * given parameter name or rejects with an error message. An array is returned
     * because multiple values might exist for a given technical parameter.
     *
     * @private
     */
    function getParameterValue (sParameterName, oApplicationComponent, oApplicationContainer, sApplicationType) {
        if (!oTechnicalParameters[sParameterName]) {
            return Promise.reject(sParameterName + " is not a known technical parameter");
        }

        return oTechnicalParameters[sParameterName].getValue(sParameterName, oApplicationComponent, oApplicationContainer, sApplicationType);
    }

    /**
     * Method to obtain an array of all parameter names
     *
     * @returns {array}
     * returns an array of all technical parameter names defined in this file
     *
     * @private
     */
    function getParameterNames () {
        return Object.keys(oTechnicalParameters);
    }

    /**
     * Checks whether the given parameter is a technical parameter.
     *
     * @param {string} sParameterName
     *
     * @return {boolean}
     *
     *  Whether the given parameter name is a technical parameter
     */
    function isTechnicalParameter (sParameterName) {
        return oTechnicalParameters.hasOwnProperty(sParameterName);
    }

    return {
        getParameterValue: getParameterValue,
        getParameterNames: getParameterNames,
        isTechnicalParameter: isTechnicalParameter
    };

}, false /* bExport= */);
