/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([	'sap/ui/core/mvc/ControllerExtension',
				'sap/ui/model/json/JSONModel'
			],
	function (ControllerExtension,JSONModel) {
		'use strict';


		/**
		 * {@link sap.ui.core.mvc.ControllerExtension Controller extension} for transactional UIs
		 *
		 * @namespace
		 * @alias sap.fe.controllerextensions.Transaction
		 *
		 * @sap-restricted
		 * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
		 * @since 1.54.0
		 */
		var Extension = ControllerExtension.extend('sap.fe.controllerextensions.ContextManager', {

			initializeContextManager: function(){
				var oContextModel = new JSONModel();
				this.getView().setModel(oContextModel, "$contexts");
			},
			/* To set the model with contexts, sPrefix is the unique identifier for table
				this can be changed to use entitySet name later 
			*/
			setContexts: function(sPrefix,aSelectedContexts){
				var aContexts = Array.isArray(aSelectedContexts) ? aSelectedContexts : [aSelectedContexts];
				var sContextCollectionName = "/" + sPrefix;
				var oContextModel;
				oContextModel = this.getView().getModel("$contexts");
				oContextModel.setProperty(sContextCollectionName,{selectedContexts: aContexts, numberOfSelectedContexts: aContexts.length});
				for (var i = 0; i < aContexts.length ; i++) {
					var oContextData = aContexts[i].getObject();
					for (var key in oContextData){
						if (key.indexOf("#") === 0){
							var sActionPath = key;
							sActionPath = sActionPath.substring(1, sActionPath.length);
							var oModelObject = oContextModel.getProperty(sContextCollectionName);
							oModelObject[sActionPath] = true;
							oContextModel.setProperty(sContextCollectionName,oModelObject);
						}
					}
				}
			}
			
			
		});

		return Extension;
	}
);
