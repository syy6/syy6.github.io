/*!

 * SAP APF Analysis Path Framework
 *
 * (c) Copyright 2012-2014 SAP AG. All rights reserved
 */
(function(){"use strict";sap.ui.controller("sap.apf.ui.reuse.controller.carousel",{onAfterRendering:function(){if(this.oCoreApi.getSteps().length<1){jQuery(".DnD-separator").hide();}},onInit:function(){if(sap.ui.Device.system.desktop){this.getView().addStyleClass("sapUiSizeCompact");}var v=this.getView().getViewData().oInject;this.oCoreApi=v.oCoreApi;this.oUiApi=v.uiApi;},showStepGallery:function(){this.getView().getStepGallery().getController().openHierarchicalSelectDialog();},onBeforeRendering:function(){this.oUiApi.getLayoutView().getController().addMasterFooterContentLeft(this.getView().up);this.oUiApi.getLayoutView().getController().addMasterFooterContentLeft(this.getView().down);},getStepData:function(s){var S=s;var o={};o.index=this.oCoreApi.getSteps().indexOf(s);o.title=this.oCoreApi.getTextNotHtmlEncoded(S.title);o.thumbnail=this.getThumbnailDataset(s);return o;},refreshCarousel:function(){if(this.oCoreApi.getSteps().length>this.getView().stepViews.length){this.addStep(this.oCoreApi.getSteps());}},addStep:function(s){this.oViewData=this.getView().getViewData().apfInstance;if(s instanceof Array){for(var i=this.getView().stepViews.length;i<s.length;i++){this.addStep(s[i]);}return;}var a=new sap.ui.view({viewName:"sap.apf.ui.reuse.view.step",type:sap.ui.core.mvc.ViewType.JS,viewData:this.getView().getViewData().oInject});var j=new sap.ui.model.json.JSONModel();a.setModel(j);var b=this.getStepData(s),i;j.setData(b);this.getView().stepViews.push(a);var c=document.createElement('div');c.innerHTML=sap.ui.getCore().getRenderManager().getHTML(a);var d=this.getView().dndBox;var e=d.eleRefs.blocks.length-1;jQuery(".initialText").remove();jQuery(this.oUiApi.getStepContainer().getDomRef()).show();jQuery(".DnD-separator").show();var f=this.Step?this.Step.categories[0].id:undefined;if(f==="initial"){d.insertBlock({blockElement:c,dragState:false,dropState:false,removable:false},e);}else{d.insertBlock({blockElement:c},e);}if(b.index===this.oCoreApi.getSteps().indexOf(this.oCoreApi.getActiveStep())){a.toggleActiveStep();}a.rerender();jQuery('.DnD-block').parent().find("[tabindex='0'][drag-state='true']").attr('aria-labelledby',this.oView.byId("idOfAriaTextForCarouselBlock").getId());for(i=0;i<jQuery('.DnD-block').parent().find("[drag-state='true']").length;i++){if(jQuery('.DnD-block').parent().find("[drag-state='true']")[i].getElementsByClassName('activeStepTitle')[0]!==undefined){var A=jQuery('.DnD-block').parent().find("[drag-state='true']")[i];if(A===jQuery('.DnD-block').parent().find("[tabindex='0'][drag-state='true']")[0]){this.oView.byId("idOfAriaTextForCarouselBlock").setText(this.oCoreApi.getTextNotHtmlEncoded("aria-text-when-new-path-added",[jQuery('.activeStepTitle').text()]));}else{this.oView.byId("idOfAriaTextForCarouselBlock").setText(this.oCoreApi.getTextNotHtmlEncoded("aria-text-when-enter-press",[jQuery('.activeStepTitle').text()]));}setTimeout(function(){A.focus();},100);}}this.oUiApi.getLayoutView().setBusy(true);},moveStep:function(d,a){var c=this.oUiApi.getAnalysisPath().getCarousel();if(d===a){return;}c.stepViews=(function(e,f,t){var g=Math.abs(t-f);var h=(t-f)>0?1:-1;var i;while(g--){i=e[f];e[f]=e[f+h];e[f+h]=i;f=f+h;}return e;})(c.stepViews,d,a);this.oUiApi.getAnalysisPath().getController().refresh(Math.min(d,a));var b=this.oCoreApi.getSteps()[d];this.oCoreApi.moveStepToPosition(b,a,this.oUiApi.getAnalysisPath().getController().callBackForUpdatePath.bind(this.oUiApi.getAnalysisPath().getController()));},removeStep:function(r){var c=this.oUiApi.getAnalysisPath().getCarousel();c.stepViews.splice(r,1);var s=c.stepViews.length;var a=this.oCoreApi.getSteps().indexOf(this.oCoreApi.getActiveStep());if(s>0){if(r===a){var n;var b;if(a===0){n=a;b=c.stepViews[n];b.toggleActiveStep();this.oCoreApi.setActiveStep(this.oCoreApi.getSteps()[n+1]);}else{n=a-1;b=c.stepViews[n];b.toggleActiveStep();this.oCoreApi.setActiveStep(this.oCoreApi.getSteps()[n]);}}}else{jQuery(".DnD-separator").hide();jQuery(this.oUiApi.getStepContainer().getDomRef()).hide();jQuery('#'+this.oUiApi.getStepContainer().getId()).parent().append(sap.ui.getCore().getRenderManager().getHTML(this.oUiApi.getStepContainer().byId("idInitialText")));}var d=this.oCoreApi.getSteps()[r];this.oUiApi.getStepContainer().getController().representationInstance=null;this.oUiApi.getStepContainer().getController().currentSelectedRepresentationId=null;this.oUiApi.getAnalysisPath().getController().refresh(r);this.oCoreApi.removeStep(d,this.oUiApi.getAnalysisPath().getController().callBackForUpdatePath.bind(this.oUiApi.getAnalysisPath().getController()));this.oUiApi.getLayoutView().getController().enableDisableOpenIn();},removeAllSteps:function(){var r=0;var i;var d=this.getView().dndBox;var c=this.oUiApi.getAnalysisPath().getCarousel();var s=c.stepViews.length;function C(){}for(i=1;i<=s;i++){d.removeBlock(r,C);var a=this.oCoreApi.getSteps()[i-1];this.oUiApi.getStepContainer().getController().representationInstance=null;this.oUiApi.getStepContainer().getController().currentSelectedRepresentationId=null;c.stepViews.splice(r,1);}jQuery(".DnD-separator").hide();this.oUiApi.getLayoutView().getController().enableDisableOpenIn();},getThumbnailDataset:function(s){var S=this;var t=["leftUpper","rightUpper","leftLower","rightLower"];var T=s.thumbnail;var o=s.getSelectedRepresentationInfo().thumbnail;var r={};t.forEach(function(a){var h=o&&o[a];h=h&&!S.oCoreApi.isInitialTextKey(o[a]);var H=T&&T[a];H=H&&!S.oCoreApi.isInitialTextKey(T[a]);if(h){r[a]=S.oCoreApi.getTextNotHtmlEncoded(o[a]);return;}else if(H){r[a]=S.oCoreApi.getTextNotHtmlEncoded(T[a]);return;}});return r;},apfDestroy:function(){this.getView().dndBox=undefined;var s=this.getView().getStepGallery().getController();sap.apf.utils.checkAndCloseDialog(s.oHierchicalSelectDialog);}});}());
