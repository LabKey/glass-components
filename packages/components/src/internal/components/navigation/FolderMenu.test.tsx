import React from 'react';
import { userEvent } from '@testing-library/user-event';

import { TEST_ARCHIVED_FOLDER_CONTAINER, TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../containerFixtures';

import { TEST_USER_APP_ADMIN, TEST_USER_EDITOR } from '../../userFixtures';

import { TEST_BIO_LIMS_STARTER_MODULE_CONTEXT } from '../../productFixtures';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { FolderMenu, FolderMenuProps } from './FolderMenu';

describe('FolderMenu', () => {
    function getDefaultProps(): FolderMenuProps {
        return {
            activeContainerId: undefined,
            items: [],
            onClick: jest.fn(),
        };
    }

    const topFolderMenu = {
        id: TEST_PROJECT_CONTAINER.id,
        path: TEST_PROJECT_CONTAINER.path,
        href: undefined,
        isTopLevel: true,
        label: TEST_PROJECT_CONTAINER.title,
        archived: false,
    };
    const childFolderMenu = {
        id: TEST_FOLDER_CONTAINER.id,
        path: TEST_FOLDER_CONTAINER.path,
        href: undefined,
        isTopLevel: false,
        label: TEST_FOLDER_CONTAINER.title,
        archived: false,
    };
    const archivedChildFolderMenu = {
        id: TEST_ARCHIVED_FOLDER_CONTAINER.id,
        path: TEST_ARCHIVED_FOLDER_CONTAINER.path,
        href: undefined,
        isTopLevel: false,
        label: TEST_ARCHIVED_FOLDER_CONTAINER.title,
        archived: true,
    };

    it('no folders', () => {
        renderWithAppContext(<FolderMenu {...getDefaultProps()} />, {
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                moduleContext: TEST_BIO_LIMS_STARTER_MODULE_CONTEXT,
            },
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
        expect(document.querySelectorAll('.archived-product-menu')).toHaveLength(0);
    });

    it('with folders, with top level', () => {
        renderWithAppContext(<FolderMenu {...getDefaultProps()} items={[topFolderMenu, childFolderMenu]} />, {
            serverContext: { user: TEST_USER_APP_ADMIN, moduleContext: TEST_BIO_LIMS_STARTER_MODULE_CONTEXT },
        });

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
        expect(document.querySelectorAll('.archived-product-menu')).toHaveLength(0);
    });

    it('with archived folders', async () => {
        renderWithAppContext(
            <FolderMenu
                {...getDefaultProps()}
                items={[topFolderMenu, archivedChildFolderMenu, childFolderMenu]}
                activeContainerId={TEST_ARCHIVED_FOLDER_CONTAINER.id}
            />,
            {
                serverContext: { user: TEST_USER_APP_ADMIN, moduleContext: TEST_BIO_LIMS_STARTER_MODULE_CONTEXT },
            }
        );

        expect(document.querySelectorAll('.col-folders')).toHaveLength(1);
        expect(document.querySelectorAll('ul')).toHaveLength(1);
        expect(document.querySelectorAll('li')).toHaveLength(3);
        expect(document.querySelectorAll('.active')).toHaveLength(0);
        expect(document.querySelectorAll('.menu-section-header')).toHaveLength(1);
        expect(document.querySelectorAll('.menu-section-item')).toHaveLength(1);
        expect(document.querySelectorAll('.menu-folder-item')).toHaveLength(2);
        expect(document.querySelectorAll('.menu-folder-item')[0].textContent).toBe(TEST_PROJECT_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-item')[1].textContent).toBe(TEST_FOLDER_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-icons')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-home')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(2);
        expect(document.querySelectorAll('hr')).toHaveLength(1);

        expect(document.querySelectorAll('.archived-product-menu')).toHaveLength(1);
        // expand archived
        await userEvent.click(document.querySelector('.container-expandable__inactive'));
        expect(document.querySelectorAll('ul')).toHaveLength(1);
        expect(document.querySelectorAll('li')).toHaveLength(4);
        expect(document.querySelectorAll('.menu-folder-item')[2].textContent).toBe(
            TEST_ARCHIVED_FOLDER_CONTAINER.title
        );
        expect(document.querySelectorAll('.menu-folder-icons')).toHaveLength(3);
        expect(document.querySelectorAll('.fa-home')).toHaveLength(3);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(3);
        expect(document.querySelectorAll('.active')).toHaveLength(1);
        expect(document.querySelectorAll('.archived-product-menu')).toHaveLength(1);
        // collapse archived
        await userEvent.click(document.querySelector('.container-expandable-child__inactive'));
        expect(document.querySelectorAll('li')).toHaveLength(3);
        expect(document.querySelectorAll('.menu-folder-icons')).toHaveLength(2);
    });

    it('with folders, without top level', () => {
        renderWithAppContext(<FolderMenu {...getDefaultProps()} items={[childFolderMenu]} />, {
            serverContext: { user: TEST_USER_APP_ADMIN, moduleContext: TEST_BIO_LIMS_STARTER_MODULE_CONTEXT },
        });

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
    });

    it('with folders, activeContainerId', () => {
        renderWithAppContext(
            <FolderMenu
                {...getDefaultProps()}
                activeContainerId={TEST_PROJECT_CONTAINER.id}
                items={[topFolderMenu, childFolderMenu]}
            />,
            {
                serverContext: { user: TEST_USER_APP_ADMIN, moduleContext: TEST_BIO_LIMS_STARTER_MODULE_CONTEXT },
            }
        );

        expect(document.querySelectorAll('.col-folders')).toHaveLength(1);
        expect(document.querySelectorAll('ul')).toHaveLength(1);
        expect(document.querySelectorAll('li')).toHaveLength(3);
        expect(document.querySelectorAll('.menu-section-header')).toHaveLength(1);
        expect(document.querySelectorAll('.menu-section-item')).toHaveLength(1);
        expect(document.querySelectorAll('.active')).toHaveLength(1);
        expect(document.querySelectorAll('.menu-folder-item')).toHaveLength(2);
        expect(document.querySelectorAll('.menu-folder-item')[0].textContent).toBe(TEST_PROJECT_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-item')[1].textContent).toBe(TEST_FOLDER_CONTAINER.title);
        expect(document.querySelectorAll('.menu-folder-icons')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-home')).toHaveLength(2);
        expect(document.querySelectorAll('.fa-gear')).toHaveLength(2);
        expect(document.querySelectorAll('hr')).toHaveLength(1);
    });

    it('with folders, non admin', () => {
        renderWithAppContext(<FolderMenu {...getDefaultProps()} items={[topFolderMenu, childFolderMenu]} />, {
            serverContext: { user: TEST_USER_EDITOR, moduleContext: TEST_BIO_LIMS_STARTER_MODULE_CONTEXT },
        });

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
    });
});
