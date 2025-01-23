import React from 'react';

import { render } from '@testing-library/react';

import { JsonType } from '../PropDescType';
import { createFormInputId } from '../utils';
import { DOMAIN_FIRST_FILTER_VALUE, DOMAIN_SECOND_FILTER_VALUE, } from '../constants';

import { Filters, NO_FILTER_TYPE } from './Filters';

describe('Filters', () => {
    test('Empty Filters - string type', async () => {
        const typeLabel1 = 'TypeLabel1';
        const valueLabel1 = 'ValueLabel1';
        const typeLabel2 = 'TypeLabel2';
        const valueLabel2 = 'ValueLabel2';
        const validatorIndex = 3;
        const domainIndex = 1;

        const props = {
            validatorIndex,
            domainIndex,
            mvEnabled: false,
            type: 'string' as JsonType,
            firstFilterTypeLabel: typeLabel1,
            firstFilterValueLabel: valueLabel1,
            secondFilterTypeLabel: typeLabel2,
            secondFilterValueLabel: valueLabel2,
            onChange: jest.fn(),
        };

        const { container } = render(<Filters {...props} />);
        let label = document.querySelector('#domain-filter-type-label-1');
        expect(label.textContent).toEqual(typeLabel1);

        label = document.querySelector('#domain-filter-value-label-1');
        expect(label.textContent).toEqual(valueLabel1);

        label = document.querySelector('#domain-filter-type-label-2');
        expect(label.textContent).toEqual(typeLabel2);

        label = document.querySelector('#domain-filter-value-label-2');
        expect(label.textContent).toEqual(valueLabel2);

        const options = document.querySelectorAll('option');
        expect(options).toHaveLength(39);
        expect(container).toMatchSnapshot();
    });

    test('Expressions', () => {
        const validatorIndex = 1;
        const domainIndex = 1;
        const expression1 = 'format.column~isblank=';
        const expression2 = 'format.column~gt=0&format.column~lte=100';
        const expression3 = 'format.column~neqornull=-5&format.column~hasmvvalue=';
        const invalidExpression1 = 'format.column~gt=&format.column~lte=100';
        const invalidExpression2 = 'format.column~gt=0&format.column~lte=';
        const prefix = 'format.column';

        const props = {
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            type: 'int' as JsonType,
            prefix: 'format.column',
            expression: expression1,
            onChange: jest.fn(),
        };

        render(<Filters {...props} />);

        const options = document.querySelectorAll('option');
        expect(options.length).toEqual(31);

        // Expression1

        let value = document.querySelector(
            '#' + createFormInputId(DOMAIN_FIRST_FILTER_VALUE, domainIndex, validatorIndex)
        );
        expect(value.getAttribute('value')).toEqual('');
        expect(value.getAttribute('disabled')).toEqual('');

        value = document.querySelector(
            '#' + createFormInputId(DOMAIN_SECOND_FILTER_VALUE, domainIndex, validatorIndex)
        );
        expect(value.getAttribute('value')).toEqual('');

        expect(Filters.describeExpression(expression1, prefix)).toEqual('Is Blank');
        expect(Filters.isValid(expression1, prefix)).toEqual(true);
        expect(Filters.describeExpression(expression2, prefix)).toEqual(
            'Is Greater Than 0 and Is Less Than or Equal To 100'
        );
        expect(Filters.isValid(expression2, prefix)).toEqual(true);
        expect(Filters.describeExpression(expression3, prefix)).toEqual(
            'Does Not Equal -5 and Has a missing value indicator'
        );
        expect(Filters.isValid(expression3, prefix)).toEqual(true);
        const expression4 = 'format.column~contains=a%2Bb'; // Issue 39191
        expect(Filters.describeExpression(expression4, prefix)).toEqual('Contains a+b');
        expect(Filters.isValid(expression4, prefix)).toEqual(true);

        expect(Filters.isValid(invalidExpression1, prefix)).toEqual(false);
        expect(Filters.isValid(invalidExpression2, prefix)).toEqual(false);
    });

    test('Date Range', () => {
        const validatorIndex = 1;
        const domainIndex = 1;

        const props = {
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            type: 'date' as JsonType,
            range: true,
            onChange: jest.fn(),
        };

        const { container } = render(<Filters {...props} />);

        const options = document.querySelectorAll('option');
        expect(options.length).toEqual(13);

        const dateValues = document.querySelectorAll('input[type="date"]');
        expect(dateValues.length).toEqual(2);

        expect(container).toMatchSnapshot();
    });

    test('hasFilterType', () => {
        expect(Filters.hasFilterType(undefined)).toBeFalsy();
        expect(Filters.hasFilterType(null)).toBeFalsy();
        expect(Filters.hasFilterType('')).toBeFalsy();
        expect(Filters.hasFilterType(NO_FILTER_TYPE)).toBeFalsy();
        expect(Filters.hasFilterType('eq')).toBeTruthy();
    });
});
