sap.ui.define([
	"jquery.sap.global",
	"./library",
	"sap/ui/core/Control"
], function (jQuery, library, Control) {
	"use strict";

	/**
	 * Class for rendering associated control
	 * @private
	 */
	var ControlProxy = Control.extend("sap.suite.ui.commons.ControlProxy", {
		metadata: {
			library: "sap.suite.ui.commons",
			association: {
				/**
				 * Holds the items included in the variable.
				 */
				control: {
					type: "sap.ui.core.Control",
					multiple: false
				}
			}
		},
		renderer: function (oRm, oItem) {
			var sItem = oItem.getAssociation("control"),
				oItem = sap.ui.getCore().byId(sItem);

			oRm.renderControl(oItem);
		}
	});

	return ControlProxy;

}, /* bExport= */ true);
