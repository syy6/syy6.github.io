/*!
* SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
*/

/* global THREE */

// Provides control sap.ui.vk.threejs.ContentDeliveryService.
sap.ui.define([
	"jquery.sap.global", "sap/ui/base/ManagedObject", "./thirdparty/three", "sap/ui/vk/totara/TotaraLoader", "./PerspectiveCamera", "./OrthographicCamera", "sap/ui/vk/View", "./Material"
], function(jQuery, ManagedObject, threeJs, TotaraLoader, PerspectiveCamera, OrthographicCamera, View, Material) {

	"use strict";

	/**
 	 *  Constructor for a new ContentDeliveryService.
 	 *
 	 * @class Provides a class to communicate with content delivery service.
 	 * @private
	 * @author SAP SE
	 * @version 1.60.14
	 * @extends sap.ui.core.ManagedObject
	 * @alias sap.ui.vk.threejs.ContentDeliveryService
	 */
	var ContentDeliveryService = ManagedObject.extend("sap.ui.vk.threejs.ContentDeliveryService", {
		metadata: {
			properties: {
				/**
				 * Callback functino to provide authorization token.
				 */
				authorizationHandler: "any"
			},
			events: {
				cameraChanged: {
					parameters: {
						sceneId: {
							type: "string"
						},
						camera: {
							type: "any"
						}
					},
					enableEventBubbling: true
				},
				sceneUpdated: {
					parameters: {
					},
					enableEventBubbling: true
				},
				errorReported: {
					parameters: {
						error: {
							type: "any"
						}
					}
				}
			}
		}
	});

	var basePrototype = ContentDeliveryService.getMetadata().getParent().getClass().prototype;

	ContentDeliveryService.prototype.init = function() {
		if (basePrototype.init) {
			basePrototype.init.call(this);
		}
		this._loader = null;

		// note we keep transientRoot in the map for reference.
		// we do not increase reference counter for resources (e.g geometry)
		// as transient ones will be removed anyway
		// We keep the original tree with userData in '_transientSceneMap'. and give cloned ones
		// when requested.
		// For now, we will keep the transient scene reference for the life time of
		// contentDeliveryService (totara)
		this._transientSceneMap = new Map(); // keeps transient scene. Typically POIs and symbols.

		this._currentNodeHierarchy = null;
	};

	/**
	 * Sets url of content delivery service server.
	 * @param {string} url Url of content delivery service. Allowed protocols are HTTP, HTTPS, WS and WSS.
	 * @param {boolean} keepCachedData flag for keeping cached data in the loader
 	 * @returns {bool} returns false if initialization fails.
 	 */
	ContentDeliveryService.prototype.initUrl = function(url, keepCachedData) {
		var that = this;
		// var connection;
		// var connectionInitPromise;

		function notifyUpdate() {
			that.fireSceneUpdated({});
		}

		if (!that._loader) {
			this._loader = new TotaraLoader();
			var state = this._loader.getState();

			state.onErrorCallbacks.attach(this._reportError.bind(that));
			state.onMaterialFinishedCallbacks.attach(notifyUpdate);
			state.onImageFinishedCallbacks.attach(notifyUpdate);
			state.onSetGeometryCallbacks.attach(notifyUpdate);
			return this._loader.init(url);
		} else if (!keepCachedData) {
			var currentState = this._loader.getState();

			if (currentState) {
				currentState.cleanup();
			}
		}
		return Promise.resolve("Loader is ready");
	};

	function createCameraWithThreeJsCamera(threeJsCamera) {
		if (!threeJsCamera) {
			return null;
		}

		// internally we create cameras directly.
		// in public API, users have to create camera from contentManager to be consistent with DVL
		var camera;
		if (threeJsCamera.isOrthographicCamera) {
			camera = new sap.ui.vk.threejs.OrthographicCamera();
		} else if (threeJsCamera.isPerspectiveCamera) {
			camera = new sap.ui.vk.threejs.PerspectiveCamera();
		}
		camera.setCameraRef(threeJsCamera);

		camera.setUsingDefaultClipPlanes(true); // always use auto as specific near far always cause trouble

		if (threeJsCamera.cameraInfo && threeJsCamera.cameraInfo.zoom === -1) {
			camera.setZoomNeedRecalculate(true);
		}

		return camera;
	}

	ContentDeliveryService.prototype._reportError = function(error) {
		this.fireErrorReported(error);
	};

	ContentDeliveryService.prototype._createLoadParam = function(resolve, reject, parentNode, contentResource) {
		var that = this;
		var initialCamera;
		var sceneLoaded = false;

		var contextParams = {
			root: parentNode,
			includeHidden: contentResource.getIncludeHidden(),
			pushPMI: contentResource.getPushPMI(),
			metadataFilter: contentResource.getMetadataFilter(),
			useSecureConnection: contentResource.getUseSecureConnection(),
			activateView: contentResource.getActivateView(),
			enableLogger: contentResource.getEnableLogger() === true,

			onActiveCamera: function(newCam) {
				var isInitialCam = false;
				var state = that._loader.getState();
				if (state) {
					var context = state.contextMap.get(contentResource.getVeid());
					if (context && context.phase < 2) { // 2 -> FinishedMesh
						// CDS is still getting the model
						initialCamera = createCameraWithThreeJsCamera(newCam);
						isInitialCam = true;
					}
				}

				if (!isInitialCam) {
					that.fireCameraChanged({
						sceneId: contentResource.getVeid(),
						camera: createCameraWithThreeJsCamera(newCam)
					});
				}
			},
			onInitialSceneFinished: function() {
				sceneLoaded = true;
				resolve({
					node: parentNode,
					camera: initialCamera,
					contentResource: contentResource,
					loader: that // passing cds as loader
				});
			}
		};

		var errorCallback = function(info) {
			var reason;
			if (info.getParameter("errorText")) {
				reason = info.getParameter("errorText");
			} else if (info.getParameter("error")) {
				reason = info.getParameter("error");
			} else if (info.getParameter("reason")) {
				reason = info.getParameter("reason");
			} else {
				reason = "failed to load: unknown reason";
			}

			if (sceneLoaded) {
				var errorCode = info.getParameter("error");
				if (errorCode && errorCode === 4) {
					// We had a good connection and now we lost it. Try to re-create connection
					this.initUrl(this._loader.getUrl(), true);
				}
			} else {
				that.detachErrorReported(errorCallback);

				// error from server has some detailed info
				if (info.getParameter("events")) {
					reason = reason + "\n" + JSON.stringify(info.getParameter("events"));
				}

				// if error happend before initial scene finished, we reject
				reject(reason);
			}
		};

		that.attachErrorReported(errorCallback);

		return contextParams;
	};

	ContentDeliveryService.prototype.load = function(parentNode, contentResource, authorizationHandler) {
		var that = this;

		var nodeProxy = contentResource.getNodeProxy();
		if (nodeProxy) {
			this._currentNodeHierarchy = nodeProxy.getNodeHierarchy();
		}

		return new Promise(function(resolve, reject) {
			if (!contentResource.getSource() || !contentResource.getVeid()) {
				reject("url or veid not specified");
				return;
			}

			that.initUrl(contentResource.getSource());

			var contextParams = that._createLoadParam(resolve, reject, parentNode, contentResource);
			if	(that._loader) {
				that._loader.request(contentResource.getVeid(), contextParams, authorizationHandler);
			}
		});
	};

	ContentDeliveryService.prototype.getState = function() {
		if (this._loader) {
			return this._loader.getState();
		}
		return null;
	};

	// as threejs node which is a tree node can be dropped by nodeHierarchy.removeNode, we need to update it to cds
	ContentDeliveryService.prototype.decrementResourceCountersForDeletedTreeNode = function(sid) {
		var state = this.getState();
		if (state) {
			var context = state.getContext(state.currentSceneInfo.id);
			this._loader.decrementResourceCountersForDeletedTreeNode(state, context, sid);
		}
	};

	// We want to use this for light scene such as POIs and symbols
	// This is mainly used by authoring and whoever loaded transient scene should remove it when done with it.

	/**
	 * Add the transient scene to target parent.
	 * This method returns a promise which is resolves when we get all geometries for simplicity for now.
	 * @param {string} sceneVeId target scene id to update.
	 * @param {noderef} parentNodeRef parent nodeRef where this transient scene will be added
	 * @param {boolean} useSecureConnection <code>true</code> if use secure connection, otherwise <code>false</code> or <code>undefined</code>
 	 * @returns {Promise} returns promise which gives nodeRef for transient scene.
 	 */
	ContentDeliveryService.prototype.loadTransientScene = function(sceneVeId, parentNodeRef, useSecureConnection) {
		var that = this;

		return new Promise(function(resolve, reject) {

			if (!sceneVeId || !parentNodeRef) {
				reject("invalid arguments");
				return;
			}

			if (that._transientSceneMap.has(sceneVeId)) {
				// if we already loaded this transientScene, just clone it
				var cloned = that._transientSceneMap.get(sceneVeId).clone(); // note this is cloned

				parentNodeRef.add(cloned);
				resolve({
					nodeRef: cloned
				});
				return;
			}

			if (!that._loader) { // check again
				reject("ContentDeliveryService is not initialised");
				return;
			}

			var transientRoot = new THREE.Object3D();
			transientRoot.name = "transient";

			var onSceneCompleted = function() {
				var context = that._loader.getState().getContext(sceneVeId);
				context.onSceneCompletedCallbacks.detach(onSceneCompleted); // clean up callback

				that._transientSceneMap.set(sceneVeId, transientRoot);

				var cloned = transientRoot.clone(); // note this is cloned.
				parentNodeRef.add(cloned);

				resolve({
					nodeRef: cloned
				});
			};

			var contextParams = {
				root: transientRoot,
				onSceneCompleted: onSceneCompleted,
				useSecureConnection: useSecureConnection
			};

			that._loader.request(sceneVeId, contextParams); // .request ends

		}); // promise ends
	};

	/**
 	 * Update contents from Content delivery service
	 * @param {string} sceneId target scene id to update.
	 * @param {string[]} sids target sids to update.
	 * @param {string} viewId optional. Associated view if exists
 	 * @returns {Promise} returns promise of content deliver service update
 	 */
	 ContentDeliveryService.prototype.update = function(sceneId, sids, viewId) {
		var that = this;

		return new Promise(function(resolve, reject) {

			if (!that._loader) {
				reject("ContentDeliveryService is not initialised");
				return;
			}

			that._loader.update(sceneId, sids, viewId).then(function(result){

				if (that._currentNodeHierarchy) {
					for (var i = 0; i < result.replacedNodeRefs.length; i++) {
						that._currentNodeHierarchy.fireNodeReplaced({ ReplacedNodeRef: result.replacedNodeRefs[i],
																	ReplacementNodeRef: result.replacementNodeRefs[i],
																	ReplacedNodeId: result.replacedNodeRefs[i],
																	ReplacementNodeId: result.replacementNodeRefs[i] });
					}
				}
				resolve({
					sceneVeId: result.sceneVeId,
					sids: result.sidArray
				});
			}).catch(function(error) {
				return reject(error);
			});
		}); // promise ends
	};

	ContentDeliveryService.prototype.exit = function() {
		if (basePrototype.exit) {
			basePrototype.exit.call(this);
		}
		if (this._loader) {
			this._loader.dispose();
			this._loader = null;
		}

		this._transientSceneMap = null;
	};

	/**
 	 * Gets view object definition
	 * @param {string} sceneId target scene id
	 * @param {string} viewId view id
	 * @param {string} type type of view. (static or dynamic) - default static
 	 * @returns {sap.ui.vk.View} returns View object with definition
 	 */
	ContentDeliveryService.prototype.loadView = function(sceneId, viewId, type) {

		if (typeof type === "undefined") {
			type = "static";
		}
		var that = this;
		return this._loader.requestView(sceneId, type, viewId).then(function(viewInfo) {
			var myView = new sap.ui.vk.View({
				name: viewInfo.name,
				nodeInfos: viewInfo.viewNodes
			});

			if (viewInfo.camera) {

				var defaultClipPlanes = true; // as explicit near far values cause more trouble than being efficient
				// we set it to true all the time.

				var recalculateZoom = false;
				if (viewInfo.camera.cameraInfo && viewInfo.camera.cameraInfo.zoom === -1) {
					recalculateZoom = true;
				}

				if (viewInfo.camera.type === "PerspectiveCamera") {
					myView.setCameraInfo({
						type: viewInfo.camera.type,
						fov: viewInfo.camera.cameraInfo.fov * 180 / Math.PI,
						position: viewInfo.camera.position.toArray(),
						nearClipPlane: viewInfo.camera.near,
						farClipPlane: viewInfo.camera.far,
						upDirection: viewInfo.camera.up.toArray(),
						targetDirection: viewInfo.camera.getWorldDirection().toArray(),
						usingDefaultClipPlanes: defaultClipPlanes
					});
				}

				if (viewInfo.camera.type === "OrthographicCamera") {
					myView.setCameraInfo({
						type: viewInfo.camera.type,
						zoomFactor: viewInfo.camera.zoom,
						position: viewInfo.camera.position.toArray(),
						nearClipPlane: viewInfo.camera.near,
						farClipPlane: viewInfo.camera.far,
						upDirection: viewInfo.camera.up.toArray(),
						targetDirection: viewInfo.camera.getWorldDirection().toArray(),
						usingDefaultClipPlanes: defaultClipPlanes,
						zoomNeedRecalculate: recalculateZoom
					});
				}
			}

			if (that._currentNodeHierarchy) {
				for (var i = 0; i < viewInfo.updatedNodes.length; i++) {
					that._currentNodeHierarchy.fireNodeUpdated({ nodeRef: viewInfo.updatedNodes[i] });
				}
			}

			that.fireSceneUpdated({});
			return myView;
		}).catch(function(error) {
				jQuery.sap.log.error(error);
				return null;
		});
	};


	/**
 	 * Assign material to an array of nodes, or to the nodes in the scene tree but not in the array of nodes, if a node is not a mesh node
	 * and has no material, the material is assigned to its descendent nodes.
	 * @param {string} sceneId target scene id
	 * @param {string} materialId material id
	 * @param {any[]} nodeRefs the array of node references.
	 * @param {boolean} assignToRestOfSceneTree if <code>false</code> or <code>undefined</code> assign metarial to the nodes in <code>nodeRefs</code>;
	 * 		  if <code>true</code> assign material to the nodes in the scene tree but not in <code>nodeRefs</code>
 	 * @returns {Promise} returns promise which gives <code>true</code> if material is successfully assigned, and <code>false</code> otherwise
 	 */
	 ContentDeliveryService.prototype.assignMaterialToNodes = function(sceneId, materialId, nodeRefs, assignToRestOfSceneTree) {
		var that = this;
		return this._loader.requestMaterial(materialId).then(function(materialRef) {

			function assignMaterial(materialRef, nodeRef, recursive) {

				if (!nodeRef) {
					return;
				}

				if (nodeRef.userData.markedForNotAssigningMaterial) {
					delete nodeRef.userData.markedForNotAssigningMaterial;
					return;
				}

				if (that._currentNodeHierarchy) {
					var nodeProxy = that._currentNodeHierarchy.createNodeProxy(nodeRef);
					var material = new Material();
					material.setMaterialRef(materialRef);
					nodeProxy.assignMaterial(material);
				}

				if (recursive) {
					nodeRef.children.forEach(function(child) {
						if (!child) {
							return;
						}
						assignMaterial(materialRef, child, recursive);
					});
				}
			}

			if (!assignToRestOfSceneTree) {
				for (var i = 0; i < nodeRefs.length; i++) {
					assignMaterial(materialRef, nodeRefs[ i ]);
				}
			} else {
				for (var j = 0; j < nodeRefs.length; j++) {
					nodeRefs[ j ].userData.markedForNotAssigningMaterial = true;
				}
				var context = that._loader.getState().contextMap.get(sceneId);
				var scene = context.root;
				assignMaterial(materialRef, scene, true);
			}

			that.fireSceneUpdated({});

			return true;
		}).catch(function(error) {
				jQuery.sap.log.error(error);
				return false;
		});
	};

	ContentDeliveryService.prototype.printLogTokens = function() {
		if (this._loader) {
			this._loader.printLogTokens();
			return true;
		} else {
			return false;
		}
	};

	return ContentDeliveryService;
});
