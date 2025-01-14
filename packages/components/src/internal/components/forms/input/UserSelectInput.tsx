/*
 * Copyright (c) 2017-2018 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, useMemo, useState } from 'react';

import { naturalSort } from '../../../../public/sort';

import { useAppContext } from '../../../AppContext';

import { resolveErrorMessage } from '../../../util/messaging';

import { getProjectPath } from '../../../app/utils';

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
    includeSiteGroups?: boolean;
    // specify whether this Select should correspond with a NotifyList on the server
    notifyList?: boolean;
    permissions?: string | string[];
    useEmail?: boolean;
}

export const UserSelectInput: FC<UserSelectInputProps> = memo(props => {
    const {
        clearCacheOnChange = false,
        containerPath,
        includeInactive,
        notifyList = false,
        permissions,
        useEmail = false,
        includeGroups = false,
        includeSiteGroups = false,
        ...selectInputProps
    } = props;
    const key = useMemo(() => generateKey(permissions, containerPath), [containerPath, permissions]);
    const [error, setError] = useState<string>();
    const { api } = useAppContext();

    const loadOptions = useCallback(
        async (input: string) => {
            let userOptions: SelectInputOption[];
            const sanitizedInput = input?.trim().toLowerCase();

            try {
                const users = await api.security.getUsersWithPermissions(permissions, containerPath, includeInactive);
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
                if (includeGroups) {
                    const groups = await api.security.fetchGroups(getProjectPath(containerPath), permissions, true);
                    const groupOptions = groups
                        .filter(group => {
                            if (includeSiteGroups) return true;
                            return group.isProjectGroup;
                        })
                        .map(v => ({
                            label: v.name,
                            value: v.id,
                        }));
                    if (groupOptions?.length > 0) {
                        return [
                            {
                                label: 'Project Groups',
                                options: groupOptions,
                            },
                            {
                                label: 'Users',
                                options: userOptions,
                            },
                        ];
                    }
                }
            } catch (e) {
                setError(resolveErrorMessage(e) ?? 'Failed to load users');
            }

            return userOptions;
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
