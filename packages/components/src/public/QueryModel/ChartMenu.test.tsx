import React, { act } from 'react';
import { render } from '@testing-library/react';

import { DataViewInfo } from '../../internal/DataViewInfo';

import { SchemaQuery } from '../SchemaQuery';
import { QueryInfo } from '../QueryInfo';
import { ViewInfo } from '../../internal/ViewInfo';
import { LoadingState } from '../LoadingState';
import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';
import { TEST_USER_GUEST, TEST_USER_READER } from '../../internal/userFixtures';
import { BIOLOGICS_APP_PROPERTIES, ProductFeature } from '../../internal/app/constants';

import { LABKEY_VIS } from '../../internal/constants';

import { makeTestActions, makeTestQueryModel } from './testUtils';
import { ChartMenu, ChartMenuItem } from './ChartMenu';

LABKEY_VIS = {
    GenericChartHelper: {
        TRENDLINE_OPTIONS: {},
    },
};

describe('ChartMenuItem', () => {
    test('use chart icon', () => {
        const chart = { name: 'TestChart', icon: 'icon.png', iconCls: 'fa-icon' } as DataViewInfo;
        render(<ChartMenuItem chart={chart} showChart={jest.fn()} />);

        expect(document.querySelector('.chart-menu-label').textContent).toBe('TestChart');
        expect(document.querySelectorAll('img')).toHaveLength(0);
        expect(document.querySelectorAll('.chart-menu-icon')).toHaveLength(1);
        expect(document.querySelectorAll('.fa-icon')).toHaveLength(1);
    });

    test('use svg img', () => {
        const chart = { name: 'TestChart', icon: 'icon.svg', iconCls: 'fa-icon' } as DataViewInfo;
        render(<ChartMenuItem chart={chart} showChart={jest.fn()} />);

        expect(document.querySelector('.chart-menu-label').textContent).toBe('TestChart');
        expect(document.querySelectorAll('img')).toHaveLength(1);
        expect(document.querySelectorAll('.chart-menu-icon')).toHaveLength(0);
        expect(document.querySelectorAll('.fa-icon')).toHaveLength(0);
    });
});

describe('ChartMenu', () => {
    const actions = makeTestActions();
    const queryInfo = QueryInfo.fromJsonForTests(
        {
            columns: [],
            name: 'query',
            schemaName: 'schema',
            views: [
                { columns: [], name: ViewInfo.DEFAULT_NAME },
                { columns: [], name: 'view' },
            ],
        },
        true
    );
    const loadedStates = {
        queryInfoLoadingState: LoadingState.LOADED,
        rowsLoadingState: LoadingState.LOADED,
        chartsLoadingState: LoadingState.LOADED,
    };
    const NO_CHART_MODEL = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo, [], 0).mutate({
        ...loadedStates,
        charts: [],
    });

    test('noCharts', () => {
        renderWithAppContext(<ChartMenu actions={actions} model={NO_CHART_MODEL} />, {
            serverContext: {
                user: TEST_USER_READER,
                moduleContext: {
                    core: { productFeatures: [ProductFeature.ChartBuilding] },
                },
            },
        });

        expect(document.querySelectorAll('.chart-menu')).toHaveLength(1); // just the create chart item
        expect(document.querySelectorAll('.chart-menu')[0].textContent).toBe(' ChartsCreate Chart');
    });

    test('noCharts showCreateChart', async () => {
        await act(() => {
            renderWithAppContext(<ChartMenu actions={actions} model={NO_CHART_MODEL} />, {
                serverContext: {
                    user: TEST_USER_READER,
                    moduleContext: {
                        biologics: {
                            productId: BIOLOGICS_APP_PROPERTIES.productId,
                        },
                        samplemanagement: {},
                        core: { productFeatures: [ProductFeature.ChartBuilding] },
                    },
                },
            });
        });

        expect(document.querySelectorAll('.chart-menu')).toHaveLength(1);
        expect(document.querySelector('.chart-menu-button').textContent).toBe(' Charts');
        expect(document.querySelectorAll('.lk-menu-item')).toHaveLength(1);
        expect(document.querySelector('.chart-menu-label').textContent).toBe('Create Chart');
        expect(document.querySelectorAll('.divider')).toHaveLength(0);
    });

    test('guest user cannot create chart', async () => {
        await act(() => {
            renderWithAppContext(<ChartMenu actions={actions} model={NO_CHART_MODEL} />, {
                serverContext: {
                    user: TEST_USER_GUEST,
                    moduleContext: {
                        biologics: {
                            productId: BIOLOGICS_APP_PROPERTIES.productId,
                        },
                        samplemanagement: {},
                        core: { productFeatures: [ProductFeature.ChartBuilding] },
                    },
                },
            });
        });

        expect(document.querySelectorAll('.chart-menu')).toHaveLength(0);
    });

    test('filter charts by default view', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query'), queryInfo, [], 0).mutate({
            ...loadedStates,
            charts: [
                { reportId: '1', name: 'DefaultPrivateChart1', viewName: undefined, shared: false } as DataViewInfo,
                { reportId: '2', name: 'DefaultPrivateChart2', viewName: undefined, shared: false } as DataViewInfo,
                { reportId: '3', name: 'DefaultPublicChart1', viewName: undefined, shared: true } as DataViewInfo,
                { reportId: '4', name: 'DefaultPublicChart2', viewName: undefined, shared: true } as DataViewInfo,
                { reportId: '5', name: 'ViewPrivateChart', viewName: 'view', shared: false } as DataViewInfo,
                { reportId: '6', name: 'ViewPublicChart', viewName: 'view', shared: true } as DataViewInfo,
            ],
        });

        renderWithAppContext(<ChartMenu actions={actions} model={model} />, {
            serverContext: {
                user: TEST_USER_READER,
            },
        });

        expect(document.querySelectorAll('.chart-menu')).toHaveLength(1);
        expect(document.querySelector('.chart-menu-button').textContent).toBe(' Charts');
        const menuItems = document.querySelectorAll('.lk-menu-item');
        expect(menuItems).toHaveLength(4);
        expect(menuItems[0].textContent).toBe('DefaultPrivateChart1');
        expect(menuItems[1].textContent).toBe('DefaultPrivateChart2');
        expect(menuItems[2].textContent).toBe('DefaultPublicChart1');
        expect(menuItems[3].textContent).toBe('DefaultPublicChart2');
        const headerItems = document.querySelectorAll('.lk-dropdown-header');
        expect(headerItems).toHaveLength(2);
        expect(headerItems[0].textContent).toBe('Your Charts');
        expect(headerItems[1].textContent).toBe('Shared Charts');
        expect(document.querySelectorAll('.divider')).toHaveLength(1);
    });

    test('filter charts by custom view', () => {
        const model = makeTestQueryModel(new SchemaQuery('schema', 'query', 'view'), queryInfo, [], 0).mutate({
            ...loadedStates,
            charts: [
                { reportId: '1', name: 'DefaultPrivateChart1', viewName: undefined, shared: false } as DataViewInfo,
                { reportId: '2', name: 'DefaultPrivateChart2', viewName: undefined, shared: false } as DataViewInfo,
                { reportId: '3', name: 'DefaultPublicChart1', viewName: undefined, shared: true } as DataViewInfo,
                { reportId: '4', name: 'DefaultPublicChart2', viewName: undefined, shared: true } as DataViewInfo,
                { reportId: '5', name: 'ViewPrivateChart', viewName: 'view', shared: false } as DataViewInfo,
                { reportId: '6', name: 'ViewPublicChart', viewName: 'view', shared: true } as DataViewInfo,
            ],
        });

        renderWithAppContext(<ChartMenu actions={actions} model={model} />, {
            serverContext: {
                user: TEST_USER_READER,
            },
        });

        expect(document.querySelectorAll('.chart-menu')).toHaveLength(1);
        expect(document.querySelector('.chart-menu-button').textContent).toBe(' Charts');
        const menuItems = document.querySelectorAll('.lk-menu-item');
        expect(menuItems).toHaveLength(2);
        expect(menuItems[0].textContent).toBe('ViewPrivateChart');
        expect(menuItems[1].textContent).toBe('ViewPublicChart');
        const headerItems = document.querySelectorAll('.lk-dropdown-header');
        expect(headerItems).toHaveLength(2);
        expect(headerItems[0].textContent).toBe('Your Charts');
        expect(headerItems[1].textContent).toBe('Shared Charts');
        expect(document.querySelectorAll('.divider')).toHaveLength(1);
    });
});
