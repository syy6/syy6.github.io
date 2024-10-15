sap.ui.define([],
	function() {
		"use strict";

		function createInstanceMetadataWithPath(oInterface, sEntityType, sAnnotation, sPropertyPath, oAnnotationContext, oTargetEntitySet) {
			if (oTargetEntitySet && oTargetEntitySet.entityType) {
				sEntityType = oTargetEntitySet.entityType;
				sAnnotation = (sAnnotation.indexOf("/@") > 0 ) ? sAnnotation.split("/@")[1] : sAnnotation;
			}
			sAnnotation = sAnnotation.startsWith("@") ? sAnnotation.substr(1) : sAnnotation;
			var oContext = oInterface.getInterface(3);
			var sPath = oContext && oContext.getPath();
			var oRes = {
				"target": sEntityType,
				"annotation": sAnnotation,
				"value": sPropertyPath,
				"path":  sPath,
				"annotationContext": oAnnotationContext
			};
			var sRes = JSON.stringify(oRes);
			return sRes;
		}

		function createInstanceMetadataForDesignTime(sEntityType, sAnnotation, sPropertyPath) {
			var oRes = {
				"target": sEntityType,
				"annotation": sAnnotation,
				"value": sPropertyPath
			};
			var sRes = JSON.stringify(oRes);
			return sRes;
		}

		createInstanceMetadataWithPath.requiresIContext = true;

		return {
			createInstanceMetadataWithPath: createInstanceMetadataWithPath,
			createInstanceMetadataForDesignTime: createInstanceMetadataForDesignTime
		};
	},
	/* bExport= */ true
);