/* global sinaDefine */
sinaDefine(['./FederationType'], function (FederationType) {
    "use strict";

    var module = {};

    var roundRobin = FederationType['round-robin'];
    var advancedRoundRobin = FederationType['advanced-round-robin'];

    module[roundRobin] = {};
    module[roundRobin].mergeMultiResults = function (firstResults, secondResults, mergeIndex) {
        if (mergeIndex < 1) {
            return [];
        }
        if (mergeIndex === 1) {
            return secondResults;
        }
        var firstLength = firstResults.length;
        var secondLength = secondResults.length;
        for (var i = 0; i < firstLength; i++) {
            if (i >= secondLength) {
                break;
            }
            firstResults.splice(mergeIndex * (i + 1) - 1, 0, secondResults[i]);
        }
        if (secondLength > firstLength) {
            firstResults = firstResults.concat(secondResults.slice(firstLength - secondLength));
        }
        return firstResults;
    };

    module[advancedRoundRobin] = {};
    module[advancedRoundRobin].mergeMultiResults = function (firstResults, secondResults, mergeIndex) {
        return secondResults;
    };

    return module;
});
