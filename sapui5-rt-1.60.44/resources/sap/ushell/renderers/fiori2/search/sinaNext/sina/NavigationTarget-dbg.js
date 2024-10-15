// Copyright (c) 2009-2017 SAP SE, All Rights Reserved
/* global sinaDefine */
sinaDefine(['./SinaObject'], function (SinaObject) {
    "use strict";

    return SinaObject.derive({

        _meta: {
            properties: {
                targetUrl: {
                    required: true
                },
                label: {
                    required: true
                },
                target: { // as in <a href="" target="_blank">...</a>
                    required: false
                }
            }
        },

        performNavigation: function (params) {
            params = params || {};
            var trackingOnly = params.trackingOnly || false;
            if (!trackingOnly) {
                if (this.target) {
                    this.openURL(this.targetUrl, this.target);
                } else {
                    this.openURL(this.targetUrl);
                }
            }
        },

        openURL: function (URL, target) {
            if (jQuery && jQuery.sap && jQuery.sap.openWindow) {
                return jQuery.sap.openWindow(URL, target);
            }
            return window.open(URL, target, 'noopener,noreferrer');
        },

        isEqualTo: function (otherNavigationObject) {
            if (!otherNavigationObject) {
                return false;
            }
            return this.targetUrl == otherNavigationObject.targetUrl;
        }
    });
});
