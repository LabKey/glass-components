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

import {
    camelCaseToTitleCase,
    caseInsensitive,
    quoteValueWithDelimiters,
    findMissingValues,
    formatBytes,
    getCommonDataValues,
    getDisambiguatedSelectInputOptions,
    getIconFontCls,
    getUpdatedData,
    handleRequestFailure,
    intersect,
    isImage,
    isInteger,
    isIntegerInRange,
    isNonNegativeFloat,
    isNonNegativeInteger,
    parseCsvString,
    parseScientificInt,
    toLowerSafe,
    unorderedEqual,
    arrayEquals,
    capitalizeFirstChar,
    uncapitalizeFirstChar,
    withTransformedKeys,
    getValueFromRow,
} from './utils';

const emptyList = List<string>();

beforeAll(() => {
    LABKEY.container = {
        formats: {
            dateFormat: 'yyyy-MM-dd',
            dateTimeFormat: 'yyyy-MM-dd HH:mm',
            numberFormat: '#.##',
        },
    };
});

describe('intersect', () => {
    test('with matches', () => {
        expect(intersect(List<string>(['a', 'b', 'abc']), List<string>(['A', 'Z', 'aBC']))).toEqual(
            List<string>(['a', 'abc'])
        );
        expect(intersect(List(['fun', 'times']), List(['funny', 'times']))).toEqual(List(['times']));
    });

    test('without matches', () => {
        expect(intersect(List<string>(['one', 'two']), List(['sun', 'moon']))).toEqual(emptyList);
        expect(intersect(emptyList, List(['fun', 'times']))).toEqual(emptyList);
        expect(intersect(List(['fun', 'times']), emptyList)).toEqual(emptyList);
    });
});

describe('toLowerSafe', () => {
    test('strings', () => {
        expect(toLowerSafe(List<string>(['TEST ', ' Test', 'TeSt', 'test']))).toEqual(
            List<string>(['test ', ' test', 'test', 'test'])
        );
    });

    test('numbers', () => {
        expect(toLowerSafe(List<string>([1, 2, 3]))).toEqual(emptyList);
        expect(toLowerSafe(List<string>([1.0]))).toEqual(emptyList);
        expect(toLowerSafe(List<string>([1.0, 2]))).toEqual(emptyList);
    });

    test('strings and numbers', () => {
        expect(toLowerSafe(List<string>([1, 2, 'TEST ', ' Test', 3.0, 4.4, 'TeSt', 'test']))).toEqual(
            List<string>(['test ', ' test', 'test', 'test'])
        );
    });
});

describe('camelCaseToTitleCase', () => {
    test('function', () => {
        const testStrings = {
            textACRONYM: 'Text ACRONYM',
            camelCasedText: 'Camel Cased Text',
            CapsCasedText: 'Caps Cased Text',
            CapsCasedTextACRONYM: 'Caps Cased Text ACRONYM',
            ACRONYM: 'ACRONYM',
        };

        for (const [key, value] of Object.entries(testStrings)) {
            expect(camelCaseToTitleCase(key)).toEqual(value);
        }
    });
});

describe('capitalizeFirstChar', () => {
    test('capitalizeFirstChar', () => {
        const testStrings = {
            textACRONYM: 'TextACRONYM',
            camelCasedText: 'CamelCasedText',
            CapsCasedText: 'CapsCasedText',
        };

        for (const [key, value] of Object.entries(testStrings)) {
            expect(capitalizeFirstChar(key)).toEqual(value);
        }
    });
});

describe('uncapitalizeFirstChar', () => {
    test('uncapitalizeFirstChar', () => {
        const testStrings = {
            textACRONYM: 'textACRONYM',
            camelCasedText: 'camelCasedText',
            CapsCasedText: 'capsCasedText',
        };

        for (const [key, value] of Object.entries(testStrings)) {
            expect(uncapitalizeFirstChar(key)).toEqual(value);
        }
    });
});

describe('withTransformedKeys', () => {
    test('using capitalizeFirstChar', () => {
        const rawObj = {
            textACRONYM: 'val1',
            camelCasedText: 'val2',
            CapsCasedText: 'val3',
        };

        expect(withTransformedKeys(rawObj, capitalizeFirstChar)).toEqual({
            TextACRONYM: 'val1',
            CamelCasedText: 'val2',
            CapsCasedText: 'val3',
        });
    });

    test('using uncapitalizeFirstChar', () => {
        const rawObj = {
            textACRONYM: 'val1',
            camelCasedText: 'val2',
            CapsCasedText: 'val3',
        };

        expect(withTransformedKeys(rawObj, uncapitalizeFirstChar)).toEqual({
            textACRONYM: 'val1',
            camelCasedText: 'val2',
            capsCasedText: 'val3',
        });
    });
});

describe('unorderedEqual', () => {
    test('empty arrays', () => {
        expect(unorderedEqual([], [])).toBe(true);
    });

    test('different size arrays', () => {
        expect(unorderedEqual(['a'], ['b', 'a'])).toBe(false);
    });

    test('same size but differnet elements', () => {
        expect(unorderedEqual(['a', 'b'], ['b', 'c'])).toBe(false);
    });

    test('elements in different order', () => {
        expect(unorderedEqual(['a', 'b', 'c', 'd'], ['d', 'c', 'a', 'b'])).toBe(true);
    });

    test('equal arrays, same order', () => {
        expect(unorderedEqual(['a', 'b', 'c', 'd'], ['a', 'b', 'c', 'd'])).toBe(true);
    });
});

describe('getCommonDataForSelection', () => {
    test('nothing common', () => {
        const data = fromJS({
            '1': {
                field1: {
                    value: 'value1',
                },
                field2: {
                    value: 'value2',
                },
            },
            '2': {
                field1: {
                    value: 'value3',
                },
                field2: {
                    value: 'value4',
                },
            },
        });
        expect(getCommonDataValues(data)).toEqual({});
    });

    test('undefined and missing values', () => {
        const data = fromJS({
            '1': {
                field1: {
                    value: undefined,
                },
                field2: {
                    value: 'value2',
                },
                field3: {
                    value: 'value3',
                },
                field4: {
                    value: 'same',
                },
            },
            '2': {
                field1: {
                    value: 'value1',
                },
                field2: {
                    value: 'value2b',
                },
                field3: {
                    value: null,
                },
                field4: {
                    value: 'same',
                },
            },
        });
        expect(getCommonDataValues(data)).toEqual({
            field4: 'same',
        });
    });

    test('same common values', () => {
        const data = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Value: {
                    value: null,
                },
                Data: {
                    value: 'data1',
                },
                AndAgain: {
                    value: 'again',
                },
                Name: {
                    value: 'S-20190516-9042',
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Other: {
                    value: 'other1',
                },
            },
            '447': {
                RowId: {
                    value: 447,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447',
                },
                Value: {
                    value: null,
                },
                Data: {
                    value: 'data1',
                },
                AndAgain: {
                    value: 'again',
                },
                Name: {
                    value: 'S-20190516-4622',
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447',
                },
                Other: {
                    value: 'other2',
                },
            },
            '446': {
                RowId: {
                    value: 446,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446',
                },
                Value: {
                    value: 'val',
                },
                Data: {
                    value: 'data1',
                },
                AndAgain: {
                    value: 'again',
                },
                Name: {
                    value: 'S-20190516-2368',
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446',
                },
                Other: {
                    value: 'other3',
                },
            },
            '445': {
                RowId: {
                    value: 445,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445',
                },
                Value: {
                    value: 'val',
                },
                Data: {
                    value: 'data1',
                },
                AndAgain: {
                    value: 'again',
                },
                Name: {
                    value: 'S-20190516-9512',
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445',
                },
                Other: {
                    value: null,
                },
            },
            '367': {
                RowId: {
                    value: 367,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=367',
                },
                Value: {
                    value: null,
                },
                Data: {
                    value: 'data1',
                },
                AndAgain: {
                    value: 'again',
                },
                Name: {
                    value: 'S-20190508-5534',
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=367',
                },
                Other: {
                    value: null,
                },
            },
        });
        expect(getCommonDataValues(data)).toEqual({
            AndAgain: 'again',
            Data: 'data1',
        });
    });
});

describe('getUpdatedData', () => {
    const originalData = fromJS({
        '448': {
            RowId: {
                value: 448,
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
            },
            Value: {
                value: null,
            },
            Data: {
                value: 'data1',
            },
            'And/Again': {
                value: 'again',
            },
            Name: {
                value: 'S-20190516-9042',
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
            },
            Other: {
                value: 'other1',
            },
        },
        '447': {
            RowId: {
                value: 447,
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447',
            },
            Value: {
                value: null,
            },
            Data: {
                value: 'data1',
            },
            'And/Again': {
                value: 'again',
            },
            Name: {
                value: 'S-20190516-4622',
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=447',
            },
            Other: {
                value: 'other2',
            },
        },
        '446': {
            RowId: {
                value: 446,
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446',
            },
            Value: {
                value: 'val',
            },
            Data: {
                value: 'data1',
            },
            'And/Again': {
                value: 'again',
            },
            Name: {
                value: 'S-20190516-2368',
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=446',
            },
            Other: {
                value: 'other3',
            },
        },
        '445': {
            RowId: {
                value: 445,
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445',
            },
            Value: {
                value: 'val',
            },
            Data: {
                value: 'data1',
            },
            'And/Again': {
                value: 'again',
            },
            Name: {
                value: 'S-20190516-9512',
                url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=445',
            },
            Other: {
                value: null,
            },
        },
    });

    test('empty updates', () => {
        const updatedData = getUpdatedData(originalData, {}, List<string>(['RowId']));
        expect(updatedData).toHaveLength(0);
    });

    test('updated values did not change', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                Data: 'data1',
                And$SAgain: 'again',
            },
            List<string>(['RowId'])
        );
        expect(updatedData).toHaveLength(0);
    });

    test('changed values for some', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                Value: 'val',
                Data: 'data1',
                And$SAgain: 'again',
                Other: 'other3',
            },
            List<string>(['RowId'])
        );
        expect(updatedData).toHaveLength(3);
        expect(updatedData[0]).toStrictEqual({
            RowId: 445,
            Other: 'other3',
        });
        expect(updatedData[1]).toStrictEqual({
            RowId: 447,
            Value: 'val',
            Other: 'other3',
        });
        expect(updatedData[2]).toStrictEqual({
            RowId: 448,
            Value: 'val',
            Other: 'other3',
        });
    });

    test('changed values for all', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                Value: 'val2',
                Data: 'data2',
                And$SAgain: 'again2',
                Other: 'not another',
            },
            List<string>(['RowId'])
        );
        expect(updatedData).toHaveLength(4);
        expect(updatedData[0]).toStrictEqual({
            RowId: 445,
            Value: 'val2',
            Data: 'data2',
            'And/Again': 'again2',
            Other: 'not another',
        });
        expect(updatedData[1]).toStrictEqual({
            RowId: 446,
            Value: 'val2',
            Data: 'data2',
            'And/Again': 'again2',
            Other: 'not another',
        });
        expect(updatedData[2]).toStrictEqual({
            RowId: 447,
            Value: 'val2',
            Data: 'data2',
            'And/Again': 'again2',
            Other: 'not another',
        });
        expect(updatedData[3]).toStrictEqual({
            RowId: 448,
            Value: 'val2',
            Data: 'data2',
            'And/Again': 'again2',
            Other: 'not another',
        });
    });

    test('removed values', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                Value: null,
                And$SAgain: undefined,
                Other: 'not another',
            },
            List<string>(['RowId'])
        );
        expect(updatedData).toHaveLength(4);
        expect(updatedData[0]).toStrictEqual({
            RowId: 445,
            Value: null,
            'And/Again': null,
            Other: 'not another',
        });
        expect(updatedData[1]).toStrictEqual({
            RowId: 446,
            Value: null,
            'And/Again': null,
            Other: 'not another',
        });
        expect(updatedData[2]).toStrictEqual({
            RowId: 447,
            'And/Again': null,
            Other: 'not another',
        });
        expect(updatedData[3]).toStrictEqual({
            RowId: 448,
            'And/Again': null,
            Other: 'not another',
        });
    });

    test('same int value with string', () => {
        const originalData = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                IntValue: {
                    value: 123,
                },
            },
        });
        const updatedData = getUpdatedData(
            originalData,
            {
                IntValue: '123',
            },
            List<string>(['RowId'])
        );
        expect(updatedData).toHaveLength(0);
    });

    test('different int value with string', () => {
        const originalData = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                IntValue: {
                    value: 123,
                },
            },
        });
        const updatedData = getUpdatedData(
            originalData,
            {
                IntValue: '234',
            },
            List<string>(['RowId'])
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            IntValue: '234',
        });
    });

    test('Update multi value by displayValue', () => {
        const originalData = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Alias: List<string>([
                    Map<string, number>({ displayValue: 'alias1', value: 1 }),
                    Map<string, number>({ displayValue: 'alias2', value: 2 }),
                ]),
            },
        });

        const updatedData = getUpdatedData(
            originalData,
            {
                Alias: ['alias3'],
            },
            List<string>(['RowId'])
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            Alias: ['alias3'],
        });
    });

    test('Update multi value by value', () => {
        const originalData = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Alias: List<string>([
                    Map<string, number>({ displayValue: 'alias1', value: 1 }),
                    Map<string, number>({ displayValue: 'alias2', value: 2 }),
                ]),
            },
        });

        const updatedData = getUpdatedData(
            originalData,
            {
                Alias: [2],
            },
            List<string>(['RowId'])
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            Alias: ['alias2'],
        });
    });

    test('Delete multi value', () => {
        const originalData = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Alias: List<string>([
                    Map<string, number>({ displayValue: 'alias1', value: 1 }),
                    Map<string, number>({ displayValue: 'alias2', value: 2 }),
                ]),
            },
        });

        const updatedData = getUpdatedData(
            originalData,
            {
                Alias: [],
            },
            List<string>(['RowId'])
        );
        expect(updatedData).toHaveLength(1);
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            Alias: [],
        });
    });

    test('with additionalCols', () => {
        const updatedData = getUpdatedData(
            originalData,
            {
                Value: 'val',
                And$SAgain: 'again',
                Other: 'other3',
            },
            List<string>(['RowId']),
            ['Data']
        );
        expect(updatedData).toHaveLength(3);
        expect(updatedData[0]).toStrictEqual({
            RowId: 445,
            Other: 'other3',
            Data: 'data1',
        });
        expect(updatedData[1]).toStrictEqual({
            RowId: 447,
            Value: 'val',
            Other: 'other3',
            Data: 'data1',
        });
        expect(updatedData[2]).toStrictEqual({
            RowId: 448,
            Value: 'val',
            Other: 'other3',
            Data: 'data1',
        });
    });

    test('with folder', () => {
        const originalData_ = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Value: {
                    value: null,
                },
                Data: {
                    value: 'data1',
                },
                'And/Again': {
                    value: 'again',
                },
                Name: {
                    value: 'S-20190516-9042',
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Other: {
                    value: 'other1',
                },
                Folder: {
                    displayValue: 'ProjectA',
                    value: 'ENTITYID-A',
                },
            },
        });

        const updatedData = getUpdatedData(
            originalData_,
            {
                Value: 'val',
                And$SAgain: 'again',
                Other: 'other3',
            },
            List<string>(['RowId'])
        );
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            Value: 'val',
            Other: 'other3',
            Folder: 'ENTITYID-A',
        });
    });

    test('with container', () => {
        const originalData_ = fromJS({
            '448': {
                RowId: {
                    value: 448,
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Value: {
                    value: null,
                },
                Data: {
                    value: 'data1',
                },
                'And/Again': {
                    value: 'again',
                },
                Name: {
                    value: 'S-20190516-9042',
                    url: '/labkey/Sample%20Management/experiment-showMaterial.view?rowId=448',
                },
                Other: {
                    value: 'other1',
                },
                Container: {
                    displayValue: 'ProjectA',
                    value: 'ENTITYID-A',
                },
            },
        });

        const updatedData = getUpdatedData(
            originalData_,
            {
                Value: 'val',
                And$SAgain: 'again',
                Other: 'other3',
            },
            List<string>(['RowId'])
        );
        expect(updatedData[0]).toStrictEqual({
            RowId: 448,
            Value: 'val',
            Other: 'other3',
            Container: 'ENTITYID-A',
        });
    });
});

describe('CaseInsensitive', () => {
    test('Empty values', () => {
        expect(caseInsensitive(undefined, undefined)).toBeUndefined();
        expect(caseInsensitive(null, null)).toBeUndefined();
        expect(caseInsensitive({}, '')).toBeUndefined();
    });

    test('Case conversions', () => {
        expect(caseInsensitive({ x: -1, xX: -2 }, 'x')).toEqual(-1);
        expect(caseInsensitive({ x: -1, xX: -2 }, 'X')).toEqual(-1);
        expect(caseInsensitive({ x: -1, xX: -2 }, 'xx')).toEqual(-2);
        expect(caseInsensitive({ x: -1, xX: -2 }, 'X')).toEqual(-1);
        expect(caseInsensitive({ 'special-key': 42 }, 'special key')).toBeUndefined();
        expect(caseInsensitive({ 'special-key': 42 }, 'special-key')).toEqual(42);
    });
});

const sourceOptions = [
    {
        value: 'urn:lsid:labkey.com:Data.Folder-8:81c1e0b7-c884-1038-ba3d-f653126805a6',
        label: 'Source-1 (sourceType1)',
    },
    {
        value: 'urn:lsid:labkey.com:Data.Folder-8:3d55fee0-d81c-1038-b2c8-93ec7daaff14',
        label: 'Source-1 (sourceType2)',
    },
    {
        value: 'urn:lsid:labkey.com:Data.Folder-8:81c1e0c4-c884-1038-ba3d-f653126805a6',
        label: 'Source-2',
    },
];

describe('getDisambiguatedSelectInputOptions', () => {
    test('from QueryGridModel data', () => {
        const rows = [
            {
                links: null,
                lsid: { value: 'urn:lsid:labkey.com:Data.Folder-8:81c1e0b7-c884-1038-ba3d-f653126805a6' },
                SourceType: { url: '#/rd/dataclass/sourceType1', value: 'sourceType1' },
                rowId: { value: 57 },
                Name: { value: 'Source-1' },
            },
            {
                links: null,
                lsid: { value: 'urn:lsid:labkey.com:Data.Folder-8:81c1e0c4-c884-1038-ba3d-f653126805a6' },
                SourceType: { url: '#/rd/dataclass/sourceType1', value: 'sourceType1' },
                rowId: { value: 58 },
                Name: { value: 'Source-2' },
            },
            {
                links: null,
                lsid: { value: 'urn:lsid:labkey.com:Data.Folder-8:3d55fee0-d81c-1038-b2c8-93ec7daaff14' },
                SourceType: { url: '#/rd/dataclass/sourceType2', value: 'sourceType2' },
                rowId: { value: 65 },
                Name: { value: 'Source-1' },
            },
        ];

        expect(getDisambiguatedSelectInputOptions(fromJS(rows), 'lsid', 'Name', 'SourceType')).toEqual(
            expect.arrayContaining([
                expect.objectContaining(sourceOptions[0]),
                expect.objectContaining(sourceOptions[1]),
                expect.objectContaining(sourceOptions[2]),
            ])
        );
    });

    test('from selectRows result', () => {
        const rows = {
            '0': {
                lsid: { value: 'urn:lsid:labkey.com:Data.Folder-8:81c1e0b7-c884-1038-ba3d-f653126805a6' },
                SourceType: {
                    value: 'sourceType1',
                },
                rowId: { value: 57 },
                Name: { value: 'Source-1' },
            },
            '1': {
                lsid: { value: 'urn:lsid:labkey.com:Data.Folder-8:81c1e0c4-c884-1038-ba3d-f653126805a6' },
                SourceType: {
                    value: 'sourceType1',
                },
                rowId: { value: 58 },
                Name: { value: 'Source-2' },
            },
            '2': {
                lsid: { value: 'urn:lsid:labkey.com:Data.Folder-8:3d55fee0-d81c-1038-b2c8-93ec7daaff14' },
                SourceType: {
                    value: 'sourceType2',
                },
                rowId: { value: 65 },
                Name: { value: 'Source-1' },
            },
        };
        expect(getDisambiguatedSelectInputOptions(rows, 'lsid', 'Name', 'SourceType')).toEqual(
            expect.arrayContaining([
                expect.objectContaining(sourceOptions[0]),
                expect.objectContaining(sourceOptions[1]),
                expect.objectContaining(sourceOptions[2]),
            ])
        );
    });
});

describe('parseScientificInt', () => {
    test('check numeric input', () => {
        // empty input
        expect(parseScientificInt(null)).toBe(undefined);
        expect(parseScientificInt(undefined)).toBe(undefined);
        expect(parseScientificInt('')).toBe(undefined);
        expect(parseScientificInt(' ')).toBe(undefined);

        // not number
        expect(parseScientificInt(NaN)).toBe(NaN);
        expect(parseScientificInt('abc')).toBe(NaN);
        expect(parseScientificInt(NaN)).toBe(NaN);
        expect(parseScientificInt('abc')).toBe(NaN);

        // integer
        expect(parseScientificInt('-4e2')).toBe(-400);
        expect(parseScientificInt(-4e2)).toBe(-400);
        expect(parseScientificInt('-1')).toBe(-1);
        expect(parseScientificInt(-1)).toBe(-1);
        expect(parseScientificInt('123')).toBe(123);
        expect(parseScientificInt('123.0')).toBe(123);
        expect(parseScientificInt(123)).toBe(123);
        expect(parseScientificInt(123.0)).toBe(123);
        expect(parseScientificInt('4e2')).toBe(400);
        expect(parseScientificInt(4e2)).toBe(400);

        // zero
        expect(parseScientificInt('0')).toBe(0);
        expect(parseScientificInt('0.0')).toBe(0);
        expect(parseScientificInt(0)).toBe(0);
        expect(parseScientificInt(0.0)).toBe(0);

        // float
        expect(parseScientificInt('123.456')).toBe(123);
        expect(parseScientificInt(0.123)).toBe(0);
        expect(parseScientificInt(123.456e2)).toBe(12345);
        expect(parseScientificInt(0.123e2)).toBe(12);
        expect(parseScientificInt(-123.456e2)).toBe(-12345);
        expect(parseScientificInt(-0.123e2)).toBe(-12);
    });
});

describe('isInteger', () => {
    test('check numeric input', () => {
        // empty input
        expect(isInteger(null)).toBe(false);
        expect(isInteger(undefined)).toBe(false);
        expect(isInteger('')).toBe(false);
        expect(isInteger(' ')).toBe(false);

        // not number
        expect(isInteger(NaN)).toBe(false);
        expect(isInteger('abc')).toBe(false);
        expect(isInteger(NaN)).toBe(false);
        expect(isInteger('abc')).toBe(false);

        // integer
        expect(isInteger('-4e2')).toBe(true);
        expect(isInteger(-4e2)).toBe(true);
        expect(isInteger('-1')).toBe(true);
        expect(isInteger(-1)).toBe(true);
        expect(isInteger('123')).toBe(true);
        expect(isInteger('123.0')).toBe(true);
        expect(isInteger(123)).toBe(true);
        expect(isInteger(123.0)).toBe(true);
        expect(isInteger('4e2')).toBe(true);
        expect(isInteger(4e2)).toBe(true);

        // zero
        expect(isInteger('0')).toBe(true);
        expect(isInteger('0.0')).toBe(true);
        expect(isInteger(0)).toBe(true);
        expect(isInteger(0.0)).toBe(true);

        // float
        expect(isInteger('123.456')).toBe(false);
        expect(isInteger(0.123)).toBe(false);
        expect(isInteger(123.456e2)).toBe(false);
        expect(isInteger(0.123e2)).toBe(false);
        expect(isInteger(-123.456e2)).toBe(false);
        expect(isInteger(-0.123e2)).toBe(false);
    });
});

describe('isNonNegativeInteger and isNonNegativeFloat', () => {
    test('check numeric input', () => {
        // empty input
        expect(isNonNegativeFloat(null)).toBe(false);
        expect(isNonNegativeFloat(undefined)).toBe(false);
        expect(isNonNegativeFloat('')).toBe(false);
        expect(isNonNegativeInteger(null)).toBe(false);
        expect(isNonNegativeInteger(undefined)).toBe(false);
        expect(isNonNegativeInteger('')).toBe(false);

        // not number
        expect(isNonNegativeFloat(NaN)).toBe(false);
        expect(isNonNegativeFloat('abc')).toBe(false);
        expect(isNonNegativeInteger(NaN)).toBe(false);
        expect(isNonNegativeInteger('abc')).toBe(false);

        // negative
        expect(isNonNegativeFloat('-1.1')).toBe(false);
        expect(isNonNegativeFloat(-1.1)).toBe(false);
        expect(isNonNegativeFloat('-4e2')).toBe(false);
        expect(isNonNegativeFloat(-4e2)).toBe(false);
        expect(isNonNegativeInteger('-1')).toBe(false);
        expect(isNonNegativeInteger(-1)).toBe(false);

        // zero
        expect(isNonNegativeFloat('0')).toBe(true);
        expect(isNonNegativeFloat('0.0')).toBe(true);
        expect(isNonNegativeFloat(0)).toBe(true);
        expect(isNonNegativeFloat(0.0)).toBe(true);
        expect(isNonNegativeInteger('0')).toBe(true);
        expect(isNonNegativeInteger(0)).toBe(true);

        // positive float
        expect(isNonNegativeFloat('123.456')).toBe(true);
        expect(isNonNegativeFloat('0.123')).toBe(true);
        expect(isNonNegativeFloat(123.456)).toBe(true);
        expect(isNonNegativeFloat(0.123)).toBe(true);
        expect(isNonNegativeInteger('123.456')).toBe(false);
        expect(isNonNegativeInteger('0.123')).toBe(false);
        expect(isNonNegativeInteger(123.456)).toBe(false);
        expect(isNonNegativeInteger(0.123)).toBe(false);
        expect(isNonNegativeInteger(123.456e2)).toBe(false);
        expect(isNonNegativeInteger(0.123e2)).toBe(false);

        // positive int
        expect(isNonNegativeFloat('123')).toBe(true);
        expect(isNonNegativeFloat('123.0')).toBe(true);
        expect(isNonNegativeFloat(123)).toBe(true);
        expect(isNonNegativeFloat(123.0)).toBe(true);
        expect(isNonNegativeInteger('123')).toBe(true);
        expect(isNonNegativeInteger('123.0')).toBe(true);
        expect(isNonNegativeInteger(123)).toBe(true);
        expect(isNonNegativeInteger(123.0)).toBe(true);
        expect(isNonNegativeInteger('4e2')).toBe(true);
        expect(isNonNegativeInteger(4e2)).toBe(true);
    });
});

describe('isIntegerInRange', () => {
    test('check full range', () => {
        expect(isIntegerInRange(4, 3, 5)).toBe(true);
        expect(isIntegerInRange(5, 3, 5)).toBe(true);
        expect(isIntegerInRange(5, 3.1, 5.4)).toBe(true);
        expect(isIntegerInRange(4, 4, 40)).toBe(true);
        expect(isIntegerInRange(1, 0, 10)).toBe(true);
        expect(isIntegerInRange(0, 0, 10)).toBe(true);
        expect(isIntegerInRange(10, 10, 10)).toBe(true);
        expect(isIntegerInRange(1e2, 1, 1000)).toBe(true);
        expect(isIntegerInRange(-10, -11, -9)).toBe(true);
        expect(isIntegerInRange(-1e1, -11, -9)).toBe(true);
    });

    test('check inverted range', () => {
        expect(isIntegerInRange(10, 11, 9)).toBe(false);
    });

    test('no maximum', () => {
        expect(isIntegerInRange(10, 10)).toBe(true);
        expect(isIntegerInRange(10, -1)).toBe(true);
    });

    test('no minimum', () => {
        expect(isIntegerInRange(4, undefined, 5)).toBe(true);
        expect(isIntegerInRange(4, null, 5)).toBe(true);
        expect(isIntegerInRange(5, null, 5)).toBe(true);
    });

    test('no maximum or minimum', () => {
        expect(isIntegerInRange(5, null, undefined)).toBe(true);
    });

    test('not an integer', () => {
        expect(isIntegerInRange(5.4, null, undefined)).toBe(false);
        expect(isIntegerInRange(5.4, 4.4, 7)).toBe(false);
        expect(isIntegerInRange(5.4, 4, 7)).toBe(false);
        expect(isIntegerInRange(undefined, 4, 7)).toBe(false);
        expect(isIntegerInRange(null, 4, 7)).toBe(false);
        expect(isIntegerInRange(123e-2, 1, 100)).toBe(false);
    });
});

describe('isImage', () => {
    test('default', () => {
        expect(isImage('test')).toBeFalsy();
        expect(isImage('test.txt')).toBeFalsy();
        expect(isImage('test.jpg')).toBeTruthy();
        expect(isImage('test.png')).toBeTruthy();
        expect(isImage('test.PNG')).toBeTruthy();
    });
});

describe('getIconFontCls', () => {
    test('default', () => {
        expect(getIconFontCls(undefined)).toBe(undefined);
        expect(getIconFontCls(null)).toBe(undefined);
        expect(getIconFontCls('test')).toBe('fa fa-file-o');
        expect(getIconFontCls('test.txt')).toBe('fa fa-file-text-o');
        expect(getIconFontCls('test.jpg')).toBe('fa fa-file-image-o');
    });
});

describe('formatBytes', () => {
    test('unknown and zero bytes', () => {
        expect(formatBytes(undefined)).toBe('Size unknown');
        expect(formatBytes(null)).toBe('Size unknown');
        expect(formatBytes(0)).toBe('0 Bytes');
    });

    test('with bytes', () => {
        expect(formatBytes(1)).toBe('1 Bytes');
        expect(formatBytes(10000)).toBe('9.77 KB');
        expect(formatBytes(10000000)).toBe('9.54 MB');
        expect(formatBytes(10000000000)).toBe('9.31 GB');
    });

    test('non default decimals', () => {
        expect(formatBytes(1234, 3)).toBe('1.205 KB');
    });
});

describe('handleRequestFailure', () => {
    test('handles failure', () => {
        const badResponse = { responseJSON: { error: 'This is bad' } };
        const reject = jest.fn();
        handleRequestFailure(reject)(badResponse as any, undefined);
        expect(reject).toHaveBeenCalledWith(expect.objectContaining({ error: 'This is bad' }));
    });
    test('with response status', () => {
        const badResponse = { responseJSON: { error: 'This is bad' }, status: 500 };
        const reject = jest.fn();
        handleRequestFailure(reject)(badResponse as any, undefined);
        expect(reject).toHaveBeenCalledWith(expect.objectContaining({ error: 'This is bad', status: 500 }));
    });
});

describe('findMissingValues', () => {
    test('no gaps', () => {
        expect(findMissingValues([], [])).toStrictEqual([]);
        expect(findMissingValues([1], ['a'])).toStrictEqual([]);
        expect(findMissingValues([1, 2, 3], ['a', 'b', 'c'])).toStrictEqual([]);
    });

    test('gap at beginning', () => {
        expect(findMissingValues([3], ['a', 'b', 'c'])).toStrictEqual(['a', 'b']);
        expect(findMissingValues([2, 3, 4], ['a', 'b', 'c', 'd'])).toStrictEqual(['a']);
    });

    test('gap at end', () => {
        expect(findMissingValues([1, 2], ['a', 'b', 'c'])).toStrictEqual(['c']);
        expect(findMissingValues([1], ['a', 'b', 'c', 'd'])).toStrictEqual(['b', 'c', 'd']);
    });

    test('gap in middle', () => {
        expect(findMissingValues([1, 2, 4, 6], ['a', 'b', 'c', 'd', 'e', 'f'])).toStrictEqual(['c', 'e']);
        expect(findMissingValues([1, 6], ['a', 'b', 'c', 'd', 'e', 'f'])).toStrictEqual(['b', 'c', 'd', 'e']);
    });

    test('gaps everywhere', () => {
        expect(findMissingValues([2, 4, 6], ['a', 'b', 'c', 'd', 'e', 'f'])).toStrictEqual(['a', 'c', 'e']);
        expect(findMissingValues([3], ['a', 'b', 'c', 'd', 'e', 'f'])).toStrictEqual(['a', 'b', 'd', 'e', 'f']);
    });
});

describe('parseCsvString', () => {
    test('no value', () => {
        expect(parseCsvString(null, ',')).toBeUndefined();
        expect(parseCsvString(undefined, ';')).toBeUndefined();
        expect(parseCsvString('', undefined)).toBeUndefined();
        expect(parseCsvString(null, undefined)).toBeUndefined();
    });

    test('no quotes', () => {
        expect(parseCsvString('', '\t')).toStrictEqual([]);
        expect(parseCsvString('abcd', ' ')).toStrictEqual(['abcd']);
        expect(parseCsvString('a,b,c', ',')).toStrictEqual(['a', 'b', 'c']);
        expect(parseCsvString(',b,c,', ',')).toStrictEqual(['', 'b', 'c']);
        expect(parseCsvString('a,,c', ',')).toStrictEqual(['a', '', 'c']);
        expect(parseCsvString('a\tb\tc', '\t')).toStrictEqual(['a', 'b', 'c']);
    });

    test('quote as delimiter', () => {
        expect(() => parseCsvString('a"b"c"', '"')).toThrow('Unsupported delimiter: "');
    });

    test('quoted values', () => {
        expect(parseCsvString('a,"b","c,d"', ',')).toStrictEqual(['a', '"b"', '"c,d"']);
        expect(parseCsvString(',"b","c,d"', ',')).toStrictEqual(['', '"b"', '"c,d"']);
        expect(parseCsvString('a,"b","c', ',')).toStrictEqual(['a', '"b"', '"c']);
        expect(parseCsvString('a,"b",c"', ',')).toStrictEqual(['a', '"b"', 'c"']);
        expect(parseCsvString('"b"', ',')).toStrictEqual(['"b"']);
    });

    test('double quotes', () => {
        expect(parseCsvString('a,"b""b2","c,d"', ',')).toStrictEqual(['a', '"b""b2"', '"c,d"']);
        expect(parseCsvString('"b""b2""b3"""', ',')).toStrictEqual(['"b""b2""b3"""']);
    });

    test('remove quotes', () => {
        expect(parseCsvString('a,"b","c,d"', ',', true)).toStrictEqual(['a', 'b', 'c,d']);
        expect(parseCsvString(',"b","c,d"', ',', true)).toStrictEqual(['', 'b', 'c,d']);
        expect(parseCsvString('a,"b","c', ',', true)).toStrictEqual(['a', 'b', 'c']);
        expect(parseCsvString('a,"b",c"', ',', true)).toStrictEqual(['a', 'b', 'c"']);
        expect(parseCsvString('"b"', ',', true)).toStrictEqual(['b']);
        expect(parseCsvString('a,"b""b2","c,d"', ',', true)).toStrictEqual(['a', 'b"b2', 'c,d']);
        expect(parseCsvString('"b""b2""b3"""', ',', true)).toStrictEqual(['b"b2"b3"']);
    });
});

describe('quoteValueWithDelimiters', () => {
    test('no value', () => {
        expect(quoteValueWithDelimiters(undefined, ',')).toBeUndefined();
        expect(quoteValueWithDelimiters(null, ';')).toBeNull();
        expect(quoteValueWithDelimiters('', ' ')).toBe('');
    });

    test('non-string value', () => {
        expect(quoteValueWithDelimiters(4, ',')).toBe(4);
        expect(quoteValueWithDelimiters(4, undefined)).toBe(4);
        expect(quoteValueWithDelimiters({ value: '4,5' }, undefined)).toStrictEqual({ value: '4,5' });
        expect(quoteValueWithDelimiters([4, 5, 6], ',')).toStrictEqual([4, 5, 6]);
    });

    test('invalid delimiter', () => {
        expect(() => quoteValueWithDelimiters('value', undefined)).toThrow('Delimiter is required.');
        expect(() => quoteValueWithDelimiters('value', null)).toThrow('Delimiter is required.');
        expect(() => quoteValueWithDelimiters('value', '')).toThrow('Delimiter is required.');
    });

    test('without delimiter in value', () => {
        expect(quoteValueWithDelimiters('abc d', ',')).toBe('abc d');
        expect(quoteValueWithDelimiters('a', ';')).toBe('a');
    });

    test('with delimiter', () => {
        expect(quoteValueWithDelimiters('abc,d', ',')).toBe('"abc,d"');
        expect(quoteValueWithDelimiters('ab "cd,e"', ',')).toBe('"ab ""cd,e"""');
        expect(quoteValueWithDelimiters('ab, "cd,e"', ',')).toBe('"ab, ""cd,e"""');
    });

    test('round trip', () => {
        const initialString = 'ab "cd,e"';
        expect(parseCsvString(quoteValueWithDelimiters(initialString, ','), ',', true)).toStrictEqual([initialString]);
    });
});

describe('arrayEquals', () => {
    test('ignore order, case sensitive', () => {
        expect(arrayEquals(undefined, undefined)).toBeTruthy();
        expect(arrayEquals(undefined, null)).toBeTruthy();
        expect(arrayEquals([], [])).toBeTruthy();
        expect(arrayEquals(null, [])).toBeFalsy();
        expect(arrayEquals(['a'], null)).toBeFalsy();
        expect(arrayEquals(['a'], ['a'])).toBeTruthy();
        expect(arrayEquals(['a'], ['A'])).toBeFalsy();
        expect(arrayEquals(['a', 'b'], ['a'])).toBeFalsy();
        expect(arrayEquals(['a', 'b'], ['b', 'a'])).toBeTruthy();
        expect(arrayEquals(['a', 'b'], ['A', 'b'])).toBeFalsy();
        expect(arrayEquals(['a', 'b'], ['B', 'A'])).toBeFalsy();
    });

    test('ignore order, case insensitive', () => {
        expect(arrayEquals(['a'], null, true, true)).toBeFalsy();
        expect(arrayEquals(['a'], ['a'], true, true)).toBeTruthy();
        expect(arrayEquals(['a'], ['A'], true, true)).toBeTruthy();
        expect(arrayEquals(['a', 'b'], ['a'], true, true)).toBeFalsy();
        expect(arrayEquals(['a', 'b'], ['b', 'a'], true, true)).toBeTruthy();
        expect(arrayEquals(['a', 'b'], ['A', 'b'], true, true)).toBeTruthy();
        expect(arrayEquals(['a', 'b'], ['B', 'A'], true, true)).toBeTruthy();
    });

    test("don't ignore order, case sensitive", () => {
        expect(arrayEquals(['a'], null, false)).toBeFalsy();
        expect(arrayEquals(null, [], false)).toBeFalsy();
        expect(arrayEquals([], [], false)).toBeTruthy();
        expect(arrayEquals(['a'], ['a'], false)).toBeTruthy();
        expect(arrayEquals(['a'], ['A'], false)).toBeFalsy();
        expect(arrayEquals(['a', 'b'], ['a'], false)).toBeFalsy();
        expect(arrayEquals(['a', 'b'], ['a', 'b'], false)).toBeTruthy();
        expect(arrayEquals(['a', 'b'], ['b', 'a'], false)).toBeFalsy();
        expect(arrayEquals(['a', 'b'], ['A', 'b'], false)).toBeFalsy();
        expect(arrayEquals(['a', 'b'], ['B', 'A'], false)).toBeFalsy();
    });
});

describe('getValueFromRow', () => {
    test('no row', () => {
        expect(getValueFromRow(undefined, 'Name')).toEqual(undefined);
        expect(getValueFromRow({}, 'Name')).toEqual(undefined);
    });

    test('returns value', () => {
        const row = { Name: 'test' };
        expect(getValueFromRow(row, 'Name')).toEqual('test');
        expect(getValueFromRow(row, 'name')).toEqual('test');
        expect(getValueFromRow(row, 'bogus')).toEqual(undefined);
    });

    test('returns value from object', () => {
        const row = { Name: { value: 'test' } };
        expect(getValueFromRow(row, 'Name')).toEqual('test');
        expect(getValueFromRow(row, 'name')).toEqual('test');
        expect(getValueFromRow(row, 'bogus')).toEqual(undefined);
    });

    test('returns value from array', () => {
        let row = { Name: ['test1', 'test2'] };
        expect(getValueFromRow(row, 'Name')).toEqual(undefined);
        expect(getValueFromRow(row, 'name')).toEqual(undefined);
        expect(getValueFromRow(row, 'bogus')).toEqual(undefined);

        row = { Name: [{ value: 'test1' }, { value: 'test2' }] };
        expect(getValueFromRow(row, 'Name')).toEqual('test1');
        expect(getValueFromRow(row, 'name')).toEqual('test1');
        expect(getValueFromRow(row, 'bogus')).toEqual(undefined);
    });
});
