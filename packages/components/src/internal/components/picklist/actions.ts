import { Ajax, Domain, Filter, Query, Utils } from '@labkey/api';

import { List } from 'immutable';

import { insertRows, QueryCommandResponse, selectRowsDeprecated } from '../../query/api';
import { resolveKey, SchemaQuery } from '../../../public/SchemaQuery';
import { getSelected, getSelectedDataDeprecated, setSnapshotSelections } from '../../actions';
import { PICKLIST } from '../domainproperties/list/constants';
import { saveDomain } from '../domainproperties/actions';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { User } from '../base/models/User';
import { AppURL, buildURL, createProductUrlFromParts } from '../../url/AppURL';
import { fetchListDesign, getListIdFromDomainId } from '../domainproperties/list/actions';

import { PICKLIST_KEY } from '../../app/constants';

import { isProductFoldersEnabled } from '../../app/utils';

import { SCHEMAS } from '../../schemas';
import { caseInsensitive } from '../../util/utils';

import { getOrderedSelectedMappedKeys } from '../entities/actions';

import { Picklist, PICKLIST_KEY_COLUMN, PICKLIST_SAMPLE_ID_COLUMN } from './models';
import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from './constants';

export function getPicklistsForInsert(): Promise<Picklist[]> {
    return new Promise((resolve, reject) => {
        const { queryName, schemaName } = SCHEMAS.LIST_METADATA_TABLES.PICKLISTS;
        selectRowsDeprecated({
            containerFilter: isProductFoldersEnabled() ? Query.ContainerFilter.current : undefined,
            schemaName,
            queryName,
            sort: 'Name',
            filterArray: [Filter.create('Category', null, Filter.Types.NONBLANK)],
        })
            .then(response => {
                const { models, orderedModels } = response;
                const dataKey = resolveKey(schemaName, queryName);
                const data = models[dataKey];
                const picklists = [];
                orderedModels[dataKey]?.forEach(id => {
                    picklists.push(Picklist.create(data[id]));
                });
                resolve(picklists);
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function createPicklist(
    name: string,
    description: string,
    shared: boolean,
    selectionKey: string,
    useSnapshotSelection: boolean,
    sampleIds: string[]
): Promise<Picklist> {
    return new Promise((resolve, reject) => {
        Domain.create({
            domainDesign: {
                name,
                fields: [
                    {
                        name: PICKLIST_SAMPLE_ID_COLUMN,
                        rangeURI: 'int',
                        required: true,
                        lookupSchema: SCHEMAS.INVENTORY.SAMPLE_ITEMS.schemaName,
                        lookupQuery: SCHEMAS.INVENTORY.SAMPLE_ITEMS.queryName,
                    },
                ],
                indices: [
                    {
                        columnNames: [PICKLIST_SAMPLE_ID_COLUMN],
                        unique: true,
                    },
                ],
            },
            kind: PICKLIST,
            options: {
                keyName: PICKLIST_KEY_COLUMN,
                keyType: 'AutoIncrementInteger',
                description,
                category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
            },
            success: response => {
                Promise.all([
                    getListIdFromDomainId(response.domainId),
                    addSamplesToPicklist(name, useSnapshotSelection, selectionKey, sampleIds),
                ])
                    .then(responses => {
                        const [listId] = responses;
                        resolve(
                            new Picklist({
                                Container: response.container,
                                listId,
                                name,
                                Description: description,
                                Category: shared ? PUBLIC_PICKLIST_CATEGORY : PRIVATE_PICKLIST_CATEGORY,
                            })
                        );
                    })
                    .catch(error => {
                        reject(error);
                    });
            },
            failure: err => {
                reject(err);
            },
        });
    });
}

export function updatePicklist(picklist: Picklist): Promise<Picklist> {
    return new Promise((resolve, reject) => {
        fetchListDesign(picklist.listId, picklist.Container)
            .then(listDesign => {
                const domain = listDesign.domain;
                const options = {
                    domainId: domain.domainId,
                    name: picklist.name,
                    keyName: 'id',
                    keyType: 'AutoIncrementInteger',
                    description: picklist.Description,
                    category: picklist.Category,
                };
                saveDomain({ domain, kind: PICKLIST, name: picklist.name, options })
                    .then(() => {
                        resolve(picklist);
                    })
                    .catch(errorDomain => {
                        console.error(errorDomain.domainException);
                        reject(errorDomain.domainException);
                    });
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export interface SampleTypeCount {
    ItemCount: number;
    LabelColor: string;
    SampleType: string;
}

export function getPicklistCountsBySampleType(listName: string): Promise<SampleTypeCount[]> {
    return new Promise(async (resolve, reject) => {
        try {
            const { key, models, orderedModels } = await selectRowsDeprecated({
                schemaName: SCHEMAS.PICKLIST_TABLES.SCHEMA,
                queryName: listName,
                sql: [
                    'SELECT COUNT(*) as ItemCount,',
                    'SampleId.SampleSet.Name AS SampleType,',
                    'SampleId.LabelColor',
                    `FROM ${SCHEMAS.PICKLIST_TABLES.SCHEMA}."${listName}"`,
                    'WHERE SampleId.Name IS NOT NULL',
                    'GROUP BY SampleId.SampleSet.Name, SampleId.LabelColor',
                    'ORDER BY SampleId.SampleSet.Name',
                ].join('\n'),
            });

            const counts = orderedModels[key]
                .map(idx => models[key][idx])
                .map(row => ({
                    ItemCount: row.ItemCount.value,
                    LabelColor: row.LabelColor.value,
                    SampleType: row.SampleType.value,
                }))
                .toArray();

            resolve(counts);
        } catch (e) {
            console.error('Failed to get picklist counts by sample type', e);
            reject(e);
        }
    });
}

export function getPicklistSamples(listName: string): Promise<Set<string>> {
    return new Promise((resolve, reject) => {
        const schemaName = SCHEMAS.PICKLIST_TABLES.SCHEMA;
        selectRowsDeprecated({
            schemaName,
            queryName: listName,
        })
            .then(response => {
                const { models } = response;
                const dataKey = resolveKey(schemaName, listName);
                resolve(new Set(Object.values(models[dataKey]).map((row: any) => row.SampleID.value.toString())));
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function getOrderedSelectedPicklistSamples(queryModel: QueryModel, saveSnapshot?: boolean): Promise<number[]> {
    const { queryName, queryParameters, selections, sortString, viewName, selectionKey } = queryModel;
    return getSelectedPicklistSamples(
        queryName,
        Array.from(selections),
        saveSnapshot,
        selectionKey,
        sortString,
        queryParameters,
        viewName
    );
}

export function getSelectedPicklistSamples(
    picklistName: string,
    selectedIds: string[],
    saveSnapshot?: boolean,
    selectionKey?: string,
    sorts?: string,
    queryParameters?: Record<string, any>,
    viewName?: string
): Promise<number[]> {
    return new Promise((resolve, reject) => {
        getOrderedSelectedMappedKeys(
            PICKLIST_KEY_COLUMN,
            PICKLIST_SAMPLE_ID_COLUMN,
            SCHEMAS.PICKLIST_TABLES.SCHEMA,
            picklistName,
            selectedIds,
            sorts,
            queryParameters,
            viewName
        )
            .then(result => {
                const rowIds = result.mapFromValues;
                const sampleIds = result.mapToValues;
                if (saveSnapshot) {
                    setSnapshotSelections(selectionKey, rowIds);
                }
                resolve(sampleIds);
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export async function getSamplesNotInList(
    listName: string,
    selectionKey?: string,
    useSnapshotSelection?: boolean,
    sampleIds?: string[]
): Promise<string[]> {
    const existingSamples = await getPicklistSamples(listName);
    if (sampleIds) {
        return sampleIds.filter(id => !existingSamples.has(id.toString()));
    } else if (selectionKey) {
        const response = await getSelected(selectionKey, useSnapshotSelection);
        return response.selected.filter(id => !existingSamples.has(id.toString()));
    }
    return [];
}

export function addSamplesToPicklist(
    listName: string,
    useSnapshotSelection?: boolean,
    selectionKey?: string,
    sampleIds?: string[]
): Promise<QueryCommandResponse> {
    return new Promise((resolve, reject) => {
        return getSamplesNotInList(listName, selectionKey, useSnapshotSelection, sampleIds)
            .then(sampleIdsToAdd => {
                let rows = List<any>();
                sampleIdsToAdd.forEach(id => {
                    rows = rows.push({ SampleID: id });
                });
                if (rows.size > 0) {
                    insertRows({
                        schemaQuery: new SchemaQuery('lists', listName),
                        rows,
                    })
                        .then(response => {
                            resolve(response);
                        })
                        .catch(reason => reject(reason));
                } else {
                    resolve(
                        new QueryCommandResponse({
                            rows: [],
                            schemaQuery: new SchemaQuery('lists', listName),
                            error: undefined,
                            transactionAuditId: undefined,
                        })
                    );
                }
            })
            .catch(reason => {
                reject(reason);
            });
    });
}

export interface PicklistDeletionData {
    deletableLists: Picklist[];
    numDeletable: number;
    numNotDeletable: number;
    numShared: number;
}

export function getPicklistDeleteData(model: QueryModel, user: User): Promise<PicklistDeletionData> {
    return new Promise((resolve, reject) => {
        const columnString = 'Name,listId,category,createdBy';
        getSelectedDataDeprecated(
            model.schemaName,
            model.queryName,
            [...model.selections],
            columnString,
            undefined,
            undefined,
            undefined,
            'ListId'
        )
            .then(response => {
                const { data } = response;
                let numNotDeletable = 0;
                let numShared = 0;
                const deletableLists = [];
                data.valueSeq().forEach(row => {
                    const picklist = Picklist.create(row.toJS());

                    if (picklist.isDeletable(user)) {
                        if (picklist.isPublic()) {
                            numShared++;
                        }
                        deletableLists.push(picklist);
                    } else {
                        numNotDeletable++;
                    }
                });
                resolve({
                    numDeletable: deletableLists.length,
                    numNotDeletable,
                    numShared,
                    deletableLists,
                });
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function deletePicklists(picklists: Picklist[], selectionKey?: string): Promise<any> {
    return new Promise((resolve, reject) => {
        let params;
        if (picklists.length === 1) {
            params = {
                listId: picklists[0].listId,
            };
        } else if (selectionKey) {
            params = {
                dataRegionSelectionKey: selectionKey,
            };
        } else {
            const listIds = [];
            picklists.forEach(picklist => {
                listIds.push(picklist.listId);
            });
            params = {
                listIds,
            };
        }
        return Ajax.request({
            url: buildURL('list', 'deleteListDefinition.api'),
            method: 'POST',
            params,
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error(response);
                reject(response);
            }),
        });
    });
}

export function getPicklistUrl(listId: number, picklistProductId?: string, currentProductId?: string): string {
    let picklistUrl: string = AppURL.create(PICKLIST_KEY, listId).toHref();
    if (currentProductId && picklistProductId) {
        const url = createProductUrlFromParts(picklistProductId, currentProductId, {}, PICKLIST_KEY, listId);
        picklistUrl = url instanceof AppURL ? url.toHref() : url;
    }

    return picklistUrl;
}

export const getPicklistFromId = async (listId: number, loadSampleTypes = true): Promise<Picklist> => {
    const listData = await selectRowsDeprecated({
        containerFilter: getPicklistListingContainerFilter(),
        schemaName: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS.schemaName,
        queryName: SCHEMAS.LIST_METADATA_TABLES.PICKLISTS.queryName,
        requiredColumns: ['Category'],
        filterArray: [Filter.create('listId', listId)],
    });
    const listRow = listData.models[listData.key][listId];
    if (!listRow) return new Picklist(/* use empty picklist to signal not found */);
    let picklist = Picklist.create(listRow);

    if (loadSampleTypes) {
        const listSampleTypeData = await selectRowsDeprecated({
            schemaName: SCHEMAS.PICKLIST_TABLES.SCHEMA,
            sql: `SELECT DISTINCT SampleID.SampleSet, SampleID.SampleSet.Category FROM "${picklist.name}" WHERE SampleID.SampleSet IS NOT NULL`,
        });

        picklist = picklist.mutate({
            sampleTypes: Object.values(listSampleTypeData.models[listSampleTypeData.key])
                .map(row => caseInsensitive(row, 'SampleSet')?.displayValue)
                .filter(value => !!value),
        });
        picklist = picklist.mutate({
            hasMedia: !!Object.values(listSampleTypeData.models[listSampleTypeData.key]).find(
                row => caseInsensitive(row, 'Category')?.value === 'media'
            ),
        });
    }

    return picklist;
};

export function getPicklistListingContainerFilter(): Query.ContainerFilter {
    return isProductFoldersEnabled() ? Query.ContainerFilter.current : undefined;
}
