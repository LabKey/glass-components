import React from 'react';
import renderer from 'react-test-renderer';
import { mount } from 'enzyme';

import { makeQueryInfo } from '../../internal/test/testHelpers';

import mixturesQueryInfo from '../../test/data/mixtures-getQueryDetails.json';

import { SchemaQuery } from '../SchemaQuery';

import { QueryInfo } from '../QueryInfo';

import { ViewMenu } from './ViewMenu';
import { makeTestQueryModel } from './testUtils';

const SCHEMA_QUERY = new SchemaQuery('exp.data', 'mixtures');
let QUERY_INFO_NO_VIEWS: QueryInfo;
let QUERY_INFO_PUBLIC_VIEWS: QueryInfo;
let QUERY_INFO_PRIVATE_VIEWS: QueryInfo;
let QUERY_INFO_HIDDEN_VIEWS: QueryInfo;

beforeAll(() => {
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

const DEFAULT_PROPS = {
    allowViewCustomization: false,
    onViewSelect: jest.fn(),
    onSaveView: jest.fn(),
    onManageViews: jest.fn(),
    onCustomizeView: jest.fn(),
};

describe('ViewMenu', () => {
    test('Render', () => {
        // Renders nothing
        let model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_NO_VIEWS, {}, []);
        let tree = renderer.create(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={true} model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Renders empty view selector with disabled dropdown.
        tree = renderer.create(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={false} model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // "No Extra Column"  view shows up under "Shared Saved Views"
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PUBLIC_VIEWS, {}, []);
        tree = renderer.create(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={true} model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // "No Extra Column" view shows up under "My Saved Views"
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PRIVATE_VIEWS, {}, []);
        tree = renderer.create(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={true} model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // Same as previous, but the No Extra Column view is set to active.
        model = model.mutate({
            schemaQuery: new SchemaQuery(SCHEMA_QUERY.schemaName, SCHEMA_QUERY.queryName, 'noExtraColumn'),
        });
        tree = renderer.create(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={true} model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();

        // "No Extra Column" view is hidden so does not show up
        model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_HIDDEN_VIEWS, {}, []);
        tree = renderer.create(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={false} model={model} />);
        expect(tree.toJSON()).toMatchSnapshot();
    });

    test('Customized view menus', () => {
        LABKEY.user = {
            isGuest: false,
        };
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_HIDDEN_VIEWS, {}, []);
        const wrapper = mount(
            <ViewMenu {...DEFAULT_PROPS} allowViewCustomization={true} hideEmptyViewMenu={false} model={model} />
        );
        const items = wrapper.find('MenuItem');
        expect(items).toHaveLength(5);
        expect(items.at(2).text()).toBe('Customize Grid View');
        expect(items.at(3).text()).toBe('Manage Saved Views');
        expect(items.at(4).text()).toBe('Save Grid View');

        wrapper.unmount();
    });

    test('Customized view menus, guest user', () => {
        LABKEY.user = {
            isGuest: true,
        };
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_HIDDEN_VIEWS, {}, []);
        const wrapper = mount(<ViewMenu {...DEFAULT_PROPS} hideEmptyViewMenu={false} model={model} />);
        const items = wrapper.find('MenuItem');
        expect(items).toHaveLength(1);

        wrapper.unmount();
    });

    test('No views but customize enabled', () => {
        LABKEY.user = {
            isGuest: false,
        };

        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_NO_VIEWS, {}, []);
        const wrapper = mount(
            <ViewMenu {...DEFAULT_PROPS} allowViewCustomization={true} hideEmptyViewMenu={false} model={model} />
        );
        const items = wrapper.find('MenuItem');
        expect(items).toHaveLength(4); // one separator and three options
        expect(items.at(1).text()).toBe('Customize Grid View');
        expect(items.at(2).text()).toBe('Manage Saved Views');
        expect(items.at(3).text()).toBe('Save Grid View');
        wrapper.unmount();
    });

    test('Interactivity', () => {
        const onViewSelect = jest.fn();
        const model = makeTestQueryModel(SCHEMA_QUERY, QUERY_INFO_PUBLIC_VIEWS, {}, []);
        const wrapper = mount(
            <ViewMenu
                allowViewCustomization={false}
                hideEmptyViewMenu={true}
                model={model}
                onViewSelect={onViewSelect}
                onSaveView={jest.fn()}
                onManageViews={jest.fn()}
            />
        );
        wrapper.find('MenuItem').last().find('a').simulate('click');
        expect(onViewSelect).toHaveBeenCalledWith('noMixtures');
    });
});
