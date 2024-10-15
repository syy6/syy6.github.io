
sap.ui.define([
	"jquery.sap.global",  "./Generator", "./Coder", "./Commands"
], function(jQuery, Generator, Coder, Commands) {
    "use strict";

    var toConsumableArray = function(arr) {
        if (Array.isArray(arr)) {
            var arr2 = Array(arr.length);
            for (var i = 0; i < arr.length; i++) {
                arr2[i] = arr[i];
            }
            return arr2;
        } else {
            var arrValues = [];
            arr.forEach(function(value){ arrValues.push(value); });
            return arrValues; // Array.from(arr);
        }
    };

    var RequestCommandGenerator = function() {

        var meshBatchSize = 200;
        var materialBatchSize = 200;

        var meshIdSet;
        var materialIdSet;
        var imageIdSet;
		var geometryIdArray;
		var geometryPriorityMap;

        this.init = function() {
            meshIdSet = new Set();
            materialIdSet = new Set();
            imageIdSet = new Set();
			geometryPriorityMap = new Map();
			geometryIdArray = [];
        };

        this.init();

        this.pushMeshIds = function(idSet) {
            meshIdSet = new Set([].concat(toConsumableArray(meshIdSet), toConsumableArray(idSet)));
        };

        this.pushMaterialIds = function(idSet) {
            materialIdSet = new Set([].concat(toConsumableArray(materialIdSet), toConsumableArray(idSet)));
        };

        this.pushImageIds = function(idSet) {
            imageIdSet = new Set([].concat(toConsumableArray(imageIdSet), toConsumableArray(idSet)));
        };

		this.pushGeometryIds = function(geometryIdMap) {
			geometryIdMap.forEach(function(priority, id) {
				geometryPriorityMap.set(id, priority);
				geometryIdArray.push(id);
			});

			geometryIdArray.sort(function(a, b) {
				return geometryPriorityMap.get(a) - geometryPriorityMap.get(b);
			});
        };

        this.canGenerateCommand = function() {
			return meshIdSet.size > 0 || materialIdSet.size > 0 || imageIdSet.size > 0 || geometryIdArray.length > 0;
        };

        this.generateRequestCommand = function(doNotEncode, token) {

            // mesh -> material -> image -> geometry order
			var id, ids;
            var command = {};

            if (meshIdSet.size > 0) {
                ids = sliceOneBatchFromSet(meshIdSet, meshBatchSize);
                if (ids) {
					command.command = Generator.createGetMeshCommand(ids, token);
					command.method = Commands.getMesh;
                }
            } else if (materialIdSet.size > 0) {
                ids = sliceOneBatchFromSet(materialIdSet, materialBatchSize);
                if (ids) {
					command.command = Generator.createGetMaterialCommand(ids, token);
					command.method = Commands.getMaterial;
                }
            } else if (imageIdSet.size > 0) {
				id = imageIdSet.values().next().value;
				imageIdSet.delete(id);
				command.command = Generator.createGetImageCommand([ id ], token);
				command.method = Commands.getImage;
				command.resource = id;
			} else if (geometryIdArray.length > 0) {
				id = geometryIdArray.pop();
				geometryPriorityMap.delete(id);
				command.command = Generator.createGetGeometryCommand([ id ], token);
				command.method = Commands.getGeometry;
				command.resource = id;
			}

			if (command.command) {
                if (!doNotEncode) {
					command.command = Coder.encode(command.command);
                }

				return command;
            }

            return null;
        };

        /*
        function sliceOneBatchFromArray(array, batchSize) {
            if (array.size === 0) {
                return null;
            }

            return array.splice(0, batchSize);
        }
        */

        function sliceOneBatchFromSet(idSet, batchSize) {
            if (idSet.size === 0) {
                return null;
            }

            var ids = [];
            idSet.forEach(function(value){ ids.push(value); }); // Array.from(idSet);
            var slice = ids.slice(0, batchSize);

            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError;
            var _iterator;
            var _step;

            try {
                for (_iterator = slice[Symbol.iterator](); !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var item = _step.value;

                    idSet.delete(item);
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            return slice;
        }
    };

    return RequestCommandGenerator;
});

