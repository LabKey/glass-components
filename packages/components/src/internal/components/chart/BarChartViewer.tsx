import React, {FC, PureComponent} from 'react';
import { Button, DropdownButton, MenuItem } from 'react-bootstrap';
import moment from 'moment';
import { Filter, PermissionTypes, Query } from '@labkey/api';

import {
    Alert,
    App,
    AppURL,
    AssayDesignEmptyAlert,
    getActionErrorMessage,
    ISelectRowsResult,
    LoadingSpinner,
    RequiresPermission,
    SampleEmptyAlert,
    SampleTypeEmptyAlert,
    SchemaQuery,
    Section,
    selectRows,
    Tip,
    User,
} from '../../..';

import { getDateFormat, isSampleFinderEnabled } from '../../app/utils';

import { ASSAYS_KEY, SAMPLES_KEY } from '../../app/constants';

import { processChartData } from './utils';
import { BaseBarChart } from './BaseBarChart';
import { ChartConfig, ChartData, ChartSelector } from './types';

function fetchItemCount(schemaQuery: SchemaQuery, filters?: Filter.IFilter[]): Promise<number> {
    return new Promise(resolve => {
        Query.selectRows({
            filterArray: filters ?? [],
            includeMetadata: false,
            maxRows: 1,
            method: 'POST',
            queryName: schemaQuery.getQuery(),
            requiredVersion: '17.1',
            schemaName: schemaQuery.getSchema(),
            success: response => {
                resolve(response.rowCount);
            },
            failure: error => {
                console.error('Failed to fetch item count for charts', error);
                resolve(0);
            },
        });
    });
}

interface Props {
    chartConfigs: ChartConfig[];
    navigate: (url: string | AppURL) => any;
    user: User;
}

interface State {
    currentChart: number;
    currentGroup: number;
    hasError: boolean;
    itemCounts: Record<number, number>;
    responses: Record<number, ISelectRowsResult>;
}

export class BarChartViewer extends PureComponent<Props, State> {
    constructor(props: Props) {
        super(props);

        this.state = {
            currentChart: 0,
            currentGroup: 0,
            hasError: false,
            itemCounts: {},
            responses: {},
        };
    }

    componentDidMount(): void {
        this.loadChartData();
    }

    loadChartData = async (): Promise<void> => {
        const { chartConfigs } = this.props;
        const { responses, currentGroup } = this.state;

        if (!responses.hasOwnProperty(currentGroup)) {
            try {
                const { itemCountFilters, itemCountSQ } = chartConfigs[currentGroup];
                const itemCount = await fetchItemCount(itemCountSQ, itemCountFilters);

                const { queryName, schemaName, sort } = this.getSelectedChartGroup();
                const response = await selectRows({ schemaName, queryName, sort });

                this.setState(state => ({
                    itemCounts: { ...state.itemCounts, [currentGroup]: itemCount },
                    responses: { ...state.responses, [currentGroup]: response },
                }));
            } catch (reason) {
                console.error(reason);
                this.setState({ hasError: true });
            }
        }
    };

    getSelectedChartGroup = (): ChartConfig => {
        return this.props.chartConfigs[this.state.currentGroup];
    };

    getSelectedChartGroupCharts = (): ChartSelector[] => {
        return this.getSelectedChartGroup().charts;
    };

    onBarClick = (evt: any, row: ChartData): void => {
        const { getAppURL, filterDataRegionName = 'query' } = this.getSelectedChartGroup();

        if (getAppURL) {
            const chart = this.getSelectedChartGroupCharts()[this.state.currentChart];

            // apply the created date filter if the chart definition has one
            let url = getAppURL(row, evt);

            if (chart.filter !== undefined) {
                const dt = moment().add(chart.filter, 'days').format(getDateFormat().toUpperCase());
                url = url.addParam(filterDataRegionName + '.Created~dategte', dt);
            }

            this.props.navigate(url);
        }
    };

    prevChart = (): void => {
        this.selectChart(this.state.currentChart - 1);
    };

    nextChart = (): void => {
        this.selectChart(this.state.currentChart + 1);
    };

    selectChart = (index: number): void => {
        if (index < 0 || index > this.getSelectedChartGroupCharts().length - 1) {
            return;
        }

        this.setState({ currentChart: index });
    };

    selectChartGroup = (index: number): void => {
        this.setState(
            () => ({
                currentGroup: index,
                currentChart: 0,
            }),
            () => {
                this.loadChartData();
            }
        );
    };

    render() {
        const { chartConfigs, user } = this.props;
        const { responses, currentGroup, currentChart, hasError, itemCounts } = this.state;
        const selectedGroup = this.getSelectedChartGroup();
        const selectedCharts = this.getSelectedChartGroupCharts();
        const currentChartOptions = selectedCharts[currentChart];
        const hasSectionItems = itemCounts[currentGroup] > 0;
        const response = responses[currentGroup];
        const isLoading = !response;
        const hasData = response?.totalRows > 0;

        let body;
        if (hasError) {
            body = (
                <Alert>{getActionErrorMessage('There was a problem loading the chart configurations.', 'chart')}</Alert>
            );
        } else if (!response) {
            body = <LoadingSpinner />;
        } else if (!hasSectionItems) {
            if (selectedGroup.key === SAMPLES_KEY) {
                body = <SampleTypeEmptyAlert user={user} />;
            } else if (selectedGroup.key === ASSAYS_KEY) {
                body = <AssayDesignEmptyAlert user={user} />;
            }
        } else if (!hasData) {
            if (selectedGroup.key === SAMPLES_KEY) {
                body = <SampleEmptyAlert user={user} />;
            } else if (selectedGroup.key === ASSAYS_KEY) {
                body = <Alert bsStyle="warning">No assay runs have been imported.</Alert>;
            }
        } else {
            const { barFillColors, data } = processChartData(response, {
                colorPath: selectedGroup.colorPath,
                groupPath: selectedGroup.groupPath,
                countPath: [currentChartOptions.name, 'value'],
            });

            body = (
                <BaseBarChart
                    barFillColors={barFillColors}
                    data={data}
                    defaultBorderColor="#555"
                    grouped={selectedGroup.groupPath !== undefined}
                    onClick={selectedGroup.getAppURL ? this.onBarClick : undefined}
                    title={`${selectedGroup.label} (${currentChartOptions.label})`}
                />
            );
        }

        return (
            <Section
                panelClassName={isLoading || !hasData ? 'bar-chart-viewer-empty' : 'bar-chart-viewer-panel'}
                title="Dashboard Insights"
                titleSize="medium"
            >
                {!hasError && (
                    <div className="btn-group">
                        <DropdownButton id="sample-set-chart-menu" title={selectedGroup.label}>
                            {chartConfigs.map(({ label }, i) => (
                                <MenuItem
                                    active={selectedGroup.label === label}
                                    key={i}
                                    onClick={() => this.selectChartGroup(i)}
                                >
                                    {label}
                                </MenuItem>
                            ))}
                        </DropdownButton>
                        {selectedCharts?.length > 1 && (
                            <DropdownButton id="sample-set-selected-chart-menu" title={currentChartOptions.label}>
                                {selectedCharts.map((chart, i) => (
                                    <MenuItem active={currentChart === i} key={i} onClick={() => this.selectChart(i)}>
                                        {chart.label}
                                    </MenuItem>
                                ))}
                            </DropdownButton>
                        )}
                    </div>
                )}
                {!hasError && selectedCharts?.length > 1 && (
                    <div className="btn-group pull-right">
                        <Tip caption="Previous">
                            <Button disabled={currentChart === 0} onClick={this.prevChart}>
                                <i className="fa fa-chevron-left" />
                            </Button>
                        </Tip>
                        <Tip caption="Next">
                            <Button onClick={this.nextChart} disabled={currentChart === selectedCharts.length - 1}>
                                <i className="fa fa-chevron-right" />
                            </Button>
                        </Tip>
                    </div>
                )}
                {!hasError && hasSectionItems && selectedGroup.showSampleButtons && <SampleButtons />}
                <div className="margin-top">{body}</div>
            </Section>
        );
    }
}

const SampleButtons: FC = () => {
    return (
        <div className="pull-right bar-chart-viewer-sample-buttons">
            {isSampleFinderEnabled() && (
                <Button
                    bsStyle="primary"
                    className="button-right-spacing"
                    href={App.FIND_SAMPLES_BY_FILTER_HREF.toHref()}
                >
                    Go to Sample Finder
                </Button>
            )}
            <RequiresPermission perms={PermissionTypes.Insert}>
                <Button bsStyle="success" className="button-right-spacing" href={App.NEW_SAMPLES_HREF.toHref()}>
                    Create Samples
                </Button>
            </RequiresPermission>
        </div>
    );
};
