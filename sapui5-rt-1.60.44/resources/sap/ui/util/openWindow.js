/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ui/Device"],function(D){"use strict";var o=function openWindow(u,w){var W="noopener,noreferrer";if(D.browser.msie||D.browser.edge){var n=window.open("about:blank",w,W);if(n){n.opener=null;n.location.href=u;}return null;}return window.open(u,w,W);};return o;});
