import React from 'react';

import { render } from '@testing-library/react';

import { RadioGroupInput, RadioGroupOption } from './RadioGroupInput';

describe('RadioGroupInput', () => {
    function validateOptionDisplay(
        element: HTMLElement,
        option: RadioGroupOption,
        selected: boolean,
        hidden?: boolean,
        showDescription = false
    ) {
        if (hidden) {
            expect(element.textContent).toBe('');
        } else {
            expect(element.textContent).toContain(option.label);
        }
        const input = element.querySelector('input');
        expect(input.getAttribute('value')).toBe(option.value);
        expect(input.hasAttribute('checked')).toBe(selected);
        expect(input.hasAttribute('disabled')).toBe(option.disabled === true);
        if (showDescription) {
            expect(element.querySelectorAll('.label-help-target')).toHaveLength(0);
            expect(element.querySelectorAll('.radioinput-description')).toHaveLength(
                !hidden && option.description ? 1 : 0
            );
        } else {
            expect(element.querySelectorAll('.label-help-target')).toHaveLength(!hidden && option.description ? 1 : 0);
            expect(element.querySelectorAll('.radioinput-description')).toHaveLength(0);
        }
    }

    test('no options', () => {
        render(<RadioGroupInput formsy={false} options={undefined} name="testRadio" />);
        expect(document.querySelectorAll('.radio-input-wrapper')).toHaveLength(0);
        expect(document.querySelectorAll('input')).toHaveLength(0);
    });

    test('one option', () => {
        const option = {
            value: 'only',
            label: 'only me',
            description: "It's only me here",
        };
        render(<RadioGroupInput formsy={false} options={[option]} name="testRadio" />);
        const divs = document.querySelectorAll('.radio-input-wrapper');
        expect(divs).toHaveLength(1);
        validateOptionDisplay(divs[0], option, true, true);
    });

    test('with options', () => {
        const options = [
            {
                value: 'one',
                label: 'one label',
                description: 'describe one',
            },
            {
                value: 'two',
                label: 'two label',
                description: <span className="two-description">Two description</span>,
                selected: true,
            },
            {
                value: 'three',
                label: 'three label',
                disabled: true,
            },
        ];

        render(<RadioGroupInput formsy={false} options={options} name="testRadio" />);
        const divs = document.querySelectorAll('.radio-input-wrapper');
        expect(divs).toHaveLength(3);
        validateOptionDisplay(divs[0], options[0], false, false);
        validateOptionDisplay(divs[1], options[1], true, false);
        validateOptionDisplay(divs[2], options[2], false, false);
    });

    test('showDescriptions', () => {
        const options = [
            {
                value: 'one',
                label: 'one label',
                description: 'describe one',
            },
            {
                value: 'two',
                label: 'two label',
                description: <span className="two-description">Two description</span>,
                selected: true,
            },
            {
                value: 'three',
                label: 'three label',
            },
        ];

        render(<RadioGroupInput formsy={false} options={options} name="testRadio" showDescriptions />);
        const divs = document.querySelectorAll('.radio-input-wrapper');
        expect(divs).toHaveLength(3);
        validateOptionDisplay(divs[0], options[0], false, false, true);
        validateOptionDisplay(divs[1], options[1], true, false, true);
        validateOptionDisplay(divs[2], options[2], false, false, true);
    });
});
