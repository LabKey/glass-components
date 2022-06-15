import { List } from 'immutable';

import { QueryInfo } from '../../../QueryInfo';
import { QueryColumn } from '../../../QueryColumn';
import { initUnitTests, makeQueryInfo } from '../../../../internal/testHelpers';
import mixturesQueryInfo from '../../../../test/data/mixtures-getQueryDetails.json';

import { ActionValue } from './Action';
import { SortAction } from './Sort';

let queryInfo: QueryInfo;
let getColumns: () => List<QueryColumn>;

beforeAll(() => {
    initUnitTests();
    queryInfo = makeQueryInfo(mixturesQueryInfo);
    getColumns = (all?) => (all ? queryInfo.getAllColumns() : queryInfo.getDisplayColumns());
});

describe('SortAction::parseParam', () => {
    let action;

    beforeEach(() => {
        // needs to be in beforeEach so it gets instantiated after beforeAll
        action = new SortAction(undefined, getColumns);
    });

    test('unencoded value, DESC', () => {
        const values = action.parseParam('ignored', '-name', getColumns());
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject({
            displayValue: 'Name',
            param: '-name',
            value: 'name desc',
        });
    });

    test('unencoded value, ASC', () => {
        const values = action.parseParam('ignored', 'Name', getColumns());
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject({
            displayValue: 'Name',
            param: 'Name',
            value: 'Name asc',
        });
    });

    test('encoded value, DESC', () => {
        const values = action.parseParam('ignored', '-Measure u$SL', getColumns());
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject({
            displayValue: 'Measure u/L',
            param: '-Measure u/L',
            value: 'Measure u/L desc',
        });
    });

    test('encoded value, ASC', () => {
        const values = action.parseParam('ignored', 'Name u$SL', getColumns());
        expect(values).toHaveLength(1);
        expect(values[0]).toMatchObject({
            displayValue: 'Name u/L',
            param: 'Name u/L',
            value: 'Name u/L asc',
        });
    });
});

describe('SortAction::actionValueFromSort', () => {
    let action;

    beforeEach(() => {
        // needs to be in beforeEach so it gets instantiated after beforeAll
        action = new SortAction(undefined, getColumns);
    });

    test('no label, encoded column', () => {
        const value: ActionValue = action.actionValueFromSort({
            dir: '-',
            fieldKey: 'U m$SLB',
        });
        expect(value).toMatchObject({
            value: 'U m$SLB DESC',
            displayValue: 'U m/LB',
        });
    });

    test('no label, unencoded column', () => {
        const value: ActionValue = action.actionValueFromSort({
            fieldKey: 'Units',
        });
        expect(value).toMatchObject({
            value: 'Units ASC',
            displayValue: 'Units',
        });
    });

    test('with label', () => {
        const value: ActionValue = action.actionValueFromSort(
            {
                fieldKey: 'Units',
            },
            'Labeling'
        );
        expect(value).toMatchObject({
            value: 'Units ASC',
            displayValue: 'Labeling',
        });
    });
});
