/*
 * Copyright (c) 2016-2020 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, PureComponent, memo, ReactNode, useMemo } from 'react';
import { Link, WithRouterProps } from 'react-router';

import {
    AppURL,
    BreadcrumbCreate,
    DetailPanel,
    InjectedQueryModels,
    LoadingSpinner,
    Page,
    PageHeader,
    SchemaQuery,
    SCHEMAS,
    withQueryModels,
} from '../../../..';

interface BodyProps {
    id: string;
}

class DetailBodyImpl extends PureComponent<BodyProps & InjectedQueryModels> {
    get title(): string {
        const { id, queryModels } = this.props;
        const model = queryModels[id];
        const { gridData, hasRows, queryInfo } = model;
        let title: string;

        if (queryInfo && hasRows) {
            const row = gridData[0];
            const { queryLabel, titleColumn } = queryInfo;
            let potentialValues = [];

            if (titleColumn && row[titleColumn]) {
                const { displayValue, formattedValue, value } = row[titleColumn];
                potentialValues = potentialValues.concat([formattedValue, displayValue, value]);
            }

            if (queryLabel && row[queryLabel]) {
                const { displayValue, formattedValue, value } = row[queryLabel];
                potentialValues = potentialValues.concat([formattedValue, displayValue, value]);
            }

            title = potentialValues.find(v => v !== undefined && v !== null);
        }

        return title;
    }

    render(): ReactNode {
        const { actions, id, queryModels } = this.props;
        const model = queryModels[id];

        if (model.isLoading) {
            return <LoadingSpinner />;
        }

        const { queryInfo } = model;
        const { name, plural, schemaLabel, schemaName } = queryInfo;
        const title = this.title;
        const pageTitle = schemaLabel + ' - ' + plural + ' ' + title;
        const row = model.gridData[0];

        return (
            <Page hasHeader={true} title={pageTitle}>
                <BreadcrumbCreate row={row}>
                    <Link to={AppURL.create('q').toString()}>Schemas</Link>
                    <Link to={AppURL.create('q', schemaName).toString()}>{schemaLabel}</Link>
                    <Link to={AppURL.create('q', schemaName, name).toString()}>{plural}</Link>
                </BreadcrumbCreate>
                {title && <PageHeader title={title} />}
                <DetailPanel actions={actions} asPanel model={model} />
            </Page>
        );
    }
}

const DetailBody = withQueryModels<BodyProps>(DetailBodyImpl);

export const QueryDetailPage: FC<WithRouterProps> = memo(({ params }) => {
    const { schema, query, id } = params;
    const modelId = `q.details.${schema}.${query}.${id}`;

    const queryConfigs = useMemo(
        () => ({
            [modelId]: {
                bindURL: true,
                keyValue: id,
                requiredColumns: SCHEMAS.CBMB.toArray(),
                schemaQuery: SchemaQuery.create(schema, query),
            },
        }),
        [modelId]
    );

    // Key is used here so that if the schema or query change via the URL we remount the component which will
    // instantiate a new model and reload all page data.
    return <DetailBody autoLoad id={modelId} key={modelId} queryConfigs={queryConfigs} />;
});
