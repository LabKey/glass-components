import React from 'react';

import { render } from '@testing-library/react';

import { userEvent } from '@testing-library/user-event';

import { ViewInfo } from '../../internal/ViewInfo';

import {
    TEST_USER_APP_ADMIN,
    TEST_USER_EDITOR,
    TEST_USER_PROJECT_ADMIN,
    TEST_USER_READER,
} from '../../internal/userFixtures';

import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';

import { SaveViewModal, ViewNameInput } from './SaveViewModal';

describe('SaveViewModal', () => {
    const DEFAULT_PROPS = {
        gridLabel: 'Blood Samples',
        onCancel: jest.fn(),
        onConfirmSave: jest.fn(),
    };

    const DEFAULT_VIEW = ViewInfo.fromJson({
        default: true,
        inherit: true,
    });

    const VIEW_1 = ViewInfo.fromJson({
        label: 'View 1',
        name: 'View1',
        inherit: false,
    });

    const VIEW_2 = ViewInfo.fromJson({
        label: 'View 2',
        name: 'View2',
        inherit: true,
    });

    const moduleContext = {
        query: {
            isProductFoldersEnabled: true,
        },
    };

    test('current view is default', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={DEFAULT_VIEW} />, {
            serverContext: {
                user: TEST_USER_APP_ADMIN,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Save Grid View');
        expect(document.querySelector('.modal-body').textContent).toContain(
            'Columns, sort order, and filters will be saved. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(document.querySelectorAll('input[name="gridViewName"]')).toHaveLength(0);
        expect(document.querySelector('input[id="defaultView"]').hasAttribute('checked')).toBeTruthy();
        expect(document.querySelector('input[id="customView"]').hasAttribute('checked')).toBeFalsy();
        expect(document.querySelector('input[name="setInherit"]').hasAttribute('checked')).toBe(true);
        expect(document.querySelectorAll('input[name="setShared"]')).toHaveLength(0);
    });

    test('current view is a customized view', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_1} />, {
            serverContext: {
                user: TEST_USER_PROJECT_ADMIN,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Save Grid View');
        expect(document.querySelector('.modal-body').textContent).toContain(
            'Columns, sort order, and filters will be saved. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(document.querySelector('input[name="gridViewName"]').getAttribute('value')).toBe('View1');
        expect(document.querySelector('input[id="defaultView"]').hasAttribute('checked')).toBeFalsy();
        expect(document.querySelector('input[id="customView"]').hasAttribute('checked')).toBeTruthy();
        expect(document.querySelector('input[name="setInherit"]').hasAttribute('checked')).toBe(false);
        expect(document.querySelector('input[name="setShared"]').hasAttribute('checked')).toBe(false);
    });

    test('customized view in subfolder', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_1} />, {
            serverContext: {
                user: TEST_USER_PROJECT_ADMIN,
                container: {
                    path: '/home/folderA',
                    type: 'folder',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Save Grid View');
        expect(document.querySelector('.modal-body').textContent).toContain(
            'Columns, sort order, and filters will be saved. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(document.querySelector('input[name="gridViewName"]').getAttribute('value')).toBe('View1');
        expect(document.querySelector('input[id="defaultView"]').hasAttribute('checked')).toBeFalsy();
        expect(document.querySelector('input[id="customView"]').hasAttribute('checked')).toBeTruthy();
        expect(document.querySelectorAll('input[name="setInherit"]')).toHaveLength(0);
        expect(document.querySelector('input[name="setShared"]').hasAttribute('checked')).toBe(false);
    });

    test('no admin perm, but shared view perm', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_2} />, {
            serverContext: {
                user: TEST_USER_EDITOR,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Save Grid View');
        expect(document.querySelector('.modal-body').textContent).toContain(
            'Columns, sort order, and filters will be saved. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(document.querySelector('input[name="gridViewName"]').getAttribute('value')).toBe('View2');
        expect(document.querySelectorAll('input[name="setDefaultView"]').length).toEqual(0);
        expect(document.querySelector('input[name="setInherit"]').hasAttribute('checked')).toBe(true);
        expect(document.querySelector('input[name="setShared"]').hasAttribute('checked')).toBe(false);
    });

    test('no shared view perm', () => {
        renderWithAppContext(<SaveViewModal {...DEFAULT_PROPS} currentView={VIEW_2} />, {
            serverContext: {
                user: TEST_USER_READER,
                container: {
                    path: '/home',
                    type: 'project',
                },
                moduleContext,
            },
        });

        expect(document.querySelector('.modal-title').textContent).toBe('Save Grid View');
        expect(document.querySelector('.modal-body').textContent).toContain(
            'Columns, sort order, and filters will be saved. Once saved, this view will be available for all Blood Samples grids throughout the application.'
        );
        expect(document.querySelector('input[name="gridViewName"]').getAttribute('value')).toBe('View2');
        expect(document.querySelectorAll('input[name="setDefaultView"]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name="setInherit"]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name="setShared"]')).toHaveLength(0);
    });
});

describe('ViewNameInput', () => {
    test('default view', () => {
        render(<ViewNameInput view={ViewInfo.fromJson({ default: true, name: 'default' })} onBlur={jest.fn()} />);
        const input = document.querySelector('input');
        expect(input.getAttribute('value')).toBe('');
        const warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(0);
    });

    test('hidden view', () => {
        render(
            <ViewNameInput
                view={ViewInfo.fromJson({ default: false, name: 'Sample Finder', hidden: true })}
                onBlur={jest.fn()}
            />
        );
        const input = document.querySelector('input');
        expect(input.getAttribute('value')).toBe('');
        const warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(0);
    });

    test('valid named view', async () => {
        render(<ViewNameInput view={ViewInfo.fromJson({ default: false, name: 'Save Me' })} onBlur={jest.fn()} />);
        const input = document.querySelector('input');
        expect(input.getAttribute('value')).toBe('Save Me');
        let warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(0);
        await userEvent.type(input, 'Save Me 2');
        warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(0);
    });

    test('invalid named view', async () => {
        render(
            <ViewNameInput
                view={ViewInfo.fromJson({ default: false, name: 'Save Me' })}
                onBlur={jest.fn()}
                maxLength={10}
            />
        );
        let warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(0);
        const input = document.querySelector('input');
        await userEvent.type(input, '12345 78901');
        warning = document.querySelectorAll('.text-danger');
        expect(warning).toHaveLength(1);
        expect(warning[0].textContent).toBe('Current length: 18; maximum length: 10');
    });
});
