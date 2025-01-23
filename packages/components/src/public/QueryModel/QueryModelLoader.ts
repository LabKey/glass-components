import React from 'react';

import {
    clearSelected,
    fetchCharts,
    getSelected,
    replaceSelected,
    selectAll,
    SelectResponse,
    setSelected,
} from '../../internal/actions';
import { isRReportsEnabled } from '../../internal/app/utils';
import { DataViewInfoTypes, VISUALIZATION_REPORTS } from '../../internal/constants';

import { DataViewInfo, IDataViewInfo } from '../../internal/DataViewInfo';
import { getQueryColumnRenderers } from '../../internal/global';
import { getQueryDetails, selectRowsDeprecated } from '../../internal/query/api';
import { DefaultRenderer } from '../../internal/renderers/DefaultRenderer';
import { ExtendedMap } from '../ExtendedMap';
import { QueryColumn } from '../QueryColumn';

import { QueryInfo } from '../QueryInfo';
import { naturalSortByProperty } from '../sort';

import { GridMessage, QueryModel } from './QueryModel';

export function bindColumnRenderers(columns: ExtendedMap<string, QueryColumn>): ExtendedMap<string, QueryColumn> {
    if (columns) {
        const columnRenderers = getQueryColumnRenderers();

        return columns.map(queryCol => {
            let node = DefaultRenderer;
            if (queryCol?.columnRenderer && columnRenderers.hasOwnProperty(queryCol.columnRenderer.toLowerCase())) {
                node = columnRenderers[queryCol.columnRenderer.toLowerCase()];
            }

            // TODO: Just generate one function per type
            return queryCol.mutate({
                cell: (data, row, col, rowIndex, columnIndex) => {
                    return React.createElement(node, { data, row, col: queryCol, rowIndex, columnIndex });
                },
            });
        });
    }

    return columns;
}

export interface RowsResponse {
    messages: GridMessage[];
    orderedRows: string[];
    rowCount: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rows: { [key: string]: any };
}

export interface QueryModelLoader {
    /**
     * Clear all selected rows for a given QueryModel.
     * @param model: QueryModel
     */
    clearSelections: (model: QueryModel) => Promise<SelectResponse>;

    /**
     * Loads the charts (DataViewInfos) for a given model.
     * @param model
     */
    loadCharts: (model: QueryModel) => Promise<DataViewInfo[]>;

    /**
     * Loads the QueryInfo for the specified model.
     * @param model: QueryModel
     */
    loadQueryInfo: (model: QueryModel) => Promise<QueryInfo>;

    /**
     * Loads the current page of rows for the specified model.
     * @param model: QueryModel
     */
    loadRows: (model: QueryModel) => Promise<RowsResponse>;

    /**
     * Loads the selected RowIds (or PK values) for the specified model.
     * @param model: QueryModel
     */
    loadSelections: (model: QueryModel) => Promise<Set<string>>;

    /**
     * Replaces the currently selected items with the given set of selections.
     * @param model: QueryModel
     * @param checked: boolean, the checked status of the ids
     * @param selections: A list of stringified RowIds.
     */
    replaceSelections: (model: QueryModel, selections: string[]) => Promise<SelectResponse>;

    /**
     * Select all rows for a given QueryModel.
     * @param model: QueryModel
     */
    selectAllRows: (model: QueryModel) => Promise<Set<string>>;

    /**
     * Sets the selected status for the list of selections.
     * @param model: QueryModel
     * @param checked: boolean, the checked status of the ids
     * @param selections: A list of stringified RowIds.
     */
    setSelections: (model: QueryModel, checked: boolean, selections: string[]) => Promise<SelectResponse>;
}

export const DefaultQueryModelLoader: QueryModelLoader = {
    async loadQueryInfo(model) {
        const { containerPath, requiredColumns, requiredColumnsAsQueryInfoFields, schemaQuery } = model;
        const queryInfo = await getQueryDetails({
            containerPath,
            fields: requiredColumnsAsQueryInfoFields ? requiredColumns : undefined,
            schemaQuery,
        });
        return queryInfo.mutate({ columns: bindColumnRenderers(queryInfo.columns) });
    },
    async loadRows(model) {
        const result = await selectRowsDeprecated({
            ...model.loadRowsConfig,
            schemaName: model.schemaName,
            queryName: model.queryName,
            includeTotalCount: false, // if requesting to includeTotalCount, it will be loaded separately via loadTotalCount
            includeStyle: true, // Issue 49100
        });
        const { key, models, orderedModels, rowCount, messages } = result;

        return {
            messages: messages.toJS(),
            rows: models[key],
            orderedRows: orderedModels[key].toArray(),
            rowCount,
        };
    },
    // The selection related methods may seem like overly simple passthroughs, but by putting them on QueryModelLoader,
    // instead of in withQueryModels, it allows us to easily mock them or provide alternate implementations.
    clearSelections(model) {
        const { containerFilter, selectionKey, schemaQuery, filters, queryParameters, selectionContainerPath } = model;
        if (filters?.length > 0) {
            return clearSelected({
                selectionKey,
                schemaQuery,
                filters,
                containerPath: selectionContainerPath,
                queryParameters,
                containerFilter,
            });
        } else {
            // Issue 51422: When there are no filters, we can use a more efficient version of clearSelected
            return clearSelected({
                selectionKey,
                containerPath: selectionContainerPath,
            });
        }
    },
    async loadSelections(model) {
        const { containerFilter, selectionKey, schemaQuery, filters, queryParameters, selectionContainerPath } = model;
        const result = await getSelected(
            selectionKey,
            false,
            schemaQuery,
            filters,
            selectionContainerPath,
            queryParameters,
            containerFilter
        );
        return new Set(result?.selected ?? []);
    },
    setSelections(model, checked, selections) {
        const { selectionKey, selectionContainerPath } = model;
        return setSelected(selectionKey, checked, selections, selectionContainerPath);
    },
    replaceSelections(model, selections) {
        const { selectionKey, selectionContainerPath } = model;
        return replaceSelected({ selectionKey, id: selections, containerPath: selectionContainerPath });
    },
    async selectAllRows(model) {
        const { containerFilter, filters, queryParameters, schemaQuery, selectionContainerPath, selectionKey } = model;
        await selectAll(selectionKey, schemaQuery, filters, selectionContainerPath, queryParameters, containerFilter);
        return DefaultQueryModelLoader.loadSelections(model);
    },
    async loadCharts(model) {
        const { schemaQuery, containerPath } = model;
        const sortByName = naturalSortByProperty<IDataViewInfo>('name');

        let charts = await fetchCharts(schemaQuery, containerPath);
        charts = charts.sort(sortByName).filter(report => VISUALIZATION_REPORTS.contains(report.type));

        if (!isRReportsEnabled()) {
            charts = charts.filter(chart => chart.type !== DataViewInfoTypes.RReport);
        }

        return charts;
    },
};
