import React, { PureComponent } from 'react';
import renderer from 'react-test-renderer';

import { GridPanel, QueryInfo, SchemaQuery } from '..';

import mixturesQueryInfo from '../test/data/mixtures-getQueryDetails.json';

import mixturesQuery from '../test/data/mixtures-getQueryPaging.json';

import { RequiresModelAndActions } from './withQueryModels';
import { LoadingState } from './QueryModel';
import { RowsResponse } from './QueryModelLoader';
import { initUnitTests, makeQueryInfo, makeTestActions, makeTestData, makeTestModel } from './testUtils';

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO: QueryInfo;
let DATA: RowsResponse;

class TestButtons extends PureComponent<RequiresModelAndActions> {
    render() {
        return <div className="test-buttons-component">ButtonComponent for {this.props.model.id}</div>;
    }
}

beforeAll(() => {
    initUnitTests();
    QUERY_INFO = makeQueryInfo(mixturesQueryInfo);

    // Return so tests don't start till after the promise resolves, so we can guarantee DATA is initialized in tests.
    return makeTestData(mixturesQuery).then(data => {
        DATA = data;
    });
});

describe('GridPanel', () => {
    let actions;

    beforeEach(() => {
        actions = makeTestActions();
    });

    test('Render GridPanel', () => {
        const { rows, orderedRows, rowCount } = DATA;

        // Model is loading QueryInfo and Rows, so should render loading, no ViewSelector, and no pagination.
        let model = makeTestModel(SCHEMA_QUERY);
        let tree = renderer.create(<GridPanel actions={actions} model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Model is loading Rows, but not QueryInfo, should not render pagination, should render disabled ViewSelector.
        model = makeTestModel(SCHEMA_QUERY, QUERY_INFO);
        tree = renderer.create(<GridPanel actions={actions} model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Loaded rows and QueryInfo, so should render grid.
        model = makeTestModel(SCHEMA_QUERY, QUERY_INFO, rows, orderedRows.slice(0, 20), rowCount);
        tree = renderer.create(<GridPanel actions={actions} model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Has rows and QueryInfo, but new rows are loading, should render disabled pagination and loading spinner.
        model = model.mutate({ rowsLoadingState: LoadingState.LOADING });
        tree = renderer.create(<GridPanel actions={actions} model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Should render TestButtons component in the left part of the grid bar.
        model = model.mutate({ rowsLoadingState: LoadingState.LOADED });
        tree = renderer.create(<GridPanel actions={actions} model={model} ButtonsComponent={TestButtons} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Panel classes should not be present.
        tree = renderer.create(<GridPanel actions={actions} model={model} asPanel={false} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Pagination should not be present.
        tree = renderer.create(<GridPanel actions={actions} model={model} isPaged={false} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // ViewSelector should not be present.
        tree = renderer.create(<GridPanel actions={actions} model={model} showViewSelector={false} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // pageSizes should be different
        tree = renderer.create(<GridPanel actions={actions} model={model} pageSizes={[5, 10, 15, 20]} />);
        expect(tree.toJSON()).toMatchSnapshot();
    });
});
