import { mount } from 'enzyme';
import React from 'react';

import { Button, Checkbox } from 'react-bootstrap';

import { ConfirmModal, LoadingSpinner } from '../../..';

import { waitForLifecycle } from '../../testHelpers';

import { NameIdSettingsForm } from './NameIdSettings';

describe('NameIdSettings', () => {
    const DEFAULT_PROPS = {
        init: jest.fn(async () => {
            return { prefix: 'ABC', allowUserSpecifiedNames: false };
        }),
        save: jest.fn(async () => {}),
    };

    test('on init', async () => {
        const wrapper = mount(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        expect(wrapper.find(LoadingSpinner).length).toEqual(2);
        expect(wrapper.find('.prefix-field').exists()).toEqual(false);
        expect(wrapper.find(Checkbox).exists()).toEqual(false);

        await waitForLifecycle(wrapper);

        expect(wrapper.find(LoadingSpinner).length).toEqual(0);
        expect(wrapper.find('.prefix-field').exists()).toEqual(true);
        expect(wrapper.find(Checkbox).exists()).toEqual(true);
        expect(DEFAULT_PROPS.init).toHaveBeenCalled();
    });

    test('allowUserSpecifiedNames checkbox', async () => {
        const wrapper = mount(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);

        const checkbox = () => wrapper.find('input').first();
        expect(checkbox().prop('checked')).toBe(false);

        checkbox().simulate('change', { target: { checked: true } });

        await waitForLifecycle(wrapper);
        expect(DEFAULT_PROPS.save).toHaveBeenCalled();
        expect(checkbox().prop('checked')).toBe(true);
    });

    test('prefix preview', async () => {
        const wrapper = mount(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);

        expect(wrapper.find('.prefix-example').text()).toContain('ABC-Blood-${GenId}');
    });

    test('apply prefix confirm modal -- cancel', async () => {
        const wrapper = mount(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);

        wrapper.find(Button).simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(true);
        wrapper.find('.close').simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(false);
    });

    test('apply prefix confirm modal -- save', async () => {
        const wrapper = mount(<NameIdSettingsForm {...DEFAULT_PROPS} />);
        await waitForLifecycle(wrapper);

        wrapper.find(Button).simulate('click');
        expect(wrapper.find(ConfirmModal).exists()).toEqual(true);

        // Click on 'Yes, Save and Apply Prefix' button
        wrapper.find(Button).last().simulate('click');
        expect(DEFAULT_PROPS.save).toHaveBeenCalled();
    });
});
