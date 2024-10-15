/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
	'sap/ui/mdc/base/info/ILinkHandler', 'sap/ui/mdc/base/info/LinkItem', 'sap/ui/mdc/base/info/Factory', 'sap/ui/mdc/base/info/Log', 'sap/base/Log', 'sap/base/util/isPlainObject'
], function(ILinkHandler, LinkItem, Factory, Log, SapBaseLog, isPlainObject) {
	"use strict";

	/**
	 * Constructor for a new LinkHandler.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] initial settings for the new control
	 * @class The <code>LinkHandler</code> implements the interface <code>ILinkHandler</code>.
	 * @extends sap.ui.mdc.base.info.ILinkHandler
	 * @version 1.60.42
	 * @constructor
	 * @private
	 * @since 1.58.0
	 * @alias sap.ui.mdc.flp.info.LinkHandler
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var LinkHandler = ILinkHandler.extend("sap.ui.mdc.flp.info.LinkHandler", /** @lends sap.ui.mdc.flp.info.LinkHandler.prototype */
	{
		metadata: {
			library: "sap.ui.mdc",
			properties: {
				/**
				 * Name of semantic objects which are used to determine navigation targets. </br>
				 * Is the property not set initially, the <code>semanticObjects</code> are set automatically
				 * to the semantic objects which are annotated in the metadata for the property assigned
				 * in <code>metadataContext</code>.
				 */
				semanticObjects: {
					type: "string[]",
					defaultValue: []
				},
				/**
				 * Name of semantic object whose displayFactSheet action will be used in a special manner (for example as title in navigation popover).
				 */
				mainSemanticObject: {
					type: "string"
				},
				/**
				 * Default text of main item of <code>items</code> aggregation.
				 */
				textOfMainItem: {
					type: "string"
				},
				/**
				 * Default description of main item of <code>items</code> aggregation.
				 */
				descriptionOfMainItem: {
					type: "string"
				},
				/**
				 * Default icon of main item of <code>items</code> aggregation.
				 */
				iconOfMainItem: {
					type: "string"
				}
			},
			aggregations: {
				semanticObjectMappings: {
					type: "sap.ui.mdc.base.info.SemanticObjectMapping",
					multiple: true,
					singularName: "semanticObjectMapping"
				},
				semanticObjectUnavailableActions: {
					type: "sap.ui.mdc.base.info.SemanticObjectUnavailableAction",
					multiple: true,
					singularName: "semanticObjectUnavailableAction"
				}
			}
		}
	});

	LinkHandler.prototype.init = function() {
		SapBaseLog.setLevel(SapBaseLog.Level.TRACE);
		this._oInfoLog = SapBaseLog.getLevel() >= SapBaseLog.Level.INFO ? new Log() : undefined; //3
	};

	// ----------------------- Implementation of 'ILinkHandler' interface --------------------------------------------

	/**
	 * Once application registered with 'modifyItemsCallback' property we have to make sure that the callback is called in any
	 * case (independent on whether links exists or not).
	 *
	 * @returns {Promise} Result of Promise is <code>true</code> if triggerable
	 */
	LinkHandler.prototype.hasPotentialLinks = function() {
		if (!!this.getModifyItemsCallback() || !!this.getItems().length) {
			return Promise.resolve(true);
		}
		return LinkHandler.hasDistinctSemanticObject(this.getSemanticObjects());
	};
	LinkHandler.prototype.determineItems = function() {
		var oControl = sap.ui.getCore().byId(this.getSourceControl());
		var oBindingContext = oControl && oControl.getBindingContext() || undefined;
		var oContextObject = oBindingContext ? oBindingContext.getObject(oBindingContext.getPath()) : undefined;

		if (this._oInfoLog) {
			this._oInfoLog.initialize(this.getSemanticObjects(), oContextObject);
			this.getItems().forEach(function(oItem) {
				this._oInfoLog.addIntent(Log.IntentType.API, {
					text: oItem.getText(),
					intent: oItem.getHref()
				});
			}.bind(this));
		}

		if (this.getModifyItemsCallback()) {
			return this.getModifyItemsCallback()(oContextObject, this).then(function() {
				if (this._oInfoLog) {
					if (!this._oInfoLog.isEmpty() && SapBaseLog.getLevel() >= SapBaseLog.Level.TRACE) { //5
						SapBaseLog.info("---------------------------------------------\nLinkHandler: calculation of semantic attributes\nBelow you can see detailed information regarding semantic attributes which have been calculated for one or more semantic objects defined in a LinkHandler control. Semantic attributes are used to create the URL parameters. Additionally you can see all links containing the URL parameters.\n" + this._getLogFormattedText());
					}
				}
				return this.getItems();
			}.bind(this));
		} else {
			var oSemanticAttributes = this.calculateSemanticAttributes(oContextObject);
			return this.retrieveNavigationTargets("", oSemanticAttributes).then(function(aLinks, oOwnNavigationLink) {
				if (this._oInfoLog) {
					if (!this._oInfoLog.isEmpty() && SapBaseLog.getLevel() >= SapBaseLog.Level.TRACE) { //5
						SapBaseLog.info("---------------------------------------------\nLinkHandler: calculation of semantic attributes\nBelow you can see detailed information regarding semantic attributes which have been calculated for one or more semantic objects defined in a LinkHandler control. Semantic attributes are used to create the URL parameters. Additionally you can see all links containing the URL parameters.\n" + this._getLogFormattedText());
					}
				}
				var aItems = this.getItems();
				var fnItemExists = function(sKey) {
					return aItems.some(function(oItem) {
						return oItem.getKey() === sKey;
					});
				};
				aLinks.forEach(function(oLink) {
					if (!fnItemExists(oLink.getKey())) {
						this.addItem(oLink);
					}
				}.bind(this));

				// Create main item if requested, meaning:
				// 1. Neither in FLP nor via 'items' aggregation the main item is defined
				// 2. Either textOfMainitem or descriptionOfMainItem or iconOfMainItem is defined
				var sTextOfMainItem = this.getTextOfMainItem();
				var sDescriptionOfMainItem = this.getDescriptionOfMainItem();
				var sIconOfMainItem = this.getIconOfMainItem();
				var aMainItem = this.getItems().filter(function(oItem) {
					return oItem.getIsMain() === true;
				});
				if (aMainItem.length === 0 && (!!sTextOfMainItem || !!sDescriptionOfMainItem || !!sIconOfMainItem)) {
					this.addItem(new LinkItem({
						key: this.getId() + "-defaultMainItem",
						isMain: true,
						text: sTextOfMainItem ? sTextOfMainItem : undefined,
						description: sDescriptionOfMainItem ? sDescriptionOfMainItem : undefined,
						icon: sIconOfMainItem ? sIconOfMainItem : undefined
					}));
				}
				return this.getItems();
			}.bind(this));
		}
	};

	// ----------------------------------------------------------------------------------------------------------------

	LinkHandler.prototype._convertSemanticObjectMapping = function() {
		var aUI5SOMs = this.getSemanticObjectMappings();
		if (!aUI5SOMs.length) {
			return undefined;
		}
		var mSemanticObjectMappings = {};
		aUI5SOMs.forEach(function(oUI5SOM) {
			if (!oUI5SOM.getSemanticObject()) {
				throw Error("LinkHandler: 'semanticObject' property with value '" + oUI5SOM.getSemanticObject() + "' is not valid");
			}
			mSemanticObjectMappings[oUI5SOM.getSemanticObject()] = oUI5SOM.getItems().reduce(function(oMap, oItem) {
				oMap[oItem.getKey()] = oItem.getValue();
				return oMap;
			}, {});
		});
		return mSemanticObjectMappings;
	};
	LinkHandler.prototype._convertSemanticObjectUnavailableAction = function() {
		var aUI5SOUAs = this.getSemanticObjectUnavailableActions();
		if (!aUI5SOUAs.length) {
			return undefined;
		}
		var mSemanticObjectUnavailableActions = {};
		aUI5SOUAs.forEach(function(oUI5SOUAs) {
			if (!oUI5SOUAs.getSemanticObject()) {
				throw Error("LinkHandler: 'semanticObject' property with value '" + oUI5SOUAs.getSemanticObject() + "' is not valid");
			}
			mSemanticObjectUnavailableActions[oUI5SOUAs.getSemanticObject()] = oUI5SOUAs.getActions();
		});
		return mSemanticObjectUnavailableActions;
	};
	LinkHandler.prototype._getLogFormattedText = function() {
		return this._oInfoLog ? this._oInfoLog.getFormattedText() : "No logging data available";
	};

	/**
	 * Calculates semantic attributes for given semantic objects, semantic object mappings and context object. If semantic objects are
	 * not passed, the semantic attributes are calculated anyway. This is done in situation where application defines the callback. Then
	 * it is not necessary to have a semantic object because then <code>calculateSemanticAttributes</code> should be able to calculate
	 * the semantic attributes also without any semantic objects, the application has only to define the context object.
	 *
	 * @param {object} oContextObject Key - value pairs
	 * @returns {object} Semantic attributes as object of key - value pairs
	 * @protected
	 */
	LinkHandler.prototype.calculateSemanticAttributes = function(oContextObject) {
		var mSemanticObjectMappings = this._convertSemanticObjectMapping();
		var aSemanticObjects = this.getSemanticObjects();
		if (!aSemanticObjects.length) {
			aSemanticObjects.push("");
		}

		var oResults = {};
		aSemanticObjects.forEach(function(sSemanticObject) {
			oResults[sSemanticObject] = {};
			for ( var sAttributeName in oContextObject) {
				var oAttribute = null, oTransformationAdditional = null;
				if (this._oInfoLog) {
					oAttribute = this._oInfoLog.getSemanticObjectAttribute(sSemanticObject, sAttributeName);
					if (!oAttribute) {
						oAttribute = this._oInfoLog.createAttributeStructure();
						this._oInfoLog.addSemanticObjectAttribute(sSemanticObject, sAttributeName, oAttribute);
					}
				}
				// Ignore undefined and null values
				if (oContextObject[sAttributeName] === undefined || oContextObject[sAttributeName] === null) {
					if (oAttribute) {
						oAttribute.transformations.push({
							value: undefined,
							description: "\u2139 Undefined and null values have been removed in LinkHandler."
						});
					}
					continue;
				}
				// Ignore plain objects (BCP 1770496639)
				if (isPlainObject(oContextObject[sAttributeName])) {
					if (oAttribute) {
						oAttribute.transformations.push({
							value: undefined,
							description: "\u2139 Plain objects has been removed in LinkHandler."
						});
					}
					continue;
				}

				// Map the attribute name only if 'semanticObjectMapping' is defined.
				// Note: under defined 'semanticObjectMapping' we also mean an empty annotation or an annotation with empty record
				var sAttributeNameMapped = (mSemanticObjectMappings && mSemanticObjectMappings[sSemanticObject] && mSemanticObjectMappings[sSemanticObject][sAttributeName]) ? mSemanticObjectMappings[sSemanticObject][sAttributeName] : sAttributeName;

				if (oAttribute && sAttributeName !== sAttributeNameMapped) {
					oTransformationAdditional = {
						value: undefined,
						description: "\u2139 The attribute " + sAttributeName + " has been renamed to " + sAttributeNameMapped + " in LinkHandler.",
						reason: "\ud83d\udd34 A com.sap.vocabularies.Common.v1.SemanticObjectMapping annotation is defined for semantic object " + sSemanticObject + " with source attribute " + sAttributeName + " and target attribute " + sAttributeNameMapped + ". You can modify the annotation if the mapping result is not what you expected."
					};
				}

				// If more then one local property maps to the same target property (clash situation)
				// we take the value of the last property and write an error log
				if (oResults[sSemanticObject][sAttributeNameMapped]) {
					SapBaseLog.error("LinkHandler: The attribute " + sAttributeName + " can not be renamed to the attribute " + sAttributeNameMapped + " due to a clash situation. This can lead to wrong navigation later on.");
				}

				// Copy the value replacing the attribute name by semantic object name
				oResults[sSemanticObject][sAttributeNameMapped] = oContextObject[sAttributeName];

				if (oAttribute) {
					if (oTransformationAdditional) {
						oAttribute.transformations.push(oTransformationAdditional);
						var aAttributeNew = this._oInfoLog.createAttributeStructure();
						aAttributeNew.transformations.push({
							value: oContextObject[sAttributeName],
							description: "\u2139 The attribute " + sAttributeNameMapped + " with the value " + oContextObject[sAttributeName] + " has been added due to a mapping rule regarding the attribute " + sAttributeName + " in LinkHandler."
						});
						this._oInfoLog.addSemanticObjectAttribute(sSemanticObject, sAttributeNameMapped, aAttributeNew);
					}
				}
			}
		}.bind(this));
		return oResults;
	};
	/**
	 * Reads navigation targets using CrossApplicationNavigation of the unified shell service.
	 *
	 * @param {string} sAppStateKey Application state key
	 * @param {object} oSemanticAttributes Semantic attributes
	 * @returns {Promise} A <code>Promise</code> for asynchronous execution
	 * @protected
	 */
	LinkHandler.prototype.retrieveNavigationTargets = function(sAppStateKey, oSemanticAttributes) {
		var oNavigationTargets = {
			ownNavigation: undefined,
			availableActions: []
		};
		return sap.ui.getCore().loadLibrary('sap.ui.fl', {
			async: true
		}).then(function() {
			return new Promise(function(resolve) {
				sap.ui.require([
					'sap/ui/fl/Utils'
				], function(Utils) {

					var oCrossApplicationNavigation = Factory.getService("CrossApplicationNavigation");
					var oURLParsing = Factory.getService("URLParsing");
					if (!oCrossApplicationNavigation || !oURLParsing) {
						SapBaseLog.error("LinkHandler: Service 'CrossApplicationNavigation' or 'URLParsing' could not be obtained");
						return resolve(oNavigationTargets.availableActions, oNavigationTargets.ownNavigation);
					}
					var aSemanticObjects = this.getSemanticObjects();
					var oControl = sap.ui.getCore().byId(this.getSourceControl());
					var oAppComponent = Utils.getAppComponentForControl(oControl);
					var aParams = aSemanticObjects.map(function(sSemanticObject) {
						return [
							{
								semanticObject: sSemanticObject,
								params: oSemanticAttributes ? oSemanticAttributes[sSemanticObject] : undefined,
								appStateKey: sAppStateKey,
								ui5Component: oAppComponent,
								sortResultsBy: "text"
							}
						];
					});

					return new Promise(function() {
						// We have to wrap getLinks method into Promise. The returned jQuery.Deferred.promise brakes the Promise chain.
						oCrossApplicationNavigation.getLinks(aParams).then(function(aLinks) {

							if (!aLinks || !aLinks.length) {
								return resolve(oNavigationTargets.availableActions, oNavigationTargets.ownNavigation);
							}
							var oView = Utils.getViewForControl(oControl);
							var sMainSemanticObject = this.getMainSemanticObject();
							var sTextOfMainItem = this.getTextOfMainItem();
							var sDescriptionOfMainItem = this.getDescriptionOfMainItem();
							var sIconOfMainItem = this.getIconOfMainItem();
							var oUnavailableActions = this._convertSemanticObjectUnavailableAction();
							var sCurrentHash = oCrossApplicationNavigation.hrefForExternal();
							if (sCurrentHash && sCurrentHash.indexOf("?") !== -1) {
								// sCurrentHash can contain query string, cut it off!
								sCurrentHash = sCurrentHash.split("?")[0];
							}
							if (sCurrentHash) {
								// BCP 1770315035: we have to set the end-point '?' of action in order to avoid matching of "#SalesOrder-manage" in "#SalesOrder-manageFulfillment"
								sCurrentHash += "?";
							}
							// var fnGetDescription = function(sSubTitle, sShortTitle) {
							// 	if (sSubTitle && !sShortTitle) {
							// 		return sSubTitle;
							// 	} else if (!sSubTitle && sShortTitle) {
							// 		return sShortTitle;
							// 	} else if (sSubTitle && sShortTitle) {
							// 		return sSubTitle + " - " + sShortTitle;
							// 	}
							// };

							var fnIsUnavailableAction = function(sSemanticObject, sAction) {
								return !!oUnavailableActions && !!oUnavailableActions[sSemanticObject] && oUnavailableActions[sSemanticObject].indexOf(sAction) > -1;
							};
							var fnAddLink = function(oLink) {
								var oShellHash = oURLParsing.parseShellHash(oLink.intent);
								if (fnIsUnavailableAction(oShellHash.semanticObject, oShellHash.action)) {
									return;
								}
								var sHref = oCrossApplicationNavigation.hrefForExternal(oLink.intent);

								if (oLink.intent && oLink.intent.indexOf(sCurrentHash) === 0) {
									// Prevent current app from being listed
									// NOTE: If the navigation target exists in
									// multiple contexts (~XXXX in hash) they will all be skipped
									oNavigationTargets.ownNavigation = new LinkItem({
										href: sHref,
										text: oLink.text
									});
									return;
								}
								// Check if a FactSheet exists for this SemanticObject (to skip the first one found)
								// Prevent FactSheet from being listed in 'Related Apps' section. Requirement: Link with action 'displayFactSheet' should
								// be shown in the 'Main Link' Section
								var bIsMainLink = oShellHash.semanticObject === sMainSemanticObject && oShellHash.action && (oShellHash.action === 'displayFactSheet');
								var oLinkItem = new LinkItem({
									// As the retrieveNavigationTargets method can be called several time we can not create the LinkItem instance with the same id
									key: (oShellHash.semanticObject && oShellHash.action && oAppComponent && oView) ? oAppComponent.createId(oShellHash.semanticObject + "-" + oShellHash.action) : undefined,
									text: bIsMainLink && sTextOfMainItem ? sTextOfMainItem : oLink.text,
									description: bIsMainLink && sDescriptionOfMainItem ? sDescriptionOfMainItem : undefined, //fnGetDescription(oLink.subTitle, oLink.shortTitle),
									href: sHref,
									// target: not supported yet
									icon: bIsMainLink ? sIconOfMainItem : undefined, //oLink.icon,
									isMain: bIsMainLink,
									isSuperior: (oLink.tags && oLink.tags.indexOf("superiorAction") > -1)
								});
								oNavigationTargets.availableActions.push(oLinkItem);

								if (this._oInfoLog) {
									this._oInfoLog.addSemanticObjectIntent(oShellHash.semanticObject, {
										intent: oLinkItem.getHref(),
										text: oLinkItem.getText()
									});
								}
							}.bind(this);
							for (var n = 0; n < aSemanticObjects.length; n++) {
								aLinks[n][0].forEach(fnAddLink);
							}
							return resolve(oNavigationTargets.availableActions, oNavigationTargets.ownNavigation);
						}.bind(this), function() {
							SapBaseLog.error("LinkHandler: 'retrieveNavigationTargets' failed executing getLinks method");
							return resolve(oNavigationTargets.availableActions, oNavigationTargets.ownNavigation);
						});
					}.bind(this));
				}.bind(this));
			}.bind(this));
		}.bind(this));
	};

	LinkHandler.oSemanticObjects = {};
	LinkHandler.oPromise = null;
	LinkHandler.hasDistinctSemanticObject = function(aSemanticObjects) {
		if (LinkHandler._haveBeenRetrievedAllSemanticObjects(aSemanticObjects)) {
			return Promise.resolve(LinkHandler._atLeastOneExistsSemanticObject(aSemanticObjects));
		}
		return LinkHandler._retrieveDistinctSemanticObjects().then(function() {
			return LinkHandler._atLeastOneExistsSemanticObject(aSemanticObjects);
		});
	};
	LinkHandler._haveBeenRetrievedAllSemanticObjects = function(aSemanticObjects) {
		return aSemanticObjects.filter(function(sSemanticObject) {
			return !LinkHandler.oSemanticObjects[sSemanticObject];
		}).length === 0;
	};
	LinkHandler._atLeastOneExistsSemanticObject = function(aSemanticObjects) {
		return aSemanticObjects.some(function(sSemanticObject) {
			return LinkHandler.oSemanticObjects[sSemanticObject] && LinkHandler.oSemanticObjects[sSemanticObject].exists === true;
		});
	};
	LinkHandler._retrieveDistinctSemanticObjects = function() {
		if (!LinkHandler.oPromise) {
			LinkHandler.oPromise = new Promise(function(resolve) {
				var oCrossApplicationNavigation = Factory.getService("CrossApplicationNavigation");
				if (!oCrossApplicationNavigation) {
					SapBaseLog.error("LinkHandler: Service 'CrossApplicationNavigation' could not be obtained");
					return resolve({});
				}
				oCrossApplicationNavigation.getDistinctSemanticObjects().then(function(aDistinctSemanticObjects) {
					aDistinctSemanticObjects.forEach(function(sSemanticObject) {
						LinkHandler.oSemanticObjects[sSemanticObject] = {
							exists: true
						};
					});
					LinkHandler.oPromise = null;
					return resolve(LinkHandler.oSemanticObjects);
				}, function() {
					SapBaseLog.error("LinkHandler: getDistinctSemanticObjects() of service 'CrossApplicationNavigation' failed");
					return resolve({});
				});
			});
		}
		return LinkHandler.oPromise;
	};
	LinkHandler.destroyDistinctSemanticObjects = function() {
		LinkHandler.oSemanticObjects = {};
	};

	return LinkHandler;

}, /* bExport= */true);
