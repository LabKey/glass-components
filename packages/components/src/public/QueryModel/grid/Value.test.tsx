import React from 'react';
import { List } from 'immutable';
import { Filter } from '@labkey/api';

import { render } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { QueryInfo } from '../../QueryInfo';

import { Value } from './Value';
import { FilterAction } from './actions/Filter';
import { ViewAction } from './actions/View';

const filterAction = {
    action: new FilterAction(
        'query',
        () => List(),
        () => new QueryInfo({})
    ),
    value: 'test',
    valueObject: Filter.create('A', 'test', Filter.Types.EQUAL),
};
const readOnlyAction = {
    action: new FilterAction(
        'query',
        () => List(),
        () => new QueryInfo({})
    ),
    value: 'test',
    valueObject: Filter.create('A', 'test', Filter.Types.EQUAL),
    isReadOnly: 'Filter is read only',
};
const nonRemovableAction = {
    action: new FilterAction(
        'query',
        () => List(),
        () => new QueryInfo({})
    ),
    value: 'test',
    valueObject: Filter.create('A', 'test', Filter.Types.EQUAL),
    isRemovable: false,
};
const viewAction = {
    action: new ViewAction(
        'query',
        () => List(),
        () => new QueryInfo({})
    ),
    value: 'view',
};

describe('Value', () => {
    const DEFAULT_PROPS = {
        index: 0,
        onClick: jest.fn,
        onRemove: jest.fn,
    };

    function validate(readOnly: boolean, active: boolean, canRemove: boolean): void {
        expect(document.querySelectorAll('.filter-status-value')).toHaveLength(1);
        expect(document.querySelectorAll('.is-active')).toHaveLength(active ? 1 : 0);
        expect(document.querySelectorAll('.is-disabled')).toHaveLength(0);
        expect(document.querySelectorAll('.is-readonly')).toHaveLength(readOnly ? 1 : 0);
        expect(document.querySelectorAll('.read-lock')).toHaveLength(readOnly ? 1 : 0);
        expect(document.querySelectorAll('.symbol')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-close')).toHaveLength(canRemove ? 1 : 0);
    }

    test('filter action', async () => {
        const onClick = jest.fn();
        const onRemove = jest.fn();
        render(<Value {...DEFAULT_PROPS} actionValue={filterAction} onClick={onClick} onRemove={onRemove} />);
        validate(false, false, false);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);

        expect(onClick).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector('.filter-status-value span'));
        expect(onClick).toHaveBeenCalledTimes(1);

        expect(onRemove).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector('.symbol'));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    test('click isReadOnly action', async () => {
        const onClick = jest.fn();
        const onRemove = jest.fn();
        render(<Value {...DEFAULT_PROPS} actionValue={readOnlyAction} onClick={onClick} onRemove={onRemove} />);
        validate(true, false, false);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);

        expect(onClick).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector('.filter-status-value span'));
        expect(onClick).toHaveBeenCalledTimes(0);

        expect(onRemove).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector('.symbol'));
        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    test('click nonRemovableAction action', async () => {
        const onClick = jest.fn();
        const onRemove = jest.fn();
        render(<Value {...DEFAULT_PROPS} actionValue={nonRemovableAction} onClick={onClick} onRemove={onRemove} />);
        validate(false, false, false);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);

        expect(onClick).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector('.filter-status-value span'));
        expect(onClick).toHaveBeenCalledTimes(1);

        expect(onRemove).toHaveBeenCalledTimes(0);
        await userEvent.click(document.querySelector('.symbol'));
        expect(onRemove).toHaveBeenCalledTimes(0);
    });

    test('showRemoveIcon for filter action', async () => {
        render(<Value {...DEFAULT_PROPS} actionValue={filterAction} />);
        validate(false, false, false);
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);
        await userEvent.hover(document.querySelector('.filter-status-value'));
        validate(false, true, true);
    });

    test('do not showRemoveIcon for view action', async () => {
        render(<Value {...DEFAULT_PROPS} actionValue={viewAction} />);
        validate(false, false, false);
        expect(document.querySelectorAll('.fa-table')).toHaveLength(1);
        await userEvent.hover(document.querySelector('.filter-status-value'));
        validate(false, true, false);
    });
});
