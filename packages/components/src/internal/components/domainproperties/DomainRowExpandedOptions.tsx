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
import React, { ReactNode } from 'react';

import { List } from 'immutable';

import { OntologyLookupOptions } from '../ontology/OntologyLookupOptions';

import { DomainField, IDomainFormDisplayOptions, IFieldChange, SystemField } from './models';
import { NameAndLinkingOptions } from './NameAndLinkingOptions';
import { TextFieldOptions } from './TextFieldOptions';
import { BooleanFieldOptions } from './BooleanFieldOptions';
import { NumericFieldOptions } from './NumericFieldOptions';
import { DateTimeFieldOptions } from './DateTimeFieldOptions';
import { LookupFieldOptions } from './LookupFieldOptions';
import { ConditionalFormattingAndValidation } from './ConditionalFormattingAndValidation';
import { isFieldFullyLocked } from './propertiesUtil';
import { SampleFieldOptions } from './SampleFieldOptions';
import { DerivationDataScopeFieldOptions } from './DerivationDataScopeFieldOptions';
import { TextChoiceOptions } from './TextChoiceOptions';
import { FileAttachmentOptions } from './FileAttachmentOptions';
import { CalculatedFieldOptions } from './CalculatedFieldOptions';
import { CALCULATED_TYPE } from './PropDescType';
import { FieldHitCriteria } from './FieldHitCriteria';

interface Props {
    appPropertiesOnly?: boolean;
    domainContainerPath?: string;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    domainIndex: number;
    field: DomainField;
    getDomainFields?: () => { domainFields: List<DomainField>; systemFields: SystemField[] };
    index: number;
    onChange: (fieldId: string, value: any, index?: number, expand?: boolean, skipDirtyCheck?: boolean) => void;
    onMultiChange: (changes: List<IFieldChange>) => void;
    queryName?: string;
    schemaName?: string;
    showingModal: (boolean) => void;
}

export class DomainRowExpandedOptions extends React.Component<Props> {
    typeDependentOptions = (): ReactNode => {
        const {
            field,
            index,
            onChange,
            onMultiChange,
            domainIndex,
            domainFormDisplayOptions,
            getDomainFields,
            appPropertiesOnly,
            domainContainerPath,
            schemaName,
            queryName,
        } = this.props;

        // In most cases we will use the selected data type to determine which field options to show,
        // however in the calculated field data type case, we need to use the rangeURI.
        let dataTypeName = field.dataType.name;
        if (dataTypeName === CALCULATED_TYPE.name && field?.rangeURI) {
            dataTypeName = field?.rangeURI.substring(field?.rangeURI.lastIndexOf('#') + 1);
        }

        switch (dataTypeName) {
            case 'string':
                if (domainFormDisplayOptions && !domainFormDisplayOptions.hideTextOptions) {
                    // Issue 39877: Max text length options should not be visible for text key field of list
                    // Also, don't show max text length options for calculated fields
                    if (field.isPrimaryKey || field.isCalculatedField()) {
                        return;
                    }

                    return (
                        <TextFieldOptions
                            index={index}
                            domainIndex={domainIndex}
                            label="Text Options"
                            scale={field.scale}
                            onChange={onChange}
                            lockType={field.lockType}
                            scannable={field.scannable}
                            appPropertiesOnly={appPropertiesOnly}
                            showScannableOption={domainFormDisplayOptions?.showScannableOption}
                        />
                    );
                } else {
                    return null;
                }
            case 'flag':
                return (
                    <TextFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Flag Options"
                        scale={field.scale}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
            case 'multiLine':
                return (
                    <TextFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Multi-line Text Field Options"
                        scale={field.scale}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
            case 'boolean':
                return (
                    <BooleanFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Boolean Field Options"
                        format={field.format}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
            case 'dateTime':
            case 'date':
            case 'time':
                return (
                    <DateTimeFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Date and Time Options"
                        format={field.format}
                        onChange={onChange}
                        lockType={field.lockType}
                        type={dataTypeName}
                    />
                );
            case 'int':
                return (
                    <NumericFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Integer Options"
                        format={field.format}
                        defaultScale={field.defaultScale}
                        onChange={onChange}
                        lockType={field.lockType}
                        scannable={field.scannable}
                        appPropertiesOnly={appPropertiesOnly}
                        showScannableOption={
                            domainFormDisplayOptions?.showScannableOption && !field.isCalculatedField()
                        }
                    />
                );
            case 'double':
            case 'decimal':
                return (
                    <NumericFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Decimal Options"
                        format={field.format}
                        defaultScale={field.defaultScale}
                        onChange={onChange}
                        lockType={field.lockType}
                        // Issue #44567: Hide scannable option due to matching issues with floating point representation.
                        showScannableOption={false}
                    />
                );
            case 'lookup':
            case 'users':
                return (
                    <LookupFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        field={field}
                        label="Lookup Definition Options"
                        lookupContainer={field.lookupContainer ?? domainContainerPath}
                        onChange={onChange}
                        onMultiChange={onMultiChange}
                        lockType={field.lockType}
                    />
                );
            case 'sample':
                return (
                    <SampleFieldOptions
                        index={index}
                        domainIndex={domainIndex}
                        label="Sample Options"
                        value={field.lookupQueryValue}
                        original={field.original}
                        container={field.lookupContainer}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
            case 'ontologyLookup':
                const domainFields = getDomainFields ? getDomainFields().domainFields : List<DomainField>();

                return (
                    <OntologyLookupOptions
                        domainContainerPath={domainContainerPath}
                        index={index}
                        domainIndex={domainIndex}
                        label="Ontology Lookup Options"
                        domainFields={domainFields}
                        field={field}
                        onChange={onChange}
                        onMultiChange={onMultiChange}
                        lockType={field.lockType}
                    />
                );
            case 'textChoice':
                // don't show Text Choice options for query metadata editor
                if (domainFormDisplayOptions?.hideValidators) return null;

                return (
                    <TextChoiceOptions
                        domainIndex={domainIndex}
                        index={index}
                        field={field}
                        label="Text Choice Options"
                        lockType={field.lockType}
                        onChange={onChange}
                        queryName={queryName}
                        schemaName={schemaName}
                        lockedForDomain={domainFormDisplayOptions.textChoiceLockedForDomain}
                        lockedSqlFragment={domainFormDisplayOptions.textChoiceLockedSqlFragment}
                    />
                );
            case 'fileLink':
            case 'attachment':
                // Remove when this is supported in apps. Issue 46476
                if (appPropertiesOnly) return null;

                return (
                    <FileAttachmentOptions
                        index={index}
                        domainIndex={domainIndex}
                        label={dataTypeName === 'fileLink' ? 'File' : 'Attachment'}
                        displayOption={field.format}
                        onChange={onChange}
                        lockType={field.lockType}
                    />
                );
        }

        return null;
    };

    render() {
        const {
            field,
            index,
            onChange,
            showingModal,
            appPropertiesOnly,
            domainIndex,
            domainFormDisplayOptions,
            getDomainFields,
        } = this.props;

        return (
            <div className="domain-row-container">
                <div className="domain-row-container-expand-spacer" />
                <div className="domain-row-container-expanded">
                    {domainFormDisplayOptions?.derivationDataScopeConfig?.show && !field.isCalculatedField() && (
                        <div className="col-xs-12">
                            <DerivationDataScopeFieldOptions
                                index={index}
                                domainIndex={domainIndex}
                                config={domainFormDisplayOptions?.derivationDataScopeConfig}
                                value={field.derivationDataScope}
                                label={domainFormDisplayOptions?.derivationDataScopeConfig?.sectionTitle}
                                onChange={onChange}
                                lockType={field.lockType}
                                isExistingField={!field.isNew()}
                                isRequiredField={field.required}
                                fieldDataType={field.dataType}
                            />
                        </div>
                    )}
                    {field.isCalculatedField() && (
                        <div className="col-xs-12">
                            <CalculatedFieldOptions
                                domainIndex={domainIndex}
                                field={field}
                                getDomainFields={getDomainFields}
                                index={index}
                                onChange={onChange}
                            />
                        </div>
                    )}
                    <div className="col-xs-12">{this.typeDependentOptions()}</div>
                    <div className="col-xs-12">
                        <NameAndLinkingOptions
                            index={index}
                            domainIndex={domainIndex}
                            field={field}
                            onChange={onChange}
                            appPropertiesOnly={appPropertiesOnly}
                            domainFormDisplayOptions={domainFormDisplayOptions}
                        />
                    </div>
                    {!isFieldFullyLocked(field.lockType) && (
                        <div className="col-xs-12">
                            <ConditionalFormattingAndValidation
                                index={index}
                                domainIndex={domainIndex}
                                field={field}
                                onChange={onChange}
                                showingModal={showingModal}
                                domainFormDisplayOptions={domainFormDisplayOptions}
                            />
                        </div>
                    )}
                    {domainFormDisplayOptions.showHitCriteria && <FieldHitCriteria field={field} />}
                </div>
            </div>
        );
    }
}
