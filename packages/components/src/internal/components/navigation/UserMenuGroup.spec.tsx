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
import { ReactWrapper } from 'enzyme';

import { User } from '../base/models/User';

import { UserMenuGroupImpl } from './UserMenuGroup';
import { MenuSectionModel } from './model';
import { mountWithAppServerContext } from '../../test/enzymeTestHelpers';
import {DropdownMenu, MenuItem} from '../../dropdowns';

beforeEach(() => {
    LABKEY.devMode = false;
    LABKEY.moduleContext = {};
});

describe('UserMenuGroup', () => {
    const section = MenuSectionModel.create({
        key: 'user',
        label: 'Your Items',
        url: undefined,
        items: [
            {
                key: 'profile',
                label: 'Profile',
                url: 'profile/link/here',
                requiresLogin: true,
            },
            {
                key: 'docs',
                label: 'Documentation',
                url: 'http://show/me/the/docs',
                requiresLogin: false,
            },
        ],
        sectionKey: 'user',
    });

    const noHelpSection = MenuSectionModel.create({
        key: 'user',
        label: 'Your Items',
        url: undefined,
        items: [
            {
                key: 'profile',
                label: 'Profile',
                url: 'profile/link/here',
                requiresLogin: true,
            },
            {
                key: 'notdocs',
                label: 'Documentation',
                url: 'http://show/me/the/docs',
                requiresLogin: false,
            },
        ],
        sectionKey: 'user',
    });

    const withAdmins = MenuSectionModel.create({
        key: 'user',
        label: 'Your Items',
        url: undefined,
        items: [
            {
                key: 'profile',
                label: 'Profile',
                url: 'profile/link/here',
                requiresLogin: true,
            },
            {
                key: 'adminsetting',
                label: 'Application Settings',
                url: 'settings',
                requiresLogin: true,
            },
            {
                key: 'docs',
                label: 'Documentation',
                url: 'http://show/me/the/docs',
                requiresLogin: false,
            },
        ],
        sectionKey: 'user',
    });

    function verifyMenuOptions(menu: any, options: string[]) {
        const menuOptions = menu.find('MenuItem');
        expect(menuOptions).toHaveLength(options?.length);
        expect(menuOptions.at(0).text()).toEqual(options[0]);
        for (let i = 0; i < options.length; i++) {
            expect(menuOptions.at(i).text()).toEqual(options[i]);
        }
    }

    function verify(wrapper: ReactWrapper, userOptions?: string[], adminOptions?: string[], helpOptions?: string[]) {
        const userMenu = wrapper.find('DropdownMenu');
        const userMenuOptions = userMenu.at(0).find('MenuItem');
        expect(userMenuOptions).toHaveLength(userOptions?.length);
        for (let i = 0; i < userOptions.length; i++) {
            expect(userMenuOptions.at(i).text()).toEqual(userOptions[i]);
        }

        const dropdowns = wrapper.find('DropdownButton');

        let dropdownCount = 0,
            helpMenu,
            adminMenu;
        if (adminOptions?.length > 0) {
            adminMenu = dropdowns.at(dropdownCount);
            verifyMenuOptions(adminMenu, adminOptions);
            dropdownCount += 1;
        }
        if (helpOptions?.length > 0) {
            helpMenu = dropdowns.at(dropdownCount);
            verifyMenuOptions(helpMenu, helpOptions);
            dropdownCount += 1;
        }

        expect(dropdowns).toHaveLength(dropdownCount);
    }

    test('not initialized', () => {
        const model = new MenuSectionModel({});
        const tree = mountWithAppServerContext(<UserMenuGroupImpl model={model} user={new User()} />);
        expect(tree).toEqual({});
    });

    test('user not logged in', () => {
        const user = new User({
            isSignedIn: false,
        });

        const tree = mountWithAppServerContext(<UserMenuGroupImpl model={section} user={user} />);
        verify(tree, ['Sign In'], null, ['Help']);
    });

    test('no help icon', () => {
        const user = new User({
            isSignedIn: false,
        });

        const tree = mountWithAppServerContext(<UserMenuGroupImpl model={noHelpSection} user={user} />);
        verify(tree, ['Documentation', 'Sign In'], null, null);
    });

    test('with admin items', () => {
        const user = new User({
            isSignedIn: true,
        });

        const tree = mountWithAppServerContext(<UserMenuGroupImpl model={withAdmins} user={user} />);

        verify(tree, ['Profile', 'Sign Out'], ['Application Settings'], ['Help']);
    });

    test('user logged in, but not in dev mode', () => {
        const user = new User({
            isSignedIn: true,
        });

        const tree = mountWithAppServerContext(<UserMenuGroupImpl model={section} user={user} />);
        verify(tree, ['Profile', 'Sign Out'], null, ['Help']);
    });

    test('user logged in dev mode', () => {
        const user = new User({
            isSignedIn: true,
        });
        LABKEY.devMode = true;

        const tree = mountWithAppServerContext(<UserMenuGroupImpl model={section} user={user} />);
        verify(tree, ['Profile', 'Sign Out'], ['Enable Redux Tools'], ['Help']);
    });

    test('user logged in extra items', () => {
        const user = new User({
            isSignedIn: true,
        });

        const extraUserItems = (
            <>
                <MenuItem key="e1">Extra One</MenuItem>
                <MenuItem key="e2">Extra Two</MenuItem>
            </>
        );
        const tree = mountWithAppServerContext(<UserMenuGroupImpl model={section} user={user} extraUserItems={extraUserItems} />);

        verify(tree, ['Profile', 'Extra One', 'Extra Two', 'Sign Out'], null, ['Help']);
    });

    test('user logged in extra dev mode items', () => {
        const user = new User({
            isSignedIn: true,
        });

        const extraUserItems = (
            <>
                <MenuItem key="e1">Extra One</MenuItem>
                <MenuItem key="e2">Extra Two</MenuItem>
            </>
        );
        const extraDevItems = (
            <>
                <MenuItem key="d1">Extra Dev One</MenuItem>
                <MenuItem key="d2">Extra Dev Two</MenuItem>
            </>
        );

        LABKEY.devMode = true;
        const tree = mountWithAppServerContext(
            <UserMenuGroupImpl
                extraDevItems={extraDevItems}
                extraUserItems={extraUserItems}
                model={section}
                user={user}
            />
        );

        verify(
            tree,
            ['Profile', 'Extra One', 'Extra Two', 'Sign Out'],
            ['Enable Redux Tools', 'Extra Dev One', 'Extra Dev Two'],
            ['Help']
        );
    });

    test('with release note, with help', () => {
        LABKEY.moduleContext = {
            samplemanagement: {
                productId: 'SampleManager',
            },
        };

        const user = new User({
            isSignedIn: true,
        });

        const tree = mountWithAppServerContext(<UserMenuGroupImpl model={withAdmins} user={user} />);

        verify(tree, ['Profile', 'Sign Out'], ['Application Settings'], ['Help', 'Release Notes']);
    });

    test('with release note, without help', () => {
        LABKEY.moduleContext = {
            samplemanagement: {
                productId: 'SampleManager',
            },
        };

        const user = new User({
            isSignedIn: false,
        });

        const tree = mountWithAppServerContext(<UserMenuGroupImpl model={noHelpSection} user={user} />);

        verify(tree, ['Documentation', 'Sign In'], null, ['Release Notes']);
    });
});
