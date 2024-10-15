sap.ui.define(["jquery.sap.global", "sap/ui/base/Object", "sap/ui/base/Event", "sap/ui/core/mvc/ControllerExtension", "sap/ui/Device", "sap/ui/model/Context", "sap/ui/model/Filter", "sap/ui/model/json/JSONModel",
		"sap/m/Table", "sap/m/ListBase", "sap/m/MessageBox",
		"sap/ui/generic/app/navigation/service/NavigationHandler", "sap/ui/generic/app/navigation/service/NavError",
		"sap/suite/ui/generic/template/lib/testableHelper"],
		function(jQuery, BaseObject, Event, ControllerExtension, Device, Context, Filter, JSONModel, ResponsiveTable, ListBase, MessageBox,
				NavigationHandler, NavError, testableHelper) {
	"use strict";

	var oCore = sap.ui.getCore();

	/* For better testablity and for code harmonization testing controls for their type is moved to helper functions */

	function isControlOfType(oControl, sPathToType){
		var FNClass = sap.ui.require(sPathToType);
        return typeof FNClass === "function" && (oControl instanceof FNClass);
	}

	function isSmartTable(oControl){
		return isControlOfType(oControl, "sap/ui/comp/smarttable/SmartTable");
	}

	function isSmartChart(oControl){
		return isControlOfType(oControl, "sap/ui/comp/smartchart/SmartChart");
	}

	function isUiTable(oControl){
		return isControlOfType(oControl, "sap/ui/table/Table");
	}

	function isAnalyticalTable(oControl){
		return isControlOfType(oControl, "sap/ui/table/AnalyticalTable");
	}

	function isTreeTable(oControl){
		return isControlOfType(oControl, "sap/ui/table/TreeTable");
	}

	function isMTable(oControl){
		return isControlOfType(oControl, "sap/m/Table");
	}

	/*
	 * in case of different entitySets in List Report with table/chart tabs
	 * we do not have just one entitySet on the List Report any more
	 */
	function getCurrentEntitySetName(oControl) {
		if (isSmartChart(oControl) || isSmartTable(oControl)) {
			return oControl.getEntitySet();
		} else if (isSmartTable(oControl.getParent())) {
			return oControl.getParent().getEntitySet();
		}
	}

	function getMetaModelEntityType(oSmartControl) {
		var sEntitySet, oMetaModel, oEntitySet, oEntityType;
		sEntitySet = oSmartControl.getEntitySet();
		oMetaModel = oSmartControl.getModel().getMetaModel();
		oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
		oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
		return oEntityType;
	}

	function focusControl(oScrollDelegate, sControlId) {
		var oTarget = sControlId && sap.ui.getCore().byId(sControlId);
		if (oTarget) {
			if (oScrollDelegate.scrollToElement){
				oScrollDelegate.scrollToElement(oTarget.getDomRef());
			}
			oTarget.focus();
		}
	}

	// Expose selected private static functions to unit tests
	/* eslint-disable */
	var isSmartTable = testableHelper.testableStatic(isSmartTable, "CommonUtils_isSmartTable");
	/* eslint-enable */

	function getMethods(oController, oServices, oComponentUtils) {

		var oNavigationHandler; // initialized on demand

		// This map stores additional information for controls that are used on the page.
		// The key is the id of the control
		// The value is an object with proprietary information defined by the corresponding template
		var mControlToInformation = Object.create(null);

		// get the additional information object for the specified control.
		// vSource is either the control itself or a sap.ui.base.Event containing the control as a source.
		// If the additional information object does not exist yet it will be created unless bNoCreate is truthy.
		// In this case the (optional) function fnInit will be called getting the following parameters passed:
		// - The (empty) information object. The initialization function may already add some information.
		// - An (empty) aray of categories. The initialization function may add some categories. These categories can be used to search for the information obejcts.
		// - The corresponding control
		// Note: If this last feature is used, it is essential to ensure either that all possible accesses use the same central access
		// or that an initial accesss (in an onInit-method) is used to ensure the unified initialization
		function getControlInformation(vSource, fnInit, bNoCreate){
			var oControl = vSource instanceof Event ? vSource.getSource() : vSource;
			var sControlId = oControl.getId();
			var oMeta = mControlToInformation[sControlId];
			if (!oMeta){
				if (bNoCreate){
					return null;
				}
				oMeta = {
					control: oControl,
					infoObject: Object.create(null),
					categories: []
				};
				(fnInit || jQuery.noop)(oMeta.infoObject, oMeta.categories, oControl);
				mControlToInformation[sControlId] = oMeta;
			}
			return oMeta.infoObject;
		}

		// This function can be used to perform a certain action for all information objects (see getControlInformation) that belong to a specified category.
		// fnExecute is the function that will be called for all specified informatio0n objects.
		// The expected signature is fnExecute(oInfoObject, oControl)
		function fnExecuteForAllInformationObjects(sCategory, fnExecute){
			for (var sControlId in mControlToInformation){
				var oMeta = mControlToInformation[sControlId];
				if (oMeta.categories.indexOf(sCategory) >= 0){
					fnExecute(oMeta.infoObject, oMeta.control);
				}
			}
		}

		// defines a dependency from oControl to the view
		function fnAttachControlToView(oControl) {
		    oServices.oApplication.attachControlToParent(oControl, oController.getView());
		}

		// If oChild is identified to be invisible, null is returned. Otherwise its parent is returned.
		// If the parent does not exist a faulty value is returned.
		// This is a heuristic method.
		function getParentOfVisibleElement(oChild){
			if (oChild.getVisible && !oChild.getVisible()){
				return null;
			}
			return oChild.getParent() || oChild.oContainer; // For Components the navigation to the parent is not done by the getParent() method, but by the oContainer property.
		}

		// This method checks whether sElementId identifies an element which is visible and placed on this view.
		function isElementVisibleOnView(sElementId){
			var oView = oController.getView();
			var bRet = false;
			for (var oElement = oView.getVisible() && oCore.byId(sElementId); oElement && !bRet; oElement = getParentOfVisibleElement(oElement)) {
				bRet = oElement === oView;
			}
			return bRet;
		}

		// aElementIds is an array of element ids.
		// The function returns the first of the given ids which identifies an element that this view can scroll to.
		// Therefore, the element must fulfill the following conditions
		// 1.It is placed on this view
		// 2. It is visible
		// If no such id exists a faulty value is returned.
		function getPositionableControlId(aElementIds){
			for (var i = 0; i < aElementIds.length; i++){
				var sElementId = aElementIds[i];
				if (isElementVisibleOnView(sElementId)){
					return sElementId;
				}
			}
			return "";
		}

		// See documentation of
		// sap.suite.ui.generic.template.lib.CommonUtils.prototype.getSelectedContexts.getDialogFragment below
		function getDialogFragment(sName, oFragmentController, sModel, fnOnFragmentCreated) {
		    return oServices.oApplication.getDialogFragmentForView(oController.getView(), sName, oFragmentController, sModel, fnOnFragmentCreated);
		}

		var oResourceBundle; // initialized on first use
		function getText() {
			oResourceBundle = oResourceBundle || oController.getOwnerComponent().getModel("i18n").getResourceBundle();
			return oResourceBundle.getText.apply(oResourceBundle, arguments);
		}

		//Get the text context specific overridden text, in case of not existing try to get the text with the
		//framework key. Method should be used when there is a possibility of overriding text based on the context Stable ID
		// - sKey: key of the text which could be overridden by Application developer.
		// - sId: Stable ID of the context control which needs to used by application developer
		// - sFrameworkKey - Optional. Key of the Framework text. Specify only in case it is different from the sKey
		function getContextText(sKey, sId, sFrameworkKey) {
			var sContextKey, sFallbackKey, sText;
			sContextKey = sKey + "|" + sId;
			sFallbackKey = sFrameworkKey || sKey;

			sText = getText(sContextKey);

			if (sText === sContextKey) {
				//getText method will return the key passed as argument as result in case it doesn't find the text.
				//In case of missing context based text, try to retrieve the framework text.
				sText = getText(sFallbackKey);
			}

			return sText;
		}

		// This functions intends to give selection from different selection behavior
		function getSelectionPoints(oChart, sSelectionBehavior) {
			var sSelectionBehavior = sSelectionBehavior || oChart.getSelectionBehavior();
			if (sSelectionBehavior === "DATAPOINT"){
				return {"dataPoints": oChart.getSelectedDataPoints().dataPoints, "count": oChart.getSelectedDataPoints().count };
			} else if (sSelectionBehavior === "CATEGORY") {
				return {"dataPoints": oChart.getSelectedCategories().categories, "count": oChart.getSelectedCategories().count };
			} else if (sSelectionBehavior === "SERIES") {
				return {"dataPoints": oChart.getSelectedSeries().series, "count": oChart.getSelectedSeries().count };
			}
		}
		function getSelectedContexts(oControl, sSelectionBehavior, mDataPoints) {
			var aSelectedContexts = [];
			if (isSmartTable(oControl)) {
				oControl = oControl.getTable();
			} else if (isSmartChart(oControl)) {
				oControl = oControl.getChart();
				if (oControl && oControl.getMetadata().getName() === "sap.chart.Chart") {
					var isContext = false;
					sSelectionBehavior = sSelectionBehavior || oControl.getSelectionBehavior();
					mDataPoints = mDataPoints || getSelectionPoints(oControl, sSelectionBehavior);
					if (mDataPoints && mDataPoints.count > 0) {
						if (sSelectionBehavior === "DATAPOINT"){
							isContext = true;
						}
						var aDataPoints = mDataPoints.dataPoints;
						var paramList = [];
						for (var i = 0; i < aDataPoints.length; i++) {
							if (isContext){
								if (aDataPoints[i].context){
									aSelectedContexts.push(aDataPoints[i].context);
								}
							} else {
								//if context does not exist it is selection behavior category or series
								paramList.push(aDataPoints[i].dimensions);
							}
						}
						if (!isContext){
							aSelectedContexts[0] = paramList;
						}
					}
				}
			}
			if (oControl instanceof ListBase) {
				aSelectedContexts = oControl.getSelectedContexts();
			} else if (isUiTable(oControl)) {
				var aIndex = oControl.getSelectedIndices();
				for (var i = 0; i < aIndex.length; i++) {
					aSelectedContexts.push(oControl.getContextByIndex(aIndex[i]));
				}
			}
			return aSelectedContexts;
		}

		function getElementCustomData(oElement) {
			var oCustomData = {};
			if (oElement instanceof sap.ui.core.Element) {
				oElement.getCustomData().forEach(function(oCustomDataElement) {
					oCustomData[oCustomDataElement.getKey()] = oCustomDataElement.getValue();
				});
			}
			return oCustomData;
		}

		/*
		 * Sets the enabled value for Toolbar buttons
		 * @param {object} oSubControl
		 */
		function fnSetEnabledToolbarButtons (oSubControl) {
			var aToolbarControls, aButtons, oToolbarControl, aMenuButtonItems;
			var oControl = getOwnerControl(oSubControl);  // look for parent table or chart
			if (!isSmartTable(oControl) && !isSmartChart(oControl)) {
				oControl = oControl.getParent();
			}
			var aContexts = getSelectedContexts(oControl);
			var oModel = oControl.getModel();

			aButtons = getBreakoutActionIds(oControl);
			fnFillEnabledMapForBreakoutActions(aButtons, aContexts, oModel, oControl);
			if (isSmartTable(oControl)) {
				aToolbarControls = oControl.getCustomToolbar() && oControl.getCustomToolbar().getContent();
			} else if (isSmartChart(oControl)) {
				aToolbarControls = oControl.getToolbar() && oControl.getToolbar().getContent();
			}

			// loop through the array of controls inside the toolbar
			if (aToolbarControls && aToolbarControls.length > 0) {
				for (var i = 0; i < aToolbarControls.length; i++) {
					oToolbarControl = aToolbarControls[i];
					if (oToolbarControl.getMetadata().getName() === "sap.m.Button" && oToolbarControl.getVisible()) {
						fnHandleToolbarButtonsEnablement(oToolbarControl, oModel, aContexts, oControl);
					} else if (oToolbarControl.getMetadata().getName() === "sap.m.MenuButton") {
						aMenuButtonItems = oToolbarControl.getMenu().getItems();
						if (aMenuButtonItems && aMenuButtonItems.length > 0) {
							for (var j = 0; j < aMenuButtonItems.length; j++) {
								oToolbarControl = aMenuButtonItems[j];
								if (oToolbarControl.getVisible()) {
									fnHandleToolbarButtonsEnablement(oToolbarControl, oModel, aContexts, oControl);
								}
							}
						}
					}
				}
			}
		}

		function fnHandleToolbarButtonsEnablement (oToolbarControl, oModel, aContexts, oControl) {
			var sLocalButtonId, bEnabled;
			var mCustomData = getElementCustomData(oToolbarControl);
			var oView = oController.getView();
			var oMetaModel = oModel.getMetaModel();
			if (mCustomData && mCustomData.Type) {
				// get the partial id, instead of the full id generated by ui5
				// partial id is used when initially building the expression - see method buildAnnotatedActionButtonEnablementExpression in AnnotationHelper.js
				if (mCustomData.originalButtonId) {
					sLocalButtonId = oView.getLocalId(mCustomData.originalButtonId);
				} else {
					sLocalButtonId = oView.getLocalId(oToolbarControl.getId());
				}
				// 1. Type = "CRUDActionDelete" -> Delete button
				// 2. Type = "com.sap.vocabularies.UI.v1.DataFieldForAction" or "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation" -> Annotated Action button
				if (mCustomData.Type === "CRUDActionDelete") {
					bEnabled = fnShouldDeleteButtonGetEnabled(oModel, oMetaModel, aContexts, oControl);
					oControl.getModel("_templPriv").setProperty("/listReport/deleteEnabled", bEnabled);
				} else if (mCustomData.Type === "com.sap.vocabularies.UI.v1.DataFieldForAction" || mCustomData.Type === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") {
					bEnabled = fnShouldAnnotatedActionButtonGetEnabled(oModel, oMetaModel, aContexts, mCustomData.Type, mCustomData.Action, oControl);
				}
			}

			// check if "enabled" is bound to the path '/generic/controlProperties/' in the model - otherwise it's bound to another path or has a hard coded true/false
			if (/generic\/controlProperties/.test(oToolbarControl.getBindingPath("enabled")) && bEnabled !== undefined) {
				fnSetPrivateModelControlProperty(sLocalButtonId, "enabled", bEnabled);
			}
		}

		function fnSetEnabledFooterButtons (oEventSource) {
			var aButtons;
			var oControl = getOwnerControl(oEventSource);
			var aContexts = getSelectedContexts(oControl);
			var oModel = oEventSource.getModel();
			aButtons = getBreakoutActionsForFooter();
			fnFillEnabledMapForBreakoutActions(aButtons, aContexts, oModel, oControl);
		}

		/*
		 * Updates the private model control property
		 * @param {string} sId - the id of the button in the private model
		 * @param {string} sProperty - the name of the property in the private model
		 * @param {string} sValue - the value of the property
		 */
		function fnSetPrivateModelControlProperty (sId, sProperty, sValue) {
			var oTemplatePrivateModel = oController.getView().getModel("_templPriv");
			var mModelProperty = oTemplatePrivateModel.getProperty("/generic/controlProperties/" + sId);
			// check if the id exists in the model
			if (!mModelProperty) {
				mModelProperty = {};
				mModelProperty[sProperty] = sValue;
				oTemplatePrivateModel.setProperty("/generic/controlProperties/" + sId, mModelProperty);
			} else {
				oTemplatePrivateModel.setProperty("/generic/controlProperties/" + sId + "/" + sProperty, sValue);
			}
		}

		/*
		 * Determines whether an Annotated Action should be enabled or disabled
		 * @private
		 */
		function fnShouldAnnotatedActionButtonGetEnabled (oModel, oMetaModel, aContexts, sType, sAction, oControl) {
			var mFunctionImport, mData, sActionFor, sApplicablePath;
			var bEnabled = false;

			if (sType === "com.sap.vocabularies.UI.v1.DataFieldForAction") {
				mFunctionImport = oMetaModel.getODataFunctionImport(sAction);
				sActionFor = mFunctionImport && mFunctionImport["sap:action-for"];
				// check if 'sap:action-for' is defined
				if (sActionFor && sActionFor !== "" && sActionFor !== " ") {
					if (aContexts.length > 0) {
						sApplicablePath = mFunctionImport["sap:applicable-path"];
						// check if 'sap:applicable-path' is defined
						if (sApplicablePath && sApplicablePath !== "" && sApplicablePath !== " ") {
							for (var j = 0; j < aContexts.length; j++) {
								if (!aContexts[j]) {
									continue;
								}
								mData = oModel.getObject(aContexts[j].getPath()); // get the data
								if (mData && mData[sApplicablePath]) {
									bEnabled = true;  //  'sap:action-for' defined, 'sap:applicable-path' defined, 'sap-applicable-path' value is true, more than 1 selection -> enable button
									break;
								}
							}
						} else {
							bEnabled = true; // 'sap:action-for' defined, 'sap:applicable-path' not defined, more than 1 selection -> enable button
						}
					}
				} else {
					bEnabled = true; // 'sap:action-for' not defined, no selection required -> enable button
				}
			} else if (sType === "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation") { // to enable UI.DataFieldForIntentBasedNavigation action button at least one selection is required
				// enable the button to true if any chart selection is made or any drill down is performed with some selections already being present
				if (aContexts.length > 0 || (isSmartChart(oControl) && oControl.getDrillStackFilters().length > 0)){
					bEnabled = true;
				}
			}

			return bEnabled;
		}

		/*
		 * Determines whether the Delete button should be enabled or disabled
		 * @private
		 */
		function fnShouldDeleteButtonGetEnabled (oModel, oMetaModel, aContexts, oControl) {
			// Get the DeleteRestrictions for the entity set
			var mDeleteRestrictions = fnGetDeleteRestrictions(oControl);

			// 1- Make Delete button disabled and assume all items are NOT deletable
			// 2- Check if the DeleteRestrictions are valid. if not-> Delete button disabled
			// 3- Check if the Deletable-path is defined. if not-> Delete button enabled.
			// if there is no DeleteRestrictions, this means the entities are deletable
			// 4- Check if object is locked. i.e. in process by another user. In this case -> disable delete, else enable delete
			var bEnabled = false;
			var oEntity;
			var mRelatedEntitySet = oMetaModel.getODataEntitySet(oControl.getEntitySet());
			if (sap.suite.ui.generic.template.js.AnnotationHelper.areDeleteRestrictionsValid(oMetaModel, mRelatedEntitySet.entityType, mDeleteRestrictions)) {
				if (aContexts.length > 0) {
					var sDeletablePath = mDeleteRestrictions && mDeleteRestrictions.Deletable && mDeleteRestrictions.Deletable.Path;
					for (var i = 0; i < aContexts.length; i++) {
						oEntity = oModel.getObject(aContexts[i].getPath());
						if (!oEntity) {
							break;
						}
						if (sDeletablePath) {
							if (aContexts[i] && oModel.getProperty(sDeletablePath, aContexts[i])) {
								if (!(oEntity.IsActiveEntity && oEntity.HasDraftEntity && oEntity.DraftAdministrativeData && oModel.getProperty("DraftAdministrativeData/InProcessByUser", aContexts[i]))) {
									bEnabled = true;
									break;
								}
							}
						} else {
							if (!(oEntity.IsActiveEntity && oEntity.HasDraftEntity && oEntity.DraftAdministrativeData && oModel.getProperty("DraftAdministrativeData/InProcessByUser", aContexts[i]))) {
								bEnabled = true;
								break;
							}
						}
					}
				}
			}
			return bEnabled; //return false if all objects are locked/undeletable
		}

		/*
		 * Returns the Deletable Restrictions
		 * @param {object} oControl - must be of a Smart Control (e.g. SmartTable, SmartChart)
		 */
		function fnGetDeleteRestrictions(oControl) {
			var oMetaModel = oControl.getModel() && oControl.getModel().getMetaModel();
			var mEntitySet = oMetaModel && oMetaModel.getODataEntitySet(oControl.getEntitySet());
			var mDeleteRestrictions = mEntitySet && mEntitySet["Org.OData.Capabilities.V1.DeleteRestrictions"];
			return mDeleteRestrictions;
		}

		/*
		* Update map /generic/listCommons/breakoutActionsEnabled from selected context,
		* considering the applicable path and action-for
		*/
		function fnFillEnabledMapForBreakoutActions(aButtons, aContexts, oModel, oControl) {
			var oBreakoutActions = fnGetBreakoutActions(oControl);
			var oTemplatePrivateModel = oController.getView().getModel("_templPriv");
			var oBreakOutActionEnabled = oTemplatePrivateModel.getProperty("/generic/listCommons/breakoutActionsEnabled");
			if (oBreakoutActions) {
				var oIconTabBar = oController.byId("template::IconTabBar");
				var sSelectedTabKey = "";
				if (oIconTabBar) {
					sSelectedTabKey = oIconTabBar.getSelectedKey();
				}
				fnUpdateBreakoutEnablement(oBreakOutActionEnabled, oBreakoutActions, aButtons, aContexts, oModel, sSelectedTabKey, oControl);
			}
			oTemplatePrivateModel.setProperty("/generic/listCommons/breakoutActionsEnabled", oBreakOutActionEnabled);
		}

		function fnUpdateBreakoutEnablement(oBreakOutActionEnabled, oBreakoutActions, aButtons, aContexts, oModel, sSelectedTabKey, oControl) {
			var bEnabled;
			for (var sActionId in oBreakoutActions) {
				bEnabled = true;
				if (oBreakoutActions[sActionId].requiresSelection) {
					if (aContexts.length > 0) { // context selected
						if (oBreakoutActions[sActionId].applicablePath !== undefined && oBreakoutActions[sActionId].applicablePath !== "") {
							// loop on all selected contexts: at least one must be selected with applicablePath = true
							bEnabled = false;
							for (var iContext = 0; iContext < aContexts.length; iContext++) {
								// check if applicablePath is true
								var sNavigationPath = "";
								var aPaths = oBreakoutActions[sActionId].applicablePath.split("/");
								if (aPaths.length > 1) {
									for (var iPathIndex = 0; iPathIndex < aPaths.length - 1; iPathIndex++) {
										sNavigationPath +=  "/" + aPaths[iPathIndex];
									}
								}
								var oObject = oModel.getObject(aContexts[iContext].getPath() + sNavigationPath);
								var sApplicablePath = aPaths[aPaths.length - 1];
								if (oObject[sApplicablePath] === true) {
									bEnabled = true;
									break;
								}
							}
						}
					} else if (isSmartChart(oControl) && oControl.getDrillStackFilters().length > 0) {
						//Selection is made on the chart but drilldown is performed later.
						bEnabled = true;
					} else {
						// requiresSelection is defined, but no row is selected
						bEnabled = false;
					}
				}
				var sControlId = oBreakoutActions[sActionId].id + ((sSelectedTabKey && !oBreakoutActions[sActionId].determining) ? "-" + sSelectedTabKey : "");
				oBreakOutActionEnabled[sControlId] = {
						enabled: bEnabled
				};
			}
		}


		function getBreakoutActionIds(oControl) {
			var aResult = [];
			var oActions = fnGetBreakoutActions(oControl);
			for (var sAction in oActions){
				aResult.push(oActions[sAction].id);
			}
			return aResult;
		}

		function getBreakoutActionsForFooter() {
			var aActions = [];
			var oActions = fnGetBreakoutActions();
			for (var sAction in oActions) {
				if (oActions[sAction].determining){aActions.push(sAction);}
			}
			return aActions;
		}

		/*
		 * Returns the names of all relevant breakout actions. Only actions for the current component and the current section (if applicable) are returned.
		 */
		function fnGetBreakoutActions(oControl) {
			// oControl must be SmartTable or SmartChart!
			// Loop on manifest for breakout actions
			var oManifest = oController.getOwnerComponent().getAppComponent().getManifestEntry("sap.ui5");
			var oExtensions = oManifest.extends && oManifest.extends.extensions && oManifest.extends.extensions["sap.ui.controllerExtensions"];
			oExtensions = oExtensions && oExtensions[oController.getOwnerComponent().getTemplateName()];
			oExtensions = oExtensions && oExtensions["sap.ui.generic.app"];
			// sEntitySet is used to look in the manifest for breakout actions - here always the leading entityset (in case of multi entitysets on LR) is needed
			// on OP, also the EntitySet of the Component is needed (not the one represented in the table in the section)
			var sEntitySet = oController.getOwnerComponent().getEntitySet();
			var sSectionId = getElementCustomData(oControl).sectionId;
			if (!sSectionId){
				// actions related to the page
				return oExtensions && oExtensions[sEntitySet] && oExtensions[sEntitySet]["Actions"];
			} else {
				// actions related to one section
				var oSections = oExtensions && oExtensions[sEntitySet] && oExtensions[sEntitySet]["Sections"];
				return oSections && oSections[sSectionId] && oSections[sSectionId].Actions;
			}
		}

		/*
		 * Returns an ancestoral table/chart of the given element or null
		 *
		 * @param {sap.ui.core.Element} oSourceControl The element where to start searching for a ancestoral table/chart
		 * @returns {sap.ui.table.Table|sap.m.Table|sap.ui.comp.smarttable.SmartTable|sap.ui.comp.smartchart.SmartChart} The ancestoral table/chart or null
		 * @public
		 */
		function getOwnerControl(oSourceControl){
			var oCurrentControl = oSourceControl;
			while (oCurrentControl) {
				if (oCurrentControl instanceof ResponsiveTable || isUiTable(oCurrentControl) || isSmartTable(oCurrentControl) || isSmartChart(oCurrentControl)) {
					return oCurrentControl;
				}
				oCurrentControl = oCurrentControl.getParent && oCurrentControl.getParent();
			}
			return null;
		}

		/*
		 * Returns the binding of the given table
		 *
		 * @param {sap.ui.table.Table|sap.m.Table|sap.ui.comp.smarttable.SmartTable} oTable The table which's binding is to returned
		 * @returns {object} The found binding or null
		 * @public
		 */
		function getTableBindingInfo(oTable) {
			if (isSmartTable(oTable)) {
				oTable = oTable.getTable(); // get SmartTable's inner table first
			}

			if (isUiTable(oTable)) {
				return oTable.getBindingInfo("rows");
			} else if (oTable instanceof ResponsiveTable) {
				return oTable.getBindingInfo("items");
			}

			return null;
		}

		/*
		 * Refresh given SmartTable
		 *
		 * This method should be provided by SmartTable itself
		 *
		 * @param {sap.ui.table.Table|sap.m.Table|sap.ui.comp.smarttable.SmartTable} oSmartTable The table to refresh. Intended for SmartTable,
		 * but will also work if inner table is provided
		 */

		function fnRefreshSmartTable(oSmartTable) {
			var oBindingInfo = getTableBindingInfo(oSmartTable);
			if (oBindingInfo && oBindingInfo.binding) {
				oBindingInfo.binding.refresh();
			} else if (oSmartTable && oSmartTable.rebindTable) {
				oSmartTable.rebindTable();
			}
		}

		/*
		 * If at least one relevant entity set is etag enabled, refresh based on etags only. Else, whole model content will be deleted.
		 * The required content will automatically loaded again by UI5.
		 *@public
		*/
		function fnRefreshModel(oSmartTable) {
			//ALP have to check their coding themselves
			var oComponent = oController.getOwnerComponent();
			var oModel = oComponent.getModel();
			var sPath, oTableBindingInfo;
			var bMustRefresh = !oServices.oApplication.checkEtags();
			if (bMustRefresh) {
				oTableBindingInfo = getTableBindingInfo(oSmartTable);
				if (oTableBindingInfo) {
					sPath = oTableBindingInfo.path;
					var entitySetName = oSmartTable.getEntitySet();
					var oMetaModel = oModel.getMetaModel();
					var entitySet = oMetaModel.getODataEntitySet(entitySetName);
					if (oController.getMetadata().getName() === 'sap.suite.ui.generic.template.AnalyticalListPage.view.AnalyticalListPage' && isParameterizedEntitySet(oModel,entitySet)) {
						oModel.invalidateEntityType(entitySet.entityType);
					} else {
						oModel.invalidate(fnCheckEntry.bind(null, sPath));
					}
					var sComponentId = oComponent.getId();
					var mExceptions = Object.create(null);
					mExceptions[sComponentId] = true;
					oServices.oApplication.refreshAllComponents(mExceptions);
				}
			}
		}
		/*
		  Check if the entitySet is parameterized or not
		 */
		function isParameterizedEntitySet(oModel,oEntitySet) {
			jQuery.sap.require("sap.ui.model.analytics.odata4analytics");
			var o4a = new sap.ui.model.analytics.odata4analytics.Model(sap.ui.model.analytics.odata4analytics.Model.ReferenceByModel(oModel));
			var queryResult = o4a.findQueryResultByName(oEntitySet.name);
			var parameterization = queryResult && queryResult.getParameterization();
			return !!parameterization;
		}

		/**
		 * the callback function for ODataModel
		 */
		function fnCheckEntry(sPath, sKey, oEntry) {
			var sMatchTableItems = sPath[0] === "/" ? sPath.substr(1) : sPath;
			if (sKey.split("(")[0] === sMatchTableItems) {
				return true;
			} else {
				return false;
			}
		}

		/*
		 * Triggers navigation from a given list item.
		 *
		 * @param {sap.ui.model.context} selected context for navigation
		 * @param {object} oTable The table from which navigation was triggered
		 *        control in the table
		 * @public
		 */
		function fnNavigateFromListItem(oContext, oTable) {
			var sSelectedPath = oContext.getPath();
			var oComponent = oController.getOwnerComponent();

			// binding path of component - either binding path of list (list screen e.g. /SalesOrder) or binding path of details screen (e.g.
			// /SalesOrder(123) )
			var oElementBinding = oComponent.getComponentContainer().getElementBinding();
			var sPath = oElementBinding ? oElementBinding.getPath() : "";

			// check whether it is a navigation property binding or just a collection
			var sNavigationProperty = null;

			if (sSelectedPath.indexOf(sPath) !== 0) {
				// relative binding - table bound to navigation property e.g. Item - get binding of embedded table in details screen
				sNavigationProperty = getTableBindingInfo(oTable).path;
			}

			var bReplace = !oServices.oApplication.isNewHistoryEntryRequired(oContext, sNavigationProperty);
			var iDisplayMode;
			if (oComponentUtils.isDraftEnabled()){
				iDisplayMode = oServices.oDraftController.isActiveEntity(oContext) ? 1 : 6;
			} else {
				iDisplayMode = oComponent.getModel("ui").getProperty("/editable") ? 6 : 1;
			}

			var iViewLevel = oComponentUtils.getViewLevel();
			if (iViewLevel === 0) {
				var sForwardNavigationProperty = oServices.oApplication.getForwardNavigationProperty(iViewLevel);
			}

			// check if forwardNavigationProperty is set and navigate to the corrosponding page
			if (sForwardNavigationProperty) {
				var oContextCreationBindingPromise = new Promise(function(fnResolve){
					oContext.getModel().createBindingContext(sForwardNavigationProperty, oContext, null, function(oNavigationContext) {
						if (oNavigationContext) {
							oServices.oNavigationController.navigateToContext(oNavigationContext, sNavigationProperty, bReplace, iDisplayMode);
							fnResolve();
						} else {
							oComponentUtils.navigateToDataLoadedFailedPage();
							fnResolve();
						}
					});
				});
				var oBusyHelper = oServices.oApplication.getBusyHelper();
				oBusyHelper.setBusy(oContextCreationBindingPromise);
			} else {
				 oServices.oNavigationController.navigateToContext(oContext, sNavigationProperty, bReplace, iDisplayMode);
			}
		}

		/*
		 * Triggers navigation to the specified context.
		 *
		 * @param {sap.ui.model.Context} context for navigation
		 * @param {object} [oNavigationData] object containing navigation data
		 */
		function fnNavigateToContext(vContext, oNavigationData) {
			// Normal navigation (via a context)
			if (vContext instanceof Context){
				oServices.oNavigationController.navigateToContext(vContext, oNavigationData && oNavigationData.navigationProperty, oNavigationData && oNavigationData.replaceInHistory);
				return;
			}
			// Navigation via a virtual navigation property
			var sRouteName = oNavigationData && oNavigationData.routeName;
			if (sRouteName){
				oComponentUtils.navigateRoute(sRouteName, vContext, null, oNavigationData && oNavigationData.replaceInHistory);
				return;
			}
			jQuery.sap.log.warning("navigateToContext called without context or route");
		}

		// Fix for BCP 1770053414 where error message is displayed instead of error code
		function fnHandleError(oError) {
			if (oError instanceof NavError) {
				if (oError.getErrorCode() === "NavigationHandler.isIntentSupported.notSupported") {
					MessageBox.show(getText("ST_NAV_ERROR_NOT_AUTHORIZED_DESC"), {
						title: getText("ST_GENERIC_ERROR_TITLE")
					});
			} else {
					MessageBox.show(oError.getErrorCode(), {
						title: getText("ST_GENERIC_ERROR_TITLE")
					});
				}
			}
		}

		function fnNavigateExternal(oOutbound, oState) {
			fnProcessDataLossConfirmationIfNonDraft(function() {
				oNavigationHandler = getNavigationHandler();
				var oObjectInfo = {
						semanticObject: oOutbound.semanticObject,
						action: oOutbound.action
				};
				var oSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant(oOutbound.parameters);
				oController.adaptNavigationParameterExtension(oSelectionVariant, oObjectInfo);
				oNavigationHandler.navigate(oOutbound.semanticObject, oOutbound.action, oSelectionVariant.toJSONString(),
						null, fnHandleError);
				//null object has to be passed to the NavigationHandler as an
				//indicator that the state should not be overwritten
			}, jQuery.noop, oState, "LeavePage");
		}

		function fnGetNavigationKeyProperties(sTargetEntitySet) {
			var aPageKeys = [], oKeyInfo, oEntityType, sEntityType;
			var oComponent = oController.getOwnerComponent();
			var oMetaModel = oComponent.getModel().getMetaModel();
			if (!sTargetEntitySet) {
				return {};
			}
			var oPages = oComponent.getAppComponent().getConfig().pages[0];
			if (!oPages) {
				return {};
			}
			var fnPrepareKeyInfo = function(oPage) {
				sEntityType = oMetaModel.getODataEntitySet(oPage.entitySet).entityType; //oPages.pages[i].entitySet).entityType;
				oEntityType = oMetaModel.getODataEntityType(sEntityType);
				oKeyInfo = {};
				oKeyInfo = {
					entitySet: oPage.entitySet,// sEntitySet, //oPages.pages[i].entitySet,
					aKeys: oMetaModel.getODataEntityType(sEntityType).key.propertyRef,
					navigationProperty: oPage.navigationProperty
				};
				for (var j = 0, jlength = oKeyInfo.aKeys.length; j < jlength; j++) {
					var k = 0, klength = oEntityType.property.length;
					for (k; k < klength; k++) {
						if (oKeyInfo.aKeys[j].name === oEntityType.property[k].name) {
							oKeyInfo.aKeys[j].type = oEntityType.property[k].type;
							break;
						}
					}
				}
			};
			var fnGetPathKeys = function(sTargetEntitySet, oPages) {
				if (!oPages.pages) {
					return aPageKeys;
				}
				for (var i = 0, ilength = oPages.pages.length; i < ilength; i++) {
					if (!oPages.pages[i]) {
						break;
					}
					if (sTargetEntitySet === oPages.pages[i].entitySet) {
						fnPrepareKeyInfo(oPages.pages[i]);
						aPageKeys.splice(0, 0, oKeyInfo);
						break;
					}
					aPageKeys = fnGetPathKeys(sTargetEntitySet, oPages.pages[i]);
					if (aPageKeys.length > 0) {
						fnPrepareKeyInfo(oPages.pages[i]);
						aPageKeys.splice(0, 0, oKeyInfo);
					}
				}
				return aPageKeys;
			};
			return fnGetPathKeys(sTargetEntitySet, oPages);
		}

		function fnMergeNavigationKeyPropertiesWithValues(aKeys, Response) {
			var sKeySeparator, sRoute, i, ilength;
			for (i = 0, ilength = aKeys.length; i < ilength; i++) {
				if (aKeys[i].navigationProperty) {
					sRoute += "/" + aKeys[i].navigationProperty;
				} else {
					sRoute = "/" + aKeys[i].entitySet;
				}
				for (var j = 0, jlength = aKeys[i].aKeys.length; j < jlength; j++) {
					if (j === 0) {
						sRoute += "(";
						sKeySeparator = "";
					} else {
						sKeySeparator = ",";
					}

					switch (aKeys[i].aKeys[j].type) {
						case "Edm.Guid":
							if (Response.DraftAdministrativeData && Response.DraftAdministrativeData.DraftIsCreatedByMe) {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + "guid'" + Response.DraftAdministrativeData[aKeys[i].aKeys[j].name] + "'";
							} else {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + "guid'" + Response[aKeys[i].aKeys[j].name] + "'";
							}
							break;
						case "Edm.Boolean":
							if (Response.DraftAdministrativeData && Response.DraftAdministrativeData.DraftIsCreatedByMe) {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + false;
							} else {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + Response[aKeys[i].aKeys[j].name];
							}
							break;
						default:
							if (typeof Response[aKeys[i].aKeys[j].name] === "string") {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + "'" + Response[aKeys[i].aKeys[j].name] + "'";
							} else {
								sRoute += sKeySeparator + aKeys[i].aKeys[j].name + "=" + Response[aKeys[i].aKeys[j].name];
							}
							break;
						}
						if (j === (jlength - 1)) {
							sRoute += ")";
						}
					}
				}
			return sRoute;
		}

		function fnSemanticObjectLinkNavigation(oEventParameters, sSelectionVariant, oController) {
			var oSelectionVariant, sSelectionVariantPrepared, sParameter, sSemanticObject, aSelVariantPropertyNames, aSelOptionPropertyNames, aParameterNames;
			var oObjectInfo = {
				semanticObject : "",
				action : ""
			};
			oNavigationHandler = getNavigationHandler();
			for (sSemanticObject in oEventParameters.semanticAttributesOfSemanticObjects) {
				oSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant({}, sSelectionVariant);
				//collect the parameters without values!
				for (sParameter in oEventParameters.semanticAttributesOfSemanticObjects[sSemanticObject]) {
					if (!oSelectionVariant.getSelectOption(sParameter)) {
						oSelectionVariant.addParameter(sParameter, "");
					}
				}
				aSelVariantPropertyNames = oSelectionVariant.getPropertyNames();
				oObjectInfo.semanticObject = sSemanticObject;
				oController.adaptNavigationParameterExtension(oSelectionVariant, oObjectInfo);
				aSelOptionPropertyNames = oSelectionVariant.getSelectOptionsPropertyNames();
				aParameterNames = oSelectionVariant.getParameterNames();
				for (var i = 0, length = aSelVariantPropertyNames.length; i < length; i++) {
					if (aSelOptionPropertyNames.indexOf(aSelVariantPropertyNames[i]) < 0 && aParameterNames.indexOf(aSelVariantPropertyNames[i]) < 0) {
					//remove the not selected parameters and selectOptions
						delete oEventParameters.semanticAttributesOfSemanticObjects[sSemanticObject][aSelVariantPropertyNames[i]];
						oSelectionVariant.removeSelectOption(aSelVariantPropertyNames[i]);
					}
				}
				if (sSemanticObject === oEventParameters.semanticObject){
					var oSemObjEmpty = oEventParameters.semanticAttributesOfSemanticObjects[""];
					for (var j = 0, length = aParameterNames.length; j < length; j++ ) {
						if (aParameterNames[j] in oSemObjEmpty) {
							oSelectionVariant.removeParameter(aParameterNames[j]);
						} else {
							oSelectionVariant.removeParameter(aParameterNames[j]);
							var sParameterValue = oEventParameters.semanticAttributesOfSemanticObjects[oEventParameters.semanticObject][aParameterNames[j]];
							if (typeof sParameterValue === "undefined" || sParameterValue === null) {
								sParameterValue = "";
							} else {
								sParameterValue = String(sParameterValue);
							}
							oSelectionVariant.addParameter(aParameterNames[j], sParameterValue);
						}
					}
					oSelectionVariant = oNavigationHandler.mixAttributesAndSelectionVariant(oEventParameters.semanticAttributesOfSemanticObjects[sSemanticObject], sSelectionVariant);
					sSelectionVariantPrepared = oSelectionVariant.toJSONString();
				}
			}
			delete oEventParameters.semanticAttributes;
			oNavigationHandler.processBeforeSmartLinkPopoverOpens(oEventParameters, sSelectionVariantPrepared);
		}

		// Begin: helper functions for onBeforeRebindTable/Chart

		// This function collects all mandatory fields needed for the specified entity set. The names of these fields are passed to the callback fnHandleMandatoryField.
		// It is assumed that this callback is able to deal with duplicate calls for the same field.
		// the additional fields are: semantic key, technical key + IsDraft / HasTwin
		function fnHandleMandatorySelectionFields(sEntitySet, fnHandleMandatoryField){
			var fnHandleKeyFields = function(aMandatoryFields){
				for (var i = 0; i < aMandatoryFields.length; i++) {
					fnHandleMandatoryField(aMandatoryFields[i].name);
				}
			};//Come back to this for ALP
			var oMetaModel = oController.getView().getModel().getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet, false);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType, false);
			fnHandleKeyFields(oEntityType.key.propertyRef);

			var oDraftContext = oServices.oDraftController.getDraftContext();
			if (oDraftContext.isDraftEnabled(sEntitySet)) {
				fnHandleKeyFields(oDraftContext.getSemanticKey(sEntitySet));
				fnHandleMandatoryField("IsActiveEntity");
				fnHandleMandatoryField("HasDraftEntity");
				fnHandleMandatoryField("HasActiveEntity");
			}
		}

		// sets the edit state filter in the binding params according to the content of the corresponding field in the filterbar
		function setEditStateFilter(oSmartFilterBar, oBindingParams) {
			if (!oComponentUtils.isDraftEnabled() || !oSmartFilterBar){
				// don't add a filter for non-draft apps
				// and if no SmartFilterBar exists (e.g. on ObjectPage)
				return;
			}
			var oEditStateFilter = oSmartFilterBar.getControlByKey("EditState");
			// if editStateFilter does not exist (due to corresponding annotation), add filter expression for "all"
			var vDraftState = oEditStateFilter && oEditStateFilter.getSelectedKey() || "";
			switch (vDraftState) {
				case "1": // Unchanged
					// IsActiveDocument and siblingEntity eq null
					oBindingParams.filters.push(new Filter("IsActiveEntity", "EQ", true));
					oBindingParams.filters.push(new Filter("HasDraftEntity", "EQ", false));
					break;
				case "2": // Draft
					oBindingParams.filters.push(new Filter("IsActiveEntity", "EQ", false));
					break;
				case "3": // Locked
					oBindingParams.filters.push(new Filter("IsActiveEntity", "EQ", true));
					oBindingParams.filters.push(new Filter("SiblingEntity/IsActiveEntity", "EQ", null));
					oBindingParams.filters.push(new Filter("DraftAdministrativeData/InProcessByUser", "NE", ""));
					break;
				case "4": // Unsaved changes
					oBindingParams.filters.push(new Filter("IsActiveEntity", "EQ", true));
					oBindingParams.filters.push(new Filter("SiblingEntity/IsActiveEntity", "EQ", null));
					oBindingParams.filters.push(new Filter("DraftAdministrativeData/InProcessByUser", "EQ", ""));
					break;
				default: // All ==> Special handling for multiple multi-filters
					var oOwnMultiFilter = new Filter({
						filters: [new Filter("IsActiveEntity", "EQ", false),
						          new Filter("SiblingEntity/IsActiveEntity", "EQ", null)
						],
						and: false
					});
				if (oBindingParams.filters[0] && oBindingParams.filters[0].aFilters) {
					var oSmartTableMultiFilter = oBindingParams.filters[0];
					oBindingParams.filters[0] = new Filter([oSmartTableMultiFilter, oOwnMultiFilter], true);
				} else {
					oBindingParams.filters.push(oOwnMultiFilter);
				}
				break;
			}
		}

		/**
		 * This function toggles active object filter
		 * @param  {object} oBindingParams
		 * @param  {boolean} bOnlyActiveObjects
		 * @return {void}
		 */
		function fnSetActiveObjectFilter(oBindingParams, bOnlyActiveObjects){
			if (bOnlyActiveObjects) {
				oBindingParams.filters.push(new Filter("IsActiveEntity", "EQ", true));
			} else {
				var oOwnMultiFilter = new Filter({
						filters: [new Filter("IsActiveEntity", "EQ", false),
						          new Filter("SiblingEntity/IsActiveEntity", "EQ", null)
						],
						and: false
					});
				if (oBindingParams.filters[0] && oBindingParams.filters[0].aFilters) {
					var oSmartTableMultiFilter = oBindingParams.filters[0];
					oBindingParams.filters[0] = new Filter([oSmartTableMultiFilter, oOwnMultiFilter], true);
				} else {
					oBindingParams.filters.push(oOwnMultiFilter);
				}
			}
		}

		function fnSetAnalyticalBindingPath(oSmartFilterBar, fnSetBindingPath, sTemplateName){
			// still open
			// support for analytical parameters comming from the backend
			//Make sure views with paramters are working and change the tableBindingPath to the pattern parameterSet(params)/resultNavProp
			if (fnSetBindingPath && oSmartFilterBar && oSmartFilterBar.getAnalyticBindingPath && oSmartFilterBar.getConsiderAnalyticalParameters()) {
				//catching an exception if no values are yet set.
				//TODO: This event actually shoudn't be called before mandatory fields are populated
				try {
					var sAnalyticalPath = oSmartFilterBar.getAnalyticBindingPath();
					if (sAnalyticalPath) {
						fnSetBindingPath(sAnalyticalPath);
					}
				} catch (e) {
					jQuery.sap.log.warning("Mandatory parameters have no values", "", sTemplateName);
				}
			}
		}

		// add the expands derived from aPaths to aExpands
		function fnExpandOnNavigationProperty (sEntitySet, aPath, aExpands) {
			// check if any expand is neccessary
			for (var i = 0; i < aPath.length; i++) {
				var sPath = aPath[i];
				var iPos = sPath.lastIndexOf("/");
				var sNavigation;
				if (iPos < 0){ // sPath contains no / but still could be a navigationProperty
					if (oServices.oApplication.getNavigationProperty(sEntitySet, sPath)){
						sNavigation = sPath;
					} else {
						continue;
					}
				} else {
					sNavigation = sPath.substring(0, iPos);
				}
				if (aExpands.indexOf(sNavigation) === -1) {
					aExpands.push(sNavigation);
				}
			}
		}

		function onBeforeRebindTableOrChart(oEvent, oCallbacks, oSmartFilterBar){
			var oBindingParams = oEvent.getParameter("bindingParams"),
			sControlId = oEvent.getSource().getId();
			oBindingParams.parameters = oBindingParams.parameters || {};

			var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
			var vDraftStateSelected = oTemplatePrivateModel.getProperty("/listReport/vDraftState");
			var bOnlyActiveObjects = oTemplatePrivateModel.getProperty("/listReport/activeObjectEnabled");

			// Generic helper for extension functions
			var fnPerformExtensionFunction = function(sExtensionName, fnExtensionCallback, sControlId){
				if (oCallbacks && oCallbacks[sExtensionName]){
					var bIsAllowed = true; // check for synchronous calls
					var fnPerformExtensionCallback = function(){
						var oControllerExtension = arguments[0];
						if (!(oControllerExtension instanceof ControllerExtension)){
							throw new Error("Please provide a valid ControllerExtension in order to execute extension " + sExtensionName);
						}
						if (!bIsAllowed){
							throw new Error("Extension " + sExtensionName + " must be executed synchronously");
						}
						var aArgumentsWithoutFirst = Array.prototype.slice.call(arguments, 1); // use array function slice for array-like object arguments
						fnExtensionCallback.apply(null, aArgumentsWithoutFirst); // call fnExtensionCallback leaving out the first argument (the ControllerExtension)
					};
					oCallbacks[sExtensionName](fnPerformExtensionCallback, sControlId);
					bIsAllowed = false;
				}
			};

			// Begin: Filter handling
			var fnAddFilter = function(oFilter){
				if (!sControlId || oController.byId(sControlId) === oEvent.getSource()) {
					oBindingParams.filters.push(oFilter);
				}
			};
			// ALP does not deal with draft hence this is not required
			if ( (oController.getMetadata().getName() !== 'sap.suite.ui.generic.template.AnalyticalListPage.view.AnalyticalListPage') || (oController.getMetadata().getName() !== 'sap.suite.ui.generic.template.ObjectPage.view.Details') ) {
				if (vDraftStateSelected == "0" && oComponentUtils.isDraftEnabled()) {
					fnSetActiveObjectFilter(oBindingParams, bOnlyActiveObjects);
				} else {
					setEditStateFilter(oSmartFilterBar, oBindingParams);
				}
			}
			fnPerformExtensionFunction("addExtensionFilters", fnAddFilter, sControlId);
			// End Filter handling

			if (oController.getMetadata().getName() !== 'sap.suite.ui.generic.template.ObjectPage.view.Details') {
				fnSetAnalyticalBindingPath(oSmartFilterBar, oCallbacks.setBindingPath, oCallbacks.isAnalyticalListPage ? "AnalyticalListPage" : "ListReport");
			}

			var oSmartTableOrChart = oEvent.getSource();
			var sEntitySet = oSmartTableOrChart.getEntitySet();

			//--- begin: expand binding --------------------------------------------------------------------------------------
			var aSelects = oBindingParams.parameters.select && oBindingParams.parameters.select.split(",") || [];
			var aExpands = oBindingParams.parameters.expand && oBindingParams.parameters.expand.split(",") || [];

			// This function adds the given property sProperty to aSelect if it is not contained already. If sProperty is faulty, the function does nothing.
			var fnEnsureSelectionProperty = function(sProperty, sControlId){
				// check if the correct stable id if is passed or not
				if (sProperty && (!sControlId || oController.byId(sControlId) === oEvent.getSource())) {
					var aPropertyArray = sProperty.split(',');
					aPropertyArray.forEach(function (sElement) {
						if (sElement && jQuery.inArray(sElement, aSelects) === -1) {
							aSelects.push(sElement);
						}
					});
				}
			};
			// ALP has not been adding any mandatory filters and hence this is ignored
			if (!oCallbacks.isAnalyticalListPage) {
				fnHandleMandatorySelectionFields(sEntitySet, fnEnsureSelectionProperty);
			}

			// Allow extensions to (synchronously) ensure selection fields
			fnPerformExtensionFunction("ensureExtensionFields", fnEnsureSelectionProperty, sControlId);

			// Add fields specific to the control
			(oCallbacks.addNecessaryFields || jQuery.noop)(aSelects, fnEnsureSelectionProperty, sEntitySet);

			fnExpandOnNavigationProperty(sEntitySet, aSelects, aExpands);

			if (aExpands.length > 0) {
				oBindingParams.parameters.expand = aExpands.join(",");
			}
			if (aSelects.length > 0) {
				oBindingParams.parameters.select = aSelects.join(",");
			}
		}

		// End: helper functions for onBeforeRebindTable/Chart

		function formatDraftLockText(IsActiveEntity, HasDraftEntity, LockedBy) {
			if (!IsActiveEntity) {
				// current assumption: is my Draft as I don't see other's draft -> TODO: to be checked
				return getText("DRAFT_OBJECT");
			} else if (HasDraftEntity) {
				return getText(LockedBy ? "LOCKED_OBJECT" : "UNSAVED_CHANGES");
			} else {
				return ""; // not visible
			}
		}

		function getDraftPopover() {
			var oDraftPopover = getDialogFragment("sap.suite.ui.generic.template.fragments.DraftAdminDataPopover", {
				formatText: function() {
					var aArgs = Array.prototype.slice.call(arguments, 1);
					var sKey = arguments[0];
					if (!sKey) {
						return "";
					}
					if (aArgs.length > 0 && (aArgs[0] === null || aArgs[0] === undefined || aArgs[0] === "")) {
						if (aArgs.length > 3 && (aArgs[3] === null || aArgs[3] === undefined || aArgs[3] === "")) {
							return (aArgs.length > 2 && (aArgs[1] === null || aArgs[1] === undefined || aArgs[1] === ""))
									? ""
									: aArgs[2];
						} else {
							return getText(sKey, aArgs[3]);
						}
					} else {
						return getText(sKey, aArgs[0]);
					}
				},
				closeDraftAdminPopover: function() {
					oDraftPopover.close();
				},
				formatDraftLockText: formatDraftLockText
			}, "admin");
			return oDraftPopover;
		}

		function fnProcessDataLossConfirmationIfNonDraftImpl(fnProcessFunction, fnCancelFunction, oState, sMode, bNoBusyCheck, oEvent) {
			var oBusyHelper = oServices.oApplication.getBusyHelper();
			if (!bNoBusyCheck && oBusyHelper.isBusy()) {
				return; // do not navigate away from a page that is currently busy
			}
			// DataLost Popup only for Non-Draft
			if ( !oComponentUtils.isDraftEnabled() ) {
				//Test all registered UnsavedDataCheckFunctions
				var bHasExternalChanges = false;
				if (oState && oState.aUnsavedDataCheckFunctions){
					bHasExternalChanges = oState.aUnsavedDataCheckFunctions.some(function(fnUnsavedCheck) {
						return fnUnsavedCheck();
					});
				}
				var oView = oController.getView();
				var oModel = oView.getModel();
				if ( bHasExternalChanges || oModel.hasPendingChanges() ) {
					var oExecutionPromise;
					fnDataLossConfirmation(function() {
						oView.setBindingContext(null);
						oModel.resetChanges();
						oView.setBindingContext();
						//Notification for reuse components and extensions
						oComponentUtils.fire(oController, "AfterCancel", {});
						oExecutionPromise = fnProcessFunction();
					},	function(){
						oExecutionPromise = fnCancelFunction();
					}, sMode, oEvent);
					return oExecutionPromise;
				}
			}
			return fnProcessFunction();
		}

		function fnProcessDataLossTechnicalErrorConfirmation(fnProcessFunction, fnCancelFunction, oState, sMode) {
			//Test all registered UnsavedDataCheckFunctions
			var bHasExternalChanges = false;
			if (oState && oState.aUnsavedDataCheckFunctions){
				bHasExternalChanges = oState.aUnsavedDataCheckFunctions.some(function(fnUnsavedCheck) {
					return fnUnsavedCheck();
				});
			}
			if ( bHasExternalChanges || oController.getView().getModel().hasPendingChanges() ) {
				var oExecutionPromise;
				fnDataLossTechnicalErrorConfirmation(
						function() {
							oController.getView().getModel().resetChanges();
							//Notification for reuse components and extensions
							oComponentUtils.fire(oController, "AfterCancel", {});
							oExecutionPromise = fnProcessFunction();
						},
						function(){
							oExecutionPromise = fnCancelFunction();
						},
						sMode );
				return oExecutionPromise;
			}
			return fnProcessFunction();
		}

		function fnProcessDataLossConfirmationIfNonDraft(fnProcessFunction, fnCancelFunction, oState, sMode, bNoBusyCheck, oEvent){
			if (bNoBusyCheck){
				return fnProcessDataLossConfirmationIfNonDraftImpl(fnProcessFunction, fnCancelFunction, oState, sMode, true, oEvent);
			}
			oServices.oApplication.performAfterSideEffectExecution(fnProcessDataLossConfirmationIfNonDraftImpl.bind(null, fnProcessFunction, fnCancelFunction, oState, sMode, false, oEvent));
		}

		var fnOnDataLossConfirmed; // the current handler for data loss confirmation
		/*
		Shows DataLoss popup or Discard popover in NonDraft Applications
		onBack, a dataloss popup is shown and in case on onCancel discardPopover is shown. oEvent is passed to attach popover on Cancel button
		*/
		function fnDataLossConfirmation(onDataLossConfirmed, onDataLossCancel, sMode, oEvent) {
			// note that we must pass the event handler to a global variable, since always the version of onDataLossOK will be
			// executed which was created, when fnDataLossConfirmation was called for the first time
			// (see documentation of getDialogFragment).
			var oDataLossModel;
			fnOnDataLossConfirmed = onDataLossConfirmed;
			// if sMode or oEvent is undefined then show DataLoss Popup
			if (!sMode || !oEvent) {
				var oDataLossPopup = getDialogFragment("sap.suite.ui.generic.template.fragments.DataLoss", {
				onDataLossOK: function() {
					oDataLossPopup.close();
					fnOnDataLossConfirmed(); // call the version of onDataLossConfirmed which is currently valid
				},
				onDataLossCancel: function() {
					oDataLossPopup.close();
					onDataLossCancel();
				}
			}, "dataLoss");
			if (!sMode) {
				sMode = "LeavePage";
			}
			oDataLossModel = oDataLossPopup.getModel("dataLoss");
			oDataLossModel.setProperty("/mode", sMode);
			oDataLossPopup.open();
			} else { // if sMode is Proceed or LeavePage then show Popover
			var oDataLossPopover = getDialogFragment("sap.suite.ui.generic.template.fragments.DiscardDraftPopover", {
				onDiscardConfirm: function() {
					fnOnDataLossConfirmed();
				}
			}, "discard");
			oDataLossModel = oDataLossPopover.getModel("discard");
			oDataLossModel.setProperty("/placement", sap.m.PlacementType.Top);
			if (sMode !== "Proceed") {
				oDataLossModel.setProperty("/isCreateDraft", true);
			} else {
				oDataLossModel.setProperty("/isCreateDraft", false);
			}
			oDataLossModel.setProperty("/mode", sMode);
			oDataLossPopover.openBy(oEvent.getSource());
			}
		}

		var fnOnDataTechnicalErrorLossConfirmed; // the current handler for data loss confirmation
		function fnDataLossTechnicalErrorConfirmation(onDataTechnicalErrorLossConfirmed, onDataLossCancel, sMode) {

			fnOnDataTechnicalErrorLossConfirmed = onDataTechnicalErrorLossConfirmed;
			if (!sMode){
				sMode = "LeavePage";
			}
			var oDataLossPopup = getDialogFragment("sap.suite.ui.generic.template.fragments.DataLossTechnicalError", {
				onDataLossOK: function() {
					oDataLossPopup.close();
					fnOnDataTechnicalErrorLossConfirmed(); // call the version of onDataLossConfirmed which is currently valid
				},
				onDataLossCancel: function() {
					oDataLossPopup.close();
					onDataLossCancel();
				}
			}, "dataLoss");

			var oDataLossModel = oDataLossPopup.getModel("dataLoss");
			oDataLossModel.setProperty("/mode", sMode);
			oDataLossPopup.open();
		}

		function fnSecuredExecutionImpl(fnFunction, mParameters, oState, oBusyHelper, resolve, reject) {
			if (mParameters.busy.check && oBusyHelper.isBusy()) {
				reject();
				return;
			}

			// In case the app should be set busy we make sure that the corresponding busy session contains the call of fnFunction.
			// This way all transient messages which are added by fnFunction synchronously will be shown at the end of this busy session.
			var fnExecute1 = mParameters.busy.set ? function(){
				oBusyHelper.setBusy(Promise.resolve(), false, { actionLabel: mParameters.sActionLabel });
				return fnFunction();
			} : fnFunction;

			var fnExecute2 = mParameters.mConsiderObjectsAsDeleted ? function(oParameter){
				oServices.oApplication.prepareDeletion(mParameters.mConsiderObjectsAsDeleted);
				return fnExecute1();
			} : fnExecute1;

			var oPromise = (mParameters.dataloss.popup ? fnProcessDataLossConfirmationIfNonDraft(fnExecute2, reject,
				oState, (mParameters.dataloss.navigation ? "LeavePage" : "Proceed"), true) : fnExecute2());

			if (oPromise instanceof Promise) {
				oPromise.then(resolve, reject);
			} else {
				resolve();
			}
		}

		function fnSecuredExecution(fnFunction, mParameters, oState) {
			mParameters = jQuery.extend(true, {
				busy: {set: true, check: true},
				dataloss: {popup: true, navigation: false}
			}, mParameters);
			var oBusyHelper = oServices.oApplication.getBusyHelper();
			var oResultPromise = new Promise(function(resolve, reject) {
				oServices.oApplication.performAfterSideEffectExecution(fnSecuredExecutionImpl.bind(null, fnFunction, mParameters, oState, oBusyHelper, resolve, reject));
			});
			if (mParameters.busy.set) {
				oBusyHelper.setBusy(oResultPromise, false, { actionLabel: mParameters.sActionLabel });
			}
			return oResultPromise;
		}

		function getNavigationHandler() {
			oNavigationHandler = oNavigationHandler || new NavigationHandler(oController);
			return oNavigationHandler;
		}

		/*
		 * Visible property of toolbar buttons annotated with DataFieldForIntentBasedNavigation can be bound to certain paths in "_templPriv" Model during templating (see method buildVisibilityExprOfDataFieldForIntentBasedNaviButton in AnnotationHelper.js)
		 * The function checks if the navigation targets ( semanticObject+ action) are supported in the system and updates the corresponding paths of the model. Thus the visibility of buttons is updated.
		 */
		function fnCheckToolbarIntentsSupported(oSmartControl) {
			var oToolbar;
			var oTemplatePrivateModel = oComponentUtils.getTemplatePrivateModel();
			var oAppComponent, oXApplNavigation, oSupportedIntents, aToolbarContent, iButtonsNumber, aLinksToCheck = [], aInternalLinks = [], i, oCustomData, sSemObj, sAction, oLink, oInternalLink, oDeferredLinks;
			var iLinksNumber, oSemObjProp;
			oAppComponent = oController.getOwnerComponent().getAppComponent();
			oXApplNavigation = sap.ushell && sap.ushell.Container && sap.ushell.Container.getService && sap.ushell.Container.getService("CrossApplicationNavigation");
			oSupportedIntents = oTemplatePrivateModel.getProperty("/generic/supportedIntents/");
			//handle toolbar buttons
			if (isSmartChart(oSmartControl)) {
				oToolbar = oSmartControl.getToolbar();
			} else if (isSmartTable(oSmartControl)) {
				oToolbar = oSmartControl.getCustomToolbar();
			}
			aToolbarContent = oToolbar.getContent();
			iButtonsNumber = aToolbarContent.length;
			for (i = 0; i < iButtonsNumber; i++) {
				oCustomData = getElementCustomData(aToolbarContent[i]);
				if (oCustomData.hasOwnProperty("SemanticObject") && oCustomData.hasOwnProperty("Action")) {
					sSemObj = oCustomData.SemanticObject;
					sAction = oCustomData.Action;
					oLink = {
						semanticObject: sSemObj,
						action: sAction,
						ui5Component: oAppComponent
					};
					aLinksToCheck.push([oLink]);
					oInternalLink = jQuery.extend({}, oLink);
					oInternalLink.bLinkIsSupported = false;
					aInternalLinks.push(oInternalLink);
				}
			}

			if (aLinksToCheck.length > 0 && oXApplNavigation) {
				oDeferredLinks = oXApplNavigation.getLinks(aLinksToCheck);
				oDeferredLinks.done(function(aLinks) {
					oSupportedIntents = oTemplatePrivateModel.getProperty("/generic/supportedIntents/");
					iLinksNumber = aLinks.length;
					//entries in aLinks should correspond to aInternalLinks: if a link is not supported an empty object is returned by the method getLinks
					for (i = 0; i < iLinksNumber; i++) {
						if (aLinks[i][0].length > 0) {
							aInternalLinks[i].bLinkIsSupported = true;
						}
						// add the value to the model
						sSemObj = aInternalLinks[i].semanticObject;
						sAction = aInternalLinks[i].action;

						oSemObjProp = oTemplatePrivateModel.getProperty("/generic/supportedIntents/" + sSemObj);
						if (!oSemObjProp) {  // no semantic object in the model yet
							oSupportedIntents[sSemObj] = {};
							oSupportedIntents[sSemObj][sAction] =
							{
								"visible" :aInternalLinks[i].bLinkIsSupported
							};
						} else if (!oSemObjProp[sAction]) {  // no action in the model yet
							oSemObjProp[sAction] =
							{
								"visible" :aInternalLinks[i].bLinkIsSupported
							};
						} else {
							oSemObjProp[sAction]["visible"] = aInternalLinks[i].bLinkIsSupported;
						}
					}
					oTemplatePrivateModel.updateBindings();
				});
			}
		}

		function fnGetSelectionVariantFilters(oSmartTable, oSegButtonOrVariantSelectItem) {
			var aSelectionVariantFilters = [], oSelectionVariantPath;

			var sSelectionVariantPath = getElementCustomData(oSmartTable).variantAnnotationPath;
			if (!sSelectionVariantPath && oSegButtonOrVariantSelectItem) {
				sSelectionVariantPath = getElementCustomData(oSegButtonOrVariantSelectItem).variantAnnotationPath;
			}
			if (sSelectionVariantPath) {
				var oModel = oSmartTable.getModel();
				var oMetaModel = oModel.getMetaModel();
				var sEntitySet = oSmartTable.getEntitySet();
				var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
				var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
				var oVariant = oEntityType[sSelectionVariantPath];
				if (!oVariant) {
					return;
				}
				if (!oVariant.SelectOptions && oVariant.SelectionVariant) {
					// for SelectionPresentationVariants, make sure to refer to SelectionVariant
					oVariant = oVariant.SelectionVariant;
					if (oVariant.Path) {
						// resolve reference to SelectionVariant via path
						var sSelectionVariantPath = oVariant.Path.split("@")[1];
						oVariant = sSelectionVariantPath && oEntityType[sSelectionVariantPath];
					}
				}
				if (oVariant.AnnotationPath) {
					oSelectionVariantPath = oVariant.AnnotationPath.split("@")[1];
					oVariant = oEntityType[oSelectionVariantPath];
				}
				for (var i in oVariant.SelectOptions) {
					if (oVariant.SelectOptions[i].PropertyName) {
						var sPath = oVariant.SelectOptions[i].PropertyName.PropertyPath;
						for (var j in oVariant.SelectOptions[i].Ranges) {
							var oOperator = oVariant.SelectOptions[i].Ranges[j].Option;
							oOperator.EnumMember = oOperator.EnumMember.replace("com.sap.vocabularies.UI.v1.SelectionRangeOptionType/", "");
							var oValueLow = oVariant.SelectOptions[i].Ranges[j].Low;
							var oValueHigh = oVariant.SelectOptions[i].Ranges[j].High;
							var sKeyLow = Object.keys(oValueLow)[0];
							if (oValueHigh) {
								var sKeyHigh = Object.keys(oValueHigh)[0];
								aSelectionVariantFilters.push(new sap.ui.model.Filter(sPath, oOperator.EnumMember, oValueLow[sKeyLow], oValueHigh[sKeyHigh]));
							} else {
								aSelectionVariantFilters.push(new sap.ui.model.Filter(sPath, oOperator.EnumMember, oValueLow[sKeyLow]));
							}
						}
					}
				}
			}
			return aSelectionVariantFilters;
		}

		// Expose selected private functions to unit tests
		// etBreakoutActionsForTable
		/* eslint-disable */
		var getNavigationHandler = testableHelper.testable(getNavigationHandler, "getNavigationHandler");
		var fnFillEnabledMapForBreakoutActions = testableHelper.testable(fnFillEnabledMapForBreakoutActions, "fillEnabledMapForBreakoutActions");
		var getBreakoutActionIds = testableHelper.testable(getBreakoutActionIds, "getBreakoutActionIds");
		var getOwnerControl = testableHelper.testable(getOwnerControl, "getOwnerControl");
		var getSelectedContexts = testableHelper.testable(getSelectedContexts, "getSelectedContexts");
		/* eslint-enable */

		return {
			isSmartTable: isSmartTable,
			isSmartChart: isSmartChart,
			isUiTable: isUiTable,
			isAnalyticalTable: isAnalyticalTable,
			isTreeTable: isTreeTable,
			isMTable: isMTable,
			getPositionableControlId: getPositionableControlId,
			getCurrentEntitySetName: getCurrentEntitySetName,
			getMetaModelEntityType: getMetaModelEntityType,
			getText: getText,
			getContextText: getContextText,
			getNavigationHandler: getNavigationHandler,
			getNavigationKeyProperties: fnGetNavigationKeyProperties,
			mergeNavigationKeyPropertiesWithValues: fnMergeNavigationKeyPropertiesWithValues,

			executeGlobalSideEffect: function() {
				if (oComponentUtils.isDraftEnabled()) {
					var oView = oController.getView();
					oView.attachBrowserEvent(
							/* If the focus is on a button, enter can be used to press the button. In this case, the press event is triggered by the keydown,
							 * thus, to ensure side effect is executed before the handling of the button, we need to attach to the keydwon event (e.g. keyup would be
							 * too late).
							 */
							"keydown",
							function(oBrowserEvent) {
								var isSearchField = (oBrowserEvent.target.type === "search") ? true : false;
								var isTextArea = (oBrowserEvent.target.type === "textarea") ? true : false;
								// CTRL key is checked with the ENTER key as CTRL + ENTER is used as a shortcut for adding entries to a table
								if (oBrowserEvent.keyCode === 13 && oBrowserEvent.ctrlKey !== true && oView.getModel("ui").getProperty("/editable") && !isSearchField && !isTextArea) {
									//Getting the value of bForceGlobalRefresh from Manifest
									var oConfig = oController.getOwnerComponent().getAppComponent().getConfig();
									var bForceGlobalRefresh = oConfig.settings && oConfig.settings.forceGlobalRefresh;
									/* When editing data in a normal field (not a text area), the model change can also be triggered by enter. In case of a draft, the model
									 * change event triggers the merge. This has to happen before the global side effect (which actually refreshes all data, and otherwise would just
									 * override all changes). To ensure this, the side effect is postponed to the end of the thread (setTimeout).
									 * However, if the focus is on a button, this could lead to executing the press event handler before the side effect. To avoid this, we immediatly
									 * add a side effect promise to indicate that the side effect still has to run.
									 */
									var fnResolveSideEffectPromise;
									oServices.oApplication.addSideEffectPromise(new Promise(function(resolve){
										fnResolveSideEffectPromise = resolve;
									}));
									setTimeout(function(){
										var sideEffectPromise = oServices.oApplicationController.executeSideEffects(oView.getBindingContext(),null,null,bForceGlobalRefresh);
										sideEffectPromise.then(function(){
											fnResolveSideEffectPromise();
											setTimeout(function() {
												document.getElementById(oBrowserEvent.target.id).focus(); //set focus back to the selected field
											});
										});
									});
								}
							});
				}
			},
			setEnabledToolbarButtons: fnSetEnabledToolbarButtons,
			setEnabledFooterButtons: fnSetEnabledFooterButtons,
			fillEnabledMapForBreakoutActions: fnFillEnabledMapForBreakoutActions,
			getBreakoutActions: fnGetBreakoutActions,
			getSelectedContexts: getSelectedContexts,
			getSelectionPoints: getSelectionPoints,
			getDeleteRestrictions: fnGetDeleteRestrictions,

			setPrivateModelControlProperty: fnSetPrivateModelControlProperty,

			navigateFromListItem: fnNavigateFromListItem,
			navigateToContext: fnNavigateToContext,
			navigateExternal: fnNavigateExternal,
			semanticObjectLinkNavigation: fnSemanticObjectLinkNavigation,

			getSelectionVariantFilters: fnGetSelectionVariantFilters,

			getCustomData: function(oEvent) {
				var aCustomData = oEvent.getSource().getCustomData();
				var oCustomData = {};
				for (var i = 0; i < aCustomData.length; i++) {
					oCustomData[aCustomData[i].getKey()] = aCustomData[i].getValue();
				}
				return oCustomData;
			},

			onBeforeRebindTableOrChart: onBeforeRebindTableOrChart,

			formatDraftLockText: formatDraftLockText,

			showDraftPopover: function(oBindingContext, oTarget) {
				var oPopover = getDraftPopover();
				var oAdminModel = oPopover.getModel("admin");
				oAdminModel.setProperty("/IsActiveEntity", oBindingContext.getProperty("IsActiveEntity"));
				oAdminModel.setProperty("/HasDraftEntity", oBindingContext.getProperty("HasDraftEntity"));
				oPopover.bindElement({
					path: oBindingContext.getPath() + "/DraftAdministrativeData"
				});
				if (oPopover.getBindingContext()) {
					oPopover.openBy(oTarget);
				} else {
					oPopover.getObjectBinding().attachDataReceived(function() {
						oPopover.openBy(oTarget);
					});
					// Todo: Error handling
				}
			},

			// provide the density class that should be used according to the environment (may be "")
			getContentDensityClass: function() {
				return oServices.oApplication.getContentDensityClass();
			},

			// defines a dependency from oControl to the view
			attachControlToView: fnAttachControlToView,

			/**
			 *
			 * @function
			 * @name sap.suite.ui.generic.template.lib.CommonUtils.prototype.getSelectedContexts.getDialogFragment(sName,
			 *       oFragmentController, sModel)
			 * @param sName name of a fragment defining a dialog for the current view
			 * @param oFragmentController controller for the fragment containing event handlers and formatters used by the
			 *          fragment
			 * @param sModel optional, name of a model. If this parameter is truthy a JSON model with the given name will be
			 *          attached to the dialog
			 * @return an instance of the specififed fragment which is already attached to the current view. Note that each
			 *         fragment will only be instantiated once. Hence, when the method is called several times for the same
			 *         name the same fragment will be returned in each case. <b>Attention:</b> The parameters
			 *         <code>oFragmentController</code> and <code>sModel</code> are only evaluated when the method is
			 *         called for the first time for the specified fragment. Therefore, it is essential that the functions in
			 *         <code>oFragmentController</code> do not contain 'local state'.
			 */
			getDialogFragment: getDialogFragment,
			processDataLossConfirmationIfNonDraft: fnProcessDataLossConfirmationIfNonDraft,
			processDataLossTechnicalErrorConfirmation: fnProcessDataLossTechnicalErrorConfirmation,
			securedExecution: fnSecuredExecution,
			getOwnerControl: getOwnerControl,
			getTableBindingInfo: getTableBindingInfo,
			refreshSmartTable: fnRefreshSmartTable,
			refreshModel: fnRefreshModel,
			getElementCustomData: getElementCustomData,
			triggerAction: function(aContexts, sEntitySet, oCustomData, oControl, oState) {
				// Assuming that this action is triggered from an action inside a table row.
				// Also this action is intended for triggering an OData operation.
				// i.e: Action, ActionImport, Function, FunctionImport
				// We require some properties to be defined in the Button's customData:
				//   Action: Fully qualified name of an Action, ActionImport, Function or FunctionImport to be called
				//   Label: Used to display in error messages
				// Once the CRUDManager callAction promise is resolved, if we received a context back from the OData call
				// we check to see if the context that was sent (actionContext) and the context that is returned (oResponse.reponse.context).
				// If they are the same we do nothing. If they are different we trigger any required navigations and set the newly navigated
				// page to dirty using the setMeToDirty function of the NavigationController so as to enter into edit mode and set the page
				// to edit mode.
				fnProcessDataLossConfirmationIfNonDraft(function() {
					oServices.oCRUDManager.callAction({
						functionImportPath: oCustomData.Action,
						contexts: aContexts,
						sourceControl: oControl,
						label: oCustomData.Label,
						operationGrouping: "",
						navigationProperty: ""
					}).then(function(aResponses) {
						if (aResponses && aResponses.length > 0) {
							var oResponse = aResponses[0];

							if (oResponse.response && oResponse.response.context && (!oResponse.actionContext || oResponse.actionContext && oResponse.response.context.getPath() !== oResponse.actionContext.getPath())) {
								//Delaying the content call of the component that triggered the action as it is not needed immediately as we have already navigated to the other component.
								//We set the calling component to dirty which will trigger the refresh of the content once it is activated again.
								oServices.oApplication.getBusyHelper().getUnbusy().then(oServices.oViewDependencyHelper.setMeToDirty.bind(null, oController.getOwnerComponent(), sEntitySet));
							}
						}
					});
				}, jQuery.noop, oState, "Proceed");
			},
			checkToolbarIntentsSupported: fnCheckToolbarIntentsSupported,
			getControlInformation: getControlInformation,
			executeForAllInformationObjects: fnExecuteForAllInformationObjects,
			focusControl: focusControl
		};
	}

	return BaseObject.extend("sap.suite.ui.generic.template.lib.CommonUtils", {
		constructor: function(oController, oServices, oComponentUtils) {

			jQuery.extend(this, getMethods(oController, oServices, oComponentUtils));
		}
	});
});
