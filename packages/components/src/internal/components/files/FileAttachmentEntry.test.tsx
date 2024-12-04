import React from 'react';

import { render } from '@testing-library/react';

import { FileAttachmentEntry } from './FileAttachmentEntry';

describe('<FileAttachmentEntry>', () => {
    test('with onDelete', () => {
        const { container } = render(<FileAttachmentEntry onDelete={jest.fn()} name="Test files" />);
        expect(document.querySelectorAll('span.fa-times-circle')).toHaveLength(1);
        expect(container.textContent).toBe('Test files');
    });
    test('no deletion', () => {
        render(<FileAttachmentEntry allowDelete={false} name="Test files" />);
        expect(document.querySelectorAll('span.fa-times-circle')).toHaveLength(0);
    });
    test('with downloadUrl', () => {
        render(<FileAttachmentEntry downloadUrl="http://get/me/my/file" name="Test files" />);
        expect(document.querySelectorAll('a[href="http://get/me/my/file"]')).toHaveLength(1);
    });
});
