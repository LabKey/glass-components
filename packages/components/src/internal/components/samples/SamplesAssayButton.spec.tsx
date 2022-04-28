import React from 'react';
import { DropdownButton } from 'react-bootstrap';
import { ReactWrapper } from 'enzyme';

import { makeTestQueryModel } from '../../../public/QueryModel/testUtils';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryInfo } from '../../../public/QueryInfo';
import { mountWithServerContext } from '../../testHelpers';
import { TEST_USER_EDITOR, TEST_USER_READER } from '../../userFixtures';
import { SCHEMAS } from '../../schemas';
import { AssayImportSubMenuItem } from '../assay/AssayImportSubMenuItem';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../assay/actions';

import { SamplesAssayButton } from './SamplesAssayButton';

describe('SamplesAssayButton', () => {
    const DEFAULT_PROPS = {
        model: makeTestQueryModel(
            SCHEMAS.SAMPLE_SETS.SAMPLES,
            QueryInfo.create({ importUrl: 'testimporturl', insertUrl: 'testinserturl' })
        ).mutate({ selections: new Set(['1']) }),
    };

    function validate(wrapper: ReactWrapper, rendered = true, asSubMenu = false): void {
        expect(wrapper.find(DropdownButton)).toHaveLength(rendered && !asSubMenu ? 1 : 0);
        expect(wrapper.find(AssayImportSubMenuItem)).toHaveLength(rendered ? 1 : 0);
    }

    test('default props', () => {
        const wrapper = mountWithServerContext(<SamplesAssayButton {...DEFAULT_PROPS} />, { user: TEST_USER_EDITOR });
        validate(wrapper);
        expect(wrapper.find(AssayImportSubMenuItem).prop('providerType')).toBe(undefined);
        wrapper.unmount();
    });

    test('providerType', () => {
        const wrapper = mountWithServerContext(
            <SamplesAssayButton {...DEFAULT_PROPS} providerType={GENERAL_ASSAY_PROVIDER_NAME} />,
            { user: TEST_USER_EDITOR }
        );
        validate(wrapper);
        expect(wrapper.find(AssayImportSubMenuItem).prop('providerType')).toBe(GENERAL_ASSAY_PROVIDER_NAME);
        wrapper.unmount();
    });

    test('not isSamplesSchema', () => {
        const model = makeTestQueryModel(
            SchemaQuery.create('schema', 'query'),
            QueryInfo.create({ importUrl: 'testimporturl', insertUrl: 'testinserturl' })
        ).mutate({ selections: new Set(['1']) });
        const wrapper = mountWithServerContext(<SamplesAssayButton {...DEFAULT_PROPS} model={model} />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('reader', () => {
        const wrapper = mountWithServerContext(<SamplesAssayButton {...DEFAULT_PROPS} />, { user: TEST_USER_READER });
        validate(wrapper, false);
        wrapper.unmount();
    });

    test('asSubMenu', () => {
        const wrapper = mountWithServerContext(<SamplesAssayButton {...DEFAULT_PROPS} asSubMenu />, {
            user: TEST_USER_EDITOR,
        });
        validate(wrapper, true, true);
        wrapper.unmount();
    });
});
