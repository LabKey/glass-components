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
import { List } from 'immutable';
import renderer from 'react-test-renderer';

import { MenuOption, SubMenu } from './SubMenu';

describe('<SubMenu />', () => {
    test('no options', () => {
        const tree = renderer
            .create(<SubMenu currentMenuChoice="option 1" options={List<MenuOption>()} text="Test with no options" />)
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with options but none chosen', () => {
        const tree = renderer
            .create(
                <SubMenu
                    currentMenuChoice={undefined}
                    options={List<MenuOption>([
                        {
                            href: 'go/to/option1',
                            key: 'option1',
                            name: 'first option',
                        },
                        {
                            href: 'go/to/option2',
                            key: 'option2',
                            name: 'second option',
                        },
                        {
                            href: 'go/to/option3',
                            key: 'option3',
                            name: 'third option',
                        },
                    ])}
                    text="Test with options not chosen"
                />
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('two options, one chosen', () => {
        const tree = renderer
            .create(
                <SubMenu
                    currentMenuChoice="option1"
                    options={List<MenuOption>([
                        {
                            href: 'go/to/option1',
                            key: 'option1',
                            name: 'first option',
                        },
                        {
                            href: 'go/to/option2',
                            key: 'option2',
                            name: 'second option',
                        },
                    ])}
                    text="Test with two options"
                />
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('several options, one chosen', () => {
        const tree = renderer
            .create(
                <SubMenu
                    currentMenuChoice="option2"
                    options={List<MenuOption>([
                        {
                            href: 'go/to/option1',
                            key: 'option1',
                            name: 'first option',
                        },
                        {
                            href: 'go/to/option2',
                            key: 'option2',
                            name: 'second option',
                        },
                        {
                            href: 'go/to/option3',
                            key: 'option3',
                            name: 'third option',
                        },
                    ])}
                    text="Test with several options"
                />
            )
            .toJSON();
        expect(tree).toMatchSnapshot();
    });
});
