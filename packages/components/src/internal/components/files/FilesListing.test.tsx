import React from 'react';
import { List, Set } from 'immutable';

import { render } from '@testing-library/react';

import { FILES_DATA } from '../../../test/data/constants';

import { IFile } from './models';
import { FilesListing } from './FilesListing';

describe('<FilesListing>', () => {
    test('no files', () => {
        const { container } = render(
            <FilesListing
                noFilesMessage="No files for you"
                onFileSelection={jest.fn()}
                selectedFiles={Set<string>()}
                files={List<IFile>()}
            />
        );
        expect(container.textContent).toBe('No files for you');
        expect(container).toMatchSnapshot();
    });
    test('with files custom header', () => {
        const { container } = render(
            <FilesListing
                headerText="Custom header"
                noFilesMessage="No files for you"
                onFileSelection={jest.fn()}
                selectedFiles={Set<string>()}
                files={FILES_DATA}
            />
        );
        expect(document.querySelectorAll('div.file-listing--header')).toHaveLength(1);
        expect(document.querySelector('div.file-listing--header').textContent).toBe('Custom header');
        expect(container).toMatchSnapshot();
    });
    test('with files not deletable', () => {
        const { container } = render(
            <FilesListing
                noFilesMessage="No files for you"
                onFileSelection={jest.fn()}
                selectedFiles={Set<string>()}
                files={FILES_DATA}
            />
        );
        expect(document.querySelectorAll('div.file-listing-row--container')).toHaveLength(FILES_DATA.size);
        expect(container).toMatchSnapshot();
    });
    test('with files deletable', () => {
        const { container } = render(
            <FilesListing
                noFilesMessage="No files for you"
                onFileSelection={jest.fn()}
                canDelete={true}
                onDelete={jest.fn()}
                selectedFiles={Set<string>()}
                files={FILES_DATA}
            />
        );
        expect(document.querySelectorAll('span.file-listing-delete')).toHaveLength(FILES_DATA.size);
        expect(container).toMatchSnapshot();
    });
});
