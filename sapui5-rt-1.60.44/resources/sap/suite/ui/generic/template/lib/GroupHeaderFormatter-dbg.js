/*
 * GroupHeaderFormatter.js: Static class to format the Grouping Header für sap.m.Table or sap.ui.AnalyticalTable in SmartTable
 */

sap.ui.define(["sap/ui/core/library",
	"sap/ui/core/format/DateFormat",
	"sap/ui/core/format/NumberFormat",
	"sap/suite/ui/generic/template/js/AnnotationHelper"
], function(coreLibrary, DateFormat, NumberFormat, AnnotationHelper) {
	"use strict";

	function getDateInUTCOffset(oDate) {
		return new Date(oDate.valueOf() - oDate.getTimezoneOffset() * 60 * 1000);
	}

	function getGroupingFormatter(oTypeMap, oProperty) {
		var fnGroupingFormatter = null,
			oDisplayFormatter, oParseFormatter, sAnnotation, sUnit,
			fnFormatterDataTime = function (oValue) {
				if (oValue === null) {
					oValue = "";
				} else if (oValue && oValue instanceof Date) {
					if (oTypeMap.dateFormatSettings && oTypeMap.dateFormatSettings.UTC) {
						oValue = getDateInUTCOffset(oValue);
					}
					oValue = oDisplayFormatter.format(oValue);
				}
				return oValue;
			},
			fnFormatterUTCDataTime = function (oValue) {
				if (oValue === null) {
					oValue = "";
				} else if (oValue && oValue instanceof Date) {
					oValue = oDisplayFormatter.format(oValue, true);
				}
				return oValue;
			};

		switch (oTypeMap.type) {
			case "Edm.Boolean":
				fnGroupingFormatter = (function () {
					var sYes = (oTypeMap.oResourceBundle) ? oTypeMap.oResourceBundle.getText("YES") : "{i18n>YES}",
						sNo = (oTypeMap.oResourceBundle) ? oTypeMap.oResourceBundle.getText("NO") : "{i18n>NO}";

					return function (oValue) {
						if (oValue === true) {
							oValue = sYes;
						} else if (oValue === false) {
							oValue = sNo;
						} else if (oValue === null) {
							oValue = "";
						}
						return oValue;
					};
				}());
				break;
			case "Edm.DateTime":
				if (oTypeMap.displayFormat === "Date") {
					oDisplayFormatter = DateFormat.getDateInstance(oTypeMap.dateFormatSettings);
					fnGroupingFormatter = fnFormatterUTCDataTime; // displayFormat=Date triggers timestamps in UTC (sap.ui.model.odata.type.DateTime)
				} else { // e.g. displayFormat "Time"
					oDisplayFormatter = DateFormat.getDateTimeInstance(oTypeMap.dateFormatSettings);
					fnGroupingFormatter = fnFormatterDataTime;
				}
				break;
			case "Edm.DateTimeOffset":
				oDisplayFormatter = DateFormat.getDateTimeInstance(oTypeMap.dateFormatSettings);
				if (oTypeMap.displayFormat === "Date") {
					fnGroupingFormatter = fnFormatterUTCDataTime; // displayFormat=Date triggers timestamps in UTC
				} else {
					fnGroupingFormatter = fnFormatterDataTime;
				}
				break;
			case "Edm.Time":
				oDisplayFormatter = DateFormat.getTimeInstance(oTypeMap.dateFormatSettings);
				fnGroupingFormatter = function (oValue) {
					if (oValue === null) {
						oValue = "";
					} else if (oValue) { // e.g. {ms: 43980000, __edmType: "Edm.Time"}, interpreted in UTC
						oValue = oDisplayFormatter.format(new Date(oValue.ms || 0), true); // see also: sap.ui.model.odata.ODataUtils.js:formatValue()
					}
					return oValue;
				};
				break;
			case "Edm.Decimal":
				sAnnotation = "Org.OData.Measures.V1.ISOCurrency";
				if (oProperty[sAnnotation]) {
					sUnit = oProperty[sAnnotation].Path;
					oDisplayFormatter = NumberFormat.getCurrencyInstance({
						showMeasure: false
					});
				} else {
					sAnnotation = "Org.OData.Measures.V1.Unit";
					if (oProperty[sAnnotation]) {
						sUnit = oProperty[sAnnotation].Path;
					}
					oDisplayFormatter = NumberFormat.getFloatInstance({
						precision: oProperty.precision,
						decimals: oProperty.scale
					});
				}
				fnGroupingFormatter = function (oValue, sTextPropertyValue, oContext) {
					var sUnitValue;

					if (oValue === null) {
						oValue = "";
					} else {
						sUnitValue = (sUnit && oContext) ? oContext.getProperty(sUnit) : "";
						oValue = oDisplayFormatter.format(oValue, sUnitValue);
						if (sUnitValue) {
							oValue += " " + sUnitValue;
						}
					}
					return oValue;
				};
				break;
			case "Edm.String":
				sAnnotation = "com.sap.vocabularies.Common.v1.IsCalendarDate"; // sap.ui.comp.providers.ChartProvider, sap.ui.comp.odata.type.StringDate
				if (oProperty[sAnnotation] && String(oProperty[sAnnotation].Bool) === "true") {
					oDisplayFormatter = DateFormat.getDateInstance(jQuery.extend({}, oTypeMap.dateFormatSettings, { UTC: false }));
					oParseFormatter = DateFormat.getDateInstance({
						UTC: false,
						pattern: "yyyyMMdd",
						calendarType: coreLibrary.CalendarType.Gregorian
					});
					fnGroupingFormatter = function (oValue, sTextPropertyValue) {
						if (oValue === null) {
							oValue = "";
						} else if (oValue !== "") {
							oValue = oParseFormatter.parse(oValue, true);
							oValue = oDisplayFormatter.format(oValue);
						}
						return oValue;
					};
				} else { // set also for type String, so we need to set the formatter only once for AnalyticalTable
					fnGroupingFormatter = function (oValue, sTextPropertyValue) {
						if (oValue === null) {
							oValue = "";
						}
						return oValue;
					};
				}
				break;
			case "Edm.Byte":
				fnGroupingFormatter = function (oValue, sTextPropertyValue) {
					if (oValue === null) {
						oValue = "";
					}
					return oValue;
				};
				break;
			default:
				break;
		}
		return fnGroupingFormatter;
	}

	function getTypeMapForMTable(oContext, sPath, sColumnLabel, oDateFormatSettings) {
		var oMetaModel = oContext.getModel("entitySet").getMetaModel(),
			oMetaEntityType = oMetaModel.getObject(oMetaModel.getMetaContext(oContext.sPath).sPath),
			oProperty = oMetaModel.getObject(oMetaModel.getMetaContext(oContext.sPath + "/" + sPath).sPath),
			oTypeMap = {
				path: sPath,
				type: oProperty.type,
				displayFormat: "",
				dateFormatSettings: oDateFormatSettings || null,
				label: sColumnLabel,
				textPath: "",
				textArrangement: AnnotationHelper.getTextArrangement(oMetaEntityType, oProperty),
				fnGroupingFormatter: null,
				oResourceBundle: null // not needed for sap.m.Table
			},
			oPropertyExtensions, sTextProperty,	aSplitPath,	iLength;

		if (oProperty) {
			if (oProperty.extensions) {
				iLength = oProperty.extensions.length;
				for (var k = 0; k < iLength; k++) {
					oPropertyExtensions = oProperty.extensions[k];
					if (oPropertyExtensions.namespace === "http://www.sap.com/Protocols/SAPData") {
						switch (oPropertyExtensions.name) {
							case "display-format":
								oTypeMap.displayFormat = oPropertyExtensions.value;
								break;
							case "label":
								if (!oTypeMap.label) {
									oTypeMap.label = oPropertyExtensions.value;
								}
								break;
							case "text":
								sTextProperty = oPropertyExtensions.value;
								aSplitPath = sPath.split("/");
								aSplitPath[aSplitPath.length - 1] = sTextProperty;
								oTypeMap.textPath = aSplitPath.join("/");
								break;
							default:
								break;
						}
					}
				}
			}
			if (!oTypeMap.label) {
				oTypeMap.label = sPath;
			}
			oTypeMap.fnGroupingFormatter = getGroupingFormatter(oTypeMap, oProperty);
		}
		return oTypeMap;
	}

	function getGroupFunctionForMTable(oSmartTable, sPath, sColumnLabel) {
		// coding for finding the right key and label for the grouping row of a table (hope to replace this by core functionality soon)
		var oTypeMap, // buffer for subsequent calls
			oDateFormatSettings = JSON.parse(oSmartTable.data("dateFormatSettings"));

		return function(oContext) {
			// This function will be called by SmartTable for every table row, when grouping
			var sPropertyValue,	sKey, sAssociatedText;

			if (!oTypeMap) {
				oTypeMap = getTypeMapForMTable(oContext, sPath, sColumnLabel, oDateFormatSettings);
			}
			sPropertyValue = oContext.getProperty(sPath);
			if (oTypeMap.fnGroupingFormatter) {
				sPropertyValue = oTypeMap.fnGroupingFormatter(sPropertyValue, null, oContext);
			}

			if (oTypeMap.textPath) {
				sAssociatedText = oContext.getProperty(oTypeMap.textPath);
			}
			if (sAssociatedText) {
				switch (oTypeMap.textArrangement) {
					case "idAndDescription": // TextLast
						sKey = sPropertyValue + " (" + sAssociatedText + ")";
						break;
					case "idOnly": // TextSeparate
						sKey = sPropertyValue;
						break;
					case "descriptionOnly":	// TextOnly
						sKey = sAssociatedText;
						break;
					default: // descriptionAndId, TextFirst
						sKey = sAssociatedText + (sPropertyValue ? " (" + sPropertyValue + ")" : "");
						break;
				}
			} else { // no text property or text association is null or undefined
				sKey = sPropertyValue;
			}

			return {
				key: sKey || sPath,
				text: oTypeMap.label ? oTypeMap.label + ": " + sKey : sKey
			};
		};
	}

	function getTypeMapForAnalyticalTable(oProperty, oDateFormatSettings, oResourceBundle) {
		var oTypeMap = {
				path: oProperty.name,
				type: oProperty.type,
				displayFormat: "",
				dateFormatSettings: oDateFormatSettings || null,
				fnGroupingFormatter: null,
				oResourceBundle: oResourceBundle // AnalyticalTable does not handle localized text in the formatter
			},
			oPropertyExtensions, iLength;

		if (oProperty.extensions) {
			iLength = oProperty.extensions.length;
			for (var k = 0; k < iLength; k++) {
				oPropertyExtensions = oProperty.extensions[k];
				if (oPropertyExtensions.namespace === "http://www.sap.com/Protocols/SAPData") {
					switch (oPropertyExtensions.name) {
						case "display-format":
							oTypeMap.displayFormat = oPropertyExtensions.value;
							break;
						default:
							break;
					}
				}
			}
		}

		oTypeMap.fnGroupingFormatter = getGroupingFormatter(oTypeMap, oProperty);
		return oTypeMap;
	}

	function setGroupFunctionForAnalyticalTable(oSmartTable) {
		var oTable = oSmartTable.getTable(),
			aGroupedColumns = oTable.getGroupedColumns();

		if (aGroupedColumns.length) {
			var oDateFormatSettings = JSON.parse(oSmartTable.data("dateFormatSettings"));
			var oResourceBundle = oSmartTable.getModel("i18n").getResourceBundle();

			var sEntitySet = oSmartTable.getEntitySet();
			var oMetaModel = oSmartTable.getModel().getMetaModel();
			var oEntitySet = oMetaModel.getODataEntitySet(sEntitySet);
			var oEntityType = oMetaModel.getODataEntityType(oEntitySet.entityType);
			var aColumns = oTable.getColumns();
			var mColumnById = aColumns.reduce(function(map, obj) {
				map[obj.getId()] = obj;
				return map;
			}, {});

			for (var i = 0; i < aGroupedColumns.length; i++) {
				var oColumn = mColumnById[aGroupedColumns[i]];
				if (oColumn) {
					var sProperty = oColumn.getLeadingProperty();
					if (!oColumn.getGroupHeaderFormatter()) { // optimization: set formatter only if it is not set
						var oProperty = oMetaModel.getODataProperty(oEntityType, sProperty);
						var oTypeMap = getTypeMapForAnalyticalTable(oProperty, oDateFormatSettings, oResourceBundle);
						oColumn.setGroupHeaderFormatter(oTypeMap.fnGroupingFormatter);
					}
				}
			}
		}
	}

	return {
		getGroupFunctionForMTable: getGroupFunctionForMTable,
		setGroupFunctionForAnalyticalTable: setGroupFunctionForAnalyticalTable
	};
});
