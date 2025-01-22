import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Utils } from '@labkey/api';

import { Alert } from '../base/Alert';
import { resolveErrorMessage } from '../../util/messaging';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { Modal } from '../../Modal';

import { CheckboxLK } from '../../Checkbox';

import { useAppContext } from '../../AppContext';

import { Picklist } from './models';
import { createPicklist, getPicklistUrl, updatePicklist } from './actions';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from './constants';

export interface PicklistEditModalProps {
    currentProductId?: string;
    metricFeatureArea?: string;
    onCancel: () => void;
    onFinish: (picklist: Picklist) => void;
    picklist?: Picklist;
    picklistProductId?: string;
    queryModel?: QueryModel;
    sampleFieldKey?: string;
    sampleIds?: number[];
    showNotification?: boolean;
}

const PicklistEditModalDisplay: FC<PicklistEditModalProps> = memo(props => {
    const {
        onCancel,
        onFinish,
        sampleFieldKey,
        sampleIds,
        picklist,
        showNotification,
        currentProductId,
        picklistProductId,
        metricFeatureArea,
        queryModel,
    } = props;
    const useSnapshotSelection = queryModel?.filterArray.length > 0;
    const [name, setName] = useState<string>(picklist?.name ?? '');
    const onNameChange = useCallback((evt: ChangeEvent<HTMLInputElement>) => setName(evt.target.value), []);
    const validCount = useMemo(
        () => sampleIds?.length || queryModel?.selections.size,
        [sampleIds, queryModel?.selections]
    );
    const selectionKey = useMemo(
        () => (sampleFieldKey ? undefined : queryModel?.selectionKey),
        [sampleFieldKey, queryModel?.selectionKey]
    );
    const [description, setDescription] = useState<string>(picklist?.Description ?? '');
    const onDescriptionChange = useCallback(
        (evt: ChangeEvent<HTMLTextAreaElement>) => setDescription(evt.target.value),
        []
    );
    const [shared, setShared] = useState<boolean>(picklist?.isPublic() ?? false);
    const onSharedChanged = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => setShared(evt.currentTarget.checked),
        []
    );
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [error, setError] = useState<string>(undefined);
    const { api } = useAppContext();
    const { createNotification } = useNotificationsContext();

    useEffect(() => {
        if (!useSnapshotSelection) return;
        (async () => {
            await api.query.setSnapshotSelections(selectionKey, [...queryModel.selections]);
        })();
    }, [api.query, useSnapshotSelection, selectionKey, queryModel?.selections]);

    const { finishVerb, finishingVerb, isUpdate } = useMemo(() => {
        const isUpdate_ = picklist !== undefined;
        return {
            finishVerb: isUpdate_ ? 'Update' : 'Create',
            finishingVerb: isUpdate_ ? 'Updating' : 'Creating',
            isUpdate: isUpdate_,
        };
    }, [picklist]);

    const reset = useCallback((): void => {
        setError(undefined);
        setSubmitting(false);
        setName(undefined);
        setDescription(undefined);
        setShared(false);
    }, []);

    const onHide = useCallback(() => {
        reset();
        onCancel();
    }, [onCancel, reset]);

    const onSavePicklist = useCallback(async (): Promise<void> => {
        setSubmitting(true);
        try {
            let updatedList: Picklist;
            const trimmedName = name.trim();
            if (isUpdate) {
                updatedList = await updatePicklist(
                    new Picklist({
                        Container: picklist.Container,
                        name: trimmedName,
                        listId: picklist.listId,
                        Description: description,
                        Category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
                    })
                );
            } else {
                updatedList = await createPicklist(
                    trimmedName,
                    description,
                    shared,
                    selectionKey,
                    useSnapshotSelection,
                    sampleIds
                );
                api.query.incrementClientSideMetricCount(metricFeatureArea, 'createPicklist');
            }

            reset();

            if (showNotification) {
                const href = getPicklistUrl(updatedList.listId, picklistProductId, currentProductId);
                const noun = validCount ? Utils.pluralize(validCount, 'sample', 'samples') : ' no samples';
                createNotification({
                    message: (
                        <>
                            Successfully created "{updatedList.name}" with {noun}. <a href={href}>View picklist</a>.
                        </>
                    ),
                    alertClass: 'success',
                });
            }

            onFinish(updatedList);
        } catch (e) {
            setError(resolveErrorMessage(e));
            setSubmitting(false);
        }
    }, [
        api.query,
        createNotification,
        currentProductId,
        description,
        isUpdate,
        metricFeatureArea,
        name,
        onFinish,
        picklist?.Container,
        picklist?.listId,
        picklistProductId,
        reset,
        sampleIds,
        selectionKey,
        shared,
        showNotification,
        useSnapshotSelection,
        validCount,
    ]);

    let title: string;
    if (isUpdate) {
        title = 'Update Picklist Data';
    } else {
        if (!validCount) {
            title = 'Create an Empty Picklist';
        } else if (selectionKey && validCount) {
            const pluralizedNoun = Utils.pluralize(validCount, 'Selected Sample', 'Selected Samples');
            title = `Create a New Picklist with the ${pluralizedNoun}`;
        } else if (validCount === 1) {
            title = 'Create a New Picklist with This Sample';
        } else {
            title = 'Create a New Picklist with These Samples';
        }
    }

    return (
        <Modal
            canConfirm={!!name}
            confirmText={finishVerb + ' Picklist'}
            confirmingText={finishingVerb + ' Picklist...'}
            isConfirming={submitting}
            onCancel={onHide}
            onConfirm={onSavePicklist}
            title={title}
        >
            <Alert>{error}</Alert>
            <form>
                <div className="form-group">
                    <label className="control-label">Name *</label>

                    <input
                        placeholder="Give this list a name"
                        className="form-control"
                        value={name}
                        onChange={onNameChange}
                        type="text"
                    />
                </div>
                <div className="form-group">
                    <label className="control-label">Description</label>

                    <textarea
                        placeholder="Add a description"
                        className="form-control"
                        value={description}
                        onChange={onDescriptionChange}
                    />

                    <CheckboxLK checked={shared} name="shared" onChange={onSharedChanged}>
                        Share this picklist
                    </CheckboxLK>
                </div>
            </form>
        </Modal>
    );
});

PicklistEditModalDisplay.displayName = 'PicklistEditModalDisplay';

// eslint-disable-next-line no-warning-comments
// FIXME: This does not need to be a separate component. It is solely initializing the "sampleIds" prop.
export const PicklistEditModal: FC<PicklistEditModalProps> = memo(props => {
    const { queryModel, sampleFieldKey, sampleIds } = props;
    const [ids, setIds] = useState<number[]>(sampleIds);
    const { api } = useAppContext();

    useEffect(() => {
        (async () => {
            // Look up SampleIds from the selected row ids.
            // Using sampleFieldKey as proxy flag to determine if lookup is needed
            if (sampleFieldKey && queryModel && !queryModel.isLoadingSelections) {
                try {
                    const ids_ = await api.samples.getLookupRowIdsFromSelection(
                        queryModel.schemaQuery.schemaName,
                        queryModel.schemaQuery.queryName,
                        [...queryModel.selections],
                        sampleFieldKey
                    );
                    setIds(ids_);
                    await api.query.setSnapshotSelections(queryModel.selectionKey, [...queryModel.selections]);
                } catch (error) {
                    console.error(error);
                }
            }
        })();
    }, [api, sampleFieldKey, queryModel]);

    return <PicklistEditModalDisplay {...props} sampleIds={ids} />;
});

PicklistEditModal.displayName = 'PicklistEditModal';
