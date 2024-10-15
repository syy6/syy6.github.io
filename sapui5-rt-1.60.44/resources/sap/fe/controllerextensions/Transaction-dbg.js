/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define(['sap/ui/core/mvc/ControllerExtension',
	'sap/fe/actions/draft',
	'sap/fe/actions/nonDraft',
	'sap/fe/actions/operations',
	'sap/fe/model/DraftModel',
	"sap/ui/model/json/JSONModel",
	'sap/fe/actions/messageHandling',
	'sap/m/Text',
	'sap/m/Button',
	'sap/m/Popover',
	'sap/m/VBox',
	'sap/m/MessageBox'],
	function (ControllerExtension, draft, nonDraft, operations, DraftModel, JSONModel, messageHandling, Text, Button, Popover, VBox, MessageBox) {
		'use strict';

		/* Make sure that the mParameters is not the oEvent */
		function getParameters(mParameters) {
			if (mParameters && mParameters.getMetadata &&
				mParameters.getMetadata().getName() === 'sap.ui.base.Event') {
				mParameters = {};
			}
			return mParameters || {};
		}

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
		var Extension = ControllerExtension.extend('sap.fe.controllerextensions.Transaction', {

			getProgrammingModel: function (oModel) {
				var that = this;
				oModel = oModel || this.getDataModel(); // TODO: get rid of getdataModel once changed for all methods

				if (!this.sProgrammingModel) {
					// For now we only support draft and non-draft - if statefulUI comes into place we need to change
					// this logic
					return DraftModel.upgradeOnDemand(oModel).then(function (bIsDraft) {
						that.sProgrammingModel = bIsDraft ? 'Draft' : 'NonDraft';
						return that.sProgrammingModel;
					});
				} else {
					return Promise.resolve(this.sProgrammingModel);
				}
			},

			getDataModel: function () {
				// TODO: This is just a PoC - we need to define how to parametrize the data model
				return this.base.getView().getModel();
			},

			getUIModel: function () {
				if (!this.uiModel) {
					this.uiModel = new JSONModel({
						editable: false,
						busy : false,
						draftStatus: 'Clear'
					});
				}
				return this.uiModel;
			},

			/**
			 * Creates a new document
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Transaction#createDocument
			 * @memberof sap.fe.controllerextensions.Transaction
			 * @static
			 * @param {Promise|sap.ui.model.odata.v4.ODataListBinding} vListBinding  ODataListBinding object or a promise that resolve to it
			 * @returns {Promise} Promise resolves with New Binding Context
			 *
			 * @sap-restricted
			 * @final
			 */
			createDocument: function (oListBinding) {
				var oUIModel = this.getUIModel();

				// Double-Click-Protection if user executes action again until controls are really busy
				if (oUIModel.getProperty("/busy")){
					return Promise.reject("Action can only be called once at a time");
				}

				return this.getProgrammingModel(oListBinding.getModel()).then(function (sProgrammingModel) {
					var oNewDocumentContext = oListBinding.create();
					switch (sProgrammingModel) {
						case 'Draft' :
							oUIModel.setProperty("/busy", true);

							return oNewDocumentContext.created().then(function() {
								oUIModel.setProperty("/busy", false);
								return messageHandling.showUnboundMessages().then(function(){
									return oNewDocumentContext;
								});
							});
						case 'NonDraft' :
							return oNewDocumentContext;
					}
				}).catch(function (err){
					oUIModel.setProperty("/busy", false);
					messageHandling.showUnboundMessages();
					return Promise.reject(err);
				});
			},

			/**
			 * Delete one or multiple document(s)
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Transaction#deleteDocument
			 * @memberof sap.fe.controllerextensions.Transaction
			 * @static
			 * @param {sap.ui.model.odata.v4.Context} contexts Either one context or an array with contexts to be deleted
			 * @param {map} [mParameters] Optional, can contain the following attributes:
			 * @param {string} title, Title of the object to be deleted
			 * @param {string} description, Description of the object to be deleted
			 **/
			deleteDocument: function (vContexts, mParameters) {
				var oUIModel = this.getUIModel(),
				fnResolve,
				fnReject;
				// Double-Click-Protection if user executes action again until controls are really busy
				if (oUIModel.getProperty("/busy")) {
					return Promise.reject("Action can only be called once at a time");
				}

				oUIModel.setProperty("/busy", true);
				mParameters = getParameters(mParameters);
				var localI18nRef =  sap.ui.getCore().getLibraryResourceBundle("sap.fe"),
					aParams,
					oDeleteMessage = {
						title: localI18nRef.getText("OBJECT_PAGE_DELETE")
					};
				if (mParameters.title) {
					if (mParameters.description) {
						aParams = [mParameters.title, mParameters.description];
						oDeleteMessage.text = localI18nRef.getText("OBJECT_PAGE_CONFIRM_DELETE_WITH_OBJECTINFO", aParams);
					} else {
						aParams = [mParameters.title];
						oDeleteMessage.text = localI18nRef.getText("OBJECT_PAGE_CONFIRM_DELETE_WITH_OBJECTTITLE", aParams);
					}
				} else {
					oDeleteMessage.text = localI18nRef.getText("OBJECT_PAGE_CONFIRM_GENERIC_DELETE");
				}

				MessageBox.show(oDeleteMessage.text, {
					icon: MessageBox.Icon.WARNING,
					title: oDeleteMessage.title,
					actions: [MessageBox.Action.DELETE, MessageBox.Action.CANCEL],
					onClose: function (oAction) {
						if (oAction === MessageBox.Action.DELETE) {
							var aContexts = Array.isArray(vContexts) ? vContexts : [vContexts];
							return Promise.all(aContexts.map(function (oContext) {
								oContext.delete().then(function () {
									oUIModel.setProperty("/busy", false);
									fnResolve();
								}).catch(function(oError){
									oUIModel.setProperty("/busy", false);
									messageHandling.showUnboundMessages();
									fnReject();
								});
							}));
						}
						oUIModel.setProperty("/busy", false);
					}
				});

				return new Promise(function (resolve, reject) {					
					fnReject = reject;
					fnResolve = resolve;
				});

			},

			/**
			 * Edit a document
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Transaction#editDocument
			 * @memberof sap.fe.controllerextensions.Transaction
			 * @static
			 * @param {sap.ui.model.odata.v4.Context} Context of the active document
			 * @returns {Promise} Promise resolves with the new Draft Context in case of draft programming model
			 *
			 * @sap-restricted
			 * @final
			 */
			editDocument: function (oContext) {
				var that = this;
				var oUIModel = this.getUIModel();

				// Double-Click-Protection if user executes action again until controls are really busy
				if (oUIModel.getProperty("/busy")){
					return Promise.reject("Action can only be called once at a time");
				}

				return this.getProgrammingModel(oContext.getModel()).then(function (sProgrammingModel) {
					switch (sProgrammingModel) {
						case 'Draft':
							// store the active context as it can be used in case of deleting the draft
							that.activeContext = oContext;

							oUIModel.setProperty("/busy", true);

							return draft.createDraftFromActiveDocument(oContext, {
								bPreserveChanges: false
							});
						case 'NonDraft':
							return oContext;
					}
				}).then(function (oNewContext) {
					oUIModel.setProperty("/editable", true);
					oUIModel.setProperty("/busy", false);

					return messageHandling.showUnboundMessages().then(function(){
						return oNewContext;
					});
				}).catch(function (err){
					oUIModel.setProperty("/busy", false);
					messageHandling.showUnboundMessages();
					return Promise.reject(err);

				});
			},

			/**
			 * Update document
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Transaction#updateDocument
			 * @memberof sap.fe.controllerextensions.Transaction
			 * @static
			 * @param {map} [mParameters] Optional, can contain the following attributes:
			 * @param {sap.ui.model.odata.v4.Context} [mParameters.context] Context of the active document
			 * @returns {Promise} Promise resolves with ???
			 *
			 * @sap-restricted
			 * @final
			 */
			updateDocument: function () {
				return Promise.resolve();
			},

			/**
			 * Cancel edit of a document
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Transaction#cancelDocument
			 * @memberof sap.fe.controllerextensions.Transaction
			 * @static
			 * @param {sap.ui.model.odata.v4.Context} {oContext} Context of the document to be canceled / deleted
			 * @param {map} [mParameters] Optional, can contain the following attributes:
			 * @param {sap.m.Button} {mParameters.cancelButton} Cancel Button of the discard popover (mandatory for now)
			 * @returns {Promise} Promise resolves with ???
			 *
			 * @sap-restricted
			 * @final
			 */
			cancelDocument: function (oContext, mParameters) {
				var that = this,
					oUIModel = that.getUIModel(),
					bIsModified, sProgrammingModel, sCanonicalPath;

				// Double-Click-Protection if user executes action again until controls are really busy
				if (oUIModel.getProperty("/busy")){
					return Promise.reject("Action can only be called once at a time");
				}
				//context must always be passed - mandatory parameter
				if (!oContext) {
					return Promise.reject("No context exists. Pass a meaningful context");
				}
				var mParameters = getParameters(mParameters),
					oParamsContext = oContext,
					oCancelButton = mParameters.cancelButton,
					oModel = oParamsContext.getModel();

				return this.getProgrammingModel().then(function (sPModel) {
					sProgrammingModel = sPModel;
					if (sPModel === "Draft") {
						oUIModel.setProperty("/busy", true);
						var draftDataContext = oModel.bindContext(oParamsContext.getPath() + '/DraftAdministrativeData').getBoundContext();
						return draftDataContext.requestObject().then(function (draftAdminData) {
							bIsModified = !(draftAdminData.CreationDateTime === draftAdminData.LastChangeDateTime);
							return bIsModified;
						});
					} else if (sPModel === "NonDraft") {
						bIsModified = oParamsContext.hasPendingChanges();
						return bIsModified;
					}
				}).then(function (bModified) {
					return that._showDiscardPopover(oCancelButton, bModified);
				}).then(function () {
					switch (sProgrammingModel) {
						case 'Draft':
							var oParamsContextData = oParamsContext.getObject(),
								bHasActiveEntity = oParamsContextData && oParamsContextData.HasActiveEntity;
							if (!bHasActiveEntity) {
								oParamsContext.delete();
								return bHasActiveEntity;
							} else {
								var oActiveContext = that.activeContext || oModel.bindContext(oParamsContext.getPath() + '/SiblingEntity').getBoundContext();
								return oActiveContext.requestCanonicalPath().then(function (sPath) {
									sCanonicalPath = sPath;
									return oParamsContext.delete();
								}).then(function () { //oParamsContext.delete() in the previous promise doesnt return anything upon success.
									if (oActiveContext.getPath() !== sCanonicalPath) {
										// the active context is using the sibling entity - this path is not accessible anymore as we deleted the draft
										// document - therefore we need to create a new context with the canonical path
										oActiveContext = oModel.bindContext(sCanonicalPath).getBoundContext();
									}
									return oActiveContext;
								});
							}
							break;
						case 'NonDraft':
							if (oParamsContext === oContext && bIsModified) {
								oContext.getBinding().resetChanges();
							}
							break;
					}
				}).then(function (context) {
					oUIModel.setProperty("/editable", false);
					oUIModel.setProperty("/busy", false);
					return messageHandling.showUnboundMessages().then(function(){
						return context;
					});
				}).catch(function (err) {
					oUIModel.setProperty("/busy", false);
					messageHandling.showUnboundMessages();
					return Promise.reject(err);
				});
			},

			/**
			 * Save document
			 *
			 * @function
			 * @name sap.fe.controllerextensions.Transaction#saveDocument
			 * @memberof sap.fe.controllerextensions.Transaction
			 * @static
			 * @param {sap.ui.model.odata.v4.Context} Context of the document that should be saved
			 * @returns {Promise} Promise resolves with ???
			 *
			 * @sap-restricted
			 * @final
			 */
			saveDocument: function (oContext) {
				var that = this,
					oUIModel = this.getUIModel();

				// Double-Click-Protection if user executes action again until controls are really busy
				if (oUIModel.getProperty("/busy")){
					return Promise.reject("Action can only be called once at a time");
				}

				oUIModel.setProperty("/busy", true);

				return this.getProgrammingModel(oContext.getModel()).then(function (sProgrammingModel) {
					switch (sProgrammingModel) {
						case 'Draft':
							return draft.activateDocument(oContext);
						case 'NonDraft':
							//This is submitting the in saved changes to backend
							that.getDataModel().submitBatch(that.getDataModel().getUpdateGroupId());
							return oContext;
							/* oUIModel.setProperty("/editable", false);
							break; */
					}
				}).then(function (oActiveDocument) {
					oUIModel.setProperty("/editable", false);
					oUIModel.setProperty("/busy", false);

					return messageHandling.showUnboundMessages().then(function(){
						return oActiveDocument;
					});

				}).catch(function (err) {
					oUIModel.setProperty("/busy", false);
					messageHandling.showUnboundMessages();
					return Promise.reject(err);
				});
			},

			/**
			 * Calls a bound action for one or multiple contexts
			 * @function
			 * @static
			 * @name sap.fe.controllerextensions.Transaction.callBoundAction
			 * @memberof sap.fe.controllerextensions.Transaction
			 * @param {string} sActionName The name of the action to be called
			 * @param {sap.ui.model.odata.v4.Context} contexts Either one context or an array with contexts for which the action shall be called
			 * @param {map} [mParameters] Optional, can contain the following attributes:
			 * @param {string} [mParameters.invocationGrouping] [Isolated] mode how actions shall be called: Changeset to put all action calls into one changeset, Isolated to put them into separate changesets (TODO: create enum)
			 * @param {string} [mParameters.label] a human-readable label for the action
			 * @returns {Promise} Promise resolves with an array of response objects (TODO: to be changed)
			 * @sap-restricted
			 * @final
			 */
			callBoundAction: function (sActionName, contexts, mParameters) {
				mParameters = mParameters || {};
				var oUIModel = this.getUIModel(),
					that = this;

				// Double-Click-Protection if user executes action again until controls are really busy
				if (oUIModel.getProperty("/busy")){
					return Promise.reject("Action can only be called once at a time");
				}

				return this.getProgrammingModel().then(function (sProgrammingModel) {
					if (sProgrammingModel === 'NonDraft') {
						// TODO: check if there are pending changes and inform the user that he needs to save before
					}

					// get the query parameters for this action from it's side effect
					var mBindingParameters = that._getBindingParameters(sActionName);
					return operations.callBoundAction(sActionName, contexts, {
						invocationGrouping: mParameters.invocationGrouping,
						label: mParameters.label,
						showActionParameterDialog: true,
						bindingParameters: mBindingParameters,
						onSubmitted: function () {
							oUIModel.setProperty("/busy", true);
						}
					});
				}).then(function () {
						// Succeeded
						oUIModel.setProperty("/busy", false);
						return messageHandling.showUnboundMessages();
					}).catch( function (err) {
						oUIModel.setProperty("/busy", false);
						messageHandling.showUnboundMessages();
						return Promise.reject(err);

				});
			},

			/**
			 * Get the query parameters for bound action from side effect, if annotated for provided action
			 * TODO: Add support for $expand when the model supports it.
			 * @function
			 * @static
			 * @name sap.fe.controllerextensions.Transaction._getBindingParameters
			 * @memberof sap.fe.controllerextensions.Transaction
			 * @param {string} sActionName The name of the bound action for which to get the side effects
			 * @returns {map} Map of query parameters with $select and $expand
			 * @private
			 * @sap-restricted
			 */
			_getBindingParameters: function (sActionName) {
				if (!sActionName) {
					return;
				}
				var oMetaModel = this.getDataModel().getMetaModel(),
					oSideEffect = oMetaModel.getObject("/" + sActionName + '@com.sap.vocabularies.Common.v1.SideEffects');
				if (!oSideEffect) {
					return;
				}
				var mParameters = {},
					aTargetProperties = oSideEffect.TargetProperties,
					aTargetEntities = oSideEffect.TargetEntities;
				//add $select, $expand for properties
				if (Array.isArray(aTargetProperties) && aTargetProperties.length) {
					mParameters['$select'] = "";
					aTargetProperties.forEach(function (oProperty) {
						var sPropertyPath = oProperty['$PropertyPath'];
						if (sPropertyPath.indexOf('_it/') !== 0) {
							mParameters['$select'] += (sPropertyPath + ',');
						} else {
							mParameters['$expand'] = mParameters['$expand'] || "";
							mParameters['$expand'] += (sPropertyPath.slice(4) + ','); //remove '_it/' from the property path
						}
					});
					//remove trailing ','
					mParameters['$select'] = mParameters['$select'].slice(0, -1);
					mParameters['$expand'] = mParameters['$expand'] ? mParameters['$expand'].slice(0, -1) : undefined;
				}
				//add $expand for entity
				if (Array.isArray(aTargetEntities) && aTargetEntities.length) {
					//Not supported for now
				}
				return mParameters;
			},

			/**
			 * Shows a popover if it needs to be shown.
			 * TODO: Popover is shown if user has modified any data.
			 * TODO: Popover is shown if there's a difference from draft admin data.
			 * @function
			 * @static
			 * @name sap.fe.controllerextensions.Transaction._showDiscardPopover
			 * @memberof sap.fe.controllerextensions.Transaction
			 * @param {sap.ui.core.Control} oCancelButton The control which will open the popover
			 * @returns {Promise} Promise resolves if user confirms discard, rejects if otherwise, rejects if no control passed to open popover
			 * @sap-restricted
			 * @final
			 * TODO: Implement this popover as a fragment as in v2??
			 */
			_showDiscardPopover: function (oCancelButton, bIsModified) {
				var that = this,
					oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.fe");
				that._bContinueDiscard = false;
				// to be implemented
				return new Promise(function (resolve, reject) {
					if (!oCancelButton) {
						reject("Cancel button not found");
					}
					//Show popover only when data is changed.
					if (bIsModified) {
						var fnOnAfterDiscard = function() {
							oCancelButton.setEnabled(true);
							 if (that._bContinueDiscard) {
								resolve();
							} else {
								reject("Discard operation was rejected. Document has not been discarded");
							}
							that._oPopover.detachAfterClose(fnOnAfterDiscard);
						};
						if (!that._oPopover) {
							that._oPopover = new Popover({
								showHeader: false,
								placement: "Top",
								content: [
									new VBox({
										items: [
											new Text({
												//This text is the same as LR v2.
												//TODO: Display message provided by app developer???
												text: oResourceBundle.getText("SAPFE_DRAFT_DISCARD_MESSAGE")
											}),
											new Button({
												text: oResourceBundle.getText("SAPFE_DRAFT_DISCARD_BUTTON"),
												width: "100%",
												press: function () {
													that._bContinueDiscard = true;
													that._oPopover.close();
												}
											})
										]
									})
								],
								beforeOpen: function () {
									// make sure to NOT trigger multiple cancel flows
									oCancelButton.setEnabled(false);
								}
							});
							that._oPopover.addStyleClass("sapUiContentPadding");
						}
						that._oPopover.attachAfterClose(fnOnAfterDiscard);
						that._oPopover.openBy(oCancelButton);
					} else {
						resolve();
					}
				});
			}
		});

		return Extension;
	}
);
