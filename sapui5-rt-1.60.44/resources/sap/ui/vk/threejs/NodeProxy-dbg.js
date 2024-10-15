/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides the NodeProxy class.
sap.ui.define([
	"../NodeProxy", "./Material"
], function(NodeProxyBase, Material) {
	"use strict";

	/**
	 * Constructor for a new NodeProxy.
	 *
	 * @class
	 * Provides a proxy object to the node in the node hierarchy.
	 *
	 * Objects of this type should only be created with the {@link sap.ui.vk.NodeHierarchy#createNodeProxy sap.ui.vk.NodeHierarchy.createNodeProxy} method.
	 * and destroyed with the {@link sap.ui.vk.NodeHierarchy#destroyNodeProxy sap.ui.vk.NodeHierarchy.destroyNodeProxy} method.
	 *
	 * @public
	 * @author SAP SE
	 * @version 1.60.14
	 * @extends sap.ui.vk.NodeProxy
	 * @alias sap.ui.vk.threejs.NodeProxy
	 */
	var NodeProxy = NodeProxyBase.extend("sap.ui.vk.threejs.NodeProxy", /** @lends sap.ui.vk.threejs.NodeProxy.prototype */ {
		metadata: {
		},

		constructor: function(nodeHierarchy, obj3D) {
			NodeProxyBase.call(this);

			this._object3D = obj3D; // THREE.Object3D
			this._nodeHierarchy = nodeHierarchy;
		}
	});

	NodeProxy.prototype.destroy = function() {
		this._object3D = null;

		NodeProxyBase.prototype.destroy.call(this);
	};

	NodeProxy.prototype.getNodeHierarchy = function() {
		return this._nodeHierarchy;
	};

	NodeProxy.prototype.getNodeRef = function() {
		return this._object3D;
	};

	NodeProxy.prototype.getNodeId = function() {
		return this._object3D;
	};

	NodeProxy.prototype.getVeId = function() {
		if (this._object3D.userData.treeNode) {
			return this._object3D.userData.treeNode.sid;
		} else {
			return null;
		}
	};

	NodeProxy.prototype.getMaterialId = function() {
		var refWithMaterial = this._object3D;
		if (this._object3D && !this._object3D.geometry) {
			if (this._object3D.children.length === 1 && this._object3D.children[0].geometry && (this._object3D.children[0].name === "" || this._object3D.children[0].name === undefined)) {
				refWithMaterial = this._object3D.children[0];
			}
		}

		if (refWithMaterial.material !== undefined &&
			refWithMaterial.material.userData !== undefined &&
			refWithMaterial.material.userData.materialId !== undefined){
			return refWithMaterial.material.userData.materialId;
		} else if (refWithMaterial.userData.originalMaterial !== undefined &&
				refWithMaterial.userData.originalMaterial.userData !== undefined &&
				refWithMaterial.userData.originalMaterial.userData.materialId !== undefined) {
				return refWithMaterial.userData.originalMaterial.userData.materialId;
		}

		return undefined;
	};

	NodeProxy.prototype.getName = function() {
		return this._object3D.name || ("<" + this._object3D.type + ">");
	};

	NodeProxy.prototype._updateAncestorsBoundingBox = function() {
		var parent = this._object3D.parent;
		while (parent) {
			if (parent.userData.boundingBox !== undefined) {
				parent._vkCalculateObjectOrientedBoundingBox();
			}
			parent = parent.parent;
		}
	};

	NodeProxy.prototype.getLocalMatrix = function() {
		return sap.ui.vk.TransformationMatrix.convertTo4x3(this._object3D.matrix.elements);
	};

	NodeProxy.prototype.setLocalMatrix = function(value) {
		if (value) {
			var obj3D = this._object3D;
			obj3D.matrix.fromArray(sap.ui.vk.TransformationMatrix.convertTo4x4(value));
			obj3D.matrix.decompose(obj3D.position, obj3D.quaternion, obj3D.scale);
			obj3D.updateMatrixWorld(true);
			this._updateAncestorsBoundingBox();
		}
		this.setProperty("localMatrix", value, true);
		return this;
	};

	NodeProxy.prototype.setLocalMatrixNotUpdatingBBox = function(value) {
		if (value) {
			var obj3D = this._object3D;
			obj3D.matrix.fromArray(sap.ui.vk.TransformationMatrix.convertTo4x4(value));
			obj3D.matrix.decompose(obj3D.position, obj3D.quaternion, obj3D.scale);
			obj3D.updateMatrixWorld(true);
		}
		this.setProperty("localMatrix", value, true);
		return this;
	};

	NodeProxy.prototype.getWorldMatrix = function() {
		return sap.ui.vk.TransformationMatrix.convertTo4x3(this._object3D.matrixWorld.elements);
	};

	NodeProxy.prototype.setWorldMatrix = function(value) {
		if (value) {
			var obj3D = this._object3D;
			obj3D.matrixWorld.fromArray(sap.ui.vk.TransformationMatrix.convertTo4x4(value));
			if (obj3D.parent) {
				obj3D.matrix.multiplyMatrices(new THREE.Matrix4().getInverse(obj3D.parent.matrixWorld), obj3D.matrixWorld);
			} else {
				obj3D.matrix.copy(obj3D.matrixWorld);
			}
			obj3D.matrix.decompose(obj3D.position, obj3D.quaternion, obj3D.scale);
			obj3D.updateMatrixWorld(true);
			this._updateAncestorsBoundingBox();
		}
		this.setProperty("worldMatrix", value, true);
		return this;
	};

	NodeProxy.prototype.getOpacity = function() {
		return this._object3D.userData.opacity;
	};

	NodeProxy.prototype.setOpacity = function(value) {
		var vsManager = this._nodeHierarchy.getScene().getViewStateManager();
		if (vsManager) {
			vsManager.setOpacity(this._object3D, value);
		} else {
			this._object3D._vkSetOpacity(value);
		}
		this.setProperty("opacity", value, true);
		return this;
	};

	NodeProxy.prototype.getTintColorABGR = function() {
		return this._object3D.userData.tintColor;
	};

	NodeProxy.prototype.setTintColorABGR = function(value) {
		var vsManager = this._nodeHierarchy.getScene().getViewStateManager();
		if (vsManager) {
			vsManager.setTintColor(this._object3D, value);
		} else {
			this._object3D._vkSetTintColor(value);
		}
		this.setProperty("tintColorABGR", value, true);
		this.setProperty("tintColor", sap.ui.vk.colorToCSSColor(sap.ui.vk.abgrToColor(value)), true);
		return this;
	};

	NodeProxy.prototype.getTintColor = function() {
		return sap.ui.vk.colorToCSSColor(sap.ui.vk.abgrToColor(this._object3D.userData.tintColor));
	};

	NodeProxy.prototype.setTintColor = function(value) {
		var abgr = sap.ui.vk.colorToABGR(sap.ui.vk.cssColorToColor(value));

		var vsManager = this._nodeHierarchy.getScene().getViewStateManager();
		if (vsManager) {
			vsManager.setOpacity(this._object3D, abgr);
		} else {
			this._object3D._vkSetTintColor(abgr);
		}
		this.setProperty("tintColorABGR", abgr, true);
		this.setProperty("tintColor", value, true);
		return this;
	};

	NodeProxy.prototype.getNodeMetadata = function() {
		return this._object3D.userData.metadata || {};
	};

	NodeProxy.prototype.getHasChildren = function() {
		return this._object3D.children.length > 0;
	};

	NodeProxy.prototype.getClosed = function() {
		return !!this._object3D.userData.closed;
	};

	/**
	 * Assign material to all mesh nodes contained in the current node
	 *
	 * @param {sap.ui.vk.threejs.materia} value material to be assigned.
	 * @returns {sap.ui.vk.threejs.NodeHierarchy} <code>this</code> to allow method chaining.
	 * @public
	 */
	NodeProxy.prototype.assignMaterial = function(value) {

		var setNodeRefMaterial = function(materialRef, nodeRef) {

			var materialId;
			if (materialRef.userData) {
				materialId = materialRef.userData.materialId;
				nodeRef.userData.materialId = materialId;
			}

			if (nodeRef.material !== undefined) {
				if (nodeRef.userData.highlightColor !== undefined) {
					nodeRef.userData.originalMaterial = materialRef;
					materialRef.userData.materialUsed++;

					nodeRef.material = materialRef.clone();
					var c = sap.ui.vk.abgrToColor(nodeRef.userData.highlightColor);
					nodeRef.material.color.lerp(new THREE.Color(c.red / 255.0, c.green / 255.0, c.blue / 255.0), c.alpha);
					if (materialRef.userData.defaultHighlightingEmissive) {
						nodeRef.material.emissive.copy(materialRef.userData.defaultHighlightingEmissive);
					}
					if (materialRef.userData.defaultHighlightingSpecular) {
						nodeRef.material.specular.copy(materialRef.userData.defaultHighlightingSpecular);
					}
				} else {
					nodeRef.material = materialRef;
					materialRef.userData.materialUsed++;
					delete nodeRef.userData.originalMaterial;
				}

				if (nodeRef.userData.opacity) {
					if (!nodeRef.userData.originalMaterial) {
						nodeRef.userData.originalMaterial = materialRef;
						nodeRef.material = materialRef.clone();
					}
					nodeRef.material.opacity *= nodeRef.userData.opacity;
					nodeRef.material.transparent = nodeRef.material.opacity < 0.99;
				}
			}
		};

		setNodeRefMaterial(value.getMaterialRef(), this._object3D);

		if (!this._object3D.children) {
			return this;
		}

		this._object3D.children.forEach(function(child) {
			if (!child) {
				return;
			}
			setNodeRefMaterial(value.getMaterialRef(), child);
		});

		return this;
	};

	/**
	 * Gets all materials defined in the current node
	 *
	 * @param {boolean} recursive if including the materials defined in all the child nodes
	 * @returns {sap.ui.vk.threejs.material[]} the array of materials.
	 * @public
	 */
	NodeProxy.prototype.enumerateMaterials = function(recursive) {
		var collectMaterials = function(nodeRef, materialRefSet, recursive){
			if (nodeRef) {
				if (nodeRef.userData.originalMaterial) {
					materialRefSet.add(nodeRef.userData.originalMaterial);
				} else if (nodeRef.material) {
					materialRefSet.add(nodeRef.material);
				}

				if (nodeRef.children) {
					nodeRef.children.forEach(function(child) {
						if (child) {
							if (recursive) {
								collectMaterials(child, materialRefSet, recursive);
							} else if (child.userData.originalMaterial) {
								materialRefSet.add(child.userData.originalMaterial);
							} else if (child.material) {
								materialRefSet.add(child.material);
							}
						}
					});
				}
			}
		};

		var matRefSet = new Set();
		collectMaterials(this._object3D, matRefSet, recursive);

		var materialRefs = [];
		matRefSet.forEach(function(val) {
			materialRefs.push(val);
		});

		var materials = [];

		for (var i = 0; i < materialRefs.length; i++) {
			var material = new Material();
			material.setMaterialRef(materialRefs[i]);
			materials.push(material);
		}

		return materials;
	};

	/**
	 * replace material with another material
	 *
	 * @param {sap.ui.vk.threejs.materia} materialToReplace material to be replaced.
	 * @param {sap.ui.vk.threejs.materia} material material replacement.
	 * @returns {sap.ui.vk.threejs.NodeHierarchy} <code>this</code> to allow method chaining.
	 * @public
	 */
	NodeProxy.prototype.replaceMaterials = function(materialToReplace, material) {
		var materialToReplaceRef = materialToReplace.getMaterialRef();
		var materialRef = material.getMaterialRef();
		if (this._object3D.userData.originalMaterial && this._object3D.userData.originalMaterial === materialToReplaceRef) {
			this._object3D.userData.originalMaterial = materialRef;
		} else if (this._object3D.material && this._object3D.material === materialToReplaceRef) {
			this._object3D.material = materialRef;
		}

		if (!this._object3D.children) {
			return this;
		}

		this._object3D.children.forEach(function(child) {
			if (child && child.userData.originalMaterial && child.userData.originalMaterial === materialToReplaceRef) {
				child.userData.originalMaterial = materialRef;
			} else if (child && child.material && child.material === materialToReplaceRef) {
				child.material = materialRef;
			}
		});

		return this;
	};

	return NodeProxy;
});
