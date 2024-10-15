/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([],function(){"use strict";return{getService:function(s){switch(s){case"CrossApplicationNavigation":return sap.ushell&&sap.ushell.Container&&sap.ushell.Container.getService("CrossApplicationNavigation");case"URLParsing":return sap.ushell&&sap.ushell.Container&&sap.ushell.Container.getService("URLParsing");default:return null;}}};},true);
