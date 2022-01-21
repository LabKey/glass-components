/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Draft, immerable, produce } from 'immer';
import { List, Map, Record } from 'immutable';
import { Experiment, Utils } from '@labkey/api';

import { GridColumn, LineageFilter, LoadingState, QueryInfo } from '../../..';

import {
    DEFAULT_GROUPING_OPTIONS,
    DEFAULT_LINEAGE_DIRECTION,
    DEFAULT_LINEAGE_DISTANCE,
    DEFAULT_LINEAGE_OPTIONS,
} from './constants';
import {
    LineageGroupingOptions,
    LINEAGE_DIRECTIONS,
    LineageLinkMetadata,
    LineageOptions,
    LineageIconMetadata,
} from './types';
import { generate, VisGraphOptions } from './vis/VisGraphGenerator';
import { LINEAGE_GRID_COLUMNS } from './Tag';

export function applyLineageOptions(options?: LineageOptions): LineageOptions {
    const _options = {
        ...DEFAULT_LINEAGE_OPTIONS,
        ...options,
        ...{
            grouping: {
                ...DEFAULT_GROUPING_OPTIONS,
                ...options?.grouping,
            },
        },
    };

    // deep copy "filters"
    _options.filters = _options.filters.map(filter => new LineageFilter(filter.field, filter.value));

    return _options;
}

export class LineageNodeMetadata extends Record({
    date: undefined,
    description: undefined,
    aliases: undefined,
    displayType: undefined,
}) {
    declare date?: string;
    declare description?: string;
    declare aliases?: List<string>;
    declare displayType?: string;

    static create(selectRowsMetadata: Map<any, any>, queryInfo: QueryInfo): LineageNodeMetadata {
        let description;
        if (selectRowsMetadata.hasIn(['Description', 'value']))
            description = selectRowsMetadata.getIn(['Description', 'value']);

        let created;
        if (selectRowsMetadata.hasIn(['Created', 'formattedValue']))
            created = selectRowsMetadata.getIn(['Created', 'formattedValue']);
        else if (selectRowsMetadata.hasIn(['Created', 'value']))
            created = selectRowsMetadata.getIn(['Created', 'value']);

        let aliases;
        if (selectRowsMetadata.has('Alias')) {
            aliases = selectRowsMetadata.get('Alias').map(alias => alias.get('displayValue'));
        }

        return new LineageNodeMetadata({
            displayType: queryInfo.queryLabel,
            description,
            date: created,
            aliases,
        });
    }
}

export class LineageLink extends Record({
    lsid: undefined,
}) {
    declare lsid: string;

    static createList(values?: any): List<LineageLink> {
        const result = values ? values.map(v => new LineageLink(v)) : [];
        return List(result);
    }
}

export interface LineageItemWithMetadata extends Experiment.LineageItemBase {
    iconProps: LineageIconMetadata;
    links: LineageLinkMetadata;
}

export interface ProvenanceMap {
    from: Experiment.LineageItemBase;
    to: Experiment.LineageItemBase;
}

interface LineageIOConfig extends Experiment.LineageIOConfig {
    provenanceMap?: ProvenanceMap[];
    objectInputs?: Experiment.LineageItemBase[];
    objectOutputs?: Experiment.LineageItemBase[];
}

export interface LineageIOWithMetadata extends LineageIOConfig {
    dataInputs?: LineageItemWithMetadata[];
    dataOutputs?: LineageItemWithMetadata[];
    materialInputs?: LineageItemWithMetadata[];
    materialOutputs?: LineageItemWithMetadata[];
    objectInputs?: LineageItemWithMetadata[];
    objectOutputs?: LineageItemWithMetadata[];
}

export interface LineageItemWithIOMetadata extends LineageItemWithMetadata, LineageIOWithMetadata {}

export interface LineageRunStepConfig extends Experiment.LineageRunStepBase, LineageItemWithIOMetadata {}

export class LineageRunStep implements LineageRunStepConfig {
    [immerable] = true;

    readonly applicationType: string;
    readonly activityDate: string;
    readonly activitySequence: number;
    readonly container: string;
    readonly created: string;
    readonly createdBy: string;
    readonly dataInputs: LineageIO[];
    readonly dataOutputs: LineageIO[];
    readonly expType: string;
    readonly iconProps: LineageIconMetadata;
    readonly id: number;
    readonly links: LineageLinkMetadata;
    readonly lsid: string;
    readonly materialInputs: LineageIO[];
    readonly materialOutputs: LineageIO[];
    readonly modified: string;
    readonly modifiedBy: string;
    readonly name: string;
    readonly objectInputs: LineageIO[];
    readonly objectOutputs: LineageIO[];
    readonly pkFilters: Experiment.LineagePKFilter[];
    readonly protocol: Experiment.LineageItemBase;
    readonly queryName: string;
    readonly schemaName: string;

    constructor(values?: LineageRunStepConfig) {
        Object.assign(this, values, {
            ...LineageIO.applyConfig(values),
        });
    }
}

export class LineageIO implements LineageItemWithMetadata {
    [immerable] = true;

    readonly container: string;
    readonly created: string;
    readonly createdBy: string;
    readonly expType: string;
    readonly iconProps: LineageIconMetadata;
    readonly id: number;
    readonly lsid: string;
    readonly links: LineageLinkMetadata;
    readonly modified: string;
    readonly modifiedBy: string;
    readonly name: string;
    readonly pkFilters: Experiment.LineagePKFilter[];
    readonly queryName: string;
    readonly schemaName: string;

    constructor(values?: Partial<LineageIO>) {
        Object.assign(this, values);
    }

    static applyConfig(values?: LineageIOConfig): LineageIOConfig {
        return {
            dataInputs: LineageIO.fromArray(values?.dataInputs),
            dataOutputs: LineageIO.fromArray(values?.dataOutputs),
            materialInputs: LineageIO.fromArray(values?.materialInputs),
            materialOutputs: LineageIO.fromArray(values?.materialOutputs),
            // convert the provenanceMap to the inputs and outputs array, filter for just those that have a from/to lsid value
            objectInputs: LineageIO.fromArray(
                values?.provenanceMap?.map(prov => prov.from).filter(input => input?.lsid)
            ),
            objectOutputs: LineageIO.fromArray(
                values?.provenanceMap?.map(prov => prov.to).filter(input => input?.lsid)
            ),
        };
    }

    static fromArray(values?: any[]): LineageIO[] {
        if (Utils.isArray(values)) {
            return (values as any[]).map(io => new LineageIO(io));
        }

        return [];
    }
}

interface LineageNodeConfig
    extends Omit<Experiment.LineageNodeBase, 'children' | 'parents' | 'steps'>,
        LineageItemWithIOMetadata {
    children: List<LineageLink>;
    parents: List<LineageLink>;
    steps: List<LineageRunStep>;

    // computed properties
    distance: number;
    listURL: string;
    meta: LineageNodeMetadata;
}

export class LineageNode
    extends Record({
        absolutePath: undefined,
        children: undefined,
        container: undefined,
        cpasType: undefined,
        created: undefined,
        createdBy: undefined,
        dataFileURL: undefined,
        dataInputs: undefined,
        dataOutputs: undefined,
        expType: undefined,
        id: undefined,
        lsid: undefined,
        materialInputs: undefined,
        materialOutputs: undefined,
        modified: undefined,
        modifiedBy: undefined,
        name: undefined,
        objectInputs: undefined,
        objectOutputs: undefined,
        parents: undefined,
        pipelinePath: undefined,
        pkFilters: undefined,
        properties: undefined,
        queryName: undefined,
        schemaName: undefined,
        steps: undefined,
        type: undefined,
        materialLineageType: undefined,
        url: undefined,

        // computed properties
        distance: undefined,
        iconProps: {},
        links: {},
        listURL: undefined,
        meta: undefined,
    })
    implements LineageNodeConfig {
    declare absolutePath: string;
    declare children: List<LineageLink>;
    declare container: string;
    declare cpasType: string;
    declare created: string;
    declare createdBy: string;
    declare dataFileURL: string;
    declare dataInputs: LineageIO[];
    declare dataOutputs: LineageIO[];
    declare expType: string;
    declare id: number;
    declare lsid: string;
    declare materialInputs: LineageIO[];
    declare materialOutputs: LineageIO[];
    declare modified: string;
    declare modifiedBy: string;
    declare name: string;
    declare objectInputs: LineageIO[];
    declare objectOutputs: LineageIO[];
    declare parents: List<LineageLink>;
    declare pipelinePath: string;
    declare pkFilters: Experiment.LineagePKFilter[];
    declare properties: any;
    declare queryName: string;
    declare schemaName: string;
    declare steps: List<LineageRunStep>;
    declare type: string;
    declare materialLineageType: string;
    declare url: string;

    // computed properties
    distance: number;
    iconProps: LineageIconMetadata;
    links: LineageLinkMetadata;
    listURL: string;
    meta: LineageNodeMetadata;

    static create(lsid: string, values?: Partial<LineageNodeConfig>): LineageNode {
        let config: any;

        if (values && values instanceof LineageNode) {
            config = values;
        } else {
            config = {
                ...values,
                ...LineageIO.applyConfig(values as LineageNodeConfig),
                ...{
                    children: LineageLink.createList(values.children),
                    lsid,
                    parents: LineageLink.createList(values.parents),
                    steps: List(values.steps?.map(stepProps => new LineageRunStep(stepProps))),
                },
            };
        }

        return new LineageNode(config);
    }

    get isRun(): boolean {
        return this.expType === 'ExperimentRun';
    }
}

export class LineageResult extends Record({
    mergedIn: undefined,
    nodes: undefined,
    seed: undefined,
}) {
    declare mergedIn: List<string>;
    declare nodes: Map<string, LineageNode>;
    declare seed: string;

    static create(rawLineageResult: any): LineageResult {
        const seed = rawLineageResult.seed;

        const nodes = {};
        for (const key in rawLineageResult.nodes) {
            if (!rawLineageResult.nodes.hasOwnProperty(key)) continue;

            const rawNode = rawLineageResult.nodes[key];
            nodes[key] = LineageNode.create(key, rawNode);
        }

        // make sure that mergedIn list of all nodes that have their lineage in the model includes the original seed node
        const mergedIn = seed ? List<string>([seed]) : List();

        return new LineageResult({
            seed,
            nodes: Map<string, LineageNode>(nodes),
            mergedIn,
        });
    }

    filterIn(field: string, value: undefined | string | string[]): LineageResult {
        return LineageResult._filter(this, field, value, true);
    }

    filterOut(field: string, value: undefined | string | string[]): LineageResult {
        return LineageResult._filter(this, field, value, false);
    }

    /**
     * When 'filterIn' is true, keep nodes that match the filter field and value.  All other nodes are removed.
     *
     * When 'filterIn' is false, keep nodes that don't match the filter field and value.  All other nodes are removed.
     *
     * Edges to removed nodes will be copied to the source.
     */
    private static _filter(
        result: LineageResult,
        field: string,
        value: undefined | string | string[],
        filterIn: boolean
    ): LineageResult {
        if (field === undefined) throw new Error('field must not be undefined');

        const oldNodes = result.nodes;

        // filter out nodes that don't match the criteria
        const newNodes = oldNodes.reduce((m, node) => {
            const lsid = node.lsid;
            const matched = this._matches(node, field, value, filterIn);

            if (matched) {
                // walk the parents/children edges, adding any matching nodes
                return m.set(
                    lsid,
                    node.merge({
                        parents: LineageResult.prune(node, oldNodes, LINEAGE_DIRECTIONS.Parent, field, value, filterIn),
                        children: LineageResult.prune(
                            node,
                            oldNodes,
                            LINEAGE_DIRECTIONS.Children,
                            field,
                            value,
                            filterIn
                        ),
                    })
                );
            } else {
                // don't include the current node
                return m;
            }
        }, Map().asMutable());

        return result.set('nodes', newNodes) as LineageResult;
    }

    /**
     * When 'filterIn' is true, returns true if the node[field] is equal to the value or any of the array item values.
     * When value is undefined, it is treated as a wildcard -- any value is allowed as long as the
     *
     * When 'filterIn' is false, returns true if the node[field] is not equal to the value or any of the array item values.
     * When value is undefined, the node must not have contain a value for the field.
     */
    private static _matches(
        node: LineageNode,
        field: string,
        value: undefined | string | string[],
        filterIn: boolean
    ): boolean {
        if (filterIn) {
            if (value === undefined) {
                // true if the field exists on node
                return node.has(field);
            } else if (Array.isArray(value)) {
                return value.indexOf(node[field]) > -1;
            } else {
                return node[field] === value;
            }
        } else {
            if (value === undefined) {
                // true if the field does not exist on node
                return !node.has(field);
            } else if (Array.isArray(value)) {
                return value.indexOf(node[field]) === -1;
            } else {
                return node[field] !== value;
            }
        }
    }

    private static prune(
        node: LineageNode,
        nodes: Map<string, LineageNode>,
        dir: LINEAGE_DIRECTIONS,
        field: string,
        value: any,
        filterIn: boolean
    ): List<{ lsid: string; role: string }> {
        let newTree = [];
        const edges: List<LineageLink> = node.get(dir);
        const walked: { [key: string]: string } = {};

        edges.forEach(edge => {
            newTree = newTree.concat(LineageResult.pruneEdge(edge, nodes, dir, field, value, filterIn, walked));
        });

        return List(newTree);
    }

    private static pruneEdge(
        edge: LineageLink,
        nodes: Map<string, LineageNode>,
        dir: LINEAGE_DIRECTIONS,
        field: string,
        value: any,
        filterIn: boolean,
        walked: { [key: string]: string }
    ): Array<{ lsid: string; role: string }> {
        let heritage = [];
        const lsid = edge.lsid;
        const toNode = nodes.get(lsid);
        const edges: List<LineageLink> = toNode.get(dir);

        const matched = this._matches(toNode, field, value, filterIn);
        if (!matched) {
            // don't walk the same edge set more than once
            if (walked[lsid]) {
                return heritage;
            }

            walked[lsid] = lsid;
            edges.forEach(edge => {
                const result = LineageResult.pruneEdge(edge, nodes, dir, field, value, filterIn, walked);
                if (result && result.length > 0) {
                    heritage = heritage.concat(result);
                }
            });
        } else {
            heritage.push(edge);
        }

        return heritage;
    }
}

export interface ILineage {
    error?: string;
    result: LineageResult;
    resultLoadingState?: LoadingState;
    sampleStats: any;
    seed: string;
    seedResult: LineageResult;
    seedResultError?: string;
    seedResultLoadingState?: LoadingState;
}

export class Lineage implements ILineage {
    [immerable] = true;

    readonly error?: string;
    readonly result: LineageResult;
    readonly resultLoadingState: LoadingState = LoadingState.INITIALIZED;
    readonly sampleStats: any;
    readonly seed: string;
    readonly seedResult: LineageResult;
    readonly seedResultError?: string;
    readonly seedResultLoadingState: LoadingState = LoadingState.INITIALIZED;

    constructor(values?: Partial<ILineage>) {
        Object.assign(this, values);
    }

    // Defensive check against calls made when an error is present and provides a more useful error message.
    private checkError(): void {
        if (this.error) {
            throw new Error(
                'Invalid call on Lineage object. Check errors prior to attempting to interact with Lineage object.'
            );
        }
    }

    filterResult(options?: LineageOptions): LineageResult {
        this.checkError();
        const { seed } = this.result;

        const _options = applyLineageOptions(options);

        let nodes;
        if (_options.filters) {
            let result = this.result;
            _options.filters.forEach(filter => {
                if (_options.filterIn === true) {
                    result = result.filterIn(filter.field, filter.value);
                } else {
                    result = result.filterOut(filter.field, filter.value);
                }
            });
            nodes = result.nodes;
        } else {
            nodes = this.result.nodes;
        }

        const mergedIn = this.result.mergedIn;

        return new LineageResult({ seed, nodes, mergedIn });
    }

    /**
     * Generate a graph of the lineage for use with vis.js.
     *
     * @remarks
     * First, the LabKey lineage is filtered according to the {@link LineageOptions.filters}
     * then the graph is translated into vis.js nodes and edges.  During translation, nodes
     * will be combined together according to {@link LineageGroupingOptions.combineSize} and recursion
     * will be stopped when {@link LineageGroupingOptions.generations} condition is met.
     */
    generateGraph(options?: LineageOptions): VisGraphOptions {
        this.checkError();

        if (this.isLoaded()) {
            return generate(this.filterResult(options), options);
        }

        return undefined;
    }

    isLoaded(): boolean {
        return this.resultLoadingState === LoadingState.LOADED;
    }

    isSeedLoaded(): boolean {
        return !this.seedResultError && this.seedResultLoadingState === LoadingState.LOADED;
    }

    /**
     * Returns a deep copy of this model with props applied iff props is not empty/null/undefined else
     * returns this.
     * @param props
     */
    mutate(props: Partial<ILineage>): Lineage {
        return produce(this, (draft: Draft<Lineage>) => {
            Object.assign(draft, props);
        });
    }
}

interface ILineageGridModel {
    columns: List<string | GridColumn>;
    data: List<LineageNode>;
    distance: number;
    isError: boolean;
    isLoaded: boolean;
    isLoading: boolean;
    maxRows: number;
    members: LINEAGE_DIRECTIONS;
    message: string;
    nodeCounts: Map<string, number>;
    pageNumber: number;
    seedNode: LineageNode;
    totalRows: number;
}

export class LineageGridModel implements ILineageGridModel {
    [immerable] = true;

    readonly columns: List<string | GridColumn> = LINEAGE_GRID_COLUMNS;
    readonly data: List<LineageNode> = List();
    readonly distance: number = DEFAULT_LINEAGE_DISTANCE;
    readonly isError: boolean = false;
    readonly isLoaded: boolean = false;
    readonly isLoading: boolean = false;
    readonly maxRows: number = 20;
    readonly members: LINEAGE_DIRECTIONS = DEFAULT_LINEAGE_DIRECTION;
    readonly message: string;
    readonly nodeCounts: Map<string, number> = Map();
    readonly pageNumber: number = 1;
    readonly seedNode: LineageNode;
    readonly totalRows: number = 0;

    constructor(config?: Partial<ILineageGridModel>) {
        Object.assign(this, { ...config });
    }

    get offset(): number {
        return this.pageNumber > 1 ? (this.pageNumber - 1) * this.maxRows : 0;
    }

    get maxRowIndex(): number {
        const max = this.pageNumber > 1 ? this.pageNumber * this.maxRows : this.maxRows;

        if (max > this.totalRows) {
            return this.totalRows;
        }

        return max;
    }

    get minRowIndex(): number {
        return this.offset + 1;
    }
}
