import React, { PureComponent, ReactNode } from 'react';
import { Col, Row } from 'react-bootstrap';

import { EntityDetailsForm } from '../entities/EntityDetailsForm';
import { QuerySelect, SCHEMAS } from '../../../..';
import { DEFINE_DATA_CLASS_TOPIC, DATA_CLASS_NAME_EXPRESSION_TOPIC, getHelpLink } from '../../../util/helpLinks';
import { ENTITY_FORM_ID_PREFIX } from '../entities/constants';
import { getFormNameFromId } from '../entities/actions';

import { HelpTopicURL } from '../HelpTopicURL';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import { DomainFieldLabel } from '../DomainFieldLabel';

import { loadNameExpressionOptions } from '../../settings/actions';

import { PREFIX_SUBSTITUTION_EXPRESSION, PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG } from '../constants';

import { isSampleManagerEnabled } from '../../../app/utils';

import { NameExpressionGenIdProps } from '../NameExpressionGenIdBanner';

import { DataClassModel } from './models';

const PROPERTIES_HEADER_ID = 'dataclass-properties-hdr';
const FORM_IDS = {
    CATEGORY: ENTITY_FORM_ID_PREFIX + 'category',
    SAMPLE_TYPE_ID: ENTITY_FORM_ID_PREFIX + 'sampleSet',
};

interface OwnProps extends BasePropertiesPanelProps {
    model: DataClassModel;
    onChange: (model: DataClassModel) => void;
    appPropertiesOnly?: boolean;
    headerText?: string;
    helpTopic?: string;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    nounSingular?: string;
    nounPlural?: string;
    previewName?: string;
    onNameFieldHover?: () => any;
    namePreviewsLoading?: boolean;
    nameExpressionGenIdProps?: NameExpressionGenIdProps;
}

type Props = OwnProps & InjectedDomainPropertiesPanelCollapseProps;

interface State {
    isValid: boolean;
    prefix: string;
    loadingError: string;
}

// Note: exporting this class for jest test case
export class DataClassPropertiesPanelImpl extends PureComponent<Props, State> {
    static defaultProps = {
        nounSingular: 'Data Class',
        nounPlural: 'Data Classes',
        helpTopic: DEFINE_DATA_CLASS_TOPIC,
        nameExpressionInfoUrl: getHelpLink(DATA_CLASS_NAME_EXPRESSION_TOPIC),
        nameExpressionPlaceholder: 'Enter a naming pattern (e.g., DC-${now:date}-${genId})',
        appPropertiesOnly: false,
    };

    state: Readonly<State> = { isValid: true, prefix: undefined, loadingError: undefined };

    componentDidMount = async (): Promise<void> => {
        const { model } = this.props;

        if (isSampleManagerEnabled()) {
            try {
                const response = await loadNameExpressionOptions(model.containerPath);
                this.setState({ prefix: response.prefix ?? null });
            } catch (error) {
                this.setState({ loadingError: 'There was a problem retrieving the Naming Pattern prefix.' });
            }
        }
    };

    updateValidStatus = (newModel?: DataClassModel): void => {
        const { model, onChange } = this.props;
        const updatedModel = newModel || model;

        this.setState(
            () => ({ isValid: !!updatedModel?.hasValidProperties }),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    onChange(updatedModel);
                }
            }
        );
    };

    onFormChange = (evt: any): void => {
        const { id, value } = evt.target;
        this.onChange(id, value);
    };

    onChange = (id: string, value: any): void => {
        this.updateValidStatus(this.props.model.mutate({ [getFormNameFromId(id)]: value }));
    };

    render(): ReactNode {
        const {
            model,
            headerText,
            appPropertiesOnly,
            nounSingular,
            nounPlural,
            nameExpressionInfoUrl,
            nameExpressionPlaceholder,
            helpTopic,
            namePreviewsLoading,
            previewName,
            onNameFieldHover,
            nameExpressionGenIdProps,
        } = this.props;
        const { isValid, prefix, loadingError } = this.state;

        let warning;
        if (
            prefix &&
            !model.isNew &&
            model.nameExpression &&
            !model.nameExpression.includes(PREFIX_SUBSTITUTION_EXPRESSION)
        ) {
            warning = `${PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG}: "${prefix}".`;
        } else if (loadingError !== undefined) {
            warning = loadingError;
        }

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title={nounSingular + ' Properties'}
                titlePrefix={model.name}
                updateValidStatus={this.updateValidStatus}
                isValid={isValid}
                warning={warning}
            >
                <Row className="margin-bottom">
                    {headerText && (
                        <Col xs={9}>
                            <div className="entity-form--headerhelp">{headerText}</div>
                        </Col>
                    )}
                    <Col xs={headerText ? 3 : 12}>
                        <HelpTopicURL helpTopic={helpTopic} nounPlural={nounPlural} />
                    </Col>
                </Row>
                <EntityDetailsForm
                    noun={nounSingular}
                    onFormChange={this.onFormChange}
                    data={model.entityDataMap}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    warning={warning}
                    showPreviewName={!!model.nameExpression}
                    namePreviewsLoading={namePreviewsLoading}
                    previewName={previewName}
                    onNameFieldHover={onNameFieldHover}
                    nameExpressionGenIdProps={nameExpressionGenIdProps}
                />
                {!appPropertiesOnly && (
                    <Row>
                        <Col xs={2}>
                            <DomainFieldLabel label="Category" />
                        </Col>
                        <Col xs={10}>
                            <QuerySelect
                                componentId={FORM_IDS.CATEGORY}
                                name={FORM_IDS.CATEGORY}
                                schemaQuery={SCHEMAS.EXP_TABLES.DATA_CLASS_CATEGORY_TYPE}
                                displayColumn="Value"
                                valueColumn="Value"
                                onQSChange={this.onChange}
                                value={model.category}
                                showLabel={false}
                            />
                        </Col>
                    </Row>
                )}
                {!appPropertiesOnly && (
                    <Row>
                        <Col xs={2}>
                            <DomainFieldLabel
                                label="Sample Type"
                                helpTipBody={`The default Sample Type where new samples will be created for this ${nounSingular.toLowerCase()}.`}
                            />
                        </Col>
                        <Col xs={10}>
                            <QuerySelect
                                componentId={FORM_IDS.SAMPLE_TYPE_ID}
                                name={FORM_IDS.SAMPLE_TYPE_ID}
                                schemaQuery={SCHEMAS.EXP_TABLES.SAMPLE_SETS}
                                onQSChange={this.onChange}
                                value={model.sampleSet}
                                showLabel={false}
                            />
                        </Col>
                    </Row>
                )}
            </BasePropertiesPanel>
        );
    }
}

export const DataClassPropertiesPanel = withDomainPropertiesPanelCollapse<OwnProps>(DataClassPropertiesPanelImpl);
