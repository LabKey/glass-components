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
import classNames from "classnames";
import { List, Map } from 'immutable';
import { Ajax, Domain, Query, Security, Utils } from '@labkey/api';
import {
    DOMAIN_FIELD_CLIENT_SIDE_ERROR,
    DOMAIN_FIELD_LOOKUP_CONTAINER,
    DOMAIN_FIELD_LOOKUP_QUERY,
    DOMAIN_FIELD_LOOKUP_SCHEMA,
    DOMAIN_FIELD_PREFIX,
    DOMAIN_FIELD_SAMPLE_TYPE,
    DOMAIN_FIELD_TYPE,
    SEVERITY_LEVEL_ERROR,
    SEVERITY_LEVEL_WARN,
} from './constants';
import {
    decodeLookup,
    DomainDesign,
    DomainException,
    DomainField,
    DomainFieldError,
    DomainPanelStatus,
    IBannerMessage,
    IDomainField,
    IFieldChange,
    PROP_DESC_TYPES,
    QueryInfoLite,
    updateSampleField
} from './models';
import { Container, QueryColumn, SchemaDetails } from '../base/models/model';
import { naturalSort } from '../../util/utils';
import { processSchemas } from '../base/models/schemas';
import { buildURL } from '../../url/ActionURL';

let sharedCache = Map<string, Promise<any>>();

function cache<T>(prefix: string, key: string, miss: () => Promise<T>): Promise<T> {
    let cacheKey = [prefix, key].join('|');
    let promise = sharedCache.get(cacheKey);

    if (!promise) {
        promise = miss();
        sharedCache = sharedCache.set(cacheKey, promise);
    }

    return promise;
}

// TODO move these to lookups dir
export function fetchContainers(): Promise<List<Container>> {
    return cache<List<Container>>('container-cache', 'containers', () => (
        new Promise((resolve) => {
            let success: any = (data) => {
                resolve(processContainers(data));
            };

            Security.getContainers({
                containerPath: '/',
                includeSubfolders: true,
                includeEffectivePermissions: false,
                success
            });
        })
    ));
}

export function processContainers(payload: any, container?: Container): List<Container> {
    let containers = List<Container>();

    // Depth first
    if (container) {
        containers = containers.push(container);
    }

    payload.children.forEach((c) => {
        containers = containers
            .concat(processContainers(c, new Container(c)))
            .toList();
    });

    return containers;
}

/**
 * @param domainId: Fetch domain by Id. Priority param over schema and query name.
 * @param schemaName: Schema of domain.
 * @param queryName: Query of domain.
 * @return Promise wrapped Domain API call.
 */
export function fetchDomain(domainId: number, schemaName: string, queryName: string): Promise<DomainDesign> {
    return new Promise((resolve, reject) => {
        Domain.getDomainDetails({
            containerPath: LABKEY.container.path,
            domainId,
            schemaName,
            queryName,
            success: (data) => {
                resolve(DomainDesign.create(data.domainDesign ? data.domainDesign : data, undefined));
            },
            failure: (error) => {
                reject(error);
            }
        })
    });
}

//TODO Review if this is still needed
/**
 * @param domainId: Fetch domain by Id. Priority param over schema and query name.
 * @param schemaName: Schema of domain.
 * @param queryName: Query of domain.
 * @return Promise wrapped Domain API call.
 */
export function fetchDomainDetails(domainId: number, schemaName: string, queryName: string): Promise<DomainDesign> {
    return new Promise((resolve, reject) => {
        Domain.getDomainDetails({
            containerPath: LABKEY.container.path,
            domainId,
            schemaName,
            queryName,
            success: (data) => {
                resolve(DomainDesign.create(data, undefined));
            },
            failure: (error) => {
                reject(error);
            }
        })
    });
}

export function fetchQueries(containerPath: string, schemaName: string): Promise<List<QueryInfoLite>> {
    const key = [containerPath, schemaName].join('|').toLowerCase();

    return cache<List<QueryInfoLite>>('query-cache', key, () => (
        new Promise((resolve) => {
            if (schemaName) {
                Query.getQueries({
                    containerPath: containerPath || LABKEY.container.path,
                    schemaName,
                    queryDetailColumns: true,
                    success: (data) => {
                        resolve(processQueries(data));
                    }
                });
            }
            else {
                resolve(List());
            }
        })
    ));
}

export function processQueries(payload: any): List<QueryInfoLite> {
    if (!payload || !payload.queries) {
        return List();
    }

    return List<QueryInfoLite>(payload.queries.map((qi) => QueryInfoLite.create(qi, payload.schemaName)))
        .sort((a, b) => naturalSort(a.name, b.name))
        .toList();
}

export function fetchSchemas(containerPath: string): Promise<List<SchemaDetails>> {
    return cache<List<SchemaDetails>>('schema-cache', containerPath, () => (
        new Promise((resolve) => {
            Query.getSchemas({
                apiVersion: 17.1,
                containerPath: containerPath || LABKEY.container.path,
                includeHidden: false,
                success: (data) => {
                    resolve(handleSchemas(data));
                }
            })
        })
    ));
}

export function handleSchemas(payload: any): List<SchemaDetails> {
    return processSchemas(payload)
        .valueSeq()
        .sort((a, b) => naturalSort(a.fullyQualifiedName, b.fullyQualifiedName))
        .toList();
}

export function getMaxPhiLevel(): Promise<string> {
    return new Promise((resolve, reject) => {
        Ajax.request({
            url: buildURL('security', 'GetMaxPhiLevel.api'),
            success: Utils.getCallbackWrapper((response) => {
                resolve(response.maxPhiLevel);
            }),
            failure: Utils.getCallbackWrapper((error) => {
                reject(error);
            })
        });
    });
}

/**
 * @param domain: DomainDesign to save
 * @param kind: DomainKind if creating new Domain
 * @param options: Options for creating new Domain
 * @param name: Name of new Domain
 * @param includeWarnings: Set this to true if warnings are desired
 * @return Promise wrapped Domain API call.
 */
export function saveDomain(domain: DomainDesign, kind?: string, options?: any, name?: string, includeWarnings?: boolean) : Promise<DomainDesign> {
    return new Promise((resolve, reject) => {
        function successHandler(response) {
            resolve(DomainDesign.create(response));
        }

        function failureHandler(response) {
            if (!response.exception) {
                response = {exception: response};
            }

            if (!response.errors) {
                reject(response);
            }

            const exception = DomainException.create(response, SEVERITY_LEVEL_ERROR);
            const badDomain = setDomainException(domain, exception);
            reject(badDomain);
        }

        if (domain.domainId) {
            Domain.save({
                containerPath: LABKEY.container.path,
                domainId: domain.domainId,
                options,
                domainDesign: DomainDesign.serialize(domain),
                includeWarnings: includeWarnings,
                success: successHandler,
                failure: failureHandler
            })
        }
        else {
            Domain.create({
                containerPath: LABKEY.container.path,
                kind,
                options,
                domainDesign: DomainDesign.serialize(domain.set('name', name) as DomainDesign),
                success: successHandler,
                failure: failureHandler
            })
        }
    })
}

// This is used for testing
export function createFormInputName(name: string): string {
    return [DOMAIN_FIELD_PREFIX, name].join('-');
}

export function createFormInputId(name: string, domainIndex: number, rowIndex: number): string {
    return [DOMAIN_FIELD_PREFIX, name, domainIndex, rowIndex].join('-');
}

export function getNameFromId(id: string) : string {
    const parts = id.split('-');
    if (parts.length === 4) {
        return parts[1];
    }

    return undefined;
}

export function getIndexFromId(id: string): number {
    const parts = id.split('-');
    if (parts.length === 4) {
        return parseInt(parts[3]);
    }

    return -1;
}

export function createNewDomainField(domain: DomainDesign, fieldConfig: Partial<IDomainField> = {}): DomainField {
    // Issue 38771: if the domain has a defaultDefaultValueType and the fieldConfig doesn't include its own, use the defaultDefaultValueType
    if (domain.defaultDefaultValueType && !fieldConfig.defaultValueType) {
        fieldConfig.defaultValueType = domain.defaultDefaultValueType;
    }

    return DomainField.create(fieldConfig, true);
}

export function addDomainField(domain: DomainDesign, fieldConfig: Partial<IDomainField> = {}): DomainDesign {
    const newField = createNewDomainField(domain, fieldConfig);

    return domain.merge({
        fields: domain.fields.push(newField)
    }) as DomainDesign;
}

function updateErrorIndexes(removedFieldIndex: number, domainException: DomainException) {

    let errorsWithNewIndex = domainException.errors.map(error => {
        let newRowIndexes = error.rowIndexes.map((rowIndex) => {
            if (rowIndex > removedFieldIndex) {
                return rowIndex-1;
            }
        });
        return error.set("rowIndexes", newRowIndexes);
    });

    return domainException.set('errors', errorsWithNewIndex);
}

export function removeField(domain: DomainDesign, index: number): DomainDesign {

    domain = updateDomainException(domain, index, undefined);

    let newDomain = domain.merge({
        fields: domain.fields.delete(index)
    }) as DomainDesign;

    //"move up" the indexes of the fields with error, i.e. the fields that are below the removed field
    if (newDomain.hasException()) {
        return newDomain.set('domainException', updateErrorIndexes(index, newDomain.domainException)) as DomainDesign;
    }
    return newDomain;
}

/**
 *
 * @param domain: DomainDesign to update
 * @param changes: List of ids and values describing changes
 * @return copy of domain with updated fields
 */
export function handleDomainUpdates(domain: DomainDesign, changes: List<IFieldChange>): DomainDesign {
    let type;

    changes.forEach((change) => {
        type = getNameFromId(change.id);
        if (type === DOMAIN_FIELD_CLIENT_SIDE_ERROR)
        {
            domain = updateDomainException(domain, getIndexFromId(change.id), change.value);
        }
        else
        {
            domain = updateDomainField(domain, change)
        }
    });

    return domain;
}

export function updateDomainField(domain: DomainDesign, change: IFieldChange): DomainDesign {
    const type = getNameFromId(change.id);
    const index = getIndexFromId(change.id);

    let field = domain.fields.get(index);

    if (field) {
        let newField = field.set('updatedField', true) as DomainField;

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
                newField = updateSampleField(newField, change.value );
                break;
            case DOMAIN_FIELD_LOOKUP_QUERY:
                const { queryName, rangeURI } = decodeLookup(change.value);
                newField = newField.merge({
                    lookupQuery: queryName,
                    lookupQueryValue: change.value,
                    lookupType: newField.lookupType.set('rangeURI', rangeURI),
                    rangeURI
                }) as DomainField;
                break;
            default:
                newField = newField.set(type, change.value) as DomainField;
                break;
        }

        domain = domain.merge({
            fields: domain.fields.set(index, newField)
        }) as DomainDesign;
    }

    return domain;
}

function updateDataType(field: DomainField, value: any): DomainField {
    let propType = PROP_DESC_TYPES.find(pt => pt.name === value);

    if (propType) {
        const dataType = propType.isLookup() ? field.lookupType : propType;

        field = field.merge({
            dataType,
            conceptURI: dataType.conceptURI,
            rangeURI: dataType.rangeURI,
            lookupSchema: dataType.lookupSchema,
            lookupQuery: dataType.lookupQuery
        }) as DomainField;

        if (field.isNew()) {
            field = DomainField.updateDefaultValues(field);
        }
    }

    return field;
}

function updateLookup(field: DomainField, lookupContainer?: string, lookupSchema?: string): DomainField {
    return field.merge({
        lookupContainer,
        lookupQuery: undefined,
        lookupQueryValue: undefined,
        lookupSchema
    }) as DomainField;
}

export function clearFieldDetails(domain: DomainDesign): DomainDesign {
    return domain.merge({
        fields: domain.fields.map(f => f.set('updatedField', false)).toList()
    }) as DomainDesign;
}

export function getCheckedValue(evt) {
    if (evt.target.type === "checkbox") {
        return evt.target.checked;
    }

    return undefined;
}

export function clearAllClientValidationErrors(domain: DomainDesign): DomainDesign {
    let exception = undefined;

    if (domain.domainException) {
        const updatedErrors = domain.domainException.errors.filter((error) => (error.serverError || error.severity === SEVERITY_LEVEL_WARN));

        if (updatedErrors && updatedErrors.size > 0)
        {
            exception = domain.domainException.set('errors', updatedErrors);
        }
    }
    return domain.set("domainException", exception) as DomainDesign;
}

export function clearAllFieldErrors(domain: DomainDesign): DomainDesign {
    let exception = undefined;

    // Keep exception only errors as those are not related to the fields
    if (domain.hasException() && !domain.hasErrors()) {
        exception = domain.domainException;
    }
    return domain.set("domainException", exception) as DomainDesign;
}

function clearFieldError (domain: DomainDesign, rowIndex: any): List<DomainFieldError> {

    let allErrors = domain.domainException.get('errors');

    //filter errors where rowIndexes size > 2
    let filteredErrors = allErrors.filter(error => {

        if (error.rowIndexes.includes(rowIndex)) {
            return error.rowIndexes.size > 2;
        }
        return true;

    });

    //find an index of an error to remove from the list of errors
     return filteredErrors.map((error) => {
         return error.set('rowIndexes', error.rowIndexes.filter(idx => { return idx !== rowIndex }));
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

    //new error on a field at a given index
    if (domainFieldError)
    {
        //add incoming field error to a previously existing domainException object
        if (domain.hasException())
        {
            const updatedErrors = clearFieldError(domain, index); //clear previously present error on a given row index
            const newErrors = updatedErrors.push(domainFieldError);
            domainExceptionObj = domain.domainException.merge({errors: newErrors})
        }
        //domainException is not defined yet/doesn't have field errors, so create a new domainException object
        else
        {
            const exception = domainFieldError.fieldName + " : " + domainFieldError.message;
            const errors = List<DomainFieldError>().asMutable();
            errors.push(domainFieldError);

            domainExceptionObj = new DomainException({exception, success: undefined, severity: domainFieldError.severity, errors: errors.asImmutable(), domainName: domain.name});
        }
    }
    //no error on a field at a given index
    else {
        //clear out an old error on a field, ex. if the client side error is fixed on a field then its previous error needs to be cleared out from the error set
        if (domain && domain.hasException()) {

            const updatedErrors = clearFieldError(domain, index);

            //reset domainException obj with an updated set of errors
            if (updatedErrors && updatedErrors.size > 0) {

                const exception = updatedErrors.get(0).fieldName + " : " + updatedErrors.get(0).message; //create exception message based on the first error, to be consistent with how server side errors are created

                domainExceptionObj = new DomainException({exception, success: undefined, severity: updatedErrors.get(0).severity, errors: updatedErrors})
            }
            //previous/old error on an incoming field was the last error to clear out, so no more errors
            else {
                domainExceptionObj = undefined;
            }
        }
    }
    return domain.merge({
        domainException: domainExceptionObj
    }) as DomainDesign;
}

export function getBannerMessages(domain: any) : List<IBannerMessage> {
    if (domain && domain.hasException()) {
        let msgList = List<IBannerMessage>();

        const errMsg = getErrorBannerMessage(domain);
        if (errMsg !== undefined) {
            msgList = msgList.push({message: errMsg, messageType: 'danger'});
        }

        const warnMsg = getWarningBannerMessage(domain);
        if (warnMsg !== undefined) {
            msgList = msgList.push({message: warnMsg, messageType: 'warning'})
        }

        return msgList;
    }
    else {
        return List<IBannerMessage>();
    }
}

function getErrorBannerMessage (domain: any) : any {

    if (domain && domain.hasException()) {
        let errors = domain.domainException.get('errors').filter(e => {
            return e && (e.severity === SEVERITY_LEVEL_ERROR)
        });

        if (errors && errors.size > 0) {
            if (errors.size > 1) {
                return "Multiple fields contain issues that need to be fixed. Review the red highlighted fields above for more information.";
            }
            else {
                return errors.get(0).message;
            }
        }
    }
    return undefined;
}

function getWarningBannerMessage (domain: any) : any {

    if (domain && domain.hasException()) {
        let warnings = domain.domainException.get('errors').filter(e => {return e && (e.severity === SEVERITY_LEVEL_WARN)});

        if (warnings && warnings.size > 0) {
            if (warnings.size > 1) {
                return "Multiple fields may require your attention. Review the yellow highlighted fields above for more information.";
            }
            else {
                return (warnings.get(0).fieldName + " : " + warnings.get(0).message);
            }
        }
    }
    return undefined;
}

export function setDomainFields(domain: DomainDesign, fields: List<QueryColumn>): DomainDesign {
    return domain.merge({
        fields: fields.map((field) => {
            return DomainField.create({
                name: field.name,
                rangeURI: field.rangeURI
            });
        })
    }) as DomainDesign;
}

export function setDomainException(domain: DomainDesign, exception: DomainException) : DomainDesign {
    const exceptionWithRowIndexes = DomainException.addRowIndexesToErrors(domain, exception);
    const exceptionWithAllErrors = DomainException.mergeWarnings(domain, exceptionWithRowIndexes);
    return domain.set('domainException', (exceptionWithAllErrors ? exceptionWithAllErrors : exception)) as DomainDesign;
}

export function getSplitSentence(label: string, lastWord: boolean): string {

    if (!label)
        return undefined;

    const words = label.split(" ");

    if (lastWord) {
        if (words.length === 1) {
            return words[0];
        }
        else {
            return words[words.length - 1];
        }
    }
    else {
        if (words.length === 1) {
            return undefined;
        }
        else {
            return words.slice(0, words.length -1).join(" ") + " ";
        }
    }
}

export function getDomainPanelStatus(panelIndex: number, currentIndex: number, visitedPanels: List<number>, firstState: boolean): DomainPanelStatus {
    if (panelIndex === 0 && firstState) {
        return 'NONE';
    }
    else if (currentIndex === panelIndex) {
        return 'INPROGRESS';
    }
    else if (visitedPanels.contains(panelIndex)) {
        return 'COMPLETE';
    }

    return 'TODO';
}

export function getDomainBottomErrorMessage(exception: string, errorDomains: List<string>, validProperties: boolean, visitedPanels: List<number>): string {
    if (exception) {
        return exception;
    }
    else if (errorDomains.size > 1 || (errorDomains.size > 0 && !validProperties)) {
        return "Please correct errors above before saving.";
    }
    else if (visitedPanels.size > 0 && !validProperties) {
        return "Please correct errors in the properties panel before saving.";
    }
    else if (errorDomains.size == 1) {
        return "Please correct errors in " + errorDomains.get(0) + " before saving.";
    }

    return undefined;
}

export function getDomainPanelClass(collapsed: boolean, controlledCollapse: boolean, useTheme: boolean): string {
    return classNames('domain-form-panel', {
        'lk-border-theme-light': !collapsed && controlledCollapse && useTheme,
        'domain-panel-no-theme': !collapsed && controlledCollapse && !useTheme
    });
}

export function getDomainAlertClasses(collapsed: boolean, controlledCollapse: boolean, useTheme: boolean): string {
    return classNames('domain-bottom-alert panel-default', {
        'lk-border-theme-light': !collapsed && controlledCollapse && useTheme,
        'domain-bottom-alert-expanded': !collapsed && controlledCollapse && !useTheme,
        'domain-bottom-alert-top': !collapsed
    });
}

// This is kind of a hacky way to remove a class from core css so we can set the color of the panel hdr to match the theme
export function updateDomainPanelClassList(useTheme: boolean, domain: DomainDesign, id?: string) {
    if (useTheme) {
        const el = document.getElementById(getDomainPanelHeaderId(domain, id));
        if (el) {
            el.classList.remove("panel-heading");
        }
    }
}

export function getDomainPanelHeaderId(domain: DomainDesign, id?: string): string {
    if (domain && domain.name) {
        return createFormInputName(domain.name.replace(/\s/g, '-') + '-hdr');
    }

    return id || 'domain-header';
}

export function getDomainHeaderName(name?: string, headerTitle?: string, headerPrefix?: string): string {
    let updatedName = headerTitle || (name ? name : "Fields");

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
