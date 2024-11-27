import React, { CSSProperties, FC, memo, ReactNode } from 'react';
import classNames from 'classnames';

import { Popover } from '../../Popover';
import { OverlayTrigger } from '../../OverlayTrigger';

import { createHorizontalBarCountLegendData, HorizontalBarData } from './utils';
import { ItemsLegend } from './ItemsLegend';

const DEFAULT_EMPTY_TEXT = 'No data available.';

interface Props {
    data: HorizontalBarData[];
    emptySectionTextPlural?: string;
    emptySectionTextSingular?: string;
    emptyText?: string;
    showSummaryTooltip?: boolean;
    subtitle?: React.ReactNode;
    title?: string;
}

export const HorizontalBarSection: FC<Props> = memo(props => {
    const {
        subtitle,
        title,
        data,
        emptyText,
        showSummaryTooltip,
        emptySectionTextSingular = 'Space Available',
        emptySectionTextPlural = 'Spaces Available',
    } = props;
    let horizontalBars: ReactNode = <div className="horizontal-bar--empty-text">{emptyText ?? DEFAULT_EMPTY_TEXT}</div>;

    if (data?.length) {
        let summaryLegendData = null;
        if (showSummaryTooltip) {
            summaryLegendData = createHorizontalBarCountLegendData(
                data,
                emptySectionTextSingular,
                emptySectionTextPlural
            );
        }

        horizontalBars = data
            .filter(row => row.percent > 0)
            .map((row, index) => {
                const style: CSSProperties = { width: row.percent + '%', background: row.backgroundColor };
                const section = (
                    <div
                        data-title={row.title}
                        className={classNames('horizontal-bar-part', row.className, {
                            'horizontal-bar--linked': !!row.href,
                            'horizontal-bar--open': !row.filled || !row.backgroundColor,
                        })}
                    >
                        {row.href && (
                            <a href={row.href} className="horizontal-bar--link">
                                &nbsp;
                            </a>
                        )}
                    </div>
                );

                const overlay = (
                    <Popover id="grid-cell-popover" placement="top" isFlexPlacement>
                        {showSummaryTooltip ? (
                            <ItemsLegend legendData={summaryLegendData} activeIndex={index} />
                        ) : (
                            row.title
                        )}
                    </Popover>
                );

                return (
                    <OverlayTrigger key={index} id={index.toString()} overlay={overlay} style={style}>
                        {section}
                    </OverlayTrigger>
                );
            });
    }

    return (
        <div className="horizontal-bar-section">
            {title && <div className="horizontal-bar--title">{title}</div>}
            <div className="horizontal-bars">{horizontalBars}</div>
            {subtitle && <div className="horizontal-bar--subtitle">{subtitle}</div>}
        </div>
    );
});
