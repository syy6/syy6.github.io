/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	'./ConditionModelPropertyBinding',
	'sap/ui/model/json/JSONModel',
	'sap/ui/model/Filter',
	'sap/ui/model/ChangeReason',
	'sap/ui/mdc/base/FilterOperatorConfig',
	'sap/base/util/merge',
	'sap/base/util/deepEqual',
	'sap/base/Log'
],
	function(
			ConditionModelPropertyBinding,
			JSONModel,
			Filter,
			ChangeReason,
			FilterOperatorConfig,
			merge,
			deepEqual,
			Log
		) {
		"use strict";

		/**
		 *
		 * @class JSON based Model for sap.ui.mdc.base.FilterField controls. The model stores the entered values as condition objects and applies the conditions to the ListBinding of e.g. a table.
		 * @extends sap.ui.model.json.JSONModel
		 *
		 * @author SAP SE
		 * @version 1.60.42
		 * @since 1.48.0
		 * @alias sap.ui.mdc.base.ConditionModel
		 *
		 * @private
		 * @experimental
		 * @sap-restricted
		 */
		var ConditionModel = JSONModel.extend("sap.ui.mdc.base.ConditionModel", {
			constructor: function() {
				JSONModel.apply(this, arguments);
				this.setSizeLimit(1000);

				this._oMessageBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");
				sap.ui.getCore().attachLocalizationChanged(function() {
					this._oMessageBundle = sap.ui.getCore().getLibraryResourceBundle("sap.ui.mdc");
				}.bind(this));

				if (!this.getProperty("/conditions")) { // might already be initialized in the constructor
					this.setProperty("/conditions", {});
				}
				if (!this.getProperty("/fieldPath")) {
					this.setProperty("/fieldPath", {});
				}

				// map to store added FilterField instance
				this._mFieldPath = {};
			}
		});

		ConditionModel.prototype.bindProperty = function(sPath, oContext, mParameters) {

			if (sPath.startsWith("/conditions/")) {
				var sFieldPath = sPath.slice(12);
				sFieldPath = _escapeFieldPath.call(this, sFieldPath);
				sPath = "/conditions/" + sFieldPath;
			}

			var oBinding = new ConditionModelPropertyBinding(this, sPath, oContext, mParameters);
			return oBinding;
		};

		ConditionModel.prototype.getContext = function(sPath) {

			if (sPath.startsWith("/conditions/")) {
				var sFieldPath = sPath.slice(12);
				sFieldPath = _escapeFieldPath.call(this, sFieldPath);
				sPath = "/conditions/" + sFieldPath;
			}

			return JSONModel.prototype.getContext.apply(this, [sPath]);

		};

		ConditionModel.prototype.bindList = function(sPath, oContext, aSorters, aFilters, mParameters) {
			var oBinding = JSONModel.prototype.bindList.apply(this, arguments);
			oBinding.enableExtendedChangeDetection(true); // to force deep compare of data
			return oBinding;
		};

		ConditionModel._mModels = {};

		ConditionModel.prototype.destroy = function() {
			if (this._oListBinding) {
				delete ConditionModel._mModels[ConditionModel._createKey(this._oListBinding, this._sName)];
				this._oListBinding = undefined;
				this._sName = undefined;
			}

			JSONModel.prototype.destroy.apply(this, arguments);

			delete this._mFieldPath;
			delete this._oMessageBundle;
		};

		ConditionModel.prototype.clone = function(sFieldPath) {
			var oCM = new ConditionModel();

			//TODO the cloned CM get the same _oListBinding, so that the getFilterOperatorConfig() returns the same instance
			oCM._oListBinding = this._oListBinding;
			var oFF = this.getFilterField(sFieldPath);
			if (oFF) {
				oCM.addFilterField(oFF);
			} else {
				Log.error("ConditionModel", "clone of ConditionModel for fieldPath '" + sFieldPath + "' failed!");
				return oCM;
			}

			var aConditions = this.getConditions(sFieldPath);
			var oClonedConditions = {};
			for (var i = 0; i < aConditions.length; i++) {
				var oCondition = aConditions[i];
				var sMyFieldPath = _escapeFieldPath.call(this, oCondition.fieldPath);
				if (!oClonedConditions[sMyFieldPath]) {
					oClonedConditions[sMyFieldPath] = [];
				}
				oClonedConditions[sMyFieldPath].push(merge({}, oCondition));
			}
			oCM.setConditions(oClonedConditions);

			return oCM;
		};

		ConditionModel.prototype.merge = function(sFieldPath, oCM, sSourceFieldPath) {
			this.removeAllConditions(sFieldPath);
			var aCleanedConditions = ConditionModel.removeEmptyConditions(oCM.getConditions(sSourceFieldPath));
			for (var i = 0; i < aCleanedConditions.length; i++) {
				var oCondition = aCleanedConditions[i];
				this.addCondition(oCondition.fieldPath, oCondition);
			}
			this.checkUpdate(true, true);
		};

		// ConditionModel.mapConditions = function(aConditions, sTargetFieldPath) {
		// 	if (sTargetFieldPath) {
		// 		for (var i = 0; i < aConditions.length; i++) {
		// 			aConditions[i].fieldPath = sTargetFieldPath;
		// 		}
		// 	}

		// 	return aConditions;
		// };

		// ConditionModel.cloneConditions = function(aConditions) {
		// 	return merge([], aConditions);
		// };

		ConditionModel.removeEmptyConditions = function(aConditions) {
			for (var i = aConditions.length - 1; i > -1; i--) {
				if (aConditions[i].isEmpty) {
					aConditions.splice(parseInt(i, 10), 1);
				}
			}
			return aConditions;
		};

		/**
		 * @param oListBinding
		 * @param [sName]
		 */
		ConditionModel.getFor = function(oListBinding, sName) { // TODO: support sName for multiple models
			var sKey = ConditionModel._createKey(oListBinding, sName);
			var oCM = ConditionModel._mModels[sKey]; // TODO

			if (!oCM) {
				oCM = new ConditionModel();
				oCM._oListBinding = oListBinding;
				oCM._sName = sName;
				ConditionModel._mModels[sKey] = oCM;
			} else if (oCM._oListBinding !== oListBinding) {
				// update the oListBinding reverence
				oCM._oListBinding = oListBinding;
				oCM._sName = sName;
			}

			return oCM;
		};

		ConditionModel._createKey = function(oListBinding, sName) {
			return oListBinding.getModel().getId() + "--" + oListBinding.getPath() + "#" + (sName === undefined ? "" : sName);
		};

		/**
		 * @param oListBinding
		 * @param [sName]
		 */
		ConditionModel.prototype.setFor = function(oListBinding, sName) {
			delete ConditionModel._mModels[ConditionModel._createKey(this._oListBinding, sName)];
			this._oListBinding = oListBinding;
			this._sName = sName;
			ConditionModel._mModels[ConditionModel._createKey(this._oListBinding, sName)] = this;
			return this;
		};

		/**
		 * @param oConditionModel
		 * @param [sName]
		 */
		ConditionModel.destroyCM = function(oConditionModel, sName) {
			oConditionModel.destroy();
		};

		ConditionModel._getAll = function(oListBinding) {
			var aOverallModels = [];
			var sKey = ConditionModel._createKey(oListBinding);
			sKey = sKey.slice(0, sKey.length - 1);
			for (var model in ConditionModel._mModels) {
				if (model.indexOf(sKey) === 0) {
					var oCM = ConditionModel._mModels[model];
					aOverallModels.push(oCM);
				}
			}

			return aOverallModels;
		};

		ConditionModel._getAllKeys = function(oListBinding) {
			var aOverallModelKeys = [];
			var sKey = ConditionModel._createKey(oListBinding);
			sKey = sKey.slice(0, sKey.length - 1);
			for (var model in ConditionModel._mModels) {
				if (model.indexOf(sKey) === 0) {
					aOverallModelKeys.push(model);
				}
			}

			return aOverallModelKeys;
		};

		/**
		 * Returns conditions for a specified FieldPath.
		 *
		 * @param {string} sFieldPath fieldPath of the condition
		 * @return {object[]} array of conditions
		 * @public
		 */
		ConditionModel.prototype.getConditions = function(sFieldPath) {
			//TODO: only works for simple flat condition model content
			return _getConditions.call(this, sFieldPath);
		};

		function _getConditions(sFieldPath, bCreateIfEmpty) {

			var oConditions = this.getProperty("/conditions");
			var aConditions;

			if (typeof sFieldPath == "string") { // to support empty string
				sFieldPath = _escapeFieldPath.call(this, sFieldPath);
				if (!oConditions[sFieldPath] && bCreateIfEmpty) {
					oConditions[sFieldPath] = [];
				}
				aConditions = oConditions[sFieldPath] || [];
			} else {
				aConditions = [];
				for (var sMyFieldPath in oConditions) {
					for (var i = 0; i < oConditions[sMyFieldPath].length; i++) {
						var oCondition = oConditions[sMyFieldPath][i];
						aConditions.push(oCondition);
					}
				}
			}

			return aConditions;

		}

		function _getFieldPathFromCondition(oCondition) {

			if (oCondition.hasOwnProperty("fieldPath")) {
				return oCondition.fieldPath;
			}
			return false;

		}

		/**
		 * Determines the index of a condition for a specified FieldPath.
		 *
		 * @param {string} sFieldPath fieldPath of the condition
		 * @param {object} oCondition condition to be searched
		 * @return {object} index of condition (-1 if not found)
		 * @public
		 */
		ConditionModel.prototype.indexOf = function(sFieldPath, oCondition) {

			if (typeof sFieldPath === "object" && !oCondition) {
				oCondition = sFieldPath;
				sFieldPath = _getFieldPathFromCondition.call(this, oCondition);
			}

			if (typeof sFieldPath !== "string") {
				throw new Error("sFieldPath must be a string " + this);
			}

			var iIndex = -1;
			var aConditions = this.getConditions(sFieldPath);
			var sCondition = JSON.stringify(oCondition, ['fieldPath', 'operator', 'values']);
			aConditions.some(function(oCondition, i) {
				if (JSON.stringify(oCondition, ['fieldPath', 'operator', 'values']) === sCondition) {
					iIndex = i;
					return true;
				}
				return false;
			});
			return iIndex;

		};

		ConditionModel.prototype.exist = function(oCondition, sFieldPath) {
			if (sFieldPath) {
				return this.indexOf(sFieldPath, oCondition) >= 0;
			} else {
				return this.indexOf(oCondition) >= 0;
			}
		};

		/**
		 * Sets conditions. All already existing conditions will be removed
		 *
		 * @param {object} oConditions object of conditions for corresponding fieldPaths
		 * @return {sap.ui.mdc.base.ConditionModel} Reference to <code>this</code> to allow method chaining.
		 * @public
		 */
		ConditionModel.prototype.setConditions = function(oConditions) {

			var i = 0;
			var oCondition;

			this.setProperty("/conditions", {});

			if (Array.isArray(oConditions)) {
				// TODO: for compatibility reasons support old logic? (if yes, fire events only once for every fieldPath?)
				for (i = 0; i < oConditions.length; i++) {
					oCondition = oConditions[i];
					this.insertCondition(oCondition.fieldPath, -1, oCondition, true);
				}
			} else {
				this._bNoSingleEvent = true;
				for (var sMyFieldPath in oConditions) {
					for (i = 0; i < oConditions[sMyFieldPath].length; i++) {
						oCondition = oConditions[sMyFieldPath][i];
						this.insertCondition(sMyFieldPath, -1, oCondition, true);
					}
					sMyFieldPath = _escapeFieldPath.call(this, sMyFieldPath);
					this.firePropertyChange({reason: ChangeReason.Add, path: "/conditions/" + sMyFieldPath, context: undefined, value: oConditions[sMyFieldPath]});
				}
				this.checkUpdate(true, true);
				this._bNoSingleEvent = false;
			}

		return this;

		};

		/**
		 * Adds a condition for a specified FieldPath.
		 *
		 * @param {string} sFieldPath fieldPath of the condition
		 * @param {object} oCondition condition to be added
		 * @param {boolean} bForce if set the condition will be added even if it already exist
		 * @return {sap.ui.mdc.base.ConditionModel} Reference to <code>this</code> to allow method chaining.
		 * @public
		 */
		ConditionModel.prototype.addCondition = function(sFieldPath, oCondition, bForce) {

			if (typeof sFieldPath === "object") {
				bForce = oCondition;
				oCondition = sFieldPath;
				sFieldPath = _getFieldPathFromCondition.call(this, oCondition);
			}
			return this.insertCondition(sFieldPath, -1, oCondition, bForce);

		};

		/**
		 * Inserts a condition for a specified FieldPath.
		 *
		 * @param {string} sFieldPath fieldPath of the condition
		 * @param {int} iIndex index where the condition should be inserted
		 * @param {object} oCondition condition to be inserted
		 * @param {boolean} bForce if set the condition will be inserted even if it already exist
		 * @return {sap.ui.mdc.base.ConditionModel} Reference to <code>this</code> to allow method chaining.
		 * @public
		 */
		ConditionModel.prototype.insertCondition = function(sFieldPath, iIndex, oCondition, bForce) {

			if (typeof sFieldPath === "number" && typeof iIndex !== "number") {
				oCondition = iIndex;
				bForce = oCondition;
				iIndex = sFieldPath;
				sFieldPath = _getFieldPathFromCondition.call(this, oCondition);
			}

			if (typeof sFieldPath !== "string") {
				throw new Error("sFieldPath must be a string " + this);
			}

			var aConditions;

			this._checkIsEmpty(oCondition);
			this._updateValues(oCondition);

			if (!bForce) {
				var i = this.indexOf(sFieldPath, oCondition);
				if (i >= 0) {
					return this;
				}
			}

			// add condition to model
			aConditions = _getConditions.call(this, sFieldPath, true);
			if (iIndex == -1) {
				aConditions.push(oCondition);
			} else {
				aConditions.splice(iIndex, 0, oCondition);
			}

			this._checkMaxConditions(sFieldPath);

			if (!this._bNoSingleEvent) {
				this.checkUpdate(true, true);
				sFieldPath = _escapeFieldPath.call(this, sFieldPath);
				this.firePropertyChange({reason: ChangeReason.Add, path: "/conditions/" + sFieldPath, context: undefined, value: aConditions});
			}

			return this;
		};

		/**
		 * creates a condition instance for the Item condition
		 *
		 * @param {string} sFieldPath the fieldPath name of the condition
		 * @param {string} sKey the operator for the condition
		 * @param {string} sDescription the description of the operator
		 * @return {object} the new condition object with the given fieldPath, the operator EEQ and the sKey and sDescription as aValues. 
		 * @public
		 */
		ConditionModel.prototype.createItemCondition = function(sFieldPath, sKey, sDescription) {
			var aValues = [sKey, sDescription];
			if (sDescription === null || sDescription === undefined) {
				aValues.pop();
			}
			return this.createCondition(sFieldPath, "EEQ", aValues);
		};

		/**
		 * creates a condition instance for the condition model
		 *
		 * @param {string} sFieldPath the fieldPath name of the condition
		 * @param {string} sOperator the operator for the condition
		 * @param {any[]} aValues the array of values for the condition
		 * @return {object} the new condition object with the given fieldPath, operator and values. 
		 * @public
		 */
		ConditionModel.prototype.createCondition = function(sFieldPath, sOperator, aValues) {
			var oCondition = { fieldPath: sFieldPath, operator: sOperator, values: aValues };
			this._checkIsEmpty(oCondition);
			this._updateValues(oCondition);
			return oCondition;
		};

		/**
		 * Removes a condition for a specified FieldPath.
		 *
		 * @param {string} sFieldPath fieldPath of the condition
		 * @param {int | object} vCondition condition or index of the condition
		 * @return {boolean} flag if condition was removed.
		 * @public
		 */
		ConditionModel.prototype.removeCondition = function(sFieldPath, vCondition) {

			if (typeof sFieldPath === "object" && !vCondition) {
				vCondition = sFieldPath;
				sFieldPath = _getFieldPathFromCondition.call(this, vCondition);
			}

			var iIndex = -1;

			if (typeof vCondition === "object") {
				iIndex = this.indexOf(sFieldPath, vCondition);
			} else if (typeof vCondition === "number") {
				iIndex = vCondition;
			}

			if (typeof sFieldPath !== "string") {
				throw new Error("sFieldPath must be a string " + this);
			}

			var aConditions = this.getConditions(sFieldPath);
			if (aConditions.length > iIndex) {
				aConditions.splice(iIndex, 1);
				this.checkUpdate(true, true);
				this._checkMaxConditions(sFieldPath);
				sFieldPath = _escapeFieldPath.call(this, sFieldPath);
				this.firePropertyChange({reason: ChangeReason.Remove, path: "/conditions/" + sFieldPath, context: undefined, value: aConditions});
				return true;
			}

			return false;

		};

		/**
		 * Removes all conditions for a specified FieldPath.
		 *
		 * @param {string} sFieldPath fieldPath of the condition
		 * @return {sap.ui.mdc.base.ConditionModel} Reference to <code>this</code> to allow method chaining.
		 * @public
		 */
		ConditionModel.prototype.removeAllConditions = function(sFieldPath) {

			var oConditions = this.getProperty("/conditions");

			if (sFieldPath) {
				sFieldPath = _escapeFieldPath.call(this, sFieldPath);
				delete oConditions[sFieldPath];
				sFieldPath = _escapeFieldPath.call(this, sFieldPath);
				this.firePropertyChange({reason: ChangeReason.Remove, path: "/conditions/" + sFieldPath, context: undefined, value: oConditions[sFieldPath]});
			} else {
				for (var sMyFieldPath in oConditions) {
					delete oConditions[sMyFieldPath];
					sMyFieldPath = _escapeFieldPath.call(this, sMyFieldPath);
					this.firePropertyChange({reason: ChangeReason.Remove, path: "/conditions/" + sMyFieldPath, context: undefined, value: oConditions[sMyFieldPath]});
				}
			}

			this.checkUpdate(true, true);

			return this;

		};

		/**
		 * Deletes conditions from the condition model based on the context
		 * @param {sap.ui.model.Context|sap.ui.model.Context[]} oContext a single context or array of contexts to delete.
		 * @private
		 */
		ConditionModel.prototype.deleteConditions = function(oContext, oBinding) {
			var sFieldPath;
			if (!oContext || !oBinding) {
				return;
			}
			//normalize oContext
			if (!Array.isArray(oContext)) {
				oContext = [oContext];
			}

			//access the data node for the list binding in the model as reference
			var aData = oBinding.oModel.getProperty(oBinding.getPath(), oBinding.getContext()) || [];

			if (Array.isArray(oContext) && aData.length > 0) {
				//collect the indices from the context of each context
				var aIndices = [],
					fn, i, n;
				if (Array.isArray(aData)) {
					for (i = 0; i < oContext.length; i++) {
						for (var j = 0; j < aData.length; j++) {
							if (deepEqual(aData[j], oContext[i].getProperty())) {
								aIndices.push(j);
								break;
							}
						}
					}
					//in case of array, sort and delete reverse
					aIndices.sort(function(a, b) { return a - b; });
					fn = function(iIndex) {
						sFieldPath = aData[iIndex].fieldPath;
						aData.splice(iIndex, 1); //splice for array
					};
				} else if (typeof aData === "object") {
					for (n in aData) {
						var sIndex = oContext[i].getPath();
						sIndex = sIndex.substring(oContext[i].getPath().lastIndexOf("/") + 1);
						aIndices.push(n);
					}
					fn = function(sIndex) {
						delete aData[sIndex]; //delete for map
					};
				}
				//delete reverse
				for (i = aIndices.length - 1; i > -1; i--) {
					fn(aIndices[i]);
				}
			}
			oBinding.getModel().checkUpdate(true, true);

			this._checkMaxConditions(sFieldPath);
		};

		ConditionModel.prototype._checkIsEmpty = function(aConditions) {
			var oFilterOpConfig = this.getFilterOperatorConfig();

			aConditions = aConditions || this.getConditions();
			if (!Array.isArray(aConditions)) {
				aConditions = [aConditions];
			}

			aConditions.forEach(function(oCondition) {
				var oOperator = oFilterOpConfig.getOperator(oCondition.operator);
				oCondition.isEmpty = oOperator.isEmpty(oCondition);
			});
		};

		ConditionModel.prototype._updateValues = function(aConditions) {
			var oFilterOpConfig = this.getFilterOperatorConfig();

			aConditions = aConditions || this.getConditions();
			if (!Array.isArray(aConditions)) {
				aConditions = [aConditions];
			}

			aConditions.forEach(function(oCondition) {
				var oOperator = oFilterOpConfig.getOperator(oCondition.operator);

				//update the values array length 
				if (oCondition.operator !== "EEQ") {
					while (oCondition.values.length != oOperator.valueTypes.length) {
						if (oCondition.values.length < oOperator.valueTypes.length) {
							oCondition.values.push(null);
						}
						if (oCondition.values.length > oOperator.valueTypes.length) {
							oCondition.values = oCondition.values.slice(0, oCondition.values.length - 1);
						}
					}
				}
			});
		};

		/**
		 * This function makes a required check for the given sFieldPath (or all).
		 * It only works when the Filterfields are attached to the ConditionModel. 
		 * The function is checking that for a required FilterField at least one condition exists.
		 * 
		 * @param {string} sFieldPath
		 * @return {boolean} true, if for a sFieldPath the FilterField with required=true no condition exists.
		 *
		 * @private
		 */
		ConditionModel.prototype._checkRequiredConditions = function(bShowMessage, sFieldPath) {
			var aFields = sFieldPath ? [sFieldPath] : Object.keys(this._mFieldPath || {});
			var bError = false;
			var sMsg = this._oMessageBundle.getText("conditionmodel.REQUIRED_CONDITION_MISSING");
			aFields.forEach(function(sFieldPath) {
				if (this._mFieldPath && this._mFieldPath[sFieldPath]) {
					var oFilterField = this._mFieldPath[sFieldPath];
					if (oFilterField.getRequired() && this.getConditions(sFieldPath).length <= 0) {
						if (bShowMessage) {
							this.addFieldPathMessage(sFieldPath, sMsg);
						}
						bError = true;
					} else {
						this.removeFieldPathMessage(sFieldPath, sMsg);
					}
				}
			}, this);

			return !bError;
		};

		/**
		 * This function makes a maxConditions check for the given sFieldPath (or all).
		 * It only works when the Filterfields are attached to the ConditionModel. 
		 * The function is checking that for a FilterField the number of conditions is <=maxCondition.
		 * 
		 * @param {string} sFieldPath
		 * @return {boolean} true, if for a sFieldPath the number of conditions > the FilterField.getMaxConditions.
		 *
		 * @private
		 */
		ConditionModel.prototype._checkMaxConditions = function(sFieldPath) {
			var aFields = sFieldPath ? [sFieldPath] : Object.keys(this._mFieldPath || {});
			var bError = false;
			var bShowMessage = false; // remove old conditions until # < maxConditions

			if (bShowMessage) {
				var sMsg = this._oMessageBundle.getText("conditionmodel.TOO_MANY_CONDITIONS");
				aFields.forEach(function(sFieldPath) {
					if (this._mFieldPath && this._mFieldPath[sFieldPath]) {
						var oFilterField = this._mFieldPath[sFieldPath];

						if (oFilterField.getMaxConditions() >= 0 && this.getConditions(sFieldPath).length > oFilterField.getMaxConditions()) {
							this.addFieldPathMessage(sFieldPath, sMsg);
							bError = true;
						} else {
							this.removeFieldPathMessage(sFieldPath, sMsg);
						}
					}
				}, this);

			} else { // remove old conditions
				aFields.forEach(function(sFieldPath) {
					if (this._mFieldPath && this._mFieldPath[sFieldPath]) {
						var oFilterField = this._mFieldPath[sFieldPath];
						var aConditions = this.getConditions(sFieldPath);
						var iLenght = 0;
						// TODO: ignore empty conditions????
						for (var i = 0; i < aConditions.length; i++) {
							if (!aConditions[i].isEmpty) {
								iLenght++;
							}
						}

						while (oFilterField.getMaxConditions() >= 0 && iLenght > oFilterField.getMaxConditions()) {
							this.removeCondition(sFieldPath, 0);
							iLenght--;
							bError = false;
						}
					}
				}, this);

			}
			return bError;
		};

		ConditionModel.prototype.addFilterField = function(oFilterField) {
			var sFieldPath = oFilterField.getFieldPath();
			this._mFieldPath[sFieldPath] = oFilterField;

			this._getFieldPathProperty(sFieldPath);
		};

		ConditionModel.prototype.getFilterField = function(sFieldPath) {
			var aFields = Object.keys(this._mFieldPath || {});
			return this._mFieldPath[sFieldPath || aFields[0]];
		};

		ConditionModel.prototype.getFilterFields = function() {
			var aFields = Object.keys(this._mFieldPath || {});
			var aFilterFields = [];
			aFields.forEach(function(sFieldPath) {
				aFilterFields.push(this._mFieldPath[sFieldPath]);
			}, this);
			return aFilterFields;
		};


		ConditionModel.prototype.removeFilterField = function(oFilterField) {
			var sFieldPath = oFilterField.getFieldPath();
			if (this._mFieldPath && this._mFieldPath[sFieldPath]) {
				delete this._mFieldPath[sFieldPath];
			}

			var oFieldPath = this.getProperty("/fieldPath");
			if (oFieldPath && oFieldPath[sFieldPath]) {
				delete oFieldPath[sFieldPath];
			}
		};

		ConditionModel.prototype._getFieldPathProperty = function(sFieldPath) {
			var oFieldPath = this.getProperty("/fieldPath");
			if (!oFieldPath[sFieldPath]) {
				oFieldPath[sFieldPath] = {
					valueState: "None",
					valueStateText: "",
					messages: []
				};
			}
			return oFieldPath[sFieldPath];
		};

		ConditionModel.prototype.addFieldPathMessage = function(sFieldPath, sMsg) {
			var oFieldPath = this._getFieldPathProperty(sFieldPath);

			if (!oFieldPath.messages.some(function(sItem, i) {
					if (sItem === sMsg) {
						return true;
					}
					return false;
				})) {
				oFieldPath.messages.push(sMsg);
			}

			this._updateValueState(sFieldPath);
		};

		ConditionModel.prototype.setUIMessage = function(sFieldPath, sMsg) {
			var oFieldPath = this._getFieldPathProperty(sFieldPath);

			oFieldPath.uiMessage = sMsg;

			this._updateValueState(sFieldPath);
		};


		ConditionModel.prototype.removeFieldPathMessage = function(sFieldPath, sMsg) {
			var iIndex;
			var oFieldPath = this._getFieldPathProperty(sFieldPath);
			if (oFieldPath.messages.some(function(sItem, i) {
					if (sItem === sMsg) {
						iIndex = i;
						return true;
					}
					return false;
				})) {
				oFieldPath.messages.splice(iIndex, 1);
			}

			this._updateValueState(sFieldPath);
		};

		ConditionModel.prototype.removeUIMessage = function(sFieldPath) {
			var oFieldPath = this._getFieldPathProperty(sFieldPath);

			delete oFieldPath.uiMessage;

			this._updateValueState(sFieldPath);
		};


		ConditionModel.prototype._updateValueState = function(sFieldPath) {
			var bUpdate = false,
				oFieldPath = this._getFieldPathProperty(sFieldPath),
				sValueState = "None",
				sValueStateText = "";

			if (oFieldPath.uiMessage) {
				sValueState = "Error";
				sValueStateText = oFieldPath.uiMessage;
			} else if (oFieldPath.messages.length > 0) {
				sValueState = "Error";
				sValueStateText = oFieldPath.messages[oFieldPath.messages.length - 1];
			}

			if (oFieldPath.valueState !== sValueState) {
				oFieldPath.valueState = sValueState;
				bUpdate = true;
			}

			if (oFieldPath.valueStateText !== sValueStateText) {
				oFieldPath.valueStateText = sValueStateText;
				bUpdate = true;
			}

			if (bUpdate) {
				this.checkUpdate(true, true);
			}
		};

		ConditionModel.prototype.isValid = function(bValidate, sFieldPath) {
			var aFields = sFieldPath ? [sFieldPath] : Object.keys(this._mFieldPath || {});
			var bValid = this._checkRequiredConditions(bValidate);
			aFields.forEach(function(sFieldPath) {
				var oFieldPath = this._getFieldPathProperty(sFieldPath);
				bValid = bValid && oFieldPath.valueState == "None";
			}, this);

			return bValid;
		};

		ConditionModel.prototype.applyFilters = function(bValidate, bAll) {
			if (this.isValid(bValidate)) {
				if (this._oListBinding.changeParameters) {
					if (this.getConditions("$search").length) {
						var sValue = this.getConditions("$search")[0].values[0];
						this._oListBinding.changeParameters({ $search: sValue });
					} else {
						this._oListBinding.changeParameters({ $search: undefined });
					}
				}

				var oFilter;
				if (bAll) {
					oFilter = this.getAllFilters();
				} else {
					oFilter = this.getFilters();
				}
				if (oFilter) {
					this._oListBinding.filter(oFilter);
				} else { // no filters
					this._oListBinding.filter();
				}

				if (oFilter) {
					window.console.log("CM-Filter:" + this._prettyPrintFilters(oFilter));
				}

				return true;
			}
			return false;
		};

		ConditionModel.prototype.getAllFilters = function() {
			var aOverallModels = ConditionModel._getAll(this._oListBinding);
			var aOverallFilters = [];
			aOverallModels.forEach(function(oCM) {
				var oFilter = oCM.getFilters();
				if (oFilter) {
					aOverallFilters.push(oFilter);
				}
			});

			var oFilter = null;
			if (aOverallFilters.length === 1) {
				oFilter = aOverallFilters[0]; // could omit this and have an ORed array with only one filter, but it's nice this way.
			} else if (aOverallFilters.length > 1) {
				oFilter = new Filter({ filters: aOverallFilters, and: true });
			}

			// if (oFilter) {
			// 	window.console.log("CM-Filter:" + this._prettyPrintFilters(oFilter));
			// }
			return oFilter;
		};
		
		ConditionModel.prototype._prettyPrintFilters = function(oFilter) {
			var sRes;
			if (!oFilter) {
				return "";
			}
			if (oFilter._bMultiFilter) {
				sRes = "";
				var bAnd = oFilter.bAnd;
				oFilter.aFilters.forEach(function(oFilter, index, aFilters) {
					sRes += this._prettyPrintFilters(oFilter);
					if (aFilters.length - 1 != index) {
						sRes += bAnd ? " and " : " or ";
					}
				}, this);
				return "(" + sRes + ")";
			} else {
				sRes = oFilter.sPath + " " + oFilter.sOperator + " '" + oFilter.oValue1 + "'";
				if (oFilter.sOperator === "BT") {
					sRes += "...'" + oFilter.oValue2 + "'";
				}
				return sRes;
			}
		};

		/**
		 *
		 * @public
		 */
		ConditionModel.prototype.getFilterOperatorConfig = function() {
			var oModel = this._oListBinding && this._oListBinding.getModel();
			return FilterOperatorConfig.getFor(oModel);
		};


		ConditionModel.prototype.getFilters = function(sFieldPath) {
			var i, aLocalFilters, aLocalNEFilters, aOverallFilters = [],
				aConditions,
				oToAnyFilterParam, aSections, sNavPath, sPropertyPath;

			var oFilterOpConfig = this.getFilterOperatorConfig();

			var oFilterItemNameMap = {};
			if (sFieldPath === undefined) {
				aConditions = this.getConditions();
			} else
			if (typeof sFieldPath === "string") {
				aConditions = this.getConditions(sFieldPath);
			} else {
				aConditions = sFieldPath || [];
			}
			for (i = 0; i < aConditions.length; i++) {
				oFilterItemNameMap[aConditions[i].fieldPath] = true;
			}

			var oOperator, oFilter;

			// OR-combine filters for each property
			for (var attrName in oFilterItemNameMap) {
				aLocalFilters = [];
				aLocalNEFilters = [];
				oToAnyFilterParam = null;

				for (i = 0; i < aConditions.length; i++) {
					// only collect conditions for fieldPath == attrName and operator != NE
					if (aConditions[i].fieldPath === attrName) {
						oOperator = oFilterOpConfig.getOperator(aConditions[i].operator);
						oFilter = oOperator.getModelFilter(aConditions[i]);

						if (!(oOperator.exclude && aConditions[i].operator === "NE")) {

							if (oFilter.sPath === "$search") {
								//ignore the $search conditions
								continue;
							}

							// basic search condition handling plit the oFilter with sPath == "*xxx,yyy*" into multiple filter
							// e.g. fieldPath "*title,year*" - such fieldPath onlyworks with type  string and an operation with a single value (e.g. contains)
							var $searchfilters = /^\*(.+)\*$/.exec(oFilter.sPath);
							if ($searchfilters) {
								// $search mapping
								var aFieldPath = $searchfilters[1].split(',');
								for (var j = 0; j < aFieldPath.length; j++) {
									aLocalFilters.push(new Filter(aFieldPath[j], oFilter.sOperator, oFilter.oValue1));
								}
								continue;
							}

							// ANY condition handling e.g. fieldPath "navPath*/propertyPath"
							if (oFilter.sPath.indexOf('*/') > -1) {
								aSections = oFilter.sPath.split('*/');
								if (aSections.length === 2) {
									sNavPath = aSections[0];
									sPropertyPath = aSections[1];
									oFilter.sPath = 'L1/' + sPropertyPath;

									if (!oToAnyFilterParam) {
										oToAnyFilterParam = {
											path: sNavPath,
											operator: 'Any',
											variable: 'L1'
										};
									}
									aLocalFilters.push(oFilter);
								} else {
									throw new Error("Not Implemented");
								}
							} else {
								aLocalFilters.push(oFilter);
							}
						}
					}
				}

				//collect all exclude (NE) condtions as AND fieldpath != "value"
				for (i = 0; i < aConditions.length; i++) {
					if (aConditions[i].fieldPath === attrName) {
						oOperator = oFilterOpConfig.getOperator(aConditions[i].operator);
						oFilter = oOperator.getModelFilter(aConditions[i]);
						if (oOperator.exclude && aConditions[i].operator === "NE") {
							aLocalNEFilters.push(oFilter);
						}
					}
				}

				if (oToAnyFilterParam) {
					if (aLocalFilters.length === 1) {
						oToAnyFilterParam.condition = aLocalFilters[0];
					} else if (aLocalFilters.length > 1) {
						oToAnyFilterParam.condition = new Filter({ filters: aLocalFilters, and: false });
					}
					aLocalFilters = [new Filter(oToAnyFilterParam)];
				}

				// take the single Filter or combine all with OR
				if (aLocalFilters.length === 1) {
					aOverallFilters.push(aLocalFilters[0]); // could omit this and have an OR-ed array with only one filter, but it's nice this way.
				} else if (aLocalFilters.length > 1) {
					aOverallFilters.push(new Filter({ filters: aLocalFilters, and: false }));
				}

				// merge all NE filter into the Overallfilter, they will be AND added to the result
				if (aLocalNEFilters.length === 1) {
					aOverallFilters.push(aLocalNEFilters[0]); // could omit this and have an OR-ed array with only one filter, but it's nice this way.
				} else if (aLocalNEFilters.length > 1) {
					aOverallFilters = aOverallFilters.merge(aLocalNEFilters);
				}
			}

			// AND-combine filters for different properties and apply filters
			if (aOverallFilters.length === 1) {
				return aOverallFilters[0]; // could omit this and have an ORed array with only one filter, but it's nice this way.
			} else if (aOverallFilters.length > 1) {
				return new Filter({ filters: aOverallFilters, and: true });
			} else { // no filters
				return null;
			}
		};

		ConditionModel.prototype.serialize = function() {
			var aConditions = merge([], this.getConditions());
			aConditions.forEach(function(oCondition) {
				delete oCondition.isEmpty;
			}, this);
			return '{"conditions":' + JSON.stringify(aConditions) + "}";
		};

		ConditionModel.prototype.serializeMeta = function() {
			var aFields = Object.keys(this._mFieldPath || {});
			var r = "";
			aFields.forEach(function(sFieldPath) {
				if (this.getData().fieldPath[sFieldPath].valueState !== "None") {
					r += JSON.stringify(this.getData().fieldPath[sFieldPath]);
				}
			}, this);

			return '{"fieldPath":' + r + "}";
		};

		ConditionModel.prototype.parse = function(sObjects) {
			var dateTimeReviver = function(key, value) {
				var a;
				if (!isNaN(parseInt(key, 10)) && (typeof value === 'string')) {
					a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}).(\d{3})Z$/.exec(value);
					if (a) {
						return new Date(value);
					}
				}
				return value;
			};

			this.setConditions(JSON.parse(sObjects, dateTimeReviver).conditions);
		};

		ConditionModel.serialize = function(oListBinding) {
			var aOverallModelKeys = ConditionModel._getAllKeys(oListBinding);
			var sResult = "";

			aOverallModelKeys.forEach(function(oCMKey) {
				var oCM = ConditionModel._mModels[oCMKey];
				if (oCM.getConditions() && oCM.getConditions().length > 0) {
					sResult += ">>>" + oCMKey + "<<<";
					sResult += oCM.serialize();
				}
			});

			return sResult;
		};

		ConditionModel.serializeMeta = function(oListBinding) {
			var aOverallModelKeys = ConditionModel._getAllKeys(oListBinding);
			var sResult = "";

			aOverallModelKeys.forEach(function(oCMKey) {
				var oCM = ConditionModel._mModels[oCMKey];
				sResult += oCM.serializeMeta();
			});

			return sResult;
		};

		ConditionModel.parse = function(sObjects) {
			var aConditions = sObjects.split(">>>");
			aConditions.forEach(function(sCondition) {
				var aParts = sCondition.split("<<<");
				if (aParts.length > 1) {
					if (ConditionModel._mModels[aParts[0]]) {
						ConditionModel._mModels[aParts[0]].parse(aParts[1]);
					} else {
						var oCM = new ConditionModel(); //TODO oListBinding missing
						oCM.parse(aParts[1]);
						ConditionModel._mModels[aParts[0]] = oCM;
					}
				}
			});
		};

		function _escapeFieldPath(sFieldPath) {

			if (sFieldPath) {
				var aParts = sFieldPath.split("/");

				if (aParts.length > 1) {
					sFieldPath = "";

					for (var i = 0; i < aParts.length; i++) {
						var sPart = aParts[i];
						if (i > 0) {
							if (!isNaN(sPart) || !isNaN(aParts[i - 1])) {
								sFieldPath = sFieldPath + "/";
							} else {
								sFieldPath = sFieldPath + "_";
							}
						}
						sFieldPath = sFieldPath + sPart;
					}
				}

			}

			return sFieldPath;

		}

		return ConditionModel;
	}, /* bExport= */ true);