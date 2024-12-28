import React, { FC, memo, PureComponent, ReactNode } from 'react';
import { fromJS, List } from 'immutable';

import { SchemaQuery } from '../../public/SchemaQuery';
import { QueryInfo } from '../../public/QueryInfo';

import { resolveErrorMessage } from '../util/messaging';

import { getQueryDetails, selectRowsDeprecated } from '../query/api';

import { LoadingSpinner } from './base/LoadingSpinner';
import { Grid } from './base/Grid';
import { Alert } from './base/Alert';

interface PreviewGridProps {
    numCols: number;
    numRows: number;
    schemaQuery: SchemaQuery;
}

interface PreviewGridState {
    data: any;
    error: string;
    loading: boolean;
    queryInfo: QueryInfo;
}

type StatelessPreviewGridProps = PreviewGridProps & PreviewGridState;

export const StatelessPreviewGrid: FC<StatelessPreviewGridProps> = memo(props => {
    const { loading, data, error, queryInfo, numCols, numRows, schemaQuery } = props;
    let body = <LoadingSpinner />;

    if (loading === false && data !== null) {
        const { viewName } = schemaQuery;
        const allColumns = queryInfo.getDisplayColumns(viewName);
        const columns = allColumns.slice(0, numCols);
        const slicedData = data.slice(0, numRows).toList();
        let rowStats = '';

        if (slicedData.size === 1) {
            rowStats = ' first row and';
        } else if (slicedData.size > 1) {
            rowStats = ` first ${slicedData.size} rows and`;
        }

        const stats = `Previewing${rowStats} ${columns.length} of ${allColumns.length} columns.`;
        body = (
            <>
                <p>{stats}</p>
                <Grid bordered columns={columns} data={slicedData} />
            </>
        );
    } else if (loading === false && error !== null) {
        body = <Alert>{error}</Alert>;
    }

    return <div className="preview-grid">{body}</div>;
});
StatelessPreviewGrid.displayName = 'StatelessPreviewGrid';

export class PreviewGrid extends PureComponent<PreviewGridProps, PreviewGridState> {
    constructor(props) {
        super(props);

        this.state = {
            queryInfo: null,
            data: null,
            loading: false,
            error: null,
        };
    }

    componentDidMount(): void {
        this.fetchData();
    }

    fetchData = (): void => {
        this.setState(() => ({ loading: true }));
        const { numCols, numRows } = this.props;
        const { schemaName, queryName, viewName } = this.props.schemaQuery;

        const handleFailure = resp => {
            // Do we know for sure that the error response in getQueryDetails will look the same as selectRows? We may
            // need to tweak this error handler to handle both cases, or just write one for each.
            const error = resolveErrorMessage(resp) || 'An unexpected error encountered while loading the data.';
            this.setState(() => ({
                error,
                loading: false,
            }));
        };

        getQueryDetails({ schemaName, queryName })
            .then((queryInfo: QueryInfo) => {
                const columns = queryInfo.getDisplayColumns(viewName).slice(0, numCols);
                const colString = queryInfo
                    .getPkCols()
                    .concat(columns)
                    .map(c => c.fieldKey)
                    .join(',');

                selectRowsDeprecated({
                    schemaName,
                    queryName,
                    viewName,
                    columns: colString,
                    maxRows: numRows,
                    // No need to include total count, we only want the first three rows and it could be a perf issue.
                    includeTotalCount: false,
                })
                    .then(({ key, models, orderedModels }) => {
                        const rows = fromJS(models[key]);
                        const data = List(orderedModels[key])
                            .map(id => rows.get(id))
                            .toList();
                        this.setState(() => ({
                            queryInfo,
                            data,
                            loading: false,
                            error: null,
                        }));
                    })
                    .catch(handleFailure);
            })
            .catch(handleFailure);
    };

    render(): ReactNode {
        return <StatelessPreviewGrid {...this.props} {...this.state} />;
    }
}
