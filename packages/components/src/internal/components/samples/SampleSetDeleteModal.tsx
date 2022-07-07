import React, { FC, useCallback, useState } from 'react';

import {
    deleteSampleSet,
    EntityTypeDeleteConfirmModal,
    Progress,
    SHARED_CONTAINER_PATH,
    useNotificationsContext,
} from '../../..';
import { getDeleteErrorNotification, getDeleteSuccessNotification } from '../notifications/messaging';

interface Props {
    afterDelete?: (success: boolean) => void;
    beforeDelete?: () => void;
    containerPath?: string;
    numSamples: number;
    onCancel: () => void;
    rowId: number;
}

export const SampleSetDeleteModal: FC<Props> = props => {
    const { beforeDelete, afterDelete, rowId, numSamples, onCancel, containerPath } = props;
    const { createNotification } = useNotificationsContext();
    const [showProgress, setShowProgress] = useState<boolean>();
    const isShared = containerPath === SHARED_CONTAINER_PATH;

    const onConfirm = useCallback(async () => {
        beforeDelete?.();
        setShowProgress(true);

        try {
            await deleteSampleSet(rowId, containerPath);
            afterDelete?.(true);
            createNotification(getDeleteSuccessNotification(' sample type'));
        } catch (error) {
            afterDelete?.(false);
            createNotification({
                alertClass: 'danger',
                message: () => getDeleteErrorNotification('sample type'),
            });
        }
    }, [afterDelete, beforeDelete, containerPath, createNotification, rowId]);

    return (
        <>
            {!showProgress && (
                <EntityTypeDeleteConfirmModal
                    rowId={rowId}
                    isSample
                    noun="sample"
                    onConfirm={onConfirm}
                    onCancel={onCancel}
                    isShared={isShared}
                />
            )}
            <Progress
                delay={0}
                estimate={numSamples * 10}
                modal={true}
                title="Deleting sample type"
                toggle={showProgress}
            />
        </>
    );
};
