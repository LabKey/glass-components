import React, { FC, memo, useCallback, useEffect, useState } from 'react';
import { Security } from '@labkey/api';

import { ConfirmModalProps, ConfirmModal } from '../base/ConfirmModal';
import { Alert } from '../base/Alert';
import { useServerContext } from '../base/ServerContext';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { resolveErrorMessage } from '../../util/messaging';
import { isLoading, LoadingState } from '../../../public/LoadingState';
import { isAppHomeFolder } from '../../app/utils';
import { AppContext, useAppContext } from '../../AppContext';
import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';
import { HOME_PATH, HOME_TITLE } from '../navigation/constants';
import { Container } from '../base/models/Container';

export interface EntityMoveConfirmationModalProps extends Omit<ConfirmModalProps, 'onConfirm'> {
    nounPlural: string;
    onConfirm: (targetContainer: string, targetName: string, userComment: string) => void;
    currentContainer?: Container;
}

export const EntityMoveConfirmationModal: FC<EntityMoveConfirmationModalProps> = memo(props => {
    const { children, onConfirm, nounPlural, currentContainer, ...confirmModalProps } = props;
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [containerOptions, setContainerOptions] = useState<SelectInputOption[]>();
    const [selectedContainerOption, setSelectedContainerOption] = useState<SelectInputOption>();
    const [auditUserComment, setAuditUserComment] = useState<string>();
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext } = useServerContext();
    const container_ = currentContainer ?? container;

    useEffect(
        () => {
            (async () => {
                setLoading(LoadingState.LOADING);
                setError(undefined);

                try {
                    let folders = await api.security.fetchContainers({
                        containerPath: isAppHomeFolder(container_, moduleContext)
                            ? container_.path
                            : container_.parentPath,
                        includeEffectivePermissions: true,
                        includeStandardProperties: true, // needed to get the container title
                        includeWorkbookChildren: false,
                        includeSubfolders: true,
                        depth: 1,
                    });

                    // if user doesn't have permissions to the parent/project, the response will come back with an empty Container object
                    folders = folders.filter(c => c !== undefined && c.id !== '');

                    // filter to folders that the user has InsertPermissions
                    folders = folders.filter(c => c.effectivePermissions.indexOf(Security.PermissionTypes.Insert) > -1);

                    // filter out the current container
                    folders = folders.filter(c => c.id !== container_.id);

                    setContainerOptions(
                        folders.map(f => ({
                            label: f.path === HOME_PATH ? HOME_TITLE : f.title,
                            value: f.path,
                            data: f,
                        }))
                    );
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

    const onCommentChange = useCallback(evt => {
        setAuditUserComment(evt.target.value);
    }, []);

    if (isLoading(loading)) {
        return (
            <ConfirmModal
                title={confirmModalProps.title}
                onCancel={confirmModalProps.onCancel}
                cancelButtonText="Cancel"
            >
                <LoadingSpinner msg="Loading target projects..." />
            </ConfirmModal>
        );
    }

    if (error) {
        return (
            <ConfirmModal
                title={confirmModalProps.title}
                onCancel={confirmModalProps.onCancel}
                cancelButtonText="Dismiss"
            >
                <Alert>{error}</Alert>
            </ConfirmModal>
        );
    }

    if (containerOptions?.length === 0) {
        return (
            <ConfirmModal
                title={confirmModalProps.title}
                onCancel={confirmModalProps.onCancel}
                cancelButtonText="Dismiss"
            >
                You do not have permission to move {nounPlural} to any of the available projects.
            </ConfirmModal>
        );
    }

    return (
        <ConfirmModal
            confirmVariant="success"
            {...confirmModalProps}
            onConfirm={onConfirmCallback}
            canConfirm={!!selectedContainerOption}
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
            <div className="top-spacing">
                <div className="bottom-spacing">
                    <strong>Reason(s) for moving</strong>
                </div>
                <div>
                    <textarea
                        className="form-control"
                        placeholder="Enter comments (optional)"
                        onChange={onCommentChange}
                        rows={5}
                    />
                </div>
            </div>
        </ConfirmModal>
    );
});
