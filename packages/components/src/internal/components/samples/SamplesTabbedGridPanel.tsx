import React, { ComponentType, FC, memo, useCallback, useMemo, useState } from 'react';
import { Set, List, Map } from 'immutable';
import { AuditBehaviorTypes, Filter } from '@labkey/api';

import {
    App,
    createNotification,
    dismissNotifications,
    EXPORT_TYPES,
    GridAliquotViewSelector,
    gridIdInvalidate,
    InjectedQueryModels,
    invalidateLineageResults,
    IS_ALIQUOT_COL,
    MAX_EDITABLE_GRID_ROWS,
    NO_UPDATES_MESSAGE,
    queryGridInvalidate,
    RequiresModelAndActions,
    resolveErrorMessage,
    SampleTypeDataType,
    SchemaQuery,
    TabbedGridPanel,
    updateRows,
    User,
    withTimeout,
} from '../../..';

import { TabbedGridPanelProps } from '../../../public/QueryModel/TabbedGridPanel';

import { SamplesEditableGrid, SamplesEditableGridProps } from './SamplesEditableGrid';
import { SamplesBulkUpdateForm } from './SamplesBulkUpdateForm';
import { ALIQUOT_FILTER_MODE } from './SampleAliquotViewSelector';
import { SampleGridButtonProps } from './models';

const EXPORT_TYPES_WITH_LABEL = Set.of(EXPORT_TYPES.CSV, EXPORT_TYPES.EXCEL, EXPORT_TYPES.TSV, EXPORT_TYPES.LABEL);

type EditableGridData = {
    updateData: any;
    dataForSelection: Map<string, any>;
    idsForSelection: List<any>;
};

interface Props extends InjectedQueryModels {
    asPanel?: boolean;
    afterSampleActionComplete?: () => void;
    canPrintLabels?: boolean;
    createBtnParentType?: string;
    createBtnParentKey?: string;
    excludedCreateMenuKeys?: List<string>;
    initialTabId?: string; // use if you have multiple tabs but want to start on something other then the first one
    onPrintLabel?: () => void;
    modelId?: string; // if a usage wants to just show a single GridPanel, they should provide a modelId prop
    sampleAliquotType?: ALIQUOT_FILTER_MODE; // the init sampleAliquotType, requires all query models to have completed loading queryInfo prior to rendering of the component
    tabbedGridPanelProps?: Partial<TabbedGridPanelProps>;
    samplesEditableGridProps: Partial<SamplesEditableGridProps>;
    gridButtons?: ComponentType<SampleGridButtonProps & RequiresModelAndActions>;
    gridButtonProps?: any;
    getSampleAuditBehaviorType: () => AuditBehaviorTypes;
    user: User;
    withTitle?: boolean;
}

export const SamplesTabbedGridPanel: FC<Props> = memo(props => {
    const {
        actions,
        queryModels,
        modelId,
        user,
        asPanel,
        canPrintLabels,
        onPrintLabel,
        excludedCreateMenuKeys,
        afterSampleActionComplete,
        initialTabId,
        createBtnParentType,
        createBtnParentKey,
        sampleAliquotType,
        samplesEditableGridProps,
        gridButtons,
        gridButtonProps,
        getSampleAuditBehaviorType,
        tabbedGridPanelProps,
        withTitle,
    } = props;
    const onLabelExport = { [EXPORT_TYPES.LABEL]: onPrintLabel };

    const onTabSelect = useCallback((tab: string) => {
        setActiveTabId(tab);
    }, []);
    const tabs = useMemo(() => {
        return modelId ? [modelId] : Object.keys(queryModels);
    }, [modelId, queryModels]);
    const [activeTabId, setActiveTabId] = useState<string>(initialTabId ?? tabs[0]);

    const activeModel = useMemo(() => queryModels[activeTabId], [activeTabId, queryModels]);
    const hasSelection = useMemo(() => activeModel.hasSelections, [activeModel.selections]);
    const hasValidMaxSelection = useMemo(() => {
        const selSize = activeModel.selections?.size ?? 0;
        return selSize > 0 && selSize <= MAX_EDITABLE_GRID_ROWS;
    }, [activeModel.selections]);

    const [isEditing, setIsEditing] = useState<boolean>();
    const [showBulkUpdate, setShowBulkUpdate] = useState<boolean>();
    const [selectionData, setSelectionData] = useState<Map<string, any>>();

    const [editableGridData, setEditableGridData] = useState<EditableGridData>();
    const onEditSelectionInGrid = useCallback(
        (
            editableGridUpdateData: any,
            editableGridDataForSelection: Map<string, any>,
            editableGridDataIdsForSelection: List<any>
        ): Promise<any> => {
            setEditableGridData({
                updateData: editableGridUpdateData,
                dataForSelection: editableGridDataForSelection,
                idsForSelection: editableGridDataIdsForSelection,
            });
            return new Promise<any>(resolve => resolve(editableGridDataForSelection));
        },
        []
    );

    const [activeActiveAliquotMode, setActiveAliquotMode] = useState<string>(
        sampleAliquotType ?? ALIQUOT_FILTER_MODE.all
    );

    const onAliquotViewUpdate = useCallback(
        (aliquotFilter: Filter.IFilter, filterAliquotColName: string, newAliquotMode: ALIQUOT_FILTER_MODE) => {
            setActiveAliquotMode(newAliquotMode);
            Object.values(queryModels).forEach(model => {
                // account for the case where the aliquot column is in the queryModel via a lookup from the sample ID
                let aliquotColName = IS_ALIQUOT_COL;
                if (!model.getColumnByFieldKey(IS_ALIQUOT_COL)) {
                    aliquotColName = model.allColumns?.find(
                        c => c.fieldKey?.toLowerCase().indexOf('/' + IS_ALIQUOT_COL.toLowerCase()) > -1
                    )?.fieldKey;
                }

                const newFilters = model.filterArray.filter(filter => {
                    return aliquotColName?.toLowerCase() !== filter.getColumnName().toLowerCase();
                });

                if (aliquotFilter && aliquotColName) {
                    newFilters.push(Filter.create(aliquotColName, newAliquotMode === ALIQUOT_FILTER_MODE.aliquots));
                }

                if (model.queryInfo) {
                    actions.setFilters(model.id, newFilters, true);
                }
            });
        },
        [queryModels, actions]
    );

    const onShowBulkUpdate = useCallback(() => {
        if (hasSelection) {
            dismissNotifications();
            setShowBulkUpdate(true);
        }
    }, [hasSelection]);

    const onBulkUpdateError = useCallback((message: string) => {
        withTimeout(() => {
            createNotification(message);
        });
    }, []);

    const onBulkUpdateComplete = useCallback(
        (data: Map<string, any>, submitForEdit = false) => {
            setShowBulkUpdate(false);
            setSelectionData(submitForEdit ? data : undefined);
            actions.loadModel(activeModel.id, true);
        },
        [actions, activeModel.id]
    );

    const toggleEditWithGridUpdate = useCallback(() => {
        if (isEditing) {
            resetState();
        } else if (hasValidMaxSelection) {
            dismissNotifications();
            setIsEditing(true);
        }
    }, [isEditing, hasValidMaxSelection]);

    const resetState = useCallback(() => {
        setEditableGridData(undefined);
        setSelectionData(undefined);
        setIsEditing(false);
        setShowBulkUpdate(false);
    }, []);

    const _afterSampleActionComplete = useCallback(() => {
        dismissNotifications();
        actions.loadModel(activeModel.id, true);
        afterSampleActionComplete?.();
        resetState();
    }, [actions, activeModel.id]);

    const afterSampleDelete = useCallback(
        (rowsToKeep: any[]) => {
            const ids = [];
            if (rowsToKeep.length > 0) {
                rowsToKeep.forEach(row => {
                    ids.push(row['RowId']);
                });
            }
            actions.replaceSelections(activeModel.id, ids);

            _afterSampleActionComplete();
        },
        [actions, activeModel]
    );

    const onUpdateRows = useCallback((schemaQuery: SchemaQuery, rows: any[]): Promise<void> => {
        if (rows.length === 0) {
            return new Promise(resolve => {
                dismissNotifications();
                withTimeout(() => {
                    createNotification(NO_UPDATES_MESSAGE);
                });

                resolve();
            });
        } else {
            return updateRows({
                schemaQuery,
                rows,
                auditBehavior: getSampleAuditBehaviorType(),
            })
                .then(result => {
                    queryGridInvalidate(schemaQuery);
                    invalidateLineageResults();
                    gridIdInvalidate('update-samples-grid', true);
                    dismissNotifications(); // get rid of any error notifications that have already been created
                    withTimeout(() => {
                        const noun =
                            rows.length === 1 ? SampleTypeDataType.nounSingular : SampleTypeDataType.nounPlural;
                        createNotification('Successfully updated ' + result.rows.length + ' ' + noun + '.');
                    });
                })
                .catch(reason => {
                    dismissNotifications(); // get rid of any error notifications that have already been created
                    createNotification({
                        alertClass: 'danger',
                        message: resolveErrorMessage(
                            reason,
                            SampleTypeDataType.nounSingular,
                            SampleTypeDataType.nounPlural,
                            'update'
                        ),
                    });
                });
        }
    }, []);

    const _gridButtonProps = {
        ...gridButtonProps,
        afterSampleDelete,
        afterSampleActionComplete: _afterSampleActionComplete,
        createBtnParentType: hasSelection ? undefined : createBtnParentType,
        createBtnParentKey: hasSelection ? undefined : createBtnParentKey,
        excludedCreateMenuKeys,
        model: activeModel,
        showBulkUpdate: onShowBulkUpdate,
        toggleEditWithGridUpdate,
        onTabbedViewAliquotSelectorUpdate: onAliquotViewUpdate,
        user,
        initAliquotMode: activeActiveAliquotMode,
    };

    return (
        <>
            {isEditing || selectionData ? (
                <SamplesEditableGrid
                    {...samplesEditableGridProps}
                    determineLineage
                    determineStorage={App.userCanEditStorageData(user)}
                    displayQueryModel={activeModel}
                    editableGridDataForSelection={editableGridData?.dataForSelection}
                    editableGridDataIdsForSelection={editableGridData?.idsForSelection}
                    editableGridUpdateData={editableGridData?.updateData}
                    onGridEditCancel={resetState}
                    onGridEditComplete={resetState}
                    parentDataTypes={samplesEditableGridProps.parentDataTypes}
                    sampleSet={activeModel.schemaQuery.queryName}
                    samplesGridRequiredColumns={samplesEditableGridProps.samplesGridRequiredColumns}
                    selection={List(Array.from(activeModel.selections))}
                    selectionData={selectionData}
                    user={user}
                />
            ) : (
                <TabbedGridPanel
                    {...tabbedGridPanelProps}
                    title={withTitle ? 'Samples' : undefined}
                    asPanel={asPanel}
                    actions={actions}
                    queryModels={queryModels}
                    activeModelId={activeTabId}
                    tabOrder={tabs}
                    onTabSelect={onTabSelect}
                    ButtonsComponent={gridButtons}
                    buttonsComponentProps={_gridButtonProps}
                    ButtonsComponentRight={SampleTabbedGridButtonsRight}
                    supportedExportTypes={canPrintLabels ? EXPORT_TYPES_WITH_LABEL : undefined}
                    onExport={canPrintLabels ? onLabelExport : undefined}
                    showRowCountOnTabs
                />
            )}
            {showBulkUpdate && (
                <SamplesBulkUpdateForm
                    selection={List(Array.from(activeModel.selections))}
                    sampleSet={activeModel.schemaQuery.queryName}
                    sampleSetLabel={activeModel.queryInfo.title}
                    queryModel={activeModel}
                    hasValidMaxSelection={() => hasValidMaxSelection}
                    onCancel={resetState}
                    onBulkUpdateError={onBulkUpdateError}
                    onBulkUpdateComplete={onBulkUpdateComplete}
                    editSelectionInGrid={onEditSelectionInGrid}
                    updateRows={onUpdateRows}
                    determineStorage // determine storage for discard consumed samples
                />
            )}
        </>
    );
});

SamplesTabbedGridPanel.defaultProps = {
    asPanel: true,
    withTitle: true,
    canPrintLabels: false,
    excludedCreateMenuKeys: List<string>(),
};

SamplesTabbedGridPanel.displayName = 'SamplesTabbedGridPanel';

const SampleTabbedGridButtonsRight: FC<SampleGridButtonProps & RequiresModelAndActions> = props => {
    const { model, onTabbedViewAliquotSelectorUpdate, initAliquotMode } = props;

    return (
        <GridAliquotViewSelector
            queryModel={model}
            updateFilter={onTabbedViewAliquotSelectorUpdate}
            initAliquotMode={initAliquotMode}
        />
    );
};
