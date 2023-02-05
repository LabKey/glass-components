import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { User } from '../internal/components/base/models/User';

import { SchemaQuery } from '../public/SchemaQuery';

import { InjectedQueryModels, withQueryModels } from '../public/QueryModel/withQueryModels';

import { getSampleAliquotsQueryConfig } from '../internal/components/samples/actions';
import { getOmittedSampleTypeColumns, SamplesEditButtonSections } from '../internal/components/samples/utils';

import { useLabelPrintingContext } from '../internal/components/labels/LabelPrintingContextProvider';
import { PrintLabelsModal } from '../internal/components/labels/PrintLabelsModal';
import { useNotificationsContext } from '../internal/components/notifications/NotificationsContext';

import { SAMPLE_DATA_EXPORT_CONFIG } from '../internal/components/samples/constants';

import { getContainerFilterForLookups } from '../internal/query/api';

import { useSampleTypeAppContext } from './useSampleTypeAppContext';
import { getSampleAuditBehaviorType } from './utils';
import { SamplesTabbedGridPanel } from './SamplesTabbedGridPanel';

// We are only looking at single model here
const SUB_MENU_WIDTH = 1350;

interface Props {
    assayProviderType?: string;
    getIsDirty: () => boolean;
    lineageUpdateAllowed: boolean;
    metricFeatureArea?: string;
    onSampleChangeInvalidate: (schemaQuery: SchemaQuery) => void;
    queryModelId: string;
    setIsDirty: (isDirty: boolean) => void;
    showLabelOption?: boolean;
    user: User;
}

export const SampleAliquotsGridPanelImpl: FC<Props & InjectedQueryModels> = memo(props => {
    const { actions, queryModels, queryModelId, user, metricFeatureArea, getIsDirty, setIsDirty } = props;
    const [showPrintDialog, setShowPrintDialog] = useState<boolean>(false);
    const { createNotification } = useNotificationsContext();
    const { canPrintLabels, printServiceUrl } = useLabelPrintingContext();
    const queryModel = queryModels[queryModelId];

    const { getSamplesEditableGridProps, SampleGridButtonComponent } = useSampleTypeAppContext();

    const resetState = useCallback((): void => {
        setShowPrintDialog(false);
    }, []);

    const afterAction = useCallback((): void => {
        const { onSampleChangeInvalidate } = props;

        resetState();
        onSampleChangeInvalidate(queryModel.schemaQuery);
        actions.loadModel(queryModel.id, true);
    }, [actions, props, queryModel.id, queryModel.schemaQuery, resetState]);

    const afterPrint = useCallback(
        (numSamples: number, numLabels: number): void => {
            setShowPrintDialog(false);
            createNotification(`Successfully printed ${numLabels * numSamples} labels.`);
        },
        [createNotification]
    );

    const containerFilter = useMemo(() => getContainerFilterForLookups(), []);

    return (
        <>
            <SamplesTabbedGridPanel
                actions={actions}
                afterSampleActionComplete={afterAction}
                containerFilter={containerFilter}
                getIsDirty={getIsDirty}
                getSampleAuditBehaviorType={getSampleAuditBehaviorType}
                gridButtonProps={{
                    metricFeatureArea,
                    subMenuWidth: SUB_MENU_WIDTH,
                    excludedMenuKeys: [SamplesEditButtonSections.IMPORT, SamplesEditButtonSections.EDIT_PARENT],
                    excludeAddButton: true,
                    parentEntityDataTypes: [], // aliquots cannot change parents
                }}
                gridButtons={SampleGridButtonComponent}
                modelId={queryModel.id}
                queryModels={queryModels}
                samplesEditableGridProps={getSamplesEditableGridProps(user)}
                showLabelOption
                setIsDirty={setIsDirty}
                tabbedGridPanelProps={{
                    advancedExportOptions: SAMPLE_DATA_EXPORT_CONFIG,
                    hideEmptyViewMenu: false,
                }}
                user={user}
                withTitle={false}
            />
            {showPrintDialog && canPrintLabels && (
                <PrintLabelsModal
                    afterPrint={afterPrint}
                    printServiceUrl={printServiceUrl}
                    model={queryModel}
                    onCancel={resetState}
                    sampleIds={[...queryModel.selections]}
                    show={true}
                    showSelection={true}
                />
            )}
        </>
    );
});

const SampleAliquotsGridPanelWithModel = withQueryModels<Props>(SampleAliquotsGridPanelImpl);

interface SampleAliquotsGridPanelProps extends Omit<Props, 'queryModelId'> {
    getIsDirty: () => boolean;
    omittedColumns?: string[];
    rootLsid?: string;
    sampleId: string | number;
    sampleLsid: string;
    // if sample is an aliquot, use the aliquot's root to find subaliquots
    schemaQuery: SchemaQuery;
    setIsDirty: (isDirty: boolean) => void;
}

export const SampleAliquotsGridPanel: FC<SampleAliquotsGridPanelProps> = props => {
    const { sampleLsid, schemaQuery, rootLsid, user, omittedColumns } = props;
    const omitted = omittedColumns
        ? [...getOmittedSampleTypeColumns(user), ...omittedColumns]
        : getOmittedSampleTypeColumns(user);

    const queryConfig = getSampleAliquotsQueryConfig(schemaQuery.queryName, sampleLsid, true, rootLsid, omitted);
    const queryConfigs = { [queryConfig.id]: queryConfig };

    return <SampleAliquotsGridPanelWithModel {...props} queryModelId={queryConfig.id} queryConfigs={queryConfigs} />;
};

SampleAliquotsGridPanel.displayName = 'SampleAliquotsGridPanel';
