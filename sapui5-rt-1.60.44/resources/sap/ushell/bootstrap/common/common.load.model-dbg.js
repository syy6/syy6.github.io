// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define(
    [
        'sap/ushell/Config',
        'sap/ui/model/json/JSONModel'
    ], function (
        Config,
        JSONModel
    ) {
        "use strict";

        var _oModel = undefined,
            oModelWrapper,
            oSubscriptions;

        function _instantiateModel () {
            var oShellCoreConfigFromConfig = Config.last("/core"),
                sAnimationMode = undefined;

            // Uncomment this to merge. This was only executed in case !sap.ushell.Container.isMock == true
            //    sAnimationMode = sap.ushell.Container.getRenderer('fiori2').getModelConfiguration().animationMode;

            var oInitialConfig = {
                animationMode: sAnimationMode ? sAnimationMode: oShellCoreConfigFromConfig.shell.animationMode,
                groups : [],
                rtl: sap.ui.getCore().getConfiguration().getRTL(),
                personalization: oShellCoreConfigFromConfig.shell.enablePersonalization,
                tagList : [],
                selectedTags : [],
                userPreferences : {
                    entries : []
                },
                enableNotificationsPreview: oShellCoreConfigFromConfig.notifications.enableNotificationsPreview,
                enableHelp: oShellCoreConfigFromConfig.extension.enableHelp, // xRay enablement configuration
                previewNotificationItems: [],
                enableTileActionsIcon: sap.ui.Device.system.desktop ? oShellCoreConfigFromConfig.home.enableTileActionsIcon : false
            };

            // Merge configurations (#extend merges from left to right, overwriting setted values)
            // Catalog configuration kept just in case
            oInitialConfig = jQuery.extend(
                {},
                oShellCoreConfigFromConfig.catalog,
                oShellCoreConfigFromConfig.home,
                oInitialConfig
            );

            _oModel = new JSONModel(oInitialConfig);
            _oModel.setSizeLimit(10000); // override default of 100 UI elements on list bindings

        }

        function _triggerSubscriptions () {
            //TODO move to Renderer.js - decide if needed to move or not
            sap.ui.getCore().getEventBus().subscribe("shell", "changeNotificationPreview", oSubscriptions._updateNotificationPreview, this);
            sap.ui.getCore().getEventBus().subscribe('launchpad', 'afterSwitchState', oSubscriptions._handleShellViewPortSateChange, this);
            var mediaQ = window.matchMedia("(min-width: 800px)");

            // condition check if mediaMatch supported(Not supported on IE9)
            if (mediaQ.addListener) {
                mediaQ.addListener(oSubscriptions._handleMedia);
                oSubscriptions._handleMedia(mediaQ);
            }
        }

        function _unsubscribeEventHandlers () {
            sap.ui.getCore().getEventBus().unsubscribe("shell", "changeNotificationPreview", oSubscriptions._updateNotificationPreview, this);
            sap.ui.getCore().getEventBus().unsubscribe('launchpad', 'afterSwitchState', oSubscriptions._handleShellViewPortSateChange, this);
        }

        oSubscriptions = {
            _handleMedia: function (mq) {
                _oModel.setProperty("/isPhoneWidth", !mq.matches);
            },
            _updateNotificationPreview: function (sChannelId, sEventId, oData) {
                var oPreviewFlags = oData;
                _oModel.setProperty("/userEnableNotificationsPreview", oPreviewFlags.bUserEnableNotificationsPreview);
                _oModel.setProperty("/configEnableNotificationsPreview", oPreviewFlags.bConfigEnableNotificationsPreview);
                if (oPreviewFlags.bMainFlagExists === true) {
                    _oModel.setProperty("/enableNotificationsPreview", oPreviewFlags.bEnableNotificationsPreview);
                }
            },
            _handleShellViewPortSateChange: function (sNameSpace, sEventName, oEventData) {
                var sCurrentShellViewportState = oEventData ? oEventData.getParameter('to') : '';
                _oModel.setProperty('/viewPortState', sCurrentShellViewportState);
            }
        };

        // Wrappers for specific initial configuration. We will ahve to move config here or just erase
        // these two methods.
        function _updateModelForHomepage() {
            // Placeholder for additional Homepage fine-tuning
            return;
        }

        function _updateModelForCatalog() {
            // Placeholder for additional Catalog fine-tuning
            return;
        }

        function _getModel() {
            if (_oModel === undefined) {
                _instantiateModel();
                _triggerSubscriptions();
            }
            return _oModel;
        }

        oModelWrapper = {
            getModel: _getModel,
            updateModelForCatalog: _updateModelForCatalog,
            updateModelForHomepage: _updateModelForHomepage,
            unsubscribeEventHandlers: _unsubscribeEventHandlers
        };

        return oModelWrapper;
});