sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/generic/template/js/AnnotationHelper"
], function(jQuery, AnnotationHelper) {
	"use strict";

	var LINEITEM = "com.sap.vocabularies.UI.v1.LineItem";
	var DATAFIELDFORANNOTATION = "com.sap.vocabularies.UI.v1.DataFieldForAnnotation";
	var DATAFIELDFORACTION = "com.sap.vocabularies.UI.v1.DataFieldForAction";
	var INTENTBASEDNAV = "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation";
	var FORINTENTBASEDNAV = "com.sap.vocabularies.UI.v1.DataFieldForIntentBasedNavigation";
	var FIELDGROUP = "com.sap.vocabularies.UI.v1.FieldGroup";
	var IDENTIFICATION = "com.sap.vocabularies.UI.v1.Identification";
	var SELECTIONFIELDS = "com.sap.vocabularies.UI.v1.SelectionFields";
	var ChangeHandlerUtils = {};
	var oMetaModel; // MetaModel mit Fortschreibung der Änderung an Annotations

	// TODO check if old reveal/revert logic is correct or can be improved
	ChangeHandlerUtils.isReveal = false;
	ChangeHandlerUtils.isRevert = false;

	ChangeHandlerUtils.getMetaModel = function(oSpecificChangeInfo, mPropertyBag) {
		if (oMetaModel) {
			return oMetaModel;
		}
		oMetaModel = {};
		var sId = (oSpecificChangeInfo.source && oSpecificChangeInfo.source.id)
			|| oSpecificChangeInfo.parentId // for addColumn, source.id does not exist, so use parentId (to be verified)
			|| (oSpecificChangeInfo.removedElement && oSpecificChangeInfo.removedElement.id) // for removeFilterItem, source.id does not exist, so use removedElement.id (to be verified)
			|| (oSpecificChangeInfo.selector && oSpecificChangeInfo.selector.id); // for addToolbarActionButton, use selector.id (settings handler workaround)
		jQuery.extend(true, oMetaModel, mPropertyBag.modifier.bySelector(sId, mPropertyBag.appComponent).getModel().getMetaModel());
		return oMetaModel;
	};

	/**
	 * Retrieves the UIComponent component from a given ManagedObject instance
	 *
	 * @param {sap.ui.core.ManagedObject} oManagedObject The managed object
	 * @returns {sap.ui.core.UIComponent}  The UI5 component of the element
	 * @public
	 */
	ChangeHandlerUtils.getComponent = function(oManagedObject) {
		var oComponent;

		while (oManagedObject) {
			if (oManagedObject instanceof sap.ui.core.mvc.View) {
				oComponent = oManagedObject.getController().getOwnerComponent();
				break;
			} else if (oManagedObject instanceof sap.ui.core.UIComponent) {
				oComponent = oManagedObject;
				break;
			}
			if (oManagedObject.getParent) {
				oManagedObject = oManagedObject.getParent();
			} else {
				break;
			}
		}
		return oComponent;
	};

	/**
	 * Retrieves the OData entity set of a given SAPUI5 component from the MetaModel
	 *
	 * @param {sap.ui.core.UIComponent} oComponent The SAPUI5 component
	 * @returns {string} The name of the entity set
	 * @public
	 */
	ChangeHandlerUtils.getODataEntitySet = function(oComponent) {
		var oModel = oComponent.getModel();
		var sEntitySet = oModel && oComponent.getEntitySet && oComponent.getEntitySet();
		var oMetaModel = oModel && oModel.getMetaModel();

		return sEntitySet && oMetaModel.getODataEntitySet(sEntitySet);
	};

	/**
	 * Retrieves the OData entity type of the given element (or a parent element), as registered in the MetaModel
	 *
	 * @param {sap.ui.core.UIComponent} oElement The SAPUI5 component
	 * @returns {string} The name of the entityType
	 * @public
	 */
	ChangeHandlerUtils.getEntityType = function(oElement) {
		var sEntityType;
		if (oElement) {
			if (oElement.getEntityType) {
				sEntityType = oElement.getEntityType();
			} else {
				var oComponent = ChangeHandlerUtils.getComponent(oElement);
				var sEntitySet = oComponent && oComponent.getEntitySet();
				var oMetaModel = oElement.getModel().getMetaModel();
				var oEntitySet = sEntitySet && oMetaModel && oMetaModel.getODataEntitySet(sEntitySet);
				sEntityType = oEntitySet && oEntitySet.entityType;
			}
		}

		return sEntityType;
	};

	/**
	 * Retrieves the OData entityType object of a given SAPUI5 element from the MetaModel
	 *
	 * @param {sap.ui.core.ManagedObject} oManagedObject The SAPUI5 ManagedObject
	 * @returns {object} oDataEntityType The entity type object
	 * @public
	 */
	ChangeHandlerUtils.getODataEntityType = function(oManagedObject) {
		var oDataEntityType;
		if (oManagedObject) {
			var oComponent = ChangeHandlerUtils.getComponent(oManagedObject);
			var sEntitySet = oComponent && oComponent.getEntitySet();
			var oModel = oManagedObject.getModel();
			var oCurrentMetaModel = oModel && oModel.getMetaModel();

			if (oCurrentMetaModel) {
				var oEntitySet = oCurrentMetaModel.getODataEntitySet(sEntitySet);
				var sEntityType = oEntitySet && oEntitySet.entityType;
				oDataEntityType = oCurrentMetaModel.getODataEntityType(sEntityType);
			}
		}

		return oDataEntityType;
	};

	/**
	 * Determines the UI.ReferenceFacet (group) and UI.CollectionFacet (form) record in the UI.Facets term for a given Group element.
	 *
	 * @param {String} sGroupId The string formed from Group element's id to uniquely identify corresponding annotation term.
	 * @param {Object[]} aFacets The UI.Facets annotation term.
	 * @returns {Object} The corresponding UI.ReferenceFacet (oGroup) and UI.CollectionFacet (oForm) record.
	 * @public
	 */
	ChangeHandlerUtils.getSmartFormGroupInfo = function(sGroupId, aFacets){
		var oFacet, oFormInfo, sId;
		for ( var i = 0; i < aFacets.length; i++ ) {
			oFacet = aFacets[i];
			if (oFacet && oFacet.Facets) {
				oFormInfo = ChangeHandlerUtils.getSmartFormGroupInfo(sGroupId, oFacet.Facets);
				if (oFormInfo) {
					return oFormInfo;
				}
			} else if (oFacet && oFacet.Target && oFacet.Target.AnnotationPath &&
				(oFacet.Target.AnnotationPath.indexOf(FIELDGROUP) >= 0) ||
				(oFacet.Target.AnnotationPath.indexOf(IDENTIFICATION) >= 0)) {
				sId = (oFacet.ID && oFacet.ID.String) || oFacet.Target.AnnotationPath;
				if (sId === sGroupId) {
					return {
						aForm: aFacets,
						oGroup: oFacet
					};
				}
			}
		}
	};

	/**
	 * Determines the UI.CollectionFacet record in the UI.Facets term for a given SmartForm element.
	 *
	 * @param {String} sSmartFormId The string formed from SmartForm element's id to uniquely identify corresponding annotation term.
	 * @param {Object[]} aFacets The UI.Facets annotation term.
	 * @returns {Object} The corresponding UI.CollectionFacet record.
	 * @public
	 */
	ChangeHandlerUtils.getCollectionFacet = function(sSmartFormId, aFacets){
		var oFacet;
		for ( var i = 0; i < aFacets.length; i++ ) {
			oFacet = aFacets[i];
			if (oFacet && oFacet.ID && oFacet.ID.String === sSmartFormId) {
				return oFacet;
			} else if (oFacet && oFacet.Facets) {
				var oCollectionFacet = ChangeHandlerUtils.getCollectionFacet(sSmartFormId, oFacet.Facets);
				if (oCollectionFacet){
					return oCollectionFacet;
				}
			}
		}
	};

	/**
	 * Dynamically creates the ID of the new field group being added with prefix RTAGroup
	 *
	 * @param {Object} Entity Type
	 * @returns {String} The generated field group ID.
	 * @public
	 */
	ChangeHandlerUtils.createFieldGroupTerm = function(oEntityType){
		var sFieldGroupTerm = "com.sap.vocabularies.UI.v1.FieldGroup#RTAGroup";
		var iMaxValue = -1;
		for (var i in oEntityType){
			if (i.indexOf(sFieldGroupTerm) > -1 && i.indexOf("RTAGroup") > -1){
				var sIndex = i.substring(sFieldGroupTerm.length);
				var iIndex = parseInt(sIndex, 10);
				iMaxValue = Math.max(iIndex, iMaxValue);
			}
		}
		iMaxValue++;
		return sFieldGroupTerm + iMaxValue;
	};

	/**
	 * Retrieves the control configuration from the vertical layout that is associated with a selection field
	 *
	 * @param {sap.ui.layout.VerticalLayout} oVerticalLayout The instance of SAP UI5 VerticalLayout
	 * @returns {object} The control configurations of the smart filterbar that corresponds to the given vertical layout
	 * @public
	 */
	ChangeHandlerUtils.getSmartFilterBarControlConfiguration = function(oVerticalLayout) {
		var sId = oVerticalLayout.getContent()[0].getId();
		var sFilterKey = sId.substring(sId.lastIndexOf("-") + 1);
		var oSmartFilterBar = ChangeHandlerUtils.findSmartFilterBar(oVerticalLayout);
		var oCtrlConf = oSmartFilterBar.getControlConfiguration().filter(function(ctrlConf) {
			return ctrlConf.getKey() === sFilterKey;
		})[0];
		return oCtrlConf;
	};

	/**
	 * Retrieves the SmartFilterBar control for a given (child) element
	 *
	 * @param {sap.ui.core.Element} oElement The SAP UI5 element
	 * @returns {sap.ui.comp.smartfilterbar.SmartFilterBar} The SmartFilterBar
	 * @public
	 */
	ChangeHandlerUtils.findSmartFilterBar = function(oElement){
		if (!oElement) {
			return;
		}
		if (oElement.getMetadata().getName() === "sap.ui.comp.smartfilterbar.SmartFilterBar"){
			return oElement;
		} else {
			return ChangeHandlerUtils.findSmartFilterBar(oElement.getParent());
		}
	};

	/**
	 Determines the index of a control in oDataModel
	 @param {object[]} oControl Control whose index has to be determined
	 @returns {integer} The index of the control in the ODataMetaModel
	 */
	ChangeHandlerUtils.getIndexFromInstanceMetadataPath = function(oControl){
		var iRecordIndex = -1;
		var oTemplInfo = ChangeHandlerUtils.getTemplatingInfo(oControl);
		if (oTemplInfo && oTemplInfo.path) {
			iRecordIndex = parseInt(oTemplInfo.path.substring(oTemplInfo.path.lastIndexOf("/") + 1), 10);
		}
		return iRecordIndex;
	};

	/**
	 * Transforms the array of custom data objects into one object with key/value pairs
	 * @param {sap.ui.core.Element} oElement The SAP UI5 element
	 * @returns {object} Object comprising all custom data as key/value pairs
	 * @public
	 */
	ChangeHandlerUtils.getCustomDataObject = function(oElement) {
		var aCustomData = oElement.getCustomData(),
			oCustomData = {};
		if (!aCustomData) {
			return;
		}
		for (var i = 0; i < aCustomData.length; i++) {
			oCustomData[aCustomData[i].getKey()] = aCustomData[i].getValue();
		}
		return oCustomData;
	};

	/**
	 * Retrieves the lineItem collection from the ODataMetaModel for a given element.
	 *
	 * @param {sap.ui.core.Element} oElement The SAP UI5 element
	 * @returns {object[]} The list of records of the line item collection
	 * @public
	 */
	ChangeHandlerUtils.getLineItems = function(oElement) {
		var oComponent = ChangeHandlerUtils.getComponent(oElement);
		var oEntityType = oComponent && ChangeHandlerUtils.getODataEntityType(oComponent);

		return oEntityType && oEntityType[LINEITEM];
	};

	/**
	 * Determines the index of a lineItem record in the ODataMetaModel for a given table column.
	 *
	 * @param {sap.m.Column} oColumn Column of a List Report table
	 * @param {object[]} aLineItems The list of records of the line item collection
	 *                  (can be determined by calling getLineItems before)
	 * @returns {integer} The index of the record in the ODataMetaModel
	 * @public
	 */
	ChangeHandlerUtils.getLineItemRecordIndex = function(oColumn, aLineItems) {
		if (!oColumn) {
				return;
			}
			if (!aLineItems) {
			aLineItems = ChangeHandlerUtils.getLineItems(oColumn);
		}
		if (!aLineItems) {
			return;
		}
		var iRecordIndex = -1,
			i,
			oP13nValue = oColumn.data("p13nData");

		if (!oP13nValue || !aLineItems || aLineItems.length === 0) {
			return iRecordIndex;
		}
		if (!oP13nValue.columnKey || oP13nValue.columnKey.search("template::") === -1) {
			// it is no template, take columnKey as is
			for (i = 0; i <  aLineItems.length; i++) {
				if (aLineItems[i].Value && aLineItems[i].Value.Path === oP13nValue.leadingProperty) {
					return i;
				}
			}
			return iRecordIndex;
		}
		var aTemplate = oP13nValue.columnKey.split("::");
		switch (aTemplate[1]) {
			case "DataFieldForAction":
				for (i = 0; i <  aLineItems.length; i++) {
					if (aLineItems[i].RecordType === DATAFIELDFORACTION && aLineItems[i].Action.String === aTemplate[2]) {
						return i;
					}
				}
				break;
			case "DataFieldForAnnotation":
				for (i = 0; i <  aLineItems.length; i++) {
					if (aLineItems[i].RecordType === DATAFIELDFORANNOTATION && aLineItems[i].Target
						&& aLineItems[i].Target.AnnotationPath
						&& aLineItems[i].Target.AnnotationPath.replace("@", "") === aTemplate[2]) {
						return i;
					}
				}
				break;
			case "DataFieldWithIntentBasedNavigation":
				for (i = 0; i <  aLineItems.length; i++) {
					if (aLineItems[i].RecordType === INTENTBASEDNAV && aLineItems[i].SemanticObject.String === aTemplate[2]
						&& aLineItems[i].Action.String === aTemplate[3]) {
						return i;
					}
				}
				break;
			default:
				for (i = 0; i <  aLineItems.length; i++) {
					if (aLineItems[i].Value && aLineItems[i].Value.Path === oP13nValue.leadingProperty) {
						return i;
					}
				}
				break;
		}
		return iRecordIndex;
	};

	/**
	 * Determines the index of a lineItem record in the ODataMetaModel for a given table toolbar button.
	 *
	 * @param {sap.m.Button} oButton Button of a List Report table toolbar
	 * @param {object[]} aLineItems The list of records of the line item collection
	 *                  (can be determined by calling getLineItems before)
	 * @returns {integer} The index of the record in the ODataMetaModel
	 * @public
	 */
	ChangeHandlerUtils.getLineItemRecordIndexForButton = function(oButton, aLineItems) {
		if (!aLineItems) {
			aLineItems = ChangeHandlerUtils.getLineItems(oButton);
		}
		if (!aLineItems) {
			return;
		}
		var oCustomData = ChangeHandlerUtils.getCustomDataObject(oButton),
			lineItemIndex = -1,
			oEntry;

		for (var i = 0; i < aLineItems.length; ++i) {
			oEntry = aLineItems[i];
			if (oEntry.RecordType === DATAFIELDFORACTION &&
				oEntry.Action && oEntry.Action.String === oCustomData.Action ||
				oEntry.RecordType === FORINTENTBASEDNAV &&
				oEntry.Action && oEntry.Action.String === oCustomData.Action &&
				oEntry.SemanticObject && oEntry.SemanticObject.String === oCustomData.SemanticObject) {

				lineItemIndex = i;
				break;
			}
		}

		return lineItemIndex;
	};

	/**
	 * Determines the index of a record in the ODataMetaModel for a given selection field.
	 *
	 * @param {sap.ui.layout.VerticalLayout} oVerticalLayout The selection field, represented by the selectable
	 * element which is the vertical layout.
	 * @returns {integer} The index of the record in the ODataMetaModel
	 * @public
	 */
	ChangeHandlerUtils.getRecordIndexForSelectionField = function(oVerticalLayout) {
		var iTargetIndex = -1,
			sEntityType = oVerticalLayout.getParent().getParent().getEntityType(),
			oMetaModel = oVerticalLayout.getModel().getMetaModel(),
			oEntityType = oMetaModel.getODataEntityType(sEntityType),
			aSelectionFields = oEntityType && oEntityType[SELECTIONFIELDS];

		var oTemplData = ChangeHandlerUtils.getTemplatingInfo(ChangeHandlerUtils.getSmartFilterBarControlConfiguration(oVerticalLayout));
		if (oTemplData && oTemplData.annotation === SELECTIONFIELDS) {
			aSelectionFields.some(function(oEntry, i) {
				if (oEntry.PropertyPath === oTemplData.value) {
					iTargetIndex = i;
					return true;
				}
			});
		}
		return iTargetIndex;
	};

	/**
	 * Determines the record of a lineItem collection in the ODataMetaModel for a given toolbar button.
	 *
	 * @param {object} oButton Toolbar button of a List Report table
	 * @returns {object} The record of the ODataMetaModel
	 * @public
	 */
	ChangeHandlerUtils.getLineItemRecordForButton = function(oButton) {
		// goal: to be generalized, to work for any type of collection
		var aLineItems = ChangeHandlerUtils.getLineItems(oButton);
		if (!aLineItems) {
			return;
		}
		var iLineItemRecordIndex = ChangeHandlerUtils.getLineItemRecordIndexForButton(oButton, aLineItems);
		return aLineItems[iLineItemRecordIndex];
	};

	/**
	 * Determines the record of a lineItem collection in the ODataMetaModel for a given table column.
	 *
	 * @param {sap.m.Column} oColumn Column of a List Report table
	 * @returns {object} The record of the ODataMetaModel
	 * @public
	 */
	ChangeHandlerUtils.getLineItemRecordForColumn = function(oColumn) {
		// goal: to be generalized, to work for any type of collection
		var aLineItems = ChangeHandlerUtils.getLineItems(oColumn);
		if (!aLineItems) {
			return;
		}
		var iLineItemRecordIndex = ChangeHandlerUtils.getLineItemRecordIndex(oColumn, aLineItems);
		return aLineItems[iLineItemRecordIndex];
	};

	/**
	 * Retrieves the templating info object (if existant) for an element.
	 * The templating info is contained in an element's custom data.
	 * This object is currently only available for a controlConfiguration element in the SmartFilterBar.
	 *
	 * @param {object} oElement The UI5 element
	 * @returns {object} The templating info object
	 * @public
	 */
	ChangeHandlerUtils.getTemplatingInfo = function(oElement) {
		// goal: to be generalized, to work for any type of collection
		var oTemplData;
		if (oElement) {
			var sTemplData = oElement.data("sap-ui-custom-settings")
				&& oElement.data("sap-ui-custom-settings")["sap.ui.dt"]
				&& oElement.data("sap-ui-custom-settings")["sap.ui.dt"].annotation;
			if (sTemplData) {
				oTemplData = JSON.parse(sTemplData);
			}
		}

		return oTemplData;
	};

	/**
	 * Retrieves the property of a column from the p13n data
	 *
	 * @param {sap.m.Column} oColumn The instance of sap.m.Column
	 * @returns {string} The property that is represented by the column
	 * @public
	 */
	ChangeHandlerUtils.getPropertyOfColumn = function(oColumn) {
		var oP13nValue = oColumn.data("p13nData"),
			sProperty = oP13nValue && oP13nValue.leadingProperty;

		return sProperty;
	};

	/**
	 * Retrieves the ODataPath of a given element.
	 * The ODataPath is needed for addressing the element in the ODataMetamodel.
	 * The function delegates to specific functions of the designtime when needed
	 *
	 * @param {object} oOverlay The element overlay
	 * @param {object} oAnnotation (optional) The specific annotation definition from the designtime metadata
	 *                 Optional, as we consider the annotation from the instance specific metadata first.
	 *                 oAnnotation will be added afterwards, if passed, and if the annotation has a target.
	 * @returns {string} The OData path
	 * @public
	 */
	ChangeHandlerUtils.getODataPath = function(oOverlay, oAnnotation) {

		var sODataPath,
			iTargetIndex = -1,
			oCommonInstanceData,
			oElement = oOverlay.getElement(),
			oMetaModel = oElement.getModel().getMetaModel(),
			oDesigntimeMetadata = oOverlay.getDesignTimeMetadata() && oOverlay.getDesignTimeMetadata().getData();

		if (oDesigntimeMetadata && jQuery.isFunction(oDesigntimeMetadata.getCommonInstanceData)) {
			oCommonInstanceData = oDesigntimeMetadata.getCommonInstanceData(oElement);
		}
		if (!oCommonInstanceData) {
			if (!oAnnotation || !oAnnotation.target) {
				return;
			}
			for (var i = 0; i < oAnnotation.target.length; i++) {
				if (oAnnotation.target[i] === "EntityType") {
					iTargetIndex = i;
					break;
				} else if (oAnnotation.target[i] === "EntitySet") {
					iTargetIndex = i;
					// don't break but further look for EntityType
				}
			}
			if (iTargetIndex > -1) {
				var sEntityType = ChangeHandlerUtils.getEntityType(oElement);

				if (!oMetaModel.getODataEntityType) {
					return;
				}
				var oEntityType = oMetaModel.getODataEntityType(sEntityType);

				switch (oAnnotation.target[iTargetIndex]) {
					case "EntityType":
						sODataPath = oEntityType && oEntityType.namespace + "." + oEntityType.name;
						break;

					case "EntitySet":
						var oComponent = ChangeHandlerUtils.getComponent(oElement);
						var oEntitySet = ChangeHandlerUtils.getODataEntitySet(oComponent);
						var sEntitySet = oEntitySet && oEntitySet.name;
						sODataPath = oEntityType && oEntityType.namespace + "." + sEntitySet;
						break;
					default:
						return; // we need instance specific metadata here!
				}
			}
		} else {
			sODataPath = oCommonInstanceData.target;
		}
		if (sODataPath && oAnnotation && oAnnotation.target) {
			sODataPath += "/" + oAnnotation.namespace + "." + oAnnotation.annotation;
		}
		return sODataPath;
	};

	/**
	 * Determines the EntityType from a given AnnotationPath.
	 *
	 * @param {object} oElement The SAPUI5 Element.
	 * @param {string} sAnnotationPath The AnnotationPath.
	 * @returns {object} The EntityType object.
	 * @public
	 */

	ChangeHandlerUtils.getEntityTypeFromAnnotationPath = function (oElement, sAnnotationPath) {
		var oEntityType,
			sEntityType,
			oEntitySet;

		if (!oElement || !sAnnotationPath) {
			return oEntityType;
		}
		var oMetaModel = oElement.getModel() && oElement.getModel().getMetaModel();

		if (!oMetaModel) {
			return oEntityType;
		}

		// Consider navigation paths
		if (sAnnotationPath.search("/") === -1) {
			oEntityType = ChangeHandlerUtils.getODataEntityType(oElement);
		} else {
			oEntitySet = ChangeHandlerUtils.getODataEntitySet(ChangeHandlerUtils.getComponent(oElement));
			sEntityType = AnnotationHelper.getTargetEntitySet(oMetaModel, oEntitySet, sAnnotationPath).entityType;
			oEntityType = oMetaModel.getODataEntityType(sEntityType);
		}

		return oEntityType;
	};

	return ChangeHandlerUtils;
});
