sap.ui.define([
	"jquery.sap.global", "./Generator"
], function(jQuery, Generator) {
    "use strict";

    var TotaraUtils = function() {};

    TotaraUtils.calculateVolumeFromBoundingBox = function(boundingBox) {

        var minPoint = new THREE.Vector3(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
        var maxPoint = new THREE.Vector3(Number.MIN_VALUE, Number.MIN_VALUE, Number.MIN_VALUE);

        var minP = new THREE.Vector3(-0.5, -0.5, -0.5);
        var maxP = new THREE.Vector3(0.5, 0.5, 0.5);

        for (var i = 0; i < 8; i++) {
            var x = i & 1 ? minP.x : maxP.x;
            var y = i & 2 ? minP.y : maxP.y;
            var z = i & 4 ? minP.z : maxP.z;
            var p = new THREE.Vector3(x, y, z);

            p.applyMatrix4(boundingBox.matrixWorld);

            minPoint.x = Math.min(minPoint.x, p.x);
            minPoint.y = Math.min(minPoint.y, p.y);
            minPoint.z = Math.min(minPoint.z, p.z);

            maxPoint.x = Math.max(maxPoint.x, p.x);
            maxPoint.y = Math.max(maxPoint.y, p.y);
            maxPoint.z = Math.max(maxPoint.z, p.z);
        }
        var diff = new THREE.Vector3().subVectors(maxPoint, minPoint);

        return diff.x * diff.y * diff.z;
    };

    function ProgressLogger(id, context, totaraLoader) {

        if (!id || !context || !totaraLoader) {
            throw "ProgressLogger: invalid args";
        }

        this. context = context;
        this.loader = totaraLoader;

        var tokens = new Set();

        this.logPerformance = function(name, token) {

            if (!name || !token) {
                return;
            }

            tokens.add(token);

            var log = {
                name: name,
                timestamp: Date.now(),
                token: token
            };

            // debug
            // console.log(log);

            var commandStr = Generator.createAddClientLogCommand(log);

            var message =   {
                            method: "AddClientLogCommand",
                            url: this.loader.getUrl(),
                            authorizationHandler: context.authorizationHandler,
                            token: context.token,
                            command: commandStr
                            };

            this.loader.postMessage(message);
        };

        this.getTokens = function() {
            return tokens;
        };
    }

    TotaraUtils.createLogger = function(id, context, connector) {
        if (!context) {
            return null;
        }

        context.progressLogger = new ProgressLogger(id, context, connector);
        return context.progressLogger;
    };

    // content delivery service transform is either
    // 3 values --> x y z position
    // 12 values --> 4x3 column major matrix
    // 16 values --> 4x4 column major matrix
    TotaraUtils.arrayToMatrix = function(arr) {
        var matrix = new THREE.Matrix4();
        if (arr.length === 3) {
            // position only matrix
            matrix.setPosition(new THREE.Vector3().fromArray(arr));
        } else if (arr.length === 12) {
            // 4x3 matrix
            matrix.set(arr[ 0 ], arr[ 3 ], arr[ 6 ], arr[ 9 ], arr[ 1 ], arr[ 4 ], arr[ 7 ], arr[ 10 ], arr[ 2 ], arr[ 5 ], arr[ 8 ], arr[ 11 ], 0.0, 0.0, 0.0, 1.0);
        } else if (arr.length === 16) {
            // 4x4 matrix
            matrix.set(arr[ 0 ], arr[ 4 ], arr[ 8 ], arr[ 12 ], arr[ 1 ], arr[ 5 ], arr[ 9 ], arr[ 13 ], arr[ 2 ], arr[ 6 ], arr[ 10 ], arr[ 14 ], arr[ 3 ], arr[ 7 ], arr[ 11 ], arr[ 15 ]);
        } else {
            throw "Invalid matrix format";
        }
        return matrix;
    };

    // arr --> content deliver service transform
    TotaraUtils.arrayToColumnMajorMatrixArray16 = function(arr) {
        if (arr.length === 16) {
            return [ arr[ 0 ], arr[ 4 ], arr[ 8 ], arr[ 12 ], arr[ 1 ], arr[ 5 ], arr[ 9 ], arr[ 13 ], arr[ 2 ], arr[ 6 ], arr[ 10 ], arr[ 14 ], arr[ 3 ], arr[ 7 ], arr[ 11 ], arr[ 15 ] ];
        }

        if (arr.length === 12) {
            return [ arr[ 0 ], arr[ 3 ], arr[ 6 ], arr[ 9 ], arr[ 1 ], arr[ 4 ], arr[ 7 ], arr[ 10 ], arr[ 2 ], arr[ 5 ], arr[ 8 ], arr[ 11 ], 0.0, 0.0, 0.0, 1.0 ];
        }

        if (arr.length === 3) {
            return [ 1, 0, 0, arr[ 0 ],
                0, 1, 0, arr[ 1 ],
                0, 0, 1, arr[ 2 ],
                0, 0, 0, 1 ];
        }

        return null;
    };

    TotaraUtils.generateToken = function() {
        return guid();
    };

    // TODO: change to something else?
    function guid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);
        }
        return s4() + s4() + "-" + s4() + "-" + s4() + "-" +
            s4() + "-" + s4() + s4() + s4();
    }

    TotaraUtils.reportError = function(state, context, errorText) {

        var err = {
            error: errorText,
            context: context
        };

        state.onErrorCallbacks.execute(err);
    };

    TotaraUtils.checkError = function(command) {
        if (!command) {
            return true;
        }
        var result = command.result === "failure";
        if (result) {
            // if error, change the field name little bit
            if (command.message) {
                command.error = command.message;
                delete command.message;
            } else {
                command.message = "unknown error";
            }
        }

        return result;
    };

    return TotaraUtils;
});
