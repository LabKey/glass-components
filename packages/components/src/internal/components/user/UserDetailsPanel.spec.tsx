import React from 'react';

import { shallow } from 'enzyme';

import { getRolesByUniqueName, processGetRolesResponse } from '../permissions/actions';
import policyJSON from '../../../test/data/security-getPolicy.json';
import rolesJSON from '../../../test/data/security-getRoles.json';
import { sleep } from '../../testHelpers';
import { initUnitTestMocks } from '../../../test/testHelperMocks';
import { JEST_SITE_ADMIN_USER_ID } from '../../../test/data/constants';

import { SecurityPolicy } from '../permissions/models';

import { TEST_USER_APP_ADMIN } from '../../userFixtures';

import { UserDetailsPanel } from './UserDetailsPanel';

beforeAll(() => {
    initUnitTestMocks();
});

const POLICY = SecurityPolicy.create(policyJSON);
const ROLES = processGetRolesResponse(rolesJSON.roles);
const ROLES_BY_NAME = getRolesByUniqueName(ROLES);

describe('<UserDetailsPanel/>', () => {
    test('no principal', async () => {
        const tree = shallow(
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={undefined}
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
            />
        );

        await sleep();

        expect(tree).toMatchSnapshot();
    });

    test('with principal no buttons because of self', async () => {
        const tree = shallow(
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={JEST_SITE_ADMIN_USER_ID} // see components/package.json "jest" config for the setting of self's userId
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                onUsersStateChangeComplete={jest.fn()}
                isSelf={true}
            />
        );

        await sleep();

        expect(tree).toMatchSnapshot();
    });

    test('with principal and buttons', async () => {
        const tree = shallow(
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={1005} // self is JEST_SITE_ADMIN_USER_ID which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        await sleep();

        expect(tree).toMatchSnapshot();
    });

    test('with principal and buttons not allowDelete or allowResetPassword', async () => {
        const tree = shallow(
            <UserDetailsPanel
                currentUser={TEST_USER_APP_ADMIN}
                userId={1005} // self is JEST_SITE_ADMIN_USER_ID which will prevent buttons from rendering
                policy={POLICY}
                rolesByUniqueName={ROLES_BY_NAME}
                allowDelete={false}
                allowResetPassword={false}
                onUsersStateChangeComplete={jest.fn()}
            />
        );

        await sleep();

        expect(tree).toMatchSnapshot();
    });
});
