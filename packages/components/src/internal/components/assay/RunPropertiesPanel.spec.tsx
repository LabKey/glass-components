import React from 'react';
import { OrderedMap } from 'immutable';
import { mount } from 'enzyme';
import { Input, Textarea } from 'formsy-react-components';

import { ASSAY_WIZARD_MODEL } from '../../../test/data/constants';
import { TextInput, DatePickerInput, SelectInput, QueryFormInputs, QueryColumn } from '../../..';

import { CheckboxInput } from '../forms/input/CheckboxInput';

import { AssayWizardModel } from './AssayWizardModel';
import { RunPropertiesPanel } from './RunPropertiesPanel';
import { initUnitTestMocks } from '../../testHelperMocks';

beforeAll(() => {
    initUnitTestMocks();
});

describe('<RunPropertiesPanel/>', () => {
    test('model without run domain fields', () => {
        const model = ASSAY_WIZARD_MODEL.set('runColumns', OrderedMap<string, QueryColumn>()) as AssayWizardModel;
        const component = <RunPropertiesPanel model={model} onChange={jest.fn} />;

        const wrapper = mount(component);
        expect(wrapper.find('.panel')).toHaveLength(1);
        expect(wrapper.find(Input)).toHaveLength(1); // assay id input always there for run props
        expect(wrapper.find(Textarea)).toHaveLength(1); // comments input always there for run props
        expect(wrapper.find(QueryFormInputs)).toHaveLength(0);
    });

    test('check form input types', () => {
        const component = <RunPropertiesPanel model={ASSAY_WIZARD_MODEL} onChange={jest.fn} />;

        const wrapper = mount(component);
        expect(wrapper.find('.panel')).toHaveLength(1);
        expect(wrapper.find(Input)).toHaveLength(4); // assay id plus 4 TextInputs
        expect(wrapper.find(Textarea)).toHaveLength(2); // comments plus one other multi-line text input
        expect(wrapper.find(QueryFormInputs)).toHaveLength(1);
        expect(wrapper.find(TextInput)).toHaveLength(3); // text, multi-line, integer, and decimal fields
        expect(wrapper.find(DatePickerInput)).toHaveLength(1);
        expect(wrapper.find(CheckboxInput)).toHaveLength(1);
        expect(wrapper.find(SelectInput)).toHaveLength(0);
    });
});
