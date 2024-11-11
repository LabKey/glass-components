import { Filter } from '@labkey/api';

import { Operation, QueryColumn } from '../../../public/QueryColumn';

import {
    getColDateFormat,
    getFormattedStringFromDate,
    getJsonDateFormatString,
    getJsonDateTimeFormatString,
    parseDate,
    parseTime,
} from '../../util/Date';

import { SelectInputOption, SelectInputProps } from '../forms/input/SelectInput';

import { QuerySelectOwnProps } from '../forms/QuerySelect';

import { isBoolean, isFloat, isInteger } from '../../util/utils';
import { incrementClientSideMetricCount } from '../../actions';

import { CellMessage } from './models';
import { CellActions, MODIFICATION_TYPES } from './constants';

interface ValidatedValue {
    message: CellMessage;
    value: any;
}

export const getValidatedEditableGridValue = (origValue: any, col: QueryColumn): ValidatedValue => {
    // col ?? {} so it's safe to destructure
    const { caption, isDateOnlyColumn, jsonType, required, scale, validValues } = col ?? {};
    const isDateTimeType = jsonType === 'date';
    const isDateType = isDateTimeType && isDateOnlyColumn;
    let message;
    let value = origValue;

    // Issue 44398: match JSON dateTime format provided by LK server when submitting date values back for insert/update
    // Issue 45140: use QueryColumn date format for parseDate()
    if (isDateType || isDateTimeType) {
        const dateFormat = getColDateFormat(col);
        const dateVal = parseDate(origValue, dateFormat);
        const dateStrVal = isDateType ? getJsonDateFormatString(dateVal) : getJsonDateTimeFormatString(dateVal);
        if (origValue && !dateStrVal) {
            const noun = isDateType ? 'date' : 'date time';
            message = `Invalid ${noun}, use format ${dateFormat}`;
        }
        value = dateStrVal ?? origValue;
    } else if (value != null && value !== '' && !col?.isPublicLookup()) {
        if (validValues) {
            const trimmed = origValue?.toString().trim();
            if (validValues.indexOf(trimmed) === -1) message = `'${trimmed}' is not a valid choice`;
        } else if (jsonType === 'time') {
            const time = parseTime(value);
            if (time) value = getFormattedStringFromDate(time, col, false);
            else message = 'Invalid time';
        } else if (jsonType === 'boolean' && !isBoolean(value)) {
            message = 'Invalid boolean';
        } else if (jsonType === 'int' && !isInteger(value)) {
            message = 'Invalid integer';
        } else if (jsonType === 'float' && !isFloat(value)) {
            message = 'Invalid decimal';
        } else if (jsonType === 'string' && scale) {
            if (value.toString().trim().length > scale)
                message = value.toString().trim().length + '/' + scale + ' characters';
        }
    }

    if (required && (value == null || value === '' || value.toString().trim() === '') && jsonType !== 'boolean') {
        message = (message ? message + '. ' : '') + caption + ' is required.';
    }

    return {
        value,
        message: message ? { message } : undefined,
    };
};

export function onCellSelectChange(
    cellActions: Partial<CellActions>,
    colIdx: number,
    rowIdx: number,
    selectedOptions: SelectInputOption | SelectInputOption[],
    multiple: boolean
): void {
    const { modifyCell, selectCell } = cellActions;

    if (multiple) {
        if (selectedOptions.length === 0) {
            modifyCell(colIdx, rowIdx, undefined, MODIFICATION_TYPES.REMOVE_ALL);
        } else {
            const valueDescriptors = selectedOptions.map(item => ({ raw: item.value, display: item.label }));
            modifyCell(colIdx, rowIdx, valueDescriptors, MODIFICATION_TYPES.REPLACE);
        }
    } else {
        const selectedOption = selectedOptions as SelectInputOption;
        modifyCell(
            colIdx,
            rowIdx,
            [{ raw: selectedOption?.value, display: selectedOption?.label }],
            MODIFICATION_TYPES.REPLACE
        );
        selectCell(colIdx, rowIdx);
    }
}

const CELL_KEY_SEPARATOR = '&&';

export function genCellKeyPrefix(fieldKey: string): string {
    return fieldKey.toLowerCase() + CELL_KEY_SEPARATOR;
}

export function genCellKey(fieldKey: string, rowIdx: number): string {
    return genCellKeyPrefix(fieldKey) + rowIdx;
}

interface CellKeyParts {
    fieldKey: string;
    rowIdx: number;
}

export function parseCellKey(cellKey: string): CellKeyParts {
    const [fieldKey, rowIdx] = cellKey.split(CELL_KEY_SEPARATOR);

    return {
        fieldKey,
        rowIdx: parseInt(rowIdx, 10),
    };
}

/**
 * Sorts cell keys left to right, top to bottom.
 */
export function sortCellKeys(orderedColumns: string[], cellKeys: string[]): string[] {
    return Array.from(new Set(cellKeys)).sort((a, b) => {
        const aCoords = parseCellKey(a);
        const bCoords = parseCellKey(b);
        if (aCoords.rowIdx === bCoords.rowIdx)
            return orderedColumns.indexOf(aCoords.fieldKey) - orderedColumns.indexOf(bCoords.fieldKey);
        return aCoords.rowIdx - bCoords.rowIdx;
    });
}

// https://stackoverflow.com/questions/10713878/decimal-subtraction-problems-in-javascript
export function decimalDifference(first, second, subtract = true): number {
    const multiplier = 10000; // this will only help/work to 4 decimal places
    return (first * multiplier + (subtract ? -1 : 1) * second * multiplier) / multiplier;
}

/**
 * Returns true if the selection is sparse. A sparse selection is one where a continuous set of cells in a rectangle are
 * not selected. It may look something like this:
 *  0 1 1 0 0
 *  0 0 0 1 1
 *  0 1 1 0 0
 * @param orderedColumns the orderedColumns from the EditorModel
 * @param selection An array of cell keys representing the selected cells, ordered left to right, top to bottom.
 */
export function isSparseSelection(orderedColumns: string[], selection: string[]): boolean {
    if (selection.length === 0) return false;

    const firstCell = parseCellKey(selection[0]);
    const lastCell = parseCellKey(selection[selection.length - 1]);
    const minCol = orderedColumns.indexOf(firstCell.fieldKey);
    const maxCol = orderedColumns.indexOf(lastCell.fieldKey);
    const minRow = firstCell.rowIdx;
    const maxRow = lastCell.rowIdx;
    const expectedCellCount = (maxCol - minCol + 1) * (maxRow - minRow + 1);

    // If the expected size is wrong we can short circuit and return
    if (selection.length !== expectedCellCount) return true;

    let selIdx = 0;

    // If the sizes match, then we need to generate the expected cellKeys in the order we expect them, and if they don't
    // all match we know it's a sparse selection.
    for (let rowIdx = minRow; rowIdx <= maxRow; rowIdx++) {
        for (let colIdx = minCol; colIdx <= maxCol; colIdx++) {
            const expectedCellKey = genCellKey(orderedColumns[colIdx], rowIdx);
            const actualCellKey = selection[selIdx];

            if (expectedCellKey !== actualCellKey) return true;

            selIdx++;
        }
    }

    return false;
}

export function getLookupFilters(
    column: QueryColumn,
    lookupKeyValues?: any[],
    lookupValues?: any[],
    lookupValueFilters?: Filter.IFilter[],
    forUpdate?: boolean,
    displayColumn?: string
): Filter.IFilter[] {
    const { lookup } = column;
    const filters = Array.from(lookupValueFilters ?? []);

    if (lookupValues) {
        filters.push(Filter.create(displayColumn ?? lookup.displayColumn, lookupValues, Filter.Types.IN));
    }

    if (lookupKeyValues) {
        filters.push(Filter.create(lookup.keyColumn, lookupKeyValues, Filter.Types.IN));
    }

    const operation = forUpdate ? Operation.update : Operation.insert;
    if (lookup.hasQueryFilters(operation)) {
        filters.push(...lookup.getQueryFilters(operation));
    }

    return filters;
}

export const EDIT_GRID_INPUT_CELL_CLASS = 'eg-input-cell';

export const gridCellSelectInputProps: Partial<SelectInputProps> = {
    autoFocus: true,
    containerClass: 'select-input-cell-container',
    customStyles: {
        control: provided => ({
            ...provided,
            minHeight: 24,
            borderRadius: 0,
        }),
        valueContainer: provided => ({
            ...provided,
            minHeight: 24,
            padding: '0 4px',
        }),
        input: provided => ({
            ...provided,
            margin: '0px',
        }),
        indicatorsContainer: provided => ({
            ...provided,
            minHeight: 24,
            padding: '0 4px',
        }),
    },
    customTheme: theme => ({
        ...theme,
        colors: {
            ...theme.colors,
            danger: '#D9534F',
            primary: '#2980B9',
            primary75: '#009BF9',
            primary50: '#F2F9FC',
            primary25: 'rgba(41, 128, 185, 0.1)',
        },
        spacing: {
            ...theme.spacing,
            baseUnit: 2,
        },
    }),
    inputClass: `select-input-cell ${EDIT_GRID_INPUT_CELL_CLASS}`,
    menuPosition: 'fixed',
    openMenuOnFocus: true,
    placeholder: '',
    showIndicatorSeparator: false,
    showLabel: false,
};

export const gridCellQuerySelectProps: Partial<QuerySelectOwnProps> = {
    ...gridCellSelectInputProps,
    showLoading: false,
};

/**
 * Computes the new range for a given grid dimension when expanding or contracting in a particular direction.
 * @param selectedIdx The index of the currently selected cell
 * @param min The minimum of the current range
 * @param max The maximum of the current range
 * @param direction number in the range of -1, 1.
 *  - If -1, we are moving up or left
 *  - If 0 we are not moving
 *  - If 1 we are moving down or right
 */
export function computeRangeChange(selectedIdx: number, min: number, max: number, direction: number): [number, number] {
    if (direction === 0) {
        // If we haven't changed direction then we don't need to expand or contract the range at all
        return [min, max];
    }

    if (min === max) {
        // A single selected cell is a bit of a special case, because we'll be extending either before or after
        if (direction === 1) {
            // Extend forward
            max = max + 1;
        } else {
            // Extend backward
            min = min - 1;
        }
    } else if (min < selectedIdx) {
        // The selected area is above or left of the currently selected index
        if (direction === 1) {
            // We're shrinking forwards
            min = min + 1;
        } else {
            // We're extending backwards
            min = min - 1;
        }
    } else {
        if (direction === 1) {
            // We're extending forwards
            max = max + 1;
        } else {
            // We're shrinking backwards
            max = max - 1;
        }
    }

    return [Math.max(0, min), max];
}

export function incrementRowCountMetric(dataType: string, rowCount: number, isUpdate: boolean): void {
    if (!rowCount) return;

    const metricFeatureArea = isUpdate ? 'gridUpdateCounts' : 'gridInsertCounts';
    if (rowCount <= 50) {
        incrementClientSideMetricCount(metricFeatureArea, dataType + '1To50');
    } else if (rowCount <= 100) {
        incrementClientSideMetricCount(metricFeatureArea, dataType + '51To100');
    } else if (rowCount <= 250) {
        incrementClientSideMetricCount(metricFeatureArea, dataType + '101To250');
    } else {
        incrementClientSideMetricCount(metricFeatureArea, dataType + 'GT250');
    }
}
