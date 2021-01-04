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
import { Draft, immerable, produce } from 'immer';

import { AssayDefinitionModel, LoadingState } from '../../..';

import { AssayWizardModel } from './AssayWizardModel';

export interface AssayPropertiesPanelProps {
    model: AssayWizardModel;
    onChange: Function;
    title?: string;
    showQuerySelectPreviewOptions?: boolean;
}

export class AssayUploadResultModel {
    [immerable] = true;

    assayId: number;
    batchId: number;
    runId: number;
    success: boolean;
    successurl?: string;

    constructor(values?: Partial<AssayUploadResultModel>) {
        Object.assign(this, values);
    }
}

export class AssayStateModel {
    [immerable] = true;

    definitions: AssayDefinitionModel[];
    definitionsError: string;
    definitionsLoadingState: LoadingState;
    protocolError: string;
    protocolLoadingState: LoadingState;

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

    getDefinitionsByType(type: string): AssayDefinitionModel[] {
        const lowerName = type.toLowerCase();
        return this.definitions.filter(def => def.type.toLowerCase() === lowerName);
    }

    mutate(props: Partial<AssayStateModel>): AssayStateModel {
        return produce(this, (draft: Draft<AssayStateModel>) => {
            Object.assign(draft, props);
        });
    }
}
