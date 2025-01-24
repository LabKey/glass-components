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
import { fromJS, List, Map } from 'immutable';

import sampleSet2QueryInfo from '../../../test/data/sampleSet2-getQueryDetails.json';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';

import { STORAGE_UNIQUE_ID_CONCEPT_URI } from '../domainproperties/constants';

import { EditorModel, ValueDescriptor } from './models';
import { genCellKey } from './utils';

const PK_COL = new QueryColumn({
    caption: 'RowId',
    fieldKey: 'rowId',
    name: 'rowId',
    fieldKeyArray: ['rowId'],
    shownInInsertView: false,
    shownInUpdateView: false,
    userEditable: false,
    readOnly: true,
    required: false,
});
const COLUMN_CAN_INSERT_AND_UPDATE = new QueryColumn({
    caption: 'Both',
    fieldKey: 'both',
    name: 'both',
    fieldKeyArray: ['both'],
    shownInInsertView: true,
    shownInUpdateView: true,
    userEditable: true,
    readOnly: false,
    required: true,
});
const COLUMN_CAN_INSERT = new QueryColumn({
    caption: 'Insert',
    fieldKey: 'insert',
    name: 'insert',
    fieldKeyArray: ['insert'],
    shownInInsertView: true,
    shownInUpdateView: false,
    userEditable: true,
    readOnly: false,
    required: true,
});
const COLUMN_CAN_UPDATE = new QueryColumn({
    caption: 'Update',
    fieldKey: 'update',
    name: 'update',
    fieldKeyArray: ['update'],
    shownInInsertView: false,
    shownInUpdateView: true,
    userEditable: true,
    readOnly: false,
});
const COLUMN_CANNOT_INSERT_AND_UPDATE = new QueryColumn({
    caption: 'Neither',
    fieldKey: 'neither',
    name: 'neither',
    fieldKeyArray: ['neither'],
    shownInInsertView: false,
    shownInUpdateView: false,
    userEditable: true,
    readOnly: false,
});
const COLUMN_BARCODE = new QueryColumn({
    name: 'Barcode',
    caption: 'Barcode',
    fieldKey: 'Barcode',
    fieldKeyArray: ['Barcode'],
    shownInInsertView: true,
    userEditable: true,
    required: true,
    conceptURI: STORAGE_UNIQUE_ID_CONCEPT_URI,
});

const QUERY_INFO = QueryInfo.fromJsonForTests({
    pkCols: ['rowId'],
    columns: {
        rowId: PK_COL,
        both: COLUMN_CAN_INSERT_AND_UPDATE,
        insert: COLUMN_CAN_INSERT,
        update: COLUMN_CAN_UPDATE,
        neither: COLUMN_CANNOT_INSERT_AND_UPDATE,
    },
});

const orderedColumns = fromJS(QUERY_INFO.columns.mapValues(col => col.fieldKey.toLowerCase()).sort());
const columnMap = fromJS(
    QUERY_INFO.columns.reduce((result, col, key) => {
        result[key.toLowerCase()] = col;
        return result;
    }, {})
);
const colOneFk = orderedColumns.get(0);
const colOneCaption = columnMap.get(colOneFk).caption;
const colTwoFk = orderedColumns.get(1);
const colTwoCaption = columnMap.get(colTwoFk).caption;
const rowIdFk = 'rowId';
const basicCellValues = fromJS({
    [genCellKey(rowIdFk, 0)]: List([{ display: '0', raw: 0 } as ValueDescriptor]),
    [genCellKey(rowIdFk, 1)]: List([{ display: '1', raw: 1 } as ValueDescriptor]),
    [genCellKey(colOneFk, 0)]: List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
    [genCellKey(colOneFk, 1)]: List([{ display: 'AA', raw: 'aa' } as ValueDescriptor]),
    [genCellKey(colTwoFk, 0)]: List([{ display: 'B', raw: 'b' } as ValueDescriptor]),
    [genCellKey(colTwoFk, 1)]: List([{ display: 'BB', raw: 'bb' } as ValueDescriptor]),
});
const originalQueryData = fromJS({
    '0': {
        [rowIdFk]: { displayValue: '1', value: 0 },
        [colOneFk]: { displayValue: 'A ', value: 'a' },
        [colTwoFk]: { displayValue: 'B ', value: 'b' },
    },
    '1': {
        [rowIdFk]: { displayValue: '2', value: 1 },
        [colOneFk]: { displayValue: 'AA ', value: 'aa' },
        [colTwoFk]: { displayValue: 'BB ', value: 'bb' },
    },
});
const originalData = EditorModel.convertQueryDataToEditorData(originalQueryData);
const basicEditorModel = new EditorModel({
    cellMessages: Map.of(genCellKey(colOneFk, 0), { message: 'a' }, genCellKey(colTwoFk, 1), { message: 'b' }),
    cellValues: basicCellValues,
    columnMap,
    orderedColumns,
    originalData,
    queryInfo: QUERY_INFO,
    rowCount: 2,
});

function modifyEm(changes: Partial<EditorModel>, em?: EditorModel): EditorModel {
    const model = em ?? basicEditorModel;
    return model.applyChanges(changes);
}

describe('EditorModel', () => {
    const queryInfo = QueryInfo.fromJsonForTests(sampleSet2QueryInfo);

    describe('data validation', () => {
        test('no data', () => {
            const editorModel = modifyEm({ cellValues: fromJS({}), rowCount: 0 });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(colOneFk);
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.isEmpty()).toBe(true);
            const errors = editorModel.getValidationErrors('Name');
            expect(errors.errors).toHaveLength(0);
        });

        test('valid data', () => {
            const { uniqueKeyViolations, missingRequired } = basicEditorModel.validateData(colOneFk);
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.isEmpty()).toBe(true);
            const errors = basicEditorModel.getValidationErrors('Name');
            expect(errors.errors).toHaveLength(0);
        });

        test('missing required data', () => {
            const model = modifyEm({
                cellMessages: fromJS({}),
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([]),
                    [genCellKey(colOneFk, 1)]: List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
                    [genCellKey(colOneFk, 2)]: List([{ display: '    ', raw: '    ' } as ValueDescriptor]),
                    [genCellKey(colOneFk, 3)]: List([{ display: '4', raw: 4 } as ValueDescriptor]),
                    [genCellKey(colTwoFk, 0)]: List([{ display: 'asdf', raw: 'asdf' } as ValueDescriptor]),
                    [genCellKey(colTwoFk, 1)]: List([]),
                    [genCellKey(colTwoFk, 2)]: List([{ display: 'asdf', raw: 'asdf' } as ValueDescriptor]),
                    [genCellKey(colTwoFk, 3)]: List([{ display: 'asdf', raw: 'asdf' } as ValueDescriptor]),
                }),
                rowCount: 4,
            });
            const { uniqueKeyViolations, missingRequired } = model.validateData(colOneFk);
            expect(uniqueKeyViolations.isEmpty()).toBe(true);
            expect(missingRequired.size).toBe(2);
            expect(missingRequired.has(colOneCaption)).toBe(true);
            expect(missingRequired.get(colOneCaption).size).toBe(2);
            expect(missingRequired.get(colOneCaption).contains(1)).toBe(true);
            expect(missingRequired.get(colOneCaption).contains(3)).toBe(true); // Check whitespace trimmed
            expect(missingRequired.get(colOneCaption).contains(4)).toBe(false); // Check integer
            const errors = model.getValidationErrors(colOneFk);
            expect(errors.cellMessages.toJS()).toStrictEqual({
                [genCellKey(colOneFk, 0)]: {
                    message: `${colOneCaption} is required.`,
                },
                [genCellKey(colOneFk, 2)]: {
                    message: `${colOneCaption} is required.`,
                },
                [genCellKey(colTwoFk, 1)]: {
                    message: `${colTwoCaption} is required.`,
                },
            });
            expect(errors.errors).toEqual([
                `${colOneCaption} is missing from rows 1, 3. ${colTwoCaption} is missing from row 2.`,
            ]);
        });

        test('generated unique id not counted for missing required check', () => {
            const editorModel = modifyEm({
                cellValues: fromJS({
                    [genCellKey('barcode', 0)]: List([{ display: null, raw: null }]),
                }),
                columnMap: fromJS({ barcode: COLUMN_BARCODE }),
                orderedColumns: fromJS(['barcode']),
                rowCount: 1,
            });
            const { missingRequired } = editorModel.validateData('Barcode');
            expect(missingRequired.size).toBe(0);
        });

        test('unique key violations', () => {
            const editorModel = modifyEm({
                orderedColumns: fromJS([colOneFk.toLowerCase()]),
                columnMap: fromJS({ [colOneFk.toLowerCase()]: COLUMN_CAN_INSERT_AND_UPDATE }),
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
                    [genCellKey(colOneFk, 1)]: List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
                    [genCellKey(colOneFk, 2)]: List([
                        { display: 'caseInSenSiTive', raw: 'caseInSenSiTive' } as ValueDescriptor,
                    ]),
                    [genCellKey(colOneFk, 3)]: List([
                        { display: 'CaseInsensItive', raw: 'CaseInsensItive' } as ValueDescriptor,
                    ]),
                    [genCellKey(colOneFk, 4)]: List([
                        { display: ' spaceDupe ', raw: ' spaceDupe \n' } as ValueDescriptor,
                    ]),
                    [genCellKey(colOneFk, 5)]: List([{ display: 'spaceDupe', raw: '\tspaceDupe' } as ValueDescriptor]),
                }),
                rowCount: 6,
            });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(colOneFk);
            expect(missingRequired.isEmpty()).toBe(true);
            expect(uniqueKeyViolations.size).toBe(1);
            expect(uniqueKeyViolations.has(colOneCaption)).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).size).toBe(3);
            expect(uniqueKeyViolations.get(colOneCaption).has('a')).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).get('a')).toEqual(List<number>([1, 2]));
            expect(uniqueKeyViolations.get(colOneCaption).has('caseinsensitive')).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).get('caseinsensitive')).toEqual(List<number>([3, 4]));
            expect(uniqueKeyViolations.get(colOneCaption).has('spacedupe')).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).get('spacedupe')).toEqual(List<number>([5, 6]));
            const errors = editorModel.getValidationErrors(colOneFk);
            expect(errors.errors).toEqual([
                `Duplicate value (a) for ${colOneCaption} on rows 1, 2.`,
                `Duplicate value (caseinsensitive) for ${colOneCaption} on rows 3, 4.`,
                `Duplicate value (spacedupe) for ${colOneCaption} on rows 5, 6.`,
            ]);
        });

        test('missing required and unique key violations', () => {
            const editorModel = modifyEm({
                cellMessages: fromJS({}),
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([{ display: null, raw: null } as ValueDescriptor]),
                    [genCellKey(colOneFk, 1)]: List([{ display: 'A', raw: 'a' } as ValueDescriptor]),
                    [genCellKey(colOneFk, 2)]: List([
                        { display: 'caseInSenSiTive', raw: 'caseInSenSiTive' } as ValueDescriptor,
                    ]),
                    [genCellKey(colOneFk, 3)]: List([
                        { display: 'CaseInsensItive', raw: 'CaseInsensItive' } as ValueDescriptor,
                    ]),
                }),
                columnMap: fromJS({ [colOneFk.toLowerCase()]: COLUMN_CAN_INSERT_AND_UPDATE }),
                orderedColumns: fromJS([colOneFk.toLowerCase()]),
                rowCount: 4,
            });
            const { uniqueKeyViolations, missingRequired } = editorModel.validateData(colOneFk);
            expect(missingRequired.size).toBe(1);
            expect(missingRequired.has(colOneCaption)).toBe(true);
            expect(missingRequired.get(colOneCaption).size).toBe(1);
            expect(missingRequired.get(colOneCaption).contains(1)).toBe(true);

            expect(uniqueKeyViolations.size).toBe(1);
            expect(uniqueKeyViolations.has(colOneCaption)).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).size).toBe(1);
            expect(uniqueKeyViolations.get(colOneCaption).has('caseinsensitive')).toBe(true);
            expect(uniqueKeyViolations.get(colOneCaption).get('caseinsensitive')).toEqual(List<number>([3, 4]));
            const errors = editorModel.getValidationErrors(colOneFk);
            expect(errors.errors).toEqual([
                `Duplicate value (caseinsensitive) for ${colOneCaption} on rows 3, 4.`,
                `${colOneCaption} is missing from row 1.`,
            ]);
            expect(errors.cellMessages.toJS()).toStrictEqual({
                [genCellKey(colOneFk, 0)]: { message: `${colOneCaption} is required.` },
            });
        });

        test('getEditorDataFromQueryValueMap with displayValue', () => {
            const data = Map<any, any>({
                value: 1,
                displayValue: 'one',
            });
            expect(EditorModel.getEditorDataFromQueryValueMap(data)).toStrictEqual(
                List<any>([{ displayValue: 'one', value: 1 }])
            );
        });

        test('getEditorDataFromQueryValueMap without displayValue', () => {
            const data = Map<any, any>({
                value: 'blue',
            });
            expect(EditorModel.getEditorDataFromQueryValueMap(data)).toEqual('blue');
        });

        test('getEditorDataFromQueryValueMap without value', () => {
            const data = Map<any, any>({
                color: 'blue',
                displayValue: 'blue',
            });
            expect(EditorModel.getEditorDataFromQueryValueMap(data)).toEqual(undefined);
        });

        test('convertQueryDataToEditorData with updates', () => {
            const queryData = fromJS({
                1: {
                    noValue: {
                        color: 'blue',
                        displayValue: 'blue',
                    },
                    withValue: {
                        value: 'orange',
                        ignoreMe: 'nothing to see',
                    },
                    'withDisplay/Value': {
                        value: 'b',
                        displayValue: 'blue',
                        otherField: 'irrelevant',
                    },
                    doNotChangeMe: {
                        value: 'fred',
                    },
                },
                2: {
                    noValue: {
                        color: 'blue',
                        displayValue: 'blue',
                    },
                    withValue: {
                        value: 'orangish',
                        ignoreMe: 'nothing to see',
                    },
                    'withDisplay/Value': {
                        value: 'b',
                        displayValue: 'black',
                        otherField: 'irrelevant',
                    },
                    doNotChangeMe: {
                        value: 'maroon',
                    },
                },
            });
            const updates = Map<any, any>({
                withValue: 'purple',
                withDisplay$SValue: 'teal',
            });
            const result = EditorModel.convertQueryDataToEditorData(queryData, updates);
            expect(result).toStrictEqual(
                Map<string, any>({
                    1: Map<string, any>({
                        withValue: 'purple',
                        withDisplay$SValue: 'teal',
                        doNotChangeMe: 'fred',
                    }),
                    2: Map<string, any>({
                        withValue: 'purple',
                        withDisplay$SValue: 'teal',
                        doNotChangeMe: 'maroon',
                    }),
                })
            );
        });

        test('convertQueryDataToEditorData without updates', () => {
            const queryData = fromJS({
                1: {
                    noValue: {
                        color: 'blue',
                        displayValue: 'blue',
                    },
                    withValue: {
                        value: 'orange',
                        ignoreMe: 'nothing to see',
                    },
                    withDisplayValue: {
                        value: 'b',
                        displayValue: 'blue',
                        otherField: 'irrelevant',
                    },
                    doNotChangeMe: {
                        value: 'fred',
                    },
                },
                2: {
                    noValue: {
                        color: 'blue',
                        displayValue: 'blue',
                    },
                    withValue: {
                        value: 'orangish',
                        ignoreMe: 'nothing to see',
                    },
                    withDisplayValue: {
                        value: 'b',
                        displayValue: 'black',
                        otherField: 'irrelevant',
                    },
                    doNotChangeMe: {
                        value: 'maroon',
                    },
                },
            });
            expect(EditorModel.convertQueryDataToEditorData(queryData)).toStrictEqual(
                Map<string, any>({
                    1: Map<string, any>({
                        withValue: 'orange',
                        withDisplayValue: List.of({
                            value: 'b',
                            displayValue: 'blue',
                        }),
                        doNotChangeMe: 'fred',
                    }),
                    2: Map<string, any>({
                        withValue: 'orangish',
                        withDisplayValue: List.of({
                            displayValue: 'black',
                            value: 'b',
                        }),
                        doNotChangeMe: 'maroon',
                    }),
                })
            );
        });

        test('convertQueryModelDataToGridResponse', () => {
            // Arrange
            const rows = {
                1: {
                    'withLookup/Value': {
                        displayValue: 'foo',
                        value: 1,
                    },
                    withValue: {
                        value: 'orange',
                        ignoreMe: 'nothing to see',
                    },
                },
                2: {
                    'withLookup/Value': {
                        displayValue: 'bar',
                        value: 2,
                    },
                    withValue: {
                        value: 'purple',
                        ignoreMe: 'nothing to see',
                    },
                },
            };
            const orderedRowKeys = Object.keys(rows).sort();
            const queryModel = makeTestQueryModel(queryInfo.schemaQuery, queryInfo, rows, orderedRowKeys);

            // Act
            const gridResponse = EditorModel.convertQueryModelDataToGridResponse(queryModel);

            // Assert
            expect(gridResponse.data).toStrictEqual(
                Map<number, any>({
                    1: Map<string, any>({
                        'withLookup/Value': List.of({ displayValue: 'foo', value: 1 }),
                        withValue: 'orange',
                    }),
                    2: Map<string, any>({
                        'withLookup/Value': List.of({ displayValue: 'bar', value: 2 }),
                        withValue: 'purple',
                    }),
                })
            );

            expect(gridResponse.dataIds).toStrictEqual(List.of(...orderedRowKeys));
        });
    });

    describe('getUpdatedData', () => {
        test('no changes', () => {
            const updatedRows = basicEditorModel.getUpdatedData();
            expect(updatedRows).toHaveLength(0);
        });
        test('row value updated', () => {
            const cellKey = genCellKey(colOneFk, 0);
            const value = List([{ display: 'Changed', raw: 'changed' } as ValueDescriptor]);
            const model = basicEditorModel.merge({
                cellValues: basicEditorModel.cellValues.set(cellKey, value),
            }) as EditorModel;
            const updatedRows = model.getUpdatedData();
            expect(updatedRows).toHaveLength(1);
            expect(updatedRows[0][colOneFk]).toEqual('changed');
        });
        test('row value removed', () => {
            const cellKey = genCellKey(colOneFk, 0);
            const value = List([{ display: undefined, raw: undefined } as ValueDescriptor]);
            const model = basicEditorModel.merge({
                cellValues: basicEditorModel.cellValues.set(cellKey, value),
            }) as EditorModel;
            const updatedRows = model.getUpdatedData();
            expect(updatedRows).toHaveLength(1);
            // Undefined values get coerced to null so our server will acknowledge the deletion
            expect(updatedRows[0][colOneFk]).toEqual(null);
        });
        test('external originalData', () => {
            const altOriginalData = fromJS({
                '0': {
                    [rowIdFk]: { displayValue: '1', value: 0 },
                    [colOneFk]: { displayValue: 'actual original ', value: 'actual original' },
                    [colTwoFk]: { displayValue: 'B ', value: 'b' },
                },
                '1': {
                    [rowIdFk]: { displayValue: '2', value: 1 },
                    [colOneFk]: { displayValue: 'AA ', value: 'aa' },
                    [colTwoFk]: { displayValue: 'BB ', value: 'bb' },
                },
            });
            const updatedRows = basicEditorModel.getUpdatedData(altOriginalData);
            expect(updatedRows).toHaveLength(1);
            expect(updatedRows[0][colOneFk]).toEqual('a');
        });
        test('all rows updated', () => {
            const value = List([{ display: 'Changed', raw: 'changed' } as ValueDescriptor]);
            let cellValues = basicEditorModel.cellValues.set(genCellKey(colOneFk, 0), value);
            cellValues = cellValues.set(genCellKey(colOneFk, 1), value);
            const model = basicEditorModel.merge({ cellValues }) as EditorModel;
            const updatedRows = model.getUpdatedData();
            expect(updatedRows).toHaveLength(2);
            expect(updatedRows[0][colOneFk]).toEqual('changed');
            expect(updatedRows[1][colOneFk]).toEqual('changed');
        });
        test('MVFK (array) value updated', () => {
            const fk = 'mvfk';
            const mvfkCol = new QueryColumn({
                name: 'mvfk',
                caption: 'mvfk',
                fieldKey: fk,
                fieldKeyArray: ['mvfk'],
                shownInInsertView: true,
                userEditable: true,
                lookup: { queryName: 'lookupQuery', schemaName: 'lookupSchema', multiValued: 'junction' },
            });
            let originalData = basicEditorModel.originalData.setIn(
                ['0', 'mvfk'],
                List([{ displayValue: undefined, value: undefined }])
            );
            originalData = originalData.setIn(
                ['1', 'mvfk'],
                List([
                    {
                        displayValue: 'Value 123',
                        value: 123,
                    },
                    {
                        displayValue: 'Value 321',
                        value: 321,
                    },
                ])
            );
            originalData = originalData.setIn(
                ['2', 'mvfk'],
                List([
                    {
                        displayValue: 'Value 123',
                        value: 123,
                    },
                    {
                        displayValue: 'Value 321',
                        value: 321,
                    },
                ])
            );
            // Values added to cell
            let cellValues = basicEditorModel.cellValues.set(
                genCellKey(mvfkCol.fieldKey.toLowerCase(), 0),
                List([
                    {
                        raw: 123,
                        display: 'Value 123',
                    },
                    {
                        raw: 321,
                        display: 'Value 321',
                    },
                ])
            );
            // All values removed from cell
            cellValues.set(genCellKey(mvfkCol.fieldKey.toLowerCase(), 1), List());
            // Single value removed from cell
            cellValues = cellValues.set(
                genCellKey(mvfkCol.fieldKey.toLowerCase(), 2),
                List([
                    {
                        raw: 123,
                        display: 'Value 123',
                    },
                ])
            );
            cellValues = cellValues.set(genCellKey(rowIdFk.toLowerCase(), 2), List([{ raw: 2, display: '2' }]));
            const em = modifyEm({
                columnMap: basicEditorModel.columnMap.set(fk, mvfkCol),
                orderedColumns: basicEditorModel.orderedColumns.push(fk),
                originalData,
                cellValues,
                rowCount: 3,
            });
            const updatedRows = em.getUpdatedData();
            // Added values should be an array
            expect(updatedRows[0][fk]).toEqual([123, 321]);
            // Cleared values should result in an empty array
            expect(updatedRows[1][fk]).toEqual([]);
            // Removed value should not be present in array
            expect(updatedRows[2][fk]).toEqual([123]);
        });
        test('lookup value updated', () => {
            const lookupCol = new QueryColumn({
                name: 'lookup',
                caption: 'lookup',
                fieldKey: 'lookup',
                fieldKeyArray: ['lookup'],
                shownInInsertView: true,
                userEditable: true,
                lookup: { queryName: 'lookupQuery', schemaName: 'lookupSchema' },
            });
            const em = modifyEm({
                columnMap: basicEditorModel.columnMap.set(lookupCol.fieldKey, lookupCol),
                orderedColumns: basicEditorModel.orderedColumns.push(lookupCol.fieldKey),
                originalData: basicEditorModel.originalData.setIn(
                    [0, lookupCol.fieldKey],
                    List([{ value: 456, displayValue: 'Value 456' }])
                ),
                cellValues: basicEditorModel.cellValues.set(
                    genCellKey('lookup', 0),
                    List([
                        {
                            raw: 123,
                            display: 'Value 123',
                        },
                    ])
                ),
            });
            const updatedRows = em.getUpdatedData();
            // ExpInput columns should be converted to comma separated string values
            expect(updatedRows[0][lookupCol.fieldKey]).toEqual('Value 123');
        });
        test('readOnly column should be excluded', () => {
            const lookupCol = new QueryColumn({
                name: 'lookup',
                caption: 'lookup',
                fieldKey: 'lookup',
                fieldKeyArray: ['lookup'],
                readOnly: true,
                shownInInsertView: true,
                userEditable: true,
                lookup: { queryName: 'lookupQuery', schemaName: 'lookupSchema' },
            });
            const em = modifyEm({
                columnMap: basicEditorModel.columnMap.set(lookupCol.fieldKey, lookupCol),
                orderedColumns: basicEditorModel.orderedColumns.push(lookupCol.fieldKey),
                originalData: basicEditorModel.originalData.setIn(
                    [0, lookupCol.fieldKey],
                    List([{ value: 456, displayValue: 'Value 456' }])
                ),
                cellValues: basicEditorModel.cellValues.set(
                    genCellKey('lookup', 0),
                    List([
                        {
                            raw: 123,
                            display: 'Value 123',
                        },
                    ])
                ),
            });
            const updatedRows = em.getUpdatedData();
            expect(updatedRows).toHaveLength(0);
        });
        test('non-userEditable column should be excluded', () => {
            const lookupCol = new QueryColumn({
                name: 'lookup',
                caption: 'lookup',
                fieldKey: 'lookup',
                fieldKeyArray: ['lookup'],
                shownInInsertView: true,
                userEditable: false,
                lookup: { queryName: 'lookupQuery', schemaName: 'lookupSchema' },
            });
            const em = modifyEm({
                columnMap: basicEditorModel.columnMap.set(lookupCol.fieldKey, lookupCol),
                orderedColumns: basicEditorModel.orderedColumns.push(lookupCol.fieldKey),
                originalData: basicEditorModel.originalData.setIn(
                    [0, lookupCol.fieldKey],
                    List([{ value: 456, displayValue: 'Value 456' }])
                ),
                cellValues: basicEditorModel.cellValues.set(
                    genCellKey('lookup', 0),
                    List([
                        {
                            raw: 123,
                            display: 'Value 123',
                        },
                    ])
                ),
            });
            const updatedRows = em.getUpdatedData();
            expect(updatedRows).toHaveLength(0);
        });
        test('expInput value updated', () => {
            const materialInputs = QueryColumn.MATERIAL_INPUTS.toLowerCase();
            const expInputCol = new QueryColumn({
                name: `${materialInputs}/input`,
                caption: 'input',
                fieldKey: `${materialInputs}/input`,
                fieldKeyArray: [materialInputs, 'input'],
                shownInInsertView: true,
                userEditable: true,
                lookup: { queryName: 'lookupQuery', schemaName: 'lookupSchema' },
            });
            const em = modifyEm({
                columnMap: basicEditorModel.columnMap.set(expInputCol.fieldKey.toLowerCase(), expInputCol),
                orderedColumns: basicEditorModel.orderedColumns.push(expInputCol.fieldKey.toLowerCase()),
                cellValues: basicEditorModel.cellValues.set(
                    genCellKey(expInputCol.fieldKey.toLowerCase(), 0),
                    List([
                        {
                            raw: 123,
                            display: 'Value 123',
                        },
                        {
                            raw: 321,
                            display: 'Value 321',
                        },
                    ])
                ),
            });
            const updatedRows = em.getUpdatedData();
            // ExpInput columns should be converted to comma separated string values
            expect(updatedRows[0][expInputCol.fieldKey.toLowerCase()]).toEqual('Value 123, Value 321');
        });
        test('altUpdateKeys', () => {
            const queryInfo = basicEditorModel.queryInfo.mutate({ altUpdateKeys: new Set([colTwoFk]) });
            const cellKey = genCellKey(colOneFk, 0);
            const value = List([{ display: 'Changed', raw: 'changed' } as ValueDescriptor]);
            const model = modifyEm({
                cellValues: basicEditorModel.cellValues.set(cellKey, value),
                queryInfo,
            });
            const updatedRows = model.getUpdatedData();
            // altUpdateKeys are always appended to row values even if not changed
            expect(updatedRows[0]).toHaveProperty(colTwoFk);
        });
        test('field added', () => {
            const addedColumn = new QueryColumn({
                name: 'added',
                caption: 'added',
                fieldKey: 'added',
                fieldKeyArray: ['added'],
                shownInInsertView: true,
                userEditable: true,
            });
            const updatedCellValues = basicEditorModel.cellValues.merge({
                [genCellKey(addedColumn.fieldKey, 0)]: List([
                    { display: 'Added Value', raw: 'Added Value' } as ValueDescriptor,
                ]),
                [genCellKey(addedColumn.fieldKey, 1)]: List([
                    { display: undefined, raw: undefined } as ValueDescriptor,
                ]),
            });
            const em = modifyEm({
                columnMap: basicEditorModel.columnMap.set(addedColumn.fieldKey.toLowerCase(), addedColumn),
                orderedColumns: basicEditorModel.orderedColumns.push(addedColumn.fieldKey.toLowerCase()),
                cellValues: updatedCellValues,
            });
            const updatedRows = em.getUpdatedData();
            expect(updatedRows).toHaveLength(1);
            expect(updatedRows[0].added).toEqual('Added Value');
        });
        test('folder included', () => {
            const altOriginalData = fromJS({
                '0': {
                    folder: { displayValue: 'fake folder', value: 'fake folder' },
                    [rowIdFk]: { displayValue: '1', value: 0 },
                    [colOneFk]: { displayValue: 'actual original ', value: 'actual original' },
                    [colTwoFk]: { displayValue: 'B ', value: 'b' },
                },
                '1': {
                    folder: { displayValue: 'fake folder', value: 'fake child folder' },
                    [rowIdFk]: { displayValue: '2', value: 1 },
                    [colOneFk]: { displayValue: 'actual original', value: 'actual original' },
                    [colTwoFk]: { displayValue: 'BB ', value: 'bb' },
                },
            });
            const updatedRows = basicEditorModel.getUpdatedData(altOriginalData);
            expect(updatedRows).toHaveLength(2);
            expect(updatedRows[0].Folder).toEqual('fake folder');
            expect(updatedRows[1].Folder).toEqual('fake child folder');
        });
        test('dates strip time zone context', () => {
            // Issue 51967: Regression coverage to ensure date timezone information is not
            // passed along to the server.
            const dateColumn = new QueryColumn({
                caption: 'Expiration Date',
                fieldKey: 'ExpirationDate',
                fieldKeyArray: ['ExpirationDate'],
                jsonType: 'date',
                name: 'ExpirationDate',
                shownInInsertView: true,
                shownInUpdateView: true,
                required: false,
                userEditable: true,
            });
            const dateColFk = dateColumn.fieldKey.toLowerCase();
            const date = new Date('2025-01-01T00:00:00Z');

            const cellValues = fromJS({
                [genCellKey(dateColFk, 0)]: List<ValueDescriptor>([{ display: undefined, raw: undefined }]),
                [genCellKey(dateColFk, 1)]: List<ValueDescriptor>([
                    {
                        display: '2025-01-01 00:00:00.000',
                        raw: date,
                    },
                ]),
            });

            const editorModel = modifyEm({
                cellValues: basicEditorModel.cellValues.merge(cellValues),
                columnMap: basicEditorModel.columnMap.set(dateColFk, dateColumn),
                orderedColumns: basicEditorModel.orderedColumns.push(dateColFk),
                rowCount: 2,
            });

            const updatedRows = editorModel.getUpdatedData();
            expect(updatedRows).toHaveLength(1);
            const [updatedRow] = updatedRows;

            expect(editorModel.getRowValue(1, true).get(dateColumn.fieldKey)).toEqual(date);
            expect(editorModel.getRowValue(1, false).get(dateColumn.fieldKey)).toEqual('2025-01-01 00:00:00');

            // Formerly, this would have .toString() the date which would end up with:
            // "Wed Jan 01 2025 00:00:00 GMT+0000 (Coordinated Universal Time)"
            expect(updatedRow[dateColumn.fieldKey]).toEqual('2025-01-01 00:00:00');
        });

        test('include sample lookup display value', () => {
            const sampleColumn = new QueryColumn({
                caption: 'Sample ID',
                fieldKey: 'sampleId',
                fieldKeyArray: ['sampleId'],
                jsonType: 'int',
                name: 'SampleID',
                shownInInsertView: true,
                shownInUpdateView: true,
                required: true,
                userEditable: true,
                lookup: {
                    schemaName: 'exp',
                    queryName: 'Materials',
                    displayColumn: 'Name',
                    keyColumn: 'RowId',
                },
            });
            const sampleColFk = sampleColumn.fieldKey.toLowerCase();
            const cellValues = fromJS({
                [genCellKey(sampleColFk, 0)]: List<ValueDescriptor>([{ display: undefined, raw: undefined }]),
                [genCellKey(sampleColFk, 1)]: List<ValueDescriptor>([
                    {
                        display: 'Sample-123',
                        raw: 123,
                    },
                ]),
            });
            const editorModel = modifyEm({
                cellValues: basicEditorModel.cellValues.merge(cellValues),
                columnMap: basicEditorModel.columnMap.set(sampleColFk, sampleColumn),
                orderedColumns: basicEditorModel.orderedColumns.push(sampleColFk),
                rowCount: 2,
            });
            expect(editorModel.getRowValue(1, false).get('SampleID')).toBe(123);
            expect(editorModel.getRowValue(1, false).get('SampleID/Name')).toBe(undefined);
            expect(editorModel.getRowValue(1, false, () => false).get('SampleID')).toBe(123);
            expect(editorModel.getRowValue(1, false, () => false).get('SampleID/Name')).toBe(undefined);
            expect(editorModel.getRowValue(1, false, () => true).get('SampleID')).toBe(123);
            expect(editorModel.getRowValue(1, false, () => true).get('SampleID/Name')).toBe('Sample-123');
        });
    });

    describe('utils', () => {
        test('getMessage', () => {
            expect(basicEditorModel.getMessage(colOneFk, 0).message).toBe('a');
            expect(basicEditorModel.getMessage(colTwoFk, 0)).toBe(undefined);
            expect(basicEditorModel.getMessage(colOneFk, 1)).toBe(undefined);
            expect(basicEditorModel.getMessage(colTwoFk, 1).message).toBe('b');
        });

        test('hasErrors', () => {
            const em1 = new EditorModel({
                cellMessages: Map.of(genCellKey(colOneFk, 0), { message: 'a' }, genCellKey(colTwoFk, 1), {
                    message: 'b',
                }),
                cellValues: basicCellValues,
                columnMap,
                orderedColumns,
                queryInfo: QUERY_INFO,
                rowCount: 2,
            });
            expect(em1.hasErrors).toBeTruthy();
            const em2 = new EditorModel({
                cellMessages: fromJS({}),
                cellValues: basicCellValues,
                columnMap,
                orderedColumns,
                queryInfo: QUERY_INFO,
                rowCount: 2,
            });
            expect(em2.hasErrors).toBeFalsy();
        });

        test('getValue', () => {
            expect(basicEditorModel.getValue(colOneFk, 0).size).toBe(1);
            expect(basicEditorModel.getValue(colOneFk, 0).get(0).raw).toBe('a');
            expect(basicEditorModel.getValue(colOneFk, 1).size).toBe(1);
            expect(basicEditorModel.getValue(colOneFk, 1).get(0).raw).toBe('aa');

            expect(basicEditorModel.getValue(colTwoFk, 0).size).toBe(1);
            expect(basicEditorModel.getValue(colTwoFk, 0).get(0).raw).toBe('b');
            expect(basicEditorModel.getValue(colTwoFk, 1).size).toBe(1);
            expect(basicEditorModel.getValue(colTwoFk, 1).get(0).raw).toBe('bb');

            expect(basicEditorModel.getValue(colOneFk, 2).size).toBe(0);
        });

        test('getValueForCellKey', () => {
            const model = new EditorModel({
                cellValues: basicCellValues,
            });
            expect(model.getValueForCellKey(genCellKey(colOneFk, 0)).size).toBe(1);
            expect(model.getValueForCellKey(genCellKey(colOneFk, 0)).get(0).raw).toBe('a');
            expect(model.getValueForCellKey(genCellKey(colOneFk, 1)).size).toBe(1);
            expect(model.getValueForCellKey(genCellKey(colOneFk, 1)).get(0).raw).toBe('aa');

            expect(model.getValueForCellKey(genCellKey(colTwoFk, 0)).size).toBe(1);
            expect(model.getValueForCellKey(genCellKey(colTwoFk, 0)).get(0).raw).toBe('b');
            expect(model.getValueForCellKey(genCellKey(colTwoFk, 1)).size).toBe(1);
            expect(model.getValueForCellKey(genCellKey(colTwoFk, 1)).get(0).raw).toBe('bb');

            expect(basicEditorModel.getValueForCellKey(genCellKey(colOneFk, 2)).size).toBe(0);
        });

        test('getValuesForColumn', () => {
            const model = new EditorModel({
                cellValues: basicCellValues,
            });
            expect(model.getValuesForColumn('bogus').size).toBe(0);
            expect(model.getValuesForColumn(colOneFk).toJS()).toStrictEqual({
                'both&&0': [{ display: 'A', raw: 'a' }],
                'both&&1': [{ display: 'AA', raw: 'aa' }],
            });
            expect(model.getValuesForColumn(colTwoFk).toJS()).toStrictEqual({
                'insert&&0': [{ display: 'B', raw: 'b' }],
                'insert&&1': [{ display: 'BB', raw: 'bb' }],
            });
        });

        test('hasFocus', () => {
            expect(new EditorModel({ focusColIdx: -1, focusRowIdx: -1 }).hasFocus).toBeFalsy();
            expect(new EditorModel({ focusColIdx: -1, focusRowIdx: 0 }).hasFocus).toBeFalsy();
            expect(new EditorModel({ focusColIdx: 0, focusRowIdx: -1 }).hasFocus).toBeFalsy();
            expect(new EditorModel({ focusColIdx: 0, focusRowIdx: 0 }).hasFocus).toBeTruthy();
        });

        test('isFocused', () => {
            const model = new EditorModel({ focusColIdx: 0, focusRowIdx: 0 });
            expect(model.isFocused(-1, -1)).toBeFalsy();
            expect(model.isFocused(-1, 0)).toBeFalsy();
            expect(model.isFocused(0, -1)).toBeFalsy();
            expect(model.isFocused(0, 0)).toBeTruthy();
            expect(model.isFocused(0, 1)).toBeFalsy();
            expect(model.isFocused(1, 0)).toBeFalsy();
            expect(model.isFocused(1, 1)).toBeFalsy();
        });

        test('hasSelection', () => {
            expect(new EditorModel({ selectedColIdx: -1, selectedRowIdx: -1 }).hasSelection).toBeFalsy();
            expect(new EditorModel({ selectedColIdx: -1, selectedRowIdx: 0 }).hasSelection).toBeFalsy();
            expect(new EditorModel({ selectedColIdx: 0, selectedRowIdx: -1 }).hasSelection).toBeFalsy();
            expect(new EditorModel({ selectedColIdx: 0, selectedRowIdx: 0 }).hasSelection).toBeTruthy();
        });

        test('selectionKey', () => {
            expect(modifyEm({ selectedColIdx: -1, selectedRowIdx: -1 }).selectionKey).toBe(undefined);
            expect(modifyEm({ selectedColIdx: -1, selectedRowIdx: 0 }).selectionKey).toBe(undefined);
            expect(modifyEm({ selectedColIdx: 0, selectedRowIdx: -1 }).selectionKey).toBe(undefined);
            expect(modifyEm({ selectedColIdx: 0, selectedRowIdx: 0 }).selectionKey).toBe(genCellKey(colOneFk, 0));
            expect(modifyEm({ selectedColIdx: 0, selectedRowIdx: 1 }).selectionKey).toBe(genCellKey(colOneFk, 1));
            expect(modifyEm({ selectedColIdx: 1, selectedRowIdx: 0 }).selectionKey).toBe(genCellKey(colTwoFk, 0));
        });

        test('isSelected', () => {
            const model = new EditorModel({ selectedColIdx: 0, selectedRowIdx: 0 });
            expect(model.isSelected(-1, -1)).toBeFalsy();
            expect(model.isSelected(-1, 0)).toBeFalsy();
            expect(model.isSelected(0, -1)).toBeFalsy();
            expect(model.isSelected(0, 0)).toBeTruthy();
            expect(model.isSelected(0, 1)).toBeFalsy();
            expect(model.isSelected(1, 0)).toBeFalsy();
            expect(model.isSelected(1, 1)).toBeFalsy();
        });

        test('hasMultipleSelection', () => {
            expect(modifyEm({ selectionCells: [] }).isMultiSelect).toBeFalsy();
            expect(modifyEm({ selectionCells: [genCellKey(colOneFk, 0)] }).isMultiSelect).toBeFalsy();
            expect(
                modifyEm({ selectionCells: [genCellKey(colOneFk, 0), genCellKey(colTwoFk, 1)] }).isMultiSelect
            ).toBeTruthy();
        });

        test('isMultiColumnSelection', () => {
            expect(modifyEm({ selectionCells: [] }).isMultiColumnSelection).toBeFalsy();
            expect(modifyEm({ selectionCells: [genCellKey(colOneFk, 0)] }).isMultiColumnSelection).toBeFalsy();
            expect(
                modifyEm({ selectionCells: [genCellKey(colOneFk, 0), genCellKey(colOneFk, 1)] }).isMultiColumnSelection
            ).toBeFalsy();
            expect(
                modifyEm({ selectionCells: [genCellKey(colOneFk, 0), genCellKey(colTwoFk, 1)] }).isMultiColumnSelection
            ).toBeTruthy();
        });

        test('lastSelection', () => {
            // No selection is falsy
            expect(basicEditorModel.lastSelection(colOneFk, 0)).toBeFalsy();
            expect(basicEditorModel.lastSelection(colOneFk, 1)).toBeFalsy();
            expect(basicEditorModel.lastSelection(colTwoFk, 0)).toBeFalsy();
            expect(basicEditorModel.lastSelection(colTwoFk, 1)).toBeFalsy();

            // Single Cell checks against selectionKey and not selectionCells
            const singleCellSel = modifyEm({
                selectionCells: [],
                selectedColIdx: 0,
                selectedRowIdx: 0,
                rowCount: 100,
            });
            expect(singleCellSel.lastSelection(colOneFk, 0)).toBeTruthy();
            expect(singleCellSel.lastSelection(colOneFk, 1)).toBeFalsy();
            expect(singleCellSel.lastSelection(colTwoFk, 0)).toBeFalsy();

            // Multiple Cell selection checks against selectionCells
            const multiCellSel = modifyEm({
                selectionCells: [
                    genCellKey(colOneFk, 0),
                    genCellKey(colTwoFk, 0),
                    genCellKey(colOneFk, 1),
                    genCellKey(colTwoFk, 1),
                ],
                rowCount: 100,
            });
            expect(multiCellSel.lastSelection(colOneFk, 0)).toBeFalsy();
            expect(multiCellSel.lastSelection(colTwoFk, 1)).toBeTruthy();
        });

        test('isInBounds', () => {
            const model = modifyEm({ orderedColumns: List([colOneFk]), rowCount: 1 });
            expect(model.isInBounds(-1, -1)).toBeFalsy();
            expect(model.isInBounds(0, -1)).toBeFalsy();
            expect(model.isInBounds(-1, 0)).toBeFalsy();
            expect(model.isInBounds(0, 0)).toBeTruthy();
            expect(model.isInBounds(0, 1)).toBeFalsy();
            expect(model.isInBounds(1, 0)).toBeFalsy();
            expect(model.isInBounds(1, 1)).toBeFalsy();
        });

        test('inSelection', () => {
            const model = modifyEm({ selectionCells: [genCellKey(colOneFk, 0), genCellKey(colTwoFk, 1)] });
            expect(model.inSelection('invalid', -1)).toBeFalsy();
            expect(model.inSelection(colOneFk, -1)).toBeFalsy();
            expect(model.inSelection('invalid', 0)).toBeFalsy();
            expect(model.inSelection(colOneFk, 0)).toBeTruthy();
            expect(model.inSelection(colOneFk, 1)).toBeFalsy();
            expect(model.inSelection(colTwoFk, 0)).toBeFalsy();
            expect(model.inSelection(colTwoFk, 1)).toBeTruthy();
        });

        test('hasRawValue', () => {
            const model = new EditorModel({});
            expect(model.hasRawValue(undefined)).toBeFalsy();
            expect(model.hasRawValue({} as ValueDescriptor)).toBeFalsy();
            expect(model.hasRawValue({ raw: undefined } as ValueDescriptor)).toBeFalsy();
            expect(model.hasRawValue({ raw: null } as ValueDescriptor)).toBeFalsy();
            expect(model.hasRawValue({ raw: '' } as ValueDescriptor)).toBeFalsy();
            expect(model.hasRawValue({ raw: ' ' } as ValueDescriptor)).toBeFalsy();
            expect(model.hasRawValue({ raw: ' test' } as ValueDescriptor)).toBeTruthy();
        });

        test('hasData', () => {
            let model = modifyEm({
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([{} as ValueDescriptor]),
                }),
            });
            expect(model.hasData).toBeFalsy();

            model = modifyEm({
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([{ raw: ' ' } as ValueDescriptor]),
                }),
            });
            expect(model.hasData).toBeFalsy();

            model = modifyEm({
                cellValues: fromJS({
                    [genCellKey(colOneFk, 0)]: List([{ raw: 'a' } as ValueDescriptor]),
                }),
            });
            expect(model.hasData).toBeTruthy();
        });

        test('getPkValues', () => {
            const config = {
                appEditableTable: true,
                pkCols: ['RowId'],
                columns: fromJS({
                    rowid: new QueryColumn({
                        caption: 'Row Id',
                        fieldKey: 'RowId',
                        inputType: 'number',
                    }),
                    lsid: new QueryColumn({
                        caption: 'LSID',
                        fieldKey: 'lsid',
                        inputType: 'text',
                    }),
                    description: new QueryColumn({
                        caption: 'Description',
                        fieldKey: 'Description',
                        inputType: 'textarea',
                    }),
                }),
            };
            const queryInfo = new QueryInfo(config);
            const queryInfoWithAltKey = new QueryInfo({
                ...config,
                altUpdateKeys: new Set<string>(['lsid']),
            });
            const cellValues = fromJS({
                [genCellKey('RowId', 0)]: List([{ raw: 1 } as ValueDescriptor]),
                [genCellKey('lsid', 0)]: List([{ raw: 'abc' } as ValueDescriptor]),
            });
            let model = new EditorModel({
                queryInfo,
                cellValues,
            });
            expect(model.getPkValues(0)).toStrictEqual({ RowId: 1 });

            model = new EditorModel({
                queryInfo: queryInfoWithAltKey,
                cellValues,
            });
            expect(model.getPkValues(0)).toStrictEqual({ RowId: 1, lsid: 'abc' });
        });
    });
});
