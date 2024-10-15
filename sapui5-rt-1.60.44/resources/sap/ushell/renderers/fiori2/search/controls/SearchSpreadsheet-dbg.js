sap.ui.define([
    "sap/ui/core/mvc/Controller",
    'sap/ushell/renderers/fiori2/search/SearchResultListFormatter',
    "sap/ui/export/Spreadsheet"
], function (Controller, SearchResultListFormatter, Spreadsheet) {
    "use strict";

    return Controller.extend("sap.ui.export.sample.table.Spreadsheet", {

        onExport: function () {
            var that = this;
            that.exportData = {
                columns: [],
                rows: []
            };

            if (that.table === undefined) {
                that.table = sap.ui.getCore().byId('ushell-search-result-table');
                that.model = that.table.getModel();
            }

            sap.ui.getCore().byId('dataExportButton').setEnabled(false); // deactivate download button

            // search query
            var exportQuery = that.model.query.clone();
            exportQuery.setCalculateFacets(false);
            exportQuery.setTop(1000);

            // success handler
            var successHandler = function (searchResultSet) {
                that._parseColumns(searchResultSet.items[0]);

                // get formatted result
                var formatter = new SearchResultListFormatter();
                var formattedResultItems = formatter.format(searchResultSet, exportQuery.filter.searchTerm, {
                    suppressHighlightedValues: true
                });

                // set formatted title and title description
                for (var i = 0; i < formattedResultItems.length; i++) {
                    searchResultSet.items[i].title = formattedResultItems[i].title;
                    searchResultSet.items[i].titleDescription = formattedResultItems[i].titleDescription;
                }

                // title attribute is formatted, concatenated title
                // title description attribute is formatted, concatenated title description 
                // detail attribute is unformatted, having value, related attributes, or attribute group
                that._parseRows(searchResultSet.items);

                that._doExport();
            };

            // error handler
            var errorHandler = function (error) {
                that.model.normalSearchErrorHandling(error);
                sap.ui.getCore().byId('dataExportButton').setEnabled(true); // activate download button, when search fails
            };

            // fire search
            if (that.model.getProperty("/boCount") > 1000) {
                sap.m.MessageBox.information(sap.ushell.resources.i18n.getText("exportDataInfo"), {
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL],
                    onClose: function (oAction) {
                        if (oAction == sap.m.MessageBox.Action.OK) {
                            exportQuery.getResultSetAsync().then(successHandler, errorHandler);
                        }
                        if (oAction == sap.m.MessageBox.Action.CANCEL) {
                            sap.ui.getCore().byId('dataExportButton').setEnabled(true); // activate download button, when download is canceled
                        }
                    }
                });
            } else {
                exportQuery.getResultSetAsync().then(successHandler, errorHandler);
            }
        },

        _parseColumns: function (firstSearchResult) {
            var that = this;
            var exportColumns = [];

            // title column
            exportColumns.push({
                label: firstSearchResult.dataSource.labelPlural,
                property: 'title_export_column',
                type: 'string'
            });

            // title description column
            exportColumns.push({
                label: sap.ushell.resources.i18n.getText("titleDescription"),
                property: 'title_description_export_column',
                type: 'string'
            });

            // other columns
            var attributes = firstSearchResult.detailAttributes;

            if (that.model.getProperty("/resultToDisplay") === "searchResultList") {
                // get first 12 detail attributes and their related attributes
                var limit = 0;
                for (var i = 0; i < attributes.length && limit < 12; i++) {
                    exportColumns = exportColumns.concat(that._getRelatedColumns(attributes[i]));
                    limit++;
                }

            } else {
                // get all visible and sorted detail attributes and their related attributes in table view
                var visibleColumns = [];
                that.table.getColumns().forEach(function (column) {
                    if (column.getVisible()) {
                        visibleColumns.push(column);
                    }
                });
                visibleColumns.sort(function (a, b) {
                    if (a.getOrder() < b.getOrder())
                        return -1;
                    if (a.getOrder() > b.getOrder())
                        return 1;
                    return 0;
                });

                visibleColumns.forEach(function (column) {
                    var id = column.getBindingContext().getObject().attributeId;
                    for (var i = 0; i < attributes.length; i++) {
                        if (attributes[i].id === id) {
                            exportColumns = exportColumns.concat(that._getRelatedColumns(attributes[i]));
                        }
                    }
                });
            }

            that.exportData.columns = exportColumns;
        },

        _getRelatedColumns: function (attribute) {
            var that = this;
            var columns = [];

            // single attribute
            if (attribute.value) {
                // current attribute
                columns.push(that._getColumn(attribute));

                // unitOfMeasure atribute of current attribute
                if (attribute.unitOfMeasure) {
                    columns.push(that._getColumn(attribute.unitOfMeasure));
                }

                // description attribute of current attribute
                if (attribute.description) {
                    columns.push(that._getColumn(attribute.description));
                }
            }

            // attribute group
            if (attribute.attributes) {
                Object.values(attribute.attributes).forEach(function (subAttribute) {
                    // sub attribute
                    columns.push(that._getColumn(subAttribute));
                });
            }

            return columns;
        },

        _getColumn: function (attribute) {
            var that = this;
            var column = {
                label: attribute.label,
                property: attribute.id
            };

            if (attribute.metadata.type === undefined) {
                column.type = 'string';
                return column;
            }

            switch (attribute.metadata.type) {
                // case that.model.sinaNext.AttributeType.Timestamp:
                //     column.type = 'timestamp';
                //     break;
                // case that.model.sinaNext.AttributeType.Date:
                //     column.type = 'date';
                //     break;
                // case that.model.sinaNext.AttributeType.Time:
                //     column.type = 'time';
                //     break;
            case that.model.sinaNext.AttributeType.Double:
                column.type = 'number';
                column.scale = 2;
                break;
            case that.model.sinaNext.AttributeType.Integer:
                column.type = 'number';
                column.scale = 0;
                break;
            default:
                column.type = 'string';
            }

            return column;
        },

        _parseRows: function (searchResults) {
            var that = this;
            var exportedRows = [];

            searchResults.forEach(function (row) {
                var attributes = row.detailAttributes;
                var exportedRow = {};

                // title value
                exportedRow["title_export_column"] = row.title;

                // title description value
                exportedRow["title_description_export_column"] = row.titleDescription;

                // other attributes' value
                for (var i = 0; i < attributes.length; i++) {
                    exportedRow = that._getRelatedValues(exportedRow, attributes[i]);
                }

                exportedRows.push(exportedRow);
            });

            that.exportData.rows = exportedRows;
        },

        _getRelatedValues: function (row, attribute) {

            // single attribute
            if (attribute.value) {
                // value of current attrinute
                row[attribute.id] = attribute.value;

                // unitOfMeasure value of current attrinute
                if (attribute.unitOfMeasure) {
                    row[attribute.unitOfMeasure.id] = attribute.unitOfMeasure.value;
                }

                // description value of current attrinute
                if (attribute.description) {
                    row[attribute.description.id] = attribute.description.value;
                }
            }

            // attribute group
            if (attribute.attributes) {
                Object.values(attribute.attributes).forEach(function (subAttribute) {
                    // sub attribute
                    row[subAttribute.id] = subAttribute.value;
                });
            }

            return row;
        },

        _doExport: function () {
            var that = this;
            var oSettings = {
                workbook: {
                    columns: that.exportData.columns
                },
                dataSource: that.exportData.rows
            };

            new Spreadsheet(oSettings).build().then(function () {
                sap.ui.getCore().byId('dataExportButton').setEnabled(true); // activate download button
            }, function () {
                sap.ui.getCore().byId('dataExportButton').setEnabled(true); // activate download button
            });
        }
    });
});
