sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/commons/library",
	"sap/ui/core/Control",
	"sap/ui/core/theming/Parameters",
	"./TAccountPanel",
	"sap/ui/core/IconPool",
	"sap/ui/core/Icon",
	"sap/m/Button",
	"sap/base/security/encodeXML",
	"sap/ui/core/Configuration",
	"sap/ui/core/delegate/ItemNavigation",
	"./TAccountUtils"
], function (jQuery, library, Control, Parameters, TAccountPanel, IconPool, Icon, Button, encodeXML, Configuration, ItemNavigation, TAccountUtils) {
	"use strict";

	var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons");

	/**
	 * Constructor for a new TAccountGroup.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * The T account group control displays debit and credit entries for all {@link sap.suite.ui.commons.TAccount}
	 * controls included in the group.
	 *
	 * @extends sap.ui.core.Control
	 *
	 * @author SAP SE
	 * @version 1.60.12
	 * @since 1.58.0
	 *
	 * @constructor
	 * @public
	 *
	 * @alias sap.suite.ui.commons.taccount.TAccountGroup
	 * @ui5-metamodel This control/element will also be described in the UI5 (legacy) design time metamodel.
	 */
	var TAccountGroup = Control.extend("sap.suite.ui.commons.taccount.TAccountGroup", {
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * Title of the group.
				 */
				title: {type: "string", group: "Misc", defaultValue: null},
				/**
				 * Defines whether the group should appear as collapsed. By default, it appears as expanded.
				 */
				collapsed: {type: "boolean", group: "Misc", defaultValue: false}
			},
			aggregations: {
				/**
				 * T accounts included in the group.
				 */
				accounts: {
					type: "sap.suite.ui.commons.taccount.TAccount", multiple: true, singularName: "account"
				}
			},
			events: {}
		},
		renderer: function (oRm, oGroup) {
			if (!oGroup._bThemeApplied) {
				return;
			}

			oRm.write("<div");
			oRm.addClass("sapSuiteUiCommonsAccountGroup");

			if (oGroup.getCollapsed()) {
				oRm.addClass("sapSuiteUiCommonsAccountGroupCollapsed");
			}

			oRm.writeClasses(oGroup);
			oRm.writeControlData(oGroup);
			oRm.writeAttributeEscaped("aria-label", oGroup._getSum());
			oRm.write(">");

			// header
			oRm.write("<div class=\"sapSuiteUiCommonsGroupHeader\">");
			oRm.write("<div class=\"sapSuiteUiCommonsGroupHeaderExpandWrapper\">");
			oRm.renderControl(oGroup._getExpandCollapse());
			oRm.write("</div>");

			oRm.write("<div class=\"sapSuiteUiCommonsGroupHeaderFirst\">");
			oRm.write("<span class=\"sapSuiteUiCommonsGroupHeaderTitle\">" + encodeXML(oGroup.getTitle()) + "</span>");
			oRm.write("<span id=\"" + oGroup.getId() + "-sum\" class=\"sapSuiteUiCommonsGrouptHeaderSUM\">" + oGroup._getSumText() + "</span>");

			oRm.write("<div id=\"\" class=\"sapSuiteUiCommonsGroupInfoIconWrapper sapSuiteUiCommonsTAccountBaseInfoIconWrapper\" title=\"" + oResourceBundle.getText("TACCOUNT_SELECTED") + "\">");
			oRm.write("<span class=\"sapSuiteUiCommonsInfoIcon\">");
			oRm.write("!");
			oRm.write("</span>");
			oRm.write("</div>");

			oRm.write("</div>");
			oRm.write("<div class=\"sapSuiteUiCommonsGroupHeaderSecond\">");
			oRm.renderControl(oGroup._getExpandAllAccounts());
			oRm.renderControl(oGroup._getCollapseAllAccounts());
			oRm.write("</div>");
			oRm.write("</div>");


			oRm.write("<div id=\"" + oGroup.getId() + "-content\" class=\"sapSuiteUiCommonsAccountGroupContent\">");

			oGroup.getAccounts().forEach(function (oItem) {
				oRm.renderControl(oItem);
			});

			oRm.write("</div>");
			oRm.write("</div>");
		}
	});

	/* =========================================================== */
	/* Events													   */
	/* =========================================================== */
	TAccountGroup.prototype.init = function () {
		sap.ui.getCore().attachThemeChanged(function () {
			this._bThemeApplied = true;
			this.invalidate();
		}, this);

		this._bThemeApplied = sap.ui.getCore().isThemeApplied();

		jQuery(window).resize(function () {
			this._adjustUI();
		}.bind(this));
	};

	TAccountGroup.prototype.exit = function () {
		if (this._oIconExpand) {
			this._oIconExpand.destroy();
		}

		if (this._oIconCollapse) {
			this._oIconCollapse.destroy();
		}
	};

	TAccountGroup.prototype.onBeforeRendering = function () {
		this._oSum = null;
		this._iColumnCount = -1;
	};

	TAccountGroup.prototype.onAfterRendering = function () {
		this._adjustUI();
		this._setupKeyboard();
	};
	/* =========================================================== */
	/* Private methods											   */
	/* =========================================================== */
	TAccountGroup.prototype._setupKeyboard = function () {
		if (!this._oItemNavigation) {
			this._oItemNavigation = new ItemNavigation();
			this.addDelegate(this._oItemNavigation);
		}

		this._oItemNavigation.setRootDomRef(this.getDomRef("content"));
		this._oItemNavigation.setItemDomRefs(this.$().find(".sapSuiteUiCommonsAccount"));
		this._oItemNavigation.setCycling(true);
	};

	TAccountGroup.prototype._getExpandCollapse = function () {
		if (!this._oArrowDown) {
			this._oArrowDown = new Icon({
				src: "sap-icon://navigation-down-arrow",
				press: function () {
					this._expandCollapse();
				}.bind(this)
			});
		}

		return this._oArrowDown;
	};

	TAccountGroup.prototype._expandCollapse = function () {
		var bCollapsed = this.getCollapsed();

		this._oArrowDown.setSrc(bCollapsed ? "sap-icon://navigation-down-arrow" : "sap-icon://navigation-right-arrow");
		this.setProperty("collapsed", !bCollapsed, true);

		this.$("content")[bCollapsed ? "show" : "hide"]("medium");
		this.$()[!bCollapsed ? "addClass" : "removeClass"]("sapSuiteUiCommonsAccountGroupCollapsed");
	};

	TAccountGroup.prototype._expandCollapseAllAccounts = function (bExpand) {
		this.getAccounts().forEach(function (oAccount) {
			oAccount.setCollapsed(!!bExpand);
		});
	};

	TAccountGroup.prototype._getExpandAllAccounts = function () {
		if (!this._oIconExpand) {
			this._oIconExpand = new Button({
				icon: "sap-icon://expand-all",
				type: "Transparent",
				tooltip: oResourceBundle.getText("TACCOUNT_EXPAND"),
				press: this._expandCollapseAllAccounts.bind(this, false)
			}).addStyleClass("sapSuiteUiCommonsGroupHeaderIcon");
		}

		return this._oIconExpand;
	};

	TAccountGroup.prototype._getCollapseAllAccounts = function () {
		if (!this._oIconCollapse) {
			this._oIconCollapse = new Button({
				icon: "sap-icon://collapse-all",
				type: "Transparent",
				tooltip: oResourceBundle.getText("TACCOUNT_COLLAPSE"),
				press: this._expandCollapseAllAccounts.bind(this, true)
			}).addStyleClass("sapSuiteUiCommonsGroupHeaderIcon");
		}

		return this._oIconCollapse;
	};

	TAccountGroup.prototype._getSum = function () {
		var aAccounts = this.getAccounts(),
			iSum = 0,
			sMeasure = "",
			bCorrect = true;

		if (!this._oSum) {
			for (var i = 0; i < aAccounts.length; i++) {
				var oAccount = aAccounts[i];

				if (sMeasure && sMeasure !== oAccount.getMeasureOfUnit()) {
					bCorrect = false;
					break;
				}

				sMeasure = oAccount.getMeasureOfUnit();
				iSum += oAccount._getSum();
			}

			this._oSum = {
				sum: iSum,
				measure: sMeasure,
				correct: bCorrect
			};
		}

		return this._oSum;
	};

	TAccountGroup.prototype._getSumText = function () {
		var oSum = this._getSum();

		if (oSum && oSum.correct) {
			var sValue = TAccountUtils.formatCurrency(Math.abs(oSum.sum), oSum.measure);

			return (oSum.sum > 0 ? oResourceBundle.getText("TACCOUNT_CREDIT") : oResourceBundle.getText("TACCOUNT_DEBIT")) + ": " + sValue + " " + encodeXML(oSum.measure);
		}

		return "-";
	};

	TAccountGroup.prototype._getAriaText = function () {
		return "T Account Group " + encodeXML(this.getTitle()) + " " + this._getSumText();
	};

	TAccountGroup.prototype._adjustUI = function () {
		var COL_BASE_WIDTH = 320,
			SEPARATOR = 16,
			COL_WIDTH = COL_BASE_WIDTH + SEPARATOR;

		var $source = this.$("content"),
			iWidth = $source.width(),
			iColCount = Math.max(Math.ceil(iWidth / (COL_WIDTH)) - 1, 1);

		if (iColCount === this._iColumnCount) {
			return;
		}

		var $target = jQuery("<div id=\"" + this.getId() + "-content\" class=\"sapSuiteUiCommonsAccountGroupContent\"/>"),
			aHeights = Array.apply(null, Array(iColCount)).map(Number.prototype.valueOf, 0);

		var $accounts = this.$().find(".sapSuiteUiCommonsAccount"),
			iCol = 0;

		this._iColumnCount = iColCount;
		this._iDivs = [];

		var sDroppingArea = "<div class=\"sapSuiteUiCommonsAccountGroupDroppingArea\"><div class=\"sapSuiteUiCommonsAccountGroupDroppingAreaInner\">" +
			"</div><div class=\"sapSuiteUiCommonsAccountGroupDroppingAreaInnerBall\"></div></div>";

		for (var i = 0; i < iColCount; i++) {
			var sDiv = "<div class=\"sapSuiteUiCommonsAccountGroupColumn\">" + sDroppingArea + "</div>",
				$div = jQuery(sDiv);

			$target.append($div);
			this._iDivs.push($div);
		}

		for (var i = 0; i < $accounts.length; i++) {
			var $account = jQuery($accounts[i]),
				iCurrentHeight = $account.height(),
				$col = this._iDivs[iCol];

			var iMinHeight = Number.MAX_VALUE,
				iMinCol = 0;

			for (var k = 0; k < iColCount; k++) {
				var iColumnHeight = aHeights[k];

				if (iColumnHeight < iMinHeight) {
					iMinHeight = iColumnHeight;
					iMinCol = k;
				}
			}

			var $col = this._iDivs[iMinCol];
			$account.detach().appendTo($col);
			jQuery(sDroppingArea).appendTo($col);

			aHeights[iMinCol] += iCurrentHeight;
		}

		$source.detach();
		this.$().append($target);

		this._setupDroppable();
	};

	TAccountGroup.prototype._setupDroppable = function () {
		var aItems = this.$().find(".sapSuiteUiCommonsAccountGroupDroppingArea");
		aItems.droppable({
			scope: this.getId() + "-content",
			tolerance: "pointer",
			activeClass: "sapSuiteUiCommonsAccountGroupDroppingAreaActive",
			hoverClass: "sapSuiteUiCommonsAccountGroupDroppingAreaActive",
			drop: function (oEvent, ui) {
				var $droppingArea = jQuery(this),
					$item = ui.draggable,
					$zone = $item.next();

				// at least one zone must remain
				if ($zone[0] !== $droppingArea[0]) {
					$zone.detach().insertAfter($droppingArea);
					$item.detach().insertAfter($droppingArea);
				} else {
					$item.detach().insertBefore($droppingArea);
				}


				$item.css("left", 0);
				$item.css("top", 0);
			},
			over: function (event, ui) {
			}
		});
	};

	TAccountGroup.prototype._valueChanged = function (iDiff) {
		var oSum = this._getSum();
		if (oSum.correct) {
			this._oSum.sum += iDiff;
			this.$("sum").text(this._getSumText());
		}

		var oParent = this.getParent();
		if (this._hasPanelParent(oParent)) {
			oParent._valueChanged(iDiff);
		}
	};

	TAccountGroup.prototype._hasPanelParent = function (oParent) {
		return (oParent || this.getParent()) instanceof TAccountPanel;
	};

	return TAccountGroup;

}, /* bExport= */ true);
