/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

sap.ui.define(["sap/ui/fl/context/BaseContextProvider", "sap/ui/fl/Cache"], function(BaseContextProvider, Cache) {
	"use strict";

	/**
	 * Switch context provider.
	 *
	 *
	 * @class
	 * @extends sap.ui.fl.context.BaseContextProvider
	 *
	 * @author SAP SE
	 * @version 1.60.42
	 *
	 * @constructor
	 * @private
	 * @since 1.43
	 * @experimental Since 1.43. This class is experimental and provides only limited functionality. Also the API might be
	 *               changed in future.
	 */
	var SwitchContextProvider = BaseContextProvider.extend("sap.ui.fl.context.SwitchContextProvider", {
		metadata : {
			properties : {
				text : {
					type : "String",
					defaultValue : "Switch"
				},
				description : {
					type : "String",
					defaultValue : "Returns the values of switches received in the flexibility response from the back end"
				}
			}
		}
	});

	SwitchContextProvider.prototype.loadData = function() {
		return Promise.resolve(Cache.getSwitches());
	};

	SwitchContextProvider.prototype.getValueHelp = function() {
		return Promise.resolve({});
	};

	SwitchContextProvider.prototype.validate = function(sKey, vValue) {
		return Promise.resolve(true);
	};

	return SwitchContextProvider;

}, /* bExport= */true);
