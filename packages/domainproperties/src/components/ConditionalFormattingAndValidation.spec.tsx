import {mount} from "enzyme";
import * as React from "react";
import toJson from "enzyme-to-json";
import {ConditionalFormattingAndValidation} from "./ConditionalFormattingAndValidation";
import {BOOLEAN_TYPE, DATETIME_TYPE, DomainField, DOUBLE_TYPE, INTEGER_TYPE, TEXT_TYPE} from "../models";
import propertyValidatorRange from "../test/data/propertyValidator-range.json";
import propertyValidatorRegex from "../test/data/propertyValidator-regex.json";
import conditionalFormat1 from "../test/data/conditionalFormat1.json";
import conditionalFormat2 from "../test/data/conditionalFormat2.json";


describe('ConditionalFormattingAndValidation', () => {

    test('No validators or formats', () => {
        const expectedValidators = 'None Set';
        const decimalPropertyType = DOUBLE_TYPE;
        const datePropertyType = DATETIME_TYPE;
        const booleanPropertyType = BOOLEAN_TYPE;

        const props = {
            index: 1,
            field: DomainField.create({}),
            setDragDisabled: jest.fn(),
            onChange: jest.fn()
        };

        const cfv  = mount(<ConditionalFormattingAndValidation
            {...props}
        />);

        // Verify label
        const sectionLabel = cfv.find({className: 'domain-field-section-heading domain-field-section-hdr'});
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual('Conditional Formatting and Validation Options');

        // Verify buttons. Range validator only shows for numeric data types
        let buttons = cfv.find({className: 'domain-validation-button btn btn-default'});
        expect(buttons.length).toEqual(2); // Only Conditional Format and Regex if not selected as numeric type

        let validatorStrings = cfv.find({className: 'domain-text-label'});
        expect(validatorStrings.length).toEqual(2);

        cfv.setProps({...props, field: DomainField.create({rangeURI: decimalPropertyType.rangeURI})});

        buttons = cfv.find({className: 'domain-validation-button btn btn-default'});
        expect(buttons.length).toEqual(3); // All three should be available now

        validatorStrings = cfv.find({className: 'domain-text-label'});
        expect(validatorStrings.length).toEqual(3);

        cfv.setProps({...props, field: DomainField.create({rangeURI: booleanPropertyType.rangeURI})});

        buttons = cfv.find({className: 'domain-validation-button btn btn-default'});
        expect(buttons.length).toEqual(2);

        validatorStrings = cfv.find({className: 'domain-text-label'});
        expect(validatorStrings.length).toEqual(2);

        cfv.setProps({...props, field: DomainField.create({rangeURI: datePropertyType.rangeURI})});

        buttons = cfv.find({className: 'domain-validation-button btn btn-default'});
        expect(buttons.length).toEqual(3);

        validatorStrings = cfv.find({className: 'domain-text-label'});
        expect(validatorStrings.length).toEqual(3);

        // Validator strings should all be None Set
        expect(validatorStrings.at(0).text()).toEqual(expectedValidators);
        expect(validatorStrings.at(1).text()).toEqual(expectedValidators);
        expect(validatorStrings.at(2).text()).toEqual(expectedValidators);

        expect(toJson(cfv)).toMatchSnapshot();
        cfv.unmount();
    });

    test('Multiple validators or formats', () => {
        const integerPropertyType = INTEGER_TYPE;
        const textPropertyType = TEXT_TYPE;
        const validatorString = '1 Active validator';
        const formatsString = '2 Active formats';

        const props = {
            index: 1,
            field: DomainField.create({propertyValidators: [propertyValidatorRange, propertyValidatorRegex], rangeURI: integerPropertyType.rangeURI}),
            setDragDisabled: jest.fn(),
            onChange: jest.fn()
        };

        const cfv  = mount(<ConditionalFormattingAndValidation
            {...props}
        />);

        let validatorStrings = cfv.find({className: 'domain-text-label'});
        expect(validatorStrings.length).toEqual(1);

        validatorStrings = cfv.find({className: 'domain-validator-link'});
        expect(validatorStrings.length).toEqual(2);
        expect(validatorStrings.at(0).text()).toEqual(validatorString);
        expect(validatorStrings.at(1).text()).toEqual(validatorString);

        cfv.setProps({field: DomainField.create({conditionalFormats: [conditionalFormat1, conditionalFormat2], rangeURI: textPropertyType.rangeURI})});

        validatorStrings = cfv.find({className: 'domain-text-label'});
        expect(validatorStrings.length).toEqual(1);

        validatorStrings = cfv.find({className: 'domain-validator-link'});
        expect(validatorStrings.length).toEqual(1);
        expect(validatorStrings.at(0).text()).toEqual(formatsString);

        expect(toJson(cfv)).toMatchSnapshot();
        cfv.unmount();
    });
});