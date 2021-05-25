import React from 'react';

import { mount } from 'enzyme';
import { MenuItem, Modal } from 'react-bootstrap';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../../test/data/users';

import { PicklistCreationMenuItem } from './PicklistCreationMenuItem';

describe('PicklistCreationMenuItem', () => {
    const key = 'picklists';
    const selectionKey = 'test-selection';
    const selectedQuantity = 4;
    const text = 'Picklist';

    test('modal hidden', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem
                itemText={text}
                selectionKey={selectionKey}
                selectedQuantity={selectedQuantity}
                key={key}
                user={TEST_USER_EDITOR}
            />
        );
        const menuItem = wrapper.find(MenuItem);
        expect(menuItem).toHaveLength(1);
        expect(menuItem.text()).toBe(text);
        const memoWrapper = wrapper.find('Memo()');
        expect(memoWrapper).toHaveLength(1);
        expect(memoWrapper.prop('selectionKey')).toBe(selectionKey);
        expect(memoWrapper.prop('selectedQuantity')).toBe(selectedQuantity);
        const modal = memoWrapper.find(Modal);
        expect(modal).toHaveLength(1);
        expect(modal.prop('show')).toBe(false);
        wrapper.unmount();
    });

    test('modal shown', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem
                itemText={text}
                selectionKey={selectionKey}
                selectedQuantity={selectedQuantity}
                key={key}
                user={TEST_USER_EDITOR}
            />
        );
        const menuItem = wrapper.find('MenuItem a');
        expect(menuItem).toHaveLength(1);
        menuItem.simulate('click');
        const modal = wrapper.find(Modal);
        expect(modal).toHaveLength(1);
        expect(modal.prop('show')).toBe(true);
        wrapper.unmount();
    });

    test('not Editor', () => {
        const wrapper = mount(
            <PicklistCreationMenuItem
                itemText={text}
                selectionKey={selectionKey}
                selectedQuantity={selectedQuantity}
                key={key}
                user={TEST_USER_READER}
            />
        );
        expect(wrapper.find('MenuItem')).toHaveLength(0);
        wrapper.unmount();
    });

    test('not enabled for Biologics', () => {
        LABKEY.moduleContext = {
            biologics: {}
        };

        const wrapper = mount(
            <PicklistCreationMenuItem
                itemText={text}
                selectionKey={selectionKey}
                selectedQuantity={selectedQuantity}
                key={key}
                user={TEST_USER_READER}
            />
        );
        expect(wrapper.find('MenuItem')).toHaveLength(0);
        wrapper.unmount();
    });
});
