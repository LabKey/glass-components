import { List, Map } from 'immutable';

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
} from '../userFixtures';

import {
    TEST_LKS_STARTER_MODULE_CONTEXT,
    TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
    TEST_LKSM_STARTER_MODULE_CONTEXT,
} from '../productFixtures';

import { MenuSectionConfig } from '../components/navigation/ProductMenuSection';

import { Container } from '../components/base/models/Container';

import {
    addAssaysSectionConfig,
    addSamplesSectionConfig,
    addSourcesSectionConfig,
    biologicsIsPrimaryApp,
    getCurrentAppProperties,
    getMenuSectionConfigs,
    getPrimaryAppProperties,
    getProjectPath,
    getStorageSectionConfig,
    hasPremiumModule,
    isAppHomeFolder,
    isAssayEnabled,
    isAssayQCEnabled,
    isAssayRequestsEnabled,
    isBiologicsEnabled,
    isCommunityDistribution,
    isELNEnabled,
    isFreezerManagementEnabled,
    isMediaEnabled,
    isPremiumProductEnabled,
    isProductNavigationEnabled,
    isProjectContainer,
    isProtectedDataEnabled,
    isSampleManagerEnabled,
    isSampleStatusEnabled,
    isWorkflowEnabled,
    sampleManagerIsPrimaryApp,
    setProductProjects,
    userCanDesignLocations,
    userCanDesignSourceTypes,
    userCanEditStorageData,
} from './utils';
import {
    ASSAYS_KEY,
    BIOLOGICS_APP_PROPERTIES,
    EXPERIMENTAL_REQUESTS_MENU,
    FREEZER_MANAGER_APP_PROPERTIES,
    FREEZERS_KEY,
    MEDIA_KEY,
    NOTEBOOKS_KEY,
    PICKLIST_KEY,
    ProductFeature,
    REGISTRY_KEY,
    REQUESTS_KEY,
    SAMPLE_MANAGER_APP_PROPERTIES,
    SAMPLES_KEY,
    SOURCES_KEY,
    WORKFLOW_KEY,
} from './constants';

describe('getMenuSectionConfigs', () => {
    test('LKS starter enabled', () => {
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, SAMPLE_MANAGER_APP_PROPERTIES.productId, {
            ...TEST_LKS_STARTER_MODULE_CONTEXT,
        });

        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, SOURCES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SOURCES_KEY, 'seeAllURL'])).toEqual('#/sources?viewAs=grid');

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'seeAllURL'])).toEqual('#/assays?viewAs=grid');

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'seeAllURL'])).toEqual('/labkey/freezermanager/app.view#/home');

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURL'])).toEqual('#/picklist');
        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeFalsy();
        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeFalsy();
    });

    test('sampleManager starter enabled', () => {
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, SAMPLE_MANAGER_APP_PROPERTIES.productId, {
            ...TEST_LKSM_STARTER_MODULE_CONTEXT,
        });

        expect(configs.size).toBe(4);
        expect(configs.hasIn([0, SOURCES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SOURCES_KEY, 'seeAllURL'])).toEqual('#/sources?viewAs=grid');

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([2, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([2, FREEZERS_KEY, 'seeAllURL'])).toEqual('/labkey/freezermanager/app.view#/home');

        expect(configs.hasIn([3, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([3, PICKLIST_KEY, 'headerURL'])).toEqual('#/picklist');
        expect(configs.hasIn([3, WORKFLOW_KEY])).toBeFalsy();
        expect(configs.hasIn([3, NOTEBOOKS_KEY])).toBeFalsy();
    });

    test('sampleManager professional enabled', () => {
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, 'sampleManager', {
            ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
        });

        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, SOURCES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SOURCES_KEY, 'seeAllURL'])).toEqual('#/sources?viewAs=grid');

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'seeAllURL'])).toEqual('#/assays?viewAs=grid');

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'seeAllURL'])).toEqual('/labkey/freezermanager/app.view#/home');

        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeTruthy();
        expect(configs.getIn([4, WORKFLOW_KEY, 'seeAllURL'])).toEqual('#/workflow');

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURL'])).toEqual('#/picklist');

        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeTruthy();
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'headerURL'])).toEqual('#/notebooks');
    });

    test('freezerManager enabled', () => {
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, FREEZER_MANAGER_APP_PROPERTIES.productId, {
            inventory: {
                productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
            },
        });

        expect(configs.size).toBe(2);
        expect(configs.hasIn([0, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([0, FREEZERS_KEY, 'seeAllURL'])).toEqual('#/home');

        expect(configs.hasIn([1, 'user'])).toBeTruthy();
    });

    test('SM, ELN, and FM enabled, LKB current app', () => {
        const moduleContext = {
            api: {
                moduleNames: ['biologics', 'samplemanagement', 'study', 'premium', 'professional', 'labbook', 'assay'],
            },
            samplemanagement: {
                productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
            },
            inventory: {
                productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
            },
            biologics: {
                productId: BIOLOGICS_APP_PROPERTIES.productId,
            },
            core: {
                productFeatures: [ProductFeature.Workflow, ProductFeature.Assay, ProductFeature.ELN],
            },
        };

        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, BIOLOGICS_APP_PROPERTIES.productId, moduleContext);
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, REGISTRY_KEY])).toBeTruthy();
        expect(configs.getIn([0, REGISTRY_KEY, 'seeAllURL'])).toEqual('#/registry');

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'seeAllURL'])).toEqual('#/assays?viewAs=grid');

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'seeAllURL'])).toEqual('/labkey/freezermanager/app.view#/home');

        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeTruthy();
        expect(configs.getIn([4, WORKFLOW_KEY, 'seeAllURL'])).toEqual('#/workflow');

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURL'])).toEqual('#/picklist');

        expect(configs.hasIn([4, MEDIA_KEY])).toBeTruthy();
        expect(configs.getIn([4, MEDIA_KEY, 'headerURL'])).toEqual('#/media');

        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeTruthy();
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'headerURL'])).toEqual('#/notebooks');

        expect(configs.hasIn([4, 'user'])).toBeFalsy();
    });

    test('LKB with assay requests enabled', () => {
        const moduleContext = {
            api: {
                moduleNames: [
                    'assay',
                    'assayrequest',
                    'biologics',
                    'labbook',
                    'premium',
                    'professional',
                    'samplemanagement',
                    'study',
                ],
            },
            samplemanagement: {
                productId: SAMPLE_MANAGER_APP_PROPERTIES.productId,
            },
            inventory: {
                productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
            },
            biologics: {
                productId: BIOLOGICS_APP_PROPERTIES.productId,
                [EXPERIMENTAL_REQUESTS_MENU]: true,
            },
            core: {
                productFeatures: [ProductFeature.Workflow, ProductFeature.Assay, ProductFeature.ELN],
            },
        };

        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, BIOLOGICS_APP_PROPERTIES.productId, moduleContext);
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, REGISTRY_KEY])).toBeTruthy();
        expect(configs.getIn([0, REGISTRY_KEY, 'seeAllURL'])).toEqual('#/registry');

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'seeAllURL'])).toEqual('#/assays?viewAs=grid');

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'seeAllURL'])).toEqual('/labkey/freezermanager/app.view#/home');
        expect(configs.getIn([3, REQUESTS_KEY])).toBeDefined();

        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeTruthy();
        expect(configs.getIn([4, WORKFLOW_KEY, 'seeAllURL'])).toEqual('#/workflow');

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURL'])).toEqual('#/picklist');

        expect(configs.hasIn([4, MEDIA_KEY])).toBeTruthy();
        expect(configs.getIn([4, MEDIA_KEY, 'headerURL'])).toEqual('#/media');

        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeTruthy();
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'headerURL'])).toEqual('#/notebooks');
    });

    test('SM starter enabled, FM current app', () => {
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, FREEZER_MANAGER_APP_PROPERTIES.productId, {
            ...TEST_LKSM_STARTER_MODULE_CONTEXT,
        });
        expect(configs.size).toBe(4);
        expect(configs.hasIn([0, SOURCES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SOURCES_KEY, 'seeAllURL'])).toEqual(
            '/labkey/samplemanager/app.view#/sources?viewAs=grid'
        );

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'seeAllURL'])).toEqual(
            '/labkey/samplemanager/app.view#/samples?viewAs=cards'
        );

        expect(configs.hasIn([2, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([2, FREEZERS_KEY, 'seeAllURL'])).toEqual('#/home');

        expect(configs.hasIn([3, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([3, PICKLIST_KEY, 'headerURL'])).toEqual('/labkey/samplemanager/app.view#/picklist');
    });

    test('SM professional, SM current app, storage editor', () => {
        const configs = getMenuSectionConfigs(TEST_USER_STORAGE_EDITOR, SAMPLE_MANAGER_APP_PROPERTIES.productId, {
            ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
        });
        expect(configs.size).toBe(3);
        expect(configs.hasIn([0, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SAMPLES_KEY, 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([1, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([1, FREEZERS_KEY, 'seeAllURL'])).toEqual('/labkey/freezermanager/app.view#/home');

        expect(configs.hasIn([2, WORKFLOW_KEY])).toBeTruthy();
        expect(configs.getIn([2, WORKFLOW_KEY, 'seeAllURL'])).toEqual('#/workflow');

        expect(configs.hasIn([2, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([2, PICKLIST_KEY, 'headerURL'])).toEqual('#/picklist');

        expect(configs.hasIn([2, NOTEBOOKS_KEY])).toBeFalsy();
    });

    test('SM professional, SM current app, reader', () => {
        const configs = getMenuSectionConfigs(TEST_USER_READER, 'sampleManager', {
            ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
        });
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, SOURCES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SOURCES_KEY, 'seeAllURL'])).toEqual('#/sources?viewAs=grid');

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'seeAllURL'])).toEqual('#/samples?viewAs=cards');

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'seeAllURL'])).toEqual('#/assays?viewAs=grid');

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'seeAllURL'])).toEqual('/labkey/freezermanager/app.view#/home');

        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeTruthy();
        expect(configs.getIn([4, WORKFLOW_KEY, 'seeAllURL'])).toEqual('#/workflow');

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURL'])).toEqual('#/picklist');

        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeTruthy();
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'headerURL'])).toEqual('#/notebooks');
    });
});

describe('utils', () => {
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

    test('isELNEnabled', () => {
        expect(isELNEnabled({ api: { moduleNames: [] } })).toBeFalsy();
        expect(
            isELNEnabled({
                api: { moduleNames: ['labbook'] },
                core: {
                    productFeatures: [ProductFeature.ELN],
                },
            })
        ).toBeTruthy();
    });

    test('isAssayEnabled', () => {
        expect(
            isAssayEnabled({
                api: { moduleNames: [] },
            })
        ).toBeFalsy();
        expect(
            isAssayEnabled({
                api: { moduleNames: ['assay'] },
                core: {
                    productFeatures: [],
                },
            })
        ).toBeTruthy(); // LK Community
        expect(
            isAssayEnabled({
                api: { moduleNames: [] },
                core: {
                    productFeatures: [ProductFeature.Assay],
                },
            })
        ).toBeFalsy(); // no assay module
        expect(
            isAssayEnabled({
                api: { moduleNames: ['assay'] },
                core: {
                    productFeatures: [ProductFeature.Assay],
                },
            })
        ).toBeTruthy(); // assay module with assay feature
        expect(
            isAssayEnabled({
                api: { moduleNames: ['assay', 'sampleManagement'] },
                core: {
                    productFeatures: [ProductFeature.Assay],
                },
            })
        ).toBeTruthy(); // LKSM Starter
        expect(
            isAssayEnabled({
                api: { moduleNames: ['assay', 'sampleManagement', 'premium'] },
                core: {
                    productFeatures: [ProductFeature.Assay],
                },
            })
        ).toBeTruthy(); // LKS Starter
        expect(
            isAssayEnabled({
                api: { moduleNames: ['assay', 'sampleManagement', 'premium', 'professional', 'labbook'] },
                core: {
                    productFeatures: [ProductFeature.Assay],
                },
            })
        ).toBeTruthy(); // LKS Professional
    });

    test('isAssayQCEnabled', () => {
        expect(isAssayQCEnabled({ api: { moduleNames: [] } })).toBeFalsy();
        expect(isAssayQCEnabled({ api: { moduleNames: ['assay'] } })).toBeFalsy();
        expect(
            isAssayQCEnabled({ api: { moduleNames: [] }, core: { productFeatures: [ProductFeature.AssayQC] } })
        ).toBeFalsy();
        expect(
            isAssayQCEnabled({
                api: { moduleNames: ['assay'] },
                core: { productFeatures: [ProductFeature.Assay, ProductFeature.AssayQC] },
            })
        ).toBeFalsy();
        expect(
            isAssayQCEnabled({
                api: { moduleNames: ['assay', 'premium'] },
                core: { productFeatures: [ProductFeature.Assay, ProductFeature.AssayQC] },
            })
        ).toBeTruthy();
    });

    test('isAssayRequestsEnabled', () => {
        expect(isAssayRequestsEnabled({ api: { moduleNames: [] } })).toBeFalsy();
        expect(isAssayRequestsEnabled({ api: { moduleNames: ['assayrequest'] } })).toBeFalsy();
        expect(
            isAssayRequestsEnabled({
                api: { moduleNames: ['assayrequest'] },
                biologics: { [EXPERIMENTAL_REQUESTS_MENU]: false },
            })
        ).toBeFalsy();
        expect(
            isAssayRequestsEnabled({
                api: { moduleNames: ['assayrequest'] },
                biologics: { [EXPERIMENTAL_REQUESTS_MENU]: true },
            })
        ).toBeTruthy();
    });

    test('isProtectedDataEnabled', () => {
        expect(isProtectedDataEnabled({ api: { moduleNames: [] } })).toBeFalsy();
        expect(isProtectedDataEnabled({ api: { moduleNames: ['compliance'] } })).toBeFalsy();
        expect(isProtectedDataEnabled({ api: { moduleNames: ['complianceactivities'] } })).toBeFalsy();
        expect(isProtectedDataEnabled({ api: { moduleNames: ['compliance', 'complianceactivities'] } })).toBeTruthy();
    });

    test('isMediaEnabled', () => {
        expect(isMediaEnabled({ api: { moduleNames: [] } })).toBeFalsy();
        expect(isMediaEnabled({ api: { moduleNames: ['recipe'] }, core: { productFeatures: [] } })).toBeFalsy();
        expect(
            isMediaEnabled({ api: { moduleNames: [] }, core: { productFeatures: [ProductFeature.Media] } })
        ).toBeTruthy();
        expect(
            isMediaEnabled({ api: { moduleNames: ['recipe'] }, core: { productFeatures: [ProductFeature.Media] } })
        ).toBeTruthy();
    });

    test('isWorkflowEnabled', () => {
        expect(
            isWorkflowEnabled({
                api: { moduleNames: [] },
            })
        ).toBeFalsy();
        expect(
            isWorkflowEnabled({
                api: { moduleNames: ['samplemanagement'] },
                core: {
                    productFeatures: [],
                },
            })
        ).toBeFalsy();
        expect(
            isWorkflowEnabled({
                api: { moduleNames: [] },
                core: {
                    productFeatures: [ProductFeature.Workflow],
                },
            })
        ).toBeFalsy();
        expect(
            isWorkflowEnabled({
                api: { moduleNames: ['samplemanagement'] },
                core: {
                    productFeatures: [ProductFeature.Workflow],
                },
            })
        ).toBeTruthy();
    });

    test('isSampleManagerEnabled', () => {
        expect(isSampleManagerEnabled({})).toBeFalsy();
        expect(isSampleManagerEnabled({ inventory: {} })).toBeFalsy();
        expect(isSampleManagerEnabled({ inventory: {}, samplemanagement: {} })).toBeTruthy();
    });

    test('isBiologicsEnabled', () => {
        expect(isBiologicsEnabled({})).toBeFalsy();
        expect(isBiologicsEnabled({ inventory: {} })).toBeFalsy();
        expect(isBiologicsEnabled({ biologics: {}, inventory: {} })).toBeTruthy();
    });

    test('isFreezerManagementEnabled', () => {
        expect(isFreezerManagementEnabled({})).toBeFalsy();
        expect(isFreezerManagementEnabled({ inventory: {} })).toBeTruthy();
        expect(isFreezerManagementEnabled({ inventory: {}, samplemanagement: {} })).toBeTruthy();
        expect(isFreezerManagementEnabled({ biologics: {}, inventory: {}, samplemanagement: {} })).toBeTruthy();
    });

    test('isSampleStatusEnabled', () => {
        expect(isSampleStatusEnabled({ api: { moduleNames: [] } })).toBeFalsy();
        expect(isSampleStatusEnabled({ api: { moduleNames: ['samplemanagement'] } })).toBeTruthy();
    });

    test('isProductNavigationEnabled', () => {
        expect(isProductNavigationEnabled(SAMPLE_MANAGER_APP_PROPERTIES.productId, {})).toBeFalsy();
        expect(isProductNavigationEnabled(BIOLOGICS_APP_PROPERTIES.productId, {})).toBeFalsy();
        expect(isProductNavigationEnabled(FREEZER_MANAGER_APP_PROPERTIES.productId, {})).toBeFalsy();
        expect(
            isProductNavigationEnabled(SAMPLE_MANAGER_APP_PROPERTIES.productId, { samplemanagement: {} })
        ).toBeTruthy();
        expect(
            isProductNavigationEnabled(SAMPLE_MANAGER_APP_PROPERTIES.productId, { biologics: {}, samplemanagement: {} })
        ).toBeFalsy();
        expect(
            isProductNavigationEnabled(BIOLOGICS_APP_PROPERTIES.productId, { biologics: {}, samplemanagement: {} })
        ).toBeTruthy();
    });

    test('setProductProjects', () => {
        expect(setProductProjects({}, true)).toEqual({ query: { hasProductProjects: true } });
        expect(setProductProjects({ query: { hasProductProjects: false } }, true)).toEqual({
            query: { hasProductProjects: true },
        });
        LABKEY.moduleContext = { query: { ken: 'griffey' } };
        setProductProjects({ query: { hasProductProjects: true } }, false);
        expect(LABKEY.moduleContext.query).toEqual({ hasProductProjects: false, ken: 'griffey' });
    });

    test('hasPremiumModule', () => {
        expect(hasPremiumModule({})).toBeFalsy();
        expect(hasPremiumModule({ api: { moduleNames: ['samplemanagement'] } })).toBeFalsy();
        expect(hasPremiumModule({ api: { moduleNames: ['api', 'core', 'premium'] } })).toBeTruthy();
        expect(hasPremiumModule({ api: {} })).toBeFalsy();
    });

    test('isCommunityDistribution', () => {
        expect(isCommunityDistribution({})).toBeTruthy();
        expect(isCommunityDistribution({ api: { moduleNames: ['samplemanagement'] } })).toBeFalsy();
        expect(isCommunityDistribution({ api: { moduleNames: ['premium'] } })).toBeFalsy();
        expect(isCommunityDistribution({ api: { moduleNames: ['api'] } })).toBeTruthy();
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
        expect(isPremiumProductEnabled({})).toBeFalsy();
        expect(isPremiumProductEnabled({ inventory: {} })).toBeFalsy();
        expect(isPremiumProductEnabled({ samplemanagement: {}, inventory: {} })).toBeTruthy();
        expect(isPremiumProductEnabled({ biologics: {}, samplemanagement: {}, inventory: {} })).toBeTruthy();
        expect(isPremiumProductEnabled({ inventory: {} })).toBeFalsy();
        expect(isPremiumProductEnabled({ samplemanagement: {} })).toBeTruthy();
    });

    test('isAppHomeFolder', () => {
        LABKEY.container = { folderType: 'Collaboration' };
        expect(isAppHomeFolder()).toBeFalsy();
        LABKEY.container = { folderType: 'Sample Manager' };
        expect(isAppHomeFolder()).toBeTruthy();
        LABKEY.container = { folderType: 'Biologics' };
        expect(isAppHomeFolder()).toBeTruthy();
        expect(isAppHomeFolder(new Container({ path: 'project a/b', folderType: 'Collaboration' }))).toBeFalsy();
    });

    test('sampleManagerIsPrimaryApp', () => {
        expect(sampleManagerIsPrimaryApp({})).toBeFalsy();
        expect(sampleManagerIsPrimaryApp({ inventory: {} })).toBeFalsy();
        expect(sampleManagerIsPrimaryApp({ samplemanagement: {}, inventory: {} })).toBeTruthy();
        expect(sampleManagerIsPrimaryApp({ biologics: {}, samplemanagement: {}, inventory: {} })).toBeFalsy();
        expect(sampleManagerIsPrimaryApp({ samplemanagement: {} })).toBeTruthy();
    });

    test('biologcisIsPrimaryApp', () => {
        expect(biologicsIsPrimaryApp({})).toBeFalsy();
        expect(biologicsIsPrimaryApp({ samplemanagement: {} })).toBeFalsy();
        expect(biologicsIsPrimaryApp({ inventory: {} })).toBeFalsy();
        expect(biologicsIsPrimaryApp({ biologics: {}, samplemanagement: {}, inventory: {} })).toBeTruthy();
        expect(biologicsIsPrimaryApp({ biologics: {}, samplemanagement: {} })).toBeTruthy();
    });

    test('getPrimaryAppProperties', () => {
        expect(getPrimaryAppProperties({})).toBe(undefined);
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
        expect(config.emptyText).toBe('No storage has been defined');
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
        expect(sectionConfig.showActiveJobIcon).toBeTruthy();
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
        expect(sectionConfig.showActiveJobIcon).toBeTruthy();
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
        configs = addAssaysSectionConfig(TEST_USER_READER, '/labkey/test/app.view', configs, false);
        expect(configs.size).toBe(1);
        let sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.maxColumns).toBe(1);
        expect(sectionConfig.maxItemsPerColumn).toBe(12);
        expect(sectionConfig.emptyText).toBe('No assays have been defined');
        expect(sectionConfig.emptyURL).toBe(undefined);
        expect(sectionConfig.seeAllURL).toBe('/labkey/test/app.view#/assays?viewAs=grid');
        expect(sectionConfig.showActiveJobIcon).toBeTruthy();
        expect(sectionConfig.iconURL).toBe('/labkey/_images/assay.svg');
        expect(sectionConfig.headerURL).toBe(undefined);
        expect(sectionConfig.headerText).toBe(undefined);

        configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_READER, '/labkey/test/app.view', configs, true);
        expect(configs.size).toBe(1);
        sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.emptyURL).toBe(undefined);
    });

    test('admin', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_FOLDER_ADMIN, '/labkey/test/app.view', configs, false);
        expect(configs.size).toBe(1);
        let sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.emptyText).toBe('No assays have been defined');
        expect(sectionConfig.emptyURL).toBe('/labkey/test/app.view#/assayDesign/new');
        expect(sectionConfig.emptyURLText).toBe('Create an assay design');

        configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_FOLDER_ADMIN, '/labkey/test/app.view', configs, true);
        expect(configs.size).toBe(1);
        sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.emptyURL).toBe('/labkey/test/app.view#/assayDesign/General');
    });
});
