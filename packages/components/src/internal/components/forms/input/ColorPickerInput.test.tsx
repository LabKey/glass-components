import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { ColorPickerInput } from './ColorPickerInput';

describe('ColorPickerInput', () => {
    test('default props', () => {
        const { container } = render(<ColorPickerInput value="#000000" onChange={jest.fn} />);
        expect(container).toMatchSnapshot();
    });

    test('without value', () => {
        const { container } = render(<ColorPickerInput value={undefined} onChange={jest.fn} />);
        expect(container).toMatchSnapshot();
    });

    test('with button text', () => {
        const { container } = render(<ColorPickerInput value="#000000" text="Select color..." onChange={jest.fn} />);
        expect(container).toMatchSnapshot();
    });

    test('showPicker', async () => {
        const { container } = render(<ColorPickerInput value="#000000" onChange={jest.fn} />);
        await userEvent.click(document.querySelector('.color-picker__button'));
        expect(container).toMatchSnapshot();
    });

    test('allowRemove', () => {
        const { container } = render(<ColorPickerInput value="#000000" onChange={jest.fn} allowRemove />);
        expect(container).toMatchSnapshot();
    });

    test('disabled', () => {
        const { container } = render(<ColorPickerInput value="#000000" onChange={jest.fn} disabled />);
        expect(container).toMatchSnapshot();
    });
});
