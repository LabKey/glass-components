import React from 'react';

import { render } from '@testing-library/react';

import { waitFor } from '@testing-library/dom';

import { TEST_USER_READER } from '../../userFixtures';

import { getTestAPIWrapper } from '../../APIWrapper';

import { getQueryTestAPIWrapper } from '../../query/APIWrapper';
import { makeQueryInfo } from '../../test/testHelpers';
import usersQueryInfo from '../../../test/data/users-getQueryDetails.json';

import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
    test('without state, except queryInfo', async () => {
        const QUERY_INFO = makeQueryInfo(usersQueryInfo);
        const API = getTestAPIWrapper(jest.fn, {
            query: getQueryTestAPIWrapper(jest.fn, {
                getQueryDetails: jest.fn().mockResolvedValue(QUERY_INFO),
            }),
        });

        render(
            <UserProfile
                api={API}
                user={TEST_USER_READER}
                userProperties={{}}
                onSuccess={jest.fn()}
                setIsDirty={jest.fn()}
            />
        );

        await waitFor(() => {
            expect(document.querySelectorAll('.user-section-header')).toHaveLength(2);
        });
        expect(document.querySelectorAll('img')).toHaveLength(1);
        expect(document.querySelectorAll('.user-text-link')).toHaveLength(0);
        expect(document.querySelectorAll('button')).toHaveLength(1);

        const inputs = document.querySelectorAll('input');
        expect(inputs).toHaveLength(6); // 1 file and 5 text inputs
        expect(inputs[0].hasAttribute('disabled')).toBe(false);
        expect(inputs[1].hasAttribute('disabled')).toBe(true); // email
        expect(inputs[2].hasAttribute('disabled')).toBe(false);
        expect(inputs[3].hasAttribute('disabled')).toBe(false);
        expect(inputs[4].hasAttribute('disabled')).toBe(false);
        expect(inputs[5].hasAttribute('disabled')).toBe(false);
    });
});
