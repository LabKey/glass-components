/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { fromJS } from 'immutable';

import {
    TEST_USER_APP_ADMIN,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_GUEST,
    TEST_USER_READER,
} from '../../../test/data/users';

import { getUserLastLogin, getUserPermissionsDisplay, getUserRoleDisplay } from './actions';

describe('User actions', () => {
    test('getUserPermissionsDisplay guest', () => {
        const displayStrs = getUserPermissionsDisplay(TEST_USER_GUEST);
        expect(displayStrs.join(', ')).toBe('Reader');
    });

    test('getUserPermissionsDisplay reader', () => {
        const displayStrs = getUserPermissionsDisplay(TEST_USER_READER);
        expect(displayStrs.join(', ')).toBe('Reader');
    });

    test('getUserPermissionsDisplay author', () => {
        const displayStrs = getUserPermissionsDisplay(TEST_USER_AUTHOR);
        expect(displayStrs.join(', ')).toBe('Author');
    });

    test('getUserPermissionsDisplay editor', () => {
        const displayStrs = getUserPermissionsDisplay(TEST_USER_EDITOR);
        expect(displayStrs.join(', ')).toBe('Editor');
    });

    test('getUserPermissionsDisplay assaydesigner', () => {
        const displayStrs = getUserPermissionsDisplay(TEST_USER_ASSAY_DESIGNER);
        expect(displayStrs.join(', ')).toBe('Assay Designer, Reader');
    });

    test('getUserPermissionsDisplay folder admin', () => {
        const displayStrs = getUserPermissionsDisplay(TEST_USER_FOLDER_ADMIN);
        expect(displayStrs.join(', ')).toBe('Administrator');
    });

    test('getUserPermissionsDisplay app admin', () => {
        const displayStrs = getUserPermissionsDisplay(TEST_USER_FOLDER_ADMIN);
        expect(displayStrs.join(', ')).toBe('Administrator');
    });

    test('getUserLastLogin', () => {
        const lastLogin = '2019-11-15 13:50:17.987';
        expect(getUserLastLogin(fromJS({ lastlogin: lastLogin }), undefined).indexOf('2019-11-15T')).toBe(0);
        expect(getUserLastLogin(fromJS({ lastlogin: lastLogin }), 'YYYY-MM-DD')).toBe('2019-11-15');
        expect(getUserLastLogin(fromJS({ lastLogin }), 'YYYY-MM-DD')).toBe('2019-11-15');
        expect(getUserLastLogin(fromJS({ LastLogin: lastLogin }), 'YYYY-MM-DD')).toBe('2019-11-15');
    });

    test('getUserRoleDisplay', () => {
        expect(getUserRoleDisplay(TEST_USER_GUEST)).toBe('Reader');
        expect(getUserRoleDisplay(TEST_USER_READER)).toBe('Reader');
        expect(getUserRoleDisplay(TEST_USER_AUTHOR)).toBe('Reader');
        expect(getUserRoleDisplay(TEST_USER_EDITOR)).toBe('Editor');
        expect(getUserRoleDisplay(TEST_USER_ASSAY_DESIGNER)).toBe('Reader');
        expect(getUserRoleDisplay(TEST_USER_FOLDER_ADMIN)).toBe('Administrator');
        expect(getUserRoleDisplay(TEST_USER_APP_ADMIN)).toBe('Administrator');
    });
});
