sap.ui.define(["sap/suite/ui/generic/template/changeHandler/util/ChangeHandlerUtils",
		"sap/suite/ui/generic/template/changeHandler/util/AnnotationChangeUtilsV2"
	],
	function(Utils, AnnotationChangeUtils) {
		"use strict";

		var FIELDGROUP = "com.sap.vocabularies.UI.v1.FieldGroup";
		var FACETS = "com.sap.vocabularies.UI.v1.Facets";
		var LINEITEM = "com.sap.vocabularies.UI.v1.LineItem";
		var CHART = "com.sap.vocabularies.UI.v1.Chart";
		var COLLECTION_FACET = "com.sap.vocabularies.UI.v1.CollectionFacet";
		var REFERENCE_FACET = "com.sap.vocabularies.UI.v1.ReferenceFacet";
		var IDENTIFICATION = "com.sap.vocabularies.UI.v1.Identification";
		var DATAFIELD = "com.sap.vocabularies.UI.v1.DataField";
		var FIELDGROUP_TYPE = "com.sap.vocabularies.UI.v1.FieldGroupType";
		var SECTIONTYPE_FORM = "SmartForm";
		var SECTIONTYPE_TABLE = "SmartTable";
		var SECTIONTYPE_CHART = "SmartChart";

		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();

		var oSectionDesigntime = {

			/**
			 * Retrieves a list of possible values of the section type property, e.g. for filling a drop-down in the UI.
			 *
			 * @param {object} oElement The UI5 element (in overlay mode)
			 * @returns {object} An object comprising the values (as a technical key) and their labels (displayName)
			 * @public
			 */
			getSectionTypeValues: function(oElement) {
				var oValues = {
					SmartForm: {
						displayName: "Smart Form"
					},
					SmartTable: {
						displayName: "Smart Table"
					},
					SmartChart: {
						displayName: "Smart Chart"
					}
				};
				return oValues;
			},

			getFacetIndexFromID: function(sSectionId, aFacets){
				var sId;

				for (var i = 0; i < aFacets.length; i++) {
					sId = aFacets[i].ID && aFacets[i].ID.String;
					if (sId === sSectionId) {
						return i;
					}

					sId = aFacets[i].Target && aFacets[i].Target.AnnotationPath;
					sId = sId && sId.replace(/@/g, "").replace(/\//g, "::").replace(/#/g, "::");
					if (sId === sSectionId) {
						return i;
					}
				}
			},

			getSectionAnnotationInfo: function(oSection) {
				var oEntityType = Utils.getODataEntityType(Utils.getComponent(oSection));
				var oFacet, aFacets = oEntityType[FACETS];
				var sSectionId = oSection.getId();
				sSectionId = sSectionId.split("--")[1];
				sSectionId = sSectionId.substring(0, sSectionId.lastIndexOf("::"));
				var iFacetIndex = oSectionDesigntime.getFacetIndexFromID(sSectionId, aFacets);
				if (iFacetIndex === undefined) {
					return;
				}
				oFacet = aFacets[iFacetIndex];
				var oFacetData = {};
				oFacetData.RecordType = oFacet.RecordType;
				oFacetData.AnnotationPath = oFacet.Target && oFacet.Target.AnnotationPath;
				return oFacetData;
			},

			/**
			 * Retrieves the current value of the section type property for a given section from
			 * various annotations.
			 *
			 * @param {object} oElement The UI5 element (in overlay mode)
			 * @returns {string} The technical key of the section type property,
			 * as comprised in the list of possible values.
			 *
			 * @public
			 */
			getSectionType: function(oSection) {
				var i, oFacet;
				var oEntityType = Utils.getODataEntityType(Utils.getComponent(oSection));
				var aFacets = oEntityType[FACETS];

				var sSectionId = oSection.getId();
				if (sSectionId) {
					sSectionId = sSectionId.split("--")[1];
					sSectionId = sSectionId.substring(0, sSectionId.lastIndexOf("::"));

					var iFacetIndex = oSectionDesigntime.getFacetIndexFromID(sSectionId, aFacets);
					if (iFacetIndex === undefined) {
						return;
					}

					oFacet = aFacets[iFacetIndex];
					if (oFacet.RecordType === COLLECTION_FACET) {
						var aNestedFacets = oFacet.Facets;
						var bFormsOnly, bTablesOnly, sCollectionType;

						for (i = 0; i < aNestedFacets.length; i++) {
							if (aNestedFacets[i].RecordType === COLLECTION_FACET) {
								// Logic for handling subsections to be added here.
								return;
							}
							if (aNestedFacets[i].Target.AnnotationPath.indexOf(FIELDGROUP) > -1 || aNestedFacets[i].Target.AnnotationPath.indexOf(IDENTIFICATION) > -1) {
								bFormsOnly = true;
							} else if (aNestedFacets[i].Target.AnnotationPath.indexOf(LINEITEM) > -1) {
								bTablesOnly = true;
							}
						}
						if (bFormsOnly && bTablesOnly) {
							sCollectionType = "invalid";
						} else {
							sCollectionType = bFormsOnly ? SECTIONTYPE_FORM : SECTIONTYPE_TABLE;
						}
						return sCollectionType;
					} else {
						if (oFacet.Target && (oFacet.Target.AnnotationPath.indexOf(FIELDGROUP) > -1 || oFacet.Target.AnnotationPath.indexOf(IDENTIFICATION) > -1)){
							return SECTIONTYPE_FORM;
						}
						if (oFacet.Target && oFacet.Target.AnnotationPath.indexOf(LINEITEM) > -1){
							return SECTIONTYPE_TABLE;
						}
						if (oFacet.Target && oFacet.Target.AnnotationPath.indexOf(CHART) > -1){
							return SECTIONTYPE_CHART;
						}
					}
				}
			},

			/**
			 * Updates the value of the section type property for a given section by updating
			 * different annotations
			 *
			 * @param {object} oSection The section element (in overlay mode)
			 * @param {string} sValue The new value for the sectionType
			 * @returns{object} The change content, comprising old and new values of the sectionType
			 * @public
			 */
			setSectionType: function(oSection, sValue) {
				var iFacetIndex, sRecordType, sOldValue = oSectionDesigntime.getSectionType(oSection);

				if (sOldValue === sValue) {
					return;
				}

				switch (sValue) {

					case SECTIONTYPE_FORM:
						sRecordType = FIELDGROUP;
						break;
					case SECTIONTYPE_TABLE:
						sRecordType = LINEITEM;
						break;
					case SECTIONTYPE_CHART:
						sRecordType = CHART;
						break;
					default:
						break;
				}
				if (!sRecordType) {
					return;
				}

				var oEntityType = Utils.getODataEntityType(Utils.getComponent(oSection));
				var aOldFacets = oEntityType[FACETS];
				aOldFacets.splice();

				var sOldSectionId = oSection.getId().split("--")[1];
				sOldSectionId = sOldSectionId.substring(0, sOldSectionId.lastIndexOf("::"));

				iFacetIndex = oSectionDesigntime.getFacetIndexFromID(sOldSectionId, aOldFacets);

				if (iFacetIndex === undefined) {
					return;
				}

				var oOldSectionRecord = aOldFacets[iFacetIndex];
				var aNewFacets = [], aCustomChanges = [], oFieldGroup = {}, sFieldGroupTerm;
				var sTarget = Utils.getEntityType(Utils.getComponent(oSection));

				aNewFacets.push.apply(aNewFacets, aOldFacets);
				if (sValue === SECTIONTYPE_FORM){
					sFieldGroupTerm	= Utils.createFieldGroupTerm(oEntityType);
						oFieldGroup[sFieldGroupTerm] = {
						"Data": [{
							"RecordType": DATAFIELD
						}],
						"RecordType": FIELDGROUP_TYPE
					};

				}
				var oNewSection = oSectionDesigntime.createNewSection(oOldSectionRecord, sFieldGroupTerm);
				if (sValue === SECTIONTYPE_FORM && !(oNewSection.ID && oNewSection.ID.String)) {
					oNewSection.ID = {
						"String" : sValue + iFacetIndex
					};
				}
				aNewFacets.splice(iFacetIndex, 1, oNewSection);

				var oFacetsChange = AnnotationChangeUtils.createCustomAnnotationTermChange(sTarget, aNewFacets, aOldFacets, FACETS);
				var oFieldGroupChange = AnnotationChangeUtils.createCustomAnnotationTermChange(sTarget, oFieldGroup[sFieldGroupTerm], {}, sFieldGroupTerm);
				aCustomChanges.push(oFacetsChange);
				aCustomChanges.push(oFieldGroupChange);
				return aCustomChanges;
			},

			/**
			 * Create a new section object.
			 *
			 * @param {object} oOldSectionRecord Old record of the collection with its content
			 * @param {string} sFieldGroupTerm Name of the new field group
			 * @returns {object} The new section record
			 * @public
			 */
			createNewSection: function(oOldSectionRecord, sFieldGroupTerm) {
				var oNewCollectionFacet, oNewReferenceFacetTemplate = {
					"Label": {"String" : "New Group"},
					"ID": {},
					"Target": {},
					"RecordType": REFERENCE_FACET
				};
				if (sFieldGroupTerm) {
					oNewReferenceFacetTemplate.Target.AnnotationPath = "@" + sFieldGroupTerm;
					oNewCollectionFacet = {
						"ID": {},
						"Label": {},
						"Facets": [oNewReferenceFacetTemplate],
						"RecordType": COLLECTION_FACET
					};
				}
				var oNewFacet = sFieldGroupTerm ? oNewCollectionFacet : oNewReferenceFacetTemplate;
				for (var sProperty in oOldSectionRecord) {
					if (sProperty !== "RecordType" && sProperty !== "Target" && sProperty !== "Facets" && oNewFacet[sProperty]) {
						jQuery.extend(oNewFacet[sProperty], oOldSectionRecord[sProperty]);
					}
					if (jQuery.isEmptyObject(oNewFacet[sProperty])){
						delete oNewFacet[sProperty];
					}
				}
				return oNewFacet;
			},
			/**
			 * Retrieves the propagated and redefined designtime for a sap.uxap.ObjectPageSection element
			 *
			 * @param {object} oElement The SAPUI5 Column element instance
			 * @returns {object} The designtime metadata containing embedded functions
			 * @public
			 */
			getDesigntime: function(oElement) {
				return {
					name: {
						singular: function() {
							return oResourceBundle.getText("FE_SECTION");
						},
						plural: function() {
							return oResourceBundle.getText("FE_SECTIONS");
						}
					},
					getCommonInstanceData: function(oElement) {
						var oTemplData = Utils.getTemplatingInfo(oElement);

						if (oTemplData && oTemplData.path) {
							var sTarget = oTemplData.target + '/' + oTemplData.path.substr(oTemplData.path.indexOf(FACETS));
							return {
								target: sTarget,
								annotation: oTemplData.annotation,
								qualifier: null
							};
						}
					},
					propagateRelevantContainer: true,
					propagateMetadata: function (oElement) {
						switch (oElement.getMetadata().getElementName()) {
							case "sap.m.ColumnListItem":
								return {
									aggregations: {
										cells: {
											ignore: true
										}
									}
								};
							case "sap.ui.comp.smarttable.SmartTable":
								return {
									name: {
										singular: function() {
											return oResourceBundle.getText("FE_SECTION");
										}
									},
									aggregations: {
										semanticKeyAdditionalControl: {
											ignore: true
										}
									}
								};
						}
					},
					properties: {
						sectionType: {
							name: "Section Type",
							virtual: true,
							ignore: false,
							type: "EnumType",
							group: "header",
							possibleValues: oSectionDesigntime.getSectionTypeValues(oElement),
							get: oSectionDesigntime.getSectionType.bind(oElement),
							set: oSectionDesigntime.setSectionType.bind(oElement)
						}
					},
					links: {
						developer: [ {
								href: "/api/sap.uxap.ObjectPageSection",
								text: function() {
									return oResourceBundle.getText("FE_SECTIONS");
								}
							},
							{
								href: "/topic/facfea09018d4376acaceddb7e3f03b6",
								text: function() {
									return oResourceBundle.getText("FE_SDK_GUIDE_SECTIONS");
								}
							}
						]
					},
					actions: {
						remove: {
							changeType: "removeSection",
							changeOnRelevantContainer: true
						}
					},
					annotations: {
						referenceFacet: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "ReferenceFacet",
							defaultValue: null,
							whiteList: {
								properties: [
									"Label", "ID", "Target"
								]
							},
							ignore: function() {
								var oRecord = this.getSectionAnnotationInfo(oElement);
								return oRecord.RecordType !== REFERENCE_FACET;
							}.bind(this),
							appliesTo: ["ObjectPage/Sections"],
							group: ["Appearance"],
							links: {
								developer: [ {
									href:"/topic/facfea09018d4376acaceddb7e3f03b6.html",
									text: function() {
										return oResourceBundle.getText("FE_SDK_GUIDE_SECTIONS");
									}
								}]
							}
						},
						collectionFacet: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "CollectionFacet",
							defaultValue: null,
							ignore: function() {
								var oRecord = this.getSectionAnnotationInfo(oElement);
								return oRecord.RecordType !== COLLECTION_FACET;
							}.bind(this),
							whiteList: {
								properties: [
									"Label", "ID"
								]
							},
							appliesTo: ["ObjectPage/Sections"],
							group: ["Appearance"],
							links: {
								developer: [ {
									href:"/topic/facfea09018d4376acaceddb7e3f03b6.html",
									text: "Defining and Adapting Sections"
								}]
							}
						}
						/* Deactivated until VE can handle deep hierarchical annotations
						sectionChart: {
							namespace: "com.sap.vocabularies.UI.v1",
							annotation: "Chart",
							ignore: function() {
								var oRecord = this.getSectionAnnotationInfo(oElement);
								return !(oRecord.AnnotationPath && oRecord.AnnotationPath.indexOf(CHART) > -1) ;
							}.bind(this),
							target: ["ComplexType"],
							defaultValue: null,
							appliesTo: ["ObjectPage/Sections"],
							links: {
								developer: [{
									href: "/topic/653ed0f4f0d743dbb33ace4f68886c4e",
									text: "Adding a Smart Chart Facet"
								}]
							}
						}*/
					}
				};
			}
		};

		return oSectionDesigntime;
	});
