import React from 'react';

import { render } from '@testing-library/react';

import { UserActivateChangeConfirmModal } from './UserActivateChangeConfirmModal';

describe('UserActivateChangeConfirmModal', () => {
    test('reactivate single user selected', () => {
        const component = (
            <UserActivateChangeConfirmModal
                userIds={[1]}
                reactivate={true}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        render(component);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelector('.modal-title').textContent).toBe('Reactivate 1 User?');
        expect(document.querySelector('.modal-body').textContent).toContain('Reactivated users');
        expect(document.querySelector('.modal-body').textContent).toContain('1 user will be updated.');
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-danger')).toHaveLength(0);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(1);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBe(false);
    });

    test('reactivate multiple users selected', () => {
        const component = (
            <UserActivateChangeConfirmModal
                userIds={[1, 2, 3]}
                reactivate={true}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        render(component);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelector('.modal-title').textContent).toBe('Reactivate 3 Users?');
        expect(document.querySelector('.modal-body').textContent).toContain('Reactivated users');
        expect(document.querySelector('.modal-body').textContent).toContain('3 users will be updated.');
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-danger')).toHaveLength(0);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(1);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBe(false);
    });

    test('deactivate single user selected', () => {
        const component = (
            <UserActivateChangeConfirmModal
                userIds={[1]}
                reactivate={false}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        render(component);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelector('.modal-title').textContent).toBe('Deactivate 1 User?');
        expect(document.querySelector('.modal-body').textContent).toContain('Deactivated users');
        expect(document.querySelector('.modal-body').textContent).toContain('1 user will be updated.');
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(0);
        expect(document.querySelectorAll('.btn-danger')).toHaveLength(1);
        expect(document.querySelector('.btn-danger').hasAttribute('disabled')).toBe(false);
    });

    test('deactivate multiple users selected', () => {
        const component = (
            <UserActivateChangeConfirmModal
                userIds={[1, 2, 3]}
                reactivate={false}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        render(component);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelector('.modal-title').textContent).toBe('Deactivate 3 Users?');
        expect(document.querySelector('.modal-body').textContent).toContain('Deactivated users');
        expect(document.querySelector('.modal-body').textContent).toContain('3 users will be updated.');
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(0);
        expect(document.querySelectorAll('.btn-danger')).toHaveLength(1);
        expect(document.querySelector('.btn-danger').hasAttribute('disabled')).toBe(false);
    });
});
