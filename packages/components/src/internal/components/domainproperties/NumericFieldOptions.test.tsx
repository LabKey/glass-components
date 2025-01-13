import React from 'react';

import { render } from '@testing-library/react';

import { createFormInputId } from './utils';
import { DOMAIN_FIELD_DEFAULT_SCALE, DOMAIN_FIELD_FORMAT, DOMAIN_FIELD_NOT_LOCKED } from './constants';
import { NumericFieldOptions } from './NumericFieldOptions';

const SCANNABLE_OPTION_CLASS = '.domain-text-option-scannable';

describe('NumericFieldOptions', () => {
    test('Numeric data type', () => {
        const _section = 'Numeric Field Options';
        const _format = '0.00';

        const props = {
            index: 1,
            domainIndex: 1,
            label: _section,
            format: _format,
            defaultScale: 'LINEAR',
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        const { container } = render(<NumericFieldOptions {...props} />);

        // Verify label
        const sectionLabel = document.querySelectorAll('.domain-field-section-heading');
        expect(sectionLabel.length).toEqual(1);
        expect(sectionLabel[0].textContent).toEqual(_section);

        // Test format field initial value
        const formatField = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_FORMAT, 1, 1));
        expect(formatField.length).toEqual(1);
        expect(formatField[0].getAttribute('value')).toEqual(_format);

        // Verify default scale field
        const defaultScale = document.querySelectorAll('#' + createFormInputId(DOMAIN_FIELD_DEFAULT_SCALE, 1, 1));
        expect(defaultScale.length).toEqual(1);
        expect(defaultScale[0].querySelectorAll('option').length).toEqual(2);
        expect(defaultScale[0].querySelectorAll('option')[0].getAttribute('value')).toEqual('LINEAR');
        expect(defaultScale[0].querySelectorAll('option')[0].textContent).toEqual('Linear');
        expect(defaultScale[0].querySelectorAll('option')[1].getAttribute('value')).toEqual('LOG');
        expect(defaultScale[0].querySelectorAll('option')[1].textContent).toEqual('Log');

        expect(container).toMatchSnapshot();
    });

    test('Scannable Option field not shown', () => {
        const _section = 'Numeric Field Options';
        const _format = '';

        const props = {
            index: 1,
            domainIndex: 1,
            label: _section,
            format: _format,
            defaultScale: 'LINEAR',
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        // All cases below should not display the field
        render(<NumericFieldOptions {...props} showScannableOption={false} appPropertiesOnly={false} />);
        expect(document.querySelectorAll(SCANNABLE_OPTION_CLASS)).toHaveLength(0);

        render(<NumericFieldOptions {...props} showScannableOption={true} appPropertiesOnly={false} />);
        expect(document.querySelectorAll(SCANNABLE_OPTION_CLASS)).toHaveLength(0);

        render(<NumericFieldOptions {...props} showScannableOption={false} appPropertiesOnly={true} />);
        expect(document.querySelectorAll(SCANNABLE_OPTION_CLASS)).toHaveLength(0);
    });

    test('Scannable Option field shown and default false', () => {
        const _section = 'Numeric Field Options';
        const _format = '';

        const props = {
            index: 1,
            domainIndex: 1,
            label: _section,
            format: _format,
            defaultScale: 'LINEAR',
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
        };

        render(<NumericFieldOptions {...props} appPropertiesOnly={true} showScannableOption={true} />);
        const scannable = document.querySelectorAll(SCANNABLE_OPTION_CLASS);
        expect(scannable.length).toEqual(1);
        expect(scannable[0].hasAttribute('checked')).toEqual(false);
    });

    test('Scannable Option value', () => {
        const _section = 'Numeric Field Options';
        const _format = '';

        const props = {
            index: 1,
            domainIndex: 1,
            label: _section,
            format: _format,
            defaultScale: 'LINEAR',
            onChange: jest.fn(),
            lockType: DOMAIN_FIELD_NOT_LOCKED,
            showScannableOption: true,
            appPropertiesOnly: true,
        };

        render(<NumericFieldOptions {...props} scannable={true} />);
        let scannable = document.querySelectorAll(SCANNABLE_OPTION_CLASS);
        expect(scannable.length).toEqual(1);
        expect(scannable[0].hasAttribute('checked')).toEqual(true);

        render(<NumericFieldOptions {...props} scannable={false} />);
        scannable = document.querySelectorAll(SCANNABLE_OPTION_CLASS);
        expect(scannable.length).toEqual(2);
        expect(scannable[0].hasAttribute('checked')).toEqual(true);
        expect(scannable[1].hasAttribute('checked')).toEqual(false);
    });
});
