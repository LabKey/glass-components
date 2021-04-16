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
import { mount } from 'enzyme';
import { fromJS, Map } from 'immutable';

import { FileColumnRenderer, FileInput, QueryColumn } from '../../..';

import { fileInputRenderer, resolveDetailFieldValue } from './renderers';

describe('resolveDetailFieldValue', () => {
    test('data value undefined', () => {
        expect(resolveDetailFieldValue(undefined)).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: undefined }))).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: undefined, displayValue: undefined }))).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: null, displayValue: null }))).toBe(undefined);
    });

    test('data value defined', () => {
        expect(resolveDetailFieldValue(fromJS({ value: 'test1', displayValue: undefined }))).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }))).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1', displayValue: 'Test Display' }))).toBe('Test Display');
    });

    test('lookup prop', () => {
        expect(resolveDetailFieldValue(fromJS({ value: 'test1', displayValue: undefined }), false)).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), false)).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1', displayValue: 'Test Display' }), false)).toBe(
            'Test Display'
        );

        expect(resolveDetailFieldValue(fromJS({ value: 'test1', displayValue: undefined }), true)).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), true)).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1', displayValue: 'Test Display' }), true)).toBe('test1');
    });

    test('ignoreFormattedValue prop', () => {
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: undefined, formattedValue: undefined }),
                false,
                false
            )
        ).toBe(undefined);
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), false, false)).toBe('test1');
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: 'Test Display', formattedValue: 'Test Formatted' }),
                false,
                false
            )
        ).toBe('Test Formatted');

        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: undefined, formattedValue: undefined }),
                true,
                true
            )
        ).toBe('test1');
        expect(resolveDetailFieldValue(fromJS({ value: 'test1' }), true, true)).toBe('test1');
        expect(
            resolveDetailFieldValue(
                fromJS({ value: 'test1', displayValue: 'Test Display', formattedValue: 'Test Formatted' }),
                true,
                true
            )
        ).toBe('test1');
    });
});

describe('fileInputRenderer', () => {
    const column = new QueryColumn({ name: 'test' });

    test('without value', () => {
        const wrapper = mount(<div>{fileInputRenderer(column, Map(), undefined, jest.fn)}</div>);
        expect(wrapper.find(FileColumnRenderer)).toHaveLength(0);
        expect(wrapper.find(FileInput)).toHaveLength(1);
        wrapper.unmount();
    });

    test('with value', () => {
        const wrapper = mount(<div>{fileInputRenderer(column, Map({ value: 'test.txt' }), undefined, jest.fn)}</div>);
        expect(wrapper.find(FileColumnRenderer)).toHaveLength(1);
        expect(wrapper.find(FileInput)).toHaveLength(0);
        wrapper.unmount();
    });

    test('updatedFile', () => {
        const wrapper = mount(<div>{fileInputRenderer(column, Map(), new File([], null), jest.fn)}</div>);
        expect(wrapper.find(FileColumnRenderer)).toHaveLength(0);
        expect(wrapper.find(FileInput)).toHaveLength(1);
        wrapper.unmount();
    });
});
