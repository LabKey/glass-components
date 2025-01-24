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
import React, { ChangeEventHandler, FC, ReactNode } from 'react';

import { FormsyInjectedProps, withFormsy } from '../formsy';
import { FieldLabel } from '../FieldLabel';

import { QueryColumn } from '../../../../public/QueryColumn';

import { INPUT_CONTAINER_CLASS_NAME, INPUT_LABEL_CLASS_NAME, INPUT_WRAPPER_CLASS_NAME } from '../constants';

import { DisableableInput, DisableableInputProps, DisableableInputState } from './DisableableInput';

interface CheckboxInputProps extends DisableableInputProps {
    addLabelAsterisk?: boolean;
    containerClassName?: string;
    formsy?: boolean;
    label?: any;
    labelClassName?: string;
    queryColumn: QueryColumn;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    rowClassName?: any[] | string;
    showLabel?: boolean;
    value?: any;
    wrapperClassName?: string;
}

type CheckboxInputImplProps = CheckboxInputProps & FormsyInjectedProps<boolean>;

interface CheckboxInputState extends DisableableInputState {
    checked: boolean;
}

class CheckboxInputImpl extends DisableableInput<CheckboxInputImplProps, CheckboxInputState> {
    static defaultProps = {
        ...DisableableInput.defaultProps,
        containerClassName: INPUT_CONTAINER_CLASS_NAME,
        labelClassName: INPUT_LABEL_CLASS_NAME,
        showLabel: true,
        wrapperClassName: INPUT_WRAPPER_CLASS_NAME,
    };

    constructor(props: CheckboxInputImplProps) {
        super(props);

        this.state = {
            checked: props.value === true || props.value === 'true',
            isDisabled: props.initiallyDisabled,
        };
    }

    onChange: ChangeEventHandler<HTMLInputElement> = evt => {
        const checked = evt.target.checked;
        this.setState({ checked });
        if (this.props.formsy) {
            this.props.setValue?.(checked);
        }
    };

    toggleDisabled = (): void => {
        const { value } = this.props;

        this.setState(
            state => ({
                isDisabled: !state.isDisabled,
                checked: state.isDisabled ? state.checked : value === true || value === 'true',
            }),
            () => {
                this.props.onToggleDisable?.(this.state.isDisabled);
            }
        );
    };

    render() {
        const {
            addLabelAsterisk,
            allowDisable,
            containerClassName,
            formsy,
            label,
            labelClassName,
            queryColumn,
            showLabel,
            renderFieldLabel,
            value,
            wrapperClassName,
        } = this.props;
        const { checked, isDisabled } = this.state;

        // N.B.  We do not use the Checkbox component from Formsy because it does not support
        // React.Nodes as labels.  Using a label that is anything but a string when using Checkbox
        // produces a "Converting circular structure to JSON" error.
        // TODO: This label generation is inconsistent and does not align with other input elements.
        // This should not be responsible for rendering the "required-symbol" and should allow for component prop
        // to define label wrapper classes.
        return (
            <div className={`${containerClassName} checkbox-input-form-row`}>
                {renderFieldLabel ? (
                    <label className={labelClassName}>
                        {renderFieldLabel(queryColumn)}
                        {queryColumn?.required && <span className="required-symbol"> *</span>}
                    </label>
                ) : (
                    <FieldLabel
                        label={label}
                        labelOverlayProps={{
                            isFormsy: false,
                            inputId: queryColumn.fieldKey,
                            addLabelAsterisk,
                        }}
                        showLabel={showLabel}
                        showToggle={allowDisable}
                        column={queryColumn}
                        isDisabled={isDisabled}
                        toggleProps={{
                            onClick: this.toggleDisabled,
                        }}
                    />
                )}
                <div className={wrapperClassName}>
                    <input
                        disabled={isDisabled}
                        name={queryColumn.fieldKey}
                        // Issue 43299: Ignore "required" property for boolean columns as this will
                        // cause any false value (i.e. unchecked) to prevent submission.
                        // required={queryColumn.required}
                        type="checkbox"
                        value={formsy ? value : checked}
                        checked={checked}
                        onChange={this.onChange}
                    />
                </div>
            </div>
        );
    }
}

/**
 * This class is a wrapper around ReactSelect to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const CheckboxInputFormsy = withFormsy<CheckboxInputProps, boolean>(CheckboxInputImpl);

export const CheckboxInput: FC<CheckboxInputProps> = props => {
    const { formsy = true } = props;
    if (formsy) {
        return <CheckboxInputFormsy name={props.queryColumn.fieldKey} {...props} formsy />;
    }
    return <CheckboxInputImpl {...(props as CheckboxInputImplProps)} formsy={false} />;
};

CheckboxInput.displayName = 'CheckboxInput';
