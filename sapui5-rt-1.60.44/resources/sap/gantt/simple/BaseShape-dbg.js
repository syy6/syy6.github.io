/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2015 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"sap/base/Log",
	"sap/ui/core/Core",
	"sap/gantt/library",
	"sap/ui/core/Element",
	"sap/ui/core/CustomStyleClassSupport",
	"sap/ui/base/ManagedObjectMetadata",
	"./GanttUtils",
	"./CoordinateUtils",
	"./AggregationUtils",
	"../misc/Format"
],
	function (
		Log,
		Core,
		library,
		Element,
		CustomStyleClassSupport,
		ManagedObjectMetadata,
		GanttUtils,
		CoordinateUtils,
		AggregationUtils,
		Format
	) {
	"use strict";

	/**
	 * Creates and initializes a new Shape class
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSetting] Initial settings for the new control
	 *
	 * @class
	 * BaseShape is an abstract class. All other shapes must extend this class and provide implementation of method renderElement.
	 * It enables application developers to define it's own shapes.
	 *
	 * This class provides the common used properties and methods.
	 *
	 *
	 * @extends sap.ui.core.Element
	 *
	 * @author SAP SE
	 * @version 1.60.19
	 *
	 * @abstract
	 * @constructor
	 * @public
	 * @alias sap.gantt.simple.BaseShape
	 */
	var BaseShape = Element.extend("sap.gantt.simple.BaseShape", /** @lends sap.ui.core.Element.prototype */ {
		metadata: {
			"abstract": true,

			properties: {

				/**
				 * ID of the shape.
				 * shapeId property represents a unique identifier for a business object.
				 * This property shall be bound to a property during initialization, it requires an unique non-empty value.
				 */
				shapeId: {type: "string"},

				/**
				 * Start time of the shape. This property is mandatory, you must bind this property to a model or set a valid JavaScript Date object.
				 * The value will be converted to x coordination when rendering.
				 * If not set, the shape is not visible.
				 */
				time: {type: "object"},

				/**
				 * end time of the shape. This property is mandatory if the shape is a duration shape.
				 * The duration is determined by minusing the value of property <code>time</code>
				 */
				endTime: {type: "object"},

				/**
				 * Scheme key of the shape.
				 *
				 * The scheme is used by expand/collapse the main row shape. You can define the scheme together with <code>shapeSchemes</code> in <code>sap.gantt.simple.GanttChartWithTable</code>, the value
				 * defines here needse matchs the key value defines in <code>sap.gantt.simple.ShapeScheme</code>
				 */
				scheme: {type: "string", defaultValue: null},

				/**
				 * X offset in pixel. If the value is positive, in non-RTL mode, means to translate the visual object to the right in pixel unit.
				 * If the value is negative, the logic is inverted.
				 */
				xBias: {type: "float", defaultValue: 0},

				/**
				 * Y offset in pixel. If the value is positive, in non-RTL mode, it means translate the visual object to the bottom in pixel unit.
				 * If the value is negative, the logic is inverted.
				 */
				yBias: {type: "float", defaultValue: 0},

				/**
				 * The fill property enables you to define the fill color for shapes and texts.
				 *
				 * For shapes and text the fill property is a presentation attribute that lets define the color (or any SVG paint servers like gradients or patterns)
				 */
				fill: {type : "sap.gantt.ValueSVGPaintServer"},

				/**
				 * stroke opacity of the shape
				 */
				strokeOpacity: {type: "float", defaultValue: 1.0},

				/**
				 * The fillOpacity property is a presentation property defining the opacity of the paint server (color, gradient, pattern, etc) applied to a shape.
				 */
				fillOpacity: {type: "float", defaultValue: 1.0},

				/**
				 * The opacity attribute specifies the transparency of an object or of a group of objects, that is,
				 * the degree to which the background behind the element is overlaid.
				 *
				 * The minimum value is 0.0 and maximum value is 1.0
				 */
				opacity: {type: "float", defaultValue: 1.0},

				/**
				 * The stroke property is a presentation property defining the color (or any SVG paint servers like gradients or patterns) used to paint the outline of the shape;
				 */
				stroke: {type : "sap.gantt.ValueSVGPaintServer"},

				/**
				 * The strokeWidth property is a presentation property defining the width of the stroke to be applied to the shape.
				 */
				strokeWidth: {type: "float", defaultValue: 0},

				/**
				 * The strokeDasharray property is a presentation property defining the pattern of dashes and gaps used to paint the outline of the shape.
				 */
				strokeDasharray: {type: "string"},

				/**
				 * The transform property defines a list of transform definitions that are applied to an element and the element's children
				 */
				transform: {type: "string"},

				/**
				 * The filter property defines the filter effects defined by the <filter> element that shall be applied to its element
				 */
				filter: {type: "string"},

				/**
				 * Whether the shape is expandable
				 */
				expandable: {type: "boolean", defaultValue: false},

				/**
				 * Whether the shape is selectable
				 */
				selectable: {type: "boolean", defaultValue: false},

				/**
				 * Whether the shape is selected
				 */
				selected: {type: "boolean", defaultValue: false},

				/**
				 * Specifies whether the shape is draggable
				 * a draggble shape requires the shape is selectable set true as well.
				 */
				draggable: {type: "boolean", defaultValue: false},

				/**
				 * Specifies whether the shape is resizable.
				 * Resizing a shape requires the shape is selectable as well.
				 * @see setSelectable
				 */
				resizable: {type: "boolean", defaultValue: false},

				/**
				 * Specifies whether the shape is hoverable.
				 * hovering the mouse pointer over the shape fires the shapeMouseEnter event and moving the mouse pointer out of the shape fires the shapeMouseLeave event.
				 */
				hoverable: {type: "boolean", defaultValue: false},

				/**
				 * Specifies whether the shape is connectable.
				 * When this property is set to true, you can connect two different shapes to create a relationship
				 */
				connectable: {type: "boolean", defaultValue: false},

				/**
				 * rowYCenter of the shape
				 */
				rowYCenter: {type: "float"},

				/**
				 * Specifies whether or not the system takes this shape into account when performing a bird eye zooming.
				 * We suggest that you set this property to true only for shapes that really need to be considered into bird eye range.
				 */
				countInBirdEye: {type: "boolean", defaultValue: false},

				// child element is used to decide whether write element data to DOM
				childElement: {type: "boolean", defaultValue: false, visibility: "hidden"},

				// special property for unique appearence
				shapeUid: {type: "string", visibility: "hidden"}
			}
		}
	});

	CustomStyleClassSupport.apply(BaseShape.prototype);

	BaseShape.prototype.init = function () {
		// used to distinguish single/double click
		this.bPreventSingleClick = false;
	};

	// used to cache LESS parameter colors
	var mValueColors = {};

	// theme change need reset colors
	Core.attachThemeChanged(function() {
		mValueColors = {};
	});

	BaseShape.prototype.setShapeUid = function(sUid) {
		Log.error("The control manages the shapeUid generation. The method \"setShapeUid\" cannot be used programmatically!", this);
	};

	BaseShape.prototype.getTransform = function () {
		var aRetVal = [];
		/*
		 * in transform, the later function take effect first,
		 * so in this sequence, rotate first, then translate.
		 */
		this._translate(aRetVal);

		if (aRetVal.length > 0) {
			return aRetVal.join(" ");
		}
	};


	/**
	 * Construct the value for svg attribute <code> transform </code>. This method leverages the properties xBias and yBias
	 *
	 * @param {object} aRetVal Return Value.
	 * @private
	 */
	BaseShape.prototype._translate = function (aRetVal) {
		var nXBias = this.getXBias(),
			nYBias = this.getYBias();

		if (nXBias || nYBias) {
			nXBias = nXBias ? nXBias : 0;
			nYBias = nYBias ? nYBias : 0;
			if (Core.getConfiguration().getRTL() === true ) {
				aRetVal.push("translate(" + (-nXBias) + " " + nYBias + ")");
			} else {
				aRetVal.push("translate(" + nXBias + " " + nYBias + ")");
			}
		}
	};

	/**
	 * Get the shape style string
	 *
	 * @return {string} shape styles
	 * @protected
	 */
	BaseShape.prototype.getStyle = function() {
		var oStyles = {
			"stroke": this.determineValueColor(this.getStroke()),
			"stroke-width": this.getStrokeWidth()
		};

		// selectable, hoverable any of property is true mean the shape is interactive
		var bInteractive = this.getSelectable() || this.getHoverable();
		if (this.getProperty("childElement") === false && bInteractive === false) {
			// set the shape is none interactive on the outer shape
			oStyles["pointer-events"] = "none";
		}
		return this.getInlineStyle(oStyles);
	};

	/**
	 * Convert Date to x coordinate position based on the zoom strategy setup in GanttChart
	 *
	 * @private
	 * @param {Date|string} vTime datetime object or timestamp string representive
	 * @returns {float} x position
	 */
	BaseShape.prototype.getXByTime = function(vTime) {
		var oAxisTime = this.getAxisTime();

		var nTimeX = oAxisTime.timeToView(Format.abapTimestampToDate(vTime));
		if (!jQuery.isNumeric(nTimeX)) {
			Log.warning("Cannot convert time:" + vTime + " to an valid coordinate. Invalid coordinate might not get rendered at all, check the property value!");
			return 0;
		}
		return nTimeX;
	};

	/**
	 * Get an instance of AxisTime which belongs to current GanttChart.
	 * This is a shortcut method for all shape instances to convert timestamp to coordinates or vise verse
	 *
	 * @see sap.gantt.misc.AxisTime#timeToView
	 * @see sap.gantt.misc.AxisTime#viewToTime
	 *
	 * @return {object} the AxisTime instance
	 * @public
	 */
	BaseShape.prototype.getAxisTime = function() {
		if (this.mAxisTime) {
			// traverse the inherit hierarchy to lookup the AxisTime is expensive.
			// So internally we set a private mAxisTime before rendering for the sake of performance
			return this.mAxisTime;
		} else {
			var oGantt = this.getGanttChartBase();
			return oGantt ? oGantt.getAxisTime() : null;
		}
	};

	/**
	 * try to traverse the aggregation parents to find Gantt instance.
	 *
	 * @private
	 * @returns {sap.gantt.simple.GanttChart} GanttChart instance or null if not found
	 */
	BaseShape.prototype.getGanttChartBase = function() {
		var oRowSettings = this.getParentRowSettings();
		return oRowSettings ? oRowSettings.getParentGantt() : null;
	};

	/**
	 * Try to find the parent Row instance.
	 *
	 * @private
	 * @returns {sap.ui.table.Row} Row instance or null if shape not bound to Row
	 */
	BaseShape.prototype.getParentRowSettings = function() {
		return AggregationUtils.getParentControlOf("sap.gantt.simple.GanttRowSettings", this);
	};

	/**
	 * Get Inline style string. Convert style object to string and remove invalid values.
	 *
	 * @param {object} oStyles an object with style attribute and value
	 * @return {string} inline style
	 * @private
	 */
	BaseShape.prototype.getInlineStyle = function(oStyles) {
		return Object.keys(oStyles).reduce(function(initial, attr){
			if (oStyles[attr] !== undefined && oStyles[attr] !== null && oStyles[attr] !== "") {
				initial += (attr + ":" + oStyles[attr] + "; ");
			}
			return initial;
		}, "");
	};

	/**
	 * Determine the actual value color of the less parameter.
	 *
	 * @param {string} sParameter LESS parameter "@sapUiChartSequence1" for instance
	 * @return {string} real color hex or color name
	 * @private
	 */
	BaseShape.prototype.determineValueColor = function(sParameter) {
		var sFoundColor = mValueColors[sParameter];
		if (!sFoundColor && sParameter) {
			// if attribute has value but no paint server value
			sFoundColor = library.ValueSVGPaintServer.normalize(sParameter);
			mValueColors[sParameter] = sFoundColor;
		}
		return sFoundColor;
	};

	BaseShape.prototype.destroy = function() {
		return Element.prototype.destroy.apply(this, ["KeepDom"]);
	};

	/**
	 * Determine whether the shape is visible or not based on the current zoom level and rate
	 *
	 * It's used for Row to decide whether render the shape in DOM hierarchy.
	 * Performance wise consideration
	 * @returns {boolean} ture visible
	 */
	BaseShape.prototype.isVisible = function() {
		return false;
	};

	/**
	 * Render the shape. Write the shape DOM into render manager buffer.
	 *
	 * All customized shape need to overwrite this method to provide it's own rendering logic
	 *
	 * @protected
	 *
	 * @param {sap.ui.core.RenderManager} oRm Render Manager
	 * @param {sap.gantt.simple.BaseShape} oElement Shape instance
	 */
	BaseShape.prototype.renderElement = function(oRm, oElement) {};

	/**
	 * If a group shape has child aggregation, only the grouped shape shall have sap-ui and sap-ui-id
	 * attribute at the SVG DOM element, thus when initializing the group shape, all child aggregation
	 * instance has a hidden property <code>childElement</code>, if it's true, skip write sap-ui-* attributes into the DOM.
	 *
	 * @private
	 * @param {sap.ui.core.RenderManager} oRm RenderManager
	 */
	BaseShape.prototype.writeElementData = function(oRm) {
		// children element shouldn't have sap-ui attribute
		if (this.getProperty("childElement")) {
			var bGeneratedId = ManagedObjectMetadata.isGeneratedId(this.getId());
			if (!bGeneratedId) {
				// but if it's provide an user-defind Id, then write it to DOM
				oRm.writeAttribute("id", this.getId());
			}
			return;
		}

		if (this._shallWriteElementData(this)) {
			oRm.writeElementData(this);
			if (this.getShapeId()) {
				oRm.writeAttribute(GanttUtils.SHAPE_ID_DATASET_KEY, this.getShapeId());
			}

			if (this.getConnectable()) {
				oRm.writeAttribute(GanttUtils.CONNECTABLE_DATASET_KEY, this.getConnectable());
			}
		}
	};

	/**
	 * Determine whether or not to write shape-id to dom
	 * sap-gantt-shape-id is used for selection, drag & drop and DOM lookup for relationship.
	 *
	 * 1. If the shape is the root shape, which mean bound directly to Row
	 * 2. Shape is defined a lazy aggregation that will display in expand chart
	 * 3. Shape is defined as a standalone instance that doesn't associated to any controls
	 *
	 * @param {sap.gantt.shape.BaseShape} oShape shape instance
	 * @returns {bool} true: write the attribute, false: write nothing
	 */
	BaseShape.prototype._shallWriteElementData = function(oShape) {
		var bShallWrite = oShape.getParent() === null;
		if (bShallWrite === false) {
			bShallWrite = AggregationUtils.isParentRowSetting(oShape);
		}
		if (bShallWrite === false) {
			bShallWrite = AggregationUtils.isLazyAggregation(oShape);
		}
		return bShallWrite;
	};

	BaseShape.prototype.ensureGanttChart = function() {
		if (!this.mChartInstance) {
			this.mChartInstance = this.getGanttChartBase();
		}
	};

	BaseShape.prototype.setSelected = function(bSelected, bSuppressInvalidate) {
		var bPrevious = this.getSelected();
		this.setProperty("selected", bSelected, bSuppressInvalidate);

		var oGantt = this.getGanttChartBase(),
			sShapeUid = this.getShapeUid();
		if (bPrevious !== bSelected && oGantt && sShapeUid) {
			oGantt.getSelection().update(sShapeUid, {
				selected: bSelected,
				ctrl: false,
				draggable:  this.getDraggable(),
				time: this.getTime(),
				endTime: this.getEndTime()
			});
		}
		return this;
	};

	/**
	 * Function is called when Shape is clicked.
	 *
	 * @param {jQuery.Event} oEvent Mouse click event
	 * @private
	 */
	BaseShape.prototype.onclick = function(oEvent) {
		var bSelectable = this.getSelectable();
		if (!bSelectable) {
			return;
		}
		this.iSingleClickTimer = window.setTimeout(function(){
			if (this.bPreventSingleClick === false) {

				this.getGanttChartBase().handleShapePress({
					shape: this,
					ctrlOrMeta: oEvent.ctrlKey || oEvent.metaKey
				});
				// mark the event that it is handled by the control
				oEvent.setMarked();
			}
			this.bPreventSingleClick = false;
		}.bind(this), 300);
	};

	/**
	 * Function is called when Shape is double clicked.
	 *
	 * @param {jQuery.Event} oEvent Mouse dblclick event
	 * @private
	 */
	BaseShape.prototype.ondblclick = function(oEvent) {
		window.clearTimeout(this.iSingleClickTimer);
		this.bPreventSingleClick = true;

		this.getGanttChartBase().fireShapeDoubleClick({
			shape: this,
			rowSettings: this.getParentRowSettings()
		});
		oEvent.stopImmediatePropagation();
	};

	/**
	 * Function is called when Shape is right clicked.
	 *
	 * @param {jQuery.Event} oEvent context menu event
	 * @private
	 */
	BaseShape.prototype.oncontextmenu = function(oEvent) {
		oEvent.preventDefault();
		oEvent.stopImmediatePropagation();

		var mCursor = CoordinateUtils.getLatestCursorPosition();
		this.getGanttChartBase().fireShapeContextMenu({
			shape: this,
			rowSettings: this.getParentRowSettings(),
			pageX: mCursor.pageX,
			pageY: mCursor.pageY
		});

	};

	/**
	 * Function is called when mouse leave the Shape.
	 *
	 * @param {jQuery.Event} oEvent Mouse leave event
	 * @private
	 */
	BaseShape.prototype.onmouseout = function(oEvent) {
		if (this.getHoverable() === false) { return; }
		this.iMouseOutTimer = window.setTimeout(function(){
			if (this.bShapeMouseEnterFired) {
				this.getGanttChartBase().fireShapeMouseLeave({
					shape: this
				});
				this.bShapeMouseEnterFired = false;
			}

			window.clearTimeout(this.iMouseOutTimer);
		}.bind(this), 500);
	};

	/**
	 * Function is called when mouse over the Shape.
	 *
	 * @param {jQuery.Event} oEvent Mouse over event
	 * @private
	 */
	BaseShape.prototype.onmouseover = function(oEvent) {
		if (this.getHoverable() === false) { return; }
		this.iMouseOverTimer = window.setTimeout(function(){
			var oCursorElem = CoordinateUtils.getCursorElement();
			if (oCursorElem === this) {
				var mCursor = CoordinateUtils.getLatestCursorPosition();
				this.getGanttChartBase().fireShapeMouseEnter({
					shape: this,
					pageX: mCursor.pageX,
					pageY: mCursor.pageY
				});
				this.bShapeMouseEnterFired = true;
			}

			window.clearTimeout(this.iMouseOverTimer);
		}.bind(this), 500);

	};

	/**
	 * Overwritten the getShapeUid because it's a hidden property
	 *
	 * @private
	 * @returns {string} shape UID
	 */
	BaseShape.prototype.getShapeUid = function() {
		return this.getProperty("shapeUid");
	};

	return BaseShape;
}, true);
