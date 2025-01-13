import React from 'react';

import { render } from '@testing-library/react';

import { NameExpressionPreview } from './NameExpressionPreview';

describe('NameExpressionPreview', () => {
    test('loading', () => {
        render(<NameExpressionPreview isPreviewLoading={true} />);
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(1);
    });

    test('with preview', () => {
        render(<NameExpressionPreview previewName="S-1001" />);
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        expect(document.body.textContent).toEqual(
            'Example of name that will be generated from the current pattern:\u00a0S-1001'
        );
    });

    test('without preview', () => {
        render(<NameExpressionPreview previewName={null} />);
        expect(document.querySelectorAll('.fa-spinner')).toHaveLength(0);
        expect(document.body.textContent).toBe(
            'Unable to generate example name from the current pattern. Check for syntax errors.'
        );
    });
});
