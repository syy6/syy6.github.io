// Copyright (c) 2009-2017 SAP SE, All Rights Reserved

//Comparison Tile
sap.ui.define([
'sap/ui/core/mvc/JSView',
		'sap/ca/ui/model/format/NumberFormat',
		'sap/ui/model/analytics/odata4analytics',
		'sap/ushell/components/tiles/indicatorTileUtils/smartBusinessUtil'
	], function(JSView, NumberFormat, odata4analytics, smartBusinessUtil) {
	"use strict";
    /*global jQuery, sap */
    /*jslint nomen: true */

  //*eslint-disable no-warning-comments*/
  /*eslint-disable no-cond-assign*/
/*eslint-disable no-nested-ternary*/
/*eslint-disable no-unused-var*/
/*eslint-disable no-undef*/  /* likely indicates error */
/*eslint-disable no-inner-declarations*/
 /*eslint-disable block-scoped-var*/
  /*eslint-disable no-redeclare*/
  /*eslint-disable default-case*/
  /*eslint-disable new-cap*/
  /*eslint-disable valid-jsdoc*/
   /*eslint-disable no-unused-expressions*/
   /*eslint-disable camelcase*/
  /*eslint-disable no-lonely-if*/
   /*eslint-disable no-mixed-spaces-and-tabs*/
    
    sap.ui.getCore().loadLibrary("sap.suite.ui.microchart");

    sap.ui.jsview("tiles.indicatorDualContribution.DualContribution", {
        getControllerName: function () {
            return "tiles.indicatorDualContribution.DualContribution";
        },
        createContent: function (oController) {
            this.setHeight('100%');
            this.setWidth('100%');

            var that = this;
           /* that.tileData;
*/
            that.oGenericTileData = {
            };

            that.oNumericContent = new sap.m.NumericContent({
                value: "{/value}",
                scale: "{/scale}",
                indicator: "{/indicator}",
                size: "{/size}",
                formatterValue: true,
                truncateValueTo: 6,
                valueColor: "{/valueColor}"
            });

            that.oNumericTile = new sap.m.TileContent({
                unit: "{/unitNumeric}",
                size: "{/size}",
                footer: "{/footerNum}",
                content: that.oNumericContent
            });

            that.oCmprsDataTmpl = new sap.suite.ui.microchart.ComparisonMicroChartData({
                title : "{title}",
                value : "{value}",
                color : "{color}",
                displayValue : "{displayValue}"
            });

            that.oCmprsChrtTmpl = new sap.suite.ui.microchart.ComparisonMicroChart(
                    {
                        size : "{/size}",
                        scale : "{/scale}",
                        data : {
                            template : that.oCmprsDataTmpl,
                            path : "/data"
                        }
                    });

            that.oComparisonTile = new sap.m.TileContent({
                unit : "{/unitContribution}",
                size : "{/size}",
                footer : "{/footerComp}",
                content : that.oCmprsChrtTmpl
            });


            that.oGenericTile = new sap.m.GenericTile({
                subheader : "{/subheader}",
                frameType : "{/frameType}",
                size : "{/size}",
                header : "{/header}",
                tileContent : [that.oNumericTile, that.oComparisonTile]//that.oComparisonTile]
            });


            that.oGenericTileModel = new sap.ui.model.json.JSONModel();
            that.oGenericTileModel.setData(that.oGenericTileData);
            that.oGenericTile.setModel(that.oGenericTileModel);

            return that.oGenericTile;


        }
    });
}, /* bExport= */ true);
