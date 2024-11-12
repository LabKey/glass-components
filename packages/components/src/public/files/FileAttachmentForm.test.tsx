import React from 'react';

import { FileAttachmentForm } from './FileAttachmentForm';
import {renderWithAppContext} from "../../internal/test/reactTestLibraryHelpers";
import {TEST_USER_EDITOR} from "../../internal/userFixtures";

describe('<FileAttachmentForm/>', () => {
    test('no props', () => {
        const { container } = renderWithAppContext(<FileAttachmentForm />, {
            serverContext: { user: TEST_USER_EDITOR}
        });
        expect(container).toMatchSnapshot();
    });

    test('with attributes', () => {
        const { container } = renderWithAppContext(
            <FileAttachmentForm
                acceptedFormats=".tsv, .xls, .xlsx"
                allowDirectories={false}
                allowMultiple={false}
                label="file attachment"
                templateUrl="#downloadtemplateurl"
            />, {
                serverContext: { user: TEST_USER_EDITOR}
            }
        );
        expect(container).toMatchSnapshot();
    });
});
