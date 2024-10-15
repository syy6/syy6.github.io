/* global sinaDefine */

sinaDefine([
    '../../../sina/SinaObject'
], function (SinaObject) {
    "use strict";

    return SinaObject.derive({

        _init: function () {
            this.suvMimeType = "application/vnd.sap.universal-viewer+suv";
            this.suvViewerBasePath = "/sap/bc/ui5_ui5/ui2/ushell/resources/sap/fileviewer/viewer/web/viewer.html?file=";
        },

        addHighlightTermsToUrl: function (url, highlightTerms) {
            if (!highlightTerms) {
                return url;
            }
            url += '&searchTerms=' + encodeURIComponent(JSON.stringify({
                'terms': highlightTerms
            }));
            return url;
        },

        resolveSuvNavTargets: function (dataSource, suvAttributes, suvHighlightTerms) {

            for (var suvAttributeName in suvAttributes) {
                var suvAttribute = suvAttributes[suvAttributeName];
                var thumbnailAttribute = suvAttribute.suvThumbnailAttribute;
                if (suvAttribute.suvTargetMimeTypeAttribute.value == this.suvMimeType) {
                    var openSuvInFileViewerUrl = this.suvViewerBasePath + encodeURIComponent(suvAttribute.suvTargetUrlAttribute.value);
                    openSuvInFileViewerUrl = this.addHighlightTermsToUrl(openSuvInFileViewerUrl, suvHighlightTerms);
                    thumbnailAttribute.defaultNavigationTarget = this.sina._createNavigationTarget({
                        label: suvAttribute.suvTargetUrlAttribute.value,
                        targetUrl: openSuvInFileViewerUrl
                    });
                } else {
                    thumbnailAttribute.defaultNavigationTarget = this.sina._createNavigationTarget({
                        label: suvAttribute.suvTargetUrlAttribute.value,
                        targetUrl: suvAttribute.suvTargetUrlAttribute.value
                    });
                }
            }
        }
    });
});
