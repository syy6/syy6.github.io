/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

        (c) Copyright 2009-2015 SAP SE. All rights reserved
    
 */

// Provides control sap.ui.vk.tools.SceneOrientationToolGizmo
sap.ui.define([
	"jquery.sap.global", "./library", "./Gizmo", "sap/m/MenuButton", "sap/m/Menu", "sap/m/MenuItem", "sap/ui/vk/threejs/thirdparty/three", "./SceneOrientationToolGizmoRenderer"
], function(jQuery, library, Gizmo, MenuButton, Menu, MenuItem, threeJs, SceneOrientationToolGizmoRenderer) {
	"use strict";

	sap.ui.require("sap.m.Menu");

	/**
	 * Constructor for a new SceneOrientationToolGizmo.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * Provides drop-down list of predefined camera positions
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.60.14
	 *
	 * @constructor
	 * @public
	 * @alias sap.ui.vk.tools.SceneOrientationToolGizmo
	 * @ui5-metamodel This control/element also will be described in the UI5 (legacy) designtime metamodel
	 */
	var SceneOrientationToolGizmo = Gizmo.extend("sap.ui.vk.tools.SceneOrientationToolGizmo", /** @lends sap.ui.vk.tools.SceneOrientationToolGizmo.prototype */ {
		metadata: {
			library: "sap.ui.vk.tools"
		}
	});

	function createGizmoAxis(dir, color) {
		var arrowLength = 64,
			lineRadius = 0.5,
			coneHeight = 15,
			coneRadius = 3,
			boxSize = 30;
		dir.multiplyScalar(1 / 80);
		var dirX = new THREE.Vector3(dir.y, dir.z, dir.x),
			dirY = new THREE.Vector3(dir.z, dir.x, dir.y);
		var arrowMaterial = new THREE.MeshLambertMaterial({ color: color }),
			boxMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFFFF, transparent: true, opacity: 0.8 });
		var lineGeometry = new THREE.CylinderBufferGeometry(lineRadius, lineRadius, arrowLength - coneHeight, 4);
		var m = new THREE.Matrix4().makeBasis(dirX, dir, dirY).setPosition(dir.clone().multiplyScalar((arrowLength - coneHeight) * 0.5));
		lineGeometry.applyMatrix(m);
		var axisLine = new THREE.Mesh(lineGeometry, arrowMaterial);

		var coneGeometry = new THREE.CylinderBufferGeometry(0, coneRadius, coneHeight, 12, 1);
		m.setPosition(dir.clone().multiplyScalar(arrowLength - coneHeight * 0.5));
		coneGeometry.applyMatrix(m);
		axisLine.add(new THREE.Mesh(coneGeometry, arrowMaterial));

		var boxEdgeGeometry = new THREE.CylinderBufferGeometry(lineRadius, lineRadius, boxSize, 4);
		m.makeBasis(dir, dirY, dirX).setPosition(dirY.clone().multiplyScalar(0.5).add(dir).multiplyScalar(boxSize));
		boxEdgeGeometry.applyMatrix(m);
		axisLine.add(new THREE.Mesh(boxEdgeGeometry, boxMaterial));

		boxEdgeGeometry = new THREE.CylinderBufferGeometry(lineRadius, lineRadius, boxSize, 4);
		m.setPosition(dirY.clone().multiplyScalar(0.5).add(dir).add(dirX).multiplyScalar(boxSize));
		boxEdgeGeometry.applyMatrix(m);
		axisLine.add(new THREE.Mesh(boxEdgeGeometry, boxMaterial));

		boxEdgeGeometry = new THREE.CylinderBufferGeometry(lineRadius, lineRadius, boxSize, 4);
		m.makeBasis(dirY, dirX, dir).setPosition(dirX.clone().multiplyScalar(0.5).add(dir).multiplyScalar(boxSize));
		boxEdgeGeometry.applyMatrix(m);
		axisLine.add(new THREE.Mesh(boxEdgeGeometry, boxMaterial));

		return axisLine;
	}

	SceneOrientationToolGizmo.prototype.init = function() {
		if (Gizmo.prototype.init) {
			Gizmo.prototype.init.apply(this);
		}
		this._enableInitialView = true;
		this._viewport = null;
		this._renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
		this._renderer.setPixelRatio(window.devicePixelRatio);
		this._renderer.setSize(1, 1);
		this._camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
		this._scene = new THREE.Scene();
		var light = new THREE.DirectionalLight(0xFFFFFF, 0.5);
		light.position.set(1, 3, 2);
		this._scene.add(light);
		this._scene.add(new THREE.AmbientLight(0xFFFFFF, 0.5));
		this._scene.add(createGizmoAxis(new THREE.Vector3(1, 0, 0), 0xFF0000));
		this._scene.add(createGizmoAxis(new THREE.Vector3(0, 1, 0), 0x00FF00));
		this._scene.add(createGizmoAxis(new THREE.Vector3(0, 0, 1), 0x0000FF));
		this._scene.traverse(function(obj3D) {
			obj3D.matrixAutoUpdate = false;
		});
		this._axisTitles = this._createAxisTitles(32, 16);
		this._scene.add(this._axisTitles);

		var views = [
			sap.ui.vk.tools.PredefinedView.Initial,
			sap.ui.vk.tools.PredefinedView.Front,
			sap.ui.vk.tools.PredefinedView.Back,
			sap.ui.vk.tools.PredefinedView.Left,
			sap.ui.vk.tools.PredefinedView.Right,
			sap.ui.vk.tools.PredefinedView.Top,
			sap.ui.vk.tools.PredefinedView.Bottom
		];

		this._menu = new Menu({
			items: [
				new MenuItem({ text: sap.ui.vk.getResourceBundle().getText("PREDEFINED_VIEW_INITIAL") }),
				new MenuItem({ text: sap.ui.vk.getResourceBundle().getText("PREDEFINED_VIEW_FRONT") }),
				new MenuItem({ text: sap.ui.vk.getResourceBundle().getText("PREDEFINED_VIEW_BACK") }),
				new MenuItem({ text: sap.ui.vk.getResourceBundle().getText("PREDEFINED_VIEW_LEFT") }),
				new MenuItem({ text: sap.ui.vk.getResourceBundle().getText("PREDEFINED_VIEW_RIGHT") }),
				new MenuItem({ text: sap.ui.vk.getResourceBundle().getText("PREDEFINED_VIEW_TOP") }),
				new MenuItem({ text: sap.ui.vk.getResourceBundle().getText("PREDEFINED_VIEW_BOTTOM") })
			]
		}).attachItemSelected(function(event) {
			var item = event.getParameters("item").item;
			var index = event.getSource().indexOfItem(item);
			this.setView(views[ index ], 1000);
		}, this);

		this._button = new MenuButton({
			// icon: "sap-icon://drop-down-list",
			tooltip: sap.ui.vk.getResourceBundle().getText("PREDEFINED_VIEW_MENUBUTTONTOOLTIP"),
			menu: this._menu
		}).addStyleClass("sapUiVizKitSceneOrientationGizmoButton").addStyleClass("sapUiSizeCompact");
	};

	SceneOrientationToolGizmo.prototype.setView = function(view, milliseconds) {
		var quaternion;
		switch (view) {
			case sap.ui.vk.tools.PredefinedView.Initial:
				quaternion = null;
				break;
			case sap.ui.vk.tools.PredefinedView.Front:
				quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0);
				break;
			case sap.ui.vk.tools.PredefinedView.Back:
				quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI);
				break;
			case sap.ui.vk.tools.PredefinedView.Left:
				quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
				break;
			case sap.ui.vk.tools.PredefinedView.Right:
				quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2);
				break;
			case sap.ui.vk.tools.PredefinedView.Top:
				quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -Math.PI / 2);
				break;
			case sap.ui.vk.tools.PredefinedView.Bottom:
				quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), Math.PI / 2);
				break;
			default:
				return this;
		}

		this._viewport._viewportGestureHandler.setView(quaternion, milliseconds || 0);
		return this;
	};

	SceneOrientationToolGizmo.prototype.setEnableInitialView = function(value) {
		this._enableInitialView = value;
		var items = this._menu.getItems();
		items[ 0 ].setVisible(value);
		items[ 1 ].setStartsSection(value);
	};

	SceneOrientationToolGizmo.prototype.render = function(viewport) {
		this._viewport = viewport;
		this._camera.quaternion.copy(viewport.getCamera().getCameraRef().quaternion);
		this._camera.position.set(0, 0, 1).applyQuaternion(this._camera.quaternion);
		var width = this._renderer.getSize().width;
		this._updateAxisTitles(this._axisTitles, this._scene, this._camera, width * 0.45, 2 / width);
		this._renderer.render(this._scene, this._camera);
	};

	SceneOrientationToolGizmo.prototype.onBeforeRendering = function() {
	};

	SceneOrientationToolGizmo.prototype.onAfterRendering = function() {
		var domRef = this.getDomRef();
		this._renderer.setSize(domRef.clientWidth, domRef.clientHeight);
		// domRef.insertBefore(this._renderer.domElement, this._button.getDomRef());
		domRef.appendChild(this._renderer.domElement);
		// domRef.style.display = this._viewport ? "block" : "none";
	};

	return SceneOrientationToolGizmo;

}, /* bExport= */ true);
