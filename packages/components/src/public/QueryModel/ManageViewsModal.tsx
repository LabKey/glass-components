import React, { FC, Fragment, memo, useCallback, useEffect, useState } from 'react';
import { PermissionTypes } from '@labkey/api';

import { ViewInfo } from '../../internal/ViewInfo';
import { SchemaQuery } from '../SchemaQuery';
import { LoadingSpinner } from '../../internal/components/base/LoadingSpinner';
import { Alert } from '../../internal/components/base/Alert';
import { useServerContext } from '../../internal/components/base/ServerContext';
import { useAppContext } from '../../internal/AppContext';
import { resolveErrorMessage } from '../../internal/util/messaging';

import { RequiresPermission } from '../../internal/components/base/Permissions';

import { userCanEditSharedViews } from '../../internal/app/utils';
import { Modal } from '../../internal/Modal';

import { OverlayTrigger } from '../../internal/OverlayTrigger';
import { Popover } from '../../internal/Popover';

import { ViewNameInput } from './SaveViewModal';

// exported for jest tests
export const ViewLabel: FC<{ view: ViewInfo }> = memo(props => {
    const { view } = props;
    const viewLabel = view.isDefault ? (view.saved && !view.shared ? 'My Default View' : 'Default View') : view.label;
    const modifiers = view.modifiers;
    if (modifiers.length > 0) {
        return (
            <>
                {viewLabel} <span className="text-muted">({modifiers.join(', ')})</span>
            </>
        );
    }
    return <>{viewLabel}</>;
});

export interface Props {
    containerPath?: string;
    currentView: ViewInfo;
    onDone: (hasChange: boolean, reselectViewName: string) => void;
    schemaQuery: SchemaQuery;
}

export const ManageViewsModal: FC<Props> = memo(props => {
    const { onDone, schemaQuery, currentView, containerPath } = props;

    const [views, setViews] = useState<ViewInfo[]>();
    const [selectedView, setSelectedView] = useState<ViewInfo>();
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>();
    const [hasChange, setHasChange] = useState<boolean>();
    const [reselectViewName, setReselectViewName] = useState<string>();
    const [deleting, setDeleting] = useState<ViewInfo>();

    const { api } = useAppContext();
    const { user } = useServerContext();
    const userCanEditShared = userCanEditSharedViews(user);

    useEffect(() => {
        (async () => {
            try {
                setViews(await api.query.getGridViews(schemaQuery, true));
            } catch (error) {
                setErrorMessage(resolveErrorMessage(error));
            }
        })();
    }, []);

    const onClose = useCallback(() => {
        onDone(hasChange, reselectViewName);
    }, [hasChange, reselectViewName, onDone]);

    const handleAction = useCallback(
        async (_handle: () => void) => {
            setErrorMessage(undefined);
            setDeleting(undefined);
            setIsSubmitting(true);
            setHasChange(true);

            try {
                await _handle();
                setViews(await api.query.getGridViews(schemaQuery, true));
            } catch (error) {
                setErrorMessage(resolveErrorMessage(error));
            } finally {
                setIsSubmitting(false);
            }
        },
        [api, schemaQuery]
    );

    const getActionView = useCallback(
        event => {
            const targetId = event.target.id;
            const viewInd = parseInt(targetId.split('-')[1]);
            return views[viewInd];
        },
        [views]
    );

    const onSelectView = useCallback(
        event => {
            const view = getActionView(event);
            setSelectedView(view);
        },
        [getActionView]
    );

    const revertDefaultView = useCallback(() => {
        handleAction(async () => {
            await api.query.deleteView(schemaQuery, containerPath, '', true);
        });
    }, [api, handleAction, schemaQuery, containerPath]);

    const setDefaultView = useCallback(
        event => {
            const view = getActionView(event);
            handleAction(async () => {
                const finalViewInfo = view.mutate({ name: '' });
                if (view.session) {
                    await api.query.saveSessionView(
                        schemaQuery,
                        containerPath,
                        view.name,
                        '',
                        view.inherit,
                        true,
                        true
                    );
                } else {
                    await api.query.saveGridView(
                        schemaQuery,
                        containerPath,
                        finalViewInfo,
                        true,
                        false,
                        view.inherit,
                        true
                    );
                }
                if (currentView.name === view.name) setReselectViewName('');
            });
        },
        [api, getActionView, handleAction, currentView, schemaQuery, containerPath]
    );

    const deleteSavedView = useCallback(() => {
        handleAction(async () => {
            const viewName = deleting.name;
            await api.query.deleteView(schemaQuery, containerPath, viewName, true);
            if (currentView.name === viewName || reselectViewName === viewName) setReselectViewName('');
        });
    }, [api, handleAction, deleting, schemaQuery, containerPath, currentView, reselectViewName]);

    const onDeleteView = useCallback(
        event => {
            setDeleting(getActionView(event));
        },
        [getActionView]
    );

    const cancelDeleteView = useCallback(() => {
        setDeleting(undefined);
    }, []);

    const renameView = useCallback(
        async (newName: string, hasError: boolean) => {
            if (!selectedView || !newName || !newName.trim() || hasError) {
                setSelectedView(undefined);
                return;
            }

            if (selectedView.name.toLowerCase() === newName.toLowerCase()) {
                setSelectedView(undefined);
                return;
            }

            await handleAction(async () => {
                await api.query.renameGridView(schemaQuery, containerPath, selectedView.name, newName);
                setSelectedView(undefined);
                if (selectedView.name === currentView.name) setReselectViewName(newName);
            });
        },
        [api, selectedView, handleAction, schemaQuery, containerPath, currentView]
    );

    return (
        <Modal cancelText="Done" onCancel={onClose} title="Manage Saved Views">
            <Alert>{errorMessage}</Alert>
            {!views && !errorMessage && <LoadingSpinner />}
            {views &&
                views.map((view, ind) => {
                    const { isDefault, isSystemView, shared, isVisible } = view;

                    // other than the default view, don't show system views or hidden views, but do show biologics details view
                    if (!isDefault && (isSystemView || (!isVisible && view.name !== ViewInfo.BIO_DETAIL_NAME))) {
                        return null;
                    }

                    const unsavedView = view.session;
                    const isRenaming = !!selectedView;
                    let canEdit = !isDefault && !isRenaming && !unsavedView && !deleting;
                    if (shared) {
                        canEdit = canEdit && userCanEditShared;
                    }

                    return (
                        <Fragment key={view.name}>
                            <div className="row small-margin-bottom">
                                <div className="col-xs-8">
                                    {selectedView && selectedView?.name === view.name ? (
                                        <ViewNameInput
                                            autoFocus
                                            view={selectedView}
                                            onBlur={renameView}
                                            placeholder={selectedView?.name}
                                            defaultValue={selectedView?.name}
                                        />
                                    ) : (
                                        <ViewLabel view={view} />
                                    )}
                                </div>
                                <div className="col-xs-4">
                                    <RequiresPermission perms={PermissionTypes.Admin}>
                                        {isDefault && !isRenaming && (
                                            <OverlayTrigger
                                                overlay={
                                                    <Popover id="disabled-button-popover" placement="top">
                                                        Revert back to the system default view.
                                                    </Popover>
                                                }
                                            >
                                                {view.isSaved ? (
                                                    <span onClick={revertDefaultView} className="clickable-text">
                                                        Revert
                                                    </span>
                                                ) : (
                                                    <span className="gray-text">Revert</span>
                                                )}
                                            </OverlayTrigger>
                                        )}
                                        {!isDefault && !isRenaming && (
                                            <span
                                                onClick={setDefaultView}
                                                id={'setDefault-' + ind}
                                                className="clickable-text"
                                            >
                                                Make default
                                            </span>
                                        )}
                                    </RequiresPermission>
                                    {canEdit && (
                                        <span className="pull-right">
                                            <span
                                                className="edit-inline-field__toggle small-right-padding"
                                                onClick={onSelectView}
                                            >
                                                <i id={'select-' + ind} className="fa fa-pencil" />
                                            </span>
                                            <span className="edit-inline-field__toggle" onClick={onDeleteView}>
                                                <i id={'delete-' + ind} className="fa fa-trash-o" />
                                            </span>
                                        </span>
                                    )}
                                </div>
                            </div>
                            {deleting === view && (
                                <div className="row bottom-padding">
                                    <div className="col-xs-12">
                                        <div className="inline-confirmation">
                                            <div>
                                                <span className="inline-confirmation__label">
                                                    Permanently remove this view?
                                                </span>
                                                <button
                                                    className="button-left-margin alert-button btn btn-danger"
                                                    id={'confirm-delete-' + ind}
                                                    onClick={deleteSavedView}
                                                    type="button"
                                                >
                                                    Yes
                                                </button>
                                                <button
                                                    className="button-left-margin alert-button btn btn-default"
                                                    id={'cancel-delete-' + ind}
                                                    onClick={cancelDeleteView}
                                                    type="button"
                                                >
                                                    No
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </Fragment>
                    );
                })}
        </Modal>
    );
});
