/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'jquery.sap.script',
	'sap/ui/core/library',
	'sap/m/library',
	'sap/ui/model/json/JSONModel',
	'sap/m/Dialog',
	'sap/m/Text',
	'sap/m/Label',
	'sap/m/Input',
	'sap/m/CheckBox',
	'sap/m/Button',
	'sap/m/Select',
	'sap/m/VBox',
	'sap/ui/core/Item',
	'sap/base/util/uid',
	'sap/ui/core/syncStyleClass',
	'sap/base/Log'
], function(jQuery, coreLibrary, mLibrary, JSONModel, Dialog, Text, Label, Input, CheckBox, Button, Select, VBox, Item, uid, syncStyleClass, Log) {
	'use strict';

	// shortcut for sap.m.ButtonType
	var ButtonType = mLibrary.ButtonType;

	// shortcut for sap.ui.core.ValueState
	var ValueState = coreLibrary.ValueState;

	/* Async call to resource bundle */
	var oResourceBundlePromise = sap.ui.getCore().getLibraryResourceBundle('sap.ui.export', true);

	/* Returns the Export Settings used by the User Settings Dialog */
	function getExportSettings(oCustomConfig, oResourceBundle) {
		var oDefaultConfig = {
			fileName: 'Standard',
			fileType: [
				{key: 'xlsx'}
			],
			selectedFileType: 'xlsx',
			splitCells: false,
			includeFilterSettings: false,
			addDateTime: false
		};

		var oExportConfig = Object.assign({}, oDefaultConfig, oCustomConfig || {});

		for (var i = 0; i < oExportConfig.fileType.length; i++) {
			var sSelectedKey;
			if (!oExportConfig.fileType[i].text) {
				oExportConfig.fileType[i].text = oResourceBundle.getText(oExportConfig.fileType[i].key.toUpperCase() + '_FILETYPE');
			}
			if (oExportConfig.fileType[i].key === oExportConfig.selectedFileType) {
				sSelectedKey = oExportConfig.fileType[i].key;
			}
		}
		if (!sSelectedKey) {
			oExportConfig.selectedFileType = oExportConfig.fileType[0].key;
		}

		return oExportConfig;
	}

	/**
	 * Utilities related to export to enable reuse in integration scenarios (e.g. tables).
	 *
	 * @author SAP SE
	 * @version 1.60.42
	 *
	 * @since 1.59
	 * @name sap.ui.export.ExportUtils
	 * @namespace
	 * @private
	 * @sap-restricted sap.ui.comp.smarttable.SmartTable
	 */
	var Utils = {

		_INTERCEPTSERVICE: 'sap/ushell/cloudServices/interceptor/InterceptService',

		/**
		 * Uses the Launchpad Cloud Service to intercept a given URL.
		 *
		 * @name sap.ui.export.ExportUtils.interceptUrl
		 * @function
		 *
		 * @param {string} sUrl The URL to intercept
		 * @return {string} The intercepted URL
		 *
		 * @private
		 * @static
		 */
		interceptUrl: function(sUrl) {
			// Check if cloud InterceptService exists (for destination routing) - See JIRA: FIORITECHP1-8941
			// This is necessary for cloud instances e.g. SAP CP, due to some destination routing that is not known by UI5 model/client!
			var InterceptService = sap.ui.require(Utils._INTERCEPTSERVICE);
			if (InterceptService) {
				var oInterceptService = InterceptService.getInstance();
				if (oInterceptService && oInterceptService.interceptUrl) {
					sUrl = oInterceptService.interceptUrl(sUrl);
				}
			}
			return sUrl;
		},

		/**
		 * Creates the Export settings dialog that can be used for configuring the spreadsheet before exporting.
		 *
		 * @param oCustomConfig Configuration for the spreadsheet
		 * @param oOpener The opener of the dialog
		 * @returns {Promise} Promise, which resolves with handle for the dialog
		 * @private
		 * @static
		 */
		openExportSettingsDialog: function(oCustomConfig, oOpener) {
			return new Promise(function (fnResolveOpen, fnRejectOpen) {

				var fnResolveClose;
				var oClosePromise = new Promise(function (fnResolve, fnReject) {
					fnResolveClose = fnResolve;
				});

				var oHandle = {

					// Returned promise resolves with the adapted configuration or with null in case of cancel
					getUserInput: function () {
						return oClosePromise;
					},

					// Force cancel and closing of the dialog
					cancel: function () {
						if (oHandle._oExportSettingsDialog) {
							oHandle._oExportSettingsDialog.close();
						}
					}

				};

				oResourceBundlePromise.then(function (oResourceBundle) {

					var oExportConfigModel = new JSONModel();
					oExportConfigModel.setData(getExportSettings(oCustomConfig, oResourceBundle));

					var sDialogId = uid();

					oHandle._oExportSettingsDialog = new Dialog({
						id: sDialogId,
						title: oResourceBundle.getText('EXPORT_SETTINGS_TITLE'),
						horizontalScrolling: false,
						verticalScrolling: false,
						content: [
							//TBD: Maybe use a form here for ACC purposes
							new VBox({
								// changing the render type to Bare in order to render the colon by resuing the style classes from Form layout
								renderType: 'Bare',
								width: '100%',
								items: [
									//TBD: Hide controls (visible=false) when functionality is not yet implemented
									new Label({
										text: oResourceBundle.getText('FILE_NAME'),
										labelFor: sDialogId + '-fileName'
									}),
									new Input({
										id: sDialogId + '-fileName',
										value: '{/fileName}',
										liveChange: function (oEvent) {
											// user input validation for file name
											var oInput = oEvent.getSource();
											var sFileName = oEvent.getParameter('value');
											var oRegEx = /[\\/:|?"*<>]/;
											var oExportBtn = sap.ui.getCore().byId(sDialogId + '-export');
											var bValidate = oRegEx.test(sFileName);
											if (bValidate) {
												oInput.setValueState(ValueState.Error);
												oInput.setValueStateText(oResourceBundle.getText('FILENAME_ERROR'));
											} else if (sFileName.length > 100) {
												oInput.setValueState(ValueState.Warning);
												oInput.setValueStateText(oResourceBundle.getText('FILENAME_WARNING'));
											} else {
												oInput.setValueState(ValueState.None);
												oInput.setValueStateText(null);
											}
											oExportBtn.setEnabled(!bValidate);
										}
									}).addStyleClass('sapUiTinyMarginBottom'),
									new Label({
										text: oResourceBundle.getText('SELECT_FORMAT'),
										labelFor: sDialogId + '-fileType'
									}),
									// sap.m.Select control disabled as there is only 1 option for now
									// control must be enabled when more file types are supported
									new Select({
										id: sDialogId + '-fileType',
										width: '100%',
										selectedKey: '{/selectedFileType}',
										enabled: false,
										items: {
											path: '/fileType',
											template: new Item({key: '{key}', text: '{text}'})
										}
									}),
									new CheckBox({
										id: sDialogId + '-splitCells',
										selected: '{/splitCells}',
										text: oResourceBundle.getText('SPLIT_CELLS')
									}),
									new CheckBox({
										id: sDialogId + '-includeFilterSettings',
										selected: '{/includeFilterSettings}',
										text: oResourceBundle.getText('INCLUDE_FILTER_SETTINGS')
									}),
									new CheckBox({
										id: sDialogId + '-addDateTime',
										selected: '{/addDateTime}',
										text: oResourceBundle.getText('ADD_DATE_TIME'),
										visible: false
									})
								]
							// using the style class from Form layout to render colon after the label
							}).addStyleClass('sapUiExportSettingsLabel')
						],
						endButton: new Button({
							id: sDialogId + '-cancel',
							text: oResourceBundle.getText('CANCEL_BUTTON'),
							press: function () {
								oHandle.cancel();
							}
						}),
						beginButton: new Button({
							id: sDialogId + '-export',
							text: oResourceBundle.getText('EXPORT_BUTTON'),
							type: ButtonType.Emphasized,
							press: function () {
								if (oHandle._oExportSettingsDialog) {
									oHandle._oExportSettingsDialog._bSuccess = true;
									fnResolveClose(oExportConfigModel.getData());
									oHandle._oExportSettingsDialog.close();
								}
							}
						}),
						afterClose: function () {
							if (!oHandle._oExportSettingsDialog._bSuccess) {
								// Handle Cancel after close when export button was not pressed
								// because a close could also be triggered via Esc
								fnResolveClose(null);
							}
							oHandle._oExportSettingsDialog.destroy();
							oHandle._oExportSettingsDialog = null;
						}
					});
					// using the style class from Form layout to render colon after the label
					oHandle._oExportSettingsDialog.addStyleClass('sapUiContentPadding sapUiExportSettings');
					oHandle._oExportSettingsDialog.setModel(oExportConfigModel);
					if (oOpener) {
						syncStyleClass('sapUiSizeCompact', oOpener, oHandle._oExportSettingsDialog);
					}
					oHandle._oExportSettingsDialog.open();

					fnResolveOpen(oHandle);

				});
			});
		},

		/**
		 * Combines the filter operator with the value and
		 * creates a textual representation.
		 *
		 * @param oFilter {Object} A single filter object according to ListBinding#getFilterInfo
		 * @returns {string} Textual representation of the filter operation and value
		 * @private
		 */
		_getReadableFilterValue: function(oFilter) {
			switch (oFilter.op || oFilter.name) {
				case '==':
					return '=' + oFilter.right.value;
				case '>':
				case '<':
				case '!=':
				case '<=':
				case '>=':
					return oFilter.op + oFilter.right.value;
				case 'between':
					return oFilter.args[1].value + '...' + oFilter.args[2].value;
				case 'contains':
					return '*' + oFilter.args[1].value + '*';
				case 'endswith':
					return '*' + oFilter.args[1].value;
				case 'startswith':
					return oFilter.args[1].value + '*';
				default:
					throw Error('getReadableFilter');
			}
		},

		/**
		 * Parse filter tree recursively.
		 *
		 * @param oFilter {Object} Filter configuration according to ListBinding#getFilterInfo
		 * @returns {Array} Array of filter entries
		 * @private
		 */
		_parseFilter: function(oFilter) {
			switch (oFilter.type) {
				case 'Logical':
					return Utils._parseLogical(oFilter);
				case 'Binary':
					return Utils._parseBinary(oFilter);
				case 'Unary':
					return Utils._parseUnary(oFilter);
				case 'Call':
					return Utils._parseCall(oFilter);
				default:
					throw Error('Filter type ' + oFilter.type + ' not supported');
			}
		},

		/**
		 * Parses a logical filter and concatenates all
		 * subsequent filters.
		 *
		 * @param oLogicalFilter {Object} Filter object according to ListBinding#getFilterInfo
		 * @returns {Array} Array containing all filter settings
		 * @private
		 */
		_parseLogical: function(oLogicalFilter) {

			/* Breakout behavior for between filter */
			if (oLogicalFilter.op == '&&'
				&& oLogicalFilter.left.type === 'Binary'
				&& oLogicalFilter.right.type === 'Binary'
				&& oLogicalFilter.left.op === '>='
				&& oLogicalFilter.right.op === '<='
				&& oLogicalFilter.left.left.path === oLogicalFilter.right.left.path) {

				return Utils._parseCall({
					args: [
						{
							path: oLogicalFilter.left.left.path,
							type: 'Reference'
						},
						{
							type: 'Literal',
							value: oLogicalFilter.left.right.value
						},
						{
							type: 'Literal',
							value: oLogicalFilter.right.right.value
						}
					],
					name: 'between',
					type: 'Call'
				});
			}

			return Utils._parseFilter(oLogicalFilter.left).concat(Utils._parseFilter(oLogicalFilter.right));
		},

		/**
		 * Parses a binary filter and returns an Array that
		 * contains this explicit filter item.
		 *
		 * @param oBinaryFilter {Object} Filter object according to ListBinding#getFilterInfo
		 * @returns {Array} Array containing this explicit filter setting
		 * @private
		 */
		_parseBinary: function(oBinaryFilter) {
			if (!oBinaryFilter.left || oBinaryFilter.left.type != 'Reference'
				|| !oBinaryFilter.right || oBinaryFilter.right.type != 'Literal') {
				return [];
			}

			return [{
				key: oBinaryFilter.left.path,
				value: Utils._getReadableFilterValue(oBinaryFilter)
			}];
		},

		/**
		 * Parses an unary filter and returns a modified
		 * subsequent filter.
		 *
		 * @param oUnaryFilter {Object} Filter object according to ListBinding#getFilterInfo
		 * @returns {Array} Array containing the modified subsequent filter
		 * @private
		 */
		_parseUnary: function(oUnaryFilter) {
			var result;

			if (!oUnaryFilter.arg) {
				return [];
			}

			result = Utils._parseFilter(oUnaryFilter.arg);
			result[0].value = '!' + result[0].value;

			return result;
		},

		/**
		 * Parses an call filter and returns an Array containing
		 * this particular filter configuration.
		 *
		 * @param oCallFilter {Object} Filter object according to ListBinding#getFilterInfo
		 * @returns {Array} Array containing this explicit filter setting
		 * @private
		 */
		_parseCall: function(oCallFilter) {
			if (!oCallFilter.args || oCallFilter.args.length < 2) {
				return [];
			}

			return [{
				key: oCallFilter.args[0].path,
				value: Utils._getReadableFilterValue(oCallFilter)
			}];
		},

		/**
		* Accepts a binding of type sap.ui.model.ListBinding or
		* sap.ui.model.TreeBinding and extracts the filter
		* configuration in a format that can be attached to
		* a sap.ui.export.Spreadsheet instance.
		*
		* @param oBinding {sap.ui.model.ListBinding | sap.ui.model.TreeBinding} ListBinding or TreeBinding instance
		* @returns {Promise} Promise, which resolves with an object containing a name property and items array with key value pairs which can be attached to the metainfo in the sap.ui.export.Spreadsheet configuration
		*/
		parseFilterConfiguration: function(oBinding) {
			return new Promise(function(fnResolve, fnReject) {
				oResourceBundlePromise.then(function(oResourceBundle) {
					var oFilterConfig = {
						name: oResourceBundle.getText('FILTER_HEADER'),
						items: []
					};

					if (!oBinding || !(oBinding.isA('sap.ui.model.ListBinding') || oBinding.isA('sap.ui.model.TreeBinding'))) {
						Log.error('A ListBinding is required for parsing the filter settings');
						return null;
					}

					var oFilterInfo = oBinding.getFilterInfo();
					if (oFilterInfo) {
						oFilterConfig.items = Utils._parseFilter(oFilterInfo);
					}

					fnResolve(oFilterConfig);
				});
			});
		},

		/**
		 * This function saves the provided Blob to the local file system.
		 * The parameter name is optional and depending on the browser it
		 * is not ensured that the filename can be applied. Google Chrome,
		 * Mozilla Firefox, Internet Explorer and Microsoft Edge will
		 * apply the filename correctly.
		 *
		 * @param {Blob} oBlob - Binary large object of the file that should be saved to the filesystem
		 * @param {string} [sFilename] - Filename of the file including the file extension
		 */
		saveAsFile: function(oBlob, sFilename) {
			var link, downloadSupported, fnSave;

			/* Ignore other formats than Blob */
			if (!(oBlob instanceof Blob)) {
				return;
			}

			link = document.createElementNS('http://www.w3.org/1999/xhtml', 'a');
			downloadSupported = 'download' in link;

			/* Try ObjectURL Chrome, Firefox, Opera, Android, Safari (Desktop ab 10.1) */
			if (downloadSupported) {
				fnSave = function(data, fileName) {
					link.download = fileName;
					link.href = URL.createObjectURL(data);
					link.dispatchEvent(new MouseEvent('click'));
				};
			}

			/* In case of iOS Safari, MacOS Safari */
			if (typeof fnSave === 'undefined') {
				fnSave = function(data) {
					var reader = new FileReader();

					reader.onloadend = function() {
						var opened, url;

						url = reader.result.replace(/^data:[^;]*;/, 'data:attachment/file;');
						opened = jQuery.sap.openWindow(url, '_blank');

						if (!opened) {
							window.location.href = url;
						}
					};
					reader.readAsDataURL(data);
				};
			}

			/*
			 * IE/Edge implementation
			 *
			 * Microsoft Edge also supports the download attribute but ignores the value of the attribute.
			 * This is why we override it with the navigator.msSaveOrOpenBlob function in case of MS Edge.
			 */
			if (typeof navigator !== 'undefined' && navigator.msSaveOrOpenBlob) {
				fnSave = function(data, fileName) {
					window.navigator.msSaveOrOpenBlob(data, fileName);
				};
			}

			/* Save file to device */
			fnSave(oBlob, sFilename);
		}
	};

	return Utils;

}, /* bExport= */ true);
