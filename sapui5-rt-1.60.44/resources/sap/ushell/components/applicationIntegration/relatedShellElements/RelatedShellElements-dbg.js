// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview handle all the related shell elements of the different applications.
 * @version 1.60.40
 */
sap.ui.define([], function () {
    "use strict";

    function RelatedShellElements () {
        //handle the history service
        var aDanglingControls = [],
            ElementsModel,
            //oApplicationRelatedElementsModel contain the current application Related Elements
            oApplicationRelatedElementsModel,
            customShellState = {},
            oStateModelToUpdate,
            bIsInDangling = false,
            oCheckPoints = {},
            oAppModel,
            aTriggers = [],

        //actual states convertion map
            oApplicationTypeToElementModelStateMap = {
                home: {
                    NWBC: {
                        headerless: "headerless",
                        default: "minimal"
                    }, TR: {
                        headerless: "minimal",
                        default: "minimal"
                    }, default: {
                        default: "home"
                    }
                }, app: {
                    NWBC: {
                        headerless: "headerless",
                        default: "minimal"
                    }, TR: {
                        headerless: "minimal",
                        default: "minimal"
                    }, default: {
                        default: "app"
                    }
                }
            };

        this.init = function (inElementsModel) {
            ElementsModel = inElementsModel;
        };

        this.processDangling = function () {
            var iDandlingInd,
                oDang;

            for (iDandlingInd = 0; iDandlingInd < aDanglingControls.length; iDandlingInd++) {
                oDang = aDanglingControls.pop();
                oDang.func.apply(this, oDang.args);
            }
        };


        this.setDangling = function (bIsDangling) {
            bIsInDangling = bIsDangling;
        };

        this.calculateElementsState = function (sNav, sAppType, appState, isExplicit) {
            var oNav = !!oApplicationTypeToElementModelStateMap[sNav]? oApplicationTypeToElementModelStateMap[sNav]: oApplicationTypeToElementModelStateMap.default,
                oApp = !!oNav[isExplicit? undefined: sAppType]? oNav[sAppType]: oNav.default,
                oAppStt = !!oApp[appState]? oApp[appState]: oApp.default;

            return oAppStt;
        };

        this.createCustomShellState = function (sShellName) {
            var oCustomState = {
                    "currentState": {
                        "stateName": sShellName,
                        "headEndItems" : [],
                        "paneContent" : [],
                        "headItems" : [],
                        "actions" : [],
                        "floatingActions" : [],
                        "subHeader" : [],
                        "toolAreaItems" : [],
                        "RightFloatingContainerItems": [],
                        "application": {},
                        "showRightFloatingContainer": undefined,
                        "headerHeading": undefined
                    }
                },
                customStatesDelta = {
                    "home": {
                        "actions": ["ContactSupportBtn", "EndUserFeedbackBtn"]
                    },
                    "app": {
                        "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
                    },
                    "minimal": {
                        "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
                    },
                    "standalone": {
                        "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
                    },
                    "embedded": {
                        "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
                    },
                    "embedded-home": {
                        "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
                    },
                    "lean": {
                        "actions": ["ContactSupportBtn", "EndUserFeedbackBtn", "aboutBtn"]
                    }
                },
                shellCustomState = customStatesDelta[sShellName];

            if (shellCustomState) {
                jQuery.extend(oCustomState.currentState, shellCustomState);
            }

            return oCustomState;
        };

        this.createExtendedShellState = function (sShellName, fnCreationInstructions) {
            var oBaseExtensionShellStates,
                oCustomStates = this.createCustomShellState(sShellName);

            oBaseExtensionShellStates = oApplicationRelatedElementsModel.extendedShellStates;

            //validate that extension shell state does not already exists.
            if (oBaseExtensionShellStates[sShellName]) {
                return false;
            }

            //change to shadow shell.
            oStateModelToUpdate = oCustomStates;
            //force model
            fnCreationInstructions();
            //store shell state
            if (oBaseExtensionShellStates[sShellName]) {
                oBaseExtensionShellStates[sShellName].customState = oCustomStates;
            } else {
                oBaseExtensionShellStates[sShellName] = {
                    managedObjects: [],
                    customState: oCustomStates
                };
            }

            //restore
            oStateModelToUpdate = oApplicationRelatedElementsModel.customShellState;

            return true;
        };

        this.assignNew = function (sState) {
            customShellState = this.createCustomShellState(sState);
            oApplicationRelatedElementsModel.customShellState = customShellState;
            oApplicationRelatedElementsModel.aTriggers = [];
            oApplicationRelatedElementsModel.extendedShellStates = {};
            oApplicationRelatedElementsModel.oCheckPoints = {};

            this._updateModel();

            oStateModelToUpdate = oApplicationRelatedElementsModel.customShellState;
        };


        this._genericSetItem = function (sAttr, oVal) {
            var aAttrParts = sAttr.split("/");
            var sLastAttr = aAttrParts.pop();
            var oLastModelPart = aAttrParts.reduce(function (oCurrentModelPart, sMember) {
                return oCurrentModelPart[sMember];
            }, oStateModelToUpdate.currentState);

            oLastModelPart[sLastAttr] = oVal;
            ElementsModel._renderShellState();
        };

        this._genericAddItems = function (sAttr, aIds, bIsFirst) {
            var oCurrItems = oStateModelToUpdate.currentState[sAttr];

            if (!!bIsFirst) {
                oStateModelToUpdate.currentState[sAttr] = aIds.concat(oCurrItems);
            } else {
                oStateModelToUpdate.currentState[sAttr] = oCurrItems.concat(aIds);
            }
            ElementsModel._renderShellState();
        };

        this.genericSetItem = function (sAttr, oVal) {
            if (bIsInDangling) {
                aDanglingControls.push({
                    func: this._genericSetItem,
                    args: arguments
                });
            } else {
                this._genericSetItem(sAttr, oVal);
            }
        };

        this.genericAddItems = function (sAttr, aIds, bIsFirst) {
            if (bIsInDangling) {
                aDanglingControls.push({
                    func: this.genericAddItems,
                    args: arguments
                });
            } else {
                this._genericAddItems(sAttr, aIds, bIsFirst);
            }
        };

        this.setShellModelForApplications = function (sAttr, oValue) {
            var aListOfAvailableAttributes = [
                "paneContent",
                "headItems",
                "RightFloatingContainerItems",
                "toolAreaItems",
                "floatingActions",
                "showRightFloatingContainer",
                "headEndItems",
                "headerVisible",
                "subHeader",
                "actions"
            ];

            if (aListOfAvailableAttributes.indexOf(sAttr) > -1) {
                this.genericSetItem(sAttr, oValue);
            } else {
                jQuery.sap.log.error("Not a valid attribute:" + sAttr);
            }
        };

        this.addShellModelForApplications = function (sAttr, aIds, bIsFirst) {
            var aListOfAvailableAttributes = [
                "paneContent",
                "headItems",
                "RightFloatingContainerItems",
                "toolAreaItems",
                "floatingActions",
                "showRightFloatingContainer",
                "headEndItems",
                "headerVisible",
                "subHeader",
                "actions"
            ];

            if (aListOfAvailableAttributes.indexOf(sAttr) > -1) {
                this.genericAddItems(sAttr, aIds, bIsFirst);
            } else {
                jQuery.sap.log.error("Not a valid attribute:" + sAttr);
            }
        };

        this.setStateModelToUpdate= function (oInStateModelToUpdate) {
            oStateModelToUpdate = oInStateModelToUpdate;
        };

        this.getStateModelToUpdate = function () {
            return oStateModelToUpdate;
        };

        this.model = function () {
            if (!oApplicationRelatedElementsModel) {
                this.create();
            }

            oAppModel = {
                customShellState: oApplicationRelatedElementsModel.customShellState,
                aTriggers: oApplicationRelatedElementsModel.aTriggers,
                extendedShellStates: oApplicationRelatedElementsModel.extendedShellStates,
                oCheckPoints: oApplicationRelatedElementsModel.oCheckPoints
            };

            return oAppModel;
        };


        this._updateModel = function () {
            if (oAppModel) {
                oAppModel.customShellState = oApplicationRelatedElementsModel.customShellState;
                oAppModel.aTriggers = oApplicationRelatedElementsModel.aTriggers;
                oAppModel.extendedShellStates = oApplicationRelatedElementsModel.extendedShellStates;
                oAppModel.oCheckPoints = oApplicationRelatedElementsModel.oCheckPoints;
            }
        };

        this.getAppRelatedElement = function () {
            return {
                customShellState: oApplicationRelatedElementsModel.customShellState,
                aTriggers: oApplicationRelatedElementsModel.aTriggers,
                extendedShellStates: oApplicationRelatedElementsModel.extendedShellStates,
                oCheckPoints: oApplicationRelatedElementsModel.oCheckPoints
            };
        };

        this.create = function () {
            oApplicationRelatedElementsModel = {
                extendedShellStates: {},
                oCheckPoints: oCheckPoints,
                aTriggers: aTriggers,
                customShellState: {
                    "currentState": {
                        "stateName": "app",
                        "headEndItems" : [],
                        "paneContent" : [],
                        "headItems" : [],
                        "actions" : ["aboutBtn"],
                        "floatingActions" : [],
                        "subHeader" : [],
                        "toolAreaItems" : [],
                        "RightFloatingContainerItems": [],
                        "application": {},
                        "showRightFloatingContainer": undefined,
                        "headerHeading": undefined
                    }
                }
            };

            oStateModelToUpdate = oApplicationRelatedElementsModel.customShellState;
            this._updateModel();

            return oApplicationRelatedElementsModel;
        };

        this.restore = function (oStorageEntry) {
            if (oStorageEntry && oStorageEntry.appRelatedElements) {
                var oAppShellModel = oStorageEntry.appRelatedElements;
                oApplicationRelatedElementsModel.aTriggers = oAppShellModel.aTriggers;
                oApplicationRelatedElementsModel.extendedShellStates = oAppShellModel.extendedShellStates;
                oApplicationRelatedElementsModel.oCheckPoints = oAppShellModel.oCheckPoints;
                oApplicationRelatedElementsModel.customShellState = oAppShellModel.customShellState;
            }
            this._updateModel();

            oStateModelToUpdate = oApplicationRelatedElementsModel.customShellState;
        };

        this.store = function (oModel) {
        };

        this.clean = function () {
            oApplicationRelatedElementsModel= undefined;
        };

        this.destroy = function (oModel) {
            //handle destroy of the services
        };
    }


    return new RelatedShellElements();
}, /* bExport= */ true);
