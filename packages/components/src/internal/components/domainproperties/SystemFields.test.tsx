import React from 'react';

import { render } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS } from '../samples/constants';

import { SystemFields } from './SystemFields';

describe('SystemFields', () => {
    function verifyEnableCheckbox(enableCheckboxes: any, isExpDateDisabled: boolean) {
        expect(enableCheckboxes.length).toEqual(7 * 2);
        const nameCheckbox = enableCheckboxes[0];
        expect(nameCheckbox.hasAttribute('checked')).toBeTruthy();
        expect(nameCheckbox.hasAttribute('disabled')).toBeTruthy();
        const statusCheckbox = enableCheckboxes[2];
        expect(statusCheckbox.hasAttribute('checked')).toBeTruthy();
        expect(statusCheckbox.hasAttribute('disabled')).toBeTruthy();
        const descCheckbox = enableCheckboxes[4];
        expect(descCheckbox.hasAttribute('checked')).toBeTruthy();
        expect(descCheckbox.hasAttribute('disabled')).toBeFalsy();
        const expCheckbox = enableCheckboxes[6];
        expect(expCheckbox.hasAttribute('checked')).toEqual(!isExpDateDisabled);
        expect(expCheckbox.hasAttribute('disabled')).toBeFalsy();
    }

    test('Default', () => {
        render(<SystemFields fields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS} onSystemFieldEnable={jest.fn()} />);
        const rowCount = SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS.length;
        expect(document.querySelectorAll('tr')).toHaveLength(rowCount + 1);
        expect(document.querySelectorAll('th')).toHaveLength(6);

        const enableCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        expect(enableCheckboxes.length).toEqual(rowCount * 2);

        verifyEnableCheckbox(enableCheckboxes, false);
    });

    test('Toggle', async () => {
        render(<SystemFields fields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS} onSystemFieldEnable={jest.fn()} />);

        expect(document.querySelectorAll('.collapse.in')).toHaveLength(1);

        const header = document.querySelector('.domain-system-fields-header__icon');
        await userEvent.click(header);

        expect(document.querySelectorAll('.collapse.in')).toHaveLength(0);
    });

    test('With disabled fields', () => {
        render(
            <SystemFields
                fields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS}
                onSystemFieldEnable={jest.fn()}
                disabledSystemFields={['MaterialExpDate']}
            />
        );
        const enableCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        verifyEnableCheckbox(enableCheckboxes, true);
    });

    test('With disabled fields, case insenstive', () => {
        render(
            <SystemFields
                fields={SAMPLE_DOMAIN_DEFAULT_SYSTEM_FIELDS}
                onSystemFieldEnable={jest.fn()}
                disabledSystemFields={['materialexpdate']}
            />
        );
        const enableCheckboxes = document.querySelectorAll('input[type="checkbox"]');
        verifyEnableCheckbox(enableCheckboxes, true);
    });
});
