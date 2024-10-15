// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define(
    [
        'sap/ushell/components/CatalogsManager',
        'sap/ushell/resources',
        'sap/ui/core/UIComponent',
        'sap/ushell/components/homepage/ComponentKeysHandler',
        'sap/m/routing/Router',
        'sap/ushell/UserActivityLog',
        'sap/ushell/Config',
        'sap/ushell/bootstrap/common/common.load.model',
        "sap/ushell/components/SharedComponentUtils"
    ], function (
        CatalogsManager,
        resources,
        UIComponent,
        ComponentKeysHandler,
        Router,
        UserActivityLog,
        Config,
        oModelWrapper,
        oSharedComponentUtils
    ) {
    "use strict";

    return UIComponent.extend("sap.ushell.components.appfinder.Component", {

        metadata: {
            routing : {
                config: {
                    viewType: "JS",
                    controlAggregation : "detailPages",
                    controlId : "catalogViewMasterDetail",
                    clearAggregation: false,
                    routerClass : Router,
                    async: true
                },
                routes: []
            },

            version: "1.60.40",

            library: "sap.ushell.components.flp",

            dependencies: {
                libs: ["sap.m"]
            },
            config: {
                semanticObject: 'Shell',
                action: 'home',
                title: resources.i18n.getText("homeBtn_tooltip"),
                fullWidth: true,
                hideLightBackground: true
            }
        },

        parseOldCatalogParams: function (sUrl) {
            var mParameters = jQuery.sap.getUriParameters(sUrl).mParams,
                sValue,
                sKey;

            for (sKey in mParameters) {
                if (mParameters.hasOwnProperty(sKey)) {
                    sValue = mParameters[sKey][0];
                    mParameters[sKey] = sValue.indexOf('/') !== -1 ? encodeURIComponent(sValue) : sValue;
                }
            }
            return mParameters;
        },

        handleNavigationFilter: function (sNewHash) {
            var oShellHash =  sap.ushell.Container.getService("URLParsing").parseShellHash(sNewHash),
                mParameters;

            if (oShellHash && oShellHash.semanticObject === 'shell' && oShellHash.action === 'catalog') {
                mParameters = this.parseOldCatalogParams(sNewHash);
                setTimeout(function () {
                    this.getRouter().navTo("catalog", {filters : JSON.stringify(mParameters)});
                }.bind(this), 0);
                return this.oShellNavigation.NavigationFilterStatus.Abandon;
            }
            return this.oShellNavigation.NavigationFilterStatus.Continue;
        },

        createContent: function () {
            this.oRouter = this.getRouter();
            // should use a better way to find out how to get embedded state maybe...
            this.isEmbedded = !sap.ushell.Container.isMock;

            // model instantiated by the model wrapper
            this.oModel = oModelWrapper.getModel();
            this.setModel(this.oModel);

            // Model defaults are set now --- let`s continue.

            var sHash,
                oShellHash,
                mParameters,
                oComponentConfig,
                bPersonalizationActive = Config.last("/core/shell/enablePersonalization");

            //the catalog route should be added only if personalization is active
            if (bPersonalizationActive) {
                this.oRouter.addRoute({
                    name : "userMenu",
                    pattern : "userMenu/:filters:"
                });
                this.oRouter.addRoute({
                    name : "sapMenu",
                    pattern : "sapMenu/:filters:"
                });
                this.oRouter.addRoute({
                    name : "catalog",
                    pattern : ["catalog/:filters:", "", ":filters:"]
                });

                // trigger the reading of the homepage group display personalization
                // this is also needed when the app finder starts directly as the tab mode disables
                // the blind loading which is already prepared in the homepage manager
                oSharedComponentUtils.getEffectiveHomepageSetting("/core/home/homePageGroupDisplay", "/core/home/enableHomePageSettings");
            }

            var oCatalogsMgrData = {
                model : this.oModel,
                router : this.oRouter
            };
            this.oCatalogsManager = new CatalogsManager("dashboardMgr", oCatalogsMgrData);
            this.setModel(resources.i18nModel, "i18n");

            oSharedComponentUtils.toggleUserActivityLog();

            this.oShellNavigation = sap.ushell.Container.getService("ShellNavigation");

            //handle direct navigation with the old catalog intent format
            /*global hasher*/
            sHash = hasher.getHash();
            oShellHash =  sap.ushell.Container.getService("URLParsing").parseShellHash(sHash);
            if (oShellHash && oShellHash.semanticObject === 'shell' && oShellHash.action === 'catalog') {
                mParameters = this.parseOldCatalogParams(sHash);
                oComponentConfig = this.getMetadata().getConfig();
                this.oShellNavigation.toExternal({
                    target: {
                        semanticObject: oComponentConfig.semanticObject,
                        action: oComponentConfig.action
                    }
                });
                this.getRouter().navTo("catalog", {filters : JSON.stringify(mParameters)});
            }

            var oAppFinderView = sap.ui.view({
                id: "appFinderView",
                viewName: "sap.ushell.components.appfinder.AppFinder",
                type: "JS",
                async: true
            });

            return oAppFinderView;
        },

        exit : function () {
            this.oCatalogsManager.destroy();
            oModelWrapper.unsubscribeEventHandlers();
        }
    });

});
