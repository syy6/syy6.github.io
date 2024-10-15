/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

// Static functions for Fiori Message Handling
sap.ui.define([
		"sap/m/MessageToast",
		"sap/m/MessageItem",
		"sap/m/MessageView",
		"sap/m/Dialog",
		"sap/m/Button",
		"sap/ui/core/MessageType"],
	function (MessageToast, MessageItem, MessageView, Dialog, Button, MessageType) {
		'use strict';

		function fnFormatTechnicalDetails() {
			var sPreviousGroupName;
			// Insert technical detail if it exists
			function insertDetail(oProperty) {
				return oProperty.property ? '( ${' + oProperty.property + '} ? ("<p>' + oProperty.property.substr(Math.max(oProperty.property.lastIndexOf('/'), oProperty.property.lastIndexOf('.')) + 1) + ' : " + ' + '${' + oProperty.property + '} + "</p>") : "" )' : '';
			}
			// Insert groupname if it exists
			function insertGroupName(oProperty) {
				var sHTML = '';
				if (oProperty.groupName && oProperty.property && oProperty.groupName !== sPreviousGroupName) {
					sHTML += '( ${' + oProperty.property + '} ? "<br><h3>' + oProperty.groupName + '</h3>" : "" ) + ';
					sPreviousGroupName = oProperty.groupName;
				}
				return sHTML;
			}

			// List of technical details to be shown
			function getPaths() {
				var sTD = "technicalDetails"; // name of property in message model data for technical details
				return [
					{ 'groupName': '', 'property': sTD + "/status"},
					{ 'groupName': '', 'property': sTD + "/statusText"},
					{ 'groupName': 'Application', 'property': sTD + "/error/@SAP__common.Application/ComponentId"},
					{ 'groupName': 'Application', 'property': sTD + "/error/@SAP__common.Application/ServiceId"},
					{ 'groupName': 'Application', 'property': sTD + "/error/@SAP__common.Application/ServiceRepository"},
					{ 'groupName': 'Application', 'property': sTD + "/error/@SAP__common.Application/ServiceVersion"},
					{ 'groupName': 'ErrorResolution', 'property': sTD + "/error/@SAP__common.ErrorResolution/Analysis"},
					{ 'groupName': 'ErrorResolution', 'property': sTD + "/error/@SAP__common.ErrorResolution/Note"},
					{ 'groupName': 'ErrorResolution', 'property': sTD + "/error/@SAP__common.ErrorResolution/DetailedNote"},
					{ 'groupName': 'ErrorResolution', 'property': sTD + "/error/@SAP__common.ExceptionCategory"},
					{ 'groupName': 'ErrorResolution', 'property': sTD + "/error/@SAP__common.TimeStamp"},
					{ 'groupName': 'ErrorResolution', 'property': sTD + "/error/@SAP__common.TransactionId"},
					{ 'groupName': 'Messages', 'property': sTD + "/error/code"},
					{ 'groupName': 'Messages', 'property': sTD + "/error/message"}
				];
			}
			var sHTML = '(${technicalDetails} ? "<h2>Technical Details</h2>" : "") + ';
			getPaths().forEach(function (oProperty) {
				sHTML = sHTML + insertGroupName(oProperty) + '' + insertDetail(oProperty) + ' + ';
			});
			return sHTML;
		}
		function fnFormatDescription() {
			var sHTML =  '(${' + 'description} ? ("<h2>Description</h2>" + ${' + 'description}) : "")';
			return sHTML;
		}

		/**
		 * Shows all unbound (including technical) messages and removes those the ones which are transient
		 * @function
		 * @static
		 * @name sap.fe.actions.messageHandling.showUnboundMessages
		 * @memberof sap.fe.actions.messageHandling
		 * @returns {Promise} Promise resolves once toast disappears / user closes popup
		 * @private
		 * @sap-restricted
		 */
		function showUnboundMessages() {
			var oMessageManager = sap.ui.getCore().getMessageManager(),
				oMessageModel = oMessageManager.getMessageModel(),
				aUnboundMessages = oMessageModel.getObject('/').filter(
					function (el) {
						return el.target === '';
					}
				);
			if (aUnboundMessages.length === 0) {
				// Don't show the popup if there are no transient messages
				return Promise.resolve(true);
			} else if (aUnboundMessages.length === 1 && aUnboundMessages[0].getType() === MessageType.Success) {
				return new Promise(function (resolve, reject) {
					MessageToast.show(aUnboundMessages[0].message);
					oMessageManager.removeMessages(aUnboundMessages);
				});
			} else {
				return sap.ui.getCore().getLibraryResourceBundle("sap.fe", true).then(function (oResourceBundle) {
					var oMessageTemplate = new MessageItem({
						counter: '{counter}',
						title: '{message}',
						subtitle: '{additionalText}',
						longtextUrl: '{descriptionUrl}',
						type: '{type}',
						description: '{= ${' + 'description} || ${technicalDetails} ? ' + '"<html><body>" + ' + fnFormatDescription() + ' + ' + fnFormatTechnicalDetails() + '"</body></html>"' + ' : "" }',
						markupDescription: true
					});
					var oMessageView = new MessageView({
							showDetailsPageHeader: false,
							itemSelect: function () {
								oBackButton.setVisible(true);
							},
							items: {
								path: '/',
								filters: [new sap.ui.model.Filter('target', sap.ui.model.FilterOperator.EQ, '')],
								template: oMessageTemplate
							}
						}),
						oBackButton = new Button({
							icon: sap.ui.core.IconPool.getIconURI("nav-back"),
							visible: false,
							press: function () {
								oMessageView.navigateBack();
								this.setVisible(false);
							}
						});
					oMessageView.setModel(oMessageModel);
					var oDialog = new Dialog({
						resizable: true,
						content: oMessageView,
						state: 'Error',
						beginButton: new Button({
							press: function () {
								oDialog.close();
								oMessageManager.removeMessages(aUnboundMessages);
							},
							text: oResourceBundle.getText('SAPFE_CLOSE')
						}),
						customHeader: new sap.m.Bar({
							contentMiddle: [
								new sap.m.Text({text: oResourceBundle.getText('SAPFE_ERROR')})
							],
							contentLeft: [oBackButton]
						}),
						contentWidth: "37.5em",
						contentHeight: "21.5em",
						verticalScrolling: false,
						afterClose: function (oEvent) {
							oMessageTemplate.destroy();
							oBackButton.destroy();
							oMessageView.destroy();
							oDialog.destroy();
						}
					});
					oDialog.open();
				});
			}
		}
		/**
		 * Static functions for Fiori Message Handling
		 *
		 * @namespace
		 * @alias sap.fe.actions.messageHandling
		 * @public
		 * @sap-restricted
		 * @experimental This module is only for experimental use! <br/><b>This is only a POC and maybe deleted</b>
		 * @since 1.56.0
		 */
		var messageHandling = {
			showUnboundMessages: showUnboundMessages
		};
		return messageHandling;

	}
);
