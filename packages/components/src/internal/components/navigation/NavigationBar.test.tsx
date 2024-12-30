import React from 'react';

import { waitFor } from '@testing-library/dom';

import { TEST_USER_APP_ADMIN, TEST_USER_GUEST, TEST_USER_READER } from '../../userFixtures';

import { markAllNotificationsRead } from '../../../test/data/notificationData';
import { ServerNotificationModel } from '../notifications/model';

import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { getSecurityTestAPIWrapper, SecurityAPIWrapper } from '../security/APIWrapper';
import { AppContext } from '../../AppContext';
import { getTestAPIWrapper } from '../../APIWrapper';
import { ServerContext } from '../base/ServerContext';

import { TEST_LKS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { NavigationBar } from './NavigationBar';
import { getNavigationTestAPIWrapper } from './NavigationAPIWrapper';
import { MenuSectionModel } from './model';

describe('NavigationBar', () => {
    function getDefaultAppContext(overrides?: Partial<SecurityAPIWrapper>): Partial<AppContext> {
        return {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchContainers: jest.fn().mockResolvedValue([TEST_PROJECT_CONTAINER, TEST_FOLDER_CONTAINER]),
                    ...overrides,
                }),
                navigation: getNavigationTestAPIWrapper(jest.fn, {
                    loadUserMenu: jest.fn().mockResolvedValue(new MenuSectionModel()),
                }),
            }),
        };
    }

    function getDefaultServerContext(): Partial<ServerContext> {
        return {
            container: TEST_PROJECT_CONTAINER,
            moduleContext: { ...TEST_LKS_STARTER_MODULE_CONTEXT },
        };
    }

    function validate(compCounts: Record<string, number> = {}): void {
        expect(document.querySelectorAll('.project-name')).toHaveLength(compCounts.ProjectName ?? 0);
        expect(document.querySelectorAll('.product-menu')).toHaveLength(compCounts.ProductMenu ?? 1);
        expect(document.querySelectorAll('.user-dropdown')).toHaveLength(compCounts.UserMenu ?? 0);
        expect(document.querySelectorAll('.navbar__search-form')).toHaveLength(1);
        expect(document.querySelectorAll('.navbar__xs-search-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.server-notifications')).toHaveLength(compCounts.ServerNotifications ?? 0);
        expect(document.querySelectorAll('.product-navigation-menu')).toHaveLength(compCounts.ProductNavigation ?? 0);
        expect(document.querySelectorAll('.navbar__find-and-search-button')).toHaveLength(
            compCounts.FindAndSearchDropdown ?? 0
        );
    }

    const notificationsConfig = {
        maxRows: 1,
        markAllNotificationsRead,
        serverActivity: new ServerNotificationModel(),
        onViewAll: jest.fn(),
    };

    test('default props', async () => {
        renderWithAppContext(<NavigationBar />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });

        validate();
    });

    test('with findByIds', async () => {
        renderWithAppContext(<NavigationBar onFindByIds={jest.fn()} />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ FindAndSearchDropdown: 2, SearchBox: 1 });
    });

    test('with notifications no user', async () => {
        renderWithAppContext(<NavigationBar notificationsConfig={notificationsConfig} />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ ServerNotifications: 0 });
    });

    test('with notifications, guest user', async () => {
        renderWithAppContext(<NavigationBar user={TEST_USER_GUEST} notificationsConfig={notificationsConfig} />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ServerNotifications: 0 });
    });

    test('with notifications, non-guest user', async () => {
        renderWithAppContext(<NavigationBar user={TEST_USER_READER} notificationsConfig={notificationsConfig} />, {
            appContext: getDefaultAppContext(),
            serverContext: getDefaultServerContext(),
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ServerNotifications: 1 });
    });

    test('show ProductNavigation for hasPremiumModule, non-admin', async () => {
        renderWithAppContext(<NavigationBar user={TEST_USER_READER} />, {
            appContext: getDefaultAppContext(),
            serverContext: {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: {
                        moduleNames: ['samplemanagement', 'premium'],
                        applicationMenuDisplayMode: 'ALWAYS',
                    },
                },
            },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ProductNavigation: 1 });
    });

    test('hide ProductNavigation for non-admin', async () => {
        renderWithAppContext(<NavigationBar user={TEST_USER_READER} />, {
            appContext: getDefaultAppContext(),
            serverContext: {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: {
                        moduleNames: ['samplemanagement', 'premium'],
                        applicationMenuDisplayMode: 'ADMIN',
                    },
                },
            },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ProductNavigation: 0 });
    });

    test('show ProductNavigation for hasPremiumModule, admin always', async () => {
        renderWithAppContext(<NavigationBar showNavMenu showFolderMenu={false} user={TEST_USER_APP_ADMIN} />, {
            appContext: getDefaultAppContext(),
            serverContext: {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: {
                        moduleNames: ['samplemanagement', 'premium'],
                        applicationMenuDisplayMode: 'ALWAYS',
                    },
                },
            },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ProductNavigation: 1 });
        expect(document.querySelectorAll('.col-folders')).toHaveLength(0);
    });

    test('show ProductNavigation for hasPremiumModule, admin only', async () => {
        renderWithAppContext(<NavigationBar showNavMenu showFolderMenu user={TEST_USER_APP_ADMIN} />, {
            appContext: getDefaultAppContext(),
            serverContext: {
                container: TEST_PROJECT_CONTAINER,
                moduleContext: {
                    ...TEST_LKS_STARTER_MODULE_CONTEXT,
                    api: {
                        moduleNames: ['samplemanagement', 'premium'],
                        applicationMenuDisplayMode: 'ADMIN',
                    },
                },
            },
        });
        await waitFor(() => {
            expect(document.querySelectorAll('.app-navigation')).toHaveLength(1);
        });
        validate({ UserMenu: 1, ProductNavigation: 1 });
        expect(document.querySelectorAll('.col-folders')).toHaveLength(0);
    });
});
