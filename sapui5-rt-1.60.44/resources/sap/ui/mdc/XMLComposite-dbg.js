/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define([
               'jquery.sap.global',
               'sap/ui/core/Control',
               'sap/ui/mdc/XMLCompositeMetadata',
               'sap/ui/model/base/ManagedObjectModel',
               'sap/ui/core/util/XMLPreprocessor',
               'sap/ui/model/json/JSONModel',
               'sap/ui/core/Fragment',
               'sap/ui/base/ManagedObject',
               'sap/ui/base/DataType',
               'sap/ui/model/base/XMLNodeAttributesModel',
               'sap/ui/core/util/reflection/XmlTreeModifier',
               'sap/ui/model/resource/ResourceModel',
               'sap/ui/model/base/XMLNodeUtils',
               'sap/ui/base/ManagedObjectObserver',
               'sap/base/util/ObjectPath',
               'sap/ui/base/SyncPromise',
               'sap/base/Log',
               'sap/ui/performance/Measurement',
               'sap/ui/core/XMLComposite',
               './ResourceModel'
               ], function (jQuery, Control, XMLCompositeMetadata, ManagedObjectModel, XMLPreprocessor,JSONModel, Fragment, ManagedObject, DataType, XMLNodeAttributesModel, XmlTreeModifier, ResourceModel, Utils, ManagedObjectObserver, ObjectPath, SyncPromise, Log, Measurement, XMLComposite, MDCResourceModel) {
	"use strict";

	var mControlImplementations = {};

	 function initXMLComposite(sFragment, oFragmentContext) {
		if (!mControlImplementations[sFragment]) {
			//TODO: global jquery call found
			jQuery.sap.require(sFragment);
			mControlImplementations[sFragment] = ObjectPath.get(sFragment);
		}
		return mControlImplementations[sFragment];
	}

	// TODO: be more specific about what is returned; at the moment we would return
	// also e.g. models which are not specifically defined on the composite control
	// but are propagated from outside of it. Ideally, we would only return
	// settings which are specifically defined on the XMLComposite !
	function getSettings(oPropagates) {
		var oSettings = {};
		oSettings.models = oPropagates.oModels || {};
		oSettings.bindingContexts = oPropagates.oBindingContexts || {};
		return oSettings;
	}

	function addAttributesContext(mContexts, sName, oElement, oImpl, oVisitor) {
		var oAttributesModel = new JSONModel(oElement), oMetadata = oImpl.getMetadata(), mAggregations = oMetadata.getAllAggregations(), mProperties = oMetadata.getAllProperties(), mSpecialSettings = oMetadata._mAllSpecialSettings;

		oAttributesModel.getVisitor = function () {
			return oVisitor;
		};

		//needed in the preprocessor to allow promises as result
		oAttributesModel.$$valueAsPromise = true;

		oAttributesModel._getObject = function (sPath, oContext) {
			var oResult;
			sPath = this.resolve(sPath, oContext);
			sPath = sPath.substring(1);
			var aPath = sPath.split("/");

			if (sPath && sPath.startsWith && sPath.startsWith("metadataContexts")) {
				return this._navInMetadataContexts(sPath);// note as metadataContexts is an object the path can be deep
			}

			if (mProperties.hasOwnProperty(sPath)) {
				// get a property
				var oProperty = mProperties[sPath];
				if (!oElement.hasAttribute(sPath)) {
					return oProperty.defaultValue;
				}
				// try to resolve a result from templating time or keep the original value
				return SyncPromise.resolve(oVisitor.getResult(oElement.getAttribute(sPath)) || oElement.getAttribute(sPath)).then(function(oPromiseResult) {
					if (oPromiseResult) {
						var oScalar = Utils.parseScalarType(oProperty.type, oPromiseResult, sPath);
						if (typeof oScalar === "object" && oScalar.path) {
							return oPromiseResult;
						}
						return oScalar;
					}
					return null;
				});
			} else if (mAggregations.hasOwnProperty(aPath[0])) {
				var oAggregation = mAggregations[aPath[0]];
				var oAggregationModel, oContent = XmlTreeModifier.getAggregation(oElement, aPath[0]);
				if (!oContent) {
					return null;
				}

				if (oAggregation.multiple) {
					// return a list of context
					var aContexts = [];
					for (var i = 0; i < oContent.length; i++) {
						oAggregationModel = new XMLNodeAttributesModel(oContent[i], oVisitor, "");
						aContexts.push(oAggregationModel.getContext("/"));
					}

					oResult = aContexts;
				} else {
					oAggregationModel = new XMLNodeAttributesModel(oContent, oVisitor, "");
					oAggregationModel.$$valueAsPromise = true;//for Preprocessor
					oResult = oAggregationModel.getContext("/");
				}

				aPath.shift();
				return this._getNode(aPath, oResult);
			} else if (mSpecialSettings.hasOwnProperty(sPath)) {
				var oSpecialSetting = mSpecialSettings[sPath];

				if (!oElement.hasAttribute(sPath)) {
					return oSpecialSetting.defaultValue || null;
				}

				return SyncPromise.resolve(oVisitor.getResult(oElement.getAttribute(sPath))).then(function(oPromiseResult) {
					if (oSpecialSetting.type) {
						var oScalar = Utils.parseScalarType(oSpecialSetting.type, oPromiseResult, sPath);
						if (typeof oScalar === "object" && oScalar.path) {
							return oPromiseResult;
						}
						return oScalar;
					}

					if (oPromiseResult) {
						return oPromiseResult;
					}
					return oElement.getAttribute(sPath);
				});
			}
		};

		oAttributesModel._navInMetadataContexts = function (sPath) {
			var sRemainPath = sPath.replace("metadataContexts", "");
			var aPath = sRemainPath.split("/"), vNode = mContexts["metadataContexts"].getObject();

			aPath.shift();
			return this._getNode(aPath, vNode);
		};

		oAttributesModel._getNode = function (aPath, vNode) {
			var oResult = null, sInnerPath;

			while (aPath.length > 0 && vNode) {

				if (vNode.getObject) {
					// try to nav deep
					oResult = vNode.getObject(aPath.join("/"));
				}

				if (!oResult) {
					sInnerPath = aPath.shift();
					vNode = vNode[sInnerPath];
				} else {
					return oResult;
				}
			}

			return vNode;
		};

		oAttributesModel.getContextName = function () {
			return sName;
		};

		mContexts[sName] = oAttributesModel.getContext("/");
		if (mContexts["metadataContexts"]) {
			// make attributes model available via metadataContexts
			mContexts["metadataContexts"].oModel.setProperty("/" + sName, mContexts[sName]);
		}
	}

	function addViewContext(mContexts, oVisitor) {
		var oViewModel = new JSONModel(oVisitor.getViewInfo());
		mContexts["$view"] = oViewModel.getContext("/");
	}

	function addMetadataContexts(mContexts, oVisitor, sMetadataContexts, sDefaultMetadataContexts, sDefaultMetaModel) {
		if (!sMetadataContexts && !sDefaultMetadataContexts) {
			return;
		}

		var oMetadataContexts = sMetadataContexts ? ManagedObject.bindingParser(sMetadataContexts) : { parts: [] };
		var oDefaultMetadataContexts = sDefaultMetadataContexts ? ManagedObject.bindingParser(sDefaultMetadataContexts) : { parts: [] };

		if (!oDefaultMetadataContexts.parts) {
			oDefaultMetadataContexts = { parts: [oDefaultMetadataContexts] };
		}

		if (!oMetadataContexts.parts) {
			oMetadataContexts = { parts: [oMetadataContexts] };
		}

		// merge the arrays
		jQuery.merge(oMetadataContexts.parts, oDefaultMetadataContexts.parts);

		// extend the contexts from metadataContexts
		for (var j = 0; j < oMetadataContexts.parts.length; j++) {
			addSingleContext(mContexts, oVisitor, oMetadataContexts.parts[j], oMetadataContexts, sDefaultMetaModel);
			// Make sure every previously defined context can be used in the next binding
			oVisitor = oVisitor["with"](mContexts, false);
		}

		var oMdCModel = new JSONModel(oMetadataContexts);

		// make metadataContext accessible
		mContexts["metadataContexts"] = oMdCModel.getContext("/");

	}

	function addSingleContext(mContexts, oVisitor, oCtx, oMetadataContexts, sDefaultMetaModel) {
		oCtx.model = oCtx.model || sDefaultMetaModel;

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
			mContexts["_$error"].oModel.setProperty("/" + sKey, ex);
		}
	}

	function templateAggregations(oParent, oMetadata, oContextVisitor) {
		var aAggregationFragments = oMetadata._aggregationFragments, aAggregationPromises = [],
			sLibrary = oMetadata.getLibraryName(),
			bCheckMultiple;
		if (aAggregationFragments) {
			Object.keys(aAggregationFragments).forEach(function (sAggregationName) {
				var oAggregation = oMetadata.getAggregation(sAggregationName);

				if (!oAggregation) {
					return true;
				}
				//check if there are user defined aggregations
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

				var oAggregationFragment = aAggregationFragments[sAggregationName].cloneNode(true);
				// resolve templating in composite aggregation fragment
				aAggregationPromises.push(oContextVisitor.visitChildNodes(oAggregationFragment).then(function() {
				var aAggregationNodes = Utils.getChildren(oAggregationFragment);
				var id = oParent.getAttribute("id");

				// add the templated content
				for (var j = 0; j < aAggregationNodes.length; j++) {
					if (aAggregationNodes[j].getAttribute("id")) {
						aAggregationNodes[j].setAttribute("id", Fragment.createId(id, aAggregationNodes[j].getAttribute("id")));//adapt Aggregation ids
					}
					oAggregationRoot.appendChild(aAggregationNodes[j]);
				}
				}));
			});
		}
		return Promise.all(aAggregationPromises);
	}


	function observeChanges(oChanges) {
		var oMetadata = this.getMetadata(), sName = oChanges.name,
			oMember = oMetadata.getProperty(sName) || oMetadata.getAggregation(sName) || oMetadata.getAllPrivateAggregations()[sName];

		if (oMember) {
			this._requestFragmentRetemplatingCheck(oMember);
		}
	}

	var MDCXMLComposite = XMLComposite.extend("sap.ui.mdc.XMLComposite", {
		metadata: {
			properties: {
				/**
				 * The 'hidden' _fnPopulateTemplate function for cloning in order to hook the content during the cloning
				 */
				_fnPopulateTemplate: { type: "function", visibility: 'hidden'}//will later on get visibility 'hidden'
			}
		},
		defaultMetaModel: 'sap.ui.mdc.metaModel',
		alias: "this",
		constructor : function(sId, mSettings) {
			mSettings = mSettings || {};

			var oMetadata = this.getMetadata(),
			sTemplatePropertyName = "_fnPopulateTemplate",
			sAggregationName = oMetadata.getCompositeAggregationName();

			//avoid to overrule the settings when there is an Id
			if (sId && typeof sId !== 'string') {
				mSettings = sId;
				sId = mSettings.id;
				delete mSettings.id;
			}

			if (!mSettings[sTemplatePropertyName]) {
				//this case happens if the control is not a clone as _fnPopulateTemplate gets also cloned
				mSettings[sTemplatePropertyName] = function(oClone, mSettings) {
					mSettings[sAggregationName] = this._fragmentContent;
					oClone._bIsClone = true;
				}.bind(this);//later on we could also react on promises
			} else {
				mSettings[sTemplatePropertyName](this, mSettings);
			}
			XMLComposite.apply(this,[sId, mSettings]);
		}
	}, XMLCompositeMetadata);

	MDCXMLComposite.prototype.set_fnPopulateTemplate = function (oValue, bSuppressInvalidate) {
		this.mProperties["_fnPopulateTemplate"] = oValue;
		return this;
	};

	MDCXMLComposite.prototype.init = function() {
		this.observer = new ManagedObjectObserver(observeChanges.bind(this));

		this.observer.observe(this, {
			properties: true,
			aggregations: true
		});

		if (MDCResourceModel){
			this.setModel(MDCResourceModel.getModel(), "$i18n");
		}
	};

	/**
	 * Initializes composite support with the given settings
	 * @param {map} mSettings the map of settings
	 *
	 * @private
	 */
	MDCXMLComposite.prototype._initCompositeSupport = function (mSettings) {
		var oMetadata = this.getMetadata(),
			sAggregationName = oMetadata.getCompositeAggregationName(),
			oCompositeAggregation = mSettings && sAggregationName ? mSettings[sAggregationName] : undefined;

		if (oCompositeAggregation) {
			if (oCompositeAggregation instanceof ManagedObject) {
				this._setCompositeAggregation(oCompositeAggregation);
				return;
			}
			this._fragmentContent = oCompositeAggregation;
		} else {
			if (this.getMetadata().usesTemplating()) {
				this._requestFragmentRetemplatingCheck();
				return;
			}
		}

		XMLComposite.prototype._initCompositeSupport.apply(this, [mSettings]);
	};

	/**
	 * Use the XMLComposite a a template for recreation 
	 *
	 *@return {sap.ui.mdc.XMLComposite} a new composite that is build from the current fragment structure
	 *@internal
	 */
	MDCXMLComposite.prototype.useAsTemplate = function(mSettings) {
		//similar to clone
		var oMetadata = this.getMetadata(), oClass = oMetadata._oClass, sAggregationName = oMetadata.getCompositeAggregationName();
		mSettings = mSettings || {};
		mSettings[sAggregationName] = this._fragmentContent;

		return new oClass(mSettings);
	};

	/**
	 * Called for the initial templating of an XMLComposite control
	 *
	 * @param {DOMNode}
	 *            oElement root element for templating
	 * @param {IVisitor}
	 *            oVisitor the interface of the visitor of the XMLPreprocessor
	 * @see sap.ui.core.util.XMLPreprocessor
	 * @private
	 */
	MDCXMLComposite.initialTemplating = function (oElement, oVisitor, sFragment) {
		var oImpl = initXMLComposite(sFragment),
		oErrorModel = new JSONModel({}),
		mContexts = { "_$error": oErrorModel.getContext("/") },
		oMetadata = oImpl.getMetadata(),
		oFragment = oMetadata.getFragment(),
		sDefaultMetadataContexts = oMetadata._mSpecialSettings.metadataContexts ? oMetadata._mSpecialSettings.metadataContexts.defaultValue : "";

		if (!oFragment) {
			throw new Error("Fragment " + sFragment + " not found");
		}


		// guarantee that element has an id
		if (!oElement.getAttribute("id")) {
			oElement.setAttribute("id", oMetadata.uid());
		}
		addMetadataContexts(mContexts, oVisitor, oElement.getAttribute("metadataContexts"), sDefaultMetadataContexts, oImpl.prototype.defaultMetaModel);
		addAttributesContext(mContexts, oImpl.prototype.alias, oElement, oImpl, oVisitor);
		addViewContext(mContexts,oVisitor);
		var oContextVisitor = oVisitor["with"](mContexts, true);
		// visit the children of the element in case this uses templating
		return oContextVisitor.visitChildNodes(oElement).then(function() {
			return templateAggregations(oElement, oMetadata, oContextVisitor);
		}).then(function() {
			return oContextVisitor.visitChildNodes(oFragment);
		}).then(function() {
			var oNode = oFragment.ownerDocument.createElementNS("http://schemas.sap.com/sapui5/extension/sap.ui.core.xmlcomposite/1", oMetadata.getCompositeAggregationName());
			oNode.appendChild(oFragment);
			oElement.appendChild(oNode);
		});
	};

	MDCXMLComposite.prototype._requestFragmentRetemplatingCheck = function (oMember, bForce) {
		//also allow empty member
		var bRetemplate = true;
		if (oMember) {
			bRetemplate = !this._bIsCreating && !this._bIsBeingDestroyed && !this._requestFragmentRetemplatingPending  && oMember.appData && oMember.appData.invalidate === "template";
		}

		if (!bRetemplate) {
			return;
		}

		if (!this._requestFragmentRetemplatingPending) {
			if (this.requestFragmentRetemplating) {
				this._requestFragmentRetemplatingPending = true;
				// to avoid several separate re-templating requests we collect them
				// in a timeout
				setTimeout(function () {
					this.requestFragmentRetemplating(bForce);
					this._requestFragmentRetemplatingPending = false;
				}.bind(this), 0);
			} else {
				throw new Error("Function requestFragmentRetemplating not available although invalidationMode was set to template");
			}
		}
	};

	/**
	 * Requests a re-templating of the XMLComposite control
	 *
	 * @param {boolean} bForce true forces the re-templating
	 *
	 * @private
	 */
	MDCXMLComposite.prototype.requestFragmentRetemplating = function (bForce) {
		// check all binding context of aggregations
		if (bForce) {
			return this.fragmentRetemplating();
		}

		//initial check for clone
		if (this._bIsClone && (this._renderingContent ? this._renderingContent() : this._getCompositeAggregation())) {
			delete this._bIsClone;
			return;
		}

		var mAggregations = this.getMetadata().getMandatoryAggregations(),
			bBound = true;
		for (var n in mAggregations) {
			bBound = typeof this.getBindingInfo(n) === "object";
			if (!bBound) {
				break;
			}
		}
		if (bBound) {
			this.fragmentRetemplating();
		}
	};

	/**
	 * Retemplates the XMLComposite control if a property or aggregation marked with invalidate : "template" in the metadata of the
	 * specific instance
	 *
	 * @private
	 */
	MDCXMLComposite.prototype.fragmentRetemplating = function () {
		var oMetadata = this.getMetadata(),
			oFragment = oMetadata.getFragment();

		if (!oFragment) {
			throw new Error("Fragment " + oFragment.tagName + " not found");
		}
		var oManagedObjectModel = this._getManagedObjectModel();
		var that = this;
		oManagedObjectModel.getContextName = function () {
			return that.alias;
		};
		// TODO: Can we add the Model manually to the propProp Map without setting it?
		// be more specific about which models are set

		// TODO: what happens with any previous model?  Memory leak?
		this.bindObject(this.alias + ">/");//first define the context
		this.setModel(oManagedObjectModel, this.alias);//then set the model
		oManagedObjectModel._mSettings = getSettings(this._getPropertiesToPropagate());
		delete oManagedObjectModel._mSettings.models["$" + this.alias];
		delete oManagedObjectModel._mSettings.bindingContexts["$" + this.alias];
		this.setModel(null, this.alias);
		XMLPreprocessor.process(oFragment.querySelector("*"), {}, oManagedObjectModel._mSettings);
		// now with the updated fragment, call _initCompositeSupport again on the
		// aggregation hosting the fragment
		var mSettings = {};
		mSettings[oMetadata.getCompositeAggregationName()] = oFragment;
		this._initCompositeSupport(mSettings);
	};

	/**
	 * Checks whether invalidation should be suppressed for the given aggregations
	 * Suppressing an aggregation update will only lead to rendering of the changed subtree
	 *
	 * @param {string} sName the name of the aggregation to check
	 * @param {boolean} [bSuppressInvalidate] the requested invalidation or undefined
	 *
	 * @protected
	 *
	 */
	MDCXMLComposite.prototype.getSuppressInvalidateAggregation = function (sName, bSuppressInvalidate) {
		var oMetadata = this.getMetadata(),
		oAggregation = oMetadata.getAggregation(sName) || oMetadata.getAllPrivateAggregations()[sName];
		if (!oAggregation) {
			return true;
		}
		bSuppressInvalidate = oMetadata._suppressInvalidate(oAggregation, bSuppressInvalidate);
		this._requestFragmentRetemplatingCheck(oAggregation);
		return bSuppressInvalidate;
	};

	MDCXMLComposite.prototype.destroy = function () {
		XMLComposite.prototype.destroy.apply(this, arguments);

		if (this.observer) {
			this.observer.destroy();
		}

	};

	return MDCXMLComposite;
}, true);
