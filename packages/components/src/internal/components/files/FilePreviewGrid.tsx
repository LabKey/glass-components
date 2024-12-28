import React, { FC, memo } from 'react';
import { List, Map } from 'immutable';

import { FileGridPreviewProps } from '../../../public/files/models';
import { GridColumnProps } from '../base/models/GridColumn';
import { Alert } from '../base/Alert';
import { Grid } from '../base/Grid';

type Props = FileGridPreviewProps & {
    columns?: GridColumnProps[];
    data: List<Map<string, any>>;
    errorMsg?: string;
};

export const FilePreviewGrid: FC<Props> = memo(props => {
    const { data, columns, header = 'File preview:', infoMsg, errorMsg, errorStyle = 'warning', warningMsg } = props;
    const numRows = data ? data.size : 0;
    const hasError = !!errorMsg;

    return (
        <>
            {hasError && <Alert bsStyle={errorStyle}>{errorMsg}</Alert>}
            {!hasError && (
                <>
                    <strong>{header}</strong>
                    <Alert className="margin-top" bsStyle="warning">
                        {warningMsg}
                    </Alert>
                    <p className="margin-top">
                        <span>
                            The {numRows === 1 ? 'one row ' : 'first ' + numRows + ' rows '} of your data file{' '}
                            {numRows === 1 ? 'is' : 'are'} shown below.
                        </span>
                        &nbsp;
                        {infoMsg}
                    </p>
                    <Grid columns={columns} data={data} />
                </>
            )}
        </>
    );
});
FilePreviewGrid.displayName = 'FilePreviewGrid';
