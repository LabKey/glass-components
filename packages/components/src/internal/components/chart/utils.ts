import { Map } from 'immutable';

import { Filter, getServerContext } from '@labkey/api';

import { naturalSort } from '../../../public/sort';
import { AppURL } from '../../url/AppURL';
import { caseInsensitive } from '../../util/utils';

import { Row } from '../../query/selectRows';

import { BarChartData } from './models';

interface ChartDataProps {
    barFillColors: Record<string, string>;
    data: BarChartData[];
}

interface ProcessChartOptions {
    colorPath?: string[];
    countPath?: string[];
    groupPath?: string[];
    idPath?: string[];
    namePath?: string[];
}

function getChartRowData(row: Row, path: string[]): any {
    const first = caseInsensitive(row, path[0]);
    if (path.length > 1 && !!first) {
        return caseInsensitive(first, path[1]);
    }
    return first;
}

export function processChartData(rows: Row[], options?: ProcessChartOptions): ChartDataProps {
    const countPath = options?.countPath ?? ['count', 'value'];
    const colorPath = options?.colorPath;
    const idPath = options?.idPath ?? ['RowId', 'value'];
    const namePath = options?.namePath ?? ['Name', 'value'];
    const groupPath = options?.groupPath;

    const data = rows
        .filter(row => getChartRowData(row, countPath) > 0)
        .map(row => ({
            count: getChartRowData(row, countPath),
            id: getChartRowData(row, idPath),
            x: getChartRowData(row, namePath),
            xSub: groupPath ? getChartRowData(row, groupPath) : undefined,
        }));
    data.sort((a, b) => {
        return naturalSort(a.x, b.x);
    });

    let barFillColors;
    if (colorPath) {
        barFillColors = {};
        rows.forEach(row => {
            barFillColors[getChartRowData(row, groupPath ?? namePath)] = getChartRowData(row, colorPath);
        });
    }

    return { barFillColors, data };
}

interface PercentageBarProps {
    appURL?: AppURL;
    className?: string;
    filled?: boolean;
    label: string;
    name: string;
    queryKey: string;
    useForSubtitle?: boolean;
}

export function createPercentageBarData(
    row: Record<string, any>,
    itemNounPlural: string,
    unusedLabel: string,
    totalCountKey: string,
    percentageBars: PercentageBarProps[],
    baseAppURL?: AppURL,
    urlFilterKey?: string
): { data: HorizontalBarData[]; subtitle: string } {
    const totalCount = caseInsensitive(row, totalCountKey)?.value ?? 0;
    let unusedCount = totalCount;
    const data = [];
    let subtitle;
    if (totalCount > 0) {
        percentageBars.forEach(percentageBar => {
            const itemCount = caseInsensitive(row, percentageBar.queryKey)?.value ?? 0;
            unusedCount = unusedCount - itemCount;
            const itemPct = (itemCount / totalCount) * 100;
            const title = `${itemCount.toLocaleString()} of ${totalCount.toLocaleString()} ${itemNounPlural.toLowerCase()} are ${percentageBar.label.toLowerCase()}`;

            data.push({
                title,
                name: percentageBar.name,
                className: percentageBar.className,
                count: itemCount,
                totalCount,
                percent: itemPct,
                href:
                    percentageBar.appURL?.toHref() ??
                    baseAppURL?.addFilters(Filter.create(urlFilterKey, percentageBar.label)).toHref(),
                filled: percentageBar.filled ?? true,
            });

            if (percentageBar.useForSubtitle) {
                subtitle = `${title} (${itemPct > 0 && itemPct < 1 ? '< 1' : Math.trunc(itemPct)}%)`;
            }
        });

        if (unusedLabel) {
            const unusedPct = (unusedCount / totalCount) * 100;
            const unusedTitle = `${unusedCount.toLocaleString()} of ${totalCount.toLocaleString()} ${itemNounPlural.toLowerCase()} are ${unusedLabel.toLowerCase()}`;
            data.push({
                title: unusedTitle,
                name: 'Available',
                count: unusedCount,
                totalCount,
                percent: unusedPct,
                filled: false,
            });

            if (!subtitle) {
                subtitle = `${unusedTitle} (${unusedPct > 0 && unusedPct < 1 ? '< 1' : Math.trunc(unusedPct)}%)`;
            }
        }
    }

    return { data, subtitle };
}

export interface HorizontalBarData {
    backgroundColor?: string;
    className?: string;
    count: number;
    dataLink?: string;
    filled: boolean;
    href?: string;
    name?: string;
    percent: number;
    title: string;
    totalCount: number;
}

export interface HorizontalBarLegendData {
    backgroundColor: string;
    borderColor?: string;
    circleColor: string;
    data?: Map<any, any>;
    expired?: boolean;
    legendLabel: string;
    locked?: boolean;
}

export function createHorizontalBarLegendData(data: HorizontalBarData[]): HorizontalBarLegendData[] {
    const legendMap = {};
    data.forEach(row => {
        if (row.filled && row.totalCount > 0) {
            const labels = legendMap[row.backgroundColor] || [];
            if (labels.indexOf(row.name) == -1) {
                labels.push(row.name);
                legendMap[row.backgroundColor] = labels;
            }
        }
    });
    const legendData = [];
    Object.keys(legendMap).forEach(key => {
        legendData.push({
            circleColor: key,
            backgroundColor: 'none',
            legendLabel: legendMap[key].join(', '),
        });
    });
    return legendData;
}

export function createHorizontalBarCountLegendData(
    data: HorizontalBarData[],
    emptyTextSingular: string,
    emptyTextPlural: string
): HorizontalBarLegendData[] {
    const legendData = [];
    data.forEach(row => {
        if (row.count > 0) {
            let data = Map.of('value', row.count, 'url', row.href);
            let legendLabel = row.name;
            if (!row.filled) {
                data = Map.of('value', row.count);
                legendLabel = row.count > 1 ? emptyTextPlural : emptyTextSingular;
            }
            legendData.push({
                circleColor: row.backgroundColor ?? 'fff',
                backgroundColor: 'none',
                legendLabel,
                data,
            });
        }
    });
    return legendData;
}

interface BarChartPlotConfigProps {
    barFillColors?: Record<string, any>;
    data: any[];
    defaultBorderColor?: string;
    defaultFillColor?: string;
    grouped?: boolean;
    height?: number;
    onClick?: (evt: any, row: any) => void;
    renderTo: string;
    title: string;
    width: number;
}

export function getBarChartPlotConfig(props: BarChartPlotConfigProps): Record<string, any> {
    const vis = getServerContext().vis;
    const { renderTo, data, onClick, height, width, defaultFillColor, defaultBorderColor, barFillColors, grouped } =
        props;

    let marginRight,
        marginBottom = 25,
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

    const xLabels = new Set(data.map(d => d.x));
    if (xLabels.size > 1) {
        const plotWidth = width - (marginRight ?? 0);
        const maxLength = Math.max(...Array.from(xLabels).map(text => text.length));

        if (xLabels.size * maxLength * 4 > plotWidth) {
            marginBottom = Math.min(125, maxLength * 3);
        }
    }

    return {
        renderTo,
        rendererType: 'd3',
        width,
        height,
        margins: {
            top: 25,
            right: marginRight,
            bottom: marginBottom,
        },
        labels: {
            yLeft: { value: 'Count' },
        },
        gridLinesVisible: 'x',
        options: {
            color: defaultBorderColor,
            fill: defaultFillColor,
            showValues: true,
            stacked: grouped,
            clickFn: onClick,
            hoverFn: function (row) {
                return (
                    (grouped ? row.subLabel + '\n' : '') +
                    (row.label ? row.label + '\n' : '') +
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
