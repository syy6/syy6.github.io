/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */
/**
 * Adds support rules of the sap.m library to the support infrastructure.
 */
sap.ui.define([
	"./rules/SmartForm.support",
	"./rules/SmartLink.support",
	"./rules/SmartFilterBar.support",
	"./rules/SmartTable.support"
], function(SmartFormSupport, SmartLinkSupport, SmartFilterBarSupport, SmartTableSupport) {
	"use strict";

	return {
		name: "sap.ui.comp",
		niceName: "UI5 Smart Controls Library",
		ruleset: [
			SmartFormSupport, SmartLinkSupport, SmartFilterBarSupport, SmartTableSupport
		]
	};

}, true);
