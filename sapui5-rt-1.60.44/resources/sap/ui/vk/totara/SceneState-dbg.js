sap.ui.define([
	"jquery.sap.global", "./ListMap", "./RequestCommandGenerator", "./CallbackHandler", "./SceneStateContext", "sap/ui/vk/threejs/SceneBuilder"
], function(jQuery, ListMap, RequestCommandGenerator, CallbackHandler, SceneStateContext, SceneBuilder) {
    "use strict";

    var SceneState = function() {

        this.currentSceneInfo = {}; // info about scene

        this.sceneBuilder = new SceneBuilder();

        this.contextMap = new Map(); // different loading may have different context // sceneId --> context

        // texture update realted
        // key of texturesToUpdate is imageIdsToRequest
        this.texturesToUpdate = new Map(); // images id --> [...Textures] where Texture is { Material, Type }
        this.materialIdsToRequest = new Set();
        this.geometryIdMaterialIdMap = new Map();

        // for requesting shared items such as material, image and geometry
        this.requestCommandGenerator = new RequestCommandGenerator();

        // event related
        this.onErrorCallbacks = new CallbackHandler();
        this.onMaterialFinishedCallbacks = new CallbackHandler();
        this.onImageFinishedCallbacks = new CallbackHandler();
        this.onSetGeometryCallbacks = new CallbackHandler();

        this.getContext = function(sceneId) {
            if (!sceneId) {
                return null;
            }
            return this.contextMap.get(sceneId);
        };

        this.createContext = function(uri, params) {
            var context = new SceneStateContext();
            Object.assign(context, params);
            context.sceneId = uri;

            // attach callbacks
            if (context.onActiveCamera) {
                context.onActiveCameraCallbacks.attach(context.onActiveCamera);
                delete context.onActiveCamera;
            }

            if (context.onMeshFinished) {
                context.onMeshFinishedCallbacks.attach(context.onMeshFinished);
                delete context.onMeshFinished;
            }

            if (context.onInitialSceneFinished) {
                context.onInitialSceneFinishedCallbacks.attach(context.onInitialSceneFinished);
                delete context.onInitialSceneFinished;
            }

            if (context.onPartialRetrievalFinished) {
                context.onPartialRetrievalFinishedCallbacks.attach(context.onPartialRetrievalFinished);
                delete context.onPartialRetrievalFinished;
            }

            if (context.onViewFinished) {
                context.onViewFinishedCallbacks.attach(context.onViewFinished);
                delete context.onViewFinished;
            }

            if (context.onSceneCompleted) {
                context.onSceneCompletedCallbacks.attach(context.onSceneCompleted);
                delete context.onSceneCompleted;
            }

            if (context.onProgressChanged) {
                context.setOnProgressChanged(context.onProgressChanged);
                delete context.onProgressChanged;
            }

            this.contextMap.set(uri, context);
            return context;
        };

        this.sidToObject3D = function(sid) {// state of type SceneState
            var contextIterator = this.contextMap.values();
            var contextItem = contextIterator.next();
            var node = null;
            while (!contextItem.done) {
                var ctx = contextItem.value;
                contextItem = contextIterator.next();
                node = this.sceneBuilder.getNode(sid, ctx.sceneId);
                if (node) {
                    break;
                }
            }
            return node;
        };

        this.object3DToSid = function(obj3D) {
            return this.sceneBuilder.getObjectId(obj3D);
        };

        this.dispose = function() {
            this.currentSceneInfo = null;
            this.contextMap = null;

            this.sceneBuilder.clearup();
            this.sceneBuilder = null;

            this.texturesToUpdate = null;
            this.materialIdsToRequest = null;
            this.geometryIdMaterialIdMap = null;

            this.onErrorCallbacks = null;
            this.onMaterialFinishedCallbacks =  null;
            this.onImageFinishedCallbacks =  null;
            this.onSetGeometryCallbacks =  null;
        };

        this.cleanup = function() {
            this.currentSceneInfo = {};
            this.contextMap.clear();

            this.sceneBuilder.cleanup();

            this.texturesToUpdate.clear();
            this.materialIdsToRequest.clear();
            this.geometryIdMaterialIdMap.clear();
        };
    };

    return SceneState;
});

