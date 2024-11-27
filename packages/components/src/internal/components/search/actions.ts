import { ActionURL, Ajax, Utils } from '@labkey/api';

import { RELEVANT_SEARCH_RESULT_TYPES } from '../../constants';

import { getPrimaryAppProperties, getProjectPath, isAllProductFoldersFilteringEnabled } from '../../app/utils';

import { incrementClientSideMetricCount } from '../../actions';
import { URLResolver } from '../../url/URLResolver';
import { handleRequestFailure } from '../../util/utils';

import { getContainerFilter } from '../../query/api';

import { ModuleContext } from '../base/ServerContext';

import { getSearchScopeFromContainerFilter, escapeSearchQuery } from './utils';
import { GetCardDataFn, SearchIdData, SearchResultCardData } from './models';
import { SearchCategory, SearchField, SearchScope } from './constants';

export interface SearchHit {
    category?: SearchCategory;
    container: string;
    data?: any;
    id: string;
    identifiers?: string;
    jsonData?: Record<string, any>;
    score?: number;
    summary?: string;
    title: string;
    url?: string;
}

export interface SearchMetadata {
    idProperty: string;
    root: string;
    successProperty: string;
}

export interface SearchResult {
    hits: SearchHit[];
    metaData: SearchMetadata;
    q: string;
    success: boolean;
    totalHits: number;
}

export interface SearchOptions {
    category?: SearchCategory | SearchCategory[];
    containerPath?: string;
    escapeQuery?: boolean;
    escapeQuotes?: boolean;
    experimentalCustomJson?: boolean;
    fields?: SearchField[];
    limit?: number;
    normalizeUrls?: boolean;
    offset?: number;
    q: string;
    requestHandler?: (request: XMLHttpRequest) => void;
    scope?: SearchScope;
}

export type Search = (
    options: SearchOptions,
    moduleContext?: ModuleContext,
    applyURLResolver?: boolean,
    request?: (config: Ajax.RequestOptions) => XMLHttpRequest
) => Promise<SearchResult>;

export const search: Search = (options, moduleContext, applyURLResolver = true, request = Ajax.request) => {
    // eslint-disable-next-line prefer-const
    let { containerPath, escapeQuery = false, escapeQuotes, requestHandler, ...params } = options;

    let containerPath_: string;
    if (isAllProductFoldersFilteringEnabled(moduleContext)) {
        containerPath_ = getProjectPath();
        params.scope = SearchScope.FolderAndSubfoldersAndShared;
    } else if (containerPath) {
        containerPath_ = containerPath;
    }

    // Return extra info about entity types and material results
    if (params.experimentalCustomJson === undefined) {
        params.experimentalCustomJson = true;
    }

    // Remove the containerID from the returned URL
    if (params.normalizeUrls === undefined) {
        params.normalizeUrls = true;
    }

    if (!params.scope) {
        params.scope = getSearchScopeFromContainerFilter(getContainerFilter(containerPath_));
    }

    if (escapeQuery) {
        params.q = escapeSearchQuery(params.q, escapeQuotes);
    }

    if (Array.isArray(params.category)) {
        (params as any).category = params.category.join('+');
    }

    return new Promise((resolve, reject) => {
        const request_ = request({
            url: ActionURL.buildURL('search', 'json.api', containerPath_),
            method: 'POST',
            params,
            success: Utils.getCallbackWrapper(json => {
                if (applyURLResolver) {
                    resolve(new URLResolver().resolveSearchUsingIndex(json));
                } else {
                    resolve(json);
                }
            }),
            failure: handleRequestFailure(reject, 'Failed search query'),
        });
        requestHandler?.(request_);
    });
};

export interface SearchHitWithCardData extends SearchHit {
    cardData: SearchResultCardData;
}

export interface SearchResultWithCardData extends Omit<SearchResult, 'hits'> {
    hits: SearchHitWithCardData[];
}

/** @deprecated Use search() instead */
export async function searchUsingIndex(
    options: SearchOptions,
    getCardDataFn?: GetCardDataFn
): Promise<SearchResultWithCardData> {
    const appProps = getPrimaryAppProperties();
    if (appProps?.productId) {
        incrementClientSideMetricCount(appProps.productId + 'Search', 'count');
    }

    // Don't apply the URL Resolver until the data objects have been resolved
    let result = await search(options, undefined, false);
    addDataObjects(result);
    result = new URLResolver().resolveSearchUsingIndex(result);

    return { ...result, hits: getProcessedSearchHits(result.hits, getCardDataFn) };
}

// Some search results will not have a data object.  Much of the display logic
// relies on this, so for such results that we want to show the user, we add a
// data element
function addDataObjects(result: SearchResult): void {
    result.hits.forEach(hit => {
        if (hit.data === undefined || !hit.data.id) {
            const data = parseSearchHitToData(hit);
            if (data.type && RELEVANT_SEARCH_RESULT_TYPES.indexOf(data.type) >= 0) {
                if (!hit.data) hit.data = data;
                else hit.data = { ...data, ...hit.data };
            }
        }
    });
}

// Create a data object from the search id, which is assumed to be of the form:
//      [group:][type:]rowId
function parseSearchHitToData(hit: SearchHit): SearchIdData {
    const idData = new SearchIdData();
    if (hit.id) {
        const idParts = hit.id.split(':');

        idData.id = idParts[idParts.length - 1];
        if (idParts.length > 1) idData.type = idParts[idParts.length - 2];
        if (idParts.length > 2) idData.group = idParts[idParts.length - 3];
    }
    return idData;
}

// exported for jest testing
export function resolveTypeName(data: any, category: SearchCategory): string {
    let typeName;
    if (data) {
        if (data.dataClass?.name) {
            typeName = data.dataClass.name;
        } else if (data.sampleSet?.name) {
            typeName = data.sampleSet.name;
        } else if (data.inventorySystemId) {
            typeName = data.typeName;
        }
    }
    if (!typeName && category) {
        if (category === SearchCategory.Notebook) {
            typeName = 'Notebook';
        } else if (category === SearchCategory.NotebookTemplate) {
            typeName = 'Notebook Template';
        } else if (category === SearchCategory.TerminalStorageLocation) {
            typeName = 'Terminal Storage Unit';
        } else if (category === SearchCategory.StorageLocation) {
            typeName = 'Storage Unit';
        }
    }
    return typeName;
}

// exported for jest testing
export function resolveIconSrc(data: any, category: SearchCategory): string {
    let iconSrc: string;
    if (data) {
        if (data.dataClass?.name) {
            // Issue 44917: Resolve search icon for uncategorized data classes
            if (data.dataClass.category) {
                iconSrc = data.dataClass.name.toLowerCase();
            }
            // else fallback to default
        } else if (data.sampleSet?.name) {
            iconSrc = 'samples';
        } else if (data.type && category !== SearchCategory.PlateSet) {
            const lcType = data.type.toLowerCase();
            if (lcType === 'sampleset') {
                iconSrc = 'sample_set';
            } else if (lcType.indexOf('dataclass') !== 0) {
                iconSrc = lcType;
            } else if (lcType === 'storagelocation') {
                iconSrc = 'freezer';
            } else if (lcType === 'terminalstoragelocation') {
                iconSrc = 'terminal_unit';
            }
            // else fallback to default
        }
    }
    if (!iconSrc && category) {
        switch (category) {
            case SearchCategory.Material:
                iconSrc = 'samples';
                break;
            case SearchCategory.Notebook:
            case SearchCategory.NotebookTemplate:
                iconSrc = 'notebook_blue';
                break;
            case SearchCategory.PlateSet:
            case SearchCategory.Plate:
                iconSrc = 'plates';
                break;
            case SearchCategory.WorkflowJob:
                iconSrc = 'workflow';
                break;
            case SearchCategory.StorageLocation:
                iconSrc = 'freezer';
                break;
            case SearchCategory.TerminalStorageLocation:
                iconSrc = 'terminal_unit';
                break;
            default:
        }
    }
    return iconSrc;
}

// exported for jest testing
export function resolveIconDir(category: SearchCategory): string {
    let iconDir;
    if (category === SearchCategory.Notebook || category === SearchCategory.NotebookTemplate) {
        iconDir = 'labbook/images';
    }
    return iconDir;
}

export function getSearchResultCardData(data: any, category: SearchCategory, title: string): SearchResultCardData {
    return {
        iconDir: resolveIconDir(category),
        iconSrc: resolveIconSrc(data, category),
        title,
        typeName: resolveTypeName(data, category),
    };
}

function getCardData(
    category: SearchCategory,
    data: any,
    title: string,
    getCardDataFn?: GetCardDataFn
): SearchResultCardData {
    const cardData = getSearchResultCardData(data, category, title);
    if (getCardDataFn) {
        return { ...cardData, ...getCardDataFn(data, category) };
    }
    return cardData;
}

export function getProcessedSearchHits(hits: SearchHit[], getCardDataFn?: GetCardDataFn): SearchHitWithCardData[] {
    if (!hits) return [];

    return hits.map(hit => ({
        ...hit,
        cardData: getCardData(hit.category, hit.data, hit.title, getCardDataFn),
    }));
}
