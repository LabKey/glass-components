import React, { FC, memo, useCallback, useEffect, useState } from 'react';

import { getFolderDateTimeHelpBody } from '../../util/helpLinks';

import {
    ContainerFormats,
    DateFormatType,
    DateTimeSettingProp,
    getContainerFormats,
    getDateTimeInputOptions,
    getDateTimeSettingFormat,
    getNonStandardFormatWarning,
    getDateTimeSettingWarning,
    splitDateTimeFormat,
    isValidAltDateTimeFormatOptions,
} from '../../util/Date';

import { useServerContext } from '../base/ServerContext';

import { SelectInput, SelectInputOption } from '../forms/input/SelectInput';

import { Tip } from '../base/Tip';

import { isFieldFullyLocked } from './propertiesUtil';
import { createFormInputId, createFormInputName } from './utils';
import { DOMAIN_FIELD_FORMAT } from './constants';
import { ITypeDependentProps } from './models';
import { SectionHeading } from './SectionHeading';
import { DomainFieldLabel } from './DomainFieldLabel';

interface DateTimeFieldProps extends ITypeDependentProps {
    format: string;
    type: 'dateTime' | 'date' | 'time';
}

export const getInitDateTimeSetting = (
    fieldFormat: string,
    formats: ContainerFormats,
    type: string,
    dateOptions: SelectInputOption[],
    timeOptions: SelectInputOption[]
): DateTimeSettingProp => {
    const isDate = type === 'dateTime' || type === 'date';
    const isTime = type === 'dateTime' || type === 'time';
    const formatType = isDate && isTime ? DateFormatType.DateTime : isDate ? DateFormatType.Date : DateFormatType.Time;
    let currentFormat: string, parentFormat: string, settingName: string, dateFormat: string, timeFormat: string;
    const inherited = !fieldFormat;
    switch (formatType) {
        case DateFormatType.DateTime:
            settingName = 'Date Times';
            parentFormat = formats.dateTimeFormat;
            currentFormat = inherited ? parentFormat : fieldFormat;
            const parts = splitDateTimeFormat(currentFormat);
            dateFormat = parts[0];
            timeFormat = parts[1];
            break;
        case DateFormatType.Date:
            settingName = 'Dates';
            parentFormat = formats.dateFormat;
            currentFormat = inherited ? parentFormat : fieldFormat;
            dateFormat = currentFormat;
            break;
        case DateFormatType.Time:
            settingName = 'Times';
            parentFormat = formats.timeFormat;
            currentFormat = inherited ? parentFormat : fieldFormat;
            timeFormat = currentFormat;
    }
    const invalidWarning = getNonStandardFormatWarning(formatType, currentFormat, true);
    if (invalidWarning && formatType === DateFormatType.DateTime) {
        dateFormat = currentFormat;
        timeFormat = '';
    }
    return {
        formatType,
        settingName,
        dateOptions: isDate ? dateOptions : undefined,
        timeOptions: isTime ? timeOptions : undefined,
        isDate,
        dateFormat,
        isTime,
        isTimeRequired: isTime && !isDate,
        timeFormat,
        inherited,
        parentFormat,
        invalidWarning,
    };
};

export const DateTimeFieldOptions: FC<DateTimeFieldProps> = memo(props => {
    const { onChange, index, label, format, lockType, domainIndex, type } = props;
    const [setting, setSetting] = useState<DateTimeSettingProp>();
    const { timezone, container } = useServerContext();
    const [domainFieldId, setDomainFieldId] = useState<string>();

    useEffect(() => {
        const { dateOptions, timeOptions, optionalTimeOptions } = getDateTimeInputOptions(timezone);

        const settings_ = getInitDateTimeSetting(
            format,
            getContainerFormats(container),
            type,
            dateOptions,
            type === 'dateTime' ? optionalTimeOptions : timeOptions
        );
        setSetting(settings_);
        setDomainFieldId(createFormInputId(DOMAIN_FIELD_FORMAT, domainIndex, index));
    }, [type]);

    const onToggleInherited = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>): void => {
            const { checked } = event.target;
            setSetting(prevSetting => {
                const updates: Partial<DateTimeSettingProp> = {
                    inherited: checked,
                };
                if (checked) {
                    const parentFormat = prevSetting.parentFormat;

                    if (prevSetting.isDate && !prevSetting.isTime) updates.dateFormat = parentFormat;
                    else if (!prevSetting.isDate && prevSetting.isTime) updates.timeFormat = parentFormat;
                    else {
                        const parts = splitDateTimeFormat(parentFormat);
                        updates.dateFormat = parts[0];
                        updates.timeFormat = parts[1];
                    }
                }
                updates.invalidWarning = getDateTimeSettingWarning(
                    {
                        ...prevSetting,
                        ...updates,
                    } as DateTimeSettingProp,
                    true
                );
                const updatedSetting = {
                    ...prevSetting,
                    ...updates,
                };

                onChange?.(domainFieldId, checked ? null : getDateTimeSettingFormat(updatedSetting));

                return updatedSetting;
            });
        },
        [setSetting, domainFieldId, onChange]
    );

    const onFormatChange = useCallback(
        (newFormat: string, isTime?: boolean): void => {
            setSetting(prevSetting => {
                const updates: Partial<DateTimeSettingProp> = {
                    [isTime ? 'timeFormat' : 'dateFormat']: newFormat == null ? '' : newFormat,
                };
                updates.invalidWarning = getDateTimeSettingWarning(
                    {
                        ...prevSetting,
                        ...updates,
                    } as DateTimeSettingProp,
                    true
                );

                const updatedSetting = {
                    ...prevSetting,
                    ...updates,
                };
                onChange?.(domainFieldId, getDateTimeSettingFormat(updatedSetting));
                return updatedSetting;
            });
        },
        [domainFieldId, onChange]
    );

    const onDateFormatChange = useCallback(
        (name: string, selectedValue: string, selectedOption: SelectInputOption): void => {
            onFormatChange(selectedOption?.value);
        },
        [onFormatChange]
    );

    const onTimeFormatChange = useCallback(
        (name: string, selectedValue: string, selectedOption: SelectInputOption): void => {
            onFormatChange(selectedOption?.value, true);
        },
        [onFormatChange]
    );

    if (!setting) return null;

    return (
        <div>
            <div className="row">
                <div className="col-xs-12">
                    <SectionHeading title={label} />
                </div>
            </div>
            <div className="row">
                <div className="col-xs-3">Use Default</div>
                <div className="col-xs-9">
                    <input
                        checked={setting.inherited}
                        onChange={onToggleInherited}
                        disabled={isFieldFullyLocked(lockType)}
                        type="checkbox"
                        id={createFormInputId(DOMAIN_FIELD_FORMAT + '_inherit' + type, domainIndex, index)}
                        name={createFormInputName(DOMAIN_FIELD_FORMAT + '_inherit' + type)}
                    />
                </div>
            </div>
            <div className="row">
                <div className="col-xs-3">
                    <div className="domain-field-label">
                        <DomainFieldLabel
                            label={'Format for ' + setting.settingName}
                            helpTipBody={getFolderDateTimeHelpBody(setting.isDate, setting.isTime)}
                        />
                    </div>
                </div>
                <div className="col-xs-9" />
            </div>
            <div className="row">
                {setting.isDate && (
                    <div className="col-xs-3">
                        <SelectInput
                            allowCreate
                            isValidNewOption={isValidAltDateTimeFormatOptions}
                            containerClass=""
                            inputClass="form-group"
                            id={createFormInputId(DOMAIN_FIELD_FORMAT + '_date' + type, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_FORMAT + '_date' + type)}
                            onChange={onDateFormatChange}
                            options={setting.dateOptions}
                            placeholder="Select a date format..."
                            value={setting.dateFormat}
                            required={true}
                            clearable={false}
                            disabled={isFieldFullyLocked(lockType) || setting.inherited}
                        />
                    </div>
                )}
                {setting.isTime && (
                    <div className="col-xs-3">
                        <SelectInput
                            allowCreate={setting.isTimeRequired}
                            isValidNewOption={setting.isTimeRequired ? isValidAltDateTimeFormatOptions : undefined}
                            containerClass=""
                            inputClass="form-group"
                            id={createFormInputId(DOMAIN_FIELD_FORMAT + '_time' + type, domainIndex, index)}
                            name={createFormInputName(DOMAIN_FIELD_FORMAT + '_time' + type)}
                            onChange={onTimeFormatChange}
                            options={setting.timeOptions}
                            placeholder="Select a time format..."
                            value={setting.timeFormat}
                            required={setting.isTimeRequired}
                            clearable={false}
                            disabled={isFieldFullyLocked(lockType) || setting.inherited}
                        />
                    </div>
                )}
                {setting.invalidWarning && (
                    <div className="col-xs-1">
                        <Tip caption={setting.invalidWarning}>
                            <span className="domain-warning-icon top-padding fa fa-exclamation-circle" />
                        </Tip>
                    </div>
                )}
            </div>
        </div>
    );
});

DateTimeFieldOptions.displayName = 'DateTimeFieldOptions';
