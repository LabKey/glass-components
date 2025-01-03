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
import React, { ComponentType, FC, memo, useCallback, useEffect, useRef, useState } from 'react';
import { List, Map } from 'immutable';
import { Filter, Query, Utils } from '@labkey/api';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { resolveErrorMessage } from '../../util/messaging';

import { Row } from '../../query/selectRows';

import { QueryInfo } from '../../../public/QueryInfo';

import { SelectInputOption, SelectInput, SelectInputProps, SelectInputChange } from './input/SelectInput';
import { resolveDetailFieldLabel } from './utils';
import {
    fetchSearchResults,
    formatSavedResults,
    initSelect,
    QuerySelectModel,
    saveSearchResults,
    setSelection,
} from './model';
import { DELIMITER } from './constants';

// Prevent initialization in test environments in lieu of mocking APIWrapper in all test locations
const DEFAULT_AUTO_LOAD = process.env.NODE_ENV !== 'test';

function getValue(model: QuerySelectModel, multiple: boolean): any {
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
    // while multiple is also set to true. Instead, we can only pass in one pre-populated value. We then need to
    // convert that value to an array here, or Formsy will only return a single value if the input is never touched
    // by the user. Converting it to an array right here gets us the best of both worlds: a pre-populated value that
    // is returned as an array when the user hits submit.
    if (rawSelectedValue !== undefined && rawSelectedValue !== '' && multiple && !Array.isArray(rawSelectedValue)) {
        return [rawSelectedValue];
    }

    return rawSelectedValue;
}

// Issue 33775: Provide a default no-op filter to a React Select to prevent "normal" filtering on the input
// when fetching async query results. They have already been filtered.
const noopFilterOptions = options => options;

export interface QuerySelectOptionProps {
    label: string | number;
    queryInfo: QueryInfo;
    row: Row;
    value: any;
}

export type QuerySelectOptionComponent = ComponentType<QuerySelectOptionProps>;

interface OptionRendererProps {
    OptionComponent?: QuerySelectOptionComponent;
    label: any;
    model: QuerySelectModel;
    value: any;
}

const OptionRenderer: FC<OptionRendererProps> = props => {
    const { OptionComponent, label, model, value } = props;
    const { allResults, queryInfo } = model;

    if (queryInfo && allResults.size) {
        const columns = queryInfo.getLookupViewColumns(model.displayColumn);
        const item = allResults.find(result => value === result.getIn([model.valueColumn, 'value']));

        if (OptionComponent) {
            return <OptionComponent label={label} queryInfo={queryInfo} row={item?.toJS() as Row} value={value} />;
        }

        return (
            <>
                {columns.map((column, i) => {
                    if (item !== undefined) {
                        let text = resolveDetailFieldLabel(item.get(column.name));
                        if (!Utils.isString(text)) {
                            text = text ? text.toString() : '';
                        }

                        return (
                            <div key={i}>
                                {columns.length > 1 && (
                                    <span className="identifying_field_label">{column.caption ?? column.name}: </span>
                                )}
                                <span>{text}</span>
                            </div>
                        );
                    }

                    return (
                        <div key={i}>
                            <span>{label}</span>
                        </div>
                    );
                })}
            </>
        );
    }

    return null;
};
OptionRenderer.displayName = 'OptionRenderer';

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
 * represent all props of SelectInput that are not overridden by QuerySelect for its own
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
    | 'optionRenderer'
    | 'selectedOptions'
    | 'valueKey'
>;

export interface QuerySelectOwnProps extends InheritedSelectInputProps {
    OptionComponent?: QuerySelectOptionComponent;
    autoInit?: boolean;
    containerFilter?: Query.ContainerFilter;
    /** The path to the LK container that the queries should be scoped to. */
    containerPath?: string;
    displayColumn?: string;
    fireQSChangeOnInit?: boolean;
    groupByColumn?: string;
    loadOnFocus?: boolean;
    maxRows?: number;
    onInitValue?: (value: any, selectedValues: List<any>) => void;
    onQSChange?: QuerySelectChange;
    preLoad?: boolean;
    queryFilters?: List<Filter.IFilter>;
    queryParams?: Record<string, any>;
    requiredColumns?: string[];
    schemaQuery: SchemaQuery;
    showLoading?: boolean;
    valueColumn?: string;
}

type DefaultOptions = boolean | SelectInputOption[];

export const QuerySelect: FC<QuerySelectOwnProps> = memo(props => {
    const {
        OptionComponent,
        autoInit = DEFAULT_AUTO_LOAD,
        containerFilter,
        containerPath,
        delimiter = DELIMITER,
        displayColumn,
        fireQSChangeOnInit = false,
        groupByColumn,
        loadOnFocus = false,
        maxRows,
        onInitValue,
        onQSChange,
        preLoad = true,
        queryFilters,
        queryParams,
        requiredColumns,
        schemaQuery,
        showLoading = true,
        valueColumn,
        ...selectInputProps
    } = props;
    const {
        allowDisable,
        containerClass,
        customTheme,
        customStyles,
        defaultInputValue,
        description,
        formsy,
        helpTipRenderer,
        initiallyDisabled,
        inputClass,
        label,
        labelClass,
        menuPosition,
        multiple,
        name,
        onToggleDisable,
        openMenuOnFocus,
        required,
    } = selectInputProps;
    const [defaultOptions, setDefaultOptions] = useState<DefaultOptions>(() =>
        // See note in onFocus() regarding support for "loadOnFocus"
        preLoad !== false ? true : loadOnFocus ? [] : true
    );
    const [error, setError] = useState<string>();
    const [loadOnFocusLock, setLoadOnFocusLock] = useState<boolean>(false);
    const [initialLoad, setInitialLoad] = useState<boolean>(true);
    const [isLoading, setIsLoading] = useState<boolean>(undefined);
    const [model, setModel] = useState<QuerySelectModel>();
    const lastRequest = useRef<Record<string, string>>(undefined);
    const querySelectTimer = useRef(undefined);
    const shouldLoadOnFocus = loadOnFocus && !loadOnFocusLock;

    const clear = useCallback(() => {
        clearTimeout(querySelectTimer.current);
        querySelectTimer.current = undefined;
    }, []);

    useEffect(() => {
        if (!autoInit) return clear;

        (async () => {
            try {
                const model_ = await initSelect({
                    ...props,
                    delimiter,
                    fireQSChangeOnInit,
                    loadOnFocus,
                    preLoad,
                    showLoading,
                });
                setModel(model_);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to initialize.');
            }
        })();

        return clear;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [autoInit]);

    const loadOptions = useCallback(
        (input: string): Promise<SelectInputOption[]> => {
            let input_: string;

            if (initialLoad) {
                // If a "defaultInputValue" is supplied and the initial load is an empty search,
                // then search with the "defaultInputValue"
                input_ = input ? input : (defaultInputValue ?? '');
                setInitialLoad(false);
            } else {
                input_ = input;
            }

            const request = (lastRequest.current = {});
            clear();

            // If loadOptions occurs prior to call to "onFocus" then there is no need to "loadOnFocus".
            if (shouldLoadOnFocus) {
                setLoadOnFocusLock(true);
            }

            return new Promise((resolve, reject): void => {
                querySelectTimer.current = setTimeout(async () => {
                    clear();

                    try {
                        const data = await fetchSearchResults(model, input_);

                        // Issue 46816: Skip processing stale requests
                        if (request !== lastRequest.current) return;
                        lastRequest.current = undefined;

                        resolve(formatSavedResults(model, data, input_));
                        setModel(saveSearchResults(model, data));
                    } catch (e) {
                        const errorMsg = resolveErrorMessage(e) ?? 'Failed to retrieve search results.';
                        console.error(errorMsg, e);
                        reject(errorMsg);
                        setError(errorMsg);
                    }
                }, 250);
            });
        },
        [clear, defaultInputValue, initialLoad, model, shouldLoadOnFocus]
    );

    const onChange = useCallback<SelectInputChange>(
        (name_, value_, options_, props_) => {
            const model_ = setSelection(model, value_);
            setModel(model_);
            onQSChange?.(name_, value_, options_, props_, model_.selectedItems);
        },
        [model, onQSChange]
    );

    const onFocus = useCallback(async () => {
        // NK: To support loading the select upon focus (a.k.a. "loadOnFocus") we have to explicitly utilize
        // the "defaultOptions" and "isLoading" properties of ReactSelect. These properties, in tandem with
        // "loadOptions", allow for an asynchronous ReactSelect to defer requesting the initial options until
        // desired. This follows the pattern outlined here:
        // https://github.com/JedWatson/react-select/issues/1525#issuecomment-744157380
        if (!shouldLoadOnFocus) return;

        // Set and forget "loadOnFocusLock" state so "loadOnFocus" only occurs on the initial focus.
        setIsLoading(true);
        setLoadOnFocusLock(true);

        try {
            const defaultOptions_ = await loadOptions('');
            setDefaultOptions(defaultOptions_);
            // ReactSelect respects "isLoading" with a value of {undefined} differently from a value of {false}.
            setIsLoading(undefined);
        } catch (e) {
            // ignore -- error already logged/configured in loadOptions()
        }
    }, [loadOptions, shouldLoadOnFocus]);

    const optionRenderer = useCallback(
        option => (
            <OptionRenderer OptionComponent={OptionComponent} label={option.label} model={model} value={option.value} />
        ),
        [OptionComponent, model]
    );

    if (error) {
        return (
            <SelectInput
                allowDisable={allowDisable}
                containerClass={containerClass}
                customStyles={customStyles}
                customTheme={customTheme}
                description={description}
                disabled
                formsy={formsy}
                helpTipRenderer={helpTipRenderer}
                initiallyDisabled={initiallyDisabled}
                isLoading={false}
                inputClass={inputClass}
                label={label}
                labelClass={labelClass}
                menuPosition={menuPosition}
                multiple={multiple}
                name={name}
                onToggleDisable={onToggleDisable}
                openMenuOnFocus={openMenuOnFocus}
                placeholder={`Error: ${error}`}
                required={required}
            />
        );
    }

    if (model?.isInit) {
        return (
            <SelectInput
                filterOption={noopFilterOptions}
                label={label !== undefined ? label : model.queryInfo.title}
                optionRenderer={optionRenderer}
                {...selectInputProps}
                allowCreate={false}
                autoValue={false} // QuerySelect directly controls value of SelectInput via "selectedOptions"
                cacheOptions
                defaultOptions={defaultOptions}
                delimiter={delimiter}
                isLoading={isLoading}
                loadOptions={loadOptions}
                onChange={onChange}
                onFocus={onFocus}
                options={undefined} // prevent override
                selectedOptions={model.selectedOptions}
                value={getValue(model, multiple)} // needed to initialize the Formsy "value" properly
            />
        );
    }

    if (showLoading) {
        return (
            <SelectInput
                allowDisable={allowDisable}
                containerClass={containerClass}
                customStyles={customStyles}
                customTheme={customTheme}
                description={description}
                disabled
                formsy={formsy}
                helpTipRenderer={helpTipRenderer}
                initiallyDisabled={initiallyDisabled}
                label={label}
                labelClass={labelClass}
                menuPosition={menuPosition}
                multiple={multiple}
                name={name}
                onToggleDisable={onToggleDisable}
                openMenuOnFocus={openMenuOnFocus}
                placeholder="Loading..."
                required={required}
                value={undefined}
            />
        );
    }

    return null;
});

QuerySelect.displayName = 'QuerySelect';
