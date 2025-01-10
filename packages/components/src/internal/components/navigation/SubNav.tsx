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
import React, { FC, useRef, useState, useCallback, useEffect, memo, useMemo } from 'react';

import { getServerContext } from '@labkey/api';
import { useLocation } from 'react-router-dom';

import { useServerContext } from '../base/ServerContext';

import { hasPremiumModule, hasProductFolders } from '../../app/utils';

import { NavItem, ParentNavItem } from './NavItem';
import { isAdminRoute } from './ProductMenu';
import { ITab } from './types';
import { useSubNavTabsContext } from './hooks';

interface Props {
    noun?: ITab;
    tabs: ITab[];
}

const SubNavImpl: FC<Props> = ({ noun, tabs }) => {
    const location = useLocation();
    const isAdminPage = useMemo(() => isAdminRoute(location.pathname), [location.pathname]);
    const scrollable = useRef<HTMLDivElement>();
    const { container, moduleContext } = useServerContext();
    const { versionString } = getServerContext();
    const showCurrentContainer = hasPremiumModule(moduleContext) && !hasProductFolders(moduleContext);
    const [isScrollable, setIsScrollable] = useState<boolean>(false);
    const scroll = useCallback(offset => {
        scrollable.current.scrollLeft = scrollable.current.scrollLeft + offset;
    }, []);
    const scrollLeft = useCallback(() => scroll(-300), [scroll]);
    const scrollRight = useCallback(() => scroll(300), [scroll]);
    const onItemActivate = useCallback(
        (el: HTMLDivElement) => {
            const scrollPos = scrollable.current.getBoundingClientRect();
            const itemPos = el.getBoundingClientRect();
            const leftEdge = scrollPos.left;
            const rightEdge = scrollPos.left + scrollPos.width;
            const itemLeft = itemPos.left;
            const itemRight = itemPos.left + itemPos.width;

            if (itemLeft < leftEdge) {
                scroll(itemLeft - leftEdge);
            } else if (itemRight > rightEdge) {
                scroll(itemRight - rightEdge);
            }
        },
        [scroll]
    );
    const calculateIsScrollable = useCallback(() => {
        const el = scrollable.current;
        const hasOverflow = el.offsetWidth < el.scrollWidth;

        if (hasOverflow) {
            setIsScrollable(true);
        } else {
            setIsScrollable(false);
        }
    }, []);

    useEffect(() => {
        window.addEventListener('resize', calculateIsScrollable);
        return () => {
            window.removeEventListener('resize', calculateIsScrollable);
        };
    }, [calculateIsScrollable]);

    useEffect(() => {
        // Tabs can be loaded asynchronously, isScrollable is calculated based on the window size and size of the tabs,
        // so we want to recalculate every time the tabs change
        calculateIsScrollable();
    }, [calculateIsScrollable, tabs]);

    return (
        <nav className="navbar navbar-inverse sub-nav">
            <div className="sub-nav-container">
                {noun && <ParentNavItem to={noun.url}>{noun.text}</ParentNavItem>}

                <div className="tab-scroll-ct" ref={scrollable}>
                    <ul className="nav navbar-nav">
                        {tabs
                            .filter(tab => !!tab.text)
                            .map(({ text, url, isActive }, i) => (
                                // neither "text" nor "url" are consistently unique
                                // eslint-disable-next-line react/no-array-index-key
                                <NavItem key={i} to={url} onActive={onItemActivate} isActive={isActive}>
                                    {text}
                                </NavItem>
                            ))}
                    </ul>
                </div>

                {isScrollable && (
                    <div className="btn-group scroll-btn-group">
                        <button className="btn btn-default" onClick={scrollLeft} type="button">
                            <i className="fa fa-chevron-left" />
                        </button>
                        <button className="btn btn-default" onClick={scrollRight} type="button">
                            <i className="fa fa-chevron-right" />
                        </button>
                    </div>
                )}

                {showCurrentContainer && (
                    <div className="container-nav">
                        <span className="fa fa-folder-open" />
                        <span className="container-nav__name" title={container.name}>
                            {container.name}
                        </span>
                    </div>
                )}

                {isAdminPage && (
                    <div className="lk-version-nav">
                        <span className="lk-version-nav__label" title={versionString}>
                            Version: {versionString}
                        </span>
                    </div>
                )}
            </div>
        </nav>
    );
};

export const SubNav: FC = memo(() => {
    const { noun, tabs } = useSubNavTabsContext();

    if (tabs.length === 0 && noun === undefined) {
        return null;
    }

    return <SubNavImpl noun={noun} tabs={tabs} />;
});
