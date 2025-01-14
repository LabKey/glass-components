import {
    convertUnitDisplay,
    convertUnitsForInput,
    getAltMetricUnitOptions,
    getAltUnitKeys,
    getMetricUnitOptions,
    getStoredAmountDisplay,
    isValuePrecisionValid,
    UnitModel,
} from './measurement';

describe('UnitModel', () => {
    test('constructor and operators', () => {
        expect(new UnitModel(10, null).toString()).toBe('10');
        expect(new UnitModel(10, 'mL').toString()).toBe('10 mL');

        expect(new UnitModel(99999, 'uL').as('L').toString()).toBe('0.099999 L');
        expect(new UnitModel(99999.133, 'uL').as('L').toString()).toBe('0.099999133 L');
        expect(new UnitModel(99999.13345678, 'uL').as('L').toString()).toBe('0.099999133 L');
        expect(new UnitModel(99999.13345678, 'mg').as('kg').toString()).toBe('0.099999133457 kg');
        expect(new UnitModel(10, 'mL').as('L').toString()).toBe('0.01 L');
        expect(new UnitModel(10, 'mL').add(10, 'uL').toString()).toBe('10.01 mL');
        expect(new UnitModel(undefined, 'mL').as('L').toString()).toBe('0 L');

        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(9, 'mL')) > 0).toBeTruthy();
        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(9, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(10, 'mL').compareTo(new UnitModel(undefined, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(undefined, 'mL').compareTo(new UnitModel(9, 'L')) > 0).toBeFalsy();
        expect(new UnitModel(undefined, 'mL').compareTo(new UnitModel(undefined, 'L')) > 0).toBeFalsy();
    });
});

describe('MetricUnit utils', () => {
    test('getMetricUnitOptions', () => {
        const expectedMetricUnitOptions = [
            { label: 'unit', value: 'unit' },
            { label: 'g (grams)', value: 'g' },
            { label: 'kg (kilograms)', value: 'kg' },
            { label: 'mg (milligrams)', value: 'mg' },
            { label: 'mL (milliliters)', value: 'mL' },
            { label: 'uL (microliters)', value: 'uL' },
            { label: 'L (liters)', value: 'L' },
        ];

        const options = getMetricUnitOptions().sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        expect(options).toEqual(
            expect.arrayContaining([
                expect.objectContaining(expectedMetricUnitOptions[0]),
                expect.objectContaining(expectedMetricUnitOptions[1]),
                expect.objectContaining(expectedMetricUnitOptions[2]),
                expect.objectContaining(expectedMetricUnitOptions[3]),
                expect.objectContaining(expectedMetricUnitOptions[4]),
                expect.objectContaining(expectedMetricUnitOptions[5]),
                expect.objectContaining(expectedMetricUnitOptions[6]),
            ])
        );
    });

    test('getAltMetricUnitOptions', () => {
        const expectedUlOptions = [
            { label: 'L', value: 'L' },
            { label: 'mL', value: 'mL' },
            { label: 'uL', value: 'uL' },
        ];
        const ulOptions = getAltMetricUnitOptions('uL').sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        expect(ulOptions).toEqual(
            expect.arrayContaining([
                expect.objectContaining(expectedUlOptions[0]),
                expect.objectContaining(expectedUlOptions[1]),
                expect.objectContaining(expectedUlOptions[2]),
            ])
        );

        const expectedUlLongLabelOptions = [
            { label: 'L (liters)', value: 'L' },
            { label: 'mL (milliliters)', value: 'mL' },
            { label: 'uL (microliters)', value: 'uL' },
        ];
        const ulLongLabelOptions = getAltMetricUnitOptions('uL', true).sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        expect(ulLongLabelOptions).toEqual(
            expect.arrayContaining([
                expect.objectContaining(expectedUlLongLabelOptions[0]),
                expect.objectContaining(expectedUlLongLabelOptions[1]),
                expect.objectContaining(expectedUlLongLabelOptions[2]),
            ])
        );

        const expectedKgOptions = [
            { label: 'g', value: 'g' },
            { label: 'kg', value: 'kg' },
            { label: 'mg', value: 'mg' },
        ];
        const kgOptions = getAltMetricUnitOptions('kg').sort((a, b) => {
            return a.label.localeCompare(b.label);
        });
        expect(kgOptions).toEqual(
            expect.arrayContaining([
                expect.objectContaining(expectedKgOptions[0]),
                expect.objectContaining(expectedKgOptions[1]),
                expect.objectContaining(expectedKgOptions[2]),
            ])
        );

        expect(getAltMetricUnitOptions(null).length).toBe(0);
        expect(getAltMetricUnitOptions('').length).toBe(0);
        expect(getAltMetricUnitOptions('bad').length).toBe(0);
    });

    test('getAltUnitKeys', () => {
        const expectedUlOptions = ['mL', 'uL', 'L'];
        expect(getAltUnitKeys('uL')).toEqual(expectedUlOptions);
        expect(getAltUnitKeys('mL')).toEqual(expectedUlOptions);

        const expectedGOptions = ['g', 'mg', 'kg'];
        expect(getAltUnitKeys('g')).toEqual(expectedGOptions);
        expect(getAltUnitKeys('kg')).toEqual(expectedGOptions);

        expect(getAltUnitKeys('unit')).toEqual(['unit']);

        expect(getAltUnitKeys(null).length).toBe(0);
        expect(getAltUnitKeys('').length).toBe(0);
        expect(getAltUnitKeys('bad').length).toBe(0);
    });

    test('convertUnitsForInput', () => {
        expect(convertUnitsForInput(null, null, null)).toBeNull();
        expect(convertUnitsForInput(1000, null, null)).toBe(1000);
        expect(convertUnitsForInput(1000, 'mL', null)).toBe(1000);
        expect(convertUnitsForInput(1000, 'mL', null)).toBe(1000);
        expect(convertUnitsForInput(1000, 'mL', 'mL')).toBe(1000);
        expect(convertUnitsForInput(1234, 'mL', 'L')).toBe(1.234);
        expect(convertUnitsForInput(12.34, 'L', 'mL')).toBe(12340);
        expect(convertUnitsForInput(12, 'g', 'kg')).toBe(0.012);
    });

    test('convertUnitDisplay', () => {
        expect(convertUnitDisplay(null, null, null, false)).toBe('');
        expect(convertUnitDisplay(null, null, null, false, 'empty')).toBe('empty');

        expect(convertUnitDisplay(10, null, null, false)).toBe('10');
        expect(convertUnitDisplay(10000, null, null, false)).toBe('10,000');
        expect(convertUnitDisplay(10, 'mL', null, false)).toBe('10');
        expect(convertUnitDisplay(10, 'mL', null, true)).toBe('10 mL');
        expect(convertUnitDisplay(10, null, 'kg', false)).toBe('10');
        expect(convertUnitDisplay(10, null, 'kg', true)).toBe('10 kg');

        expect(convertUnitDisplay(10, 'mL', 'bad', false)).toBe('10');
        expect(convertUnitDisplay(10, 'mL', 'bad', true)).toBe('10 mL');

        expect(convertUnitDisplay(99999, 'uL', 'L', true)).toBe('0.099999 L');
        expect(convertUnitDisplay(99999.133, 'uL', 'L', true)).toBe('0.099999133 L');
        expect(convertUnitDisplay(99999.1334544, 'uL', 'L', true)).toBe('0.099999133 L');
        expect(convertUnitDisplay(10, 'mL', 'L', true)).toBe('0.01 L');
        expect(convertUnitDisplay(10, 'L', 'mL', true)).toBe('10,000 mL');
        expect(convertUnitDisplay(10, 'g', 'kg', true)).toBe('0.01 kg');
        expect(convertUnitDisplay(10, 'g', 'kg', false)).toBe('0.01');

        expect(convertUnitDisplay(10, 'unit', 'unit', true)).toBe('10 unit');
        expect(convertUnitDisplay(10000, 'unit', 'unit', true)).toBe('10,000 unit');
    });

    test('getStoredAmountDisplay', () => {
        expect(getStoredAmountDisplay('99999 uL (L)')).toBe('0.099999');
        expect(getStoredAmountDisplay('99999 uL (L)', true)).toBe('0.099999 L');
        expect(getStoredAmountDisplay('99999.123 uL (L)')).toBe('0.099999123');
        expect(getStoredAmountDisplay('99999.123 uL (L)', true)).toBe('0.099999123 L');
        expect(getStoredAmountDisplay('99999.12345 uL (L)')).toBe('0.099999123');
        expect(getStoredAmountDisplay('99999.12345 uL (L)', true)).toBe('0.099999123 L');
        expect(getStoredAmountDisplay('10 mL (L)', true)).toBe('0.01 L');
        expect(getStoredAmountDisplay('10 L (L)', true)).toBe('10 L');
        expect(getStoredAmountDisplay('10 mL')).toBe('10');
        expect(getStoredAmountDisplay('10 mL', true)).toBe('10 mL');
        expect(getStoredAmountDisplay('10 (mL)')).toBe('10');
        expect(getStoredAmountDisplay('10 (mL)', true)).toBe('10 mL');
        expect(getStoredAmountDisplay('10', true)).toBe('10');
        expect(getStoredAmountDisplay('0 (mL)', true)).toBe('0 mL');
        expect(getStoredAmountDisplay(null)).toBe(null);
        expect(getStoredAmountDisplay(null, true)).toBe(null);
    });
});

describe('isValuePrecisionValid', () => {
    test('value prop missing', () => {
        expect(isValuePrecisionValid(undefined, 0)).toBeTruthy();
        expect(isValuePrecisionValid(null, 0)).toBeTruthy();
    });

    test('value prop negative', () => {
        expect(isValuePrecisionValid(-1, 0)).toBeFalsy();
        expect(isValuePrecisionValid(-0.000000001, 0)).toBeFalsy();
    });

    test('precision prop', () => {
        expect(isValuePrecisionValid(1, 0)).toBeTruthy();
        expect(isValuePrecisionValid(1.0, 0)).toBeTruthy();
        expect(isValuePrecisionValid(1.1, 0)).toBeFalsy();

        expect(isValuePrecisionValid(0.000001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(0.000001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(0.0000011, 6)).toBeFalsy();
        expect(isValuePrecisionValid(0.0000019, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.000001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.000001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.0000011, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.0000019, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.100001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.100001, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.1000011, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.1000019, 6)).toBeFalsy();
        expect(isValuePrecisionValid(0.999999, 6)).toBeTruthy();
        expect(isValuePrecisionValid(0.999999, 6)).toBeTruthy();
        expect(isValuePrecisionValid(0.9999991, 6)).toBeFalsy();
        expect(isValuePrecisionValid(0.9999999, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.999999, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.999999, 6)).toBeTruthy();
        expect(isValuePrecisionValid(1.9999991, 6)).toBeFalsy();
        expect(isValuePrecisionValid(1.9999999, 6)).toBeFalsy();
    });
});
