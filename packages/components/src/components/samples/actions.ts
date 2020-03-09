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
import {ActionURL, Ajax, Domain, Filter, Query, Utils} from '@labkey/api';
import { fromJS, List, Map, OrderedMap } from 'immutable';

import { IEntityTypeDetails, IParentOption, } from '../entities/models';
import { getSelection } from '../../actions';
import { SCHEMAS } from '../base/models/schemas';
import { QueryColumn, SchemaQuery } from '../base/models/model';
import { buildURL } from '../../url/ActionURL';
import { naturalSort } from '../../util/utils';
import { selectRows } from '../../query/api';
import {DomainDetails} from "../domainproperties/models";

export function initSampleSetSelects(isUpdate: boolean, ssName: string, includeDataClasses: boolean): Promise<any[]> {
    let promises = [];

    //Get Sample Types
    promises.push(
            selectRows({
            schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
            queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
            columns: 'LSID, Name, RowId, Folder',
            containerFilter: Query.containerFilter.currentPlusProjectAndShared,
        })
    );

    //Get Data Classes
    if (includeDataClasses) {
        promises.push(
            selectRows({
                schemaName: SCHEMAS.EXP_TABLES.DATA_CLASSES.schemaName,
                queryName: SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName,
                columns: 'LSID, Name, RowId, Folder',
                containerFilter: Query.containerFilter.currentPlusProjectAndShared,
            })
        );
    }

    return new Promise<any[]>((resolve, reject) => {
        return Promise.all(promises).then((responses) => {
            resolve(responses);
        }).catch((errorResponse) => {
            reject(errorResponse);
        });
    });



    // selectRows({
    //     schemaName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.schemaName,
    //     queryName: SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName,
    //     columns: 'LSID, Name, RowId'
    // }).then(results => {
    //
    // });
}

export function getSampleSet(config: IEntityTypeDetails): Promise<any> {
    return new Promise<any>((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'getSampleSetApi.api'),
            method: 'GET',
            params: config,
            success: Utils.getCallbackWrapper((response) => {
                resolve(Map(response));
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            }),
        });
    });
}

export function getSampleTypeDetails(query: SchemaQuery, domainId?: number): Promise<any> {
    return new Promise<DomainDetails>((resolve, reject) => {
        const sampleSetConfig = {
            domainId,
            containerPath: ActionURL.getContainer(),
            queryName: query.getQuery(),
            schemaName: query.getSchema(),
            success: (response) => {
                resolve(DomainDetails.create(Map(response)));
            },
            failure:(response) => {
                reject(response);
            }
        } as Domain.GetDomainOptions;

        return Domain.getDomainDetails(sampleSetConfig);
    });
}

export function deleteSampleSet(rowId: number): Promise<any> {
    return new Promise((resolve, reject) => {
        return Ajax.request({
            url: buildURL('experiment', 'deleteMaterialSource.api'),
            method: 'POST',
            params: {
                singleObjectRowId: rowId,
                forceDelete: true
            },
            success: Utils.getCallbackWrapper((response) => {
                resolve(response);
            }),
            failure: Utils.getCallbackWrapper((response) => {
                reject(response);
            }),
        });
    });
}

/**
 * Fetches an OrderedMap of Sample Set rows specified by a schemaQuery and collection of filters. This data
 * is mapped via the sampleColumn to make it compatible with editable grid data.
 * @param schemaQuery SchemaQuery which sources the request for rows
 * @param sampleColumn A QueryColumn used to map fieldKey, displayColumn, and keyColumn data
 * @param filterArray A collection of filters used when requesting rows
 */
export function fetchSamples(schemaQuery: SchemaQuery, sampleColumn: QueryColumn, filterArray: Array<Filter.IFilter>): Promise<OrderedMap<any, any>> {
    return selectRows({
        schemaName: schemaQuery.schemaName,
        queryName: schemaQuery.queryName,
        filterArray,
    }).then(response => {
        const { key, models, orderedModels } = response;
        const rows = fromJS(models[key]);
        let data = OrderedMap<any, any>();

        orderedModels[key].forEach((id) => {
            data = data.setIn([id, sampleColumn.fieldKey], List([{
                displayValue: rows.getIn([id, sampleColumn.lookup.displayColumn, 'value']),
                value: rows.getIn([id, sampleColumn.lookup.keyColumn, 'value']),
            }]));
        });

        return data;
    });
}

/**
 * Loads a collection of RowIds from a selectionKey found on "location". Uses [[fetchSamples]] to query and filter
 * the Sample Set data.
 * @param location The location to search for the selectionKey on
 * @param sampleColumn A QueryColumn used to map data in [[fetchSamples]]
 */
export function loadSelectedSamples(location: any, sampleColumn: QueryColumn): Promise<OrderedMap<any, any>> {
    return getSelection(location).then((selection) => {
        if (selection.resolved && selection.schemaQuery && selection.selected.length) {
            return fetchSamples(selection.schemaQuery, sampleColumn, [
                Filter.create('RowId', selection.selected, Filter.Types.IN)
            ]);
        }
    });
}
