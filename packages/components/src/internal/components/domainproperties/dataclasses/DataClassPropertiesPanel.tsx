import React, { PureComponent, ReactNode } from 'react';

import { EntityDetailsForm } from '../entities/EntityDetailsForm';
import {
    DATA_CLASS_NAME_EXPRESSION_TOPIC,
    DATACLASS_ALIAS_TOPIC,
    DEFINE_DATA_CLASS_TOPIC,
    getHelpLink,
    HelpLink,
} from '../../../util/helpLinks';
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

import { QuerySelect } from '../../forms/QuerySelect';
import { SCHEMAS } from '../../../schemas';

import { DomainParentAliases } from '../DomainParentAliases';
import { IParentAlias, IParentOption } from '../../entities/models';

import { SectionHeading } from '../SectionHeading';

import { DataClassModel } from './models';

const PROPERTIES_HEADER_ID = 'dataclass-properties-hdr';
const FORM_IDS = {
    CATEGORY: ENTITY_FORM_ID_PREFIX + 'category',
    SAMPLE_TYPE_ID: ENTITY_FORM_ID_PREFIX + 'sampleSet',
};

interface OwnProps extends BasePropertiesPanelProps {
    allowParentAlias?: boolean;
    appPropertiesOnly?: boolean;
    dataClassAliasCaption?: string;
    headerText?: string;
    helpTopic?: string;
    model: DataClassModel;
    nameExpressionGenIdProps?: NameExpressionGenIdProps;
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    namePreviewsLoading?: boolean;
    nounPlural?: string;
    nounSingular?: string;
    onAddParentAlias: (id: string, newAlias: IParentAlias) => void;
    onChange: (model: DataClassModel) => void;
    onNameFieldHover?: () => any;
    onParentAliasChange: (id: string, field: string, newValue: any) => void;
    onRemoveParentAlias: (id: string) => void;
    parentAliasHelpText?: string;
    parentOptions: IParentOption[];
    previewName?: string;
    updateDupeParentAliases?: (id: string) => void;
    errorMsg?: string;
}

type Props = OwnProps & InjectedDomainPropertiesPanelCollapseProps;

interface State {
    isValid: boolean;
    loadingError: string;
    prefix: string;
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
        dataClassAliasCaption: 'Parent',
        parentAliasHelpText: "Column headings used during import to set a data's parentage.",
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
        this.onChange(id, value?.trimStart());
    };

    onChange = (id: string, value: any): void => {
        this.updateValidStatus(this.props.model.mutate({ [getFormNameFromId(id)]: value }));
    };

    renderAddEntityHelper = (noun?: string): any => {
        return (
            <>
                <p>Column headings used during import to set a {noun.toLowerCase()}'s parentage.</p>
                <p>
                    <HelpLink topic={DATACLASS_ALIAS_TOPIC}>More info</HelpLink>
                </p>
            </>
        );
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
            allowParentAlias,
            errorMsg,
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
                updateValidStatus={this.updateValidStatus}
                errorMsg={errorMsg}
                isValid={isValid && !errorMsg}
                warning={warning}
            >
                <div className="row margin-bottom">
                    {headerText && (
                        <div className="col-xs-9">
                            <div className="entity-form--headerhelp">{headerText}</div>
                        </div>
                    )}
                    <div className={`col-xs-${headerText ? 3 : 12}`}>
                        <HelpTopicURL helpTopic={helpTopic} nounPlural={nounPlural} />
                    </div>
                </div>
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
                    nameReadOnly={model.isBuiltIn}
                />
                {allowParentAlias && (
                    <>
                        <SectionHeading title="Lineage Settings" cls="top-padding bottom-padding" />
                        <DomainParentAliases
                            {...this.props}
                            parentAliases={model.parentAliases}
                            idPrefix="dataclass-parent-import-alias-"
                            schema={SCHEMAS.DATA_CLASSES.SCHEMA}
                            addEntityHelp={this.renderAddEntityHelper(nounSingular)}
                            includeSampleSet={false}
                            includeDataClass={true}
                            showAddBtn={true}
                        />
                    </>
                )}
                {!appPropertiesOnly && (
                    <div className="row">
                        <div className="col-xs-2">
                            <DomainFieldLabel label="Category" />
                        </div>
                        <div className="col-xs-10">
                            <QuerySelect
                                key={FORM_IDS.CATEGORY}
                                name={FORM_IDS.CATEGORY}
                                schemaQuery={SCHEMAS.EXP_TABLES.DATA_CLASS_CATEGORY_TYPE}
                                displayColumn="Value"
                                valueColumn="Value"
                                onQSChange={this.onChange}
                                value={model.category}
                                showLabel={false}
                            />
                        </div>
                    </div>
                )}
                {!appPropertiesOnly && (
                    <div className="row">
                        <div className="col-xs-2">
                            <DomainFieldLabel
                                label="Sample Type"
                                helpTipBody={`The default Sample Type where new samples will be created for this ${nounSingular.toLowerCase()}.`}
                            />
                        </div>
                        <div className="col-xs-10">
                            <QuerySelect
                                key={FORM_IDS.SAMPLE_TYPE_ID}
                                name={FORM_IDS.SAMPLE_TYPE_ID}
                                schemaQuery={SCHEMAS.EXP_TABLES.SAMPLE_SETS}
                                onQSChange={this.onChange}
                                value={model.sampleSet}
                                showLabel={false}
                            />
                        </div>
                    </div>
                )}
            </BasePropertiesPanel>
        );
    }
}

export const DataClassPropertiesPanel = withDomainPropertiesPanelCollapse<OwnProps>(DataClassPropertiesPanelImpl);
