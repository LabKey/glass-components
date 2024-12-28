import React from 'react';
import { render } from '@testing-library/react';
import { fromJS } from 'immutable';

import { GridColumn } from '../base/models/GridColumn';

import { FilePreviewGrid } from './FilePreviewGrid';

const DATA = fromJS([
    {
        col1: 'abc',
        col2: '123',
        col3: '2019-01-01',
    },
    {
        col1: 'def',
        col2: '456',
        col3: '2019-01-02',
    },
    {
        col1: 'ghi',
        col2: '789',
        col3: '2019-01-03',
    },
]);

const COLUMNS = [
    new GridColumn({ index: 'col1', title: 'First Column' }),
    new GridColumn({ index: 'col2', title: 'Second Column' }),
    new GridColumn({ index: 'col3', title: 'Third Column' }),
];

// NOTE that the previewCount prop here is not used by FilePreviewGrid but by FileAttachmentForm

describe('FilePreviewGrid', () => {
    test('no data', () => {
        const component = <FilePreviewGrid data={fromJS([])} previewCount={null} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('one row of data', () => {
        const component = <FilePreviewGrid data={fromJS([{ test: 123 }])} previewCount={null} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('three rows of data', () => {
        const component = <FilePreviewGrid data={DATA} previewCount={null} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('custom column headers', () => {
        const component = <FilePreviewGrid data={DATA} previewCount={null} columns={COLUMNS} />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('error message', () => {
        const component = <FilePreviewGrid data={DATA} previewCount={null} errorMsg="Testing error message" />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('error message with custom style', () => {
        const component = (
            <FilePreviewGrid data={DATA} previewCount={null} errorMsg="Testing error message" errorStyle="danger" />
        );
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('custom header and info message', () => {
        const component = (
            <FilePreviewGrid data={DATA} previewCount={null} header="Custom Header" infoMsg="Custom info message." />
        );
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });

    test('warning message', () => {
        const component = <FilePreviewGrid data={DATA} previewCount={null} warningMsg="Testing warning message" />;
        const { container } = render(component);
        expect(container).toMatchSnapshot();
    });
});
