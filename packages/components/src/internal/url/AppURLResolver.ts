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
import { Map } from 'immutable';
import { Filter } from '@labkey/api';

import { SAMPLE_MANAGEMENT, SCHEMAS } from '../schemas';

import { selectRows } from '../query/selectRows';
import { caseInsensitive } from '../util/utils';

import { AppRouteResolver } from './models';
import { decodeListResolverPath } from './utils';
import { AppURL, spliceURL } from './AppURL';

/**
 * Resolves list routes dynamically
 * /q/lists/$CPS<container_path>$CPE/22/14/... -> /q/lists/listByName/14/...
 */
export class ListResolver implements AppRouteResolver {
    fetched: boolean;
    lists: Map<string, string>; // Map<containerPath|listId, listName>

    constructor(lists?: Map<string, string>) {
        this.fetched = false;
        this.lists = lists !== undefined ? lists : Map<string, string>();
    }

    matches(route: string): boolean {
        return /\/q\/lists\/(\$CPS.+\$CPE)\/(\d+$|\d+)\/*/.test(decodeURIComponent(route));
    }

    async fetch(parts: any[]): Promise<AppURL> {
        // ["q", "lists", "/container/path", "44", ...]
        const containerPathIndex = 2;
        const listIdIndex = 3;
        const listIdNum = parseInt(parts[listIdIndex], 10);
        const containerPath = decodeListResolverPath(decodeURIComponent(parts[containerPathIndex]))?.toLowerCase();
        const key = [containerPath, listIdNum].join('|');

        if (isNaN(listIdNum) || !containerPath) {
            // skip it
            return;
        } else if (this.lists.has(key)) {
            // resolve it
            const newParts = [this.lists.get(key)];
            return spliceURL(parts, newParts, containerPathIndex, 2);
        } else if (this.fetched) {
            // skip it
            return undefined;
        }

        // fetch it
        try {
            const result = await selectRows({
                schemaQuery: SCHEMAS.LIST_METADATA_TABLES.LIST_MANAGER,
                columns: 'ListId,Name,Container/Path',
            });

            this.fetched = true;

            // fulfill local cache
            this.lists = result.rows
                .reduce<Map<string, string>>((map, list) => {
                    const _containerPath = caseInsensitive(list, 'Container/Path').value.toLowerCase();
                    const _listId = caseInsensitive(list, 'ListId').value;
                    const _name = caseInsensitive(list, 'Name').value.toLowerCase();

                    const _key = [_containerPath, _listId].join('|');
                    return map.set(_key, _name);
                }, Map<string, string>().asMutable())
                .asImmutable();

            // respond
            if (this.lists.has(key)) {
                // resolve it
                const newParts = [this.lists.get(key)];
                return spliceURL(parts, newParts, containerPathIndex, 2);
            }
        } catch (e) {
            // skip it
        }

        // skip it
        return undefined;
    }
}

/**
 * Resolves experiment runs to workflow jobs if appropriate
 * /rd/run/14/... -> /workflow/14/...
 * If this doesn't correspond to a job, the link won't resolve.
 *
 * Ideally we would resolve to the original URL if it's not a job, but since that's a link out to LKS
 * it's not currently supported by AppRouteResolvers.  Alternatively, and perhaps more ideally, we'd resolve
 * to the lineage page for a sample, but the URL here doesn't have any info about the related entity.
 */
export class ExperimentRunResolver implements AppRouteResolver {
    jobs: Set<number>; // set of rowIds that are jobs

    constructor(jobs?: Set<number>) {
        this.jobs = jobs !== undefined ? jobs : new Set();
    }

    async fetch(parts: any[]): Promise<AppURL> {
        const rowIdIndex = 2;
        const rowId = parseInt(parts[rowIdIndex], 10);

        if (isNaN(rowId)) {
            // skip it
            return undefined;
        }
        if (this.jobs.has(rowId)) {
            // resolve it
            return AppURL.create('workflow', rowId);
        }
        try {
            const result = await selectRows({
                schemaQuery: SAMPLE_MANAGEMENT.JOBS,
                filterArray: [Filter.create('RowId', rowId)],
                columns: 'RowId',
            });

            if (result.rows.length > 0) {
                // resolve it
                this.jobs.add(rowId);
                return AppURL.create('workflow', rowId);
            } else {
                return AppURL.create('rd', 'assayrun', rowId);
            }
        } catch (e) {
            // skip it
        }

        // skip it
        return undefined;
    }

    matches(route: string): boolean {
        return /\/rd\/run\/\d+$/.test(route);
    }
}
