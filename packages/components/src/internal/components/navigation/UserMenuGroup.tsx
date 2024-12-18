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

import React, { FC, ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { getServerContext } from '@labkey/api';

import { User } from '../base/models/User';

import { devToolsActive, toggleDevTools } from '../../util/utils';

import { useServerContext } from '../base/ServerContext';
import { biologicsIsPrimaryApp, getCurrentAppProperties, getPrimaryAppProperties } from '../../app/utils';
import { AppProperties } from '../../app/models';

import { AppContext, useAppContext } from '../../AppContext';

import { getHelpLink } from '../../util/helpLinks';

import { HELP_LINK_METRIC, RELEASE_NOTES_METRIC } from '../productnavigation/constants';

import { DropdownMenu, DropdownButton, MenuDivider, MenuHeader, MenuItem } from '../../dropdowns';

import { signIn as defaultSignIn, signOut as defaultSignOut } from './actions';
import { MenuSectionModel } from './model';

export interface UserMenuProps {
    appProperties?: AppProperties;
    extraDevItems?: ReactNode;
    extraUserItems?: ReactNode;
    onSignIn?: () => void;
    onSignOut?: (signOutUrl: string) => void;
    signOutUrl?: string;
    user: User;
}

interface ImplProps {
    model: MenuSectionModel;
}

// exported for jest testing
export const UserMenuGroupImpl: FC<UserMenuProps & ImplProps> = props => {
    const {
        model,
        extraDevItems,
        extraUserItems,
        onSignIn = defaultSignIn,
        onSignOut = defaultSignOut,
        user,
        signOutUrl,
    } = props;
    const { api } = useAppContext();
    const releaseNoteLink = getPrimaryAppProperties()?.releaseNoteLink;
    const releaseNoteHref = releaseNoteLink
        ? getHelpLink(
              getPrimaryAppProperties()?.releaseNoteLink,
              null,
              biologicsIsPrimaryApp() /* needed for FM in Biologics*/
          )
        : undefined;

    const { helpHref, userMenuItems, adminMenuItems } = useMemo(() => {
        let helpHref;
        const userMenuItems = [];
        const adminMenuItems = [];
        model?.items
            .filter(item => !item.requiresLogin || (item.requiresLogin && user?.isSignedIn))
            .forEach(item => {
                if (item.key === 'docs') {
                    helpHref = item.getUrlString();
                } else {
                    const menuItem = (
                        <MenuItem key={item.key} href={item.getUrlString()} target="_self">
                            {item.label}
                        </MenuItem>
                    );
                    if (item.key.indexOf('admin') === 0) {
                        adminMenuItems.push(menuItem);
                    } else {
                        userMenuItems.push(menuItem);
                    }
                }
            });
        return {
            helpHref,
            userMenuItems,
            adminMenuItems,
        };
    }, [model?.items, user?.isSignedIn]);

    const handleSignOut = useCallback(() => {
        onSignOut(signOutUrl);
    }, [onSignOut, signOutUrl]);

    const onReleaseNotesClick = useCallback(() => {
        api.query.incrementClientSideMetricCount(RELEASE_NOTES_METRIC, 'FromHelpMenu');
    }, []);

    const onHelpClick = useCallback(() => {
        api.query.incrementClientSideMetricCount(HELP_LINK_METRIC, 'clickCount');
    }, []);

    if (!model || !user) {
        return null;
    }

    const userToggle = user.avatar ? (
        <img className="img-rounded" src={user.avatar} alt="User Avatar" height={32} width={32} />
    ) : (
        <span className="navbar-item">
            <span className="user-name">
                <span className="fas fa-user-circle" /> {user.displayName}{' '}
            </span>
        </span>
    );

    return (
        <>
            <div className="navbar-item pull-right">
                <DropdownMenu className="user-dropdown" title={userToggle} pullRight>
                    <div className="navbar-connector" />
                    {userMenuItems}
                    {extraUserItems}
                    {(userMenuItems?.length > 0 || extraUserItems) && <MenuDivider />}
                    {user.isSignedIn ? (
                        <MenuItem onClick={handleSignOut}>Sign Out</MenuItem>
                    ) : (
                        <MenuItem onClick={onSignIn}>Sign In</MenuItem>
                    )}
                </DropdownMenu>
            </div>
            {(adminMenuItems?.length > 0 || getServerContext().devMode) && (
                <div className="navbar-item pull-right navbar-item__dropdown">
                    <DropdownButton
                        className="admin-dropdown"
                        buttonClassName="navbar-menu-button"
                        title={<i className="fa fa-cog navbar-header-icon" />}
                        noCaret
                        pullRight
                    >
                        <div className="navbar-icon-connector" />
                        {adminMenuItems}
                        {adminMenuItems?.length > 0 && getServerContext().devMode && <MenuDivider />}
                        {getServerContext().devMode && (
                            <>
                                <MenuHeader text="Dev Tools" />
                                <MenuItem onClick={toggleDevTools}>
                                    {devToolsActive() ? 'Disable' : 'Enable'} Redux Tools
                                </MenuItem>
                                {extraDevItems}
                            </>
                        )}
                    </DropdownButton>
                </div>
            )}
            {(!!helpHref || !!releaseNoteHref) && (
                <div className="navbar-item pull-right navbar-item__dropdown">
                    <DropdownButton
                        className="help-dropdown"
                        buttonClassName="navbar-menu-button"
                        title={<i className="fa fa-question-circle navbar-header-icon" />}
                        noCaret
                        pullRight
                    >
                        <div className="navbar-icon-connector" />
                        {helpHref && (
                            <MenuItem href={helpHref} target="_blank" rel="noopener noreferrer" onClick={onHelpClick}>
                                Help
                            </MenuItem>
                        )}
                        {releaseNoteHref && (
                            <MenuItem
                                href={releaseNoteHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={onReleaseNotesClick}
                            >
                                Release Notes
                            </MenuItem>
                        )}
                    </DropdownButton>
                </div>
            )}
        </>
    );
};

export const UserMenuGroup: FC<UserMenuProps> = props => {
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext } = useServerContext();
    const { appProperties = getPrimaryAppProperties(moduleContext) } = props;
    const productId = getCurrentAppProperties()?.productId ?? appProperties.productId;

    const [model, setModel] = useState<MenuSectionModel>();

    useEffect(() => {
        (async () => {
            // no try/catch as the loadUserMenu will catch errors and return undefined
            const sectionModel = await api.navigation.loadUserMenu(productId, appProperties, moduleContext);
            setModel(sectionModel);
        })();
    }, [api.navigation, appProperties, container.path, moduleContext, productId]);

    return <UserMenuGroupImpl {...props} model={model} />;
};
