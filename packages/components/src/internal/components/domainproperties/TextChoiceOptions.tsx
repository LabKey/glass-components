import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import classNames from 'classnames';
import { Query, Utils } from '@labkey/api';

import { Alert } from '../base/Alert';
import { ChoicesListItem } from '../base/ChoicesListItem';
import { AddEntityButton } from '../buttons/AddEntityButton';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { LockIcon } from '../base/LockIcon';
import { DisableableButton } from '../buttons/DisableableButton';

import { DisableableInput } from '../forms/DisableableInput';

import { DOMAIN_VALIDATOR_TEXTCHOICE, MAX_VALID_TEXT_CHOICES } from './constants';
import {
    DEFAULT_TEXT_CHOICE_VALIDATOR,
    DomainField,
    isValidTextChoiceValue,
    ITypeDependentProps,
    PropertyValidator,
} from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

import { TextChoiceAddValuesModal } from './TextChoiceAddValuesModal';
import { createFormInputId } from './actions';

const HELP_TIP_BODY = <p>The set of values to be used as drop-down options to restrict data entry into this field.</p>;

const IN_USE_TITLE = 'Text Choice In Use';
const IN_USE_TIP = 'This text choice value cannot be deleted because it is in use.';
const VALUE_IN_USE = (
    <LockIcon
        iconCls="pull-right choices-list__locked"
        body={IN_USE_TIP}
        id="text-choice-value-lock-icon"
        title={IN_USE_TITLE}
        unlocked
    />
);

const LOCKED_TITLE = 'Text Choice In Use and Locked';
const LOCKED_TIP =
    'This text choice value cannot be deleted because it is in use and cannot be edited because one or more usages are for read-only items.';
const VALUE_LOCKED = (
    <LockIcon
        iconCls="pull-right choices-list__locked"
        body={LOCKED_TIP}
        id="text-choice-value-lock-icon"
        title={LOCKED_TITLE}
    />
);

interface Props extends ITypeDependentProps {
    field: DomainField;
    queryName?: string;
    schemaName?: string;
    lockedForDomain?: boolean;
    lockedSqlFragment?: string;
}

interface ImplProps extends Props {
    // mapping existing field values (existence in this object signals "in use") to locked status (only applicable
    // to some domain types) and row count for the given value
    fieldValues: Record<string, Record<string, any>>;
    loading: boolean;
    replaceValues: (newValues: string[], valueUpdates?: Record<string, string>) => void;
    validValues: string[];
    maxValueCount?: number;
}

// exported for jest testing
export const TextChoiceOptionsImpl: FC<ImplProps> = memo(props => {
    const {
        label,
        field,
        loading,
        fieldValues,
        validValues,
        replaceValues,
        maxValueCount = MAX_VALID_TEXT_CHOICES,
        lockedForDomain,
    } = props;
    const [selectedIndex, setSelectedIndex] = useState<number>();
    const [currentValue, setCurrentValue] = useState<string>();
    const [currentError, setCurrentError] = useState<string>();
    const [showAddValuesModal, setShowAddValuesModal] = useState<boolean>();

    // keep a map from the updated values for the in-use field values to their original values
    const [fieldValueUpdates, setFieldValueUpdates] = useState<Record<string, string>>({});
    useEffect(() => {
        setFieldValueUpdates(
            Object.keys(fieldValues).reduce((prev, current) => {
                prev[current] = current;
                return prev;
            }, {})
        );
    }, [fieldValues]);

    const selectedValue = useMemo(() => validValues[selectedIndex], [validValues, selectedIndex]);
    const currentInUse = fieldValueUpdates.hasOwnProperty(selectedValue);
    const currentLocked =
        currentInUse && (lockedForDomain || (fieldValues[fieldValueUpdates[selectedValue]]?.locked ?? false));

    const isValueDuplicate = useCallback(
        (val: string): boolean => {
            return validValues.indexOf(val) !== -1;
        },
        [validValues]
    );

    const onSelect = useCallback(
        ind => {
            setSelectedIndex(ind);
            setCurrentValue(validValues?.[ind]);
            setCurrentError(undefined);
        },
        [validValues]
    );

    const onValueChange = useCallback(
        evt => {
            const updatedVal = evt.target.value;
            setCurrentValue(updatedVal);
            setCurrentError(
                updatedVal.trim() !== selectedValue && isValueDuplicate(updatedVal.trim())
                    ? `"${updatedVal.trim()}" already exists in the list of values.`
                    : undefined
            );
        },
        [validValues, selectedIndex]
    );

    const updateValue = useCallback(
        (updatedValue?: string) => {
            const newValues = [...validValues];
            const newFieldValueUpdates = { ...fieldValueUpdates };

            if (updatedValue !== undefined) {
                newValues.splice(selectedIndex, 1, updatedValue);

                // if one of the "in use" field values was updated, we need to update the fieldValueUpdates mapping object
                if (fieldValueUpdates[selectedValue]) {
                    newFieldValueUpdates[updatedValue] = fieldValueUpdates[selectedValue];
                    delete newFieldValueUpdates[selectedValue];
                    setFieldValueUpdates(newFieldValueUpdates);
                }
            } else {
                newValues.splice(selectedIndex, 1);
                onSelect(undefined); // clear selected index and value
            }

            replaceValues(newValues, newFieldValueUpdates);
        },
        [validValues, selectedValue, replaceValues, selectedIndex, onSelect, fieldValueUpdates]
    );

    const onApply = useCallback(() => {
        const val = currentValue.trim();
        if (!isValueDuplicate(val)) {
            updateValue(val);
            setCurrentValue(val);
            setCurrentError(undefined);
        }
    }, [updateValue, currentValue]);

    const onDelete = useCallback(() => {
        updateValue(); // calling without updatedValue will remove instead of replace
    }, [updateValue]);

    const toggleAddValues = useCallback(() => {
        setShowAddValuesModal(!showAddValuesModal);
    }, [showAddValuesModal]);

    const onApplyAddValues = useCallback(
        (values: string[]) => {
            // filter out any duplicates from the already included values
            const filteredVals = values.filter(v => !isValueDuplicate(v));
            replaceValues(validValues.concat(filteredVals), fieldValueUpdates);
            toggleAddValues();
        },
        [replaceValues, validValues, toggleAddValues, fieldValueUpdates]
    );

    return (
        <div>
            <Row>
                <Col xs={12}>
                    <SectionHeading title={label} />
                </Col>
            </Row>
            <Row>
                <Col xs={12}>
                    <div className="domain-field-label">
                        <DomainFieldLabel label="Drop-down Values" helpTipBody={HELP_TIP_BODY} />
                    </div>
                </Col>
            </Row>
            {loading && (
                <Row>
                    <Col xs={12}>
                        <LoadingSpinner />
                    </Col>
                </Row>
            )}
            {!loading && (
                <Row>
                    <Col
                        xs={6}
                        lg={4}
                        className={classNames({ 'domain-text-choices-left-panel': validValues.length > 0 })}
                    >
                        <div className="list-group domain-text-choices-list">
                            {validValues.map((value, ind) => {
                                const inUse = fieldValueUpdates.hasOwnProperty(value);
                                const locked =
                                    inUse &&
                                    (lockedForDomain || (fieldValues[fieldValueUpdates[value]]?.locked ?? false));

                                return (
                                    <ChoicesListItem
                                        active={ind === selectedIndex}
                                        index={ind}
                                        key={ind}
                                        label={value}
                                        subLabel={value === '' ? 'Empty Value' : undefined}
                                        onSelect={onSelect}
                                        componentRight={locked ? VALUE_LOCKED : inUse ? VALUE_IN_USE : null}
                                    />
                                );
                            })}
                        </div>
                        <AddEntityButton
                            disabled={validValues.length >= maxValueCount}
                            entity="Values"
                            onClick={toggleAddValues}
                            title={`Add Values (max ${maxValueCount})`}
                        />
                    </Col>
                    <Col xs={6} lg={4}>
                        {validValues.length > 0 && selectedIndex === undefined && (
                            <p className="choices-detail__empty-message">
                                Select a value from the list on the left to view details.
                            </p>
                        )}
                        {selectedIndex !== undefined && (
                            <>
                                <div className="domain-field-label">
                                    <DomainFieldLabel label="Value" />
                                </div>
                                <div className="domain-field-padding-bottom">
                                    <DisableableInput
                                        className="form-control full-width"
                                        disabledMsg={currentLocked ? LOCKED_TIP : undefined}
                                        name="value"
                                        onChange={onValueChange}
                                        placeholder="Enter a text choice value"
                                        title={LOCKED_TITLE}
                                        value={currentValue ?? ''}
                                    />
                                </div>
                                <div className="domain-field-padding-bottom">
                                    <DisableableButton
                                        bsStyle="default"
                                        disabledMsg={currentLocked ? LOCKED_TIP : currentInUse ? IN_USE_TIP : undefined}
                                        onClick={onDelete}
                                        title={currentLocked ? LOCKED_TITLE : IN_USE_TITLE}
                                    >
                                        <span className="fa fa-trash" />
                                        <span>&nbsp;Delete</span>
                                    </DisableableButton>
                                    <Button
                                        bsStyle="success"
                                        className="pull-right"
                                        disabled={
                                            currentError !== undefined ||
                                            currentValue === selectedValue ||
                                            currentValue === ''
                                        }
                                        onClick={onApply}
                                    >
                                        Apply
                                    </Button>
                                </div>
                                {fieldValueUpdates[selectedValue] !== undefined &&
                                    selectedValue !== fieldValueUpdates[selectedValue] && (
                                        <Alert bsStyle="info">
                                            {Utils.pluralize(
                                                fieldValues[fieldValueUpdates[selectedValue]].count,
                                                'row',
                                                'rows'
                                            )}{' '}
                                            with value <b>{fieldValueUpdates[selectedValue]}</b> will be updated to{' '}
                                            <b>{selectedValue}</b> on save.
                                        </Alert>
                                    )}
                                {currentError && <Alert bsStyle="danger">{currentError}</Alert>}
                            </>
                        )}
                    </Col>
                </Row>
            )}
            {showAddValuesModal && (
                <TextChoiceAddValuesModal
                    fieldName={field.name}
                    onCancel={toggleAddValues}
                    onApply={onApplyAddValues}
                    initialValueCount={validValues.length}
                />
            )}
        </div>
    );
});

export const TextChoiceOptions: FC<Props> = memo(props => {
    const { field, onChange, domainIndex, index, schemaName, queryName, lockedSqlFragment = 'FALSE' } = props;
    const [loading, setLoading] = useState<boolean>(true);
    const [fieldValues, setFieldValues] = useState<Record<string, Record<string, any>>>({});
    const [validValues, setValidValues] = useState<string[]>(field.textChoiceValidator?.properties.validValues ?? []);
    const fieldId = createFormInputId(DOMAIN_VALIDATOR_TEXTCHOICE, domainIndex, index);

    const replaceValues = useCallback(
        (newValues: string[], newValueUpdates?: Record<string, string>) => {
            setValidValues(newValues);

            const valueUpdates = Object.keys(newValueUpdates ?? {}).reduce((prev, curr) => {
                if (curr !== newValueUpdates[curr]) {
                    prev[newValueUpdates[curr]] = curr;
                }
                return prev;
            }, {});

            onChange(
                fieldId,
                new PropertyValidator({
                    // keep the existing validator Id/props, if present, and override the expression / properties
                    ...field.textChoiceValidator,
                    ...DEFAULT_TEXT_CHOICE_VALIDATOR.toJS(),
                    shouldShowWarning: true,
                    expression: newValues.join('|'),
                    properties: { validValues: newValues },
                    extraProperties: { valueUpdates },
                })
            );
        },
        [field.textChoiceValidator, fieldId, onChange]
    );

    useEffect(
        () => {
            // for an existing field, we query for the distinct set of values in the Text column to be used for
            // the initial set of values and/or setting fields as locked (i.e. in use)
            if (!field.isNew() && schemaName && queryName) {
                const fieldName = field.original?.name ?? field.name;
                Query.executeSql({
                    containerFilter: Query.ContainerFilter.allFolders, // to account for a shared domain at project or /Shared
                    schemaName,
                    sql: `SELECT "${fieldName}", ${lockedSqlFragment} AS IsLocked, COUNT(*) AS RowCount FROM "${queryName}" WHERE "${fieldName}" IS NOT NULL GROUP BY "${fieldName}"`,
                    success: response => {
                        const values = response.rows
                            .filter(row => isValidTextChoiceValue(row[fieldName]))
                            .reduce((prev, current) => {
                                prev[current[fieldName]] = {
                                    count: current['RowCount'],
                                    locked: current['IsLocked'] === 1,
                                };
                                return prev;
                            }, {});
                        setFieldValues(values);

                        // if this is new text choice validator (i.e. does not have a rowId) for an existing field
                        // that is being changed to data type = Text Choice (that "is new field" check is above),
                        // then we will use the existing distinct values for that field as the initial options
                        if (!field.textChoiceValidator?.rowId) {
                            replaceValues(Object.keys(values).sort());
                        }

                        setLoading(false);
                    },
                    failure: error => {
                        console.error('Error fetching distinct values for the text field: ', error);
                        setLoading(false);
                    },
                });
            } else {
                setLoading(false);
            }
        }, [/* none, only call once on mount*/]
    );

    return (
        <TextChoiceOptionsImpl
            {...props}
            fieldValues={fieldValues}
            loading={loading}
            replaceValues={replaceValues}
            validValues={validValues}
        />
    );
});
