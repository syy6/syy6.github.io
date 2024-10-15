/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

/**
 * This class is used in connection with XMLComposite
 *
 * CAUTION: naming, location and APIs of this entity will possibly change and should
 * therefore be considered experimental
 *
 * @private
 *
 */
sap.ui.define(['jquery.sap.global',
               'sap/ui/core/XMLCompositeMetadata'
], function(jQuery, XMLCompositeMetadata) {
	"use strict";

	var mRequireCache = {};

	var MDCXMLCompositeMetadata = function (sClassName, oClassInfo) {
		XMLCompositeMetadata.apply(this, [sClassName, oClassInfo]);
		this.InvalidationMode.Template = "template";

		// aggregation fragments
		if (oClassInfo.aggregationFragments) {
			this._aggregationFragments = {};
			oClassInfo.aggregationFragments.forEach(function(sAggregationFragment) {
				this._aggregationFragments[sAggregationFragment] = this._loadFragment(oClassInfo.fragment + "_" + sAggregationFragment, "aggregation");
			}.bind(this));
		}
	};

	MDCXMLCompositeMetadata.prototype = Object.create(XMLCompositeMetadata.prototype);
	XMLCompositeMetadata.uid = XMLCompositeMetadata.uid;

	MDCXMLCompositeMetadata.prototype.usesTemplating = function () {
		var that = this;
		var fnTemplatingInFragment = function(oFragment) {
			var aTemplateNodes = oFragment.getElementsByTagNameNS("http://schemas.sap.com/sapui5/extension/sap.ui.core.template/1", "*");
			if (aTemplateNodes.length > 0) {
				return true;
			}
			var oEmbeddedFragment, aEmbeddedFragments = oFragment.getElementsByTagNameNS("sap.ui.core", "Fragment");
			for (var i = 0; i < aEmbeddedFragments.length; i++) {
				oEmbeddedFragment = that._loadFragment(aEmbeddedFragments[i].getAttribute("fragmentName"), "fragment");
				if (fnTemplatingInFragment(oEmbeddedFragment)) {
					return true;
				}
			}
			return false;
		};

		if (this._fragment) {
			if (this._bUsesTemplating === undefined) {
				this._bUsesTemplating = fnTemplatingInFragment(this._fragment);
			}
			return this._bUsesTemplating;
		}
		return false;
	};

	MDCXMLCompositeMetadata.prototype._loadFragment = function (sFragmentName, sExtension) {
		var oFragment = XMLCompositeMetadata.prototype._loadFragment.apply(this,[sFragmentName, sExtension]);
		var sFragmentKey = sExtension + "$" + sFragmentName;
		if (!mRequireCache[sFragmentKey]) {
			var sModuleNames = oFragment.getAttribute("template:require");
			if (sModuleNames && !mRequireCache[sFragmentKey]) {
				//TODO: global jquery call found
				jQuery.sap.require.apply(jQuery.sap, sModuleNames.split(" "));
			}
			mRequireCache[sFragmentKey] = true;//require applied
		}
		return oFragment;
	};

	MDCXMLCompositeMetadata.prototype.getJSONKeys = function() {
		if ( this._mJSONKeys ) {
			return this._mJSONKeys;
		}

		var mAllSettings = {},
			mJSONKeys = {};

		function addKeys(m) {
			var sName, oInfo, oPrevInfo;
			for (sName in m) {
				oInfo = m[sName];
				oPrevInfo = mAllSettings[sName];
				if ( !oPrevInfo || oInfo._iKind < oPrevInfo._iKind ) {
					mAllSettings[sName] = mJSONKeys[sName] = oInfo;
				}
				mJSONKeys[oInfo._sUID] = oInfo;
			}
		}

		addKeys(this._mAllSpecialSettings);
		addKeys(this.getAllProperties());
		addKeys(this.getAllPrivateProperties());
		addKeys(this.getAllAggregations());
		addKeys(this.getAllAssociations());
		addKeys(this.getAllEvents());

		this._mJSONKeys = mJSONKeys;
		this._mAllSettings = mAllSettings;
		return this._mJSONKeys;
	};

	return MDCXMLCompositeMetadata;
});