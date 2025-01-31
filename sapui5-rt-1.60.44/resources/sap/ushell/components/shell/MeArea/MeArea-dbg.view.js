// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
sap.ui.define([
    "sap/ushell/services/AppType",
    "sap/m/Button",
    "sap/m/List",
    "sap/m/Text",
    "sap/m/VBox",
    "sap/m/HBox",
    "sap/m/Image",
    "sap/m/Dialog",
    "sap/m/Popover",
    "sap/m/OverflowToolbar",
    "sap/m/ScrollContainer",
    "sap/ushell/Config",
    "sap/ushell/renderers/fiori2/AccessKeysHandler",
    "sap/ushell/resources",
    "sap/ushell/ui/launchpad/UserStatusItem",
    "sap/ushell/ui/launchpad/AccessibilityCustomData",
    "sap/m/library",
    "sap/ui/Device",
    "sap/ui/core/Icon",
    "sap/ui/core/IconPool",
    "sap/ui/core/service/ServiceFactoryRegistry",
    "sap/ushell/utils/WindowUtils"
], function (
    AppType,
    Button,
    List,
    Text,
    VBox,
    HBox,
    Image,
    Dialog,
    Popover,
    OverflowToolbar,
    ScrollContainer,
    Config,
    AccessKeysHandler,
    resources,
    UserStatusItem,
    AccessibilityCustomData,
    mobileLibrary,
    Device,
    Icon,
    IconPool,
    ServiceFactoryRegistry,
    WindowUtils
) {
    "use strict";

    /*global jQuery, sap, hasher*/

    // shortcuts for types from sap/m/library and sap/ui/core/library
    var BackgroundDesign = mobileLibrary.BackgroundDesign,
        ButtonType = mobileLibrary.ButtonType,
        ListSeparators = mobileLibrary.ListSeparators,
        ListType = mobileLibrary.ListType,
        PlacementType = mobileLibrary.PlacementType,
        ToolbarDesign = mobileLibrary.ToolbarDesign;

    sap.ui.jsview("sap.ushell.components.shell.MeArea.MeArea", {

        createContent: function (oController) {
            this.addStyleClass('sapUshellMeAreaView');
            this.aDanglingControls = [];

            var sUserName = sap.ushell.Container.getUser().getFullName(),
                oPopover,
                translationBundle = resources.i18n,
                oConfig = (this.getViewData() ? this.getViewData().config : {}) || {},
                sCurrentShellState = oConfig.appState,
                bCreateDetachedLogoutButton = (sCurrentShellState === 'embedded' || sCurrentShellState === 'embedded-home' || sCurrentShellState === 'standalone' || sCurrentShellState === 'blank-home'  || sCurrentShellState === 'blank'),
                aUserStatusItems,
                oService = ServiceFactoryRegistry.get("sap.ushell.ui5service.UserStatus");
            if (oService) {
                var oServiceInstance = oService.createInstance(),
                    fnStatusChangeHandle = function (newStatus) {
                        oServiceInstance.then(
                            function (oService) {
                                oService.setStatus(newStatus);
                                oPopover.close();
                            }
                        );
                    };
            }

            aUserStatusItems = [
                new UserStatusItem({
                    status: UserStatusItem.prototype.STATUS_ENUM.AVAILABLE,
                    id: "userStatusItem1",
                    isOpener: false,
                    press: function (oEvent) {
                        fnStatusChangeHandle(sap.ushell.ui5service.UserStatus.prototype.AvailableStatus.AVAILABLE);
                    }.bind(this)
                }).addStyleClass('sapUserStatusContainer'),
                new UserStatusItem({
                    status: UserStatusItem.prototype.STATUS_ENUM.AWAY,
                    id: "userStatusItem2",
                    isOpener: false,
                    press: function (oEvent) {
                        fnStatusChangeHandle(sap.ushell.ui5service.UserStatus.prototype.AvailableStatus.AWAY);
                    }.bind(this)
                }).addStyleClass('sapUserStatusContainer'),
                new UserStatusItem({
                    status: UserStatusItem.prototype.STATUS_ENUM.BUSY,
                    id: "userStatusItem3",
                    isOpener: false,
                    press: function (oEvent) {
                        fnStatusChangeHandle(sap.ushell.ui5service.UserStatus.prototype.AvailableStatus.BUSY);
                    }.bind(this)
                }).addStyleClass('sapUserStatusContainer'),
                new UserStatusItem({
                    status: UserStatusItem.prototype.STATUS_ENUM.APPEAR_OFFLINE,
                    id: "userStatusItem4",
                    isOpener: false,
                    press: function (oEvent) {
                        fnStatusChangeHandle(sap.ushell.ui5service.UserStatus.prototype.AvailableStatus.APPEAR_OFFLINE);
                    }.bind(this)
                }).addStyleClass('sapUserStatusContainer')

            ];

            if (!oConfig.disableSignOut) {
                aUserStatusItems.push(new UserStatusItem({
                    status: UserStatusItem.prototype.STATUS_ENUM.SIGNOUT,
                    id: "userStatusLogout",
                    isOpener: false,
                    press: [oController.logout, oController]
                }).addStyleClass('sapUserStatusSignOutContainer'));
            }

            var oUserStatusItemList = new List({
                id: "sapUshellUserStatusItemList",
                showSeparators: "None",
                items: aUserStatusItems
            });
            //"aria-labelledBy", cannot be added in the constructor
            oUserStatusItemList.addCustomData(new AccessibilityCustomData({
                key: "aria-labelledBy",
                value: "userStatusItem1",
                writeToDom: true
            }));

            oPopover = new Popover("statuses", {
                placement: PlacementType.Bottom,
                showArrow: false,
                showHeader: false,
                content: oUserStatusItemList
            }).addStyleClass('sapUserStatusPopOver');
            oPopover.addStyleClass("sapContrastPlus");
            oPopover.setOffsetX(-3);

            aUserStatusItems = [
                new Text({text: sUserName}).addStyleClass('sapUshellMeAreaUserName')
            ];

            var statusOpener = new UserStatusItem({
                id: "userStatusOpener",
                visible: {
                    parts: ["/userStatusEnabled", "/userStatusUserEnabled"],
                    formatter: function (bStatusEnabled, bUserStatusEnabled) {
                        if (bStatusEnabled && bUserStatusEnabled) {
                            return true;
                        }
                        return false;
                    }.bind(this)
                },
                status: {
                    path: "/userStatus",
                    formatter: function (sUserStatus) {
                        return UserStatusItem.prototype.STATUS_ENUM[sUserStatus];
                    }.bind(this)
                },
                tooltip: translationBundle.getText("userStatus_tooltip"),
                image: IconPool.getIconURI("account"),
                press: function (oEvent) {
                    var oButton = sap.ui.getCore().byId(oEvent.mParameters.id);
                    if (oPopover.isOpen()) {
                        oPopover.close();
                    } else {
                        oPopover.openBy(oButton);
                    }
                }.bind(this),
                contentList: oPopover
            }).addStyleClass('sapUserStatusOpener');

            statusOpener.addCustomData(new AccessibilityCustomData({
                key: "tabindex",
                value: "0",
                writeToDom: true
            }));
            //"aria-label", cannot be added in the constructor
            statusOpener.addCustomData(new AccessibilityCustomData({
                key: "aria-label",
                value: resources.i18n.getText("OnlineStatus") + " " + translationBundle.getText("userStatus_tooltip"),
                writeToDom: true
            }));
            //"role", cannot be added in the constructor
            statusOpener.addCustomData(new AccessibilityCustomData({
                key: "role",
                value: "listbox",
                writeToDom: true
            }));
            var listStatusOpener = new List({
                items:[statusOpener],
                backgroundDesign: BackgroundDesign.Transparent
            });
            aUserStatusItems.push(listStatusOpener);

            if (!oConfig.disableSignOut) {
                var oLogoutBtn;
                if (!bCreateDetachedLogoutButton) {
                    oLogoutBtn = new Button("logoutBtn", {
                        visible: {
                            parts: ["/userStatusEnabled", "/userStatusUserEnabled"],
                            formatter: function (bStatusEnabled, bUserStatusEnabled) {
                                if (bStatusEnabled && bUserStatusEnabled) {
                                    return false;
                                }
                                return true;
                            }.bind(this)
                        },
                        type: ButtonType.Transparent,
                        icon: 'sap-icon://log',
                        text: resources.i18n.getText("signoutBtn_title"),
                        press: [oController.logout, oController]
                    });
                    aUserStatusItems.push(oLogoutBtn);
                } else {
                    oLogoutBtn = new sap.ushell.ui.launchpad.ActionItem("logoutBtn", {
                        visible: true,
                        type: ButtonType.Transparent,
                        icon: 'sap-icon://log',
                        text: resources.i18n.getText("signoutBtn_title"),
                        press: [oController.logout, oController]
                    });
                }
            }

            var oUserName = new VBox({
                items: [aUserStatusItems]
            }).addStyleClass("sapUshellUserArea");

            var oUser = sap.ushell.Container.getUser(),
                userImage = oUser.getImage(),
                userBoxItem;

            if (!userImage) {
                userBoxItem = this.createPlaceHolderIcon();
            } else {
                userBoxItem = this.createNewImage();
            }

            userBoxItem.addStyleClass("sapUshellMeAreaUserImage");

            //Me Area Icon (big icon above recent activity)
            var oUserHBox = new HBox({
                items: [
                    userBoxItem,
                    oUserName
                ]
            });

            oUser.attachOnSetImage(this._updateUserImage.bind({
                origScope: this,
                oUserHBox: oUserHBox,
                userBoxItem: userBoxItem
            }));

            oUserHBox.addStyleClass('sapUshellMeAreaUserInfo');
            oUserHBox.addStyleClass('sapContrastPlus');
            var saveButton = oController.createSaveButton(),
                cancelButton = oController.createCancelButton();
            this.oSettingsDialog = new Dialog({
                id: "userSettingsDialog",
                showHeader: false,
                content: null,
                contentHeight: "42rem",
                contentWidth: "58rem",
                buttons: [saveButton, cancelButton],
                afterClose: function () {
                    sap.ushell.Container.getUser().resetChangedProperties();
                },
                stretch: Device.system.phone
            }).addStyleClass("sapUshellUserSetting");

            this.oSettingsDialog.addContent(oController.getSettingsDialogContent());
            // support for exit settings by pressing on ESC
            // in this case its equals to press cancel
            this.oSettingsDialog.addEventDelegate({
                onkeydown: function (oEvent) {
                    if (oEvent.keyCode === 27) {
                        if (oController &&  typeof oController._dialogCancelButtonHandler === "function"){
                            oController._dialogCancelButtonHandler();
                        }
                    }
                }.bind(this)
            });
            this.aDanglingControls.push(cancelButton, saveButton, this.oSettingsDialog);
            oUserHBox.addEventDelegate({
                onsapskipback: function (oEvent) {
                    oEvent.preventDefault();
                    AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    AccessKeysHandler.sendFocusBackToShell(oEvent);
                },
                onsaptabprevious: function (oEvent) {
                    oEvent.preventDefault();
                    AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                    AccessKeysHandler.sendFocusBackToShell(oEvent);
                }
            });

            var oActionsHBox = new OverflowToolbar({
                id: "overflowActions",
                design: ToolbarDesign.Transparent,
                content: {
                    path: "/currentState/actions",
                    factory: function (sId, oContext) {
                        var oCtrl = sap.ui.getCore().byId(oContext.getObject());
                        if (oCtrl) {
                            var bIsActionOutOfMeArea = oCtrl.isA("sap.ushell.ui.shell.ShellHeadItem");
                            if (bIsActionOutOfMeArea) {
                                return undefined;
                            }

                            if (oCtrl.setActionType) {
                                oCtrl.setActionType("action");
                                oCtrl.addStyleClass('sapContrastPlus');
                            }
                            /*since the factory can be called many times,
                             we need to add the press handler only once.
                             the method below makes sure it is added only once per control
                             the press handler is attached to all actions, and switches the
                             viewport state to "Center" as requested by UX*/
                            oController._addPressHandlerToActions(oCtrl);
                        }
                        return oCtrl;
                    }
                }
            });

            //since we customized the control items, we need to override this priveate method, as suggested in
            //internal ticket #1670374902 by UI5 colleague Vladislav Tasev.
            oActionsHBox._getOverflowButtonSize = function () {
                // item width is 4.65rem + 0.25rem left margin + 0.25rem right margin => 5.15rem=82.4px
                return 82.4;
            };
            //"aria-label"
            oActionsHBox.addCustomData(new AccessibilityCustomData({
                key: "aria-label",
                value: resources.i18n.getText("overflowActions_AriaLabel"),
                writeToDom: true
            }));

            if (oActionsHBox._getOverflowButton) {
                var overflowButton = oActionsHBox._getOverflowButton();
                if (overflowButton) {
                    var orig = overflowButton.onAfterRendering;
                    overflowButton.onAfterRendering = function () {
                        if (orig) {
                            orig.apply(this, arguments);
                        }
                        this.addStyleClass('sapUshellActionItem').addStyleClass('sapContrastPlus');
                        this.setText(resources.i18n.getText('meAreaMoreActions'));
                    };
                }
            }

            oActionsHBox.updateAggregation = function (sName) {
                /*jslint nomen: true */
                var oBindingInfo = this.mBindingInfos[sName],
                    oAggregationInfo = this.getMetadata().getJSONKeys()[sName],
                    oClone;

                jQuery.each(this[oAggregationInfo._sGetter](), jQuery.proxy(function (i, v) {
                    this[oAggregationInfo._sRemoveMutator](v);
                }, this));
                jQuery.each(oBindingInfo.binding.getContexts(), jQuery.proxy(function (i, v) {
                    oClone = oBindingInfo.factory(this.getId() + "-" + i, v) ? oBindingInfo.factory(this.getId() + "-" + i, v).setBindingContext(v, oBindingInfo.model) : "";
                    this[oAggregationInfo._sMutator](oClone);
                }, this));
            };

            var oMeAreaContentVBox = new VBox("sapUshellMeAreaContent", {});
            this.actionBox = oActionsHBox;
            oMeAreaContentVBox.addItem(oUserHBox);
            oMeAreaContentVBox.addItem(oActionsHBox);

            if (oConfig.enableRecentActivity) {
                var bShowRecentActivity = sap.ushell.Container.getRenderer("fiori2").oShellModel.getModel().getProperty('/currentState/showRecentActivity');
                if (bShowRecentActivity === true) {
                    var oCreateIconTabBarPromise = this.createIconTabBar(oController);
                    oCreateIconTabBarPromise.done(function (oIconTabBar) {
                        oMeAreaContentVBox.addItem(oIconTabBar);
                        // if the user disable recent activities feature the container will be hidden.
                        var bIsEnableTrackingActivity = sap.ushell.Container.getRenderer("fiori2").oShellModel.getModel().getProperty("/enableTrackingActivity");
                        oIconTabBar.setVisible(bIsEnableTrackingActivity);
                        //this.handleAccessabilityWhenRecentActivitesChange(oActionsHBox,bIsEnableTrackingActivity);
                    });
                }
            }
            this.actionBox.addEventDelegate({
                onsaptabnext: function (oEvent) {
                    var oOriginalElement = oEvent.originalEvent,
                        oSourceElement = oOriginalElement.srcElement,
                        lastElementId = jQuery('.sapUshellActionItem:last')[0].id,
                        isLastElement,isIconTabBarVisible;
                    isIconTabBarVisible = sap.ui.getCore().byId('meAreaIconTabBar').getVisible();
                    // Check if the element currently in focus is the last action item, if yes go to top
                    isLastElement = lastElementId === oSourceElement.id;
                    // if the iconbar doesn't visible forward the focus
                    if (isLastElement === true && !isIconTabBarVisible) {
                        oEvent.preventDefault();
                        AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        AccessKeysHandler.sendFocusBackToShell(oEvent);
                    }
                },
                // When using F6 - the focus should go from the ActionsHBox's header straight to the MeArea header icon
                onsapskipforward: function (oEvent) {
                    var isIconTabBarVisible= sap.ui.getCore().byId('meAreaIconTabBar').getVisible();
                    // if the iconbar doesn't visible forward the focus
                    if (!isIconTabBarVisible) {
                        oEvent.preventDefault();
                        AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                        AccessKeysHandler.sendFocusBackToShell(oEvent);
                    }
                }
            });


            return new ScrollContainer({
                vertical: true,
                horizontal: false,
                height: "100%",
                content: oMeAreaContentVBox
            });
        },

        createIconTabBar: function (oController) {
            var oResultDeferred = new jQuery.Deferred(),
                that = this,
                oIconTabBar,
                origTabBarAfterRendering,
                oTabBarHeader;

            sap.ui.require(['sap/m/IconTabBar',
                            'sap/m/CustomListItem',
                            'sap/m/IconTabFilter',
                            'sap/m/Text',
                            'sap/m/HBox'],
                function (IconTabBar, CustomListItem, IconTabFilter, Text, HBox) {

                    oIconTabBar = new IconTabBar('meAreaIconTabBar', {
                        backgroundDesign: BackgroundDesign.Transparent,
                        expandable: false,
                        items: [that.createIconTab("recentActivities", true, oController, CustomListItem, IconTabFilter, Text, HBox), //Recent activities show timestamp in info property
                                that.createIconTab("frequentActivities", false, oController, CustomListItem, IconTabFilter, Text, HBox)] //Frequent activities have no info
                    }).addStyleClass('sapUshellMeAreaTabBar');

                    oIconTabBar.addEventDelegate({
                        onsaptabnext: function (oEvent) {
                            var oOriginalElement = oEvent.originalEvent,
                                oSourceElement = oOriginalElement.srcElement,
                                aClassList = oSourceElement.classList,
                                bIncludesClass;

                            // Check if the element currently in focus is an actual item in a list such as the Recently Used list
                            bIncludesClass = jQuery.inArray('sapUshellMeAreaActivityItem', aClassList) > -1;
                            if (bIncludesClass === true) {
                                oEvent.preventDefault();
                                AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                                AccessKeysHandler.sendFocusBackToShell(oEvent);
                            }
                        },
                        // When using F6 - the focus should go from the IconTabBar's header (i.e. the "Recently Used" text) straight to the MeArea header icon
                        onsapskipforward: function (oEvent) {
                            oEvent.preventDefault();
                            AccessKeysHandler.setIsFocusHandledByAnotherHandler(true);
                            AccessKeysHandler.sendFocusBackToShell(oEvent);
                        }
                    });

                    origTabBarAfterRendering = oIconTabBar.onAfterRendering;
                    oIconTabBar.onAfterRendering = function () {
                        if (origTabBarAfterRendering) {
                            origTabBarAfterRendering.apply(that, arguments);
                        }
                        oTabBarHeader = sap.ui.getCore().byId('meAreaIconTabBar--header');
                        if (oTabBarHeader) {
                            oTabBarHeader.addStyleClass('sapContrastPlus');
                            oTabBarHeader.addStyleClass('sapUshellTabBarHeader');
                        }
                    };
                    oResultDeferred.resolve(oIconTabBar);
            });
            return oResultDeferred.promise();
        },

        //This function creates each tab in the IconTabBar.
        //The parameter iconTabName will be used for IDs, for the path in the model and to get the
        //strings from the resource bundle (both the tab and the no-data strings). So they all have to match.
        //showInfo will control if to use the info property to present timestamp.
        createIconTab: function (iconTabName, showInfo, oController, CustomListItem, IconTabFilter, Text, HBox) {
            var oActivityTemplateFunction,
                sIcon,
                sTitle,
                sDescription,
                oLi,
                oIconTabFilter,
                oActivityList,
                oModel,
                sPath,
                oViewPort;

            oActivityTemplateFunction = function (sId, oContext) {
                sIcon = oContext.getProperty("icon");
                sTitle = oContext.getProperty("title");

                sDescription = AppType.getDisplayName(
                    oContext.getProperty("appType"));

                var oTitle = new Text ({
                        text: sTitle
                    }).addStyleClass('sapUshellMeAreaActivityItemTitle'),

                    oIcon = sIcon ? new Icon ({
                        src: sIcon
                    }).addStyleClass('sapUshellMeAreaActivityItemIcon') : null,

                    oDescription = new Text ({
                        text: sDescription
                    }).addStyleClass('sapUshellMeAreaActivityItemDescription'),

                    oInfo = new Text ({
                        text: showInfo ? oContext.getProperty("timestamp") : ""
                    }).addStyleClass('sapUshellMeAreaActivityItemInfo'),

                    oHBox = new HBox ({
                        items: oIcon ? [oIcon, oDescription] : [oDescription],
                        justifyContent: "SpaceBetween"
                    }),

                    oContainer = new HBox ({
                        items: showInfo ? [oHBox, oInfo] : [oHBox],
                        justifyContent: "SpaceBetween"
                    }).addStyleClass('sapUshellMeAreaActivityItemContainer');

                oLi = new CustomListItem({
                    content: [oTitle, oContainer],
                    type: ListType.Active
                }).addStyleClass('sapUshellMeAreaActivityItem');

                //"aria-label", cannot be added in the constructor
                oLi.addCustomData(new AccessibilityCustomData({
                    key: "aria-describedby",
                    value: oIconTabFilter.getId(),
                    writeToDom: true
                }));

                return oLi;
            };

            oIconTabFilter = new IconTabFilter({
                id: "sapUshellIconTabBar" + iconTabName,
                text: resources.i18n.getText(iconTabName)
            });

            oActivityList = new List({
                id: "sapUshellActivityList" + iconTabName,
                showSeparators: ListSeparators.All,
                items: {
                    path: "meAreaModel>/apps/" + iconTabName,
                    factory: oActivityTemplateFunction.bind(this)
                },
                noDataText: resources.i18n.getText(iconTabName + 'NoDataText'),
                //mode: sap.m.ListMode.SingleSelectMaster,
                itemPress: function (oEvent) {
                    oModel = this.getModel('meAreaModel');
                    oViewPort = sap.ui.getCore().byId("viewPortContainer");

                    if (oViewPort) {//added in order to make loading dialog open after view switch
                        oViewPort.switchState("Center");
                    }

                    sPath = oEvent.getParameter('listItem').getBindingContextPath();
                    oController.setLastVisited(oModel.getProperty(sPath).url);
                    setTimeout(function () {//timeOut is needed in cases in which the app loads fast. This way we get smoother navigation
                        if (oModel.getProperty(sPath).url[0] === '#') {
                            hasher.setHash(oModel.getProperty(sPath).url);
                        } else {
                            var bEnableRecentActivity = Config.last("/core/shell/enableRecentActivity") && Config.last("/core/shell/enableRecentActivityLogging");
                            if (bEnableRecentActivity) {
                                // add the URL to recent activity log (required to log URLs that are launched from the recent activity list)
                                var oRecentEntry = {
                                    title: oModel.getProperty(sPath).title,
                                    appType: AppType.APP,
                                    url: oModel.getProperty(sPath).url,
                                    appId: oModel.getProperty(sPath).url
                                };
                                sap.ushell.Container.getRenderer("fiori2").logRecentActivity(oRecentEntry);
                            }

                            WindowUtils.openURL(oModel.getProperty(sPath).url, '_blank');
                        }
                    }, 200);
                }
            });
            oIconTabFilter.addContent(oActivityList);
            return oIconTabFilter;
        },

        onViewStateShow: function () {
            this.getController().refreshRecentActivities();
            this.getController().refreshFrequentActivities();
            if (this.actionBox) {
                this.actionBox.updateAggregation("content");
            }
            this.getController().updateScrollBar(hasher.getHash());
        },

        createNewImage: function () {
            return  new Image({
                src: '{/userImage/personPlaceHolder}'
            });
        },

        createPlaceHolderIcon: function () {
            return  new Icon({
                src: '{/userImage/personPlaceHolder}',
                size: '4rem'
            });
        },

        getControllerName: function () {
            return "sap.ushell.components.shell.MeArea.MeArea";
        },

        _updateUserImage: function (oData) {
            var sUserImageUri = (typeof oData) === 'string' ? oData : oData.mParameters;
            this.oUserHBox.removeItem(this.userBoxItem);
            if ((typeof sUserImageUri ) === 'string'){
                this.userBoxItem = this.origScope.createNewImage();
            } else {
                this.userBoxItem = this.origScope.createPlaceHolderIcon();
            }
           if (this.oUserHBox){
               this.oUserHBox.insertItem( this.userBoxItem , 0);
               if (this.userBoxItem){
                   this.userBoxItem.addStyleClass("sapUshellMeAreaUserImage");
               }
           }
        }

    });

}, /* bExport= */ false);
