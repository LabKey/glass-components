/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FunctionComponent, PureComponent, ReactNode } from 'react';

import { GridColumn } from '../base/models/GridColumn';
import { Grid } from '../base/Grid';

import { InjectedLineage, withLineage } from './withLineage';

class CountsWithLineageImpl extends PureComponent<InjectedLineage> {
    private readonly columns = [
        new GridColumn({
            index: 'name',
            title: 'Sample Type',
        }),
        new GridColumn({
            index: 'sampleCount',
            title: 'Number of Samples',
        }),
        new GridColumn({
            index: 'modified',
            title: 'Most Recent (Date)',
        }),
    ];

    render(): ReactNode {
        const { lineage } = this.props;
        const data = lineage?.sampleStats?.filter(stats => stats.getIn(['sampleCount', 'value']) > 0).toList();

        return (
            <Grid
                columns={this.columns}
                data={data}
                emptyText={lineage?.error ?? 'No derived samples'}
                isLoading={!lineage?.isLoaded()}
            />
        );
    }
}

const CountsWithLineage = withLineage<{}>(CountsWithLineageImpl, false, true, false);

// Don't expose props from withLineage in public component
export const SampleTypeLineageCounts: FunctionComponent<{ seed: string }> = props => {
    return <CountsWithLineage lsid={props.seed} />;
};
