/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/ui/mdc/experimental/adapter/BaseAdapter", "sap/ui/model/odata/v4/AnnotationHelper", "sap/ui/model/odata/AnnotationHelper"
], function(BaseAdapter, V4AnnotationHelper, V2AnnotationHelper) {
	"use strict";

	/**
	 * The adapter base for all OData Adapters here the way to come to annotations and field controls is capsulated
	 *
	 * @extends sap.ui.mdc.experimental.adapter.BaseAdapter
	 * @author SAP SE
	 * @version 1.60.42
	 * @alias sap.ui.mdc.experimental.adapter.odata.ODataBaseAdapter
	 * @experimental since 1.62
	 * @private
	 * @abstract
	 */
	var ODataBaseAdapter = BaseAdapter.extend("sap.ui.mdc.experimental.adapter.odata.ODataBaseAdapter", {
		constructor: function(mMetadataContext, mProperties) {
			BaseAdapter.prototype.constructor.apply(this, [
				mMetadataContext, mProperties
			]);

		},
		init: function() {
			this.sVersion = "2.0";

			if (this.oMetaModel.requestObject) {
				this.sVersion = "4.0";
				this.helper = V4AnnotationHelper;

			} else {
				this.helper = V2AnnotationHelper;
			}

			this.iSeparator = this.path ? this.path.indexOf("/##") : -1;

			if (!this.metaPath) {
				if (this.iSeparator > -1) {
					if (this.sVersion == "2.0") {
						var sDataPath = this.path.substring(0, this.iSeparator);
						var oDataMetaContext = this.oMetaModel.getMetaContext(sDataPath);
						this.oMetaContext = this.oMetaModel.createBindingContext(this.path.substring(this.iSeparator + 3), oDataMetaContext);
					} else {
						this.oMetaContext = this.oModel.createBindingContext(this.path);
					}
				} else {
					this.oMetaContext = this.oMetaModel.getMetaContext(this.path);
				}
				this.metaPath = this.oMetaContext.getPath();
			} else {
				this.oMetaContext = this.oMetaModel.createBindingContext(this.metaPath);
			}

			this.schema = this.oMetaModel.getProperty(this.metaPath);
		},

		/**
		 * Retrieve the OData Annotation
		 *
		 * @param {string} sAnnotation the path to the annotation
		 * @param {string} sQualifier the optional qualifier
		 */
		getAnnotation: function(sAnnotation, sQualifier) {
			if (sQualifier) {
				sAnnotation += "#" + sQualifier;
			}
			if (this.sVersion == "4.0") {
				return this.oMetaContext.getObject(sAnnotation);
			} else {
				var oAnnotation = this.schema;
				var aParts = sAnnotation.split("/"), sPath;
				var iIndex = 0;

				while (oAnnotation && aParts[iIndex]) {
					sPath = aParts[iIndex];

					if (sPath[0] === "@" || sPath[0] === "$") {
						sPath = sPath.substring(1);
					}

					oAnnotation = oAnnotation[sPath];
					iIndex++;
				}
				return oAnnotation;
			}
		},
		collectAnnotations: function(sAnnotation) {
			var oQualifiers = {}, oProperty;

			if (this.sVersion == "4.0") {
				oProperty = this.oMetaContext.getObject("@");
			} else {
				oProperty = this.schema;
			}

			for ( var sAttr in oProperty) {
				var sName = sAttr.split("#")[0];
				var sQualifierName = sAttr.split("#")[1] || ""; // as of specification the qualifier MUST have at least one character
				if (jQuery.sap.startsWith(sName, sAnnotation) && jQuery.sap.endsWith(sName, sAnnotation)) {
					oQualifiers[sQualifierName] = {
						annotation: oProperty[sAttr]
					};
				}
			}
			return oQualifiers;
		},
		flattenSimpleAnnotation: function(oAnnotation) {
			if (oAnnotation && this.getAttribute(oAnnotation, "String")) {
				return this.getAttribute(oAnnotation, "String");
			}

			if (oAnnotation && this.getAttribute(oAnnotation, "Bool")) {
				return JSON.parse(this.getAttribute(oAnnotation, "Bool"));
			}

			if (oAnnotation && this.getAttribute(oAnnotation, "Path")) {
				var sPath = this.getAttribute(oAnnotation, "Path");
				return this.convertToSimpleBinding(sPath);
			}

			return oAnnotation;
		}
	});

	/**
	 * @private
	 */
	ODataBaseAdapter.prototype._initFieldControl = function() {
		var oFieldControl = this.getAnnotation("@com.sap.vocabularies.Common.v1.FieldControl");

		if (oFieldControl) {
			var fieldControl = {};
			this.schema.$fieldControl = fieldControl;
			var oEnumMember = this.getAttribute(oFieldControl, "EnumMember");

			if (oEnumMember) {

				switch (oEnumMember) {
					case "@com.sap.vocabularies.Common.v1.FieldControlType/Hidden":
						this.schema.$fieldControl.visible = false;
						this.schema.$fieldControl.hidden = true;
						this.schema.$fieldControl.editable = false;
						this.schema.$fieldControl.readonly = true;
						this.schema.$fieldControl.required = false;
						break;
					case "@com.sap.vocabularies.Common.v1.FieldControlType/Mandatory":
						this.schema.$fieldControl.visible = true;
						this.schema.$fieldControl.hidden = false;
						this.schema.$fieldControl.editable = true;
						this.schema.$fieldControl.readonly = false;
						this.schema.$fieldControl.required = true;
						break;
					case "@com.sap.vocabularies.Common.v1.FieldControlType/ReadOnly":
						this.schema.$fieldControl.visible = true;
						this.schema.$fieldControl.hidden = false;
						this.schema.$fieldControl.editable = false;
						this.schema.$fieldControl.readonly = true;
						this.schema.$fieldControl.required = false;
						break;
					default:
						this.schema.$fieldControl.visible = true;
						this.schema.$fieldControl.hidden = false;
						this.schema.$fieldControl.editable = true;
						this.schema.$fieldControl.readonly = true;
						this.schema.$fieldControl.required = false;
						break;
				}
			} else {
				var sPath = this.getAttribute(oFieldControl, "Path");
				if (sPath) {
					this.schema.$fieldControl.path = this.parentPath + "/" + sPath;
				} else {
					delete this.schema.$fieldControl;
				}
			}
		}
	};

	ODataBaseAdapter.prototype.getAttribute = function(vSchema, sAttribute) {
		if (!vSchema) {
			return null;
		}

		return vSchema[sAttribute] || vSchema["$" + sAttribute];
	};
	/**
	 * @protected
	 */
	ODataBaseAdapter.prototype.removeKeys = function(sPath) {
		var sKeyLess, aParts = sPath.split("/"), iPos;

		for (var i = 0; i < aParts.length; i++) {
			iPos = aParts[i].indexOf("(");
			if (iPos >= 0) {
				aParts[i] = aParts[i].slice(0, iPos);
			}
		}

		sKeyLess = aParts.join("/");

		return sKeyLess;
	};

	ODataBaseAdapter.prototype.calculateEntitySet = function() {
		var oEntitySet;
		if (this.sVersion == "4.0") {
			var vSchema = this.oMetaModel.getObject(this.metaPath);
			if (vSchema.$kind == "EntitySet") {
				oEntitySet = vSchema;
			} else {
				var sEntitySetPath = this.metaPath.substring(0, this.metaPathlastIndexOf("/"));
				oEntitySet = this.oMetaModel.getObject(sEntitySetPath);
			}
		} else {
			var oAssocationSetEnd, sNavigationPropertyName, oEntityType, sQualifiedName, aParts = this.removeKeys(this.path).split("/");

			if (aParts[0] !== "") {
				return null;
			}
			aParts.shift();

			// from entity set to entity type
			oEntitySet = this.oMetaModel.getODataEntitySet(aParts[0]);
			if (!oEntitySet) {
				return null;
			}

			// follow (navigation) properties
			while (aParts.shift() && aParts[0]) {
				sQualifiedName = oEntitySet.entityType;
				oEntityType = this.oMetaModel.getODataEntityType(sQualifiedName);
				sNavigationPropertyName = aParts[0];
				oAssocationSetEnd = this.oMetaModel.getODataAssociationSetEnd(oEntityType, sNavigationPropertyName);

				if (oAssocationSetEnd) {
					// navigation property
					oEntitySet = this.oMetaModel.getODataEntitySet(oAssocationSetEnd.entitySet);
				} else {
					break;
				}
			}
		}

		return oEntitySet;

	};

	ODataBaseAdapter.prototype.nameInPropertyPathArray = function(aArray, sName) {
		for (var i = 0; i < aArray.length; i++) {
			if (this.getAttribute(aArray[i], "PropertyPath") == sName) {
				return true;
			}
		}
		return false;
	};

	return ODataBaseAdapter;
});
