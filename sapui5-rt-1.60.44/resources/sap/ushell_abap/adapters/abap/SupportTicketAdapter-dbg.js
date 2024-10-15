// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview The SupportTicket adapter for the ABAP platform.
 *
 * @version 1.60.40
 */
sap.ui.define([
    "sap/ui2/srvc/ODataWrapper",
    "sap/ui2/srvc/ODataService",
    "sap/ushell/utils",
    "sap/ushell/resources"
], function (ODataWrapper, ODataService, utils, resources) {
    "use strict";

    return function (oSystem) {

        /**
         * Convert the clientContext JSON into a human-readable form
         *
         * @param {JSON} oJson  object containing details about context
         * @return {string} Human-readable representation of the JSON object
         *
         * @since 1.19.1
         * @private
         */
        function convertToReadable (oJson) {
            var sConvertedJson;

            if (oJson && !jQuery.isEmptyObject(oJson)) {
                sConvertedJson = JSON.stringify(oJson);
                return sConvertedJson
                    .replace(/\{|\}|\\n|,/g, "\n");
            }
            return "";
        }

        /**
         * Creates a support ticket in the backend system
         *
         * @param {object} oSupportTicketData object containing the input fields required for
         *      the support ticket.
         *
         * @returns {Promise} Promise
         *
         * @since 1.19.1
         * @private
         */
        this.createTicket = function (oSupportTicketData) {
            var oDeferred,
                sBaseUrl = "/sap/opu/odata/UI2/INTEROP/",
                sRelativeUrl = "Messages",
                sUrl,
                sHash,
                sCatalogId,
                oDataWrapper,
                oContainer = sap.ushell.Container;

            // text is mandatory for ABAP backend OData service
            if (!oSupportTicketData.text) {
                throw new sap.ushell.utils.Error("Support Ticket data does not contain text member");
            }

            sUrl = jQuery.sap.getObject("clientContext.navigationData.applicationInformation.url", 0, oSupportTicketData);
            sHash = jQuery.sap.getObject("clientContext.navigationData.navigationHash", 0, oSupportTicketData);
            sCatalogId = jQuery.sap.getObject("clientContext.navigationData.tileDebugInfo", 0, oSupportTicketData);

            sUrl = typeof sUrl === "string" ? sUrl : "";
            sHash = typeof sHash === "string" ? sHash : "";
            sCatalogId = typeof sCatalogId === "string" ? JSON.parse(sCatalogId).catalogId || '' : "";

            oSupportTicketData.url = sUrl;
            oSupportTicketData.catalogId = sCatalogId;
            oSupportTicketData.subject = resources.i18n.getText("contactSupport.Subject", [
                oContainer.getLogonSystem().getName() + "-" + oContainer.getLogonSystem().getClient(),
                oContainer.getUser().getId()
            ]).substring(0, 40);
            oSupportTicketData.hash = sHash;
            oSupportTicketData.clientContext = convertToReadable(oSupportTicketData.clientContext);

            oDeferred = new jQuery.Deferred();
            var oODataWrapperSettings = {
                baseUrl:     sBaseUrl,
                'sap-language': oContainer.getUser().getLanguage(),
                'sap-client': oContainer.getLogonSystem().getClient()
            };
            oDataWrapper = new sap.ui2.srvc.createODataWrapper(oODataWrapperSettings);
            sap.ui2.srvc.ODataService.call(this, oDataWrapper, function () {
                return false;
            });

            oDataWrapper.create(sRelativeUrl, oSupportTicketData, function (response) {
                oDeferred.resolve(response.messageNumber);
            }, function (sErrorMessage) {
                oDeferred.reject(sErrorMessage);
            });

            return oDeferred.promise();
        };
    };
}, true /* bExport */);