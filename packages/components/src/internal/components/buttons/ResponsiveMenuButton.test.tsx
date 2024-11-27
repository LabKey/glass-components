import React from 'react';

import { PicklistButton } from '../picklist/PicklistButton';
import { TEST_USER_READER } from '../../userFixtures';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { ResponsiveMenuButton } from './ResponsiveMenuButton';

describe('ResponsiveMenuButton', () => {
    const items = <PicklistButton model={makeTestQueryModel(new SchemaQuery('s', 'q'))} user={TEST_USER_READER} />;
    const DEFAULT_PROPS = {
        className: 'test-className',
        text: 'Test Menu',
    };

    test('default props', () => {
        renderWithAppContext(<ResponsiveMenuButton {...DEFAULT_PROPS}>{items}</ResponsiveMenuButton>, {
            serverContext: { user: TEST_USER_READER },
        });
        expect(document.querySelectorAll('button')).toHaveLength(1);
        expect(document.querySelectorAll('.lk-dropdown-header')).toHaveLength(0);
    });

    test('asSubMenu', () => {
        renderWithAppContext(
            <ResponsiveMenuButton {...DEFAULT_PROPS} asSubMenu>
                {items}
            </ResponsiveMenuButton>,
            {
                serverContext: { user: TEST_USER_READER },
            }
        );
        expect(document.querySelectorAll('button')).toHaveLength(0);
        expect(document.querySelectorAll('.lk-dropdown-header')).toHaveLength(1);
    });
});
