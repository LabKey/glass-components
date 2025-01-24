import React, { act } from 'react';

import { fromJS } from 'immutable';

import { TEST_USER_APP_ADMIN } from '../userFixtures';

import { renderWithAppContext } from '../test/reactTestLibraryHelpers';

import { UserDetailsRenderer } from './UserDetailsRenderer';
import { TEST_LKS_STARTER_MODULE_CONTEXT, TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT } from '../productFixtures';

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

    test('with styling, not enabled', async () => {
        // eslint-disable-next-line require-await
        await act(async () =>
            renderWithAppContext(
                <UserDetailsRenderer
                    data={fromJS({
                        value: 1,
                        displayValue: 'test',
                        style: ';color: #7b64ff;background-color: #fe9200 !important;',
                    })}
                />,
                {
                    serverContext: {
                        moduleContext: TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
                        user: TEST_USER_APP_ADMIN,
                    },
                }
            )
        );
        expect(document.querySelector('.status-pill')).toBeNull();
    });

    test('with styling, enabled no background color', async () => {
        // eslint-disable-next-line require-await
        await act(async () =>
            renderWithAppContext(
                <UserDetailsRenderer
                    data={fromJS({
                        value: 1,
                        displayValue: 'test',
                        style: ';color: #7b64ff',
                    })}
                />,
                {
                    serverContext: {
                        moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
                        user: TEST_USER_APP_ADMIN,
                    },
                })
        );
        expect(document.querySelector('span').getAttribute('style')).toBe('color: rgb(123, 100, 255);',);
    });

    test('with styling, enabled with background color', async () => {
        // eslint-disable-next-line require-await
        await act(async () =>
            renderWithAppContext(
                <UserDetailsRenderer
                    data={fromJS({
                        value: 1,
                        displayValue: 'test',
                        style: ';font-style: italic;background-color: #fe9200 !important;',
                    })}
                />,
                {
                    serverContext: {
                        moduleContext: TEST_LKS_STARTER_MODULE_CONTEXT,
                        user: TEST_USER_APP_ADMIN,
                    },
                }
            )
        );
        const span = document.querySelector('.status-pill');
        expect(span).not.toBeNull();
        expect(span.getAttribute('style')).toBe('font-style: italic; background-color: rgb(254, 146, 0);');
    });
});
