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
import classNames from 'classnames';
import React, { ChangeEvent, MouseEvent, PureComponent, ReactNode } from 'react';
import { Button, OverlayTrigger, Popover } from 'react-bootstrap';
import { List, Map, OrderedMap, Set } from 'immutable';

import {
    addRows,
    addRowsPerPivotValue,
    beginDrag,
    copyEvent,
    endDrag,
    genCellKey,
    inDrag,
    pasteEvent,
    updateGridFromBulkForm,
} from '../../actions';

import { headerSelectionCell } from '../../renderers';
import { QueryInfoForm, QueryInfoFormProps } from '../forms/QueryInfoForm';
import {
    GRID_CHECKBOX_OPTIONS,
    GRID_EDIT_INDEX,
    GRID_SELECTION_INDEX,
    MAX_EDITABLE_GRID_ROWS,
    MODIFICATION_TYPES,
    SELECTION_TYPES,
} from '../../constants';
import { Alert, cancelEvent, DeleteIcon, Grid, GridColumn, Key, QueryColumn, QueryInfo } from '../../..';

import { blurActiveElement, capitalizeFirstChar, caseInsensitive, not } from '../../util/utils';

import { CellMessage, EditorModel, EditorModelProps, ValueDescriptor } from '../../models';

import { BulkAddUpdateForm } from '../forms/BulkAddUpdateForm';

import { AddRowsControl, AddRowsControlProps, PlacementType } from './Controls';
import { Cell, CellActions } from './Cell';
import { EDITABLE_GRID_CONTAINER_CLS } from './constants';
import { EditableGridExportMenu, ExportOption } from '../../../public/QueryModel/ExportMenu';

function isCellEmpty(values: List<ValueDescriptor>): boolean {
    return !values || values.isEmpty() || values.some(v => v.raw === undefined || v.raw === null || v.raw === '');
}

function moveDown(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx, rowIdx: rowIdx + 1 };
}

function moveLeft(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx: colIdx - 1, rowIdx };
}

function moveRight(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx: colIdx + 1, rowIdx };
}

function moveUp(colIdx: number, rowIdx: number): { colIdx: number; rowIdx: number } {
    return { colIdx, rowIdx: rowIdx - 1 };
}

const COUNT_COL = new GridColumn({
    index: GRID_EDIT_INDEX,
    tableCell: true,
    title: 'Row',
    width: 45,
    // style cast to "any" type due to @types/react@16.3.14 switch to csstype package usage which does not declare
    // "textAlign" property correctly for <td> elements.
    cell: (d, r, c, rn) => (
        <td className="cellular-count" key={c.index} style={{ textAlign: c.align || 'left' } as any}>
            <div className="cellular-count-static-content">{rn + 1}</div>
        </td>
    ),
});

// the column index for cell values and cell messages does not include either the selection
// column or the row number column, so we adjust the value passed to <Cell> to accommodate.
function inputCellFactory(
    queryInfo: QueryInfo,
    editorModel: EditorModel,
    allowSelection: boolean,
    hideCountCol: boolean,
    columnMetadata: EditableColumnMetadata,
    readonlyRows: List<any>,
    lockedRows: List<any>,
    cellActions: CellActions
) {
    return (value: any, row: any, c: GridColumn, rn: number, cn: number) => {
        let colOffset = 0;
        if (allowSelection) colOffset += 1;
        if (!hideCountCol) colOffset += 1;

        const colIdx = cn - colOffset;
        const isReadonlyCol = columnMetadata ? columnMetadata.readOnly : false;
        let isReadonlyRow = false;
        let isReadonlyCell = false;
        let isLockedRow = false;

        if (readonlyRows || columnMetadata?.isReadOnlyCell || lockedRows) {
            const keyCols = queryInfo.getPkCols();
            if (keyCols.size == 1) {
                let key = caseInsensitive(row.toJS(), keyCols.get(0).fieldKey);
                if (Array.isArray(key)) key = key[0];
                if (typeof key === 'object') key = key.value;

                if (readonlyRows) isReadonlyRow = key && readonlyRows.contains(key);
                if (columnMetadata?.isReadOnlyCell) isReadonlyCell = columnMetadata.isReadOnlyCell(key);
                if (lockedRows) isLockedRow = key && lockedRows.contains(key);
            } else {
                console.warn(
                    'Setting readonly rows or cells for models with ' +
                        keyCols.size +
                        ' keys is not currently supported.'
                );
            }
        }

        return (
            <Cell
                cellActions={cellActions}
                col={c.raw}
                colIdx={colIdx}
                key={inputCellKey(c.raw, row)}
                placeholder={columnMetadata ? columnMetadata.placeholder : undefined}
                readOnly={isReadonlyCol || isReadonlyRow || isReadonlyCell}
                locked={isLockedRow}
                rowIdx={rn}
                focused={editorModel ? editorModel.isFocused(colIdx, rn) : false}
                message={editorModel ? editorModel.getMessage(colIdx, rn) : undefined}
                selected={editorModel ? editorModel.isSelected(colIdx, rn) : false}
                selection={editorModel ? editorModel.inSelection(colIdx, rn) : false}
                values={editorModel ? editorModel.getValue(colIdx, rn) : List<ValueDescriptor>()}
                filteredLookupValues={columnMetadata ? columnMetadata.filteredLookupValues : undefined}
                filteredLookupKeys={columnMetadata ? columnMetadata.filteredLookupKeys : undefined}
            />
        );
    };
}

function inputCellKey(col: QueryColumn, row: any): string {
    const indexKey = row.get(GRID_EDIT_INDEX);

    if (indexKey === undefined || indexKey === null) {
        throw new Error(`QueryFormInputs.encodeName: Unable to encode name for field "${col.fieldKey}".`);
    }

    return [col.fieldKey, indexKey].join('_$Cell$_');
}

export interface EditableColumnMetadata {
    caption?: string;
    filteredLookupKeys?: List<any>;
    filteredLookupValues?: List<string>;
    hideTitleTooltip?: boolean;
    isReadOnlyCell?: (rowKey: string) => boolean;
    placeholder?: string;
    popoverClassName?: string;
    readOnly?: boolean;
    toolTip?: ReactNode;
}

export interface BulkAddData {
    pivotKey?: string;
    pivotValues?: string[];
    totalItems?: number;
    validationMsg?: ReactNode;
}

export interface SharedEditableGridPanelProps extends SharedEditableGridProps {
    activeTab?: number;
    bsStyle?: any;
    className?: string;
    getColumnMetadata?: (tabId?: number) => Map<string, EditableColumnMetadata>;
    getReadOnlyRows?: (tabId?: number) => List<any>;
    getTabHeader?: (tabId?: number) => ReactNode;
    getTabTitle?: (tabId?: number) => string;
    getUpdateColumns?: (tabId?: number) => List<QueryColumn>;
    title?: string;
}

export interface SharedEditableGridProps {
    addControlProps?: Partial<AddRowsControlProps>;
    allowAdd?: boolean;
    allowBulkAdd?: boolean;
    allowBulkRemove?: boolean;
    allowBulkUpdate?: boolean;
    allowFieldDisable?: boolean;
    allowRemove?: boolean;
    bordered?: boolean;
    bulkAddProps?: Partial<QueryInfoFormProps>;
    bulkAddText?: string;
    bulkRemoveText?: string;
    bulkUpdateProps?: Partial<QueryInfoFormProps>;
    bulkUpdateText?: string;
    columnMetadata?: Map<string, EditableColumnMetadata>;
    condensed?: boolean;
    disabled?: boolean;
    emptyGridMsg?: string;
    extraExportColumns?: Array<Partial<QueryColumn>>;
    forUpdate?: boolean;
    hideCountCol?: boolean;
    insertColumns?: List<QueryColumn>;
    isSubmitting?: boolean;
    lockedRows?: List<any>;   // list of key values for rows that are readonly.
    maxRows?: number;
    notDeletable?: List<any>;   // list of key values that cannot be deleted.
    processBulkData?: (data: OrderedMap<string, any>) => BulkAddData;
    readOnlyColumns?: List<string>;
    readonlyRows?: List<any>;   // list of key values for rows that are locked. locked rows are readonly but might have a different display from readonly rows
    removeColumnTitle?: string;
    striped?: boolean;
    updateColumns?: List<QueryColumn>;
    rowNumColumn?: GridColumn;
}

export interface EditableGridProps extends SharedEditableGridProps {
    data?: Map<any, Map<string, any>>;
    dataKeys?: List<any>;
    editorModel: EditorModel;
    error: string;
    onChange: (
        editorModelChanges: Partial<EditorModelProps>,
        dataKeys?: List<any>,
        data?: Map<any, Map<string, any>>
    ) => void;
    queryInfo: QueryInfo;
    exportHandler?: (option: ExportOption) => void;
}

export interface EditableGridState {
    selected: Set<number>;
    selectedState: GRID_CHECKBOX_OPTIONS;
    showBulkAdd: boolean;
    showBulkUpdate: boolean;
    showMask: boolean;
}

export class EditableGrid extends PureComponent<EditableGridProps, EditableGridState> {
    static defaultProps = {
        allowAdd: true,
        allowBulkAdd: false,
        allowBulkRemove: false,
        allowBulkUpdate: false,
        allowRemove: false,
        removeColumnTitle: 'Delete',
        addControlProps: {
            nounPlural: 'Rows',
            nounSingular: 'Row',
        },
        bordered: false,
        bulkAddText: 'Bulk Add',
        bulkRemoveText: 'Delete Rows',
        bulkUpdateText: 'Bulk Update',
        columnMetadata: Map<string, EditableColumnMetadata>(),
        notDeletable: List<any>(),
        condensed: false,
        disabled: false,
        isSubmitting: false,
        striped: false,
        maxRows: MAX_EDITABLE_GRID_ROWS,
        hideCountCol: false,
        rowNumColumn: COUNT_COL,
    };

    private maskDelay: number;

    cellActions: CellActions;

    constructor(props: EditableGridProps) {
        super(props);
        this.cellActions = {
            clearSelection: this.clearSelection,
            focusCell: this.focusCell,
            inDrag: this.inDrag,
            modifyCell: this.modifyCell,
            selectCell: this.selectCell,
        };
        this.state = {
            selected: Set<number>(),
            selectedState: GRID_CHECKBOX_OPTIONS.NONE,
            showBulkAdd: false,
            showBulkUpdate: false,
            showMask: false,
        };
    }

    componentDidMount() {
        document.addEventListener('copy', this.onCopy);
        document.addEventListener('paste', this.onPaste);
    }

    componentWillUnmount() {
        document.removeEventListener('copy', this.onCopy);
        document.removeEventListener('paste', this.onPaste);
    }

    select = (row: Map<string, any>, event: ChangeEvent<HTMLInputElement>): void => {
        const checked = event.currentTarget.checked;

        this.setState((state): EditableGridState => {
            const { dataKeys } = this.props;
            const key = row.get(GRID_EDIT_INDEX);
            let selected = state.selected;

            if (checked) {
                selected = selected.add(key);
            } else {
                selected = selected.remove(key);
            }

            let selectedState;

            if (selected.size === 0) {
                selectedState = GRID_CHECKBOX_OPTIONS.NONE;
            } else if (dataKeys.size === selected.size) {
                selectedState = GRID_CHECKBOX_OPTIONS.ALL;
            } else {
                selectedState = GRID_CHECKBOX_OPTIONS.SOME;
            }

            return { ...state, selected, selectedState };
        });
    };

    selectAll = (evt: ChangeEvent<HTMLInputElement>): void => {
        const { dataKeys } = this.props;
        const selected = evt.currentTarget.checked === true && this.state.selectedState !== GRID_CHECKBOX_OPTIONS.ALL;
        this.setState(() => {
            return {
                selected: selected ? Set<number>(dataKeys.map((v, i) => i, Set<number>())) : Set<number>(),
                selectedState: selected ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.NONE,
            };
        });
    };

    getColumns = (): List<QueryColumn> => {
        const { editorModel, forUpdate, insertColumns, queryInfo, readOnlyColumns, updateColumns } = this.props;
        return editorModel.getColumns(queryInfo, forUpdate, readOnlyColumns, insertColumns, updateColumns);
    };

    focusCell = (colIdx: number, rowIdx: number, clearValue?: boolean): void => {
        const { editorModel, onChange } = this.props;
        const cellKey = genCellKey(colIdx, rowIdx);
        const changes: Partial<EditorModel> = {
            cellMessages: editorModel.cellMessages.remove(cellKey),
            focusColIdx: colIdx,
            focusRowIdx: rowIdx,
            focusValue: editorModel.getIn(['cellValues', cellKey]),
            selectedColIdx: colIdx,
            selectedRowIdx: rowIdx,
        };

        if (clearValue) {
            changes.cellValues = editorModel.cellValues.set(cellKey, List<ValueDescriptor>());
        }

        onChange(changes);
    };

    clearSelection = (): void => {
        const { onChange } = this.props;
        onChange({ selectedColIdx: -1, selectedRowIdx: -1 });
    };

    applySelection = (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES): Partial<EditorModel> => {
        const { editorModel } = this.props;
        const { colCount, rowCount } = editorModel;
        let selectionCells = Set<string>();
        const hasSelection = editorModel.hasSelection();
        let selectedColIdx = colIdx;
        let selectedRowIdx = rowIdx;

        switch (selection) {
            case SELECTION_TYPES.ALL:
                for (let c = 0; c < colCount; c++) {
                    for (let r = 0; r < rowCount; r++) {
                        selectionCells = selectionCells.add(genCellKey(c, r));
                    }
                }
                break;
            case SELECTION_TYPES.AREA:
                selectedColIdx = editorModel.selectedColIdx;
                selectedRowIdx = editorModel.selectedRowIdx;

                if (hasSelection) {
                    const upperLeft = [Math.min(selectedColIdx, colIdx), Math.min(selectedRowIdx, rowIdx)];
                    const bottomRight = [Math.max(selectedColIdx, colIdx), Math.max(selectedRowIdx, rowIdx)];
                    const maxColumn = Math.min(bottomRight[0], colCount - 1);
                    const maxRow = Math.min(bottomRight[1], rowCount - 1);

                    for (let c = upperLeft[0]; c <= maxColumn; c++) {
                        for (let r = upperLeft[1]; r <= maxRow; r++) {
                            selectionCells = selectionCells.add(genCellKey(c, r));
                        }
                    }
                }
                break;
            case SELECTION_TYPES.SINGLE:
                selectionCells = editorModel.selectionCells.add(genCellKey(colIdx, rowIdx));
                break;
        }

        if (selectionCells.size > 0) {
            // if a cell was previously selected and there are remaining selectionCells then mark the previously
            // selected cell as in "selection"
            if (hasSelection) {
                selectionCells = selectionCells.add(genCellKey(editorModel.selectedColIdx, editorModel.selectedRowIdx));
            }
        }

        return { selectedColIdx, selectedRowIdx, selectionCells };
    };

    selectCell = (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue?: boolean): void => {
        const { editorModel, onChange } = this.props;
        const { cellValues, colCount, focusValue, rowCount } = editorModel;

        if (colIdx < 0 || rowIdx < 0 || colIdx >= colCount) {
            // out of bounds, do nothing
            return;
        }

        // 33855: select last row
        if (rowIdx === rowCount) {
            rowIdx = rowIdx - 1;
        }

        if (rowIdx < rowCount) {
            const changes: Partial<EditorModel> = {
                focusColIdx: -1,
                focusRowIdx: -1,
                ...this.applySelection(colIdx, rowIdx, selection),
            };

            if (resetValue) {
                changes.focusValue = undefined;
                changes.cellValues = cellValues.set(genCellKey(colIdx, rowIdx), focusValue);
            }

            onChange(changes);
        }
    };

    modifyCell = (colIdx: number, rowIdx: number, newValues: ValueDescriptor[], mod: MODIFICATION_TYPES): void => {
        const { editorModel, onChange } = this.props;
        const { cellMessages, cellValues } = editorModel;
        const cellKey = genCellKey(colIdx, rowIdx);
        const keyPath = ['cellValues', cellKey];
        const changes: Partial<EditorModel> = { cellMessages: cellMessages.delete(cellKey) };

        if (mod === MODIFICATION_TYPES.ADD) {
            const values: List<ValueDescriptor> = editorModel.getIn(keyPath);

            if (values !== undefined) {
                changes.cellValues = cellValues.set(cellKey, values.push(...newValues));
            } else {
                changes.cellValues = cellValues.set(cellKey, List(newValues));
            }
        } else if (mod === MODIFICATION_TYPES.REPLACE) {
            changes.cellValues = cellValues.set(cellKey, List(newValues));
        } else if (mod === MODIFICATION_TYPES.REMOVE) {
            let values: List<ValueDescriptor> = editorModel.getIn(keyPath);

            for (let v = 0; v < newValues.length; v++) {
                const idx = values.findIndex(vd => vd.display === newValues[v].display && vd.raw === newValues[v].raw);

                if (idx > -1) {
                    values = values.remove(idx);
                }
            }

            changes.cellValues = cellValues.set(cellKey, values);
        } else if (mod == MODIFICATION_TYPES.REMOVE_ALL) {
            if (editorModel.selectionCells.size > 0) {
                // Remove all values and messages for the selected cells
                changes.cellValues = editorModel.cellValues.reduce((result, value, key) => {
                    if (editorModel.selectionCells.contains(key)) {
                        return result.set(key, List());
                    }
                    return result.set(key, value);
                }, Map<string, List<ValueDescriptor>>());
                changes.cellMessages = editorModel.cellMessages.reduce((result, value, key) => {
                    if (editorModel.selectionCells.contains(key)) {
                        return result.remove(key);
                    }
                    return result.set(key, value);
                }, Map<string, CellMessage>());
            } else {
                changes.cellValues = cellValues.set(cellKey, List());
            }
        }

        onChange(changes);
    };

    removeRows = (dataIdIndexes: Set<number>): void => {
        const { dataKeys, editorModel, onChange } = this.props;
        let deletedIds = Set<number>();
        const updatedKeys = this.props.dataKeys.filter((_, i) => !dataIdIndexes.has(i)).toList();
        const updatedData = this.props.data.reduce((result, value, key) => {
            if (updatedKeys.has(key)) {
                return result.set(key, value);
            }

            deletedIds = deletedIds.add(key);
            return result;
        }, Map<any, Map<string, any>>());
        const cellReducer = (result, value, cellKey) => {
            const [colIdx, oldRowIdx] = cellKey.split('-').map(v => parseInt(v, 10));

            // If this value is part of a deleted row don't include it in the result.
            if (dataIdIndexes.has(oldRowIdx)) return result;

            const key = dataKeys.get(oldRowIdx);
            const newRowIdx = updatedKeys.indexOf(key);
            return result.set(genCellKey(colIdx, newRowIdx), value);
        };
        const cellMessages = editorModel.cellMessages.reduce(cellReducer, Map<string, CellMessage>());
        const cellValues = editorModel.cellValues.reduce(cellReducer, Map<string, ValueDescriptor>());
        const editorModelChanges = {
            deletedIds: editorModel.deletedIds.merge(deletedIds),
            focusColIdx: -1,
            focusRowIdx: -1,
            rowCount: editorModel.rowCount - dataIdIndexes.size,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: Set<string>(),
            cellMessages,
            cellValues,
        };

        onChange(editorModelChanges, updatedKeys, updatedData);

        this.setState(() => ({
            selected: Set<number>(),
            selectedState: GRID_CHECKBOX_OPTIONS.NONE,
        }));
    };

    removeSelected = (): void => {
        this.removeRows(this.state.selected);
    };

    getLoweredColumnMetadata = (): Map<string, EditableColumnMetadata> =>
        this.props.columnMetadata?.reduce(
            (result, value, key) => result.set(key.toLowerCase(), value),
            Map<string, EditableColumnMetadata>()
        );

    generateColumns = (): List<GridColumn> => {
        const {
            allowBulkRemove,
            allowBulkUpdate,
            allowRemove,
            editorModel,
            hideCountCol,
            queryInfo,
            rowNumColumn,
            readonlyRows,
            lockedRows,
        } = this.props;
        let gridColumns = List<GridColumn>();

        if (allowBulkRemove || allowBulkUpdate) {
            const selColumn = new GridColumn({
                index: GRID_SELECTION_INDEX,
                title: '&nbsp;',
                cell: (selected: boolean, row) => (
                    <input
                        style={{ margin: '0 8px' }}
                        checked={this.state.selected.contains(row.get(GRID_EDIT_INDEX))}
                        type="checkbox"
                        onChange={this.select.bind(this, row)}
                    />
                ),
            });
            gridColumns = gridColumns.push(selColumn);
        }
        if (!hideCountCol) gridColumns = gridColumns.push(rowNumColumn ? rowNumColumn : COUNT_COL);

        const loweredColumnMetadata = this.getLoweredColumnMetadata();

        this.getColumns().forEach(qCol => {
            const metadata = loweredColumnMetadata.get(qCol.fieldKey.toLowerCase());
            const metaCaption = metadata?.caption;
            gridColumns = gridColumns.push(
                new GridColumn({
                    align: qCol.align,
                    cell: inputCellFactory(
                        queryInfo,
                        editorModel,
                        allowBulkRemove || allowBulkUpdate,
                        hideCountCol,
                        metadata,
                        readonlyRows,
                        lockedRows,
                        this.cellActions
                    ),
                    index: qCol.fieldKey,
                    raw: qCol,
                    title: metaCaption ?? qCol.caption,
                    width: 100,
                    hideTooltip: metadata?.hideTitleTooltip,
                })
            );
        });
        if (allowRemove) {
            gridColumns = gridColumns.push(
                new GridColumn({
                    index: GRID_EDIT_INDEX,
                    tableCell: true,
                    title: this.props.removeColumnTitle,
                    width: 45,
                    cell: (d, row: Map<string, any>, c, rn) => {
                        const keyCols = queryInfo.getPkCols();
                        const size = keyCols.size;
                        let canDelete = true;

                        if (size === 1) {
                            const key = caseInsensitive(row.toJS(), keyCols.get(0).fieldKey);
                            canDelete = !key || !this.props.notDeletable.contains(key);
                        } else {
                            console.warn(
                                `Preventing deletion for models with ${size} keys is not currently supported.`
                            );
                        }

                        return (
                            <td key={'delete' + rn}>
                                {canDelete && <DeleteIcon onDelete={() => this.removeRows(Set([rn]))} />}
                                {!canDelete && <>&nbsp;</>}
                            </td>
                        );
                    },
                })
            );
        }

        return gridColumns;
    };

    renderColumnHeader = (col: GridColumn, metadataKey: string, required?: boolean, format?: string): ReactNode => {
        const label = col.title;
        const loweredColumnMetadata = this.getLoweredColumnMetadata();
        const metadata = loweredColumnMetadata?.has(metadataKey.toLowerCase())
            ? loweredColumnMetadata.get(metadataKey.toLowerCase())
            : undefined;
        const showOverlay = metadata?.toolTip || format;
        return (
            <>
                {label}
                {required && <span className="required-symbol"> *</span>}
                {showOverlay && (
                    <>
                        &nbsp;
                        <OverlayTrigger
                            placement="bottom"
                            overlay={
                                <Popover
                                    id={'popover-' + label}
                                    bsClass="popover"
                                    className={metadata?.popoverClassName}
                                >
                                    {metadata?.toolTip}
                                    {format && <div>Display Format: {format}</div>}
                                </Popover>
                            }
                        >
                            <i className="fa fa-question-circle" />
                        </OverlayTrigger>
                    </>
                )}
            </>
        );
    };

    headerCell = (col: GridColumn): ReactNode => {
        const { allowBulkRemove, allowBulkUpdate, queryInfo } = this.props;

        if ((allowBulkRemove || allowBulkUpdate) && col.index.toLowerCase() == GRID_SELECTION_INDEX) {
            return headerSelectionCell(this.selectAll, this.state.selectedState, false);
        }

        if (queryInfo.getColumn(col.index)) {
            const qColumn = queryInfo.getColumn(col.index);
            return this.renderColumnHeader(col, qColumn.fieldKey, qColumn.required, qColumn.format);
        }

        if (col && col.showHeader) {
            return this.renderColumnHeader(col, col.title, false);
        }

        return null;
    };

    hideMask = (): void => {
        clearTimeout(this.maskDelay);
        this.toggleMask(false);
    };

    inDrag = (): boolean => inDrag(this.props.editorModel.id);

    onCopy = (event: ClipboardEvent): void => {
        const { editorModel, queryInfo } = this.props;
        if (!this.props.disabled) {
            copyEvent(editorModel, queryInfo.getInsertColumns().toArray(), event);
        }
    };

    onKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
        const { disabled, editorModel } = this.props;

        if (disabled || editorModel.hasFocus()) {
            return;
        }

        const colIdx = editorModel.selectedColIdx;
        const rowIdx = editorModel.selectedRowIdx;
        let nextCol;
        let nextRow;

        switch (event.key) {
            case Key.ARROW_LEFT:
                if (event.ctrlKey) {
                    const found = editorModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveLeft);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = 0;
                        nextRow = rowIdx;
                    }
                } else {
                    nextCol = colIdx - 1;
                    nextRow = rowIdx;
                }
                break;

            case Key.ARROW_UP:
                if (event.ctrlKey) {
                    const found = editorModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveUp);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = colIdx;
                        nextRow = 0;
                    }
                } else {
                    nextCol = colIdx;
                    nextRow = rowIdx - 1;
                }
                break;

            case Key.ARROW_RIGHT:
                if (event.ctrlKey) {
                    const found = editorModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveRight);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = editorModel.colCount - 1;
                        nextRow = rowIdx;
                    }
                } else {
                    nextCol = colIdx + 1;
                    nextRow = rowIdx;
                }
                break;

            case Key.ARROW_DOWN:
                if (event.ctrlKey) {
                    const found = editorModel.findNextCell(colIdx, rowIdx, not(isCellEmpty), moveDown);
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = colIdx;
                        nextRow = editorModel.rowCount - 1;
                    }
                } else {
                    nextCol = colIdx;
                    nextRow = rowIdx + 1;
                }
                break;

            case Key.HOME:
                nextCol = 0;
                nextRow = rowIdx;
                break;

            case Key.END:
                nextCol = editorModel.colCount - 1;
                nextRow = rowIdx;
                break;

            default:
                // Ignore all other keys
                break;
        }

        if (nextCol !== undefined && nextRow !== undefined) {
            cancelEvent(event);
            this.selectCell(nextCol, nextRow);
        }
    };

    onMouseDown = (event: MouseEvent): void => {
        if (!this.props.disabled) {
            beginDrag(this.props.editorModel, event);
        }
    };

    onMouseUp = (event: MouseEvent): void => {
        if (!this.props.disabled) {
            endDrag(this.props.editorModel, event);
        }
    };

    onPaste = async (event: ClipboardEvent): Promise<void> => {
        const { allowAdd, columnMetadata, data, dataKeys, disabled, editorModel, onChange, queryInfo, readonlyRows } =
            this.props;

        if (!disabled) {
            this.showMask();
            const changes = await pasteEvent(
                editorModel,
                dataKeys,
                data,
                queryInfo,
                event,
                columnMetadata,
                readonlyRows,
                !allowAdd
            );
            this.hideMask();
            onChange(changes.editorModel, changes.dataKeys, changes.data);
        }
    };

    showMask = (): void => {
        clearTimeout(this.maskDelay);
        this.maskDelay = window.setTimeout(this.toggleMask.bind(this, true), 300);
    };

    toggleMask = (showMask: boolean): void => {
        this.setState({ showMask });
    };

    toggleBulkAdd = (): void => {
        this.setState(
            state => ({ showBulkAdd: !state.showBulkAdd }),
            // Issue 38420: Without this, the BulkUpdate button always retains focus after modal is shown
            blurActiveElement
        );
    };

    toggleBulkUpdate = (): void => {
        this.setState(
            state => ({ showBulkUpdate: !state.showBulkUpdate }),
            // Issue 38420: Without this, the BulkUpdate button always retains focus after modal is shown
            blurActiveElement
        );
    };

    getSelectedRowIndices = (): List<number> => {
        return this.state.selected.toList();
    };

    restoreBulkInsertData = (data: Map<string, any>): Map<string, any> => {
        const allInsertCols = OrderedMap<string, any>().asMutable();
        this.props.queryInfo.getInsertColumns().forEach(col => allInsertCols.set(col.name, undefined));
        return allInsertCols.merge(data).asImmutable();
    };

    bulkAdd = async (bulkData: OrderedMap<string, any>): Promise<void> => {
        const { addControlProps, bulkAddProps, editorModel, data, dataKeys, onChange, processBulkData, queryInfo } =
            this.props;
        const { nounPlural } = addControlProps;
        // numItems is a string because we rely on Formsy to grab the value for us (See QueryInfoForm for details). We
        // need to parseInt the value because we add this variable to other numbers, if it's a string we'll add more
        // rows than we want because 1 + "1" is "11" in JavaScript.
        const numItems = parseInt(bulkData.get('numItems'), 10);
        let pivotKey;
        let pivotValues;

        if (!numItems) {
            return Promise.reject({ exception: 'Quantity unknown.  No ' + nounPlural + ' added.' });
        }

        if (processBulkData) {
            const processedData = processBulkData(bulkData);
            if (processedData.validationMsg) {
                return Promise.reject({ exception: processedData.validationMsg });
            }
            pivotKey = processedData.pivotKey;
            pivotValues = processedData.pivotValues;
        }

        bulkData = bulkData.delete('numItems').delete('creationType');

        if (bulkAddProps.columnFilter) {
            bulkData = this.restoreBulkInsertData(bulkData);
        }

        if (pivotKey && pivotValues?.length > 0) {
            const changes = await addRowsPerPivotValue(
                editorModel,
                dataKeys,
                data,
                queryInfo.getInsertColumns(),
                numItems,
                pivotKey,
                pivotValues,
                bulkData
            );
            onChange(changes.editorModel, changes.dataKeys, changes.data);
        } else {
            const changes = await addRows(
                editorModel,
                dataKeys,
                data,
                queryInfo.getInsertColumns(),
                numItems,
                bulkData
            );
            onChange(changes.editorModel, changes.dataKeys, changes.data);
        }

        // Result of this promise passed to toggleBulkAdd, which doesn't expect anything to be passed
        return Promise.resolve();
    };

    bulkUpdate = async (updatedData: OrderedMap<string, any>): Promise<void> => {
        const { editorModel, queryInfo, onChange } = this.props;
        const selectedIndices = this.getSelectedRowIndices();
        const editorModelChanges = await updateGridFromBulkForm(editorModel, queryInfo, updatedData, selectedIndices);
        onChange(editorModelChanges);
        // The result of this promise is used by toggleBulkUpdate, which doesn't expect anything to be passed
        return Promise.resolve();
    };

    addRows = async (count: number): Promise<void> => {
        const { data, dataKeys, editorModel, onChange, queryInfo } = this.props;
        const changes = await addRows(editorModel, dataKeys, data, queryInfo.getInsertColumns(), count);
        onChange(changes.editorModel, changes.dataKeys, changes.data);
    };

    getAddControlProps = (): Partial<AddRowsControlProps> => {
        const { addControlProps, editorModel, maxRows } = this.props;
        if (maxRows && editorModel.rowCount + addControlProps.maxCount > maxRows) {
            return { ...addControlProps, maxTotalCount: maxRows, maxCount: maxRows - editorModel.rowCount };
        } else {
            return { ...addControlProps, maxTotalCount: maxRows };
        }
    };

    renderAddRowsControl = (placement: PlacementType): ReactNode => {
        const { editorModel, isSubmitting, maxRows } = this.props;
        return (
            <AddRowsControl
                {...this.getAddControlProps()}
                placement={placement}
                disable={isSubmitting || (maxRows && editorModel.rowCount >= maxRows)}
                onAdd={this.addRows}
            />
        );
    };

    renderTopControls = (): ReactNode => {
        const {
            addControlProps,
            allowAdd,
            allowBulkAdd,
            allowBulkRemove,
            allowBulkUpdate,
            bulkAddText,
            bulkRemoveText,
            bulkUpdateText,
            data,
            isSubmitting,
            maxRows,
            editorModel,
            exportHandler,
        } = this.props;
        const nounPlural = addControlProps?.nounPlural ?? 'rows';
        const showAddOnTop = allowAdd && this.getControlsPlacement() !== 'bottom';
        const invalidSel = this.state.selected.size === 0;
        const canAddRows = !isSubmitting && data.size < maxRows;
        const addTitle = canAddRows
            ? 'Add multiple ' + nounPlural + ' with the same values'
            : 'The grid contains the maximum number of ' + nounPlural + '.';

        const allowExport = !!exportHandler;

        return (
            <div className="row QueryGrid-bottom-spacing">
                {showAddOnTop && <div className="col-sm-3">{this.renderAddRowsControl('top')}</div>}
                <div className={showAddOnTop ? 'col-sm-9' : 'col-sm-12'}>
                    {allowBulkAdd && (
                        <span className="control-right">
                            <Button title={addTitle} disabled={!canAddRows} onClick={this.toggleBulkAdd}>
                                {bulkAddText}
                            </Button>
                        </span>
                    )}
                    {allowBulkUpdate && (
                        <span className="control-right">
                            <Button className="control-right" disabled={invalidSel} onClick={this.toggleBulkUpdate}>
                                {bulkUpdateText}
                            </Button>
                        </span>
                    )}
                    {allowBulkRemove && (
                        <span className="control-right">
                            <Button className="control-right" disabled={invalidSel} onClick={this.removeSelected}>
                                {bulkRemoveText}
                            </Button>
                        </span>
                    )}
                    {allowExport && (
                        <span className="control-right pull-right">
                            <EditableGridExportMenu id={editorModel.id} hasData={true} exportHandler={exportHandler} />
                        </span>
                    )}
                </div>
            </div>
        );
    };

    renderBulkAdd = (): ReactNode => {
        const { addControlProps, allowFieldDisable, bulkAddProps, data, maxRows, queryInfo } = this.props;
        const maxToAdd =
            maxRows && maxRows - data.size < MAX_EDITABLE_GRID_ROWS ? maxRows - data.size : MAX_EDITABLE_GRID_ROWS;
        return (
            <QueryInfoForm
                allowFieldDisable={allowFieldDisable}
                onSubmitForEdit={this.bulkAdd}
                asModal
                checkRequiredFields={false}
                showLabelAsterisk
                submitForEditText={`Add ${capitalizeFirstChar(addControlProps.nounPlural)} to Grid`}
                maxCount={maxToAdd}
                onHide={this.toggleBulkAdd}
                onCancel={this.toggleBulkAdd}
                onSuccess={this.toggleBulkAdd}
                queryInfo={queryInfo.getInsertQueryInfo()}
                header={
                    !!bulkAddProps?.header && <div className="editable-grid__bulk-header">{bulkAddProps.header}</div>
                }
                fieldValues={bulkAddProps?.fieldValues}
                columnFilter={bulkAddProps?.columnFilter}
                title={bulkAddProps?.title}
                countText={bulkAddProps?.countText}
                creationTypeOptions={bulkAddProps?.creationTypeOptions}
            />
        );
    };

    getControlsPlacement = (): PlacementType => {
        return this.props.addControlProps?.placement ?? 'bottom';
    };

    getGridData(): List<Map<string, any>> {
        const { data, dataKeys } = this.props;
        return dataKeys
            .map((key, index) => {
                const rowIndexData = { [GRID_EDIT_INDEX]: index };
                return data.get(key)?.merge(rowIndexData) ?? Map<string, any>(rowIndexData);
            })
            .toList();
    }

    render() {
        const {
            addControlProps,
            allowAdd,
            editorModel,
            error,
            bordered,
            bulkUpdateProps,
            condensed,
            data,
            dataKeys,
            emptyGridMsg,
            queryInfo,
            striped,
        } = this.props;
        const { showBulkAdd, showBulkUpdate, showMask } = this.state;
        const wrapperClassName = classNames(EDITABLE_GRID_CONTAINER_CLS, { 'loading-mask': showMask });

        return (
            <div>
                {this.renderTopControls()}
                <div
                    className={wrapperClassName}
                    onKeyDown={this.onKeyDown}
                    onMouseDown={this.onMouseDown}
                    onMouseUp={this.onMouseUp}
                >
                    <Grid
                        bordered={bordered}
                        calcWidths
                        cellular
                        columns={this.generateColumns()}
                        condensed={condensed}
                        data={this.getGridData()}
                        emptyText={emptyGridMsg}
                        headerCell={this.headerCell}
                        responsive={false}
                        rowKey={GRID_EDIT_INDEX}
                        striped={striped}
                    />
                </div>
                {allowAdd && this.getControlsPlacement() !== 'top' && this.renderAddRowsControl('bottom')}
                {error && <Alert className="margin-top">{error}</Alert>}
                {showBulkAdd && this.renderBulkAdd()}
                {showBulkUpdate && (
                    <BulkAddUpdateForm
                        data={data}
                        dataKeys={dataKeys}
                        editorModel={editorModel}
                        columnFilter={bulkUpdateProps?.columnFilter}
                        onCancel={this.toggleBulkUpdate}
                        onHide={this.toggleBulkUpdate}
                        onSubmitForEdit={this.bulkUpdate}
                        onSuccess={this.toggleBulkUpdate}
                        pluralNoun={addControlProps.nounPlural}
                        queryInfo={queryInfo}
                        selectedRowIndexes={this.getSelectedRowIndices()}
                        singularNoun={addControlProps.nounSingular}
                    />
                )}
            </div>
        );
    }
}
