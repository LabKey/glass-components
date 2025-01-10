import React from 'react';

import { render } from '@testing-library/react';

import {
    DOMAIN_FIELD_FILE_DISPLAY,
    DOMAIN_FIELD_NOT_LOCKED,
    FILE_DISPLAY_ATTACHMENT,
    FILE_DISPLAY_INLINE,
} from './constants';
import { createFormInputId } from './utils';
import { FileAttachmentOptions } from './FileAttachmentOptions';

describe('FileAttachmentOptions', () => {
    test('File data type inline', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: 'File',
            displayOption: FILE_DISPLAY_INLINE,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        const { container } = render(<FileAttachmentOptions {...props} />);

        // Verify label
        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel[0].textContent).toEqual('File Behavior');

        // Test file behavior initial value
        const displayField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_FILE_DISPLAY, 1, 1));
        expect(displayField.length).toEqual(1);

        // Verify options
        expect(displayField[0].querySelectorAll('option').length).toEqual(2);
        expect(displayField[0].querySelectorAll('option')[0].getAttribute('value')).toEqual(FILE_DISPLAY_INLINE);
        expect(displayField[0].querySelectorAll('option')[0].textContent).toEqual('Show File in Browser');
        expect(displayField[0].querySelectorAll('option')[1].getAttribute('value')).toEqual(FILE_DISPLAY_ATTACHMENT);
        expect(displayField[0].querySelectorAll('option')[1].textContent).toEqual('Download File');

        expect(container).toMatchSnapshot();
    });

    test('Attachment data type download', () => {
        const props = {
            index: 1,
            domainIndex: 1,
            label: 'Attachment',
            displayOption: FILE_DISPLAY_ATTACHMENT,
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        const { container } = render(<FileAttachmentOptions {...props} />);

        // Verify label
        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel[0].textContent).toEqual('Attachment Behavior');

        // Test file behavior initial value
        const displayField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_FILE_DISPLAY, 1, 1));
        expect(displayField.length).toEqual(1);

        // Verify options
        expect(displayField[0].querySelectorAll('option').length).toEqual(2);
        expect(displayField[0].querySelectorAll('option')[0].getAttribute('value')).toEqual(FILE_DISPLAY_INLINE);
        expect(displayField[0].querySelectorAll('option')[0].textContent).toEqual('Show Attachment in Browser');
        expect(displayField[0].querySelectorAll('option')[1].getAttribute('value')).toEqual(FILE_DISPLAY_ATTACHMENT);
        expect(displayField[0].querySelectorAll('option')[1].textContent).toEqual('Download Attachment');

        expect(container).toMatchSnapshot();
    });
});
