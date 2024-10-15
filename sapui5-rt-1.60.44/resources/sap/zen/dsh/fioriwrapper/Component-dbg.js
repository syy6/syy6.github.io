/*
 * Copyright (C) 2009-2021 SAP SE or an SAP affiliate company. All rights reserved.
 */
sap.ui.define([
	"sap/ui/core/UIComponent",
	"sap/ui/generic/app/navigation/service/NavigationHandler",
	"sap/zen/dsh/Dsh"], 
function (UIComponent, NavigationHandler, Dsh) {
	"use strict";

	return UIComponent.extend("sap.zen.dsh.fioriwrapper.Component", {
		metadata: {
			manifest: "json"
		},

		/**
		 * Initialize the application
		 * @returns {sap.ui.core.Control} the content
		 */
		createContent: function() {
			function addMappedValuesToObject(tMappings, oValueHolder, sValue) {
				if (Array.isArray(tMappings)) {
					for (var lEntry in tMappings) {
						oValueHolder[tMappings[lEntry]] = sValue;
					}
				}
				else {
					oValueHolder[tMappings] = sValue;
				}
			}
			
			var loDesignStudio = null;
			var lDeferCreation = true;
			
			sap.zen.dsh.scriptLoaded = true;
			var loConfig = this.getMetadata().getConfig();
			var loMappings = {};
			var loReversedMappings = {};
			var ltNavParams = {};
			
			if (loConfig) {
				if (loConfig && loConfig.semanticObjectMappings) {
					loMappings = loConfig.semanticObjectMappings;
					loReversedMappings = {}; 
					for (var lKey in loMappings) {
						if (loMappings.hasOwnProperty(lKey)) {
							addMappedValuesToObject(loMappings[lKey], loReversedMappings, lKey);
						}
					}
				}
			}
			
			var lAppName = "";
			if (loConfig && loConfig.appName) {
				lAppName = loConfig.appName;
			}
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.appName){
				lAppName = this.getComponentData().startupParameters.appName;
			}
			var lTemplate = "0ANALYSIS"; 
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XTEMPLATE){
				lTemplate = this.getComponentData().startupParameters.XTEMPLATE[0];			
			}
			var lTargetSystemAlias = "";
			if (loConfig && loConfig.systemAlias) {
				lTargetSystemAlias = loConfig.systemAlias;
			}
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XSYSTEM){
				lTargetSystemAlias = this.getComponentData().startupParameters.XSYSTEM[0];			
			}
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters["sap-system"]){
				lTargetSystemAlias = this.getComponentData().startupParameters["sap-system"][0];				
			}
			var lQuery = ""; 
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XQUERY){
				lQuery = this.getComponentData().startupParameters.XQUERY[0];			
			}
			var lTitle = ""; 
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XTITLE){
				lTitle = this.getComponentData().startupParameters.XTITLE[0];			
			}
			var lBookmarkid = ""; 
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XBOOKMARKID){
				lBookmarkid = this.getComponentData().startupParameters.XBOOKMARKID[0];			
			}
			var lVisiblePrompts = ""; 
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XVISIBLEPROMPTS){
				lVisiblePrompts = this.getComponentData().startupParameters.XVISIBLEPROMPTS[0];			
			}
			var lDisplay = ""; 
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XDISPLAY){
				lDisplay = this.getComponentData().startupParameters.XDISPLAY[0];			
			}
			var lChartType = "";
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XCHART_TYPE){
				lChartType = this.getComponentData().startupParameters.XCHART_TYPE[0];			
			}
			var lDatalimitRows = "";
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XDATALIMIT_ROWS){
				lDatalimitRows = this.getComponentData().startupParameters.XDATALIMIT_ROWS[0];			
			}
			var lDatalimitCols = "";
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XDATALIMIT_COLS){
				lDatalimitCols = this.getComponentData().startupParameters.XDATALIMIT_COLS[0];			
			}
			var loNavigationSourceObjects = "";
			if (loConfig.navigationSourceObjects) {
				loNavigationSourceObjects = loConfig.navigationSourceObjects;
			}
			if (this.getComponentData().startupParameters && this.getComponentData().startupParameters.XSEMANTIC_OBJECTS){
				loNavigationSourceObjects = this.getComponentData().startupParameters.XSEMANTIC_OBJECTS[0].split(',');
			}

			function initializeDesignStudio() {
				loDesignStudio = new Dsh({
				  id: "dsh_" + lQuery.replace(/\W/g, ''),  //"fin.acc.query.analyze::" + sQuery.replace(/\W/g, ''),
			      height: "100%",
			      width: "100%",
			      deployment: "bw",
			      dshAppName: lTemplate,
			      repoPath : loConfig.repoPath || "",
			      semanticMappings: loMappings,
			      appComponent: this,
			      systemAlias: lTargetSystemAlias,
			      deferCreation: lDeferCreation
				});  
				if (lQuery) {  //Query
					loDesignStudio.addParameter("XQUERY", lQuery);
				}		
				if (lTitle) {  //Title
					loDesignStudio.addParameter("XTITLE", lTitle);
				}		
				if (lBookmarkid) {  //Bookmark
					loDesignStudio.addParameter("XBOOKMARKID", lBookmarkid);
				}				
				if (lVisiblePrompts) {  //Visible Prompts
					loDesignStudio.addParameter("XVISIBLEPROMPTS", lVisiblePrompts);
				}				
				if (lDisplay) {  //Display Mode (table, chart, chart&table)
					loDesignStudio.addParameter("XDISPLAY", lDisplay);
				}
				if (lChartType) {  //Chart Type
					loDesignStudio.addParameter("XCHART_TYPE", lChartType);
				}
				if (lDatalimitRows) {  //Data Limit Rows
					loDesignStudio.addParameter("XDATALIMIT_ROWS", lDatalimitRows);
				}
				if (lDatalimitCols) {  //Data Limit Cols
					loDesignStudio.addParameter("XDATALIMIT_COLS", lDatalimitCols);
				}
				if (loNavigationSourceObjects) {  //Semantic Objects for Navigation
					loDesignStudio.addParameter("NAV_SOURCES", JSON.stringify(loNavigationSourceObjects));
				}				
				if (loReversedMappings) {  //Reversed Mappings
					loDesignStudio.addParameter("NAV_SEMANTIC_MAPPINGS", JSON.stringify(loReversedMappings));
				}				
				// Internal Format for Fields
				var loNavRules = {};
				loDesignStudio.addParameter("NAV_PARAM_RULES", JSON.stringify(loNavRules));
			}
			
			var that = this;
			var loAppState = {};
			var loNavigationHandler = new NavigationHandler(this);		
			var loParseNavigationPromise = loNavigationHandler.parseNavigation();			
			
			loParseNavigationPromise.done(function(oAppData, oURLParameters, sNavType){	
				if (!loDesignStudio){
					initializeDesignStudio.call(that);
				}
				if (sNavType !== sap.ui.generic.app.navigation.service.NavType.initial) {
					if (oAppData && oAppData.bNavSelVarHasDefaultsOnly){
						loDesignStudio.addParameter("XPROMPT", "true");
					}
					if (typeof loDesignStudio.initializeAppStateData !== "function"){
						loAppState._sData = oAppData.selectionVariant;
						loAppState.getData = function(){
							var o = undefined;
							if (this._sData === undefined || this._sData === ""){
								return undefined;
							}
							try{
								o=JSON.parse(this._sData);
							}catch(e){}
							return {"selectionVariant": o};
						};					
					}
				}
				if (typeof loDesignStudio.initializeAppStateData === "function"){
					loDesignStudio.initializeAppStateData.call(loDesignStudio, oAppData, ltNavParams);
				}
				else{
					loDesignStudio.initializeAppState.call(loDesignStudio, loAppState, ltNavParams);	
				}
				
				if (lDeferCreation){
					loDesignStudio.createPage();
				}
			});
			
			loParseNavigationPromise.fail(function(oError){					
				if (!loDesignStudio){
					lDeferCreation = true;
					initializeDesignStudio.call(that);
				}
				
				if (this.getComponentData().startupParameters) {
					for (var lParam in this.getComponentData().startupParameters) {
						if (that.getComponentData().startupParameters.hasOwnProperty(lParam) &&
								lParam !== "newBW"&& lParam != "XTEMPLATE" && lParam != "XSEMANTIC_OBJECTS" && lParam != "XQUERY" && lParam != "XBOOKMARKID" &&
								lParam != "XVISIBLEPROMPTS" && lParam != "XACH_COMPONENT" && lParam != "XSYSTEM" && lParam != "XTITLE" &&
								lParam != "XDISPLAY" && lParam != "XCHART_TYPE" && lParam != "XDATALIMIT_ROWS" && lParam != "XDATALIMIT_COLS") {
							var lParamValue = that.getComponentData().startupParameters[lParam][0];
							loDesignStudio.addParameter(lParam, lParamValue);
							if (loMappings && loMappings.hasOwnProperty(lParam)) {
								addMappedValuesToObject(loMappings[lParam], ltNavParams, lParamValue);
							} else {
								ltNavParams[lParam] = lParamValue;
							}
						}
					}
				}
				
				sap.ushell.Container.getService("CrossApplicationNavigation").getStartupAppState(that).always(function(oStartupData) {
					loDesignStudio.initializeAppState.call(loDesignStudio, oStartupData, ltNavParams);
					loDesignStudio.createPage();
				});	        
			});
			
			if (!loDesignStudio){
				lDeferCreation = true;
				initializeDesignStudio.call(that);
			}
			
			return loDesignStudio;  
		},
	
	    init: function() {
	    	this.sAchComponent = null;
	    	this.oSapAppManifestEntry = this.getManifestEntry("sap.app");
	        sap.ui.core.UIComponent.prototype.init.apply(this, arguments); // calls createContent (among others)				   	
	    },
	    
		getManifestEntry: function(sKey) {
			if (sKey === "/sap.app/ach" && this.sAchComponent) {
				return this.sAchComponent;
			} else if (sKey === "sap.app" && this.sAchComponent && this.oSapAppManifestEntry) {
				return this.oSapAppManifestEntry;
			} else {
				return sap.ui.core.UIComponent.prototype.getManifestEntry.apply(this, arguments);
			}
		}
	});
});