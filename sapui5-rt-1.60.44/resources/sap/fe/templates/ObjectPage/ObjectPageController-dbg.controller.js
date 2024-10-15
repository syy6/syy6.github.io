/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"jquery.sap.global",
	"sap/ui/core/mvc/Controller",
	"sap/fe/controllerextensions/Transaction",
	"sap/fe/controllerextensions/Routing",
	"sap/fe/controllerextensions/EditFlow",
	"sap/ui/model/json/JSONModel",
	"sap/fe/controllerextensions/ContextManager"
], function (jQuery, Controller, Transaction, Routing, EditFlow, JSONModel,ContextManager) {
	"use strict";

	return Controller.extend("sap.fe.templates.ObjectPage.ObjectPageController", {

		transaction : Transaction,
		routing : Routing,
		editFlow : EditFlow,
		contextManager: ContextManager,

		onInit : function(){
			this.getView().setModel(this.transaction.getUIModel(), "ui");
			this.contextManager.initializeContextManager();
		},

		onBeforeBinding: function() {
			// set the UI to not editable before binding it
			// TODO: we should check how this comes together with the transaction controllerExtension, same to the change in the afterBinding
			var oUIModel = this.getView().getModel('ui');
			oUIModel.setProperty('/editable', false);

			var oObjectPage = this.byId("objectPage");

			// Srcoll to present Section so that bindings are enabled during navigation through paginator buttons, as there is no view rerendering/rebind
			var fnScrollToPresentSection = function(oEvent) {
				oObjectPage.scrollToSection(oObjectPage.getScrollingSectionId());
				oObjectPage.detachModelContextChange(fnScrollToPresentSection);
			};

			oObjectPage.attachModelContextChange(fnScrollToPresentSection);

			//Setting the context binding to inactive state for all object page components.
			oObjectPage.getHeaderTitle().setBindingContext(null);
			oObjectPage.getHeaderContent()[0].setBindingContext(null);//The 0 is used because header content will have only one content (FlexBox).
			oObjectPage.getSections().forEach(function(oSection){
				oSection.getSubSections().forEach(function(oSubSection){
					oSubSection.setBindingContext(null);
				});
			});
			//Attaching the event to make the subsection context binding active when it is visible.
			oObjectPage.attachEvent("subSectionEnteredViewPort", function(oEvent) {
				var oObjectPage = oEvent.getSource();
				var oSubSection = oEvent.getParameter("subSection");
				oObjectPage.getHeaderTitle().setBindingContext(undefined);
				oObjectPage.getHeaderContent()[0].setBindingContext(undefined);//The 0 is used because header content will have only one content (FlexBox).
				oSubSection.setBindingContext(undefined);
			});
		},

		onAfterBinding : function(oBindingContext, mParameters) {
			var oObjectPage = this.byId("objectPage");

			if (mParameters && mParameters.parentBinding){
				// activate the paginators
				var oPaginator = this.byId("paginator");
				if (!oPaginator.getListBinding()) {
					oPaginator.setListBinding(mParameters.parentBinding);
				}
			}

			// should be called only after binding is ready hence calling it in onAfterBinding
			oObjectPage._triggerVisibleSubSectionsEvents();
			var oData = oBindingContext.getObject();
			//oData will be undefined after a Cancel is executed
			if (oData && oData.IsActiveEntity === false) {
				// incase the document is draft set it in edit mode
				this.getView().getModel('ui').setProperty('/editable', true);
				this.editFlow.handleDraftPatchEvents(oBindingContext.getBinding());
			}
		}
	});
});
