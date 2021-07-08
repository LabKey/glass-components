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
import React, { Component, FC, FocusEvent, ReactNode } from 'react';
import { withFormsy } from 'formsy-react';
import ReactSelect, { components } from 'react-select';
import AsyncSelect from 'react-select/async';
import AsyncCreatableSelect from 'react-select/async-creatable';
import CreatableSelect from 'react-select/creatable';
import { getServerContext, Utils } from '@labkey/api';

import { FieldLabel } from '../FieldLabel';

import { generateId, QueryColumn } from '../../../..';

// Molded from @types/react-select/src/filter.d.ts
export interface SelectInputOption {
    data?: any;
    label?: string;
    value?: any;
    [key: string]: any;
}

// Copied from @types/react-select/src/Select.d.ts
export type FilterOption = ((option: SelectInputOption, rawInput: string) => boolean) | null;

// DO NOT CHANGE DELIMITER -- at least in react-select 1.0.0-rc.10
// any other delimiter value will break the "multiple" configuration parameter
export const DELIMITER = ',';

function equalValues(a: any, b: any): boolean {
    if (a === null || b === null) {
        if ((a === null && b !== null) || (a !== null && b === null)) {
            return false;
        }
        return true; // both null
    }

    if (typeof a !== typeof b) {
        return false;
    } else if (!Array.isArray(a) && typeof a !== 'object') {
        // string, number, boolean
        return a === b;
    }

    if (Array.isArray(a)) {
        if (a.length !== b.length) {
            return false;
        }

        // can assume equal length
        for (let i = 0; i < a.length; i++) {
            if (!equalValues(a[i], b[i])) {
                return false;
            }
        }
    } else if (typeof a === 'object') {
        // can assume ReactSelectOption
        if (!equalValues(a.value, b.value) || !equalValues(a.label, b.label)) {
            return false;
        }
    }

    return true;
}

function initOptions(props: SelectInputProps): any {
    const { value } = props;
    let options;

    if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
            options = [];
            value.forEach(v => {
                if (v !== undefined && v !== null) {
                    if (typeof v === 'string') {
                        options.push({
                            label: v,
                            [props.valueKey]: v,
                        });
                    } else {
                        options.push(v);
                    }
                }
            });
        } else if (typeof value === 'string') {
            // ReactSelect no longer supports primitive string as "value"
            options = { label: value, [props.valueKey]: value };
        } else {
            options = value;
        }
    }

    return options;
}

export interface SelectInputProps {
    addLabelAsterisk?: boolean;
    // addLabelText?: string;  -- REMOVED
    afterInputElement?: ReactNode; // this can be used to render an element to the right of the input
    allowCreate?: boolean;
    allowDisable?: boolean;
    autoFocus?: boolean;
    // autoload?: boolean; -- RENAMED: defaultOptions
    autoValue?: boolean;
    // backspaceRemoves?: boolean;  -- RENAMED: backspaceRemovesValue
    backspaceRemovesValue?: boolean;
    cacheOptions?: boolean;
    clearCacheOnChange?: boolean;
    clearable?: boolean;
    containerClass?: string;
    defaultOptions?: boolean | readonly any[];
    delimiter?: string;
    description?: string;
    disabled?: boolean;
    filterOptions?: FilterOption;
    formsy?: boolean;
    // ignoreCase?: boolean;  -- REMOVED. Use createFilter() instead.
    initiallyDisabled?: boolean;
    inputClass?: string;
    isLoading?: boolean;
    // FIXME: this is named incorrectly. I would expect that if this is true it would join the values, nope, it joins
    //   the values when false.
    joinValues?: boolean;
    labelClass?: string;
    labelKey?: string; // no longer directly supported. Uses getOptionLabel() if "labelKey" is provided
    loadOptions?: any; // no way to currently require one or the other, options/loadOptions
    multiple?: boolean;
    name?: string;
    noResultsText?: string;
    onBlur?: (event: FocusEvent<HTMLElement>) => void;
    onChange?: Function; // this is getting confused with formsy on change, need to separate
    onFocus?: (event: FocusEvent<HTMLElement>, selectRef) => void;
    onToggleDisable?: (disabled: boolean) => void;
    optionRenderer?: any;
    options?: any[];
    placeholder?: ReactNode;
    promptTextCreator?: (filterText: string) => string;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    required?: boolean;
    saveOnBlur?: boolean;
    selectedOptions?: any; // Option | Option[];
    showLabel?: boolean;
    valueKey?: string;
    valueRenderer?: any;

    id?: any;
    label?: ReactNode;
    value?: any;

    // from formsy-react
    getErrorMessage?: Function;
    getValue?: Function;
    setValue?: Function;
    showRequired?: Function;
    validations?: any;
}

export interface SelectInputState {
    // This state property is used in conjunction with the prop "clearCacheOnChange" which when true
    // is intended to clear the underlying asynchronous React Select's cache.
    // See https://github.com/JedWatson/react-select/issues/1879
    asyncKey: number;
    isDisabled: boolean;
    originalOptions: any;
    selectedOptions: any;
}

// Implementation exported only for tests
export class SelectInputImpl extends Component<SelectInputProps, SelectInputState> {
    static defaultProps = {
        allowCreate: false,
        allowDisable: false,
        autoValue: true,
        clearCacheOnChange: true,
        containerClass: 'form-group row',
        defaultOptions: true,
        delimiter: DELIMITER,
        initiallyDisabled: false,
        inputClass: 'col-sm-9 col-xs-12',
        labelClass: 'control-label col-sm-3 text-left col-xs-12',
        saveOnBlur: false,
        showLabel: true,
        valueKey: 'value',
    };

    private readonly _id: string;
    change = false; // indicates if the initial value has been changed or not

    constructor(props: SelectInputProps) {
        super(props);

        this._id = generateId('selectinput-');
        const originalOptions = props.autoValue === true ? initOptions(props) : props.selectedOptions;

        this.state = {
            asyncKey: 0,
            isDisabled: !!props.initiallyDisabled,
            originalOptions,
            selectedOptions: originalOptions,
        };
    }

    refs: {
        reactSelect: any;
    };

    UNSAFE_componentWillReceiveProps(nextProps: SelectInputProps): void {
        // Issue 36478, Issue 38631: reset the reactSelect input cache object on prop change
        // We need to do this fairly aggressively and this may not catch all cases, but this is the best
        // bet yet.  It can happen, probably because of bad timing between loading and refreshing the display
        // here, that the cache value for the key LOAD_ON_FOCUS (from QuerySelect) will get set to an empty
        // list of options.  Once that is stashed in the ReactSelect cache, it's pretty much impossible to get
        // rid of it through normal component update operations, so we do this surgery here.
        // this.refs.reactSelect._cache = {};

        if (!this.change && !equalValues(this.props.value, nextProps.value)) {
            if (nextProps.autoValue) {
                // This allows for "late-bound" value
                this._setOptionsAndValue(initOptions(nextProps));
            } else {
                this.setState({
                    selectedOptions: nextProps.selectedOptions,
                    originalOptions: nextProps.selectedOptions,
                });
            }
        }

        this.change = false;
    }

    toggleDisabled = (): void => {
        const { selectedOptions } = this.state;

        this.setState(
            state => ({
                isDisabled: !state.isDisabled,
                selectedOptions: state.isDisabled ? selectedOptions : state.originalOptions,
            }),
            () => {
                this.props.onToggleDisable?.(this.state.isDisabled);
            }
        );
    };

    getId = (): string => {
        return this.props.id ?? this._id;
    };

    handleBlur = (event: FocusEvent<HTMLElement>): void => {
        const { onBlur, saveOnBlur } = this.props;

        // 33774: fields should be able to preserve input onBlur
        if (saveOnBlur) {
            const select = this.refs.reactSelect?.select?.select;

            if (select?.selectOption) {
                if (select?.state?.focusedOption) {
                    select.selectOption(select.state.focusedOption);
                }
            } else if (getServerContext().devMode) {
                console.warn(
                    'ReactSelect implementation may have changed. SelectInput "saveOnBlur" no longer working.'
                );
            }
        }

        onBlur?.(event);
    };

    handleChange = (selectedOptions: any, actionMeta: any): void => {
        const { clearCacheOnChange, name, onChange } = this.props;

        this.change = true;

        if (clearCacheOnChange && this.isAsync()) {
            this.setState(state => ({ asyncKey: state.asyncKey + 1 }));
        }

        // set the formsy value from the selected options
        const formValue = this._setOptionsAndValue(selectedOptions);

        onChange?.(name, formValue, selectedOptions, this.refs.reactSelect);
    };

    handleFocus = (event): void => {
        this.props.onFocus?.(event, this.refs.reactSelect);
    };

    isAsync = (): boolean => {
        return !!this.props.loadOptions;
    };

    isCreatable = (): boolean => {
        return this.props.allowCreate === true;
    };

    _setOptionsAndValue(options: any): any {
        const { delimiter, formsy, multiple, joinValues, setValue, valueKey } = this.props;
        let selectedOptions;

        if (options === undefined || options === null || (Array.isArray(options) && options.length === 0)) {
            selectedOptions = undefined;
        } else {
            selectedOptions = options;
        }

        this.setState({ selectedOptions });

        let formValue;

        if (selectedOptions !== undefined) {
            if (multiple) {
                if (Array.isArray(selectedOptions)) {
                    formValue = selectedOptions.reduce((arr, option) => {
                        arr.push(valueKey ? option[valueKey] : option.value);
                        return arr;
                    }, []);

                    if (!joinValues) {
                        // consider removing altogether?
                        formValue = formValue.join(delimiter);
                    }
                } else {
                    formValue = selectedOptions;
                }
            } else {
                formValue = selectedOptions.value;
            }
        }

        if (formsy) {
            setValue?.(formValue);
        }

        return formValue;
    }

    renderError() {
        const { formsy, getErrorMessage } = this.props;

        if (formsy && Utils.isFunction(getErrorMessage)) {
            const error = getErrorMessage();

            if (error) {
                return (
                    <div className="has-error">
                        <span className="error-message help-block">{error}</span>
                    </div>
                );
            }
        }

        return null;
    }

    renderLabel = (): ReactNode => {
        const {
            allowDisable,
            label,
            multiple,
            name,
            required,
            showLabel,
            addLabelAsterisk,
            renderFieldLabel,
        } = this.props;
        const { isDisabled } = this.state;

        if (showLabel && label !== undefined) {
            if (Utils.isString(label)) {
                let description = this.props.description;
                if (!description) {
                    description = 'Select ' + (multiple ? ' one or more values for ' : ' a ') + label;
                }

                if (renderFieldLabel) {
                    return (
                        <label className="control-label col-sm-3 text-left col-xs-12">
                            {renderFieldLabel(undefined, label, description)}
                        </label>
                    );
                }

                return (
                    <FieldLabel
                        id={this.getId()}
                        fieldName={name}
                        labelOverlayProps={{
                            inputId: name,
                            description,
                            label,
                            addLabelAsterisk,
                            isFormsy: false,
                            required,
                            labelClass: !allowDisable ? this.props.labelClass : undefined,
                        }}
                        showLabel={showLabel}
                        showToggle={allowDisable}
                        isDisabled={isDisabled}
                        toggleProps={{
                            onClick: this.toggleDisabled,
                        }}
                    />
                );
            }

            return label;
        }

        return null;
    };

    getOptionLabel = (option: SelectInputOption): string => option[this.props.labelKey];

    getOptionValue = (option: SelectInputOption): any => option[this.props.valueKey];

    Input = inputProps => (
        // Marking input as "required" is not natively supported by react-select post-v1. Here we can mark
        // the underlying input as required, however, this is not the value input but rather the user visible
        // input so we manually check if a value is set.
        <components.Input {...inputProps} required={!!this.props.required && !this.state.selectedOptions} />
    );

    noOptionsMessage = (): string => this.props.noResultsText;

    renderSelect = (): ReactNode => {
        const {
            autoFocus,
            backspaceRemovesValue,
            cacheOptions,
            clearable,
            defaultOptions,
            delimiter,
            disabled,
            filterOptions,
            isLoading,
            labelKey,
            loadOptions,
            multiple,
            name,
            optionRenderer,
            options,
            placeholder,
            promptTextCreator,
            valueKey,
            valueRenderer,
        } = this.props;

        const components: any = { Input: this.Input };

        if (optionRenderer) {
            components.Option = optionRenderer;
        }

        if (valueRenderer) {
            if (multiple) {
                components.MultiValue = valueRenderer;
            } else {
                components.SingleValue = valueRenderer;
            }
        }

        const selectProps: any = {
            autoFocus,
            backspaceRemovesValue,
            blurInputOnSelect: false, // TODO: This seems to have no effect
            className: 'select-input',
            classNamePrefix: 'select-input',
            components,
            delimiter,
            filterOption: filterOptions, // TODO: Rename to filterOption() and determine if "value" is still a property
            getOptionLabel: labelKey && labelKey !== 'label' ? this.getOptionLabel : undefined,
            getOptionValue: valueKey && valueKey !== 'value' ? this.getOptionValue : undefined,
            id: this.getId(),
            // ignoreCase, TODO: Removed. See `createFilter()`. Default option is "ignoreCase" set to true.
            // inputProps: { id: this.getId() },
            isClearable: clearable,
            isDisabled: disabled || this.state.isDisabled,
            isLoading,
            isMulti: multiple,
            name,
            noOptionsMessage: this.noOptionsMessage,
            onBlur: this.handleBlur,
            onChange: this.handleChange,
            onFocus: this.handleFocus,
            options,
            placeholder,
            promptTextCreator,
            ref: 'reactSelect',
            value: this.state.selectedOptions,
        };

        if (Array.isArray(selectProps.value) && selectProps.value.length === 0) {
            selectProps.value = undefined;
        } else if (!selectProps.isMulti && Array.isArray(selectProps.value)) {
            console.warn(
                'SelectInput: value is of type "array" but this component is NOT in "multiple" mode.' +
                    ' Consider either putting in "multiple" mode or fix value to not be an array.'
            );
        }

        if (this.isAsync()) {
            const asyncProps = { ...selectProps, cacheOptions, defaultOptions, loadOptions, key: this.state.asyncKey };

            if (this.isCreatable()) {
                return <AsyncCreatableSelect {...asyncProps} />;
            }

            return <AsyncSelect {...asyncProps} />;
        } else if (this.isCreatable()) {
            return <CreatableSelect {...selectProps} />;
        }

        return <ReactSelect {...selectProps} />;
    };

    render() {
        const { containerClass, inputClass, afterInputElement } = this.props;

        return (
            <div className={`select-input-container ${containerClass}`}>
                {this.renderLabel()}
                <div className={inputClass}>
                    {this.renderSelect()}
                    {this.renderError()}
                </div>
                {afterInputElement}
            </div>
        );
    }
}

/**
 * This class is a wrapper around ReactSelect to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const SelectInputFormsy = withFormsy(SelectInputImpl);

export const SelectInput: FC<SelectInputProps> = props => {
    if (props.formsy) {
        return <SelectInputFormsy {...props} />;
    }
    return <SelectInputImpl {...props} />;
};

SelectInput.defaultProps = {
    formsy: true,
};

SelectInput.displayName = 'SelectInput';
