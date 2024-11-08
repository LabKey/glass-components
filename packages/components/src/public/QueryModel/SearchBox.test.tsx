import React from 'react';
import { Filter } from '@labkey/api';

import { render } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { SearchAction } from './grid/actions/Search';

import { SearchBox } from './SearchBox';

describe('SearchBox', () => {
    const ON_SEARCH = jest.fn();
    const DEFAULT_PROPS = {
        actionValues: [],
        onSearch: ON_SEARCH,
    };

    const searchAction = {
        action: new SearchAction('query'),
        value: 'foo',
        valueObject: Filter.create('*', 'foo', Filter.Types.Q),
    };

    function validate(hasAppliedSearchTerm: boolean): void {
        expect(document.querySelectorAll('.grid-panel__search-form')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-search')).toHaveLength(1);
        expect(document.querySelectorAll('.grid-panel__search-input')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-remove')).toHaveLength(hasAppliedSearchTerm ? 1 : 0);
    }

    test('no applied search term', async () => {
        render(<SearchBox {...DEFAULT_PROPS} />);
        validate(false);
        expect(document.querySelector('.grid-panel__search-input').getAttribute('value')).toBe('');
        expect(ON_SEARCH).toHaveBeenCalledTimes(0);
        await userEvent.type(document.querySelector('.grid-panel__search-input'), 'test');
        expect(ON_SEARCH).toHaveBeenCalledTimes(0);
        validate(false);
        expect(document.querySelector('.grid-panel__search-input').getAttribute('value')).toBe('test');
    });

    test('with applied search term', async () => {
        render(<SearchBox {...DEFAULT_PROPS} actionValues={[searchAction]} />);
        validate(true);
        expect(ON_SEARCH).toHaveBeenCalledTimes(0);
        expect(document.querySelector('.grid-panel__search-input').getAttribute('value')).toBe(searchAction.value);
        await userEvent.type(document.querySelector('.grid-panel__search-input'), 'test');
        expect(ON_SEARCH).toHaveBeenCalledTimes(0);
        validate(true);
        expect(document.querySelector('.grid-panel__search-input').getAttribute('value')).toBe('footest');
    });

    test('remove applied search term', async () => {
        render(<SearchBox {...DEFAULT_PROPS} actionValues={[searchAction]} />);
        validate(true);
        expect(ON_SEARCH).toHaveBeenCalledTimes(0);
        expect(document.querySelector('.grid-panel__search-input').getAttribute('value')).toBe(searchAction.value);
        await userEvent.click(document.querySelector('.fa-remove'));
        expect(ON_SEARCH).toHaveBeenCalledTimes(1);
        expect(document.querySelector('.grid-panel__search-input').getAttribute('value')).toBe('');
    });
});
