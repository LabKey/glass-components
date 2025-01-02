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
import classNames from 'classnames';
import React, { FC, memo, ReactNode, useCallback, useMemo } from 'react';
import { List, Map } from 'immutable';
import { useLocation } from 'react-router-dom';

import { ServerNotifications } from '../notifications/ServerNotifications';
import { ServerNotificationsConfig } from '../notifications/model';

import { ProductNavigation } from '../productnavigation/ProductNavigation';

import { shouldShowProductNavigation } from '../productnavigation/utils';

import { SearchBox } from '../search/SearchBox';

import { FindAndSearchDropdown } from '../search/FindAndSearchDropdown';

import { getPrimaryAppProperties } from '../../app/utils';

import { User } from '../base/models/User';

import { useServerContext } from '../base/ServerContext';

import { isAdminRoute, ProductMenuButton } from './ProductMenu';
import { SubNav } from './SubNav';
import { UserMenuGroup, UserMenuProps } from './UserMenuGroup';
import { MenuSectionConfig } from './model';
import { SEARCH_PLACEHOLDER } from './constants';
import { useFolderMenuContext, useSubNavTabsContext } from './hooks';

interface NavigationBarProps {
    brand?: ReactNode;
    menuSectionConfigs?: List<Map<string, MenuSectionConfig>>;
    notificationsConfig?: ServerNotificationsConfig;
    onFindByIds?: (sessionkey: string) => void;
    onSearch?: (form: any) => void;
    searchPlaceholder?: string;
    showFolderMenu?: boolean;
    showNavMenu?: boolean;
    user?: User;
}

type Props = NavigationBarProps & UserMenuProps;

export const NavigationBar: FC<Props> = memo(props => {
    const {
        brand,
        extraDevItems,
        extraUserItems,
        menuSectionConfigs,
        notificationsConfig,
        onSearch,
        onFindByIds,
        onSignIn,
        onSignOut,
        searchPlaceholder,
        showNavMenu = true,
        showFolderMenu,
        signOutUrl,
        user,
    } = props;
    const { moduleContext } = useServerContext();
    const folderMenuContext = useFolderMenuContext();
    const location = useLocation();
    const isAdminPage = useMemo(() => isAdminRoute(location.pathname), [location.pathname]);
    const onSearchIconClick = useCallback(() => {
        onSearch('');
    }, [onSearch]);
    const _searchPlaceholder =
        searchPlaceholder ?? getPrimaryAppProperties(moduleContext)?.searchPlaceholder ?? SEARCH_PLACEHOLDER;
    const showNotifications = !!notificationsConfig && !!user && !user.isGuest;
    const showProductNav = shouldShowProductNavigation(user, moduleContext);
    const { noun, tabs } = useSubNavTabsContext();
    const hasSubNav = noun !== undefined || tabs.length > 0;

    return (
        <div className={classNames('app-navigation', { 'with-sub-nav': hasSubNav })}>
            <nav
                className={classNames('main-nav navbar test-loc-nav-header', {
                    'navbar-container': !isAdminPage,
                    'admin-navbar-container': isAdminPage,
                })}
            >
                <div className="container">
                    <div className="row">
                        <div className="navbar-left col-xs-6 col-md-6">
                            <span className="navbar-item navbar-left-icon pull-left">{brand}</span>
                            {showNavMenu && (
                                <span className="navbar-item navbar-left-menu">
                                    <ProductMenuButton
                                        key={folderMenuContext.key} // re-render and reload folderItems when folder added
                                        sectionConfigs={menuSectionConfigs}
                                        showFolderMenu={showFolderMenu}
                                    />
                                </span>
                            )}
                        </div>
                        <div className="navbar-right col-xs-6 col-md-6">
                            {!!user && (
                                <UserMenuGroup
                                    extraDevItems={extraDevItems}
                                    extraUserItems={extraUserItems}
                                    onSignIn={onSignIn}
                                    onSignOut={onSignOut}
                                    signOutUrl={signOutUrl}
                                    user={user}
                                />
                            )}
                            {showNotifications && !isAdminPage && <ServerNotifications {...notificationsConfig} />}
                            {showProductNav && <ProductNavigation />}
                            {!isAdminPage && (
                                <div className="navbar-item pull-right">
                                    <div className="hidden-md hidden-sm hidden-xs">
                                        <SearchBox
                                            onSearch={onSearch}
                                            placeholder={_searchPlaceholder}
                                            onFindByIds={onFindByIds}
                                            findNounPlural="samples"
                                        />
                                    </div>
                                    <div className="visible-md visible-sm visible-xs">
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

            <div className="sub-nav-wrapper">
                <SubNav />
            </div>
        </div>
    );
});
NavigationBar.displayName = 'NavigationBar';
