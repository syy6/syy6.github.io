/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

// Provides static functions to call OData actions (bound/import) and functions (bound/import)
sap.ui.define(['sap/m/MessageBox', "sap/m/Dialog", 'sap/ui/layout/form/SimpleForm', 'sap/ui/mdc/base/Field', 'sap/m/Label', "sap/ui/model/json/JSONModel"],
	function (MessageBox, Dialog, SimpleForm, Field, Label, JSONModel) {
		'use strict';

		/**
		 * Calls a bound action for one or multiple contexts
		 * @function
		 * @static
		 * @name sap.fe.actions.operations.callBoundAction
		 * @memberof sap.fe.actions.operations
		 * @param {string} sActionName The name of the action to be called
		 * @param {sap.ui.model.odata.v4.Context} contexts Either one context or an array with contexts for which the action shall be called
		 * @param {map} [mParameters] Optional, can contain the following attributes:
		 * @param {map} [mParameters.actionParameters] a map of parameters to be sent for every action call
		 * @param {boolean} [mParameters.showActionParameterDialog] [false] if set and if parameters exist the user retrieves a dialog to fill in parameters, if actionParameters are passed they are shown to the user
		 * @param {string} [mParameters.label] a human-readable label for the action
		 * @param {string} [mParameters.invocationGrouping] [Isolated] mode how actions shall be called: Changeset to put all action calls into one changeset, Isolated to put them into separate changesets
		 * @param {function} [mParameters.onSubmitted] Function which is called once the actions are submitted with an array of promises
		 * @returns {Promise} Promise resolves with an array of response objects (TODO: to be changed)
		 * @private
		 * @sap-restricted
		 */
		function callBoundAction(sActionName, contexts, mParameters) {
			return new Promise(function (resolve, reject) {
				var aContexts,
					fnExecuteAction,
					fnOnSubmitted = mParameters.onSubmitted,
					aActionParameters = mParameters.actionParameters || [],
					oModel,
					oAction,
					oOverloadedAction,
					aActionPromises = [],
					sGroupId,
					i,
					sActionLabel = mParameters.label,
					bGrouped = mParameters.invocationGrouping === 'ChangeSet',
					bIsCriticalAction,
					bShowActionParameterDialog = mParameters.showActionParameterDialog,
					mBindingParameters = mParameters.bindingParameters,
					fnDialog;

				if (!contexts || contexts.length === 0) { //In Freestyle apps bound actions can have no context
					return reject("Bound actions always requires at least one context");
				}

				// we expect either one context or an array of contexts
				aContexts = Array.isArray(contexts) ? contexts : [contexts];

				// we expect that all contexts are from the same model
				oModel = aContexts[0].getModel();

				sActionName = resolveActionName(sActionName);
				bIsCriticalAction = getIsActionCritical(sActionName, oModel);

				if (bShowActionParameterDialog || aActionParameters.length > 0) {
					oOverloadedAction = getOverloadedAction(sActionName, oModel, aContexts);
					aActionParameters = prepareActionParameters(oOverloadedAction, aActionParameters);
					if (!aActionParameters || aActionParameters.length === 0) {
						bShowActionParameterDialog = false;
					}
				}

				if (bShowActionParameterDialog) {
					fnDialog = showActionParameterDialog;
				} else if (bIsCriticalAction) {
					fnDialog = confirmCriticalAction;
				}

				fnExecuteAction = function (oAction, index) {
					if (aActionParameters && aActionParameters.length) {
						for (var j = 0; j < aActionParameters.length; j++) {
							oAction.setParameter(aActionParameters[j].$Name, aActionParameters[j].value);
						}
					}

					// TODO: workaround as long as the v4 model does not allow multiple changesets within one $batch
					sGroupId = index && !bGrouped ? '$auto.' + index : undefined;
					aActionPromises.push(oAction.execute(sGroupId));
				};

				// TODO: return result to be refactored
				function fnDifferentiate(promise) {
					return promise.then(function (response) {
							return {response: response, status: "resolved"};
						},
						function (response) {
							return {response: response, status: "rejected"};
						});
				}

				(fnDialog ? fnDialog(sActionLabel, aActionParameters) : Promise.resolve(true)).then(function (bContinue) {
					if (bContinue) {
						for (i = 0; i < aContexts.length; i++) {
							oAction = oModel.bindContext(sActionName + '(...)', aContexts[i], mBindingParameters);
							fnExecuteAction(oAction, (aContexts.length <= 1 ? null : i));
						}

						// trigger onSubmitted "event"
						(fnOnSubmitted || jQuery.noop)(aActionPromises);

						// TODO: to be refactored
						Promise.all(aActionPromises.map(fnDifferentiate)).then(function (results) {
							var aRejectedItems = [], aResolvedItems = [];
							var iResultCount;
							for (iResultCount = 0; iResultCount < results.length; iResultCount++) {
								if (results[iResultCount].status === "rejected") {
									aRejectedItems.push(results[iResultCount].response);
								}
								if (results[iResultCount].status === "resolved") {
									aResolvedItems.push(results[iResultCount].response);
								}
							}
							if (!results || (results && results.length === 0)) {
								reject(true);
							}
							if (aRejectedItems.length === 0) {
								resolve(aResolvedItems);
							} else {
								reject({
									resolvedItems: aResolvedItems,
									rejectedItems: aRejectedItems
								});
							}
						});
					}
				});
			});

		}

		/**
		 * Calls an action import
		 * @function
		 * @static
		 * @name sap.fe.actions.operations.callActionImport
		 * @memberof sap.fe.actions.operations
		 * @param {string} sActionName The name of the action import to be called
		 * @param {sap.ui.model.odata.v4.ODataModel} oModel An instance of an OData v4 model
		 * @param {map} [mParameters] Optional, can contain the following attributes:
		 * @param {map} [mParameters.actionParameters] a map of parameters to be sent with the action import
		 * @param {string} [mParameters.label] a human-readable label for the action
		 * @param {boolean} [mParameters.showActionParameterDialog] [false] if set and if parameters exist the user retrieves a dialog to fill in parameters, if actionParameters are passed they are shown to the user
		 * @param {function} [mParameters.onSubmitted] Function which is called once the actions are submitted with an array of promises
		 * @returns {Promise} Promise resolves with an array of response objects (TODO: to be changed)
		 * @private
		 * @sap-restricted
		 */
		function callActionImport(sActionName, oModel, mParameters) {
			var aActionParameters = mParameters.actionParameters || [],
				fnOnSubmitted = mParameters.onSubmitted,
				oAction, oActionImport, oActionPromise, bIsCriticalAction,
				sActionLabel = mParameters.label,
				bShowActionParameterDialog = mParameters.showActionParameterDialog,
				fnDialog;

			if (!oModel) {
				return Promise.reject("Action expects a model/context for execution");
			}

			sActionName = resolveActionName(sActionName);
			oActionImport = getOverloadedAction(sActionName, oModel, null);
			bIsCriticalAction = getIsActionCritical(sActionName, oModel);

			if (!oActionImport || oActionImport.$kind !== "ActionImport") {
				return Promise.reject("Action Import not found");
			}

			if (bShowActionParameterDialog || aActionParameters.length > 0) {
				aActionParameters = prepareActionParameters(oActionImport, aActionParameters);
				if (aActionParameters.length === 0) {
					bShowActionParameterDialog = false;
				}
			}

			if (bShowActionParameterDialog) {
				fnDialog = showActionParameterDialog;
			} else if (bIsCriticalAction) {
				fnDialog = confirmCriticalAction;
			}

			(fnDialog ? fnDialog(sActionLabel, aActionParameters) : Promise.resolve(true)).then(function (bContinue) {
				if (bContinue) {
					//TODO: Unsure on this. Check how this needs to be done and then go ahead.
					oAction = oModel.bindContext("/" + sActionName + '(...)');

					if (aActionParameters && aActionParameters.length) {
						for (var j = 0; j < aActionParameters.length; j++) {
							oAction.setParameter(aActionParameters[j].name, aActionParameters[j].value);
						}
					}

					oActionPromise = oAction.execute('actionImport');
					oModel.submitBatch('actionImport');

					// trigger onSubmitted "event"
					(fnOnSubmitted || jQuery.noop)(oActionPromise);

					return oActionPromise;
				}
			});

		}

		/*
		 Not yet implemented
		 function callBoundFunction(mParameters){
		 }

		 function callFunctionImport(mParameters){
		 }
		 */

		function confirmCriticalAction(sActionName, sActionLabel) {
			return new Promise(function (resolve, reject) {
				var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.fe"),
					sConfirmationText;

				if (oResourceBundle.hasText("SAPFE_ACTION_CONFIRM|" + sActionName)) {
					sConfirmationText = oResourceBundle.getText("SAPFE_ACTION_CONFIRM|" + sActionName);
				} else {
					sConfirmationText = oResourceBundle.getText("SAPFE_ACTION_CONFIRM");
				}

				MessageBox.confirm(sConfirmationText, {
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.OK) {
							resolve(true);
						}
						resolve(false);
					},
					title: sActionLabel || oResourceBundle.getText("SAPFE_ACTION_CONFIRM_TITLE")
				});
			});
		}

		// TODO: this could be moved to a control but for now create it here
		function showActionParameterDialog(sActionLabel, aParameters) {
			return new Promise(function (resolve, reject) {
				var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.fe"),
					aFields = [],
					oParameterModel = new JSONModel(),
					oLabel, oField;

				function getDataTypeFormat(oDataType) {
					return (oDataType === 'Edm.Date' || oDataType === 'Edm.DateTimeOffset') ? {
						style: 'medium'
					} : {};
				}

				// This is needed as the current mdc base field does not handle the required
				// TODO: to be discussed with mdc team
				function handleChange(oEvent) {
					var oField = oEvent.oSource;
					var sValue = oEvent.getParameter("value");
					var bValid = oEvent.getParameter("valid");
					if (bValid && sValue != "") {
						oField.setValueState(sap.ui.core.ValueState.None);
						oField.setValueStateText("");
					}
				}

				var oDialogContent = new SimpleForm();
				oDialogContent.setModel(oParameterModel);
				for (var i = 0; i < aParameters.length; i++) {
					oLabel = new Label({
						text: aParameters[i].$Name // TODO: get Label
					});
					oField = new Field({
						value: "{/" + aParameters[i].$Name + '}',
						required: aParameters[i].$Nullable === false,
						dataType: aParameters[0].$Type,
						width: "100%",
						multipleLines: false,
						dataTypeConstraints: {
							precision: aParameters[i].$Type || 0
						},
						dataTypeFormatOptions: getDataTypeFormat(aParameters[i].$Type),
						change: handleChange.bind(this)
					});
					oLabel.setLabelFor(oField);
					oDialogContent.addContent(oLabel);
					oDialogContent.addContent(oField);
					aFields.push({
						field: oField,
						label: oLabel
					});
				}

				var oDialog = new Dialog({
					title: sActionLabel || oResourceBundle.getText("SAPFE_ACTION_PARAMETER_DIALOG_TITLE"),
					content: [oDialogContent],
					beginButton: {
						text: sActionLabel || oResourceBundle.getText("SAPFE_ACTION_PARAMETER_DIALOG_OK"),
						press: function () {
							var oField, bError, i;

							for (i in aFields) {
								oField = aFields[i].field;
								if (oField.getRequired() && (oField.getValue() === "" || oField.getValue() === null)) {
									oField.setValueState("Error");
									oField.setValueStateText(oResourceBundle.getText("SAPFE_ACTION_PARAMETER_REQUIRED"));
									bError = true;
								}
							}
							if (!bError) {
								for (i = 0; i < aParameters.length; i++) {
									aParameters[i].value = oParameterModel.getProperty("/" + aParameters[i].$Name);
								}
								oDialog.close();
								resolve(true);
							}

						}
					},
					endButton: {
						text: oResourceBundle.getText("SAPFE_ACTION_PARAMETER_DIALOG_CANCEL"),
						press: function () {
							oDialog.close();
							resolve(false);
						}
					}
				});

				oDialog.open();
			});
		}

		function prepareActionParameters(oAction, aPredefinedParameters) {
			// check if parameters exist at all
			var aParameters = getActionParameters(oAction);
			aPredefinedParameters = aPredefinedParameters || [];

			if (aPredefinedParameters.length > 0) {
				// TODO: merge the predefined once with the real existing one
			}

			return aParameters;
		}

		/*
		 in case of bound actions return the right action considering overloading of actions
		 as unbound actions cannot be overloaded, return the action instance
		 */
		function getOverloadedAction(sActionName, oModel, aContexts) {
			if (!sActionName) {
				return Promise.reject("Action name is empty");
			}

			var oMetaModel = oModel.getMetaModel();
			var oAction = oMetaModel.getObject("/" + sActionName), aParameters = [], sEntityType;
			if (!oAction) {
				return Promise.reject("Action with the name" + sActionName + "does not exist");
			}
			if (oAction.length) {
				for (var index = 0; index < oAction.length; index++) {
					aParameters = oAction[index].$Parameter;
					if (aParameters && aParameters.length) {
						sEntityType = oMetaModel.getObject(oMetaModel.getMetaPath(aContexts[0].getPath()) + "/$Type");
						if (aParameters[0] && aParameters[0].$Type === sEntityType) {
							return oAction[index];
						}
					}
				}
			} else if (oAction.$Action && oMetaModel.getObject("/" + oAction.$Action)) {
				return oMetaModel.getObject("/" + oAction.$Action)[0];
			}
		}

		function resolveActionName(sActionName) {
			// action imports are not directly obtained from the metaModel by it is present inside the entityContainer
			// and the acions it refers to present outside the entitycontainer, hence to obtain kind of the action
			// split() on its name was required
			var sName = sActionName.split("/")[1];
			return sName ? sName : sActionName;
		}

		function getActionParameters(oAction) {
			if (!oAction) {
				return Promise.reject("No Action was obtained");
			}
			var aParameters = oAction.$Parameter;
			if (aParameters && aParameters.length) {
				if (oAction.$IsBound) {
					//in case of bound actions, ignore the first parameter and consider the rest
					var params = aParameters.slice(1, aParameters.length) || [];
					return params;
				} else {
					return aParameters;
				}
			}
		}

		function getIsActionCritical(sActionName, oModel) {
			return oModel.getMetaModel().getObject("/" + sActionName + '@com.sap.vocabularies.Common.v1.IsActionCritical');
		}

		/**
		 * Static functions to call OData actions (bound/import) and functions (bound/import)
		 *
		 * @namespace
		 * @alias sap.fe.actions.operations
		 * @public
		 * @sap-restricted
		 * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
		 * @since 1.56.0
		 */
		var operations = {
			callBoundAction: callBoundAction,
			callActionImport: callActionImport
			//callBoundFunction : callBoundAction,
			//callFunctionImport : callFunctionImport
		};
		return operations;


	}
);
