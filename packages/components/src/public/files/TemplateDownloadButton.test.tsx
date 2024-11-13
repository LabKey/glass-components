import React from 'react';

import { TEST_USER_EDITOR, TEST_USER_READER } from '../../internal/userFixtures';

import { renderWithAppContext } from '../../internal/test/reactTestLibraryHelpers';

import { TemplateDownloadButton } from './TemplateDownloadButton';

describe('TemplateDownloadButton', () => {
    test('no onclick or templateUrl', () => {
        const { container } = renderWithAppContext(<TemplateDownloadButton />);
        expect(container.textContent).toBe('');
    });

    test('no onclick, empty templateUrl', () => {
        const { container } = renderWithAppContext(<TemplateDownloadButton templateUrl="" />);
        expect(container.textContent).toBe('');
    });

    test('reader', () => {
        const { container } = renderWithAppContext(<TemplateDownloadButton templateUrl="" user={TEST_USER_READER} />);
        expect(container.textContent).toBe('');
    });

    test('editor', () => {
        const { container } = renderWithAppContext(
            <TemplateDownloadButton templateUrl="testUrl" user={TEST_USER_EDITOR} />,
            {}
        );
        expect(container.textContent).toBe(' Template');
        expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
    });

    test('editor, with custom properties', () => {
        const { container } = renderWithAppContext(
            <TemplateDownloadButton
                onClick={jest.fn}
                text="Test Text"
                className="custom-styling"
                user={TEST_USER_EDITOR}
            />,
            {}
        );
        expect(container.textContent).toBe(' Test Text');
        expect(document.querySelectorAll('span.fa-download')).toHaveLength(1);
        expect(document.querySelectorAll('.custom-styling')).toHaveLength(1);
    });
});
