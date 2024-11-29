import React from 'react';

import { render } from '@testing-library/react';

import { SECURITY_ROLE_AUTHOR, SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER } from '../../../test/data/constants';

import { CreateUsersModal } from './CreateUsersModal';

const ROLE_OPTIONS = [
    { id: SECURITY_ROLE_READER, label: 'Reader (default)' },
    { id: SECURITY_ROLE_AUTHOR, label: 'Author' },
    { id: SECURITY_ROLE_EDITOR, label: 'Editor' },
];

describe('CreateUsersModal', () => {
    test('default prop', () => {
        const component = <CreateUsersModal onCancel={jest.fn()} onComplete={jest.fn()} />;

        render(component);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.create-users-limit-message')).toHaveLength(0);
        expect(document.querySelectorAll('textarea')).toHaveLength(2);
        expect(document.querySelector('textarea#create-users-email-input').textContent).toBe('');
        expect(document.querySelector('textarea#create-users-optionalMessage-input').textContent).toBe('');
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(1);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBe(true); // no emailText
    });

    test('with roleOptions', () => {
        const component = <CreateUsersModal roleOptions={ROLE_OPTIONS} onCancel={jest.fn()} onComplete={jest.fn()} />;

        render(component);
        expect(document.querySelectorAll('.alert')).toHaveLength(0);
        expect(document.querySelectorAll('.create-users-limit-message')).toHaveLength(0);
        expect(document.querySelectorAll('textarea')).toHaveLength(2);
        expect(document.querySelector('textarea#create-users-email-input').textContent).toBe('');
        expect(document.querySelector('textarea#create-users-optionalMessage-input').textContent).toBe('');
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(1);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBe(true); // no emailText
    });

    test('with userLimitSettings', () => {
        const component = (
            <CreateUsersModal
                userLimitSettings={{ userLimit: true, remainingUsers: 2 }}
                onCancel={jest.fn()}
                onComplete={jest.fn()}
            />
        );

        render(component);
        expect(document.querySelector('.create-users-limit-message').textContent).toBe(
            'Number of users that can be added: 2'
        );
    });
});
