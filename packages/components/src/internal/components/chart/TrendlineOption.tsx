import React, { FC, memo, useCallback, useEffect, useMemo, useState } from 'react';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';
import { SchemaQuery } from '../../../public/SchemaQuery';

import { LABKEY_VIS } from '../../constants';
import { LabelOverlay } from '../forms/LabelOverlay';

import { TrendlineType } from './models';

interface TrendlineOptionProps {
    fieldValues: Record<string, SelectInputOption>;
    onFieldChange: (key: string, value: SelectInputOption) => void;
    schemaQuery: SchemaQuery;
}

export const TrendlineOption: FC<TrendlineOptionProps> = memo(props => {
    const TRENDLINE_OPTIONS: TrendlineType[] = Object.values(LABKEY_VIS.GenericChartHelper.TRENDLINE_OPTIONS);
    const { fieldValues, onFieldChange, schemaQuery } = props;

    // hide the trendline option if no x-axis value selected and for date field selection on x-axis
    const hidden = useMemo(() => {
        const jsonType = fieldValues.x?.data?.jsonType || fieldValues.x?.data?.type;
        return !fieldValues.x?.value || jsonType === 'date' || jsonType === 'time';
    }, [fieldValues.x]);

    const [loadingTrendlineOptions, setLoadingTrendlineOptions] = useState<boolean>(true);
    const [asymptoteMin, setAsymptoteMin] = useState<string>('');
    const [asymptoteMax, setAsymptoteMax] = useState<string>('');
    useEffect(() => {
        if (loadingTrendlineOptions && (!!fieldValues.trendlineAsymptoteMin || !!fieldValues.trendlineAsymptoteMax)) {
            setAsymptoteMin(fieldValues.trendlineAsymptoteMin?.value);
            setAsymptoteMax(fieldValues.trendlineAsymptoteMax?.value);
            setLoadingTrendlineOptions(false);
        }
    }, [fieldValues, loadingTrendlineOptions]);

    const onTrendlineAsymptoteMin = useCallback((event: any) => {
        setAsymptoteMin(event.target.value);
    }, []);

    const onTrendlineAsymptoteMax = useCallback((event: any) => {
        setAsymptoteMax(event.target.value);
    }, []);

    const applyTrendlineAsymptote = useCallback(() => {
        onFieldChange('trendlineAsymptoteMin', { value: asymptoteMin });
        onFieldChange('trendlineAsymptoteMax', { value: asymptoteMax });
    }, [onFieldChange, asymptoteMin, asymptoteMax]);

    const onTrendlineFieldChange = useCallback(
        (key: string, _, selectedOption: SelectInputOption) => {
            setAsymptoteMin('');
            onFieldChange('trendlineAsymptoteMin', undefined);
            setAsymptoteMax('');
            onFieldChange('trendlineAsymptoteMax', undefined);
            onFieldChange(key, selectedOption);
        },
        [onFieldChange]
    );

    useEffect(() => {
        // if the x-axis measure has been removed or the option is hidden, clear the trendline type
        if (hidden && fieldValues.trendlineType?.value) {
            onTrendlineFieldChange('trendlineType', undefined, undefined);
        }
    }, [hidden, fieldValues, onTrendlineFieldChange]);

    const trendlineOptions = useMemo(() => {
        return TRENDLINE_OPTIONS.filter(option => {
            return !option.schemaPrefix || schemaQuery.schemaName.startsWith(option.schemaPrefix);
        });
    }, [TRENDLINE_OPTIONS, schemaQuery.schemaName]);

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
            <SelectInput
                showLabel={false}
                clearable={false}
                containerClass="form-group row select-input-with-footer"
                inputClass="col-xs-12"
                placeholder="Select trendline option"
                name="trendlineType"
                options={trendlineOptions}
                onChange={onTrendlineFieldChange}
                value={fieldValues.trendlineType?.value ?? ''}
            />
            {(fieldValues.trendlineType?.showMin || fieldValues.trendlineType?.showMax) && (
                <div className="field-footer-section">
                    Asymptote:
                    {fieldValues.trendlineType?.showMin && (
                        <input
                            name="trendlineAsymptoteMin"
                            type="number"
                            className="field-footer-input"
                            placeholder="Min"
                            onBlur={applyTrendlineAsymptote}
                            onChange={onTrendlineAsymptoteMin}
                            value={asymptoteMin}
                        />
                    )}
                    {fieldValues.trendlineType?.showMax && (
                        <input
                            name="trendlineAsymptoteMax"
                            type="number"
                            className="field-footer-input"
                            placeholder="Max"
                            onBlur={applyTrendlineAsymptote}
                            onChange={onTrendlineAsymptoteMax}
                            value={asymptoteMax}
                        />
                    )}
                    {!!asymptoteMin && !!asymptoteMax && asymptoteMax <= asymptoteMin && (
                        <span className="text-danger margin-left">Invalid range</span>
                    )}
                </div>
            )}
        </div>
    );
});
