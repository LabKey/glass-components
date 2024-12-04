import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { SelectInput, SelectInputChange, SelectInputOption } from '../forms/input/SelectInput';

import { QueryModel } from '../../../public/QueryModel/QueryModel';

import { LABKEY_VIS } from '../../constants';
import { naturalSortByProperty } from '../../../public/sort';

import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { RadioGroupInput, RadioGroupOption } from '../forms/input/RadioGroupInput';

import { ChartFieldInfo, ChartTypeInfo } from './ChartBuilderModal';

export const getSelectOptions = (
    model: QueryModel,
    chartType: ChartTypeInfo,
    field: ChartFieldInfo
): SelectInputOption[] => {
    const allowableTypes = LABKEY_VIS.GenericChartHelper.getAllowableTypes(field);

    return model.queryInfo
        .getDisplayColumns(model.viewName)
        .filter(col => {
            const colType = col.displayFieldJsonType || col.jsonType;
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

interface ChartFieldOptionProps {
    field: ChartFieldInfo;
    model: QueryModel;
    onScaleChange: (field: string, key: string, value: string | number) => void;
    onSelectFieldChange: SelectInputChange;
    scaleValues?: Record<string, string | number>;
    selectedType: ChartTypeInfo;
    value?: any;
}

export const ChartFieldOption: FC<ChartFieldOptionProps> = memo(props => {
    const { field, model, selectedType, onSelectFieldChange, scaleValues = {}, value, onScaleChange } = props;
    const options = useMemo(() => getSelectOptions(model, selectedType, field), [model, selectedType, field]);
    const showFieldOptions = shouldShowFieldOptions(field, selectedType);
    const [scale, setScale] = useState<Record<string, string | number>>(scaleValues);

    useEffect(() => {
        if (scaleValues) {
            setScale(scaleValues);
        }
    }, [scaleValues]);

    const onScaleTransChange = useCallback(
        (selected: string) => {
            onScaleChange(field.name, 'trans', selected);
            setScale(prev => ({ ...prev, trans: selected }));
        },
        [field.name, onScaleChange]
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

    const onScaleMinChange = useCallback((event: any) => {
        setScale(prev => ({ ...prev, min: event.target.value }));
    }, []);

    const onScaleMaxChange = useCallback((event: any) => {
        setScale(prev => ({ ...prev, max: event.target.value }));
    }, []);

    const onScaleRangeBlur = useCallback(() => {
        onScaleChange(field.name, 'min', parseFloat(scale.min?.toString()));
        onScaleChange(field.name, 'max', parseFloat(scale.max?.toString()));
    }, [field.name, onScaleChange, scale.max, scale.min]);

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
                    onChange={onSelectFieldChange}
                    value={value}
                />
                {showFieldOptions && (
                    <div className="field-option-icon">
                        <OverlayTrigger
                            triggerType="click"
                            overlay={
                                <Popover id="disabled-button-popover" placement="bottom">
                                    <div className="field-option-radio-group">
                                        <label>Scale</label>
                                        <RadioGroupInput
                                            name="scaleTrans"
                                            options={SCALE_TRANS_TYPES.map(
                                                option =>
                                                    ({
                                                        ...option,
                                                        selected: scale.trans === option.value,
                                                    }) as RadioGroupOption
                                            )}
                                            onValueChange={onScaleTransChange}
                                            formsy={false}
                                        />
                                    </div>
                                    <div className="field-option-radio-group">
                                        <label>Range</label>
                                        <RadioGroupInput
                                            name="scaleType"
                                            options={SCALE_RANGE_TYPES.map(
                                                option =>
                                                    ({
                                                        ...option,
                                                        selected: scale.type === option.value,
                                                    }) as RadioGroupOption
                                            )}
                                            onValueChange={onScaleTypeChange}
                                            formsy={false}
                                        />
                                    </div>
                                    {scale.type === 'manual' && (
                                        <div className="chart-builder-scale-range">
                                            <input
                                                name="scaleMin"
                                                type="number"
                                                className="chart-builder-field-footer-input"
                                                placeholder="Min"
                                                onBlur={onScaleRangeBlur}
                                                onChange={onScaleMinChange}
                                                value={scale.min ?? ''}
                                            />
                                            <span> - </span>
                                            <input
                                                name="scaleMan"
                                                type="number"
                                                className="chart-builder-field-footer-input"
                                                placeholder="Max"
                                                onBlur={onScaleRangeBlur}
                                                onChange={onScaleMaxChange}
                                                value={scale.max ?? ''}
                                            />
                                        </div>
                                    )}
                                </Popover>
                            }
                        >
                            <i className="fa fa-gear" />
                        </OverlayTrigger>
                    </div>
                )}
            </div>
        </div>
    );
});
