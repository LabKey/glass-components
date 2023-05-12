import React from 'react';

import { PermissionTypes } from '@labkey/api';

import { mountWithAppServerContext, waitForLifecycle } from '../../testHelpers';
import { ConfirmModal } from '../base/ConfirmModal';
import { TEST_FOLDER_CONTAINER, TEST_PROJECT_CONTAINER } from '../../../test/data/constants';
import { getTestAPIWrapper } from '../../APIWrapper';
import { getSecurityTestAPIWrapper } from '../security/APIWrapper';
import { Container } from '../base/models/Container';
import { SelectInput } from '../forms/input/SelectInput';

import { EntityMoveConfirmationModal, EntityMoveConfirmationModalProps } from './EntityMoveConfirmationModal';

describe('EntityMoveConfirmationModal', () => {
    function getDefaultProps(): EntityMoveConfirmationModalProps {
        return {
            nounPlural: 'samples',
            onConfirm: jest.fn(),
            currentContainer: TEST_FOLDER_CONTAINER,
        };
    }

    test('loading', () => {
        const wrapper = mountWithAppServerContext(<EntityMoveConfirmationModal {...getDefaultProps()} />);
        expect(wrapper.find(ConfirmModal)).toHaveLength(1);
        expect(wrapper.find(ConfirmModal).text()).toContain('Loading target projects...');
        wrapper.unmount();
    });

    test('error', async () => {
        const wrapper = mountWithAppServerContext(<EntityMoveConfirmationModal {...getDefaultProps()} />, {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchContainers: () => Promise.reject('This is an error message.'),
                }),
            }),
        });
        await waitForLifecycle(wrapper);
        expect(wrapper.find(ConfirmModal)).toHaveLength(1);
        expect(wrapper.find(ConfirmModal).text()).toContain('This is an error message.');
        wrapper.unmount();
    });

    test('no insert perm to any projects', async () => {
        const wrapper = mountWithAppServerContext(<EntityMoveConfirmationModal {...getDefaultProps()} />, {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchContainers: () =>
                        Promise.resolve([
                            {
                                ...TEST_PROJECT_CONTAINER,
                                effectivePermissions: [PermissionTypes.Read],
                            } as Container,
                            {
                                ...TEST_FOLDER_CONTAINER,
                                effectivePermissions: [PermissionTypes.Update, PermissionTypes.Insert],
                            } as Container,
                        ]),
                }),
            }),
        });
        await waitForLifecycle(wrapper);
        expect(wrapper.find(ConfirmModal)).toHaveLength(1);
        expect(wrapper.find(ConfirmModal).text()).toContain(
            'You do not have permission to move samples to any of the available projects.'
        );
        wrapper.unmount();
    });

    test('has perm to move to anothe project', async () => {
        const wrapper = mountWithAppServerContext(<EntityMoveConfirmationModal {...getDefaultProps()} />, {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchContainers: () =>
                        Promise.resolve([
                            {
                                ...TEST_PROJECT_CONTAINER,
                                effectivePermissions: [PermissionTypes.Insert],
                            } as Container,
                            {
                                ...TEST_FOLDER_CONTAINER,
                                effectivePermissions: [PermissionTypes.Update, PermissionTypes.Insert],
                            } as Container,
                        ]),
                }),
            }),
        });
        await waitForLifecycle(wrapper);
        expect(wrapper.find(ConfirmModal)).toHaveLength(1);
        expect(wrapper.find(SelectInput)).toHaveLength(1);
        expect(wrapper.find(SelectInput).prop('options').length).toBe(1);
        expect(wrapper.find(SelectInput).prop('options')[0].value).toBe(TEST_PROJECT_CONTAINER.path);
        expect(wrapper.find(SelectInput).prop('options')[0].label).toBe(TEST_PROJECT_CONTAINER.title);
        expect(wrapper.find('textarea')).toHaveLength(1);
        wrapper.unmount();
    });

    test('can move to home project', async () => {
        const wrapper = mountWithAppServerContext(<EntityMoveConfirmationModal {...getDefaultProps()} />, {
            api: getTestAPIWrapper(jest.fn, {
                security: getSecurityTestAPIWrapper(jest.fn, {
                    fetchContainers: () =>
                        Promise.resolve([
                            {
                                ...TEST_PROJECT_CONTAINER,
                                path: '/home',
                                title: 'home',
                                effectivePermissions: [PermissionTypes.Insert],
                            } as Container,
                            {
                                ...TEST_FOLDER_CONTAINER,
                                effectivePermissions: [PermissionTypes.Update, PermissionTypes.Insert],
                            } as Container,
                        ]),
                }),
            }),
        });
        await waitForLifecycle(wrapper);
        expect(wrapper.find(ConfirmModal)).toHaveLength(1);
        expect(wrapper.find(SelectInput)).toHaveLength(1);
        expect(wrapper.find(SelectInput).prop('options').length).toBe(1);
        expect(wrapper.find(SelectInput).prop('options')[0].value).toBe('/home');
        expect(wrapper.find(SelectInput).prop('options')[0].label).toBe('Home Project');
        expect(wrapper.find('textarea')).toHaveLength(1);
        wrapper.unmount();
    });
});
