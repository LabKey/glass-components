import React from 'react';

import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR } from '../../userFixtures';

import { TEST_LIMS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { FolderMenu, FolderMenuProps } from './FolderMenu';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

describe('FolderMenu', () => {
    function getDefaultProps(): FolderMenuProps {
        return {
            activeContainerId: undefined,
            items: [],
            onClick: jest.fn(),
        };
    }

    it('no folders', () => {
        const wrapper = renderWithAppContext(<FolderMenu {...getDefaultProps()} />, {
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT,
            }
        });

        expect(document.querySelectorAll('.col-folders')).toHaveLength(1);
        expect(document.querySelectorAll('ul')).toHaveLength(1);
        expect(document.querySelectorAll('li')).toHaveLength(0);
        expect(document.querySelectorAll('.menu-section-header')).toHaveLength(0);
        expect(document.querySelectorAll('.menu-section-item')).toHaveLength(0);
        expect(document.querySelectorAll('.active')).toHaveLength(0);
        expect(document.querySelectorAll('.menu-folder-item')).toHaveLength(0);
        expect(document.querySelectorAll('.menu-folder-icons')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-home')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(0);
        expect(document.querySelectorAll('hr')).toHaveLength(0);

        wrapper.unmount();
    });

    it('with folders, with top level', () => {
        const wrapper = renderWithAppContext(
            <FolderMenu
                {...getDefaultProps()}
                items={[
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: true,
                        label: TEST_PROJECT_CONTAINER.title,
                    },
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: false,
                        label: TEST_FOLDER_CONTAINER.title,
                    },
                ]}
            />,
            {
                serverContext: { user: TEST_USER_APP_ADMIN, moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT }
            }

        );

        expect(document.querySelectorAll('.col-folders')).toHaveLength(1);
        expect(document.querySelectorAll('ul')).toHaveLength(1);
        expect(document.querySelectorAll('li')).toHaveLength(3);
        expect(document.querySelectorAll('.menu-section-header')).toHaveLength(1);
        expect(document.querySelectorAll('.menu-section-item')).toHaveLength(1);
        expect(document.querySelectorAll('.active')).toHaveLength(0);
        expect(document.querySelectorAll('.menu-folder-item')).toHaveLength(2);
        expect(document.querySelectorAll('.menu-folder-item')[0].textContent).toBe(TEST_PROJECT_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-item')[1].textContent).toBe(TEST_FOLDER_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-icons')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-home')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(2);
        expect(document.querySelectorAll('hr')).toHaveLength(1);

        wrapper.unmount();
    });

    it('with folders, without top level', () => {
        const wrapper = renderWithAppContext(
            <FolderMenu
                {...getDefaultProps()}
                items={[
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: false,
                        label: TEST_FOLDER_CONTAINER.title,
                    },
                ]}
            />,
            {
                serverContext: { user: TEST_USER_APP_ADMIN, moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT }
            }

        );

        expect(document.querySelectorAll('.col-folders')).toHaveLength(1);
        expect(document.querySelectorAll('ul')).toHaveLength(1);
        expect(document.querySelectorAll('li')).toHaveLength(1);
        expect(document.querySelectorAll('.menu-section-header')).toHaveLength(0);
        expect(document.querySelectorAll('.menu-section-item')).toHaveLength(1);
        expect(document.querySelectorAll('.active')).toHaveLength(0);
        expect(document.querySelectorAll('.menu-folder-item')).toHaveLength(1);
        expect(document.querySelectorAll('.menu-folder-item')[0].textContent).toBe(TEST_FOLDER_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-icons')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-home')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(1);
        expect(document.querySelectorAll('hr')).toHaveLength(0);

        wrapper.unmount();
    });

    it('with folders, activeContainerId', () => {
        const wrapper = renderWithAppContext(
            <FolderMenu
                {...getDefaultProps()}
                activeContainerId={TEST_PROJECT_CONTAINER.id}
                items={[
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: true,
                        label: TEST_PROJECT_CONTAINER.title,
                    },
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: false,
                        label: TEST_FOLDER_CONTAINER.title,
                    },
                ]}
            />,
            {
                serverContext: { user: TEST_USER_APP_ADMIN, moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT }
            }
        );

        expect(document.querySelectorAll('.col-folders')).toHaveLength(1);
        expect(document.querySelectorAll('ul')).toHaveLength(1);
        expect(document.querySelectorAll('li')).toHaveLength(3);
        expect(document.querySelectorAll('.menu-section-header')).toHaveLength(1);
        expect(document.querySelectorAll('.menu-section-item')).toHaveLength(1);
        expect(document.querySelectorAll('.active')).toHaveLength(2);
        expect(document.querySelectorAll('.menu-folder-item')).toHaveLength(2);
        expect(document.querySelectorAll('.menu-folder-item')[0].textContent).toBe(TEST_PROJECT_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-item')[1].textContent).toBe(TEST_FOLDER_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-icons')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-home')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(2);
        expect(document.querySelectorAll('hr')).toHaveLength(1);

        wrapper.unmount();
    });

    it('with folders, non admin', () => {
        const wrapper = renderWithAppContext(
            <FolderMenu
                {...getDefaultProps()}
                items={[
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: true,
                        label: TEST_PROJECT_CONTAINER.title,
                    },
                    {
                        id: TEST_PROJECT_CONTAINER.id,
                        path: TEST_PROJECT_CONTAINER.path,
                        href: undefined,
                        isTopLevel: false,
                        label: TEST_FOLDER_CONTAINER.title,
                    },
                ]}
            />,
            {
                serverContext: { user: TEST_USER_EDITOR, moduleContext: TEST_LIMS_STARTER_MODULE_CONTEXT }
            }
        );

        expect(document.querySelectorAll('.col-folders')).toHaveLength(1);
        expect(document.querySelectorAll('ul')).toHaveLength(1);
        expect(document.querySelectorAll('li')).toHaveLength(3);
        expect(document.querySelectorAll('.menu-section-header')).toHaveLength(1);
        expect(document.querySelectorAll('.menu-section-item')).toHaveLength(1);
        expect(document.querySelectorAll('.active')).toHaveLength(0);
        expect(document.querySelectorAll('.menu-folder-item')).toHaveLength(2);
        expect(document.querySelectorAll('.menu-folder-item')[0].textContent).toBe(TEST_PROJECT_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-item')[1].textContent).toBe(TEST_FOLDER_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-icons')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-home')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(0);
        expect(document.querySelectorAll('hr')).toHaveLength(1);

        wrapper.unmount();
    });
});
