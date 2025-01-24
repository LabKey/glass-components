import React from 'react';

import { render } from '@testing-library/react';

import { PropertyValidator } from '../models';
import { INTEGER_TYPE } from '../PropDescType';
import { createFormInputId } from '../utils';
import {
    DOMAIN_FIRST_FILTER_VALUE,
    DOMAIN_SECOND_FILTER_VALUE,
    DOMAIN_VALIDATOR_DESCRIPTION,
    DOMAIN_VALIDATOR_ERRORMESSAGE,
    DOMAIN_VALIDATOR_NAME,
} from '../constants';
import propertyValidator from '../../../../test/data/propertyValidator-range.json';

import { RangeValidationOptions } from './RangeValidationOptions';

describe('RangeValidationOptions', () => {
    test('Range Validator - expanded', () => {
        const validatorIndex = 0;
        const domainIndex = 1;
        const validatorModel = PropertyValidator.fromJS([propertyValidator], 'Range').get(0);

        const props = {
            validator: validatorModel,
            index: 1,
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            expanded: true,
            dataType: INTEGER_TYPE,
            onExpand: jest.fn(),
            onDelete: jest.fn(),
            onChange: jest.fn(),
        };

        render(<RangeValidationOptions {...props} />);

        let value = document.querySelector(
            '#' + createFormInputId(DOMAIN_FIRST_FILTER_VALUE, domainIndex, validatorIndex)
        );
        expect(value.getAttribute('value')).toEqual('0');

        value = document.querySelector(
            '#' + createFormInputId(DOMAIN_SECOND_FILTER_VALUE, domainIndex, validatorIndex)
        );
        expect(value.getAttribute('value')).toEqual('10');

        const name = document.querySelector(
            '#' + createFormInputId(DOMAIN_VALIDATOR_NAME, domainIndex, validatorIndex)
        );
        expect(name.getAttribute('value')).toEqual('Test range validator');

        const description = document.querySelector(
            '#' + createFormInputId(DOMAIN_VALIDATOR_DESCRIPTION, domainIndex, validatorIndex)
        );
        expect(description.innerHTML).toEqual('This is a range validator');

        const errorMsg = document.querySelector(
            '#' + createFormInputId(DOMAIN_VALIDATOR_ERRORMESSAGE, domainIndex, validatorIndex)
        );
        expect(errorMsg.innerHTML).toEqual('Range validation failed');

        expect(RangeValidationOptions.isValid(validatorModel)).toEqual(true);
    });

    test('Range Validator - collapsed', () => {
        const validatorIndex = 0;
        const domainIndex = 1;
        const validatorModel = PropertyValidator.fromJS([propertyValidator], 'Range').get(0);

        const props = {
            validator: validatorModel,
            index: 1,
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            expanded: false,
            dataType: INTEGER_TYPE,
            onExpand: jest.fn(),
            onDelete: jest.fn(),
            onChange: jest.fn(),
        };

        render(<RangeValidationOptions {...props} />);

        const collapsed = document.querySelector(
            `#domain-range-validator-${validatorIndex} .domain-validator-collapse`
        );
        expect(collapsed.textContent).toEqual('Test range validator: Is Greater Than 0 and Is Less Than 10');
    });
});
