import { QueryInfo } from '../../../public/QueryInfo';
import { ViewInfo } from '../../ViewInfo';
import { SelectRowsOptions } from '../../query/selectRows';

import { getSampleIdentifyingFieldGridData } from './actions';

jest.mock('../../query/selectRows', () => ({
    ...jest.requireActual('../../query/selectRows'),
    selectRows: (options: SelectRowsOptions) => {
        if (options.filterArray[0].getValue().length === 0) {
            return Promise.resolve({
                rows: [],
            });
        } else {
            return Promise.resolve({
                rows: [
                    {
                        RowId: { value: 1 },
                        Name: { value: 'S1' },
                        intCol: { value: 1 },
                        "doubleCol/": { value: 1.1 },
                        textCol: { value: 'test1', displayValue: 'TEST 1' },
                    },
                    {
                        RowId: { value: 2 },
                        Name: { value: 'S2' },
                        intCol: { value: 2 },
                        "doubleCol/": { value: 2.2, formattedValue: '2.200' },
                        textCol: { value: 'test2' },
                    },
                ],
            });
        }
    },
}));

const columns = [
    { fieldKey: 'intCol', jsonType: 'int', name: 'intCol' },
    { fieldKey: 'doubleCol$S', jsonType: 'double', name: 'doubleCol/' },
    { fieldKey: 'textCol', jsonType: 'string', name: 'textCol' },
];
const QUERY_INFO_NO_ID_VIEW = QueryInfo.fromJsonForTests(
    {
        columns,
        name: 'query',
        schemaName: 'schema',
        views: [
            { columns, name: ViewInfo.DEFAULT_NAME },
            { columns, name: 'view' },
        ],
    },
    true
);
const QUERY_INFO_WITH_ID_VIEW = QueryInfo.fromJsonForTests(
    {
        columns,
        name: 'query',
        schemaName: 'schema',
        views: [
            { columns, name: ViewInfo.DEFAULT_NAME },
            { columns, name: ViewInfo.IDENTIFYING_FIELDS_VIEW_NAME },
        ],
    },
    true
);

describe('getSampleIdentifyingFieldGridData', () => {
    test('no identifying fields', async () => {
        expect(await getSampleIdentifyingFieldGridData([])).toStrictEqual({});
        expect(await getSampleIdentifyingFieldGridData([], QUERY_INFO_NO_ID_VIEW)).toStrictEqual({});
    });

    test('with identifying fields, no rows in response', async () => {
        expect(await getSampleIdentifyingFieldGridData([], QUERY_INFO_WITH_ID_VIEW)).toStrictEqual({});
    });

    test('with identifying fields, with rows in response', async () => {
        expect(await getSampleIdentifyingFieldGridData([1, 2], QUERY_INFO_WITH_ID_VIEW)).toStrictEqual({
            '1': {
                doubleCol$S: 1.1,
                intCol: 1,
                rowId: 1,
                sampleId: 'S1',
                textCol: 'TEST 1',
            },
            '2': {
                doubleCol$S: '2.200',
                intCol: 2,
                rowId: 2,
                sampleId: 'S2',
                textCol: 'test2',
            },
        });
    });

    test('includeDefaultColumns false', async () => {
        expect(await getSampleIdentifyingFieldGridData([1, 2], QUERY_INFO_WITH_ID_VIEW, false)).toStrictEqual({
            '1': {
                doubleCol$S: 1.1,
                intCol: 1,
                textCol: 'TEST 1',
            },
            '2': {
                doubleCol$S: '2.200',
                intCol: 2,
                textCol: 'test2',
            },
        });
    });
});
