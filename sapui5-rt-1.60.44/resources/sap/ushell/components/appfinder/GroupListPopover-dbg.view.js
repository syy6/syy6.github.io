// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

sap.ui.define([
    "sap/ushell/Config"
], function (Config) {
	"use strict";

    /*global jQuery, sap */
    /*jslint nomen: true */


    sap.ui.jsview("sap.ushell.components.appfinder.GroupListPopover", {
        /*
            view receives viewData with following structure
            {
                groupData: [
                    {
                        initiallySelected: true,
                        selected: true,
                        oGroup: group1Object
                    },
                    {
                        initiallySelected: false,
                        selected: false,
                        oGroup: group2Object
                    }
                ]
                enableHideGroups: true,
                enableHelp: true, //usage in this view replaced by Config object
                singleGroupSelection: false
         }
         */

        createContent: function (oController) {
            this.oPopover = sap.ui.getCore().byId("groupsPopover");
            if (this.oPopover){
                return;
            }

            this.iPopoverDataSectionHeight = 192;
            this.oGroupsContainer = this._createPopoverContainer(this.iPopoverDataSectionHeight);
            this.oLaunchPageService = sap.ushell.Container.getService("LaunchPage");

            this.oPopover = new sap.m.ResponsivePopover({
                id : "groupsPopover",
                placement : "Auto",
                title: sap.ushell.resources.i18n.getText("addTileToGroups_popoverTitle"),
                contentWidth: '20rem',
                beginButton: this._createCloseButton(),
                content: this.oGroupsContainer,
                afterClose: this.getController()._afterCloseHandler.bind(this.getController())
            });

            this.oPopover.setInitialFocus('newGroupItem');
            //return this.oPopover;
        },

        open: function (openByControl) {
            if (document.body.clientHeight - openByControl.getDomRef().getBoundingClientRect().bottom >= 310) {
                this.oPopover.setPlacement("Bottom");
            }
            this.oPopover.openBy(openByControl);
            if (this.getViewData().singleGroupSelection) {
                this.getController()._setFooterVisibility(false);
            }
            this.deferred = jQuery.Deferred();
            return this.deferred.promise();
        },

        _createPopoverContainer: function (iPopoverDataSectionHeight) {
            var popoverContainer = sap.ui.getCore().byId("popoverContainer");
            if (popoverContainer){
                return popoverContainer;
            }

            var oNewGroupItemList = this._createNewGroupUiElements(),
                oGroupList = this._createPopoverGroupList();

            popoverContainer = new sap.m.ScrollContainer({
                    id: "popoverContainer",
                    horizontal : false,
                    vertical : true,
                    content: [oNewGroupItemList, oGroupList]
                });

            if (!sap.ui.Device.system.phone) {
                popoverContainer.setHeight((iPopoverDataSectionHeight - 2) + "px");
            } else {
                popoverContainer.setHeight("100%");
            }

            return popoverContainer;
        },

        _createNewGroupUiElements: function () {
            var oNewGroupItemList = sap.ui.getCore().byId("newGroupItemList");
            if (oNewGroupItemList){
                return oNewGroupItemList;
            }

            var oNewGroupItem = new sap.m.StandardListItem({
                id : "newGroupItem",
                title : sap.ushell.resources.i18n.getText("newGroup_listItemText"),
                type : "Navigation",
                press : this.getController()._navigateToCreateNewGroupPane.bind(this.getController())
            });
            oNewGroupItemList = new sap.m.List("newGroupItemList", {});
            // if xRay is enabled
            if (Config.last("/core/extension/enableHelp")) {
                oNewGroupItem.addStyleClass('help-id-newGroupItem');// xRay help ID
            }
            oNewGroupItemList.addItem(oNewGroupItem);

            oNewGroupItemList.addEventDelegate({
                onsapdown: function (oEvent) {
                    try {
                        oEvent.preventDefault();
                        oEvent._bIsStopHandlers = true;
                        var jqFirstGroupListItem = jQuery("#popoverContainer .sapMListModeMultiSelect li, #popoverContainer .sapMListModeSingleSelectMaster li").first();
                        jqFirstGroupListItem.focus();
                    } catch (e) {
                        // continue regardless of error
                    }
                },
                onsaptabnext: function (oEvent) {
                    try {
                        oEvent.preventDefault();
                        oEvent._bIsStopHandlers = true;
                        var jqCloseButton = jQuery("#closeButton");
                        jqCloseButton.focus();
                    } catch (e) {
                        // continue regardless of error
                    }
                }
            });

            return oNewGroupItemList;
        },

        _createNewGroupInput: function () {
            var oNewGroupNameInput = sap.ui.getCore().byId("newGroupNameInput");
            if (oNewGroupNameInput){
                return oNewGroupNameInput;
            }

            oNewGroupNameInput = new sap.m.Input({
                id : "newGroupNameInput",
                type : "Text",
                placeholder : sap.ushell.resources.i18n.getText("new_group_name")
            });
            oNewGroupNameInput.setValueState(sap.ui.core.ValueState.None);
            oNewGroupNameInput.setPlaceholder(sap.ushell.resources.i18n.getText("new_group_name"));
            oNewGroupNameInput.enabled = true;
            oNewGroupNameInput.addStyleClass("sapUshellCatalogNewGroupInput");
            return oNewGroupNameInput;
        },

        _createHeadBarForNewGroup: function () {
            var oHeadBar = sap.ui.getCore().byId("oHeadBar");
            if (oHeadBar){
                return oHeadBar;
            }

            var oBackButton = new sap.m.Button({
                icon: sap.ui.core.IconPool.getIconURI("nav-back"),
                press : this.getController()._backButtonHandler.bind(this.getController()),
                tooltip : sap.ushell.resources.i18n.getText("newGroupGoBackBtn_tooltip")
            });
            oBackButton.addStyleClass("sapUshellCatalogNewGroupBackButton");

            // new group panel's header
            oHeadBar = new sap.m.Bar("oHeadBar", {
                contentLeft : [oBackButton],
                contentMiddle : [
                    new sap.m.Label({
                        text : sap.ushell.resources.i18n.getText("newGroup_popoverTitle")
                    })
                ]
            });
            return oHeadBar;
        },

        getControllerName: function () {
            return "sap.ushell.components.appfinder.GroupListPopover";
        },

        _createPopoverGroupList: function () {

            var oListItemTemplate = new sap.m.DisplayListItem({
                label : "{oGroup/title}",
                selected : "{selected}",
                tooltip: "{oGroup/title}",
                type: sap.m.ListType.Active,
                press: this.getController().groupListItemClickHandler.bind(this.getController())
            });
            var aUserGroupsFilters = [];
            aUserGroupsFilters.push(new sap.ui.model.Filter("oGroup/isGroupLocked", sap.ui.model.FilterOperator.EQ, false));
            if (this.getViewData().enableHideGroups) {
                aUserGroupsFilters.push(new sap.ui.model.Filter("oGroup/isGroupVisible", sap.ui.model.FilterOperator.EQ, true));
            }
            var bSingleSelection = this.getViewData().singleGroupSelection,
                oList = new sap.m.List({
                    mode : bSingleSelection ? sap.m.ListMode.SingleSelectMaster : sap.m.ListMode.MultiSelect,
                    items: {
                        path: "/userGroupList",
                        template: oListItemTemplate,
                        filters: aUserGroupsFilters
                    }
                });

            if (bSingleSelection){
                oList.attachSelect(this.getController().okButtonHandler.bind(this.getController()));
            } else {
                // While clicking on the checkbox - Check if a group was added or removed
                oList.attachSelectionChange(this.getController().checkboxClickHandler.bind(this.getController()));
            }

            oList.addEventDelegate({
                //used for accessibility, so "new group" element will be a part of it
                onsapup: function (oEvent) {
                    try {
                        oEvent.preventDefault();

                        var jqNewGroupItem,
                            currentFocusGroup = jQuery(":focus");
                        if (currentFocusGroup.index() == 0) {   //first group in the list
                            jqNewGroupItem = jQuery("#newGroupItem");
                            jqNewGroupItem.focus();
                            oEvent._bIsStopHandlers = true;
                        }
                    } catch (e) {
                        // continue regardless of error
                        jQuery.sap.log.error("Groups popup Accessibility `up` key failed");
                    }
                }
            });
            return oList;
        },

        _createOkButton: function () {
            var oOkBtn = new sap.m.Button( {
                id : "okButton",
                press : this.getController().okButtonHandler.bind(this.getController()),
                text : sap.ushell.resources.i18n.getText("okBtn")
            });

            oOkBtn.addEventDelegate({
                onsaptabprevious: function(oEvent) {
                    try {
                        oEvent.preventDefault();
                        oEvent._bIsStopHandlers = true;
                        var jqNewGroupItem = jQuery("#newGroupItem");
                        if (!jqNewGroupItem.length) {
                            jqNewGroupItem = jQuery("#newGroupNameInput input");
                        }
                        jqNewGroupItem.focus();
                    } catch (e) {
                        // continue regardless of error
                        jQuery.sap.log.error("Groups popup Accessibility `shift-tab` key failed");
                    }
                }
            });
            return oOkBtn;
        },

        _createCancelButton: function () {
            return new sap.m.Button({
                id : "cancelButton",
                press: this.getController()._closeButtonHandler.bind(this.getController()),
                text : sap.ushell.resources.i18n.getText("cancelBtn")
            });
        },

        _createCloseButton: function () {
            return sap.ui.getCore().byId("closeButton") || new sap.m.Button({
                id : "closeButton",
                press: this.getController()._switchGroupsPopoverButtonPress.bind(this.getController()),
                text : sap.ushell.resources.i18n.getText(sap.ushell.resources.i18n.getText("close"))
            });
        }
    });


}, /* bExport= */ false);
