import React, { FC, memo, ReactNode } from 'react';
import { List, Map, OrderedMap } from 'immutable';

import { AuditBehaviorTypes } from '@labkey/api';

import {
    Alert,
    BulkUpdateForm,
    createNotification,
    deleteRows,
    getOperationNotPermittedMessage,
    QueryColumn,
    QueryInfo,
    QueryModel,
    resolveErrorMessage,
    SampleOperation,
    SchemaQuery,
    SCHEMAS,
    User,
} from '../../..';

import { OperationConfirmationData } from '../entities/models';

import { userCanEditStorageData } from '../../app/utils';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';
import { SamplesSelectionProvider } from './SamplesSelectionContextProvider';
import { DISCARD_CONSUMED_CHECKBOX_FIELD, DISCARD_CONSUMED_COMMENT_FIELD } from './DiscardConsumedSamplesPanel';

interface OwnProps {
    queryModel: QueryModel;
    updateRows: (schemaQuery: SchemaQuery, rows: any[]) => Promise<void>;
    hasValidMaxSelection: boolean;
    sampleSetLabel: string;
    onCancel: () => void;
    onBulkUpdateError: (message: string) => void;
    onBulkUpdateComplete: (data: any, submitForEdit) => void;
    editSelectionInGrid: (updateData: any, dataForSelection: Map<string, any>, dataIdsForSelection: List<any>) => any;
    user: User;
}

type Props = OwnProps & SamplesSelectionProviderProps & SamplesSelectionResultProps;

interface UpdateAlertProps {
    aliquots: any[];
    numSelections: number;
    editStatusData: OperationConfirmationData;
}

// exported for jest testing
export const SamplesBulkUpdateAlert: FC<UpdateAlertProps> = memo(props => {
    const { aliquots, editStatusData } = props;

    let aliquotsMsg;
    if (aliquots?.length > 0) {
        aliquotsMsg = (
            <>
                Since {aliquots.length} aliquot{aliquots.length > 1 ? 's were' : ' was'} among the selected samples,
                only the aliquot-editable fields are shown below.{' '}
            </>
        );
    }

    if (!aliquotsMsg && (!editStatusData || editStatusData.allAllowed)) return null;

    return (
        <Alert bsStyle="warning">
            {aliquotsMsg}
            {getOperationNotPermittedMessage(SampleOperation.EditMetadata, editStatusData, aliquots)}
        </Alert>
    );
});

interface State {
    shouldDiscard: boolean;
    discardComment: string;
}

// exported for jest testing
export class SamplesBulkUpdateFormBase extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            shouldDiscard: false,
            discardComment: undefined,
        };
    }

    getGridSelectionSize = (): number => {
        return this.props.queryModel.selections?.size ?? 0;
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

        // if the selection includes any aliquots, only show pk, aliquot specific and description/samplestate columns
        if (aliquots?.length > 0) {
            originalQueryInfo.columns.forEach((column, key) => {
                const isAliquotField = sampleTypeDomainFields.aliquotFields.indexOf(column.fieldKey.toLowerCase()) > -1;
                if (
                    column.fieldKey.toLowerCase() === 'description' ||
                    column.fieldKey.toLowerCase() === 'samplestate' ||
                    isAliquotField
                )
                    columns = columns.set(key, column);
            });
            originalQueryInfo.getPkCols().forEach(column => {
                columns = columns.set(column.fieldKey, column);
            });
        } else {
            // if contains samples, skip aliquot fields
            originalQueryInfo.columns.forEach((column, key) => {
                const fieldKey = column.fieldKey.toLowerCase();
                if (sampleTypeDomainFields.aliquotFields.indexOf(fieldKey) === -1 && fieldKey !== 'name')
                    columns = columns.set(key, column);
            });
        }

        return originalQueryInfo.merge({ columns }) as QueryInfo;
    }

    onComplete = (data: any, submitForEdit: boolean): void => {
        const { onBulkUpdateComplete, sampleItems } = this.props;
        const { shouldDiscard, discardComment } = this.state;

        if (shouldDiscard) {
            const discardStorageRows = [];

            Object.keys(sampleItems).forEach(sampleId => {
                const storageItem = sampleItems[sampleId];
                if (storageItem) {
                    discardStorageRows.push({
                        rowId: storageItem.rowId,
                    });
                }
            });

            deleteRows({
                schemaQuery: SCHEMAS.INVENTORY.ITEMS,
                rows: discardStorageRows,
                auditBehavior: AuditBehaviorTypes.DETAILED,
                auditUserComment: discardComment,
            })
                .then(response => {
                    createNotification(
                        'Successfully discard ' +
                            discardStorageRows.length +
                            ' sample' +
                            (discardStorageRows.length > 1 ? 's' : '') +
                            ' from storage.'
                    );
                    onBulkUpdateComplete?.(data, submitForEdit);
                })
                .catch(error => {
                    const errorMsg = resolveErrorMessage(error, 'sample', 'sample', 'discard');
                    createNotification({ message: errorMsg, alertClass: 'danger' });
                });
        } else {
            onBulkUpdateComplete?.(data, submitForEdit);
        }
    };

    onDiscardConsumedPanelChange = (field: string, value: any): boolean => {
        const { sampleItems, user } = this.props;

        if (!sampleItems || Object.keys(sampleItems).length === 0 || !userCanEditStorageData(user)) {
            return false; // if no samples are in storage or the user can't modify storage data, skip showing discard panel
        }

        if (field === DISCARD_CONSUMED_CHECKBOX_FIELD) {
            this.setState({ shouldDiscard: value });
        } else if (field === DISCARD_CONSUMED_COMMENT_FIELD) {
            this.setState({ discardComment: value });
        }

        return true;
    };

    render(): ReactNode {
        const {
            aliquots,
            updateRows,
            queryModel,
            hasValidMaxSelection,
            sampleSetLabel,
            onCancel,
            onBulkUpdateError,
            editSelectionInGrid,
            editStatusData,
        } = this.props;
        const selectedNoun = this.getSelectedNoun();

        return (
            <BulkUpdateForm
                singularNoun={selectedNoun}
                pluralNoun={`${selectedNoun}s`}
                itemLabel={sampleSetLabel}
                queryInfo={this.getQueryInfo()}
                selectedIds={[...queryModel.selections]}
                canSubmitForEdit={hasValidMaxSelection}
                onCancel={onCancel}
                onError={onBulkUpdateError}
                onComplete={this.onComplete}
                onSubmitForEdit={editSelectionInGrid}
                sortString={queryModel.sorts.join(',')}
                updateRows={updateRows}
                header={
                    <SamplesBulkUpdateAlert
                        numSelections={this.getGridSelectionSize()}
                        aliquots={aliquots}
                        editStatusData={editStatusData}
                    />
                }
                onAdditionalFormDataChange={this.onDiscardConsumedPanelChange}
            />
        );
    }
}

export const SamplesBulkUpdateForm = SamplesSelectionProvider<OwnProps & SamplesSelectionProviderProps>(
    SamplesBulkUpdateFormBase
);
