import React, { ReactElement } from 'react';

import { waitFor } from '@testing-library/dom';

import { getTestAPIWrapper } from '../../APIWrapper';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER, TEST_PROJECT_CONTAINER_ADMIN } from '../../containerFixtures';
import { AppURL } from '../../url/AppURL';

import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';
import { useSubNavTabsContext } from '../navigation/hooks';
import { getSecurityTestAPIWrapper } from '../security/APIWrapper';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { useAdministrationSubNav } from './useAdministrationSubNav';

describe('useAdministrationSubNav', () => {
    const getAppContextWithProjectAdmin = () => ({
        api: getTestAPIWrapper(jest.fn, {
            security: getSecurityTestAPIWrapper(jest.fn, {
                fetchContainers: () => Promise.resolve([TEST_PROJECT_CONTAINER_ADMIN]),
            }),
        }),
    });
    let tabsContext;
    const TestComponent = (): ReactElement => {
        useAdministrationSubNav();
        tabsContext = useSubNavTabsContext();
        return <div>I am a test component</div>;
    };

    test('reader, home admin', async () => {
        renderWithAppContext(<TestComponent />, {
            appContext: getAppContextWithProjectAdmin(),
            serverContext: {
                user: TEST_USER_READER,
                container: TEST_FOLDER_CONTAINER,
            },
        });

        await waitFor(() => {
            expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
            expect(tabsContext.tabs).toEqual([]);
        });
    });

    test('editor, home admin', async () => {
        renderWithAppContext(<TestComponent />, {
            appContext: getAppContextWithProjectAdmin(),
            serverContext: {
                user: TEST_USER_EDITOR,
                container: TEST_FOLDER_CONTAINER,
            },
        });

        await waitFor(() => {
            expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
            expect(tabsContext.tabs).toEqual([]);
        });
    });

    test('app admin, home admin', async () => {
        renderWithAppContext(<TestComponent />, {
            appContext: getAppContextWithProjectAdmin(),
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                container: TEST_FOLDER_CONTAINER,
            },
        });

        await waitFor(() => {
            expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
        });
        expect(tabsContext.tabs.length).toEqual(5);
        expect(tabsContext.tabs[0].text).toEqual('Application Settings');
        expect(tabsContext.tabs[1].text).toEqual('Audit Logs');
        expect(tabsContext.tabs[2].text).toEqual('Users');
        expect(tabsContext.tabs[3].text).toEqual('Groups');
        expect(tabsContext.tabs[4].text).toEqual('Permissions');
    });

    test('folder admin, but not app home admin', async () => {
        renderWithAppContext(<TestComponent />, {
            appContext: {
                api: getTestAPIWrapper(jest.fn, {
                    security: getSecurityTestAPIWrapper(jest.fn, {
                        fetchContainers: () => Promise.resolve([TEST_PROJECT_CONTAINER]),
                    }),
                }),
            },
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                container: TEST_FOLDER_CONTAINER,
            },
        });

        await waitFor(() => {
            expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
        });
        expect(tabsContext.tabs.length).toEqual(2);
        // Applications settings should not be visible
        expect(tabsContext.tabs[0].text).toEqual('Audit Logs');
        expect(tabsContext.tabs[1].text).toEqual('Permissions');
    });

    test('app admin in subfolder', async () => {
        renderWithAppContext(<TestComponent />, {
            appContext: getAppContextWithProjectAdmin(),
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                container: TEST_FOLDER_CONTAINER,
                moduleContext: { query: { isProductFoldersEnabled: true } },
            },
        });

        await waitFor(() => {
            expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
        });
        expect(tabsContext.tabs.length).toEqual(6);
        expect(tabsContext.tabs[0].text).toEqual('Application Settings');
        expect(tabsContext.tabs[1].text).toEqual('Folders');
        expect(tabsContext.tabs[2].text).toEqual('Audit Logs');
        expect(tabsContext.tabs[3].text).toEqual('Users');
        expect(tabsContext.tabs[4].text).toEqual('Groups');
        expect(tabsContext.tabs[5].text).toEqual('Permissions');
    });

    test('app admin in project folder', async () => {
        renderWithAppContext(<TestComponent />, {
            appContext: getAppContextWithProjectAdmin(),
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                container: TEST_PROJECT_CONTAINER_ADMIN,
                moduleContext: { query: { isProductFoldersEnabled: true } },
            },
        });

        await waitFor(() => {
            expect(tabsContext.noun).toEqual({ text: 'Dashboard', url: AppURL.create('home') });
        });
        expect(tabsContext.tabs.length).toEqual(6);
        expect(tabsContext.tabs[0].text).toEqual('Application Settings');
        expect(tabsContext.tabs[1].text).toEqual('Folders');
        expect(tabsContext.tabs[2].text).toEqual('Audit Logs');
        expect(tabsContext.tabs[3].text).toEqual('Users');
        expect(tabsContext.tabs[4].text).toEqual('Groups');
        expect(tabsContext.tabs[5].text).toEqual('Permissions');
    });
});
