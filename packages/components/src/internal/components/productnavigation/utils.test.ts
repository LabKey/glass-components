import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR } from '../../userFixtures';
import { TEST_BIO_LIMS_STARTER_MODULE_CONTEXT, TEST_LKSM_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { shouldShowProductNavigation } from './utils';

describe('shouldShowProductNavigation', () => {
    test('LKB non-premium admin user', () => {
        let moduleContext = { ...TEST_BIO_LIMS_STARTER_MODULE_CONTEXT, api: { applicationMenuDisplayMode: 'ADMIN' } };
        expect(shouldShowProductNavigation(TEST_USER_APP_ADMIN, moduleContext)).toBeTruthy();

        moduleContext = { ...TEST_BIO_LIMS_STARTER_MODULE_CONTEXT, api: { applicationMenuDisplayMode: 'ALWAYS' } };
        expect(shouldShowProductNavigation(TEST_USER_APP_ADMIN, moduleContext)).toBeTruthy();
    });
    test('LKB non-premium non-admin user', () => {
        let moduleContext = { ...TEST_BIO_LIMS_STARTER_MODULE_CONTEXT, api: { applicationMenuDisplayMode: 'ADMIN' } };
        expect(shouldShowProductNavigation(TEST_USER_EDITOR, moduleContext)).toBeFalsy();

        moduleContext = { ...TEST_BIO_LIMS_STARTER_MODULE_CONTEXT, api: { applicationMenuDisplayMode: 'ALWAYS' } };
        expect(shouldShowProductNavigation(TEST_USER_EDITOR, moduleContext)).toBeTruthy();
    });

    test('LKB premium admin user', () => {
        let moduleContext = {
            ...TEST_BIO_LIMS_STARTER_MODULE_CONTEXT,
            api: { applicationMenuDisplayMode: 'ADMIN', moduleNames: ['premium'] },
        };
        expect(shouldShowProductNavigation(TEST_USER_APP_ADMIN, moduleContext)).toBeTruthy();

        moduleContext = {
            ...TEST_BIO_LIMS_STARTER_MODULE_CONTEXT,
            api: { applicationMenuDisplayMode: 'ALWAYS', moduleNames: ['premium'] },
        };
        expect(shouldShowProductNavigation(TEST_USER_APP_ADMIN, moduleContext)).toBeTruthy();
    });

    test('LKB premium non-admin user', () => {
        let moduleContext = {
            ...TEST_BIO_LIMS_STARTER_MODULE_CONTEXT,
            api: { applicationMenuDisplayMode: 'ADMIN', moduleNames: ['premium'] },
        };
        expect(shouldShowProductNavigation(TEST_USER_EDITOR, moduleContext)).toBeFalsy();

        moduleContext = {
            ...TEST_BIO_LIMS_STARTER_MODULE_CONTEXT,
            api: { applicationMenuDisplayMode: 'ALWAYS', moduleNames: ['premium'] },
        };
        expect(shouldShowProductNavigation(TEST_USER_EDITOR, moduleContext)).toBeTruthy();
    });

    test('LKSM non-premium admin user', () => {
        let moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT, api: { applicationMenuDisplayMode: 'ADMIN' } };
        expect(shouldShowProductNavigation(TEST_USER_APP_ADMIN, moduleContext)).toBeFalsy();

        moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT, api: { applicationMenuDisplayMode: 'ALWAYS' } };
        expect(shouldShowProductNavigation(TEST_USER_APP_ADMIN, moduleContext)).toBeFalsy();
    });

    test('LKSM non-premium non-admin user', () => {
        let moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT, api: { applicationMenuDisplayMode: 'ADMIN' } };
        expect(shouldShowProductNavigation(TEST_USER_EDITOR, moduleContext)).toBeFalsy();

        moduleContext = { ...TEST_LKSM_STARTER_MODULE_CONTEXT, api: { applicationMenuDisplayMode: 'ALWAYS' } };
        expect(shouldShowProductNavigation(TEST_USER_EDITOR, moduleContext)).toBeFalsy();
    });

    test('LKSM premium admin user', () => {
        let moduleContext = {
            ...TEST_LKSM_STARTER_MODULE_CONTEXT,
            api: { applicationMenuDisplayMode: 'ADMIN', moduleNames: ['premium'] },
        };
        expect(shouldShowProductNavigation(TEST_USER_APP_ADMIN, moduleContext)).toBeTruthy();

        moduleContext = {
            ...TEST_LKSM_STARTER_MODULE_CONTEXT,
            api: { applicationMenuDisplayMode: 'ALWAYS', moduleNames: ['premium'] },
        };
        expect(shouldShowProductNavigation(TEST_USER_APP_ADMIN, moduleContext)).toBeTruthy();
    });

    test('LKSM premium non-admin user', () => {
        let moduleContext = {
            ...TEST_LKSM_STARTER_MODULE_CONTEXT,
            api: { applicationMenuDisplayMode: 'ADMIN', moduleNames: ['premium'] },
        };
        expect(shouldShowProductNavigation(TEST_USER_EDITOR, moduleContext)).toBeFalsy();

        moduleContext = {
            ...TEST_LKSM_STARTER_MODULE_CONTEXT,
            api: { applicationMenuDisplayMode: 'ALWAYS', moduleNames: ['premium'] },
        };
        expect(shouldShowProductNavigation(TEST_USER_EDITOR, moduleContext)).toBeTruthy();
    });
});
