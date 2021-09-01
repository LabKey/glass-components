import { List } from 'immutable';

import { ActionURL } from '@labkey/api';

import { getHelpLink, imageURL } from '../../..';

import {
    BIOLOGICS_APP_PROPERTIES,
    FREEZER_MANAGER_APP_PROPERTIES,
    SAMPLE_MANAGER_APP_PROPERTIES,
} from '../../app/constants';
import { HELP_LINK_REFERRER } from '../../util/helpLinks';
import { isFreezerManagementEnabled } from '../../app/utils';

// map for product menuSections query so that we request the LKFM section with the LKSM product
export const PRODUCT_ID_SECTION_QUERY_MAP = {
    [SAMPLE_MANAGER_APP_PROPERTIES.productId.toLowerCase()]: List.of(SAMPLE_MANAGER_APP_PROPERTIES.productId, FREEZER_MANAGER_APP_PROPERTIES.productId),
    [BIOLOGICS_APP_PROPERTIES.productId.toLowerCase()]: isFreezerManagementEnabled() ? List.of(BIOLOGICS_APP_PROPERTIES.productId, FREEZER_MANAGER_APP_PROPERTIES.productId) : List.of(BIOLOGICS_APP_PROPERTIES.productId),
};

// list of section keys to skip for the section rendering
export const SECTION_KEYS_TO_SKIP = ['user', 'biologicsWorkflow'];

export const SAMPLE_MANAGER_PRODUCT_ICON = 'LK-SampleManager-Badge-COLOR.svg';
export const SAMPLE_MANAGER_ALT_PRODUCT_ICON = 'LK-SampleManager-Badge-WHITE.svg';
export const SAMPLE_MANAGER_DISABLED_PRODUCT_ICON = 'LK-SampleManager-Badge-GRAY.svg';

export const BIOLOGICS_PRODUCT_ICON = 'lk-bio-logo-badge-color.svg';
export const BIOLOGICS_ALT_PRODUCT_ICON = 'lk-bio-logo-badge.svg';
export const BIOLOGICS_DISABLED_PRODUCT_ICON = 'lk-bio-logo-badge-gray.svg';

// mapping from product ids to the image/icon src paths
export const PRODUCT_ID_IMG_SRC_MAP = {
    [SAMPLE_MANAGER_APP_PROPERTIES.productId.toLowerCase()]: {
        iconUrl: imageURL('sampleManagement/images', SAMPLE_MANAGER_PRODUCT_ICON),
        iconUrlAlt: imageURL('sampleManagement/images', SAMPLE_MANAGER_ALT_PRODUCT_ICON),

        iconUrlDisabled: imageURL('sampleManagement/images', SAMPLE_MANAGER_DISABLED_PRODUCT_ICON),
    },
    [BIOLOGICS_APP_PROPERTIES.productId.toLowerCase()]: {
        iconUrl: imageURL('biologics/images', BIOLOGICS_PRODUCT_ICON),
        iconUrlAlt: imageURL('biologics/images', BIOLOGICS_ALT_PRODUCT_ICON),
        iconUrlDisabled: imageURL('biologics/images', BIOLOGICS_DISABLED_PRODUCT_ICON),
    },
};

export const LK_DOC_FOLDER_TABS = getHelpLink('tabs', HELP_LINK_REFERRER.PRODUCT_MENU);
export const PRODUCT_SERVICES_URL = 'https://www.labkey.com/products-services/';
export const ADMIN_LOOK_AND_FEEL_URL = ActionURL.buildURL('admin', 'lookAndFeelSettings.view', '/');

export const APPLICATION_NAVIGATION_METRIC = 'applicationNavigation';
export const TO_LKS_HOME_METRIC = 'toHomeProject';
export const TO_LKS_CONTAINER_METRIC = 'toServerContainer';
export const TO_LKS_TAB_METRIC = 'toServerContainerTab';
export const APPLICATION_SECTION_METRIC = 'toApplicationSection';
export const BIOLOGICS_SECTION_METRIC = 'toBiologicsSection';
export const SAMPLE_MANAGER_SECTION_METRIC = 'toSampleManagerSection';
