import React, { FC } from 'react';
import { mount } from 'enzyme';

import { List, Map } from 'immutable';

import { MenuSectionConfig, User } from '../..';

import {
    TEST_USER_APP_ADMIN,
    TEST_USER_ASSAY_DESIGNER,
    TEST_USER_AUTHOR,
    TEST_USER_EDITOR,
    TEST_USER_FOLDER_ADMIN,
    TEST_USER_GUEST,
    TEST_USER_READER,
    TEST_USER_STORAGE_DESIGNER,
    TEST_USER_STORAGE_EDITOR,
} from '../../test/data/users';

import {
    addAssaysSectionConfig,
    addSamplesSectionConfig,
    addSourcesSectionConfig,
    biologicsIsPrimaryApp,
    getProjectPath,
    getCurrentAppProperties,
    getMenuSectionConfigs,
    getPrimaryAppProperties,
    getStorageSectionConfig,
    hasPremiumModule,
    isBiologicsEnabled,
    isCommunityDistribution,
    isFreezerManagementEnabled,
    isPremiumProductEnabled,
    isProductNavigationEnabled,
    isProjectContainer,
    isSampleManagerEnabled,
    isSampleStatusEnabled,
    sampleManagerIsPrimaryApp,
    userCanDesignLocations,
    userCanDesignSourceTypes,
    userCanEditStorageData,
} from './utils';
import {
    ASSAYS_KEY,
    BIOLOGICS_APP_PROPERTIES,
    FREEZER_MANAGER_APP_PROPERTIES,
    FREEZERS_KEY,
    MEDIA_KEY,
    NOTEBOOKS_KEY,
    REGISTRY_KEY,
    REQUESTS_KEY,
    SAMPLE_MANAGER_APP_PROPERTIES,
    SAMPLES_KEY,
    SOURCES_KEY,
    USER_KEY,
    WORKFLOW_KEY,
} from './constants';

describe('getMenuSectionConfigs', () => {
    test('sampleManager enabled', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
            samplemanagement: {
                productId: 'SampleManager',
            },
        };
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, 'sampleManager');

        expect(configs.size).toBe(4);
        expect(configs.hasIn([0, 'sources'])).toBeTruthy();
        expect(configs.getIn([0, 'sources', 'seeAllURL'])).toEqual('#/sources?viewAs=grid');

        expect(configs.hasIn([1, 'samples'])).toBeTruthy();
        expect(configs.getIn([1, 'samples', 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([2, 'assays'])).toBeTruthy();
        expect(configs.getIn([2, 'assays', 'seeAllURL'])).toEqual('#/assays?viewAs=grid');

        expect(configs.hasIn([3, 'workflow'])).toBeTruthy();
        expect(configs.getIn([3, 'workflow', 'seeAllURL'])).toEqual('#/workflow');

        expect(configs.hasIn([3, 'user'])).toBeTruthy();
    });

    test('freezerManager enabled', () => {
        LABKEY.moduleContext = {
            inventory: {
                productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
            },
        };
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, FREEZER_MANAGER_APP_PROPERTIES.productId);

        expect(configs.size).toBe(2);
        expect(configs.hasIn([0, 'freezers'])).toBeTruthy();
        expect(configs.getIn([0, 'freezers', 'seeAllURL'])).toEqual('#/home');

        expect(configs.hasIn([1, 'user'])).toBeTruthy();
    });

    test('SM and FM enabled, SM current app', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
            samplemanagement: {
                productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
            },
            inventory: {
                productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
            },
        };

        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, 'sampleManager');
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, 'sources'])).toBeTruthy();
        expect(configs.getIn([0, 'sources', 'seeAllURL'])).toEqual('#/sources?viewAs=grid');

        expect(configs.hasIn([1, 'samples'])).toBeTruthy();
        expect(configs.getIn([1, 'samples', 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([2, 'assays'])).toBeTruthy();
        expect(configs.getIn([2, 'assays', 'seeAllURL'])).toEqual('#/assays?viewAs=grid');

        expect(configs.hasIn([3, 'freezers'])).toBeTruthy();
        expect(configs.getIn([3, 'freezers', 'seeAllURL'])).toEqual('/labkey/freezermanager/app.view#/home');

        expect(configs.hasIn([4, 'workflow'])).toBeTruthy();
        expect(configs.getIn([4, 'workflow', 'seeAllURL'])).toEqual('#/workflow');

        expect(configs.hasIn([4, 'user'])).toBeTruthy();
    });

    test('SM and FM enabled, FM current app', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
            samplemanagement: {
                productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
            },
            inventory: {
                productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
            },
        };

        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, FREEZER_MANAGER_APP_PROPERTIES.productId);
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, 'sources'])).toBeTruthy();
        expect(configs.getIn([0, 'sources', 'seeAllURL'])).toEqual(
            '/labkey/samplemanager/app.view#/sources?viewAs=grid'
        );

        expect(configs.hasIn([1, 'samples'])).toBeTruthy();
        expect(configs.getIn([1, 'samples', 'seeAllURL'])).toEqual(
            '/labkey/samplemanager/app.view#/samples?viewAs=cards'
        );

        expect(configs.hasIn([2, 'assays'])).toBeTruthy();
        expect(configs.getIn([2, 'assays', 'seeAllURL'])).toEqual('/labkey/samplemanager/app.view#/assays?viewAs=grid');

        expect(configs.hasIn([3, 'freezers'])).toBeTruthy();
        expect(configs.getIn([3, 'freezers', 'seeAllURL'])).toEqual('#/home');

        expect(configs.hasIn([4, 'workflow'])).toBeTruthy();
        expect(configs.getIn([4, 'workflow', 'seeAllURL'])).toEqual('/labkey/samplemanager/app.view#/workflow');

        expect(configs.hasIn([4, 'user'])).toBeTruthy();
    });

    test('SM and FM enabled, SM current app, storage editor', () => {
        LABKEY.moduleContext = {
            api: {
                moduleNames: ['samplemanagement', 'study', 'premium'],
            },
            samplemanagement: {
                productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
            },
            inventory: {
                productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
            },
        };

        const configs = getMenuSectionConfigs(TEST_USER_STORAGE_EDITOR, 'sampleManager');
        expect(configs.size).toBe(3);
        expect(configs.hasIn([0, 'samples'])).toBeTruthy();
        expect(configs.getIn([0, 'samples', 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([1, 'freezers'])).toBeTruthy();
        expect(configs.getIn([1, 'freezers', 'seeAllURL'])).toEqual('/labkey/freezermanager/app.view#/home');

        expect(configs.hasIn([2, 'workflow'])).toBeTruthy();
        expect(configs.getIn([2, 'workflow', 'seeAllURL'])).toEqual('#/workflow');

        expect(configs.hasIn([2, 'user'])).toBeTruthy();
    });
});

describe('utils', () => {
    LABKEY.moduleContext = {
        api: {
            moduleNames: ['samplemanagement', 'study', 'premium'],
        },
        samplemanagement: {
            productId: 'SampleManager',
        },
    };

    test('userCanDesignSourceTypes', () => {
        expect(userCanDesignSourceTypes(TEST_USER_GUEST)).toBeFalsy();
        expect(userCanDesignSourceTypes(TEST_USER_READER)).toBeFalsy();
        expect(userCanDesignSourceTypes(TEST_USER_AUTHOR)).toBeFalsy();
        expect(userCanDesignSourceTypes(TEST_USER_EDITOR)).toBeFalsy();
        expect(userCanDesignSourceTypes(TEST_USER_ASSAY_DESIGNER)).toBeFalsy();
        expect(userCanDesignSourceTypes(TEST_USER_FOLDER_ADMIN)).toBeTruthy();
        expect(userCanDesignSourceTypes(TEST_USER_APP_ADMIN)).toBeTruthy();
    });

    test('userCanDesignLocations', () => {
        expect(userCanDesignLocations(TEST_USER_GUEST)).toBeFalsy();
        expect(userCanDesignLocations(TEST_USER_READER)).toBeFalsy();
        expect(userCanDesignLocations(TEST_USER_AUTHOR)).toBeFalsy();
        expect(userCanDesignLocations(TEST_USER_EDITOR)).toBeFalsy();
        expect(userCanDesignLocations(TEST_USER_ASSAY_DESIGNER)).toBeFalsy();
        expect(userCanDesignLocations(TEST_USER_FOLDER_ADMIN)).toBeTruthy();
        expect(userCanDesignLocations(TEST_USER_APP_ADMIN)).toBeTruthy();
        expect(userCanDesignLocations(TEST_USER_STORAGE_DESIGNER)).toBeTruthy();
        expect(userCanDesignLocations(TEST_USER_STORAGE_EDITOR)).toBeFalsy();
    });

    test('userCanEditStorageData', () => {
        expect(userCanEditStorageData(TEST_USER_GUEST)).toBeFalsy();
        expect(userCanEditStorageData(TEST_USER_READER)).toBeFalsy();
        expect(userCanEditStorageData(TEST_USER_AUTHOR)).toBeFalsy();
        expect(userCanEditStorageData(TEST_USER_EDITOR)).toBeFalsy();
        expect(userCanEditStorageData(TEST_USER_ASSAY_DESIGNER)).toBeFalsy();
        expect(userCanEditStorageData(TEST_USER_FOLDER_ADMIN)).toBeFalsy();
        expect(userCanEditStorageData(TEST_USER_APP_ADMIN)).toBeFalsy();
        expect(userCanEditStorageData(TEST_USER_STORAGE_DESIGNER)).toBeFalsy();
        expect(userCanEditStorageData(TEST_USER_STORAGE_EDITOR)).toBeTruthy();
    });

    test('isSampleManagerEnabled', () => {
        LABKEY.moduleContext = {};
        expect(isSampleManagerEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
        };
        expect(isSampleManagerEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
            samplemanagement: {},
        };
        expect(isSampleManagerEnabled()).toBeTruthy();
        expect(isSampleManagerEnabled({ inventory: {} })).toBeFalsy();
    });

    test('isBiologicsEnabled', () => {
        LABKEY.moduleContext = {};
        expect(isBiologicsEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
        };
        expect(isBiologicsEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
            biologics: {},
        };
        expect(isBiologicsEnabled()).toBeTruthy();
        expect(isBiologicsEnabled({ inventory: {} })).toBeFalsy();
    });

    test('isFreezerManagementEnabled', () => {
        LABKEY.moduleContext = {};
        expect(isFreezerManagementEnabled()).toBeFalsy();

        LABKEY.moduleContext = {
            inventory: {},
        };
        expect(isFreezerManagementEnabled()).toBeTruthy();

        LABKEY.moduleContext = {
            inventory: {},
            samplemanagement: {},
        };
        expect(isFreezerManagementEnabled()).toBeTruthy();

        LABKEY.moduleContext = {
            inventory: {},
            samplemanagement: {},
            biologics: {},
        };
        expect(isFreezerManagementEnabled()).toBeTruthy();
    });

    test('isSampleStatusEnabled', () => {
        LABKEY.moduleContext = { api: { moduleNames: [] } };
        expect(isSampleStatusEnabled()).toBeFalsy();
        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(isSampleStatusEnabled()).toBeTruthy();
    });

    test('isProductNavigationEnabled', () => {
        LABKEY.moduleContext = {};
        expect(isProductNavigationEnabled(SAMPLE_MANAGER_APP_PROPERTIES.productId)).toBeFalsy();
        expect(isProductNavigationEnabled(BIOLOGICS_APP_PROPERTIES.productId)).toBeFalsy();
        expect(isProductNavigationEnabled(FREEZER_MANAGER_APP_PROPERTIES.productId)).toBeFalsy();

        LABKEY.moduleContext = {
            samplemanagement: {},
        };
        expect(isProductNavigationEnabled(SAMPLE_MANAGER_APP_PROPERTIES.productId)).toBeTruthy();

        LABKEY.moduleContext = {
            samplemanagement: {},
            biologics: {},
        };
        expect(isProductNavigationEnabled(SAMPLE_MANAGER_APP_PROPERTIES.productId)).toBeFalsy();
        expect(isProductNavigationEnabled(BIOLOGICS_APP_PROPERTIES.productId)).toBeTruthy();
    });

    test('hasPremiumModule', () => {
        LABKEY.moduleContext = {};
        expect(hasPremiumModule()).toBeFalsy();

        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(hasPremiumModule()).toBeFalsy();

        LABKEY.moduleContext = { api: { moduleNames: ['api', 'core', 'premium'] } };
        expect(hasPremiumModule()).toBeTruthy();

        LABKEY.moduleContext = { api: {} };
        expect(hasPremiumModule()).toBeFalsy();
    });

    test('isCommunityDistribution', () => {
        LABKEY.moduleContext = {};
        expect(isCommunityDistribution()).toBeTruthy();

        LABKEY.moduleContext = { api: { moduleNames: ['samplemanagement'] } };
        expect(isCommunityDistribution()).toBeFalsy();

        LABKEY.moduleContext = { api: { moduleNames: ['premium'] } };
        expect(isCommunityDistribution()).toBeFalsy();

        LABKEY.moduleContext = { api: { moduleNames: ['api'] } };
        expect(isCommunityDistribution()).toBeTruthy();
    });

    test('isProjectContainer', () => {
        LABKEY.container = {};
        expect(isProjectContainer()).toBeFalsy();
        expect(isProjectContainer('project')).toBeTruthy();
        expect(isProjectContainer('project a/')).toBeTruthy();
        expect(isProjectContainer('project a/b')).toBeFalsy();
        expect(isProjectContainer('project a/b/d')).toBeFalsy();

        LABKEY.container = { path: 'project' };
        expect(isProjectContainer()).toBeTruthy();
        expect(isProjectContainer('project')).toBeTruthy();
        expect(isProjectContainer('project a/b')).toBeFalsy();

        LABKEY.container = { path: 'project a/' };
        expect(isProjectContainer()).toBeTruthy();
        expect(isProjectContainer('project a/b')).toBeFalsy();

        LABKEY.container = { path: 'project a/b' };
        expect(isProjectContainer()).toBeFalsy();
        expect(isProjectContainer('project')).toBeTruthy();
    });

    test('getProjectPath', () => {
        LABKEY.container = {};
        expect(getProjectPath()).toBeUndefined();
        expect(getProjectPath('project')).toBe('project/');
        expect(getProjectPath('project a/')).toBe('project a/');
        expect(getProjectPath('project a/b')).toBe('project a/');
        expect(getProjectPath('project a/b/d')).toBe('project a/');

        LABKEY.container = { path: 'project' };
        expect(getProjectPath()).toBe('project/');
        expect(getProjectPath('project')).toBe('project/');
        expect(getProjectPath('project a/b')).toBe('project a/');

        LABKEY.container = { path: 'project a/' };
        expect(getProjectPath()).toBe('project a/');
        expect(getProjectPath('project a/b')).toBe('project a/');

        LABKEY.container = { path: 'project a/b' };
        expect(getProjectPath()).toBe('project a/');
        expect(getProjectPath('project')).toBe('project/');
    });

    test('isPremiumProductEnabled', () => {
        LABKEY.moduleContext = {};
        expect(isPremiumProductEnabled({})).toBeFalsy();
        expect(isPremiumProductEnabled({ inventory: {} })).toBeFalsy();
        expect(isPremiumProductEnabled({ samplemanagement: {}, inventory: {} })).toBeTruthy();
        expect(isPremiumProductEnabled({ biologics: {}, samplemanagement: {}, inventory: {} })).toBeTruthy();
        LABKEY.moduleContext = { inventory: {} };
        expect(isPremiumProductEnabled()).toBeFalsy();
        LABKEY.moduleContext = { samplemanagement: {} };
        expect(isPremiumProductEnabled()).toBeTruthy();
    });

    test('sampleManagerIsPrimaryApp', () => {
        LABKEY.moduleContext = {};
        expect(sampleManagerIsPrimaryApp()).toBeFalsy();
        expect(sampleManagerIsPrimaryApp({ inventory: {} })).toBeFalsy();
        expect(sampleManagerIsPrimaryApp({ samplemanagement: {}, inventory: {} })).toBeTruthy();
        expect(sampleManagerIsPrimaryApp({ biologics: {}, samplemanagement: {}, inventory: {} })).toBeFalsy();
        LABKEY.moduleContext = { samplemanagement: {} };
        expect(sampleManagerIsPrimaryApp()).toBeTruthy();
    });

    test('biologcisIsPrimaryApp', () => {
        LABKEY.moduleContext = {};
        expect(biologicsIsPrimaryApp()).toBeFalsy();
        expect(biologicsIsPrimaryApp({ samplemanagement: {} })).toBeFalsy();
        expect(biologicsIsPrimaryApp({ inventory: {} })).toBeFalsy();
        expect(biologicsIsPrimaryApp({ biologics: {}, samplemanagement: {}, inventory: {} })).toBeTruthy();
        LABKEY.moduleContext = { biologics: {}, samplemanagement: {} };
        expect(biologicsIsPrimaryApp()).toBeTruthy();
    });

    test('getPrimaryAppProperties', () => {
        LABKEY.moduleContext = {};
        expect(getPrimaryAppProperties()).toBe(undefined);
        expect(getPrimaryAppProperties({ inventory: {} })).toStrictEqual(FREEZER_MANAGER_APP_PROPERTIES);
        expect(getPrimaryAppProperties({ inventory: {}, samplemanagement: {} })).toStrictEqual(
            SAMPLE_MANAGER_APP_PROPERTIES
        );
        expect(getPrimaryAppProperties({ inventory: {}, samplemanagement: {}, biologics: {} })).toStrictEqual(
            BIOLOGICS_APP_PROPERTIES
        );
    });
});

describe('getCurrentAppProperties', () => {
    const { location } = window;

    beforeAll(() => {
        delete window.location;
    });

    afterAll(() => {
        window.location = location;
    });

    test('Sample Manager controller', () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: 'labkey/Sam Man/samplemanager-app.view#',
            }
        );
        expect(getCurrentAppProperties()).toStrictEqual(SAMPLE_MANAGER_APP_PROPERTIES);
        window.location = Object.assign(
            { ...location },
            {
                pathname: 'labkey/Biologics/samplemanager-app.view#',
            }
        );
        expect(getCurrentAppProperties()).toStrictEqual(SAMPLE_MANAGER_APP_PROPERTIES);
        window.location = Object.assign(
            { ...location },
            {
                pathname: 'labkey/Biologics/sampleManager-app.view#',
            }
        );
        expect(getCurrentAppProperties()).toStrictEqual(SAMPLE_MANAGER_APP_PROPERTIES);
    });

    test('Biologics controller', () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: '/Biologics/biologics-app.view#',
            }
        );
        expect(getCurrentAppProperties()).toStrictEqual(BIOLOGICS_APP_PROPERTIES);
        window.location = Object.assign(
            { ...location },
            {
                pathname: '/samplemanager/biologics-app.view#',
            }
        );
        expect(getCurrentAppProperties()).toStrictEqual(BIOLOGICS_APP_PROPERTIES);
        window.location = Object.assign(
            { ...location },
            {
                pathname: '/Biologics/BiologicS-app.view#',
            }
        );
        expect(getCurrentAppProperties()).toStrictEqual(BIOLOGICS_APP_PROPERTIES);
    });

    test('Freezer Manager controller', () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: '/Biologics/freezermanager-app.view#',
            }
        );
        expect(getCurrentAppProperties()).toStrictEqual(FREEZER_MANAGER_APP_PROPERTIES);
        window.location = Object.assign(
            { ...location },
            {
                pathname: '/sampleManager/FreezerManager-app.view#',
            }
        );
        expect(getCurrentAppProperties()).toStrictEqual(FREEZER_MANAGER_APP_PROPERTIES);
    });

    test('Non-app controller', () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: '/Biologics/project-begin.view',
            }
        );
        expect(getCurrentAppProperties()).toBe(undefined);
    });
});

describe('getStorageSectionConfig', () => {
    test('reader, inventory app', () => {
        const config = getStorageSectionConfig(
            TEST_USER_READER,
            FREEZER_MANAGER_APP_PROPERTIES.productId,
            { inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId } },
            3
        );
        expect(config.maxColumns).toBe(1);
        expect(config.maxItemsPerColumn).toBe(3);
        expect(config.emptyText).toBe('No freezers have been defined');
        expect(config.emptyURL).toBe(undefined);
        expect(config.iconURL).toBe('/labkey/_images/freezer_menu.svg');
        expect(config.seeAllURL).toBe('#/home');
        expect(config.headerURL).toBe('#/home');
        expect(config.headerText).toBe(undefined);
    });

    test('reader, non-inventory app', () => {
        LABKEY.container = {};

        const config = getStorageSectionConfig(
            TEST_USER_READER,
            SAMPLE_MANAGER_APP_PROPERTIES.productId,
            { inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId } },
            4
        );
        expect(config.maxItemsPerColumn).toBe(4);
        expect(config.seeAllURL).toBe('/labkey/freezermanager/app.view#/home');
        expect(config.headerURL).toBe('/labkey/freezermanager/app.view#/home');
        expect(config.emptyURL).toBe(undefined);
    });

    test('admin', () => {
        LABKEY.container = {
            path: 'Project A',
        };

        const config = getStorageSectionConfig(
            TEST_USER_FOLDER_ADMIN,
            BIOLOGICS_APP_PROPERTIES.productId,
            { inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId } },
            4
        );
        expect(config.maxItemsPerColumn).toBe(4);
        expect(config.seeAllURL).toBe('/labkey/freezermanager/Project%20A/app.view#/home');
        expect(config.headerURL).toBe('/labkey/freezermanager/Project%20A/app.view#/home');
        expect(config.emptyURL).toBe('/labkey/freezermanager/Project%20A/app.view#/freezers/new');
        expect(config.emptyURLText).toBe('Create a freezer');
    });

    test('admin, child folder', () => {
        LABKEY.container = {
            path: 'Project A/Child Folder 1',
        };

        const config = getStorageSectionConfig(
            TEST_USER_FOLDER_ADMIN,
            BIOLOGICS_APP_PROPERTIES.productId,
            { inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId } },
            4
        );
        expect(config.maxItemsPerColumn).toBe(4);
        expect(config.seeAllURL).toBe('/labkey/freezermanager/Project%20A/Child%20Folder%201/app.view#/home');
        expect(config.headerURL).toBe('/labkey/freezermanager/Project%20A/Child%20Folder%201/app.view#/home');
        expect(config.emptyURL).toBe(undefined);
        expect(config.emptyURLText).toBe('Get started...');
    });

    test('storage editor', () => {
        LABKEY.container = {
            path: undefined,
        };

        const config = getStorageSectionConfig(
            TEST_USER_STORAGE_EDITOR,
            BIOLOGICS_APP_PROPERTIES.productId,
            { inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId } },
            4
        );
        expect(config.maxItemsPerColumn).toBe(4);
        expect(config.seeAllURL).toBe('/labkey/freezermanager/app.view#/home');
        expect(config.headerURL).toBe('/labkey/freezermanager/app.view#/home');
        expect(config.emptyURL).toBe(undefined);
    });

    test('storage designer', () => {
        LABKEY.container = {
            path: 'Project B',
        };

        const config = getStorageSectionConfig(
            TEST_USER_STORAGE_DESIGNER,
            BIOLOGICS_APP_PROPERTIES.productId,
            { inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId } },
            4
        );
        expect(config.maxItemsPerColumn).toBe(4);
        expect(config.seeAllURL).toBe('/labkey/freezermanager/Project%20B/app.view#/home');
        expect(config.headerURL).toBe('/labkey/freezermanager/Project%20B/app.view#/home');
        expect(config.emptyURL).toBe('/labkey/freezermanager/Project%20B/app.view#/freezers/new');
        expect(config.emptyURLText).toBe('Create a freezer');
    });

    test('storage designer, child container', () => {
        LABKEY.container = {
            path: 'Project B/Child 1',
        };

        const config = getStorageSectionConfig(
            TEST_USER_STORAGE_DESIGNER,
            BIOLOGICS_APP_PROPERTIES.productId,
            { inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId } },
            4
        );
        expect(config.maxItemsPerColumn).toBe(4);
        expect(config.seeAllURL).toBe('/labkey/freezermanager/Project%20B/Child%201/app.view#/home');
        expect(config.headerURL).toBe('/labkey/freezermanager/Project%20B/Child%201/app.view#/home');
        expect(config.emptyURL).toBe(undefined);
        expect(config.emptyURLText).toBe('Get started...');
    });
});

describe('addSourcesSectionConfig', () => {
    test('reader', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSourcesSectionConfig(TEST_USER_READER, '/labkey/test/app.view', configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SOURCES_KEY);
        expect(sectionConfig.maxColumns).toBe(1);
        expect(sectionConfig.maxItemsPerColumn).toBe(12);
        expect(sectionConfig.emptyText).toBe('No source types have been defined');
        expect(sectionConfig.emptyURL).toBe(undefined);
        expect(sectionConfig.seeAllURL).toBe('/labkey/test/app.view#/sources?viewAs=grid');
        expect(sectionConfig.showActiveJobIcon).toBe(true);
        expect(sectionConfig.iconURL).toBe('/labkey/_images/source_type.svg');
        expect(sectionConfig.headerURL).toBe(undefined);
        expect(sectionConfig.headerText).toBe(undefined);
    });

    test('admin', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSourcesSectionConfig(TEST_USER_FOLDER_ADMIN, '/labkey/test/app.view', configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SOURCES_KEY);
        expect(sectionConfig.emptyText).toBe('No source types have been defined');
        expect(sectionConfig.emptyURL).toBe('/labkey/test/app.view#/sourceType/new');
        expect(sectionConfig.emptyURLText).toBe('Create a source type');
    });

    test('storage editor', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSourcesSectionConfig(TEST_USER_STORAGE_EDITOR, '/labkey/test/app.view', configs);
        expect(configs.size).toBe(0);
    });

    test('storage designer', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSourcesSectionConfig(TEST_USER_STORAGE_DESIGNER, '/labkey/test/app.view', configs);
        expect(configs.size).toBe(0);
    });
});

describe('addSamplesSectionConfig', () => {
    test('reader', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSamplesSectionConfig(TEST_USER_READER, '/labkey/samplemanager/app.view', configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SAMPLES_KEY);
        expect(sectionConfig.maxColumns).toBe(1);
        expect(sectionConfig.maxItemsPerColumn).toBe(12);
        expect(sectionConfig.emptyText).toBe('No sample types have been defined');
        expect(sectionConfig.emptyURL).toBe(undefined);
        expect(sectionConfig.seeAllURL).toBe('/labkey/samplemanager/app.view#/samples?viewAs=cards');
        expect(sectionConfig.showActiveJobIcon).toBe(true);
        expect(sectionConfig.iconURL).toBe('/labkey/_images/samples.svg');
        expect(sectionConfig.headerURL).toBe(undefined);
        expect(sectionConfig.headerText).toBe(undefined);
    });

    test('admin', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSamplesSectionConfig(TEST_USER_FOLDER_ADMIN, '/labkey/samplemanager/app.view', configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SAMPLES_KEY);
        expect(sectionConfig.emptyURL).toBe('/labkey/samplemanager/app.view#/sampleType/new');
        expect(sectionConfig.emptyURLText).toBe('Create a sample type');
    });
});

describe('addAssaySectionConfig', () => {
    test('reader', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_READER, '/labkey/test/app.view', configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.maxColumns).toBe(2);
        expect(sectionConfig.maxItemsPerColumn).toBe(12);
        expect(sectionConfig.emptyText).toBe('No assays have been defined');
        expect(sectionConfig.emptyURL).toBe(undefined);
        expect(sectionConfig.seeAllURL).toBe('/labkey/test/app.view#/assays?viewAs=grid');
        expect(sectionConfig.showActiveJobIcon).toBe(true);
        expect(sectionConfig.iconURL).toBe('/labkey/_images/assay.svg');
        expect(sectionConfig.headerURL).toBe(undefined);
        expect(sectionConfig.headerText).toBe(undefined);
    });

    test('admin', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_FOLDER_ADMIN, '/labkey/test/app.view', configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.emptyText).toBe('No assays have been defined');
        expect(sectionConfig.emptyURL).toBe('/labkey/test/app.view#/assayDesign/new');
        expect(sectionConfig.emptyURLText).toBe('Create an assay design');
    });
});

describe('getMenuSectionConfigs', () => {
    const { location } = window;

    beforeAll(() => {
        LABKEY.moduleContext = {};
        delete window.location;
    });

    afterAll(() => {
        window.location = location;
    });

    test('Sample Manager', () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: 'labkey/Samples/sampleManager-app.view#',
            }
        );
        const configs = getMenuSectionConfigs(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId, {
            inventory: {},
            samplemanagement: {},
        });
        expect(configs.size).toBe(5);
        expect(configs.getIn([0, SOURCES_KEY])).toBeDefined();
        expect(configs.getIn([1, SAMPLES_KEY])).toBeDefined();
        expect(configs.getIn([2, ASSAYS_KEY])).toBeDefined();
        expect(configs.getIn([3, FREEZERS_KEY])).toBeDefined();
        expect(configs.getIn([4, WORKFLOW_KEY])).toBeDefined();
        expect(configs.getIn([4, USER_KEY])).toBeDefined();
    });

    test('Biologics primary, in Sample Manager', () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: 'labkey/Biologics/samplemanager-app.view#',
            }
        );
        const configs = getMenuSectionConfigs(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId, {
            inventory: {},
            samplemanagement: {},
            biologics: {},
        });
        expect(configs.size).toBe(5);
        expect(configs.getIn([0, SOURCES_KEY])).toBeDefined();
        expect(configs.getIn([1, SAMPLES_KEY])).toBeDefined();
        expect(configs.getIn([2, ASSAYS_KEY])).toBeDefined();
        expect(configs.getIn([3, FREEZERS_KEY])).toBeDefined();
        expect(configs.getIn([4, WORKFLOW_KEY])).toBeDefined();
        expect(configs.getIn([4, USER_KEY])).toBeDefined();
    });

    test('Biologics', () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: 'labkey/Biologics/biologics-app.view#',
            }
        );
        const configs = getMenuSectionConfigs(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId, {
            inventory: {},
            samplemanagement: {},
            biologics: {},
        });
        expect(configs.size).toBe(5);
        expect(configs.getIn([0, REGISTRY_KEY])).toBeDefined();
        expect(configs.getIn([1, SAMPLES_KEY])).toBeDefined();
        expect(configs.getIn([2, ASSAYS_KEY])).toBeDefined();
        expect(configs.getIn([3, FREEZERS_KEY])).toBeDefined();
        expect(configs.getIn([4, WORKFLOW_KEY])).toBeDefined();
        expect(configs.getIn([4, MEDIA_KEY])).toBeDefined();
        expect(configs.getIn([4, NOTEBOOKS_KEY])).toBeDefined();
    });

    test('Biologics with Requests', () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: 'labkey/Biologics/biologics-app.view#',
            }
        );
        const configs = getMenuSectionConfigs(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId, {
            inventory: {},
            samplemanagement: {},
            biologics: { 'experimental-biologics-requests-menu': true },
        });
        expect(configs.size).toBe(5);
        expect(configs.getIn([0, REGISTRY_KEY])).toBeDefined();
        expect(configs.getIn([1, SAMPLES_KEY])).toBeDefined();
        expect(configs.getIn([2, ASSAYS_KEY])).toBeDefined();
        expect(configs.getIn([3, REQUESTS_KEY])).toBeDefined();
        expect(configs.getIn([3, FREEZERS_KEY])).toBeDefined();
        expect(configs.getIn([4, WORKFLOW_KEY])).toBeDefined();
        expect(configs.getIn([4, MEDIA_KEY])).toBeDefined();
        expect(configs.getIn([4, NOTEBOOKS_KEY])).toBeDefined();
    });

    test('Freezer Manager', () => {
        window.location = Object.assign(
            { ...location },
            {
                pathname: 'labkey/Cold Storage/freezermanager-app.view#',
            }
        );
        const configs = getMenuSectionConfigs(TEST_USER_READER, FREEZER_MANAGER_APP_PROPERTIES.productId, {
            inventory: {},
        });
        expect(configs.size).toBe(2);
        expect(configs.getIn([0, FREEZERS_KEY])).toBeDefined();
        expect(configs.getIn([1, USER_KEY])).toBeDefined();
    });
});
