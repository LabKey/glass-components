import React from 'react';

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { AutoForm, FormSchema } from './AutoForm';

describe('AutoForm', () => {
    const expectField = (field, index): void => {
        const fieldEl = document.querySelectorAll('.auto-form-field')[index];

        const label = fieldEl.querySelectorAll('label')[0];
        expect(label.textContent).toContain(field.label + (field.required ? '*' : ''));

        if (field.helpText) {
            // Can't assert text content of help icon at the moment, so just assert it exists.
            expect(label.querySelectorAll('.help-icon')).toHaveLength(1);
        }

        if (field.type === 'textarea') {
            expect(fieldEl.querySelectorAll('textarea').length).toEqual(1);
        } else if (field.type === 'radio') {
            const radios = fieldEl.querySelectorAll('label.radio-inline');
            expect(radios.length).toEqual(field.options.length);
            field.options.forEach((option, idx) => {
                const radio = radios[idx];
                expect(radio.querySelector('input').getAttribute('name')).toEqual(field.name);
                expect(radio.querySelector('input').getAttribute('value')).toEqual(option.value);
                expect(radio.textContent).toEqual(option.label);
            });
        } else if (field.type === 'checkbox') {
            expect(fieldEl.querySelectorAll('input[type="checkbox"]').length).toEqual(1);
        } else if (field.type === 'select') {
            expect(fieldEl.querySelectorAll('select').length).toEqual(1);
            const expectedOptions = field.placeholder ? field.options.length + 1 : field.options.length;
            const optionEls = fieldEl.querySelectorAll('select > option');
            expect(optionEls.length).toEqual(expectedOptions);
            optionEls.forEach((optionEl, idx) => {
                if (field.placeholder && idx === 0) {
                    expect(optionEl.getAttribute('value')).toEqual('');
                    expect(optionEl.textContent).toEqual(field.placeholder);
                } else {
                    const option = field.options[field.placeholder ? idx - 1 : idx];
                    expect(optionEl.getAttribute('value')).toEqual(option.value);
                    expect(optionEl.textContent).toEqual(option.label);
                }
            });
        } else {
            expect(fieldEl.querySelectorAll('input[type="text"]').length).toEqual(1);
        }
    };
    test('render', () => {
        const formSchema: FormSchema = {
            fields: [
                {
                    label: 'text field',
                    name: 'textField',
                    type: 'text',
                },
                {
                    label: 'text field, required',
                    name: 'textFieldRequired',
                    type: 'text',
                },
                {
                    label: 'text field, help text',
                    name: 'textFieldHelpText',
                    helpText: 'this is help text',
                    type: 'text',
                },
                {
                    label: 'text field, help text and href',
                    name: 'textFieldHelpTextHref',
                    helpText: 'this is help text',
                    helpTextHref: '',
                    type: 'text',
                },
                {
                    label: 'textarea field',
                    name: 'textareaField',
                    type: 'textarea',
                },
                {
                    label: 'number field',
                    name: 'numberField',
                    type: 'number',
                },
                {
                    label: 'checkbox field',
                    name: 'checkboxField',
                    type: 'checkbox',
                },
                {
                    label: 'select field w/ placeholder',
                    name: 'selectFieldPlaceholder',
                    placeholder: 'select placeholder',
                    options: [
                        { label: 'option 1', value: 'option1' },
                        { label: 'option 2', value: 'option2' },
                    ],
                    type: 'select',
                },
                {
                    label: 'select field w/o placeholder',
                    name: 'selectFieldNoPlaceholder',
                    options: [
                        { label: 'option 1', value: 'option1' },
                        { label: 'option 2', value: 'option2' },
                    ],
                    type: 'select',
                },
                {
                    label: 'radio field',
                    name: 'radioField',
                    options: [
                        { label: 'option 1', value: 'option1' },
                        { label: 'option 2', value: 'option2' },
                    ],
                    type: 'radio',
                },
            ],
        };
        render(<AutoForm formSchema={formSchema} onChange={jest.fn()} values={{}} />);

        formSchema.fields.forEach((field, index) => expectField(field, index));
    });

    test('interaction', async () => {
        const formSchema: FormSchema = {
            fields: [
                {
                    label: 'text field',
                    name: 'textField',
                    type: 'text',
                },
                {
                    label: 'radio field',
                    name: 'radioField',
                    options: [
                        { label: 'option 1', value: 'option1' },
                        { label: 'option 2', value: 'option2' },
                    ],
                    type: 'radio',
                },
                {
                    label: 'select field w/o placeholder',
                    name: 'selectField',
                    options: [
                        { label: 'option 1', value: 'option1' },
                        { label: 'option 2', value: 'option2' },
                    ],
                    type: 'select',
                },
                {
                    label: 'checkbox field',
                    name: 'checkboxField',
                    type: 'checkbox',
                },
            ],
        };

        const onChange = jest.fn();
        render(<AutoForm formSchema={formSchema} onChange={onChange} values={{}} />);
        const text = 'I am text';
        await userEvent.type(document.querySelectorAll('input[type="text"]')[0], text);
        expect(onChange).toHaveBeenCalledTimes(9);
        expect(onChange).toHaveBeenLastCalledWith('textField', 't');
        await userEvent.click(document.querySelectorAll('input[type="radio"]')[1]);
        expect(onChange).toHaveBeenLastCalledWith('radioField', 'option2');
        await userEvent.selectOptions(document.querySelectorAll('select')[0], 'option2');
        expect(onChange).toHaveBeenLastCalledWith('selectField', 'option2');
    });
});
