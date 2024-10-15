sap.ui.define([
	"jquery.sap.global",
	"sap/suite/ui/commons/library",
	"sap/ui/core/Control",
	"sap/ui/core/delegate/ItemNavigation",
	"./TAccountGroup",
	"sap/ui/core/IconPool",
	"sap/ui/core/Icon",
	"sap/base/security/encodeXML",
	"./TAccountUtils",
	"sap/ui/thirdparty/jqueryui/jquery-ui-core",
	"sap/ui/thirdparty/jqueryui/jquery-ui-widget",
	"sap/ui/thirdparty/jqueryui/jquery-ui-mouse",
	"sap/ui/thirdparty/jqueryui/jquery-ui-draggable",
	"sap/ui/thirdparty/jqueryui/jquery-ui-droppable",
	"sap/ui/thirdparty/jqueryui/jquery-ui-selectable"
], function (jQuery, library, Control, ItemNavigation, TAccountGroup, IconPool, Icon, encodeXML, TAccountUtils) {
	"use strict";

	var oResourceBundle = sap.ui.getCore().getLibraryResourceBundle("sap.suite.ui.commons");

	var Direction = Object.freeze({
		UP: "UP",
		DOWN: "DOWN",
		PREVIOUS: "PREVIOUS",
		NEXT: "NEXT"
	});

	/**
	 * Constructor for a new TAccount.
	 *
	 * @param {string} [sId] ID for the new control, generated automatically if no ID is given
	 * @param {object} [mSettings] Initial settings for the new control
	 *
	 * @class
	 * The T account control displays debit and credit entries on a general ledger account.
	 * It can be used to visualize the flow of transactions through the accounts where these transactions are stored.
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
	 * @alias sap.suite.ui.commons.taccount.TAccount
	 * @see {@link topic:fe6792fa673c4b0fba91d35fd6493c86 T Account}
	 * @ui5-metamodel This control/element will also be described in the UI5 (legacy) design time metamodel.
	 */
	var TAccount = Control.extend("sap.suite.ui.commons.taccount.TAccount", {
		metadata: {
			library: "sap.suite.ui.commons",
			properties: {
				/**
				 * Unit of measurement. Can be set to a currency or any other applicable unit of measurement.<br>
				 * Please note that if multi-currency accounts are used, the T account control will not
				 * convert the values to the currency defined in this property.
				 */
				measureOfUnit: {type: "string", group: "Misc", defaultValue: ""},
				/**
				 * Defines whether the T account should appear as collapsed.<br>By default, it appears as expanded.
				 */
				collapsed: {type: "boolean", group: "Misc", defaultValue: false},
				/**
				 * Title of the T account.
				 */
				title: {type: "string", group: "Misc", defaultValue: null},
				/**
				 * Subtitle of the T account.
				 */
				subtitle: {type: "string", group: "Misc", defaultValue: null}
			},
			aggregations: {
				/**
				 * Debit entries.
				 */
				debit: {
					type: "sap.suite.ui.commons.taccount.TAccountItem", multiple: true, singularName: "debit"
				},
				/**
				 * Credit entries.
				 */
				credit: {
					type: "sap.suite.ui.commons.taccount.TAccountItem", multiple: true, singularName: "credit"
				}

			}
		},
		renderer: function (oRm, oAccount) {
			var fnWriteColumn = function (aItems, bIsDebit) {
				aItems.forEach(function (oItem) {
					oItem._bIsDebit = bIsDebit;
					oRm.renderControl(oItem);
				});
			};

			oRm.write("<div");
			if (oAccount.getCollapsed()) {
				oRm.addClass("sapSuiteUiCommonsAccountCollapsed");
			}
			oRm.addClass("sapSuiteUiCommonsAccount");
			oRm.writeClasses(oAccount);
			oRm.writeControlData(oAccount);
			oRm.writeAttributeEscaped("aria-label", oAccount._getAriaLabelText());
			oRm.writeAttribute("tabindex", "0");
			oRm.write(">");


			oRm.write("<div class=\"sapSuiteUiCommonsTAccountInfoIconWrapper sapSuiteUiCommonsTAccountBaseInfoIconWrapper\" title=\"" + oResourceBundle.getText("TACCOUNT_SELECTED") + "\">");
			oRm.write("<div class=\"sapSuiteUiCommonsInfoIcon\">");

			oRm.write("!");

			oRm.write("</div>");
			oRm.write("</div>");

			// header
			oRm.write("<div class=\"sapSuiteUiCommonsAccountHeader\">");
			oRm.write("<div class=\"sapSuiteUiCommonsAccountHeaderFirst\">");
			oRm.write("<div");
			oRm.addClass("sapSuiteUiCommonsAccountHeaderExpandWrapper");
			if (oAccount.getSubtitle()) {
				oRm.addClass("sapSuiteUiCommonsAccountHeaderExpandWrapperTopAlign");
			}
			oRm.writeClasses();
			oRm.write(">");
			oRm.renderControl(oAccount._getDownArrow());
			oRm.write("</div>");

			var sTitleValue = encodeXML(oAccount.getTitle()).replace(/&#xa;|\n/g, "<br>");
			if (oAccount.getSubtitle()) {
				var sSubtitleValue = encodeXML(oAccount.getSubtitle()).replace(/&#xa;|\n/g, "<br>");
				oRm.write("<div class=\"sapSuiteUiCommonsAccountHeaderTitleWrapper\">");
				oRm.write("<div class=\"sapSuiteUiCommonsAccountHeaderTitleWithSubtitle\">" + sTitleValue + "</div>");
				oRm.write("<div class=\"sapSuiteUiCommonsAccountHeaderSubtitle\">" + sSubtitleValue + "</div>");
				oRm.write("</div>");
			} else {
				oRm.write("<span class=\"sapSuiteUiCommonsAccountHeaderTitle\">" + sTitleValue + "</span>");
			}

			oRm.write("</div>");
			oRm.write("<div class=\"sapSuiteUiCommonsAccountHeaderSecond\">");
			oRm.write("<span id=\"" + oAccount.getId() + "-sum\" class=\"sapSuiteUiCommonsAccountHeaderSUM\">" + oAccount._getSumText() + "</span>");
			oRm.write("</div>");
			oRm.write("</div>");

			// sub-header
			oRm.write("<div id=\"" + oAccount.getId() + "-content" + "\" class=\"sapSuiteUiCommonsAccountTWrapper\"");
			if (oAccount.getCollapsed()) {
				oRm.write("style=\"display:none\"");
			}

			oRm.write(">");
			oRm.write("<div class=\"sapSuiteUiCommonsAccountTHeader\">");
			oRm.write("<span class=\"sapSuiteUiCommonsAccountTHeaderTitle\">" + oResourceBundle.getText("TACCOUNT_DEBIT") + "</span>");
			oRm.write("<span class=\"sapSuiteUiCommonsAccountTHeaderTitle\">" + oResourceBundle.getText("TACCOUNT_CREDIT") + "</span>");
			oRm.write("</div>");

			// body
			oRm.write("<div class=\"sapSuiteUiCommonsAccountTBody\"");
			oRm.writeAttribute("role", "listbox");
			oRm.write(">");

			oRm.write("<div class=\"sapSuiteUiCommonsAccountDebit\">");
			fnWriteColumn(oAccount.getDebit(), true);
			oRm.write("</div>");
			oRm.write("<div class=\"sapSuiteUiCommonsAccountCredit\">");
			fnWriteColumn(oAccount.getCredit(), false);
			oRm.write("</div>");

			oRm.write("</div>");
			oRm.write("</div>");
			oRm.write("</div>");
		}
	});

	/* =========================================================== */
	/* Events													   */
	/* =========================================================== */
	TAccount.prototype.onBeforeRendering = function () {
		this._bRendered = false;
	};

	TAccount.prototype.onAfterRendering = function () {
		this._bRendered = true;

		this._setupDraggable();
		this._setupKeyboard();
	};

	TAccount.prototype.onsapdownmodifiers = function (oEvent) {
		if (oEvent.ctrlKey) {
			this._handleArrowMoveEvent(oEvent, Direction.DOWN);
		}
	};

	TAccount.prototype.onsapupmodifiers = function (oEvent) {
		if (oEvent.ctrlKey) {
			this._handleArrowMoveEvent(oEvent, Direction.UP);
		}
	};

	TAccount.prototype.onsappreviousmodifiers = function (oEvent) {
		if (oEvent.ctrlKey) {
			this._handleArrowMoveEvent(oEvent, Direction.PREVIOUS);
		}
	};

	TAccount.prototype.onsapnextmodifiers = function (oEvent) {
		if (oEvent.ctrlKey) {
			this._handleArrowMoveEvent(oEvent, Direction.NEXT);
		}
	};

	/* =========================================================== */
	/* Private methods											   */
	/* =========================================================== */
	TAccount.prototype._setupKeyboard = function () {
		if (!this._oItemNavigation) {
			this._oItemNavigation = new ItemNavigation();
			this.addDelegate(this._oItemNavigation);
		}

		this._oItemNavigation.setRootDomRef(this.$().find(".sapSuiteUiCommonsAccountTBody")[0]);
		this._oItemNavigation.setItemDomRefs(this.$().find(".sapSuiteUiCommonsAccountItem"));
		this._oItemNavigation.setCycling(true);
	};

	TAccount.prototype._isInGroup = function () {
		return this.getParent() instanceof TAccountGroup;
	};

	TAccount.prototype._setupDraggable = function () {
		if (this._isInGroup()) {
			var $this = this.$(),
				oParent = this.getParent();

			// check whether parent is group
			$this.draggable({
				revert: "invalid",
				delay: 100,
				helper: function () {
					return $this.clone().width($this.width()).css("z-index", 500);
				},
				opacity: 0.6,
				scope: oParent.getId() + "-content",
				handle: ".sapSuiteUiCommonsAccountHeader",
				start: function () {
					$this.addClass("sapSuiteUiCommonsAccountItemDragging");
					oParent.$().find(".sapSuiteUiCommonsAccountGroupDroppingArea").addClass("sapSuiteUiCommonsAccountGroupDroppingAreaHighlight");
				},
				stop: function () {
					$this.removeClass("sapSuiteUiCommonsAccountItemDragging");
					oParent.$().find(".sapSuiteUiCommonsAccountGroupDroppingArea").removeClass("sapSuiteUiCommonsAccountGroupDroppingAreaHighlight");
				}
			});
		}
	};

	TAccount.prototype._getDownArrow = function () {
		if (!this._oArrowDown) {
			this._oArrowDown = new Icon({
				src: "sap-icon://navigation-down-arrow",
				press: function () {
					this.setCollapsed(!this.getCollapsed());
				}.bind(this)
			}).addStyleClass("sapSuiteUiCommonsAccountGroupCollapseIcon");
		}

		return this._oArrowDown;
	};

	TAccount.prototype._getSum = function () {
		if (!this._iSum) {
			var iSum = 0;
			this.getCredit().forEach(function (oItem) {
				iSum += oItem.getValue();
			});

			this.getDebit().forEach(function (oItem) {
				iSum -= oItem.getValue();
			});

			this._iSum = iSum;
		}

		return this._iSum;
	};

	TAccount.prototype._getAriaLabelText = function () {
		return "T account " + this.getTitle() + " " + this._getSumText();
	};

	TAccount.prototype._getSumText = function () {
		var sCurrency = this.getMeasureOfUnit(),
			sValue = TAccountUtils.formatCurrency(Math.abs(this._getSum()), sCurrency);

		return (this._getSum() > 0 ? oResourceBundle.getText("TACCOUNT_CREDIT") : oResourceBundle.getText("TACCOUNT_DEBIT")) + ": " + sValue + " " + encodeXML(sCurrency);
	};

	TAccount.prototype._valueChanged = function (iDiff) {
		if (this._bRendered) {
			this._iSum = this._getSum() + iDiff;
			this.$("sum").text(this._getSumText());

			var oParent = this.getParent();
			if (this._hasGroupParent(oParent)) {
				oParent._valueChanged(iDiff);
			}
		}
	};

	TAccount.prototype._hasGroupParent = function (oParent) {
		return (oParent || this.getParent()) instanceof TAccountGroup;
	};

	TAccount.prototype._handleArrowMoveEvent = function (oEvent, oDirection) {
		this._moveTAccount(oDirection);

		// stop ItemNavigation and stop previous/next arrow event that is fired after up/down arrow event
		oEvent.preventDefault();
		oEvent.stopImmediatePropagation();
	};

	TAccount.prototype._moveTAccount = function (oDirection) {
		var $dropArea, $nextAccount, $nextGroup, aMoveFunctionSet,
			bIsDirectionUp = oDirection === Direction.UP,
			bSetFocus = true,
			$this = this.$();

		var fnMoveToGroup = function (sAddFunction) {
			if ($nextGroup.length === 0) {
				bSetFocus = false;
				return;
			}

			$this.detach();
			$dropArea.detach();
			$nextGroup[sAddFunction]($this);
			$nextGroup[sAddFunction]($dropArea);
		};

		if (bIsDirectionUp || oDirection === Direction.DOWN) {
			aMoveFunctionSet = bIsDirectionUp ? ["next", "prev", "insertBefore", "append"] : ["prev", "next", "insertAfter", "prepend"];
			$dropArea = $this[aMoveFunctionSet[0]](".sapSuiteUiCommonsAccountGroupDroppingArea");
			$nextAccount = $this[aMoveFunctionSet[1]]()[aMoveFunctionSet[1]](".sapSuiteUiCommonsAccount");

			if ($nextAccount.length !== 0) {
				$this.detach()[aMoveFunctionSet[2]]($nextAccount);
				$dropArea.detach()[aMoveFunctionSet[2]]($nextAccount);
			} else {
				$nextGroup = $this.parent()[aMoveFunctionSet[1]](".sapSuiteUiCommonsAccountGroupColumn");
				fnMoveToGroup(aMoveFunctionSet[3]);
			}
		} else {
			$dropArea = $this.prev(".sapSuiteUiCommonsAccountGroupDroppingArea");
			$nextGroup = $this.parent()[oDirection === Direction.NEXT ? "next" : "prev"](".sapSuiteUiCommonsAccountGroupColumn");
			fnMoveToGroup("append");
		}

		if (bSetFocus) {
			// set correct focus order
			this.getParent()._setupKeyboard();
			$this.focus();
		}
	};

	/* =========================================================== */
	/* Properties												   */
	/* =========================================================== */
	TAccount.prototype.setCollapsed = function (bValue) {
		this.setProperty("collapsed", bValue, true);

		this._getDownArrow().setSrc(!bValue ? "sap-icon://navigation-down-arrow" : "sap-icon://navigation-right-arrow");
		this.$()[bValue ? "addClass" : "removeClass"]("sapSuiteUiCommonsAccountCollapsed");

		if (this.getDomRef()) {
			this.$("content")[bValue ? "hide" : "show"]("medium");
		}
	};

	return TAccount;

}, /* bExport= */ true);
