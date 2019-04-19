import * as React from "react";
import {
    Row,
    Col,
    FormControl,
    Checkbox, OverlayTrigger, TooltipProps, Tooltip
} from "react-bootstrap";
import {
    DOMAIN_FIELD_ADV,
    DOMAIN_FIELD_DETAILS,
    DOMAIN_FIELD_NAME,
    DOMAIN_FIELD_PREFIX,
    DOMAIN_FIELD_REQ,
    DOMAIN_FIELD_TYPE,
    PropDescTypes
} from "../constants";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core'
import { faPencilAlt } from '@fortawesome/free-solid-svg-icons';
import {DomainField} from "../models";

library.add(faPencilAlt);

interface IDomainRowDisplay {
    field: DomainField,
    onChange: (any) => any
}

interface IDomainRow {
    name: string
}

/**
 * React component for one property in a domain
 */
export class DomainRow extends React.Component<IDomainRowDisplay, IDomainRow>
{

    constructor(props: IDomainRowDisplay, state: IDomainRow)
    {
        super(props, state);

        this.generateToolTip = this.generateToolTip.bind(this);
        this.getDetails = this.getDetails.bind(this);
        this.getDataType = this.getDataType.bind(this);
    }

    /**
     *  Performance update to prevent unnecessary renders of domain rows on any state update
     */
    shouldComponentUpdate(nextProps: Readonly<IDomainRowDisplay>, nextState: Readonly<IDomainRow>, nextContext: any): boolean
    {
        // Check first if this optimization is being used. See actions.updateDomainField for example where this is set.
        if (typeof nextProps.field.renderUpdate !== "undefined") {
            return nextProps.field.renderUpdate
        }
        else return true;  // Not optimizing, just updating every time
    }

    generateToolTip(tooltip: string, id: number): React.ReactElement<TooltipProps>
    {
        return <Tooltip id={id.toString()}>{tooltip}</Tooltip>;
    }

    /**
     *  Details section of property row
     */
    getDetails()
    {
        let details = '';

        // Hack for now to display primary key. Waiting for api update
        // if (this.props.field.name === 'Key') {
        //     details += 'Primary Key, Locked';
        // }

        if (this.props.field.newField)
        {
            if (details.length > 0)
                details += ', ';

            details += 'New Field';
        }

        if (this.props.field.updatedField && !this.props.field.newField)
        {
            if (details.length > 0)
                details += ', ';

            details += 'Updated';
        }

        return details;
    }

    /**
     * Gets display datatype from rangeURI, conceptURI and lookup values
     */
    getDataType()
    {
        const types = PropDescTypes.filter((value) => {

            // handle matching rangeURI and conceptURI
            if (value.rangeURI === this.props.field.rangeURI)
            {
                if (!this.props.field.lookupQuery &&
                    ((!value.conceptURI && !this.props.field.conceptURI) || (value.conceptURI === this.props.field.conceptURI)))
                {
                    return true;
                }
            }
            // handle selected lookup option
            else if (value.name === 'lookup' && this.props.field.lookupQuery && this.props.field.lookupQuery !== 'users')
            {
                return true;
            }
            // handle selected users option
            else if (value.name === 'users' && this.props.field.lookupQuery && this.props.field.lookupQuery === 'users')
            {
                return true;
            }

            return false;
        });

        // If found return name
        if (types.size > 0)
        {
            return types.get(0).name;
        }

        return null;
    }

    render()
    {
        const {field, onChange} = this.props;

        return (

            <Row className='domain-field-row' key={DOMAIN_FIELD_PREFIX + "-" + field.propertyId}>
                <Col xs={3}>
                    <OverlayTrigger overlay={this.generateToolTip('Name', field.propertyId)} placement="top">
                        <FormControl id={DOMAIN_FIELD_PREFIX + DOMAIN_FIELD_NAME + "-" + field.propertyId} type="text"
                                     value={field.name} onChange={onChange}/>
                    </OverlayTrigger>
                </Col>
                <Col xs={2}>
                    <OverlayTrigger overlay={this.generateToolTip('Data Type', field.propertyId)} placement="top">
                        <select id={DOMAIN_FIELD_PREFIX + DOMAIN_FIELD_TYPE + "-" + field.propertyId}
                                className={'form-control'} onChange={onChange} value={this.getDataType()}>
                            {
                                PropDescTypes.map(function (type) {
                                    if (type.display)
                                    {
                                        return <option
                                            key={DOMAIN_FIELD_PREFIX + DOMAIN_FIELD_TYPE + 'option-' + type.name + '-' + field.propertyId}
                                            value={type.name}>{type.display}</option>
                                    }
                                    return ''
                                })
                            }
                        </select>
                    </OverlayTrigger>
                </Col>
                <Col xs={1}>

                    <div className='domain-field-checkbox'>
                        <OverlayTrigger overlay={this.generateToolTip('Required?', field.propertyId)} placement="top">
                            <Checkbox className='domain-field-checkbox'
                                      id={DOMAIN_FIELD_PREFIX + DOMAIN_FIELD_REQ + "-" + field.propertyId}
                                      checked={field.required} onChange={onChange}/>
                        </OverlayTrigger>
                    </div>
                </Col>
                <Col xs={5}>
                <span id={DOMAIN_FIELD_PREFIX + DOMAIN_FIELD_DETAILS + "-" + field.propertyId} className='domain-field-details'>
                    {this.getDetails()}
                </span>
                </Col>
                <Col xs={1}>
                    <OverlayTrigger overlay={this.generateToolTip('Advanced Settings', field.propertyId)}
                                    placement="top">
                        <div className='domain-field-advanced-icon pull-right' id={DOMAIN_FIELD_PREFIX + DOMAIN_FIELD_ADV + "-" + field.propertyId}>
                            <FontAwesomeIcon icon={faPencilAlt}/>
                        </div>
                    </OverlayTrigger>
                </Col>
            </Row>
        );
    }
}

