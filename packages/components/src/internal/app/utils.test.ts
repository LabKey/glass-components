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

import { Container } from '../components/base/models/Container';

import { MenuSectionConfig } from '../components/navigation/model';

import {
    addAssaysSectionConfig,
    addSourcesSectionConfig,
    biologicsIsPrimaryApp,
    freezerManagerIsCurrentApp,
    getCurrentAppProperties,
    getMenuSectionConfigs,
    getPrimaryAppProperties,
    getProjectPath,
    getSamplesSectionConfig,
    getStorageSectionConfig,
    hasPremiumModule,
    isAppHomeFolder,
    isAssayEnabled,
    isAssayQCEnabled,
    isAssayRequestsEnabled,
    isBiologicsEnabled,
    isCalculatedFieldsEnabled,
    isCommunityDistribution,
    isELNEnabled,
    isFreezerManagementEnabled,
    isLIMSEnabled,
    isLKSSupportEnabled,
    isMediaEnabled,
    isPremiumProductEnabled,
    isProductNavigationEnabled,
    isProjectContainer,
    isProtectedDataEnabled,
    isSampleManagerEnabled,
    isSampleStatusEnabled,
    isSharedContainer,
    isTransformScriptsEnabled,
    isWorkflowEnabled,
    limsIsPrimaryApp,
    sampleManagerIsPrimaryApp,
    setProductFolders,
    userCanDesignLocations,
    userCanDesignSourceTypes,
    userCanEditStorageData,
    userCanReadGroupDetails,
    userCanReadUserDetails,
    isQueryMetadataEditor,
} from './utils';
import {
    ASSAYS_KEY,
    BIOLOGICS_APP_PROPERTIES,
    EXPERIMENTAL_REQUESTS_MENU,
    FREEZER_MANAGER_APP_PROPERTIES,
    FREEZERS_KEY,
    LIMS_APP_PROPERTIES,
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
        expect(configs.getIn([0, SOURCES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([0, SOURCES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([1, SAMPLES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([2, ASSAYS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'headerURLPart'])).toEqual('home');
        expect(configs.getIn([3, FREEZERS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, PICKLIST_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeFalsy();
        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeFalsy();
        expect(configs.hasIn([4, 'user'])).toBeFalsy();
    });

    test('sampleManager starter enabled', () => {
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, SAMPLE_MANAGER_APP_PROPERTIES.productId, {
            ...TEST_LKSM_STARTER_MODULE_CONTEXT,
        });

        expect(configs.size).toBe(4);
        expect(configs.hasIn([0, SOURCES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SOURCES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([0, SOURCES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([1, SAMPLES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([2, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([2, FREEZERS_KEY, 'headerURLPart'])).toEqual('home');
        expect(configs.getIn([2, FREEZERS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([3, PICKLIST_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([3, PICKLIST_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, WORKFLOW_KEY])).toBeFalsy();
        expect(configs.hasIn([3, NOTEBOOKS_KEY])).toBeFalsy();
        expect(configs.hasIn([3, 'user'])).toBeFalsy();
    });

    test('sampleManager professional enabled', () => {
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, 'sampleManager', {
            ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
        });

        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, SOURCES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SOURCES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([0, SOURCES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([1, SAMPLES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([2, ASSAYS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'headerURLPart'])).toEqual('home');
        expect(configs.getIn([3, FREEZERS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeTruthy();
        expect(configs.getIn([4, WORKFLOW_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, WORKFLOW_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, PICKLIST_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeTruthy();
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, 'user'])).toBeFalsy();
    });

    test('freezerManager enabled', () => {
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, FREEZER_MANAGER_APP_PROPERTIES.productId, {
            inventory: {
                productId: FREEZER_MANAGER_APP_PROPERTIES.productId,
            },
        });

        expect(configs.size).toBe(2);
        expect(configs.hasIn([0, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([0, FREEZERS_KEY, 'headerURLPart'])).toEqual('home');
        expect(configs.getIn([0, FREEZERS_KEY, 'emptyAppURL'])).toEqual(undefined);

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
                productFeatures: [
                    ProductFeature.Workflow,
                    ProductFeature.Assay,
                    ProductFeature.ELN,
                    ProductFeature.BiologicsRegistry,
                ],
            },
        };

        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, BIOLOGICS_APP_PROPERTIES.productId, moduleContext);
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, REGISTRY_KEY])).toBeTruthy();
        expect(configs.getIn([0, REGISTRY_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([0, REGISTRY_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([1, SAMPLES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([2, ASSAYS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'headerURLPart'])).toEqual('home');
        expect(configs.getIn([3, FREEZERS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, REQUESTS_KEY])).toBeFalsy();

        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeTruthy();
        expect(configs.getIn([4, WORKFLOW_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, WORKFLOW_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, PICKLIST_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, MEDIA_KEY])).toBeTruthy();
        expect(configs.getIn([4, MEDIA_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, MEDIA_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeTruthy();
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'emptyAppURL'])).toEqual(undefined);

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
                productFeatures: [
                    ProductFeature.Workflow,
                    ProductFeature.Assay,
                    ProductFeature.ELN,
                    ProductFeature.BiologicsRegistry,
                ],
            },
        };

        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, BIOLOGICS_APP_PROPERTIES.productId, moduleContext);
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, REGISTRY_KEY])).toBeTruthy();
        expect(configs.getIn([0, REGISTRY_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([0, REGISTRY_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([1, SAMPLES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([2, ASSAYS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'headerURLPart'])).toEqual('home');
        expect(configs.getIn([3, FREEZERS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, REQUESTS_KEY])).toBeTruthy();
        expect(configs.getIn([3, REQUESTS_KEY, 'useOriginalURL'])).toEqual(true);

        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeTruthy();
        expect(configs.getIn([4, WORKFLOW_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, WORKFLOW_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, PICKLIST_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, MEDIA_KEY])).toBeTruthy();
        expect(configs.getIn([4, MEDIA_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, MEDIA_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeTruthy();
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, 'user'])).toBeFalsy();
    });

    test('SM starter enabled, FM current app', () => {
        const configs = getMenuSectionConfigs(TEST_USER_EDITOR, FREEZER_MANAGER_APP_PROPERTIES.productId, {
            ...TEST_LKSM_STARTER_MODULE_CONTEXT,
        });
        expect(configs.size).toBe(4);
        expect(configs.hasIn([0, SOURCES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SOURCES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([0, SOURCES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([1, SAMPLES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([2, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([2, FREEZERS_KEY, 'headerURLPart'])).toEqual('home');
        expect(configs.getIn([2, FREEZERS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([3, PICKLIST_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([3, PICKLIST_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, WORKFLOW_KEY])).toBeFalsy();
        expect(configs.hasIn([3, NOTEBOOKS_KEY])).toBeFalsy();
        expect(configs.hasIn([3, 'user'])).toBeFalsy();
    });

    test('SM professional, SM current app, storage editor', () => {
        const configs = getMenuSectionConfigs(TEST_USER_STORAGE_EDITOR, SAMPLE_MANAGER_APP_PROPERTIES.productId, {
            ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
        });
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, SOURCES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SOURCES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([0, SOURCES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([1, SAMPLES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([2, ASSAYS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'headerURLPart'])).toEqual('home');
        expect(configs.getIn([3, FREEZERS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeTruthy();
        expect(configs.getIn([4, WORKFLOW_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, WORKFLOW_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, PICKLIST_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeTruthy();
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, 'user'])).toBeFalsy();
    });

    test('SM professional, SM current app, reader', () => {
        const configs = getMenuSectionConfigs(TEST_USER_READER, 'sampleManager', {
            ...TEST_LKSM_PROFESSIONAL_MODULE_CONTEXT,
        });
        expect(configs.size).toBe(5);
        expect(configs.hasIn([0, SOURCES_KEY])).toBeTruthy();
        expect(configs.getIn([0, SOURCES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([0, SOURCES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([1, SAMPLES_KEY])).toBeTruthy();
        expect(configs.getIn([1, SAMPLES_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([1, SAMPLES_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([2, ASSAYS_KEY])).toBeTruthy();
        expect(configs.getIn([2, ASSAYS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([2, ASSAYS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([3, FREEZERS_KEY])).toBeTruthy();
        expect(configs.getIn([3, FREEZERS_KEY, 'headerURLPart'])).toEqual('home');
        expect(configs.getIn([3, FREEZERS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, WORKFLOW_KEY])).toBeTruthy();
        expect(configs.getIn([4, WORKFLOW_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, WORKFLOW_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, PICKLIST_KEY])).toBeTruthy();
        expect(configs.getIn([4, PICKLIST_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, PICKLIST_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, NOTEBOOKS_KEY])).toBeTruthy();
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'headerURLPart'])).toEqual(undefined);
        expect(configs.getIn([4, NOTEBOOKS_KEY, 'emptyAppURL'])).toEqual(undefined);

        expect(configs.hasIn([4, 'user'])).toBeFalsy();
    });
});

describe('utils', () => {
    beforeEach(() => {
        window.history.pushState({}, 'Test Title', '/');
    });

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

    test('userCanReadUserDetails', () => {
        expect(userCanReadUserDetails(TEST_USER_GUEST)).toBeFalsy();
        expect(userCanReadUserDetails(TEST_USER_READER)).toBeFalsy();
        expect(userCanReadUserDetails(TEST_USER_AUTHOR)).toBeFalsy();
        expect(userCanReadUserDetails(TEST_USER_EDITOR)).toBeFalsy();
        expect(userCanReadUserDetails(TEST_USER_ASSAY_DESIGNER)).toBeFalsy();
        expect(userCanReadUserDetails(TEST_USER_FOLDER_ADMIN)).toBeTruthy();
        expect(userCanReadUserDetails(TEST_USER_APP_ADMIN)).toBeTruthy();
        expect(userCanReadUserDetails(TEST_USER_STORAGE_DESIGNER)).toBeFalsy();
        expect(userCanReadUserDetails(TEST_USER_STORAGE_EDITOR)).toBeFalsy();
    });

    test('userCanReadGroupDetails', () => {
        expect(userCanReadGroupDetails(TEST_USER_GUEST)).toBeFalsy();
        expect(userCanReadGroupDetails(TEST_USER_READER)).toBeFalsy();
        expect(userCanReadGroupDetails(TEST_USER_AUTHOR)).toBeFalsy();
        expect(userCanReadGroupDetails(TEST_USER_EDITOR)).toBeFalsy();
        expect(userCanReadGroupDetails(TEST_USER_ASSAY_DESIGNER)).toBeFalsy();
        expect(userCanReadGroupDetails(TEST_USER_FOLDER_ADMIN)).toBeTruthy();
        expect(userCanReadGroupDetails(TEST_USER_APP_ADMIN)).toBeTruthy();
        expect(userCanReadGroupDetails(TEST_USER_STORAGE_DESIGNER)).toBeFalsy();
        expect(userCanReadGroupDetails(TEST_USER_STORAGE_EDITOR)).toBeFalsy();
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
        expect(
            isMediaEnabled({
                api: { moduleNames: [] },
                biologics: {},
            })
        ).toBeFalsy();
        expect(
            isMediaEnabled({
                api: { moduleNames: ['recipe'] },
                core: { productFeatures: [] },
                biologics: {},
            })
        ).toBeFalsy();
        expect(
            isMediaEnabled({
                api: { moduleNames: [] },
                core: { productFeatures: [ProductFeature.Media] },
                samplemanagement: {},
            })
        ).toBeFalsy();
        expect(
            isMediaEnabled({
                api: { moduleNames: [] },
                core: { productFeatures: [ProductFeature.Media] },
                biologics: {},
            })
        ).toBeTruthy();
        expect(
            isMediaEnabled({
                api: { moduleNames: [] },
                core: { productFeatures: [ProductFeature.Media] },
                samplemanagement: {},
                biologics: {},
            })
        ).toBeTruthy();
        expect(
            isMediaEnabled({
                api: { moduleNames: ['recipe'] },
                core: { productFeatures: [ProductFeature.Media] },
                biologics: {},
            })
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

    test('isTransformScriptsEnabled', () => {
        expect(isTransformScriptsEnabled({})).toBe(true);
        expect(isTransformScriptsEnabled({ api: { moduleNames: ['premium'] } })).toBe(true);
        expect(isTransformScriptsEnabled({ samplemanagement: {} })).toBe(true);

        expect(
            isTransformScriptsEnabled({
                samplemanagement: {},
                core: { productFeatures: [ProductFeature.TransformScripts] },
            })
        ).toBe(true);

        expect(
            isTransformScriptsEnabled({
                samplemanagement: {},
                biologics: {},
            })
        ).toBe(true);

        window.history.pushState({}, 'isApp', '/lims-app.view#'); // isApp()
        expect(
            isTransformScriptsEnabled({
                samplemanagement: {},
                core: { productFeatures: [ProductFeature.TransformScripts] },
            })
        ).toBe(true);

        window.history.pushState({}, 'isApp', '/samplemanager-app.view#'); // isApp()
        expect(
            isTransformScriptsEnabled({
                samplemanagement: {},
                biologics: {},
                core: { productFeatures: [ProductFeature.TransformScripts] },
            })
        ).toBe(true);
    });

    test('isLKSSupportEnabled', () => {
        expect(isLKSSupportEnabled({})).toBe(false);
        expect(isLKSSupportEnabled({ inventory: {} })).toBe(false);
        expect(isLKSSupportEnabled({ api: { moduleNames: ['premium'] } })).toBe(true);
        expect(isLKSSupportEnabled({ samplemanagement: {} })).toBe(false);
        expect(
            isLKSSupportEnabled({
                samplemanagement: {},
                biologics: {},
            })
        ).toBe(true);
        expect(
            isLKSSupportEnabled({
                biologics: {},
            })
        ).toBe(true);
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

    test('isLIMSEnabled', () => {
        expect(isLIMSEnabled({})).toBeFalsy();
        expect(isLIMSEnabled({ inventory: {} })).toBeFalsy();
        expect(isLIMSEnabled({ inventory: {}, samplemanagement: {} })).toBeFalsy();
        expect(
            isLIMSEnabled(
                {
                    inventory: {},
                    samplemanagement: {},
                    core: { productFeatures: [ProductFeature.ChartBuilding] },
                },
                new Container({ folderType: 'LIMS' })
            )
        ).toBeTruthy();
        expect(isLIMSEnabled({ biologics: {}, samplemanagement: {}, inventory: {} })).toBeFalsy();
        expect(
            isLIMSEnabled(
                {
                    biologics: {},
                    samplemanagement: {},
                    inventory: {},
                    core: { productFeatures: [ProductFeature.ChartBuilding] },
                },
                new Container({ folderType: 'LIMS' })
            )
        ).toBeTruthy();
    });

    test('setProductFolders', () => {
        expect(setProductFolders({}, true)).toEqual({ query: { hasProductFolders: true } });
        expect(setProductFolders({ query: { hasProductFolders: false } }, true)).toEqual({
            query: { hasProductFolders: true },
        });
        LABKEY.moduleContext = { query: { ken: 'griffey' } };
        setProductFolders({ query: { hasProductFolders: true } }, false);
        expect(LABKEY.moduleContext.query).toEqual({ hasProductFolders: false, ken: 'griffey' });
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
        LABKEY.container = { type: 'project', path: 'project', folderType: 'Collaboration' };
        expect(isAppHomeFolder()).toBeTruthy();
        LABKEY.container = { type: 'project', path: 'project', folderType: 'Sample Manager' };
        expect(isAppHomeFolder()).toBeTruthy();
        LABKEY.container = { type: 'folder', path: 'project/a', folderType: 'Collaboration' };
        expect(isAppHomeFolder()).toBeTruthy();
        expect(isAppHomeFolder(null, { query: { isProductFoldersEnabled: false } })).toBeTruthy();
        expect(isAppHomeFolder(null, { query: { isProductFoldersEnabled: true } })).toBeFalsy();
        LABKEY.container = { type: 'folder', path: 'project/a', folderType: 'Biologics' };
        expect(isAppHomeFolder()).toBeTruthy();
        expect(isAppHomeFolder(null, { query: { isProductFoldersEnabled: false } })).toBeTruthy();
        expect(isAppHomeFolder(null, { query: { isProductFoldersEnabled: true } })).toBeFalsy();

        expect(isAppHomeFolder(new Container({ type: 'project', path: 'project' }))).toBeTruthy();
        expect(
            isAppHomeFolder(new Container({ type: 'project', path: 'project', folderType: 'Collaboration' }))
        ).toBeTruthy();
        expect(
            isAppHomeFolder(new Container({ type: 'project', path: 'project', folderType: 'Collaboration' }), {
                query: { isProductFoldersEnabled: false },
            })
        ).toBeTruthy();
        expect(
            isAppHomeFolder(new Container({ type: 'project', path: 'project', folderType: 'Sample Manager' }), {
                query: { isProductFoldersEnabled: false },
            })
        ).toBeTruthy();
        expect(
            isAppHomeFolder(new Container({ type: 'folder', path: 'project/a', folderType: 'Sample Manager' }))
        ).toBeTruthy();
        expect(
            isAppHomeFolder(new Container({ type: 'folder', path: 'project/a' }), {
                query: { isProductFoldersEnabled: false },
            })
        ).toBeTruthy();
        expect(
            isAppHomeFolder(new Container({ type: 'folder', path: 'project/a' }), {
                query: { isProductFoldersEnabled: true },
            })
        ).toBeFalsy();
    });

    test('sampleManagerIsPrimaryApp', () => {
        expect(sampleManagerIsPrimaryApp({})).toBeFalsy();
        expect(sampleManagerIsPrimaryApp({ inventory: {} })).toBeFalsy();
        expect(sampleManagerIsPrimaryApp({ samplemanagement: {}, inventory: {} })).toBeTruthy();
        expect(sampleManagerIsPrimaryApp({ biologics: {}, samplemanagement: {}, inventory: {} })).toBeFalsy();
        expect(sampleManagerIsPrimaryApp({ samplemanagement: {} })).toBeTruthy();
    });

    test('limsIsPrimaryApp', () => {
        LABKEY.container = { folderType: 'LIMS' };
        expect(limsIsPrimaryApp({})).toBe(false);
        expect(limsIsPrimaryApp({ inventory: {} })).toBeFalsy();
        expect(limsIsPrimaryApp({ samplemanagement: {}, inventory: {} })).toBeTruthy();
        expect(limsIsPrimaryApp({ biologics: {}, samplemanagement: {}, inventory: {} })).toBeFalsy();
        expect(limsIsPrimaryApp({ samplemanagement: {} })).toBeTruthy();
    });

    test('biologcisIsPrimaryApp', () => {
        expect(biologicsIsPrimaryApp({})).toBeFalsy();
        expect(biologicsIsPrimaryApp({ samplemanagement: {} })).toBeFalsy();
        expect(biologicsIsPrimaryApp({ inventory: {} })).toBeFalsy();
        expect(biologicsIsPrimaryApp({ biologics: {}, samplemanagement: {}, inventory: {} })).toBeTruthy();
        expect(biologicsIsPrimaryApp({ biologics: {}, samplemanagement: {} })).toBeTruthy();
    });

    test('getPrimaryAppProperties', () => {
        LABKEY.container = {};
        expect(getPrimaryAppProperties({})).toBe(undefined);
        expect(getPrimaryAppProperties({ inventory: {} })).toStrictEqual(FREEZER_MANAGER_APP_PROPERTIES);
        expect(getPrimaryAppProperties({ inventory: {}, samplemanagement: {} })).toStrictEqual(
            SAMPLE_MANAGER_APP_PROPERTIES
        );
        expect(getPrimaryAppProperties({ inventory: {}, samplemanagement: {}, biologics: {} })).toStrictEqual(
            BIOLOGICS_APP_PROPERTIES
        );
        LABKEY.container = { folderType: 'LIMS' };
        expect(getPrimaryAppProperties({ inventory: {}, samplemanagement: {} })).toStrictEqual(LIMS_APP_PROPERTIES);
        LABKEY.container = {};
    });

    test('isCalculatedFieldsEnabled', () => {
        expect(isCalculatedFieldsEnabled()).toBeFalsy();
        expect(isCalculatedFieldsEnabled()).toBeFalsy();
        expect(isCalculatedFieldsEnabled({ api: { moduleNames: [] } })).toBeFalsy(); // community
        expect(isCalculatedFieldsEnabled({ api: { moduleNames: ['premium'] } })).toBeTruthy(); // LKS Prof

        window.history.pushState({}, 'Test Title', '/samplemanager-app.view#'); // isApp()
        expect(isCalculatedFieldsEnabled()).toBeFalsy();
        expect(isCalculatedFieldsEnabled({ core: { productFeatures: [] } })).toBeFalsy();
        expect(
            isCalculatedFieldsEnabled({ core: { productFeatures: [ProductFeature.CalculatedFields] } })
        ).toBeTruthy();
    });

    test('isQueryMetadataEditor', () => {
        expect(isQueryMetadataEditor()).toBe(false);
        window.history.pushState({}, 'Test Title', '/query-metadataQuery.view#');
        expect(isQueryMetadataEditor()).toBe(true);
        window.history.pushState({}, 'Test Title', '/samplemanager-app.view#');
        expect(isQueryMetadataEditor()).toBe(false);
        window.history.pushState({}, 'Test Title', '/core-queryMetadataEditorDev.view#');
        expect(isQueryMetadataEditor()).toBe(true);
    });
});

describe('freezerManagerIsCurrentApp', () => {
    beforeEach(() => {
        window.history.pushState({}, 'Test Title', '/');
    });

    test('LKFM', () => {
        window.history.pushState({}, 'Test Title', '/freezermanager-app.view#'); // isApp()
        expect(freezerManagerIsCurrentApp()).toBe(true);
    });

    test('LKSM', () => {
        window.history.pushState({}, 'Test Title', '/samplemanager-app.view#'); // isApp()
        expect(freezerManagerIsCurrentApp()).toBe(false);
    });

    test('LIMS', () => {
        window.history.pushState({}, 'Test Title', '/lims-app.view#'); // isApp()
        expect(freezerManagerIsCurrentApp()).toBe(false);
    });

    test('LKB', () => {
        window.history.pushState({}, 'Test Title', '/biologics-app.view#'); // isApp()
        expect(freezerManagerIsCurrentApp()).toBe(false);
    });
});

describe('getCurrentAppProperties', () => {
    beforeEach(() => {
        window.history.pushState({}, 'Test Title', '/');
    });

    test('Sample Manager controller', () => {
        window.history.pushState({}, 'Test Title', 'labkey/Sam Man/samplemanager-app.view#');
        expect(getCurrentAppProperties()).toStrictEqual(SAMPLE_MANAGER_APP_PROPERTIES);
        window.history.pushState({}, 'Test Title', 'labkey/Biologics/samplemanager-app.view#');
        expect(getCurrentAppProperties()).toStrictEqual(SAMPLE_MANAGER_APP_PROPERTIES);
    });

    test('Biologics controller', () => {
        window.history.pushState({}, 'Test Title', 'labkey/Biologics/biologics-app.view#');
        expect(getCurrentAppProperties()).toStrictEqual(BIOLOGICS_APP_PROPERTIES);
        window.history.pushState({}, 'Test Title', 'labkey/samplemanager/biologics-app.view#');
        expect(getCurrentAppProperties()).toStrictEqual(BIOLOGICS_APP_PROPERTIES);
        window.history.pushState({}, 'Test Title', 'labkey/Biologics/BiologicS-app.view#');
        expect(getCurrentAppProperties()).toStrictEqual(BIOLOGICS_APP_PROPERTIES);
    });

    test('Freezer Manager controller', () => {
        window.history.pushState({}, 'Test Title', 'labkey/Biologics/freezermanager-app.view#');
        expect(getCurrentAppProperties()).toStrictEqual(FREEZER_MANAGER_APP_PROPERTIES);
        window.history.pushState({}, 'Test Title', 'labkey/sampleManager/FreezerManager-app.view#');
        expect(getCurrentAppProperties()).toStrictEqual(FREEZER_MANAGER_APP_PROPERTIES);
    });

    test('Non-app controller', () => {
        window.history.pushState({}, 'Test Title', 'labkey/Biologics/project-begin.view');
        expect(getCurrentAppProperties()).toBe(undefined);
    });
});

describe('getStorageSectionConfig', () => {
    test('reader, inventory app', () => {
        const config = getStorageSectionConfig(TEST_USER_READER, FREEZER_MANAGER_APP_PROPERTIES.productId, {
            inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId },
        });
        expect(config.emptyText).toBe('No storage has been defined');
        expect(config.emptyAppURL).toBe(undefined);
        expect(config.iconURL).toBe('/labkey/_images/freezer_menu.svg');
        expect(config.headerURLPart).toBe('home');
        expect(config.headerText).toBe(undefined);
    });

    test('reader, non-inventory app', () => {
        LABKEY.container = {};

        const config = getStorageSectionConfig(TEST_USER_READER, SAMPLE_MANAGER_APP_PROPERTIES.productId, {
            inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId },
        });
        expect(config.emptyURLText).toBe('Get started...');
        expect(config.emptyAppURL).toBe(undefined);
        expect(config.headerURLPart).toBe('home');
    });

    test('admin', () => {
        LABKEY.container = {
            path: 'Project A',
        };

        const config = getStorageSectionConfig(TEST_USER_FOLDER_ADMIN, BIOLOGICS_APP_PROPERTIES.productId, {
            inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId },
        });
        expect(config.emptyURLText).toBe('Create storage');
        expect(config.emptyAppURL?.toHref()).toBe('#/freezers/new');
        expect(config.headerURLPart).toBe('home');
    });

    test('admin, child folder', () => {
        LABKEY.container = {
            path: 'Project A/Child Folder 1',
        };

        const config = getStorageSectionConfig(TEST_USER_FOLDER_ADMIN, BIOLOGICS_APP_PROPERTIES.productId, {
            inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId },
        });
        expect(config.emptyURLText).toBe('Create storage');
        expect(config.emptyAppURL?.toHref()).toBe('#/freezers/new');
        expect(config.headerURLPart).toBe('home');
    });

    test('storage editor', () => {
        LABKEY.container = {
            path: undefined,
        };

        const config = getStorageSectionConfig(TEST_USER_STORAGE_EDITOR, BIOLOGICS_APP_PROPERTIES.productId, {
            inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId },
        });
        expect(config.emptyURLText).toBe('Get started...');
        expect(config.emptyAppURL).toBe(undefined);
        expect(config.headerURLPart).toBe('home');
    });

    test('storage designer', () => {
        LABKEY.container = {
            path: 'Project B',
        };

        const config = getStorageSectionConfig(TEST_USER_STORAGE_DESIGNER, BIOLOGICS_APP_PROPERTIES.productId, {
            inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId },
        });
        expect(config.emptyURLText).toBe('Create storage');
        expect(config.emptyAppURL?.toHref()).toBe('#/freezers/new');
        expect(config.headerURLPart).toBe('home');
    });

    test('storage designer, child container', () => {
        LABKEY.container = {
            path: 'Project B/Child 1',
        };

        const config = getStorageSectionConfig(TEST_USER_STORAGE_DESIGNER, BIOLOGICS_APP_PROPERTIES.productId, {
            inventory: { productId: FREEZER_MANAGER_APP_PROPERTIES.productId },
        });
        expect(config.emptyURLText).toBe('Create storage');
        expect(config.emptyAppURL?.toHref()).toBe('#/freezers/new');
        expect(config.headerURLPart).toBe('home');
    });
});

describe('addSourcesSectionConfig', () => {
    function validate(sectionConfig: MenuSectionConfig, canDesign = false) {
        expect(sectionConfig.emptyText).toBe('No source types have been defined');
        expect(sectionConfig.showActiveJobIcon).toBeTruthy();
        expect(sectionConfig.iconURL).toBe('/labkey/_images/source_type.svg');
        expect(sectionConfig.headerURLPart).toBe(undefined);
        expect(sectionConfig.headerText).toBe(undefined);
        if (canDesign) {
            expect(sectionConfig.emptyAppURL?.toHref()).toBe('#/sourceType/new');
            expect(sectionConfig.emptyURLText).toBe('Create a source type');
        } else {
            expect(sectionConfig.emptyAppURL).toBe(undefined);
        }
    }

    test('reader', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSourcesSectionConfig(TEST_USER_READER, configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SOURCES_KEY);
        validate(sectionConfig);
    });

    test('admin', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSourcesSectionConfig(TEST_USER_FOLDER_ADMIN, configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SOURCES_KEY);
        validate(sectionConfig, true);
    });

    test('storage editor', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSourcesSectionConfig(TEST_USER_READER, configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SOURCES_KEY);
        validate(sectionConfig);
    });

    test('storage designer', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addSourcesSectionConfig(TEST_USER_READER, configs);
        expect(configs.size).toBe(1);
        const sectionConfig = configs.get(0).get(SOURCES_KEY);
        validate(sectionConfig);
    });
});

describe('getSamplesSectionConfig', () => {
    test('reader', () => {
        const sectionConfig = getSamplesSectionConfig(TEST_USER_READER);
        expect(sectionConfig.emptyText).toBe('No sample types have been defined');
        expect(sectionConfig.emptyAppURL).toBe(undefined);
        expect(sectionConfig.showActiveJobIcon).toBeTruthy();
        expect(sectionConfig.iconURL).toBe('/labkey/_images/samples.svg');
        expect(sectionConfig.headerURLPart).toBe(undefined);
        expect(sectionConfig.headerText).toBe(undefined);
    });

    test('admin', () => {
        const sectionConfig = getSamplesSectionConfig(TEST_USER_FOLDER_ADMIN);
        expect(sectionConfig.emptyAppURL?.toHref()).toBe('#/sampleType/new');
        expect(sectionConfig.emptyURLText).toBe('Create a sample type');
    });
});

describe('addAssaySectionConfig', () => {
    test('reader', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_READER, configs, false);
        expect(configs.size).toBe(1);
        let sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.emptyText).toBe('No assays have been defined');
        expect(sectionConfig.emptyAppURL).toBe(undefined);
        expect(sectionConfig.showActiveJobIcon).toBeTruthy();
        expect(sectionConfig.iconURL).toBe('/labkey/_images/assay.svg');
        expect(sectionConfig.headerURLPart).toBe(undefined);
        expect(sectionConfig.headerText).toBe(undefined);

        configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_READER, configs, true);
        expect(configs.size).toBe(1);
        sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.emptyAppURL).toBe(undefined);
    });

    test('admin', () => {
        let configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_FOLDER_ADMIN, configs, false);
        expect(configs.size).toBe(1);
        let sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.emptyText).toBe('No assays have been defined');
        expect(sectionConfig.emptyAppURL?.toHref()).toBe('#/assayDesign/new');
        expect(sectionConfig.emptyURLText).toBe('Create an assay design');

        configs = List<Map<string, MenuSectionConfig>>();
        configs = addAssaysSectionConfig(TEST_USER_FOLDER_ADMIN, configs, true);
        expect(configs.size).toBe(1);
        sectionConfig = configs.get(0).get(ASSAYS_KEY);
        expect(sectionConfig.emptyAppURL?.toHref()).toBe('#/assayDesign/General');
    });
});

describe('isSharedContainer', () => {
    test('not shared', () => {
        expect(isSharedContainer('/home/other')).toBe(false);
        expect(isSharedContainer('/home')).toBe(false);
        expect(isSharedContainer('/shared')).toBe(false);
    });

    test('Shared', () => {
        expect(isSharedContainer('/Shared')).toBe(true);
    });
});
