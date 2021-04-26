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
import { AuditBehaviorTypes, Filter, Utils } from '@labkey/api';
import { List, Map, OrderedMap, Record } from 'immutable';
import { Option } from 'react-select';

import { getEditorModel } from '../../global';
import { gridShowError } from '../../actions';
import {
    capitalizeFirstChar,
    generateId,
    insertRows,
    InsertRowsResponse,
    QueryColumn,
    QueryGridModel,
    QueryInfo,
    SampleCreationType,
    SCHEMAS,
    SchemaQuery,
} from '../../..';
import { decodePart, encodePart } from '../../../public/SchemaQuery';
import { IEntityDetails } from '../domainproperties/entities/models';

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
// Needs(?) to extend Option for use in ReactSelects, but otherwise very much
// a duplicate of EntityParentType (modulo the value being a DisplayObject vs TValue)
export interface IParentOption extends Option {
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
    query: undefined,
    schema: undefined,
    value: undefined,
    isParentTypeOnly: false,
    isAliquotParent: false,
}) {
    declare index: number;
    declare key: string;
    declare query: string;
    declare schema: string;
    declare value: List<DisplayObject>;
    declare isParentTypeOnly: boolean;
    declare isAliquotParent: boolean;

    static create(values: any): EntityParentType {
        if (!values.key) values.key = generateId('parent-type-');
        return new EntityParentType(values);
    }

    createColumnName() {
        const parentInputType = this.getInputType();
        if (parentInputType === QueryColumn.ALIQUOTED_FROM)
            return QueryColumn.ALIQUOTED_FROM;

        const formattedQueryName = capitalizeFirstChar(this.query);
        // Issue 33653: query name is case-sensitive for some data inputs (sample parents), so leave it
        // capitalized here and we lower it where needed
        return [parentInputType, formattedQueryName].join('/');
    }

    getInputType(): string {
        if (this.schema === SCHEMAS.DATA_CLASSES.SCHEMA)
            return QueryColumn.DATA_INPUTS;
        return this.isAliquotParent ? QueryColumn.ALIQUOTED_FROM : QueryColumn.MATERIAL_INPUTS;
    }

    // TODO: We should stop generating this on the client and retrieve the actual ColumnInfo from the server
    generateColumn(displayColumn: string): QueryColumn {
        const parentInputType = this.getInputType();
        const formattedQueryName = capitalizeFirstChar(this.query);
        // Issue 33653: query name is case-sensitive for some data inputs (sample parents), so leave it
        // capitalized here and we lower it where needed
        const parentColName = this.isAliquotParent ? QueryColumn.ALIQUOTED_FROM : [encodePart(parentInputType), encodePart(formattedQueryName)].join('/');
        // Issue 40233: SM app allows for two types of parents, sources and samples, and its confusing if both use
        // the "Parents" suffix in the editable grid header
        const captionSuffix = this.schema !== SCHEMAS.DATA_CLASSES.SCHEMA ? ' Parents' : '';

        // 32671: Sample import and edit grid key ingredients on scientific name
        if (
            this.schema &&
            this.query &&
            this.schema.toLowerCase() === SCHEMAS.DATA_CLASSES.INGREDIENTS.schemaName.toLowerCase() &&
            this.query.toLowerCase() === SCHEMAS.DATA_CLASSES.INGREDIENTS.queryName.toLowerCase()
        ) {
            displayColumn = 'scientificName';
        }

        return QueryColumn.create({
            caption: this.isAliquotParent ? QueryColumn.ALIQUOTED_FROM : formattedQueryName + captionSuffix,
            description: this.isAliquotParent ? 'The parent sample of the aliquot' : 'Contains optional parent entity for this ' + formattedQueryName,
            fieldKeyArray: [parentColName],
            fieldKey: parentColName,
            lookup: {
                displayColumn,
                isPublic: true,
                keyColumn: 'RowId',
                multiValued: this.isAliquotParent ? undefined : 'junction',
                queryName: this.query,
                schemaName: this.schema,
                table: this.isAliquotParent ? QueryColumn.MATERIAL_INPUTS : parentInputType,
            },
            name: parentColName,
            required: this.isAliquotParent,
            shownInInsertView: true,
            type: 'Text (String)',
            userEditable: true,
        });
    }
}

// represents a chosen entity type (e.g., Sample Set 1)
export interface IEntityTypeOption extends Option {
    lsid: string;
    rowId: number;
}

export class EntityTypeOption implements IEntityTypeOption {
    label: string;
    lsid: string;
    rowId: number;
    value: any;

    constructor(props?: Partial<EntityTypeOption>) {
        if (props) {
            for (const k in props) {
                this[k] = props[k];
            }
        }
    }
}

// represents an entity type (e.g., Sample Set 1) and the values chosen of that type (e.g., S-1, S-2)
export interface EntityChoice {
    type: IEntityTypeOption;
    ids: string[]; // LSIDs or RowIds
    value: string; // String with comma-separated values (e.g., "S-1,S-2") for use with QuerySelect multi-select)
}

export interface MaterialOutput {
    created: any;
    createdBy: string;
    id: number;
    lsid: string;
    modified: any;
    modifiedBy: string;
    name: string;
    properties: any;
    sampleSet: any;
}

export class GenerateEntityResponse extends Record({
    data: undefined,
    message: undefined,
    success: false,
}) {
    declare data: {
        materialOutputs: MaterialOutput[];
        [key: string]: any;
    };
    declare message: string;
    declare success: boolean;

    // Get all of the rowIds of the newly generated entity Ids (or the runs)
    getFilter(): Filter.IFilter {
        let filterColumn: string, filterValue;

        // data.id is the run rowId. If provided, create a filter based off the run instead of entityIds.
        if (this.data.id) {
            filterColumn = 'Run/RowId';
            filterValue = [this.data.id];
        } else {
            filterColumn = 'RowId';

            // if a run id was not included, filter based on generated entity Ids.
            filterValue = this.data.materialOutputs.map(val => val.id);
        }

        return Filter.create(filterColumn, filterValue, Filter.Types.IN);
    }
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
    targetEntityType: undefined,
    entityCount: 0,
    entityDataType: undefined,
    auditBehavior: undefined,
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
    declare targetEntityType: EntityTypeOption; // the target entity Type
    declare entityCount: number; // how many rows are in the grid
    declare entityDataType: EntityDataType; // target entity data type
    declare auditBehavior: AuditBehaviorTypes;
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

                return SchemaQuery.create(decodePart(schemaName), decodePart(fieldKey[1]));
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

    getParentColumns(uniqueFieldKey: string): OrderedMap<string, QueryColumn> {
        let columns = OrderedMap<string, QueryColumn>();
        this.entityParents.forEach(parentList => {
            parentList.forEach(parent => {
                if (parent.schema && parent.query) {
                    const column = parent.generateColumn(uniqueFieldKey);
                    // Issue 33653: query name is case-sensitive for some data inputs (parents)
                    columns = columns.set(column.name.toLowerCase(), column);
                }
            });
        });
        return columns;
    }

    addParent(queryName: string): EntityIdCreationModel {
        const nextIndex = this.entityParents.get(queryName).size + 1;
        const updatedParents = this.entityParents.get(queryName).push(EntityParentType.create({ index: nextIndex }));
        return this.setIn(['entityParents', queryName], updatedParents) as EntityIdCreationModel;
    }

    removeParent(index: number, queryName: string): [EntityIdCreationModel, string] {
        const entityParents = this.entityParents.get(queryName);
        const parentToResetKey = entityParents.findKey(parent => parent.get('index') === index);
        const parentColumnName = entityParents.get(parentToResetKey).createColumnName();
        const updatedEntityParents = entityParents
            .filter(parent => parent.index !== index)
            .map((parent, key) => parent.set('index', key + 1));
        return [
            this.setIn(['entityParents', queryName], updatedEntityParents) as EntityIdCreationModel,
            parentColumnName,
        ];
    }

    changeParent(
        index: number,
        queryName: string,
        uniqueFieldKey: string,
        parent: IParentOption
    ): [EntityIdCreationModel, QueryColumn, EntityParentType, string] {
        let column;
        let parentColumnName;
        let existingParent;
        const entityParents = this.entityParents.get(queryName);
        let updatedModel;
        if (parent) {
            const existingParentKey = entityParents.findKey(parent => parent.get('index') === index);
            existingParent = entityParents.get(existingParentKey);

            // bail out if the selected parent is the same as the existingParent for this index, i.e. nothing changed
            const schemaMatch =
                parent && existingParent && Utils.caseInsensitiveEquals(parent.schema, existingParent.schema);
            const queryMatch =
                parent && existingParent && Utils.caseInsensitiveEquals(parent.query, existingParent.query);
            if (schemaMatch && queryMatch) {
                return [undefined, undefined, existingParent, undefined];
            }

            const parentType = EntityParentType.create({
                index,
                key: existingParent.key,
                query: parent.query,
                schema: parent.schema,
            });
            updatedModel = this.mergeIn(
                ['entityParents', queryName, existingParentKey],
                parentType
            ) as EntityIdCreationModel;
            column = parentType.generateColumn(uniqueFieldKey);
        } else {
            const parentToResetKey = entityParents.findKey(parent => parent.get('index') === index);
            const existingParent = entityParents.get(parentToResetKey);
            parentColumnName = existingParent.createColumnName();
            updatedModel = this.mergeIn(
                ['entityParents', queryName, parentToResetKey],
                EntityParentType.create({
                    key: existingParent.key,
                    index,
                })
            ) as EntityIdCreationModel;
        }
        return [updatedModel, column, existingParent, parentColumnName];
    }

    hasTargetEntityType(): boolean {
        return this.targetEntityType && this.targetEntityType.value !== undefined;
    }

    getTargetEntityTypeValue(): string {
        return this.hasTargetEntityType() ? this.targetEntityType.value : undefined;
    }

    getTargetEntityTypeLabel(): string {
        return this.hasTargetEntityType() ? this.targetEntityType.label : undefined;
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

        const materialDefault = {};

        return {
            dataInputs,
            materialDefault,
            materialInputs,
            targetType: this.targetEntityType.lsid,
        };
    }

    getParentEntities(combineParentTypes: boolean, queryName?: string): List<EntityParentType> {
        if (combineParentTypes) {
            return this.entityParents.reduce((reduction, parentType) => {
                let index = reduction.size + 1;
                const types = parentType.map(type => {
                    return type.set('index', index++);
                });
                return reduction.concat(types) as List<EntityParentType>;
            }, List<EntityParentType>());
        } else if (queryName !== undefined) {
            return this.entityParents.get(queryName);
        } else {
            return List<EntityParentType>();
        }
    }

    getParentOptions(currentSelection: string, queryName: string, combineParentTypes: boolean): any[] {
        let allOptions = this.parentOptions.get(queryName);
        if (combineParentTypes) {
            allOptions = this.parentOptions.valueSeq().reduce((accum, val) => {
                accum = accum.concat(val) as List<IParentOption>;
                return accum;
            }, List<IParentOption>());
        }

        // exclude options that have already been selected, except the current selection for this input
        return allOptions
            .filter(o =>
                this.getParentEntities(combineParentTypes, queryName).every(parent => {
                    const notParentMatch = !parent.query || !Utils.caseInsensitiveEquals(parent.query, o.value);
                    const matchesCurrent = currentSelection && Utils.caseInsensitiveEquals(currentSelection, o.value);
                    return notParentMatch || matchesCurrent;
                })
            )
            .toArray();
    }

    getSchemaQuery(): SchemaQuery {
        const entityTypeName = this.getTargetEntityTypeValue();
        return entityTypeName ? SchemaQuery.create(this.entityDataType.instanceSchemaName, entityTypeName) : undefined;
    }

    postEntityGrid(queryGridModel: QueryGridModel): Promise<InsertRowsResponse> {
        const editorModel = getEditorModel(queryGridModel.getId());
        if (!editorModel) {
            gridShowError(queryGridModel, {
                message: 'Grid does not expose an editor. Ensure the grid is properly initialized for editing.',
            });
            return;
        }

        const rows = editorModel
            .getRawData(queryGridModel, false)
            .valueSeq()
            .reduce((rows, row) => rows.push(row.toMap()), List<Map<string, any>>());

        // TODO: InsertRows responses are fragile and depend heavily on shape of data uploaded
        return insertRows({
            fillEmptyFields: true,
            schemaQuery: this.getSchemaQuery(),
            rows,
            auditBehavior: this.auditBehavior,
        });
    }

    getGridValues(queryInfo: QueryInfo, separateParents?: boolean): Map<any, any> {
        let data = List<Map<string, any>>();
        let parentCols = [];
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

                }
                else if (col.isAliquotParent() && this.creationType === SampleCreationType.Aliquots) {
                    selected = this.entityParents.reduce((found, parentList) => {
                        return (
                            found ||
                            parentList.find(parent => parent.isAliquotParent)
                        );
                    }, undefined);
                }

                if (selected && selected.value) {
                    values = values.set(colName, selected.value);
                    parentCols.push(colName);
                }
            });

            if (separateParents && this.creationType && this.creationType != SampleCreationType.PooledSamples) {
                parentCols.forEach(parentCol => {
                    const parents: Array<any> = values.get(parentCol);
                    parents.forEach((parent) => {
                        let singleParentValues = Map<string, any>(values);
                        singleParentValues = singleParentValues.set(parentCol, List<any>([parent]));
                        for (let c = 0; c < this.numPerParent; c++) {
                            data = data.push(singleParentValues);
                        }
                    });
                })
            }
            else {
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

export enum EntityInsertPanelTabs {
    First = 1,
    Second = 2,
}

export interface EntityDataType {
    typeListingSchemaQuery: SchemaQuery; // The schema query used to get the listing of all of the data type instances (e.g., all the data classes) available
    instanceSchemaName: string; // (e.g., samples) Name of the schema associated with an individual instance that can be used in conjunction with a name returned from the typeListingSchemaQuery listing
    deleteConfirmationActionName: string; // action in ExperimentController used to get the delete confirmation data
    nounSingular: string;
    nounAsParentSingular: string;
    nounPlural: string;
    typeNounSingular: string;
    descriptionSingular: string; // (e.g., parent sample type) used in EntityInsertPanel for a message about how many of these types are available
    descriptionPlural: string;
    uniqueFieldKey: string;
    dependencyText: string; // text describing the dependencies that may prevent the entity from being deleted (e.g., 'derived sample or assay data dependencies')
    deleteHelpLinkTopic: string; // help topic for finding out more about dependencies and deletion
    inputColumnName: string; // used for extracting or querying for the parents of this type
    inputTypeColumnName: string; // used for extracting or querying for the types for the input columns
    inputTypeValueField: string;
    appUrlPrefixParts?: string[]; // the prefix used for creating links to this type in the application
    insertColumnNamePrefix: string; // when updating this value as an input, the name of that column (e.g, MaterialInputs)
    filterArray?: Filter.IFilter[]; // A list of filters to use when selecting the set of values
    editTypeAppUrlPrefix?: string; // the app url route prefix for the edit design page for the given data type
    importFileAction: string; // the action in the 'experiment' controller to use for file import for the given data type
}
