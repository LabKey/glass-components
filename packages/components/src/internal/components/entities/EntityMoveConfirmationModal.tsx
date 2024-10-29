import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Security } from '@labkey/api';

import { Modal, ModalProps } from '../../Modal';
import { Alert } from '../base/Alert';
import { ModuleContext, useServerContext } from '../base/ServerContext';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { resolveErrorMessage } from '../../util/messaging';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { AppContext, useAppContext } from '../../AppContext';
import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';
import { HOME_PATH, HOME_TITLE } from '../navigation/constants';
import { Container } from '../base/models/Container';

import { CommentTextArea } from '../forms/input/CommentTextArea';
import { useDataChangeCommentsRequired } from '../forms/input/useDataChangeCommentsRequired';
import { ComponentsAPIWrapper } from '../../APIWrapper';

import { FolderConfigurableDataType } from './models';

export interface EntityMoveConfirmationModalProps extends Omit<ModalProps, 'onConfirm'> {
    currentContainer?: Container;
    dataType?: FolderConfigurableDataType;
    dataTypeRowId?: number;
    excludeCurrentAsTarget?: boolean;
    nounPlural: string;
    onConfirm: (targetContainer: string, targetName: string, userComment: string) => void;
}

// exported for jest testing
export async function getContainerOptions(
    api: ComponentsAPIWrapper,
    container: Container,
    moduleContext: ModuleContext,
    excludeCurrentAsTarget: boolean,
    dataType: FolderConfigurableDataType,
    dataTypeRowId: number
): Promise<SelectInputOption[]> {
    let folders = await api.folder.getContainers(container, moduleContext, true, true, true, true);

    const excludedFolders = await api.folder.getDataTypeExcludedContainers(dataType, dataTypeRowId);

    // filter to folders that the user has InsertPermissions
    folders = folders?.filter(c => c.effectivePermissions.indexOf(Security.PermissionTypes.Insert) > -1);

    // filter out the current container, if requested
    if (excludeCurrentAsTarget) {
        folders = folders?.filter(c => c.id !== container.id);
    }

    // filter folder by exclusion
    if (excludedFolders) {
        folders = folders?.filter(c => excludedFolders.indexOf(c.id) === -1);
    }

    return folders?.map(f => ({
        label: f.path === HOME_PATH ? HOME_TITLE : f.title,
        value: f.path,
        data: f,
    }));
}

export const EntityMoveConfirmationModal: FC<EntityMoveConfirmationModalProps> = memo(props => {
    const {
        children,
        excludeCurrentAsTarget,
        onConfirm,
        nounPlural,
        currentContainer,
        dataType,
        dataTypeRowId,
        ...confirmModalProps
    } = props;
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [containerOptions, setContainerOptions] = useState<SelectInputOption[]>();
    const [selectedContainerOption, setSelectedContainerOption] = useState<SelectInputOption>();
    const [auditUserComment, setAuditUserComment] = useState<string>();
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext } = useServerContext();
    const container_ = currentContainer ?? container;
    const hasValidUserComment = auditUserComment?.trim()?.length > 0;
    const { requiresUserComment } = useDataChangeCommentsRequired();

    useEffect(
        () => {
            (async () => {
                setLoading(LoadingState.LOADING);
                setError(undefined);

                try {
                    const options = await getContainerOptions(
                        api,
                        container_,
                        moduleContext,
                        excludeCurrentAsTarget,
                        dataType,
                        dataTypeRowId
                    );

                    setContainerOptions(options);
                } catch (e) {
                    setError(`Error: ${resolveErrorMessage(e)}`);
                } finally {
                    setLoading(LoadingState.LOADED);
                }
            })();
        },
        [
            /* on mount only */
        ]
    );

    const onConfirmCallback = useCallback(() => {
        if (selectedContainerOption) {
            onConfirm(selectedContainerOption.value, selectedContainerOption.label, auditUserComment);
        }
    }, [onConfirm, selectedContainerOption, auditUserComment]);

    const onContainerChange = useCallback(
        (fieldName: string, chosenType: string, selectedOption: SelectInputOption) => {
            setSelectedContainerOption(selectedOption);
        },
        []
    );

    const onCommentChange = useCallback(comment => {
        setAuditUserComment(comment);
    }, []);

    if (isLoading(loading)) {
        return (
            <Modal title={confirmModalProps.title} onCancel={confirmModalProps.onCancel}>
                <LoadingSpinner msg="Loading target folders..." />
            </Modal>
        );
    }

    if (error) {
        return (
            <Modal title={confirmModalProps.title} onCancel={confirmModalProps.onCancel} cancelText="Dismiss">
                <Alert>{error}</Alert>
            </Modal>
        );
    }

    if (containerOptions?.length === 0) {
        return (
            <Modal title={confirmModalProps.title} onCancel={confirmModalProps.onCancel} cancelText="Dismiss">
                You do not have permission to move {nounPlural} to any of the available folders.
            </Modal>
        );
    }

    return (
        <Modal
            {...confirmModalProps}
            onConfirm={onConfirmCallback}
            canConfirm={!!selectedContainerOption && (!requiresUserComment || hasValidUserComment)}
        >
            {children}
            <div className="top-spacing">
                <SelectInput
                    helpTipRenderer="NONE"
                    label="Move to"
                    onChange={onContainerChange}
                    options={containerOptions}
                    required
                />
            </div>
            <CommentTextArea actionName="Moving" onChange={onCommentChange} requiresUserComment={requiresUserComment} />
        </Modal>
    );
});
