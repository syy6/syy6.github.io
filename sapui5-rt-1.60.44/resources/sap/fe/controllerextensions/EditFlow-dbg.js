/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */
/* global Promise */
sap.ui.define(['sap/ui/core/mvc/ControllerExtension',
			'sap/fe/actions/messageHandling',
			'sap/ui/core/XMLTemplateProcessor',
			'sap/ui/core/util/XMLPreprocessor',
			'sap/ui/core/Fragment'
		], function (ControllerExtension, messageHandling, XMLTemplateProcessor, XMLPreprocessor, Fragment) {
		'use strict';

		// TODO: we are not able to extend the transaction controllerExtension and can't create instances of any
		// controllerExtension within this controllerExtension - therefore as a first workaround we rely on the
		// existence of this.base.transaction and this.base.routing

		var sFragmentName = 'sap.fe.controls.field.DraftPopOverAdminData',
			oPopoverFragment = XMLTemplateProcessor.loadTemplate(sFragmentName, 'fragment');

		var Extension = ControllerExtension.extend('sap.fe.controllerextensions.EditFlow', {

			createDocument: function (sListBindingName) {
				var that = this;

				this.base.getView().getModel().getBindingForReference(sListBindingName).then(function (oBinding) {
					that.base.transaction.createDocument(oBinding).then(function (oNewDocumentContext) {
						if (oNewDocumentContext) {
							that.handleNewContext(oNewDocumentContext, false);
						}
					});
				});
			},

			editDocument: function (oContext) {
				var that = this;

				this.base.transaction.editDocument(oContext).then(function (oNewDocumentContext) {
					if (oNewDocumentContext !== oContext) {
						that.handleNewContext(oNewDocumentContext, true);
					}
				});
			},

			saveDocument: function (oContext) {
				var that = this;

				this.base.transaction.saveDocument(oContext).then(function (oActiveDocumentContext) {
					if (oActiveDocumentContext !== oContext) {
						that.handleNewContext(oActiveDocumentContext, true);
					}
				});
			},

			cancelDocument: function (oContext, mParameters) {
				var that = this;

				this.base.transaction.cancelDocument(oContext, mParameters).then(function (oActiveDocumentContext) {
					//in case of a new document, the value of hasActiveEntity is returned. navigate back.
					if (!oActiveDocumentContext) {
						that.base.routing.setDirtyState(oContext, true);
						//This code is workaround for first version will be removed once navigation handler is ready.
						// TODO: temp solution only, directly use window.history.back
						window.history.back();
					} else { //active context is returned in case of cancel of existing document
						that.handleNewContext(oActiveDocumentContext, true);
					}
				});
			},

			deleteDocument: function (oContext, mParameters) {
				var that = this;
				this.base.transaction.deleteDocument(oContext, mParameters).then(function () {
					that.base.routing.setDirtyState(oContext, true);
					//This code is workaround for first version will be removed once navigation handler is ready.
					// TODO: temp solution only, directly use window.history.back
					window.history.back();
				});
			},

			handleNewContext: function (oContext, noHistoryEntry) {
				this.base.routing.setDirtyState(oContext, true);
				this.base.routing.navigateToContext(oContext, {
					noHistoryEntry : noHistoryEntry
				});
			},

			/**
			 * Method to format the text of draft admin owner
			 * @function
			 * @name formatDraftOwnerText
			 * @memberof sap.fe.controllerextensions.EditFlow
			 * @param {Boolean} bHasDraftEntity HasDraftEntity property of draft object
			 * @param {String} sDraftInProcessByUser DraftInProcessByUser property of Draft DraftAdministrativeData
			 * @param {String} sDraftInProcessByUserDesc DraftInProcessByUserDesc property of Draft DraftAdministrativeData
			 * @param {String} sDraftLastChangedByUser DraftLastChangedByUser property of Draft DraftAdministrativeData
			 * @param {String} sDraftLastChangedByUserDesc DraftLastChangedByUserDesc property of Draft DraftAdministrativeData
			 * @param {String} sFlag flag to differanciate between the point of method calls
			 * @returns {String} the draft admin owner string to be shown
			 */
			formatDraftOwnerText: function (bHasDraftEntity, sDraftInProcessByUser, sDraftInProcessByUserDesc, sDraftLastChangedByUser, sDraftLastChangedByUserDesc, sFlag) {
				var sDraftOwnerDescription = '',
					oResourceBundle = sap.ui.getCore().getLibraryResourceBundle('sap.fe');
				if (bHasDraftEntity) {
					var sUserDescription = sDraftInProcessByUserDesc || sDraftInProcessByUser || sDraftLastChangedByUserDesc || sDraftLastChangedByUser;
					if (sFlag) {
						sDraftOwnerDescription += sDraftInProcessByUser ? oResourceBundle.getText('DRAFTINFO_GENERIC_LOCKED_OBJECT_POPOVER_TEXT') : oResourceBundle.getText('DRAFTINFO_LAST_CHANGE_USER_TEXT') + ' ';
					}
					sDraftOwnerDescription += sUserDescription ? oResourceBundle.getText('DRAFTINFO_OWNER', [sUserDescription]) : oResourceBundle.getText('DRAFTINFO_ANOTHER_USER');
				}
				return sDraftOwnerDescription;
			},

			formatDraftOwnerTextInline: function(bHasDraftEntity, sDraftInProcessByUser, sDraftLastChangedByUser, sDraftInProcessByUserDesc, sDraftLastChangedByUserDesc) {
				return this.formatDraftOwnerText(bHasDraftEntity, sDraftInProcessByUser, sDraftInProcessByUserDesc, sDraftLastChangedByUser, sDraftLastChangedByUserDesc, false);
			},
			formatDraftOwnerTextInPopover: function(bHasDraftEntity, sDraftInProcessByUser, sDraftLastChangedByUser, sDraftInProcessByUserDesc, sDraftLastChangedByUserDesc) {
				return this.formatDraftOwnerText(bHasDraftEntity, sDraftInProcessByUser, sDraftInProcessByUserDesc, sDraftLastChangedByUser, sDraftLastChangedByUserDesc, true);
			},

			/**
			 * Method to be executed on click of the link
			 * @function
			 * @name onDraftLinkPressed
			 * @memberof sap.fe.controllerextensions.EditFlow
			 * @param {Event} oEvent event object passed from the click event
			 * @param {String} sEntitySet Name of the entity set for on the fly templating
			 */
			onDraftLinkPressed: function (oEvent, sEntitySet) {
				var that = this,
					oButton = oEvent.getSource(),
					oBindingContext = oButton.getBindingContext(),
					oView = this.base.getView(),
					oMetaModel = oView.getModel().getMetaModel(),
					oController = oView.getController();
				if (!this._oPopover || !this._oPopover.oPopup) {
					Promise.resolve(that._oFragment || XMLPreprocessor.process(oPopoverFragment, {}, {
						bindingContexts: {
							entitySet: oMetaModel.createBindingContext("/" + sEntitySet)
						},
						models: {
							entitySet: oMetaModel
						}
					}))
					.then(function(oFragment) {
						//Remember as we can't template the same fragment twice
						that._oFragment = oFragment;
						return Fragment.load({definition:oFragment, controller: oController});
					})
					.then(function(oPopover) {
						that._oPopover = oPopover;
						oView.addDependent(that._oPopover);
						that._oPopover.setBindingContext(oBindingContext);
						that._oPopover.openBy(oButton);
					});
				}
				this._oPopover.setBindingContext(oBindingContext);
				this._oPopover.openBy(oButton);
			},

			/**
			 * Method to be executed on click of the close button of the draft admin data popover
			 * @function
			 * @name closeDraftAdminPopover
			 * @memberof sap.fe.controllerextensions.EditFlow
			 */
			closeDraftAdminPopover: function(){
				this._oPopover.close();
			},

			/**
			 * display an indicator of draft at footer based upon patch request & response
			 * @function
			 * @name handleDraftPatchEvents
			 * @memberof sap.fe.controllerextensions.EditFlow
			 * @param {Object} oBinding odata context binding object
			 */
			handleDraftPatchEvents: function (oBinding) {
				var oUIModel = this.base.getView().getModel('ui');
				var that = this;
				oBinding.attachEvent('patchSent', function () {
					// for the time being until the model does the synchronization we set the context to dirty
					// therefore the list report is refreshed. once the model does the synchronization this coding
					// needs to be removed
					that.base.routing.setDirtyState(oBinding, true);
					oUIModel.setProperty('/draftStatus', 'Saving');
				});
				oBinding.attachEvent('patchCompleted', function (event) {
					oUIModel.setProperty('/draftStatus', event.getParameter('success') ? 'Saved' : 'Clear');
					messageHandling.showUnboundMessages();
				});
			}

		});

		return Extension;
	}
);
