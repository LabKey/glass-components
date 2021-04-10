import React from 'react';
import { Modal, Button } from 'react-bootstrap';
import { mount, ReactWrapper, shallow } from 'enzyme';

import { OntologyBrowserModal } from './OntologyBrowserModal';
import { OntologyBrowserPanel } from './OntologyBrowserPanel';

const onCancel = jest.fn;

const DEFAULT_PROPS = {
    title: 'Test title',
    onCancel,
    onApply: jest.fn,
};

describe('OntologyBrowserModal', () => {
    function validate(wrapper: ReactWrapper): void {
        expect(wrapper.find(Modal).prop('bsSize')).toBe('large');
        expect(wrapper.find(Modal).prop('onHide')).toBe(onCancel);
        expect(wrapper.find(Modal.Header).prop('closeButton')).toBe(true);
        expect(wrapper.find(Modal.Title).text()).toBe(DEFAULT_PROPS.title);
        expect(wrapper.find(OntologyBrowserPanel)).toHaveLength(1);
        expect(wrapper.find(Button)).toHaveLength(2);
    }

    test('default props', () => {
        const wrapper = mount(<OntologyBrowserModal {...DEFAULT_PROPS} />);
        validate(wrapper);
        expect(wrapper.find(Button).last().prop('bsStyle')).toBe('success');
        wrapper.unmount();
    });

    test('OntologyBrowserPanel props', () => {
        const wrapper = shallow(<OntologyBrowserModal {...DEFAULT_PROPS} initOntologyId="testOntId" />);
        const panel = wrapper.find(OntologyBrowserPanel);
        expect(panel.prop('asPanel')).toBe(false);
        expect(panel.prop('initOntologyId')).toBe('testOntId');
        wrapper.unmount();
    });

    test('apply button props', () => {
        const wrapper = shallow(<OntologyBrowserModal {...DEFAULT_PROPS} successBsStyle="primary" />);
        const applyBtn = wrapper.find(Button).last();
        expect(applyBtn.prop('disabled')).toBe(true);
        expect(applyBtn.prop('bsStyle')).toBe('primary');
        wrapper.unmount();
    });
});
