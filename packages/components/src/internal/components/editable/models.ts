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
import { Filter, Query, Utils } from '@labkey/api';
import { fromJS, Iterable, List, Map, Record as ImmutableRecord, Set as ImmutableSet } from 'immutable';
import { ReactNode } from 'react';

import { encodePart } from '../../../public/SchemaQuery';

import { QueryInfo } from '../../../public/QueryInfo';

import { QueryColumn } from '../../../public/QueryColumn';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { getQueryColumnRenderers } from '../../global';
import { caseInsensitive, isQuotedWithDelimiters, quoteValueWithDelimiters } from '../../util/utils';

import { CellCoordinates, EditableGridEvent } from './constants';
import {
    genCellKey,
    genCellKeyPrefix,
    getValidatedEditableGridValue,
    isSparseSelection,
    parseCellKey,
    sortCellKeys,
} from './utils';

export interface EditableColumnMetadata {
    align?: string;
    caption?: string;
    containerFilter?: Query.ContainerFilter;
    filteredLookupKeys?: List<any>;
    filteredLookupValues?: List<string>;
    getFilteredLookupKeys?: (linkedValues: any[]) => Promise<List<any>>;
    hideTitleTooltip?: boolean;
    isReadOnlyCell?: (rowKey: string) => boolean;
    linkedColInd?: number; // TODO: change to linkedColFieldKey
    lookupValueFilters?: Filter.IFilter[];
    minWidth?: number;
    onRemoveColumn?: (col: QueryColumn) => void;
    placeholder?: string;
    popoverClassName?: string;
    toolTip?: ReactNode;
    width?: number;
}

export interface ValueDescriptor {
    display: any;
    raw: any;
}

export interface CellMessage {
    message: string;
}

interface CellReadStatus {
    isReadonlyCell: boolean;
    isReadonlyRow: boolean;
}

export type CellMessages = Map<string, CellMessage>;
export type CellValues = Map<string, List<ValueDescriptor>>;

export interface EditorModelProps {
    cellMessages: CellMessages;
    cellValues: CellValues;
    // columnMap is a Map of fieldKey to QueryColumn, it includes potentially hidden columns such as RowId or Container,
    // which are necessary when updating data. If you need the visible columns use orderedColumns.
    columnMap: Map<string, QueryColumn>;
    columnMetadata: Map<string, EditableColumnMetadata>;
    deletedIds: ImmutableSet<any>;
    focusColIdx: number;
    focusRowIdx: number;
    focusValue: List<ValueDescriptor>;
    orderedColumns: List<string>; // List of fieldKeys for the visible columns in the grid
    originalData: Map<string, Map<string, any>>; // The original data associated with this model if we're updating rows
    queryInfo: QueryInfo;
    rowCount: number;
    selectedColIdx: number;
    selectedRowIdx: number;
    selectionCells: string[];
    tabTitle?: string;
}

const DATA_CHANGE_EVENTS: EditableGridEvent[] = [
    EditableGridEvent.ADD_ROWS,
    EditableGridEvent.BULK_ADD,
    EditableGridEvent.BULK_UPDATE,
    EditableGridEvent.DRAG_FILL,
    EditableGridEvent.FILL_TEXT,
    EditableGridEvent.MODIFY_CELL,
    EditableGridEvent.PASTE,
    EditableGridEvent.REMOVE_ROWS,
];

const SELECTION_EVENTS: EditableGridEvent[] = [
    EditableGridEvent.CLEAR_SELECTION,
    EditableGridEvent.FOCUS_CELL,
    EditableGridEvent.SELECT_CELL,
];

export enum EditorMode {
    Insert,
    Update,
}

export const FOLDER_COL = 'Folder';
export type UpdatedRowValue = string | string[] | number | number[] | boolean | boolean[];
export type UpdatedRow = Record<string, UpdatedRowValue>;

export class EditorModel
    extends ImmutableRecord({
        cellMessages: Map<string, CellMessage>(),
        cellValues: Map<string, List<ValueDescriptor>>(),
        columnMap: Map<string, QueryColumn>,
        columnMetadata: Map<string, EditableColumnMetadata>(),
        deletedIds: ImmutableSet<any>(),
        focusColIdx: -1,
        focusRowIdx: -1,
        focusValue: undefined,
        id: undefined,
        isSparseSelection: false,
        orderedColumns: List<string>(),
        originalData: undefined,
        queryInfo: undefined,
        rowCount: 0,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: [],
        tabTitle: undefined,
    })
    implements EditorModelProps
{
    declare cellMessages: CellMessages;
    declare cellValues: CellValues;
    declare columnMap: Map<string, QueryColumn>;
    declare columnMetadata: Map<string, EditableColumnMetadata>;
    declare deletedIds: ImmutableSet<any>;
    declare focusColIdx: number;
    declare focusRowIdx: number;
    declare focusValue: List<ValueDescriptor>;
    // NK: This is precomputed property that is updated whenever the selection is updated. See applyChanges().
    declare isSparseSelection: boolean;
    declare orderedColumns: List<string>;
    declare originalData: Map<string, Map<string, any>>;
    declare queryInfo: QueryInfo;
    declare rowCount: number;
    declare selectedColIdx: number; // TODO: replace with selectedFieldKey
    declare selectedRowIdx: number;
    // NK: This is pre-sorted array that is updated whenever the selection is updated.
    // See applyEditableGridChangesToModels().
    declare selectionCells: string[];
    declare tabTitle: string;

    get pkFieldKey(): string {
        // You are not guaranteed to have pkCols, specifically in insert cases
        return this.queryInfo.getPkCols()[0]?.fieldKey;
    }

    genPkCellKey(rowIndex: number): string {
        const pkFieldKey = this.pkFieldKey;

        if (pkFieldKey === undefined) return undefined;

        return genCellKey(pkFieldKey, rowIndex);
    }

    /**
     * Gets the pkValue for a given rowIndex. This assumes there is a single PK column, and is mostly used for handling
     * readonly rows. If you are getting pkValues in order to send data to the server use getPkValues, which will
     * honor multiple PK columns.
     */
    getPkValue(rowIndex: number): any {
        const cellKey = this.genPkCellKey(rowIndex);

        if (cellKey === undefined) return undefined;

        return this.cellValues.get(cellKey)?.get(0).raw;
    }

    getPkValueForCell(cellKey: string): any {
        const { rowIdx } = parseCellKey(cellKey);
        return this.getPkValue(rowIdx);
    }

    /**
     * Gets all of the primary key values for a given row.
     * @param rowIndex
     */
    getPkValues(rowIndex: number): Record<string, any> {
        const data = {};
        const pkCols = new Set<string>();
        this.queryInfo.getPkCols().forEach(col => pkCols.add(col.fieldKey));
        this.queryInfo.altUpdateKeys?.forEach(key => pkCols.add(key));
        pkCols.forEach(pkCol => {
            const pkVal = this.getValue(pkCol, rowIndex).get(0).raw;

            if (pkVal !== undefined && pkVal !== null) {
                data[pkCol] = pkVal;
            } else {
                console.warn('Unable to find value for pkCol "' + pkCol + '"');
            }
        });
        return data;
    }

    getColumnMetadata(fieldKey: string) {
        return this.columnMetadata?.get(fieldKey.toLowerCase());
    }

    getFolderValueForRow(rowIdx: number): string {
        const containerCol = this.columnMap.get('folder') ?? this.columnMap.get('container');
        if (!containerCol) return undefined;
        return this.cellValues.get(genCellKey(containerCol.fieldKey, rowIdx))?.get(0)?.raw;
    }

    getFolderValueForCell(cellKey: string): string {
        const { rowIdx } = parseCellKey(cellKey);
        return this.getFolderValueForRow(rowIdx);
    }

    // TODO: make findNextCell take fieldKey
    findNextCell(
        startCol: number,
        startRow: number,
        predicate: (value: List<ValueDescriptor>, colIdx: number, rowIdx: number) => boolean,
        advance: (colIdx: number, rowIdx: number) => CellCoordinates, // TODO: make advance take fieldKey
        hideReadonlyRows: boolean,
        readonlyRows: string[]
    ): { colIdx: number; rowIdx: number; value: List<ValueDescriptor> } {
        let colIdx = startCol,
            rowIdx = startRow;

        while (true) {
            ({ colIdx, rowIdx } = advance(colIdx, rowIdx));
            if (!this.isInBounds(colIdx, rowIdx)) break;

            if (hideReadonlyRows && readonlyRows && this.isReadOnlyRow(rowIdx, readonlyRows)) continue;

            const fieldKey = this.getFieldKeyByIndex(colIdx);
            const value = this.getValue(fieldKey, rowIdx);
            if (predicate(value, colIdx, rowIdx)) {
                return {
                    value,
                    colIdx,
                    rowIdx,
                };
            }
        }

        // not found
        return undefined;
    }

    get hasErrors(): boolean {
        return this.cellMessages?.some(cm => cm?.message !== undefined);
    }

    getMessage(fieldKey: string, rowIdx: number): CellMessage {
        return this.cellMessages.get(genCellKey(fieldKey, rowIdx));
    }

    getColumnValues(fieldKey: string): List<List<ValueDescriptor>> {
        const fieldKeyLower = fieldKey.toLowerCase();
        const colIdx = this.orderedColumns.indexOf(fieldKeyLower);
        if (colIdx === -1) {
            console.warn(`Unable to resolve column with fieldKey "${fieldKey}". Cannot retrieve column values.`);
            return List();
        }

        const values = List<List<ValueDescriptor>>().asMutable();
        for (let i = 0; i < this.rowCount; i++) {
            values.push(this.getValue(fieldKeyLower, i));
        }

        return values.asImmutable();
    }

    getColumnByIndex(colIdx: number): QueryColumn {
        return this.columnMap.get(this.orderedColumns.get(colIdx));
    }

    getFieldKeyByIndex(colIdx: number): string {
        return this.getColumnByIndex(colIdx)?.fieldKey;
    }

    /**
     * Formats the values for an entire row into a Map<string, any>
     * @param rowIdx
     * @param useRawValues If false we format the raw values
     * @param includeSampleDisplayVal If true we want to include the sample lookup display values in the row data
     */
    getRowValue(rowIdx: number, useRawValues = true, includeSampleDisplayVal = false): Map<string, any> {
        let row = Map<string, any>();

        this.columnMap.forEach(col => {
            const values = this.getValue(col.fieldKey, rowIdx);

            // Some column types have special handling of raw data, such as multi value columns like alias, so first
            // check renderer for how to retrieve raw data
            let renderer;
            if (col.columnRenderer) {
                renderer = getQueryColumnRenderers()[col.columnRenderer.toLowerCase()];
            }

            if (renderer?.getEditableRawValue) {
                row = row.set(col.name, renderer.getEditableRawValue(values));
            } else if (col.isLookup()) {
                if (col.isExpInput() || col.isAliquotParent()) {
                    // We have to use display values for ExpInput and AliquotParent because of name expressions
                    row = row.set(
                        col.name,
                        values
                            .filter(vd => vd.display !== undefined && vd.display !== null)
                            .map(vd => quoteValueWithDelimiters(vd.display, ','))
                            .join(', ')
                    );
                } else if (col.isJunctionLookup()) {
                    row = row.set(
                        col.name,
                        values
                            .filter(vd => vd.raw !== undefined && vd.raw !== null)
                            .map(vd => vd.raw)
                            .toArray()
                    );
                } else if (col.lookup.displayColumn === col.lookup.keyColumn) {
                    row = row.set(
                        col.name,
                        values.size === 1 ? quoteValueWithDelimiters(values.first()?.display, ',') : undefined
                    );
                } else {
                    let val;
                    if (values.size === 1) val = values.first()?.raw;
                    row = row.set(col.name, val);

                    // Issue 39517: include display value in the row data for sample lookup columns
                    const displayVal = values.size === 1 ? values.first()?.display : undefined;
                    if (includeSampleDisplayVal && col.isSampleLookup() && val !== displayVal) {
                        row = row.set(col.name + '/' + col.lookup.displayColumn, displayVal);
                    }
                }
            } else if (col.jsonType === 'time') {
                row = row.set(col.name, values.size === 1 ? values.first().raw : undefined);
            } else {
                let val = values.size === 1 ? values.first().raw : undefined;
                if (!useRawValues) {
                    // Issue 51967: Resolve the formatted/validated value.
                    // Specifically, for dates this will strip time zone context.
                    const origValue = col.jsonType === 'date' ? val : val?.toString().trim();
                    val = getValidatedEditableGridValue(origValue, col).value;
                }
                row = row.set(col.name, val);
            }
        });

        return row;
    }

    /**
     * This method formats the EditorModel data, so we can upload the data to LKS via insert/updateRows
     * @param useRawValues If false we format the raw values
     * @param includeSampleDisplayVal If true we want to include the sample lookup display values in the row data
     */
    getDataForServerUpload(useRawValues = true, includeSampleDisplayVal = false): List<Map<string, any>> {
        let rawData = List<Map<string, any>>();

        for (let rn = 0; rn < this.rowCount; rn++) {
            const row = this.getRowValue(rn, useRawValues, includeSampleDisplayVal);
            rawData = rawData.push(row);
        }

        return rawData;
    }

    /**
     * Determines which rows in the grid have missing required fields, which sets of rows have combinations
     * of key fields that are duplicated, and, optionally, which sets of rows have duplicated values for a
     * given field key.
     *
     * @param uniqueFieldKey optional (non-key) field that should be unique.
     */
    validateData(uniqueFieldKey?: string): {
        cellMessages: CellMessages; // updated cell messages with missing required errors
        missingRequired: Map<string, List<number>>; // map from column caption to row numbers with missing values
        uniqueKeyViolations: Map<string, Map<string, List<number>>>; // map from the column captions (joined by ,) to a map from values that are duplicates to row numbers.
    } {
        const columns = this.columnMap.valueSeq().toArray();
        let cellMessages = this.cellMessages;
        let uniqueFieldCol;
        const keyColumns = columns.filter(column => column.isKeyField);
        let keyValues = Map<number, List<string>>(); // map from row number to list of key values on that row
        let uniqueKeyMap = Map<string, List<number>>(); // map from value to rows with that value
        let missingRequired = Map<string, List<number>>(); // map from column caption to list of rows missing a value for that column
        for (let rn = 0; rn < this.rowCount; rn++) {
            columns.forEach(col => {
                const fieldKey = col.fieldKey;
                const cellKey = genCellKey(fieldKey, rn);
                const values = this.getValue(fieldKey, rn);
                if (col.required && !col.isUniqueIdColumn) {
                    const message = this.getMessage(fieldKey, rn);
                    const missingMsg = col.caption + ' is required.';
                    let updatedMsg = message?.message;
                    if (values.isEmpty() || values.find(value => this.hasRawValue(value)) === undefined) {
                        if (!message || message?.message?.indexOf(missingMsg) === -1) {
                            if (!message || !message.message) updatedMsg = missingMsg;
                            else updatedMsg = message.message + '. ' + missingMsg;
                        }

                        if (missingRequired.has(col.caption)) {
                            missingRequired = missingRequired.set(
                                col.caption,
                                missingRequired.get(col.caption).push(rn + 1)
                            );
                        } else {
                            missingRequired = missingRequired.set(col.caption, List<number>([rn + 1]));
                        }
                    } else {
                        if (updatedMsg?.indexOf(missingMsg) > -1) {
                            updatedMsg = updatedMsg.replace(missingMsg, '');
                        }
                    }
                    if (updatedMsg == null || updatedMsg.trim() === '') cellMessages = cellMessages.remove(cellKey);
                    else cellMessages = cellMessages.set(cellKey, { message: updatedMsg });
                }

                if (col.isKeyField) {
                    // there better be only one of these
                    const valueDescriptor = values.get(0);
                    if (this.hasRawValue(valueDescriptor)) {
                        if (keyValues.has(rn + 1)) {
                            keyValues = keyValues.set(
                                rn + 1,
                                keyValues.get(rn + 1).push(valueDescriptor.raw.toString())
                            );
                        } else {
                            keyValues = keyValues.set(rn + 1, List<string>([valueDescriptor.raw.toString()]));
                        }
                    }
                } else if (uniqueFieldKey && col.fieldKey.toLowerCase() === uniqueFieldKey.toLowerCase()) {
                    uniqueFieldCol = col;
                    // there better be only one of these
                    const valueDescriptor = values.get(0);
                    if (valueDescriptor && this.hasRawValue(valueDescriptor)) {
                        const stringVal = valueDescriptor.raw.toString().trim().toLowerCase();
                        if (uniqueKeyMap.has(stringVal)) {
                            uniqueKeyMap = uniqueKeyMap.set(stringVal, uniqueKeyMap.get(stringVal).push(rn + 1));
                        } else {
                            uniqueKeyMap = uniqueKeyMap.set(stringVal, List<number>([rn + 1]));
                        }
                    }
                }
            });
        }

        let uniqueKeyViolations = Map<string, Map<string, List<number>>>();
        const duplicates = uniqueKeyMap.filter(rowNumbers => rowNumbers.size > 1).toMap();
        if (duplicates.size > 0 && uniqueFieldCol) {
            uniqueKeyViolations = uniqueKeyViolations.set(uniqueFieldCol.caption, duplicates);
        }

        // Join all the keyValues together and put them in a map with a list of row
        // numbers with that key.  Then filter to those lists with more than one item.
        const keyViolations = keyValues
            .reduce((keyMap, values, rowNumber) => {
                const key = values.join(', ');
                if (keyMap.has(key)) return keyMap.set(key, keyMap.get(key).push(rowNumber));
                else return keyMap.set(key, List<number>([rowNumber]));
            }, Map<string, List<number>>())
            .filter(rowNumbers => rowNumbers.size > 1)
            .toMap();
        if (!keyViolations.isEmpty()) {
            uniqueKeyViolations = uniqueKeyViolations.set(
                keyColumns.map(column => column.caption).join(', '),
                keyViolations
            );
        }

        // need to return a map from the column names/captions to the rows with duplicates.
        // Message:
        //   Duplicate values (val1, val2) for <column1, column2> on rows X, Y, Z.
        return {
            uniqueKeyViolations,
            missingRequired,
            cellMessages,
        };
    }

    getValidationErrors(uniqueFieldKey?: string): { cellMessages: CellMessages; errors: string[] } {
        const { uniqueKeyViolations, missingRequired, cellMessages } = this.validateData(uniqueFieldKey);
        let errors = [];
        if (!uniqueKeyViolations.isEmpty()) {
            const messages = uniqueKeyViolations.reduce((keyMessages, valueMap, fieldNames) => {
                return keyMessages.concat(
                    valueMap.reduce((messages, rowNumbers, values) => {
                        messages.push(
                            'Duplicate value (' +
                                values +
                                ') for ' +
                                fieldNames +
                                ' on rows ' +
                                rowNumbers.join(', ') +
                                '.'
                        );
                        return messages;
                    }, new Array<string>())
                );
            }, new Array<string>());
            errors = errors.concat(messages);
        }
        if (!missingRequired.isEmpty()) {
            const messages = missingRequired
                .reduce((messages, rowNumbers, fieldName) => {
                    messages.push(
                        fieldName +
                            ' is missing from ' +
                            (rowNumbers.size > 1 ? 'rows ' : 'row ') +
                            rowNumbers.join(', ') +
                            '.'
                    );
                    return messages;
                }, new Array<string>())
                .join(' ');
            errors = errors.concat(messages);
        }

        return {
            errors,
            cellMessages,
        };
    }

    getValue(fieldKey: string, rowIdx: number): List<ValueDescriptor> {
        return this.getValueForCellKey(genCellKey(fieldKey, rowIdx));
    }

    getValuesForColumn(colFieldKey: string): Map<string, List<ValueDescriptor>> {
        return this.cellValues
            .filter((valueList, cellKey) => {
                return cellKey.startsWith(genCellKeyPrefix(colFieldKey));
            })
            .toMap();
    }

    getValueForCellKey(cellKey: string): List<ValueDescriptor> {
        if (this.cellValues.has(cellKey)) {
            return this.cellValues.get(cellKey) ?? List<ValueDescriptor>();
        }

        return List<ValueDescriptor>();
    }

    isReadOnlyRow(rowIdx: number, readonlyRows: string[]): boolean {
        const pkValue = this.getPkValue(rowIdx)?.toString();
        if (pkValue === undefined) return false;
        return readonlyRows?.includes(pkValue);
    }

    getCellReadStatus(fieldKey: string, rowIdx: number, readonlyRows: string[]): CellReadStatus {
        const pkValue = this.getPkValue(rowIdx)?.toString();

        return {
            isReadonlyCell: this.getColumnMetadata(fieldKey)?.isReadOnlyCell?.(pkValue) ?? false,
            isReadonlyRow: readonlyRows?.includes(pkValue) ?? false,
        };
    }

    get hasFocus(): boolean {
        return this.focusColIdx > -1 && this.focusRowIdx > -1;
    }

    get isMultiSelect(): boolean {
        return this.selectionCells.length > 1;
    }

    get isMultiColumnSelection(): boolean {
        if (!this.isMultiSelect) return false;

        const firstCellColIdx = parseCellKey(this.selectionCells[0]).fieldKey;
        return this.selectionCells.some(cellKey => parseCellKey(cellKey).fieldKey !== firstCellColIdx);
    }

    get hasSelection(): boolean {
        return this.selectedColIdx > -1 && this.selectedRowIdx > -1;
    }

    get selectionKey(): string {
        if (!this.hasSelection) return undefined;
        const fieldKey = this.getFieldKeyByIndex(this.selectedColIdx);
        return genCellKey(fieldKey, this.selectedRowIdx);
    }

    isInBounds(colIdx: number, rowIdx: number): boolean {
        return colIdx >= 0 && colIdx < this.orderedColumns.size && rowIdx >= 0 && rowIdx < this.rowCount;
    }

    inSelection(fieldKey: string, rowIdx: number): boolean {
        if (rowIdx < 0) return false;
        const cellKey = genCellKey(fieldKey, rowIdx);
        return this.selectionCells.find(ck => cellKey === ck) !== undefined;
    }

    hasRawValue(descriptor: ValueDescriptor): boolean {
        return descriptor && descriptor.raw != null && descriptor.raw.toString().trim() !== '';
    }

    get hasData(): boolean {
        return (
            this.cellValues.find(valueList => {
                return valueList?.find(value => this.hasRawValue(value)) !== undefined;
            }) !== undefined
        );
    }

    isFocused(colIdx: number, rowIdx: number): boolean {
        return colIdx > -1 && rowIdx > -1 && this.focusColIdx === colIdx && this.focusRowIdx === rowIdx;
    }

    isSelected(colIdx: number, rowIdx: number): boolean {
        return colIdx > -1 && rowIdx > -1 && this.selectedColIdx === colIdx && this.selectedRowIdx === rowIdx;
    }

    static isDataChangeEvent(event: EditableGridEvent): boolean {
        return DATA_CHANGE_EVENTS.find(e => e === event) !== undefined;
    }

    static isSelectionEvent(event: EditableGridEvent): boolean {
        return SELECTION_EVENTS.find(e => e === event) !== undefined;
    }

    static getEditorDataFromQueryValueMap(valueMap: any): List<any> | any {
        // Editor expects to get either a single value or an array of an object with fields displayValue and value
        if (List.isList(valueMap)) {
            return (valueMap as List<any>)
                .map(val => {
                    // If immutable convert to normal JS
                    if (Iterable.isIterable(val)) {
                        return { displayValue: val.get('displayValue'), value: val.get('value') };
                    }
                    return val;
                })
                .toList();
        }

        if (valueMap?.has('value') && valueMap.get('value') !== null && valueMap.get('value') !== undefined) {
            if (valueMap.has('formattedValue')) {
                return List.of({ displayValue: valueMap.get('formattedValue'), value: valueMap.get('value') });
            }
            if (valueMap.has('displayValue')) {
                return List.of({ displayValue: valueMap.get('displayValue'), value: valueMap.get('value') });
            }
            return valueMap.get('value');
        }

        return undefined;
    }

    static convertQueryDataToEditorData(
        data: Map<string, any>,
        updates?: Map<any, any>,
        idsNotToUpdate?: number[],
        fieldsNotToUpdate?: string[],
        encode = true
    ): Map<any, Map<string, any>> {
        return data
            .map((valueMap, id) => {
                const returnMap = valueMap.reduce((m, valueMap_, key) => {
                    const editorData = EditorModel.getEditorDataFromQueryValueMap(valueMap_);
                    if (editorData === undefined) {
                        return m;
                    }

                    // data maps have keys that are display names/captions. We need to convert to the
                    // encoded keys used in our filters to match up with values from the forms.
                    const key_ = encode ? encodePart(key) : key;
                    return m.set(key_, editorData);
                }, Map<any, any>());

                if (!updates) {
                    return returnMap;
                }

                if (!idsNotToUpdate || idsNotToUpdate.indexOf(parseInt(id, 10)) < 0 || !fieldsNotToUpdate) {
                    return returnMap.merge(updates);
                }

                let trimmedUpdates = Map<any, any>();
                updates.forEach((value, fieldKey) => {
                    if (fieldsNotToUpdate.indexOf(fieldKey.toLowerCase()) < 0) {
                        trimmedUpdates = trimmedUpdates.set(fieldKey, value);
                    }
                });
                return returnMap.merge(trimmedUpdates);
            })
            .toMap();
    }

    static convertQueryModelDataToGridResponse(model: QueryModel): GridResponse {
        const data = {};
        const dataIds = [];

        model.orderedRows.forEach(pk => {
            data[pk] = model.rows[pk];
            dataIds.push(pk);
        });

        return {
            data: EditorModel.convertQueryDataToEditorData(fromJS(data), undefined, undefined, undefined, false),
            dataIds: fromJS(dataIds),
        };
    }

    lastSelection(fieldKey: string, rowIdx: number): boolean {
        const cellKeys = this.isMultiSelect ? this.selectionCells : [this.selectionKey];
        return genCellKey(fieldKey, rowIdx) === cellKeys[cellKeys.length - 1];
    }

    applyChanges(changes: Partial<EditorModel>): EditorModel {
        let editorModel = this.merge(changes) as EditorModel;
        // NK: The "selectionCells" property is of type string[]. When merge() is used it utilizes
        // Immutable.fromJS() which turns the Array into a List. We want to maintain the property
        // as an Array so here we set it explicitly.
        if (changes?.selectionCells !== undefined) {
            const selectionCells = sortCellKeys(editorModel.orderedColumns.toArray(), changes.selectionCells);
            editorModel = editorModel.set('selectionCells', selectionCells) as EditorModel;
            editorModel = editorModel.set(
                'isSparseSelection',
                isSparseSelection(editorModel.orderedColumns.toArray(), selectionCells)
            ) as EditorModel;
        }

        return editorModel;
    }

    /**
     * Constructs an array of objects (suitable for the rows parameter of updateRows), where each object contains the
     * values in editorRows that are different from the ones in originalGridData
     *
     * originalData: The original data to compare against. We need this as argument to support bulk edit, as
     * EditorModels are initialized with data that has bulk changes applied, and we still want to account for the bulk
     * changes even if a user didn't change anything in an EditableGrid.
     */
    getUpdatedData(originalData?: Map<string, Map<string, any>>): UpdatedRow[] {
        // If we have data from bulk edit then we need to use that as originalData instead of the data on the EditorModel
        // otherwise we'll incorrectly diff the changes
        originalData = originalData ? EditorModel.convertQueryDataToEditorData(originalData) : this.originalData;
        const editorRows = this.getDataForServerUpload().toArray();
        const pkFieldKey = this.pkFieldKey;
        const queryInfo = this.queryInfo;
        const updatedRows: UpdatedRow[] = [];
        editorRows.forEach((editedRow, idx) => {
            const id = editedRow.get(pkFieldKey);
            const altIds = {};
            queryInfo.altUpdateKeys?.forEach(altIdField => {
                altIds[altIdField] = altIdField ? editedRow.get(altIdField) : undefined;
            });
            const originalRow = originalData.get(id.toString());
            if (originalRow) {
                const row = editedRow.reduce((row, value, key) => {
                    // We can skip the idField for the diff check, that will be added to the updated rows later
                    if (key === pkFieldKey) return row;

                    let originalValue = originalRow.get(key, undefined);
                    // For lineage grids the parent columns aren't on the queryInfo
                    const col = queryInfo.getColumn(key) ?? this.columnMap.get(key.toLowerCase());

                    // we can skip any readOnly columns or non-userEditable columns
                    if (col?.readOnly || !col?.userEditable) return row;

                    // Convert empty cell to null
                    if (value === '') value = null;

                    // Some column types have special handling of raw data, i.e. StoredAmount and Units (issue 49502)
                    if (col?.columnRenderer) {
                        const renderer = getQueryColumnRenderers()[col.columnRenderer.toLowerCase()];
                        if (renderer?.getOriginalRawValue) {
                            originalValue = renderer.getOriginalRawValue(originalValue);
                        }
                    }

                    // Lookup columns store a list but grid only holds a single value
                    if (List.isList(originalValue) && !Array.isArray(value)) {
                        if (col.isExpInput()) {
                            // We have to compare displayValues for ExpInput columns for name expressions to work
                            originalValue = originalValue.map(v => v.displayValue).join(', ');
                        } else {
                            const valueObj = originalValue.get(0);
                            originalValue = Map.isMap(valueObj) ? valueObj.get('value') : valueObj.value;
                        }
                    }

                    // EditableGrid passes in strings for single values. Attempt this conversion here to help check for
                    // updated values. This is not the final type check.
                    if (typeof originalValue === 'number' || typeof originalValue === 'boolean') {
                        try {
                            if (!isQuotedWithDelimiters(value, ',')) value = JSON.parse(value);
                        } catch (e) {
                            // Incorrect types are handled by API and user feedback created from that response. Don't need
                            // to handle that here.
                        }
                    } else if (Iterable.isIterable(originalValue) && !List.isList(originalValue)) {
                        originalValue = originalValue.get('value');
                    }

                    // If col is a multi-value column, compare all values for changes
                    if ((List.isList(originalValue) || originalValue === undefined) && Array.isArray(value)) {
                        if ((originalValue?.size ?? 0) !== value.length) {
                            row[key] = value;
                        } else if (originalValue) {
                            if (Map.isMap(originalValue.get(0))) {
                                // filter to those values that no longer exist in the new value array
                                const filtered = originalValue.filter(
                                    o =>
                                        value.indexOf(o.get('value')) === -1 &&
                                        value.indexOf(o.get('displayValue')) === -1
                                );
                                if (filtered.size > 0) {
                                    row[key] = value;
                                }
                            } else if (
                                originalValue?.findIndex(
                                    o => value.indexOf(o.value) === -1 && value.indexOf(o.displayValue) === -1
                                ) !== -1
                            ) {
                                row[key] = value;
                            }
                        }
                    } else if (!(originalValue == undefined && value == undefined) && originalValue !== value) {
                        // only update if the value has changed
                        // Issue 51967: We need to ensure that we get the processed/formatted value of the row
                        const formattedRow = this.getRowValue(idx, false);
                        const formattedValue = formattedRow.get(key);

                        // if the value is 'undefined', it will be removed from the update rows, so in order to
                        // erase an existing value we set the value to null in our update data
                        row[key] = formattedValue === undefined ? null : formattedValue;
                    }
                    return row;
                }, {});
                if (!Utils.isEmptyObj(row)) {
                    row[pkFieldKey] = id;
                    // Always append folder if it's in the original data so cross folder updates work
                    const folder = caseInsensitive(originalRow?.toJS(), FOLDER_COL)?.[0]?.value;
                    if (folder !== undefined) row[FOLDER_COL] = folder;
                    Object.assign(row, altIds);
                    updatedRows.push(row);
                }
            } else {
                console.error('Unable to find original row for id ' + id);
            }
        });
        return updatedRows;
    }
}

export interface GridResponse {
    data: Map<any, any>;
    dataIds: List<any>;
}

/**
 * TODO: GridLoader and EditableGridLoader are artifacts of QueryGridModel, this is why they return GridResponse, which
 * uses Immutable, despite the data loaded from EditableGridLoaders going into QueryModels, which end up converting the
 * data back to regular JS objects. We should revisit this class, and consider maybe using QueryModelLoaders instead, or
 * maybe something else altogether. Many cases of EditableGridLoader do not actually asynchronously fetch data, since
 * they get their data from existing QueryModels, we may be able to eliminate the need for async fetch altogether.
 *
 * Implementations that do not asynchronously load data:
 * - MoveSamplesGridLoader
 * - SingleStorageEditableGridLoader
 * - AssayWizardModelEditableGridLoader
 * - PlateSetCreateGridLoader
 * - PlateGridLoader
 * - EntityGridLoader
 * - MultiStorageGridLoader
 *
 * Implementations that do asynchronously load data:
 * - StorageEditableGridLoaderFromSelection (uses getSelectedData)
 * - EditableGridLoaderFromSelection (uses getSelectedData)
 */
export interface GridLoader {
    fetch: () => Promise<GridResponse>;
}

export interface EditableGridLoader extends GridLoader {
    columns?: QueryColumn[];
    extraColumns?: QueryColumn[]; // These are columns we want in the EditorModel.columnMap, but not in orderedColumns
    id: string;
    mode: EditorMode;
    omittedColumns?: string[];
    queryInfo: QueryInfo;
    requiredColumns?: string[];
}

export interface MessageAndValue {
    message?: CellMessage;
    valueDescriptor: ValueDescriptor;
}
