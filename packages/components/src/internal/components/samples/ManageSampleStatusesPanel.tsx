import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { FormGroup } from 'react-bootstrap';
import { List } from 'immutable';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { Alert } from '../base/Alert';
import { LockIcon } from '../base/LockIcon';
import { Modal } from '../../Modal';
import { ChoicesListItem } from '../base/ChoicesListItem';

import { AddEntityButton } from '../buttons/AddEntityButton';
import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SelectInput } from '../forms/input/SelectInput';
import { caseInsensitive } from '../../util/utils';
import { SCHEMAS } from '../../schemas';
import { resolveErrorMessage } from '../../util/messaging';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { DisableableButton } from '../buttons/DisableableButton';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';

import { useAppContext } from '../../AppContext';

import { Container } from '../base/models/Container';

import { SampleState } from './models';
import { getSampleStatusLockedMessage } from './utils';
import { ColorPickerInput } from '../forms/input/ColorPickerInput';
import { SampleStatusTag } from './SampleStatusTag';
import { SAMPLE_STATUS_COLORS, SampleStateType } from './constants';
import { LabelHelpTip } from '../base/LabelHelpTip';

const TITLE = 'Manage Sample Statuses';
const STATE_TYPE_SQ = new SchemaQuery('exp', 'SampleStateType');
const DEFAULT_TYPE_OPTIONS = [{ value: 'Available' }, { value: 'Consumed' }, { value: 'Locked' }];
const NEW_STATUS_INDEX = -1;
const SAMPLE_STATUS_LOCKED_TITLE = 'Sample Status Locked';

interface SampleStatusDetailProps {
    addNew: boolean;
    container?: Container;
    onActionComplete: (newStatusLabel?: string, isDelete?: boolean) => void;
    onChange: () => void;
    state: SampleState;
}

// exported for jest testing
export const SampleStatusDetail: FC<SampleStatusDetailProps> = memo(props => {
    const { state, addNew, onActionComplete, onChange, container } = props;
    const [typeOptions, setTypeOptions] = useState<Array<Record<string, any>>>();
    const [updatedState, setUpdatedState] = useState<SampleState>();
    const [dirty, setDirty] = useState<boolean>();
    const [saving, setSaving] = useState<boolean>();
    const [error, setError] = useState<string>();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>();
    const { api } = useAppContext();

    useEffect(() => {
        (async () => {
            try {
                const response = await api.query.selectRows({
                    columns: 'RowId,Value',
                    schemaQuery: STATE_TYPE_SQ,
                    containerPath: container?.path,
                });

                const options = response.rows.reduce((options_, row) => {
                    options_.push({ value: caseInsensitive(row, 'Value').value });
                    return options_;
                }, []);
                setTypeOptions(options);
            } catch (e) {
                setTypeOptions(DEFAULT_TYPE_OPTIONS);
            }
        })();
    }, [api, container?.path]);

    const resetState = useCallback(() => {
        setSaving(false);
        setShowDeleteConfirm(false);
        setError(undefined);
    }, []);

    useEffect(() => {
        if (addNew) {
            setUpdatedState(new SampleState({ stateType: typeOptions?.[0]?.value, isLocal: true }));
        } else {
            setUpdatedState(state);
        }
        setDirty(addNew);
        if (addNew) onChange();
        resetState();
    }, [state, addNew, typeOptions, resetState, onChange]);

    const onFormChange = useCallback(
        (evt): void => {
            const { name, value } = evt.target;
            setUpdatedState(updatedState.set(name, value));
            setDirty(true);
            onChange();
        },
        [updatedState, onChange]
    );

    const onSelectChange = useCallback(
        (name, value): void => {
            setUpdatedState(updatedState.set(name, value));
            setDirty(true);
            onChange();
        },
        [updatedState, onChange]
    );

    const onCancel = useCallback(() => {
        onActionComplete(undefined, true);
    }, [onActionComplete]);

    const onSave = useCallback(() => {
        setError(undefined);
        setSaving(true);

        // trim the label string before saving
        const stateToSave = updatedState.set('label', updatedState.label?.trim());

        if (stateToSave.rowId) {
            api.query
                .updateRows({
                    schemaQuery: SCHEMAS.CORE_TABLES.DATA_STATES,
                    rows: [stateToSave],
                    containerPath: container?.path,
                })
                .then(() => {
                    onActionComplete(stateToSave.label);
                })
                .catch(reason => {
                    setError(resolveErrorMessage(reason, 'status', 'statuses', 'updating'));
                    setSaving(false);
                });
        } else {
            api.query
                .insertRows({
                    schemaQuery: SCHEMAS.CORE_TABLES.DATA_STATES,
                    rows: List([stateToSave]),
                    containerPath: container?.path,
                })
                .then(() => {
                    onActionComplete(stateToSave.label);
                })
                .catch(response => {
                    setError(resolveErrorMessage(response.get('error'), 'status', 'statuses', 'inserting'));
                    setSaving(false);
                });
        }
    }, [api, updatedState, onActionComplete, container?.path]);

    const onToggleDeleteConfirm = useCallback(() => setShowDeleteConfirm(!showDeleteConfirm), [showDeleteConfirm]);
    const onDeleteConfirm = useCallback(() => {
        if (updatedState.rowId) {
            api.query
                .deleteRows({
                    schemaQuery: SCHEMAS.CORE_TABLES.DATA_STATES,
                    rows: [updatedState],
                })
                .then(() => {
                    onActionComplete(undefined, true);
                })
                .catch(reason => {
                    setError(resolveErrorMessage(reason, 'status', 'statuses', 'deleting'));
                    setShowDeleteConfirm(false);
                });
        } else {
            setShowDeleteConfirm(false);
        }
    }, [api, updatedState, onActionComplete]);

    const disabledMsg = useMemo(() => {
        return getSampleStatusLockedMessage(updatedState, saving);
    }, [updatedState, saving]);

    return (
        <>
            {/* using null for state value to indicate that we don't want to show the empty message*/}
            {!updatedState && state !== null && (
                <p className="choices-detail__empty-message">Select a sample status to view details.</p>
            )}
            {updatedState && (
                <form className="form-horizontal content-form">
                    {error && <Alert>{error}</Alert>}
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Label" required />
                        </div>
                        <div className="col-sm-8">
                            <input
                                className="form-control"
                                name="label"
                                onChange={onFormChange}
                                disabled={saving || !updatedState.isLocal}
                                placeholder="Enter status label"
                                type="text"
                                value={updatedState.label ?? ''}
                            />
                        </div>
                    </FormGroup>
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Color" required />
                        </div>
                        <div className="col-sm-8">
                            <ColorPickerInput
                                name="color"
                                value={updatedState.color}
                                onChange={onSelectChange}
                                allowRemove
                                colors={Object.keys(SAMPLE_STATUS_COLORS)}
                            />
                        </div>
                    </FormGroup>
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Description" />
                        </div>
                        <div className="col-sm-8">
                            <textarea
                                className="form-control"
                                name="description"
                                onChange={onFormChange}
                                disabled={saving || !updatedState.isLocal}
                                value={updatedState.description ?? ''}
                            />
                        </div>
                    </FormGroup>
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Status Type" required />
                        </div>
                        <div className="col-sm-8">
                            <SelectInput
                                name="stateType"
                                inputClass="col-sm-12"
                                labelKey="value"
                                clearable={false}
                                onChange={onSelectChange}
                                disabled={updatedState.inUse || !updatedState.isLocal || saving}
                                options={typeOptions}
                                value={updatedState.stateType}
                            />
                        </div>
                    </FormGroup>
                    <div>
                        {!addNew && updatedState.isLocal && (
                            <DisableableButton
                                disabledMsg={disabledMsg}
                                onClick={onToggleDeleteConfirm}
                                title={SAMPLE_STATUS_LOCKED_TITLE}
                            >
                                <span className="fa fa-trash" />
                                <span>&nbsp;Delete</span>
                            </DisableableButton>
                        )}
                        {addNew && (
                            <button className="btn btn-default" disabled={saving} onClick={onCancel} type="button">
                                Cancel
                            </button>
                        )}
                        {updatedState.isLocal && (
                            <button
                                className="pull-right btn btn-success"
                                disabled={!dirty || saving || !updatedState.color || !updatedState.label}
                                onClick={onSave}
                                type="button"
                            >
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                        )}
                    </div>
                </form>
            )}
            {showDeleteConfirm && (
                <Modal
                    confirmClass="btn-danger"
                    confirmText="Yes, Delete"
                    onCancel={onToggleDeleteConfirm}
                    onConfirm={onDeleteConfirm}
                    title="Permanently Delete Status?"
                >
                    <span>
                        The <b>{updatedState.label}</b> status will be permanently deleted.
                        <p className="top-spacing">
                            <strong>Deletion cannot be undone.</strong> Do you want to proceed?
                        </p>
                    </span>
                </Modal>
            )}
        </>
    );
});
SampleStatusDetail.displayName = 'SampleStatusDetail';

interface SampleStatusesListProps {
    onSelect: (index: number, group?: string) => void;
    selected: number;
    selectedGroup: string;
    statesByType: Record<string, SampleState[]>;
}

const HELP_TEXT = {
    [SampleStateType.Available]: 'Allows any action. Included in the calculation of available amount.',
    [SampleStateType.Consumed]: 'Prevents updates to storage such as adding to storage or changing F/T count.',
    [SampleStateType.Locked]: 'All updates to the sample are prevented. Locked samples may be added to picklists.',
};

// exported for jest testing
export const SampleStatusesList: FC<SampleStatusesListProps> = memo(props => {
    const { statesByType, onSelect, selected, selectedGroup } = props;

    return (
        <>
            {Object.entries(statesByType).map(([stateType, _states]) => (
                <React.Fragment key={stateType}>
                    <div className="choice-section-header">
                        {stateType}
                        <LabelHelpTip
                            iconComponent={
                                <span>
                                    <i className="fa fa-info-circle" />
                                </span>
                            }
                            placement="right"
                        >
                            {HELP_TEXT[SampleStateType[stateType]]}
                        </LabelHelpTip>
                    </div>
                    <div className="list-group">
                        {_states.map((state, index) => (
                            <ChoicesListItem
                                active={index === selected && stateType === selectedGroup}
                                group={stateType}
                                index={index}
                                key={state.rowId}
                                label={<SampleStatusTag status={state.toSampleStatus()} />}
                                onSelect={onSelect}
                                componentRight={
                                    (state.inUse || !state.isLocal) && (
                                        <LockIcon
                                            iconCls="pull-right choices-list__locked"
                                            body={getSampleStatusLockedMessage(state, false)}
                                            id="sample-state-lock-icon"
                                            title={SAMPLE_STATUS_LOCKED_TITLE}
                                        />
                                    )
                                }
                            />
                        ))}
                        {Object.keys(statesByType).length === 0 && (
                            <p className="choices-list__empty-message">No sample statuses defined.</p>
                        )}
                    </div>
                </React.Fragment>
            ))}
        </>
    );
});
SampleStatusesList.displayName = 'SampleStatusesList';

interface ManageSampleStatusesPanelProps extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
    container?: Container;
}

export const ManageSampleStatusesPanel: FC<ManageSampleStatusesPanelProps> = memo(props => {
    const { api, setIsDirty, container } = props;
    const [states, setStates] = useState<Record<string, SampleState[]>>();
    const [error, setError] = useState<string>();
    const [selected, setSelected] = useState<number>();
    const [selectedGroup, setSelectedGroup] = useState<string>();
    const addNew = useMemo(() => selected === NEW_STATUS_INDEX, [selected]);

    const querySampleStatuses = useCallback(
        (newStatusLabel?: string) => {
            setError(undefined);

            api.samples
                .getSampleStatuses(true, container?.path)
                .then(statuses => {
                    const statesByType: Record<string, SampleState[]> = {};
                    statuses.forEach(state => {
                        if (!statesByType[state.stateType]) {
                            statesByType[state.stateType] = [];
                        }
                        statesByType[state.stateType].push(state);
                    });
                    setStates(statesByType);
                    if (newStatusLabel) {
                        setSelected(statuses.findIndex(state => state.label === newStatusLabel));
                    }
                })
                .catch(() => {
                    setStates({});
                    setError('Error: Unable to load sample statuses.');
                });
        },
        [api, container]
    );

    useEffect(() => {
        querySampleStatuses();
    }, [querySampleStatuses]);

    const onSetSelected = useCallback((index: number, group: string) => {
        setSelected(index);
        setSelectedGroup(group);
    }, []);

    const onAddState = useCallback(() => {
        setSelected(NEW_STATUS_INDEX);
    }, []);

    const onChange = useCallback(() => {
        setIsDirty(true);
    }, [setIsDirty]);

    const onActionComplete = useCallback(
        (newStatusLabel?: string, isDelete = false) => {
            querySampleStatuses(newStatusLabel);
            if (isDelete) setSelected(undefined);
            setIsDirty(false);
        },
        [querySampleStatuses, setIsDirty]
    );

    return (
        <div className="panel panel-default">
            <div className="panel-heading">{TITLE}</div>
            <div className="panel-body">
                {error && <Alert>{error}</Alert>}
                {!states && <LoadingSpinner />}
                {states && !error && (
                    <div className="row choices-container">
                        <div className="col-lg-4 col-md-6 choices-container-left-panel">
                            <SampleStatusesList
                                statesByType={states}
                                selected={selected}
                                selectedGroup={selectedGroup}
                                onSelect={onSetSelected}
                            />
                            <AddEntityButton onClick={onAddState} entity="New Status" disabled={addNew} />
                        </div>
                        <div className="col-lg-8 col-md-6">
                            <SampleStatusDetail
                                // use null to indicate that no statuses exist to be selected, so don't show the empty message
                                state={Object.keys(states).length === 0 ? null : states[selectedGroup]?.[selected]}
                                addNew={addNew}
                                onActionComplete={onActionComplete}
                                onChange={onChange}
                                container={container}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

ManageSampleStatusesPanel.defaultProps = {
    api: getDefaultAPIWrapper(),
};

ManageSampleStatusesPanel.displayName = 'ManageSampleStatusesPanel';
