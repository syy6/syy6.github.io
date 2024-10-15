sap.ui.define(["jquery.sap.global", "sap/ui/base/Object"],
	function(jQuery, BaseObject) {
		"use strict";

		/*
		 * This class is a helper class for the generic class MultipleViewsHandler. More, precisely an instance of
		 * this class is created in the constructor of that class in case, that the multiple table mode of the multiple views feature
		 * has been switched on.
		 * The mode can be switched on and configured via the quickVariantSelectionX.variants section in the manifest.
		 * You can have either a SmartTable or a SmartChart per a tab.
		 * We check under the corresponding SelectionPresentationVariant/PresentationVariant/Vizualizations or PresentationVariant/Vizualizations the first entry in the collection.
		 *  If it is a UI.LineItem then a corresponding SmartTable will be generated. If it is a UI.Chart then a SmartChart is displayed.
		 */

		// oState is used as a channel to transfer data to the controller and back.
		// oController is the controller of the enclosing ListReport
		// oTemplateUtils are the template utils as passed to the controller implementation
		// fnSetInitialKey a function to set the initially set key
		function getMethods(oQuickVariantSelectionX, oState, oController, oTemplateUtils, fnSetInitialKey, mItemData) {

			var bDifferentEntitySets; // each tab can have its own entitySet in this case; entitySets are set in manifest per tab

			function onDetailsActionPress(oEvent) {
				var oEventSource, oBindingContext;
				oEventSource = oEvent.getSource();
				oBindingContext = oEvent.getParameter("itemContexts") && oEvent.getParameter("itemContexts")[0];
				oTemplateUtils.oCommonEventHandlers.onListNavigate(oEventSource, oState, oBindingContext);
			}

			function onChartSelectData(oEvent) {
				var oChart, oSmartChart;
				oChart = oEvent.getSource();
				oSmartChart = oChart.getParent();
				oState.updateControlOnSelectionChange(oSmartChart);
			}

			function fnRegisterToChartEvents(oEvent) {
				var oChart, oSmartChart;
				oSmartChart = oEvent.getSource();
				oChart = oSmartChart.getChart();
				//attach to the selectData event of the sap.chart.Chart
				oChart.attachSelectData(onChartSelectData);
				oChart.attachDeselectData(onChartSelectData);
			}

			// Functions for storing and restoring the state of the controls
			function getContentForIappState(sSelectedKey) {
				var sKey, oTmpTable, oVariantsIds = {};
				for (sKey in mItemData) {
					oTmpTable = mItemData[sKey].implementingControl;
					oVariantsIds[oTmpTable.getId()] = oTmpTable.getCurrentVariantId() || "";
				}
				return {
					selectedTab: sSelectedKey,
					tableVariantIds: oVariantsIds
				};
			}

			function getSelectedKeyAndRestoreFromIappState(oGenericData){
				var j, oTmpTable, sVariantId;
				if (oGenericData) {
					if (oGenericData.tableVariantIds) {
						for (j in mItemData) {
							oTmpTable = mItemData[j].implementingControl;
							sVariantId = oGenericData.tableVariantIds[oTmpTable.getId()];
							if (sVariantId) {
								oTmpTable.setCurrentVariantId(sVariantId);
							}
						}
					}
					return oGenericData.selectedTab;
				}
			}

			function getIsDifferentEntitySets() {
				return bDifferentEntitySets;
			}

			/*
			 * gets properties for the entityType of a oSmartControl
			 * oSmartControl can be either a SmartTable or a SmartChart
			 */
			function getEntityTypeProperties(oSmartControl) {
				var oEntityType = oTemplateUtils.oCommonUtils.getMetaModelEntityType(oSmartControl);
				return oEntityType.property;
			}

			// it is called per Table or Chart
			function fnInit(oEvent, setModelDataForItem) {
				var oControl, sId, sKey;
				if (!oEvent) {
					return;
				}

				oControl = oEvent.getSource();
				sId = oControl.getId();

				for (sKey in mItemData) {
					var oItemData = mItemData[sKey];
					if (sId === oItemData.id) {
						var oSelectionVariantFilters = oTemplateUtils.oCommonUtils.getSelectionVariantFilters(oControl);
						setModelDataForItem(sKey, oControl, oSelectionVariantFilters);
						if (bDifferentEntitySets){
							oItemData.entitySet = oControl.getEntitySet();
							oItemData.properties = getEntityTypeProperties(oControl);						
						}
					}
				}
			}

			function onSelectedKeyChanged(sNewKey){
				oState.oSmartTable = mItemData[sNewKey].implementingControl;
			}

			// End private instance methods

			(function() { // constructor coding encapsulated in order to reduce scope of helper variables 
				var i, oIconTabBar, aTabs, oItem, sKey, oTmpTable, oItemData;

				oIconTabBar = oController.byId("template::IconTabBar");
				if (!oIconTabBar) {
					return;
				}

				for (var i in oQuickVariantSelectionX.variants) {
					if (!!oQuickVariantSelectionX.variants[i].entitySet) {
						bDifferentEntitySets = true;
						break;
					} else {
						bDifferentEntitySets = false;
						break;
					}
				}

				aTabs = oIconTabBar.getItems();

				for (i = 0; i < aTabs.length; i++) {
					oItem = aTabs[i];
					sKey = oItem.getKey();
					if (i === 0){ // initialize with the first item being selected
						fnSetInitialKey(sKey);
					}
					oTmpTable = oController.byId("listReport-" + sKey);
					if (!oState.oSmartTable) {
						oState.oSmartTable = oTmpTable;
					}
					oItemData = {
						id : oTmpTable.getId()
					};
					mItemData[sKey] = oItemData;
				}

				// Attach to “Search” event on SmartFilterBar ( Press on 'Go' button)
				oState.oSmartFilterbar.attachSearch(function(oEvent) {
					oState.oMultipleViewsHandler.refreshOperation(3);                                         
				});
			})();

			// public instance methods
			return {
				fnRegisterToChartEvents: fnRegisterToChartEvents,
				onDetailsActionPress: onDetailsActionPress,
				getContentForIappState: getContentForIappState,
				getSelectedKeyAndRestoreFromIappState: getSelectedKeyAndRestoreFromIappState,
				onSelectedKeyChanged: onSelectedKeyChanged,
				init: fnInit,
				getIsDifferentEntitySets: getIsDifferentEntitySets  
			};
		}

		return BaseObject.extend("sap.suite.ui.generic.template.ListReport.controller.MultipleViewsMultipleTablesModeHelper", {
			constructor: function(oQuickVariantSelectionX, oState, oController, oTemplateUtils, fnSetInitialKey, mItemData) {
				jQuery.extend(this, getMethods(oQuickVariantSelectionX, oState, oController, oTemplateUtils, fnSetInitialKey, mItemData));
			}
		});
	});
