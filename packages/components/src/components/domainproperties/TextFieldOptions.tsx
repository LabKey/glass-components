import React from 'react';
import { Col, FormControl, Row } from 'react-bootstrap';
import { createFormInputId, createFormInputName, getNameFromId } from './actions';
import { isFieldFullyLocked } from './propertiesUtil';
import classNames from 'classnames';
import { DOMAIN_FIELD_CUSTOM_LENGTH, DOMAIN_FIELD_MAX_LENGTH, DOMAIN_FIELD_SCALE, MAX_TEXT_LENGTH } from './constants';
import { ITypeDependentProps } from './models';
import { LabelHelpTip } from '../base/LabelHelpTip';
import { SectionHeading } from "./SectionHeading";

interface TextFieldProps extends ITypeDependentProps {
    scale: number
}

export interface TextFieldState {
    radio: string
}

export class TextFieldOptions extends React.PureComponent<TextFieldProps, TextFieldState> {

    constructor(props) {
        super(props);

        this.state = {
            radio: DOMAIN_FIELD_MAX_LENGTH
        };
    }

    componentDidMount(): void {
        this.setState({radio: (!this.props.scale || this.props.scale === MAX_TEXT_LENGTH
                ? DOMAIN_FIELD_MAX_LENGTH : DOMAIN_FIELD_CUSTOM_LENGTH)})
    }

    handleChange = (event: any) => {
        const { onChange, scale, domainIndex, index } = this.props;
        const target = event.target;

        // Initially set to handle custom character count
        let scaleId = target.id;
        let value = event.target.value;

        const fieldName = getNameFromId(target.id);

        // If handling radio button
        if (fieldName !== DOMAIN_FIELD_SCALE) {
            this.setState({radio: value});  // set local state
            scaleId = createFormInputId(DOMAIN_FIELD_SCALE, domainIndex, index);  // updating scale
            value = MAX_TEXT_LENGTH;  // set scale back to MAX_TEXT_LENGTH
        }
        else {
            value = parseInt(value);
        }

        if (isNaN(value) || value > MAX_TEXT_LENGTH) {
            value = MAX_TEXT_LENGTH;
        }

        if (onChange && value !== scale) {
            onChange(scaleId, value);
        }
    };

    getMaxCountHelpText = () => {
        return (
            <div>
                Sets the maximum character count for a text field.
            </div>
        )
    };

    render() {
        const { index, label, scale, lockType, domainIndex } = this.props;
        const { radio } = this.state;

        return (
            <div>
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <SectionHeading title={label}/>
                    </Col>
                </Row>
                <Row className='domain-row-expanded '>
                    <Col xs={12}>
                        <div className={'domain-field-label'}>
                            Maximum Text Length
                            <LabelHelpTip
                                title="Max Text Length"
                                body={this.getMaxCountHelpText}
                            />
                        </div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={12} className='domain-text-options-col'>
                        <FormControl type='radio'
                               className='domain-text-options-radio1 domain-field-float-left'
                               value={DOMAIN_FIELD_MAX_LENGTH}
                               checked={radio === DOMAIN_FIELD_MAX_LENGTH}
                               onChange={this.handleChange}
                               id={createFormInputId(DOMAIN_FIELD_MAX_LENGTH, domainIndex, index)}
                               disabled={isFieldFullyLocked(lockType)}
                        />
                        <div className={classNames({'domain-text-label': (radio !== DOMAIN_FIELD_MAX_LENGTH)})}>Unlimited</div>
                    </Col>
                </Row>
                <Row className='domain-row-expanded'>
                    <Col xs={12}>
                        <FormControl type='radio'
                               className='domain-text-options-radio2 domain-field-float-left'
                               value={DOMAIN_FIELD_CUSTOM_LENGTH}
                               checked={radio === DOMAIN_FIELD_CUSTOM_LENGTH}
                               onChange={this.handleChange}
                               id={createFormInputId(DOMAIN_FIELD_CUSTOM_LENGTH, domainIndex, index)}
                        />
                        <span className={classNames('domain-text-options-length domain-field-float-left', {'domain-text-label': (radio !== DOMAIN_FIELD_CUSTOM_LENGTH)})}>No longer than X characters</span>
                        <FormControl type="number"
                                     id={createFormInputId(DOMAIN_FIELD_SCALE, domainIndex, index)}
                                     name={createFormInputName(DOMAIN_FIELD_SCALE)}
                                     className='domain-text-length-field'
                                     value={typeof scale !== "undefined" && radio === DOMAIN_FIELD_CUSTOM_LENGTH ? scale : 4000}
                                     onChange={this.handleChange}
                                     disabled={isFieldFullyLocked(lockType) || radio === DOMAIN_FIELD_MAX_LENGTH}
                        />
                    </Col>
                </Row>
            </div>
        )
    }
}
