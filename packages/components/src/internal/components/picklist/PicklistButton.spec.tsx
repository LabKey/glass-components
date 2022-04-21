import React from 'react';
import { DropdownButton } from 'react-bootstrap';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { TEST_USER_EDITOR } from '../../../test/data/users';

import { PicklistButton } from './PicklistButton';
import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';
import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';
import { mountWithServerContext } from '../../testHelpers';
import { SubMenuItem } from '../menus/SubMenuItem';

describe('PicklistButton', () => {
    test('with model no selections', () => {
        const queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));
        const featureArea = 'featureArea';
        const wrapper = mountWithServerContext(
            <PicklistButton model={queryModel} user={TEST_USER_EDITOR} metricFeatureArea={featureArea} />,
            { user: TEST_USER_EDITOR }
        );
        expect(wrapper.find(DropdownButton)).toHaveLength(1);
        expect(wrapper.find(SubMenuItem)).toHaveLength(0);
        const menuItem = wrapper.find(PicklistCreationMenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.prop('selectionKey')).toBe(queryModel.id);
        expect(menuItem.prop('selectedQuantity')).toBeFalsy();
        expect(menuItem.prop('metricFeatureArea')).toBe(featureArea);
        const addMenuItem = wrapper.find(AddToPicklistMenuItem);
        expect(addMenuItem).toHaveLength(1);
        expect(addMenuItem.prop('metricFeatureArea')).toBe(featureArea);
    });

    test('asSubMenu', () => {
        const queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));
        const featureArea = 'featureArea';
        const wrapper = mountWithServerContext(
            <PicklistButton model={queryModel} user={TEST_USER_EDITOR} metricFeatureArea={featureArea} asSubMenu />,
            { user: TEST_USER_EDITOR }
        );
        expect(wrapper.find(DropdownButton)).toHaveLength(0);
        expect(wrapper.find(SubMenuItem)).toHaveLength(1);
    });

    test('with model and selections', () => {
        let queryModel = makeTestQueryModel(SchemaQuery.create('test', 'query'));
        queryModel = queryModel.mutate({ selections: new Set(['1', '2']) });
        const wrapper = mountWithServerContext(<PicklistButton model={queryModel} user={TEST_USER_EDITOR} />, {
            user: TEST_USER_EDITOR,
        });
        const menuItem = wrapper.find(PicklistCreationMenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.prop('selectionKey')).toBe(queryModel.id);
        expect(menuItem.prop('selectedQuantity')).toBe(2);
    });
});
