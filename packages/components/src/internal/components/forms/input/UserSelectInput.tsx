/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { User } from '@labkey/api';

import { naturalSort } from '../../../../public/sort';

import { useAppContext } from '../../../AppContext';

import { resolveErrorMessage } from '../../../util/messaging';

import { getProjectPath } from '../../../app/utils';

import { FetchedGroup } from '../../security/APIWrapper';

import { SelectInput, SelectInputOption, SelectInputProps } from './SelectInput';

function generateKey(permissions?: string | string[], containerPath?: string): string {
    let key = 'allPermissions';
    if (permissions) {
        if (Array.isArray(permissions)) {
            key = permissions.sort(naturalSort).join(';');
        } else {
            key = permissions;
        }
    }
    if (containerPath) {
        key = [containerPath, key].join('|');
    }
    return key;
}

interface UserSelectInputProps extends Omit<SelectInputProps, 'delimiter' | 'loadOptions'> {
    containerPath?: string;
    includeGroups?: boolean;
    includeInactive?: boolean;
    // specify whether this Select should correspond with a NotifyList on the server
    notifyList?: boolean;
    permissions?: string | string[];
    useEmail?: boolean;
}

export const getUserGroupOptions = (
    users: User[],
    groups?: FetchedGroup[],
    input?: string,
    notifyList?: boolean,
    useEmail?: boolean,
): SelectInputOption[] => {
    let userOptions: SelectInputOption[];
    const sanitizedInput = input?.trim().toLowerCase();
    userOptions = users
        ?.filter(v => {
            if (sanitizedInput) {
                return v.displayName?.toLowerCase().indexOf(sanitizedInput) > -1;
            }

            return true;
        })
        .map(v => ({
            label: v.displayName,
            value: notifyList ? v.displayName : useEmail ? v.email : v.userId,
        }));
    if (groups?.length > 0) {
        const groupedUserOptions = {
            label: 'Users',
            options: userOptions,
        };
        const groupOptions = groups
            .filter(group => {
                if (sanitizedInput && group.name?.toLowerCase().indexOf(sanitizedInput) === -1) {
                    return false;
                }

                return group.isProjectGroup;
            })
            .map(v => ({
                label: v.name,
                value: v.id,
            }));
        if (groupOptions?.length > 0) {
            const groupedGroupOptions = {
                label: 'Project Groups',
                options: groupOptions,
            };
            if (userOptions?.length > 0) {
                return [groupedGroupOptions, groupedUserOptions];
            } else {
                return [groupedGroupOptions];
            }
        }
    }

    return userOptions;
};

export const UserSelectInput: FC<UserSelectInputProps> = memo(props => {
    const {
        clearCacheOnChange = false,
        containerPath,
        includeInactive,
        notifyList = false,
        permissions,
        useEmail = false,
        includeGroups = false,
        ...selectInputProps
    } = props;
    const key = useMemo(() => generateKey(permissions, containerPath), [containerPath, permissions]);
    const [error, setError] = useState<string>();
    const { api } = useAppContext();

    const loadOptions = useCallback(
        async (input: string) => {
            try {
                const users = await api.security.getUsersWithPermissions(permissions, containerPath, includeInactive);
                let groups: FetchedGroup[];
                if (includeGroups)
                    groups = await api.security.fetchGroups(getProjectPath(containerPath), permissions, true);

                return getUserGroupOptions(users, groups, input, notifyList, useEmail);
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to load users');
            }
        },
        [api, containerPath, includeInactive, notifyList, permissions, useEmail]
    );

    return (
        <SelectInput
            {...selectInputProps}
            clearCacheOnChange={clearCacheOnChange}
            disabled={error ? true : selectInputProps.disabled}
            delimiter={notifyList ? ';' : ','}
            key={key}
            loadOptions={loadOptions}
            placeholder={error ?? selectInputProps.placeholder}
        />
    );
});

UserSelectInput.displayName = 'UserSelectInput';
