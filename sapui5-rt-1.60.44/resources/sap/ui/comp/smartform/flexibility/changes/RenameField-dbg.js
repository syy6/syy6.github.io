/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define(['sap/ui/fl/changeHandler/BaseRename', "sap/ui/fl/Utils"], function(BaseRename, Utils) {
	"use strict";

	var PROPERTY_NAME = "label";
	var CHANGE_PROPERTY_NAME = "fieldLabel";
	var TT_TYPE = "XFLD";

	/**
	 * Change handler for renaming a smart form group element.
	 * @constructor
	 * @alias sap.ui.fl.changeHandler.RenameField
	 * @author SAP SE
	 * @version 1.60.42
	 * @experimental Since 1.27.0
	 */
	var RenameField = BaseRename.createRenameChangeHandler({
		changePropertyName : CHANGE_PROPERTY_NAME,
		translationTextType : TT_TYPE
	});

	/**
	 * Renames a SmartField.
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object with instructions to be applied on the control map
	 * @param {sap.ui.core.Control|Element} oControl Control that matches the change selector for applying the change
	 * @param {object} mPropertyBag property bag
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be applied
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @returns {boolean} true if successful
	 * @public
	 */
	RenameField.applyChange = function(oChange, oControl, mPropertyBag) {
		var oModifier = mPropertyBag.modifier;
		var oChangeDefinition = oChange.getDefinition();
		var sText = oChangeDefinition.texts[CHANGE_PROPERTY_NAME];
		var sValue = sText.value;

		if (oChangeDefinition.texts && sText && typeof (sValue) === "string") {
			var sPrevious = this.setLabelPropertyOnControl(oControl, sValue, oModifier, PROPERTY_NAME);
			oChange.setRevertData(sPrevious);
			return true;

		} else {
			Utils.log.error("Change does not contain sufficient information to be applied: [" + oChangeDefinition.layer + "]" + oChangeDefinition.namespace + "/" + oChangeDefinition.fileName + "." + oChangeDefinition.fileType);
			//however subsequent changes should be applied
		}
	};

	/**
	 * Reverts a rename change on a SmartField.
	 *
	 * @param {sap.ui.fl.Change} oChange change wrapper object applied on the control
	 * @param {sap.ui.core.Control|Element} oControl Control that matches the change selector for reverting the change
	 * @param {object} mPropertyBag property bag
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} mPropertyBag.modifier - modifier for the controls
	 * @param {sap.ui.core.UIComponent} mPropertyBag.appComponent - component in which the change should be reverted
	 * @param {object} mPropertyBag.view - view object or xml element representing an ui5 view
	 * @returns {boolean} true if successful
	 * @public
	 */
	RenameField.revertChange = function(oChange, oControl, mPropertyBag) {
		var sOldText = oChange.getRevertData();
		if (sOldText || sOldText === "") {
			var oModifier = mPropertyBag.modifier;
			if (sOldText === "$$Handled_Internally$$") {
				sOldText = undefined;
			}
			this.setLabelPropertyOnControl(oControl, sOldText, oModifier, PROPERTY_NAME);
			oChange.resetRevertData();
			return true;
		} else {
			Utils.log.error("Change doesn't contain sufficient information to be reverted. Most Likely the Change didn't go through applyChange.");
		}
	};

	/**
	 * Sets label property on a passed GroupElement.
	 * If this logic changes, also adapt the CombineFields change handler!
	 *
	 * @param {sap.ui.core.Control|Element} oControl Control that matches the change selector for reverting the change
	 * @param {string} sValue - Value that needs to be set
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} oModifier - modifier for the controls
	 * @param {string} sPropertyName - Label property name
	 * @returns {string} sPrevious - Previously set value
	 * @private
	 */
	RenameField.setLabelPropertyOnControl = function(oControl, sValue, oModifier, sPropertyName) {
		// The value can be a binding - e.g. for translatable values in WebIde
		// In order to properly save the undo, the label "text" property also needs to be set
		var sGetterMethodName = "getProperty";
		var vLabel = oModifier[sGetterMethodName](oControl, sPropertyName);
		var sSetterMethodName;
		var sPrevious;
		if (Utils.isBinding(sValue)) {
			sSetterMethodName = "setPropertyBinding";
			sGetterMethodName = "getPropertyBinding";
		} else {
			sSetterMethodName = "setProperty";
		}

		if (vLabel && (typeof vLabel !== "string")){
			sPrevious = oModifier[sGetterMethodName](vLabel, "text");
			oModifier[sSetterMethodName](vLabel, "text", sValue);
		} else {
			sPrevious = oModifier[sGetterMethodName](oControl, sPropertyName);
			oModifier[sSetterMethodName](oControl, sPropertyName, sValue);
		}
		return sPrevious ? sPrevious : "$$Handled_Internally$$";
	};

	/**
	 * Gets label property on a passed GroupElement.
	 * If this logic changes, also adapt the CombineFields change handler!
	 *
	 * @param {sap.ui.core.Control|Element} oControl Control that matches the change selector for reverting the change
	 * @param {sap.ui.core.util.reflection.BaseTreeModifier} oModifier - modifier for the controls
	 * @param {string} sPropertyName - Label property name
	 * @returns {string} sPrevious - Previously set value
	 * @private
	 */
	RenameField.getPreviousLabelPropertyOnControl = function(oControl, oModifier, sPropertyName) {
		//Binding???
		var vLabel = oModifier.getProperty(oControl, sPropertyName);
		var sPrevious;

		if (vLabel && (typeof vLabel !== "string")){
			sPrevious = oModifier.getProperty(vLabel, "text");
		} else {
			sPrevious = oModifier.getProperty(oControl, sPropertyName);
		}
		return sPrevious ? sPrevious : "$$Handled_Internally$$";
	};
	return RenameField;
},
/* bExport= */true);
