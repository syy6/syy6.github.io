/* global jQuery,sap */
// iteration 0 ok

sap.ui.define([
    'sap/ushell/renderers/fiori2/search/SearchConfiguration',
    'sap/ushell/renderers/fiori2/search/SearchHelper',
    'sap/ushell/renderers/fiori2/search/SearchNavigationObject',
    'sap/ushell/renderers/fiori2/search/SearchNavigationObjectForSinaNavTarget',
    'sap/ushell/renderers/fiori2/search/sinaNext/sina/sinaFactory', // required to initialize sinaDefine function
    'sap/ushell/renderers/fiori2/search/sinaNext/sina/AttributeDescriptionTextArrangement',
    'sap/ushell/renderers/fiori2/search/sinaNext/sina/AttributeType'
], function (SearchConfiguration, SearchHelper, SearchNavigationObject, SearchNavigationObjectForSinaNavTarget, sinaFactory, AttributeDescriptionTextArrangement, AttributeType) {
    "use strict";

    var module = sap.ushell.renderers.fiori2.search.SearchResultListFormatter = function () {
        this.init.apply(this, arguments);
    };

    module.prototype = {
        init: function () {},

        format: function (searchResultSet, terms, options) {
            options = options || {};
            options.suppressHighlightedValues = options.suppressHighlightedValues || false;

            var layoutCache = {};
            var formattedResultItems = [];

            var resultItems = searchResultSet.items;

            var i, z;

            for (i = 0; i < resultItems.length; i++) {
                var resultItem = resultItems[i];

                var formattedResultItem = {};
                var aItemAttributes = [];

                for (z = 0; z < resultItem.detailAttributes.length; z++) {
                    var detailAttribute = resultItem.detailAttributes[z];

                    switch (detailAttribute.metadata.type) {
                    case AttributeType.ImageUrl:
                        formattedResultItem.imageUrl = detailAttribute.value;
                        formattedResultItem.imageFormat = detailAttribute.metadata.format ? detailAttribute.metadata.format.toLowerCase() : undefined;
                        if (detailAttribute.defaultNavigationTarget) {
                            formattedResultItem.imageNavigation = new SearchNavigationObjectForSinaNavTarget(detailAttribute.defaultNavigationTarget);
                        }
                        break;
                    case AttributeType.GeoJson:
                        formattedResultItem.geoJson = {
                            value: detailAttribute.value,
                            label: resultItem.title
                        };
                        break;
                    case AttributeType.Group:
                        var attributeGroupAsAttribute = this._formatAttributeGroup(detailAttribute, options, /*index*/ z);
                        aItemAttributes.push(attributeGroupAsAttribute);
                        break;
                    case AttributeType.Double:
                    case AttributeType.Integer:
                    case AttributeType.String:
                    case AttributeType.Longtext:
                    case AttributeType.Date:
                    case AttributeType.Time:
                    case AttributeType.Timestamp:
                        var oItemAttribute = this._formatSingleAttribute(detailAttribute, options, /*index*/ z);
                        aItemAttributes.push(oItemAttribute);
                        break;
                    }
                }

                formattedResultItem.key = resultItem.key;
                formattedResultItem.keystatus = resultItem.keystatus;

                formattedResultItem.dataSource = resultItem.dataSource;
                formattedResultItem.dataSourceName = resultItem.dataSource.label;


                if (resultItem.titleAttributes) {
                    var titleAttribute, formattedTitleAttribute, formattedTitle;
                    var title = [];
                    for (z = 0; z < resultItem.titleAttributes.length; z++) {
                        titleAttribute = resultItem.titleAttributes[z];
                        if (titleAttribute.metadata.type == AttributeType.Group) {
                            formattedTitleAttribute = this._formatAttributeGroup(titleAttribute, options, /*index*/ z);
                        } else {
                            formattedTitleAttribute = this._formatSingleAttribute(titleAttribute, options, /*index*/ z, /*useParenthesis*/ false);
                        }
                        formattedTitle = formattedTitleAttribute.value;
                        title.push(formattedTitle);
                    }
                    formattedResultItem.title = title.join(' ');
                } else {
                    formattedResultItem.title = options.suppressHighlightedValues ? resultItem.title : resultItem.titleHighlighted;
                }



                // formattedResultItem.title = options.suppressHighlightedValues ? resultItem.title : resultItem.titleHighlighted;
                // if (resultItem.titleAttributes && resultItem.titleAttributes.length == 1 && resultItem.titleAttributes[0].description) {
                //     var titleAttribute = resultItem.titleAttributes[0];
                //     var descriptionAttribute = titleAttribute.description;
                //     var descriptionValue = options.suppressHighlightedValues ? descriptionAttribute.valueFormatted : descriptionAttribute.valueHighlighted;
                //     var textArrangement = titleAttribute.metadata.descriptionTextArrangement;
                //     if (textArrangement == AttributeDescriptionTextArrangement.TextOnly && descriptionValue == descriptionAttribute.valueFormatted && formattedResultItem.title != resultItem.title) {
                //         textArrangement = AttributeDescriptionTextArrangement.TextFirst;
                //     }
                //     formattedResultItem.title = this._concatenateAttrValueAndDescriptionAccordingToArrangement(formattedResultItem.title, descriptionValue, textArrangement, false);
                // }

                formattedResultItem.titleDescription = resultItem.titleDescription ? resultItem.titleDescription : "";


                formattedResultItem.itemattributes = aItemAttributes;

                if (resultItem.defaultNavigationTarget) {
                    formattedResultItem.titleNavigation = new SearchNavigationObjectForSinaNavTarget(resultItem.defaultNavigationTarget);
                    if (!formattedResultItem.title || formattedResultItem.title.length == 0) {
                        formattedResultItem.title = resultItem.defaultNavigationTarget.label;
                    }
                }

                if (resultItem.navigationTargets && resultItem.navigationTargets.length > 0) {
                    formattedResultItem.navigationObjects = [];
                    for (var j = 0; j < resultItem.navigationTargets.length; j++) {
                        var navigationTarget = new SearchNavigationObjectForSinaNavTarget(resultItem.navigationTargets[j]);
                        navigationTarget.setLoggingType('RESULT_LIST_ITEM_NAVIGATE_CONTEXT');
                        formattedResultItem.navigationObjects.push(navigationTarget);
                    }
                }

                var layoutCacheForItemType = layoutCache[resultItem.dataSource.id] || {};
                layoutCache[resultItem.dataSource.id] = layoutCacheForItemType;
                formattedResultItem.layoutCache = layoutCacheForItemType;

                formattedResultItem.selected = formattedResultItem.selected || false;
                formattedResultItem.expanded = formattedResultItem.expanded || false;

                var additionalParameters = {};
                this._formatResultForDocuments(resultItem, additionalParameters);
                this._formatResultForNotes(resultItem, additionalParameters);
                formattedResultItem.additionalParameters = additionalParameters;

                formattedResultItem.positionInList = i;
                formattedResultItem.resultSetId = searchResultSet.id;

                formattedResultItems.push(formattedResultItem);
            }

            return formattedResultItems;
        },

        _formatAttributeGroup: function (attributeGroup, options, index) {
            var attributeGroupAsAttribute = {};
            var attributes = {};
            attributeGroupAsAttribute.name = attributeGroup.label;
            var isWhyFound = false;
            var isLongtext = false;
            for (var attributeName in attributeGroup.attributes) {
                var _attribute = attributeGroup.attributes[attributeName];
                var _formattedAttribute = this._formatSingleAttribute(_attribute, options, index);
                attributes[_attribute.nameInGroup] = _formattedAttribute;
                isWhyFound = isWhyFound || _formattedAttribute.whyfound;
                isLongtext = isLongtext || _formattedAttribute.longtext !== undefined;
            }
            attributeGroupAsAttribute.value = this._formatBasedOnGroupTemplate(attributeGroup.template, attributes, "value");
            attributeGroupAsAttribute.valueRaw = this._formatBasedOnGroupTemplate(attributeGroup.template, attributes, "valueRaw");
            attributeGroupAsAttribute.valueWithoutWhyfound = this._formatBasedOnGroupTemplate(attributeGroup.template, attributes, "valueWithoutWhyfound");

            attributeGroupAsAttribute.key = attributeGroup.id;
            attributeGroupAsAttribute.isTitle = false; // used in table view
            attributeGroupAsAttribute.isSortable = attributeGroup.metadata.isSortable; // used in table view
            attributeGroupAsAttribute.attributeIndex = index; // used in table view
            attributeGroupAsAttribute.displayOrder = attributeGroup.metadata.usage.Detail && attributeGroup.metadata.usage.Detail.displayOrder;
            attributeGroupAsAttribute.whyfound = isWhyFound;

            if (isLongtext) {
                attributeGroupAsAttribute.longtext = attributeGroupAsAttribute.value;
            }

            return attributeGroupAsAttribute;
        },

        _formatSingleAttribute: function (detailAttribute, options, index, useParenthesis) {
            var oItemAttribute = {};

            oItemAttribute.name = detailAttribute.label;
            oItemAttribute.valueRaw = detailAttribute.value;
            oItemAttribute.value = options.suppressHighlightedValues ? detailAttribute.valueFormatted : detailAttribute.valueHighlighted;
            oItemAttribute.valueWithoutWhyfound = detailAttribute.valueFormatted; //result[propDisplay].valueWithoutWhyfound;
            if (detailAttribute.unitOfMeasure) {
                if (options.suppressHighlightedValues || !detailAttribute.unitOfMeasure.valueHighlighted) {
                    oItemAttribute.value += " " + detailAttribute.unitOfMeasure.valueFormatted;
                } else {
                    oItemAttribute.value += " " + detailAttribute.unitOfMeasure.valueHighlighted;
                }
                oItemAttribute.valueWithoutWhyfound += " " + detailAttribute.unitOfMeasure.valueFormatted;
            }
            if (detailAttribute.description) {
                if (useParenthesis === undefined) {
                    useParenthesis = !(detailAttribute.metadata.isFirstName || detailAttribute.metadata.isLastName || detailAttribute.description.metadata.isFirstName || detailAttribute.description.metadata.isLastName);
                }
                var descriptionAttributeValue = (options.suppressHighlightedValues || !detailAttribute.description.valueHighlighted) ? detailAttribute.description.valueFormatted : detailAttribute.description.valueHighlighted;

                var textArrangement = detailAttribute.metadata.descriptionTextArrangement;
                if (textArrangement == AttributeDescriptionTextArrangement.TextOnly && descriptionAttributeValue == detailAttribute.description.valueFormatted && oItemAttribute.value != detailAttribute.valueFormatted) {
                    textArrangement = AttributeDescriptionTextArrangement.TextFirst;
                }
                oItemAttribute.value = this._concatenateAttrValueAndDescriptionAccordingToArrangement(oItemAttribute.value, descriptionAttributeValue, textArrangement, useParenthesis);
                oItemAttribute.valueWithoutWhyfound = this._concatenateAttrValueAndDescriptionAccordingToArrangement(oItemAttribute.valueWithoutWhyfound, detailAttribute.description.valueFormatted, textArrangement, useParenthesis);
            }

            // if (detailAttribute.isHighlighted && detailAttribute.metadata.type.toLowerCase() === "longtext") {
            //     // mix snippet into longtext values
            //     var valueHighlighted = detailAttribute.valueHighlighted;
            //     valueHighlighted = valueHighlighted.replace(/(^[.][.][.])|([.][.][.]$)/, "").trim();
            //     var valueUnHighlighted = valueHighlighted.replace(/[<]([/])?b[>]/g, "");
            //     oItemAttribute.value = detailAttribute.valueFormatted.replace(valueUnHighlighted, valueHighlighted);
            // }

            oItemAttribute.key = detailAttribute.id;
            oItemAttribute.isTitle = false; // used in table view
            oItemAttribute.isSortable = detailAttribute.metadata.isSortable; // used in table view
            oItemAttribute.attributeIndex = index; // used in table view
            oItemAttribute.displayOrder = detailAttribute.metadata.usage.Detail && detailAttribute.metadata.usage.Detail.displayOrder;
            oItemAttribute.whyfound = detailAttribute.isHighlighted;
            if (detailAttribute.defaultNavigationTarget) {
                oItemAttribute.defaultNavigationTarget = new SearchNavigationObjectForSinaNavTarget(detailAttribute.defaultNavigationTarget);
            }
            // oItemAttribute.hidden = detailAttribute.metadata.hidden;
            if (detailAttribute.metadata.type === AttributeType.Longtext) {
                oItemAttribute.longtext = detailAttribute.value;
            }

            if (detailAttribute.metadata.format && detailAttribute.metadata.format === AttributeType.Multilinetext) {
                oItemAttribute.longtext = detailAttribute.value;
            }

            return oItemAttribute;
        },

        _formatBasedOnGroupTemplate: function (template, attributes, valuePropertyName) {
            if (!(template && attributes && valuePropertyName)) {
                return "";
            }
            var value = "",
                pos = 0;
            var match, regex = /{\w+}/gi;
            while ((match = regex.exec(template)) !== null) {
                value += template.substring(pos, match.index);
                var attributeName = match[0].slice(1, -1);
                value += attributes[attributeName] && attributes[attributeName][valuePropertyName] || "";
                pos = regex.lastIndex;
            }
            value += template.substring(pos);
            return value;
        },

        _concatenateAttrValueAndDescriptionAccordingToArrangement: function (attributeValue, descriptionText, arrangement, useParenthesis) {
            if (attributeValue.trim().length == 0 && descriptionText.trim().length == 0) {
                return "";
            }
            useParenthesis = useParenthesis != undefined ? useParenthesis : true;
            switch (arrangement) {
            case AttributeDescriptionTextArrangement.TextOnly:
                return descriptionText;
            case AttributeDescriptionTextArrangement.TextSeparate:
                return attributeValue + " " + descriptionText;
            case AttributeDescriptionTextArrangement.TextFirst:
                if (attributeValue.trim().length == 0) {
                    return descriptionText;
                }
                if (useParenthesis) {
                    attributeValue = "(" + attributeValue + ")";
                }
                return descriptionText + " " + attributeValue;
            case AttributeDescriptionTextArrangement.TextLast:
            default:
                if (descriptionText.trim().length == 0) {
                    return attributeValue;
                }
                if (useParenthesis) {
                    descriptionText = "(" + descriptionText + ")";
                }
                return attributeValue + " " + descriptionText;
            }
        },

        _formatResultForDocuments: function (resultItem, additionalParameters) {
            var keyFields = '';
            additionalParameters.isDocumentConnector = false;

            var j, detailAttribute;
            for (j = 0; j < resultItem.detailAttributes.length; j++) {
                detailAttribute = resultItem.detailAttributes[j];

                if (detailAttribute.metadata.id === 'FILE_PROPERTY') {
                    additionalParameters.isDocumentConnector = true;
                }

                if (detailAttribute.metadata.isKey === true) {
                    if (keyFields.length > 0) {
                        keyFields += ';';
                    }
                    keyFields = keyFields + detailAttribute.metadata.id + '=' + detailAttribute.value; //encodeURIComponent(result[prop].valueRaw);
                }
            }

            //fileloader
            if (additionalParameters.isDocumentConnector === true) {
                var sidClient = ';o=sid(' + resultItem.dataSource.system + '.' + resultItem.dataSource.client + ')';

                var connectorName = resultItem.dataSource.id;
                additionalParameters.imageUrl = "/sap/opu/odata/SAP/ESH_SEARCH_SRV" + sidClient + "/FileLoaderFiles(ConnectorId='" + connectorName + "',FileType='ThumbNail',SelectionParameters='" + keyFields + "')/$value";
                additionalParameters.titleUrl = "/sap/opu/odata/SAP/ESH_SEARCH_SRV" + sidClient + "/FileLoaderFiles(ConnectorId='" + connectorName + "',FileType='BinaryContent',SelectionParameters='" + keyFields + "')/$value";
                // var suvlink = "/sap/opu/odata/SAP/ESH_SEARCH_SRV/FileLoaderFiles(ConnectorId='" + connectorName + "',FileType='SUVFile',SelectionParameters='PHIO_ID=" + resultItem.PHIO_ID.valueRaw + "')/$value?sap-client=" + client;
                // var suvlink = '/sap-pdfjs/web/viewer.html?file=' + encodeURIComponent(suvlink);
                var suvlink = "/sap/opu/odata/SAP/ESH_SEARCH_SRV" + sidClient + "/FileLoaderFiles(ConnectorId='" + connectorName + "',FileType='SUVFile',SelectionParameters='" + keyFields + "')/$value";
                additionalParameters.suvlink = '/sap/bc/ui5_ui5/ui2/ushell/resources/sap/fileviewer/viewer/web/viewer.html?file=' + encodeURIComponent(suvlink);

                if (!resultItem.navigationObjects) {
                    resultItem.navigationObjects = [];
                }
                var navigationTarget = new SearchNavigationObject({
                    text: "Show Document",
                    href: additionalParameters.suvlink,
                    target: "_blank"
                });
                resultItem.navigationObjects.push(navigationTarget);

                for (j = 0; j < resultItem.detailAttributes.length; j++) {
                    detailAttribute = resultItem.detailAttributes[j];
                    if (detailAttribute.id == 'PHIO_ID_THUMBNAIL' && detailAttribute.value) {
                        additionalParameters.containsThumbnail = true;
                    }
                    if (detailAttribute.id == 'PHIO_ID_SUV' && detailAttribute.value) {
                        additionalParameters.containsSuvFile = true;
                    }
                }
            }
        },

        _formatResultForNotes: function (resultItem, additionalParameters) {

        }
    };

    return module;
});
