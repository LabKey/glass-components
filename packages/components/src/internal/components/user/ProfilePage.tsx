/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, useCallback, useState } from 'react';
import { Button } from 'react-bootstrap';
import { WithRouterProps } from 'react-router';

import { isLoginAutoRedirectEnabled } from '../administration/utils';
import { InsufficientPermissionsPage } from '../permissions/InsufficientPermissionsPage';

import { Page } from '../base/Page';

import { Section } from '../base/Section';

import { Notifications } from '../notifications/Notifications';

import { useServerContext } from '../base/ServerContext';

import { getDateFormat } from '../../util/Date';

import { useNotificationsContext } from '../notifications/NotificationsContext';

import { useRouteLeave } from '../../util/RouteLeave';

import { UserDetailHeader } from './UserDetailHeader';
import { getUserRoleDisplay } from './actions';

import { UserProfile } from './UserProfile';
import { ChangePasswordModal } from './ChangePasswordModal';

import { useUserProperties } from './UserProvider';

interface Props extends WithRouterProps {
    updateUserDisplayName: (displayName: string) => any;
}

const TITLE = 'User Profile';

const ProfilePageImpl: FC<Props> = props => {
    const { router, routes, updateUserDisplayName } = props;
    const [_, setIsDirty] = useRouteLeave(router, routes);
    const [showChangePassword, setShowChangePassword] = useState<boolean>(false);
    const { moduleContext, user } = useServerContext();
    const userProperties = useUserProperties(user);
    const { createNotification } = useNotificationsContext();

    if (!user.isSignedIn) {
        return <InsufficientPermissionsPage title={TITLE} />;
    }

    const navigate = useCallback(
        (result: any, shouldReload: boolean): void => {
            setIsDirty(false);
            const successMsg = 'Successfully updated your user profile.';

            if (shouldReload) {
                createNotification(successMsg);
                window.location.reload();
                return;
            }

            if (result) {
                const row = result.updatedRows[0];

                if (row !== undefined && row.DisplayName !== undefined) {
                    // push any display name changes to the app state user object
                    updateUserDisplayName(row.DisplayName);
                }

                if (result.success) {
                    createNotification(successMsg);
                }
            }
        },
        [createNotification, setIsDirty, updateUserDisplayName]
    );

    const onChangePassword = useCallback((): void => {
        createNotification('Successfully changed password.');
    }, [createNotification]);

    const toggleChangePassword = useCallback((): void => {
        setShowChangePassword(!showChangePassword);
    }, [showChangePassword]);

    const allowChangePassword = !isLoginAutoRedirectEnabled(moduleContext);

    return (
        <Page title={TITLE} hasHeader>
            <UserDetailHeader
                userProperties={userProperties}
                user={user}
                title={user.displayName + "'s Profile"}
                description={getUserRoleDisplay(user)}
                dateFormat={getDateFormat().toUpperCase()}
                renderButtons={
                    allowChangePassword ? <Button onClick={toggleChangePassword}>Change Password</Button> : null
                }
            />
            <Notifications />
            <Section>
                <UserProfile userProperties={userProperties} user={user} onSuccess={navigate} setIsDirty={setIsDirty} />
            </Section>
            {allowChangePassword && showChangePassword && (
                <ChangePasswordModal user={user} onHide={toggleChangePassword} onSuccess={onChangePassword} />
            )}
        </Page>
    );
};

export const ProfilePage = ProfilePageImpl;
