/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/core/Control', './library', './ActionToolbar', 'sap/m/OverflowToolbarButton', 'sap/m/Text', 'sap/m/Title', 'sap/ui/core/format/NumberFormat'
], function(Control, library, ActionToolbar, OverflowToolbarButton, Text, Title, NumberFormat) {
	"use strict";

	var InnerTable, InnerColumn, InnerRow, InnerRowAction, InnerRowActionItem;
	var SelectionMode = library.SelectionMode;
	var TableType = library.TableType;
	var RowAction = library.RowAction;

	/**
	 * Constructor for a new Table.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class A metadata driven table to simplify using existing tables like the <code>sap.m.Table</code> and <code>sap.ui.table</code> controls.
	 *        <h3>Overview</h3>
	 *        The <code>Table</code> control creates a RespsoniveTable or GridTable based on the configuration specified.
	 *        <h3>Structure</h3>
	 *        The <code>columns</code> aggregation must be specified with the desired columns, along with with the template for the cell. The cell
	 *        template may be used during binding (e.g. for ResponsiveTable).
	 *        <h3><b>Note:</b></h3>
	 *        The control is experimental and the API/behaviour is not finalised and hence this should not be used for productive usage.
	 * @extends sap.ui.core.Control
	 * @author SAP SE
	 * @constructor The API/behaviour is not finalised and hence this control should not be used for productive usage.
	 * @private
	 * @experimental
	 * @since 1.58
	 * @alias sap.ui.mdc.Table
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var Table = Control.extend("sap.ui.mdc.Table", {
		library: "sap.ui.mdc",
		metadata: {
			designtime: "sap/ui/mdc/designtime/Table.designtime",
			specialSettings: {
				metadataContexts: {
					defaultValue: "{path:'',  name: 'collection'}"
				}
			},
			defaultAggregation: "columns",
			properties: {
				/**
				 * The width
				 */
				width: {
					type: "sap.ui.core.CSSSize",
					group: "Dimension",
					defaultValue: null,
					invalidate: true
				},

				/**
				 * The height
				 */
				height: {
					type: "sap.ui.core.CSSSize",
					group: "Dimension",
					defaultValue: null,
					invalidate: true
				},
				/**
				 * Specifies the possible actions available on the table row.
				 *
				 * @since 1.60
				 */
				rowAction: {
					type: "sap.ui.mdc.RowAction[]"
				},
				/**
				 * Path to TableHelper/TableProvider module, that provides the necessary APIs to help create table content. Please ensure that that
				 * file can be required (any necessary library has to be loaded beforehand). DO not bind/modify the module. Once the necessary module
				 * is associated - this property may never be used again
				 *
				 * @experimental
				 */
				providerModulePath: {
					type: "string",
					defaultValue: "sap/ui/mdc/TableHelper"
				},
				/**
				 * Specifies header text that is shown in table
				 */
				header: {
					type: "string",
					group: "Misc",
					defaultValue: null
				},
				initiallyVisibleFields: {
					type: "string[]"
				},
				selectionMode: {
					type: "sap.ui.mdc.SelectionMode",
					defaultValue: SelectionMode.None
				},
				/**
				 * If set to <code>true</code> (default), the number of rows is shown along with the header text.<br>
				 * If set to <code>false</code>, the number of rows will not be shown on the user interface.<br>
				 * <i>Note:</i><br>
				 * To avoid sending dedicated OData requests in order to improve your application's performance, you must configure the binding of the
				 * table as required.<br>
				 * This should only be used if the backend/service can support count.
				 */
				showRowCount: {
					type: "boolean",
					group: "Misc",
					defaultValue: true
				},

				type: {
					type: "sap.ui.mdc.TableType",
					defaultValue: TableType.Table
				}

			},
			aggregations: {
				_content: {
					type: "sap.ui.core.Control",
					multiple: false,
					visibility: "hidden"
				},
				/**
				 * Columns of the MDC Table
				 */
				columns: {
					type: "sap.ui.mdc.Column",
					multiple: true
				},
				/**
				 * Dummy aggregation only to get the binding information and forward it to the inner table (type). Should only be used for specifying
				 * binding (without any template); APIs like getBinding, getBindingInfo, insertRow, addRow, removeRow are NOT supported
				 */
				rows: {
					type: "sap.ui.base.ManagedObject",
					multiple: true
				},
				/**
				 * Additional/External actions for the MDC Table control
				 */
				actions: {
					type: "sap.ui.core.Control",
					multiple: true,
					forwarding: {
						getter: "_createToolbar",
						aggregation: "actions"
					}
				}
			},
			events: {
				rowPress: {
					parameters: {
						bindingContext: {
							type: "sap.ui.model.Context"
						}
					}
				},
				selectionChange: {
					parameters: {
						bindingContext: {
							type: "sap.ui.model.Context"
						},
						selected: {
							type: "boolean"
						},
						selectAll: {
							type: "boolean"
						}
					}
				}
			}
		// provider: "sap/ui/mdc/Table.provider"
		},
		constructor: function() {
			Control.apply(this, arguments);
			this.bCreated = true;
			this._initializeContent(this.getType());
		},
		renderer: function(oRm, oControl) {
			oRm.write("<div ");
			oRm.writeControlData(oControl);
			oRm.addClass("sapUiMdcTable");
			oRm.writeClasses();

			// add inline styles
			if (oControl.getHeight()) {
				oRm.addStyle("height", oControl.getHeight());
			}
			if (oControl.getWidth()) {
				oRm.addStyle("width", oControl.getWidth());
			}
			oRm.writeStyles();

			oRm.write(">");
			oRm.renderControl(oControl.getAggregation("_content"));
			oRm.write("</div>");
		}
	});

	Table.prototype.init = function() {
		Control.prototype.init.apply(this, arguments);
		// this.attachEvent("modelContextChange", this._onModelContextChange, this); //TODO: may be needed in the future, e.g for runtime scenarios
		this._oTableReady = new Promise(this._resolveTable.bind(this));
	};

	Table.prototype.done = function() {
		return this._oTableReady;
	};

	Table.prototype._resolveTable = function(resolve, reject) {
		this._fResolve = resolve;
		this._fReject = reject;
	};

	Table.prototype.setType = function(sType) {
		var sOldType = this.getType();
		if (sType === sOldType && this._oTable) {
			return this;
		}
		this.setProperty("type", sType, true);

		if (this.bCreated) {
			if (this._oTable) {
				if (sOldType === "ResponsiveTable") {
					this._oTable.setHeaderToolbar();
				} else {
					this._oTable.removeExtension(this._oToolbar);
				}
				this._oTable.destroy("KeepDom");
				// recreate the promise when switching table
				this._oTableReady = new Promise(this._resolveTable.bind(this));
			}
			if (this._oTemplate) {
				this._oTemplate.destroy();
				this._oTemplate = null;
			}
			this._initializeContent(sType);
		}
		return this;
	};

	Table.prototype.setSelectionMode = function(sMode) {
		this.setProperty("selectionMode", sMode, true);
		if (this._oTable) {
			if (this._bMobileTable) {
				this._oTable.setMode(this._getSelectionMode());
			} else {
				this._oTable.setSelectionMode(this._getSelectionMode());
			}
		}
		return this;
	};

	Table.prototype.setRowAction = function(aActions) {
		var aOldActions = this.getRowAction();
		this.setProperty("rowAction", aActions, true);
		// As there is only 1 possible action right now simply check for length and the 1st/only item
		if (((aActions && aActions.length) != (aOldActions && aOldActions.length)) || aOldActions[0] != aActions[0]) {
			this._updateRowAction();
		}
		return this;
	};

	Table.prototype._updateRowAction = function() {
		var aActions = this.getRowAction();
		var oInnerRowAction;
		if (this._bMobileTable && this._oTemplate) {
			this._oTemplate.setType(this.hasListeners("rowPress") ? "Active" : "Inactive");
		} else if (this._oTable) {
			oInnerRowAction = this._oTable.getRowActionTemplate();
			if (oInnerRowAction) {
				oInnerRowAction.destroy();
			}
			this._oTable.setRowActionTemplate();
			this._oTable.setRowActionCount();
		}

		if (aActions && aActions.indexOf(RowAction.Navigation) > -1) {
			if (this._oTable) {
				if (this._bMobileTable) {
					this._oTemplate.setType(RowAction.Navigation);
				} else {
					this._oTable.setRowActionTemplate(new InnerRowAction({
						items: [
							new InnerRowActionItem({
								type: RowAction.Navigation,
								press: [
									this._onRowActionPress, this
								]
							})
						]
					}));
					this._oTable.setRowActionCount(1);
				}
			}
		}
	};

	Table.prototype._initializeContent = function(sType) {
		if (!this.bColumnsOrdered) {
			this.bColumnsOrdered = true;
			this._orderColumns();
		}
		var sProviderModule = this.getProviderModulePath();
		if (sType === "Table") {
			sap.ui.getCore().loadLibrary("sap.ui.table", true).then(function() {
				sap.ui.require([
					"sap/ui/table/Table", "sap/ui/table/Column", "sap/ui/table/RowAction", "sap/ui/table/RowActionItem", sProviderModule
				], function(GridTable, GridColumn, RowAction, RowActionItem, Provider) {
					this._bMobileTable = false;
					this.oProvider = Provider;
					InnerTable = GridTable;
					InnerColumn = GridColumn;
					InnerRowAction = RowAction;
					InnerRowActionItem = RowActionItem;
					this._createContent();
				}.bind(this));
			}.bind(this));
		} else if (sType === "ResponsiveTable") {
			// assume sap.m is always there
			// decide to move this to define instead of requiring here!
			sap.ui.require([
				"sap/m/Table", "sap/m/Column", "sap/m/ColumnListItem", sProviderModule
			], function(ResponsiveTable, ResponsiveColumn, ColumnListItem, Provider) {
				this._bMobileTable = true;
				this.oProvider = Provider;
				InnerTable = ResponsiveTable;
				InnerColumn = ResponsiveColumn;
				InnerRow = ColumnListItem;
				this._createContent();
			}.bind(this));
		}
	};

	Table.prototype._onAfterTableCreated = function(bResult) {
		if (bResult && this._fResolve) {
			this._fResolve(this);
		} else if (this._fReject) {
			this._fReject(this);
		}
		delete this._fResolve;
		delete this._fReject;
	};

	Table.prototype._createContent = function() {
		this._createToolbar();
		this._createTable();

		this._updateRowAction();

		var aMDCColumns = this.getColumns();

		aMDCColumns.forEach(this._createInnerTableColumn, this);

		this.setAggregation("_content", this._oTable);

		this._onAfterTableCreated(true);

		if (this._oBindingInfo) {
			this.bindRows(this._oBindingInfo);
		}
	};

	Table.prototype.setHeader = function(sText) {
		this.setProperty("header", sText, true);
		this._updateHeaderText();
		return this;
	};

	Table.prototype._createToolbar = function() {
		if (!this._oToolbar) {
			this._oTitle = new Title(this.getId() + "-title", {
				text: this.getHeader()
			});
			this._oToolbar = new ActionToolbar(this.getId() + "-toolbar", {
				design: "Transparent",
				left: [
					this._oTitle
				],
				right: [
					new OverflowToolbarButton(this.getId() + "-settings", {
						icon: "sap-icon://action-settings",
						text: "Settings (using Property Infos)",
						press: [
							this._showSettings, this
						],
						visible: false,
						tooltip: "Settings (TODO)"
					})
				]
			});

		}
		return this._oToolbar;
	};

	Table.prototype._createTable = function() {
		if (this._bMobileTable) {
			this._oTable = new InnerTable(this.getId() + "-innerTable", {
				growing: true,
				sticky: [
					"ColumnHeaders", "HeaderToolbar"
				],
				itemPress: [
					this._onItemPress, this
				],
				selectionChange: [
					this._onSelectionChange, this
				],
				mode: this._getSelectionMode(),
				headerToolbar: this._oToolbar
			});

			this._oTemplate = new InnerRow(this.getId() + "-innerTableRow");
			this._createColumn = Table.prototype._createMobileColumn;
			this._sAggregation = "items";
			// map bindItems to bindRows for Mobile Table to enable reuse of rebind mechanism
			this._oTable.bindRows = this._oTable.bindItems;
		} else {
			this._createColumn = Table.prototype._createColumn;
			this._oTable = new InnerTable(this.getId() + "-innerTable", {
				cellClick: [
					this._onCellClick, this
				],
				rowSelectionChange: [
					this._onRowSelectionChange, this
				],
				selectionMode: this._getSelectionMode(),
				visibleRowCountMode: "Auto",
				extension: [
					this._oToolbar
				]
			});
			this._sAggregation = "rows";
		}
	};

	/**
	 * Gets the selection mode based on the type of table used
	 *
	 * @returns {string} the resolved selection mode based on the table type
	 */
	Table.prototype._getSelectionMode = function() {
		var sSelectionMode = this.getSelectionMode();
		switch (sSelectionMode) {
			case "Single":
				sSelectionMode = this._bMobileTable ? "SingleSelectLeft" : "Single";
				break;
			case "Multi":
				sSelectionMode = this._bMobileTable ? "MultiSelect" : "MultiToggle";
				break;
			default:
				sSelectionMode = SelectionMode.None;
		}
		return sSelectionMode;
	};

	Table.prototype._createInnerTableColumn = function(oMDCColumn) {
		var oColumn = this._createColumn(oMDCColumn);
		this._oTable.addColumn(oColumn);
	};

	Table.prototype._orderColumns = function() {
		var iInitialIndex, aColumnInfos = [], aMDCColumns = this.getColumns();
		aMDCColumns.forEach(function(oColumn) {
			iInitialIndex = oColumn.getInitialIndex();
			if (iInitialIndex > -1) {
				aColumnInfos.push({
					index: iInitialIndex,
					column: this.removeColumn(oColumn)
				});
			}
		}, this);

		aColumnInfos.sort(function(oColInfo1, oColInfo2) {
			return oColInfo1 - oColInfo2;
		});

		aColumnInfos.forEach(function(oColumnInfo) {
			this.insertColumn(oColumnInfo.column, oColumnInfo.index);
		}, this);
	};

	/**
	 * Creates and returns a Column that can be added to the grid table, based on the provided MDCColumn
	 *
	 * @param {object} oMDCColumn - the mdc column instance using which the GridTable column will be created
	 * @param {int} iIndex - index where the column has to be inserted in the table (optional)
	 * @private
	 * @returns {object} the column that is created
	 */
	Table.prototype._createColumn = function(oMDCColumn, iIndex) {
		var oTemplate = oMDCColumn.getTemplate(true);
		if (!oTemplate && this.oProvider) {
			// TODO: use PropertyInfo from change - using custom data?
			oTemplate = this.oProvider.createColumnTemplate({
				name: oMDCColumn.getDataProperties()[0]
			});
			oMDCColumn.setTemplate(oTemplate);
		}
		// Grid Table content cannot be wrapped!
		if (oTemplate && oTemplate.setWrapping) {
			oTemplate.setWrapping(false);
		}

		return new InnerColumn(oMDCColumn.getId() + "-innerColumn", {
			width: oMDCColumn.getWidth(),
			hAlign: oMDCColumn.getHAlign(),
			label: oMDCColumn.getHeader(),
			showSortMenuEntry: false,
			showFilterMenuEntry: false,
			sortProperty: oMDCColumn.getDataProperties()[0],
			filterProperty: oMDCColumn.getDataProperties()[0],
			template: oTemplate
		});
	};

	/**
	 * Creates and returns a MobileColumn that can be added to the mobile table, based on the provided MDCColumn
	 *
	 * @param {object} oMDCColumn - the mdc column instance using which the ResponsiveTable column will be created
	 * @param {int} iIndex - index where the column has to be inserted in the table (optional)
	 * @private
	 * @returns {object} the column that is created
	 */
	Table.prototype._createMobileColumn = function(oMDCColumn, iIndex) {
		var oColumn, oCellTemplate;

		oColumn = new InnerColumn(oMDCColumn.getId() + "-innerColumn", {
			width: oMDCColumn.getWidth(),
			hAlign: oMDCColumn.getHAlign(),
			header: new Text(oMDCColumn.getId() + "-innerColumnHeader", {
				textAlign: oMDCColumn.getHAlign(),
				text: oMDCColumn.getHeader()
			})
		});

		oCellTemplate = oMDCColumn.getTemplate(true);
		if (!oCellTemplate && this.oProvider) {
			// TODO: use PropertyInfo from change - using custom data?
			oCellTemplate = this.oProvider.createColumnTemplate({
				name: oMDCColumn.getDataProperties()[0]
			});
			oMDCColumn.setTemplate(oCellTemplate);
		}
		if (iIndex >= 0) {
			this._oTemplate.insertCell(oCellTemplate, iIndex);
		} else {
			this._oTemplate.addCell(oCellTemplate);
		}

		return oColumn;
	};

	Table.prototype.removeColumn = function(oMDCColumn) {
		oMDCColumn = this.removeAggregation("columns", oMDCColumn, true);
		if (this._oTable) {
			var oColumn = this._oTable.removeColumn(oMDCColumn.getId() + "-innerColumn");
			if (this._oTemplate) {
				this._oTemplate.removeCell(oMDCColumn.getTemplate(true));
			}
			oColumn.destroy(); // TODO: avoid destroy
		}
		return oMDCColumn;
	};

	Table.prototype.addColumn = function(oMDCColumn) {
		this.addAggregation("columns", oMDCColumn, true);
		if (this._oTable) {
			var oColumn = this._createColumn(oMDCColumn);
			this._oTable.addColumn(oColumn);
		}
		return this;
	};

	Table.prototype.insertColumn = function(oMDCColumn, iIndex) {
		this.insertAggregation("columns", oMDCColumn, iIndex, true);
		if (this._oTable) {
			var oColumn = this._createColumn(oMDCColumn, iIndex);
			this._oTable.insertColumn(oColumn, iIndex);
		}
		return this;
	};

// ResponsiveTable
	Table.prototype._onItemPress = function(oEvent) {
		this.fireRowPress({
			bindingContext: oEvent.getParameter("listItem").getBindingContext()
		});
	};

	Table.prototype._onSelectionChange = function(oEvent) {
		this.fireSelectionChange({
			bindingContext: oEvent.getParameter("listItem").getBindingContext(),
			selected: oEvent.getParameter("selected"),
			selectAll: oEvent.getParameter("selectAll")
		});
	};

// GridTable
	Table.prototype._onCellClick = function(oEvent) {
		this.fireRowPress({
			bindingContext: oEvent.getParameter("rowBindingContext")
		});
	};

	Table.prototype._onRowActionPress = function(oEvent) {
		var oRow = oEvent.getParameter("row");
		this.fireRowPress({
			bindingContext: oRow.getBindingContext()
		});
	};

	Table.prototype._onRowSelectionChange = function(oEvent) {
		// Only fire the event for user interaction
		if (oEvent.getParameter("userInteraction")) {
			this.fireSelectionChange({
				bindingContext: oEvent.getParameter("rowContext"),
				selected: oEvent.getSource().isIndexSelected(oEvent.getParameter("rowIndex")),
				selectAll: oEvent.getParameter("selectAll")
			});
		}
	};

	// TODO: maybe selectedContexts should be an association
	// TODO: The API is unstable/unreliable in GridTable scenarios and has to be worked upon
	/**
	 * API to get user selected contexts from the table.
	 *
	 * @returns {Array} the contexts of rows/items selected by the user
	 * @private
	 * @experimental The API is unstable/unreliable in GridTable scenarios
	 */
	Table.prototype.getSelectedContexts = function() {
		var aContexts;

		if (this._bMobileTable) {
			aContexts = this._oTable.getSelectedContexts();
		} else {
			// TODO: we need a better API from GridTable that only returns available user "selected" contexts
			aContexts = this._oTable.getSelectedIndices().map(function(iIndex) {
				return this._oTable.getContextByIndex(iIndex);
			}, this);
		}

		return aContexts;
	};

	Table.prototype.bindAggregation = function(sName, oBindingInfo) {
		if (sName === "rows") {
			return this.bindRows(oBindingInfo);
		}
		return Control.prototype.bindAggregation.apply(this, arguments);
	};

	Table.prototype.bindRows = function(oBindingInfo) {
		// TODO Introduce entitySet as a property and try to set these based on metadataContext automatically!
		this._oBindingInfo = oBindingInfo;
		if (this._oTable) {
			if (this._bMobileTable && this._oTemplate) {
				oBindingInfo.template = this._oTemplate;
			} else {
				delete oBindingInfo.template;
			}
			if (!oBindingInfo.parameters) {
				oBindingInfo.parameters = {};
			}
			if (this.getShowRowCount()) {
				Table._addBindingListener(oBindingInfo, "dataReceived", this._onDataReceived.bind(this));
			}
			this._oTable.bindRows(oBindingInfo);
		}
		return this;
	};

	/**
	 * Event handler for binding dataReceived
	 *
	 * @param {object} oEvt - the event instance
	 * @private
	 */
	Table.prototype._onDataReceived = function(oEvt) {
		// AnalyticalBinding fires dataReceived too often/early
		if (oEvt && oEvt.getParameter && oEvt.getParameter("__simulateAsyncAnalyticalBinding")) {
			return;
		}

		this._updateHeaderText();
	};

	Table.prototype._updateHeaderText = function() {
		var sHeader, sRowCount;

		if (this._oTitle && this.getHeader()) {
			sHeader = this.getHeader();
			if (this.getShowRowCount()) {
				sRowCount = this._getRowCount();
				if (sRowCount) {
					sHeader += " (" + sRowCount + ")";
				}
			}

			this._oTitle.setText(sHeader);
		}
	};

	/**
	 * gets table's row count
	 *
	 * @param {Boolean} bConsiderTotal whether to consider total
	 * @private
	 * @returns {int} the row count
	 */
	Table.prototype._getRowCount = function() {
		var oRowBinding = this._getRowBinding(), iRowCount, sValue = "";

		if (oRowBinding) {
			iRowCount = oRowBinding.getLength();

			if (!this._oNumberFormatInstance) {
				this._oNumberFormatInstance = NumberFormat.getFloatInstance();
			}

			if (oRowBinding.isLengthFinal()) {
				sValue = this._oNumberFormatInstance.format(iRowCount);
			}
		}
		return sValue;
	};

	/**
	 * returns the row/items binding of the currently used internal table
	 *
	 * @private
	 * @returns {sap.ui.model.Binding} the row/items binding
	 */
	Table.prototype._getRowBinding = function() {
		if (this._oTable) {
			return this._oTable.getBinding(this._sAggregation);
		}
	};

	// TODO Util
	/**
	 * Static method for checking and wrapping binding event listeners
	 *
	 * @param {object} oBindingInfo - the bindingInfo (or binding parameter) instance
	 * @param {object} sEventName - the event name
	 * @param {object} fHandler - the handler to be called internally
	 * @private
	 */
	Table._addBindingListener = function(oBindingInfo, sEventName, fHandler) {
		if (!oBindingInfo.events) {
			oBindingInfo.events = {};
		}

		if (!oBindingInfo.events[sEventName]) {
			oBindingInfo.events[sEventName] = fHandler;
		} else {
			// Wrap the event handler of the other party to add our handler.
			var fOriginalHandler = oBindingInfo.events[sEventName];
			oBindingInfo.events[sEventName] = function() {
				fHandler.apply(this, arguments);
				fOriginalHandler.apply(this, arguments);
			};
		}
	};

	/**
	 * Just for test purpose --> has to be finalised
	 *
	 * @experimental
	 */
	Table.prototype._showSettings = function() {
		if (!this._settingsTriggered) {
			this._settingsTriggered = true;
			sap.ui.require([
				"sap/ui/mdc/TableSettings"
			], function(TableSettings) {
				TableSettings.showColumnsPanel(this).then(function(aChanges) {
					TableSettings.handleUserChanges(aChanges, this).then(this._afterSettingsDone.bind(this));
				}.bind(this));
			}.bind(this));
		}
	};

	Table.prototype.rebindTable = function() {
		// Rebind table rows to update data/cells properly
		if (this._oBindingInfo) {
			this.bindRows(this._oBindingInfo);
		}
	};

	Table.prototype._afterSettingsDone = function() {
		delete this._settingsTriggered;
		this.rebindTable();
	};

	Table.prototype.exit = function() {
		// Always destroy the template
		if (this._oTemplate) {
			this._oTemplate.destroy();
		}
		this._oTemplate = null;
		this._oTable = null;
		this._oToolbar = null;
		this._oTitle = null;
		this._oNumberFormatInstance = null;

		this._fReject = null;
		this._fResolve = null;
	};

	return Table;

}, /* bExport= */true);
