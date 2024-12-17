import React from 'react';

import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';
import { TEST_USER_EDITOR } from '../../internal/userFixtures';

import { FileAttachmentForm } from './FileAttachmentForm';

describe('<FileAttachmentForm/>', () => {
    test('no props', () => {
        renderWithAppContext(<FileAttachmentForm />, {
            serverContext: { user: TEST_USER_EDITOR },
        });
        expect(document.querySelector('.fa-download')).not.toBeInTheDocument();
        expect(document.querySelector('.file-formats')).not.toBeInTheDocument();
        expect(document.querySelector('.control-label').textContent).toEqual('Attachments');
        expect(document.querySelector('.file-upload__input').getAttribute('multiple')).toEqual('');
    });

    test('with attributes', () => {
        renderWithAppContext(
            <FileAttachmentForm
                acceptedFormats=".tsv, .xls, .xlsx"
                allowDirectories={false}
                allowMultiple={false}
                label="file attachment"
                templateUrl="#downloadtemplateurl"
            />,
            {
                serverContext: { user: TEST_USER_EDITOR },
            }
        );
        expect(document.querySelector('.fa-download')).toBeInTheDocument();
        expect(document.querySelector('.file-form-formats')).toBeInTheDocument();
        expect(document.querySelector('.control-label').textContent).toEqual('file attachment');
        expect(document.querySelector('.file-upload__input').getAttribute('multiple')).toEqual(null);
    });
});
