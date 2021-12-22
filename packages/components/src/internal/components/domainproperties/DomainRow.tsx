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
import React from 'react';
import { Button, Checkbox, Col, Collapse, FormControl, Row } from 'react-bootstrap';
import { List } from 'immutable';
import { Draggable } from 'react-beautiful-dnd';
import classNames from 'classnames';

import { DeleteIcon, DragDropHandle, FieldExpansionToggle, naturalSortByProperty } from '../../..';

import {
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
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
} from './constants';
import {
    DomainField,
    DomainFieldError,
    DomainOnChange,
    IDomainFormDisplayOptions,
    IFieldChange,
    resolveAvailableTypes,
} from './models';
import { PropDescType } from './PropDescType';
import { createFormInputId, createFormInputName, getCheckedValue } from './actions';
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

export interface DomainRowProps {
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
    expandTransition: number;
    field: DomainField;
    fieldDetailsInfo?: Record<string, string>;
    fieldError?: DomainFieldError;
    getDomainFields?: () => List<DomainField>;
    helpNoun: string;
    index: number;
    isDragDisabled?: boolean;
    maxPhiLevel: string;
    onChange: DomainOnChange;
    onDelete: (index?: number) => void;
    onExpand: (index?: number) => void;
    queryName?: string;
    schemaName?: string;
    showDefaultValueSettings: boolean;
    successBsStyle?: string;
}

interface DomainRowState {
    closing: boolean;
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

    constructor(props) {
        super(props);

        this.state = {
            showAdv: false,
            closing: false,
            showingModal: false,
            isDragDisabled: props.isDragDisabled,
        };

        this[`${props.index}_ref`] = React.createRef();
    }

    // Used in DomainPropertiesGrid
    scrollIntoView = (): void => {
        this[`${this.props.index}_ref`].current.scrollIntoView({ behavior: 'smooth' });
    };

    UNSAFE_componentWillReceiveProps(nextProps: DomainRowProps): void {
        // if there was a prop change to isDragDisabled, need to call setDragDisabled
        if (nextProps.isDragDisabled !== this.props.isDragDisabled) {
            this.setDragDisabled(nextProps.isDragDisabled, false);
        }
    }

    /**
     *  Details section of property row
     */
    getDetailsText = (): React.ReactNode => {
        const { field, index, fieldError, fieldDetailsInfo } = this.props;
        const details = field.getDetailsTextArray(index, fieldDetailsInfo);

        if (fieldError) {
            details.push(details.length > 0 ? '. ' : '');
            const msg = fieldError.severity + ': ' + fieldError.message;
            details.push(
                <DomainRowWarning
                    index={index}
                    extraInfo={fieldError.extraInfo}
                    msg={msg}
                    name={field.name}
                    severity={fieldError.severity}
                />
            );
        }

        return details;
    };

    getDetails() {
        const { index, expanded, domainIndex } = this.props;
        const { closing } = this.state;

        return (
            <div
                id={createFormInputId(DOMAIN_FIELD_DETAILS, domainIndex, index)}
                className={expanded || closing ? 'domain-field-details-expanded' : 'domain-field-details'}
            >
                {this.getDetailsText()}
            </div>
        );
    }

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
        closing: boolean,
        dragging: boolean,
        selected: boolean,
        fieldError: DomainFieldError
    ): string => {
        const classes = List<string>().asMutable();
        classes.push('domain-field-row');

        if (selected) {
            classes.push('selected');
        }

        if (!dragging) {
            classes.push(this.getFieldBorderClass(fieldError, selected));
        } else {
            classes.push('domain-row-border-dragging');
        }

        if (closing || expanded) {
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

    onSingleFieldChange = (id: string, value: any, index?: number, expand?: boolean): void => {
        const changes = List([{ id, value } as IFieldChange]);
        this.props.onChange(changes, index, expand === true);
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

        if (isLegalName(value) && !value.includes(' ')) {
            // set value to undefined for field error
            nameAndErrorList = nameAndErrorList.push({
                id: createFormInputId(DOMAIN_FIELD_CLIENT_SIDE_ERROR, domainIndex, index),
                value: undefined,
            });
        } else {
            const fieldName = value;
            const severity = SEVERITY_LEVEL_WARN;
            const indexes = List<number>([index]);
            const domainFieldError = new DomainFieldError({
                message: FIELD_NAME_CHAR_WARNING_MSG,
                extraInfo: FIELD_NAME_CHAR_WARNING_INFO,
                fieldName,
                propertyId: undefined,
                severity,
                rowIndexes: indexes,
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
        this.onFieldChange(evt, PropDescType.isLookup(evt.target.value) || PropDescType.isTextChoice(evt.target.value));
    };

    onShowAdvanced = (): any => {
        this.setState({ showAdv: true });
        this.setDragDisabled(this.props.isDragDisabled, true);
    };

    onHideAdvanced = (): any => {
        this.setState({ showAdv: false });
        this.setDragDisabled(this.props.isDragDisabled, false);
    };

    onDelete = (): void => {
        this.props.onDelete(this.props.index);
    };

    onExpand = (): void => {
        this.props.onExpand(this.props.index);
    };

    onCollapsed = (): void => {
        this.setState({ closing: false });
    };

    onCollapsing = (): void => {
        this.setState({ closing: true });
    };

    setDragDisabled = (propDragDisabled: boolean, disabled: boolean): void => {
        this.setState({ isDragDisabled: disabled || propDragDisabled });
    };

    showingModal = (showingModal: boolean): void => {
        this.setState({ showingModal });
    };

    disableNameInput(field: DomainField): boolean {
        const lockNameForPK = !field.isNew() && isPrimaryKeyFieldLocked(field.lockType);

        return (
            isFieldPartiallyLocked(field.lockType) ||
            isFieldFullyLocked(field.lockType) ||
            lockNameForPK ||
            field.lockExistingField // existingField defaults to false. used for query metadata editor
        );
    }

    renderBaseFields() {
        const { index, field, availableTypes, appPropertiesOnly, domainIndex, domainFormDisplayOptions } = this.props;

        return (
            <div id={createFormInputId(DOMAIN_FIELD_ROW, domainIndex, index)} ref={this[`${this.props.index}_ref`]}>
                <Col xs={6}>
                    <FormControl
                        // autoFocus={field.isNew()}  // TODO: This is not working great with drag and drop, need to investigate
                        type="text"
                        value={field.name || ''}
                        name={createFormInputName(DOMAIN_FIELD_NAME)}
                        id={createFormInputId(DOMAIN_FIELD_NAME, domainIndex, index)}
                        onChange={this.onNameChange}
                        disabled={this.disableNameInput(field)}
                    />
                </Col>
                <Col xs={4}>
                    <FormControl
                        componentClass="select"
                        name={createFormInputName(DOMAIN_FIELD_TYPE)}
                        disabled={
                            (!field.isNew() && field.isPrimaryKey) ||
                            isFieldPartiallyLocked(field.lockType) ||
                            isFieldFullyLocked(field.lockType) ||
                            isPrimaryKeyFieldLocked(field.lockType)
                        }
                        id={createFormInputId(DOMAIN_FIELD_TYPE, domainIndex, index)}
                        onChange={this.onDataTypeChange}
                        value={field.dataType.name}
                    >
                        {isPrimaryKeyFieldLocked(field.lockType) ? (
                            <option value={field.dataType.name}>{field.dataType.display}</option>
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
                        )}
                    </FormControl>
                </Col>
                <Col xs={2}>
                    <div className="domain-field-checkbox-container">
                        {!domainFormDisplayOptions.hideRequired && (
                            <Checkbox
                                className="domain-field-checkbox"
                                name={createFormInputName(DOMAIN_FIELD_REQUIRED)}
                                id={createFormInputId(DOMAIN_FIELD_REQUIRED, domainIndex, index)}
                                checked={field.required}
                                onChange={this.onFieldChange}
                                disabled={isFieldFullyLocked(field.lockType) || isPrimaryKeyFieldLocked(field.lockType)}
                            />
                        )}
                    </div>
                </Col>
            </div>
        );
    }

    renderButtons() {
        const { expanded, index, field, appPropertiesOnly, domainIndex } = this.props;
        const { closing } = this.state;

        return (
            <div className={expanded ? 'domain-field-buttons-expanded' : 'domain-field-buttons'}>
                {(expanded || closing) && !isFieldFullyLocked(field.lockType) && !appPropertiesOnly && (
                    <Button
                        disabled={isFieldFullyLocked(field.lockType)}
                        name={createFormInputName(DOMAIN_FIELD_ADV)}
                        id={createFormInputId(DOMAIN_FIELD_ADV, domainIndex, index)}
                        onClick={this.onShowAdvanced}
                        className="domain-row-button"
                    >
                        Advanced Settings
                    </Button>
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
        );
    }

    render() {
        const { closing, isDragDisabled, showAdv, showingModal } = this.state;
        const {
            index,
            field,
            expanded,
            expandTransition,
            fieldError,
            maxPhiLevel,
            dragging,
            domainId,
            domainIndex,
            helpNoun,
            showDefaultValueSettings,
            defaultDefaultValueType,
            defaultValueOptions,
            appPropertiesOnly,
            successBsStyle,
            domainFormDisplayOptions,
            getDomainFields,
            domainContainerPath,
            schemaName,
            queryName,
        } = this.props;
        const selected = field.selected;

        return (
            <Draggable
                draggableId={createFormInputId('domaindrag', domainIndex, index)}
                index={index}
                isDragDisabled={showingModal || isDragDisabled}
            >
                {provided => (
                    <div
                        className={this.getRowCssClasses(expanded, closing, dragging, selected, fieldError)}
                        {...provided.draggableProps}
                        ref={provided.innerRef}
                        tabIndex={index}
                    >
                        <Row key={createFormInputId('domainrow', domainIndex, index)} className="domain-row-container">
                            <AdvancedSettings
                                domainIndex={domainIndex}
                                domainId={domainId}
                                helpNoun={helpNoun}
                                index={index}
                                maxPhiLevel={maxPhiLevel}
                                field={field}
                                onApply={this.onMultiFieldChange}
                                show={showAdv}
                                onHide={this.onHideAdvanced}
                                label={field.name}
                                showDefaultValueSettings={showDefaultValueSettings}
                                defaultDefaultValueType={defaultDefaultValueType}
                                defaultValueOptions={defaultValueOptions}
                                successBsStyle={successBsStyle}
                                domainFormDisplayOptions={domainFormDisplayOptions}
                            />
                            <div
                                className={classNames('domain-row-handle', { disabled: isDragDisabled })}
                                {...provided.dragHandleProps}
                            >
                                <DragDropHandle
                                    highlighted={
                                        dragging
                                            ? true
                                            : isDragDisabled
                                            ? false
                                            : undefined /* use undefined instead of false to allow for css to handle the highlight color for hover*/
                                    }
                                />
                            </div>
                            <div className="domain-row-action-section">
                                <Checkbox
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
                                <Col xs={6} className="domain-row-base-fields domain-row-base-fields-position">
                                    {this.renderBaseFields()}
                                </Col>
                                <Col xs={6} className="domain-row-details-container">
                                    {this.getDetails()}
                                    {this.renderButtons()}
                                </Col>
                            </div>
                        </Row>
                        <Collapse
                            in={expanded}
                            timeout={expandTransition}
                            onExited={this.onCollapsed}
                            onExiting={this.onCollapsing}
                        >
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
                                    successBsStyle={successBsStyle}
                                    domainFormDisplayOptions={domainFormDisplayOptions}
                                    domainContainerPath={domainContainerPath}
                                    schemaName={schemaName}
                                    queryName={queryName}
                                />
                            </div>
                        </Collapse>
                    </div>
                )}
            </Draggable>
        );
    }
}
