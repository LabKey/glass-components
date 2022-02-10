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
import { List } from 'immutable';

import { MenuItem, OverlayTrigger } from 'react-bootstrap';

import { QueryGridModel } from '../../..';

import { SelectionMenuItem } from './SelectionMenuItem';

describe('<SelectionMenuItem/>', () => {
    test('without selections', () => {
        const text = 'Menu Item Text';
        const model = new QueryGridModel({
            totalRows: 3,
            selectedIds: List(),
        });
        const component = <SelectionMenuItem id="jest-test-1" model={model} text={text} onClick={jest.fn()} />;

        const wrapper = mount(component);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find(MenuItem).text()).toBe(text);
        expect(wrapper.find('li').getDOMNode().getAttribute('class')).toBe('disabled');
        expect(wrapper.find(OverlayTrigger)).toHaveLength(1);
        wrapper.unmount();
    });

    test('with selections', () => {
        const text = 'Menu Item Text';
        const model = new QueryGridModel({
            totalRows: 3,
            selectedIds: List(['1', '2']),
        });
        const component = <SelectionMenuItem id="jest-test-1" model={model} text={text} onClick={jest.fn()} />;

        const wrapper = mount(component);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find(MenuItem).text()).toBe(text);
        expect(wrapper.find('li').getDOMNode().getAttribute('class')).toBe('');
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);
        wrapper.unmount();
    });

    test('with maxSelection but not too many', () => {
        const text = 'Menu Item Text';
        const model = new QueryGridModel({
            totalRows: 5,
            selectedIds: List(['1', '2', '3']),
        });
        const component = (
            <SelectionMenuItem maxSelection={4} id="jest-test-1" model={model} text={text} onClick={jest.fn()} />
        );

        const wrapper = mount(component);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find('li').getDOMNode().getAttribute('class')).toBe('');
        expect(wrapper.find(OverlayTrigger)).toHaveLength(0);
        wrapper.unmount();
    });

    test('with maxSelection too many', () => {
        const text = 'Menu Item Text';
        const model = new QueryGridModel({
            totalRows: 5,
            selectedIds: List(['1', '2', '3']),
        });
        const component = (
            <SelectionMenuItem maxSelection={2} id="jest-test-1" model={model} text={text} onClick={jest.fn()} />
        );

        const wrapper = mount(component);
        expect(wrapper.find(MenuItem)).toHaveLength(1);
        expect(wrapper.find('li').getDOMNode().getAttribute('class')).toBe('disabled');
        expect(wrapper.find(OverlayTrigger)).toHaveLength(1);
        wrapper.unmount();
    });

    test('with href', () => {
        const text = 'Menu Item Text';
        const model = new QueryGridModel({
            totalRows: 5,
            selectedIds: List(['1', '2', '3']),
        });
        const href = "http://my.href.test";
        const wrapper = mount(<SelectionMenuItem maxSelection={2} id="jest-test-1" model={model} text={text} href={href} />);
        expect(wrapper.prop('href')).toBe(href);
        expect(wrapper.prop('onClick')).toBe(undefined);
    });
});
