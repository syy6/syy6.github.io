sap.ui.define([
	"sap/suite/ui/generic/template/changeHandler/AddGroup",
	"sap/suite/ui/generic/template/changeHandler/MoveGroup",
	"sap/suite/ui/generic/template/changeHandler/RemoveGroup",
	"sap/suite/ui/generic/template/changeHandler/AddSection",
	"sap/suite/ui/generic/template/changeHandler/AddGroupElement",
	"sap/suite/ui/generic/template/changeHandler/MoveGroupElement",
	"sap/suite/ui/generic/template/changeHandler/RemoveGroupElement",
	"sap/suite/ui/generic/template/changeHandler/RemoveSection",
	"sap/suite/ui/generic/template/changeHandler/MoveSection",
	"sap/suite/ui/generic/template/changeHandler/AddHeaderActionButton",
	"sap/suite/ui/generic/template/changeHandler/MoveHeaderAndFooterActionButton",
	"sap/suite/ui/generic/template/changeHandler/RemoveHeaderAndFooterActionButton",
	"sap/suite/ui/generic/template/changeHandler/AddFooterActionButton"
],

	function(AddGroup, MoveGroup, RemoveGroup, AddSection, AddGroupElement, MoveGroupElement, RemoveGroupElement, RemoveSection, MoveSection, AddHeaderActionButton, MoveHeaderAndFooterActionButton, RemoveHeaderAndFooterActionButton, AddFooterActionButton) {
	"use strict";
	return {
		"addGroup": AddGroup,
		"moveGroup": MoveGroup,
		"removeGroup": RemoveGroup,
		"addSection": AddSection,
		"addGroupElement": AddGroupElement,
		"moveGroupElement": MoveGroupElement,
		"removeGroupElement": RemoveGroupElement,
		"removeSection": RemoveSection,
		"moveSection": MoveSection,
		"addHeaderActionButton": AddHeaderActionButton,
		"moveHeaderAndFooterActionButton": MoveHeaderAndFooterActionButton,
		"removeHeaderAndFooterActionButton": RemoveHeaderAndFooterActionButton,
		"addFooterActionButton": AddFooterActionButton
	};
}, /* bExport= */ true);
