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
import React, { MouseEvent, FC, memo, useCallback, useState, useEffect, useRef, useMemo } from 'react';
import classNames from 'classnames';
import { List, Map } from 'immutable';
import { DropdownButton } from 'react-bootstrap';
import { withRouter, WithRouterProps } from 'react-router';
import { ActionURL } from '@labkey/api';

import { blurActiveElement } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { useServerContext } from '../base/ServerContext';
import { AppProperties } from '../../app/models';
import { getCurrentAppProperties, isProductProjectsEnabled, isProjectContainer } from '../../app/utils';

import { Alert } from '../base/Alert';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { naturalSortByProperty } from '../../../public/sort';
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
} from '../../app/constants';

import { FolderMenu, FolderMenuItem } from './FolderMenu';
import { ProductMenuSection } from './ProductMenuSection';
import { MenuSectionConfig, MenuSectionModel, ProductMenuModel } from './model';
import { HOME_PATH, HOME_TITLE } from './constants';

export interface ProductMenuButtonProps {
    appProperties?: AppProperties;
    sectionConfigs: List<Map<string, MenuSectionConfig>>;
    showFolderMenu: boolean;
}

const ProductMenuButtonImpl: FC<ProductMenuButtonProps & WithRouterProps> = memo(props => {
    const { appProperties = getCurrentAppProperties(), routes } = props;
    const [menuOpen, setMenuOpen] = useState(false);
    const [error, setError] = useState<string>();
    const [loading, setLoading] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [folderItems, setFolderItems] = useState<FolderMenuItem[]>([]);
    const hasError = !!error;
    const isLoaded = !isLoading(loading);
    const { api } = useAppContext<AppContext>();
    const { container } = useServerContext();

    useEffect(() => {
        setLoading(LoadingState.LOADING);
        setError(undefined);

        (async () => {
            try {
                let folders = await api.security.fetchContainers({
                    // Container metadata does not always provide "type" so inspecting the
                    // "parentPath" to determine top-level folder vs subfolder.
                    containerPath: container.parentPath === '/' ? container.path : container.parentPath,
                });

                // if user doesn't have permissions to the parent/project, the response will come back with an empty Container object
                folders = folders.filter(c => c !== undefined && c.id !== '');

                const items_: FolderMenuItem[] = [];
                const topLevelFolderIdx = folders.findIndex(f => f.parentPath === '/');
                if (topLevelFolderIdx > -1) {
                    // Remove top-level folder from array as it is always displayed as the first menu item
                    const topLevelFolder = folders.splice(topLevelFolderIdx, 1)[0];
                    items_.push(createFolderItem(topLevelFolder, appProperties.controllerName, true));
                }

                // Issue 45805: sort folders by title as server-side sorting is insufficient
                folders.sort(naturalSortByProperty('title'));
                setFolderItems(
                    items_.concat(folders.map(folder => createFolderItem(folder, appProperties.controllerName, false)))
                );
            } catch (e) {
                setError(`Error: ${resolveErrorMessage(e)}`);
            }

            setLoading(LoadingState.LOADED);
        })();
    }, [api, container, appProperties?.controllerName]);

    const toggleMenu = useCallback(() => {
        setMenuOpen(!menuOpen);
        blurActiveElement();
    }, [menuOpen, setMenuOpen]);

    // Only toggle the menu closing if a menu section link has been clicked.
    // Clicking anywhere else inside the menu will not toggle the menu, including side panel folder clicks.
    const onClick = useCallback(
        (evt: MouseEvent<HTMLDivElement>) => {
            const { nodeName, className } = evt.target as any;
            if (!nodeName || (nodeName.toLowerCase() === 'a' && className !== 'menu-folder-item')) {
                toggleMenu();
            }
        },
        [toggleMenu]
    );

    if (!isLoaded && !hasError) return null;
    const showFolders = folderItems?.length > 1;

    return (
        <DropdownButton
            className="product-menu-button"
            id="product-menu"
            onToggle={toggleMenu}
            open={menuOpen}
            title={<ProductMenuButtonTitle container={container} folderItems={folderItems} routes={routes} />}
        >
            {menuOpen && (
                <ProductMenu
                    {...props}
                    className={classNames({ 'with-col-folders': showFolders })}
                    onClick={onClick}
                    error={error}
                    folderItems={folderItems}
                    showFolderMenu={showFolders}
                />
            )}
        </DropdownButton>
    );
});

export const ProductMenuButton = withRouter<ProductMenuButtonProps>(ProductMenuButtonImpl);

export interface ProductMenuProps extends ProductMenuButtonProps {
    className: string;
    error: string;
    folderItems: FolderMenuItem[];
    onClick: (evt: MouseEvent<HTMLDivElement>) => void;
}

export const ProductMenu: FC<ProductMenuProps> = memo(props => {
    const {
        className,
        onClick,
        error,
        folderItems,
        sectionConfigs,
        showFolderMenu,
        appProperties = getCurrentAppProperties(),
    } = props;
    const { api } = useAppContext<AppContext>();
    const { container, moduleContext } = useServerContext();
    const [menuModel, setMenuModel] = useState<ProductMenuModel>(new ProductMenuModel({ containerId: container.id }));
    const contentRef = useRef<HTMLDivElement>();

    useEffect(() => {
        if (!menuModel.isLoaded) return;

        // The desired behavior is that we have a min-height and then grow the menu to the max-height of 80% of the
        // browser height. The menu should grow based on the longest section column list or the project list, whichever
        // is longer.
        let height = 400; // match navbar.scss product-menu-content min-height
        const maxHeight = window.innerHeight * 0.8;
        const sections = Array.from(contentRef.current.getElementsByClassName('menu-section'));
        sections.forEach(section => (height = Math.max(height, section.clientHeight)));
        contentRef.current.style.height = Math.min(height, maxHeight) + 'px';

        // if the selected project is out of view, scrollIntoView
        const activeProject = contentRef.current.getElementsByClassName('active')?.[0];
        if (activeProject) {
            if (activeProject.getBoundingClientRect().bottom > contentRef.current.getBoundingClientRect().bottom) {
                contentRef.current.getElementsByClassName('active')?.[0].scrollIntoView({ behavior: 'smooth' });
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

    const dashboardURL = useMemo(() => {
        return showFolderMenu && appProperties.logoBadgeColorImageUrl;
    }, [appProperties.logoBadgeColorImageUrl, showFolderMenu]);

    const showEmptyActionUrl = useMemo(() => {
        if (isProjectContainer(menuModel.containerPath))
            // if top folder
            return true;

        return !isProductProjectsEnabled(moduleContext); // or if subfolder where Projects are not enable
    }, [menuModel, moduleContext]);

    const sectionConfigKeysWithInfo = sectionConfigs.reduce((keysWithInfo, sectionConfig) => {
        // get the keys for the sections in a given column/config that have info/items
        keysWithInfo.push(Object.keys(sectionConfig.toJS()).filter(key => getSectionModel(key) !== undefined));
        return keysWithInfo;
    }, []);
    const colsWithSectionCount = sectionConfigKeysWithInfo.filter(keysWithInfo => keysWithInfo.length > 0).length;

    return (
        <div className={classNames('product-menu-content', className, {
            'with-section-count-3': colsWithSectionCount === 3,
            'with-section-count-4': colsWithSectionCount === 4,
        })} onClick={onClick} ref={contentRef}>
            <div className="navbar-connector" />
            {error && <Alert>{error}</Alert>}
            {showFolderMenu && (
                <FolderMenu activeContainerId={menuModel.containerId} items={folderItems} onClick={onFolderItemClick} />
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
                    sectionConfigs.map((sectionConfig, i) => {
                        // this can happen if a user has different perm in different project folders
                        if (sectionConfigKeysWithInfo[i].length === 0) return null;

                        return (
                            // eslint-disable-next-line react/no-array-index-key
                            <div key={i} className="menu-section col-product-section">
                                {sectionConfig.entrySeq().map(([key, menuConfig], j) => {
                                    const isLast =
                                        i === sectionConfigs.size - 1 &&
                                        sectionConfigKeysWithInfo[i].indexOf(key) ===
                                            sectionConfigKeysWithInfo[i].length - 1;

                                    return (
                                        <ProductMenuSection
                                            key={key}
                                            section={getSectionModel(key)}
                                            config={menuConfig}
                                            containerPath={menuModel.containerPath}
                                            hideEmptyUrl={!showEmptyActionUrl}
                                            currentProductId={menuModel.currentProductId}
                                            dashboardImgURL={isLast && dashboardURL}
                                        />
                                    );
                                })}
                            </div>
                        );
                    })}
            </div>
        </div>
    );
});

interface ProductMenuButtonTitle {
    container: Container;
    folderItems: FolderMenuItem[];
    routes: any[];
}

export const ProductMenuButtonTitle: FC<ProductMenuButtonTitle> = memo(props => {
    const { container, folderItems, routes } = props;
    const title = useMemo(() => {
        return folderItems?.length > 1 ? (container.path === HOME_PATH ? HOME_TITLE : container.title) : 'Menu';
    }, [container.path, container.title, folderItems?.length]);

    const subtitle = useMemo(() => {
        return getHeaderMenuSubtitle(routes?.[1]?.path);
    }, [routes]);

    return (
        <>
            <div className="title">{title}</div>
            <div className="subtitle">{subtitle}</div>
        </>
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
    [PICKLIST_KEY]: 'Picklists',
    [REGISTRY_KEY]: 'Registry',
    [SAMPLE_TYPE_KEY.toLowerCase()]: 'Sample Types',
    [SAMPLES_KEY]: 'Sample Types',
    [SOURCE_TYPE_KEY.toLowerCase()]: 'Source Types',
    [SOURCES_KEY]: 'Source Types',
    [SEARCH_KEY]: 'Search',
    [WORKFLOW_KEY]: 'Workflow',
};

// export for jest testing
export function getHeaderMenuSubtitle(baseRoute: string) {
    return HEADER_MENU_SUBTITLE_MAP[baseRoute?.toLowerCase()] ?? 'Dashboard';
}
