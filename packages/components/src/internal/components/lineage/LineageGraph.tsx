/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PureComponent } from 'react';
import { Experiment } from '@labkey/api';

import { Alert } from '../base/Alert';

import { LoadingSpinner } from '../base/LoadingSpinner';

import { InjectedLineage, withLineage, WithLineageOptions } from './withLineage';
import { NodeInteractionProvider, WithNodeInteraction } from './actions';
import { LINEAGE_DIRECTIONS, LineageOptions } from './types';
import { isBasicNode, VisGraphOptions, VisGraphNode, VisGraphNodeType } from './models';
import { VisGraph } from './vis/VisGraph';
import { LineageNodeDetailFactory } from './node/LineageNodeDetailFactory';
import { DEFAULT_LINEAGE_DISTANCE } from './constants';

interface LineageGraphOwnProps {
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

type Props = InjectedLineage & LineageGraphDisplayOwnProps & WithLineageOptions & LineageGraphOwnProps & LineageOptions;

class LineageGraphDisplay extends PureComponent<Props, Partial<State>> {
    private readonly visGraphRef = React.createRef<VisGraph>();

    constructor(props: Props) {
        super(props);

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
    isNodeInGraph = (item: Experiment.LineageItemBase): boolean => {
        return this.visGraphRef.current?.getNetwork().findNode(item.lsid).length > 0;
    };

    onSummaryNodeClick = (item: Experiment.LineageItemBase): void => {
        this.onSummaryNodeMouseOut(item);
        this.visGraphRef.current?.selectNodes([item.lsid]);
    };

    onSummaryNodeMouseEvent = (item: Experiment.LineageItemBase, hover: boolean): void => {
        // clear the hoverNode so the popover will hide
        this.clearHover();
        this.visGraphRef.current?.highlightNode(item.lsid, hover);
    };

    onSummaryNodeMouseOut = (item: Experiment.LineageItemBase): void => {
        this.onSummaryNodeMouseEvent(item, false);
    };

    onSummaryNodeMouseOver = (item: Experiment.LineageItemBase): void => {
        this.onSummaryNodeMouseEvent(item, true);
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

export const LineageGraph = withLineage<LineageGraphOwnProps>((props: Props) => {
    // Optimization: This FunctionComponent allows for "generateGraph" to only be called
    // when the lineage is updated. If it is called in the render loop of <LineageGraphDisplay/>
    // it is run each time a user interacts with the graph (e.g. hovers a node, clicks a node, etc).
    if (props.lineage?.error) {
        return <Alert>{props.lineage.error}</Alert>;
    }

    return <LineageGraphDisplay {...props} visGraphOptions={props.lineage?.generateGraph(props)} />;
});

interface LineageDepthLimitProps {
    className?: string;
    isRoot?: boolean;
    maxDistance?: number;
    nodeName?: string;
}
export const LineageDepthLimitMessage: FC<LineageDepthLimitProps> = memo(props => {
    const { className, maxDistance, isRoot, nodeName } = props;

    return (
        <div className={className}>
            Note: Showing a maximum of {maxDistance} generations{isRoot ? '' : ' from ' + nodeName}.
        </div>
    );
});

LineageDepthLimitMessage.defaultProps = {
    className: 'lineage-graph-generation-limit-msg',
    maxDistance: DEFAULT_LINEAGE_DISTANCE,
    nodeName: 'the seed node',
};
