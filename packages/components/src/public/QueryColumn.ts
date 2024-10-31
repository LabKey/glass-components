// Consider having this implement Query.QueryColumn from @labkey/api
// commented out attributes are not used in app
import { Filter, Query } from '@labkey/api';

import {
    CALCULATED_CONCEPT_URI,
    CONCEPT_CODE_CONCEPT_URI,
    DATE_RANGE_URI,
    SAMPLE_TYPE_CONCEPT_URI,
    STORAGE_UNIQUE_ID_CONCEPT_URI,
    TIME_RANGE_URI,
} from '../internal/components/domainproperties/constants';
import { SCHEMAS } from '../internal/schemas';

import { isAllSamplesSchema } from '../internal/components/samples/utils';
import { SAMPLES_WITH_TYPES_FILTER } from '../internal/components/samples/constants';

import { SchemaQuery } from './SchemaQuery';

export enum Operation {
    insert = 'insert',
    update = 'update',
}

export interface QueryLookupFilterGroupFilter {
    column: string;
    operator: string;
    value: string;
}

export interface QueryLookupFilterGroup {
    filters: QueryLookupFilterGroupFilter[];
    operation: Operation;
}

export class QueryLookup {
    declare containerFilter: Query.ContainerFilter;
    declare containerPath: string;
    declare displayColumn: string;
    declare filterGroups: QueryLookupFilterGroup[];
    declare isPublic: boolean;
    declare junctionLookup: string; // name of the column on the junction table that is also a lookup
    declare keyColumn: string;
    declare multiValued: string; // can be "junction", "value" or undefined. Server only support "junction" at this time
    // declare public: boolean; -- NOT ALLOWING DUE TO KEYWORD -- USE isPublic
    declare queryName: string;
    // declare schema: string; -- NOT ALLOWING -- USE schemaName
    declare schemaName: string;
    declare schemaQuery: SchemaQuery;
    // declare table: string; -- NOT ALLOWING -- USE queryName
    declare viewName: string;

    constructor(rawLookup: Partial<QueryLookup>) {
        Object.assign(this, rawLookup, {
            schemaQuery: new SchemaQuery(rawLookup.schemaName, rawLookup.queryName, rawLookup.viewName),
        });
    }

    hasQueryFilters(operation?: Operation): boolean {
        return (
            isAllSamplesSchema(this.schemaQuery) ||
            QueryColumn.isUserLookup(this) ||
            (operation !== undefined && this.getFilterGroup(operation) !== undefined)
        );
    }

    getFilterGroup(operation: Operation): QueryLookupFilterGroup {
        return this.filterGroups?.find(filterGroup => filterGroup.operation === operation);
    }

    getQueryFilters(operation?: Operation): Filter.IFilter[] {
        // Issue 46037: Some plate-based assays (e.g., NAB) create samples with a bogus 'Material' sample type, which should get excluded here
        if (isAllSamplesSchema(this.schemaQuery)) {
            return [SAMPLES_WITH_TYPES_FILTER];
        }

        const filterGroup = this.getFilterGroup(operation);

        if (filterGroup) {
            return filterGroup.filters.map(filterGroupFilter =>
                Filter.create(
                    filterGroupFilter.column,
                    filterGroupFilter.value,
                    Filter.Types[filterGroupFilter.operator.toUpperCase()]
                )
            );
        } else if (QueryColumn.isUserLookup(this)) {
            // Issue 49439: filter out inactive users from insert and update form query selects
            return [Filter.create('Active', true)];
        }

        return undefined;
    }

    mutate(partial: Partial<QueryLookup>): QueryLookup {
        return new QueryLookup(Object.assign({}, this, partial));
    }
}

const defaultQueryColumn = {
    conceptURI: null,
    defaultValue: null,
    filterable: true,
    hasSortKey: false,
    multiValue: false,
    sortable: true,
    removeFromViews: false,
};

export interface IQueryColumn {
    addToSystemView: boolean;
    align: string;
    // autoIncrement: boolean;
    // calculated: boolean;
    caption: string;
    conceptSubtree: string;
    conceptURI: string;
    defaultValue: any;
    derivationDataScope: string;
    description: string;
    dimension: boolean;
    displayAsLookup: boolean;
    // defaultScale: string;
    displayField?: string;
    displayFieldJsonType?: string;
    displayFieldSqlType?: string;
    // excludeFromShifting: boolean;
    // ext: any;
    facetingBehaviorType: string;
    fieldKey: string;
    fieldKeyArray: string[];
    fieldKeyPath: string;
    filterable: boolean;
    format: string;
    // friendlyType: string;
    hasSortKey: boolean;
    hidden: boolean;
    inputType: string;
    // isAutoIncrement: boolean; // DUPLICATE
    // isHidden: boolean; // DUPLICATE
    isKeyField: boolean;
    // isMvEnabled: boolean;
    // isNullable: boolean;
    // isReadOnly: boolean;
    // isSelectable: boolean; // DUPLICATE
    // isUserEditable: boolean; // DUPLICATE
    // isVersionField: boolean;
    jsonType: string;
    // keyField: boolean;
    lookup: Record<string, any>;
    measure: boolean;
    multiValue: boolean;
    // mvEnabled: boolean;
    name: string;
    nameExpression: string;
    // nullable: boolean;
    phiProtected: boolean;
    protected: boolean;
    rangeURI: string;
    readOnly: boolean;
    removeFromViewCustomization: boolean;
    removeFromViews: boolean; // strips this column from all ViewInfo definitions
    // recommendedVariable: boolean;
    required: boolean;
    scale: number;
    selectable: boolean;
    shortCaption: string;
    shownInDetailsView: boolean;
    shownInInsertView: boolean;
    shownInLookupView: boolean;
    shownInUpdateView: boolean;
    sortable: boolean;
    // versionField: boolean;

    sorts: '+' | '-';
    sourceOntology: string;
    // sqlType: string;
    type: string;
    units: string;

    userEditable: boolean;
    validValues: string[];
}

export class QueryColumn implements IQueryColumn {
    declare align: string;
    // declare autoIncrement: boolean;
    // declare calculated: boolean;
    declare caption: string;
    declare conceptURI: string;
    // declare defaultScale: string;
    declare displayField?: string;
    declare displayFieldSqlType?: string;
    declare displayFieldJsonType?: string;
    declare defaultValue: any;
    declare description: string;
    declare dimension: boolean;
    declare displayAsLookup: boolean;
    // declare excludeFromShifting: boolean;
    // declare ext: any;
    declare facetingBehaviorType: string;
    declare fieldKey: string;
    declare fieldKeyArray: string[];
    declare fieldKeyPath: string;
    declare filterable: boolean;
    declare format: string;
    // declare friendlyType: string;
    declare hasSortKey: boolean;
    declare hidden: boolean;
    declare inputType: string;
    // declare isAutoIncrement: boolean; // DUPLICATE
    // declare isHidden: boolean; // DUPLICATE
    declare isKeyField: boolean;
    // declare isMvEnabled: boolean;
    // declare isNullable: boolean;
    // declare isReadOnly: boolean;
    // declare isSelectable: boolean; // DUPLICATE
    // declare isUserEditable: boolean; // DUPLICATE
    // declare isVersionField: boolean;
    declare jsonType: string;
    // declare keyField: boolean;
    declare lookup: QueryLookup;
    declare measure: boolean;
    declare multiValue: boolean;
    // declare mvEnabled: boolean;
    declare name: string;
    declare nameExpression: string;
    // declare nullable: boolean;
    declare phiProtected: boolean;
    declare 'protected': boolean;
    declare rangeURI: string;
    declare readOnly: boolean;
    // declare recommendedVariable: boolean;
    declare required: boolean;
    declare selectable: boolean;
    declare shortCaption: string;
    declare addToSystemView: boolean;
    declare removeFromViewCustomization: boolean;
    declare shownInDetailsView: boolean;
    declare shownInInsertView: boolean;
    declare shownInLookupView: boolean;
    declare shownInUpdateView: boolean;
    declare scale: number;
    declare sortable: boolean;
    declare sqlType: string;
    declare type: string;
    declare userEditable: boolean;
    declare validValues: string[];
    // declare versionField: boolean;
    declare valueExpression: string;
    declare wrappedColumnName: string;

    declare cell: Function;
    declare columnRenderer: string;
    declare detailRenderer: string;
    declare helpTipRenderer: string;
    declare inputRenderer: string;
    declare sorts: '+' | '-';
    declare removeFromViews: boolean; // strips this column from all ViewInfo definitions
    declare units: string;
    declare derivationDataScope: string;

    declare sourceOntology: string;
    declare conceptSubtree: string;

    constructor(rawColumn: Partial<QueryColumn | IQueryColumn>) {
        Object.assign(this, defaultQueryColumn, rawColumn);

        if (rawColumn && rawColumn.lookup !== undefined) {
            Object.assign(this, { lookup: new QueryLookup(rawColumn.lookup) });
        }
    }

    static DATA_INPUTS = 'DataInputs';
    static MATERIAL_INPUTS = 'MaterialInputs';
    static ALIQUOTED_FROM = 'AliquotedFrom';
    static ALIQUOTED_FROM_CAPTION = 'Aliquoted From';
    static ALIQUOTED_FROM_LSID = 'AliquotedFromLSID';
    static MEASUREMENT_UNITS_QUERY = 'MeasurementUnits';

    static isUserLookup(lookupInfo: Record<string, any>): boolean {
        if (!lookupInfo) return false;

        const lcSchema = lookupInfo.schemaName?.toLowerCase();
        const lcQuery = lookupInfo.queryName?.toLowerCase();
        return lcSchema === 'core' && (lcQuery === 'users' || lcQuery === 'siteusers');
    }

    get index(): string {
        // See Issues 41621, 45148
        // The server provides data indices into row data from selectRows based on FieldKey. In the
        // 17.1 SelectRowsResponse format these indices are constructed based off the associated column
        // fieldKey as follows:
        // 1. If the fieldKey is made up of multiple parts (e.g: "parent/someKey"), then the data index
        //    is FieldKey encoded.
        // 2. If the fieldKey is made up of one part (e.g: "someKey"), then the data index is not FieldKey encoded.

        // return if the column does not have a fieldKey at all
        if (!this.fieldKey) return;

        // "fieldKey" is expected to be FieldKey encoded so the presence of "/" indicates
        // this is a multi-part fieldKey which means the data index will be FieldKey encoded as well.
        if (this.fieldKey.indexOf('/') > -1) {
            return this.fieldKey;
        }

        // "fieldKeyPath" is used for getQueryDetails calls when a fk is passed as a prop, to get the child fields
        // for a lookup
        if (this.fieldKeyPath?.indexOf('/') > -1) {
            return this.fieldKeyPath;
        }

        // This is a single-part fieldKey so the data index will NOT be FieldKey encoded.
        if (this.fieldKeyArray.length === 1) {
            return this.fieldKeyArray[0];
        }

        // We're in an unexpected state. The "fieldKey" is single-part but the
        // "fieldKeyArray" is non-singular (made up of zero or two or more parts).
        // Fallback to old behavior.
        return this.fieldKeyArray?.join('/');
    }

    isExpInput(checkLookup = true): boolean {
        return this.isDataInput(checkLookup) || this.isMaterialInput(checkLookup);
    }

    isDataInput(checkLookup = true): boolean {
        return (
            this.name &&
            this.name.toLowerCase().indexOf(QueryColumn.DATA_INPUTS.toLowerCase()) !== -1 &&
            (!checkLookup || this.isLookup())
        );
    }

    isUnitsLookup(): boolean {
        return this.isLookup() && this.lookup.queryName === QueryColumn.MEASUREMENT_UNITS_QUERY;
    }

    isAliquotParent(): boolean {
        return (
            this.name &&
            (this.name.toLowerCase() === QueryColumn.ALIQUOTED_FROM.toLowerCase() ||
                this.name.toLowerCase() === QueryColumn.ALIQUOTED_FROM_LSID.toLowerCase())
        );
    }

    isEditable(): boolean {
        return !this.readOnly && this.userEditable && this.shownInUpdateView;
    }

    isJunctionLookup(): boolean {
        return this.isLookup() && this.lookup.multiValued === 'junction';
    }

    isLookup(): boolean {
        return this.lookup !== undefined;
    }

    // Issue 39911: a public lookup indicates that it is available in the user schema (i.e. can be seen in the schema browser)
    isPublicLookup(): boolean {
        return this.isLookup() && this.lookup.isPublic;
    }

    isSampleLookup(): boolean {
        if (!this.isLookup()) {
            return false;
        }

        // Issue 44845: Support resolving sample lookup columns by Concept URI
        if (this.conceptURI === SAMPLE_TYPE_CONCEPT_URI) {
            return true;
        }

        // Issue 35881: Ensure that a column is a valid lookup to one of the following:
        // - exp.Materials
        // - samples.* (any sample set)
        const lookupSQ = this.lookup.schemaQuery;
        return SCHEMAS.EXP_TABLES.MATERIALS.isEqual(lookupSQ) || lookupSQ.hasSchema(SCHEMAS.SAMPLE_SETS.SCHEMA);
    }

    isSingleSampleTypeLookup(): boolean {
        return this.isSampleLookup() && this.lookup.schemaQuery.hasSchema(SCHEMAS.SAMPLE_SETS.SCHEMA);
    }

    isMaterialInput(checkLookup = true): boolean {
        return (
            this.name &&
            this.name.toLowerCase().indexOf(QueryColumn.MATERIAL_INPUTS.toLowerCase()) !== -1 &&
            (!checkLookup || this.isLookup())
        );
    }

    get isDetailColumn(): boolean {
        return !this.removeFromViews && this.shownInDetailsView === true;
    }

    get isUpdateColumn(): boolean {
        return this.removeFromViews !== true && this.isEditable() && this.fieldKeyArray.length === 1;
    }

    get isUniqueIdColumn(): boolean {
        return this.conceptURI === STORAGE_UNIQUE_ID_CONCEPT_URI;
    }

    get isConceptCodeColumn(): boolean {
        return this.conceptURI === CONCEPT_CODE_CONCEPT_URI;
    }

    get isTimeColumn(): boolean {
        return this.rangeURI === TIME_RANGE_URI;
    }

    get isDateOnlyColumn(): boolean {
        return this.rangeURI === DATE_RANGE_URI;
    }

    get isCalculatedField(): boolean {
        return this.conceptURI === CALCULATED_CONCEPT_URI;
    }

    get hasHelpTipData(): boolean {
        return !!this.description || !!this.format || !!this.phiProtected;
    }

    isImportColumn(importName: string): boolean {
        if (!importName) return false;

        const lcName = importName.toLowerCase().trim();
        return (
            this.caption?.toLowerCase() === lcName ||
            this.caption?.replace(' ', '').toLowerCase() === lcName ||
            this.name?.toLowerCase() === lcName ||
            this.fieldKey?.toLowerCase() === lcName
        );
    }

    // TODO is this redundant with getDisplayFieldKey?
    resolveFieldKey(): string {
        let fieldKey: string;

        if (this.isPublicLookup()) {
            fieldKey = [this.fieldKey, this.lookup.displayColumn.replace(/\//g, '$S')].join('/');
        } else {
            fieldKey = this.fieldKey;
        }

        return fieldKey;
    }

    get lookupKey(): string {
        if (!this.lookup) return undefined;

        return [this.lookup.schemaName, this.lookup.queryName, this.fieldKey].join('|');
    }

    get isFileInput(): boolean {
        return this.inputType === 'file';
    }

    allowFaceting(): boolean {
        switch (this.facetingBehaviorType) {
            case 'ALWAYS_ON':
                return true;
            case 'ALWAYS_OFF':
                return false;
            case 'AUTOMATIC':
                // auto rules are if the column is a lookup or dimension
                // OR if it is of type : (boolean, int, date, text), multiline excluded
                if (this.lookup || this.dimension) return true;
                else if (
                    this.jsonType === 'boolean' ||
                    this.jsonType === 'int' ||
                    (this.jsonType === 'string' && this.inputType !== 'textarea')
                )
                    return true;
        }

        return false;
    }

    getDisplayFieldKey(): string {
        return this.isLookup() && this.displayField ? this.displayField : this.fieldKey;
    }

    getDisplayFieldJsonType(): string {
        return (this.displayFieldJsonType ? this.displayFieldJsonType : this.jsonType) ?? 'string';
    }

    get customViewTitle(): string {
        return this.caption === this.name ? '' : this.caption;
    }

    mutate(partial: Partial<QueryColumn>): QueryColumn {
        return new QueryColumn(Object.assign({}, this, partial));
    }
}

export function insertColumnFilter(
    col: QueryColumn,
    includeFileInputs = true,
    isIncludedColumn?: (col: QueryColumn) => boolean
): boolean {
    return (
        col &&
        col.removeFromViews !== true &&
        col.shownInInsertView === true &&
        !col.readOnly &&
        col.userEditable &&
        col.fieldKeyArray.length === 1 &&
        (includeFileInputs || !col.isFileInput) &&
        (!isIncludedColumn || isIncludedColumn(col))
    );
}
