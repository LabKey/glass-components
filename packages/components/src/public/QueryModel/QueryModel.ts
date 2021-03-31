import { List } from 'immutable';
import { Draft, immerable, produce } from 'immer';
import { Filter, Query } from '@labkey/api';

import {
    GRID_CHECKBOX_OPTIONS,
    LoadingState,
    naturalSort,
    QueryColumn,
    QueryInfo,
    QuerySort,
    SchemaQuery,
    ViewInfo,
    PaginationData,
} from '../..';
import { GRID_SELECTION_INDEX } from '../../internal/constants';

import { DataViewInfo } from '../../internal/models';

import { flattenValuesFromRow, offsetFromString, querySortsFromString, searchFiltersFromString } from './utils';

/**
 * Creates a QueryModel ID for a given SchemaQuery. The id is just the SchemaQuery snake-cased as
 * schemaName-queryName-viewName or schemaName-queryName if viewName is undefined.
 *
 * @param schemaQuery: SchemaQuery
 */
export function createQueryModelId(schemaQuery: SchemaQuery): string {
    const { schemaName, queryName } = schemaQuery;
    return `${schemaName}.${queryName}`;
}

const sortStringMapper = (s: QuerySort): string => s.toRequestString();

export interface GridMessage {
    area: string;
    type: string;
    content: string;
}

export interface QueryConfig {
    /**
     * An array of base [Filter.IFilter](https://labkey.github.io/labkey-api-js/interfaces/_filter_filter_.ifilter.html)
     * filters to be applied to the [[QueryModel]] data load. These base filters will be concatenated with URL filters,
     * the keyValue filter, and view filters when applicable.
     */
    baseFilters?: Filter.IFilter[];
    /**
     * Flag used to indicate whether or not filters/sorts/etc. should be persisted on the URL. Defaults to false.
     */
    bindURL?: boolean;
    /**
     * One of the values of [Query.ContainerFilter](https://labkey.github.io/labkey-api-js/enums/_query_utils_.containerfilter.html)
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
     * Definition of the [[SchemaQuery]] (i.e. schema, query, and optionally view name) to use for the [[QueryModel]] data load.
     */
    schemaQuery: SchemaQuery;
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
}

const DEFAULT_OFFSET = 0;
const DEFAULT_MAX_ROWS = 20;

/**
 * This is the base model used to store all the data for a query. At a high level the QueryModel API is a wrapper around
 * the [selectRows](https://labkey.github.io/labkey-api-js/modules/_query_selectrows_.html#selectrows) API.
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
     * An array of base [Filter.IFilter](https://labkey.github.io/labkey-api-js/interfaces/_filter_filter_.ifilter.html)
     * filters to be applied to the QueryModel data load. These base filters will be concatenated with URL filters,
     * they keyValue filter, and view filters when applicable.
     */
    readonly baseFilters: Filter.IFilter[];
    /**
     * Flag used to indicate whether or not filters/sorts/etc. should be persisted on the URL. Defaults to false.
     */
    readonly bindURL: boolean;
    /**
     * One of the values of [Query.ContainerFilter](https://labkey.github.io/labkey-api-js/enums/_query_utils_.containerfilter.html)
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
     * Primary key value, used when loading/rendering details pages to get a single row of data in a QueryModel.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    readonly keyValue?: any;
    /**
     * The maximum number of rows to return from the server (defaults to 100000).
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
     * Definition of the [[SchemaQuery]] (i.e. schema, query, and optionally view name) to use for the QueryModel data load.
     */
    readonly schemaQuery: SchemaQuery;
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

    // QueryModel only fields
    /**
     * An array of [Filter.IFilter](https://labkey.github.io/labkey-api-js/interfaces/_filter_filter_.ifilter.html)
     * filters to be applied to the QueryModel data load. These filters will be concatenated with base filters, URL filters,
     * they keyValue filter, and view filters when applicable.
     */
    readonly filterArray: Filter.IFilter[];
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
     * The total count of rows for the given QueryModel.
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
            this.schemaQuery = SchemaQuery.create(schemaName, queryName, ViewInfo.DETAIL_NAME);
            this.bindURL = false;
        } else {
            this.schemaQuery = schemaQuery;
            this.bindURL = queryConfig.bindURL ?? false;
        }

        this.id = queryConfig.id ?? createQueryModelId(this.schemaQuery);
        this.includeDetailsColumn = queryConfig.includeDetailsColumn ?? false;
        this.includeUpdateColumn = queryConfig.includeUpdateColumn ?? false;
        this.keyValue = queryConfig.keyValue;
        this.maxRows = queryConfig.maxRows ?? DEFAULT_MAX_ROWS;
        this.offset = queryConfig.offset ?? DEFAULT_OFFSET;
        this.omittedColumns = queryConfig.omittedColumns ?? [];
        this.queryParameters = queryConfig.queryParameters;
        this.requiredColumns = queryConfig.requiredColumns ?? [];
        this.sorts = queryConfig.sorts ?? [];
        this.rowsError = undefined;
        this.filterArray = [];
        this.messages = [];
        this.queryInfo = undefined;
        this.queryInfoError = undefined;
        this.queryInfoLoadingState = LoadingState.INITIALIZED;
        this.orderedRows = undefined;
        this.rows = undefined;
        this.rowCount = undefined;
        this.rowsLoadingState = LoadingState.INITIALIZED;
        this.selectedReportId = undefined;
        this.selections = undefined;
        this.selectionsError = undefined;
        this.selectionsLoadingState = LoadingState.INITIALIZED;
        this.title = queryConfig.title;
        this.urlPrefix = queryConfig.urlPrefix ?? 'query'; // match Data Region defaults
        this.charts = undefined;
        this.chartsError = undefined;
        this.chartsLoadingState = LoadingState.INITIALIZED;
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

    /**
     * Array of [[QueryColumn]] objects from the [[QueryInfo]] "\~\~DETAILS\~\~" view. This will exclude those columns listed
     * in omittedColumns.
     */
    get detailColumns(): QueryColumn[] {
        return this.queryInfo?.getDetailDisplayColumns(ViewInfo.DETAIL_NAME, List(this.omittedColumns)).toArray();
    }

    /**
     * Array of [[QueryColumn]] objects from the [[QueryInfo]] view. This will exclude those columns listed
     * in omittedColumns.
     */
    get displayColumns(): QueryColumn[] {
        return this.queryInfo?.getDisplayColumns(this.viewName, List(this.omittedColumns)).toArray();
    }

    /**
     * Array of all [[QueryColumn]] objects from the [[QueryInfo]] view. This will exclude those columns listed
     * in omittedColumns.
     */
    get allColumns(): QueryColumn[] {
        return this.queryInfo?.getAllColumns(this.viewName, List(this.omittedColumns)).toArray();
    }

    /**
     * Array of [[QueryColumn]] objects from the [[QueryInfo]] "\~\~UPDATE\~\~" view. This will exclude those columns listed
     * in omittedColumns.
     */
    get updateColumns(): QueryColumn[] {
        return this.queryInfo?.getUpdateDisplayColumns(ViewInfo.UPDATE_NAME, List(this.omittedColumns)).toArray();
    }

    /**
     * Array of primary key [[QueryColumn]] objects from the [[QueryInfo]].
     */
    get keyColumns(): QueryColumn[] {
        return this.queryInfo?.getPkCols().toArray();
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

    /**
     * An array of [Filter.IFilter](https://labkey.github.io/labkey-api-js/interfaces/_filter_filter_.ifilter.html) objects
     * for the QueryModel. If a keyValue is provided, this will be a filter on the primary key column concatenated with
     * the detailFilters. Otherwise, this will be a concatenation of the baseFilters, filterArray, and [[QueryInfo]] view filters.
     */
    get filters(): Filter.IFilter[] {
        const { baseFilters, filterArray, queryInfo, keyValue, viewName } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot get filters, no QueryInfo available');
        }

        if (this.keyValue !== undefined) {
            const pkFilter = [];

            if (queryInfo.pkCols.size === 1) {
                pkFilter.push(Filter.create(queryInfo.pkCols.first(), keyValue));
            } else {
                // Note: This behavior of not throwing an error, and continuing despite not having a single PK column is
                // inherited from QueryGridModel, we may want to rethink this before widely adopting this API.
                const warning = 'Too many keys. Unable to filter for specific keyValue.';
                console.warn(warning, queryInfo.pkCols.toJS());
            }

            return [...pkFilter, ...this.detailFilters];
        }

        return [...baseFilters, ...filterArray, ...queryInfo.getFilters(viewName).toArray()];
    }

    /**
     * Comma-delimited string of fieldKeys for requiredColumns, keyColumns, and displayColumns. If provided, the
     * omittedColumns will be removed from this list.
     */
    get columnString(): string {
        const { queryInfo, requiredColumns, omittedColumns } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot construct column string, no QueryInfo available');
        }

        // Note: ES6 Set is being used here, not Immutable Set
        const uniqueFieldKeys = new Set(requiredColumns);
        this.keyColumns.forEach(col => uniqueFieldKeys.add(col.fieldKey));
        this.displayColumns.forEach(col => uniqueFieldKeys.add(col.fieldKey));
        let fieldKeys = Array.from(uniqueFieldKeys);

        if (omittedColumns.length) {
            const lowerOmit = new Set(omittedColumns.map(c => c.toLowerCase()));
            fieldKeys = fieldKeys.filter(fieldKey => !lowerOmit.has(fieldKey.toLowerCase()));
        }

        return fieldKeys.join(',');
    }

    /**
     * Comma-delimited string of fields that appear in an export. These are the same as the display columns but
     * do not exclude omitted columns.
     */
    get exportColumnString(): string {
        return this.displayColumns.map(column => column.fieldKey).join(',');
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
        const viewSorts = queryInfo.getSorts(viewName).map(sortStringMapper).toArray();

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
    get urlQueryParams(): { [key: string]: string } {
        const { currentPage, urlPrefix, filterArray, selectedReportId, sorts, viewName } = this;
        const filters = filterArray.filter(f => f.getColumnName() !== '*');
        const searches = filterArray
            .filter(f => f.getColumnName() === '*')
            .map(f => f.getValue())
            .join(';');
        // ReactRouter location.query is typed as any.
        const modelParams: { [key: string]: any } = {};

        if (currentPage !== 1) {
            modelParams[`${urlPrefix}.p`] = currentPage.toString(10);
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
     * Gets a column by name. Implementation adapted from parseColumns in components/omnibox/utils.ts.
     * @param name: string
     */
    getColumn(name: string): QueryColumn {
        const lowered = name.toLowerCase();
        const isLookup = lowered.indexOf('/') > -1;
        const allColumns = this.allColumns;

        // First attempt to find by name/lookup
        const column = allColumns.find(queryColumn => {
            if (isLookup && queryColumn.isLookup()) {
                return lowered.split('/')[0] === queryColumn.name.toLowerCase();
            } else if (isLookup && !queryColumn.isLookup()) {
                return false;
            }

            return queryColumn.name.toLowerCase() === lowered;
        });

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
     * Get the total page count for the results rows in this QueryModel based on the total row count and the
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
        return this.queryInfo?.views.sortBy(v => v.label, naturalSort).toArray() || [];
    }

    /**
     * True if data has been loaded, even if no rows were returned.
     */
    get hasData(): boolean {
        return this.rows !== undefined;
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
     * Get the row selection state (ALL, SOME, or NONE) for the QueryModel.
     */
    get selectedState(): GRID_CHECKBOX_OPTIONS {
        const { hasData, isLoading, maxRows, orderedRows, selections, rowCount } = this;

        if (!isLoading && hasData && selections) {
            const selectedOnPage = orderedRows.filter(rowId => selections.has(rowId)).length;

            if ((selectedOnPage === rowCount || selectedOnPage === maxRows) && rowCount > 0) {
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
        const { queryInfoLoadingState, rowsLoadingState } = this;
        return (
            queryInfoLoadingState === LoadingState.INITIALIZED ||
            queryInfoLoadingState === LoadingState.LOADING ||
            rowsLoadingState === LoadingState.INITIALIZED ||
            rowsLoadingState === LoadingState.LOADING
        );
    }

    /**
     * True if the QueryModel is loading its chart definitions.
     */
    get isLoadingCharts(): boolean {
        const { chartsLoadingState } = this;
        return chartsLoadingState === LoadingState.INITIALIZED || chartsLoadingState === LoadingState.LOADING;
    }

    /**
     * True if the QueryModel is loading its row selections.
     */
    get isLoadingSelections(): boolean {
        const { selectionsLoadingState } = this;
        return selectionsLoadingState === LoadingState.INITIALIZED || selectionsLoadingState === LoadingState.LOADING;
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
            id: this.id,
            isFirstPage: this.isFirstPage,
            isLastPage: this.isLastPage,
            offset: this.offset,
            pageCount: this.pageCount,
            pageSize: this.maxRows,
            rowCount: this.rowCount,
        };
    }

    get showImportDataButton(): boolean {
        const query = this.queryInfo;

        return query && query.showInsertNewButton && query.importUrl && !query.importUrlDisabled;
    }

    get showInsertNewButton(): boolean {
        const query = this.queryInfo;

        return query && query.showInsertNewButton && query.insertUrl && !query.insertUrlDisabled;
    }

    /**
     * Returns the model attributes given a set of queryParams from the URL. Used for URL Binding.
     * @param queryParams: The query attribute from a ReactRouter Location object.
     */
    attributesForURLQueryParams(queryParams): QueryModelURLState {
        const prefix = this.urlPrefix;
        const viewName = queryParams[`${prefix}.view`] ?? this.viewName;
        let filterArray = Filter.getFiltersFromParameters(queryParams, prefix) || this.filterArray;
        const searchFilters = searchFiltersFromString(queryParams[`${prefix}.q`]);

        if (searchFilters !== undefined) {
            filterArray = filterArray.concat(searchFilters);
        }

        return {
            filterArray,
            offset: offsetFromString(this.maxRows, queryParams[`${prefix}.p`]) ?? this.offset,
            schemaQuery: SchemaQuery.create(this.schemaName, this.queryName, viewName),
            sorts: querySortsFromString(queryParams[`${prefix}.sort`]) ?? this.sorts,
            selectedReportId: queryParams[`${prefix}.reportId`] ?? this.selectedReportId,
        };
    }

    /**
     * Returns a deep copy of this model with props applied iff props is not empty/null/undefined else
     * returns this.
     * @param props
     */
    mutate(props: Partial<QueryModel>): QueryModel {
        return produce(this, (draft: Draft<QueryModel>) => {
            Object.assign(draft, props);
        });
    }
}

type QueryModelURLState = Pick<QueryModel, 'filterArray' | 'offset' | 'schemaQuery' | 'selectedReportId' | 'sorts'>;
