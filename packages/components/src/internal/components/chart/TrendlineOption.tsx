import React, { ChangeEvent, FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { LABKEY_VIS } from '../../constants';
import { LabelOverlay } from '../forms/LabelOverlay';

import { OverlayTrigger } from '../../OverlayTrigger';
import { Popover } from '../../Popover';
import { RadioGroupInput, RadioGroupOption } from '../forms/input/RadioGroupInput';

import { TrendlineType } from './models';
import { getFieldDataType } from './utils';

const ASYMPTOTE_TYPES = [
    { value: 'automatic', label: 'Automatic' },
    { value: 'manual', label: 'Manual' },
];

interface TrendlineOptionProps {
    fieldValues: Record<string, SelectInputOption>;
    onFieldChange: (key: string, value: SelectInputOption) => void;
    schemaQuery: SchemaQuery;
}

export const TrendlineOption: FC<TrendlineOptionProps> = memo(props => {
    const TRENDLINE_OPTIONS: TrendlineType[] = Object.values(LABKEY_VIS.GenericChartHelper.TRENDLINE_OPTIONS);
    const { fieldValues, onFieldChange, schemaQuery } = props;
    const showFieldOptions = fieldValues.trendlineType?.showMin || fieldValues.trendlineType?.showMax;

    // hide the trendline option if no x-axis value selected and for date field selection on x-axis
    const hidden = useMemo(() => {
        const jsonType = getFieldDataType(fieldValues.x?.data);
        return !fieldValues.x?.value || jsonType === 'date' || jsonType === 'time';
    }, [fieldValues.x]);

    const [loadingTrendlineOptions, setLoadingTrendlineOptions] = useState<boolean>(true);
    const [asymptoteType, setAsymptoteType] = useState<string>('automatic');
    const [asymptoteMin, setAsymptoteMin] = useState<string>('');
    const [asymptoteMax, setAsymptoteMax] = useState<string>('');
    const invalidRange = useMemo(
        () => !!asymptoteMin && !!asymptoteMax && asymptoteMax <= asymptoteMin,
        [asymptoteMin, asymptoteMax]
    );
    useEffect(() => {
        if (loadingTrendlineOptions && (!!fieldValues.trendlineAsymptoteMin || !!fieldValues.trendlineAsymptoteMax)) {
            setAsymptoteType('manual');
            setAsymptoteMin(fieldValues.trendlineAsymptoteMin?.value);
            setAsymptoteMax(fieldValues.trendlineAsymptoteMax?.value);
            setLoadingTrendlineOptions(false);
        }
    }, [fieldValues, loadingTrendlineOptions]);

    const onTrendlineAsymptoteMin = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setAsymptoteMin(event.target.value);
    }, []);

    const onTrendlineAsymptoteMax = useCallback((event: ChangeEvent<HTMLInputElement>) => {
        setAsymptoteMax(event.target.value);
    }, []);

    const applyTrendlineAsymptote = useCallback(() => {
        if (invalidRange) return;
        onFieldChange('trendlineAsymptoteMin', { value: asymptoteMin });
        onFieldChange('trendlineAsymptoteMax', { value: asymptoteMax });
    }, [onFieldChange, asymptoteMin, asymptoteMax, invalidRange]);

    const clearTrendlineAsymptote = useCallback(() => {
        setAsymptoteMin('');
        onFieldChange('trendlineAsymptoteMin', undefined);
        setAsymptoteMax('');
        onFieldChange('trendlineAsymptoteMax', undefined);
    }, [onFieldChange]);

    const onTrendlineFieldChange = useCallback(
        (key: string, _, selectedOption: SelectInputOption) => {
            setAsymptoteType('automatic');
            clearTrendlineAsymptote();
            onFieldChange(key, selectedOption);
        },
        [clearTrendlineAsymptote, onFieldChange]
    );

    const trendlineOptions = useMemo(() => {
        return TRENDLINE_OPTIONS.filter(option => {
            return !option.schemaPrefix || schemaQuery.schemaName.startsWith(option.schemaPrefix);
        });
    }, [TRENDLINE_OPTIONS, schemaQuery.schemaName]);

    const onAsymptoteTypeChange = useCallback(
        (selected: string) => {
            if (selected === 'automatic') {
                clearTrendlineAsymptote();
            }
            setAsymptoteType(selected);
        },
        [clearTrendlineAsymptote]
    );

    const asymptoteTypeOptions = useMemo(() => {
        return ASYMPTOTE_TYPES.map(
            option =>
                ({
                    ...option,
                    selected: asymptoteType === option.value,
                }) as RadioGroupOption
        );
    }, [asymptoteType]);

    if (hidden) return null;

    return (
        <div className="trendline-option">
            <label>
                Trendline{' '}
                <LabelOverlay placement="bottom">
                    {trendlineOptions
                        .filter(option => option.equation)
                        .map(option => (
                            <div className="row margin-bottom" key={option.value}>
                                <div className="col-xs-4">
                                    <strong>{option.label}</strong>
                                </div>
                                <div className="col-xs-8 equation">{option.equation}</div>
                            </div>
                        ))}
                </LabelOverlay>
            </label>
            <div className="form-group row">
                <SelectInput
                    showLabel={false}
                    clearable={false}
                    containerClass=""
                    inputClass={showFieldOptions ? 'col-xs-11' : 'col-xs-12'}
                    placeholder="Select trendline option"
                    name="trendlineType"
                    options={trendlineOptions}
                    onChange={onTrendlineFieldChange}
                    value={fieldValues.trendlineType?.value ?? ''}
                />
                {showFieldOptions && (
                    <div className="field-option-icon">
                        <OverlayTrigger
                            triggerType="click"
                            overlay={
                                <Popover id="chart-field-option-popover" placement="left">
                                    <div className="field-option-radio-group">
                                        <label>Asymptote</label>
                                        <RadioGroupInput
                                            name="asymptoteType"
                                            options={asymptoteTypeOptions}
                                            onValueChange={onAsymptoteTypeChange}
                                            formsy={false}
                                        />
                                    </div>
                                    {asymptoteType === 'manual' && (
                                        <div className="chart-builder-asymptote-inputs">
                                            {fieldValues.trendlineType?.showMin && (
                                                <input
                                                    name="trendlineAsymptoteMin"
                                                    type="number"
                                                    className="chart-builder-field-footer-input"
                                                    placeholder="Min"
                                                    onBlur={applyTrendlineAsymptote}
                                                    onChange={onTrendlineAsymptoteMin}
                                                    value={asymptoteMin}
                                                />
                                            )}
                                            {fieldValues.trendlineType?.showMin &&
                                                fieldValues.trendlineType?.showMax && <span> -</span>}
                                            {fieldValues.trendlineType?.showMax && (
                                                <input
                                                    name="trendlineAsymptoteMax"
                                                    type="number"
                                                    className="chart-builder-field-footer-input"
                                                    placeholder="Max"
                                                    onBlur={applyTrendlineAsymptote}
                                                    onChange={onTrendlineAsymptoteMax}
                                                    value={asymptoteMax}
                                                />
                                            )}
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
