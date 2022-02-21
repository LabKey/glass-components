import { Filter, getServerContext } from '@labkey/api';

import { EntityDataType } from '../entities/models';
import { JsonType } from '../domainproperties/PropDescType';
import { SchemaQuery } from '../../../public/SchemaQuery';
import { QueryConfig, QueryModel } from '../../../public/QueryModel/QueryModel';
import { SAMPLE_STATUS_REQUIRED_COLUMNS } from '../samples/constants';
import { User } from '../base/models/User';

import { getOmittedSampleTypeColumns } from '../samples/utils';
import { SCHEMAS } from '../../schemas';

import { resolveFilterType } from '../omnibox/actions/Filter';
import { resolveFieldKey } from '../omnibox/utils';
import { QueryColumn } from '../../../public/QueryColumn';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { IN_EXP_DESCENDANTS_OF_FILTER_TYPE } from '../../url/InExpDescendantsOfFilterType';
import { getLabKeySqlWhere } from '../../query/filter';

import { FieldFilter, FieldFilterOption, FilterProps, SearchSessionStorageProps } from './models';

export function getFinderStartText(parentEntityDataTypes: EntityDataType[]): string {
    const hintText = 'Start by adding ';
    let names = parentEntityDataTypes.map(entityType => entityType.nounAsParentSingular).join(', ');
    const lastComma = names.lastIndexOf(',');
    if (lastComma >= 0) {
        names = names.substr(0, lastComma) + ' or' + names.substr(lastComma + 1);
    }
    return hintText + names + ' properties.';
}

export function getFilterCardColumnName(entityDataType: EntityDataType, schemaQuery: SchemaQuery): string {
    return entityDataType.inputColumnName.replace('Inputs', 'QueryableInputs').replace('First', schemaQuery.queryName);
}

const FIRST_COLUMNS_IN_VIEW = ['Name', 'SampleSet'];

export function getFinderViewColumnsConfig(queryModel: QueryModel): { hasUpdates: boolean; columns: any } {
    const defaultDisplayColumns = queryModel.queryInfo?.getDisplayColumns().toArray();
    const displayColumnKeys = defaultDisplayColumns.map(col => col.fieldKey);
    const columnKeys = [];
    FIRST_COLUMNS_IN_VIEW.forEach(fieldKey => {
        if (displayColumnKeys.indexOf(fieldKey) >= 0) {
            columnKeys.push(fieldKey);
        }
    });
    let hasUpdates = false;
    queryModel.requiredColumns.forEach(fieldKey => {
        if (displayColumnKeys.indexOf(fieldKey) == -1 && SAMPLE_STATUS_REQUIRED_COLUMNS.indexOf(fieldKey) === -1) {
            columnKeys.push(fieldKey);
            hasUpdates = true;
        }
    });
    columnKeys.push(
        ...defaultDisplayColumns
            .filter(col => FIRST_COLUMNS_IN_VIEW.indexOf(col.fieldKey) === -1)
            .map(col => col.fieldKey)
    );
    return { hasUpdates, columns: columnKeys.map(fieldKey => ({ fieldKey })) };
}

export const SAMPLE_FINDER_VIEW_NAME = 'Sample Finder';

function getSampleFinderConfigId(finderId: string, suffix: string): string {
    const { uuids } = getServerContext();
    // We need to make sure these ids are unique per application load since
    // the server holds on to the selection keys even after the grid is gone.
    return uuids[0] + '-' + finderId + '|' + suffix;
}

// exported for jest testing
export function getSampleFinderCommonConfigs(cards: FilterProps[]): Partial<QueryConfig> {
    const baseFilters = [];
    const requiredColumns = [...SAMPLE_STATUS_REQUIRED_COLUMNS];
    cards.forEach(card => {
        const cardColumnName = getFilterCardColumnName(card.entityDataType, card.schemaQuery);

        if (card.filterArray?.length) {
            const schemaQuery = card.schemaQuery;
            card.filterArray.forEach(f => {
                const filter = f.filter;
                const newColumnName = cardColumnName + '/' + filter.getColumnName();
                requiredColumns.push(newColumnName);
            });

            const selectClauseWhere = getLabKeySqlWhere(card.filterArray);
            if (selectClauseWhere) {
                const selectClause =
                    'SELECT ' +
                    schemaQuery.queryName +
                    '.expObject() FROM ' +
                    schemaQuery.schemaName +
                    '.' +
                    schemaQuery.queryName +
                    ' ' +
                    selectClauseWhere;
                const filter = Filter.create('*', selectClause, IN_EXP_DESCENDANTS_OF_FILTER_TYPE);
                baseFilters.push(filter);
            }
        } else {
            requiredColumns.push(cardColumnName);
            baseFilters.push(Filter.create(cardColumnName + '/Name', null, Filter.Types.NONBLANK));
        }
    });
    return {
        requiredColumns,
        baseFilters,
    };
}

export function getSampleFinderQueryConfigs(
    user: User,
    sampleTypeNames: string[],
    cards: FilterProps[],
    finderId: string
): { [key: string]: QueryConfig } {
    const omittedColumns = getOmittedSampleTypeColumns(user);
    const commonConfig = getSampleFinderCommonConfigs(cards);
    const allSamplesKey = getSampleFinderConfigId(finderId, 'exp/materials');
    const configs: { [key: string]: QueryConfig } = {
        [allSamplesKey]: {
            id: allSamplesKey,
            title: 'All Samples',
            schemaQuery: SchemaQuery.create(
                SCHEMAS.EXP_TABLES.MATERIALS.schemaName,
                SCHEMAS.EXP_TABLES.MATERIALS.queryName,
                SAMPLE_FINDER_VIEW_NAME
            ),
            omittedColumns: [...omittedColumns, 'Run'],
            ...commonConfig,
        },
    };

    for (const name of sampleTypeNames) {
        const id = getSampleFinderConfigId(finderId, 'samples/' + name);
        const schemaQuery = SchemaQuery.create(SCHEMAS.SAMPLE_SETS.SCHEMA, name, SAMPLE_FINDER_VIEW_NAME);
        configs[id] = {
            id,
            title: name,
            schemaQuery,
            omittedColumns,
            ...commonConfig,
        };
    }
    return configs;
}

export const SAMPLE_SEARCH_FILTER_TYPES_TO_EXCLUDE = [
    Filter.Types.CONTAINS.getURLSuffix(),
    Filter.Types.DOES_NOT_CONTAIN.getURLSuffix(),
    Filter.Types.DOES_NOT_START_WITH.getURLSuffix(),
    Filter.Types.STARTS_WITH.getURLSuffix(),
    Filter.Types.CONTAINS_ONE_OF.getURLSuffix(),
    Filter.Types.CONTAINS_NONE_OF.getURLSuffix(),
];

export const NEGATE_FILTERS = [
    Filter.Types.NEQ_OR_NULL.getURLSuffix(),
    Filter.Types.DATE_NOT_EQUAL.getURLSuffix(),
    Filter.Types.NOT_IN.getURLSuffix(),
];

export const SAMPLE_SEARCH_FILTER_TYPES_SKIP_TITLE = [
    Filter.Types.EQUAL.getURLSuffix(),
    Filter.Types.DATE_EQUAL.getURLSuffix(),
    Filter.Types.IN.getURLSuffix(),
    Filter.Types.BETWEEN.getURLSuffix(),
    ...NEGATE_FILTERS,
];

export function isBetweenOperator(urlSuffix: string): boolean {
    return ['between', 'notbetween'].indexOf(urlSuffix) > -1;
}

export const FILTER_URL_SUFFIX_ANY_ALT = 'any';

export function getSampleFinderFilterTypesForType(jsonType: JsonType): FieldFilterOption[] {
    const filterList = Filter.getFilterTypesForType(jsonType).filter(function (result) {
        return SAMPLE_SEARCH_FILTER_TYPES_TO_EXCLUDE.indexOf(result.getURLSuffix()) === -1;
    });
    if (jsonType === 'date') {
        filterList.push(Filter.Types.BETWEEN);
        filterList.push(Filter.Types.NOT_BETWEEN);
    }

    return filterList.map(filter => {
        let urlSuffix = filter.getURLSuffix();
        if (urlSuffix === '') urlSuffix = FILTER_URL_SUFFIX_ANY_ALT;
        return {
            value: urlSuffix,
            label: filter.getDisplayText(),
            valueRequired: filter.isDataValueRequired(),
            multiValue: filter.isMultiValued(),
            betweenOperator: isBetweenOperator(urlSuffix),
        } as FieldFilterOption;
    });
}

export function isFilterUrlSuffixMatch(suffix: string, filterType: Filter.IFilterType): boolean {
    if (suffix === 'any' && filterType.getURLSuffix() === '') return true;
    return suffix === filterType.getURLSuffix();
}

export function getFilterTypePlaceHolder(suffix: string, jsonType: string): string {
    if (suffix !== 'in' && suffix !== 'notin') return null;

    switch (jsonType) {
        case 'float':
            return 'Example: 1.0;2.2;3';
        case 'int':
            return 'Example: 1;2;3';
        case 'string':
            return 'Example: a;b;c';
    }

    return null;
}

export function filterToJson(filter: Filter.IFilter): string {
    return encodeURIComponent(filter.getURLParameterName()) + '=' + encodeURIComponent(filter.getURLParameterValue());
}

export function filterFromJson(filterStr: string): Filter.IFilter {
    return Filter.getFiltersFromUrl(filterStr, 'query')?.[0];
}

export function searchFiltersToJson(filterProps: FilterProps[], filterChangeCounter: number): string {
    const filterPropsObj = [];

    filterProps.forEach(filterProp => {
        const filterPropsEntityDataType = { ...filterProp.entityDataType };
        const filterPropObj = { ...filterProp, entityDataType: filterPropsEntityDataType };

        const filterArrayObjs = [];
        [...filterPropObj.filterArray].forEach(field => {
            filterArrayObjs.push({
                fieldKey: field.fieldKey,
                fieldCaption: field.fieldCaption,
                filter: filterToJson(field.filter),
                jsonType: field.jsonType,
            });
        });
        filterPropObj.filterArray = filterArrayObjs;

        const entityDataFilterArrayObjs = [];
        if (filterPropObj.entityDataType.filterArray?.length > 0) {
            [...filterPropObj.entityDataType.filterArray].forEach(filter => {
                entityDataFilterArrayObjs.push(filterToJson(filter));
            });

            console.log(JSON.stringify(entityDataFilterArrayObjs));
            filterPropObj.entityDataType.filterArray = entityDataFilterArrayObjs;
        }

        filterPropsObj.push(filterPropObj);
    });

    return JSON.stringify({
        filters: filterPropsObj,
        filterChangeCounter,
    });
}

export function searchFiltersFromJson(filterPropsStr: string): SearchSessionStorageProps {
    const filters: FilterProps[] = [];
    const obj = JSON.parse(filterPropsStr);
    const filterPropsObj: any[] = obj['filters'];
    const filterChangeCounter: number = obj['filterChangeCounter'];
    filterPropsObj.forEach(filterPropObj => {
        const filterArray = [];
        filterPropObj['filterArray']?.forEach(field => {
            filterArray.push({
                fieldKey: field.fieldKey,
                fieldCaption: field.fieldCaption,
                filter: filterFromJson(field.filter),
                jsonType: field.jsonType,
            });
        });
        filterPropObj['filterArray'] = filterArray;

        if (filterPropObj['entityDataType']?.['filterArray']) {
            const filterArray = [];
            filterPropObj['entityDataType']?.['filterArray']?.forEach(filter => {
                filterArray.push(filterFromJson(filter));
            });

            filterPropObj['entityDataType']['filterArray'] = filterArray;
        }

        filters.push(filterPropObj as FilterProps);
    });

    return {
        filters,
        filterChangeCounter,
    };
}

export const ALL_VALUE_DISPLAY = '[All]';
export const EMPTY_VALUE_DISPLAY = '[blank]';
export function getFilterValuesAsArray(filter: Filter.IFilter, blankValue?: string): any[] {
    let values = [],
        rawValues;
    const rawValue = filter.getValue();

    if (Array.isArray(rawValue)) {
        rawValues = [...rawValue];
    } else if (typeof rawValue === 'string') {
        rawValues = rawValue.split(';');
    } else rawValues = [rawValue];

    rawValues.forEach(v => {
        values.push(v == '' ? blankValue ?? EMPTY_VALUE_DISPLAY : v);
    });

    return values;
}

export function getFieldFilterKey(fieldFilter: FieldFilter, schemaQuery?: SchemaQuery): string {
    return schemaQuery.schemaName + '|' + schemaQuery.queryName + '|' + fieldFilter.fieldKey;
}

export function getFieldFiltersValidationResult(
    dataTypeFilters: { [key: string]: FieldFilter[] },
    queryLabels?: { [key: string]: string }
): string {
    let errorMsg = 'Invalid/incomplete filter values. Please correct input for fields. ',
        hasError = false,
        parentFields = {};
    Object.keys(dataTypeFilters).forEach(parent => {
        const filters = dataTypeFilters[parent];
        filters.forEach(fieldFilter => {
            const filter = fieldFilter.filter;
            if (filter.getFilterType().isDataValueRequired()) {
                const value = filter.getValue();
                const isBetween = isBetweenOperator(filter.getFilterType().getURLSuffix());

                let fieldError = false;
                if (value === undefined || value === null) {
                    fieldError = true;
                } else if (isBetween) {
                    if (!Array.isArray(value) || value.length < 2) fieldError = true;
                }

                if (fieldError == true) {
                    hasError = true;
                    const fields = parentFields[parent] ?? [];
                    fields.push(fieldFilter.fieldCaption);
                    parentFields[parent] = fields;
                }
            }
        });
    });

    if (hasError) {
        Object.keys(parentFields).forEach(parent => {
            const parentLabel = queryLabels?.[parent] ?? parent;
            errorMsg += parentLabel + ': ' + parentFields[parent].join(', ') + '. ';
        });
        return errorMsg;
    }

    return null;
}

export function getUpdateFilterExpressionFilter(
    newFilterType: FieldFilterOption,
    field?: QueryColumn,
    previousFirstFilterValue?: any,
    previousSecondFilterValue?: any,
    newFilterValue?: any,
    isSecondValue?: boolean,
    clearBothValues?: boolean
): Filter.IFilter {
    if (!newFilterType) {
        return null;
    }

    const filterType = resolveFilterType(newFilterType?.value, field);
    if (!filterType) return null;

    let filter: Filter.IFilter;

    if (!newFilterType.valueRequired) {
        filter = Filter.create(resolveFieldKey(field.name, field), null, filterType);
    } else {
        let value = newFilterValue;
        if (newFilterType?.betweenOperator) {
            if (clearBothValues) {
                value = null;
            } else if (isSecondValue) {
                if (newFilterValue == null) value = previousFirstFilterValue != null ? previousFirstFilterValue : '';
                else value = (previousFirstFilterValue != null ? previousFirstFilterValue + ',' : '') + newFilterValue;
            } else {
                if (newFilterValue == null) value = previousSecondFilterValue != null ? previousSecondFilterValue : '';
                else
                    value = newFilterValue + (previousSecondFilterValue != null ? ',' + previousSecondFilterValue : '');
            }
        } else if (!value && field.jsonType === 'boolean') value = 'false';

        filter = Filter.create(resolveFieldKey(field.name, field), value, filterType);
    }

    return filter;
}

// this util is only for string field type
export function getCheckedFilterValues(filter: Filter.IFilter, allValues: string[]): string[] {
    if (!filter || !allValues)
        // if no existing filter, check all values by default
        return allValues;

    const filterUrlSuffix = filter.getFilterType().getURLSuffix();
    const filterValues = getFilterValuesAsArray(filter);

    switch (filterUrlSuffix) {
        case '':
        case 'any':
            return allValues;
        case 'isblank':
            return [EMPTY_VALUE_DISPLAY];
        case 'isnonblank':
            return allValues.filter(value => value !== EMPTY_VALUE_DISPLAY && value !== ALL_VALUE_DISPLAY);
        case 'neq':
        case 'neqornull':
            return allValues.filter(value => value !== filterValues[0] && value !== ALL_VALUE_DISPLAY);
        case 'eq':
        case 'in':
            return filterValues;
        case 'notin':
            return allValues.filter(value => filterValues.indexOf(value) === -1 && value !== ALL_VALUE_DISPLAY);
        default:
            return [];
    }
}

export function getUpdatedCheckedValues(
    allValues: string[],
    newValue: string,
    check: boolean,
    oldFilter: Filter.IFilter,
    uncheckOthers?: boolean
): string[] {
    if (uncheckOthers) return [newValue];

    const oldCheckedValues = getCheckedFilterValues(oldFilter, allValues);
    let newCheckedValues = [...oldCheckedValues];
    if (check) {
        if (newCheckedValues.indexOf(newValue) === -1) newCheckedValues.push(newValue);
        if (allValues.length - newCheckedValues.length === 1) {
            if (newCheckedValues.indexOf(ALL_VALUE_DISPLAY) === -1) newCheckedValues.push(ALL_VALUE_DISPLAY);
        }
    } else {
        newCheckedValues = newCheckedValues.filter(val => val !== newValue && val !== ALL_VALUE_DISPLAY);
    }

    return newCheckedValues;
}
// this util is only for string field type
export function getUpdatedChooseValuesFilter(
    allValues: string[],
    fieldKey: string,
    newValue: string,
    check: boolean,
    oldFilter: Filter.IFilter,
    uncheckOthers?: /* click on the row but not on the checkbox would check the row value and uncheck everything else*/ boolean
): Filter.IFilter {
    // if check all, or everything is checked
    if (newValue === ALL_VALUE_DISPLAY && check) return Filter.create(fieldKey, null, Filter.Types.HAS_ANY_VALUE);

    const newCheckedDisplayValues = getUpdatedCheckedValues(allValues, newValue, check, oldFilter, uncheckOthers);
    const newUncheckedDisplayValue = allValues.filter(val => newCheckedDisplayValues.indexOf(val) === -1);

    const newCheckedValues = [];
    const newUncheckedValues = [];

    newCheckedDisplayValues.forEach(v => {
        newCheckedValues.push(v === EMPTY_VALUE_DISPLAY ? '' : v);
    });
    newUncheckedDisplayValue
        .filter(v => v !== ALL_VALUE_DISPLAY)
        .forEach(v => {
            newUncheckedValues.push(v === EMPTY_VALUE_DISPLAY ? '' : v);
        });

    // if everything is checked
    if ((newValue === ALL_VALUE_DISPLAY && check) || newCheckedValues.length === allValues.length)
        return Filter.create(fieldKey, null, Filter.Types.HAS_ANY_VALUE);

    // if uncheck all or if everything is unchecked, create a new NOTANY filter type
    if ((newValue === ALL_VALUE_DISPLAY && !check) || newCheckedValues.length === 0)
        return Filter.create(fieldKey, null, NOT_ANY_FILTER_TYPE);

    // if only one is checked
    if (newCheckedValues.length === 1) {
        if (newCheckedValues[0] === '') return Filter.create(fieldKey, null, Filter.Types.ISBLANK);

        return Filter.create(fieldKey, newCheckedValues[0]);
    }

    // if only one is unchecked
    if (newUncheckedValues.length === 1) {
        if (newUncheckedValues[0] === '') return Filter.create(fieldKey, null, Filter.Types.NONBLANK);

        return Filter.create(fieldKey, newUncheckedValues[0], Filter.Types.NEQ_OR_NULL);
    }

    // if number of checked is greater than unchecked, use Not_In unchecked
    if (newCheckedValues.length > newUncheckedValues.length) {
        return Filter.create(fieldKey, newUncheckedValues, Filter.Types.NOT_IN);
    }

    return Filter.create(fieldKey, newCheckedValues, Filter.Types.IN);
}
