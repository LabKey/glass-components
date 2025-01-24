/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { fromJS, List } from 'immutable';
import { ActionURL, Ajax, Filter, getServerContext, Query, Utils } from '@labkey/api';

import { resolveKey, SchemaQuery } from '../public/SchemaQuery';

import { Actions } from '../public/QueryModel/withQueryModels';

import { GridResponse } from './components/editable/models';

import {
    getContainerFilter,
    getContainerFilterForFolder,
    invalidateQueryDetailsCache,
    selectDistinctRows,
    selectRowsDeprecated,
} from './query/api';
import {
    BARTENDER_EXPORT_CONTROLLER,
    EXPORT_TYPES,
    FASTA_EXPORT_CONTROLLER,
    GENBANK_EXPORT_CONTROLLER,
    VIEW_NOT_FOUND_EXCEPTION_CLASS,
} from './constants';
import { DataViewInfo } from './DataViewInfo';
import { getQueryParams } from './util/URL';

import { handleRequestFailure } from './util/utils';
import { resolveErrorMessage } from './util/messaging';
import { buildURL } from './url/AppURL';

import { ViewInfo } from './ViewInfo';
import { createGridModelId } from './models';
import { SAMPLES_KEY } from './app/constants';
import { SCHEMAS } from './schemas';

export function selectAll(
    key: string,
    schemaQuery: SchemaQuery,
    filterArray: Filter.IFilter[],
    containerPath?: string,
    queryParameters?: Record<string, any>,
    containerFilter?: Query.ContainerFilter
): Promise<SelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'selectAll.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            params: buildQueryParams(key, schemaQuery, filterArray, queryParameters, containerPath, containerFilter),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(
                reject,
                `Problem in selecting all items in the grid ${key} ${schemaQuery.schemaName} ${schemaQuery.queryName}`
            ),
        });
    });
}

export function getGridIdsFromTransactionId(
    transactionAuditId: number | string,
    dataType: string,
    containerPath?: string
): Promise<string[]> {
    if (!transactionAuditId) {
        return;
    }
    const failureMsg = 'There was a problem retrieving the ' + dataType + ' from the last action.';
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('audit', 'getTransactionRowIds.api'),
            params: { transactionAuditId, dataType, containerFilter: getContainerFilterForFolder(containerPath) },
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    resolve(response.rowIds);
                } else {
                    console.error(failureMsg + ' (transactionAuditId = ' + transactionAuditId + ')', response);
                    reject(failureMsg);
                }
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(failureMsg + ' (transactionAuditId = ' + transactionAuditId + ')', error);
                reject(failureMsg);
            }),
        });
    });
}

export async function selectGridIdsFromTransactionId(
    gridIdPrefix: string,
    schemaQuery: SchemaQuery,
    transactionAuditId: number | string,
    dataType: string,
    actions: Actions
): Promise<string[]> {
    if (!transactionAuditId) return undefined;

    const modelId = createGridModelId(gridIdPrefix, schemaQuery);
    const selected = await getGridIdsFromTransactionId(transactionAuditId, dataType);
    await actions.replaceSelections(modelId, selected);
    actions.loadModel(modelId, true);
    return selected;
}

type SampleTypesFromTransactionIds = { rowIds: string[]; sampleTypes: string[] };

export async function getSampleTypesFromTransactionIds(
    transactionAuditId: number | string
): Promise<SampleTypesFromTransactionIds> {
    if (!transactionAuditId) return undefined;

    const rowIds = await getGridIdsFromTransactionId(transactionAuditId, SAMPLES_KEY);
    const sampleTypes = await selectDistinctRows({
        schemaName: SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
        queryName: SCHEMAS.EXP_TABLES.MATERIALS.queryName,
        column: 'SampleSet/Name',
        filterArray: [Filter.create('RowId', rowIds, Filter.Types.IN)],
    });
    return {
        rowIds,
        sampleTypes: sampleTypes.values,
    };
}

export interface ExportOptions {
    columns?: string;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    filters?: List<Filter.IFilter>;
    selectionKey?: string;
    showRows?: 'ALL' | 'SELECTED' | 'UNSELECTED';
    sorts?: string;
}

export function getExportParams(
    type: EXPORT_TYPES,
    schemaQuery: SchemaQuery,
    options?: ExportOptions,
    advancedOptions?: Record<string, any>,
    queryParameters?: Record<string, any>
): Record<string, any> {
    let params: any = {
        schemaName: schemaQuery.schemaName,
        'query.queryName': schemaQuery.queryName,
        'query.showRows': options?.showRows ? [options.showRows] : ['ALL'],
    };
    if (queryParameters) {
        Object.keys(queryParameters).forEach(param => {
            params['query.param.' + param] = queryParameters[param];
        });
    }

    if (advancedOptions) params = { ...params, ...advancedOptions };

    if (schemaQuery.viewName) {
        params['query.viewName'] = schemaQuery.viewName;
    }

    // Issue 32052: Apply default headers (CRSF, etc)
    const { defaultHeaders } = getServerContext();
    for (const i in defaultHeaders) {
        if (defaultHeaders.hasOwnProperty(i)) {
            params[i] = defaultHeaders[i];
        }
    }

    if (type === EXPORT_TYPES.CSV) {
        params.delim = 'COMMA';
    }

    if (type === EXPORT_TYPES.LABEL_TEMPLATE) {
        params.delim = 'COMMA';
        params.headerType = 'FieldKey';
        // don't export aliases if headType is FieldKey
        Object.keys(params).forEach(param => {
            if (param.startsWith('exportAlias.')) delete params[param];
        });
        incrementClientSideMetricCount('BarTender', 'DownloadTemplateCount');
    }

    if (options) {
        if (options.columns) {
            let columnsString = options.columns;
            if (advancedOptions?.includeColumn)
                columnsString = columnsString + ',' + advancedOptions.includeColumn.join(',');
            if (advancedOptions?.excludeColumn) {
                const toExclude = advancedOptions.excludeColumn;
                const columns = [];
                columnsString.split(',').forEach(col => {
                    if (toExclude.indexOf(col) === -1 && toExclude.indexOf(col.toLowerCase()) === -1) {
                        columns.push(col);
                    }
                });
                params['query.columns'] = columns.join(',');
            } else {
                params['query.columns'] = columnsString;
            }
        }

        const containerFilter = options.containerFilter ?? getContainerFilter(options.containerPath);
        if (containerFilter) {
            params['query.containerFilterName'] = containerFilter;
        }

        options.filters?.forEach(f => {
            if (f) {
                const name = f.getURLParameterName();
                if (!params[name]) {
                    params[name] = [];
                }
                params[name].push(f.getURLParameterValue());
            }
        });

        if (options.selectionKey !== undefined) {
            params['query.selectionKey'] = options.selectionKey;
        }

        if (options.sorts) {
            params['query.sort'] = options.sorts;
        }
    }
    return params;
}

export function exportTabsXlsx(filename: string, queryForms: SchemaQuery[]): Promise<void> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: ActionURL.buildURL('query', 'exportQueriesXLSX.api'),
            method: 'POST',
            jsonData: {
                filename,
                queryForms,
            },
            downloadFile: true,
            success: () => {
                resolve();
            },
            failure: Utils.getCallbackWrapper(error => {
                console.error('Failed to export tabular data', error);
                reject(resolveErrorMessage(error) ?? 'Unexpected error while exporting selected tabs.');
            }),
        });
    });
}

export function exportRows(type: EXPORT_TYPES, exportParams: Record<string, any>, containerPath?: string): void {
    const form = new FormData();
    Object.keys(exportParams).forEach(key => {
        const value = exportParams[key];

        if (value instanceof Array) {
            value.forEach(arrayValue => form.append(key, arrayValue));
        } else {
            form.append(key, value);
        }
    });

    let controller, action;
    if (type === EXPORT_TYPES.CSV || type === EXPORT_TYPES.TSV || type === EXPORT_TYPES.LABEL_TEMPLATE) {
        controller = 'query';
        action = 'exportRowsTsv.post';
    } else if (type === EXPORT_TYPES.EXCEL) {
        controller = 'query';
        action = 'exportRowsXLSX.post';
    } else if (type === EXPORT_TYPES.FASTA) {
        controller = FASTA_EXPORT_CONTROLLER;
        action = 'export.post';
        form.append('format', 'FASTA');
    } else if (type === EXPORT_TYPES.GENBANK) {
        controller = GENBANK_EXPORT_CONTROLLER;
        action = 'export.post';
        form.append('format', 'GENEBANK');
    } else if (type === EXPORT_TYPES.LABEL) {
        controller = BARTENDER_EXPORT_CONTROLLER;
        action = 'printBarTenderLabels.post';
    } else {
        throw new Error('Unknown export type: ' + type);
    }

    Ajax.request({
        url: buildURL(controller, action, undefined, { container: containerPath, returnUrl: false }),
        method: 'POST',
        form,
        downloadFile: true,
    });
}

export interface GetSelectedResponse {
    selected: any[];
}

function getFilteredQueryParams(
    key: string,
    schemaQuery?: SchemaQuery,
    filterArray?: Filter.IFilter[],
    queryParameters?: Record<string, any>,
    containerPath?: string,
    containerFilter?: Query.ContainerFilter
): Record<string, any> {
    if (schemaQuery && filterArray) {
        return buildQueryParams(key, schemaQuery, filterArray, queryParameters, containerPath, containerFilter);
    }

    return { key };
}

function buildQueryParams(
    key: string,
    schemaQuery: SchemaQuery,
    filterArray: Filter.IFilter[],
    queryParameters?: Record<string, any>,
    containerPath?: string,
    containerFilter?: Query.ContainerFilter
): Record<string, any> {
    const filters: Record<string, any> = filterArray.reduce((_filters, filter) => {
        const name = filter.getURLParameterName();
        let value = filter.getURLParameterValue();
        if (_filters[name] !== undefined) {
            let values = _filters[name];
            if (!Array.isArray(values)) {
                values = [values];
            }
            values.push(value);
            value = values;
        }
        _filters[name] = value;
        return _filters;
    }, {});

    const params = {
        schemaName: schemaQuery.schemaName,
        queryName: schemaQuery.queryName,
        'query.selectionKey': key,
    };

    const _containerFilter = containerFilter ?? queryParameters?.containerFilter ?? getContainerFilter(containerPath);
    if (_containerFilter) {
        params['query.containerFilterName'] = _containerFilter;
    }

    if (queryParameters) {
        for (const propName in queryParameters) {
            if (queryParameters.hasOwnProperty(propName)) {
                params['query.param.' + propName] = queryParameters[propName];
            }
        }
    }
    return {
        ...params,
        ...filters,
    };
}

/** Gets selected ids from a particular query view, optionally using the provided query parameters. */
export function getSelected(
    key: string,
    useSnapshotSelection?: boolean,
    schemaQuery?: SchemaQuery,
    filterArray?: Filter.IFilter[],
    containerPath?: string,
    queryParameters?: Record<string, any>,
    containerFilter?: Query.ContainerFilter
): Promise<GetSelectedResponse> {
    if (useSnapshotSelection) return getSnapshotSelections(key, containerPath);

    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'getSelected.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: getFilteredQueryParams(
                key,
                schemaQuery,
                filterArray,
                queryParameters,
                containerPath,
                containerFilter
            ),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(reject, 'Failed to get selected.'),
        });
    });
}

/**
 * @deprecated use getSelectedRows instead
 */
export async function getSelectedDataDeprecated(
    schemaName?: string,
    queryName?: string,
    selections?: string[],
    columns?: string | string[],
    sorts?: string,
    queryParameters?: Record<string, any>,
    viewName?: string,
    keyColumn = 'RowId'
): Promise<GridResponse> {
    const { models, orderedModels } = await selectRowsDeprecated({
        schemaName,
        queryName,
        viewName,
        filterArray: [Filter.create(keyColumn, selections, Filter.Types.IN)],
        parameters: queryParameters,
        sort: sorts,
        columns,
        offset: 0,
    });

    const dataKey = resolveKey(schemaName, queryName);

    return {
        data: fromJS(models[dataKey]),
        dataIds: List(orderedModels[dataKey]),
    };
}

export interface SelectResponse {
    count: number;
}

export type ClearSelectedOptions = {
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    filters?: Filter.IFilter[];
    queryParameters?: Record<string, any>;
    schemaQuery?: SchemaQuery;
    selectionKey: string;
};

export function clearSelected(options: ClearSelectedOptions): Promise<SelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: ActionURL.buildURL('query', 'clearSelected.api', options.containerPath),
            method: 'POST',
            jsonData: getFilteredQueryParams(
                options.selectionKey,
                options.schemaQuery,
                options.filters,
                options.queryParameters,
                options.containerPath,
                options.containerFilter
            ),
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(
                reject,
                `Problem clearing the selection ${options.selectionKey} ${options.schemaQuery?.schemaName} ${options.schemaQuery?.queryName}`
            ),
        });
    });
}

/**
 * Selects individual ids for a particular view
 * @param key the selection key for the grid
 * @param checked whether to set selected or unselected
 * @param ids ids to change selection for
 * @param containerPath optional path to the container for this grid.  Default is the current container path
 * @param validateIds if true, check the ids are present in dataregion before setting selection in session
 * @param schemaName name of the schema for the query grid
 * @param queryName name of the query
 * @param filters array of filters to use
 * @param queryParameters the parameters to the underlying query
 */
export function setSelected(
    key: string,
    checked: boolean,
    ids: string[] | string,
    containerPath?: string,
    validateIds?: boolean,
    schemaName?: string,
    queryName?: string,
    filters?: Filter.IFilter[],
    queryParameters?: Record<string, any>
): Promise<SelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'setSelected.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: {
                id: ids,
                key,
                checked,
                validateIds,
                schemaName,
                queryName,
                filterList: filters,
                queryParameters,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(reject, 'Failed to set selection.'),
        });
    });
}

export type ReplaceSelectedOptions = {
    containerPath?: string;
    id: string[] | string;
    selectionKey: string;
};

export function replaceSelected(options: ReplaceSelectedOptions): Promise<SelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: ActionURL.buildURL('query', 'replaceSelected.api', options.containerPath),
            method: 'POST',
            jsonData: { key: options.selectionKey, id: options.id },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(reject, 'Failed to replace selection.'),
        });
    });
}

/**
 * Set the snapshot selections for a grid
 * @param key the selection key for the grid
 * @param ids ids to change selection for
 * @param containerPath optional path to the container for this grid.  Default is the current container path
 */
export function setSnapshotSelections(
    key: string,
    ids: string[] | string | number[],
    containerPath?: string
): Promise<SelectResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'setSnapshotSelection.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: {
                key,
                id: ids,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(reject, 'Failed to set snapshot selection.'),
        });
    });
}

/**
 * Get the snapshot selections for a grid
 * @param key the selection key for the grid
 * @param containerPath optional path to the container for this grid.  Default is the current container path
 */
export function getSnapshotSelections(key: string, containerPath?: string): Promise<GetSelectedResponse> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('query', 'getSnapshotSelection.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: {
                key,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: handleRequestFailure(reject, 'Failed to get snapshot selection.'),
        });
    });
}

export interface SelectionResponse {
    resolved: boolean;
    schemaQuery?: SchemaQuery;
    selected: any[];
}

export async function getSelection(
    searchParams: URLSearchParams,
    schemaName?: string,
    queryName?: string
): Promise<SelectionResponse> {
    const selectionKey = searchParams.get('selectionKey');
    if (selectionKey) {
        let { keys, schemaQuery } = SchemaQuery.parseSelectionKey(selectionKey);

        if (keys !== undefined) {
            return { resolved: true, schemaQuery, selected: keys.split(';') };
        }

        if (!schemaQuery) {
            if (schemaName && queryName) {
                schemaQuery = new SchemaQuery(schemaName, queryName);
            }
        }

        if (!schemaQuery) {
            throw new Error(
                `No schema found for selection with selectionKey ${selectionKey} schemaName ${schemaName} queryName ${queryName}`
            );
        }

        const params = getQueryParams(searchParams);
        const filters = Filter.getFiltersFromParameters(params);
        const response = await getSelected(selectionKey, false, schemaQuery, filters);

        return { resolved: true, schemaQuery, selected: response.selected };
    }

    return { resolved: false, selected: [] };
}

export function fetchCharts(schemaQuery: SchemaQuery, containerPath?: string): Promise<DataViewInfo[]> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(
                'reports',
                'getReportInfos.api',
                {
                    schemaName: schemaQuery.schemaName,
                    queryName: schemaQuery.queryName,
                },
                {
                    container: containerPath,
                }
            ),
            success: Utils.getCallbackWrapper((response: any) => {
                if (response && response.success) {
                    resolve(response.reports.map(report => new DataViewInfo(report)));
                } else {
                    reject({
                        error:
                            'Unable to get report info for schema/query: ' +
                            schemaQuery.schemaName +
                            '/' +
                            schemaQuery.queryName,
                    });
                }
            }),
            failure: handleRequestFailure(reject),
        });
    });
}

/**
 * Call the core-incrementClientSideMetricCount to track a given client side action (grouped by featureArea and metricName).
 * Note that this call does not return a Promise as it is to just be a background action and not interrupt the
 * main flow of the applications. Also note, that if something goes wrong it will just log the error to the console,
 * but will intentionally not return the error response to the caller.
 * @param featureArea
 * @param metricName
 */
export function incrementClientSideMetricCount(featureArea: string, metricName: string): void {
    const isTestEnv = navigator.userAgent.includes('jsdom');

    if (!featureArea || !metricName || getServerContext().user.isGuest || isTestEnv) {
        return;
    }

    Ajax.request({
        url: buildURL('core', 'incrementClientSideMetricCount.api'),
        method: 'POST',
        jsonData: {
            featureArea,
            metricName,
        },
        success: Utils.getCallbackWrapper(response => {
            // success, no-op
        }),
        failure: Utils.getCallbackWrapper(
            response => {
                // log the error but don't prevent from proceeding
                console.error(response);
            },
            this,
            true
        ),
    });
}

export function saveAsSessionView(schemaQuery: SchemaQuery, containerPath: string, viewInfo: ViewInfo): Promise<void> {
    // See DataRegion.js _updateSessionCustomView(), this set of hard coded booleans matches that set
    return saveGridView(schemaQuery, containerPath, viewInfo, true, true, false, false);
}

export function saveGridView(
    schemaQuery: SchemaQuery,
    containerPath: string,
    viewInfo: ViewInfo,
    replace: boolean,
    session: boolean,
    inherit: boolean,
    shared: boolean
): Promise<void> {
    return new Promise((resolve, reject) => {
        Query.saveQueryViews({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            containerPath,
            views: [{ ...ViewInfo.serialize(viewInfo), replace, session, inherit, shared, hidden: false }],
            success: () => {
                invalidateQueryDetailsCache(schemaQuery, containerPath);
                resolve();
            },
            failure: response => {
                console.error(response);
                reject('There was a problem saving the view for the data grid. ' + resolveErrorMessage(response));
            },
        });
    });
}

// save the current session view as a non session view, remove session view
export function saveSessionView(
    schemaQuery: SchemaQuery,
    containerPath: string,
    viewName: string,
    newName: string,
    inherit?: boolean,
    shared?: boolean,
    replace?: boolean
): Promise<void> {
    return new Promise((resolve, reject) => {
        Query.saveSessionView({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            containerPath,
            viewName,
            newName,
            inherit,
            shared,
            hidden: false,
            replace,
            success: () => {
                invalidateQueryDetailsCache(schemaQuery, containerPath);
                resolve();
            },
            failure: response => {
                console.error(response);
                reject('There was a problem saving the view for the data grid. ' + resolveErrorMessage(response));
            },
        });
    });
}

export function getGridViews(
    schemaQuery: SchemaQuery,
    sort?: boolean,
    viewName?: string,
    excludeSessionView?: boolean,
    includeHidden?: boolean
): Promise<ViewInfo[]> {
    return new Promise((resolve, reject) => {
        Query.getQueryViews({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            viewName,
            excludeSessionView,
            success: response => {
                const views = [];
                response.views?.forEach(view => {
                    if (includeHidden || view['hidden'] !== true) views.push(ViewInfo.fromJson(view));
                });
                if (sort) {
                    views.sort((a, b) => {
                        if (a === ViewInfo.DEFAULT_NAME) return -1;
                        else if (b === '') return 1;

                        return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
                    });
                }
                resolve(views);
            },
            failure: response => {
                console.error(response);
                reject('There was a problem loading the views for the data grid. ' + resolveErrorMessage(response));
            },
        });
    });
}

export function getGridView(
    schemaQuery: SchemaQuery,
    viewName?: string,
    excludeSessionView?: boolean
): Promise<ViewInfo> {
    return new Promise((resolve, reject) => {
        getGridViews(schemaQuery, false, viewName, excludeSessionView)
            .then(views => {
                if (views?.length > 0) resolve(views[0]);
                else reject('Unable to load the view.');
            })
            .catch(error => reject(error));
    });
}

export function revertViewEdit(schemaQuery: SchemaQuery, containerPath: string, viewName?: string): Promise<void> {
    return deleteView(schemaQuery, containerPath, viewName, true);
}

export function deleteView(
    schemaQuery: SchemaQuery,
    containerPath: string,
    viewName?: string,
    revert?: boolean
): Promise<void> {
    return new Promise((resolve, reject) => {
        Query.deleteQueryView({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            viewName,
            containerPath,
            revert,
            success: () => {
                invalidateQueryDetailsCache(schemaQuery, containerPath);
                resolve();
            },
            failure: response => {
                if (response.exceptionClass === VIEW_NOT_FOUND_EXCEPTION_CLASS) {
                    invalidateQueryDetailsCache(schemaQuery, containerPath);
                    resolve(); // view has already been deleted
                } else {
                    console.error(response);
                    reject('Unable to deleting the view for the data grid. ' + resolveErrorMessage(response));
                }
            },
        });
    });
}

/**
 * Rename a custom view from viewName to newName.
 * @param schemaQuery
 * @param containerPath
 * @param viewName The old custom view name to replace
 * @param newName The new custom view name
 */
export function renameGridView(
    schemaQuery: SchemaQuery,
    containerPath: string,
    viewName: string,
    newName: string
): Promise<void> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('query', 'renameQueryView.api', undefined, {
                container: containerPath,
            }),
            method: 'POST',
            jsonData: {
                schemaName: schemaQuery.schemaName,
                queryName: schemaQuery.queryName,
                viewName,
                newName,
            },
            success: Utils.getCallbackWrapper(response => {
                invalidateQueryDetailsCache(schemaQuery, containerPath);
                resolve();
            }),
            failure: Utils.getCallbackWrapper(error => {
                console.error(error);
                reject(resolveErrorMessage(error) ?? 'Failed to rename the custom view.');
            }),
        });
    });
}
