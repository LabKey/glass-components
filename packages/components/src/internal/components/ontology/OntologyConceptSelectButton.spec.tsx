import React from 'react';
import { Button } from 'react-bootstrap';
import { mount, ReactWrapper } from 'enzyme';

import { OntologyConceptSelectButton } from './OntologyConceptSelectButton';
import { DomainField } from '../domainproperties/models';
import { ConceptOverviewTooltip } from './ConceptOverviewPanel';
import { OntologyBrowserModal } from './OntologyBrowserModal';
import { DOMAIN_FIELD_FULLY_LOCKED } from '../domainproperties/constants';

const DEFAULT_PROPS = {
    id: 'test-id',
    title: 'Button Title',
    field: new DomainField({}),
    valueProp: 'principalConceptCode',
    valueIsPath: false,
    onChange: jest.fn,
};

describe('OntologyConceptSelectButton', () => {
    function validate(wrapper: ReactWrapper, value = 'None Set', isFieldLocked = false, showModal = false): void {
        const hasValue = value !== 'None Set';

        expect(wrapper.find('.domain-annotation-table')).toHaveLength(1);
        expect(wrapper.find(ConceptOverviewTooltip)).toHaveLength(1);
        expect(wrapper.find(OntologyBrowserModal)).toHaveLength(showModal ? 1 : 0);

        expect(wrapper.find(Button)).toHaveLength(showModal ? 3 : 1);
        expect(wrapper.find(Button).first().prop('disabled')).toBe(isFieldLocked);
        expect(wrapper.find(Button).first().text()).toBe('Button Title');

        expect(wrapper.find('.fa-remove')).toHaveLength(hasValue && !isFieldLocked ? 1 : 0);
        expect(wrapper.find('.domain-text-label')).toHaveLength(!hasValue || isFieldLocked ? 1 : 0);
        expect(wrapper.find('.domain-annotation-item')).toHaveLength(hasValue ? 1 : 0);
        if (hasValue) {
            expect(wrapper.find('.domain-annotation-item').text()).toBe(value);
            const itemOnClick = wrapper.find('.domain-annotation-item').prop('onClick');
            if (!isFieldLocked) expect(itemOnClick).toBeDefined();
            if (isFieldLocked) expect(itemOnClick).toBeUndefined();
        } else {
            expect(wrapper.find('.domain-text-label').text()).toBe(value);
        }
    }

    test('no value set', () => {
        const wrapper = mount(<OntologyConceptSelectButton {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.unmount();
    });

    test('showSelectModal', () => {
        const wrapper = mount(<OntologyConceptSelectButton {...DEFAULT_PROPS} />);
        validate(wrapper);
        wrapper.find(Button).simulate('click');
        validate(wrapper, 'None Set', false, true);
        wrapper.unmount();
    });

    test('with value set', () => {
        const wrapper = mount(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={new DomainField({ principalConceptCode: 'TEST VALUE' })}
            />
        );
        validate(wrapper, 'TEST VALUE');
        wrapper.unmount();
    });

    test('isFieldLocked', () => {
        const wrapper = mount(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={new DomainField({
                    principalConceptCode: 'TEST VALUE',
                    lockType: DOMAIN_FIELD_FULLY_LOCKED,
                })}
            />
        );
        validate(wrapper, 'TEST VALUE', true);
        wrapper.unmount();
    });

    test('OntologyBrowserModal props', () => {
        const wrapper = mount(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={new DomainField({
                    sourceOntology: 'Test Source'
                })}
                successBsStyle="testBs"
            />
        );
        wrapper.find(Button).simulate('click');
        validate(wrapper, 'None Set', false, true);
        const modal = wrapper.find(OntologyBrowserModal);
        expect(modal.prop('title')).toBe('Button Title');
        expect(modal.prop('initOntologyId')).toBe(undefined);
        expect(modal.prop('successBsStyle')).toBe('testBs');
        wrapper.unmount();
    });

    test('useFieldSourceOntology', () => {
        const wrapper = mount(
            <OntologyConceptSelectButton
                {...DEFAULT_PROPS}
                field={new DomainField({
                    sourceOntology: 'Test Source'
                })}
                useFieldSourceOntology
            />
        );
        wrapper.find(Button).simulate('click');
        validate(wrapper, 'None Set', false, true);
        const modal = wrapper.find(OntologyBrowserModal);
        expect(modal.prop('initOntologyId')).toBe('Test Source');
        wrapper.unmount();
    });
});
