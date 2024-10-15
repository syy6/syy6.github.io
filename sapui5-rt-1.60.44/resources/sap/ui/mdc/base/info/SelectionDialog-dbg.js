/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/core/XMLComposite', 'sap/ui/model/Filter', 'sap/ui/model/FilterOperator', 'sap/ui/base/ManagedObjectObserver', 'sap/base/Log', 'sap/ui/Device', 'sap/ui/model/json/JSONModel', 'sap/m/MessageBox'
], function(XMLComposite, Filter, FilterOperator, ManagedObjectObserver, Log, Device, JSONModel, MessageBox) {
	"use strict";

	/**
	 * Constructor for a new SelectionDialog.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The SelectionDialog control is used to show <code>items</code>.
	 * @extends sap.ui.mdc.XMLComposite
	 * @author SAP SE
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.60.0
	 * @alias sap.ui.mdc.base.info.SelectionDialog
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SelectionDialog = XMLComposite.extend("sap.ui.mdc.base.info.SelectionDialog", /** @lends sap.ui.mdc.base.info.SelectionDialog.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				showItemAsLink: {
					type: "boolean",
					defaultValue: true,
					invalidate: true
				},
				/**
				 * This property determines whether the 'Restore' button is shown inside the dialog. If this property is set to true, clicking the
				 * 'Reset' button will trigger the <code>reset</code> event sending a notification that model data must be reset.
				 */
				showReset: {
					type: "boolean",
					defaultValue: false,
					invalidate: true
				},

				/**
				 * This property determines whether the 'Restore' button is enabled and is taken into account only if <code>showReset</code> is set
				 * to <code>true</code>.
				 */
				showResetEnabled: {
					type: "boolean",
					defaultValue: false,
					invalidate: true
				}
			},
			defaultAggregation: "items",
			aggregations: {
				/**
				 * Defines personalization items.
				 */
				items: {
					type: "sap.ui.mdc.base.info.SelectionDialogItem",
					multiple: true,
					singularName: "item"
				}
			},
			events: {
				/**
				 * Event fired if an item in <code>SelectionDialog</code> is selected or deselected.
				 */
				change: {},
				/**
				 * Event fired if the 'ok' button in <code>SelectionDialog</code> is clicked.
				 */
				ok: {},
				/**
				 * Event fired if the 'cancel' button in <code>SelectionDialog</code> is clicked.
				 */
				cancel: {},
				/**
				 * Event fired if the 'reset' button in <code>SelectionDialog</code> is clicked.
				 */
				reset: {}
			}
		}
	});

	SelectionDialog.prototype.init = function() {
		// Set device model
		var oDeviceModel = new JSONModel(Device);
		oDeviceModel.setDefaultBindingMode("OneWay");
		this.setModel(oDeviceModel, "device");

		this._oObserver = new ManagedObjectObserver(_observeChanges.bind(this));
		this._oObserver.observe(this, {
			aggregations: [
				"items"
			]
		});
	};
	SelectionDialog.prototype.open = function() {
		this._updateCounts();
		this._getCompositeAggregation().open();
	};
	SelectionDialog.prototype.close = function() {
		this._getCompositeAggregation().close();
	};
	SelectionDialog.prototype.onSearchFieldLiveChange = function(oEvent) {
		var aFilters = [];

		var oSearchField = oEvent.getSource();
		var sSearchText = oSearchField ? oSearchField.getValue() : "";
		if (sSearchText) {
			aFilters.push(new Filter([
				new Filter("text", FilterOperator.Contains, sSearchText), new Filter("tooltip", FilterOperator.Contains, sSearchText), new Filter("description", FilterOperator.Contains, sSearchText)
			], false));
		}
		this._getTable().getBinding("items").filter(aFilters);
	};
	SelectionDialog.prototype.onPressOk = function() {
		this.fireOk();
	};
	SelectionDialog.prototype.onPressCancel = function() {
		this.fireCancel();
	};
	SelectionDialog.prototype.onPressReset = function() {
		this.fireReset();
	};
	SelectionDialog.prototype.onPressLink = function(oEvent) {
		var sHref = oEvent.getParameter("href");
		if (oEvent.getParameter("target") !== "_blank") {
			oEvent.preventDefault();
			MessageBox.show(sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc").getText("info.SELECTION_DIALOG_LINK_VALIDATION_QUESTION"), {
				icon: MessageBox.Icon.WARNING,
				title: sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc").getText("info.SELECTION_DIALOG_LINK_VALIDATION_TITLE"),
				actions: [
					MessageBox.Action.YES, MessageBox.Action.NO
				],
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.YES) {
						window.location.href = sHref;
					}
				},
				styleClass: this.$().closest(".sapUiSizeCompact").length ? "sapUiSizeCompact" : ""
			});
		}
	};
	SelectionDialog.prototype._getTable = function() {
		return sap.ui.getCore().byId(this.getId() + "--idList") || null;
	};
	SelectionDialog.prototype._updateCounts = function() {
		var iCountOfSelectedItems = 0;
		this.getItems().forEach(function(oItem) {
			if (oItem.getVisible()) {
				iCountOfSelectedItems++;
			}
		});
		this._getManagedObjectModel().setProperty("/@custom/countOfSelectedItems", iCountOfSelectedItems);
	};
	function _observeChanges(oChanges) {
		if (oChanges.object.isA("sap.ui.mdc.base.info.SelectionDialog")) {
			switch (oChanges.name) {
				case "items":
					var aItems = oChanges.child ? [
						oChanges.child
					] : oChanges.children;

					aItems.forEach(function(oItem) {
						switch (oChanges.mutation) {
							case "insert":
								this._oObserver.observe(oItem, {
									properties: [
										"visible"
									]
								});
								break;
							case "remove":
								this._oObserver.unobserve(oItem);
								break;
							default:
								Log.error("Mutation '" + oChanges.mutation + "' is not supported jet.");
						}
					}, this);

					break;
				default:
					Log.error("The property or aggregation '" + oChanges.name + "' has not been registered.");
			}
		} else if (oChanges.object.isA("sap.ui.mdc.base.info.SelectionDialogItem")) {
			if (oChanges.name === "visible") {
				this._updateCounts();
				this.fireChange();
			}
		}
	}

	return SelectionDialog;

}, /* bExport= */true);
