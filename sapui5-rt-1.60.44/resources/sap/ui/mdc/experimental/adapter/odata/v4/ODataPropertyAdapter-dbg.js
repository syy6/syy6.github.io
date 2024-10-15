/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"jquery.sap.global", "sap/ui/mdc/experimental/adapter/odata/ODataBaseAdapter", "sap/ui/base/ManagedObject"
], function(jQuery, ODataBaseAdapter, ManagedObject) {
	"use strict";

	/**
	 * A property adapter
	 *
	 * @extends sap.ui.mdc.experimental.adapter.odata.ODataBaseAdapter"
	 * @author SAP SE
	 * @version 1.60.42
	 * @alias sap.ui.mdc.experimental.adapter.odata.v4.ODataPropertyAdapter
	 * @experimental since 1.62
	 * @private
	 * @abstract
	 */
	var ODataPropertyAdapter = ODataBaseAdapter.extend("sap.ui.mdc.experimental.adapter.odata.v4.ODataPropertyAdapter", {
		constructor: function(mMetadataContext) {
			ODataBaseAdapter.prototype.constructor.apply(this, [
				mMetadataContext, {
					tooltip: function() {
						var oTooltip = this.getAnnotation("@com.sap.vocabularies.Common.v1.QuickInfo");
						return this.flattenSimpleAnnotation(oTooltip);
					},
					visible: function() {
						var bHiddenAnno = this.flattenSimpleAnnotation(this.getAnnotation("@com.sap.vocabularies.UI.v1.Hidden"));
						var bVisible = bHiddenAnno ? !bHiddenAnno : true;

						if (bVisible && this.schema.$fieldControl) {
							bVisible = this.schema.$fieldControl.path ? "{= $" + this.convertToSimpleBinding(this.schema.$fieldControl.path) + " === 7}" : this.schema.$fieldControl.visible;
						}
						return bVisible;
					},
					name: function() {
						return this.getAnnotation("@sapui.name");
					},
					required: function() {
						var oRequiredAnno = this.getAnnotation("$Nullable");

						var bRequired = oRequiredAnno != null ? (oRequiredAnno === "false" || oRequiredAnno === false) : false;

						if (this.schema.$fieldControl) {
							bRequired = this.schema.$fieldControl.path ? "{= $" + this.convertToSimpleBinding(this.schema.$fieldControl.path) + " !== 0}" : this.schema.$fieldControl.required;
						} else {
							bRequired = bRequired && this.editable;
						}

						return bRequired;
					},
					value: function() {
						return new Promise(function(resolve) {
							Promise.all([
								this.path, this.modelTypeName
							]).then(function(aResult) {
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
					href: function() {
						if (this.dataField && this.dataField.Url) {
							return this.flattenSimpleAnnotation(this.dataField.Url);
						}
					},
					textArrangement: function() {
						var oTextArrangment = this.getAnnotation("@com.sap.vocabularies.Common.v1.Text@com.sap.vocabularies.UI.v1.TextArrangement");
						if (oTextArrangment) {
							var sArrangement = oTextArrangment.$EnumMember;
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
					textProperty: function() {
						var sTextPath = this.getAnnotation("@com.sap.vocabularies.Common.v1.Text/$Path");
						sTextPath = sTextPath ? this.parentPath + "/" + sTextPath : null;
						return this.sibling(sTextPath);
					},
					defaultValue: function() {
						return this.getAnnotation("$DefaultValue");
					},
					formattedValue: function() {
						return new Promise(function(resolve) {
							this.textProperty.then(function(oTextProperty) {
								Promise.all([
									this.textArrangement, this.value, oTextProperty.value
								]).then(function(aResult) {
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
					unitProperty: function() {
						var sUnitPath = this.getAnnotation("@Org.OData.Measures.V1.Unit/$Path");

						if (!sUnitPath) {
							sUnitPath = this.getAnnotation("@Org.OData.Measures.V1.ISOCurrency/$Path");
						}

						sUnitPath = sUnitPath ? this.parentPath + "/" + sUnitPath : null;
						return this.sibling(sUnitPath);
					},
					maxLength: function() {
						return parseInt(this.getAnnotation("$MaxLength") || 255, 10);
					},
					minLength: function() {
						return parseInt(this.getAnnotation("$MinLength") || -1, 10);
					},
					scale: function() {
						return this.getAnnotation("$Scale") || 1;
					},
					precision: function() {
						return this.getAnnotation("$Precision") || 1;
					},
					editable: function() {
						var oUpdatableAnno = this.getAnnotation("@Org.OData.Core.V1.Immutable") || this.getAnnotation("@Org.OData.Core.V1.Computed");
						var vUpdateAnno = this.flattenSimpleAnnotation(oUpdatableAnno);
						var bEditable = vUpdateAnno != null ? (vUpdateAnno === "false" || vUpdateAnno === false) : true;

						if (bEditable && this.schema.$fieldControl) {
							bEditable = this.schema.$fieldControl.path ? "{= $" + this.convertToSimpleBinding(this.schema.$fieldControl.path) + " !== 1}" : this.schema.$fieldControl.editable;
						}

						return bEditable;
					},
					type: function() {
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

						return new Promise(function(resolve, reject) {
							that.modelType.then(function(oType) {
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
					label: function() {
						var oLabel;
						if (this.dataField) {
							oLabel = this.oMetaModel.getObject(this.metaPath + "/Label");
						}

						if (!oLabel) {
							oLabel = this.getAnnotation("@com.sap.vocabularies.Common.v1.Label");
						}
						return this.flattenSimpleAnnotation(oLabel);
					},
					parent: function() {
						var mParentMetadataContext = {
							model: this.oModel,
							path: this.parentPath + "/"
						};

						return this.parentPromise("sap/ui/mdc/experimental/adapter/odata/v4/ODataObjectAdapter", mParentMetadataContext);
					},
					reference: function() {
						var iChildIndex = this.path.lastIndexOf("/" + this.name);
						var sParentPath = this.path.substring(0, iChildIndex);

						var mReferencePath = {
							model: this.oModel
						};

						if (this.schema.$kind == "NavigationProperty") {
							if (this.schema.$isCollection) {
								mReferencePath.path = sParentPath;
								return this.parentPromise("sap/ui/mdc/experimental/adapter/odata/v4/ODataListAdapter", mReferencePath);
							} else {
								// to-one relation
								mReferencePath.path = sParentPath + "/";
								return this.parentPromise("sap/ui/mdc/experimental/adapter/odata/v4/ODataObjectAdapter", mReferencePath);
							}
						}

						return this.parent;
					},
					modelType: function() {
						if (this.dataField) {
							return this.oMetaModel.fetchUI5Type(this.dataFieldPath);
						}

						return this.oMetaModel.fetchUI5Type(this.metaPath);
					},
					modelTypeName: function() {
						return new Promise(function(resolve) {
							this.modelType.then(function(oType) {
								resolve(oType.getName());
							});
						}.bind(this));
					},
					filterable: function() {
						// filter restrictions are on the entity set
						var oFilterRestCtx = this.oModel.createBindingContext(this.parentPath + "##@Org.OData.Capabilities.V1.FilterRestrictions");
						var that = this;

						return new Promise(function(resolve, reject) {
							that.oMetaModel.requestObject(oFilterRestCtx.getPath()).then(function(oFilterRestrictions) {
								var bSetFilterable = (oFilterRestrictions.Filterable != null) ? oFilterRestrictions.Filterable : true;
								if (!bSetFilterable) {
									resolve(false);
									return;
								}

								if (oFilterRestrictions && oFilterRestrictions.NonFilterableProperties) {
									if (that.nameInPropertyPathArray(oFilterRestrictions.NonFilterableProperties, that.getAnnotation("@sapui.name"))) {
										return resolve(false);
									} else {
										return resolve(true);
									}
								}
								resolve(true);
							});
						});
					},
					filterProperty: function() {
						return this;
					},
					minConditions: function() {
						var that = this;

						return new Promise(function(resolve, reject) {
							that.filterable.then(function(bFilterable) {
								if (bFilterable) {
									var oFilterRestCtx = that.oModel.createBindingContext(that.parentPath + "##@Org.OData.Capabilities.V1.FilterRestrictions");
									var oFilterRestrictions = oFilterRestCtx.getObject();

									if (oFilterRestrictions && oFilterRestrictions.RequiredProperties) {
										if (that.nameInPropertyPathArray(oFilterRestrictions.RequiredProperties, that.getAnnotation("@sapui.name"))) {
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
					maxConditions: function() {
						var that = this;
						return new Promise(function(resolve, reject) {
							that.filterable.then(function(bFilterable) {
								if (bFilterable) {
									resolve(undefined);
								} else {
									resolve(0);
								}
							});
						});
					},
					sortable: function() {
						// filter restrictions are on the entity set
						var oSortRestCtx = this.oModel.createBindingContext(this.parentPath + "##@Org.OData.Capabilities.V1.SortRestrictions");
						var sNonSortablePath = oSortRestCtx.getPath() + "/NonSortableProperties";
						var that = this;
						return new Promise(function(resolve, reject) {
							that.oMetaModel.requestObject(sNonSortablePath).then(function(aNonSortable) {
								aNonSortable = aNonSortable || [];
								if (that.nameInPropertyPathArray(aNonSortable, that.getAnnotation("@sapui.name"))) {
									return resolve(false);
								} else {
									return resolve(true);
								}
							});
						});
					},
					sortProperty: function() {
						return this;
					},
					status: function() {
						function innerStatus(oCriticality, that) {
							if (!oCriticality) {
								return that.constants.Status.None;
							}

							if (oCriticality.$Path) {
								return that.convertToSimpleBinding(oCriticality.$Path);
							} else {
								var sCriticality = oCriticality.$EnumMember;

								if (sCriticality.endsWith("VeryNegative")) {
									return that.constants.Status.VeryNegative;
								}

								if (sCriticality.endsWith("Negative")) {
									return that.constants.Status.Negative;
								}

								if (sCriticality.endsWith("Neutral")) {
									return that.constants.Status.Neutral;
								}

								if (sCriticality.endsWith("VeryPositive")) {
									return that.constants.Status.VeryPositive;
								}

								if (sCriticality.endsWith("Positive")) {
									return that.constants.Status.Positive;
								}
							}
						}

						return new Promise(function(resolve, reject) {
							this.oMetaModel.requestObject(this.metaPath + "/@com.sap.vocabularies.UI.v1.Criticality").then(function(oCriticality) {
								resolve(innerStatus(oCriticality, this));
							}.bind(this));
						}.bind(this));
					},
					importance: function() {
						function innerImportance(oImportance, that) {
							if (!oImportance) {
								return that.constants.Importance.None;
							}

							if (oImportance.$Path) {
								return that.convertToSimpleBinding(oImportance.$Path);
							} else {
								var sImportance = oImportance.$EnumMember;

								if (sImportance.endsWith("Low")) {
									return that.constants.Importance.Low;
								}

								if (sImportance.endsWith("Medium")) {
									return that.constants.Importance.Medium;
								}

								if (sImportance.endsWith("High")) {
									return that.constants.Importance.High;
								}
							}
						}

						return new Promise(function(resolve, reject) {
							this.oMetaModel.requestObject(this.metaPath + "/@com.sap.vocabularies.UI.v1.Importance").then(function(oImportance) {
								resolve(innerImportance(oImportance, this));
							}.bind(this));
						}.bind(this));
					},
					semanticObject: function() {
						var oQualifiers = this.collectAnnotations("@com.sap.vocabularies.Common.v1.SemanticObject");
						if (jQuery.isEmptyObject(oQualifiers)) {
							return undefined;
						}

						var aAdditionalSemanticObjects = Object.keys(oQualifiers).filter(function(sQualifierName) {
							return !!sQualifierName;
						}).map(function(sQualifierName) {
							return oQualifiers[sQualifierName].annotation;
						});
						return {
                            defaultSemanticObject: (oQualifiers[""] ? oQualifiers[""].annotation : undefined),
                            additionalSemanticObjects: aAdditionalSemanticObjects
						};
					},
					semanticObjectMapping: function() {
						var fnGetMapping = function(aSemanticObjectMappings) {
							if (!jQuery.isArray(aSemanticObjectMappings)) {
								return undefined;
							}
							var oResult = {};
							aSemanticObjectMappings.forEach(function(oPair) {
								oResult[oPair.LocalProperty.$PropertyPath] = oPair.SemanticObjectProperty;
							});
							return oResult;
						};
						// Collect semanticObject(s) with qualifier and semanticObjectMapping(s) with qualifier
						var oSemanticObjectQualifiers = this.collectAnnotations("@com.sap.vocabularies.Common.v1.SemanticObject");
						if (jQuery.isEmptyObject(oSemanticObjectQualifiers)) {
							return undefined;
						}
						var oSemanticObjectMappingQualifiers = this.collectAnnotations("@com.sap.vocabularies.Common.v1.SemanticObjectMapping");
						if (jQuery.isEmptyObject(oSemanticObjectMappingQualifiers)) {
							return undefined;
						}
						var oSemanticObjects = {};
						for ( var sQualifierName in oSemanticObjectQualifiers) {
							oSemanticObjects[oSemanticObjectQualifiers[sQualifierName].annotation] = fnGetMapping(oSemanticObjectMappingQualifiers[sQualifierName].annotation);
						}
						return oSemanticObjects;
					}
				}
			]);
		},
		init: function() {
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
					this.dataFieldPath = this.oMetaContext.getPath();
				}
			}

			var iChildIndex = this.path.lastIndexOf(this.getAnnotation("@sapui.name") || this.schema.name);
			this.parentPath = this.path.substring(0, iChildIndex - 1);

			this._initFieldControl();
		}
	});

	ODataPropertyAdapter.prototype._getTargetContext = function() {
		return this.oMetaModel.createBindingContext("Target/$AnnotationPath/", this.oMetaContext);
	};

	ODataPropertyAdapter.prototype._isDataField = function() {
		if (this.dataField) {
			return true;
		}

		return this.schema.$Type ? (this.schema.$Type.indexOf("DataField")) > -1 : false;
	};

	return ODataPropertyAdapter;
});
