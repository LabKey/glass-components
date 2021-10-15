import React, { FC, useCallback, useEffect, useReducer } from 'react';

import { PermissionTypes } from '@labkey/api';
import { Button, Checkbox, FormControl } from 'react-bootstrap';

import { Alert, ConfirmModal, LabelHelpTip, LoadingSpinner, RequiresPermission } from '../../..';

import { hasModule } from '../../app/utils';

import { loadNameExpressionOptions, saveNameExpressionOptions } from './actions';

export const NameIdSettings = () => {
    return (
        <RequiresPermission perms={PermissionTypes.Admin}>
            <NameIdSettingsForm
                saveNameExpressionOptions={saveNameExpressionOptions}
                loadNameExpressionOptions={loadNameExpressionOptions}
            />
        </RequiresPermission>
    );
};

interface Props {
    loadNameExpressionOptions: () => Promise<{ prefix: string; allowUserSpecifiedNames: boolean }>;
    saveNameExpressionOptions: (key: string, value: string | boolean) => Promise<void>;
}

interface State {
    error: string;
    loading: boolean;
    prefix: string;
    savingPrefix: boolean;
    allowUserSpecifiedNames: boolean;
    savingAllowUserSpecifiedNames: boolean;
    confirmModalOpen: boolean;
}

const initialState: State = {
    error: undefined,
    loading: true,
    prefix: '',
    savingPrefix: false,
    confirmModalOpen: false,
    allowUserSpecifiedNames: false,
    savingAllowUserSpecifiedNames: false,
};
export const NameIdSettingsForm: FC<Props> = props => {
    const { loadNameExpressionOptions, saveNameExpressionOptions } = props;
    const [state, setState] = useReducer(
        (currentState: State, newState: Partial<State>): State => ({ ...currentState, ...newState }),
        initialState
    );

    const {
        loading,
        savingAllowUserSpecifiedNames,
        allowUserSpecifiedNames,
        prefix,
        savingPrefix,
        confirmModalOpen,
        error,
    } = state;

    const initialize = async () => {
        const payload = await loadNameExpressionOptions();
        setState({
            prefix: payload.prefix ?? '',
            allowUserSpecifiedNames: payload.allowUserSpecifiedNames,
            loading: false,
        });
    };

    useEffect(() => {
        initialize();
    }, []);

    const saveAllowUserSpecifiedNames = useCallback(async () => {
        setState({ savingAllowUserSpecifiedNames: true });
        await saveNameExpressionOptions('allowUserSpecifiedNames', !allowUserSpecifiedNames).catch(err =>
            displayError(err)
        );
        setState({
            allowUserSpecifiedNames: !allowUserSpecifiedNames,
            savingAllowUserSpecifiedNames: false,
        });
    }, [allowUserSpecifiedNames]);

    const savePrefix = async () => {
        setState({ savingPrefix: true });
        await saveNameExpressionOptions('prefix', prefix).catch(err => displayError(err));
        setState({ savingPrefix: false, confirmModalOpen: false });
    };

    const displayError = (err): void => {
        setState({
            error: err.exception ?? 'Error saving setting',
            savingAllowUserSpecifiedNames: false,
        });
    };

    const prefixOnChange = useCallback(async (evt: any) => {
        const val = evt.target.value;
        setState({ prefix: val });
    }, []);

    const openConfirmModal = useCallback(async () => {
        setState({ confirmModalOpen: true });
    }, []);

    const closeConfirmModal = useCallback(async () => {
        setState({ confirmModalOpen: false });
    }, []);

    return (
        <div className="name-id-settings-panel panel">
            <div className="panel-body">
                <h4 className="name-id-setting__setting-panel-title">ID/Name Settings</h4>
                <div className="name-id-setting__setting-section">
                    <h5> User Defined ID/Names </h5>

                    {loading && <LoadingSpinner />}
                    {!loading && (
                        <form>
                            <Checkbox
                                onChange={saveAllowUserSpecifiedNames}
                                disabled={savingAllowUserSpecifiedNames}
                                checked={allowUserSpecifiedNames}
                            >
                                Allow users to create/import their own IDs/Names
                                <LabelHelpTip title="TBD">
                                    <p> TBD </p>
                                </LabelHelpTip>
                            </Checkbox>
                        </form>
                    )}
                </div>

                <div className="name-id-setting__setting-section">
                    <h5> ID/Name Prefix </h5>
                    <div>
                        Enter a Prefix to be applied to all{' '}
                        {hasModule('biologics')
                            ? 'Sample Types and Data Classes (e.g. CellLine, Construct)'
                            : 'Sample Types and Sources'}
                        . Prefixes generally are 2-3 characters long but will not be limited. For example, if you
                        provide the prefix "CL" your ID will look like "CL123".
                    </div>

                    {loading && <LoadingSpinner />}
                    {!loading && (
                        <>
                            <div className="name-id-setting__prefix">
                                <div className="name-id-setting__prefix-label"> Prefix: </div>

                                <div className="name-id-setting__prefix-field">
                                    <FormControl
                                        name="prefix"
                                        type="text"
                                        placeholder="Enter Prefix"
                                        onChange={prefixOnChange}
                                        value={prefix}
                                    />
                                </div>

                                <Button className="btn btn-success" onClick={openConfirmModal} disabled={savingPrefix}>
                                    Apply Prefix
                                </Button>
                            </div>
                            <div className="name-id-setting__prefix-example">
                                Example: {prefix}Blood-${'{'}GenId{'}'}
                            </div>

                            {confirmModalOpen && (
                                <ConfirmModal
                                    title="Apply Prefix?"
                                    onCancel={closeConfirmModal}
                                    onConfirm={savePrefix}
                                    confirmButtonText="Yes, Save and Apply Prefix"
                                    cancelButtonText="Cancel"
                                >
                                    <div>
                                        <p>
                                            This action will change the Naming Pattern for all new and existing Sample
                                            Types and Data Classes. No existing IDs/Names will be affected. Are you sure
                                            you want to apply the prefix?
                                        </p>
                                    </div>
                                </ConfirmModal>
                            )}
                        </>
                    )}
                </div>

                {error !== undefined && <Alert>{error}</Alert>}
            </div>
        </div>
    );
};
