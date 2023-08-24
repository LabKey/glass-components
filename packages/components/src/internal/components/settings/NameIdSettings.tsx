import React, { FC, memo, useCallback, useEffect, useReducer } from 'react';

import { PermissionTypes } from '@labkey/api';
import { Button, Checkbox, Col, FormControl, Row } from 'react-bootstrap';

import { biologicsIsPrimaryApp, sampleManagerIsPrimaryApp } from '../../app/utils';

import { invalidateFullQueryDetailsCache } from '../../query/api';

import { RequiresPermission } from '../base/Permissions';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { ConfirmModal } from '../base/ConfirmModal';
import { Alert } from '../base/Alert';

import { useServerContext } from '../base/ServerContext';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { HelpLink } from '../../util/helpLinks';
import { SAMPLE_TYPE_NAME_EXPRESSION_TOPIC } from '../samples/constants';

import { loadNameExpressionOptions, saveNameExpressionOptions } from './actions';

const TITLE = 'ID/Name Settings';

interface NameIdSettingsFormProps extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
    loadNameExpressionOptions: () => Promise<{ allowUserSpecifiedNames: boolean; prefix: string }>;
    saveNameExpressionOptions: (key: string, value: string | boolean) => Promise<void>;
}

interface NameIdSettingsProps extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
}

interface State {
    allowUserSpecifiedNames: boolean;
    api?: ComponentsAPIWrapper;
    confirmCounterModalOpen?: boolean;
    confirmModalOpen: boolean;
    error: string;
    hasRootSamples?: boolean;
    hasSamples?: boolean;
    isReset?: boolean;
    isRoot?: boolean;
    loading: boolean;
    newRootSampleCount?: number;
    newSampleCount?: number;
    prefix: string;
    rootSampleCount?: number;
    sampleCount?: number;
    savingAllowUserSpecifiedNames: boolean;
    savingPrefix: boolean;
    updatingCounter?: boolean;
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

export const NameIdSettingsForm: FC<NameIdSettingsFormProps> = props => {
    const { api, loadNameExpressionOptions, saveNameExpressionOptions, setIsDirty } = props;
    const [state, setState] = useReducer(
        (currentState: State, newState: Partial<State>): State => ({ ...currentState, ...newState }),
        initialState
    );
    const { moduleContext } = useServerContext();

    const {
        loading,
        savingAllowUserSpecifiedNames,
        allowUserSpecifiedNames,
        prefix,
        savingPrefix,
        confirmModalOpen,
        error,
        confirmCounterModalOpen,
        isRoot,
        isReset,
        updatingCounter,
        hasRootSamples,
        hasSamples,
        rootSampleCount,
        sampleCount,
        newSampleCount,
        newRootSampleCount,
    } = state;

    const initialize = async (): Promise<void> => {
        try {
            const payload = await loadNameExpressionOptions();
            const sampleCount = await api.samples.getSampleCounter('sampleCount'); // show the next value
            const rootSampleCount = await api.samples.getSampleCounter('rootSampleCount');
            let hasRootSamples = false,
                hasSamples = false;
            if (sampleCount > 0) hasSamples = await api.samples.hasExistingSamples(false);
            if (rootSampleCount > 0) hasRootSamples = await api.samples.hasExistingSamples(true);

            setState({
                prefix: payload.prefix ?? '',
                allowUserSpecifiedNames: payload.allowUserSpecifiedNames,
                loading: false,
                sampleCount,
                rootSampleCount,
                newSampleCount: sampleCount,
                newRootSampleCount: rootSampleCount,
                hasSamples,
                hasRootSamples,
            });
        } catch (err) {
            setState({ error: err.exception, loading: false });
        }
    };

    useEffect(() => {
        initialize();
    }, []);

    const displayError = (err): void => {
        setState({
            error: err.exception ?? 'Error saving setting',
            savingAllowUserSpecifiedNames: false,
        });
    };

    const saveAllowUserSpecifiedNames = useCallback(async () => {
        setState({ savingAllowUserSpecifiedNames: true });

        try {
            await saveNameExpressionOptions('allowUserSpecifiedNames', !allowUserSpecifiedNames);

            // Issue 44250: the sample type and data class queryInfo details for the name column will set the
            // setShownInInsertView based on this allowUserSpecifiedNames setting so we need to invalidate the cache
            // so that the updated information is retrieved for that table/query.
            invalidateFullQueryDetailsCache();

            setState({
                allowUserSpecifiedNames: !allowUserSpecifiedNames,
                savingAllowUserSpecifiedNames: false,
            });
        } catch (err) {
            displayError(err);
        }
    }, [allowUserSpecifiedNames, saveNameExpressionOptions]);

    const savePrefix = useCallback(async () => {
        setState({ savingPrefix: true });

        try {
            await saveNameExpressionOptions('prefix', prefix);
        } catch (err) {
            displayError(err);
        }
        setState({ savingPrefix: false, confirmModalOpen: false });
        setIsDirty(false);
    }, [prefix, saveNameExpressionOptions, setIsDirty]);

    const prefixOnChange = useCallback(
        (evt: any) => {
            const val = evt.target.value;
            setState({ prefix: val });
            setIsDirty(true);
        },
        [setIsDirty]
    );

    const openConfirmModal = useCallback(() => {
        setState({ confirmModalOpen: true });
    }, []);

    const closeConfirmModal = useCallback(() => {
        setState({ confirmModalOpen: false });
    }, []);

    const openSetCounterConfirmModal = useCallback((isRoot, isReset) => {
        setState({
            confirmCounterModalOpen: true,
            isRoot,
            isReset,
        });
    }, []);

    const closeCounterConfirmModal = useCallback(() => {
        setState({
            confirmCounterModalOpen: false,
        });
    }, []);

    const setNewSampleCount = useCallback(
        (newValue: number, root?: boolean) => {
            if (root)
                setState({
                    newRootSampleCount: newValue,
                });
            else
                setState({
                    newSampleCount: newValue,
                });
            setIsDirty(true);
        },
        [setIsDirty]
    );

    const saveSampleCounter = useCallback(async () => {
        const newCount = isReset ? 0 : isRoot ? newRootSampleCount : newSampleCount;
        try {
            await api.samples.saveSampleCounter(newCount, isRoot ? 'rootSampleCount' : 'sampleCount');
            if (isRoot)
                setState({
                    rootSampleCount: newCount,
                    confirmCounterModalOpen: false,
                    newRootSampleCount: newCount,
                });
            else
                setState({
                    sampleCount: newCount,
                    confirmCounterModalOpen: false,
                    newSampleCount: newCount,
                });
            setIsDirty(false);
        } catch (err) {
            setState({ error: err.exception });
        }
    }, [isRoot, isReset, newRootSampleCount, newSampleCount, setIsDirty]);

    return (
        <div className="name-id-settings-panel panel panel-default">
            <div className="panel-heading">{TITLE}</div>
            <div className="panel-body">
                <div className="name-id-setting__setting-section">
                    <div className="list__bold-text margin-bottom">User-defined IDs/Names</div>

                    {loading && <LoadingSpinner />}
                    {!loading && (
                        <form>
                            <Checkbox
                                onChange={saveAllowUserSpecifiedNames}
                                disabled={savingAllowUserSpecifiedNames}
                                checked={allowUserSpecifiedNames}
                            >
                                Allow users to create/import their own IDs/Names
                                <LabelHelpTip title="User Defined ID/Names">
                                    <p>
                                        When users are not permitted to create their own IDs/Names, the ID/Name field
                                        will be hidden during creation and update of rows, and when accessing the design
                                        of a new or existing Sample Type or{' '}
                                        {sampleManagerIsPrimaryApp(moduleContext) ? 'Source Type' : 'Data Class'}.
                                    </p>
                                    <p>
                                        Additionally, attempting to import data and update existing rows during file
                                        import will result in an error if a new ID/Name is encountered.
                                    </p>
                                </LabelHelpTip>
                            </Checkbox>
                        </form>
                    )}
                </div>

                {biologicsIsPrimaryApp(moduleContext) && (
                    <div className="name-id-setting__setting-section">
                        <div className="list__bold-text margin-bottom margin-top">ID/Name Prefix</div>
                        <div>
                            Enter a prefix to the Naming Pattern for all new Samples and{' '}
                            {sampleManagerIsPrimaryApp(moduleContext) ? 'Sources' : 'Data Classes'}. No existing
                            IDs/Names will be changed.
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

                                    <Button
                                        className="btn btn-success"
                                        onClick={openConfirmModal}
                                        disabled={savingPrefix}
                                    >
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
                                                This action will change the Naming Pattern for all new and existing
                                                Sample Types and{' '}
                                                {sampleManagerIsPrimaryApp(moduleContext)
                                                    ? 'Source Types'
                                                    : 'Data Classes'}
                                                . No existing IDs/Names will be affected but any new IDs/Names will have
                                                the prefix applied. Are you sure you want to apply the prefix?
                                            </p>
                                        </div>
                                    </ConfirmModal>
                                )}
                            </>
                        )}
                    </div>
                )}

                <div className="sample-counter__setting-section">
                    <div className="list__bold-text margin-bottom">Naming Pattern Elements/Tokens</div>
                    <div>
                        The following tokens/counters are utilized in naming patterns for the project and all
                        sub-projects. To modify a counter, simply enter a number greater than the current value and
                        click “Apply”. Please be aware that once a counter is changed, the action cannot be reversed.
                        For additional information regarding these tokens, you can refer to this{' '}
                        <HelpLink topic={SAMPLE_TYPE_NAME_EXPRESSION_TOPIC}>link</HelpLink>.
                    </div>

                    {loading && <LoadingSpinner />}
                    {!loading && (
                        <div>
                            <Row className="margin-top">
                                <Col xs={2}>
                                    <div className="sample-counter__prefix-label">sampleCount</div>
                                </Col>
                                <Col xs={4}>
                                    <FormControl
                                        className="update-samplecount-input "
                                        min={sampleCount}
                                        step={1}
                                        name="newSampleCount"
                                        onChange={(event: any) => setNewSampleCount(event?.target?.value, false)}
                                        type="number"
                                        value={newSampleCount}
                                        placeholder="Enter new sampleCount..."
                                    />
                                </Col>
                                <Col xs={3}>
                                    <Button
                                        className="btn btn-success"
                                        onClick={() => {
                                            openSetCounterConfirmModal(false, false);
                                        }}
                                        disabled={updatingCounter}
                                    >
                                        Apply New sampleCount
                                    </Button>
                                </Col>
                                <Col xs={3}>
                                    {!hasSamples && sampleCount > 0 && (
                                        <Button
                                            className="btn btn-success"
                                            onClick={() => {
                                                openSetCounterConfirmModal(false, true);
                                            }}
                                            disabled={updatingCounter}
                                        >
                                            Reset sampleCount
                                        </Button>
                                    )}
                                </Col>
                                <Col xs={3} />
                            </Row>
                            <Row className="margin-top">
                                <Col xs={2}>
                                    <div className="sample-counter__prefix-label">rootSampleCount</div>
                                </Col>
                                <Col xs={4}>
                                    <FormControl
                                        className="update-samplecount-input "
                                        min={rootSampleCount}
                                        step={1}
                                        name="newRootSampleCount"
                                        onChange={(event: any) => setNewSampleCount(event?.target?.value, true)}
                                        type="number"
                                        value={newRootSampleCount}
                                        placeholder="Enter new rootSampleCount..."
                                    />
                                </Col>
                                <Col xs={3}>
                                    <Button
                                        className="btn btn-success"
                                        onClick={() => {
                                            openSetCounterConfirmModal(true, false);
                                        }}
                                        disabled={updatingCounter}
                                    >
                                        Apply New rootSampleCount
                                    </Button>
                                </Col>
                                <Col xs={3}>
                                    {!hasRootSamples && rootSampleCount > 0 && (
                                        <Button
                                            className="btn btn-success"
                                            onClick={() => {
                                                openSetCounterConfirmModal(true, true);
                                            }}
                                            disabled={updatingCounter}
                                        >
                                            Reset rootSampleCount
                                        </Button>
                                    )}
                                </Col>
                                <Col xs={3} />
                            </Row>
                            {confirmCounterModalOpen && (
                                <ConfirmModal
                                    title={'Change ' + (isRoot ? 'rootSampleCount' : 'sampleCount')}
                                    onCancel={closeCounterConfirmModal}
                                    onConfirm={saveSampleCounter}
                                    confirmButtonText="Yes"
                                    cancelButtonText="Cancel"
                                >
                                    <div>
                                        <p>
                                            This action will change the {isRoot ? 'rootSampleCount' : 'sampleCount'}{' '}
                                            from {isRoot ? rootSampleCount : sampleCount} to{' '}
                                            {isReset ? 0 : isRoot ? newRootSampleCount : newSampleCount} for the project
                                            and all sub-projects. Are you sure you want to proceed? This action cannot
                                            be undone.
                                        </p>
                                    </div>
                                </ConfirmModal>
                            )}
                        </div>
                    )}
                </div>

                {error !== undefined && <Alert className="name-id-setting__error">{error}</Alert>}
            </div>
        </div>
    );
};

export const NameIdSettings: FC<NameIdSettingsProps> = memo(props => {
    return (
        <RequiresPermission perms={PermissionTypes.Admin}>
            <NameIdSettingsForm
                {...props}
                saveNameExpressionOptions={saveNameExpressionOptions}
                loadNameExpressionOptions={loadNameExpressionOptions}
            />
        </RequiresPermission>
    );
});

NameIdSettings.defaultProps = {
    api: getDefaultAPIWrapper(),
};
