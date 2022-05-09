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
import React, { FC } from 'react';

import { Notifications } from '../../..';

export interface PageHeaderProps {
    iconCls?: string;
    showNotifications?: boolean;
    title?: string;
}

export const PageHeader: FC<PageHeaderProps> = ({ children, iconCls, showNotifications = true, title }) => (
    <div className="page-header">
        {children}

        <h2 className="text-capitalize no-margin-top">
            {iconCls ? <span className={'page-header-icon ' + iconCls}>&nbsp;</span> : null}
            {title}
        </h2>

        {showNotifications && <Notifications />}
    </div>
);
