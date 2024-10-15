/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/fl/changeHandler/MoveControls","sap/ui/thirdparty/jquery"],function(M,q){"use strict";var a=q.extend({},M);a.applyChange=function(c,C,p){p.targetAggregation="groupElements";p.sourceAggregation="groupElements";return M.applyChange.call(this,c,C,p);};return a;},true);
