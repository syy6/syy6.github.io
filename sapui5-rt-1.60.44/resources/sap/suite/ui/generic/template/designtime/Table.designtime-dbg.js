sap.ui.define(["sap/ui/fl/changeHandler/ChangeHandlerMediator",
		"sap/suite/ui/generic/template/designtime/library.designtime"],
	function(ChangeHandlerMediator) {
		"use strict";

		var oResourceBundle = sap.ui.getCore().getModel("i18nDesigntime").getResourceBundle();

		var oTableDesigntime = {

			/**
			 * Gets the propagated and redefined designtime for a sap.m.Table element, as presented in a list report.
			 *
			 * @param {object} oElement The current UI element which must me sap.m.Table
			 * @returns {object} designtime metadata, with embedded functions
			 * @public
			 */
			getDesigntime: function(oElement) {
				return {
					/* properties: {
						tableType: {   //deactivated, as late feature
							virtual: true,
							ignore: false,
							type: "string",
							group: "header",
							defaultValue: "ResponsiveTable",
							proposedValue: "ResponsiveTable",
							possibleValues: {
								"AnalyticalTable": {
									displayName: "FE_ANALYTICAL_TABLE"
								},
								"GridTable": {
									displayName: "FE_GRID_TABLE"
								},
								"ResponsiveTable": {
									displayName: "FE_RESPONSIVE_TABLE"
								},
								"TreeTable": {
									displayName: "FE_TREE_TABLE"
								}
							},
							get: function(oElement) {
								var oComponent = Utils.getComponent(oElement);
                                var sTableType;
                                if (oComponent) {
                                    var oManifestSettings = Utils.getManifestSettings(oComponent);
                                    if (oManifestSettings.tableType) {
                                        sTableType = oManifestSettings.tableType;
                                    } else if (oManifestSettings.treeTable) {
                                        sTableType = "TreeTable";
                                    } else if (oManifestSettings.gridTable) {
                                        sTableType = "GridTable";
                                    } else if (Utils.getOdataEntityType(oComponent) && Utils.getOdataEntityType(oComponent)["sap:semantics"] === "aggregate") {
                                        sTableType = "AnalyticalTable";
                                    }
                                }
                                return sTableType;
							},
							set: function(oElement, sValue) {
								// via dt change, or on tool level
								/*var oComponent = Utils.getComponent(oElement);
                                if (oComponent) {
                                    var oManifestSettings = ManifestHandler.getSettings(oComponent);
                                    oManifestSettings.tableType = sValue;
                                    ManifestHandler.setSettings(oComponent, oManifestSettings);
                                }
							}
						}
					}, */
					name: {
						singular: function() {
							return oResourceBundle.getText("FE_TABLE");
						}
					},
					links: {
						guidelines: [{
							href: "/table-overview/",
							text: function() {
								return oResourceBundle.getText("FE_TABLE_GUIDE");
							}
						}]
					},
					aggregations: {
						items: {
							ignore: true
						},
						/*headerToolbar: {
							ignore: true
						},*/
						infoToolbar: {
							ignore: true
						},
						columns: {
							actions: {
								// example of a change that allows moving child controls inside this aggregation
								// the changeType "moveTableColumns" has to be defined in flexibilty.js
								move: "moveTableColumns",
								addODataProperty: function() {
									var mChangeHandlerSettings = ChangeHandlerMediator.getAddODataFieldSettings(oElement);
									if (mChangeHandlerSettings) {
										mChangeHandlerSettings.content.requiredLibraries = "";
										return {
											changeType: "addTableColumn",
											changeOnRelevantContainer: true,
											changeHandlerSettings: mChangeHandlerSettings
										};
									} else {
										return {
											changeType: "addTableColumn",
											changeOnRelevantContainer: true
										};
									}
								}
							}
						}
					}
				};
			}
		};

		return oTableDesigntime;
	});
