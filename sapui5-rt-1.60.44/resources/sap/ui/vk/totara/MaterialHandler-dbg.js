sap.ui.define([
	"jquery.sap.global",  "./TotaraUtils"
], function(jQuery, TotaraUtils) {
    "use strict";

    var MaterialHandler = function() {};

    MaterialHandler.setMaterial = function(state, command) {

        if (TotaraUtils.checkError(command)) {
            return command;
        }

        var materials = command.materials;

        var relatedItems = {
            imageIdSet: new Set() // image which we need to request or this material.
        };

        for (var i = 0; i < materials.length; i++) {
            var material = materials[i];
            var TextureTypeImageIdPairs = [];

            TextureTypeImageIdPairs = state.sceneBuilder.createMaterial(material);

            if (TextureTypeImageIdPairs.length) {
                for (var ai = 0; ai < TextureTypeImageIdPairs.length; ai++) {
                    var pair = TextureTypeImageIdPairs[ai];

                    var texturesToUpdate = state.texturesToUpdate;

                    var textureList = texturesToUpdate.get(pair.imageId);
                    if (!textureList) {
                        textureList = [];
                        texturesToUpdate.set(pair.imageId, textureList);
                    }

                    textureList.push({
                        textureType: pair.textureType,
                        materialId: material.id
                    });

                    relatedItems.imageIdSet.add(pair.imageId);
                }

            }

            var valueIterator = state.contextMap.values();
            var ci = valueIterator.next();
            while (!ci.done) {
                var context = ci.value;
                ci = valueIterator.next();
                var nodeList = context.materialIdNodeListMapForOpacityUpdate.get(material.id);
                if (nodeList) {
                    for (var j = 0; j < nodeList.length; j++) {
                        state.sceneBuilder.applyNodeOpacityToSubmeshes(nodeList[j], context.sceneId, material.id);
                    }
                    context.materialIdNodeListMapForOpacityUpdate.delete(material.id);
                }
            }
            state.materialIdsToRequest.delete(material.id);
        }

        return relatedItems;
    };

    MaterialHandler.updateTexture = function(state, imageId) {

        var texturesToUpdate = state.texturesToUpdate.get(imageId);

        if (texturesToUpdate) {
            for (var i = 0, imax = texturesToUpdate.length; i < imax; i++) {
                var item = texturesToUpdate[i];
                state.sceneBuilder.updateTextureMap(item.materialId, item.textureType);
            }
            state.texturesToUpdate.delete(imageId); // we all updated items related to this image
        }
    };

    return MaterialHandler;
});

