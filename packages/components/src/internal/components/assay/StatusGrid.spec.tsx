import { mount, shallow } from 'enzyme';
import React from 'react';

import { Filter } from '@labkey/api';

import { StatusGrid, StatusGridWithModels } from './StatusGrid';
import { mountWithServerContext } from '../../testHelpers';
import { TEST_USER_EDITOR } from '../../../test/data/users';

describe('StatusGrid', () => {
    const validate = (filter: Filter.IFilter[], filterType: string, value: string[], filterLength: number) => {
        expect(filter.length).toBe(filterLength);
        expect(filter[0].getColumnName()).toBe('Type');
        expect(filter[0].getFilterType().getDisplayText()).toBe(filterType);
        expect(filter[0].getValue()).toEqual(value);
    };

    // If assayTypes exists, col filter on Type should be those in assayTypes
    test('StatusGrid assayTypes', () => {
        const wrapper = mountWithServerContext(<StatusGrid assayTypes={['General']} />, {user: TEST_USER_EDITOR});
        const statusGridWithModelsProps = wrapper.find(StatusGridWithModels).props();

        const activeFilter = statusGridWithModelsProps.queryConfigs.active.baseFilters;
        validate(activeFilter, 'Equals One Of', ['General'], 2);

        const allFilter = statusGridWithModelsProps.queryConfigs.all.baseFilters;
        validate(allFilter, 'Equals One Of', ['General'], 1);

        wrapper.unmount();
    });

    // If excludedAssayProviders exists, col filter on Type should be those not in excludedAssayProviders
    test('StatusGrid excludedAssayProviders', () => {
        const wrapper = mountWithServerContext(<StatusGrid excludedAssayProviders={['Luminex']} />, {user: TEST_USER_EDITOR});
        const statusGridWithModelsProps = wrapper.find(StatusGridWithModels).props();

        const activeFilter = statusGridWithModelsProps.queryConfigs.active.baseFilters;
        validate(activeFilter, 'Does Not Equal Any Of', ['Luminex'], 2);

        const allFilter = statusGridWithModelsProps.queryConfigs.all.baseFilters;
        validate(allFilter, 'Does Not Equal Any Of', ['Luminex'], 1);

        wrapper.unmount();
    });

    // If both exist, only assayTypes is used
    test('StatusGrid assayTypes and excludedAssayProviders', () => {
        const wrapper = mountWithServerContext(<StatusGrid assayTypes={['General']} excludedAssayProviders={['Luminex']} />, {user: TEST_USER_EDITOR});
        const statusGridWithModelsProps = wrapper.find(StatusGridWithModels).props();

        const activeFilter = statusGridWithModelsProps.queryConfigs.active.baseFilters;
        validate(activeFilter, 'Equals One Of', ['General'], 2);

        const allFilter = statusGridWithModelsProps.queryConfigs.all.baseFilters;
        validate(allFilter, 'Equals One Of', ['General'], 1);

        wrapper.unmount();
    });

    // If neither exist, no col filter on Type is used
    test('StatusGrid assayTypes nor excludedAssayProviders', () => {
        const wrapper = mountWithServerContext(<StatusGrid />, {user: TEST_USER_EDITOR});
        const statusGridWithModelsProps = wrapper.find(StatusGridWithModels).props();

        const activeFilter = statusGridWithModelsProps.queryConfigs.active.baseFilters;
        expect(activeFilter.length).toBe(1);

        const allFilter = statusGridWithModelsProps.queryConfigs.all.baseFilters;
        expect(allFilter).toEqual([]);

        wrapper.unmount();
    });
});
