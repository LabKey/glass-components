/*
 * Copyright (c) 2019 LabKey Corporation. All rights reserved. No portion of this work may be reproduced in
 * any form or by any electronic or mechanical means without written permission from LabKey Corporation.
 */
import { AppURL } from '../url/AppURL';

import { imageURL } from '../url/ActionURL';

import { SAMPLE_MANAGER_SEARCH_PLACEHOLDER, SEARCH_PLACEHOLDER } from '../components/navigation/constants';

import { GENERAL_ASSAY_PROVIDER_NAME } from '../components/assay/constants';

import { AppProperties } from './models';

// These ids should match what is used by the MenuProviders in the Java code, so we can avoid toLowerCase comparisons.
export const LKS_PRODUCT_ID = 'LabKeyServer';
const BIOLOGICS_PRODUCT_ID = 'Biologics';
const LIMS_PRODUCT_ID = 'LIMS';
const SAMPLE_MANAGER_PRODUCT_ID = 'SampleManager';
const FREEZER_MANAGER_PRODUCT_ID = 'FreezerManager';

const SAMPLE_MANAGER_PRODUCT_NAME = 'Sample Manager';
const BIOLOGICS_PRODUCT_NAME = 'Biologics';
const LIMS_PRODUCT_NAME = 'LabKey LIMS';
export const LABKEY_SERVER_PRODUCT_NAME = 'LabKey Server';
const FREEZER_MANAGER_PRODUCT_NAME = 'Freezer Manager';

const BIOLOGICS_CONTROLLER_NAME = 'biologics';
const LIMS_CONTROLLER_NAME = 'lims';
const SAMPLE_MANAGER_CONTROLLER_NAME = 'sampleManager';
const FREEZER_MANAGER_CONTROLLER_NAME = 'freezerManager';

export const ASSAYS_KEY = 'assays';
export const ASSAY_DESIGN_KEY = 'assayDesign';
export const AUDIT_KEY = 'audit';
export const SAMPLES_KEY = 'samples';
export const SAMPLE_TYPE_KEY = 'sampleType';
export const SEARCH_KEY = 'search';
export const SOURCES_KEY = 'sources';
export const DATA_CLASS_KEY = 'dataclass';
export const SOURCE_TYPE_KEY = 'sourceType';
export const WORKFLOW_KEY = 'workflow';
export const FREEZERS_KEY = 'freezers';
export const BOXES_KEY = 'boxes';
export const HOME_KEY = 'home';
export const USER_KEY = 'user';
export const PLATES_KEY = 'plates';
export const PICKLIST_KEY = 'picklist';
export const FIND_SAMPLES_BY_ID_KEY = 'samplesById';
export const FIND_SAMPLES_BY_FILTER_KEY = 'samplesByFilter';
export const REQUESTS_KEY = 'requests';
export const MEDIA_KEY = 'media';
export const NOTEBOOKS_KEY = 'notebooks';
export const REGISTRY_KEY = 'registry';
export const ELN_KEY = 'notebooks';
export const CROSS_TYPE_KEY = 'crossType';

export const MINE_KEY = 'mine';
export const TEAM_KEY = 'team';

export enum EntityCreationMode {
    FILE_IMPORT = 'fileimport',
    FILE_UPDATE = 'update',
    GRID_INSERT = 'gridinsert',
}

export const FIND_SAMPLES_BY_ID_HREF = AppURL.create(SEARCH_KEY, FIND_SAMPLES_BY_ID_KEY);
export const FIND_SAMPLES_BY_FILTER_HREF = AppURL.create(SEARCH_KEY, FIND_SAMPLES_BY_FILTER_KEY);
export const FILE_IMPORT_SAMPLES_HREF = AppURL.create(SAMPLES_KEY, 'new').addParam(
    'mode',
    EntityCreationMode.FILE_IMPORT
);
export const GRID_INSERT_SAMPLES_HREF = AppURL.create(SAMPLES_KEY, 'new').addParam(
    'mode',
    EntityCreationMode.GRID_INSERT
);
export const FILE_UPDATE_SAMPLES_HREF = AppURL.create(SAMPLES_KEY, 'new').addParam(
    'mode',
    EntityCreationMode.FILE_UPDATE
);
export const NEW_SOURCE_TYPE_HREF = AppURL.create(SOURCE_TYPE_KEY, 'new');
export const NEW_SAMPLE_TYPE_HREF = AppURL.create(SAMPLE_TYPE_KEY, 'new');
export const NEW_STANDARD_ASSAY_DESIGN_HREF = AppURL.create(ASSAY_DESIGN_KEY, GENERAL_ASSAY_PROVIDER_NAME);
export const NEW_ASSAY_DESIGN_HREF = AppURL.create(ASSAY_DESIGN_KEY, 'new');
export const WORKFLOW_HOME_HREF = AppURL.create(WORKFLOW_KEY)
    .addParam('mine.sort', 'DueDate')
    .addParam('active.sort', 'DueDate');
export const PICKLIST_HOME_HREF = AppURL.create(PICKLIST_KEY);
export const MY_PICKLISTS_HREF = AppURL.create(PICKLIST_KEY, MINE_KEY);
export const TEAM_PICKLISTS_HREF = AppURL.create(PICKLIST_KEY, TEAM_KEY);

export const USER_PERMISSIONS_REQUEST = '/app/USER_PERMISSIONS_REQUEST';
export const USER_PERMISSIONS_SUCCESS = '/app/USER_PERMISSIONS_SUCCESS';
export const UPDATE_USER = '/app/UPDATE_USER';
export const UPDATE_USER_DISPLAY_NAME = '/app/UPDATE_USER_DISPLAY_NAME';
export const MENU_LOADING_START = '/app/MENU_LOADING_START';
export const MENU_LOADING_END = '/app/MENU_LOADING_END';
export const MENU_LOADING_ERROR = '/app/MENU_LOADING_ERROR';
export const MENU_INVALIDATE = '/app/MENU_INVALIDATE';
export const MENU_RELOAD = '/app/MENU_RELOAD';

export const SERVER_NOTIFICATIONS_LOADING_START = 'app/SERVER_NOTIFICATIONS_LOADING_START';
export const SERVER_NOTIFICATIONS_LOADING_END = 'app/SERVER_NOTIFICATIONS_LOADING_END';
export const SERVER_NOTIFICATIONS_LOADING_ERROR = 'app/SERVER_NOTIFICATIONS_LOADING_ERROR';
export const SERVER_NOTIFICATIONS_INVALIDATE = '/app/SERVER_NOTIFICATIONS_INVALIDATE';

export const NOTIFICATION_TIMEOUT = 500;

export const SERVER_NOTIFICATION_MAX_ROWS = 8;

export const EXPERIMENTAL_PRODUCT_ALL_FOLDER_LOOKUPS = 'queryProductAllFolderLookups';
export const EXPERIMENTAL_PRODUCT_FOLDER_DATA_LISTING_SCOPED = 'queryProductProjectDataListingScoped';
export const EXPERIMENTAL_REQUESTS_MENU = 'experimental-biologics-requests-menu';
export const EXPERIMENTAL_SAMPLE_ALIQUOT_SELECTOR = 'experimental-sample-aliquot-selector';

export const FOLDER_DATA_TYPE_EXCLUSIONS = 'dataTypeExclusions';

export const BASE_APP_HELP_LINK = 'https://www.labkey.org/SampleManagerHelp/wiki-page.view?name=';

// The enum values here should align with the ProductFeature.java enum values (some not currently used but included for completeness)
export enum ProductFeature {
    ApiKeys = 'ApiKeys',
    Assay = 'Assay',
    AssayQC = 'AssayQC',
    BiologicsRegistry = 'BiologicsRegistry',
    CalculatedFields = 'CalculatedFields',
    ChartBuilding = 'ChartBuilding',
    DataChangeCommentRequirement = 'DataChangeCommentRequirement',
    ELN = 'ELN',
    Folders = 'Folders',
    FreezerManagement = 'FreezerManagement',
    Media = 'Media',
    NonstandardAssay = 'NonstandardAssay',
    SampleManagement = 'SampleManagement',
    TransformScripts = 'TransformScripts',
    Workflow = 'Workflow',
}

export const BIOLOGICS_APP_PROPERTIES: AppProperties = {
    productId: BIOLOGICS_PRODUCT_ID,
    name: BIOLOGICS_PRODUCT_NAME,
    logoWithTextImageUrl: imageURL('biologics/images', 'lk-bio-logo-text.svg'),
    logoBadgeImageUrl: imageURL('biologics/images', 'lk-bio-logo-badge.svg'),
    logoBadgeColorImageUrl: imageURL('biologics/images', 'lk-bio-logo-badge-color-light.svg'),
    controllerName: BIOLOGICS_CONTROLLER_NAME,
    moduleName: 'biologics',
    searchPlaceholder: SEARCH_PLACEHOLDER,
    dataClassUrlPart: REGISTRY_KEY,
    releaseNoteLink: 'bioReleaseNotes',
    baseProductHelpLinkPrefix: BASE_APP_HELP_LINK,
};

export const LIMS_APP_PROPERTIES: AppProperties = {
    productId: LIMS_PRODUCT_ID,
    name: LIMS_PRODUCT_NAME,
    logoWithTextImageUrl: imageURL('lims/images', 'LK-LIMS-appmenu-WHITE.svg'),
    logoBadgeImageUrl: imageURL('lims/images', 'LK-LIMS-Badge-WHITE.svg'),
    logoBadgeColorImageUrl: imageURL('lims/images', 'LK-LIMS-Badge-COLOR-LIGHT.svg'),
    controllerName: LIMS_CONTROLLER_NAME,
    moduleName: 'sampleManagement',
    searchPlaceholder: SAMPLE_MANAGER_SEARCH_PLACEHOLDER,
    dataClassUrlPart: SOURCES_KEY,
    releaseNoteLink: 'releaseNotes',
};

export const SAMPLE_MANAGER_APP_PROPERTIES: AppProperties = {
    productId: SAMPLE_MANAGER_PRODUCT_ID,
    name: SAMPLE_MANAGER_PRODUCT_NAME,
    logoWithTextImageUrl: imageURL('sampleManagement/images', 'LK-SampleManager-appmenu-WHITE.svg'),
    logoBadgeImageUrl: imageURL('sampleManagement/images', 'LK-SampleManager-Badge-WHITE.svg'),
    logoBadgeColorImageUrl: imageURL('sampleManagement/images', 'LK-SampleManager-Badge-COLOR-LIGHT.svg'),
    controllerName: SAMPLE_MANAGER_CONTROLLER_NAME,
    moduleName: 'sampleManagement',
    searchPlaceholder: SAMPLE_MANAGER_SEARCH_PLACEHOLDER,
    dataClassUrlPart: SOURCES_KEY,
    releaseNoteLink: 'releaseNotes',
};

export const FREEZER_MANAGER_APP_PROPERTIES: AppProperties = {
    productId: FREEZER_MANAGER_PRODUCT_ID,
    name: FREEZER_MANAGER_PRODUCT_NAME,
    logoWithTextImageUrl: imageURL('_images', 'LK-noTAG-overcast.svg'),
    logoBadgeImageUrl: imageURL('_images', 'mobile-logo-overcast.svg'),
    logoBadgeColorImageUrl: imageURL('_images', 'mobile-logo-seattle.svg'),
    controllerName: FREEZER_MANAGER_CONTROLLER_NAME,
    moduleName: 'inventory',
    baseProductHelpLinkPrefix: BASE_APP_HELP_LINK,
};
