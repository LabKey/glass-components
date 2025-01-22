import React from 'react';

import { render } from '@testing-library/react';

import { NameExpressionValidationModal } from './NameExpressionValidationModal';

beforeAll(() => {
    LABKEY.moduleContext = {
        inventory: {},
    };
});

describe('NameExpressionValidationModal', () => {
    const DEFAULT_PROPS = {
        previews: ['S-1001', 'S-parentSample-002'],
        show: true,
        onHide: jest.fn(),
        onConfirm: jest.fn(),
    };

    const warnings = [
        'Name Pattern warning: No ending parentheses found.',
        'Name Pattern warning: Invalid starting value xyz.',
    ];
    const aliquotWarnings = [
        "Aliquot Name Pattern warning: The 'withCounter' substitution pattern starting at position 27 should be enclosed in ${}.",
    ];

    test('name and aliquot name warnings', () => {
        render(<NameExpressionValidationModal {...DEFAULT_PROPS} warnings={[...warnings, ...aliquotWarnings]} />);

        expect(document.querySelector('.btn-danger').textContent).toBe('Save anyway');
        expect(document.querySelector('.modal-title').textContent).toBe('Sample and Aliquot Naming Pattern Warning(s)');
        expect(document.querySelector('.modal-body').textContent).toBe(
            "Naming Pattern Warning(s):Example name generated: S-1001No ending parentheses found.Invalid starting value xyz.Aliquot Naming Pattern Warning(s):Example aliquot name generated: S-parentSample-002The 'withCounter' substitution pattern starting at position 27 should be enclosed in ${}."
        );
    });

    test('name warnings', () => {
        render(<NameExpressionValidationModal {...DEFAULT_PROPS} warnings={warnings} />);

        expect(document.querySelector('.btn-danger').textContent).toBe('Save anyway');
        expect(document.querySelector('.modal-title').textContent).toBe('Naming Pattern Warning(s)');
        expect(document.querySelector('.modal-body').textContent).toBe(
            'Example name generated: S-1001No ending parentheses found.Invalid starting value xyz.'
        );
    });

    test('aliquot name warnings only', () => {
        render(<NameExpressionValidationModal {...DEFAULT_PROPS} warnings={aliquotWarnings} />);

        expect(document.querySelector('.btn-danger').textContent).toBe('Save anyway');
        expect(document.querySelector('.modal-title').textContent).toBe('Aliquot Naming Pattern Warning(s)');
        expect(document.querySelector('.modal-body').textContent).toBe(
            "Example aliquot name generated: S-parentSample-002The 'withCounter' substitution pattern starting at position 27 should be enclosed in ${}."
        );
    });

    test('override title', () => {
        render(<NameExpressionValidationModal {...DEFAULT_PROPS} warnings={warnings} title="bad expression!!" />);

        expect(document.querySelector('.btn-danger').textContent).toBe('Save anyway');
        expect(document.querySelector('.modal-title').textContent).toBe('bad expression!!');
        expect(document.querySelector('.modal-body').textContent).toBe(
            'Example name generated: S-1001No ending parentheses found.Invalid starting value xyz.'
        );
    });
});
