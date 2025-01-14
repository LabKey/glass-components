import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { LABKEY_VIS } from '../../constants';
import { naturalSortByProperty } from '../../../public/sort';

import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { RadioGroupInput, RadioGroupOption } from '../forms/input/RadioGroupInput';

import { ChartFieldInfo, ChartTypeInfo } from './ChartBuilderModal';
import { getFieldDataType } from './utils';

export const getSelectOptions = (
    model: QueryModel,
    chartType: ChartTypeInfo,
    field: ChartFieldInfo
): SelectInputOption[] => {
    const allowableTypes = LABKEY_VIS.GenericChartHelper.getAllowableTypes(field);

    return model.queryInfo
        .getDisplayColumns(model.viewName)
        .filter(col => {
            const colType = getFieldDataType(col);
            const hasMatchingType = allowableTypes.indexOf(colType) > -1;
            const isMeasureDimensionMatch = LABKEY_VIS.GenericChartHelper.isMeasureDimensionMatch(
                chartType.name,
                field,
                col.measure,
                col.dimension
            );
            return hasMatchingType || isMeasureDimensionMatch;
        })
        .sort(naturalSortByProperty('caption'))
        .map(col => ({ label: col.caption, value: col.fieldKey, data: col }));
};

export const shouldShowFieldOptions = (field: ChartFieldInfo, selectedType: ChartTypeInfo): boolean => {
    const showForX = field.name === 'x' && (selectedType.name === 'scatter_plot' || selectedType.name === 'line_plot');
    const showForY =
        field.name === 'y' &&
        (selectedType.name === 'scatter_plot' || selectedType.name === 'line_plot' || selectedType.name === 'box_plot');
    return showForX || showForY;
};

const SCALE_TRANS_TYPES = [
    { value: 'linear', label: 'Linear' },
    { value: 'log', label: 'Log' },
];

const SCALE_RANGE_TYPES = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
];

const DEFAULT_SCALE_VALUES = { type: 'automatic', trans: 'linear' };

interface ChartFieldOptionProps {
    field: ChartFieldInfo;
    fieldValue?: SelectInputOption;
    model: QueryModel;
    onScaleChange: (field: string, key: string, value: string | number, reset?: boolean) => void;
    onSelectFieldChange: (name: string, value: string, selectedOption: SelectInputOption) => void;
    scaleValues?: Record<string, string | number>;
    selectedType: ChartTypeInfo;
}

export const ChartFieldOption: FC<ChartFieldOptionProps> = memo(props => {
    const { field, model, selectedType, onSelectFieldChange, scaleValues, fieldValue, onScaleChange } = props;
    const options = useMemo(() => getSelectOptions(model, selectedType, field), [model, selectedType, field]);
    const isNumericType = useMemo(
        () => LABKEY_VIS.GenericChartHelper.isNumericType(getFieldDataType(fieldValue?.data)),
        [fieldValue?.data]
    );
    const showFieldOptions = isNumericType && shouldShowFieldOptions(field, selectedType);
    const [scale, setScale] = useState<Record<string, string | number>>(scaleValues ?? {});
    const invalidRange = useMemo(
        () =>
            scale.min !== undefined &&
            scale.min !== null &&
            scale.max !== undefined &&
            scale.max !== null &&
            parseFloat(scale.max.toString()) <= parseFloat(scale.min.toString()),
        [scale]
    );

    useEffect(() => {
        if (showFieldOptions && !scale.type) {
            setScale(scaleValues?.type ? scaleValues : DEFAULT_SCALE_VALUES);
        }
    }, [showFieldOptions, scale.type, scaleValues]);

    const onScaleTransChange = useCallback(
        (selected: string) => {
            onScaleChange(field.name, 'trans', selected);
            setScale(prev => ({ ...prev, trans: selected }));
        },
        [field.name, onScaleChange]
    );

    const onSelectFieldChange_ = useCallback(
        (name: string, value: string, selectedOption: SelectInputOption) => {
            onScaleChange(field.name, undefined, undefined, true);
            setScale(DEFAULT_SCALE_VALUES);
            onSelectFieldChange(name, value, selectedOption);
        },
        [field.name, onScaleChange, onSelectFieldChange]
    );

    const onScaleTypeChange = useCallback(
        (selected: string) => {
            let scale_: Record<string, string | number> = { ...scale, type: selected };
            onScaleChange(field.name, 'type', selected);
            if (selected === 'automatic') {
                onScaleChange(field.name, 'min', undefined);
                onScaleChange(field.name, 'max', undefined);
                scale_ = { ...scale_, min: undefined, max: undefined };
            }
            setScale(scale_);
        },
        [field.name, onScaleChange, scale]
    );

    const onScaleMinChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setScale(prev => ({ ...prev, min: event.target.value }));
    }, []);

    const onScaleMaxChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setScale(prev => ({ ...prev, max: event.target.value }));
    }, []);

    const onScaleRangeBlur = useCallback(() => {
        if (invalidRange) return;
        onScaleChange(field.name, 'min', parseFloat(scale.min?.toString()));
        onScaleChange(field.name, 'max', parseFloat(scale.max?.toString()));
    }, [field.name, onScaleChange, scale.max, scale.min, invalidRange]);

    const scaleTransOptions = useMemo(() => {
        return SCALE_TRANS_TYPES.map(
            option =>
                ({
                    ...option,
                    selected: scale.trans === option.value,
                }) as RadioGroupOption
        );
    }, [scale.trans]);

    const scaleTypeOptions = useMemo(() => {
        return SCALE_RANGE_TYPES.map(
            option =>
                ({
                    ...option,
                    selected: scale.type === option.value,
                }) as RadioGroupOption
        );
    }, [scale.type]);

    return (
        <div>
            <label>
                {field.label}
                {field.required && ' *'}
            </label>
            <div className="form-group row">
                <SelectInput
                    showLabel={false}
                    containerClass=""
                    inputClass={showFieldOptions ? 'col-xs-11' : 'col-xs-12'}
                    placeholder="Select a field"
                    name={field.name}
                    options={options}
                    onChange={onSelectFieldChange_}
                    value={fieldValue?.value}
                />
                {showFieldOptions && (
                    <div className="field-option-icon">
                        <OverlayTrigger
                            triggerType="click"
                            overlay={
                                <Popover id="chart-field-option-popover" placement="bottom">
                                    <div className="field-option-radio-group">
                                        <label>Scale</label>
                                        <RadioGroupInput
                                            name="scaleTrans"
                                            options={scaleTransOptions}
                                            onValueChange={onScaleTransChange}
                                            formsy={false}
                                        />
                                    </div>
                                    <div className="field-option-radio-group">
                                        <label>Range</label>
                                        <RadioGroupInput
                                            name="scaleType"
                                            options={scaleTypeOptions}
                                            onValueChange={onScaleTypeChange}
                                            formsy={false}
                                        />
                                    </div>
                                    {scale.type === 'manual' && (
                                        <div className="chart-builder-scale-range-inputs">
                                            <input
                                                name="scaleMin"
                                                type="number"
                                                className="chart-builder-field-footer-input"
                                                placeholder="Min"
                                                onBlur={onScaleRangeBlur}
                                                onChange={onScaleMinChange}
                                                value={scale.min ?? ''}
                                            />
                                            <span>&nbsp;&nbsp;-&nbsp;</span>
                                            <input
                                                name="scaleMax"
                                                type="number"
                                                className="chart-builder-field-footer-input"
                                                placeholder="Max"
                                                onBlur={onScaleRangeBlur}
                                                onChange={onScaleMaxChange}
                                                value={scale.max ?? ''}
                                            />
                                            {invalidRange && (
                                                <div className="text-danger">Invalid range (Max &lt;= Min)</div>
                                            )}
                                        </div>
                                    )}
                                </Popover>
                            }
                        >
                            <span className="fa fa-gear" />
                        </OverlayTrigger>
                    </div>
                )}
            </div>
        </div>
    );
});
