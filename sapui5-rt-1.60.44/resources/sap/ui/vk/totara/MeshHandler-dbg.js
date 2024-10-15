sap.ui.define([
    "jquery.sap.global", "./TotaraUtils",
    "./GeometryFactory", "./MaterialHandler", "./SceneStateContext"
], function(jQuery, TotaraUtils, GeometryFactory, MaterialHandler, SceneStateContext) {
    "use strict";

    var MeshHandler = function() {};

    MeshHandler.setMesh = function(state, command, bufferUint8) {

        if (TotaraUtils.checkError(command)) {
            return command;
        }

        var result = {
            updatedContexts: [], // list of contexts that are updated by this setGeometry
            materialIdSet: new Set(),
			geometryIdMap: new Map()
        }; // we need to request this items to make this mesh complete

        var meshes = command.meshes;
        var materialIdsToRequest = state.materialIdsToRequest;

        var context;

        var valueIterator = state.contextMap.values();
        var ci = valueIterator.next();
        while (!ci.done) {
            ci.value.isUpdatedBySetMesh = false;
            ci = valueIterator.next();
        }

        for (var i = 0; i < meshes.length; i++) {
            var mesh = meshes[i];
            var meshId = mesh.id;

            for (var j = 0; j < mesh.submeshes.length; j++) {

                var submesh = mesh.submeshes[j];

                var res = state.sceneBuilder.setSubmesh(meshId, submesh);

                if (res.needUpdataMaterial) {
                    result.materialIdSet.add(submesh.materialId);
                    materialIdsToRequest.add(submesh.materialId);
                }

                if (res.geometryIdToRequest) {
					result.geometryIdMap.set(res.geometryIdToRequest, res.geometryPriority);
                    state.geometryIdMaterialIdMap.set(res.geometryIdToRequest, submesh.materialId);
                }
            }

            // update mesh in each context
            valueIterator = state.contextMap.values();
            ci = valueIterator.next();
            while (!ci.done) {
                context = ci.value;
                ci = valueIterator.next();

                var meshGroupsToUpdate = context.meshGroupListMap.get(meshId);

                if (meshGroupsToUpdate) { // this model contains this mesh. we need to update it ;)

                    context.isUpdatedBySetMesh = true; // flag it

                    var getArrayFromSet = function(set) {
                        var arr = [];
                        set.forEach(function(value) { arr.push(value); });
                        return arr;
                    };

                    for (var k = 0; k < meshGroupsToUpdate.length; k++) { // for each tree node that has this mesh
                        var nodeId = meshGroupsToUpdate[k];

                        var resMeshes = state.sceneBuilder.attachSubMeshesToNode(nodeId, context.sceneId);
                        state.sceneBuilder.applyNodeMaterialToSubmeshes(nodeId, context.sceneId);

                        var opactiyResult = state.sceneBuilder.applyNodeOpacityToSubmeshes(nodeId, context.sceneId);
                        if (opactiyResult.materialIds.length) {
                            for (var mi = 0; mi < opactiyResult.materialIds.length; mi++) {
                                var nodeList = context.materialIdNodeListMapForOpacityUpdate.getOrCreate(opactiyResult.materialIds[mi]);
                                nodeList.push(nodeId);
                            }
                        }

                        var geometryIds = getArrayFromSet(resMeshes.idOfGeometriesToUpdate);

                        for (var n = 0; n < geometryIds.length; n++) {
                            var nodeIdsList = context.boundingBoxNodeIdsListMap.getOrCreate(geometryIds[n]);
                            nodeIdsList.push(nodeId);
                        }
                    }
                    context.meshGroupListMap.delete(meshId);
                    context.progressCount.mesh.count++;
                }
            }

        } // end of -- for (let mesh of meshes) {

        valueIterator = state.contextMap.values();
        ci = valueIterator.next();
        while (!ci.done) {
            context = ci.value;
            ci = valueIterator.next();
            if (context.isUpdatedBySetMesh) {
                result.updatedContexts.push(context); // collect updated contexts only
                delete context.isUpdatedBySetMesh;
            }
        }

        return result; // we need to request this materials
    };

    MeshHandler.setGeometry = function(state, geometryHeader, geometryBufferUint8) {

        if (TotaraUtils.checkError(geometryHeader)) {
            return geometryHeader;
        }

        var result = {
            updatedContexts: [] // list of contexts that are updated by this setGeometry
        };

        var geometryId = geometryHeader.id;

        if (!geometryBufferUint8 || geometryBufferUint8.length === 0) {
            result.error = "missing geometry " + geometryId;
            return result;
        }

        var geometryInfo = GeometryFactory.getGeometryInfo(geometryHeader, geometryBufferUint8);
        state.sceneBuilder.setGeometry(geometryInfo);

        var valueIterator = state.contextMap.values();
        var ci = valueIterator.next();
        while (!ci.done) {
            var context = ci.value;
            ci = valueIterator.next();
            // upgrade boundings with actual geometry
            var nodeIdsList = context.boundingBoxNodeIdsListMap.get(geometryId);

            if (nodeIdsList) {
                result.updatedContexts.push(context); // this model is updated with given geometry

                for (var i = 0; i < nodeIdsList.length; i++) {
                    state.sceneBuilder.updateGeometryInNode(nodeIdsList[i], geometryId, context.sceneId);
                }

                context.boundingBoxNodeIdsListMap.delete(geometryId);
            }

            // move these to totaraLoader
            if (context.boundingBoxNodeIdsListMap.size === 0) {
                context.phase = SceneStateContext.Phase.FinishedGeometry;
            }

            context.progressCount.geometry.count++;
        }

        if (geometryHeader && geometryHeader.flags) {
            var bHasNormals = (geometryHeader.flags & 2) > 0;
            if (!bHasNormals) { // PMI
                var materialId = state.geometryIdMaterialIdMap.get(geometryId);
                if (materialId) {
                    state.sceneBuilder.updateMaterialForGeometryWithoutNormal(materialId);
                }
            }
        }

        return result;
    };

    return MeshHandler;
});


