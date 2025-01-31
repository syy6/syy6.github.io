/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define([
	"sap/ui/thirdparty/jquery",
	"sap/ui/core/Component",
	"sap/ui/core/util/reflection/BaseTreeModifier",
	"sap/ui/thirdparty/hasher",
	"sap/base/Log",
	"sap/base/util/UriParameters",
	"sap/base/util/uid",
	"sap/base/strings/formatMessage",
	"sap/ui/base/ManagedObject",
	"sap/ui/core/mvc/View"
],
function(
	jQuery,
	Component,
	BaseTreeModifier,
	hasher,
	Log,
	UriParameters,
	uid,
	formatMessage,
	ManagedObject,
	View
) {
	"use strict";
	//Stack of layers in the layered repository
	var aLayers = [
			"VENDOR",
			"PARTNER",
			"CUSTOMER_BASE",
			"CUSTOMER",
			"USER"
		];
	//Precalculates index of layers
	var mLayersIndex = {};
	aLayers.forEach(function(sLayer, iIndex){
		mLayersIndex[sLayer] = iIndex;
	});

	/**
	 * Provides utility functions for the SAPUI5 flexibility library
	 *
	 * @namespace
	 * @alias sap.ui.fl.Utils
	 * @author SAP SE
	 * @version 1.60.42
	 * @experimental Since 1.25.0
	 */
	var Utils = {

		_aLayers : aLayers,
		_mLayersIndex : mLayersIndex,
		_sTopLayer : aLayers[aLayers.length - 1],
		_sMaxLayer : aLayers[aLayers.length - 1],
		DEFAULT_APP_VERSION : "DEFAULT_APP_VERSION",
		APP_ID_AT_DESIGN_TIME : "${pro" + "ject.art" + "ifactId}", //avoid replaced by content of sap.ui.fl placeholder at build steps
		/**
		 * log object exposes available log functions
		 *
		 * @name sap.ui.fl.Utils.log
		 * @public
		 */
		log: {
			error: function (sMessage, sDetails, sComponent) {
				Log.error(sMessage, sDetails, sComponent);
			},
			warning: function (sMessage, sDetails, sComponent) {
				Log.warning(sMessage, sDetails, sComponent);
			},
			debug: function (sMessage, sDetails, sComponent) {
				Log.debug(sMessage, sDetails, sComponent);
			},
			info: function (sMessage, sDetails, sComponent) {
				Log.info(sMessage, sDetails, sComponent);
			}
		},

		/**
		 * Formats the log message by replacing placeholders with values and logging the message.
		 *
		 * @param {string} sLogType - Logging type to be used. Possible values: info | warning | debug | error
		 * @param {array.<string>} aMessageComponents - Individual parts of the message text
		 * @param {array.<any>} aValuesToInsert - The values to be used instead of the placeholders in the message
		 * @param {string} [sCallStack] - Passes the callstack to the logging function
		 */
		formatAndLogMessage: function(sLogType, aMessageComponents, aValuesToInsert, sCallStack) {
			var sLogMessage = aMessageComponents.join(' ');
			sLogMessage = formatMessage(sLogMessage, aValuesToInsert);
			this.log[sLogType](sLogMessage, sCallStack || "");
		},

		/**
		 * Tries to retrieve the xsrf token from the controls OData Model. Returns empty string if retrieval failed.
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 * @returns {String} XSRF Token
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.getXSRFTokenFromControl
		 */
		getXSRFTokenFromControl: function (oControl) {
			var oModel;
			if (!oControl) {
				return "";
			}

			// Get Model
			if (oControl && typeof oControl.getModel === "function") {
				oModel = oControl.getModel();
				return Utils._getXSRFTokenFromModel(oModel);
			}
			return "";
		},

		/**
		 * Returns XSRF Token from the Odata Model. Returns empty string if retrieval failed
		 *
		 * @param {sap.ui.model.odata.ODataModel} oModel - OData Model
		 * @returns {String} XSRF Token
		 * @private
		 */
		_getXSRFTokenFromModel: function (oModel) {
			var mHeaders;
			if (!oModel) {
				return "";
			}
			if (typeof oModel.getHeaders === "function") {
				mHeaders = oModel.getHeaders();
				if (mHeaders) {
					return mHeaders["x-csrf-token"];
				}
			}
			return "";
		},

		/**
		 * Returns the class name of the component the given control belongs to.
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 *
		 * @returns {String} The component class name, ending with ".Component"
		 * @see sap.ui.core.Component.getOwnerIdFor
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.getComponentClassName
		 */
		getComponentClassName: function (oControl) {
			var oAppComponent;

			// determine UI5 component out of given control
			if (oControl) {
				// always return the app component
				oAppComponent = this.getAppComponentForControl(oControl);

				// check if the component is an application variant and assigned an application descriptor then use this as reference
				if (oAppComponent) {
					var sVariantId = this._getComponentStartUpParameter(oAppComponent, "sap-app-id");
					if (sVariantId) {
						return sVariantId;
					}

					if (oAppComponent.getManifestEntry("sap.ui5") && oAppComponent.getManifestEntry("sap.ui5").appVariantId) {
						return oAppComponent.getManifestEntry("sap.ui5").appVariantId;
					}
				}
			}

			return Utils.getComponentName(oAppComponent);
		},

		isVariantByStartupParameter: function (oControl) {
			// determine UI5 component out of given control
			if (oControl) {
				var oAppComponent = this.getAppComponentForControl(oControl);
				if (oAppComponent) {
					return !!this._getComponentStartUpParameter(oAppComponent, "sap-app-id");
				}
			}

			return false;
		},

		/**
		 * Returns the class name of the application component owning the passed component or the component name itself if
		 * this is already an application component.
		 *
		 * @param {sap.ui.core.Component} oComponent - SAPUI5 component
		 * @returns {String} The component class name, ending with ".Component"
		 * @see sap.ui.core.Component.getOwnerIdFor
		 * @public
		 * @since 1.40
		 * @function
		 * @name getAppComponentClassNameForComponent
		 */
		getAppComponentClassNameForComponent: function (oComponent) {
			return Utils.getComponentClassName(oComponent);
		},

		/**
		 * Returns the appDescriptor of the component for the given control
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 * @returns {object} that represent the appDescriptor
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.getAppDescriptor
		 */
		getAppDescriptor: function (oControl) {
			var oManifest = null, oComponent = null, oComponentMetaData = null;

			// determine UI5 component out of given control
			if (oControl) {
				oComponent = this.getAppComponentForControl(oControl);

				// determine manifest out of found component
				if (oComponent && oComponent.getMetadata) {
					oComponentMetaData = oComponent.getMetadata();
					if (oComponentMetaData && oComponentMetaData.getManifest) {
						oManifest = oComponentMetaData.getManifest();
					}
				}
			}

			return oManifest;
		},

		/**
		 * Returns the siteId of a component
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 * @returns {string} siteId - that represent the found siteId
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.getSiteId
		 */
		getSiteId: function (oControl) {
			var sSiteId = null, oAppComponent = null;

			// determine UI5 component out of given control
			if (oControl) {
				oAppComponent = this.getAppComponentForControl(oControl);

				// determine siteId from ComponentData
				if (oAppComponent) {

					//Workaround for back-end check: isApplicationPermitted
					//As long as FLP does not know about appDescriptorId we have to pass siteID and applicationID.
					//With startUpParameter hcpApplicationId we will get a concatenation of “siteId:applicationId”

					//sSiteId = this._getComponentStartUpParameter(oComponent, "scopeId");
					sSiteId = this._getComponentStartUpParameter(oAppComponent, "hcpApplicationId");

				}
			}

			return sSiteId;
		},

		/**
		 * Returns the siteId of a component when you already have the component data.
		 *
		 * @param {object} oComponentData - Component data
		 * @returns {string} siteId - that represent the found siteId
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.getSiteIdByComponentData
		 */
		getSiteIdByComponentData: function (oComponentData) {
			var sSiteId = null;

			sSiteId = this._getStartUpParameter(oComponentData, "hcpApplicationId");

			return sSiteId;
		},

		/**
		 * Indicates if the current application is a variant of an existing one and the VENDOR layer is selected
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 * @returns {boolean} true if application is a variant and the VENDOR layer selected
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.isAppVariantMode
		 */
		isAppVariantMode: function (oControl) {
			return (Utils.isVendorLayer() && Utils.isApplicationVariant(oControl));
		},

		/**
		 * Indicates if the property value represents a binding
		 *
		 * @param {object} oPropertyValue - property value
		 * @returns {boolean} true if value represents a binding
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.isBinding
		 */
		isBinding: function (oPropertyValue) {
			var bIsBinding = false;
			if (oPropertyValue && typeof oPropertyValue === "string" && oPropertyValue.substring(0, 1) === "{" && oPropertyValue.slice(-1) === "}") {
				bIsBinding = true;
			}
			return bIsBinding;
		},

		/**
		 * Indicates if the VENDOR is selected
		 *
		 * @returns {boolean} true if it's an application variant
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.isVendorLayer
		 */
		isVendorLayer: function () {
			// variant mode only supported for vendor other types are not allowed to change standard control variants
			if (Utils.getCurrentLayer(false) === "VENDOR") {
				return true;
			}

			return false;
		},

		/**
		 * Indicates if the current application is a variant of an existing one
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 * @returns {boolean} true if it's an application variant
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.isApplicationVariant
		 */
		isApplicationVariant: function (oControl) {
			var sFlexReference = Utils.getComponentClassName(oControl);
			var oAppComponent = Utils.getAppComponentForControl(oControl);
			var sComponentName = Utils.getComponentName(oAppComponent);
			return sFlexReference !== sComponentName;
		},

		/**
		 * Sets the top layer that the changes are applied to; if max layer is not specified, the highest layer in the layer stack is used.
		 *
		 * @param {string} sMaxLayer (optional) - name of the max layer
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.setMaxLayerParameter
		 */
		setMaxLayerParameter: function(sMaxLayer) {
			this._sMaxLayer = sMaxLayer || this._sTopLayer;
		},

		/**
		 * Converts layer name into index
		 * @param {string} sLayer - layer name
		 * @returns {int} index of the layer
		 * @function
		 * @name sap.ui.fl.Utils.getLayerIndex
		 */
		getLayerIndex: function(sLayer) {
			return this._mLayersIndex[sLayer];
		},

		/**
		 * Determines whether a layer is higher than the max layer.
		 *
		 * @param {string} sLayer - Layer name to be evaluated
		 * @returns {boolean} <code>true</code> if input layer is higher than max layer, otherwise <code>false</code>
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.isOverMaxLayer
		 */
		isOverMaxLayer: function(sLayer) {
			return (this.getLayerIndex(sLayer) > this.getLayerIndex(this._sMaxLayer));
		},

		/**
		 * Compares current layer with a provided layer
		 * -1: Lower layer, 0: Same layer, 1: Layer above
		 *
		 * @param {String} sLayer - Layer name to be evaluated
		 * @param {String} [sCurrentLayer] - Current layer name to be evaluated, if not provided the layer is taken from URL parameter
		 * @returns {int} -1: Lower layer, 0: Same layer, 1: Layer above
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.isLayerOverCurrentLayer
		 */
		compareAgainstCurrentLayer: function(sLayer, sCurrentLayer) {
			var sCurrent = sCurrentLayer || Utils.getCurrentLayer(false);
			// If sLayer is undefined, it is assumed it be on the lowest layer
			if ((this.getLayerIndex(sCurrent) > this.getLayerIndex(sLayer)) || !sLayer) {
				return -1;
			} else if (this.getLayerIndex(sCurrent) === this.getLayerIndex(sLayer)) {
				return 0;
			} else {
				return 1;
			}
		},

		/**
		 * Determines if filtering of changes based on layer is required.
		 *
		 * @returns {boolean} <code>true</code> if the top layer is also the max layer, otherwise <code>false</code>
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.isLayerFilteringRequired
		 */
		isLayerFilteringRequired: function() {
			return !(this._sTopLayer === this._sMaxLayer);
		},

		/**
		 * Determines the content for a given startUpParameter name
		 *
		 * @param {sap.ui.core.Component} oComponent - component instance
		 * @param {String} sParameterName - startUpParameterName that shall be determined
		 * @returns {String} content of found startUpParameter
		 * @private
		 */
		_getComponentStartUpParameter: function (oComponent, sParameterName) {
			var startUpParameterContent = null;

			if (sParameterName) {
				if (oComponent && oComponent.getComponentData) {
					startUpParameterContent = this._getStartUpParameter(oComponent.getComponentData(), sParameterName);
				}
			}

			return startUpParameterContent;
		},

		_getStartUpParameter: function (oComponentData, sParameterName) {
			if (oComponentData && oComponentData.startupParameters && sParameterName) {
				if (Array.isArray(oComponentData.startupParameters[sParameterName])) {
					return oComponentData.startupParameters[sParameterName][0];
				}
			}
		},

		/**
		 * Gets the component name for a component instance.
		 *
		 * @param {sap.ui.core.Component} oComponent component instance
		 * @returns {String} component name
		 * @public
		 */
		getComponentName: function (oComponent) {
			var sComponentName = "";
			if (oComponent) {
				sComponentName = oComponent.getMetadata().getName();
			}
			if (sComponentName.length > 0 && sComponentName.indexOf(".Component") < 0) {
				sComponentName += ".Component";
			}
			return sComponentName;
		},

		/**
		 * Gets the component instance for a component ID.
		 *
		 * @param {String} sComponentId component ID
		 * @returns {sap.ui.core.Component} component for the component ID
		 * @private
		 */
		_getComponent: function (sComponentId) {
			var oComponent;
			if (sComponentId) {
				oComponent = Component.get(sComponentId);
			}
			return oComponent;
		},

		/**
		 * Returns ComponentId of the control. If the control has no component, it walks up the control tree in order to find a control having one
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 * @returns {String} The component id or empty string if component id couldn't be found
		 * @see sap.ui.core.Component.getOwnerIdFor
		 * @private
		 */
		_getComponentIdForControl: function (oControl) {
			var sComponentId = Utils._getOwnerIdForControl(oControl);
			if (!sComponentId) {
				if (oControl && typeof oControl.getParent === "function") {
					return Utils._getComponentIdForControl(oControl.getParent());
				}
			}
			return sComponentId || "";
		},

		/**
		 * Returns the Component that belongs to given control. If the control has no component, it walks up the control tree in order to find a
		 * control having one.
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 * @returns {sap.ui.core.Component} found component
		 * @public
		 */
		getComponentForControl: function (oControl) {
			return Utils._getComponentForControl(oControl);
		},

		/**
		 * Returns the component that belongs to the passed control whose type is "application".
		 * If the control has no component, it walks up the control tree in order to find a control having one.
		 *
		 * @param {sap.ui.base.ManagedObject} oControl - Managed object instance
		 * @returns {sap.ui.core.Component} component instance if found or null
		 * @public
		 */
		getAppComponentForControl: function (oControl) {
			var oComponent = oControl instanceof Component ? oControl : this._getComponentForControl(oControl);
			return this._getAppComponentForComponent(oComponent);
		},

		/**
		 * Returns the Component that belongs to given control. If the control has no component, it walks up the control tree in order to find a
		 * control having one.
		 *
		 * @param {sap.ui.base.ManagedObject} oControl - Managed object instance
		 * @returns {sap.ui.core.Component|null} found component
		 * @private
		 */
		_getComponentForControl: function (oControl) {
			var oComponent = null;
			var sComponentId = null;

			// determine UI5 component out of given control
			if (oControl) {
				sComponentId = Utils._getComponentIdForControl(oControl);
				if (sComponentId) {
					oComponent = Utils._getComponent(sComponentId);
				}
			}

			return oComponent;
		},

		/**
		 * Returns the Component that belongs to given component whose type is "application".
		 *
		 * @param {sap.ui.core.Component} oComponent - SAPUI5 component
		 * @returns {sap.ui.core.Component|null} component instance if found or null
		 * @private
		 */
		_getAppComponentForComponent: function (oComponent) {
			var oSapApp = null;
			// special case for Fiori Elements to reach the real appComponent
			if (oComponent && oComponent.getAppComponent) {
				return oComponent.getAppComponent();
			}

			// special case for OVP
			if (oComponent && oComponent.oComponentData && oComponent.oComponentData.appComponent) {
				return oComponent.oComponentData.appComponent;
			}

			if (oComponent && oComponent.getManifestEntry) {
				oSapApp = oComponent.getManifestEntry("sap.app");
			} else {
				// if no manifest entry
				return oComponent;
			}

			if (oSapApp && oSapApp.type && oSapApp.type !== "application") {
				if (oComponent instanceof Component) {
					// we need to call this method only when the component is an instance of Component in order to walk up the tree
					// returns owner app component
					oComponent = this._getComponentForControl(oComponent);
				}
				return this.getAppComponentForControl(oComponent);
			}

			return oComponent;
		},

		/**
		 * Returns the parent view of the control. If there are nested views, only the one closest to the control will be returned. If no view can be
		 * found, undefiend will be returned.
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 * @returns {sap.ui.core.mvc.View} The view
		 * @see sap.ui.core.Component.getOwnerIdFor
		 * @public
		 */
		getViewForControl: function (oControl) {
			return Utils.getFirstAncestorOfControlWithControlType(oControl, sap.ui.core.mvc.View);

		},

		getFirstAncestorOfControlWithControlType: function (oControl, controlType) {
			if (oControl instanceof controlType) {
				return oControl;
			}

			if (oControl && typeof oControl.getParent === "function") {
				oControl = oControl.getParent();
				return Utils.getFirstAncestorOfControlWithControlType(oControl, controlType);
			}
		},

		hasControlAncestorWithId: function (sControlId, sAncestorControlId) {
			var oControl;

			if (sControlId === sAncestorControlId) {
				return true;
			}

			oControl = sap.ui.getCore().byId(sControlId);
			while (oControl) {

				if (oControl.getId() === sAncestorControlId) {
					return true;
				}

				if (typeof oControl.getParent === "function") {
					oControl = oControl.getParent();
				} else {
					return false;
				}
			}

			return false;
		},

		/**
		 * Checks whether the provided control is a view
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 * @returns {Boolean} Flag
		 * @see sap.ui.core.Component.getOwnerIdFor
		 * @private
		 */
		_isView: function (oControl) {
			return oControl instanceof View;
		},

		/**
		 * Returns OwnerId of the control
		 *
		 * @param {sap.ui.core.Control} oControl - SAPUI5 control
		 * @returns {String} The owner id
		 * @see sap.ui.core.Component.getOwnerIdFor
		 * @private
		 */
		_getOwnerIdForControl: function (oControl) {
			return Component.getOwnerIdFor(oControl);
		},

		/**
		 * Returns the current layer as defined by the url parameter. If the end user flag is set, it always returns "USER".
		 *
		 * @param {boolean} bIsEndUser - the end user flag
		 * @returns {string} the current layer
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.getCurrentLayer
		 */
		getCurrentLayer: function (bIsEndUser) {
			var oUriParams, layer;
			if (bIsEndUser) {
				return "USER";
			}

			oUriParams = this._getUriParameters();
			layer = oUriParams.mParams["sap-ui-layer"];
			if (layer && layer.length > 0) {
				return layer[0];
			}
			return "CUSTOMER";

		},

		/**
		 * Checks if a shared newly created variant requires an ABAP package; this is relevant for the VENDOR, PARTNER and CUSTOMER_BASE layers,
		 * whereas variants in the CUSTOMER layer are client-dependent content and can either be transported or stored as local objects ($TMP).
		 * A variant in the CUSTOMER layer that will be transported must not be assigned to a package.
		 *
		 * @returns {boolean} - Indicates whether a new variant needs an ABAP package
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.doesSharedVariantRequirePackage
		 */
		doesSharedVariantRequirePackage: function () {
			var sCurrentLayer;
			sCurrentLayer = Utils.getCurrentLayer(false);
			if ((sCurrentLayer === "VENDOR") || (sCurrentLayer === "PARTNER") || (sCurrentLayer === "CUSTOMER_BASE")) {
				return true;
			}

			return false;
		},

		/**
		 * Returns the tenant number for the communication with the ABAP back end.
		 *
		 * @public
		 * @function
		 * @returns {string} the current client
		 * @name sap.ui.fl.Utils.getClient
		 */
		getClient: function () {
			var oUriParams, client;
			oUriParams = this._getUriParameters();
			client = oUriParams.mParams["sap-client"];
			if (client && client.length > 0) {
				return client[0];
			}
			return undefined;
		},

		_getUriParameters: function () {
			return new UriParameters(window.location.href);
		},
		/**
		 * Returns whether the hot fix mode is active (url parameter hotfix=true)
		 *
		 * @public
		 * @returns {boolean} is hotfix mode active, or not
		 */
		isHotfixMode: function () {
			var oUriParams, aIsHotfixMode, sIsHotfixMode;
			oUriParams = this._getUriParameters();
			aIsHotfixMode = oUriParams.mParams["hotfix"];
			if (aIsHotfixMode && aIsHotfixMode.length > 0) {
				sIsHotfixMode = aIsHotfixMode[0];
			}
			return (sIsHotfixMode === "true");
		},

		/**
		 * Converts the browser language into a 2-character ISO 639-1 language. If the browser language is in format RFC4646, the first part will be
		 * used: For example en-us will be converted to EN. If the browser language already is in ISO 639-1, it will be returned after an upper case
		 * conversion: For example de will be converted to DE.
		 *
		 * @param {String} sBrowserLanguage - Language in RFC4646
		 * @returns {String} Language in ISO 639-1. Empty string if conversion was not successful
		 * @public
		 * @function
		 * @name sap.ui.fl.Utils.convertBrowserLanguageToISO639_1
		 */
		convertBrowserLanguageToISO639_1: function (sBrowserLanguage) {
			if (!sBrowserLanguage || typeof sBrowserLanguage !== "string") {
				return "";
			}

			var nIndex = sBrowserLanguage.indexOf("-");
			if ((nIndex < 0) && (sBrowserLanguage.length <= 2)) {
				return sBrowserLanguage.toUpperCase();
			}
			if (nIndex > 0 && nIndex <= 2) {
				return sBrowserLanguage.substring(0, nIndex).toUpperCase();
			}

			return "";
		},

		/**
		 * Returns the current language in ISO 639-1 format.
		 *
		 * @returns {String} Language in ISO 639-1. Empty string if language cannot be determined
		 * @public
		 */
		getCurrentLanguage: function () {
			var sLanguage = sap.ui.getCore().getConfiguration().getLanguage();
			return Utils.convertBrowserLanguageToISO639_1(sLanguage);
		},

		/**
		 * Retrieves the controlType of the control
		 *
		 * @param {sap.ui.core.Control} oControl Control instance
		 * @returns {string} control type of the control - undefined if controlType cannot be determined
		 * @private
		 */
		getControlType: function (oControl) {
			var oMetadata;
			if (oControl && typeof oControl.getMetadata === "function") {
				oMetadata = oControl.getMetadata();
				if (oMetadata && typeof oMetadata.getElementName === "function") {
					return oMetadata.getElementName();
				}
			}
		},

		/**
		 * Converts ASCII coding into a string. Required for restoring stored code extensions
		 *
		 * @param {String} ascii string containing ascii code valid numbers separated by ','
		 * @returns {String} parsedString parsed string
		 */
		asciiToString: function (ascii) {
			var asciiArray = ascii.split(",");
			var parsedString = "";

			jQuery.each(asciiArray, function (index, asciiChar) {
				parsedString += String.fromCharCode(asciiChar);
			});

			return parsedString;

		},

		/**
		 * Converts a string into ASCII coding. Required for restoring stored code extensions
		 *
		 * @param {String} string string which has to be encoded
		 * @returns {String} ascii imput parsed to ascii numbers separated by ','
		 */
		stringToAscii: function (string) {
			var ascii = "";

			for (var i = 0; i < string.length; i++) {
				ascii += string.charCodeAt(i) + ",";
			}

			// remove last ","
			ascii = ascii.substring(0, ascii.length - 1);

			return ascii;
		},

		/**
		 * See {@link sap.ui.core.BaseTreeModifier#checkControlId} method
		 */
		checkControlId: function (vControl, oAppComponent, bSuppressLogging) {
			if (!oAppComponent) {
				vControl = vControl instanceof ManagedObject ? vControl : sap.ui.getCore().byId(vControl);
				oAppComponent = Utils.getAppComponentForControl(vControl);
			}
			return BaseTreeModifier.checkControlId(vControl, oAppComponent, bSuppressLogging);
		},

		/**
		 * See {@link sap.ui.core.BaseTreeModifier#hasLocalIdSuffix} method
		 */
		hasLocalIdSuffix: BaseTreeModifier.hasLocalIdSuffix,

		/**
		 * Returns the a string containing all url parameters of the current window.location
		 *
		 * @returns {string} Substring of url containing the url query parameters
		 * @private
		 */
		_getAllUrlParameters: function () {
			return window.location.search.substring(1);
		},

		/**
		 * Returns a map of technical parameters for the passed component.
		 *
		 * @param  {object} oComponent - Component instance used to get the technical parameters
		 * @returns {object|undefined} Returns the requested technical parameter object or undefined if unavailable
		 */
		getTechnicalParametersForComponent : function(oComponent){
			return oComponent
				&& oComponent.getComponentData
				&& oComponent.getComponentData()
				&& oComponent.getComponentData().technicalParameters;
		},

		/**
		 * Returns URL hash when ushell container is available
		 *
		 * @returns {object} Returns the parsed URL hash object or an empty object if ushell container is not available
		 */
		getParsedURLHash : function(){
			var oUshellContainer = Utils.getUshellContainer();
			if (oUshellContainer) {
				var oURLParser = oUshellContainer.getService("URLParsing");
				var oParsedHash = oURLParser.parseShellHash(hasher.getHash());
				return oParsedHash ? oParsedHash : { };
			}
			return { };
		},

		/**
		 * Sets the values for url hash and technical parameters for the component data.
		 * Deactivates hash based navigation while performing the operations, which is then re-activated upon completion.
		 * If the passed doesn't exist in the url hash or technical parameters, then a new object is added respectively.
		 *
		 * @param {object} oComponent Component instance used to get the technical parameters
		 * @param {string} sParameterName Name of the parameter (e.g. "sap-ui-fl-control-variant-id")
		 * @param {string[]} aValues Array of values for the technical parameter
		 */
		setTechnicalURLParameterValues: function (oComponent, sParameterName, aValues) {
				var oParsedHash = Utils.getParsedURLHash(sParameterName);

				if (oParsedHash.params) {
					hasher.changed.active = false; //disable changed signal

					var mTechnicalParameters = Utils.getTechnicalParametersForComponent(oComponent);
					// if mTechnicalParameters are not available we write a warning and continue updating the hash
					if (!mTechnicalParameters) {
						this.log.warning("Component instance not provided, so technical parameters in component data and browser history remain unchanged");
					}
					if (aValues.length === 0) {
						delete oParsedHash.params[sParameterName];
						mTechnicalParameters && delete mTechnicalParameters[sParameterName]; // Case when ControlVariantsAPI.clearVariantParameterInURL is called with a parameter
					} else {
						oParsedHash.params[sParameterName] = aValues;
						mTechnicalParameters && (mTechnicalParameters[sParameterName] = aValues); // Technical parameters need to be in sync with the URL hash
					}
					hasher.replaceHash(Utils.getUshellContainer().getService("URLParsing").constructShellHash(oParsedHash)); // Set hash without dispatching changed signal nor writing history
					hasher.changed.active = true; // Re-enable signal
				}
		},

		/**
		 * Checks the SAPUI5 debug settings to determine whether all or at least the <code>sap.ui.fl</code> library is debugged.
		 *
		 * @returns {boolean} Returns a flag if the flexibility library is debugged
		 * @public
		 */
		isDebugEnabled: function () {
			var oUriParams = this._getUriParameters();
			var sDebugParameters = oUriParams.get("sap-ui-debug") || "";

			// true if SAPUI5 is in complete debug mode
			if (sap.ui.getCore().getConfiguration().getDebug() || sDebugParameters === "true") {
				return true;
			}

			var aDebugParameters = sDebugParameters.split(",");
			return aDebugParameters.indexOf("sap/ui/fl") !== -1 || aDebugParameters.indexOf("sap/ui/fl/") !== -1;
		},

		/**
		 * Returns the value of the specified url parameter of the current url
		 *
		 * @param {String} sParameterName - Name of the url parameter
		 * @returns {string} url parameter
		 * @private
		 */
		getUrlParameter: function (sParameterName) {
			return new UriParameters(window.location.href).get(sParameterName);
		},

		/**
		 * Returns ushell container if available
		 *
		 * @returns {object|undefined} Returns ushell container object if available or undefined
		 */
		getUshellContainer: function() {
			return sap.ushell && sap.ushell.Container;
		},

		createDefaultFileName: function (sNameAddition) {
			var sFileName = uid().replace(/-/g, "_");
			if (sNameAddition) {
				sFileName += '_' + sNameAddition;
			}
			return sFileName;
		},

		createNamespace: function (oPropertyBag, sSubfolder) {
			var sReferenceName = oPropertyBag.reference.replace('.Component', '');
			var sNamespace = 'apps/' + sReferenceName + "/" + sSubfolder + "/";
			return sNamespace;
		},

		/**
		 * builds the root namespace with a given base ID and project ID for the following scenarios:
		 * App Variants, adaptation project, adapting new fiori elements app and UI adaptation
		 *
		 * @param {string} sBaseId base ID
		 * @param {string} sScenario current scenario
		 * @param {string} sProjectId project ID
		 * @returns {string} Returns the root LRep namespace
		 */
		buildLrepRootNamespace: function(sBaseId, sScenario, sProjectId) {
			var sRootNamespace = "apps/";
			var oError = new Error("Error in sap.ui.fl.Utils#buildLrepRootNamespace: ");

			if (!sBaseId) {
				oError.message += "for every scenario you need a base ID";
				throw oError;
			}

			switch (sScenario) {
				case sap.ui.fl.Scenario.AppVariant:
					if (!sProjectId) {
						oError.message += "in an app variant scenario you additionaly need a project ID";
						throw oError;
					}
					sRootNamespace += sBaseId + "/appVariants/" + sProjectId + "/";
					break;
				case sap.ui.fl.Scenario.AdaptationProject:
					if (!sProjectId) {
						oError.message += "in a adaptation project scenario you additionaly need a project ID";
						throw oError;
					}
					sRootNamespace += sBaseId + "/adapt/" + sProjectId + "/";
					break;
				case sap.ui.fl.Scenario.FioriElementsFromScratch:
				case sap.ui.fl.Scenario.UiAdaptation:
				default:
					sRootNamespace += sBaseId + "/";
			}

			return sRootNamespace;
		},

		isApplication: function (oManifest) {
			return (oManifest && oManifest.getEntry && oManifest.getEntry("sap.app") && oManifest.getEntry("sap.app").type === "application");
		},

		isEmbeddedComponent: function (oComponent) {
			return oComponent instanceof Component && !!oComponent.getManifestEntry("sap.app") && oComponent.getManifestEntry("sap.app").type === "component";
		},

		/**
		 * Returns the reference of a component, according to the following logic:
		 * First appVariantId, if not, componentName + ".Component", if not appId + ".Component".
		 *
		 * @param {object} oManifest - Manifest of the component
		 * @returns {string} flex reference
		 * @public
		 */
		getFlexReference: function (oManifest) {
			if (oManifest) {
				if (oManifest.getEntry("sap.ui5")) {
					if (oManifest.getEntry("sap.ui5").appVariantId) {
						return oManifest.getEntry("sap.ui5").appVariantId;
					}
					if (oManifest.getEntry("sap.ui5").componentName) {
						return oManifest.getEntry("sap.ui5").componentName + ".Component";
					}
				}
				if (oManifest.getEntry("sap.app") && oManifest.getEntry("sap.app").id) {
					var sAppId = oManifest.getEntry("sap.app").id;
					if (sAppId === Utils.APP_ID_AT_DESIGN_TIME && oManifest.getComponentName) {
						sAppId = oManifest.getComponentName();
					}
					return sAppId + ".Component";
				}
			}
			this.log.warning("No Manifest received.");
			return "";
		},

		/**
		 * Returns the semantic application version using format: "major.minor.patch".
		 *
		 * @param {object} oManifest - Manifest of the component
		 * @returns {string} Version of application if it is available in the manifest, otherwise an empty string
		 * @public
		 */
		getAppVersionFromManifest: function (oManifest) {
			var sVersion = "";
			if (oManifest){
				var oSapApp = (oManifest.getEntry) ? oManifest.getEntry("sap.app") : oManifest["sap.app"];
				if (oSapApp && oSapApp.applicationVersion && oSapApp.applicationVersion.version){
					sVersion = oSapApp.applicationVersion.version;
				}
			} else {
				this.log.warning("No Manifest received.");
			}
			return sVersion;
		},

		/**
		 * Returns the uri of the main service specified in the app manifest
		 *
		 * @param {object} oManifest - Manifest of the component
		 * @returns {string} Returns the uri if the manifest is available, otherwise an empty string
		 * @public
		 */
		getODataServiceUriFromManifest: function (oManifest) {
			var sUri = "";
			if (oManifest){
				var oSapApp = (oManifest.getEntry) ? oManifest.getEntry("sap.app") : oManifest["sap.app"];
				if (oSapApp && oSapApp.dataSources && oSapApp.dataSources.mainService && oSapApp.dataSources.mainService.uri){
					sUri = oSapApp.dataSources.mainService.uri;
				}
			} else {
				this.log.warning("No Manifest received.");
			}
			return sUri;
		},

		/**
		 * Checks if the application version has the correct format: "major.minor.patch".
		 *
		 * @param {string} sVersion - Version of application
		 * @returns {boolean} true if the format is correct, otherwise false
		 * @public
		 */
		isCorrectAppVersionFormat: function (sVersion) {
			// remove all whitespaces
			sVersion = sVersion.replace(/\s/g, "");

			// get version without snapshot
			// we need to run the regex twice to avoid that version 1-2-3-SNAPSHOT will result in version 1.
			var oRegexp1 = /\b\d{1,5}(.\d{1,5}){0,2}/g;
			var oRegexp2 = /\b\d{1,5}(\.\d{1,5}){0,2}/g;
			var nLength = sVersion.match(oRegexp1) ? sVersion.match(oRegexp1)[0].length : 0;
			var nLenghtWithDot = sVersion.match(oRegexp2) ? sVersion.match(oRegexp2)[0].length : 0;

			if (nLenghtWithDot < 1 || nLenghtWithDot != nLength){
				return false;
			}

			//if the character after the version is also a number or a dot, it should also be a format error
			if (nLenghtWithDot && sVersion != sVersion.substr(0,nLenghtWithDot)){
				var cNextCharacter = sVersion.substr(nLenghtWithDot, 1);
				var oRegexp = /^[0-9.]$/;
				if (oRegexp.test(cNextCharacter)){
					return false;
				}
			}

			// split into number-parts and check if there are max. three parts
			var aVersionParts = sVersion.substr(0,nLenghtWithDot).split(".");
			if (aVersionParts.length > 3){
				return false;
			}

			// 5 digits maximum per part
			if (!aVersionParts.every(function(sPart){return sPart.length <= 5;})){
				return false;
			}
			return true;
		},

		/**
		 * Returns whether provided layer is a customer dependent layer
		 *
		 * @param {string} sLayerName - layer name
		 * @returns {boolean} true if provided layer is customer dependent layer else false
		 * @public
		 */
		isCustomerDependentLayer : function(sLayerName) {
			return (["CUSTOMER", "CUSTOMER_BASE"].indexOf(sLayerName) > -1);
		},

		/**
		 * Checks if an object is in an array or not and returns the index or -1
		 *
		 * @param {object[]} aArray Array of objects
		 * @param {object} oObject object that should be part of the array
		 * @returns {integer} Returns the index of the object in the array, -1 if it is not in the array
		 * @public
		 */
		indexOfObject: function(aArray, oObject) {
			var iObjectIndex = -1;
			aArray.some(function(oArrayObject, iIndex) {
				var aKeysArray, aKeysObject;
				if (!oArrayObject) {
					aKeysArray = [];
				} else {
					aKeysArray = Object.keys(oArrayObject);
				}

				if (!oObject) {
					aKeysObject = [];
				} else {
					aKeysObject = Object.keys(oObject);
				}
				var bSameNumberOfAttributes = aKeysArray.length === aKeysObject.length;
				var bContains = bSameNumberOfAttributes && !aKeysArray.some(function(sKey) {
					return oArrayObject[sKey] !== oObject[sKey];
				});

				if (bContains) {
					iObjectIndex = iIndex;
				}

				return bContains;
			});
			return iObjectIndex;
		},

		/**
		 * Execute the passed asynchronous / synchronous (Utils.FakePromise) functions serialized - one after the other.
		 * By default errors do not break the sequential execution of the queue, but this can be changed with the parameter bThrowError.
		 * Error message will be written in any case.
		 *
		 * @param {array.<function>} aPromiseQueue - List of asynchronous functions that returns promises
		 * @param {boolean} bThrowError - true: errors will be rethrown and therefore break the execution
		 * @param {boolean} bAsync - true: asynchronous processing with Promise, false: synchronous processing with FakePromise
		 * @returns {Promise} Returns empty resolved Promise or FakePromise when all passed promises inside functions have been executed
		 */
		execPromiseQueueSequentially : function(aPromiseQueue, bThrowError, bAsync) {
			if (aPromiseQueue.length === 0) {
				if (bAsync) {
					return Promise.resolve();
				}
				return new Utils.FakePromise();
			}
			var fnPromise = aPromiseQueue.shift();
			if (typeof fnPromise === "function") {
				try {
					var vResult = fnPromise();
				} catch (e) {
					vResult = Promise.reject(e);
				}

				return vResult.then(function() {
					if (!bAsync && vResult instanceof Promise) {
						bAsync = true;
					}
				})

				.catch(function(e) {
					var sErrorMessage = "Error during execPromiseQueueSequentially processing occured";
					sErrorMessage += e ?  ": " + e.message : "";
					this.log.error(sErrorMessage);

					if (bThrowError) {
						throw new Error(sErrorMessage);
					}
				}.bind(this))

				.then(function() {
					return this.execPromiseQueueSequentially(aPromiseQueue, bThrowError, bAsync);
				}.bind(this));

			} else {
				this.log.error("Changes could not be applied, promise not wrapped inside function.");
				return this.execPromiseQueueSequentially(aPromiseQueue, bThrowError, bAsync);
			}
		},

		/**
		 * Function that behaves like Promise (es6) but is synchronous. Implements 'then' and 'catch' functions.
		 * After instantiating can be used similar to standard Promises but synchronously.
		 * As soon as one of the callback functions returns a Promise the asynchronous Promise replaces the FakePromise in further processing.
		 *
		 * @param {any} vInitialValue - value on resolve FakePromise
		 * @param {any} vError - value on reject FakePromise
		 * @param {string} sInitialPromiseIdentifier - value identifies previous promise in chain. If the identifier is passed to the function and don't match with the FakePromiseIdentifier then native Promise execution is used for further processing
		 * @returns {sap.ui.fl.Utils.FakePromise|Promise} Returns instantiated FakePromise only if no Promise is passed by value parameter
		 */
		FakePromise : function(vInitialValue, vError, sInitialPromiseIdentifier) {
			Utils.FakePromise.fakePromiseIdentifier = "sap.ui.fl.Utils.FakePromise";
			this.vValue = vInitialValue;
			this.vError = vError;
			this.bContinueWithFakePromise = arguments.length < 3 || (sInitialPromiseIdentifier === Utils.FakePromise.fakePromiseIdentifier);
			Utils.FakePromise.prototype.then = function(fn) {
				if (!this.bContinueWithFakePromise) {
					return Promise.resolve(fn(this.vValue));
				}
				if (!this.vError) {
					try {
						this.vValue = fn(this.vValue, Utils.FakePromise.fakePromiseIdentifier);
					} catch (oError) {
						this.vError = oError;
						this.vValue = null;
						return this;
					}
					if (this.vValue instanceof Promise ||
						this.vValue instanceof Utils.FakePromise) {
						return this.vValue;
					}
				}
				return this;
			};
			Utils.FakePromise.prototype.catch = function(fn) {
				if (!this.bContinueWithFakePromise) {
					return Promise.reject(fn(this.vError));
				}
				if (this.vError) {
					try {
						this.vValue = fn(this.vError, Utils.FakePromise.fakePromiseIdentifier);
					} catch (oError) {
						this.vError = oError;
						this.vValue = null;
						return this;
					}
					this.vError = null;
					if (this.vValue instanceof Promise ||
						this.vValue instanceof Utils.FakePromise) {
						return this.vValue;
					}
				}
				return this;
			};
			if (this.vValue instanceof Promise ||
				this.vValue instanceof Utils.FakePromise) {
				return this.vValue;
			}
		},
		/**
		 * Function that gets a specific change from a map of changes.
		 *
		 * @param {map} mChanges Map of all changes
		 * @param {string} sChangeId Id of the change that should be retrieved
		 * @returns {sap.ui.fl.Change | undefined} Returns the change if it is in the map, otherwise undefined
		 */
		getChangeFromChangesMap: function(mChanges, sChangeId) {
			var oResult;
			Object.keys(mChanges).forEach(function(sControlId) {
				mChanges[sControlId].some(function(oChange) {
					if (oChange.getId() === sChangeId) {
						oResult = oChange;
						return true;
					}
				});
			});
			return oResult;
		}
	};
	return Utils;
}, true);