/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)
        (c) Copyright 2009-2017 SAP SE. All rights reserved
    
 */

(function () {
	"use strict";

	/*
	 This class contains annotation helpers that might be used from several templates or controls
	 */

	jQuery.sap.declare("sap.fe.templates.ObjectPage.AnnotationHelper");

	sap.fe.templates.ObjectPage.AnnotationHelper = {
		replaceSpecialCharsInId: function (sId) {
			if (sId.indexOf(" ") >= 0) {
				jQuery.sap.log.error("Annotation Helper: Spaces are not allowed in ID parts. Please check the annotations, probably something is wrong there.");
			}
			return sId.replace(/@/g, "").replace(/\//g, "::").replace(/#/g, "::");
		},
		getStableIdPartFromFacet: function (oFacet) {
			var sHeaderFacetPrefix = "";
			if (typeof this.getContext === "function" && this.getContext() && this.getContext().getPath() && this.getContext().getPath().indexOf("com.sap.vocabularies.UI.v1.HeaderFacets") >= 0) {
				sHeaderFacetPrefix = "headerEditable::";
			}
			if (oFacet.$Type && oFacet.$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
				if (oFacet.ID && oFacet.ID.String) {
					return sHeaderFacetPrefix + oFacet.ID.String;
				} else {
					// If the ID is missing a random value is returned because a duplicate ID error will be thrown as soon as there is
					// more than one form on the UI.
					jQuery.sap.log.error("Annotation Helper: Unable to create a stable ID. You have to set an ID at all collection facets.");
					return Math.floor((Math.random() * 99999) + 1).toString();
				}
			} else if (oFacet.$Type && oFacet.$Type === "com.sap.vocabularies.UI.v1.ReferenceFacet") {
				if (oFacet.ID && oFacet.ID.String) {
					return sHeaderFacetPrefix + oFacet.ID.String;
				} else {
					return sHeaderFacetPrefix + sap.fe.templates.ObjectPage.AnnotationHelper.replaceSpecialCharsInId(oFacet.Target.$AnnotationPath);
				}
			} else {
				jQuery.sap.log.error("Annotation Helper: Unable to create a stable ID. Please check the facet annotations.");
				return Math.floor((Math.random() * 99999) + 1).toString();
			}
		},
		getStableIdPartFromDataPoint: function (oDataPoint) {
			var sPathConcat = "";
			if (oDataPoint.Value && oDataPoint.Value.$Path) {
				return sap.fe.templates.ObjectPage.AnnotationHelper.replaceSpecialCharsInId(oDataPoint.Value.$Path);
			} else if (oDataPoint.Value && oDataPoint.Value.Apply && oDataPoint.Value.Apply.Name === "odata.concat") {
				//Needs to be tested
				for (var i = 0; i < oDataPoint.Value.Apply.Parameters.length; i++) {
					if (oDataPoint.Value.Apply.Parameters[i].Type === "Path") {
						if (sPathConcat) {
							sPathConcat = sPathConcat + "::";
						}
						sPathConcat = sPathConcat + sap.fe.templates.ObjectPage.AnnotationHelper.replaceSpecialCharsInId(oDataPoint.Value.Apply.Parameters[i].Value);
					}
				}
				return sPathConcat;
			} else {
				// In case of a string or unknown property
				jQuery.sap.log.error("Annotation Helper: Unable to create stable ID derived from annotations.");
			}
		},
		/**
		 * Function to find out the type of table to be rendered on UI
		 * @param {object} oFacet - Object containing information about a facet
		 * @param {object} oSections - Object containing manifest settings of Object Page
		 */
		determineTableType: function (oFacet, oSections) {
			var oSettings; 				// contains properties of sections in object page
			if (oSections && oSections.sections) {
				oSettings = oSections.sections[sap.fe.templates.ObjectPage.AnnotationHelper.getStableIdPartFromFacet(oFacet)];
			}
			return (oSettings && (((oSettings.tableType || oSettings.treeTable)) || (oSections && oSections.tableType)));
		},
		buildExpressionForProgressIndicatorPercentValue: function (oInterface, dataPoint, mUoM) {
			var sPercentValueExpression = "0";
			var sExpressionTemplate;
			var oModel = oInterface.getModel(1);
			var sPath = oInterface.getPath(1);
			var oBindingContext = oModel.createBindingContext(sPath);
			if (dataPoint.Value && dataPoint.Value.$Path) { // Value is mandatory and it must be a path
				var sValue = "${" + dataPoint.Value.$Path + "}"; // Value is expected to be always a path. ${Property}
				var sTarget;
				if (dataPoint.TargetValue) { // Target can be a path or Edm Primitive Type
					sTarget = sap.ui.model.odata.v4.AnnotationHelper.value(dataPoint.TargetValue, {context : oBindingContext});
					if (dataPoint.TargetValue.$Path) {
						sTarget =  "$" + sTarget;
					}
				}
				// The expression consists of the following parts:
				// 1) When UoM is '%' then percent = value (target is ignored), and check for boundaries (value > 100 and value < 0).
				// 2) When UoM is not '%' (or is not provided) then percent = value / target * 100, check for division by zero and boundaries:
				// percent > 100 (value > target) and percent < 0 (value < 0)
				// Where 0 is Value, 1 is Target, 2 is UoM
				var sExpressionForUoMPercent = "(({0} > 100) ? 100 : (({0} < 0) ? 0 : ({0} * 1)))";
				var sExpressionForUoMNotPercent = "(({1} > 0) ? (({0} > {1}) ? 100 : (({0} < 0) ? 0 : ({0} / {1} * 100))) : 0)";
				if (mUoM) {
					mUoM = "'" + mUoM + "'";
					sExpressionTemplate = "'{'= ({2} === ''%'') ? " + sExpressionForUoMPercent + " : " + sExpressionForUoMNotPercent + " '}'";
					sPercentValueExpression = jQuery.sap.formatMessage(sExpressionTemplate, [sValue, sTarget, mUoM]);
				} else {
					sExpressionTemplate = "'{'= " + sExpressionForUoMNotPercent + " '}'";
					sPercentValueExpression = jQuery.sap.formatMessage(sExpressionTemplate, [sValue, sTarget]);
				}
			}
			return sPercentValueExpression;
		},

		trimCurlyBraces: function (value) {
			return value ? value.replace("{", "").replace("}", "") : undefined;
		},

		buildExpressionForProgressIndicatorDisplayValue: function (oInterface,dataPoint, mUoM) {
			var oModel = oInterface.getModel(1);
			var sPath = oInterface.getPath(1);
			var oBindingContext = oModel.createBindingContext(sPath);
			var aParts = [];
			aParts.push(sap.ui.model.odata.v4.AnnotationHelper.value(dataPoint.Value, {context : oBindingContext}));
			aParts.push(sap.ui.model.odata.v4.AnnotationHelper.value(dataPoint.TargetValue, {context : oBindingContext}));
			aParts.push(mUoM);
			var sDisplayValue = sap.fe.templates.ObjectPage.AnnotationHelper.formatDisplayValue(aParts);
			return sDisplayValue;
		},

		/**
		 * This function is meant to run at runtime, so the control and resource bundle can be available
		 * @function
		 * @private
		 * @parameter {string} sValue A string containing the value
		 * @parameter {string} sTarget A string containing the target value
		 * @parameter {string} sUoM A string containing the unit of measure
		 * @returns {string} A string containing the text that will be used in the display value of the Progress Indicator
		 */
		formatDisplayValue: function (aParts) {
			var sDisplayValue = "",
			sValue = aParts[0], sTarget = aParts[1], sUoM = aParts[2];

			if (sValue) {
				return sap.ui.getCore().getLibraryResourceBundle("sap.fe",true).then(function (oResourceBundle) {
				if (sUoM) {
					if (sUoM === '%') { // uom.String && uom.String === '%'
						sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_PERCENT", [sValue]);
					} else {// (uom.String and not '%') or uom.Path
						if (sTarget) {
							sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_NOT_PERCENT", [sValue, sTarget, sUoM]);
						} else {
							sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_UOM_IS_NOT_PERCENT_NO_TARGET_VALUE", [sValue, sUoM]);
						}
					}
				} else {
					if (sTarget) {
						sDisplayValue = oResourceBundle.getText("PROGRESS_INDICATOR_DISPLAY_VALUE_NO_UOM", [sValue, sTarget]);
					} else {
						sDisplayValue = sValue;
					}
				}
				return sDisplayValue;
				 });
			} else { // Cannot do anything
				jQuery.sap.log.warning("Value property is mandatory, the default (empty string) will be returned");
			}

		},

		buildExpressionForCriticality: function (dataPoint) {
			var sFormatCriticalityExpression = sap.ui.core.ValueState.None;
			var sExpressionTemplate;
			var oCriticalityProperty = dataPoint.Criticality;

			if (oCriticalityProperty) {
				sExpressionTemplate = "'{'= ({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Negative'') || ({0} === ''1'') || ({0} === 1) ? ''" + sap.ui.core.ValueState.Error + "'' : " +
				"({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Critical'') || ({0} === ''2'') || ({0} === 2) ? ''" + sap.ui.core.ValueState.Warning + "'' : " +
				"({0} === ''com.sap.vocabularies.UI.v1.CriticalityType/Positive'') || ({0} === ''3'') || ({0} === 3) ? ''" + sap.ui.core.ValueState.Success + "'' : " +
				"''" + sap.ui.core.ValueState.None + "'' '}'";
				if (oCriticalityProperty.$Path) {
					var sCriticalitySimplePath = '${' + oCriticalityProperty.$Path + "}";
					sFormatCriticalityExpression = jQuery.sap.formatMessage(sExpressionTemplate, sCriticalitySimplePath);
				} else if (oCriticalityProperty.$EnumMember) {
					var sCriticality = "'" + oCriticalityProperty.$EnumMember + "'";
					sFormatCriticalityExpression = jQuery.sap.formatMessage(sExpressionTemplate, sCriticality);
				} else {
					jQuery.sap.log.warning("Case not supported, returning the default sap.ui.core.ValueState.None");
				}
			} else {
				// Any other cases are not valid, the default value of 'None' will be returned
				jQuery.sap.log.warning("Case not supported, returning the default sap.ui.core.ValueState.None");
			}

			return sFormatCriticalityExpression;
		},
		buildRatingIndicatorSubtitleExpression: function (mSampleSize) {
			if (mSampleSize) {
				return "{parts: [{path: '" + mSampleSize.$Path + "'}], formatter: 'sap.fe.templates.ObjectPage.AnnotationHelper.formatRatingIndicatorSubTitle'}";
			}
		},

		// returns the text for the Rating Indicator Subtitle (e.g. '7 reviews')
		formatRatingIndicatorSubTitle: function (iSampleSizeValue) {
			if (iSampleSizeValue) {
				return sap.ui.getCore().getLibraryResourceBundle("sap.fe",true).then(function (oResourceBundle) {
				if (this.getCustomData().length > 0) {
					return oResourceBundle.getText("RATING_INDICATOR_SUBTITLE", [iSampleSizeValue, this.data("Subtitle")]);
				} else {
					var sSubTitleLabel = iSampleSizeValue > 1 ? oResourceBundle.getText("RATING_INDICATOR_SUBTITLE_LABEL_PLURAL") : oResourceBundle.getText("RATING_INDICATOR_SUBTITLE_LABEL");
					return oResourceBundle.getText("RATING_INDICATOR_SUBTITLE", [iSampleSizeValue, sSubTitleLabel]);
				}
			});
			}
		},
		// builds the expression for the Rating Indicator footer
		buildRatingIndicatorFooterExpression: function (oInterface,dataPoint) {
			var oModel = oInterface.getModel(1);
			var sPath = oInterface.getPath(1);
			var oBindingContext = oModel.createBindingContext(sPath);
			var aParts = [];
			aParts.push(sap.ui.model.odata.v4.AnnotationHelper.value(dataPoint.Value, {context : oBindingContext}));
			aParts.push(sap.ui.model.odata.v4.AnnotationHelper.value(dataPoint.TargetValue, {context : oBindingContext}));
			var sFooterTextValue = sap.fe.templates.ObjectPage.AnnotationHelper.formatRatingIndicatorFooterText(aParts);
			return sFooterTextValue;
		},

		// returns the text for the Rating Indicator footer (e.g. '2 out of 5')
		// note: the second placeholder (e.g. "5") for the text "RATING_INDICATOR_FOOTER" can come one from the following:
		// i. if the Property TargetValue for the term UI.DataPoint is a Path then the value is resolved by the method buildRatingIndicatorFooterExpression and passed to this method as 'targetValue'
		// ii. if the Property TargetValue is not a Path (i.e. 'Decimal') then we get the value from the control's Custom Data
		// iii. if neither i. or ii. apply then we use the default max value for the sap.m.RatingIndicator control
		formatRatingIndicatorFooterText: function (aParts) {
			var value = aParts[0], targetValue = aParts[1];
			if (value) {
				return sap.ui.getCore().getLibraryResourceBundle("sap.fe",true).then(function (oResourceBundle) {
				if (targetValue) {
					return oResourceBundle.getText("RATING_INDICATOR_FOOTER", [value, targetValue]);
				} else if (this.getCustomData().length > 0) {
					return oResourceBundle.getText("RATING_INDICATOR_FOOTER", [value, this.data("Footer")]);
				} else {
					var iRatingIndicatorDefaultMaxValue = sap.m.RatingIndicator.getMetadata().getPropertyDefaults().maxValue;
					return oResourceBundle.getText("RATING_INDICATOR_FOOTER", [value, iRatingIndicatorDefaultMaxValue]);
				}
			});
		}
	},
		getBindingPathForOPTableandForm : function(sPath) {
			var sNavigationPath = sap.ui.model.odata.v4.AnnotationHelper.getNavigationPath(sPath);
			if (sPath.indexOf('com.sap.vocabularies.UI.v1.LineItem') > -1) {
				//We need this double escape characters is to set the table binding path property of MDC Table as string literal as it get processed as normal expression binding if not escaped.
				return "\\{path:'" + sNavigationPath + "',parameters:\\{$$groupId:'$auto.associations'\\}\\}";
			} else {
				//We need this escape characters is to set the binding path of Form as string literal as it get processed as normal expression binding if not escaped.
				return  "\{path:'" + sNavigationPath + "',parameters:\{$$groupId:'$auto.associations'\}\}";
			}
		},

		getElementBinding : function(sPath) {
			var sNavigationPath = sap.ui.model.odata.v4.AnnotationHelper.getNavigationPath(sPath);
			if (sNavigationPath) {
				return  "{path:'" + sNavigationPath + "',parameters:{$$groupId:'collection'}}";
			} else {
				//no navigation property needs empty object
				return "{}";
			}
		},
		/**
		* Function to get the visibility for the Edit/Delete button in the object page/sub-object page.
		* @param {Object} [oRawValue] The value from the expression.
		* @param {Object} [oDraftNode] Draft node object passed from fragment(to differeciate between draft root or draft node)[Oly passed in case of Delete]
		* @returns {String} Returns expression binding or boolean value based on vRawValue & oDraftNode
		 */
		getEditDeleteButtonVisibility: function (oRawValue, oDraftNode) {
			if (oDraftNode) {
				if (typeof vRawValue === 'object' && oRawValue.$Path) {
					return "{= ${" + oRawValue.$Path + "} && ${ui>/editable}}";
				} else {
					return "{= ${ui>/editable}}";
				}
			} else if (typeof vRawValue === 'object' && oRawValue.$Path) {
				return "{= ${" + oRawValue.$Path + "} && !${ui>/editable}}";
			} else {
				return "{= !${ui>/editable}}";
			}
		},

		getLinkEntityType: function (oContext) {
			// TODO : The oContext is the context points to the metaContext stored in viewData model. This is done to extract the metaContext created for the links.
			//        Don't know if this is the right approach. Probably, need to find a better way to do this.
			return oContext.getObject();
		},

		/**
		 * Function to get the expression binding for text of the breadcrumb link
		 * @param: oInteface : Interface to get model and path.
		 * @param: oTitle :  Annotation at {EntityType}/$Type@com.sap.vocabularies.UI.v1.HeaderInfo/Title/Value.
		 * @param: sTypeName : Annotation at {EntityType}/$Type@com.sap.vocabularies.UI.v1.HeaderInfo/TypeName.
		 * @returns: Expression binding for the text of breadcrumb link
		 */
		formatTextForBreadcrumbs: function (oInterface, oTitle, sTypeName) {
			var oModel = oInterface.getInterface(1).getModel();
			var sPath = oInterface.getInterface(1).getPath();
			var oBindingContext = oModel.createBindingContext(sPath);
			var sBindingTitle = sap.ui.model.odata.v4.AnnotationHelper.value(oTitle, {context : oBindingContext});

			if (oTitle && oTitle.$Path && sTypeName) {
				var sBinding, sTypeNameEscaped = sTypeName.replace(/'/g, "\\'");
				sBinding = "{= $" + sBindingTitle + " ? $" + sBindingTitle + " : '" + sTypeNameEscaped + "' }";
				return sBinding;
			} else {
				// in case of a complex binding of the title we do not introduce our default text fallback
				if (!sBindingTitle) {
					// string "[[no title]]" should never been shown in UI therefore no transaltion needed
					return sTypeName || "[[no title]]";
				}
				return sBindingTitle;
			}
		},
		isDeepFacetHierarchy: function (oFacet) {
			if (oFacet.Facets) {
				for (var i = 0; i < oFacet.Facets.length; i++) {
					if (oFacet.Facets[i].$Type === "com.sap.vocabularies.UI.v1.CollectionFacet") {
						return true;
					}
				}
			}
			return false;
		}

	};
	sap.fe.templates.ObjectPage.AnnotationHelper.buildExpressionForProgressIndicatorPercentValue.requiresIContext = true;
	sap.fe.templates.ObjectPage.AnnotationHelper.formatTextForBreadcrumbs.requiresIContext = true;
	sap.fe.templates.ObjectPage.AnnotationHelper.buildRatingIndicatorFooterExpression.requiresIContext = true;
	sap.fe.templates.ObjectPage.AnnotationHelper.buildExpressionForProgressIndicatorDisplayValue.requiresIContext = true;


})();
