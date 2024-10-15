/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define(["sap/ui/comp/smartfield/type/TextArrangement","sap/ui/comp/smartfield/type/Guid","sap/ui/model/ValidateException","sap/base/assert"],function(T,G,V,a){"use strict";var b=T.extend("sap.ui.comp.smartfield.type.TextArrangementGuid",{constructor:function(f,c,s){T.apply(this,arguments);}});b.prototype.preParseDescriptionOnly=function(v,s,c,f){var p=G.prototype.parseValue.call(this,v,s);if(i(p)){return[p,undefined];}return[v.trim(),undefined];};b.prototype.parseDescriptionOnly=function(v,s,c,S){if(i(v)){if(S.data.length===1){this.sDescription=S.data[0][S.valueListAnnotation.descriptionField];return[v,undefined];}if(S.data.length===0){throw new V(sap.ui.getCore().getLibraryResourceBundle("sap.ui.comp").getText("SMARTFIELD_NOT_FOUND"));}a(false,"Duplicate GUID. - "+this.getName());}else{return T.prototype.parseDescriptionOnly.apply(this,arguments);}};b.prototype.onBeforeValidateValue=function(v,f,F){if((f.textArrangement==="descriptionOnly")&&!i(v)){F=["descriptionField"];}this.oSettings.onBeforeValidateValue(v,F);};b.prototype.getName=function(){return"sap.ui.comp.smartfield.type.TextArrangementGuid";};b.prototype.getPrimaryType=function(){return G;};function i(v){var r=/^[A-F0-9]{8}-([A-F0-9]{4}-){3}[A-F0-9]{12}$/i;return r.test(v);}return b;});
