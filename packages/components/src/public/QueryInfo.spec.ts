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
import { fromJS, List, OrderedMap } from 'immutable';

import sampleSetQueryInfo from '../test/data/sampleSet-getQueryDetails.json';
import sampleSet3QueryColumn from '../test/data/SampleSet3Parent-QueryColumn.json';
import nameExpSetQueryColumn from '../test/data/NameExprParent-QueryColumn.json';

import { ViewInfo } from '../internal/ViewInfo';

import { QueryInfo } from './QueryInfo';
import { QueryColumn } from './QueryColumn';

describe('getColumnFieldKeys', () => {
    test('missing params', () => {
        const queryInfo = QueryInfo.create({});

        expect(JSON.stringify(queryInfo.getColumnFieldKeys(undefined))).toBe('[]');
        expect(JSON.stringify(queryInfo.getColumnFieldKeys(['test']))).toBe('[]');
    });

    test('queryInfo with columns', () => {
        const queryInfo = QueryInfo.fromJSON({
            columns: [{ fieldKey: 'test1' }, { fieldKey: 'test2' }, { fieldKey: 'test3' }],
        });

        expect(JSON.stringify(queryInfo.getColumnFieldKeys(undefined))).toBe('["test1","test2","test3"]');
        expect(JSON.stringify(queryInfo.getColumnFieldKeys(['test0']))).toBe('[]');
        expect(JSON.stringify(queryInfo.getColumnFieldKeys(['test1']))).toBe('["test1"]');
        expect(JSON.stringify(queryInfo.getColumnFieldKeys(['test1', 'test2']))).toBe('["test1","test2"]');
        expect(JSON.stringify(queryInfo.getColumnFieldKeys(['test1', 'test2', 'test4']))).toBe('["test1","test2"]');
    });
});

describe('QueryInfo', () => {
    const FIRST_COL_KEY = 'Sample Set 3 Parents';
    const SECOND_COL_KEY = 'NameExpr Parents';

    const queryInfo = QueryInfo.fromJSON(sampleSetQueryInfo);
    let newColumns = OrderedMap<string, QueryColumn>();
    newColumns = newColumns.set(FIRST_COL_KEY, new QueryColumn(sampleSet3QueryColumn));
    newColumns = newColumns.set(SECOND_COL_KEY, new QueryColumn(nameExpSetQueryColumn));

    describe('insertColumns', () => {
        test('negative columnIndex', () => {
            const columns = queryInfo.insertColumns(-1, newColumns);
            expect(columns).toBe(queryInfo.columns);
        });

        test('columnIndex just too large', () => {
            const columns = queryInfo.insertColumns(queryInfo.columns.size + 1, newColumns);
            expect(columns).toBe(queryInfo.columns);
        });

        test('as first column', () => {
            const columns = queryInfo.insertColumns(0, newColumns);
            const firstColKey = queryInfo.columns.keySeq().first();
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(0);
            expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(1);
            expect(columns.keySeq().indexOf(firstColKey)).toBe(2);
            expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
        });

        test('as last column', () => {
            const columns = queryInfo.insertColumns(queryInfo.columns.size, newColumns);
            const firstColKey = queryInfo.columns.keySeq().first();
            expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
            expect(columns.keySeq().indexOf(firstColKey)).toBe(0);
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(queryInfo.columns.size);
            expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(queryInfo.columns.size + 1);
        });

        test('in middle', () => {
            const nameIndex = queryInfo.columns.keySeq().findIndex(key => key.toLowerCase() === 'name');
            const columns = queryInfo.insertColumns(nameIndex + 1, newColumns);
            expect(columns.size).toBe(queryInfo.columns.size + newColumns.size);
            expect(columns.keySeq().get(nameIndex).toLowerCase()).toBe('name');
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(nameIndex + 1);
            expect(columns.keySeq().indexOf(SECOND_COL_KEY)).toBe(nameIndex + 2);
        });

        test('single column', () => {
            const nameIndex = queryInfo.columns.keySeq().findIndex(key => key.toLowerCase() === 'name');
            const columns = queryInfo.insertColumns(
                nameIndex + 1,
                newColumns
                    .filter(queryColumn => queryColumn.caption.toLowerCase() === FIRST_COL_KEY.toLowerCase())
                    .toOrderedMap()
            );
            expect(columns.size).toBe(queryInfo.columns.size + 1);
            expect(columns.keySeq().get(nameIndex).toLowerCase()).toBe('name');
            expect(columns.keySeq().indexOf(FIRST_COL_KEY)).toBe(nameIndex + 1);
        });
    });

    describe('getUpdateColumns', () => {
        test('without readOnly columns', () => {
            const columns = queryInfo.getUpdateColumns();
            expect(columns.size).toBe(2);
            expect(columns.get(0).fieldKey).toBe('Description');
            expect(columns.get(1).fieldKey).toBe('New');
        });

        test('with readOnly columns', () => {
            const columns = queryInfo.getUpdateColumns(List<string>(['Name']));
            expect(columns.size).toBe(3);
            expect(columns.get(0).fieldKey).toBe('Name');
            expect(columns.get(1).fieldKey).toBe('Description');
            expect(columns.get(2).fieldKey).toBe('New');
        });
    });

    describe('getDisplayColumns', () => {
        const queryInfoWithViews = QueryInfo.fromJSON(
            {
                columns: [
                    { fieldKey: 'test1' },
                    { fieldKey: 'test2', addToSystemView: true },
                    { fieldKey: 'test3', addToSystemView: true },
                ],
                views: [{ name: '', default: true }],
            },
            true
        );

        test('system default view with addToSystemView', () => {
            const columns = queryInfoWithViews.getDisplayColumns();
            expect(columns.size).toBe(2);
            expect(columns.get(0).fieldKey).toBe('test2');
            expect(columns.get(1).fieldKey).toBe('test3');
        });

        test('system default view with omittedColumns', () => {
            const columns = queryInfoWithViews.getDisplayColumns('', List.of('test2'));
            expect(columns.size).toBe(1);
            expect(columns.get(0).fieldKey).toBe('test3');
        });

        test('saved default view should not include addToSystemView', () => {
            const qv = QueryInfo.fromJSON(
                {
                    columns: [
                        { fieldKey: 'test1' },
                        { fieldKey: 'test2', addToSystemView: true },
                        { fieldKey: 'test3', addToSystemView: true },
                    ],
                    views: [{ name: '', default: true, saved: true }],
                },
                true
            );
            const columns = qv.getDisplayColumns();
            expect(columns.size).toBe(0);
        });
    });

    describe('getIconURL', () => {
        test('default', () => {
            const queryInfo = QueryInfo.create({ schemaName: 'test', name: 'test' });
            expect(queryInfo.getIconURL()).toBe('default');
        });

        test('with custom iconURL', () => {
            const queryInfo = QueryInfo.create({ schemaName: 'samples', name: 'test', iconURL: 'other' });
            expect(queryInfo.getIconURL()).toBe('other');
        });
    });

    describe('getInsertQueryInfo', () => {
        test('shownInInsertView', () => {
            const queryInfo = QueryInfo.fromJSON({
                columns: [
                    { fieldKey: 'test1', shownInInsertView: true },
                    { fieldKey: 'test2', shownInInsertView: false },
                ],
            }).getInsertQueryInfo();
            expect(queryInfo.columns.size).toBe(1);
            expect(queryInfo.columns.get('test1')).toBeDefined();
            expect(queryInfo.columns.get('test2')).toBeUndefined();
        });

        test('isFileInput', () => {
            const queryInfo = QueryInfo.fromJSON({
                columns: [
                    { fieldKey: 'test1', shownInInsertView: true, inputType: 'text' },
                    { fieldKey: 'test2', shownInInsertView: true, inputType: 'file' },
                ],
            }).getInsertQueryInfo();
            expect(queryInfo.columns.size).toBe(1);
            expect(queryInfo.columns.get('test1')).toBeDefined();
            expect(queryInfo.columns.get('test2')).toBeUndefined();
        });
    });

    describe('getInsertColumns', () => {
        test('includeFileInputs false', () => {
            const insertCol1 = QueryInfo.fromJSON({
                columns: [
                    {
                        fieldKey: 'test1',
                        fieldKeyArray: ['test1'],
                        shownInInsertView: true,
                        userEditable: true,
                        readOnly: false,
                        inputType: 'text',
                    },
                    {
                        fieldKey: 'test2',
                        fieldKeyArray: ['test2'],
                        shownInInsertView: true,
                        userEditable: true,
                        readOnly: false,
                        inputType: 'file',
                    },
                ],
            }).getInsertColumns();
            expect(insertCol1.size).toBe(1);
            expect(insertCol1.get(0).fieldKey).toBe('test1');
        });
    });

    describe('getFileColumnFieldKeys', () => {
        test('default', () => {
            const fieldKeys = QueryInfo.fromJSON({
                columns: [
                    { fieldKey: 'test1', shownInInsertView: true, inputType: 'text' },
                    { fieldKey: 'test2', shownInInsertView: false, inputType: 'text' },
                    { fieldKey: 'test3', shownInInsertView: true, inputType: 'file' },
                ],
            }).getFileColumnFieldKeys();
            expect(fieldKeys.join(',')).toBe('test3');
        });
    });

    describe('getShowImportDataButton', () => {
        test('respects settings', () => {
            const qi = QueryInfo.create({
                importUrl: '#/importUrl',
                importUrlDisabled: false,
                showInsertNewButton: true, // yes, "getShowImportDataButton()" respects the "showInsertNewButton" flag
            });

            expect(qi.getShowImportDataButton()).toBe(true);
            expect((qi.set('importUrl', undefined) as QueryInfo).getShowImportDataButton()).toBe(false);
            expect((qi.set('importUrlDisabled', true) as QueryInfo).getShowImportDataButton()).toBe(false);
            expect((qi.set('showInsertNewButton', false) as QueryInfo).getShowImportDataButton()).toBe(false);
        });
    });

    describe('getShowInsertNewButton', () => {
        test('respects settings', () => {
            const qi = QueryInfo.create({
                insertUrl: '#/insertUrl',
                insertUrlDisabled: false,
                showInsertNewButton: true,
            });

            expect(qi.getShowInsertNewButton()).toBe(true);
            expect((qi.set('insertUrl', undefined) as QueryInfo).getShowInsertNewButton()).toBe(false);
            expect((qi.set('insertUrlDisabled', true) as QueryInfo).getShowInsertNewButton()).toBe(false);
            expect((qi.set('showInsertNewButton', false) as QueryInfo).getShowInsertNewButton()).toBe(false);
        });
    });

    describe('getView', () => {
        let queryInfo = QueryInfo.create({
            views: fromJS({
                [ViewInfo.DEFAULT_NAME.toLowerCase()]: ViewInfo.fromJson({ name: 'default' }),
                [ViewInfo.DETAIL_NAME.toLowerCase()]: ViewInfo.fromJson({ name: 'detail' }),
                view1: ViewInfo.fromJson({ name: 'view1' }),
                view2: ViewInfo.fromJson({ name: 'view2' }),
            }),
        });

        expect(queryInfo.getView(undefined)?.name).toBe(undefined);
        expect(queryInfo.getView(undefined, true)?.name).toBe('default');
        expect(queryInfo.getView('')?.name).toBe('default');
        expect(queryInfo.getView('', true)?.name).toBe('default');

        expect(queryInfo.getView('bogus')?.name).toBe(undefined);
        expect(queryInfo.getView('bogus', false)?.name).toBe(undefined);
        expect(queryInfo.getView('bogus', true)?.name).toBe('default');

        expect(queryInfo.getView('view1')?.name).toBe('view1');
        expect(queryInfo.getView('view2')?.name).toBe('view2');
        expect(queryInfo.getView('view2', true)?.name).toBe('view2');

        expect(queryInfo.getView(ViewInfo.DEFAULT_NAME)?.name).toBe('default');
        expect(queryInfo.getView('~~default~~')?.name).toBe('default');

        expect(queryInfo.getView(ViewInfo.DETAIL_NAME)?.name).toBe('detail');
        expect(queryInfo.getView('~~details~~')?.name).toBe('detail');

        queryInfo = QueryInfo.create({
            views: fromJS({
                [ViewInfo.DEFAULT_NAME.toLowerCase()]: ViewInfo.fromJson({ name: 'default' }),
                [ViewInfo.DETAIL_NAME.toLowerCase()]: ViewInfo.fromJson({ name: 'detail' }),
                [ViewInfo.BIO_DETAIL_NAME.toLowerCase()]: ViewInfo.fromJson({ name: 'LKB detail' }),
            }),
        });
        expect(queryInfo.getView(ViewInfo.BIO_DETAIL_NAME)?.name).toBe('LKB detail');
        expect(queryInfo.getView(ViewInfo.DETAIL_NAME)?.name).toBe('LKB detail');
        expect(queryInfo.getView('~~details~~')?.name).toBe('LKB detail');
    });
});
