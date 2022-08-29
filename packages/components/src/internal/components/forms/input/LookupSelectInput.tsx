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
import { fromJS, Map } from 'immutable';
import { Filter, Query } from '@labkey/api';

import { LabelOverlay } from '../LabelOverlay';

import { QueryColumn, QueryLookup } from '../../../../public/QueryColumn';
import { naturalSort } from '../../../../public/sort';
import { ISelectRowsResult, selectRowsDeprecated } from '../../../query/api';
import { generateId } from '../../../util/utils';
import { resolveKey } from '../../../../public/SchemaQuery';
import { LoadingSpinner } from '../../base/LoadingSpinner';

import { SelectInput, SelectInputProps } from './SelectInput';

interface LookupSelectOption {
    label: string;
    value: any;
}

function formatLookupSelectInputOptions(
    lookup: QueryLookup,
    models: Map<string, any>,
    doSort = true
): LookupSelectOption[] {
    if (!models) {
        return [];
    }

    const mappedModel = models.map(model => {
        let fieldKey = lookup.displayColumn;

        if (fieldKey.indexOf('/') > -1) {
            fieldKey = fieldKey.substr(fieldKey.indexOf('/') + 1);
        }

        return {
            label:
                model.getIn([fieldKey, 'formattedValue']) ||
                model.getIn([fieldKey, 'displayValue']) ||
                model.getIn([fieldKey, 'value']),
            value: model.getIn([lookup.keyColumn, 'value']),
        };
    });
    if (doSort) return mappedModel.sortBy(model => model.label, naturalSort).toArray();
    else return mappedModel.toArray();
}

interface StateProps {
    isLoading: boolean;
    options: LookupSelectOption[];
}

interface OwnProps extends SelectInputProps {
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    filterArray?: Filter.IFilter[];
    queryColumn: QueryColumn;
    selectedRows?: ISelectRowsResult;
    sort?: string;
}

export class LookupSelectInput extends React.PureComponent<OwnProps, StateProps> {
    _id: string;

    constructor(props: OwnProps) {
        super(props);

        // require our own id here so the <LabelOverlay> can be associated correctly
        this._id = generateId('select-');

        this.state = {
            isLoading: false,
            options: this.getOptionsFromSelectedRows(props, props.selectedRows),
        };
    }

    UNSAFE_componentWillMount(): void {
        if (!this.state.options && !this.state.isLoading) {
            this.getOptions();
        }
    }

    UNSAFE_componentWillReceiveProps(nextProps: OwnProps): void {
        if (nextProps.selectedRows) {
            this.setState(() => ({
                isLoading: false,
                options: this.getOptionsFromSelectedRows(nextProps, nextProps.selectedRows),
            }));
        }
    }

    getOptionsFromSelectedRows(props: OwnProps, selectedRows: ISelectRowsResult) {
        if (selectedRows) {
            const models = Map<string, any>(fromJS(selectedRows.models));
            const { schemaName, queryName } = props.queryColumn.lookup;
            return formatLookupSelectInputOptions(
                props.queryColumn.lookup,
                models.get(resolveKey(schemaName, queryName)),
                props.sort === undefined
            );
        } else {
            return undefined;
        }
    }

    getOptions() {
        const { containerFilter, containerPath, filterArray, queryColumn, sort } = this.props;

        if (!queryColumn || !queryColumn.isLookup()) {
            throw 'querygrid forms/input/<LookupSelectInput> only works with lookup columns.';
        } else if (queryColumn.displayAsLookup === false) {
            console.warn(
                'querygrid forms/input/<LookupSelectInput> received lookup column that is explicitly set displayAsLookup = false'
            );
        }
        this.setState(() => ({ isLoading: true }));

        const { schemaName, queryName } = queryColumn.lookup;
        selectRowsDeprecated({ containerFilter, containerPath, schemaName, queryName, filterArray, sort })
            .then(response => {
                this.setState(() => ({
                    isLoading: false,
                    options: this.getOptionsFromSelectedRows(this.props, response),
                }));
            })
            .catch(reason => {
                console.error(reason);
                this.setState(() => ({ isLoading: false, options: [] }));
            });
    }

    render() {
        const { queryColumn, value } = this.props;
        const { options } = this.state;

        if (!options) {
            return <LoadingSpinner />;
        }

        // if multiValued = 'junction', the select should support MultiSelect and the value should be joined as an array of strings
        // !Except for the faked up parent column (DataInputs/<DataClassName> in Insert.tsx) where a comma separated string is required
        const multiple = queryColumn.isJunctionLookup(),
            joinValues = multiple && !queryColumn.isDataInput(),
            id = this._id;

        const inputProps = Object.assign(
            {
                // properties that can be overridden
                id,
                label: <LabelOverlay column={queryColumn} inputId={id} isFormsy={false} />,
                multiple,
                name: queryColumn.fieldKey,
                required: queryColumn.required,
            },
            this.props,
            {
                // properties that cannot be changed
                joinValues,
                options,
                // If joinValues is true, and a value is present ensure value is passed in as an Array<string>
                value: joinValues && value && !Array.isArray(value) ? [value] : value,
            }
        );

        return <SelectInput {...inputProps} options={options} />;
    }
}
