/*
 * Copyright (c) 2016-2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import React from 'react';
import classNames from 'classnames';

import { SVGIcon } from './base/SVGIcon';

interface Props {
    clause: React.ReactNode;
    links: React.ReactNode;
    iconSrc?: string;
    iconFaCls?: string;
    isExpandable: boolean;
    initExpanded?: boolean;
    onClick?: (show: boolean) => void;
    containerCls?: string;
    useGreyTheme?: boolean;
}

interface State {
    isHover?: boolean;
    visible?: boolean;
}

export class ExpandableContainer extends React.PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            visible: props.initExpanded || false,
            isHover: false,
        };
    }

    handleClick = (): void => {
        if (!this.props.isExpandable) {
            this.props.onClick?.(false);
            return;
        }

        this.setState(
            state => ({
                visible: !state.visible,
            }),
            () => {
                this.props.onClick?.(this.state.visible);
            }
        );
    };

    handleMouseEnter = (): void => {
        this.setState(() => ({ isHover: true }));
    };

    handleMouseLeave = (): void => {
        this.setState(() => ({ isHover: false }));
    };

    render() {
        const { children, iconSrc, iconFaCls, isExpandable, clause, links, containerCls, useGreyTheme } = this.props;
        const { visible, isHover } = this.state;
        const hasOnClick = this.props.onClick !== undefined;
        const containerDivCls = useGreyTheme ? 'container-expandable-grey' : 'container-expandable-blue';

        return (
            <div className={classNames('row', 'container-expandable', { disabled: !isExpandable })}>
                <div
                    onClick={(hasOnClick || isExpandable) ? this.handleClick : undefined}
                    onMouseEnter={isExpandable ? this.handleMouseEnter : undefined}
                    onMouseLeave={isExpandable ? this.handleMouseLeave : undefined}
                    className={classNames(
                        containerCls,
                        containerDivCls,
                        { 'container-expandable-child__inactive': visible },
                        { 'container-expandable__active': isHover || visible },
                        { 'container-expandable__inactive': !isHover && !visible }
                    )}
                >
                    <i className="container-expandable-child__img">
                        {iconFaCls ? (
                            <i style={{ padding: '5px' }} className={'fa fa-' + iconFaCls} />
                        ) : (
                            <SVGIcon iconSrc={iconSrc} isActive={isHover} height="50px" width="50px" />
                        )}
                    </i>
                    <div
                        onClick={(hasOnClick || isExpandable) ? this.handleClick : undefined}
                        className={classNames('pull-right', 'container-expandable-child__chevron', {
                            'text-muted': !isExpandable,
                        })}
                    >
                        <i
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
    }
}
