import { Filter, Query, Utils } from '@labkey/api';
import { List, Map, OrderedMap } from 'immutable';
import React, { PureComponent, ReactNode } from 'react';

import { Operation, QueryColumn } from '../../../public/QueryColumn';

import { QueryInfo } from '../../../public/QueryInfo';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { getSelectedDataDeprecated } from '../../actions';

import { capitalizeFirstChar, caseInsensitive, getCommonDataValues, getUpdatedData } from '../../util/utils';

import { QueryInfoForm } from './QueryInfoForm';

type UpdateRows = (schemaQuery: SchemaQuery, rows: any[], comment?: string) => Promise<any>;
type UpdateModel = (changes: any) => Promise<void>;

function isUpdateModel(fn: UpdateRows | UpdateModel): fn is UpdateModel {
    return fn.length === 1; // UpdateModel has only one parameter
}

interface Props {
    containerFilter?: Query.ContainerFilter;
    disabled?: boolean;
    displayValueFields?: string[];
    header?: ReactNode;
    includeCommentField?: boolean;
    itemLabel?: string;
    onAdditionalFormDataChange?: (name: string, value: any) => any;
    onCancel: () => void;
    onComplete: (data: any, submitForEdit: boolean, auditUserComment?: string) => void;
    onError?: (message: string) => void;
    onSubmitForEdit?: (
        updateData: OrderedMap<string, any>,
        dataForSelection: Map<string, any>,
        dataIdsForSelection: List<any>,
        comment?: string
    ) => any;
    pluralNoun?: string;
    queryFilters?: Record<string, List<Filter.IFilter>>;
    queryInfo: QueryInfo;
    requiredColumns?: string[]; // Columns we must retrieve data for
    selectedIds: string[];
    singularNoun?: string;
    // sortString is used so we render editable grids with the proper sorts when using onSubmitForEdit
    sortString?: string;
    uniqueFieldKey?: string;
    updateRows: UpdateRows | UpdateModel;
    // queryInfo.schemaQuery.viewName is likely undefined (i.e., not the current viewName)
    viewName: string;
}

interface State {
    containerPaths: string[];
    dataForSelection: Map<string, any>;
    dataIdsForSelection: List<any>;
    displayFieldUpdates: any;
    formData: Map<string, any>;
    isLoadingDataForSelection: boolean;
    originalDataForSelection: Map<string, any>;
}

export class BulkUpdateForm extends PureComponent<Props, State> {
    static defaultProps = {
        pluralNoun: 'rows',
        singularNoun: 'row',
        includeCommentField: true,
    };

    constructor(props) {
        super(props);

        this.state = {
            containerPaths: undefined,
            dataForSelection: undefined,
            dataIdsForSelection: undefined,
            displayFieldUpdates: {},
            formData: undefined,
            isLoadingDataForSelection: true,
            originalDataForSelection: undefined,
        };
    }

    componentDidMount = async (): Promise<void> => {
        const { onCancel, pluralNoun, queryInfo, selectedIds, sortString, viewName, requiredColumns } = this.props;
        const { schemaName, name } = queryInfo;

        const columns = queryInfo
            .getPkCols()
            .concat(queryInfo.getUpdateColumns())
            .map(c => c.fieldKey)
            .concat(requiredColumns);

        try {
            const { data, dataIds } = await getSelectedDataDeprecated(
                schemaName,
                name,
                selectedIds,
                columns,
                sortString,
                undefined,
                viewName
            );
            const mappedData = this.mapDataForDisplayFields(data);
            this.setState({
                containerPaths: mappedData.containerPaths,
                originalDataForSelection: data,
                dataForSelection: mappedData.data,
                displayFieldUpdates: mappedData.bulkUpdates,
                dataIdsForSelection: dataIds,
                isLoadingDataForSelection: false,
            });
        } catch (reason) {
            console.error(reason);
            this.props.onError?.('There was a problem loading the data for the selected ' + pluralNoun + '.');
            onCancel();
        }
    };

    mapDataForDisplayFields(data: Map<string, any>): {
        bulkUpdates: OrderedMap<string, any>;
        containerPaths?: string[];
        data: Map<string, any>;
    } {
        const { displayValueFields } = this.props;
        let updates = Map<string, any>();
        let bulkUpdates = OrderedMap<string, any>();
        const containerPaths = new Set<string>();

        let conflictKeys = new Set<string>();
        data.forEach((rowData, id) => {
            if (rowData) {
                const containerPath =
                    caseInsensitive(rowData.toJS(), 'Folder') ?? caseInsensitive(rowData.toJS(), 'Container');
                if (containerPath?.value) containerPaths.add(containerPath.value);

                if (displayValueFields) {
                    let updatedRow = Map<string, any>();
                    rowData.forEach((field, key) => {
                        if (displayValueFields.includes(key)) {
                            const valuesDiffer =
                                field.has('displayValue') && field.get('value') !== field.get('displayValue');
                            let comparisonValue = field.get('displayValue') ?? field.get('value');
                            if (comparisonValue) comparisonValue += ''; // force to string
                            if (!conflictKeys.has(key)) {
                                if (!bulkUpdates.has(key)) {
                                    bulkUpdates = bulkUpdates.set(key, comparisonValue);
                                } else if (bulkUpdates.get(key) !== comparisonValue) {
                                    bulkUpdates = bulkUpdates.remove(key);
                                    conflictKeys = conflictKeys.add(key);
                                }
                            }
                            if (valuesDiffer) {
                                field = field.set('value', comparisonValue);
                            }
                        }
                        updatedRow = updatedRow.set(key, field);
                    });
                    if (!updatedRow.isEmpty()) {
                        updates = updates.set(id, updatedRow);
                    }
                }
            }
        });
        if (!updates.isEmpty()) {
            return { data: data.merge(updates), bulkUpdates, containerPaths: Array.from(containerPaths) };
        }
        return { data, bulkUpdates, containerPaths: Array.from(containerPaths) };
    }

    getSelectionCount(): number {
        return this.props.selectedIds.length;
    }

    getSelectionNoun(): string {
        const { singularNoun, pluralNoun } = this.props;
        return this.getSelectionCount() === 1 ? singularNoun.toLowerCase() : pluralNoun.toLowerCase();
    }

    getTitle(): string {
        const { itemLabel } = this.props;
        const prefix = 'Update ' + this.getSelectionCount() + ' ' + this.getSelectionNoun();
        return itemLabel ? prefix + " selected from '" + this.props.itemLabel + "'" : prefix;
    }

    columnFilter = (col: QueryColumn): boolean => {
        const lcUniqueFieldKey = this.props.uniqueFieldKey?.toLowerCase();
        return col.isUpdateColumn && (!lcUniqueFieldKey || col.name.toLowerCase() !== lcUniqueFieldKey);
    };

    onFormChangeWithData = (formData: Map<string, any>): void => {
        this.setState({ formData });
    };

    onSubmit = (data: any, comment?: string): Promise<any> => {
        const { queryInfo, updateRows } = this.props;
        const { displayFieldUpdates } = this.state;
        const updateData = displayFieldUpdates.merge(data);

        if (isUpdateModel(updateRows)) {
            return updateRows(updateData);
        }

        const rows = !Utils.isEmptyObj(data)
            ? getUpdatedData(this.state.originalDataForSelection, updateData, queryInfo.pkCols, queryInfo.altUpdateKeys)
            : [];

        return updateRows(queryInfo.schemaQuery, rows, comment);
    };

    onSubmitForEdit = (updateData: OrderedMap<string, any>, comment?: string) => {
        const { dataForSelection, dataIdsForSelection } = this.state;
        // TODO: 100% of usages return Promise.resolve(dataForSelection), so we really don't need to expect
        //  onSubmitForEdit to return anything.
        return this.props.onSubmitForEdit(updateData, dataForSelection, dataIdsForSelection, comment);
    };

    renderBulkUpdateHeader() {
        const { header } = this.props;
        if (!header) return null;

        const noun = this.getSelectionNoun();

        return (
            <>
                <div>
                    <p>
                        Make changes to the selected {noun}. Enable a field to update or remove the value for the
                        selected {noun}.
                    </p>
                    {this.getSelectionCount() > 1 && (
                        <p>To update individual {noun} in this selection group, select "Edit with Grid".</p>
                    )}
                </div>
                {header}
            </>
        );
    }

    render() {
        const { formData, isLoadingDataForSelection, dataForSelection, containerPaths } = this.state;
        const {
            containerFilter,
            onCancel,
            onComplete,
            pluralNoun,
            queryFilters,
            queryInfo,
            onAdditionalFormDataChange,
            disabled,
            includeCommentField,
            onSubmitForEdit,
        } = this.props;
        const fieldValues =
            isLoadingDataForSelection || !dataForSelection ? undefined : getCommonDataValues(dataForSelection);

        // if all selectedIds are from the same containerPath, use that for the lookups via QueryFormInputs > QuerySelect,
        // if selections are from multiple containerPaths, disable the lookup and file field inputs
        const containerPath = containerPaths?.length === 1 ? containerPaths[0] : undefined;
        const preventCrossFolderEnable = containerPaths?.length > 1;

        const _onSubmitForEdit = onSubmitForEdit ? this.onSubmitForEdit : undefined;
        const values = formData ? { ...fieldValues, ...formData.toJS() } : fieldValues;

        return (
            <QueryInfoForm
                allowFieldDisable
                asModal
                checkRequiredFields={false}
                columnFilter={this.columnFilter}
                containerFilter={containerFilter}
                containerPath={containerPath}
                disabled={disabled}
                preventCrossFolderEnable={preventCrossFolderEnable}
                fieldValues={values}
                header={this.renderBulkUpdateHeader()}
                includeCommentField={includeCommentField}
                includeCountField={false}
                initiallyDisableFields
                isLoading={isLoadingDataForSelection}
                onHide={onCancel}
                operation={Operation.update}
                onFormChangeWithData={this.onFormChangeWithData}
                onSubmitForEdit={_onSubmitForEdit}
                onSubmit={this.onSubmit}
                onSuccess={onComplete}
                renderFileInputs
                queryInfo={queryInfo}
                queryFilters={queryFilters}
                showLabelAsterisk
                submitForEditText="Edit with Grid"
                submitText={`Update ${capitalizeFirstChar(pluralNoun)}`}
                pluralNoun={pluralNoun}
                title={this.getTitle()}
                onAdditionalFormDataChange={onAdditionalFormDataChange}
            />
        );
    }
}
