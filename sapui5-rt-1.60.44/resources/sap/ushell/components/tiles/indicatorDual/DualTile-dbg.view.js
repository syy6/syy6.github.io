//Copyright (c) 2013 SAP AG, All Rights Reserved
//jQuery.sap.require("sap.ushell.components.tiles.Generic");
//Comparison Tile

sap.ui.define([
'sap/ui/core/mvc/JSView',
		'sap/ushell/components/tiles/indicatorTileUtils/oData4Analytics',
		'sap/ushell/components/tiles/indicatorTileUtils/smartBusinessUtil',
		'sap/ushell/components/tiles/sbtilecontent'
		
	], function(JSView, oData4Analytics, smartBusinessUtil, sbtilecontent) {
	"use strict";

    /*global jQuery, sap */
    /*jslint nomen: true */
 /*eslint-disable no-mixed-spaces-and-tabs*/
          /*eslint-disable no-warning-comments*/
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
    sap.ui.getCore().loadLibrary("sap.suite.ui.microchart");

    sap.ui.jsview("sap.ushell.components.tiles.indicatorDual.DualTile", {
        getControllerName: function () {
            return "sap.ushell.components.tiles.indicatorDual.DualTile";
        },
        createContent: function (oController) {

            this.setHeight('100%');
            this.setWidth('100%');

            var that = this;
            that.tileData;
            that.oGenericTileData = {

            };
            sap.ushell.components.tiles.indicatorTileUtils.util.getParsedChip(
                    that.getViewData().chip.configuration.getParameterValueAsString("tileConfiguration"), that.getViewData().chip.preview.isEnabled(), function(config){
                        that.oConfig = config;
                    });
            that.tileType = that.oConfig.TILE_PROPERTIES.tileType;

            that.oNumericContent = new sap.m.NumericContent({
                value: "{/value}",
                scale: "{/scale}",
                unit: "{/unit}",
                indicator: "{/indicator}",
                size: "{/size}",
                formatterValue: "{/isFormatterValue}",
                truncateValueTo: 5,
                valueColor: "{/valueColor}",
                nullifyValue : false
            });

//          that.oLeftTileContent = new sap.suite.ui.commons.TileContent({
//          unit: "{/unit}",
//          size: "{/size}",
//          footer: "{/footerNum}",
//          content: that.oNumericContent
//          });

            that.oLeftTileContent = new sap.ushell.components.tiles.sbtilecontent({
                unit : "{/unit}",
                size : "{/size}",
                footer : "{/footerNum}",
                content: that.oNumericContent
            });


            switch (that.tileType) {

            case "DT-CM":
                var oCmprsData = new sap.suite.ui.microchart.ComparisonMicroChartData({
                    title: "{title}",
                    value : "{value}",
                    color : "{color}",
                    displayValue : "{displayValue}"
                });

                that.oComparisionContent = new sap.suite.ui.microchart.ComparisonMicroChart({
                    size : "{/size}",
                    scale : "{/scale}",
                    data : {
                        template : oCmprsData,
                        path : "/data"
                    }
                });

                that.oRightContent = new sap.ushell.components.tiles.sbtilecontent({
                    unit : "{/unit}",
                    size : "{/size}",
                    footer : "{/footerNum}",
                    content: that.oComparisionContent
                });
                break;

            case "DT-CT":
                var oCmprsData = new sap.suite.ui.microchart.ComparisonMicroChartData({
                    title: "{title}",
                    value : "{value}",
                    color : "{color}",
                    displayValue : "{displayValue}"
                });

                that.oContributionContent = new sap.suite.ui.microchart.ComparisonMicroChart({
                    size : "{/size}",
                    scale : "{/scale}",
                    data : {
                        template : oCmprsData,
                        path : "/data"
                    }
                });

                that.oRightContent = new sap.ushell.components.tiles.sbtilecontent({
                    unit : "{/unit}",
                    size : "{/size}",
                    footer : "{/footerNum}",
                    content: that.oContributionContent
                });
                break;

            case "DT-TT":

                var buildChartItem = function(sName){
                return new sap.suite.ui.microchart.AreaMicroChartItem({
                    color: "Good",
                    points: {
                        path: "/" + sName + "/data",
                        template: new sap.suite.ui.microchart.AreaMicroChartPoint({
                            x: "{day}",
                            y: "{balance}"

                        })
                    }
                });
            };

            var buildMACLabel = function(sName) {
                return new sap.suite.ui.microchart.AreaMicroChartLabel({
                    label: "{/" + sName + "/label}",
                    color: "{/" + sName + "/color}"
                });
            };
            var areaChart = new sap.suite.ui.microchart.AreaMicroChart({
                width: "{/width}",
                height: "{/height}",
                size : "{/size}",
                target: buildChartItem("target"),
                innerMinThreshold: buildChartItem("innerMinThreshold"),
                innerMaxThreshold: buildChartItem("innerMaxThreshold"),
                minThreshold: buildChartItem("minThreshold"),
                maxThreshold: buildChartItem("maxThreshold"),
                chart: buildChartItem("chart"),
                minXValue: "{/minXValue}",
                maxXValue: "{/maxXValue}",
                minYValue: "{/minYValue}",
                maxYValue: "{/maxYValue}",
                firstXLabel: buildMACLabel("firstXLabel"),
                lastXLabel: buildMACLabel("lastXLabel"),
                firstYLabel: buildMACLabel("firstYLabel"),
                lastYLabel: buildMACLabel("lastYLabel"),
                minLabel: buildMACLabel("minLabel"),
                maxLabel: buildMACLabel("maxLabel")
            });
            
            that.oRightContent = new sap.ushell.components.tiles.sbtilecontent({
                unit : "{/unit}",
                size : "{/size}",
                content: areaChart
            });
            break;

            case "DT-AT":
                var oBCDataTmpl = new sap.suite.ui.microchart.BulletMicroChartData({
                    value: "{value}",
                    color: "{color}"
                });

                var oBChart = new sap.suite.ui.microchart.BulletMicroChart({
                    size: sap.m.Size.Auto,
                    scale: "{/scale}",
                    actual: {
                        value: "{/actual/value}",
                        color: "{/actual/color}"
                    },
                    targetValue: "{/targetValue}",
                    actualValueLabel: "{/actualValueLabel}",
                    targetValueLabel: "{/targetValueLabel}",
                    thresholds: {
                        template: oBCDataTmpl,
                        path: "/thresholds"
                    },
                    state: "{/state}",
                    showActualValue: "{/showActualValue}",
                    showTargetValue: "{/showTargetValue}"
                });

                that.oRightContent = new sap.ushell.components.tiles.sbtilecontent({
                    unit : "{/unit}",
                    size : "{/size}",
                    footer : "{/footerNum}",
                    content: oBChart
                });
                break;

            }

            that.oGenericTile = new sap.m.GenericTile({
                subheader : "{/subheader}",
                frameType : "TwoByOne",
                size : "{/size}",
                header : "{/header}",
                tileContent : [that.oLeftTileContent,that.oRightContent]
            });


            that.oGenericTileModel = new sap.ui.model.json.JSONModel();
            that.oGenericTileModel.setData(that.oGenericTileData);
            that.oGenericTile.setModel(that.oGenericTileModel);

            return that.oGenericTile;
        }
    });
}, /* bExport= */ true);
