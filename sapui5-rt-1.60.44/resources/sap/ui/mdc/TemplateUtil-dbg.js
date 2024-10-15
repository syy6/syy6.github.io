/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

// --------------------------------------------------------------------------------
// Utility class used to enable templating using external aggregation fragments
// --------------------------------------------------------------------------------
sap.ui.define([
	"sap/ui/base/ManagedObject", "sap/ui/core/XMLTemplateProcessor", "sap/ui/model/base/XMLNodeUtils", "sap/ui/model/json/JSONModel"
], function(ManagedObject, XMLTemplateProcessor, XMLNodeUtils, JSONModel) {
	"use strict";
	// TODO: use async APIs!

	function requireModule(sModule) {
		var sResource = sModule.replace(/\./g, "/");
		var oModule = sap.ui.require(sResource);
		if (!oModule) {
			oModule = sap.ui.requireSync(sResource);
		}
		return oModule;
	}

	function addMetadataContexts(mContexts, oVisitor, sMetadataContexts) {
		if (!sMetadataContexts) {
			return;
		}

		var oMetadataContexts = ManagedObject.bindingParser(sMetadataContexts);

		if (!oMetadataContexts.parts) {
			oMetadataContexts = {
				parts: [
					oMetadataContexts
				]
			};
		}

		// extend the contexts from metadataContexts
		for (var j = 0; j < oMetadataContexts.parts.length; j++) {
			addSingleContext(mContexts, oVisitor, oMetadataContexts.parts[j], oMetadataContexts);
			// Make sure every previously defined context can be used in the next binding
			oVisitor = oVisitor["with"](mContexts, false);
		}

		var oMdCModel = new JSONModel(oMetadataContexts);

		// make metadataContext accessible
		mContexts["metadataContexts"] = oMdCModel.getContext("/");

	}

	function addSingleContext(mContexts, oVisitor, oCtx, oMetadataContexts) {
		var sKey = oCtx.name || oCtx.model || undefined;

		if (oMetadataContexts[sKey]) {
			return; // do not add twice
		}
		try {
			mContexts[sKey] = oVisitor.getContext(oCtx.model + ">" + oCtx.path);// add the context to the visitor
			oMetadataContexts[sKey] = mContexts[sKey];// make it available inside metadataContexts JSON object
		} catch (ex) {
			// ignore the context as this can only be the case if the model is not ready, i.e. not a preprocessing model but maybe a model for
			// providing afterwards
			if (!mContexts["_$error"]) {
				mContexts["_$error"] = {};
			}
			mContexts["_$error"].sKey = ex;
		}
	}

	function templateAggregations(oParent, oMetadata, oContextVisitor, mAggregationFragments) {
		var aAggregationPromises = [], sLibrary = oMetadata.getLibraryName(), bCheckMultiple;
		if (mAggregationFragments) {
			Object.keys(mAggregationFragments).forEach(function(sAggregationName) {
				var oAggregation = oMetadata.getAggregation(sAggregationName);

				if (!oAggregation) {
					return true;
				}

				// check if there are user defined aggregations
				var oAggregationRoot = oParent.getElementsByTagNameNS(sLibrary, sAggregationName)[0];
				if (!oAggregationRoot) {
					oAggregationRoot = document.createElementNS(sLibrary, sAggregationName);
					oParent.appendChild(oAggregationRoot);
					bCheckMultiple = false;
				} else {
					bCheckMultiple = true;
				}

				if (bCheckMultiple && !oAggregation.multiple) {
					return true;// in case the user defined own content this shall win
				}

				// load aggregationFragment ending with aggregation.xml
				var oFragment = XMLTemplateProcessor.loadTemplate(mAggregationFragments[sAggregationName], "aggregation");

				if (oFragment) {
					var sModuleNames = oFragment.getAttribute("template:require");
					if (sModuleNames) {
						var aModules = sModuleNames.split(" ");
						aModules.forEach(requireModule);
					}

					// resolve template in composite aggregation fragment
					aAggregationPromises.push(oContextVisitor.visitChildNodes(oFragment).then(function() {
						var aAggregationNodes = XMLNodeUtils.getChildren(oFragment);
						var sParentId = oParent.getAttribute("id"), sAggregationId;

						// add the template content
						if (sParentId) {
							for (var j = 0; j < aAggregationNodes.length; j++) {
								sAggregationId = aAggregationNodes[j].getAttribute("id");
								if (sAggregationId) {
									aAggregationNodes[j].setAttribute("id", sParentId + "--" + sAggregationId);
								}
								oAggregationRoot.appendChild(aAggregationNodes[j]);
							}
						}
					}));
				}
			});
		}
		return Promise.all(aAggregationPromises);
	}

	/**
	 * Utility class used to enable templating using external aggregation fragments
	 * 
	 * @private
	 * @experimental This module is only for internal/experimental use!
	 */
	var TemplateUtil = {

		/**
		 * Called for the initial templating of a control
		 * 
		 * @param {DOMNode} oElement root element for templating
		 * @param {IVisitor} oVisitor the interface of the visitor of the XMLPreprocessor
		 * @param {string} sModule the module/class name
		 * @param {Object} mAggregationFragments map of aggregationFragments
		 * @see sap.ui.core.util.XMLPreprocessor
		 * @returns {Object} result of intialTemplating
		 * @private
		 */
		initialTemplating: function(oElement, oVisitor, sModule, mAggregationFragments) {
			var oImpl = requireModule(sModule), mContexts = {}, oMetadata = oImpl && oImpl.getMetadata();

			// guarantee that element has an id
			if (!oElement.getAttribute("id")) {
				oElement.setAttribute("id", oMetadata.uid());
			}
			addMetadataContexts(mContexts, oVisitor, oElement.getAttribute("metadataContexts"));

			var oContextVisitor = oVisitor["with"](mContexts, true);
			// visit the children of the element in case this uses templating
			return oContextVisitor.visitChildNodes(oElement).then(function() {
				return templateAggregations(oElement, oMetadata, oContextVisitor, mAggregationFragments);
			});
		}
	};

	return TemplateUtil;
}, /* bExport= */false);
