import React from 'react';
import { Col,Panel, Row } from 'react-bootstrap';
import { EntityDetailsForm } from "../entities/EntityDetailsForm";
import { LabelOverlay } from "../../forms/LabelOverlay";
import { QuerySelect } from "../../forms/QuerySelect";
import { SCHEMAS } from "../../base/models/schemas";
import { Alert } from "../../base/Alert";
import { DEFINE_DATA_CLASS_TOPIC } from "../../../util/helpLinks";
import { DomainPanelStatus } from "../models";
import { getDomainAlertClasses, getDomainPanelClass, updateDomainPanelClassList } from "../actions";
import { CollapsiblePanelHeader } from "../CollapsiblePanelHeader";
import { ENTITY_FORM_ID_PREFIX } from "../entities/constants";
import { getFormNameFromId } from "../entities/actions";
import { DataClassModel } from "./models";
import { HelpTopicURL } from "../HelpTopicURL";
import { initQueryGridState } from "../../../global";
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse
} from "../DomainPropertiesPanelCollapse";
import { PROPERTIES_PANEL_ERROR_MSG } from "../constants";

const PROPERTIES_HEADER_ID = 'dataclass-properties-hdr';
const FORM_IDS = {
    CATEGORY: ENTITY_FORM_ID_PREFIX + 'category',
    SAMPLE_TYPE_ID: ENTITY_FORM_ID_PREFIX + 'sampleSet'
};

interface Props {
    nounSingular?: string
    nounPlural?: string
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
    headerText?: string

    model: DataClassModel
    onChange: (model: DataClassModel) => any
    appPropertiesOnly?: boolean
    validate?: boolean
    useTheme?: boolean
    panelStatus?: DomainPanelStatus
}

interface State {
    isValid: boolean
}

//Note: exporting this class for jest test case
export class DataClassPropertiesPanelImpl extends React.PureComponent<Props & InjectedDomainPropertiesPanelCollapseProps, State> {

    static defaultProps = {
        nounSingular: 'Data Class',
        nounPlural: 'Data Classes',
        appPropertiesOnly: false,
        validate: false
    };

    constructor(props) {
        super(props);
        initQueryGridState(); //needed for QuerySelect usage

        this.state = {
            isValid: true
        };
    }

    componentWillReceiveProps(nextProps: Readonly<Props>): void {
        const { validate } = this.props;
        if (nextProps.validate && validate !== nextProps.validate) {
            this.setIsValid();
        }
    }

    componentDidMount(): void {
        updateDomainPanelClassList(this.props.useTheme, undefined, PROPERTIES_HEADER_ID);
    }

    componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>, snapshot?: any): void {
        updateDomainPanelClassList(prevProps.useTheme, undefined, PROPERTIES_HEADER_ID);
    }

    setIsValid(newModel?: DataClassModel) {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;
        const isValid = updatedModel && updatedModel.hasValidProperties();
        this.setState(() => ({isValid}),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    onChange(updatedModel)
                }
            });
    }

    toggleLocalPanel = (evt: any): void => {
        const { togglePanel, collapsed } = this.props;
        this.setIsValid();
        togglePanel(evt, !collapsed)
    };

    onFormChange = (evt: any) => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.onChange(id, value);
    };

    onChange = (id: string, value: any) => {
        const { model } = this.props;
        const newModel = model.set(getFormNameFromId(id), value) as DataClassModel;
        this.setIsValid(newModel);
    };

    renderSampleTypeSelect() {
        const { model, nounSingular } = this.props;

        return (
            <Row>
                <Col xs={3}>
                    <LabelOverlay
                        label={'Sample Set'}
                        description={`The default Sample Set where new samples will be created for this ${nounSingular.toLowerCase()}.`}
                        canMouseOverTooltip={true}
                    />
                </Col>
                <Col xs={9}>
                    <QuerySelect
                        componentId={FORM_IDS.SAMPLE_TYPE_ID}
                        name={FORM_IDS.SAMPLE_TYPE_ID}
                        schemaQuery={SCHEMAS.EXP_TABLES.SAMPLE_SETS}
                        formsy={false}
                        showLabel={false}
                        preLoad={true}
                        loadOnChange={true}
                        onQSChange={this.onChange}
                        value={model.sampleSet}
                    />
                </Col>
            </Row>
        )
    }

    renderCategorySelect() {
        const { model } = this.props;

        return (
            <Row>
                <Col xs={3}>
                    Category
                </Col>
                <Col xs={9}>
                    <QuerySelect
                        componentId={FORM_IDS.CATEGORY}
                        name={FORM_IDS.CATEGORY}
                        schemaQuery={SCHEMAS.EXP_TABLES.DATA_CLASS_CATEGORY_TYPE}
                        displayColumn={'Value'}
                        valueColumn={'Value'}
                        formsy={false}
                        showLabel={false}
                        preLoad={true}
                        loadOnChange={true}
                        onQSChange={this.onChange}
                        value={model.category}
                    />
                </Col>
            </Row>
        )
    }

    render() {
        const { collapsed, collapsible, controlledCollapse, panelStatus, model, useTheme, headerText, appPropertiesOnly, nounSingular, nounPlural, nameExpressionInfoUrl, nameExpressionPlaceholder } = this.props;
        const { isValid } = this.state;

        return (
            <>
                <Panel
                    className={getDomainPanelClass(collapsed, true, useTheme)}
                    expanded={!collapsed}
                    onToggle={function(){}}
                >
                    <CollapsiblePanelHeader
                        id={PROPERTIES_HEADER_ID}
                        title={nounSingular + ' Properties'}
                        titlePrefix={model.name}
                        togglePanel={(evt: any) => this.toggleLocalPanel(evt)}
                        collapsed={collapsed}
                        collapsible={collapsible}
                        controlledCollapse={controlledCollapse}
                        panelStatus={panelStatus}
                        isValid={isValid}
                        iconHelpMsg={PROPERTIES_PANEL_ERROR_MSG}
                        useTheme={useTheme}
                    />
                    <Panel.Body collapsible={collapsible || controlledCollapse}>
                        <Row className={'margin-bottom'}>
                            {headerText &&
                                <Col xs={9}>
                                    <div className={'entity-form--headerhelp'}>{headerText}</div>
                                </Col>
                            }
                            <Col xs={headerText ? 3 : 12}>
                                <HelpTopicURL helpTopic={DEFINE_DATA_CLASS_TOPIC} nounPlural={nounPlural}/>
                            </Col>
                        </Row>
                        <EntityDetailsForm
                            noun={nounSingular}
                            onFormChange={this.onFormChange}
                            data={model}
                            nameExpressionInfoUrl={nameExpressionInfoUrl}
                            nameExpressionPlaceholder={nameExpressionPlaceholder}
                        />
                        {!appPropertiesOnly && this.renderCategorySelect()}
                        {!appPropertiesOnly && this.renderSampleTypeSelect()}
                    </Panel.Body>
                </Panel>
                {!isValid &&
                    <div
                        onClick={(evt: any) => this.toggleLocalPanel(evt)}
                        className={getDomainAlertClasses(collapsed, true, useTheme)}
                    >
                        <Alert bsStyle="danger">{PROPERTIES_PANEL_ERROR_MSG}</Alert>
                    </div>
                }
            </>
        )
    }
}

export const DataClassPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(DataClassPropertiesPanelImpl);
