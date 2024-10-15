/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

sap.ui.define(['sap/ui/fl/changeHandler/BaseRename'], function(BaseRename) {
	"use strict";

	/**
	 * Change handler for renaming a SmartForm group.
	 * @constructor
	 * @alias sap.ui.fl.changeHandler.RenameGroup
	 * @author SAP SE
	 * @version 1.60.42
	 * @experimental Since 1.27.0
	 */
	var RenameGroup = BaseRename.createRenameChangeHandler({
		propertyName : "label",
		changePropertyName : "groupLabel",
		translationTextType : "XFLD"
	});

	return RenameGroup;
},
/* bExport= */true);