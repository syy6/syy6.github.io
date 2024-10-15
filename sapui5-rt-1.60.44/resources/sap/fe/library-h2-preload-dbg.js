/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */
sap.ui.predefine('sap/fe/library',["jquery.sap.global",'sap/ui/mdc/XMLComposite','sap/ui/core/util/XMLPreprocessor',"sap/ui/base/SyncPromise"],function(q,X,a,S){"use strict";sap.ui.getCore().initLibrary({name:"sap.fe",dependencies:["sap.ui.core"],types:[],interfaces:[],controls:[],elements:[],version:"1.60.2"});
function v(n,V){var b=n.getAttribute('metadataContexts');if(b){n.removeAttribute('metadataContexts');}return S.resolve(V.visitAttributes(n)).then(function(){if(b){n.setAttribute('metadataContexts',b);}});}
function p(n,V){var t=this,P=S.resolve(v(n,V)).then(function(){return X.initialTemplating(n,V,t);}).then(function(){n.removeAttribute('metadataContexts');});return V.find?P:undefined;}
a.plugIn(p.bind("sap.fe.Form"),"sap.fe","Form");a.plugIn(p.bind("sap.fe.ViewSwitchContainer"),"sap.fe","ViewSwitchContainer");return sap.fe;},false);
sap.ui.require.preload({
	"sap/fe/manifest.json":'{"_version":"1.9.0","sap.app":{"id":"sap.fe","type":"library","embeds":[],"applicationVersion":{"version":"1.60.2"},"title":"UI5 library: sap.fe","description":"UI5 library: sap.fe","resources":"resources.json","offline":true},"sap.ui":{"technology":"UI5","supportedThemes":["base"]},"sap.ui5":{"dependencies":{"minUI5Version":"1.60","libs":{"sap.ui.core":{"minVersion":"1.60.34"},"sap.ushell":{"minVersion":"1.60.32"},"sap.f":{"minVersion":"1.60.34","lazy":true},"sap.m":{"minVersion":"1.60.34","lazy":true},"sap.ui.mdc":{"minVersion":"1.60.34","lazy":true}}},"library":{"i18n":"messagebundle.properties","content":{"controls":[],"elements":[],"types":[],"interfaces":[]}}}}'
},"sap/fe/library-h2-preload"
);
sap.ui.loader.config({depCacheUI5:{
"sap/fe/AppComponent.js":["jquery.sap.global.js","sap/fe/controllerextensions/Routing.js","sap/fe/core/BusyHelper.js","sap/fe/core/internal/testableHelper.js","sap/fe/model/DraftModel.js","sap/fe/model/NamedBindingModel.js","sap/m/NavContainer.js","sap/ui/core/ComponentContainer.js","sap/ui/core/UIComponent.js","sap/ui/mdc/odata/v4/ValueListHelper.js","sap/ui/model/resource/ResourceModel.js"],
"sap/fe/Form.js":["jquery.sap.global.js","sap/fe/core/AnnotationHelper.js","sap/ui/Device.js","sap/ui/base/ManagedObject.js","sap/ui/mdc/XMLComposite.js"],
"sap/fe/MessageButton.js":["sap/fe/MessagePopover.js","sap/m/Button.js","sap/m/ButtonType.js","sap/ui/core/MessageType.js","sap/ui/model/Filter.js","sap/ui/model/FilterOperator.js"],
"sap/fe/MessageFilter.js":["sap/ui/core/Control.js"],
"sap/fe/MessagePopover.js":["sap/m/MessageItem.js","sap/m/MessagePopover.js"],
"sap/fe/Paginator.js":["sap/ui/base/ManagedObjectObserver.js","sap/ui/core/XMLComposite.js","sap/ui/model/json/JSONModel.js","sap/ui/model/resource/ResourceModel.js"],
"sap/fe/actions/messageHandling.js":["sap/m/Button.js","sap/m/Dialog.js","sap/m/MessageItem.js","sap/m/MessageToast.js","sap/m/MessageView.js","sap/ui/core/MessageType.js"],
"sap/fe/actions/operations.js":["sap/m/Dialog.js","sap/m/Label.js","sap/m/MessageBox.js","sap/ui/layout/form/SimpleForm.js","sap/ui/mdc/base/Field.js","sap/ui/model/json/JSONModel.js"],
"sap/fe/controllerextensions/AppState.js":["sap/ui/core/mvc/ControllerExtension.js","sap/ui/core/routing/HashChanger.js","sap/ui/model/json/JSONModel.js"],
"sap/fe/controllerextensions/ContextManager.js":["sap/ui/core/mvc/ControllerExtension.js","sap/ui/model/json/JSONModel.js"],
"sap/fe/controllerextensions/EditFlow.js":["sap/fe/actions/messageHandling.js","sap/ui/core/Fragment.js","sap/ui/core/XMLTemplateProcessor.js","sap/ui/core/mvc/ControllerExtension.js","sap/ui/core/util/XMLPreprocessor.js"],
"sap/fe/controllerextensions/Routing.js":["jquery.sap.global.js","sap/fe/viewFactory.js","sap/m/Link.js","sap/m/MessageBox.js","sap/m/MessagePage.js","sap/ui/core/mvc/ControllerExtension.js","sap/ui/core/routing/HashChanger.js","sap/ui/model/json/JSONModel.js"],
"sap/fe/controllerextensions/Transaction.js":["sap/fe/actions/draft.js","sap/fe/actions/messageHandling.js","sap/fe/actions/nonDraft.js","sap/fe/actions/operations.js","sap/fe/model/DraftModel.js","sap/m/Button.js","sap/m/MessageBox.js","sap/m/Popover.js","sap/m/Text.js","sap/m/VBox.js","sap/ui/core/mvc/ControllerExtension.js","sap/ui/model/json/JSONModel.js"],
"sap/fe/controls/ViewSwitchContainer/ViewSwitchContainer.fragment.xml":["sap/fe/experimental/ViewSwitchContainer.js","sap/ui/core/Fragment.js"],
"sap/fe/controls/ViewSwitchContainer/Visualizations.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/controls/_Form/Form.control.xml":["sap/ui/core/XMLComposite.js","sap/ui/layout/form/ColumnLayout.js","sap/ui/layout/form/Form.js","sap/ui/layout/form/FormContainer.js"],
"sap/fe/controls/_Paginator/Paginator.control.xml":["sap/m/HBox.js","sap/ui/core/XMLComposite.js","sap/uxap/ObjectPageHeaderActionButton.js"],
"sap/fe/controls/field/ContactDetails.fragment.xml":["sap/ui/core/Fragment.js","sap/ui/mdc/base/Field.js","sap/ui/mdc/base/FieldInfo.js","sap/ui/mdc/base/info/ContactDetails.js","sap/ui/mdc/base/info/ContactDetailsItem.js","sap/ui/mdc/base/info/ContentHandler.js","sap/ui/mdc/base/info/LinkHandler.js","sap/ui/mdc/base/info/LinkItem.js"],
"sap/fe/controls/field/DataField.fragment.xml":["sap/ui/core/Fragment.js","sap/ui/mdc/base/Field.js"],
"sap/fe/controls/field/DataFieldForAction.fragment.xml":["sap/m/Button.js","sap/ui/core/Fragment.js","sap/ui/mdc/Column.js"],
"sap/fe/controls/field/DataFieldForAnnotation.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/controls/field/DataPoint.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/controls/field/DraftPopOverAdminData.fragment.xml":["sap/m/Button.js","sap/m/Popover.js","sap/m/Text.js","sap/m/VBox.js","sap/ui/core/Fragment.js"],
"sap/fe/controls/field/Field.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/controls/field/FieldHelper.js":["sap/ui/mdc/ResourceModel.js","sap/ui/mdc/odata/v4/CommonHelper.js","sap/ui/model/odata/v4/AnnotationHelper.js"],
"sap/fe/controls/field/ValueListTable.fragment.xml":["sap/m/ColumnListItem.js","sap/m/Table.js","sap/ui/core/Fragment.js"],
"sap/fe/controls/table/Actions.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/controls/table/Columns.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/controls/table/Table.fragment.xml":["sap/fe/controls/table/Actions.fragment.xml","sap/fe/controls/table/Columns.fragment.xml","sap/ui/core/Fragment.js","sap/ui/mdc/Table.js"],
"sap/fe/core/AnnotationHelper.js":["sap/base/Log.js"],
"sap/fe/core/BusyHelper.js":["jquery.sap.global.js","sap/fe/core/internal/testableHelper.js","sap/ui/base/Object.js"],
"sap/fe/core/CommonUtils.js":["sap/ui/core/mvc/View.js"],
"sap/fe/experimental/ViewSwitchContainer.js":["sap/m/Label.js","sap/m/OverflowToolbar.js","sap/m/SegmentedButton.js","sap/m/SegmentedButtonItem.js","sap/m/Table.js","sap/m/Toolbar.js","sap/m/ToolbarSpacer.js","sap/ui/core/Control.js","sap/ui/mdc/Table.js","sap/ui/table/Table.js"],
"sap/fe/experimental/ViewSwitchContainerItem.js":["sap/ui/core/Control.js"],
"sap/fe/library.js":["jquery.sap.global.js","sap/ui/base/SyncPromise.js","sap/ui/core/util/XMLPreprocessor.js","sap/ui/mdc/XMLComposite.js"],
"sap/fe/model/DraftModel.js":["sap/fe/core/internal/testableHelper.js","sap/ui/base/ManagedObject.js","sap/ui/model/ChangeReason.js","sap/ui/model/Filter.js","sap/ui/model/json/JSONModel.js","sap/ui/model/odata/v4/Context.js","sap/ui/model/odata/v4/ODataContextBinding.js","sap/ui/model/odata/v4/ODataListBinding.js","sap/ui/model/resource/ResourceModel.js"],
"sap/fe/model/NamedBindingModel.js":["sap/fe/core/internal/testableHelper.js"],
"sap/fe/templates/ListReport.view.xml":["sap/f/DynamicPage.js","sap/f/DynamicPageHeader.js","sap/f/DynamicPageTitle.js","sap/fe/controls/ViewSwitchContainer/ViewSwitchContainer.fragment.xml","sap/fe/templates/ListReport/ListReportController.controller.js","sap/m/Text.js","sap/ui/core/Fragment.js","sap/ui/core/mvc/XMLView.js","sap/ui/mdc/FilterBar.js"],
"sap/fe/templates/ListReport/ListReportController.controller.js":["jquery.sap.global.js","sap/fe/actions/messageHandling.js","sap/fe/controllerextensions/ContextManager.js","sap/fe/controllerextensions/EditFlow.js","sap/fe/controllerextensions/Routing.js","sap/fe/controllerextensions/Transaction.js","sap/ui/core/mvc/Controller.js","sap/ui/model/json/JSONModel.js"],
"sap/fe/templates/ListReport/ShareSheet.fragment.xml":["sap/m/ActionSheet.js","sap/m/Button.js","sap/ui/core/Fragment.js","sap/ushell/ui/footerbar/AddBookmarkButton.js"],
"sap/fe/templates/ObjectPage.view.xml":["sap/fe/Paginator.js","sap/fe/templates/ObjectPage/ObjectPageController.controller.js","sap/fe/templates/ObjectPage/view/fragments/Actions.fragment.xml","sap/fe/templates/ObjectPage/view/fragments/HeaderContent.fragment.xml","sap/fe/templates/ObjectPage/view/fragments/HeaderExpandedAndSnappedContent.fragment.xml","sap/fe/templates/ObjectPage/view/fragments/HeaderImage.fragment.xml","sap/fe/templates/ObjectPage/view/fragments/Section.fragment.xml","sap/m/Breadcrumbs.js","sap/m/FlexBox.js","sap/m/Title.js","sap/ui/core/Fragment.js","sap/ui/core/mvc/XMLView.js","sap/uxap/ObjectPageDynamicHeaderTitle.js","sap/uxap/ObjectPageLayout.js"],
"sap/fe/templates/ObjectPage/ObjectPageController.controller.js":["jquery.sap.global.js","sap/fe/controllerextensions/ContextManager.js","sap/fe/controllerextensions/EditFlow.js","sap/fe/controllerextensions/Routing.js","sap/fe/controllerextensions/Transaction.js","sap/ui/core/mvc/Controller.js","sap/ui/model/json/JSONModel.js"],
"sap/fe/templates/ObjectPage/view/fragments/Actions.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/DummyBlock.js":["sap/uxap/BlockBase.js"],
"sap/fe/templates/ObjectPage/view/fragments/DummyBlock.view.xml":["sap/ui/core/mvc/XMLView.js"],
"sap/fe/templates/ObjectPage/view/fragments/Facet.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/FooterContent.fragment.xml":["sap/fe/MessageButton.js","sap/m/Button.js","sap/m/OverflowToolbar.js","sap/m/ToolbarSpacer.js","sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/HeaderContent.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/HeaderDataPoint.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/HeaderDataPointContent.fragment.xml":["sap/m/Title.js","sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/HeaderExpandedAndSnappedContent.fragment.xml":["sap/m/Text.js","sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/HeaderFacet.fragment.xml":["sap/m/HBox.js","sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/HeaderImage.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/HeaderProgressIndicator.fragment.xml":["sap/m/Label.js","sap/m/ProgressIndicator.js","sap/m/Title.js","sap/m/VBox.js","sap/ui/core/CustomData.js","sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/HeaderRatingIndicator.fragment.xml":["sap/m/Label.js","sap/m/RatingIndicator.js","sap/m/Title.js","sap/m/VBox.js","sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/ObjectPageBlockandMoreBlocks.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/ObjectPageForm.fragment.xml":["sap/m/HBox.js","sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/ObjectPageHeaderForm.fragment.xml":["sap/m/VBox.js","sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/ObjectPageTable.fragment.xml":["sap/fe/controls/ViewSwitchContainer/ViewSwitchContainer.fragment.xml","sap/ui/core/Fragment.js"],
"sap/fe/templates/ObjectPage/view/fragments/Section.fragment.xml":["sap/ui/core/Fragment.js"],
"sap/fe/viewFactory.js":["sap/ui/core/cache/CacheManager.js","sap/ui/core/mvc/View.js","sap/ui/model/base/ManagedObjectModel.js","sap/ui/model/json/JSONModel.js","sap/ui/thirdparty/jquery.js"]
}});
//# sourceMappingURL=library-h2-preload.js.map