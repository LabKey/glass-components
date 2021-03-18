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
import { Iterable, List, Map, Set } from 'immutable';
import { Utils } from '@labkey/api';

import { hasParameter, toggleParameter } from '../url/ActionURL'; // do not refactor to '../..', cause jest test to failure with typescript constructor error due to circular loading
import { QueryInfo } from '../../public/QueryInfo';

import { parseDate } from './Date';

const emptyList = List<string>();

// Case insensitive Object reference. Returns undefined if either object or prop does not resolve.
// If both casings exist (e.g. 'x' and 'X' are props) then either value may be returned.
export function caseInsensitive(obj: Record<string, any>, prop: string): any {
    if (obj === undefined || obj === null) {
        return undefined;
    }

    if (Utils.isString(prop)) {
        const lower = prop.toLowerCase();

        for (const p in obj) {
            if (obj.hasOwnProperty(p) && p.toLowerCase() === lower) {
                return obj[p];
            }
        }
    }

    return undefined;
}

/**
 * Returns a case-insensitive intersection of two List<string>.
 * @param a
 * @param b
 */
export function intersect(a: List<string>, b: List<string>): List<string> {
    if (!a || !b || a.size === 0 || b.size === 0) {
        return emptyList;
    }

    const sa = a.reduce(toLowerReducer, Set<string>().asMutable()).asImmutable();
    const sb = b.reduce(toLowerReducer, Set<string>().asMutable()).asImmutable();

    return sa.intersect(sb).toList();
}

/**
 * Returns a new string in which the first character of the given string is capitalized.  If
 * the value is, empty, undefined, or not a string returns the value.
 * @param value string to convert
 */
export function capitalizeFirstChar(value: string): string {
    if (value && typeof value === 'string' && value.length > 1) {
        return [value.substr(0, 1).toUpperCase(), value.substr(1)].join('');
    }
    return value;
}

/**
 * Returns a copy of List<string> and ensures that in copy all values are lower case strings.
 * @param a
 */
export function toLowerSafe(a: List<string>): List<string> {
    if (a) {
        return a
            .filter(v => typeof v === 'string')
            .map(v => v.toLowerCase())
            .toList();
    }

    return emptyList;
}

function toLowerReducer(s: Set<string>, v: string): Set<string> {
    if (typeof v === 'string') {
        s.add(v.toLowerCase());
    }
    return s;
}

export function camelCaseToTitleCase(text: string) {
    const camelEdges = /([A-Z](?=[A-Z][a-z])|[^A-Z](?=[A-Z])|[a-zA-Z](?=[^a-zA-Z]))/g;
    const saferText = text.replace(camelEdges, '$1 ');
    return saferText.charAt(0).toUpperCase() + saferText.slice(1);
}

export function not(predicate: (...args: any[]) => boolean): (...args: any[]) => boolean {
    return function () {
        return !predicate.apply(this, arguments);
    };
}

export function applyDevTools() {
    if (devToolsActive() && window['devToolsExtension']) {
        return window['devToolsExtension']();
    }

    return f => f;
}

const DEV_TOOLS_URL_PARAMETER = 'devTools';

export function devToolsActive(): boolean {
    return LABKEY.devMode === true && hasParameter(DEV_TOOLS_URL_PARAMETER);
}

export function toggleDevTools(): void {
    if (LABKEY.devMode) {
        toggleParameter(DEV_TOOLS_URL_PARAMETER, 1);
    }
}

let DOM_COUNT = 0;
const DOM_PREFIX = 'labkey-app-';

// Only exported to use with tests. Don't use this anywhere else. This is needed so we can use it in beforeEach for jest
// snapshot tests. This way a snapshot will be identical when run as part of a test suite or run individually.
export function TESTS_ONLY_RESET_DOM_COUNT(): void {
    DOM_COUNT = 0;
}

// Generate an id with a dom-unique integer suffix
export function generateId(prefix?: string): string {
    return (prefix ? prefix : DOM_PREFIX) + DOM_COUNT++;
}

// http://davidwalsh.name/javascript-debounce-function
export function debounce(func, wait, immediate?: boolean): () => void {
    let timeout: number;
    return function () {
        const context = this,
            args = arguments;
        const later = function (): void {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = window.setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/**
 * Performs an equality check on two arrays, returning true of the arrays are the same size
 *
 * @param array1
 * @param array2
 */
export function unorderedEqual(array1: any[], array2: any[]): boolean {
    if (array1.length !== array2.length) return false;

    const sortedA1 = array1.sort();
    const sortedA2 = array2.sort();
    for (let i = 0; i < sortedA1.length; i++) {
        if (sortedA1[i] !== sortedA2[i]) {
            return false;
        }
    }
    return true;
}

/**
 * Returns true if value is undefined, an empty string, or an empty array.  Otherwise returns false.
 * @param value
 */
export function valueIsEmpty(value): boolean {
    if (!value) return true;
    if (typeof value === 'string' && value === '') return true;
    return Array.isArray(value) && value.length === 0;
}

/**
 * Creates a JS Object, suitable for use as a fieldValues object for QueryInfoForm,
 * mapping between field keys and values that are shared by all ids for the given data.
 *
 * It is assumed that the set of fields in each row of data is the same, though some fields
 * may be empty or null.  If the field sets are different, the results returned will
 * be as if the values were present and the same as in one of the other rows.
 *
 * @param data Map between ids and a map of data for the ids (i.e, a row of data for that id)
 */
export function getCommonDataValues(data: Map<any, any>): any {
    let valueMap = Map<string, any>(); // map from fields to the value shared by all rows
    let fieldsInConflict = Set<string>();
    let emptyFields = Set<string>(); // those fields that are empty
    data.map((rowData, id) => {
        // const rowData = data.get(id);
        if (rowData) {
            rowData.forEach((data, key) => {
                if (!fieldsInConflict.has(key)) {
                    // skip fields that are already in conflict
                    let value = data;

                    // Convert from immutable to regular JS
                    if (Iterable.isIterable(data)) {
                        if (List.isList(data)) {
                            value = data.toJS();
                        } else {
                            value = data.get('value');
                        }
                    }

                    const currentValueEmpty = valueIsEmpty(value);
                    const havePreviousValue = valueMap.has(key);
                    const arrayNotEqual =
                        Array.isArray(value) &&
                        valueMap.get(key) &&
                        (!Array.isArray(valueMap.get(key)) || !unorderedEqual(valueMap.get(key), value));

                    if (!currentValueEmpty) {
                        // non-empty value, so let's see if we have the same value
                        if (emptyFields.contains(key)) {
                            fieldsInConflict = fieldsInConflict.add(key);
                        } else if (!havePreviousValue) {
                            valueMap = valueMap.set(key, value);
                        }
                        if (arrayNotEqual) {
                            fieldsInConflict = fieldsInConflict.add(key);
                            valueMap = valueMap.delete(key);
                        } else if (valueMap.get(key) !== value) {
                            fieldsInConflict = fieldsInConflict.add(key);
                            valueMap = valueMap.delete(key);
                        }
                    } else if (havePreviousValue) {
                        // some row had a value, but this row does not
                        fieldsInConflict = fieldsInConflict.add(key);
                        valueMap = valueMap.delete(key);
                    } else {
                        emptyFields = emptyFields.add(key);
                    }
                }
            });
        } else {
            console.error('Unable to find data for selection id ' + id);
        }
    });
    return valueMap.toObject();
}

function isSameWithStringCompare(value1: any, value2: any): boolean {
    if (value1 === value2 || (valueIsEmpty(value1) && valueIsEmpty(value2))) return true;
    if (value1 && value2) {
        const strVal1 = value1.toString();
        const strVal2 = value2.toString();
        return strVal1 === strVal2;
    }
    return false; // one value is empty and the other is not.
}

/**
 * Constructs an array of objects (suitable for the rows parameter of updateRows) where each object contains the
 * values that are different from the ones in originalData object as well as the primary key values for that row.
 * If updatedValues is empty or all of the originalData values are the same as the updatedValues, returns an empty array.
 *
 * @param originalData a map from an id field to a Map from fieldKeys to an object with a 'value' field
 * @param updatedValues an object mapping fieldKeys to values that are being updated
 * @param primaryKeys the list of primary fieldKey names
 */
export function getUpdatedData(originalData: Map<string, any>, updatedValues: any, primaryKeys: List<string>): any[] {
    const updateValuesMap = Map<any, any>(updatedValues);
    const updatedData = originalData.map(originalRowMap => {
        return originalRowMap.reduce((m, fieldValueMap, key) => {
            if (fieldValueMap?.has('value')) {
                if (primaryKeys.indexOf(key) > -1) {
                    return m.set(key, fieldValueMap.get('value'));
                } else if (
                    updateValuesMap.has(key) &&
                    !isSameWithStringCompare(updateValuesMap.get(key), fieldValueMap.get('value'))
                ) {
                    return m.set(key, updateValuesMap.get(key) == undefined ? null : updateValuesMap.get(key));
                } else {
                    return m;
                }
            }
            // Handle multi-value select
            else if (List.isList(fieldValueMap)) {
                let updatedVal = updateValuesMap.get(key);
                if (Array.isArray(updatedVal)) {
                    updatedVal = updatedVal.map(val => {
                        const match = fieldValueMap.find(original => original.get('value') === val);
                        if (match !== undefined) {
                            return match.get('displayValue');
                        }
                        return val;
                    });

                    return m.set(key, updatedVal);
                } else if (updateValuesMap.has(key) && updatedVal === undefined) {
                    return m.set(key, []);
                } else return m;
            } else return m;
        }, Map<any, any>());
    });
    // we want the rows that contain more than just the primaryKeys
    return updatedData
        .filter(rowData => rowData.size > primaryKeys.size)
        .map(rowData => rowData.toJS())
        .toArray();
}

/**
 * Constructs an array of objects (suitable for the rows parameter of updateRows), where each object contains the
 * values in editorRows that are different from the ones in originalGridData
 *
 * @param originalGridData a map from an id field to a Map from fieldKeys to values
 * @param editorRows An array of Maps from field keys to values
 * @param idField the fieldKey in the editorRow objects that is the id field that is the key for originalGridData
 * @param queryInfo the query info behind this editable grid
 */
export function getUpdatedDataFromGrid(
    originalGridData: Map<string, Map<string, any>>,
    editorRows: Array<Map<string, any>>,
    idField: string,
    queryInfo: QueryInfo
): any[] {
    const updatedRows = [];
    editorRows.forEach(editedRow => {
        const id = editedRow.get(idField);
        const originalRow = originalGridData.get(id.toString());
        if (originalRow) {
            const row = editedRow.reduce((row, value, key) => {
                const originalValue = originalRow.has(key) ? originalRow.get(key) : undefined;
                const isDate = queryInfo.getColumn(key)?.jsonType === 'date';
                // Convert empty cell to null
                if (value === '') value = null;

                // EditableGrid passes in strings for single values. Attempt this conversion here to help check for
                // updated values. This is not the final type check.
                if (typeof originalValue === 'number' || typeof originalValue === 'boolean') {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Incorrect types are handled by API and user feedback created from that response. Don't need
                        // to handle that here.
                    }
                }

                // If col is a multi-value column, compare all values for changes
                if (List.isList(originalValue) && Array.isArray(value)) {
                    if (
                        originalValue.size !== value.length ||
                        originalValue.findIndex(
                            o => value.indexOf(o.value) === -1 && value.indexOf(o.displayValue) === -1
                        ) !== -1
                    ) {
                        row[key] = value;
                    }
                }
                // Lookup columns store a list but grid only holds a single value
                else if (List.isList(originalValue) && !Array.isArray(value)) {
                    if (originalValue.get(0).value !== value) {
                        row[key] = (isDate ? parseDate(value) : value) ?? null;
                    }
                } else if (originalValue !== value) {
                    // - only update if the value has changed
                    // - if the value is 'undefined', it will be removed from the update rows, so in order to
                    // erase an existing value we set the value to null in our update data

                    row[key] = (isDate ? parseDate(value) : value) ?? null;
                }
                return row;
            }, {});
            if (!Utils.isEmptyObj(row)) {
                row[idField] = id;
                updatedRows.push(row);
            }
        } else {
            console.error('Unable to find original row for id ' + id);
        }
    });
    return updatedRows;
}

/**
 * This forces tooltips to close and menus to stop showing pressed state after you close them on Chrome. We likely will
 * not need this if/when we upgrade React Bootstrap to something beyond the pre-release version we are using.
 */
export const blurActiveElement = (): void => {
    (document.activeElement as HTMLElement).blur();
};

/**
 * Unique names are not enforced for samples when they belong to different sample types, or data from different data classes.
 * When generating SelectInput options, we want to append sample type or source type to entries with duplicate names so user know which item they are selecting.
 * @param rows
 * @param keyField
 * @param valueField
 * @param typeField
 */
export function getDisambiguatedSelectInputOptions(
    rows: List<Map<string, any>> | { [key: string]: any },
    keyField: string,
    valueField: string,
    typeField: string
) {
    const options = [],
        rawOptions = [];

    if (Iterable.isIterable(rows)) {
        rows.forEach(row => {
            rawOptions.push({
                value: row.getIn([keyField, 'value']),
                label: row.getIn([valueField, 'value']),
                type: row.getIn([typeField, 'value']),
            });
        });
    } else {
        Object.keys(rows).forEach(row => {
            const data = rows[row];
            rawOptions.push({
                value: data[keyField]?.value,
                label: data[valueField]?.value,
                type: data[typeField]?.value,
            });
        });
    }

    rawOptions.sort((a, b) => {
        return a.label.localeCompare(b.label);
    });

    const duplicateValues = [];
    for (let i = 0; i < rawOptions.length - 1; i++) {
        if (rawOptions[i + 1].label == rawOptions[i].label) {
            if (duplicateValues.indexOf(rawOptions[i].label) === -1) duplicateValues.push(rawOptions[i].label);
        }
    }

    rawOptions.forEach(option => {
        const label =
            duplicateValues.indexOf(option.label) > -1 ? option.label + ' (' + option.type + ')' : option.label;
        options.push({ value: option.value, label });
    });

    return options;
}

function isFloat(value: number | string): boolean {
    return !isNaN(Number(value)) && !isNaN(parseFloat(value + ''));
}

function isInteger(value: number | string): boolean {
    return !isNaN(Number(value)) && parseInt(value + '') == value && !isNaN(parseInt(value + '', 10));
}

export function isIntegerInRange(value: number, min: number, max?: number): boolean {
    return isInteger(value) && (!min || Number(value) >= min) && (!max || Number(value) <= max);
}

export function isNonNegativeInteger(value: number | string): boolean {
    return isInteger(value) && Number(value) >= 0;
}

export function isNonNegativeFloat(value: number | string): boolean {
    return isFloat(value) && Number(value) >= 0;
}
