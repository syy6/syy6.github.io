// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/**
 * @fileOverview handle all the resources for the different applications.
 * @version 1.60.40
 */
sap.ui.define([
    'sap/ushell/components/container/ApplicationContainer'
], function (ApplicationContainer) {
    "use strict";

    /* global Promise */

    var oActiveApplication,
        oApplicationContainerProps = ApplicationContainer.getMetadata().getJSONKeys();

    function Application () {
        this._createWaitForRendererCreatedPromise = function () {
            var oPromise,
                oRenderer;

            oRenderer = sap.ushell.Container.getRenderer();
            if (oRenderer) {
                // should always be the case except initial start; in this case, we return an empty array to avoid delays by an additional async operation
                jQuery.sap.log.debug("Shell controller._createWaitForRendererCreatedPromise: shell renderer already created, return empty array.");
                return [];
            } else {
                oPromise = new Promise(function (resolve, reject) {
                    var fnOnRendererCreated;

                    fnOnRendererCreated = function () {
                        jQuery.sap.log.info("Shell controller: resolving component waitFor promise after shell renderer created event fired.");
                        resolve();
                        sap.ushell.Container.detachRendererCreatedEvent(fnOnRendererCreated);
                    };
                    oRenderer = sap.ushell.Container.getRenderer();
                    if (oRenderer) {
                        // unlikely to happen, but be robust
                        jQuery.sap.log.debug("Shell controller: resolving component waitFor promise immediately (shell renderer already created");
                        resolve();
                    } else {
                        sap.ushell.Container.attachRendererCreatedEvent(fnOnRendererCreated);
                    }
                });
                return [oPromise];
            }
        };

        // FIXME: It would be better to call a function that simply
        // and intentionally loads the dependencies of the UI5
        // application, rather than creating a component and expecting
        // the dependencies to be loaded as a side effect.
        // Moreover, the comment reads "load ui5 component via shell service"
        // however that is 'not needed' since the loaded component
        // is not used. We should evaluate the possible performance
        // hit taken due to this implicit means to an end.
        this.createComponent = function (oResolvedHashFragment, oParsedShellHash) {
            return sap.ushell.Container.getService("Ui5ComponentLoader").createComponent(
                oResolvedHashFragment,
                oParsedShellHash,
                this._createWaitForRendererCreatedPromise()
            );
        };


        this.createApplicationContainer = function (sAppId, oResolvedNavigationTarget) {
            var oTempTarget = {};

            this._cleanTargetResolution(oResolvedNavigationTarget, oTempTarget);
            oActiveApplication = new ApplicationContainer("application" + sAppId, oResolvedNavigationTarget);
            this._restoreTargetResolution(oResolvedNavigationTarget, oTempTarget);

            return oActiveApplication;
        };

        /**
         * Validate properties before creating new ApplicationContainer object.
         * The target resolution object sent to ApplicationContainer, might contain
         * properties not supported by ApplicationContainer. This causes error
         * messages to the browser console that we would like to avoid. The
         * solution is to move the non ApplicationContainer properties to a new
         * temp object before creating ApplicationContainer, and after the creation,
         * move those properties back to the target resolution object.
         *
         * @private
         * @since 1.76
         */
        Application.prototype._cleanTargetResolution = function (oResolvedNavigationTarget, oTempTarget) {
            var sKey;

            if (oResolvedNavigationTarget) {
                for (sKey in oResolvedNavigationTarget) {
                    if (oApplicationContainerProps[sKey] === undefined) {
                        oTempTarget[sKey] = oResolvedNavigationTarget[sKey];
                        delete oResolvedNavigationTarget[sKey];
                    }
                }
            }
        };

        /**
         * After the creation of new ApplicationContainer, restore the full
         * target resolution object with its original parameters.
         *
         * @private
         * @since 1.76
         */
        Application.prototype._restoreTargetResolution = function (oResolvedNavigationTarget, oTempTarget) {
            var sKey;

            if (oResolvedNavigationTarget) {
                for (sKey in oTempTarget) {
                    oResolvedNavigationTarget[sKey] = oTempTarget[sKey];
                }
            }
        };

        this.restore = function (oApp) {
            if (oApp) {
                if (oApp.restore) {
                    oApp.restore();
                }

                //this is in order to support the dashboard life cycle.
                if (oApp.setInitialConfiguration) {
                    oApp.setInitialConfiguration();
                }

                if (oApp.getRouter && oApp.getRouter() && oApp.getRouter().initialize) {
                    oApp.getRouter().initialize();
                }
            }
        };

        this.store = function (oApp) {
            //distroy the application and its resources
            // invoke the life cycle interface "suspend" for the suspend application
            if (oApp) {
                if (oApp.suspend) {
                    oApp.suspend();
                }
                if (oApp.getRouter && oApp.getRouter()) {
                    oApp.getRouter().stop();
                }
            }
        };

        this.destroy = function (oApp) {
            //remove from storeage
            //distroy the application and its resources
            if (oApp && oApp.destroy) {
                oApp.destroy();
            }
        };
    }


    return new Application();
}, /* bExport= */ true);
