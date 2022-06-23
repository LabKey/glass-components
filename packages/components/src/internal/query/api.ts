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
import { fromJS, List, Map, OrderedMap, Record as ImmutableRecord, Set } from 'immutable';
import { normalize, schema } from 'normalizr';
import { Filter, Query, QueryDOM } from '@labkey/api';

import { getQueryMetadata } from '../global';
import { resolveKeyFromJson } from '../../public/SchemaQuery';
import { isProjectContainer, isProductProjectsEnabled } from '../app/utils';
import {
    caseInsensitive,
    QueryColumn,
    QueryInfo,
    QueryInfoStatus,
    QueryLookup,
    resolveSchemaQuery,
    SchemaDetails,
    SchemaQuery,
    URLResolver,
    ViewInfo,
} from '../..';
import { quoteValueWithDelimiters } from '../util/utils';

let queryDetailsCache: Record<string, Promise<QueryInfo>> = {};

export function invalidateFullQueryDetailsCache(): void {
    queryDetailsCache = {};
}

function getQueryDetailsCacheKey(schemaQuery: SchemaQuery, containerPath?: string, fk?: string): string {
    return '' + resolveSchemaQuery(schemaQuery) + (fk ? '|' + fk : '') + (containerPath ? '|' + containerPath : '');
}

export function invalidateQueryDetailsCache(schemaQuery: SchemaQuery, containerPath?: string, fk?: string): void {
    const key = getQueryDetailsCacheKey(schemaQuery, containerPath, fk);
    invalidateQueryDetailsCacheKey(key);
}

/** @deprecated Use invalidateQueryDetailsCache() instead */
export function invalidateQueryDetailsCacheKey(key: string): void {
    delete queryDetailsCache[key];
}

export interface GetQueryDetailsOptions {
    containerPath?: string;
    fk?: string;
    lookup?: QueryLookup;
    queryName: string;
    schemaName: string;
}

export function getQueryDetails(options: GetQueryDetailsOptions): Promise<QueryInfo> {
    const { containerPath, queryName, schemaName, fk, lookup } = options;
    const schemaQuery = SchemaQuery.create(schemaName, queryName);
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
        const schemaQuery = SchemaQuery.create(_schemaName, _queryName);

        let columns = OrderedMap<string, QueryColumn>();
        rawQueryInfo.columns.forEach(rawColumn => {
            columns = columns.set(rawColumn.fieldKey.toLowerCase(), applyColumnMetadata(schemaQuery, rawColumn));
        });

        let schemaMeta = metadata.getIn(['schema', _schemaName.toLowerCase(), 'queryDefaults']);

        if (schemaMeta) {
            schemaMeta = schemaMeta.toJS();
        }

        // see if metadata is defined for this query
        let queryMeta = metadata.getIn([
            'schema',
            _schemaName.toLowerCase(),
            'query',
            _queryName.toLowerCase(),
        ]);

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
                let viewInfo = ViewInfo.create(rawViewInfo);

                if (removedViewColumns.size) {
                    viewInfo = viewInfo.merge({
                        columns: viewInfo.columns
                            .filter(vc => removedViewColumns.get(vc.fieldKey.toLowerCase()) === undefined)
                            .toList(),
                    }) as ViewInfo;
                }

                columns = applyViewColumns(columns, schemaQuery, rawViewInfo);

                views.set(viewInfo.name.toLowerCase(), viewInfo);
            });
            views = views.asImmutable();
        }

        // TODO get rid of the splitCamelCase?  It's only sometimes the right thing to do.
        const queryLabel = Parsers.splitCamelCase(rawQueryInfo.title || _queryName);

        const defaultQueryMeta = {
            queryLabel,
            plural: queryLabel,
            schemaLabel: Parsers.splitCamelCase(_schemaName),
            singular: queryLabel,
        };

        queryInfo = Object.assign({}, rawQueryInfo, schemaMeta, defaultQueryMeta, queryMeta, {
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

function applyColumnMetadata(schemaQuery: SchemaQuery, rawColumn: any): QueryColumn {
    let columnMetadata;
    const metadata = getQueryMetadata();

    // lookup to see if metadata needs to be applied
    if (rawColumn && rawColumn.fieldKey) {
        let allMeta = metadata.getIn(['columnDefaults', rawColumn.fieldKey.toLowerCase()]);

        if (allMeta) {
            allMeta = allMeta.toJS();
        }

        let schemaMeta = metadata.getIn([
            'schema',
            schemaQuery.schemaName.toLowerCase(),
            'columnDefaults',
            rawColumn.fieldKey.toLowerCase(),
        ]);

        if (schemaMeta) {
            schemaMeta = schemaMeta.toJS();
        }

        let columnMeta = metadata.getIn([
            'schema',
            schemaQuery.schemaName.toLowerCase(),
            'query',
            schemaQuery.queryName.toLowerCase(),
            'column',
            rawColumn.fieldKey.toLowerCase(),
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
                rawColumn.fieldKey.toLowerCase(),
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

    return QueryColumn.create(Object.assign({}, rawColumn, columnMetadata));
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

class Parsers {
    static splitCamelCase(value) {
        if (value) {
            return (
                value
                    // insert a space before all caps
                    .replace(/([A-Z])/g, ' $1')
                    // uppercase the first character
                    .replace(/^./, function (str) {
                        return str.toUpperCase();
                    })
                    .trim()
            );
        }

        return value;
    }
}

class Renderers {
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
        const types = Set.of(rawColumn.type.toLowerCase(), rawColumn.friendlyType.toLowerCase());

        if (value === undefined) {
            if (rawColumn.multiValue === true) {
                value = 'MultiValueColumnRenderer';
            } else if (rawColumn.name === 'harvest') {
                value = 'MaterialLookupColumnRenderer';
            } else if (types.contains('file')) {
                value = 'FileColumnRenderer';
            }
        }

        return value;
    }

    static applyDetailRenderer(columnMetadata, rawColumn, metadata) {
        let value = this._check(columnMetadata, rawColumn, 'detailRenderer', metadata);
        const types = Set.of(rawColumn.type.toLowerCase(), rawColumn.friendlyType.toLowerCase());

        if (value === undefined) {
            if (rawColumn.multiValue === true) {
                value = 'MultiValueDetailRenderer';
            } else if (types.contains('file')) {
                value = 'FileColumnRenderer';
            }
        }

        return value;
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
    totalRows: number;
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
            schemaQuery = SchemaQuery.create(userConfig.schemaName, userConfig.queryName);
            key = resolveSchemaQuery(schemaQuery);
        }

        let hasDetails = false;
        let details;
        let hasResults = false;
        let result;

        function doResolve() {
            if (hasDetails && hasResults) {
                if (key !== result.key) {
                    console.warn(
                        `Mismatched keys between query and model results. query: "${key}", model: "${result.key}".`
                    );
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
                            totalRows: result.rowCount, // TODO: Why do we rename rowCount to totalRows? Seems unnecessary.
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
                            resultSchemaQuery = SchemaQuery.create(userConfig.schemaName, json.queryName);
                            key = resolveSchemaQuery(resultSchemaQuery);
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
                if (exactResults && exactResults.totalRows > 0) {
                    finalResults = exactResults;

                    // TODO: This can cause the "totalRows" to be incorrect. Ideally, keep track of changes to give accurate count
                    if (finalResults.totalRows < maxRows) {
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
export function getContainerFilter(containerPath?: string): Query.ContainerFilter {
    // Check experimental flag to see if cross-folder data support is enabled.
    if (!isProductProjectsEnabled()) {
        return undefined;
    }

    const isProject = isProjectContainer(containerPath);

    // When requesting data from a top-level folder context the ContainerFilter filters
    // "down" the folder hierarchy for data.
    if (isProject) {
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
export function getContainerFilterForInsert(): Query.ContainerFilter {
    // Check to see if product projects support is enabled.
    if (!isProductProjectsEnabled()) {
        return undefined;
    }

    // When inserting data from a top-level folder or a sub-folder context
    // the ContainerFilter filters "up" the folder hierarchy for data.
    return Query.ContainerFilter.currentPlusProjectAndShared;
}

export interface SelectDistinctResponse {
    queryName: string;
    schemaName: string;
    values: any[];
}

export function selectDistinctRows(
    selectDistinctOptions: Query.SelectDistinctOptions
): Promise<SelectDistinctResponse> {
    return new Promise((resolve, reject) => {
        Query.selectDistinctRows({
            ...selectDistinctOptions,
            success: response => {
                resolve({
                    values: response['values'],
                    schemaName: response['schemaName'],
                    queryName: response['queryName'],
                });
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}

/**
 * Recursively processes raw schema information into a Map<string, SchemaDetails>.
 * Schemas are mapped by their "fullyQualifiedName".
 * @private
 */
export function processSchemas(schemas: any, allSchemas?: Map<string, SchemaDetails>): Map<string, SchemaDetails> {
    let top = false;
    if (allSchemas === undefined) {
        top = true;
        allSchemas = Map<string, SchemaDetails>().asMutable();
    }

    for (const schemaName in schemas) {
        if (schemas.hasOwnProperty(schemaName)) {
            const schema = schemas[schemaName];
            allSchemas.set(schema.fullyQualifiedName.toLowerCase(), SchemaDetails.create(schema));
            if (schema.schemas !== undefined) {
                processSchemas(schema.schemas, allSchemas);
            }
        }
    }

    return top ? allSchemas.asImmutable() : allSchemas;
}
