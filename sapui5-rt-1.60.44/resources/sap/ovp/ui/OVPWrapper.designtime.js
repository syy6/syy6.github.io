/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2017 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */
sap.ui.define(["sap/ovp/cards/AppSettingsUtils","jquery.sap.global","sap/ovp/app/resources"],function(A,q,O){"use strict";return{actions:{},aggregations:{DynamicPage:{domRef:".sapUiComponentContainer",actions:{},propagateMetadata:function(e){var t=e.getMetadata().getName();if(t!=="sap.ovp.ui.EasyScanLayout"&&t!=="sap.ui.core.ComponentContainer"){return{actions:null};}},propagateRelevantContainer:false}},name:{singular:O&&O.getText("Card"),plural:O&&O.getText("Cards")}};},false);
