/* global Promise, sinaDefine, sinaRequire, sinaLog */
sinaDefine(['../../core/core', './typeConverter', '../tools/cds/CDSAnnotationsParser'], function (core, typeConverter, CDSAnnotationsParser) {
    "use strict";

    return core.defineClass({

        _init: function (provider) {
            this.provider = provider;
            this.sina = provider.sina;
            this.presentationUsageConversionMap = {
                TITLE: 'TITLE',
                SUMMARY: 'SUMMARY',
                DETAIL: 'DETAIL',
                IMAGE: 'IMAGE',
                THUMBNAIL: 'THUMBNAIL',
                HIDDEN: 'HIDDEN'
            };
            this.accessUsageConversionMap = {
                AUTO_FACET: 'AUTO_FACET',
                SUGGESTION: 'SUGGESTION'
            };
            this.cdsAnnotationsParser = this.sina._createCDSAnnotationsParser();
        },

        _getWindow: function () {
            if (typeof window === "undefined") {
                return new Promise(function (resolve, reject) {
                    sinaRequire(['jsdom', 'fs'], function (jsdom, fs) {
                        var jquery = fs.readFileSync("./node_modules/jquery/dist/jquery.js", "utf-8");

                        jsdom.env({
                            html: "<html><body></body></html>",
                            src: [jquery],
                            done: function (error, window) {
                                if (!error) {
                                    resolve(window);
                                } else {
                                    reject(error);
                                }
                            }
                        });
                    });
                });
            } else {
                return Promise.resolve(window);
            }
        },

        parseResponse: function (metaXML) {
            var that = this;
            // all in one metadata map
            var allInOneMap = {
                businessObjectMap: {}, // entity map with attributes and entityset name as key
                businessObjectList: [], // list of all entities for convenience
                dataSourceMap: {}, // datasource map with entityset name as key
                dataSourcesList: [] // list of all datasources for convenience
            };

            return this._getWindow().then(function (window) {
                window.$(metaXML).find('Schema').each(function () {
                    var $this = window.$(this);
                    var helperMap = that._parseEntityType($this, window);

                    that._parseEntityContainer($this, helperMap, allInOneMap, window);
                });
                return Promise.resolve(allInOneMap);
            });
        },
        //parse entityset and its attributes from EntityType
        _parseEntityType: function (schema, window) {
            var that = this;
            var helperMap = {};
            schema = window.$(schema);

            schema.find('EntityType').each(function () {
                var entityTypeName = window.$(this).attr('Name');
                var entitySet = {
                    schema: schema.attr('Namespace'),
                    keys: [],
                    attributeMap: {},
                    resourceBundle: '',
                    label: '',
                    annotations: {}
                };
                helperMap[entityTypeName] = entitySet;

                //oData keys for accessing a entity
                window.$(this).find('Key>PropertyRef').each(function () {
                    entitySet.keys.push(window.$(this).attr('Name'));
                });
                window.$(this).find('Annotation[Term="Search.searchable"]').each(function () {
                    //window.$(this).find('Annotation').each(function () {
                    // if (window.$(this).attr('Term') === 'EnterpriseSearchHana.uiResource.label.bundle') {
                    //     var resourceUrl = window.$(this).attr('String');
                    //     try {
                    //         entitySet.resourceBundle = jQuery.sap.resources({
                    //             url: resourceUrl,
                    //             language: sap.ui.getCore().getConfiguration().getLanguage()
                    //         });
                    //     } catch (e) {
                    //         sinaLog.error("Resource bundle of " + entityTypeName + " '" + resourceUrl + "' can't be found:" + e.toString());
                    //     }

                    //Get sibling annotation element of attr EnterpriseSearchHana.uiResource.label.key
                    window.$(this).siblings('Annotation').each(function () {
                        if (window.$(this).attr('Term') === 'EnterpriseSearchHana.uiResource.label.bundle') {
                            var resourceUrl = window.$(this).attr('String');
                            try {
                                entitySet.resourceBundle = jQuery.sap.resources({
                                    url: resourceUrl,
                                    language: sap.ui.getCore().getConfiguration().getLanguage()
                                });
                            } catch (e) {
                                sinaLog.error("Resource bundle of " + entityTypeName + " '" + resourceUrl + "' can't be found:" + e.toString());
                            }
                        } else if (window.$(this).attr('Term') === 'EnterpriseSearchHana.uiResource.label.key') {
                            var sKey = window.$(this).attr('String');
                            if (sKey && entitySet.resourceBundle) {
                                var sTranslatedText = entitySet.resourceBundle.getText(sKey);
                                if (sTranslatedText) {
                                    entitySet.label = sTranslatedText;
                                }
                            }
                        } else {
                            var annoAttributes = window.$(this)[0].attributes;
                            // In case of collection, say usageMode, it shall be handled differently
                            if (annoAttributes.length === 2) {
                                var annoTerm = annoAttributes.item(0).value.toUpperCase();
                                var annoValue = annoAttributes.item(1).value;
                                entitySet.annotations[annoTerm] = annoValue;
                            }
                        }
                    });
                    //}

                });

                //Loop attributes
                window.$(this).find('Property').each(function (index) {

                    var attributeName = window.$(this).attr('Name');
                    var attribute = {
                        labelRaw: attributeName,
                        label: null,
                        type: window.$(this).attr('Type'),
                        presentationUsage: [],
                        // accessUsage: [],
                        isFacet: false,
                        isSortable: false,
                        supportsTextSearch: false,
                        displayOrder: index,
                        annotationsAttr: {},
                        unknownAnnotation: []
                    };

                    entitySet.attributeMap[attributeName] = attribute;

                    window.$(this).find('Annotation').each(function () {
                        switch (window.$(this).attr('Term').toUpperCase()) {
                        case 'SAP.COMMON.LABEL':
                            if (!attribute.label) {
                                attribute.label = window.$(this).attr('String');
                            }
                            break;
                        case 'ENTERPRISESEARCHHANA.UIRESOURCE.LABEL.KEY':
                            var sKey = window.$(this).attr('String');
                            if (sKey && entitySet.resourceBundle) {
                                var sTranslatedText = entitySet.resourceBundle.getText(sKey);
                                if (sTranslatedText) {
                                    attribute.label = sTranslatedText;
                                }
                            }
                            break;
                        case 'ENTERPRISESEARCH.KEY':
                            attribute.isKey = window.$(this).attr('Bool') == "true" ? true : false;
                            break;
                        case 'ENTERPRISESEARCH.PRESENTATIONMODE':
                            window.$(this).find('Collection>String').each(function () {
                                var presentationUsage = window.$(this).text();
                                presentationUsage = that.presentationUsageConversionMap[presentationUsage];
                                if (presentationUsage) {
                                    attribute.presentationUsage.push(presentationUsage);
                                }
                            });
                            break;
                            // case 'EnterpriseSearch.usageMode': // No longer available in v5
                            //     window.$(this).find('Collection>String').each(function() {
                            //         var accessUsage = window.$(this).text();
                            //         accessUsage = that.accessUsageConversionMap[accessUsage];
                            //         if (accessUsage) {
                            //             attribute.accessUsage.push(accessUsage);
                            //         }
                            //     });
                            //     break;
                        case 'ENTERPRISESEARCHHANA.ISSORTABLE':
                            attribute.isSortable = window.$(this).attr('Bool') == "true" ? true : false;
                            break;
                        case 'ENTERPRISESEARCHHANA.SUPPORTSTEXTSEARCH':
                            attribute.supportsTextSearch = window.$(this).attr('Bool') == "true" ? true : false;
                            break;
                        case 'ENTERPRISESEARCH.FILTERINGFACET.DEFAULT':
                            attribute.isFacet = window.$(this).attr('Bool') == "true" ? true : false;
                            break;
                        case 'ENTERPRISESEARCH.DISPLAYORDER':
                            attribute.displayOrder = window.$(this).attr('Int');
                            break;
                            // case '@EnterpriseSearch.filteringFacet.numberOfValues':
                            //     attribute.numberOfFacetValues = window.$(this).attr('Int');
                        case 'UI.IDENTIFICATION':
                            window.$(this).find('PropertyValue[Property="position"]').each(function () {
                                attribute.displayOrder = +window.$(this).text();
                                attribute.annotationsAttr['UI.IDENTIFICATION.POSITION'] = window.$(this).text();
                            });
                            window.$(this).find('PropertyValue[Property="url"]').each(function () {
                                attribute.displayOrder = +window.$(this).text();
                                attribute.annotationsAttr['UI.IDENTIFICATION.URL'] = window.$(this).text();
                            });
                            break;
                        case 'UI.CONNECTEDFIELDS':
                            attribute.annotationsAttr['UI.CONNECTEDFIELDS.QUALIFIER'] = window.$(this).attr('Qualifier');;
                            window.$(this).find('PropertyValue[Property="Label"]').each(function () {
                                // attribute.label = window.$(this).text();
                                attribute.annotationsAttr['UI.CONNECTEDFIELDS.GROUPLABEL'] = window.$(this).text();
                            });
                            window.$(this).find('PropertyValue[Property="Template"]').each(function () {
                                attribute.annotationsAttr['UI.CONNECTEDFIELDS.TEMPLATE'] = window.$(this).text();
                            });
                            window.$(this).find('PropertyValue[Property="Name"]').each(function () {
                                attribute.annotationsAttr['UI.CONNECTEDFIELDS.NAME'] = window.$(this).text();
                            });
                            break;
                        case 'SEMANTICS.CONTACT.PHOTO':
                            attribute.annotationsAttr['SEMANTICS.CONTACT.PHOTO'] = window.$(this).attr('Bool');
                            break;
                        case 'SEMANTICS.IMAGEURL':
                            attribute.annotationsAttr['SEMANTICS.IMAGEURL'] = window.$(this).attr('Bool');
                            break;
                        case 'SEMANTICS.URL.MIMETYPE':
                            attribute.annotationsAttr['SEMANTICS.URL.MIMETYPE'] = window.$(this).attr('String');
                            break;
                        case 'OBJECTMODEL.TEXT.ELEMENT':
                            attribute.annotationsAttr['OBJECTMODEL.TEXT.ELEMENT'] = window.$(this).attr('String');
                            break;
                        case 'UI.TEXTARRANGEMENT':
                            attribute.annotationsAttr['UI.TEXTARRANGEMENT'] = window.$(this).attr('String');
                            break;
                        case 'UI.HIDDEN':
                            attribute.annotationsAttr['UI.HIDDEN'] = window.$(this).attr('Bool');
                            break;

                        case 'SEMANTICS.QUANTITY.UNITOFMEASURE':
                            attribute.annotationsAttr['SEMANTICS.QUANTITY.UNITOFMEASURE'] = window.$(this).attr('String');
                            break;
                        case 'SEMANTICS.AMOUNT.CURRENCYCODE':
                            attribute.annotationsAttr['SEMANTICS.AMOUNT.CURRENCYCODE'] = window.$(this).attr('String');
                            break;
                        case 'SEMANTICS.CURRENCYCODE':
                            attribute.annotationsAttr['SEMANTICS.CURRENCYCODE'] = window.$(this).attr('Bool');
                            break;
                        case 'SEMANTICS.UNITOFMEASURE':
                            attribute.annotationsAttr['SEMANTICS.UNITOFMEASURE'] = window.$(this).attr('Bool');
                            break;
                        case 'SEMANTICS.NAME.GIVENNAME':
                            attribute.annotationsAttr['SEMANTICS.NAME.GIVENNAME'] = window.$(this).attr('Bool');
                            break;
                        case 'SEMANTICS.NAME.FAMILYNAME':
                            attribute.annotationsAttr['SEMANTICS.NAME.FAMILYNAME'] = window.$(this).attr('Bool');
                            break;
                        case 'SEMANTICS.EMAIL.ADDRESS':
                            attribute.annotationsAttr['SEMANTICS.EMAIL.ADDRESS'] = window.$(this).attr('Bool');
                            break;
                            // Data type could be array                 
                        case 'SEMANTICS.TELEPHONE.TYPE':
                            attribute.annotationsAttr['SEMANTICS.TELEPHONE.TYPE'] = window.$(this).attr('String');
                            break;
                        case 'UI.MULTILINETEXT':
                            attribute.annotationsAttr['UI.MULTILINETEXT'] = window.$(this).attr('Bool');
                            break;
                        default:
                            attribute.unknownAnnotation.push(window.$(this));
                        }
                    });
                });
            });

            return helperMap;
        },

        //parse datasources from EntityContainer
        _parseEntityContainer: function (schemaXML, helperMap, allInOneMap, window) {
            var that = this;
            schemaXML.find('EntityContainer>EntitySet').each(function () {
                if (window.$(this).attr('Name') && window.$(this).attr('EntityType')) {
                    var name = window.$(this).attr('Name');
                    var entityTypeFullQualified = window.$(this).attr('EntityType');

                    // var schema = entityTypeFullQualified.slice(0, entityTypeFullQualified.lastIndexOf('.'));
                    var entityType = entityTypeFullQualified.slice(entityTypeFullQualified.lastIndexOf('.') + 1);

                    var entitySet = helperMap[entityType];
                    if (entitySet === undefined) {
                        throw 'EntityType ' + entityType + ' has no corresponding meta data!';
                    }

                    var newDatasource = that.sina._createDataSource({
                        id: name,
                        label: entitySet.label || name,
                        labelPlural: entitySet.label || name,
                        type: that.sina.DataSourceType.BusinessObject,
                        attributesMetadata: [{
                            id: 'dummy'
                        }] // fill with dummy attribute
                    });
                    newDatasource.annotations = entitySet.annotations;
                    allInOneMap.dataSourceMap[newDatasource.id] = newDatasource;
                    allInOneMap.dataSourcesList.push(newDatasource);

                    //that.fillMetadataBuffer(newDatasource, entitySet);
                    entitySet.name = name;
                    entitySet.dataSource = newDatasource;
                    allInOneMap.businessObjectMap[name] = entitySet;
                    allInOneMap.businessObjectList.push(entitySet);
                }
            });
        },

        fillMetadataBuffer: function (dataSource, attributes) {
            if (dataSource.attributesMetadata[0].id !== 'dummy') { // check if buffer already filled
                return;
            }
            dataSource.attributesMetadata = [];
            dataSource.attributeMetadataMap = {};

            var cdsAnnotations = {
                dataSourceAnnotations: {}, // Key-Value-Map for CDS annotations
                attributeAnnotations: {} // Key-Value-Map (keys: attribute names) of Key-Value-Maps (keys: annotation names) for CDS annotations
            };

            jQuery.extend(cdsAnnotations.dataSourceAnnotations, dataSource.annotations);

            for (var attributeMetadata in attributes.attributeMap) {
                this.fillPublicMetadataBuffer(dataSource, attributes.attributeMap[attributeMetadata], cdsAnnotations);
            }

            this.cdsAnnotationsParser.parseCDSAnnotationsForDataSource(dataSource, cdsAnnotations);
        },

        fillPublicMetadataBuffer: function (dataSource, attributeMetadata, cdsAnnotations) {
            var displayOrderIndex = attributeMetadata.displayOrder;

            // Prepare annotations for being passed over to the CDS annotations parser
            var attributeAnnotations = cdsAnnotations.attributeAnnotations[attributeMetadata.labelRaw] = {};
            // var attributeAnnotationsSrc = attributeMetadata.annotationsAttr;
            jQuery.extend(attributeAnnotations, attributeMetadata.annotationsAttr);
            // if this attribute has a Semantics property but no semantics annotation, create a new semantics annotation that corresponds to Semantics propery.
            // var hasSemanticsAnnotation = false,
            //     semanticsPrefix = "SEMANTICS.";
            // for(var key in attributeAnnotationsSrc){ 
            //     attributeAnnotations[key] = attributeAnnotationsSrc[key];
            // }
            // for (var j = 0; j < attributeAnnotationsSrc.length; j++) {

            // if (hasSemanticsAnnotation || attributeAnnotationsSrc[j].Name.substr(0, semanticsPrefix.length) == semanticsPrefix) {
            //     hasSemanticsAnnotation = true;
            // }
            // }
            // if (attributeMetadata.Semantics && !hasSemanticsAnnotation) {
            //     var semanticsValue;
            //     switch (attributeMetadata.Semantics) {
            //     case "EMAIL.ADDRESS":
            //     case "TELEPHONE.TYPE":
            //     case "CURRENCYCODE":
            //     case "UNITOFMEASURE":
            //         semanticsValue = "TRUE";
            //         break;
            //     case "QUANTITY.UNITOFMEASURE":
            //     case "AMOUNT.CURRENCYCODE":
            //         semanticsValue = attributeMetadata.UnitAttribute;
            //         break;
            //     }
            //     if (semanticsValue) {
            //         attributeAnnotations[semanticsPrefix + attributeMetadata.Semantics] = semanticsValue;
            //     }
            // }

            var type = this.parseAttributeType(attributeMetadata);

            if (type) {
                var publicAttributeMetadata = this.sina._createAttributeMetadata({
                    id: attributeMetadata.labelRaw,
                    label: attributeMetadata.label || attributeMetadata.labelRaw,
                    isKey: attributeMetadata.isKey || false,
                    isSortable: attributeMetadata.isSortable,
                    usage: this.parseUsage(attributeMetadata, displayOrderIndex) || {},
                    type: type,
                    matchingStrategy: this.parseMatchingStrategy(attributeMetadata)
                });

                publicAttributeMetadata.semanticObjectType = attributeMetadata.SemanticObjectTypeId;
                dataSource.attributesMetadata.push(publicAttributeMetadata);
                dataSource.attributeMetadataMap[publicAttributeMetadata.id] = publicAttributeMetadata;
            }

        },

        parseMatchingStrategy: function (attributeMetadata) {
            if (attributeMetadata.supportsTextSearch === true) {
                return this.sina.MatchingStrategy.Text;
            } else {
                return this.sina.MatchingStrategy.Exact;
            }
        },

        parseAttributeType: function (attributeMetadata) {

            for (var i = 0; i < attributeMetadata.presentationUsage.length; i++) {
                var presentationUsage = attributeMetadata.presentationUsage[i] || '';
                switch (presentationUsage.toUpperCase()) {
                case 'SUMMARY':
                    continue;
                case 'DETAIL':
                    continue;
                case 'TITLE':
                    continue;
                case 'HIDDEN':
                    continue;
                case 'FACTSHEET':
                    continue;
                case 'THUMBNAIL':
                case 'IMAGE':
                    return this.sina.AttributeType.ImageUrl;
                case 'LONGTEXT':
                    return this.sina.AttributeType.Longtext;
                default:
                    throw new core.Exception('Unknown presentation usage ' + presentationUsage);
                }
            }

            switch (attributeMetadata.type) {
            case 'Edm.String':
            case 'Edm.Binary':
            case 'Edm.Boolean':
            case 'Edm.Byte':
            case 'Edm.Guid':
                return this.sina.AttributeType.String;

            case 'Edm.Double':
            case 'Edm.Decimal':
            case 'Edm.Float':
            case 'Edm.Single':
            case 'Edm.SingleRange':
                return this.sina.AttributeType.Double;

            case 'Edm.Int16':
            case 'Edm.Int32':
            case 'Edm.Int64':
                return this.sina.AttributeType.Integer;

            case 'Edm.Time':
                return this.sina.AttributeType.Time;

            case 'Edm.DateTime':
                if (attributeMetadata.TypeLength > 8) {
                    return this.sina.AttributeType.Timestamp;
                }
                return this.sina.AttributeType.Timestamp;
            case 'Collection(Edm.String)':
                return this.sina.AttributeType.String;
            case 'GeoJson':
                return this.sina.AttributeType.GeoJson;
            default:
                //throw new core.Exception('Unknown data type ' + attributeMetadata.type);
                //console.error('Unknown data type ' + attributeMetadata.type);
                return null;
            }
        },

        parseUsage: function (attributeMetadata, displayOrderIndex) {
            var usage = {};
            for (var i = 0; i < attributeMetadata.presentationUsage.length; i++) {
                var id = attributeMetadata.presentationUsage[i].toUpperCase() || '';
                if (id === "TITLE") {
                    usage.Title = {
                        displayOrder: displayOrderIndex
                    };
                }

                if (id === "SUMMARY" ||
                    id === "DETAIL" ||
                    id === "IMAGE" ||
                    id === "THUMBNAIL" ||
                    id === "LONGTEXT"
                    //||id === "#HIDDEN"
                ) {
                    usage.Detail = {
                        displayOrder: displayOrderIndex
                    };
                }
            }

            if (attributeMetadata.isFacet) {
                usage.AdvancedSearch = {
                    displayOrder: displayOrderIndex
                };
            }

            return usage;
        }

    });
});
