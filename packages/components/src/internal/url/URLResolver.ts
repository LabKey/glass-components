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
import { fromJS, List, Map, OrderedSet } from 'immutable';
import { ActionURL, Experiment, Filter, getServerContext, Query } from '@labkey/api';

import { LineageLinkMetadata } from '../components/lineage/types';

import { FREEZER_MANAGER_APP_PROPERTIES, SAMPLES_KEY } from '../app/constants';

import { getCurrentAppProperties, getProjectPath } from '../app/utils';

import { QueryInfo } from '../../public/QueryInfo';

import { QueryColumn } from '../../public/QueryColumn';

import { SearchResult } from '../components/search/actions';

import { AppURL, createProductUrl, createProductUrlFromParts } from './AppURL';
import { AppRouteResolver } from './models';
import { encodeListResolverPath } from './utils';

let resolvers = OrderedSet<AppRouteResolver>();

let urlMappers: List<URLMapper> = List<URLMapper>();

export type URLMapperResolverValue = AppURL | string | boolean;
export type URLMapperResolver = (
    url: string,
    row: Map<string, any>,
    column: QueryColumn,
    schemaName: string,
    queryName: string
) => URLMapperResolverValue;

export interface URLMapper {
    resolve: URLMapperResolver;
}

export namespace URLService {
    export function getUrlMappers(): List<URLMapper> {
        return urlMappers;
    }

    export function registerAppRouteResolvers(...appRouteResolvers: AppRouteResolver[]): void {
        appRouteResolvers.forEach(resolver => {
            if (resolver) {
                resolvers = resolvers.add(resolver);
            }
        });
    }

    export async function resolveRedirect(path: string): Promise<string> {
        const resolver = resolvers.find(r => r.matches(path));

        if (resolver === undefined) return undefined;

        const parts = path.split('/');
        parts.shift(); // account for initial '/'
        const redirectPath = await resolver.fetch(parts);
        return redirectPath?.toString();
    }

    export function registerURLMappers(...mappers: URLMapper[]): void {
        urlMappers = urlMappers.concat(mappers) as List<URLMapper>;
    }

    export function clearCache(cacheKey?: string): void {
        resolvers.forEach(resolver => {
            if (!cacheKey || resolver.cacheName === cacheKey) resolver.clearCache?.();
        });
    }
}

export type LookupResolver = (
    row: Map<string, any>,
    column?: QueryColumn,
    schemaName?: string,
    queryName?: string
) => URLMapperResolverValue;

export class ActionMapper implements URLMapper {
    // flag
    controller: string;
    action: string;
    resolver: LookupResolver;
    productId: string;

    constructor(controller: string, action: string, resolver: LookupResolver, productId?: string) {
        this.controller = controller.toLowerCase();
        this.action = action.toLowerCase();
        this.resolver = resolver;
        this.productId = productId;
    }

    getProductUrl = (url: AppURL): AppURL | string => {
        return createProductUrl(this.productId, undefined, url);
    };

    resolve: URLMapperResolver = (url, row, column, schemaName, queryName) => {
        if (url) {
            const parsed = ActionURL.getPathFromLocation(url);

            if (parsed.action.toLowerCase() === this.action && parsed.controller.toLowerCase() === this.controller) {
                const resolvedUrl = this.resolver(row, column, schemaName, queryName);
                return resolvedUrl instanceof AppURL ? this.getProductUrl(resolvedUrl) : resolvedUrl;
            }
        }
    };
}

interface MapURLOptions {
    column?: QueryColumn;
    query?: string;
    row: any;
    schema?: string;
    url: string;
}

// exported for jest tests
export class LookupMapper implements URLMapper {
    defaultPrefix: string;
    lookupResolvers: Record<string, LookupResolver>;

    constructor(defaultPrefix: string, lookupResolvers: Record<string, LookupResolver>) {
        this.defaultPrefix = defaultPrefix;
        this.lookupResolvers = lookupResolvers;
    }

    resolve: URLMapperResolver = (url, row, column) => {
        if (column?.isLookup()) {
            const { lookup } = column;
            const { containerPath: lookupContainerPath, queryName, schemaName } = lookup;
            const queryKey = [schemaName, queryName].join('-').toLowerCase();
            const schemaKey = schemaName.toLowerCase();

            if (this.lookupResolvers) {
                if (this.lookupResolvers[queryKey]) {
                    return this.lookupResolvers[queryKey](row, column, schemaName, queryName);
                }
                if (this.lookupResolvers[schemaKey]) {
                    return this.lookupResolvers[schemaKey](row, column, schemaName, queryName);
                }
            }

            // Issue 46747: When the lookup goes to a different container, don't rewrite the URL
            const containerPath = getServerContext().container.path;
            if (lookupContainerPath && lookupContainerPath !== containerPath) {
                return undefined;
            }

            const parts = [this.defaultPrefix, schemaName, queryName, row.get('value').toString()];

            return AppURL.create(...parts);
        }
    };
}

const ASSAY_MAPPERS = [
    new ActionMapper('assay', 'assayDetailRedirect', row => {
        if (row.has('url')) {
            const rowURL = row.get('url');
            const params = ActionURL.getParameters(rowURL);

            // expecting a parameter of runId=<runId>
            if (params.hasOwnProperty('runId')) {
                const runId = params['runId'];

                const url = ['rd', 'assayrun', runId];
                return AppURL.create(...url);
            }
        }
    }),

    new ActionMapper('assay', 'assayRuns', (row, column, schema) => {
        if (row.has('url')) {
            const url = row.get('url');

            // expecting a filter on Batch/RowId~eq=<rowId>
            const filters = Filter.getFiltersFromUrl(url, 'Runs');
            if (filters.length > 0) {
                for (let i = 0; i < filters.length; i++) {
                    if (filters[i].getColumnName().toLowerCase() === 'batch/rowid') {
                        const rowId = filters[i].getValue();

                        // expecting a schema of assay.<provider>.<protocol>
                        if (schema.indexOf('assay.') === 0) {
                            const url = ['assays'].concat(schema.replace('assay.', '').split('.'));
                            url.push('batches', rowId);

                            return AppURL.create(...url);
                        }
                    }
                }
            }
        }
    }),

    new ActionMapper('assay', 'assayBegin', row => {
        const url = row.get('url');
        if (url) {
            const params = ActionURL.getParameters(url);

            if (params.rowId) {
                return AppURL.create('rd', 'assays', params.rowId);
            }
        }
    }),

    new ActionMapper('assay', 'assayResults', row => {
        const url = row.get('url');
        if (url) {
            const params = ActionURL.getParameters(url);
            const rowId = params.rowId;

            if (rowId) {
                // filter on Data.Run/RowId~eq=<rowId>
                const filters = Filter.getFiltersFromUrl(url, 'Data');
                if (filters.length > 0) {
                    for (let i = 0; i < filters.length; i++) {
                        if (filters[i].getColumnName().toLowerCase() === 'run/rowid') {
                            if (Object.keys(params).length > 2) console.warn('Params mapping skipped for: ' + url);

                            const runId = filters[i].getValue();
                            return AppURL.create('rd', 'assayrun', runId);
                        }
                    }
                }

                delete params.rowId; // strip the rowId and pass through the remaining params
                return AppURL.create('assays', rowId, 'data').addParams(params);
            }
        }
    }),
];

const DATA_CLASS_MAPPERS = [
    new ActionMapper('experiment', 'showDataClass', (row, column) => {
        let identifier: string;

        // TODO: Deal with junction lookup
        if (row.has('data')) {
            // search link doesn't use the same url
            identifier = row.getIn(['data', 'name']);
        } else if (column?.isLookup()) {
            identifier = row.get('displayValue').toString();
        } else {
            identifier = row.get('value').toString();
        }
        if (identifier !== undefined) {
            return AppURL.create('rd', 'dataclass', identifier);
        }
    }),

    new ActionMapper('experiment', 'showData', row => {
        const targetURL = row.get('url');
        if (targetURL) {
            const params = ActionURL.getParameters(targetURL);

            if (params.rowId) {
                const url = ['rd', 'expdata', params.rowId];
                return AppURL.create(...url);
            }
        }
    }),
];

const SAMPLE_TYPE_MAPPERS = [
    new ActionMapper('experiment', 'showSampleType', (row, column) => {
        let identifier: string;

        if (row.has('data')) {
            // search link doesn't use the same url
            identifier = row.getIn(['data', 'name']);
        } else if (column?.isLookup()) {
            identifier = row.get('displayValue').toString();
        } else {
            identifier = row.get('value').toString();
        }

        if (identifier !== undefined) {
            return AppURL.create(SAMPLES_KEY, identifier);
        }
    }),

    new ActionMapper('experiment', 'showMaterial', row => {
        const targetURL = row.get('url');
        if (targetURL) {
            const params = ActionURL.getParameters(targetURL);
            const rowId = params.rowId;

            if (rowId !== undefined) {
                const url = ['rd', 'samples', rowId];
                return AppURL.create(...url);
            } else {
                return false;
            }
        }
    }),
];

const RESOLVE_LSID_MAPPERS = [
    new ActionMapper('experiment', 'resolveLsid', (row, column) => {
        const targetURL = row.get('url');
        if (targetURL) {
            const params = ActionURL.getParameters(targetURL);
            if (params.type) {
                const type = params.type;
                const lsid = params.lsid;
                if (lsid) {
                    if (type?.toLowerCase() === 'data') {
                        const url = ['rd', 'expdata', lsid];
                        return AppURL.create(...url);
                    } else if (type?.toLowerCase() === 'material') {
                        const url = ['rd', 'samples', lsid];
                        return AppURL.create(...url);
                    }
                }
                return null; // return null for 'run' so LKS url will be used, don't return undefined
            }
        }
    }),
];

const LIST_MAPPERS = [
    new ActionMapper('list', 'details', (row, column) => {
        if (!column?.isLookup()) {
            const params = ActionURL.getParameters(row.get('url'));
            const urlParts = ActionURL.getPathFromLocation(row.get('url'));

            if (params?.pk) {
                if (params.name) {
                    const parts = ['q', 'lists', params.name, params.pk];
                    return AppURL.create(...parts);
                } else if (params.listId && urlParts?.containerPath) {
                    const resolverPath = encodeListResolverPath(urlParts.containerPath);
                    const parts = ['q', 'lists', resolverPath, params.listId, params.pk];
                    return AppURL.create(...parts);
                }
            }
        }
    }),

    new ActionMapper('list', 'grid', (row, column) => {
        if (!column?.isLookup()) {
            const params = ActionURL.getParameters(row.get('url'));
            const urlParts = ActionURL.getPathFromLocation(row.get('url'));

            if (params) {
                if (params.name) {
                    const parts = ['q', 'lists', params.name];
                    return AppURL.create(...parts);
                } else if (params.listId && urlParts?.containerPath) {
                    const resolverPath = encodeListResolverPath(urlParts.containerPath);
                    const parts = ['q', 'lists', resolverPath, params.listId];
                    return AppURL.create(...parts);
                }
            }
        }
    }),
];

const DETAILS_QUERY_ROW_MAPPER = new ActionMapper('query', 'detailsQueryRow', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        const schemaName = params.schemaName;
        const queryName = params['query.queryName'];

        if (schemaName && queryName) {
            const key = params.keyValue ? params.keyValue : params.RowId;

            if (key !== undefined) {
                const parts = ['q', schemaName, queryName, key];

                return AppURL.create(...parts);
            }
        }
    }
});

const EXECUTE_QUERY_MAPPER = new ActionMapper('query', 'executeQuery', () => false);

const USER_DETAILS_MAPPERS = [
    new ActionMapper('user', 'details', row => {
        const url = row.get('url');
        if (url) {
            const params = ActionURL.getParameters(url);
            return AppURL.create('q', 'core', 'siteusers', params.userId);
        }
    }),

    new ActionMapper('user', 'attachmentDownload', () => false),
];

const DOWNLOAD_FILE_LINK_MAPPER = new ActionMapper('core', 'downloadFileLink', () => false);

const AUDIT_DETAILS_MAPPER = new ActionMapper('audit', 'detailedAuditChanges', () => false);

const LOOKUP_MAPPER = new LookupMapper('q', {
    'exp-dataclasses': row =>
        row.get('displayValue') ? AppURL.create('rd', 'dataclass', row.get('displayValue')) : undefined,
    'exp-runs': row => {
        const runId = row.get('value');
        if (!isNaN(parseInt(runId))) {
            return AppURL.create('rd', 'assayrun', runId);
        }
        return false;
    },
    issues: () => false, // 33680: Prevent remapping issues lookup
});

export const PIPELINE_MAPPER = new ActionMapper('pipeline-status', 'details', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        return AppURL.create('pipeline', params.rowId);
    }
    return false;
});

export const PICKLIST_MAPPER = new ActionMapper('picklist', 'grid', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        if (params.listId) {
            return AppURL.create('picklist', params.listId);
        }
    }
    return false;
});

export const FREEZER_ITEM_SAMPLE_MAPPER = new ActionMapper('query', 'executeQuery', row => {
    const url = row.get('url');
    if (url) {
        const materialIdKey = 'query.MaterialId~eq';
        const params = ActionURL.getParameters(url);
        if (
            params.schemaName &&
            params.schemaName.toLowerCase() === 'inventory' &&
            params.queryName &&
            params.queryName.toLowerCase() === 'item'
        ) {
            if (params[materialIdKey]) {
                return createProductUrl(
                    FREEZER_MANAGER_APP_PROPERTIES.productId,
                    undefined,
                    AppURL.create('rd', 'sampleItem', params[materialIdKey])
                );
            } else {
                return ''; // don't try to show a link if there's no materialId Issue 49679
            }
        }
    }
    return false;
});

// This mapper overrides the URL provided for the core.ProjectManagement query.
// We're linking to #/admin/settings within a specific folder (which may be outside the current folder context).
export const PROJECT_MGMT_MAPPER = new ActionMapper('project', 'begin', (row, column, schema, query) => {
    const url = row.get('url');

    // Only match against the core.ProjectManagement query
    if (url && schema?.toLowerCase() === 'core' && query?.toLowerCase() === 'projectmanagement') {
        const { containerPath } = ActionURL.getPathFromLocation(url);
        const { controllerName } = getCurrentAppProperties();
        const baseURL = ActionURL.buildURL(controllerName, 'app.view', containerPath);
        return baseURL + AppURL.create('admin', 'settings').toHref();
    }

    // Allow resolution of 'project-begin' to fall through to other mappers
    return undefined;
});

// query-detailsQueryRow.view?schemaName=inventory&query.queryName=Location&RowId=1811
// map to /rd/freezerLocation/1811
export const STORAGE_LOCATION_MAPPER = new ActionMapper('query', 'detailsQueryRow', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        const schemaName = params.schemaName;
        const queryName = params['query.queryName'];
        if (
            schemaName &&
            schemaName.toLowerCase() === 'inventory' &&
            queryName &&
            queryName.toLowerCase() === 'location'
        ) {
            const rowId = params.RowId;
            if (rowId && rowId.length) {
                return createProductUrlFromParts(
                    FREEZER_MANAGER_APP_PROPERTIES.productId,
                    ActionURL.getController(),
                    {},
                    'rd',
                    'freezerLocation',
                    rowId
                );
            }
            return false;
        }
    }
    return undefined;
});

// query-detailsQueryRow.view?schemaName=inventory&query.queryName=Box&RowId=2918
// map to boxes/24363?query.sort=WellPosition
export const STORAGE_BOX_MAPPER = new ActionMapper('query', 'detailsQueryRow', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        const schemaName = params.schemaName;
        const queryName = params['query.queryName'];
        if (schemaName && schemaName.toLowerCase() === 'inventory' && queryName && queryName.toLowerCase() === 'box') {
            const rowId = params.RowId;
            if (rowId && rowId.length) {
                return createProductUrlFromParts(
                    FREEZER_MANAGER_APP_PROPERTIES.productId,
                    ActionURL.getController(),
                    { 'query.sort': 'WellPosition' },
                    'boxes',
                    rowId
                );
            }
            return false;
        }
    }
    return undefined;
});

// plate-isPlated.api?sampleId=100
// map to /rd/samples/100/plates
export const IS_PLATED_MAPPER = new ActionMapper('plate', 'IsPlated', row => {
    const url = row.get('url');
    if (url) {
        const params = ActionURL.getParameters(url);
        const sampleId = params.sampleId;

        return AppURL.create('rd', 'samples', sampleId, 'plates');
    }

    return undefined;
});

export const URL_MAPPERS = {
    ASSAY_MAPPERS,
    DATA_CLASS_MAPPERS,
    SAMPLE_TYPE_MAPPERS,
    RESOLVE_LSID_MAPPERS,
    LIST_MAPPERS,
    PICKLIST_MAPPER,
    DETAILS_QUERY_ROW_MAPPER,
    EXECUTE_QUERY_MAPPER,
    USER_DETAILS_MAPPERS,
    DOWNLOAD_FILE_LINK_MAPPER,
    AUDIT_DETAILS_MAPPER,
    LOOKUP_MAPPER,
    PIPELINE_MAPPER,
    FREEZER_ITEM_SAMPLE_MAPPER,
    PROJECT_MGMT_MAPPER,
    STORAGE_LOCATION_MAPPER,
    STORAGE_BOX_MAPPER,
    IS_PLATED_MAPPER,
};

export class URLResolver {
    private mapURL = (mapper: MapURLOptions): string => {
        // Don't override URLs if the URL has a different container than the current container and is not in the folder
        // tree of the current container. This scopes the apps to their current container and container tree, and supports
        // adding FKs from other containers and preserving the URL from the server.
        if (mapper.url) {
            const urlPath = ActionURL.getPathFromLocation(mapper.url).containerPath;

            if (urlPath) {
                const currentPath = getServerContext().container.path;

                // not current container AND not same top-level folder
                if (urlPath !== currentPath && getProjectPath(currentPath) !== getProjectPath(urlPath)) {
                    return mapper.url;
                }
            }
        }

        const _url = URLService.getUrlMappers()
            .toSeq()
            .map(m => m.resolve(mapper.url, mapper.row, mapper.column, mapper.schema, mapper.query))
            .filter(v => v !== undefined)
            .first();

        if (_url instanceof AppURL) {
            return _url.toHref();
        }

        if (typeof _url === 'string') {
            return _url;
        }

        if (mapper.url !== undefined && _url !== false && getServerContext().devMode) {
            // Don't bother logging the default server URL
            if (!mapper.url.indexOf('project-begin')) {
                console.warn('Unable to map URL:', mapper.url);
            }
        }

        return mapper.url;
    };

    resolveLineageItem = (
        item: Experiment.LineageItemBase,
        acceptedTypes: string[] = ['Sample', 'Data']
    ): LineageLinkMetadata => {
        const metadata: LineageLinkMetadata = {
            lineage: undefined,
            list: undefined,
            overview: item.url,
        };

        if (item.type && acceptedTypes.indexOf(item.type) >= 0 && (item.queryName || item.cpasType || item.lsid)) {
            // Issue 48836: Resolve lineage item URL from queryName if available
            let name = item.queryName;

            if (!name) {
                // Fallback to parsing name from cpasType
                const parts = item.cpasType.split(':');
                name = parts[parts.length - 1];

                // LSID strings are 'application/x-www-form-urlencoded' encoded which replaces space with '+'
                name = name.replace(/\+/g, ' ');
            }

            // Create a URL that will be resolved/redirected in the application resolvers
            const listURLParts = item.type === 'Sample' ? [SAMPLES_KEY, name] : ['rd', 'dataclass', name];

            // listURL is the url to the grid for the data type. It will be filtered to the lineage members.
            metadata.list = AppURL.create(...listURLParts).toHref();

            const overviewURL = this.mapURL({
                url: item.url,
                row: item,
                column: undefined,
                schema: item.schemaName,
                query: item.queryName,
            });

            metadata.overview = overviewURL;
            metadata.lineage = overviewURL + '/lineage';
        }

        return metadata;
    };

    /**
     * Returns a Promise resolving a valid selectRowsResult with URLs replaced with those mapped by this
     * URLResolver.
     */
    resolveSelectRows(response: Query.Response, queryInfo: QueryInfo): any {
        let resolved = fromJS(JSON.parse(JSON.stringify(response)));

        // If no url mappers defined then this is a noop. Using URLs as they are.
        if (URLService.getUrlMappers()?.size > 0) {
            if (resolved.get('rows').count()) {
                const schema = resolved.get('schemaName').toJS().join('.');
                const query = resolved.get('queryName');

                let fields: Map<string, QueryColumn> = Map();
                if (resolved.hasIn(['metaData', 'fields'])) {
                    fields = resolved
                        .getIn(['metaData', 'fields'])
                        .reduce((fs, col) => fs.set(col.get('fieldKey'), new QueryColumn(col.toJS())), Map());
                }

                const rows = resolved.get('rows').map(row => {
                    return row.map((cell, fieldKey) => {
                        // single-value cells
                        if (Map.isMap(cell) && cell.has('url')) {
                            return cell.set(
                                'url',
                                this.mapURL({
                                    url: cell.get('url'),
                                    row: cell,
                                    column: fields.get(fieldKey) ?? queryInfo?.getColumn(fieldKey),
                                    schema,
                                    query,
                                })
                            );
                        }

                        // multi-value cells
                        if (List.isList(cell) && cell.size > 0) {
                            return cell
                                .map(innerCell => {
                                    if (Map.isMap(innerCell) && innerCell.has('url')) {
                                        return innerCell.set(
                                            'url',
                                            this.mapURL({
                                                url: innerCell.get('url'),
                                                row: innerCell,
                                                column: fields.get(fieldKey) ?? queryInfo?.getColumn(fieldKey),
                                                schema,
                                                query,
                                            })
                                        );
                                    }

                                    return innerCell;
                                })
                                .toList();
                        }

                        return cell;
                    });
                });

                resolved = resolved.set('rows', rows);
            }
        }

        return resolved.toJS();
    }

    // ToDo: this is rather fragile and data specific. this should be reworked with the mappers and rest of the resolvers to provide for more thorough coverage of our incoming URLs
    resolveSearchUsingIndex(result: SearchResult): SearchResult {
        let resolved = fromJS(JSON.parse(JSON.stringify(result)));

        if (resolved.get('hits').count()) {
            const rows = resolved.get('hits').map(row => {
                if (row && row.has('url')) {
                    const id = row.get('id');
                    let url = row.get('url');
                    let query;

                    // TODO: add reroute for assays/runs when pages and URLs are decided
                    if (row.has('data') && row.hasIn(['data', 'dataClass'])) {
                        query = row.getIn(['data', 'dataClass', 'name']);
                        url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                        return row.set('url', this.mapURL({ url, row, query }));
                    } else if (id.indexOf('dataClass') >= 0) {
                        query = row.getIn(['data', 'name']);
                        url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                        return row.set('url', this.mapURL({ url, row, query }));
                    } else if (id.indexOf('materialSource') >= 0) {
                        query = row.getIn(['data', 'name']);
                        url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                        return row.set('url', this.mapURL({ url, row, query }));
                    } else if (id.indexOf('assay') >= 0) {
                        query = row.getIn(['title']);
                        url = url.substring(0, url.indexOf('&')); // URL includes documentID value, this will split off at the start of the docID
                        return row.set('url', this.mapURL({ url, row, query }));
                    } else if (id.indexOf('material') !== -1 && row.hasIn(['data', 'sampleSet'])) {
                        query = row.getIn(['data', 'sampleSet', 'name']);
                        return row.set('url', this.mapURL({ url, row, query }));
                    } else if (row.has('data') && row.hasIn(['data', 'id'])) {
                        query = row.getIn(['data', 'type']);
                        return row.set('url', this.mapURL({ url, row, query }));
                    } else if (id.indexOf('workflowJob:') >= 0) {
                        return row.set('url', this.mapURL({ url, row }));
                    } else if (id.indexOf('torageLocation:') >= 0) {
                        let index = url.indexOf('&_docid');
                        if (index > -1) {
                            url = url.substring(0, index);
                        }
                        index = url.indexOf('?_docid');
                        if (index > -1) {
                            url = url.substring(0, index);
                        }
                        return row.set('url', this.mapURL({ url, row }));
                    } else if (url.indexOf('samplemanager-downloadAttachments') >= 0) {
                        return row.set('url', this.mapURL({ url, row }));
                    } else if (url.indexOf('notebook') >= 0) {
                        return row.set('url', this.mapURL({ url, row }));
                    } else if (url.indexOf('plate-designer') > -1) {
                        const plateRowId = row.getIn(['data', 'rowId']);
                        if (plateRowId) {
                            return row.set('url', this.mapURL({ url, row, query: plateRowId }));
                        }
                    } else if (url.indexOf('query-queryDetailsRow') && url.indexOf('.queryName=PlateSet&')) {
                        const plateSetRowId = row.getIn(['data', 'rowId']);
                        if (plateSetRowId) {
                            return row.set('url', this.mapURL({ url, row, query: plateSetRowId }));
                        }
                    }
                }
                return row;
            });

            resolved = resolved.set('hits', rows);
        }

        return resolved.toJS();
    }
}
