import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Button, FormGroup } from 'react-bootstrap';
import ReactBootstrapToggle from 'react-bootstrap-toggle';

import { List } from 'immutable';

import { getServerContext } from '@labkey/api';

import { InjectedRouteLeaveProps } from '../../util/RouteLeave';
import { ComponentsAPIWrapper } from '../../APIWrapper';
import { Alert } from '../base/Alert';

import { AddEntityButton } from '../buttons/AddEntityButton';

import { LoadingSpinner } from '../base/LoadingSpinner';
import { ConfirmModal } from '../base/ConfirmModal';
import { DomainFieldLabel } from '../domainproperties/DomainFieldLabel';
import { deleteRows, insertRows, InsertRowsResponse, updateRows } from '../../query/api';
import { resolveErrorMessage } from '../../util/messaging';
import { DisableableButton } from '../buttons/DisableableButton';

import { ChoicesListItem } from '../base/ChoicesListItem';

import { useServerContext } from '../base/ServerContext';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { LabelTemplate } from './models';
import { LABEL_TEMPLATE_SQ } from './constants';
import { isAppHomeFolder } from '../../app/utils';

const TITLE = 'Manage Label Templates';
const NEW_LABEL_INDEX = -1;
const SAVING_LOCKED_TIP = 'Currently saving';
const SAVING_LOCKED_TITLE = 'Saving';

interface LabelTemplatesPanelProps extends InjectedRouteLeaveProps {
    api?: ComponentsAPIWrapper;
    defaultLabel?: number;
}

interface LabelTemplatesListProps {
    defaultLabel?: number;
    onSelect: (index: number) => void;
    selected: number;
    templates: LabelTemplate[];
}

interface LabelTemplateDetailsProps {
    api?: ComponentsAPIWrapper;
    defaultLabel?: number;
    isDefaultable: boolean;
    isNew: boolean;
    onActionCompleted: (newLabel?: number, isDelete?: boolean) => void;
    onChange: () => void;
    onDefaultChanged: (newDefault: number) => void;
    template: LabelTemplate;
}

export const LabelTemplatesList: FC<LabelTemplatesListProps> = memo(props => {
    const { onSelect, defaultLabel, selected, templates } = props;
    const isDefault = useCallback(
        (rowId: number) => {
            return rowId === defaultLabel ? <div className="badge">default</div> : undefined;
        },
        [defaultLabel]
    );

    if (!templates || templates.length === 0)
        return <div className="choices-list__empty-message">No label templates registered.</div>;

    return (
        <>
            <div className="list-group">
                {templates.map((template, index) => (
                    <ChoicesListItem
                        active={index === selected}
                        index={index}
                        subLabel={template.path}
                        key={template.rowId}
                        label={template.name}
                        onSelect={onSelect}
                        componentRight={isDefault(template.rowId)}
                    />
                ))}
            </div>
        </>
    );
});

const normalizeValues = (template: LabelTemplate): LabelTemplate => {
    if (!template) throw Error('Unable to save, invalid template');

    return new LabelTemplate({
        name: template.name?.trim(),
        description: template.description,
        path: template.path?.trim(),
        rowId: template.rowId,
        container: template.container,
    });
};

const canBeDefault = (template: LabelTemplate): boolean => {
    const currentContainer = getServerContext().container;
    return (
        !template || // New template
        currentContainer.parentId === template.container || // Template is from the project level
        currentContainer.id === template.container // Template is from this project
    );
};

export const LabelTemplateDetails: FC<LabelTemplateDetailsProps> = memo(props => {
    const { api, template, isNew, onChange, onActionCompleted, defaultLabel, onDefaultChanged, isDefaultable } = props;
    const [updatedTemplate, setUpdateTemplate] = useState<LabelTemplate>();
    // TODO is this needed since the Dirty state is tracked in the parent component?
    const [dirty, setDirty] = useState<boolean>();
    const [saving, setSaving] = useState<boolean>();
    const [error, setError] = useState<string>();
    const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
    const [isDefault, setIsDefault] = useState<boolean>(false);

    useEffect(() => {
        setIsDefault(!!defaultLabel && defaultLabel === template?.rowId);
    }, [defaultLabel, template?.rowId]);

    // Clear error if Template changes
    useEffect(() => {
        setError(undefined);
    }, [template]);

    useEffect(() => {
        if (isNew) {
            setUpdateTemplate(new LabelTemplate({}));
            onChange();
        } else {
            setUpdateTemplate(template);
        }

        setDirty(isNew);
    }, [isNew, onChange, template]);

    const onCancel = useCallback(() => {
        onActionCompleted(undefined, true);
    }, [onActionCompleted]);

    const defaultToggleHandler = useCallback(
        switchVal => {
            setDirty(dirty || switchVal !== isDefault);
            setIsDefault(switchVal);
            onChange?.();
        },
        [dirty, isDefault, onChange]
    );

    const onToggleDeleteConfirm = useCallback(() => setShowDeleteConfirm(!showDeleteConfirm), [showDeleteConfirm]);
    const onConfirmDelete = useCallback(() => {
        if (updatedTemplate.rowId) {
            deleteRows({
                schemaQuery: LABEL_TEMPLATE_SQ,
                rows: [updatedTemplate],
                containerPath: updatedTemplate.container,
            })
                .then(() => {
                    onToggleDeleteConfirm();
                    onActionCompleted(undefined, true);
                })
                .catch(reason => {
                    setError(resolveErrorMessage(reason.get('error'), 'template', 'templates', 'deleting'));
                    onToggleDeleteConfirm();
                });
        } else {
            onToggleDeleteConfirm();
        }
    }, [updatedTemplate, onActionCompleted, onToggleDeleteConfirm]);

    const onFormChange = useCallback(
        (evt): void => {
            const { name, value } = evt.target;
            setUpdateTemplate(updatedTemplate.set(name, value));
            setDirty(true);
            setError(undefined); // clear error if form changes
            onChange();
        },
        [updatedTemplate, onChange]
    );

    const onSave = useCallback(async (): Promise<void> => {
        setError(undefined);
        setSaving(true);

        const templateToSave = normalizeValues(updatedTemplate);

        let rowId = templateToSave?.rowId;
        try {
            if (rowId) {
                await updateRows({
                    schemaQuery: LABEL_TEMPLATE_SQ,
                    rows: [templateToSave],
                    containerPath: templateToSave.container,
                });
            } else {
                const response = await insertRows({
                    schemaQuery: LABEL_TEMPLATE_SQ,
                    rows: List([templateToSave]),
                });

                rowId = response?.rows[0]?.rowId;
            }

            if ((isDefault && defaultLabel !== rowId) || (defaultLabel === rowId && !isDefault)) {
                const newBtConfig = await api?.labelprinting.saveDefaultLabelConfiguration({
                    defaultLabel: isDefault ? rowId : undefined,
                });

                if (defaultLabel !== newBtConfig.defaultLabel) {
                    onDefaultChanged?.(isNaN(newBtConfig.defaultLabel) ? undefined : newBtConfig.defaultLabel);
                }
            }

            setDirty(false);
            onActionCompleted(rowId);
        } catch (reason) {
            // The InsertRowsResponse object uses an Immutable map so try to pull out the error object so it can be parsed.
            const exception = reason instanceof InsertRowsResponse ? reason.get('error') : reason;
            setError(resolveErrorMessage(exception, 'template', 'templates', 'update'));
        } finally {
            setSaving(false);
        }
    }, [api?.labelprinting, defaultLabel, isDefault, onActionCompleted, onDefaultChanged, updatedTemplate]);

    return (
        <>
            {!updatedTemplate && template !== null && (
                <div className="choices-detail__empty-message">Select template to view details.</div>
            )}
            {updatedTemplate && (
                <form className="form-horizontal content-form choices-detail__form">
                    {error && <Alert>{error}</Alert>}
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="Name" required />
                        </div>
                        <div className="col-sm-8">
                            <input
                                className="form-control"
                                name="name"
                                onChange={onFormChange}
                                disabled={saving}
                                placeholder="Enter label template's display name"
                                type="text"
                                value={updatedTemplate.name ?? ''}
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
                                disabled={saving}
                                value={updatedTemplate.description ?? ''}
                            />
                        </div>
                    </FormGroup>
                    <FormGroup>
                        <div className="col-sm-4">
                            <DomainFieldLabel label="File Path" required />
                            <LabelHelpTip title="BarTender Label Template">
                                <p>
                                    Provide the label template to use with BarTender. The path should be relative to the
                                    default folder configured in the BarTender web service.
                                </p>
                            </LabelHelpTip>
                        </div>
                        <div className="col-sm-8">
                            <input
                                className="form-control"
                                name="path"
                                onChange={onFormChange}
                                disabled={saving}
                                placeholder="Enter relative path to label template"
                                type="text"
                                value={updatedTemplate.path ?? ''}
                            />
                        </div>
                    </FormGroup>
                    {isDefaultable && (
                        <FormGroup>
                            <div className="col-sm-4">
                                <DomainFieldLabel label="Set as Default" />
                            </div>
                            <div className="col-sm-8">
                                <ReactBootstrapToggle
                                    active={isDefault}
                                    on="Default"
                                    off="Selectable"
                                    onClick={defaultToggleHandler}
                                />
                            </div>
                        </FormGroup>
                    )}
                    <div>
                        {!isNew && (
                            <DisableableButton
                                disabledMsg={saving ? SAVING_LOCKED_TIP : undefined}
                                onClick={onToggleDeleteConfirm}
                                title={SAVING_LOCKED_TITLE}
                            >
                                <span className="fa fa-trash" />
                                <span>&nbsp;Delete</span>
                            </DisableableButton>
                        )}
                        {isNew && (
                            <Button bsStyle="default" disabled={saving} onClick={onCancel}>
                                Cancel
                            </Button>
                        )}
                        <Button bsStyle="success" className="pull-right" disabled={!dirty || saving} onClick={onSave}>
                            {saving ? 'Saving...' : 'Save'}
                        </Button>
                    </div>
                </form>
            )}
            {showDeleteConfirm && (
                <ConfirmModal
                    cancelButtonText="Cancel"
                    confirmButtonText="Yes, Delete"
                    title="Delete Label Template"
                    onCancel={onToggleDeleteConfirm}
                    onConfirm={onConfirmDelete}
                >
                    <div>
                        The <b>{updatedTemplate.name}</b> label template will be deleted.
                        <strong>This cannot be undone.</strong> Do you wish to proceed?
                    </div>
                </ConfirmModal>
            )}
        </>
    );
});

export const LabelsConfigurationPanel: FC<LabelTemplatesPanelProps> = memo(props => {
    const { api, setIsDirty, defaultLabel } = props;
    const { user, container, moduleContext } = useServerContext();
    const [templates, setTemplates] = useState<LabelTemplate[]>([]);
    const [error, setError] = useState<string>();
    const [selected, setSelected] = useState<number>();
    const [newDefaultLabel, setNewDefaultLabel] = useState<number>(defaultLabel);
    const addNew = useMemo(() => selected === NEW_LABEL_INDEX, [selected]);
    const showAdd = isAppHomeFolder(container, moduleContext);

    const queryLabelTemplates = useCallback(
        (newLabelTemplate?: number) => {
            setError(undefined);

            api?.labelprinting
                .ensureLabelTemplatesList(user)
                .then(labelTemplates => {
                    setTemplates(labelTemplates ?? []);
                    if (newLabelTemplate) {
                        setSelected(labelTemplates.findIndex(template => template.rowId === newLabelTemplate));
                    }
                })
                .catch(() => {
                    setError('Error: Unable to load label templates.');
                });
        },
        [api?.labelprinting, user]
    );

    // Load template list
    useEffect(() => {
        queryLabelTemplates();
    }, [queryLabelTemplates]);

    const onSetSelected = useCallback(
        (index: number) => {
            // Clear dirty state since we are clearing any changes on selection
            if (index !== selected) setIsDirty(false);
            setSelected(index);
        },
        [selected, setIsDirty]
    );

    const onAddLabel = useCallback(() => {
        setSelected(NEW_LABEL_INDEX);
    }, []);

    const onChange = useCallback(() => {
        setIsDirty(true);
    }, [setIsDirty]);

    const onDefaultChanged = useCallback((newDefault: number) => {
        setNewDefaultLabel(newDefault);
    }, []);

    const onActionCompleted = useCallback(
        (newLabelTemplate?: number, isDelete = false): void => {
            setIsDirty(false);
            queryLabelTemplates(newLabelTemplate);
            if (isDelete) setSelected(undefined);
        },
        [queryLabelTemplates, setIsDirty]
    );

    const template = !templates.length ? null : templates[selected];

    return (
        <div className="panel panel-default label-templates-container">
            <div className="list__bold-text">{TITLE}</div>
            <div>
                {error && <Alert>{error}</Alert>}
                {!templates && <LoadingSpinner />}
                {templates && !error && (
                    <div className="row choices-container">
                        <div className="col-lg-4 col-md-6 choices-container-left-panel">
                            <LabelTemplatesList
                                templates={templates}
                                selected={selected}
                                onSelect={onSetSelected}
                                defaultLabel={newDefaultLabel}
                            />
                            {showAdd && <AddEntityButton onClick={onAddLabel} entity="New Label Template" disabled={addNew} />}
                        </div>
                        <div className="col-lg-8 col-md-6">
                            <LabelTemplateDetails
                                // use null to indicate that no label templates exist to be selected, so don't show the empty message
                                template={template}
                                isNew={addNew}
                                onActionCompleted={onActionCompleted}
                                onChange={onChange}
                                defaultLabel={newDefaultLabel}
                                api={api}
                                onDefaultChanged={onDefaultChanged}
                                isDefaultable={canBeDefault(template)}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});
