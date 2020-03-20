import { Filter } from '@labkey/api';
import { naturalSort, QueryColumn, QueryInfo, SchemaQuery, ViewInfo } from '..';
import { List } from 'immutable';
import { immerable } from 'immer';
import { QuerySort } from '../components/base/models/model';
import { getOrDefault } from './utils';

export enum LoadingState {
    // The model has been initialized but not loaded
    INITIALIZED = 'INITIALIZED',
    // The model is currently loading
    LOADING = 'LOADING',
    // The model is loaded
    LOADED = 'LOADED',
}

/**
 * Creates a QueryModel ID for a given SchemaQuery. The id is just the SchemaQuery snake-cased as
 * schemaName-queryName-viewName or schemaName-queryName if viewName is undefined.
 *
 * @param schemaQuery: SchemaQuery
 */
export function createQueryModelId(schemaQuery: SchemaQuery): string {
    const { schemaName, queryName, viewName } = schemaQuery;
    return `${schemaName}-${queryName}${viewName !== undefined ? '-' + viewName : ''}`;
}

const fieldKeyMapper = (c: QueryColumn): string => c.fieldKey;
const sortStringMapper = (s: QuerySort): string => s.toRequestString();

export interface QueryConfig {
    baseFilters?: Filter.IFilter[];
    containerFilter?: string; // TODO use api-js ContainerFilter enum when it is merged.
    containerPath?: string;
    id?: string;
    includeDetailsColumn?: boolean;
    includeUpdateColumn?: boolean;
    keyValue?: any; // TODO: better name
    maxRows?: number;
    offset?: number;
    omittedColumns?: string[];
    queryParameters?: { [key: string]: any};
    requiredColumns?: string[];
    schemaQuery: SchemaQuery;
    sorts?: QuerySort[];
}

export interface IQueryModel extends QueryConfig {
    error?: string;
    // Separate from baseFilters because these are set by the user when interacting with grids (e.g. via omnibox)
    filterArray: Filter.IFilter[];
    rowsLoadingState: LoadingState;
    // Set by client
    message?: string;
    // Set by server (Assay QC, etc)
    messages: string[];
    queryInfo?: QueryInfo;
    queryInfoLoadingState: LoadingState;
    orderedRows?: string[];
    rows?: { [key: string]: any};
    rowCount?: number;
}

const DEFAULT_OFFSET = 0;
const DEFAULT_MAX_ROWS = 20;

export class QueryModel implements IQueryModel {
    [immerable] = true;

    // Fields from QueryConfig
    baseFilters: Filter.IFilter[];
    containerFilter?: string; // TODO use api-js ContainerFilter enum when it is merged.
    containerPath?: string;
    id: string;
    includeDetailsColumn: boolean;
    includeUpdateColumn: boolean;
    keyValue?: any; // TODO: better name
    maxRows?: number;
    offset: number;
    omittedColumns: string[];
    queryParameters?: { [key: string]: any};
    requiredColumns: string[];
    schemaQuery: SchemaQuery;
    sorts?: QuerySort[];

    // QueryModel only fields
    error: undefined;
    filterArray: Filter.IFilter[];
    rowsLoadingState: LoadingState;
    message?: string;
    messages: string[];
    orderedRows?: string[];
    queryInfo?: QueryInfo;
    queryInfoLoadingState: LoadingState;
    rows?: { [key: string]: any};
    rowCount?: number;

    constructor(queryConfig: QueryConfig) {
        this.baseFilters = getOrDefault(queryConfig.baseFilters, []);
        this.containerFilter = getOrDefault(queryConfig.containerFilter);
        this.containerPath = getOrDefault(queryConfig.containerPath);
        this.schemaQuery = getOrDefault(queryConfig.schemaQuery);

        // Even though this is a situation that we shouldn't be in due to the type annotations it's still possible
        // due to conversion from any, and it's best to have a specific error than an error due to undefined later
        // when we try to use the model during an API request.
        if (this.schemaQuery === undefined) {
            throw new Error('schemaQuery is required to instantiate a QueryModel');
        }

        this.id = getOrDefault(queryConfig.id, createQueryModelId(this.schemaQuery));
        this.includeDetailsColumn = getOrDefault(queryConfig.includeDetailsColumn, false);
        this.includeUpdateColumn = getOrDefault(queryConfig.includeUpdateColumn, false);
        this.keyValue = getOrDefault(queryConfig.keyValue);
        this.maxRows = getOrDefault(queryConfig.maxRows, DEFAULT_MAX_ROWS);
        this.offset = getOrDefault(queryConfig.offset, DEFAULT_OFFSET);
        this.omittedColumns = getOrDefault(queryConfig.omittedColumns, []);
        this.queryParameters = getOrDefault(queryConfig.queryParameters);
        this.requiredColumns = getOrDefault(queryConfig.requiredColumns, []);
        this.sorts = getOrDefault(queryConfig.sorts);

        this.error = undefined;
        this.filterArray = [];
        this.message = undefined;
        this.messages = [];
        this.queryInfo = undefined;
        this.orderedRows = undefined;
        this.rows = undefined;
        this.rowCount = undefined;
        this.rowsLoadingState = LoadingState.INITIALIZED;
        this.queryInfoLoadingState = LoadingState.INITIALIZED;
    }

    getColumn(fieldKey: string): QueryColumn {
        return this.queryInfo?.getColumn(fieldKey);
    }

    getDisplayColumns(): QueryColumn[] {
        return this.queryInfo?.getDisplayColumns(this.schemaQuery.viewName, List(this.omittedColumns)).toArray();
    }

    getAllColumns(): QueryColumn[] {
        return this.queryInfo?.getAllColumns(this.schemaQuery.viewName, List(this.omittedColumns)).toArray();
    }

    getKeyColumns(): QueryColumn[] {
        return this.queryInfo?.getPkCols().toArray();
    }

    /**
     * Issue 39765: When viewing details for assays, we need to apply an "is not blank" filter on the "Replaced" column
     * in order to see replaced assay runs.  So this is the one case (we know of) where we want to apply base filters
     * when viewing details since the default view restricts the set of items found.
     *
     * Applying other base filters will be problematic (Issue 39719) in that they could possibly exclude the row you are
     * trying to get details for.
     */
    getDetailFilters(): Filter.IFilter[] {
        return this.baseFilters.filter((filter) => (filter.getColumnName().toLowerCase() === 'replaced'));
    }

    getFilters(): Filter.IFilter[] {
        const { baseFilters, filterArray, queryInfo, keyValue, schemaQuery } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot get filters, no QueryInfo available');
        }

        if (this.keyValue !== undefined) {
            let pkFilter = [];

            if (queryInfo.pkCols.size === 1) {
                pkFilter.push(Filter.create(queryInfo.pkCols.first(), keyValue))
            } else {
                // Note: This behavior of not throwing an error, and continuing despite not having a single PK column is
                // inherited from QueryGridModel, we may want to rethink this before widely adopting this API.
                const warning = 'Too many keys. Unable to filter for specific keyValue.';
                console.warn(warning, queryInfo.pkCols.toJS());
            }

            return [...pkFilter, ...this.getDetailFilters()];
        }

        return [ ...baseFilters, ...filterArray, ...queryInfo.getFilters(schemaQuery.viewName).toArray() ]
    }

    getColumnString(): string {
        const { queryInfo, requiredColumns, omittedColumns } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot construct column string, no QueryInfo available');
        }

        const keyColumnFieldKeys = this.getKeyColumns().map(fieldKeyMapper);
        const displayColumnFieldKeys = this.getDisplayColumns().map(fieldKeyMapper);
        let fieldKeys = [...requiredColumns, ...keyColumnFieldKeys, ...displayColumnFieldKeys];

        if (omittedColumns.length) {
            const lowerOmit = omittedColumns.map(c => c.toLowerCase());
            fieldKeys = fieldKeys.filter(fieldKey => lowerOmit.indexOf(fieldKey.toLowerCase()) > -1);
        }

        return fieldKeys.join(',');
    }

    getSortString(): string {
        const { sorts, schemaQuery, queryInfo } = this;

        if (!queryInfo) {
            // Throw an error because this method is only used when making an API request, and if we don't have a
            // QueryInfo then we're going to make a bad request. It's better to error here before hitting the server.
            throw new Error('Cannot construct sort string, no QueryInfo available');
        }

        let sortStrings = sorts?.map(sortStringMapper) || [];
        const { viewName } = schemaQuery;
        const viewSorts = queryInfo.getSorts(viewName).map(sortStringMapper).toArray();

        if (viewSorts.length > 0) {
            sortStrings = sortStrings.concat(viewSorts);
        }

        return sortStrings.join(',');
    }

    /**
     * Returns the data needed for a <Grid /> component to render.
     */
    getGridData() {
        return this.orderedRows.map(i => this.rows[i]);
    }

    getPageCount(): number {
        const { maxRows, rowCount } = this;
        return maxRows > 0 ? Math.ceil(rowCount / maxRows) : 1;
    }

    getCurrentPage(): number {
        const { offset, maxRows } = this;
        return offset > 0 ? Math.floor(offset / maxRows) + 1 : 1;
    }

    getLastPageOffset(): number {
        return (this.getPageCount() - 1) * this.maxRows;
    }

    getViews(): ViewInfo[] {
        return this.queryInfo?.views.sortBy(v => v.label, naturalSort).toArray();
    }

    hasData(): boolean {
        return this.rows !== undefined;
    }

    isLoading(): boolean {
        const { queryInfoLoadingState, rowsLoadingState } = this;
        return (
            queryInfoLoadingState === LoadingState.INITIALIZED ||
            queryInfoLoadingState === LoadingState.LOADING ||
            rowsLoadingState === LoadingState.INITIALIZED ||
            rowsLoadingState === LoadingState.LOADING
        );
    }

    isLastPage(): boolean {
        return this.getCurrentPage() === this.getPageCount();
    }

    isFirstPage(): boolean {
        return this.getCurrentPage() === 1;
    }
}
