/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define(['sap/ui/mdc/library','sap/ui/base/ManagedObjectObserver','./FieldBase','./FieldBaseRenderer'],function(l,M,F,a){"use strict";var b=F.extend("sap.ui.mdc.base.FilterField2",{metadata:{library:"sap.ui.mdc",properties:{},events:{change:{parameters:{value:{type:"string"},valid:{type:"boolean"}}}}},renderer:a});b.prototype.init=function(){F.prototype.init.apply(this,arguments);};b.prototype.exit=function(){F.prototype.exit.apply(this,arguments);};b.prototype._fireChange=function(c,v){var V;if(c.length==1){V=c[0].values[0];}this.fireChange({value:V,valid:v});};return b;},true);
