/*
 * SAP UI development toolkit for HTML5 (SAPUI5)

(c) Copyright 2009-2018 SAP SE. All rights reserved
 */

sap.ui.define([
	'sap/chart/coloring/emphasis/DimensionValues',
	'sap/chart/coloring/ColorPalette',
	'sap/chart/coloring/ColoringUtils',
	'sap/chart/ChartLog',
	'sap/chart/data/TimeDimension',
	"sap/ui/thirdparty/jquery"
], function(DimensionValues, ColorPalette, ColoringUtils, ChartLog, TimeDimension, jQuery) {
	"use strict";
	var type = jQuery.type,
		SUPPORTED_TYPES = ['DimensionValues', 'MeasureValues'];

	function createRules(aCandidateSettings, aLegendOrder) {
		var oCandidateSetting = aCandidateSettings[0];
		var aCbs = oCandidateSetting.parsed.callbacks.Highlight || [];
		var oLegend = oCandidateSetting.parsed.legend;
		var aRules = [];
		aRules.push({
			callback: aCbs,
			properties: {
				color: ColorPalette.EMPHASIS.Highlight
			},
			displayName: oLegend.Highlight
		});

		var oOthers = {
			properties: {
				color: ColorPalette.EMPHASIS.Others
			},
			displayName: oLegend.Others
		};

		return {
			rules: aRules,
			others: oOthers
		};
	}

	function getRuleGenerator(aCandidateSettings, aLegendOrder) {
		return function() {
			var props = {
				plotArea: {
					dataPointStyle: createRules(aCandidateSettings)
				}
			};
			return {
				properties: props
			};
		};
	}

	return {
		getCandidateSetting: function(oColorings, oActiveColoring, aTuples, oDimMsr, oStatus, options, oLocale) {
			var oEmphasis = oColorings.Emphasis || {},
				oParams = oActiveColoring.parameters || {};
			var sUseType = ColoringUtils.dimOrMsrUse(oEmphasis, oParams, SUPPORTED_TYPES, 'Emphasis');
			var oCandidateSetting;

			switch (sUseType) {
				case 'DimensionValues':
					var activeDimension = oParams.dimension || Object.keys(oEmphasis.DimensionValues);
					if (type(activeDimension) === 'string') {
						activeDimension = [activeDimension];
					}
					oCandidateSetting = DimensionValues.qualify(oEmphasis.DimensionValues, activeDimension, oDimMsr, options);
					if (oCandidateSetting) {
						oCandidateSetting.parsed = DimensionValues.parse(oCandidateSetting, oLocale);
						oCandidateSetting.ruleGenerator = getRuleGenerator([oCandidateSetting]);
					}
					break;
				default:
					return {};
			}

			if (oCandidateSetting.length) {
				oCandidateSetting.subType = sUseType;
			}

			return oCandidateSetting;
		}
	};
});