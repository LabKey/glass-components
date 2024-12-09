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
import { render } from '@testing-library/react';

import { FileAttachmentContainer } from './FileAttachmentContainer';

describe('FileAttachmentContainer', () => {
    test('no props', () => {
        const { container } = render(<FileAttachmentContainer allowMultiple={false} allowDirectories={false} />);
        expect(container).toMatchSnapshot();
    });

    test('with attributes', () => {
        const { container } = render(
            <FileAttachmentContainer
                acceptedFormats=".tsv, .xls, .xlsx"
                allowDirectories
                allowMultiple
                compact
                index={1}
                labelLong="Upload your files here please..."
            />
        );
        expect(container).toMatchSnapshot();
    });

    test('with single file', () => {
        render(
            <FileAttachmentContainer
                allowMultiple={false}
                allowDirectories={false}
                initialFiles={{ 'file1.txt': new File([], 'file1.txt') }}
            />
        );

        expect(document.querySelector('.file-upload--container').className).toContain('hidden');
        expect(document.querySelector('.attached-file__container').textContent).toBe('file1.txt');
    });

    test('with multiple files', () => {
        render(
            <FileAttachmentContainer
                allowMultiple
                allowDirectories={false}
                initialFiles={{
                    'file1.txt': new File([], 'file1.txt'),
                    'file2.txt': new File([], 'file2.txt'),
                }}
            />
        );

        expect(document.querySelector('.file-upload--container').className).toContain('block');
        expect(document.querySelectorAll('.attached-file__container')).toHaveLength(2);
        expect(document.querySelectorAll('.attached-file__container')[0].textContent).toBe('file1.txt');
        expect(document.querySelectorAll('.attached-file__container')[1].textContent).toBe('file2.txt');

        expect(document.querySelectorAll('.file-upload--file-entry-listing')).toHaveLength(1);
        expect(document.querySelectorAll('.file-upload--scroll-footer')).toHaveLength(0);
    });

    test('with initial file names', () => {
        render(
            <FileAttachmentContainer
                allowMultiple
                allowDirectories={false}
                initialFileNames={['initial1.txt', 'initial2.csv']}
            />
        );

        expect(document.querySelector('.file-upload--container').className).toContain('block');
        expect(document.querySelectorAll('.attached-file__container')).toHaveLength(2);
    });

    test('with initial single file name - no multiples allowed', () => {
        render(
            <FileAttachmentContainer allowMultiple={false} allowDirectories={false} initialFileNames={['single.csv']} />
        );

        expect(document.querySelector('.file-upload--container').className).toContain('hidden');
        expect(document.querySelectorAll('.attached-file__container')).toHaveLength(1);
    });

    test('fileCountSuffix with multiple', () => {
        render(
            <FileAttachmentContainer
                allowMultiple
                allowDirectories={false}
                fileCountSuffix="will be uploaded"
                initialFiles={{
                    'file1.txt': new File([], 'file1.txt'),
                    'file2.txt': new File([], 'file2.txt'),
                }}
            />
        );

        expect(document.querySelector('.file-upload--container').className).toContain('block');
        expect(document.querySelectorAll('.attached-file__container')).toHaveLength(2);
        expect(document.querySelectorAll('.file-upload--file-entry-listing')).toHaveLength(1);
        expect(document.querySelector('.file-upload--scroll-footer').textContent).toBe('2 files will be uploaded.');
    });

    test('fileCountSuffix with single', () => {
        render(
            <FileAttachmentContainer
                allowMultiple
                allowDirectories={false}
                fileCountSuffix="will be uploaded"
                initialFiles={{
                    'file1.txt': new File([], 'file1.txt'),
                }}
            />
        );

        expect(document.querySelector('.file-upload--container').className).toContain('block');
        expect(document.querySelectorAll('.attached-file__container')).toHaveLength(1);
        expect(document.querySelectorAll('.file-upload--file-entry-listing')).toHaveLength(1);
        expect(document.querySelector('.file-upload--scroll-footer').textContent).toBe('1 file will be uploaded.');
    });
});
