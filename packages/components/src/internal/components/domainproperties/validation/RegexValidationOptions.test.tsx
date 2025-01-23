import React from 'react';

import { render } from '@testing-library/react';

import { PropertyValidator } from '../models';
import { INTEGER_TYPE } from '../PropDescType';
import { createFormInputId } from '../utils';
import {
    DOMAIN_VALIDATOR_DESCRIPTION,
    DOMAIN_VALIDATOR_ERRORMESSAGE,
    DOMAIN_VALIDATOR_EXPRESSION,
    DOMAIN_VALIDATOR_FAILONMATCH,
    DOMAIN_VALIDATOR_NAME,
} from '../constants';
import propertyValidator from '../../../../test/data/propertyValidator-regex.json';

import { RegexValidationOptions } from './RegexValidationOptions';

describe('RegexValidationOptions', () => {
    test('Regex Validator - expanded', () => {
        const validatorIndex = 0;
        const domainIndex = 1;
        const validatorModel = PropertyValidator.fromJS([propertyValidator], 'RegEx').get(0);

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

        render(<RegexValidationOptions {...props} />);

        const expression = document.querySelector(
            '#' + createFormInputId(DOMAIN_VALIDATOR_EXPRESSION, domainIndex, validatorIndex)
        );
        expect(expression.innerHTML).toEqual('$[abc]');

        const name = document.querySelector(
            '#' + createFormInputId(DOMAIN_VALIDATOR_NAME, domainIndex, validatorIndex)
        );
        expect(name.getAttribute('value')).toEqual('Test Validator');

        const description = document.querySelector(
            '#' + createFormInputId(DOMAIN_VALIDATOR_DESCRIPTION, domainIndex, validatorIndex)
        );
        expect(description.innerHTML).toEqual('This is my validator description');

        const errorMsg = document.querySelector(
            '#' + createFormInputId(DOMAIN_VALIDATOR_ERRORMESSAGE, domainIndex, validatorIndex)
        );
        expect(errorMsg.innerHTML).toEqual('Test Validation Failure');

        const failOnMatch = document.querySelector(
            '#' + createFormInputId(DOMAIN_VALIDATOR_FAILONMATCH, domainIndex, validatorIndex)
        );
        expect(failOnMatch.getAttribute('checked')).toEqual('');

        expect(RegexValidationOptions.isValid(validatorModel)).toEqual(true);
    });

    test('Regex Validator - collapsed', () => {
        const validatorIndex = 0;
        const domainIndex = 1;
        const validatorModel = PropertyValidator.fromJS([propertyValidator], 'RegEx').get(0);

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

        render(<RegexValidationOptions {...props} />);

        const collapsed = document.querySelector('#domain-regex-validator-' + validatorIndex);
        expect(collapsed.textContent).toEqual('Test Validator: $[abc]');
    });
});
