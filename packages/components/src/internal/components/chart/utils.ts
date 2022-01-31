import { fromJS } from 'immutable';
import { Filter, getServerContext } from '@labkey/api';

import { AppURL, caseInsensitive, ISelectRowsResult, naturalSort } from '../../..';

import { HorizontalBarData } from './HorizontalBarSection';
import { ChartData } from './types';

interface ChartDataProps {
    barFillColors: Record<string, string>;
    data: ChartData[];
}

interface ProcessChartOptions {
    colorPath?: string[];
    countPath?: string[];
    idPath?: string[];
    namePath?: string[];
    groupPath?: string[];
}

export function processChartData(response: ISelectRowsResult, options?: ProcessChartOptions): ChartDataProps {
    const countPath = options?.countPath ?? ['count', 'value'];
    const colorPath = options?.colorPath;
    const idPath = options?.idPath ?? ['RowId', 'value'];
    const namePath = options?.namePath ?? ['Name', 'value'];
    const groupPath = options?.groupPath;

    const rows = fromJS(response.models[response.key]);

    const data = rows
        .filter(row => row.getIn(countPath) > 0)
        .map(row => ({
            count: row.getIn(countPath),
            id: row.getIn(idPath),
            x: row.getIn(namePath),
            xSub: groupPath ? row.getIn(groupPath) : undefined,
        }))
        .sortBy(row => row.x, naturalSort)
        .toArray();

    let barFillColors;
    if (colorPath) {
        barFillColors = {};
        rows.forEach(row => {
            barFillColors[row.getIn(groupPath ?? namePath)] = row.getIn(colorPath);
        });
    }

    return { barFillColors, data };
}

interface PercentageBarProps {
    queryKey: string,
    name: string;
    label: string,
    useForSubtitle?: boolean,
    className?: string,
    appURL?: AppURL,
    filled?: boolean,
}

export function createPercentageBarData(
    row: Record<string, any>,
    itemNounPlural: string,
    unusedLabel: string,
    totalCountKey: string,
    percentageBars: PercentageBarProps[],
    baseAppURL?: AppURL,
    urlFilterKey?: string
) : { data: HorizontalBarData[], subtitle: string } {
    const totalCount = caseInsensitive(row, totalCountKey)?.value ?? 0;
    let unusedCount = totalCount;
    const data = [];
    let subtitle;
    if (totalCount > 0) {
        percentageBars.forEach(percentageBar => {
            const itemCount = caseInsensitive(row, percentageBar.queryKey)?.value ?? 0;
            unusedCount = unusedCount - itemCount;
            const itemPct = (itemCount/totalCount) * 100;
            const title = `${itemCount.toLocaleString()} of ${totalCount.toLocaleString()} ${itemNounPlural.toLowerCase()} are ${percentageBar.label.toLowerCase()}`;

            data.push({
                title,
                name: percentageBar.name,
                className: percentageBar.className,
                count: itemCount,
                totalCount: totalCount,
                percent: itemPct,
                href: percentageBar.appURL?.toHref() ?? baseAppURL?.addFilters(Filter.create(urlFilterKey, percentageBar.label)).toHref(),
                filled: percentageBar.filled ?? true,
            });

            if (percentageBar.useForSubtitle) {
                subtitle = `${title} (${(itemPct > 0 && itemPct < 1 ? '< 1' :  Math.trunc(itemPct))}%)`;
            }
        });

        if (unusedLabel) {
            const unusedPct = (unusedCount/totalCount) * 100;
            const unusedTitle = `${unusedCount.toLocaleString()} of ${totalCount.toLocaleString()} ${itemNounPlural.toLowerCase()} are ${unusedLabel.toLowerCase()}`;
            data.push({
                title: unusedTitle,
                name: 'Available',
                count: unusedCount,
                totalCount: totalCount,
                percent: unusedPct,
                filled: false,
            });

            if (!subtitle) {
                subtitle = `${unusedTitle} (${(unusedPct > 0 && unusedPct < 1 ? '< 1' :  Math.trunc(unusedPct))}%)`;
            }
        }
    }

    return { data, subtitle };
}

export interface HorizontalBarLegendData {
    circleColor: string;
    backgroundColor: string;
    legendLabel: string;
}

export function createHorizontalBarLegendData(data: HorizontalBarData[]) : HorizontalBarLegendData[] {
    let legendMap = {};
    data.forEach(row => {
        if (row.totalCount > 0) {
            let labels = legendMap[row.backgroundColor] || [];
            if (labels.indexOf(row.name) == -1) {
                labels.push(row.name);
                legendMap[row.backgroundColor] = labels;
            }
        }
    });
    let legendData = [];
    Object.keys(legendMap).forEach(key => {
        legendData.push({
            circleColor: key,
            backgroundColor: 'none',
            legendLabel: (legendMap[key].join(', '))
        })
    });
    return legendData;
}

interface BarChartPlotConfigProps {
    renderTo: string;
    title: string;
    height?: number;
    width: number;
    defaultFillColor?: string;
    defaultBorderColor?: string;
    data: any[];
    barFillColors?: Record<string, any>;
    onClick?: (evt: any, row: any) => void;
    grouped?: boolean;
}

export function getBarChartPlotConfig(props: BarChartPlotConfigProps): Record<string, any> {
    const vis = getServerContext().vis;
    const { renderTo, data, onClick, height, width, defaultFillColor, defaultBorderColor, barFillColors, grouped } =
        props;

    let marginRight,
        legendPos = 'none',
        legendData;

    const aes = {
        x: 'x',
        y: 'count',
    };
    const scales = {
        y: {
            tickFormat: function (v) {
                if (v.toString().indexOf('.') > -1) {
                    return;
                }

                return v;
            },
        },
    };

    if (barFillColors) {
        aes['color'] = 'label';

        scales['color'] = {
            scaleType: 'discrete',
            sortFn: vis.discreteSortFn,
            scale: function (key) {
                return barFillColors[key] || defaultFillColor;
            },
        };
    }

    if (grouped) {
        // in the stacked bar chart case, we actually will end up using the xSub variable for the x-axis categories
        // and the x variable for the secondary category and legend (i.e. the bar chart stacked segments)
        aes['x'] = 'xSub';
        aes['xSub'] = 'x';
        aes['color'] = 'x';

        scales['x'] = {
            scaleType: 'discrete',
            sortFn: function (a, b) {
                // reverse the sorting so that the stacked bar chart segments match the legend
                return vis.discreteSortFn(b, a);
            },
        };
        scales['xSub'] = {
            scaleType: 'discrete',
            sortFn: vis.discreteSortFn,
        };

        marginRight = Math.max(...Object.keys(barFillColors).map(text => text.length)) > 10 ? undefined : 125;
        legendPos = 'right';
        legendData = Object.keys(barFillColors)
            .sort()
            .map(text => {
                return { text, color: barFillColors[text] };
            });
    }

    return {
        renderTo,
        rendererType: 'd3',
        width,
        height,
        margins: {
            top: 50,
            right: marginRight,
        },
        labels: {
            yLeft: { value: 'Count' },
        },
        options: {
            color: defaultBorderColor,
            fill: defaultFillColor,
            showValues: true,
            stacked: grouped,
            clickFn: onClick,
            hoverFn: function (row) {
                return (
                    (grouped ? row.subLabel + '\n' : '') +
                    row.label +
                    '\n' +
                    'Count: ' +
                    row.value +
                    '\n' +
                    'Click to view details'
                );
            },
        },
        legendPos,
        legendData,
        aes,
        scales,
        data,
    };
}
