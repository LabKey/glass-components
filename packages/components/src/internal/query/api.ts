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
import { fromJS, List, Map, OrderedMap, Record as ImmutableRecord, Set as ImmutableSet } from 'immutable';
import { normalize, schema } from 'normalizr';
import { Filter, Query, QueryDOM } from '@labkey/api';

import { getQueryMetadata } from '../global';
import { resolveKeyFromJson, SchemaQuery } from '../../public/SchemaQuery';
import {
    isAllProductFoldersFilteringEnabled,
    isProductProjectsDataListingScopedToProject,
    isProductProjectsEnabled,
    isProjectContainer,
} from '../app/utils';

import { caseInsensitive, quoteValueWithDelimiters } from '../util/utils';
import { QueryInfo, QueryInfoStatus } from '../../public/QueryInfo';
import { QueryColumn, QueryLookup } from '../../public/QueryColumn';
import { ViewInfo } from '../ViewInfo';
import { URLResolver } from '../url/URLResolver';
import { ModuleContext } from '../components/base/ServerContext';

let queryDetailsCache: Record<string, Promise<QueryInfo>> = {};

export function invalidateFullQueryDetailsCache(): void {
    queryDetailsCache = {};
}

function getQueryDetailsCacheKey(schemaQuery: SchemaQuery, containerPath?: string, fk?: string): string {
    return '' + schemaQuery.getKey(false) + (fk ? '|' + fk : '') + (containerPath ? '|' + containerPath : '');
}

export function invalidateQueryDetailsCache(schemaQuery: SchemaQuery, containerPath?: string, fk?: string): void {
    const key = getQueryDetailsCacheKey(schemaQuery, containerPath, fk);
    delete queryDetailsCache[key];

    // also call invalidate for the query key without the containerPath
    if (containerPath) {
        const keyNoContainerPath = getQueryDetailsCacheKey(schemaQuery, undefined, fk);
        delete queryDetailsCache[keyNoContainerPath];
    }
}

export interface GetQueryDetailsOptions {
    containerPath?: string;
    fk?: string;
    lookup?: QueryLookup;
    queryName: string;
    schemaName: string;
    viewName?: string;
}

export function getQueryDetails(options: GetQueryDetailsOptions): Promise<QueryInfo> {
    const { containerPath, queryName, schemaName, viewName, fk, lookup } = options;
    const schemaQuery = new SchemaQuery(schemaName, queryName, viewName);
    const key = getQueryDetailsCacheKey(schemaQuery, containerPath, fk);

    if (!queryDetailsCache[key]) {
        queryDetailsCache[key] = new Promise((resolve, reject) => {
            Query.getQueryDetails({
                containerPath,
                schemaName,
                queryName,
                fk,
                viewName: fk ? undefined : '*',
                success: queryDetails => {
                    // getQueryDetails will return an exception parameter in cases
                    // where it is unable to resolve the tableInfo. This is deemed a 'success'
                    // by the request standards but here we reject as an outright failure
                    if (queryDetails.exception) {
                        invalidateQueryDetailsCache(schemaQuery, containerPath, fk);
                        reject({
                            schemaQuery,
                            message: queryDetails.exception,
                            exceptionClass: undefined,
                        });
                    } else if (lookup) {
                        resolve(applyQueryMetadata(queryDetails, lookup.schemaName, lookup.queryName));
                    } else {
                        resolve(applyQueryMetadata(queryDetails));
                    }
                },
                failure: (error, request) => {
                    console.error(error);
                    invalidateQueryDetailsCache(schemaQuery, containerPath, fk);
                    reject({
                        message: error.exception,
                        exceptionClass: error.exceptionClass,
                        schemaQuery,
                        status: request.status,
                    });
                },
            });
        });
    }

    return queryDetailsCache[key];
}

export function applyQueryMetadata(rawQueryInfo: any, schemaName?: string, queryName?: string): QueryInfo {
    let queryInfo;
    const metadata = getQueryMetadata();
    const _schemaName = schemaName ?? rawQueryInfo?.schemaName;
    const _queryName = queryName ?? rawQueryInfo?.name;

    if (rawQueryInfo && _schemaName && _queryName) {
        const schemaQuery = new SchemaQuery(_schemaName, _queryName);

        let columns = OrderedMap<string, QueryColumn>();
        rawQueryInfo.columns.forEach(rawColumn => {
            columns = columns.set(rawColumn.fieldKey.toLowerCase(), applyColumnMetadata(schemaQuery, rawColumn));
        });

        let schemaMeta = metadata.getIn(['schema', _schemaName.toLowerCase(), 'queryDefaults']);

        if (schemaMeta) {
            schemaMeta = schemaMeta.toJS();
        }

        // see if metadata is defined for this query
        let queryMeta = metadata.getIn(['schema', _schemaName.toLowerCase(), 'query', _queryName.toLowerCase()]);

        if (queryMeta) {
            // remove transient properties
            queryMeta = queryMeta.delete('column');
            queryMeta = queryMeta.toJS();
        }

        let views = Map<string, ViewInfo>();

        if (rawQueryInfo.views) {
            views = views.asMutable();

            const removedViewColumns = columns
                .filter(c => c.removeFromViews === true)
                .map(c => c.fieldKey.toLowerCase())
                .toMap();

            rawQueryInfo.views.forEach(rawViewInfo => {
                let viewInfo = new ViewInfo(rawViewInfo);

                if (removedViewColumns.size) {
                    viewInfo = viewInfo.mutate({
                        columns: viewInfo.columns.filter(
                            vc => removedViewColumns.get(vc.fieldKey.toLowerCase()) === undefined
                        ),
                    }) as ViewInfo;
                }

                columns = applyViewColumns(columns, schemaQuery, rawViewInfo);

                views.set(viewInfo.name.toLowerCase(), viewInfo);
            });
            views = views.asImmutable();
        }

        const queryLabel = rawQueryInfo.title || _queryName;

        const defaultQueryMeta = {
            queryLabel,
            plural: queryLabel,
            schemaLabel: _schemaName,
            singular: queryLabel,
        };

        const altUpdateKeys = new Set<string>();
        if (rawQueryInfo.altUpdateKeys?.length > 0) {
            rawQueryInfo.altUpdateKeys?.forEach(key => {
                altUpdateKeys.add(key);
            });
        }

        queryInfo = Object.assign({}, rawQueryInfo, schemaMeta, defaultQueryMeta, queryMeta, {
            altUpdateKeys,
            // derived fields
            columns,
            pkCols: columns
                .filter(col => col.isKeyField)
                .map(col => col.fieldKey)
                .toList(),
            status: QueryInfoStatus.ok, // seems a little weird to be saying we are OK here
            views,
        });
    } else {
        console.warn('Invalid QueryInfo supplied for overriding metadata');
        queryInfo = rawQueryInfo;
    }

    return QueryInfo.create(queryInfo);
}

const DEFAULT_PROCESS_PARAMETER_DOMAIN_KEY = 'defaultprocessparameterdomain';

function applyColumnMetadata(schemaQuery: SchemaQuery, rawColumn: any): QueryColumn {
    let columnMetadata;
    const metadata = getQueryMetadata();

    // lookup to see if metadata needs to be applied
    if (rawColumn && rawColumn.fieldKey) {
        let lcFieldKey = rawColumn.fieldKey.toLowerCase();
        // special case for vocabulary domain for process parameters. The name of the domain also contains
        // the domainId (e.g., DefaultProcessParameterDomain40).
        if (rawColumn.fieldKey.toLowerCase().startsWith(DEFAULT_PROCESS_PARAMETER_DOMAIN_KEY))
            lcFieldKey = DEFAULT_PROCESS_PARAMETER_DOMAIN_KEY;
        let allMeta = metadata.getIn(['columnDefaults', lcFieldKey]);

        if (allMeta) {
            allMeta = allMeta.toJS();
        }

        let schemaMeta = metadata.getIn(['schema', schemaQuery.schemaName.toLowerCase(), 'columnDefaults', lcFieldKey]);

        if (schemaMeta) {
            schemaMeta = schemaMeta.toJS();
        }

        let columnMeta = metadata.getIn([
            'schema',
            schemaQuery.schemaName.toLowerCase(),
            'query',
            schemaQuery.queryName.toLowerCase(),
            'column',
            lcFieldKey,
        ]);

        if (columnMeta) {
            columnMeta = columnMeta.toJS();
        }
        // special case for assay schema to allow for metadata to be applied to all protocols base tables
        else if (schemaQuery.schemaName.toLowerCase().startsWith('assay.')) {
            columnMeta = metadata.getIn([
                'schema',
                'assay',
                'query',
                schemaQuery.queryName.toLowerCase(),
                'column',
                lcFieldKey,
            ]);
            if (columnMeta) {
                columnMeta = columnMeta.toJS();
            }
        }

        columnMetadata = Object.assign({}, allMeta, schemaMeta, columnMeta);

        if (columnMetadata) {
            columnMetadata.columnRenderer = Renderers.applyColumnRenderer(columnMetadata, rawColumn, metadata);
            columnMetadata.detailRenderer = Renderers.applyDetailRenderer(columnMetadata, rawColumn, metadata);
            columnMetadata.inputRenderer = Renderers.applyInputRenderer(columnMetadata, rawColumn, metadata);
            columnMetadata.helpTipRenderer = Renderers.applyHelpTipRenderer(columnMetadata, rawColumn, metadata);

            if (columnMetadata.lookup) {
                columnMetadata.lookup = Object.assign({}, rawColumn.lookup, columnMetadata.lookup);
            }
        }
    }

    return new QueryColumn(Object.assign({}, rawColumn, columnMetadata));
}

// As of r57235 some column info's are only found on the views "fields" property that were previously
// available in the query info's "columns" property.
function applyViewColumns(
    columns: OrderedMap<string, QueryColumn>,
    schemaQuery: SchemaQuery,
    rawViewInfo: any
): OrderedMap<string, QueryColumn> {
    if (rawViewInfo && rawViewInfo.fields) {
        rawViewInfo.fields.forEach(rawColumn => {
            const fk = rawColumn.fieldKey.toLowerCase();
            if (!columns.has(fk)) {
                columns = columns.set(fk, applyColumnMetadata(schemaQuery, rawColumn));
            }
        });
    }

    return columns;
}

export class Renderers {
    static _check(columnMetadata, rawColumn, field, metadata) {
        if (columnMetadata.conceptURI || rawColumn.conceptURI) {
            const concept = metadata.getIn([
                'concepts',
                columnMetadata.conceptURI
                    ? columnMetadata.conceptURI.toLowerCase()
                    : rawColumn.conceptURI.toLowerCase(),
            ]);

            if (concept) {
                return concept.get(field);
            }
        }

        return undefined;
    }

    static applyColumnRenderer(columnMetadata, rawColumn, metadata) {
        let value = this._check(columnMetadata, rawColumn, 'columnRenderer', metadata);

        if (value === undefined) {
            if (rawColumn.name === 'harvest') {
                value = 'MaterialLookupColumnRenderer';
            } else {
                value = this._applyDefaultRenderer(columnMetadata, rawColumn, metadata);
            }
        }

        return value;
    }

    static applyDetailRenderer(columnMetadata, rawColumn, metadata) {
        let value = this._check(columnMetadata, rawColumn, 'detailRenderer', metadata);

        if (value === undefined) {
            value = this._applyDefaultRenderer(columnMetadata, rawColumn, metadata);
        }

        return value;
    }

    static _applyDefaultRenderer(columnMetadata, rawColumn, metadata) {
        const types = ImmutableSet.of(rawColumn.type.toLowerCase(), rawColumn.friendlyType.toLowerCase());

        if (rawColumn.multiValue === true) {
            return 'MultiValueDetailRenderer';
        } else if (types.contains('file')) {
            return 'FileColumnRenderer';
        } else if (QueryColumn.isUserLookup(rawColumn.lookup)) {
            return 'UserDetailsRenderer';
        }

        return undefined;
    }

    static applyInputRenderer(columnMetadata, rawColumn, metadata) {
        return this._check(columnMetadata, rawColumn, 'inputRenderer', metadata);
    }

    static applyHelpTipRenderer(columnMetadata, rawColumn, metadata) {
        return this._check(columnMetadata, rawColumn, 'helpTipRenderer', metadata);
    }
}

export interface ISelectRowsResult {
    caller?: any;
    key: string;
    messages?: List<Map<string, string>>;
    models: any;
    orderedModels: List<any>;
    queries: {
        [key: string]: QueryInfo;
    };
    rowCount: number;
}

/**
 * @deprecated use selectRows() instead.
 * Fetches an API response and normalizes the result JSON according to schema.
 * This makes every API response have the same shape, regardless of how nested it was.
 */
export function selectRowsDeprecated(userConfig, caller?): Promise<ISelectRowsResult> {
    return new Promise((resolve, reject) => {
        let schemaQuery, key;
        if (userConfig.queryName) {
            schemaQuery = new SchemaQuery(userConfig.schemaName, userConfig.queryName, userConfig.viewName);
            key = schemaQuery.getKey();
        }

        let hasDetails = false;
        let details;
        let hasResults = false;
        let result;

        function doResolve() {
            if (hasDetails && hasResults) {
                if (key !== result.key) {
                    key = result.key; // default to model key
                }
                resolve(
                    Object.assign(
                        {},
                        {
                            key,
                            models: result.models,
                            orderedModels: result.orderedModels,
                            queries: {
                                [key]: details,
                            },
                            rowCount: result.rowCount,
                            messages: result.messages,
                            caller,
                        }
                    )
                );
            }
        }

        if (userConfig.hasOwnProperty('sql')) {
            const saveInSession = userConfig.saveInSession === true;
            Query.executeSql(
                Object.assign({}, userConfig, {
                    method: 'POST',
                    requiredVersion: 17.1,
                    sql: userConfig.sql,
                    saveInSession,
                    containerFilter: userConfig.containerFilter ?? getContainerFilter(userConfig.containerPath),
                    success: json => {
                        result = handleSelectRowsResponse(json);
                        hasResults = true;
                        let resultSchemaQuery: SchemaQuery;

                        if (saveInSession) {
                            resultSchemaQuery = new SchemaQuery(userConfig.schemaName, json.queryName);
                            key = resultSchemaQuery.getKey();
                        } else {
                            resultSchemaQuery = schemaQuery;
                        }

                        // We're not guaranteed to have a schemaQuery provided. When executing with SQL
                        // the user only needs to supply a schemaName. If they do not saveInSession then
                        // a queryName is not generated and getQueryDetails() is unable to fetch details.
                        if (resultSchemaQuery) {
                            getQueryDetails(resultSchemaQuery)
                                .then(d => {
                                    hasDetails = true;
                                    details = d;
                                    doResolve();
                                })
                                .catch(error => reject(error));
                        } else {
                            hasDetails = true;
                            doResolve();
                        }
                    },
                    failure: (data, request) => {
                        console.error('There was a problem retrieving the data', data);
                        reject({
                            exceptionClass: data.exceptionClass,
                            message: data.exception,
                            status: request.status,
                        });
                    },
                })
            );
        } else {
            Query.selectRows(
                Object.assign({}, userConfig, {
                    requiredVersion: 17.1,
                    filterArray: userConfig.filterArray,
                    method: 'POST',
                    // put on this another parameter!
                    columns: userConfig.columns ? userConfig.columns : '*',
                    containerFilter: userConfig.containerFilter ?? getContainerFilter(userConfig.containerPath),
                    includeTotalCount: userConfig.includeTotalCount ?? false, // default to false to improve performance
                    success: json => {
                        result = handleSelectRowsResponse(json);
                        hasResults = true;
                        doResolve();
                    },
                    failure: (data, request) => {
                        console.error('There was a problem retrieving the data', data);
                        reject({
                            exceptionClass: data.exceptionClass,
                            message: data.exception,
                            schemaQuery,
                            status: request.status,
                        });
                    },
                })
            );

            getQueryDetails(userConfig)
                .then(d => {
                    hasDetails = true;
                    details = d;
                    doResolve();
                })
                .catch(error => {
                    console.error('There was a problem retrieving the data', error);
                    reject(error);
                });
        }
    });
}

export function handleSelectRowsResponse(json): any {
    const resolved = new URLResolver().resolveSelectRows(json);

    let count = 0,
        hasRows = false,
        models = {}, // TODO: Switch to Map
        orderedModels = {},
        qsKey = 'queries',
        rowCount = json.rowCount || 0;

    const metadataKey = resolved.metaData.id,
        modelKey = resolveKeyFromJson(resolved);

    // ensure id -- unfortunately, with normalizr 3.x there doesn't seem to be a way to generate the id
    // without attaching directly to the object
    resolved.rows.forEach((row: any) => {
        if (metadataKey) {
            if (row[metadataKey] !== undefined) {
                row._id_ = row[metadataKey].value;
                return;
            } else {
                console.error('Missing entry', metadataKey, row, resolved.schemaKey, resolved.queryName);
            }
        }
        row._id_ = count++;
    });

    const modelSchema = new schema.Entity(
        modelKey,
        {},
        {
            idAttribute: '_id_',
        }
    );

    const querySchema = new schema.Entity(
        qsKey,
        {},
        {
            idAttribute: queryJson => resolveKeyFromJson(queryJson),
        }
    );

    querySchema.define({
        rows: new schema.Array(modelSchema),
    });

    const instance = normalize(resolved, querySchema);

    Object.keys(instance.entities).forEach(key => {
        if (key !== qsKey) {
            rowCount = instance.entities[qsKey][key].rowCount;
            const rows = instance.entities[key];
            // cleanup generated ids
            Object.keys(rows).forEach(rowKey => {
                delete rows[rowKey]['_id_'];
            });
            models[key] = rows;
            orderedModels[key] = fromJS(instance.entities[qsKey][key].rows)
                .map(r => r.toString())
                .toList();
            hasRows = true;
        }
    });

    if (!hasRows) {
        models[modelKey] = {};
        orderedModels[modelKey] = List();
    }

    const messages = resolved.messages ? fromJS(resolved.messages) : List<Map<string, string>>();

    return {
        key: modelKey,
        messages,
        models,
        orderedModels,
        rowCount,
    };
}

// exported for jest testing
export function quoteValueColumnWithDelimiters(
    selectRowsResult: ISelectRowsResult,
    valueColumn: string,
    delimiter: string
): ISelectRowsResult {
    const rowMap = selectRowsResult.models[selectRowsResult.key];
    Object.keys(rowMap).forEach(key => {
        if (rowMap[key][valueColumn]) {
            Object.assign(rowMap[key], {
                [valueColumn]: {
                    value: quoteValueWithDelimiters(rowMap[key][valueColumn].value, delimiter),
                    displayValue: rowMap[key][valueColumn].displayValue ?? rowMap[key][valueColumn].value,
                    url: rowMap[key][valueColumn].url,
                },
            });
        }
    });
    return selectRowsResult;
}

export function searchRows(
    selectRowsConfig,
    token: any,
    valueColumn: string,
    delimiter: string,
    exactColumn?: string
): Promise<ISelectRowsResult> {
    return new Promise((resolve, reject) => {
        let exactFilters, qFilters;
        const baseFilters = selectRowsConfig.filterArray ? selectRowsConfig.filterArray : [];
        const maxRows = selectRowsConfig.maxRows !== undefined ? selectRowsConfig.maxRows : 100000;

        if (token) {
            if (exactColumn) {
                exactFilters = [Filter.create(exactColumn, token)].concat(baseFilters);
            }

            qFilters = [Filter.create('*', token, Filter.Types.Q)].concat(baseFilters);
        } else {
            qFilters = baseFilters;
        }

        const selects = [
            selectRowsDeprecated(
                Object.assign({}, selectRowsConfig, {
                    filterArray: qFilters,
                })
            ),
        ];

        if (exactFilters) {
            selects.push(
                selectRowsDeprecated(
                    Object.assign({}, selectRowsConfig, {
                        filterArray: exactFilters,
                    })
                )
            );
        }

        return Promise.all(selects)
            .then(allResults => {
                const [queryResults, exactResults] = allResults;

                let finalResults: ISelectRowsResult;
                if (exactResults && exactResults.rowCount > 0) {
                    finalResults = exactResults;

                    // TODO: This can cause the "rowCount" to be incorrect. Ideally, keep track of changes to give accurate count
                    if (finalResults.rowCount < maxRows) {
                        const { key } = finalResults;
                        const finalKeySet = finalResults.orderedModels[key].toOrderedSet().asMutable();

                        queryResults.orderedModels[key].forEach(key => {
                            finalKeySet.add(key);

                            if (finalKeySet.size >= maxRows) {
                                return false;
                            }
                        });

                        finalKeySet.forEach(rowKey => {
                            if (!finalResults.models[key].hasOwnProperty(rowKey)) {
                                finalResults.orderedModels[key] = finalResults.orderedModels[key].push(rowKey);
                                finalResults.models[key][rowKey] = queryResults.models[key][rowKey];
                            }
                        });
                    }
                } else {
                    finalResults = queryResults;
                }

                resolve(quoteValueColumnWithDelimiters(finalResults, valueColumn, delimiter));
            })
            .catch(reason => {
                reject(reason);
            });
    });
}

interface ErrorMessage {
    // msg: string // Duplicate
    message: string;
}

interface InsertRowError {
    errors: ErrorMessage[];
}

export class InsertRowsErrorResponse extends ImmutableRecord({
    errors: undefined,
    errorCount: 0,
    exception: undefined,
    extraContext: undefined,
    success: false,
}) {
    declare errors: InsertRowError[];
    declare errorCount: number;
    declare exception: string;
    declare extraContext: any;
    declare success: boolean;

    getErrorMessage() {
        return this.exception; // TODO make this more user friendly by including row number and excluding techincal details
    }
}

export interface InsertRowsOptions
    extends Omit<Query.QueryRequestOptions, 'apiVersion' | 'schemaName' | 'queryName' | 'rows'> {
    fillEmptyFields?: boolean;
    rows: List<any>;
    schemaQuery: SchemaQuery;
}

export class InsertRowsResponse extends ImmutableRecord({
    rows: Array<any>(),
    schemaQuery: undefined,
    error: undefined,
    transactionAuditId: undefined,
}) {
    declare rows: any[];
    declare schemaQuery: SchemaQuery;
    declare error: InsertRowsErrorResponse;
    declare transactionAuditId?: number;

    getFilter(): Filter.IFilter {
        const rowIds = [];

        // insertRows returns properties with differing case
        this.rows
            .map(row => caseInsensitive(row, 'rowId'))
            .forEach(rowId => {
                if (rowId !== undefined) {
                    rowIds.push(rowId);
                }
            });

        return Filter.create('RowId', rowIds, Filter.Types.IN);
    }
}

export function insertRows(options: InsertRowsOptions): Promise<InsertRowsResponse> {
    return new Promise((resolve, reject) => {
        const { fillEmptyFields, rows, schemaQuery, ...insertRowsOptions } = options;
        const _rows = fillEmptyFields === true ? ensureAllFieldsInAllRows(rows) : rows;

        Query.insertRows({
            autoFormFileData: true,
            ...insertRowsOptions,
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            rows: _rows.toArray(),
            apiVersion: 13.2,
            success: (response, request) => {
                if (processRequest(response, request, reject)) return;

                resolve(
                    new InsertRowsResponse({
                        schemaQuery,
                        rows: response.rows,
                        transactionAuditId: response.transactionAuditId,
                    })
                );
            },
            failure: error => {
                console.error(error);
                reject(
                    new InsertRowsResponse({
                        schemaQuery,
                        error,
                    })
                );
            },
        });
    });
}

// Ensures that the List of row objects are fully (as opposed to sparsely) populated. This avoids the server
// failing to map columns on sparsely populated data sets.
// As an example:
//
// [
//     {},
//     {"columnA": "AA"},
//     {"columnD": "DD"}
// ]
//
// becomes:
//
// [
//     {"columnA": null, "columnD": null},
//     {"columnA": "AA", "columnD": null},
//     {"columnA": null, "columnD": "DD"}
// ]
function ensureAllFieldsInAllRows(rows: List<any>): List<any> {
    let masterRecord = Map<string, any>().asMutable();

    rows.forEach(row => {
        row.keySeq().forEach(key => {
            masterRecord.set(key, null);
        });
    });

    masterRecord = masterRecord.asImmutable();

    return rows.reduce(
        (allFieldRows, row) => allFieldRows.push(ensureNullForUndefined(masterRecord.merge(row))),
        List<Map<string, any>>()
    );
}

// undefined is not a valid JSON value so the values must be mapped to null.
function ensureNullForUndefined(row: Map<string, any>): Map<string, any> {
    return row.reduce((map, v, k) => map.set(k, v === undefined ? null : v), Map<string, any>());
}

interface UpdateRowsOptions extends Omit<Query.QueryRequestOptions, 'schemaName' | 'queryName'> {
    schemaQuery: SchemaQuery;
}

interface UpdateRowsResponse {
    rows: any[];
    schemaQuery: SchemaQuery;
    transactionAuditId?: number;
}

export function updateRows(options: UpdateRowsOptions): Promise<UpdateRowsResponse> {
    return new Promise((resolve, reject) => {
        const { schemaQuery, ...updateRowOptions } = options;
        Query.updateRows({
            autoFormFileData: true,
            ...updateRowOptions,
            queryName: schemaQuery.queryName,
            schemaName: schemaQuery.schemaName,
            success: (response, request) => {
                if (processRequest(response, request, reject)) return;

                resolve(
                    Object.assign(
                        {},
                        {
                            schemaQuery,
                            rows: response.rows,
                            transactionAuditId: response.transactionAuditId,
                        }
                    )
                );
            },
            failure: error => {
                console.error(error);
                reject(
                    Object.assign(
                        {},
                        {
                            schemaQuery,
                        },
                        error
                    )
                );
            },
        });
    });
}

interface DeleteRowsOptions extends Omit<Query.QueryRequestOptions, 'schemaName' | 'queryName'> {
    schemaQuery: SchemaQuery;
}

export function deleteRows(options: DeleteRowsOptions): Promise<any> {
    return new Promise((resolve, reject) => {
        const { schemaQuery, ...deleteRowsOptions } = options;
        Query.deleteRows({
            apiVersion: 13.2,
            ...deleteRowsOptions,
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            success: response => {
                resolve(
                    Object.assign(
                        {},
                        {
                            schemaQuery: options.schemaQuery,
                            rows: response.rows,
                            transactionAuditId: response.transactionAuditId,
                        }
                    )
                );
            },
            failure: error => {
                reject(
                    Object.assign(
                        {},
                        {
                            schemaQuery: options.schemaQuery,
                        },
                        error
                    )
                );
            },
        });
    });
}

export enum InsertOptions {
    IMPORT,
    MERGE,
    UPDATE,
}

export enum InsertFormats {
    csv = 'csv',
    tsv = 'tsv',
}

export interface IImportData {
    file?: File;
    // must contain file or text but not both
    format?: InsertFormats;
    importLookupByAlternateKey?: boolean;
    importUrl?: string;
    insertOption?: string;
    queryName: string;
    saveToPipeline?: boolean;
    schemaName: string;
    text?: string;
    useAsync?: boolean;
}

export function importData(config: IImportData): Promise<any> {
    return new Promise((resolve, reject) => {
        QueryDOM.importData(
            Object.assign({}, config, {
                success: response => {
                    if (response && response.exception) {
                        reject(response);
                    }
                    resolve(response);
                },
                failure: error => {
                    reject(error);
                },
            })
        );
    });
}

export function processRequest(response: any, request: any, reject: (reason?: any) => void): boolean {
    if (!response && request?.responseText) {
        const resp = JSON.parse(request.responseText);
        if (!resp?.success) {
            console.error(resp);
            reject(resp);
            return true;
        }
    }

    return false;
}

/**
 * Provides the default ContainerFilter to utilize when requesting data cross-folder.
 * This ContainerFilter is applied to all `executeSql` and `selectRows` requests made via the methods
 * provided by `@labkey/components`.
 * @private
 */
export function getContainerFilter(containerPath?: string, moduleContext?: ModuleContext): Query.ContainerFilter {
    // Check to see if product projects support is enabled.
    if (!isProductProjectsEnabled(moduleContext)) {
        return undefined;
    }

    // When all folder filtering is enabled resolve data across all folders.
    if (isAllProductFoldersFilteringEnabled(moduleContext)) {
        return Query.ContainerFilter.allInProjectPlusShared;
    }

    // When requesting data from a top-level folder context the ContainerFilter filters
    // "down" the folder hierarchy for data.
    if (isProjectContainer(containerPath)) {
        return Query.ContainerFilter.currentAndSubfoldersPlusShared;
    }

    // When requesting data from a sub-folder context the ContainerFilter filters
    // "up" the folder hierarchy for data.
    return Query.ContainerFilter.currentPlusProjectAndShared;
}

/**
 * Provides the configured ContainerFilter to utilize when requesting data that is being read
 * within a folder context.
 * @private
 */
export function getContainerFilterForFolder(
    containerPath?: string,
    moduleContext?: ModuleContext
): Query.ContainerFilter {
    // Check to see if product projects support is enabled.
    if (!isProductProjectsEnabled(moduleContext)) {
        return undefined;
    }

    if (isProductProjectsDataListingScopedToProject(moduleContext)) {
        // When requesting data from a top-level folder context the ContainerFilter filters
        // "down" the folder hierarchy for data.
        if (isProjectContainer(containerPath)) {
            if (isAllProductFoldersFilteringEnabled(moduleContext)) {
                return Query.ContainerFilter.allInProjectPlusShared;
            }
            return Query.ContainerFilter.currentPlusProjectAndShared;
        }

        // When listing data in a folder scope returned data to the current
        // folder when the experimental feature is enabled.
        return Query.ContainerFilter.current;
    }

    // When requesting data from a top-level folder context the ContainerFilter filters
    // "down" the folder hierarchy for data.
    if (isProjectContainer(containerPath)) {
        return Query.ContainerFilter.currentAndSubfoldersPlusShared;
    }

    // When requesting data from a sub-folder context the ContainerFilter filters
    // "up" the folder hierarchy for data.
    return Query.ContainerFilter.currentPlusProjectAndShared;
}

/**
 * Provides the default ContainerFilter to utilize when requesting data for insert cross-folder.
 * This ContainerFilter must be explicitly applied to be respected.
 * @private
 */
export function getContainerFilterForLookups(moduleContext?: ModuleContext): Query.ContainerFilter {
    // Check to see if product projects support is enabled.
    if (!isProductProjectsEnabled(moduleContext)) {
        return undefined;
    }

    // When all folder filtering is enabled resolve lookups against all folders
    // within the top-level folder plus shared.
    if (isAllProductFoldersFilteringEnabled(moduleContext)) {
        return Query.ContainerFilter.allInProjectPlusShared;
    }

    // When inserting data from a top-level folder or a sub-folder context
    // the ContainerFilter filters "up" the folder hierarchy for data.
    return Query.ContainerFilter.currentPlusProjectAndShared;
}

export function selectDistinctRows(options: Query.SelectDistinctOptions): Promise<Query.SelectDistinctResponse> {
    return new Promise((resolve, reject) => {
        Query.selectDistinctRows({
            method: 'POST',
            ...options,
            containerFilter: options.containerFilter ?? getContainerFilter(options.containerPath),
            success: response => {
                resolve(response);
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}

export function loadQueries(schemaQueries: SchemaQuery[]): Promise<QueryInfo[]> {
    return Promise.all(
        schemaQueries.map(sq => getQueryDetails({ schemaName: sq.schemaName, queryName: sq.queryName }))
    );
}

/**
 * Loads a set of QueryInfo's sourced from a table (tableSchemaQuery)
 * where the key field (tableFieldKey) specifies the query name on the specified schema (targetSchemaName).
 *
 * Example:
 * The table "exp.SampleSets" contains a row per sample type defined in the container. The name of the sample type is
 * found on the "Name" column. The sample types themselves are on the "samples" schema. Here is what the parameters
 * would look like to load sample type QueryInfo's for each row in the "exp.SampleSets" table.
 *
 * tableSchemaQuery: exp.SampleSets
 * tableFieldKey: Name
 * targetSchemaName: samples
 *
 * @param tableSchemaQuery - The "meta" table containing a row per query found on the "targetSchemaName" schema.
 * @param tableFieldKey - The fieldKey on a given row in the "tableSchemaQuery" that contains the name of the query.
 * @param targetSchemaName - The target schemaName where the queries found on "tableFieldKey" can be found.
 * @param containerFilter - Optional Query.ContainerFilter applied to tables request.
 * @param filters - Optional Query filters applied to tables request.
 */
export async function loadQueriesFromTable(
    tableSchemaQuery: SchemaQuery,
    tableFieldKey: string,
    targetSchemaName: string,
    containerFilter?: Query.ContainerFilter,
    filters?: Filter.IFilter[]
): Promise<QueryInfo[]> {
    const { schemaName, queryName, viewName } = tableSchemaQuery;
    const info = await getQueryDetails({ queryName, schemaName });
    const queryNameField = info.getColumn(tableFieldKey);

    if (queryNameField) {
        const { key, models } = await selectRowsDeprecated({
            containerFilter,
            columns: info
                .getPkCols()
                .map(col => col.fieldKey)
                .toSet()
                .add(queryNameField.name)
                .join(','),
            filterArray: filters,
            queryName,
            schemaName,
            viewName,
        });

        const schemaQueries: SchemaQuery[] = Object.values(models[key])
            .map(row => caseInsensitive(row, queryNameField.name)?.value)
            .filter(query => query !== undefined)
            .map(query => new SchemaQuery(targetSchemaName, query));

        return loadQueries(schemaQueries);
    }

    return [];
}
