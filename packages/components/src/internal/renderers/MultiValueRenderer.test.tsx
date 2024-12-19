import React from 'react';
import { fromJS, Map } from 'immutable';

import { render } from '@testing-library/react';

import { MultiValueRenderer } from './MultiValueRenderer';

describe('MultiValueRenderer', () => {
    test('empty data', () => {
        render(<MultiValueRenderer data={undefined} />);
        expect(document.body.textContent).toBe('');

        render(<MultiValueRenderer data={null} />);
        expect(document.body.textContent).toBe('');

        render(<MultiValueRenderer data={Map()} />);
        expect(document.body.textContent).toBe('');
    });

    test('data shapes, value', () => {
        const data = fromJS({ 24: { value: 24 } });
        render(<MultiValueRenderer data={data} />);
        expect(document.body.textContent).toBe('24');
    });

    test('data shapes, displayValue', () => {
        const data = fromJS({ 24: { displayValue: 'Griffey', value: 24 } });
        render(<MultiValueRenderer data={data} />);
        expect(document.body.textContent).toBe('Griffey');
    });

    test('data shapes, formattedValue', () => {
        const data = fromJS({ 24: { formattedValue: 'Ken Griffey Jr.', displayValue: 'Griffey', value: 24 } });
        render(<MultiValueRenderer data={data} />);
        expect(document.body.textContent).toBe('Ken Griffey Jr.');
    });

    test('data with new line', () => {
        const data = fromJS({ 24: { value: 'first\nsecond\nthird' } });
        render(<MultiValueRenderer data={data} />);
        expect(document.body.textContent).toBe('firstsecondthird');
        expect(document.querySelectorAll('br')).toHaveLength(3);
    });

    test('multiple values', () => {
        const data = fromJS({
            11: { displayValue: 'Edgar', value: 11 },
            24: { formattedValue: 'Ken Griffey Jr.', value: 24 },
            51: { displayValue: 'Ichiro', url: 'https://www.mariners.com/ichiro', value: 51 },
        });
        render(<MultiValueRenderer data={data} />);
        const spans = document.querySelectorAll('span');
        expect(spans.length).toBe(3);
        expect(spans[0].textContent).toEqual('Edgar');
        expect(spans[1].textContent).toEqual(', Ken Griffey Jr.');
        expect(spans[2].textContent).toEqual(', Ichiro');

        const link = spans[2].querySelectorAll('a');
        expect(link).toHaveLength(1);
        expect(link[0].getAttribute('href')).toEqual('https://www.mariners.com/ichiro');
    });

    test('non-Map values', () => {
        const data = Map({
            11: [],
            24: 'Ken Griffey Jr.',
            28: 0,
            44: 4.444555,
            51: false,
            99: undefined,
            101: null,
        });
        render(<MultiValueRenderer data={data} />);
        const spans = document.querySelectorAll('span');
        expect(spans.length).toBe(4);
        expect(spans[0].textContent).toEqual('Ken Griffey Jr.');
        expect(spans[1].textContent).toEqual(', 0');
        expect(spans[2].textContent).toEqual(', 4.444555');
        expect(spans[3].textContent).toEqual(', false');
        expect(document.querySelectorAll('a')).toHaveLength(0);
    });
});
