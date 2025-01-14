import { immerable } from 'immer';

export enum BASE_UNITS {
    COUNT = 'Count',
    MASS = 'Mass',
    VOLUME = 'Volume',
}

export class UnitModel {
    [immerable] = true;

    readonly value: number;
    readonly unitStr?: string; //Originating unit string, may not be a typical MeasurementUnit
    readonly unit?: MeasurementUnit;

    constructor(value: number, unitStr: string) {
        const unit = MEASUREMENT_UNITS[unitStr?.toLowerCase()] || null;
        Object.assign(this, {value, unitStr, unit});
    }

    isSupportedUnitType(): boolean {
        return this.unit != null;
    }

    canConvert(newUnitStr: string): boolean {
        if (!newUnitStr) {
            return this.unit == null;
        }

        const newUnit: MeasurementUnit = MEASUREMENT_UNITS[newUnitStr.toLowerCase()];
        return newUnit?.baseUnit == this.unit?.baseUnit;
    }

    as(newUnitStr: string): UnitModel {
        if (!this.canConvert(newUnitStr)) {
            throw new Error('Cannot convert to "' + newUnitStr + '"');
        }

        const newUnit = MEASUREMENT_UNITS[newUnitStr?.toLowerCase()];
        if (!newUnit) {
            throw new Error('Unit type not supported "' + newUnitStr + '"');
        }

        if (this.value == null) {
            return new UnitModel(0, newUnit.label.toLowerCase());
        }

        const newValue = this.value * (this.unit.ratio / newUnit.ratio);
        return new UnitModel(parseFloat(newValue.toFixed(newUnit.displayPrecision)), newUnit.label.toLowerCase());
    }

    add(deltaValue: number, deltaUnitStr?: string) {
        let deltaUnit: MeasurementUnit = this.unit;
        if (deltaUnitStr) {
            if (!this.canConvert(deltaUnitStr)) {
                throw new Error('Cannot add "' + deltaUnitStr + '" to "' + this.unit?.label + '"');
            }

            deltaUnit = MEASUREMENT_UNITS[deltaUnitStr.toLowerCase()];
            if (!deltaUnit) {
                throw new Error('Unit type not supported "' + deltaUnitStr + '"');
            }
        }

        if (!this.unit) {
            return new UnitModel(this.value + deltaValue, this.unit?.label?.toLowerCase());
        }

        const newValue = this.value + deltaValue * (deltaUnit.ratio / this.unit.ratio);
        return new UnitModel(newValue, this.unit.label.toLowerCase());
    }

    compareTo(other: UnitModel) {
        const unitStr = this.unit?.label;
        const otherUnitStr = other.unit?.label;
        if (!areUnitsCompatible(unitStr, otherUnitStr)) {
            return undefined;
        }

        if (this.value == null && other.value != null) {
            return undefined;
        }
        if (this.value != null && other.value == null) {
            return undefined;
        }

        if (unitStr == otherUnitStr) {
            return this.value - other.value;
        }

        return this.value - other.as(unitStr).value;
    }

    toString(): string {
        return this.value + (this.unit ? (' ' + this.unit.label) : '');
    }

    toDisplayString(): string {
        return (this.value ? this.value.toLocaleString() : 0) + (this.unit ? (' ' + this.unit.label) : '');
    }

}

export interface MeasurementUnit {
    baseUnit: BASE_UNITS;
    // Number of decimal places allowed when unit is displayed
    displayPrecision: number;
    label: string;
    longLabelPlural: string;
    longLabelSingular: string;
    ratio: number;
}

export const MEASUREMENT_UNITS: { [key: string]: MeasurementUnit } = {
    g: {
        label: 'g',
        longLabelSingular: 'gram',
        longLabelPlural: 'grams',
        baseUnit: BASE_UNITS.MASS,
        ratio: 1,
        displayPrecision: 9, // enable smallest precision of ng
    },
    mg: {
        label: 'mg',
        longLabelSingular: 'milligram',
        longLabelPlural: 'milligrams',
        baseUnit: BASE_UNITS.MASS,
        ratio: 0.001,
        displayPrecision: 6,
    },
    kg: {
        label: 'kg',
        longLabelSingular: 'kilogram',
        longLabelPlural: 'kilograms',
        baseUnit: BASE_UNITS.MASS,
        ratio: 1000,
        displayPrecision: 12, // enable smallest precision of ng
    },
    ml: {
        label: 'mL',
        longLabelSingular: 'milliliter',
        longLabelPlural: 'milliliters',
        baseUnit: BASE_UNITS.VOLUME,
        ratio: 1,
        displayPrecision: 6, // enable smallest precision of nanoliters
    },
    ul: {
        label: 'uL',
        longLabelSingular: 'microliter',
        longLabelPlural: 'microliters',
        baseUnit: BASE_UNITS.VOLUME,
        ratio: 0.001,
        displayPrecision: 3,
    },
    l: {
        label: 'L',
        longLabelSingular: 'liter',
        longLabelPlural: 'liters',
        baseUnit: BASE_UNITS.VOLUME,
        ratio: 1000,
        displayPrecision: 9,
    },
    unit: {
        label: 'unit',
        longLabelSingular: 'unit',
        longLabelPlural: 'unit',
        baseUnit: BASE_UNITS.COUNT,
        ratio: 1,
        displayPrecision: 2,
    },
};

/**
 * @param unitAStr
 * @param unitBStr
 */
export function areUnitsCompatible(unitAStr: string, unitBStr: string) {
    if (unitAStr == unitBStr) {
        return true;
    }
    if (!unitAStr && !unitBStr) {
        return true;
    }
    if (unitAStr && !unitBStr) {
        return false;
    }
    if (!unitAStr && unitBStr) {
        return false;
    }
    const unitA: MeasurementUnit = MEASUREMENT_UNITS[unitAStr.toLowerCase()];
    const unitB: MeasurementUnit = MEASUREMENT_UNITS[unitBStr.toLowerCase()];
    if (!unitA || !unitB) {
        return false;
    }
    return unitA.baseUnit == unitB.baseUnit;
}

export function getMetricUnitOptions(): any[] {
    const options = [];
    for (const [key, value] of Object.entries(MEASUREMENT_UNITS)) {
        if (value.label === 'unit') {
            options.push({value: value.label, label: value.label});
        } else {
            options.push({value: value.label, label: value.label + ' (' + value.longLabelPlural + ')'});
        }
    }
    return options;
}

export function getAltMetricUnitOptions(unitTypeStr: string, showLongLabel?: boolean): any[] {
    const unit: MeasurementUnit = MEASUREMENT_UNITS[unitTypeStr?.toLowerCase()];
    if (!unit || unit.baseUnit === BASE_UNITS.COUNT) {
        return [];
    }

    const options = [];
    for (const [key, value] of Object.entries(MEASUREMENT_UNITS)) {
        if (value.baseUnit === unit.baseUnit) {
            if (!showLongLabel) {
                options.push({value: value.label, label: value.label});
            } else {
                options.push({value: value.label, label: value.label + ' (' + value.longLabelPlural + ')'});
            }
        }
    }
    return options;
}

export function getAltUnitKeys(unitTypeStr): string[] {
    const unit: MeasurementUnit = MEASUREMENT_UNITS[unitTypeStr?.toLowerCase()];
    if (!unit) {
        return [];
    }

    const options = [];
    Object.values(MEASUREMENT_UNITS).forEach(value => {
        if (value.baseUnit === unit.baseUnit) {
            options.push(value.label);
        }
    });

    return options;
}
export function convertUnitsForInput(amount: number, unit: string, displayUnit: string): number {
    if (!amount || !displayUnit || !unit) {
        return amount;
    }
    const currentUnit: MeasurementUnit = MEASUREMENT_UNITS[unit.toLowerCase()];
    const targetUnit: MeasurementUnit = MEASUREMENT_UNITS[displayUnit.toLowerCase()];
    if (!currentUnit || !targetUnit) {
        return amount;
    }
    // show up to 6 decimal places
    return parseFloat((amount * (currentUnit.ratio / targetUnit.ratio)).toFixed(targetUnit.displayPrecision));
}

export function convertUnitDisplay(
    amount: number,
    unit: string,
    displayUnit: string,
    includeUnits: boolean,
    emptyDisplay?: string
): string {
    const convertedAmount = convertUnitsForInput(amount, unit, displayUnit);
    // Allow for 0 so can't use !amount
    if (convertedAmount == null) {
        return emptyDisplay ? emptyDisplay : '';
    }
    if (!displayUnit) {
        return convertedAmount.toLocaleString() + (includeUnits && unit ? ' ' + unit : '');
    }
    if (!unit) {
        return convertedAmount.toLocaleString() + (includeUnits && displayUnit ? ' ' + displayUnit : '');
    }

    const currentUnit: MeasurementUnit = MEASUREMENT_UNITS[unit.toLowerCase()];
    const targetUnit: MeasurementUnit = MEASUREMENT_UNITS[displayUnit.toLowerCase()];
    if (!currentUnit || !targetUnit) {
        return convertedAmount.toLocaleString() + (includeUnits ? ' ' + unit : '');
    }

    return (
        (convertedAmount > 1000 ? convertedAmount.toLocaleString() : convertedAmount) +
        (includeUnits ? ' ' + displayUnit : '')
    );
}

// volume unit (displayUnit): 10 mL (L)
// volume unit: 10 mL
// volume (displayUnit): 10 (L)
// volume: 10
// volume not set: null
export function getStoredAmountDisplay(rawValue: string, includeUnits?: boolean): string {
    if (!rawValue || !rawValue.trim()) {
        return null;
    }

    const parts: string[] = rawValue.trim().split(/\b\s+/);
    if (parts.length === 1) {
        return rawValue.toLocaleString();
    }

    if (parts.length === 2) {
        if (includeUnits) {
            const unit = parts[1];
            if (unit.indexOf('(') === 0 && unit.indexOf(')') === unit.length - 1) {
                return parts[0].toLocaleString() + ' ' + unit.substring(1, unit.length - 1);
            } else {
                return rawValue.toLocaleString();
            }
        } else {
            return parts[0].toLocaleString();
        }
    }

    if (parts.length === 3) {
        const volume = parts[0];
        const currentUnit = parts[1];
        const targetUnit = parts[2];
        return convertUnitDisplay(
            parseFloat(volume),
            currentUnit,
            targetUnit.substring(1, targetUnit.length - 1),
            includeUnits
        );
    }

    return rawValue;
}

export function getVolumeMinStep(sampleTypeUnit?: string | MeasurementUnit) {
    const step = 0.01;
    if (!sampleTypeUnit) {
        return step;
    }

    const unit = typeof sampleTypeUnit === 'string' ? MEASUREMENT_UNITS[sampleTypeUnit.toLowerCase()] : sampleTypeUnit;

    // If we don't know the units, or it is 'unit' then use the default
    if (!unit || unit === MEASUREMENT_UNITS.unit) {
        return step;
    }

    return Math.pow(10, -unit.displayPrecision); // Track uL and mg to a single unit
}

export function isMeasurementUnitIgnoreCase(expected: MeasurementUnit, val: string) {
    return expected.label.localeCompare(val, 'en-US', {sensitivity: 'base'}) === 0;
}

export function isValuePrecisionValid(value: number, precision: number): boolean {
    if (!value) {
        return true;
    }
    if (value < 0) {
        return false;
    }

    const valueValidator = new RegExp(`^\\d*(\\.\\d{0,${precision}})?$`);
    return valueValidator.test(value.toString());
}
