import { ISelectRowsResult, processChartData } from '../../..';
import AssayRunCountsRowsJson from '../../../test/data/AssayRunCounts-getQueryRows.json';

import { getBarChartPlotConfig } from './utils';

beforeEach(() => {
    LABKEY.vis = {};
});

describe('processChartData', () => {
    const response = {
        key: '0',
        models: {0: AssayRunCountsRowsJson},
    } as ISelectRowsResult;

    test('with data', () => {
        const {data} = processChartData(response, {countPath: ['TotalCount', 'value']});
        expect(data.length).toBe(4);
        expect(data[0].x).toBe('GPAT 1');
        expect(data[0].xSub).toBeUndefined();
        expect(data[0].count).toBe(6);
        expect(data[3].x).toBe('GPAT 25 with a longer name then the rest');
        expect(data[3].xSub).toBeUndefined();
        expect(data[3].count).toBe(1);
    });

    test('without data', () => {
        const {data} = processChartData(response, {countPath: ['TodayCount', 'value']});
        expect(data.length).toBe(0);
    });

    test('with alternate label field', () => {
        const {data} = processChartData(response, {
            countPath: ['TotalCount', 'value'],
            namePath: ['RowId', 'value'],
        });
        expect(data.length).toBe(4);
        expect(data[0].x).toBe(5051);
    });

    test('barFillColors without colorPath', () => {
        const {barFillColors} = processChartData(response, {countPath: ['TodayCount', 'value']});
        expect(barFillColors).toBe(undefined);
    });

    test('barFillColors with colorPath', () => {
        const {barFillColors} = processChartData(response, {
            colorPath: ['Color', 'value'],
            countPath: ['TotalCount', 'value'],
            namePath: ['Name', 'value'],
        });
        expect(Object.keys(barFillColors).length).toBe(4);
        expect(barFillColors['GPAT 1']).toBe('#ffffff');
        expect(barFillColors['GPAT 10']).toBe('#dddddd');
    });

    test('groupPath', () => {
        const { data, barFillColors } = processChartData(response, {
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
        expect(config.margins.top).toBe(50);
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
        expect(config.margins.top).toBe(50);
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
