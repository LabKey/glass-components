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
import { List, Map, Set } from 'immutable'
import { Utils } from '@labkey/api'

import { SchemaQuery, User } from '../components/base/models/model'
import { hasParameter, toggleParameter } from '../url/ActionURL'

const emptyList = List<string>();

// 36009: Case-insensitive variant of QueryKey.decodePart
export function decodePart(s: string): string {
    return s.replace(/\$P/ig, '.')
        .replace(/\$C/ig, ',')
        .replace(/\$T/ig, '~')
        .replace(/\$B/ig, '}')
        .replace(/\$A/ig, '&')
        .replace(/\$S/ig, '/')
        .replace(/\$D/ig, '$');
}

// 36009: Case-insensitive variant of QueryKey.encodePart
export function encodePart(s: string): string {
    return s.replace(/\$/ig, '$D')
        .replace(/\//ig, '$S')
        .replace(/\&/ig, '$A')
        .replace(/\}/ig, '$B')
        .replace(/\~/ig, '$T')
        .replace(/\,/ig, '$C')
        .replace(/\./ig, '$P');
}

export function resolveKey(schema: string, query: string): string {
    return [encodePart(schema), encodePart(query)].join('/').toLowerCase();
}

export function resolveKeyFromJson(json: {schemaName: Array<string>, queryName: string}): string {
    return resolveKey(json.schemaName.join('.'), json.queryName);
}

export function resolveSchemaQuery(schemaQuery: SchemaQuery): string {
    return schemaQuery ? resolveKey(schemaQuery.getSchema(), schemaQuery.getQuery()) : null;
}

export function getSchemaQuery(encodedKey: string): SchemaQuery {
    const [ encodedSchema, encodedQuery ] = encodedKey.split('/');
    return SchemaQuery.create(decodePart(encodedSchema), decodePart(encodedQuery));
}

/**
 * Compares two string objects for doing alphanumeric (natural) sorting.
 * Returns a positive number if the first string comes after the second in a natural sort; 0 if they are equal
 * and a negative number if the second comes after the first.
 * @param aso
 * @param bso
 */
export function naturalSort(aso: string, bso: string): number {
    // http://stackoverflow.com/questions/19247495/alphanumeric-sorting-an-array-in-javascript
    if (aso === bso) return 0;
    if (aso === undefined || aso === null || aso === '') return 1;
    if (bso === undefined || bso === null || bso === '') return -1;

    let a, b, a1, b1, i = 0, n, L,
        rx=/(\.\d+)|(\d+(\.\d+)?)|([^\d.]+)|(\.\D+)|(\.$)/g;

    a = aso.toString().toLowerCase().match(rx);
    b = bso.toString().toLowerCase().match(rx);

    L = a.length;
    while (i < L) {
        if (!b[i]) return 1;
        a1 = a[i]; b1 = b[i++];
        if (a1 !== b1) {
            n = a1 - b1;
            if (!isNaN(n)) return n;
            return a1 > b1 ? 1 : -1;
        }
    }
    return b[i] ? -1 : 0;
}

// Case insensitive Object reference. Returns undefined if either object or prop does not resolve.
// If both casings exist (e.g. 'x' and 'X' are props) then either value may be returned.
export function caseInsensitive(obj: Object, prop: string): any {
    if (obj === undefined || obj === null) {
        return undefined;
    }

    if (Utils.isString(prop)) {
        const lower = prop.toLowerCase();

        for (let p in obj) {
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
        return [value.substr(0,1).toUpperCase(), value.substr(1)].join('');
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

function toLowerReducer(s: Set<string>, v: string) {
    if (typeof v === 'string') {
        s.add(v.toLowerCase());
    }
    return s;
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

export function toggleDevTools() {
    if (LABKEY.devMode) {
        toggleParameter(DEV_TOOLS_URL_PARAMETER, 1);
    }
}

let DOM_COUNT = 0;
const DOM_PREFIX = 'labkey-app-';

// Only exported to use with tests. Don't use this anywhere else. This is needed so we can use it in beforeEach for jest
// snapshot tests. This way a snapshot will be identical when run as part of a test suite or run individually.
export function TESTS_ONLY_RESET_DOM_COUNT() {
    DOM_COUNT = 0;
}

// Generate an id with a dom-unique integer suffix
export function generateId(prefix?: string): string {
    return (prefix ? prefix : DOM_PREFIX) + DOM_COUNT++;
}

// http://davidwalsh.name/javascript-debounce-function
export function debounce(func, wait, immediate?: boolean) {
    let timeout: number;
    return function () {
        const context = this, args = arguments;
        const later = function () {
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
 * Determines if a user has all of the permissions given.  If the user has only some
 * of these permissions, returns false.
 * @param user the user in question
 * @param perms the list of permission strings (See models/constants
 */
export function hasAllPermissions(user: User, perms: Array<string>): boolean {

    let allow = false;

    if (perms) {
        const allPerms = user.get('permissionsList');

        let hasAll = true;
        for (let i=0; i < perms.length; i++) {
            if (allPerms.indexOf(perms[i]) === -1) {
                hasAll = false;
                break;
            }
        }
        allow = hasAll || user.isAdmin;
    }

    return allow;
}

export function contains(s: string, token: string, caseSensitive?: boolean): boolean {
    return indexOf(s, token, caseSensitive) > -1;
}

export function hasPrefix(s: string, prefix: string, caseSensitive?: boolean): boolean {
    return indexOf(s, prefix, caseSensitive) === 0;
}

function indexOf(source: string, token: string, caseSensitive?: boolean): number {
    if (!source || !token) return -1;

    const ss = caseSensitive === true ? source : source.toLowerCase();
    const tt = caseSensitive === true ? token : token.toLowerCase();

    return ss.indexOf(tt);
}

export function similaritySortFactory(token: string, caseSensitive?: boolean): (rawA: any, rawB: any) => number {
    if (!token) return naturalSort;

    // Derived from https://stackoverflow.com/a/47132167
    return (rawA, rawB) => {
        if (!rawA) return 1;
        if (!rawB) return -1;

        const a = caseSensitive === true ? rawA : rawA.toLowerCase();
        const b = caseSensitive === true ? rawB : rawB.toLowerCase();

        if (a === b) return 0;
        if (a === token && b !== token) return -1;

        const ahp = hasPrefix(a, token, caseSensitive);
        const bhp = hasPrefix(b, token, caseSensitive);

        if (ahp && !bhp) return -1;
        if (!ahp && bhp) return 1;
        if (ahp && bhp) return naturalSort(rawA, rawB);

        const ac = contains(a, token, caseSensitive);
        const bc = contains(b, token, caseSensitive);

        if (ac && !bc) return -1;
        if (!ac && bc) return 1;

        return naturalSort(rawA, rawB);
    };
}

/**
 * Performs an equality check on two arrays, returning true of the arrays are the same size
 *
 * @param array1
 * @param array2
 */
export function unorderedEqual(array1: Array<any>, array2: Array<any>) : boolean {
    if (array1.length !== array2.length)
        return false;

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
export function valueIsEmpty(value) : boolean {
    if (!value)
        return true;
    if (typeof value === 'string' && value === '')
        return true;
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
export function getCommonDataValues(data: Map<string, any>) : any {
    let valueMap = Map<string, any>();  // map from fields to the value shared by all rows
    let fieldsInConflict = Set<string>();
    let emptyFields = Set<string>(); // those fields that are empty
    data.map((rowData, id) => {
        // const rowData = data.get(id);
        if (rowData) {
            rowData.forEach((data, key) => {
                if (data && !fieldsInConflict.has(key)) { // skip fields that are already in conflict
                    const value = data.get('value');
                    const currentValueEmpty = valueIsEmpty(value);
                    const havePreviousValue = valueMap.has(key);
                    const arrayNotEqual = Array.isArray(value) && (!Array.isArray(valueMap.get(key)) || !unorderedEqual(valueMap.get(key), value));

                    if (!currentValueEmpty) { // non-empty value, so let's see if we have the same value
                        if (emptyFields.contains(key)) {
                            fieldsInConflict = fieldsInConflict.add(key);
                        }
                        else if (!havePreviousValue) {
                            valueMap = valueMap.set(key, value);
                        }
                        if (arrayNotEqual) {
                            fieldsInConflict = fieldsInConflict.add(key);
                            valueMap = valueMap.delete(key);
                        }
                        else if (valueMap.get(key) !== value) {
                            fieldsInConflict = fieldsInConflict.add(key);
                            valueMap = valueMap.delete(key);
                        }
                    }
                    else if (havePreviousValue) { // some row had a value, but this row does not
                        fieldsInConflict = fieldsInConflict.add(key);
                        valueMap = valueMap.delete(key);
                    }
                    else {
                        emptyFields = emptyFields.add(key);
                    }
                }
            });
        }
        else {
            console.error("Unable to find data for selection id " + id);
        }
    });
    return valueMap.toObject();
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
export function getUpdatedData(originalData: Map<string, any>, updatedValues: any, primaryKeys: List<string>) : Array<any> {
    let updateValuesMap = Map<any, any>(updatedValues);
    let updatedData = originalData.map( (originalRowMap) => {
        return originalRowMap.reduce((m, fieldValueMap, key) => {
            if (fieldValueMap && fieldValueMap.has('value')) {
                if (primaryKeys.indexOf(key) > -1) {
                    return m.set(key, fieldValueMap.get('value'));
                }
                else if (updateValuesMap.has(key) && updateValuesMap.get(key) !== fieldValueMap.get('value')) {
                    return m.set(key, updateValuesMap.get(key));
                } else {
                    return m;
                }
            }
            else
                return m;
        }, Map<any, any>());
    });
    // we want the rows that contain more than just the primaryKeys
    return updatedData
        .filter((rowData) => rowData.size > primaryKeys.size)
        .map(rowData => rowData.toJS() )
        .toArray();
}

/**
 * Constructs an array of objects (suitable for the rows parameter of updateRows), where each object contains the
 * values in editorRows that are different from the ones in originalGridData
 *
 * @param originalGridData a map from an id field to a Map from fieldKeys to values
 * @param editorRows An array of Maps from field keys to values
 * @param idField the fieldKey in the editorRow objects that is the id field that is the key for originalGridData
 */
export function getUpdatedDataFromGrid(originalGridData: Map<string, Map<string, any>>, editorRows: Array<Map<string, any>>, idField: string) : Array<any> {
    let updatedRows = [];
    editorRows.forEach((editedRow, index) => {
        let id = editedRow.get(idField);
        let originalRow = originalGridData.get(id.toString());
        if (originalRow) {
            const row = editedRow.reduce((row, value, key) => {
                let originalValue = originalRow.has(key) ? originalRow.get(key) : undefined;
                if (List.isList(originalValue)) {
                    originalValue = originalValue.get(0).value;
                }
                if ((value && !originalValue) || originalValue != value) {
                    // if the value is 'undefined', it will be removed from the update rows, so in order to
                    // erase an existing value, we set the value to null in our update data
                    row[key] = value || null;
                }
                return row;
            }, {});
            if (!Utils.isEmptyObj(row)) {
                row[idField] = id;
                updatedRows.push(row)
            }
        }
        else {
            console.error("Unable to find original row for id " + id);
        }
    });
    return updatedRows;
}
