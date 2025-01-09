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
import React, { FC, memo, PropsWithChildren, useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

import { AppURL } from '../../url/AppURL';

interface NavItemProps extends PropsWithChildren {
    isActive?: boolean;
    onActive?: (activeEl: HTMLElement) => void;
    to?: string | AppURL;
}

export const NavItem: FC<NavItemProps> = memo(({ children, onActive, to, isActive }) => {
    const location = useLocation();
    const href = to instanceof AppURL ? to.toString() : to;
    const itemRef = useRef<HTMLLIElement>();
    const [active, setActive] = useState<boolean>(false);

    useEffect(() => {
        if (to && location) {
            const toString = to.toString();
            const paramIndex = toString.indexOf('?');
            const _isActive =
                isActive !== undefined
                    ? isActive
                    : location.pathname.toLowerCase() ===
                      toString.substring(0, paramIndex < 0 ? toString.length : paramIndex).toLowerCase();
            setActive(_isActive);

            if (_isActive) {
                onActive?.(itemRef.current);
            }
        } else {
            setActive(false);
        }
    }, [isActive, location, to]);

    return (
        <li className={active ? 'active' : null} ref={itemRef}>
            <Link to={href}>{children}</Link>
        </li>
    );
});

export const ParentNavItem: FC<NavItemProps> = memo(({ children, to }) => {
    const href = to instanceof AppURL ? to.toString() : to;

    return (
        <div className="parent-nav">
            <ul className="nav navbar-nav">
                <li>
                    <Link to={href}>
                        <i className="fa fa-chevron-left" />
                        &nbsp;
                        {children}
                    </Link>
                </li>
            </ul>
        </div>
    );
});
