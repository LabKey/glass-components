import React from 'react';
import { fromJS, List, Map, OrderedMap } from 'immutable';

import { AuditBehaviorTypes, Query, Utils } from '@labkey/api';

import {
    App,
    caseInsensitive,
    createNotification,
    deleteRows,
    dismissNotifications,
    EditableGridLoaderFromSelection,
    EditorModel,
    EntityDataType,
    getLineageEditorUpdateColumns,
    getSelectedData,
    IEntityTypeOption,
    IGridResponse,
    invalidateLineageResults,
    LineageEditableGridLoaderFromSelection,
    LoadingSpinner,
    naturalSort,
    NO_UPDATES_MESSAGE,
    QueryColumn,
    queryGridInvalidate,
    QueryInfo,
    QueryModel,
    quoteValueWithDelimiters,
    resolveErrorMessage,
    SampleStateType,
    SchemaQuery,
    SCHEMAS,
    User,
} from '../../..';

import { EntityChoice } from '../entities/models';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { IEditableGridLoader } from '../../QueryGridModel';

import { UpdateGridTab } from '../editable/EditableGridPanelForUpdateWithLineage';

import { SamplesSelectionProviderProps, SamplesSelectionResultProps } from './models';
import { getOriginalParentsFromLineage, getUpdatedLineageRows } from './actions';
import { SamplesSelectionProvider } from './SamplesSelectionContextProvider';
import { DiscardConsumedSamplesModal } from './DiscardConsumedSamplesModal';
import { SamplesEditableGridPanelForUpdate } from './SamplesEditableGridPanelForUpdate';

export interface SamplesEditableGridProps {
    api?: ComponentsAPIWrapper;
    user: User;
    displayQueryModel: QueryModel;
    onGridEditCancel: () => any;
    onGridEditComplete: () => any;
    selectionData: Map<string, any>;
    editableGridUpdateData?: OrderedMap<string, any>;
    samplesGridRequiredColumns?: string[];
    samplesGridOmittedColumns?: List<string>;
    getConvertedStorageUpdateData?: (
        storageRows: any[],
        sampleItems: {},
        sampleTypeUnit: string,
        noStorageSamples: any[],
        selection: List<any>
    ) => any;
    invalidateSampleQueries?: (schemaQuery: SchemaQuery) => void;
    parentDataTypes: List<EntityDataType>;
    combineParentTypes?: boolean;
}

type Props = SamplesEditableGridProps & SamplesSelectionProviderProps & SamplesSelectionResultProps;

const STORAGE_UPDATE_FIELDS = ['StoredAmount', 'Units', 'FreezeThawCount'];
const SAMPLES_EDIT_GRID_ID = 'update-samples-grid';
const SAMPLES_STORAGE_EDIT_GRID_ID = 'update-samples-storage-grid';
const SAMPLES_LINEAGE_EDIT_GRID_ID = 'update-samples-lineage-grid';

const INVENTORY_ITEM_QS = SchemaQuery.create('inventory', 'item');

interface State {
    originalParents: Record<string, List<EntityChoice>>;
    parentTypeOptions: Map<string, List<IEntityTypeOption>>;
    pendingUpdateDataRows: any[];
    showDiscardDialog: boolean;
    discardConsumed: boolean;
    discardSamplesComment: string;
    discardSamplesCount: number;
    totalEditCount: number;
    consumedStatusIds: number[];
    includedTabs: UpdateGridTab[];
}

class SamplesEditableGridBase extends React.Component<Props, State> {
    private readOnlyColumns: List<string> = undefined;

    private _hasError: boolean;

    static defaultProps = {
        samplesGridRequiredColumns: ['description', 'AliquotedFromLSID'],
        api: getDefaultAPIWrapper(),
    };

    constructor(props: Props) {
        super(props);
        this._hasError = false;

        const includedTabs = [];
        if (props.determineSampleData) includedTabs.push(UpdateGridTab.Samples);
        if (props.determineStorage) includedTabs.push(UpdateGridTab.Storage);
        if (props.determineLineage) includedTabs.push(UpdateGridTab.Lineage);
        this.state = {
            originalParents: undefined,
            parentTypeOptions: undefined,
            pendingUpdateDataRows: undefined,
            showDiscardDialog: false,
            discardConsumed: true,
            discardSamplesComment: undefined,
            discardSamplesCount: undefined,
            totalEditCount: undefined,
            consumedStatusIds: undefined,
            includedTabs,
        };
    }

    componentDidMount(): void {
        this.init();
    }

    init(): void {
        dismissNotifications();
        this.initLineageEditableGrid();

        this.props.api.samples
            .getSampleStatuses()
            .then(statuses => {
                const consumedStatusIds = [];
                statuses.forEach(status => {
                    if (status.stateType == SampleStateType.Consumed) consumedStatusIds.push(status.rowId);
                });
                this.setState({
                    consumedStatusIds,
                });
            })
            .catch(() => {
                this._hasError = true;
                createNotification({
                    alertClass: 'danger',
                    message:
                        'Error loading sample statuses. If you want to discard any samples being updated to a Consumed status, you will have to do that separately.',
                });
            });
    }

    componentWillUnmount(): void {
        // dismiss grid error msg, retain success msg
        if (this._hasError) dismissNotifications();
    }

    getReadOnlyColumns(): List<string> {
        const { displayQueryModel } = this.props;

        if (!this.readOnlyColumns) {
            this.readOnlyColumns = List<string>([
                'Name',
                ...displayQueryModel.queryInfo
                    .getUniqueIdColumns()
                    .map(column => column.fieldKey)
                    .toArray(),
            ]);
        }
        return this.readOnlyColumns;
    }

    getSamplesGridRequiredColumns(): string[] {
        const { displayQueryModel, samplesGridRequiredColumns } = this.props;
        return [
            ...samplesGridRequiredColumns,
            ...displayQueryModel.queryInfo
                .getUniqueIdColumns()
                .map(column => column.fieldKey)
                .toArray(),
        ];
    }

    getSchemaQuery = (): SchemaQuery => {
        const { displayQueryModel } = this.props;
        return displayQueryModel?.queryInfo?.schemaQuery;
    };

    initLineageEditableGrid = async (): Promise<void> => {
        const { determineLineage, parentDataTypes } = this.props;
        if (determineLineage) {
            const { originalParents, parentTypeOptions } = await getOriginalParentsFromLineage(
                this.props.sampleLineage,
                parentDataTypes.toArray()
            );
            this.setState(() => ({ originalParents, parentTypeOptions }));
        }
    };

    updateAllTabRows = (updateDataRows: any[], skipConfirmDiscard?: boolean): Promise<any> => {
        const { aliquots, sampleItems, noStorageSamples, invalidateSampleQueries } = this.props;
        const { discardConsumed, discardSamplesComment, consumedStatusIds, includedTabs } = this.state;

        let sampleSchemaQuery: SchemaQuery = null,
            sampleRows: any[] = [],
            storageRows: any[] = [],
            lineageRows: any[] = [],
            discardStorageRows: any[] = [];
        updateDataRows.forEach(data => {
            const tabIndex = data.tabIndex;
            if (includedTabs[tabIndex] === UpdateGridTab.Storage) {
                storageRows = data.updatedRows;
                sampleSchemaQuery = data.schemaQuery;
            } else if (includedTabs[tabIndex] === UpdateGridTab.Lineage) {
                lineageRows = getUpdatedLineageRows(data.updatedRows, data.originalRows, aliquots);
                sampleSchemaQuery = data.schemaQuery;
            } else {
                sampleRows = data.updatedRows;
                sampleSchemaQuery = data.schemaQuery;
                if (sampleItems) {
                    sampleRows.forEach(row => {
                        if (consumedStatusIds.indexOf(caseInsensitive(row, 'sampleState')) > -1) {
                            const sampleId = caseInsensitive(row, 'RowId');
                            const existingStorageItem = sampleItems[sampleId];
                            if (existingStorageItem) {
                                discardStorageRows.push({
                                    rowId: existingStorageItem.rowId,
                                });
                            }
                        }
                    });
                }
            }
        });

        // combine sampleRows and lineageRows so that only one update command is used, i.e. so that we only get
        // one audit entry for the update of a given sample
        if (lineageRows.length > 0) {
            const sampleRowIdIndexMap = sampleRows.reduce((map, row, index) => {
                map[caseInsensitive(row, 'RowId')] = index;
                return map;
            }, {});
            lineageRows.forEach(lineageRow => {
                const rowId = caseInsensitive(lineageRow, 'RowId');
                if (sampleRowIdIndexMap[rowId] !== undefined) {
                    // merge in sample metadata row data with lineage row data for the same RowId
                    sampleRows[sampleRowIdIndexMap[rowId]] = {
                        ...sampleRows[sampleRowIdIndexMap[rowId]],
                        ...lineageRow,
                    };
                } else {
                    sampleRows.push(lineageRow);
                }
            });
        }

        const sampleIds = new Set();
        sampleRows.forEach(row => {
            const sampleId = caseInsensitive(row, 'RowId');
            sampleIds.add(sampleId);
        });
        storageRows.forEach(row => {
            const sampleId = caseInsensitive(row, 'RowId');
            if (noStorageSamples.indexOf(sampleId) === -1) sampleIds.add(sampleId);
        });
        const totalSamplesToUpdate = sampleIds.size;
        const noun = totalSamplesToUpdate === 1 ? 'sample' : 'samples';

        if (!skipConfirmDiscard && App.isFreezerManagementEnabled() && discardStorageRows.length > 0) {
            return new Promise(resolve => {
                this.setState({
                    pendingUpdateDataRows: updateDataRows,
                    showDiscardDialog: App.isFreezerManagementEnabled(),
                    discardSamplesCount: discardStorageRows.length,
                    totalEditCount: totalSamplesToUpdate,
                });
                resolve(false);
            });
        }

        if (storageRows.length === 0 && sampleRows.length === 0) {
            return new Promise(resolve => {
                this._hasError = false;
                dismissNotifications();
                createNotification(NO_UPDATES_MESSAGE);
                resolve('No changes to be saved.');
            });
        }

        const convertedStorageData = this.getStorageUpdateData(storageRows);
        if (convertedStorageData?.errors) {
            return new Promise(resolve => {
                this._hasError = true;
                dismissNotifications(); // get rid of any error notifications that have already been created
                createNotification({
                    alertClass: 'danger',
                    message: convertedStorageData?.errors.join('\n'),
                });
                resolve('There were errors during the save.');
            });
        }

        const commands = [];
        if (sampleRows.length > 0) {
            commands.push({
                command: 'update',
                schemaName: sampleSchemaQuery.schemaName,
                queryName: sampleSchemaQuery.queryName,
                rows: sampleRows,
                auditBehavior: AuditBehaviorTypes.DETAILED,
            });
        }
        if (convertedStorageData?.normalizedRows.length > 0) {
            commands.push({
                command: 'update',
                schemaName: INVENTORY_ITEM_QS.schemaName,
                queryName: INVENTORY_ITEM_QS.queryName,
                rows: convertedStorageData.normalizedRows,
                auditBehavior: AuditBehaviorTypes.DETAILED,
            });
        }

        return new Promise((resolve, reject) => {
            Query.saveRows({
                commands,
                success: async result => {
                    this._hasError = false;
                    let discardSuccessMsg = '';
                    const doDiscard = discardStorageRows?.length > 0 && discardConsumed;

                    if (doDiscard) {
                        try {
                            await deleteRows({
                                schemaQuery: SCHEMAS.INVENTORY.ITEMS,
                                rows: discardStorageRows,
                                auditBehavior: AuditBehaviorTypes.DETAILED,
                                auditUserComment: discardSamplesComment,
                            });
                            discardSuccessMsg =
                                ' and discarded ' +
                                discardStorageRows.length +
                                (discardStorageRows.length > 1 ? ' samples' : ' sample') +
                                ' from storage';
                        } catch (error) {
                            console.error(error);
                            this._hasError = true;
                            dismissNotifications();
                            createNotification({
                                alertClass: 'danger',
                                message: resolveErrorMessage(error, 'sample', 'samples', 'discard'),
                            });
                            resolve(error);
                        }
                    }

                    if (sampleSchemaQuery) {
                        if (invalidateSampleQueries) {
                            invalidateSampleQueries(sampleSchemaQuery);
                        } else {
                            queryGridInvalidate(sampleSchemaQuery);
                            invalidateLineageResults();
                        }
                    }

                    if (convertedStorageData?.normalizedRows.length > 0 || doDiscard)
                        queryGridInvalidate(INVENTORY_ITEM_QS);

                    dismissNotifications(); // get rid of any error notifications that have already been created

                    createNotification(
                        'Successfully updated ' + totalSamplesToUpdate + ' ' + noun + discardSuccessMsg + '.'
                    );

                    this.onGridEditComplete();

                    resolve(result);
                },
                failure: reason => {
                    this._hasError = true;
                    dismissNotifications(); // get rid of any error notifications that have already been created
                    createNotification({
                        alertClass: 'danger',
                        message: resolveErrorMessage(reason, 'sample', 'samples', 'update'),
                    });
                    resolve(reason);
                },
            });
        });
    };

    getStorageUpdateData(storageRows: any[]) {
        const { sampleItems, sampleTypeDomainFields, noStorageSamples, selection, getConvertedStorageUpdateData } =
            this.props;
        if (storageRows.length === 0 || !getConvertedStorageUpdateData) return null;

        const sampleTypeUnit = sampleTypeDomainFields.metricUnit;

        // the current implementation of getConvertedStorageUpdateData uses @labkey/freezermanager, so it cannot be moved to ui-components
        return getConvertedStorageUpdateData(storageRows, sampleItems, sampleTypeUnit, noStorageSamples, selection);
    }

    onGridEditComplete = (): void => {
        const { onGridEditComplete } = this.props;
        if (!this._hasError) onGridEditComplete();
    };

    hasAliquots = (): boolean => {
        const { aliquots } = this.props;
        return aliquots && aliquots.length > 0;
    };

    getSamplesUpdateColumns = (tabInd: number): List<QueryColumn> => {
        if (this.getCurrentTab(tabInd) !== UpdateGridTab.Samples) return undefined;

        const { displayQueryModel, sampleTypeDomainFields } = this.props;
        const allColumns = displayQueryModel.queryInfo.getUpdateColumns(this.getReadOnlyColumns());

        // remove aliquot specific fields if all selected are samples
        const keepAliquotFields = this.hasAliquots();
        if (keepAliquotFields) return allColumns;

        let updatedColumns = List<QueryColumn>();
        allColumns.forEach(col => {
            if (sampleTypeDomainFields.aliquotFields.indexOf(col.fieldKey.toLowerCase()) === -1)
                updatedColumns = updatedColumns.push(col);
        });

        return updatedColumns;
    };

    getSelectedSamplesNoun = (): string => {
        const { aliquots, displayQueryModel } = this.props;
        const allAliquots = this.hasAliquots() && aliquots.length === displayQueryModel.selections.size;
        return allAliquots ? 'aliquot' : 'sample';
    };

    getCurrentTab = (tabInd: number): number => {
        const { includedTabs } = this.state;
        return tabInd === undefined ? includedTabs[0] : includedTabs[tabInd];
    };

    onConfirmConsumedSamplesDialog = (shouldDiscard: boolean, comment: string): any => {
        const { pendingUpdateDataRows } = this.state;
        this.setState(
            {
                discardConsumed: shouldDiscard,
                discardSamplesComment: comment,
                showDiscardDialog: false,
            },
            () => {
                return this.updateAllTabRows(pendingUpdateDataRows, true);
            }
        );
    };

    onDismissConsumedSamplesDialog = (): any => {
        this.setState({
            showDiscardDialog: false,
        });
    };

    render() {
        const {
            onGridEditCancel,
            determineSampleData,
            determineStorage,
            determineLineage,
            displayQueryModel,
            editableGridUpdateData,
            selectionData,
            aliquots,
            sampleTypeDomainFields,
            samplesGridOmittedColumns,
            sampleLineageKeys,
            sampleLineage,
            parentDataTypes,
            combineParentTypes,
            noStorageSamples,
        } = this.props;
        const {
            discardSamplesCount,
            totalEditCount,
            showDiscardDialog,
            originalParents,
            includedTabs,
            parentTypeOptions,
        } = this.state;
        const allAliquots = this.hasAliquots() && aliquots.length === displayQueryModel.selections.size;

        if (determineLineage && !originalParents) return <LoadingSpinner />;

        const loaders = [];
        if (determineSampleData) {
            loaders.push(
                new EditableGridLoaderFromSelection(
                    SAMPLES_EDIT_GRID_ID,
                    displayQueryModel.queryInfo,
                    editableGridUpdateData,
                    this.getSamplesGridRequiredColumns(),
                    samplesGridOmittedColumns ? samplesGridOmittedColumns.toArray() : [],
                    this.getSamplesUpdateColumns(0),
                    allAliquots ? [] : aliquots,
                    allAliquots ? undefined : sampleTypeDomainFields.metaFields
                )
            );
        }

        if (determineStorage) {
            let updateColumns = List<QueryColumn>();
            let queryInfoCols = OrderedMap<string, QueryColumn>();
            displayQueryModel.queryInfo.columns.forEach((column, key) => {
                if (key?.toLowerCase() === 'rowid') {
                    queryInfoCols = queryInfoCols.set(key, column);
                } else if (key?.toLowerCase() === 'name') {
                    queryInfoCols = queryInfoCols.set(key, column);
                    updateColumns = updateColumns.push(column);
                } else if (STORAGE_UPDATE_FIELDS.indexOf(column.fieldKey) > -1) {
                    const updatedCol = column.merge({
                        shownInUpdateView: true,
                        userEditable: true,
                    }) as QueryColumn;
                    queryInfoCols = queryInfoCols.set(key, updatedCol);
                    updateColumns = updateColumns.push(updatedCol);
                }
            });
            const storageQueryInfo = displayQueryModel.queryInfo
                .merge({ columns: queryInfoCols })
                .asImmutable() as QueryInfo;

            loaders.push(
                new StorageEditableGridLoaderFromSelection(
                    SAMPLES_STORAGE_EDIT_GRID_ID,
                    storageQueryInfo,
                    STORAGE_UPDATE_FIELDS,
                    [],
                    updateColumns
                )
            );
        }

        if (determineLineage) {
            const { queryInfoColumns, updateColumns } = getLineageEditorUpdateColumns(
                displayQueryModel,
                originalParents
            );
            const lineageQueryInfo = displayQueryModel.queryInfo.merge({ columns: queryInfoColumns }) as QueryInfo;

            loaders.push(
                new LineageEditableGridLoaderFromSelection(
                    SAMPLES_LINEAGE_EDIT_GRID_ID,
                    lineageQueryInfo,
                    updateColumns,
                    originalParents,
                    sampleLineageKeys,
                    sampleLineage
                )
            );
        }

        return (
            <>
                {showDiscardDialog && (
                    <DiscardConsumedSamplesModal
                        consumedSampleCount={discardSamplesCount}
                        totalSampleCount={totalEditCount}
                        onConfirm={this.onConfirmConsumedSamplesDialog}
                        onCancel={this.onDismissConsumedSamplesDialog}
                    />
                )}
                <SamplesEditableGridPanelForUpdate
                    queryModel={displayQueryModel}
                    loaders={loaders}
                    selectionData={selectionData}
                    updateAllTabRows={this.updateAllTabRows}
                    onCancel={onGridEditCancel}
                    onComplete={this.onGridEditComplete}
                    idField="RowId"
                    singularNoun={this.getSelectedSamplesNoun()}
                    pluralNoun={this.getSelectedSamplesNoun() + 's'}
                    readOnlyColumns={this.getReadOnlyColumns()}
                    includedTabs={includedTabs}
                    parentDataTypes={parentDataTypes}
                    combineParentTypes={combineParentTypes}
                    aliquots={aliquots}
                    noStorageSamples={noStorageSamples}
                    sampleTypeDomainFields={sampleTypeDomainFields}
                    parentTypeOptions={parentTypeOptions}
                />
            </>
        );
    }
}

export const SamplesEditableGrid = SamplesSelectionProvider<SamplesEditableGridProps & SamplesSelectionProviderProps>(
    SamplesEditableGridBase
);

class StorageEditableGridLoaderFromSelection implements IEditableGridLoader {
    id: string;
    queryInfo: QueryInfo;
    requiredColumns: string[];
    omittedColumns: string[];
    updateColumns: List<QueryColumn>;

    constructor(
        id: string,
        queryInfo: QueryInfo,
        requiredColumns: string[],
        omittedColumns: string[],
        updateColumns: List<QueryColumn>
    ) {
        this.id = id;
        this.queryInfo = queryInfo;
        this.requiredColumns = requiredColumns;
        this.omittedColumns = omittedColumns;
        this.updateColumns = updateColumns;
    }

    fetch(queryModel: QueryModel): Promise<IGridResponse> {
        return new Promise((resolve, reject) => {
            const { schemaName, queryName, queryParameters } = queryModel;
            const columnString = queryModel.getRequestColumnsString(this.requiredColumns, this.omittedColumns);
            const sorts = queryModel.sorts.join(',');
            const selectedIds = [...queryModel.selections];
            return getSelectedData(schemaName, queryName, selectedIds, columnString, sorts, queryParameters)
                .then(response => {
                    const { data, dataIds, totalRows } = response;
                    let convertedData = OrderedMap<string, any>();
                    data.forEach((d, key) => {
                        let updatedRow = d;
                        if (d) {
                            const storedAmount = d.getIn(['StoredAmount', 'value']);
                            if (storedAmount != null) {
                                updatedRow = updatedRow.set(
                                    'StoredAmount',
                                    d.get('StoredAmount').set('value', storedAmount)
                                );
                            }
                            convertedData = convertedData.set(key, updatedRow);
                        }
                    });
                    resolve({
                        data: EditorModel.convertQueryDataToEditorData(convertedData),
                        dataIds,
                        totalRows,
                    });
                })
                .catch(error => {
                    reject({
                        error,
                    });
                });
        });
    }
}
