/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the Scene class.
sap.ui.define([
	"jquery.sap.global", "../Scene", "./NodeHierarchy"
], function(jQuery, SceneBase, NodeHierarchy) {
	"use strict";

	/**
	 * Constructor for a new Scene.
	 *
	 * @class Provides the interface for the 3D model.
	 *
	 * The objects of this class should not be created directly.
	 *
	 * @param {THREE.Scene} scene The three.js scene object.
	 * @public
	 * @author SAP SE
	 * @version 1.60.14
	 * @extends sap.ui.vk.Scene
	 * @alias sap.ui.vk.threejs.Scene
	 */
	var Scene = SceneBase.extend("sap.ui.vk.threejs.Scene", /** @lends sap.ui.vk.threejs.Scene.prototype */ {
		metadata: {
		},

		constructor: function(scene) {
			SceneBase.call(this);

			this._id = jQuery.sap.uid();
			this._scene = scene;
			this._state = null;
			this._defaultNodeHierarchy = null;
			this._currentViewStateManager = null;
		}
	});

	Scene.prototype.destroy = function() {
		if (this._defaultNodeHierarchy) {
			this._defaultNodeHierarchy.destroy();
			this._defaultNodeHierarchy = null;
		}
		this._state = null;
		this._scene = null;

		SceneBase.prototype.destroy.call(this);
	};

	Scene.prototype.setDoubleSided = function(value) {
		this.setProperty("doubleSided", value, true);

		this._scene.traverse(function(node) {
			if (node.material !== undefined) {
				var userData = node.userData;
				var originalMaterialSide = THREE.FrontSide;
				var materialUserData;
				if (userData.originalMaterial) {
					if (userData.originalMaterial.userData === undefined) {
						userData.originalMaterial.userData = {};
					}
					materialUserData = userData.originalMaterial.userData;
					if (materialUserData.originalMaterialSide === undefined) {
						materialUserData.originalMaterialSide = userData.originalMaterial.side;
					}
					originalMaterialSide = 	materialUserData.originalMaterialSide;
				} else {
					if (node.material.userData === undefined) {
						node.material.userData = {};
					}
					materialUserData = node.material.userData;
					if (materialUserData.originalMaterialSide === undefined) {
						materialUserData.originalMaterialSide = node.material.side;
					}
					originalMaterialSide = 	materialUserData.originalMaterialSide;
				}
				node.material.side = value ? THREE.DoubleSide : originalMaterialSide;
			}
		});

		return this;
	};

	Scene.prototype.setViewStateManager = function(value) {
		this._currentViewStateManager = value;
		return this;
	};

	Scene.prototype.getViewStateManager = function() {
		return this._currentViewStateManager;
	};

	/**
	 * Gets the unique ID of the Scene object.
	 * @returns {string} The unique ID of the Scene object.
	 * @public
	 */
	Scene.prototype.getId = function() {
		return this._id;
	};

	/**
	 * Gets the default node hierarchy in the Scene object.
	 * @returns {sap.ui.vk.NodeHierarchy} The default node hierarchy in the Scene object.
	 * @public
	 */
	Scene.prototype.getDefaultNodeHierarchy = function() {
		if (!this._defaultNodeHierarchy) {
			this._defaultNodeHierarchy = new NodeHierarchy(this);
		}
		return this._defaultNodeHierarchy;
	};

	// THREE.Box3().applyMatrix4() analogue, but 10x faster and sutable for non-perspective transformation matrices. The original implementation is dumb.
	function box3ApplyMatrix4(boundingBox, matrix) {
		var min = boundingBox.min,
			max = boundingBox.max,
			m = matrix.elements,
			cx = (min.x + max.x) * 0.5,
			cy = (min.y + max.y) * 0.5,
			cz = (min.z + max.z) * 0.5,
			ex = max.x - cx,
			ey = max.y - cy,
			ez = max.z - cz;

		var tcx = m[ 0 ] * cx + m[ 4 ] * cy + m[ 8 ] * cz + m[ 12 ];
		var tcy = m[ 1 ] * cx + m[ 5 ] * cy + m[ 9 ] * cz + m[ 13 ];
		var tcz = m[ 2 ] * cx + m[ 6 ] * cy + m[ 10 ] * cz + m[ 14 ];

		var tex = Math.abs(m[ 0 ] * ex) + Math.abs(m[ 4 ] * ey) + Math.abs(m[ 8 ] * ez);
		var tey = Math.abs(m[ 1 ] * ex) + Math.abs(m[ 5 ] * ey) + Math.abs(m[ 9 ] * ez);
		var tez = Math.abs(m[ 2 ] * ex) + Math.abs(m[ 6 ] * ey) + Math.abs(m[ 10 ] * ez);

		min.set(tcx - tex, tcy - tey, tcz - tez);
		max.set(tcx + tex, tcy + tey, tcz + tez);
	}

	THREE.Object3D.prototype._expandBoundingBox = function(boundingBox, visibleOnly) {
		var nodeBoundingBox = new THREE.Box3();

		function expandBoundingBox(node) {
			var geometry = node.geometry;
			if (geometry !== undefined) {
				if (!geometry.boundingBox) {
					geometry.computeBoundingBox();
				}

				if (!geometry.boundingBox.isEmpty()) {
					nodeBoundingBox.copy(geometry.boundingBox);
					box3ApplyMatrix4(nodeBoundingBox, node.matrixWorld);

					boundingBox.min.min(nodeBoundingBox.min);
					boundingBox.max.max(nodeBoundingBox.max);
				}
			}

			var selectionBoundingBox = node.userData.boundingBox;
			if (selectionBoundingBox !== undefined && !selectionBoundingBox.isEmpty() && !visibleOnly) {
				nodeBoundingBox.copy(selectionBoundingBox);
				box3ApplyMatrix4(nodeBoundingBox, node.matrixWorld);

				boundingBox.min.min(nodeBoundingBox.min);
				boundingBox.max.max(nodeBoundingBox.max);
			}
		}

		this.updateMatrixWorld();
		if (visibleOnly) {
			this.traverseVisible(expandBoundingBox);
		} else {
			this.traverse(expandBoundingBox);
		}

		return boundingBox;
	};

	Scene.prototype._computeBoundingBox = function(visibleOnly) {
		var boundingBox = new THREE.Box3();
		if (this._scene) {
			this._scene._expandBoundingBox(boundingBox, visibleOnly);
		}
		return boundingBox;
	};

	/**
	 * Gets the scene reference for the Scene object.
	 * @returns {THREE.Scene} The three.js scene.
	 * @public
	 */
	Scene.prototype.getSceneRef = function() {
		return this._scene;
	};

	Scene.prototype._setState = function(state) {
		this._state = state;
	};

	/**
	 * Gets the persistent ID from node reference.
	 *
	 * @param {THREE.Object3D|THREE.Object3D[]} nodeRefs The reference to the node or the array of references to the nodes.
	 * @returns {string|string[]} The persistent ID or the array of the persistent IDs.
	 * @public
	 */
	Scene.prototype.nodeRefToPersistentId = function(nodeRefs) {
		var state = this._state;

		if (Array.isArray(nodeRefs)) {
			if (!state) {
				return [];
			}
			var ids = [];
			nodeRefs.forEach(function(nodeRef) {
				ids.push(state.object3DToSid(nodeRef));
			});
			return ids;
		} else {
			if (!state) {
				return null;
			}
			return state.object3DToSid(nodeRefs);
		}
	};

	/**
	 * Gets the node reference from persistent ID.
	 *
	 * @param {string|string[]} pIDs The persistent ID or the array of the persistent IDs.
	 * @returns {THREE.Object3D|THREE.Object3D[]} The reference to the node or the array of references to the nodes.
	 * @public
	 */
	Scene.prototype.persistentIdToNodeRef = function(pIDs) {
		var state = this._state;

		if (Array.isArray(pIDs)) {
			if (!state) {
				return [];
			}
			var nodeRefs = [];
			pIDs.forEach(function(pID) {
				nodeRefs.push(state.sidToObject3D(pID));
			});
			return nodeRefs;
		} else {
			if (!state) {
				return null;
			}
			return state.sidToObject3D(pIDs);
		}
	};

	/**
	 * Gets all materials defined in scene nodes
	 *
	 * @returns {sap.ui.vk.threejs.material[]} the array of materials.
	 * @public
	 */
	Scene.prototype.enumerateMaterials = function() {
		if (!this._defaultNodeHierarchy) {
			return [];
		}

		var topNode = this._defaultNodeHierarchy.createNodeProxy(this._scene);
		if (topNode) {
			return topNode.enumerateMaterials(true);
		} else {
			return [];
		}
	};

	return Scene;
});
