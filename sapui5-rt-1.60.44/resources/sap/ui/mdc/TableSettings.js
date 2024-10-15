/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/m/Dialog","sap/m/List","sap/m/StandardListItem"],function(D,L,S){"use strict";var T={_createAndOpenSettings:function(p,s,o){var a;var b=new L({mode:"MultiSelect",noDataText:"Nothing to configure",selectionChange:[function(e){if(s){s(e);}a.close();},o]});p.forEach(function(P){b.addItem(new S({title:P.name}).data("_prop",P));});a=new D({title:"Properties",content:b,afterClose:function(){a.destroy();}}).open();},showColumnsPanel:function(c){return new Promise(function(r,a){sap.ui.require([c.getProviderModulePath()],function(P){if(!P||!P.fetchProperties||!P.createColumn){return;}var p=P.fetchProperties(c);T._createAndOpenSettings(p,function(e){var i=e.getParameter("listItem");var o=i.data("_prop");r([{selectorControl:c,changeSpecificData:{changeType:"addMDCColumn",content:o}}]);},c);});});},handleUserChanges:function(c,C){return new Promise(function(r,a){sap.ui.require(["sap/ui/fl/ControlPersonalizationAPI"],function(b){b.addPersonalizationChanges({controlChanges:c}).then(function(d){b.saveChanges(d,C).then(function(){r(arguments);});});});});}};return T;},false);
