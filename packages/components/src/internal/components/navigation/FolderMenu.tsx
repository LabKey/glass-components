import React, { FC, Fragment, memo, useMemo } from 'react';
import classNames from 'classnames';

import { getPrimaryAppProperties } from '../../app/utils';
import { useServerContext } from '../base/ServerContext';
import { AppURL, createProductUrl } from '../../url/AppURL';
import { getHref } from '../../url/utils';
import { Tip } from '../base/Tip';
import { ExpandableContainer } from '../ExpandableContainer';

export interface FolderMenuItem {
    archived: boolean;
    href: string;
    id: string;
    isTopLevel: boolean;
    label: string;
    path: string;
}

export interface FolderMenuProps {
    activeContainerId: string;
    currentProductId: string;
    items: FolderMenuItem[];
    onClick: (item: FolderMenuItem) => void;
}

export const FolderMenuItems: FC<FolderMenuProps> = memo(props => {
    const { items, onClick, activeContainerId, currentProductId } = props;
    const { moduleContext, user } = useServerContext();
    const primaryProductId = getPrimaryAppProperties(moduleContext).productId;

    // TODO: the "user" object here is for the current container, so all of the user.isAdmin checks below are incorrect
    // TBD if we want to includeEffectivePermissions in the getContainers() call in ProductMenu.tsx or use the
    // useContainerUser() hook here (need to consider performance implications)

    return (
        <>
            {items.map(item => {
                const dashboardURL = createProductUrl(
                    primaryProductId,
                    currentProductId,
                    AppURL.create('home'),
                    item.path
                );
                const adminURL = createProductUrl(
                    primaryProductId,
                    currentProductId,
                    AppURL.create('admin', 'folders'),
                    item.path
                );

                return (
                    <Fragment key={item.id}>
                        <li
                            className={classNames({
                                active: item.id === activeContainerId,
                                'menu-section-header': item.isTopLevel,
                                'menu-section-item': !item.isTopLevel,
                            })}
                        >
                            <div className="row">
                                <div
                                    className={classNames('col menu-folder-body', {
                                        'col-xs-9': user.isAdmin,
                                        'col-xs-10': !user.isAdmin,
                                    })}
                                >
                                    <a className="menu-folder-item" onClick={() => onClick(item)}>
                                        {item.label}
                                    </a>
                                </div>
                                <div
                                    className={classNames('col menu-folder-icons', {
                                        'col-xs-3': user.isAdmin,
                                        'col-xs-2': !user.isAdmin,
                                    })}
                                >
                                    <a href={getHref(dashboardURL)} className="dashboard-link">
                                        <Tip caption="Dashboard">
                                            <i className="fa fa-home dashboard-icon" />
                                        </Tip>
                                    </a>
                                    {user.isAdmin && (
                                        <a href={getHref(adminURL)}>
                                            <Tip caption="Administration">
                                                <i className="fa fa-gear" />
                                            </Tip>
                                        </a>
                                    )}
                                </div>
                            </div>
                        </li>
                        {item.isTopLevel && (
                            <li>
                                <hr />
                            </li>
                        )}
                    </Fragment>
                );
            })}
        </>
    );
});
FolderMenuItems.displayName = 'FolderMenuItems';

export const FolderMenu: FC<FolderMenuProps> = memo(props => {
    const { items, onClick, activeContainerId, currentProductId } = props;

    // TODO: the "user" object here is for the current container, so all of the user.isAdmin checks below are incorrect
    // TBD if we want to includeEffectivePermissions in the getContainers() call in ProductMenu.tsx or use the
    // useContainerUser() hook here (need to consider performance implications)
    const { activeItems, archivedItems } = useMemo(() => {
        const activeItems_ = [],
            archivedItems_ = [];
        items?.forEach(item => {
            if (item.archived) archivedItems_.push(item);
            else activeItems_.push(item);
        });
        return { activeItems: activeItems_, archivedItems: archivedItems_ };
    }, [items]);

    const archiveSectionHeader = (
        <>
            <div>
                <span>Archived Folders</span>
            </div>
        </>
    );

    return (
        <div className="menu-section col-folders">
            <ul>
                <FolderMenuItems
                    activeContainerId={activeContainerId}
                    currentProductId={currentProductId}
                    items={activeItems}
                    onClick={onClick}
                />
                {archivedItems?.length > 0 && (
                    <div className="archived-product-menu">
                        <ExpandableContainer
                            isExpandable={true}
                            clause={archiveSectionHeader}
                            links={null}
                            noIcon={true}
                            useGreyTheme={true}
                            rowCls=""
                        >
                            <FolderMenuItems
                                activeContainerId={activeContainerId}
                                currentProductId={currentProductId}
                                items={archivedItems}
                                onClick={onClick}
                            />
                        </ExpandableContainer>
                    </div>
                )}
            </ul>
        </div>
    );
});

FolderMenu.displayName = 'FolderMenu';
