import React from 'react';

import { User } from '../base/models/User';

import { MenuItem } from '../../dropdowns';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { UserMenuGroupImpl } from './UserMenuGroup';
import { MenuSectionModel } from './model';

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

    function verifyMenuOptions(menu, options: string[]) {
        const menuOptions = menu.querySelectorAll('.lk-menu-item');
        expect(menuOptions).toHaveLength(options?.length);
        expect(menuOptions[0].textContent).toEqual(options[0]);
        for (let i = 0; i < options.length; i++) {
            expect(menuOptions[i].textContent).toEqual(options[i]);
        }
    }

    function verify(userOptions?: string[], adminOptions?: string[], helpOptions?: string[]) {
        const userMenu = document.querySelector('.user-dropdown');
        const userMenuOptions = userMenu.querySelectorAll('.lk-menu-item');
        expect(userMenuOptions).toHaveLength(userOptions?.length);
        for (let i = 0; i < userOptions.length; i++) {
            expect(userMenuOptions[i].textContent).toEqual(userOptions[i]);
        }

        if (adminOptions?.length > 0) {
            const adminMenu = document.querySelector('.admin-dropdown');
            verifyMenuOptions(adminMenu, adminOptions);
        } else {
            expect(document.querySelectorAll('.admin-dropdown')).toHaveLength(0);
        }

        if (helpOptions?.length > 0) {
            const helpMenu = document.querySelector('.help-dropdown');
            verifyMenuOptions(helpMenu, helpOptions);
        } else {
            expect(document.querySelectorAll('.help-dropdown')).toHaveLength(0);
        }
    }

    test('not initialized', () => {
        const model = new MenuSectionModel({});
        renderWithAppContext(<UserMenuGroupImpl model={model} user={new User()} />);
        verify(['Sign In'], null, null);
    });

    test('user not logged in', () => {
        const user = new User({
            isSignedIn: false,
        });

        renderWithAppContext(<UserMenuGroupImpl model={section} user={user} />);
        verify(['Sign In'], null, ['Help']);
    });

    test('no help icon', () => {
        const user = new User({
            isSignedIn: false,
        });

        renderWithAppContext(<UserMenuGroupImpl model={noHelpSection} user={user} />);
        verify(['Documentation', 'Sign In'], null, null);
    });

    test('with admin items', () => {
        const user = new User({
            isSignedIn: true,
        });

        renderWithAppContext(<UserMenuGroupImpl model={withAdmins} user={user} />);

        verify(['Profile', 'Sign Out'], ['Application Settings'], ['Help']);
    });

    test('user logged in, but not in dev mode', () => {
        const user = new User({
            isSignedIn: true,
        });

        renderWithAppContext(<UserMenuGroupImpl model={section} user={user} />);
        verify(['Profile', 'Sign Out'], null, ['Help']);
    });

    test('user logged in dev mode', () => {
        const user = new User({
            isSignedIn: true,
        });
        LABKEY.devMode = true;

        renderWithAppContext(<UserMenuGroupImpl model={section} user={user} />);
        verify(['Profile', 'Sign Out'], ['Enable Redux Tools'], ['Help']);
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
        renderWithAppContext(<UserMenuGroupImpl model={section} user={user} extraUserItems={extraUserItems} />);

        verify(['Profile', 'Extra One', 'Extra Two', 'Sign Out'], null, ['Help']);
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
        renderWithAppContext(
            <UserMenuGroupImpl
                extraDevItems={extraDevItems}
                extraUserItems={extraUserItems}
                model={section}
                user={user}
            />
        );

        verify(
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

        renderWithAppContext(<UserMenuGroupImpl model={withAdmins} user={user} />);

        verify(['Profile', 'Sign Out'], ['Application Settings'], ['Help', 'Release Notes']);
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

        renderWithAppContext(<UserMenuGroupImpl model={noHelpSection} user={user} />);
        verify(['Documentation', 'Sign In'], null, ['Release Notes']);
    });
});
