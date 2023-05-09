/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Record } from 'immutable';
import { ActionURL, getServerContext } from '@labkey/api';

import { ComponentType } from 'react';

import { Container } from '../components/base/models/Container';
import { User } from '../components/base/models/User';

const user = new User({
    ...getServerContext().user,
    permissionsList: getServerContext().container?.effectivePermissions ?? [],
});

export enum LogoutReason {
    SERVER_LOGOUT,
    SESSION_EXPIRED,
    SERVER_UNAVAILABLE,
}

export class AppModel extends Record({
    container: new Container(getServerContext().container),
    contextPath: ActionURL.getContextPath(),
    initialUserId: user.id,
    logoutReason: undefined,
    reloadRequired: false,
    user,
}) {
    declare container: Container;
    declare contextPath: string;
    declare initialUserId: number;
    declare logoutReason: LogoutReason;
    declare reloadRequired: boolean;
    declare user: User;

    hasUserChanged(): boolean {
        return this.initialUserId !== this.user.id;
    }

    shouldReload(): boolean {
        return this.reloadRequired || this.hasUserChanged();
    }
}

export interface AppProperties {
    controllerName: string;
    dataClassUrlPart?: string;
    logoBadgeColorImageUrl: string;
    logoBadgeImageUrl: string;
    logoWithTextImageUrl: string;
    moduleName: string;
    name: string;
    productId: string;
    searchPlaceholder?: string;
}

// Note: this should stay in sync with the eln/src/ReferencingNotebooks.tsx props
interface ReferencingNotebooksComponentProps {
    label: string;
    queryName: string;
    schemaName: string;
    value: number;
}

export type ReferencingNotebooks = ComponentType<ReferencingNotebooksComponentProps>;

export type NotebookNotificationSettings = ComponentType;
export type NotebookProjectSettings = ComponentType;
export type WorkflowNotificationSettings = ComponentType;


interface ProjectFreezerSelectionProps {
    onChange?: () => void;
}

export type ProjectFreezerSelection = ComponentType<ProjectFreezerSelectionProps>;
