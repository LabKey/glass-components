/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import React from 'react';
import { mount } from 'enzyme';

import { SECURITY_ROLE_AUTHOR, SECURITY_ROLE_EDITOR, SECURITY_ROLE_READER } from '../../../test/data/constants';

import { CreateUsersModal } from './CreateUsersModal';

const ROLE_OPTIONS = [
    { id: SECURITY_ROLE_READER, label: 'Reader (default)' },
    { id: SECURITY_ROLE_AUTHOR, label: 'Author' },
    { id: SECURITY_ROLE_EDITOR, label: 'Editor' },
];

describe('<CreateUsersModal/>', () => {
    test('default prop', () => {
        const component = <CreateUsersModal show={true} onCancel={jest.fn()} onComplete={jest.fn()} />;

        const wrapper = mount(component);
        expect(wrapper.find('Alert')).toHaveLength(0);
        expect(wrapper.find('textarea')).toHaveLength(2);
        expect(wrapper.find('textarea#create-users-email-input').props().value).toBe('');
        expect(wrapper.find('textarea#create-users-optionalMessage-input').props().value).toBe('');
        expect(wrapper.find('textarea#create-users-optionalMessage-input').props().disabled).toBe(false);
        expect(wrapper.find('Checkbox')).toHaveLength(1);
        expect(wrapper.find('Checkbox').props().checked).toBe(true);
        expect(wrapper.find('SelectInput')).toHaveLength(0);
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('.btn-success').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('with roleOptions', () => {
        const component = (
            <CreateUsersModal roleOptions={ROLE_OPTIONS} show={true} onCancel={jest.fn()} onComplete={jest.fn()} />
        );

        const wrapper = mount(component);
        expect(wrapper.find('Alert')).toHaveLength(0);
        expect(wrapper.find('textarea')).toHaveLength(2);
        expect(wrapper.find('textarea#create-users-email-input').props().value).toBe('');
        expect(wrapper.find('textarea#create-users-optionalMessage-input').props().value).toBe('');
        expect(wrapper.find('textarea#create-users-optionalMessage-input').props().disabled).toBe(false);
        expect(wrapper.find('Checkbox')).toHaveLength(1);
        expect(wrapper.find('Checkbox').props().checked).toBe(true);
        expect(wrapper.find('SelectInput')).toHaveLength(1);
        expect(wrapper.find('SelectInput').props().value).toBe(ROLE_OPTIONS[0].id);
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('.btn-success').props().disabled).toBe(false);
        wrapper.unmount();
    });

    test('with state', () => {
        const component = (
            <CreateUsersModal roleOptions={ROLE_OPTIONS} show={true} onCancel={jest.fn()} onComplete={jest.fn()} />
        );

        const wrapper = mount(component);
        wrapper.setState({
            emailText: 'TestEmailText',
            sendEmail: false,
            optionalMessage: 'TestOptionalMessage',
            role: ROLE_OPTIONS[1].id,
            isSubmitting: true,
            error: 'TestError',
        });

        expect(wrapper.find('Alert')).toHaveLength(2);
        expect(wrapper.find('textarea')).toHaveLength(2);
        expect(wrapper.find('textarea#create-users-email-input').props().value).toBe('TestEmailText');
        expect(wrapper.find('textarea#create-users-optionalMessage-input').props().value).toBe('TestOptionalMessage');
        expect(wrapper.find('textarea#create-users-optionalMessage-input').props().disabled).toBe(true);
        expect(wrapper.find('Checkbox')).toHaveLength(1);
        expect(wrapper.find('Checkbox').props().checked).toBe(false);
        expect(wrapper.find('SelectInput')).toHaveLength(1);
        expect(wrapper.find('SelectInput').props().value).toBe(ROLE_OPTIONS[1].id);
        expect(wrapper.find('.btn')).toHaveLength(2);
        expect(wrapper.find('.btn-success')).toHaveLength(1);
        expect(wrapper.find('.btn-success').props().disabled).toBe(true);
        wrapper.unmount();
    });
});
