/*
 * Copyright (c) 2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { useEffect } from 'react';

import { useSubNavTabsContext } from '../navigation/hooks';

import { AppURL } from '../../url/AppURL';
import { useServerContext } from '../base/ServerContext';
import { AUDIT_KEY } from '../../app/constants';
import { isProductFoldersEnabled, isAppHomeFolder } from '../../app/utils';
import { useContainerUser } from '../container/actions';
import { ITab } from '../navigation/types';

const ADMIN_KEY = 'admin';
const PARENT_TAB: ITab = {
    text: 'Dashboard',
    url: AppURL.create('home'),
};

export const useAdministrationSubNav = (): void => {
    const { clearNav, setNoun, setTabs } = useSubNavTabsContext();
    const { container, moduleContext, user } = useServerContext();
    const isAppHome = isAppHomeFolder(container, moduleContext);
    const homeFolderPath = isAppHome ? container.path : container.parentPath;
    const homeProjectContainer = useContainerUser(homeFolderPath, { includeStandardProperties: true });
    const appHomeUser = homeProjectContainer.user ?? user;

    useEffect(() => {
        setNoun(PARENT_TAB);

        if (homeProjectContainer.isLoaded && user.isAdmin) {
            const foldersEnabled = isProductFoldersEnabled(moduleContext);
            const tabs = [];

            if (appHomeUser.isAdmin) {
                tabs.push({ text: 'Application Settings', url: AppURL.create(ADMIN_KEY, 'settings') });
            }

            if (foldersEnabled) tabs.push({ text: 'Folders', url: AppURL.create(ADMIN_KEY, 'folders') });

            tabs.push({ text: 'Audit Logs', url: AppURL.create(AUDIT_KEY) });

            if (appHomeUser.isAdmin) {
                tabs.push({ text: 'Users', url: AppURL.create(ADMIN_KEY, 'users') });
                tabs.push({ text: 'Groups', url: AppURL.create(ADMIN_KEY, 'groups') });
            }

            tabs.push({ text: 'Permissions', url: AppURL.create(ADMIN_KEY, 'permissions') });

            setTabs(tabs);
        }

        return clearNav;
    }, [
        appHomeUser.isAdmin,
        clearNav,
        container.path,
        homeProjectContainer.isLoaded,
        moduleContext,
        setNoun,
        setTabs,
        user.isAdmin,
    ]);
};
