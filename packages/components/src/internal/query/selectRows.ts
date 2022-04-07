import { Query } from '@labkey/api';

import { QueryInfo, SchemaQuery, URLResolver } from '../..';
import { getContainerFilter, getQueryDetails } from './api';

export interface SelectRowsOptions
    extends Omit<Query.SelectRowsOptions, 'queryName' | 'requiredVersion' | 'schemaName' | 'scope'> {
    schemaQuery: SchemaQuery;
}

export interface RowResult {
    displayValue?: any;
    url?: string;
    value: any;
}

export interface SelectRowsResponse {
    messages: Array<Record<string, string>>;
    queryInfo: QueryInfo;
    rows: Array<Record<string, RowResult>>;
    rowCount: number;
    schemaQuery: SchemaQuery;
}

export async function selectRows(options: SelectRowsOptions): Promise<SelectRowsResponse> {
    const {
        containerFilter = getContainerFilter(options.containerPath),
        columns = '*',
        method = 'POST',
        schemaQuery,
        ...selectRowsOptions
    } = options;
    const { queryName, schemaName } = schemaQuery;

    const [queryInfo, resolved] = await Promise.all([
        getQueryDetails({ containerPath: options.containerPath, queryName, schemaName }),
        new Promise<any>((resolve, reject) => {
            Query.selectRows({
                ...selectRowsOptions,
                columns,
                containerFilter,
                method,
                queryName,
                requiredVersion: 17.1,
                schemaName,
                success: json => {
                    resolve(new URLResolver().resolveSelectRows(json));
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

    return {
        messages: resolved.messages,
        queryInfo,
        rows: resolved.rows,
        rowCount: resolved.rowCount,
        schemaQuery,
    };
}
