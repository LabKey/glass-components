import React from 'react';

import { render } from '@testing-library/react';

import { waitFor } from '@testing-library/dom';

import { userEvent } from '@testing-library/user-event';

import { LABKEY_VIS } from '../../constants';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { ViewInfo } from '../../ViewInfo';

import { ChartFieldOption, getSelectOptions, shouldShowFieldOptions } from './ChartFieldOption';
import { ChartFieldInfo, ChartTypeInfo } from './ChartBuilderModal';

LABKEY_VIS = {
    GenericChartHelper: {
        getAllowableTypes: () => ['int', 'double'],
        isNumericType: (type: string) => type === 'int',
    },
};

const BAR_CHART_TYPE = {
    name: 'bar_chart',
} as ChartTypeInfo;
const BOX_PLOT_TYPE = {
    name: 'box_plot',
} as ChartTypeInfo;
const SCATTER_PLOT_TYPE = {
    name: 'scatter_plot',
} as ChartTypeInfo;
const LINE_PLOT_TYPE = {
    name: 'line_plot',
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

describe('shouldShowFieldOptions', () => {
    const xField = { name: 'x' } as ChartFieldInfo;
    const yField = { name: 'y' } as ChartFieldInfo;

    test('based on chart type', () => {
        expect(shouldShowFieldOptions(xField, BAR_CHART_TYPE)).toBe(false);
        expect(shouldShowFieldOptions(yField, BAR_CHART_TYPE)).toBe(false);
        expect(shouldShowFieldOptions(xField, BOX_PLOT_TYPE)).toBe(false);
        expect(shouldShowFieldOptions(yField, BOX_PLOT_TYPE)).toBe(true);
        expect(shouldShowFieldOptions(xField, SCATTER_PLOT_TYPE)).toBe(true);
        expect(shouldShowFieldOptions(yField, SCATTER_PLOT_TYPE)).toBe(true);
        expect(shouldShowFieldOptions(xField, LINE_PLOT_TYPE)).toBe(true);
        expect(shouldShowFieldOptions(yField, LINE_PLOT_TYPE)).toBe(true);
    });

    test('based on field name', () => {
        expect(shouldShowFieldOptions({ name: 'series' } as ChartFieldInfo, BAR_CHART_TYPE)).toBe(false);
        expect(shouldShowFieldOptions({ name: 'series' } as ChartFieldInfo, BOX_PLOT_TYPE)).toBe(false);
        expect(shouldShowFieldOptions({ name: 'series' } as ChartFieldInfo, SCATTER_PLOT_TYPE)).toBe(false);
        expect(shouldShowFieldOptions({ name: 'series' } as ChartFieldInfo, LINE_PLOT_TYPE)).toBe(false);
    });
});

describe('ChartFieldOption', () => {
    test('line chart for x, showFieldOptions for int', async () => {
        render(
            <ChartFieldOption
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                fieldValue={{ value: 'field1', data: { type: 'int' } }}
                model={model}
                onScaleChange={jest.fn()}
                onSelectFieldChange={jest.fn()}
                selectedType={LINE_PLOT_TYPE}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);
    });

    test('line chart for x, not showFieldOptions for date', async () => {
        render(
            <ChartFieldOption
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                fieldValue={{ value: 'field1', data: { type: 'date' } }}
                model={model}
                onScaleChange={jest.fn()}
                onSelectFieldChange={jest.fn()}
                selectedType={LINE_PLOT_TYPE}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);
    });

    test('bar chart for x, not showFieldOptions', async () => {
        render(
            <ChartFieldOption
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                fieldValue={{ value: 'field1', data: { type: 'int' } }}
                model={model}
                onScaleChange={jest.fn()}
                onSelectFieldChange={jest.fn()}
                selectedType={BAR_CHART_TYPE}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);
    });

    test('label for not required', async () => {
        render(
            <ChartFieldOption
                field={{ name: 'x', label: 'X Axis', required: false } as ChartFieldInfo}
                fieldValue={{ value: 'field1', data: { type: 'date' } }}
                model={model}
                onScaleChange={jest.fn()}
                onSelectFieldChange={jest.fn()}
                selectedType={LINE_PLOT_TYPE}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis');
        });
    });

    test('default values set for scale', async () => {
        render(
            <ChartFieldOption
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                fieldValue={{ value: 'field1', data: { type: 'int' } }}
                model={model}
                onScaleChange={jest.fn()}
                onSelectFieldChange={jest.fn()}
                selectedType={LINE_PLOT_TYPE}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        // scale options not shown until clicking on the gear icon
        expect(document.querySelectorAll('.radioinput-label')).toHaveLength(0);
        expect(document.querySelectorAll('input')).toHaveLength(2);
        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.radioinput-label')).toHaveLength(4);
        expect(document.querySelectorAll('input')).toHaveLength(6);

        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('Linear');
        expect(document.querySelectorAll('.radioinput-label.selected')[1].textContent).toBe('Automatic');
        expect(document.querySelectorAll('input[name=scaleMin]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name=scaleMax]')).toHaveLength(0);
    });

    test('initial values set from scaleValues', async () => {
        render(
            <ChartFieldOption
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                fieldValue={{ value: 'field1', data: { type: 'int' } }}
                scaleValues={{ trans: 'log', type: 'manual', min: '3', max: '20' }}
                model={model}
                onScaleChange={jest.fn()}
                onSelectFieldChange={jest.fn()}
                selectedType={LINE_PLOT_TYPE}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('Log');
        expect(document.querySelectorAll('.radioinput-label.selected')[1].textContent).toBe('Manual');
        expect(document.querySelector('input[name=scaleMin]').getAttribute('value')).toBe('3');
        expect(document.querySelector('input[name=scaleMax]').getAttribute('value')).toBe('20');
        expect(document.querySelectorAll('.text-danger')).toHaveLength(0);

        // verify min and max are cleared when changed to automatic
        await userEvent.click(document.querySelectorAll('.radioinput-label')[2]); // Automatic
        expect(document.querySelectorAll('.radioinput-label.selected')[0].textContent).toBe('Log');
        expect(document.querySelectorAll('.radioinput-label.selected')[1].textContent).toBe('Automatic');
        expect(document.querySelectorAll('input[name=scaleMin]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name=scaleMax]')).toHaveLength(0);
        await userEvent.click(document.querySelectorAll('.radioinput-label')[3]); // Manual
        expect(document.querySelector('input[name=scaleMin]').getAttribute('value')).toBe('');
        expect(document.querySelector('input[name=scaleMax]').getAttribute('value')).toBe('');
    });

    test('invalid scale range, max < min', async () => {
        render(
            <ChartFieldOption
                field={{ name: 'x', label: 'X Axis', required: true } as ChartFieldInfo}
                fieldValue={{ value: 'field1', data: { type: 'int' } }}
                scaleValues={{ trans: 'log', type: 'manual', min: '1', max: '0' }}
                model={model}
                onScaleChange={jest.fn()}
                onSelectFieldChange={jest.fn()}
                selectedType={LINE_PLOT_TYPE}
            />
        );

        await waitFor(() => {
            expect(document.querySelector('label').textContent).toBe('X Axis *');
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelector('input[name=scaleMin]').getAttribute('value')).toBe('1');
        expect(document.querySelector('input[name=scaleMax]').getAttribute('value')).toBe('0');
        expect(document.querySelector('.text-danger').textContent).toBe('Invalid range (Max <= Min)');
    });
});
