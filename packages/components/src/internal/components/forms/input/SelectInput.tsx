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
import React, { Component, FC, FocusEvent, KeyboardEvent, ReactNode } from 'react';
import ReactSelect, { components } from 'react-select';
import AsyncSelect from 'react-select/async';
import AsyncCreatableSelect from 'react-select/async-creatable';
import CreatableSelect from 'react-select/creatable';
import { Utils } from '@labkey/api';

import { FieldLabel } from '../FieldLabel';
import { FormsyInjectedProps, withFormsy } from '../formsy';
import { DELIMITER, INPUT_CONTAINER_CLASS_NAME, INPUT_LABEL_CLASS_NAME, INPUT_WRAPPER_CLASS_NAME } from '../constants';
import { QueryColumn } from '../../../../public/QueryColumn';
import { generateId } from '../../../util/utils';

const _customStyles = {
    control: (styles, props) => {
        if (props.isDisabled) {
            return { ...styles, backgroundColor: '#EEE', borderColor: '#CCC' };
        }
        return styles;
    },
    // ReactSelect v1 had a zIndex value of "1000" where as ReactSelect v4.3.1 has a value of "2"
    // which results in layout conflicts in our apps. This reverts to the v1 value.
    menu: provided => ({ ...provided, zIndex: 1000 }),
    menuPortal: provided => ({ ...provided, zIndex: 9999 }), // Issue 45958 Safari scrollbar renders over menu
    multiValue: (styles, state) => ({ ...styles, backgroundColor: state.isDisabled ? '#E1E1E1' : '#F2F9FC' }),
    multiValueLabel: (styles, state) => ({ ...styles, color: state.isDisabled ? '#555' : '#08C' }),
    multiValueRemove: (styles, state) => {
        // Don't display the remove symbol for each option when the select is disabled.
        if (state.isDisabled) {
            return { ...styles, display: 'none' };
        }

        return {
            ...styles,
            color: '#08C',
            ':hover': {
                backgroundColor: '#2980B9',
                color: 'white',
            },
        };
    },
    placeholder: (styles, props) => {
        if (props.isDisabled) {
            return { ...styles, color: '#8E8E8E' };
        }
        return styles;
    },
};

const _customTheme = theme => ({
    ...theme,
    colors: {
        ...theme.colors,
        danger: '#D9534F',
        primary: '#2980B9',
        primary75: '#009BF9',
        primary50: '#F2F9FC',
        primary25: 'rgba(41, 128, 185, 0.1)',
    },
});

// Allows users to declare custom option rendering components without needing to redefine the base custom component
// wrapper. This is taken from the guide at https://react-select.com/styles#cx-and-custom-components.
const CustomOption = props => {
    const { className, cx, children, getStyles, innerProps, innerRef, isDisabled, isFocused, isSelected } = props;

    return (
        <div
            className={cx(
                {
                    option: true,
                    'option--is-disabled': isDisabled,
                    'option--is-focused': isFocused,
                    'option--is-selected': isSelected,
                },
                className
            )}
            ref={innerRef}
            style={getStyles('option', props)}
            {...innerProps}
        >
            {children}
        </div>
    );
};

// Molded from @types/react-select/src/filter.d.ts
export interface SelectInputOption extends Record<string, any> {
    data?: any;
    label?: string;
    options?: SelectInputOption[];
    value?: any;
}

export type SelectInputChange = (
    name: string,
    value: any,
    selectedOptions: SelectInputOption | SelectInputOption[],
    props: Partial<SelectInputProps>
) => void;

// Copied from @types/react-select/src/Select.d.ts
export type FilterOption = ((option: SelectInputOption, rawInput: string) => boolean) | null;

function initOptionFromPrimitive(value: string | number, props: SelectInputProps): SelectInputOption {
    const { labelKey = 'label', options, valueKey = 'value' } = props;
    const result = options?.find(o => o[valueKey] === value);
    if (!!result)
        return result;

    // if there are subgroups in the options
    if (options?.[0]?.options?.length > 0) {
        let subResult;
        options.forEach(optionGroup => {
            if (subResult)
                return;
            subResult = optionGroup?.options?.find(o => o[valueKey] === value);
        })

        return subResult;
    }

    return { [labelKey]: value, [valueKey]: value };
}

// Used to initialize the selected options in `state` when `autoValue` is enabled.
// This will accept a primitive value (e.g. 5) and resolve it to an option (e.g. { label: 'Awesome', value: 5 })
// if the option is available. Supports mapping single or multiple values.
export function initOptions(props: SelectInputProps): SelectInputOption | SelectInputOption[] {
    const { value, options } = props;
    let selectedOptions;

    const allowBlank = options?.find(option => option.value === '');

    if (value !== undefined && value !== null && (value !== '' || !!allowBlank)) {
        if (Array.isArray(value)) {
            selectedOptions = [];
            value.forEach(v => {
                if (v !== undefined && v !== null) {
                    if (typeof v === 'string' || typeof v === 'number') {
                        selectedOptions.push(initOptionFromPrimitive(v, props));
                    } else {
                        selectedOptions.push(v);
                    }
                }
            });
        } else if (typeof value === 'string' || typeof value === 'number') {
            selectedOptions = initOptionFromPrimitive(value, props);
        } else {
            selectedOptions = value;
        }
    }

    return selectedOptions;
}

const nullComponent: FC = () => null;

export interface SelectInputProps {
    addLabelAsterisk?: boolean;
    allowCreate?: boolean;
    allowDisable?: boolean;
    autoFocus?: boolean;
    autoValue?: boolean;
    backspaceRemovesValue?: boolean;
    cacheOptions?: boolean;
    clearCacheOnChange?: boolean;
    clearable?: boolean;
    closeMenuOnSelect?: boolean;
    containerClass?: string;
    customStyles?: Record<string, any>;
    customTheme?: (theme) => Record<string, any>;
    defaultInputValue?: string;
    defaultOptions?: boolean | readonly any[];
    delimiter?: string;
    description?: string;
    disabled?: boolean;
    filterOption?: FilterOption;
    formatCreateLabel?: (inputValue: string) => ReactNode;
    formatGroupLabel?: (data: any) => ReactNode;
    formsy?: boolean;
    help?: ReactNode;
    helpTipRenderer?: string;
    id?: any;
    initiallyDisabled?: boolean;
    inputClass?: string;
    inputId?: string;
    isLoading?: boolean;
    isValidNewOption?: (inputValue: string) => boolean;
    // FIXME: this is named incorrectly. I would expect that if this is true it would join the values, nope, it joins
    //   the values when false.
    joinValues?: boolean;
    label?: ReactNode;
    labelClass?: string;
    labelKey?: string;
    loadOptions?: (input: string) => Promise<SelectInputOption[]>;
    menuPlacement?: string;
    menuPosition?: string;
    multiple?: boolean;
    name?: string;
    noResultsText?: ReactNode;
    onBlur?: (event: FocusEvent<HTMLElement>) => void;
    // TODO: this is getting confused with formsy on change, need to separate
    onChange?: SelectInputChange;
    onFocus?: (event: FocusEvent<HTMLElement>, selectRef) => void;
    onKeyDown?: (event: KeyboardEvent<HTMLElement>) => void;
    onToggleDisable?: (disabled: boolean) => void;
    openMenuOnClick?: boolean;
    openMenuOnFocus?: boolean;
    optionRenderer?: any;
    options?: any[];
    placeholder?: ReactNode;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    required?: boolean;
    resolveFormValue?: (selectedOptions: SelectInputOption | SelectInputOption[]) => any;
    saveOnBlur?: boolean;
    selectedOptions?: any;
    showDropdownIndicator?: boolean;
    showDropdownMenu?: boolean;
    showIndicatorSeparator?: boolean;
    showLabel?: boolean;
    tabSelectsValue?: boolean;
    toggleDisabledTooltip?: string;
    value?: any;
    valueKey?: string;
    valueRenderer?: any;
}

type SelectInputImplProps = SelectInputProps & FormsyInjectedProps<any>;

interface State {
    // This state property is used in conjunction with the prop "clearCacheOnChange" which when true
    // is intended to clear the underlying asynchronous React Select's cache.
    // See https://github.com/JedWatson/react-select/issues/1879
    asyncKey: number;
    initialLoad: boolean;
    isDisabled: boolean;
    menuShouldScrollIntoView: boolean;
    originalOptions: SelectInputOption | SelectInputOption[];
    selectedOptions: SelectInputOption | SelectInputOption[];
}

// Implementation exported only for tests
export class SelectInputImpl extends Component<SelectInputImplProps, State> {
    static defaultProps = {
        allowCreate: false,
        allowDisable: false,
        autoValue: true,
        clearable: true,
        clearCacheOnChange: true,
        closeMenuOnSelect: true,
        containerClass: INPUT_CONTAINER_CLASS_NAME,
        defaultOptions: true,
        delimiter: DELIMITER,
        initiallyDisabled: false,
        inputClass: INPUT_WRAPPER_CLASS_NAME,
        labelClass: INPUT_LABEL_CLASS_NAME,
        menuPlacement: 'auto',
        // Default to 'fixed' because 'absolute' causes issues in several scenarios (Modals, EditableGrid) but it's too
        // difficult to manually set it to fixed in all of these situations (e.g. we don't always know we're in a modal)
        menuPosition: 'fixed',
        openMenuOnFocus: false,
        saveOnBlur: false,
        showDropdownIndicator: true,
        showDropdownMenu: true,
        showIndicatorSeparator: true,
        tabSelectsValue: true,
        valueKey: 'value',
    };

    private readonly _id: string;
    private _isMounted: boolean;
    private CHANGE_LOCK = false;
    private reactSelect: React.RefObject<any>;

    constructor(props: SelectInputImplProps) {
        super(props);

        this._id = generateId('selectinput-');
        const selectedOptions = props.autoValue === true ? initOptions(props) : undefined;

        this.state = {
            asyncKey: 0,
            initialLoad: true,
            isDisabled: !!props.initiallyDisabled,
            menuShouldScrollIntoView: false,
            originalOptions: selectedOptions,
            selectedOptions,
        };

        this.reactSelect = React.createRef();
    }

    componentDidMount(): void {
        this._isMounted = true;
    }

    componentDidUpdate(prevProps: SelectInputImplProps): void {
        if (!this.CHANGE_LOCK && this.props.autoValue && !this.isAsync() && prevProps.value !== this.props.value) {
            // If "autoValue" is enabled and the value has changed for a non-async configuration, then we need
            // to reinitialize "selectedOptions" from the latest props. The async case is handled in this.loadOptions().
            const selectedOptions = initOptions(this.props);
            this.setState({ originalOptions: selectedOptions, selectedOptions });
        }

        this.CHANGE_LOCK = false;
    }

    componentWillUnmount(): void {
        this._isMounted = false;
    }

    onToggleChange = (): void => {
        this.setState(
            state => ({
                isDisabled: !state.isDisabled,
                selectedOptions: state.isDisabled ? state.selectedOptions : state.originalOptions,
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

        // Issue 33774: fields should be able to preserve input onBlur
        if (saveOnBlur) {
            const select = this.reactSelect.current;

            if (select?.selectOption && select.state?.focusedOption) {
                select.selectOption(select.state.focusedOption);
            }
        }

        onBlur?.(event);
    };

    handleChange = (selectedOptions: any, context?: any): void => {
        const { clearCacheOnChange, closeMenuOnSelect, multiple, name, onChange, openMenuOnFocus } = this.props;

        this.CHANGE_LOCK = true;

        if (clearCacheOnChange && this.isAsync()) {
            this.setState(state => ({ asyncKey: state.asyncKey + 1 }));
        }

        const formValue = this._setOptionsAndValue(selectedOptions);

        onChange?.(name, formValue, selectedOptions, this.props);

        // ReactSelect does not currently support (or it is just broken) the configuration of:
        // openMenuOnFocus={true}, closeMenuOnSelect={true} and isMulti={true}
        // The menu remains open due to focus. This does not occur when isMulti={false}.
        // Here we do a deferred call to the internal onMenuClose().
        if (openMenuOnFocus && closeMenuOnSelect && multiple && context?.action === 'select-option') {
            setTimeout(() => {
                if (this._isMounted) {
                    this.reactSelect.current.onMenuClose();
                }
            }, 10);
        }
    };

    handleFocus = (event): void => {
        this.props.onFocus?.(event, this.reactSelect.current);
    };

    isAsync = (): boolean => {
        return !!this.props.loadOptions;
    };

    isCreatable = (): boolean => {
        return this.props.allowCreate === true;
    };

    loadOptions = async (input: string): Promise<SelectInputOption[]> => {
        // We don't support the older callback-based variant
        const options = await this.props.loadOptions(input);

        // If "autoValue" is enabled, then this will ensure the "selectedOptions" are mapped
        // from the specified "value" once the initial "loadOptions" call has been made.
        if (this.state.initialLoad) {
            if (this.props.autoValue) {
                const selectedOptions = initOptions({ ...this.props, options });
                this.setState({
                    initialLoad: false,
                    originalOptions: selectedOptions,
                    selectedOptions,
                });
            }

            // Issue 48259: ReactSelect menu positioning is currently broken when set to menuPosition="auto"
            // and the menu is asynchronously loaded. As a result the menu can end up rendering off the bottom of the
            // page upon initial load instead of "flipping" up to render above the select. This is due to the
            // underlying implementation not respecting the "isLoaded" bit when adjusting the layout via
            // useLayoutEffect() in <MenuPlacer/>.
            // This timeout operation works by flipping the "menuShouldScrollIntoView" bit, which is respected by
            // the underlying useLayoutEffect(), after a render cycle has been completed for the load out. We don't
            // currently support overriding the "menuShouldScrollIntoView" prop AND we always use "fixed" position
            // which results in ReactSelect never attempting to scroll regardless of if this prop is true or false.
            // ReactSelect Issue: https://github.com/JedWatson/react-select/issues/5733
            setTimeout(() => {
                if (this._isMounted) {
                    this.setState({ menuShouldScrollIntoView: true });
                }
            }, 1);
        }

        return options;
    };

    _setOptionsAndValue(options: any): any {
        const { autoValue, delimiter, formsy, joinValues, multiple, setValue, valueKey } = this.props;
        let selectedOptions;

        if (options === undefined || options === null || (Array.isArray(options) && options.length === 0)) {
            selectedOptions = undefined;
        } else {
            selectedOptions = options;
        }

        if (autoValue) {
            this.setState({ selectedOptions });
        }

        let formValue;

        if (this.props.resolveFormValue) {
            formValue = this.props.resolveFormValue(selectedOptions);
        } else if (selectedOptions !== undefined) {
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

    renderLabel = (): ReactNode => {
        const {
            allowDisable,
            description,
            label,
            labelClass,
            multiple,
            name,
            required,
            showLabel,
            addLabelAsterisk,
            renderFieldLabel,
            helpTipRenderer,
            toggleDisabledTooltip,
        } = this.props;
        const { isDisabled } = this.state;

        if (showLabel !== false && label !== undefined) {
            if (Utils.isString(label)) {
                const description_ = description ?? `Select ${multiple ? 'one or more values for' : 'a'} ${label}`;

                if (renderFieldLabel) {
                    return (
                        <label className={labelClass}>
                            {renderFieldLabel(undefined, label, description_)}
                            {required && <span className="required-symbol"> *</span>}
                        </label>
                    );
                }

                return (
                    <FieldLabel
                        id={this.getId()}
                        fieldName={name}
                        labelOverlayProps={{
                            inputId: name,
                            description: description_,
                            label,
                            addLabelAsterisk,
                            isFormsy: false,
                            required,
                            labelClass: !allowDisable ? labelClass : undefined,
                            helpTipRenderer,
                        }}
                        showLabel={showLabel}
                        showToggle={allowDisable}
                        isDisabled={isDisabled}
                        toggleProps={{
                            onClick: toggleDisabledTooltip ? undefined : this.onToggleChange,
                            toolTip: toggleDisabledTooltip,
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
        <components.Input {...inputProps} required={!!this.props.required && !inputProps.selectProps?.value} />
    );

    Option = optionProps => <CustomOption {...optionProps}>{this.props.optionRenderer(optionProps)}</CustomOption>;

    noOptionsMessage = (): ReactNode => this.props.noResultsText;

    renderSelect = (): ReactNode => {
        const {
            autoFocus,
            backspaceRemovesValue,
            cacheOptions,
            clearable,
            closeMenuOnSelect,
            customTheme,
            customStyles,
            defaultInputValue,
            defaultOptions,
            delimiter,
            disabled,
            filterOption,
            formatCreateLabel,
            formatGroupLabel,
            inputId,
            isLoading,
            isValidNewOption,
            labelKey,
            menuPlacement,
            menuPosition,
            multiple,
            name,
            onKeyDown,
            openMenuOnClick,
            openMenuOnFocus,
            optionRenderer,
            options,
            placeholder,
            showDropdownIndicator,
            showDropdownMenu,
            showIndicatorSeparator,
            tabSelectsValue,
            valueKey,
            valueRenderer,
        } = this.props;

        const components: any = { Input: this.Input };

        if (!showDropdownIndicator) {
            components.DropdownIndicator = nullComponent;
        }

        if (!showIndicatorSeparator) {
            components.IndicatorSeparator = nullComponent;
        }

        if (!showDropdownMenu) {
            components.Menu = nullComponent;
        }

        if (optionRenderer) {
            components.Option = this.Option;
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
            blurInputOnSelect: false,
            className: 'select-input',
            classNamePrefix: 'select-input',
            closeMenuOnSelect,
            components,
            defaultInputValue,
            delimiter,
            filterOption,
            formatCreateLabel,
            formatGroupLabel,
            getOptionLabel: labelKey && labelKey !== 'label' ? this.getOptionLabel : undefined,
            getOptionValue: valueKey && valueKey !== 'value' ? this.getOptionValue : undefined,
            id: this.getId(),
            inputId,
            isClearable: clearable,
            isDisabled: disabled || this.state.isDisabled,
            isLoading,
            isMulti: multiple,
            isValidNewOption,
            menuPlacement,
            menuPosition,
            // See comment in loadOptions() about how this is set and why it is utilized
            menuShouldScrollIntoView: this.state.menuShouldScrollIntoView,
            name,
            noOptionsMessage: this.noOptionsMessage,
            onBlur: this.handleBlur,
            onChange: this.handleChange,
            onFocus: this.handleFocus,
            onKeyDown,
            openMenuOnClick,
            openMenuOnFocus,
            options,
            placeholder,
            ref: this.reactSelect,
            styles: { ..._customStyles, ...customStyles },
            tabSelectsValue,
            theme: customTheme || _customTheme,
            // ReactSelect only supports null for clearing the value (as opposed to undefined).
            // See https://stackoverflow.com/a/50417171.
            value: (this.props.autoValue ? this.state.selectedOptions : this.props.selectedOptions) ?? null,
        };

        if (Array.isArray(selectProps.value) && selectProps.value.length === 0) {
            selectProps.value = null;
        } else if (!selectProps.isMulti && Array.isArray(selectProps.value)) {
            console.warn(
                'SelectInput: value is of type "array" but this component is NOT in "multiple" mode.' +
                    ' Consider either putting in "multiple" mode or fix value to not be an array.'
            );
        }

        if (this.isAsync()) {
            const asyncProps = {
                ...selectProps,
                cacheOptions,
                defaultOptions,
                key: this.state.asyncKey,
                loadOptions: this.loadOptions,
            };

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
        const { containerClass, errorMessage, formsy, help, inputClass } = this.props;
        const hasError = formsy && !!errorMessage;

        return (
            <div className={`select-input-container ${containerClass}`}>
                {this.renderLabel()}
                <div className={inputClass}>
                    {this.renderSelect()}
                    {hasError && (
                        <div className="has-error">
                            <span className="error-message help-block">{errorMessage}</span>
                        </div>
                    )}
                    {!hasError && !!help && <span className="help-block">{help}</span>}
                </div>
            </div>
        );
    }
}

/**
 * This class is a wrapper around ReactSelect to be able to bind formsy-react. It uses
 * the Formsy.Decorator to bind formsy-react so the element can be validated, submitted, etc.
 */
const SelectInputFormsy = withFormsy<SelectInputProps, any>(SelectInputImpl);

export const SelectInput: FC<SelectInputProps> = props => {
    const { formsy = false } = props;
    if (formsy) {
        return <SelectInputFormsy name={undefined} {...props} formsy />;
    }
    return <SelectInputImpl {...(props as SelectInputImplProps)} formsy={false} />;
};

SelectInput.displayName = 'SelectInput';
