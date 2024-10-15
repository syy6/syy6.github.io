sap.ui.define([
	"jquery.sap.global", "./ListMap", "./CameraHandler", "./TotaraUtils", "./TreeBuilder"
], function(jQuery, ListMap, CameraHandler, TotaraUtils, TreeBuilder) {
    "use strict";

    var ViewBuilder = function() {};

    ViewBuilder.buildView = function(state, context) {
        var result = {};

        if (!context.treeNodes || !context.treeNodes.length) {
            result.error = "no tree information";
            return result;
        }

        var treeNodes = context.treeNodes;
        var partialTreeRoots = TreeBuilder.getPartialTreeNodes(treeNodes);

        var nodeInfos = []; // nodeInfo { sid, transform(optional), visiblity(optional) }
        // if we have any partial trees, we assume this is partial tree update
        for (var i = 0; i < partialTreeRoots.length; i++) {

            var parentSid = partialTreeRoots[ i ].parent;

            ViewBuilder.processNode(state, context, partialTreeRoots[ i ], nodeInfos, parentSid);
        }

        result.nodeInfos = nodeInfos;
        // Reset tree nodes as indices of tree node only valid in one paylod
        // we don't need this list after tree is built.
        // resourcesCleanUp(state); // we currently cannot delete node for view.. so no need to clean up? // TODO: findout how to clean up
        context.treeNodes = [];
        return result;
    };

    // check tree
    // if tree node already exist, we build item list for view which will be passed as info for activate view later
    // if tree node does not exist, we need to retrieve them. we consider view is finished when we retrieve all boundingbox meshes
    ViewBuilder.buildViewNode = function(state, context, tNode, nodeInfos) {

        if (!tNode) {
            TotaraUtils.reportError(state, context, "totaraTreeBuilder - buildNode - invalid args");
            return;
        }

        // now this is the parent
        var treeNode = state.sceneBuilder.getNode(tNode.sid, context.sceneId);

        // push node info
        var nodeInfo = {
            target: treeNode
        };

        var res = state.sceneBuilder.updateMaterialInNode(tNode, context.sceneId);

        if (res.needUpdateMaterial) {
            if (tNode.opacity) {
                var nodeList = context.materialIdNodeListMapForOpacityUpdate.getOrCreate(tNode.materialId);
                nodeList.push(tNode.sid);
            }
            state.materialIdsToRequest.add(tNode.materialId);
        }

        if (res.nodeUpdated) {
            context.updatedNodes.add(state.sceneBuilder.getNode(tNode.sid, context.sceneId));
        }

        if (tNode.transform) { // column major to row major
            nodeInfo.transform = TotaraUtils.arrayToColumnMajorMatrixArray16(tNode.transform);
        } else {
            nodeInfo.transform = [ 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0 ];
        }

        if (tNode.visible === undefined) {
            nodeInfo.visible = true;
        } else {
            nodeInfo.visible = tNode.visible;
        }

        nodeInfos.push(nodeInfo);

        var existingChildrenSids = state.sceneBuilder.getChildNodeIds(tNode.sid, context.sceneId);
        var incomingChildrenSids = collectChildSidsFromTreeNode(context.treeNodes, tNode);

        var currentSid;
        var i;
        for (i = 0; i < existingChildrenSids.length; i++) {
            currentSid = existingChildrenSids[ i ];

            for (var j = 0; j < incomingChildrenSids.length; j++) {
                if (currentSid === incomingChildrenSids[ j ]) {
                    existingChildrenSids[ i ] = undefined; // we have this sid in new tree as well.. remove it from the list
                    break;
                }
            }
        }

        // now existingChildrentSids only contains sids which should be hidden from the new view.
        for (i = 0; i < existingChildrenSids.length; i++) {
            var sidToHide = existingChildrenSids[ i ];
            if (sidToHide !== undefined) {
                nodeInfos.push({
                    target: state.sceneBuilder.getNode(sidToHide, context.sceneId),
                    visible: false
                });
            }
        }

        // check other children
        if (tNode.children) {
            for (i = 0; i < tNode.children.length; i++) {

                var nodeIndex = tNode.children[ i ];
                var childTreeNode = context.treeNodes[ nodeIndex ];

                ViewBuilder.processNode(state, context, childTreeNode, nodeInfos, tNode.sid);
            }
        }
    };


    // check if this sid already exist.
    // for now, just check if it is in the map.
    // as we don't restructure tree, checking if exist in the map is good enough
    // if we restrucutre trees, we need to search in the children of existing threejs tree
    ViewBuilder.processNode = function(state, context, tNode, nodeInfos, parentSid) {

        var treeNode = state.sceneBuilder.getNode(tNode.sid, context.sceneId);

        if (treeNode) {
            // has tree node already
            ViewBuilder.buildViewNode(state, context, tNode, nodeInfos);
        } else {

            TreeBuilder.buildNode(state, context, tNode, parentSid);
            // newly built node should be hidden until we activate the view
            var newlyCreatedNode = state.sceneBuilder.getNode(tNode.sid, context.sceneId);
            if (newlyCreatedNode) { // must exist but just in case...
                newlyCreatedNode.visible = false;

                // but this should be set to correct visiblity when view activated
                nodeInfos.push({
                    target: newlyCreatedNode,
                    visible: tNode.visible === undefined ? true : tNode.visible
                });
            }
        }
    };

    function collectChildSidsFromTreeNode(treeNodeList, treeNode) {
        var sids = [];
        var index = 0;

        if (treeNode && treeNode.children) {
            for (var i = 0; i < treeNode.children.length; i++) {
                index = treeNode.children[ i ];
                sids.push(treeNodeList[ index ].sid);
            }
        }

        return sids;
    }

    return ViewBuilder;
});
