import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';
import classNames from 'classnames';

import { Filter, Query } from '@labkey/api';

import { EntityDataType } from '../entities/models';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { ChoicesListItem } from '../base/ChoicesListItem';

import { QueryColumn } from '../../../public/QueryColumn';
import { QueryInfo } from '../../../public/QueryInfo';

import { NOT_ANY_FILTER_TYPE } from '../../url/NotAnyFilterType';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../APIWrapper';

import { ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE } from '../../query/filter';

import { Tab, Tabs } from '../../Tabs';

import { FilterFacetedSelector } from './FilterFacetedSelector';
import { FilterExpressionView } from './FilterExpressionView';
import { FieldFilter } from './models';
import { isChooseValuesFilter } from './utils';

enum FieldFilterTabs {
    ChooseValues = 'ChooseValues',
    Filter = 'Filter',
}

const DEFAULT_VIEW_NAME = ''; // always use default view for selection, if none provided

interface Props {
    allowRelativeDateFilter?: boolean;
    altQueryName?: string;
    api?: ComponentsAPIWrapper;
    asRow?: boolean;
    emptyMsg?: string;
    // used for Sample Finder use case
    entityDataType?: EntityDataType;
    fieldKey?: string;
    fields?: QueryColumn[];
    filters: { [key: string]: FieldFilter[] };
    fullWidth?: boolean;
    hasNotInQueryFilter?: boolean;
    hasNotInQueryFilterLabel?: string;
    isAncestor?: boolean;
    metricFeatureArea?: string;
    onFilterUpdate: (field: QueryColumn, newFilters: Filter.IFilter[], index: number) => void;
    onHasNoValueInQueryChange?: (check: boolean) => void;
    queryInfo: QueryInfo;
    selectDistinctOptions?: Partial<Query.SelectDistinctOptions>;
    skipDefaultViewCheck?: boolean;
    validFilterField?: (field: QueryColumn, queryInfo: QueryInfo, exprColumnsWithSubSelect?: string[]) => boolean;
    viewName?: string;
}

export const QueryFilterPanel: FC<Props> = memo(props => {
    const {
        allowRelativeDateFilter,
        hasNotInQueryFilter,
        asRow,
        api = getDefaultAPIWrapper(),
        queryInfo,
        emptyMsg,
        skipDefaultViewCheck,
        validFilterField,
        entityDataType,
        fieldKey,
        filters,
        onFilterUpdate,
        metricFeatureArea,
        fullWidth,
        selectDistinctOptions,
        onHasNoValueInQueryChange,
        hasNotInQueryFilterLabel,
        altQueryName,
        fields,
        isAncestor,
    } = props;
    const [queryFields, setQueryFields] = useState<QueryColumn[]>(undefined);
    const [activeField, setActiveField] = useState<QueryColumn>(undefined);
    const [activeTab, setActiveTab] = useState<FieldFilterTabs>(undefined);

    const queryName = useMemo(() => queryInfo?.name.toLowerCase(), [queryInfo]);

    // for sample finder, assay data filters uses assay design name (part of schema key) instead of "data" (the query name) as query key
    const filterQueryKey = useMemo(() => {
        if (entityDataType && entityDataType.getInstanceDataType && queryInfo?.schemaQuery)
            return entityDataType.getInstanceDataType(queryInfo.schemaQuery, altQueryName)?.toLowerCase();
        return queryName;
    }, [queryInfo, entityDataType, queryName, altQueryName]);

    const viewName = useMemo(() => props.viewName ?? DEFAULT_VIEW_NAME, [props.viewName]);
    const allowFaceting = (col: QueryColumn): boolean => {
        return col?.allowFaceting() && col?.getDisplayFieldJsonType() === 'string'; // current plan is to only support facet for string fields, to reduce scope
    };

    const filterStatus = useMemo(() => {
        const status = {};
        if (!filters) return {};

        Object.keys(filters).forEach(parent => {
            const filterFields = filters[parent];
            filterFields.forEach(fieldFilter => {
                if (fieldFilter.filter.getFilterType() !== NOT_ANY_FILTER_TYPE) {
                    const key = parent.toLowerCase() + '-' + fieldFilter.fieldKey;
                    status[key] = true;
                }
            });
        });

        return status;
    }, [filters]);

    const hasFilters = useCallback(
        (field: QueryColumn) => {
            return filterStatus?.[filterQueryKey.toLowerCase() + '-' + field.resolveFieldKey()];
        },
        [filterStatus, filterQueryKey]
    );

    const getDefaultActiveTab = useCallback(
        (field: QueryColumn) => {
            if (!allowFaceting(field)) {
                return FieldFilterTabs.Filter;
            }
            if (!hasFilters(field)) {
                return FieldFilterTabs.ChooseValues;
            }
            const currentFieldFilters = filters[filterQueryKey].filter(
                filterField => filterField.fieldKey === field.resolveFieldKey()
            );
            if (currentFieldFilters.length > 1) {
                return FieldFilterTabs.Filter;
            }
            return isChooseValuesFilter(currentFieldFilters[0].filter)
                ? FieldFilterTabs.ChooseValues
                : FieldFilterTabs.Filter;
        },
        [hasFilters, filters, filterQueryKey]
    );

    useEffect(() => {
        setQueryFields(undefined);
        setActiveField(undefined);
        if (!queryInfo) return;

        let validFields;
        if (fields) validFields = fields;
        else {
            const qFields = skipDefaultViewCheck
                ? queryInfo.getAllColumns(viewName)
                : queryInfo.getDisplayColumns(viewName);
            validFields = qFields.filter(
                field =>
                    field.filterable &&
                    (!validFilterField || validFilterField(field, queryInfo, entityDataType?.exprColumnsWithSubSelect))
            );
        }

        setQueryFields(validFields);
        if (fieldKey) {
            const field = validFields.find(f => f.getDisplayFieldKey() === fieldKey);
            setActiveField(field);
        }
    }, [
        queryInfo,
        skipDefaultViewCheck,
        validFilterField,
        entityDataType?.exprColumnsWithSubSelect,
        fieldKey,
        viewName,
        fields,
    ]);

    useEffect(() => {
        if (activeField) setActiveTab(getDefaultActiveTab(activeField));
    }, [activeField]); // don't include getDefaultActiveTab as we only want this to be triggered when the field selection changes

    const activeFieldKey = useMemo(() => {
        return activeField?.getDisplayFieldKey();
    }, [activeField]);

    const currentFieldFilters = useMemo((): FieldFilter[] => {
        if (!filters || !activeField) return null;

        const activeQueryFilters: FieldFilter[] = filters[filterQueryKey];
        return activeQueryFilters?.filter(filter => filter.fieldKey === activeFieldKey);
    }, [activeField, filterQueryKey, filters, activeFieldKey]);

    const fieldDistinctValueFilters = useMemo(() => {
        if (!filters || !filterQueryKey || !activeField) return null;

        // Issue 45135: include any model filters (baseFilters or queryInfo filters)
        const valueFilters = selectDistinctOptions?.filterArray ? [...selectDistinctOptions.filterArray] : [];

        // use active filters to filter distinct values, but exclude filters on current field
        filters?.[filterQueryKey]?.forEach(field => {
            if (field.fieldKey !== activeFieldKey) {
                let filter = field.filter;
                // convert ancestor matches all to IN filter type for distinct value selection
                if (filter.getFilterType().getURLSuffix() === ANCESTOR_MATCHES_ALL_OF_FILTER_TYPE.getURLSuffix())
                    filter = Filter.create(filter.getColumnName(), filter.getValue(), Filter.Types.IN);
                valueFilters.push(filter);
            }
        });

        return valueFilters;
    }, [filters, filterQueryKey, activeField, activeFieldKey, selectDistinctOptions]);

    const onFieldClick = useCallback((queryColumn: QueryColumn) => {
        setActiveField(queryColumn);
    }, []);

    const onTabChange = useCallback(
        (tabKey: any) => {
            setActiveTab(tabKey);

            if (tabKey === FieldFilterTabs.ChooseValues) {
                api.query.incrementClientSideMetricCount(metricFeatureArea, 'goToChooseValuesTab');
            }
        },
        [api, metricFeatureArea]
    );
    const fieldsClassName = `col-xs-${fullWidth ? 12 : 6} col-sm-${
        fullWidth ? 4 : 3
    } field-modal__col filter-modal__col_fields`;
    const valuesClassName = `col-xs-12 col-sm-${fullWidth ? 8 : 6} field-modal__col filter-modal__col_filter_exp`;

    const body = (
        <>
            <div className={fieldsClassName}>
                <div className="field-modal__col-title">Fields</div>
                {!queryName && emptyMsg && <div className="field-modal__empty-msg">{emptyMsg}</div>}
                {queryName && (
                    <div className="list-group field-modal__col-content filter-modal__fields-col-content">
                        {!queryFields && <LoadingSpinner wrapperClassName="loading-spinner" />}
                        {entityDataType?.supportHasNoValueInQuery && (
                            <div className="form-check list-group-item">
                                <input
                                    className="form-check-input filter-faceted__checkbox"
                                    type="checkbox"
                                    name="field-value-nodata-check"
                                    onChange={event => onHasNoValueInQueryChange(event.target.checked)}
                                    checked={hasNotInQueryFilter}
                                />
                                <div className="filter-modal__fields-col-nodata-msg">
                                    {hasNotInQueryFilterLabel ?? 'Without data from this type'}
                                </div>
                            </div>
                        )}
                        <div
                            className={classNames({
                                'field-modal__col-content-disabled': hasNotInQueryFilter,
                            })}
                        >
                            {queryFields?.map((field, index) => {
                                const { caption } = field;
                                const currFieldKey = field.getDisplayFieldKey();
                                return (
                                    <ChoicesListItem
                                        active={currFieldKey === activeFieldKey}
                                        index={index}
                                        key={currFieldKey}
                                        label={caption}
                                        onSelect={() => onFieldClick(field)}
                                        componentRight={
                                            hasFilters(field) && <span className="pull-right field-modal__field_dot" />
                                        }
                                        disabled={hasNotInQueryFilter}
                                    />
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>
            <div className={valuesClassName}>
                <div className="field-modal__col-title">Values</div>
                {queryName && !activeField && <div className="field-modal__empty-msg">Select a field.</div>}
                {queryName && activeField && (
                    <div
                        className={classNames('field-modal__col-content field-modal__values', {
                            'field-modal__col-content-disabled': hasNotInQueryFilter,
                        })}
                    >
                        <Tabs activeKey={activeTab} className="field-modal__tabs content-tabs" onSelect={onTabChange}>
                            <Tab eventKey={FieldFilterTabs.Filter} title="Filter">
                                <div className="field-modal__col-sub-title">Find values for {activeField.caption}</div>
                                {activeTab === FieldFilterTabs.Filter && (
                                    <FilterExpressionView
                                        allowRelativeDateFilter={allowRelativeDateFilter}
                                        key={activeFieldKey}
                                        field={activeField}
                                        fieldFilters={currentFieldFilters?.map(filter => filter.filter)}
                                        onFieldFilterUpdate={(newFilters, index) =>
                                            onFilterUpdate(activeField, newFilters, index)
                                        }
                                        disabled={hasNotInQueryFilter}
                                        includeAllAncestorFilter={
                                            isAncestor && activeField?.fieldKey.toLowerCase() === 'name'
                                        }
                                    />
                                )}
                            </Tab>
                            {allowFaceting(activeField) && (
                                <Tab eventKey={FieldFilterTabs.ChooseValues} title="Choose values">
                                    <div className="field-modal__col-sub-title">
                                        Find values for {activeField.caption}
                                    </div>
                                    <FilterFacetedSelector
                                        selectDistinctOptions={{
                                            ...selectDistinctOptions,
                                            column: activeFieldKey,
                                            schemaName: queryInfo.schemaName,
                                            queryName,
                                            viewName,
                                            filterArray: fieldDistinctValueFilters,
                                        }}
                                        fieldFilters={currentFieldFilters?.map(filter => filter.filter)}
                                        fieldKey={activeFieldKey}
                                        canBeBlank={!activeField?.required && !activeField.nameExpression}
                                        key={activeFieldKey}
                                        onFieldFilterUpdate={(newFilters, index) =>
                                            onFilterUpdate(activeField, newFilters, index)
                                        }
                                        disabled={hasNotInQueryFilter}
                                    />
                                </Tab>
                            )}
                        </Tabs>
                    </div>
                )}
            </div>
        </>
    );

    if (asRow) {
        return <div className="row field-modal__container">{body}</div>;
    } else {
        return body;
    }
});

QueryFilterPanel.displayName = 'QueryFilterPanel';
