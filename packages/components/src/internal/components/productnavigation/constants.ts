import { List } from 'immutable';

import { getHelpLink, imageURL } from '../../..';

import { BIOLOGICS_PRODUCT_ID, FREEZER_MANAGER_PRODUCT_ID, SAMPLE_MANAGER_PRODUCT_ID } from '../../app/constants';
import { ActionURL } from '@labkey/api';

// map for product menuSections query so that we request the LKFM section with the LKSM product
export const PRODUCT_ID_SECTION_QUERY_MAP = {
    [SAMPLE_MANAGER_PRODUCT_ID.toLowerCase()]: List.of(SAMPLE_MANAGER_PRODUCT_ID, FREEZER_MANAGER_PRODUCT_ID),
};

// list of section keys to skip for the section rendering
export const SECTION_KEYS_TO_SKIP = ['user', 'biologicsWorkflow'];

// mapping from product ids to the image/icon src paths
export const PRODUCT_ID_IMG_SRC_MAP = {
    [SAMPLE_MANAGER_PRODUCT_ID.toLowerCase()]: {
        iconUrl: imageURL('sampleManagement/images', 'LK-SampleManager-Badge-COLOR.svg'),
        iconUrlAlt: imageURL('sampleManagement/images', 'LK-SampleManager-Badge-WHITE.svg'),
    },
    [BIOLOGICS_PRODUCT_ID.toLowerCase()]: {
        iconUrl: imageURL('biologics/images', 'lk-bio-logo-badge-color.svg'),
        iconUrlAlt: imageURL('biologics/images', 'lk-bio-logo-badge.svg'),
    },
};

export const LK_DOC_FOLDER_TABS = getHelpLink('tabs');
export const PRODUCT_SERVICES_URL = 'https://www.labkey.com/products-services/';
export const PRODUCT_SERVICES_URL_MAP = {
    [SAMPLE_MANAGER_PRODUCT_ID.toLowerCase()]: 'https://www.labkey.com/products-services/sample-management-software/',
    [BIOLOGICS_PRODUCT_ID.toLowerCase()]: 'https://www.labkey.com/products-services/labkey-biologics/',
};
export const ADMIN_LOOK_AND_FEEL_URL = ActionURL.buildURL("admin", "lookAndFeelSettings.view", "/");
