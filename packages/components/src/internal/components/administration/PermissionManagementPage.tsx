/*
 * Copyright (c) 2018-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useMemo } from 'react';
import { Map } from 'immutable';

import { useServerContext } from '../base/ServerContext';

import { showPremiumFeatures } from './utils';
import { APPLICATION_SECURITY_ROLES, HOSTED_APPLICATION_SECURITY_ROLES } from './constants';
import { BasePermissions } from './BasePermissions';
import { useAdminAppContext } from './useAdminAppContext';

export const PermissionManagementPage: FC = memo(() => {
    const { container, user } = useServerContext();
    const { extraPermissionRoles } = useAdminAppContext();

    const rolesMap = useMemo(() => {
        let roles = showPremiumFeatures() ? APPLICATION_SECURITY_ROLES : HOSTED_APPLICATION_SECURITY_ROLES;
        roles = roles.merge(Map<string, string>(extraPermissionRoles));
        return roles;
    }, [extraPermissionRoles]);

    return (
        <BasePermissions
            containerId={container.id}
            disableRemoveSelf={false}
            hasPermission={user.isAdmin}
            pageTitle="Permissions"
            panelTitle="Application Roles and Assignments"
            rolesMap={rolesMap}
            showDetailsPanel={user.hasManageUsersPermission()}
            description={showPremiumFeatures() ? container.path : undefined}
        />
    );
});
