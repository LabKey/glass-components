/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, PureComponent, ReactNode, useCallback, useMemo, useState } from 'react';

import { Tab, Tabs } from '../../../Tabs';
import { LineageSummary } from '../LineageSummary';
import {
    createLineageNodeCollections,
    isAliquotNode,
    LineageNodeCollectionByType,
    LineageIOWithMetadata,
    LineageNode,
} from '../models';
import { LineageOptions } from '../types';

import { Grid } from '../../base/Grid';
import { GridColumn } from '../../base/models/GridColumn';

import { hasModule } from '../../../app/utils';

import { LineageDetail } from './LineageDetail';
import { DetailHeader, NodeDetailHeader } from './NodeDetailHeader';
import { DetailsListLineageIO, DetailsListNodes, DetailsListSteps } from './DetailsList';

interface LineageNodeDetailProps {
    highlightNode?: string;
    lineageOptions?: LineageOptions;
    node: LineageNode;
    seed: string;
}

interface LineageNodeDetailState {
    stepIdx: number;
    tabKey: string;
}

const initialState: LineageNodeDetailState = {
    stepIdx: undefined,
    tabKey: 'details',
};

export class LineageNodeDetail extends PureComponent<LineageNodeDetailProps, LineageNodeDetailState> {
    readonly state: LineageNodeDetailState = initialState;

    componentDidUpdate(prevProps: Readonly<LineageNodeDetailProps>): void {
        const prevNode = prevProps.node;
        const { node } = this.props;

        if ((prevNode.isRun || node.isRun) && prevNode.lsid !== node.lsid) {
            this.setState(initialState);
        }
    }

    changeTab = (tabKey: string): void => {
        this.setState({ tabKey });
    };

    selectStep = (stepIdx: number): void => {
        this.setState({ stepIdx });
    };

    render(): ReactNode {
        const { seed, node, highlightNode, lineageOptions } = this.props;
        const { stepIdx, tabKey } = this.state;

        if (node.isRun && stepIdx !== undefined) {
            return <RunStepNodeDetail node={node} onBack={() => this.selectStep(undefined)} stepIdx={stepIdx} />;
        }

        const nodeDetails = (
            <>
                <LineageDetail item={node} />
                <LineageSummary
                    {...lineageOptions}
                    containerPath={node.container}
                    highlightNode={highlightNode}
                    key={node.lsid}
                    lsid={node.lsid}
                    prefetchSeed={false}
                />
            </>
        );

        return (
            <div className="lineage-node-detail">
                <NodeDetailHeader node={node} seed={seed} />
                {node.isRun ? (
                    <Tabs activeKey={tabKey} onSelect={this.changeTab}>
                        <Tab eventKey="details" title="Details">
                            {nodeDetails}
                        </Tab>
                        <Tab eventKey="runProperties" title="Run Properties">
                            <DetailsListSteps node={node} onSelect={this.selectStep} />
                            <DetailsListLineageIO item={node} />
                        </Tab>
                    </Tabs>
                ) : (
                    nodeDetails
                )}
            </div>
        );
    }
}

interface ClusterNodeDetailProps {
    highlightNode?: string;
    nodes: LineageNode[];
    nodesByType?: LineageNodeCollectionByType;
    options?: LineageOptions;
    parentNodeName?: string;
}

export class ClusterNodeDetail extends PureComponent<ClusterNodeDetailProps> {
    static getGroupDisplayName(nodesByType, groupName, parentNodeName?) {
        const group = nodesByType[groupName];
        const isAliquot = isAliquotNode(group);
        const aliquotDisplayName = (parentNodeName ? parentNodeName + ' ' : '') + 'Aliquots';
        return isAliquot ? aliquotDisplayName : group.displayType;
    }

    render(): ReactNode {
        const { highlightNode, nodes, options, parentNodeName } = this.props;

        const nodesByType = this.props.nodesByType ?? createLineageNodeCollections(nodes, options);
        const groups = Object.keys(nodesByType).sort();

        let iconURL;
        let title;
        if (groups.length === 1) {
            title = nodes.length + ' ' + ClusterNodeDetail.getGroupDisplayName(nodesByType, groups[0]);
            iconURL = nodes[0].iconProps.iconURL;
        } else {
            title = nodes.length + ' items of different types';
            iconURL = 'default';
        }

        return (
            <div className="cluster-node-detail">
                <DetailHeader header={title} iconSrc={iconURL} />
                {groups.map(groupName => {
                    const groupDisplayName = ClusterNodeDetail.getGroupDisplayName(
                        nodesByType,
                        groupName,
                        parentNodeName
                    );
                    return (
                        <DetailsListNodes
                            key={groupName}
                            title={groupDisplayName}
                            nodes={nodesByType[groupName]}
                            highlightNode={highlightNode}
                        />
                    );
                })}
            </div>
        );
    }
}

interface RunStepNodeDetailProps {
    node: LineageNode;
    onBack: () => void;
    stepIdx: number;
}

const RunStepNodeDetail: FC<RunStepNodeDetailProps> = memo(props => {
    const { node, onBack, stepIdx } = props;
    const [tabKey, setTabKey] = useState<string>('details');
    const step = node.steps.get(stepIdx);
    const stepName = step.protocol?.name || step.name;
    const hasProvenanceModule = useMemo(() => hasModule('provenance'), []);

    const changeTab = useCallback((newTabKey: string) => {
        setTabKey(newTabKey);
    }, []);

    return (
        <div className="run-step-node-detail">
            <DetailHeader header={`Run Step: ${stepName}`} iconSrc="default">
                <a className="lineage-link" onClick={onBack}>
                    <span>Back to Run Details</span>
                </a>
                <span className="spacer-left">&gt;</span>
                <span className="spacer-left">{stepName}</span>
            </DetailHeader>
            <Tabs activeKey={tabKey} onSelect={changeTab}>
                <Tab eventKey="details" title="Step Details">
                    <LineageDetail item={step} />
                    <DetailsListLineageIO item={step} />
                </Tab>
                {hasProvenanceModule && (
                    <Tab eventKey="provenanceMap" title="Provenance Map" className="lineage-run-step-provenance-map">
                        <RunStepProvenanceMap item={step} />
                    </Tab>
                )}
            </Tabs>
        </div>
    );
});
RunStepNodeDetail.displayName = 'RunStepNodeDetail';

const provenanceCellRenderer = (data, row) => {
    const name = data?.get('name');
    const url = data?.get('url');
    if (url) {
        return <a href={url}>{name}</a>;
    }
    return name;
};

const PROVENANCE_MAP_COLS = [
    new GridColumn({
        index: 'from',
        title: 'From',
        cell: provenanceCellRenderer,
    }),
    new GridColumn({
        index: 'to',
        title: 'To',
        cell: provenanceCellRenderer,
    }),
];

export interface RunStepProvenanceMapProps {
    item: LineageIOWithMetadata;
}

const RunStepProvenanceMap: FC<RunStepProvenanceMapProps> = memo(({ item }) => {
    return <Grid columns={PROVENANCE_MAP_COLS} data={item?.provenanceMap ?? []} />;
});
RunStepProvenanceMap.displayName = 'RunStepProvenanceMap';
