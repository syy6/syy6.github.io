/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.predefine('sap/f/library',["sap/ui/base/DataType","sap/ui/Global","sap/ui/core/library","sap/m/library"],function(D){"use strict";sap.ui.getCore().initLibrary({name:"sap.f",version:"1.60.42",dependencies:["sap.ui.core","sap.m","sap.ui.layout"],designtime:"sap/f/designtime/library.designtime",types:["sap.f.LayoutType","sap.f.DynamicPageTitleArea","sap.f.DynamicPageTitleShrinkRatio"],controls:["sap.f.Avatar","sap.f.DynamicPage","sap.f.DynamicPageHeader","sap.f.DynamicPageTitle","sap.f.FlexibleColumnLayout","sap.f.semantic.SemanticPage","sap.f.GridList"],elements:["sap.f.semantic.AddAction","sap.f.semantic.CloseAction","sap.f.semantic.CopyAction","sap.f.semantic.DeleteAction","sap.f.semantic.DiscussInJamAction","sap.f.semantic.EditAction","sap.f.semantic.ExitFullScreenAction","sap.f.semantic.FavoriteAction","sap.f.semantic.FlagAction","sap.f.semantic.FooterMainAction","sap.f.semantic.FullScreenAction","sap.f.semantic.MessagesIndicator","sap.f.semantic.NegativeAction","sap.f.semantic.PositiveAction","sap.f.semantic.PrintAction","sap.f.semantic.SemanticButton","sap.f.semantic.SemanticControl","sap.f.semantic.SemanticToggleButton","sap.f.semantic.SendEmailAction","sap.f.semantic.SendMessageAction","sap.f.semantic.ShareInJamAction","sap.f.semantic.TitleMainAction"],extensions:{flChangeHandlers:{"sap.f.Avatar":{"hideControl":"default","unhideControl":"default"},"sap.f.DynamicPageHeader":{"hideControl":"default","unhideControl":"default","moveControls":"default"},"sap.f.DynamicPageTitle":"sap/f/flexibility/DynamicPageTitle","sap.f.semantic.SemanticPage":{"moveControls":"default"}},"sap.ui.support":{publicRules:true,internalRules:true}}});var t=sap.f;t.DynamicPageTitleArea={Begin:"Begin",Middle:"Middle"};t.DynamicPageTitleShrinkRatio=D.createType('sap.f.DynamicPageTitleShrinkRatio',{isValid:function(v){return/^(([0-9]\d*)(\.\d)?:([0-9]\d*)(\.\d)?:([0-9]\d*)(\.\d)?)$/.test(v);}},D.getType('string'));t.LayoutType={OneColumn:"OneColumn",TwoColumnsBeginExpanded:"TwoColumnsBeginExpanded",TwoColumnsMidExpanded:"TwoColumnsMidExpanded",MidColumnFullScreen:"MidColumnFullScreen",ThreeColumnsMidExpanded:"ThreeColumnsMidExpanded",ThreeColumnsEndExpanded:"ThreeColumnsEndExpanded",ThreeColumnsMidExpandedEndHidden:"ThreeColumnsMidExpandedEndHidden",ThreeColumnsBeginExpandedEndHidden:"ThreeColumnsBeginExpandedEndHidden",EndColumnFullScreen:"EndColumnFullScreen"};sap.ui.lazyRequire("sap.f.routing.Router");sap.ui.lazyRequire("sap.f.routing.Target");sap.ui.lazyRequire("sap.f.routing.TargetHandler");sap.ui.lazyRequire("sap.f.routing.Targets");t.AvatarShape={Circle:"Circle",Square:"Square"};t.AvatarSize={XS:"XS",S:"S",M:"M",L:"L",XL:"XL",Custom:"Custom"};t.AvatarType={Icon:"Icon",Image:"Image",Initials:"Initials"};t.AvatarImageFitType={Cover:"Cover",Contain:"Contain"};return t;});
sap.ui.require.preload({
	"sap/f/manifest.json":'{"_version":"1.9.0","sap.app":{"id":"sap.f","type":"library","embeds":[],"applicationVersion":{"version":"1.60.42"},"title":"SAPUI5 library with Fiori controls.","description":"SAPUI5 library with Fiori controls.","ach":"CA-UI5-CTR","resources":"resources.json","offline":true},"sap.ui":{"technology":"UI5","supportedThemes":["base","sap_hcb"]},"sap.ui5":{"dependencies":{"minUI5Version":"1.60","libs":{"sap.ui.core":{"minVersion":"1.60.42"},"sap.m":{"minVersion":"1.60.42"}}},"library":{"i18n":"messagebundle.properties","content":{"controls":["sap.f.Avatar","sap.f.DynamicPage","sap.f.DynamicPageHeader","sap.f.DynamicPageTitle","sap.f.FlexibleColumnLayout","sap.f.semantic.SemanticPage","sap.f.GridList"],"elements":["sap.f.semantic.AddAction","sap.f.semantic.CloseAction","sap.f.semantic.CopyAction","sap.f.semantic.DeleteAction","sap.f.semantic.DiscussInJamAction","sap.f.semantic.EditAction","sap.f.semantic.ExitFullScreenAction","sap.f.semantic.FavoriteAction","sap.f.semantic.FlagAction","sap.f.semantic.FooterMainAction","sap.f.semantic.FullScreenAction","sap.f.semantic.MessagesIndicator","sap.f.semantic.NegativeAction","sap.f.semantic.PositiveAction","sap.f.semantic.PrintAction","sap.f.semantic.SemanticButton","sap.f.semantic.SemanticControl","sap.f.semantic.SemanticToggleButton","sap.f.semantic.SendEmailAction","sap.f.semantic.SendMessageAction","sap.f.semantic.ShareInJamAction","sap.f.semantic.TitleMainAction"],"types":["sap.f.LayoutType","sap.f.DynamicPageTitleArea","sap.f.DynamicPageTitleShrinkRatio"]}}}}'
},"sap/f/library-h2-preload"
);
sap.ui.loader.config({depCacheUI5:{
"sap/f/Avatar.js":["sap/base/Log.js","sap/f/AvatarRenderer.js","sap/f/library.js","sap/ui/core/Control.js","sap/ui/core/IconPool.js","sap/ui/events/KeyCodes.js"],
"sap/f/AvatarRenderer.js":["sap/base/security/encodeXML.js","sap/f/library.js"],
"sap/f/DynamicPage.js":["sap/base/Log.js","sap/f/DynamicPageHeader.js","sap/f/DynamicPageRenderer.js","sap/f/DynamicPageTitle.js","sap/f/library.js","sap/m/ScrollBar.js","sap/ui/Device.js","sap/ui/base/ManagedObjectObserver.js","sap/ui/core/Control.js","sap/ui/core/ResizeHandler.js","sap/ui/core/delegate/ScrollEnablement.js","sap/ui/dom/getScrollbarSize.js"],
"sap/f/DynamicPageHeader.js":["sap/f/DynamicPageHeaderRenderer.js","sap/f/library.js","sap/m/Button.js","sap/m/ToggleButton.js","sap/ui/Device.js","sap/ui/core/Control.js"],
"sap/f/DynamicPageRenderer.js":["sap/ui/Device.js"],
"sap/f/DynamicPageTitle.js":["sap/base/Log.js","sap/f/DynamicPageTitleRenderer.js","sap/f/library.js","sap/m/Button.js","sap/m/OverflowToolbar.js","sap/m/Toolbar.js","sap/m/ToolbarSeparator.js","sap/m/library.js","sap/ui/base/ManagedObjectObserver.js","sap/ui/core/Control.js","sap/ui/core/HTML.js","sap/ui/core/InvisibleText.js"],
"sap/f/DynamicPageTitleRenderer.js":["sap/f/library.js"],
"sap/f/FlexibleColumnLayout.js":["sap/base/assert.js","sap/f/FlexibleColumnLayoutRenderer.js","sap/f/library.js","sap/m/Button.js","sap/m/NavContainer.js","sap/m/library.js","sap/ui/Device.js","sap/ui/core/Configuration.js","sap/ui/core/Control.js","sap/ui/core/ResizeHandler.js","sap/ui/thirdparty/jquery.js"],
"sap/f/FlexibleColumnLayoutRenderer.js":["sap/m/library.js","sap/ui/Device.js","sap/ui/core/InvisibleText.js"],
"sap/f/FlexibleColumnLayoutSemanticHelper.js":["sap/base/assert.js","sap/f/FlexibleColumnLayout.js","sap/f/library.js"],
"sap/f/GridList.js":["sap/f/GridListRenderer.js","sap/m/ListBase.js","sap/ui/base/ManagedObjectObserver.js","sap/ui/layout/cssgrid/GridItemLayoutData.js","sap/ui/layout/cssgrid/GridLayoutDelegate.js"],
"sap/f/GridListRenderer.js":["sap/m/ListBaseRenderer.js","sap/ui/core/Renderer.js","sap/ui/layout/cssgrid/GridLayoutBase.js"],
"sap/f/changeHandler/MoveDynamicPageTitleActions.js":["sap/ui/fl/Utils.js"],
"sap/f/designtime/Avatar.create.fragment.xml":["sap/f/Avatar.js","sap/ui/core/Fragment.js"],
"sap/f/designtime/DynamicPage.create.fragment.xml":["sap/f/DynamicPage.js","sap/f/DynamicPageHeader.js","sap/f/DynamicPageTitle.js","sap/m/Button.js","sap/m/OverflowToolbar.js","sap/m/Text.js","sap/m/Title.js","sap/m/ToolbarSpacer.js","sap/ui/core/Fragment.js"],
"sap/f/designtime/SemanticPage.create.fragment.xml":["sap/f/semantic/SemanticPage.js","sap/f/semantic/TitleMainAction.js","sap/m/Button.js","sap/m/OverflowToolbarButton.js","sap/m/Text.js","sap/m/Title.js","sap/ui/core/Fragment.js"],
"sap/f/flexibility/DynamicPageTitle.flexibility.js":["sap/f/changeHandler/MoveDynamicPageTitleActions.js","sap/m/changeHandler/CombineButtons.js","sap/m/changeHandler/SplitMenuButton.js"],
"sap/f/library.js":["sap/m/library.js","sap/ui/Global.js","sap/ui/base/DataType.js","sap/ui/core/library.js"],
"sap/f/library.support.js":["sap/f/rules/Avatar.support.js","sap/f/rules/DynamicPage.support.js","sap/ui/support/library.js"],
"sap/f/routing/Router.js":["sap/f/routing/TargetHandler.js","sap/f/routing/Targets.js","sap/ui/core/routing/Router.js"],
"sap/f/routing/Target.js":["sap/f/FlexibleColumnLayout.js","sap/f/routing/async/Target.js","sap/ui/core/routing/Target.js"],
"sap/f/routing/TargetHandler.js":["sap/base/Log.js","sap/f/FlexibleColumnLayout.js","sap/m/InstanceManager.js","sap/ui/base/Object.js","sap/ui/core/routing/History.js"],
"sap/f/routing/Targets.js":["sap/f/routing/Target.js","sap/f/routing/TargetHandler.js","sap/f/routing/async/Targets.js","sap/ui/core/routing/Targets.js"],
"sap/f/rules/Avatar.support.js":["sap/f/library.js","sap/ui/support/library.js"],
"sap/f/rules/DynamicPage.support.js":["sap/ui/support/library.js","sap/ui/table/library.js"],
"sap/f/semantic/AddAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/CloseAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/CopyAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/DeleteAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/DiscussInJamAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/EditAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/ExitFullScreenAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/FavoriteAction.js":["sap/f/semantic/SemanticToggleButton.js"],
"sap/f/semantic/FlagAction.js":["sap/f/semantic/SemanticToggleButton.js"],
"sap/f/semantic/FooterMainAction.js":["sap/f/semantic/MainAction.js"],
"sap/f/semantic/FullScreenAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/MainAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/MessagesIndicator.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/NegativeAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/PositiveAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/PrintAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/SemanticButton.js":["sap/f/semantic/SemanticControl.js","sap/m/Button.js","sap/m/OverflowToolbarButton.js"],
"sap/f/semantic/SemanticConfiguration.js":["sap/m/OverflowToolbarLayoutData.js","sap/m/library.js","sap/ui/base/Metadata.js","sap/ui/core/IconPool.js"],
"sap/f/semantic/SemanticContainer.js":["sap/base/Log.js","sap/f/semantic/SemanticConfiguration.js","sap/ui/base/Metadata.js"],
"sap/f/semantic/SemanticControl.js":["sap/f/semantic/SemanticConfiguration.js","sap/ui/base/ManagedObject.js","sap/ui/core/Element.js","sap/ui/thirdparty/jquery.js"],
"sap/f/semantic/SemanticFooter.js":["sap/f/semantic/SemanticContainer.js","sap/m/ToolbarSpacer.js","sap/m/library.js"],
"sap/f/semantic/SemanticPage.js":["sap/f/DynamicPage.js","sap/f/DynamicPageHeader.js","sap/f/DynamicPageTitle.js","sap/f/library.js","sap/f/semantic/SemanticConfiguration.js","sap/f/semantic/SemanticFooter.js","sap/f/semantic/SemanticPageRenderer.js","sap/f/semantic/SemanticShareMenu.js","sap/f/semantic/SemanticTitle.js","sap/m/ActionSheet.js","sap/m/OverflowToolbar.js","sap/ui/base/ManagedObject.js","sap/ui/core/Control.js"],
"sap/f/semantic/SemanticShareMenu.js":["sap/f/semantic/SemanticContainer.js","sap/m/OverflowToolbarButton.js","sap/m/OverflowToolbarLayoutData.js","sap/m/library.js","sap/ui/base/EventProvider.js","sap/ui/core/IconPool.js"],
"sap/f/semantic/SemanticTitle.js":["sap/f/semantic/SemanticContainer.js","sap/m/library.js"],
"sap/f/semantic/SemanticToggleButton.js":["sap/f/semantic/SemanticButton.js","sap/m/library.js","sap/ui/events/KeyCodes.js"],
"sap/f/semantic/SendEmailAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/SendMessageAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/ShareInJamAction.js":["sap/f/semantic/SemanticButton.js"],
"sap/f/semantic/TitleMainAction.js":["sap/f/semantic/MainAction.js"]
}});
//# sourceMappingURL=library-h2-preload.js.map