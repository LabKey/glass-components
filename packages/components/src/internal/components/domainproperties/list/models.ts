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
import { Record } from 'immutable';

import { DomainDesign, DomainField } from '../models';
import { DOMAIN_FIELD_PRIMARY_KEY_LOCKED } from '../constants';

import { PRIVATE_PICKLIST_CATEGORY, PUBLIC_PICKLIST_CATEGORY } from '../../picklist/constants';

import { INT_LIST, PICKLIST, VAR_LIST } from './constants';

export interface EachItemSettings {
    eachItemBodySetting: number;
    eachItemBodyTemplate: string;
    eachItemTitleTemplate: string;
}

export interface EntireListSettings {
    entireListBodySetting: number;
    entireListBodyTemplate: string;
    entireListIndexSetting: number;
    entireListTitleTemplate: string;
}

export interface AdvancedSettingsForm extends EachItemSettings, EntireListSettings {
    discussionSetting: number;
    eachItemIndex: boolean;
    entireListIndex: boolean;
    fileAttachmentIndex: boolean;
    multiFolder: boolean;
    titleColumn: string;
}

export class ListModel extends Record({
    exception: undefined,
    domain: undefined,
    entityId: undefined,
    createdBy: undefined,
    created: undefined,
    modifiedBy: undefined,
    modified: undefined,
    containerId: undefined,
    name: undefined,
    domainKindName: undefined,
    description: undefined,
    lastIndexed: undefined,
    keyName: undefined,
    titleColumn: undefined,
    domainId: undefined,
    keyType: undefined,
    discussionSetting: undefined,
    allowDelete: undefined,
    allowUpload: undefined,
    allowExport: undefined,
    entireListIndex: undefined,
    entireListIndexSetting: undefined,
    entireListTitleTemplate: undefined,
    entireListBodySetting: undefined,
    entireListBodyTemplate: undefined,
    eachItemIndex: undefined,
    eachItemTitleTemplate: undefined,
    eachItemBodySetting: undefined,
    eachItemBodyTemplate: undefined,
    fileAttachmentIndex: undefined,
    multiFolder: undefined,
    listId: undefined,
    discussionSettingEnum: undefined,
    containerPath: undefined,
    category: undefined,
}) {
    declare exception: string;
    declare domain: DomainDesign;
    declare name: string;
    declare domainKindName: string;
    declare description: string;
    declare lastIndexed: any;
    declare keyName: string;
    declare titleColumn: string;
    declare domainId: number;
    declare keyType: string;
    declare discussionSetting: number;
    declare allowDelete: true;
    declare allowUpload: true;
    declare allowExport: true;
    declare entireListIndex: true;
    declare entireListIndexSetting: number;
    declare entireListTitleTemplate: string;
    declare entireListBodySetting: number;
    declare entireListBodyTemplate: string;
    declare eachItemIndex: false;
    declare eachItemTitleTemplate: string;
    declare eachItemBodySetting: number;
    declare eachItemBodyTemplate: string;
    declare fileAttachmentIndex: false;
    declare multiFolder: false;
    declare listId: number;
    declare discussionSettingEnum: string;
    declare containerPath: string;
    declare category: string;

    static create(raw: any, defaultSettings = null): ListModel {
        if (defaultSettings) {
            const domain = DomainDesign.create(undefined);
            return new ListModel({ ...defaultSettings, domain });
        } else {
            let domain = DomainDesign.create(raw.domainDesign);

            // Issue39818: Set the key field of an existing list to be PKLocked.
            const fields = domain.fields;
            const pkField = fields.findIndex(i => i.isPrimaryKey);
            if (pkField > -1) {
                const pkFieldLocked = fields
                    .get(pkField)
                    .merge({ lockType: DOMAIN_FIELD_PRIMARY_KEY_LOCKED }) as DomainField;
                const updatedFields = fields.set(pkField, pkFieldLocked);
                domain = domain.set('fields', updatedFields) as DomainDesign;
            }

            return new ListModel({ ...raw.options, domain });
        }
    }

    getDomainKind(): string {
        if (this.category === PUBLIC_PICKLIST_CATEGORY || this.category === PRIVATE_PICKLIST_CATEGORY) {
            return PICKLIST;
        } else if (this.keyType === 'Varchar') {
            return VAR_LIST;
        } else if (this.keyType === 'Integer' || this.keyType === 'AutoIncrementInteger') {
            return INT_LIST;
        }

        return undefined;
    }

    hasValidKeyType(): boolean {
        return this.getDomainKind() !== undefined;
    }

    isNew(): boolean {
        return !this.listId;
    }

    isValid(): boolean {
        return this.hasValidProperties() && this.hasValidKeyType() && !this.domain.hasInvalidFields();
    }

    hasValidProperties(): boolean {
        return this.name !== undefined && this.name !== null && this.name.trim().length > 0;
    }

    getOptions(): Record<string, any> {
        const options = this.toJS();

        // Note: keyName is primarily set using <SetKeyFieldNamePanel/>'s onSelectionChange()
        // Setting keyName here covers the use-case where a user sets a Key Field, and then changes its name
        const keyField = this.domain.fields.find(field => field.isPrimaryKey);
        if (keyField && this.keyName !== keyField.name) {
            options.keyName = keyField.name;
        }

        delete options.exception;
        delete options.domain;
        return options;
    }
}
