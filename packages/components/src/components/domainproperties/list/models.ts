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
import { Record } from "immutable";
import { SEVERITY_LEVEL_ERROR } from "../constants";
import { DomainDesign } from "../models";

export class ListModel extends Record({
    exception: undefined,
    domain: undefined,
    entityId : undefined,
    createdBy : undefined,
    created : undefined,
    modifiedBy : undefined,
    modified : undefined,
    containerId : undefined,
    name : undefined,
    description : undefined,
    lastIndexed : undefined, //confirm defaults
    keyName : undefined,
    titleColumn : undefined,
    domainId : undefined,
    keyType : undefined,
    discussionSetting : undefined,
    allowDelete : undefined,
    allowUpload : undefined,
    allowExport : undefined,
    entireListIndex : undefined,
    entireListIndexSetting : undefined,
    entireListTitleSetting : undefined,
    entireListTitleTemplate : undefined,
    entireListBodySetting : undefined,
    entireListBodyTemplate : undefined,
    eachItemIndex : undefined,
    eachItemTitleSetting : undefined,
    eachItemTitleTemplate : undefined,
    eachItemBodySetting : undefined,
    eachItemBodyTemplate : undefined,
    fileAttachmentIndex : undefined,
    listId : undefined,
    entireListTitleSettingEnum : undefined,
    entireListBodySettingEnum : undefined,
    eachItemTitleSettingEnum : undefined,
    eachItemBodySettingEnum : undefined,
    discussionSettingEnum : undefined,
    entireListIndexSettingEnum : undefined,
    containerPath : undefined,
}) {
    exception: string;
    domain: DomainDesign;
    name : string;
    description : string;
    lastIndexed : any; //confirm
    keyName : string;
    titleColumn : null;
    domainId : number;
    keyType : string;
    discussionSetting : number;
    allowDelete : true;
    allowUpload : true;
    allowExport : true;
    entireListIndex : true;
    entireListIndexSetting : number;
    entireListTitleSetting : number;
    entireListTitleTemplate : any; //confirm
    entireListBodySetting : number;
    entireListBodyTemplate : any; //confirm
    eachItemIndex : false;
    eachItemTitleSetting : number;
    eachItemTitleTemplate : any; //confirm
    eachItemBodySetting : number;
    eachItemBodyTemplate : any; //confirm
    fileAttachmentIndex : false;
    listId : number;
    entireListTitleSettingEnum : string;
    entireListBodySettingEnum : string;
    eachItemTitleSettingEnum : string;
    eachItemBodySettingEnum : string;
    discussionSettingEnum : string;
    entireListIndexSettingEnum : string;
    containerPath : string;

    constructor(values?: {[key:string]: any}) {
        super(values);
    }

    static create(raw: any, defaultSettings=null): ListModel {
        if (defaultSettings) {
            let domain = DomainDesign.create(undefined);
            return new ListModel({...defaultSettings, domain});
        } else {
            let domain = DomainDesign.create(raw.domainDesign);
            return new ListModel({...raw.options, domain});
        }
    }

    getDomainKind(): string {
        if (this.keyType === "Varchar") {
            return "VarList"
        } else if (this.keyType === "Integer" || this.keyType === "AutoIncrementInteger") {
            return "IntList"
        }
    }

    isNew(): boolean {
        return !this.listId;
    }

    static isValid(model: ListModel): boolean {
        const errDomain = !!model.domain.domainException && model.domain.domainException.severity === SEVERITY_LEVEL_ERROR;
        return !errDomain && model.hasValidProperties();
    }

    hasValidProperties(): boolean {
        return ((this.name !== undefined && this.name !== null && this.name.trim().length > 0)
            // TODO additional validation to come
        )
    }

    // TODO is this needed?
    hasValidDomain(): boolean {
        return false;
    }

    getOptions(): Object {
        let options = this.toJS();
        delete options.domain;
        return options;
    }
}
