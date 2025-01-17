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
import { List, Record as ImmutableRecord } from 'immutable';

import { getServerContext, Utils } from '@labkey/api';

import { DomainDesign, FieldErrors } from '../models';
import { AppURL } from '../../../url/AppURL';
import { getAppHomeFolderPath } from '../../../app/utils';
import { Container } from '../../base/models/Container';

// See ExpProtocol.Status in 'platform' repository.
export enum Status {
    Active = 'Active',
    Archived = 'Archived',
}

export interface ProtocolTransformScript {
    runOnEdit: boolean;
    runOnImport: boolean;
    scriptPath: string;
}

export class AssayProtocolModel extends ImmutableRecord({
    allowBackgroundUpload: false,
    allowEditableResults: false,
    allowQCStates: false,
    allowTransformationScript: false,
    allowPlateMetadata: false,
    autoCopyTargetContainer: undefined,
    autoCopyTargetContainerId: undefined,
    autoLinkCategory: undefined,
    availableDetectionMethods: undefined,
    availableMetadataInputFormats: undefined,
    availablePlateTemplates: undefined,
    backgroundUpload: false,
    description: undefined,
    domains: undefined,
    editableResults: false,
    editableRuns: false,
    exception: undefined,
    metadataInputFormatHelp: undefined,
    moduleTransformScripts: undefined,
    name: undefined,
    plateMetadata: undefined,
    protocolId: undefined,
    protocolParameters: undefined,
    protocolTransformScripts: undefined,
    providerName: undefined,
    saveScriptFiles: false,
    selectedDetectionMethod: undefined,
    selectedMetadataInputFormat: undefined,
    selectedPlateTemplate: undefined,
    status: Status.Active,
    qcEnabled: undefined,
    excludedContainerIds: undefined,
}) {
    declare allowBackgroundUpload: boolean;
    declare allowEditableResults: boolean;
    declare allowQCStates: boolean;
    declare allowTransformationScript: boolean;
    declare allowPlateMetadata: boolean;
    declare autoCopyTargetContainer: {};
    declare autoCopyTargetContainerId: string;
    declare autoLinkCategory: string;
    declare availableDetectionMethods: [];
    declare availableMetadataInputFormats: {};
    declare availablePlateTemplates: [];
    declare backgroundUpload: boolean;
    declare description: string;
    declare domains: List<DomainDesign>;
    declare editableResults: boolean;
    declare editableRuns: boolean;
    declare exception: string;
    declare metadataInputFormatHelp: any;
    declare moduleTransformScripts: List<string>;
    declare name: string;
    declare plateMetadata: boolean;
    declare protocolId: number;
    declare protocolParameters: any;
    declare protocolTransformScripts: List<ProtocolTransformScript>;
    declare providerName: string;
    declare saveScriptFiles: boolean;
    declare selectedDetectionMethod: string;
    declare selectedMetadataInputFormat: string;
    declare selectedPlateTemplate: string;
    declare status: Status;
    declare qcEnabled: boolean;
    declare excludedContainerIds: string[];

    static create(raw: any): AssayProtocolModel {
        let domains = raw.domains || List<DomainDesign>();
        if (raw.domains && Utils.isArray(raw.domains)) {
            domains = List<DomainDesign>(
                raw.domains.map(domain => {
                    return DomainDesign.create(domain);
                })
            );
        }

        if (raw.protocolTransformScripts && Utils.isArray(raw.protocolTransformScripts)) {
            raw.protocolTransformScripts = List(raw.protocolTransformScripts);
        }
        if (raw.moduleTransformScripts && Utils.isArray(raw.moduleTransformScripts)) {
            raw.moduleTransformScripts = List<string>(raw.moduleTransformScripts);
        }

        // if this is not an existing assay, clear the name property so the user must set it
        const name = !raw.protocolId ? undefined : raw.name;

        // Issue 38685: for new assays, pre-select some required assay properties
        const model = new AssayProtocolModel({ ...raw, name, domains });
        if (model.isNew()) {
            if (model.allowDetectionMethodSelection() && model.availableDetectionMethods.length > 0) {
                raw.selectedDetectionMethod = List<string>(model.availableDetectionMethods).get(0);
            }
            if (model.allowPlateTemplateSelection() && model.availablePlateTemplates.length > 0) {
                raw.selectedPlateTemplate = List<string>(model.availablePlateTemplates).get(0);
            }
        }

        return new AssayProtocolModel({ ...raw, name, domains });
    }

    static serialize(model: AssayProtocolModel): any {
        // need to serialize the DomainDesign objects to remove the unrecognized fields
        const domains = model.domains.map(domain => {
            return DomainDesign.serialize(domain);
        });

        const json = model.merge({ domains }).toJS();

        // only need to serialize the id and not the autoCopyTargetContainer object
        delete json.autoCopyTargetContainer;
        delete json.exception;
        return json;
    }

    isActive(): boolean {
        return this.status === Status.Active;
    }

    getDomainByNameSuffix(name: string): DomainDesign {
        if (this.domains.size > 0) {
            return this.domains.find(domain => {
                return domain.isNameSuffixMatch(name);
            });
        }
    }

    get container(): string {
        const container = new Container(getServerContext().container);
        const domainContainerId = this.domainContainerId;

        return this.isNew()
            ? getAppHomeFolderPath(container)
            : domainContainerId === container.id
              ? container.path
              : domainContainerId;
    }

    get domainContainerId(): string {
        return this.getIn(['domains', 0, 'container']);
    }

    isNew(): boolean {
        return !this.protocolId;
    }

    allowPlateTemplateSelection(): boolean {
        return this.availablePlateTemplates && Utils.isArray(this.availablePlateTemplates);
    }

    allowDetectionMethodSelection(): boolean {
        return this.availableDetectionMethods && Utils.isArray(this.availableDetectionMethods);
    }

    allowMetadataInputFormatSelection(): boolean {
        return (
            this.availableMetadataInputFormats &&
            Utils.isObject(this.availableMetadataInputFormats) &&
            !Utils.isEmptyObj(this.availableMetadataInputFormats)
        );
    }

    validateTransformScripts(): string {
        if (this.protocolTransformScripts === undefined || this.protocolTransformScripts.size === 0) {
            return undefined;
        }

        // make sure we don't have any script inputs that are empty strings
        const hasEmptyScript = this.protocolTransformScripts.some(
            config => config?.scriptPath === undefined || config.scriptPath === null || config.scriptPath.length === 0
        );
        if (hasEmptyScript) {
            return 'Missing required transform script path.';
        }
    }

    getFirstDomainFieldError(): FieldErrors {
        const firstErrantDomain = this.domains.find(domain => domain.hasInvalidFields());
        return firstErrantDomain !== undefined ? firstErrantDomain.getInvalidFields().first().getErrors() : undefined;
    }

    isValid(): boolean {
        return this.hasValidProperties() && this.getFirstDomainFieldError() === undefined;
    }

    isGPAT(): boolean {
        return this.providerName.toLowerCase() === 'general';
    }

    hasValidProperties(): boolean {
        return (
            this.name !== undefined &&
            this.name !== null &&
            this.name.trim().length > 0 &&
            (!this.allowMetadataInputFormatSelection() || Utils.isString(this.selectedMetadataInputFormat)) &&
            (!this.allowDetectionMethodSelection() || Utils.isString(this.selectedDetectionMethod)) &&
            (!this.allowPlateTemplateSelection() || Utils.isString(this.selectedPlateTemplate)) &&
            this.validateTransformScripts() === undefined
        );
    }

    get hasBatchFields(): boolean {
        return this.getDomainByNameSuffix('Batch')?.fields.size > 0;
    }

    getUrl(): AppURL {
        return AppURL.create('assays', this.providerName, this.name);
    }
}
