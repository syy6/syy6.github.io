/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

/**
 * Export progress dialog
 * @private
 */
sap.ui.define([ 'sap/m/Dialog', 'sap/m/Button', 'sap/m/ProgressIndicator', 'sap/m/Text', 'sap/m/MessageBox', 'sap/m/library', 'sap/ui/core/library' ],
		function(Dialog, Button, ProgressIndicator, Text, MessageBox, MLibrary, coreLibrary) {
	'use strict';

	var ValueState = coreLibrary.ValueState;

	var DialogType = MLibrary.DialogType;

	/* Async call to resource bundle */
	var oResourceBundlePromise = sap.ui.getCore().getLibraryResourceBundle("sap.ui.export", true);

	/**
	 * The method returns a new Promise that results in a new
	 * progress dialog.
	 *
	 * @returns {Promise} - Promise for progress dialog
	 */
	function createProgressDialog() {
		return new Promise(function(fnResolve, fnReject) {
			var dialog;

			oResourceBundlePromise.then(function(oResourceBundleResolve) {
				var cancelButton = new Button({
					text : oResourceBundleResolve.getText("CANCEL_BUTTON"),
					press : function() {
						if (dialog && dialog.oncancel) {
							dialog.oncancel();
						}
						dialog.finish();
					}
				});

				var progressIndicator = new ProgressIndicator({
					showValue : false,
					height : "0.75rem"
				});
				progressIndicator.addStyleClass("sapUiMediumMarginTop");

				var oMessage = new Text({text : oResourceBundleResolve.getText("PROGRESS_FETCHING_MSG")});
				dialog = new Dialog({
					title : oResourceBundleResolve.getText("PROGRESS_TITLE"),
					type : DialogType.Message,
					contentWidth : "500px",
					content : [
						oMessage,
						progressIndicator
					],
					endButton : cancelButton,
					ariaLabelledBy: [oMessage]
				});

				dialog.updateStatus = function(nValue) {
					progressIndicator.setPercentValue(nValue);
				};

				dialog.finish = function() {
					dialog.close();
					progressIndicator.setPercentValue(0);
				};

				fnResolve(dialog);
			});
		});
	}

	function showWarningDialog(mParams) {
		return new Promise(function(fnResolve, fnReject) {

			oResourceBundlePromise.then(function(oResourceBundleResolve) {
				var bContinue, oWarningDialog, oWarningText, sWarningText;

				bContinue = false;
				sWarningText = mParams.rows ?
					oResourceBundleResolve.getText("SIZE_WARNING_MSG", [mParams.rows, mParams.columns]) : oResourceBundleResolve.getText("NO_COUNT_WARNING_MSG");
				oWarningText = new Text({
					text: sWarningText
				});
				oWarningDialog = new Dialog({
					title: oResourceBundleResolve.getText('PROGRESS_TITLE'),
					type: DialogType.Message,
					state: ValueState.Warning,
					content: oWarningText,
					ariaLabelledBy: oWarningText,
					beginButton: new Button({
						text: oResourceBundleResolve.getText("CANCEL_BUTTON"),
						press: function () {
							oWarningDialog.close();
						}
					}),
					endButton: new Button({
						text: oResourceBundleResolve.getText("EXPORT_BUTTON"),
						press: function () {
							bContinue = true;
							oWarningDialog.close();
						}
					}),
					afterClose: function() {
						oWarningDialog.destroy();
						bContinue ? fnResolve() : fnReject();
					}
				});
				oWarningDialog.open();
			});

		});
	}

	function showErrorMessage(sMessage) {
		oResourceBundlePromise.then(function(oResourceBundleResolve) {
			var errorMessage = sMessage || oResourceBundleResolve.getText('PROGRESS_ERROR_DEFAULT');

			MessageBox.error(oResourceBundleResolve.getText("PROGRESS_ERROR_MSG") + "\n" + errorMessage, {
				title : oResourceBundleResolve.getText("PROGRESS_ERROR_TITLE")
			});
		});
	}

	return {
		getProgressDialog : createProgressDialog,
		showErrorMessage: showErrorMessage,
		showWarningDialog: showWarningDialog
	};

}, /* bExport= */true);
