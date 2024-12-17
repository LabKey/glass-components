import React, { FC, memo, useCallback, useMemo, useRef } from 'react';
import DatePicker, { DatePickerProps } from 'react-datepicker';

import { getDateFNSDateFormat, parseDateFNSTimeFormat } from '../util/Date';

import { Container } from './base/models/Container';

export interface DateInputProps {
    container?: Container;
}

export const DateInput: FC<DateInputProps & DatePickerProps> = memo(props => {
    const { container, dateFormat, onSelect, timeFormat, ...pickerProps } = props;
    const input = useRef<DatePicker>(undefined);
    const formats = useMemo(() => {
        const dateFormat_ = dateFormat ?? getDateFNSDateFormat(container);
        return {
            dateFormat: dateFormat_,
            timeFormat: timeFormat ?? parseDateFNSTimeFormat(dateFormat_ as string),
        };
    }, [container, dateFormat, timeFormat]);

    const onIconClick = useCallback(() => {
        input.current?.setFocus();
    }, []);

    const onSelect_ = useCallback(
        (date: Date, event?: React.MouseEvent<HTMLElement, MouseEvent> | React.KeyboardEvent<HTMLElement>) => {
            // focus the input so an onBlur action gets triggered after selection has been made
            input.current?.setFocus();
            onSelect?.(date, event);
        },
        [onSelect]
    );

    return (
        <span className="input-group date-input">
            <DatePicker
                autoComplete="off"
                className="form-control"
                wrapperClassName="form-control"
                showTimeSelect={false}
                {...pickerProps}
                dateFormat={formats.dateFormat}
                timeFormat={formats.timeFormat}
                ref={input}
                onSelect={onSelect_}
            />
            <span className="input-group-addon" onClick={onIconClick}>
                <i className="fa fa-calendar" />
            </span>
        </span>
    );
});

DateInput.displayName = 'DateInput';
