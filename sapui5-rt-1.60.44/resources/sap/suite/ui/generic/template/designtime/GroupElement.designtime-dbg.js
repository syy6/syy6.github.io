sap.ui.define(["sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils",
		"sap/suite/ui/generic/template/changeHandler/util/AnnotationChangeUtilsV2"
	],
	function(Utils, AnnotationChangeUtils) {
		"use strict";
		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();
		var DATAFIELDFORANNOTATION = "com.sap.vocabularies.UI.v1.DataFieldForAnnotation";
		var DATAFIELD = "com.sap.vocabularies.UI.v1.DataField";
		var DATAFIELDWITHURL = "com.sap.vocabularies.UI.v1.DataFieldWithUrl";
		var INTENTBASEDNAV = "com.sap.vocabularies.UI.v1.DataFieldWithIntentBasedNavigation";
		var DATAFIELDWITHNAVPATH = "com.sap.vocabularies.UI.v1.DataFieldWithNavigationPath";
		var FIELDGROUP = "com.sap.vocabularies.UI.v1.FieldGroup";

		var GROUP_ELEMENT_TYPE_DATAFIELD = "Datafield";
		var GROUP_ELEMENT_TYPE_CONTACT = "Contact";
		var GROUP_ELEMENT_TYPE_INTENTBASEDNAV = "DataFieldWithIntentBasedNavigation";
		var GROUP_ELEMENT_TYPE_DATAFIELDWITHURL = "DatafieldWithUrl";
		var GROUP_ELEMENT_TYPE_DATAFIELDWITHNAVPATH = "DataFieldWithNavigationPath";


		var oGroupElementDesigntime = {

			getGroupElementRecord: function (oElement) {
				var oTempInfo = Utils.getTemplatingInfo(oElement);
				if (oTempInfo && oTempInfo.annotationContext){
					return oTempInfo.annotationContext;
				}
			},

			/**
			 * Create a new group element object.
			 *
			 * @param {string} sRecordType The type of the group record
			 * @param {object} oOldRecord Old record of the group with its content
			 * @returns {object} The new group element record
			 * @public
			 */
			createNewRecord: function(sRecordType, oOldRecord) {

				var sProperty,
					oAbstractRecordTemplate = {
						Criticality: {},
						CriticalityRepresentation: {},
						IconUrl: {}
					},
					oRecordTemplate = {};
				oRecordTemplate[DATAFIELD] = jQuery.extend({}, oAbstractRecordTemplate,
					{
						Label: {},
						Value: {}
					});
				oRecordTemplate[DATAFIELDWITHURL] = jQuery.extend({}, oAbstractRecordTemplate,
					{
						Label: {},
						Value: {},
						Url: {}
					});
				oRecordTemplate[DATAFIELDFORANNOTATION] = jQuery.extend({}, oAbstractRecordTemplate,
					{
						Label: {String: "Contact"},
						Target: {AnnotationPath: "Contact_Target"}
					});
				oRecordTemplate[INTENTBASEDNAV] = jQuery.extend({}, oAbstractRecordTemplate,
					{
						Label: {},
						SemanticObject: {String: "Semantic_Object"},
						Action: {},
						Value: {}
					});
				oRecordTemplate[DATAFIELDWITHNAVPATH] = jQuery.extend({}, oAbstractRecordTemplate,
					{
						Label: {},
						Value: {},
						Target: {}
					});

				var oNewRecord = {
					"com.sap.vocabularies.UI.v1.Importance": {
						"EnumMember": "com.sap.vocabularies.UI.v1.ImportanceType/High"
					},
					"RecordType": sRecordType,
					"EdmType": "Edm.String"
				};
				jQuery.extend(true, oNewRecord, oRecordTemplate[sRecordType]);
				for (sProperty in oNewRecord) {
					if (sProperty !== "RecordType" && oOldRecord[sProperty]) {
						jQuery.extend(oNewRecord[sProperty], oOldRecord[sProperty]);
					}
					if (jQuery.isEmptyObject(oNewRecord[sProperty])) {
						delete oNewRecord[sProperty];
					}
				}
				return oNewRecord;
			},

			/**
			 * Retrieves a list of possible values of the group element type, e.g. for filling a drop-down in the UI.
			 *
			 * @param {object} oElement The UI5 element (in overlay mode)
			 * @returns {object} An object comprising the values (as a technical key) and their labels (displayName)
			 * @public
			 */
			getGroupElementTypeValues: function() {
				var oValues = {   //default values that are relevant for all field types
					Datafield: {
						displayName: "Data Field"
					},
					DatafieldWithUrl: {
						displayName: "Data Field with URL"
					},
					Contact: {
						displayName: "Contact"
					},
					DataFieldWithIntentBasedNavigation: {
						displayName: "Intent Based Navigation"
					},
					DataFieldWithNavigationPath: {
						displayName: "DataField with Navigation Path"
					}
				};
				return oValues;
			},

			/**
			 * Retrieves the current value of the group element record type from
			 * various annotations.
			 *
			 * @param {object} oElement The UI5 element (in overlay mode)
			 * @returns {string} The technical key of the group element type, as comprised in the list of possible values
			 * @public
			 */
			getGroupElementType: function(oElement) {
				var oRecord = oGroupElementDesigntime.getGroupElementRecord(oElement);
				var sGroupElementType;

				if (oRecord) {
					switch (oRecord.RecordType) {
						case DATAFIELDFORANNOTATION:
							var sAnnotationPath = oRecord.Target.AnnotationPath;
							if (sAnnotationPath) {
								if (oRecord.Target.AnnotationPath.indexOf("com.sap.vocabularies.Communication.v1.Contact") >= 0 ||
									oRecord.Target.AnnotationPath.indexOf("Contact_Target") >= 0 ) {
									sGroupElementType = GROUP_ELEMENT_TYPE_CONTACT;
								}
							}
							break;
						case INTENTBASEDNAV:
							sGroupElementType = GROUP_ELEMENT_TYPE_INTENTBASEDNAV;
							break;
						case DATAFIELD:
							sGroupElementType = GROUP_ELEMENT_TYPE_DATAFIELD;
							break;
						case DATAFIELDWITHURL:
							sGroupElementType = GROUP_ELEMENT_TYPE_DATAFIELDWITHURL;
							break;
						case DATAFIELDWITHNAVPATH:
							sGroupElementType = GROUP_ELEMENT_TYPE_DATAFIELDWITHNAVPATH;
							break;
						default:
							break;
					}
				}
				return sGroupElementType;
			},

			/**
			 * Updates the value of the record type for a given group element by updating
			 * different annotations
			 *
			 * @param {object} oGroupElement The group element control (in overlay mode)
			 * @param {string} sNewGroupElementType The new value for the group element type
			 * @returns{object} The change content, comprising old an new values of the group element but also
			 *                  the implicitly changed annotations.
			 * @public
			 */
			setGroupElementType: function(oGroupElement, sNewGroupElementType) {
				var sOldValueType = oGroupElementDesigntime.getGroupElementType(oGroupElement);
				if (sOldValueType === sNewGroupElementType) {
					return;
				}
				var sRecordType = "";
				var oMetaModel = {};
				var oEntityType = {};
				var oAnnotations = [];
				var oAnnotationsOld = [];
				var sAnnotation = "";
				var aDataFields = [];
				var iAnnotationIndex = -1;
				var oCustomChange = {};
				var aCustomChanges = [];
				var oTemplData = {};

				switch (sNewGroupElementType) {
					case GROUP_ELEMENT_TYPE_DATAFIELD:
						sRecordType = DATAFIELD;
						break;
					case GROUP_ELEMENT_TYPE_DATAFIELDWITHURL:
						sRecordType = DATAFIELDWITHURL;
						break;
					case GROUP_ELEMENT_TYPE_INTENTBASEDNAV:
						sRecordType = INTENTBASEDNAV;
						break;
					case GROUP_ELEMENT_TYPE_CONTACT:
						sRecordType = DATAFIELDFORANNOTATION;
						break;
					case GROUP_ELEMENT_TYPE_DATAFIELDWITHNAVPATH:
						sRecordType = DATAFIELDWITHNAVPATH;
						break;
					default:
						break;
				}

				if (!sRecordType) {
					return;
				}
				var oModel = oGroupElement.getModel();
				oMetaModel = oModel && oModel.getMetaModel();
				oTemplData = Utils.getTemplatingInfo(oGroupElement);
				oEntityType = oMetaModel.getODataEntityType(oTemplData.target);
				sAnnotation = oTemplData.annotation;
				oAnnotations = oEntityType[sAnnotation];
				oAnnotationsOld = JSON.parse(JSON.stringify(oAnnotations));
				aDataFields = (sAnnotation.indexOf(FIELDGROUP) >= 0) ? oAnnotations.Data : oAnnotations;
				iAnnotationIndex = Utils.getIndexFromInstanceMetadataPath(oGroupElement);
				if (iAnnotationIndex === -1) {
					throw "invalid index for old group element";
				}
				var oOldRecord = oGroupElementDesigntime.getGroupElementRecord(oGroupElement);
				var oNewRecord = oGroupElementDesigntime.createNewRecord(sRecordType, oOldRecord);
				switch (sNewGroupElementType) {
					case GROUP_ELEMENT_TYPE_CONTACT:
						oNewRecord.Target.AnnotationPath = oNewRecord.Target.AnnotationPath + "_" + parseInt(iAnnotationIndex, 10);
						break;
					case GROUP_ELEMENT_TYPE_INTENTBASEDNAV:
						oNewRecord.SemanticObject.String = oNewRecord.SemanticObject.String + "_" + parseInt(iAnnotationIndex, 10);
						break;
					default:
						break;
				}
				aDataFields.splice(iAnnotationIndex, 1, oNewRecord);
				oCustomChange = AnnotationChangeUtils.createCustomAnnotationTermChange(oTemplData.target, oAnnotations , oAnnotationsOld , sAnnotation);
				aCustomChanges.push(oCustomChange);
				return aCustomChanges;
			},

			getDesigntime: function (oElement) {
				return {
					getCommonInstanceData: function(oElement) {
						var oTemplData = Utils.getTemplatingInfo(oElement);

						if (oTemplData && oTemplData.path) {
							var sTarget = oTemplData.target + '/' + oTemplData.path.substr(oTemplData.path.indexOf(oTemplData.annotation));
							return {
								target: sTarget,
								annotation: oTemplData.annotation,
								qualifier: null
							};
						}
					},
					name: {
						singular: function() {
							return oResourceBundle.getText("FE_GROUP_ELEMENT");
						},
						plural: function() {
							return oResourceBundle.getText("FE_GROUP_ELEMENTS");
						}
					},
					properties: {
						groupElementType: {
							name: oResourceBundle.getText("FE_GROUP_ELEMENT_TYPE"),
							virtual: true,
							ignore: false,
							type: "EnumType",
							group: "header",
							possibleValues: oGroupElementDesigntime.getGroupElementTypeValues(oElement),
							get: oGroupElementDesigntime.getGroupElementType.bind(oElement),
							set: oGroupElementDesigntime.setGroupElementType.bind(oElement)
						}
					},
					actions: {
						remove: {
							changeType: "removeGroupElement",
							changeOnRelevantContainer: true
						},
						rename: null
					},
					annotations: {
						dataField: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataField",
							ignore: function() {
								var oRecord = this.getGroupElementRecord(oElement);
								if (oRecord && oRecord.RecordType) {
									return oRecord.RecordType !== DATAFIELD;
								}
							}.bind(this),
							whiteList: {
								properties: [
									"Criticality",
									"CriticalityRepresentation",
									"Label",
									"Value"
								]
							},
							defaultValue: null,
							appliesTo: ["GroupElement"],
							links: {
								developer: [{
									href: "/api/sap.ui.comp.smartform.GroupElement",
									text: function() {
										return oResourceBundle.getText("FE_GROUP_ELEMENT");
									}
								}]
							}
						},
						dataFieldWithUrl: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldWithUrl",
							ignore: function() {
								var oRecord = this.getGroupElementRecord(oElement);
								if (oRecord && oRecord.RecordType) {
									return oRecord.RecordType !== DATAFIELDWITHURL;
								}
							}.bind(this),
							defaultValue: null,
							appliesTo: ["GroupElement"],
							links: {
								developer: [
									{
									href: "/api/sap.ui.comp.smartform.GroupElement",
									text: function() {
										return oResourceBundle.getText("FE_GROUP_ELEMENT");
									}
								}, {
										href: "/topic/1d4a0f94bfee48d1b50ca8084a76beec.html",
										text: function() {
											return oResourceBundle.getText("FE_SDK_GUIDE_EXT_NAVI");
										}
									}
								]
							}
						},
						dataFieldForAnnotation: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldForAnnotation",
							ignore: function() {
								var oRecord = this.getGroupElementRecord(oElement);
								if (oRecord && oRecord.RecordType) {
									return oRecord.RecordType !== DATAFIELDFORANNOTATION;
								}
							}.bind(this),
							defaultValue: null,
							appliesTo: ["GroupElement"],
							links: {
								developer: [
									{
									href: "/api/sap.ui.comp.smartform.GroupElement",
									text: function() {
										return oResourceBundle.getText("FE_GROUP_ELEMENT");
									}
								}, {
										href: "/topic/a6a8c0c4849b483eb10e87f6fdf9383c",
										text: function() {
											return oResourceBundle.getText("FE_SDK_GUIDE_CONTACT_FACET");
										}
									}
								]
							},
							refersTo: [{
								annotation: "dataPoint",
								nullable: false,
								referredBy: "Target"
							}]
						},
						dataFieldWithIntentBasedNavigation: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldWithIntentBasedNavigation",
							ignore: function() {
								var oRecord = this.getGroupElementRecord(oElement);
								if (oRecord && oRecord.RecordType) {
									return oRecord.RecordType !== INTENTBASEDNAV;
								}
							}.bind(this),
							whiteList: {
								properties: [
									"SemanticObject",
									"Action",
									"Label",
									"Value"
								]
							},
							defaultValue: null,
							appliesTo: ["GroupElement"],
							links: {
								developer: [
									{
									href: "/api/sap.ui.comp.smartform.GroupElement",
									text: function() {
										return oResourceBundle.getText("FE_GROUP_ELEMENT");
									}
								}, {
										href: "/topic/1d4a0f94bfee48d1b50ca8084a76beec.html",
										text: function() {
											return oResourceBundle.getText("FE_SDK_GUIDE_EXT_NAVI");
										}
									}
								]
							}
						},
						dataFieldWithNavigationPath: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataFieldWithNavigationPath",
							ignore: function() {
								var oRecord = this.getGroupElementRecord(oElement);
								if (oRecord && oRecord.RecordType) {
									return oRecord.RecordType !== DATAFIELDWITHNAVPATH;
								}
							}.bind(this),
							whiteList: {
								properties: [
									"Label",
									"Value",
									"Target"
								]
							},
							defaultValue: null,
							appliesTo: ["GroupElement"],
							links: {
								developer: [
									{
									href: "/api/sap.ui.comp.smartform.GroupElement",
									text: function() {
										return oResourceBundle.getText("FE_GROUP_ELEMENT");
									}
								}, {
										href: "/topic/2c65f07f44094012a511d6bd83f50f2d",
										text: function() {
											return oResourceBundle.getText("FE_SDK_GUIDE_INT_NAVI");
										}
									}
								]
							}
						},
						dataPoint: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "DataPoint",
							target: ["EntityType"],
							whiteList: {
								properties: [
									"Title",
									"Value",
									"TargetValue",
									"ForecastValue",
									"MinimumValue",
									"MaximumValue",
									"Criticality"
								],
								expressionTypes: {
									Value: [
										"Path"
									],
									TargetValue: [
										"Path"
									],
									ForecastValue: [
										"Path"
									]
								}
							},
							ignore: function() {
								var oRecord = this.getGroupElementRecord(oElement);
								if (oRecord && oRecord.RecordType) {
									return oRecord.RecordType !== DATAFIELDFORANNOTATION;
								}
							}.bind(this),
							appliesTo: ["GroupElement"]
						},
						importance: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "Importance",
							defaultValue: null,
							target: ["Record"],
							appliesTo: ["GroupElement"],
							links: {
								developer: [{
									href: "/topic/69efbe747fc44c0fa445b24ed369cb1e",
									text: function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_RESPONSIVENESS");
									}
								}]
							}
						}
					}
				};
			}
		};
		return oGroupElementDesigntime;
});
