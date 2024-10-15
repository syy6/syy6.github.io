function HttpConnection() {
	"use strict";
	var url;
	var authHandler;
	var onErrorCallback;

	function makeRequestPromise(url) {
		var promise = new Promise(function(resolve, reject) {

			var xhr = new XMLHttpRequest();
			xhr.onload = function() {
				if (this.status >= 200 && this.status < 300) {
					resolve(xhr.response);
				} else {
					reject({
						status: this.status,
						statusText: xhr.statusText
					});
				}
			};

			xhr.onerror = function() {
				reject({
					status: this.status,
					statusText: xhr.statusText
				});
			};

			xhr.open("GET", url, true);
			if (authHandler) {
				xhr.setRequestHeader("Authorization", authHandler);
			}
			xhr.responseType = "arraybuffer";
			xhr.send();
		});
		return promise;
	}

	this.getUrl = function() {
		return url;
	};

	this.close = function() {
		// don't really need to close anything
	};

	this.send = function(msg, context, onResponse) { // optional context for error handling, custom onResponse callback function
		if (!msg) {
			return;
		}

		var that = this;
		makeRequestPromise(encodeURI(url + msg)).then(onResponse || function(result) {
			if (that.onResponse) {
				that.onResponse(result);
			}
		}).catch(function(reason) {
			if (onErrorCallback) {
				onErrorCallback({
					errorText: "could not connect to server:" + url,
					error: reason.status,
					reason: reason,
					context: context
				});
			}
		});
	};

	this.init = function(serverUrl, authorizationHandler) {
		return new Promise(function(resolve, reject) {
			url = serverUrl;
			if (authorizationHandler != null) {
				authorizationHandler(serverUrl).then(function(token) {
					if (token != null) {
						authHandler = token.token_type + " " + token.access_token;
					} else {
						authHandler = null;
					}
					resolve({});
				}).catch(function(reason) {
					return reject(reason);
				});
			} else {
				resolve({});
			}
		});
	};

	this.setOnErrorCallback = function(callback) {
		onErrorCallback = callback;
	};

	this.onResponse = null;
}

function WebSocketConnection() { // inputUrl
	"use strict";
	var lastConnectedWebsocketUri;

	var that = this;
	var connection;
	var onErrorCallback;

	function isConnectionOk() {
		if (connection && connection.readyState === 1) {
			return true;
		}
		return false;
	}

	function err(msg, context, code) {
		if (onErrorCallback) {
			onErrorCallback({
				errorText: msg,
				error: code,
				context: context
			});
		}
	}

	this.setOnErrorCallback = function(callback) {
		onErrorCallback = callback;
	};

	this.getUrl = function() {
		return lastConnectedWebsocketUri;
	};

	this.close = function() {
		if (connection) {
			connection.close();
			connection = null;
		}
	};

	this.send = function(msg, context) { // optional context for error handling
		if (!msg) {
			return;
		}

		if (!isConnectionOk()) {
			err("websocket connection lost", context, 4);  // TODO: add enum with error codes, this one is internal server error
		} else {
			try {
				connection.send(msg);
			} catch (e) {
				err(e, context);
			}
		}
	};

	var timerId = 0;
	function keepAlive() {
		var timeout = 60000;
		if (connection.readyState == 1) {
			connection.send("");
		}
		timerId = setTimeout(keepAlive, timeout);
	}

	function cancelKeepAlive() {
		if (timerId) {
			clearTimeout(timerId);
			timerId = 0;
		}
	}

	var isInitialised = false;

	var createSetStreamingTokenCommand = function(options) {
		var requestCommandContent = JSON.stringify(options);
		var command = "setStreamingToken" + ("[" + requestCommandContent.length + "]") + requestCommandContent;
		return command;
	};

	this.init = function(serverUrl, authorizationHandler) {
		return new Promise(function(resolve, reject) {
			if (serverUrl) {
				lastConnectedWebsocketUri = serverUrl;
			} else {
				serverUrl = lastConnectedWebsocketUri;
			}

			connection = new WebSocket(serverUrl);
			connection.binaryType = "arraybuffer";

			connection.onopen = function() {
				isInitialised = true;
				if (authorizationHandler != null) {
					authorizationHandler(serverUrl).then(function(token) {
						if (token != null) {
							var cmd = createSetStreamingTokenCommand({ "token": token.access_token });
							connection.send(cmd);
						}

						keepAlive();
						resolve({});
					}).catch(function(reason) {
						return reject(reason);
					});
				} else {
					keepAlive();
					resolve({});
				}
			};

			connection.onclose = function() {
				cancelKeepAlive();
			};

			connection.onmessage = function(e) {
				var msg = e.data;
				if (that.onResponse) {
					that.onResponse(msg);
				}
			};

			connection.onerror = function(e) {
				if (!isInitialised) {
					reject("error connecting to " + serverUrl);
				} else {
					err(e);
				}
			};

		});
	};

	this.onResponse = null;
}

function findChar(charCode, st, uint8Array) {
	"use strict";
	for (var i = st; i < uint8Array.length; i++) {
		if (uint8Array[ i ] === charCode) {
			return i;
		}
	}
	return -1;
}

function getContentLength(contentLengthString) {
	"use strict";
	var list = contentLengthString.split(",");

	if (list.length < 0 || list.length > 2) {
		throw "invalid content length";
	}

	var jsonContentLength = 0;
	var binaryContentLength = 0;

	try {
		jsonContentLength = parseInt(list[ 0 ], 10);

		if (list.length === 2) {
			binaryContentLength = parseInt(list[ 1 ], 10);
		}

	} catch (e) {
		throw "invalid content length";
	}

	return {
		jsonContentLength: jsonContentLength,
		binaryContentLength: binaryContentLength
	};
}

function Parser() {
	"use strict";
}

Parser.createCommandList = function(arrayBuffer, onCommandCreatedCallback) {
	"use strict";
	var buffer = new Uint8Array(arrayBuffer);

	var commandList = [];

	var st = 0;
	var ed = 0;

	var commandLength;
	var jsonContent;
	var binaryContent;

	while (ed < buffer.length) {
		ed = findChar("[".charCodeAt(0), st, buffer);

		if (ed === -1) {
			// failed to locate starting [. So no more command name.
			break;
		}

		var commandName = Decoder.decode(buffer.slice(st, ed)).replace(/\n|\r|\s/g, ""); // get string and remove line break stuff.
		st = ed + 1;

		ed = findChar("]".charCodeAt(0), st, buffer);

		if (ed === -1) {
			throw "No matching [] for command length. abort";
		}

		commandLength = getContentLength(Decoder.decode(buffer.slice(st, ed)));

		st = ed + 1;
		ed = st + commandLength.jsonContentLength;

		jsonContent = Decoder.decode(buffer.slice(st, ed));
		try {
			jsonContent = JSON.parse(jsonContent);
		} catch (e) {
			var errMsg = commandName + ": " + e;
			throw errMsg;
		}

		// binary content is optional atm
		if (commandLength.binaryContentLength) {
			st = ed;
			ed = st + commandLength.binaryContentLength;

			binaryContent = buffer.slice(st, ed);
		} else {
			binaryContent = undefined;
		}

		st = ed;

		var command = {
			name: commandName,
			jsonContent: jsonContent,
			binaryContent: binaryContent
		};

		if (onCommandCreatedCallback) {
			onCommandCreatedCallback(command);
		}
		commandList.push(command);
	}

	return commandList;
};

function Decoder() {
	"use strict";
}

Decoder.uint8ArrayToString = function(uint8Array) {
	"use strict";

	var finalString = "";
	try {
		// if uint8Array is too long, stack runsout in String.fromCharCode.apply
		// so batch it in certain size
		var CHUNK_SIZE = 0x8000; // arbitrary number here, not too small, not too big
		var index = 0;
		var length = uint8Array.length;
		var slice;
		while (index < length) {
			slice = uint8Array.slice(index, Math.min(index + CHUNK_SIZE, length)); // `Math.min` is not really necessary here I think
			finalString += String.fromCharCode.apply(null, slice);
			index += CHUNK_SIZE;
		}
	} catch (e) {
		finalString = "";
	}
	return finalString;
};

Decoder.decode = function(uint8Array) {
	"use strict";
	var encodedString = Decoder.uint8ArrayToString(uint8Array);

	return decodeURIComponent(escape(encodedString));
};

function LoaderProxy() {
	"use strict";

	this.init = function(providedConnection, httpConnection, builderId) {

		this._connection = providedConnection;
		this._connectionHTTP = httpConnection;
		this._sceneBuilderId = builderId;
		if (!providedConnection) {
			throw "no connection provided for loader!";
		}

		this._connection.onResponse = function(response) {
			var commandList = Parser.createCommandList(response);
			processCommands(commandList);
		};
	};

	function processCommands(commandList) {
		var data;
		for (var i = 0; i < commandList.length; i++) {
			var command =  commandList[i];
			if (command.binaryContent) {
				data = {
					name: command.name,
					jsonContent: command.jsonContent,
					binaryContent: command.binaryContent
				};
				self.postMessage(data, [ data.binaryContent.buffer ]);
			} else {
				data = {
					name: command.name,
					jsonContent: command.jsonContent
				};
				self.postMessage(data);
			}
		}
	}

	this.getConnection = function() {
		return this._connection;
	};

	this.send = function(command) {
		if (this._connectionHTTP && command.resource) {
			switch (command.method) {
				case "getImage":
					this._connectionHTTP.send("images/" + command.resource, command, function(result) {
						processCommands([ {
							name: "setImage",
							jsonContent: {
								id: command.resource
							},
							binaryContent: new Uint8Array(result)
						} ]);
					});
					return;

				case "getGeometry":
					this._connectionHTTP.send("geometry?id=" + command.resource, command, function(result) {
						var dataView = new DataView(result);
						// var version = dataView.getUint16(0, true);
						var bufferCount = dataView.getUint16(2, true);
						if (bufferCount > 0) {
							var geomInfo = {
								id: dataView.getUint32(4, true).toString(),
								box: [
									dataView.getFloat32(14, true),
									dataView.getFloat32(18, true),
									dataView.getFloat32(22, true),
									dataView.getFloat32(26, true),
									dataView.getFloat32(30, true),
									dataView.getFloat32(34, true)
								]
							};

							var geomType = dataView.getUint16(8, true);
							if (geomType !== 3) { // for geometry which is not of type 3 (box)
								geomInfo.flags = dataView.getUint16(38, true);
								// geomInfo.uvChannelCount: dataView.getUint16(40, true);
								// geomInfo.geometryQualityLevel: dataView.getUint16(42, true);
								geomInfo.pointCount = dataView.getUint16(46, true);
								geomInfo.elementCount = dataView.getUint16(48, true);
								// geomInfo.encodingType = dataView.getUint16(50, true);
							}

							var bufferLength = dataView.getUint32(52, true);
							var buffer = new Uint8Array(result, 56, bufferLength);

							processCommands([ {
								name: "setGeometry",
								jsonContent: geomInfo,
								binaryContent: buffer
							} ]);
						}
					});
					return;
				default: break;
			}
		}

		if (this._connection) {
			this._connection.send(command.command);
		}
	};

	this.setSceneBuilderId = function(id) {
		this._sceneBuilderId = id;
	};

	this.getSceneBuilderId = function() {
		return this._sceneBuilderId;
	};

	this.authorizationHandler = function(url) {
		return new Promise(function(resolve, reject) {
			var data = {
				name: "getAuthorization",
				jsonContent: { "url": url }
			};
			self.loader.authorizationHandler.resolve = resolve;
			self.loader.authorizationHandler.reject = reject;
			self.postMessage(data);
		});
	};
}

LoaderProxy.HttpConnection = HttpConnection;
LoaderProxy.WebSocketConnection = WebSocketConnection;

var loader = new LoaderProxy();

var onmessage = function(event) {
	"use strict";

	var data = event.data;
	switch (data.method) {
		case "initializeConnection":
			if (!data.url) {
				break;
			}
			var existingConnection = loader.getConnection();
			if (!existingConnection || existingConnection.getUrl() !== data.url) {
				if (existingConnection) {
					existingConnection.close();
				}
				var connection;
				if (data.url.toLowerCase().startsWith("ws")) {
					connection = new WebSocketConnection();
					connection.init(data.url, loader.authorizationHandler).then(function() {
						loader.init(connection, null, data.sceneBuilderId);
						if (data.command) {
							loader.send(data);
						}
					}).catch(function(error) {
					});
				} else if (data.url.toLowerCase().startsWith("http")) {
					connection = new HttpConnection();
					connection.init(data.url, loader.authorizationHandler).then(function() {
						loader.init(connection, null, data.sceneBuilderId);
						if (data.command) {
							loader.send(data);
						}
					}).catch(function(error) {
					});
				} else {
					connection = new WebSocketConnection();
					connection.init((data.useSecureConnection ? "wss://" : "ws://") + data.url + "streaming?", loader.authorizationHandler).then(function() {
					// connection = new HttpConnection();
					// connection.init("https://" + data.url + "streaming-http?request=", loader.authorizationHandler).then(function() {
						var connectionHttp = new HttpConnection();
						connectionHttp.init((data.useSecureConnection ? "https://" : "http://") + data.url, loader.authorizationHandler).then(function() {
							loader.init(connection, connectionHttp, data.sceneBuilderId);
							if (data.command) {
								loader.send(data);
							}
						}).catch(function(error) {
						});
					}).catch(function(error) {
					});
				}
			} else if (data.command) {
				loader.send(data);
			}
			break;
		case "setAuthorization":
			if (data.error == null) {
				loader.authorizationHandler.resolve(data.authorizationToken);
			} else {
				loader.authorizationHandler.reject(data.error);
			}
			delete (loader.authorizationHandler.resolve);
			delete (loader.authorizationHandler.reject);
			break;
		default:
			if (data.command) {
				loader.send(data);
			}
			break;
	}
};

self.onmessage = onmessage;

postMessage({ ready: true });