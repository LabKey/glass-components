import React from 'react';

import { LoadingSpinner } from '../base/LoadingSpinner';
import {mountWithAppServerContext, waitForLifecycle} from '../../testHelpers';

import { getTestAPIWrapper } from '../../APIWrapper';

import { getSamplesTestAPIWrapper } from '../samples/APIWrapper';

import { SAVED_VIEW1, SAVED_VIEW2 } from './SampleFinderManageViewsModal.spec';
import { FinderReport } from './models';
import { SampleFinderSavedViewsMenu } from './SampleFinderSavedViewsMenu';

const DEFAULT_PROPS = {
    loadSearch: jest.fn(),
    saveSearch: jest.fn(),
    manageSearches: jest.fn(),
    key: 'search-1',
};

export const getSampleFinderAPI = (savedViews: FinderReport[]) => {
    return getTestAPIWrapper(jest.fn, {
        samples: getSamplesTestAPIWrapper(jest.fn, {
            loadFinderSearches: () => Promise.resolve(savedViews),
        }),
    });
};

describe('SampleFinderSavedViewsMenu', () => {
    function verifyMenu(
        wrapper,
        savedViews: string[],
        sessionView?: string,
        isManageEnabled?: boolean,
        isSaveEnabled?: boolean
    ): void {
        const dropdown = wrapper.find('DropdownButton');
        const menuOptions = dropdown.at(0).find('MenuItem');

        let menuCount = 0;

        if (sessionView) {
            expect(menuOptions.at(0).text()).toBe('Most Recent Search');
            expect(menuOptions.at(1).text()).toBe(sessionView);
            menuCount += 3; // include divider
        }

        if (savedViews?.length > 0) {
            savedViews.forEach(savedView => {
                expect(menuOptions.at(menuCount++).text()).toBe(savedView);
            });
        } else {
            expect(menuOptions.at(menuCount++).text()).toBe('No Saved Search');
        }

        menuCount++; // include divider

        const manageViewOption = menuOptions.at(menuCount++);
        expect(manageViewOption.text()).toBe('Manage saved searches');
        if (!isManageEnabled) expect(manageViewOption.props().disabled).toBeTruthy();

        const saveViewOption = menuOptions.at(menuCount++);
        expect(saveViewOption.text()).toBe('Save as custom search');
        if (!isSaveEnabled) expect(saveViewOption.props().disabled).toBeTruthy();
    }

    function verifySaveBtn(wrapper, canSave?: boolean, canSaveExisting?: boolean): void {
        if (canSaveExisting) {
            const dropdown = wrapper.find('DropdownButton');
            const menuOptions = dropdown.at(1).find('MenuItem');
            expect(menuOptions.at(0).text()).toBe('Save this search');
            expect(menuOptions.at(1).text()).toBe('Save as a new search');
        } else if (canSave) {
            const btn = wrapper.find('Button');
            expect(btn.at(1).text()).toBe('Save Search');
        }
    }

    test('without session view, without saved view', async () => {
        const wrapper = mountWithAppServerContext(<SampleFinderSavedViewsMenu {...DEFAULT_PROPS} />, {
            api: getSampleFinderAPI([]),
        });

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        verifyMenu(wrapper, [], null, false, false);

        verifySaveBtn(wrapper, false, false);

        wrapper.unmount();
    });

    test('without view, without saved view', async () => {
        const wrapper = mountWithAppServerContext(<SampleFinderSavedViewsMenu {...DEFAULT_PROPS} sessionViewName="Searched today" />, {
            api: getSampleFinderAPI([]),
        });

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        verifyMenu(wrapper, [], 'Searched today', false, false);
        verifySaveBtn(wrapper, false, false);

        wrapper.unmount();
    });

    test('without session view, with saved views', async () => {
        const wrapper = mountWithAppServerContext(<SampleFinderSavedViewsMenu {...DEFAULT_PROPS} />, {
            api: getSampleFinderAPI([SAVED_VIEW1, SAVED_VIEW2]),
        });

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        verifyMenu(wrapper, ['Text1', 'source2'], null, true, false);
        verifySaveBtn(wrapper, false, false);

        wrapper.unmount();
    });

    test('with session view, with saved views', async () => {
        const wrapper = mountWithAppServerContext(<SampleFinderSavedViewsMenu {...DEFAULT_PROPS} sessionViewName="Searched today" />, {
            api: getSampleFinderAPI([SAVED_VIEW1, SAVED_VIEW2]),
        });

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        verifyMenu(wrapper, ['Text1', 'source2'], 'Searched today', true, false);
        verifySaveBtn(wrapper, false, false);

        wrapper.unmount();
    });

    test('current view is session view', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleFinderSavedViewsMenu
                {...DEFAULT_PROPS}
                sessionViewName="Searched today"
                currentView={{
                    reportName: 'Searched today',
                    isSession: true,
                }}
                hasUnsavedChanges={true}
            />, {
            api: getSampleFinderAPI([SAVED_VIEW1, SAVED_VIEW2]),
        });

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        verifyMenu(wrapper, ['Text1', 'source2'], 'Searched today', true, true);
        verifySaveBtn(wrapper, true, false);

        wrapper.unmount();
    });

    test('current view is saved view, without edit', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleFinderSavedViewsMenu
                {...DEFAULT_PROPS}
                sessionViewName="Searched today"
                currentView={SAVED_VIEW1}
                hasUnsavedChanges={false}
            />, {
                api: getSampleFinderAPI([SAVED_VIEW1, SAVED_VIEW2]),
            });

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        verifyMenu(wrapper, ['Text1', 'source2'], 'Searched today', true, true);
        verifySaveBtn(wrapper, false, false);

        wrapper.unmount();
    });

    test('current view is saved view, with edit', async () => {
        const wrapper = mountWithAppServerContext(
            <SampleFinderSavedViewsMenu
                {...DEFAULT_PROPS}
                sessionViewName="Searched today"
                currentView={SAVED_VIEW1}
                hasUnsavedChanges={true}
            />, {
                api: getSampleFinderAPI([SAVED_VIEW1, SAVED_VIEW2]),
            });

        expect(wrapper.find(LoadingSpinner).exists()).toEqual(true);
        await waitForLifecycle(wrapper);
        expect(wrapper.find(LoadingSpinner).exists()).toEqual(false);

        verifyMenu(wrapper, ['Text1', 'source2'], 'Searched today', true, true);
        verifySaveBtn(wrapper, true, true);

        wrapper.unmount();
    });
});
