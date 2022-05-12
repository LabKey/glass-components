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
import { getServerContext, Utils } from '@labkey/api';
import { ChangeEvent } from 'react';

import { hasParameter, toggleParameter } from '../url/ActionURL'; // do not refactor to '../..', cause jest test to failure with typescript constructor error due to circular loading
import { QueryInfo } from '../../public/QueryInfo';

import { encodePart } from '../../public/SchemaQuery';

import { getColDateFormat, getJsonDateTimeFormatString, parseDate } from './Date';

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
 * Returns a new string in which the first character of the given string is uncapitalized.  If
 * the value is, empty, undefined, or not a string returns the value.
 * @param value string to convert
 */
export function uncapitalizeFirstChar(value: string): string {
    if (value && typeof value === 'string' && value.length > 1) {
        return [value.substr(0, 1).toLowerCase(), value.substr(1)].join('');
    }
    return value;
}

/**
 * Util to format the keys in a record
 * Example: convert {capitalizedFirstKey: value} to {CapitalizedFirstKey: value} with capitalizeFirstChar fn
 * @param obj the original object to transform
 * @param keyTransformFn the transform function for keys
 */
export function withTransformedKeys(obj: Record<string, any>, keyTransformFn: (value) => string): Record<string, any> {
    if (obj === undefined || obj === null) {
        return obj;
    }

    const transformedObj = {};
    for (const rawKey in obj) {
        if (obj.hasOwnProperty(rawKey)) {
            const key = keyTransformFn(rawKey);
            transformedObj[key] = obj[rawKey];
        }
    }

    return transformedObj;
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
    return getServerContext().devMode === true && hasParameter(DEV_TOOLS_URL_PARAMETER);
}

export function toggleDevTools(): void {
    if (getServerContext().devMode) {
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
            // Issue 42672: The original data has keys that are names or captions for the columns.  We need to use
            // the encoded key that will match what's expected for filtering on the server side (e.g., "U g$Sl" instead of "U g/l")
            const encodedKey = encodePart(key);
            if (fieldValueMap?.has('value')) {
                if (primaryKeys.indexOf(key) > -1) {
                    return m.set(key, fieldValueMap.get('value'));
                } else if (
                    updateValuesMap.has(encodedKey) &&
                    !isSameWithStringCompare(updateValuesMap.get(encodedKey), fieldValueMap.get('value'))
                ) {
                    return m.set(
                        key,
                        updateValuesMap.get(encodedKey) == undefined ? null : updateValuesMap.get(encodedKey)
                    );
                } else {
                    return m;
                }
            }
            // Handle multi-value select
            else if (List.isList(fieldValueMap)) {
                let updatedVal = updateValuesMap.get(encodedKey);
                if (Array.isArray(updatedVal)) {
                    updatedVal = updatedVal.map(val => {
                        const match = fieldValueMap.find(original => original.get('value') === val);
                        if (match !== undefined) {
                            return match.get('displayValue');
                        }
                        return val;
                    });

                    return m.set(key, updatedVal);
                } else if (updateValuesMap.has(encodedKey) && updatedVal === undefined) {
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
                // We can skip the idField for the diff check, that will be added to the updated rows later
                if (key === idField) return row;

                let originalValue = originalRow.has(key) ? originalRow.get(key) : undefined;
                const col = queryInfo.getColumn(key);
                const isDate = col?.jsonType === 'date';
                // Convert empty cell to null
                if (value === '') value = null;

                // Lookup columns store a list but grid only holds a single value
                if (List.isList(originalValue) && !Array.isArray(value)) {
                    originalValue = Map.isMap(originalValue.get(0))
                        ? originalValue.get(0).get('value')
                        : originalValue.get(0).value;
                }

                // EditableGrid passes in strings for single values. Attempt this conversion here to help check for
                // updated values. This is not the final type check.
                if (typeof originalValue === 'number' || typeof originalValue === 'boolean') {
                    try {
                        value = JSON.parse(value);
                    } catch (e) {
                        // Incorrect types are handled by API and user feedback created from that response. Don't need
                        // to handle that here.
                    }
                } else if (Iterable.isIterable(originalValue) && !List.isList(originalValue)) {
                    originalValue = originalValue.get('value');
                }

                // If col is a multi-value column, compare all values for changes
                if ((List.isList(originalValue) || originalValue === undefined) && Array.isArray(value)) {
                    if (
                        (originalValue?.size ?? 0) !== value.length ||
                        (originalValue &&
                            originalValue?.findIndex(
                                o => value.indexOf(o.value) === -1 && value.indexOf(o.displayValue) === -1
                            ) !== -1)
                    ) {
                        row[key] = value;
                    }
                } else if (!(originalValue == undefined && value == undefined) && originalValue !== value) {
                    // - only update if the value has changed
                    // - if the value is 'undefined', it will be removed from the update rows, so in order to
                    // erase an existing value we set the value to null in our update data

                    // Issue 44398: match JSON dateTime format provided by LK server when submitting date values back for insert/update
                    // Issue 45140: use QueryColumn date format for parseDate()
                    row[key] =
                        (isDate ? getJsonDateTimeFormatString(parseDate(value, getColDateFormat(col))) : value) ?? null;
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

export function isInteger(value: number | string): boolean {
    const intValue = parseScientificInt(value);

    return !isNaN(intValue) && intValue == Number(value);
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

// works with string that might contain Scientific Notation
export function parseScientificInt(value: any): number {
    if (value == null) return undefined;

    const valueStr: string = String(value).trim();
    if (!valueStr) return undefined;

    if (isNaN(Number(valueStr))) return NaN;

    const valueLocaleStr = Number(valueStr).toLocaleString('fullwide', { useGrouping: false });

    return parseInt(valueLocaleStr, 10);
}

function getFileExtensionType(value: string): string {
    const parts = value.split('.');
    return parts[parts.length - 1].toLowerCase();
}

export function isImage(value): boolean {
    const validImageExtensions = ['jpg', 'jpeg', 'bmp', 'gif', 'ico', 'png', 'svg', 'tif'];
    const extensionType = getFileExtensionType(value);
    return validImageExtensions.indexOf(extensionType) > -1;
}

export function downloadAttachment(href: string, openInTab?: boolean, fileName?: string): void {
    if (openInTab) {
        window.open(href, '_blank', 'noopener,noreferrer');
    } else {
        const link = document.createElement('a');
        link.href = href;
        link.download = fileName;
        link.click();
    }
}

// copied from platform/api/src/org/labkey/api/attachments/Attachment.java
const EXTENSION_FONT_CLS_MAP = {
    '7z': 'fa fa-file-archive-o',
    audio: 'fa fa-file-audio-o',
    csv: 'fa fa-file-text-o',
    dll: 'fa fa-file-code-o',
    doc: 'fa fa-file-word-o',
    docm: 'fa fa-file-word-o',
    docx: 'fa fa-file-word-o',
    dotm: 'fa fa-file-word-o',
    dotx: 'fa fa-file-word-o',
    exe: 'fa fa-file-code-o',
    folder: 'fa fa-folder-o',
    gz: 'fa fa-file-archive-o',
    html: 'fa fa-file-code-o',
    image: 'fa fa-file-image-o',
    iqy: 'fa fa-file-code-o',
    jar: 'fa fa-file-archive-o',
    json: 'fa fa-file-code-o',
    log: 'fa fa-file-text-o',
    pdf: 'fa fa-file-pdf-o',
    potm: 'fa fa-file-powerpoint-o',
    potx: 'fa fa-file-powerpoint-o',
    ppsm: 'fa fa-file-powerpoint-o',
    ppsx: 'fa fa-file-powerpoint-o',
    ppt: 'fa fa-file-powerpoint-o',
    pptm: 'fa fa-file-powerpoint-o',
    pptx: 'fa fa-file-powerpoint-o',
    prg: 'fa fa-file-code-o',
    r: 'fa fa-file-code-o',
    rtf: 'fa fa-file-word-o',
    sql: 'fa fa-file-code-o',
    tar: 'fa fa-file-archive-o',
    text: 'fa fa-file-text-o',
    tgz: 'fa fa-file-archive-o',
    tsv: 'fa fa-file-text-o',
    txt: 'fa fa-file-text-o',
    video: 'fa fa-file-video-o',
    vsd: 'fa fa-file-image-o',
    wiki: 'fa fa-file-code-o',
    xar: 'fa fa-file-archive-o',
    xls: 'fa fa-file-excel-o',
    xlsb: 'fa fa-file-excel-o',
    xlsm: 'fa fa-file-excel-o',
    xlsx: 'fa fa-file-excel-o',
    xltm: 'fa fa-file-excel-o',
    xltx: 'fa fa-file-excel-o',
    xml: 'fa fa-file-code-o',
    zip: 'fa fa-file-archive-o',
};

export function getIconFontCls(value: string): string {
    if (!value) {
        return undefined;
    }

    const extensionType = getFileExtensionType(value);
    if (EXTENSION_FONT_CLS_MAP[extensionType]) {
        return EXTENSION_FONT_CLS_MAP[extensionType];
    }

    return isImage(value) ? 'fa fa-file-image-o' : 'fa fa-file-o';
}

/**
 * Formats number of bytes into a human readable string.
 * Example:
 * ```
 * formatBytes(1024);       // 1 KB
 * formatBytes('1024');     // 1 KB
 * formatBytes(1234);       // 1.21 KB
 * formatBytes(1234, 3);    // 1.205 KB
 * ```
 * https://stackoverflow.com/a/18650828
 */
export function formatBytes(bytes: number, decimals = 2): string {
    if (bytes === undefined || bytes === null) return 'Size unknown';
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Handles Ajax.request() failures. Calls the passed in "reject" handler with the error
 * from the request as determined by Utils.getCallbackWrapper(). The "reject" parameter can be a normal function
 * or a rejection handler for a Promise. If a response status code is available, then it will append that value
 * to the error object as "status".
 * Example:
 * ```
 * import { Ajax } from '@labkey/api';
 *
 * new Promise((resolve, reject) => {
 *     return Ajax.request({
 *         // ... url, success handler, etc
 *         failure: handleRequestFailure(reject, 'This optional message is logged to console.error'),
 *     });
 * });
 * ```
 */
export function handleRequestFailure(reject: (error: any) => void, logMsg?: string) {
    return Utils.getCallbackWrapper(
        (error, response) => {
            // Appends the response's status code to the error object
            const errorWithStatus = { ...error, status: response?.status };
            if (logMsg) {
                console.error(logMsg, errorWithStatus);
            }
            reject(errorWithStatus);
        },
        undefined,
        true
    );
}

/**
 * Given an array of 1-based ordinals, which may have gaps in them (e.g., [1, 3, 4, 6]) and an
 * array of ordered values, extract the ordered values that correspond to the gaps in
 * the ordinals (e.g., values[1], values[4]).
 * @param ordinals the 1-based ordinal list, possibly with gaps
 * @param orderedValues The ordered values to extract the missing values from
 */
export function findMissingValues(ordinals: number[], orderedValues: any[]): any[] {
    let index = 0;
    let oIndex = 0;
    const missingValues = [];
    while (index < orderedValues.length) {
        if (oIndex >= ordinals.length || ordinals[oIndex] !== index + 1) {
            missingValues.push(orderedValues[index]);
        } else {
            oIndex++;
        }
        index++;
    }
    return missingValues;
}

// Helper that handles grabbing a files array from an HTMLInput ChangeEvent, use this to reduce boilerplate when
// handling events for file inputs.
export const handleFileInputChange = (
    callback: (files: File[]) => void
): ((evt: ChangeEvent<HTMLInputElement>) => void) => {
    return (evt: ChangeEvent<HTMLInputElement>): void => {
        if (evt.currentTarget.files.length > 0) {
            callback(Array.from(evt.currentTarget.files));
        }
    };
};


export function parseCsvString(value: string, delimiter: string, removeQuotes?: boolean) : string[]
{
    if (delimiter === '"')
        throw "Unsupported delimiter: " + delimiter;

    if (!delimiter)
        return undefined;

    if (value == null)
        return undefined;

    let start = 0;
    let parsedValues = [];
    while (start < value.length) {
        let end;
        let ch = value[start];
        if (ch === delimiter) { // empty string case
            end = start;
            parsedValues.push("");
        } else if (ch === '"') { // starting a quoted value
            end = start;
            while (true) { // find the end of the quoted value
                end = value.indexOf('"', end+1);
                if (end === -1) { // no ending quote
                    end = value.length;
                    break;
                }
                if (end === value.length -1 || value[end + 1] !== '"') { // end quote at end of string or without double quote
                    break;
                }
                end++; // skip double ""
            }
            let parsedValue = removeQuotes ?  value.substring(start+1, end) : value.substring(start, end+1) ; // start is at the quote
            if (removeQuotes && parsedValue.indexOf('""') !== -1) {
                parsedValue = parsedValue.replace(/""/g, '"');
            }
            parsedValues.push(parsedValue);
            end++; // get past the last "
        }
        else {
            end = value.indexOf(delimiter, start);
            if (end === -1)
                end = value.length;
            parsedValues.push(value.substring(start, end))

        }
        start = end + delimiter.length;
    }
    return parsedValues;
}

export function quoteValueWithDelimiters(value: any, delimiter: string) {
    if (!value || !Utils.isString(value)) {
        return value;
    }
    if (!delimiter) {
        throw "Delimiter is required.";
    }
    if (value.indexOf(delimiter) === -1)
        return value; // nothing to do for a string that doesn't contain the delimiter
    if (value.indexOf('"') !== -1) {
        value = value.replace(/"/g, '""');
    }
    return '"' + value + '"';
}
