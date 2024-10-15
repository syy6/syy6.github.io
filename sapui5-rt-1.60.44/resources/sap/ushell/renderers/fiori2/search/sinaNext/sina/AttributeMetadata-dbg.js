/* global sinaDefine */
sinaDefine(['../core/core', './SinaObject', './AttributeMetadataBase'], function (core, SinaObject, AttributeMetadataBase) {
    "use strict";

    return AttributeMetadataBase.derive({

        _meta: {
            properties: {
                type: {
                    required: true
                },
                label: {
                    required: true
                },
                isSortable: {
                    required: true
                },
                format: {
                    required: false
                },
                isKey: {
                    required: true
                },
                isDescription: {
                    required: false
                },
                descriptionAttribute: {
                    required: false
                },
                descriptionTextArrangement: {
                    required: false
                },
                isQuantity: {
                    required: false
                },
                isUnitOfMeasure: {
                    required: false
                },
                unitOfMeasureAttribute: {
                    required: false
                },
                isPhoneNr: {
                    required: false
                },
                isEmailAddress: {
                    required: false
                },
                isHTTPURL: {
                    required: false
                },
                isCurrency: {
                    required: false
                },
                isFirstName: {
                    required: false
                },
                isLastName: {
                    required: false
                },
                matchingStrategy: {
                    required: true
                },
                group: {
                    required: false
                },
                nameInGroup: {
                    required: false
                }
            }
        }

    });

});
