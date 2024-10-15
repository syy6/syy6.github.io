/* global sinaDefine */
sinaDefine(['../core/core', './ResultSetItem'], function (core, ResultSetItem) {
    "use strict";

    return ResultSetItem.derive({

        _meta: {
            properties: {
                dimensionValueFormatted: {
                    required: true
                },
                measureValue: {
                    required: true
                },
                measureValueFormatted: {
                    required: true
                }
            }
        },

        toString: function () {
            return this.dimensionValueFormatted + ':' + this.measureValueFormatted;
        }

    });

});
