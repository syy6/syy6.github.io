/* eslint-disable no-console */
sap.ui.define([
    "jquery.sap.global", "./ListMap", "./RequestCommandGenerator", "./CallbackHandler",
    "./SceneStateContext", "./Processor", "./Commands", "./Generator", "./SceneState", "./TotaraUtils"
], function(jQuery, ListMap, RequestCommandGenerator, CallbackHandler, SceneStateContext,
			Processor, Commands, Generator, SceneState, TotaraUtils) {
	"use strict";

	var TotaraLoader = function() {

		var _state = new SceneState();
		var _pushMesh = false;
		var _commandProcessor = new Processor();
		var _url = null;

		var that = this;

		function sendRequest(requestCommandGenerator, token) {
			if (!that._worker) {
				return false;
			}

			var somethingRequested = false;

			if (requestCommandGenerator) {
				while (requestCommandGenerator.canGenerateCommand()) {
					var newCommand = requestCommandGenerator.generateRequestCommand(true, token);

					that._worker.postMessage(newCommand);
					somethingRequested = true;
				}
			}

			return somethingRequested;
		}

		function sendRequests() {

			var somethingRequested = false;
			var token;

			var valueIterator = _state.contextMap.values();
			var ci = valueIterator.next();
			while (!ci.done) {
				var context = ci.value;
				ci = valueIterator.next();
				if (sendRequest(context.requestCommandGenerator, context.token)) {
					somethingRequested = true;
				}
				token = context.token;
			}

			if (!somethingRequested) { // if nothing requested for individual context, load common ones. (mostly geometry)

				// grab token from last the context. as token is for debuging/performance
				// and we normally load one model for debuging/performance, should be ok.
				// if not, we can generate token for the state.requestCommandGenerator
				sendRequest(_state.requestCommandGenerator, token);
			}
		}

		this.getUrl = function() {
			return _url;
		};

		this.init = function(ssurl) {

			_url = ssurl;

			// when graph or tree are done
			function onFinishHierarchy(context) {
				if (context) {
					context.phase = SceneStateContext.Phase.FinishedHierarchy;
				}

				if (!_pushMesh) {
					// manually request mesh
					var meshGroupListMap = context.meshGroupListMap;
					var meshIdsToRequest = new Set(meshGroupListMap.keys());
					context.requestCommandGenerator.pushMeshIds(meshIdsToRequest);

					if (meshIdsToRequest.size === 0) {

						if (context.retrievalType === SceneStateContext.RetrievalType.Initial) {
							context.onInitialSceneFinishedCallbacks.execute();
						}

						// mesh request can be zero when we do partial tree update which is just delete
						if (context.retrievalType === SceneStateContext.RetrievalType.Partial) {
							context.onPartialRetrievalFinishedCallbacks.execute();
						}

						if (context.isSceneCompleted()) {
							context.onSceneCompletedCallbacks.execute();
						}
					}
				}

				var materialIds = _state.materialIdsToRequest;
				if (materialIds && materialIds.size) {
					_state.requestCommandGenerator.pushMaterialIds(materialIds);
				}

				sendRequests();
			}

			_commandProcessor.setCommandCallback(Commands.notifyFinishedTree,
				function(commandResult) {
					if (commandResult.error) {
						return;
					}

					var context = commandResult.context;
					onFinishHierarchy(context);
				});

			_commandProcessor.setCommandCallback(Commands.setMesh,
				function(commandResult) {
					if (commandResult.error) {
						return;
					}

					_state.requestCommandGenerator.pushMaterialIds(commandResult.materialIdSet);
					_state.requestCommandGenerator.pushGeometryIds(commandResult.geometryIdMap);

					if (commandResult.updatedContexts) {

						for (var i = 0; i < commandResult.updatedContexts.length; i++) {
							var context = commandResult.updatedContexts[i];
							if (context.meshGroupListMap.size === 0) {
								// all meshes were updated for this model
								context.phase = SceneStateContext.Phase.FinishedMesh;

								context.onMeshFinishedCallbacks.execute();

								if (context.retrievalType === SceneStateContext.RetrievalType.Initial) {
									context.onInitialSceneFinishedCallbacks.execute();
								} else if (context.retrievalType === SceneStateContext.RetrievalType.Partial) {
									context.onPartialRetrievalFinishedCallbacks.execute();
								}

								if (context.isSceneCompleted()) {
									context.onSceneCompletedCallbacks.execute();
								}

								context.progressCount.geometry.total = context.boundingBoxNodeIdsListMap.size;

								var token = context.token;
								if (context.isSceneCompleted()) {
									logPerformance(context, "sceneCompleted", token);
								} else {
									logPerformance(context, "meshFinished", token);
								}
							}
						}
					}

					sendRequests();
				});


			_commandProcessor.setCommandCallback(Commands.setGeometry,
				function(commandResult) {
					if (commandResult.error) {
						return;
					}

					_state.onSetGeometryCallbacks.execute(commandResult);

					if (commandResult.updatedContexts) { // if the geometry updated something in this model..
						for (var i = 0; i < commandResult.updatedContexts.length; i++) {
							var context = commandResult.updatedContexts[i];

							if (context.isSceneCompleted()) {
								context.onSceneCompletedCallbacks.execute();

								var token = context.token;
								if (context.isSceneCompleted()) {
									logPerformance(context, "sceneCompleted", token);
								} else {
									logPerformance(context, "geometryFinished", token);
								}

								context.finishedTime = Date.now();
							}
						}
					}
				});

			_commandProcessor.setCommandCallback(Commands.setTree,
				function(command) {
					if (command.error && command.context) {
						_state.contextMap.delete(command.context.sceneId);
					}
				});


			_commandProcessor.setCommandCallback(Commands.notifyFinishedView,
				function(result) {
					if (result.error) {
						return;
					}

					var context = result.context;
					if (context) {

						var materialIds = _state.materialIdsToRequest;
						if (materialIds && materialIds.size) {
							_state.requestCommandGenerator.pushMaterialIds(materialIds);
							sendRequests();
						}
						// this view does not require any mesh request
						// meaning we can handle the view without any request
						// let't declare view is finished
						if (result.view) {
							var ns = [];
							context.updatedNodes.forEach(function(value){ ns.push(value); });
							result.view.updatedNodes = ns; // Array.from(context.updatedNodes);
						}
						if (context.meshGroupListMap.size === 0) {
							context.onViewFinishedCallbacks.execute(result.view);
						} else {
							// seems like we need to get more stuff as some items in the view
							// are not here atm.
							context.retrievalType = SceneStateContext.RetrievalType.Partial; // need to get some more items

							var meshIdsToRequest = new Set(context.meshGroupListMap.keys());
							context.requestCommandGenerator.pushMeshIds(meshIdsToRequest);

							var callback = function() {
								context.onPartialRetrievalFinishedCallbacks.detach(callback);
								context.onViewFinishedCallbacks.execute(result.view); // now the view is finished
							};
							context.onPartialRetrievalFinishedCallbacks.attach(callback);

							logPerformance(context, "notifyFinishedView", context.token);

							sendRequests();
						}

					}
				});

			_commandProcessor.setCommandCallback(Commands.setMaterial,
				function(result) {
					if (result.error) {
						return;
					}

					_state.requestCommandGenerator.pushImageIds(result.imageIdSet);

					if (_state.materialIdsToRequest.size === 0) {
						_state.onMaterialFinishedCallbacks.execute();
					}
					sendRequests();

				});

			_commandProcessor.setCommandCallback(Commands.setImage,
				function(result) {
					if (result.error) {
						return;
					}

					if (_state.texturesToUpdate.size === 0) {
						_state.onImageFinishedCallbacks.execute();
					}

				});

			_commandProcessor.setCommandCallback(Commands.setView,
				function(result) {
					if (result.error) {
						return;
					}

					var context = result.context;
					var token = context ? context.token : null;
					logPerformance(context, "setView", token);
				});

			_commandProcessor.setCommandCallback(Commands.notifyError,
				function(result) {
					_state.onErrorCallbacks.execute(result);
				});

			var that = this;
			return new Promise(function(resolve) {
				if (!that._work) {
					that._worker = new Worker(sap.ui.require.toUrl("sap/ui/vk/totara/TotaraLoaderWorker.js"));

					that._worker.onmessage = function(event) {
						var data = event.data;
						if (data.ready) {
							// Just an initial signal that worker is ready for processing
							return;
						}

						if (data.name === "getAuthorization") {
							// If the application provided authorization handler then we will call it
							if (_state.getContext(_state.currentSceneInfo.id).authorizationHandler) {
								_state.getContext(_state.currentSceneInfo.id).authorizationHandler(data.jsonContent.url).then(function(token) {
									that._worker.postMessage({
										"method": "setAuthorization",
										"authorizationToken": token
									});
								})
								.catch(function(err) {
									that._worker.postMessage({
										"method": "setAuthorization",
										"authorizationToken": null,
										"error": err.toString()
									});
								});
							} else {
								that._worker.postMessage({
									"method": "setAuthorization",
									"authorizationToken": null
								});
							}
							return;
						}

						// Process command messages
						var command = { name: data.name,
							jsonContent: data.jsonContent
						};

						if (data.binaryContent) {
							command.binaryContent = data.binaryContent;
						}

						_commandProcessor.process(_state, command);
					};

					that._worker.onerror = function(event) {
						// Log.error("Error in WebWorker", event);
					};
				}
			});
		};

		// if pushMesh is disabled (which is default), loader will try to request meshes
		// then geometries. If this is set to true, we assume we have everything already and do not
		// request anything
		this.enablePushMesh = function(enable) {
			_pushMesh = enable;
		};


		this.dispose = function() {

			_commandProcessor = null;

			if (_state) {

				if (_state.contextMap) {
					// stop the loggers if we have them
					var valueIterator = _state.contextMap.values();
					var ci = valueIterator.next();
					while (!ci.done) {
						var context = ci.value;
						ci = valueIterator.next();
						context.dispose();
					}
				}
				_state.dispose();
				_state = null;
			}

			if (this._worker) {
				this._worker.terminate();
				this._worker = undefined;
			}
		};

		function logPerformance(context, name, token) {
			if (context && context.progressLogger && token && name) {
				context.progressLogger.logPerformance(name, token);
			}
		}

		this.request = function(sceneVeId, contextParams, authorizationHandler) {

			if (!contextParams.root) {
				throw "context must include root where three js objects are attached to";
			}

			var context = _state.createContext(sceneVeId, contextParams);

			_state.currentSceneInfo.id = sceneVeId;
			context.retrievalType = SceneStateContext.RetrievalType.Initial;
			context.authorizationHandler = authorizationHandler;

			context.initialRequestTime = Date.now();

			var token;
			if (context.enableLogger) {
				var logger = TotaraUtils.createLogger(sceneVeId, context, this);
				if (logger) {
					token = TotaraUtils.generateToken(); // only define token if we log.
					context.token = token;
				}
			}

			var includeHidden = contextParams.includeHidden !== undefined ? contextParams.includeHidden : true; // include hidden by default
			var selectField = contextParams.$select !== undefined ? contextParams.$select : "name,transform,meshId,materialId,contentType,visible,opacity,renderOrder";

			var options = {
				pushMaterials: true,
				pushMeshes: _pushMesh,
				includeHidden: includeHidden,
				pushPMI: contextParams.pushPMI || false,
				metadataFilter: contextParams.metadataFilter,
				token: token,
				$select: selectField
			};

			if (contextParams.activateView) {
				options.activateView = contextParams.activateView;
			}

			options.sceneId = sceneVeId;
			options.context = sceneVeId;

			var commandInStr =
				Generator.createGetTreeCommand(options);

			logPerformance(context, "modelRequested", token);

			this._worker.postMessage(
				{
					method: "initializeConnection",
					url: _url,
					useSecureConnection: contextParams.useSecureConnection,
					token: context.token,
					command:	commandInStr
				}
			);
		};

		this.postMessage = function(message) {
			this._worker.postMessage(message);
		};

		// Returns promise that performs partial tree retrieval
		// Partial tree retrival is considered finished when we get all the meshes
		// If there is no need to retrieve meshes (e.g delete node), it will finish
		// when the tree building is finished.
		// viewId is optional
		this.update = function(sceneVeId, sidArray, viewId) {
			var that = this;
			return new Promise(function(resolve, reject) {
				var context = _state.getContext(sceneVeId);

				if (!context) {
					reject("no context for ${sceneVeId}.");
				}

				// context.nodeSidsForPartialTree.clear();
				context.nodeSidsForPartialTree = new Set(sidArray);

				context.retrievalType = SceneStateContext.RetrievalType.Partial;
				var includeHidden = context.includeHidden !== undefined ? context.includeHidden : true; // include hidden by default
				var selectField = context.$select !== undefined ? context.$select : "name,transform,meshId,materialId,contentType,visible,opacity,renderOrder";

				var options = {
					pushMaterials: true,
					pushMeshes: _pushMesh,
					filter: sidArray.join(),
					includeHidden: includeHidden,
					pushPMI: context.pushPMI || false,
					metadataFilter: context.metadataFilter,
					$select: selectField,
					breadcrumbs: true
				};

				var token;
				if (context.progressLogger) {
					token = TotaraUtils.generateToken();
					context.token = token;
				}

				// we can update by sid in tree way only
				options.sceneId = sceneVeId;
				options.context = sceneVeId;

				if (viewId) {
					options.activateView = viewId;
				}

				var commandInStr =
					Generator.createGetTreeCommand(options);

				var callback = function() {
					context.onPartialRetrievalFinishedCallbacks.detach(callback);
					logPerformance(context, "updateFinished(mesh)", token);
					var rnks = [];
					var rnvs = [];
					context.replacedNodes.forEach(function(value, key){ rnvs.push(value); rnks.push(key); });

					var replacedNodes = rnks; // Array.from(context.replacedNodes.keys());
					var replacementNodes = rnvs; // Array.from(context.replacedNodes.values());
					resolve({
						sceneVeId: sceneVeId,
						sids: sidArray,
						replacedNodeRefs: replacedNodes,
						replacementNodeRefs: replacementNodes
					}); // succesfully finished partial retrieval
				};

				context.onPartialRetrievalFinishedCallbacks.attach(callback);

				logPerformance(context, "updateRequested", token);
				// connection.send(commandInStr, context);

				that._worker.postMessage(
					{
						method: "update",
						command: commandInStr
					}
				);
			});
		};

		this.requestView = function(sceneVeId, viewType, viewId) {

			if (viewType !== "static" && viewType !== "dynamic") {
				return Promise.reject("invalid arg: supported type - static, dynamic");
			}

			if (!viewId) {
				return Promise.reject("invalid arg: viewId undefined");
			}

			var context = _state.getContext(sceneVeId);
			if (!context) {
				return Promise.reject("no scene exist for ${sceneVeId}");
			}

			var token;
			if (context.progressLogger) {
				token = TotaraUtils.generateToken();
				context.token = token;
			}

			var includeHidden = context.includeHidden !== undefined ? context.includeHidden : false; // not include hidden by default
			var selectField = context.$select !== undefined ? context.$select : undefined;

			var that = this;
			var options;
			var promise = new Promise(function(resolve, reject) {

				var commandInStr = "";
				var commandMethod;
				if (viewType === "static") {
					options = {
						sceneId: sceneVeId,
						id: viewId,
						token: token,
						includeHidden: includeHidden,
						$select: selectField
					};

					commandInStr += Generator.createGetViewCommand(options);
					commandMethod = Commands.getView;
				} else {
					options = {
						sceneId: sceneVeId,
						type: viewId,
						token: token
					};
					commandInStr += Generator.createGetDynamicViewCommand(options);
					commandMethod = Commands.getDynamicView;
				}

				var callback = function(resultView) {
					context.onViewFinishedCallbacks.detach(callback);

					logPerformance(context, "onViewFinished", token);

					if (resultView) {
						resolve(resultView);
					} else {
						reject("no view data");
					}
				};

				context.onViewFinishedCallbacks.attach(callback);

				logPerformance(context, "viewRequested", token);

				that._worker.postMessage(
					{
						method: commandMethod,
						command:	commandInStr
					}
				);
				// connection.send(commandInStr, context);
			});

			return promise;
		};

		this.requestMaterial = function(materialId) {

			if (!materialId) {
				return Promise.reject("invalid arg: materialId undefined");
			}

			var promise = new Promise(function(resolve, reject) {

				var material = _state.sceneBuilder.getMaterial(materialId);

				if (material) {
					resolve(material);
					return;
				}

				_state.requestCommandGenerator.pushMaterialIds([ materialId ]);

				var callback = function() {
					_state.onMaterialFinishedCallbacks.detach(callback);

					var m = _state.sceneBuilder.getMaterial(materialId);
					if (m != null) {
						resolve(m);
					} else {
						reject("no material data");
					}
				};

				_state.onMaterialFinishedCallbacks.attach(callback);

				sendRequests();
			});

			return promise;
		};

		this.getState = function() {
			return _state;
		};

		this.decrementResourceCountersForDeletedTreeNode = function(state, context, nodeId) {
			state.sceneBuilder.decrementResourceCountersForDeletedTreeNode(nodeId, context.sceneId);
		};

		this.printLogTokens = function() {

			if (!_state || !_state.contextMap) {
				 console.log("printLogTokens:no data to print");
				return;
			}

			var entrieIterator = _state.contextMap.entries();
			var item = entrieIterator.next();
			while (!item.done) {
				var sceneId = item.key;
				var context = item.value;
				item = entrieIterator.next();

				console.log("log tokens for scene => " + sceneId);
				console.log("---------------------------------------");
				if (context.progressLogger) {
					var tokens = context.progressLogger.getTokens();

					var keyIterator = tokens.keys();
					var keyItem = keyIterator.next();
					while (!keyItem.done) {
						var t = keyItem.value;
						keyIterator.next();
						console.log(t);
					}
				}
				console.log("---------------------------------------");
			}

		};
	};
	return TotaraLoader;
});