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

import { shallow } from 'enzyme';

import { AddEntityButton } from './AddEntityButton';

describe('<AddEntityButton />', () => {
    test('Minimal properties', () => {
        const onClick = jest.fn();
        const wrapper = shallow(
            <AddEntityButton
                entity="EntityName"
                onClick={onClick}
            />);
        expect(wrapper).toMatchSnapshot();
    });

    test('Typical properties', () => {
        const onClick = jest.fn();
        const wrapper = shallow(
            <AddEntityButton
                entity="EntityName"
                buttonClass="button-class-name"
                containerClass="container-class-name"
                onClick={onClick}
            />);
        expect(wrapper).toMatchSnapshot();
    });
});
