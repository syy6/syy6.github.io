/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
    "jquery.sap.global", "sap/ui/mdc/experimental/adapter/odata/ODataBaseAdapter", "sap/ui/base/ManagedObject"
], function (jQuery, ODataBaseAdapter, ManagedObject) {
    "use strict";

	/**
	 * A property adapter
	 *
	 * @extends sap.ui.mdc.experimental.adapter.odata.ODataBaseAdapter"
	 * @author SAP SE
	 * @version 1.60.42
	 * @alias sap.ui.mdc.experimental.adapter.odata.v2.ODataPropertyAdapter
	 * @experimental since 1.62
	 * @private
	 * @abstract
	 */
    var ODataPropertyAdapter = ODataBaseAdapter.extend("sap.ui.mdc.experimental.adapter.odata.v2.ODataPropertyAdapter", {
        constructor: function (mMetadataContext) {
            ODataBaseAdapter.prototype.constructor.apply(this, [
                mMetadataContext, {
                    label: function () {
                        var oLabel;
                        if (this.dataField) {
                            oLabel = this.oMetaModel.getObject(this.metaPath + "/Label");
                        }

                        if (!oLabel) {
                            oLabel = this.getAnnotation("com.sap.vocabularies.Common.v1.Label");
                        }
                        return this.flattenSimpleAnnotation(oLabel);
                    },
                    tooltip: function () {
                        var oTooltip = this.getAnnotation("com.sap.vocabularies.Common.v1.QuickInfo");
                        return this.flattenSimpleAnnotation(oTooltip);
                    },
                    visible: function () {
                        var bHiddenAnno = this.flattenSimpleAnnotation(this.getAnnotation("com.sap.vocabularies.UI.v1.Hidden"));
                        var bVisible = bHiddenAnno ? !bHiddenAnno : true;

                        if (bVisible && this.schema.$fieldControl) {
                            bVisible = this.schema.$fieldControl.path ? "{= $" + this.convertToSimpleBinding(this.schema.$fieldControl.path) + " === 7}" : this.schema.$fieldControl.visible;
                        }
                        return bVisible;
                    },
                    name: function () {
                        return this.schema.name;
                    },
                    required: function () {
                        var oRequiredAnno = this.getAnnotation("nullable");

                        var bRequired = oRequiredAnno != null ? (oRequiredAnno === "false" || oRequiredAnno === false) : false;

                        if (this.schema.$fieldControl) {
                            bRequired = this.schema.$fieldControl.path ? "{= $" + this.convertToSimpleBinding(this.schema.$fieldControl.path) + " !== 0}" : this.schema.$fieldControl.required;
                        } else {
                            bRequired = bRequired && this.editable;
                        }

                        return bRequired;
                    },
                    value: function () {
                        return new Promise(function (resolve) {
                            Promise.all([
                                this.path, this.modelTypeName
                            ]).then(function (aResult) {
                                resolve(this.convertToSimpleBinding(aResult[0], aResult[1]));
                            }.bind(this));
                        }.bind(this));
                    },
                    valueBinding: function () {
                        return new Promise(function (resolve) {
                                this.value.then(function (sValue) {
                                resolve(ManagedObject.bindingParser(sValue));
                            });
                        }.bind(this));
                    },
                    href: function () {
                        if (this.dataField && this.dataField.Url) {
                            return this.flattenSimpleAnnotation(this.dataField.Url);
                        }
                    },
                    textArrangement: function () {
                        var oTextArrangment = this.getAnnotation("com.sap.vocabularies.Common.v1.Text/@com.sap.vocabularies.UI.v1.TextArrangement");
                        if (oTextArrangment) {
                            var sArrangement = oTextArrangment.EnumMember;
                            if (sArrangement.endsWith("TextFirst")) {
                                return this.constants.TextArrangement.TextFirst;
                            }

                            if (sArrangement.endsWith("TextLast")) {
                                return this.constants.TextArrangement.TextLast;
                            }

                            if (sArrangement.endsWith("TextOnly")) {
                                return this.constants.TextArrangement.TextOnly;
                            }
                        }
                        return this.constants.TextArrangement.TextSeparate;
                    },
                    textProperty: function () {
                        var sTextPath = this.getAnnotation("com.sap.vocabularies.Common.v1.Text/Path");
                        sTextPath = sTextPath ? this.parentPath + "/" + sTextPath : null;
                        return this.sibling(sTextPath);
                    },
                    defaultValue: function () {
                        return this.getAnnotation("defaultValue");
                    },
                    formattedValue: function () {
                        return new Promise(function (resolve) {
                            this.textProperty.then(function (oTextProperty) {
                                Promise.all([
                                    this.textArrangement, this.value, oTextProperty.value
                                ]).then(function (aResult) {
                                    var sFormattedText;
                                    switch (aResult[0]) {
                                        case this.constants.TextArrangement.TextFirst:
                                            sFormattedText = aResult[2] + " (" + aResult[1] + ")";
                                            break;
                                        case this.constants.TextArrangement.TextLast:
                                            sFormattedText = aResult[1] + " (" + aResult[2] + ")";
                                            break;
                                        case this.constants.TextArrangement.TextOnly:
                                            sFormattedText = aResult[2];
                                            break;
                                        default:
                                            sFormattedText = aResult[1];
                                    }

                                    resolve(sFormattedText);
                                }.bind(this));
                            }.bind(this));
                        }.bind(this));
                    },
                    unitProperty: function () {
                        var sUnitPath = this.getAnnotation("Org.OData.Measures.V1.Unit/Path");

                        if (!sUnitPath) {
                            sUnitPath = this.getAnnotation("Org.OData.Measures.V1.ISOCurrency/Path");
                        }
                        sUnitPath = sUnitPath ? this.parentPath + "/" + sUnitPath : null;
                        return this.sibling(sUnitPath);
                    },
                    maxLength: function () {
                        return parseInt(this.getAnnotation("maxLength") || 255, 10);
                    },
                    minLength: function () {
                        return parseInt(this.getAnnotation("minLength") || -1, 10);
                    },
                    scale: function () {
                        return this.getAnnotation("scale") || 1;
                    },
                    precision: function () {
                        return this.getAnnotation("precision") || 1;
                    },
                    editable: function () {
                        var oUpdatableAnno = this.getAnnotation("Org.OData.Core.V1.Immutable") || this.getAnnotation("Org.OData.Core.V1.Computed");
                        var vUpdateAnno = this.flattenSimpleAnnotation(oUpdatableAnno);
                        var bEditable = vUpdateAnno != null ? (vUpdateAnno === "false" || vUpdateAnno === false) : true;

                        if (bEditable && this.schema.$fieldControl) {
                            bEditable = this.schema.$fieldControl.path ? "{= $" + this.convertToSimpleBinding(this.schema.$fieldControl.path) + " !== 1}" : this.schema.$fieldControl.editable;
                        }

                        return bEditable;
                    },
                    type: function () {
                        var that = this;

                        function toType(sTypeName) {
                            if (sTypeName) {
                                switch (sTypeName) {
                                    case "sap.ui.model.odata.type.Boolean":
                                        return "boolean";
                                    case "sap.ui.model.odata.type.Byte":
                                        return "byte";
                                    case "sap.ui.model.odata.type.Date":
                                        return "date";
                                    case "sap.ui.model.odata.type.DateTime":
                                    case "sap.ui.model.odata.type.DateTimeOffset":
                                        return "date-time";
                                    case "sap.ui.model.odata.type.Decimal":
                                    case "sap.ui.model.odata.type.Double":
                                        return "number";
                                    case "sap.ui.model.odata.type.Guid":
                                        return "string";
                                    case "sap.ui.model.odata.type.Int16":
                                    case "sap.ui.model.odata.type.Int32":
                                    case "sap.ui.model.odata.type.Int64":
                                        return "integer";
                                    case "sap.ui.model.odata.type.SByte":
                                    case "sap.ui.model.odata.type.Single":
                                        return "number";
                                    case "sap.ui.model.odata.type.String":
                                        return "string";
                                    case "sap.ui.model.odata.type.TimeOfDay":
                                        return "time";
                                    default:
                                        if (this["//"]["sap:display-format"] == "Date") {
                                            return "date";
                                        }
                                        return "string";
                                }
                            }
                        }

                        return new Promise(function (resolve, reject) {
                            that.modelType.then(function (oType) {
                                if (that.schema.$kind !== "NavigationProperty") {
                                    resolve(toType(oType.getName()));
                                } else {
                                    if (that.schema.$isCollection) {
                                        resolve("array");
                                    } else {
                                        resolve("object");
                                    }
                                }
                            });
                        });

                    },
                    parent: function () {
                        var mParentMetadataContext = {
                            model: this.oModel,
                            path: this.parentPath + "/"
                        };

                        return this.parentPromise("sap/ui/mdc/experimental/adapter/odata/v2/ODataObjectAdapter", mParentMetadataContext);
                    },
                    reference: function () {
                        var mReferencePath = {
                            model: this.oModel
                        };

                        if (this.schema.$kind == "NavigationProperty") {
                            if (this.schema.$isCollection) {
                                mReferencePath.path = this.parentPath;
                                return this.parentPromise("sap/ui/mdc/experimental/adapter/odata/v2/ODataListAdapter", mReferencePath);
                            } else {
                                // to-one relation
                                mReferencePath.path = this.parentPath + "/";
                                return this.parentPromise("sap/ui/mdc/experimental/adapter/odata/v2/ODataObjectAdapter", mReferencePath);
                            }
                        }

                        return this.parent;
                    },
                    modelTypeName: function () {
                        var sType = "";
                        if (this.schema.type) {
                            switch (this.schema.type) {
                                case "Edm.Boolean":
                                    sType = "sap.ui.model.odata.type.Boolean";
                                    break;
                                case "Edm.Byte":
                                    sType = "sap.ui.model.odata.type.Byte";
                                    break;
                                case "Edm.Date":
                                    sType = "sap.ui.model.odata.type.Date";
                                    break;
                                case "Edm.DateTime":
                                    sType = "sap.ui.model.odata.type.DateTime";
                                    break;
                                case "Edm.DateTimeOffset":
                                    sType = "sap.ui.model.odata.type.DateTimeOffset";
                                    break;
                                case "Edm.Decimal":
                                    sType = "sap.ui.model.odata.type.Decimal";
                                    break;
                                case "Edm.Double":
                                    sType = "sap.ui.model.odata.type.Double";
                                    break;
                                case "Edm.Guid":
                                    sType = "sap.ui.model.odata.type.Guid";
                                    break;
                                case "Edm.Int16":
                                    sType = "sap.ui.model.odata.type.Int16";
                                    break;
                                case "Edm.Int32":
                                    sType = "sap.ui.model.odata.type.Int32";
                                    break;
                                case "Edm.Int64":
                                    sType = "sap.ui.model.odata.type.Int64";
                                    break;
                                case "Edm.SByte":
                                    sType = "sap.ui.model.odata.type.SByte";
                                    break;
                                case "Edm.Single":
                                    sType = "sap.ui.model.odata.type.Single";
                                    break;
                                case "Edm.String":
                                    sType = "sap.ui.model.odata.type.String";
                                    break;
                                case "Edm.TimeOfDay":
                                    sType = "sap.ui.model.odata.type.TimeOfDay";
                                    break;
                                default:
                                    if (this.schema["sap:display-format"] == "Date") {
                                        sType = "sap.ui.model.odata.type.Date";
                                    } else {
                                        sType = "sap.ui.model.odata.type.String";
                                    }
                            }
                        } else {
                            sType = "sap.ui.model.odata.type.Raw";
                        }

                        return sType;
                    },
                    modelType: function () {
                        return new Promise(function (resolve, reject) {
                            this.modelTypeName.then(function (sTypeName) {
                                var sType = sTypeName.split('.').join("/");
                                sap.ui.require([
                                    sType
                                ], function (Type) {
                                    var oType = new Type();
                                    resolve(oType);
                                });
                            });
                        }.bind(this));
                    },
                    filterable: function () {
                        var oFilterRestrictions = this.schema.$EntitySet["Org.OData.Capabilities.V1.FilterRestrictions"];
                        var bSetFilterable = (oFilterRestrictions.Filterable != null) ? oFilterRestrictions.Filterable : true;
                        if (!bSetFilterable) {
                            return false;
                        }

                        if (oFilterRestrictions && oFilterRestrictions.NonFilterableProperties) {
                            if (this.nameInPropertyPathArray(oFilterRestrictions.NonFilterableProperties, this.schema.name)) {
                                return false;
                            } else {
                                return true;
                            }
                        }

                        return true;
                    },
                    filterProperty: function () {
                        return this;
                    },
                    minConditions: function () {
                        var that = this;

                        return new Promise(function (resolve, reject) {
                            that.filterable.then(function (bFilterable) {
                                if (bFilterable) {
                                    var oFilterRestrictions = that.schema.$EntitySet["Org.OData.Capabilities.V1.FilterRestrictions"];

                                    if (oFilterRestrictions && oFilterRestrictions.RequiredProperties) {
                                        if (that.nameInPropertyPathArray(oFilterRestrictions.RequiredProperties, that.schema.name)) {
                                            return resolve(1);
                                        } else {
                                            return resolve(0);
                                        }
                                    }
                                }
                                resolve(0);
                            });
                        });
                    },
                    maxConditions: function () {
                        var that = this;
                        return new Promise(function (resolve, reject) {
                            that.filterable.then(function (bFilterable) {
                                if (bFilterable) {
                                    resolve(undefined);
                                } else {
                                    resolve(0);
                                }
                            });
                        });
                    },
                    sortable: function () {
                        var oSortRestrictions = this.schema.$EntitySet["Org.OData.Capabilities.V1.SortRestrictions"];
                        if (oSortRestrictions && oSortRestrictions.NonSortableProperties) {
                            if (this.nameInPropertyPathArray(oSortRestrictions.NonSortableProperties, this.schema.name)) {
                                return false;
                            } else {
                                return true;
                            }
                        }

                        return true;
                    },
                    sortProperty: function () {
                        return this;
                    },
                    status: function () {
                        if (this.dataField && this.dataField["com.sap.vocabularies.UI.v1.Criticality"]) {
                            var oCriticality = this.dataField["com.sap.vocabularies.UI.v1.Criticality"];
                            if (oCriticality.Path) {
                                return this.convertToSimpleBinding(oCriticality.Path);
                            } else {
                                var sCriticality = oCriticality.EnumMember;

                                if (sCriticality.endsWith("VeryNegative")) {
                                    return this.constants.Status.VeryNegative;
                                }

                                if (sCriticality.endsWith("Negative")) {
                                    return this.constants.Status.Negative;
                                }

                                if (sCriticality.endsWith("Neutral")) {
                                    return this.constants.Status.Neutral;
                                }

                                if (sCriticality.endsWith("VeryPositive")) {
                                    return this.constants.Status.VeryPositive;
                                }

                                if (sCriticality.endsWith("Positive")) {
                                    return this.constants.Status.Positive;
                                }
                            }
                        } else {
                            return this.constants.Status.None;
                        }
                    },
                    importance: function () {
                        if (this.dataField && this.dataField["com.sap.vocabularies.UI.v1.Importance"]) {
                            var oImportance = this.dataField["com.sap.vocabularies.UI.v1.Importance"];
                            if (oImportance.Path) {
                                return this.convertToSimpleBinding(oImportance.Path);
                            } else {
                                var sImportance = oImportance.EnumMember;

                                if (sImportance.endsWith("Low")) {
                                    return this.constants.Importance.Low;
                                }

                                if (sImportance.endsWith("Medium")) {
                                    return this.constants.Importance.Medium;
                                }

                                if (sImportance.endsWith("High")) {
                                    return this.constants.Importance.High;
                                }
                            }
                        } else {
                            return this.constants.Status.None;
                        }
                    },
					/**
					 * The resolved result has following structure:
					 * {
					 *   defaultSemanticObject: string,
					 *   additionalSemanticObjects: string[]
					 * }
					 * If no 'semanticObject' annotation exists, the result is 'undefined'.
					 *
					 * @returns {Promise}
					 */
					semanticObject: function() {
                        var oQualifiers = this.collectAnnotations("com.sap.vocabularies.Common.v1.SemanticObject");
                        if (jQuery.isEmptyObject(oQualifiers)) {
                            return undefined;
                        }

                        var aAdditionalSemanticObjects = Object.keys(oQualifiers).filter(function (sQualifierName) {
                            return !!sQualifierName;
                        }).map(function (sQualifierName) {
                            return oQualifiers[sQualifierName].annotation["String"];
                        });
                        return {
                            defaultSemanticObject: (oQualifiers[""] ? oQualifiers[""].annotation["String"] : undefined),
                            additionalSemanticObjects: aAdditionalSemanticObjects
                        };
                    },
					/**
					 * The resolved result has following structure:
					 * {
					 *   "SO1": {"attr1": Promise, "attr2": Promise},
					 *   "SO2": {"attr3": Promise, "attr4": Promise}
					 * }
					 * If no 'semanticObjectMapping' annotation exists, the result is '{}'.
					 * If 'semanticObjectMapping' is defined for a hidden property, the mapping should be done anyway.
					 *
					 * @returns {Promise}
					 */
					semanticObjectMapping: function() {
						var fnGetValue = function(oAnnotation) {
							if (this.getAttribute(oAnnotation, "String")) {
								return Promise.resolve(this.getAttribute(oAnnotation, "String"));
							}

							var sPath = this.getAttribute(oAnnotation, "Path");
							if (sPath) {
								var oProperty = this.sibling(this.parentPath + "/" + sPath);
								return oProperty.value;
							}
							jQuery.sap.log.warning("Attribute of annotation '" + oAnnotation + "' is not supported yet.");
						}.bind(this);
						var fnGetMapping = function(aSemanticObjectMappings) {
                            if (!jQuery.isArray(aSemanticObjectMappings)) {
                                return {};
                            }
                            var oResult = {};
							aSemanticObjectMappings.forEach(function(oPair) {
								oResult[oPair.LocalProperty.PropertyPath] = fnGetValue(oPair.SemanticObjectProperty);
                            });
                            return oResult;
                        };
                        // Collect semanticObject(s) with qualifier and
						// semanticObjectMapping(s) with qualifier
                        var oSemanticObjectQualifiers = this.collectAnnotations("com.sap.vocabularies.Common.v1.SemanticObject");
                        if (jQuery.isEmptyObject(oSemanticObjectQualifiers)) {
							return undefined;
                        }
                        var oSemanticObjectMappingQualifiers = this.collectAnnotations("com.sap.vocabularies.Common.v1.SemanticObjectMapping");
                        if (jQuery.isEmptyObject(oSemanticObjectMappingQualifiers)) {
							return undefined;
                        }
                        var oSemanticObjects = {};
                        for (var sQualifierName in oSemanticObjectQualifiers) {
                            oSemanticObjects[oSemanticObjectQualifiers[sQualifierName].annotation["String"]] = fnGetMapping(oSemanticObjectMappingQualifiers[sQualifierName].annotation);
                        }
                        return oSemanticObjects;
                    }
                }
            ]);
        },
        init: function () {
            ODataBaseAdapter.prototype.init.apply(this);
            if (this.iSeparator > -1) {
                // Check for selection field etc
                var sValuePath = this.getAttribute(this.schema, "PropertyPath");
                if (!sValuePath && this._isDataField()) {
                    var oTarget = this.getAttribute(this.schema, "Target");
                    var oTargetContext = oTarget && this._getTargetContext();

                    var oValue = (oTargetContext || this.oMetaContext).getObject("Value");
                    if (oValue) {
                        sValuePath = this.getAttribute(oValue, "Path");
                        this.dataField = this.schema;
                    }
                }

                if (sValuePath) {
                    this.path = this.path.substring(0, this.iSeparator) + "/" + sValuePath;
                    this.oMetaContext = this.oMetaModel.getMetaContext(this.path);
                    this.schema = this.oMetaContext.getObject("");
                }
            }

			var iChildIndex = this.path.lastIndexOf("/");
			this.parentPath = this.path.substring(0, iChildIndex);

            this._initFieldControl();

            var aParts = this.path.split("/"), sProperty = aParts[aParts.length - 1];

            if (this.schema.property || this.schema.navigationProperty) {// navigation
																			// property
                this.metaPath = this.oMetaModel.getMetaContext(this.parentPath).getPath();
                var oParentSchema = this.oMetaModel.getObject(this.metaPath);
                var oAssocationEnd = this.oMetaModel.getODataAssociationEnd(oParentSchema, sProperty);
                if (!oAssocationEnd) {
                    return;
                }
                this._multiplicity = oAssocationEnd.multiplicity;

                var oAssocationSetEnd = this.oMetaModel.getODataAssociationSetEnd(oParentSchema, sProperty);
                this._entitySet = oAssocationSetEnd.entitySet;

                // navigation property correct the meta path
                var oNaviSchema = null;
                this.metaPath += "/navigationProperty/";
                for (var i = 0; i < oParentSchema.navigationProperty.length; i++) {
                    oNaviSchema = oParentSchema.navigationProperty[i];
                    if (oNaviSchema.name == sProperty) {
                        this.schema = oNaviSchema;
                        this.schema["$kind"] = "NavigationProperty";
                        if (oAssocationEnd.multiplicity !== "1" && oAssocationEnd.multiplicity !== "0..1") {
                            this.schema["$isCollection"] = true;
                        }
                        this.metaPath += i;
                        return;
                    }
                }

            }

            this.schema.$EntitySet = this.calculateEntitySet();
        }
    });

    ODataPropertyAdapter.prototype._getTargetContext = function () {
        var sAnnoPath = this.getAnnotation("Target/AnnotationPath/");
        sAnnoPath = sAnnoPath.replace("@", "");// replace with anno separator
        var oDataContext = this.oMetaModel.getMetaContext(this.path.substring(0, this.iSeparator));
        return this.oMetaModel.createBindingContext(sAnnoPath, oDataContext);
    };

    ODataPropertyAdapter.prototype._isDataField = function () {
        if (this.dataField) {
            return true;
        }

        return this.schema.RecordType ? (this.schema.RecordType.indexOf("DataField")) > -1 : false;
    };

    return ODataPropertyAdapter;
});
