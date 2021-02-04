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
import React, { FC, memo, ReactNode, useCallback } from 'react';
import { List, Map } from 'immutable';

import { User } from '../../..';

import { ServerNotifications } from '../notifications/ServerNotifications';

import { ServerNotificationsConfig } from '../notifications/model';

import { ProductMenu } from './ProductMenu';
import { SearchBox } from './SearchBox';
import { UserMenu } from './UserMenu';
import { MenuSectionConfig } from './ProductMenuSection';
import { ProductMenuModel } from './model';

interface NavigationBarProps {
    brand?: ReactNode;
    menuSectionConfigs?: List<Map<string, MenuSectionConfig>>;
    model: ProductMenuModel;
    notificationsConfig?: ServerNotificationsConfig;
    onSearch?: (form: any) => void;
    projectName?: string;
    searchPlaceholder?: string;
    showSearchBox?: boolean;
    showSwitchToLabKey?: boolean;
    signOutUrl?: string;
    user?: User;
}

export const NavigationBar: FC<NavigationBarProps> = memo(props => {
    const {
        brand,
        menuSectionConfigs,
        model,
        notificationsConfig,
        onSearch,
        projectName,
        searchPlaceholder,
        showSearchBox,
        showSwitchToLabKey,
        signOutUrl,
        user,
    } = props;

    const onSearchIconClick = useCallback(() => {
        onSearch('');
    }, [onSearch]);

    const notifications =
        !!notificationsConfig && user && !user.isGuest ? <ServerNotifications {...notificationsConfig} /> : null;

    return (
        <nav className="navbar navbar-container test-loc-nav-header">
            <div className="container">
                <div className="row">
                    <div className="navbar-left col-sm-5 col-xs-7">
                        <span className="navbar-item pull-left">{brand}</span>
                        <span className="navbar-item-padded">
                            {!!model && <ProductMenu model={model} sectionConfigs={menuSectionConfigs} />}
                        </span>
                        {projectName && (
                            <span className="navbar-item hidden-sm hidden-xs">
                                <span className="project-name">
                                    <i className="fa fa-folder-open-o" /> {projectName}{' '}
                                </span>
                            </span>
                        )}
                    </div>
                    <div className="navbar-right col-sm-7 col-xs-5">
                        <div className="navbar-item pull-right">
                            {!!user && (
                                <UserMenu
                                    model={model}
                                    showSwitchToLabKey={showSwitchToLabKey}
                                    signOutUrl={signOutUrl}
                                    user={user}
                                />
                            )}
                        </div>
                        <div className="navbar-item pull-right navbar-item-notification">{notifications}</div>
                        <div className="navbar-item pull-right hidden-xs">
                            {showSearchBox && <SearchBox onSearch={onSearch} placeholder={searchPlaceholder} />}
                        </div>
                        <div className="navbar-item pull-right visible-xs">
                            {showSearchBox && (
                                <i className="fa fa-search navbar__xs-search-icon" onClick={onSearchIconClick} />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
});

NavigationBar.defaultProps = {
    showSearchBox: false,
    showSwitchToLabKey: true,
};
