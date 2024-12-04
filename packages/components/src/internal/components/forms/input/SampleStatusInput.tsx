import React, { FC, memo, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';

import {
    DISCARD_CONSUMED_CHECKBOX_FIELD,
    DiscardConsumedSamplesPanel,
} from '../../samples/DiscardConsumedSamplesPanel';

import { Alert } from '../../base/Alert';
import { QueryColumn } from '../../../../public/QueryColumn';
import { QuerySelect, QuerySelectChange, QuerySelectOwnProps } from '../QuerySelect';
import { SampleStateType } from '../../samples/constants';
import { userCanEditStorageData } from '../../../app/utils';
import { useServerContext } from '../../base/ServerContext';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../APIWrapper';

import { LOOKUP_DEFAULT_SIZE } from '../../../constants';

import { getSampleStatusContainerFilter } from '../../samples/utils';

import { InputRendererProps } from './types';

interface SampleStatusInputProps extends Omit<QuerySelectOwnProps, 'containerFilter' | 'schemaQuery' | 'valueColumn'> {
    api?: ComponentsAPIWrapper;
    col: QueryColumn;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    renderLabelField?: (col: QueryColumn) => ReactNode;
}

export const SampleStatusInput: FC<SampleStatusInputProps> = memo(props => {
    const {
        api = getDefaultAPIWrapper(),
        col,
        onAdditionalFormDataChange,
        renderLabelField,
        ...querySelectProps
    } = props;
    const { allowDisable, onQSChange, value } = querySelectProps;
    const { user } = useServerContext();
    const [consumedStatuses, setConsumedStatuses] = useState<number[]>();
    const [error, setError] = useState<string>();
    const [showDiscardPanel, setShowDiscardPanel] = useState<boolean>(false);
    const [shouldDiscard, setShouldDiscard] = useState<boolean>(true);

    useEffect(() => {
        (async () => {
            try {
                const statuses = await api.samples.getSampleStatuses();
                const consumedStatusIds = [];
                statuses.forEach(status => {
                    if (status.stateType === SampleStateType.Consumed) consumedStatusIds.push(status.rowId);
                });
                setConsumedStatuses(consumedStatusIds);
            } catch (e) {
                setError(
                    'Error loading sample statuses. If you want to remove ' +
                        (allowDisable /* bulk update */ ? 'any samples' : 'the sample') +
                        ' being updated to a Consumed status, you will have to do that separately.'
                );
            }
        })();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const onChange: QuerySelectChange = useCallback(
        (name, newValue, selectedOptions, props_, selectedItems) => {
            onQSChange?.(name, newValue, selectedOptions, props_, selectedItems);
            if (userCanEditStorageData(user)) {
                const isConsumed = consumedStatuses?.indexOf(newValue as number) > -1 && value !== newValue;
                const isInStorage = onAdditionalFormDataChange?.(
                    DISCARD_CONSUMED_CHECKBOX_FIELD,
                    shouldDiscard && isConsumed
                );
                setShowDiscardPanel(isInStorage && isConsumed);
            }
        },
        [consumedStatuses, onAdditionalFormDataChange, onQSChange, shouldDiscard, user, value]
    );

    const toggleShouldDiscard = useCallback(() => {
        const updatedShouldDiscard = !shouldDiscard;
        setShouldDiscard(updatedShouldDiscard);
        onAdditionalFormDataChange?.(DISCARD_CONSUMED_CHECKBOX_FIELD, updatedShouldDiscard && showDiscardPanel);
    }, [shouldDiscard, onAdditionalFormDataChange, showDiscardPanel]);

    const discardPanel = useMemo(() => {
        const isBulkForm = allowDisable;

        const panel = (
            <DiscardConsumedSamplesPanel
                shouldDiscard={shouldDiscard}
                toggleShouldDiscard={toggleShouldDiscard}
                discardTitle={`Remove sample${isBulkForm ? '(s)' : ''} from storage?`}
            />
        );

        if (isBulkForm) {
            return (
                <div className="row sample-bulk-update-discard-panel">
                    <div className="col-sm-3 col-xs-12" />
                    <div className="col-sm-9 col-xs-12">
                        <div className="left-padding right-padding">{panel}</div>
                    </div>
                </div>
            );
        }
        return panel;
    }, [shouldDiscard, toggleShouldDiscard, allowDisable]);

    return (
        <>
            {renderLabelField?.(col)}
            <QuerySelect
                containerPath={col.lookup.containerPath}
                description={col.description}
                displayColumn={col.lookup.displayColumn}
                formsy
                helpTipRenderer={col.helpTipRenderer}
                joinValues={col.isJunctionLookup()}
                label={col.caption}
                maxRows={LOOKUP_DEFAULT_SIZE}
                multiple={col.isJunctionLookup()}
                name={col.fieldKey}
                openMenuOnFocus={!col.isJunctionLookup()}
                required={col.required}
                showLoading={false}
                {...querySelectProps}
                containerFilter={getSampleStatusContainerFilter()}
                onQSChange={onChange}
                schemaQuery={col.lookup.schemaQuery}
                valueColumn={col.lookup.keyColumn}
            />
            {error && <Alert>{error}</Alert>}
            {showDiscardPanel && <>{discardPanel}</>}
        </>
    );
});

SampleStatusInput.displayName = 'SampleStatusInput';

export const SampleStatusInputRenderer: FC<InputRendererProps> = memo(props => {
    const {
        allowFieldDisable,
        col,
        containerPath,
        formsy,
        initiallyDisabled,
        onAdditionalFormDataChange,
        onSelectChange,
        onToggleDisable,
        renderLabelField,
        selectInputProps,
        showAsteriskSymbol,
        value,
    } = props;

    return (
        <SampleStatusInput
            {...selectInputProps}
            addLabelAsterisk={showAsteriskSymbol}
            allowDisable={allowFieldDisable}
            col={col}
            containerPath={containerPath}
            formsy={formsy}
            initiallyDisabled={initiallyDisabled}
            onAdditionalFormDataChange={onAdditionalFormDataChange}
            onQSChange={onSelectChange}
            onToggleDisable={onToggleDisable}
            renderLabelField={renderLabelField}
            value={value}
        />
    );
});
