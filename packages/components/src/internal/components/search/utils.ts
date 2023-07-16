import { Filter, Utils, Query } from '@labkey/api';

import { JsonType } from '../domainproperties/PropDescType';

import { isSamplesSchema } from '../samples/utils';
import { SCHEMAS } from '../../schemas';

import { resolveFilterType } from '../../../public/QueryModel/grid/actions/Filter';
import { QueryColumn } from '../../../public/QueryColumn';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { CONCEPT_COLUMN_FILTER_TYPES } from '../../query/filter';

import { QueryInfo } from '../../../public/QueryInfo';

import { isOntologyEnabled } from '../../app/utils';

import { REGISTRY_KEY } from '../../app/constants';

import { SearchScope } from './constants';
import { FieldFilter, FieldFilterOption, FilterSelection, SearchResultCardData } from './models';

export const SAMPLE_FILTER_METRIC_AREA = 'sampleFinder';

const CHOOSE_VALUE_FILTERS = [
    Filter.Types.EQUAL.getURLSuffix(),
    Filter.Types.IN.getURLSuffix(),
    Filter.Types.NEQ.getURLSuffix(),
    Filter.Types.NEQ_OR_NULL.getURLSuffix(),
    Filter.Types.NOT_IN.getURLSuffix(),
];

export function isBetweenOperator(urlSuffix: string): boolean {
    return ['between', 'notbetween'].indexOf(urlSuffix) > -1;
}

export const FILTER_URL_SUFFIX_ANY_ALT = 'any';

export function getFilterOptionsForType(field: QueryColumn): FieldFilterOption[] {
    if (!field) return null;

    const jsonType = field.getDisplayFieldJsonType() as JsonType;

    const useConceptFilters = field.isConceptCodeColumn && isOntologyEnabled();

    const filterList = (
        useConceptFilters ? CONCEPT_COLUMN_FILTER_TYPES : Filter.getFilterTypesForType(jsonType)
    ).filter(function (result) {
        return Filter.Types.HAS_ANY_VALUE.getURLSuffix() !== result.getURLSuffix();
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
            isSoleFilter:
                urlSuffix === Filter.Types.EQUAL.getURLSuffix() ||
                urlSuffix === Filter.Types.ISBLANK.getURLSuffix() ||
                urlSuffix === Filter.Types.DATE_EQUAL.getURLSuffix(),
        } as FieldFilterOption;
    });
}

export function isFilterUrlSuffixMatch(suffix: string, filterType: Filter.IFilterType): boolean {
    if (suffix === 'any' && filterType.getURLSuffix() === '') return true;
    return suffix === filterType.getURLSuffix();
}

export function getFilterTypePlaceHolder(suffix: string): string {
    if (suffix === 'in' || suffix === 'notin' || suffix === 'containsoneof' || suffix === 'containsnoneof') {
        return 'Use semicolon or new line to separate entries';
    }

    return null;
}

export function isChooseValuesFilter(filter: Filter.IFilter): boolean {
    if (!filter) return;

    return CHOOSE_VALUE_FILTERS.indexOf(filter.getFilterType().getURLSuffix()) >= 0;
}

export const ALL_VALUE_DISPLAY = '[All]';
export const EMPTY_VALUE_DISPLAY = '[blank]';
export function getFilterValuesAsArray(filter: Filter.IFilter, blankValue?: string, checkNull = false): any[] {
    let values = [],
        rawValues;
    const rawValue = filter.getValue();

    if (checkNull && rawValue === null) return [];

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

export function getFieldFiltersValidationResult(
    dataTypeFilters: { [key: string]: FieldFilter[] },
    queryLabels?: { [key: string]: string }
): string {
    let parentFields = {},
        hasError = false;
    Object.keys(dataTypeFilters).forEach(parent => {
        const filters = dataTypeFilters[parent];
        filters.forEach(fieldFilter => {
            const filter = fieldFilter.filter;
            if (filter.getFilterType().isDataValueRequired()) {
                const value = filter.getValue();
                const isBetween = isBetweenOperator(filter.getFilterType().getURLSuffix());

                let fieldError = false;
                if (value === undefined || value === null || (Utils.isString(value) && !value)) {
                    fieldError = true;
                } else if (isBetween) {
                    if (!Array.isArray(value) || value.length < 2) {
                        fieldError = true;
                    } else {
                        if ((Utils.isString(value[0]) && !value[0]) || (Utils.isString(value[1]) && !value[1])) {
                            fieldError = true;
                        }
                    }
                }

                if (fieldError == true) {
                    hasError = true;
                    const fields = parentFields[parent] ?? [];
                    if (fields.indexOf(fieldFilter.fieldCaption) === -1) {
                        fields.push(fieldFilter.fieldCaption);
                        parentFields[parent] = fields;
                    }
                }
            }
        });
    });

    if (hasError) {
        const parentMsgs = [];
        Object.keys(parentFields).forEach(parent => {
            const parentLabel = queryLabels?.[parent];
            parentMsgs.push((parentLabel ? parentLabel + ': ' : '') + parentFields[parent].join(', '));
        });
        return 'Missing filter values for: ' + parentMsgs.join('; ') + '.';
    }

    return null;
}

export function getFilterForFilterSelection(filterSelection: FilterSelection, field: QueryColumn): Filter.IFilter {
    return getUpdateFilterExpressionFilter(
        filterSelection.filterType,
        field,
        filterSelection.firstFilterValue,
        filterSelection.secondFilterValue,
        filterSelection.firstFilterValue,
        false,
        false
    );
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

    const fieldKey = field.getDisplayFieldKey();
    if (!newFilterType.valueRequired) {
        filter = Filter.create(fieldKey, null, filterType);
    } else {
        let value = newFilterValue;
        if (newFilterType?.betweenOperator) {
            if (clearBothValues) {
                value = null;
            } else if (isSecondValue) {
                if (newFilterValue == null) {
                    value = previousFirstFilterValue != null ? previousFirstFilterValue : '';
                } else {
                    value = (previousFirstFilterValue != null ? previousFirstFilterValue + ',' : '') + newFilterValue;
                }
            } else {
                if (newFilterValue == null) {
                    value = previousSecondFilterValue != null ? previousSecondFilterValue : '';
                } else {
                    value = newFilterValue + (previousSecondFilterValue != null ? ',' + previousSecondFilterValue : '');
                }
            }
        } else if (!value && field.getDisplayFieldJsonType() === 'boolean') {
            value = 'false';
        }

        filter = Filter.create(fieldKey, value, filterType);
    }

    return filter;
}

// this util is only for string field type
export function getCheckedFilterValues(filter: Filter.IFilter, allValues: string[]): string[] {
    if (!filter && !allValues) return [];

    // if allValues is undefined, then we don't know the full set of values so filter must be an Equals/Equals one of
    if (!allValues) return getFilterValuesAsArray(filter, undefined, true);

    // if no existing filter, check all values by default
    if (!filter) return allValues;
    if (filter.getFilterType().isDataValueRequired() && filter.getValue() == null) return allValues;

    const filterUrlSuffix = filter.getFilterType().getURLSuffix();
    const filterValues = getFilterValuesAsArray(filter);
    const hasBlank = allValues.findIndex(value => value === EMPTY_VALUE_DISPLAY) !== -1;

    switch (filterUrlSuffix) {
        case '':
        case 'any':
            return allValues;
        case 'isblank':
            return [EMPTY_VALUE_DISPLAY];
        case 'isnonblank':
            return hasBlank
                ? allValues.filter(value => value !== EMPTY_VALUE_DISPLAY && value !== ALL_VALUE_DISPLAY)
                : allValues;
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
        if (allValues && allValues.length - newCheckedValues.length === 1) {
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
    const hasBlank = allValues ? allValues.findIndex(value => value === EMPTY_VALUE_DISPLAY) !== -1 : false;
    // if check all, or everything is checked, this is essentially "no filter", unless there is no blank value
    // then it's an NONBLANK filter
    if (newValue === ALL_VALUE_DISPLAY && check) {
        return hasBlank ? null : Filter.create(fieldKey, null, Filter.Types.NONBLANK);
    }

    const newCheckedDisplayValues = getUpdatedCheckedValues(allValues, newValue, check, oldFilter, uncheckOthers);

    const newCheckedValues = [];

    newCheckedDisplayValues.forEach(v => {
        newCheckedValues.push(v === EMPTY_VALUE_DISPLAY ? '' : v);
    });

    // if everything is checked, this is the same as not filtering
    if ((newValue === ALL_VALUE_DISPLAY && check) || (allValues && newCheckedValues.length === allValues.length)) {
        return null;
    }

    // if uncheck all or if everything is unchecked, create a new NOTANY filter type
    if ((newValue === ALL_VALUE_DISPLAY && !check) || newCheckedValues.length === 0)
        return Filter.create(fieldKey, null, NOT_ANY_FILTER_TYPE);

    // if only one is checked
    if (newCheckedValues.length === 1) {
        if (newCheckedValues[0] === '') return Filter.create(fieldKey, null, Filter.Types.ISBLANK);

        return Filter.create(fieldKey, newCheckedValues[0]);
    }

    // using anything but an in clause only applies if we know all the values
    if (allValues) {
        const newUncheckedDisplayValue = allValues.filter(val => newCheckedDisplayValues.indexOf(val) === -1);
        const newUncheckedValues = [];
        newUncheckedDisplayValue
            .filter(v => v !== ALL_VALUE_DISPLAY)
            .forEach(v => {
                newUncheckedValues.push(v === EMPTY_VALUE_DISPLAY ? '' : v);
            });

        // if only one is unchecked
        if (newUncheckedValues.length === 1) {
            if (newUncheckedValues[0] === '') return Filter.create(fieldKey, null, Filter.Types.NONBLANK);

            return Filter.create(fieldKey, newUncheckedValues[0], Filter.Types.NEQ_OR_NULL);
        }

        // if number of checked is greater than unchecked, use Not_In unchecked
        if (newCheckedValues.length > newUncheckedValues.length) {
            return Filter.create(fieldKey, newUncheckedValues, Filter.Types.NOT_IN);
        }
    }

    return Filter.create(fieldKey, newCheckedValues, Filter.Types.IN);
}

export function isValidFilterField(
    field: QueryColumn,
    queryInfo: QueryInfo,
    exprColumnsWithSubSelect?: string[]
): boolean {
    // cannot include fields that are not supported by the database
    if (
        !queryInfo.supportGroupConcatSubSelect &&
        exprColumnsWithSubSelect &&
        exprColumnsWithSubSelect.indexOf(field.fieldKey) !== -1
    ) {
        return false;
    }

    // exclude the storage Units field for sample types since the display of this field is nonstandard and it is not
    // a useful field for filtering parent values
    if (isSamplesSchema(queryInfo.schemaQuery) && field?.fieldKey === 'Units') {
        return false;
    }

    return true;
}

export function getFilterSelections(
    fieldFilters: Filter.IFilter[],
    filterOptions: FieldFilterOption[]
): FilterSelection[] {
    const filters = [];
    fieldFilters?.forEach(fieldFilter => {
        const filterOption = filterOptions?.find(option => {
            return isFilterUrlSuffixMatch(option.value, fieldFilter.getFilterType());
        });

        if (filterOption) {
            const filter: FilterSelection = {
                filterType: filterOption,
            };

            const values = getFilterValuesAsArray(fieldFilter, '');
            if (filterOption.betweenOperator) {
                filter.firstFilterValue = values[0];
                filter.secondFilterValue = values[1];
            } else if (values.length > 1) {
                filter.firstFilterValue = values.join(';');
            } else {
                filter.firstFilterValue = values[0];
            }
            filters.push(filter);
        }
    });
    if (filters.length == 0) {
        const filterOption = filterOptions?.find(option => {
            return isFilterUrlSuffixMatch(option.value, Filter.Types.CONTAINS);
        });
        if (filterOption) {
            filters.push({
                filterType: filterOption,
            });
        }
    }
    return filters;
}

export function getUpdatedFilters(
    field: QueryColumn,
    activeFilters: FilterSelection[],
    filterIndex: number,
    newFilterType: FieldFilterOption,
    newFilterValue?: any,
    isSecondValue?: boolean,
    clearBothValues?: boolean
): Filter.IFilter[] {
    const newFilter = getUpdateFilterExpressionFilter(
        newFilterType,
        field,
        activeFilters[filterIndex]?.firstFilterValue,
        activeFilters[filterIndex]?.secondFilterValue,
        newFilterValue,
        isSecondValue,
        clearBothValues
    );
    let newFilters = [];
    if (!newFilter) {
        if (activeFilters.length > 1) {
            // retain the other filter
            newFilters = [getFilterForFilterSelection(activeFilters[filterIndex == 1 ? 0 : 1], field)];
        }
    } else {
        if (newFilterType.isSoleFilter) {
            newFilters = [newFilter];
        } else {
            if (filterIndex === 1) {
                newFilters = [getFilterForFilterSelection(activeFilters[0], field), newFilter];
            } else {
                newFilters =
                    activeFilters.length <= 1
                        ? [newFilter]
                        : [newFilter, getFilterForFilterSelection(activeFilters[1], field)];
            }
        }
    }
    return newFilters;
}

export function getUpdatedFilterSelection(
    newActiveFilterType: FieldFilterOption,
    activeFilter: FilterSelection
): { filterSelection: FilterSelection; shouldClear: boolean } {
    let firstValue = activeFilter?.firstFilterValue;
    let shouldClear = false;

    // when a value is required, we want to start with 'undefined' instead of 'null' since 'null' is seen as a valid value
    if (
        (newActiveFilterType?.valueRequired && !activeFilter?.filterType.valueRequired) ||
        (activeFilter?.filterType?.multiValue && !newActiveFilterType?.multiValue)
    ) {
        firstValue = undefined;
        shouldClear = true;
    } else if (!newActiveFilterType?.valueRequired) {
        // if value is not required, then we'll start with null
        firstValue = null;
        shouldClear = true;
    }
    return {
        shouldClear,
        filterSelection: {
            filterType: newActiveFilterType,
            firstFilterValue: firstValue,
            secondFilterValue: shouldClear ? undefined : activeFilter?.secondFilterValue,
        },
    };
}

export function getSearchScopeFromContainerFilter(cf: Query.ContainerFilter): SearchScope {
    switch (cf) {
        case Query.ContainerFilter.allFolders:
            return SearchScope.All;
        case Query.ContainerFilter.current:
            return SearchScope.Folder;
        case Query.ContainerFilter.currentAndParents:
            return SearchScope.FolderAndProject; // TODO: I dont think this is a perfect match
        case Query.ContainerFilter.currentAndSubfoldersPlusShared:
            return SearchScope.FolderAndSubfoldersAndShared;
        case Query.ContainerFilter.currentPlusProject:
            return SearchScope.FolderAndProject;
        case Query.ContainerFilter.currentPlusProjectAndShared:
            return SearchScope.FolderAndProjectAndShared;
        case Query.ContainerFilter.currentAndFirstChildren: // TODO: I dont think this is a perfect match
        case Query.ContainerFilter.currentAndSubfolders:
        default:
            return SearchScope.FolderAndSubfolders;
    }
}

export function getSearchResultCardData(data, category, queryMetadata?: any): SearchResultCardData {
    if (data) {
        const dataName = data.name;
        if (data.dataClass?.name) {
            if (data.dataClass.category === 'sources') {
                return {
                    iconSrc: 'sources',
                    category: 'Sources',
                    title: dataName,
                };
            }
        } else if (data.type) {
            const type = data.type;
            if (type === 'sampleSet') {
                return {
                    iconSrc:
                        queryMetadata?.getIn([
                            'schema',
                            SCHEMAS.SAMPLE_SETS.SCHEMA,
                            'query',
                            data['name'].toLowerCase(),
                            'iconURL',
                        ]) || 'sample_set',
                    altText: 'sample_type-icon',
                    category: 'Sample Type',
                    title: dataName,
                };
            } else if (type.indexOf('dataClass') === 0) {
                const parts = type.split(':');
                if (parts.length == 1 || (parts.length > 1 && parts[1].toLowerCase() !== REGISTRY_KEY)) {
                    return {
                        altText: 'source_type-icon',
                        iconSrc: 'source_type',
                        category: 'Source Type',
                        title: dataName,
                    };
                } else {
                    return {
                        altText: 'source_type-icon',
                        iconSrc: data.name.toLowerCase(),
                        category: 'Registry Source Type',
                    };
                }
            } else if (type === 'assay') {
                return { category: 'Assay' };
            }
        } else if (data.sampleSet?.name) {
            const sampleSetName = data.sampleSet.name.toLowerCase();

            return {
                iconSrc:
                    queryMetadata?.getIn(['schema', SCHEMAS.SAMPLE_SETS.SCHEMA, 'query', sampleSetName, 'iconURL']) ||
                    'samples',
                altText: 'sample_type-icon',
                category: 'Sample Type',
                title: dataName,
            };
        } else if (category === 'material') {
            return {
                category: 'Sample',
                title: dataName,
            };
        }
    } else {
        if (category === 'workflowJob') {
            return { category: 'Job' };
        } else if (category === 'assay') {
            return { category: 'Assay' };
        }
    }

    return {};
}

export const decodeErrorMessage = (msg: string): string => {
    if (!msg) return msg;

    let decodedMsg = msg
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#039;/g, "'");
    if (decodedMsg.charAt(decodedMsg.length - 1) != '.') decodedMsg += '.';
    return decodedMsg;
};
