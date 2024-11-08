import React from 'react';

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { FiltersButton } from './FiltersButton';

describe('FiltersButton', () => {
    test('default props', async () => {
        const ON_FILTER = jest.fn();
        render(<FiltersButton onFilter={ON_FILTER} />);
        const button = document.querySelectorAll('.grid-panel__button');
        expect(button).toHaveLength(1);
        expect(button[0].textContent).toBe(' Filters');
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);
        expect(ON_FILTER).toHaveBeenCalledTimes(0);
        await userEvent.click(button[0]);
        expect(ON_FILTER).toHaveBeenCalledTimes(1);
    });

    test('iconOnly', async () => {
        const ON_FILTER = jest.fn();
        render(<FiltersButton onFilter={ON_FILTER} iconOnly />);
        const button = document.querySelectorAll('.grid-panel__button');
        expect(button).toHaveLength(1);
        expect(button[0].textContent).toBe('');
        expect(document.querySelectorAll('.fa-filter')).toHaveLength(1);
        expect(ON_FILTER).toHaveBeenCalledTimes(0);
        await userEvent.click(button[0]);
        expect(ON_FILTER).toHaveBeenCalledTimes(1);
    });
});
