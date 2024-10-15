/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */
sap.ui.define(['sap/ui/core/mvc/ControllerExtension','sap/ui/model/json/JSONModel'],function(C,J){'use strict';var E=C.extend('sap.fe.controllerextensions.ContextManager',{initializeContextManager:function(){var c=new J();this.getView().setModel(c,"$contexts");},setContexts:function(p,s){var c=Array.isArray(s)?s:[s];var a="/"+p;var o;o=this.getView().getModel("$contexts");o.setProperty(a,{selectedContexts:c,numberOfSelectedContexts:c.length});for(var i=0;i<c.length;i++){var b=c[i].getObject();for(var k in b){if(k.indexOf("#")===0){var A=k;A=A.substring(1,A.length);var m=o.getProperty(a);m[A]=true;o.setProperty(a,m);}}}}});return E;});
