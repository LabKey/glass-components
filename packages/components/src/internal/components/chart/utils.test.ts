import { Map } from 'immutable';

import { createHorizontalBarLegendData, createHorizontalBarCountLegendData } from './utils';

beforeEach(() => {
    LABKEY.vis = {};
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
        expect(createHorizontalBarLegendData(data)).toStrictEqual([
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
        expect(createHorizontalBarCountLegendData(data, 'Empty Space', 'Empty Spaces')).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                data: Map.of(
                    'value',
                    '22',
                    'url',
                    '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1'
                ),
                legendLabel: 'Sample Type 1',
            },
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                data: Map.of(
                    'value',
                    '20',
                    'url',
                    '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1'
                ),
                legendLabel: 'Sample Type 1',
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                data: Map.of(
                    'value',
                    '10',
                    'url',
                    '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 2'
                ),
                legendLabel: 'Sample Type 2',
            },
            {
                circleColor: 'red',
                backgroundColor: 'none',
                data: Map.of(
                    'value',
                    '30',
                    'url',
                    '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 3'
                ),
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
        expect(createHorizontalBarLegendData(data)).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                legendLabel: 'Sample Type 1',
            },
        ]);
        expect(createHorizontalBarCountLegendData(data, 'space', 'spaces')).toStrictEqual([
            {
                circleColor: 'blue',
                backgroundColor: 'none',
                data: Map.of(
                    'value',
                    '22',
                    'url',
                    '#/freezers/test/storageView?query.SampleType/Name~eq=Sample Type 1'
                ),
                legendLabel: 'Sample Type 1',
            },
            {
                circleColor: 'fff',
                backgroundColor: 'none',
                data: Map.of('value', '6,000'),
                legendLabel: 'spaces',
            },
        ]);
    });
});
