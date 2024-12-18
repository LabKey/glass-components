import React from 'react';
import { render } from '@testing-library/react';

import { QueryColumn } from '../../../../public/QueryColumn';

import { Formsy } from '../formsy';

import { DatePickerInput, DatePickerInputImpl } from './DatePickerInput';

describe('DatePickerInput', () => {
    const DEFAULT_PROPS = {
        name: 'col',
        queryColumn: new QueryColumn({ fieldKey: 'col', caption: 'Test Column', required: true }),
    };

    function validate(hasFieldLabel = true): void {
        expect(document.querySelectorAll('.control-label')).toHaveLength(hasFieldLabel ? 1 : 0);
        expect(document.querySelectorAll('.react-datepicker-wrapper')).toHaveLength(1);
    }

    test('default props', () => {
        render(
            <Formsy>
                <DatePickerInput {...DEFAULT_PROPS} />
            </Formsy>
        );

        validate();

        const input = document.querySelector('.react-datepicker__input-container input');
        expect(input).toBeDefined();
        expect(input.getAttribute('name')).toEqual('col');
        expect(input.getAttribute('placeholder')).toEqual('Select test column');
    });

    test('not isFormInput', () => {
        render(
            <Formsy>
                <DatePickerInput {...DEFAULT_PROPS} isFormInput={false} />
            </Formsy>
        );
        validate(false);
    });

    test('with name and placeholderText props', () => {
        render(
            <Formsy>
                <DatePickerInput {...DEFAULT_PROPS} name="name" placeholderText="placeholder text" />
            </Formsy>
        );

        validate();

        const input = document.querySelector('.react-datepicker__input-container input');
        expect(input).toBeDefined();
        expect(input.getAttribute('name')).toEqual('name');
        expect(input.getAttribute('placeholder')).toEqual('placeholder text');
    });

    test('initialization of formsy value', () => {
        const queryColumn = new QueryColumn({
            fieldKey: 'col',
            caption: 'Test Column',
            required: true,
        });
        const setValue = jest.fn();

        render(
            // @ts-expect-error not supplying portion of formsy component interface
            <DatePickerInputImpl
                {...DEFAULT_PROPS}
                formsy={false}
                queryColumn={queryColumn}
                setValue={setValue}
                value="12/16/2024 11:20 am"
            />
        );

        expect(setValue).not.toHaveBeenCalled();
        setValue.mockReset();

        render(
            // @ts-expect-error not supplying portion FormsyInjectedProps interface
            <DatePickerInputImpl
                {...DEFAULT_PROPS}
                formsy
                queryColumn={queryColumn}
                setValue={setValue}
                value="12/16/2024 11:20 am"
            />
        );

        expect(setValue).toHaveBeenCalledWith('2024-12-16 11:20:00');
        setValue.mockReset();

        render(
            // @ts-expect-error not supplying portion FormsyInjectedProps interface
            <DatePickerInputImpl {...DEFAULT_PROPS} formsy queryColumn={queryColumn} setValue={setValue} />
        );

        expect(setValue).toHaveBeenCalledWith(undefined);
    });

    test('renderFieldLabel', () => {
        render(
            <Formsy>
                <DatePickerInput
                    {...DEFAULT_PROPS}
                    labelClassName="labelClassName"
                    renderFieldLabel={jest.fn().mockReturnValue('renderFieldLabel')}
                />
            </Formsy>
        );

        expect(document.querySelectorAll('input.form-control')).toHaveLength(1);
        expect(document.querySelector('.labelClassName').textContent).toBe('renderFieldLabel *');
    });
});
