import React, { FC, memo, useMemo } from 'react';
import { Filter } from '@labkey/api';

import { ASSAYS_KEY } from '../../app/constants';
import {AppURL} from "../../url/AppURL";
import {HeatMap, HeatMapCell} from "../heatmap/HeatMap";
import {Alert} from "../base/Alert";
import {SCHEMAS} from "../../schemas";

interface Props {
    excludedAssayProviders?: string[];
    navigate: (url: AppURL) => any;
}

const getAssayUrl = (provider: string, protocol: string, page?: string): AppURL => {
    if (provider && protocol) {
        if (page) return AppURL.create(ASSAYS_KEY, provider, protocol, page);
        return AppURL.create(ASSAYS_KEY, provider, protocol);
    }
    return undefined;
};

const getCellUrl = (row: Record<string, any>): AppURL => {
    const protocolName = row.Protocol?.displayValue;
    const providerName = row.Provider.value;
    return getAssayUrl(providerName, protocolName, 'runs');
};

const getHeaderUrl = (cell: HeatMapCell): AppURL => {
    const provider = cell.providerName;
    const protocol = cell.protocolName;
    return getAssayUrl(provider, protocol);
};

const getTotalUrl = (cell: HeatMapCell): AppURL => {
    const provider = cell.providerName;
    const protocol = cell.protocolName;
    return getAssayUrl(provider, protocol, 'runs');
};

const emptyDisplay = <Alert bsStyle="warning">No assay runs have been imported within the last 12 months.</Alert>;

export const AssaysHeatMap: FC<Props> = memo(props => {
    const { navigate, excludedAssayProviders } = props;

    const filters = useMemo(() => {
        if (excludedAssayProviders) return [Filter.create('Provider', excludedAssayProviders, Filter.Types.NOT_IN)];

        return undefined;
    }, [excludedAssayProviders]);

    return (
        <HeatMap
            schemaQuery={SCHEMAS.EXP_TABLES.ASSAY_HEAT_MAP}
            nounSingular="run"
            nounPlural="runs"
            yAxis="protocolName"
            xAxis="monthName"
            measure="monthTotal"
            yInRangeTotal="InRangeTotal"
            yTotalLabel="12 month total runs"
            getCellUrl={getCellUrl}
            getHeaderUrl={getHeaderUrl}
            getTotalUrl={getTotalUrl}
            headerClickUrl={AppURL.create('q', 'exp', 'assayruns')}
            emptyDisplay={emptyDisplay}
            navigate={navigate}
            filters={filters}
        />
    );
});
