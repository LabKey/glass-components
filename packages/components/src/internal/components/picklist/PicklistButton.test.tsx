import React from 'react';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { TEST_USER_EDITOR } from '../../userFixtures';
import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { PicklistButton } from './PicklistButton';

describe('PicklistButton', () => {
    test('with model no selections', () => {
        const queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));
        const featureArea = 'featureArea';
        renderWithAppContext(
            <PicklistButton model={queryModel} user={TEST_USER_EDITOR} metricFeatureArea={featureArea} />,
            { serverContext: { user: TEST_USER_EDITOR } }
        );
        expect(document.querySelector('button').textContent).toBe('Picklists');
        expect(document.querySelectorAll('.dropdown-header')).toHaveLength(0);
        const menuItem = document.querySelectorAll('.lk-menu-item');
        expect(menuItem).toHaveLength(2);
        expect(menuItem[0].textContent).toBe('Add to Picklist');
        expect(menuItem[1].textContent).toBe('Create a New Picklist');
    });

    test('asSubMenu', () => {
        const queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));
        const featureArea = 'featureArea';
        renderWithAppContext(
            <PicklistButton model={queryModel} user={TEST_USER_EDITOR} metricFeatureArea={featureArea} asSubMenu />,
            { serverContext: { user: TEST_USER_EDITOR } }
        );
        expect(document.querySelectorAll('button')).toHaveLength(0);
        expect(document.querySelector('.dropdown-header').textContent).toBe('Picklists');
        expect(document.querySelectorAll('.lk-menu-item')).toHaveLength(2);
        expect(document.querySelectorAll('.lk-menu-item')[0].textContent).toBe('Add to Picklist');
        expect(document.querySelectorAll('.lk-menu-item')[1].textContent).toBe('Create a New Picklist');
    });

    test('with model and selections', () => {
        let queryModel = makeTestQueryModel(new SchemaQuery('test', 'query'));
        queryModel = queryModel.mutate({ selections: new Set(['1', '2']) });
        renderWithAppContext(<PicklistButton model={queryModel} user={TEST_USER_EDITOR} />, {
            serverContext: {
                user: TEST_USER_EDITOR,
            },
        });
        const menuItem = document.querySelectorAll('.lk-menu-item');
        expect(menuItem).toHaveLength(2);
        expect(menuItem[0].textContent).toBe('Add to Picklist');
        expect(menuItem[1].textContent).toBe('Create a New Picklist');
    });
});
