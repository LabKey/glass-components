import React from 'react';

import { render } from '@testing-library/react';

import { UserDeleteConfirmModal } from './UserDeleteConfirmModal';

describe('UserDeleteConfirmModal', () => {
    test('single user selected', () => {
        const component = <UserDeleteConfirmModal userIds={[1]} onCancel={jest.fn()} onComplete={jest.fn()} />;

        render(component);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelector('.modal-title').textContent).toBe('Delete 1 User?');
        expect(document.querySelector('.modal-body').textContent).toContain('Deletion of a user is');
        expect(document.querySelector('.modal-body').textContent).toContain('1 user will be deleted.');
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-danger')).toHaveLength(1);
        expect(document.querySelector('.btn-danger').hasAttribute('disabled')).toBe(false);
    });

    test('multiple users selected', () => {
        const component = <UserDeleteConfirmModal userIds={[1, 2, 3]} onCancel={jest.fn()} onComplete={jest.fn()} />;

        render(component);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelector('.modal-title').textContent).toBe('Delete 3 Users?');
        expect(document.querySelector('.modal-body').textContent).toContain('Deletion of a user is');
        expect(document.querySelector('.modal-body').textContent).toContain('3 users will be deleted.');
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-danger')).toHaveLength(1);
        expect(document.querySelector('.btn-danger').hasAttribute('disabled')).toBe(false);
    });
});
