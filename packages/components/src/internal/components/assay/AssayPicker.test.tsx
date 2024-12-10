import React from 'react';

import { waitFor } from '@testing-library/dom';

import { userEvent } from '@testing-library/user-event';

import getAssayDesignSectionOptions from '../../../test/data/assay-getAssayDesignSelectOptions.json';

import { renderWithAppContext } from '../../test/reactTestLibraryHelpers';

import { AssayPicker, AssayPickerTabs } from './AssayPicker';

const load = (): Promise<any> => {
    return Promise.resolve(getAssayDesignSectionOptions);
};

describe('AssayPicker', () => {
    test('AssayPicker', async () => {
        renderWithAppContext(
            <AssayPicker loadOptions={load} hasPremium onChange={jest.fn()} showContainerSelect showImport />
        );

        await waitFor(() => {
            expect(document.querySelectorAll('.nav-tabs li')).toHaveLength(3);
        });

        // Verify all three tabs shown and standard assay selected
        expect(document.querySelectorAll('.nav-tabs li')[0].getAttribute('class')).toEqual('active');
        expect(document.querySelectorAll('#assay-type-select-container')).toHaveLength(3);

        // Click import tab and verify it's shown
        expect(document.querySelectorAll('.nav-tabs li.active a#assay-picker-tabs-tab-import')).toHaveLength(0);
        const importTab = document.querySelectorAll('.nav-tabs li a')[2];
        await userEvent.click(importTab);
        expect(document.querySelectorAll('.nav-tabs li')[2].getAttribute('class')).toEqual('active');
        expect(document.querySelectorAll('.file-upload__container')).toHaveLength(1);
    });

    test('AssayPicker No Import, No Container, Selected Specialty tab, No premium', async () => {
        renderWithAppContext(
            <AssayPicker
                defaultTab={AssayPickerTabs.SPECIALTY_ASSAY_TAB}
                hasPremium={false}
                loadOptions={load}
                onChange={jest.fn()}
                showContainerSelect={false}
                showImport={false}
            />
        );

        await waitFor(() => {
            expect(document.querySelectorAll('.nav-tabs li')).toHaveLength(2);
        });

        // Verify only two tabs and specialty tab selected
        expect(document.querySelectorAll('.nav-tabs li')).toHaveLength(2);
        expect(document.querySelectorAll('.nav-tabs li')[0].textContent).toEqual('Standard Assay');
        expect(document.querySelectorAll('.nav-tabs li')[1].textContent).toEqual('Specialty Assays');
        expect(document.querySelectorAll('.nav-tabs li')[1].getAttribute('class')).toEqual('active');
        expect(document.querySelectorAll('#assay-type-select-container')).toHaveLength(0);
        expect(document.querySelectorAll('.alert-info')).toHaveLength(1);
    });
});
