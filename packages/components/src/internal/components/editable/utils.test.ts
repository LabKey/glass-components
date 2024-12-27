import { List, Map } from 'immutable';

import { QueryInfo } from '../../../public/QueryInfo';
import { QueryColumn, QueryLookup } from '../../../public/QueryColumn';

import { DATE_RANGE_URI } from '../domainproperties/constants';

import sampleSetQueryInfoJSON from '../../../test/data/sampleSetAllFieldTypes-getQueryDetails.json';

import { EditableGridLoader, EditorMode } from './models';
import {
    computeRangeChange,
    genCellKey,
    genCellKeyPrefix,
    getValidatedEditableGridValue,
    parseCellKey,
    sortCellKeys,
} from './utils';
import { initEditorModel } from './actions';
import { Utils } from '@labkey/api';

class MockEditableGridLoader implements EditableGridLoader {
    columns: QueryColumn[];
    extraColumns: QueryColumn[];
    id: string;
    mode = EditorMode.Insert;
    queryInfo: QueryInfo;

    constructor(queryInfo: QueryInfo, props?: Partial<EditableGridLoader>) {
        this.queryInfo = queryInfo;
        this.columns = props?.columns;
        this.extraColumns = props?.extraColumns;
        this.id = props?.id ?? 'mockEditableGridLoader';
        this.mode = props?.mode;
    }

    fetch = jest.fn().mockResolvedValue({
        data: Map(),
        dataIds: List(),
    });
}

describe('Editable Grids Utils', () => {
    describe('initEditorModel', () => {
        const queryInfo = QueryInfo.fromJsonForTests(sampleSetQueryInfoJSON);

        test('defaults to insert columns', async () => {
            const loader = new MockEditableGridLoader(queryInfo);
            const expectedInsertColumns = queryInfo.getInsertColumns().map(col => col.fieldKey.toLowerCase());
            const editorModel = await initEditorModel(loader);
            expect(editorModel.cellValues.size).toEqual(0);
            expect(editorModel.orderedColumns.toArray()).toEqual(expectedInsertColumns);
        });

        test('respects loader mode for columns', async () => {
            const loader = new MockEditableGridLoader(queryInfo, { mode: EditorMode.Update });
            const expectedUpdateColumns = queryInfo
                .getUpdateColumns()
                .filter(col => !col.isFileInput)
                .map(col => col.fieldKey.toLowerCase());
            const editorModel = await initEditorModel(loader);
            expect(editorModel.orderedColumns.toArray()).toEqual(expectedUpdateColumns);
        });

        test('respects loader supplied columns', async () => {
            const columns = [queryInfo.getColumn('Name'), queryInfo.getColumn('Date')];
            const loader = new MockEditableGridLoader(queryInfo, { columns });
            const editorModel = await initEditorModel(loader);
            expect(editorModel.orderedColumns.toArray()).toEqual(columns.map(col => col.fieldKey.toLowerCase()));
        });

        test('respects loader extra columns', async () => {
            const columns = [queryInfo.getColumn('Name')];
            const extraColumns = [queryInfo.getColumn('Date')];
            const loader = new MockEditableGridLoader(queryInfo, { columns, extraColumns });
            const editorModel = await initEditorModel(loader);
            const { columnMap, orderedColumns } = editorModel;

            // Extra columns should not show up in the orderedColumns array
            expect(orderedColumns.find(col => col === extraColumns[0].fieldKey.toLowerCase())).toBeUndefined();
            // Extra columns should show up in the columnMap
            expect(columnMap.get('date')).toEqual(extraColumns[0]);
        });
    });
});

describe('getValidatedEditableGridValue', () => {
    const dateCol = new QueryColumn({ jsonType: 'date', rangeURI: DATE_RANGE_URI });
    const dateTimeCol = new QueryColumn({ jsonType: 'date' });

    test('no column', () => {
        expect(getValidatedEditableGridValue('2020-12-23', undefined)).toStrictEqual({
            message: undefined,
            value: '2020-12-23',
        });
        expect(getValidatedEditableGridValue('Bogus', undefined)).toStrictEqual({ message: undefined, value: 'Bogus' });
        expect(getValidatedEditableGridValue(true, undefined)).toStrictEqual({ message: undefined, value: true });
        expect(getValidatedEditableGridValue(13, undefined)).toStrictEqual({ message: undefined, value: 13 });
    });

    test('valid date value', () => {
        expect(getValidatedEditableGridValue('2020-12-23', dateCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23',
        });
        expect(getValidatedEditableGridValue('2020-12-23 00:00:00', dateCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23',
        });
        expect(getValidatedEditableGridValue('2020-12-23 14:34', dateCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23',
        });
        expect(getValidatedEditableGridValue(new Date('2020-12-23 14:34'), dateCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23',
        });
    });

    test('invalid date value', () => {
        expect(getValidatedEditableGridValue('BOGUS', dateCol)).toStrictEqual({
            message: {
                message: 'Invalid date, use format yyyy-MM-dd',
            },
            value: 'BOGUS',
        });
        expect(getValidatedEditableGridValue(true, dateCol)).toStrictEqual({
            message: {
                message: 'Invalid date, use format yyyy-MM-dd',
            },
            value: true,
        });
        expect(getValidatedEditableGridValue(13, dateCol).message).toBe(undefined);
        expect(getValidatedEditableGridValue('2020-12-INVALID 14:34', dateCol)).toStrictEqual({
            message: {
                message: 'Invalid date, use format yyyy-MM-dd',
            },
            value: '2020-12-INVALID 14:34',
        });
        expect(getValidatedEditableGridValue('2020-13-23 14:34', dateCol)).toStrictEqual({
            message: {
                message: 'Invalid date, use format yyyy-MM-dd',
            },
            value: '2020-13-23 14:34',
        });
        expect(getValidatedEditableGridValue(new Date('2020-13-23 14:34'), dateCol).message).toStrictEqual({
            message: 'Invalid date, use format yyyy-MM-dd',
        });
    });

    test('valid dateTimeCol value', () => {
        expect(getValidatedEditableGridValue('2020-12-23', dateTimeCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23 00:00:00',
        });
        expect(getValidatedEditableGridValue('2020-12-23 00:00:00', dateTimeCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23 00:00:00',
        });
        expect(getValidatedEditableGridValue('2020-12-23 14:34', dateTimeCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23 14:34:00',
        });
        expect(getValidatedEditableGridValue(new Date('2020-12-23 14:34'), dateTimeCol)).toStrictEqual({
            message: undefined,
            value: '2020-12-23 14:34:00',
        });
    });

    test('invalid dateTimeCol value', () => {
        expect(getValidatedEditableGridValue('BOGUS', dateTimeCol)).toStrictEqual({
            message: {
                message: 'Invalid date time, use format yyyy-MM-dd HH:mm',
            },
            value: 'BOGUS',
        });
        expect(getValidatedEditableGridValue(true, dateTimeCol)).toStrictEqual({
            message: {
                message: 'Invalid date time, use format yyyy-MM-dd HH:mm',
            },
            value: true,
        });
        expect(getValidatedEditableGridValue(13, dateTimeCol).message).toBe(undefined);
        expect(getValidatedEditableGridValue('2020-12-INVALID 14:34', dateTimeCol)).toStrictEqual({
            message: {
                message: 'Invalid date time, use format yyyy-MM-dd HH:mm',
            },
            value: '2020-12-INVALID 14:34',
        });
        expect(getValidatedEditableGridValue('2020-13-23 14:34', dateTimeCol)).toStrictEqual({
            message: {
                message: 'Invalid date time, use format yyyy-MM-dd HH:mm',
            },
            value: '2020-13-23 14:34',
        });
        expect(getValidatedEditableGridValue(new Date('2020-13-23 14:34'), dateTimeCol).message).toStrictEqual({
            message: 'Invalid date time, use format yyyy-MM-dd HH:mm',
        });
    });

    test('time column', () => {
        const timeCol = new QueryColumn({ jsonType: 'time' });

        let validValues: any[] = [null, undefined, '', ' '];
        let results = [null, undefined, '', ''];
        validValues.forEach((value, ind) => {
            expect(getValidatedEditableGridValue(value, timeCol)).toStrictEqual({
                message: undefined,
                value: results[ind],
            });
        });

        validValues = ['1:00 AM', '1:00 PM', '13:24'];
        results = [' 01:00', ' 13:00', ' 13:24'];
        validValues.forEach((value, ind) => {
            const result = getValidatedEditableGridValue(value, timeCol);
            expect(result.message).toBeUndefined();
            expect(result.value).toContain(results[ind]);
        });

        const invalidValues = ['Bogus', true, NaN];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, timeCol)).toStrictEqual({
                message: {
                    message: 'Invalid time',
                },
                value,
            });
        });
    });

    test('int column', () => {
        const intCol = new QueryColumn({ jsonType: 'int' });

        const validValues = [null, undefined, '', ' ', 0, -1, 100, 1.1e3, '100', '100 ', '0.0'];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, intCol)).toStrictEqual({
                message: undefined,
                value: Utils.isString(value) ? value.trim() : value,
            });
        });

        const invalidValues = [1.11, 'Bogus', true, NaN];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, intCol)).toStrictEqual({
                message: {
                    message: 'Invalid integer',
                },
                value,
            });
        });
    });

    test('float column', () => {
        const floatCol = new QueryColumn({ jsonType: 'float' });

        const validValues = [null, undefined, '', ' ', 0, -1, 100, 1.1e3, '100', '0.0', 1.11, '1.11', 123.456e2];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, floatCol)).toStrictEqual({ message: undefined, value: Utils.isString(value) ? value.trim() : value });
        });

        const invalidValues = [ 'Bogus', true, NaN];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, floatCol)).toStrictEqual({
                message: {
                    message: 'Invalid decimal',
                },
                value,
            });
        });
    });

    test('boolean column', () => {
        const boolCol = new QueryColumn({ jsonType: 'boolean' });

        const validValues = [
            null,
            undefined,
            '',
            'true',
            'true\r',
            't',
            'yes',
            'y',
            'on',
            '1',
            'false',
            ' false',
            ' false ',
            'f',
            'no',
            'n',
            'off',
            '0',
        ];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, boolCol)).toStrictEqual({
                message: undefined,
                value: Utils.isString(value) ? value.trim() : value,
            });
        });

        const invalidValues = ['tr', 'correct', 'wrong', '-1', '0.0', 'fail', 'bogus'];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, boolCol)).toStrictEqual({
                message: {
                    message: 'Invalid boolean',
                },
                value
            });
        });
    });

    test('text column', () => {
        const textCol = new QueryColumn({ jsonType: 'string', scale: 10 });

        const validValues = [null, undefined, '', ' ', 'a', 'ab', 'ab cd ef', 'ab cd efgh'];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, textCol)).toStrictEqual({
                message: undefined,
                value: value == undefined ? value : value.trim(),
            });
        });

        const invalidValues = ['ab cd efghi', 'ab cd efghi jkl'];
        invalidValues.forEach(value => {
            const result = getValidatedEditableGridValue(value, textCol);
            expect(result.message.message).toBe(value.length + '/10 characters');
        });
    });

    test('textchoice column', () => {
        const textChoiceCol = new QueryColumn({ jsonType: 'string', validValues: ['a', 'B'] });

        const validValues = [null, undefined, '', ' ', 'a', 'B'];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, textChoiceCol)).toStrictEqual({
                message: undefined,
                value: value == undefined ? value : value.trim(),
            });
        });

        const invalidValues = ['A', 'b', 'aB', 'ab', ' ab  '];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, textChoiceCol)).toStrictEqual({
                message: {
                    message: `'${value.trim()}' is not a valid choice`,
                },
                value: value.trim(),
            });
        });
    });

    test('required column', () => {
        const requiredCol = new QueryColumn({ jsonType: 'string', required: true, caption: 'ReqCol' });

        const validValues = ['a', 'B'];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, requiredCol)).toStrictEqual({ message: undefined, value });
        });

        const invalidValues = [null, undefined, '', ' '];
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, requiredCol)).toStrictEqual({
                message: {
                    message: 'ReqCol is required.',
                },
                value: value == undefined ? value : value.trim(),
            });
        });
    });

    test('lookup column', () => {
        const stringLookupCol = new QueryColumn({
            jsonType: 'string',
            caption: 'LookCol',
            scale: 10,
            lookup: { isPublic: true },
        });

        let validValues = [null, undefined, '', 'a', 'B', 1, 123, 'too long a value', 12345678901];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, stringLookupCol)).toStrictEqual({ message: undefined, value });
        });

        const intLookupCol = new QueryColumn({ jsonType: 'int', caption: 'LookCol', lookup: { isPublic: true } });
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, intLookupCol)).toStrictEqual({ message: undefined, value });
        });

        const requiredLookupCol = new QueryColumn({
            jsonType: 'string',
            required: true,
            caption: 'LookColReq',
            lookup: new QueryLookup({ isPublic: true }),
        });
        validValues = ['a', 'B', 1, 123];
        const invalidValues = [null, undefined, ''];
        validValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, requiredLookupCol)).toStrictEqual({
                message: undefined,
                value,
            });
        });
        invalidValues.forEach(value => {
            expect(getValidatedEditableGridValue(value, requiredLookupCol)).toStrictEqual({
                message: {
                    message: 'LookColReq is required.',
                },
                value,
            });
        });
    });
});

describe('other utils', () => {
    test('genCellKey', () => {
        expect(genCellKey('test', 0)).toBe('test&&0');
        expect(genCellKey('other', 2)).toBe('other&&2');
    });

    test('genCellKeyPrefix', () => {
        expect(genCellKeyPrefix('test')).toBe('test&&');
        expect(genCellKeyPrefix('TEST')).toBe('test&&');
    });

    test('parseCellKey', () => {
        expect(parseCellKey('test&&0').fieldKey).toBe('test');
        expect(parseCellKey('test&&0').rowIdx).toBe(0);
        expect(parseCellKey('other&&2').fieldKey).toBe('other');
        expect(parseCellKey('other&&2').rowIdx).toBe(2);
    });

    test('getSortedCellKeys', () => {
        const orderedColumns = ['test', 'other'];
        let unsorted = ['test&&0', 'other&&1', 'other&&1', 'test&&1', 'other&&0'];
        expect(sortCellKeys(orderedColumns, unsorted)).toStrictEqual(['test&&0', 'other&&0', 'test&&1', 'other&&1']);
        unsorted = ['other&&1', 'other&&15', 'test&&10', 'other&&5'];
        expect(sortCellKeys(orderedColumns, unsorted)).toStrictEqual(['other&&1', 'other&&5', 'test&&10', 'other&&15']);
    });

    test('computeRangeChange', () => {
        expect(computeRangeChange(4, 2, 4, 0)).toEqual([2, 4]);
        expect(computeRangeChange(4, 2, 4, 1)).toEqual([3, 4]);
        expect(computeRangeChange(4, 2, 4, -1)).toEqual([1, 4]);
        expect(computeRangeChange(4, 0, 4, -1)).toEqual([0, 4]);
        expect(computeRangeChange(5, 5, 7, 0)).toEqual([5, 7]);
        expect(computeRangeChange(5, 5, 7, 1)).toEqual([5, 8]);
        expect(computeRangeChange(5, 5, 7, -1)).toEqual([5, 6]);
    });
});
