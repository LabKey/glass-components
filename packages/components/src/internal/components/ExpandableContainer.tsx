/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React, { FC, memo, useCallback, PropsWithChildren, useState, useEffect, useMemo } from 'react';

import classNames from 'classnames';

import { SVGIcon } from './base/SVGIcon';

interface Props extends PropsWithChildren {
    clause: React.ReactNode;
    containerCls?: string;
    iconFaCls?: string;
    iconSrc?: string;
    initExpanded?: boolean;
    isExpandable: boolean;
    links: React.ReactNode;
    noIcon?: boolean;
    onClick?: (show: boolean) => void;
    rowCls?: string;
    useGreyTheme?: boolean;
}

export const ExpandableContainer: FC<Props> = memo(props => {
    const {
        clause,
        containerCls,
        iconFaCls,
        iconSrc,
        initExpanded,
        isExpandable,
        links,
        noIcon,
        onClick,
        rowCls = 'row',
        useGreyTheme,
        children,
    } = props;
    const [visible, setVisible] = useState<boolean>(false);
    const [isHover, setIsHover] = useState<boolean>(false);

    useEffect(() => {
        setVisible(!!initExpanded);
    }, [initExpanded]);

    const hasOnClick = useMemo(() => {
        return onClick !== undefined;
    }, [onClick]);

    const containerDivCls = useMemo(() => {
        return useGreyTheme ? 'container-expandable-grey' : 'container-expandable-blue';
    }, [useGreyTheme]);

    const handleClick = useCallback(() => {
        if (!isExpandable) {
            onClick?.(false);
            return;
        }

        setVisible(prevState => {
            onClick?.(!prevState);
            return !prevState;
        });
    }, [isExpandable, onClick, setVisible]);

    const handleMouseEnter = useCallback(() => {
        setIsHover(true);
    }, [setIsHover]);

    const handleMouseLeave = useCallback(() => {
        setIsHover(false);
    }, [setIsHover]);

    return (
        <div className={classNames(rowCls, 'container-expandable', { disabled: !isExpandable })}>
            <div
                onClick={hasOnClick || isExpandable ? handleClick : undefined}
                onMouseEnter={isExpandable ? handleMouseEnter : undefined}
                onMouseLeave={isExpandable ? handleMouseLeave : undefined}
                className={classNames(
                    containerCls,
                    containerDivCls,
                    { 'container-expandable-child__inactive': visible },
                    { 'container-expandable__active': isHover || visible },
                    { 'container-expandable__inactive': !isHover && !visible }
                )}
            >
                {!noIcon && (
                    <i className="container-expandable-child__img">
                        {iconFaCls ? (
                            <i style={{ padding: '5px' }} className={'fa fa-' + iconFaCls} />
                        ) : (
                            <SVGIcon iconSrc={iconSrc} isActive={isHover} height="50px" width="50px" />
                        )}
                    </i>
                )}
                <div
                    onClick={hasOnClick || isExpandable ? handleClick : undefined}
                    className={classNames('pull-right', 'container-expandable-child__chevron', {
                        'text-muted': !isExpandable,
                    })}
                >
                    <i
                        onClick={hasOnClick || isExpandable ? handleClick : undefined}
                        className={classNames('fa', {
                            'fa-chevron-down': visible,
                            'fa-chevron-right': !visible,
                        })}
                    />
                </div>
                <div className="container-expandable-heading">
                    {clause}
                    {links}
                </div>
            </div>
            {visible && children}
        </div>
    );
});
