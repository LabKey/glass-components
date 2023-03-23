import { Map } from 'immutable';
import { Ajax, Query, Utils } from '@labkey/api';

import { DataViewInfoTypes, RELEVANT_SEARCH_RESULT_TYPES } from '../../constants';

import { getPrimaryAppProperties, getProjectPath, isAllProductFoldersFilteringEnabled } from '../../app/utils';

import { SAMPLE_MANAGER_APP_PROPERTIES } from '../../app/constants';

import { incrementClientSideMetricCount } from '../../actions';
import { buildURL } from '../../url/AppURL';
import { URLResolver } from '../../url/URLResolver';
import { resolveErrorMessage } from '../../util/messaging';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { loadReports } from '../../query/reports';
import { IDataViewInfo } from '../../DataViewInfo';
import { selectRows } from '../../query/selectRows';
import { caseInsensitive } from '../../util/utils';

import { getContainerFilter, getQueryDetails, invalidateQueryDetailsCache } from '../../query/api';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { EXP_TABLES, SCHEMAS } from '../../schemas';

import { getFinderViewColumnsConfig, getSampleFinderTabRowCountSql, SAMPLE_FINDER_VIEW_NAME } from './utils';
import { FinderReport, SearchIdData, SearchResultCardData } from './models';
import { SearchScope } from './constants';

type GetCardDataFn = (data: Map<any, any>, category?: string) => SearchResultCardData;

export interface SearchOptions {
    category?: string;
    experimentalCustomJson?: boolean;
    limit?: number;
    normalizeUrls?: boolean;
    q: any;
    scope?: SearchScope;
}

export function searchUsingIndex(
    options: SearchOptions,
    getCardDataFn?: GetCardDataFn,
    filterCategories?: string[]
): Promise<Record<string, any>> {
    const appProps = getPrimaryAppProperties();
    if (appProps?.productId) {
        incrementClientSideMetricCount(appProps.productId + 'Search', 'count');
    }

    let containerPath: string;
    if (isAllProductFoldersFilteringEnabled()) {
        containerPath = getProjectPath();
        options.scope = SearchScope.FolderAndSubfoldersAndShared;
    }

    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('search', 'json.api', undefined, {
                container: containerPath,
            }),
            params: options,
            success: Utils.getCallbackWrapper(json => {
                addDataObjects(json);
                const results = new URLResolver().resolveSearchUsingIndex(json);
                const hits = getProcessedSearchHits(results['hits'], getCardDataFn, filterCategories);
                resolve({ ...results, hits });
            }),
            failure: Utils.getCallbackWrapper(json => reject(json), null, false),
        });
    });
}

// Some search results will not have a data object.  Much of the display logic
// relies on this, so for such results that we want to show the user, we add a
// data element
function addDataObjects(jsonResults) {
    jsonResults.hits.forEach(hit => {
        if (hit.data === undefined || !hit.data.id) {
            const data = parseSearchIdToData(hit.id);
            if (data.type && RELEVANT_SEARCH_RESULT_TYPES.indexOf(data.type) >= 0) {
                if (!hit.data) hit.data = data;
                else hit.data = { ...data, ...hit.data };
            }
        }
    });
}

// Create a data object from the search id, which is assumed to be of the form:
//      [group:][type:]rowId
function parseSearchIdToData(idString): SearchIdData {
    const idData = new SearchIdData();
    if (idString) {
        const idParts = idString.split(':');

        idData.id = idParts[idParts.length - 1];
        if (idParts.length > 1) idData.type = idParts[idParts.length - 2];
        if (idParts.length > 2) idData.group = idParts[idParts.length - 3];
    }
    return idData;
}

// exported for jest testing
export function resolveTypeName(data: any, category: string) {
    let typeName;
    if (data) {
        if (data.dataClass?.name) {
            typeName = data.dataClass.name;
        } else if (data.sampleSet?.name) {
            typeName = data.sampleSet.name;
        }
    }
    if (!typeName && category) {
        if (category === 'notebook') {
            typeName = 'Notebook';
        } else if (category === 'notebookTemplate') {
            typeName = 'Notebook Template';
        }
    }
    return typeName;
}

// exported for jest testing
export function resolveIconSrc(data: any, category: string): string {
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
        } else if (data.type) {
            const lcType = data.type.toLowerCase();
            if (lcType === 'sampleset') {
                iconSrc = 'sample_set';
            } else if (lcType.indexOf('dataclass') !== 0) {
                iconSrc = lcType;
            }
            // else fallback to default
        }
    }
    if (!iconSrc && category) {
        if (category === 'material') {
            iconSrc = 'samples';
        }
        if (category === 'workflowJob') {
            iconSrc = 'workflow';
        }
        if (category === 'notebook' || category === 'notebookTemplate') {
            iconSrc = 'notebook_blue';
        }
    }
    return iconSrc;
}

// exported for jest testing
export function resolveIconDir(category: string): string {
    let iconDir;
    if (category) {
        if (category === 'notebook' || category === 'notebookTemplate') {
            iconDir = 'labbook/images';
        }
    }
    return iconDir;
}

export function getSearchResultCardData(data: any, category: string, title: string): SearchResultCardData {
    return {
        title,
        iconDir: resolveIconDir(category),
        iconSrc: resolveIconSrc(data, category),
        typeName: resolveTypeName(data, category),
    };
}

function getCardData(
    category: string,
    data: any,
    title: string,
    getCardDataFn?: (data: Map<any, any>, category?: string) => SearchResultCardData
): SearchResultCardData {
    let cardData = getSearchResultCardData(data, category, title);
    if (getCardDataFn) {
        cardData = { ...cardData, ...getCardDataFn(data, category) };
    }
    return cardData;
}

// TODO: add categories for other search results so the result['data'] check could be removed.
export function getProcessedSearchHits(
    hits: any[],
    getCardDataFn?: (data: Map<any, any>, category?: string) => SearchResultCardData,
    filterCategories = ['data', 'material', 'workflowJob', 'file workflowJob', 'notebook', 'notebookTemplate']
): any[] {
    return hits
        ?.filter(result => {
            return filterCategories?.indexOf(result.category) > -1 || result.data;
        })
        .map(result => ({
            ...result,
            cardData: getCardData(result.category, result.data, result.title, getCardDataFn),
        }));
}

export function saveFinderGridView(
    schemaQuery: SchemaQuery,
    columnDisplayNames: { [key: string]: string },
    requiredColumns?: string[]
): Promise<SchemaQuery> {
    return new Promise((resolve, reject) => {
        getQueryDetails({
            queryName: schemaQuery.queryName,
            schemaName: schemaQuery.schemaName,
        })
            .then(queryInfo => {
                const { columns, hasUpdates } = getFinderViewColumnsConfig(
                    queryInfo,
                    columnDisplayNames,
                    requiredColumns
                );
                if (!hasUpdates) {
                    resolve(schemaQuery);
                    return;
                }
                Query.saveQueryViews({
                    schemaName: schemaQuery.schemaName,
                    queryName: schemaQuery.queryName,
                    // Mark the view as hidden, so it doesn't show up in LKS and in the grid view menus
                    views: [{ name: SAMPLE_FINDER_VIEW_NAME, columns, hidden: true }],
                    success: () => {
                        invalidateQueryDetailsCache(schemaQuery);
                        resolve(schemaQuery);
                    },
                    failure: response => {
                        console.error(response);
                        reject(
                            'There was a problem creating the view for the data grid. ' + resolveErrorMessage(response)
                        );
                    },
                });
            })
            .catch(error => {
                console.error(error);
                reject('There was a problem creating the view for the data grid. ' + resolveErrorMessage(error));
            });
    });
}

export function saveFinderSearch(report: FinderReport, cardsJson: string, replace?: boolean): Promise<FinderReport> {
    const reportConfig = {
        name: report.reportName,
        reportId: replace ? report.reportId : null,
        config: cardsJson,
        public: false,
        replace,
    };

    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'saveSampleFinderSearch.api'),
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            jsonData: reportConfig,
            success: Utils.getCallbackWrapper(json => {
                resolve({
                    reportName: json['reportName'],
                    reportId: json['reportId'],
                    entityId: json['id'],
                });
            }),
            failure: Utils.getCallbackWrapper(json => reject(json), null, false),
        });
    });
}

export function loadFinderSearches(): Promise<FinderReport[]> {
    return new Promise((resolve, reject) => {
        loadReports()
            .then((reports: IDataViewInfo[]) => {
                const views = reports
                    .filter(report => report.type === DataViewInfoTypes.SampleFinderSavedSearch)
                    .map(report => {
                        return {
                            reportId: report.reportId,
                            reportName: report.name,
                            entityId: report.id,
                            isSession: false,
                        };
                    });
                resolve(views.sort((a, b) => a.reportName.localeCompare(b.reportName)));
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export function loadFinderSearch(view: FinderReport): Promise<any> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL(SAMPLE_MANAGER_APP_PROPERTIES.controllerName, 'getSampleFinderSearch.api'),
            method: 'GET',
            params: { reportId: view.reportId, name: view.reportName },
            success: Utils.getCallbackWrapper(json => {
                resolve(json['config']);
            }),
            failure: Utils.getCallbackWrapper(json => reject(json), null, false),
        });
    });
}

export function getSampleTypesFromFindByIdQuery(
    schemaQuery: SchemaQuery
): Promise<{ [key: string]: Array<Record<string, any>> }> {
    return new Promise((resolve, reject) => {
        selectRows({
            schemaQuery,
        })
            .then(response => {
                const sampleTypesRows = {};
                if (response.rows) {
                    response.rows.forEach(row => {
                        const sampleType = caseInsensitive(row, 'SampleSet')?.displayValue;
                        if (!sampleTypesRows[sampleType]) sampleTypesRows[sampleType] = [];
                        sampleTypesRows[sampleType].push(row);
                    });
                    resolve(sampleTypesRows);
                }
            })
            .catch(reason => {
                console.error(reason);
                reject(resolveErrorMessage(reason));
            });
    });
}

export function getSampleFinderTabRowCounts(queryModels: {
    [key: string]: QueryModel;
}): Promise<{ [key: string]: number }> {
    const modelIds = Object.keys(queryModels);
    const sampleTypeGridIds = {};
    let allSamplesModel = null;
    const tabCounts = {};
    modelIds.forEach(modelId => {
        const model = queryModels[modelId];
        if (model.schemaQuery.schemaName === SCHEMAS.SAMPLE_SETS.SCHEMA) {
            sampleTypeGridIds[model.schemaQuery.queryName.toLowerCase()] = modelId;
        } else if (model.schemaQuery.schemaName === EXP_TABLES.MATERIALS.schemaName) {
            allSamplesModel = model;
        }
        tabCounts[modelId] = 0;
    });

    return new Promise((resolve, reject) => {
        Query.executeSql({
            containerFilter: getContainerFilter(),
            schemaName: SCHEMAS.EXP_TABLES.SCHEMA,
            sql: getSampleFinderTabRowCountSql(allSamplesModel),
            success: result => {
                const typeCounts = {};
                result.rows?.forEach(row => {
                    const type = caseInsensitive(row, 'SampleTypeName');
                    typeCounts[type] = caseInsensitive(row, 'RowCount');
                });

                let totalCount = 0;
                Object.keys(typeCounts).forEach(type => {
                    const count = typeCounts[type];
                    totalCount += count;
                    const sampleGridId = sampleTypeGridIds[type.toLowerCase()];
                    tabCounts[sampleGridId] = count;
                });
                tabCounts[allSamplesModel.id] = totalCount;
                resolve(tabCounts);
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}
