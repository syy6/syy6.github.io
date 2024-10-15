/*
 * ! SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/mdc/TableSettings"],function(T){"use strict";return{name:"{name}",description:"{description}",aggregations:{_content:{domRef:":sap-domref",ignore:false,propagateRelevantContainer:true,propagateMetadata:function(e){var t=e.getMetadata().getName();if(t==="sap.m.Column"||t==="sap.ui.table.Column"){return{actions:{remove:{changeType:"removeMDCColumn",changeOnRelevantContainer:true}}};}else if(t==="sap.ui.mdc.Table"||t==="sap.ui.table.Table"||t==="sap.m.Table"||t==="sap.m.Toolbar"){return{actions:{settings:{handler:function(c,p){var m=p.contextElement.getParent();return T.showColumnsPanel(m);},changeOnRelevantContainer:true}}};}return{actions:null};}}}};},false);
