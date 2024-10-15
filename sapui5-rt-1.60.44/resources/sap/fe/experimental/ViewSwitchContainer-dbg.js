/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

sap.ui.define([
	"sap/ui/core/Control",
	"sap/m/OverflowToolbar",
	"sap/m/SegmentedButton",
	"sap/m/ToolbarSpacer",
	"sap/m/Label",
	"sap/m/SegmentedButtonItem",
	"sap/m/Table",
	"sap/ui/table/Table",
	"sap/ui/mdc/Table",
	"sap/m/Toolbar"
], function (Control, OverflowToolbar, SegmentedButton, ToolbarSpacer, Label, SegmentedButtonItem, MTable, UITable, MDCTable, MToolbar) {
	"use strict";
	var ViewSwitchContainer = Control.extend("sap.fe.ViewSwitchContainer", {
		metadata: {
			designtime: "sap/ui/mdc/designtime/ViewSwitchContainer.designtime",
			properties: {
				title :{
					type : "string",
					invalidate: "template",
					defaultValue: "View Switch container"
				}
			},
			events: {},
			aggregations: {
				items: {
					type: "sap.fe.experimental.ViewSwitchContainerItem",
					multiple: true,
					singularName: "item"
				}
			},
			publicMethods: []
		},

		init:function(){
			this.selectedButtonIndex = 0;
			this.vscTBContents = [];
		},
		renderer: {
			render: function(oRm,oControl){
				var aItems = oControl.getItems();
				if (aItems.length > 1) {
				var aSegemntedButtonItems = aItems.map(function(vscItem, index){
					return new SegmentedButtonItem({
						key: index.toString(),
						icon: vscItem.getIconurl()
					});
				});

				var oVscSegmentedButton = new SegmentedButton(
					{
						selectedKey: oControl.selectedButtonIndex.toString(),
						items: aSegemntedButtonItems,
						selectionChange: oControl.handleSegmentedButtonPress.bind(oControl)
					}
				);
			}
				//To get the Toolbar for different tables.
				/*var getTableToolBar = function(oTable){
					var oToolBar = null;
					if (oTable instanceof MTable) {
						oToolBar = oTable.getHeaderToolbar();
					} else if (oTable != null) {
						var aTableExtensions = oTable.getExtension();
						for (var index in aTableExtensions) {
							if (aTableExtensions[index] instanceof MToolbar) {
								oToolBar = aTableExtensions[index];
								break;
							}
						}
					}

					return oToolBar;
				};*/
				//To get the toolbar content from toolbar and set toolbar to hide.
				/*var getToolBarContent = function(oToolBar){
					if (oToolBar != null) {
					var _aTBContent = oToolBar.getContent();
					if (oVscSegmentedButton != undefined) {
					_aTBContent.push(oVscSegmentedButton);
					}
					oToolBar.setVisible(false);
					return _aTBContent;
				}
				};*/

				if (oControl.vscTBContents.length != aItems.length) {
					aItems.forEach(function(vscItem) {
						var aTBContent = [
							new sap.m.Title({
								text: oControl.getTitle()
							}),
							new ToolbarSpacer()
						];
						if (oVscSegmentedButton != undefined) {
							aTBContent.push(oVscSegmentedButton);
						}
						/*var vscItemContent = vscItem.getContent();
						var oToolBar = {};
						if (vscItem.getToolbarId() != null || vscItem.getToolbarId() != undefined) {
							oToolBar = sap.ui.getCore().byId(vscItem.getToolbarId());
							aTBContent = getToolBarContent(oToolBar);
						} else if (vscItemContent instanceof MDCTable || vscItemContent instanceof MTable || vscItemContent instanceof UITable) {
							var oTable = vscItemContent instanceof MDCTable ? vscItemContent.get_content() : vscItemContent; //TODO: Temporarily using get_content() till a workaround is found.
							oToolBar = getTableToolBar(oTable);
							aTBContent = getToolBarContent(oToolBar);
						}
						oControl.vscTBContents.push(aTBContent);*/
					});
				}

				var oOverFlowtoolBar = new OverflowToolbar({
					content: oControl.vscTBContents[oControl.selectedButtonIndex]
				});
				oRm.write("<div");
				oRm.writeControlData(oControl);
				oRm.write(">");
				oRm.renderControl(oOverFlowtoolBar);
				for (var i = 0; i < aItems.length; i++ ) {
					if ( i != oControl.selectedButtonIndex ) {
						aItems[i].setVisible(false);
					} else {
						aItems[i].setVisible(true);
					}
					oRm.renderControl(aItems[i]);
				}
				oRm.write("</div>");
			}
		}
	});
	/**
	 * @param  {Object} oEvent
	 * This function is to set the selected index when a segmented button is clicked and rerender the VSC.
	 */
	ViewSwitchContainer.prototype.handleSegmentedButtonPress = function(oEvent){
		this.selectedButtonIndex = +oEvent.getParameter("item").getKey();
		this.rerender();
	};

	return ViewSwitchContainer;

}, /* bExport= */true);
