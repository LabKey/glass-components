import { assayPage } from './AssayPageHOC';
import { WithRouterProps } from 'react-router';
import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../public/QueryModel/withQueryModels';
import { InjectedAssayModel } from '../internal/components/assay/withAssayModels';
import React, { FC, memo, useMemo } from 'react';
import { LoadingPage } from '../internal/components/base/LoadingPage';
import { caseInsensitive } from '../internal/util/utils';
import { Filter } from '@labkey/api';
import { Page } from '../internal/components/base/Page';
import { AssayHeader } from './AssayHeader';
import { AssayBatchHeaderButtons } from './AssayButtons';
import { DetailPanel } from '../public/QueryModel/DetailPanel';
import { AssayGridPanel } from './AssayGridPanel';
import { CommonPageProps } from '../internal/models';
import { SchemaQuery } from '../public/SchemaQuery';
import { SCHEMAS } from '../internal/schemas';
import { AssayOverrideBanner } from './AssayOverrideBanner';
import { AssayLink } from '../internal/AssayDefinitionModel';

type Props = CommonPageProps & WithRouterProps & InjectedAssayModel & InjectedQueryModels;

const AssayBatchOverviewPageBody: FC<Props> = memo(props => {
    const { actions, assayDefinition, queryModels, menu } = props;
    const { model } = queryModels;
    const subTitle = 'Assay Batch Details';

    if (model.isLoading || !assayDefinition) {
        return <LoadingPage title={subTitle} />;
    }

    const row = model.getRow();
    const batchId = caseInsensitive(row, 'RowId').value;
    const batchName = caseInsensitive(row, 'Name').value;
    const runsFilter = [
        Filter.create('batch/rowId', batchId),
        // allow for the possibility of viewing runs that have been replaced
        Filter.create('Replaced', undefined, Filter.Types.NONBLANK),
    ];

    return (
        <Page title={batchName + ' - ' + subTitle} hasHeader notFound={!row}>
            <AssayHeader
                menu={menu}
                title={batchName}
                subTitle={subTitle}
                description={assayDefinition.name}
                leftColumns={8}
            >
                <AssayBatchHeaderButtons model={model} batchId={batchId} />
            </AssayHeader>

            <AssayOverrideBanner assay={assayDefinition} link={AssayLink.BATCHES} />

            <DetailPanel actions={actions} asPanel model={model} />

            <AssayGridPanel
                assayDefinition={assayDefinition}
                canDelete={false}
                filters={runsFilter}
                header="Runs"
                key={batchId} // trigger re-render/reload when batchId changes via URL.
                nounPlural="Runs"
                queryName="Runs"
            />
        </Page>
    );
});

const AssayBatchOverviewPageWithModels = withQueryModels<WithRouterProps & InjectedAssayModel>(AssayBatchOverviewPageBody);

const AssayBatchOverviewPageImpl: FC<WithRouterProps & InjectedAssayModel> = props => {
    const { assayDefinition } = props;
    const { batchId } = props.params;
    const key = [batchId, assayDefinition.protocolSchemaName].join('|');
    const schemaQuery = useMemo(() => SchemaQuery.create(assayDefinition.protocolSchemaName, 'Batches'), [assayDefinition.protocolSchemaName]);

    const queryConfigs: QueryConfigMap = useMemo(
        () => ({
            model: {
                keyValue: batchId,
                requiredColumns: SCHEMAS.CBMB.concat('Name', 'RowId').toArray(),
                schemaQuery,
            },
        }),
        [batchId, schemaQuery]
    );

    return <AssayBatchOverviewPageWithModels autoLoad key={key} queryConfigs={queryConfigs} {...props} />
}

export const AssayBatchOverviewPage = assayPage(AssayBatchOverviewPageImpl);
