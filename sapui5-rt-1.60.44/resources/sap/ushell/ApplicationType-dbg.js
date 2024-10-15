// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ui/thirdparty/URI",
    "sap/ushell/utils",
    "sap/ushell/_ApplicationType/utils",
    "sap/ushell/_ApplicationType/systemAlias",
    "sap/ushell/_ApplicationType/wdaResolution",
    "sap/ushell/_ApplicationType/guiResolution",
    "sap/ushell/services/_ClientSideTargetResolution/ParameterMapping",
    "sap/ushell/Config"
], function (URI, oUtils, oApplicationTypeUtils, oSystemAlias, oWdaResolution, oGuiResolution, oParameterMapping, Config) {
    "use strict";

    /* global Promise */

    function generateWDAResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var oInbound = oMatchingTarget.inbound;
        var oResolutionResult = oInbound && oInbound.resolutionResult;
        if (
            !(!oInbound ||
                !oResolutionResult ||
                !(oResolutionResult["sap.wda"])
            )
        ) {
            return oWdaResolution.constructFullWDAResolutionResult(oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver);
        }

        if (
            !(!oInbound || !oResolutionResult)
        ) {
            return oWdaResolution.constructWDAResolutionResult(oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver);
        }

    }

    function generateWCFResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var oUri = new URI(sBaseUrl),
            oInbound = oMatchingTarget.inbound,
            oInboundResolutionResult = oInbound && oInbound.resolutionResult,
            oEffectiveParameters = jQuery.extend(true, {}, oMatchingTarget.mappedIntentParamsPlusSimpleDefaults),
            sSapSystem,
            sSapSystemDataSrc;

        if (oEffectiveParameters["sap-system"]) {
            sSapSystem = oEffectiveParameters["sap-system"][0];
            delete oEffectiveParameters["sap-system"];
        }

        if (oEffectiveParameters["sap-system-src"]) {
            sSapSystemDataSrc = oEffectiveParameters["sap-system-src"][0];
            delete oEffectiveParameters["sap-system-src"];
        }

        return new Promise(function (fnResolve, fnReject) {
            oSystemAlias.spliceSapSystemIntoURI(oUri, oInboundResolutionResult.systemAlias, sSapSystem, sSapSystemDataSrc, "WCF", oInboundResolutionResult.systemAliasSemantics || oSystemAlias.SYSTEM_ALIAS_SEMANTICS.apply, fnExternalSystemAliasResolver)
                .done(function (oURI) {
                    var sParameters = oApplicationTypeUtils.getURLParsing().paramsToString(oEffectiveParameters),
                        sFinalUrl = oApplicationTypeUtils.appendParametersToUrl(sParameters, oURI.toString());

                    var oResolutionResult = {
                        url: sFinalUrl,
                        text: "",
                        additionalInformation: "",
                        applicationType: "WCF",
                        fullWidth: true
                    };

                    fnResolve(oResolutionResult);
                })
                .fail(function (sError) {
                    fnReject(sError);
                });
        });
    }

    function generateUI5ResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var oInbound = oMatchingTarget.inbound,
            sUrlParams,
            sSapSystem,
            sSapSystemSrc,
            oEffectiveParameters,
            oResolutionResult = {};

        // propagate properties from the inbound in the resolution result
        // NOTE: we **propagate** applicationType here, as we want to handle URLs as well
        ["applicationType", "additionalInformation", "applicationDependencies"].forEach(function (sPropName) {
            if (oInbound.resolutionResult.hasOwnProperty(sPropName)) {
                oResolutionResult[sPropName] = oInbound.resolutionResult[sPropName];
            }
        });

        oResolutionResult.url = sBaseUrl;

        // urls are not required if:
        // - the UI5 specifies the manifestUrl among the application dependencies or
        // - the component is part of the dist layer
        if (oResolutionResult.applicationDependencies
            && typeof oResolutionResult.url === "undefined") {

            oResolutionResult.url = ""; // relative url
        }

        // empty urls are valid (they indicate relative url path). This happens in case of
        // app variants where the Component is located in the dist layer.
        if (typeof oResolutionResult.url === "undefined") {
            return Promise.reject("Cannot resolve intent: url was not specified in matched inbound");
        }

        // construct effective parameters including defaults
        oEffectiveParameters = jQuery.extend(true, {}, oMatchingTarget.mappedIntentParamsPlusSimpleDefaults);

        /*
         * Deal with reserved parameters
         *
         * Reserved parameters are removed from the result url and moved
         * to a separate section of the resolution result.
         */
        oResolutionResult.reservedParameters = {};
        var oReservedParameters = {
            //
            // Used by the RT plugin to determine whether the RT change was made
            // by a key user or by a end-user.
            //
            "sap-ui-fl-max-layer": true,
            //
            // Used by RTA to determine which control variant id(s) should be
            // selected when the application is loaded.
            //
            "sap-ui-fl-control-variant-id": true
        };
        Object.keys(oReservedParameters).forEach(function (sName) {
            var sValue = oEffectiveParameters[sName];
            if (sValue) {
                delete oEffectiveParameters[sName];
                oResolutionResult.reservedParameters[sName] = sValue;
            }

        });
        // don't list reserved parameters as defaulted
        oMatchingTarget.mappedDefaultedParamNames = oMatchingTarget.mappedDefaultedParamNames
            .filter(function (sDefaultedParameterName) {
                return !oReservedParameters[sDefaultedParameterName];
            });

        if (oMatchingTarget.mappedDefaultedParamNames.length > 0) {
            oEffectiveParameters["sap-ushell-defaultedParameterNames"] = [JSON.stringify(oMatchingTarget.mappedDefaultedParamNames)];
        }

        sSapSystem = oEffectiveParameters["sap-system"] && oEffectiveParameters["sap-system"][0];
        sSapSystemSrc = oEffectiveParameters["sap-system-src"] && oEffectiveParameters["sap-system-src"][0];

        // contrarily to the WDA case, in the SAPUI5 case sap-system and
        // sap-system-src are part of the final URL
        oResolutionResult["sap-system"] = sSapSystem;
        if (typeof sSapSystemSrc === "string") {
            oResolutionResult["sap-system-src"] = sSapSystemSrc;
        }

        oMatchingTarget.effectiveParameters = oEffectiveParameters;

        // prepare a proper URL!
        sUrlParams = oApplicationTypeUtils.getURLParsing().paramsToString(oEffectiveParameters);
        if (sUrlParams) {
            // append parameters to URL
            oResolutionResult.url = oResolutionResult.url + ((oResolutionResult.url.indexOf("?") < 0) ? "?" : "&") + sUrlParams;
        }

        // IMPORTANT: check for no ui5ComponentName to avoid adding it to URL types
        if (typeof oInbound.resolutionResult.ui5ComponentName !== "undefined") {
            oResolutionResult.ui5ComponentName = oInbound.resolutionResult.ui5ComponentName;
        }

        oResolutionResult.text = oInbound.title;

        return Promise.resolve(oResolutionResult);
    }

    function generateURLResolutionResult (oMatchingTarget, sBaseUrl, fnExternalSystemAliasResolver) {
        var oInbound = oMatchingTarget.inbound,
            oInboundResolutionResult = oInbound && oInbound.resolutionResult,
            oResolutionResult = {};

        // splice parameters into url
        var oURI = new URI(sBaseUrl);

        // construct effective parameters including defaults
        var oEffectiveParameters = jQuery.extend(true, {}, oMatchingTarget.mappedIntentParamsPlusSimpleDefaults);

        // a special hack to work around the AA modelling of Tile Intents in the export
        // the special intent Shell-launchURL with a dedicated parameter sap-external-url
        // which shall *not* be propagated into the final url
        if (oMatchingTarget.inbound && oMatchingTarget.inbound.action === "launchURL" && oMatchingTarget.inbound.semanticObject === "Shell") {
            delete oEffectiveParameters["sap-external-url"];
        }

        var sSapSystem = oEffectiveParameters["sap-system"] && oEffectiveParameters["sap-system"][0];
        var sSapSystemDataSrc = oEffectiveParameters["sap-system-src"] && oEffectiveParameters["sap-system-src"][0];

        // do not include the sap-system parameter in the URL
        oResolutionResult["sap-system"] = sSapSystem;
        delete oEffectiveParameters["sap-system"];

        // do not include the sap-system-src parameter in the URL
        if (typeof sSapSystemDataSrc === "string") {
            oResolutionResult["sap-system-src"] = sSapSystemDataSrc;
            delete oEffectiveParameters["sap-system-src"];
        }

        return (new Promise(function (fnResolve, fnReject) {
            if (oApplicationTypeUtils.absoluteUrlDefinedByUser(oURI, oInboundResolutionResult.systemAlias, oInboundResolutionResult.systemAliasSemantics)) {
                fnResolve(sBaseUrl);
            } else {
                oSystemAlias.spliceSapSystemIntoURI(oURI, oInboundResolutionResult.systemAlias, sSapSystem, sSapSystemDataSrc, "URL", oInboundResolutionResult.systemAliasSemantics || oSystemAlias.SYSTEM_ALIAS_SEMANTICS.applied, fnExternalSystemAliasResolver)
                    .fail(fnReject)
                    .done(function (oSapSystemURI) {
                        var sSapSystemUrl = oSapSystemURI.toString();
                        fnResolve(sSapSystemUrl);
                    });
            }
        }))
        .then(function (sUrlWithoutParameters) {
            var sParameters = oApplicationTypeUtils.getURLParsing().paramsToString(oEffectiveParameters);
            var sFLPURLDetectionPattern = Config.last("/core/navigation/flpURLDetectionPattern");
            var rFLPURLDetectionRegex = new RegExp(sFLPURLDetectionPattern);

            return rFLPURLDetectionRegex.test(sUrlWithoutParameters)
                ? oApplicationTypeUtils.appendParametersToIntentURL(oEffectiveParameters, sUrlWithoutParameters)
                : oApplicationTypeUtils.appendParametersToUrl(sParameters, sUrlWithoutParameters);

        }, Promise.reject.bind(Promise))
        .then(function (sUrlWithParameters) {
            // propagate properties from the inbound in the resolution result
            ["additionalInformation", "applicationDependencies"].forEach(function (sPropName) {
                if (oInbound.resolutionResult.hasOwnProperty(sPropName)) {
                    oResolutionResult[sPropName] = oInbound.resolutionResult[sPropName];
                }
            });

            oResolutionResult.url = sUrlWithParameters;
            oResolutionResult.text = oInbound.title;
            oResolutionResult.applicationType = "URL";

            return Promise.resolve(oResolutionResult);
        }, Promise.reject.bind(Promise));
    }



    var oApplicationType = {
        /**
         * This type represents web applications identified by any uniform resource locator. They
         * will be embedded into an <code>IFRAME</code>.
         *
         * @constant
         * @default "URL"
         * @name sap.ushell.components.container.ApplicationType.URL
         * @since 1.15.0
         * @type string
         */
        URL: {
            type: "URL",
            generateResolutionResult: generateURLResolutionResult,
            easyAccessMenu: {
                intent: "Shell-startURL",
                resolver: null,
                showSystemSelectionInUserMenu: true,
                showSystemSelectionInSapMenu: false,
                systemSelectionPriority: 1
            }
        },
        /**
         * This type represents applications built with Web Dynpro for ABAP. The embedding
         * container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "WDA"
         * @name sap.ushell.components.container.ApplicationType.WDA
         * @since 1.15.0
         * @type string
         */
        WDA: {
            type: "WDA",
            generateResolutionResult: generateWDAResolutionResult,
            easyAccessMenu: {
                intent: "Shell-startWDA",
                resolver: oWdaResolution.resolveEasyAccessMenuIntentWDA,
                showSystemSelectionInUserMenu: true,
                showSystemSelectionInSapMenu: true,
                systemSelectionPriority: 2 // preferred over URL
            }
        },
        /**
         * This type represents transaction applications.
         * The embedding container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "TR"
         * @name sap.ushell.components.container.ApplicationType.TR
         * @since 1.36.0
         * @type string
         */
        TR: {
            type: "TR",
            generateResolutionResult: oGuiResolution.generateTRResolutionResult,
            easyAccessMenu: {
                intent: "Shell-startGUI",
                resolver: oGuiResolution.resolveEasyAccessMenuIntentWebgui,
                showSystemSelectionInUserMenu: true,
                showSystemSelectionInSapMenu: true,
                systemSelectionPriority: 3 // startGUI titles are preferred over WDA and URL
            }
        },
        /**
         * This type represents applications embedded via NetWeaver Business Client.
         * The embedding container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "NWBC"
         * @name sap.ushell.components.container.ApplicationType.NWBC
         * @since 1.19.0
         * @type string
         */
        NWBC: {
            type: "NWBC"
            // there is no input application type like this
        },
        /**
         * This type represents applications embedded via Windows Communication Foundation.
         * The embedding container knows how to embed such applications in a smart way.
         *
         * @constant
         * @default "WCF"
         * @name sap.ushell.components.container.ApplicationType.WCF
         * @since 1.56.0
         * @type string
         */
        WCF: {
            type: "WCF",
            generateResolutionResult: generateWCFResolutionResult
        },
        SAPUI5: {
            type: "SAPUI5",
            generateResolutionResult: generateUI5ResolutionResult
        }
    };

    function getEasyAccessMenuDefinitions () {
        return Object.keys(oApplicationType)
            .map(function (sApplicationType) {
                return oApplicationType[sApplicationType];
            })
            .filter(function (oApplicationTypeDefinition) {
                return typeof oApplicationTypeDefinition.easyAccessMenu === "object";
            });
    }

    function createEasyAccessMenuResolverGetter () {
        var oEasyAccessMenuIntentResolver = {};
        getEasyAccessMenuDefinitions()
            .forEach(function (oApplicationTypeDefinitionWithEasyAccessMenu) {
                oEasyAccessMenuIntentResolver[
                    oApplicationTypeDefinitionWithEasyAccessMenu.easyAccessMenu.intent
                ] = oApplicationTypeDefinitionWithEasyAccessMenu.easyAccessMenu.resolver;
            });

        return function (sMaybeEasyAccessMenuIntent) {
            return oEasyAccessMenuIntentResolver[sMaybeEasyAccessMenuIntent];
        };
    }

    var oMethods = {
        getEasyAccessMenuResolver: createEasyAccessMenuResolverGetter(),
        getEasyAccessMenuDefinitions: getEasyAccessMenuDefinitions
    };

    Object.keys(oMethods).forEach(function (sMethodName) {
        Object.defineProperty(oApplicationType, sMethodName, {
            value: oMethods[sMethodName]
        });
    });

    return oApplicationType;

}, /* bExport= */ false);
