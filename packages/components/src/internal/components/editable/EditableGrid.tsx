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
import { Query, Utils } from '@labkey/api';
import classNames from 'classnames';
import { List, Map, OrderedMap, Set } from 'immutable';
import React, { ChangeEvent, PureComponent, ReactNode } from 'react';

import { Operation, QueryColumn } from '../../../public/QueryColumn';
import { SelectionPivot } from '../../../public/QueryModel/QueryModel';
import { Key } from '../../../public/useEnterEscape';

import { incrementClientSideMetricCount } from '../../actions';
import {
    CELL_SELECTION_HANDLE_CLASSNAME,
    GRID_CHECKBOX_OPTIONS,
    GRID_EDIT_INDEX,
    GRID_SELECTION_INDEX,
    MAX_EDITABLE_GRID_ROWS,
} from '../../constants';
import { cancelEvent, isCtrlOrMetaKey } from '../../events';

import { headerSelectionCell } from '../../renderers';
import { blurActiveElement, capitalizeFirstChar, not } from '../../util/utils';
import { Grid } from '../base/Grid';

import { GridColumn, GridColumnCellRenderer } from '../base/models/GridColumn';

import { BulkAddUpdateForm } from '../forms/BulkAddUpdateForm';
import { QueryInfoForm, QueryInfoFormProps } from '../forms/QueryInfoForm';

import { Tab, Tabs } from '../../Tabs';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { LabelOverlay } from '../forms/LabelOverlay';

import { DropdownAnchor, MenuItem } from '../../dropdowns';

import {
    addRows,
    addRowsPerPivotValue,
    copyEvent,
    dragFillEvent,
    pasteEvent,
    updateGridFromBulkForm,
    validateAndInsertPastedData,
} from './actions';
import { BorderMask, Cell } from './Cell';

import {
    CellActions,
    CellCoordinates,
    EDITABLE_GRID_CONTAINER_CLS,
    EditableGridEvent,
    MODIFICATION_TYPES,
    SELECTION_TYPES,
} from './constants';
import { AddRowsControl, AddRowsControlProps, PlacementType } from './Controls';

import { CellMessage, EditableColumnMetadata, EditorModel, EditorModelProps, ValueDescriptor } from './models';
import { computeRangeChange, genCellKey, getValidatedEditableGridValue, parseCellKey } from './utils';

function anyCell(values: List<ValueDescriptor>): boolean {
    return true;
}

function isCellEmpty(values: List<ValueDescriptor>): boolean {
    return !values || values.isEmpty() || values.some(v => v.raw === undefined || v.raw === null || v.raw === '');
}

function moveDown(colIdx: number, rowIdx: number): CellCoordinates {
    return { colIdx, rowIdx: rowIdx + 1 };
}

function moveLeft(colIdx: number, rowIdx: number): CellCoordinates {
    return { colIdx: colIdx - 1, rowIdx };
}

function moveRight(colIdx: number, rowIdx: number): CellCoordinates {
    return { colIdx: colIdx + 1, rowIdx };
}

function moveUp(colIdx: number, rowIdx: number): CellCoordinates {
    return { colIdx, rowIdx: rowIdx - 1 };
}

function hasCellWidthOverride(metadata: EditableColumnMetadata): boolean {
    return !!metadata?.minWidth || !!metadata?.width;
}

function computeSelectionCellKeys(
    editorModel: EditorModel,
    minColIdx: number,
    minRowIdx: number,
    maxColIdx: number,
    maxRowIdx: number
): string[] {
    const selectionCells: string[] = [];

    for (let colIdx = minColIdx; colIdx <= maxColIdx; colIdx++) {
        for (let r = minRowIdx; r <= maxRowIdx; r++) {
            const fieldKey = editorModel.getFieldKeyByIndex(colIdx);
            selectionCells.push(genCellKey(fieldKey, r));
        }
    }

    return selectionCells;
}

function computeBorderMask(
    minCol: number,
    maxCol: number,
    minRow: number,
    maxRow: number,
    colIdx: number,
    rowIdx: number,
    currentMask: BorderMask
): BorderMask {
    const borderMask: BorderMask = [...currentMask];
    const betweenColumns = colIdx >= minCol && colIdx <= maxCol;
    const betweenRows = rowIdx >= minRow && rowIdx <= maxRow;
    if (minRow === rowIdx && betweenColumns) borderMask[0] = true;
    if (maxCol === colIdx && betweenRows) borderMask[1] = true;
    if (maxRow === rowIdx && betweenColumns) borderMask[2] = true;
    if (minCol === colIdx && betweenRows) borderMask[3] = true;
    return borderMask;
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

type GridMouseEvent = React.MouseEvent<HTMLDivElement> | MouseEvent;

// the column index for cell values and cell messages does not include either the selection
// column or the row number column, so we adjust the value passed to <Cell> to accommodate.
function inputCellFactory(
    editorModel: EditorModel,
    allowSelection: boolean,
    hideCountCol: boolean,
    columnMetadata: EditableColumnMetadata,
    readonlyRows: string[],
    cellActions: CellActions,
    containerFilter: Query.ContainerFilter,
    forUpdate: boolean,
    initialSelection: string[],
    containerPath?: string
): GridColumnCellRenderer {
    // Note: We ignore the incoming value (_) and rowNumber (__) because they come from the underlying QueryModel that
    // backs the Grid component, but we need to reference the data that is in the EditorModel.
    return (_, row, c, __, cn) => {
        let colOffset = 0;
        if (allowSelection) colOffset += 1;
        if (!hideCountCol) colOffset += 1;

        const rowIdx = row.get(GRID_EDIT_INDEX);
        const colIdx = cn - colOffset;
        const { orderedColumns } = editorModel;
        const fieldKey = editorModel.getFieldKeyByIndex(colIdx);
        const { isReadonlyCell, isReadonlyRow } = editorModel.getCellReadStatus(fieldKey, rowIdx, readonlyRows);
        const rowContainer = editorModel.getFolderValueForRow(rowIdx);
        const focused = editorModel.isFocused(colIdx, rowIdx);
        const className = classNames({ 'grid-col-with-width': hasCellWidthOverride(columnMetadata) });
        const style = { textAlign: columnMetadata?.align ?? c.align ?? 'left' } as any;

        // If we're updating then we want to use the container path from each row if present
        if (forUpdate && rowContainer) containerPath = rowContainer;

        let linkedValues;
        if (columnMetadata?.getFilteredLookupKeys) {
            const linkedFieldKey = editorModel.getFieldKeyByIndex(columnMetadata.linkedColInd);
            linkedValues = editorModel
                .getValue(linkedFieldKey, rowIdx)
                .map(vd => vd.raw)
                .toArray();
        }

        const { isSparseSelection, selectionCells } = editorModel;
        const renderDragHandle = !isSparseSelection && editorModel.lastSelection(fieldKey, rowIdx);
        let inSelection = editorModel.inSelection(fieldKey, rowIdx);
        let borderMask: BorderMask = [false, false, false, false];

        if (!isSparseSelection && selectionCells.length) {
            const minCell = parseCellKey(selectionCells[0]);
            const maxCell = parseCellKey(selectionCells[selectionCells.length - 1]);
            borderMask = computeBorderMask(
                orderedColumns.indexOf(minCell.fieldKey),
                orderedColumns.indexOf(maxCell.fieldKey),
                minCell.rowIdx,
                maxCell.rowIdx,
                colIdx,
                rowIdx,
                borderMask
            );
        }

        if (!isSparseSelection && initialSelection?.length) {
            const minCell = parseCellKey(initialSelection[0]);
            const maxCell = parseCellKey(initialSelection[initialSelection.length - 1]);
            borderMask = computeBorderMask(
                orderedColumns.indexOf(minCell.fieldKey),
                orderedColumns.indexOf(maxCell.fieldKey),
                minCell.rowIdx,
                maxCell.rowIdx,
                colIdx,
                rowIdx,
                borderMask
            );
            inSelection = initialSelection.includes(genCellKey(fieldKey, rowIdx));
        }

        return (
            <td className={className} key={inputCellKey(c.raw, row)} style={style}>
                <Cell
                    borderMaskTop={borderMask[0]}
                    borderMaskRight={borderMask[1]}
                    borderMaskBottom={borderMask[2]}
                    borderMaskLeft={borderMask[3]}
                    cellActions={cellActions}
                    col={c.raw}
                    colIdx={colIdx}
                    columnMetadata={columnMetadata}
                    row={focused ? editorModel.getRowValue(rowIdx) : undefined}
                    containerFilter={containerFilter}
                    placeholder={columnMetadata?.placeholder}
                    readOnly={isReadonlyRow || isReadonlyCell}
                    rowIdx={rowIdx}
                    focused={focused}
                    forUpdate={forUpdate}
                    message={editorModel.getMessage(fieldKey, rowIdx)}
                    selected={editorModel.isSelected(colIdx, rowIdx)}
                    selection={inSelection}
                    renderDragHandle={renderDragHandle}
                    values={editorModel.getValue(fieldKey, rowIdx)}
                    linkedValues={linkedValues}
                    containerPath={containerPath}
                />
            </td>
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

export interface BulkAddData {
    pivotKey?: string;
    pivotValues?: string[];
    totalItems?: number;
    validationMsg?: ReactNode;
}

export interface BulkUpdateQueryInfoFormProps extends QueryInfoFormProps {
    applyBulkUpdateBtnText?: string;
    excludeRowIdx?: number[]; // the row ind to exclude for bulk update, row might be readonly or locked
    onBulkUpdateFormDataChange?: (pendingBulkFormData?: any) => void;
    onClickBulkUpdate?: (selected: Set<number>) => Promise<boolean>;
    warning?: string;
}

export interface BulkAddQueryInfoFormProps extends QueryInfoFormProps {
    readOnlyGridFields?: string[];
}

export interface SharedEditableGridProps {
    activeEditTab?: EditableGridTabs;
    addControlProps?: Partial<AddRowsControlProps>;
    allowAdd?: boolean;
    allowBulkAdd?: boolean;
    allowBulkRemove?: boolean;
    allowBulkUpdate?: boolean;
    allowSelection?: boolean;
    bulkAddProps?: Partial<BulkAddQueryInfoFormProps>;
    bulkAddText?: string;
    bulkRemoveText?: string;
    bulkUpdateProps?: Partial<BulkUpdateQueryInfoFormProps>;
    bulkUpdateText?: string;
    containerFilter?: Query.ContainerFilter;
    containerPath?: string;
    disabled?: boolean;
    emptyGridMsg?: string;
    fixedHeight?: boolean;
    forUpdate?: boolean;
    gridTabHeaderComponent?: ReactNode; // TODO: Only used by MultiTargetStorageEditableGrid, is there another way?
    hideCheckboxCol?: boolean;
    hideCountCol?: boolean;
    hideReadonlyRows?: boolean;
    hideTopControls?: boolean;
    isSubmitting?: boolean;
    lockLeftOnScroll?: boolean; // lock the left columns when scrolling horizontally
    maxRows?: number;
    metricFeatureArea?: string;
    processBulkData?: (data: OrderedMap<string, any>) => BulkAddData;
    readonlyRows?: string[]; // list of key values for rows that are readonly.
    rowNumColumn?: GridColumn;
    showAsTab?: boolean; // Toggle "Edit in Grid" and "Edit in Bulk" as tabs
    tabContainerCls?: string;
}

export interface EditableGridBtnProps {
    caption?: string;
    cls?: string;
    disabled?: boolean;
    onClick?: (pendingBulkFormData?: OrderedMap<string, any>, editorModelChanges?: Partial<EditorModelProps>) => void;
    placement?: PlacementType;
    show?: boolean;
}

export type EditableGridChange = (
    event: EditableGridEvent,
    editorModelChanges: Partial<EditorModelProps>,
    previousEditorModel?: EditorModel
) => void;

export interface EditableGridProps extends SharedEditableGridProps {
    editorModel: EditorModel;
    onChange: EditableGridChange;
}

export interface EditableGridState {
    activeEditTab?: EditableGridTabs;
    inDrag: boolean;
    initialSelection: string[];
    pendingBulkFormData?: any;
    selected: Set<number>;
    selectedState: GRID_CHECKBOX_OPTIONS;
    selectionPivot?: SelectionPivot;
    showBulkAdd: boolean;
    showBulkUpdate: boolean;
    showMask: boolean;
}

export enum EditableGridTabs {
    BulkAdd = 'BulkAdd',
    BulkUpdate = 'BulkUpdate',
    Grid = 'Grid',
}

/**
 * Note that there are some cases which will call the onChange callback prop back to back (i.e. see LookupCell.onInputChange)
 * and pass through different sets of `editorModelChanges`. In that case, you will want to make sure that your onChange
 * handler is getting the current state object before merging in the `editorModelChanges`. See example in platform/core
 * (core/src/client/LabKeyUIComponentsPage/EditableGridPage.tsx) which uses the set state function which takes a function
 * as the first parameter instead of the new state object.
 */
export class EditableGrid extends PureComponent<EditableGridProps, EditableGridState> {
    static defaultProps = {
        allowAdd: true,
        allowBulkAdd: false,
        allowBulkRemove: false,
        allowBulkUpdate: false,
        addControlProps: {
            nounPlural: 'Rows',
            nounSingular: 'Row',
        },
        bulkAddText: 'Bulk Add',
        bulkRemoveText: 'Delete Rows',
        bulkUpdateText: 'Bulk Update',
        fixedHeight: true,
        lockLeftOnScroll: true,
        disabled: false,
        isSubmitting: false,
        maxRows: MAX_EDITABLE_GRID_ROWS,
        hideCountCol: false,
        hideTopControls: false,
        hideReadonlyRows: false,
        rowNumColumn: COUNT_COL,
    };

    private cellActions: CellActions;
    private dragDelay: number;
    private maskDelay: number;

    constructor(props: EditableGridProps) {
        super(props);
        this.cellActions = {
            clearSelection: this.clearSelection,
            focusCell: this.focusCell,
            fillDown: this.fillDown,
            fillText: this.fillText,
            inDrag: this.inDrag,
            modifyCell: this.modifyCell,
            selectCell: this.selectCell,
        };

        let selected = Set<number>();
        let selectedState = GRID_CHECKBOX_OPTIONS.NONE;
        if (props.activeEditTab === EditableGridTabs.BulkUpdate || props.hideCheckboxCol) {
            for (let i = 0; i < props.editorModel.rowCount; i++) {
                selected = selected.add(i);
            }
            selectedState = GRID_CHECKBOX_OPTIONS.ALL;
        }

        this.state = {
            activeEditTab: props.activeEditTab ? props.activeEditTab : EditableGridTabs.Grid,
            inDrag: false,
            initialSelection: undefined,
            selected,
            selectedState,
            selectionPivot: undefined,
            showBulkAdd: false,
            showBulkUpdate: false,
            showMask: false,
        };
    }

    componentDidMount(): void {
        document.addEventListener('copy', this.onCopy);
        document.addEventListener('cut', this.onCut);
        document.addEventListener('paste', this.onPaste);
    }

    componentWillUnmount(): void {
        document.removeEventListener('copy', this.onCopy);
        document.removeEventListener('cut', this.onCut);
        document.removeEventListener('paste', this.onPaste);
    }

    select = (row: Map<string, any>, event: ChangeEvent<HTMLInputElement>): void => {
        const checked = event.currentTarget.checked;
        // Look through to the nativeEvent to determine if the shift key is engaged.
        const isShiftSelect = (event.nativeEvent as any).shiftKey ?? false;

        this.setState(state => {
            const { editorModel } = this.props;
            const { selectionPivot } = state;
            let { selected } = state;
            const key = row.get(GRID_EDIT_INDEX);

            if (isShiftSelect && selectionPivot) {
                const pivotIdx = parseInt(selectionPivot.selection, 10);
                const beginIdx = Math.min(key, pivotIdx);
                const endIdx = Math.max(key, pivotIdx);
                for (let i = beginIdx; i <= endIdx; i++) {
                    if (selectionPivot.checked) {
                        selected = selected.add(i);
                    } else {
                        selected = selected.remove(i);
                    }
                }
            } else if (checked) {
                selected = selected.add(key);
            } else {
                selected = selected.remove(key);
            }

            let selectedState: GRID_CHECKBOX_OPTIONS;
            if (selected.size === 0) {
                selectedState = GRID_CHECKBOX_OPTIONS.NONE;
            } else if (editorModel.rowCount === selected.size) {
                selectedState = GRID_CHECKBOX_OPTIONS.ALL;
            } else {
                selectedState = GRID_CHECKBOX_OPTIONS.SOME;
            }

            const nextState: any /* Partial<EditableGridState> */ = { selected, selectedState };

            if (!isShiftSelect) {
                nextState.selectionPivot = { checked, selection: key.toString() };
            }

            return nextState;
        });
    };

    selectAll = (evt: ChangeEvent<HTMLInputElement>): void => {
        const { editorModel } = this.props;
        const checked = evt.currentTarget.checked === true;

        this.setState(state => {
            const selectAll = checked && state.selectedState !== GRID_CHECKBOX_OPTIONS.ALL;
            let selected = Set<number>();

            if (selectAll) {
                for (let i = 0; i < editorModel.rowCount; i++) {
                    selected = selected.add(i);
                }
            }

            return {
                selected,
                selectedState: selectAll ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.NONE,
                selectionPivot: undefined,
            };
        });
    };

    // TODO: update focusCell to take fieldKey instead of colIdx
    focusCell = (colIdx: number, rowIdx: number, clearValue?: boolean): void => {
        const { editorModel, onChange } = this.props;
        const fieldKey = editorModel.getFieldKeyByIndex(colIdx);
        const cellKey = genCellKey(fieldKey, rowIdx);
        const changes: Partial<EditorModelProps> = {
            focusColIdx: colIdx,
            focusRowIdx: rowIdx,
            focusValue: editorModel.getIn(['cellValues', cellKey]),
            selectedColIdx: colIdx,
            selectedRowIdx: rowIdx,
        };

        if (clearValue) {
            changes.cellValues = editorModel.cellValues.set(cellKey, List<ValueDescriptor>());
        }

        onChange(EditableGridEvent.FOCUS_CELL, changes);
    };

    clearSelection = (): void => {
        const { onChange } = this.props;
        onChange(EditableGridEvent.CLEAR_SELECTION, {
            selectedColIdx: -1,
            selectedRowIdx: -1,
            focusColIdx: -1,
            focusRowIdx: -1,
        });
    };

    // TODO: update applySelection to pass fieldKey instead of colIdx
    applySelection = (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES): Partial<EditorModel> => {
        const { initialSelection } = this.state;
        const { editorModel } = this.props;
        const { orderedColumns, rowCount } = editorModel;
        let selectionCells: string[] = [];
        const hasSelection = editorModel.hasSelection;
        let selectedColIdx = colIdx;
        let selectedRowIdx = rowIdx;

        switch (selection) {
            case SELECTION_TYPES.ALL: {
                editorModel.orderedColumns.forEach(fieldKey => {
                    for (let r = 0; r < rowCount; r++) {
                        selectionCells.push(genCellKey(fieldKey, r));
                    }
                });
                break;
            }
            case SELECTION_TYPES.AREA: {
                selectedColIdx = editorModel.selectedColIdx;
                selectedRowIdx = editorModel.selectedRowIdx;

                if (hasSelection) {
                    let minColIdx = Math.min(selectedColIdx, colIdx);
                    let maxColIdx = Math.max(selectedColIdx, colIdx);
                    let minRowIdx = Math.min(selectedRowIdx, rowIdx);
                    let maxRowIdx = Math.max(selectedRowIdx, rowIdx);

                    if (initialSelection !== undefined) {
                        // If we have an initialSelection we want to prevent the user from changing the number of
                        // columns, or from shrinking the initially selected state. Functionally this means a user can
                        // only expand a selection upwards or downwards, just like in Excel/Sheets.
                        const minInitialCell = parseCellKey(initialSelection[0]);
                        const maxInitialCell = parseCellKey(initialSelection[initialSelection.length - 1]);
                        minColIdx = orderedColumns.indexOf(minInitialCell.fieldKey);
                        maxColIdx = orderedColumns.indexOf(maxInitialCell.fieldKey);
                        minRowIdx = Math.min(minRowIdx, minInitialCell.rowIdx);
                        maxRowIdx = Math.max(maxRowIdx, maxInitialCell.rowIdx);
                    }

                    selectionCells = computeSelectionCellKeys(editorModel, minColIdx, minRowIdx, maxColIdx, maxRowIdx);
                }
                break;
            }
            case SELECTION_TYPES.AREA_CHANGE: {
                selectedColIdx = editorModel.selectedColIdx;
                selectedRowIdx = editorModel.selectedRowIdx;
                const colDir = colIdx - selectedColIdx;
                let rowDir = rowIdx - selectedRowIdx;

                // Issue 49953: Support shift-selecting down from the last row
                if (rowIdx === rowCount - 1 && rowDir === 0 && colDir === 0) {
                    rowDir = 1;
                }

                let start: CellCoordinates;
                let end: CellCoordinates;

                if (editorModel.selectionCells && editorModel.selectionCells.length > 0) {
                    const startParts = parseCellKey(editorModel.selectionCells[0]);
                    const endParts = parseCellKey(editorModel.selectionCells[editorModel.selectionCells.length - 1]);
                    start = { colIdx: orderedColumns.indexOf(startParts.fieldKey), rowIdx: startParts.rowIdx };
                    end = { colIdx: orderedColumns.indexOf(endParts.fieldKey), rowIdx: endParts.rowIdx };
                } else {
                    start = { colIdx: selectedColIdx, rowIdx: selectedRowIdx };
                    end = start;
                }

                let [minColIdx, maxColIdx] = computeRangeChange(selectedColIdx, start.colIdx, end.colIdx, colDir);
                let [minRowIdx, maxRowIdx] = computeRangeChange(selectedRowIdx, start.rowIdx, end.rowIdx, rowDir);

                // Constrain the area selection within the editable cells dimensions
                minColIdx = Math.max(minColIdx, 0);
                maxColIdx = Math.min(maxColIdx, editorModel.orderedColumns.size - 1);
                minRowIdx = Math.max(minRowIdx, 0);
                maxRowIdx = Math.min(maxRowIdx, rowCount - 1);

                selectionCells = computeSelectionCellKeys(editorModel, minColIdx, minRowIdx, maxColIdx, maxRowIdx);
                break;
            }
            case SELECTION_TYPES.SINGLE: {
                selectionCells = [...editorModel.selectionCells];
                const fieldKey = editorModel.getFieldKeyByIndex(colIdx);
                selectionCells.push(genCellKey(fieldKey, rowIdx));
                break;
            }
        }

        if (selectionCells.length > 0) {
            // if a cell was previously selected and there are remaining selectionCells then mark the previously
            // selected cell as in "selection"
            if (hasSelection) {
                const fieldKey = editorModel.getFieldKeyByIndex(editorModel.selectedColIdx);
                selectionCells.push(genCellKey(fieldKey, editorModel.selectedRowIdx));
            }
        }

        return { selectedColIdx, selectedRowIdx, selectionCells };
    };

    // TODO: update selectCell to pass fieldKey instead of colIdx
    selectCell = (colIdx: number, rowIdx: number, selection?: SELECTION_TYPES, resetValue = false): void => {
        const { editorModel, onChange } = this.props;
        const { cellValues, focusValue, rowCount } = editorModel;

        // Issue 49953: AREA_CHANGE selection is oriented around the initial selected cell, so it
        // accepts processing of negative indices.
        if (
            selection !== SELECTION_TYPES.AREA_CHANGE &&
            (colIdx < 0 || rowIdx < 0 || colIdx >= editorModel.orderedColumns.size)
        ) {
            // out of bounds, do nothing
            return;
        }

        // Issue 33855: select last row
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
                const fieldKey = editorModel.getFieldKeyByIndex(colIdx);
                changes.cellValues = cellValues.set(genCellKey(fieldKey, rowIdx), focusValue);
            }

            onChange(EditableGridEvent.SELECT_CELL, changes);

            if (this.state.selectionPivot) {
                this.setState({ selectionPivot: undefined });
            }
        }
    };

    /**
     * Given a colIdx/rowIdx returns true if a cell is read only. Use this in event handlers to prevent modifying read
     * only cells (e.g. during delete).
     */
    isReadOnly(cellKey: string): boolean {
        const { fieldKey, rowIdx } = parseCellKey(cellKey);
        const { editorModel, readonlyRows } = this.props;

        const pkValue = editorModel.getPkValue(rowIdx);
        if (pkValue !== undefined && readonlyRows?.includes(pkValue.toString())) return true;

        const queryCol = editorModel.columnMap.get(fieldKey);
        if (!queryCol) {
            console.error("No query column for field '", fieldKey + "'", editorModel.columnMap.toJS());
            return true;
        }
        if (queryCol.readOnly) return true;

        const metadata = editorModel.getColumnMetadata(queryCol.fieldKey);
        if (metadata) return metadata.isReadOnlyCell?.(pkValue);

        return false;
    }

    // TODO: update modifyCell to take fieldKey instead of colIdx
    modifyCell = (
        colIdx: number,
        rowIdx: number,
        newValues: ValueDescriptor[],
        mod: MODIFICATION_TYPES,
        column?: QueryColumn
    ): void => {
        const { editorModel, onChange } = this.props;
        const { cellMessages, cellValues, columnMap } = editorModel;
        const fieldKey = editorModel.getFieldKeyByIndex(colIdx);
        const cellKey = genCellKey(fieldKey, rowIdx);
        const keyPath = ['cellValues', cellKey];
        const changes: Partial<EditorModel> = { cellMessages: cellMessages.delete(cellKey) };
        // It's possible for a user to select a whole row or column of readonly cells, then hit cmd+x, which would not
        // result in any actual changes, so we need to track if we actually modify anything
        let changesMade = false;

        if (mod === MODIFICATION_TYPES.ADD) {
            const values: List<ValueDescriptor> = editorModel.getIn(keyPath);

            if (values !== undefined) {
                changes.cellValues = cellValues.set(cellKey, values.push(...newValues));
            } else {
                changes.cellValues = cellValues.set(cellKey, List(newValues));
            }
            changesMade = true;
        } else if (mod === MODIFICATION_TYPES.REPLACE) {
            changes.cellValues = cellValues.set(cellKey, List(newValues));
            changesMade = true;
            const { message } = getValidatedEditableGridValue(newValues[0].display, column);
            changes.cellMessages = cellMessages.set(cellKey, message);
        } else if (mod === MODIFICATION_TYPES.REMOVE) {
            let values: List<ValueDescriptor> = editorModel.getIn(keyPath);

            for (let v = 0; v < newValues.length; v++) {
                const idx = values.findIndex(vd => vd.display === newValues[v].display && vd.raw === newValues[v].raw);

                if (idx > -1) {
                    values = values.remove(idx);
                }
            }

            changes.cellValues = cellValues.set(cellKey, values);
            changesMade = true;
        } else if (mod === MODIFICATION_TYPES.REMOVE_ALL) {
            if (editorModel.selectionCells.length > 0) {
                // Remove all values and messages for the selected cells
                changes.cellValues = editorModel.cellValues.reduce((result, value, key) => {
                    // Take no action if a cell is read only. Users can select an area that includes read only rows and
                    // cells
                    const isReadOnly = this.isReadOnly(key);
                    if (!isReadOnly && editorModel.selectionCells.includes(key)) {
                        changesMade = true;
                        return result.set(key, List());
                    }
                    return result.set(key, value);
                }, Map<string, List<ValueDescriptor>>());
                let updatedCellMessages = editorModel.cellMessages;

                editorModel.selectionCells.forEach(key => {
                    if (!updatedCellMessages.has(key)) updatedCellMessages = updatedCellMessages.set(key, undefined);
                });
                changes.cellMessages = updatedCellMessages.reduce((result, value, key) => {
                    const isReadOnly = this.isReadOnly(key);
                    if (!isReadOnly && editorModel.selectionCells.includes(key)) {
                        changesMade = true;
                        const col = columnMap.get(parseCellKey(key).fieldKey);
                        const { message } = getValidatedEditableGridValue(null, col);
                        if (message) return result.set(key, message);
                        else return result.remove(key);
                    }
                    return result.set(key, value);
                }, Map<string, CellMessage>());
            } else if (!this.isReadOnly(cellKey)) {
                changes.cellValues = cellValues.set(cellKey, List());
                const col = columnMap.get(parseCellKey(cellKey).fieldKey);
                const { message } = getValidatedEditableGridValue(null, col);
                changes.cellMessages = cellMessages.set(cellKey, message);
                changesMade = true;
            }
        }

        if (changesMade) onChange(EditableGridEvent.MODIFY_CELL, changes, editorModel);
    };

    removeRows = (rowIndicesToDelete: Set<number>): void => {
        const { editorModel, onChange } = this.props;
        // Track all of the existing row indices that we want to keep in an array, their index in this array is their
        // updated index after we've deleted the existing rows.
        const rowIndicesToKeep = [];
        let deletedIds = Set<string>();

        for (let idx = 0; idx < editorModel.rowCount; idx++) {
            if (rowIndicesToDelete.has(idx)) {
                const pkValue = editorModel.getPkValue(idx);
                if (pkValue) deletedIds = deletedIds.add(pkValue.toString());
                continue;
            }

            rowIndicesToKeep.push(idx);
        }

        const cellReducer = (result, value, cellKey): Map<string, any> => {
            const { fieldKey, rowIdx: oldRowIdx } = parseCellKey(cellKey);

            // If this value is part of a deleted row don't include it in the result.
            if (rowIndicesToDelete.has(oldRowIdx)) return result;

            const newRowIdx = rowIndicesToKeep.indexOf(oldRowIdx);
            return result.set(genCellKey(fieldKey, newRowIdx), value);
        };
        const cellMessages = editorModel.cellMessages.reduce(cellReducer, Map<string, CellMessage>());
        const cellValues = editorModel.cellValues.reduce(cellReducer, Map<string, ValueDescriptor>());
        const editorModelChanges = {
            deletedIds: editorModel.deletedIds.merge(deletedIds),
            focusColIdx: -1,
            focusRowIdx: -1,
            rowCount: editorModel.rowCount - rowIndicesToDelete.size,
            selectedColIdx: -1,
            selectedRowIdx: -1,
            selectionCells: [],
            cellMessages,
            cellValues,
        };

        onChange(EditableGridEvent.REMOVE_ROWS, editorModelChanges);

        this.setState({
            selected: Set<number>(),
            selectedState: GRID_CHECKBOX_OPTIONS.NONE,
            selectionPivot: undefined,
        });
    };

    removeSelected = (): void => {
        const { metricFeatureArea } = this.props;
        this.removeRows(this.state.selected);
        if (metricFeatureArea) {
            incrementClientSideMetricCount(metricFeatureArea, 'removeRows');
        }
    };

    generateColumns = (): List<GridColumn> => {
        const { containerFilter, editorModel, forUpdate, hideCountCol, rowNumColumn, readonlyRows, containerPath } =
            this.props;

        let gridColumns = List<GridColumn>();
        const showCheckboxes = this.showSelectionCheckboxes();

        if (showCheckboxes) {
            const selColumn = new GridColumn({
                index: GRID_SELECTION_INDEX,
                title: '&nbsp;',
                cell: (selected: boolean, row) => (
                    <input
                        className="grid-panel__checkbox"
                        checked={this.state.selected.contains(row.get(GRID_EDIT_INDEX))}
                        type="checkbox"
                        onChange={this.select.bind(this, row)}
                    />
                ),
            });
            gridColumns = gridColumns.push(selColumn);
        }
        if (!hideCountCol) {
            gridColumns = gridColumns.push(rowNumColumn ? rowNumColumn : COUNT_COL);
        }

        editorModel.orderedColumns.forEach(fieldKey => {
            const qCol = editorModel.columnMap.get(fieldKey);
            const metadata = editorModel.getColumnMetadata(qCol.fieldKey);
            let width = 100;
            let fixedWidth;
            if (hasCellWidthOverride(metadata)) {
                fixedWidth = metadata.width;
                if (!fixedWidth) {
                    width = metadata.minWidth;
                }
            }
            const hideTooltip = metadata?.hideTitleTooltip ?? qCol.hasHelpTipData;
            gridColumns = gridColumns.push(
                new GridColumn({
                    align: qCol.align,
                    cell: inputCellFactory(
                        editorModel,
                        showCheckboxes,
                        hideCountCol,
                        metadata,
                        readonlyRows,
                        this.cellActions,
                        metadata?.containerFilter ?? containerFilter,
                        forUpdate,
                        this.state.initialSelection,
                        containerPath
                    ),
                    index: qCol.fieldKey,
                    fixedWidth,
                    raw: qCol,
                    title: metadata?.caption ?? qCol.caption,
                    width,
                    hideTooltip,
                    tableCell: true,
                })
            );
        });

        return gridColumns;
    };

    renderColumnHeader = (col: GridColumn, metadataKey: string): React.ReactNode => {
        const { editorModel } = this.props;
        const label = col.title;
        const qColumn: QueryColumn = col.raw;
        const req = !!qColumn?.required;
        const metadata = editorModel.getColumnMetadata(metadataKey);
        const showOverlayFromMetadata = !!metadata?.toolTip;
        const showLabelOverlay = !showOverlayFromMetadata && qColumn?.hasHelpTipData;

        // TODO should be able to just use LabelOverlay here since it can handle an alternate tooltip renderer
        return (
            <>
                {!showLabelOverlay && (
                    <>
                        {label}
                        {req && <span className="required-symbol"> *</span>}
                    </>
                )}
                {showOverlayFromMetadata && (
                    <LabelHelpTip title={label} popoverClassName={metadata?.popoverClassName} placement="bottom">
                        <>{metadata?.toolTip}</>
                    </LabelHelpTip>
                )}
                {showLabelOverlay && (
                    <LabelOverlay column={qColumn} label={metadata?.caption} placement="bottom" required={req} />
                )}
                {metadata?.onRemoveColumn && (
                    <DropdownAnchor
                        asAnchor={false}
                        className="grid-panel__menu-toggle pull-right"
                        title={<i className="fa fa-chevron-circle-down" />}
                        pullRight
                    >
                        {/*TODO fix IntelliJ error below*/}
                        <MenuItem onClick={() => metadata.onRemoveColumn(qColumn)}>Remove Column</MenuItem>
                    </DropdownAnchor>
                )}
            </>
        );
    };

    headerCell = (col: GridColumn): ReactNode => {
        const { editorModel } = this.props;

        if (col.index.toLowerCase() === GRID_SELECTION_INDEX && this.showSelectionCheckboxes()) {
            return headerSelectionCell(this.selectAll, this.state.selectedState, false, 'grid-panel__checkbox');
        }

        const qColumn = editorModel.queryInfo.getColumn(col.index);

        if (qColumn) {
            return this.renderColumnHeader(col, qColumn.fieldKey);
        }

        if (col.showHeader) {
            return this.renderColumnHeader(col, col.title);
        }

        return null;
    };

    hideMask = (): void => {
        clearTimeout(this.maskDelay);
        this.toggleMask(false);
    };

    handleDrag = (event: GridMouseEvent): boolean => {
        if (!this.props.editorModel.hasFocus) {
            event.preventDefault();
            return true;
        }

        return false;
    };

    beginDrag = (event: GridMouseEvent): void => {
        // Only handle event if the left mouse button is clicked
        if (event.buttons !== 1) return;

        const { disabled, editorModel } = this.props;
        if (this.handleDrag(event) && !disabled) {
            clearTimeout(this.dragDelay);
            const target = event.target as Element;
            const isDragHandleAction = target.className?.indexOf(CELL_SELECTION_HANDLE_CLASSNAME) > -1;

            // NK: Here we slightly delay the drag event in case the user is just clicking on the cell
            // rather than performing a drag action. If they are simply clicking then the endDrag() will cancel
            // this update prior to the timeout.
            this.dragDelay = window.setTimeout(() => {
                this.dragDelay = undefined;
                const nextState: Partial<EditableGridState> = { inDrag: true };
                if (isDragHandleAction) {
                    const initialSelection = [...editorModel.selectionCells];
                    if (!initialSelection.length) initialSelection.push(editorModel.selectionKey);
                    nextState.initialSelection = initialSelection;
                }
                this.setState(nextState as EditableGridState);
                document.addEventListener('mouseup', this.onDocumentMouseUp);
            }, 150);
        }
    };

    inDrag = (): boolean => this.state.inDrag;

    endDrag = (event: GridMouseEvent): void => {
        if (this.handleDrag(event)) {
            if (this.dragDelay) {
                clearTimeout(this.dragDelay);
                this.dragDelay = undefined;
            } else {
                document.removeEventListener('mouseup', this.onDocumentMouseUp);
                this.setState({ inDrag: false });
            }
        }
    };

    onCopy = (event: ClipboardEvent): void => {
        const { disabled, editorModel, hideReadonlyRows, readonlyRows } = this.props;
        if (!disabled) {
            copyEvent(editorModel, event, hideReadonlyRows, readonlyRows);
        }
    };

    onCut = (event: ClipboardEvent): void => {
        const { disabled, editorModel, hideReadonlyRows, readonlyRows } = this.props;

        if (!disabled && copyEvent(editorModel, event, hideReadonlyRows, readonlyRows)) {
            this.modifyCell(
                editorModel.selectedColIdx,
                editorModel.selectedRowIdx,
                undefined,
                MODIFICATION_TYPES.REMOVE_ALL
            );
        }
    };

    onKeyDown = (event: React.KeyboardEvent<HTMLElement>): void => {
        const { disabled, editorModel, hideReadonlyRows, readonlyRows } = this.props;

        if (disabled || editorModel.hasFocus) {
            return;
        }

        const isMeta = isCtrlOrMetaKey(event);
        const isShift = event.shiftKey;
        const colIdx = editorModel.selectedColIdx;
        const rowIdx = editorModel.selectedRowIdx;
        let nextCol: number;
        let nextRow: number;

        switch (event.key) {
            case Key.ARROW_LEFT: {
                if (isMeta) {
                    const found = editorModel.findNextCell(
                        colIdx,
                        rowIdx,
                        not(isCellEmpty),
                        moveLeft,
                        hideReadonlyRows,
                        readonlyRows
                    );
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
            }
            case Key.ARROW_UP: {
                const predicate = isMeta ? not(isCellEmpty) : anyCell;
                const found = editorModel.findNextCell(
                    colIdx,
                    rowIdx,
                    predicate,
                    moveUp,
                    hideReadonlyRows,
                    readonlyRows
                );
                if (found) {
                    nextCol = found.colIdx;
                    nextRow = found.rowIdx;
                }
                break;
            }
            case Key.ARROW_RIGHT: {
                if (isMeta) {
                    const found = editorModel.findNextCell(
                        colIdx,
                        rowIdx,
                        not(isCellEmpty),
                        moveRight,
                        hideReadonlyRows,
                        readonlyRows
                    );
                    if (found) {
                        nextCol = found.colIdx;
                        nextRow = found.rowIdx;
                    } else {
                        nextCol = editorModel.orderedColumns.size - 1;
                        nextRow = rowIdx;
                    }
                } else {
                    nextCol = colIdx + 1;
                    nextRow = rowIdx;
                }
                break;
            }
            case Key.ARROW_DOWN: {
                const predicate = isMeta ? not(isCellEmpty) : anyCell;
                const found = editorModel.findNextCell(
                    colIdx,
                    rowIdx,
                    predicate,
                    moveDown,
                    hideReadonlyRows,
                    readonlyRows
                );
                if (found) {
                    nextCol = found.colIdx;
                    nextRow = found.rowIdx;
                }
                break;
            }
            case Key.HOME: {
                nextCol = 0;
                nextRow = rowIdx;
                break;
            }
            case Key.END: {
                nextCol = editorModel.orderedColumns.size - 1;
                nextRow = rowIdx;
                break;
            }
            default:
                // Ignore all other keys
                break;
        }

        if (nextCol !== undefined && nextRow !== undefined) {
            cancelEvent(event);
            this.selectCell(nextCol, nextRow, isShift ? SELECTION_TYPES.AREA_CHANGE : undefined);
        }
    };

    _dragFill = async (initialSelection: string[]): Promise<void> => {
        const { editorModel, forUpdate, containerPath, onChange, readonlyRows } = this.props;

        if (editorModel.isMultiSelect) {
            const { cellMessages, cellValues } = await dragFillEvent(
                editorModel,
                initialSelection,
                readonlyRows,
                forUpdate,
                containerPath
            );
            onChange(EditableGridEvent.DRAG_FILL, { cellMessages, cellValues }, editorModel);
            this.setState({ initialSelection: undefined });
        }
    };

    onMouseUp = (event: GridMouseEvent): void => {
        if (this.props.disabled) return;
        this.endDrag(event);
        const initialSelection = this.state.initialSelection;
        if (initialSelection?.length > 0) this._dragFill(initialSelection);
    };

    // Issue 49612: Handle ending drag action "mouse up" outside the editable grid
    onDocumentMouseUp = (event: MouseEvent): void => {
        this.onMouseUp(event);
    };

    fillDown = (): void => {
        const { disabled, editorModel } = this.props;
        const { isSparseSelection, selectionCells } = editorModel;

        if (disabled || isSparseSelection || selectionCells.length === 0) return;

        const firstRowIdx = parseCellKey(selectionCells[0]).rowIdx;
        const firstRowCellKeys = selectionCells.filter(cellKey => parseCellKey(cellKey).rowIdx === firstRowIdx);
        this._dragFill(firstRowCellKeys);
    };

    // TODO: update fillText to take fieldKey instead of colIdx
    fillText = async (colIdx: number, rowIdx: number, text: string): Promise<void> => {
        const { allowAdd, disabled, editorModel, forUpdate, onChange, readonlyRows, containerPath } = this.props;

        if (disabled) return;

        this.showMask();
        const changes = await validateAndInsertPastedData(
            editorModel,
            text,
            readonlyRows,
            !allowAdd,
            forUpdate,
            containerPath,
            false
        );
        this.hideMask();

        onChange(EditableGridEvent.FILL_TEXT, changes, editorModel);
    };

    onPaste = async (event: ClipboardEvent): Promise<void> => {
        const { allowAdd, disabled, editorModel, forUpdate, onChange, readonlyRows, containerPath } = this.props;

        if (disabled) return;

        this.showMask();
        const changes = await pasteEvent(editorModel, event, readonlyRows, !allowAdd, forUpdate, containerPath);
        this.hideMask();

        if (changes === undefined) return;

        onChange(EditableGridEvent.PASTE, changes, editorModel);
    };

    showMask = (): void => {
        clearTimeout(this.maskDelay);
        this.maskDelay = window.setTimeout(this.toggleMask.bind(this, true), 300);
    };

    showSelectionCheckboxes(): boolean {
        const { allowBulkRemove, allowBulkUpdate, allowSelection, hideCheckboxCol } = this.props;
        if (allowSelection === undefined) {
            return !hideCheckboxCol && (allowBulkRemove || allowBulkUpdate);
        }
        return allowSelection && !hideCheckboxCol;
    }

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
        const { bulkUpdateProps } = this.props;
        if (bulkUpdateProps?.onClickBulkUpdate) {
            bulkUpdateProps
                .onClickBulkUpdate(this.state.selected)
                .then(canEdit => {
                    // the selected rows might not be updatable, for examples, all selected are readonly
                    if (!canEdit) return;

                    this.setState(
                        state => ({ showBulkUpdate: !state.showBulkUpdate }),
                        // Issue 38420: Without this, the BulkUpdate button always retains focus after modal is shown
                        blurActiveElement
                    );
                })
                .catch(error => {
                    console.error(error);
                });
        } else {
            this.setState(
                state => ({ showBulkUpdate: !state.showBulkUpdate }),
                // Issue 38420: Without this, the BulkUpdate button always retains focus after modal is shown
                blurActiveElement
            );
        }
    };

    getSelectedRowIndices = (): List<number> => {
        return this.state.selected.toList();
    };

    restoreBulkInsertData = (data: Map<string, any>): Map<string, any> => {
        const insertData = OrderedMap<string, any>().asMutable();
        this.getBulkToGridColumns().forEach(col => insertData.set(col.name, undefined));
        return insertData.merge(data).asImmutable();
    };

    getBulkToGridColumns = (): QueryColumn[] => {
        const { bulkAddProps, editorModel } = this.props;
        return editorModel.queryInfo.getInsertColumns(bulkAddProps.isIncludedColumn, bulkAddProps.readOnlyGridFields);
    };

    bulkAdd = async (bulkData: OrderedMap<string, any>): Promise<void> => {
        const {
            addControlProps,
            bulkAddProps,
            editorModel,
            metricFeatureArea,
            onChange,
            processBulkData,
            containerPath,
        } = this.props;
        const nounPlural = addControlProps?.nounPlural;
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
        const gridColumns = this.getBulkToGridColumns();
        if (pivotKey && pivotValues?.length > 0) {
            const changes = await addRowsPerPivotValue(
                editorModel,
                numItems,
                pivotKey,
                pivotValues,
                bulkData,
                containerPath,
                gridColumns
            );
            onChange(EditableGridEvent.BULK_ADD, changes, editorModel);
        } else {
            const changes = await addRows(editorModel, numItems, bulkData, containerPath, gridColumns);
            onChange(EditableGridEvent.BULK_ADD, changes, editorModel);
        }

        if (metricFeatureArea) {
            incrementClientSideMetricCount(metricFeatureArea, 'bulkAdd');
        }

        // Result of this promise passed to toggleBulkAdd, which doesn't expect anything to be passed
        return Promise.resolve();
    };

    bulkUpdate = async (updatedData: OrderedMap<string, any>): Promise<Partial<EditorModelProps>> => {
        const { editorModel, onChange, bulkUpdateProps, metricFeatureArea, containerPath } = this.props;
        if (!updatedData) return Promise.resolve(undefined);

        const selectedIndices = this.getSelectedRowIndices();
        const editorModelChanges = await updateGridFromBulkForm(
            editorModel,
            updatedData,
            selectedIndices,
            bulkUpdateProps?.excludeRowIdx,
            bulkUpdateProps?.isIncludedColumn,
            containerPath
        );
        onChange(EditableGridEvent.BULK_UPDATE, editorModelChanges, editorModel);

        if (metricFeatureArea) {
            incrementClientSideMetricCount(metricFeatureArea, 'bulkUpdate');
        }

        // The result of this promise is used by toggleBulkUpdate, which doesn't expect anything to be passed
        return Promise.resolve(editorModelChanges);
    };

    addRows = async (count: number): Promise<void> => {
        const { editorModel, onChange, containerPath } = this.props;
        const changes = await addRows(editorModel, count, undefined, containerPath);
        onChange(EditableGridEvent.ADD_ROWS, changes);
    };

    renderAddRowsControl = (placement: PlacementType): ReactNode => {
        const { addControlProps, editorModel, isSubmitting, maxRows } = this.props;
        let maxCount = addControlProps?.maxCount;

        if (maxRows && editorModel.rowCount + (addControlProps?.maxCount ?? 0) > maxRows) {
            maxCount = maxRows - editorModel.rowCount;
        }

        return (
            <AddRowsControl
                {...addControlProps}
                disable={isSubmitting || (maxRows && editorModel.rowCount >= maxRows)}
                maxCount={maxCount}
                maxTotalCount={maxRows}
                onAdd={this.addRows}
                placement={placement}
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
            editorModel,
            isSubmitting,
            maxRows,
            showAsTab,
        } = this.props;
        const nounPlural = addControlProps?.nounPlural ?? 'rows';
        const showAddOnTop = allowAdd && this.getControlsPlacement() !== 'bottom';
        const invalidSel = this.state.selected.size === 0;
        const canAddRows = !isSubmitting && editorModel.rowCount < maxRows;
        const addTitle = canAddRows
            ? 'Add multiple ' + nounPlural + ' with the same values'
            : 'The grid contains the maximum number of ' + nounPlural + '.';
        const actionButtonClassNames = classNames('editable-grid-buttons__action-buttons', {
            'col-sm-9': showAddOnTop,
            'col-sm-12': !showAddOnTop,
        });

        return (
            <div className="row editable-grid-buttons">
                {showAddOnTop && <div className="col-sm-3">{this.renderAddRowsControl('top')}</div>}
                <div className={actionButtonClassNames}>
                    {!showAsTab && allowBulkAdd && (
                        <button
                            className="bulk-add-button btn btn-default"
                            disabled={!canAddRows}
                            onClick={this.toggleBulkAdd}
                            title={addTitle}
                            type="button"
                        >
                            {bulkAddText}
                        </button>
                    )}
                    {!showAsTab && allowBulkUpdate && (
                        <button
                            className="bulk-update-button btn btn-default"
                            disabled={invalidSel}
                            onClick={this.toggleBulkUpdate}
                            type="button"
                        >
                            {bulkUpdateText}
                        </button>
                    )}
                    {allowBulkRemove && (
                        <button
                            className="bulk-remove-button btn btn-default"
                            disabled={invalidSel}
                            onClick={this.removeSelected}
                            type="button"
                        >
                            {bulkRemoveText}
                        </button>
                    )}
                </div>
            </div>
        );
    };

    renderBulkAdd = (): ReactNode => {
        const { addControlProps, bulkAddProps, editorModel, forUpdate, maxRows, containerPath } = this.props;
        const { rowCount, queryInfo } = editorModel;
        const amountLeft = maxRows - rowCount;
        const maxToAdd = maxRows && amountLeft < MAX_EDITABLE_GRID_ROWS ? amountLeft : MAX_EDITABLE_GRID_ROWS;
        return (
            <QueryInfoForm
                onSubmitForEdit={this.bulkAdd}
                asModal
                checkRequiredFields={false}
                showLabelAsterisk
                submitForEditText={`Add ${capitalizeFirstChar(addControlProps?.nounPlural)} to Grid`}
                maxCount={maxToAdd}
                onHide={this.toggleBulkAdd}
                operation={forUpdate ? Operation.update : Operation.insert}
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
                containerPath={containerPath}
            />
        );
    };

    getControlsPlacement = (): PlacementType => {
        return this.props.addControlProps?.placement ?? 'bottom';
    };

    getGridData(): List<Map<string, any>> {
        const { editorModel, hideReadonlyRows, readonlyRows } = this.props;
        let gridData = List<Map<string, any>>();

        for (let i = 0; i < editorModel.rowCount; i++) {
            const pkFieldKey = editorModel.pkFieldKey;
            const pkValue = editorModel.getPkValue(i)?.toString();
            if (hideReadonlyRows && readonlyRows && readonlyRows.includes(pkValue)) continue;
            const row = { [GRID_EDIT_INDEX]: i };

            // FIXME: this is a hack that is needed for FM in order to properly render the position column, but I don't
            //  have time to fix that right now. For more context look at BoxViewerModel.getLocationColumn.
            if (pkFieldKey && pkValue) row[pkFieldKey] = pkValue;
            gridData = gridData.push(Map(row));
        }

        return gridData;
    }

    onBulkUpdateFormDataChange = (pendingBulkFormData?: any): void => {
        const { showAsTab, bulkUpdateProps } = this.props;

        bulkUpdateProps?.onBulkUpdateFormDataChange?.(pendingBulkFormData);

        if (showAsTab) {
            this.setState({ pendingBulkFormData });
        }
    };

    applyPendingBulkFormData = (): void => {
        const { pendingBulkFormData } = this.state;
        this.bulkUpdate(pendingBulkFormData).then(() => {
            this.setState({
                pendingBulkFormData: undefined,
                activeEditTab: EditableGridTabs.Grid,
            });
        });
    };

    onTabChange = (newTabKey: string): void => {
        const { bulkUpdateProps } = this.props;
        const { activeEditTab } = this.state;

        if (newTabKey === EditableGridTabs.Grid && activeEditTab === EditableGridTabs.BulkUpdate) {
            this.applyPendingBulkFormData();
        } else if (newTabKey === EditableGridTabs.BulkUpdate && activeEditTab === EditableGridTabs.Grid) {
            if (bulkUpdateProps?.onClickBulkUpdate) {
                bulkUpdateProps
                    .onClickBulkUpdate(this.state.selected)
                    .then(canEdit => {
                        if (!canEdit) return;

                        this.setState({ activeEditTab: newTabKey });
                    })
                    .catch(error => {
                        console.error(error);
                    });
            } else {
                this.setState({ activeEditTab: newTabKey });
            }
        }
    };

    renderBulkUpdate = (): ReactNode => {
        const { addControlProps, bulkUpdateProps, editorModel, forUpdate, showAsTab, containerPath } = this.props;
        const { pendingBulkFormData } = this.state;

        return (
            <>
                {bulkUpdateProps?.applyBulkUpdateBtnText && (
                    <button
                        className="btn btn-primary"
                        disabled={Utils.isEmptyObj(pendingBulkFormData?.toJS())}
                        onClick={this.applyPendingBulkFormData}
                        type="button"
                    >
                        {bulkUpdateProps.applyBulkUpdateBtnText}
                    </button>
                )}
                <BulkAddUpdateForm
                    asModal={!showAsTab}
                    columnFilter={bulkUpdateProps?.columnFilter}
                    containerPath={containerPath}
                    editorModel={editorModel}
                    onFormChangeWithData={showAsTab ? this.onBulkUpdateFormDataChange : undefined}
                    onHide={this.toggleBulkUpdate}
                    onSubmitForEdit={this.bulkUpdate}
                    onSuccess={this.toggleBulkUpdate}
                    operation={forUpdate ? Operation.update : Operation.insert}
                    pluralNoun={addControlProps?.nounPlural}
                    queryFilters={bulkUpdateProps?.queryFilters}
                    selectedRowIndexes={this.getSelectedRowIndices()}
                    singularNoun={addControlProps?.nounSingular}
                    warning={bulkUpdateProps?.warning}
                />
            </>
        );
    };

    render(): ReactNode {
        const {
            allowAdd,
            editorModel,
            fixedHeight,
            emptyGridMsg,
            allowBulkUpdate,
            showAsTab,
            maxRows,
            hideTopControls,
            tabContainerCls,
            gridTabHeaderComponent,
            hideCountCol,
            lockLeftOnScroll,
        } = this.props;
        const { showBulkAdd, showBulkUpdate, showMask, activeEditTab, selected } = this.state;
        const showCheckboxes = this.showSelectionCheckboxes();
        const showCountCol = !hideCountCol;

        const gridContent = (
            <>
                {!hideTopControls && this.renderTopControls()}
                {gridTabHeaderComponent}
                <div
                    className={classNames(EDITABLE_GRID_CONTAINER_CLS, 'grid-panel__lock-left', {
                        'grid-panel__lock-left-with-checkboxes': showCheckboxes,
                        'grid-panel__lock-left-with-countcol': lockLeftOnScroll && showCountCol && !showCheckboxes,
                        'grid-panel__lock-left-with-checkboxes-and-countcol':
                            lockLeftOnScroll && showCountCol && showCheckboxes,
                        'loading-mask': showMask,
                    })}
                    onKeyDown={this.onKeyDown}
                    onMouseDown={this.beginDrag}
                    onMouseUp={this.onMouseUp}
                >
                    <Grid
                        calcWidths
                        cellular
                        columns={this.generateColumns()}
                        data={this.getGridData()}
                        emptyText={emptyGridMsg}
                        fixedHeight={fixedHeight}
                        headerCell={this.headerCell}
                        rowKey={GRID_EDIT_INDEX}
                    />
                </div>
                {allowAdd && this.getControlsPlacement() !== 'top' && this.renderAddRowsControl('bottom')}
            </>
        );

        if (showAsTab) {
            const bulkDisabled = selected.size === 0;
            const showGrid = editorModel.rowCount <= maxRows;

            return (
                <Tabs activeKey={activeEditTab} className={tabContainerCls} onSelect={this.onTabChange}>
                    {/* TODO: tabbed bulk add not yet supported */}
                    {allowBulkUpdate && (
                        <Tab
                            className="top-padding"
                            disabled={bulkDisabled}
                            eventKey={EditableGridTabs.BulkUpdate}
                            title="Edit in Bulk"
                        >
                            {this.renderBulkUpdate()}
                        </Tab>
                    )}
                    {showGrid && (
                        <Tab className="top-padding" eventKey={EditableGridTabs.Grid} title="Edit Individually">
                            {gridContent}
                        </Tab>
                    )}
                </Tabs>
            );
        }

        return (
            <div className="editable-grid-wrapper">
                {gridContent}
                {showBulkAdd && this.renderBulkAdd()}
                {showBulkUpdate && this.renderBulkUpdate()}
            </div>
        );
    }
}
