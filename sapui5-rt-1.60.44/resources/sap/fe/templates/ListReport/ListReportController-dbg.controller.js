/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

/* global hasher */
sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/fe/controllerextensions/Transaction",
	"sap/fe/controllerextensions/Routing",
	"sap/fe/controllerextensions/EditFlow",
	'sap/fe/actions/messageHandling',
	"sap/fe/controllerextensions/ContextManager"
	//"sap/fe/controllerextensions/AppState" The AppState is currently deactivated

], function (jQuery, Controller, JSONModel, Transaction, Routing, EditFlow, messageHandling, ContextManager) {
	"use strict";

	/*
	 This coding is deactivated as the FLP does not yet support dynamic tiles for OData v4 - activate once
	 the FLP supports OData v4 as well
	 This coding needs to be adapted to the refactoring then for example ListBindingInfo shall be used
	 instead of the ListBinding

	 function fnCreateRequestUrl(oBinding, sPath, oContext, aUrlParams, bBatch){
	 // create the url for the service
	 var sNormalizedPath,
	 aAllUrlParameters = [],
	 sUrl = "";

	 if (sPath && sPath.indexOf('?') !== -1 ) {
	 sPath = sPath.substr(0, sPath.indexOf('?'));
	 }

	 if (!oContext && !jQuery.sap.startsWith(sPath,"/")) {
	 jQuery.sap.log.fatal(oBinding + " path " + sPath + " must be absolute if no Context is set");
	 }

	 sNormalizedPath = oBinding.getModel().resolve(sPath, oContext);

	 //An extra / is present at the end of the sServiceUrl, taking the normalized url from index 1
	 if (!bBatch) {
	 sUrl = oBinding.getModel().sServiceUrl + sNormalizedPath.substr(1);
	 } else {
	 sUrl = sNormalizedPath.substr(sNormalizedPath.indexOf('/') + 1);
	 }

	 if (aUrlParams) {
	 aAllUrlParameters = aAllUrlParameters.concat(aUrlParams);
	 }

	 if (aAllUrlParameters && aAllUrlParameters.length > 0) {
	 sUrl += "?" + aAllUrlParameters.join("&");
	 }
	 return sUrl;
	 }

	 function fnGetDownloadUrl(oBinding) {
	 var aParams = [];

	 if (oBinding.sFilterParams) {
	 aParams.push(oBinding.sFilterParams);
	 }

	 if (oBinding.sCustomParams) {
	 aParams.push(oBinding.sCustomParams);
	 }

	 if (oBinding.mParameters) {
	 if (oBinding.mParameters.$count) {
	 aParams.push("$count="+oBinding.mParameters.$count);
	 }

	 if (oBinding.mParameters.$filter) {
	 aParams.push("$filter=("+oBinding.mParameters.$filter.replace(/'/g,"%27").replace(/ /g,"%20")+")");
	 }

	 if (oBinding.mParameters.$select) {
	 aParams.push("$select="+oBinding.mParameters.$select.replace(/'/g,"%27").replace(/,/g,"%2c"));
	 }

	 // we can skip the $expand for now as the count shall be the same to avoid unnecessary read requests in the backend
	 // if (oBinding.mParameters.$expand) {
	 // 	aParams.push("$expand="+oBinding.mParameters.$expand.replace(/'/g,"%27").replace(/\//g,"%2f"));
	 // }

	 // we set $top to 0 to avoid that any data is requested - we are only interested in the count
	 aParams.push("$top=0");
	 }

	 var sPath = oBinding.getModel().resolve(oBinding.sPath,oBinding.oContext);

	 if (sPath) {
	 return fnCreateRequestUrl(oBinding,sPath, null, aParams);
	 }
	 }*/

	return Controller.extend("sap.fe.templates.ListReport.ListReportController", {

		transaction : Transaction,
		routing : Routing,
		editFlow : EditFlow,
		//appState : AppState, The AppState is currently deactivated

		// TODO: get rid of this
		// it's currently needed to show the transient messages after the table request fails
		// we assume that the table should show those messages in the future
		messageHandling : messageHandling,
		contextManager: ContextManager,

		onInit: function () {

			var that = this;

			this.oFilterBar = this.byId("template::listReportFilterBar");


			// set filter bar to disabled until app state is loaded
			// TODO: there seems to be a big in the filter layout - to be checked
			//this.oFilterBar.setEnabled(false);

			// disable for now - TODO: enable with actions again
			//this.setShareModel();

			// Set internal UI model and model from transaction controller
			this.getView().setModel(new JSONModel(), "sap.fe.templates.ListReport");
			this.getView().setModel(this.transaction.getUIModel(), "ui");

			that.contextManager.initializeContextManager();

			// request a new appState Model for the view
			/*
			 // The AppState is currently deactivated
			this.appState.requestAppStateModel(this.getView().getId()).then(function(oAppStateModel){
				that.getView().setModel(oAppStateModel, "sap.fe.appState");

				// This is only a workaround as the controls do not yet support binding the appState
				var oAppState = oAppStateModel.getData();
				if (oAppState && oAppState.filterBar) {
					// an app state exists, apply it
					that.applyAppStateToFilterBar().then(function () {
						// enable filterbar once the app state is applied
						that.oFilterBar.setEnabled(true);
					});
				} else {
					that.oFilterBar.setEnabled(true);
				}

				// attach to further app state changed
				//oAppStateModel.bindList("/").attachChange(that.applyAppStateToFilterBar.bind(that));
			});
			*/
		},
		onAfterBinding : function(oBindingContext){
			var that = this,
			oListReport, oTableReady, oInnerTableBinding, bShouldRefresh;

			// This is only a hack to get the table on the list report until UI5 provides an API to provide the list bindings with a path
			if (!this._oTable) {
				oListReport = this.byId("template::listReportPage");
				this._oTable = oListReport.getAggregation("content").getAggregation("items")[0].getAggregation("content");
			}
			oTableReady = this._oTable.done();

			oTableReady.then(function (oTable) {
				// mdc table should provide an API to get the inner table
				oInnerTableBinding = oTable._oTable.getBinding("rows") || oTable._oTable.getBinding("items");
				bShouldRefresh = that.routing.getDirtyState();
				if (Object.keys(bShouldRefresh).length > 0) {
					oInnerTableBinding.refresh();
					that.routing.resetDirtyState();
				}
			});
		},
		// This is only a workaround as the filterBar does not yet support binding the appState
		/*
		 // The AppState is currently deactivated
		createAppStateFromFilterBar: function () {
			var sFilterBarAppState = this.oFilterBar.getAppState();

			if (!sFilterBarAppState) {
				// no app state exists and filter bar does not have any app state relevant changes, there is
				// no need to generate an app state
				return;
			}

			var oAppState = {
				filterBar: sFilterBarAppState
			};

			this.getView().getModel("sap.fe.appState").setData(oAppState);
		},

		// This is only a workaround as the filterBar does not yet support binding the appState
		applyAppStateToFilterBar: function () {
			var	oAppState = this.getView().getModel("sap.fe.appState").getData();

			if (oAppState && oAppState.filterBar) {
				return this.oFilterBar.setAppState(oAppState.filterBar);
			}
		},
		*/

		setShareModel: function () {
			// TODO: deactivated for now - currently there is no _templPriv anymore, to be discussed
			// this method is currently not called anymore from the init method

			var fnGetUser = jQuery.sap.getObject("sap.ushell.Container.getUser");
			//var oManifest = this.getOwnerComponent().getAppComponent().getMetadata().getManifestEntry("sap.ui");
			//var sBookmarkIcon = (oManifest && oManifest.icons && oManifest.icons.icon) || "";

			//shareModel: Holds all the sharing relevant information and info used in XML view
			var oShareInfo = {
				bookmarkTitle: document.title, //To name the bookmark according to the app title.
				bookmarkCustomUrl: function () {
					var sHash = hasher.getHash();
					return sHash ? ("#" + sHash) : window.location.href;
				},
				/*
				 To be activated once the FLP shows the count - see comment above
				 bookmarkServiceUrl: function() {
				 //var oTable = oTable.getInnerTable(); oTable is already the sap.fe table (but not the inner one)
				 // we should use table.getListBindingInfo instead of the binding
				 var oBinding = oTable.getBinding("rows") || oTable.getBinding("items");
				 return oBinding ? fnGetDownloadUrl(oBinding) : "";
				 },*/
				isShareInJamActive: !!fnGetUser && fnGetUser().isJamActive()
			};

			var oTemplatePrivateModel = this.getOwnerComponent().getModel("_templPriv");
			oTemplatePrivateModel.setProperty("/listReport/share", oShareInfo);
		},

		handlers: {
			onSearch: function () {
				if (this.oFilterBar.getLiveUpdate() === false) {
					/* we do not support the GO-Button in the first delivery although it's implemented in the table and filterBar.
					 one missing part is the app state - here we need to add the information that the GO button was pressed once
					 we officially support the Go button as well
					 */
					// The AppState is currently deactivated
					// this.createAppStateFromFilterBar();
				}
			},
			onFilterBarChange: function () {
				if (this.oFilterBar.getLiveUpdate()) {
					// The AppState is currently deactivated
					//this.createAppStateFromFilterBar();
				}
			},

			onShareListReportActionButtonPress: function (oEvent) {
				var localI18nRef = this.getView().getModel("sap.fe.i18n").getResourceBundle();
				if (!this._oShareActionButton) {
					this._oShareActionButton = sap.ui.xmlfragment(
						"sap.fe.templates.ListReport.ShareSheet", {
							shareEmailPressed: function () {
								sap.m.URLHelper.triggerEmail(null, localI18nRef.getText("SAPFE_EMAIL_SUBJECT", [document.title]), document.URL);
							},
							//TODO: JAM integration to be implemented
							shareJamPressed: function () {
							}
						});
					this.getView().addDependent(this._oShareActionButton);
				}
				this._oShareActionButton.openBy(oEvent.getSource());

			},

			onDataReceived : function(){
				// TODO: set the nodata text in case there are errors

				// show the unbound messages but with a timeout as the messages are otherwise not yet in the message model
				setTimeout(this.messageHandling.showUnboundMessages, 0);
			}
		}
	});
});
