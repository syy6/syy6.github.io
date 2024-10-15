/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	"./ResourceModel",
	"sap/ui/mdc/base/ConditionModel",
	"sap/ui/mdc/base/ValueHelpPanel",
	"sap/ui/mdc/base/DefineConditionPanel",
	"sap/ui/mdc/base/FilterOperatorConfig",
	"sap/ui/mdc/odata/v4/CommonHelper",
	"sap/ui/model/json/JSONModel",
	"sap/ui/mdc/experimental/NamedBindingModel",
	"sap/m/Dialog",
	"sap/m/Bar",
	"sap/m/Label",
	"sap/m/Button"
], function(ResourceModel, ConditionModel, ValueHelpPanel, DefineConditionPanel, FilterOperatorConfig, CommonHelper, JSONModel, NamedBindingModel, Dialog, Bar, Label, Button) {
	"use strict";
	// THIS class should anyway be deleted as it uses several internal/private APIs!
	var ValueHelpDialog = Dialog.extend("sap.ui.mdc.ValueHelpDialog", {
		metadata: {
			properties: {
				entitySet: "string",
				fieldPath: "string", // TODO: we might rename this to propertyPath?
				conditionModelName: "string", // TODO: as an alternative we can also provide a method to set the model
				showConditionTab: {
					type: "boolean",
					defaultValue: true
				}
			},
			aggregations: {},
			events: {},
			publicMethods: []
		},
		renderer: {}
	});

	ValueHelpDialog.prototype.init = function() {

		Dialog.prototype.init.apply(this, arguments);

		var that = this;

		// Initializing dialog properites
		var oTitle = new Label();
		var oCustomHeader = new Bar({
			contentMiddle: oTitle,
			contentRight: new Button({
				text: '{$i18n>valuehelp.RESET}',
				press: this.onReset.bind(this)
			})
		});
		this.setCustomHeader(oCustomHeader);
		this.setDraggable(true);
		this.setResizable(true);
		this.setContentWidth('1024px');
		this.setContentHeight('600px');
		this.setVerticalScrolling(false);
		this.setHorizontalScrolling(false);
		this.setEndButton(new Button({
			text: '{$i18n>valuehelp.CANCEL}',
			press: this.onCancel.bind(this)
		}));

		this.addStyleClass("sapUiNoContentPadding");

		// Creating Value Help Panel and its content
		this.oValueHelpPanel = new ValueHelpPanel({
			id: this.getId() + "::valueHelpPanel",
			height: "100%"
		});
		this.oValueHelpPanel.attachOnBasicSearchChange(that.handleOnBasicSearch.bind(that));
		// this.oValueHelpPanel.attachShowSelected(that.handleShowSelected.bind(that));

		this.addContent(that.oValueHelpPanel);
		this.attachAfterClose(function(oEvent) {

			// UnRegistering Named Binding and Destroying Select From List ConditionModel & ValueHelpDialog
			Object.keys(this.mSearchTemplates).forEach(function(sSearchTemplate) {
				var mSearchTemplate = this.mSearchTemplates[sSearchTemplate];
				if (mSearchTemplate.$filterBar && mSearchTemplate.$listContainer) {
					var sConditionModelName = mSearchTemplate.$filterBar.getConditionModelName();
					var oConditionModel = mSearchTemplate.$filterBar.getModel(sConditionModelName) || this.oConditionModelClone;
					var oListBinding = mSearchTemplate.$listContainer._getRowBinding();
					ConditionModel.destroyCM(oConditionModel);
					oListBinding.getModel().unregisterNamedBinding(oListBinding);
					mSearchTemplate.$listContainer.destroy();
					mSearchTemplate.$filterBar.destroy();
				}
			}.bind(this));
			this.destroy();
		}.bind(this));

		var fnCreateValueHelpContent = function() {
			// TODO: works only with unnamed model
			var oModel = this.getModel();
			var sEntitySet, sFieldPath;

			if (oModel) {
				that.detachModelContextChange(fnCreateValueHelpContent);

				sEntitySet = that.getEntitySet();
				sFieldPath = that.getFieldPath();

				var oConditionModel = that.getModel(that.getConditionModelName());
				that.oConditionModelClone = oConditionModel.clone(sFieldPath);
				var oBinding = that.oConditionModelClone.bindProperty("/", that.oConditionModelClone.getContext("/"));
				oBinding.attachChange(function(event) {
					that.updateTableSelections();
				});
				that.oValueHelpPanel.initModel(that.oConditionModelClone);

				oModel.getMetaModel().requestValueListInfo('/' + sEntitySet + '/' + sFieldPath.replace(/\*/g, '')).then(function(mValueListInfo) {
					// Extend with key and description path
					CommonHelper._extendValueListMetadata(oModel.getMetaModel(), sEntitySet, sFieldPath.replace(/\*/g, ''), mValueListInfo);

					// SEARCH TEMPLATES
					that.mSearchTemplates = mValueListInfo;
					var aVariants = [], aSearchTemplateTitles = Object.keys(that.mSearchTemplates);

					if (aSearchTemplateTitles.length > 1) {
						aSearchTemplateTitles.forEach(function(sTitle) {
							aVariants.push({
								key: aSearchTemplateTitles.indexOf(sTitle).toString(),
								title: sTitle,
								visible: true
							});
						});
						that.oValueHelpPanel.setSearchTemplateModelData({
							currentVariant: "0",
							defaultVariant: "0",
							variantsEditable: false,
							variants: aVariants
						});
					}

					var fnSearchTemplateChange = function(oEvent) {
						that.switchSearchTemplate(Object.keys(that.mSearchTemplates)[oEvent.getParameter("key")]);
					};
					that.oValueHelpPanel.attachSearchTemplateChange(fnSearchTemplateChange);

					// take the "" one if exists, otherwise take the first one in the object TODO: to be discussed
					var sDefaultSearchTemplate = that.mSearchTemplates[""] ? "" : aSearchTemplateTitles[0];
					that.switchSearchTemplate(sDefaultSearchTemplate);

					// SINGLE SELECT
					if (that.getShowConditionTab() && that.mSearchTemplates[sDefaultSearchTemplate].$mdc.sSelectionMode !== "Single") {
						var oDefineConditionPanel = new DefineConditionPanel({
							id: that.getId() + "::defineConditionPanel",
							height: "100%"
						});
						that.oValueHelpPanel.setDefineConditions(oDefineConditionPanel);
					}
					if (that.mSearchTemplates[sDefaultSearchTemplate].$mdc.sSelectionMode === "Single") {
						that.oValueHelpPanel.setShowTokenizer(false);
					} else {
						that.setBeginButton(new Button({
							text: '{$i18n>valuehelp.OK}',
							press: that.onOk.bind(that)
						}));
					}

				}, function(oError) {
					throw (oError.message);
				});

				// FIXME: setting an title at a later point of time does not have any effect, also binding might not work
				oTitle.setText(that.getTitle());

			}
		};

		this.attachModelContextChange(fnCreateValueHelpContent);

	};

	/*
	 * Merge VHD conditon model with main condition model on click of OK
	 */
	ValueHelpDialog.prototype.onOk = function() {
		var sLocalFieldPath = this.getFieldPath();
		var oConditionModel = this.getModel(this.getConditionModelName());
		oConditionModel.merge(sLocalFieldPath, this.oConditionModelClone);
		this.close();
	};

	/*
	 * Close the the VHD dialog
	 */
	ValueHelpDialog.prototype.onCancel = function() {
		this.close();
	};

	/*
	 * Event triggered on search
	 */
	ValueHelpDialog.prototype.handleOnBasicSearch = function(oEvent) {
		var oTable = this.mSearchTemplates[this.sActiveSearchTemplate].$listContainer._oTable;
		var sSearchQuery = oEvent.getParameter("value") || oEvent.getParameter("newValue");
		var aFilterProperties = this.mSearchTemplates[this.sActiveSearchTemplate].$mdc._aFilterProperties;

		sSearchQuery = (typeof sSearchQuery === "string") ? sSearchQuery.trim() : undefined;
		if (!aFilterProperties) {
			// if no filterable properties are stored for filtering, then it is searchable
			oTable.getBinding("items").changeParameters({
				$search: sSearchQuery || undefined
			});
		} else if (sSearchQuery) {
			// if valueList entitySet is not-searchable
			var sFilterString = "";
			aFilterProperties.forEach(function(oProperty) {
				if (oProperty.operators[0] === "contains") {
					sFilterString = sFilterString + (sFilterString ? " or " : "") + "contains" + '(' + oProperty.path + ",\'" + sSearchQuery + "\')";
				} else {
					var sPropertyFilter = "";
					oProperty.operators.forEach(function(sOperator) {
						if (sOperator === "eq") {
							sPropertyFilter = sPropertyFilter + (sPropertyFilter ? " or " : "") + "(" + oProperty.path + " eq \'" + sSearchQuery + "\')";
						} else {
							sPropertyFilter = sPropertyFilter + (sPropertyFilter ? " or " : "") + sOperator + '(' + oProperty.path + ",\'" + sSearchQuery + "\')";
						}
					});
					sFilterString = sFilterString + (sFilterString ? " or " : "") + sPropertyFilter;
				}
			});
			oTable.getBinding("items").changeParameters({
				$filter: ("(" + sFilterString + ")")
			});
		} else {
			oTable.getBinding("items").changeParameters({
				$filter: undefined
			});
		}
	};

	/*
	 * Creating the VHD view and applying corresponding search template related valuelist info
	 */
	ValueHelpDialog.prototype.switchSearchTemplate = function(sSearchTemplate) {
		if (this.mSearchTemplates[sSearchTemplate].$listContainer && this.mSearchTemplates[sSearchTemplate].$filterBar) {
			this.updateContent(this.mSearchTemplates[sSearchTemplate].$filterBar, this.mSearchTemplates[sSearchTemplate].$listContainer);
			this.sActiveSearchTemplate = sSearchTemplate;
			this.updateTableSelections();
			return;
		}

		var that = this;
		var mValueListInfo = this.mSearchTemplates[sSearchTemplate];
		var oValueListModel = new JSONModel(mValueListInfo);
		var oMetaModel = mValueListInfo.$model.getMetaModel();

		// As long as we can't create our XML composite controls outside a XML view we use this workaround
		var oContent = sap.ui.view({
			id: that.getId() + "::" + mValueListInfo.CollectionPath,
			viewName: "sap.ui.mdc.ValueHelpTemplate",
			type: "XML",
			async: true,
			preprocessors: {
				xml: {
					bindingContexts: {
						entitySet: oMetaModel.createBindingContext("/" + mValueListInfo.CollectionPath),
						valueList: oValueListModel.createBindingContext("/")
					},
					models: {
						valueList: oValueListModel,
						entitySet: oMetaModel
					}
				}
			}
		});

		oContent.loaded().then(function(oContent) {
			var oTable = that.mSearchTemplates[sSearchTemplate].$listContainer = oContent.byId("template::valueListTable");
			var oFilterBar = that.mSearchTemplates[sSearchTemplate].$filterBar = oContent.byId("template::valueListFilterBar");

			// as long as we don't have a conditionModelTable we need to handle this here
			// More HACKS
			oTable.attachSelectionChange(that.handleSelectionChange.bind(that));

			oTable.bindRows({
				path: "/" + mValueListInfo.CollectionPath,
				parameters: {
					id: mValueListInfo.$mdc.qualifier
				},
				events: {
					change: that.updateTableSelections.bind(that)
				}
			});

			// if the valuelist entityset is not searchable
			if (!mValueListInfo.$mdc.bSearchable) {
				that.mSearchTemplates[sSearchTemplate].$mdc._aFilterProperties = that._getFilterableProperties(mValueListInfo);
			}

			(mValueListInfo.$model.registerNamedBinding ? Promise.resolve() : NamedBindingModel.upgrade(mValueListInfo.$model)).then(function() {
				oTable.setModel(mValueListInfo.$model);
				oFilterBar.setModel(mValueListInfo.$model);
				that.updateContent(oFilterBar, oTable);
				// the view is no longer required
				oContent.destroy();
			});

			that.sActiveSearchTemplate = sSearchTemplate;
		});
	};

	/*
	 * Setting the Filterbar and Table in the "Select From List" Bar
	 */
	ValueHelpDialog.prototype.updateContent = function(oFilterBar, oTable) {
		var oScrollContainer;
		this.oValueHelpPanel.setFilterbar(oFilterBar);
		if (this.oValueHelpPanel.getTable() instanceof sap.m.ScrollContainer) {
			oScrollContainer = this.oValueHelpPanel.getTable();
			oScrollContainer.removeAllContent();
			oScrollContainer.insertContent(oTable, 0);
		} else {
			oScrollContainer = new sap.m.ScrollContainer({
				height: "100%",
				horizontal: false,
				vertical: true
			});
			oScrollContainer.addContent(oTable);
		}
		this.oValueHelpPanel.setTable(oScrollContainer);
	};

	/*
	 * Creating and removing conditions based on selection change
	 */
	ValueHelpDialog.prototype.handleSelectionChange = function(oEvent) {
		// THIS too is incorrect and should be deleted!
		var that = this;
		var oConditionModel = that.oConditionModelClone;
		var mValueList = that.mSearchTemplates[that.sActiveSearchTemplate];
		var oItem, sKey, sDescription, oBindingContext;

		oBindingContext = oEvent.getParameter("bindingContext");
		oItem = oBindingContext.getObject();
		// Getting key-field from the list item, TODO: Implementation for multiple key-field scenario
		sKey = oItem[mValueList.$mdc.keyPath];
		sDescription = oItem[mValueList.$mdc.descriptionPath];

		// OutParameters for conditions.
		var oOutParameters = {};
		Object.keys(mValueList.$mdc.oLocalDataToValueListMap).forEach(function(sLocalDataProperty) {
			var sValueListProperty = mValueList.$mdc.oLocalDataToValueListMap[sLocalDataProperty];
			oOutParameters[sLocalDataProperty] = oItem[sValueListProperty];
		});

		// Insert condition to condition model
		var oCondition = oConditionModel.createItemCondition(that.getFieldPath(), sKey, sDescription);
		// Storing OutParameters
		oCondition.outParameters = oOutParameters;
		var sSelectionMode = that.mSearchTemplates[that.sActiveSearchTemplate].$mdc.sSelectionMode;
		var index = oConditionModel.indexOf(that.getFieldPath(), oCondition);
		if (index === -1) {
			if (sSelectionMode === "Single") {
				oConditionModel.removeAllConditions();
				oConditionModel.addCondition(oCondition);
				that.onOk();
			} else {
				oConditionModel.addCondition(oCondition);
			}
		} else {
			oConditionModel.removeCondition(that.getFieldPath(), index);
		}
	};

	/*
	 * Updating table selections when there is a change in condition model or list binding
	 */
	ValueHelpDialog.prototype.updateTableSelections = function(oEvent) {
		// THIS whole code is a hack and should be deleted!
		var that = this;
		var oTable;

		if (!that.mSearchTemplates || !that.mSearchTemplates[that.sActiveSearchTemplate]) {
			// this happens if there are tokens created without the value help
			return;
		}

		oTable = that.mSearchTemplates[that.sActiveSearchTemplate].$listContainer._oTable; // TO BE DELETED with this class!
		if (!oTable) {
			return;
		}
		// remove selections with "true" to remove all the invisible selections as well
		oTable.removeSelections(true);
		var aListItems = oTable.getItems();
		// We get the conditions and key path, loop over conditions and compare key to table's current items to mark selections
		var aConditions;
		var mValueList = that.mSearchTemplates[that.sActiveSearchTemplate];

		aConditions = that.oConditionModelClone.getConditions();

		aConditions.forEach(function(oCondition) {
			// Get condtions of the Value Help Table
			if (oCondition.operator === "EEQ") {
				aListItems.forEach(function(oListItem) {
					var oItem = oListItem.getBindingContext().getObject();
					var oOutParameters = oCondition.outParameters;
					// Comparing the value list property values of the condition and the list item
					if ((Object.keys(oOutParameters).filter(function(sKey) {
						var sValueListProperty = mValueList.$mdc.oLocalDataToValueListMap[sKey];
						return oOutParameters[sKey] === oItem[sValueListProperty];
					}).length) === Object.keys(oOutParameters).length) {
						// Setting list item selection
						oTable.setSelectedItem(oListItem, true);
					}
				});
			}
		});
	};

	/*
	 * Resetting the Dialog
	 */
	ValueHelpDialog.prototype.onReset = function() {
		var oFilterBar;

		// remove all conditions on the filter Bars
		for ( var p in this.mSearchTemplates) {
			oFilterBar = this.mSearchTemplates[p].$filterBar;
			if (oFilterBar) {
				oFilterBar.getModel(oFilterBar.getConditionModelName()).removeAllConditions();
			}
		}
		// Clearing Conditions in main Value Help condition model
		this.oConditionModelClone.removeAllConditions();
		this.oValueHelpPanel.clearSearch();

	};

	/*
	 * Get filterable properties in case of non-searchable entitySet
	 */
	ValueHelpDialog.prototype._getFilterableProperties = function(mValueListInfo) {
		var oMetaModel = mValueListInfo.$model.getMetaModel();
		var oFilterOperatorConfig = FilterOperatorConfig.getFor(mValueListInfo.$model);
		var aFilterProperties = [];

		// valueList parameters
		mValueListInfo.Parameters.forEach(function(oParameter) {
			var sProperty = oParameter.ValueListProperty;
			var oContext = oMetaModel.getContext("/" + mValueListInfo.CollectionPath + "/" + sProperty);

			// only for filterable property paths or columns
			if (CommonHelper.isPropertyFilterable(sProperty, {
				context: oContext
			})) {
				var sType = oMetaModel.getObject("/" + mValueListInfo.CollectionPath + "/" + sProperty + "/$Type");
				var aOperator = oFilterOperatorConfig.getOperatorsForType(sType);
				var aFilterOperators = [];

				// getting operators for filtering
				if (aOperator.includes("Contains")) {
					aFilterOperators.push("contains");
				} else {
					aOperator.forEach(function(sOperator) {
						if (sOperator === "StartsWith" || sOperator === "EQ" || sOperator === "EndsWith") {
							aFilterOperators.push(sOperator.toLowerCase());
						}
					});
				}
				// storing operators
				if (aFilterOperators.length) {
					aFilterProperties.push({
						path: sProperty,
						operators: aFilterOperators
					});
				}
			}
		});

		return aFilterProperties;
	};

	return ValueHelpDialog;

}, /* bExport= */true);
