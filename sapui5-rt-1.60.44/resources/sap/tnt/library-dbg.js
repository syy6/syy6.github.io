/*!
 * UI development toolkit for HTML5 (OpenUI5)
 * (c) Copyright 2009-2018 SAP SE or an SAP affiliate company.
 * Licensed under the Apache License, Version 2.0 - see LICENSE.txt.
 */

/**
 * Initialization Code and shared classes of library sap.tnt.
 */
sap.ui.define(["sap/ui/base/DataType", "sap/ui/core/library", "sap/m/library"],
	function(DataType) {
	"use strict";

	/**
	 * SAPUI5 library with controls specialized for administrative applications.
	 *
	 * @namespace
	 * @name sap.tnt
	 * @author SAP SE
	 * @version 1.60.42
	 * @public
	 */

	// delegate further initialization of this library to the Core
	sap.ui.getCore().initLibrary({
		name : "sap.tnt",
		version: "1.60.42",
		dependencies : ["sap.ui.core", "sap.m"],
		types: [
			"sap.tnt.RenderMode",
			"sap.tnt.BoxContainerLayoutConfiguration"
		],
		interfaces: [],
		controls: [
			"sap.tnt.NavigationList",
			"sap.tnt.ToolHeaderUtilitySeparator",
			"sap.tnt.ToolHeader",
			"sap.tnt.SideNavigation",
			"sap.tnt.ToolPage",
			"sap.tnt.InfoLabel",
			"sap.tnt.BoxContainer",
			"sap.tnt.Box"
		],
		elements: [
			"sap.tnt.NavigationListItem"
		]
	});

	/**
	 * Predefined types of <code>InfoLabel</code>
	 *
	 * @enum {string}
	 * @public
	 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
	 */
	sap.tnt.RenderMode = {
		/**
		 * When type of the content of <code>InfoLabel</code> is numeric paddings are narrow
		 * @public
		 */
		Narrow: "Narrow",

		/**
		 * When type of the content of <code>InfoLabel</code> is text padding are loose
		 * @public
		 */
		Loose: "Loose"
	};

	sap.tnt.BoxesPerRowConfig = DataType.createType("sap.tnt.BoxesPerRowConfig", {
			isValid : function(vValue) {
				return /^(([Xx][Ll](?:[1-9]|1[0-2]))? ?([Ll](?:[1-9]|1[0-2]))? ?([Mm](?:[1-9]|1[0-2]))? ?([Ss](?:[1-9]|1[0-2]))?)$/.test(vValue);
			}
		},
		DataType.getType("string")
	);

	return sap.tnt;

});