import React from 'react';
import { mount } from 'enzyme';
import { Button } from 'react-bootstrap';

import { TEST_USER_READER } from '../../userFixtures';
import { initUnitTestMocks } from '../../../test/testHelperMocks';

import { getQueryDetails } from '../../query/api';
import { SCHEMAS } from '../../schemas';
import { FileInput } from '../forms/input/FileInput';
import { TextInput } from '../forms/input/TextInput';

import { UserProfile } from './UserProfile';

beforeAll(() => {
    initUnitTestMocks();
});

describe('<UserProfile/>', () => {
    test('without state, except queryInfo', () => {
        return getQueryDetails(SCHEMAS.CORE_TABLES.USERS).then(queryInfo => {
            const wrapper = mount(
                <UserProfile user={TEST_USER_READER} userProperties={{}} onSuccess={jest.fn()} onCancel={jest.fn()} />
            );

            wrapper.setState({ queryInfo });

            expect(wrapper.find('.user-section-header')).toHaveLength(2);
            expect(wrapper.find('img')).toHaveLength(1);
            expect(wrapper.find(FileInput)).toHaveLength(1);
            expect(wrapper.find('.user-text-link')).toHaveLength(0);
            expect(wrapper.find(TextInput)).toHaveLength(5);
            expect(wrapper.find('input').findWhere(input => input.prop('disabled'))).toHaveLength(1); // email disabled
            expect(wrapper.find(Button)).toHaveLength(2);

            wrapper.unmount();
        });
    });
});
