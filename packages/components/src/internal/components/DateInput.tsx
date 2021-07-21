import React, { PureComponent, ReactNode, RefObject } from 'react';
import DatePicker, { ReactDatePickerProps } from 'react-datepicker';

export class DateInput extends PureComponent<ReactDatePickerProps> {
    // DatePicker is not a react-bootstrap component, form-control class is needed on className and wrapperClassName,
    // we also need to re-apply border radius via date-input class in fields.scss.
    static defaultProps = {
        autoComplete: 'off',
        className: 'form-control',
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

    render(): ReactNode {
        return (
            <span className="input-group date-input">
                <DatePicker {...this.props} ref={this.input} />
                <span className="input-group-addon" onClick={this.onIconClick}>
                    <i className="fa fa-calendar" />
                </span>
            </span>
        );
    }
}
