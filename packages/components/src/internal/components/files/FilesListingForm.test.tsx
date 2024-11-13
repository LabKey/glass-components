import React from 'react';
import { List } from 'immutable';

import { render } from '@testing-library/react';

import { FILES_DATA, FILES_DATA_2 } from '../../../test/data/constants';

import { FilesListingForm } from './FilesListingForm';

import { IFile } from './models';

describe('<FilesListingForm/>', () => {
    test('empty files default props', () => {
        const { container } = render(<FilesListingForm files={List<IFile>()} />);
        expect(container).toMatchSnapshot();
    });
    test('empty files custom msg', () => {
        const { container } = render(
            <FilesListingForm files={List<IFile>()} noFilesMessage="the file list is empty" />
        );
        expect(container).toMatchSnapshot();
    });
    test('with files default props', () => {
        const { container } = render(<FilesListingForm files={FILES_DATA} />);
        expect(container).toMatchSnapshot();
    });
    test('with files custom props', () => {
        const { container } = render(
            <FilesListingForm
                files={FILES_DATA}
                addFileText="add more files"
                noFilesMessage="No files currently attached."
                canInsert={true}
                canDelete={true}
                handleUpload={jest.fn()}
                handleDelete={jest.fn()}
                handleDownload={jest.fn()}
            />
        );
        expect(container).toMatchSnapshot();
    });
    test('with only readOnly files', () => {
        const { container } = render(
            <FilesListingForm readOnlyFiles={FILES_DATA} readOnlyHeaderText="Read-only files" />
        );
        expect(container).toMatchSnapshot();
    });
    test('with readOnly and editable files', () => {
        const { container } = render(
            <FilesListingForm
                files={FILES_DATA}
                readOnlyFiles={FILES_DATA_2}
                headerText="Your files"
                readOnlyHeaderText={"Other files you can't remove"}
                noFilesMessage="No files for you!"
                noReadOnlyFilesMessage="No other files for you either!"
                addFileText="more files"
                canInsert={true}
                canDelete={true}
                handleUpload={jest.fn()}
                handleDelete={jest.fn()}
                handleDownload={jest.fn()}
            />
        );
        expect(container).toMatchSnapshot();
    });
    test('with readOnly and noFilesMessage', () => {
        const { container } = render(
            <FilesListingForm
                readOnlyFiles={FILES_DATA_2}
                headerText="Your files"
                readOnlyHeaderText={"Other files you can't remove"}
                noFilesMessage="No files for you!"
                noReadOnlyFilesMessage="No other files for you either!"
                addFileText="more files"
                canInsert={true}
                canDelete={true}
                handleUpload={jest.fn()}
                handleDelete={jest.fn()}
                handleDownload={jest.fn()}
            />
        );
        expect(container).toMatchSnapshot();
    });
    test('with editable and noReadOnlyFilesMessage', () => {
        const { container } = render(
            <FilesListingForm
                files={FILES_DATA}
                headerText="Your files"
                readOnlyHeaderText={"Other files you can't remove"}
                noFilesMessage="No files for you!"
                noReadOnlyFilesMessage="No other files for you either!"
                addFileText="more files"
                canInsert={true}
                canDelete={true}
                handleUpload={jest.fn()}
                handleDelete={jest.fn()}
                handleDownload={jest.fn()}
            />
        );
        expect(container).toMatchSnapshot();
    });
    test('with no files and both messages', () => {
        const { container } = render(
            <FilesListingForm
                headerText="Your files"
                readOnlyHeaderText={"Other files you can't remove"}
                noFilesMessage="No files for you!"
                noReadOnlyFilesMessage="No other files for you either!"
                addFileText="more files"
                canInsert={true}
                canDelete={true}
                handleUpload={jest.fn()}
                handleDelete={jest.fn()}
                handleDownload={jest.fn()}
            />
        );
        expect(container).toMatchSnapshot();
    });
});
