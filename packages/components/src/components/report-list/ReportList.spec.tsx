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
import React from 'react';
import renderer from 'react-test-renderer';
import { createMemoryHistory, Route, Router } from 'react-router';
import { mount } from 'enzyme';
import { ReportItemModal, ReportList, ReportListItem } from './ReportList';
import { flattenBrowseDataTreeResponse } from './model';
import exampleData from '../../test/data/example_browse_data_tree_api.json';
import { LoadingSpinner } from '../base/LoadingSpinner';
import { AppURL } from '../../url/AppURL';

const history = createMemoryHistory();

const noop = () => {};
const messageSelector = '.report-list__message';
const createdBySelector = '.report-list-item__person';
const urlMapper = (report) => {
    const { schemaName, queryName, viewName } = report;

    if (!queryName) {
        return null;
    }

    const parts = ['q', schemaName, queryName];

    if (viewName) {
        parts.push(viewName);
    }

    return AppURL.create(...parts);
};

describe('<ReportList />', () => {
    test('flattenBrowseDataTreeResponse works with valid data', () => {
        flattenBrowseDataTreeResponse(exampleData, urlMapper);
    });

    test('Render with no data', () => {
        const component = <ReportList loading={false} reports={[]} onReportClicked={noop}/>;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
        const wrapper = mount(component);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find(messageSelector).text()).toContain('No reports');
    });

    test('Render loading', () => {
        const component = <ReportList loading={true} reports={[]} onReportClicked={noop}/>;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
        const wrapper = mount(component);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(1);
    });

    test('Render with data', () => {
        const reports = flattenBrowseDataTreeResponse(exampleData, urlMapper);
        const component = <ReportList loading={false} reports={reports} onReportClicked={noop}/>;
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
        const wrapper = mount(component);
        expect(wrapper.find(LoadingSpinner)).toHaveLength(0);
        expect(wrapper.find(ReportListItem)).toHaveLength(reports.length);
    });

    test('onReportClicked should execute on click', () => {
        const reports = flattenBrowseDataTreeResponse(exampleData, urlMapper).slice(0, 1);
        const onReportClicked = jest.fn();
        const component = <ReportList loading={false} reports={reports} onReportClicked={onReportClicked}/>;
        const wrapper = mount(component);
        wrapper.find(ReportListItem).simulate('click');
        expect(onReportClicked).toHaveBeenCalledTimes(1);
    });
});

describe('<ReportListItem />', () => {
    test('ReportListItem renders', () => {
        const report = flattenBrowseDataTreeResponse(exampleData, urlMapper)[0];
        const onClick = jest.fn();
        const component = (
            <Router history={history}>
                <Route path="/"  component={() => (<ReportListItem report={report} onClick={onClick}/>)}/>
            </Router>
        );
        const tree = renderer.create(component);
        expect(tree).toMatchSnapshot();
        const wrapper = mount(component);
        expect(wrapper.find(createdBySelector)).toHaveLength(1);
        expect(wrapper.text()).toContain(report.createdBy);
        expect(wrapper.text()).toContain(report.name);
        // Enzyme prefixes relative URLs with http://localhost
        const expectedHref = `http://localhost${report.appUrl.toString()}`;
        expect(wrapper.find('a').getDOMNode()).toHaveProperty('href', expectedHref);
    });

    test('ReportListItem does not render non-existent createdBy', () => {
        const reports = flattenBrowseDataTreeResponse(exampleData, urlMapper);
        const report = reports.filter(r => !r.hasOwnProperty('createdBy'))[0];
        const component = <ReportListItem report={report} onClick={noop}/>;
        const wrapper = mount(component);
        expect(wrapper.find(createdBySelector)).toHaveLength(0);
    });

    test('ReportListItem calls onClick when clicked', () => {
        const report = flattenBrowseDataTreeResponse(exampleData, urlMapper)[0];
        const onClick = jest.fn();
        const component = <ReportListItem report={report} onClick={onClick}/>;
        const wrapper = mount(component);
        wrapper.simulate('click');
        expect(onClick).toHaveBeenCalledTimes(1);
        // Test that we pass the report to onClick. If this test fails that means we'll need to fix any callbacks that
        // expect a report to be passed to the callback.
        expect(onClick.mock.calls[0][0]).toBe(report);
    });
});

describe('<ReportItemModal />', () => {
    test('ReportItemModal renders', () => {
        const report = flattenBrowseDataTreeResponse(exampleData, urlMapper)[0];
        const component = <ReportItemModal report={report} onClose={noop} />;
        const wrapper = mount(component);
        // Have to use mount + wrapper.debug for snapshot here because react-test-renderer does not work with
        // React portals, which react-bootstrap uses for their modal component.
        expect(wrapper.debug()).toMatchSnapshot();
    });
});
