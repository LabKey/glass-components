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
import React, { ReactNode } from 'react';
import { List, Map, OrderedMap } from 'immutable';
import { Input } from 'formsy-react-components';
import { Query, Utils } from '@labkey/api';

import { caseInsensitive, insertColumnFilter, QueryColumn, QueryInfo } from '../../..';

import { resolveRenderer } from './renderers';
import { QuerySelect } from './QuerySelect';
import { TextInput } from './input/TextInput';
import { CheckboxInput } from './input/CheckboxInput';
import { TextAreaInput } from './input/TextAreaInput';
import { FileInput } from './input/FileInput';
import { DatePickerInput } from './input/DatePickerInput';
import { TextChoiceInput } from './input/TextChoiceInput';

const LABEL_FIELD_SUFFIX = '::label';

export const getQueryFormLabelFieldName = function (name: string): string {
    return name + LABEL_FIELD_SUFFIX;
};

export const isQueryFormLabelField = function (name: string): boolean {
    return name.endsWith(LABEL_FIELD_SUFFIX);
};

export const getFieldEnabledFieldName = function (column: QueryColumn, fieldName?: string): string {
    const name = fieldName ? fieldName : column ? column.fieldKey : 'unknownField';
    return name + '::enabled';
};

export interface QueryFormInputsProps {
    allowFieldDisable?: boolean;
    // this can be used when you want a form to supply a set of values to populate a grid, which will be filled in with additional data
    // (e.g., if you want to generate a set of samples with common properties but need to provide the individual, unique ids)
    checkRequiredFields?: boolean;
    columnFilter?: (col?: QueryColumn) => boolean;
    componentKey?: string; // unique key to add to QuerySelect to avoid duplication w/ transpose
    /** A container filter that will be applied to all query-based inputs in this form */
    containerFilter?: Query.ContainerFilter;
    disabledFields?: List<string>;
    fieldValues?: any;
    fireQSChangeOnInit?: boolean;
    includeLabelField?: boolean;
    initiallyDisableFields?: boolean;
    lookups?: Map<string, number>;
    onAdditionalFormDataChange?: (name: string, value: any) => void;
    onFieldsEnabledChange?: (numEnabled: number) => void;
    onQSChange?: (name: string, value: string | any[], items: any) => void;
    queryColumns?: OrderedMap<string, QueryColumn>;
    queryInfo?: QueryInfo;
    renderFieldLabel?: (queryColumn: QueryColumn, label?: string, description?: string) => ReactNode;
    renderFileInputs?: boolean;
    showLabelAsterisk?: boolean; // only used if checkRequiredFields is false, to show * for fields that are originally required
    showQuerySelectPreviewOptions?: boolean;
}

interface State {
    labels: any;
}

// TODO: Merge this functionality with resolveDetailEditRenderer()
export class QueryFormInputs extends React.Component<QueryFormInputsProps, State> {
    static defaultProps: Partial<QueryFormInputsProps> = {
        checkRequiredFields: true,
        includeLabelField: false,
        renderFileInputs: false,
        allowFieldDisable: false,
        initiallyDisableFields: false,
        disabledFields: List<string>(),
        showQuerySelectPreviewOptions: false,
    };

    private _fieldEnabledCount = 0;

    constructor(props: QueryFormInputsProps) {
        super(props);

        const { queryInfo, queryColumns } = this.props;

        if (!queryInfo && !queryColumns) {
            throw new Error('QueryFormInputs: If queryInfo is not provided, queryColumns is required.');
        }

        this.state = {
            labels: {},
        };
    }

    static cleanValues(fieldValues: any, customValues?: any): any {
        const cleanValues = { ...fieldValues, ...customValues };

        return Object.keys(cleanValues)
            .filter(fieldKey => !isQueryFormLabelField(fieldKey))
            .reduce((newFieldValues, fieldKey) => {
                newFieldValues[fieldKey] = cleanValues[fieldKey];
                return newFieldValues;
            }, {});
    }

    onQSChange = (name: string, value: string | any[], items: any): void => {
        const { includeLabelField, onQSChange } = this.props;

        if (includeLabelField) {
            let allItems: any[] = items;
            if (!Utils.isArray(allItems)) {
                allItems = [allItems];
            }

            this.setState((prevState: State) => ({
                labels: {
                    ...prevState.labels,
                    ...{
                        [getQueryFormLabelFieldName(name)]: allItems
                            .map(item => (item ? item.label : '(label not found)'))
                            .join(', '),
                    },
                },
            }));
        }

        onQSChange?.(name, value, items);
    };

    onToggleDisable = (disabled: boolean): void => {
        if (disabled) {
            this._fieldEnabledCount--;
        } else {
            this._fieldEnabledCount++;
        }
        this.props.onFieldsEnabledChange?.(this._fieldEnabledCount);
    };

    renderLabelField = (col: QueryColumn): ReactNode => {
        const { includeLabelField } = this.props;

        if (includeLabelField) {
            const fieldName = getQueryFormLabelFieldName(col.name);
            return <Input name={fieldName} type="hidden" value={this.state.labels[fieldName]} />;
        }

        return null;
    };

    render() {
        const {
            columnFilter,
            componentKey,
            containerFilter,
            fieldValues,
            fireQSChangeOnInit,
            checkRequiredFields,
            showLabelAsterisk,
            initiallyDisableFields,
            lookups,
            queryColumns,
            queryInfo,
            renderFileInputs,
            allowFieldDisable,
            disabledFields,
            renderFieldLabel,
            showQuerySelectPreviewOptions,
            onAdditionalFormDataChange,
        } = this.props;

        const filter = columnFilter ?? insertColumnFilter;
        const columns = queryInfo ? queryInfo.columns : queryColumns;

        // CONSIDER: separately establishing the set of columns and allow
        // QueryFormInputs to be a rendering factory for the columns that are in the set.
        if (columns) {
            return columns
                .filter(col => filter(col))
                .valueSeq()
                .map((col, i) => {
                    const shouldDisableField =
                        initiallyDisableFields || disabledFields.contains(col.name.toLowerCase());
                    if (!shouldDisableField) {
                        this._fieldEnabledCount++;
                    }
                    let showAsteriskSymbol = false;
                    if (!checkRequiredFields && col.required) {
                        col = col.set('required', false) as QueryColumn;
                        showAsteriskSymbol = showLabelAsterisk;
                    }

                    let value = caseInsensitive(fieldValues, col.name);
                    if (!value && lookups) {
                        value = lookups.get(col.name) || lookups.get(col.name.toLowerCase());
                    }
                    if (!value && col.jsonType === 'string') {
                        value = '';
                    }

                    if (!value && col.jsonType === 'boolean') {
                        value = false;
                    }

                    if (col.inputRenderer) {
                        const renderer = resolveRenderer(col);
                        if (renderer) {
                            return renderer(
                                col,
                                i,
                                fieldValues,
                                value,
                                false,
                                allowFieldDisable,
                                shouldDisableField,
                                this.onToggleDisable,
                                this.onQSChange,
                                this.renderLabelField,
                                showAsteriskSymbol,
                                onAdditionalFormDataChange
                            );
                        }

                        throw new Error(`"${col.inputRenderer}" is not a valid inputRenderer.`);
                    }

                    if (col.isPublicLookup()) {
                        // undefined 'displayAsLookup' just respects the lookup.
                        // Must be explicitly false to prevent drop-down.
                        if (col.displayAsLookup !== false) {
                            const multiple = col.isJunctionLookup();
                            const joinValues = multiple;
                            const id = col.fieldKey + i + (componentKey ?? '');
                            return (
                                <React.Fragment key={i}>
                                    {this.renderLabelField(col)}
                                    <QuerySelect
                                        addLabelAsterisk={showAsteriskSymbol}
                                        allowDisable={allowFieldDisable}
                                        key={id}
                                        containerFilter={col.lookup.containerFilter ?? containerFilter}
                                        containerPath={col.lookup.containerPath}
                                        description={col.description}
                                        displayColumn={col.lookup.displayColumn}
                                        fireQSChangeOnInit={fireQSChangeOnInit}
                                        formsy
                                        initiallyDisabled={shouldDisableField}
                                        joinValues={joinValues}
                                        label={col.caption}
                                        loadOnFocus
                                        maxRows={10}
                                        multiple={multiple}
                                        name={col.fieldKey}
                                        onQSChange={this.onQSChange}
                                        onToggleDisable={this.onToggleDisable}
                                        placeholder="Select or type to search..."
                                        previewOptions={col.previewOptions === true || showQuerySelectPreviewOptions}
                                        renderFieldLabel={renderFieldLabel}
                                        required={col.required}
                                        schemaQuery={col.lookup.schemaQuery}
                                        showLabel
                                        value={value}
                                        valueColumn={col.lookup.keyColumn}
                                    />
                                </React.Fragment>
                            );
                        }
                    }

                    if (col.validValues) {
                        return (
                            <TextChoiceInput
                                key={i}
                                formsy
                                queryColumn={col}
                                value={value}
                                addLabelAsterisk={showAsteriskSymbol}
                                allowDisable={allowFieldDisable}
                                initiallyDisabled={shouldDisableField}
                                onToggleDisable={this.onToggleDisable}
                                renderFieldLabel={renderFieldLabel}
                                placeholder="Select or type to search..."
                            />
                        );
                    }

                    if (col.inputType === 'textarea') {
                        return (
                            <TextAreaInput
                                key={i}
                                queryColumn={col}
                                value={value}
                                allowDisable={allowFieldDisable}
                                initiallyDisabled={shouldDisableField}
                                onToggleDisable={this.onToggleDisable}
                                addLabelAsterisk={showAsteriskSymbol}
                                renderFieldLabel={renderFieldLabel}
                            />
                        );
                    } else if (col.inputType === 'file' && renderFileInputs) {
                        return (
                            <FileInput
                                formsy
                                key={i}
                                queryColumn={col}
                                initialValue={value}
                                name={col.fieldKey}
                                allowDisable={allowFieldDisable}
                                initiallyDisabled={shouldDisableField}
                                onToggleDisable={this.onToggleDisable}
                                addLabelAsterisk={showAsteriskSymbol}
                                renderFieldLabel={renderFieldLabel}
                                showLabel
                            />
                        );
                    }
                    switch (col.jsonType) {
                        case 'date':
                            return (
                                <DatePickerInput
                                    key={i}
                                    queryColumn={col}
                                    value={value}
                                    initValueFormatted={false}
                                    allowDisable={allowFieldDisable}
                                    initiallyDisabled={shouldDisableField}
                                    onToggleDisable={this.onToggleDisable}
                                    addLabelAsterisk={showAsteriskSymbol}
                                    renderFieldLabel={renderFieldLabel}
                                />
                            );
                        case 'boolean':
                            return (
                                <CheckboxInput
                                    key={i}
                                    queryColumn={col}
                                    value={value}
                                    allowDisable={allowFieldDisable}
                                    initiallyDisabled={shouldDisableField}
                                    onToggleDisable={this.onToggleDisable}
                                    addLabelAsterisk={showAsteriskSymbol}
                                    renderFieldLabel={renderFieldLabel}
                                />
                            );
                        default:
                            return (
                                <TextInput
                                    key={i}
                                    queryColumn={col}
                                    value={value ? String(value) : value}
                                    allowDisable={allowFieldDisable}
                                    initiallyDisabled={shouldDisableField}
                                    onToggleDisable={this.onToggleDisable}
                                    addLabelAsterisk={showAsteriskSymbol}
                                    renderFieldLabel={renderFieldLabel}
                                />
                            );
                    }
                })
                .toArray();
        }
    }
}
