/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React, { ReactNode, RefObject } from 'react';
import { List } from 'immutable';
import { Draggable } from '@hello-pangea/dnd';
import classNames from 'classnames';

import { naturalSortByProperty } from '../../../public/sort';

import { DeleteIcon } from '../base/DeleteIcon';

import { DragDropHandle } from '../base/DragDropHandle';

import { FieldExpansionToggle } from '../base/FieldExpansionToggle';

import { DomainDesignerCheckbox } from './DomainDesignerCheckbox';

import {
    DATETIME_CONVERT_URIS,
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    DOMAIN_FIELD_ADV,
    DOMAIN_FIELD_CLIENT_SIDE_ERROR,
    DOMAIN_FIELD_DELETE,
    DOMAIN_FIELD_DETAILS,
    DOMAIN_FIELD_EXPAND,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_REQUIRED,
    DOMAIN_FIELD_ROW,
    DOMAIN_FIELD_SELECTED,
    DOMAIN_FIELD_TYPE,
    FIELD_NAME_CHAR_WARNING_INFO,
    FIELD_NAME_CHAR_WARNING_MSG,
    NUMBER_CONVERT_URIS,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
    STRING_CONVERT_URIS,
} from './constants';
import {
    DomainField,
    DomainFieldError,
    DomainOnChange,
    IDomainFormDisplayOptions,
    IFieldChange,
    resolveAvailableTypes,
    SystemField,
} from './models';
import { PropDescType } from './PropDescType';
import { getCheckedValue } from './actions';
import { createFormInputId, createFormInputName } from './utils';
import {
    isFieldDeletable,
    isFieldFullyLocked,
    isFieldPartiallyLocked,
    isLegalName,
    isPrimaryKeyFieldLocked,
} from './propertiesUtil';
import { DomainRowExpandedOptions } from './DomainRowExpandedOptions';
import { AdvancedSettings } from './AdvancedSettings';
import { DomainRowWarning } from './DomainRowWarning';
import { ConfirmDataTypeChangeModal } from './ConfirmDataTypeChangeModal';
import { Collapsible } from './Collapsible';

export interface DomainRowProps {
    allowUniqueConstraintProperties: boolean;
    appPropertiesOnly?: boolean;
    availableTypes: List<PropDescType>;
    defaultDefaultValueType: string;
    defaultValueOptions: List<string>;
    domainContainerPath?: string;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    domainId?: number;
    domainIndex: number;
    dragging: boolean;
    expanded: boolean;
    field: DomainField;
    fieldDetailsInfo?: Record<string, string>;
    fieldError?: DomainFieldError;
    getDomainFields?: () => { domainFields: List<DomainField>; systemFields: SystemField[] };
    helpNoun: string;
    index: number;
    isDragDisabled?: boolean;
    maxPhiLevel: string;
    onChange: DomainOnChange;
    onDelete: (index?: number) => void;
    onExpand: (index?: number) => void;
    phiLevelEnabled: boolean;
    phiLevelDisabledReason?: string;
    queryName?: string;
    schemaName?: string;
    showDefaultValueSettings: boolean;
}

interface DomainRowState {
    dataTypeChangeToConfirm: string;
    isDragDisabled: boolean;
    showAdv: boolean;
    showingModal: boolean;
}

/**
 * React component for one property in a domain
 */
export class DomainRow extends React.PureComponent<DomainRowProps, DomainRowState> {
    static defaultProps = {
        domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    };

    ref: RefObject<HTMLDivElement>;

    constructor(props) {
        super(props);

        this.state = {
            showAdv: false,
            showingModal: false,
            dataTypeChangeToConfirm: undefined,
            isDragDisabled: props.isDragDisabled,
        };

        this.ref = React.createRef();
    }

    // Used in DomainPropertiesGrid
    scrollIntoView = (): void => {
        this.ref.current.scrollIntoView({ behavior: 'smooth' });
    };

    componentDidUpdate(prevProps: DomainRowProps): void {
        // if there was a prop change to isDragDisabled, need to call setDragDisabled
        if (prevProps.isDragDisabled !== this.props.isDragDisabled) {
            this.setDragDisabled(this.props.isDragDisabled, false);
        }
    }

    getDetails = (): ReactNode => {
        const { field, fieldDetailsInfo, fieldError, index, expanded, domainIndex } = this.props;
        const details = field.getDetailsArray(fieldDetailsInfo);

        if (fieldError) {
            details.push(details.length > 0 ? '. ' : '');
            details.push(<DomainRowWarning key="domain-row-field-error" fieldError={fieldError} />);
        }

        return (
            <div
                id={createFormInputId(DOMAIN_FIELD_DETAILS, domainIndex, index)}
                className={expanded ? 'domain-field-details-expanded' : 'domain-field-details'}
            >
                {details}
            </div>
        );
    };

    getFieldBorderClass = (fieldError: DomainFieldError, selected: boolean): string => {
        if (!fieldError) {
            return selected ? 'domain-row-border-selected' : 'domain-row-border-default';
        } else if (fieldError.severity === SEVERITY_LEVEL_ERROR) {
            return 'domain-row-border-error';
        } else {
            return 'domain-row-border-warning';
        }
    };

    getRowCssClasses = (
        expanded: boolean,
        dragging: boolean,
        selected: boolean,
        fieldError: DomainFieldError
    ): string => {
        const classes = [];
        classes.push('domain-field-row');

        if (selected) {
            classes.push('selected');
        }

        if (!dragging) {
            classes.push(this.getFieldBorderClass(fieldError, selected));
        } else {
            classes.push('domain-row-border-dragging');
        }

        if (expanded) {
            classes.push('domain-row-expanded');
        }

        return classes.join(' ');
    };

    onFieldChange = (evt: any, expand?: boolean): void => {
        const { index } = this.props;

        let value = getCheckedValue(evt);
        if (value === undefined) {
            value = evt.target.value;
        }

        this.onSingleFieldChange(evt.target.id, value, index, expand);
    };

    onSingleFieldChange = (
        id: string,
        value: any,
        index?: number,
        expand?: boolean,
        skipDirtyCheck?: boolean
    ): void => {
        const changes = List([{ id, value } as IFieldChange]);
        this.props.onChange(changes, index, expand === true, skipDirtyCheck);
    };

    onMultiFieldChange = (changes: List<IFieldChange>): void => {
        this.props.onChange(changes, this.props.index, true);
    };

    onNameChange = (evt: any): void => {
        const { index, domainIndex } = this.props;

        const value = evt.target.value;
        let nameAndErrorList = List<IFieldChange>();

        // set value for the field
        nameAndErrorList = nameAndErrorList.push({
            id: createFormInputId(DOMAIN_FIELD_NAME, domainIndex, index),
            value,
        });

        // TODO: Why don't we make isLegalName return false if there is a space?
        if (isLegalName(value) && !value.includes(' ')) {
            // set value to undefined for field error
            nameAndErrorList = nameAndErrorList.push({
                id: createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, domainIndex, index),
                value: undefined,
            });
        } else {
            const domainFieldError = new DomainFieldError({
                message: FIELD_NAME_CHAR_WARNING_MSG,
                extraInfo: FIELD_NAME_CHAR_WARNING_INFO,
                fieldName: value,
                propertyId: undefined,
                severity: SEVERITY_LEVEL_WARN,
                rowIndexes: List<number>([index]),
            });

            // set value for field error
            nameAndErrorList = nameAndErrorList.push({
                id: createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, domainIndex, index),
                value: domainFieldError,
            });
        }

        this.props.onChange(nameAndErrorList, index, false);
    };

    onDataTypeChange = (evt: any): void => {
        const { field } = this.props;
        const { value } = evt.target;

        // warn for a saved field changing from any non-string -> string OR int/long -> double/float/decimal
        if (field.isSaved()) {
            const typeConvertingTo = PropDescType.fromName(value);
            if (shouldShowConfirmDataTypeChange(field.original.rangeURI, typeConvertingTo.rangeURI)) {
                this.onShowConfirmTypeChange(value);
                return;
            }
        }

        this.onFieldChange(
            evt,
            PropDescType.isLookup(value) ||
                PropDescType.isTextChoice(value) ||
                PropDescType.isUser(value) ||
                PropDescType.isCalculation(value)
        );
    };

    onShowConfirmTypeChange = (dataTypeChangeToConfirm: string): void => {
        this.setState({ dataTypeChangeToConfirm });
        this.setDragDisabled(this.props.isDragDisabled, true);
    };

    onConfirmTypeChange = (): void => {
        const { domainIndex, index } = this.props;
        const { dataTypeChangeToConfirm } = this.state;
        const evt = {
            target: {
                id: createFormInputId(DOMAIN_FIELD_TYPE, domainIndex, index),
                value: dataTypeChangeToConfirm,
            },
        };
        this.onFieldChange(
            evt,
            PropDescType.isLookup(dataTypeChangeToConfirm) || PropDescType.isTextChoice(dataTypeChangeToConfirm)
        );
        this.onHideConfirmTypeChange();
    };

    onHideConfirmTypeChange = (): void => {
        this.setState({ dataTypeChangeToConfirm: undefined });
        this.setDragDisabled(this.props.isDragDisabled, false);
    };

    onShowAdvanced = (): void => {
        this.setState({ showAdv: true });
        this.setDragDisabled(this.props.isDragDisabled, true);
    };

    onHideAdvanced = (): void => {
        this.setState({ showAdv: false });
        this.setDragDisabled(this.props.isDragDisabled, false);
    };

    onDelete = (): void => {
        this.props.onDelete(this.props.index);
    };

    onExpand = (): void => {
        this.props.onExpand(this.props.index);
    };

    setDragDisabled = (propDragDisabled: boolean, disabled: boolean): void => {
        this.setState({ isDragDisabled: disabled || propDragDisabled });
    };

    showingModal = (showingModal: boolean): void => {
        this.setState({ showingModal });
    };

    disableNameInput = (field: DomainField): boolean => {
        const lockNameForPK = !field.isNew() && isPrimaryKeyFieldLocked(field.lockType);

        return (
            isFieldPartiallyLocked(field.lockType) ||
            isFieldFullyLocked(field.lockType) ||
            lockNameForPK ||
            field.lockExistingField // existingField defaults to false. used for query metadata editor
        );
    };

    disableTypeInput = (field: DomainField): boolean => {
        return (
            (!field.isNew() && (field.isPrimaryKey || field.isCalculatedField())) ||
            isFieldPartiallyLocked(field.lockType) ||
            isFieldFullyLocked(field.lockType) ||
            isPrimaryKeyFieldLocked(field.lockType)
        );
    };

    render() {
        const { isDragDisabled, showAdv, showingModal, dataTypeChangeToConfirm } = this.state;
        const {
            availableTypes,
            index,
            field,
            expanded,
            fieldError,
            maxPhiLevel,
            dragging,
            domainId,
            domainIndex,
            helpNoun,
            showDefaultValueSettings,
            allowUniqueConstraintProperties,
            defaultDefaultValueType,
            defaultValueOptions,
            appPropertiesOnly,
            domainFormDisplayOptions,
            getDomainFields,
            domainContainerPath,
            schemaName,
            queryName,
            phiLevelEnabled,
            phiLevelDisabledReason,
        } = this.props;
        const { selected } = field;
        const draggableId = createFormInputId('domaindrag', domainIndex, index);
        // Use undefined instead of false to allow for css to handle the highlight color for hover
        const highlighted = dragging ? true : isDragDisabled ? false : undefined;

        return (
            <Draggable
                draggableId={draggableId}
                index={index}
                isDragDisabled={showingModal || isDragDisabled}
                key={draggableId}
            >
                {provided => (
                    <div
                        className={this.getRowCssClasses(expanded, dragging, selected, fieldError)}
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        tabIndex={index}
                    >
                        <div
                            key={createFormInputId('domainrow', domainIndex, index)}
                            className="row domain-row-container"
                        >
                            {showAdv && (
                                <AdvancedSettings
                                    domainIndex={domainIndex}
                                    domainId={domainId}
                                    helpNoun={helpNoun}
                                    index={index}
                                    maxPhiLevel={maxPhiLevel}
                                    field={field}
                                    onApply={this.onMultiFieldChange}
                                    onHide={this.onHideAdvanced}
                                    label={field.name}
                                    showDefaultValueSettings={showDefaultValueSettings}
                                    allowUniqueConstraintProperties={allowUniqueConstraintProperties}
                                    defaultDefaultValueType={defaultDefaultValueType}
                                    defaultValueOptions={defaultValueOptions}
                                    domainFormDisplayOptions={domainFormDisplayOptions}
                                    phiLevelEnabled={phiLevelEnabled}
                                    phiLevelDisabledReason={phiLevelDisabledReason}
                                />
                            )}
                            <div
                                className={classNames('domain-row-handle', { disabled: isDragDisabled })}
                                {...provided.dragHandleProps}
                            >
                                <DragDropHandle
                                    highlighted={highlighted}
                                    tooltip={
                                        field.isCalculatedField()
                                            ? 'Field reordering is disabled for calculated fields.'
                                            : undefined
                                    }
                                />
                            </div>
                            <div className="domain-row-action-section">
                                <DomainDesignerCheckbox
                                    className="domain-field-check-icon"
                                    name={createFormInputName(DOMAIN_FIELD_SELECTED)}
                                    id={createFormInputId(DOMAIN_FIELD_SELECTED, domainIndex, index)}
                                    checked={selected}
                                    onChange={this.onFieldChange}
                                    disabled={false}
                                />
                                <FieldExpansionToggle
                                    cls="domain-field-expand-icon"
                                    expanded={expanded}
                                    expandedTitle="Hide additional field properties"
                                    collapsedTitle="Show additional field properties"
                                    id={createFormInputId(DOMAIN_FIELD_EXPAND, domainIndex, index)}
                                    onClick={this.onExpand}
                                />
                            </div>
                            <div className="domain-row-main">
                                <div className="col-xs-6 domain-row-base-fields domain-row-base-fields-position">
                                    <div id={createFormInputId(DOMAIN_FIELD_ROW, domainIndex, index)} ref={this.ref}>
                                        <div className="col-xs-6">
                                            <input
                                                className="form-control"
                                                type="text"
                                                value={field.name || ''}
                                                name={createFormInputName(DOMAIN_FIELD_NAME)}
                                                id={createFormInputId(DOMAIN_FIELD_NAME, domainIndex, index)}
                                                onChange={this.onNameChange}
                                                disabled={this.disableNameInput(field)}
                                            />
                                        </div>
                                        <div className="col-xs-4">
                                            <select
                                                className="form-control"
                                                name={createFormInputName(DOMAIN_FIELD_TYPE)}
                                                disabled={this.disableTypeInput(field)}
                                                id={createFormInputId(DOMAIN_FIELD_TYPE, domainIndex, index)}
                                                onChange={this.onDataTypeChange}
                                                value={field.dataType.name}
                                            >
                                                {isPrimaryKeyFieldLocked(field.lockType) ? (
                                                    <option value={field.dataType.name}>
                                                        {field.dataType.display}
                                                    </option>
                                                ) : (
                                                    resolveAvailableTypes(
                                                        field,
                                                        availableTypes,
                                                        appPropertiesOnly,
                                                        !domainFormDisplayOptions.hideStudyPropertyTypes,
                                                        !domainFormDisplayOptions.hideFilePropertyType
                                                    )
                                                        .sort(naturalSortByProperty('display'))
                                                        .map(type => (
                                                            <option key={type.name} value={type.name}>
                                                                {type.display}
                                                            </option>
                                                        ))
                                                        .toArray()
                                                )}
                                            </select>
                                        </div>
                                        <div className="col-xs-2">
                                            <div className="domain-field-checkbox-container">
                                                {!domainFormDisplayOptions.hideRequired &&
                                                    !field.isCalculatedField() && (
                                                        <DomainDesignerCheckbox
                                                            className="domain-field-checkbox"
                                                            name={createFormInputName(DOMAIN_FIELD_REQUIRED)}
                                                            id={createFormInputId(
                                                                DOMAIN_FIELD_REQUIRED,
                                                                domainIndex,
                                                                index
                                                            )}
                                                            checked={field.required}
                                                            onChange={this.onFieldChange}
                                                            disabled={
                                                                isFieldFullyLocked(field.lockType) ||
                                                                isPrimaryKeyFieldLocked(field.lockType)
                                                            }
                                                        />
                                                    )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-xs-6 domain-row-details-container">
                                    {this.getDetails()}
                                    <div
                                        className={expanded ? 'domain-field-buttons-expanded' : 'domain-field-buttons'}
                                    >
                                        {expanded && !isFieldFullyLocked(field.lockType) && !appPropertiesOnly && (
                                            <button
                                                className="domain-row-button btn btn-default"
                                                disabled={isFieldFullyLocked(field.lockType)}
                                                id={createFormInputId(DOMAIN_FIELD_ADV, domainIndex, index)}
                                                name={createFormInputName(DOMAIN_FIELD_ADV)}
                                                onClick={this.onShowAdvanced}
                                                type="button"
                                            >
                                                Advanced Settings
                                            </button>
                                        )}
                                        {isFieldDeletable(field) && (
                                            <DeleteIcon
                                                id={createFormInputId(DOMAIN_FIELD_DELETE, domainIndex, index)}
                                                title="Remove field"
                                                iconCls="domain-field-delete-icon"
                                                onDelete={this.onDelete}
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Collapsible expanded={expanded}>
                            <div>
                                <DomainRowExpandedOptions
                                    field={field}
                                    index={index}
                                    domainIndex={domainIndex}
                                    getDomainFields={getDomainFields}
                                    onMultiChange={this.onMultiFieldChange}
                                    onChange={this.onSingleFieldChange}
                                    showingModal={this.showingModal}
                                    appPropertiesOnly={appPropertiesOnly}
                                    domainFormDisplayOptions={domainFormDisplayOptions}
                                    domainContainerPath={domainContainerPath}
                                    schemaName={schemaName}
                                    queryName={queryName}
                                />
                            </div>
                        </Collapsible>
                        {dataTypeChangeToConfirm && (
                            <ConfirmDataTypeChangeModal
                                originalRangeURI={field.original.rangeURI}
                                newDataType={PropDescType.fromName(dataTypeChangeToConfirm)}
                                onConfirm={this.onConfirmTypeChange}
                                onCancel={this.onHideConfirmTypeChange}
                            />
                        )}
                    </div>
                )}
            </Draggable>
        );
    }
}

const shouldShowConfirmDataTypeChange = (originalRangeURI: string, newRangeURI: string): boolean => {
    if (newRangeURI && originalRangeURI !== newRangeURI) {
        const wasString = STRING_CONVERT_URIS.indexOf(originalRangeURI) > -1;
        const toString = STRING_CONVERT_URIS.indexOf(newRangeURI) > -1;
        const toNumber = NUMBER_CONVERT_URIS.indexOf(newRangeURI) > -1;
        const toDate = DATETIME_CONVERT_URIS.indexOf(newRangeURI) > -1;
        return toNumber || (toString && !wasString) || toDate;
    }
    return false;
};
