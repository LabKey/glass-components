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

export interface ImportTemplate {
    label: string;
    url: string;
}
// Commented out attributes are not used in app, but are returned by the server
export class QueryInfo {
    declare appEditableTable: boolean; // use isAppEditable()
    declare altUpdateKeys: Set<string>;
    declare disabledSystemFields: Set<string>;
    // declare canEdit: boolean;
    // declare canEditSharedViews: boolean;
    declare columns: ExtendedMap<string, QueryColumn>;
    declare description: string;
    declare domainContainerPath: string;
    // declare editDefinitionUrl: string;
    declare iconURL: string;
    declare importTemplates: ImportTemplate[];
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
     * almost never call this constructor yourself. The vast majority of the time you should be using the
     * applyQueryMetadata method to instantiate a QueryInfo, however for some simpler test cases we can use the
     * fromJsonForTests static method to instantiate a new QueryInfo.
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
     * @param queryInfoJson The JSON representation of the QueryInfo from LabKey Server
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

        const disabledSystemFields = new Set<string>(queryInfoJson.disabledSystemFields ?? []);
        const altUpdateKeys = new Set<string>(queryInfoJson.altUpdateKeys ?? []);
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

        const lowerOmit = toLowerSafe(omittedColumns ?? []);
        const viewInfo = this.getView(view);

        if (viewInfo) {
            const displayColumns = viewInfo.columns.reduce((result, col) => {
                if (col.fieldKey && lowerOmit.includes(col.fieldKey.toLowerCase())) {
                    return result;
                }

                let c = this.getColumn(col.fieldKey);

                if (c !== undefined) {
                    if (col.title !== undefined) {
                        c = c.mutate({ caption: col.title, shortCaption: col.title });
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
                const columnFieldKeysLc = viewInfo.columns.reduce((result, col) => {
                    result.add(col.fieldKey.toLowerCase());
                    return result;
                }, new Set<string>());

                displayColumns.push(...this.getExtraDisplayColumns(columnFieldKeysLc, lowerOmit));
            }

            return displayColumns;
        }

        if (process.env.NODE_ENV !== 'test') {
            console.warn('Unable to find columns on view:', view, '(' + this.schemaName + '.' + this.name + ')');
        }

        return [];
    }

    getExtraDisplayColumns(columnFieldKeysLc: Set<string>, lowerOmit?: string[]): QueryColumn[] {
        const extraDisplayColumn = [];
        const disabledSysFields = [];
        this.disabledSystemFields?.forEach(field => {
            disabledSysFields.push(field.toLowerCase());
        });

        this.columns.forEach(col => {
            const fieldKey = col.fieldKey.toLowerCase();
            if (
                fieldKey &&
                col.addToSystemView &&
                !columnFieldKeysLc.has(fieldKey) &&
                disabledSysFields.indexOf(fieldKey) === -1
            ) {
                if (!lowerOmit || !lowerOmit.includes(col.fieldKey.toLowerCase())) extraDisplayColumn.push(col);
            }
        });

        return extraDisplayColumn;
    }

    hasIdentifyingFieldsView(): boolean {
        if (this.views.has(ViewInfo.IDENTIFYING_FIELDS_VIEW_NAME)) {
            // if the view is defined but only has the default Name column, consider it not to be defined
            const cols = this.views
                .get(ViewInfo.IDENTIFYING_FIELDS_VIEW_NAME)
                .columns.filter(col => col.fieldKey.toLowerCase() !== 'name');
            return cols.length > 0;
        }
        return false;
    }

    getIdentifyingFieldsEditableGridColumns(
        includeNameField = false,
        hasProductFolders = false,
        prefixFieldKey?: string,
        ancestorOnly?: boolean
    ): QueryColumn[] {
        const cols: QueryColumn[] = [];
        if (this.hasIdentifyingFieldsView()) {
            const identifyingCols = this.getDisplayColumns(ViewInfo.IDENTIFYING_FIELDS_VIEW_NAME)
                .filter(col => includeNameField || col.fieldKey.toLowerCase() !== 'name')
                // if app hasProductFolders and Folder is set as an identifying field, we don't want to include it since it will already be in the editable grid
                .filter(col => !hasProductFolders || col.fieldKey.toLowerCase() !== 'folder');

            identifyingCols.forEach(col => {
                if (ancestorOnly && !col.name.startsWith('Ancestors/')) return;
                const qCol = new QueryColumn(col);
                qCol.readOnly = true;
                if (prefixFieldKey) {
                    qCol.name = prefixFieldKey + '/' + qCol.name;
                    qCol.fieldKey = prefixFieldKey + '/' + qCol.fieldKey;
                }
                if (ancestorOnly) {
                    qCol.shownInInsertView = true;
                }

                cols.push(qCol);
            });
        }
        return cols;
    }

    getIdentifyingFieldsForInsert(): QueryColumn[] {
        return this.getIdentifyingFieldsEditableGridColumns(false, false, null, true);
    }

    getLookupViewColumns(displayColumnFieldKey?: string): QueryColumn[] {
        let cols: QueryColumn[] = [];
        if (this.hasIdentifyingFieldsView()) {
            this.views.get(ViewInfo.IDENTIFYING_FIELDS_VIEW_NAME).columns.forEach(col => {
                const qCol = this.getColumn(col.fieldKey);
                if (qCol) {
                    if (col.title) {
                        cols.push(qCol.mutate({ caption: col.title }));
                    } else {
                        cols.push(qCol);
                    }
                }
            });
        } else {
            const displayColumn = this.getColumn(displayColumnFieldKey);
            let lcDisplayColumnFieldKey: string;
            if (displayColumn) {
                lcDisplayColumnFieldKey = displayColumnFieldKey?.toLowerCase();
                cols.push(displayColumn);
            }
            cols = cols.concat(
                this.columns.filter(
                    col => col.shownInLookupView && col.fieldKey.toLowerCase() !== lcDisplayColumnFieldKey
                ).valueArray
            );
        }
        return cols;
    }

    getAllColumns(viewName?: string, omittedColumns?: string[]): QueryColumn[] {
        // initialReduction is getDisplayColumns() because they include custom metadata from the view, like alternate
        // column display names (e.g. the Experiment grid overrides Title to "Experiment Title"). See Issue 38186 for
        // additional context.
        return this.columns.reduce(
            (result, rawColumn) => {
                if (!result.find(displayColumn => displayColumn.name === rawColumn.name)) {
                    result.push(rawColumn);
                }

                return result;
            },
            this.getDisplayColumns(viewName, omittedColumns)
        );
    }

    // @param isIncludedColumn can be used to filter out columns that should not be designate as insertColumns
    // (e.g., if creating samples that are not aliquots, the aliquot-only fields should never be included)
    getInsertColumns(isIncludedColumn?: (col: QueryColumn) => boolean, requiredColumns?: string[]): QueryColumn[] {
        const lowerRequiredColumnsSet = requiredColumns?.reduce((result, value) => {
            result.add(value.toLowerCase());
            return result;
        }, new Set());
        // CONSIDER: use the columns in ~~INSERT~~ view to determine this set
        return this.columns.valueArray.filter(
            col =>
                lowerRequiredColumnsSet?.has(col.fieldKey.toLowerCase()) ||
                insertColumnFilter(col, false, isIncludedColumn)
        );
    }

    getUpdateColumns(requiredColumns?: string[]): QueryColumn[] {
        const lowerRequiredColumnsSet = requiredColumns?.reduce((result, value) => {
            result.add(value.toLowerCase());
            return result;
        }, new Set());

        return this.columns.valueArray.filter(column => {
            return (
                column.isUpdateColumn ||
                (lowerRequiredColumnsSet && lowerRequiredColumnsSet.has(column.fieldKey.toLowerCase()))
            );
        });
    }

    getUpdateDisplayColumns(view?: string, omittedColumns?: string[]): QueryColumn[] {
        return this.getDisplayColumns(view, omittedColumns).filter(col => col.isUpdateColumn);
    }

    getFilters(view = ViewInfo.DEFAULT_NAME): Filter.IFilter[] {
        const viewInfo = this.getView(view);

        if (viewInfo) {
            return viewInfo.filters;
        }

        if (process.env.NODE_ENV !== 'test') {
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

    getCustomTemplates(): ImportTemplate[] {
        return this.importTemplates.filter(
            template => template.url.toLowerCase().indexOf('exportexceltemplate') === -1
        );
    }
}
