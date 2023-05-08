// commented out attributes are not used in app
import { Record as ImmutableRecord } from 'immutable';

import { Filter } from '@labkey/api';

import { toLowerSafe } from '../internal/util/utils';

import { ViewInfo } from '../internal/ViewInfo';
import { LastActionStatus } from '../internal/LastActionStatus';

import { ExtendedMap } from './ExtendedMap';

import { insertColumnFilter, QueryColumn } from './QueryColumn';
import { SchemaQuery } from './SchemaQuery';
import { QuerySort } from './QuerySort';
import { naturalSortByProperty } from './sort';

export enum QueryInfoStatus {
    ok,
    notFound,
    unknown,
}

const QUERY_INFO_DEFAULTS = {
    altUpdateKeys: undefined,
    disabledSystemFields: undefined,
    // canEdit: false,
    // canEditSharedViews: false,
    columns: new ExtendedMap<string, QueryColumn>(),
    description: undefined,
    domainContainerPath: undefined,
    // editDefinitionUrl: undefined,
    importTemplates: [],
    // indices: {},
    // isInherited: false,

    iconURL: 'default',
    // isMetadataOverrideable: false,
    // isTemporary: false,
    // isUserDefined: false,
    lastAction: undefined,
    // lastUpdate: undefined,
    name: undefined,
    pkCols: [],
    schemaName: undefined,
    status: QueryInfoStatus.unknown,
    // targetContainers:[],
    title: undefined, // DEPRECATED: Use queryLabel
    titleColumn: undefined,
    // viewDataUrl: undefined,
    views: new ExtendedMap<string, ViewInfo>(),
    importUrlDisabled: undefined,
    importUrl: undefined,
    insertUrlDisabled: undefined,
    insertUrl: undefined,

    supportGroupConcatSubSelect: false,
    supportMerge: false,

    // our stuff
    appEditableTable: false,
    isLoading: false,
    isMedia: false, // opt in
    queryLabel: undefined,
    schemaLabel: undefined,
    schemaQuery: undefined,
    showInsertNewButton: true, // opt out
    singular: undefined, // defaults to value of queryLabel
    plural: undefined, // defaults to value of queryLabel
};

export class QueryInfo {
    private declare appEditableTable: boolean; // use isAppEditable()
    declare altUpdateKeys: Set<string>;
    declare disabledSystemFields: Set<string>;
    // declare canEdit: boolean;
    // declare canEditSharedViews: boolean;
    declare columns: ExtendedMap<string, QueryColumn>;
    declare description: string;
    declare domainContainerPath: string;
    // declare editDefinitionUrl: string;
    declare iconURL: string;
    declare importTemplates: any[];
    // declare indices: Record<string, any>;
    // declare isInherited: boolean;
    declare isLoading: boolean;
    declare isMedia: boolean;
    // declare isMetadataOverrideable: boolean;
    // declare isTemporary: boolean;
    // declare isUserDefined: boolean;
    declare lastAction: LastActionStatus;
    // declare lastUpdate: Date;
    declare name: string;
    declare pkCols: string[];
    declare plural: string;
    declare queryLabel: string;
    declare schemaName: string;
    declare schemaQuery: SchemaQuery;
    declare singular: string;
    declare status: QueryInfoStatus;
    declare supportGroupConcatSubSelect: boolean;
    declare supportMerge: boolean;
    // declare targetContainers: any[];
    declare title: string;
    declare titleColumn: string;
    // declare viewDataUrl: string;
    declare views: ExtendedMap<string, ViewInfo>;
    declare schemaLabel: string;
    declare showInsertNewButton: boolean;
    declare importUrlDisabled: boolean;
    declare importUrl: string;
    declare insertUrlDisabled: boolean;
    declare insertUrl: string;

    /**
     * This constructor merges a Partial<QueryInfo> with QUERY_INFO_DEFAULTS to create a QueryInfo object. You should
     * almost never call this constructor yourself. The vast majority of the time the constructor should be passed the
     * result of the applyQueryMetadata method, however for some simpler test cases we can use the fromJsonForTests
     * static method to instantiate a new QueryInfo.
     * @param data the Partial<QueryInfo> object to merge with QUERY_INFO_DEFAULTS when creating a QueryInfo.
     */
    constructor(data: Partial<QueryInfo>) {
        Object.assign(this, QUERY_INFO_DEFAULTS, data);
    }

    mutate(changes: Partial<QueryInfo>): QueryInfo {
        return new QueryInfo({ ...this, ...changes });
    }

    /**
     * Use this method for creating a basic QueryInfo object with a proper schemaQuery object and columns map from a
     * JSON object. This should only be used in tests. If you're adding more logic to this you should probably also be
     * adding that same logic to applyQueryMetadata. In the long run this method shouldn't exist and all tests should
     * use makeQueryInfo so we are testing with QueryInfos that are instantiated with the same logic as our apps are.
     *
     * @param queryInfoJson: The JSON representation of the QueryInfo from LabKey Server
     * @param includeViews boolean, if true this method parses the views from the JSON object and converts them to
     * ViewInfo objects. Defaults to false.
     */
    static fromJsonForTests(queryInfoJson: any, includeViews = false): QueryInfo {
        let schemaQuery: SchemaQuery;

        if (queryInfoJson.schemaName && queryInfoJson.name) {
            schemaQuery = new SchemaQuery(queryInfoJson.schemaName, queryInfoJson.name);
        }
        const columns = new ExtendedMap<string, QueryColumn>();
        Object.keys(queryInfoJson.columns ?? {}).forEach(columnKey => {
            const rawColumn = queryInfoJson.columns[columnKey];
            columns.set(rawColumn.fieldKey.toLowerCase(), new QueryColumn(rawColumn));
        });

        const disabledSystemFields = new Set<string>();
        if (queryInfoJson.disabledSystemFields?.length > 0) {
            queryInfoJson.disabledSystemFields?.forEach(field => {
                disabledSystemFields.add(field);
            });
        }

        const altUpdateKeys = new Set<string>();
        if (queryInfoJson.altUpdateKeys?.length > 0) {
            queryInfoJson.altUpdateKeys?.forEach(key => {
                altUpdateKeys.add(key);
            });
        }

        const views = new ExtendedMap<string, ViewInfo>();
        if (includeViews) {
            queryInfoJson.views.forEach(view => {
                const viewInfo = ViewInfo.fromJson(view);
                views.set(viewInfo.name.toLowerCase(), viewInfo);
            });
        }

        return new QueryInfo(
            Object.assign({}, queryInfoJson, {
                altUpdateKeys,
                disabledSystemFields,
                columns,
                schemaQuery,
                views,
            })
        );
    }

    isAppEditable(): boolean {
        return this.appEditableTable && this.getPkCols().length > 0;
    }

    getColumn(fieldKey: string): QueryColumn {
        if (fieldKey) {
            return this.columns.get(fieldKey.toLowerCase());
        }

        return undefined;
    }

    isRequiredColumn(fieldKey: string): boolean {
        const column = this.getColumn(fieldKey);
        return column ? column.required : false;
    }

    getDetailDisplayColumns(view?: string, omittedColumns?: string[]): QueryColumn[] {
        return this.getDisplayColumns(view, omittedColumns).filter(col => col.isDetailColumn);
    }

    getDisplayColumns(view?: string, omittedColumns?: string[]): QueryColumn[] {
        if (!view) {
            view = ViewInfo.DEFAULT_NAME;
        }

        let lowerOmit;
        if (omittedColumns) lowerOmit = toLowerSafe(omittedColumns);

        const colFilter = (c): boolean => {
            if (lowerOmit && lowerOmit.size > 0) {
                return c && c.fieldKey && !lowerOmit.includes(c.fieldKey.toLowerCase());
            }
            return true;
        };

        const viewInfo = this.getView(view);
        if (viewInfo) {
            const displayColumns = viewInfo.columns.filter(colFilter).reduce((result, col) => {
                let c = this.getColumn(col.fieldKey);

                if (c !== undefined) {
                    if (col.title !== undefined) {
                        c = c.mutate({
                            caption: col.title,
                            shortCaption: col.title,
                        });
                    }

                    result.push(c);
                } else {
                    console.warn(
                        `Unable to resolve column '${col.fieldKey}' on view '${viewInfo.name}' (${this.schemaName}.${this.name})`
                    );
                }

                return result;
            }, []);

            // add addToSystemView columns to unsaved system view (i.e. the default-default view, details view, or update view)
            if ((viewInfo.isDefault || viewInfo.isSystemView) && !viewInfo.isSaved && !viewInfo.session) {
                const columnFieldKeys = viewInfo.columns.reduce((result, col) => {
                    result.add(col.fieldKey.toLowerCase());
                    return result;
                }, new Set());

                const disabledSysFields = [];
                this.disabledSystemFields?.forEach(field => {
                    disabledSysFields.push(field.toLowerCase());
                });

                this.columns.forEach(col => {
                    const fieldKey = col.fieldKey?.toLowerCase();
                    if (
                        fieldKey &&
                        col.addToSystemView &&
                        !columnFieldKeys.has(fieldKey) &&
                        disabledSysFields.indexOf(fieldKey) === -1
                    ) {
                        if (!lowerOmit || !lowerOmit.includes(col.fieldKey.toLowerCase()))
                            displayColumns.push(col);
                    }
                });
            }

            return displayColumns;
        }

        console.warn('Unable to find columns on view:', view, '(' + this.schemaName + '.' + this.name + ')');
        return [];
    }

    getLookupViewColumns(omittedColumns?: string[]): QueryColumn[] {
        const lcCols = omittedColumns ? omittedColumns.map(c => c.toLowerCase()) : [];
        return this.columns.filter(col => col.shownInLookupView && lcCols.indexOf(col.fieldKey.toLowerCase()) === -1)
            .valueArray;
    }

    getAllColumns(viewName?: string, omittedColumns?: string[]): QueryColumn[] {
        // initialReduction is getDisplayColumns() because they include custom metadata from the view, like alternate
        // column display names (e.g. the Experiment grid overrides Title to "Experiment Title"). See Issue 38186 for
        // additional context.
        return this.columns.reduce((result, rawColumn) => {
            if (!result.find(displayColumn => displayColumn.name === rawColumn.name)) {
                result.push(rawColumn);
            }

            return result;
        }, this.getDisplayColumns(viewName, omittedColumns));
    }

    // @param isIncludedColumn can be used to filter out columns that should not be designate as insertColumns
    // (e.g., if creating samples that are not aliquots, the aliquot-only fields should never be included)
    getInsertColumns(isIncludedColumn?: (col: QueryColumn) => boolean): QueryColumn[] {
        // CONSIDER: use the columns in ~~INSERT~~ view to determine this set
        return this.columns.valueArray.filter(col => insertColumnFilter(col, false, isIncludedColumn));
    }

    getInsertColumnIndex(fieldKey: string): number {
        if (!fieldKey) return -1;

        const lcFieldKey = fieldKey.toLowerCase();
        return this.getInsertColumns().findIndex(column => column.fieldKey.toLowerCase() === lcFieldKey);
    }

    getUpdateColumns(readOnlyColumns?: string[]): QueryColumn[] {
        const lowerReadOnlyColumnsSet = readOnlyColumns?.reduce((result, value) => {
            result.add(value.toLowerCase());
            return result;
        }, new Set());
        const columns = this.columns.valueArray
            .filter(column => {
                return (
                    column.isUpdateColumn ||
                    (lowerReadOnlyColumnsSet && lowerReadOnlyColumnsSet.has(column.fieldKey.toLowerCase()))
                );
            })
            .map(column => {
                if (lowerReadOnlyColumnsSet && lowerReadOnlyColumnsSet.has(column.fieldKey.toLowerCase())) {
                    return column.mutate({ readOnly: true });
                } else {
                    return column;
                }
            });
        return columns;
    }

    getUpdateDisplayColumns(view?: string, omittedColumns?: string[]): QueryColumn[] {
        return this.getDisplayColumns(view, omittedColumns).filter(col => col.isUpdateColumn);
    }

    getFilters(view?: string): Filter.IFilter[] {
        if (view) {
            const viewInfo = this.getView(view);

            if (viewInfo) {
                return viewInfo.filters;
            }

            console.warn('Unable to find view:', view, '(' + this.schemaName + '.' + this.name + ')');
        }

        return [];
    }

    getPkCols(): QueryColumn[] {
        return this.pkCols.reduce((list, pkFieldKey) => {
            const pkCol = this.getColumn(pkFieldKey);

            if (pkCol) {
                list.push(pkCol);
            } else {
                console.warn(`Unable to resolve pkCol '${pkFieldKey}' on (${this.schemaName}.${this.name})`);
            }

            return list;
        }, []);
    }

    getUniqueIdColumns(): QueryColumn[] {
        return this.columns.valueArray.filter(column => column.isUniqueIdColumn);
    }

    getSorts(view?: string): QuerySort[] {
        if (view) {
            const viewInfo = this.getView(view);

            if (viewInfo) {
                return viewInfo.sorts;
            }

            console.warn('Unable to find view:', view, '(' + this.schemaName + '.' + this.name + ')');
        }

        return [];
    }

    /**
     * An array of [[ViewInfo]] objects that are visible for a user to choose in the view menu. Note that the returned
     * array will be sorted by view label.
     */
    getVisibleViews(): ViewInfo[] {
        return this.views.filter(view => view.isVisible).valueArray.sort(naturalSortByProperty('label'));
    }

    getView(viewName: string, defaultToDefault = false): ViewInfo {
        let _viewName = viewName?.toLowerCase();
        if (_viewName === '') _viewName = ViewInfo.DEFAULT_NAME.toLowerCase();

        if (_viewName) {
            // see if there is a specific detail view override
            if (_viewName === ViewInfo.DETAIL_NAME.toLowerCase()) {
                const details = this.views.get(ViewInfo.BIO_DETAIL_NAME.toLowerCase());
                if (details) {
                    return details;
                }
            }

            const view = this.views.get(_viewName);
            if (view) return view;
        }

        return defaultToDefault ? this.views.get(ViewInfo.DEFAULT_NAME.toLowerCase()) : undefined;
    }

    getIconURL(): string {
        return this.iconURL;
    }

    /**
     * Get an array of fieldKeys for the column keys provided.
     * Default to getting all column fieldKeys if no parameter provided
     * @param keys The column keys to filter by
     */
    getColumnFieldKeys(keys?: string[]): string[] {
        if (this.columns) {
            return this.columns
                .filter((col, key) => !keys || keys.indexOf(key) > -1)
                .valueArray.map(col => col.fieldKey);
        }

        return [];
    }

    getColumnIndex(fieldKey: string): number {
        if (!fieldKey) return -1;

        const lcFieldKey = fieldKey.toLowerCase();
        return this.columns.keyArray.findIndex((column: string) => column.toLowerCase() === lcFieldKey);
    }

    getShowImportDataButton(): boolean {
        return !!(this.showInsertNewButton && this.importUrl && !this.importUrlDisabled);
    }

    getShowInsertNewButton(): boolean {
        return !!(this.showInsertNewButton && this.insertUrl && !this.insertUrlDisabled);
    }

    // Note: Why does this method exist? Couldn't consumers use getInsertColumns to get the columns they want?
    getInsertQueryInfo(): QueryInfo {
        return this.mutate({ columns: this.columns.filter(column => column.shownInInsertView && !column.isFileInput) });
    }

    getFileColumnFieldKeys(): string[] {
        return this.columns.filter(col => col.isFileInput).valueArray.map(col => col.fieldKey);
    }
}
