import React from 'react';

import { waitFor } from '@testing-library/dom';

import { UserLimitSettings } from '../permissions/actions';
import { TEST_USER_APP_ADMIN, TEST_USER_FOLDER_ADMIN, TEST_USER_PROJECT_ADMIN } from '../../userFixtures';
import { getTestAPIWrapper } from '../../APIWrapper';

import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

import { TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { ActiveUserLimit, ActiveUserLimitMessage } from './ActiveUserLimit';

describe('ActiveUserLimitMessage', () => {
    test('without message', () => {
        renderWithAppContext(<ActiveUserLimitMessage />, {
            appContext: { api: getTestAPIWrapper(jest.fn) },
            serverContext: { user: TEST_USER_APP_ADMIN },
        });
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
    });

    test('with message', () => {
        renderWithAppContext(<ActiveUserLimitMessage settings={{ messageHtml: 'test' }} />, {
            appContext: { api: getTestAPIWrapper(jest.fn) },
            serverContext: { user: TEST_USER_APP_ADMIN },
        });
        expect(document.querySelectorAll('.alert')).toHaveLength(1);
        expect(document.querySelector('.alert').textContent).toBe('test');
    });

    test('with html message', () => {
        renderWithAppContext(<ActiveUserLimitMessage settings={{ messageHtml: '<b>test</b>' }} />, {
            appContext: { api: getTestAPIWrapper(jest.fn) },
            serverContext: { user: TEST_USER_APP_ADMIN },
        });
        expect(document.querySelectorAll('.alert')).toHaveLength(1);
        expect(document.querySelector('.alert').textContent).toBe('test');
    });
});

describe('ActiveUserLimit', () => {
    const USER_LIMIT_ENABLED: Partial<UserLimitSettings> = {
        userLimit: true,
        userLimitLevel: 10,
        remainingUsers: 1,
    };
    const USER_LIMIT_DISABLED: Partial<UserLimitSettings> = {
        userLimit: false,
        userLimitLevel: 10,
        remainingUsers: 1,
    };
    const DEFAULT_PROPS = {
        user: TEST_USER_PROJECT_ADMIN,
        container: TEST_PROJECT_CONTAINER,
    };

    function validate(rendered = true, hasError = false): void {
        const count = rendered ? 1 : 0;
        expect(document.querySelectorAll('.active-user-limit-panel')).toHaveLength(count);
        expect(document.querySelectorAll('.alert')).toHaveLength(hasError ? count : 0);
        expect(document.querySelectorAll('.active-user-limit-message')).toHaveLength(!hasError ? count : 0);
    }

    test('with user limit', async () => {
        renderWithAppContext(<ActiveUserLimit {...DEFAULT_PROPS} />, {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockResolvedValue(USER_LIMIT_ENABLED),
                    }),
                }),
            },
        });

        await waitFor(() => validate());
        expect(document.querySelector('.active-user-limit-message').textContent).toBe(
            'Active user limit is 10. You can add or reactivate 1 more user.'
        );
    });

    test('error', async () => {
        renderWithAppContext(<ActiveUserLimit {...DEFAULT_PROPS} />, {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockRejectedValue('test'),
                    }),
                }),
            },
        });

        await waitFor(() => validate(true, true));
        expect(document.querySelector('.alert').textContent).toBe('Error: test');
    });

    test('without add user perm', async () => {
        renderWithAppContext(<ActiveUserLimit {...DEFAULT_PROPS} user={TEST_USER_FOLDER_ADMIN} />, {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockResolvedValue(USER_LIMIT_ENABLED),
                    }),
                }),
            },
        });

        await waitFor(() => validate(false));
    });

    test('with user limit disabled', async () => {
        renderWithAppContext(<ActiveUserLimit {...DEFAULT_PROPS} />, {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockResolvedValue(USER_LIMIT_DISABLED),
                    }),
                }),
            },
        });

        await waitFor(() => validate(false));
    });

    test('without user limit settings', async () => {
        renderWithAppContext(<ActiveUserLimit {...DEFAULT_PROPS} />, {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        getUserLimitSettings: jest.fn().mockResolvedValue(undefined),
                    }),
                }),
            },
        });

        await waitFor(() => validate(false));
    });
});
