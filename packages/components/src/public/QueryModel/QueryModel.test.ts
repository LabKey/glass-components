import { Filter } from '@labkey/api';

import { makeQueryInfo } from '../../internal/test/testHelpers';
import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';
import { ExtendedMap } from '../ExtendedMap';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { LoadingState } from '../LoadingState';
import { QuerySort } from '../QuerySort';
import { GRID_CHECKBOX_OPTIONS } from '../../internal/constants';

import { ViewInfo } from '../../internal/ViewInfo';

import { flattenValuesFromRow, locationHasQueryParamSettings, QueryConfig, QueryModel } from './QueryModel';
import { makeTestQueryModel } from './testUtils';

const SCHEMA_QUERY = new SchemaQuery('exp.data', 'mixtures');
let QUERY_INFO: QueryInfo;
const ROWS = {
    '0': {
        RowId: { value: 0 },
        Data: { value: 100 },
    },
    '1': {
        RowId: { value: 1 },
        Data: { values: 200 },
    },
};
const ORDERED_ROWS = ['0', '1'];

beforeAll(() => {
    // Have to instantiate QUERY_INFO here because it relies on initQueryGridState being called first.
    QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
});

describe('QueryModel', () => {
    test('Instantiate Model no SchemaQuery', () => {
        expect(() => {
            new QueryModel({} as QueryConfig);
        }).toThrow('schemaQuery is required to instantiate a QueryModel');
    });

    test('SchemaQuery', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(model.schemaName).toEqual('exp.data');
        expect(model.queryName).toEqual('mixtures');
        expect(model.viewName).toEqual(undefined);
        // Auto-generated model ids are based off of the SchemaQuery in the QueryConfig
        expect(model.id).toEqual('exp.data.mixtures');
        const schemaQuery = new SchemaQuery('exp.data', 'mixtures', 'someViewName');
        model = new QueryModel({ schemaQuery });
        expect(model.viewName).toEqual('someViewName');
        model = new QueryModel({ id: 'custom', schemaQuery: SCHEMA_QUERY });
        expect(model.id).toEqual('custom');
    });

    test('isLoading', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(model.isLoading).toEqual(true);
        model = model.mutate({ queryInfoLoadingState: LoadingState.LOADING });
        expect(model.isLoading).toEqual(true);
        model = model.mutate({ queryInfoLoadingState: LoadingState.LOADED });
        expect(model.isLoading).toEqual(true);
        model = model.mutate({ rowsLoadingState: LoadingState.LOADING });
        expect(model.isLoading).toEqual(true);
        model = model.mutate({ rowsLoadingState: LoadingState.LOADED });
        expect(model.isLoading).toEqual(false);
    });

    test('Pagination', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY }).mutate({
            maxRows: 20,
            offset: 0,
            rowCount: 661,
        });

        model = model.mutate({ rows: {} });
        expect(model.pageCount).toEqual(34);
        expect(model.lastPageOffset).toEqual(660);
        expect(model.currentPage).toEqual(1);
        expect(model.isFirstPage).toEqual(true);
        expect(model.isLastPage).toEqual(false);

        model = model.mutate({ offset: 40 });
        expect(model.currentPage).toEqual(3);
        expect(model.isFirstPage).toEqual(false);
        expect(model.isLastPage).toEqual(false);

        model = model.mutate({ offset: 660 });
        expect(model.isFirstPage).toEqual(false);
        expect(model.isLastPage).toEqual(true);
    });

    test('Data', () => {
        const model = new QueryModel({ schemaQuery: SCHEMA_QUERY }).mutate({
            orderedRows: ORDERED_ROWS,
            rows: ROWS,
        });
        const gridData = model.gridData;
        expect(gridData.length).toEqual(2);
        expect(gridData[0]).toBe(ROWS['0']);
        expect(gridData[1]).toBe(ROWS['1']);
        expect(model.hasData).toEqual(true);
    });

    test('Data getRow', () => {
        const model = new QueryModel({ schemaQuery: SCHEMA_QUERY }).mutate({
            orderedRows: ORDERED_ROWS,
            rows: ROWS,
        });
        expect(model.getRow().RowId.value).toBe(0);
        expect(model.getRow('0').RowId.value).toBe(0);
        expect(model.getRow('1').RowId.value).toBe(1);
    });

    test('Sorts', () => {
        const sorts = [new QuerySort({ fieldKey: 'RowId', dir: '-' }), new QuerySort({ fieldKey: 'Data', dir: '+' })];
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY, sorts });
        expect(() => model.sortString).toThrow('Cannot construct sort string, no QueryInfo available');
        model = model.mutate({ queryInfo: QUERY_INFO });
        expect(model.sortString).toEqual('-RowId,Data');
    });

    test('Columns', () => {
        const cols = QUERY_INFO.columns;
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(() => model.columnString).toThrow('Cannot construct column string, no QueryInfo available');
        model = model.mutate({ queryInfo: QUERY_INFO });
        expect(model.columnString).toEqual('RowId,Name,Flag,mixtureTypeId,expirationTime,extraTestColumn');
        model = model.mutate({ requiredColumns: ['Name'] });
        expect(model.columnString).toEqual('RowId,Name,Flag,mixtureTypeId,expirationTime,extraTestColumn');
        expect(model.keyColumns).toEqual([cols.get('rowid')]);
        let expectedDisplayCols = [
            cols.get('name'),
            cols.get('flag'),
            cols.get('mixturetypeid'),
            cols.get('expirationtime'),
            cols.get('extratestcolumn'),
        ];
        expect(model.displayColumns).toEqual(expectedDisplayCols);
        // test that column retrieval is not case-sensitive
        expect(model.getColumn('mixturetypeId')).toStrictEqual(cols.get('mixturetypeid'));
        expect(model.getColumn('mixtureTypeId')).toStrictEqual(cols.get('mixturetypeid'));
        // test that retrieval of lookup columns works
        expect(model.getColumn('CreatedBy')).toStrictEqual(cols.get('createdby'));
        expect(model.getColumn('DataClass')).toStrictEqual(cols.get('dataclass'));
        expect(model.getColumn('DataClass/Name')).toStrictEqual(cols.get('dataclass'));

        // Change view to noExtraColumn which should change our expected columns.
        model = model.mutate({
            schemaQuery: new SchemaQuery('exp.data', 'mixtures', 'noExtraColumn'),
        });
        expectedDisplayCols = [
            cols.get('name'),
            cols.get('flag'),
            cols.get('mixturetypeid'),
            cols.get('expirationtime'),
        ];
        expect(model.displayColumns).toEqual(expectedDisplayCols);
        expect(model.columnString).toEqual('RowId,Name,Flag,mixtureTypeId,expirationTime');

        expect(model.getRequestColumnsString(['nAME'])).toEqual('RowId,Name,Flag,mixtureTypeId,expirationTime');
        expect(model.getRequestColumnsString(['OtherField'])).toEqual(
            'RowId,Name,Flag,mixtureTypeId,expirationTime,OtherField'
        );
        expect(model.getRequestColumnsString(['nAME', 'OtherField'])).toEqual(
            'RowId,Name,Flag,mixtureTypeId,expirationTime,OtherField'
        );
        expect(model.getRequestColumnsString(['OtherField', 'Name'], ['mixtureTypeId'])).toEqual(
            'RowId,Name,Flag,expirationTime,OtherField'
        );
    });

    test('SelectedState', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        // not loaded, no data
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.NONE);

        // loaded, no selections
        model = model.mutate({
            rows: { '1': { test: 1 }, '2': { test: 2 }, '3': { test: 3 } },
            orderedRows: ['1', '3', '2'],
            rowCount: 3,
            maxRows: 20,
            queryInfoLoadingState: LoadingState.LOADED,
            rowsLoadingState: LoadingState.LOADED,
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.NONE);

        // loaded, all selected on page but more data
        model = model.mutate({
            selections: new Set(['1', '2', '3']),
            rowCount: 30,
            maxRows: 3,
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.ALL);

        // some selected on page
        model = model.mutate({
            selections: new Set(['2', '3']),
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.SOME);

        // none selected on page
        model = model.mutate({
            selections: new Set(),
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.NONE);

        // all selected, total rows less than a page
        model = model.mutate({
            selections: new Set(['1', '2', '3']),
            rowCount: 3,
            maxRows: 20,
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.ALL);

        // some selected from total less than a page
        model = model.mutate({
            selections: new Set(['3']),
            rowCount: 3,
            maxRows: 33,
        });
        expect(model.selectedState).toBe(GRID_CHECKBOX_OPTIONS.SOME);
    });

    test('hasSelections', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(model.hasSelections).toBeFalsy();
        model = model.mutate({ selections: new Set([]) });
        expect(model.hasSelections).toBeFalsy();
        model = model.mutate({ selections: new Set(['1']) });
        expect(model.hasSelections).toBeTruthy();
    });

    test('intSelections', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(model.intSelections).toBe(undefined);
        model = model.mutate({ selections: new Set([]) });
        expect(model.intSelections.length).toBe(0);
        model = model.mutate({ selections: new Set(['1', '3', '2']) });
        expect(model.intSelections.length).toBe(3);
        expect(model.intSelections[0]).toBe(1);
        expect(model.intSelections[1]).toBe(3);
        expect(model.intSelections[2]).toBe(2);
    });

    test('getSelectedIds', () => {
        let model = new QueryModel({ schemaQuery: SCHEMA_QUERY });
        expect(model.getSelectedIds()).toBe(undefined);
        model = model.mutate({ selections: new Set([]) });
        expect(model.getSelectedIds().length).toBe(0);
        model = model.mutate({ selections: new Set(['1', '3', '2']) });
        expect(model.getSelectedIds().length).toBe(3);
        expect(model.getSelectedIds()[0]).toBe('1');
        expect(model.getSelectedIds()[1]).toBe('3');
        expect(model.getSelectedIds()[2]).toBe('2');
        expect(model.getSelectedIds([2, 3]).length).toBe(1);
        expect(model.getSelectedIds()[0]).toBe('1');
    });

    test('filters', () => {
        const viewName = 'TEST_VIEW';
        const view = ViewInfo.fromJson({
            name: viewName,
            filter: [{ fieldKey: 'c', value: 'testing', op: 'eq' }],
        });
        const queryInfo = new QueryInfo({ views: new ExtendedMap({ [viewName.toLowerCase()]: view }) });
        const sq = new SchemaQuery('exp.data', 'mixtures', viewName);

        const model = makeTestQueryModel(sq, queryInfo).mutate({
            baseFilters: [
                Filter.create('a', null, Filter.Types.ISBLANK),
                Filter.create('replaced', null, Filter.Types.ISBLANK),
            ],
            filterArray: [Filter.create('b', null, Filter.Types.ISBLANK)],
        });

        expect(model.filters).toHaveLength(4);
        expect(model.filters[0].getColumnName()).toBe('a');
        expect(model.filters[1].getColumnName()).toBe('replaced');
        expect(model.filters[2].getColumnName()).toBe('c');
        expect(model.filters[3].getColumnName()).toBe('b');

        expect(model.modelFilters).toHaveLength(3);
        expect(model.modelFilters[0].getColumnName()).toBe('a');
        expect(model.modelFilters[1].getColumnName()).toBe('replaced');
        expect(model.filters[2].getColumnName()).toBe('c');

        expect(model.viewFilters).toHaveLength(1);
        expect(model.viewFilters[0].getColumnName()).toBe('c');

        expect(model.detailFilters).toHaveLength(1);
        expect(model.detailFilters[0].getColumnName()).toBe('replaced');
    });
});

describe('flattenValuesFromRow', () => {
    test('missing params', () => {
        expect(JSON.stringify(flattenValuesFromRow(undefined, undefined))).toBe('{}');
        expect(JSON.stringify(flattenValuesFromRow({ test: { value: 123 } }, undefined))).toBe('{}');
        expect(JSON.stringify(flattenValuesFromRow(undefined, ['test']))).toBe('{}');
    });

    test('with values', () => {
        const data = {
            test1: { value: 123, displayValue: 'TEST123' },
            test2: { value: 456 },
            test3: { value: null },
            test4: undefined,
        };

        expect(flattenValuesFromRow(data, Object.keys(data)).test0).toBe(undefined);
        expect(flattenValuesFromRow(data, Object.keys(data)).test1).toBe(123);
        expect(flattenValuesFromRow(data, Object.keys(data)).test2).toBe(456);
        expect(flattenValuesFromRow(data, Object.keys(data)).test3).toBe(null);
        expect(flattenValuesFromRow(data, Object.keys(data)).test4).toBe(undefined);
    });
});

describe('locationHasQueryParamSettings', () => {
    test('no queryParams', () => {
        expect(locationHasQueryParamSettings('test', undefined)).toBe(false);
        expect(locationHasQueryParamSettings('test', new URLSearchParams())).toBe(false);
    });

    test('with matching queryParams', () => {
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.reportId': '1' }))).toBe(true);
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.view': '1' }))).toBe(true);
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.q': '1' }))).toBe(true);
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.sort': '1' }))).toBe(true);
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.p': '1' }))).toBe(true);
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.pageSize': '1' }))).toBe(true);
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.col~eq=': '1' }))).toBe(true);
    });

    test('with mismatched prefix', () => {
        expect(locationHasQueryParamSettings('bogus', new URLSearchParams({ 'test.reportId': '1' }))).toBe(false);
        expect(locationHasQueryParamSettings('bogus', new URLSearchParams({ 'test.view': '1' }))).toBe(false);
        expect(locationHasQueryParamSettings('bogus', new URLSearchParams({ 'test.q': '1' }))).toBe(false);
        expect(locationHasQueryParamSettings('bogus', new URLSearchParams({ 'test.sort': '1' }))).toBe(false);
        expect(locationHasQueryParamSettings('bogus', new URLSearchParams({ 'test.p': '1' }))).toBe(false);
        expect(locationHasQueryParamSettings('bogus', new URLSearchParams({ 'test.pageSize': '1' }))).toBe(false);
        expect(locationHasQueryParamSettings('bogus', new URLSearchParams({ 'test.col~eq=': '1' }))).toBe(false);
    });

    test('with mismatched queryParams', () => {
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.reportid': '1' }))).toBe(false);
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.reportIdd': '1' }))).toBe(false);
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.bogus': '1' }))).toBe(false);
        expect(locationHasQueryParamSettings('test', new URLSearchParams({ 'test.col~eq': '1' }))).toBe(true);
    });
});
