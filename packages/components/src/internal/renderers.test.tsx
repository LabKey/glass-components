import React from 'react';
import { Filter } from '@labkey/api';

import { render } from '@testing-library/react';

import { ExtendedMap } from '../public/ExtendedMap';

import { QueryColumn } from '../public/QueryColumn';

import { makeTestQueryModel } from '../public/QueryModel/testUtils';

import { SchemaQuery } from '../public/SchemaQuery';

import { QuerySort } from '../public/QuerySort';

import { QueryInfo } from '../public/QueryInfo';

import { EditableColumnTitle, HeaderCellDropdown, isFilterColumnNameMatch } from './renderers';
import { GridColumn } from './components/base/models/GridColumn';
import { ViewInfo } from './ViewInfo';

describe('isFilterColumnNameMatch', () => {
    const filter = Filter.create('Column', 'Value');

    test('by column name', () => {
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ name: '' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ name: 'column' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ name: ' Column ' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ name: 'Column' }))).toBeTruthy();
    });

    test('by fieldKey', () => {
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ fieldKey: '' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ fieldKey: 'column' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ fieldKey: ' Column ' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, new QueryColumn({ fieldKey: 'Column' }))).toBeTruthy();
    });

    test('lookup fieldKey', () => {
        const lkFilter = Filter.create('Column/Lookup', 'Value');
        expect(
            isFilterColumnNameMatch(lkFilter, new QueryColumn({ fieldKey: 'Column', lookup: { displayColumn: '' } }))
        ).toBeFalsy();
        expect(
            isFilterColumnNameMatch(
                lkFilter,
                new QueryColumn({ fieldKey: 'Column', lookup: { displayColumn: 'lookup' } })
            )
        ).toBeFalsy();
        expect(
            isFilterColumnNameMatch(
                lkFilter,
                new QueryColumn({ fieldKey: 'Column', lookup: { displayColumn: 'Lookup' } })
            )
        ).toBeFalsy();
        expect(
            isFilterColumnNameMatch(
                lkFilter,
                new QueryColumn({ fieldKey: 'Column', lookup: { displayColumn: 'Lookup', isPublic: true } })
            )
        ).toBeTruthy();
    });
});

describe('HeaderCellDropdown', () => {
    const DEFAULT_PROPS = {
        i: 0,
        column: new GridColumn({
            index: 'column',
            title: 'Column',
            raw: new QueryColumn({ fieldKey: 'column', sortable: true, filterable: true }),
        }),
        model: makeTestQueryModel(new SchemaQuery('schema', 'query')),
        handleSort: jest.fn,
        handleFilter: jest.fn,
    };

    function validate(gridColHeaderIcons: number, menuItemCount: number): void {
        expect(document.querySelectorAll('.grid-panel__col-header-icon')).toHaveLength(gridColHeaderIcons);
        expect(document.querySelectorAll('.label-help-target')).toHaveLength(0);
        expect(document.querySelectorAll('.dropdown-menu')).toHaveLength(menuItemCount > 0 ? 1 : 0);
        expect(document.querySelectorAll('.grid-panel__menu-toggle .fa-chevron-circle-down')).toHaveLength(
            menuItemCount > 0 ? 1 : 0
        );
        expect(document.querySelectorAll('.lk-menu-item')).toHaveLength(menuItemCount);
    }

    test('default props', () => {
        render(<HeaderCellDropdown {...DEFAULT_PROPS} />);
        validate(0, 5);
        // 3 with icons, 2 with spacers, and 1 menu separators
        expect(document.querySelectorAll('.grid-panel__menu-icon')).toHaveLength(3);
        expect(document.querySelectorAll('.grid-panel__menu-icon-spacer')).toHaveLength(2);
        // the two remove/clear options should be disabled
        const menuItems = document.querySelectorAll('.lk-menu-item');
        const removeFilterItem = menuItems[1];
        expect(removeFilterItem.textContent).toContain('Remove filter');
        expect(removeFilterItem.classList.contains('disabled')).toBe(true);
        const clearSortItem = menuItems[4];
        expect(clearSortItem.textContent).toContain('Clear sort');
        expect(clearSortItem.classList.contains('disabled')).toBe(true);
        // sort asc and sort desc should be enabled
        const sortAscItem = menuItems[2];
        expect(sortAscItem.textContent).toContain('Sort ascending');
        expect(sortAscItem.classList.contains('disabled')).toBe(false);
        const sortDescItem = menuItems[3];
        expect(sortDescItem.textContent).toContain('Sort descending');
        expect(sortDescItem.classList.contains('disabled')).toBe(false);
    });

    test('no col', () => {
        render(<HeaderCellDropdown {...DEFAULT_PROPS} column={new GridColumn({ index: 'column', title: 'Column' })} />);
        expect(document.querySelectorAll('span')).toHaveLength(0);
    });

    test('column not sortable or filterable', () => {
        render(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: false }),
                    })
                }
            />
        );
        validate(0, 0);
    });

    test('column not sortable or filterable but customizable', () => {
        render(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: false }),
                    })
                }
                handleAddColumn={jest.fn}
                handleHideColumn={jest.fn}
            />
        );
        validate(0, 3);
    });

    test('column not sortable or filterable, can add and hide', () => {
        render(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: false }),
                    })
                }
                handleAddColumn={jest.fn}
                handleHideColumn={jest.fn}
            />
        );
        validate(0, 3);
        expect(document.querySelectorAll('.lk-menu-item')[2].textContent).toContain('Hide Column');
        expect(document.querySelectorAll('.lk-menu-item')[2].classList.contains('disabled')).toBe(false);
    });

    test('column not sortable or filterable, can add but not hide', () => {
        render(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: false }),
                    })
                }
                handleAddColumn={jest.fn}
                handleHideColumn={undefined}
            />
        );
        validate(0, 3);
        expect(document.querySelectorAll('.lk-menu-item')[2].textContent).toContain('Hide Column');
        expect(document.querySelectorAll('.lk-menu-item')[2].classList.contains('disabled')).toBe(true);
    });

    test('column sortable, not filterable', () => {
        render(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: true, filterable: false }),
                    })
                }
            />
        );
        validate(0, 3);
    });

    test('column sortable, not filterable, customizable', () => {
        render(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: true, filterable: false }),
                    })
                }
                handleHideColumn={jest.fn}
            />
        );
        validate(0, 5);
    });

    test('column filterable, not sortable', () => {
        render(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: true }),
                    })
                }
            />
        );
        validate(0, 2);
    });

    test('column filterable, not sortable, but customizable', () => {
        render(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: new QueryColumn({ fieldKey: 'column', sortable: false, filterable: true }),
                    })
                }
                handleHideColumn={jest.fn}
            />
        );
        validate(0, 4);
    });

    test('without handleSort and handleFilter', () => {
        render(<HeaderCellDropdown {...DEFAULT_PROPS} handleSort={undefined} handleFilter={undefined} />);
        validate(0, 0);
    });

    test('isSortAsc', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            sorts: [new QuerySort({ fieldKey: 'column', dir: '' })],
        });
        render(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(1, 5);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-sort-amount-asc')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-sort-amount-desc')).toHaveLength(1);
        const sortAscItem = document.querySelectorAll('.lk-menu-item')[2];
        expect(sortAscItem.textContent).toContain('Sort ascending');
        expect(sortAscItem.classList.contains('disabled')).toBe(true);
        const sortDescItem = document.querySelectorAll('.lk-menu-item')[3];
        expect(sortDescItem.textContent).toContain('Sort descending');
        expect(sortDescItem.classList.contains('disabled')).toBe(false);
        const clearSortItem = document.querySelectorAll('.lk-menu-item')[4];
        expect(clearSortItem.textContent).toContain('Clear sort');
        expect(clearSortItem.classList.contains('disabled')).toBe(false);
    });

    test('isSortAsc via view sort', () => {
        const sortObj = { fieldKey: 'column', dir: '+' };
        const view = ViewInfo.fromJson({ sort: [sortObj] });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap<string, ViewInfo>({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });

        const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo).mutate({
            sorts: [],
        });
        render(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(1, 5);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-sort-amount-asc')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-sort-amount-desc')).toHaveLength(1);
        const sortAscItem = document.querySelectorAll('.lk-menu-item')[2];
        expect(sortAscItem.textContent).toContain('Sort ascending');
        expect(sortAscItem.classList.contains('disabled')).toBe(true);
        const sortDescItem = document.querySelectorAll('.lk-menu-item')[3];
        expect(sortDescItem.textContent).toContain('Sort descending');
        expect(sortDescItem.classList.contains('disabled')).toBe(false);
        const clearSortItem = document.querySelectorAll('.lk-menu-item')[4];
        expect(clearSortItem.textContent).toContain('Clear sort');
        expect(clearSortItem.classList.contains('disabled')).toBe(false);
    });

    test('isSortDesc', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            sorts: [new QuerySort({ fieldKey: 'column', dir: '-' })],
        });
        render(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(1, 5);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-sort-amount-asc')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-sort-amount-desc')).toHaveLength(2);
        const sortAscItem = document.querySelectorAll('.lk-menu-item')[2];
        expect(sortAscItem.textContent).toContain('Sort ascending');
        expect(sortAscItem.classList.contains('disabled')).toBe(false);
        const sortDescItem = document.querySelectorAll('.lk-menu-item')[3];
        expect(sortDescItem.textContent).toContain('Sort descending');
        expect(sortDescItem.classList.contains('disabled')).toBe(true);
        const clearSortItem = document.querySelectorAll('.lk-menu-item')[4];
        expect(clearSortItem.textContent).toContain('Clear sort');
        expect(clearSortItem.classList.contains('disabled')).toBe(false);
    });

    test('isSortDesc via view sort', () => {
        const sortObj = { fieldKey: 'column', dir: '-' };
        const view = ViewInfo.fromJson({ sort: [sortObj] });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap<string, ViewInfo>({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });

        const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo).mutate({
            sorts: [],
        });
        render(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(1, 5);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-sort-amount-asc')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-sort-amount-desc')).toHaveLength(2);
        const sortAscItem = document.querySelectorAll('.lk-menu-item')[2];
        expect(sortAscItem.textContent).toContain('Sort ascending');
        expect(sortAscItem.classList.contains('disabled')).toBe(false);
        const sortDescItem = document.querySelectorAll('.lk-menu-item')[3];
        expect(sortDescItem.textContent).toContain('Sort descending');
        expect(sortDescItem.classList.contains('disabled')).toBe(true);
        const clearSortItem = document.querySelectorAll('.lk-menu-item')[4];
        expect(clearSortItem.textContent).toContain('Clear sort');
        expect(clearSortItem.classList.contains('disabled')).toBe(false);
    });

    test('one colFilters', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query')).mutate({
            filterArray: [Filter.create('column', 'value', Filter.Types.EQUALS)],
        });
        render(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(1, 5);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-sort-amount-asc')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-sort-amount-desc')).toHaveLength(1);
        const removeFilterItem = document.querySelectorAll('.lk-menu-item')[1];
        expect(removeFilterItem.textContent).toBe('Remove filter');
        expect(removeFilterItem.classList.contains('disabled')).toBe(false);
    });

    test('view filter', () => {
        const filterObj = { fieldKey: 'column', value: 'val', op: 'contains' };
        const view = ViewInfo.fromJson({ filter: [filterObj] });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap<string, ViewInfo>({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });

        const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo).mutate({
            filterArray: [],
        });
        render(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(1, 5);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-sort-amount-asc')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-sort-amount-desc')).toHaveLength(1);
        const removeFilterItem = document.querySelectorAll('.lk-menu-item')[1];
        expect(removeFilterItem.textContent).toBe('Remove filter');
        expect(removeFilterItem.classList.contains('disabled')).toBe(false);
    });

    test('multiple colFilters, one being a view filter', () => {
        const filterObj = { fieldKey: 'column', value: 'val', op: 'contains' };
        const view = ViewInfo.fromJson({ filter: [filterObj] });
        const queryInfo = new QueryInfo({
            views: new ExtendedMap<string, ViewInfo>({ [ViewInfo.DEFAULT_NAME.toLowerCase()]: view }),
        });

        const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo).mutate({
            filterArray: [Filter.create('column', 'value', Filter.Types.EQUALS)],
        });
        render(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(1, 5);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-sort-amount-asc')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-sort-amount-desc')).toHaveLength(1);
        const removeFilterItem = document.querySelectorAll('.lk-menu-item')[1];
        expect(removeFilterItem.textContent).toBe('Remove filters');
        expect(removeFilterItem.classList.contains('disabled')).toBe(false);
    });
});

describe('EditableColumnTitle', () => {
    test('Not editing, with caption', () => {
        const column = new QueryColumn({
            caption: 'Test Column',
            name: 'Testing',
        });
        render(<EditableColumnTitle column={column} onChange={jest.fn()} onCancel={jest.fn()} />);
        expect(document.querySelectorAll('input')).toHaveLength(0);
        expect(document.body.textContent).toBe(column.caption);
    });

    test('Not editing, no caption', () => {
        render(
            <EditableColumnTitle
                column={new QueryColumn({ name: 'TestName' })}
                onChange={jest.fn()}
                onCancel={jest.fn()}
            />
        );
        expect(document.querySelectorAll('input')).toHaveLength(0);
        expect(document.body.textContent).toBe('TestName');
    });

    test('Not editing with nbsp', () => {
        render(
            <EditableColumnTitle
                column={new QueryColumn({ name: 'TestName', caption: '&nbsp;' })}
                onChange={jest.fn()}
                onCancel={jest.fn()}
            />
        );
        expect(document.querySelectorAll('input')).toHaveLength(0);
        expect(document.body.textContent).toBe('');
    });

    test('Editing with nbsp', () => {
        render(
            <EditableColumnTitle
                column={new QueryColumn({ name: 'TestName', caption: '&nbsp;' })}
                onChange={jest.fn()}
                onCancel={jest.fn()}
                editing
            />
        );
        expect(document.querySelectorAll('input')).toHaveLength(0);
        expect(document.body.textContent).toBe('');
    });

    test('Editing', async () => {
        const column = new QueryColumn({
            caption: 'Test Column',
            name: 'Testing',
        });
        const changeFn = jest.fn();
        const editToggleFn = jest.fn();
        render(<EditableColumnTitle column={column} onChange={changeFn} onCancel={editToggleFn} editing />);
        const inputField = document.querySelectorAll('input');
        expect(inputField).toHaveLength(1);
        expect(inputField[0].value).toBe(column.caption);
    });
});
