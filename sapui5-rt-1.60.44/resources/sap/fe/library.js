/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */
sap.ui.define(["jquery.sap.global",'sap/ui/mdc/XMLComposite','sap/ui/core/util/XMLPreprocessor',"sap/ui/base/SyncPromise"],function(q,X,a,S){"use strict";sap.ui.getCore().initLibrary({name:"sap.fe",dependencies:["sap.ui.core"],types:[],interfaces:[],controls:[],elements:[],version:"1.60.2"});function v(n,V){var b=n.getAttribute('metadataContexts');if(b){n.removeAttribute('metadataContexts');}return S.resolve(V.visitAttributes(n)).then(function(){if(b){n.setAttribute('metadataContexts',b);}});}function p(n,V){var t=this,P=S.resolve(v(n,V)).then(function(){return X.initialTemplating(n,V,t);}).then(function(){n.removeAttribute('metadataContexts');});return V.find?P:undefined;}a.plugIn(p.bind("sap.fe.Form"),"sap.fe","Form");a.plugIn(p.bind("sap.fe.ViewSwitchContainer"),"sap.fe","ViewSwitchContainer");return sap.fe;},false);
