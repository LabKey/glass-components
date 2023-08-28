/*
 * Copyright (c) 2019 LabKey Corporation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { Filter } from '@labkey/api';
import React, { FC, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isLoading, LoadingState } from '../../../public/LoadingState';
import { DataViewInfoTypes, LABKEY_VIS } from '../../constants';

import { DataViewInfo } from '../../DataViewInfo';
import { generateId } from '../../util/utils';
import { LoadingSpinner } from '../base/LoadingSpinner';

import { ChartAPIWrapper, DEFAULT_API_WRAPPER } from './api';
import { ChartConfig, ChartQueryConfig } from './models';

const ChartLoadingMask: FC = memo(() => (
    <div className="chart-loading-mask">
        <div className="chart-loading-mask__background" />
        <LoadingSpinner msg="Loading Chart..." wrapperClassName="loading-spinner" />
    </div>
));

/**
 * Returns a string representation of a given filter array. Needed to properly memoize variables in functional
 * components that rely on a filter array from QueryModel, because QueryModel always returns a new filter array.
 * @param filters
 */
function computeFilterKey(filters: Filter.IFilter[]): string {
    if (!filters) return '';
    return filters
        .map(f => f.getURLParameterName() + '=' + f.getURLParameterValue)
        .sort()
        .join('_');
}

interface Dimensions {
    height: number;
    width: number;
}

function computeDimensions(width: number): Dimensions {
    const dimensions = {
        width,
        height: (width * 9) / 16, // 16:9 aspect ratio
    };
    if (dimensions.height > 300) dimensions.height = 500;

    return dimensions;
}

interface Props {
    api?: ChartAPIWrapper;
    chart: DataViewInfo;
    container?: string;
    filters?: Filter.IFilter[];
}

export const SVGChart: FC<Props> = memo(({ api, chart, filters }) => {
    const { error, reportId } = chart;
    const divId = useMemo(() => generateId('chart-'), []);
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [queryConfig, setQueryConfig] = useState<ChartQueryConfig>(undefined);
    const [chartConfig, setChartConfig] = useState<ChartConfig>(undefined);
    const [loadError, setLoadError] = useState<string>(undefined);
    const filterKey = useMemo(() => computeFilterKey(filters), [filters]);
    const ref = useRef<HTMLDivElement>(undefined);
    const loadChartConfig = useCallback(async () => {
        setLoadingState(LoadingState.LOADING);
        try {
            const visualizationConfig = await api.fetchVisualizationConfig(reportId);
            const chartConfig_ = {
                ...visualizationConfig.chartConfig,
                ...computeDimensions(ref.current.offsetWidth),
            };
            const queryConfig_ = visualizationConfig.queryConfig;
            setChartConfig(chartConfig_);

            if (filters) {
                queryConfig_.filterArray = [...queryConfig_.filterArray, ...filters];
            }

            setQueryConfig(queryConfig_);
        } catch (e) {
            setLoadError(e.exception);
        } finally {
            setLoadingState(LoadingState.LOADED);
        }
        // We purposely don't use filters as a dep, see note in computeFilterKey
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, reportId, filterKey]);

    const updateChartSize = useCallback(() => {
        setChartConfig(currentChartConfig => {
            if (currentChartConfig === undefined || ref.current === undefined) return currentChartConfig;

            const updatedChartConfig = {
                ...currentChartConfig,
                ...computeDimensions(ref.current.offsetWidth),
            };
            setChartConfig(updatedChartConfig);

            return updatedChartConfig;
        });
    }, []);

    useEffect(() => {
        if (!error) {
            loadChartConfig();
        }
    }, [error, loadChartConfig]);

    useEffect(() => {
        window.addEventListener('resize', updateChartSize);
        return () => window.removeEventListener('resize', updateChartSize);
    }, [updateChartSize]);

    useEffect(() => {
        const render = (): void => {
            if (queryConfig !== undefined && chartConfig !== undefined) {
                ref.current.innerHTML = '';
                // Note: our usage of renderChartSVG to render the chart means that every time we call render we make
                // a new API request to the server to fetch the data, even if all we've done is change screen size. This
                // updated in the future to use the underlying VIS library to separate fetching of data from rendering
                // the chart. We should only be fetching data when the reportId or filterArray change.
                LABKEY_VIS.GenericChartHelper.renderChartSVG(divId, queryConfig, chartConfig);
            }
        };
        // Debounce the call to render because we may trigger many resize events back to back, which will produce many
        // new chartConfig objects
        const renderId = window.setTimeout(render, 250);
        return () => window.clearTimeout(renderId);
    }, [divId, chartConfig, queryConfig]);

    return (
        <div className="svg-chart chart-body">
            {error !== undefined && <span className="text-danger">{error}</span>}
            {loadError !== undefined && <span className="text-danger">{loadError}</span>}
            {isLoading(loadingState) && <ChartLoadingMask />}
            <div className="svg-chart__chart" id={divId} ref={ref} />
        </div>
    );
});
SVGChart.displayName = 'SVGChart';

const RReport: FC<Props> = memo(({ api, chart, container, filters }) => {
    const { error, reportId } = chart;
    const [loadingState, setLoadingState] = useState<LoadingState>(LoadingState.INITIALIZED);
    const [reportHtml, setReportHtml] = useState<string>(undefined);
    const [loadError, setLoadError] = useState<string>(undefined);
    const filterKey = useMemo(() => computeFilterKey(filters), [filters]);
    const loadReport = useCallback(async () => {
        setLoadingState(LoadingState.LOADING);
        setLoadError(undefined);

        try {
            const html = await api.fetchRReport(reportId, container, filters);
            setReportHtml(html);
        } catch (e) {
            setLoadError(e.exception);
        } finally {
            setLoadingState(LoadingState.LOADED);
        }
        // We purposely don't use filters as a dep, see note in computeFilterKey
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [api, reportId, filterKey]);
    const imageUrls = useMemo(() => {
        if (reportHtml !== undefined) {
            // The HTML returned by our server includes a bunch of stuff we don't want. So instead of inserting it
            // directly we'll just grab the URLs for all the images named "resultImage", which are the outputs from an
            // R Report.
            const el = document.createElement('div');
            el.innerHTML = reportHtml;
            const resultImages = el.querySelectorAll('img[name="resultImage"]');
            return Array.from(resultImages).map((img: HTMLImageElement) => img.src);
        }

        return undefined;
    }, [reportHtml]);

    useEffect(() => {
        if (error) {
            // We won't bother loading anything if the chart object has an error
            setLoadingState(LoadingState.LOADED);
        } else {
            loadReport();
        }
    }, [error, loadReport]);

    return (
        <div className="r-report chart-body">
            {error !== undefined && <span className="text-danger">{error}</span>}
            {loadError !== undefined && <span className="text-danger">{loadError}</span>}
            {isLoading(loadingState) && <ChartLoadingMask />}
            {imageUrls !== undefined && (
                <div className="r-report__images">
                    {imageUrls?.map(url => (
                        <div key={url} className="r-report__image">
                            <img alt="R Report Image Output" src={url} />
                        </div>
                    ))}
                    {imageUrls?.length === 0 && (
                        <div className="error-msg">
                            No output detected, you may not have enough data, or there may be an issue with your R
                            Report
                        </div>
                    )}
                </div>
            )}
        </div>
    );
});
RReport.displayName = 'RReport';

export const Chart: FC<Props> = memo(({ api = DEFAULT_API_WRAPPER, chart, container, filters }) => {
    if (chart.type === DataViewInfoTypes.RReport) {
        return <RReport api={api} chart={chart} container={container} filters={filters} />;
    }

    return <SVGChart api={api} chart={chart} container={container} filters={filters} />;
});

Chart.displayName = 'Chart';
