/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { render } from '@testing-library/react';


import { initOptions, SelectInputImpl, SelectInputProps } from './SelectInput';

describe('SelectInput', () => {
    function getDefaultProps(): Partial<SelectInputProps> {
        return {
            formsy: true,
            getErrorMessage: jest.fn(),
            getValue: jest.fn(),
            setValue: jest.fn(),
        };
    }

    test('Should apply css classes', () => {
        const containerCls = 'container-class-test';
        const inputCls = 'input-class-test';

        render(
            <SelectInputImpl {...getDefaultProps()} containerClass={containerCls} inputClass={inputCls} />
        );
        expect(document.querySelectorAll('.' + containerCls).length).toBe(1);
        expect(document.querySelectorAll('.' + inputCls).length).toBe(1);
    });

    // TODO convert those 2 tests?
    // test('Should saveOnBlur - creatable', async () => {
    //     const expectedInputValue = 'Hello';
    //     const selectProps = getDefaultProps();
    //
    //     const component = mount<SelectInputImpl>(<SelectInputImpl {...selectProps} allowCreate saveOnBlur />);
    //     setSelectInputText(component, expectedInputValue, true);
    //     await waitForLifecycle(component);
    //
    //     expect(selectProps.setValue).toHaveBeenCalledTimes(1);
    //     expect(component.state().selectedOptions).toHaveProperty('value', expectedInputValue);
    // });
    //
    // test('Should saveOnBlur - async', async () => {
    //     const selectProps = getDefaultProps();
    //     const filterOption = jest.fn((option, rawValue: string) => option.label === rawValue);
    //     const loadOptions = jest.fn().mockResolvedValue([
    //         { value: 'one', label: 'One' },
    //         { value: 'two', label: 'Two' },
    //     ]);
    //
    //     const component = render<SelectInputImpl>(
    //         <SelectInputImpl
    //             {...selectProps}
    //             filterOption={filterOption}
    //             loadOptions={loadOptions}
    //             multiple
    //             saveOnBlur
    //         />
    //     );
    //     setSelectInputText(component, 'Two');
    //     await waitForLifecycle(component);
    //     blurSelectInputInput(component);
    //
    //     expect(selectProps.setValue).toHaveBeenCalledTimes(1);
    //     expect(component.state().selectedOptions).toHaveLength(1);
    //     expect(component.state().selectedOptions[0].value).toEqual('two');
    // });

    function validateFieldLabel(component: any, labelText?: string): void {
        if (labelText !== undefined) {
            expect(document.querySelector('label').textContent).toBe(labelText);
        } else {
            expect(document.querySelectorAll('label')).toHaveLength(0);
        }
    }

    describe('renderFieldLabel', () => {
        const defaultLabel = 'Jest Label Test';
        const customLabel = 'Jest Custom Label Test';

        test('renderFieldLabel', () => {
            const component = render(<SelectInputImpl {...getDefaultProps()} label={defaultLabel} showLabel />);
            validateFieldLabel(component, defaultLabel + ' ');
        });
        test('renderFieldLabel, customLabel', () => {
            const component = render(<SelectInputImpl {...getDefaultProps()} label={defaultLabel} showLabel renderFieldLabel={() => <div>{customLabel}</div>} />);
            validateFieldLabel(component, customLabel);
        });

        test('renderFieldLabel, required', () => {
            const component = render(<SelectInputImpl {...getDefaultProps()} label={defaultLabel} showLabel required />);
            validateFieldLabel(component, defaultLabel + ' * ');
        });

        test('renderFieldLabel, showLabel=false', () => {
            const component = render(<SelectInputImpl {...getDefaultProps()} label={defaultLabel} showLabel={false} required />);
            validateFieldLabel(component);
        });

    });


    describe('initOptions', () => {
        test('empty values', () => {
            expect(initOptions({ value: undefined })).toBeUndefined();
            expect(initOptions({ value: null })).toBeUndefined();
            expect(initOptions({ value: '' })).toBeUndefined();
            expect(initOptions({ value: [] })).toHaveLength(0);
        });
        test('primitive values', () => {
            expect(initOptions({ value: 5 })).toEqual({ label: 5, value: 5 });
            expect(initOptions({ value: 'word' })).toEqual({ label: 'word', value: 'word' });
            expect(initOptions({ value: [5, 'word'] })).toEqual([
                { label: 5, value: 5 },
                { label: 'word', value: 'word' },
            ]);

            // labelKey / valueKey
            expect(initOptions({ labelKey: 'display', value: 5, valueKey: 'key' })).toEqual({ display: 5, key: 5 });
            expect(initOptions({ labelKey: 'display', value: 'word', valueKey: 'key' })).toEqual({
                display: 'word',
                key: 'word',
            });
        });
        test('options', () => {
            const option1 = { label: 'Five', value: 5 };
            const option2 = { label: 'Word', value: 'word' };
            const options = [option1, option2];

            expect(initOptions({ options, value: 5 })).toEqual(option1);
            expect(initOptions({ options, value: 'word' })).toEqual(option2);
            expect(initOptions({ options, value: 99 })).toEqual({ label: 99, value: 99 });

            // labelKey / valueKey
            const option3 = { name: 'Jackie Robinson', number: 42 };
            const option4 = { name: 'Ken Griffey Jr', number: 24 };
            const customOptions = [option3, option4];
            expect(initOptions({ labelKey: 'name', options: customOptions, value: 42, valueKey: 'number' })).toEqual(
                option3
            );
            expect(initOptions({ labelKey: 'name', options: customOptions, value: 99, valueKey: 'number' })).toEqual({
                name: 99,
                number: 99,
            });
        });

        test('grouped options', () => {
            const options = [
                {
                    label: 'Project Groups',
                    options: [
                        { label: 'group1', value: 1008 },
                        { label: 'groupLimitedPerm', value: 1017 },
                    ],
                },
                {
                    label: 'Users',
                    options: [
                        { label: 'editorjob', value: 1016 },
                        { label: 'readerjob', value: 1015 },
                        { label: 'user1', value: 1006 },
                    ],
                },
            ];

            expect(initOptions({ options, value: 1008 })).toEqual({ label: 'group1', value: 1008 });
            expect(initOptions({ options, value: 1015 })).toEqual({ label: 'readerjob', value: 1015 });
            expect(initOptions({ options, value: 99 })).toEqual({ label: 99, value: 99 });
            expect(initOptions({ options, value: 1008, labelKey: 'name' })).toEqual({ label: 'group1', value: 1008 });
        });
    });
});
