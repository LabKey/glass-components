import { List, Map } from 'immutable';
import { Filter, Query } from '@labkey/api';

import { QueryInfo } from '../../public/QueryInfo';
import {
    DataTypeEntity,
    EntityDataType,
    FolderConfigurableDataType,
    IEntityTypeOption,
} from '../components/entities/models';
import {
    getEntityTypeOptionsWithExclusions,
    getFolderConfigurableEntityTypeOptions,
} from '../components/entities/actions';
import { getDataTypeFolderDataCount, getFolderDataTypeDataCount } from '../components/folder/actions';

import {
    clearSelected,
    ClearSelectedOptions,
    deleteView,
    getGridViews,
    GetSelectedResponse,
    getSelection,
    getSnapshotSelections,
    incrementClientSideMetricCount,
    renameGridView,
    replaceSelected,
    ReplaceSelectedOptions,
    saveGridView,
    saveSessionView,
    SelectionResponse,
    SelectResponse,
    setSelected,
    setSnapshotSelections,
} from '../actions';

import { SchemaQuery } from '../../public/SchemaQuery';

import { ViewInfo } from '../ViewInfo';

import { QueryColumn } from '../../public/QueryColumn';

import { incrementRowCountMetric } from '../components/editable/utils';

import {
    deleteRows,
    deleteRowsByContainer,
    DeleteRowsOptions,
    getDefaultVisibleColumns,
    getQueryDetails,
    GetQueryDetailsOptions,
    getServerDate,
    insertRows,
    InsertRowsOptions,
    QueryCommandResponse,
    saveRowsByContainer,
    SaveRowsOptions,
    SelectDistinctOptions,
    selectDistinctRows,
    updateRows,
    updateRowsByContainer,
    UpdateRowsOptions,
} from './api';
import { selectRows, SelectRowsOptions, SelectRowsResponse } from './selectRows';

export interface QueryAPIWrapper {
    clearSelected: (options: ClearSelectedOptions) => Promise<SelectResponse>;
    deleteRows: (options: DeleteRowsOptions) => Promise<QueryCommandResponse>;
    deleteRowsByContainer: (options: DeleteRowsOptions, containerField: string) => Promise<QueryCommandResponse>;
    deleteView: (schemaQuery: SchemaQuery, containerPath: string, viewName?: string, revert?: boolean) => Promise<void>;
    getDataTypeFolderDataCount: (
        entityDataType: EntityDataType,
        dataTypeRowId: number,
        dataTypeName: string
    ) => Promise<Record<string, number>>;
    getDefaultVisibleColumns: (options: GetQueryDetailsOptions) => Promise<QueryColumn[]>;
    getEntityTypeOptions: (
        entityDataType: EntityDataType,
        dataTypeExclusions?: { [key: string]: number[] },
        containerPath?: string
    ) => Promise<Map<string, List<IEntityTypeOption>>>;
    getFolderConfigurableEntityTypeOptions: (
        entityDataType: EntityDataType,
        containerPath?: string,
        containerFilter?: Query.ContainerFilter
    ) => Promise<DataTypeEntity[]>;
    getFolderDataTypeDataCount: (
        dataType: FolderConfigurableDataType,
        containerPath?: string,
        allDataTypes?: DataTypeEntity[],
        isNewFolder?: boolean
    ) => Promise<Record<string, number>>;
    getGridViews: (
        schemaQuery: SchemaQuery,
        sort?: boolean,
        viewName?: string,
        excludeSessionView?: boolean,
        includeHidden?: boolean
    ) => Promise<ViewInfo[]>;
    getQueryDetails: (options: GetQueryDetailsOptions) => Promise<QueryInfo>;
    getSelection: (
        searchParams: URLSearchParams,
        schemaName?: string,
        queryName?: string
    ) => Promise<SelectionResponse>;
    getServerDate: () => Promise<Date>;
    getSnapshotSelections: (key: string, containerPath?: string) => Promise<GetSelectedResponse>;
    incrementClientSideMetricCount: (featureArea: string, metricName: string) => void;
    incrementRowCountMetric: (featureArea: string, rowCount: number, isUpdate: boolean) => void;
    insertRows: (options: InsertRowsOptions) => Promise<QueryCommandResponse>;
    renameGridView: (
        schemaQuery: SchemaQuery,
        containerPath: string,
        viewName: string,
        newName: string
    ) => Promise<void>;
    replaceSelected: (options: ReplaceSelectedOptions) => Promise<SelectResponse>;
    saveGridView: (
        schemaQuery: SchemaQuery,
        containerPath: string,
        viewInfo: ViewInfo,
        replace: boolean,
        session: boolean,
        inherit: boolean,
        shared: boolean
    ) => Promise<void>;
    saveRowsByContainer: (options: SaveRowsOptions, containerField?: string) => Promise<Query.SaveRowsResponse>;
    saveSessionView: (
        schemaQuery: SchemaQuery,
        containerPath: string,
        viewName: string,
        newName: string,
        inherit?: boolean,
        shared?: boolean,
        replace?: boolean
    ) => Promise<void>;
    selectDistinctRows: (selectDistinctOptions: SelectDistinctOptions) => Promise<Query.SelectDistinctResponse>;
    selectRows: (options: SelectRowsOptions) => Promise<SelectRowsResponse>;
    setSelected: (
        key: string,
        checked: boolean,
        ids: string[] | string,
        containerPath?: string,
        validateIds?: boolean,
        schemaName?: string,
        queryName?: string,
        filters?: Filter.IFilter[],
        queryParameters?: Record<string, any>
    ) => Promise<SelectResponse>;
    setSnapshotSelections: (key: string, ids: string[] | string, containerPath?: string) => Promise<SelectResponse>;
    updateRows: (options: UpdateRowsOptions) => Promise<QueryCommandResponse>;
    updateRowsByContainer: (
        schemaQuery: SchemaQuery,
        rows: any[],
        containerPaths: string[],
        auditUserComment: string,
        containerField?: string
    ) => Promise<Query.SaveRowsResponse | QueryCommandResponse>;
}

export class QueryServerAPIWrapper implements QueryAPIWrapper {
    clearSelected = clearSelected;
    deleteRows = deleteRows;
    deleteRowsByContainer = deleteRowsByContainer;
    deleteView = deleteView;
    getDataTypeFolderDataCount = getDataTypeFolderDataCount;
    getEntityTypeOptions = getEntityTypeOptionsWithExclusions;
    getGridViews = getGridViews;
    getFolderConfigurableEntityTypeOptions = getFolderConfigurableEntityTypeOptions;
    getFolderDataTypeDataCount = getFolderDataTypeDataCount;
    getQueryDetails = getQueryDetails;
    getSnapshotSelections = getSnapshotSelections;
    getSelection = getSelection;
    getServerDate = getServerDate;
    incrementClientSideMetricCount = incrementClientSideMetricCount;
    incrementRowCountMetric = incrementRowCountMetric;
    insertRows = insertRows;
    renameGridView = renameGridView;
    replaceSelected = replaceSelected;
    saveGridView = saveGridView;
    saveRowsByContainer = saveRowsByContainer;
    saveSessionView = saveSessionView;
    selectRows = selectRows;
    selectDistinctRows = selectDistinctRows;
    setSelected = setSelected;
    setSnapshotSelections = setSnapshotSelections;
    updateRows = updateRows;
    updateRowsByContainer = updateRowsByContainer;
    getDefaultVisibleColumns = getDefaultVisibleColumns;
}

/**
 * Note: Intentionally does not use jest.fn() to avoid jest becoming an implicit external package dependency.
 */
export function getQueryTestAPIWrapper(
    mockFn = (): any => () => {},
    overrides: Partial<QueryAPIWrapper> = {}
): QueryAPIWrapper {
    return {
        clearSelected: mockFn(),
        deleteRows: mockFn(),
        deleteRowsByContainer: mockFn(),
        deleteView: mockFn(),
        getDataTypeFolderDataCount: mockFn(),
        getEntityTypeOptions: mockFn(),
        getGridViews: mockFn(),
        getFolderConfigurableEntityTypeOptions: mockFn(),
        getFolderDataTypeDataCount: mockFn(),
        getQueryDetails: mockFn(),
        getSnapshotSelections: mockFn(),
        getSelection: mockFn(),
        getServerDate: () => Promise.resolve(new Date()),
        incrementClientSideMetricCount: mockFn(),
        incrementRowCountMetric: mockFn(),
        insertRows: mockFn(),
        renameGridView: mockFn(),
        replaceSelected: mockFn(),
        saveGridView: mockFn(),
        saveRowsByContainer: mockFn(),
        saveSessionView: mockFn(),
        selectRows: mockFn(),
        selectDistinctRows: mockFn(),
        setSelected: mockFn(),
        setSnapshotSelections: mockFn(),
        updateRows: mockFn(),
        updateRowsByContainer: mockFn(),
        getDefaultVisibleColumns: mockFn(),
        ...overrides,
    };
}
