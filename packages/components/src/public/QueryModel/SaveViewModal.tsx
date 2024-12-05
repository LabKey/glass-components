import React, { ChangeEvent, FC, memo, useCallback, useEffect, useState } from 'react';

import { PermissionTypes } from '@labkey/api';

import classNames from 'classnames';

import { Modal } from '../../internal/Modal';
import { Alert } from '../../internal/components/base/Alert';
import { resolveErrorMessage } from '../../internal/util/messaging';
import { CUSTOM_VIEW, HelpLink } from '../../internal/util/helpLinks';
import { RequiresPermission } from '../../internal/components/base/Permissions';
import { isAppHomeFolder, isProductFoldersEnabled, userCanEditSharedViews } from '../../internal/app/utils';
import { useServerContext } from '../../internal/components/base/ServerContext';
import { ViewInfo } from '../../internal/ViewInfo';

const MAX_VIEW_NAME_LENGTH = 200;

const RESERVED_VIEW_NAMES = [
    'default',
    'my default',
    'your default',
    '~~details~~',
    '~~insert~~',
    '~~update~~',
    ViewInfo.SAMPLE_FINDER_VIEW_NAME,
    ViewInfo.IDENTIFYING_FIELDS_VIEW_NAME,
];

interface ViewNameInputProps {
    autoFocus?: boolean;
    defaultValue?: string;
    isDefaultView?: boolean;
    maxLength?: number;
    onBlur: (name: string, hasError: boolean) => void;
    onChange?: (name: string, hasError: boolean) => void;
    placeholder?: string;
    view: ViewInfo;
}

export const ViewNameInput: FC<ViewNameInputProps> = memo(props => {
    const {
        autoFocus,
        defaultValue,
        placeholder,
        view,
        isDefaultView,
        onBlur,
        onChange,
        maxLength = MAX_VIEW_NAME_LENGTH,
    } = props;

    const [nameError, setNameError] = useState<string>(undefined);
    const [viewName, setViewName] = useState<string>(view?.isDefault || view?.hidden ? '' : view?.name);

    const setNameErrorMessage = useCallback(() => {
        const trimmed = viewName.trim();
        if (trimmed.length > maxLength) {
            setNameError(`Current length: ${trimmed.length}; maximum length: ${maxLength}`);
        } else if (RESERVED_VIEW_NAMES.indexOf(trimmed.toLowerCase()) >= 0)
            setNameError(`View name '${trimmed}' is reserved.`);
        else setNameError(undefined);
    }, [maxLength, viewName]);

    useEffect(() => {
        if (!isDefaultView) {
            setNameErrorMessage();
        }
    }, [isDefaultView, setNameErrorMessage, viewName]);

    const clearError = useCallback(() => {
        setNameError(undefined);
    }, []);

    const onViewNameChange = useCallback(
        (evt: ChangeEvent<HTMLInputElement>) => {
            setViewName(evt.target.value);
            const trimmed = evt.target.value.trim();
            const hasError = trimmed.length > maxLength || RESERVED_VIEW_NAMES.indexOf(trimmed) >= 0;
            setNameErrorMessage();
            onChange?.(evt.target.value, hasError);
        },
        [maxLength, onChange, setNameErrorMessage]
    );

    const _onBlur = useCallback(() => {
        if (viewName.length > maxLength) {
            setNameErrorMessage();
            onBlur(viewName, true);
        } else {
            onBlur(viewName, false);
        }
    }, [maxLength, onBlur, setNameErrorMessage, viewName]);

    return (
        <>
            <input
                autoFocus={autoFocus}
                name="gridViewName"
                defaultValue={defaultValue}
                placeholder={placeholder ?? 'Grid View Name'}
                className={'form-control' + (nameError ? ' grid-view-name-error' : '')}
                value={viewName}
                onChange={onViewNameChange}
                onFocus={clearError}
                onBlur={_onBlur}
                disabled={isDefaultView}
                type="text"
            />
            {nameError && <span className="text-danger">{nameError}</span>}
        </>
    );
});

interface Props {
    currentView: ViewInfo;
    gridLabel: string;
    onCancel: () => void;
    onConfirmSave: (viewName, canInherit, replace, shared) => Promise<any>;
}

export const SaveViewModal: FC<Props> = memo(props => {
    const { onConfirmSave, currentView, onCancel, gridLabel } = props;
    const { container, moduleContext, user } = useServerContext();

    const [viewName, setViewName] = useState<string>(
        currentView?.isDefault || currentView?.hidden ? '' : currentView?.name
    );
    const [nameError, setNameError] = useState<boolean>(false);
    const [isDefaultView, setIsDefaultView] = useState<boolean>(
        () => user.hasAdminPermission() && currentView?.isDefault
    );
    const [canInherit, setCanInherit] = useState<boolean>(currentView?.inherit);
    const [isShared, setIsShared] = useState<boolean>(currentView?.shared);
    const [errorMessage, setErrorMessage] = useState<string>();
    const [isSubmitting, setIsSubmitting] = useState<boolean>();
    const canEditShared = userCanEditSharedViews(user);

    const saveView = useCallback(async () => {
        if (!viewName && !isDefaultView) return;

        setErrorMessage(undefined);
        setIsSubmitting(true);

        try {
            const name = isDefaultView ? '' : viewName.trim();
            const isCurrentView = name?.toLowerCase() === currentView?.name?.toLowerCase();
            await onConfirmSave(name, canInherit, isCurrentView, isDefaultView || isShared);
        } catch (error) {
            setErrorMessage(resolveErrorMessage(error));
        } finally {
            setIsSubmitting(false);
        }
    }, [viewName, isDefaultView, currentView?.name, onConfirmSave, canInherit, isShared]);

    const onViewNameChange = useCallback((name: string, hasError: boolean) => {
        setViewName(name);
        setNameError(hasError);
    }, []);

    const toggleDefaultView = useCallback((evt: ChangeEvent<HTMLInputElement>) => {
        setIsDefaultView(evt.target.id === 'defaultView');
        setNameError(false);
    }, []);

    const toggleInherit = useCallback((evt: ChangeEvent<HTMLInputElement>) => setCanInherit(evt.target.checked), []);
    const toggleShared = useCallback((evt: ChangeEvent<HTMLInputElement>) => setIsShared(evt.target.checked), []);

    return (
        <Modal
            canConfirm={(!!viewName && !nameError) || isDefaultView}
            isConfirming={isSubmitting}
            onCancel={onCancel}
            onConfirm={saveView}
            title="Save Grid View"
        >
            <Alert>{errorMessage}</Alert>
            <form onSubmit={saveView}>
                <div className="form-group">
                    <div className="bottom-padding">
                        Columns, sort order, and filters will be saved. Once saved, this view will be available for all{' '}
                        {gridLabel} grids throughout the application.
                    </div>

                    <RequiresPermission perms={PermissionTypes.Admin}>
                        {/* Only allow admins to create custom default views in app. Note this is different from LKS*/}
                        <div className="content-form">
                            <label className="clickable">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="setSaveType"
                                    id="defaultView"
                                    onChange={toggleDefaultView}
                                    checked={isDefaultView}
                                />
                                <span className="margin-left">Save as default view for all users</span>
                            </label>
                        </div>
                        <div className="content-form">
                            <label className="clickable">
                                <input
                                    checked={!isDefaultView}
                                    name="setSaveType"
                                    id="customView"
                                    onChange={toggleDefaultView}
                                    type="radio"
                                />
                                <span className="margin-left">Save as a custom view</span>
                            </label>
                        </div>
                    </RequiresPermission>
                    {!isDefaultView && (
                        <div
                            className={classNames('bottom-padding', {
                                'margin-left-more': user.hasAdminPermission(),
                            })}
                        >
                            <ViewNameInput
                                onChange={onViewNameChange}
                                onBlur={onViewNameChange}
                                view={currentView}
                                isDefaultView={isDefaultView}
                            />
                        </div>
                    )}
                    {!isDefaultView && canEditShared && (
                        <div className="form-check">
                            <input
                                className="form-check-input"
                                type="checkbox"
                                name="setShared"
                                onChange={toggleShared}
                                checked={isShared}
                            />
                            <span className="margin-left">Make this grid view available to all users</span>
                        </div>
                    )}
                    {isProductFoldersEnabled(moduleContext) &&
                        isAppHomeFolder(container, moduleContext) &&
                        canEditShared && (
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="checkbox"
                                    name="setInherit"
                                    onChange={toggleInherit}
                                    checked={canInherit}
                                />
                                <span className="margin-left">Make this grid view available in all Folders</span>
                            </div>
                        )}
                    <div className="top-padding">
                        Learn more about <HelpLink topic={CUSTOM_VIEW}>custom grid views</HelpLink> in LabKey.
                    </div>
                </div>
            </form>
        </Modal>
    );
});
