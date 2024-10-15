/*
 * !SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define(['sap/ui/base/ManagedObject'],function(M){"use strict";var P=M.extend("sap.ui.mdc.PropertyInfo",{metadata:{library:"sap.ui.mdc",properties:{name:{type:"string",defaultValue:null},path:{type:"string",defaultValue:null},label:{type:"string",defaultValue:null},type:{type:"string",defaultValue:"string"},constraints:{type:"object",visibility:'hidden',defaultValue:null},sortable:{type:"boolean",defaultValue:true},filterable:{type:"boolean",defaultValue:true}}}});return P;},true);
