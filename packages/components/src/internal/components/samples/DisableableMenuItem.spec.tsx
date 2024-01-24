import React from 'react';

import { mount, ReactWrapper } from 'enzyme';

import { DisableableMenuItem } from './DisableableMenuItem';

describe('DisableableMenuItem', () => {
    function validate(wrapper: ReactWrapper, disabled: boolean, menuContent: string, menuProps: any = undefined) {
        const menuItem = wrapper.find('MenuItem');
        expect(menuItem.exists()).toBeTruthy();
        if (disabled) {
            expect(menuItem.prop('disabled')).toBeTruthy();
            if (menuProps) {
                Object.keys(menuProps).forEach(prop => {
                    expect(menuItem.prop(prop)).toBeFalsy();
                });
            }
        } else {
            expect(menuItem.prop('disabled')).toBeFalsy();
            if (menuProps) {
                Object.keys(menuProps).forEach(prop => {
                    expect(menuItem.prop(prop)).toBe(menuProps[prop]);
                });
            }
        }

        expect(menuItem.text()).toBe(menuContent);
    }

    test('operation permitted', () => {
        const content = 'Test Operation';
        const wrapper = mount(<DisableableMenuItem operationPermitted>{content}</DisableableMenuItem>);
        validate(wrapper, false, content);
    });

    test('operation permitted, menu props', () => {
        const onClick = jest.fn();
        const wrapper = mount(
            <DisableableMenuItem operationPermitted onClick={onClick}>
                <span>Test Operation</span>
            </DisableableMenuItem>
        );
        validate(wrapper, false, 'Test Operation', { onClick });
    });

    test('disabled', () => {
        const wrapper = mount(
            <DisableableMenuItem operationPermitted={false} onClick={jest.fn()}>
                <div>Other test</div>
            </DisableableMenuItem>
        );
        validate(wrapper, true, 'Other test', { onClick: undefined });
    });

    test('disabled, alternate overlay placement', () => {
        const content = 'Other test';
        const onClick = jest.fn();
        const wrapper = mount(
            <DisableableMenuItem onClick={onClick} operationPermitted={false} placement="right">
                {content}
            </DisableableMenuItem>
        );
        validate(wrapper, true, content, { onClick });
    });
});
