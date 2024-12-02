import React from 'react';

import { fromJS } from 'immutable';

import { TEST_USER_APP_ADMIN } from '../userFixtures';

import { renderWithAppContext } from '../test/reactTestLibraryHelpers';

import { UserDetailsRenderer } from './UserDetailsRenderer';

describe('UserDetailsRenderer', () => {
    test('no data, undefined', () => {
        renderWithAppContext(<UserDetailsRenderer data={undefined} />, {
            serverContext: { user: TEST_USER_APP_ADMIN },
        });
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
    });

    test('no data, null', () => {
        renderWithAppContext(<UserDetailsRenderer data={null} />, { serverContext: { user: TEST_USER_APP_ADMIN } });
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
    });

    test('no data, empty', () => {
        renderWithAppContext(<UserDetailsRenderer data={fromJS({})} />, {
            serverContext: { user: TEST_USER_APP_ADMIN },
        });
        expect(document.querySelectorAll('.user-link')).toHaveLength(0);
    });

    test('with data', () => {
        renderWithAppContext(<UserDetailsRenderer data={fromJS({ value: 1, displayValue: 'test' })} />, {
            serverContext: { user: TEST_USER_APP_ADMIN },
        });

        expect(document.querySelectorAll('.user-link')).toHaveLength(1);
    });
});
