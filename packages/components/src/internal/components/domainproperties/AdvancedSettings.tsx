import React from 'react';
import { List } from 'immutable';
import { ActionURL } from '@labkey/api';

import { Modal } from '../../Modal';
import { getSubmitButtonClass } from '../../app/utils';

import {
    ADVANCED_FIELD_EDITOR_TOPIC,
    CHART_MEASURES_AND_DIMENSIONS_TOPIC,
    HelpLink,
    MISSING_VALUES_TOPIC,
    PROPERTY_FIELDS_PHI_TOPIC,
} from '../../util/helpLinks';

import { LabelHelpTip } from '../base/LabelHelpTip';

import { CheckboxLK } from '../../Checkbox';

import { DomainField, IDomainFormDisplayOptions, IFieldChange } from './models';
import { DATETIME_TYPE, PropDescType } from './PropDescType';
import { getCheckedValue } from './actions';
import { createFormInputId, createFormInputName, getNameFromId } from './utils';
import {
    DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
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
    DOMAIN_FIELD_UNIQUECONSTRAINT,
    DOMAIN_PHI_LEVELS,
} from './constants';

import { DomainFieldLabel } from './DomainFieldLabel';

interface AdvancedSettingsProps {
    allowUniqueConstraintProperties: boolean;
    defaultDefaultValueType: string;
    defaultValueOptions: List<string>;
    domainFormDisplayOptions?: IDomainFormDisplayOptions;
    domainId?: number;
    domainIndex: number;
    field: DomainField;
    helpNoun: string;
    index: number;
    label: string;
    maxPhiLevel: string;
    onApply: (any) => any;
    onHide: () => any;
    phiLevelDisabled: boolean;
    phiLevelDisabledReason: string;
    showDefaultValueSettings: boolean;
}

interface AdvancedSettingsState {
    PHI?: string;
    defaultDisplayValue?: string;
    defaultValueType?: string;
    dimension?: boolean;
    excludeFromShifting?: boolean;
    hidden?: boolean;
    measure?: boolean;
    mvEnabled?: boolean;
    phiLevels?: Array<{ label: string; value: string; }>;
    recommendedVariable?: boolean;
    shownInDetailsView?: boolean;
    shownInInsertView?: boolean;
    shownInUpdateView?: boolean;
    uniqueConstraint?: boolean;
}

export class AdvancedSettings extends React.PureComponent<AdvancedSettingsProps, AdvancedSettingsState> {
    static defaultProps = {
        domainFormDisplayOptions: DEFAULT_DOMAIN_FORM_DISPLAY_OPTIONS,
    };

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
        const phiLevels = DOMAIN_PHI_LEVELS.filter((value, index) => {
            return index <= phiIndex;
        });

        return {
            hidden: field.hidden,
            shownInDetailsView: field.shownInDetailsView,
            shownInInsertView: field.shownInInsertView,
            shownInUpdateView: field.shownInUpdateView,
            defaultValueType: field.defaultValueType
                ? field.defaultValueType
                : defaultDefaultValueType
                  ? defaultDefaultValueType
                  : DOMAIN_EDITABLE_DEFAULT,
            defaultDisplayValue: field.defaultDisplayValue || '[none]',
            dimension: field.dimension,
            measure: field.measure,
            mvEnabled: field.mvEnabled,
            recommendedVariable: field.recommendedVariable,
            excludeFromShifting: field.excludeFromShifting,
            uniqueConstraint: field.uniqueConstraint,
            PHI: field.PHI,
            phiLevels,
        };
    };

    componentDidMount() {
        this.initializeState();
    }

    handleClose = () => {
        const { onHide } = this.props;

        onHide();
    };

    handleApply = () => {
        const { index, onApply, onHide, domainIndex } = this.props;

        if (onApply) {
            const changes = List<IFieldChange>().asMutable();

            // Iterate over state values and put into list of changes
            Object.keys(this.state).forEach(function (key, i) {
                if (key !== 'phiLevels') {
                    changes.push({
                        id: createFormInputId(key, domainIndex, index),
                        value: this.state[key],
                    } as IFieldChange);
                }
            }, this);

            onApply(changes.asImmutable());
        }

        if (onHide) {
            onHide();
        }
    };

    handleCheckbox = evt => {
        let value = getCheckedValue(evt);
        const fieldName = getNameFromId(evt.target.id);

        // Show in default view
        if (fieldName === DOMAIN_FIELD_HIDDEN) {
            value = !value;
        }

        this.setState({
            [fieldName]: value,
        });
    };

    handleChange = evt => {
        const fieldName = getNameFromId(evt.target.id);

        this.setState({
            [fieldName]: evt.target.value,
        });
    };

    hasValidDomainId(): boolean {
        const { domainId } = this.props;
        return !(domainId === undefined || domainId === null || domainId === 0);
    }

    handleSetDefaultValues = evt => {
        const { domainId, helpNoun } = this.props;

        if (!this.hasValidDomainId()) {
            alert('Must save ' + helpNoun + ' before you can set default values.');
        } else {
            const params = {
                domainId,
                returnUrl: window.location,
            };

            let controller = 'list';
            let action = 'setDefaultValuesList';
            if (ActionURL.getController() === 'assay') {
                controller = 'assay';
                action = 'setDefaultValuesAssay';
                params['providerName'] = ActionURL.getParameter('providerName');
            }

            window.location.href = ActionURL.buildURL(controller, action, undefined, params);
        }
    };

    getPhiHelpText = () => {
        return (
            <div>
                <p>Sets Protected Health Information (PHI) level for this field.</p>
                <p>
                    Learn more about <HelpLink topic={PROPERTY_FIELDS_PHI_TOPIC}>protecting PHI</HelpLink> in LabKey.
                </p>
            </div>
        );
    };

    getDefaultTypeHelpText = () => {
        return (
            <div>
                <p>Editable default: Provides the same default value for every user, which allows editing.</p>
                <p>Fixed value: Provides fixed data with each inserted data row that cannot be edited.</p>
                <p>
                    Last entered: An editable default value is provided on first use. The last value entered will be
                    provided on later imports.
                </p>
                <p>
                    Learn more about using <HelpLink topic={ADVANCED_FIELD_EDITOR_TOPIC}>Default Type</HelpLink>{' '}
                    settings.
                </p>
            </div>
        );
    };

    getPhiLevelIndex = (phi: string): number => {
        return DOMAIN_PHI_LEVELS.findIndex(level => {
            return level.value === phi;
        });
    };

    showDefaultValues = () => {
        const { field, showDefaultValueSettings } = this.props;

        // some domains just don't support default values
        if (!showDefaultValueSettings) return false;

        // Not shown for file types or calculated fields
        if (field.dataType.isFileType() || field.isCalculatedField()) return false;

        return !this.props.defaultValueOptions.isEmpty();
    };

    renderDisplayOptions = () => {
        const { hidden, shownInDetailsView, shownInInsertView, shownInUpdateView } = this.state;
        const { index, domainIndex, field } = this.props;

        return (
            <>
                <div className="domain-adv-display-options">Display Options</div>
                <div>These options configure how and in which views this field will be visible.</div>
                <CheckboxLK
                    checked={hidden === false}
                    onChange={this.handleCheckbox}
                    name={createFormInputName(DOMAIN_FIELD_HIDDEN)}
                    id={createFormInputId(DOMAIN_FIELD_HIDDEN, domainIndex, index)}
                >
                    Show field on default view of the grid
                </CheckboxLK>
                {!field.isCalculatedField() && (
                    <>
                        <CheckboxLK
                            checked={shownInUpdateView === true}
                            onChange={this.handleCheckbox}
                            name={createFormInputName(DOMAIN_FIELD_SHOWNINUPDATESVIEW)}
                            id={createFormInputId(DOMAIN_FIELD_SHOWNINUPDATESVIEW, domainIndex, index)}
                        >
                            Show on update form when updating a single row of data
                        </CheckboxLK>
                        <CheckboxLK
                            checked={shownInInsertView === true}
                            onChange={this.handleCheckbox}
                            name={createFormInputName(DOMAIN_FIELD_SHOWNININSERTVIEW)}
                            id={createFormInputId(DOMAIN_FIELD_SHOWNININSERTVIEW, domainIndex, index)}
                        >
                            Show on insert form when updating a single row of data
                        </CheckboxLK>
                    </>
                )}
                <CheckboxLK
                    checked={shownInDetailsView === true}
                    onChange={this.handleCheckbox}
                    name={createFormInputName(DOMAIN_FIELD_SHOWNINDETAILSVIEW)}
                    id={createFormInputId(DOMAIN_FIELD_SHOWNINDETAILSVIEW, domainIndex, index)}
                >
                    Show on details page for a single row
                </CheckboxLK>
            </>
        );
    };

    renderDefaultValues = () => {
        const { index, defaultValueOptions, domainIndex } = this.props;
        const { defaultValueType, defaultDisplayValue } = this.state;

        return (
            <>
                <div className="domain-adv-misc-options">Default Value Options</div>
                <div className="row domain-adv-thick-row">
                    <div className="col-xs-3">
                        <DomainFieldLabel label="Default Type" helpTipBody={this.getDefaultTypeHelpText()} />
                    </div>
                    <div className="col-xs-6">
                        <select
                            className="form-control"
                            name={createFormInputName(DOMAIN_FIELD_DEFAULT_VALUE_TYPE)}
                            id={createFormInputId(DOMAIN_FIELD_DEFAULT_VALUE_TYPE, domainIndex, index)}
                            onChange={this.handleChange}
                            value={defaultValueType}
                        >
                            {defaultValueOptions.map(level => (
                                <option key={level} value={level}>
                                    {DOMAIN_DEFAULT_TYPES[level]}
                                </option>
                            )).toArray()}
                        </select>
                    </div>
                    <div className="col-xs-3" />
                </div>
                <div className="row">
                    <div className="col-xs-3">
                        <span>Default Value</span>
                    </div>
                    <div className="col-xs-9">
                        <span>
                            {defaultDisplayValue !== undefined && defaultDisplayValue !== null
                                ? defaultDisplayValue
                                : ''}
                        </span>
                        <a
                            style={{ marginLeft: '20px' }}
                            onClick={this.handleSetDefaultValues}
                            className="domain-adv-link"
                        >
                            Set Default Values
                        </a>
                    </div>
                </div>
            </>
        );
    };

    renderMiscOptions = () => {
        const {
            index,
            field,
            domainIndex,
            domainFormDisplayOptions,
            allowUniqueConstraintProperties,
            phiLevelDisabled,
            phiLevelDisabledReason,
        } = this.props;
        const {
            measure,
            dimension,
            mvEnabled,
            recommendedVariable,
            uniqueConstraint,
            PHI,
            excludeFromShifting,
            phiLevels,
        } = this.state;
        const currentValueExists = phiLevels?.find(level => level.value === PHI) !== undefined;
        const disablePhiSelect =
            phiLevelDisabled || field.disablePhiLevel || (PHI !== undefined && !currentValueExists);

        return (
            <>
                <div className="domain-adv-misc-options">Miscellaneous Options</div>
                {!field.isCalculatedField() && (
                    <div className="row">
                        <div className="col-xs-3">
                            <DomainFieldLabel label="PHI Level" helpTipBody={phiLevelDisabled ? phiLevelDisabledReason : this.getPhiHelpText()} />
                        </div>
                        <div className="col-xs-6">
                            <select
                                className="form-control"
                                name={createFormInputName(DOMAIN_FIELD_PHI)}
                                id={createFormInputId(DOMAIN_FIELD_PHI, domainIndex, index)}
                                onChange={this.handleChange}
                                value={PHI}
                                disabled={disablePhiSelect}
                            >
                                {!currentValueExists && (
                                    <option key={PHI} value={PHI}>
                                        {DOMAIN_PHI_LEVELS.find(level => level.value === PHI)?.label ?? PHI}
                                    </option>
                                )}
                                {phiLevels.map(level => (
                                    <option key={level.value} value={level.value}>
                                        {level.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="col-xs-3" />
                    </div>
                )}
                {field.dataType === DATETIME_TYPE && (
                    <CheckboxLK
                        checked={excludeFromShifting}
                        onChange={this.handleCheckbox}
                        name={createFormInputName(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING)}
                        id={createFormInputId(DOMAIN_FIELD_EXCLUDE_FROM_SHIFTING, domainIndex, index)}
                    >
                        Exclude from "Participant Date Shifting" on export/publication
                        <LabelHelpTip title="Exclude from Date Shifting">
                            Participant date fields with this property checked will not be shifted on export/publication
                            when the "Shift Participant Dates" option is selected.
                        </LabelHelpTip>
                    </CheckboxLK>
                )}
                {PropDescType.isMeasure(field.dataType.rangeURI) && (
                    <CheckboxLK
                        checked={measure}
                        onChange={this.handleCheckbox}
                        name={createFormInputName(DOMAIN_FIELD_MEASURE)}
                        id={createFormInputId(DOMAIN_FIELD_MEASURE, domainIndex, index)}
                    >
                        Make this field available as a measure
                        <LabelHelpTip title="Measure">
                            <div>
                                <p>
                                    Indicates fields that contain data subject to charting and other analysis. These are
                                    typically numeric results.
                                </p>
                                <p>
                                    Learn more about using{' '}
                                    <HelpLink topic={CHART_MEASURES_AND_DIMENSIONS_TOPIC}>
                                        Measures and Dimensions
                                    </HelpLink>{' '}
                                    for analysis.
                                </p>
                            </div>
                        </LabelHelpTip>
                    </CheckboxLK>
                )}
                {PropDescType.isDimension(field.dataType.rangeURI) && (
                    <CheckboxLK
                        checked={dimension}
                        onChange={this.handleCheckbox}
                        name={createFormInputName(DOMAIN_FIELD_DIMENSION)}
                        id={createFormInputId(DOMAIN_FIELD_DIMENSION, domainIndex, index)}
                    >
                        Make this field available as a dimension
                        <LabelHelpTip title="Data Dimension">
                            <div>
                                <p>
                                    Indicates a field of non-numerical categories that can be included in a chart.
                                    Dimensions define logical groupings of measures.
                                </p>
                                <p>
                                    Learn more about using{' '}
                                    <HelpLink topic={CHART_MEASURES_AND_DIMENSIONS_TOPIC}>
                                        Measures and Dimensions
                                    </HelpLink>{' '}
                                    for analysis.
                                </p>
                            </div>
                        </LabelHelpTip>
                    </CheckboxLK>
                )}
                <CheckboxLK
                    checked={recommendedVariable}
                    onChange={this.handleCheckbox}
                    name={createFormInputName(DOMAIN_FIELD_RECOMMENDEDVARIABLE)}
                    id={createFormInputId(DOMAIN_FIELD_RECOMMENDEDVARIABLE, domainIndex, index)}
                >
                    Make this field a recommended variable
                    <LabelHelpTip title="Recommended Variable">
                        <div>
                            Indicates that this is an important variable. These variables will be displayed as
                            recommended when creating new charts or reports.
                        </div>
                    </LabelHelpTip>
                </CheckboxLK>
                {PropDescType.isMvEnableable(field.dataType.rangeURI) && !field.isCalculatedField() && (
                    <CheckboxLK
                        checked={mvEnabled}
                        onChange={this.handleCheckbox}
                        name={createFormInputName(DOMAIN_FIELD_MVENABLED)}
                        id={createFormInputId(DOMAIN_FIELD_MVENABLED, domainIndex, index)}
                        disabled={domainFormDisplayOptions.disableMvEnabled}
                    >
                        Track reason for missing data values
                        <LabelHelpTip title="Missing Value Indicators">
                            <div>
                                <p>
                                    Fields using this can hold special values to indicate data that has failed review or
                                    was originally missing. Administrators can set custom Missing Value indicators at
                                    the site and folder levels.
                                </p>
                                <p>
                                    Learn more about using{' '}
                                    <HelpLink topic={MISSING_VALUES_TOPIC}>Missing Value Indicators</HelpLink>
                                </p>
                            </div>
                        </LabelHelpTip>
                    </CheckboxLK>
                )}
                {allowUniqueConstraintProperties && !field.isCalculatedField() && (
                    <CheckboxLK
                        checked={uniqueConstraint || field.isPrimaryKey}
                        disabled={field.isPrimaryKey}
                        onChange={this.handleCheckbox}
                        name={createFormInputName(DOMAIN_FIELD_UNIQUECONSTRAINT)}
                        id={createFormInputId(DOMAIN_FIELD_UNIQUECONSTRAINT, domainIndex, index)}
                    >
                        Require all values to be unique
                        <LabelHelpTip title="Unique Constraint">
                            <div>Add a unique constraint via a database-level index for this field.</div>
                        </LabelHelpTip>
                    </CheckboxLK>
                )}
            </>
        );
    };

    render() {
        const { label } = this.props;
        const title = 'Advanced Settings and Properties' + (label ? ' for ' + label : '');
        const footer = (
            <>
                <button
                    className="domain-adv-footer domain-adv-cancel-btn btn btn-default"
                    onClick={this.handleClose}
                    type="button"
                >
                    Cancel
                </button>
                <HelpLink topic={ADVANCED_FIELD_EDITOR_TOPIC} className="domain-adv-footer domain-adv-link">
                    Get help with field designer settings
                </HelpLink>
                <button
                    className={`domain-adv-footer domain-adv-apply-btn btn btn-${getSubmitButtonClass()}`}
                    onClick={this.handleApply}
                    type="button"
                >
                    Apply
                </button>
            </>
        );

        return (
            <Modal footer={footer} onCancel={this.handleClose} title={title}>
                <div className="domain-modal">
                    {this.renderDisplayOptions()}
                    {this.showDefaultValues() && this.renderDefaultValues()}
                    {this.renderMiscOptions()}
                </div>
            </Modal>
        );
    }
}
