sap.ui.define([
	"sap/ui/core/Core",
	"sap/gantt/library",
	"sap/ui/base/ManagedObjectObserver",
	"sap/ui/core/Item",
	"sap/m/library",
	"sap/m/OverflowToolbar",
	"sap/m/OverflowToolbarLayoutData",
	"sap/m/ToolbarSpacer",
	"sap/m/FlexBox",
	"sap/m/Button",
	"sap/m/Select",
	"sap/m/ViewSettingsDialog",
	"sap/m/ViewSettingsCustomTab",
	"sap/m/CheckBox",
	"sap/m/Slider",
	"sap/m/Popover",
	"../control/AssociateContainer"
],
	function(
		Core,
		library,
		ManagedObjectObserver,
		CoreItem,
		mLibrary,
		OverflowToolbar,
		OverflowToolbarLayoutData,
		ToolbarSpacer,
		FlexBox,
		Button,
		Select,
		ViewSettingsDialog,
		ViewSettingsCustomTab,
		CheckBox,
		Slider,
		Popover,
		AssociateContainer
){
	"use strict";

	var FlexDirection = mLibrary.FlexDirection,
		PlacementType = mLibrary.PlacementType;

	/**
	 * Creates and initializes a new ContainerToolbar class
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSetting] Initial settings for the new control
	 *
	 * @class
	 * ContainerToolbar is be used with GanttChartContainer control. Use this control out of sap.gantt library is not supported.
	 *
	 * It's defined as an aggregation of GanttChartContainer to provide actions to all <code>sap.gantt.simple.GanttChartWithTable</code> instances.
	 * By default, it only shows zooming controls and settings button. You can set properties to true to show more build-in buttons.
	 *
	 * @extends sap.m.OverflowToolbar
	 *
	 * @author SAP SE
	 * @version 1.60.19
	 *
	 * @constructor
	 * @public
	 * @alias sap.gantt.simple.ContainerToolbar
	 */
	var ContainerToolbar = OverflowToolbar.extend("sap.gantt.simple.ContainerToolbar", /** @lends sap.gantt.simple.ContainerToolbar.prototype */ {
		metadata: {
			properties: {

				/**
				 * Flag to show or hide bird eye button on the toolbar
				 */
				showBirdEyeButton: {type: "boolean", defaultValue: false},

				/**
				 * Flag to show or hide legend button
				 */
				showLegendButton: {type: "boolean", defaultValue: false},

				/**
				 * Flag to show or hide setting button, setting button alwasy be the last item on the toolbar
				 */
				showSettingButton: {type: "boolean", defaultValue: true},

				/**
				 * Flag to show or hide zoom buttons
				 */
				showTimeZoomControl: {type: "boolean", defaultValue: true},

				/**
				 * Defines the control type to set the zoom rate.
				 */
				zoomControlType: {type: "sap.gantt.config.ZoomControlType", defaultValue: library.config.ZoomControlType.SliderWithButtons},

				/**
				 * Step count of {@link sap.m.Slider}
				 *
				 * This property only relevant if zoomControlType are:
				 * <ul>
				 *   <li>SliderWithButtons</li>
				 *   <li>SliderOnly</li>
				 * </ul>
				 * @see sap.gantt.config.ZoomControlType
				 */
				stepCountOfSlider: {type: "int", defaultValue: 10},

				/**
				 * Array of plain objects that have "key" and "text" properties,
				 * or array of sap.ui.core.Item used to configure the items in the {@link sap.m.Select} control
				 *
				 * This property is only works if the zoomControlType is Select
				 * @see sap.gantt.config.ZoomControlType
				 */
				infoOfSelectItems: {type: "object[]", defaultValue: []},

				/**
				 * Zoom level of all gantt chart instances in GanttChartContainer
				 */
				zoomLevel:{type: "int", defaultValue: 0}
			},
			aggregations: {
				/**
				 * The additional setting items in Setting Dialog
				 */
				settingItems: {type: "sap.gantt.config.SettingItem", multiple: true},

				/**
				 * The legend container that will show when the legend button is pressed
				 */
				legendContainer: {type: "sap.ui.core.Control", multiple: false, visibility: "public"}
			},
			events: {

				/**
				 * fired when zoom stop changed
				 */
				zoomStopChange: {
					parameters: {
						index: {type: "int"},
						selectedItem: {type: "sap.ui.core.Item"}
					}
				},

				/**
				 * Fired when the bird eye button is pressed
				 */
				birdEyeButtonPress: {}
			}
		}
	});

	ContainerToolbar.prototype.init = function() {
		OverflowToolbar.prototype.init.apply(this, arguments);
		this.mSettingsConfig = {};
		this._oRb = Core.getLibraryResourceBundle("sap.gantt");

		this.oObserver = new ManagedObjectObserver(this.observePropertiesChanges.bind(this));
		this.oObserver.observe(this, {
			properties: ["showBirdEyeButton", "showLegendButton", "showTimeZoomControl", "showSettingButton", "zoomControlType", "infoOfSelectItems"]
		});

		this.bShallUpdateContent = true;
		this.bZoomControlTypeChanged = false;
		this._bSuppressZoomStopChange = false;

		this.oToolbarSpacer = new ToolbarSpacer();
	};

	ContainerToolbar.prototype.observePropertiesChanges = function(oChanges) {
		this.bShallUpdateContent = true;
		this.bZoomControlTypeChanged = oChanges.name === "zoomControlType";
	};

	ContainerToolbar.prototype.exit = function(){
		this.oObserver.disconnect();
	};

	ContainerToolbar.prototype.applySettings = function (mSettings, oScope){
		mSettings = mSettings || {};
		if (!mSettings.settingItems) {
			// if and only if no setting items are not setup user, given the default
			mSettings.settingItems = library.config.DEFAULT_TOOLBAR_SETTING_ITEMS.map(function(o) { return o.clone(); });
		}
		OverflowToolbar.prototype.applySettings.apply(this, arguments);
		this._createControlsOnly();
		return this;
	};

	ContainerToolbar.prototype.onBeforeRendering = function() {
		if (this.bShallUpdateContent === true) {
			this.updateToolbarContents();
			this.bShallUpdateContent = false;
			this.bZoomControlTypeChanged = false;
		}
	};

	ContainerToolbar.prototype.updateToolbarContents = function() {
		var fnNotExisted = function(oControl) {
			return this.getContent().indexOf(oControl) === -1;
		}.bind(this);

		if (fnNotExisted(this.oToolbarSpacer)) {
			this._addToolbarContent(this.oToolbarSpacer);
		}

		var iAfterSpacerIndex = this.getContent().indexOf(this.oToolbarSpacer) + 1;

		var fnInsertOrRemove = function(bShow, oControl) {
			if (bShow && fnNotExisted(oControl)) {
				this.insertContent(oControl, iAfterSpacerIndex);
				iAfterSpacerIndex++;
			} else if (!bShow && !fnNotExisted(oControl)) {
				this.removeContent(oControl);
			} else if (bShow && !fnNotExisted(oControl)) {
				iAfterSpacerIndex++;
			}
		}.bind(this);

		fnInsertOrRemove(this.getShowBirdEyeButton(), this._genBirdEyeButton());

		if (this.bZoomControlTypeChanged) {
			// need remove all old controls then add new types of controls in right position
			var aPossibleControls = [this._oZoomOutButton, this._oZoomSlider, this._oSelect, this._oZoomInButton];
			aPossibleControls.forEach(function(oControl) {
				if (!fnNotExisted(oControl)) {
					this.removeContent(oControl);
				}
			}.bind(this));

		}

		var aTimeZoomControls = this._genTimeZoomGroupControls();
		aTimeZoomControls && aTimeZoomControls.forEach(function(oControl) {
			fnInsertOrRemove(this.getShowTimeZoomControl(), oControl);
		}.bind(this));

		fnInsertOrRemove(this.getShowLegendButton(), this._genLegend());
		fnInsertOrRemove(this.getShowSettingButton(), this._genSettings());

	};

	ContainerToolbar.prototype._addToolbarContent = function(vContent) {
		if (jQuery.isArray(vContent)) {
			for (var m = 0; m < vContent.length; m++) {
				this.addContent(vContent[m]);
			}
		} else if (vContent) {
			this.addContent(vContent);
		}
	};

	ContainerToolbar.prototype._createControlsOnly = function() {
		this._genBirdEyeButton();
		this._genTimeZoomGroupControls();
		this._genLegend();
		this._genSettings();
	};

	/**
	 * Generate a button which show a bird icon for showing all shapes in the visible rows.
	 *
	 * @returns {sap.m.Button} generate a button if not exists yet
	 * @private
	 */
	ContainerToolbar.prototype._genBirdEyeButton = function() {
		if (this._oBirdEyeButton == null){
			var fnBirdEyeTooltip = function(oRb) {
				var sBirdEye = oRb.getText("TXT_BRIDEYE"),
					sTxtVisibleRows = oRb.getText("TXT_BRIDEYE_RANGE_VISIBLE_ROWS"),
					sTooltipVisibleRows = oRb.getText("TLTP_BRIDEYE_ON_VISIBLE_ROWS");

				return sBirdEye + "(" + sTxtVisibleRows + "): " + sTooltipVisibleRows;
			};

			this._oBirdEyeButton = new Button({
				icon: "sap-icon://show",
				tooltip: fnBirdEyeTooltip(this._oRb),
				press: function (oEvent) {
					this.fireBirdEyeButtonPress();
				}.bind(this)
			});
		}

		return this._oBirdEyeButton;
	};

	ContainerToolbar.prototype._getSelectItems = function() {
		var aSelectItems = [],
			aInfoOfSelectItems = this.getInfoOfSelectItems();

		if (aInfoOfSelectItems.length > 0 ) {
			if (aInfoOfSelectItems[0] instanceof CoreItem) {
				aSelectItems = aInfoOfSelectItems;
			} else {
				for (var i = 0; i < aInfoOfSelectItems.length; i++){
					var oItem = new CoreItem({
						key: aInfoOfSelectItems[i].key,
						text: aInfoOfSelectItems[i].text
					});
					aSelectItems.push(oItem);
				}
			}
		}
		return aSelectItems;
	};

	ContainerToolbar.prototype._genTimeZoomGroupControls = function() {
		var ZoomControlType = library.config.ZoomControlType;

		var sZoomControlType = this.getZoomControlType();

		var oLayoutData = new OverflowToolbarLayoutData({
			priority: sap.m.OverflowToolbarPriority.NeverOverflow
		});

		var fnUpdateZoomLevel = function(iZoomLevel) {
			clearTimeout(this._iLiveChangeTimer);
			this._iLiveChangeTimer = -1;

			this.setZoomLevel(iZoomLevel, true);
		};

		this.fireEvent("_zoomControlTypeChange",{zoomControlType: sZoomControlType});
		if (sZoomControlType === ZoomControlType.None){

			return [];
		}
		if (sZoomControlType === ZoomControlType.Select) {

			if (this._oSelect) {
				return [this._oSelect];
			}

			var aSelectItems = this._getSelectItems();
			this._oSelect = new Select({
				items: aSelectItems,
				selectedItem: aSelectItems[this.getZoomLevel()],
				layoutData: oLayoutData,
				change: function (oEvent) {
					var oSelect = oEvent.getSource();
					var oSelectedItem = oSelect.getSelectedItem();
					var iSelectItemIndex = oSelect.indexOfItem(oSelectedItem);
					this._iLiveChangeTimer = setTimeout(fnUpdateZoomLevel.bind(this), 200,[iSelectItemIndex, oSelectedItem]);
				}.bind(this)
			});

			return [this._oSelect];

		} else {

			if (this._oZoomSlider) {

				this._oZoomSlider.setMax(this.getStepCountOfSlider() - 1);

				if (sZoomControlType === ZoomControlType.SliderOnly) {
					return [this._oZoomSlider];
				} else if (sZoomControlType === ZoomControlType.ButtonsOnly) {
					return [this._oZoomOutButton, this._oZoomInButton];
				} else {
					return [this._oZoomOutButton, this._oZoomSlider, this._oZoomInButton];
				}
			}

			this._oZoomSlider = new Slider({
				width: "200px",
				layoutData: oLayoutData,
				max: this.getStepCountOfSlider() - 1,
				value: this.getZoomLevel(),
				min: 0,
				step: 1,
				liveChange: function(oEvent) {
					var iSliderValue = parseInt(oEvent.getParameter("value"), 10);
					// Clear the previous accumulated event
					clearTimeout(this._iLiveChangeTimer);
					this._iLiveChangeTimer = setTimeout(fnUpdateZoomLevel.bind(this), 200, iSliderValue);
				}.bind(this)
			});

			var fnZoomButtonPressHandler = function(bZoomIn) {
				return function(oEvent){
					this._iLiveChangeTimer = setTimeout(function () {
						var iSliderStepChangeValue = parseInt(bZoomIn ? this._oZoomSlider.stepUp(1).getValue() :
							this._oZoomSlider.stepDown(1).getValue(), 10);
						fnUpdateZoomLevel.call(this, iSliderStepChangeValue);
					}.bind(this), 200);
				};
			};

			this._oZoomInButton = new sap.m.Button({
				icon: "sap-icon://zoom-in",
				tooltip: this._oRb.getText("TLTP_SLIDER_ZOOM_IN"),
				layoutData: oLayoutData.clone(),
				press: fnZoomButtonPressHandler(true /**bZoomIn*/).bind(this)
			});

			this._oZoomOutButton = new Button({
				icon: "sap-icon://zoom-out",
				tooltip: this._oRb.getText("TLTP_SLIDER_ZOOM_OUT"),
				layoutData: oLayoutData.clone(),
				press: fnZoomButtonPressHandler(false /**bZoomIn*/).bind(this)
			});
		}

	};

	ContainerToolbar.prototype._genSettings = function () {
		if (this._oSettingsButton) {
			return this._oSettingsButton;
		}

		var aAllSettingItems = this.getSettingItems().map(function(oSettingItem){
			return new CheckBox({
				name: oSettingItem.getKey(),
				text: oSettingItem.getDisplayText(),
				tooltip: oSettingItem.getTooltip(),
				selected: oSettingItem.getChecked()
			}).addStyleClass("sapUiSettingBoxItem");
		});

		this._oSettingsBox = new FlexBox({
			direction: FlexDirection.Column,
			items: aAllSettingItems
		}).addStyleClass("sapUiSettingBox");

		this._oSettingsDialog = new ViewSettingsDialog({
			title: this._oRb.getText("SETTINGS_DIALOG_TITLE"),
			customTabs: [new ViewSettingsCustomTab({content: this._oSettingsBox})],
			confirm: function() {
				this._fireSettingItemChangedEvent();
			}.bind(this),
			cancel: function() {
				// when cancel, the selected state should be restored when reopen
				this.updateSettingItems(this.mSettingsConfig);
			}.bind(this)
		});

		this._oSettingsButton = new Button({
			icon: "sap-icon://action-settings",
			//type: oGroupConfig.getButtonType(),
			tooltip: this._oRb.getText("TLTP_CHANGE_SETTINGS"),
			layoutData: new OverflowToolbarLayoutData({priority:  sap.m.OverflowToolbarPriority.High}),
			press: function (oEvent) {
				this._oSettingsDialog.open();
			}.bind(this)
		});

		return this._oSettingsButton;
	};

	ContainerToolbar.prototype._genLegend = function () {
		if (this._oLegendButton) {
			return this._oLegendButton;
		}

		if (!this._oLegendPop) {
			this._oLegendPop = new Popover({
				placement: PlacementType.Bottom,
				showArrow: false,
				showHeader: false
			});
		}

		this._oLegendButton = new Button({
			icon: "sap-icon://legend",
			type: sap.m.ButtonType.Default,
			tooltip: this._oRb.getText("TLTP_SHOW_LEGEND"),
			layoutData: new OverflowToolbarLayoutData({
				priority: sap.m.OverflowToolbarPriority.High,
				closeOverflowOnInteraction: false
			}),
			press: function (oEvent) {
				var oLegendPop = this._oLegendPop;
				if (oLegendPop.isOpen()){
					oLegendPop.close();
				} else {
					oLegendPop.openBy(this._oLegendButton);
				}
			}.bind(this)
		});
		return this._oLegendButton;
	};

	ContainerToolbar.prototype.updateZoomLevel = function(iZoomLevel){
		this._bSuppressZoomStopChange = true;
		this.setZoomLevel(iZoomLevel);
	};

	ContainerToolbar.prototype.setZoomLevel = function (iZoomLevel, bInvalidate) {
		if (!isNaN(iZoomLevel)) {

			var iCurrentZoomLevel = this.getZoomLevel();

			if (this._oZoomSlider && this._oZoomOutButton && this._oZoomInButton) {
				var iMax = this._oZoomSlider.getMax(),
					iMin = this._oZoomSlider.getMin();

				if (iZoomLevel === iMax) {
					this._oZoomInButton.setEnabled(false);
					this._oZoomOutButton.setEnabled(true);
				} else if (iZoomLevel === iMin) {
					this._oZoomInButton.setEnabled(true);
					this._oZoomOutButton.setEnabled(false);
				} else {
					this._oZoomInButton.setEnabled(true);
					this._oZoomOutButton.setEnabled(true);
				}
			}

			if (iCurrentZoomLevel !== iZoomLevel){
				this.setProperty("zoomLevel", iZoomLevel, bInvalidate);

				if (this._oZoomSlider) {
					this._oZoomSlider.setValue(iZoomLevel);
					if (!this._bSuppressZoomStopChange){
						this.fireZoomStopChange({index: iZoomLevel});
					}
				}

				if (this._oSelect) {
					this._oSelect.setSelectedItem(this._oSelect.getItems()[iZoomLevel]);
					if (!this._bSuppressZoomStopChange){
						this.fireZoomStopChange({index: iZoomLevel, selectedItem: this._oSelect.getSelectedItem()});
					}
				}
			}
		}

		this._bSuppressZoomStopChange = false;
		return this;
	};

	ContainerToolbar.prototype.setLegendContainer = function (oLegendContainer){
		this.setAggregation("legendContainer", oLegendContainer);

		if (!this._oLegendPop) {
			this._oLegendPop = new Popover({
				placement: PlacementType.Bottom,
				showArrow: false,
				showHeader: false
			});
		}
		//legend function invoked by view parser
		if (oLegendContainer) {
			this._oLegendPop.removeAllContent();
			this._oLegendPop.addContent(new AssociateContainer({
				content: oLegendContainer
				})
			);
		}
	};

	ContainerToolbar.prototype._fireSettingItemChangedEvent = function(){
		var aSettingItems = this._oSettingsBox.getItems();
		var mChangedParams = [];
		for (var i = 0; i < aSettingItems.length; i++) {
			var sSettingName = aSettingItems[i].getName(),
				sPropName = sSettingName.substr(4), // remove sap_
				bOldValue = this.mSettingsConfig[sPropName],
				bNewValue = aSettingItems[i].getSelected();
			if (bOldValue !== bNewValue) {
				mChangedParams.push({
					name: sSettingName,
					value: bNewValue
				});
			}
		}

		// DO not fire if nothing changed
		if (mChangedParams.length > 0) {
			this.fireEvent("_settingsChange", mChangedParams);
		}
	};

	/**
	 * Update the setting items selection state
	 *
	 * @param {object} mChanges delta settings configuration change
	 */
	ContainerToolbar.prototype.updateSettingsConfig = function(mChanges) {
		Object.keys(mChanges).forEach(function(propery){
			this.mSettingsConfig[propery] = mChanges[propery];
		}.bind(this));

		this.updateSettingItems(mChanges);
	};

	ContainerToolbar.prototype.updateSettingItems = function(mChanges) {
		var aSettingItems = this._oSettingsBox.getItems();
		Object.keys(mChanges).forEach(function(property){
			var oSettingItem = aSettingItems.filter(function(oItem){
				return oItem.getName().endsWith(property);
			})[0];

			if (oSettingItem) {
				oSettingItem.setSelected(mChanges[property]);
			}
		});

	};

	ContainerToolbar.prototype.getAllToolbarItems = function () {
		return this.getContent();
	};

	ContainerToolbar.prototype.setInfoOfSelectItems = function(aItems, bSuppressInvalidate) {
		this.setProperty("infoOfSelectItems", aItems, bSuppressInvalidate);
		var that = this;
		if (this._oSelect) {
			var aSelectItems = this._getSelectItems();
			this._oSelect.removeAllItems();
			aSelectItems.forEach(function(item) {
				that._oSelect.addItem(item);
			});
		}
	};

	return ContainerToolbar;
}, true);
