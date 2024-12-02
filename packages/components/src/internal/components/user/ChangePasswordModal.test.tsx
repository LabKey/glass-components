import React from 'react';

import { render } from '@testing-library/react';

import { TEST_USER_READER } from '../../userFixtures';

import { ChangePasswordModal } from './ChangePasswordModal';

jest.mock('./actions', () => ({
    ...jest.requireActual('./actions'),
    getPasswordRuleInfo: jest
        .fn()
        .mockResolvedValue({ summary: 'Testing password rule description', shouldShowPasswordGuidance: true }),
}));

describe('ChangePasswordModal', () => {
    test('default props', () => {
        render(<ChangePasswordModal user={TEST_USER_READER} onSuccess={jest.fn()} onHide={jest.fn()} />);

        const modal = document.querySelector('.modal-dialog');
        expect(modal.querySelectorAll('.alert')).toHaveLength(0);
        expect(modal.querySelectorAll('input')).toHaveLength(3);
        expect(modal.querySelectorAll('.btn')).toHaveLength(2);
        expect(modal.querySelectorAll('.btn')[0].hasAttribute('disabled')).toBe(false);
        expect(modal.querySelectorAll('.btn')[1].hasAttribute('disabled')).toBe(false);
    });
});
