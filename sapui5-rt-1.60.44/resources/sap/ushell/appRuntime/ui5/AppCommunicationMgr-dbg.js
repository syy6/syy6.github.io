// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/appRuntime/ui5/AppRuntimePostMessage",
    "sap/ui/thirdparty/jquery",
    "sap/base/util/ObjectPath",
    "sap/base/Log",
    "sap/ui/thirdparty/URI"
], function (AppRuntimePostMessageAPI, jQuery, ObjectPath, Log, URI) {
    "use strict";

    var CURR_OBJ_ID = "sap.ushell.appRuntime.ui5.AppCommunicationMgr";

    var oShellCommunicationHandlersObj,
        oTunnelBank = {},
	    oTunnelCallbackBank = {},
        UUID = 0,
        arrPostResultPromises = [],
        iPostIDCount = 0;

    function AppCommunicationMgr () {
        this.init = function () {
            var that = this;
            oShellCommunicationHandlersObj = AppRuntimePostMessageAPI.getHandlers();
            AppRuntimePostMessageAPI.registerCommunicationHandler("sap.ushell.PostMessage", {
                    oInboundActions: {
                        "callTunnelFunction": {
                            executeServiceCallFn: function (oServiceParams) {
                                var content = oServiceParams.oMessageData.body.content,
                                    aArgs = that.restoreArray(content.arguments);
                                oTunnelBank[content.UUID].fnCallback.apply(this, Object.values(aArgs));
                                return new jQuery.Deferred().resolve().promise();
                            }
                        }
                    }
                }
            );
            that.handleMessageEvent = AppCommunicationMgr.prototype._handleMessageEvent.bind(that, that);
            addEventListener("message", that.handleMessageEvent);
        };

	    this.restoreArray = function(oArr) {
		    var aArr = [],
			    index = 0;
		    while (oArr[index]) {
			    aArr.push(oArr[index]);
			    index++;
		    }

		    return aArr;
	    };

        this.destroy = function () {
            removeEventListener("message", this.handleMessageEvent);
        };

        this._handleMessageResponse = function (oMessageData) {
            if (oMessageData.request_id && arrPostResultPromises[oMessageData.request_id]) {
                var oResPromise = arrPostResultPromises[oMessageData.request_id];
                if (oMessageData.status === "success") {
                    oResPromise.resolve(oMessageData.body.result);
                } else {
                    oResPromise.reject();
                }
            }
        };

        this._handleMessageRequest = function (oContainer, oMessage, oMessageData) {
            var that = this,
                oPostMessageServiceConfig = ObjectPath.create("sap-ushell-config.services.PostMessage.config"),
                sService = oMessageData && oMessageData.service,
                arrServiceNameParts,
                sServiceName,
                sServiceAction,
                oMatchHandler,
                oServiceCall;

            Log.debug("App Runtime received post message request from origin '" + oMessage.origin + "': "
                + JSON.stringify(oMessageData),
                null,
                CURR_OBJ_ID);

            if (!sService) {
                return;
            }

            if (oPostMessageServiceConfig && oPostMessageServiceConfig.enabled === false) {
                Log.warning("App Runtime received message for " + sServiceName + ", but this " +
                    "feature is disabled. It can be enabled via launchpad configuration " +
                    "property 'services.PostMessage.config.enabled: true'",
                    undefined,
                    CURR_OBJ_ID);
                this.sendResponseMessage(oMessage, oMessageData, "error", {message: "feature disabled"});
                return;
            }

            if (!this._isTrustedPostMessageSource(oContainer, oMessage)) {
                // log w/ warning level, message would normally processed by us
                Log.warning("App Runtime received message from untrusted origin '" + oMessage.origin + "': "
                    + JSON.stringify(oMessage.data),
                    null,
                    CURR_OBJ_ID);
                this.sendResponseMessage(oMessage, oMessageData, "error", {message: "Invalid request"});
                return;
            }

            if (sService.indexOf(".") > 0) {
                arrServiceNameParts = sService.split(".");
                sServiceAction = arrServiceNameParts[arrServiceNameParts.length-1];
                sServiceName = sService.substr(0, sService.length-sServiceAction.length-1);
            } else {
                this.sendResponseMessage(oMessage, oMessageData, "error", {message: "Invalid service name: '" + sService + "'"});
                return;
            }

            var oServiceParams = {
                oMessage: oMessage,
                oMessageData: oMessageData,
                oContainer: oContainer
            };

            try {
                oMatchHandler = oShellCommunicationHandlersObj[sServiceName];
                oServiceCall = oMatchHandler && oMatchHandler.oInboundActions[sServiceAction];
                if (oServiceCall && oServiceCall.executeServiceCallFn) {
                    oServiceCall.executeServiceCallFn(oServiceParams).done(function (oResult) {
                        that.sendResponseMessage(oMessage, oMessageData, "success", {result: oResult});
                    }).fail(function (sMessage) {
                        that.sendResponseMessage(oMessage, oMessageData, "error", {message: sMessage});
                    });
                } else {
                    this.sendResponseMessage(oMessage, oMessageData, "error", {message: "Unknown service name: '" + oMessageData.service + "'"});
                }
            } catch (oError) {
                this.sendResponseMessage(oMessage, oMessageData, "error", {message: oError.message});
            }
        };

        this._getCFLPWindow = function () {
            return window.parent;
        };

        /**
         * Determine if the source of a received postMessage can be considered as trusted. We consider
         * the content window of the application container's iframe as trusted
         *
         * @param {object} oContainer
         *   the application container instance
         * @param {object} oMessage
         *   the postMessage event object
         * @returns {boolean}
         *   true if source is considered to be trustworthy
         * @private
         */
        this._isTrustedPostMessageSource = function (oContainer, oMessage) {
            var bTrusted = false,
                oParent = oContainer._getCFLPWindow();

            if (oParent) {
                // In case the app runs in iFrame we trust the iframe itself and all the URLs from the same origin
                // as configured in iFrame.
                // oUri = URI(oParent.src || window.location && window.location.href || '');
                // sOrigin = oUri.protocol() + "://" + oUri.host();

                bTrusted = (oMessage.source === oParent);
            }

            return bTrusted;
        };

        this.sendResponseMessage = function (oMessage, oMessageData, sStatus, oBody) {
            var sResponseData = this.stringify({
                type: "response",
                service: oMessageData.service,
                request_id: oMessageData.request_id,
                status: sStatus,
                body: oBody
            });

            Log.debug("Sending post message response to origin ' " + oMessage.origin + "': "
                + sResponseData,
                null,
                CURR_OBJ_ID);

            if (typeof oMessage.source !== "object" || oMessage.source === null) {
                Log.debug("Cannot send response message to origin ' " + oMessage.origin,
                    "`source` member of request message is not an object",
                    CURR_OBJ_ID);

                return;
            }

            oMessage.source.postMessage(sResponseData, oMessage.origin);
        };

        this._getTargetWindow = function () {
            return window.parent;
        };

        this.postMessage = function (oMessage) {
            var msg,
                target = this._getTargetWindow();

            if (oMessage) {
                try {
                    if (oMessage.type === "request" && !oMessage.request_id) {
                        oMessage.request_id = this.getId();
                    }
                    msg = this.stringify(oMessage);
                    target.postMessage(msg, "*");
                } catch (ex) {
                    Log.error(
                        "Message '" + oMessage + "' cannot be posted: " + ex,
                        "sap.ui5Isolation.AppCommunicationMgr"
                    );
                }
            }
        };

        this.sendMessageToOuterShell = function (sMessageId, oParams, sRequestId) {
            var oDeferred = new jQuery.Deferred(),
                oMsg = {
                    "type": "request",
                    "service": sMessageId,
                    "body": (oParams || {}),
                    "request_id": sRequestId
            };

            this.postMessage(oMsg);
            arrPostResultPromises[oMsg.request_id] = oDeferred;
            return oDeferred.promise();
        };

        this.getId = function () {
            return "SAPUI5_APPRUNTIME_MSGID_" + (++iPostIDCount);
        };
    }

    AppCommunicationMgr.prototype._handleMessageEvent = function (oContainer, oMessage) {
        if (oMessage === undefined) {
            return;
        }

        var oMessageData = oMessage.data;

        if (typeof oMessageData === "string") {
            // it's possible that the data attribute is passed as string (IE9)
            try {
                oMessageData = this.parse(oMessage.data, this);
            } catch (e) {
                // could be some message which is not meant for us, so we just log with debug level
                Log.debug(
                    "Message received from origin '" + oMessage.origin + "' cannot be parsed: " + e,
                    oMessageData,
                    CURR_OBJ_ID
                );
                return;
            }
        }

        if (oMessageData.type === "request") {
            return oContainer._handleMessageRequest(oContainer, oMessage, oMessageData);
        } else if (oMessageData.type === "response") {
            return oContainer._handleMessageResponse(oMessageData);
        }
    };

    AppCommunicationMgr.prototype.stringify = function (oData) {
        var createTunnel = function (fnCallback) {
                if (oTunnelBank[fnCallback]) {
                    return {
                        type: "tunnel",
                        UUID: oTunnelBank[fnCallback]
                    };
                }
                UUID++;
                //store mapping for reverse proxy

                oTunnelBank[UUID] = {
                    fnCallback: fnCallback
                };
                oTunnelBank[fnCallback] = UUID;

                //Store org & ctx in a bank
                //create descriptor that will enable the creation of the tunnel function on the Isolated domain/

                return {
                    type: "tunnel",
                    UUID: UUID
                };
            },
            cache = [],
            sResult = JSON.stringify(oData, function (key, value) {
                if (value !== null) {
                    if (typeof value === 'object' || typeof value === "function") {
                        if (cache.indexOf(value) !== -1) {
                            // Duplicate reference found, discard key
                            return;
                        }
                        // Store value in our collection
                        cache.push(value);
                    }
                }

                if (typeof value === "function") {
                    var nUUID = oTunnelCallbackBank[value];

                    if (nUUID) {
                        return {
                            type: "reversetunnel",
                            UUID: nUUID
                        };
                    }
                    return createTunnel(value);

                }
                return value;

            });

        return sResult;
    };


    AppCommunicationMgr.prototype.parse = function (sData, oCtx) {

        return JSON.parse(sData, function (key, value) {
            if (value && value.type === "tunnel") {
                var cbFunc = function () {
                    //send a post message with the ID UUID and the parametes to the outer shell.
                    return oCtx.sendMessageToOuterShell(
                        "sap.ushell.PostMessage.callTunnelFunction", {
                            "content": {
                                UUID: value.UUID,
                                arguments: arguments
                            }
                        }
                    );

                };

                oTunnelCallbackBank[cbFunc] = value.UUID;
                return cbFunc;
            } else if (value && value.type === "reversetunnel") {
	            return oTunnelBank[value.UUID].fnCallback;
            }
                return value;

        });
    };

    return new AppCommunicationMgr();

}, false);
