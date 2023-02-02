import React, { FC, memo, useMemo } from 'react';
import { Experiment, Filter } from '@labkey/api';
import { List, Map } from 'immutable';

import { Renderer, resolveDetailRenderer } from '../../forms/detail/DetailDisplay';
import { LoadingSpinner } from '../../base/LoadingSpinner';
import { Alert } from '../../base/Alert';
import { DetailPanel } from '../../../../public/QueryModel/DetailPanel';
import { SchemaQuery } from '../../../../public/SchemaQuery';
import { ViewInfo } from '../../../ViewInfo';
import { QueryColumn } from '../../../../public/QueryColumn';
import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../../../../public/QueryModel/withQueryModels';

const ADDITIONAL_DETAIL_FIELDS = ['properties'];

export interface LineageDetailProps {
    item: Experiment.LineageItemBase;
}

const LineageDetailImpl: FC<LineageDetailProps & InjectedQueryModels> = memo(props => {
    const { actions, queryModels } = props;
    if (queryModels.model.isLoading) return <LoadingSpinner />;
    if (queryModels.model.hasLoadErrors) return <Alert>{queryModels.model.loadErrors[0]}</Alert>;

    const additionalCols = queryModels.model.allColumns.filter(
        col => ADDITIONAL_DETAIL_FIELDS.indexOf(col.fieldKey?.toLowerCase()) > -1
    );
    const detailColumns = [...queryModels.model.detailColumns, ...additionalCols];

    return (
        <DetailPanel
            model={queryModels.model}
            actions={actions}
            queryColumns={detailColumns}
            detailRenderer={_resolveDetailRenderer}
        />
    );
});

const LineageDetailWithQueryModels = withQueryModels<LineageDetailProps>(LineageDetailImpl);

export const LineageDetail: FC<LineageDetailProps> = memo(({ item }) => {
    const queryConfigs = useMemo<QueryConfigMap>(
        () => ({
            model: {
                baseFilters: item.pkFilters.map(pkFilter => Filter.create(pkFilter.fieldKey, pkFilter.value)),
                containerPath: item.container,
                // Issue 45028: Display details view columns in lineage
                schemaQuery: new SchemaQuery(item.schemaName, item.queryName, ViewInfo.DETAIL_NAME),
                // Must specify '*' columns be requested to resolve "properties" columns
                requiredColumns: ['*'],
            },
        }),
        [item]
    );

    // providing "key" to allow for reload on lsid change
    return <LineageDetailWithQueryModels key={item.lsid} autoLoad queryConfigs={queryConfigs} item={item} />;
});

interface RendererProps {
    data: List<Map<string, any>>;
}

// exported for jest testing
export const CustomPropertiesRenderer: FC<RendererProps> = memo(({ data }) => {
    return (
        <table className="lineage-detail-prop-table">
            <tbody>
                {data?.map(row => {
                    const fieldKey = row.get('fieldKey');
                    const name = fieldKey.substring(fieldKey.indexOf('#') + 1);

                    return (
                        <tr key={fieldKey}>
                            <td className="lineage-detail-prop-cell">{name}</td>
                            <td className="lineage-detail-prop-cell">{row.get('value')}</td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
});

function _resolveDetailRenderer(column: QueryColumn): Renderer {
    if (column.fieldKey.toLowerCase() === 'properties') {
        return d => <CustomPropertiesRenderer data={d} />;
    }

    return resolveDetailRenderer(column);
}
