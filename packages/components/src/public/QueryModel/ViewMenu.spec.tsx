import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { QueryInfo, SchemaQuery } from '../..';

import { initUnitTests, makeQueryInfo } from '../../internal/testHelpers';

import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';

import { ViewMenu } from './ViewMenu';
import { makeTestQueryModel } from './testUtils';

import { MenuItem } from ' react-bootstrap ';

const SCHEMA_QUERY = SchemaQuery.create('exp.data', 'mixtures');
let QUERY_INFO_NO_VIEWS: QueryInfo;
let QUERY_INFO_PUBLIC_VIEWS: QueryInfo;
let QUERY_INFO_PRIVATE_VIEWS: QueryInfo;
let QUERY_INFO_HIDDEN_VIEWS: QueryInfo;

beforeAll(() => {
    initUnitTests();
    // Have to instantiate QueryInfos here because applyQueryMetadata relies on initQueryGridState being called first.
    QUERY_INFO_NO_VIEWS = makeQueryInfo({
        ...mixturesQueryInfo,
        views: [],
    });
    QUERY_INFO_PUBLIC_VIEWS = makeQueryInfo(mixturesQueryInfo);
    QUERY_INFO_PRIVATE_VIEWS = makeQueryInfo({
        ...mixturesQueryInfo,
        views: [
            mixturesQueryInfo.views[0],
            {
                ...mixturesQueryInfo.views[1],
                shared: false,
            },
        ],
    });
    QUERY_INFO_HIDDEN_VIEWS = makeQueryInfo({
        ...mixturesQueryInfo,
        views: [
            mixturesQueryInfo.views[0],
            {
                ...mixturesQueryInfo.views[1],
                hidden: true,
            },
        ],
    });
});

describe('ViewMenu', () => {
    test('Render', () => {
        LABKEY.moduleContext = {
            query: {
                canCustomizeViewsFromApp: false,
            },
        };

        // Renders nothing
        let model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_NO_VIEWS, {}, []);
        let tree = renderer.create(<ViewMenu hideEmptyViewMenu model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Renders empty view selector with disabled dropdown.
        tree = renderer.create(<ViewMenu hideEmptyViewMenu={false} model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // "No Extra Column"  view shows up under "All Saved Views"
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PUBLIC_VIEWS, {}, []);
        tree = renderer.create(<ViewMenu hideEmptyViewMenu={true} model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // "No Extra Column" view shows up under "My Saved Views"
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PRIVATE_VIEWS, {}, []);
        tree = renderer.create(<ViewMenu hideEmptyViewMenu={true} model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Same as previous, but the No Extra Column view is set to active.
        model = model.mutate({
            schemaQuery: SchemaQuery.create(SCHEMA_QUERY.schemaName, SCHEMA_QUERY.queryName, 'noExtraColumn'),
        });
        tree = renderer.create(<ViewMenu hideEmptyViewMenu={true} model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // "No Extra Column" view is hidden so does not show up
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_HIDDEN_VIEWS, {}, []);
        tree = renderer.create(<ViewMenu hideEmptyViewMenu={false} model={model} onViewSelect={jest.fn()} />);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('Customized view menus', () => {
        LABKEY.moduleContext = {
            query: {
                canCustomizeViewsFromApp: true,
            },
        };
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_HIDDEN_VIEWS, {}, []);
        const wrapper = mount(<ViewMenu hideEmptyViewMenu={false} model={model} onViewSelect={jest.fn()} />);
        const items = wrapper.find(MenuItem);
        expect(items).toHaveLength(3);
        expect(items.at(2).text()).toBe('Save as custom view');

        wrapper.unmount();
    });

    test('Interactivity', () => {
        LABKEY.moduleContext = {
            query: {
                canCustomizeViewsFromApp: false,
            },
        };
        const onViewSelect = jest.fn();
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PUBLIC_VIEWS, {}, []);
        const wrapper = mount(<ViewMenu hideEmptyViewMenu={true} model={model} onViewSelect={onViewSelect} />);
        wrapper.find('MenuItem').last().find('a').simulate('click');
        expect(onViewSelect).toHaveBeenCalledWith('noMixtures');
    });
});
