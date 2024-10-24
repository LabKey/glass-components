/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { List, Map } from 'immutable';
import { ActionURL, getServerContext, LabKey, PermissionTypes } from '@labkey/api';

import { useMemo } from 'react';

import { hasAllPermissions, hasPermissions, User } from '../components/base/models/User';

import { MenuSectionConfig } from '../components/navigation/model';
import { imageURL } from '../url/ActionURL';
import { AppURL } from '../url/AppURL';
import { ModuleContext } from '../components/base/ServerContext';

import { Container } from '../components/base/models/Container';

import { SHARED_CONTAINER_PATH } from '../constants';

import { AppProperties } from './models';
import {
    ASSAYS_KEY,
    BIOLOGICS_APP_PROPERTIES,
    EXPERIMENTAL_PRODUCT_ALL_FOLDER_LOOKUPS,
    EXPERIMENTAL_PRODUCT_FOLDER_DATA_LISTING_SCOPED,
    EXPERIMENTAL_REQUESTS_MENU,
    EXPERIMENTAL_SAMPLE_ALIQUOT_SELECTOR,
    FREEZER_MANAGER_APP_PROPERTIES,
    FREEZERS_KEY,
    HOME_KEY,
    LABKEY_SERVER_PRODUCT_NAME,
    LIMS_APP_PROPERTIES,
    MEDIA_KEY,
    NEW_ASSAY_DESIGN_HREF,
    NEW_SAMPLE_TYPE_HREF,
    NEW_SOURCE_TYPE_HREF,
    NEW_STANDARD_ASSAY_DESIGN_HREF,
    NOTEBOOKS_KEY,
    PICKLIST_KEY,
    PLATES_KEY,
    ProductFeature,
    FOLDER_DATA_TYPE_EXCLUSIONS,
    REGISTRY_KEY,
    REQUESTS_KEY,
    SAMPLE_MANAGER_APP_PROPERTIES,
    SAMPLES_KEY,
    SOURCES_KEY,
    USER_KEY,
    WORKFLOW_KEY,
} from './constants';

declare var LABKEY: LabKey;

// Type definition not provided for event codes so here we provide our own
// Source: https://www.iana.org/assignments/websocket/websocket.xml#close-code-number
export enum CloseEventCode {
    NORMAL_CLOSURE = 1000,
    GOING_AWAY = 1001,
    PROTOCOL_ERROR = 1002,
    UNSUPPORTED_DATA = 1003,
    RESERVED = 1004,
    NO_STATUS_RCVD = 1005,
    ABNORMAL_CLOSURE = 1006,
    INVALID_FRAME_PAYLOAD_DATA = 1007,
    POLICY_VIOLATION = 1008,
    MESSAGE_TOO_BIG = 1009,
    MISSING_EXT = 1010,
    INTERNAL_ERROR = 1011,
    SERVICE_RESTART = 1012,
    TRY_AGAIN_LATER = 1013,
    BAD_GATEWAY = 1014,
    TLS_HANDSHAKE = 1015,
}

export function resolveModuleContext(moduleContext?: ModuleContext): ModuleContext {
    return moduleContext ?? getServerContext().moduleContext;
}

export function userCanReadAssays(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ReadAssay]);
}

export function userCanReadSources(user: User): boolean {
    return userCanReadDataClasses(user);
}

export function userCanReadRegistry(user: User): boolean {
    return userCanReadDataClasses(user);
}

export function userCanReadDataClasses(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ReadDataClass]);
}

export function userCanReadMedia(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ReadMedia]);
}

export function userCanReadNotebooks(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ReadNotebooks]);
}

export function userCanManagePicklists(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ManagePicklists]);
}

export function userCanDeletePublicPicklists(user: User): boolean {
    return user.isAdmin;
}

export function userCanManageSampleWorkflow(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.ManageSampleWorkflows], false);
}

export function userCanDesignSourceTypes(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.DesignDataClass]);
}

export function userCanDesignLocations(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.DesignStorage], false);
}

export function userCanEditStorageData(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.EditStorageData], false);
}

export function userCanReadUserDetails(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.CanSeeUserDetails], false);
}

export function userCanReadGroupDetails(user: User): boolean {
    return hasAllPermissions(user, [PermissionTypes.CanSeeGroupDetails], false);
}

export function userCanEditSharedViews(user: User): boolean {
    return hasPermissions(user, [PermissionTypes.EditSharedView]);
}

export function isFreezerManagementEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.inventory !== undefined;
}

export function isOntologyEnabled(moduleContext?: ModuleContext): boolean {
    return hasModule('Ontology', moduleContext);
}

export function isProductNavigationEnabled(productId: string, moduleContext?: ModuleContext): boolean {
    if (productId === LIMS_APP_PROPERTIES.productId) {
        return isLIMSEnabled(moduleContext);
    } else if (productId === SAMPLE_MANAGER_APP_PROPERTIES.productId) {
        return (
            isSampleManagerEnabled(moduleContext) && !isLIMSEnabled(moduleContext) && !isBiologicsEnabled(moduleContext)
        );
    } else if (productId === BIOLOGICS_APP_PROPERTIES.productId) {
        return isBiologicsEnabled(moduleContext);
    }

    return false;
}

export function isExperimentAliasEnabled(moduleContext?: ModuleContext): boolean {
    return biologicsIsPrimaryApp(moduleContext);
}
export function isProductFoldersEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.query?.isProductFoldersEnabled === true;
}

export function hasProductFolders(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.query?.hasProductFolders === true;
}

export function setProductFolders(moduleContext: ModuleContext, hasProductFolders: boolean): ModuleContext {
    // side-effect set global moduleContext
    if (LABKEY?.moduleContext?.query) {
        LABKEY.moduleContext.query.hasProductFolders = hasProductFolders;
    }

    return Object.assign(moduleContext ?? {}, {
        query: Object.assign(moduleContext?.query ?? {}, { hasProductFolders }),
    });
}

export function isSampleManagerEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.samplemanagement !== undefined;
}

export function isBiologicsEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.biologics !== undefined;
}

export function isPremiumProductEnabled(moduleContext?: ModuleContext): boolean {
    return isSampleManagerEnabled(moduleContext) || isBiologicsEnabled(moduleContext);
}

export function isAppHomeFolder(container?: Partial<Container>, moduleContext?: ModuleContext): boolean {
    // If it's a Home project, or if it's a subfolder and products are disabled.
    const currentContainer: Partial<Container> = container ?? getServerContext().container;
    const isTopFolder = currentContainer.isProject || isProjectContainer(currentContainer.path);
    const isSubFolder = currentContainer.isFolder || isSubFolderContainer(currentContainer.path);
    return isTopFolder || (isSubFolder && !isProductFoldersEnabled(moduleContext));
}

export function getAppHomeFolderPath(container?: Partial<Container>, moduleContext?: ModuleContext): string {
    const currentContainer: Partial<Container> = container ?? getServerContext().container;
    return isAppHomeFolder(currentContainer, moduleContext) ? currentContainer.path : currentContainer.parentPath;
}

export function getAppHomeFolderId(container?: Container, moduleContext?: ModuleContext): string {
    const currentContainer: Partial<Container> = container ?? getServerContext().container;
    return isAppHomeFolder(currentContainer, moduleContext) ? currentContainer.id : currentContainer.parentId;
}

export function isSharedContainer(containerPath: string): boolean {
    return containerPath === SHARED_CONTAINER_PATH;
}

export function sampleManagerIsPrimaryApp(moduleContext?: ModuleContext): boolean {
    return getPrimaryAppProperties(moduleContext)?.productId === SAMPLE_MANAGER_APP_PROPERTIES.productId;
}

export function biologicsIsPrimaryApp(moduleContext?: ModuleContext): boolean {
    return getPrimaryAppProperties(moduleContext)?.productId === BIOLOGICS_APP_PROPERTIES.productId;
}

export function limsIsPrimaryApp(moduleContext?: ModuleContext): boolean {
    return getPrimaryAppProperties(moduleContext)?.productId === LIMS_APP_PROPERTIES.productId;
}

export function freezerManagerIsCurrentApp(): boolean {
    return getCurrentAppProperties()?.productId === FREEZER_MANAGER_APP_PROPERTIES.productId;
}

export function isSampleStatusEnabled(moduleContext?: ModuleContext): boolean {
    return hasModule('SampleManagement', moduleContext);
}

export function isQueryMetadataEditor(): boolean {
    const action = ActionURL.getAction()?.toLowerCase() || '';
    return action === 'metadataquery' || action.startsWith('querymetadataeditor');
}

export function getCurrentAppProperties(): AppProperties {
    const lcController = ActionURL.getController().toLowerCase();
    if (!lcController) return undefined;
    if (lcController === SAMPLE_MANAGER_APP_PROPERTIES.controllerName.toLowerCase()) {
        return SAMPLE_MANAGER_APP_PROPERTIES;
    } else if (lcController === BIOLOGICS_APP_PROPERTIES.controllerName.toLowerCase()) {
        return BIOLOGICS_APP_PROPERTIES;
    } else if (lcController === FREEZER_MANAGER_APP_PROPERTIES.controllerName.toLowerCase()) {
        return FREEZER_MANAGER_APP_PROPERTIES;
    } else if (lcController === LIMS_APP_PROPERTIES.controllerName.toLowerCase()) {
        return LIMS_APP_PROPERTIES;
    }
    return undefined;
}

export function isApp(): boolean {
    return getCurrentAppProperties() !== undefined;
}

/**
 * In LKS we use the 'primary' bootstrap class for submit buttons, but in our apps we use 'success', this helper method
 * returns the correct class for you.
 */
export function getSubmitButtonClass(): string {
    return isApp() ? 'success' : 'primary';
}

export function getPrimaryAppProperties(moduleContext?: ModuleContext): AppProperties {
    // Issue 47390: when URL is in the LKB or LKSM controller, then that should be considered the primary app
    //              it is the LKFM app case when we want to determine the primary app based on enabled modules
    const currentAppProperties = getCurrentAppProperties();
    if (
        currentAppProperties?.productId === BIOLOGICS_APP_PROPERTIES.productId ||
        currentAppProperties?.productId === SAMPLE_MANAGER_APP_PROPERTIES.productId ||
        currentAppProperties?.productId === LIMS_APP_PROPERTIES.productId
    ) {
        return currentAppProperties;
    }

    if (isBiologicsEnabled(moduleContext)) {
        return BIOLOGICS_APP_PROPERTIES;
    } else if (isLIMSEnabled(moduleContext)) {
        return LIMS_APP_PROPERTIES;
    } else if (isSampleManagerEnabled(moduleContext)) {
        return SAMPLE_MANAGER_APP_PROPERTIES;
    } else if (isFreezerManagementEnabled(moduleContext)) {
        return FREEZER_MANAGER_APP_PROPERTIES;
    } else {
        return undefined;
    }
}

export function isAllProductFoldersFilteringEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.query?.[EXPERIMENTAL_PRODUCT_ALL_FOLDER_LOOKUPS] === true;
}

export function isProductFoldersDataListingScopedToFolder(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.query?.[EXPERIMENTAL_PRODUCT_FOLDER_DATA_LISTING_SCOPED] === true;
}

export function getFolderDataExclusion(moduleContext?: ModuleContext): { [key: string]: number[] } {
    return resolveModuleContext(moduleContext)?.samplemanagement?.[FOLDER_DATA_TYPE_EXCLUSIONS];
}

export function getFolderDashboardSampleTypeExclusion(moduleContext?: ModuleContext): number[] {
    return getFolderDataExclusion(moduleContext)?.['DashboardSampleType'];
}

export function getFolderSampleTypeExclusion(moduleContext?: ModuleContext): number[] {
    return getFolderDataExclusion(moduleContext)?.['SampleType'];
}

export function getFolderDataClassExclusion(moduleContext?: ModuleContext): number[] {
    return getFolderDataExclusion(moduleContext)?.['DataClass'];
}

export function getFolderAssayDesignExclusion(moduleContext?: ModuleContext): number[] {
    return getFolderDataExclusion(moduleContext)?.['AssayDesign'];
}

export function isAssayEnabled(moduleContext?: ModuleContext): boolean {
    return (
        hasModule('assay', moduleContext) &&
        (isCommunityDistribution(moduleContext) || isFeatureEnabled(ProductFeature.Assay, moduleContext))
    );
}

export function isAssayQCEnabled(moduleContext?: ModuleContext): boolean {
    // NK: The product tiers which include Assay QC are not fully defined.
    // For now (v22.11+), we're going to continue offering Assay QC features until
    // we can fully define all desired product tiers. Once that is done we can respect
    // the associated feature flag instead.
    // isFeatureEnabled(ProductFeature.AssayQC, moduleContext)
    return isAssayEnabled(moduleContext) && hasPremiumModule(moduleContext);
}

export function isAssayRequestsEnabled(moduleContext?: ModuleContext): boolean {
    return (
        hasModule('assayRequest', moduleContext) &&
        resolveModuleContext(moduleContext)?.biologics?.[EXPERIMENTAL_REQUESTS_MENU] === true
    );
}

// Don't enable assay design export unless there is an import capability (which we don't have for LKSM products)
export function isAssayDesignExportEnabled(moduleContext?: ModuleContext): boolean {
    return hasPremiumModule(moduleContext);
}

export function isNonstandardAssayEnabled(moduleContext?: ModuleContext): boolean {
    return isFeatureEnabled(ProductFeature.NonstandardAssay, moduleContext);
}

export function isPlatesEnabled(moduleContext?: ModuleContext): boolean {
    return biologicsIsPrimaryApp(moduleContext);
}

export function isChartBuilderEnabled(moduleContext?: ModuleContext): boolean {
    return isFeatureEnabled(ProductFeature.ChartBuilding, moduleContext);
}

// Should be enabled for LKS Community & LKS Starter, but in the apps only if the feature is enabled
export function isTransformScriptsEnabled(moduleContext?: ModuleContext): boolean {
    return isApp() ? isFeatureEnabled(ProductFeature.TransformScripts, moduleContext) : true;
}

export function isRReportsEnabled(moduleContext?: ModuleContext): boolean {
    return biologicsIsPrimaryApp(moduleContext);
}

export function isLKSSupportEnabled(moduleContext?: ModuleContext): boolean {
    return isBiologicsEnabled(moduleContext) || hasPremiumModule(moduleContext);
}

export function isLIMSEnabled(moduleContext?: ModuleContext, container?: Container): boolean {
    // The check for folder type is not ideal here, but since the product is provided through the sampleManagement module
    // a simple module check isn't sufficient. Since the product configuration is global to the server, we have no good
    // way to know which URLs to construct in a particular container except by inspecting the folder type (at the moment).
    return isSampleManagerEnabled(moduleContext) && (container ?? getServerContext().container)?.folderType === 'LIMS';
}

export function isAssayFileUploadEnabled(moduleContext?: ModuleContext): boolean {
    return isBiologicsEnabled(moduleContext) || isLIMSEnabled(moduleContext);
}

export function isELNEnabled(moduleContext?: ModuleContext): boolean {
    return hasModule('LabBook', moduleContext) && isFeatureEnabled(ProductFeature.ELN, moduleContext);
}

export function isProtectedDataEnabled(moduleContext?: ModuleContext): boolean {
    return hasModule('compliance', moduleContext) && hasModule('complianceActivities', moduleContext);
}

export function isNamingPrefixEnabled(moduleContext?: ModuleContext): boolean {
    return isBiologicsEnabled(moduleContext);
}

export function isMediaEnabled(moduleContext?: ModuleContext): boolean {
    return isBiologicsEnabled(moduleContext) && isFeatureEnabled(ProductFeature.Media, moduleContext);
}

export function isRegistryEnabled(moduleContext?: ModuleContext): boolean {
    return isBiologicsEnabled(moduleContext) && isFeatureEnabled(ProductFeature.BiologicsRegistry, moduleContext);
}

export function isSourceTypeEnabled(moduleContext?: ModuleContext): boolean {
    return isSampleManagerEnabled(moduleContext) && !isRegistryEnabled(moduleContext);
}

export function isAdvancedDomainPropertiesEnabled(moduleContext?: ModuleContext): boolean {
    return !sampleManagerIsPrimaryApp(moduleContext) || hasPremiumModule(moduleContext);
}

export function isNotebookTagsEnabled(moduleContext?: ModuleContext): boolean {
    return isBiologicsEnabled(moduleContext);
}

export function isWorkflowEnabled(moduleContext?: ModuleContext): boolean {
    return (
        hasModule(SAMPLE_MANAGER_APP_PROPERTIES.moduleName, moduleContext) &&
        isFeatureEnabled(ProductFeature.Workflow, moduleContext)
    );
}

export function isDataChangeCommentRequirementFeatureEnabled(moduleContext?: ModuleContext): boolean {
    return isFeatureEnabled(ProductFeature.DataChangeCommentRequirement, moduleContext);
}

export function isCalculatedFieldsEnabled(moduleContext?: ModuleContext): boolean {
    return isApp()
        ? isFeatureEnabled(ProductFeature.CalculatedFields, moduleContext)
        : !isCommunityDistribution(moduleContext);
}

export function isFeatureEnabled(flag: ProductFeature, moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.core?.productFeatures?.indexOf(flag) >= 0;
}

export function isSampleAliquotSelectorEnabled(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.samplemanagement?.[EXPERIMENTAL_SAMPLE_ALIQUOT_SELECTOR] === true;
}

export function hasModule(moduleName: string, moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext).api?.moduleNames?.indexOf(moduleName.toLowerCase()) >= 0;
}

export function hasPremiumModule(moduleContext?: ModuleContext): boolean {
    return hasModule('Premium', moduleContext);
}

export function isCommunityDistribution(moduleContext?: ModuleContext): boolean {
    return !hasModule('SampleManagement', moduleContext) && !hasPremiumModule(moduleContext);
}

export function isRestrictedIssueListSupported(moduleContext?: ModuleContext): boolean {
    return resolveModuleContext(moduleContext)?.issues?.hasRestrictedIssueList === true;
}

export function isProjectContainer(containerPath?: string): boolean {
    return getContainerDepth(containerPath) === 1;
}

function isSubFolderContainer(containerPath?: string): boolean {
    return getContainerDepth(containerPath) > 1;
}

export function getContainerDepth(containerPath?: string): number {
    let path = containerPath ?? getServerContext().container.path;
    if (!path) return 0;
    if (!path.endsWith('/')) path = path + '/';
    return path.split('/').filter(p => !!p).length;
}

export function getProjectPath(containerPath?: string): string {
    const path = containerPath ?? getServerContext().container.path;
    if (!path) return undefined;
    return path.split('/').filter(p => !!p)[0] + '/';
}

// exported for testing
export function getStorageSectionConfig(user: User, currentProductId: string, moduleContext: any): MenuSectionConfig {
    if (isFreezerManagementEnabled(moduleContext)) {
        let locationsMenuConfig = new MenuSectionConfig({
            emptyText: 'No storage has been defined',
            filteredEmptyText: 'No storage available',
            iconURL: imageURL('_images', 'freezer_menu.svg'),
            headerURLPart: HOME_KEY,
        });
        if (user && userCanDesignLocations(user)) {
            locationsMenuConfig = locationsMenuConfig.merge({
                emptyAppURL: AppURL.create(FREEZERS_KEY, 'new'),
                emptyURLText: 'Create storage',
            }) as MenuSectionConfig;
        }
        return locationsMenuConfig;
    }
    return undefined;
}

// exported for testing
export function addSourcesSectionConfig(
    user: User,
    sectionConfigs: List<Map<string, MenuSectionConfig>>
): List<Map<string, MenuSectionConfig>> {
    let sourcesMenuConfig = new MenuSectionConfig({
        emptyText: 'No source types have been defined',
        filteredEmptyText: 'No source types available',
        iconURL: imageURL('_images', 'source_type.svg'),
    });
    if (user && userCanDesignSourceTypes(user)) {
        sourcesMenuConfig = sourcesMenuConfig.merge({
            emptyAppURL: NEW_SOURCE_TYPE_HREF,
            emptyURLText: 'Create a source type',
        }) as MenuSectionConfig;
    }
    return sectionConfigs.push(Map({ [SOURCES_KEY]: sourcesMenuConfig }));
}

// exported for testing
export function getSamplesSectionConfig(user: User): MenuSectionConfig {
    let samplesMenuConfig = new MenuSectionConfig({
        emptyText: 'No sample types have been defined',
        filteredEmptyText: 'No sample types available',
        iconURL: imageURL('_images', 'samples.svg'),
    });
    if (user && user.hasDesignSampleTypesPermission()) {
        samplesMenuConfig = samplesMenuConfig.merge({
            emptyAppURL: NEW_SAMPLE_TYPE_HREF,
            emptyURLText: 'Create a sample type',
        }) as MenuSectionConfig;
    }
    return samplesMenuConfig;
}

// exported for testing
export function addAssaysSectionConfig(
    user: User,
    sectionConfigs: List<Map<string, MenuSectionConfig>>,
    standardAssayOnly: boolean
): List<Map<string, MenuSectionConfig>> {
    let assaysMenuConfig = new MenuSectionConfig({
        emptyText: 'No assays have been defined',
        filteredEmptyText: 'No assays available',
        iconURL: imageURL('_images', 'assay.svg'),
    });
    if (user && user.hasDesignAssaysPermission()) {
        assaysMenuConfig = assaysMenuConfig.merge({
            emptyAppURL: standardAssayOnly ? NEW_STANDARD_ASSAY_DESIGN_HREF : NEW_ASSAY_DESIGN_HREF,
            emptyURLText: 'Create an assay design',
        }) as MenuSectionConfig;
    }
    return sectionConfigs.push(Map<string, MenuSectionConfig>().set(ASSAYS_KEY, assaysMenuConfig));
}

export function getPlatesSectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'plates.svg'),
        staticContent: true,
    });
}

function getWorkflowSectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'workflow.svg'),
    });
}

function getPicklistsSectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'picklist.svg'),
    });
}

function getNotebooksSectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('labbook/images', 'notebook_blue.svg'),
    });
}

function getMediaSectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'mixtures.svg'),
    });
}

function getRegistrySectionConfig(): MenuSectionConfig {
    return new MenuSectionConfig({
        iconURL: imageURL('_images', 'molecule.svg'),
    });
}

const USER_SECTION_CONFIG = new MenuSectionConfig({
    iconCls: 'fas fa-user-circle ',
});

const REQUESTS_SECTION_CONFIG = new MenuSectionConfig({
    useOriginalURL: true,
    iconURL: imageURL('_images', 'default.svg'),
    staticContent: true,
});

function getBioWorkflowNotebookMediaConfigs(): Map<string, MenuSectionConfig> {
    return Map({
        [WORKFLOW_KEY]: getWorkflowSectionConfig(),
        [MEDIA_KEY]: getMediaSectionConfig(),
        [PICKLIST_KEY]: getPicklistsSectionConfig(),
        [NOTEBOOKS_KEY]: getNotebooksSectionConfig(),
    });
}

// exported for testing
export function getMenuSectionConfigs(
    user: User,
    currentProductId: string,
    moduleContext?: ModuleContext
): List<Map<string, MenuSectionConfig>> {
    let sectionConfigs = List<Map<string, MenuSectionConfig>>();

    const isBioEnabled = isBiologicsEnabled(moduleContext);
    const isSMEnabled = isSampleManagerEnabled(moduleContext);
    if (isRegistryEnabled(moduleContext)) {
        sectionConfigs = sectionConfigs.push(Map({ [REGISTRY_KEY]: getRegistrySectionConfig() }));
    } else if (isSMEnabled) {
        sectionConfigs = addSourcesSectionConfig(user, sectionConfigs);
    }
    if (isSMEnabled) {
        let configs = Map<string, MenuSectionConfig>({ [SAMPLES_KEY]: getSamplesSectionConfig(user) });
        if (isPlatesEnabled(moduleContext)) {
            configs = configs.set(PLATES_KEY, getPlatesSectionConfig());
        }
        sectionConfigs = sectionConfigs.push(configs);

        if (isAssayEnabled(moduleContext)) {
            sectionConfigs = addAssaysSectionConfig(user, sectionConfigs, isNonstandardAssayEnabled(moduleContext));
        }
    }

    const storageConfig = getStorageSectionConfig(user, currentProductId, moduleContext);

    if (isBioEnabled) {
        if (isAssayRequestsEnabled(moduleContext)) {
            // When "Requests" are enabled render as two columns
            let requestsCol = Map({
                [REQUESTS_KEY]: REQUESTS_SECTION_CONFIG,
            });
            // ... and put the storage in this same column
            if (storageConfig) {
                requestsCol = requestsCol.set(FREEZERS_KEY, storageConfig);
            }
            sectionConfigs = sectionConfigs.push(requestsCol, getBioWorkflowNotebookMediaConfigs());
        } else {
            if (storageConfig) {
                sectionConfigs = sectionConfigs.push(Map({ [FREEZERS_KEY]: storageConfig }));
            }

            sectionConfigs = sectionConfigs.push(getBioWorkflowNotebookMediaConfigs());
        }
    } else if (isSMEnabled) {
        if (storageConfig) {
            sectionConfigs = sectionConfigs.push(Map({ [FREEZERS_KEY]: storageConfig }));
        }
        let configs = Map<string, MenuSectionConfig>({});
        if (isWorkflowEnabled(moduleContext)) {
            configs = configs.set(WORKFLOW_KEY, getWorkflowSectionConfig());
        }
        configs = configs.set(PICKLIST_KEY, getPicklistsSectionConfig());
        if (isELNEnabled(moduleContext)) {
            configs = configs.set(NOTEBOOKS_KEY, getNotebooksSectionConfig());
        }
        sectionConfigs = sectionConfigs.push(configs);
    } else {
        if (storageConfig) {
            sectionConfigs = sectionConfigs.push(Map({ [FREEZERS_KEY]: storageConfig }));
        }
        sectionConfigs = sectionConfigs.push(Map({ [USER_KEY]: USER_SECTION_CONFIG }));
    }
    return sectionConfigs;
}

export const useMenuSectionConfigs = (
    user: User,
    appProperties: AppProperties,
    moduleContext?: ModuleContext
): List<Map<string, MenuSectionConfig>> => {
    return useMemo(
        () => getMenuSectionConfigs(user, appProperties.productId, moduleContext),
        [user, moduleContext, appProperties.productId]
    );
};

// Returns the friendly name of the product, primarily for use in help text.
export function getCurrentProductName(moduleContext?: ModuleContext): string {
    const lcController = ActionURL.getController().toLowerCase();
    if (!lcController) return LABKEY_SERVER_PRODUCT_NAME;

    if (isPremiumProductEnabled(moduleContext)) {
        return getPrimaryAppProperties(moduleContext).name;
    }
    return LABKEY_SERVER_PRODUCT_NAME;
}

export function getAppProductIds(appProductId: string): List<string> {
    let productIds = List.of(appProductId);
    if (
        appProductId === SAMPLE_MANAGER_APP_PROPERTIES.productId ||
        appProductId === BIOLOGICS_APP_PROPERTIES.productId ||
        appProductId === LIMS_APP_PROPERTIES.productId
    ) {
        productIds = productIds.push(FREEZER_MANAGER_APP_PROPERTIES.productId);
    }
    return productIds;
}
