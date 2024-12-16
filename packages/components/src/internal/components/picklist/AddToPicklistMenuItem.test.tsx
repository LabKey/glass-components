import React from 'react';

import { userEvent } from '@testing-library/user-event';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { SAMPLE_STATE_TYPE_COLUMN_NAME } from '../samples/constants';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { createMockGetQueryDetails, createMockSelectRowsDeprecatedResponse } from '../../../test/MockUtils';

import { AddToPicklistMenuItem } from './AddToPicklistMenuItem';

beforeAll(() => {
    LABKEY.moduleContext.inventory = { productId: ['FreezerManager'] };
});

jest.mock('../../query/api', () => ({
    ...jest.requireActual('../../query/api'),
    getQueryDetails: () => createMockGetQueryDetails(),
    selectRowsDeprecated: () => createMockSelectRowsDeprecatedResponse(),
}));

describe('AddToPicklistMenuItem', () => {
    const expectedText = 'Add to Picklist';
    const queryModelWithoutSelections = makeTestQueryModel(new SchemaQuery('test', 'query'));
    let queryModelWithSelections = makeTestQueryModel(new SchemaQuery('test', 'query'));
    queryModelWithSelections = queryModelWithSelections.mutate({
        rowCount: 2,
        selections: new Set(['1', '2']),
    });

    test('with queryModel', async () => {
        renderWithAppContext(<AddToPicklistMenuItem queryModel={queryModelWithSelections} user={TEST_USER_EDITOR} />);
        const menuItem = document.querySelectorAll('.lk-menu-item');
        expect(menuItem).toHaveLength(1);
        expect(menuItem[0].textContent).toBe(expectedText);

        await validateMenuItemClick(true);
        const picklistModal = document.querySelectorAll('.modal');
        expect(picklistModal).toHaveLength(1);
        expect(document.querySelector('.alert-info').textContent).toBe('Adding 2 samples to selected picklist. ');
    });

    test('with selectedIds', async () => {
        renderWithAppContext(
            <AddToPicklistMenuItem queryModel={queryModelWithoutSelections} sampleIds={['1']} user={TEST_USER_EDITOR} />
        );
        const menuItem = document.querySelectorAll('.lk-menu-item');
        expect(menuItem).toHaveLength(1);
        expect(menuItem[0].textContent).toBe(expectedText);

        await validateMenuItemClick(true);
        const picklistModal = document.querySelectorAll('.modal');
        expect(picklistModal).toHaveLength(1);
        expect(document.querySelector('.alert-info').textContent).toBe('Adding 1 sample to selected picklist. ');
    });

    test('not Editor', () => {
        renderWithAppContext(<AddToPicklistMenuItem sampleIds={['1']} user={TEST_USER_READER} />);
        expect(document.querySelectorAll('.lk-menu-item')).toHaveLength(0);
    });

    async function validateMenuItemClick(shouldOpen: boolean): Promise<void> {
        const menuItem = document.querySelectorAll('.lk-menu-item a');
        expect(menuItem).toHaveLength(1);

        expect(document.querySelectorAll('.modal')).toHaveLength(0);
        await userEvent.click(menuItem[0]);
        expect(document.querySelectorAll('.modal')).toHaveLength(shouldOpen ? 1 : 0);
    }

    test('modal open on click, queryModel without selections', async () => {
        renderWithAppContext(
            <AddToPicklistMenuItem queryModel={queryModelWithoutSelections} user={TEST_USER_EDITOR} />
        );
        await validateMenuItemClick(false);
    });

    test('modal open on click, queryModel with selections', async () => {
        renderWithAppContext(
            <AddToPicklistMenuItem queryModel={queryModelWithSelections} user={TEST_USER_EDITOR} />
        );
        await validateMenuItemClick(true);
    });

    test('modal open on click, sampleIds', async () => {
        renderWithAppContext(
            <AddToPicklistMenuItem queryModel={queryModelWithoutSelections} sampleIds={['1']} user={TEST_USER_EDITOR} />
        );
        await validateMenuItemClick(true);
    });

    test('sample with status', async () => {
        let model = makeTestQueryModel(new SchemaQuery('test', 'query'));
        model = model.mutate({
            rows: {
                '1': {
                    RowId: { value: 1 },
                    [SAMPLE_STATE_TYPE_COLUMN_NAME]: { value: 'Locked' },
                },
            },
            orderedRows: ['1'],
        });
        renderWithAppContext(<AddToPicklistMenuItem queryModel={model} sampleIds={['1']} user={TEST_USER_EDITOR} />);
        await validateMenuItemClick(true);
    });
});
