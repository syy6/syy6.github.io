/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/mdc/experimental/adapter/odata/ODataBaseAdapter", "./ODataPropertyAdapter"
], function(ODataBaseAdapter, ODataPropertyAdapter) {
	"use strict";

	/**
	 * An object adapter
	 *
	 * @extends sap.ui.mdc.experimental.adapter.odata.ODataBaseAdapter"
	 * @author SAP SE
	 * @version 1.60.42
	 * @alias sap.ui.mdc.experimental.adapter.odata.v2.ODataObjectAdapter
	 * @experimental since 1.62
	 * @private
	 * @abstract
	 */
	var ODataObjectAdapter = ODataBaseAdapter.extend("sap.ui.mdc.experimental.adapter.odata.v2.ODataObjectAdapter", {
		constructor: function(mMetadataContext) {
			if (!mMetadataContext.path.endsWith("/")) {
				throw Error("Invalid path has to end with /");
			}
			mMetadataContext.path = mMetadataContext.path.substring(0, mMetadataContext.path.length - 1);

			ODataBaseAdapter.prototype.constructor.apply(this, [
				mMetadataContext, {
					keys: function() {
						var aKeys = this.schema.key.propertyRef, aKeyStr = [];

						for (var i = 0; i < aKeys.length; i++) {
							aKeyStr.push(aKeys[i].name);
						}
						if (aKeyStr.length == 1) {
							return aKeyStr[0];
						}

						return aKeyStr;
					},
					properties: function() {
						var i, oProperty, mProperties = {};

						if (this.schema.property) {
							for (i = 0; i < this.schema.property.length; i++) {
								oProperty = this.schema.property[i];
								mProperties[oProperty.name] = this.child(oProperty.name);
							}
						}

						if (this.schema.navigationProperty) {
							for (i = 0; i < this.schema.navigationProperty.length; i++) {
								oProperty = this.schema.navigationProperty[i];

								mProperties[oProperty.name] = mProperties[oProperty.name] = this.child(oProperty.name);
							}
						}

						return mProperties;
					},
					/**
					 * Promise to the parent
					 */
					parent: function() {
						return this.parentPromise("sap/ui/mdc/experimental/adapter/odata/v2/ODataListAdapter", mMetadataContext);
					},

					/**
					 * The resolved result has the structure which is described in AdapterConstants.ContactType:
					 * {
					 *   formattedName: Promise,
					 *   photo: Promise,
					 *   role: Promise,
					 *   title: Promise,
					 *   org: Promise,
					 *   addresses: [{
					 *      types: string[],
					 *      street: Promise,
					 *      code: Promise,
					 *      locality: Promise,
					 *      region: Promise,
					 *      country: Promise
					 *   }],
					 *   emails: [{
					 *      types: string[]
					 *      uri: Promise
					 *   }]
					 *   phones: [{
					 *      types: string[]
					 *      uri: Promise
					 *   }]
					 * }
					 * The result contains only attributes of corresponding annotation.
					 * If no 'contact' annotation exists, the result is 'undefined'.
					 *
					 * @returns {Promise}
					 */
					contact: function() {
						var oContactAnnotation = this.getAnnotation("com.sap.vocabularies.Communication.v1.Contact");
						if (!oContactAnnotation) {
							return undefined;
						}
						var CONTACT_INFORMATION_TYPE = {
							"com.sap.vocabularies.Communication.v1.ContactInformationType/work": "work",
							"com.sap.vocabularies.Communication.v1.ContactInformationType/home": "home",
							"com.sap.vocabularies.Communication.v1.ContactInformationType/preferred": "preferred"
						};
						var PHONE_TYPE = {
							"com.sap.vocabularies.Communication.v1.PhoneType/work": "work",
							"com.sap.vocabularies.Communication.v1.PhoneType/home": "home",
							"com.sap.vocabularies.Communication.v1.PhoneType/preferred": "preferred",
							"com.sap.vocabularies.Communication.v1.PhoneType/voice": "voice",
							"com.sap.vocabularies.Communication.v1.PhoneType/cell": "cell",
							"com.sap.vocabularies.Communication.v1.PhoneType/fax": "fax",
							"com.sap.vocabularies.Communication.v1.PhoneType/video": "video"
						};
						var fnConvertTypes = function(oAnnotationProperty, mConversion) {
							return oAnnotationProperty["EnumMember"].split(" ").map(function(oType) {
								return mConversion[oType];
							});
						};

						// @returns {Promise}
						var fnGetVisibleValue = function(oAnnotation) {
							if (this.getAttribute(oAnnotation, "String")) {
								return Promise.resolve(this.getAttribute(oAnnotation, "String"));
							}

							var sPath = this.getAttribute(oAnnotation, "Path");
							if (sPath) {
								var oProperty = this.child(sPath);
								return oProperty.visible.then(function(bVisible) {
									return bVisible ? oProperty.value : "";
								});
							}
							jQuery.sap.log.warning("Attribute of annotation '" + oAnnotation + "' is not supported yet.");
						}.bind(this);

						var fnGetAdrs = function(aAnnotation) {
							return aAnnotation.map(function(oAnnotation) {
								var oStruc = {
									types: fnConvertTypes(oAnnotation["type"], CONTACT_INFORMATION_TYPE)
								};
								for ( var sPropertyName in oAnnotation) {
									switch (sPropertyName) {
										case "street":
										case "code":
										case "locality":
										case "region":
										case "country":
											oStruc[this.constants.AddressType[sPropertyName]] = fnGetVisibleValue(oAnnotation[sPropertyName]);
											break;
										default:
											jQuery.sap.log.warning("Attribute '" + sPropertyName + "' of contact annotation's substructure 'adr' is not supported yet.");
									}
								}
								return oStruc;
							}.bind(this));
						}.bind(this);

						var fnGetEmails = function(aAnnotation) {
							return aAnnotation.map(function(oAnnotation) {
								var oStruc = {
									types: fnConvertTypes(oAnnotation["type"], CONTACT_INFORMATION_TYPE)
								};
								for ( var sPropertyName in oAnnotation) {
									switch (sPropertyName) {
										case "address":
											oStruc[this.constants.EmailAddressType[sPropertyName]] = fnGetVisibleValue(oAnnotation[sPropertyName]);
											break;
										default:
											jQuery.sap.log.warning("Attribute '" + sPropertyName + "' of contact annotation's substructure 'email' is not supported yet.");
									}
								}
								return oStruc;
							}.bind(this));
						}.bind(this);

						var fnGetTels = function(aAnnotation) {
							return aAnnotation.map(function(oAnnotation) {
								var oStruc = {
									types: fnConvertTypes(oAnnotation["type"], PHONE_TYPE)
								};
								for ( var sPropertyName in oAnnotation) {
									switch (sPropertyName) {
										case "uri":
											oStruc[this.constants.PhoneNumberType[sPropertyName]] = fnGetVisibleValue(oAnnotation[sPropertyName]);
											break;
										default:
											jQuery.sap.log.warning("Attribute '" + sPropertyName + "' of contact annotation's substructure 'tel' is not supported yet.");
									}
								}
								return oStruc;
							}.bind(this));
						}.bind(this);

						return new Promise(function(resolve) {
							var oResult = {};
							for ( var sPropertyName in oContactAnnotation) {
								switch (sPropertyName) {
									case "fn":
									case "photo":
									case "role":
									case "title":
									case "org":
										oResult[this.constants.ContactType[sPropertyName]] = fnGetVisibleValue(oContactAnnotation[sPropertyName]);
										break;
									case "adr":
										oResult[this.constants.ContactType[sPropertyName]] = fnGetAdrs(oContactAnnotation[sPropertyName]);
										break;
									case "email":
										oResult[this.constants.ContactType[sPropertyName]] = fnGetEmails(oContactAnnotation[sPropertyName]);
										break;
									case "tel":
										oResult[this.constants.ContactType[sPropertyName]] = fnGetTels(oContactAnnotation[sPropertyName]);
										break;
									default:
										jQuery.sap.log.warning("Attribute '" + sPropertyName + "' of contact annotation is not supported yet.");
								}
							}

							resolve(oResult);
						}.bind(this));
					}
				}
			]);

			this.path = this.path + "/";
		}
	});

	ODataBaseAdapter.prototype.child = function(sPath) {
		var mPropertyMetadataContext = {
			model: this.mMetadataContext.model
		};

		mPropertyMetadataContext.path = this.path + sPath;

		return new ODataPropertyAdapter(mPropertyMetadataContext);
	};

	return ODataObjectAdapter;
});
