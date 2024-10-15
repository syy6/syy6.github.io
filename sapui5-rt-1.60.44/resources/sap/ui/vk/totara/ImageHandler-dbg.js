sap.ui.define([
	"jquery.sap.global", "./MaterialHandler", "./TotaraUtils", "./Coder"
], function(jQuery, MaterialHandler, TotaraUtils, Coder) {
    "use strict";

    var ImageHandler = function() {};

    ImageHandler.setImage = function(state, imageHeader, imageBufferUint8) {

        if (TotaraUtils.checkError(imageHeader)) {
            return imageHeader;
        }

        var result = {};

        if (!imageBufferUint8) {
            if (imageHeader.error) {
                result.error = imageHeader.error;
            } else {
                result.error = "no image content for " + imageHeader.id;
            }

            return result;
        }

        imageHeader.binaryData =  imageBufferUint8;

        state.sceneBuilder.createImage(imageHeader);

        // in case we have material which was missing images
        MaterialHandler.updateTexture(state, imageHeader.id);

        result.id = imageHeader.id;

        return result;
    };

    return ImageHandler;
});

