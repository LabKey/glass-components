import React, { FC, memo, useCallback, useState } from 'react';

import { resolveErrorMessage } from '../../util/messaging';
import { Modal } from '../../Modal';
import { Alert } from '../base/Alert';

import { resetPassword, ResetPasswordResponse } from './actions';

export interface UserResetPasswordConfirmModalProps {
    email: string;
    hasLogin: boolean;
    onCancel: () => void;
    onComplete: (response: ResetPasswordResponse) => void;
    resetPasswordApi?: (userId: number) => Promise<ResetPasswordResponse>;
    userId: number;
}

export const UserResetPasswordConfirmModal: FC<UserResetPasswordConfirmModalProps> = memo(props => {
    const { email, userId, hasLogin, onCancel, onComplete, resetPasswordApi = resetPassword } = props;
    const [error, setError] = useState<string>();
    const [submitting, setSubmitting] = useState<boolean>(false);

    const onConfirm = useCallback(async () => {
        setSubmitting(true);

        try {
            const response = await resetPasswordApi(userId);
            onComplete(response);
        } catch (e) {
            setError(resolveErrorMessage(e, 'user', 'users', 'update') ?? 'Failed to reset password');
        } finally {
            setSubmitting(false);
        }
    }, [userId, onComplete, resetPasswordApi]);

    return (
        <Modal
            title="Reset Password?"
            onConfirm={onConfirm}
            onCancel={onCancel}
            confirmText="Yes, Reset Password"
            isConfirming={submitting}
        >
            {hasLogin ? (
                <p>
                    You are about to clear the current password for <b>{email}</b>. This will send the user a reset
                    password email and force them to pick a new password to access the site.
                </p>
            ) : (
                <p>
                    You are about to send <b>{email}</b> a reset password email. This will let them pick a password to
                    access the site.
                </p>
            )}
            <p>Do you want to proceed?</p>
            {error && <Alert>{error}</Alert>}
        </Modal>
    );
});

UserResetPasswordConfirmModal.displayName = 'UserResetPasswordConfirmModal';
