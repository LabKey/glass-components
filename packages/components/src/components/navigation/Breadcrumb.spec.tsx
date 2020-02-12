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
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { AppURL } from '../../url/AppURL';

import { Breadcrumb } from './Breadcrumb';

describe('<Breadcrumb/>', () => {
    test('with one link', () => {
        const component = (
            <Breadcrumb>
                <a href={AppURL.create('q').toString()}>First</a>
            </Breadcrumb>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with multiple links', () => {
        const component = (
            <Breadcrumb>
                <a href={AppURL.create('q').toString()}>First</a>
                <a href={AppURL.create('q', 'two').toString()}>Second</a>
                <a href={AppURL.create('q', 'two', 'three').toString()}>Third</a>
            </Breadcrumb>
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with className prop', () => {
        const component = <Breadcrumb className="anotherclass" />;

        const wrapper = mount(component);
        expect(
            wrapper
                .find('ol')
                .getDOMNode()
                .getAttribute('class')
        ).toBe('breadcrumb anotherclass');
        wrapper.unmount();
    });
});
