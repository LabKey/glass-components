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
import * as React from 'react';
import { datePlaceholder, QueryColumn } from '@glass/base'

import { TextInput, TextInputProps } from './TextInput'
import { DisableableInput, DisableableInputProps } from './DisableableInput';

interface DateInputProps extends DisableableInputProps {
    changeDebounceInterval?: number
    elementWrapperClassName?: Array<any> | string
    label?: any
    labelClassName?: Array<any> | string
    name?: string
    onChange?: any
    queryColumn: QueryColumn
    rowClassName?: Array<any> | string
    showLabel?: boolean
    validatePristine?: boolean
    value?: string
    addLabelAsterisk?: boolean
}

export class DateInput extends DisableableInput<DateInputProps, any> {

    static defaultProps = {
        allowDisable: false,
        initiallyDisabled: false,
        changeDebounceInterval: 0,
        elementWrapperClassName: 'col-md-9 col-xs-12',
        labelClassName: 'control-label text-left col-xs-12',
        showLabel: true,
        validatePristine: false
    };

    render() {
        const {
            allowDisable,
            initiallyDisabled,
            changeDebounceInterval,
            elementWrapperClassName,
            labelClassName,
            name,
            onChange,
            queryColumn,
            rowClassName,
            showLabel,
            validatePristine,
            value
        } = this.props;

        const props: TextInputProps = {
            allowDisable,
            initiallyDisabled,
            changeDebounceInterval,
            elementWrapperClassName,
            labelClassName,
            name: name ? name : queryColumn.name,
            onChange,
            placeholder: datePlaceholder(queryColumn),
            queryColumn,
            rowClassName,
            showLabel,
            validatePristine,
            value: value ? value : '' // to avoid uncontrolled -> controlled warnings
        };

        return <TextInput {...props}/>
    }
}
