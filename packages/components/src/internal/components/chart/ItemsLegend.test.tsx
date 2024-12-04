import React from 'react';
import { render } from '@testing-library/react';
import { Map } from 'immutable';

import { ItemsLegend } from './ItemsLegend';

describe('<ItemsLegend/>', () => {
    test('empty box', () => {
        render(
            <ItemsLegend
                legendData={[
                    {
                        circleColor: 'none',
                        backgroundColor: 'FFFFFF',
                        borderColor: 'blue',
                        legendLabel: 'Empty location',
                    },
                ]}
            />
        );

        expect(document.querySelector('.box-viewer-legend')).toBeInTheDocument();
        expect(document.getElementsByClassName('cell-legend-row').length).toBe(1);
        expect(document.getElementsByClassName('cell-legend-icon').length).toBe(1);
        expect(document.getElementsByClassName('cell-legend-icon-border').length).toBe(1);
        expect(document.getElementsByClassName('cell-legend-circle').length).toBe(0);
        expect(document.getElementsByClassName('cell-legend-label').length).toBe(1);
        expect(document.getElementsByClassName('cell-legend-label')[0].innerHTML).toBe('Empty location');
    });

    test('multiple sample types and checked out status, no selection', () => {
        const MULTIPLE_SAMPLE_TYPES = [
            { circleColor: '#fe9200', backgroundColor: 'none', legendLabel: 'blood' },
            {
                circleColor: '#009ce0',
                backgroundColor: 'none',
                legendLabel: 'samp18',
            },
            { circleColor: '#2980b9', backgroundColor: 'none', legendLabel: 'sampleB' },
            {
                circleColor: 'none',
                backgroundColor: '#F5D4D3',
                legendLabel: 'Checked out/Reserved',
            },
            { circleColor: 'none', backgroundColor: 'FFFFFF', legendLabel: 'Empty location' },
        ];

        render(<ItemsLegend legendData={MULTIPLE_SAMPLE_TYPES} />);

        expect(document.querySelector('.box-viewer-legend')).toBeInTheDocument();
        expect(document.getElementsByClassName('cell-legend-row').length).toBe(5);
        expect(document.getElementsByClassName('cell-legend-icon').length).toBe(5);
        expect(document.getElementsByClassName('cell-legend-icon-border').length).toBe(2);
        expect(document.getElementsByClassName('cell-legend-circle').length).toBe(3);
        expect(document.getElementsByClassName('cell-legend-label').length).toBe(5);
        expect(document.getElementsByClassName('cell-legend-label')[0].innerHTML).toBe('blood');
        expect(document.getElementsByClassName('cell-legend-label')[1].innerHTML).toBe('samp18');
        expect(document.getElementsByClassName('cell-legend-label')[2].innerHTML).toBe('sampleB');
        expect(document.getElementsByClassName('cell-legend-label')[3].innerHTML).toBe('Checked out/Reserved');
        expect(document.getElementsByClassName('cell-legend-label')[4].innerHTML).toBe('Empty location');
    });

    test('multiple sample types with same color label', () => {
        const WITH_SAME_COLOR_LABELS = [
            { circleColor: '#fe9200', backgroundColor: 'none', legendLabel: 'blood' },
            {
                circleColor: '#009ce0',
                backgroundColor: 'none',
                legendLabel: 'samp18',
            },
            { circleColor: '#2980b9', backgroundColor: 'none', legendLabel: 'sampleB, sampleC' },
            {
                circleColor: 'none',
                backgroundColor: '#F5D4D3',
                legendLabel: 'Checked out/Reserved',
            },
            { circleColor: 'none', backgroundColor: 'FFFFFF', legendLabel: 'Empty location' },
        ];

        render(<ItemsLegend legendData={WITH_SAME_COLOR_LABELS} />);

        expect(document.querySelector('.box-viewer-legend')).toBeInTheDocument();
        expect(document.getElementsByClassName('cell-legend-row').length).toBe(5);
        expect(document.getElementsByClassName('cell-legend-icon').length).toBe(5);
        expect(document.getElementsByClassName('cell-legend-icon-border').length).toBe(2);
        expect(document.getElementsByClassName('cell-legend-circle').length).toBe(3);
        expect(document.getElementsByClassName('cell-legend-label').length).toBe(5);
        expect(document.getElementsByClassName('cell-legend-label')[2].innerHTML).toBe('sampleB, sampleC');
    });

    test('with selection, locked and expired', () => {
        const WITH_MIXED = [
            {
                circleColor: '#fe9200',
                backgroundColor: 'none',
                legendLabel: 'blood',
            },
            { circleColor: '#009ce0', backgroundColor: 'none', legendLabel: 'samp18' },
            {
                circleColor: '#fe9200',
                backgroundColor: '#EDF3FF',
                legendLabel: 'blood selected',
            },
            {
                circleColor: '#009ce0',
                backgroundColor: '#EDF3FF',
                legendLabel: 'samp18 selected',
            },
            {
                circleColor: '#2980b9',
                backgroundColor: '#EDF3FF',
                legendLabel: 'sampleB selected, sampleC selected',
            },
            { circleColor: 'none', backgroundColor: '#EDF3FF', legendLabel: 'Empty selected' },
            {
                circleColor: 'none',
                backgroundColor: '#F5D4D3',
                legendLabel: 'Checked out/Reserved',
            },
            {
                circleColor: 'none',
                backgroundColor: 'none',
                legendLabel: 'Restricted',
                locked: true,
            },
            {
                circleColor: '#009ce0',
                backgroundColor: 'none',
                legendLabel: 'Sample expired',
                expired: true,
            },
            { circleColor: 'none', backgroundColor: 'FFFFFF', legendLabel: 'Empty location' },
        ];

        render(<ItemsLegend legendData={WITH_MIXED} />);

        expect(document.querySelector('.box-viewer-legend')).toBeInTheDocument();
        expect(document.getElementsByClassName('cell-legend-row').length).toBe(10);
        expect(document.getElementsByClassName('cell-legend-icon').length).toBe(10);
        expect(document.getElementsByClassName('cell-legend-icon-border').length).toBe(6);
        expect(document.getElementsByClassName('cell-legend-circle').length).toBe(6);
        expect(document.getElementsByClassName('cell-legend-label').length).toBe(10);
        expect(document.getElementsByClassName('cell-legend-label')[7].innerHTML).toBe('Restricted');
        expect(document.getElementsByClassName('cell-legend-icon-margin').length).toBe(1);
        expect(document.getElementsByClassName('cell-lock').length).toBe(1);
        expect(document.getElementsByClassName('cell-legend-label')[8].innerHTML).toBe('Sample expired');
        expect(document.getElementsByClassName('expired-form-field').length).toBe(1);
    });

    test('with link and activeIndex', () => {
        const sampleAllocationLegends = [
            {
                circleColor: '#ab149e',
                backgroundColor: 'none',
                legendLabel: 'Cell Bank',
                data: Map.of(
                    'value',
                    2,
                    'url',
                    '/LKSM/freezermanager-app.view#/boxes/9?query.SampleType/Name~eq=Cell Bank'
                ),
            },
            {
                circleColor: '#2980b9',
                backgroundColor: 'none',
                legendLabel: 'CellValidation',
                data: Map.of(
                    'value',
                    1,
                    'url',
                    '/LKSM/freezermanager-app.view#/boxes/9?query.SampleType/Name~eq=CellValidation'
                ),
            },
            {
                circleColor: 'fff',
                backgroundColor: 'none',
                legendLabel: 'Space Available',
                data: Map.of('value', 1),
            },
        ];
        render(<ItemsLegend legendData={sampleAllocationLegends} activeIndex={1} />);
        const legends = document.querySelectorAll('tr');
        expect(legends.length).toBe(3);
        expect(document.querySelectorAll('a')).toHaveLength(2);
        expect(legends[0].querySelectorAll('a')).toHaveLength(1);
        expect(legends[0].querySelectorAll('.bold-text')).toHaveLength(0);
        expect(legends[1].querySelectorAll('a')).toHaveLength(1);
        expect(legends[1].querySelectorAll('.bold-text')).toHaveLength(1);
        expect(legends[2].querySelectorAll('a')).toHaveLength(0);
    });
});
