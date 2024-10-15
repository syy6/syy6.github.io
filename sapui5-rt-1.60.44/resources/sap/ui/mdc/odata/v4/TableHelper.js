/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/mdc/TableHelper"],function(T){"use strict";var O=Object.assign({},T);O.fetchProperties=function(t){var p=[],o,e,E,m,M;E=t._oBindingInfo.path;m=t.getModel(t._oBindingInfo.model);M=m.getMetaModel();e=M.getObject(E+"/");for(var k in e){o=e[k];if(o&&o.$kind==="Property"){p.push({name:k,label:M.getObject(E+"/"+k+"@com.sap.vocabularies.Common.v1.Label"),type:o.$Type});}}return p;};return O;},false);
