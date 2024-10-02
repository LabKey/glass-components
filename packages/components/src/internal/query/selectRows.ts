import { Query } from '@labkey/api';

import { SchemaQuery } from '../../public/SchemaQuery';
import { QueryInfo } from '../../public/QueryInfo';
import { URLResolver } from '../url/URLResolver';

import { getContainerFilter, getQueryDetails, isSelectRowMetadataRequired } from './api';

export interface SelectRowsOptions
    extends Omit<Query.SelectRowsOptions, 'queryName' | 'requiredVersion' | 'schemaName' | 'scope'> {
    schemaQuery: SchemaQuery;
}

export interface RowValue {
    displayValue?: any;
    formattedValue?: any;
    url?: string;
    value: any;
}
export type Row = Record<string, RowValue>;

export interface SelectRowsResponse {
    messages: Array<Record<string, string>>;
    queryInfo: QueryInfo;
    rowCount: number;
    rows: Row[];
    schemaQuery: SchemaQuery;
}

export async function selectRows(options: SelectRowsOptions): Promise<SelectRowsResponse> {
    const {
        containerFilter = getContainerFilter(options.containerPath),
        columns = '*',
        includeMetadata,
        includeTotalCount = false, // default to false to improve performance
        method = 'POST',
        schemaQuery,
        ...selectRowsOptions
    } = options;
    const { queryName, schemaName, viewName } = schemaQuery;

    if (process.env.NODE_ENV === 'test') {
        return {
            messages: [],
            queryInfo: new QueryInfo({}),
            rows: [],
            rowCount: 0,
            schemaQuery,
        };
    }

    const [queryInfo, response] = await Promise.all([
        getQueryDetails({ containerPath: options.containerPath, schemaQuery }),
        new Promise<any>((resolve, reject) => {
            Query.selectRows({
                ...selectRowsOptions,
                columns,
                containerFilter,
                includeMetadata: isSelectRowMetadataRequired(includeMetadata, columns),
                includeTotalCount,
                method,
                queryName,
                requiredVersion: 17.1,
                schemaName,
                viewName,
                success: response_ => {
                    resolve(response_);
                },
                failure: (data, request) => {
                    console.error('There was a problem retrieving the data', data);
                    reject({
                        exceptionClass: data.exceptionClass,
                        message: data.exception,
                        schemaQuery,
                        status: request.status,
                    });
                },
            });
        }),
    ]);

    const resolved = new URLResolver().resolveSelectRows(response, queryInfo);

    return {
        messages: resolved.messages,
        queryInfo,
        rows: resolved.rows,
        rowCount: resolved.rowCount,
        schemaQuery,
    };
}
