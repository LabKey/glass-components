import React from 'react';

import { LABKEY_VIS } from '../../constants';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { ViewInfo } from '../../ViewInfo';

import { getSelectOptions } from './ChartFieldOption';
import { ChartFieldInfo, ChartTypeInfo } from './ChartBuilderModal';

LABKEY_VIS = {
    GenericChartHelper: {
        getAllowableTypes: () => ['int', 'double'],
    },
};

const BAR_CHART_TYPE = {
    name: 'bar_chart',
    fields: [
        { name: 'x', label: 'X Axis', required: true },
        { name: 'y', label: 'Y Axis', required: false },
    ],
    title: 'Bar',
} as ChartTypeInfo;

const columns = [
    { fieldKey: 'intCol', jsonType: 'int' },
    { fieldKey: 'doubleCol', jsonType: 'double' },
    { fieldKey: 'textCol', jsonType: 'string' },
];

const model = makeTestQueryModel(
    new SchemaQuery('schema', 'query', 'view'),
    QueryInfo.fromJsonForTests(
        {
            columns,
            name: 'query',
            schemaName: 'schema',
            views: [
                { columns, name: ViewInfo.DEFAULT_NAME },
                { columns, name: 'view' },
            ],
        },
        true
    ),
    [],
    0
);

describe('getSelectOptions', () => {
    test('hasMatchingType', () => {
        LABKEY_VIS.GenericChartHelper = {
            ...LABKEY_VIS.GenericChartHelper,
            isMeasureDimensionMatch: () => false,
        };
        const field = { name: 'x' } as ChartFieldInfo;
        const options = getSelectOptions(model, BAR_CHART_TYPE, field);
        expect(options.length).toBe(2);
    });

    test('isMeasureDimensionMatch', () => {
        LABKEY_VIS.GenericChartHelper = {
            ...LABKEY_VIS.GenericChartHelper,
            isMeasureDimensionMatch: () => true,
        };
        const field = { name: 'x' } as ChartFieldInfo;
        const options = getSelectOptions(model, BAR_CHART_TYPE, field);
        expect(options.length).toBe(3);
    });
});
