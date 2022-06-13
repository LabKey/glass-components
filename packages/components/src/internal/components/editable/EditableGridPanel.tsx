import React, { FC, memo, useCallback, useMemo, useState } from 'react';
import { fromJS, List, Map, OrderedMap } from 'immutable';
import classNames from 'classnames';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { EditorModel, EditorModelProps } from '../../models';

import { getUniqueIdColumnMetadata } from '../entities/utils';

import { QueryColumn } from '../../../public/QueryColumn';


import { EditableGrid, SharedEditableGridPanelProps } from './EditableGrid';
import { EXPORT_TYPES } from '../../constants';
import { exportEditedData, getEditorTableData } from './utils';
import { ExportOption } from '../../../public/QueryModel/ExportMenu';

interface Props extends SharedEditableGridPanelProps {
    editorModel: EditorModel | EditorModel[];
    model: QueryModel | QueryModel[];
    onChange: (
        editorModelChanges: Partial<EditorModelProps>,
        dataKeys?: List<any>,
        data?: Map<string, Map<string, any>>,
        index?: number
    ) => void;
}

const exportHandler = (
    exportType: EXPORT_TYPES,
    models: QueryModel[],
    editorModels: EditorModel[],
    readOnlyColumns: List<string>,
    activeTab: number,
    extraColumns?: Array<Partial<QueryColumn>>
): void => {
    let headings = OrderedMap<string, string>();
    let editorData = OrderedMap<string, Map<string, any>>();
    models.forEach((queryModel, idx) => {
        const [modelHeadings, modelEditorData] = getEditorTableData(
            editorModels[idx],
            queryModel,
            readOnlyColumns,
            headings,
            editorData,
            extraColumns
        );
        headings = modelHeadings;
        editorData = modelEditorData;
    });

    const rows = [];
    editorData.forEach(rowMap => rows.push([...rowMap.toArray().values()]));
    const exportData = [headings.toArray(), ...rows];

    exportEditedData(exportType, 'data', exportData, models[activeTab]);
};

/**
 * Note that there are some cases which will call the onChange callback prop back to back (i.e. see LookupCell.onInputChange)
 * and pass through different sets of `editorModelChanges`. In that case, you will want to make sure that your onChange
 * handler is getting the current state object before merging in the `editorModelChanges`. See example in platform/core
 * (core/src/client/LabKeyUIComponentsPage/EditableGridPage.tsx) which uses the set state function which takes a function
 * as the first parameter instead of the new state object.
 */
export const EditableGridPanel: FC<Props> = memo(props => {
    const {
        editorModel,
        model,
        onChange,
        title,
        bsStyle,
        className = '',
        columnMetadata,
        getColumnMetadata,
        readonlyRows,
        getReadOnlyRows,
        updateColumns,
        getUpdateColumns,
        getTabHeader,
        getTabTitle,
        readOnlyColumns,
        extraExportColumns,
        ...gridProps
    } = props;

    const [activeTab, setActiveTab] = useState<number>(props.activeTab ?? 0);
    const models = Array.isArray(model) ? model : [model];
    const activeModel = models[activeTab];
    const editorModels = Array.isArray(editorModel) ? editorModel : [editorModel];
    const activeEditorModel = editorModels[activeTab];
    const hasTabs = models.length > 1;

    const _onChange = useCallback(
        (editorModelChanges: Partial<EditorModelProps>, dataKeys?: List<any>, data?: Map<any, Map<string, any>>) =>
            onChange(editorModelChanges, dataKeys, data, activeTab),
        [activeTab, onChange]
    );

    // TODO: When EditableGridPanelDeprecated is removed we should be able to just pass model.rows and model.orderedRows
    //  to the EditableGrid.
    const { orderedRows, queryInfo, rows } = activeModel;
    const data = useMemo(() => fromJS(rows), [rows]);
    const dataKeys = useMemo(() => fromJS(orderedRows), [orderedRows]);
    const error = activeModel.hasLoadErrors
        ? activeModel.loadErrors[0] ?? 'Something went wrong loading the data.'
        : undefined;

    let activeColumnMetadata = columnMetadata;
    if (!activeColumnMetadata && getColumnMetadata) activeColumnMetadata = getColumnMetadata(activeTab);
    if (!activeColumnMetadata) activeColumnMetadata = getUniqueIdColumnMetadata(queryInfo);

    let activeReadOnlyRows = readonlyRows;
    if (!activeReadOnlyRows && getReadOnlyRows) activeReadOnlyRows = getReadOnlyRows(activeTab);

    let activeUpdateColumns = updateColumns;
    if (!activeUpdateColumns && getUpdateColumns) activeUpdateColumns = getUpdateColumns(activeTab);

    const exportHandlerCallback = useCallback((option: ExportOption) => {
        exportHandler(option.type, models, editorModels, readOnlyColumns, activeTab, extraExportColumns);
    }, [models, editorModels, readOnlyColumns, activeTab]);

    const onTabClick = useCallback(setActiveTab, []);

    const editableGrid = (
        <EditableGrid
            {...gridProps}
            columnMetadata={activeColumnMetadata}
            data={data}
            dataKeys={dataKeys}
            editorModel={activeEditorModel}
            error={error}
            onChange={_onChange}
            queryInfo={queryInfo}
            readonlyRows={activeReadOnlyRows}
            readOnlyColumns={readOnlyColumns}
            updateColumns={activeUpdateColumns}
            allowExport={true}
            exportHandler={exportHandlerCallback}
        />
    );

    if (!title) {
        return editableGrid;
    }

    return (
        <div className={`panel ${bsStyle === 'info' ? 'panel-info' : 'panel-default'} ${className}`}>
            <div className="panel-heading">{title}</div>
            <div className="panel-body table-responsive">
                {hasTabs && (
                    <ul className="nav nav-tabs">
                        {models.map((tabModel, index) => {
                            if (tabModel) {
                                let tabTitle = tabModel.title ?? tabModel.queryName;
                                if (getTabTitle) tabTitle = getTabTitle(index);

                                const classes = classNames({
                                    active: activeModel.id === tabModel.id,
                                });

                                return (
                                    <li key={tabModel.id} className={classes}>
                                        <a onClick={() => onTabClick(index)}>{tabTitle}</a>
                                    </li>
                                );
                            }
                            return null;
                        })}
                    </ul>
                )}
                {getTabHeader?.(activeTab)}
                {editableGrid}
            </div>
        </div>
    );
});
