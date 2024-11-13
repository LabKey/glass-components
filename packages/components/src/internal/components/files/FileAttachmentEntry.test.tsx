import React from 'react';

import { render } from '@testing-library/react';

import { FileAttachmentEntry } from './FileAttachmentEntry';

describe('<FileAttachmentEntry>', () => {
    test('default props', () => {
        const { container } = render(<FileAttachmentEntry onDelete={jest.fn()} name="Test files" />);
        expect(document.querySelectorAll('span.fa-times-circle')).toHaveLength(1);
        expect(container.textContent).toBe('Test files');
        expect(container).toMatchSnapshot();
    });
    test('no deletion', () => {
        const { container } = render(<FileAttachmentEntry allowDelete={false} name="Test files" />);
        expect(document.querySelectorAll('span.fa-times-circle')).toHaveLength(0);
        expect(container).toMatchSnapshot();
    });
    test('with deleteTitleText', () => {
        const { container } = render(
            <FileAttachmentEntry onDelete={jest.fn()} deleteTitleText="Delete me" name="Test files" />
        );
        expect(document.querySelectorAll('span.fa-times-circle')).toHaveLength(1);
        expect(document.querySelector('.file-upload__remove--icon').getAttribute('title')).toBe('Delete me');
        expect(container).toMatchSnapshot();
    });
    test('with downloadUrl', () => {
        const { container } = render(
            <FileAttachmentEntry allowDelete={false} downloadUrl="http://get/me/my/file" name="Test files" />
        );
        expect(document.querySelectorAll('a[href="http://get/me/my/file"]')).toHaveLength(1);
        expect(container).toMatchSnapshot();
    });
});
