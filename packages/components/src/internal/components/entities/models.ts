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
import { AuditBehaviorTypes, Filter, Query } from '@labkey/api';
import { List, Map, Record } from 'immutable';

import { immerable } from 'immer';

import { ExtendedMap } from '../../../public/ExtendedMap';

import { decodePart, encodePart, SchemaQuery } from '../../../public/SchemaQuery';
import { IEntityDetails } from '../domainproperties/entities/models';
import { SelectInputOption } from '../forms/input/SelectInput';
import { capitalizeFirstChar, caseInsensitive, generateId } from '../../util/utils';
import { QueryColumn, QueryLookup } from '../../../public/QueryColumn';
import { SCHEMAS } from '../../schemas';
import { SampleCreationType } from '../samples/models';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { EditorModel } from '../editable/models';
import { QueryCommandResponse } from '../../query/api';
import { QueryInfo } from '../../../public/QueryInfo';
import { ViewInfo } from '../../ViewInfo';
import { FieldFilter } from '../search/models';
import { ComponentsAPIWrapper } from '../../APIWrapper';

export interface EntityInputProps {
    role: string;
    rowId: number;
}

export interface IDerivePayload {
    dataInputs?: EntityInputProps[];
    materialDefault?: any;
    materialInputs?: EntityInputProps[];
    materialOutputCount?: number;
    materialOutputs?: Array<{ [key: string]: any }>;
    targetType: string;
}

// the set of options for selecting a type (e.g., the list of sample types).
// {
//     value:   'Sample Type 1',
//     label:   'Sample Type 1',
//     schema:  'samples',
//     query:  'Sample Type 1'
// }
// capturing the schema name (e.g., samples) and query name (e.g., SampleSet1)
// that can be used to retrieve the set of fields defined for that type and/or
// the list of values (e.g., S-123, S-234) that can be chosen as actual parents.
// Needs(?) to extend SelectInputOption for use in ReactSelects, but otherwise very much
// a duplicate of EntityParentType (modulo the value being a DisplayObject vs TValue)
export interface IParentOption extends SelectInputOption {
    query?: string;
    schema?: string;
}

export interface DisplayObject {
    displayValue: any;
    value: any;
}

export class EntityParentType extends Record({
    index: undefined,
    key: undefined,
    label: undefined,
    query: undefined,
    schema: undefined,
    value: undefined,
    isParentTypeOnly: false,
    isAliquotParent: false,
    required: false,
}) {
    declare index: number;
    declare key: string;
    declare label: string;
    declare query: string;
    declare schema: string;
    declare value: List<DisplayObject>;
    declare isParentTypeOnly: boolean;
    declare isAliquotParent: boolean;
    declare required?: boolean;

    static create(values: any): EntityParentType {
        if (!values.key) values.key = generateId('parent-type-');
        return new EntityParentType(values);
    }

    createColumnName() {
        const parentInputType = this.getInputType();
        if (parentInputType === QueryColumn.ALIQUOTED_FROM) return QueryColumn.ALIQUOTED_FROM;

        const formattedQueryName = capitalizeFirstChar(this.query);
        // Issue 33653: query name is case-sensitive for some data inputs (sample parents), so leave it
        // capitalized here and we lower it where needed
        return [parentInputType, formattedQueryName].join('/');
    }

    getInputType(): string {
        if (this.schema === SCHEMAS.DATA_CLASSES.SCHEMA) return QueryColumn.DATA_INPUTS;
        return this.isAliquotParent ? QueryColumn.ALIQUOTED_FROM : QueryColumn.MATERIAL_INPUTS;
    }

    generateFieldKey(): string {
        const parentInputType = this.getInputType();
        const formattedQueryName = capitalizeFirstChar(this.query);

        // Issue 33653: query name is case-sensitive for some data inputs (sample parents), so leave it
        // capitalized here and we lower it where needed
        return this.isAliquotParent
            ? QueryColumn.ALIQUOTED_FROM
            : [encodePart(parentInputType), encodePart(formattedQueryName)].join('/');
    }

    // TODO: We should stop generating this on the client and retrieve the actual ColumnInfo from the server
    generateColumn(displayColumn: string, targetSchema: string): QueryColumn {
        const formattedQueryName = this.label ?? capitalizeFirstChar(this.query);
        const parentColName = this.generateFieldKey();

        // Issue 40233: SM app allows for two types of parents, sources and samples, and its confusing if both use
        // the "Parents" suffix in the editable grid header.
        // To make this work with Biologics, only add Parents if target and parent are the same type (sample or data class)
        const captionSuffix = this.schema === targetSchema ? ' Parents' : '';

        // 32671: Sample import and edit grid key ingredients on scientific name
        if (
            this.schema &&
            this.query &&
            this.schema.toLowerCase() === SCHEMAS.DATA_CLASSES.INGREDIENTS.schemaName.toLowerCase() &&
            this.query.toLowerCase() === SCHEMAS.DATA_CLASSES.INGREDIENTS.queryName.toLowerCase()
        ) {
            displayColumn = 'scientificName';
        }

        return new QueryColumn({
            caption: this.isAliquotParent ? QueryColumn.ALIQUOTED_FROM_CAPTION : formattedQueryName + captionSuffix,
            description: this.isAliquotParent
                ? 'The parent sample of the aliquot'
                : 'Contains optional parent entity for this ' + formattedQueryName,
            fieldKeyArray: [parentColName],
            fieldKey: parentColName,
            lookup: new QueryLookup({
                displayColumn,
                isPublic: true,
                keyColumn: 'RowId',
                multiValued: this.isAliquotParent ? undefined : 'junction',
                queryName: this.query,
                schemaName: this.schema,
                viewName: ViewInfo.DETAIL_NAME, // use the details view to assure we see values even if default view is filtered
            }),
            name: parentColName,
            required: this.isAliquotParent || this.required,
            shownInInsertView: true,
            shownInUpdateView: true,
            type: 'Text (String)',
            userEditable: true,
        });
    }
}

// represents a chosen entity type (e.g., Sample Set 1)
export interface IEntityTypeOption extends SelectInputOption {
    entityDataType: EntityDataType;
    lsid: string;
    query: string;
    required?: boolean;
    rowId: number;
}

export class EntityTypeOption implements IEntityTypeOption {
    label: string;
    query: string;
    lsid: string;
    rowId: number;
    value: any;
    entityDataType: EntityDataType;
    isFromSharedContainer?: boolean;
    required?: boolean;

    constructor(props?: Partial<EntityTypeOption>) {
        if (props) {
            for (const k in props) {
                this[k] = props[k];
            }
        }
    }
}

// represents an entity type (e.g., Sample Type 1) and the values chosen of that type (e.g., S-1, S-2)
export interface EntityChoice {
    gridValues?: DisplayObject[]; // array of RowId/DisplayValue DisplayObjects for use with EditableGrid
    ids: string[]; // LSIDs or RowIds
    type: IEntityTypeOption;
    value: string; // String with comma-separated values (e.g., "S-1,S-2") for use with QuerySelect multi-select)
}

export class EntityIdCreationModel extends Record({
    errors: undefined,
    initialEntityType: undefined,
    isError: false,
    isInit: false,
    originalParents: Array<string>(),
    parentOptions: Map<string, List<IParentOption>>(),
    entityParents: Map<string, List<EntityParentType>>(),
    entityTypeOptions: List<IEntityTypeOption>(),
    selectionKey: undefined,
    isSnapshotSelection: false,
    targetEntityType: undefined,
    entityCount: 0,
    entityDataType: undefined,
    creationType: undefined,
    numPerParent: 1,
}) {
    declare errors: any[];
    declare initialEntityType: any;
    declare isError: boolean;
    declare isInit: boolean;
    declare originalParents: string[]; // taken from the query string
    declare parentOptions: Map<string, List<IParentOption>>; // map from query name to the options for the different types of parents allowed
    declare entityParents: Map<string, List<EntityParentType>>; // map from query name to the parents already selected for that query
    declare entityTypeOptions: List<IEntityTypeOption>; // the target type options
    declare selectionKey: string;
    declare isSnapshotSelection: boolean;
    declare targetEntityType: EntityTypeOption; // the target entity Type
    declare entityCount: number; // how many rows are in the grid
    declare entityDataType: EntityDataType; // target entity data type
    declare creationType: SampleCreationType;
    declare numPerParent: number;

    static revertParentInputSchema(inputColumn: QueryColumn): SchemaQuery {
        if (inputColumn.isExpInput()) {
            const fieldKey = inputColumn.fieldKey.toLowerCase().split('/');
            if (fieldKey.length === 2) {
                let schemaName: string;
                if (fieldKey[0] === QueryColumn.DATA_INPUTS.toLowerCase()) {
                    schemaName = SCHEMAS.DATA_CLASSES.SCHEMA;
                } else if (fieldKey[0] === QueryColumn.MATERIAL_INPUTS.toLowerCase()) {
                    schemaName = SCHEMAS.SAMPLE_SETS.SCHEMA;
                } else {
                    throw new Error('Invalid inputColumn fieldKey. "' + fieldKey[0] + '"');
                }

                return new SchemaQuery(decodePart(schemaName), decodePart(fieldKey[1]));
            }

            throw new Error('invalid inputColumn fieldKey length.');
        }

        throw new Error('Invalid inputColumn.');
    }

    static getEmptyEntityParents(queryNames: List<string>): Map<string, List<EntityParentType>> {
        let entityParents = Map<string, List<EntityParentType>>();
        queryNames.forEach(queryName => {
            entityParents = entityParents.set(queryName, List<EntityParentType>());
        });
        return entityParents;
    }

    getClearedEntityParents(): Map<string, List<EntityParentType>> {
        return this.entityParents.reduce((clearedParents, parents, key) => {
            return clearedParents.set(key, List<EntityParentType>());
        }, Map<string, List<EntityParentType>>());
    }

    getParentColumns(uniqueFieldKey: string): ExtendedMap<string, QueryColumn> {
        let columns = new ExtendedMap<string, QueryColumn>();
        const targetSchema = this.getSchemaQuery().schemaName;
        this.entityParents.forEach(parentList => {
            parentList.forEach(parent => {
                if (parent.schema && parent.query) {
                    const column = parent
                        .generateColumn(uniqueFieldKey, targetSchema)
                        .mutate({ required: parent.required });
                    // Issue 33653: query name is case-sensitive for some data inputs (parents)
                    columns = columns.set(column.name.toLowerCase(), column);
                }
            });
        });
        return columns;
    }

    hasTargetEntityType(): boolean {
        return this.targetEntityType && this.targetEntityType.value !== undefined;
    }

    getTargetEntityTypeId(): number {
        return this.hasTargetEntityType() ? this.targetEntityType.rowId : undefined;
    }

    getTargetEntityTypeValue(): string {
        return this.hasTargetEntityType() ? this.targetEntityType.value : undefined;
    }

    getTargetEntityTypeLabel(): string {
        return this.hasTargetEntityType() ? this.targetEntityType.label : undefined;
    }

    isFromSharedContainer(): boolean {
        return this.hasTargetEntityType() ? this.targetEntityType.isFromSharedContainer : false;
    }

    getParentCount(): number {
        return this.entityParents.reduce((count: number, parentList) => {
            return count + parentList.filter(parent => parent.query !== undefined).count();
        }, 0);
    }

    getEntityInputs(): {
        dataInputs: EntityInputProps[];
        materialInputs: EntityInputProps[];
    } {
        const dataInputs: EntityInputProps[] = [];
        this.entityParents.get(SCHEMAS.EXP_TABLES.DATA_CLASSES.queryName).forEach(parent => {
            const role = 'data';

            parent.value.forEach(option => {
                const rowId = parseInt(option.value);
                if (!isNaN(rowId)) {
                    dataInputs.push({ role, rowId });
                } else {
                    console.warn('Unable to parse rowId from "' + option.value + '" for ' + role + '.');
                }
            });
        });
        const materialInputs: EntityInputProps[] = [];
        this.entityParents.get(SCHEMAS.EXP_TABLES.SAMPLE_SETS.queryName).forEach(parent => {
            const role = 'sample';

            parent.value.forEach(option => {
                const rowId = parseInt(option.value);
                if (!isNaN(rowId)) {
                    materialInputs.push({ role, rowId });
                } else {
                    console.warn('Unable to parse rowId from "' + option.value + '" for ' + role + '.');
                }
            });
        });

        return {
            dataInputs,
            materialInputs,
        };
    }

    getSaveValues(): IDerivePayload {
        const { dataInputs, materialInputs } = this.getEntityInputs();

        return {
            dataInputs,
            materialDefault: {},
            materialInputs,
            targetType: this.targetEntityType.lsid,
        };
    }

    getSchemaQuery(): SchemaQuery {
        const entityTypeName = this.getTargetEntityTypeValue();
        return entityTypeName ? new SchemaQuery(this.entityDataType.instanceSchemaName, entityTypeName) : undefined;
    }

    postEntityGrid(
        api: ComponentsAPIWrapper,
        editorModel: EditorModel,
        containerPath?: string,
        extraColumnsToInclude?: string[],
        auditUserComment?: string
    ): Promise<QueryCommandResponse> {
        const rows = editorModel
            .getDataForServerUpload(false)
            .valueSeq()
            .reduce((rows_, row) => {
                let map = row.toMap();
                extraColumnsToInclude?.forEach(col => {
                    map = map.set(col, undefined);
                });
                rows_ = rows_.push(map);
                return rows_;
            }, List<Map<string, any>>());

        return api.query.insertRows({
            auditBehavior: AuditBehaviorTypes.DETAILED,
            auditUserComment,
            fillEmptyFields: true,
            rows,
            schemaQuery: this.getSchemaQuery(),
            containerPath,
        });
    }

    getGridValues(queryInfo: QueryInfo, separateParents?: boolean): Map<any, any> {
        let data = List<Map<string, any>>();
        const parentCols = [];
        let values = Map<string, any>();

        if (this.entityCount > 0) {
            queryInfo.getInsertColumns().forEach(col => {
                const colName = col.name;
                let selected;
                if (col.isExpInput() && this.creationType !== SampleCreationType.Aliquots) {
                    // Convert parent values into appropriate column names
                    const sq = EntityIdCreationModel.revertParentInputSchema(col);

                    // should be only one parent with the matching schema and query name
                    selected = this.entityParents.reduce((found, parentList) => {
                        return (
                            found ||
                            parentList.find(parent => parent.schema === sq.schemaName && parent.query === sq.queryName)
                        );
                    }, undefined);
                } else if (col.isAliquotParent() && this.creationType === SampleCreationType.Aliquots) {
                    selected = this.entityParents.reduce((found, parentList) => {
                        return found || parentList.find(parent => parent.isAliquotParent);
                    }, undefined);
                }

                if (selected && selected.value) {
                    values = values.set(colName, selected.value);
                    parentCols.push(colName);
                }
            });

            if (separateParents && this.creationType && this.creationType != SampleCreationType.PooledSamples) {
                parentCols.forEach(parentCol => {
                    const parents: any[] = values.get(parentCol);
                    parents.forEach(parent => {
                        let singleParentValues = Map<string, any>();
                        singleParentValues = singleParentValues.set(parentCol, List<any>([parent]));
                        for (let c = 0; c < this.numPerParent; c++) {
                            data = data.push(singleParentValues);
                        }
                    });
                });
            } else {
                for (let c = 0; c < this.numPerParent; c++) {
                    data = data.push(values);
                }
            }
        }

        return data.toOrderedMap();
    }
}

export interface IEntityTypeDetails extends IEntityDetails {
    importAliasKeys?: string[];
    importAliasValues?: string[];
}

export type SampleFinderCardType = 'sampleproperty' | 'sampleparent' | 'dataclassparent' | 'assaydata';
export type FolderConfigurableDataType =
    | 'SampleType'
    | 'DashboardSampleType'
    | 'DataClass'
    | 'AssayDesign'
    | 'StorageLocation'
    | 'Container';

/**
 *  Avoid inline comment or above line comments for properties due to es-lint's limitation on moving comments:
 *  https://github.com/import-js/eslint-plugin-import/issues/1723
 *
 *     allowSingleParentTypeFilter?: boolean; // Can filter by max of one parent of this type
 *     allowRelativeDateFilter?: boolean; // if filtering by +-Xd is allowed
 *     ancestorColumnName: string; // used for extracting or querying for the ancestores of this type
 *     appUrlPrefixParts?: string[]; // the prefix used for creating links to this type in the application
 *     deleteHelpLinkTopic: string; // help topic for finding out more about dependencies and deletion
 *     dependencyText: string; // text describing the dependencies that may prevent the entity from being deleted (e.g., 'derived sample or assay data dependencies')
 *     descriptionSingular: string; // (e.g., parent sample type) used in EntityInsertPanel for a message about how many of these types are available
 *     editTypeAppUrlPrefix?: string; // the app url route prefix for the edit design page for the given data type
 *     exprColumnsWithSubSelect?: string[]; // A list of fields that are backed by ExprColumn and the ExprColumn's sql contain sub select clauses
 *     filterArray?: Filter.IFilter[]; // A list of filters to use when selecting the set of values
 *     filterCardHeaderClass?: string; // css class to use for styling the header in the display of cards for Sample Finder
 *     getInstanceDataType?: (schemaQuery: SchemaQuery, altQueryName?: string) => string; // used for data type with non-standard type name. for example, get assay design name from assay schemaQuery, or use altQueryName for special queries such as ~~allsampletypes~~
 *     getInstanceSchemaQuery?: (datatype?: string) => SchemaQuery; // used for data type with non-standard type name. for example, get assay schemaQuery from assay design name
 *     importFileAction: string; // the action in the 'experiment' controller to use for file import for the given data type
 *     importFileController?: string; // the controller to use for file import for the given data type. 'experiment' if not provided
 *     inputColumnName: string; // used for extracting or querying for the parents of this type
 *     insertColumnNamePrefix: string; // when updating this value as an input, the name of that column (e.g, MaterialInputs)
 *     instanceSchemaName: string; // (e.g., samples) Name of the schema associated with an individual instance that can be used in conjunction with a name returned from the typeListingSchemaQuery listing
 *     isFromSharedContainer?: boolean; // if the data type is defined in /Shared project
 *     listingSchemaQuery: SchemaQuery; // The schema query used to get the listing of all of the data instances (e.g., all the data class rows) available
 *     operationConfirmationActionName: string; // action in operationConfirmationControllerName used to get the confirmation data for performing operations on entities
 *     typeListingSchemaQuery: SchemaQuery; // The schema query used to get the listing of all of the data type instances (e.g., all the data classes) available
 *     folderConfigurableDataType?: string; // the DataTypeExclusion type
 */
export interface EntityDataType {
    allowRelativeDateFilter?: boolean;
    allowSingleParentTypeFilter?: boolean;
    ancestorColumnName?: string;
    appUrlPrefixParts?: string[];
    containerFilter?: Query.ContainerFilter;
    deleteHelpLinkTopic: string;
    dependencyText: Function | string;
    descriptionPlural: string;
    descriptionSingular: string;
    editTypeAppUrlPrefix?: string;
    exprColumnsWithSubSelect?: string[];
    filterArray?: Filter.IFilter[];
    filterCardHeaderClass?: string;
    folderConfigurableDataType?: FolderConfigurableDataType;
    getInstanceDataType?: (schemaQuery: SchemaQuery, altQueryName?: string) => string;
    getInstanceSchemaQuery?: (datatype?: string) => SchemaQuery;
    importFileAction?: string;
    importFileController?: string;
    inputColumnName?: string;
    inputTypeValueField?: string;
    insertColumnNamePrefix?: string;
    instanceKey?: string;
    instanceSchemaName: string;
    isFromSharedContainer?: boolean;
    labelColorCol?: string;
    listingSchemaQuery: SchemaQuery;
    moveNoun?: string;
    nounAsParentPlural: string;
    nounAsParentSingular: string;
    nounPlural: string;
    nounSingular: string;
    operationConfirmationActionName: string;
    operationConfirmationControllerName: string;
    sampleFinderCardType?: SampleFinderCardType;
    supportHasNoValueInQuery?: boolean;
    supportsCrossTypeImport?: boolean;
    typeIcon?: string;
    typeListingSchemaQuery: SchemaQuery;
    typeNounAsParentSingular: string;
    typeNounSingular: string;
    uniqueFieldKey: string;
}

interface OperationContainerInfo {
    id: string;
    path: string;
    permitted: boolean;
}

export class OperationConfirmationData {
    [immerable]: true;

    readonly allowed: any[];
    readonly containers: OperationContainerInfo[];
    readonly notAllowed: any[];
    readonly notPermitted: any[]; // could intersect both allowed and notAllowed
    readonly idMap: Record<number, boolean>;
    readonly totalActionable;
    readonly totalNotActionable;

    constructor(values?: Partial<OperationConfirmationData>, idField = 'rowId') {
        Object.assign(this, values);
        const idMap = {};
        if (values?.allowed) {
            values.allowed.forEach(allowed => {
                idMap[caseInsensitive(allowed, idField)] = true;
            });
        } else {
            Object.assign(this, { allowed: [] });
        }
        if (values?.notAllowed) {
            values.notAllowed.forEach(notAllowed => {
                idMap[caseInsensitive(notAllowed, idField)] = false;
            });
        } else {
            Object.assign(this, { notAllowed: [] });
        }
        if (values?.notPermitted) {
            values.notPermitted.forEach(npRow => {
                idMap[caseInsensitive(npRow, idField)] = false;
            });
        } else {
            Object.assign(this, { notPermitted: [] });
        }
        Object.assign(this, {
            idMap,
            totalActionable: Object.values(idMap).filter(v => v === true).length,
            totalNotActionable: Object.values(idMap).filter(v => v === false).length,
        });
    }

    isIdActionable(id: number | string): boolean {
        const idNum = typeof id === 'string' ? parseInt(id, 10) : id;
        return this.idMap[idNum];
    }

    getActionableIds(idField = 'rowId'): number[] {
        return this.allowed
            .map(a => {
                return caseInsensitive(a, idField);
            })
            .filter(id => this.isIdActionable(id));
    }

    get allActionable(): boolean {
        return this.totalNotActionable === 0;
    }

    // Note that this returns false if there are no samples represented since we generally want
    // noneActionable to mean there are some samples but none can be acted upon.
    get noneActionable(): boolean {
        return this.allowed.length === 0 && (this.notAllowed.length > 0 || this.notPermitted.length > 0);
    }

    get anyActionable(): boolean {
        return this.totalActionable > 0;
    }

    get totalCount(): number {
        return this.allowed.length + this.notAllowed.length;
    }

    get anyNotActionable(): boolean {
        return this.totalNotActionable > 0;
    }

    getContainerPaths(permittedOnly = true): string[] {
        return this.containers?.filter(c => !permittedOnly || c.permitted).map(c => c.id) ?? [];
    }
}

export interface CrossFolderSelectionResult {
    crossFolderSelectionCount: number;
    currentFolderSelectionCount: number;
    title?: string;
}

export interface IImportAlias {
    alias?: string;
    inputType: string;
    required?: boolean;
}

export interface IParentAlias {
    alias: string;
    // generated by panel used for removal, not saved
    id: string;
    ignoreAliasError: boolean;
    ignoreSelectError: boolean;
    isDupe?: boolean;
    parentValue: IParentOption;
    required?: boolean;
}

export interface DataTypeEntity {
    description?: string;
    inactive?: boolean;
    label: string;
    labelColor?: string;
    lsid?: string;
    rowId?: number;
    sublabel?: string;
    type: FolderConfigurableDataType;
}

export interface FilterProps {
    altQueryName?: string;
    dataTypeDisplayName?: string;
    disabled?: boolean;
    entityDataType: EntityDataType;
    // the filters to be used in conjunction with the schemaQuery
    filterArray?: FieldFilter[];
    index?: number;
    schemaQuery?: SchemaQuery;
    selectColumnFieldKey?: string;
    targetColumnFieldKey?: string;
}

export interface RemappedKeyValues {
    mapFromValues: any[];
    mapToValues: any[];
}
