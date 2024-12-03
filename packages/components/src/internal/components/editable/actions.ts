import { Filter, Utils } from '@labkey/api';
import { fromJS, List, Map, OrderedMap } from 'immutable';
import { addDays, subDays } from 'date-fns';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { cancelEvent, getPasteValue, setCopyValue } from '../../events';
import { formatDate, formatDateTime, parseDate } from '../../util/Date';
import { caseInsensitive, isFloat, isInteger, parseCsvString, parseScientificInt } from '../../util/utils';
import { ViewInfo } from '../../ViewInfo';

import { selectRows } from '../../query/selectRows';

import { getContainerFilterForLookups } from '../../query/api';

import { encodePart } from '../../../public/SchemaQuery';

import {
    CellMessage,
    CellMessages,
    CellValues,
    EditableColumnMetadata,
    EditableGridLoader,
    EditorMode,
    EditorModel,
    EditorModelProps,
    MessageAndValue,
    ValueDescriptor,
} from './models';

import { decimalDifference, genCellKey, getLookupFilters, getValidatedEditableGridValue, parseCellKey } from './utils';

/**
 * Do not use this method directly, use initEditorModel instead
 */
const loadEditorModelData = async (
    orderedRows: string[],
    rows: Record<string, any>,
    columns: QueryColumn[],
    forUpdate: boolean
): Promise<CellValues> => {
    const lookupValueDescriptors = await getLookupValueDescriptors(columns, rows, orderedRows, forUpdate);
    let cellValues = Map<string, List<ValueDescriptor>>();

    // data is initialized in column order
    columns.forEach(col => {
        orderedRows.forEach((id, rn) => {
            const row = rows[id];
            const cellKey = genCellKey(col.fieldKey, rn);
            // Our loaders (e.g. EditableGridLoaderFromSelection) use EditorModel.convertQueryDataToEditorData which
            // uses encodePart, so we check for the encoded fieldKey.
            const value = row[col.fieldKey] ?? row[encodePart(col.fieldKey)];

            if (Array.isArray(value)) {
                // assume to be list of {displayValue, value} objects
                cellValues = cellValues.set(
                    cellKey,
                    value.reduce((list, v) => {
                        if (col.isLookup() && Utils.isNumber(v)) {
                            const descriptors = lookupValueDescriptors[col.lookupKey];
                            if (descriptors) {
                                const desc = descriptors.filter(descriptor => descriptor.raw === v);
                                if (desc) {
                                    return list.push(...desc);
                                }
                            }
                        }

                        return list.push({ display: v.displayValue ?? v, raw: v.value ?? v });
                    }, List<ValueDescriptor>())
                );
            } else {
                // assume to be a {displayValue, value} object but fall back on value not being an object
                const raw = value?.value ?? value;
                const display = value?.displayValue ?? raw;
                let cellValue = List([
                    {
                        display: display !== null ? display : undefined,
                        raw: raw !== null ? raw : undefined,
                    },
                ]);

                // Issue 37833: try resolving the value for the lookup to get the displayValue to show in the grid cell
                if (col.isLookup() && Utils.isNumber(raw)) {
                    const descriptors = lookupValueDescriptors[col.lookupKey];
                    if (descriptors) {
                        cellValue = List(descriptors.filter(descriptor => descriptor.raw === raw));
                    }
                }

                cellValues = cellValues.set(cellKey, cellValue);
            }
        });
    });

    return cellValues;
};

export const initEditorModel = async (
    loader: EditableGridLoader,
    columnMetadata?: Map<string, EditableColumnMetadata>
): Promise<EditorModel> => {
    const { columns: loaderColumns, queryInfo } = loader;
    const { data, dataIds } = await loader.fetch();
    const rows = data.toJS();
    const orderedRows = dataIds.toArray();
    const forUpdate = loader.mode === EditorMode.Update;
    let columns: QueryColumn[];

    if (loaderColumns) {
        columns = loaderColumns;
    } else if (forUpdate) {
        columns = queryInfo.getUpdateColumns();
    } else {
        columns = queryInfo.getInsertColumns();
    }

    // file input columns are not supported in the editable grid, so remove them
    columns = columns.filter(col => !col.isFileInput);

    // Calculate orderedColumns here before we add PK and Container columns to the columns array because they should
    // be hidden by default.
    const orderedColumns = columns.map(queryColumn => queryColumn.fieldKey.toLowerCase());
    const columnMap = columns.reduce((result, column) => {
        result[column.fieldKey.toLowerCase()] = column;
        return result;
    }, {});

    if (loader.extraColumns) {
        loader.extraColumns.forEach(col => {
            columnMap[col.fieldKey.toLowerCase()] = col;
            columns.push(col);
        });
    }

    if (forUpdate) {
        // If we're updating then we need to ensure that the pkCols and altUpdateKeys are in the columnMap
        queryInfo.getPkCols().forEach(pkCol => {
            if (!columnMap[pkCol.fieldKey.toLowerCase()]) {
                columnMap[pkCol.fieldKey.toLowerCase()] = pkCol;
                columns.push(pkCol);
            }
        });

        queryInfo.altUpdateKeys?.forEach(fieldKey => {
            const col = queryInfo.getColumn(fieldKey);
            if (col && !columnMap[fieldKey.toLowerCase()]) {
                columnMap[fieldKey.toLowerCase()] = col;
                columns.push(col);
            }
        });

        const hasContainerCol =
            columns.filter(c => c.fieldKey.toLowerCase() === 'container' || c.fieldKey.toLowerCase() === 'folder')
                .length > 0;

        if (!hasContainerCol) {
            // If we're updating we need to ensure that the container column is in the column map, so we can validate
            // against it during events like paste.
            const containerCol = queryInfo.getColumn('Container') ?? queryInfo.getColumn('Folder');

            if (containerCol) {
                columnMap[containerCol.fieldKey.toLowerCase()] = containerCol;
                columns.push(containerCol);
            }
        }
    }

    // TODO: Move initEditorModel, loadEditorModelData, and getLookupValueDescriptors to EditorModel as static methods
    const cellValues = await loadEditorModelData(orderedRows, rows, columns, forUpdate);

    if (columnMetadata) {
        // If columnMetadata is present force it to use lowercase keys
        columnMetadata = columnMetadata.reduce((result, value, key) => {
            return result.set(key.toLowerCase(), value);
        }, Map<string, EditableColumnMetadata>());
    }

    return new EditorModel({
        cellValues,
        columnMetadata,
        columnMap: fromJS(columnMap),
        orderedColumns: fromJS(orderedColumns),
        originalData: data,
        queryInfo,
        rowCount: orderedRows.length,
    } as Partial<EditorModelProps>);
};

export function parseIntIfNumber(val: any): number | string {
    const intVal = !isNaN(val) ? parseInt(val, 10) : undefined;
    return intVal === undefined || isNaN(intVal) ? val : intVal;
}

const resolveDisplayColumn = (column: QueryColumn): string => {
    // Handle MVFK
    if (column.multiValue && column.isJunctionLookup()) {
        const parts = column.displayField.split('$S');
        if (parts.length > 1) return parts[1];
    }

    return column.lookup.displayColumn;
};

type ColumnLoaderPromise = Promise<{ column: QueryColumn; descriptors: ValueDescriptor[] }>;

const findLookupValues = async (
    column: QueryColumn,
    lookupKeyValues?: any[],
    lookupValues?: any[],
    lookupValueFilters?: Filter.IFilter[],
    forUpdate?: boolean,
    containerPath?: string
): ColumnLoaderPromise => {
    const { lookup } = column;
    const { keyColumn } = lookup;
    const displayColumn = resolveDisplayColumn(column);

    const results = await selectRows({
        columns: [displayColumn, keyColumn],
        containerPath: lookup.containerPath ?? containerPath,
        containerFilter: lookup.containerFilter ?? getContainerFilterForLookups(),
        filterArray: getLookupFilters(
            column,
            lookupKeyValues,
            lookupValues,
            lookupValueFilters,
            forUpdate,
            displayColumn
        ),
        includeTotalCount: false,
        maxRows: -1,
        schemaQuery: lookup.schemaQuery,
        viewName: ViewInfo.DETAIL_NAME, // Use the detail view so values that may be filtered out of the default view show up.
    });

    const descriptors = results.rows.reduce<ValueDescriptor[]>((desc, row) => {
        const key = caseInsensitive(row, keyColumn)?.value;
        if (key !== undefined && key !== null) {
            const displayRow = caseInsensitive(row, displayColumn);
            desc.push({ display: displayRow?.displayValue || displayRow?.value, raw: key });
        }
        return desc;
    }, []);

    return { column, descriptors };
};

async function getLookupValueDescriptors(
    columns: QueryColumn[],
    rows: Record<string, Record<string, any>>,
    ids: string[],
    forUpdate?: boolean
): Promise<{ [colKey: string]: ValueDescriptor[] }> {
    const descriptorMap = {};
    // for each lookup column, find the unique values in the rows and query for those values when they look like ids
    for (let cn = 0; cn < columns.length; cn++) {
        const col = columns[cn];
        let values = new Set<number>();

        if (col.isPublicLookup()) {
            ids.forEach(id => {
                const row = rows[id];
                const value = row?.[col.fieldKey];
                if (Utils.isNumber(value)) {
                    values = values.add(value);
                } else if (List.isList(value)) {
                    value.forEach(val => {
                        if (Map.isMap(val)) {
                            values = values.add(val.get('value'));
                        } else {
                            values = values.add(val);
                        }
                    });
                }
            });
            if (values.size > 0) {
                const { descriptors } = await findLookupValues(
                    col,
                    Array.from(values),
                    undefined,
                    undefined,
                    forUpdate
                );
                descriptorMap[col.lookupKey] = descriptors;
            }
        }
    }

    return descriptorMap;
}

function lookupValidationError(value: string | number | boolean, fromPaste?: boolean): CellMessage {
    let suffix = '';
    if (fromPaste && typeof value === 'string' && value.toString().indexOf(',') > -1) {
        suffix = ". Please make sure values that contains comma(,) are properly quoted."
    }
    return { message: `Could not find ${value}${suffix}` };
}

async function getLookupDisplayValue(column: QueryColumn, value: any, containerPath: string): Promise<MessageAndValue> {
    if (value === undefined || value === null) {
        return {
            valueDescriptor: {
                display: value,
                raw: value,
            },
        };
    }

    let message: CellMessage;

    const { descriptors } = await findLookupValues(column, [value], undefined, undefined, false, containerPath);
    if (!descriptors.length) {
        message = lookupValidationError(value);
    }

    return {
        message,
        valueDescriptor: descriptors[0],
    };
}

interface CellData {
    message?: CellMessage;
    valueDescriptors: List<ValueDescriptor>;
}

async function convertRowToEditorModelData(
    data: Map<string, string | number | boolean>,
    col: QueryColumn,
    containerPath: string
): Promise<CellData> {
    let message: CellMessage;
    let valueDescriptors = List<ValueDescriptor>();

    if (data && col && col.isPublicLookup()) {
        // value had better be the rowId here, but it may be several in a comma-separated list.
        // If it's the display value, which happens to be a number, much confusion will arise.
        const values = data.toString().split(',');

        for (const val of values) {
            const messageAndValue = await getLookupDisplayValue(col, parseIntIfNumber(val), containerPath);
            valueDescriptors = valueDescriptors.push(messageAndValue.valueDescriptor);
            message = messageAndValue.message;
        }
    } else {
        valueDescriptors = valueDescriptors.push({ display: data, raw: data });
    }

    return { message, valueDescriptors };
}

async function prepareInsertRowDataFromBulkForm(
    insertColumns: QueryColumn[],
    rowData: List<any>,
    colMin = 0,
    containerPath: string
): Promise<{ messages: List<CellMessage>; values: List<List<ValueDescriptor>> }> {
    let values = List<List<ValueDescriptor>>();
    let messages = List<CellMessage>();

    for (let cn = 0; cn < rowData.size; cn++) {
        const data = rowData.get(cn);
        const colIdx = colMin + cn;
        const col = insertColumns[colIdx];
        const { message, valueDescriptors } = await convertRowToEditorModelData(data, col, containerPath);
        values = values.push(valueDescriptors);

        if (message) messages = messages.push(message);
    }

    return {
        values,
        messages,
    };
}

async function addBulkRowsToEditorModel(
    editorModel: EditorModel,
    rowData: List<any>,
    numToAdd: number,
    containerPath: string,
    columns: QueryColumn[]
): Promise<Partial<EditorModel>> {
    let { cellMessages, cellValues } = editorModel;
    const selectionCells: string[] = [];
    const insertCols = columns ?? editorModel.queryInfo.getInsertColumns();
    const preparedData = await prepareInsertRowDataFromBulkForm(insertCols, rowData, 0, containerPath);
    const { values, messages } = preparedData;
    const rowCount = editorModel.rowCount + numToAdd;

    for (let rowIdx = editorModel.rowCount; rowIdx < rowCount; rowIdx++) {
        // eslint-disable-next-line no-loop-func
        rowData.forEach((value, colIdx) => {
            const fieldKey = editorModel.getFieldKeyByIndex(colIdx);
            const cellKey = genCellKey(fieldKey, rowIdx);
            cellMessages = cellMessages.set(cellKey, messages.get(colIdx));
            selectionCells.push(cellKey);
            cellValues = cellValues.set(cellKey, values.get(colIdx));
        });
    }

    return {
        cellValues,
        cellMessages,
        selectionCells,
        rowCount,
    };
}

export async function addRows(
    editorModel: EditorModel,
    numToAdd: number,
    bulkData: Map<string, any>,
    containerPath: string,
    insertCols?: QueryColumn[]
): Promise<Partial<EditorModel>> {
    let editorModelChanges: Partial<EditorModel>;

    if (bulkData) {
        editorModelChanges = await addBulkRowsToEditorModel(
            editorModel,
            bulkData.toList(),
            numToAdd,
            containerPath,
            insertCols
        );
    } else {
        editorModelChanges = { rowCount: editorModel.rowCount + numToAdd };
    }

    return editorModelChanges;
}

/**
 * Adds columns to the editor model and the underlying model's data
 * @param editorModel
 * @param queryInfo
 * @param originalData
 * @param queryColumns the ordered map of columns to be added
 * @param insertFieldKey the fieldKey of the existing column after which the new columns should be inserted.  If undefined
 * or the column is not found, columns will be added at the beginning.
 */
export function addColumns(
    editorModel: EditorModel,
    queryColumns: ExtendedMap<string, QueryColumn>,
    insertFieldKey?: string
): Partial<EditorModel> {
    if (queryColumns.size === 0) return {};

    // if insertFieldKey is provided, find that index and we will insert after it (or at the beginning if there is no such field)
    let leftColIndex = insertFieldKey
        ? editorModel.orderedColumns.findIndex(column => Utils.caseInsensitiveEquals(column, insertFieldKey))
        : -1;

    let altInsertFieldKey = null; // if there are readOnly fields that comes after insertFieldKey, use the last readOnly field
    if (insertFieldKey && leftColIndex < editorModel.orderedColumns.size - 1) {
        let readOnlyEnded = false;
        editorModel.orderedColumns.forEach((fieldKey, ind) => {
            if (ind <= leftColIndex || readOnlyEnded)
                return;
            if (!editorModel.columnMap.get(fieldKey).readOnly)
                readOnlyEnded = true;
            else
                altInsertFieldKey = fieldKey;
        });

        if (altInsertFieldKey)
            leftColIndex = editorModel.orderedColumns.findIndex(column => Utils.caseInsensitiveEquals(column, altInsertFieldKey));
    }

    const editorModelIndex = leftColIndex + 1;
    const queryColIndex = editorModel.queryInfo.getColumnIndex(altInsertFieldKey ?? insertFieldKey) + 1;

    let newCellValues = editorModel.cellValues;

    for (let rowIdx = 0; rowIdx < editorModel.rowCount; rowIdx++) {
        // eslint-disable-next-line no-loop-func
        queryColumns.forEach((value: QueryColumn) => {
            newCellValues = newCellValues.set(genCellKey(value.fieldKey, rowIdx), List<ValueDescriptor>());
        });
    }

    let { orderedColumns, columnMap } = editorModel;
    queryColumns.valueArray.forEach((col, i) => {
        orderedColumns = orderedColumns.insert(i + editorModelIndex, col.fieldKey.toLowerCase());
        columnMap = columnMap.set(col.fieldKey.toLowerCase(), col);
    });
    const queryInfo = editorModel.queryInfo.mutate({
        columns: editorModel.queryInfo.columns.mergeAt(queryColIndex, queryColumns),
    });

    return {
        cellMessages: editorModel.cellMessages,
        cellValues: newCellValues,
        columnMap,
        focusColIdx: -1,
        focusRowIdx: -1,
        orderedColumns,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: [],
        queryInfo,
    };
}

export function changeColumn(
    editorModel: EditorModel,
    existingFieldKey: string,
    newQueryColumn: QueryColumn
): Partial<EditorModel> {
    const colIndex = editorModel.orderedColumns.findIndex(column =>
        Utils.caseInsensitiveEquals(column, existingFieldKey)
    );
    // nothing to do if there is no such column
    if (colIndex === -1) return {};

    let { cellMessages, cellValues, columnMap } = editorModel;

    // Delete the existing data and initialize cells for the new column.
    for (let rowIdx = 0; rowIdx < editorModel.rowCount; rowIdx++) {
        const existingCellKey = genCellKey(existingFieldKey, rowIdx);
        const updatedCellKey = genCellKey(newQueryColumn.fieldKey, rowIdx);
        cellValues = cellValues.delete(existingCellKey);
        cellValues = cellValues.set(updatedCellKey, List());
        cellMessages = cellMessages.delete(existingCellKey);
    }

    columnMap = columnMap.delete(existingFieldKey);
    columnMap = columnMap.set(newQueryColumn.fieldKey.toLowerCase(), newQueryColumn);
    const columns = new ExtendedMap<string, QueryColumn>(editorModel.queryInfo.columns);
    columns.delete(existingFieldKey.toLowerCase());
    columns.set(newQueryColumn.fieldKey.toLowerCase(), newQueryColumn);

    return {
        cellMessages,
        cellValues,
        columnMap,
        focusColIdx: -1,
        focusRowIdx: -1,
        orderedColumns: editorModel.orderedColumns.set(colIndex, newQueryColumn.fieldKey.toLowerCase()),
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: [],
        queryInfo: editorModel.queryInfo.mutate({ columns }),
    };
}

export function removeColumns(editorModel: EditorModel, fieldKeys: string[]): Partial<EditorModel> {
    let { cellMessages, cellValues, columnMap } = editorModel;

    let orderedColumns = editorModel.orderedColumns;
    let hasRemoved = false;
    fieldKeys.forEach(fieldKey => {
        const deleteIndex = orderedColumns.findIndex(column => Utils.caseInsensitiveEquals(column, fieldKey));
        if (deleteIndex === -1) return;

        orderedColumns = orderedColumns.remove(deleteIndex);
        columnMap = columnMap.delete(fieldKey);
        hasRemoved = true;
    });

    // nothing to do if no columns to remove
    if (!hasRemoved) return {};

    // Delete the existing data and initialize cells for the new column.
    for (let rowIdx = 0; rowIdx < editorModel.rowCount; rowIdx++) {
        fieldKeys.forEach(fieldKey => {
            const cellkey = genCellKey(fieldKey, rowIdx);
            cellValues = cellValues.delete(cellkey);
            cellMessages = cellMessages.delete(cellkey);
        });
    }

    const columns = new ExtendedMap<string, QueryColumn>(editorModel.queryInfo.columns);
    fieldKeys.forEach(fieldKey => {
        columns.delete(fieldKey.toLowerCase());
    });
    const queryInfo = editorModel.queryInfo.mutate({ columns });

    return {
        cellMessages,
        cellValues,
        columnMap,
        focusColIdx: -1,
        focusRowIdx: -1,
        orderedColumns,
        selectedColIdx: -1,
        selectedRowIdx: -1,
        selectionCells: [],
        queryInfo,
    };
}

export function removeColumn(editorModel: EditorModel, fieldKey: string): Partial<EditorModel> {
    return removeColumns(editorModel, [fieldKey]);
}

// altColumns is used when the columns to be updated do not correspond with the insert columns on queryInfo
async function prepareUpdateRowDataFromBulkForm(
    queryInfo: QueryInfo,
    rowData: OrderedMap<string, any>,
    isIncludedColumn?: (col: QueryColumn) => boolean,
    containerPath?: string,
    altColumns?: string[] // TODO: This should use the same metadata for columns as the rest of the editable grid
): Promise<{ messages: OrderedMap<string, CellMessage>; values: OrderedMap<string, List<ValueDescriptor>> }> {
    const columns = queryInfo.getInsertColumns(isIncludedColumn);
    let values = OrderedMap<string, List<ValueDescriptor>>();
    let messages = OrderedMap<string, CellMessage>();

    for (const colKey of rowData.keySeq().toArray()) {
        const data = rowData.get(colKey);
        const col = altColumns ? queryInfo.getColumn(colKey) : columns.find(c => c.fieldKey === colKey);
        const { message, valueDescriptors } = await convertRowToEditorModelData(data, col, containerPath);
        values = values.set(col.fieldKey, valueDescriptors);
        if (message) messages = messages.set(col.fieldKey, message);
    }

    return { values, messages };
}

export async function updateGridFromBulkForm(
    editorModel: EditorModel,
    rowData: OrderedMap<string, any>,
    dataRowIndexes: List<number>,
    lockedOrReadonlyRows?: number[],
    isIncludedColumn?: (col: QueryColumn) => boolean,
    containerPath?: string,
    useEditorModelCols: boolean = false
): Promise<Partial<EditorModel>> {
    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;

    const preparedData = await prepareUpdateRowDataFromBulkForm(
        editorModel.queryInfo,
        rowData,
        isIncludedColumn,
        containerPath,
        useEditorModelCols && editorModel.orderedColumns.toJS()
    );
    const { values, messages } = preparedData; // {3: 'x', 4: 'z}

    dataRowIndexes.forEach(rowIdx => {
        if (lockedOrReadonlyRows && lockedOrReadonlyRows.indexOf(rowIdx) > -1) return;

        values.forEach((value, fieldKey) => {
            const cellKey = genCellKey(fieldKey, rowIdx);
            cellMessages = cellMessages.set(cellKey, messages.get(fieldKey));
            cellValues = cellValues.set(cellKey, value);
        });
    });

    return { cellValues, cellMessages };
}

export async function addRowsPerPivotValue(
    editorModel: EditorModel,
    numPerParent: number,
    pivotKey: string,
    pivotValues: string[],
    bulkData: Map<string, any>,
    containerPath: string,
    insertColumns?: QueryColumn[]
): Promise<Partial<EditorModel>> {
    let updatedModel = editorModel;

    if (numPerParent > 0) {
        for (const value of pivotValues) {
            bulkData = bulkData.set(pivotKey, value);
            const changes = await addBulkRowsToEditorModel(
                updatedModel,
                bulkData.toList(),
                numPerParent,
                containerPath,
                insertColumns
            );
            updatedModel = updatedModel.merge(changes) as EditorModel;
        }
    }

    return {
        cellMessages: updatedModel.cellMessages,
        cellValues: updatedModel.cellValues,
        rowCount: updatedModel.rowCount,
    };
}

/**
 * This REGEX will match for any strings that are suffixed with a number, it has several capture groups to allow us to
 * easily grab the number and the prefix. The following values should match:
 *      ABC-123 captures as ['ABC-123', 'ABC-', '123', undefined]
 *      ABC123 captures as ['ABC123', 'ABC', '123', undefined]
 *      ABC-1.23 captures as ['ABC-1.23', 'ABC-', '1.23', '.23']
 *      ABC.123 captures as ['ABC.123', 'ABC.', '123', undefined]
 */
const POSTFIX_REGEX = /^(.*?)(\d+(\.\d+)?)$/;
type PrefixAndNumber = [string | undefined, string | undefined];

/**
 * Given a string it returns an array in the form of [prefix, number suffix]. If the string is not suffixed with a
 * number the number suffix is undefined. If the entire string is a number the prefix will be undefined. This method
 * intentionally does not parse the numbers.
 */
export function splitPrefixedNumber(value: string | number): PrefixAndNumber {
    if (value === undefined || value === null || value === '') return [undefined, undefined];
    const text = value.toString();
    const matches = text?.toString().match(POSTFIX_REGEX);

    if (matches === null) {
        return [text, undefined];
    }

    return [matches[1] === '' ? undefined : matches[1], matches[2]];
}

/**
 * Given an array of values computed by splitPrefixedNumber returns true if they all have the same prefix
 */
function everyValueHasSamePrefix(values: PrefixAndNumber[]): boolean {
    if (values.length === 0) return false;
    const prefix = values[0][0];
    return values.every(value => value[0] === prefix);
}

enum IncrementDirection {
    FORWARD,
    BACKWARD,
}

enum IncrementType {
    DATE,
    DATETIME,
    NONE,
    NUMBER,
}

interface SelectionIncrement {
    direction: IncrementDirection;
    increment?: number;
    incrementType: IncrementType;
    initialSelectionValues: Array<List<ValueDescriptor>>; // yes this is a very odd type, but we can clean it up when we rip out Immutable
    prefix?: string;
    startingValue: number | string;
}

function inferSelectionDirection(initialCellKeys: string[], cellKeysToFill: string[]): IncrementDirection {
    const initialMin = parseCellKey(initialCellKeys[0]);
    const fillMin = parseCellKey(cellKeysToFill[0]);

    if (initialMin.rowIdx < fillMin.rowIdx) return IncrementDirection.FORWARD;
    return IncrementDirection.BACKWARD;
}

function inferSelectionIncrement(
    editorModel: EditorModel,
    initialCellKeys: string[],
    cellKeysToFill: string[]
): SelectionIncrement {
    const direction = inferSelectionDirection(initialCellKeys, cellKeysToFill);
    const values = initialCellKeys.map(cellKey => editorModel.getValueForCellKey(cellKey));
    // use the display values to determine sequence type to account for lookup cell values with numeric key/raw values
    let displayValues = values.map(value => value.get(0)?.display);
    let firstValue = displayValues[0];
    let lastValue = displayValues[displayValues.length - 1];
    const firstValueIsEmpty = firstValue === undefined || firstValue === '';
    const isDateSeq = values.length === 1 && !firstValueIsEmpty && formatDate(parseDate(firstValue)) === firstValue;
    const isDateTimeSeq =
        values.length === 1 && !firstValueIsEmpty && formatDateTime(parseDate(firstValue)) === firstValue;

    // Date sequence detection takes precedence otherwise we'd never parse dates, because we'd always consider something
    // like 2023-06-01, 6/1/2023, or 1-6-2023, to be a prefixed number string.
    if (isDateSeq || isDateTimeSeq) {
        return {
            direction,
            increment: 1, // Right now we only increment dates by 1 day
            incrementType: isDateSeq ? IncrementType.DATE : IncrementType.DATETIME,
            initialSelectionValues: values,
            prefix: undefined,
            startingValue: direction === IncrementDirection.FORWARD ? lastValue : firstValue,
        };
    }

    let prefix;
    let incrementType = IncrementType.NONE;
    let increment;
    const splitValues = displayValues.map(splitPrefixedNumber);
    const allPrefixed = everyValueHasSamePrefix(splitValues);

    if (allPrefixed && splitValues[0][0] !== undefined) {
        prefix = splitValues[0][0];
        displayValues = splitValues.map(value => value[1]);
        firstValue = displayValues[0];
        lastValue = displayValues[displayValues.length - 1];
    }

    const isFloatSeq = values.length > 1 && displayValues.every(isFloat);
    const isIntSeq = values.length > 1 && displayValues.every(isInteger);

    if (isFloatSeq) {
        firstValue = parseFloat(firstValue);
        lastValue = parseFloat(lastValue);
    } else if (isIntSeq) {
        firstValue = parseScientificInt(firstValue);
        lastValue = parseScientificInt(lastValue);
    }

    if (isFloatSeq || isIntSeq) {
        // increment -> last value minus first value divide by the number of steps in the initial selection
        increment = decimalDifference(lastValue, firstValue);
        increment = increment / (displayValues.length - 1);
        incrementType = IncrementType.NUMBER;
    }

    return {
        direction,
        increment,
        incrementType,
        initialSelectionValues: values,
        prefix,
        startingValue: direction === IncrementDirection.FORWARD ? lastValue : firstValue,
    };
}

/**
 * Gets the string representation of the primary key for a given row. It needs to be a string because it will be
 * compared against the values coming from QueryModel.orderedRows, which are string representations of PK values.
 * @param row
 * @param queryInfo
 */
function getPkValue(row: any, queryInfo: QueryInfo): string {
    const keyCols = queryInfo.getPkCols();
    let key;

    if (keyCols.length === 1) {
        key = caseInsensitive(row.toJS(), keyCols[0].fieldKey);
        if (Array.isArray(key)) key = key[0];
        if (typeof key === 'object') key = key.value;
    }

    // The key may be anything (often it's a number because it's RowId), so we coerce it to a string
    return key?.toString();
}

/**
 * Returns only the newly selected area given an initial selection and a final selection. These are the keys that will
 * be filled with generated data based on the initially selected data.
 * @param editorModel The EditorModel
 * @param initialSelection The area initially selected
 * @param finalSelection The final area selected, including the initially selected area
 */
export function generateFillCellKeys(
    editorModel: EditorModel,
    initialSelection: string[],
    finalSelection: string[]
): string[][] {
    const firstInitial = parseCellKey(initialSelection[0]);
    const lastInitial = parseCellKey(initialSelection[initialSelection.length - 1]);
    const minCol = editorModel.orderedColumns.indexOf(firstInitial.fieldKey);
    const maxCol = editorModel.orderedColumns.indexOf(lastInitial.fieldKey);
    const initialMinRow = firstInitial.rowIdx;
    const initialMaxRow = lastInitial.rowIdx;
    const finalMinRow = parseCellKey(finalSelection[0]).rowIdx;
    const finalMaxRow = parseCellKey(finalSelection[finalSelection.length - 1]).rowIdx;
    let start: number;
    let end: number;

    if (finalMaxRow > initialMaxRow) {
        // Final selected area is below the initial selection, so we will be incrementing from the row after
        // initialMaxRow
        start = initialMaxRow + 1;
        end = finalMaxRow;
    } else {
        // Newly selected area is above the initial selection, so we will be incrementing from finalMinRow
        start = finalMinRow;
        end = initialMinRow - 1;
    }

    const fillCellKeys = [];

    // Construct arrays of columns, because we're going to generate fill sequences for columns
    for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
        const columnKeys = [];

        for (let rowIdx = start; rowIdx <= end; rowIdx++) {
            columnKeys.push(genCellKey(editorModel.orderedColumns.get(colIdx), rowIdx));
        }

        fillCellKeys.push(columnKeys);
    }

    return fillCellKeys;
}

export function parsePastedLookup(
    column: QueryColumn,
    descriptors: ValueDescriptor[],
    value: string[] | string
): CellData {
    const originalValues = List([
        {
            display: value,
            raw: value,
        },
    ]);

    if (column.required && (value == null || value === '')) {
        return {
            valueDescriptors: originalValues,
            message: {
                message: column.caption + ' is required.',
            },
        };
    }

    if (value === undefined || value === null || value.toString().trim() === '' || typeof value !== 'string') {
        return { valueDescriptors: originalValues };
    }

    let message: CellMessage;
    const unmatched: string[] = [];

    // parse pasted strings to split properly around quoted values.
    // Remove the quotes for storing the actual values in the grid.
    const values = parseCsvString(value, ',', true)
        .map(v => {
            const vt = v.trim();
            if (vt.length > 0) {
                const vl = vt.toLowerCase();
                const vd = descriptors.find(d => d.display && d.display.toString().toLowerCase() === vl);
                if (!vd) {
                    unmatched.push(vt);
                    return { display: vt, raw: vt };
                } else {
                    return vd;
                }
            }
        })
        .filter(v => v !== undefined);

    if (unmatched.length) {
        const valueStr = unmatched
            .slice(0, 4)
            .map(u => '"' + u + '"')
            .join(', ');
        message = lookupValidationError(valueStr, true);
    }

    return {
        message,
        valueDescriptors: List(values),
    };
}

type LookupValueCache = Record<string, Promise<ValueDescriptor[]>>;

async function getParsedLookup(
    column: QueryColumn,
    lookupValueCache: LookupValueCache,
    display: any[],
    value: string[] | string,
    cellKey: string,
    forUpdate: boolean,
    targetContainerPath: string,
    editorModel: EditorModel
): Promise<CellData> {
    const containerPath = forUpdate ? editorModel.getFolderValueForCell(cellKey) : targetContainerPath;
    const cacheKey = `${column.fieldKey}||${containerPath}`;

    if (!lookupValueCache.hasOwnProperty(cacheKey)) {
        const columnMetadata = editorModel.getColumnMetadata(column.fieldKey);

        lookupValueCache[cacheKey] = findLookupValues(
            column,
            undefined,
            display,
            columnMetadata?.lookupValueFilters,
            forUpdate,
            containerPath
        ).then(response => response.descriptors);
    }

    const descriptors = await lookupValueCache[cacheKey];
    return parsePastedLookup(column, descriptors, value);
}

/**
 * Fills a column of cells based on the initially selected values.
 * If the initialSelection is for a single cell, the fill operation will always be a copy of that value.
 * If the initialSelection includes a range of cells and all values are numeric (or numbers prefixed with the same
 * string), fill via a generated sequence where the step/diff is based on the first and last value in the initSelection.
 * if the initialSelection is a single row, and the value is a date (as determined by the date format set by the server)
 * then we will fill via a generated sequence that increments the date by one day each row.
 * If the initialSelection includes a range of cells and not all values are numeric, fill via a copy of all of the values
 * in initSelection.
 * @param editorModel An EditorModel object
 * @param column
 * @param columnMetadata
 * @param cellMessages The CellMessages object to mutate, we cannot use the one from EditorModel because we may need to
 * modify multiple columns of data in one event (see dragFillEvent).
 * @param cellValues The CellValues object to mutate, we cannot use the one from EditorModel because we may need to
 * modify multiple columns of data in one event (see dragFillEvent).
 * @param initialSelection An array of sorted cell keys, all from the same column that were initially selected
 * @param selectionToFill An array of sorted cell keys, all from the same column, to be filled with values based on the
 * content of initialSelection
 * @param forUpdate True if this is operating on update query filters.
 * @param targetContainerPath
 */
export async function fillColumnCells(
    editorModel: EditorModel,
    column: QueryColumn,
    columnMetadata: EditableColumnMetadata,
    cellMessages: CellMessages,
    cellValues: CellValues,
    initialSelection: string[],
    selectionToFill: string[],
    forUpdate: boolean,
    targetContainerPath: string
): Promise<CellMessagesAndValues> {
    const { direction, increment, incrementType, prefix, startingValue, initialSelectionValues } =
        inferSelectionIncrement(editorModel, initialSelection, selectionToFill);

    if (direction === IncrementDirection.BACKWARD) {
        selectionToFill.reverse();
    }

    selectionToFill.forEach((cellKey, i) => {
        let fillValue = initialSelectionValues[i % initialSelectionValues.length];

        if (incrementType === IncrementType.NUMBER) {
            const amount = increment * (i + 1);
            let raw: number | string;

            if (direction === IncrementDirection.FORWARD) {
                raw = decimalDifference(amount, startingValue as number, false);
            } else {
                raw = decimalDifference(startingValue as number, amount, true);
            }

            if (prefix !== undefined) raw = prefix + raw;
            const display = raw.toString();
            fillValue = List([{ raw, display }]);
        } else if (incrementType === IncrementType.DATE || incrementType === IncrementType.DATETIME) {
            let date = parseDate(startingValue);

            if (direction === IncrementDirection.FORWARD) {
                date = addDays(date, i + 1);
            } else {
                date = subDays(date, i + 1);
            }

            const raw = incrementType === IncrementType.DATE ? formatDate(date) : formatDateTime(date);
            fillValue = List([{ raw, display: raw }]);
        }

        cellValues = cellValues.set(cellKey, fillValue);
    });

    const filteredLookupValues = columnMetadata?.filteredLookupValues?.toArray();
    const lookupValueCache: LookupValueCache = {};
    for (const cellKey of selectionToFill) {
        // If the column is a lookup, then we need to query for the rowIds so we can set the correct raw values,
        // otherwise insert will fail. This is most common for cross-folder sample selection (Issue 50363)
        if (column.isPublicLookup()) {
            const display = cellValues
                .get(cellKey)
                .map(v => v.display)
                .toArray();

            const { message, valueDescriptors } = await getParsedLookup(
                column,
                lookupValueCache,
                display,
                filteredLookupValues ?? display.join(','),
                cellKey,
                forUpdate,
                targetContainerPath,
                editorModel
            );
            cellValues = cellValues.set(cellKey, valueDescriptors);
            cellMessages = cellMessages.set(cellKey, message);
        } else {
            const { message } = getValidatedEditableGridValue(cellValues.get(cellKey)?.get(0)?.display, column);
            cellMessages = cellMessages.set(cellKey, message);
        }
    }

    return { cellValues, cellMessages };
}

type CellMessagesAndValues = Pick<EditorModel, 'cellMessages' | 'cellValues'>;

/**
 * @param editorModel
 * @param initialSelection The initial selection before the selection was expanded
 * @param readonlyRows A list of readonly rows
 * @param forUpdate True if this is operating on update query filters.
 * @param targetContainerPath The container path to use when looking up lookup values in the forUpdate false case
 */
export async function dragFillEvent(
    editorModel: EditorModel,
    initialSelection: string[],
    readonlyRows: string[],
    forUpdate: boolean,
    targetContainerPath: string
): Promise<CellMessagesAndValues> {
    const { columnMap, selectionCells } = editorModel;
    let { cellMessages, cellValues } = editorModel;

    // If the selection size hasn't changed, then the selection hasn't changed, so return the existing cellValues
    if (selectionCells.length === initialSelection.length) return { cellMessages, cellValues };

    const selectionToFill = generateFillCellKeys(editorModel, initialSelection, selectionCells);
    for (const columnCells of selectionToFill) {
        const { fieldKey } = parseCellKey(columnCells[0]);
        const initialSelectionByCol = initialSelection.filter(cellKey => parseCellKey(cellKey).fieldKey === fieldKey);
        const column = columnMap.get(fieldKey);
        const metadata = editorModel.getColumnMetadata(fieldKey);

        // Don't manipulate any values in read only columns
        if (column.readOnly) {
            continue;
        }

        const selectionToFillByCol = columnCells.filter(cellKey => {
            const { fieldKey, rowIdx } = parseCellKey(cellKey);
            const { isReadonlyCell, isReadonlyRow } = editorModel.getCellReadStatus(fieldKey, rowIdx, readonlyRows);
            return !isReadonlyCell && !isReadonlyRow;
        });

        // if nothing to fill, i.e. read only cells, skip
        if (selectionToFillByCol.length === 0) {
            continue;
        }

        // eslint-disable-next-line no-await-in-loop
        const messagesAndValues = await fillColumnCells(
            editorModel,
            column,
            metadata,
            cellMessages,
            cellValues,
            initialSelectionByCol,
            selectionToFillByCol,
            forUpdate,
            targetContainerPath
        );
        cellValues = messagesAndValues.cellValues;
        cellMessages = messagesAndValues.cellMessages;
    }

    return { cellMessages, cellValues };
}

/**
 * Expands the pasted data in the X and/or Y direction if the user has selected an area that is a multiple of X or Y.
 *
 * For example:
 * If the user copied two rows and two columns to their clipboard, but selected four rows and two columns on the grid we
 * would paste the contents twice across the four selected rows. If they had selected two rows and four columns we would
 * paste the contents twice across the selected columns.
 */
function expandPaste(model: EditorModel, payload: ParsePastePayload): ParsePastePayload {
    const { orderedColumns, selectionCells } = model;
    const minSelection = parseCellKey(selectionCells[0]);
    const maxSelection = parseCellKey(selectionCells[selectionCells.length - 1]);
    const selectionColCount =
        orderedColumns.indexOf(maxSelection.fieldKey) - orderedColumns.indexOf(minSelection.fieldKey) + 1;
    const selectionRowCount = maxSelection.rowIdx - minSelection.rowIdx + 1;
    let { data, numCols, numRows } = payload;

    if (selectionColCount > payload.numCols && selectionColCount % payload.numCols === 0) {
        const colCopyMultiple = selectionColCount / payload.numCols;
        numCols = payload.numCols * colCopyMultiple;
        data = data.reduce((reduction, row) => {
            let updatedRow = row;
            for (let i = 0; i < colCopyMultiple - 1; i++) {
                updatedRow = updatedRow.concat(row).toList();
            }

            return reduction.push(updatedRow);
        }, List<List<string>>());
    }

    if (selectionRowCount > payload.numRows && selectionRowCount % payload.numRows === 0) {
        const rowCopyMultiple = selectionRowCount / payload.numRows;
        numRows = payload.numRows * rowCopyMultiple;
        const originalRows = data;
        for (let i = 0; i < rowCopyMultiple - 1; i++) {
            data = data.concat(originalRows).toList();
        }
    }

    return { data, numCols, numRows };
}

function validatePaste(
    model: EditorModel,
    colMin: number,
    rowMin: number,
    value: string,
    readOnlyRowCount?: number
): PasteModel {
    const maxRowPaste = 1000;
    let success = true;
    let message;
    let payload = parsePaste(value);

    if (model.isMultiSelect) {
        payload = expandPaste(model, payload);
    }

    const coordinates = {
        colMax: colMin + payload.numCols - 1,
        colMin,
        rowMax: rowMin + payload.numRows - 1,
        rowMin,
    };

    // If P = 1 then target can be 1 or M
    // If P = M(x,y) then target can be 1 or exact M(x,y)
    if (coordinates.colMax >= model.orderedColumns.size) {
        success = false;
        message = 'Unable to paste. Cannot paste columns beyond the columns found in the grid.';
    } else if (coordinates.rowMax - coordinates.rowMin > maxRowPaste) {
        success = false;
        message = 'Unable to paste. Cannot paste more than ' + maxRowPaste + ' rows.';
    }

    return {
        coordinates,
        message,
        payload,
        rowsToAdd: Math.max(
            0,
            coordinates.rowMin + payload.numRows + (readOnlyRowCount ? readOnlyRowCount : 0) - model.rowCount
        ),
        success,
    };
}

type ParsePastePayload = {
    data: List<List<string>>;
    numCols: number;
    numRows: number;
};

type PasteModel = {
    coordinates: {
        colMax: number;
        colMin: number;
        rowMax: number;
        rowMin: number;
    };
    message?: string;
    payload: ParsePastePayload;
    rowsToAdd: number;
    success: boolean;
};

function parsePaste(value: string): ParsePastePayload {
    let numCols = 0;
    let data = List<List<string>>();

    if (value === undefined || value === null || typeof value !== 'string') {
        return { data, numCols, numRows: 0 };
    }

    // remove trailing newline from pasted data to avoid creating an empty row of cells
    if (value.endsWith('\n')) value = value.substring(0, value.length - 1);

    value.split('\n').forEach(rv => {
        const columns = List(rv.split('\t'));
        if (numCols < columns.size) {
            numCols = columns.size;
        }
        data = data.push(columns);
    });

    // Normalize the number columns in each row in case a user pasted rows with different numbers of columns in them
    data = data
        .map(columns => {
            if (columns.size < numCols) {
                const remainder = [];
                for (let i = columns.size; i < numCols; i++) {
                    remainder.push('');
                }
                return columns.push(...remainder);
            }
            return columns;
        })
        .toList();

    return {
        data,
        numCols,
        numRows: data.size,
    };
}

async function insertPastedData(
    editorModel: EditorModel,
    paste: PasteModel,
    readonlyRows: string[],
    lockRowCount: boolean,
    forUpdate: boolean,
    targetContainerPath: string,
    selectCells: boolean
): Promise<Partial<EditorModel>> {
    const pastedData = paste.payload.data;
    let cellMessages = editorModel.cellMessages;
    let cellValues = editorModel.cellValues;
    const selectionCells: string[] = [];
    let rowCount = editorModel.rowCount;

    if (paste.rowsToAdd > 0 && !lockRowCount) {
        rowCount += paste.rowsToAdd;
    }

    const byColumnValues = getPasteValuesByColumn(paste);
    const lookupValueCache: LookupValueCache = {};
    const { colMin, rowMin } = paste.coordinates;
    let rowIdx = rowMin;

    for (let r = 0; r < pastedData.size; r++) {
        const row = pastedData.get(r);

        if (readonlyRows) {
            while (rowIdx < rowCount && editorModel.isReadOnlyRow(rowIdx, readonlyRows)) {
                // Skip over readonly rows
                rowIdx++;
            }
        }

        if (rowIdx >= rowCount && lockRowCount) {
            // If we've reached the row limit we can short-circuit allowing at least a partial paste.
            break;
        }

        let pkValue = getPkValue(row, editorModel.queryInfo);
        if (!pkValue) pkValue = editorModel.getPkValue(rowIdx);

        for (let cn = 0; cn < row.size; cn++) {
            const val = row.get(cn);
            const colIdx = colMin + cn;
            const col = editorModel.getColumnByIndex(colIdx);
            const cellKey = genCellKey(col.fieldKey, rowIdx);
            const metadata = editorModel.getColumnMetadata(col?.fieldKey);
            const readOnlyCol = col?.readOnly;
            const readOnlyCell = metadata?.isReadOnlyCell?.(pkValue);

            if (!readOnlyCol && !readOnlyCell) {
                let cv: List<ValueDescriptor>;
                let msg: CellMessage;

                if (col?.isPublicLookup()) {
                    // If the column is a lookup and forUpdate is true, then we need to query for the rowIds so we can set the correct raw values,
                    // otherwise insert will fail. This is most common for cross-folder sample selection (Issue 50363)
                    const display = byColumnValues.get(cn)?.toArray();
                    const { message, valueDescriptors } = await getParsedLookup(
                        col,
                        lookupValueCache,
                        display,
                        val,
                        cellKey,
                        forUpdate,
                        targetContainerPath,
                        editorModel
                    );
                    cv = valueDescriptors;
                    msg = message;
                } else {
                    const { message, value } = getValidatedEditableGridValue(val, col);
                    cv = List([{ display: value, raw: value }]);
                    msg = message;
                }

                cellMessages = cellMessages.set(cellKey, msg);
                cellValues = cellValues.set(cellKey, cv);
            }

            if (selectCells) {
                selectionCells.push(cellKey);
            }
        }

        rowIdx++;
    }

    return { cellMessages, cellValues, rowCount, selectionCells };
}

function getReadonlyRowCount(editorModel: EditorModel, startRowInd: number, readonlyRows: string[]): number {
    const pkCols = editorModel.queryInfo.getPkCols();

    // Rows with multiple PKs are always read-only
    if (pkCols.length !== 1) {
        return editorModel.rowCount - startRowInd;
    }

    let total = 0;

    for (let index = startRowInd; index < editorModel.rowCount; index++) {
        const pkValue = editorModel.getPkValue(index);
        if (readonlyRows.includes(pkValue.toString())) total++;
    }

    return total;
}

// Gets the non-blank values pasted for each column.  The values in the resulting lists may not align to the rows
// pasted if there were empty cells within the paste block.
function getPasteValuesByColumn(paste: PasteModel): List<List<string>> {
    const { data } = paste.payload;
    const valuesByColumn = List<List<string>>().asMutable();

    for (let i = 0; i < data.get(0).size; i++) {
        valuesByColumn.push(List<string>().asMutable());
    }
    data.forEach(row => {
        row.forEach((value, index) => {
            // if values contain commas, users will need to paste the values enclosed in quotes
            // but we don't want to retain these quotes for purposes of selecting values in the grid
            parseCsvString(value, ',', true).forEach(v => {
                if (v.trim().length > 0) valuesByColumn.get(index).push(v.trim());
            });
        });
    });
    return valuesByColumn.asImmutable();
}

export async function validateAndInsertPastedData(
    editorModel: EditorModel,
    value: string,
    readonlyRows: string[],
    lockRowCount: boolean,
    forUpdate: boolean,
    targetContainerPath: string,
    selectCells: boolean
): Promise<Partial<EditorModel>> {
    let selectedColIdx: number;
    let selectedRowIdx: number;

    if (editorModel.isMultiSelect) {
        // Issue 51359 - When pasting during multiselect we want to paste from the first cell in the selection,
        // otherwise we'll paste from the initially selected cell, which will fill the wrong area. This is most obvious
        // if you select upwards, then paste.
        const minCellKey = editorModel.selectionCells[0];
        const { fieldKey, rowIdx } = parseCellKey(minCellKey);
        selectedRowIdx = rowIdx;
        selectedColIdx = editorModel.orderedColumns.indexOf(fieldKey);
    } else {
        selectedRowIdx = editorModel.selectedRowIdx;
        selectedColIdx = editorModel.selectedColIdx;
    }

    const readOnlyRowCount =
        readonlyRows && !lockRowCount ? getReadonlyRowCount(editorModel, selectedRowIdx, readonlyRows) : 0;

    const paste = validatePaste(editorModel, selectedColIdx, selectedRowIdx, value, readOnlyRowCount);

    if (paste.success) {
        return insertPastedData(
            editorModel,
            paste,
            readonlyRows,
            lockRowCount,
            forUpdate,
            targetContainerPath,
            selectCells
        );
    } else {
        const fieldKey = editorModel.getFieldKeyByIndex(selectedColIdx);
        const cellKey = genCellKey(fieldKey, selectedRowIdx);
        return { cellMessages: editorModel.cellMessages.set(cellKey, { message: paste.message }) };
    }
}

export async function pasteEvent(
    editorModel: EditorModel,
    event: any,
    readonlyRows: string[],
    lockRowCount: boolean,
    forUpdate: boolean,
    targetContainerPath: string
): Promise<Partial<EditorModel>> {
    // If a cell has focus do not accept incoming paste events -- allow for normal paste to input
    if (editorModel && editorModel.hasSelection && !editorModel.hasFocus) {
        cancelEvent(event);
        const value = getPasteValue(event);
        return await validateAndInsertPastedData(
            editorModel,
            value,
            readonlyRows,
            lockRowCount,
            forUpdate,
            targetContainerPath,
            true
        );
    }

    return undefined;
}

function getCellCopyValue(valueDescriptors: List<ValueDescriptor>): string {
    let value = '';

    if (valueDescriptors && valueDescriptors.size > 0) {
        let sep = '';
        value = valueDescriptors.reduce((agg, vd) => {
            agg += sep + (vd.display !== undefined ? vd.display.toString().trim() : '');
            sep = ', ';
            return agg;
        }, value);
    }

    return value;
}

function getCopyValue(model: EditorModel, hideReadOnlyRows: boolean, readonlyRows: string[]): string {
    let copyValue = '';
    const EOL = '\n';
    const selectionCells = [...model.selectionCells];
    const fieldKey = model.orderedColumns.get(model.selectedColIdx);
    selectionCells.push(genCellKey(fieldKey, model.selectedRowIdx));

    for (let rn = 0; rn < model.rowCount; rn++) {
        let cellSep = '';
        let inSelection = false;

        // Do not include hidden rows in copy values
        if (hideReadOnlyRows && readonlyRows) {
            if (model.isReadOnlyRow(rn, readonlyRows)) continue;
        }

        model.orderedColumns.forEach(fieldKey => {
            const cellKey = genCellKey(fieldKey, rn);

            if (selectionCells.find(key => key === cellKey)) {
                inSelection = true;
                copyValue += cellSep + getCellCopyValue(model.cellValues.get(cellKey));
                cellSep = '\t';
            }
        });

        if (inSelection) {
            copyValue += EOL;
        }
    }

    if (copyValue[copyValue.length - 1] === EOL) {
        copyValue = copyValue.slice(0, copyValue.length - 1);
    }

    return copyValue;
}

export function copyEvent(
    editorModel: EditorModel,
    event: any,
    hideReadOnlyRows: boolean,
    readonlyRows: string[]
): boolean {
    if (editorModel && !editorModel.hasFocus && editorModel.hasSelection && !editorModel.isSparseSelection) {
        cancelEvent(event);
        setCopyValue(event, getCopyValue(editorModel, hideReadOnlyRows, readonlyRows));
        return true;
    }

    return false;
}
