sap.ui.define(["sap/suite/ui/generic/template/lib/StableIdDefinition", "sap/suite/ui/generic/template/js/AnnotationHelper"], function(StableIdDefinition, AnnotationHelper) {
	"use strict";

	function preparePathForStableId(oContext){
		var aParameter = oContext.getProperty("/stableId/aParameter");
		var oParameter = {  
			buildStableId: function(oInput){
				oParameter.id = getStableId(oInput);
				},
			buildFacetId: function(oFacet){
				// special logic to build id for Facet in the old way
				// preliminary - to be replaced...
				oParameter.id =  AnnotationHelper.getStableIdPartFromFacet(oFacet);
				}
			};
		aParameter.push(oParameter);
		return "/stableId/aParameter/" + (aParameter.length - 1);
	}
	
	function replaceSpecialCharsForLegacyIds(sLegacyId){
		return sLegacyId.replace(/@/g, "").replace(/[\/#]/g, "::");
	}

	function getLegacyStableId(oParameters){
		var aParameters = [];
		if (StableIdDefinition.types[oParameters.type].subTypes[oParameters.subType].fixed){
			return StableIdDefinition.types[oParameters.type].subTypes[oParameters.subType].value;
		} else {
			StableIdDefinition.parameters.forEach(function(sParameter){
				if (StableIdDefinition.types[oParameters.type].subTypes[oParameters.subType].parameters.indexOf(sParameter) > -1 ) {
					aParameters.push(oParameters[sParameter]);
				}
			});
			return replaceSpecialCharsForLegacyIds(StableIdDefinition.types[oParameters.type].subTypes[oParameters.subType].value.apply(null, aParameters));
		}
	}
	
	function escapeIdParameter(sParam){
		/* escape all characters not allowed in stable ids with :<hexcode>
		 * as we use : as escape character, also escape :
		 */
		return sParam.replace(/[^A-Za-z0-9_.-]/g, function(c){
			var sCode = c.charCodeAt(0).toString(16);
			return ":" + (sCode.lenght === 1 ? "0" : "") + sCode;
		});
	}
	
	function getStableId(oParameters){
		if (!oParameters.type) {throw "error";}
		if (!oParameters.subType) {throw "error";}
		if (!StableIdDefinition.types[oParameters.type]) {throw "error";}
		if (!StableIdDefinition.types[oParameters.type].subTypes[oParameters.subType]) {throw "error";}
		if (!StableIdDefinition.types[oParameters.type].subTypes[oParameters.subType].fixed){
			StableIdDefinition.types[oParameters.type].subTypes[oParameters.subType].parameters.forEach(function(sParameter){
				if (!oParameters[sParameter]) {throw "error";}
			});
		}
		// build legacy stable id
		if (StableIdDefinition.types[oParameters.type].subTypes[oParameters.subType].legacy){
			return getLegacyStableId(oParameters);
		}
		// build standard stable id
		var sStableId = "template:::" + oParameters.type + ":::" + oParameters.subType;
		// add parameters - order is defined according to oStableIdDefinition.parameters
		if (!StableIdDefinition.types[oParameters.type].subTypes[oParameters.subType].fixed){
			StableIdDefinition.parameters.forEach(function(sParameter){
				if (StableIdDefinition.types[oParameters.type].subTypes[oParameters.subType].parameters.indexOf(sParameter) > -1){
					sStableId += ":::" + sParameter + "::" + escapeIdParameter(oParameters[sParameter]);
				}
			});
		}
		return sStableId;
	}
	
	return {
		preparePathForStableId: preparePathForStableId,
		getStableId: getStableId
	};
}, /* bExport= */ true);
