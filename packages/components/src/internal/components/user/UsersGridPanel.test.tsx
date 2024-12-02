import React from 'react';

import { getRolesByUniqueName, processGetRolesResponse } from '../permissions/actions';
import policyJSON from '../../../test/data/security-getPolicy.json';
import rolesJSON from '../../../test/data/security-getRoles.json';
import { TEST_USER_APP_ADMIN, TEST_USER_FOLDER_ADMIN, TEST_USER_PROJECT_ADMIN } from '../../userFixtures';

import { SecurityPolicy } from '../permissions/models';
import { makeTestActions, makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SCHEMAS } from '../../schemas';
import { QueryInfo } from '../../../public/QueryInfo';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';
import { TEST_PROJECT_CONTAINER_ADMIN } from '../../containerFixtures';

import { UsersGridPanelImpl } from './UsersGridPanel';

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('<UsersGridPanel/>', () => {
    const DEFAULT_PROPS = {
        container: TEST_PROJECT_CONTAINER_ADMIN,
        user: TEST_USER_APP_ADMIN,
        onCreateComplete: jest.fn(),
        onUsersStateChangeComplete: jest.fn(),
        policy: POLICY,
        rolesByUniqueName: ROLES_BY_NAME,
        actions: makeTestActions(),
        queryModels: {
            'user-management-users-all': makeTestQueryModel(
                SCHEMAS.CORE_TABLES.USERS,
                new QueryInfo({}),
                {},
                [],
                0,
                'user-management-users-all'
            ),
            'user-management-users-active': makeTestQueryModel(
                SCHEMAS.CORE_TABLES.USERS,
                new QueryInfo({}),
                {},
                [],
                0,
                'user-management-users-active'
            ),
            'user-management-users-inactive': makeTestQueryModel(
                SCHEMAS.CORE_TABLES.USERS,
                new QueryInfo({}),
                {},
                [],
                0,
                'user-management-users-inactive'
            ),
        },
        searchParams: new URLSearchParams(),
        setSearchParams: jest.fn(),
    };

    test('active users view', async () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} />;

        renderWithAppContext(component);
        expect(document.querySelectorAll('.grid-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.user-details-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.view-header')[0].textContent).toBe('Application Active Users');
        const buttons = document.querySelectorAll('.grid-panel__button-bar-left button');
        expect(buttons).toHaveLength(4);
        expect(buttons[0].textContent).toBe('Create');
        expect(buttons[1].textContent).toBe('Manage');
        expect(document.querySelectorAll('.dropdown-toggle')[0].textContent.trim()).toEqual('Manage');

        const menuItems = document.querySelectorAll('.lk-menu-item');
        expect(menuItems).toHaveLength(10);
        expect(menuItems[0].textContent).toBe('Deactivate Users');
        expect(menuItems[1].textContent).toBe('Delete Users');
        expect(menuItems[2].textContent).toBe('View All Users');
        expect(menuItems[3].textContent).toBe('View Inactive Users');
    });

    test('without delete or deactivate', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} user={TEST_USER_PROJECT_ADMIN} />;

        renderWithAppContext(component);
        expect(document.querySelectorAll('.grid-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.user-details-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.view-header')[0].textContent).toBe('Application Active Users');
        const buttons = document.querySelectorAll('.grid-panel__button-bar-left button');
        expect(buttons).toHaveLength(4);
        expect(buttons[0].textContent).toBe('Create');
        expect(buttons[1].textContent).toBe('Manage');
        expect(document.querySelectorAll('.dropdown-toggle')[0].textContent.trim()).toEqual('Manage');

        const menuItems = document.querySelectorAll('.lk-menu-item');
        expect(menuItems).toHaveLength(8);
        expect(menuItems[0].textContent).toBe('View All Users');
        expect(menuItems[1].textContent).toBe('View Inactive Users');
    });

    test('without create, delete, or deactivate', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} user={TEST_USER_FOLDER_ADMIN} />;

        renderWithAppContext(component);
        expect(document.querySelectorAll('.grid-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.user-details-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.view-header')[0].textContent).toBe('Application Active Users');
        const buttons = document.querySelectorAll('.grid-panel__button-bar-left button');
        expect(buttons).toHaveLength(3);
        expect(buttons[0].textContent).toBe('Manage');
        expect(document.querySelectorAll('.dropdown-toggle')[0].textContent.trim()).toEqual('Manage');

        const menuItems = document.querySelectorAll('.lk-menu-item');
        expect(menuItems).toHaveLength(8);
        expect(menuItems[0].textContent).toBe('View All Users');
        expect(menuItems[1].textContent).toBe('View Inactive Users');
    });

    test('inactive users view', () => {
        const component = (
            <UsersGridPanelImpl {...DEFAULT_PROPS} searchParams={new URLSearchParams({ usersView: 'inactive' })} />
        );

        renderWithAppContext(component);
        expect(document.querySelectorAll('.grid-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.user-details-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.view-header')[0].textContent).toBe('Application Inactive Users');
        const buttons = document.querySelectorAll('.grid-panel__button-bar-left button');
        expect(buttons).toHaveLength(4);
        expect(buttons[0].textContent).toBe('Create');
        expect(buttons[1].textContent).toBe('Manage');
        expect(document.querySelectorAll('.dropdown-toggle')[0].textContent.trim()).toEqual('Manage');

        const menuItems = document.querySelectorAll('.lk-menu-item');
        expect(menuItems).toHaveLength(10);
        expect(menuItems[0].textContent).toBe('Delete Users');
        expect(menuItems[1].textContent).toBe('Reactivate Users');
        expect(menuItems[2].textContent).toBe('View Active Users');
        expect(menuItems[3].textContent).toBe('View All Users');
    });

    test('all users view', () => {
        const component = (
            <UsersGridPanelImpl {...DEFAULT_PROPS} searchParams={new URLSearchParams({ usersView: 'all' })} />
        );

        renderWithAppContext(component);
        expect(document.querySelectorAll('.grid-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.user-details-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.view-header')[0].textContent).toBe('Application All Users');
        const buttons = document.querySelectorAll('.grid-panel__button-bar-left button');
        expect(buttons).toHaveLength(4);
        expect(buttons[0].textContent).toBe('Create');
        expect(buttons[1].textContent).toBe('Manage');
        expect(document.querySelectorAll('.dropdown-toggle')[0].textContent.trim()).toEqual('Manage');

        const menuItems = document.querySelectorAll('.lk-menu-item');
        expect(menuItems).toHaveLength(9);
        expect(menuItems[0].textContent).toBe('Delete Users');
        expect(menuItems[1].textContent).toBe('View Active Users');
        expect(menuItems[2].textContent).toBe('View Inactive Users');
    });

    test('active user limit reached', () => {
        const component = (
            <UsersGridPanelImpl
                {...DEFAULT_PROPS}
                userLimitSettings={{ userLimit: true, remainingUsers: 0 }}
                searchParams={new URLSearchParams({ usersView: 'inactive' })}
            />
        );
        renderWithAppContext(component);
        const buttons = document.querySelectorAll('.grid-panel__button-bar-left button');
        expect(buttons).toHaveLength(4);
        expect(buttons[0].textContent).toBe('Create');
        expect(buttons[0].hasAttribute('disabled')).toBe(true);

        const menuItems = document.querySelectorAll('.lk-menu-item');
        expect(menuItems).toHaveLength(10);
        expect(menuItems[0].textContent).toBe('Delete Users');
        expect(menuItems[1].textContent).toBe('Reactivate Users');
        expect(menuItems[2].textContent).toBe('View Active Users');
        expect(menuItems[3].textContent).toBe('View All Users');
    });

    test('active user limit not reached', () => {
        const component = (
            <UsersGridPanelImpl
                {...DEFAULT_PROPS}
                userLimitSettings={{ userLimit: true, remainingUsers: 2 }}
                searchParams={new URLSearchParams({ usersView: 'inactive' })}
            />
        );
        renderWithAppContext(component);
        const buttons = document.querySelectorAll('.grid-panel__button-bar-left button');
        expect(buttons).toHaveLength(4);
        expect(buttons[0].textContent).toBe('Create');
        expect(buttons[0].hasAttribute('disabled')).toBe(false);

        const menuItems = document.querySelectorAll('.lk-menu-item');
        expect(menuItems).toHaveLength(10);
        expect(menuItems[0].textContent).toBe('Delete Users');
        expect(menuItems[1].textContent).toBe('Reactivate Users');
        expect(menuItems[2].textContent).toBe('View Active Users');
        expect(menuItems[3].textContent).toBe('View All Users');
    });

    test('active user limit disabled', () => {
        const component = (
            <UsersGridPanelImpl {...DEFAULT_PROPS} userLimitSettings={{ userLimit: false, remainingUsers: 0 }} />
        );
        renderWithAppContext(component);
        const buttons = document.querySelectorAll('.grid-panel__button-bar-left button');
        expect(buttons).toHaveLength(4);
        expect(buttons[0].textContent).toBe('Create');
        expect(buttons[0].hasAttribute('disabled')).toBe(false);
    });

    test('showDetailsPanel false', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} showDetailsPanel={false} />;
        renderWithAppContext(component);
        expect(document.querySelectorAll('.grid-panel')).toHaveLength(1);
        expect(document.querySelectorAll('.user-details-panel')).toHaveLength(0);
    });

    test('loading', () => {
        const component = <UsersGridPanelImpl {...DEFAULT_PROPS} queryModels={{}} />;
        renderWithAppContext(component);
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
        expect(document.querySelectorAll('.grid-panel')).toHaveLength(0);
        expect(document.querySelectorAll('.user-details-panel')).toHaveLength(1);
    });
});
