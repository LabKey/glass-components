import React from 'react';
import { Filter } from '@labkey/api';

import { userEvent } from '@testing-library/user-event';

import { render } from '@testing-library/react';

import { SearchAction } from './grid/actions/Search';
import { ViewAction } from './grid/actions/View';
import { FilterAction } from './grid/actions/Filter';

import { FilterStatus } from './FilterStatus';
import { SortAction } from './grid/actions/Sort';

describe('FilterStatus', () => {
    const ON_CLICK = jest.fn();
    const ON_REMOVE = jest.fn();
    const ON_REMOVE_ALL = jest.fn();
    const DEFAULT_PROPS = {
        actionValues: [],
        onClick: ON_CLICK,
        onRemove: ON_REMOVE,
        onRemoveAll: ON_REMOVE_ALL,
    };

    const filterAction1 = {
        action: new FilterAction(() => 'display'),
        value: 'test1',
        valueObject: Filter.create('A', 'test1', Filter.Types.EQUAL),
    };
    const filterAction2 = {
        action: new FilterAction(() => 'display'),
        value: 'test2',
        valueObject: Filter.create('A', undefined, Filter.Types.NONBLANK),
    };
    const searchAction = {
        action: new SearchAction(),
        value: 'foo',
        valueObject: Filter.create('*', 'foo', Filter.Types.Q),
    };
    const viewAction = {
        action: new ViewAction(),
        value: 'view',
    };
    const sortAction = {
        action: new SortAction(),
    };

    function validate(valueCount: number, filterCount: number): void {
        expect(document.querySelectorAll('.grid-panel__filter-status')).toHaveLength(1);
        expect(document.querySelectorAll('.filter-status-value')).toHaveLength(valueCount);
        expect(document.querySelectorAll('.remove-all-filters')).toHaveLength(filterCount > 1 ? 1 : 0);
    }

    test('no actionValues', () => {
        render(<FilterStatus {...DEFAULT_PROPS} />);
        validate(0, 0);
    });

    test('search actionValue', () => {
        render(<FilterStatus {...DEFAULT_PROPS} actionValues={[searchAction]} />);
        validate(1, 1);
    });

    test('only sortAction', () => {
        render(<FilterStatus {...DEFAULT_PROPS} actionValues={[sortAction]} />);
        validate(0, 0);
    });

    test('view, search and one filter actionValue', () => {
        render(<FilterStatus {...DEFAULT_PROPS} actionValues={[viewAction, searchAction, filterAction1]} />);
        validate(3, 1);
        expect(document.querySelectorAll('.fa-table')).toHaveLength(1);
        expect(document.querySelectorAll('.filter-status-value')[0].textContent).toBe('view');
        expect(document.querySelectorAll('.fa-search')).toHaveLength(1);
        expect(document.querySelectorAll('.filter-status-value')[1].textContent).toBe('foo');
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);
        expect(document.querySelectorAll('.filter-status-value')[2].textContent).toBe('test1');
        expect(document.querySelectorAll('.fa-close')).toHaveLength(0);
        expect(document.querySelectorAll('.remove-all-filters')).toHaveLength(0);
    });

    test('multiple filter actionValue', async () => {
        render(<FilterStatus {...DEFAULT_PROPS} actionValues={[filterAction1, filterAction2]} />);
        validate(2, 2);
        expect(document.querySelectorAll('.fa-table')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-search')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(2);
        expect(document.querySelectorAll('.filter-status-value')[0].textContent).toBe('test1');
        expect(document.querySelectorAll('.filter-status-value')[1].textContent).toBe('test2');
        expect(document.querySelectorAll('.fa-close')).toHaveLength(0);
        expect(document.querySelectorAll('.remove-all-filters')).toHaveLength(1);
        expect(ON_REMOVE_ALL).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector('.remove-all-filters'));
        expect(ON_REMOVE_ALL).toHaveBeenCalledTimes(1);
    });
});
