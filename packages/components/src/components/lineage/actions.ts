/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { createContext } from 'react';
import { Draft, produce } from 'immer';
import { fromJS, List, Map, OrderedSet } from 'immutable';
import { ActionURL, Ajax, Experiment, Filter, Utils } from '@labkey/api';
import { AppURL, GridColumn, ISelectRowsResult, Location, SchemaQuery, SCHEMAS, selectRows } from '../..';

import {
    Lineage,
    LineageGridModel,
    LineageLoadingState,
    LineageNode,
    LineageNodeMetadata,
    LineageResult,
} from './models';
import { getLineageResult, updateLineageResult } from '../../global';
import { LINEAGE_DIRECTIONS, LineageFilter, LineageOptions } from './types';
import { getLineageDepthFirstNodeList } from './utils';
import { getURLResolver } from './LineageURLResolvers';

const LINEAGE_METADATA_COLUMNS = OrderedSet<string>(['LSID', 'Name', 'Description', 'Alias', 'RowId', 'Created']);

export interface WithNodeInteraction {
    isNodeInGraph?: (node: LineageNode) => boolean
    onNodeMouseOver?: (node: LineageNode) => void
    onNodeMouseOut?: (node: LineageNode) => void
    onNodeClick?: (node: LineageNode) => void
}

const NodeInteractionContext = createContext<WithNodeInteraction>(undefined);
export const NodeInteractionProvider = NodeInteractionContext.Provider;
export const NodeInteractionConsumer = NodeInteractionContext.Consumer;

export function fetchLineage(seed: string, distance?: number): Promise<LineageResult> {
    return new Promise((resolve, reject) => {
        let options: any /* ILineageOptions */ = {
            includeRunSteps: true,
            lsid: seed,
        };

        if (!isNaN(distance)) {
            // The lineage includes a "run" object for each parent as well, so we
            // query for twice the depth requested in the URL.
            options.depth = distance * 2;
        }

        Experiment.lineage({
            ...options,

            success: lineage => {
                resolve(LineageResult.create(lineage))
            },

            failure: (error) => {
                let message = `Failed to fetch lineage for seed "${seed}".`;

                if (error) {
                    if (error.exception) {
                        message = error.exception;

                        // When a server exception occurs
                        if (error.exceptionClass) {
                            message = `${error.exceptionClass}: ` + error.exception;
                        }
                    }
                }

                reject({
                    seed,
                    message,
                });
            }
        });
    });
}

function fetchLineageNodes(lsids: string[]): Promise<LineageNode[]> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: ActionURL.buildURL('experiment', 'resolve.api'),
            params: { lsids },
            success: Utils.getCallbackWrapper((json: any) => {
                resolve(json.data.map(n => LineageNode.create(n.lsid, n)));
            }),
            failure: Utils.getCallbackWrapper((error: any) => {
                reject(error);
            }, undefined, true)
        });
    });
}

function fetchNodeMetadata(lineage: LineageResult): Promise<ISelectRowsResult>[] {
    // Node metadata does not support nodes with multiple primary keys. These could be supported, however,
    // each node would require it's own request for the unique keys combination. Also, nodes without any primary
    // keys cannot be filtered upon and thus are also not supported.
    return lineage.nodes
        .filter(n => n.schemaName !== undefined && n.queryName !== undefined && n.pkFilters.size === 1)
        .groupBy(n => SchemaQuery.create(n.schemaName, n.queryName))
        .map((nodes, schemaQuery) => {
            const { fieldKey } = nodes.first().pkFilters.get(0);

            return selectRows({
                schemaName: schemaQuery.schemaName,
                queryName: schemaQuery.queryName,
                // TODO: Is there a better way to determine set of columns? Can we follow convention for detail views?
                // See LineageNodeMetadata (and it's usages) for why this is currently necessary
                columns: LINEAGE_METADATA_COLUMNS.add(fieldKey).join(','),
                filterArray: [
                    Filter.create(fieldKey, nodes.map(n => n.pkFilters.get(0).value).toArray(), Filter.Types.IN)
                ]
            });
        })
        .toArray();
}

export function getLineageNodeMetadata(lineage: LineageResult): Promise<LineageResult> {
    return new Promise((resolve) => {
        return Promise.all(fetchNodeMetadata(lineage))
            .then(results => {
                let metadata = {};
                results.forEach(result => {
                    const queryInfo = result.queries[result.key];
                    const model = fromJS(result.models[result.key]);
                    model.forEach((data) => {
                        const lsid = data.getIn(['LSID', 'value']);
                        metadata[lsid] = LineageNodeMetadata.create(data, queryInfo);
                    });
                });

                return lineage.set('nodes', lineage.nodes.map(node => (
                    node.set('meta', metadata[node.lsid])
                ))) as LineageResult;
            })
            .then((result) => {
                resolve(result);
            })
    });
}

export function loadLineageIfNeeded(seed: string, distance?: number, options?: LineageOptions): Promise<Lineage> {
    const existing = getLineageResult(seed);
    if (existing) {
        return Promise.resolve(existing);
    }

    // create the initial lineage model for this seed
    updateLineageResult(seed, new Lineage({ seed }));

    if (options?.prefetchSeed) {
        // fetch seed node asynchronously to allow for decoupled loading
        loadSeed(seed, options);
    }

    persistLineage(seed, (draft: Draft<Lineage>) => {
        draft.resultLoadingState = LineageLoadingState.LOADING;
    });

    return fetchLineage(seed, distance)
        .then(result => processLineageResult(result, options))
        .then(result => persistLineage(seed, (draft) => {
            draft.result = result;
            draft.resultLoadingState = LineageLoadingState.LOADED;
        }))
        .catch(reason => {
            console.error(reason);
            return persistLineage(seed, (draft) => {
                draft.error = reason.message;
                draft.resultLoadingState = LineageLoadingState.LOADED;
            });
        });
}

export function loadSampleStatsIfNeeded(seed: string, distance?: number): Promise<Lineage> {
    const existing = getLineageResult(seed);
    if (existing && existing.sampleStats) {
        return Promise.resolve(existing);
    }

    return Promise.all([
        loadLineageIfNeeded(seed, distance),
        fetchSampleSets()
    ]).then(values => {
        const [ lineage, sampleSets ] = values;

        return persistLineage(seed, (draft) => {
            draft.sampleStats = computeSampleCounts(lineage, sampleSets);
        });
    });
}

function persistLineage(seed: string, recipe: (draft: Draft<Lineage>) => void): Lineage {
    updateLineageResult(seed, produce(getLineageResult(seed), recipe));
    const lineage = getLineageResult(seed);
    console.log('new lineage', lineage);
    return lineage;
}

function loadSeed(seed: string, options?: LineageOptions): void {
    persistLineage(seed, (draft: Draft<Lineage>) => {
        draft.seedResultLoadingState = LineageLoadingState.LOADING;
    });

    fetchLineageNodes([seed]).then((nodes) => {
        if (nodes.length === 1) {
            // create a LineageResult from the seed alone
            processLineageResult(LineageResult.create({
                nodes: { [seed]: nodes[0] },
                seed,
            }), options).then((seedResult) => {
                persistLineage(seed, (draft: Draft<Lineage>) => {
                    draft.seedResult = seedResult;
                    draft.seedResultLoadingState = LineageLoadingState.LOADED;
                });
            });
        }
    });
}

// TODO add jest test coverage for this function
function computeSampleCounts(lineage: Lineage, sampleSets: any) {

    const { key, models } = sampleSets;

    let rows = [];
    let nodeIds = {};

    lineage.result.nodes.forEach(node => {
        if (node.lsid && node.cpasType) {
            const key = node.cpasType;

            if (!nodeIds[key]) {
                nodeIds[key] = [];
            }

            nodeIds[key].push(node.id);
        }
    });

    for (let row in models[key]) {
        if (models[key].hasOwnProperty(row)) {
            const _row = models[key][row];

            let count = 0,
                filteredURL;
            let name = _row['Name'].value,
                ids = nodeIds[_row['LSID'].value];

            // if there were related samples, use the array of RowIds as a count and to build an AppURL and filter
            if (ids) {
                count = ids.length;

                filteredURL = AppURL.create('samples', name).addFilters(
                    Filter.create('RowId', ids, Filter.Types.IN)
                ).toHref();
            }

            rows.push({
                name: {
                    value: _row['Name'].value,
                    url: filteredURL
                },
                sampleCount: {
                    value: count
                },
                modified: count > 0 ? _row['Modified'] : undefined
            });
        }
    }

    return fromJS(rows);
}

function fetchSampleSets() {
    return selectRows({
        schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
        queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName
    });
}

export function getLocationString(location: Location): string {
    let loc = '';

    if (location) {
        let sep = '';
        // all properties on the URL that are respected by LineagePageModel
        ['distance', 'members', 'p', 'seeds'].forEach((key) => {
            if (location.query.has(key)) {
                loc += sep + key + '=' + location.query.get(key);
                sep = '&';
            }
        });
    }

    return loc;
}

export function createGridModel(
    lineage: Lineage,
    members: LINEAGE_DIRECTIONS,
    distance: number,
    columns: List<string | GridColumn>,
    pageNumber: number
): LineageGridModel {
    const result = lineage.filterResult({
        filters: [new LineageFilter('type', ['Sample', 'Data'])]
    });

    const nodeList = getLineageDepthFirstNodeList(result.nodes, result.seed, members, distance);
    let nodeCounts = Map<string, number>().asMutable();
    nodeList.forEach((node) => {
        const { lsid } = node;
        if (nodeCounts.has(lsid)) {
            nodeCounts.set(lsid, nodeCounts.get(lsid) + 1);
        }
        else {
            nodeCounts.set(lsid, 1);
        }
    });

    return new LineageGridModel({
        columns,
        data: nodeList,
        distance,
        isError: false,
        isLoaded: true,
        isLoading: false,
        members,
        message: undefined,
        nodeCounts,
        pageNumber,
        seedNode: nodeList.get(0),
        totalRows: nodeList.size
    });
}

export function getPageNumberChangeURL(location: Location, seed: string, pageNumber: number): AppURL {
    let url = AppURL.create('lineage');

    // use the seed lsid value from the param
    url = url.addParam('seeds', seed);

    location.query.map((value: any, key: string) => {
        if (key !== 'p' && key !== 'seeds') {
            url = url.addParam(key, value);
        }
    });

    if (pageNumber > 1) {
        url = url.addParam('p', pageNumber);
    }

    return url;
}

function processLineageResult(result: LineageResult, options?: LineageOptions): Promise<LineageResult> {
    return getLineageNodeMetadata(result).then(r => getURLResolver(options).resolveNodes(r));
}
