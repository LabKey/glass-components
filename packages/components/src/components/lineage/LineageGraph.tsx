/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { PureComponent } from 'react';

import { Alert, LoadingSpinner } from '../..';

import { InjectedLineage, withLineage, WithLineageOptions } from './withLineage';
import { NodeInteractionProvider, WithNodeInteraction } from './actions';
import { LINEAGE_DIRECTIONS, LineageOptions } from './types';
import { LineageNode } from './models';
import { isBasicNode, VisGraphOptions, VisGraphNode, VisGraphNodeType } from './vis/VisGraphGenerator';
import { VisGraph } from './vis/VisGraph';
import { LineageNodeDetailFactory } from './node/LineageNodeDetailFactory';

interface LinageGraphOwnProps {
    members?: LINEAGE_DIRECTIONS;
    navigate?: (node: VisGraphNode) => any;
}

interface LineageGraphDisplayOwnProps {
    visGraphOptions: VisGraphOptions;
}

interface State {
    hoverNode: string;
    nodeInteractions: WithNodeInteraction;
    selectedNodes: VisGraphNodeType[];
}

type Props = InjectedLineage & LineageGraphDisplayOwnProps & WithLineageOptions & LinageGraphOwnProps & LineageOptions;

class LineageGraphDisplay extends PureComponent<Props, Partial<State>> {
    private readonly visGraphRef = undefined;

    constructor(props: Props) {
        super(props);

        this.visGraphRef = React.createRef();

        this.state = {
            nodeInteractions: {
                isNodeInGraph: this.isNodeInGraph,
                onNodeMouseOver: this.onSummaryNodeMouseOver,
                onNodeMouseOut: this.onSummaryNodeMouseOut,
                onNodeClick: this.onSummaryNodeClick,
            },
        };
    }

    clearHover = (): void => {
        this.updateHover(undefined);
    };

    // if the node is in the graph, it is clickable in the summary panel
    isNodeInGraph = (node: LineageNode): boolean => {
        return this.visGraphRef.current?.getNetwork().findNode(node.lsid).length > 0;
    };

    onSummaryNodeClick = (node: LineageNode): void => {
        this.onSummaryNodeMouseOut(node);
        this.visGraphRef.current?.selectNodes([node.lsid]);
    };

    onSummaryNodeMouseEvent = (node: LineageNode, hover: boolean): void => {
        // clear the hoverNode so the popover will hide
        this.clearHover();
        this.visGraphRef.current?.highlightNode(node, hover);
    };

    onSummaryNodeMouseOut = (node: LineageNode): void => {
        this.onSummaryNodeMouseEvent(node, false);
    };

    onSummaryNodeMouseOver = (node: LineageNode): void => {
        this.onSummaryNodeMouseEvent(node, true);
    };

    onVisGraphNodeDoubleClick = (visNode: VisGraphNode): void => {
        if (this.props.navigate) {
            this.props.navigate(visNode);
        }
    };

    onNodeSelectionChange = (selectedNodes: VisGraphNodeType[]): void => {
        this.setState({ selectedNodes });
    };

    updateHover = (node: VisGraphNodeType): void => {
        let hoverNode: string;

        if (node) {
            hoverNode = isBasicNode(node) && node.lineageNode && node.lineageNode.lsid;
        }

        this.setState({ hoverNode });
    };

    render() {
        const { lineage, lsid, visGraphOptions } = this.props;
        const { hoverNode, selectedNodes } = this.state;

        if (lineage?.error) {
            return <Alert>{lineage.error}</Alert>;
        }

        return (
            <NodeInteractionProvider value={this.state.nodeInteractions}>
                <div className="row">
                    <div className="col-md-8">
                        {lineage?.isLoaded() ? (
                            <VisGraph
                                ref={this.visGraphRef}
                                onNodeDoubleClick={this.onVisGraphNodeDoubleClick}
                                onNodeSelect={this.onNodeSelectionChange}
                                onNodeDeselect={this.onNodeSelectionChange}
                                onNodeHover={this.updateHover}
                                onNodeBlur={this.clearHover}
                                options={visGraphOptions}
                                seed={lsid}
                            />
                        ) : (
                            <LoadingSpinner msg="Loading lineage..." />
                        )}
                    </div>
                    <div className="col-md-4 lineage-node-detail-container">
                        <LineageNodeDetailFactory
                            highlightNode={hoverNode}
                            lineage={lineage}
                            lineageOptions={this.props}
                            selectedNodes={selectedNodes}
                        />
                    </div>
                </div>
            </NodeInteractionProvider>
        );
    }
}

export const LineageGraph = withLineage<LinageGraphOwnProps>((props: Props) => (
    // Optimization: This FunctionComponent allows for "generateGraph" to only be called
    // when the lineage is updated. If it is called in the render loop of <LineageGraphDisplay/>
    // it is run each time a user interacts with the graph (e.g. hovers a node, clicks a node, etc).
    <LineageGraphDisplay {...props} visGraphOptions={props.lineage?.generateGraph(props)} />
));
