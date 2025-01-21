import { immerable, produce } from 'immer';
import { Filter, Query } from '@labkey/api';

import { GRID_CHECKBOX_OPTIONS, GRID_SELECTION_INDEX } from '../../internal/constants';

import { DataViewInfo } from '../../internal/DataViewInfo';
import { getQueryParams } from '../../internal/util/URL';

import { encodePart, SchemaQuery } from '../SchemaQuery';
import { QuerySort } from '../QuerySort';
import { isLoading, LoadingState } from '../LoadingState';
import { QueryInfo } from '../QueryInfo';
import { ViewInfo } from '../../internal/ViewInfo';
import { QueryColumn } from '../QueryColumn';
import { caseInsensitive } from '../../internal/util/utils';
import { naturalSortByProperty } from '../sort';
import { PaginationData } from '../../internal/components/pagination/Pagination';
import { SelectRowsOptions } from '../../internal/query/selectRows';

export function flattenValuesFromRow(row: any, keys: string[]): { [key: string]: any } {
    const values = {};
    if (row && keys) {
        keys.forEach((key: string) => {
            if (row[key]) {
                values[key] = row[key].value;
            }
        });
    }
    return values;
}

function offsetFromString(rowsPerPage: number, pageStr: string): number {
    if (pageStr === null) {
        return undefined;
    }

    let offset = 0;
    const page = parseInt(pageStr, 10);

    if (!isNaN(page)) {
        offset = (page - 1) * rowsPerPage;
    }

    return offset >= 0 ? offset : 0;
}

export function querySortFromString(sortStr: string): QuerySort {
    if (sortStr.startsWith('-')) {
        return new QuerySort({ dir: '-', fieldKey: sortStr.slice(1) });
    } else {
        return new QuerySort({ fieldKey: sortStr });
    }
}

function querySortsFromString(sortsStr: string): QuerySort[] {
    return sortsStr?.split(',').map(querySortFromString);
}

function searchFiltersFromString(searchStr: string): Filter.IFilter[] {
    return searchStr?.split(';').map(search => Filter.create('*', search, Filter.Types.Q));
}

/**
 * Returns true if a given location has queryParams that would conflict with savedSettings: filters, sorts, view,
 * page offset, pageSize.
 * @param prefix: the QueryModel prefix
 * @param searchParams: The URLSearchParams returned by the react-router useSearchParams hook
 */
export function locationHasQueryParamSettings(prefix: string, searchParams?: URLSearchParams): boolean {
    if (searchParams === undefined) return false;
    // Report
    if (searchParams.get(`${prefix}.reportId`) !== null) return true;
    // View
    if (searchParams.get(`${prefix}.view`) !== null) return true;
    // Search Filters
    if (searchParams.get(`${prefix}.q`) !== null) return true;
    // Column Filters
    if (Filter.getFiltersFromParameters(getQueryParams(searchParams), prefix).length > 0) return true;
    // Sorts
    if (searchParams.get(`${prefix}.sort`) !== null) return true;
    // Page offset
    if (searchParams.get(`${prefix}.p`) !== null) return true;
    // Page size
    return searchParams.get(`${prefix}.pageSize`) !== null;
}

/**
 * Creates a QueryModel ID for a given SchemaQuery. The id is just the SchemaQuery snake-cased as
 * schemaName.queryName.
 *
 * @param schemaQuery: SchemaQuery
 */
export function createQueryModelId(schemaQuery: SchemaQuery): string {
    const { schemaName, queryName } = schemaQuery;
    return `${schemaName}.${queryName}`;
}

const sortStringMapper = (s: QuerySort): string => s.toRequestString();

export interface GridMessage {
    area?: string;
    content: string;
    type?: string;
}

export interface QueryConfig {
    /**
     * An array of base [Filter.IFilter](https://labkey.github.io/labkey-api-js/interfaces/Filter.IFilter.html)
     * filters to be applied to the [[QueryModel]] data load. These base filters will be concatenated with URL filters,
     * the keyValue filter, and view filters when applicable.
     */
    baseFilters?: Filter.IFilter[];
    /**
     * Flag used to indicate whether filters/sorts/etc. should be persisted on the URL. Defaults to false.
     */
    bindURL?: boolean;
    /**
     * One of the values of [Query.ContainerFilter](https://labkey.github.io/labkey-api-js/enums/Query.ContainerFilter.html)
     * that sets the scope of this query. Defaults to ContainerFilter.current, and is interpreted relative to
     * config.containerPath.
     */
    containerFilter?: Query.ContainerFilter;
    /**
     * The path to the container in which the schema and query are defined, if different than the current container.
     * If not supplied, the current container's path will be used.
     */
    containerPath?: string;
    /**
     * An array of [Filter.IFilter](https://labkey.github.io/labkey-api-js/interfaces/Filter.IFilter.html)
     * filters to be applied to the QueryModel data load. These filters will be concatenated with base filters, URL filters,
     * they keyValue filter, and view filters when applicable.
     */
    readonly filterArray?: Filter.IFilter[];
    /**
     * Id value to use for referencing a given [[QueryModel]]. If not provided, one will be generated for this [[QueryModel]]
     * instance based on the [[SchemaQuery]] and keyValue where applicable.
     */
    id?: string;
    /**
     * Include the Details link column in the set of columns (defaults to false). If included, the column will
     * have the name "\~\~Details\~\~". The underlying table/query must support details links or the column will
     * be omitted in the response.
     */
    includeDetailsColumn?: boolean;
    /**
     * Include the total count in the query model via a second query to the server for this value.
     * This second query will be made in parallel with the initial query to get the model data.
     */
    includeTotalCount?: boolean;
    /**
     * Include the Update (or edit) link column in the set of columns (defaults to false). If included, the column
     * will have the name "\~\~Update\~\~". The underlying table/query must support update links or the column
     * will be omitted in the response.
     */
    includeUpdateColumn?: boolean;
    /**
     * Primary key value, used when loading/rendering details pages to get a single row of data in a [[QueryModel]].
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    keyValue?: any;
    /**
     * The maximum number of rows to return from the server (defaults to 100000).
     * If you want to return all possible rows, set this config property to -1.
     */
    maxRows?: number;
    /**
     * The index of the first row to return from the server (defaults to 0). Use this along with the
     * maxRows config property to request pages of data.
     */
    offset?: number;
    /**
     * Array of column names to be explicitly excluded from the column list in the [[QueryModel]] data load.
     */
    omittedColumns?: string[];
    /**
     * Query parameters used as input to a parameterized query.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    queryParameters?: { [key: string]: any };
    /**
     * Array of column names to be explicitly included in the column list in the [[QueryModel]] data load.
     */
    requiredColumns?: string[];
    /**
     * Request requiredColumns as "fields" property on query-getQueryDetails.api.
     * This will ensure the required columns are available on the queryInfo. Defaults to false.
     */
    requiredColumnsAsQueryInfoFields?: boolean;
    /**
     * Definition of the [[SchemaQuery]] (i.e. schema, query, and optionally view name) to use for the [[QueryModel]] data load.
     */
    schemaQuery: SchemaQuery;
    /**
     * The path to the container in which to make selection changes on the server.
     * If not supplied, the "containerPath" will be used.
     */
    selectionContainerPath?: string;
    /**
     * Array of [[QuerySort]] objects to use for the [[QueryModel]] data load.
     */
    sorts?: QuerySort[];
    /**
     * String value to use in grid panel header.
     */
    title?: string;
    /**
     * Prefix string value to use in url parameters when bindURL is true. Defaults to "query".
     */
    urlPrefix?: string;

    /**
     * If true we will load filters, sorts, pageSize, and viewName from localStorage when initially loading the model,
     * but only if there are no settings on the URL. Important: If you are using this flag you must ensure your grid id
     * is stable and unique. It must be stable between page loads/visits, or we won't be able to fetch the settings. It
     * must be unique, or we'll override settings for other grid models.
     */
    useSavedSettings?: boolean;
}

const DEFAULT_OFFSET = 0;
const DEFAULT_MAX_ROWS = 20;

/**
 * An object that describes the current selection pivot row for shift-select behavior. When a single row is selected
 * it becomes the "pivot" row for shift-select behavior. Subsequently, if a user selects another row while holding
 * the shift key then all rows between the pivot row and the newly selected row will be selected/deselected.
 */
export interface SelectionPivot {
    checked: boolean;
    selection: string;
}

/**
 * This is the base model used to store all the data for a query. At a high level the QueryModel API is a wrapper around
 * the [selectRows](https://labkey.github.io/labkey-api-js/modules/Query.html#selectRows) API.
 * If you need to retrieve data from a LabKey table or query, so you can render it in a React
 * component, then the QueryModel API is most likely what you want.
 *
 * This model stores some client-side only data as well as data retrieved from the server. You can manually instantiate a
 * QueryModel, but you will almost never do this, instead you will use the [[withQueryModels]] HOC to inject the needed
 * QueryModel(s) into your component. To create a QueryModel you will need to define a [[QueryConfig]] object. At a
 * minimum, your [[QueryConfig]] must have a valid [[SchemaQuery]], but we also support many other attributes that
 * allow you to configure the model before it is loaded, all of the attributes can be found on the [[QueryConfig]]
 * interface.
 */
export class QueryModel {
    /**
     * @hidden
     */
    [immerable] = true;

    // Fields from QueryConfig
    // Some of the fields we have in common with QueryConfig are not optional because we give them default values.
    /**
     * An array of base [Filter.IFilter](https://labkey.github.io/labkey-api-js/interfaces/Filter.IFilter.html)
     * filters to be applied to the QueryModel data load. These base filters will be concatenated with URL filters,
     * they keyValue filter, and view filters when applicable.
     */
    readonly baseFilters: Filter.IFilter[];
    /**
     * Flag used to indicate whether or not filters/sorts/etc. should be persisted on the URL. Defaults to false.
     */
    readonly bindURL: boolean;
    /**
     * One of the values of [Query.ContainerFilter](https://labkey.github.io/labkey-api-js/enums/Query.ContainerFilter.html)
     * that sets the scope of this query. Defaults to ContainerFilter.current, and is interpreted relative to
     * config.containerPath.
     */
    readonly containerFilter?: Query.ContainerFilter;
    /**
     * The path to the container in which the schema and query are defined, if different than the current container.
     * If not supplied, the current container's path will be used.
     */
    readonly containerPath?: string;
    /**
     * Id value to use for referencing a given QueryModel. If not provided, one will be generated for this QueryModel
     * instance based on the [[SchemaQuery]] and keyValue where applicable.
     */
    readonly id: string;
    /**
     * Include the Details link column in the set of columns (defaults to false). If included, the column will
     * have the name "\~\~Details\~\~". The underlying table/query must support details links or the column will
     * be omitted in the response.
     */
    readonly includeDetailsColumn: boolean;
    /**
     * Include the Update (or edit) link column in the set of columns (defaults to false). If included, the column
     * will have the name "\~\~Update\~\~". The underlying table/query must support update links or the column
     * will be omitted in the response.
     */
    readonly includeUpdateColumn: boolean;
    /**
     * Include the total count in the query model via a second query to the server for this value.
     * This second query will be made in parallel with the initial query to get the model data.
     */
    readonly includeTotalCount: boolean;
    /**
     * Primary key value, used when loading/rendering details pages to get a single row of data in a QueryModel.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly keyValue?: any;
    /**
     * The maximum number of rows to return from the server (defaults to 20).
     * If you want to return all possible rows, set this config property to -1.
     */
    readonly maxRows: number;
    /**
     * The index of the first row to return from the server (defaults to 0). Use this along with the
     * maxRows config property to request pages of data.
     */
    readonly offset: number;
    /**
     * Array of column names to be explicitly excluded from the column list in the QueryModel data load.
     */
    readonly omittedColumns: string[];
    /**
     * Query parameters used as input to a parameterized query.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly queryParameters?: { [key: string]: any };
    /**
     * Array of column names to be explicitly included from the column list in the QueryModel data load.
     */
    readonly requiredColumns: string[];
    /**
     * Request requiredColumns as "fields" property on query-getQueryDetails.api.
     * This will ensure the required columns are available on the queryInfo. Defaults to false.
     */
    readonly requiredColumnsAsQueryInfoFields?: boolean;
    /**
     * Definition of the [[SchemaQuery]] (i.e. schema, query, and optionally view name) to use for the QueryModel data load.
     */
    readonly schemaQuery: SchemaQuery;
    readonly selectionContainerPath?: string;
    /**
     * Array of [[QuerySort]] objects to use for the QueryModel data load.
     */
    readonly sorts: QuerySort[];
    /**
     * String value to use in grid panel header.
     */
    readonly title?: string;
    /**
     * Prefix string value to use in url parameters when bindURL is true. Defaults to "query".
     */
    readonly urlPrefix?: string;
    /**
     * If true we will load filters, sorts, pageSize, and viewName from localStorage when initially loading the model,
     * but only if there are no settings on the URL. Defaults to false. Important: If you are using this flag you must
     * ensure your grid id is stable and unique. It must be stable between page loads/visits, or we won't be able to
     * fetch the settings. It must be unique, or we'll override settings for other grid models.
     */
    useSavedSettings?: boolean;

    /**
     * An array of [Filter.IFilter](https://labkey.github.io/labkey-api-js/interfaces/Filter.IFilter.html)
     * filters to be applied to the QueryModel data load. These filters will be concatenated with base filters, URL filters,
     * they keyValue filter, and view filters when applicable.
     */
    readonly filterArray: Filter.IFilter[];
    // QueryModel only fields
    /**
     * Array of [[GridMessage]]. When used with a [[GridPanel]], these message will be shown above the table of data rows.
     */
    readonly messages?: GridMessage[];
    /**
     * Array of row key values in sort order from the loaded data rows object.
     */
    readonly orderedRows?: string[];
    /**
     * [[QueryInfo]] object for the given QueryModel.
     */
    readonly queryInfo?: QueryInfo;
    /**
     * Error message from API call to load the query info.
     */
    readonly queryInfoError?: string;
    /**
     * [[LoadingState]] for the API call to load the query info.
     */
    readonly queryInfoLoadingState: LoadingState;
    /**
     * Object containing the data rows loaded for the given QueryModel. The object key is the primary key value for the row
     * and the object values is the row values for the given key.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly rows?: { [key: string]: any };
    /**
     * The count of rows returned from the query for the given QueryModel. If includeTotalCount is true, this will
     * be the total count of rows for the query parameters.
     */
    readonly rowCount?: number;
    /**
     * Error message from API call to load the data rows.
     */
    readonly rowsError?: string;
    /**
     * [[LoadingState]] for the API call to load the data rows.
     */
    readonly rowsLoadingState: LoadingState;
    /**
     * ReportId, from the URL, to be used for showing a chart via the [[ChartMenu]].
     */
    readonly selectedReportId: string;
    /**
     * [[SelectionPivot]] object that describes the current selection pivot row for shift-select behavior.
     */
    readonly selectionPivot?: SelectionPivot;
    /**
     * Array of row keys for row selections in the QueryModel.
     */
    readonly selections?: Set<string>; // Note: ES6 Set is being used here, not Immutable Set.
    /**
     * Error message from API call to load the row selections.
     */
    readonly selectionsError?: string;
    /**
     * [[LoadingState]] for the API call to load the row selections.
     */
    readonly selectionsLoadingState: LoadingState;
    /**
     * Error message from API call to load the total count.
     */
    readonly totalCountError?: string;
    /**
     * [[LoadingState]] for the API call to load the total count.
     */
    readonly totalCountLoadingState: LoadingState;
    /**
     * Array of [[DataViewInfo]] objects that define the charts attached to the given QueryModel.
     */
    readonly charts: DataViewInfo[];
    /**
     * Error message from API call to load the chart definitions.
     */
    readonly chartsError: string;
    /**
     * [[LoadingState]] for the API call to load the chart definitions.
     */
    readonly chartsLoadingState: LoadingState;
    /**
     * Error message from initial API call to be retained for retry (i.e. for a requested view that does not exist or calculated field expressions causing errors).
     */
    readonly viewError: string;

    /**
     * Constructor which takes a [[QueryConfig]] definition and creates a new QueryModel, applying default values
     * to those properties not defined in the [[QueryConfig]]. Note that we default to the Details view if we have a
     * keyValue and the user hasn't specified a view.
     * @param queryConfig
     */
    constructor(queryConfig: QueryConfig) {
        const { schemaQuery, keyValue } = queryConfig;
        this.baseFilters = queryConfig.baseFilters ?? [];
        this.containerFilter = queryConfig.containerFilter;
        this.containerPath = queryConfig.containerPath;
        this.selectionContainerPath = queryConfig.selectionContainerPath ?? this.containerPath;

        // Even though this is a situation that we shouldn't be in due to the type annotations it's still possible
        // due to conversion from any, and it's best to have a specific error than an error due to undefined later
        // when we try to use the model during an API request.
        if (schemaQuery === undefined) {
            throw new Error('schemaQuery is required to instantiate a QueryModel');
        }

        // Default to the Details view if we have a keyValue and the user hasn't specified a view.
        // Note: this default may not be appropriate outside of Biologics/SM
        if (keyValue !== undefined && schemaQuery.viewName === undefined) {
            const { schemaName, queryName } = schemaQuery;
            this.schemaQuery = new SchemaQuery(schemaName, queryName, ViewInfo.DETAIL_NAME);
            this.bindURL = false;
        } else {
            this.schemaQuery = schemaQuery;
            this.bindURL = queryConfig.bindURL ?? false;
        }

        this.id = queryConfig.id ?? createQueryModelId(this.schemaQuery);
        this.includeDetailsColumn = queryConfig.includeDetailsColumn ?? false;
        this.includeUpdateColumn = queryConfig.includeUpdateColumn ?? false;
        this.includeTotalCount = queryConfig.includeTotalCount ?? false;
        this.keyValue = queryConfig.keyValue;
        this.maxRows = queryConfig.maxRows ?? DEFAULT_MAX_ROWS;
        this.offset = queryConfig.offset ?? DEFAULT_OFFSET;
        this.omittedColumns = queryConfig.omittedColumns ?? [];
        this.queryParameters = queryConfig.queryParameters;
        this.requiredColumns = queryConfig.requiredColumns ?? [];
        this.requiredColumnsAsQueryInfoFields = queryConfig.requiredColumnsAsQueryInfoFields ?? false;
        this.sorts = queryConfig.sorts ?? [];
        this.rowsError = undefined;
        this.filterArray = queryConfig.filterArray ?? [];
        this.messages = [];
        this.queryInfo = undefined;
        this.queryInfoError = undefined;
        this.queryInfoLoadingState = LoadingState.INITIALIZED;
        this.orderedRows = undefined;
        this.rows = undefined;
        this.rowCount = undefined;
        this.rowsLoadingState = LoadingState.INITIALIZED;
        this.selectedReportId = undefined;
        this.selectionPivot = undefined;
        this.selections = undefined;
        this.selectionsError = undefined;
        this.selectionsLoadingState = LoadingState.INITIALIZED;
        this.title = queryConfig.title;
        this.totalCountError = undefined;
        this.totalCountLoadingState = LoadingState.INITIALIZED;
        this.urlPrefix = queryConfig.urlPrefix ?? 'query'; // match Data Region defaults
        this.useSavedSettings = queryConfig.useSavedSettings ?? false;
        this.charts = undefined;
        this.chartsError = undefined;
        this.chartsLoadingState = LoadingState.INITIALIZED;
        this.viewError = undefined;
    }

    get schemaName(): string {
        return this.schemaQuery.schemaName;
    }

    get queryName(): string {
        return this.schemaQuery.queryName;
    }

    get viewName(): string {
        return this.schemaQuery.viewName;
    }

    get currentView(): ViewInfo {
        return this.queryInfo?.getView(this.viewName, true);
    }

    /**
     * Array of [[QueryColumn]] objects from the [[QueryInfo]] "\~\~DETAILS\~\~" view. This will exclude those columns listed
     * in omittedColumns.
     */
    get detailColumns(): QueryColumn[] {
        return this.queryInfo?.getDetailDisplayColumns(ViewInfo.DETAIL_NAME, this.omittedColumns);
    }

    /**
     * Array of [[QueryColumn]] objects from the [[QueryInfo]] view. This will exclude those columns listed
     * in omittedColumns.
     */
    get displayColumns(): QueryColumn[] {
        return this.queryInfo?.getDisplayColumns(this.viewName, this.omittedColumns);
    }

    // Issue 50607: Updated field labels are not shown in the grid if the default grid view has been changed.
    getCustomViewTitleOverride(column: QueryColumn): string {
        const label = column.customViewTitle;
        const originalCol = this.queryInfo.getColumn(column.fieldKey);
        if (!originalCol || originalCol.caption !== label) return label;
        return '';
    }

    /**
     * Array of all [[QueryColumn]] objects from the [[QueryInfo]] view. This will exclude those columns listed
     * in omittedColumns.
     */
    get allColumns(): QueryColumn[] {
        return this.queryInfo?.getAllColumns(this.viewName, this.omittedColumns);
    }

    /**
     * Array of [[QueryColumn]] objects from the [[QueryInfo]] "\~\~UPDATE\~\~" view. This will exclude those columns listed
     * in omittedColumns.
     */
    get updateColumns(): QueryColumn[] {
        return this.queryInfo?.getUpdateDisplayColumns(ViewInfo.UPDATE_NAME, this.omittedColumns);
    }

    /**
     * Array of primary key [[QueryColumn]] objects from the [[QueryInfo]].
     */
    get keyColumns(): QueryColumn[] {
        return this.queryInfo?.getPkCols();
    }

    get uniqueIdColumns(): QueryColumn[] {
        return this.allColumns.filter(column => column.isUniqueIdColumn);
    }

    /**
     * @hidden
     *
     * Get an array of filters to use for the details view, which includes the base filters but explicitly excludes
     * the "replaced" column filter for the assay run case. For internal use only.
     *
     * Issue 39765: When viewing details for assays, we need to apply an "is not blank" filter on the "Replaced" column
     * in order to see replaced assay runs.  So this is the one case (we know of) where we want to apply base filters
     * when viewing details since the default view restricts the set of items found.
     *
     * Applying other base filters will be problematic (Issue 39719) in that they could possibly exclude the row you are
     * trying to get details for.
     */
    get detailFilters(): Filter.IFilter[] {
        return this.baseFilters.filter(filter => filter.getColumnName().toLowerCase() === 'replaced');
    }

    getModelFilters(excludeViewFilters?: boolean): Filter.IFilter[] {
        const { baseFilters, queryInfo, keyValue } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot get filters, no QueryInfo available');
        }

        if (this.keyValue !== undefined) {
            const pkFilter = [];

            if (queryInfo.pkCols.length === 1) {
                pkFilter.push(Filter.create(queryInfo.pkCols[0], keyValue));
            } else {
                // Note: This behavior of not throwing an error, and continuing despite not having a single PK column is
                // inherited from QueryGridModel, we may want to rethink this before widely adopting this API.
                const warning = 'Too many keys. Unable to filter for specific keyValue.';
                console.warn(warning, queryInfo.pkCols);
            }

            return [...pkFilter, ...this.detailFilters];
        }

        if (excludeViewFilters) {
            // Issue 49634: LKSM: Saving search filters in default grid view has odd behavior
            const searchViewFilters = this.viewFilters.filter(f => f.getColumnName() === '*');
            return [...baseFilters, ...searchViewFilters];
        }
        return [...baseFilters, ...this.viewFilters];
    }

    get modelFilters(): Filter.IFilter[] {
        return this.getModelFilters(false);
    }

    get viewFilters(): Filter.IFilter[] {
        const { queryInfo, viewName } = this;
        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot get filters, no QueryInfo available');
        }

        return [...queryInfo.getFilters(viewName)];
    }

    loadRowsFilters(excludeViewFilters?: boolean): Filter.IFilter[] {
        const modelFilters = this.getModelFilters(excludeViewFilters);
        if (this.keyValue !== undefined) return modelFilters;

        return [...modelFilters, ...this.filterArray];
    }

    /**
     * An array of [Filter.IFilter](https://labkey.github.io/labkey-api-js/interfaces/Filter.IFilter.html) objects
     * for the QueryModel. If a keyValue is provided, this will be a filter on the primary key column concatenated with
     * the detailFilters. Otherwise, this will be a concatenation of the baseFilters, filterArray, and [[QueryInfo]] view filters.
     */
    get filters(): Filter.IFilter[] {
        return this.loadRowsFilters(false);
    }

    /**
     * Comma-delimited string of fieldKeys for requiredColumns, keyColumns, and displayColumns. If provided, the
     * omittedColumns will be removed from this list.
     */
    get columnString(): string {
        const { queryInfo } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot construct column string, no QueryInfo available');
        }

        return this.getRequestColumnsString();
    }

    getRequestColumnsString(requiredColumns?: string[], omittedColumns?: string[], isForUpdate?: boolean): string {
        const _requiredColumns = requiredColumns ?? this.requiredColumns;
        const _omittedColumns = omittedColumns ?? this.omittedColumns;

        // Note: ES6 Set is being used here, not Immutable Set
        const uniqueFieldKeys: Set<string> = new Set();
        this.keyColumns.forEach(col => uniqueFieldKeys.add(col.fieldKey));

        this.uniqueIdColumns.forEach(col => uniqueFieldKeys.add(col.fieldKey));

        // Issue 46478: Include update columns in requested columns to ensure values are available
        if (isForUpdate) {
            this.updateColumns.forEach(col => uniqueFieldKeys.add(col.fieldKey));
        } else {
            this.displayColumns.forEach(col => uniqueFieldKeys.add(col.fieldKey));
        }

        // add requiredColumns last so fieldKeys from QueryColumns are preferred, when there is a case difference
        // For example, choose Ancestors/RegistryAndSources/Participant (from displayColumns) over Ancestors/RegistryAndSources/participant (from requiredColumns)
        _requiredColumns?.forEach(col => uniqueFieldKeys.add(col));

        let fieldKeys = Array.from(uniqueFieldKeys);

        if (_omittedColumns.length) {
            const lowerOmit = new Set(_omittedColumns.map(c => c.toLowerCase()));
            fieldKeys = fieldKeys.filter(fieldKey => !lowerOmit.has(fieldKey.toLowerCase()));
        }

        // remove duplicate
        const fieldKeysLc = new Set(),
            fieldKeysCleaned = [];
        fieldKeys.forEach(fieldKey => {
            if (!fieldKeysLc.has(fieldKey.toLowerCase())) {
                fieldKeysCleaned.push(fieldKey);
                fieldKeysLc.add(fieldKey.toLowerCase());
            }
        });

        return fieldKeysCleaned.join(',');
    }

    /**
     * Comma-delimited string of fields that appear in an export. These are the same as the display columns but
     * do not exclude omitted columns.
     */
    get exportColumnString(): string {
        return this.displayColumns.map(column => column.fieldKey).join(',');
    }

    /**
     * An array of load-related errors on this model. This specifically targets errors related to initializing and/or
     * loading data. Subsequent errors that can occur (e.g. charting errors, selection errors, etc) are not included
     * as those are intended to be handled explicitly.
     */
    get loadErrors(): string[] {
        return [this.queryInfoError, this.rowsError].filter(e => !!e);
    }

    /**
     * Comma-delimited string of sorts from the [[QueryInfo]] sorts property. If the view has defined sorts, they
     * will be concatenated with the sorts property.
     */
    get sortString(): string {
        const { sorts, viewName, queryInfo } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot construct sort string, no QueryInfo available');
        }

        let sortStrings = sorts.map(sortStringMapper);
        const viewSorts = queryInfo.getSorts(viewName).map(sortStringMapper);

        if (viewSorts.length > 0) {
            sortStrings = sortStrings.concat(viewSorts);
        }

        return sortStrings.join(',');
    }

    /**
     * Returns the data needed for a <Grid /> component to render.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    get gridData(): Array<{ [key: string]: any }> {
        const { selections } = this;

        return this.orderedRows.map(value => {
            const row = this.rows[value];

            if (selections) {
                return {
                    ...row,
                    [GRID_SELECTION_INDEX]: selections.has(value),
                };
            }

            return row;
        });
    }

    /**
     * Returns an object representing the query params of the model. Used when updating the URL when bindURL is set to
     * true.
     */
    get urlQueryParams(): Record<string, string> {
        const { currentPage, urlPrefix, filterArray, maxRows, selectedReportId, sorts, viewName } = this;
        const filters = filterArray.filter(f => f.getColumnName() !== '*');
        const searches = filterArray
            .filter(f => f.getColumnName() === '*')
            .map(f => f.getValue())
            .join(';');
        // ReactRouter location.query is typed as any.
        const modelParams: Record<string, string> = {};

        if (currentPage !== 1) {
            modelParams[`${urlPrefix}.p`] = currentPage.toString(10);
        }

        if (maxRows !== DEFAULT_MAX_ROWS) {
            modelParams[`${urlPrefix}.pageSize`] = maxRows.toString(10);
        }

        if (viewName !== undefined) {
            modelParams[`${urlPrefix}.view`] = viewName;
        }

        if (sorts.length > 0) {
            modelParams[`${urlPrefix}.sort`] = sorts.map(sortStringMapper).join(',');
        }

        if (searches.length > 0) {
            modelParams[`${urlPrefix}.q`] = searches;
        }

        if (selectedReportId) {
            modelParams[`${urlPrefix}.reportId`] = selectedReportId;
        }

        filters.forEach((filter): void => {
            modelParams[filter.getURLParameterName(urlPrefix)] = filter.getURLParameterValue();
        });

        return modelParams;
    }

    /**
     * Gets a column by fieldKey.
     * @param fieldKey: string
     */
    getColumnByFieldKey(fieldKey: string): QueryColumn {
        const locFieldKey = fieldKey.toLowerCase();
        return this.allColumns?.find(c => c.fieldKey?.toLowerCase() === locFieldKey);
    }

    /**
     * Gets a column by name. Implementation adapted from parseColumns in grid/utils.ts.
     * @param name: string
     */
    getColumn(name: string): QueryColumn {
        const lowered = name.toLowerCase();
        const isLookup = lowered.indexOf('/') > -1;
        const allColumns = this.allColumns;

        // First find all possible matches by name/lookup
        const columns = allColumns.filter(queryColumn => {
            if (isLookup && queryColumn.isLookup()) {
                return (
                    queryColumn.name.toLowerCase() === lowered || queryColumn.displayField?.toLowerCase() === lowered
                );
            }

            return queryColumn.name.toLowerCase() === lowered;
        });

        // Use exact match first, else first possible match
        let column = columns.find(c => c.name.toLowerCase() === lowered || c.displayField?.toLowerCase() === lowered);
        if (column === undefined && columns.length > 0) {
            column = columns[0];
        }

        if (column !== undefined) {
            return column;
        }

        // Fallback to finding by shortCaption
        return allColumns.find(column => {
            return column.shortCaption.toLowerCase() === lowered;
        });
    }

    /**
     * Returns the data for the specified key parameter on the QueryModel.rows object.
     * If no key parameter is provided, the first data row will be returned.
     * @param key
     * @param flattenValues True to flatten the row object to just the key: value pairs
     */
    getRow(key?: string, flattenValues = false): any {
        if (!this.hasRows) {
            return undefined;
        }

        if (key === undefined) {
            key = this.orderedRows[0];
        }

        const row = this.rows[key];
        return flattenValues ? flattenValuesFromRow(row, this.queryInfo.getColumnFieldKeys()) : row;
    }

    /**
     * Returns the value of a specific column in the first row.
     * @param columnName Case insensitive name of the column.
     */
    getRowValue(columnName: string): any {
        return caseInsensitive(this.getRow(), columnName)?.value;
    }

    /**
     * Get the total page count for the results rows in this QueryModel-based on the total row count and the
     * max rows per page value.
     */
    get pageCount(): number {
        const { maxRows, rowCount } = this;
        return maxRows > 0 ? Math.ceil(rowCount / maxRows) : 1;
    }

    /**
     * Get the current page number based off of the results offset and max rows per page values.
     */
    get currentPage(): number {
        const { offset, maxRows } = this;
        return offset > 0 ? Math.floor(offset / maxRows) + 1 : 1;
    }

    /**
     * Get the last page offset value for the given QueryModel rows.
     */
    get lastPageOffset(): number {
        return (this.pageCount - 1) * this.maxRows;
    }

    /**
     * An array of [[ViewInfo]] objects for the saved views for the given QueryModel. Note that the returned array
     * will be sorted by view label.
     */
    get views(): ViewInfo[] {
        return this.queryInfo?.views.valueArray.sort(naturalSortByProperty('label')) || [];
    }

    /**
     * An array of [[ViewInfo]] objects that are visible for a user to choose in the view menu. Note that the returned
     * array will be sorted by view label.
     */
    get visibleViews(): ViewInfo[] {
        return this.queryInfo?.getVisibleViews();
    }

    /**
     * True if data has been loaded, even if no rows were returned.
     */
    get hasData(): boolean {
        return this.rows !== undefined;
    }

    /** True if there are any load errors. */
    get hasLoadErrors(): boolean {
        return this.loadErrors.length > 0;
    }

    /**
     * True if the model has > 0 rows.
     */
    get hasRows(): boolean {
        return this.hasData && Object.keys(this.rows).length > 0;
    }

    /**
     * True if the charts have been loaded, even if there are no saved charts returned.
     */
    get hasCharts(): boolean {
        return this.charts !== undefined;
    }

    /**
     * True if the QueryModel has row selections.
     */
    get hasSelections(): boolean {
        return this.selections?.size > 0;
    }

    /**
     * Key to attach to selections, which are specific to a view
     */
    get selectionKey(): string {
        return (
            this.id +
            (this.viewName && this.viewName !== ViewInfo.DETAIL_NAME
                ? '/' + encodePart(this.viewName).toLowerCase()
                : '')
        );
    }

    /**
     * Return the selection ids as an array of integers.
     */
    get intSelections(): number[] {
        if (this.selections) {
            return Array.from(this.selections).map(id => parseInt(id));
        }
        return undefined;
    }

    /**
     * Return the selection ids as an optionally filtered, array.
     */
    getSelectedIds(filterIds: number[] = []): string[] {
        if (this.selections) {
            return Array.from(this.selections).filter(s => filterIds.indexOf(parseInt(s, 10)) === -1);
        }
        return undefined;
    }

    /**
     * Get the row selection state (ALL, SOME, or NONE) for the QueryModel.
     */
    get selectedState(): GRID_CHECKBOX_OPTIONS {
        const { hasData, isLoading, maxRows, orderedRows, selections, rowCount } = this;

        if (!isLoading && hasData && selections) {
            const selectedOnPage = orderedRows.filter(rowId => selections.has(rowId)).length;

            if ((selectedOnPage === rowCount || selectedOnPage === orderedRows.length) && rowCount > 0) {
                return GRID_CHECKBOX_OPTIONS.ALL;
            } else if (selectedOnPage > 0) {
                // if model has any selected on the page show checkbox as indeterminate
                return GRID_CHECKBOX_OPTIONS.SOME;
            }
        }

        // Default to none.
        return GRID_CHECKBOX_OPTIONS.NONE;
    }

    /**
     * True if either the query info or rows of the QueryModel are still loading.
     */
    get isLoading(): boolean {
        if (this.hasLoadErrors) return false;

        return isLoading(this.queryInfoLoadingState, this.rowsLoadingState);
    }

    /**
     * True if the QueryModel is loading its chart definitions.
     */
    get isLoadingCharts(): boolean {
        return isLoading(this.chartsLoadingState);
    }

    /**
     * True if the QueryModel is loading its row selections.
     */
    get isLoadingSelections(): boolean {
        return isLoading(this.selectionsLoadingState);
    }

    /**
     * True if the QueryModel is loading its total count.
     */
    get isLoadingTotalCount(): boolean {
        return isLoading(this.totalCountLoadingState);
    }

    /**
     * True if the QueryModel is actively loading its total count, or if it's loading rows (which might include total count).
     */
    get isActivelyLoadingTotalCount(): boolean {
        return (
            (this.rowsLoadingState === LoadingState.LOADING && !this.includeTotalCount) ||
            this.totalCountLoadingState === LoadingState.LOADING
        );
    }

    /**
     * True if the current page is the last page for the given QueryModel rows.
     */
    get isLastPage(): boolean {
        return this.currentPage === this.pageCount;
    }

    /**
     * True if the current page is the first page for the given QueryModel rows.
     */
    get isFirstPage(): boolean {
        return this.currentPage === 1;
    }

    /**
     * Returns the data needed for pagination by the [[Pagination]] component.
     */
    get paginationData(): PaginationData {
        return {
            currentPage: this.currentPage,
            disabled: this.isLoading,
            isFirstPage: this.isFirstPage,
            isLastPage: this.isLastPage,
            offset: this.offset,
            pageCount: this.pageCount,
            pageSize: this.maxRows,
            rowCount: this.rowCount,
            totalCountLoadingState: this.totalCountLoadingState,
        };
    }

    get showImportDataButton(): boolean {
        return !!this.queryInfo?.getShowImportDataButton();
    }

    get showInsertNewButton(): boolean {
        return !!this.queryInfo?.getShowInsertNewButton();
    }

    get isAppEditable(): boolean {
        return !!this.queryInfo?.isAppEditable();
    }

    get isFiltered(): boolean {
        return (
            this.baseFilters?.length > 0 ||
            this.filterArray?.length > 0 ||
            this.queryInfo?.getFilters(this.schemaQuery.viewName)?.length > 0
        );
    }

    get queryConfig(): QueryConfig {
        return {
            baseFilters: Array.from(this.baseFilters),
            bindURL: this.bindURL,
            containerFilter: this.containerFilter,
            containerPath: this.containerPath,
            filterArray: Array.from(this.filterArray),
            id: this.id,
            includeDetailsColumn: this.includeDetailsColumn,
            keyValue: this.keyValue,
            maxRows: this.maxRows,
            offset: this.offset,
            omittedColumns: Array.from(this.omittedColumns),
            queryParameters: {
                ...this.queryParameters,
            },
            requiredColumns: Array.from(this.requiredColumns),
            schemaQuery: this.schemaQuery,
            sorts: this.sorts,
            title: this.title,
            urlPrefix: this.urlPrefix,
        };
    }

    get loadRowsConfig(): SelectRowsOptions {
        return {
            schemaQuery: this.schemaQuery,
            viewName: this.viewName,
            containerPath: this.containerPath,
            containerFilter: this.containerFilter,
            filterArray: this.loadRowsFilters(true),
            sort: this.sortString,
            columns: this.columnString,
            parameters: this.queryParameters,
            maxRows: this.maxRows,
            offset: this.offset,
            includeDetailsColumn: this.includeDetailsColumn,
            includeUpdateColumn: this.includeUpdateColumn,
        };
    }

    /**
     * Returns the model attributes given a set of queryParams from the URL. Used for URL Binding.
     * @param searchParams: The URLSearchParams from the react-router useSearchParams hook
     * @param useExistingValues: Set to true if you want to use the values on the model as the default values.
     * Typically, this should be false, because you want to treat the URL as the single source of truth, but when we
     * initialize models we may programmatically want to set an initial value (e.g. a default sort).
     */
    attributesForURLQueryParams(searchParams: URLSearchParams, useExistingValues = false): QueryModelURLState {
        const prefix = this.urlPrefix;
        const viewName = searchParams.get(`${prefix}.view`) ?? undefined;
        const searchFilters = searchFiltersFromString(searchParams.get(`${prefix}.q`)) ?? [];
        const columnFilters = Filter.getFiltersFromParameters(getQueryParams(searchParams), prefix);
        let filterArray = columnFilters.concat(searchFilters);
        let maxRows = parseInt(searchParams.get(`${prefix}.pageSize`), 10);
        if (isNaN(maxRows)) maxRows = DEFAULT_MAX_ROWS;
        let offset = offsetFromString(this.maxRows, searchParams.get(`${prefix}.p`)) ?? DEFAULT_OFFSET;
        let schemaQuery = new SchemaQuery(this.schemaName, this.queryName, viewName);
        let selectedReportId = searchParams.get(`${prefix}.reportId`) ?? undefined;
        let sorts = querySortsFromString(searchParams.get(`${prefix}.sort`)) ?? [];

        // If useExistingValues is true we'll assume any value not present on the URL can be overridden by the current
        // model value. This behavior is really only wanted when we are initializing the model.
        if (useExistingValues) {
            if (filterArray.length === 0 && this.filterArray.length > 0) {
                filterArray = this.filterArray;
            }

            if (maxRows === DEFAULT_MAX_ROWS && this.maxRows !== DEFAULT_MAX_ROWS) {
                maxRows = this.maxRows;
            }

            if (offset === 0 && this.offset !== 0) {
                offset = this.offset;
            }

            if (viewName === undefined && this.viewName !== undefined) {
                schemaQuery = this.schemaQuery;
            }

            if (selectedReportId === undefined && this.selectedReportId) {
                selectedReportId = this.selectedReportId;
            }

            if (sorts.length === 0 && this.sorts.length > 0) {
                sorts = this.sorts;
            }
        }

        return { filterArray, maxRows, offset, schemaQuery, selectedReportId, sorts };
    }

    /**
     * Returns a deep copy of this model with props applied iff props is not empty/null/undefined else
     * returns this.
     * @param props
     */
    mutate(props: Partial<QueryModel>): QueryModel {
        return produce<QueryModel>(this, draft => {
            Object.assign(draft, props);
        });
    }
}

type QueryModelURLState = Pick<
    QueryModel,
    'filterArray' | 'maxRows' | 'offset' | 'schemaQuery' | 'selectedReportId' | 'sorts'
>;
type QueryModelSettings = Partial<Pick<QueryModel, 'filterArray' | 'maxRows' | 'sorts' | 'viewName'>>;
const LOCAL_STORAGE_PREFIX = 'QUERY_MODEL_SETTINGS';

function localStorageKey(modelId: string, containerPath: string): string {
    return [LOCAL_STORAGE_PREFIX, containerPath, modelId].join(';');
}

export function getSettingsFromLocalStorage(id: string, containerPath: string): QueryModelSettings {
    const savedSettings = JSON.parse(localStorage.getItem(localStorageKey(id, containerPath)));

    if (savedSettings === null) return undefined;

    const { maxRows, viewName } = savedSettings;
    const filterArray = savedSettings.filterArray?.map(f =>
        Filter.create(f.columnName, f.value, Filter.getFilterTypeForURLSuffix(f.type))
    );
    const sorts = savedSettings.sorts?.map(s => querySortFromString(s));

    return {
        filterArray: filterArray ?? [],
        maxRows: maxRows ?? DEFAULT_MAX_ROWS,
        sorts: sorts ?? [],
        viewName,
    };
}

const UNIQUE_ERROR =
    'Model ID is not unique, cannot save settings to local storage. Use a model ID that is unique and stable.';

export function saveSettingsToLocalStorage(model: QueryModel): void {
    // Don't serialize anything to localStorage if we're not supposed to use saved settings
    if (!model.useSavedSettings) {
        return;
    }

    // We often use "model" as the default model ID, which is not sufficiently unique to store saved settings.
    if (model.id === 'model') {
        console.error(UNIQUE_ERROR);
        return;
    }
    const settings = {
        filterArray: model.filterArray.map(f => ({
            columnName: f.getColumnName(),
            value: f.getValue(),
            type: f.getFilterType().getURLSuffix(),
        })),
        maxRows: model.maxRows,
        sorts: model.sorts.map(sort => sort.toRequestString()),
        viewName: model.viewName,
    };
    // The settings for each model are stored in their own object, instead of storing all settings under some
    // root object, because we have to serialize to/from JSON, and it could get very expensive if we had to
    // read/write a large JSON object that stored all settings for all models every time we needed settings for
    // a single model.
    localStorage.setItem(localStorageKey(model.id, model.containerPath), JSON.stringify(settings));
}

export function removeSettingsFromLocalStorage(model: QueryModel): void {
    localStorage.removeItem(localStorageKey(model.id, model.containerPath));
}
