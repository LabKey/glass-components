import React from 'react';

import { render } from '@testing-library/react';

import { TEST_USER_EDITOR, TEST_USER_FOLDER_ADMIN } from '../../userFixtures';

import { getProjectBeginUrl, ProductLKSDrawer } from './ProductLKSDrawer';
import { ContainerTabModel } from './models';

const DEFAULT_PROPS = {
    showHome: true,
    tabs: [],
};

const VISIBLE_TAB_1 = new ContainerTabModel({ id: 'tab1', text: 'Tab 1', disabled: false });
const VISIBLE_TAB_2 = new ContainerTabModel({ id: 'tab2', text: 'Tab 2', disabled: false });
const DISABLED_TAB = new ContainerTabModel({ id: 'tab3', text: 'Tab 3', disabled: true });

beforeEach(() => {
    LABKEY.homeContainer = 'home';
    LABKEY.project.id = 'test';
    LABKEY.project.name = 'test';
    LABKEY.project.title = 'Test project';
    LABKEY.container.id = 'test';
    LABKEY.container.path = '/test';
    LABKEY.container.title = 'Test project';
});

describe('ProductLKSDrawer', () => {
    function validate(containerItemCount: number, tabItemCount = 0) {
        expect(document.querySelectorAll('.menu-transition-left')).toHaveLength(1);
        expect(document.querySelectorAll('.container-item')).toHaveLength(containerItemCount);
        expect(document.querySelectorAll('.container-icon')).toHaveLength(containerItemCount);
        expect(document.querySelectorAll('.container-tabs')).toHaveLength(1);
        expect(document.querySelectorAll('.clickable-item')).toHaveLength(tabItemCount);
        if (tabItemCount <= 1) {
            expect(document.querySelector('.empty').textContent).toContain('No tabs have been added to this folder.');
        }
    }

    test('home not available, no tabs, admin', () => {
        LABKEY.user = TEST_USER_FOLDER_ADMIN;
        render(<ProductLKSDrawer {...DEFAULT_PROPS} showHome={false} />);
        validate(1, 0);
        expect(document.querySelectorAll('.how-to')).toHaveLength(1);
    });

    test('home not available, no tabs, non admin', () => {
        LABKEY.user = TEST_USER_EDITOR;
        render(<ProductLKSDrawer {...DEFAULT_PROPS} showHome={false} />);
        validate(1, 0);
        expect(document.querySelectorAll('.how-to')).toHaveLength(0);
    });

    test('no visibleTabs, only 1 not disabled', () => {
        render(<ProductLKSDrawer {...DEFAULT_PROPS} tabs={[VISIBLE_TAB_1, DISABLED_TAB]} />);
        validate(2, 0);
    });

    test('visibleTabs', () => {
        render(<ProductLKSDrawer {...DEFAULT_PROPS} tabs={[VISIBLE_TAB_1, VISIBLE_TAB_2, DISABLED_TAB]} />);
        validate(2, 2);
        expect(document.querySelectorAll('.clickable-item')[0].textContent).toBe('Tab 1');
        expect(document.querySelectorAll('.clickable-item')[1].textContent).toBe('Tab 2');
    });

    test('showHome', () => {
        render(<ProductLKSDrawer {...DEFAULT_PROPS} showHome={true} />);
        validate(2);
        expect(document.querySelectorAll('.container-item')[0].textContent).toBe('LabKey Home');
        expect(document.querySelectorAll('.container-item')[1].textContent).toBe(LABKEY.container.title);
    });

    test('disableContainer link', () => {
        render(<ProductLKSDrawer {...DEFAULT_PROPS} disableLKSContainerLink={true} showHome={true} />);
        validate(2);
        expect(document.querySelectorAll('.container-item')[0].textContent).toBe('LabKey Home');
        expect(document.querySelectorAll('.container-item')[1].textContent).toBe(LABKEY.container.title);
    });

    test('in home project', () => {
        LABKEY.project.id = 'home';
        LABKEY.project.name = 'home';
        LABKEY.project.title = 'Home';
        LABKEY.container.id = 'home';
        LABKEY.container.path = '/home';
        LABKEY.container.title = 'Home';
        render(<ProductLKSDrawer {...DEFAULT_PROPS} disableLKSContainerLink={true} showHome={true} />);
        validate(1);
        expect(document.querySelectorAll('.container-item')[0].textContent).toBe('LabKey Home');
    });

    test('in home project subfolder link enabled', () => {
        LABKEY.project.id = 'home';
        LABKEY.project.name = 'home';
        LABKEY.project.title = 'Home';
        LABKEY.container.id = 'testSub';
        LABKEY.container.path = '/home/testSub';
        LABKEY.container.title = 'Test subfolder';
        render(<ProductLKSDrawer {...DEFAULT_PROPS} showHome={true} />);
        validate(2);
        expect(document.querySelectorAll('.container-item')[0].textContent).toBe('LabKey Home');
        expect(document.querySelectorAll('.container-item')[1].textContent).toBe('Test subfolder');
    });

    test('in other project subfolder', () => {
        LABKEY.project.id = 'test';
        LABKEY.project.name = 'test';
        LABKEY.project.title = 'Test';
        LABKEY.container.id = 'testSub';
        LABKEY.container.path = '/test/testSub';
        LABKEY.container.title = 'Test subfolder';
        render(<ProductLKSDrawer {...DEFAULT_PROPS} showHome={true} />);
        validate(2);
        expect(document.querySelectorAll('.container-item')[1].textContent).toBe('Test subfolder');
    });

    test('getProjectBeginUrl', () => {
        LABKEY.container = {};
        expect(getProjectBeginUrl(undefined)).toBe('/labkey/project/begin.view');
        expect(getProjectBeginUrl('test')).toBe('/labkey/project/test/begin.view');
    });
});
