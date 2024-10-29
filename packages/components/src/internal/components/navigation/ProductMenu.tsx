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
import React, { MouseEvent, FC, memo, useCallback, useState, useEffect, useMemo, MutableRefObject } from 'react';
import { List, Map } from 'immutable';
import { Location } from 'history';
import { ActionURL } from '@labkey/api';
import { useLocation } from 'react-router-dom';

import { blurActiveElement } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { useServerContext } from '../base/ServerContext';
import { AppProperties } from '../../app/models';
import { getCurrentAppProperties } from '../../app/utils';

import { Alert } from '../base/Alert';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { resolveErrorMessage } from '../../util/messaging';
import { AppContext, useAppContext } from '../../AppContext';
import { Container } from '../base/models/Container';
import { buildURL } from '../../url/AppURL';

import {
    AUDIT_KEY,
    MEDIA_KEY,
    REGISTRY_KEY,
    SAMPLE_TYPE_KEY,
    SAMPLES_KEY,
    SEARCH_KEY,
    WORKFLOW_KEY,
    ASSAY_DESIGN_KEY,
    ASSAYS_KEY,
    PICKLIST_KEY,
    ELN_KEY,
    SOURCE_TYPE_KEY,
    SOURCES_KEY,
    FREEZERS_KEY,
    BOXES_KEY,
    PLATES_KEY,
} from '../../app/constants';

import { useNavMenuState } from '../../useNavMenuState';

import { FolderMenu, FolderMenuItem } from './FolderMenu';
import { ProductMenuSection } from './ProductMenuSection';
import { MenuSectionConfig, MenuSectionModel, ProductMenuModel } from './model';
import { HOME_PATH, HOME_TITLE } from './constants';

export interface ProductMenuButtonProps {
    appProperties?: AppProperties;
    sectionConfigs: List<Map<string, MenuSectionConfig>>;
    showFolderMenu: boolean;
}

export interface ProductMenuProps extends ProductMenuButtonProps {
    error: string;
    folderItems: FolderMenuItem[];
    menuRef: MutableRefObject<HTMLDivElement>;
    onClick: (evt: MouseEvent<HTMLDivElement>) => void;
}

export const ProductMenu: FC<ProductMenuProps> = memo(props => {
    const {
        menuRef,
        onClick,
        error,
        folderItems,
        sectionConfigs,
        showFolderMenu,
        appProperties = getCurrentAppProperties(),
    } = props;
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext } = useServerContext();
    const [menuModel, setMenuModel] = useState<ProductMenuModel>(
        () => new ProductMenuModel({ containerId: container.id })
    );

    useEffect(() => {
        if (!menuModel.isLoaded) return;

        // The desired behavior is that we have a min-height and then grow the menu to the max-height of 80% of the
        // browser height. The menu should grow based on the longest section column list or the project list, whichever
        // is longer.
        let height = 400; // match navbar.scss product-menu-content min-height
        const maxHeight = window.innerHeight * 0.8;
        const sections = Array.from(menuRef.current.getElementsByClassName('menu-section'));
        sections.forEach(section => (height = Math.max(height, section.clientHeight)));
        menuRef.current.style.height = Math.min(height, maxHeight) + 'px';

        // if the selected project is out of view, scrollIntoView
        const activeContainer = menuRef.current.getElementsByClassName('active')?.[0];
        if (activeContainer) {
            if (activeContainer.getBoundingClientRect().bottom > menuRef.current.getBoundingClientRect().bottom) {
                menuRef.current.getElementsByClassName('active')?.[0].scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [menuModel.isLoaded]);

    useEffect(() => {
        (async () => {
            // no try/catch as the initMenuModel will catch errors and put them in the model isError/message
            const menuModel_ = await api.navigation.initMenuModel(appProperties, moduleContext, container.id);
            setMenuModel(menuModel_);
        })();
    }, [api.navigation, appProperties, container.id, moduleContext]);

    const onFolderItemClick = useCallback(
        async (folderItem: FolderMenuItem) => {
            // return early if folderItem is already active
            if (folderItem.id === menuModel.containerId) return;

            setMenuModel(new ProductMenuModel({ containerId: folderItem.id })); // loading state, reset error

            // no try/catch as the initMenuModel will catch errors and put them in the model isError/message
            const containerPath = folderItem.id === container.id ? undefined : folderItem.path;
            const menuModel_ = await api.navigation.initMenuModel(
                appProperties,
                moduleContext,
                folderItem.id,
                containerPath
            );
            setMenuModel(menuModel_);
        },
        [api.navigation, appProperties, container.id, menuModel.containerId, moduleContext]
    );

    const getSectionModel = useCallback(
        (key: string): MenuSectionModel => menuModel.sections.find(section => section.key === key),
        [menuModel]
    );

    const sectionConfigKeysWithInfo = sectionConfigs.reduce((keysWithInfo, sectionConfig) => {
        // get the keys for the sections in a given column/config that have info/items
        keysWithInfo.push(Object.keys(sectionConfig.toJS()).filter(key => getSectionModel(key) !== undefined));
        return keysWithInfo;
    }, []);

    return (
        <div className="product-menu-content" onClick={onClick} ref={menuRef}>
            <div className="navbar-connector" />
            {error && <Alert>{error}</Alert>}
            <div className="product-menu-content-body">
                {showFolderMenu && (
                    <FolderMenu
                        activeContainerId={menuModel.containerId}
                        currentProductId={menuModel.currentProductId}
                        items={folderItems}
                        onClick={onFolderItemClick}
                    />
                )}
                <div className="sections-content">
                    {!menuModel.isLoaded && (
                        <div className="menu-section menu-loading">
                            <LoadingSpinner />
                        </div>
                    )}
                    {menuModel.isError && (
                        <div className="menu-section">
                            <Alert>{menuModel.message}</Alert>
                        </div>
                    )}
                    {menuModel.isLoaded &&
                        sectionConfigs
                            .map((sectionConfig, i) => {
                                // this can happen if a user has different perm in different project folders
                                if (sectionConfigKeysWithInfo[i].length === 0) return null;

                                return (
                                    // eslint-disable-next-line react/no-array-index-key
                                    <div key={i} className="menu-section col-product-section">
                                        {sectionConfig
                                            .entrySeq()
                                            .map(([key, menuConfig]) => {
                                                return (
                                                    <ProductMenuSection
                                                        key={key}
                                                        config={menuConfig}
                                                        containerPath={menuModel.containerPath}
                                                        currentProductId={menuModel.currentProductId}
                                                        section={getSectionModel(key)}
                                                    />
                                                );
                                            })
                                            .toArray()}
                                    </div>
                                );
                            })
                            .toArray()}
                </div>
            </div>
        </div>
    );
});

interface ProductMenuButtonTitle {
    container: Container;
    folderItems: FolderMenuItem[];
    location: Location;
}

export const ProductMenuButtonTitle: FC<ProductMenuButtonTitle> = memo(props => {
    const { container, folderItems, location } = props;
    const title = useMemo(() => {
        return folderItems?.length > 1 ? (container.path === HOME_PATH ? HOME_TITLE : container.title) : 'Menu';
    }, [container.path, container.title, folderItems?.length]);

    const subtitle = useMemo(() => {
        return getHeaderMenuSubtitle(location?.pathname);
    }, [location]);

    return (
        <>
            <div className="title">
                {title}
                {container.isArchived && <Alert className="product-menu_archived-tag">Archived</Alert>}
            </div>
            <div className="subtitle">{subtitle}</div>
        </>
    );
});

export const ProductMenuButton: FC<ProductMenuButtonProps> = memo(props => {
    const { appProperties = getCurrentAppProperties() } = props;
    const location = useLocation();
    const { show, setShow, menuRef, toggleRef } = useNavMenuState();
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [folderItems, setFolderItems] = useState<FolderMenuItem[]>([]);
    const hasError = !!error;
    const isLoaded = !isLoading(loading);
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext } = useServerContext();

    useEffect(() => {
        setLoading(LoadingState.LOADING);
        setError(undefined);

        (async () => {
            try {
                const folders = await api.folder.getContainers(container, moduleContext, true, false, true);

                const items_: FolderMenuItem[] = [];
                const topLevelFolderIdx = folders.findIndex(f => f.parentPath === '/');
                if (topLevelFolderIdx > -1) {
                    // Remove top-level folder from array as it is always displayed as the first menu item
                    const topLevelFolder = folders.splice(topLevelFolderIdx, 1)[0];
                    items_.push(createFolderItem(topLevelFolder, appProperties.controllerName, true));
                }

                setFolderItems(
                    items_.concat(folders.map(folder => createFolderItem(folder, appProperties.controllerName, false)))
                );
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            }

            setLoading(LoadingState.LOADED);
        })();
    }, [api, container, moduleContext, appProperties?.controllerName]);

    const toggleMenu = useCallback(() => {
        blurActiveElement();
        setShow(current => !current);
    }, [setShow]);

    // Only toggle the menu closing if a menu section link has been clicked or a project icon (issue 48283).
    // Clicking anywhere else inside the menu will not toggle the menu, including side panel folder clicks.
    const onClick = useCallback(
        (evt: MouseEvent<HTMLDivElement>) => {
            const classList = (evt.target as HTMLElement).classList;
            const isPageLink = classList.contains('menu-section-link');
            const isSectionIcon = classList.contains('menu-section-image');
            const isDashboardLink = classList.contains('dashboard-link') || classList.contains('dashboard-icon');

            if (isPageLink || isSectionIcon || isDashboardLink) {
                setShow(current => !current);
            }
        },
        [setShow]
    );

    if (!isLoaded && !hasError) return null;

    return (
        <div className="product-menu">
            <button
                aria-haspopup="true"
                aria-expanded={show}
                className="product-menu-button"
                onClick={toggleMenu}
                ref={toggleRef}
                role="button"
                type="button"
            >
                <ProductMenuButtonTitle container={container} folderItems={folderItems} location={location} />
                <span className="caret" />
            </button>

            {show && (
                <ProductMenu
                    {...props}
                    error={error}
                    folderItems={folderItems}
                    menuRef={menuRef}
                    onClick={onClick}
                    showFolderMenu={folderItems?.length > 1}
                />
            )}
        </div>
    );
});

// export for jest testing
export function createFolderItem(folder: Container, controllerName: string, isTopLevel: boolean): FolderMenuItem {
    return {
        href: buildURL(controllerName, `${ActionURL.getAction() || 'app'}.view`, undefined, {
            container: folder.path,
            returnUrl: false,
        }),
        id: folder.id,
        isTopLevel,
        label: folder.path === HOME_PATH ? HOME_TITLE : folder.title,
        path: folder.path,
        archived: folder.isArchived,
    };
}

const HEADER_MENU_SUBTITLE_MAP = {
    account: 'Settings',
    admin: 'Administration',
    items: 'Storage',
    lineage: 'Lineage',
    home: 'Dashboard',
    pipeline: 'Imports',
    q: 'Schemas',
    reports: 'Reports',

    [ASSAY_DESIGN_KEY.toLowerCase()]: 'Assays',
    [ASSAYS_KEY]: 'Assays',
    [AUDIT_KEY]: 'Administration',
    [BOXES_KEY]: 'Storage',
    [ELN_KEY]: 'Notebooks',
    [FREEZERS_KEY]: 'Storage',
    [MEDIA_KEY]: 'Media',
    [PLATES_KEY]: 'Plates',
    [PICKLIST_KEY]: 'Picklists',
    [REGISTRY_KEY]: 'Registry',
    [SAMPLE_TYPE_KEY.toLowerCase()]: 'Sample Types',
    [SAMPLES_KEY]: 'Sample Types',
    [SOURCE_TYPE_KEY.toLowerCase()]: 'Source Types',
    [SOURCES_KEY]: 'Source Types',
    [SEARCH_KEY]: 'Search',
    [WORKFLOW_KEY]: 'Workflow',
};

function getBaseRoute(pathname: string): string {
    // pathname is prefixed with, and split up, by /, so the first segment is always an empty string when splitting, the
    // second is the base route.
    return pathname?.toLowerCase().split('/')[1];
}

// export for jest testing
export function getHeaderMenuSubtitle(pathname: string): string {
    return HEADER_MENU_SUBTITLE_MAP[getBaseRoute(pathname)] ?? 'Dashboard';
}

export function isAdminRoute(pathname: string): boolean {
    return HEADER_MENU_SUBTITLE_MAP[getBaseRoute(pathname)] === 'Administration';
}
