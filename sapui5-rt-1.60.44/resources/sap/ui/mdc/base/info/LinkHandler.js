/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define(['sap/ui/mdc/base/info/ILinkHandler'],function(I){"use strict";var L=I.extend("sap.ui.mdc.base.info.LinkHandler",{metadata:{library:"sap.ui.mdc"}});L.prototype.hasPotentialLinks=function(){return Promise.resolve(!!this.getItems().length);};L.prototype.determineItems=function(){return Promise.resolve(this.getItems());};return L;},true);
