import React from 'react';
import { List } from 'immutable';
import { Button, Checkbox, Col, FormControl, Modal, Row } from 'react-bootstrap';
import { ActionURL } from '@labkey/api';

import { DATETIME_TYPE, DomainField, IFieldChange, PropDescType } from './models';
import { createFormInputId, createFormInputName, getCheckedValue, getNameFromId } from './actions';
import {
    DOMAIN_DEFAULT_TYPES,
    DOMAIN_EDITABLE_DEFAULT,
    DOMAIN_FIELD_DEFAULT_VALUE_TYPE,
    DOMAIN_FIELD_DIMENSION,
    DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING,
    DOMAIN_FIELD_HIDDEN,
    DOMAIN_FIELD_MEASURE,
    DOMAIN_FIELD_MVENABLED,
    DOMAIN_FIELD_PHI,
    DOMAIN_FIELD_RECOMMENDEDVARIABLE,
    DOMAIN_FIELD_SHOWNINDETAILSVIEW,
    DOMAIN_FIELD_SHOWNININSERTVIEW,
    DOMAIN_FIELD_SHOWNINUPDATESVIEW,
    DOMAIN_PHI_LEVELS,
} from './constants';
import { LabelHelpTip } from '../base/LabelHelpTip';

interface AdvancedSettingsProps {
    domainId?: number
    helpNoun: string
    defaultDefaultValueType: string
    defaultValueOptions: List<string>
    label: string
    index: number
    show: boolean
    maxPhiLevel: string
    field: DomainField
    onHide: () => any
    onApply: (any) => any
    showDefaultValueSettings: boolean
}

interface AdvancedSettingsState {
    hidden?: boolean
    shownInDetailsView?: boolean
    shownInInsertView?: boolean
    shownInUpdateView?: boolean
    defaultValueType?: string
    defaultDisplayValue?: string
    dimension?: boolean
    measure?: boolean
    mvEnabled?: boolean
    recommendedVariable?: boolean
    PHI?: string
    phiLevels?: List<any>
    excludeFromShifting?: boolean
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {

    constructor(props) {
        super(props);

        this.state = this.getInitialState(this.props.field, this.props.domainId, this.props.defaultDefaultValueType);
    }

    initializeState = () => {
        this.setState(this.getInitialState(this.props.field, this.props.domainId, this.props.defaultDefaultValueType));
    };

    getInitialState = (field: DomainField, domainId: number, defaultDefaultValueType: string) => {
        const { maxPhiLevel } = this.props;

        // Filter phi levels available
        const phiIndex = this.getPhiLevelIndex(maxPhiLevel);
        const phiLevels = DOMAIN_PHI_LEVELS.filter( (value, index) => {
            return index <= phiIndex;
        }) as List<any>;

        return ({
            hidden: field.hidden,
            shownInDetailsView: field.shownInDetailsView,
            shownInInsertView: field.shownInInsertView,
            shownInUpdateView: field.shownInUpdateView,
            defaultValueType: field.defaultValueType ? field.defaultValueType : (defaultDefaultValueType ? defaultDefaultValueType : DOMAIN_EDITABLE_DEFAULT),
            defaultDisplayValue: field.defaultDisplayValue || '[none]',
            dimension: field.dimension,
            measure: field.measure,
            mvEnabled: field.mvEnabled,
            recommendedVariable: field.recommendedVariable,
            excludeFromShifting: field.excludeFromShifting,
            PHI: field.PHI,
            phiLevels: phiLevels
        })
    };

    handleClose = () => {
        const { onHide } = this.props;

        onHide();
    };

    handleApply = () => {
        const { index, onApply, onHide } = this.props;

        if (onApply) {

            let changes = List<IFieldChange>().asMutable();

            // Iterate over state values and put into list of changes
            Object.keys(this.state).forEach(function (key, i) {
                if (key !== 'phiLevels') {
                    changes.push({id: createFormInputId(key, index), value: this.state[key]} as IFieldChange)
                }
            }, this);

            onApply(changes.asImmutable());
        }

        if (onHide) {
            onHide();
        }
    };

    handleCheckbox = (evt) => {
        let value = getCheckedValue(evt);
        let fieldName = getNameFromId(evt.target.id);

        // Show in default view
        if (fieldName === DOMAIN_FIELD_HIDDEN || fieldName === DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING) {
            value = !value;
        }

        this.setState({
            [fieldName]: value
        })
    };

    handleChange = (evt) => {
        let fieldName = getNameFromId(evt.target.id);

        this.setState({
            [fieldName]: evt.target.value
        })
    };

    hasValidDomainId(): boolean {
        const { domainId } = this.props;
        return !(domainId === undefined || domainId === null || domainId === 0);
    }

    handleSetDefaultValues = (evt) => {
        const { domainId, helpNoun } = this.props;

        if (!this.hasValidDomainId()) {
            alert("Must save " + helpNoun + " before you can set default values.")
        }
        else {
            let params = {
                domainId: domainId,
                returnUrl: window.location,
            };

            let controller = 'list';
            let action = 'setDefaultValuesList';
            if (ActionURL.getController() === 'assay') {
                controller = 'assay';
                action = 'setDefaultValuesAssay';
                params['providerName'] = ActionURL.getParameter('providerName');
            }

            window.location.href = ActionURL.buildURL(controller, action, LABKEY.container.path, params);
        }
    };

    getMeasureHelpText = () => {
        return(
            <div>
                <p>Indicates fields that contain data subject to charting and other analysis. These are typically numeric results.</p>
                <p>Learn more about using <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=chartTrouble">Measures and Dimensions</a> for analysis.</p>
            </div>
        )
    };

    getDimensionHelpText = () => {
        return(
            <div>
                <p>Indicates a field of non-numerical categories that can be included in a chart. Dimensions define logical groupings of measures.</p>
                <p>Learn more about using <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=chartTrouble">Measures and Dimensions</a> for analysis.</p>
            </div>
        )
    };

    getMissingValueHelpText = () => {
        return(
            <div>
                <p>Fields using this can hold special values to indicate data that has failed review or was originally missing. Administrators can set custom Missing Value indicators at the site and folder levels.</p>
                <p>Learn more about using <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=manageMissing">Missing Value Indicators</a></p>
            </div>
        )
    };

    getRecommendedVariableHelpText = () => {
        return(
            <div>
                Indicates that this is an important variable. These variables will be displayed as recommended when creating new charts or reports.
            </div>
        )
    };

    getPhiHelpText = () => {
        return(
            <div>
                <p>Sets Protected Health Information (PHI) level for this field. This is a premium LabKey feature.</p>
                <p>Learn more about <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=compliancePHI">PHI Compliance</a> in LabKey.</p>
            </div>
        )
    };

    getDefaultTypeHelpText = () => {
        return(
            <div>
                <p>Editable default: Provides the same default value for every user, which allows editing.</p>
                <p>Fixed value: Provides fixed data with each inserted data row that cannot be edited.</p>
                <p>Last entered: An editable default value is provided on first use. The last value entered will be provided on later imports.</p>
                <p>Learn more about using <a target='_blank' href="https://www.labkey.org/Documentation/wiki-page.view?name=propertyFields#advanced">Default Type</a> settings.</p>
            </div>
        )
    };

    getExcludeFromDateShiftingText = () => {
        return (
            'Participant date fields with this property checked will not be shifted on export/publication when the "Shift Participant Dates" option is selected.'
        )
    };

    getPhiLevelIndex = (phi: string): number => {
        return DOMAIN_PHI_LEVELS.findIndex((level) => {
            return level.value === phi;
        });
    };

    showDefaultValues = () => {
        const { field, showDefaultValueSettings } = this.props;

        // some domains just don't support default values
        if (!showDefaultValueSettings)
            return false;

        // Not shown for file types
        if (field.dataType.isFileType())
            return false;

        return !this.props.defaultValueOptions.isEmpty();
    };

    renderDisplayOptions = () => {
        const { hidden, shownInDetailsView, shownInInsertView, shownInUpdateView } = this.state;
        const { index } = this.props;

        return (
            <>
                <div className='domain-adv-display-options'>Display Options</div>
                <div>These options configure how and in which views this field will be visible.</div>
                <Checkbox checked={hidden === false} onChange={this.handleCheckbox}
                          name={createFormInputName(DOMAIN_FIELD_HIDDEN)}
                          id={createFormInputId(DOMAIN_FIELD_HIDDEN, index)}>
                    Show field on default view of the grid
                </Checkbox>
                <Checkbox checked={shownInUpdateView === true} onChange={this.handleCheckbox}
                          name={createFormInputName(DOMAIN_FIELD_SHOWNINUPDATESVIEW)}
                          id={createFormInputId(DOMAIN_FIELD_SHOWNINUPDATESVIEW, index)}>
                    Show on update form when updating a single row of data
                </Checkbox>
                <Checkbox checked={shownInInsertView === true} onChange={this.handleCheckbox}
                          name={createFormInputName(DOMAIN_FIELD_SHOWNININSERTVIEW)}
                          id={createFormInputId(DOMAIN_FIELD_SHOWNININSERTVIEW, index)}>
                    Show on insert form when updating a single row of data
                </Checkbox>
                <Checkbox checked={shownInDetailsView === true} onChange={this.handleCheckbox}
                          name={createFormInputName(DOMAIN_FIELD_SHOWNINDETAILSVIEW)}
                          id={createFormInputId(DOMAIN_FIELD_SHOWNINDETAILSVIEW, index)}>
                    Show on details page for a single row
                </Checkbox>
            </>
        )
    };

    renderDefaultValues = () => {
        const { index, defaultValueOptions } = this.props;
        const { defaultValueType, defaultDisplayValue } = this.state;

        return (
            <>
                <div className='domain-adv-misc-options'>Default Value Options</div>
                <Row className='domain-adv-thick-row'>
                    <Col xs={3}>
                                <span>Default Type<LabelHelpTip title='Default Type'
                                                                body={this.getDefaultTypeHelpText}/></span>
                    </Col>
                    <Col xs={6}>
                        <FormControl
                            componentClass="select"
                            name={createFormInputName(DOMAIN_FIELD_DEFAULT_VALUE_TYPE)}
                            id={createFormInputId(DOMAIN_FIELD_DEFAULT_VALUE_TYPE, index)}
                            onChange={this.handleChange}
                            value={defaultValueType}
                        >
                            {
                                defaultValueOptions.map((level, i) => (
                                    <option key={i} value={level}>{DOMAIN_DEFAULT_TYPES[level]}</option>
                                ))
                            }
                        </FormControl>
                    </Col>
                    <Col xs={3}/>
                </Row>
                <Row>
                    <Col xs={3}>
                        <span>Default Value</span>
                    </Col>
                    <Col xs={9}>
                        <span>{defaultDisplayValue !== undefined && defaultDisplayValue !== null ? defaultDisplayValue : ''}</span>
                        <a style={{marginLeft: '20px'}} onClick={this.handleSetDefaultValues} className='domain-adv-link'>Set Default Values</a>
                    </Col>
                </Row>
            </>
        )

    };

    renderMiscOptions = () => {
        const { index, field } = this.props;
        const { measure, dimension, mvEnabled, recommendedVariable, PHI, excludeFromShifting, phiLevels } = this.state;

        return (
            <>
                <div className='domain-adv-misc-options'>Miscellaneous Options</div>
                <Row>
                    <Col xs={3}>
                        <span>PHI Level<LabelHelpTip title='PHI Level' body={this.getPhiHelpText}/></span>
                    </Col>
                    <Col xs={6}>
                        <FormControl
                            componentClass="select"
                            name={createFormInputName(DOMAIN_FIELD_PHI)}
                            id={createFormInputId(DOMAIN_FIELD_PHI, index)}
                            onChange={this.handleChange}
                            value={PHI}
                        >
                            {
                                phiLevels.map((level, i) => (
                                    <option key={i} value={level.value}>{level.label}</option>
                                ))
                            }
                        </FormControl>
                    </Col>
                    <Col xs={3}/>
                </Row>
                {field.dataType === DATETIME_TYPE &&
                    <Checkbox
                            checked={excludeFromShifting === false}
                            onChange={this.handleCheckbox}
                            name={createFormInputName(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING)}
                            id={createFormInputId(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, index)}
                    >
                        Exclude from "Participant Date Shifting" on export/publication
                        <LabelHelpTip title='Exclude from Date Shifting' body={this.getExcludeFromDateShiftingText}/>
                    </Checkbox>
                }
                {PropDescType.isMeasure(field.dataType.rangeURI) &&
                    <Checkbox
                            checked={measure === true}
                            onChange={this.handleCheckbox}
                            name={createFormInputName(DOMAIN_FIELD_MEASURE)}
                            id={createFormInputId(DOMAIN_FIELD_MEASURE, index)}
                    >
                        Make this field available as a measure
                        <LabelHelpTip title='Measure' body={this.getMeasureHelpText}/>
                    </Checkbox>
                }
                {PropDescType.isDimension(field.dataType.rangeURI) &&
                    <Checkbox
                            checked={dimension === true}
                            onChange={this.handleCheckbox}
                            name={createFormInputName(DOMAIN_FIELD_DIMENSION)}
                            id={createFormInputId(DOMAIN_FIELD_DIMENSION, index)}
                    >
                        Make this field available as a dimension
                        <LabelHelpTip title='Data Dimension' body={this.getDimensionHelpText}/>
                    </Checkbox>
                }
                <Checkbox
                    checked={recommendedVariable === true}
                    onChange={this.handleCheckbox}
                    name={createFormInputName(DOMAIN_FIELD_RECOMMENDEDVARIABLE)}
                    id={createFormInputId(DOMAIN_FIELD_RECOMMENDEDVARIABLE, index)}
                >
                    Make this field a recommended variable
                    <LabelHelpTip title='Recommended Variable' body={this.getRecommendedVariableHelpText}/>
                </Checkbox>

                {PropDescType.isMvEnableable(field.dataType.rangeURI) &&
                    <Checkbox
                            checked={mvEnabled === true}
                            onChange={this.handleCheckbox}
                            name={createFormInputName(DOMAIN_FIELD_MVENABLED)}
                            id={createFormInputId(DOMAIN_FIELD_MVENABLED, index)}
                    >
                        Track reason for missing data values
                        <LabelHelpTip title='Missing Value Indicators' body={this.getMissingValueHelpText}/>
                    </Checkbox>
                }
            </>
        )
    };

    render() {
        const { show, label } = this.props;

        return (
            <Modal show={show}
                   onHide={this.handleClose}
                   onEnter={this.initializeState}
            >
                <Modal.Header closeButton>
                    <Modal.Title>{'Advanced Settings and Properties' + (label ? (' for ' + label) : '')}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <div className='domain-modal'>
                        {this.renderDisplayOptions()}
                        {this.showDefaultValues() && this.renderDefaultValues()}
                        {this.renderMiscOptions()}
                    </div>
                </Modal.Body>
                <Modal.Footer>
                    <Button onClick={this.handleClose} bsClass='btn'
                            className='domain-adv-footer domain-adv-cancel-btn'>
                        Cancel
                    </Button>
                    <a target='_blank'
                       href="https://www.labkey.org/Documentation/wiki-page.view?name=fieldEditor#advanced"
                       className='domain-adv-footer domain-adv-link'>Get help with field designer settings</a>
                    <Button onClick={this.handleApply} bsClass='btn btn-success'
                            className='domain-adv-footer domain-adv-apply-btn'>
                        Apply
                    </Button>
                </Modal.Footer>
            </Modal>
        )
    }
}
