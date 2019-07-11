
import * as React from 'react'
import { Col, FormControl, Row } from "react-bootstrap";
import { createFormInputId } from "../actions/actions";
import {
    DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING,
    DOMAIN_FIELD_FORMAT
} from "../constants";
import {LabelHelpTip} from "@glass/base";

interface DateTimeFieldProps {
    index: number,
    label: string,
    format: string,
    excludeFromShifting: boolean,
    onChange: (string, any) => any
}

export class DateTimeFieldOptions extends React.PureComponent<DateTimeFieldProps, any> {


    onFieldChange = (evt) => {
        const { onChange } = this.props;

        let value = evt.target.value;

        if (evt.target.name === 'ExcludeFromShiftingOptions') {
            value = evt.target.checked;
        }

        if (onChange) {
            onChange(evt.target.id, value);
        }
    }

    getFormatHelpText = () => {
        return (
            <>
                To control how a date or time value is displayed, provide a string format compatible with the java data class SimpleDateFormat.
                <br/><br/>
                Learn more about using <a target='_blank' href='https://www.labkey.org/Documentation/wiki-page.view?name=dateFormats#date'>Date and Time formats</a> in LabKey.
            </>
        )
    }

    getDateShiftingText = () => {
        return (
            'Participant date columns with this property checked will not be shifted on export/publication when the "Shift Participant Dates" option is selected.'
        )
    }

    render() {
        const { index, label, format, excludeFromShifting } = this.props;

        return (
            <div>
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <div className={'domain-field-section-heading'}>{label}</div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={3}>
                        <div className={'domain-field-label'}>
                            Format for Dates
                            <LabelHelpTip
                                title='Format String'
                                body={this.getFormatHelpText} />
                        </div>
                    </Col>
                    <Col xs={3}>
                        <div className={'domain-field-label'}>
                            Participant Date Shifting
                            <LabelHelpTip
                                title='Participant Date Shifting'
                                body={this.getDateShiftingText} />
                        </div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={2}>
                        <FormControl type="text"
                                     value={format ? format : ''}
                                     onChange={this.onFieldChange}
                                     id={createFormInputId(DOMAIN_FIELD_FORMAT, index)}
                                     key={createFormInputId(DOMAIN_FIELD_FORMAT, index)}/>
                    </Col>
                    <Col xs={1}/>
                    <Col xs={9}>
                        <input type='checkbox'
                               name='ExcludeFromShiftingOptions'
                               className='domain-field-float-left domain-field-checkbox'
                               value='ExcludeFromShiftingOptions'
                               checked={excludeFromShifting}
                               onChange={this.onFieldChange}
                               id={createFormInputId(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, index)}
                               key={createFormInputId(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, index)}/>
                        <div className='domain-field-float-left domain-field-checkbox-label'>Do Not Shift Dates on Export or Publication</div>
                    </Col>
                </Row>
            </div>
        )
    }
}