/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.predefine('sap/ui/ux3/library',['jquery.sap.global','sap/ui/core/library','sap/ui/commons/library'],function(q){"use strict";sap.ui.getCore().initLibrary({name:"sap.ui.ux3",version:"1.60.42",dependencies:["sap.ui.core","sap.ui.commons"],types:["sap.ui.ux3.ActionBarSocialActions","sap.ui.ux3.ExactOrder","sap.ui.ux3.FeederType","sap.ui.ux3.FollowActionState","sap.ui.ux3.NotificationBarStatus","sap.ui.ux3.ShellDesignType","sap.ui.ux3.ShellHeaderType","sap.ui.ux3.ThingViewerHeaderType","sap.ui.ux3.VisibleItemCountMode"],interfaces:["sap.ui.ux3.DataSetView"],controls:["sap.ui.ux3.ActionBar","sap.ui.ux3.CollectionInspector","sap.ui.ux3.DataSet","sap.ui.ux3.DataSetSimpleView","sap.ui.ux3.Exact","sap.ui.ux3.ExactArea","sap.ui.ux3.ExactBrowser","sap.ui.ux3.ExactList","sap.ui.ux3.FacetFilter","sap.ui.ux3.FacetFilterList","sap.ui.ux3.Feed","sap.ui.ux3.FeedChunk","sap.ui.ux3.Feeder","sap.ui.ux3.NavigationBar","sap.ui.ux3.NotificationBar","sap.ui.ux3.Overlay","sap.ui.ux3.OverlayContainer","sap.ui.ux3.OverlayDialog","sap.ui.ux3.QuickView","sap.ui.ux3.Shell","sap.ui.ux3.ThingInspector","sap.ui.ux3.ThingViewer","sap.ui.ux3.ToolPopup"],elements:["sap.ui.ux3.Collection","sap.ui.ux3.DataSetItem","sap.ui.ux3.ExactAttribute","sap.ui.ux3.NavigationItem","sap.ui.ux3.Notifier","sap.ui.ux3.ThingAction","sap.ui.ux3.ThingGroup"]});sap.ui.ux3.ActionBarSocialActions={Update:"Update",Follow:"Follow",Flag:"Flag",Favorite:"Favorite",Open:"Open"};sap.ui.ux3.ExactOrder={Select:"Select",Fixed:"Fixed"};sap.ui.ux3.FeederType={Large:"Large",Medium:"Medium",Comment:"Comment"};sap.ui.ux3.FollowActionState={Follow:"Follow",Hold:"Hold",Default:"Default"};sap.ui.ux3.NotificationBarStatus={Default:"Default",Min:"Min",Max:"Max",None:"None"};sap.ui.ux3.ShellDesignType={Standard:"Standard",Light:"Light",Crystal:"Crystal"};sap.ui.ux3.ShellHeaderType={Standard:"Standard",BrandOnly:"BrandOnly",NoNavigation:"NoNavigation",SlimNavigation:"SlimNavigation"};sap.ui.ux3.ThingViewerHeaderType={Standard:"Standard",Horizontal:"Horizontal"};sap.ui.ux3.VisibleItemCountMode={Fixed:"Fixed",Auto:"Auto"};return sap.ui.ux3;});
sap.ui.require.preload({
	"sap/ui/ux3/manifest.json":'{"_version":"1.9.0","sap.app":{"id":"sap.ui.ux3","type":"library","embeds":[],"applicationVersion":{"version":"1.60.42"},"title":"Controls that implement the SAP User Experience (UX) Guidelines 3.0","description":"Controls that implement the SAP User Experience (UX) Guidelines 3.0","ach":"CA-UI5-CTR","resources":"resources.json","offline":true},"sap.ui":{"technology":"UI5","supportedThemes":["base","sap_hcb"]},"sap.ui5":{"dependencies":{"minUI5Version":"1.60","libs":{"sap.ui.core":{"minVersion":"1.60.42"},"sap.ui.commons":{"minVersion":"1.60.42"}}},"library":{"i18n":"messagebundle.properties","content":{"controls":["sap.ui.ux3.ActionBar","sap.ui.ux3.CollectionInspector","sap.ui.ux3.DataSet","sap.ui.ux3.DataSetSimpleView","sap.ui.ux3.Exact","sap.ui.ux3.ExactArea","sap.ui.ux3.ExactBrowser","sap.ui.ux3.ExactList","sap.ui.ux3.FacetFilter","sap.ui.ux3.FacetFilterList","sap.ui.ux3.Feed","sap.ui.ux3.FeedChunk","sap.ui.ux3.Feeder","sap.ui.ux3.NavigationBar","sap.ui.ux3.NotificationBar","sap.ui.ux3.Overlay","sap.ui.ux3.OverlayContainer","sap.ui.ux3.OverlayDialog","sap.ui.ux3.QuickView","sap.ui.ux3.Shell","sap.ui.ux3.ThingInspector","sap.ui.ux3.ThingViewer","sap.ui.ux3.ToolPopup"],"elements":["sap.ui.ux3.Collection","sap.ui.ux3.DataSetItem","sap.ui.ux3.ExactAttribute","sap.ui.ux3.NavigationItem","sap.ui.ux3.Notifier","sap.ui.ux3.ThingAction","sap.ui.ux3.ThingGroup"],"types":["sap.ui.ux3.ActionBarSocialActions","sap.ui.ux3.ExactOrder","sap.ui.ux3.FeederType","sap.ui.ux3.FollowActionState","sap.ui.ux3.NotificationBarStatus","sap.ui.ux3.ShellDesignType","sap.ui.ux3.ShellHeaderType","sap.ui.ux3.ThingViewerHeaderType","sap.ui.ux3.VisibleItemCountMode"],"interfaces":["sap.ui.ux3.DataSetView"]}}}}'
},"sap/ui/ux3/library-h2-preload"
);
sap.ui.loader.config({depCacheUI5:{
"sap/ui/ux3/ActionBar.js":["jquery.sap.global.js","sap/ui/core/Control.js","sap/ui/core/delegate/ItemNavigation.js","sap/ui/ux3/ActionBarRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ActionBarRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/Collection.js":["jquery.sap.global.js","sap/ui/core/Element.js","sap/ui/model/SelectionModel.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/CollectionInspector.js":["jquery.sap.global.js","sap/ui/core/Control.js","sap/ui/core/delegate/ItemNavigation.js","sap/ui/ux3/CollectionInspectorRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/CollectionInspectorRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/DataSet.js":["jquery.sap.global.js","sap/ui/core/Control.js","sap/ui/core/ResizeHandler.js","sap/ui/ux3/DataSetRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/DataSetItem.js":["jquery.sap.global.js","sap/ui/core/Element.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/DataSetRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/DataSetSimpleView.js":["jquery.sap.global.js","jquery.sap.script.js","sap/ui/core/Control.js","sap/ui/core/ResizeHandler.js","sap/ui/ux3/DataSetSimpleViewRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/DataSetSimpleViewRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/Exact.js":["jquery.sap.global.js","sap/ui/commons/Button.js","sap/ui/commons/Menu.js","sap/ui/commons/SearchField.js","sap/ui/commons/TextView.js","sap/ui/core/Control.js","sap/ui/ux3/ExactArea.js","sap/ui/ux3/ExactAttribute.js","sap/ui/ux3/ExactBrowser.js","sap/ui/ux3/ExactRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ExactArea.js":["jquery.sap.global.js","sap/ui/commons/Toolbar.js","sap/ui/core/Control.js","sap/ui/ux3/ExactAreaRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ExactAreaRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/ExactAttribute.js":["jquery.sap.global.js","sap/ui/core/Element.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ExactBrowser.js":["jquery.sap.global.js","sap/ui/commons/Button.js","sap/ui/commons/Menu.js","sap/ui/core/Control.js","sap/ui/ux3/ExactAttribute.js","sap/ui/ux3/ExactBrowserRenderer.js","sap/ui/ux3/ExactList.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ExactBrowserRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/ExactList.js":["jquery.sap.dom.js","jquery.sap.global.js","sap/ui/commons/ListBox.js","sap/ui/core/Control.js","sap/ui/core/Popup.js","sap/ui/core/theming/Parameters.js","sap/ui/ux3/ExactListRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ExactListRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/ExactRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/FacetFilter.js":["jquery.sap.global.js","sap/ui/core/Control.js","sap/ui/ux3/FacetFilterRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/FacetFilterList.js":["jquery.sap.global.js","sap/ui/commons/ListBox.js","sap/ui/core/Control.js","sap/ui/ux3/FacetFilterListRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/FacetFilterListRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/FacetFilterRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/Feed.js":["jquery.sap.global.js","sap/ui/commons/DropdownBox.js","sap/ui/commons/MenuButton.js","sap/ui/commons/SearchField.js","sap/ui/commons/ToggleButton.js","sap/ui/core/Control.js","sap/ui/ux3/FeedRenderer.js","sap/ui/ux3/Feeder.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/FeedChunk.js":["jquery.sap.global.js","sap/ui/commons/MenuButton.js","sap/ui/core/Control.js","sap/ui/core/theming/Parameters.js","sap/ui/ux3/FeedChunkRenderer.js","sap/ui/ux3/Feeder.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/FeedChunkRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/Feeder.js":["jquery.sap.global.js","sap/ui/commons/Button.js","sap/ui/core/Control.js","sap/ui/core/theming/Parameters.js","sap/ui/ux3/FeederRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/FeederRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/NavigationBar.js":["jquery.sap.dom.js","jquery.sap.global.js","sap/ui/core/Control.js","sap/ui/core/delegate/ItemNavigation.js","sap/ui/ux3/NavigationBarRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/NavigationBarRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/NavigationItem.js":["jquery.sap.global.js","sap/ui/core/Item.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/NotificationBar.js":["jquery.sap.global.js","sap/ui/core/Control.js","sap/ui/core/delegate/ItemNavigation.js","sap/ui/core/theming/Parameters.js","sap/ui/ux3/NotificationBarRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/NotificationBarRenderer.js":["jquery.sap.global.js","sap/ui/core/Icon.js"],
"sap/ui/ux3/Notifier.js":["jquery.sap.global.js","sap/ui/commons/Callout.js","sap/ui/core/Element.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/Overlay.js":["jquery.sap.global.js","sap/ui/core/Control.js","sap/ui/core/Popup.js","sap/ui/ux3/OverlayRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/OverlayContainer.js":["jquery.sap.global.js","sap/ui/ux3/Overlay.js","sap/ui/ux3/OverlayContainerRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/OverlayContainerRenderer.js":["jquery.sap.global.js","sap/ui/core/Renderer.js","sap/ui/ux3/OverlayRenderer.js"],
"sap/ui/ux3/OverlayDialog.js":["jquery.sap.global.js","sap/ui/core/IntervalTrigger.js","sap/ui/ux3/Overlay.js","sap/ui/ux3/OverlayDialogRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/OverlayDialogRenderer.js":["jquery.sap.global.js","sap/ui/core/Renderer.js","sap/ui/ux3/OverlayRenderer.js"],
"sap/ui/ux3/OverlayRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/QuickView.js":["jquery.sap.global.js","sap/ui/commons/CalloutBase.js","sap/ui/core/delegate/ItemNavigation.js","sap/ui/ux3/ActionBar.js","sap/ui/ux3/QuickViewRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/QuickViewRenderer.js":["jquery.sap.global.js","sap/ui/commons/CalloutBaseRenderer.js","sap/ui/core/IconPool.js","sap/ui/core/Renderer.js"],
"sap/ui/ux3/Shell.js":["jquery.sap.global.js","sap/ui/commons/Menu.js","sap/ui/core/Control.js","sap/ui/core/theming/Parameters.js","sap/ui/ux3/ShellRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ShellColorPicker.js":["jquery.sap.global.js","sap/ui/base/EventProvider.js","sap/ui/commons/Button.js","sap/ui/core/Popup.js"],
"sap/ui/ux3/ShellPersonalization.js":["jquery.sap.global.js","sap/ui/base/EventProvider.js","sap/ui/commons/Button.js","sap/ui/commons/Dialog.js"],
"sap/ui/ux3/ShellRenderer.js":["jquery.sap.global.js","sap/ui/core/IconPool.js"],
"sap/ui/ux3/ThingAction.js":["jquery.sap.global.js","sap/ui/core/Element.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ThingGroup.js":["jquery.sap.global.js","sap/ui/core/Element.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ThingInspector.js":["jquery.sap.global.js","sap/ui/ux3/ActionBar.js","sap/ui/ux3/Overlay.js","sap/ui/ux3/ThingInspectorRenderer.js","sap/ui/ux3/ThingViewer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ThingInspectorRenderer.js":["jquery.sap.global.js","sap/ui/core/Renderer.js","sap/ui/ux3/OverlayRenderer.js"],
"sap/ui/ux3/ThingViewer.js":["jquery.sap.global.js","sap/ui/core/Control.js","sap/ui/ux3/ThingViewerRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ThingViewerRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/ToolPopup.js":["jquery.sap.global.js","sap/ui/core/Control.js","sap/ui/core/IconPool.js","sap/ui/core/Popup.js","sap/ui/core/RenderManager.js","sap/ui/core/theming/Parameters.js","sap/ui/ux3/ToolPopupRenderer.js","sap/ui/ux3/library.js"],
"sap/ui/ux3/ToolPopupRenderer.js":["jquery.sap.global.js"],
"sap/ui/ux3/library.js":["jquery.sap.global.js","sap/ui/commons/library.js","sap/ui/core/library.js"]
}});
//# sourceMappingURL=library-h2-preload.js.map