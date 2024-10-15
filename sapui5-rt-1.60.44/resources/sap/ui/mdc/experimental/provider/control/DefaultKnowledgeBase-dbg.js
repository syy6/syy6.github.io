/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
sap.ui.define([
	"./AbstractKnowlegdeBase", "sap/ui/mdc/experimental/provider/BaseControlProvider"
], function(AbstractKnowlegdeBase, BaseControlProvider) {
	"use strict";

	var DefaultKnowLedgeBase = AbstractKnowlegdeBase.extend("sap.ui.mdc.experimental.provider.control.DefaultKnowlegdeBase", {
		_mProviders: {
			"sap.ui.mdc.Base": BaseControlProvider.extend("sap.ui.mdc.experimental.provider.control.BaseProvider", {
				driveWithMetadata: function(oControl, oAdapter) {
					this.provideProperty(oControl, "visible", oAdapter.visible);
					this.provideProperty(oControl, "tooltip", oAdapter.tooltip);
				}
			}),
			"sap.m.InputBase": BaseControlProvider.extend("sap.ui.mdc.experimental.provider.control.InputBaseProvider", {
				driveWithMetadata: function(oControl, oAdapter) {
					this._mProviders["sap.ui.mdc.Base"].driveWithMetadata(oControl, oAdapter);

					this.provideProperty(oControl, "editable", oAdapter.enabled);
					this.provideProperty(oControl, "required", oAdapter.required);

					var aLabels = oControl.getLabels();

					for (var i = 0; i < aLabels.length; i++) {
						if (this.canControlBeProvided(aLabels[i], oControl)) {
							this.getProvider(aLabels[i]).driveWithMetadata(aLabels[i], oAdapter);
						}
					}
				}
			}),
			"sap.m.Input": BaseControlProvider.extend("sap.ui.mdc.experimental.provider.control.InputProvider", {
				driveWithMetadata: function(oControl, oAdapter) {
					this._mProviders["sap.m.InputBase"].driveWithMetadata(oControl, oAdapter);

					var type = this.convertToInputType(oAdapter);

					this.provideProperty(oControl, "type", type);

				}
			}),
			"sap.m.Label": BaseControlProvider.extend("sap.ui.mdc.experimental.provider.control.Label", {
				driveWithMetadata: function(oControl, oAdapter) {
					this._mProviders["sap.ui.mdc.Base"].driveWithMetadata(oControl, oAdapter);

					this.provideProperty(oControl, "text", oAdapter.label);
				}
			}),
			"sap.ui.mdc.base.FilterField": BaseControlProvider.extend("sap.ui.mdc.experimental.provider.control.FilterField", {
				driveWithMetadata: function(oControl, oAdapter) {
					this.provideProperty(oControl, "required", oAdapter.required);
					this.provideProperty(oControl, "type", oAdapter.type);
					this.provideProperty(oControl, "fieldPath", oAdapter.path);
					this.provideAggregation(oControl, "conditions", oAdapter.conditions);
					this.providePrepareCloneFunction(oControl, "suggestion", oAdapter.suggestion.bind(oAdapter));
				}
			})
		}
	});

	DefaultKnowLedgeBase.prototype.getProvider = function(oControl) {
		var sName = oControl.getMetadata().getName();

		return this._mProviders[sName];
	};

	return DefaultKnowLedgeBase;
});
