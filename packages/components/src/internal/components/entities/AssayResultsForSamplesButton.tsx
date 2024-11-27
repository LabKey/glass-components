import React, { FC, memo, useCallback, useMemo } from 'react';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { getURLParamsForSampleSelectionKey } from '../samples/utils';
import { AppURL, createProductUrlFromParts } from '../../url/AppURL';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';
import { ASSAYS_KEY } from '../../app/constants';
import { User } from '../base/models/User';
import { incrementClientSideMetricCount } from '../../actions';
import { userCanReadAssays } from '../../app/utils';
import { ResponsiveMenuButton } from '../buttons/ResponsiveMenuButton';
import { SampleTypeDataType } from './constants';
import { MAX_SELECTION_ACTION_ROWS } from '../../constants';

function getAssayResultsHref(
    model: QueryModel,
    picklistName?: string,
    isAssay?: boolean,
    sampleFieldKey?: string,
    currentProductId?: string,
    targetProductId?: string
): string {
    const params = getURLParamsForSampleSelectionKey(model, picklistName, isAssay, sampleFieldKey);
    const actionUrl = createProductUrlFromParts(targetProductId, currentProductId, params, ASSAYS_KEY, 'sampleresults');
    return actionUrl instanceof AppURL ? actionUrl.toHref() : actionUrl;
}

interface Props {
    asSubMenu?: boolean;
    currentProductId?: string;
    isAssay?: boolean;
    isPicklist?: boolean;
    metricFeatureArea?: string;
    model: QueryModel;
    targetProductId?: string;
    user: User;
}

export const AssayResultsForSamplesMenuItem: FC<Props> = memo(props => {
    const { model, metricFeatureArea, isAssay, isPicklist, currentProductId, targetProductId, user } = props;
    const picklistName = useMemo(() => (isPicklist ? model.queryName : undefined), [model, isPicklist]);
    const sampleFieldKey = useMemo(
        () => (isAssay ? model.displayColumns?.find(c => c.isSampleLookup())?.fieldKey : undefined),
        [model, isAssay]
    );

    const incrementMetric = useCallback(() => {
        incrementClientSideMetricCount(metricFeatureArea, 'viewAssayResultsForSamples');
    }, [metricFeatureArea]);

    if (!userCanReadAssays(user)) return null;

    return (
        <SelectionMenuItem
            text="View Assay Results for Selected"
            href={getAssayResultsHref(model, picklistName, isAssay, sampleFieldKey, currentProductId, targetProductId)}
            onClick={incrementMetric}
            queryModel={model}
            maxSelection={MAX_SELECTION_ACTION_ROWS}
            nounPlural={SampleTypeDataType.nounPlural}
        />
    );
});

export const AssayResultsForSamplesButton: FC<Props> = memo(props => {
    const { asSubMenu, user } = props;
    if (!userCanReadAssays(user)) return null;

    return (
        <ResponsiveMenuButton className="sample-reports-menu" text="Reports" asSubMenu={asSubMenu} >
            <AssayResultsForSamplesMenuItem {...props} />
        </ResponsiveMenuButton>
    );
});
