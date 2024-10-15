/* global sinaDefine */

/* eslint no-fallthrough: 0 */
/* eslint default-case: 0 */
/* eslint complexity: 0 */

sinaDefine([
    '../../../sina/SinaObject'
], function (SinaObject) {
    "use strict";

    return SinaObject.derive({

        _init: function () {

        },

        parseCDSAnnotationsForDataSource: function (dataSource, cdsAnnotations) {

            var parsingResult = {
                dataSourceIsCdsBased: false,
                detailAttributesAreSorted: false,
                titleAttributesAreSorted: false
            };

            // CDS Annotations Object looks like:
            // cdsAnnotations = {
            //     dataSourceAnnotations: {}, // Key-Value-Map for CDS annotations
            //     attributeAnnotations: {} // Key-Value-Map (keys: attribute names) of Key-Value-Maps (keys: annotation names) for CDS annotations
            // };

            var i, annotationName, annotationValue, attribute, unitOfMeasureAttribute, descriptionAttribute, urlAttribute, position;
            var unitOfMeasureAttributes = {};
            var descriptionAttributes = {};
            var parsedAttributes = {};
            var detailAttributesPrioHigh = [];
            var detailAttributesPrioMedium = [];
            var detailAttributesIgnorePrio = [];
            var defaultTextArrangement;
            var attributeGroup;
            var attributeGroups = {};
            var attributeGroupsArray = [];


            /////////////////////////////////
            // Parse Attribute Annotations
            ///
            for (i = 0; i < dataSource.attributesMetadata.length; i++) {
                attribute = dataSource.attributesMetadata[i];
                parsedAttributes[attribute.id] = attribute;
                var attributeAnnotations = cdsAnnotations.attributeAnnotations[attribute.id] || {};

                if (Object.keys(attributeAnnotations).length > 0) {

                    parsingResult.dataSourceIsCdsBased = true;

                    if ((annotationValue = attributeAnnotations["UI.IDENTIFICATION.URL"]) !== undefined) {
                        if (attributeAnnotations["SEMANTICS.IMAGEURL"] !== undefined) {

                            //var suvUrlAttribute = dataSource.attributeMetadataMap[annotationValue];
                            var urlAttributeAnnotations = cdsAnnotations.attributeAnnotations[annotationValue];
                            var mimeType = urlAttributeAnnotations["SEMANTICS.URL.MIMETYPE"];
                            if (urlAttributeAnnotations && mimeType) {
                                urlAttribute = dataSource.attributeMetadataMap[annotationValue];
                                var mimeTypeAttribute = dataSource.attributeMetadataMap[mimeType];

                                attribute.suvUrlAttribute = urlAttribute;
                                attribute.suvMimeTypeAttribute = mimeTypeAttribute;

                                attribute.format = this.sina.AttributeFormatType.DocumentThumbnail;
                            }
                        }
                    }


                    if ((annotationValue = attributeAnnotations["UI.CONNECTEDFIELDS.QUALIFIER"]) !== undefined) {
                        attributeGroup = attributeGroups[annotationValue];
                        if (!attributeGroup) {
                            attributeGroup = this.sina._createAttributeGroupMetadata({
                                id: annotationValue, // equals qualifier
                                label: attributeAnnotations["UI.CONNECTEDFIELDS.GROUPLABEL"],
                                template: attributeAnnotations["UI.CONNECTEDFIELDS.TEMPLATE"],
                                attributes: {},
                                usage: {}
                            });
                            attributeGroups[annotationValue] = attributeGroup;
                            attributeGroupsArray.push(attributeGroup);
                        } else {
                            if (attributeAnnotations["UI.CONNECTEDFIELDS.GROUPLABEL"] && !attributeGroup.label) {
                                attributeGroup.label = attributeAnnotations["UI.CONNECTEDFIELDS.GROUPLABEL"];
                            }
                            if (attributeAnnotations["UI.CONNECTEDFIELDS.TEMPLATE"] && !attributeGroup.template) {
                                attributeGroup.template = attributeAnnotations["UI.CONNECTEDFIELDS.TEMPLATE"];
                            }
                        }
                        attributeGroup.attributes[attributeAnnotations["UI.CONNECTEDFIELDS.NAME"]] = attribute;
                        attribute.group = attributeGroup;
                        attribute.nameInGroup = attributeAnnotations["UI.CONNECTEDFIELDS.NAME"];
                    }


                    // Following also takes care of a fallback:
                    // in case that there is an importance, but no position (like it could have happened in the past), set position to a default (Number.MAX_VALUE)
                    if ((annotationValue = attributeAnnotations["UI.IDENTIFICATION.POSITION"]) !== undefined || (annotationValue = attributeAnnotations["UI.IDENTIFICATION.IMPORTANCE"] && Number.MAX_VALUE)) {
                        switch (attributeAnnotations["UI.IDENTIFICATION.IMPORTANCE"]) {
                        case "HIGH":
                        case "MEDIUM":
                        case undefined:
                            position = this._parsePosition(annotationValue);

                            var _attribute = attribute;

                            if (attribute.group) {
                                if (attribute.group.usage && attribute.group.usage._Detail) {
                                    break;
                                }
                                _attribute = attribute.group;
                            }

                            _attribute.usage = attribute.usage || {};
                            _attribute.usage._Detail = attribute.usage._Detail || {};
                            _attribute.usage._Detail.displayOrder = position;

                            if (attributeAnnotations["UI.IDENTIFICATION.IMPORTANCE"] == "HIGH") {
                                detailAttributesPrioHigh.push(_attribute);
                            } else if (attributeAnnotations["UI.IDENTIFICATION.IMPORTANCE"] == "MEDIUM") {
                                detailAttributesPrioMedium.push(_attribute);
                            } else {
                                detailAttributesIgnorePrio.push(_attribute);
                            }
                            break;
                        }
                    }

                    if (attributeAnnotations["SEMANTICS.CONTACT.PHOTO"] !== undefined) {
                        attribute.format = this.sina.AttributeFormatType.Round;
                        attribute.type = this.sina.AttributeType.ImageUrl;
                    }

                    if (attributeAnnotations["SEMANTICS.IMAGEURL"] !== undefined) {
                        attribute.type = this.sina.AttributeType.ImageUrl;
                    }

                    if (attributeAnnotations["SEMANTICS.NAME.GIVENNAME"] !== undefined) {
                        attribute.isFirstName = true;
                    }

                    if (attributeAnnotations["SEMANTICS.NAME.FAMILYNAME"] !== undefined) {
                        attribute.isLastName = true;
                    }

                    if (attributeAnnotations["SEMANTICS.EMAIL.ADDRESS"] !== undefined) {
                        attribute.isEmailAddress = true;
                    }

                    if (attributeAnnotations["SEMANTICS.TELEPHONE.TYPE"] !== undefined) {
                        attribute.isPhoneNr = true;
                    }

                    if (attributeAnnotations["SEMANTICS.URL"] !== undefined) {
                        attribute.isHTTPURL = true;
                    }

                    if (attributeAnnotations["SEMANTICS.CURRENCYCODE"] !== undefined) {
                        attribute.isCurrency = true;
                    }

                    if (attributeAnnotations["SEMANTICS.UNITOFMEASURE"] !== undefined) {
                        attribute.isUnitOfMeasure = true;
                    }

                    if ((annotationValue = attributeAnnotations["SEMANTICS.QUANTITY.UNITOFMEASURE"]) !== undefined) {
                        attribute.isQuantity = true;
                        unitOfMeasureAttribute = parsedAttributes[annotationValue];
                        if (unitOfMeasureAttribute) {
                            if (unitOfMeasureAttribute.isUnitOfMeasure) {
                                attribute.unitOfMeasureAttribute = unitOfMeasureAttribute;
                            }
                        } else {
                            unitOfMeasureAttributes[annotationValue] = unitOfMeasureAttributes[annotationValue] || [];
                            unitOfMeasureAttributes[annotationValue].push({
                                attribute: attribute,
                                annotationName: "SEMANTICS.QUANTITY.UNITOFMEASURE"
                            });
                        }
                    }

                    if ((annotationValue = attributeAnnotations["SEMANTICS.AMOUNT.CURRENCYCODE"]) !== undefined) {
                        unitOfMeasureAttribute = parsedAttributes[annotationValue];
                        if (unitOfMeasureAttribute) {
                            if (unitOfMeasureAttribute.isCurrency) {
                                attribute.unitOfMeasureAttribute = unitOfMeasureAttribute;
                            }
                        } else {
                            unitOfMeasureAttributes[annotationValue] = unitOfMeasureAttributes[annotationValue] || [];
                            unitOfMeasureAttributes[annotationValue].push({
                                attribute: attribute,
                                annotationName: "SEMANTICS.AMOUNT.CURRENCYCODE"
                            });
                        }
                    }


                    if ((annotationValue = attributeAnnotations["OBJECTMODEL.TEXT.ELEMENT"]) !== undefined) {
                        descriptionAttribute = parsedAttributes[annotationValue];
                        if (descriptionAttribute) {
                            descriptionAttribute.isDescription = true;
                            attribute.descriptionAttribute = descriptionAttribute;
                        } else {
                            descriptionAttributes[annotationValue] = descriptionAttributes[annotationValue] || [];
                            descriptionAttributes[annotationValue].push(attribute);
                        }
                        var textArrangement = attributeAnnotations["UI.TEXTARRANGEMENT"];
                        if (textArrangement) {
                            switch (textArrangement.toUpperCase()) {
                            case "TEXT_FIRST":
                                attribute.descriptionTextArrangement = this.sina.AttributeDescriptionTextArrangement.TextFirst;
                                break;
                            case "TEXT_LAST":
                                attribute.descriptionTextArrangement = this.sina.AttributeDescriptionTextArrangement.TextLast;
                                break;
                            case "TEXT_ONLY":
                                attribute.descriptionTextArrangement = this.sina.AttributeDescriptionTextArrangement.TextOnly;
                                break;
                            case "TEXT_SEPARATE":
                                attribute.descriptionTextArrangement = this.sina.AttributeDescriptionTextArrangement.TextSeparate;
                                break;
                            }
                        } else {
                            attribute.descriptionTextArrangement = defaultTextArrangement;
                        }
                    }

                    if (attributeAnnotations["UI.MULTILINETEXT"] !== undefined) {
                        attribute.format = this.sina.AttributeFormatType.MultilineText;
                    }
                }
            }

            dataSource.attributesMetadata = dataSource.attributesMetadata.concat(attributeGroupsArray);
            // Array.prototype.push.apply(dataSource.attributesMetadata, attributeGroupsArray); // alternative to previous line

            var sortFunction = this._createSortFunction("_Detail");

            if (detailAttributesPrioHigh.length > 0 || detailAttributesPrioMedium.length > 0) {
                if (detailAttributesPrioHigh.length > 0) {
                    parsingResult.dataSourceIsCdsBased = true;
                }
                detailAttributesPrioHigh.sort(sortFunction);
                detailAttributesPrioMedium.sort(sortFunction);
                var detailAttributes = detailAttributesPrioHigh.concat(detailAttributesPrioMedium);

                for (i = 0; i < detailAttributes.length; ++i) {
                    detailAttributes[i].usage.Detail = detailAttributes[i].usage._Detail;
                    detailAttributes[i].usage.Detail.displayOrder = i;
                }

                parsingResult.detailAttributesAreSorted = true;
            } else if (detailAttributesIgnorePrio.length > 0) {
                parsingResult.dataSourceIsCdsBased = true;
                detailAttributesIgnorePrio.sort(sortFunction);

                for (i = 0; i < detailAttributesIgnorePrio.length; ++i) {
                    detailAttributesIgnorePrio[i].usage.Detail = detailAttributesIgnorePrio[i].usage._Detail;
                    detailAttributesIgnorePrio[i].usage.Detail.displayOrder = i;
                }

                parsingResult.detailAttributesAreSorted = true;
            }

            for (var unitOfMeasureAttributeName in unitOfMeasureAttributes) {
                unitOfMeasureAttribute = dataSource.attributeMetadataMap[unitOfMeasureAttributeName];
                if (unitOfMeasureAttribute) {
                    var attributesLookingForThisUomAttribute = unitOfMeasureAttributes[unitOfMeasureAttributeName];
                    for (i = 0; i < attributesLookingForThisUomAttribute.length; i++) {
                        attribute = attributesLookingForThisUomAttribute[i].attribute;
                        annotationName = attributesLookingForThisUomAttribute[i].annotationName;
                        if ((annotationName.toUpperCase() == "SEMANTICS.QUANTITY.UNITOFMEASURE" && unitOfMeasureAttribute.isUnitOfMeasure) || (annotationName.toUpperCase() == "SEMANTICS.AMOUNT.CURRENCYCODE" && unitOfMeasureAttribute.isCurrency)) {
                            attribute.unitOfMeasureAttribute = unitOfMeasureAttribute;
                        }
                    }
                }
            }

            for (var descriptionAttributeName in descriptionAttributes) {
                descriptionAttribute = dataSource.attributeMetadataMap[descriptionAttributeName];
                if (descriptionAttribute) {
                    descriptionAttribute.isDescription = true;
                    var attributesLookingForThisDescriptionAttribute = descriptionAttributes[descriptionAttributeName];
                    for (i = 0; i < attributesLookingForThisDescriptionAttribute.length; i++) {
                        attribute = attributesLookingForThisDescriptionAttribute[i];
                        attribute.descriptionAttribute = descriptionAttribute;
                    }
                }
            }

            ///////////////////////////////////
            // Parse Data Source Annotations
            ///
            if (Object.keys(cdsAnnotations.dataSourceAnnotations).length > 0) {
                if ((annotationValue = cdsAnnotations.dataSourceAnnotations["UI.HEADERINFO.TITLE.VALUE"]) !== undefined) {
                    var titleAttribute = dataSource.attributeMetadataMap[annotationValue];
                    if (titleAttribute) {
                        if (cdsAnnotations.dataSourceAnnotations["UI.HEADERINFO.TITLE.TYPE"] && cdsAnnotations.dataSourceAnnotations["UI.HEADERINFO.TITLE.TYPE"].toUpperCase() == "AS_CONNECTED_FIELDS") {
                            var groupQualifier = cdsAnnotations.dataSourceAnnotations["UI.HEADERINFO.TITLE.VALUEQUALIFIER"];
                            if (groupQualifier && groupQualifier.trim().length > 0) {
                                attributeGroup = attributeGroups[groupQualifier];
                                if (attributeGroup && attributeGroup == titleAttribute.group) {
                                    titleAttribute = attributeGroup;
                                }
                            }
                        }
                        titleAttribute.usage.Title = {
                            displayOrder: 1
                        };
                    }
                }

                if ((annotationValue = cdsAnnotations.dataSourceAnnotations["UI.HEADERINFO.TITLE.URL"]) !== undefined) {
                    urlAttribute = dataSource.attributeMetadataMap[annotationValue];
                    if (urlAttribute) {
                        urlAttribute.usage.Navigation = {
                            mainNavigation: true
                        };
                    }
                }

                if ((annotationValue = cdsAnnotations.dataSourceAnnotations["UI.HEADERINFO.DESCRIPTION.VALUE"]) !== undefined) {
                    var titleDescriptionAttribute = dataSource.attributeMetadataMap[annotationValue];
                    if (titleDescriptionAttribute) {
                        titleDescriptionAttribute.usage.TitleDescription = {};
                    }
                }

                if ((annotationValue = cdsAnnotations.dataSourceAnnotations["UI.TEXTARRANGEMENT"]) !== undefined) {
                    switch (annotationValue.toUpperCase()) {
                    case "TEXT_FIRST":
                        defaultTextArrangement = this.sina.AttributeDescriptionTextArrangement.TextFirst;
                        break;
                    case "TEXT_LAST":
                        defaultTextArrangement = this.sina.AttributeDescriptionTextArrangement.TextLast;
                        break;
                    case "TEXT_ONLY":
                        defaultTextArrangement = this.sina.AttributeDescriptionTextArrangement.TextOnly;
                        break;
                    case "TEXT_SEPARATE":
                        defaultTextArrangement = this.sina.AttributeDescriptionTextArrangement.TextSeparate;
                        break;
                    }
                }
            }


            return parsingResult;
        },

        _createSortFunction: function (usagePropery) {
            return function (a1, a2) {
                if (a1.usage[usagePropery].displayOrder < a2.usage[usagePropery].displayOrder) {
                    return -1;
                } else if (a1.usage[usagePropery].displayOrder > a2.usage[usagePropery].displayOrder) {
                    return 1;
                } else {
                    return 0;
                }
            };
        },

        _parsePosition: function (position) {
            if (typeof position === 'string') {
                try {
                    position = parseInt(position, 10);
                } catch (e) {
                    position = Number.MAX_VALUE;
                }
            } else if (typeof position !== 'number') {
                position = Number.MAX_VALUE; // or use Number.POSITIVE_INFINITY ?
            }
            return position;
        }
    });
});
