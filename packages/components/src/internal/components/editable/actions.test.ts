import { List, Map, Set } from 'immutable';

import { ExtendedMap } from '../../../public/ExtendedMap';
import { QueryColumn, QueryLookup } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import sampleSet2QueryInfo from '../../../test/data/sampleSet2-getQueryDetails.json';

import {
    addColumns,
    changeColumn,
    fillColumnCells,
    parseIntIfNumber,
    parsePastedLookup,
    removeColumn,
    removeColumns,
    splitPrefixedNumber,
    validateAndInsertPastedData,
} from './actions';
import { CellMessage, EditorModel, ValueDescriptor } from './models';
import { genCellKey } from './utils';

describe('column mutation actions', () => {
    const queryInfo = QueryInfo.fromJsonForTests(sampleSet2QueryInfo);
    const insertColumnFieldKeys = List(queryInfo.getInsertColumns().map(col => col.fieldKey.toLowerCase()));
    const firstFK = insertColumnFieldKeys.get(0);
    const secondFk = insertColumnFieldKeys.get(1);
    const sixthFk = insertColumnFieldKeys.get(5);
    const editorModel = new EditorModel({
        cellMessages: Map<string, CellMessage>({
            [genCellKey(secondFk, 0)]: 'description 1 message',
        }),
        cellValues: Map<string, List<ValueDescriptor>>({
            [genCellKey(firstFK, 0)]: List<ValueDescriptor>([
                {
                    display: 'S-1',
                    raw: 'S-1',
                },
            ]),
            [genCellKey(firstFK, 1)]: List<ValueDescriptor>([
                {
                    display: 'S-2',
                    raw: 'S-2',
                },
            ]),
            [genCellKey(firstFK, 2)]: List<ValueDescriptor>([
                {
                    display: 'S-3',
                    raw: 'S-3',
                },
            ]),
            [genCellKey(secondFk, 0)]: List<ValueDescriptor>([
                {
                    display: 'Description 1',
                    raw: 'Description 1',
                },
            ]),
            [genCellKey(secondFk, 1)]: List<ValueDescriptor>([
                {
                    display: 'Description 2',
                    raw: 'Description 2',
                },
            ]),
            [genCellKey(secondFk, 2)]: List<ValueDescriptor>([
                {
                    display: 'Description 3',
                    raw: 'Description 3',
                },
            ]),
            [genCellKey(sixthFk, 0)]: List<ValueDescriptor>([
                {
                    display: 'requirement 1',
                    raw: 'requirement 1',
                },
            ]),
        }),
        queryInfo,
        orderedColumns: insertColumnFieldKeys,
        columnMap: insertColumnFieldKeys.reduce((result, key) => {
            return result.set(key, queryInfo.getColumn(key));
        }, Map<string, any>()),
        id: 'insert-samples|samples/sample set 2',
        focusColIdx: 1,
        focusRowIdx: 1,
        rowCount: 3,
        selectedColIdx: 1,
        selectedRowIdx: 1,
        selectionCells: Set<string>(),
    });

    const dataRows = {
        '1': {
            Description: 'S-1 Description',
        },
        '2': {
            Description: 'S-2 Description',
        },
    };

    const dataKeys = ['1', '2'];

    const queryModel = makeTestQueryModel(
        new SchemaQuery('samples', 'Sample Set 2'),
        queryInfo,
        dataRows,
        dataKeys,
        dataKeys.length,
        'insert-samples|samples/sample set 2'
    );

    const queryColumn = new QueryColumn({
        caption: 'Sample set 3 Parents',
        conceptURI: null,
        defaultValue: null,
        description: 'Contains optional parent entity for this Sample set 3',
        fieldKey: 'MaterialInputs/Sample set 3',
        fieldKeyArray: ['MaterialInputs/Sample set 3'],
        lookup: {
            displayColumn: 'Name',
            isPublic: true,
            keyColumn: 'RowId',
            multiValued: 'junction',
            queryName: 'Sample set 3',
            schemaName: 'samples',
        } as QueryLookup,
        multiValue: false,
        name: 'MaterialInputs/Sample set 3',
        required: false,
        shownInInsertView: true,
        sortable: true,
        type: 'Text (String)',
        userEditable: true,
        removeFromViews: false,
    });

    describe('addColumns', () => {
        test('no columns provided', () => {
            const updates = addColumns(editorModel, new ExtendedMap<string, QueryColumn>());
            expect(updates).toEqual({});
        });

        test('add at beginning', () => {
            const addedFk = queryColumn.fieldKey;
            const updates = addColumns(
                editorModel,
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn })
            );
            expect(updates.cellMessages).toEqual(editorModel.cellMessages);
            expect(updates.cellValues.get(genCellKey(addedFk, 0))).not.toBeUndefined();
            expect(updates.cellValues.get(genCellKey(addedFk, 1))).not.toBeUndefined();
            expect(updates.cellValues.get(genCellKey(addedFk, 2))).not.toBeUndefined();
            expect(updates.orderedColumns.get(0)).toEqual(queryColumn.fieldKey.toLowerCase());
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size + 1);
            expect(updates.queryInfo.getColumnIndex('Description')).toBe(
                queryModel.queryInfo.getColumnIndex('Description') + 1
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(0);
        });

        test('add at beginning, insert fieldKey does not exist', () => {
            const updates = addColumns(
                editorModel,
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn }),
                'Bogus'
            );
            expect(updates.cellMessages).toEqual(editorModel.cellMessages);
            expect(updates.orderedColumns.get(0)).toEqual(queryColumn.fieldKey.toLowerCase());
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size + 1);
            expect(updates.queryInfo.getColumnIndex('Description')).toBe(
                queryModel.queryInfo.getColumnIndex('Description') + 1
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(0);
        });

        test('add at end', () => {
            const insertCols = queryModel.queryInfo.getInsertColumns();
            const lastInsertColKey = insertCols[insertCols.length - 1].fieldKey;
            const updates = addColumns(
                editorModel,
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn }),
                lastInsertColKey
            );
            expect(updates.cellMessages).toEqual(editorModel.cellMessages);
            expect(updates.orderedColumns.get(updates.orderedColumns.size - 1)).toEqual(
                queryColumn.fieldKey.toLowerCase()
            );
            expect(updates.queryInfo.getColumnIndex('description')).toBe(
                queryModel.queryInfo.getColumnIndex('description')
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(
                queryModel.queryInfo.getColumnIndex(lastInsertColKey) + 1
            );
        });

        test('add in the middle', () => {
            const nameColIndex = queryModel.queryInfo.getColumnIndex('name');
            const updates = addColumns(
                editorModel,
                new ExtendedMap<string, QueryColumn>({ [queryColumn.fieldKey]: queryColumn }),
                'Name'
            );

            expect(updates.cellMessages).toEqual(editorModel.cellMessages);
            expect(updates.orderedColumns.indexOf(queryColumn.fieldKey.toLowerCase())).toEqual(
                updates.orderedColumns.indexOf('name') + 1
            );
            expect(updates.queryInfo.getColumnIndex('name')).toBe(nameColIndex);
            expect(updates.queryInfo.getColumnIndex('description')).toBe(
                queryModel.queryInfo.getColumnIndex('description') + 1
            );
            expect(updates.queryInfo.getColumnIndex(queryColumn.fieldKey)).toBe(nameColIndex + 1);
        });
    });

    describe('changeColumn', () => {
        test('column not found', () => {
            const updates = changeColumn(editorModel, 'Nonesuch', queryColumn);
            expect(updates).toEqual({});
        });

        test('has values and messages', () => {
            const updates = changeColumn(
                editorModel,
                'DESCRIPTION', // case-insensitive
                queryColumn
            );

            expect(updates.cellMessages.size).toBe(0);
            expect(updates.orderedColumns.find(fieldKey => fieldKey === 'Description')).toBeUndefined();
            expect(updates.orderedColumns.indexOf(queryColumn.fieldKey.toLowerCase())).toEqual(
                editorModel.orderedColumns.indexOf('description')
            );
            expect(updates.queryInfo.getColumn('Description')).toBeFalsy();
            expect(updates.queryInfo.getColumn(queryColumn.fieldKey)).toBeTruthy();
        });
    });

    describe('removeColumn', () => {
        test('column not found', () => {
            let updates = removeColumn(editorModel, 'Modified'); // not an insert column, so cannot be removed
            expect(updates).toEqual({});
            updates = removeColumns(editorModel, ['Modified']);
            expect(updates).toEqual({});
        });

        function verifyRemoveFirstColumnUpdates(updates: Partial<EditorModel>, fieldKeyFirst: string) {
            expect(updates.cellMessages.size).toBe(1);
            expect(updates.cellValues.has(genCellKey(firstFK, 0))).toBe(false);
            expect(updates.cellValues.has(genCellKey(firstFK, 1))).toBe(false);
            expect(updates.cellValues.has(genCellKey(firstFK, 2))).toBe(false);
            expect(updates.cellValues.get(genCellKey(secondFk, 0)).get(0).display).toBe('Description 1');
            expect(updates.cellValues.get(genCellKey(secondFk, 1)).get(0).display).toBe('Description 2');
            expect(updates.cellValues.get(genCellKey(secondFk, 2)).get(0).display).toBe('Description 3');
            expect(updates.cellValues.get(genCellKey(sixthFk, 0)).get(0).display).toBe('requirement 1');
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size - 1);
            expect(updates.orderedColumns.find(fieldKey => fieldKey === fieldKeyFirst)).toBeUndefined();
        }
        test('first column', () => {
            const firstInputColumnFieldKey = queryModel.queryInfo.getInsertColumns()[0].fieldKey;
            verifyRemoveFirstColumnUpdates(
                removeColumn(editorModel, firstInputColumnFieldKey),
                firstInputColumnFieldKey
            );
            verifyRemoveFirstColumnUpdates(
                removeColumns(editorModel, [firstInputColumnFieldKey]),
                firstInputColumnFieldKey
            );
        });

        function verifyRemoveLastColumnUpdates(updates: Partial<EditorModel>, fieldKeyLast: string) {
            expect(updates.cellMessages.size).toBe(1);
            expect(updates.cellValues.get(genCellKey(firstFK, 0)).get(0).display).toBe('S-1');
            expect(updates.cellValues.get(genCellKey(firstFK, 1)).get(0).display).toBe('S-2');
            expect(updates.cellValues.get(genCellKey(firstFK, 2)).get(0).display).toBe('S-3');
            expect(updates.cellValues.get(genCellKey(secondFk, 0)).get(0).display).toBe('Description 1');
            expect(updates.cellValues.get(genCellKey(secondFk, 1)).get(0).display).toBe('Description 2');
            expect(updates.cellValues.get(genCellKey(secondFk, 2)).get(0).display).toBe('Description 3');
            expect(updates.cellValues.has(genCellKey(sixthFk, 0))).toBe(false);
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size - 1);
            expect(updates.orderedColumns.find(fieldKey => fieldKey === fieldKeyLast)).toBeUndefined();
        }
        test('last column', () => {
            const insertCols = queryModel.queryInfo.getInsertColumns();
            const lastInputColumnFK = insertCols[insertCols.length - 1].fieldKey;
            verifyRemoveLastColumnUpdates(removeColumn(editorModel, lastInputColumnFK), lastInputColumnFK);
            verifyRemoveLastColumnUpdates(removeColumns(editorModel, [lastInputColumnFK]), lastInputColumnFK);
        });

        function verifyRemoveMiddleColumnUpdates(updates: Partial<EditorModel>, fieldKeyMid: string) {
            expect(updates.cellMessages.size).toBe(0);
            expect(updates.cellValues.get(genCellKey(firstFK, 0)).get(0).display).toBe('S-1');
            expect(updates.cellValues.get(genCellKey(firstFK, 1)).get(0).display).toBe('S-2');
            expect(updates.cellValues.get(genCellKey(firstFK, 2)).get(0).display).toBe('S-3');
            expect(updates.cellValues.has(genCellKey(secondFk, 0))).toBe(false);
            expect(updates.cellValues.has(genCellKey(secondFk, 1))).toBe(false);
            expect(updates.cellValues.has(genCellKey(secondFk, 2))).toBe(false);
            expect(updates.cellValues.get(genCellKey(sixthFk, 0)).get(0).display).toBe('requirement 1');
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size - 1);
            expect(updates.orderedColumns.find(fk => fk === fieldKeyMid)).toBeUndefined();
        }
        test('middle column', () => {
            const fieldKey = 'Description';
            verifyRemoveMiddleColumnUpdates(removeColumn(editorModel, fieldKey), fieldKey);
            verifyRemoveMiddleColumnUpdates(removeColumns(editorModel, [fieldKey]), fieldKey);
        });

        test('remove first and second columns', () => {
            const firstInputColumnFieldKey = queryModel.queryInfo.getInsertColumns()[0].fieldKey;
            const secondInputColumnFieldKey = queryModel.queryInfo.getInsertColumns()[1].fieldKey;

            const updates = removeColumns(editorModel, [firstInputColumnFieldKey, secondInputColumnFieldKey]);

            expect(updates.cellMessages.size).toBe(0);
            expect(updates.cellValues.has(genCellKey(firstFK, 0))).toBe(false);
            expect(updates.cellValues.has(genCellKey(firstFK, 1))).toBe(false);
            expect(updates.cellValues.has(genCellKey(firstFK, 2))).toBe(false);
            expect(updates.cellValues.has(genCellKey(secondFk, 0))).toBe(false);
            expect(updates.cellValues.has(genCellKey(secondFk, 1))).toBe(false);
            expect(updates.cellValues.has(genCellKey(secondFk, 2))).toBe(false);
            expect(updates.cellValues.get(genCellKey(sixthFk, 0)).get(0).display).toBe('requirement 1');
            expect(updates.orderedColumns.size).toEqual(editorModel.orderedColumns.size - 2);
            expect(updates.orderedColumns.find(fieldKey => fieldKey === firstInputColumnFieldKey)).toBeUndefined();
            expect(updates.orderedColumns.find(fieldKey => fieldKey === secondInputColumnFieldKey)).toBeUndefined();
        });
    });
});

describe('fillColumnCells', () => {
    const lookupFk = 'lookup';
    const intFk = 'int';
    const floatFk = 'float';
    const dateFk = 'date';
    const datetimeFk = 'datetime';
    const strFk = 'str';
    const editorModel = new EditorModel({}).merge({
        cellMessages: Map<string, CellMessage>({
            '1-0': 'description 1 message',
        }),
        cellValues: Map<string, List<ValueDescriptor>>({
            [genCellKey(lookupFk, 0)]: List<ValueDescriptor>([
                {
                    display: 'S-1',
                    raw: 1,
                },
            ]),
            [genCellKey(lookupFk, 1)]: List<ValueDescriptor>([
                {
                    display: 'S-2',
                    raw: 2,
                },
            ]),
            [genCellKey(lookupFk, 2)]: List<ValueDescriptor>([
                {
                    display: 'S-3',
                    raw: 3,
                },
            ]),
            [genCellKey(intFk, 0)]: List<ValueDescriptor>([
                {
                    display: '1',
                    raw: 1,
                },
            ]),
            [genCellKey(intFk, 1)]: List<ValueDescriptor>([
                {
                    display: '3',
                    raw: 3,
                },
            ]),
            [genCellKey(intFk, 2)]: List<ValueDescriptor>([
                {
                    display: '5',
                    raw: 5,
                },
            ]),
            [genCellKey(floatFk, 0)]: List<ValueDescriptor>([
                {
                    display: '3.0',
                    raw: 3.0,
                },
            ]),
            [genCellKey(floatFk, 1)]: List<ValueDescriptor>([
                {
                    display: '1.5',
                    raw: 1.5,
                },
            ]),
            [genCellKey(floatFk, 2)]: List<ValueDescriptor>([
                {
                    display: '0',
                    raw: 0,
                },
            ]),
            [genCellKey(strFk, 0)]: List<ValueDescriptor>([
                {
                    display: 'qwer',
                    raw: 'qwer',
                },
            ]),
            [genCellKey(strFk, 1)]: List<ValueDescriptor>([
                {
                    display: 'asdf',
                    raw: 'asdf',
                },
            ]),
            [genCellKey(strFk, 2)]: List<ValueDescriptor>([
                {
                    display: 'zxcv',
                    raw: 'zxcv',
                },
            ]),
            [genCellKey(dateFk, 0)]: List<ValueDescriptor>([
                {
                    display: '2023-06-01',
                    raw: '2023-06-01',
                },
            ]),
            [genCellKey(dateFk, 1)]: List<ValueDescriptor>([
                {
                    display: '',
                    raw: '',
                },
            ]),
            [genCellKey(dateFk, 2)]: List<ValueDescriptor>([
                {
                    display: '2023-04-16',
                    raw: '2023-04-16',
                },
            ]),
            [genCellKey(datetimeFk, 0)]: List<ValueDescriptor>([
                {
                    display: '2023-06-01 10:42',
                    raw: '2023-06-01 10:42',
                },
            ]),
            [genCellKey(datetimeFk, 1)]: List<ValueDescriptor>([
                {
                    display: '',
                    raw: '',
                },
            ]),
            [genCellKey(datetimeFk, 2)]: List<ValueDescriptor>([
                {
                    display: '2023-04-16 11:11',
                    raw: '2023-04-16 11:11',
                },
            ]),
        }),
        orderedColumns: List([lookupFk, intFk, floatFk, strFk, dateFk, datetimeFk]),
        rowCount: 10,
    }) as EditorModel;

    const textCol = new QueryColumn({
        fieldKey: 'textCol',
        lookup: undefined,
    });

    beforeAll(() => {
        global.console.warn = jest.fn();
    });

    test('single initialSelection', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(lookupFk, 0)],
            [genCellKey(lookupFk, 1), genCellKey(lookupFk, 2), genCellKey(lookupFk, 3)],
            true,
            undefined
        );
        // Filled values should be copies of the initial selection
        for (let i = 1; i <= 3; i++) {
            expect(cellValues.get(genCellKey(lookupFk, i)).get(0).display).toEqual('S-1');
            expect(cellValues.get(genCellKey(lookupFk, i)).get(0).raw).toEqual(1);
        }
    });

    test('prefixed number, multi initialSelection', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(lookupFk, 0), genCellKey(lookupFk, 1), genCellKey(lookupFk, 2)],
            [genCellKey(lookupFk, 3), genCellKey(lookupFk, 4)],
            true,
            undefined
        );
        expect(cellValues.get(genCellKey(lookupFk, 3)).get(0).display).toEqual('S-4');
        expect(cellValues.get(genCellKey(lookupFk, 3)).get(0).raw).toEqual('S-4');
        expect(cellValues.get(genCellKey(lookupFk, 4)).get(0).display).toEqual('S-5');
        expect(cellValues.get(genCellKey(lookupFk, 4)).get(0).raw).toEqual('S-5');
    });

    test('integer, multi initialSelection, forward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(intFk, 0), genCellKey(intFk, 1), genCellKey(intFk, 2)],
            [genCellKey(intFk, 3), genCellKey(intFk, 4)],
            true,
            undefined
        );
        expect(cellValues.get(genCellKey(intFk, 3)).get(0).display).toEqual('7');
        expect(cellValues.get(genCellKey(intFk, 3)).get(0).raw).toEqual(7);
        expect(cellValues.get(genCellKey(intFk, 4)).get(0).display).toEqual('9');
        expect(cellValues.get(genCellKey(intFk, 4)).get(0).raw).toEqual(9);
    });

    test('integer, multi initialSelection, backward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(intFk, 1), genCellKey(intFk, 2)],
            [genCellKey(intFk, 0)],
            true,
            undefined
        );
        expect(cellValues.get(genCellKey(intFk, 0)).get(0).display).toEqual('1');
        expect(cellValues.get(genCellKey(intFk, 0)).get(0).raw).toEqual(1);
    });

    test('float, multi initialSelection, forward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(floatFk, 0), genCellKey(floatFk, 1), genCellKey(floatFk, 2)],
            [genCellKey(floatFk, 3), genCellKey(floatFk, 4)],
            true,
            undefined
        );
        expect(cellValues.get(genCellKey(floatFk, 3)).get(0).display).toEqual('-1.5');
        expect(cellValues.get(genCellKey(floatFk, 3)).get(0).raw).toEqual(-1.5);
        expect(cellValues.get(genCellKey(floatFk, 4)).get(0).display).toEqual('-3');
        expect(cellValues.get(genCellKey(floatFk, 4)).get(0).raw).toEqual(-3);
    });

    test('float, multi initialSelection, backward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(floatFk, 1), genCellKey(floatFk, 2)],
            [genCellKey(floatFk, 0)],
            true,
            undefined
        );
        expect(cellValues.get(genCellKey(floatFk, 0)).get(0).display).toEqual('3');
        expect(cellValues.get(genCellKey(floatFk, 0)).get(0).raw).toEqual(3);
    });

    test('date, single row initialSelection, forward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(dateFk, 0)],
            [genCellKey(dateFk, 1), genCellKey(dateFk, 2), genCellKey(dateFk, 3)],
            true,
            undefined
        );
        // Filled values should be copies of the initial selection
        for (let i = 1; i <= 3; i++) {
            expect(cellValues.get(genCellKey(dateFk, i)).get(0).display).toEqual(`2023-06-0${i + 1}`);
            expect(cellValues.get(genCellKey(dateFk, i)).get(0).raw).toEqual(`2023-06-0${i + 1}`);
        }
    });

    test('date, single row initialSelection, backward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(dateFk, 2)],
            [genCellKey(dateFk, 0), genCellKey(dateFk, 1)],
            true,
            undefined
        );
        // Filled values should be copies of the initial selection
        for (let i = 0; i <= 2; i++) {
            expect(cellValues.get(genCellKey(dateFk, i)).get(0).display).toEqual(`2023-04-${14 + i}`);
            expect(cellValues.get(genCellKey(dateFk, i)).get(0).raw).toEqual(`2023-04-${14 + i}`);
        }
    });

    test('datetime, single row initialSelection, forward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(datetimeFk, 0)],
            [genCellKey(datetimeFk, 1), genCellKey(datetimeFk, 2), genCellKey(datetimeFk, 3)],
            true,
            undefined
        );
        // Filled values should be copies of the initial selection
        for (let i = 1; i <= 3; i++) {
            expect(cellValues.get(genCellKey(datetimeFk, i)).get(0).display).toEqual(`2023-06-0${i + 1} 10:42`);
            expect(cellValues.get(genCellKey(datetimeFk, i)).get(0).raw).toEqual(`2023-06-0${i + 1} 10:42`);
        }
    });

    test('datetime, single row initialSelection, backward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(datetimeFk, 2)],
            [genCellKey(datetimeFk, 0), genCellKey(datetimeFk, 1)],
            true,
            undefined
        );
        // Filled values should be copies of the initial selection
        for (let i = 0; i <= 2; i++) {
            expect(cellValues.get(genCellKey(datetimeFk, i)).get(0).display).toEqual(`2023-04-${14 + i} 11:11`);
            expect(cellValues.get(genCellKey(datetimeFk, i)).get(0).raw).toEqual(`2023-04-${14 + i} 11:11`);
        }
    });

    test('text, multi initialSelection, forward', async () => {
        const { cellValues } = await fillColumnCells(
            editorModel,
            textCol,
            undefined,
            editorModel.cellMessages,
            editorModel.cellValues,
            [genCellKey(strFk, 0), genCellKey(strFk, 1), genCellKey(strFk, 2)],
            [genCellKey(strFk, 3), genCellKey(strFk, 4), genCellKey(strFk, 5)],
            true,
            undefined
        );
        expect(cellValues.get(genCellKey(strFk, 3)).get(0).display).toEqual('qwer');
        expect(cellValues.get(genCellKey(strFk, 3)).get(0).raw).toEqual('qwer');
        expect(cellValues.get(genCellKey(strFk, 4)).get(0).display).toEqual('asdf');
        expect(cellValues.get(genCellKey(strFk, 4)).get(0).raw).toEqual('asdf');
        expect(cellValues.get(genCellKey(strFk, 5)).get(0).display).toEqual('zxcv');
        expect(cellValues.get(genCellKey(strFk, 5)).get(0).raw).toEqual('zxcv');
    });
});

describe('parseIntIfNumber', () => {
    test('empty', () => {
        expect(parseIntIfNumber(undefined)).toBe(undefined);
        expect(parseIntIfNumber(null)).toBe(null);
        expect(parseIntIfNumber('')).toBe('');
        expect(parseIntIfNumber(' ')).toBe(' ');
    });

    test('string', () => {
        expect(parseIntIfNumber('0')).toBe(0);
        expect(parseIntIfNumber('1')).toBe(1);
        expect(parseIntIfNumber(' 1 ')).toBe(1);
        expect(parseIntIfNumber('1_2')).toBe('1_2');
    });

    test('number', () => {
        expect(parseIntIfNumber(0)).toBe(0);
        expect(parseIntIfNumber(1)).toBe(1);
        expect(parseIntIfNumber(1.2)).toBe(1);
        expect(parseIntIfNumber(1.9)).toBe(1);
    });
});

describe('splitPrefixedNumber', () => {
    test('parses string as expected', () => {
        expect(splitPrefixedNumber('ABC-123')).toEqual(['ABC-', '123']);
        expect(splitPrefixedNumber('ABC 123')).toEqual(['ABC ', '123']);
        expect(splitPrefixedNumber('ABC-1.23')).toEqual(['ABC-', '1.23']);
        expect(splitPrefixedNumber('ABC-1.23.4')).toEqual(['ABC-1.', '23.4']);
        expect(splitPrefixedNumber('ABC.0')).toEqual(['ABC.', '0']);
        expect(splitPrefixedNumber('ABC.1.2')).toEqual(['ABC.', '1.2']);
        expect(splitPrefixedNumber('ABC')).toEqual(['ABC', undefined]);
        expect(splitPrefixedNumber('ABC-')).toEqual(['ABC-', undefined]);
        expect(splitPrefixedNumber('123')).toEqual([undefined, '123']);
        expect(splitPrefixedNumber('123.45')).toEqual([undefined, '123.45']);
    });

    test('param as number', () => {
        expect(splitPrefixedNumber(123)).toEqual([undefined, '123']);
    });

    test('param empty', () => {
        expect(splitPrefixedNumber(undefined)).toEqual([undefined, undefined]);
        expect(splitPrefixedNumber(null)).toEqual([undefined, undefined]);
        expect(splitPrefixedNumber('')).toEqual([undefined, undefined]);
    });
});

describe('parsePastedLookup', () => {
    const intLookupCol = new QueryColumn({
        jsonType: 'int',
        caption: 'LookCol',
        lookup: new QueryLookup({ isPublic: true }),
    });
    const stringLookupCol = new QueryColumn({
        jsonType: 'string',
        caption: 'LookCol',
        lookup: new QueryLookup({ isPublic: true }),
    });
    const requiredLookupCol = new QueryColumn({
        jsonType: 'string',
        caption: 'ReqLookCol',
        lookup: new QueryLookup({ isPublic: true }),
        required: true,
    });

    const intLookupValues = [
        { display: 'A', raw: 1 },
        { display: 'b', raw: 2 },
    ];
    const stringLookupValues = [
        { display: 'A', raw: 'a' },
        { display: 'b', raw: 'B' },
        { display: 'C', raw: 'C' },
        { display: 'value D', raw: 'd' },
    ];

    test('empty', () => {
        [undefined, null, '', ' '].forEach(val => {
            expect(parsePastedLookup(intLookupCol, intLookupValues, val)).toStrictEqual({
                valueDescriptors: List([
                    {
                        display: val,
                        raw: val,
                    },
                ]),
            });
        });
        [undefined, null, '', ' '].forEach(val => {
            expect(parsePastedLookup(stringLookupCol, stringLookupValues, val)).toStrictEqual({
                valueDescriptors: List([
                    {
                        display: val,
                        raw: val,
                    },
                ]),
            });
        });
    });

    test('string value', () => {
        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'A')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 'a' }]),
        });
        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'a')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 'a' }]),
        });
        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'value D')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'value D', raw: 'd' }]),
        });
        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'b,C,value D')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([
                { display: 'b', raw: 'B' },
                { display: 'C', raw: 'C' },
                { display: 'value D', raw: 'd' },
            ]),
        });

        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'abc')).toStrictEqual({
            message: { message: 'Could not find "abc"' },
            valueDescriptors: List([{ display: 'abc', raw: 'abc' }]),
        });
        expect(parsePastedLookup(stringLookupCol, stringLookupValues, 'abc, valueD')).toStrictEqual({
            message: { message: 'Could not find "abc", "valueD". Please make sure values that contain commas are properly quoted.' },
            valueDescriptors: List([
                { display: 'abc', raw: 'abc' },
                { display: 'valueD', raw: 'valueD' },
            ]),
        });
    });

    test('int value', () => {
        expect(parsePastedLookup(intLookupCol, intLookupValues, 'A')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 1 }]),
        });
        expect(parsePastedLookup(intLookupCol, intLookupValues, 'a')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 1 }]),
        });
        expect(parsePastedLookup(intLookupCol, intLookupValues, 'A,B,b')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([
                { display: 'A', raw: 1 },
                { display: 'b', raw: 2 },
                { display: 'b', raw: 2 },
            ]),
        });

        expect(parsePastedLookup(intLookupCol, intLookupValues, 'abc')).toStrictEqual({
            message: { message: 'Could not find "abc"' },
            valueDescriptors: List([{ display: 'abc', raw: 'abc' }]),
        });
        expect(parsePastedLookup(intLookupCol, intLookupValues, 'abc, valueD')).toStrictEqual({
            message: { message: 'Could not find "abc", "valueD". Please make sure values that contain commas are properly quoted.' },
            valueDescriptors: List([
                { display: 'abc', raw: 'abc' },
                { display: 'valueD', raw: 'valueD' },
            ]),
        });
    });

    test('required column', () => {
        expect(parsePastedLookup(requiredLookupCol, stringLookupValues, 'A')).toStrictEqual({
            message: undefined,
            valueDescriptors: List([{ display: 'A', raw: 'a' }]),
        });
        [undefined, null, ''].forEach(val => {
            expect(parsePastedLookup(requiredLookupCol, stringLookupValues, val)).toStrictEqual({
                message: {
                    message: 'ReqLookCol is required.',
                },
                valueDescriptors: List([
                    {
                        display: val,
                        raw: val,
                    },
                ]),
            });
        });
    });
});

describe('insertPastedData', () => {
    test('paste starts at first selected cell', async () => {
        // Issue 51359
        const pkFk = 'rowId';
        const fkOne = 'field_one';
        const fkTwo = 'field_two';
        const queryInfo = QueryInfo.fromJsonForTests({
            pkCols: [pkFk],
            columns: {
                [pkFk]: new QueryColumn({
                    caption: 'Row Id',
                    fieldKey: pkFk,
                    inputType: 'number',
                }),
                [fkOne]: new QueryColumn({
                    caption: 'Field One',
                    fieldKey: fkOne,
                    inputType: 'string',
                }),
                [fkTwo]: new QueryColumn({
                    caption: 'Field Two',
                    fieldKey: fkTwo,
                    inputType: 'string',
                }),
            },
        });

        const baseEditorModel = new EditorModel({}).merge({
            cellMessages: Map<string, CellMessage>({
                '1-0': 'description 1 message',
            }),
            cellValues: Map<string, List<ValueDescriptor>>({
                [genCellKey(fkOne, 0)]: List<ValueDescriptor>([
                    {
                        display: 'qwer',
                        raw: 'qwer',
                    },
                ]),
                [genCellKey(fkOne, 1)]: List<ValueDescriptor>([
                    {
                        display: 'asdf',
                        raw: 'asdf',
                    },
                ]),
                [genCellKey(fkOne, 2)]: List<ValueDescriptor>([
                    {
                        display: 'zxcv',
                        raw: 'zxcv',
                    },
                ]),
                [genCellKey(fkTwo, 0)]: List<ValueDescriptor>([
                    {
                        display: 'yuio',
                        raw: 'yuio',
                    },
                ]),
                [genCellKey(fkTwo, 1)]: List<ValueDescriptor>([
                    {
                        display: 'hjkl',
                        raw: 'hjkl',
                    },
                ]),
                [genCellKey(fkTwo, 2)]: List<ValueDescriptor>([
                    {
                        display: 'nm',
                        raw: 'nm',
                    },
                ]),
            }),
            orderedColumns: List([fkOne, fkTwo]),
            columnMap: [fkOne, fkTwo].reduce((result, key) => {
                return result.set(key, queryInfo.getColumn(key));
            }, Map<string, QueryColumn>()),
            queryInfo,
            rowCount: 10,
        }) as EditorModel;

        const emWithColumnSelected = baseEditorModel.applyChanges({
            selectionCells: [genCellKey(fkOne, 0), genCellKey(fkOne, 1), genCellKey(fkOne, 2)],
            selectedColIdx: 0,
            selectedRowIdx: 2,
        });

        let changes = await validateAndInsertPastedData(
            emWithColumnSelected,
            'one\ntwo\nthree',
            undefined,
            true,
            true,
            undefined,
            true
        );
        let cellValues = changes.cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(List([{ display: 'two', raw: 'two' }]));
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'three', raw: 'three' }]));
        expect(changes.selectionCells).toEqual([genCellKey(fkOne, 0), genCellKey(fkOne, 1), genCellKey(fkOne, 2)]);

        cellValues = (
            await validateAndInsertPastedData(emWithColumnSelected, 'one', undefined, true, true, undefined, true)
        ).cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'one', raw: 'one' }]));

        const emWithCellSelected = baseEditorModel.applyChanges({
            selectedColIdx: 0,
            selectedRowIdx: 1,
        });
        cellValues = (
            await validateAndInsertPastedData(emWithCellSelected, 'one', undefined, true, true, undefined, true)
        ).cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'qwer', raw: 'qwer' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'zxcv', raw: 'zxcv' }]));

        // Pasting more data than we have cells selected should paste beyond the cells
        changes = await validateAndInsertPastedData(
            emWithCellSelected,
            'one\ntwo',
            undefined,
            true,
            true,
            undefined,
            true
        );
        cellValues = changes.cellValues;
        expect(cellValues.get(genCellKey(fkOne, 0))).toEqual(List([{ display: 'qwer', raw: 'qwer' }]));
        expect(cellValues.get(genCellKey(fkOne, 1))).toEqual(List([{ display: 'one', raw: 'one' }]));
        expect(cellValues.get(genCellKey(fkOne, 2))).toEqual(List([{ display: 'two', raw: 'two' }]));
        expect(changes.selectionCells).toEqual([genCellKey(fkOne, 1), genCellKey(fkOne, 2)]);
    });
});
