/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define(["./Column","sap/m/Text"],function(C,T){"use strict";var a={fetchProperties:function(t){return[];},createColumn:function(p,t){return new C({header:p.label||p.name,dataProperties:[p.name],template:a.createColumnTemplate(p)});},createColumnTemplate:function(p){return new T({text:{path:p.name}});}};return a;},false);
