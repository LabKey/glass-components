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
import { List, OrderedMap, Map, Record } from 'immutable'
import { AssayDOM } from '@labkey/api'
import {
    AppURL,
    AssayDefinitionModel,
    AssayUploadTabs,
    QueryColumn,
    QueryInfo,
    FileAttachmentFormModel,
    QueryGridModel,
    generateNameWithTimestamp
} from "@glass/base";

import { getEditorModel } from "../../global";

export interface AssayPropertiesPanelProps {
    model: AssayWizardModel
    onChange: Function
}

export interface IAssayURLContext {
    assayRequest?: string
    location?: string
    protocol: string
    provider: string
    runId?: string
}

export class AssayWizardModel extends Record({
    assayDef: undefined,
    isError: undefined,
    isWarning: false,
    isInit: false,
    isLoading: false,
    batchId: undefined, // batchId is null for first run
    lastRunId: undefined,
    returnURL: undefined,
    isSubmitted: undefined,
    isSubmitting: undefined,
    errorMsg: undefined,

    attachedFiles: Map<string, File>(),

    batchColumns: OrderedMap<string, QueryColumn>(),
    batchProperties: Map<string, any>(),
    runColumns: OrderedMap<string, QueryColumn>(),
    runId: undefined,
    runProperties: Map<string, any>(),
    runName: undefined,
    comment: undefined,
    dataText: undefined,
    queryInfo: QueryInfo,
    toDelete: undefined,
    selectedSamples: undefined,
}) implements FileAttachmentFormModel {
    assayDef: AssayDefinitionModel;
    isError?: boolean;
    isInit: boolean;
    isLoading: boolean;
    isWarning?: boolean;
    batchId? : number;
    lastRunId?: number;
    returnURL?: AppURL;
    isSubmitted?: boolean;
    isSubmitting?: boolean;
    errorMsg?: string;

    attachedFiles: Map<string, File>;

    batchColumns: OrderedMap<string, QueryColumn>;
    batchProperties: Map<string, any>;
    runColumns: OrderedMap<string, QueryColumn>;
    runId?: string;
    runProperties?: Map<string, any>;
    runName?: string;
    comment?: string;

    dataText: string;
    queryInfo: QueryInfo;
    toDelete?: string;
    selectedSamples?: Map<string, any>;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    getAttachedFiles(): List<File> {
        return this.attachedFiles.valueSeq().toList();
    }

    getRunName(currentStep: AssayUploadTabs): string {
        if (this.runName) {
            return this.runName;
        }

        if (currentStep === AssayUploadTabs.Files) {
            // using file upload tab
            const file = this.getAttachedFiles().first();
            if (file) {
                return file.name;
            }
        }

        return generateNameWithTimestamp(this.assayDef.name);
    }

    prepareFormData(currentStep: number, gridModel: QueryGridModel): IAssayUploadOptions {
        const { batchId, batchProperties, comment, dataText, assayDef, runProperties, runId } = this;

        let assayData: any = {
            assayId: assayDef.id,
            batchId,
            batchProperties: batchProperties.toObject(),
            comment,
            name: this.getRunName(currentStep),
            properties: runProperties.toObject(),
            reRunId: runId,
        };

        Object.keys(assayData).forEach(k => {
            if (assayData[k] === undefined) {
                delete assayData[k];
            }
        });

        if (currentStep === AssayUploadTabs.Files) {
            assayData.files = this.getAttachedFiles().toArray();
        }
        else if (currentStep === AssayUploadTabs.Copy) {
            assayData.dataRows = parseDataTextToRunRows(dataText);
        }
        else if (currentStep === AssayUploadTabs.Grid) {
            // need to get the EditorModel for the data to use in the import
            const editorModel = getEditorModel(gridModel.getId());

            assayData.dataRows = editorModel.getRawData(gridModel).valueSeq()
                .map(row => row.filter(v => v !== undefined && v !== null && (''+v).trim() !== ''))
                .toList()
                .toJS();
        }
        else {
            throw new Error('Unsupported upload step! Current step: "' + currentStep + '"');
        }

        return assayData;
    }
}

export interface IAssayUploadOptions extends AssayDOM.IImportRunOptions {
    dataRows?: any // Array<any> | QueryGridModel
}

function parseDataTextToRunRows(rawData: string): Array<any> {
    if (!rawData || !rawData.length) {
        return null;
    }

    let rows = [];
    let columns = [];

    rawData.split('\n')
        .filter(row => row.trim().length > 0)
        .forEach((row) => {
            let parts = row.split('\t');
            if (parts.length === 0)
                return;

            if (columns.length === 0)
                columns = parts;
            else {
                let row = {};
                parts.forEach((part, index) => {
                    if (part.trim() !== '') {
                        row[columns[index]] = part;
                    }
                });
                rows.push(row);
            }
        });

    return rows.length > 0 ? rows : null;
}

export class AssayUploadResultModel extends Record({
    assayId: undefined,
    batchId: undefined,
    runId: undefined,
    success: undefined,
    successurl: undefined,
}) {
    assayId: number;
    batchId: number;
    runId: number;
    success: boolean;
    successurl?: string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }
}