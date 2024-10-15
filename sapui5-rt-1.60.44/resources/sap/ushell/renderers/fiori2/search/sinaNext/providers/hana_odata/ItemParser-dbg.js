/* global sinaDefine, Promise */
sinaDefine(['../../core/core', '../../core/util', './typeConverter', '../tools/fiori/FioriIntentsResolver', '../../sina/NavigationTarget'], function (core, util, typeConverter, IntentsResolver, NavigationTarget) {
    "use strict";

    return core.defineClass({

        _init: function (provider) {
            this.provider = provider;
            this.sina = provider.sina;
            this.intentsResolver = this.sina._createFioriIntentsResolver();
            this.suvNavTargetResolver = this.sina._createSuvNavTargetResolver();
        },

        parse: function (searchQuery, data) {
            if (data.value === null) {
                return Promise.resolve([]);
            }
            var itemsData = data.value;
            var itemProms = [];
            for (var i = 0; i < itemsData.length; ++i) {
                var itemData = itemsData[i];
                var itemProm = this.parseItem(itemData);
                itemProms.push(itemProm);
            }
            return Promise.all(itemProms);
        },
        parseItem: function (itemData) {
            var i;
            var titleAttributes = [];
            var detailAttributes = [];
            var titleDescription = "";
            var descriptionAttribute, unitOfMeasureAttribute;
            var unitOfMeasureAttributes = {}; // includes currency attributes
            var attribute;
            var allAttributes = {};
            var attributesLookingForTheirUomAttribute = [];
            var attributesLookingForTheirDescriptionAttribute = [];
            //var whyFoundAttributes = [];
            var semanticObjectTypeAttributes = {};
            var attributeGroups = {};

            var entitySetName = itemData['@odata.context'];
            var posOfSeparator = entitySetName.lastIndexOf('#');
            if (posOfSeparator > -1) {
                entitySetName = entitySetName.slice(posOfSeparator + 1);
            }
            var dataSource = this.sina.getDataSource(entitySetName);

            var whyFounds = itemData['@com.sap.vocabularies.Search.v1.WhyFound'] || {};
            var metadata = {};
            var semanticObjectType = '';

            var suvAttributes = {};
            var suvAttribute, suvAttributeName, suvUrlAttribute, suvMimeTypeAttribute;
            var suvHighlightTerms = [];

            var fallbackDefaultNavigationTarget;
            var rankingScore = itemData["@com.sap.vocabularies.Search.v1.Ranking"];


            // parse attributes

            for (var attributeName in itemData) {
                if (attributeName[0] === '@' || attributeName[0] === '_') {
                    continue;
                }

                metadata = dataSource.getAttributeMetadata(attributeName);

                if (metadata.id == "LOC_4326") { //required to get maps to frontend
                    metadata.usage = {
                        Detail: {
                            displayOrder: -1
                        }
                    };
                }

                var attrValue = typeConverter.odata2Sina(metadata.type, itemData[attributeName]);
                var attrValueFormatted = attrValue ? attrValue.toString() : '';

                var attrWhyFound = "";


                //processing for whyfound
                for (var attributeNameWhyfound in whyFounds) {
                    if (attributeNameWhyfound === attributeName && whyFounds[attributeNameWhyfound][0]) {
                        // replace attribue value with whyfound value
                        attrWhyFound = whyFounds[attributeNameWhyfound][0];
                        delete whyFounds[attributeNameWhyfound];
                    }
                }
                attribute = this.sina._createSearchResultSetItemAttribute({
                    id: metadata.id,
                    label: metadata.label,
                    value: attrValue,
                    valueFormatted: attrValueFormatted,
                    valueHighlighted: attrWhyFound || attrValueFormatted,
                    isHighlighted: attrWhyFound.length > 0 ? true : false,
                    metadata: metadata
                });

                if (metadata.isUnitOfMeasure || metadata.isCurrency) {
                    unitOfMeasureAttributes[attribute.id] = attribute;
                    continue;
                }

                if (metadata.unitOfMeasureAttribute) {
                    unitOfMeasureAttribute = unitOfMeasureAttributes[metadata.unitOfMeasureAttribute.id];
                    if (unitOfMeasureAttribute) {
                        attribute.unitOfMeasure = unitOfMeasureAttribute;
                    } else {
                        attributesLookingForTheirUomAttribute.push(attribute);
                    }
                }

                if (metadata.descriptionAttribute) {
                    descriptionAttribute = allAttributes[metadata.descriptionAttribute.id];
                    if (descriptionAttribute) {
                        attribute.description = descriptionAttribute;
                    } else {
                        attributesLookingForTheirDescriptionAttribute.push(attribute);
                    }
                }

                if (metadata.suvUrlAttribute && metadata.suvMimeTypeAttribute) {
                    suvUrlAttribute = allAttributes[metadata.suvUrlAttribute] || metadata.suvUrlAttribute.id;
                    suvMimeTypeAttribute = allAttributes[metadata.suvMimeTypeAttribute] || metadata.suvMimeTypeAttribute.id;
                    suvAttributes[metadata.id] = {
                        suvThumbnailAttribute: attribute,
                        suvTargetUrlAttribute: suvUrlAttribute,
                        suvTargetMimeTypeAttribute: suvMimeTypeAttribute
                    };
                }

                if (metadata.usage.Title) {
                    titleAttributes.push(attribute);
                }

                if (metadata.usage.TitleDescription) {
                    titleDescription = attribute.valueHighlighted;
                }


                if (metadata.group) {
                    var group = attributeGroups[metadata.group.id];
                    if (!group) {
                        group = this.sina._createSearchResultSetItemAttributeGroup({
                            id: metadata.group.id,
                            metadata: metadata.group,
                            label: metadata.group.label,
                            template: metadata.group.template,
                            attributes: {}
                        });
                        attributeGroups[metadata.group.id] = group;

                        if (metadata.group.usage.Detail) {
                            detailAttributes.push(group);
                        }
                        // if (!metadata.usage.Title && !metadata.usage.Detail && !metadata.isDescription && (attribute.isHighlighted || (attribute.descriptionAttribute && attribute.descriptionAttribute.isHighlighted))) {
                        //     whyFoundAttributes.push(attribute);
                        // }
                    }
                    group.attributes[metadata.nameInGroup] = attribute;
                    attribute.group = group;
                    attribute.nameInGroup = metadata.nameInGroup;
                } else {
                    if (metadata.usage.Detail) {
                        detailAttributes.push(attribute);
                    }
                    // if (!metadata.usage.Title && !metadata.usage.Detail && attribute.isHighlighted) {
                    //     whyFoundAttributes.push(attribute);
                    // }
                }

                if (metadata.usage.Navigation) {
                    if (metadata.usage.Navigation.mainNavigation) {
                        fallbackDefaultNavigationTarget = this.sina._createNavigationTarget({
                            label: attribute.value,
                            targetUrl: attribute.value
                        });
                    }
                }

                allAttributes[attribute.id] = attribute;

                semanticObjectType = dataSource.attributeMetadataMap[metadata.id].semanticObjectType || '';
                if (semanticObjectType.length > 0) {
                    semanticObjectTypeAttributes[semanticObjectType] = attrValue;
                }
            }

            for (i = 0; i < attributesLookingForTheirUomAttribute.length; i++) {
                attribute = attributesLookingForTheirUomAttribute[i];
                metadata = dataSource.getAttributeMetadata(attribute.id);

                if (metadata.unitOfMeasureAttribute) {
                    unitOfMeasureAttribute = unitOfMeasureAttributes[metadata.unitOfMeasureAttribute.id];
                    if (unitOfMeasureAttribute) {
                        attribute.unitOfMeasure = unitOfMeasureAttribute;
                    }
                }
            }

            for (i = 0; i < attributesLookingForTheirDescriptionAttribute.length; i++) {
                attribute = attributesLookingForTheirDescriptionAttribute[i];
                metadata = dataSource.getAttributeMetadata(attribute.id);

                if (metadata.descriptionAttribute) {
                    descriptionAttribute = allAttributes[metadata.descriptionAttribute.id];
                    if (descriptionAttribute) {
                        attribute.description = descriptionAttribute;
                    }
                }
            }

            for (suvAttributeName in suvAttributes) {
                suvAttribute = suvAttributes[suvAttributeName];
                if (typeof suvAttribute.suvTargetUrlAttribute == "string") {
                    suvAttribute.suvTargetUrlAttribute = allAttributes[suvAttribute.suvTargetUrlAttribute];
                }
                if (typeof suvAttribute.suvTargetMimeTypeAttribute == "string") {
                    suvAttribute.suvTargetMimeTypeAttribute = allAttributes[suvAttribute.suvTargetMimeTypeAttribute];
                }
                if (!(suvAttribute.suvTargetUrlAttribute || suvAttribute.suvTargetMimeTypeAttribute)) {
                    delete suvAttributes[suvAttributeName];
                }
            }

            titleAttributes.sort(function (a1, a2) {
                return a1.metadata.usage.Title.displayOrder - a2.metadata.usage.Title.displayOrder;
            });

            detailAttributes.sort(function (a1, a2) {
                return a1.metadata.usage.Detail.displayOrder - a2.metadata.usage.Detail.displayOrder;
            });



            // concatinate whyFound attributes to detail attributes
            // whyFoundAttributes = whyFounds; //TODO convert format
            // detailAttributes = detailAttributes.concat(whyFoundAttributes);

            var title = [];
            var titleHighlighted = [];
            for (i = 0; i < titleAttributes.length; ++i) {
                var titleAttribute = titleAttributes[i];
                title.push(titleAttribute.valueFormatted);
                titleHighlighted.push(titleAttribute.valueHighlighted);
            }
            title = title.join(' ');
            titleHighlighted = titleHighlighted.join(' ');

            this.suvNavTargetResolver.resolveSuvNavTargets(dataSource, suvAttributes, suvHighlightTerms);

            semanticObjectType = dataSource.sematicObjectType || '';
            var systemId = dataSource.system || '';
            var client = dataSource.client || '';
            //fallbackDefaultNavigationTarget = this.sina._createNavigationTarget({
            //    label: "",
            //    targetUrl: ""
            //});

            return this.intentsResolver.resolveIntents({
                semanticObjectType: semanticObjectType,
                semanticObjectTypeAttributes: semanticObjectTypeAttributes,
                systemId: systemId,
                client: client,
                fallbackDefaultNavigationTarget: fallbackDefaultNavigationTarget
            }).then(function (intents) {
                var defaultNavigationTarget = intents && intents.defaultNavigationTarget;
                var navigationTargets = intents && intents.navigationTargets;
                return this.sina._createSearchResultSetItem({
                    dataSource: dataSource,
                    title: title,
                    titleHighlighted: titleHighlighted,
                    titleAttributes: titleAttributes,
                    titleDescription: titleDescription,
                    detailAttributes: detailAttributes,
                    defaultNavigationTarget: defaultNavigationTarget,
                    navigationTargets: navigationTargets,
                    score: rankingScore
                });
            }.bind(this));
        }

    });

});
