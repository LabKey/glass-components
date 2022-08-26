import React, { FC, memo, useMemo } from 'react';

import { Filter, Query } from '@labkey/api';

import {Cards, ICardProps} from '../base/Cards';

import {caseInsensitive} from "../../util/utils";
import {naturalSort} from "../../../public/sort";
import {SampleTypeEmptyAlert} from "./SampleEmptyAlert";
import {LoadingSpinner} from "../base/LoadingSpinner";
import {SCHEMAS} from "../../schemas";

import { InjectedQueryModels, QueryConfigMap, withQueryModels } from '../../../public/QueryModel/withQueryModels';

const getSampleSetCount = (row: Record<string, any>): number => {
    return caseInsensitive(row, 'SampleCount').value;
};

const getSampleSetDescription = (row: Record<string, any>): string => {
    return caseInsensitive(row, 'Description').value;
};

const getSampleSetName = (row: Record<string, any>): string => {
    return caseInsensitive(row, 'Name').value;
};

const rowSort = (row1: Record<string, any>, row2: Record<string, any>): number => {
    return naturalSort(getSampleSetName(row1), getSampleSetName(row2));
};

const getSampleSetCard = (row: Record<string, any>): ICardProps => {
    const sampleCount = getSampleSetCount(row);
    const noSamples = sampleCount === 0;

    return {
        caption: noSamples ? getSampleSetDescription(row) : 'Sample count: ' + sampleCount,
        disabled: noSamples,
        href: caseInsensitive(row, 'Name').url,
        iconSrc: noSamples ? 'sample_set_gray' : 'sample_set',
        title: getSampleSetName(row),
    };
};

const getNonEmptySampleSetCards = (data: Array<{ [key: string]: any }>): ICardProps[] => {
    return data
        .filter(row => getSampleSetCount(row) > 0)
        .sort(rowSort)
        .map(getSampleSetCard);
};

const getEmptySampleSetCards = (data: Array<{ [key: string]: any }>): ICardProps[] => {
    return data
        .filter(row => getSampleSetCount(row) === 0)
        .sort(rowSort)
        .map(getSampleSetCard);
};

interface Props {
    modelId: string;
}

const SampleSetCardsImpl: FC<Props & InjectedQueryModels> = memo(({ modelId, queryModels }) => {
    const model = queryModels[modelId];

    const { emptyCards, nonEmptyCards } = useMemo(
        () => ({
            emptyCards: model.isLoading ? undefined : getEmptySampleSetCards(model.gridData),
            nonEmptyCards: model.isLoading ? undefined : getNonEmptySampleSetCards(model.gridData),
        }),
        [model.isLoading]
    );

    return (
        <>
            {model.isLoading && <LoadingSpinner />}
            {nonEmptyCards && emptyCards && nonEmptyCards.length + emptyCards.length === 0 && <SampleTypeEmptyAlert />}
            {nonEmptyCards && nonEmptyCards.length > 0 && (
                <div style={{ paddingTop: '6px' }}>
                    <h4>Sample types with samples</h4>
                    <Cards cards={nonEmptyCards} />
                </div>
            )}
            {emptyCards && emptyCards.length > 0 && (
                <div style={{ paddingTop: '10px' }}>
                    <h4>Sample types without any samples</h4>
                    <Cards cards={emptyCards} />
                </div>
            )}
        </>
    );
});

const SampleSetCardsWithQueryModels = withQueryModels<Props>(SampleSetCardsImpl);

interface SampleSetCardsProps {
    excludedSampleSets?: string[];
}

export const SampleSetCards: FC<SampleSetCardsProps> = memo(({ excludedSampleSets }) => {
    const modelId = 'samplesets-cards';
    const queryConfigs = useMemo<QueryConfigMap>(
        () => ({
            [modelId]: {
                schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
                baseFilters: excludedSampleSets
                    ? [Filter.create('Name', excludedSampleSets, Filter.Types.NOT_IN)]
                    : undefined,
                containerFilter: Query.containerFilter.currentPlusProjectAndShared,
            },
        }),
        [excludedSampleSets, modelId]
    );

    return <SampleSetCardsWithQueryModels autoLoad modelId={modelId} queryConfigs={queryConfigs} />;
});
