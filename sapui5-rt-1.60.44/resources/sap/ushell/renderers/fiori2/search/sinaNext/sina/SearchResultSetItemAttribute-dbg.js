/* global sinaDefine */

sinaDefine(['../core/core', './SinaObject', './SearchResultSetItemAttributeBase'], function (core, SinaObject, SearchResultSetItemAttributeBase) {
    "use strict";

    return SearchResultSetItemAttributeBase.derive({

        _meta: {
            properties: {
                label: {
                    required: true
                },
                value: {
                    required: true
                },
                valueFormatted: {
                    required: true
                },
                valueHighlighted: {
                    required: true
                },
                isHighlighted: {
                    required: true
                },
                unitOfMeasure: {
                    required: false
                },
                description: {
                    required: false
                },
                defaultNavigationTarget: {
                    required: false,
                    aggregation: true
                },
                navigationTargets: {
                    required: false,
                    aggregation: true
                },
                group: {
                    required: false
                },
                nameInGroup: {
                    required: false
                },
                metadata: {
                    required: true
                }
            }
        },

        toString: function () {
            return this.label + ':' + this.valueFormatted;
        }

    });

});
