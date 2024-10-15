// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define(
    [
        'sap/ushell/components/HomepageManager',
        'sap/ushell/resources',
        'sap/ui/core/UIComponent',
        'sap/ushell/components/homepage/ComponentKeysHandler',
        'sap/ushell/UserActivityLog',
        'sap/ushell/Config',
        'sap/ushell/bootstrap/common/common.load.model',
        "sap/ushell/components/SharedComponentUtils"
    ], function (
        HomepageManager,
        resources,
        UIComponent,
        ComponentKeysHandler,
        UserActivityLog,
        Config,
        oModelWrapper,
        oSharedComponentUtils
    ) {
    "use strict";

    return UIComponent.extend("sap.ushell.components.homepage.Component", {

        metadata: {
            version: "1.60.40",

            library: "sap.ushell.components.homepage",

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

        init: function () {

            // Tried to extract almost all of createContent.
            //this.isEmbedded = !sap.ushell.Container.isMock;

            // model instantiated by the model wrapper
            this.oModel = oModelWrapper.getModel();
            this.setModel(this.oModel);

            // This needs to be called _after_ the model is created
            UIComponent.prototype.init.apply(this, arguments);

            //TODO: Please remove all 'NewHomepageManager' references after complete alignment!
            var oDashboardMgrData = {
                model : this.oModel,
                view : this.oDashboardView
            };
            this.oHomepageManager = new HomepageManager("dashboardMgr",oDashboardMgrData);

            this.setModel(resources.i18nModel, "i18n");

            sap.ui.getCore().getEventBus().subscribe("sap.ushell.services.UsageAnalytics", "usageAnalyticsStarted", function () {
                sap.ui.require(["sap/ushell/components/homepage/FLPAnalytics"]);
            });

            oSharedComponentUtils.toggleUserActivityLog();

            //don't use the returned promise but register to the config change
            //for future config changes
            oSharedComponentUtils.getEffectiveHomepageSetting("/core/home/homePageGroupDisplay", "/core/home/enableHomePageSettings");
            Config.on("/core/home/homePageGroupDisplay").do(function (sNewDisplayMode) {
                this.oHomepageManager.handleDisplayModeChange(sNewDisplayMode);
            }.bind(this));

            oSharedComponentUtils.getEffectiveHomepageSetting("/core/home/sizeBehavior", "/core/home/sizeBehaviorConfigurable");
            Config.on("/core/home/sizeBehavior").do(function (sSizeBehavior) {
                var oModel = this.oHomepageManager.getModel();

                oModel.setProperty("/sizeBehavior", sSizeBehavior);
            }.bind(this));

            this.setInitialConfiguration();
        },

        createContent: function () {
            this.oDashboardView = sap.ui.view({
                viewName: "sap.ushell.components.homepage.DashboardContent",
                type: "JS",
                async: true
            });
            return this.oDashboardView;
        },

        setInitialConfiguration: function () {
            sap.ui.getCore().getEventBus().publish("launchpad", "initialConfigurationSet");
        },

        exit : function () {
            oModelWrapper.unsubscribeEventHandlers();
            this.oHomepageManager.destroy();
        }
    });

});
