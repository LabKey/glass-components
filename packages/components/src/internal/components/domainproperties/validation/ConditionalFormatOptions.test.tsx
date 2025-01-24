import React from 'react';

import { render } from '@testing-library/react';

import { createFormInputId } from '../utils';
import {
    DOMAIN_FIRST_FILTER_VALUE,
    DOMAIN_SECOND_FILTER_VALUE,
    DOMAIN_VALIDATOR_BOLD,
    DOMAIN_VALIDATOR_ITALIC,
    DOMAIN_VALIDATOR_STRIKETHROUGH,
} from '../constants';
import { INTEGER_TYPE, TEXT_TYPE } from '../PropDescType';

import conditionalFormat1 from '../../../../test/data/conditionalFormat1.json';
import conditionalFormat2 from '../../../../test/data/conditionalFormat2.json';

import { ConditionalFormatOptions } from './ConditionalFormatOptions';

describe('ConditionalFormatOptions', () => {
    test('Format 1 - expanded', () => {
        const validatorIndex = 0;
        const domainIndex = 1;

        const props = {
            validator: conditionalFormat1,
            index: 1,
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            expanded: true,
            dataType: INTEGER_TYPE,
            onExpand: jest.fn(),
            onDelete: jest.fn(),
            onChange: jest.fn(),
        };

        render(<ConditionalFormatOptions {...props} />);

        let value = document.querySelectorAll(
            '#' + createFormInputId(DOMAIN_FIRST_FILTER_VALUE, domainIndex, validatorIndex)
        );
        expect(value.item(0).getAttribute('value')).toEqual('0');

        value = document.querySelectorAll(
            '#' + createFormInputId(DOMAIN_SECOND_FILTER_VALUE, domainIndex, validatorIndex)
        );
        expect(value.item(0).getAttribute('value')).toEqual('1');

        const bold = document.querySelectorAll(
            '#' + createFormInputId(DOMAIN_VALIDATOR_BOLD, domainIndex, validatorIndex)
        );
        expect(bold.item(0).getAttribute('checked')).toBe('');

        const italic = document.querySelectorAll(
            '#' + createFormInputId(DOMAIN_VALIDATOR_ITALIC, domainIndex, validatorIndex)
        );
        expect(italic.item(0).getAttribute('checked')).toBeNull();

        const strike = document.querySelectorAll(
            '#' + createFormInputId(DOMAIN_VALIDATOR_STRIKETHROUGH, domainIndex, validatorIndex)
        );
        expect(strike.item(0).getAttribute('checked')).toBeNull();

        const colorPreviews = document.querySelectorAll('.domain-color-preview');
        expect(colorPreviews.length).toEqual(2);
        expect(colorPreviews.item(0).getAttribute('style')).toEqual('background-color: rgb(255, 99, 71);');
        expect(colorPreviews.item(1).getAttribute('style')).toEqual('background-color: rgb(0, 0, 128);');

        const textPreview = document.querySelector('#domain-validator-preview-0');
        expect(textPreview.getAttribute('style')).toEqual(
            'font-size: 12px; width: 100px; color: rgb(255, 99, 71); background-color: rgb(0, 0, 128); font-weight: bold; font-style: normal;'
        );
    });

    test('Format 2 - collapsed', () => {
        const validatorIndex = 0;
        const domainIndex = 1;

        const props = {
            validator: conditionalFormat2,
            index: 1,
            validatorIndex,
            domainIndex,
            mvEnabled: true,
            expanded: false,
            dataType: TEXT_TYPE,
            onExpand: jest.fn(),
            onDelete: jest.fn(),
            onChange: jest.fn(),
        };
        render(<ConditionalFormatOptions {...props} />);

        const collapsed = document.querySelector('#domain-condition-format-' + validatorIndex);
        expect(collapsed.textContent).toEqual('Is Not Blank and Is Greater Than 5');
    });
});
