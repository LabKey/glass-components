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
import classNames from 'classnames';
import { List, Map } from 'immutable';
import { Ajax, Domain, Experiment, Filter, Query, Security, Utils } from '@labkey/api';

import { processSchemas } from '../../query/utils';

import { SimpleResponse } from '../files/models';

import { ConceptModel, OntologyModel } from '../ontology/models';

import { isCalculatedFieldsEnabled, isCommunityDistribution } from '../../app/utils';

import { Container } from '../base/models/Container';
import { naturalSortByProperty } from '../../../public/sort';
import { SchemaDetails } from '../../SchemaDetails';
import { buildURL } from '../../url/AppURL';
import { QueryColumn } from '../../../public/QueryColumn';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { SCHEMAS } from '../../schemas';

import { caseInsensitive, handleRequestFailure } from '../../util/utils';

import { getExcludedDataTypeNames } from '../entities/actions';

import { getQueryDetails, selectRowsDeprecated } from '../../query/api';

import { selectRows } from '../../query/selectRows';

import { resolveErrorMessage } from '../../util/messaging';

import { IImportAlias } from '../entities/models';

import { DATA_CLASS_IMPORT_PREFIX, SAMPLE_SET_IMPORT_PREFIX } from '../entities/constants';

import {
    DOMAIN_ERROR_ID,
    DOMAIN_FIELD_CLIENT_SIDE_ERROR,
    DOMAIN_FIELD_LOOKUP_CONTAINER,
    DOMAIN_FIELD_LOOKUP_QUERY,
    DOMAIN_FIELD_LOOKUP_SCHEMA,
    DOMAIN_FIELD_ONTOLOGY_IMPORT_COL,
    DOMAIN_FIELD_ONTOLOGY_LABEL_COL,
    DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT,
    DOMAIN_FIELD_PRIMARY_KEY_LOCKED,
    DOMAIN_FIELD_SAMPLE_TYPE,
    DOMAIN_FIELD_TYPE,
    LOOKUP_VALIDATOR_VALUES,
    MAX_TEXT_LENGTH,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
} from './constants';
import {
    ATTACHMENT_TYPE,
    CALCULATED_TYPE,
    FILE_TYPE,
    FLAG_TYPE,
    ONTOLOGY_LOOKUP_TYPE,
    PARTICIPANT_TYPE,
    PROP_DESC_TYPES,
    PropDescType,
    SAMPLE_TYPE,
    SMILES_TYPE,
    TEXT_CHOICE_TYPE,
    UNIQUE_ID_TYPE,
    USERS_TYPE,
    VISIT_DATE_TYPE,
    VISIT_ID_TYPE,
    VISIT_LABEL_TYPE,
} from './PropDescType';
import {
    decodeLookup,
    DEFAULT_TEXT_CHOICE_VALIDATOR,
    DomainDesign,
    DomainDetails,
    DomainException,
    DomainField,
    DomainFieldError,
    DomainFieldIndexChange,
    DomainPanelStatus,
    IBannerMessage,
    IDomainField,
    IFieldChange,
    isValidTextChoiceValue,
    NameExpressionsValidationResults,
    PropertyValidator,
    QueryInfoLite,
    updateSampleField,
} from './models';
import { createFormInputId, createFormInputName, getIndexFromId, getNameFromId } from './utils';
import { DomainPropertiesAPIWrapper } from './APIWrapper';

let sharedCache = Map<string, Promise<any>>();

function cache<T>(prefix: string, key: string, miss: () => Promise<T>): Promise<T> {
    const cacheKey = [prefix, key].join('|');
    let promise = sharedCache.get(cacheKey);

    if (!promise) {
        promise = miss();
        sharedCache = sharedCache.set(cacheKey, promise);
    }

    return promise;
}

export function fetchContainers(): Promise<List<Container>> {
    return cache<List<Container>>(
        'container-cache',
        'containers',
        () =>
            new Promise((resolve, reject) => {
                Security.getContainers({
                    containerPath: '/',
                    includeSubfolders: true,
                    includeEffectivePermissions: false,
                    includeWorkbookChildren: false,
                    includeStandardProperties: false,
                    success: data => {
                        resolve(processContainers(data));
                    },
                    failure: error => {
                        console.error(error);
                        reject(error);
                    },
                });
            })
    );
}

export function processContainers(payload: any, container?: Container): List<Container> {
    let containers = List<Container>();

    // Depth first
    if (container) {
        containers = containers.push(container);
    }

    payload.children.forEach(c => {
        containers = containers.concat(processContainers(c, new Container(c))).toList();
    });

    return containers;
}

/**
 * @param domainId Fetch domain by Id. Priority param over schema and query name.
 * @param schemaName Schema of domain.
 * @param queryName Query of domain.
 * @param containerPath containerPath to use for domain details query.
 * @return Promise wrapped Domain API call.
 */
export function fetchDomain(
    domainId: number,
    schemaName: string,
    queryName: string,
    containerPath?: string
): Promise<DomainDesign> {
    return new Promise((resolve, reject) => {
        Domain.getDomainDetails({
            containerPath,
            domainId,
            schemaName,
            queryName,
            success: data => {
                resolve(DomainDesign.create(data.domainDesign ? data.domainDesign : data, undefined));
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}

export type FetchDomainDetailsOptions = Omit<Domain.GetDomainDetailsOptions, 'failure' | 'scope' | 'success'>;

export function fetchDomainDetails(options: FetchDomainDetailsOptions): Promise<DomainDetails> {
    return new Promise((resolve, reject) => {
        Domain.getDomainDetails({
            ...options,
            success: data => {
                resolve(DomainDetails.create(Map<string, any>({ ...data })));
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}

export function fetchQueries(containerPath: string, schemaName: string): Promise<QueryInfoLite[]> {
    const key = [containerPath, schemaName].join('|').toLowerCase();

    return cache<QueryInfoLite[]>(
        'query-cache',
        key,
        () =>
            new Promise(resolve => {
                if (schemaName) {
                    Query.getQueries({
                        containerPath,
                        schemaName,
                        queryDetailColumns: true,
                        success: data => {
                            resolve(processQueries(data));
                        },
                    });
                } else {
                    resolve(null);
                }
            })
    );
}

export function getRequiredParentTypes(
    query: SchemaQuery,
    containerPath?: string
): Promise<{ dataClasses: string[]; sampleTypes: string[] }> {
    return new Promise((resolve, reject) => {
        const { schemaName, queryName } = query;
        if (schemaName !== SCHEMAS.SAMPLE_SETS.SCHEMA && schemaName !== SCHEMAS.DATA_CLASSES.SCHEMA)
            resolve({
                sampleTypes: [],
                dataClasses: [],
            });

        Domain.getDomainDetails({
            containerPath,
            queryName,
            schemaName,
            success: response => {
                const domainDetails: DomainDetails = DomainDetails.create(Map(response));
                const importAliases: Record<string, IImportAlias> = domainDetails.options?.get('importAliases');
                const sampleTypes = [],
                    dataClasses = [];
                if (importAliases && Object.keys(importAliases).length > 0) {
                    Object.values(importAliases).forEach(alias => {
                        if (alias.required) {
                            const parentType = alias.inputType;
                            if (parentType.startsWith(DATA_CLASS_IMPORT_PREFIX)) {
                                dataClasses.push(parentType.replace(DATA_CLASS_IMPORT_PREFIX, ''));
                            } else if (parentType.startsWith(SAMPLE_SET_IMPORT_PREFIX)) {
                                sampleTypes.push(parentType.replace(SAMPLE_SET_IMPORT_PREFIX, ''));
                            }
                        }
                    });
                }
                resolve({
                    sampleTypes,
                    dataClasses,
                });
            },
            failure: response => {
                console.error(response);
                reject(response);
            },
        });
    });
}

// This looks hacky, but it's actually the recommended way to download a file using raw JS
export function downloadJsonFile(content: string, fileName: string): void {
    const downloadLink = document.createElement('a');
    downloadLink.href = 'data:application/json;charset=utf-8,' + encodeURIComponent(content);
    downloadLink.download = fileName;
    downloadLink.style.display = 'none';

    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
}

export function processQueries(payload: any): QueryInfoLite[] {
    if (!payload || !payload.queries) {
        return null;
    }

    return payload.queries.map(qi => QueryInfoLite.create(qi, payload.schemaName)).sort(naturalSortByProperty('name'));
}

export function fetchSchemas(containerPath: string): Promise<SchemaDetails[]> {
    return cache<SchemaDetails[]>(
        'schema-cache',
        containerPath,
        () =>
            new Promise(resolve => {
                Query.getSchemas({
                    apiVersion: 17.1,
                    containerPath,
                    includeHidden: false,
                    success: data => {
                        resolve(handleSchemas(data));
                    },
                });
            })
    );
}

export function getExcludedSchemaQueryNames(schemaName: string, queryContainerPath?: string): Promise<string[]> {
    switch (schemaName) {
        case 'assay':
            return getExcludedDataTypeNames(SCHEMAS.ASSAY_TABLES.ASSAY_LIST, 'AssayDesign', queryContainerPath);
        case 'samples':
        case 'exp.materials':
            return getExcludedDataTypeNames(SCHEMAS.EXP_TABLES.SAMPLE_SETS, 'SampleType', queryContainerPath);
        case 'exp.data':
            return getExcludedDataTypeNames(SCHEMAS.EXP_TABLES.DATA_CLASSES, 'DataClass', queryContainerPath);
    }
    return new Promise(resolve => {
        resolve([]);
    });
}

export function handleSchemas(payload: any): SchemaDetails[] {
    return processSchemas(payload).valueSeq().sort(naturalSortByProperty('fullyQualifiedName')).toArray();
}

export function getAvailableTypes(domain: DomainDesign, ontologies = []): List<PropDescType> {
    return PROP_DESC_TYPES.filter(type => _isAvailablePropType(type, domain, ontologies)).toList();
}

export async function getAvailableTypesForOntology(
    api: DomainPropertiesAPIWrapper,
    domain: DomainDesign
): Promise<List<PropDescType>> {
    const ontologies = await api.fetchOntologies(domain.container);
    return getAvailableTypes(domain, ontologies);
}

function _isAvailablePropType(type: PropDescType, domain: DomainDesign, ontologies: OntologyModel[]): boolean {
    if (type === FLAG_TYPE && !domain.allowFlagProperties) {
        return false;
    }

    if (type === FILE_TYPE && !domain.allowFileLinkProperties) {
        return false;
    }

    if (type === ATTACHMENT_TYPE && !domain.allowAttachmentProperties) {
        return false;
    }

    if (
        (type === VISIT_DATE_TYPE || type === VISIT_ID_TYPE || type === VISIT_LABEL_TYPE) &&
        !domain.allowTimepointProperties
    ) {
        return false;
    }

    if (type === ONTOLOGY_LOOKUP_TYPE && ontologies.length === 0) {
        return false;
    }

    if (type === UNIQUE_ID_TYPE && (isCommunityDistribution() || domain.domainKindName !== Domain.KINDS.SAMPLE_TYPE)) {
        return false;
    }

    if (type === TEXT_CHOICE_TYPE && !domain.allowTextChoiceProperties) {
        return false;
    }

    if ((type === SAMPLE_TYPE || type === PARTICIPANT_TYPE) && !domain.allowSampleSubjectProperties) {
        return false;
    }

    if (type === SMILES_TYPE) {
        return false;
    }

    if (type === USERS_TYPE && !domain.allowUserProperties) {
        return false;
    }

    if (type === CALCULATED_TYPE && (!isCalculatedFieldsEnabled() || !domain.allowCalculatedFields)) {
        return false;
    }

    return true;
}

export function fetchOntologies(containerPath?: string): Promise<OntologyModel[]> {
    return cache<OntologyModel[]>('ontologies-cache', containerPath, async () => {
        const result = await selectRows({
            columns: ['RowId', 'Name', 'Abbreviation'],
            containerPath,
            schemaQuery: new SchemaQuery('ontology', 'ontologies'),
            sort: 'Name',
        });
        return result.rows.map(OntologyModel.create);
    });
}

export function getMaxPhiLevel(containerPath?: string): Promise<string> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('security', 'getMaxPhiLevel.api', undefined, { container: containerPath }),
            success: Utils.getCallbackWrapper(response => {
                resolve(response.maxPhiLevel);
            }),
            failure: handleRequestFailure(reject),
        });
    });
}

// exported for jest testing
export function getCastStatement(key: string, type: string): string {
    switch (type) {
        case 'INTEGER':
        case 'SAMPLE':
        case 'USERS':
            return `CAST(1 AS INTEGER) AS "${key}"`;
        case 'DOUBLE':
        case 'DECIMAL (FLOATING POINT)':
        case 'VISITID':
            return `CAST(1.1 AS DOUBLE) AS "${key}"`;
        case 'BOOLEAN':
            return `CAST(TRUE AS BOOLEAN) AS "${key}"`;
        case 'DATETIME':
        case 'VISITDATE':
            return `CAST(CURDATE() AS TIMESTAMP) AS "${key}"`;
        case 'DATE':
            return `CAST(CURDATE() AS DATE) AS "${key}"`;
        case 'TIME':
            return `CAST('13:00' AS TIME) AS "${key}"`;
        default:
            return `CAST('Testing' AS VARCHAR) AS "${key}"`;
    }
}

export async function parseCalculatedColumn(
    expression: string,
    columnMap: Record<string, string>,
    phiColumns: string[],
    containerPath?: string
): Promise<{ error: string; type: string }> {
    if (!expression || expression?.trim()?.length === 0) {
        return { error: 'Error: an expression value is required.', type: undefined };
    }

    try {
        const sql =
            'SELECT\n' +
            expression +
            '\nFROM (SELECT ' +
            Object.keys(columnMap)
                .map(key => {
                    return getCastStatement(key, columnMap[key]);
                })
                .join(',\n') +
            ') AS x' +
            ' WHERE 1=0';

        await selectRowsDeprecated({
            schemaName: 'core',
            sql,
            includeTotalCount: false,
        });
    } catch (e) {
        return { error: _sanitizeParseCalculatedColumnError(e), type: undefined };
    }

    return _parseCalculatedColumn(expression, columnMap, phiColumns, containerPath);
}

function _sanitizeParseCalculatedColumnError(e: Record<string, string>): string {
    let error = resolveErrorMessage(e, 'data', undefined, undefined, undefined, true);
    if (error?.indexOf('ExecutingSelector; ') === 0) {
        error = error.substring(error.indexOf('; ') + 2);
    }
    if (error?.indexOf('Error on line ') === 0) {
        error = error.substring(error.indexOf(':') + 1);
    }
    if (error?.endsWith(': "Testing"')) {
        error = error.substring(0, error.lastIndexOf(': "Testing"'));
    }
    if (error?.endsWith("Syntax error near 'FROM'")) {
        error = 'Invalid expression syntax';
    }
    if (error === 'bad SQL grammar []') {
        error =
            'Invalid expression SQL. No operator matches the given name and argument types. You might need to add explicit type casts.';
    }
    return error;
}

export function _parseCalculatedColumn(
    expression: string,
    columnMap: Record<string, string>,
    phiColumns: string[],
    containerPath?: string
): Promise<{ error: string; type: string }> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('query', 'parseCalculatedColumn.api', undefined, { container: containerPath }),
            jsonData: {
                expression,
                columnMap,
                phiColumns,
            },
            success: Utils.getCallbackWrapper(response => {
                const type = response.jdbcType;
                const error = response.errors?.[0].msg;
                resolve({ error, type });
            }),
            failure: Utils.getCallbackWrapper(response => {
                reject(resolveErrorMessage(response));
            }),
        });
    });
}

export interface SaveDomainOptions {
    /** Boolean indicating if rowIndices should be added to the error message objects */
    addRowIndexes?: boolean;
    /** Container path where requests are made. Defaults to domain.container for updates. */
    containerPath?: string;
    /** DomainDesign to save */
    domain: DomainDesign;
    /** Set this to true if warnings are desired */
    includeWarnings?: boolean;
    /** DomainKind if creating new Domain */
    kind?: string;
    /** Name of new Domain */
    name?: string;
    /** Options for creating new Domain */
    options?: any;
    /** Original DomainDesign (before filtering out of locked/mapped fields), to be used for addRowIndexes = true */
    originalDomain?: DomainDesign;
}

export function saveDomain(options: SaveDomainOptions): Promise<DomainDesign> {
    return new Promise((resolve, reject) => {
        const { addRowIndexes, containerPath, domain, includeWarnings, kind, name, originalDomain } = options;
        function successHandler(response): void {
            resolve(DomainDesign.create(response));
        }

        function failureHandler(response): void {
            console.error(response);

            if (!response.exception) {
                response = { exception: response };
            }

            if (!response.errors) {
                reject(response);
            }

            const exception = DomainException.create(response, SEVERITY_LEVEL_ERROR);
            const badDomain = setDomainException(domain, exception, addRowIndexes, originalDomain);
            reject(badDomain);
        }

        if (domain.domainId) {
            Domain.save({
                containerPath: containerPath ?? domain.container,
                domainId: domain.domainId,
                domainDesign: DomainDesign.serialize(domain),
                includeWarnings,
                options: options.options,
                success: successHandler,
                failure: failureHandler,
            });
        } else {
            Domain.create({
                containerPath,
                domainDesign: DomainDesign.serialize(domain.set('name', name) as DomainDesign),
                kind,
                options: options.options,
                success: successHandler,
                failure: failureHandler,
            });
        }
    });
}

/**
 * @param domain DomainDesign to save
 * @param kind DomainKind if creating new Domain
 * @param options Options for creating new Domain
 * @param includeNamePreview
 * @return Promise wrapped Domain API call.
 */
export function validateDomainNameExpressions(
    domain: DomainDesign,
    kind?: string,
    options?: any,
    includeNamePreview?: boolean
): Promise<NameExpressionsValidationResults> {
    return new Promise((resolve, reject) => {
        Domain.validateNameExpressions({
            containerPath: domain.container,
            options,
            domainDesign: DomainDesign.serialize(domain),
            kind,
            includeNamePreview,
            success: response => {
                resolve({ errors: response.errors, previews: response.previews, warnings: response.warnings });
            },
            failure: error => {
                console.error(error);
                reject(error);
            },
        });
    });
}

export function createNewDomainField(domain: DomainDesign, fieldConfig: Partial<IDomainField> = {}): DomainField {
    // Issue 38771: if the domain has a defaultDefaultValueType and the fieldConfig doesn't include its own, use the
    // defaultDefaultValueType
    if (domain.defaultDefaultValueType && !fieldConfig.defaultValueType) {
        fieldConfig.defaultValueType = domain.defaultDefaultValueType;
    }

    return DomainField.create(fieldConfig, true);
}

export async function mergeDomainFields(domain: DomainDesign, newFields: List<DomainField>): Promise<DomainDesign> {
    const newFields_ = [];
    for (let i = 0; i < newFields.size; i++) {
        const field = newFields.get(i);
        if (field.lookupQuery) {
            try {
                // Issue 48240: lookupIsValid during JSON fields import if we can find the queryDetails, otherwise set
                // to false in catch
                await getQueryDetails({
                    containerPath: field.lookupContainer,
                    schemaQuery: new SchemaQuery(field.lookupSchema, field.lookupQuery),
                });
                newFields_.push(field.merge({ lookupIsValid: true }) as DomainField);
            } catch (e) {
                newFields_.push(field.merge({ lookupIsValid: false }) as DomainField);
            }
        } else {
            newFields_.push(field);
        }
    }

    return domain.set('fields', domain.fields.concat(newFields_)) as DomainDesign;
}

export function processJsonImport(content: string, domain: DomainDesign): SimpleResponse {
    const domainType = domain.domainKindName;
    const emptinessError = {
        success: false,
        msg: 'No field definitions were found in the imported json file. Please check the file contents and try again.',
    };

    if (content == '') {
        return emptinessError;
    }

    const jsFields = JSON.parse(content as string);

    if (jsFields.length < 1 || Object.keys(jsFields).length === 0) {
        return emptinessError;
    }

    for (let i = 0; i < jsFields.length; i++) {
        const field = jsFields[i];

        if (
            field.defaultValueType &&
            domain.defaultValueOptions.size > 0 &&
            !domain.hasDefaultValueOption(field.defaultValueType)
        ) {
            return {
                success: false,
                msg: `Error on importing field '${field.name}': Default value type '${field.defaultValueType}' is invalid.`,
            };
        }

        if (!domainType?.includes('List') && field.lockType === DOMAIN_FIELD_PRIMARY_KEY_LOCKED) {
            return {
                success: false,
                msg: `Error on importing field '${field.name}': ${
                    domainType || 'This'
                } domain type does not support fields with an externally defined Primary Key.`,
            };
        }

        // These values are set server-side during a save
        if (field.propertyId) {
            delete field.propertyId;
        }
        if (field.propertyURI) {
            delete field.propertyURI;
        }
    }

    const tsFields: List<DomainField> = List(jsFields.map(field => DomainField.create(field, false)));
    return { success: true, fields: tsFields };
}

export function handleSystemFieldUpdates(domain: DomainDesign, field: string, enable: boolean): DomainDesign {
    const disabledSystemFields = domain.disabledSystemFields ? [...domain.disabledSystemFields] : [];
    const disabledFieldNamesLc = disabledSystemFields.map(f => f.toLowerCase());
    const fieldInd = disabledFieldNamesLc.indexOf(field.toLowerCase());
    if (enable && fieldInd > -1) disabledSystemFields.splice(fieldInd, 1);
    else if (!enable && fieldInd === -1) disabledSystemFields.push(field);

    return domain.merge({ disabledSystemFields }) as DomainDesign;
}

export function addDomainField(domain: DomainDesign, fieldConfig: Partial<IDomainField> = {}): DomainDesign {
    const newField = createNewDomainField(domain, fieldConfig);

    return domain.merge({
        fields: domain.fields.push(newField),
    }) as DomainDesign;
}

// Given sequence of field indexes that have existing errors, 'rowIndex', and
// array of indexes of removed fields, 'removedFieldIndexes' we must update each
// rowIndex based on if its position has been affected by a deleted field.
// Eg, rowIndex set [1, 4, 7, 8] with removedFieldIndexes [2, 5] becomes [1, 3, 5, 6].
export function updateErrorIndexes(removedFieldIndexes: number[], domainException: DomainException) {
    const errorsWithNewIndexes = domainException.errors.map(error => {
        const newRowIndexes = error.rowIndexes.map(rowIndex => {
            for (let i = 0; i < removedFieldIndexes.length; i++) {
                if (i !== removedFieldIndexes.length && removedFieldIndexes[i + 1] < rowIndex) {
                    continue;
                } else if (rowIndex > removedFieldIndexes[i]) {
                    return rowIndex - (i + 1);
                } else {
                    return rowIndex;
                }
            }
        });
        return error.set('rowIndexes', newRowIndexes);
    });
    return domainException.set('errors', errorsWithNewIndexes);
}

export function removeFields(domain: DomainDesign, deletableSelectedFields: number[]): DomainDesign {
    // Removes from domain.domainException errors belonging to removed fields, and also clears domainException if
    // a removed field was the final field with any error
    deletableSelectedFields.forEach(value => {
        domain = updateDomainException(domain, value, undefined);
    });

    const newFields = domain.fields.filter((_, i) => !deletableSelectedFields.includes(i));
    const updatedDomain = domain.merge({
        fields: newFields,
    }) as DomainDesign;

    // "move up" the indexes of the fields with error, i.e. the fields that are below the removed fields
    if (updatedDomain.hasException()) {
        return updatedDomain.set(
            'domainException',
            updateErrorIndexes(deletableSelectedFields, updatedDomain.domainException)
        ) as DomainDesign;
    } else {
        return updatedDomain;
    }
}

export function handleDomainUpdates(domain: DomainDesign, changes: List<IFieldChange>): DomainDesign {
    changes.forEach(change => {
        if (getNameFromId(change.id) === DOMAIN_FIELD_CLIENT_SIDE_ERROR) {
            domain = updateDomainException(domain, getIndexFromId(change.id), change.value);
        } else {
            domain = updateDomainField(domain, change);
        }
    });

    return domain;
}

export function updateDomainField(domain: DomainDesign, change: IFieldChange): DomainDesign {
    const type = getNameFromId(change.id);
    const index = getIndexFromId(change.id);

    const field = domain.fields.get(index);

    if (field) {
        const isSelection = type === 'selected';
        let newField = isSelection ? field : (field.set('updatedField', true) as DomainField);

        switch (type) {
            case DOMAIN_FIELD_TYPE:
                newField = updateDataType(newField, change.value);
                break;
            case DOMAIN_FIELD_LOOKUP_CONTAINER:
                newField = updateLookup(newField, change.value);
                break;
            case DOMAIN_FIELD_LOOKUP_SCHEMA:
                newField = updateLookup(newField, newField.lookupContainer, change.value);
                break;
            case DOMAIN_FIELD_SAMPLE_TYPE:
                newField = updateSampleField(newField, change.value);
                break;
            case DOMAIN_FIELD_LOOKUP_QUERY:
                const { queryName, rangeURI } = decodeLookup(change.value);
                newField = newField.merge({
                    lookupQuery: queryName,
                    lookupQueryValue: change.value,
                    lookupType: newField.lookupType.set('rangeURI', rangeURI),
                    rangeURI,
                    lookupIsValid: true,
                }) as DomainField;
                break;
            case DOMAIN_FIELD_ONTOLOGY_PRINCIPAL_CONCEPT:
                const concept = change.value as ConceptModel;
                newField = newField.merge({ principalConceptCode: concept?.code }) as DomainField;
                break;
            default:
                newField = newField.set(type, change.value) as DomainField;
                break;
        }

        domain = domain.merge({
            fields: domain.fields.set(index, newField),
        }) as DomainDesign;
    }

    return domain;
}

// exported for jest testing
export function updateDataType(field: DomainField, value: any): DomainField {
    const propType = PROP_DESC_TYPES.find(pt => pt.name === value);

    if (propType) {
        const dataType = propType.isLookup() ? field.lookupType : propType;

        field = field.merge({
            dataType,
            conceptURI: dataType.conceptURI,
            rangeURI: dataType.rangeURI,
            lookupSchema: dataType.lookupSchema,
            lookupQuery: dataType.lookupQuery,
            sourceOntology: undefined,
            conceptSubtree: undefined,
            conceptLabelColumn: undefined,
            conceptImportColumn: undefined,
            scannable: undefined,
            textChoiceValidator: undefined,
            valueExpression: undefined,
        }) as DomainField;

        if (field.isNew()) {
            field = DomainField.updateDefaultValues(field);
        } else if (dataType === SAMPLE_TYPE) {
            // Issue 49005: set default lookup schema/query for change to Sample data type
            field = field.merge(DomainField.resolveLookupConfig(field, dataType)) as DomainField;
        }

        if (field.isTextChoiceField()) {
            // when changing a field to a Text Choice, add the default textChoiceValidator and
            // remove/reset all other propertyValidators and other text option settings
            field = field.merge({
                textChoiceValidator: DEFAULT_TEXT_CHOICE_VALIDATOR,
                lookupValidator: undefined,
                rangeValidators: [],
                regexValidators: [],
                scale: MAX_TEXT_LENGTH,
            }) as DomainField;
        } else if (field.isCalculatedField()) {
            field = field.merge({
                importAliases: undefined,
                principalConceptCode: undefined,
                regexValidators: [],
                uniqueConstraint: false,
                PHI: undefined,
            }) as DomainField;
        } else {
            field = field.merge({
                lookupValidator: PropDescType.isUser(value)
                    ? new PropertyValidator(LOOKUP_VALIDATOR_VALUES)
                    : undefined,
            }) as DomainField;
        }
    }

    return field;
}

function updateLookup(field: DomainField, lookupContainer?: string, lookupSchema?: string): DomainField {
    return field.merge({
        lookupContainer,
        lookupQuery: undefined,
        lookupQueryValue: undefined,
        lookupSchema,
        lookupIsValid: true,
    }) as DomainField;
}

export function clearFieldDetails(domain: DomainDesign): DomainDesign {
    return domain.merge({
        fields: domain.fields.map(f => f.set('updatedField', false)).toList(),
    }) as DomainDesign;
}

export function getCheckedValue(evt) {
    if (evt.target.type === 'checkbox') {
        return evt.target.checked;
    }

    return undefined;
}

export function clearAllClientValidationErrors(domain: DomainDesign): DomainDesign {
    let exception;

    if (domain.domainException) {
        const updatedErrors = domain.domainException.errors.filter(
            error => error.serverError || error.severity === SEVERITY_LEVEL_WARN
        );

        if (updatedErrors && updatedErrors.size > 0) {
            exception = domain.domainException.set('errors', updatedErrors);
        }
    }
    return domain.set('domainException', exception) as DomainDesign;
}

export function clearAllFieldErrors(domain: DomainDesign): DomainDesign {
    let exception;

    // Keep exception only errors as those are not related to the fields
    if (domain.hasException() && !domain.hasErrors()) {
        exception = domain.domainException;
    }
    return domain.set('domainException', exception) as DomainDesign;
}

function clearFieldError(domain: DomainDesign, rowIndex: any): List<DomainFieldError> {
    const allErrors = domain.domainException.get('errors');

    // filter errors where rowIndexes size > 2
    const filteredErrors = allErrors.filter(error => {
        if (error.rowIndexes.includes(rowIndex)) {
            return error.rowIndexes.size > 2;
        }
        return true;
    });

    // find an index of an error to remove from the list of errors
    return filteredErrors.map(error => {
        return error.set(
            'rowIndexes',
            error.rowIndexes.filter(idx => {
                return idx !== rowIndex;
            })
        );
    });
}

/**
 *
 * @param domain: DomainDesign to update with Field level error, in this case, set DomainException property which will carry field level error
 * @param index: Domain field index
 * @param domainFieldError: Field level error with message and severity
 * @return copy of domain with exception set on a field
 */
export function updateDomainException(domain: DomainDesign, index: any, domainFieldError: any): DomainDesign {
    let domainExceptionObj;

    // new error on a field at a given index
    if (domainFieldError) {
        // add incoming field error to a previously existing domainException object
        if (domain.hasException()) {
            const updatedErrors = clearFieldError(domain, index); // clear previously present error on a given row index
            const newErrors = updatedErrors.push(domainFieldError);
            domainExceptionObj = domain.domainException.merge({ errors: newErrors });
        }
        // domainException is not defined yet/doesn't have field errors, so create a new domainException object
        else {
            const exception = domainFieldError.fieldName + ' : ' + domainFieldError.message;
            const errors = List<DomainFieldError>().asMutable();
            errors.push(domainFieldError);

            domainExceptionObj = new DomainException({
                exception,
                success: undefined,
                severity: domainFieldError.severity,
                errors: errors.asImmutable(),
                domainName: domain.name,
            });
        }
    }
    // no error on a field at a given index
    else {
        // clear out an old error on a field, ex. if the client side error is fixed on a field then its previous error needs to be cleared out from the error set
        if (domain && domain.hasException()) {
            const updatedErrors = clearFieldError(domain, index);

            // reset domainException obj with an updated set of errors
            if (updatedErrors && updatedErrors.size > 0) {
                const exception = updatedErrors.get(0).fieldName + ' : ' + updatedErrors.get(0).message; // create exception message based on the first error, to be consistent with how server side errors are created

                domainExceptionObj = new DomainException({
                    exception,
                    success: undefined,
                    severity: updatedErrors.get(0).severity,
                    errors: updatedErrors,
                });
            }
            // previous/old error on an incoming field was the last error to clear out, so no more errors
            else {
                domainExceptionObj = undefined;
            }
        }
    }
    return domain.merge({
        domainException: domainExceptionObj,
    }) as DomainDesign;
}

export function getBannerMessages(domain: any): List<IBannerMessage> {
    if (domain && domain.hasException()) {
        let msgList = List<IBannerMessage>();

        const errMsg = getErrorBannerMessage(domain);
        if (errMsg !== undefined) {
            msgList = msgList.push({ message: errMsg, messageType: 'danger' });
        }

        const warnMsg = getWarningBannerMessage(domain);
        if (warnMsg !== undefined) {
            msgList = msgList.push({ message: warnMsg, messageType: 'warning' });
        }

        return msgList;
    } else {
        return List<IBannerMessage>();
    }
}

function getErrorBannerMessage(domain: any): any {
    if (domain && domain.hasException()) {
        const errors = domain.domainException.get('errors').filter(e => {
            return e && e.severity === SEVERITY_LEVEL_ERROR;
        });

        if (errors && errors.size > 0) {
            if (errors.size > 1) {
                return 'Multiple fields contain issues that need to be fixed. Review the red highlighted fields above for more information.';
            } else {
                return errors.get(0).message;
            }
        }
    }
    return undefined;
}

function getWarningBannerMessage(domain: any): any {
    if (domain && domain.hasException()) {
        const warnings = domain.domainException.get('errors').filter(e => {
            return e && e.severity === SEVERITY_LEVEL_WARN;
        });

        if (warnings && warnings.size > 0) {
            if (warnings.size > 1) {
                return 'Multiple fields may require your attention. Review the yellow highlighted fields above for more information.';
            } else {
                return warnings.get(0).fieldName + ' : ' + warnings.get(0).message;
            }
        }
    }
    return undefined;
}

export function setDomainFields(domain: DomainDesign, fields: List<QueryColumn>): DomainDesign {
    return domain.merge({
        fields: fields.map(field => {
            return DomainField.create({
                name: field.name,
                rangeURI: field.rangeURI,
            });
        }),
    }) as DomainDesign;
}

export function setDomainException(
    domain: DomainDesign,
    exception: DomainException,
    addRowIndexes = true,
    originalDomain?: DomainDesign
): DomainDesign {
    const exceptionWithRowIndexes = addRowIndexes
        ? DomainException.addRowIndexesToErrors(originalDomain ?? domain, exception)
        : exception;
    const exceptionWithAllErrors = DomainException.mergeWarnings(domain, exceptionWithRowIndexes);
    return domain.set('domainException', exceptionWithAllErrors ? exceptionWithAllErrors : exception) as DomainDesign;
}

export function getSplitSentence(label: string, lastWord: boolean): string {
    if (!label) return undefined;

    const words = label.split(' ');

    if (lastWord) {
        if (words.length === 1) {
            return words[0];
        } else {
            return words[words.length - 1];
        }
    } else {
        if (words.length === 1) {
            return undefined;
        } else {
            return words.slice(0, words.length - 1).join(' ') + ' ';
        }
    }
}

export function getDomainPanelStatus(
    panelIndex: number,
    currentIndex: number,
    visitedPanels: List<number>,
    firstState: boolean
): DomainPanelStatus {
    if (panelIndex === 0 && firstState) {
        return 'NONE';
    } else if (currentIndex === panelIndex) {
        return 'INPROGRESS';
    } else if (visitedPanels.contains(panelIndex)) {
        return 'COMPLETE';
    }

    return 'TODO';
}

export function getDomainBottomErrorMessage(
    exception: string,
    errorDomains: List<string>,
    validProperties: boolean,
    visitedPanels: List<number>
): string {
    if (exception) {
        return exception;
    } else if (errorDomains.size > 1 || (errorDomains.size > 0 && !validProperties)) {
        return 'Please correct errors above before saving.';
    } else if (visitedPanels.size > 0 && !validProperties) {
        return 'Please correct errors in the properties panel before saving.';
    } else if (errorDomains.size == 1) {
        return 'Please correct errors in ' + errorDomains.get(0) + ' before saving.';
    }

    return undefined;
}

// TODO: instead of setting a class based on isApp we should have generic collapsed/expanded classes and do all of the
//  app/LKS specific stuff in CSS, not JS. We can set a top level modifier class on BaseDomainDesigner indicate we're in
//  an app/LKS e.g. domain-designer--app, domain-designer--lks, then we can get rid of these methods and use the same
//  classNames everywhere
export function getDomainPanelClass(collapsed: boolean, controlledCollapse: boolean, isApp: boolean): string {
    return classNames('panel', 'panel-default', 'domain-form-panel', {
        'lk-border-theme-light': !collapsed && controlledCollapse && !isApp,
        'domain-panel-no-theme': !collapsed && controlledCollapse && isApp,
    });
}

export function getDomainAlertClasses(collapsed: boolean, controlledCollapse: boolean, isApp: boolean): string {
    return classNames('domain-bottom-alert panel-default', {
        'lk-border-theme-light': !collapsed && controlledCollapse && !isApp,
        'domain-bottom-alert-expanded': !collapsed && controlledCollapse && isApp,
        'domain-bottom-alert-top': !collapsed,
    });
}

export function getDomainPanelHeaderId(domain: DomainDesign, id?: string): string {
    if (domain && domain.name) {
        return createFormInputName(domain.name.replace(/\s/g, '-') + '-hdr');
    }

    return id || 'domain-header';
}

export function getDomainHeaderName(name?: string, headerTitle?: string, headerPrefix?: string): string {
    let updatedName = headerTitle || (name ? name : 'Fields');

    // optionally trim off a headerPrefix from the name display
    if (headerPrefix && updatedName.indexOf(headerPrefix + ' ') === 0) {
        updatedName = updatedName.replace(headerPrefix + ' ', '');
    }

    // prefer "Results Fields" over "Data Fields"in assay case
    if (updatedName.endsWith('Data Fields')) {
        updatedName = updatedName.replace('Data Fields', 'Results Fields');
    }

    return updatedName;
}

export function getUpdatedVisitedPanelsList(visitedPanels: List<number>, index: number): List<number> {
    let updatedVisitedPanels = visitedPanels.merge([0]);
    if (!updatedVisitedPanels.contains(index)) {
        updatedVisitedPanels = updatedVisitedPanels.push(index);
    }

    return updatedVisitedPanels;
}

function updateOntologyDomainCols(
    fieldIndex: number,
    domainIndex: number,
    updatedDomain: DomainDesign,
    origDomain: DomainDesign,
    removedFieldIndexes: DomainFieldIndexChange[],
    domainFieldType: string,
    domainFieldName: string
): DomainDesign {
    const id = createFormInputId(domainFieldType, domainIndex, fieldIndex);
    const [changed, value] = getOntologyUpdatedFieldName(
        domainFieldName,
        updatedDomain,
        origDomain,
        removedFieldIndexes
    );

    if (changed) {
        updatedDomain = updateDomainField(updatedDomain, { id, value });
    }

    return updatedDomain;
}

export function updateOntologyFieldProperties(
    fieldIndex: number,
    domainIndex: number,
    updatedDomain: DomainDesign,
    origDomain: DomainDesign,
    removedFieldIndexes: DomainFieldIndexChange[]
): DomainDesign {
    // make sure it is still an ontology lookup data type field before changing anything
    const ontField = updatedDomain.fields.get(fieldIndex);
    if (ontField.dataType.isOntologyLookup()) {
        // if the concept field prop is set and the field's name or data type has changed, update it based on the updatedDomain
        if (ontField.conceptImportColumn) {
            updatedDomain = updateOntologyDomainCols(
                fieldIndex,
                domainIndex,
                updatedDomain,
                origDomain,
                removedFieldIndexes,
                DOMAIN_FIELD_ONTOLOGY_IMPORT_COL,
                ontField.conceptImportColumn
            );
        }

        if (ontField.conceptLabelColumn) {
            updatedDomain = updateOntologyDomainCols(
                fieldIndex,
                domainIndex,
                updatedDomain,
                origDomain,
                removedFieldIndexes,
                DOMAIN_FIELD_ONTOLOGY_LABEL_COL,
                ontField.conceptLabelColumn
            );
        }
    }
    return updatedDomain;
}

// get the new/updated field name for the ontology related property
// if it has been removed or changed to a non-string data type, return undefined
export function getOntologyUpdatedFieldName(
    propFieldName: string,
    updatedDomain: DomainDesign,
    origDomain: DomainDesign,
    removedFieldIndexes: DomainFieldIndexChange[]
): [boolean, string] {
    // Check if field name and/or index have changed
    let origFieldIndex = origDomain.findFieldIndexByName(propFieldName);
    const updateFieldIndex = updatedDomain.findFieldIndexByName(propFieldName);
    const originalPropField = origDomain.fields.get(origFieldIndex);

    // check for a field removal prior to the ontology lookup field
    const propFieldRemoved = removedFieldIndexes
        ? removedFieldIndexes.some(
              removedField => removedField.originalIndex === origFieldIndex && removedField.newIndex === undefined
          )
        : !!removedFieldIndexes;

    if (removedFieldIndexes) {
        removedFieldIndexes.sort((a, b) => a.originalIndex - b.originalIndex);
        for (let i = 0; i < removedFieldIndexes.length; i++) {
            if (i + 1 < removedFieldIndexes.length && removedFieldIndexes[i + 1].originalIndex < origFieldIndex) {
                continue;
            } else if (origFieldIndex > removedFieldIndexes[i].originalIndex) {
                origFieldIndex = origFieldIndex - (i + 1);
            }
        }
    }

    const updatedPropField = updatedDomain.fields.get(origFieldIndex);
    const fieldChanged =
        propFieldRemoved ||
        origFieldIndex !== updateFieldIndex ||
        originalPropField.rangeURI !== updatedPropField?.rangeURI;

    return [
        fieldChanged,
        !propFieldRemoved && updatedPropField.dataType.isString() ? updatedPropField.name : undefined,
    ];
}

export function getDomainNamePreviews(
    schemaQuery?: SchemaQuery,
    domainId?: number,
    containerPath?: string
): Promise<string[]> {
    return new Promise((resolve, reject) => {
        return Domain.getDomainNamePreviews({
            containerPath,
            domainId,
            queryName: schemaQuery?.queryName,
            schemaName: schemaQuery?.schemaName,
            success: response => {
                resolve(response['previews']);
            },
            failure: response => {
                console.error('Failed to retrieve name expression previews', response);
                reject(response);
            },
        });
    });
}

export async function getTextChoiceInUseValues(
    field: DomainField,
    schemaName: string,
    queryName: string,
    lockedSqlFragment: string
): Promise<Record<string, any>> {
    const containerFilter = Query.ContainerFilter.allInProjectPlusShared; // to account for a shared domain at project or /Shared
    const fieldName = field.original?.name ?? field.name;

    // If the field is set as PHI, we need the query to include the RowId for logging, so we have to do the aggregate client side
    if (field.isPHI()) {
        const result = await selectRows({
            columns: ['RowId', 'SampleState/StatusType', fieldName],
            containerFilter,
            filterArray: [Filter.create(fieldName, undefined, Filter.Types.NONBLANK)],
            maxRows: -1,
            schemaQuery: new SchemaQuery(schemaName, queryName),
        });

        const values = {};
        result.rows.forEach(row => {
            const value = row[fieldName]?.value;
            if (isValidTextChoiceValue(value)) {
                if (!values[value]) {
                    values[value] = { count: 0, locked: false };
                }
                values[value].count++;
                values[value].locked =
                    values[value].locked || caseInsensitive(row, 'SampleState/StatusType').value === 'Locked';
            }
        });
        return values;
    }

    return new Promise((resolve, reject) => {
        Query.executeSql({
            containerFilter,
            schemaName,
            sql: `SELECT "${fieldName}", ${lockedSqlFragment} AS IsLocked, COUNT(*) AS RowCount FROM "${queryName}" WHERE "${fieldName}" IS NOT NULL GROUP BY "${fieldName}"`,
            success: response => {
                const values = response.rows
                    .filter(row => isValidTextChoiceValue(row[fieldName]))
                    .reduce((prev, current) => {
                        prev[current[fieldName]] = {
                            count: current['RowCount'],
                            locked: current['IsLocked'] === 1,
                        };
                        return prev;
                    }, {});

                resolve(values);
            },
            failure: error => {
                console.error('Error fetching distinct values for the text field: ', error);
                reject(error);
            },
        });
    });
}

export function getGenId(rowId: number, kindName: 'SampleSet' | 'DataClass', containerPath?: string): Promise<number> {
    return new Promise((resolve, reject) => {
        Experiment.getEntitySequence({
            containerPath,
            rowId,
            kindName,
            seqType: 'genId',
            success: response => {
                if (response.success) {
                    resolve(response['value']);
                } else {
                    reject({ error: 'Unable to get genId' });
                }
            },
            failure: error => {
                reject(error);
            },
        });
    });
}

export function setGenId(
    rowId: number,
    kindName: 'SampleSet' | 'DataClass',
    genId: number,
    containerPath?: string
): Promise<any> {
    return new Promise((resolve, reject) => {
        return Experiment.setEntitySequence({
            containerPath,
            rowId,
            kindName,
            newValue: genId,
            seqType: 'genId',
            success: response => {
                if (response.success) {
                    resolve(response);
                } else {
                    reject({ error: response.error });
                }
            },
            failure: response => {
                reject(response);
            },
        });
    });
}

export function scrollDomainErrorIntoView(): void {
    document.querySelector('#' + DOMAIN_ERROR_ID)?.scrollIntoView();
}
