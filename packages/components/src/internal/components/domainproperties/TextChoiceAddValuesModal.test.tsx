import React from 'react';

import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { TextChoiceAddValuesModal } from './TextChoiceAddValuesModal';

describe('TextChoiceAddValuesModal', () => {
    const DEFAULT_PROPS = {
        fieldName: undefined,
        onCancel: jest.fn,
        onApply: jest.fn,
    };

    function validate(fieldName?: string): void {
        expect(document.querySelectorAll('p')).toHaveLength(1);
        expect(document.querySelectorAll('textarea')).toHaveLength(1);
        expect(document.querySelectorAll('button')).toHaveLength(3); // close, cancel, apply
        expect(document.querySelectorAll('.btn-success')).toHaveLength(1); // apply

        const title = 'Add Text Choice Values' + (fieldName ? ' for ' + fieldName : '');
        expect(document.querySelector('.modal-title').textContent).toBe(title);
    }

    function validateCounterText(totalStr: string, newStr: string): void {
        expect(document.querySelector('p').textContent).toBe(
            `Enter each value on a new line. ${totalStr} can be added.`
        );
        expect(document.querySelector('.text-choice-value-count').textContent).toBe(`${newStr} provided.`);
    }

    test('default props', () => {
        render(<TextChoiceAddValuesModal {...DEFAULT_PROPS} />);
        validate();
        validateCounterText('200 values', '0 new values');
    });

    test('initialValueCount', () => {
        render(<TextChoiceAddValuesModal {...DEFAULT_PROPS} initialValueCount={70} />);
        validate();
        validateCounterText('130 values', '0 new values');
    });

    test('fieldName', () => {
        render(<TextChoiceAddValuesModal {...DEFAULT_PROPS} fieldName="Test" />);
        validate('Test');
    });

    test('textarea input updates', async () => {
        render(<TextChoiceAddValuesModal {...DEFAULT_PROPS} />);
        validate();
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBeTruthy();
        validateCounterText('200 values', '0 new values');

        await userEvent.type(document.querySelector('textarea'), 'a');
        validate();
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBeFalsy();
        validateCounterText('200 values', '1 new value');

        // empty rows and duplicates (after trim) should be removed
        await userEvent.clear(document.querySelector('textarea'));
        await userEvent.type(document.querySelector('textarea'), 'a\n\na\na \n a\nb');
        validate();
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBeFalsy();
        validateCounterText('200 values', '2 new values');
    });

    test('success button disabled after max reached', async () => {
        render(<TextChoiceAddValuesModal {...DEFAULT_PROPS} maxValueCount={2} />);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBeTruthy();
        validateCounterText('2 values', '0 new values');

        await userEvent.type(document.querySelector('textarea'), 'a\nb');
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBeFalsy();
        validateCounterText('2 values', '2 new values');

        await userEvent.type(document.querySelector('textarea'), '\nc');
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBeTruthy();
        validateCounterText('2 values', '3 new values');
    });

    test('initial already equal to max', async () => {
        render(<TextChoiceAddValuesModal {...DEFAULT_PROPS} initialValueCount={2} maxValueCount={2} />);
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBeTruthy();
        validateCounterText('0 values', '0 new values');

        await userEvent.type(document.querySelector('textarea'), 'a\nb');
        expect(document.querySelector('.btn-success').hasAttribute('disabled')).toBeTruthy();
        validateCounterText('0 values', '2 new values');
    });
});
