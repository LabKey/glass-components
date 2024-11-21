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
import { fromJS, List, Map, Record as ImmutableRecord } from 'immutable';
import { ActionURL, Domain, getServerContext, Utils } from '@labkey/api';
import React, { ReactNode } from 'react';

import { GRID_NAME_INDEX, GRID_SELECTION_INDEX } from '../../constants';

import { camelCaseToTitleCase, valueIsEmpty } from '../../util/utils';

import { getConceptForCode } from '../ontology/actions';

import {
    getCurrentAppProperties,
    hasPremiumModule,
    isCalculatedFieldsEnabled,
    isQueryMetadataEditor,
} from '../../app/utils';

import { GridColumn } from '../base/models/GridColumn';

import { SCHEMAS } from '../../schemas';

import { resolveErrorMessage } from '../../util/messaging';

import { DomainDesignerCheckbox } from './DomainDesignerCheckbox';

import {
    ALL_SAMPLES_DISPLAY_TEXT,
    CALCULATED_CONCEPT_URI,
    DERIVATION_DATA_SCOPES,
    DOMAIN_FIELD_DIMENSION,
    DOMAIN_FIELD_FULLY_LOCKED,
    DOMAIN_FIELD_MEASURE,
    DOMAIN_FIELD_NOT_LOCKED,
    DOMAIN_FIELD_PARTIALLY_LOCKED,
    DOMAIN_FIELD_SELECTED,
    DOMAIN_FILTER_HASANYVALUE,
    FIELD_EMPTY_TEXT_CHOICE_WARNING_INFO,
    FIELD_EMPTY_TEXT_CHOICE_WARNING_MSG,
    FILE_CONVERT_URIS,
    INT_RANGE_URI,
    LONG_RANGE_URI,
    MAX_TEXT_LENGTH,
    NUMBER_CONVERT_URIS,
    PHILEVEL_NOT_PHI,
    SAMPLE_TYPE_CONCEPT_URI,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
    SMILES_CONCEPT_URI,
    STORAGE_UNIQUE_ID_CONCEPT_URI,
    STRING_CONVERT_URIS,
    STRING_RANGE_URI,
    TEXT_CHOICE_CONCEPT_URI,
    TEXT_CHOICE_PHI_NOTE,
    UNLIMITED_TEXT_LENGTH,
    USER_RANGE_URI,
} from './constants';
import {
    CALCULATED_TYPE,
    CONCEPT_URIS_NOT_USED_IN_TYPES,
    DATE_TYPE,
    DATETIME_TYPE,
    DOUBLE_TYPE,
    FILE_TYPE,
    FLAG_TYPE,
    INTEGER_TYPE,
    LOOKUP_TYPE,
    ONTOLOGY_LOOKUP_TYPE,
    PROP_DESC_TYPES,
    PropDescType,
    READONLY_DESC_TYPES,
    SAMPLE_TYPE,
    SMILES_TYPE,
    STUDY_PROPERTY_TYPES,
    TEXT_TYPE,
    USERS_TYPE,
} from './PropDescType';
import {
    isFieldDeletable,
    removeFalseyObjKeys,
    removeNonAppProperties,
    removeUnusedOntologyProperties,
    removeUnusedProperties,
    reorderSummaryColumns,
} from './propertiesUtil';
import { INT_LIST, VAR_LIST } from './list/constants';
import { DomainRowWarning } from './DomainRowWarning';
import { createFormInputId } from './utils';

export interface IFieldChange {
    id: string;
    value: any;
}

export type DomainOnChange = (
    changes: List<IFieldChange>,
    index?: number,
    expand?: boolean,
    skipDirtyCheck?: boolean
) => void;

export interface IBannerMessage {
    message: string;
    messageType: string;
}

export interface ITypeDependentProps {
    domainIndex: number;
    index: number;
    label: string;
    lockType: string;
    onChange: (fieldId: string, value: any, index?: number, expand?: boolean) => any;
}

export interface FieldDetails {
    detailsInfo: { [key: string]: string };
    ontologyLookupIndices: number[];
}

export interface DomainPropertiesGridColumn {
    caption: string;
    index: string;
    sortable: boolean;
}

export const SAMPLE_TYPE_OPTION_VALUE = `${SAMPLE_TYPE.rangeURI}|all`;

interface IDomainDesign {
    allowAttachmentProperties: boolean;
    allowCalculatedFields: boolean;
    allowFileLinkProperties: boolean;
    allowFlagProperties: boolean;
    allowSampleSubjectProperties: boolean;
    allowTextChoiceProperties: boolean;
    allowTimepointProperties: boolean;
    allowUniqueConstraintProperties: boolean;
    allowUserProperties: boolean;
    container: string;
    defaultDefaultValueType: string;
    defaultValueOptions: List<string>;
    description?: string;
    disabledSystemFields?: string[];
    domainException?: DomainException;
    domainId: number;
    domainKindName?: string;
    domainURI: string;
    fields?: List<DomainField>;
    indices?: List<DomainIndex>;
    instructions?: string;
    name: string;
    // set of fields to initialize a manually created design
    newDesignFields?: List<DomainField>;
    queryName?: string;
    schemaName?: string;
    showDefaultValueSettings: boolean;
}

export class DomainDesign
    extends ImmutableRecord({
        name: undefined,
        container: undefined,
        description: undefined,
        domainURI: undefined,
        domainId: null,
        allowFileLinkProperties: false,
        allowAttachmentProperties: false,
        allowFlagProperties: true,
        allowSampleSubjectProperties: true,
        allowTextChoiceProperties: true,
        allowTimepointProperties: false,
        allowUniqueConstraintProperties: false,
        allowUserProperties: true,
        allowCalculatedFields: false,
        showDefaultValueSettings: false,
        defaultDefaultValueType: undefined,
        defaultValueOptions: List<string>(),
        fields: List<DomainField>(),
        indices: List<DomainIndex>(),
        domainException: undefined,
        mandatoryFieldNames: List<string>(),
        reservedFieldNames: List<string>(),
        newDesignFields: undefined,
        instructions: undefined,
        domainKindName: undefined,
        schemaName: undefined,
        queryName: undefined,
        disabledSystemFields: undefined,
    })
    implements IDomainDesign
{
    declare name: string;
    declare container: string;
    declare description: string;
    declare domainURI: string;
    declare domainId: number;
    declare allowFileLinkProperties: boolean;
    declare allowAttachmentProperties: boolean;
    declare allowFlagProperties: boolean;
    declare allowSampleSubjectProperties: boolean;
    declare allowTextChoiceProperties: boolean;
    declare allowTimepointProperties: boolean;
    declare allowUniqueConstraintProperties: boolean;
    declare allowUserProperties: boolean;
    declare allowCalculatedFields: boolean;
    declare showDefaultValueSettings: boolean;
    declare defaultDefaultValueType: string;
    declare defaultValueOptions: List<string>;
    declare fields: List<DomainField>;
    declare indices: List<DomainIndex>;
    declare domainException: DomainException;
    declare mandatoryFieldNames: List<string>;
    declare reservedFieldNames: List<string>;
    declare newDesignFields?: List<DomainField>; // Returns a set of fields to initialize a manually created design
    declare instructions: string;
    declare domainKindName: string;
    declare schemaName: string;
    declare queryName: string;
    declare disabledSystemFields?: string[];

    static create(rawModel: any, exception?: any): DomainDesign {
        let fields = List<DomainField>();
        let indices = List<DomainIndex>();
        let defaultValueOptions = List<DomainField>();
        let mandatoryFieldNames = List<string>();
        let uniqueConstraintFieldNames = List<string>();

        const domainException = DomainException.create(exception, exception ? exception.severity : undefined);

        if (rawModel) {
            if (rawModel.mandatoryFieldNames) {
                mandatoryFieldNames = List<string>(rawModel.mandatoryFieldNames.map(name => name.toLowerCase()));
            }

            if (rawModel.indices) {
                indices = DomainIndex.fromJS(rawModel.indices);
                uniqueConstraintFieldNames = indices
                    .filter(index => index.isSingleFieldUniqueConstraint())
                    .map(index => index.columns.get(0))
                    .toList();

                // Hack: SQL server uses a hashed field for unique constraints on text columns, see
                // BaseMicrosoftSqlServerDialect.addCreateIndexStatements (where it talks about HASHBYTES)
                indices
                    .filter(index => index.isMSSQLHashedSingleFieldUniqueConstraint())
                    .forEach(index => {
                        uniqueConstraintFieldNames = uniqueConstraintFieldNames.push(
                            index.columns.get(0).replace('_hashed_', '')
                        );
                    });
            }

            if (rawModel.fields) {
                fields = DomainField.fromJS(rawModel.fields, mandatoryFieldNames, uniqueConstraintFieldNames);
            }

            // allow calculated fields if the feature is enabled and the domain kind allows it,
            // or if the user is in the query metadata editor (then we always want to include calculated fields)
            const allowCalculatedFields =
                (isCalculatedFieldsEnabled() && rawModel.allowCalculatedFields) || isQueryMetadataEditor();
            if (allowCalculatedFields && rawModel.calculatedFields) {
                const calcFields = DomainField.fromJS(
                    rawModel.calculatedFields,
                    mandatoryFieldNames,
                    uniqueConstraintFieldNames
                );
                fields = fields.push(...calcFields.toArray());
            }

            if (rawModel.defaultValueOptions) {
                for (let i = 0; i < rawModel.defaultValueOptions.length; i++) {
                    defaultValueOptions = defaultValueOptions.push(rawModel.defaultValueOptions[i]);
                }
            }
        }

        return new DomainDesign({
            ...rawModel,
            fields,
            indices,
            defaultValueOptions,
            domainException,
        });
    }

    static serialize(dd: DomainDesign): any {
        const json = dd.toJS();

        // Issue 41677: allow for per-field unique constraints to be added via the field editor UI
        json.indices = dd.indices
            // filter out the single field unique indices, and keep the others
            .filter(
                index => !index.isSingleFieldUniqueConstraint() && !index.isMSSQLHashedSingleFieldUniqueConstraint()
            )
            .map(index => DomainIndex.serialize(index))
            .toArray();
        // add in the new set of single field unique indices
        dd.fields.forEach(field => {
            if (field.uniqueConstraint) {
                json.indices.push(
                    DomainIndex.serialize(new DomainIndex({ columns: List.of(field.name?.trim()), type: 'unique' }))
                );
            }
        });

        json.fields = dd.fields.map(field => DomainField.serialize(field)).toArray();

        // remove non-serializable fields
        delete json.allowUserProperties;
        delete json.domainException;
        delete json.newDesignFields;

        return json;
    }

    hasErrors(): boolean {
        return (
            this.domainException !== undefined &&
            this.domainException.errors !== undefined &&
            this.domainException.errors.size > 0 &&
            this.domainException.severity === SEVERITY_LEVEL_ERROR
        );
    }

    hasException(): boolean {
        return this.domainException !== undefined;
    }

    hasFieldException(): boolean {
        return this.hasException() && this.domainException.hasFieldErrors();
    }

    getNonFieldException(): string {
        return this.domainException?.getNonFieldException();
    }

    isNameSuffixMatch(name: string): boolean {
        return this.name && this.name.endsWith(name + ' Fields');
    }

    // Issue 38399: helper for each designer model to know if there are field-level errors
    hasInvalidFields(): boolean {
        return this.getInvalidFields().size > 0;
    }

    getInvalidFields(): Map<number, DomainField> {
        let invalid = Map<number, DomainField>();

        for (let i = 0; i < this.fields.size; i++) {
            const field = this.fields.get(i);
            if (field.hasErrors()) {
                invalid = invalid.set(i, field);
            }
        }

        return invalid;
    }

    hasDefaultValueOption(value: string): boolean {
        return this.defaultValueOptions.some(option => option === value);
    }

    hasInvalidNameField(defaultNameFieldConfig?: Partial<IDomainField>): boolean {
        if (this.fields && this.fields.size > 0 && defaultNameFieldConfig && defaultNameFieldConfig.name) {
            const nameField = this.fields.find(field => {
                return field && field.name && field.name.toLowerCase() === defaultNameFieldConfig.name.toLowerCase();
            });

            return nameField !== undefined;
        }

        return false;
    }

    getFirstFieldError(): FieldErrors {
        const invalidFields = this.getInvalidFields();
        return invalidFields.size > 0 ? invalidFields.first().getErrors() : undefined;
    }

    getDomainContainer(): string {
        return this.container ?? getServerContext().container.id;
    }

    isSharedDomain(): boolean {
        const currentContainer = getServerContext().container.id;
        return this.getDomainContainer() !== currentContainer;
    }

    findFieldIndexByName(fieldName: string): number {
        return this.fields.findIndex(field => fieldName && field.name === fieldName);
    }

    getFieldDetails(): FieldDetails {
        const mapping: FieldDetails = {
            ontologyLookupIndices: [],
            detailsInfo: {},
        };

        this.fields.forEach((field, index) => {
            if (!field.hasInvalidName()) {
                if (field.conceptImportColumn) {
                    mapping.detailsInfo[field.conceptImportColumn] = 'Ontology Lookup: ' + field.name;
                }
                if (field.conceptLabelColumn) {
                    mapping.detailsInfo[field.conceptLabelColumn] = 'Ontology Lookup: ' + field.name;
                }

                if (field.dataType.isOntologyLookup()) {
                    mapping.ontologyLookupIndices.push(index);
                }
            }
        });

        return mapping;
    }

    getGridData(appPropertiesOnly: boolean, hasOntologyModule: boolean): List<any> {
        return this.fields
            .map((field, i) => {
                let fieldSerial = DomainField.serialize(field);
                const dataType = field.dataType;
                fieldSerial = removeUnusedProperties(fieldSerial);
                if (!hasOntologyModule) {
                    fieldSerial = removeUnusedOntologyProperties(fieldSerial);
                }
                if (appPropertiesOnly) {
                    fieldSerial = removeNonAppProperties(fieldSerial);
                }

                fieldSerial.fieldIndex = i;
                // Add back subset of field properties stripped by the serialize
                fieldSerial.selected = field.selected;
                fieldSerial.visible = field.visible;

                return Map(
                    Object.keys(fieldSerial).map(key => {
                        const rawVal = fieldSerial[key];
                        const valueType = typeof rawVal;
                        let value = valueIsEmpty(rawVal) ? '' : rawVal;

                        // Since rangeURI is not set on field creation, pull rangeURI value from dataType
                        if (key === 'rangeURI' && value === '') {
                            value = dataType.rangeURI;
                        }

                        // Make bools render as strings sortable within their column
                        if (key !== 'visible' && key !== 'selected' && valueType === 'boolean') {
                            value = rawVal ? 'true' : 'false';
                        }

                        // Handle property validator and conditional format rendering
                        if ((key === 'propertyValidators' || key === 'conditionalFormats') && value !== '') {
                            value = JSON.stringify(value.map(cf => removeFalseyObjKeys(cf)));
                        }

                        if (key === 'fieldIndex' && value === '') {
                            value = 0;
                        }
                        return [key, value];
                    })
                );
            })
            .toList();
    }

    getGridColumns(
        onFieldsChange: DomainOnChange,
        scrollFunction: (i: number) => void,
        domainKindName: string,
        appPropertiesOnly: boolean,
        hasOntologyModule: boolean
    ): List<GridColumn | DomainPropertiesGridColumn> {
        const selectionCol = new GridColumn({
            index: GRID_SELECTION_INDEX,
            title: GRID_SELECTION_INDEX,
            width: 20,
            cell: (data, row) => {
                const domainIndex = row.get('domainIndex');
                const fieldIndex = row.get('fieldIndex');
                const selected = row.get('selected');
                const formInputId = createFormInputId(DOMAIN_FIELD_SELECTED, domainIndex, fieldIndex);

                const changes = List.of({ id: formInputId, value: !selected });
                return (
                    <DomainDesignerCheckbox
                        className="domain-summary-selection"
                        id={formInputId}
                        checked={selected}
                        onChange={() => {
                            onFieldsChange(changes, fieldIndex, false);
                        }}
                    />
                );
            },
        });

        const nameCol = new GridColumn({
            index: GRID_NAME_INDEX,
            title: GRID_NAME_INDEX,
            raw: { index: 'name', caption: 'Name', sortable: true },
            cell: (data, row) => {
                const text = row.get('name');
                const fieldIndex = row.get('fieldIndex');

                return (
                    <a onClick={() => scrollFunction(fieldIndex)} className="clickable">
                        {text}
                    </a>
                );
            },
        });

        const specialCols = List([selectionCol, nameCol]);
        const firstField = this.fields.get(0);
        let columns = DomainField.serialize(firstField);

        delete columns.name;
        columns = removeUnusedProperties(columns);
        if (!hasOntologyModule) {
            columns = removeUnusedOntologyProperties(columns);
        }
        if (appPropertiesOnly) {
            columns = removeNonAppProperties(columns);
        }
        if (domainKindName !== VAR_LIST && domainKindName !== INT_LIST) {
            delete columns.isPrimaryKey;
        }
        if (!(appPropertiesOnly && domainKindName === 'SampleSet')) {
            delete columns.scannable;
        }

        const unsortedColumns = List(
            Object.keys(columns).map(key => ({ index: key, caption: camelCaseToTitleCase(key), sortable: true }))
        );
        return specialCols.concat(unsortedColumns.sort(reorderSummaryColumns)).toList();
    }
}

export interface IDomainIndex {
    columns: string[] | List<string>;
    type: 'primary' | 'unique' | 'nonunique';
}

export class DomainIndex
    extends ImmutableRecord({
        columns: List<string>(),
        type: undefined,
    })
    implements IDomainIndex
{
    declare columns: List<string>;
    declare type: 'primary' | 'unique' | 'nonunique';

    static fromJS(rawIndices: IDomainIndex[]): List<DomainIndex> {
        let indices = List<DomainIndex>();

        for (let i = 0; i < rawIndices.length; i++) {
            let raw = fromJS(rawIndices[i]);
            if (raw.has('columnNames')) raw = raw.set('columns', raw.get('columnNames'));
            if (raw.has('unique')) raw = raw.set('type', raw.get('unique') ? 'unique' : 'nonunique');

            indices = indices.push(new DomainIndex(raw));
        }

        return indices;
    }

    static serialize(index: DomainIndex): any {
        const json = index.toJS();

        json.columnNames = [...json.columns];
        delete json.columns;

        json.unique = json.type === 'primary' || json.type === 'unique';
        delete json.type;

        return json;
    }

    isSingleFieldUniqueConstraint(): boolean {
        return this.type === 'unique' && this.columns.size === 1;
    }

    isMSSQLHashedSingleFieldUniqueConstraint(): boolean {
        return this.type === 'nonunique' && this.columns.size === 1 && this.columns.get(0).startsWith('_hashed_');
    }
}

export enum FieldErrors {
    ALIQUOT_ONLY_REQUIRED = "Fields that are 'Editable for aliquots only' cannot be 'Required'.",
    INVALID_LOOKUP = 'Lookup target table does not exist.',
    MISSING_CALCULATION_EXPRESSION = 'Please provide an expression value for each calculated field.',
    MISSING_DATA_TYPE = 'Please provide a data type for each field.',
    MISSING_FIELD_NAME = 'Please provide a name for each field.',
    MISSING_ONTOLOGY_PROPERTIES = 'Missing required ontology source or label field property.',
    MISSING_SCHEMA_QUERY = 'Missing required lookup target schema or table property.',
    NONE = '',
}

export interface IConditionalFormat {
    backgroundColor?: string;
    bold: boolean;
    formatFilter: string;
    italic: boolean;
    strikethrough: boolean;
    textColor?: string;
}

export class ConditionalFormat
    extends ImmutableRecord({
        formatFilter: undefined,
        bold: false,
        italic: false,
        strikethrough: false,
        textColor: undefined,
        backgroundColor: undefined,
    })
    implements IConditionalFormat
{
    declare formatFilter: string;
    declare bold: boolean;
    declare italic: boolean;
    declare strikethrough: boolean;
    declare textColor?: string;
    declare backgroundColor?: string;

    constructor(values?: { [key: string]: any }) {
        // filter is a reserved work on Records so change to formatFilter and update for HASANYVALUE lacking a filter symbol
        if (values && !values.get('formatFilter')) {
            values = values.set(
                'formatFilter',
                values.get('filter').replace('~=', '~' + DOMAIN_FILTER_HASANYVALUE + '=')
            );
        }
        super(values);
    }

    static fromJS(rawCondFormat: ConditionalFormat[]): List<ConditionalFormat> {
        let condFormats = List<ConditionalFormat>();

        for (let i = 0; i < rawCondFormat.length; i++) {
            condFormats = condFormats.push(new ConditionalFormat(fromJS(rawCondFormat[i])));
        }

        return condFormats;
    }

    static serialize(cfs: any[]): any {
        // Change formatFilter back to filter as that is what API is expecting
        for (let i = 0; i < cfs.length; i++) {
            cfs[i].filter = cfs[i].formatFilter.replace(DOMAIN_FILTER_HASANYVALUE, '');
            delete cfs[i].formatFilter;
        }

        return cfs;
    }
}

export interface IPropertyValidatorProperties {
    failOnMatch: boolean;
    validValues: string[];
    valueUpdates: Record<string, string>;
}

export class PropertyValidatorProperties
    extends ImmutableRecord({
        failOnMatch: false,
        validValues: undefined,
        valueUpdates: undefined,
    })
    implements IPropertyValidatorProperties
{
    declare failOnMatch: boolean;
    declare validValues: string[];
    declare valueUpdates: Record<string, string>;

    constructor(values?: { [key: string]: any }) {
        if (typeof values?.failOnMatch === 'string') {
            values.failOnMatch = values.failOnMatch.toLowerCase() === 'true';
        }
        // see DomainUtil.getPropertyDescriptor() for where this property is added to the JSON field validator extChoice validator info
        if (typeof values?.validValues === 'string') {
            values.validValues = values.validValues.split('|');
        }
        super(values);
    }
}

const EXPECTED_VALIDATOR_TYPES = ['Range', 'RegEx', 'TextChoice', 'Lookup'];

export interface IPropertyValidator {
    description?: string;
    errorMessage?: string;
    expression?: string;
    extraProperties: PropertyValidatorProperties;
    name: string;
    new: boolean;
    properties: PropertyValidatorProperties;
    rowId?: number;
    shouldShowWarning: boolean;
    type: string;
}

export class PropertyValidator
    extends ImmutableRecord({
        type: undefined,
        name: undefined,
        properties: new PropertyValidatorProperties(),
        extraProperties: new PropertyValidatorProperties(),
        errorMessage: undefined,
        description: undefined,
        new: true,
        shouldShowWarning: false,
        rowId: undefined,
        expression: undefined,
    })
    implements IPropertyValidator
{
    declare type: string;
    declare name: string;
    declare properties: PropertyValidatorProperties;
    declare extraProperties: PropertyValidatorProperties;
    declare errorMessage?: string;
    declare description?: string;
    declare new: boolean;
    declare shouldShowWarning: boolean;
    declare rowId?: number;
    declare expression?: string;

    static fromJS(rawPropertyValidator: any[], type: string, isNewField = false): List<PropertyValidator> {
        let propValidators = List<PropertyValidator>();

        if (EXPECTED_VALIDATOR_TYPES.indexOf(type) > -1) {
            for (let i = 0; i < rawPropertyValidator.length; i++) {
                if (rawPropertyValidator[i].type === type) {
                    const expressionStr = rawPropertyValidator[i].expression;
                    const hasExpressionStr = expressionStr !== undefined && expressionStr !== null;

                    // if we are loading a textChoiceValidator from JSON, we need to set the properties.validValues
                    if (type === 'TextChoice' && !rawPropertyValidator[i]?.properties?.validValues) {
                        rawPropertyValidator[i].properties.validValues = expressionStr?.split('|') ?? [];
                    }

                    rawPropertyValidator[i]['properties'] = new PropertyValidatorProperties(
                        rawPropertyValidator[i]['properties']
                    );
                    let newPv = new PropertyValidator(rawPropertyValidator[i]);

                    // if loading validator from DB, set shouldShowWarning initially
                    newPv = newPv.set('shouldShowWarning', true) as PropertyValidator;

                    // Special case for filters HAS ANY VALUE not having a symbol
                    if (hasExpressionStr) {
                        newPv = newPv.set(
                            'expression',
                            expressionStr.replace('~=', '~' + DOMAIN_FILTER_HASANYVALUE + '=')
                        ) as PropertyValidator;
                    }

                    // for new fields, clear any validator rowIds that come in from the JSON file import
                    if (isNewField) newPv = newPv.set('rowId', undefined) as PropertyValidator;

                    propValidators = propValidators.push(newPv);
                }
            }
        }

        return propValidators;
    }

    static serialize(pvs: any[]): any {
        for (let i = 0; i < pvs.length; i++) {
            if (pvs[i].expression) {
                pvs[i].expression = pvs[i].expression.replace(DOMAIN_FILTER_HASANYVALUE, '');
            }

            if (pvs[i]?.properties?.validValues) {
                delete pvs[i].properties.validValues;
            }

            if (pvs[i]?.extraProperties && !pvs[i].extraProperties.valueUpdates) {
                delete pvs[i].extraProperties;
            }

            delete pvs[i].shouldShowWarning;
        }

        return pvs;
    }
}

export const DEFAULT_TEXT_CHOICE_VALIDATOR = new PropertyValidator({
    type: 'TextChoice',
    name: 'Text Choice Validator',
    expression: '',
    properties: { validValues: [] },
});

interface ILookupConfig {
    lookupContainer?: string;
    lookupQuery?: string;
    lookupQueryValue?: string;
    lookupSchema?: string;
    lookupType?: PropDescType;
}

export interface IDomainField {
    PHI?: string;
    URL?: string;
    conceptImportColumn?: string;
    conceptLabelColumn?: string;
    conceptSubtree?: string;
    conceptURI?: string;
    conditionalFormats: List<ConditionalFormat>;
    dataType: PropDescType;
    defaultDisplayValue?: string;
    defaultScale?: string;
    defaultValue?: string;
    defaultValueType?: string;
    derivationDataScope?: string;
    description?: string;
    dimension?: boolean;
    disablePhiLevel?: boolean;
    excludeFromShifting?: boolean;
    format?: string;
    hidden?: boolean;
    importAliases?: string;
    isPrimaryKey: boolean;
    label?: string;
    lockExistingField?: boolean;
    lockType: string;
    lookupContainer?: string;
    lookupQuery?: string;
    lookupQueryValue: string;
    lookupSchema?: string;
    lookupType: PropDescType;
    lookupValidator?: PropertyValidator;
    measure?: boolean;
    mvEnabled?: boolean;
    name: string;
    original: Partial<IDomainField>;
    primaryKey?: boolean;
    principalConceptCode?: string;
    propertyId?: number;
    propertyURI: string;
    propertyValidators: List<PropertyValidator>;
    rangeURI: string;
    rangeValidators: List<PropertyValidator>;
    recommendedVariable?: boolean;
    regexValidators: List<PropertyValidator>;
    required?: boolean;
    scale?: number;
    scannable?: boolean;
    shownInDetailsView?: boolean;
    shownInInsertView?: boolean;
    shownInUpdateView?: boolean;
    sourceOntology?: string;
    textChoiceValidator?: PropertyValidator;
    uniqueConstraint?: boolean;
    updatedField: boolean;
    visible: boolean;
}

export class DomainField
    extends ImmutableRecord({
        conceptURI: undefined,
        conditionalFormats: List<ConditionalFormat>(),
        defaultScale: undefined,
        defaultValueType: undefined,
        defaultValue: undefined,
        defaultDisplayValue: undefined,
        description: undefined,
        dimension: undefined,
        excludeFromShifting: false,
        format: undefined,
        hidden: false,
        importAliases: undefined,
        label: undefined,
        lookupContainer: undefined,
        lookupQuery: undefined,
        lookupSchema: undefined,
        lookupValidator: undefined,
        lookupIsValid: undefined,
        measure: undefined,
        mvEnabled: false,
        name: undefined,
        PHI: undefined,
        propertyId: undefined,
        propertyURI: undefined,
        propertyValidators: List<PropertyValidator>(),
        rangeValidators: List<PropertyValidator>(),
        rangeURI: undefined,
        regexValidators: List<PropertyValidator>(),
        textChoiceValidator: undefined,
        recommendedVariable: false,
        uniqueConstraint: false,
        required: false,
        scale: MAX_TEXT_LENGTH,
        URL: undefined,
        shownInDetailsView: true,
        shownInInsertView: true,
        shownInUpdateView: true,
        visible: true,
        dataType: undefined,
        lookupQueryValue: undefined,
        lookupType: undefined,
        original: undefined,
        updatedField: false,
        isPrimaryKey: false,
        lockType: DOMAIN_FIELD_NOT_LOCKED,
        wrappedColumnName: undefined,
        valueExpression: undefined,
        disablePhiLevel: false,
        lockExistingField: false,
        sourceOntology: undefined,
        conceptSubtree: undefined,
        conceptLabelColumn: undefined,
        conceptImportColumn: undefined,
        principalConceptCode: undefined,
        derivationDataScope: undefined,
        selected: false,
        scannable: false,
    })
    implements IDomainField
{
    declare conceptURI?: string;
    declare conditionalFormats: List<ConditionalFormat>;
    declare defaultScale?: string;
    declare defaultValueType?: string;
    declare defaultValue?: string;
    declare defaultDisplayValue?: string;
    declare description?: string;
    declare dimension?: boolean;
    declare excludeFromShifting?: boolean;
    declare format?: string;
    declare hidden?: boolean;
    declare importAliases?: string;
    declare label?: string;
    declare lookupContainer?: string;
    declare lookupQuery?: string;
    declare lookupSchema?: string;
    declare lookupValidator?: PropertyValidator;
    declare lookupIsValid?: boolean;
    declare measure?: boolean;
    declare mvEnabled?: boolean;
    declare name: string;
    declare PHI?: string;
    declare propertyId?: number;
    declare propertyURI: string;
    declare propertyValidators: List<PropertyValidator>;
    declare rangeValidators: List<PropertyValidator>;
    declare rangeURI: string;
    declare regexValidators: List<PropertyValidator>;
    declare textChoiceValidator?: PropertyValidator;
    declare recommendedVariable: boolean;
    declare uniqueConstraint: boolean;
    declare required?: boolean;
    declare scale?: number;
    declare scannable?: boolean;
    declare URL?: string;
    declare shownInDetailsView?: boolean;
    declare shownInInsertView?: boolean;
    declare shownInUpdateView?: boolean;
    declare visible: boolean;
    declare dataType: PropDescType;
    declare lookupQueryValue: string;
    declare lookupType: PropDescType;
    declare original: Partial<IDomainField>;
    declare updatedField: boolean;
    declare isPrimaryKey: boolean;
    declare lockType: string;
    declare wrappedColumnName?: string;
    declare valueExpression?: string;
    declare disablePhiLevel?: boolean;
    declare lockExistingField?: boolean;
    declare sourceOntology?: string;
    declare conceptSubtree?: string;
    declare conceptLabelColumn?: string;
    declare conceptImportColumn?: string;
    declare principalConceptCode?: string;
    declare derivationDataScope?: string;
    declare selected: boolean;

    static create(rawField: any, shouldApplyDefaultValues?: boolean, mandatoryFieldNames?: List<string>): DomainField {
        const baseField = DomainField.resolveBaseProperties(rawField, mandatoryFieldNames);
        const { dataType } = baseField;
        const lookup = DomainField.resolveLookupConfig(rawField, dataType);
        let field = new DomainField(
            Object.assign(rawField, baseField, {
                ...lookup,
                original: {
                    dataType,
                    conceptURI: rawField.conceptURI,
                    name: rawField.name,
                    rangeURI:
                        rawField.propertyId !== undefined || rawField.wrappedColumnName !== undefined
                            ? rawField.rangeURI // Issue 40795: need rangURI for alias field (query metadata) to get other available types in the datatype dropdown
                            : undefined, // Issue 38366: only need to use rangeURI filtering for already saved field/property
                },
            })
        );

        if (rawField.conditionalFormats) {
            field = field.set(
                'conditionalFormats',
                ConditionalFormat.fromJS(rawField.conditionalFormats)
            ) as DomainField;
        }

        if (rawField.propertyValidators) {
            field = field.set(
                'rangeValidators',
                PropertyValidator.fromJS(rawField.propertyValidators, 'Range', field.isNew())
            ) as DomainField;
            field = field.set(
                'regexValidators',
                PropertyValidator.fromJS(rawField.propertyValidators, 'RegEx', field.isNew())
            ) as DomainField;

            const lookups = PropertyValidator.fromJS(rawField.propertyValidators, 'Lookup', field.isNew());
            if (lookups && lookups.size > 0) {
                field = field.set('lookupValidator', lookups.get(0)) as DomainField;
            }

            const textChoice = PropertyValidator.fromJS(rawField.propertyValidators, 'TextChoice', field.isNew());
            if (textChoice?.size > 0) {
                field = field.set('textChoiceValidator', textChoice.get(0)) as DomainField;
            }
        }

        if (shouldApplyDefaultValues) {
            field = DomainField.updateDefaultValues(field);
        }

        return field;
    }

    static resolveLookupConfig(rawField: Partial<IDomainField>, dataType: PropDescType): ILookupConfig {
        const lookupType = LOOKUP_TYPE.set('rangeURI', rawField.rangeURI) as PropDescType;
        const lookupContainer = rawField.lookupContainer === null ? undefined : rawField.lookupContainer;
        const lookupSchema = resolveLookupSchema(rawField, dataType);
        const lookupQuery =
            rawField.lookupQuery || (dataType === SAMPLE_TYPE ? SCHEMAS.EXP_TABLES.MATERIALS.queryName : undefined);
        const lookupQueryValue = encodeLookup(lookupQuery, lookupType);

        return {
            lookupContainer,
            lookupSchema,
            lookupQuery,
            lookupType,
            lookupQueryValue,
        };
    }

    static fromJS(
        rawFields: IDomainField[],
        mandatoryFieldNames?: List<string>,
        uniqueConstraintFieldNames?: List<string>
    ): List<DomainField> {
        let fields = List<DomainField>();
        const lowerUniqueConstraintFieldNames = uniqueConstraintFieldNames?.map(f => f.toLowerCase()).toArray();

        for (let i = 0; i < rawFields.length; i++) {
            const rawField = rawFields[i];
            rawField.uniqueConstraint = lowerUniqueConstraintFieldNames?.indexOf(rawField.name?.toLowerCase()) > -1;
            fields = fields.push(DomainField.create(rawField, undefined, mandatoryFieldNames));
        }

        return fields;
    }

    static resolveBaseProperties(
        raw: Partial<IDomainField>,
        mandatoryFieldNames?: List<string>
    ): Partial<IDomainField> {
        const dataType = resolveDataType(raw);

        // lockType can either come from the rawField, or be based on the domain's mandatoryFieldNames
        const isMandatoryFieldMatch =
            mandatoryFieldNames !== undefined && raw.name && mandatoryFieldNames.contains(raw.name.toLowerCase());
        let lockType = raw.lockType || DOMAIN_FIELD_NOT_LOCKED;
        if (lockType === DOMAIN_FIELD_NOT_LOCKED && isMandatoryFieldMatch) {
            lockType = DOMAIN_FIELD_PARTIALLY_LOCKED;
        }

        const field = { dataType, lockType } as IDomainField;

        // Infer SampleId as SAMPLE_TYPE for sample manager and mark required
        if (isFieldNew(raw) && raw.name) {
            if (raw.name.localeCompare('SampleId', 'en', { sensitivity: 'accent' }) === 0) {
                field.dataType = SAMPLE_TYPE;
                field.conceptURI = SAMPLE_TYPE.conceptURI;
                field.rangeURI = SAMPLE_TYPE.rangeURI;
                field.required = true;
            }
        }

        // If calculated field, set the rangeURI to the calculated field type
        if (field.dataType === CALCULATED_TYPE) {
            field.rangeURI = raw.rangeURI;
        }

        return field;
    }

    static serialize(df: DomainField, fixCaseSensitivity = true): any {
        const json = df.toJS();

        // Issue 43254: trim field name leading and trailing spaces before saving
        json.name = df.name?.trim();

        if (!(df.dataType.isLookup() || df.dataType.isUser() || df.dataType.isSample())) {
            json.lookupContainer = null;
            json.lookupQuery = null;
            json.lookupSchema = null;
        }

        if (json.lookupContainer === undefined) {
            json.lookupContainer = null;
        }

        // for some reason the property binding server side cares about casing here for 'URL' and 'PHI'
        if (fixCaseSensitivity) {
            if (json.URL !== undefined) {
                json.url = json.URL;
                delete json.URL;
            }
            if (json.PHI !== undefined) {
                json.phi = json.PHI;
                delete json.PHI;
            }
        }

        if (json.conditionalFormats) {
            json.conditionalFormats = ConditionalFormat.serialize(json.conditionalFormats);
        }

        json.propertyValidators = [];
        if (json.rangeValidators) {
            json.propertyValidators = json.propertyValidators.concat(PropertyValidator.serialize(json.rangeValidators));
        }
        if (json.regexValidators) {
            json.propertyValidators = json.propertyValidators.concat(PropertyValidator.serialize(json.regexValidators));
        }
        if (json.lookupValidator) {
            json.propertyValidators = json.propertyValidators.concat(
                PropertyValidator.serialize([json.lookupValidator])
            );
        }
        if (json.textChoiceValidator) {
            json.propertyValidators = json.propertyValidators.concat(
                PropertyValidator.serialize([json.textChoiceValidator])
            );
        }

        // Special case for users, needs different URI for uniqueness in UI but actually uses int URI
        if (json.rangeURI === USER_RANGE_URI) {
            json.rangeURI = INT_RANGE_URI;
        }

        // Issue 39938: revert back to max Integer length if user input is larger then 4000
        if (df.scale && (isNaN(df.scale) || df.scale > MAX_TEXT_LENGTH)) {
            json.scale = UNLIMITED_TEXT_LENGTH;
        }

        // remove non-serializable fields
        delete json.dataType;
        delete json.lookupQueryValue;
        delete json.lookupType;
        delete json.original;
        delete json.updatedField;
        delete json.visible;
        delete json.rangeValidators;
        delete json.regexValidators;
        delete json.textChoiceValidator;
        delete json.lookupValidator;
        delete json.disablePhiLevel;
        delete json.lockExistingField;
        delete json.selected;
        delete json.lookupIsValid;
        delete json.uniqueConstraint;

        return json;
    }

    getRangeURI(): string {
        return this.dataType.rangeURI || this.rangeURI;
    }

    getErrors(): FieldErrors {
        if (this.dataType.isLookup() && (!this.lookupSchema || !this.lookupQuery)) {
            return FieldErrors.MISSING_SCHEMA_QUERY;
        }

        if (this.dataType.isLookup() && !this.lookupIsValid) {
            return FieldErrors.INVALID_LOOKUP;
        }

        if ((!this.dataType || !this.getRangeURI()) && !this.isCalculatedField()) {
            return FieldErrors.MISSING_DATA_TYPE;
        }

        if (this.hasInvalidName()) {
            return FieldErrors.MISSING_FIELD_NAME;
        }

        // Issue 41829: for an ontology lookup field, only the sourceOntology is required (other ontology props are optional)
        if (this.dataType.isOntologyLookup() && !this.sourceOntology) {
            return FieldErrors.MISSING_ONTOLOGY_PROPERTIES;
        }

        // Issue 46733: Editable for aliquots only/Required Field: Adding Samples gives error
        if (this.derivationDataScope === DERIVATION_DATA_SCOPES.CHILD_ONLY && this.required) {
            return FieldErrors.ALIQUOT_ONLY_REQUIRED;
        }

        if (this.isCalculatedField() && (!this.valueExpression || this.valueExpression.trim().length === 0)) {
            return FieldErrors.MISSING_CALCULATION_EXPRESSION;
        }

        return FieldErrors.NONE;
    }

    hasInvalidName(): boolean {
        return this.name === undefined || this.name === null || this.name.trim() === '';
    }

    hasErrors(): boolean {
        return this.getErrors() !== FieldErrors.NONE;
    }

    isNew(): boolean {
        return isFieldNew(this);
    }

    isSaved(): boolean {
        return isFieldSaved(this);
    }

    isUniqueIdField(): boolean {
        return this.conceptURI === STORAGE_UNIQUE_ID_CONCEPT_URI;
    }

    isTextChoiceField(): boolean {
        return this.conceptURI === TEXT_CHOICE_CONCEPT_URI;
    }

    isCalculatedField(): boolean {
        return this.conceptURI === CALCULATED_CONCEPT_URI;
    }

    isPHI(): boolean {
        return !!this.PHI && this.PHI !== PHILEVEL_NOT_PHI;
    }

    isDeletable(): boolean {
        return isFieldDeletable(this);
    }

    static hasRangeValidation(field: DomainField): boolean {
        return (
            field.dataType === INTEGER_TYPE ||
            field.dataType === DOUBLE_TYPE ||
            field.dataType === DATETIME_TYPE ||
            field.dataType === DATE_TYPE ||
            field.dataType === USERS_TYPE ||
            field.dataType === LOOKUP_TYPE
        );
    }

    static hasRegExValidation(field: DomainField): boolean {
        return (
            field.dataType.isString() &&
            !field.isUniqueIdField() &&
            !field.isTextChoiceField() &&
            !field.isCalculatedField()
        );
    }

    static updateDefaultValues(field: DomainField): DomainField {
        const { dataType } = field;

        const config = {
            measure: DomainField.defaultValues(DOMAIN_FIELD_MEASURE, dataType),
            dimension: DomainField.defaultValues(DOMAIN_FIELD_DIMENSION, dataType),
        };

        const lookupConfig = dataType === SAMPLE_TYPE ? DomainField.resolveLookupConfig(field, dataType) : {};

        return field.merge(config, lookupConfig) as DomainField;
    }

    static defaultValues(prop: string, type: PropDescType): any {
        switch (prop) {
            case DOMAIN_FIELD_MEASURE:
                return type === INTEGER_TYPE || type === DOUBLE_TYPE;
            case DOMAIN_FIELD_DIMENSION:
                return type === LOOKUP_TYPE || type === USERS_TYPE || type === SAMPLE_TYPE;
            default:
                return false;
        }
    }

    getPrincipalConceptDisplay(): string {
        const concept = getConceptForCode(this.principalConceptCode);
        return concept?.getDisplayLabel() ?? this.principalConceptCode;
    }

    getDetailsArray(fieldDetailsInfo?: Record<string, string>): ReactNode[] {
        const details = [];
        let period = '';

        if (this.isNew()) {
            details.push('New Field');
            period = '. ';
        } else if (this.updatedField) {
            details.push('Updated');
            period = '. ';
        }

        if (this.dataType.isSample()) {
            const detailsText =
                this.lookupSchema === SCHEMAS.EXP_TABLES.MATERIALS.schemaName &&
                SCHEMAS.EXP_TABLES.MATERIALS.queryName.localeCompare(this.lookupQuery, 'en', {
                    sensitivity: 'accent',
                }) === 0
                    ? ALL_SAMPLES_DISPLAY_TEXT
                    : this.lookupQuery;
            details.push(period + detailsText);
            period = '. ';
        } else if (this.dataType.isLookup() && this.lookupSchema && this.lookupQuery) {
            // only show the query as a link in LKS, for now
            let link;
            if (!getCurrentAppProperties()) {
                const params = { schemaName: this.lookupSchema, 'query.queryName': this.lookupQuery };
                const href = ActionURL.buildURL('query', 'executeQuery.view', this.lookupContainer, params);
                link = <a href={href}> {this.lookupQuery} </a>;
            }

            details.push(
                period + [this.lookupContainer || 'Current Folder', this.lookupSchema].join(' > '),
                ' > ',
                link ?? this.lookupQuery
            );
            period = '. ';
        } else if (this.dataType.isOntologyLookup() && this.sourceOntology) {
            details.push(period + this.sourceOntology);
            period = '. ';
        } else if (this.dataType.isTextChoice()) {
            const validValuesStr = getValidValuesDetailStr(this.textChoiceValidator?.properties.validValues);
            if (this.isPHI() && this.PHI !== undefined && validValuesStr) {
                details.push(period + TEXT_CHOICE_PHI_NOTE);
            } else {
                details.push(period);
                if (validValuesStr) {
                    details.push(validValuesStr);
                } else if (this.textChoiceValidator?.shouldShowWarning) {
                    const fieldError = new DomainFieldError({
                        extraInfo: FIELD_EMPTY_TEXT_CHOICE_WARNING_INFO,
                        message: FIELD_EMPTY_TEXT_CHOICE_WARNING_MSG,
                        severity: SEVERITY_LEVEL_WARN,
                    });
                    details.push(<DomainRowWarning key="domain-row-text-choice-error" fieldError={fieldError} />);
                }
            }
            period = '. ';
        }

        if (this.principalConceptCode) {
            details.push(period + 'Ontology Concept: ' + this.getPrincipalConceptDisplay());
            period = '. ';
        }

        if (this.wrappedColumnName) {
            details.push(period + 'Wrapped column - ' + this.wrappedColumnName);
            period = '. ';
        }

        if (this.isPrimaryKey) {
            details.push(period + 'Primary Key');
            period = '. ';
        }

        if (this.lockType === DOMAIN_FIELD_FULLY_LOCKED) {
            details.push(period + 'Locked');
            period = '. ';
        }

        if (!this.hasInvalidName() && fieldDetailsInfo?.hasOwnProperty(this.name)) {
            details.push(period + fieldDetailsInfo[this.name]);
            period = '. ';
        }

        return details;
    }
}

export function isValidTextChoiceValue(v: string): boolean {
    return v !== null && v !== undefined && v.trim() !== '';
}

export function getValidValuesFromArray(validValues: string[]): string[] {
    // filter out any empty string values
    const vals = validValues?.filter(isValidTextChoiceValue) ?? [];
    // remove duplicates
    return [...new Set(vals)];
}

export function getValidValuesDetailStr(validValues: string[]): string {
    const numToShow = 4;
    const vals = getValidValuesFromArray(validValues);
    if (vals.length > 0) {
        let validValuesStr = vals.slice(0, numToShow).join(', ');
        if (vals.length > numToShow) {
            validValuesStr += ` (and ${vals.length - numToShow} more)`;
        }
        if (validValuesStr.length > 80) {
            validValuesStr = Utils.pluralize(vals.length, 'value', 'values');
        }
        return validValuesStr;
    }
    return undefined;
}

export function decodeLookup(value: string): { queryName: string; rangeURI: string } {
    const [rangeURI, queryName] = value ? value.split('|') : [undefined, undefined];

    return {
        queryName,
        rangeURI,
    };
}

export function encodeLookup(queryName: string, type: PropDescType): string {
    if (queryName) {
        return [type.rangeURI, queryName].join('|');
    }

    return undefined;
}

function resolveLookupSchema(rawField: Partial<IDomainField>, dataType: PropDescType): string {
    if (rawField.lookupSchema) return rawField.lookupSchema;

    if (dataType === SAMPLE_TYPE) return SCHEMAS.EXP_TABLES.SCHEMA;

    return undefined;
}

export function updateSampleField(field: Partial<DomainField>, sampleQueryValue?: string): DomainField {
    const { queryName, rangeURI = INT_RANGE_URI } = decodeLookup(sampleQueryValue);
    const lookupType = field.lookupType || LOOKUP_TYPE;
    const sampleField =
        queryName === 'all'
            ? {
                  // Use the exp.materials table for 'all'
                  lookupSchema: SCHEMAS.EXP_TABLES.SCHEMA,
                  lookupQuery: SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                  lookupQueryValue: sampleQueryValue,
                  lookupType: field.lookupType.set('rangeURI', rangeURI),
                  rangeURI,
              }
            : {
                  // use the samples.<SampleType> table for specific sample types
                  lookupSchema: SCHEMAS.SAMPLE_SETS.SCHEMA,
                  lookupQuery: queryName,
                  lookupQueryValue: sampleQueryValue || SAMPLE_TYPE_OPTION_VALUE,
                  lookupType: lookupType.set('rangeURI', rangeURI),
                  rangeURI,
              };

    return field.merge(sampleField) as DomainField;
}

function isFieldNew(field: Partial<IDomainField>): boolean {
    return field.propertyId === undefined || field.propertyId < 0;
}

function isFieldSaved(field: Partial<IDomainField>): boolean {
    // calculated fields that are saved will have a rangeURI
    const isSavedCalcField = field.conceptURI === CALCULATED_CONCEPT_URI && field.rangeURI !== undefined;
    return !isFieldNew(field) && (field.propertyId !== 0 || isSavedCalcField);
}

export function resolveAvailableTypes(
    field: DomainField,
    availableTypes: List<PropDescType>,
    appPropertiesOnly?: boolean,
    showStudyPropertyTypes?: boolean,
    showFilePropertyType?: boolean
): List<PropDescType> {
    // field has not been saved -- display all property types allowed by app
    // Issue 40795: need to check wrappedColumnName for alias field in query metadata editor and resolve the datatype fields
    if (field.isNew() && field.wrappedColumnName === undefined) {
        return availableTypes
            .filter(type =>
                isPropertyTypeAllowed(appPropertiesOnly, type, showFilePropertyType, showStudyPropertyTypes)
            )
            .toList();
    }

    // compare against original types as the field's values are volatile
    const { rangeURI, dataType } = field.original;

    // field has been saved -- display eligible propTypes
    let filteredTypes = availableTypes
        .filter(type => {
            // Can always return to the original type for field
            if (type.name === dataType.name) return true;

            // Issue 44511: Allow all types to be converted to string
            // Issue 44711: Don't allow Attachment or FileLink field types to be converted
            if (
                STRING_CONVERT_URIS.indexOf(type.rangeURI) > -1 &&
                !type.conceptURI &&
                FILE_CONVERT_URIS.indexOf(rangeURI) === -1
            ) {
                return true;
            }

            // Issue 44511: Allow integer/long -> decimal/double/float
            if (
                NUMBER_CONVERT_URIS.indexOf(type.rangeURI) > -1 &&
                (rangeURI === INT_RANGE_URI || rangeURI === LONG_RANGE_URI)
            ) {
                return true;
            }

            if (!acceptablePropertyType(type, rangeURI)) return false;

            return isPropertyTypeAllowed(appPropertiesOnly, type, showFilePropertyType, showStudyPropertyTypes);
        })
        .toList();

    // Issue 39341: if the field type is coming from the server as a type we don't support in new field creation, add it to the list
    if (!filteredTypes.contains(dataType)) {
        filteredTypes = filteredTypes.push(dataType);
    }

    return filteredTypes;
}

export function isPropertyTypeAllowed(
    appPropertiesOnly: boolean,
    type: PropDescType,
    showFilePropertyType: boolean,
    showStudyPropertyTypes: boolean
): boolean {
    if (type === FILE_TYPE) return showFilePropertyType;

    if (STUDY_PROPERTY_TYPES.includes(type)) return showStudyPropertyTypes;

    if (!appPropertiesOnly) return true;

    // We are excluding the field types below for the App for non-premium
    return hasPremiumModule() || ![LOOKUP_TYPE, FLAG_TYPE, ONTOLOGY_LOOKUP_TYPE].includes(type);
}

// Determines if a storage type (rangeURI) is a match for a concept type (like User or Subject)
export function acceptablePropertyType(newType: PropDescType, originalRangeURI: string): boolean {
    if (newType.isLookup()) {
        return originalRangeURI === INT_RANGE_URI || originalRangeURI === STRING_RANGE_URI;
    }

    if (newType.isSample()) {
        return originalRangeURI === INT_RANGE_URI;
    }

    if (newType.isOntologyLookup()) {
        return originalRangeURI === STRING_RANGE_URI;
    }

    // Catches Users
    if (newType.isInteger() && PropDescType.isInteger(originalRangeURI)) {
        return true;
    }

    // Original field is a string, we can't convert to a unique Id
    if (newType.isUniqueId() && PropDescType.isString(originalRangeURI)) {
        return false;
    }

    // Original field is a uniqueId, text, or multi-line text, can convert to a string type
    if (newType.isString() && PropDescType.isString(originalRangeURI)) {
        return true;
    }

    // Original field is a datetime, can convert to a date or time
    if ((newType.isTime() || newType.isDate()) && PropDescType.isDateTime(originalRangeURI)) {
        return true;
    }

    // Original field is a date, can convert to a datetime
    if (newType.isDateTime() && PropDescType.isDate(originalRangeURI)) {
        return true;
    }

    return originalRangeURI === newType.rangeURI;
}

function resolveDataType(rawField: Partial<IDomainField>): PropDescType {
    let type: PropDescType;

    if (!isFieldNew(rawField) || rawField.rangeURI !== undefined) {
        if (rawField.conceptURI === SAMPLE_TYPE_CONCEPT_URI) return SAMPLE_TYPE;
        if (rawField.conceptURI === SMILES_CONCEPT_URI) return SMILES_TYPE;
        if (rawField.conceptURI === CALCULATED_CONCEPT_URI) return CALCULATED_TYPE;

        if (rawField.dataType) {
            return rawField.dataType;
        }

        type = PROP_DESC_TYPES.find(type => {
            // handle matching rangeURI and conceptURI
            if (type.rangeURI === rawField.rangeURI && !type.isUser()) {
                if (
                    !rawField.lookupQuery &&
                    ((!type.conceptURI && !rawField.conceptURI) ||
                        type.conceptURI === rawField.conceptURI ||
                        CONCEPT_URIS_NOT_USED_IN_TYPES.contains(rawField.conceptURI))
                ) {
                    return true;
                }
            }
            // handle alternateRangeURI which are returned from the server for inferDomain response
            else if (type.alternateRangeURI && type.alternateRangeURI === rawField.rangeURI) {
                return true;
            }
            // handle selected lookup option
            else if (type.isLookup() && rawField.lookupQuery && rawField.lookupQuery !== 'users') {
                return true;
            }
            // handle selected users option
            else if (type.isUser() && rawField.lookupQuery && rawField.lookupQuery === 'users') {
                return true;
            }

            return false;
        });

        // Issue 39341: support for a few field types that are used in certain domains but are not supported for newly created fields
        if (!type) {
            type = READONLY_DESC_TYPES.find(type => type.rangeURI === rawField.rangeURI);
        }
    }

    return type ? type : TEXT_TYPE;
}

interface IColumnInfoLite {
    friendlyType?: string;
    isKeyField?: boolean;
    jsonType?: string;
    name?: string;
}

export interface LookupInfo {
    name: string;
    type: PropDescType;
}

export class ColumnInfoLite
    extends ImmutableRecord({
        friendlyType: undefined,
        isKeyField: false,
        jsonType: undefined,
        name: undefined,
    })
    implements IColumnInfoLite
{
    declare friendlyType?: string;
    declare isKeyField?: boolean;
    declare jsonType?: string;
    declare name?: string;

    static create(raw: IColumnInfoLite): ColumnInfoLite {
        return new ColumnInfoLite(raw);
    }
}

interface IQueryInfoLite {
    canEdit?: boolean;
    canEditSharedViews?: boolean;
    columns?: List<ColumnInfoLite>;
    description?: string;
    hidden?: boolean;
    inherit?: boolean;
    isIncludedForLookups?: boolean;
    isInherited?: boolean;
    isMetadataOverrideable?: boolean;
    isUserDefined?: boolean;
    name?: string;
    schemaName?: string;
    snapshot?: false;
    title?: string;
    viewDataUrl?: string;
}

export class QueryInfoLite
    extends ImmutableRecord({
        canEdit: false,
        canEditSharedViews: false,
        columns: List(),
        description: undefined,
        hidden: false,
        inherit: false,
        isIncludedForLookups: true,
        isInherited: false,
        isMetadataOverrideable: false,
        isUserDefined: false,
        name: undefined,
        schemaName: undefined,
        snapshot: false,
        title: undefined,
        viewDataUrl: undefined,
    })
    implements IQueryInfoLite
{
    declare canEdit?: boolean;
    declare canEditSharedViews?: boolean;
    declare columns?: List<ColumnInfoLite>;
    declare description?: string;
    declare hidden?: boolean;
    declare inherit?: boolean;
    declare isIncludedForLookups?: boolean;
    declare isInherited?: boolean;
    declare isMetadataOverrideable?: boolean;
    declare isUserDefined?: boolean;
    declare name?: string;
    declare schemaName?: string;
    declare snapshot?: false;
    declare title?: string;
    declare viewDataUrl?: string;

    static create(raw: IQueryInfoLite, schemaName: string): QueryInfoLite {
        return new QueryInfoLite(
            Object.assign({}, raw, {
                columns: raw.columns ? List((raw.columns as any).map(c => ColumnInfoLite.create(c))) : List(),
                schemaName,
            })
        );
    }

    getLookupInfo(rangeURI?: string): LookupInfo[] {
        const infos: LookupInfo[] = [];

        // allow for queries with only 1 primary key or with 2 primary key columns when one of them is container (see Issue 39879)
        let pkCols =
            this.getPkColumns().size > 1
                ? this.getPkColumns()
                      .filter(col => col.name.toLowerCase() !== 'container')
                      .toList()
                : this.getPkColumns();

        if (pkCols.size === 1) {
            // Sample Type hack (ported from DomainEditorServiceBase.java)
            if (this.schemaName.toLowerCase() === 'samples') {
                const nameCol = this.columns.find(c => c.name.toLowerCase() === 'name');

                if (nameCol) {
                    pkCols = pkCols.push(nameCol);
                }
            }

            pkCols.forEach(pk => {
                const type = PROP_DESC_TYPES.find(
                    propType => propType.name.toLowerCase() === pk.jsonType.toLowerCase()
                );

                // if supplied, apply rangeURI matching filter
                if (type && (rangeURI === undefined || rangeURI === type.rangeURI)) {
                    infos.push({
                        name: this.name,
                        type,
                    });
                }
            });
        }

        return infos;
    }

    getPkColumns(): List<ColumnInfoLite> {
        return this.columns.filter(c => c.isKeyField).toList();
    }
}

// modeled after the JSON object received during server side error (except the severity).
interface IDomainException {
    errors?: List<DomainFieldError>;
    exception: string;
    severity: string;
    success: boolean;
}

// DomainException is used for both server side and client side errors.
// For server side, DomainException object is constructed in actions.ts (see saveDomain()) on failure while saving or creating a domain.
// For client side, DomainException object is constructed in actions.ts (see handleDomainUpdates()) while updating the domain.
export class DomainException
    extends ImmutableRecord({
        exception: undefined,
        success: undefined,
        severity: undefined,
        domainName: undefined,
        errors: List<DomainFieldError>(),
    })
    implements IDomainException
{
    declare exception: string;
    declare success: boolean;
    declare severity: string;
    declare domainName: string;
    declare errors?: List<DomainFieldError>;

    static create(rawModel: any, severityLevel): DomainException {
        if (rawModel && rawModel.exception) {
            let errors = List<DomainFieldError>();
            if (rawModel.errors) {
                errors = DomainFieldError.fromJS(rawModel.errors, severityLevel);
            }

            // warnings will only be there if there are no errors, so looking only the first one
            let severity = severityLevel;
            const hasOnlyWarnings = errors.find(error => error.severity === SEVERITY_LEVEL_WARN);
            if (hasOnlyWarnings) {
                severity = SEVERITY_LEVEL_WARN;
            }

            const domainName = this.getDomainNameFromException(rawModel.exception);
            if (domainName) {
                const prefix = domainName + ' -- ';
                errors = errors.map(err => {
                    const parts = err.message.split(prefix);
                    return err.set('message', parts.length > 1 ? parts[1] : parts[0]);
                }) as List<DomainFieldError>;
            }
            const exception = errors.isEmpty()
                ? resolveErrorMessage(rawModel.exception)
                : this.getExceptionMessage(errors);

            return new DomainException({
                exception,
                success: rawModel.success,
                severity,
                domainName,
                errors,
            });
        }

        return undefined;
    }

    hasFieldErrors(): boolean {
        if (!this.errors || this.errors.isEmpty()) return false;

        return this.errors.find(error => !!error.get('fieldName') || !!error.get('propertyId')) != null;
    }

    getNonFieldException(): string {
        if (!this.errors || this.errors.isEmpty()) return null;

        return this.errors.find(error => !error.get('fieldName') && !error.get('propertyId'))?.get('message');
    }

    static clientValidationExceptions(exception: string, fields: Map<number, DomainField>): DomainException {
        let fieldErrors = List<DomainFieldError>();

        fields.forEach((field, index) => {
            fieldErrors = fieldErrors.push(
                new DomainFieldError({
                    message: field.getErrors(),
                    fieldName: field.get('name'),
                    propertyId: field.get('propertyId'),
                    severity: SEVERITY_LEVEL_ERROR,
                    serverError: false,
                    rowIndexes: List<number>([index]),
                    newRowIndexes: undefined,
                })
            );
        });

        return new DomainException({
            exception,
            success: false,
            severity: SEVERITY_LEVEL_ERROR,
            errors: fieldErrors,
        });
    }

    static getDomainNameFromException(message: string): string {
        const msgParts = message.split(' -- ');
        if (msgParts.length > 1) {
            return msgParts[0];
        }

        return undefined;
    }

    // merge warnings with an incoming server side errors so that both server and pre-existing client side warning can be shown on the banner
    static mergeWarnings(domain: DomainDesign, exception: DomainException) {
        // merge pre-existing warnings on the domain
        if (domain && domain.hasException()) {
            const existingWarnings = domain.domainException
                .get('errors')
                .filter(e => e.severity === SEVERITY_LEVEL_WARN);
            const serverSideErrors = exception.get('errors');
            const allErrors = serverSideErrors.concat(existingWarnings);

            return exception.set('errors', allErrors);
        }

        return exception.set('errors', exception.errors);
    }

    static addRowIndexesToErrors(domain: DomainDesign, exceptionFromServer: DomainException): DomainException {
        let allFieldErrors = exceptionFromServer.get('errors');

        allFieldErrors = allFieldErrors.map(error => {
            const indices = domain.fields.reduce((indexList, field, idx, iter): List<number> => {
                if (
                    ((field.name === undefined || field.name === '') && error.get('fieldName') === undefined) ||
                    (field.propertyId !== 0 &&
                        field.propertyId !== undefined &&
                        error.get('propertyId') === field.propertyId) ||
                    (field.name !== undefined &&
                        error.get('fieldName') !== undefined &&
                        field.name.toLowerCase() === error.get('fieldName').toLowerCase())
                ) {
                    indexList = indexList.push(idx);
                }

                return indexList;
            }, List<number>());

            return error.merge({ rowIndexes: indices });
        });

        return exceptionFromServer.set('errors', allFieldErrors) as DomainException;
    }

    static getExceptionMessage(errors: List<DomainFieldError>) {
        let fieldErrorsCount = 0;
        let generalErrorMsg = '';
        let singleFieldError = '';
        errors.toArray().forEach(error => {
            if (error.fieldName !== undefined && error.fieldName !== '') {
                // Field error
                fieldErrorsCount++;
                singleFieldError = resolveErrorMessage(error.message);
            } else {
                // General error
                generalErrorMsg += resolveErrorMessage(error.message) + ' \n';
            }
        });
        return fieldErrorsCount > 1
            ? 'You have ' + fieldErrorsCount + ' field errors. ' + generalErrorMsg
            : singleFieldError + ' ' + generalErrorMsg;
    }
}

interface IDomainFieldError {
    fieldName: string;
    message: string;
    newRowIndexes?: List<number>; // for drag and drop
    propertyId?: number;
    rowIndexes: List<number>;
    severity?: string;
}

export class DomainFieldError
    extends ImmutableRecord({
        message: undefined,
        fieldName: undefined,
        propertyId: undefined,
        severity: undefined,
        serverError: undefined,
        rowIndexes: List<number>(),
        newRowIndexes: undefined,
        extraInfo: undefined,
    })
    implements IDomainFieldError
{
    declare message: string;
    declare fieldName: string;
    declare propertyId?: number;
    declare severity?: string;
    declare serverError: boolean;
    declare rowIndexes: List<number>;
    declare newRowIndexes?: List<number>;
    declare extraInfo?: string;

    static fromJS(errors: any[], severityLevel: string): List<DomainFieldError> {
        let fieldErrors = List<DomainFieldError>();

        const hasErrors = errors.find(error => error.severity === SEVERITY_LEVEL_ERROR);

        for (let i = 0; i < errors.length; i++) {
            // stripping out server side warnings when there are errors
            if (errors[i].id === 'ServerWarning' && hasErrors) continue;

            // empty field name and property id comes in as "form" string from the server, resetting it to undefined here
            const fieldName = errors[i].id === 'form' && errors[i].field === 'form' ? undefined : errors[i].field;
            const propertyId =
                (errors[i].id === 'form' && errors[i].field === 'form') || errors[i].id < 1 ? undefined : errors[i].id;
            const severity = errors[i].severity ? errors[i].severity : severityLevel;

            const domainFieldError = new DomainFieldError({
                fieldName,
                propertyId,
                message: errors[i].message,
                extraInfo: errors[i].extraInfo,
                severity,
                serverError: true,
                rowIndexes: errors[i].rowIndexes ? errors[i].rowIndexes : List<number>(),
            });
            fieldErrors = fieldErrors.push(domainFieldError);
        }

        return fieldErrors;
    }
}

export type HeaderRenderer = (config: IAppDomainHeader) => any;

export interface IAppDomainHeader {
    domain: DomainDesign;
    domainIndex: number;
    modelDomains?: List<DomainDesign>;
    onAddField?: (fieldConfig: Partial<IDomainField>) => void;
    onChange?: (changes: List<IFieldChange>, index: number, expand: boolean) => void;
    onDomainChange?: (index: number, updatedDomain: DomainDesign) => void;
}

export type DomainPanelStatus = 'INPROGRESS' | 'TODO' | 'COMPLETE' | 'NONE';

export interface IDomainFormDisplayOptions {
    derivationDataScopeConfig?: IDerivationDataScope;
    disableMvEnabled?: boolean;
    domainKindDisplayName?: string;
    hideAddFieldsButton?: boolean;
    hideConditionalFormatting?: boolean;
    hideFilePropertyType?: boolean;
    hideImportAliases?: boolean;
    hideImportData?: boolean;
    hideImportExport?: boolean;
    hideInferFromFile?: boolean;
    hideRequired?: boolean;
    hideStudyPropertyTypes?: boolean;
    hideTextOptions?: boolean;
    hideValidators?: boolean;
    isDragDisabled?: boolean;
    phiLevelDisabled?: boolean;
    retainReservedFields?: boolean;
    showScannableOption?: boolean;
    showHitCriteria?: boolean;
    textChoiceLockedForDomain?: boolean;
    textChoiceLockedSqlFragment?: string;
}

export interface IDerivationDataScope {
    dataTypeFilter?: (type: PropDescType) => boolean;
    helpLinkNode?: ReactNode;
    labelAll?: string;
    labelChild?: string;
    labelParent?: string;
    scopeChangeWarning?: string;
    sectionTitle?: string;
    show?: boolean;
}

/**
 * General object to describe a DomainKind as received from Domain.getDomainDetails
 *
 * @property domainDesign The fields found on all items of this domain (e.g., copy per item)
 * @property options The fields and properties shared by this type (e.g., one copy) ('options' used to match existing LKS api)
 * @property domainKindName The name of the domainkind type this represents, currently supported can be found in Domain.KINDS
 */
export class DomainDetails extends ImmutableRecord({
    domainDesign: undefined,
    options: undefined,
    domainKindName: undefined,
    nameReadOnly: false,
    namePreviews: undefined,
}) {
    declare domainDesign: DomainDesign;
    declare options: Map<string, any>;
    declare domainKindName: string;
    declare nameReadOnly?: boolean;
    declare namePreviews?: string[];

    static create(rawDesign: Map<string, any> = Map(), domainKindType: string = Domain.KINDS.UNKNOWN): DomainDetails {
        let design;
        if (rawDesign) {
            const domainDesign = DomainDesign.create(rawDesign.get('domainDesign'));
            const domainKindName = rawDesign.get('domainKindName', domainKindType);
            const options = Map(rawDesign.get('options'));
            const nameReadOnly = rawDesign.get('nameReadOnly');
            const namePreviews = rawDesign.get('namePreviews');
            design = new DomainDetails({ domainDesign, domainKindName, options, nameReadOnly, namePreviews });
        } else {
            design = new DomainDetails({
                domainDesign: DomainDesign.create(null),
                domainKindName: domainKindType,
                options: Map<string, any>(),
            });
        }

        return design;
    }
}

export interface DomainFieldIndexChange {
    newIndex: number;
    originalIndex: number;
}

export interface BulkDeleteConfirmInfo {
    deletableSelectedFields: number[];
    undeletableFields: number[];
}

export interface NameExpressionsValidationResults {
    errors: string[];
    previews: string[];
    warnings: string[];
}

export interface SystemField {
    DataType: string;
    Description: string;
    Disableble: boolean;
    Enabled?: boolean;
    Label: string;
    Name: string;
    Required: boolean;
}
