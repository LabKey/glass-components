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
import { fromJS, List, Map } from 'immutable'
import { ActionURL, Filter } from '@labkey/api'
import { AppURL } from '@glass/base'

interface MapURLOptions {
    column: any
    url: string
    row: any
    query?: string
    schema?: string
}

export class URLResolver {

    mappers: List<URLMapper>;

    constructor() {
        this.mappers = List<URLMapper>([

            new ActionMapper('experiment', 'showDataClass', (row, column) => {
                let url = ['rd', 'dataclass'];

                // TODO: Deal with junction lookup
                if (column.has('lookup')) {
                    url.push(row.get('displayValue').toString());
                }
                else {
                    url.push(row.get('value').toString());
                }

                return AppURL.create(...url);
            }),


            new ActionMapper('experiment', 'showData', (row) => {
                const targetURL = row.get('url');
                const params = ActionURL.getParameters(targetURL);

                let url = ['rd', 'expdata', params.rowId];
                return AppURL.create(...url);
            }),

            new ActionMapper('experiment', 'showMaterialSource', (row, column) => {
                let url = ['rd', 'samples'];

                if (row.has('data')) {
                    //Search link doesn't use the same url
                    url = ['samples', row.get('data').get('name')];
                }
                else if (column.has('lookup')) {
                    url.push(row.get('displayValue').toString());
                }
                else {
                    url.push(row.get('value').toString());
                }

                return AppURL.create(...url);
            }),

            new ActionMapper('experiment', 'showMaterial', (row) => {
                const targetURL = row.get('url');
                const params = ActionURL.getParameters(targetURL);
                let rowId = params.rowId;

                const url = ['rd', 'samples', rowId];

                if (rowId !== undefined) {
                    return AppURL.create(...url);
                }
            }),

            new ActionMapper('assay', 'assayDetailRedirect', (row) => {
                if (row.has('url')) {
                    const rowURL = row.get('url');
                    const params = ActionURL.getParameters(rowURL);

                    // expecting a parameter of runId=<runId>
                    if (params.hasOwnProperty('runId')) {
                        let runId = params['runId'];

                        const url = ['rd', 'assayrun', runId];
                        return AppURL.create(...url);
                    }
                }
            }),

            new ActionMapper('assay', 'assayRuns', (row, column, schema) => {
                if (row.has('url')) {
                    const url = row.get('url');

                    // expecting a filter on Batch/RowId~eq=<rowId>
                    let filters = Filter.getFiltersFromUrl(url, 'Runs');
                    if (filters.length > 0) {
                        for (let i=0; i < filters.length; i++) {
                            if (filters[i].getColumnName().toLowerCase() === 'batch/rowid') {
                                let rowId = filters[i].getValue();

                                // expecting a schema of assay.<provider>.<protocol>
                                if (schema.indexOf('assay.') === 0) {
                                    let url = ['assays'].concat(schema.replace('assay.', '').split('.'));
                                    url.push('batches', rowId);

                                    return AppURL.create(...url);
                                }
                            }
                        }
                    }
                }
            }),

            new ActionMapper('assay', 'assayBegin', (row) => {
                const url = row.get('url');
                if (url) {
                    const params = ActionURL.getParameters(url);

                    if (params.rowId) {
                        return AppURL.create('assays', params.rowId);
                    }
                }
            }),

            new ActionMapper('assay', 'assayResults', (row) => {
                const url = row.get('url');
                if (url) {
                    const params = ActionURL.getParameters(url);
                    const rowId = params.rowId;

                    if (rowId) {
                        delete params.rowId; // strip the rowId and pass through the remaining params
                        return AppURL.create('assays', rowId, 'data').addParams(params);
                    }
                }
            }),

            // 33680: Prevent remapping issues-details
            new ActionMapper('issues', 'details', () => false),

            new ActionMapper('issues', 'list', (row) => {
                const url = row.get('url');
                if (url) {
                    const params = ActionURL.getParameters(url);
                    if (params.issueDefName) {
                        return AppURL.create('workflow', params.issueDefName);
                    }
                }
            }),

            new ActionMapper('list', 'details', (row, column) => {
                if (!column.has('lookup')) {
                    const params = ActionURL.getParameters(row.get('url'));

                    let parts = [
                        'q',
                        'lists',
                        params.listId,
                        params.pk
                    ];

                    return AppURL.create(...parts);
                }
            }),

            new ActionMapper('list', 'grid', (row, column) => {
                if (!column.has('lookup')) {
                    const params = ActionURL.getParameters(row.get('url'));

                    let parts = [
                        'q',
                        'lists',
                        params.listId
                    ];

                    return AppURL.create(...parts);
                }
            }),

            new ActionMapper('query', 'detailsQueryRow', (row) => {
                const params = ActionURL.getParameters(row.get('url'));
                const schemaName = params.schemaName;
                const queryName = params['query.queryName'];

                if (schemaName && queryName) {
                    if (schemaName === 'labbook' && queryName === 'LabBookExperiment' && params.RowId !== undefined) {
                        let parts = [
                            'experiments',
                            params.RowId
                        ];

                        return AppURL.create(...parts);
                    }

                    const key = params.keyValue ? params.keyValue : params.RowId;

                    if (key !== undefined) {
                        let parts = [
                            'q',
                            schemaName,
                            queryName,
                            key
                        ];

                        return AppURL.create(...parts);
                    }
                }
            }),

            new ActionMapper('labbook', 'experiment', (row) => {
                const url = row.get('url');
                if (url) {
                    const params = ActionURL.getParameters(url);
                    if (params.labBookId) {
                        return AppURL.create('experiments', params.labBookId);
                    }
                }
            }),

            new ActionMapper('core', 'downloadFileLink', () => false),

            new LookupMapper('q', {
                'exp-dataclasses': (row) => AppURL.create('rd', 'dataclass', row.get('displayValue')),
                'exp-runs': (row) => {
                    const runId = row.get('value');
                    if (!isNaN(parseInt(runId))) {
                        return AppURL.create('rd', 'assayrun', runId);
                    }
                    return false;
                },
                'issues': () => false // 33680: Prevent remapping issues lookup
            })
        ]);
    }

    private mapURL(mapper: MapURLOptions): string {

        let _url = this.mappers.toSeq()
            .map(m =>
                m.resolve(mapper.url, mapper.row, mapper.column, mapper.schema, mapper.query))
            .filter(v => v !== undefined)
            .first();

        if (_url instanceof AppURL) {
            return '#' + _url.toString();
        }

        if (_url !== false && LABKEY.devMode) {
            console.warn('Unable to map URL:', mapper.url);
        }

        return mapper.url;
    }

    /**
     * Returns a Promise resolving a valid selectRowsResult with URLs replaced with those mapped by this
     * URLResolver.
     * @param json - selectRowsResult
     * @returns {Promise<T>}
     */
    public resolveSelectRows(json): Promise<any> {
        return new Promise((resolve) => {
            let resolved = fromJS(JSON.parse(JSON.stringify(json)));

            if (resolved.get('rows').count()) {

                let schema = resolved.get('schemaName').toJS().join('.');
                let query = resolved.get('queryName');
                let fields = resolved.getIn(['metaData', 'fields'])
                    .reduce((fields, column) => {
                        return fields.set(column.get('fieldKey'), column);
                    }, Map());

                let rows = resolved.get('rows')
                    .map(row => {
                        return row.map((cell, fieldKey) => {

                            // single-value cells
                            if (Map.isMap(cell) && cell.has('url')) {
                                return cell.set('url', this.mapURL({
                                    url: cell.get('url'),
                                    row: cell,
                                    column: fields.get(fieldKey),
                                    schema,
                                    query
                                }));
                            }

                            // multi-value cells
                            if (List.isList(cell) && cell.size > 0) {
                                return cell.map((innerCell) => {
                                    if (Map.isMap(innerCell) && innerCell.has('url')) {
                                        return innerCell.set('url', this.mapURL({
                                            url: innerCell.get('url'),
                                            row: innerCell,
                                            column: fields.get(fieldKey),
                                            schema,
                                            query
                                        }));
                                    }

                                    return innerCell;
                                }).toList();
                            }

                            return cell;
                        });
                    });

                resolved = resolved.set('rows', rows);
            }

            resolve(resolved.toJS());
        });
    }

    // ToDo: this is rather fragile and data specific. this should be reworked with the mappers and rest of the resolvers to provide for more thorough coverage of our incoming URLs
    public resolveSearchUsingIndex(json): Promise<List<Map<any, any>>> {
        return new Promise((resolve) => {
            let resolved = fromJS(JSON.parse(JSON.stringify(json)));

            if (resolved.get('hits').count()) {

                let rows = resolved.get('hits').map(row => {
                    if (row && row.has('url')) {
                        let url = row.get('url'),
                            id = row.get('id'),
                            column = List(); // no columns, so providing an empty List to the resolver
                        let query;

                        // TODO: add reroute for assays/runs when pages and URLs are decided
                        if (row.has('data') && row.hasIn(['data', 'dataClass'])) {
                            query = row.getIn(['data', 'dataClass', 'name']); // dataClass is nested Map/Object inside of 'data' return
                            url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                            return row.set('url', this.mapURL({url, row, column, query}));
                        }
                        else if (id.indexOf('materialSource') >= 0 ) {
                            query = row.getIn(['data', 'name']);
                            url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                            return row.set('url', this.mapURL({url, row, column, query}));
                        }
                        else if (id.indexOf('assay') >= 0) {
                            query = row.getIn(['title']);
                            url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                            return row.set('url', this.mapURL({url, row, column, query}));
                        }
                        else if (id.indexOf('material') != -1 && row.hasIn(['data', 'sampleSet'])) {
                            query = row.getIn(['data', 'sampleSet', 'name']);
                            return row.set('url', this.mapURL({url, row, column, query}));
                        }
                        else if (row.has('data') && row.hasIn(['data', 'id'])) {
                            query = row.getIn(['data', 'type']);
                            return row.set('url', this.mapURL({url, row, column, query}))
                        }
                    }
                    return row;
                });

                resolved = resolved.set('hits', rows);
            }

            resolve(resolved.toJS());
        });
    }
}

interface URLMapper {
    resolve(url, row, column, schema, query): AppURL | boolean
}

class ActionMapper implements URLMapper {

    controller: string;
    action: string;
    resolver: (row, column, schema, query) => AppURL | boolean;

    constructor(controller: string, action: string, resolver: (row?, column?, schema?, query?) => AppURL | boolean) {
        this.controller = controller.toLowerCase();
        this.action = action.toLowerCase();
        this.resolver = resolver;
    }

    resolve(url, row, column, schema, query): AppURL | boolean {
        const parsed = parsePathName(url);

        if (parsed.action === this.action && parsed.controller === this.controller) {
            return this.resolver(row, column, schema, query);
        }
    }
}

class LookupMapper implements URLMapper {

    defaultPrefix: string;
    lookupResolvers: any;

    constructor(defaultPrefix: string, lookupResolvers) {
        this.defaultPrefix = defaultPrefix;
        this.lookupResolvers = lookupResolvers;
    }

    resolve(url, row, column, schema, query): AppURL {
        if (column.has('lookup')) {
            var lookup = column.get('lookup'),
                schema = lookup.get('schemaName'),
                query = lookup.get('queryName'),
                queryKey = [schema, query].join('-').toLowerCase(),
                schemaKey = schema.toLowerCase();

            if (this.lookupResolvers) {
                if (this.lookupResolvers[queryKey]) {
                    return this.lookupResolvers[queryKey](row, column, schema, query);
                }
                if (this.lookupResolvers[schemaKey]) {
                    return this.lookupResolvers[schemaKey](row, column, schema, query);
                }
            }

            let parts = [
                this.defaultPrefix,
                lookup.get('schemaName'),
                lookup.get('queryName'),
                row.get('value').toString()
            ];

            return AppURL.create(...parts);
        }
    }
}

// TODO: This is copied from LABKEY.ActionURL -- make public?
export function parsePathName(path: string) {
    const qMarkIdx = path.indexOf('?');
    if (qMarkIdx > -1) {
        path = path.substring(0, qMarkIdx);
    }
    const start = ActionURL.getContextPath().length;
    const end = path.lastIndexOf('/');
    let action = path.substring(end + 1);
    path = path.substring(start, end);

    let controller = null;

    const dash = action.indexOf('-');
    if (0 < dash) {
        controller = action.substring(0, dash);
        action = action.substring(dash + 1);
    }
    else {
        const slash = path.indexOf('/', 1);
        if (slash < 0) // 21945: e.g. '/admin'
            controller = path.substring(1);
        else
            controller = path.substring(1, slash);
        path = path.substring(slash);
    }

    const dot = action.indexOf('.');
    if (0 < dot) {
        action = action.substring(0, dot);
    }

    return {
        controller: decodeURIComponent(controller).toLowerCase(),
        action: decodeURIComponent(action).toLowerCase(),
        containerPath: decodeURI(path)
    };
}