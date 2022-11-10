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
import { fromJS, Iterable, List, Map, Record, Set } from 'immutable';

import { encodePart } from '../../../public/SchemaQuery';

import { QueryInfo } from '../../../public/QueryInfo';

import { QueryColumn } from '../../../public/QueryColumn';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { genCellKey, getSortedCellKeys, parseCellKey } from '../../utils';
import { getQueryColumnRenderers } from '../../global';
import { GRID_EDIT_INDEX } from '../../constants';
import { getColDateFormat, getJsonDateTimeFormatString, parseDate } from '../../util/Date';
import { quoteValueWithDelimiters } from '../../util/utils';

export interface ValueDescriptor {
    display: any;
    raw: any;
}

export interface CellMessage {
    message: string;
}

export type CellMessages = Map<string, CellMessage>;
export type CellValues = Map<string, List<ValueDescriptor>>;

export interface EditorModelProps {
    cellMessages: CellMessages;
    cellValues: CellValues;
    colCount: number;
    focusColIdx: number;
    focusRowIdx: number;
    focusValue: List<ValueDescriptor>;
    id: string;
    rowCount: number;
    selectedColIdx: number;
    selectedRowIdx: number;
    selectionCells: Set<string>;
}

export function getPkData(queryInfo: QueryInfo, row: Map<string, any>) {
    const data = {};
    queryInfo.getPkCols().forEach(pkCol => {
        let pkVal = row.getIn([pkCol.fieldKey]);
        if (Array.isArray(pkVal)) pkVal = pkVal[0];
        if (List.isList(pkVal)) pkVal = pkVal.get(0);

        if (pkVal !== undefined && pkVal !== null) {
            // when backing an editable grid, the data is a simple value, but when
            // backing a grid, it is a Map, which has type 'object'.
            if (Map.isMap(pkVal)) pkVal = pkVal.toJS();

            data[pkCol.fieldKey] = typeof pkVal === 'object' ? pkVal.value : pkVal;
        } else {
            console.warn('Unable to find value for pkCol "' + pkCol.fieldKey + '"');
        }
    });
    return data;
}

export enum EditorMode {
    Insert,
    Update,
}

export class EditorModel
    extends Record({
        cellMessages: Map<string, CellMessage>(),
        cellValues: Map<string, List<ValueDescriptor>>(),
        colCount: 0,
        deletedIds: Set<any>(),
        id: undefined,
        isPasting: false,
        focusColIdx: -1,
        focusRowIdx: -1,
        focusValue: undefined,
        numPastedRows: 0,
        rowCount: 0,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: Set<string>(),
    })
    implements EditorModelProps
{
    declare cellMessages: CellMessages;
    declare cellValues: CellValues;
    declare colCount: number;
    declare deletedIds: Set<any>;
    declare id: string;
    declare isPasting: boolean;
    declare focusColIdx: number;
    declare focusRowIdx: number;
    declare focusValue: List<ValueDescriptor>;
    declare numPastedRows: number;
    declare rowCount: number;
    declare selectedColIdx: number;
    declare selectedRowIdx: number;
    declare selectionCells: Set<string>;

    findNextCell(
        startCol: number,
        startRow: number,
        predicate: (value: List<ValueDescriptor>, colIdx: number, rowIdx: number) => boolean,
        advance: (colIdx: number, rowIdx: number) => { colIdx: number; rowIdx: number }
    ) {
        let colIdx = startCol,
            rowIdx = startRow;

        while (true) {
            ({ colIdx, rowIdx } = advance(colIdx, rowIdx));
            if (!this.isInBounds(colIdx, rowIdx)) break;

            const value = this.getValue(colIdx, rowIdx);
            if (predicate(value, colIdx, rowIdx)) {
                return {
                    value,
                    colIdx,
                    rowIdx,
                };
            }
        }

        // not found
        return null;
    }

    getMessage(colIdx: number, rowIdx: number): CellMessage {
        return this.cellMessages.get(genCellKey(colIdx, rowIdx));
    }

    getColumns(
        queryInfo: QueryInfo,
        forUpdate?: boolean,
        readOnlyColumns?: List<string>,
        insertColumns?: List<QueryColumn>,
        updateColumns?: List<QueryColumn>,
        colFilter?: (col: QueryColumn) => boolean
    ): List<QueryColumn> {
        let columns;

        if (forUpdate) {
            columns = updateColumns ?? queryInfo.getUpdateColumns(readOnlyColumns);
        } else {
            columns = insertColumns ?? queryInfo.getInsertColumns();
        }

        if (colFilter) columns = columns.filter(colFilter);
        // file input columns are not supported in the editable grid, so remove them
        return columns.filter(col => !col.isFileInput);
    }

    getRawDataFromGridData(
        data: Map<any, Map<string, any>>,
        dataKeys: List<any>,
        queryInfo: QueryInfo,
        displayValues = true,
        forUpdate = false,
        readOnlyColumns?: List<string>,
        extraColumns?: Array<Partial<QueryColumn>>,
        colFilter?: (col: QueryColumn) => boolean,
        forExport?: boolean
    ): List<Map<string, any>> {
        let rawData = List<Map<string, any>>();
        const columns = this.getColumns(queryInfo, forUpdate, readOnlyColumns, undefined, undefined, colFilter);
        const additionalColumns = [];
        if (extraColumns) {
            extraColumns.forEach(col => {
                const column = queryInfo.getColumn(col.fieldKey);
                if (column) additionalColumns.push(column);
            });
        }

        for (let rn = 0; rn < dataKeys.size; rn++) {
            let row = Map<string, any>();
            columns.push(...additionalColumns).forEach((col, cn) => {
                const values = this.getValue(cn, rn);

                // Some column types have special handling of raw data, such as multi value columns like alias,
                // so first check renderer for how to retrieve raw data
                let renderer;
                if (col.columnRenderer) {
                    renderer = getQueryColumnRenderers()[col.columnRenderer.toLowerCase()];
                }

                if (renderer?.getEditableRawValue) {
                    row = row.set(col.name, renderer.getEditableRawValue(values));
                } else if (col.isLookup()) {
                    if (col.isExpInput() || col.isAliquotParent()) {
                        let sep = '';
                        row = row.set(
                            col.name,
                            values.reduce((str, vd) => {
                                if (vd.display !== undefined && vd.display !== null) {
                                    str += sep + quoteValueWithDelimiters(vd.display, ',');
                                    sep = ', ';
                                }
                                return str;
                            }, '')
                        );
                    } else if (col.isJunctionLookup()) {
                        row = row.set(
                            col.name,
                            values.reduce((arr, vd) => {
                                const val = forExport ? vd.display : vd.raw;
                                if (val !== undefined && val !== null) {
                                    arr.push(val);
                                }
                                return arr;
                            }, [])
                        );
                    } else if (col.lookup.displayColumn == col.lookup.keyColumn) {
                        row = row.set(
                            col.name,
                            values.size === 1 ? quoteValueWithDelimiters(values.first()?.display, ',') : undefined
                        );
                    } else {
                        let val;
                        if (values.size === 1) val = forExport ? values.first()?.display : values.first()?.raw;
                        row = row.set(col.name, val);
                    }
                } else if (col.jsonType === 'date' && !displayValues) {
                    let dateVal;
                    if (values.size === 1) {
                        dateVal = values.first().raw;
                        dateVal = parseDate(dateVal, getColDateFormat(col));
                    }

                    // Issue 44398: match JSON dateTime format provided by LK server when submitting date values back for insert/update
                    row = row.set(col.name, getJsonDateTimeFormatString(dateVal));
                } else {
                    row = row.set(col.name, values.size === 1 ? values.first().raw?.toString().trim() : undefined);
                }
            });

            if (forUpdate) {
                const gridRow = data.get(dataKeys.get(rn));
                row = row.merge(getPkData(queryInfo, gridRow));
            }

            rawData = rawData.push(row);
        }

        return rawData;
    }

    /**
     * Determines which rows in the grid have missing required fields, which sets of rows have combinations
     * of key fields that are duplicated, and, optionally, which sets of rows have duplicated values for a
     * given field key.
     *
     * @param queryModel the model whose data we are validating
     * @param uniqueFieldKey optional (non-key) field that should be unique.
     */
    validateData(
        queryModel: QueryModel,
        uniqueFieldKey?: string
    ): {
        missingRequired: Map<string, List<number>>; // map from column caption to row numbers with missing values
        uniqueKeyViolations: Map<string, Map<string, List<number>>>; // map from the column captions (joined by ,) to a map from values that are duplicates to row numbers.
    } {
        const data = fromJS(queryModel.rows);
        const columns = queryModel.queryInfo.getInsertColumns();
        let uniqueFieldCol;
        const keyColumns = columns.filter(column => column.isKeyField);
        let keyValues = Map<number, List<string>>(); // map from row number to list of key values on that row
        let uniqueKeyMap = Map<string, List<number>>(); // map from value to rows with that value
        let missingRequired = Map<string, List<number>>(); // map from column caption to list of rows missing a value for that column
        for (let rn = 0; rn < data.size; rn++) {
            columns.forEach((col, cn) => {
                const values = this.getValue(cn, rn);
                if (col.required) {
                    if (values.isEmpty() || values.find(value => this.hasRawValue(value)) == undefined) {
                        if (missingRequired.has(col.caption)) {
                            missingRequired = missingRequired.set(
                                col.caption,
                                missingRequired.get(col.caption).push(rn + 1)
                            );
                        } else {
                            missingRequired = missingRequired.set(col.caption, List<number>([rn + 1]));
                        }
                    }
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
                } else if (uniqueFieldKey && col.fieldKey === uniqueFieldKey) {
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
        };
    }

    getValidationErrors(queryModel: QueryModel, uniqueFieldKey?: string): string[] {
        const { uniqueKeyViolations, missingRequired } = this.validateData(queryModel, uniqueFieldKey);
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

        return errors;
    }

    getValue(colIdx: number, rowIdx: number): List<ValueDescriptor> {
        return this.getValueForCellKey(genCellKey(colIdx, rowIdx));
    }

    getValueForCellKey(cellKey: string): List<ValueDescriptor> {
        if (this.cellValues.has(cellKey)) {
            return this.cellValues.get(cellKey);
        }

        return List<ValueDescriptor>();
    }

    hasFocus(): boolean {
        return this.focusColIdx > -1 && this.focusRowIdx > -1;
    }

    hasMultipleSelection(): boolean {
        return this.selectionCells.size > 1;
    }

    hasMultipleColumnSelection(): boolean {
        if (!this.hasMultipleSelection()) return false;

        const firstCellColIdx = parseCellKey(this.selectionCells.first()).colIdx;
        return !this.selectionCells.every(cellKey => parseCellKey(cellKey).colIdx === firstCellColIdx);
    }

    hasSelection(): boolean {
        return this.selectedColIdx > -1 && this.selectedRowIdx > -1;
    }

    get selectionKey(): string {
        if (this.hasSelection()) return genCellKey(this.selectedColIdx, this.selectedRowIdx);
        return undefined;
    }

    isInBounds(colIdx: number, rowIdx: number): boolean {
        return colIdx >= 0 && colIdx < this.colCount && rowIdx >= 0 && rowIdx < this.rowCount;
    }

    inSelection(colIdx: number, rowIdx: number): boolean {
        return colIdx > -1 && rowIdx > -1 && this.selectionCells.get(genCellKey(colIdx, rowIdx)) !== undefined;
    }

    get sortedSelectionKeys(): string[] {
        return getSortedCellKeys(this.selectionCells.toArray(), this.rowCount);
    }

    hasRawValue(descriptor: ValueDescriptor) {
        return descriptor && descriptor.raw !== undefined && descriptor.raw.toString().trim() !== '';
    }

    hasData(): boolean {
        return (
            this.cellValues.find(valueList => {
                return valueList.find(value => this.hasRawValue(value)) !== undefined;
            }) !== undefined
        );
    }

    isFocused(colIdx: number, rowIdx: number): boolean {
        return colIdx > -1 && rowIdx > -1 && this.focusColIdx === colIdx && this.focusRowIdx === rowIdx;
    }

    isSelected(colIdx: number, rowIdx: number): boolean {
        return colIdx > -1 && rowIdx > -1 && this.selectedColIdx === colIdx && this.selectedRowIdx === rowIdx;
    }

    static getEditorDataFromQueryValueMap(valueMap: any): List<any> | any {
        // Editor expects to get either a single value or an array of an object with fields displayValue and value
        if (valueMap && List.isList(valueMap)) {
            return valueMap.map(val => {
                // If immutable convert to normal JS
                if (Iterable.isIterable(val)) {
                    return { displayValue: val.get('displayValue'), value: val.get('value') };
                } else return val;
            });
        } else if (
            valueMap &&
            valueMap.has('value') &&
            valueMap.get('value') !== null &&
            valueMap.get('value') !== undefined
        ) {
            return valueMap.has('formattedValue')
                ? List<any>([{ displayValue: valueMap.get('formattedValue'), value: valueMap.get('value') }])
                : valueMap.has('displayValue')
                ? List<any>([{ displayValue: valueMap.get('displayValue'), value: valueMap.get('value') }])
                : valueMap.get('value');
        } else return undefined;
    }

    static convertQueryDataToEditorData(
        data: Map<string, any>,
        updates?: Map<any, any>,
        idsNotToUpdate?: number[],
        fieldsNotToUpdate?: string[]
    ): Map<any, Map<string, any>> {
        return data.map((valueMap, id) => {
            const returnMap = valueMap.reduce((m, valueMap, key) => {
                const editorData = EditorModel.getEditorDataFromQueryValueMap(valueMap);
                // data maps have keys that are display names/captions. We need to convert to the
                // encoded keys used in our filters to match up with values from the forms.
                if (editorData !== undefined) return m.set(encodePart(key), editorData);
                else return m;
            }, Map<any, any>());
            if (!updates) {
                return returnMap;
            }
            if (!idsNotToUpdate || idsNotToUpdate.indexOf(parseInt(id)) < 0 || !fieldsNotToUpdate)
                return returnMap.merge(updates);
            let trimmedUpdates = Map<any, any>();
            updates.forEach((value, fieldKey) => {
                if (fieldsNotToUpdate.indexOf(fieldKey.toLowerCase()) < 0) {
                    trimmedUpdates = trimmedUpdates.set(fieldKey, value);
                }
            });
            return returnMap.merge(trimmedUpdates);
        }) as Map<any, Map<string, any>>;
    }

    getDeletedIds(): Set<any> {
        return this.deletedIds.filter(id => id.toString().indexOf(GRID_EDIT_INDEX) === -1).toSet();
    }

    isModified(editedRow: Map<string, any>, originalQueryRow: Map<string, any>): boolean {
        return editedRow.find((value, key) => originalQueryRow.get(key) !== value) !== undefined;
    }

    isRowEmpty(editedRow: Map<string, any>): boolean {
        return editedRow.find(value => value !== undefined) === undefined;
    }

    lastSelection(colIdx: number, rowIdx: number): boolean {
        let cellKeys = [];

        // Initial implementation of drag handle fill actions only support single column selection
        if (!this.hasMultipleColumnSelection()) {
            if (this.hasMultipleSelection()) {
                cellKeys = this.sortedSelectionKeys;
            } else {
                cellKeys = [this.selectionKey];
            }
        }

        if (cellKeys.length === 0) {
            return false;
        }

        return cellKeys.indexOf(genCellKey(colIdx, rowIdx)) === cellKeys.length - 1;
    }
}

export interface IGridLoader {
    fetch: (model: QueryModel) => Promise<IGridResponse>;
    fetchSelection?: (model: QueryModel) => Promise<IGridSelectionResponse>;
}

export interface IEditableGridLoader extends IGridLoader {
    columns?: List<QueryColumn>;
    id: string;
    mode: EditorMode;
    omittedColumns?: string[];
    queryInfo: QueryInfo;
    requiredColumns?: string[];
}

export interface IGridResponse {
    data: Map<any, any>;
    dataIds: List<any>;
    messages?: List<Map<string, string>>;
    totalRows?: number;
}

interface IGridSelectionResponse {
    selectedIds: List<any>;
}
