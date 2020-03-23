/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import ReactN from 'reactn';
import { List } from 'immutable';
import { ActionURL } from '@labkey/api';

import { LineageNodeList, LineageSummary } from './LineageSummary';
import {
    ILineageGroupingOptions,
    Lineage,
    LineageFilter,
    LineageGroupingOptions,
    LineageNode,
    LineageNodeMetadata,
    LineageOptions,
} from './models';
import {
    createLineageNodeCollections,
    LineageNodeCollection,
    VisGraphClusterNode,
    VisGraphCombinedNode,
    VisGraphNode,
    VisGraphNodeType,
} from './vis/VisGraphGenerator';
import { DEFAULT_LINEAGE_DISTANCE, LINEAGE_DIRECTIONS } from './constants';
import { VisGraph } from './vis/VisGraph';
import { getStateQueryGridModel } from '../../models';
import { gridInit } from '../../actions';
import { getQueryGridModel } from '../../global';
import { Detail } from '../forms/detail/Detail';
import { loadLineageIfNeeded } from './actions';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { AppURL } from '../../url/AppURL';
import { Alert } from '../base/Alert';
import { QueryGridModel, SchemaQuery } from '../base/models/model';
import { SVGIcon, Theme } from '../base/SVGIcon';

const omittedColumns = List(['Alias', 'Description', 'Name', 'SampleSet', 'DataClass']);
const requiredColumns = List(['Run']);

interface LinageGraphProps {
    lsid: string
    navigate: (node: VisGraphNode) => any
    members?: LINEAGE_DIRECTIONS
    distance?: number
    filters?: List<LineageFilter>
    filterIn?: boolean
    grouping?: ILineageGroupingOptions
    hideLegacyLinks?: boolean
    initialModel?: QueryGridModel
}

export class LineageGraph extends ReactN.Component<LinageGraphProps, any> {

    componentDidMount() {
        loadLineageIfNeeded(this.props.lsid, this.props.distance);
    }

    componentWillReceiveProps(nextProps) {
        if (this.props.lsid !== nextProps.lsid || this.props.distance !== nextProps.distance) {
            loadLineageIfNeeded(nextProps.lsid, nextProps.distance);
        }
    }

    getLineage(): Lineage {
        // need to access this.global directly to connect this component to the re-render cycle
        return this.global.QueryGrid_lineageResults.get(this.props.lsid);
    }

    render() {
        return <LineageGraphDisplay {...this.props} lineage={this.getLineage()}/>
    }
}

interface LineageGraphDisplayProps extends LinageGraphProps {
    lineage: Lineage
}

interface LineageGraphDisplayState {
    hoverNode?: VisGraphNodeType
    selectedNodes?: Array<VisGraphNodeType>
}

class LineageGraphDisplay extends React.PureComponent<LineageGraphDisplayProps, LineageGraphDisplayState> {

    static defaultProps = {
        filterIn: true,
        distance: DEFAULT_LINEAGE_DISTANCE
    };

    private readonly visGraphRef = undefined;

    constructor(props: LineageGraphDisplayProps) {
        super(props);

        this.visGraphRef = React.createRef();

        this.state = {};
    }

    clearHover = (): void => {
        this.updateHover(undefined);
    };

    // if the node is in the graph, it is clickable in the summary panel
    isNodeInGraph = (node: LineageNode): boolean => {
        let lsid = node.get('lsid');

        const visGraph = this.visGraphRef.current;
        if (visGraph) {
            let network = visGraph.getNetwork();
            let clusterIds = network.findNode(lsid);
            return clusterIds.length > 0;
        }

        return false;
    };

    onSummaryNodeClick = (node: LineageNode): void => {
        this.onSummaryNodeMouseOut(node);
        const visGraph = this.visGraphRef.current;
        if (visGraph) {
            // select the node
            let lsid = node.get('lsid');
            visGraph.selectNodes([lsid]);
        }
    };

    onSummaryNodeMouseEvent = (node: LineageNode, hover: boolean) => {
        // clear the hoverNode so the popover will hide
        this.clearHover();

        const visGraph = this.visGraphRef.current;
        if (visGraph) {
            visGraph.highlightNode(node, hover);
        }
    };

    onSummaryNodeMouseOut = (node: LineageNode): void => {
        this.onSummaryNodeMouseEvent(node, false);
    };

    onSummaryNodeMouseOver = (node: LineageNode): void => {
        this.onSummaryNodeMouseEvent(node, true);
    };

    onVisGraphNodeDoubleClick = (visNode: VisGraphNode): void => {
        this.props.navigate(visNode);
    };

    onVisGraphNodeSelect = (selectedNodes: Array<VisGraphNodeType>): void => {
        this.setState({
            selectedNodes
        });
    };

    onVisGraphNodeDeselect = (selectedNodes: Array<VisGraphNodeType>): void => {
        this.setState({
            selectedNodes
        });
    };

    onVisGraphNodeBlur = (): void => {
        this.clearHover();
    };

    updateHover = (hoverNode: VisGraphNodeType): void => {
        this.setState({
            hoverNode,
        });
    };

    renderSelectedNodes(seed: string) {
        const { selectedNodes, hoverNode } = this.state;

        if (!selectedNodes || selectedNodes.length == 0) {
            return <em>Select a node from the graph to view the details.</em>;
        }
        else if (selectedNodes.length === 1) {
            const hoverNodeLsid = hoverNode && hoverNode.kind === 'node' && hoverNode.lineageNode && hoverNode.lineageNode.lsid;
            const selectedNode = selectedNodes[0];
            switch (selectedNode.kind) {
                case 'node':     return this.renderSelectedGraphNode(seed, hoverNodeLsid, selectedNode);
                case 'combined': return this.renderSelectedCombinedNode(seed, hoverNodeLsid, selectedNode);
                case 'cluster':  return this.renderSelectedClusterNode(seed, hoverNodeLsid, selectedNode);
                default:
                    throw new Error('unknown node kind');
            }
        }
        else {
            return <div>multiple selected nodes</div>;
        }
    }

    renderSelectedGraphNode(seed: string, hoverNodeLsid: string, node: VisGraphNode, showLineageSummary: boolean = true) {
        const lineageNode = node.lineageNode;
        const model = this.getNodeGridDataModel(lineageNode);

        return (
            <SelectedNodeDetail
                seed={seed}
                node={lineageNode}
                entityModel={model}
                highlightNode={hoverNodeLsid}
                isNodeInGraph={this.isNodeInGraph}
                onNodeMouseOver={this.onSummaryNodeMouseOver}
                onNodeMouseOut={this.onSummaryNodeMouseOut}
                onNodeClick={this.onSummaryNodeClick}
                hideLegacyLinks={this.props.hideLegacyLinks}
                showLineageSummary={showLineageSummary}
            />
        );
    }

    renderSelectedClusterNode(seed: string, hoverNodeLsid: string, node: VisGraphClusterNode) {
        // LineageNodes in the cluster
        const nodes = node.nodesInCluster.map(n => n.kind === 'node' && n.lineageNode);

        return <ClusterNodeDetail nodes={nodes}
                                  nodesByType={undefined}
                                  highlightNode={hoverNodeLsid}
                                  onNodeMouseOver={this.onSummaryNodeMouseOver}
                                  onNodeMouseOut={this.onSummaryNodeMouseOut}
                                  onNodeClick={this.onSummaryNodeClick} />;
    }

    renderSelectedCombinedNode(seed: string, hoverNodeLsid: string, node: VisGraphCombinedNode) {
        const { lineage } = this.props;
        if (!lineage && !lineage.result)
            return;

        return <ClusterNodeDetail nodes={node.containedNodes}
                                  nodesByType={node.containedNodesByType}
                                  highlightNode={hoverNodeLsid}
                                  onNodeMouseOver={this.onSummaryNodeMouseOver}
                                  onNodeMouseOut={this.onSummaryNodeMouseOut}
                                  onNodeClick={this.onSummaryNodeClick} />;
    }

    getNodeGridDataModel(node: LineageNode): QueryGridModel|undefined {
        if (node.schemaName && node.queryName && node.rowId) {
            return getStateQueryGridModel('lineage-selected', SchemaQuery.create(node.schemaName, node.queryName), {
                allowSelection: false,
                omittedColumns,
                requiredColumns
            }, node.rowId);
        }
    }

    createInitialLineageNode(): LineageNode {
        const { initialModel } = this.props;
        const row = initialModel.getRow();
        const lsid = row.getIn(['LSID', 'value']);

        return LineageNode.create(lsid, {
            name: row.getIn(['Name', 'value']),
            schemaName: initialModel.schema,
            queryName: initialModel.query,
            rowId: row.getIn(['RowId', 'value']),
            url: row.getIn(['RowId', 'url']),
            meta: new LineageNodeMetadata({
                displayType: initialModel.queryInfo.title,
                description: row.getIn(['Description', 'value'])
            }),
            lsid
        })
    }

    render() {
        const { lineage, filters, filterIn, grouping } = this.props;

        if (lineage) {
            if (lineage.error) {
                return <Alert>{lineage.error}</Alert>
            }

            const graphOptions = lineage.generateGraph(new LineageOptions({
                filters,
                filterIn,
                grouping: grouping ? new LineageGroupingOptions(grouping): undefined,
            }));

            const lineageGridHref = AppURL.create('lineage')
                .addParams({
                    seeds: lineage.getSeed(),
                    distance: this.props.distance
                })
                .toHref();

            return (
                <div className='row'>
                    <div className='col-md-8'>
                        <VisGraph
                            ref={this.visGraphRef}
                            lineageGridHref={lineageGridHref}
                            onNodeDoubleClick={this.onVisGraphNodeDoubleClick}
                            onNodeSelect={this.onVisGraphNodeSelect}
                            onNodeDeselect={this.onVisGraphNodeDeselect}
                            onNodeHover={this.updateHover}
                            onNodeBlur={this.onVisGraphNodeBlur}
                            options={graphOptions}
                            seed={lineage.getSeed()}
                        />
                    </div>
                    <div className='col-md-4 lineage-node-detail-container'>
                        {this.renderSelectedNodes(lineage.getSeed())}
                    </div>
                </div>
            )
        }
        else {
            return (
                <div className='row'>
                    <div className='col-md-8'>
                        <div className='top-spacing'>
                            <LoadingSpinner  msg="Loading lineage..."/>
                        </div>
                    </div>
                    <div className='col-md-4 lineage-node-detail-container'>
                        {this.props.initialModel ? this.renderSelectedGraphNode(this.props.lsid, undefined, {
                            id: this.props.lsid,
                            cid: 0,
                            kind: 'node',
                            lineageNode: this.createInitialLineageNode()
                        }, false) : <LoadingSpinner msg={"Loading details..."}/>}
                    </div>
                </div>
            )
        }
    }
}


interface SelectedNodeProps {
    entityModel?: QueryGridModel
    hideLegacyLinks?: boolean
    highlightNode?: string
    node: LineageNode
    isNodeInGraph?: (node: LineageNode) => boolean
    onNodeMouseOver?: (node: LineageNode) => void
    onNodeMouseOut?: (node: LineageNode) => void
    onNodeClick?: (node: LineageNode) => void
    seed: string
    showLineageSummary?: boolean
}

// TODO: Refactor and share with ComponentDetailHOCImpl?
class SelectedNodeDetail extends ReactN.Component<SelectedNodeProps> {

    static defaultProps = {
        showLineageSummary: true
    };

    componentDidMount() {
        this.loadEntity(this.props);
    }

    componentWillReceiveProps(nextProps: SelectedNodeProps) {
        this.loadEntity(nextProps);
    }

    loadEntity(props: SelectedNodeProps) {
        const { entityModel } = props;
        if (entityModel) {
            gridInit(entityModel, true, this);
        }
    }

    getQueryGridModel(): QueryGridModel {
        const { entityModel } = this.props;
        if (entityModel) {
            return getQueryGridModel(entityModel.getId());
        }
    }

    handleLinkClick = (evt: React.MouseEvent): boolean => {
        evt.stopPropagation();
        return false;
    };

    onNodeMouseOver = (node: LineageNode): void => {
        if (this.props.onNodeMouseOver) {
            this.props.onNodeMouseOver(node);
        }
    };

    onNodeMouseOut = (node: LineageNode): void => {
        if (this.props.onNodeMouseOut) {
            this.props.onNodeMouseOut(node);
        }
    };

    isNodeInGraph = (node: LineageNode): boolean => {
        if (this.props.isNodeInGraph) {
            return this.props.isNodeInGraph(node);
        }
        return false;
    };

    onNodeClick = (node: LineageNode): void => {
        if (this.props.onNodeClick) {
            this.props.onNodeClick(node);
        }
    };

    render() {
        const { seed, node, highlightNode, hideLegacyLinks, showLineageSummary } = this.props;
        const url = node.url;
        const lineageUrl = url + '/lineage';
        const name = node.name;
        const isSeed = seed === node.lsid;

        let description;
        let aliases;
        let displayType;
        if (node.meta) {
            description = node.meta.description;
            aliases = node.meta.aliases;
            displayType = node.meta.displayType;
        }

        const model = this.getQueryGridModel();
        if (!model || !model.isLoaded) {
            return <LoadingSpinner msg="Loading details..."/>
        }

        const queryInfo = model.queryInfo;
        let legacyRunLineageUrl;
        let legacyDetailsLineageUrl;
        const row = model.getRow();
        if (row && row.get('Run')) {
            const runId = row.get('Run').get('value');

            legacyRunLineageUrl = ActionURL.buildURL('experiment', 'showRunGraph.view', LABKEY.container.path, {
                rowId: runId,
            });

            // see DotGraph.TYPECODE_* constants
            const typePrefix =
                node.type === 'Sample' ? 'M' :
                    node.type === 'Data' ? 'D' : 'A';
            legacyDetailsLineageUrl = ActionURL.buildURL('experiment', 'showRunGraphDetail.view', LABKEY.container.path, {
                rowId: runId,
                detail: true,
                focus: typePrefix + node.rowId
            });
        }

        return <>
            <div className="margin-bottom lineage-node-detail" >
                <i className="component-detail--child--img">
                    <SVGIcon
                        iconDir={'_images'}
                        theme={Theme.ORANGE}
                        iconSrc={queryInfo.getIconURL()}
                        height="50px"
                        width="50px"/>
                </i>
                <div className="text__truncate">
                    <div className="lineage-name">
                        <h4 className="no-margin-top lineage-name-data">
                            {(lineageUrl && !isSeed) &&
                            <a href={lineageUrl} onClick={this.handleLinkClick}>{name}</a>
                            ||
                            name
                            }
                            <div className='pull-right'>
                                <a href={url}
                                   className='lineage-data-link-left'
                                   onClick={this.handleLinkClick}>
                                    <span className='lineage-data-link--text'>Overview</span>
                                </a>
                                <a href={lineageUrl} className='lineage-data-link-right'
                                   onClick={this.handleLinkClick}>
                                    <span className='lineage-data-link--text'>Lineage</span>
                                </a>
                            </div>
                        </h4>
                    </div>
                    {displayType && <small>{displayType}</small>}
                    {aliases && <div>
                        <small>
                            {aliases.join(', ')}
                        </small>
                    </div>}
                    {description && <small title={description}>{description}</small>}
                </div>
            </div>

            {!hideLegacyLinks && LABKEY.user && LABKEY.user.isAdmin && legacyRunLineageUrl && <div className="pull-right">
                <small title='(admin only) old school lineage graphs, opens in new window'><em>
                    Legacy:&nbsp;
                    <a target='_blank' href={legacyRunLineageUrl} onClick={this.handleLinkClick}>run</a>
                    &nbsp;|&nbsp;
                    <a target='_blank' href={legacyDetailsLineageUrl} onClick={this.handleLinkClick}>details</a>
                </em></small>
            </div>}

            <Detail queryModel={model} />

            {showLineageSummary && (
                <LineageSummary
                    seed={node.lsid}
                    showRuns={true}
                    highlightNode={highlightNode}
                    isNodeInGraph={this.isNodeInGraph}
                    onNodeMouseOver={this.onNodeMouseOver}
                    onNodeMouseOut={this.onNodeMouseOut}
                    onNodeClick={this.onNodeClick}
                />
            )}

        </>;
    }
}


interface ClusterNodeDetailProps {
    highlightNode?: string
    isNodeInGraph?: (node: LineageNode) => boolean
    nodes: Array<LineageNode>
    nodesByType: {[key:string]: LineageNodeCollection}
    onNodeMouseOver?: (node: LineageNode) => void
    onNodeMouseOut?: (node: LineageNode) => void
    onNodeClick?: (node: LineageNode) => void
}

class ClusterNodeDetail extends React.PureComponent<ClusterNodeDetailProps> {

    onNodeMouseOver = (node: LineageNode): void => {
        if (this.props.onNodeMouseOver) {
            this.props.onNodeMouseOver(node);
        }
    };

    onNodeMouseOut = (node: LineageNode): void => {
        if (this.props.onNodeMouseOut) {
            this.props.onNodeMouseOut(node);
        }
    };

    isNodeInGraph = (node: LineageNode): boolean => {
        if (this.props.isNodeInGraph) {
            return this.props.isNodeInGraph(node);
        }
        return false;
    };

    onNodeClick = (node: LineageNode): void => {
        if (this.props.onNodeClick) {
            this.props.onNodeClick(node);
        }
    };

    render() {
        const { nodes, highlightNode } = this.props;

        let nodesByType: {[key:string]: LineageNodeCollection};
        if (this.props.nodesByType) {
            nodesByType = this.props.nodesByType;
        }
        else {
            nodesByType = createLineageNodeCollections(nodes);
        }

        const groups = Object.keys(nodesByType).sort();

        let iconURL;
        let title;
        if (groups.length === 1) {
            title = nodes.length + ' ' + groups[0];
            iconURL = nodes[0].meta.iconURL;
        }
        else {
            title = nodes.length + ' items of different types';
            iconURL = 'default';
        }

        return <>
            <div className="margin-bottom lineage-node-detail">
                <i className="component-detail--child--img">
                    <SVGIcon
                        iconDir={'_images'}
                        theme={Theme.ORANGE}
                        iconSrc={iconURL}
                        height="50px"
                        width="50px"/>
                </i>
                <div className="text__truncate">
                    <div className="lineage-name">
                        <h4 className="no-margin-top lineage-name-data">
                            {title}
                        </h4>
                    </div>
                </div>
            </div>

            {groups.map(groupName =>
                <LineageNodeList
                    key={groupName}
                    title={groupName}
                    nodes={nodesByType[groupName]}
                    onNodeClick={this.onNodeClick}
                    onNodeMouseOut={this.onNodeMouseOut}
                    onNodeMouseOver={this.onNodeMouseOver}
                    isNodeInGraph={this.isNodeInGraph}
                    highlightNode={highlightNode}
                />
            )}
        </>;
    }
}
