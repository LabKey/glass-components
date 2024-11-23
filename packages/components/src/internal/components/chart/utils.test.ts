import { Map } from 'immutable';
import AssayRunCountsRowsJson from '../../../test/data/AssayRunCounts-getQueryRows.json';

import { AppURL } from '../../url/AppURL';

import {
    getBarChartPlotConfig,
    createPercentageBarData,
    createHorizontalBarLegendData,
    processChartData,
    createHorizontalBarCountLegendData,
} from './utils';

beforeEach(() => {
    LABKEY.vis = {};
});

describe('processChartData', () => {
    const rows = AssayRunCountsRowsJson;

    test('with data', () => {
        const { data } = processChartData(rows, { countPath: ['TotalCount', 'value'] });
        expect(data.length).toBe(4);
        expect(data[0].x).toBe('GPAT 1');
        expect(data[0].xSub).toBeUndefined();
        expect(data[0].count).toBe(6);
        expect(data[3].x).toBe('GPAT 25 with a longer name then the rest');
        expect(data[3].xSub).toBeUndefined();
        expect(data[3].count).toBe(1);
    });

    test('without data', () => {
        const { data } = processChartData(rows, { countPath: ['TodayCount', 'value'] });
        expect(data.length).toBe(0);
    });

    test('with alternate label field', () => {
        const { data } = processChartData(rows, {
            countPath: ['TotalCount', 'value'],
            namePath: ['RowId', 'value'],
        });
        expect(data.length).toBe(4);
        expect(data[0].x).toBe(5051);
    });

    test('barFillColors without colorPath', () => {
        const { barFillColors } = processChartData(rows, { countPath: ['TodayCount', 'value'] });
        expect(barFillColors).toBe(undefined);
    });

    test('barFillColors with colorPath', () => {
        const { barFillColors } = processChartData(rows, {
            colorPath: ['Color', 'value'],
            countPath: ['TotalCount', 'value'],
            namePath: ['Name', 'value'],
        });
        expect(Object.keys(barFillColors).length).toBe(4);
        expect(barFillColors['GPAT 1']).toBe('#ffffff');
        expect(barFillColors['GPAT 10']).toBe('#dddddd');
    });

    test('groupPath', () => {
        const { data, barFillColors } = processChartData(rows, {
            countPath: ['TotalCount', 'value'],
            colorPath: ['Color', 'value'],
            groupPath: ['Color', 'value'],
        });
        expect(data.length).toBe(4);
        expect(data[0].x).toBe('GPAT 1');
        expect(data[0].xSub).toBe('#ffffff');
        expect(data[0].count).toBe(6);
        expect(data[3].x).toBe('GPAT 25 with a longer name then the rest');
        expect(data[3].xSub).toBe('#cccccc');
        expect(data[3].count).toBe(1);
        expect(Object.keys(barFillColors).length).toBe(4);
        expect(barFillColors['#ffffff']).toBe('#ffffff');
        expect(barFillColors['#dddddd']).toBe('#dddddd');
    });
});

describe('getBarChartPlotConfig', () => {
    test('default props', () => {
        const config = getBarChartPlotConfig({
            renderTo: 'renderToTest',
            title: 'titleTest',
            width: 100,
            data: [],
        });

        expect(JSON.stringify(Object.keys(config.aes))).toBe('["x","y"]');
        expect(JSON.stringify(Object.keys(config.scales))).toBe('["y"]');
        expect(config.height).toBe(undefined);
        expect(config.width).toBe(100);
        expect(config.margins.top).toBe(25);
        expect(config.margins.right).toBe(undefined);
        expect(config.options.clickFn).toBe(undefined);
        expect(config.options.color).toBe(undefined);
        expect(config.options.fill).toBe(undefined);
        expect(config.options.stacked).toBe(undefined);
        expect(config.legendPos).toBe('none');
        expect(config.legendData).toBe(undefined);
    });

    test('custom props', () => {
        const config = getBarChartPlotConfig({
            renderTo: 'renderToTest',
            title: 'titleTest',
            width: 100,
            data: [],
            height: 100,
            defaultFillColor: 'red',
            defaultBorderColor: 'blue',
            barFillColors: { test1: 'green' },
            onClick: jest.fn,
            grouped: true,
        });

        expect(JSON.stringify(Object.keys(config.aes))).toBe('["x","y","color","xSub"]');
        expect(JSON.stringify(Object.keys(config.scales))).toBe('["y","color","x","xSub"]');
        expect(config.height).toBe(100);
        expect(config.width).toBe(100);
        expect(config.margins.top).toBe(25);
        expect(config.margins.right).toBe(125);
        expect(config.options.clickFn).toBe(jest.fn);
        expect(config.options.color).toBe('blue');
        expect(config.options.fill).toBe('red');
        expect(config.options.stacked).toBe(true);
        expect(config.legendPos).toBe('right');
        expect(config.legendData).toBeDefined();
        expect(config.scales.color.scale('test1')).toBe('green');
        expect(config.scales.color.scale('test2')).toBe('red');
    });
});

describe('createHorizontalBarLegendData', () => {
    test('all different', () => {
        expect(
            createHorizontalBarLegendData([
                {
                    title: "22 'Sample Type 1' samples",
                    name: 'Sample Type 1',
                    count: 22,
                    totalCount: 82,
                    percent: 26.82926829268293,
                    backgroundColor: 'blue',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1',
                    filled: true,
                },
                {
                    title: "20 'Sample Type 2' samples",
                    name: 'Sample Type 2',
                    count: 20,
                    totalCount: 82,
                    percent: 24.390243902439025,
                    backgroundColor: 'green',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 2',
                    filled: true,
                },
                {
                    title: "10 'Sample Type 3' samples",
                    name: 'Sample Type 3',
                    count: 10,
                    totalCount: 82,
                    percent: 12.195121951219512,
                    backgroundColor: 'red',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 3',
                    filled: true,
                },
                {
                    title: "30 'Sample Type 4' samples",
                    name: 'Sample Type 4',
                    count: 30,
                    totalCount: 82,
                    percent: 36.58536585365854,
                    backgroundColor: 'orange',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 4',
                    filled: true,
                },
            ])
        ).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 1',
            },
            {
                circleColor: 'green',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 2',
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 3',
            },
            {
                circleColor: 'orange',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 4',
            },
        ]);
    });

    test('some colors the same', () => {
        expect(
            createHorizontalBarLegendData([
                {
                    title: "22 'Sample Type 1' samples",
                    name: 'Sample Type 1',
                    count: 22,
                    totalCount: 82,
                    percent: 26.82926829268293,
                    backgroundColor: 'blue',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1',
                    filled: true,
                },
                {
                    title: "20 'Sample Type 2' samples",
                    name: 'Sample Type 2',
                    count: 20,
                    totalCount: 82,
                    percent: 24.390243902439025,
                    backgroundColor: 'blue',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 2',
                    filled: true,
                },
                {
                    title: "10 'Sample Type 3' samples",
                    name: 'Sample Type 3',
                    count: 10,
                    totalCount: 82,
                    percent: 12.195121951219512,
                    backgroundColor: 'red',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 3',
                    filled: true,
                },
                {
                    title: "30 'Sample Type 4' samples",
                    name: 'Sample Type 4',
                    count: 30,
                    totalCount: 82,
                    percent: 36.58536585365854,
                    backgroundColor: 'blue',
                    href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 4',
                    filled: true,
                },
            ])
        ).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 1, Sample Type 2, Sample Type 4',
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 3',
            },
        ]);
    });

    test('repeated types', () => {
        const data = [
            {
                title: "22 'Sample Type 1' samples",
                name: 'Sample Type 1',
                count: 22,
                totalCount: 82,
                percent: 26.82926829268293,
                backgroundColor: 'blue',
                href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1',
                filled: true,
            },
            {
                title: "20 'Sample Type 1' samples",
                name: 'Sample Type 1',
                count: 20,
                totalCount: 82,
                percent: 24.390243902439025,
                backgroundColor: 'blue',
                href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1',
                filled: true,
            },
            {
                title: "10 'Sample Type 2' samples",
                name: 'Sample Type 2',
                count: 10,
                totalCount: 82,
                percent: 12.195121951219512,
                backgroundColor: 'red',
                href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 2',
                filled: true,
            },
            {
                title: "30 'Sample Type 3' samples",
                name: 'Sample Type 3',
                count: 30,
                totalCount: 82,
                percent: 36.58536585365854,
                backgroundColor: 'red',
                href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 3',
                filled: true,
            },
        ];
        expect(
            createHorizontalBarLegendData(data)
        ).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 1',
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 2, Sample Type 3',
            },
        ]);
        expect(
            createHorizontalBarCountLegendData(data, 'Empty Space', 'Empty Spaces')
        ).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                data: Map.of('value', '22', 'url', '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1'),
                legendLabel: 'Sample Type 1',
            },
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                data: Map.of('value', '20', 'url', '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1'),
                legendLabel: 'Sample Type 1',
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                data: Map.of('value', '10', 'url', '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 2'),
                legendLabel: 'Sample Type 2',
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                data: Map.of('value', '30', 'url', '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 3'),
                legendLabel: 'Sample Type 3',
            },
        ]);
    });

    test('only filled', () => {
        const data = [
            {
                title: "22 'Sample Type 1' samples",
                name: 'Sample Type 1',
                count: 22,
                totalCount: 82,
                percent: 26.82926829268293,
                backgroundColor: 'blue',
                href: '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1',
                filled: true,
            },
            {
                title: '6000 spaces available',
                count: 6000,
                totalCount: 82,
                percent: 73.17073,
                backgroundColor: undefined,
                filled: false,
            },
        ];
        expect(
            createHorizontalBarLegendData(data)
        ).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 1',
            },
        ]);
        expect(
            createHorizontalBarCountLegendData(data, 'space', 'spaces')
        ).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                data: Map.of('value', '22', 'url', '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1'),
                legendLabel: 'Sample Type 1',
            },
            {
                circleColor: 'fff',
                backgroundColor: 'none',
                data: Map.of('value', "6,000"),
                legendLabel: 'spaces',
            }
        ]);
    });
});

describe('createPercentageBarData', () => {
    const ROW = {
        Total: { value: 10 },
        InStorage: { value: 8 },
    };
    const IN_STORAGE_BAR_CONFIG = {
        queryKey: 'InStorage',
        name: 'InStorage',
        label: 'In Storage',
        className: 'test-class',
        appURL: AppURL.create('TEST'),
        filled: true,
    };

    test('default props', () => {
        const barData = createPercentageBarData(ROW, 'Samples', 'Not In Storage', 'Total', [IN_STORAGE_BAR_CONFIG]);

        expect(barData.data).toStrictEqual([
            {
                name: 'InStorage',
                title: '8 of 10 samples are in storage',
                className: 'test-class',
                count: 8,
                totalCount: 10,
                percent: 80,
                href: '#/TEST',
                filled: true,
            },
            {
                name: 'Available',
                title: '2 of 10 samples are not in storage',
                count: 2,
                totalCount: 10,
                percent: 20,
                filled: false,
            },
        ]);
        expect(barData.subtitle).toBe('2 of 10 samples are not in storage (20%)');
    });

    test('without unusedLabel', () => {
        const barData = createPercentageBarData(ROW, 'Samples', undefined, 'Total', [IN_STORAGE_BAR_CONFIG]);

        expect(barData.data).toStrictEqual([
            {
                name: 'InStorage',
                title: '8 of 10 samples are in storage',
                className: 'test-class',
                count: 8,
                totalCount: 10,
                percent: 80,
                href: '#/TEST',
                filled: true,
            },
        ]);
        expect(barData.subtitle).toBe(undefined);
    });

    test('totalCount zero', () => {
        const EMPTY_ROW = {
            Total: { value: 0 },
            InStorage: { value: 0 },
        };
        const barData = createPercentageBarData(EMPTY_ROW, 'Samples', 'Not in storage', 'Total', [
            IN_STORAGE_BAR_CONFIG,
        ]);

        expect(barData.data).toStrictEqual([]);
        expect(barData.subtitle).toBe(undefined);
    });

    test('useForSubtitle and not filled', () => {
        const IN_STORAGE_BAR_CONFIG_2 = {
            queryKey: 'InStorage',
            name: 'InStorage',
            label: 'In Storage',
            className: 'test-class',
            appURL: AppURL.create('TEST'),
            filled: false,
            useForSubtitle: true,
        };
        const barData = createPercentageBarData(ROW, 'Samples', 'Not In Storage', 'Total', [IN_STORAGE_BAR_CONFIG_2]);

        expect(barData.data).toStrictEqual([
            {
                name: 'InStorage',
                title: '8 of 10 samples are in storage',
                className: 'test-class',
                count: 8,
                totalCount: 10,
                percent: 80,
                href: '#/TEST',
                filled: false,
            },
            {
                name: 'Available',
                title: '2 of 10 samples are not in storage',
                count: 2,
                totalCount: 10,
                percent: 20,
                filled: false,
            },
        ]);
        expect(barData.subtitle).toBe('8 of 10 samples are in storage (80%)');
    });

    test('baseAppURL and urlFilterKey', () => {
        const IN_STORAGE_BAR_CONFIG_2 = {
            queryKey: 'InStorage',
            name: 'InStorage',
            label: 'In Storage',
            className: 'test-class',
            filled: true,
        };
        const barData = createPercentageBarData(
            ROW,
            'Samples',
            undefined,
            'Total',
            [IN_STORAGE_BAR_CONFIG_2],
            AppURL.create('BASE'),
            'FilterKey'
        );

        expect(barData.data).toStrictEqual([
            {
                name: 'InStorage',
                title: '8 of 10 samples are in storage',
                className: 'test-class',
                count: 8,
                totalCount: 10,
                percent: 80,
                href: '#/BASE?query.FilterKey~eq=In Storage',
                filled: true,
            },
        ]);
        expect(barData.subtitle).toBe(undefined);
    });
});
