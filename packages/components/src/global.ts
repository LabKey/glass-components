/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { getGlobal, setGlobal } from 'reactn';
import { List, Map } from 'immutable';


import { initBrowserHistoryState } from './util/global';
import { DataViewInfo, EditorModel, LookupStore } from './models';
import { Lineage } from './components/lineage/models';
import { IUser } from './components/forms/model';
import { QueryColumn, QueryGridModel, SchemaQuery } from './components/base/models/model';
import { naturalSort, resolveSchemaQuery } from './util/utils';
import { GRID_CHECKBOX_OPTIONS } from './components/base/models/constants';

/**
 * Initialize the global state object for this package.
 * @param metadata Optional Map to set the query metadata for this application
 * @param columnRenderers Optional Map to set the column renderers for this application
 */
export function initQueryGridState(metadata?: Map<string, any>, columnRenderers?: Map<string, any>) {
    if (!getGlobal().QueryGrid_models) {
        resetQueryGridState()
    }

    initBrowserHistoryState();

    if (metadata) {
        setQueryMetadata(metadata);
    }
    if (columnRenderers) {
        setQueryColumnRenderers(columnRenderers);
    }
}

/**
 * Clear out all of the global state object for this package
 */
export function resetQueryGridState() {
    setGlobal({
        QueryGrid_charts: Map<string, List<DataViewInfo>>(),
        QueryGrid_editors: Map<string, EditorModel>(),
        QueryGrid_lineageResults: Map<string, Lineage>(),
        QueryGrid_lookups: Map<string, LookupStore>(),
        QueryGrid_metadata: Map<string, any>(),
        QueryGrid_models: Map<string, QueryGridModel>(),
        QueryGrid_columnrenderers: Map<string, any>(),
        QueryGrid_users: Map<string, List<IUser>>()
    });
}

function getGlobalState(property: string) {
    if (!getGlobal()['QueryGrid_' + property]) {
        throw new Error('Must call initQueryGridState before you can access anything from the global.QueryGrid_' + property + ' objects.');
    }

    return getGlobal()['QueryGrid_' + property];
}

/**
 * Get the latest QueryGridModel object from the global state for a given modelId.
 * @param modelId QueryGridModel id to fetch
 */
export function getQueryGridModel(modelId: string): QueryGridModel {
    return getGlobalState('models').get(modelId);
}

export function getQueryGridModelsForSchema(schemaName: string): List<QueryGridModel> {
    return getGlobalState('models').filter(model => model.schema.toLowerCase() === schemaName.toLowerCase()).toList();
}

export function getQueryGridModelsForSchemaQuery(schemaQuery: SchemaQuery): List<QueryGridModel> {
    const modelName = resolveSchemaQuery(schemaQuery);
    return getGlobalState('models').filter(model => model.getModelName() === modelName).toList();
}

export function getQueryGridModelsForGridId(gridIdPrefix: string): List<QueryGridModel> {
    const prefix = (gridIdPrefix + '|').toLowerCase();
    return getGlobalState('models').filter(model => model.getId().indexOf(prefix) === 0).toList();
}

/**
 * Helper function for all callers/actions that would like to update information for a QueryGridModel in the global state.
 * @param model QueryGridModel in the global state to be updated, or to be added to global state if it does not already exist by Id
 * @param updates JS Object with the key/value pairs for updates to make to the model
 * @param connectedComponent Optional React.Component which should be re-rendered with this QueryGridModel update (prevents the need to "connect" the component to the global state)
 * @param failIfNotFound Boolean indicating if an error should be thrown if the model is not found in global state
 */
export function updateQueryGridModel(model: QueryGridModel, updates: any, connectedComponent?: React.Component, failIfNotFound: boolean = true): QueryGridModel {
    if (failIfNotFound && !getGlobalState('models').has(model.getId())) {
        throw new Error('Unable to find QueryGridModel for modelId: ' + model.getId());
    }

    const updatedModel = model.merge(updates) as QueryGridModel;

    setGlobal({
        QueryGrid_models: getGlobalState('models').set(model.getId(), updatedModel)
    },

    (global) => {
        if (connectedComponent) {
            connectedComponent.forceUpdate();
        }
    });

    return updatedModel;
}

/**
 * Remove a QueryGridModel from the global state
 * @param model QueryGridModel to be removed
 * @param connectedComponent Optional React.Component which should be re-rendered with this QueryGridModel update (prevents the need to "connect" the component to the global state)
 */
export function removeQueryGridModel(model: QueryGridModel, connectedComponent?: React.Component) {
    setGlobal({
        QueryGrid_models: getGlobalState('models').delete(model.getId()),
        QueryGrid_editors: getGlobalState('editors').delete(model.getId())
    },

    (global) => {
        if (connectedComponent) {
            connectedComponent.forceUpdate();
        }
    });
}

/**
 * Get the query metadata object from the global QueryGrid state
 */
export function getQueryMetadata() {
    return getGlobalState('metadata');
}

/**
 * Sets the query metadata object to be used for this application in the global QueryGrid state
 * @param metadata Map of query metadata to be applied to the query infos and column infos
 */
export function setQueryMetadata(metadata: Map<string, any>) {
    setGlobal({
        QueryGrid_metadata: metadata
    });
}

/**
 * Get the query grid column renderers map from the global QueryGrid state
 */
export function getQueryColumnRenderers() {
    return getGlobalState('columnrenderers');
}

/**
 * Sets the valid column renderers for this application in the global QueryGrid state
 * @param renderers Map of query grid column renderers to be bound to the queryInfo columns
 */
export function setQueryColumnRenderers(columnrenderers: Map<string, any>) {
    setGlobal({
        QueryGrid_columnrenderers: columnrenderers
    });
}

/**
 * Get the list of DataViewInfos from the global state for a given schemaQuery key
 * @param schemaQueryKey Key for the charts map based on a schemaQuery
 */
export function getCharts(schemaQueryKey: string) : List<DataViewInfo> {
    return getGlobalState('charts').get(schemaQueryKey);
}

/**
 * Sets the global state list of chart DataViewInfos for a given schemaQuery key
 * @param schemaQueryKey Key for the charts map based on a schemaQuery
 * @param dataViewInfos List of DataViewInfo objects defining the charts for the given key
 */
export function updateCharts(schemaQueryKey: string, dataViewInfos: List<DataViewInfo>) {
    setGlobal({
        QueryGrid_charts: getGlobalState('charts').set(schemaQueryKey, dataViewInfos)
    });
}

/**
 * Get the lineage results from the global state for a given seed / lsid
 * @param seed Key for the lineage results map
 */
export function getLineageResult(seed: string) : Lineage {
    return getGlobalState('lineageResults').get(seed);
}

/**
 * Sets the global state lineage results for a given seed / lsid
 * @param seed Key for the lineage results map
 * @param lineage Lineage result object
 */
export function updateLineageResult(seed: string, lineage: Lineage) {
    setGlobal({
        QueryGrid_lineageResults: getGlobalState('lineageResults').set(seed, lineage)
    });
}

/**
 * Invalidate the global state lineage results
 */
export function invalidateLineageResults() {
    setGlobal({
        QueryGrid_lineageResults: Map<string, Lineage>()
    });
}

function getSelectedState(
    dataIds: List<string>,
    selected: List<string>,
    maxRows: number,
    totalRows: number
): GRID_CHECKBOX_OPTIONS {

    const selectedOnPage: number = dataIds.filter((id) => selected.indexOf(id) !== -1).size,
        totalSelected: number = selected.size;

    if (
        maxRows === selectedOnPage ||
        totalRows === totalSelected && totalRows !== 0 ||
        selectedOnPage === totalSelected && selectedOnPage === dataIds.size && selectedOnPage > 0
    ) {
        return GRID_CHECKBOX_OPTIONS.ALL;
    }
    else if (totalSelected > 0) {
        // if model has any selected show checkbox as indeterminate
        return GRID_CHECKBOX_OPTIONS.SOME;
    }

    return GRID_CHECKBOX_OPTIONS.NONE;
}

interface IGridSelectionResponse {
    selectedIds: List<any>
}

/**
 * Update model data with select changes
 * @param model
 * @param response
 */
export function updateSelections(model: QueryGridModel, response: IGridSelectionResponse)  {
    const selectedIds = response.selectedIds;
    const id = model.getId();
    const selectedLoaded = true;

    if (selectedIds !== undefined && selectedIds.size) {
        const { dataIds, maxRows, totalRows } = model;
        const selectedState = getSelectedState(dataIds, selectedIds, maxRows, totalRows);
        const updatedState = {
            selectedIds,
            selectedLoaded,
            selectedQuantity: selectedIds.size,
            selectedState
        } as any;

        setGlobal({
            QueryGrid_models: getGlobalState('models').set(model.getId(), model.merge(updatedState))
        });
    }
    else {
        setGlobal({
            QueryGrid_models: getGlobalState('models').set(id, model.merge({selectedLoaded, ...QueryGridModel.EMPTY_SELECTION}))
        });
    }
}

/**
 * Get the latest EditorModel object from the global state for a given modelId.
 * @param modelId QueryGridModel id to fetch
 */
export function getEditorModel(modelId: string): EditorModel {
    return getGlobalState('editors').get(modelId);
}

/**
 * Helper function for all callers/actions that would like to update information for an EditorModel in the global state.
 * @param model EditorModel in the global state to be updated, or to be added to global state if it does not already exist by Id
 * @param updates JS Object with the key/value pairs for updates to make to the model
 * @param failIfNotFound Boolean indicating if an error should be thrown if the model is not found in global state
 */
export function updateEditorModel(model: EditorModel, updates: any, failIfNotFound: boolean = true): EditorModel {
    if (failIfNotFound && !getGlobalState('editors').has(model.id)) {
        throw new Error('Unable to find EditorModel for modelId: ' + model.id);
    }

    const updatedModel = model.merge(updates) as EditorModel;

    setGlobal({
        QueryGrid_editors: getGlobalState('editors').set(model.id, updatedModel)
    });

    return updatedModel;
}

/**
 * Get the latest LookupStore object from the global state for a given QueryColumn.
 * @param col QueryColumn to fetch
 */
export function getLookupStore(col: QueryColumn): LookupStore {
    const key = LookupStore.key(col);
    return getGlobalState('lookups').get(key);
}

/**
 * Helper function for all callers/actions that would like to update information for a LookupStore in the global state.
 * @param store LookupStore in the global state to be updated, or to be added to global state if it does not already exist by col key
 * @param updates JS Object with the key/value pairs for updates to make to the store
 * @param failIfNotFound Boolean indicating if an error should be thrown if the store is not found in global state
 */
export function updateLookupStore(store: LookupStore, updates: any, failIfNotFound: boolean = true): LookupStore {
    if (failIfNotFound && !getGlobalState('lookups').has(store.key)) {
        throw new Error('Unable to find LookupStore for col: ' + store.key);
    }

    const updatedStore = store.merge(updates) as LookupStore;

    setGlobal({
        QueryGrid_lookups: getGlobalState('lookups').set(store.key, updatedStore)
    });

    return updatedStore;
}

function getPermissionsKey(permissions?: string | Array<string>) : string {
    let key = "allPermissions";
    if (permissions) {
        if (Array.isArray(permissions)) {
            key = permissions.sort(naturalSort).join(";")
        }
        else {
            key = permissions;
        }
    }
    return key;
}

/**
 * Get the users list from the global QueryGrid state
 */
export function getUsers(permissions?: string | Array<string>) : List<IUser> {
    return getGlobalState('users').get(getPermissionsKey(permissions));
}

/**
 * Sets the users list to be used for this application in the global QueryGrid state
 * @param users List of users
 */
export function setUsers(users: List<IUser>, permissions?: string | Array<string>) {
    setGlobal({
        QueryGrid_users: getGlobalState('users').set(getPermissionsKey(permissions), users)
    });
}

/**
 * Invalidate the global state users list
 */
export function invalidateUsers() {
    setGlobal( {
        QueryGrid_users: Map<string, List<IUser>>()
    });
}
