import React, { FC, memo, useCallback, useMemo } from 'react';

import { QueryModel } from '../../../public/QueryModel/QueryModel';
import { ResponsiveMenuButton } from '../buttons/ResponsiveMenuButton';
import { SelectionMenuItem } from '../menus/SelectionMenuItem';
import { SampleTypeDataType } from './constants';
import { getURLParamsForSampleSelectionKey } from '../samples/utils';
import { AppURL, createProductUrlFromParts } from '../../url/AppURL';
import { ASSAYS_KEY } from '../../app/constants';
import { incrementClientSideMetricCount } from '../../actions';
import { userCanReadAssays } from '../../app/utils';
import { User } from '../base/models/User';

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
            id="assay-sample-results-menu-item"
            text="View Assay Results for Selected"
            href={getAssayResultsHref(model, picklistName, isAssay, sampleFieldKey, currentProductId, targetProductId)}
            onClick={incrementMetric}
            queryModel={model}
            nounPlural={SampleTypeDataType.nounPlural}
        />
    );
});

export const AssayResultsForSamplesButton: FC<Props> = memo(props => {
    const { asSubMenu, user } = props;
    if (!userCanReadAssays(user)) return null;

    const items = <AssayResultsForSamplesMenuItem {...props} />;
    return <ResponsiveMenuButton id="sample-reports-menu" items={items} text="Reports" asSubMenu={asSubMenu} />;
});
