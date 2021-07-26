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

import { ProductNavigation } from '../productnavigation/ProductNavigation';

import { shouldShowProductNavigation } from '../productnavigation/utils';

import { ProductMenu } from './ProductMenu';
import { SearchBox } from './SearchBox';
import { UserMenu, UserMenuProps } from './UserMenu';
import { MenuSectionConfig } from './ProductMenuSection';
import { ProductMenuModel } from './model';
import { FindAndSearchDropdown } from './FindAndSearchDropdown';

interface NavigationBarProps {
    brand?: ReactNode;
    menuSectionConfigs?: List<Map<string, MenuSectionConfig>>;
    model: ProductMenuModel;
    notificationsConfig?: ServerNotificationsConfig;
    onSearch?: (form: any) => void;
    onFindByIds?: (sessionkey: string) => void;
    projectName?: string;
    searchPlaceholder?: string;
    showNavMenu?: boolean;
    showNotifications?: boolean;
    showProductNav?: boolean;
    showSearchBox?: boolean;
    user?: User;
}

type Props = NavigationBarProps & UserMenuProps;

export const NavigationBar: FC<Props> = memo(props => {
    const {
        brand,
        extraDevItems,
        extraUserItems,
        menuSectionConfigs,
        model,
        notificationsConfig,
        onSearch,
        onFindByIds,
        onSignIn,
        onSignOut,
        projectName,
        searchPlaceholder,
        showNavMenu,
        showNotifications,
        showProductNav,
        showSearchBox,
        signOutUrl,
        user,
    } = props;

    const onSearchIconClick = useCallback(() => {
        onSearch('');
    }, [onSearch]);

    const _showNotifications = showNotifications !== false && !!notificationsConfig && user && !user.isGuest;
    const _showProductNav = shouldShowProductNavigation(user) && showProductNav !== false;

    return (
        <nav className="navbar navbar-container test-loc-nav-header">
            <div className="container">
                <div className="row">
                    <div className="navbar-left col-md-5 col-sm-4 col-xs-7">
                        <span className="navbar-item pull-left">{brand}</span>
                        <span className="navbar-item-padded">
                            {showNavMenu && !!model && (
                                <ProductMenu model={model} sectionConfigs={menuSectionConfigs} />
                            )}
                        </span>
                        {projectName && (
                            <span className="navbar-item hidden-sm hidden-xs">
                                <span className="project-name">
                                    <i className="fa fa-folder-open-o" /> {projectName}{' '}
                                </span>
                            </span>
                        )}
                    </div>
                    <div className="navbar-right col-md-7 col-sm-8 col-xs-5">
                        {!!user && (
                            <div className="navbar-item pull-right">
                                <UserMenu
                                    extraDevItems={extraDevItems}
                                    extraUserItems={extraUserItems}
                                    model={model}
                                    onSignIn={onSignIn}
                                    onSignOut={onSignOut}
                                    signOutUrl={signOutUrl}
                                    user={user}
                                />
                            </div>
                        )}
                        {_showNotifications && (
                            <div className="navbar-item pull-right navbar-item-notification">
                                <ServerNotifications {...notificationsConfig} />
                            </div>
                        )}
                        {_showProductNav && (
                            <div className="navbar-item pull-right navbar-item-product-navigation">
                                <ProductNavigation />
                            </div>
                        )}
                        {showSearchBox && (
                            <div className="navbar-item pull-right">
                                <div className="hidden-sm hidden-xs">
                                    <SearchBox
                                        onSearch={onSearch}
                                        placeholder={searchPlaceholder}
                                        onFindByIds={onFindByIds}
                                        findNounPlural="samples"
                                    />
                                </div>
                                <div className="visible-sm visible-xs">
                                    {onFindByIds ? (
                                        <FindAndSearchDropdown
                                            className="navbar__xs-find-dropdown"
                                            title={<i className="fa fa-search navbar__xs-search-icon" />}
                                            findNounPlural="samples"
                                            onSearch={onSearchIconClick}
                                            onFindByIds={onFindByIds}
                                        />
                                    ) : (
                                        <i
                                            className="fa fa-search navbar__xs-search-icon"
                                            onClick={onSearchIconClick}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
});

NavigationBar.defaultProps = {
    showNavMenu: true,
    showNotifications: true,
    showProductNav: true,
    showSearchBox: false,
};

NavigationBar.displayName = 'NavigationBar';
