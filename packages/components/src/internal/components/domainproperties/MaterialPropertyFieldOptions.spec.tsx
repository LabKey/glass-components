import { mount } from 'enzyme';
import React from 'react';

import { createFormInputId } from './actions';
import {DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_MATERIAL_PROPERTY_TYPE, DOMAIN_FIELD_NOT_LOCKED} from './constants';
import { MaterialPropertyFieldOptions } from './MaterialPropertyFieldOptions';

describe('MaterialPropertyFieldOptions', () => {
    test('Material Property Field Options', () => {
        const label = 'Aliquot properties';

        const props = {
            index: 1,
            domainIndex: 1,
            label: label,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        const aliquot = mount(<MaterialPropertyFieldOptions {...props} />);

        // Verify label
        const sectionLabel = aliquot.find({ className: 'domain-field-section-heading domain-field-section-hdr' });
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel.text()).toEqual(label);

        const fieldName = createFormInputId(DOMAIN_FIELD_MATERIAL_PROPERTY_TYPE, 1, 1);
        // Test format field initial value
        let checkbox = aliquot.find({id: fieldName, bsClass: 'checkbox'});
        expect(checkbox.length).toEqual(1);
        expect(checkbox.props().checked).toEqual(false);

        // Verify format value changes with props
        aliquot.setProps({ value: "AliquotOnly" });
        checkbox = aliquot.find({id: fieldName, bsClass: 'checkbox'});
        expect(checkbox.props().checked).toEqual(true);

        expect(aliquot).toMatchSnapshot();
        aliquot.unmount();
    });
});
