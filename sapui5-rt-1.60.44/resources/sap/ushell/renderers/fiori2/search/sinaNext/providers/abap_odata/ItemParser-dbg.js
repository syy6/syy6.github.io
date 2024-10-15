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
            if (data.ResultList.SearchResults === null) {
                return Promise.resolve([]);
            }
            var itemsData = data.ResultList.SearchResults.results;
            return this.parseItems(itemsData);
        },
        parseItems: function (itemsData) {
            var itemProms = [];
            for (var i = 0; i < itemsData.length; ++i) {
                var itemData = itemsData[i];
                var itemProm = this.parseItem(itemData);
                itemProms.push(itemProm);
            }
            return Promise.all(itemProms);
        },
        parseItem: function (itemData) {
            var i, j, k, m;
            var allAttributes = {};
            var titleAttributes = [];
            var titleDescription = "";
            var detailAttributes = [];
            var descriptionAttribute, unitOfMeasureAttribute, suvAttribute, suvAttributeName, suvUrlAttribute, suvMimeTypeAttribute;
            var unitOfMeasureAttributes = {}; // includes currency attributes
            // var descriptionAttributes = {};
            var attributesLookingForTheirUomAttribute = [];
            var attributesLookingForTheirDescriptionAttribute = [];
            var suvAttributes = {};
            var whyFoundAttributes = [];
            var semanticObjectTypeAttributes = [];
            var fallbackDefaultNavigationTarget;
            var dataSource = this.sina.getDataSource(itemData.DataSourceId);
            var attributeData, metadata, attribute, semanticObjectType;
            var suvHighlightTerms = [];
            var attributeGroups = {};
            var score = itemData.Score / 100;
            var value;

            for (j = 0; j < itemData.Attributes.results.length; j++) {

                attributeData = itemData.Attributes.results[j];
                metadata = dataSource.getAttributeMetadata(attributeData.Id);

                attribute = this.sina._createSearchResultSetItemAttribute({
                    id: attributeData.Id,
                    label: metadata.label,
                    value: typeConverter.odata2Sina(metadata.type, attributeData.Value),
                    valueFormatted: attributeData.ValueFormatted || "",
                    // replace: attributeData.ValueFormatted || attributeData.Value
                    // "" || "0000-00-00" -> "0000-00-00" is meaningless value
                    valueHighlighted: attributeData.Snippet || attributeData.ValueFormatted || "",
                    // replace: ... || attributeData.ValueFormatted || attributeData.Value
                    // "" || "0000-00-00" -> "0000-00-00" is meaningless value
                    isHighlighted: attributeData.Snippet.indexOf("<b>") > -1 && attributeData.Snippet.indexOf("</b>") > -1,
                    metadata: metadata
                });

                util.appendRemovingDuplicates(suvHighlightTerms, util.extractHighlightedTerms(attribute.valueHighlighted));

                if (metadata.isUnitOfMeasure || metadata.isCurrency) {
                    unitOfMeasureAttributes[attributeData.Id] = attribute;
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
                    suvAttributes[attributeData.Id] = {
                        suvThumbnailAttribute: attribute,
                        suvTargetUrlAttribute: suvUrlAttribute,
                        suvTargetMimeTypeAttribute: suvMimeTypeAttribute
                    };
                }

                //attribute = util.addPotentialNavTargetsToAttribute(this.sina, attribute); //find emails phone nrs etc and augment attribute if required

                if (metadata.usage.Navigation) {
                    if (metadata.usage.Navigation.mainNavigation) {
                        fallbackDefaultNavigationTarget = this.sina._createNavigationTarget({
                            label: attribute.value,
                            targetUrl: attribute.value
                        });
                    }
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
                        if (metadata.group.usage.Title) {
                            titleAttributes.push(group);
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
                    if (!metadata.usage.Title && !metadata.usage.Detail && !metadata.isDescription && (attribute.isHighlighted || (attribute.descriptionAttribute && attribute.descriptionAttribute.isHighlighted))) {
                        whyFoundAttributes.push(attribute);
                    }
                }

                if (metadata.usage.Title) {
                    titleAttributes.push(attribute);
                }
                if (metadata.usage.TitleDescription) {
                    titleDescription = attribute.valueHighlighted;
                }

                allAttributes[attribute.id] = attribute;

                semanticObjectType = dataSource.attributeMetadataMap[attribute.id].semanticObjectType;

                if (semanticObjectType.length > 0) {
                    semanticObjectTypeAttributes.push({
                        name: semanticObjectType,
                        value: attribute.value,
                        type: attribute.metadata.type
                    });
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

            // parse HitAttributes
            if (itemData.HitAttributes !== null) {
                for (k = 0; k < itemData.HitAttributes.results.length; k++) {

                    attributeData = itemData.HitAttributes.results[k];
                    metadata = dataSource.getAttributeMetadata(attributeData.Id);
                    value = typeConverter.odata2Sina(metadata.type, util.filterString(attributeData.Snippet, ['<b>', '</b>']));
                    attribute = this.sina._createSearchResultSetItemAttribute({
                        id: attributeData.Id,
                        label: metadata.label,
                        //TO DO: abap_odata2Sina
                        value: value,
                        valueFormatted: value,
                        valueHighlighted: attributeData.Snippet,
                        isHighlighted: attributeData.Snippet.indexOf("<b>") > -1 && attributeData.Snippet.indexOf("</b>") > -1,
                        metadata: metadata
                    });

                    util.appendRemovingDuplicates(suvHighlightTerms, util.extractHighlightedTerms(attribute.valueHighlighted));
                    whyFoundAttributes.push(attribute);
                }
            }

            // concatinate whyFound attributes to detail attributes
            detailAttributes = detailAttributes.concat(whyFoundAttributes);

            var title = [];
            var titleHighlighted = [];
            for (m = 0; m < titleAttributes.length; m++) {
                var titleAttribute = titleAttributes[m];
                title.push(titleAttribute.valueFormatted);
                titleHighlighted.push(titleAttribute.valueHighlighted);
            }
            title = title.join(' ');
            titleHighlighted = titleHighlighted.join(' ');

            this.suvNavTargetResolver.resolveSuvNavTargets(dataSource, suvAttributes, suvHighlightTerms);

            semanticObjectType = dataSource.sematicObjectType;
            var systemId = dataSource.system;
            var client = dataSource.client;
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
                    score: score
                });
            }.bind(this));
        }

    });

});
