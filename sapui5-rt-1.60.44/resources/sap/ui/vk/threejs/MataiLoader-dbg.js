/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides object sap.ui.vk.threejs.MataiLoader.
sap.ui.define([
	"sap/base/Log"
], function(
	Log
) {
	"use strict";

	var SceneBuilder = function(parentNode) {
		this._id = SceneBuilder._nextId++;
		SceneBuilder.add(this);
		this._parentNode = parentNode;
		this._nodes = new Map();
		this._meshes = new Map();
		this._cameras = new Map();
		this._materials = new Map();
		this._images = new Map();
	};

	SceneBuilder._nextId = 1;

	SceneBuilder._map = new Map();
	SceneBuilder.add = function(sceneBuilder) {
		this._map.set(sceneBuilder.getId(), sceneBuilder);
		return this;
	};

	SceneBuilder.getById = function(id) {
		return this._map.get(id);
	};

	SceneBuilder.prototype.getId = function() {
		return this._id;
	};

	SceneBuilder.prototype.createNode = function(info) {
		var parent = this._nodes.get(info.parentRef) || null;
		var node = new THREE.Group();
		node.name = info.name;
		// node.opacity = info.opacity;
		// node.visible = info.visible;
		node.matrix.set(info.matrix[ 0 ], info.matrix[ 4 ], info.matrix[ 8 ], info.matrix[ 12 ],
			info.matrix[ 1 ], info.matrix[ 5 ], info.matrix[ 9 ], info.matrix[ 13 ],
			info.matrix[ 2 ], info.matrix[ 6 ], info.matrix[ 10 ], info.matrix[ 14 ],
			info.matrix[ 3 ], info.matrix[ 7 ], info.matrix[ 11 ], info.matrix[ 15 ]
		);
		node.matrix.decompose(node.position, node.quaternion, node.scale);
		node.userData.metadata = info.metadata;
		node.userData.veids = info.veids;
		(parent || this._parentNode).add(node);
		this._nodes.set(info.nodeRef, node);
	};

	var normals = new Float32Array([
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,
		0.0, 0.0, 1.0,

		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,
		0.0, 0.0, -1.0,

		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,
		0.0, 1.0, 0.0,

		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,
		0.0, -1.0, 0.0,

		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,
		1.0, 0.0, 0.0,

		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0,
		-1.0, 0.0, 0.0
	]);

	var indices = new Uint16Array([
		0, 1, 2, 2, 1, 3,
		4, 6, 5, 5, 6, 7,
		8 + 0, 8 + 1, 8 + 2, 8 + 2, 8 + 1, 8 + 3,
		8 + 4, 8 + 6, 8 + 5, 8 + 5, 8 + 6, 8 + 7,
		16 + 0, 16 + 1, 16 + 2, 16 + 2, 16 + 1, 16 + 3,
		16 + 4, 16 + 6, 16 + 5, 16 + 5, 16 + 6, 16 + 7
	]);

	SceneBuilder.prototype.createMesh = function(info) {
		var b = info.boundingBox;
		var vertices = new Float32Array([
			b[0], b[1], b[5],
			b[3], b[1], b[5],
			b[0], b[4], b[5],
			b[3], b[4], b[5],

			b[0], b[1], b[2],
			b[3], b[1], b[2],
			b[0], b[4], b[2],
			b[3], b[4], b[2],

			b[0], b[4], b[5],
			b[3], b[4], b[5],
			b[0], b[4], b[2],
			b[3], b[4], b[2],

			b[0], b[1], b[5],
			b[3], b[1], b[5],
			b[0], b[1], b[2],
			b[3], b[1], b[2],

			b[3], b[1], b[5],
			b[3], b[1], b[2],
			b[3], b[4], b[5],
			b[3], b[4], b[2],

			b[0], b[1], b[5],
			b[0], b[1], b[2],
			b[0], b[4], b[5],
			b[0], b[4], b[2]
		]);

		var geometry = new THREE.BufferGeometry();
		geometry.setIndex(new THREE.BufferAttribute(indices, 1));
		geometry.addAttribute("position", new THREE.BufferAttribute(vertices, 3));
		geometry.addAttribute("normal", new THREE.BufferAttribute(normals, 3));
		var mesh = new THREE.Mesh(geometry, this._materials.get(info.materialRef));
		this._meshes.set(info.meshRef, mesh);

		if (info.matrix) {
			mesh.matrix.set(info.matrix[ 0 ], info.matrix[ 4 ], info.matrix[ 8 ], info.matrix[ 12 ],
				info.matrix[ 1 ], info.matrix[ 5 ], info.matrix[ 9 ], info.matrix[ 13 ],
				info.matrix[ 2 ], info.matrix[ 6 ], info.matrix[ 10 ], info.matrix[ 14 ],
				info.matrix[ 3 ], info.matrix[ 7 ], info.matrix[ 11 ], info.matrix[ 15 ]
			);
			mesh.matrix.decompose(mesh.position, mesh.quaternion, mesh.scale);
		}
	};

	SceneBuilder.prototype.setMeshGeometry = function(info) {
		var mesh = this._meshes.get(info.meshRef);
		var data = info.data;
		var newGeometry = new THREE.BufferGeometry();
		newGeometry.setIndex(new THREE.BufferAttribute(data.index, 1));
		newGeometry.addAttribute("position", new THREE.BufferAttribute(data.position, 3));
		if (data.normal) {
			newGeometry.addAttribute("normal", new THREE.BufferAttribute(data.normal, 3));
		}
		if (data.uv) {
			newGeometry.addAttribute("uv", new THREE.BufferAttribute(data.uv, 2));
		}
		mesh.geometry.copy(newGeometry);
	};

	SceneBuilder.prototype.insertMesh = function(nodeRef, meshRef) {
		var node = this._nodes.get(nodeRef);
		var mesh = this._meshes.get(meshRef);
		node.add(mesh.parent ? mesh.clone() : mesh);
	};

	SceneBuilder.prototype.createCamera = function(info) {
		var camera = null;
		if (info.projection === "perspective") {
			camera = new sap.ui.vk.threejs.PerspectiveCamera();
			camera.setFov(info.fov);
		} else if (info.projection === "orthographic") {
			camera = new sap.ui.vk.threejs.OrthographicCamera();
			camera.setZoomFactor(info.orthoZoomFactor);
		}

		if (camera) {
			camera.setNearClipPlane(info.nearClip);
			camera.setFarClipPlane(info.farClip);
			camera.setUsingDefaultClipPlanes(info.autoEvaluateClipPlanes);

			var origin = new THREE.Vector3().fromArray(info.origin);
			var target = new THREE.Vector3().fromArray(info.target).sub(origin);
			var up = new THREE.Vector3().fromArray(info.up).sub(origin);

			camera.setUpDirection(up.toArray());
			camera.setPosition(origin.toArray());
			camera.setTargetDirection(target.toArray());
		}

		this._parentNode.userData.camera = camera;
		this._cameras.set(info.cameraRef, camera);
	};

	SceneBuilder.prototype.insertCamera = function(nodeRef, cameraRef) {
		var node = this._nodes.get(nodeRef);
		var camera = this._cameras.get(cameraRef);
		camera = camera ? camera.getCameraRef() : null;
		if (node && camera) {
			(node || this._parentNode).add(camera.parent ? camera.clone() : camera);
		}
	};

	SceneBuilder.prototype.createMaterial = function(info) {
		if (info.textures) {
			info.textures.forEach(function(textureInfo) {
				var filter = textureInfo.filterMode === 1 ? THREE.NearestFilter : THREE.LinearFilter;
				var texture = new THREE.Texture(
					this._images.get(textureInfo.imageRef),
					textureInfo.type === "reflection" ? THREE.SphericalReflectionMapping : THREE.UVMapping,
					textureInfo.repeatX ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping, // wrapS
					textureInfo.repeatY ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping, // wrapT
					filter, // magFilter
					filter  // minFilter
				);
				texture.offset.set(textureInfo.offsetX, textureInfo.offsetX);
				texture.repeat.set(textureInfo.scaleX, textureInfo.scaleY);
				info[ textureInfo.type + "Texture" ] = texture;
				texture.needsUpdate = true;
			}, this);
		}

		var material = new THREE.MeshPhongMaterial({
			opacity: info.opacity,
			color: new THREE.Color(info.diffuse[ 0 ], info.diffuse[ 1 ], info.diffuse[ 2 ]),
			emissive: new THREE.Color(info.emissive[ 0 ] + info.ambient[ 0 ] * 0.2, info.emissive[ 1 ] + info.ambient[ 1 ] * 0.2, info.emissive[ 2 ] + info.ambient[ 2 ] * 0.2),
			specular: new THREE.Color(info.specular[ 0 ], info.specular[ 1 ], info.specular[ 2 ]),
			map: info.diffuseTexture ? info.diffuseTexture : null,
			specularMap: info.specularTexture ? info.specularTexture : null,
			emissiveMap: info.emissiveTexture ? info.emissiveTexture : null,
			envMap: info.reflectionTexture ? info.reflectionTexture : null,
			alphaMap: info.opacityTexture ? info.opacityTexture : null,
			bumpMap: info.bumpTexture ? info.bumpTexture : null,
			transparent: info.opacity < 1 || !!info.opacityTexture
		});
		if (material.envMap) {
			material.combine = THREE.MixOperation;
			material.reflectivity = 0.5;
		}
		this._materials.set(info.materialRef, material);
	};

	SceneBuilder.prototype.createImage = function(info) {
		var data = window.btoa(String.fromCharCode.apply(null, info.data));
		var image = new THREE.ImageLoader().load("data:image/" + info.format + ";base64," + data);
		this._images.set(info.imageRef, image);
	};

	SceneBuilder.prototype.progress = function(progress) {
		Log.log("reading progress:", progress);
	};

	var onmessage = function(event) {
		var data = event.data;
		if (data.ready) {
			onmessage.resolve();
		} else {
			var sceneBuilder = SceneBuilder.getById(data.sceneBuilderId);
			sceneBuilder[data.method].apply(sceneBuilder, data.args);
		}
	};

	var onerror = function(event) {
		Log.error("Error in WebWorker", event);
	};

	var getWorker = (function() {
		var promise;
		return function() {
			return promise || (promise = new Promise(function(resolve) {
				var worker = new Worker(sap.ui.require.toUrl("sap/ui/vk/threejs/MataiLoaderWorker.js"));
				onmessage.resolve = resolve.bind(null, worker);
				worker.onmessage = onmessage;
				worker.onerror = onerror;
			}));
		};
	})();

	var loadContent = function(buffer, url, parentNode) {
		getWorker().then(function(worker) {
			var sceneBuilder = new SceneBuilder(parentNode);
			worker.postMessage(
				{
					method: "loadSceneFromArrayBuffer",
					sceneBuilderId: sceneBuilder.getId(),
					buffer: buffer,
					fileName: url,
					sourceLocation: "remote"
				},
				[ buffer ]
			);
		});
	};

	return function(parentNode, contentResource) {
		return new Promise(function(resolve, reject) {
			// download contentResource.source
			// pass it to worker
			if (typeof contentResource.getSource() === "string") {
				var url = contentResource.getSource();
				fetch(url)
					.then(function(response) {
						return response.arrayBuffer();
					})
					.then(function(buffer) {
						loadContent(buffer, url, parentNode);
						resolve({
							node: parentNode,
							contentResource: contentResource
						});
					});
			} /* else if (contentResource.getSource() instanceof File) {

			}*/
		});
	};
});
