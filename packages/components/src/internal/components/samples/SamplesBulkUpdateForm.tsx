import React, { FC, memo, useMemo } from 'react';
import { List, Map, OrderedMap } from 'immutable';
import { Alert } from 'react-bootstrap';

import {
    BulkUpdateForm,
    getOperationNotPermittedMessage,
    QueryColumn,
    QueryInfo,
    QueryModel,
    SampleOperation,
    SchemaQuery
} from '../../..';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';
import { OperationConfirmationData } from '../entities/models';

interface OwnProps {
    queryModel: QueryModel;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<void>;
    hasValidMaxSelection: () => any;
    sampleSetLabel: string;
    onCancel: () => any;
    onBulkUpdateError: (message: string) => any;
    onBulkUpdateComplete: (data: any, submitForEdit) => any;
    editSelectionInGrid: (updateData: any, dataForSelection: Map<string, any>, dataIdsForSelection: List<any>) => any;
}

type Props = OwnProps & SamplesSelectionProviderProps & SamplesSelectionResultProps;

interface UpdateAlertProps {
    aliquots: any[],
    queryModel: QueryModel,
    editStatusData: OperationConfirmationData,
}

// exported for jest testing
export const SamplesBulkUpdateAlert: FC<UpdateAlertProps> = memo( (props) => {
    const { queryModel, aliquots, editStatusData } = props;

    const gridSelectionSize = useMemo(() => {
        return props.queryModel.selections.size;
    }, [queryModel]);

    let aliquotsMsg = undefined;
    if (aliquots && aliquots.length > 0) {
        if (aliquots.length < gridSelectionSize) {
            aliquotsMsg = (
                <>
                    {aliquots.length} aliquot{aliquots.length > 1 ? 's were' : ' was'} among the selections. Aliquot
                    data is inherited from the original sample and cannot be updated here.{' '}
                </>
            );
        } else {
            aliquotsMsg =  <>Aliquot data inherited from the original sample cannot be updated here.</>
        }
    }

    const alerts = [];

    if (!aliquotsMsg && (!editStatusData || editStatusData.notAllowed.length == 0))
        return <>{alerts}</>;

    alerts.push(
        <Alert bsStyle="warning">
            {aliquotsMsg}
            {getOperationNotPermittedMessage(SampleOperation.EditMetadata, editStatusData, aliquots)}
        </Alert>
    );
    return <>{alerts}</>;
});

// Usage:
// export const SamplesBulkUpdateForm = connect<any, any, any>(undefined)(SamplesSelectionProvider(SamplesBulkUpdateFormBase));
export class SamplesBulkUpdateFormBase extends React.PureComponent<Props> {

    getGridSelectionSize = (): number => {
        return this.props.queryModel.selections.size;
    };

    getSelectedNoun = (): string => {
        const { aliquots } = this.props;
        const allAliquots = aliquots && aliquots.length > 0 && aliquots.length === this.getGridSelectionSize();
        return allAliquots ? 'aliquot' : 'sample';
    };

    getQueryInfo(): QueryInfo {
        const { aliquots, queryModel, sampleTypeDomainFields } = this.props;
        const originalQueryInfo = queryModel.queryInfo;

        let columns = OrderedMap<string, QueryColumn>();

        // if all are aliquots, only show pk, aliquot specific and description columns
        if (aliquots && aliquots.length === this.getGridSelectionSize()) {
            originalQueryInfo.columns.forEach((column, key) => {
                const isAliquotField = sampleTypeDomainFields.aliquotFields.indexOf(column.fieldKey.toLowerCase()) > -1;
                if (column.fieldKey.toLowerCase() === 'description' || column.fieldKey.toLowerCase() === 'samplestate' || isAliquotField)
                    columns = columns.set(key, column);
            });
            originalQueryInfo.getPkCols().forEach(column => {
                columns = columns.set(column.fieldKey, column);
            });
        } else {
            // if contains samples, skip aliquot fields
            originalQueryInfo.columns.forEach((column, key) => {
                if (sampleTypeDomainFields.aliquotFields.indexOf(column.fieldKey.toLowerCase()) === -1)
                    columns = columns.set(key, column);
            });
        }

        return originalQueryInfo.merge({ columns }) as QueryInfo;
    }

    render() {
        const {
            aliquots,
            updateRows,
            queryModel,
            hasValidMaxSelection,
            sampleSetLabel,
            onCancel,
            onBulkUpdateError,
            onBulkUpdateComplete,
            editSelectionInGrid,
            editStatusData
        } = this.props;

        return (
            <BulkUpdateForm
                singularNoun={this.getSelectedNoun()}
                pluralNoun={this.getSelectedNoun() + 's'}
                itemLabel={sampleSetLabel}
                queryInfo={this.getQueryInfo()}
                selectedIds={[...queryModel.selections]}
                canSubmitForEdit={hasValidMaxSelection()}
                onCancel={onCancel}
                onError={onBulkUpdateError}
                onComplete={onBulkUpdateComplete}
                onSubmitForEdit={editSelectionInGrid}
                sortString={queryModel.sorts.join(',')}
                updateRows={updateRows}
                header={<SamplesBulkUpdateAlert queryModel={queryModel} aliquots={aliquots} editStatusData={editStatusData}/>}
            />
        );
    }
}
