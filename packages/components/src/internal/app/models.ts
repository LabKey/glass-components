/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { Record } from 'immutable';
import { ActionURL, getServerContext } from '@labkey/api';

import { ComponentType } from 'react';

import { Container } from '../components/base/models/Container';
import { User } from '../components/base/models/User';
import { InjectedRouteLeaveProps } from '../util/RouteLeave';
import { LabelsAPIWrapper } from '../components/labels/APIWrapper';

const user = new User({
    ...getServerContext().user,
    permissionsList: getServerContext().container?.effectivePermissions ?? [],
});

export class AppModel extends Record({
    container: new Container(getServerContext().container),
    contextPath: ActionURL.getContextPath(),
    initialUserId: user.id,
    user,
}) {
    declare container: Container;
    declare contextPath: string;
    declare initialUserId: number;
    declare user: User;

    hasUserChanged(): boolean {
        return this.initialUserId !== this.user.id;
    }

    shouldReload(): boolean {
        return this.hasUserChanged();
    }
}

export interface AppProperties {
    baseProductHelpLinkPrefix?: string;
    controllerName: string;
    dataClassUrlPart?: string;
    logoBadgeColorImageUrl: string;
    logoBadgeImageUrl: string;
    logoWithTextImageUrl: string;
    moduleName: string;
    name: string;
    productId: string;
    releaseNoteLink?: string;
    searchPlaceholder?: string;
    excludedSamplesExportColumns?: string[];
}

// Note: this should stay in sync with the eln/src/ReferencingNotebooks.tsx props
interface ReferencingNotebooksComponentProps {
    label: string;
    noun: string;
    queryName: string;
    schemaName: string;
    value: number;
}

export type ReferencingNotebooks = ComponentType<ReferencingNotebooksComponentProps>;

interface NotebookContainerSettingsProps {
    containerPath?: string;
    labelsAPI: LabelsAPIWrapper;
    onChange?: () => void;
    onSuccess?: (reload?: boolean) => void;
}

export type NotebookNotificationSettings = ComponentType;
export type NotebookContainerSettings = ComponentType<NotebookContainerSettingsProps>;
export type WorkflowNotificationSettings = ComponentType;

interface FolderStorageSelectionProps extends InjectedRouteLeaveProps {
    container?: Container;
    disabledTypesMap?: { [key: string]: number[] };
    onSuccess?: () => void;
    updateDataTypeExclusions?: (dataType: any, exclusions: number[]) => void;
}

export type FolderStorageSelection = ComponentType<FolderStorageSelectionProps>;
