import React from 'react';
import { Col, Row } from 'react-bootstrap';
import { EntityDetailsForm } from "../entities/EntityDetailsForm";
import { QuerySelect } from "../../forms/QuerySelect";
import { SCHEMAS } from "../../base/models/schemas";
import { DEFINE_DATA_CLASS_TOPIC } from "../../../util/helpLinks";
import { ENTITY_FORM_ID_PREFIX } from "../entities/constants";
import { getFormNameFromId } from "../entities/actions";
import { DataClassModel } from "./models";
import { HelpTopicURL } from "../HelpTopicURL";
import { initQueryGridState } from "../../../global";
import { InjectedDomainPropertiesPanelCollapseProps, withDomainPropertiesPanelCollapse } from "../DomainPropertiesPanelCollapse";
import { BasePropertiesPanel, BasePropertiesPanelProps } from "../BasePropertiesPanel";
import { DomainFieldLabel } from "../DomainFieldLabel";

const PROPERTIES_HEADER_ID = 'dataclass-properties-hdr';
const FORM_IDS = {
    CATEGORY: ENTITY_FORM_ID_PREFIX + 'category',
    SAMPLE_TYPE_ID: ENTITY_FORM_ID_PREFIX + 'sampleSet'
};

interface OwnProps {
    model: DataClassModel
    onChange: (model: DataClassModel) => any
    appPropertiesOnly?: boolean
    headerText?: string
    nameExpressionInfoUrl?: string
    nameExpressionPlaceholder?: string
    nounSingular?: string
    nounPlural?: string
}

type Props = OwnProps & BasePropertiesPanelProps;

interface State {
    isValid: boolean
}

//Note: exporting this class for jest test case
export class DataClassPropertiesPanelImpl extends React.PureComponent<Props & InjectedDomainPropertiesPanelCollapseProps, State> {

    static defaultProps = {
        nounSingular: 'Data Class',
        nounPlural: 'Data Classes',
        appPropertiesOnly: false
    };

    constructor(props: Props & InjectedDomainPropertiesPanelCollapseProps) {
        super(props);
        initQueryGridState(); //needed for QuerySelect usage

        this.state = {
            isValid: true
        };
    }

    updateValidStatus = (newModel?: DataClassModel) => {
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
    };

    onFormChange = (evt: any) => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.onChange(id, value);
    };

    onChange = (id: string, value: any) => {
        const { model } = this.props;
        const newModel = model.set(getFormNameFromId(id), value) as DataClassModel;
        this.updateValidStatus(newModel);
    };

    renderSampleTypeSelect() {
        const { model, nounSingular } = this.props;

        return (
            <Row>
                <Col xs={2}>
                    <DomainFieldLabel
                        label={'Sample Set'}
                        helpTipBody={() => `The default Sample Set where new samples will be created for this ${nounSingular.toLowerCase()}.`}
                    />
                </Col>
                <Col xs={10}>
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
                <Col xs={2}>
                    <DomainFieldLabel
                        label={'Category'}
                    />
                </Col>
                <Col xs={10}>
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
        const { model, headerText, appPropertiesOnly, nounSingular, nounPlural, nameExpressionInfoUrl, nameExpressionPlaceholder } = this.props;
        const { isValid } = this.state;

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title={nounSingular + ' Properties'}
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
            >
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
            </BasePropertiesPanel>
        )
    }
}

export const DataClassPropertiesPanel = withDomainPropertiesPanelCollapse<Props>(DataClassPropertiesPanelImpl);
