import React from 'react';

import { render } from '@testing-library/react';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';

import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';

beforeAll(() => {
    LABKEY.moduleContext.inventory = { productId: ['FreezerManager'] };
});

describe('PicklistCreationMenuItem', () => {
    const text = 'Picklist';

    test('editor, as menu item', () => {
        render(<PicklistCreationMenuItem itemText={text} user={TEST_USER_EDITOR} asMenuItem />);
        const menuItem = document.querySelectorAll('.lk-menu-item');
        expect(menuItem).toHaveLength(1);
        expect(menuItem[0].textContent).toBe(text);
        expect(document.querySelectorAll('.modal')).toHaveLength(0);
    });

    test('editor, not as menu item', () => {
        render(<PicklistCreationMenuItem itemText={text} user={TEST_USER_EDITOR} />);
        expect(document.querySelectorAll('.lk-menu-item')).toHaveLength(0);
        expect(document.querySelector('button').textContent).toBe(text);
        expect(document.querySelectorAll('.modal')).toHaveLength(0);
    });

    test('not Editor', () => {
        render(<PicklistCreationMenuItem itemText={text} user={TEST_USER_READER} asMenuItem />);
        expect(document.querySelectorAll('.lk-menu-item')).toHaveLength(0);
    });
});
