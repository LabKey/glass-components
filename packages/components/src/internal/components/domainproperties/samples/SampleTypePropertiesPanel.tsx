import React, { FC, memo, PureComponent } from 'react';
import { List } from 'immutable';
import classNames from 'classnames';
import { Filter, Query } from '@labkey/api';

import { getFormNameFromId } from '../entities/actions';
import { EntityDetailsForm } from '../entities/EntityDetailsForm';

import { PARENT_ALIAS_HELPER_TEXT, SAMPLE_SET_DISPLAY_TEXT } from '../../../constants';
import {
    DEFINE_SAMPLE_TYPE_TOPIC,
    DERIVE_SAMPLES_ALIAS_TOPIC,
    getHelpLink,
    HelpLink,
    UNIQUE_IDS_TOPIC,
} from '../../../util/helpLinks';
import {
    InjectedDomainPropertiesPanelCollapseProps,
    withDomainPropertiesPanelCollapse,
} from '../DomainPropertiesPanelCollapse';
import { BasePropertiesPanel, BasePropertiesPanelProps } from '../BasePropertiesPanel';
import { HelpTopicURL } from '../HelpTopicURL';

import { DomainFieldLabel } from '../DomainFieldLabel';
import { SectionHeading } from '../SectionHeading';

import { ENTITY_FORM_IDS } from '../entities/constants';

import { AutoLinkToStudyDropdown } from '../AutoLinkToStudyDropdown';

import { getCurrentProductName, isCommunityDistribution, isSampleManagerEnabled } from '../../../app/utils';

import { PREFIX_SUBSTITUTION_EXPRESSION, PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG } from '../constants';

import { NameExpressionPreview } from '../NameExpressionPreview';

import { NameExpressionGenIdProps } from '../NameExpressionGenIdBanner';

import { SCHEMAS } from '../../../schemas';
import { IParentAlias, IParentOption } from '../../entities/models';
import { Container } from '../../base/models/Container';
import { IDomainField } from '../models';
import { ColorPickerInput } from '../../forms/input/ColorPickerInput';
import { SelectInput, SelectInputOption } from '../../forms/input/SelectInput';

import { dataClassOptionFilterFn, DomainParentAliases } from '../DomainParentAliases';

import { ComponentsAPIWrapper, getDefaultAPIWrapper } from '../../../APIWrapper';

import { UniqueIdBanner } from './UniqueIdBanner';
import { AliquotNamePatternProps, DEFAULT_ALIQUOT_NAMING_PATTERN, MetricUnitProps, SampleTypeModel } from './models';

const PROPERTIES_HEADER_ID = 'sample-type-properties-hdr';
const ALIQUOT_HELP_LINK = getHelpLink('aliquotIDs');
const ALIQUOT_NAME_PLACEHOLDER = 'Enter a naming pattern for aliquots (e.g., ' + DEFAULT_ALIQUOT_NAMING_PATTERN + ')';

const AddEntityHelpTip: FC<{ parentageLabel?: string }> = memo(({ parentageLabel }) => {
    const msg = parentageLabel
        ? PARENT_ALIAS_HELPER_TEXT.replace(/parent(age)?/g, parentageLabel)
        : PARENT_ALIAS_HELPER_TEXT;
    return (
        <>
            <p>{msg}</p>
            <p>
                <HelpLink topic={DERIVE_SAMPLES_ALIAS_TOPIC}>More info</HelpLink>
            </p>
        </>
    );
});

const AutoLinkDataToStudyHelpTip: FC = () => (
    <>
        <p>
            Automatically link Sample Type data rows to the specified target study. Only rows that include subject and
            visit/date information will be linked.
        </p>
        <p>
            The user performing the import must have insert permission in the target study and the corresponding
            dataset.
        </p>
    </>
);

const LinkedDatasetCategoryHelpTip: FC = () => (
    <>
        <p>
            Specify the desired category for the Sample Type Dataset that will be created (or appended to) in the target
            study when rows are linked. If the category you specify does not exist, it will be created.
        </p>
        <p>
            If the Sample Type Dataset already exists, this setting will not overwrite a previously assigned category.
            Leave blank to use the default category of "Uncategorized".
        </p>
    </>
);

const UniqueIdHelpTip: FC = () => (
    <>
        <p>Use a Unique ID field to represent barcodes or other ID fields in use in your lab.</p>
        <p>
            Learn more about using <HelpLink topic={UNIQUE_IDS_TOPIC}>barcodes and unique IDs</HelpLink> in{' '}
            {getCurrentProductName()}.
        </p>
    </>
);

// Splitting these out to clarify where they end-up
interface OwnProps {
    errorMsg?: string;
    aliquotNamePatternProps?: AliquotNamePatternProps;
    api?: ComponentsAPIWrapper;
    appPropertiesOnly?: boolean;
    dataClassAliasCaption?: string;
    dataClassParentageLabel?: string;
    dataClassTypeCaption?: string;
    headerText?: string;
    helpTopic?: string;
    includeDataClasses?: boolean;
    metricUnitProps?: MetricUnitProps;
    model: SampleTypeModel;
    nameExpressionGenIdProps?: NameExpressionGenIdProps;
    namePreviews?: string[];
    namePreviewsLoading?: boolean;
    onAddParentAlias: (id: string, newAlias: IParentAlias) => void;
    onAddUniqueIdField: (fieldConfig: Partial<IDomainField>) => void;
    onNameFieldHover?: () => void;
    onParentAliasChange: (id: string, field: string, newValue: any) => void;
    onRemoveParentAlias: (id: string) => void;
    parentAliasHelpText?: string;
    parentOptions: IParentOption[];
    sampleAliasCaption?: string;
    sampleTypeCaption?: string;
    showLinkToStudy?: boolean;
    updateDupeParentAliases?: (id: string) => void;
    updateModel: (newModel: SampleTypeModel) => void;
    useSeparateDataClassesAliasMenu?: boolean;
}

// Splitting these out to clarify where they end-up
interface EntityProps {
    nameExpressionInfoUrl?: string;
    nameExpressionPlaceholder?: string;
    nounPlural?: string;
    nounSingular?: string;
}

interface State {
    containers: Container[];
    isValid: boolean;
    loadingError: string;
    prefix: string;
    sampleTypeCategory: string;
}

type Props = OwnProps & EntityProps & BasePropertiesPanelProps;

class SampleTypePropertiesPanelImpl extends PureComponent<Props & InjectedDomainPropertiesPanelCollapseProps, State> {
    static defaultProps = {
        api: getDefaultAPIWrapper(),
        nounSingular: SAMPLE_SET_DISPLAY_TEXT,
        nounPlural: SAMPLE_SET_DISPLAY_TEXT + 's',
        nameExpressionInfoUrl: getHelpLink('sampleIDs'),
        // eslint-disable-next-line no-template-curly-in-string
        nameExpressionPlaceholder: 'Enter a naming pattern (e.g., S-${now:date}-${dailySampleCount})',
        appPropertiesOnly: false,
        showLinkToStudy: true,
        helpTopic: DEFINE_SAMPLE_TYPE_TOPIC,
        sampleAliasCaption: 'Sample',
        sampleTypeCaption: 'Sample Type',
        dataClassAliasCaption: 'Data Class',
        dataClassTypeCaption: 'Data Class',
        dataClassParentageLabel: 'data class',
        metricUnitProps: {
            metricUnitLabel: 'Metric Unit',
            metricUnitHelpMsg: 'The unit of measurement used for the sample type.',
        },
        parentAliasHelpText: PARENT_ALIAS_HELPER_TEXT,
    };

    state: Readonly<State> = {
        containers: undefined,
        isValid: true,
        loadingError: undefined,
        prefix: undefined,
        sampleTypeCategory: undefined,
    };

    componentDidMount = async (): Promise<void> => {
        const { api, model } = this.props;

        try {
            const result = await api.query.selectRows({
                columns: ['Category'],
                containerFilter: Query.ContainerFilter.currentPlusProjectAndShared,
                filterArray: [Filter.create('RowId', model.rowId)],
                schemaQuery: SCHEMAS.EXP_TABLES.SAMPLE_SETS,
            });
            this.setState({ sampleTypeCategory: result.rows[0]?.Category.value });
        } catch (e) {
            this.setState({ loadingError: 'There was a problem retrieving the Sample Type category.' });
        }

        try {
            const containers = await api.domain.getValidPublishTargets(model.containerPath);
            this.setState({ containers });
        } catch (e) {
            this.setState({ containers: [] });
        }

        if (isSampleManagerEnabled()) {
            try {
                const response = await api.entity.loadNameExpressionOptions(model.containerPath);
                this.setState({ prefix: response.prefix ?? null });
            } catch (error) {
                this.setState({ loadingError: 'There was a problem retrieving the Naming Pattern prefix.' });
            }
        }
    };

    updateValidStatus = (newModel?: SampleTypeModel): void => {
        const { model, updateModel, metricUnitProps } = this.props;

        const updatedModel = newModel || model;
        const isValid =
            updatedModel?.hasValidProperties() && updatedModel?.isMetricUnitValid(metricUnitProps?.metricUnitRequired);

        this.setState(
            () => ({ isValid }),
            () => {
                // Issue 39918: only consider the model changed if there is a newModel param
                if (newModel) {
                    updateModel(updatedModel);
                }
            }
        );
    };

    onFormChange = (evt: any): void => {
        const id = evt.target.id;
        const value = evt.target.value;
        this.onFieldChange(getFormNameFromId(id), value?.trimStart());
    };

    onFieldChange = (key: string, value: any): void => {
        this.updateValidStatus(this.props.model.set(key, value) as SampleTypeModel);
    };

    onNameFieldHover = (): void => {
        this.props.onNameFieldHover?.();
    };

    containsDataClassOptions(): boolean {
        return this.props.parentOptions?.filter(dataClassOptionFilterFn).length > 0;
    }

    render() {
        const {
            model,
            onAddUniqueIdField,
            parentOptions,
            nameExpressionInfoUrl,
            nameExpressionPlaceholder,
            aliquotNamePatternProps,
            nounSingular,
            nounPlural,
            headerText,
            helpTopic,
            includeDataClasses,
            useSeparateDataClassesAliasMenu,
            dataClassParentageLabel,
            appPropertiesOnly,
            showLinkToStudy,
            metricUnitProps,
            namePreviews,
            namePreviewsLoading,
            nameExpressionGenIdProps,
            errorMsg
        } = this.props;
        const { isValid, containers, prefix, loadingError, sampleTypeCategory } = this.state;

        const showAliquotNameExpression = aliquotNamePatternProps?.showAliquotNameExpression;
        const aliquotNameExpressionInfoUrl = aliquotNamePatternProps?.aliquotNameExpressionInfoUrl;
        const aliquotNameExpressionPlaceholder = aliquotNamePatternProps?.aliquotNameExpressionPlaceholder;

        const includeMetricUnitProperty = metricUnitProps?.includeMetricUnitProperty;
        const metricUnitLabel = metricUnitProps?.metricUnitLabel || 'Metric Unit';
        const metricUnitHelpMsg =
            metricUnitProps?.metricUnitHelpMsg || 'The unit of measurement used for the sample type.';
        const metricUnitRequired = !!metricUnitProps?.metricUnitRequired;
        const allowTimepointProperties = model.domain.get('allowTimepointProperties');

        // Issue 48776: Suppress import parent aliasing for media Mixture Batches
        const showAddParentAlias =
            !!parentOptions &&
            (model.name !== SCHEMAS.SAMPLE_SETS.MIXTURE_BATCHES.queryName || sampleTypeCategory !== 'media');
        const showDataClass = includeDataClasses && useSeparateDataClassesAliasMenu && this.containsDataClassOptions();

        let warning: string;
        if (
            prefix &&
            !model.isNew() &&
            model.nameExpression &&
            !model.nameExpression.includes(PREFIX_SUBSTITUTION_EXPRESSION)
        ) {
            warning = `${PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG}: "${prefix}".`;
        } else if (
            prefix &&
            showAliquotNameExpression &&
            model.aliquotNameExpression &&
            !model.aliquotNameExpression.includes(PREFIX_SUBSTITUTION_EXPRESSION)
        ) {
            warning = `Aliquot ${PROPERTIES_PANEL_NAMING_PATTERN_WARNING_MSG}: "${prefix}".`;
        } else if (loadingError !== undefined) {
            warning = loadingError;
        }

        return (
            <BasePropertiesPanel
                {...this.props}
                headerId={PROPERTIES_HEADER_ID}
                title="Sample Type Properties"
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
                {appPropertiesOnly && <SectionHeading title="General Properties" />}
                <EntityDetailsForm
                    noun={nounSingular}
                    onFormChange={this.onFormChange}
                    data={model}
                    nameReadOnly={model.nameReadOnly}
                    nameExpressionInfoUrl={nameExpressionInfoUrl}
                    nameExpressionPlaceholder={nameExpressionPlaceholder}
                    warning={warning}
                    showPreviewName={!!model.nameExpression}
                    onNameFieldHover={this.onNameFieldHover}
                    namePreviewsLoading={namePreviewsLoading}
                    previewName={namePreviews?.[0]}
                    nameExpressionGenIdProps={nameExpressionGenIdProps}
                />
                {showAliquotNameExpression && (
                    <div className="row margin-bottom">
                        <div className="col-xs-2">
                            <div onMouseEnter={this.onNameFieldHover}>
                                <DomainFieldLabel
                                    label="Aliquot Naming Pattern"
                                    helpTipBody={
                                        <>
                                            <p>Pattern used for generating unique Ids for Aliquots.</p>
                                            <p>
                                                By default, the name of the aliquot will use the name of its parent
                                                followed by a dash and a counter for that parent's aliquots.
                                            </p>
                                            <p>
                                                For example, if the original sample is S1, aliquots of that sample will
                                                be named S1-1, S1-2, etc.
                                            </p>
                                            {model.aliquotNameExpression && (
                                                <NameExpressionPreview
                                                    previewName={namePreviews?.[1]}
                                                    isPreviewLoading={namePreviewsLoading}
                                                />
                                            )}
                                            <p>
                                                <a
                                                    target="_blank"
                                                    href={aliquotNameExpressionInfoUrl ?? ALIQUOT_HELP_LINK}
                                                    rel="noopener noreferrer"
                                                >
                                                    More info
                                                </a>
                                            </p>
                                        </>
                                    }
                                />
                            </div>
                        </div>
                        <div className="col-xs-10">
                            <input
                                className={classNames('form-control', {
                                    'naming-pattern-border-warning': warning?.startsWith('Aliquot'),
                                })}
                                name="aliquotNameExpression"
                                type="text"
                                placeholder={aliquotNameExpressionPlaceholder ?? ALIQUOT_NAME_PLACEHOLDER}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    this.onFieldChange(e.target.name, e.target.value);
                                }}
                                value={model.aliquotNameExpression}
                            />
                        </div>
                    </div>
                )}
                {showAddParentAlias && (
                    <>
                        <SectionHeading title="Lineage Settings" cls="top-padding bottom-padding" />
                        <DomainParentAliases
                            {...this.props}
                            parentAliases={model.parentAliases}
                            idPrefix="sampletype-parent-import-alias-"
                            schema={SCHEMAS.SAMPLE_SETS.SCHEMA}
                            addEntityHelp={<AddEntityHelpTip />}
                            includeSampleSet
                            includeDataClass={includeDataClasses && !useSeparateDataClassesAliasMenu}
                            showAddBtn={showAddParentAlias}
                            hideRequiredCheck={!appPropertiesOnly}
                        />
                    </>
                )}
                {showDataClass && (
                    <DomainParentAliases
                        {...this.props}
                        parentAliases={model.parentAliases}
                        idPrefix="sampletype-parent-import-alias-"
                        schema={SCHEMAS.DATA_CLASSES.SCHEMA}
                        addEntityHelp={<AddEntityHelpTip parentageLabel={dataClassParentageLabel} />}
                        includeSampleSet={false}
                        includeDataClass
                        showAddBtn
                    />
                )}
                {allowTimepointProperties && showLinkToStudy && (
                    <>
                        <div className="row margin-top">
                            <div className="col-xs-2">
                                <DomainFieldLabel
                                    label="Auto-Link Data to Study"
                                    helpTipBody={<AutoLinkDataToStudyHelpTip />}
                                />
                            </div>
                            <div className="col-xs-5">
                                <AutoLinkToStudyDropdown
                                    containers={containers}
                                    onChange={this.onFormChange}
                                    autoLinkTarget={ENTITY_FORM_IDS.AUTO_LINK_TARGET}
                                    value={model.autoLinkTargetContainerId}
                                />
                            </div>
                        </div>
                        <div className="row margin-top">
                            <div className="col-xs-2">
                                <DomainFieldLabel
                                    label="Linked Dataset Category"
                                    helpTipBody={<LinkedDatasetCategoryHelpTip />}
                                />
                            </div>

                            <div className="col-xs-5">
                                <input
                                    className="form-control"
                                    type="text"
                                    id={ENTITY_FORM_IDS.AUTO_LINK_CATEGORY}
                                    onChange={this.onFormChange}
                                    value={model.autoLinkCategory || ''}
                                />
                            </div>
                        </div>
                    </>
                )}

                {(appPropertiesOnly || !isCommunityDistribution()) && (
                    <SectionHeading cls="top-padding" title="Storage Settings" />
                )}
                {appPropertiesOnly && (
                    <>
                        <div className="row margin-top">
                            <div className="col-xs-2">
                                <DomainFieldLabel
                                    label="Label Color"
                                    helpTipBody="The label color will be used to distinguish this sample type in various views in the application."
                                />
                            </div>
                            <div className="col-xs-10">
                                <ColorPickerInput
                                    name="labelColor"
                                    value={model.labelColor}
                                    onChange={this.onFieldChange}
                                    allowRemove
                                />
                            </div>
                        </div>
                        {includeMetricUnitProperty && (
                            <div className="row margin-top">
                                <div className="col-xs-2">
                                    <DomainFieldLabel
                                        label={metricUnitLabel}
                                        required={metricUnitRequired}
                                        helpTipBody={metricUnitHelpMsg}
                                    />
                                </div>
                                <div className="col-xs-3">
                                    {metricUnitProps?.metricUnitOptions ? (
                                        <SelectInput
                                            containerClass="sampleset-metric-unit-select-container"
                                            inputClass="sampleset-metric-unit-select"
                                            name="metricUnit"
                                            options={metricUnitProps.metricUnitOptions}
                                            required={metricUnitRequired}
                                            clearable={!metricUnitRequired}
                                            onChange={(name, formValue, option: SelectInputOption) => {
                                                this.onFieldChange(
                                                    name,
                                                    formValue === undefined && option ? option.id : formValue
                                                );
                                            }}
                                            placeholder="Select a unit..."
                                            value={model.metricUnit}
                                        />
                                    ) : (
                                        <input
                                            className="form-control"
                                            name="metricUnit"
                                            type="text"
                                            placeholder="Enter a unit"
                                            required={metricUnitRequired}
                                            value={model.metricUnit}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                this.onFieldChange(e.target.name, e.target.value);
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </>
                )}
                {!isCommunityDistribution() && (
                    <div className="row margin-top">
                        <div className="col-xs-2">
                            <DomainFieldLabel label="Barcodes" helpTipBody={<UniqueIdHelpTip />} />
                        </div>
                        <div className="col-xs-10">
                            <UniqueIdBanner model={model} isFieldsPanel={false} onAddField={onAddUniqueIdField} />
                        </div>
                    </div>
                )}
            </BasePropertiesPanel>
        );
    }
}

export const SampleTypePropertiesPanel = withDomainPropertiesPanelCollapse<Props>(SampleTypePropertiesPanelImpl);
