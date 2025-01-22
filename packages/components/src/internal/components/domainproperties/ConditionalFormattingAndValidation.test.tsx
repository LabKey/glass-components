import React from 'react';

import { render } from '@testing-library/react';

import propertyValidatorRange from '../../../test/data/propertyValidator-range.json';
import propertyValidatorRegex from '../../../test/data/propertyValidator-regex.json';
import conditionalFormat1 from '../../../test/data/conditionalFormat1.json';
import conditionalFormat2 from '../../../test/data/conditionalFormat2.json';

import { DomainField } from './models';
import { BOOLEAN_TYPE, DATETIME_TYPE, DOUBLE_TYPE, INTEGER_TYPE, TEXT_TYPE } from './PropDescType';
import { ConditionalFormattingAndValidation } from './ConditionalFormattingAndValidation';

describe('ConditionalFormattingAndValidation', () => {
    const expectedValidators = 'None Set';
    const decimalPropertyType = DOUBLE_TYPE;
    const datePropertyType = DATETIME_TYPE;
    const booleanPropertyType = BOOLEAN_TYPE;
    const stringPropertyType = TEXT_TYPE;

    test('No validators or formats, empty field', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            field: DomainField.create({}),
            setDragDisabled: jest.fn(),
            onChange: jest.fn(),
            showingModal: jest.fn(),
        };
        render(<ConditionalFormattingAndValidation {...props} />);

        // Verify label
        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel[0].textContent).toEqual('Conditional Formatting and Validation Options');

        // Verify buttons. Range validator only shows for numeric data types
        const buttons = document.querySelectorAll('.domain-validation-button');
        expect(buttons.length).toEqual(2); // Only Conditional Format and Regex if not selected as numeric type

        const validatorStrings = document.querySelectorAll('.domain-text-label');
        expect(validatorStrings.length).toEqual(2);
    });

    test('decimal field', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            field: DomainField.create({ rangeURI: decimalPropertyType.rangeURI }),
            setDragDisabled: jest.fn(),
            onChange: jest.fn(),
            showingModal: jest.fn(),
        };
        render(<ConditionalFormattingAndValidation {...props} />);

        const buttons = document.querySelectorAll('.domain-validation-button');
        // Two should be available now: Conditional Format Criteria and Range Expression Validator
        expect(buttons.length).toEqual(2);

        const validatorStrings = document.querySelectorAll('.domain-text-label');
        expect(validatorStrings.length).toEqual(2);
    });

    test('boolean field', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            field: DomainField.create({ rangeURI: booleanPropertyType.rangeURI }),
            setDragDisabled: jest.fn(),
            onChange: jest.fn(),
            showingModal: jest.fn(),
        };
        render(<ConditionalFormattingAndValidation {...props} />);

        const buttons = document.querySelectorAll('.domain-validation-button');
        expect(buttons.length).toEqual(1);

        const validatorStrings = document.querySelectorAll('.domain-text-label');
        expect(validatorStrings.length).toEqual(1);
    });

    test('date field', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            field: DomainField.create({ rangeURI: datePropertyType.rangeURI }),
            setDragDisabled: jest.fn(),
            onChange: jest.fn(),
            showingModal: jest.fn(),
        };
        render(<ConditionalFormattingAndValidation {...props} />);

        const buttons = document.querySelectorAll('.domain-validation-button');
        expect(buttons.length).toEqual(2);

        const validatorStrings = document.querySelectorAll('.domain-text-label');
        expect(validatorStrings.length).toEqual(2);
    });

    test('string field', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            field: DomainField.create({ rangeURI: stringPropertyType.rangeURI }),
            setDragDisabled: jest.fn(),
            onChange: jest.fn(),
            showingModal: jest.fn(),
        };
        const { container } = render(<ConditionalFormattingAndValidation {...props} />);

        const buttons = document.querySelectorAll('.domain-validation-button');
        expect(buttons.length).toEqual(2);

        const validatorStrings = document.querySelectorAll('.domain-text-label');
        expect(validatorStrings.length).toEqual(2);

        // Validator strings should all be None Set
        expect(validatorStrings[0].textContent).toEqual(expectedValidators);
        expect(validatorStrings[1].textContent).toEqual(expectedValidators);

        expect(container).toMatchSnapshot();
    });

    test('Multiple validators or formats, property validator', () => {
        const integerPropertyType = INTEGER_TYPE;
        const validatorString = '1 Active validator';

        const props = {
            index: 1,
            domainIndex: 1,
            field: DomainField.create({
                propertyValidators: [propertyValidatorRange, propertyValidatorRegex],
                rangeURI: integerPropertyType.rangeURI,
            }),
            setDragDisabled: jest.fn(),
            onChange: jest.fn(),
            showingModal: jest.fn(),
        };

        render(<ConditionalFormattingAndValidation {...props} />);

        let validatorStrings = document.querySelectorAll('.domain-text-label');
        expect(validatorStrings.length).toEqual(1);

        validatorStrings = document.querySelectorAll('.domain-validator-link');
        expect(validatorStrings.length).toEqual(1);
        expect(validatorStrings[0].textContent).toEqual(validatorString);
    });

    test('Multiple validators or formats, conditional format', () => {
        const textPropertyType = TEXT_TYPE;
        const formatsString = '2 Active formats';

        const props = {
            index: 1,
            domainIndex: 1,
            field: DomainField.create({
                conditionalFormats: [conditionalFormat1, conditionalFormat2],
                rangeURI: textPropertyType.rangeURI,
            }),
            setDragDisabled: jest.fn(),
            onChange: jest.fn(),
            showingModal: jest.fn(),
        };

        const { container } = render(<ConditionalFormattingAndValidation {...props} />);

        let validatorStrings = document.querySelectorAll('.domain-text-label');
        expect(validatorStrings.length).toEqual(1);

        validatorStrings = document.querySelectorAll('.domain-validator-link');
        expect(validatorStrings.length).toEqual(1);
        expect(validatorStrings[0].textContent).toEqual(formatsString);

        expect(container).toMatchSnapshot();
    });

    test('No validators', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            field: DomainField.create({ rangeURI: TEXT_TYPE.rangeURI }),
            setDragDisabled: jest.fn(),
            onChange: jest.fn(),
            showingModal: jest.fn(),
            domainFormDisplayOptions: {
                hideValidators: true,
            },
        };

        const { container } = render(<ConditionalFormattingAndValidation {...props} />);

        const validatorStrings = document.querySelectorAll('.domain-validator-link');
        expect(validatorStrings.length).toEqual(0);

        expect(container).toMatchSnapshot();
    });
});
