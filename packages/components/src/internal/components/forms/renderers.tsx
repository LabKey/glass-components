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
import React, { ReactNode, ReactText } from 'react';
import { List, Map } from 'immutable';
import { Input } from 'formsy-react-components';
import { addValidationRule, validationRules } from 'formsy-react';

import { QueryColumn } from '../../..';
import { AssayTaskInput } from './input/AssayTaskInput';

import { LabelOverlay } from './LabelOverlay';
import { AliasInput } from './input/AliasInput';

type InputRenderer = (
    col: QueryColumn,
    key: ReactText,
    data: any, // The data for the entire row/form section
    value: any,
    isDetailInput: boolean, // Indicates whether or not the input is being rendered inside an EditableDetailPanel
    allowFieldDisable?: boolean,
    initiallyDisabled?: boolean,
    onToggleDisable?: (disabled: boolean) => void
) => ReactNode;

const AliasInputRenderer: InputRenderer = (
    col: QueryColumn,
    key: ReactText,
    data: any,
    value: any,
    isDetailInput: boolean,
    allowFieldDisable = false,
    initiallyDisabled = false,
    onToggleDisable?: (disabled: boolean) => void
) => (
    <AliasInput
        col={col}
        isDetailInput={isDetailInput}
        key={key}
        value={value}
        allowDisable={allowFieldDisable}
        initiallyDisabled={initiallyDisabled}
        onToggleDisable={onToggleDisable}
    />
);

const AppendUnitsInputRenderer: InputRenderer = (
    col: QueryColumn,
    key: ReactText,
    data: any,
    value: any,
    isDetailInput: boolean,
    allowFieldDisable = false,
    initiallyDisabled = false
) => (
    <Input
        allowDisable={allowFieldDisable}
        disabled={initiallyDisabled}
        addonAfter={<span>{col.units}</span>}
        changeDebounceInterval={0}
        elementWrapperClassName={isDetailInput ? [{ 'col-sm-9': false }, 'col-sm-12'] : undefined}
        id={col.name}
        key={key}
        label={<LabelOverlay column={col} inputId={col.name} />}
        labelClassName="control-label text-left"
        name={col.name}
        required={col.required}
        type="text"
        value={value}
        validations="isNumericWithError"
    />
);

const ASSAY_ID_INDEX = 'Protocol/RowId';

const AssayTaskInputRenderer: InputRenderer = (
    col: QueryColumn,
    key: ReactText,
    data: any,
    value: any,
    isDetailInput: boolean
) => (
    <AssayTaskInput
        assayId={data.getIn([ASSAY_ID_INDEX, 'value'])}
        isDetailInput={isDetailInput}
        name={col.name}
        value={value}
    />
);

export function resolveRenderer(column: QueryColumn): InputRenderer {
    // 23462: Global Formsy validation rule for numbers
    if (!validationRules.isNumericWithError) {
        addValidationRule('isNumericWithError', (values: any, value: string | number) => {
            return validationRules.isNumeric(values, value) || 'Please enter a number.';
        });
    }

    if (column?.inputRenderer) {
        switch (column.inputRenderer.toLowerCase()) {
            case 'experimentalias':
                return AliasInputRenderer;
            case 'appendunitsinput':
                return AppendUnitsInputRenderer;
            case 'workflowtask':
                return AssayTaskInputRenderer;
            default:
                break;
        }
    }

    return undefined;
}

interface FieldValue {
    displayValue?: any;
    formattedValue?: any;
    value: any;
}

type FieldArray = FieldValue[];
type FieldMap = Map<string, any>;
type FieldList = List<FieldMap>;

const isFieldList = (value: any): value is FieldList => List.isList(value);

const isFieldArray = (value: any): value is FieldArray => Array.isArray(value);

const isFieldMap = (value: any): value is FieldMap => Map.isMap(value);

const resolveFieldValue = (data: FieldValue, lookup?: boolean, ignoreFormattedValue?: boolean): string => {
    if (!ignoreFormattedValue && data.hasOwnProperty('formattedValue')) {
        return data.formattedValue;
    }

    const o = lookup !== true && data.hasOwnProperty('displayValue') ? data.displayValue : data.value;
    return o !== null && o !== undefined ? o : undefined;
};

export function resolveDetailFieldValue(
    data: FieldList | FieldArray | FieldMap | FieldValue,
    lookup?: boolean,
    ignoreFormattedValue?: boolean
): string | string[] {
    if (data) {
        if (isFieldList(data) && data.size) {
            return data.toJS().map(d => resolveFieldValue(d, lookup, ignoreFormattedValue));
        } else if (isFieldArray(data) && data.length) {
            return data.map(d => resolveFieldValue(d, lookup, ignoreFormattedValue));
        } else if (isFieldMap(data)) {
            return resolveFieldValue(data.toJS(), lookup, ignoreFormattedValue);
        }

        return resolveFieldValue(data as FieldValue, lookup, ignoreFormattedValue);
    }

    return undefined;
}
