import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { waitFor } from '@testing-library/dom';

import { LABKEY_VIS } from '../../constants';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { TrendlineOption } from './TrendlineOption';

LABKEY_VIS = {
    GenericChartHelper: {
        TRENDLINE_OPTIONS: [
            { value: 'option1', label: 'Option 1', schemaPrefix: undefined },
            { value: 'option2', label: 'Option 2', schemaPrefix: null },
            { value: 'option3', label: 'Option 3', schemaPrefix: 'other' },
            { value: 'option4', label: 'Option 4', schemaPrefix: 'assay' },
        ],
    },
};

describe('TrendlineOption', () => {
    test('hidden without x-axis value selected', async () => {
        render(
            <TrendlineOption
                fieldValues={{}}
                onFieldChange={jest.fn()}
                schemaQuery={new SchemaQuery('assay', 'query')}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(0);
        });
        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
        expect(document.querySelectorAll('option')).toHaveLength(0);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);
        expect(document.querySelectorAll('input[name="trendlineAsymptoteMin"]')).toHaveLength(0);
        expect(document.querySelectorAll('input[name="trendlineAsymptoteMax"]')).toHaveLength(0);
    });

    test('shown with x-axis value selected, non-date', async () => {
        const fieldValues = {
            x: { data: { jsonType: 'int' }, value: 'field1' },
            trendlineAsymptoteMin: { value: undefined },
            trendlineAsymptoteMax: { value: undefined },
        };
        render(
            <TrendlineOption
                fieldValues={fieldValues}
                onFieldChange={jest.fn()}
                schemaQuery={new SchemaQuery('assay', 'query')}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(1);
        });

        expect(document.querySelector('label').textContent).toBe('Trendline  ');
        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.select-input__option')).toHaveLength(0); // none until click below
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);

        await userEvent.click(document.querySelector('.select-input__indicator'));
        const options = document.querySelectorAll('.select-input__option');
        expect(options).toHaveLength(3); // options filtered for schemaPrefix
        expect(options[0].textContent).toBe('Option 1');
        expect(options[1].textContent).toBe('Option 2');
        expect(options[2].textContent).toBe('Option 4');
    });

    test('hidden with x-axis value selected, date', async () => {
        const fieldValues = {
            x: { data: { jsonType: 'date' }, value: 'field1' },
            trendlineAsymptoteMin: { value: undefined },
            trendlineAsymptoteMax: { value: undefined },
        };
        render(
            <TrendlineOption
                fieldValues={fieldValues}
                onFieldChange={jest.fn()}
                schemaQuery={new SchemaQuery('assay', 'query')}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);
    });

    test('hidden with x-axis value selected, time', async () => {
        const fieldValues = {
            x: { data: { type: 'time' }, value: 'field1' },
            trendlineAsymptoteMin: { value: undefined },
            trendlineAsymptoteMax: { value: undefined },
        };
        render(
            <TrendlineOption
                fieldValues={fieldValues}
                onFieldChange={jest.fn()}
                schemaQuery={new SchemaQuery('assay', 'query')}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(0);
        });

        expect(document.querySelectorAll('.select-input')).toHaveLength(0);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(0);
    });

    test('show asymptote min and max', async () => {
        const fieldValues = {
            x: { data: { jsonType: 'int' }, value: 'field1' },
            trendlineType: { value: 'option1', showMin: true, showMax: true },
            trendlineAsymptoteMin: { value: '0.1' },
            trendlineAsymptoteMax: { value: '1.0' },
        };
        render(
            <TrendlineOption
                fieldValues={fieldValues}
                onFieldChange={jest.fn()}
                schemaQuery={new SchemaQuery('assay', 'query')}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(1);
        });

        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(2);

        await userEvent.click(document.querySelector('input[value="manual"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(2);
        expect(document.querySelector('input[name="trendlineAsymptoteMin"]').getAttribute('value')).toBe('0.1');
        expect(document.querySelector('input[name="trendlineAsymptoteMax"]').getAttribute('value')).toBe('1.0');

        // clicking automatic should hide the inputs and clear values
        await userEvent.click(document.querySelector('input[value="automatic"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
        await userEvent.click(document.querySelector('input[value="manual"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(2);
        expect(document.querySelector('input[name="trendlineAsymptoteMin"]').getAttribute('value')).toBe('');
        expect(document.querySelector('input[name="trendlineAsymptoteMax"]').getAttribute('value')).toBe('');
    });

    test('show asymptote min but not max', async () => {
        const fieldValues = {
            x: { data: { jsonType: 'int' }, value: 'field1' },
            trendlineType: { value: 'option1', showMin: true, showMax: false },
            trendlineAsymptoteMin: { value: '0.1' },
            trendlineAsymptoteMax: { value: undefined },
        };
        render(
            <TrendlineOption
                fieldValues={fieldValues}
                onFieldChange={jest.fn()}
                schemaQuery={new SchemaQuery('assay', 'query')}
            />
        );
        await waitFor(() => {
            expect(document.querySelectorAll('.trendline-option')).toHaveLength(1);
        });

        expect(document.querySelectorAll('.select-input')).toHaveLength(1);
        expect(document.querySelectorAll('.field-option-icon')).toHaveLength(1);

        await userEvent.click(document.querySelector('.fa-gear'));
        expect(document.querySelectorAll('input[type="radio"]')).toHaveLength(2);

        await userEvent.click(document.querySelector('input[value="manual"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(1);
        expect(document.querySelectorAll('input[name="trendlineAsymptoteMax"]')).toHaveLength(0);
        expect(document.querySelector('input[name="trendlineAsymptoteMin"]').getAttribute('value')).toBe('0.1');

        // clicking automatic should hide the inputs and clear values
        await userEvent.click(document.querySelector('input[value="automatic"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
        await userEvent.click(document.querySelector('input[value="manual"]'));
        expect(document.querySelectorAll('input[type="number"]')).toHaveLength(1);
        expect(document.querySelectorAll('input[name="trendlineAsymptoteMax"]')).toHaveLength(0);
        expect(document.querySelector('input[name="trendlineAsymptoteMin"]').getAttribute('value')).toBe('');
    });
});
