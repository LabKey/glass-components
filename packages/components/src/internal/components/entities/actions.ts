import { ActionURL, Ajax, Filter, Query, Utils } from '@labkey/api';
import { fromJS, List, Map } from 'immutable';

import {
    buildURL,
    caseInsensitive,
    getFilterForSampleOperation,
    getQueryGridModel,
    getSelected,
    importData,
    InsertOptions,
    isSamplesSchema,
    naturalSort,
    QueryInfo,
    SampleCreationType,
    SampleOperation,
    SchemaQuery,
    selectRowsDeprecated,
    SHARED_CONTAINER_PATH,
} from '../../..';

import { getSelectedItemSamples } from '../samples/actions';

import {
    DisplayObject,
    EntityDataType,
    EntityIdCreationModel,
    EntityParentType,
    EntityTypeOption,
    IEntityTypeOption,
    IParentOption,
    OperationConfirmationData,
} from './models';
import { DataClassDataType, SampleTypeDataType } from './constants';
import { isSampleEntity } from './utils';

export function getOperationConfirmationData(
    selectionKey: string,
    dataType: EntityDataType,
    rowIds?: string[] | number[],
    extraParams?: Record<string, any>
): Promise<OperationConfirmationData> {
    if (!selectionKey && !rowIds?.length) {
        return Promise.resolve(new OperationConfirmationData());
    }

    return new Promise((resolve, reject) => {
        let params;
        if (selectionKey) {
            params = {
                dataRegionSelectionKey: selectionKey,
            };
        } else {
            params = {
                rowIds,
            };
        }
        if (extraParams) {
            params = Object.assign(params, extraParams);
        }
        return Ajax.request({
            url: buildURL('experiment', dataType.operationConfirmationActionName),
            method: 'POST',
            jsonData: params,
            success: Utils.getCallbackWrapper(response => {
                if (response.success) {
                    resolve(new OperationConfirmationData(response.data));
                } else {
                    console.error('Response failure when getting operation confirmation data', response.exception);
                    reject(response.exception);
                }
            }),
            failure: Utils.getCallbackWrapper(response => {
                console.error('Error getting operation confirmation data', response);
                reject(response ? response.exception : 'Unknown error getting operation confirmation data.');
            }),
        });
    });
}

export function getDeleteConfirmationData(
    selectionKey: string,
    dataType: EntityDataType,
    rowIds?: string[] | number[]
): Promise<OperationConfirmationData> {
    if (isSampleEntity(dataType)) {
        return getSampleOperationConfirmationData(SampleOperation.Delete, selectionKey, rowIds);
    }
    return getOperationConfirmationData(selectionKey, dataType, rowIds);
}

export function getSampleOperationConfirmationData(
    operation: SampleOperation,
    selectionKey: string,
    rowIds?: string[] | number[]
): Promise<OperationConfirmationData> {
    return getOperationConfirmationData(selectionKey, SampleTypeDataType, rowIds, {
        sampleOperation: SampleOperation[operation],
    });
}

export function getDataDeleteConfirmationData(
    selectionKey: string,
    rowIds?: string[] | number[]
): Promise<OperationConfirmationData> {
    return getDeleteConfirmationData(selectionKey, DataClassDataType, rowIds);
}

function getSelectedParents(
    schemaQuery: SchemaQuery,
    filterArray: Filter.IFilter[],
    isAliquotParent?: boolean
): Promise<List<EntityParentType>> {
    return new Promise((resolve, reject) => {
        const isSampleParent = isSamplesSchema(schemaQuery);
        let columns = 'LSID,Name,RowId';
        if (isSampleParent) {
            columns += ',SampleSet';
        }
        return selectRowsDeprecated({
            schemaName: schemaQuery.schemaName,
            queryName: schemaQuery.queryName,
            columns,
            filterArray,
            containerFilter: Query.containerFilter.currentPlusProjectAndShared,
        })
            .then(response => {
                if (isSampleParent) {
                    resolve(resolveSampleParentTypes(response, isAliquotParent));
                } else {
                    resolve(resolveEntityParentTypeFromIds(schemaQuery, response, isAliquotParent));
                }
            })
            .catch(reason => {
                console.error("There was a problem getting the selected parents' data", reason);
                reject(reason);
            });
    });
}

function getSelectedSampleParentsFromItems(itemIds: any[], isAliquotParent?: boolean): Promise<List<EntityParentType>> {
    return new Promise((resolve, reject) => {
        return getSelectedItemSamples(itemIds)
            .then(sampleIds => {
                const filterArray = [Filter.create('RowId', sampleIds, Filter.Types.IN)];
                const opFilter = getFilterForSampleOperation(SampleOperation.EditLineage);
                if (opFilter) {
                    filterArray.push(opFilter);
                }
                return selectRowsDeprecated({
                    schemaName: 'exp',
                    queryName: 'materials',
                    columns: 'LSID,Name,RowId,SampleSet',
                    filterArray,
                    containerFilter: Query.containerFilter.currentPlusProjectAndShared,
                })
                    .then(response => {
                        resolve(resolveSampleParentTypes(response, isAliquotParent));
                    })
                    .catch(reason => {
                        console.error("There was a problem getting the selected parents' data", reason);
                        reject(reason);
                    });
            })
            .catch(reason => {
                console.error("There was a problem getting the selected parents' data", reason);
                reject(reason);
            });
    });
}

function resolveSampleParentTypes(response: any, isAliquotParent?: boolean): List<EntityParentType> {
    const { key, models, orderedModels } = response;
    const rows = fromJS(models[key]);

    const groups = {};

    // The transformation done here makes the entities compatible with the editable grid
    orderedModels[key].forEach(id => {
        const row = rows.get(id).toJS();
        const displayValue = caseInsensitive(row, 'Name')?.value;
        const sampleType = caseInsensitive(row, 'SampleSet')?.displayValue;
        const value = caseInsensitive(row, 'RowId')?.value;

        if (!groups[sampleType]) groups[sampleType] = [];

        groups[sampleType].push({
            displayValue,
            value,
        });
    });

    let results = [],
        index = 1;
    for (const [sampleType, data] of Object.entries(groups)) {
        results.push(
            EntityParentType.create({
                index,
                schema: 'samples',
                query: sampleType?.toLowerCase(),
                value: List<DisplayObject>(data),
                isAliquotParent,
            })
        );
        index++;
    }

    return List<EntityParentType>(results);
}

/**
 * We have either an initialParents array, and determine the schemaQuery from the first id in that list
 * or a selection key and determine the schema query from parsing the selection key.  In any case, this
 * assumes parents from a single data type.
 * @param initialParents
 * @param selectionKey
 * @param creationType
 * @param isItemSamples
 */
async function initParents(
    initialParents: string[],
    selectionKey: string,
    creationType?: SampleCreationType,
    isItemSamples?: boolean
): Promise<List<EntityParentType>> {
    const isAliquotParent = creationType === SampleCreationType.Aliquots;

    if (selectionKey) {
        const { schemaQuery } = SchemaQuery.parseSelectionKey(selectionKey);
        const queryGridModel = getQueryGridModel(selectionKey);

        if (queryGridModel?.selectedLoaded) {
            const filterArray = [Filter.create('RowId', queryGridModel.selectedIds.toArray(), Filter.Types.IN)];
            const opFilter = getFilterForSampleOperation(SampleOperation.EditLineage);
            if (opFilter) {
                filterArray.push(opFilter);
            }

            return getSelectedParents(schemaQuery, filterArray, isAliquotParent);
        } else {
            const selectionResponse = await getSelected(selectionKey);

            if (isItemSamples) {
                return getSelectedSampleParentsFromItems(selectionResponse.selected, isAliquotParent);
            }

            const filterArray = [Filter.create('RowId', selectionResponse.selected, Filter.Types.IN)];
            const opFilter = getFilterForSampleOperation(SampleOperation.EditLineage);
            if (opFilter) {
                filterArray.push(opFilter);
            }

            return getSelectedParents(schemaQuery, filterArray, isAliquotParent);
        }
    } else if (initialParents?.length > 0) {
        const [parent] = initialParents;
        const [schema, query, value] = parent.toLowerCase().split(':');

        // if the parent key doesn't have a value, we don't need to make the request to getSelectedParents
        if (value === undefined) {
            return List<EntityParentType>([
                EntityParentType.create({
                    index: 1,
                    schema,
                    query,
                    value: List<DisplayObject>(),
                    isParentTypeOnly: true, // tell the UI to keep the parent type but not add any default rows to the editable grid
                    isAliquotParent,
                }),
            ]);
        }

        const filterArray = [Filter.create('RowId', value)];
        const opFilter = getFilterForSampleOperation(SampleOperation.EditLineage);
        if (opFilter) {
            filterArray.push(opFilter);
        }

        return getSelectedParents(SchemaQuery.create(schema, query), filterArray, isAliquotParent);
    }

    return List<EntityParentType>();
}

function resolveEntityParentTypeFromIds(
    schemaQuery: SchemaQuery,
    response: any,
    isAliquotParent?: boolean
): List<EntityParentType> {
    const { key, models, orderedModels } = response;
    const rows = fromJS(models[key]);
    let data = List<DisplayObject>();

    // The transformation done here makes the entities compatible with the editable grid
    orderedModels[key].forEach(id => {
        const row = extractEntityTypeOptionFromRow(rows.get(id));
        data = data.push({
            displayValue: row.label,
            value: row.rowId,
        });
    });

    return List<EntityParentType>([
        EntityParentType.create({
            index: 1,
            schema: schemaQuery.getSchema(),
            query: schemaQuery.getQuery(),
            value: data,
            isAliquotParent,
        }),
    ]);
}

export function extractEntityTypeOptionFromRow(
    row: Map<string, any>,
    lowerCaseValue = true,
    entityDataType?: EntityDataType
): IEntityTypeOption {
    const rowObj = row.toJS();
    const name = caseInsensitive(rowObj, 'Name').value;
    return {
        label: name,
        lsid: caseInsensitive(rowObj, 'LSID').value,
        rowId: caseInsensitive(rowObj, 'RowId').value,
        value: lowerCaseValue ? name.toLowerCase() : name, // we match values on lower case because (at least) when parsed from an id they are lower case
        query: name,
        entityDataType,
        isFromSharedContainer: caseInsensitive(rowObj, 'Folder/Path')?.value === SHARED_CONTAINER_PATH,
    };
}

// exported for jest testing
export async function getChosenParentData(
    model: EntityIdCreationModel,
    parentEntityDataTypes: Map<string, EntityDataType>,
    allowParents: boolean,
    isItemSamples?: boolean
): Promise<Partial<EntityIdCreationModel>> {
    const entityParents = EntityIdCreationModel.getEmptyEntityParents(
        parentEntityDataTypes.reduce(
            (names, entityDataType) => names.push(entityDataType.typeListingSchemaQuery.queryName),
            List<string>()
        )
    );

    if (allowParents) {
        const parentSchemaNames = parentEntityDataTypes.keySeq();
        const { creationType, originalParents, selectionKey } = model;

        const chosenParents = await initParents(originalParents, selectionKey, creationType, isItemSamples);

        // if we have an initial parent, we want to start with a row in the grid (entityCount = 1) otherwise we start with none
        let totalParentValueCount = 0,
            isParentTypeOnly = false,
            parentEntityDataType;
        chosenParents.forEach(chosenParent => {
            if (chosenParent.value !== undefined && parentSchemaNames.contains(chosenParent.schema)) {
                totalParentValueCount += chosenParent.value.size;
                isParentTypeOnly = chosenParent.isParentTypeOnly;
                parentEntityDataType = parentEntityDataTypes.get(chosenParent.schema).typeListingSchemaQuery.queryName;
            }
        });

        const numPerParent = model.numPerParent ?? 1;
        const validEntityCount = totalParentValueCount
            ? creationType === SampleCreationType.PooledSamples
                ? numPerParent
                : totalParentValueCount * numPerParent
            : 0;

        if (validEntityCount >= 1 || isParentTypeOnly || creationType === SampleCreationType.Aliquots) {
            return {
                entityCount: validEntityCount,
                entityParents: entityParents.set(parentEntityDataType, chosenParents),
            };
        }
    }

    // if we did not find a valid parent, we clear out the parents and selection key from the model as they aren't relevant
    return {
        originalParents: undefined,
        selectionKey: undefined,
        entityParents,
        entityCount: 0,
    };
}

export function getAllEntityTypeOptions(entityDataTypes: EntityDataType[]) : Promise<{ [p: string]: IEntityTypeOption[] }> {
    let optionMap = {};
    return new Promise(async (resolve) => {
        for (const entityType of entityDataTypes) {
            try {
               const entityOptions = await getEntityTypeOptions(entityType);
               optionMap[entityType.typeListingSchemaQuery.queryName] = entityOptions.get(entityType.typeListingSchemaQuery.queryName).toArray();
            } catch {
                optionMap[entityType.typeListingSchemaQuery.queryName] = [];
            }
        }
        resolve(optionMap)
    });
}

// get back a map from the typeListQueryName (e.g., 'SampleSet') and the list of options for that query
// where the schema field for those options is the typeSchemaName (e.g., 'samples')
export function getEntityTypeOptions(
    entityDataType: EntityDataType,
    containerPath?: string
): Promise<Map<string, List<IEntityTypeOption>>> {
    const { typeListingSchemaQuery, filterArray, instanceSchemaName } = entityDataType;

    return new Promise((resolve, reject) => {
        selectRowsDeprecated({
            containerPath,
            schemaName: typeListingSchemaQuery.schemaName,
            queryName: typeListingSchemaQuery.queryName,
            columns: 'LSID,Name,RowId,Folder/Path',
            filterArray,
            containerFilter: entityDataType.containerFilter ?? Query.containerFilter.currentPlusProjectAndShared,
        })
            .then(result => {
                const rows = fromJS(result.models[result.key]);
                let optionMap = Map<string, List<IEntityTypeOption>>();
                optionMap = optionMap.set(
                    typeListingSchemaQuery.queryName,
                    rows
                        .map(row => {
                            return {
                                ...extractEntityTypeOptionFromRow(row, true, entityDataType),
                                schema: instanceSchemaName, // e.g. "samples" or "dataclasses"
                            };
                        })
                        .sortBy(r => r.label, naturalSort)
                        .toList()
                );
                resolve(optionMap);
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

/**
 * @param model
 * @param entityDataType main data type to resolve
 * @param parentSchemaQueries map of the possible parents to the entityDataType
 * @param targetQueryName the name of the listing schema query that represents the initial target for creation.
 * @param allowParents are parents of this entity type allowed or not
 * @param isItemSamples use the selectionKey from inventory.items table to query sample parents
 */
export function getEntityTypeData(
    model: EntityIdCreationModel,
    entityDataType: EntityDataType,
    parentSchemaQueries: Map<string, EntityDataType>,
    targetQueryName: string,
    allowParents: boolean,
    isItemSamples?: boolean
): Promise<Partial<EntityIdCreationModel>> {
    return new Promise((resolve, reject) => {
        const promises: Array<Promise<any>> = [
            getEntityTypeOptions(entityDataType),
            // get all the parent schemaQuery data
            getChosenParentData(model, parentSchemaQueries, allowParents, isItemSamples),
            ...parentSchemaQueries.map(edt => getEntityTypeOptions(edt)).toArray(),
        ];

        Promise.all(promises)
            .then(results => {
                const partial = { ...results[1] }; // incorporate the chosen parent data results including entityCount and entityParents
                let parentOptions = Map<string, List<IParentOption>>();
                if (results.length > 2) {
                    results.slice(2).forEach(typeOptionsMap => {
                        parentOptions = parentOptions.merge(typeOptionsMap);
                    });
                }
                // Set possible parents
                partial.parentOptions = parentOptions;

                // Set possible types
                partial.entityTypeOptions = results[0].first();

                // and populate the targetEntityType if one is provided
                if (model.initialEntityType && partial.entityTypeOptions) {
                    const initialTargetTypeName = model.initialEntityType;
                    const data = partial.entityTypeOptions.find(
                        row => initialTargetTypeName.toLowerCase() === row.value
                    );
                    if (data) {
                        partial.targetEntityType = new EntityTypeOption(data);
                    }
                }
                resolve({
                    isInit: true,
                    ...partial,
                });
            })
            .catch(reason => {
                console.error(reason);
                reject(reason);
            });
    });
}

export function deleteEntityType(deleteActionName: string, rowId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', deleteActionName + '.api'),
            method: 'POST',
            params: {
                singleObjectRowId: rowId,
                forceDelete: true,
            },
            success: Utils.getCallbackWrapper(response => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(response);
            }),
        });
    });
}

export function handleEntityFileImport(
    importAction: string,
    queryInfo: QueryInfo,
    file: File,
    isMerge: boolean,
    useAsync: boolean,
    importParameters?: Record<string, any>,
    importFileController?: string,
    saveToPipeline?: boolean
): Promise<any> {
    return new Promise((resolve, reject) => {
        const { schemaQuery } = queryInfo;

        return importData({
            schemaName: schemaQuery.getSchema(),
            queryName: schemaQuery.getQuery(),
            file,
            importUrl: ActionURL.buildURL(importFileController ?? 'experiment', importAction, null, {
                ...importParameters,
                schemaName: schemaQuery.getSchema(),
                'query.queryName': schemaQuery.getQuery(),
            }),
            importLookupByAlternateKey: true,
            useAsync,
            insertOption: InsertOptions[isMerge ? InsertOptions.MERGE : InsertOptions.IMPORT],
            saveToPipeline,
        })
            .then(response => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject({ msg: response.errors._form });
                }
            })
            .catch(error => {
                console.error(error);
                reject({ msg: error.exception });
            });
    });
}
