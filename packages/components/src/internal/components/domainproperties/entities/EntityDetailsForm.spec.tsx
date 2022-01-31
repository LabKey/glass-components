import React from 'react';
import renderer from 'react-test-renderer';
import { fromJS } from 'immutable';

import { mount } from 'enzyme';

import { EntityDetailsForm } from './EntityDetailsForm';
import { IEntityDetails } from './models';

describe('<EntityDetailsForm/>', () => {
    test('default properties', () => {
        const component = <EntityDetailsForm noun="Entity" onFormChange={jest.fn()} />;

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('nameExpression properties', () => {
        const component = (
            <EntityDetailsForm
                noun="Entity"
                onFormChange={jest.fn()}
                nameExpressionInfoUrl="www.labkey.org"
                nameExpressionPlaceholder="Enter a name expression"
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('initial data', () => {
        const component = (
            <EntityDetailsForm
                noun="Entity"
                onFormChange={jest.fn()}
                data={fromJS({
                    rowId: 1,
                    name: 'Test Entity Name',
                    description: 'Test Entity Description',
                    nameExpression: 'Test Name Expression',
                })}
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with formValues', () => {
        const component = (
            <EntityDetailsForm
                noun="Entity"
                onFormChange={jest.fn()}
                formValues={
                    {
                        'entity-name': 'Test Entity Name',
                        'entity-description': 'Test Entity Description',
                        'entity-nameExpression': 'Test Name Expression',
                    } as IEntityDetails
                }
            />
        );

        const tree = renderer.create(component).toJSON();
        expect(tree).toMatchSnapshot();
    });

    test('with previewName', () => {
        const onNameFieldHover = jest.fn();

        const component = (
            <EntityDetailsForm
                noun="Entity"
                onFormChange={jest.fn()}
                data={fromJS({
                    rowId: 1,
                    name: 'Test Entity Name',
                    description: 'Test Entity Description',
                    nameExpression: 'Test Name Expression',
                })}
                onNameFieldHover={onNameFieldHover}
                showPreviewName={true}
                previewName="abc"
            />
        );

        const wrapper = mount(component);

        const nameExpressionLabel = wrapper.find('.name-expression-label-div span.domain-no-wrap');
        expect(nameExpressionLabel).toHaveLength(1);
        expect(wrapper).toMatchSnapshot();
    });
});
