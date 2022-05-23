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
import React, { FC, memo, useMemo } from 'react';
import { DropdownButton, MenuItem } from 'react-bootstrap';
import { PermissionTypes } from '@labkey/api';

import { hasAnyPermissions, User } from '../base/models/User';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { PicklistCreationMenuItem } from '../picklist/PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from '../picklist/AddToPicklistMenuItem';

interface Props {
    disabled?: boolean;
    model: QueryModel;
    user: User;
    metricFeatureArea?: string;
}

export const SampleActionsButton: FC<Props> = memo(props => {
    const { children, disabled, user, model, metricFeatureArea } = props;
    const sampleFieldKey = useMemo(() => model?.allColumns?.find(c => c.isSampleLookup())?.fieldKey, [model]);
    const id = 'sample-actions-menu';
    const hasPerms = hasAnyPermissions(user, [
        PermissionTypes.Insert,
        PermissionTypes.Update,
        PermissionTypes.ManagePicklists,
    ]);

    if (!(!!children || hasPerms)) {
        return null;
    }

    return (
        <DropdownButton
            bsStyle="default"
            disabled={disabled}
            id={`${id}-btn`}
            title="Samples"
            className="responsive-menu"
        >
            {children}
            {!!children && hasPerms && <hr className="divider" />}
            {hasPerms && (
                <>
                    <MenuItem header>Picklists</MenuItem>
                    <AddToPicklistMenuItem
                        user={user}
                        queryModel={model}
                        sampleFieldKey={sampleFieldKey}
                        metricFeatureArea={metricFeatureArea}
                    />
                    <PicklistCreationMenuItem
                        user={user}
                        selectionKey={sampleFieldKey ? undefined : model.id}
                        queryModel={model}
                        sampleFieldKey={sampleFieldKey}
                        metricFeatureArea={metricFeatureArea}
                    />
                </>
            )}
        </DropdownButton>
    );
});

SampleActionsButton.displayName = 'SampleActionsButton';
