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
import { fromJS, List } from 'immutable';
import { Filter } from '@labkey/api';

import { QueryColumn, QueryGridModel, QueryInfo } from '../../../..';

import mixturesWithAliasesQueryInfo from '../../../../test/data/mixturesWithAliases-getQueryDetails.json';
import mixturesWithAliasesQuery from '../../../../test/data/mixturesWithAliases-getQuery.json';
import { initUnitTests, makeQueryInfo, makeTestData } from '../../../../internal/testHelpers';

import { FilterAction } from './Filter';
import { ActionValue } from './Action';

let queryInfo: QueryInfo;
let getColumns: () => List<QueryColumn>;

beforeAll(() => {
    initUnitTests();
    const mockData = makeTestData(mixturesWithAliasesQuery);
    queryInfo = makeQueryInfo(mixturesWithAliasesQueryInfo);
    const model = new QueryGridModel({
        queryInfo,
        messages: fromJS(mockData.messages),
        data: fromJS(mockData.rows),
        dataIds: fromJS(mockData.orderedRows),
        totalRows: mockData.rowCount,
    });
    getColumns = (all?) => (all ? model.getAllColumns() : model.getDisplayColumns());
});

describe('FilterAction::actionValueFromFilter', () => {
    let action;
    const urlPrefix = undefined;

    beforeEach(() => {
        // needs to be in beforeEach so it gets instantiated after beforeAll
        action = new FilterAction(urlPrefix, getColumns);
    });

    // TODO add tests for various value options
    test('no label, unencoded column', () => {
        const filter = Filter.create('colName', '10', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('colName = 10');
        expect(value.value).toBe('"colName" = 10');
    });

    test('no label, encoded column', () => {
        const filter = Filter.create('U mg$SL', '10', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter);
        expect(value.displayValue).toBe('U mg/L = 10');
        expect(value.value).toBe('"U mg$SL" = 10');
    });

    test('with label', () => {
        const filter = Filter.create('U mgS$L', 'x', Filter.Types.EQUAL);
        const value: ActionValue = action.actionValueFromFilter(filter, 'otherLabel');
        expect(value.displayValue).toBe('otherLabel = x');
        expect(value.value).toBe('"otherLabel" = x');
    });
});
