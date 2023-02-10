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
import React, { FC, PureComponent, ReactNode } from 'react';
import { List, Map } from 'immutable';
import { Filter, Query, Utils } from '@labkey/api';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { resolveErrorMessage } from '../../util/messaging';

import { SelectInputOption, SelectInput, SelectInputProps } from './input/SelectInput';
import { resolveDetailFieldValue } from './utils';
import { initSelect, QuerySelectModel } from './model';
import { DELIMITER } from './constants';

function getValue(model: QuerySelectModel, props: QuerySelectOwnProps): any {
    const { rawSelectedValue } = model;

    if (rawSelectedValue !== undefined && !Utils.isString(rawSelectedValue)) {
        if (Array.isArray(rawSelectedValue)) {
            return rawSelectedValue;
        } else if (List.isList(rawSelectedValue)) {
            return rawSelectedValue.toArray();
        } else if (isNaN(rawSelectedValue)) {
            console.warn('QuerySelect: NaN is not a valid value', rawSelectedValue);
            return undefined;
        }
    }

    if (rawSelectedValue === null) {
        return undefined;
    }

    // Issue 37352
    // For reasons not entirely clear we cannot pass in an array of values to QuerySelect when we initialize it
    // while multiple is also set to true. Instead we can only pass in one pre-populated value. We then need to
    // convert that value to an array here, or Formsy will only return a single value if the input is never touched
    // by the user. Converting it to an array right here gets us the best of both worlds: a pre-populated value that
    // is returned as an array when the user hits submit.
    if (
        rawSelectedValue !== undefined &&
        rawSelectedValue !== '' &&
        props.multiple &&
        !Array.isArray(rawSelectedValue)
    ) {
        return [rawSelectedValue];
    }

    return rawSelectedValue;
}

// Issue 33775: Provide a default no-op filter to a React Select to prevent "normal" filtering on the input
// when fetching async query results. They have already been filtered.
const noopFilterOptions = options => options;

const PreviewOption: FC<any> = props => {
    const { model, label, value } = props;
    const { allResults, queryInfo } = model;

    if (queryInfo && allResults.size) {
        const displayColumn = queryInfo.getColumn(model.displayColumn);
        const columns = [displayColumn].concat(queryInfo.getLookupViewColumns([model.displayColumn]));
        const item = allResults.find(result => value === result.getIn([model.valueColumn, 'value']));

        return (
            <>
                {columns.map((column, i) => {
                    if (item !== undefined) {
                        let text = resolveDetailFieldValue(item.get(column.name));
                        if (!Utils.isString(text)) {
                            text = text ? text.toString() : '';
                        }

                        return (
                            <div key={i} className="text__truncate">
                                {columns.length > 1 && <strong>{column.caption}: </strong>}
                                <span>{text}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={i} className="text__truncate">
                            <span>{label}</span>
                        </div>
                    );
                })}
            </>
        );
    }

    return null;
};

// This "extends" the SelectInputChange type by adding additional parameters. This should always extend the
// signature of SelectInputChange so onChange event handling can be coalesced.
export type QuerySelectChange = (
    name: string,
    value: any,
    selectedOptions: SelectInputOption | SelectInputOption[],
    props: Partial<SelectInputProps>,
    selectedItems: Map<string, any>
) => void;

/**
 * This is a subset of SelectInputProps that are passed through to the SelectInput. Mainly, this set should
 * represent all props of SelectInput that are not overridden by QuerySelect for it's own
 * purposes (e.g. "options" are populated from the QuerySelect's model and thus are not allowed to
 * be specified by the user).
 */
type InheritedSelectInputProps = Omit<
    SelectInputProps,
    | 'allowCreate'
    | 'autoValue'
    | 'cacheOptions'
    | 'defaultOptions' // utilized by QuerySelect to support "preLoad" and "loadOnFocus" behaviors.
    | 'isLoading' // utilized by QuerySelect to support "loadOnFocus" behavior.
    | 'labelKey'
    | 'loadOptions'
    | 'onChange' // overridden by QuerySelect. See onQSChange().
    | 'options'
    | 'valueKey'
>;

export interface QuerySelectOwnProps extends InheritedSelectInputProps {
    containerFilter?: Query.ContainerFilter;
    /** The path to the LK container that the queries should be scoped to. */
    containerPath?: string;
    displayColumn?: string;
    fireQSChangeOnInit?: boolean;
    loadOnFocus?: boolean;
    maxRows?: number;
    onInitValue?: (value: any, selectedValues: List<any>) => void;
    onQSChange?: QuerySelectChange;
    preLoad?: boolean;
    queryFilters?: List<Filter.IFilter>;
    requiredColumns?: string[];
    schemaQuery: SchemaQuery;
    showLoading?: boolean;
    valueColumn?: string;
}

interface State {
    defaultOptions: boolean | SelectInputOption[];
    error: string;
    isLoading: boolean;
    loadOnFocusLock: boolean;
    model: QuerySelectModel;
}

export class QuerySelect extends PureComponent<QuerySelectOwnProps, State> {
    static defaultProps = {
        delimiter: DELIMITER,
        filterOption: noopFilterOptions,
        fireQSChangeOnInit: false,
        loadOnFocus: false,
        preLoad: true,
        showLoading: true,
    };

    private lastRequest: Record<string, string>;
    private querySelectTimer: number;

    constructor(props: QuerySelectOwnProps) {
        super(props);

        this.state = {
            // See note in onFocus() regarding support for "loadOnFocus"
            defaultOptions: props.preLoad !== false ? true : props.loadOnFocus ? [] : true,
            error: undefined,
            isLoading: undefined,
            loadOnFocusLock: false,
            model: undefined,
        };
    }

    componentDidMount(): void {
        this.initModel();
    }

    initModel = async (): Promise<void> => {
        try {
            const model = await initSelect(this.props);
            this.setState({ model });
        } catch (error) {
            this.setState({ error: resolveErrorMessage(error) ?? 'Failed to initialize.' });
        }
    };

    componentWillUnmount(): void {
        clearTimeout(this.querySelectTimer);
    }

    shouldLoadOnFocus = (): boolean => {
        return this.props.loadOnFocus && !this.state.loadOnFocusLock;
    };

    loadOptions = (input: string): Promise<SelectInputOption[]> => {
        const request = (this.lastRequest = {});
        clearTimeout(this.querySelectTimer);

        // If loadOptions occurs prior to call to "onFocus" then there is no need to "loadOnFocus".
        if (this.shouldLoadOnFocus()) {
            this.setState({ loadOnFocusLock: true });
        }

        return new Promise((resolve, reject): void => {
            this.querySelectTimer = window.setTimeout(async () => {
                this.querySelectTimer = undefined;

                try {
                    const { model } = this.state;

                    const data = await model.search(input);

                    // Issue 46816: Skip processing stale requests
                    if (request !== this.lastRequest) return;
                    delete this.lastRequest;

                    resolve(model.formatSavedResults(data, input));

                    this.setState(() => ({
                        model: model.saveSearchResults(data),
                    }));
                } catch (error) {
                    const errorMsg = resolveErrorMessage(error) ?? 'Failed to retrieve search results.';
                    console.error(errorMsg, error);
                    reject(errorMsg);
                    this.setState({ error: errorMsg });
                }
            }, 250);
        });
    };

    onChange = (
        name: string,
        value: any,
        selectedOptions: SelectInputOption | SelectInputOption[],
        props: Partial<SelectInputProps>
    ): void => {
        this.setState(
            state => ({ model: state.model.setSelection(value) }),
            () => {
                this.props.onQSChange?.(name, value, selectedOptions, props, this.state.model.selectedItems);
            }
        );
    };

    optionRenderer = (props): ReactNode => {
        return <PreviewOption label={props.label} model={this.state.model} value={props.value} />;
    };

    onFocus = async (): Promise<void> => {
        // NK: To support loading the select upon focus (a.k.a. "loadOnFocus") we have to explicitly utilize
        // the "defaultOptions" and "isLoading" properties of ReactSelect. These properties, in tandem with
        // "loadOptions", allow for an asynchronous ReactSelect to defer requesting the initial options until
        // desired. This follows the pattern outlined here:
        // https://github.com/JedWatson/react-select/issues/1525#issuecomment-744157380
        if (this.shouldLoadOnFocus()) {
            // Set and forget "loadOnFocusLock" state so "loadOnFocus" only occurs on the initial focus.
            this.setState({ loadOnFocusLock: true, isLoading: true });

            try {
                const defaultOptions = await this.loadOptions('');

                // ReactSelect respects "isLoading" with a value of {undefined} differently from a value of {false}.
                this.setState({ defaultOptions, isLoading: undefined });
            } catch (e) {
                /* ignore -- error already logged/configured in loadOptions() */
            }
        }
    };

    render() {
        const {
            allowDisable,
            containerClass,
            customTheme,
            customStyles,
            description,
            filterOption,
            formsy,
            helpTipRenderer,
            initiallyDisabled,
            inputClass,
            label,
            labelClass,
            menuPosition,
            multiple,
            onToggleDisable,
            openMenuOnFocus,
            optionRenderer,
            required,
            showLoading,
        } = this.props;
        const { defaultOptions, error, isLoading, model } = this.state;

        if (error) {
            const inputProps = {
                allowDisable,
                containerClass,
                customStyles,
                customTheme,
                description,
                disabled: true,
                formsy,
                helpTipRenderer,
                initiallyDisabled,
                isLoading: false,
                inputClass,
                label,
                labelClass,
                menuPosition,
                multiple,
                name: this.props.name,
                onToggleDisable,
                openMenuOnFocus,
                placeholder: `Error: ${error}`,
                required,
                type: 'text',
            };

            return <SelectInput {...inputProps} />;
        } else if (model?.isInit) {
            const inputProps = Object.assign(
                {
                    label: label !== undefined ? label : model.queryInfo.title,
                },
                this.props,
                {
                    allowCreate: false,
                    autoValue: false, // QuerySelect directly controls value of ReactSelect via selectedOptions
                    cacheOptions: true,
                    defaultOptions,
                    filterOption,
                    helpTipRenderer,
                    isLoading,
                    loadOptions: this.loadOptions,
                    onChange: this.onChange,
                    onFocus: this.onFocus,
                    openMenuOnFocus,
                    options: undefined, // prevent override
                    optionRenderer: optionRenderer ? optionRenderer : this.optionRenderer,
                    selectedOptions: model.getSelectedOptions(),
                    value: getValue(model, this.props), // needed to initialize the Formsy "value" properly
                }
            );

            return <SelectInput {...inputProps} />;
        } else if (showLoading) {
            const inputProps = {
                allowDisable,
                containerClass,
                customStyles,
                customTheme,
                description,
                disabled: true,
                formsy,
                helpTipRenderer,
                inputClass,
                initiallyDisabled,
                label,
                labelClass,
                menuPosition,
                multiple,
                name: this.props.name,
                openMenuOnFocus,
                onToggleDisable,
                placeholder: 'Loading...',
                required,
                type: 'text',
                value: undefined,
            };

            return <SelectInput {...inputProps} />;
        }

        return null;
    }
}
