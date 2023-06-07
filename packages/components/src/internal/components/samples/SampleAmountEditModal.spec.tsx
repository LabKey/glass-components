import React from 'react';
import { ReactWrapper } from 'enzyme';
import { Button } from 'react-bootstrap';

import { SchemaQuery } from '../../../public/SchemaQuery';

import { Alert } from '../base/Alert';
import { mountWithServerContext } from '../../test/enzymeTestHelpers';
import { TEST_USER_EDITOR } from '../../userFixtures';

import { SampleAmountEditModal } from './SampleAmountEditModal';

describe('SampleAmountEditModal', () => {
    const testSchemaQuery = new SchemaQuery('schema', 'query', 'view');
    const emptyRow = {};
    const noun = 'noun';

    function validate(
        wrapper: ReactWrapper,
        amount: number,
        units: string,
        hasSelect: boolean,
        comment: string,
        noun: string,
        canSave: boolean,
        isNegative?: boolean,
        hasLabelUnits = true
    ) {
        expect(wrapper.find('.checkin-amount-label').text()).toContain(
            'Amount' + (units && hasLabelUnits ? ' (' + units + ')' : '')
        );
        expect(wrapper.find('input.storage-amount-input').prop('value')).toBe(amount);
        expect(wrapper.find('.checkin-unit-select')).toHaveLength(hasSelect ? 1 : 0);
        expect(wrapper.find('input.checkin-unit-input')).toHaveLength(hasSelect ? 0 : 1);

        expect(wrapper.find('textarea').prop('value')).toBe(comment ?? '');
        expect(wrapper.find(Alert)).toHaveLength(isNegative ? 2 : 1);
        if (isNegative) expect(wrapper.find(Alert).at(1).text()).toBe('Amount must be a positive value.');
        validateSubmitButton(wrapper, noun, canSave);
        validateSubmitButton(wrapper, noun, canSave);
    }

    function validateSubmitButton(wrapper: ReactWrapper, noun: string, canSave: boolean) {
        const success = wrapper.find(Button).at(1);
        expect(success.text()).toBe('Update ' + noun);
        expect(success.prop('disabled')).toBe(!canSave);
    }

    test('minimal props', () => {
        const wrapper = mountWithServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={emptyRow}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            { user: TEST_USER_EDITOR }
        );

        expect(wrapper.find(Button).at(0).text()).toBe('Cancel');
        validate(wrapper, undefined, undefined, false, undefined, noun, false);

        wrapper.unmount();
    });

    test('Amount null', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: null },
            Units: { value: 'uL' },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, undefined, row.Units.value, true, '', noun, false);

        wrapper.unmount();
    });

    test('StoredAmount negative', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '-500' },
            Units: { value: 'uL' },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, row.StoredAmount.value, row.Units.value, true, '', noun, false, true);

        wrapper.unmount();
    });

    test('Units null', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: null },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, row.StoredAmount.value, row.Units.value, false, '', noun, false);

        wrapper.unmount();
    });

    test('Units custom', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: 'custom' },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, row.StoredAmount.value, row.Units.value, false, '', noun, false);

        wrapper.unmount();
    });

    test("Set only comment, can't save", () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: 'uL' },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, row.StoredAmount.value, row.Units.value, true, '', noun, false);

        const userComment = 'Additional text for the audit log';
        wrapper.find('#userComment').simulate('change', { target: { name: 'body', value: userComment } });
        validate(wrapper, row.StoredAmount.value, row.Units.value, true, userComment, noun, false);

        wrapper.unmount();
    });

    test('Set comment and StoredAmount, can save', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: 'uL' },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, row.StoredAmount.value, row.Units.value, true, '', noun, false);

        const userComment = 'Additional text for the audit log';
        const newStoredAmount = 5;
        wrapper.find('#userComment').simulate('change', { target: { name: 'body', value: userComment } });
        wrapper
            .find('input.storage-amount-input')
            .simulate('change', { target: { name: 'amountDelta', value: newStoredAmount } });
        validate(wrapper, newStoredAmount, row.Units.value, true, userComment, noun, true);

        wrapper.unmount();
    });

    test('Set units, can save', () => {
        const row = {
            Name: { value: 'abcd' },
            StoredAmount: { value: '500' },
            Units: { value: 'oldUnits' },
            FreezeThawCount: { value: 1 },
        } as any;

        const wrapper = mountWithServerContext(
            <SampleAmountEditModal
                schemaQuery={testSchemaQuery}
                row={row}
                noun={noun}
                updateListener={jest.fn()}
                onClose={jest.fn()}
            />,
            { user: TEST_USER_EDITOR }
        );

        validate(wrapper, row.StoredAmount.value, row.Units.value, false, '', noun, false);

        const newUnits = 'newUnits';
        wrapper.find('input.checkin-unit-input').simulate('change', { target: { value: newUnits } });
        validate(wrapper, row.StoredAmount.value, newUnits, false, '', noun, true, false, false);

        wrapper.unmount();
    });
});
