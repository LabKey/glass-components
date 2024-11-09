/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { UserResetPasswordConfirmModal, UserResetPasswordConfirmModalProps } from './UserResetPasswordConfirmModal';

describe('UserResetPasswordConfirmModal', () => {
    const email = 'jest@localhost.test';
    const userId = 5002;
    const DEFAULT_PROPS: UserResetPasswordConfirmModalProps = {
        email,
        hasLogin: true,
        onCancel: jest.fn(),
        onComplete: jest.fn(),
        resetPasswordApi: jest.fn().mockResolvedValue({ userId, resetPassword: true }),
        userId,
    };

    test('with login', () => {
        render(<UserResetPasswordConfirmModal {...DEFAULT_PROPS} />);

        expect(document.querySelector('.modal-title').innerHTML).toEqual('Reset Password?');
        expect(document.querySelector('.modal-body').innerHTML).toContain(
            'You are about to clear the current password for'
        );
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(1);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBe(false);
    });

    test('without login', () => {
        render(<UserResetPasswordConfirmModal {...DEFAULT_PROPS} hasLogin={false} />);

        expect(document.querySelector('.modal-body').innerHTML).toContain('You are about to send');
        expect(document.querySelectorAll('.btn')).toHaveLength(2);
        expect(document.querySelectorAll('.btn-success')).toHaveLength(1);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBe(false);
    });

    test('with error', async () => {
        const errorMsg = 'Test Error';
        const resetPasswordApi = jest.fn().mockRejectedValue(errorMsg);
        render(
            <UserResetPasswordConfirmModal {...DEFAULT_PROPS} hasLogin={false} resetPasswordApi={resetPasswordApi} />
        );

        await userEvent.click(document.querySelector('.btn-success'));

        expect(resetPasswordApi).toHaveBeenCalledWith(DEFAULT_PROPS.userId);
        expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
});
