/*
 * Copyright (c) 2017-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { Component } from 'react';
import { DataSet } from 'vis-data';
import { Edge, IdType, Network, Node } from 'vis-network';

import { isCombinedNode, VisGraphCombinedNode, VisGraphNodeType, VisGraphOptions } from '../models';

import { VisGraphControls } from './VisGraphControls';

export type HoverNodeCoords = { bottom: number; left: number; right: number; top: number };

// Directly from https://github.com/visjs/vis-network/blob/v6.5.2/lib/network/shapes.ts#L9
/**
 * Draw a circle.
 *
 * @param ctx - The context this shape will be rendered to.
 * @param x - The position of the center on the x axis.
 * @param y - The position of the center on the y axis.
 * @param r - The radius of the circle.
 */
function drawCircle(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI, false);
    ctx.closePath();
}

// defined in vis/lib/network/shapes.js
interface InternalVisNetwork extends Network {
    body: {
        container: HTMLElement;
        nodeIndices: IdType[];
        nodes: { [key: string]: InternalVisNode };
    };
    layoutEngine: {
        _centerParent: (node: InternalVisNode) => void;
    };
}

// defined in vis/lib/network/modules/components/Node.js
interface InternalVisNode {
    hover: boolean;
    id: string;
    options: Node;
    shape: {
        height: number;
        left: number;
        radius: number;
        top: number;
        width: number;
    };
    x: number;
    y: number;
}

// https://visjs.org/docs/network/#Events
interface VisPointerEvent {
    DOM: { x: number; y: number };
    canvas: { x: number; y: number };
}

interface VisClickEvent {
    edges: Array<number | string>;
    event: MouseEvent;
    nodes: Array<number | string>;
    pointer: VisPointerEvent;
}

interface VisDeselectEvent extends VisClickEvent {
    previousSelection: {
        edges: Array<number | string>;
        nodes: Array<number | string>;
    };
}

interface VisHoverEvent {
    event: MouseEvent;
    node: string;
    pointer: VisPointerEvent;
}

interface VisGraphProps {
    fitOnResize?: boolean;
    onNodeBlur?: () => void;
    onNodeClick?: (clickedNode: VisGraphNodeType) => void;
    onNodeDeselect?: (selectedNodes: VisGraphNodeType[], previousSelectedNodes: VisGraphNodeType[]) => void;
    onNodeDoubleClick?: (clickedNode: VisGraphNodeType) => void;
    onNodeHover?: (node: VisGraphNodeType, coords: HoverNodeCoords) => void;
    onNodeSelect?: (selectedNodes: VisGraphNodeType[]) => void;
    onToggleSettings: () => void;
    options: VisGraphOptions;
    seed?: string;
}

interface VisGraphState {
    selected?: string[];
}

export class VisGraph extends Component<VisGraphProps, VisGraphState> {
    static defaultProps = {
        fitOnResize: true,
    };

    data: {
        edges: DataSet<Edge>;
        nodes: DataSet<VisGraphNodeType>;
    };

    network: InternalVisNetwork;

    private visgraph: React.RefObject<HTMLDivElement>;

    constructor(props: VisGraphProps) {
        super(props);

        this.state = { selected: undefined };

        this.visgraph = React.createRef();
    }

    componentDidMount(): void {
        this.generateGraph(this.props);
    }

    componentWillUnmount(): void {
        this.destroyGraph();
    }

    shouldComponentUpdate(nextProps): boolean {
        return this.props.seed !== nextProps.seed || this.props.options?.nodes !== nextProps.options?.nodes;
    }

    componentDidUpdate(): void {
        this.generateGraph(this.props);
    }

    highlightNode = (id: string, hover: boolean): void => {
        if (id && this.data) {
            // findNode will return any cluster node ids that the node is within.
            // If the node is in a cluster, highlight it the cluster instead
            const clusterIds = this.network.findNode(id);
            if (clusterIds && clusterIds.length) {
                const topNodeId = clusterIds[0];
                if (topNodeId) {
                    // reaching into the vis.js internal structure to get the graph's Node object
                    const internalNode = this.getInternalNode(topNodeId);
                    internalNode.hover = hover;

                    this.moveNodeToTop(topNodeId);

                    // force a redraw to see the hover state applied to the node
                    this.network.redraw();
                }
            }
        }
    };

    // move the node to the end of the list so it is drawn on top of it's neighbors
    private moveNodeToTop = (id: IdType): void => {
        const { nodeIndices } = this.network.body;
        const idx = nodeIndices.indexOf(id);
        nodeIndices.splice(idx, 1);
        nodeIndices.push(id);
    };

    destroyGraph = (): void => {
        if (this.network) {
            this.network.destroy();
            this.network = undefined;
        }
        if (this.data) {
            this.data = undefined;
        }
    };

    fitGraph = (): void => {
        const { seed } = this.props;

        // NK: This is an arbitrarily set heuristic for deciding when to focus vs when to fit to
        // the entire graph. I'm trying to delineate "small" graphs from "large" graphs.
        if (this.network.body.nodeIndices.length > 50 && seed) {
            // Focus on the seed (if set)
            this.network.fit({ animation: false, nodes: [seed] });

            // Zoom out a bit from the default fitted zoom level
            const scale = this.network.getScale() - 0.25;
            if (scale > 0) {
                this.network.moveTo({ scale });
            }
        } else {
            this.network.fit();
        }
    };

    private getInternalNode = (id: IdType): InternalVisNode => {
        return this.network.body.nodes[id];
    };

    getCombinedNodes = (): VisGraphCombinedNode[] => {
        return this.data.nodes.get({ filter: isCombinedNode }) as VisGraphCombinedNode[];
    };

    getNodes = (ids: IdType[]): VisGraphNodeType[] => {
        return ids.map(this.getNode).filter(n => n !== null && n !== undefined);
    };

    getNode = (id: IdType): VisGraphNodeType => {
        const node = this.data.nodes.get(id);
        if (node && this.network.isCluster(id)) {
            const nodesInCluster = this.network.getNodesInCluster(id);
            return {
                kind: 'cluster',
                id,
                nodesInCluster: this.getNodes(nodesInCluster),
            };
        }

        return node;
    };

    // set a selection on the vis.js graph and fire the select handler as if the user clicked on a node in the graph
    selectNodes = (ids: string[]): void => {
        const selectedNodes = this.getNodes(ids);
        this.doSelectNode(selectedNodes);

        // get the actual ids from the nodes -- some may not have been found
        this.network.setSelection({
            edges: [],
            nodes: selectedNodes.map(n => n.id),
        });
    };

    private doSelectNode = (selectedNodes: VisGraphNodeType[]): void => {
        // change color of newly selected node
        const addToSelection = [];
        for (let i = 0; i < selectedNodes.length; i++) {
            const selectedNode = selectedNodes[i];
            if (!selectedNode) continue;
            addToSelection.push(selectedNode.id);
        }

        // add the newly selected node in the state
        this.setState(prevState => ({
            selected: this.unique(prevState.selected, addToSelection),
        }));

        this.props.onNodeSelect?.(selectedNodes);
    };

    // create a new array from the two arrays with any duplicates removed
    private unique = (a: string[], b: string[]): string[] => {
        const ret = [].concat(a);
        for (let i = 0; i < b.length; i++) {
            const item = b[i];
            if (ret.indexOf(item) == -1) ret.push(item);
        }
        return ret;
    };

    private onClick = (visEvent: VisClickEvent): void => {
        if (visEvent.nodes.length !== 1) {
            return;
        }

        const id = visEvent.nodes[0];
        const clickedNode = this.getNode(id);
        if (clickedNode) {
            this.props.onNodeClick?.(clickedNode);
        } else {
            // it could happen that the graph was reset after an expanded node was selected in which case the selected node might no longer exist
            // the node specified by selected no longer exist so reset selected
            this.setState(prevState => {
                let newSelected;
                if (prevState.selected) {
                    newSelected = [];
                    for (let i = 0; i < prevState.selected.length; i++) {
                        if (prevState.selected[i] !== id) newSelected.push(prevState.selected[i]);
                    }
                }
                return { selected: newSelected };
            });
        }
    };

    private onDoubleClick = (visEvent: VisClickEvent): void => {
        if (visEvent.nodes.length === 1) {
            this.props.onNodeDoubleClick?.(this.getNode(visEvent.nodes[0]));
        }
    };

    private onNodeBlur = (): void => {
        this.network.body.container.style.cursor = 'default';
        this.props.onNodeBlur?.();
    };

    private onNodeDeselect = (visEvent: VisDeselectEvent): void => {
        if (this.props.onNodeDeselect) {
            const selectedNodes = this.getNodes(visEvent.nodes);
            // event.previousSelection.nodes is supposed to contain an array of node identifiers (string | number),
            // however, there is a bug in v9.1.9 of vis-network that broke this contract and
            // event.previousSelection is an array of nodes. Mapping back to identifiers here.
            // See https://github.com/visjs/vis-network/issues/1688
            const previousNodeIds = visEvent.previousSelection.nodes.map((n: any) => n.id);
            const previousSelectedNodes = this.getNodes(previousNodeIds);
            this.props.onNodeDeselect(selectedNodes, previousSelectedNodes);
        }
    };

    private onNodeHover = (event: VisHoverEvent): void => {
        this.network.body.container.style.cursor = 'pointer';

        const id = event.node;
        const node = this.getNode(id);
        if (node) {
            this.moveNodeToTop(id);

            if (this.props.onNodeHover) {
                const canvasBox = this.network.getBoundingBox(id);

                // convert the node's canvas box to DOM coordinates
                const topLeftDOM = this.network.canvasToDOM({
                    x: canvasBox.left,
                    y: canvasBox.top,
                });
                const bottomRightDOM = this.network.canvasToDOM({
                    x: canvasBox.right,
                    y: canvasBox.bottom,
                });

                const rect = this.visgraph.current.getBoundingClientRect();
                const coords = {
                    top: rect.top + topLeftDOM.y,
                    left: rect.left + topLeftDOM.x,
                    bottom: rect.top + bottomRightDOM.y,
                    right: rect.left + bottomRightDOM.x,
                };
                this.props.onNodeHover(node, coords);
            }
        }
    };

    private onNodeSelect = (visEvent: VisClickEvent): void => {
        this.doSelectNode(this.getNodes(visEvent.nodes));
    };

    private doAfterDrawing = (ctx: CanvasRenderingContext2D): void => {
        this.getCombinedNodes().forEach(combinedNode => {
            const internalNode = this.getInternalNode(combinedNode.id);
            if (!internalNode) {
                console.error('internal node not found for combined node: ' + combinedNode.id);
                return;
            }

            const { shape } = internalNode;
            const nodeCount = combinedNode.containedNodes.length;

            // set up circle clip area
            drawCircle(ctx, internalNode.x, internalNode.y, shape.radius);
            ctx.save();
            ctx.clip();

            // calculate the size of the font based on the shape size
            const text = '' + nodeCount;
            let fontSize = 28;
            let textMetrics;
            while (true) {
                if (fontSize < 8) break;
                ctx.font = fontSize + 'px arial';
                textMetrics = ctx.measureText(text);
                if (textMetrics.width < shape.width - 8) break;
                fontSize -= 4;
            }

            ctx.fillStyle = 'rgba(0,0,0,0.9)';
            ctx.shadowColor = 'rgba(0,0,0,0.25)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;

            ctx.fillText(text, internalNode.x - textMetrics.width / 2, internalNode.y - fontSize / 2);

            // remove clip
            ctx.restore();
        });
    };

    onReset = (selectSeed: boolean): void => {
        if (selectSeed) {
            this.selectNodes(this.props.options.initialSelection);
        }
        this.fitGraph();
    };

    getNetwork = (): Network => {
        return this.network;
    };

    private generateGraph = (props: VisGraphProps): void => {
        const { fitOnResize, options } = props;
        const { selected } = this.state;

        this.destroyGraph();

        if (!options) {
            throw new Error('VisGraph.generateGraph: options must be provided.');
        }

        this.data = {
            edges: options.edges,
            nodes: options.nodes,
        };

        this.network = new Network(this.visgraph.current, this.data, options.options) as InternalVisNetwork;
        this.network.on('afterDrawing', this.doAfterDrawing);
        this.network.on('blurNode', this.onNodeBlur);
        this.network.on('click', this.onClick);
        this.network.on('deselectNode', this.onNodeDeselect);
        this.network.on('doubleClick', this.onDoubleClick);
        this.network.on('hoverNode', this.onNodeHover);
        this.network.on('selectNode', this.onNodeSelect);

        if (fitOnResize) {
            let resize: number;
            this.network.on('resize', () => {
                // delay required to allow for element resizing to occur
                clearTimeout(resize);
                resize = window.setTimeout(() => {
                    resize = undefined;
                    this.network.redraw();
                    this.fitGraph();
                }, 75);
            });
        }

        const toSelect = props.options.initialSelection || selected;
        if (toSelect && toSelect.length) {
            this.selectNodes(toSelect);
        }

        this.fitGraph();
    };

    render() {
        // leave just enough room so the footer doesn't get pushed down when the visjs graph shows
        const graphHeight = window.innerHeight - 350;

        return (
            <div className="lineage-visgraph-ct">
                <div ref={this.visgraph} style={{ height: graphHeight }} />
                <VisGraphControls
                    getNetwork={this.getNetwork}
                    onReset={this.onReset}
                    onToggleSettings={this.props.onToggleSettings}
                />
            </div>
        );
    }
}
