import React, { FC, memo, useCallback, useMemo } from 'react';

import { ActionURL, Filter } from '@labkey/api';

import { AppURL } from '../../url/AppURL';
import { FIND_SAMPLES_BY_FILTER_KEY } from '../../app/constants';
import { DisableableMenuItem } from '../samples/DisableableMenuItem';
import { formatDateTime } from '../../util/Date';
import { getPrimaryAppProperties } from '../../app/utils';
import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';
import { isValidFilterField } from '../search/utils';
import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { FieldFilter } from '../search/models';

import { useAppContext } from '../../AppContext';
import { ResponsiveMenuButton } from '../buttons/ResponsiveMenuButton';

import { getSelectedDataDeprecated } from '../../actions';
import { caseInsensitive } from '../../util/utils';

import { EntityDataType, FilterProps } from './models';

export const SAMPLE_FINDER_SESSION_PREFIX = 'Searched ';

const MAX_SELECTION = 200;
const DISABLED_FIND_DERIVATIVES_MSG =
    'Unable to find derivative samples using search filters or filters on multi-valued lookup fields';

export function getSampleFinderLocalStorageKey(): string {
    return getPrimaryAppProperties().productId + ActionURL.getContainer() + '-SampleFinder';
}

export function isValidFilterFieldSampleFinder(
    field: QueryColumn,
    queryInfo: QueryInfo,
    exprColumnsWithSubSelect?: string[]
): boolean {
    if (!isValidFilterField(field, queryInfo, exprColumnsWithSubSelect)) return false;

    // also exclude multiValue lookups (MVFKs)
    return !field.multiValue;
}

// exported for unit test coverage
export const getFieldFilter = (model: QueryModel, filter: Filter.IFilter): FieldFilter => {
    const colName = filter.getColumnName();
    const column = model.getColumn(colName);

    return {
        fieldKey: colName,
        fieldCaption: column?.caption ?? colName,
        filter,
        jsonType: column?.isLookup() ? column.displayFieldJsonType : (column?.jsonType ?? 'string'),
    } as FieldFilter;
};

// exported for unit test coverage
export const getSessionSearchFilterProps = async (
    entityDataType: EntityDataType,
    model: QueryModel,
    filters: Filter.IFilter[],
    baseEntityDataType?: EntityDataType,
    baseModel?: QueryModel,
    baseFilter?: Filter.IFilter[]
): Promise<FilterProps[]> => {
    let fieldFilters = [];
    // optionally include baseFilter when passed without a baseModel (i.e. apply to the same schemaQuery as the other filters)
    if (baseFilter && !baseModel) {
        fieldFilters = fieldFilters.concat(baseFilter.map(filter => getFieldFilter(model, filter)));
    }
    // always include viewFilters and user defined filters (filterArray)
    fieldFilters = fieldFilters.concat(filters.map(filter => getFieldFilter(model, filter)));

    // Issue 47087: if model has selections, include those as IN clause
    if (model.hasSelections && model.queryInfo.pkCols?.length === 1 && model.queryInfo.titleColumn) {
        const pkCol = model.queryInfo.getPkCols()[0];
        const titleCol = model.queryInfo.getColumn(model.queryInfo.titleColumn);

        const selectedData = await getSelectedDataDeprecated(
            model.schemaName,
            model.queryName,
            Array.from(model.selections),
            [pkCol.fieldKey, titleCol.fieldKey],
            undefined,
            model.queryParameters,
            model.viewName,
            pkCol.fieldKey
        );
        const selectedValues = [];
        selectedData.data.forEach(row => {
            selectedValues.push(caseInsensitive(row.toJS(), titleCol.fieldKey).value);
        });

        fieldFilters.push({
            fieldKey: titleCol.fieldKey,
            fieldCaption: 'Selection',
            filter: Filter.create(titleCol.fieldKey, selectedValues, Filter.Types.IN),
            jsonType: titleCol.jsonType,
        });
    }

    const filterProps = [];
    if (baseModel && baseFilter) {
        filterProps.push({
            schemaQuery: baseModel.schemaQuery,
            filterArray: baseFilter.map(filter => getFieldFilter(baseModel, filter)),
            entityDataType: baseEntityDataType,
            dataTypeDisplayName: baseModel.title ?? baseModel.queryInfo.title ?? baseModel.queryName,
        });
    }
    filterProps.push({
        schemaQuery: model.schemaQuery,
        filterArray: fieldFilters,
        entityDataType,
        dataTypeDisplayName: model.title ?? model.queryInfo.title ?? model.queryName,
    });

    return filterProps;
};

function filterToJson(filter: Filter.IFilter): string {
    if (!filter) return;
    return encodeURIComponent(filter.getURLParameterName()) + '=' + encodeURIComponent(filter.getURLParameterValue());
}

export function getSearchFilterObjs(filterProps: FilterProps[]): any[] {
    const filterPropsObj = [];

    filterProps.forEach(filterProp => {
        const filterPropObj = { ...filterProp };
        delete filterPropObj['entityDataType'];
        // don't persist the entire entitydatatype
        filterPropObj['sampleFinderCardType'] = filterProp.entityDataType.sampleFinderCardType;

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

        filterPropsObj.push(filterPropObj);
    });

    return filterPropsObj;
}

export function searchFiltersToJson(
    filterProps: FilterProps[],
    filterChangeCounter: number,
    time?: Date,
    timezone?: string
): string {
    return JSON.stringify({
        filters: getSearchFilterObjs(filterProps),
        filterChangeCounter,
        filterTimestamp: SAMPLE_FINDER_SESSION_PREFIX + formatDateTime(time ?? new Date(), timezone),
    });
}

interface Props {
    asSubMenu?: boolean;
    baseEntityDataType?: EntityDataType;
    baseFilter?: Filter.IFilter[];
    baseModel?: QueryModel;
    entityDataType: EntityDataType;
    metricFeatureArea?: string;
    model: QueryModel;
}

export const FindDerivativesMenuItem: FC<Props> = memo(props => {
    const { baseEntityDataType, baseModel, baseFilter, model, entityDataType, metricFeatureArea } = props;
    const { api } = useAppContext();

    const viewAndUserFilters = useMemo(
        () => (!model.queryInfo ? [] : [].concat(model.viewFilters).concat(model.filterArray)),
        [model]
    );
    const invalidFilterNames = useMemo(
        () =>
            viewAndUserFilters
                .map(filter => {
                    const colName = filter.getColumnName();
                    const column = model.getColumn(colName);
                    if (!column) {
                        return colName === '*' ? 'Search Filter' : 'Unknown Field';
                    }

                    return !isValidFilterFieldSampleFinder(column, model.queryInfo) ? column.caption : undefined;
                })
                .filter(caption => caption !== undefined)
                .join(', '),
        [model, viewAndUserFilters]
    );

    const onClick = useCallback(async () => {
        const currentTimestamp = new Date();
        const sessionViewName = SAMPLE_FINDER_SESSION_PREFIX + formatDateTime(currentTimestamp);
        const filterProps = await getSessionSearchFilterProps(
            entityDataType,
            model,
            viewAndUserFilters,
            baseEntityDataType,
            baseModel,
            baseFilter
        );

        sessionStorage.setItem(getSampleFinderLocalStorageKey(), searchFiltersToJson(filterProps, 0, currentTimestamp));
        api.query.incrementClientSideMetricCount(metricFeatureArea, 'sampleFinderFindDerivatives');

        window.location.href = AppURL.create('search', FIND_SAMPLES_BY_FILTER_KEY)
            .addParam('view', sessionViewName)
            .toHref();
    }, [api.query, baseFilter, baseModel, entityDataType, metricFeatureArea, model, viewAndUserFilters]);

    if (!model.queryInfo) return null;

    const validSelection = !model.selections?.size || model.selections.size <= MAX_SELECTION;
    const disabled = !validSelection || invalidFilterNames !== '';
    const disabledMessage = !validSelection
        ? 'At most ' + MAX_SELECTION + ' can be selected'
        : DISABLED_FIND_DERIVATIVES_MSG + ' (' + invalidFilterNames + ').';

    return (
        <DisableableMenuItem disabled={disabled} disabledMessage={disabledMessage} onClick={onClick} placement="right">
            Find Derivatives in Sample Finder
        </DisableableMenuItem>
    );
});

export const FindDerivativesButton: FC<Props> = memo(props => {
    return (
        <ResponsiveMenuButton className="sample-reports-menu" text="Reports" asSubMenu={props.asSubMenu}>
            <FindDerivativesMenuItem {...props} />
        </ResponsiveMenuButton>
    );
});
