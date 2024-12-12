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
import { immerable, produce } from 'immer';

import { AssayDefinitionModel } from '../../AssayDefinitionModel';
import { LoadingState } from '../../../public/LoadingState';
import { IDomainField } from '../domainproperties/models';

export class AssayUploadResultModel {
    [immerable] = true;

    readonly assayId: number;
    readonly batchId: number;
    readonly runId: number;
    readonly success: boolean;
    readonly successurl?: string;
    readonly jobId?: number;

    constructor(values?: Partial<AssayUploadResultModel>) {
        Object.assign(this, values);
    }
}

export class AssayStateModel {
    [immerable] = true;

    readonly definitions: AssayDefinitionModel[];
    readonly definitionsError: string;
    readonly definitionsLoadingState: LoadingState;
    readonly protocolError: string;
    readonly protocolLoadingState: LoadingState;

    constructor(values?: Partial<AssayStateModel>) {
        Object.assign(this, values);

        this.definitions = this.definitions ?? [];
        this.definitionsLoadingState = this.definitionsLoadingState ?? LoadingState.INITIALIZED;
        this.protocolLoadingState = this.protocolLoadingState ?? LoadingState.INITIALIZED;
    }

    getById(assayRowId: number): AssayDefinitionModel {
        return this.definitions.find(def => def.id === assayRowId);
    }

    getByName(assayName: string): AssayDefinitionModel {
        const lowerName = assayName.toLowerCase();
        return this.definitions.find(def => def.name.toLowerCase() === lowerName);
    }

    getDefinitionsByTypes(included?: string[], excluded?: string[]): AssayDefinitionModel[] {
        if (!included && !excluded) return this.definitions;

        const lowerIncluded = included?.join('|').toLowerCase().split('|');
        const lowerExcluded = excluded?.join('|').toLowerCase().split('|');

        return this.definitions.filter(def => {
            let include = true;
            if (included?.length > 0) {
                include = lowerIncluded.indexOf(def.type.toLowerCase()) !== -1;
            }
            if (excluded?.length > 0) {
                include = lowerExcluded.indexOf(def.type.toLowerCase()) === -1;
            }
            return include;
        });
    }

    mutate(props: Partial<AssayStateModel>): AssayStateModel {
        return produce<AssayStateModel>(this, draft => {
            Object.assign(draft, props);
        });
    }
}

export type FilterCriteriaColumns = Record<string, IDomainField[]>;
