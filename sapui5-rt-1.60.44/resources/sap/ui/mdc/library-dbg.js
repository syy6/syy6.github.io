/*!
 * SAP UI development toolkit for HTML5 (SAPUI5)

		(c) Copyright 2009-2018 SAP SE. All rights reserved
	
 */

/**
 * Initialization Code and shared classes of library sap.ui.mdc.
 */
sap.ui.define(['sap/ui/mdc/XMLComposite', 'sap/ui/core/util/XMLPreprocessor', 'sap/ui/base/SyncPromise'],
	function(XMLComposite, XMLPreprocessor, SyncPromise) {
		"use strict";

		/**
		 * UI5 library: sap.ui.mdc containing controls that can be easily connected to rest service based models providing metadata.
		 *
		 * @namespace
		 * @name sap.ui.mdc
		 * @author SAP SE
		 * @version 1.60.42
		 * @public
		 */

		sap.ui.getCore().initLibrary({
			version: "1.60.42",
			name: "sap.ui.mdc",
			dependencies: ["sap.ui.core", "sap.m"],
			designtime: "sap/ui/mdc/designtime/library.designtime",
			types: ["sap.ui.mdc.TableType", "sap.ui.mdc.SelectionMode", "sap.ui.mdc.TableRowAction", "sap.ui.mdc.FieldDisplay", "sap.ui.mdc.EditMode"],
			interfaces: [],
			controls: [
				"sap.ui.mdc.Table",
				"sap.ui.mdc.FilterBar",
				"sap.ui.mdc.base.Field",
				"sap.ui.mdc.base.FieldBase",
				"sap.ui.mdc.base.FilterField",
				"sap.ui.mdc.odata.v4.microchart.MicroChart",
				"sap.ui.mdc.base.info.Panel"],
			elements: [
				"sap.ui.mdc.Column",
				"sap.ui.mdc.base.FieldHelpBase",
				"sap.ui.mdc.base.FieldInfoBase",
				"sap.ui.mdc.base.CustomFieldHelp",
				"sap.ui.mdc.base.CustomFieldInfo",
				"sap.ui.mdc.base.ListFieldHelp",
				"sap.ui.mdc.base.TableFieldHelp"
			],
			extensions: {
				flChangeHandlers: {
					"sap.ui.mdc.Table": "sap/ui/mdc/Table",
					"sap.ui.mdc.FilterBar": "sap/ui/mdc/internal/filterbar/FilterBar",
					"sap.ui.mdc.base.info.PanelItem": "sap/ui/mdc/base/info/flexibility/PanelItem",
					"sap.ui.mdc.base.info.Panel": "sap/ui/mdc/base/info/flexibility/Panel"
				}
			},
			noLibraryCSS: false
		});

		/* eslint-disable no-undef */
		/**
		 * The SAPUI5 MDC library. Contains the metadata driven controls and elements.
		 *
		 * @namespace
		 * @alias sap.ui.mdc
		 * @author SAP SE
		 * @version 1.60.42
		 * @public
		 */
		var thisLib = sap.ui.mdc;
		/* eslint-enable no-undef */

		/**
		 * Defines the type of the table.
		 *
		 * @enum {string}
		 * @private
		 * @since 1.58
		 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
		 */
		thisLib.TableType = {
			/**
			 * Grid Table (sap.ui.table.Table) control is used (default)
			 *
			 * @public
			 */
			Table: "Table",
			/**
			 * Responsive Table (sap.m.Table) control is used.
			 *
			 * @public
			 */
			ResponsiveTable: "ResponsiveTable"
		};

		/**
		 * Defines the mode of the table.
		 *
		 * @enum {string}
		 * @private
		 * @since 1.58
		 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
		 */
		thisLib.SelectionMode = {
			/**
			 * No rows/items can be selected (Default).
			 * @public
			 */
			None : "None",
			/**
			 * One row/item can be selected at a time.
			 * @public
			 */
			Single : "Single",
			/**
			 * Multiple rows/items can be selected at a time.
			 * @public
			 */
			Multi : "Multi"
		};

		/**
		 * Defines the actions that can be used in the table.
		 *
		 * @enum {string}
		 * @private
		 * @since 1.60
		 * @ui5-metamodel This enumeration also will be described in the UI5 (legacy) designtime metamodel
		 */
		thisLib.RowAction = {
			/**
			 * Navigation arrow (chevron) will be shown in the table rows/items.
			 *
			 * @public
			 */
			Navigation: "Navigation"
		};

		/**
		 * Defines how the fields display text should be formatted.
		 *
		 * @enum {string}
		 * @private
		 * @since 1.48.0
		 */
		thisLib.FieldDisplay = {
			/**
			 * Only the value is displayed
			 * @public
			 */
			Value: "Value",
			/**
			 * Only the description is displayed
			 *
			 * if a <code>FieldHelp</code> is assigned to the <code>Field</code> the value is used as key for the <code>FieldHelp</code> items.
			 * @public
			 */
			Description: "Description",
			/**
			 * The value and the description is displayed in the field. The description is displayed after the value with brackets.
			 * @public
			 */
			ValueDescription: "ValueDescription",
			/**
			 * The description and the value is displayed in the field. The value is displayed after the description with brackets.
			 * @public
			 */
			DescriptionValue: "DescriptionValue"
		};

		/**
		 * Defines in what mode Filds are rendered
		 *
		 * @enum {string}
		 * @private
		 * @since 1.48.1
		 */
		thisLib.EditMode = {
			/**
			 * Field is rendered in display mode
			 * @public
			 */
			Display: "Display",
			/**
			 * Field is rendered editable
			 * @public
			 */
			Editable: "Editable",
			/**
			 * Field is rendered readonly
			 * @public
			 */
			ReadOnly: "ReadOnly",
			/**
			 * Field is rendered disabled
			 * @public
			 */
			Disabled: "Disabled"
		};

		/**
		 * Metadata Context will appear as a binding to visitAttributes as it starts with
		 * '{' (curly braces). So we need to hide this for the preprocessor, take metadataContext
		 * out here, before visitAttributes and add it after
		 *
		 * @param {object} oNode the node
		 * @param {object} oVisitor the visitor
		 * @returns {object} SyncPromise
		 */
		function visitAttibutesIgnoringMetadataContext(oNode, oVisitor) {
			var vValue = oNode.getAttribute('metadataContexts');
			if (vValue) {
				oNode.removeAttribute('metadataContexts');
			}
			return SyncPromise.resolve(oVisitor.visitAttributes(oNode))
			.then(function () {
				if (vValue) {
					oNode.setAttribute('metadataContexts', vValue);
				}
			});
		}

		/**
		 * Convenience function for registration of the controls to the XMLPreprocessor
		 *
		 * This function is called by the XMLPreprocessor. 'this' is used to remember
		 * the name of the control. So always create a new function via bind("name.of.control")
		 * @param {object} oNode the node
		 * @param {object} oVisitor the visitor
		 * @returns {object|undefined} SyncPromise or undefined
		 */
		function pluginTemplate(oNode, oVisitor) {
			var that = this, oPromise =	visitAttibutesIgnoringMetadataContext(oNode, oVisitor)
			.then(function () {
				return XMLComposite.initialTemplating(oNode, oVisitor, that);
			})
			.then(function () {
				//TODO: metadataContext shouldn't remain after templating. Maybe something for XMLComposite
				oNode.removeAttribute('metadataContexts');
			});
			return oVisitor.find ? oPromise : undefined;
		}

		function replacePlugin(oNode, oVisitor) {
			var sourceElementPath = oNode.getAttribute('withChildrenOf'),
				aContent = sourceElementPath && oVisitor.getContext(sourceElementPath).getObject().oModel.oData.children,
				oParent = oNode.parentElement;
			// move all content elements to the parent
			for (var i = aContent.length; i > 0; i--) {
				oParent.appendChild(aContent[i - 1]);
			}
			// remove the "Replace" element
			oParent.removeChild(oNode);
			//in case of a promise the children are perhaps not visited
			return oVisitor.find ? SyncPromise.resolve() : undefined;
		}

		XMLPreprocessor.plugIn(pluginTemplate.bind("sap.ui.mdc.odata.v4.microchart.MicroChart"), "sap.ui.mdc.odata.v4.microchart", "MicroChart");
		XMLPreprocessor.plugIn(pluginTemplate.bind("sap.ui.mdc.FilterField"), "sap.ui.mdc", "FilterField");
		XMLPreprocessor.plugIn(pluginTemplate.bind("sap.ui.mdc.FilterBar"), "sap.ui.mdc", "FilterBar");
		XMLPreprocessor.plugIn(replacePlugin, "sap.ui.mdc", "Replace");

		return thisLib;

	});
