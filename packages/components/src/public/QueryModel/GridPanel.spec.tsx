import React, { PureComponent, ReactNode } from 'react';
import { mount, ReactWrapper } from 'enzyme';

import { Filter } from '@labkey/api';

import { GRID_CHECKBOX_OPTIONS, GridPanel, LoadingState, QueryInfo, QueryModel, QuerySort, SchemaQuery } from '../..';

import { initUnitTests, makeQueryInfo, makeTestData } from '../../internal/testHelpers';
import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';
import mixturesQuery from '../../test/data/mixtures-getQueryPaging.json';

import { ActionValue } from './grid/actions/Action';

import { RequiresModelAndActions } from './withQueryModels';
import { RowsResponse } from './QueryModelLoader';
import { makeTestActions, makeTestQueryModel } from './testUtils';

// The wrapper's return type for mount<GridPanel>(<GridPanel ... />)
type GridPanelWrapper = ReactWrapper<Readonly<GridPanel['props']>, Readonly<GridPanel['state']>, GridPanel>;

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO: QueryInfo;
let DATA: RowsResponse;

class TestButtons extends PureComponent<RequiresModelAndActions> {
    render(): ReactNode {
        return <div className="test-buttons-component">ButtonComponent for {this.props.model.id}</div>;
    }
}

beforeAll(() => {
    initUnitTests();
    QUERY_INFO = makeQueryInfo(mixturesQueryInfo);
    DATA = makeTestData(mixturesQuery);
});

const CHART_MENU_SELECTOR = '.chart-menu';
const PAGINATION_SELECTOR = '.pagination-button-group';
const PAGINATION_INFO_SELECTOR = '.pagination-info';
const VIEW_MENU_SELECTOR = '.view-menu';
const GRID_SELECTOR = '.grid-panel__grid .table-responsive';
const GRID_INFO_SELECTOR = '.grid-panel__info';
const EXPORT_MENU_SELECTOR = '.export-menu';
const FILTER_STATUS_SELECTOR = '.grid-panel__filter-status';
const DISABLED_BUTTON_CLASS = 'disabled-button-with-tooltip';
const CLEAR_ALL_SELECTOR = '.selection-status__clear-all';
const ERROR_SELECTOR = '.grid-panel__grid .alert-danger';

describe('GridPanel', () => {
    let actions;

    beforeEach(() => {
        actions = makeTestActions(jest.fn);
    });

    const expectChartMenu = (wrapper: GridPanelWrapper, disabledState: boolean): void => {
        expectChartMenuVisible(wrapper, true);
        expect(wrapper.find(CHART_MENU_SELECTOR).find('.dropdown').at(0).hasClass('disabled')).toEqual(disabledState);
    };

    const expectChartMenuVisible = (wrapper: GridPanelWrapper, visible: boolean): void => {
        expect(wrapper.find(CHART_MENU_SELECTOR).exists()).toEqual(visible);
    };

    const expectPanelClasses = (wrapper: GridPanelWrapper, classesExist): void => {
        expect(wrapper.find('.grid-panel').hasClass('panel')).toEqual(classesExist);
        expect(wrapper.find('.grid-panel').hasClass('panel-default')).toEqual(classesExist);
    };

    const expectPaginationVisible = (wrapper: GridPanelWrapper, visible: boolean): void => {
        expect(wrapper.find(PAGINATION_INFO_SELECTOR).exists()).toEqual(visible);
        expect(wrapper.find(PAGINATION_SELECTOR).exists()).toEqual(visible);
    };

    const expectNoQueryInfo = (wrapper: GridPanelWrapper): void => {
        expectPaginationVisible(wrapper, false);
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(FILTER_STATUS_SELECTOR).exists()).toEqual(true);
    };

    const expectNoRows = (wrapper: GridPanelWrapper): void => {
        const expectedButtons = wrapper.props().ButtonsComponent !== undefined;
        expectPaginationVisible(wrapper, false);
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(false);
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(FILTER_STATUS_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(TestButtons).exists()).toEqual(expectedButtons);
    };

    const expectGrid = (wrapper: GridPanelWrapper): void => {
        const { orderedRows } = wrapper.props().model;
        expect(wrapper.find(GRID_SELECTOR).exists());
        // +1 because of header row
        expect(wrapper.find(GRID_SELECTOR).find('tr').length).toEqual(orderedRows.length + 1);
    };

    const expectError = (wrapper: GridPanelWrapper, error: string): void => {
        expect(wrapper.find(ERROR_SELECTOR).text()).toEqual(error);
    };

    test('Render GridPanel', () => {
        const { rows, orderedRows, rowCount } = DATA;

        // Model is loading QueryInfo and Rows, should render loading, no ChartMenu/Pagination/ViewMenu.
        let model = makeTestQueryModel(SCHEMA_QUERY);
        const wrapper = mount<GridPanel>(<GridPanel actions={actions} model={model} />);
        expectNoQueryInfo(wrapper);

        // Model is loading Rows, but not QueryInfo, should not render pagination, should render disabled ViewMenu.
        model = model.mutate({ queryInfoLoadingState: LoadingState.LOADED, queryInfo: QUERY_INFO });
        wrapper.setProps({ model });
        expectNoRows(wrapper);
        expectChartMenuVisible(wrapper, false);

        // Loaded rows and QueryInfo. Should render grid, pagination, ViewMenu, ChartMenu
        model = model.mutate({
            rows,
            orderedRows: orderedRows.slice(0, 20),
            rowCount,
            rowsLoadingState: LoadingState.LOADED,
            charts: [],
            chartsLoadingState: LoadingState.LOADED,
        });
        wrapper.setProps({ hideEmptyChartMenu: false, model });

        // Chart menu should be disabled if no charts are present and showSampleComparisonReports is false.
        expectChartMenu(wrapper, true);
        expect(wrapper.find(PAGINATION_INFO_SELECTOR).text()).toEqual('1 - 20 of 661');
        expect(wrapper.find(PAGINATION_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(FILTER_STATUS_SELECTOR).exists()).toEqual(true);

        wrapper.setProps({ showSampleComparisonReports: true });
        expectChartMenu(wrapper, false);

        // Previous, Page Menu, Next buttons should be present.
        let paginationButtons = wrapper.find(PAGINATION_SELECTOR).find('button');
        expect(paginationButtons.length).toEqual(3);

        // Previous button should be disabled.
        expect(paginationButtons.first().hasClass(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(paginationButtons.last().hasClass(DISABLED_BUTTON_CLASS)).toEqual(false);
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(GRID_SELECTOR).exists()).toEqual(true);

        // Header row + data rows.
        expect(wrapper.find(GRID_SELECTOR).find('tr').length).toEqual(21);

        // Has rows and QueryInfo, but new rows are loading, should render disabled pagination and loading spinner.
        model = model.mutate({ rowsLoadingState: LoadingState.LOADING });
        wrapper.setProps({ model });
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(true);
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(true);
        expectPaginationVisible(wrapper, true);
        paginationButtons = wrapper.find(PAGINATION_SELECTOR).find('button');
        expect(paginationButtons.first().hasClass(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(paginationButtons.last().hasClass(DISABLED_BUTTON_CLASS)).toEqual(true);
        expect(wrapper.find(GRID_INFO_SELECTOR).text()).toContain('Loading data...');

        // Should render TestButtons component in the left part of the grid bar.
        wrapper.setProps({ ButtonsComponent: TestButtons });
        expect(wrapper.find(TestButtons).exists()).toEqual(true);

        // Panel classes should only be present when asPanel is true.
        expectPanelClasses(wrapper, true);
        wrapper.setProps({ asPanel: false });
        expectPanelClasses(wrapper, false);

        // pageSizes should be different
        expect(wrapper.find(PAGINATION_SELECTOR).find('ul').text()).toEqual('Jump ToFirst PageLast Page...Page Size2040100250400');
        wrapper.setProps({ pageSizes: [5, 10, 15, 20] });
        expect(wrapper.find(PAGINATION_SELECTOR).find('ul').text()).toEqual('Jump ToFirst PageLast Page...Page Size5101520');

        // Pagination should not be present.
        wrapper.setProps({ showPagination: false });
        expectPaginationVisible(wrapper, false);

        // ViewMenu should not be present.
        wrapper.setProps({ showViewMenu: false });
        expect(wrapper.find(VIEW_MENU_SELECTOR).exists()).toEqual(false);

        // export menu should not be rendered.
        wrapper.setProps({ showExport: false });
        expect(wrapper.find(EXPORT_MENU_SELECTOR).exists()).toEqual(false);

        // chart menu should not be rendered.
        wrapper.setProps({ showChartMenu: false });
        expectChartMenuVisible(wrapper, false);

        // We should render nothing but an error if we had issues loading the QueryInfo.
        const queryInfoError = 'Error loading query info';
        model = makeTestQueryModel(SCHEMA_QUERY).mutate({ queryInfoError });
        wrapper.setProps({
            model,
            asPanel: true,
            showPagination: true,
            showViewMenu: true,
            showExport: true,
            showChartMenu: true,
        });
        expectNoQueryInfo(wrapper);
        expectChartMenu(wrapper, true);
        expectError(wrapper, queryInfoError);

        // We still render ChartMenu, ViewMenu, and any custom buttons
        const rowsError = 'Error loading rows';
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO).mutate({ rowsError });
        wrapper.setProps({ model });
        expectNoRows(wrapper);
        expectChartMenu(wrapper, true);
        expectError(wrapper, rowsError);

        // If an error happens when loading selections we render a grid and an error.
        const selectionsError = 'Error loading selections';
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows, rowCount).mutate({ selectionsError });
        wrapper.setProps({ model });
        expectGrid(wrapper);
        expectError(wrapper, selectionsError);
    });

    const expectBoundState = (
        wrapper: GridPanelWrapper,
        attrs: Partial<QueryModel>,
        expectedLen: number,
        expectedValues: any[]
    ): void => {
        const model = wrapper.props().model;
        wrapper.setProps({ model: model.mutate(attrs) });
        expect(wrapper.state().actionValues.length).toEqual(expectedLen);

        expectedValues.forEach((value): void => {
            const findByValue = (av: ActionValue): boolean => av.valueObject === value || av.value === value;
            expect(wrapper.state().actionValues.find(findByValue)).not.toEqual(undefined);
        });
    };

    test('FilterStatus Model Binding', () => {
        // This test ensures that the filter status updates when there are external changes to the model, typically this
        // happens when bindURL is true and there is a URL change.
        const { rows, orderedRows, rowCount } = DATA;
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows.slice(0, 20), rowCount);
        const wrapper = mount<GridPanel>(<GridPanel actions={actions} model={model} />);
        const nameSort = new QuerySort({ fieldKey: 'Name' });
        const nameFilter = Filter.create('Name', 'DMXP', Filter.Types.EQUAL);
        const expirFilter = Filter.create('expirationTime', '1', Filter.Types.EQUAL);
        const viewName = 'noMixtures';
        const viewLabel = 'No Mixtures or Extra';
        const noMixtursSQ = SchemaQuery.create(SCHEMA_QUERY.schemaName, SCHEMA_QUERY.queryName, viewName);
        const search = Filter.create('*', 'foobar', Filter.Types.Q);

        expectBoundState(wrapper, {}, 0, []);
        expectBoundState(wrapper, { sorts: [nameSort] }, 1, [nameSort]);
        expectBoundState(wrapper, { filterArray: [nameFilter] }, 2, [nameSort, nameFilter]);
        expectBoundState(wrapper, { filterArray: [expirFilter] }, 2, [nameSort, expirFilter]);
        expectBoundState(wrapper, { schemaQuery: noMixtursSQ }, 3, [nameSort, expirFilter, viewLabel]);
        expectBoundState(wrapper, { filterArray: [expirFilter, search] }, 4, [
            nameSort,
            expirFilter,
            viewLabel,
            search,
        ]);
        expectBoundState(wrapper, { sorts: [], filterArray: [], schemaQuery: SCHEMA_QUERY }, 0, []);
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const getCheckbox = (wrapper: GridPanelWrapper, index: number): ReactWrapper<any> => {
        return wrapper.find(GRID_SELECTOR).find('tr').at(index).find('input[type="checkbox"]');
    };

    const testSelectRow = (wrapper: GridPanelWrapper, index: number, expectedState: boolean): void => {
        const grid = wrapper.instance();
        const { model } = grid.props;
        const row = model.gridData[index];
        const rowId = model.orderedRows[index];

        // The first tr is the header, so we increment the index by 1
        let checkbox = getCheckbox(wrapper, index + 1);
        const event = { target: { checked: expectedState } };
        checkbox.simulate('change', event);
        expect(actions.selectRow).toHaveBeenCalledWith(model.id, expectedState, row);
        const newSelections = new Set(model.selections);

        if (expectedState) {
            newSelections.add(rowId);
        } else {
            newSelections.delete(rowId);
        }

        // Set the selections so we can also test UI rendering.
        wrapper.setProps({ model: model.mutate({ selections: newSelections }) });
        checkbox = getCheckbox(wrapper, index + 1);
        expect(checkbox.props().checked).toEqual(expectedState);
    };

    /**
     * @param wrapper enzyme wrapped GridPanel.
     * @param checkedState the value you want the checkbox to emit (true/false)
     * @param expectedState the value you expect to be passed to selectPage, due to how indeterminate state works true
     * checkedState may still result in false expectedState (see GridPanel.selectPage for details)
     */
    const testSelectPage = (wrapper: GridPanelWrapper, checkedState: boolean, expectedState: boolean): void => {
        const grid = wrapper.instance();
        const { model } = grid.props;
        let checkbox = getCheckbox(wrapper, 0);
        checkbox.simulate('change', { target: { checked: checkedState } });
        expect(actions.selectPage).toHaveBeenCalledWith(model.id, expectedState);
        const newSelections = expectedState ? new Set<string>(model.orderedRows) : new Set<string>();
        // Set the selections so we can also test UI rendering.
        wrapper.setProps({ model: model.mutate({ selections: newSelections }) });
        checkbox = getCheckbox(wrapper, 0);
        expect(checkbox.props().checked).toEqual(expectedState);
        const expectedSelectedState = expectedState ? GRID_CHECKBOX_OPTIONS.ALL : GRID_CHECKBOX_OPTIONS.NONE;
        // Indeterminate status is not supported by React or Enzyme so we have to check the model selectedState
        expect(grid.props.model.selectedState).toEqual(expectedSelectedState);
    };

    const expectHeaderSelectionStatus = (wrapper: GridPanelWrapper, expectedState: boolean): void => {
        const checkbox = getCheckbox(wrapper, 0);
        expect(checkbox.props().checked).toEqual(expectedState);
    };

    const expectSelectionStatusCount = (wrapper: GridPanelWrapper, count: number): void => {
        const selectionStatus = wrapper.find('.selection-status__count');
        if (count === 0) {
            expect(selectionStatus.exists()).toEqual(false);
        } else {
            const grid = wrapper.instance();
            const total = grid.props.model.rowCount;
            expect(selectionStatus.text()).toEqual(`${count} of ${total} selected`);
        }
    };

    const expectClearButtonState = (wrapper: GridPanelWrapper, text?: string): void => {
        const clearButton = wrapper.find(CLEAR_ALL_SELECTOR);

        if (text === undefined) {
            expect(clearButton.exists()).toEqual(false);
        } else {
            expect(clearButton.text()).toEqual(text);
        }
    };

    const testSelectAll = (wrapper: GridPanelWrapper): void => {
        const grid = wrapper.instance();
        const { model } = grid.props;
        wrapper.find('.selection-status__select-all button').simulate('click');
        expect(actions.selectAllRows).toHaveBeenCalledWith(model.id);
        // Set selections to all to simulate actual behavior. This works because our model.rows object actually has
        // all 661 rows in it, which is not normal in production use.
        wrapper.setProps({ model: model.mutate({ selections: new Set(Object.keys(model.rows)) }) });
        expectClearButtonState(wrapper, 'Clear all');
    };

    const testClearAll = (wrapper: GridPanelWrapper): void => {
        const grid = wrapper.instance();
        const { model } = grid.props;
        wrapper.find(CLEAR_ALL_SELECTOR + ' button').simulate('click');
        expect(actions.clearSelections).toHaveBeenCalledWith(model.id);
        wrapper.setProps({ model: model.mutate({ selections: new Set() }) });
        expectClearButtonState(wrapper);
    };

    test('Selections', () => {
        const { rows, orderedRows, rowCount } = DATA;
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows.slice(0, 20), rowCount).mutate({
            selections: new Set(),
            selectionsLoadingState: LoadingState.LOADED,
        });
        const wrapper = mount<GridPanel>(<GridPanel actions={actions} model={model} />);

        // Check that with no selections the header checkbox is not selected.
        expectHeaderSelectionStatus(wrapper, false);
        // Check that the clear button is not present
        expectClearButtonState(wrapper);
        expectSelectionStatusCount(wrapper, 0);

        // Select first row.
        testSelectRow(wrapper, 0, true);
        expectSelectionStatusCount(wrapper, 1);
        expectClearButtonState(wrapper, 'Clear');
        testSelectRow(wrapper, 1, true);
        expectSelectionStatusCount(wrapper, 2);
        expectClearButtonState(wrapper, 'Clear both');
        // Enzyme doesn't support refs, and React doesn't natively support indeterminate status on checkboxes, so we
        // should expect the checkbox to not be checked, and we check the model for selectedState.
        expectHeaderSelectionStatus(wrapper, false);
        expect(wrapper.props().model.selectedState).toEqual(GRID_CHECKBOX_OPTIONS.SOME);

        // Since some rows are checked, checking the header checkbox again should result in de-selecting the rows.
        testSelectPage(wrapper, true, false);
        expectSelectionStatusCount(wrapper, 0);
        expectClearButtonState(wrapper);

        // Since no rows are checked, checking the header should select all rows on the page.
        testSelectPage(wrapper, true, true);
        expectSelectionStatusCount(wrapper, 20);
        expectClearButtonState(wrapper, 'Clear all');

        // Select all rows
        testSelectAll(wrapper);
        testClearAll(wrapper);
    });
});
