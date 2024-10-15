sap.ui.define([
	"sap/ui/core/Control",
	"sap/suite/ui/generic/template/AnalyticalListPage/controller/KpiTagController",
	"sap/ui/core/library"
], function(Control, KpiTagController, SapCoreLibrary) {
	"use strict";

	return Control.extend("sap.suite.ui.generic.template.AnalyticalListPage.control.KpiTag", {
		metadata: {
			properties: {
				value: {
					type: "string",
					defaultValue: "",
					bindable: "bindable"
				},
				shortDescription : {
					type: "string",
					defaultValue : "",
					bindable: "bindable"
				},
				unit: {
					type: "string",
					defaultValue: "",
					bindable: "bindable"
				},
				indicator: {
					type: "sap.m.ValueColor",
					defaultValue: undefined
				},
				enabled: {
					type : "boolean",
					defaultValue : true,
					bindable: false
				},
				error: {
					type : "boolean",
					defaultValue : false,
					bindable: false
				},
				errorType: {
					type : "sap.ui.core.MessageType",
					defaultValue : SapCoreLibrary.MessageType.Error
				},
				errorMessage: {
					type: "string",
					defaultValue: "",
					bindable: "bindable"
				}

			},
			events: {
				press: {}
			}
		},
		renderer: {
			render: function(oRM, oControl) {
				oRM.write("<div");
				if (oControl.getProperty("enabled")) {
					oRM.writeAttributeEscaped("tabIndex", 0);
				} else {
					oRM.writeAttributeEscaped("tabIndex", -1);
				}
				oRM.writeControlData(oControl);
				oRM.addClass("sapSmartTemplatesAnalyticalListPageKpiTag sapSmartTemplatesAnalyticalListPageKpiTagCozy sapUiSmallMarginEnd");
				oControl._addColorClasses(oRM);
				oRM.writeClasses();
				oRM.writeAccessibilityState(oControl, {
					label: oControl._getAriaLabelText(oControl._ariaLabel)
				});
				oRM.writeAttributeEscaped("title", oControl.getTooltip());
				oRM.write(">");
				oRM.write("<div");
				oRM.addClass("sapSmartTemplatesAnalyticalListPageKpiTagName");
				oRM.writeClasses();
				oRM.write(">");
				oRM.writeEscaped(oControl.getShortDescription());
				oRM.write("</div>");
				if (oControl.getProperty("error")) {
					oRM.write("<div");
					oRM.addClass(oControl._getIconColor());
					oRM.writeClasses();
					oRM.write(">");
					oRM.writeIcon(oControl._getIcon());
				} else {
					oRM.write("<div");
					oRM.addClass("sapSmartTemplatesAnalyticalListPageKpiTagValue");
					oRM.writeClasses();
					oRM.write(">");
					oRM.writeEscaped(oControl.getValue() + (oControl.getUnit() && oControl.getUnit() !== " " ? " " + oControl.getUnit() : ""));
				}
				oRM.write("</div>");
				oRM.write("</div>");
			}
		},
		/**
		 * This function decides the icon to be put on the kpi tag based on type of error
		 * @returns {string}
		 * @private
		 */
		_getIcon: function() {
			switch (this.getProperty("errorType")) {
				case SapCoreLibrary.MessageType.Error:
					return "sap-icon://message-error";
				case SapCoreLibrary.MessageType.Warning:
					return "sap-icon://message-warning";
				default:
					return "sap-icon://message-error";
			}
		},
		/**
		 * This function decides the icon color of the kpi tag based on type of error
		 * @returns {string}
		 * @private
		 */
		_getIconColor: function() {
			switch (this.getProperty("errorType")) {
				case SapCoreLibrary.MessageType.Error:
					return "sapSmartTemplatesAnalyticalListPageKPIErrorIcon";
				case SapCoreLibrary.MessageType.Warning:
					return "sapSmartTemplatesAnalyticalListPageKPIWarningIcon";
				default:
					return "sapSmartTemplatesAnalyticalListPageKPIErrorIcon";
			}
		},
		setEnabled: function(bValue) {
			this.setProperty("enabled", bValue, true);
			if (bValue) {
				this.removeStyleClass("sapSmartTemplatesAnalyticalListPageKpiTagDisable");
			} else {
				this.addStyleClass("sapSmartTemplatesAnalyticalListPageKpiTagDisable");
			}
		},
		_getAriaLabelText: function(kpitooltip) {
			var rb = this.getModel("i18n").getResourceBundle();
			return rb.getText("KPI_ARIALABEL_TAG", [kpitooltip]);
		},
		_addColorClasses:  function(rm) {
			switch (this.getIndicator()) {
				case sap.m.ValueColor.Neutral:
				rm.addClass("sapSmartTemplatesAnalyticalListPageKPINeutral");
				break;
				case sap.m.ValueColor.Error:
				rm.addClass("sapSmartTemplatesAnalyticalListPageKPINegative");
				break;
				case sap.m.ValueColor.Good:
				rm.addClass("sapSmartTemplatesAnalyticalListPageKPIPositive");
				break;
				case sap.m.ValueColor.Critical:
				rm.addClass("sapSmartTemplatesAnalyticalListPageKPICritical");
				break;
				default:
				rm.addClass("sapSmartTemplatesAnalyticalListPageKPINeutral");
				//rm.addClass("sapSmartTemplatesAnalyticalListPageKPIUndetermined");
				break;
			}
		}
	});
}, true);
