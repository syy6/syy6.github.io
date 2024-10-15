/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define(['sap/m/OverflowToolbar','sap/m/ToolbarSpacer','sap/m/ToolbarSeparator'],function(O,T,a){"use strict";var A=O.extend("sap.ui.mdc.ActionToolbar",{metadata:{defaultAggregation:"actions",aggregations:{left:{type:"sap.ui.core.Control",multiple:true},actions:{type:"sap.ui.core.Control",multiple:true},right:{type:"sap.ui.core.Control",multiple:true}}},renderer:{}});A.prototype.getSpacer=function(){if(!this._oSpacer){this._oSpacer=new T();this.addDependent(this._oSpacer);}return this._oSpacer;};A.prototype.getSeparator=function(){if(!this._oSeparator){this._oSeparator=new a();this.addDependent(this._oSeparator);}return this._oSeparator;};A.prototype.getContent=function(){return[].concat(this.getLeft(),this.getSpacer(),this.getActions(),this.getSeparator(),this.getRight());};return A;},true);
