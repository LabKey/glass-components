import React, { PureComponent, ReactNode, RefObject } from 'react';
import DatePicker, { ReactDatePickerProps } from 'react-datepicker';

export class DateInput extends PureComponent<ReactDatePickerProps> {
    // DatePicker is not a react-bootstrap component, form-control class is needed on className and wrapperClassName,
    // we also need to re-apply border radius via date-input class in fields.scss.
    static defaultProps = {
        autoComplete: 'off',
        className: 'form-control',
        // TODO: Support server-specified date formats.
        // DatePicker utilizes `date-fns` (https://date-fns.org/) for handling date formatting. Currently, LabKey
        // utilizes `moment` for handling date formats on the client and Java date formatting on the server. This
        // mix of different formats is problematic for providing consistent date formatting to users in all cases.
        dateFormat: 'MM/dd/yyyy', // different format than Moment.
        wrapperClassName: 'form-control',
        showTimeSelect: false,
    };

    input: RefObject<DatePicker>;

    constructor(props) {
        super(props);
        this.input = React.createRef();
    }

    onIconClick = (): void => {
        this.input.current?.setFocus();
    };

    onSelect = (date: Date, event: React.SyntheticEvent<any> | undefined): void => {
        // focus the input so an onBlur action gets triggered after selection has been made
        this.input.current?.setFocus();
        this.props.onSelect?.(date, event);
    };

    render(): ReactNode {
        return (
            <span className="input-group date-input">
                <DatePicker {...this.props} ref={this.input} onSelect={this.onSelect} />
                <span className="input-group-addon" onClick={this.onIconClick}>
                    <i className="fa fa-calendar" />
                </span>
            </span>
        );
    }
}
