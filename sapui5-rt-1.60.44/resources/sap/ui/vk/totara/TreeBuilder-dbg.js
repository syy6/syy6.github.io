sap.ui.define([
	"jquery.sap.global", "./ListMap", "./TotaraUtils"
], function(jQuery, ListMap, TotaraUtils) {
    "use strict";

    var TreeBuilder = function() {};

    TreeBuilder.getPartialTreeNodes = function(treeNodes, context, state) {
        var partialTreeRoots = [];
        var partialTreeNodes = [];

        var i, j, treeNode;
        if (treeNodes && treeNodes.length) {
            for (i = 0; i < treeNodes.length; i++) {
                treeNode = treeNodes[ i ];

                if (treeNode && treeNode.children) {
                    for (j = 0; j < treeNode.children.length; j++) {
                        var childIndex = treeNode.children[j];
                        treeNodes[ childIndex ].parentNode = treeNode;
                        if (treeNode.renderOrder) {
							treeNodes[ childIndex ].renderOrder = treeNode.renderOrder;
						}
                    }
                }
            }
        }

        if (treeNodes && treeNodes.length) {
            for (i = 0; i < treeNodes.length; i++) {
                treeNode = treeNodes[ i ];
                if (treeNode.parent) {   // specified root node and nodes without parent
                    partialTreeRoots.push(treeNode);
                } else if (!treeNode.parentNode) {
                    partialTreeRoots.push(treeNode);
                    if (context && context.rootNodeId) {
                        treeNode.parent = context.rootNodeId;
                    }
                }

                if (context && context.nodeSidsForPartialTree.has(treeNode.sid)) {
                    partialTreeNodes.push(treeNode);
                }
            }
        }

        if (context) {
            context.nodeSidsForPartialTree.clear();
        }

        if (!partialTreeNodes.length) { // full tree retrieval
            return partialTreeRoots;
        }

        partialTreeRoots = [];
        for (j = 0; j < partialTreeNodes.length; j++) {
            var node = partialTreeNodes[ j ];
            var parentNode = node.parentNode;
            while (parentNode) {
                if (state.sceneBuilder.getNode(parentNode.sid, context.sceneId)) {
                    node.parent = parentNode.sid;
                    partialTreeRoots.push(node);
                    break;
                } else {
                    node = parentNode;
                    parentNode = parentNode.parentNode;
                }
            }
        }

        if (partialTreeRoots.length) {
            return partialTreeRoots;
        } else {
            return partialTreeNodes;
        }
    };

    TreeBuilder.buildTree = function(state, context) {
        var result = {};

        if (!context.treeNodes || !context.treeNodes.length) {
            result.error = "no tree information";
            return result;
        }

        var treeNodes = context.treeNodes;
        var partialTreeRoots = TreeBuilder.getPartialTreeNodes(treeNodes, context, state);

        context.replacedNodes.clear();

        var retryList = []; // depending on the treeNode order, some of the parent(sid) might not have been created yet. so we keep them and try again.
        // if we have any partial trees, we assume this is partial tree update
        var i;
        var parentSid;
        for (i = 0; i < partialTreeRoots.length; i++) {

            parentSid = partialTreeRoots[ i ].parent;

            if (state.sceneBuilder.getNode(parentSid, context.sceneId)) {
                // TODO: add at a certain index when server provides the information
                TreeBuilder.buildNode(state, context, partialTreeRoots[ i ], parentSid);
            } else {
                retryList.push(partialTreeRoots[ i ]);
            }
        }

        for (i = 0; i < retryList.length; i++) {
            parentSid = retryList[ i ].parent;
            if (state.sceneBuilder.getNode(parentSid, context.sceneId)) {
                // TODO: add at a certain index when server provides the information
                TreeBuilder.buildNode(state, context, partialTreeRoots[ i ], parentSid);
            } else {
                if (!result.error) {
                    result.error = "";
                }
                result.error += "parent ${parentSid} does not exist in the scene. \n";
            }
        }

        // Reset tree nodes as indices of tree node only valid in one paylod
        // we don't need this list after tree is built.
        // state.sceneBuilder.resourcesCleanUp(state);
        context.treeNodes = [];

        context.progressCount.mesh.total = context.meshGroupListMap.size;

        return result;
    };

    TreeBuilder.buildNode = function(state, context, tNode, parentId) {

        if (!tNode || !parentId) {
            TotaraUtils.reportError(state, context, "totaraTreeBuilder - buildNode - invalid args");
            return;
        }

        var existingTreeNode = state.sceneBuilder.getNode(tNode.sid, context.sceneId);

        // This TreeNode is about to be updated and existing one should be removed.
        if (existingTreeNode) {
            state.sceneBuilder.remove(tNode.sid, context.sceneId);
        }

        // TreeNode delete
        if (tNode.suppressed === true) {
            // this is already deleted node. we don't want to build tree for this.
            return;
        }

        if (!tNode.sid) {
            TotaraUtils.reportError(state, context, "sid is missing in treeNode");
            return;
        }

        var res = state.sceneBuilder.createNode(tNode, parentId, context.sceneId);

        if (res.needSetSubmesh) {
            var meshGroupListMap = context.meshGroupListMap;
            var groupsToUpdate = meshGroupListMap.getOrCreate(tNode.meshId);

            groupsToUpdate.push(tNode.sid);
        }

        if (res.needUpdateMaterial) {
			state.materialIdsToRequest.add(tNode.materialId);
		}

		if (res.materialIds.length) {
			for (var mi = 0; mi < res.materialIds.length; mi++) {
				var nodeList = context.materialIdNodeListMapForOpacityUpdate.getOrCreate(res.materialIds[mi]);
				nodeList.push(tNode.sid);
			}
		}


        var newTreeNode = state.sceneBuilder.getNode(tNode.sid, context.sceneId);

        if (existingTreeNode && newTreeNode) {
            context.replacedNodes.set(existingTreeNode, newTreeNode);
        }

        if (tNode.children) {

            var treeNodes = context.treeNodes;

            for (var i = 0; i < tNode.children.length; i++) {

                var nodeIndex = tNode.children[ i ];
                TreeBuilder.buildNode(state, context, treeNodes[ nodeIndex ], tNode.sid);
            }

        }

    };

    return TreeBuilder;
});
