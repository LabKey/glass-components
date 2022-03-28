import React from 'react';
import { Dropdown, MenuItem } from 'react-bootstrap';
import { mount, ReactWrapper } from 'enzyme';
import { Filter } from '@labkey/api';

import { QueryColumn } from '../public/QueryColumn';

import { HeaderCellDropdown, isFilterColumnNameMatch } from './renderers';
import { GridColumn } from './components/base/models/GridColumn';
import { LabelHelpTip } from './components/base/LabelHelpTip';
import { CustomToggle } from './components/base/CustomToggle';
import {makeTestQueryModel} from "../public/QueryModel/testUtils";
import {SchemaQuery} from "../public/SchemaQuery";
import {QuerySort} from "../public/QuerySort";

describe('isFilterColumnNameMatch', () => {
    const filter = Filter.create('Column', 'Value');

    test('by column name', () => {
        expect(isFilterColumnNameMatch(filter, QueryColumn.create({ name: '' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, QueryColumn.create({ name: 'column' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, QueryColumn.create({ name: ' Column ' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, QueryColumn.create({ name: 'Column' }))).toBeTruthy();
    });

    test('by fieldKey', () => {
        expect(isFilterColumnNameMatch(filter, QueryColumn.create({ fieldKey: '' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, QueryColumn.create({ fieldKey: 'column' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, QueryColumn.create({ fieldKey: ' Column ' }))).toBeFalsy();
        expect(isFilterColumnNameMatch(filter, QueryColumn.create({ fieldKey: 'Column' }))).toBeTruthy();
    });

    test('lookup fieldKey', () => {
        const lkFilter = Filter.create('Column/Lookup', 'Value');
        expect(isFilterColumnNameMatch(lkFilter, QueryColumn.create({ fieldKey: 'Column', lookup: { displayColumn: '' } }))).toBeFalsy();
        expect(isFilterColumnNameMatch(lkFilter, QueryColumn.create({ fieldKey: 'Column', lookup: { displayColumn: 'lookup' } }))).toBeFalsy();
        expect(isFilterColumnNameMatch(lkFilter, QueryColumn.create({ fieldKey: 'Column', lookup: { displayColumn: 'Lookup' } }))).toBeTruthy();
    });
});

describe('HeaderCellDropdown', () => {
    beforeEach(() => {
        LABKEY.moduleContext.samplemanagement = {
            'experimental-grid-col-header-sort-filter': true,
        };
    });

    const DEFAULT_PROPS = {
        i: 0,
        column: new GridColumn({
            index: 'column',
            title: 'Column',
            raw: QueryColumn.create({ fieldKey: 'column', sortable: true, filterable: true }),
        }),
        model: makeTestQueryModel(SchemaQuery.create('schema', 'query')),
        handleSort: jest.fn,
        handleFilter: jest.fn,
    };

    function validate(wrapper: ReactWrapper, gridColHeaderIcons: number, menuItemCount: number): void {
        expect(wrapper.find('.grid-panel__col-header-icon')).toHaveLength(gridColHeaderIcons);
        expect(wrapper.find(LabelHelpTip)).toHaveLength(0);
        expect(wrapper.find(Dropdown)).toHaveLength(menuItemCount > 0 ? 1 : 0);
        expect(wrapper.find(CustomToggle)).toHaveLength(menuItemCount > 0 ? 1 : 0);
        expect(wrapper.find(MenuItem)).toHaveLength(menuItemCount);
    }

    test('default props', () => {
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} />);
        validate(wrapper, 0, 6);
        // 3 with icons, 2 with spacers, and one menu separator
        expect(wrapper.find('.grid-panel__menu-icon')).toHaveLength(3);
        expect(wrapper.find('.grid-panel__menu-icon-spacer')).toHaveLength(2);
        // the two remove/clear options should be disabled
        const removeFilterItem = wrapper.find(MenuItem).at(1);
        expect(removeFilterItem.text()).toContain('Remove filter');
        expect(removeFilterItem.prop('disabled')).toBe(true);
        const clearSortItem = wrapper.find(MenuItem).at(5);
        expect(clearSortItem.text()).toContain('Clear sort');
        expect(clearSortItem.prop('disabled')).toBe(true);
        // sort asc and sort desc should be enabled
        const sortAscItem = wrapper.find(MenuItem).at(3);
        expect(sortAscItem.text()).toContain('Sort ascending');
        expect(sortAscItem.prop('disabled')).toBe(false);
        const sortDescItem = wrapper.find(MenuItem).at(4);
        expect(sortDescItem.text()).toContain('Sort descending');
        expect(sortDescItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('no col', () => {
        const wrapper = mount(
            <HeaderCellDropdown {...DEFAULT_PROPS} column={new GridColumn({ index: 'column', title: 'Column' })} />
        );
        expect(wrapper.find('span')).toHaveLength(0);
        wrapper.unmount();
    });

    test('column not sortable or filterable', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: QueryColumn.create({ fieldKey: 'column', sortable: false, filterable: false }),
                    })
                }
            />
        );
        validate(wrapper, 0, 0);
        wrapper.unmount();
    });

    test('column sortable, not filterable', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: QueryColumn.create({ fieldKey: 'column', sortable: true, filterable: false }),
                    })
                }
            />
        );
        validate(wrapper, 0, 3);
        wrapper.unmount();
    });

    test('column filterable, not sortable', () => {
        const wrapper = mount(
            <HeaderCellDropdown
                {...DEFAULT_PROPS}
                column={
                    new GridColumn({
                        index: 'column',
                        title: 'Column',
                        raw: QueryColumn.create({ fieldKey: 'column', sortable: false, filterable: true }),
                    })
                }
            />
        );
        validate(wrapper, 0, 2);
        wrapper.unmount();
    });

    test('without handleSort and handleFilter', () => {
        const wrapper = mount(
            <HeaderCellDropdown {...DEFAULT_PROPS} handleSort={undefined} handleFilter={undefined} />
        );
        validate(wrapper, 0, 0);
        wrapper.unmount();
    });

    test('experimental-grid-col-header-sort-filter disabled', () => {
        LABKEY.moduleContext.samplemanagement = {
            'experimental-grid-col-header-sort-filter': false,
        };
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} />);
        validate(wrapper, 0, 2);
        wrapper.unmount();
    });

    test('isSortAsc', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({ sorts: [new QuerySort({ fieldKey: 'column', dir: '' })] });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 6);
        expect(wrapper.find('.fa-filter')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(2);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(1);
        const sortAscItem = wrapper.find(MenuItem).at(3);
        expect(sortAscItem.text()).toContain('Sort ascending');
        expect(sortAscItem.prop('disabled')).toBe(true);
        const sortDescItem = wrapper.find(MenuItem).at(4);
        expect(sortDescItem.text()).toContain('Sort descending');
        expect(sortDescItem.prop('disabled')).toBe(false);
        const clearSortItem = wrapper.find(MenuItem).at(5);
        expect(clearSortItem.text()).toContain('Clear sort');
        expect(clearSortItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('isSortDesc', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({ sorts: [new QuerySort({ fieldKey: 'column', dir: '-' })] });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 6);
        expect(wrapper.find('.fa-filter')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(2);
        const sortAscItem = wrapper.find(MenuItem).at(3);
        expect(sortAscItem.text()).toContain('Sort ascending');
        expect(sortAscItem.prop('disabled')).toBe(false);
        const sortDescItem = wrapper.find(MenuItem).at(4);
        expect(sortDescItem.text()).toContain('Sort descending');
        expect(sortDescItem.prop('disabled')).toBe(true);
        const clearSortItem = wrapper.find(MenuItem).at(5);
        expect(clearSortItem.text()).toContain('Clear sort');
        expect(clearSortItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('one colFilters', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({ filterArray: [Filter.create('column', 'value', Filter.Types.EQUALS)] });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 6);
        expect(wrapper.find('.fa-filter')).toHaveLength(2);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(1);
        const removeFilterItem = wrapper.find(MenuItem).at(1);
        expect(removeFilterItem.text()).toBe('  Remove filter');
        expect(removeFilterItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });

    test('multiple colFilters', () => {
        const model = makeTestQueryModel(SchemaQuery.create('schema', 'query')).mutate({ filterArray: [Filter.create('column', 'value', Filter.Types.EQUALS), Filter.create('column', 'value', Filter.Types.ISBLANK)] });
        const wrapper = mount(<HeaderCellDropdown {...DEFAULT_PROPS} model={model} />);
        validate(wrapper, 1, 6);
        expect(wrapper.find('.fa-filter')).toHaveLength(2);
        expect(wrapper.find('.fa-sort-amount-asc')).toHaveLength(1);
        expect(wrapper.find('.fa-sort-amount-desc')).toHaveLength(1);
        const removeFilterItem = wrapper.find(MenuItem).at(1);
        expect(removeFilterItem.text()).toBe('  Remove filters');
        expect(removeFilterItem.prop('disabled')).toBe(false);
        wrapper.unmount();
    });
});
